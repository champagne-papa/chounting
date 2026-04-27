// src/agent/orchestrator/index.ts
// Phase 1.2 Session 5 — the Double Entry Agent orchestrator.
// Master brief §5.1 signatures, §5.2 main loop.
//
// Main-loop steps (master §5.2):
//   1. loadOrCreateSession
//   2. orgContextManager.load       — loadOrgContext (non-null org only)
//   3. getPersonaForUser             — via getMembership
//   4. buildSystemPrompt             — injects OrgContext + onboarding suffixes
//   5. Conversation truncation       — full history (master §5.2 step 5)
//   6. callClaude                    — real client, fixture-gated in tests
//   7. Tool-call validation retry    — Q13 budget, max 2
//   8. executeTool                   — inline dispatcher; onboarding step
//                                      transitions detected at the call site
//                                      (updateUserProfile → step 1,
//                                       createOrganization → atomic 2+3)
//   9. persistSession                — conversation + last_activity_at;
//                                      state is persisted ONLY on the success
//                                      path (failure paths don't advance the
//                                      onboarding state machine)
//  10. extractResponse               — respondToUser tool_use; the
//                                      agent.onboarding.first_task.navigate
//                                      template_id flips in_onboarding=false
//                                      and sets AgentResponse.onboarding_complete

import type Anthropic from '@anthropic-ai/sdk';
import type { Logger } from 'pino';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import type { CanvasContext } from '@/shared/types/canvasContext';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import type { ProposedEntryCard } from '@/shared/types/proposedEntryCard';
import { ProposedEntryCardSchema } from '@/shared/schemas/accounting/proposedEntryCard.schema';
import type {
  PersistedAssistantTurn,
  PersistedUserTurn,
} from '@/shared/types/chatTurn';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import { adminClient } from '@/db/adminClient';
import { getMembership } from '@/services/auth/getMembership';
import type { UserRole } from '@/services/auth/canUserPerformAction';
import { callClaude } from './callClaude';
import { loadOrCreateSession, type AgentSessionRow } from './loadOrCreateSession';
import { toolsForPersona, type Persona } from './toolsForPersona';
import { buildSystemPrompt } from './buildSystemPrompt';
import { respondToUserInputSchema } from '@/agent/tools/schemas/respondToUser.schema';
import { validateParamsAgainstTemplate } from '@/agent/prompts/validTemplateIds';
import { loadOrgContext } from '@/agent/memory/orgContextManager';
import {
  resolveRelativeDate,
  detectPromptWeekday,
  dayOfWeekOfDate,
} from '@/agent/dateResolution/resolveRelativeDate';
import {
  type OnboardingState,
  readOnboardingState,
  writeOnboardingState,
  advanceOnboardingState,
  markOnboardingComplete,
} from '@/agent/onboarding/state';
import { recordMutation } from '@/services/audit/recordMutation';
import { withInvariants } from '@/services/middleware/withInvariants';
import { userProfileService } from '@/services/user/userProfileService';
import { orgService } from '@/services/org/orgService';
import { chartOfAccountsService } from '@/services/accounting/chartOfAccountsService';
import { periodService } from '@/services/accounting/periodService';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import type { UpdateUserProfilePatch } from '@/shared/schemas/user/profile.schema';
import type {
  CreateOrgProfileInput,
  UpdateOrgProfilePatch,
} from '@/shared/schemas/organization/profile.schema';
import type { CheckPeriodInput } from '@/agent/tools/schemas/checkPeriod.schema';

const Q13_MAX_VALIDATION_RETRIES = 2;
const STRUCTURAL_MAX_RETRIES = 1;
const MODEL = 'claude-sonnet-4-6';

export interface HandleUserMessageInput {
  user_id: string;
  org_id: string | null;
  locale: 'en' | 'fr-CA' | 'zh-Hant';
  message: string;
  session_id?: string;
  canvas_context?: CanvasContext;
  /**
   * OI-2 fix-stack item 1: IANA timezone string for the user's
   * browser. Required at the orchestrator boundary; the route
   * coerces with `parsed.tz ?? 'UTC'` for non-browser callers.
   * Threaded into buildSystemPrompt's temporal block and
   * resolveRelativeDate.
   */
  tz: string;
  /**
   * Session 5 / sub-brief §6.6: the welcome page computes an
   * initial OnboardingState server-side and passes it in on the
   * first turn of a fresh onboarding session. The orchestrator
   * merges it into session.state only when session.state has no
   * existing `onboarding` key (first turn). Subsequent turns
   * rely on the persisted state and ignore this field.
   */
  initial_onboarding?: OnboardingState;
}

export interface StructuredResponse {
  template_id: string;
  params: Record<string, unknown>;
}

export interface AgentResponse {
  session_id: string;
  response: StructuredResponse;
  canvas_directive?: CanvasDirective;
  proposed_entry_card?: ProposedEntryCard;
  trace_id: string;
  /**
   * Session 5 / sub-brief §6.5 + Pre-decision 4: set to true on
   * the single turn when the respondToUser template_id
   * `agent.onboarding.first_task.navigate` flipped
   * in_onboarding=false. The welcome page observes this flag and
   * calls router.push to the main app layout. Unset on all other
   * turns (including normal onboarding turns and non-onboarding
   * traffic).
   */
  onboarding_complete?: boolean;
}

const STEP_4_COMPLETION_TEMPLATE_ID = 'agent.onboarding.first_task.navigate';

export async function handleUserMessage(
  input: HandleUserMessageInput,
  ctx: ServiceContext,
): Promise<AgentResponse> {
  const log = loggerWith({
    trace_id: ctx.trace_id,
    org_id: input.org_id ?? undefined,
    user_id: input.user_id,
  });

  log.debug({ locale: input.locale, has_session: !!input.session_id }, 'handleUserMessage: entry');

  // §5.4 degradation scaffolding — API key is a prerequisite.
  // Real failure classification (network, 5xx, rate-limit) lands
  // in Session 4 when the real client is wired.
  if (!process.env.ANTHROPIC_API_KEY) {
    log.warn({}, 'handleUserMessage: ANTHROPIC_API_KEY not set');
    throw new ServiceError('AGENT_UNAVAILABLE', 'Anthropic API key not configured');
  }

  // Step 1: session. ctx is threaded in per Clarification E so
  // branch-3's agent.session_created / agent.session_org_switched
  // audit emits have a valid ServiceContext.
  const session = await loadOrCreateSession(
    {
      user_id: input.user_id,
      org_id: input.org_id,
      locale: input.locale,
      session_id: input.session_id,
    },
    ctx,
    log,
  );

  // Read onboarding state at turn start. On a fresh session
  // (empty state JSONB) with initial_onboarding provided, merge
  // in so the first turn has the right state. Subsequent turns
  // rely on the persisted state (initial_onboarding ignored).
  let currentOnboarding: OnboardingState | null = readOnboardingState(
    (session.state as Record<string, unknown>) ?? {},
  );
  if (currentOnboarding === null && input.initial_onboarding !== undefined) {
    const isFreshState =
      !session.state ||
      Object.keys(session.state as Record<string, unknown>).length === 0;
    if (isFreshState) {
      currentOnboarding = input.initial_onboarding;
      log.debug(
        { current_step: currentOnboarding.current_step },
        'handleUserMessage: initial_onboarding seeded on fresh session',
      );
    }
  }

  // Function-scoped adminClient (Clarification D implementation
  // note) for the agent.message_processed audit emit below.
  const db = adminClient();
  const emitMessageProcessedAudit = async (): Promise<void> => {
    // Clarification D: skip when session.org_id is null
    // (onboarding). Clarification F: try/catch prevents a thrown
    // audit error from poisoning the user-facing request.
    if (session.org_id === null) return;
    try {
      await recordMutation(db, ctx, {
        org_id: session.org_id,
        action: 'agent.message_processed',
        entity_type: 'agent_session',
        entity_id: session.session_id,
      });
    } catch (err) {
      log.error(
        { err: String(err), action: 'agent.message_processed' },
        'agent audit write failed; continuing (tx-atomicity gap per Clarification F)',
      );
    }
  };

  // Step 3: persona (simplified for Session 2 — no org means controller
  // for onboarding flow scaffolding; Session 5 refines).
  const persona = await resolvePersona(input.user_id, input.org_id);
  const tools = toolsForPersona(persona);
  const toolByName: Map<string, (typeof tools)[number]> = new Map(
    tools.map((t) => [t.name as string, t] as const),
  );

  // Steps 2 + 4: load OrgContext (master §5.2 step 2) then
  // compose system prompt (step 4). org_id is null for
  // onboarding sessions — buildSystemPrompt falls through to
  // its onboarding branch automatically.
  const orgContext =
    input.org_id !== null ? await loadOrgContext(input.org_id) : null;
  // OI-2 fix-stack item 2: server-side relative-date resolution.
  // Foundation commit consumes 'resolved' (augments prompt) and
  // 'none' (no-op). 'span' is detected here but not yet acted on
  // — validation commit adds the short-circuit before LLM call.
  const turnNow = new Date();
  const resolved = resolveRelativeDate(input.message, turnNow, input.tz);
  const resolvedEntryDate =
    resolved.kind === 'resolved'
      ? { date: resolved.date, sourcePhrase: resolved.source_phrase }
      : undefined;
  const system = buildSystemPrompt({
    persona,
    orgContext,
    locale: input.locale,
    canvasContext: input.canvas_context,
    user: { user_id: input.user_id },
    onboarding: currentOnboarding,
    now: turnNow,
    timezone: input.tz,
    resolvedEntryDate,
  });

  // Step 5: full conversation history (master §5.2 step 5 — no
  // truncation, no rolling window in Phase 1.2).
  const messages: Anthropic.Messages.MessageParam[] = [
    ...(session.conversation as Anthropic.Messages.MessageParam[]),
    { role: 'user', content: input.message },
  ];

  // Session 7 Commit 3 (Pre-decision 14): capture the user turn
  // once at entry so every persistSession path (success, Q13
  // exhausted, structural retry exhausted) appends the same user
  // turn to the structured turns array. id is a client-stable
  // UUID; timestamp is the server-side receipt time.
  const turnUserId = crypto.randomUUID();
  const turnUserTimestamp = new Date().toISOString();
  const userTurn: PersistedUserTurn = {
    role: 'user',
    id: turnUserId,
    text: input.message,
    timestamp: turnUserTimestamp,
    status: 'sent',
  };
  const existingTurns = session.turns;

  // OI-2 fix-stack item 4 (validation commit) — gate A: span-token
  // short-circuit. When resolveRelativeDate identified a span phrase
  // ("last quarter," "this month," etc.), the prompt is structurally
  // ambiguous about which calendar date the operator means. Refusing
  // before the LLM call eliminates two C6 failure surfaces at once:
  // (a) no tokens spent on a prompt the resolver already knows is
  // ambiguous, (b) no executeTool dispatch and therefore no
  // ai_actions row that could orphan if the LLM stalls mid-render.
  // Failure path: state stays unchanged (sub-brief §6.4 item 5).
  if (resolved.kind === 'span') {
    log.info(
      {
        source_phrase: resolved.source_phrase,
        span_kind: resolved.span_kind,
      },
      'OI-2 gate A: span short-circuit — emitting clarification without LLM call',
    );
    const clarifyTurn: PersistedAssistantTurn = {
      role: 'assistant',
      id: crypto.randomUUID(),
      template_id: 'agent.clarify.entry_date_ambiguous',
      params: {
        source_phrase: resolved.source_phrase,
        span_kind: resolved.span_kind,
      },
      timestamp: new Date().toISOString(),
      trace_id: ctx.trace_id,
    };
    // Synthetic terminating message: no LLM was called, so there is
    // no real Anthropic.Messages.Message to persist. Mirrors the
    // success path's responseForPersist pattern (text-only content
    // describing what the orchestrator did).
    const syntheticContent: Anthropic.Messages.ContentBlock[] = [
      {
        type: 'text',
        text: '[server-emitted clarification: span-token short-circuit]',
        citations: null,
      },
    ];
    const syntheticResponse = {
      id: 'oi2_gate_a_span_short_circuit',
      type: 'message',
      role: 'assistant',
      model: MODEL,
      stop_reason: 'end_turn',
      stop_sequence: null,
      content: syntheticContent,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        server_tool_use: null,
      },
    } as unknown as Anthropic.Messages.Message;
    const conversationWithUserTurn: Anthropic.Messages.MessageParam[] = [
      ...(session.conversation as Anthropic.Messages.MessageParam[]),
      { role: 'user', content: input.message },
    ];
    await persistSession(
      session.session_id,
      conversationWithUserTurn,
      syntheticResponse,
      ctx.trace_id,
      log,
      undefined,
      [...existingTurns, userTurn, clarifyTurn],
    );
    await emitMessageProcessedAudit();
    return {
      session_id: session.session_id,
      response: {
        template_id: 'agent.clarify.entry_date_ambiguous',
        params: {
          source_phrase: resolved.source_phrase,
          span_kind: resolved.span_kind,
        },
      },
      trace_id: ctx.trace_id,
    };
  }

  let validationRetries = 0;
  let structuralRetries = 0;

  // Finding O2-v2: Site 1 mints an idempotency_key for ledger tool
  // calls pre-Zod (postJournalEntry / reverseJournalEntry). Site 2
  // (respondToUser's ProposedEntryCard post-fill) must use the SAME
  // key that landed in ai_actions so /api/agent/confirm's lookup
  // by (org_id, idempotency_key) resolves. Declared at
  // handleUserMessage scope so the value persists across main-loop
  // iterations (model may take multiple turns between the ledger
  // tool call and the card-bearing respondToUser). Assigned only
  // after executeTool succeeds — if Zod or executeTool threw, the
  // minted key was never written to ai_actions and must not be
  // propagated to a card.
  // See docs/09_briefs/phase-1.2/session-8-c6-prereq-o2-v2-pre-zod-injection-plan.md.
  let lastLedgerIdempotencyKey: string | undefined;
  const LEDGER_TOOLS = new Set(['postJournalEntry', 'reverseJournalEntry']);

  // Main retry loop
  while (true) {
    const resp = await callClaude(
      {
        model: MODEL,
        max_tokens: 4096,
        system,
        messages,
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema as Anthropic.Messages.Tool.InputSchema,
        })),
      },
      log,
    );

    // Partition content blocks
    const toolUses = resp.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use',
    );
    const respondBlock = toolUses.find((b) => b.name === 'respondToUser');
    const otherTools = toolUses.filter((b) => b.name !== 'respondToUser');

    // Validate and execute non-respondToUser tools
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    let hadValidationError = false;

    for (const tu of otherTools) {
      const def = toolByName.get(tu.name);
      if (!def) {
        log.warn({ tool_name: tu.name }, 'unknown tool requested');
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          is_error: true,
          content: `Unknown tool: ${tu.name}. Available tools: ${tools.map((t) => t.name).join(', ')}`,
        });
        hadValidationError = true;
        continue;
      }

      // Finding O2-v2 Site 1: for ledger tools, inject authoritative
      // org_id (session-derived) and idempotency_key (orchestrator-
      // minted) into the model's raw input BEFORE Zod. The model
      // has no legitimate source for either; the previous pattern
      // (overwrite inside executeTool, post-Zod) was unreachable
      // when the model emitted empty/invalid UUIDs because Zod
      // rejected at this boundary. Unconditional overwrite — if
      // the model emits a value (including empty string), it is
      // discarded. fiscal_period_id stays model-owned; omitting
      // it must still fail Zod so the retry loop surfaces the gap.
      // session.org_id === null is an onboarding leak guarded by
      // ORG_SCOPED_TOOLS inside executeTool; skip injection so Zod
      // rejects normally and the guard fires defense-in-depth.
      let mintedIdempotencyKey: string | undefined;
      let toolInputForValidation: unknown = tu.input;
      if (LEDGER_TOOLS.has(tu.name) && session.org_id !== null) {
        const raw = (tu.input as Record<string, unknown> | null) ?? {};
        mintedIdempotencyKey = crypto.randomUUID();
        toolInputForValidation = {
          ...raw,
          org_id: session.org_id,
          idempotency_key: mintedIdempotencyKey,
        };
      }

      const parsed = def.zodSchema.safeParse(toolInputForValidation);
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        log.warn({ tool_name: tu.name, issues }, 'tool input failed Zod');
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          is_error: true,
          content: `Validation failed: ${issues}`,
        });
        hadValidationError = true;
        continue;
      }

      // OI-2 fix-stack item 3 (validation commit) — gate B: day-of-
      // week validation. Runs post-Zod (parsed.data.entry_date is a
      // valid ISO date) and pre-executeTool (the orphan-creating
      // ai_actions.insert lives inside executeTool's dry_run branch,
      // so the gate must precede it). Scope: postJournalEntry only;
      // reverseJournalEntry's date semantics differ (operator picks
      // the reversal date from a known set, not from a relative
      // phrase). English-only — non-English prompts skip with
      // log.warn per ratified decision point #3 (locale-aware
      // weekday parsing is its own scope). Mismatch: fail-fast —
      // emit dow_mismatch template, persist failure turn, return.
      // No retry (C6 footprint showed 0% agent self-recovery on
      // relative-date stalls).
      if (tu.name === 'postJournalEntry') {
        const promptWeekday =
          input.locale === 'en' ? detectPromptWeekday(input.message) : null;
        if (input.locale !== 'en' && /\b(?:sun|mon|tues?|wed|thu|fri|satur)day\b/i.test(input.message)) {
          log.warn(
            { locale: input.locale },
            'OI-2 gate B: dow validation skipped (non-English locale)',
          );
        }
        if (promptWeekday !== null) {
          const entryDate = (parsed.data as { entry_date: string }).entry_date;
          const resolvedDow = dayOfWeekOfDate(entryDate, input.tz);
          // Capitalize the prompt weekday to match Intl's long-form
          // output (Intl emits "Saturday", detectPromptWeekday
          // returns "saturday").
          const promptDow =
            promptWeekday.weekday.charAt(0).toUpperCase() +
            promptWeekday.weekday.slice(1);
          if (resolvedDow.toLowerCase() !== promptWeekday.weekday) {
            log.warn(
              {
                tool_name: tu.name,
                resolved_date: entryDate,
                resolved_dow: resolvedDow,
                prompt_dow: promptDow,
                source_phrase: promptWeekday.phrase,
              },
              'OI-2 gate B: day-of-week mismatch — fail-fast, no ai_actions insert',
            );
            const dowFailureTurn: PersistedAssistantTurn = {
              role: 'assistant',
              id: crypto.randomUUID(),
              template_id: 'agent.error.entry_date_dow_mismatch',
              params: {
                resolved_date: entryDate,
                resolved_dow: resolvedDow,
                prompt_dow: promptDow,
                source_phrase: promptWeekday.phrase,
              },
              timestamp: new Date().toISOString(),
              trace_id: ctx.trace_id,
            };
            // Persist the failure: conversation reflects the user
            // message + the (rejected) tool_use turn so the
            // transcript is honest about what was attempted, and
            // the failure turn is recorded for the UI.
            await persistSession(
              session.session_id,
              messages,
              resp,
              ctx.trace_id,
              log,
              undefined,
              [...existingTurns, userTurn, dowFailureTurn],
            );
            await emitMessageProcessedAudit();
            return {
              session_id: session.session_id,
              response: {
                template_id: 'agent.error.entry_date_dow_mismatch',
                params: {
                  resolved_date: entryDate,
                  resolved_dow: resolvedDow,
                  prompt_dow: promptDow,
                  source_phrase: promptWeekday.phrase,
                },
              },
              trace_id: ctx.trace_id,
            };
          }
        }
      }

      try {
        const output = await executeTool(tu.name, parsed.data, ctx, session, log);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(output),
        });
        // Finding O2-v2 Site 1 completion: ledger tool succeeded
        // (ai_actions row written with the minted key). Record it
        // for Site 2's card post-fill downstream.
        if (LEDGER_TOOLS.has(tu.name) && mintedIdempotencyKey !== undefined) {
          lastLedgerIdempotencyKey = mintedIdempotencyKey;
        }
        // Onboarding step transitions (sub-brief §6.4 item 3).
        // Detected at the orchestrator call site — the tool has
        // just succeeded, and the validated input tells us what
        // to check. updateUserProfile with a non-empty displayName
        // completes step 1 (Pre-decision 5). createOrganization
        // succeeding atomically completes steps 2 AND 3.
        if (currentOnboarding !== null && currentOnboarding.in_onboarding) {
          let newlyCompleted: number[] | null = null;
          if (tu.name === 'updateUserProfile') {
            const patch = parsed.data as { displayName?: unknown };
            if (typeof patch.displayName === 'string' && patch.displayName.length > 0) {
              newlyCompleted = [1];
            }
          } else if (tu.name === 'createOrganization') {
            newlyCompleted = [2, 3];
          }
          if (newlyCompleted !== null) {
            const advanced = advanceOnboardingState(currentOnboarding, newlyCompleted);
            if (advanced.ok) {
              currentOnboarding = advanced.state;
              log.info(
                {
                  newly_completed: newlyCompleted,
                  current_step: currentOnboarding.current_step,
                  completed_steps: currentOnboarding.completed_steps,
                },
                'onboarding state advanced',
              );
            } else {
              log.error(
                {
                  reason: advanced.reason,
                  tool_name: tu.name,
                  newly_completed: newlyCompleted,
                  completed_steps: currentOnboarding.completed_steps,
                },
                'onboarding advance blocked — state machine already terminal (upstream bug)',
              );
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error({ tool_name: tu.name, err: msg }, 'tool execution failed');
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          is_error: true,
          content: `Execution error: ${msg}`,
        });
        hadValidationError = true;
      }
    }

    // Session 7 Commit 1: orchestrator-boundary validation for
    // the respondToUser params. The wrapper schema enforces the
    // outer { template_id, params, canvas_directive? } shape;
    // validateParamsAgainstTemplate enforces the per-template
    // params shape declared in TEMPLATE_ID_PARAMS. Either failure
    // pushes a tool_result and rides the same Q13 retry budget
    // as otherTools validation failures — exhaustion emits the
    // agent.error.tool_validation_failed template as a normal
    // turn (existing path below).
    let respondParsed:
      | {
          template_id: string;
          params: Record<string, unknown>;
          canvas_directive?: CanvasDirective;
        }
      | null = null;
    if (respondBlock) {
      const respondShape = respondToUserInputSchema.safeParse(
        respondBlock.input,
      );
      if (!respondShape.success) {
        const issues = respondShape.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        log.warn(
          { tool_name: 'respondToUser', issues },
          'respondToUser input failed Zod (wrapper)',
        );
        toolResults.push({
          type: 'tool_result',
          tool_use_id: respondBlock.id,
          is_error: true,
          content: `Validation failed: ${issues}`,
        });
        hadValidationError = true;
      } else {
        const templateCheck = validateParamsAgainstTemplate(
          respondShape.data.template_id,
          respondShape.data.params,
        );
        if (!templateCheck.ok) {
          const issues = templateCheck.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ');
          log.warn(
            {
              tool_name: 'respondToUser',
              template_id: respondShape.data.template_id,
              issues,
            },
            'respondToUser params failed template validation',
          );
          toolResults.push({
            type: 'tool_result',
            tool_use_id: respondBlock.id,
            is_error: true,
            content: `Validation failed for template_id ${respondShape.data.template_id}: ${issues}`,
          });
          hadValidationError = true;
        } else {
          // Cast bridges the loose schema type (canvas_directive's
          // proposed_entry_card variant uses z.unknown() placeholder
          // until Session 7 Commit 2 replaces it with the real
          // ProposedEntryCardSchema) to the strict CanvasDirective
          // type used downstream. Mirrors the pattern that lived at
          // the cast site this validation block displaces.
          respondParsed = respondShape.data as {
            template_id: string;
            params: Record<string, unknown>;
            canvas_directive?: CanvasDirective;
          };
        }
      }
    }

    // Q13 budget: if validation failed, retry up to MAX times
    if (hadValidationError) {
      validationRetries += 1;
      if (validationRetries > Q13_MAX_VALIDATION_RETRIES) {
        log.warn({ retries: validationRetries }, 'Q13 budget exhausted — surfacing clarification');
        // Sub-brief §6.4 item 5: failure paths persist conversation
        // but NOT state changes. A failed turn should not advance
        // the onboarding state machine. Pass `undefined` for the
        // new state parameter so persistSession omits the column.
        const failureAssistantTurn: PersistedAssistantTurn = {
          role: 'assistant',
          id: crypto.randomUUID(),
          template_id: 'agent.error.tool_validation_failed',
          params: { retries: validationRetries },
          timestamp: new Date().toISOString(),
          trace_id: ctx.trace_id,
        };
        await persistSession(
          session.session_id,
          messages,
          resp,
          ctx.trace_id,
          log,
          undefined,
          [...existingTurns, userTurn, failureAssistantTurn],
        );
        await emitMessageProcessedAudit();
        return {
          session_id: session.session_id,
          response: {
            template_id: 'agent.error.tool_validation_failed',
            params: { retries: validationRetries },
          },
          trace_id: ctx.trace_id,
        };
      }
      messages.push({ role: 'assistant', content: resp.content });
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // No validation errors. If respondToUser present, we're done.
    if (respondBlock && respondParsed) {
      const parsedRespond = respondParsed;

      // Step-4 completion detection (sub-brief §6.4 item 4 +
      // Pre-decision 8). The agent signals "onboarding done"
      // by using this specific template_id at current_step === 4.
      // Any other template_id at step 4 leaves the state
      // unchanged — the agent is still talking about the task
      // choice, not committing.
      //
      // Session 5.2: additional guard requires completed_steps
      // to include 1. The state-advance rule in state.ts can
      // legally produce current_step === 4 without step 1 in
      // completed_steps (e.g., step 1 failed silently and step
      // 2+3 atomic advance jumped current_step from 1 to 4).
      // Allowing completion in that case produces a "finished"
      // onboarding with display_name still null. The guard
      // forces the agent back to updateUserProfile first; the
      // extended onboardingSuffix at step 4 (also Session 5.2)
      // directs the agent to the profile step when the guard
      // would block.
      let onboardingComplete = false;
      if (
        currentOnboarding !== null &&
        currentOnboarding.in_onboarding &&
        currentOnboarding.current_step === 4 &&
        currentOnboarding.completed_steps.includes(1) &&
        parsedRespond.template_id === STEP_4_COMPLETION_TEMPLATE_ID
      ) {
        currentOnboarding = markOnboardingComplete(currentOnboarding);
        onboardingComplete = true;
        log.info(
          { template_id: parsedRespond.template_id },
          'onboarding step 4 completed — in_onboarding flipped',
        );
      } else if (
        currentOnboarding !== null &&
        currentOnboarding.in_onboarding &&
        currentOnboarding.current_step === 4 &&
        !currentOnboarding.completed_steps.includes(1) &&
        parsedRespond.template_id === STEP_4_COMPLETION_TEMPLATE_ID
      ) {
        // Log the blocked completion so it's visible in logs.
        // Agent emitted the completion signal, but step 1 never
        // completed — state machine is in a recoverable state
        // (current_step === 4 but display_name never set).
        log.warn(
          {
            template_id: parsedRespond.template_id,
            completed_steps: currentOnboarding.completed_steps,
          },
          'step-4 completion blocked — step 1 not in completed_steps (display_name not set)',
        );
      }

      // Sub-brief §6.4 item 5: persist state only on the success
      // path. currentOnboarding is null for non-onboarding sessions;
      // otherwise, write the (possibly advanced / completed) state
      // into session.state.onboarding.
      const newState: Record<string, unknown> | undefined =
        currentOnboarding !== null
          ? writeOnboardingState(
              (session.state as Record<string, unknown>) ?? {},
              currentOnboarding,
            )
          : undefined;

      // Session 5.1 / Bug 1: build a protocol-valid persisted
      // conversation. Anthropic's API requires every tool_use
      // block in an assistant message to be immediately followed
      // by a matching tool_result in the next user message. The
      // orchestrator-internal respondToUser tool_use has no
      // matching tool_result (it's consumed here, not executed
      // via executeTool), so persisting Claude's raw response
      // with respondToUser intact produces an invalid message
      // sequence on Turn 2. Fix: strip respondToUser from the
      // persisted content; if Claude bundled non-respondToUser
      // tool_uses in this same turn (e.g., listIndustries +
      // respondToUser), persist them as a full assistant→user
      // exchange (tool_use + tool_result pair) so the sequence
      // stays valid, then terminate with a text placeholder.
      const filteredFinalContent = resp.content.filter(
        (b) => !(b.type === 'tool_use' && b.name === 'respondToUser'),
      );
      if (otherTools.length > 0) {
        messages.push({ role: 'assistant', content: filteredFinalContent });
        messages.push({ role: 'user', content: toolResults });
      }
      // Terminating assistant turn: a minimal text block noting
      // which template_id was delivered. Claude on Turn 2 sees
      // this as context for the previous turn's outcome; it's
      // never re-consumed as an instruction. Keeping the content
      // short minimizes token drag on subsequent turns.
      const terminatingContent: Anthropic.Messages.ContentBlock[] = [
        {
          type: 'text',
          text: `[responded with template_id=${parsedRespond.template_id}]`,
          citations: null,
        },
      ];
      const responseForPersist: Anthropic.Messages.Message = {
        ...resp,
        content: terminatingContent,
      };

      // Build the structured assistant turn from parsedRespond.
      // Cards live on `canvas_directive.card` when the directive's
      // type is 'proposed_entry_card'; other directive types ride
      // the turn as a canvas_directive_pill (master §14.2
      // bookmark-pill UX from Commit 3).
      const directive = parsedRespond.canvas_directive;
      const modelEmittedCard =
        directive?.type === 'proposed_entry_card'
          ? directive.card
          : undefined;

      // Finding O2-v2 Site 2: post-fill the three orchestrator-owned
      // UUIDs on the card the model emitted. Model has no legitimate
      // source for org_id (no UUIDs in prompt), idempotency_key
      // (minted at Site 1), or trace_id (not in prompt, not in
      // tool_result). dry_run_entry_id stays — the model correctly
      // echoes it from the postJournalEntry tool_result. If the
      // model emitted a card WITHOUT a prior successful ledger call
      // this turn, lastLedgerIdempotencyKey is undefined; throw
      // rather than minting a fresh key that would diverge from any
      // ai_actions row and break /api/agent/confirm.
      let successCard: ProposedEntryCard | undefined;
      if (modelEmittedCard !== undefined) {
        if (lastLedgerIdempotencyKey === undefined) {
          throw new ServiceError(
            'AGENT_TOOL_VALIDATION_FAILED',
            'ProposedEntryCard emitted without a prior successful ledger-tool call this turn (no idempotency_key to propagate)',
          );
        }
        const filled = {
          ...modelEmittedCard,
          org_id: session.org_id as string,
          idempotency_key: lastLedgerIdempotencyKey,
          trace_id: ctx.trace_id,
        };
        // Defense-in-depth: assert the post-filled card is strictly
        // valid. Any drift from the ProposedEntryCardSchema surfaces
        // here loudly rather than shipping malformed data to the client.
        ProposedEntryCardSchema.parse(filled);
        successCard = filled as ProposedEntryCard;
      }

      const successPill: CanvasDirective | undefined =
        directive && directive.type !== 'proposed_entry_card'
          ? directive
          : undefined;
      const successAssistantTurn: PersistedAssistantTurn = {
        role: 'assistant',
        id: crypto.randomUUID(),
        template_id: parsedRespond.template_id,
        params: parsedRespond.params,
        ...(successCard !== undefined && { card: successCard }),
        ...(successPill !== undefined && { canvas_directive_pill: successPill }),
        timestamp: new Date().toISOString(),
        trace_id: ctx.trace_id,
      };

      await persistSession(
        session.session_id,
        messages,
        responseForPersist,
        ctx.trace_id,
        log,
        newState,
        [...existingTurns, userTurn, successAssistantTurn],
      );
      // OI-3 Part 2 telemetry (closeout deliverable from C11 Obs-G):
      // canvas_directive_present + directive_source enable observable
      // canvas_directive emission rate for OI-3 M1 post-fix validation.
      const canvasDirectivePresent =
        successCard !== undefined || parsedRespond.canvas_directive !== undefined;
      const directiveSource: 'model_loose' | 'site2_postfilled' | 'none' =
        successCard !== undefined
          ? 'site2_postfilled'
          : parsedRespond.canvas_directive !== undefined
            ? 'model_loose'
            : 'none';
      log.info(
        {
          template_id: parsedRespond.template_id,
          had_tool_calls: otherTools.length > 0,
          canvas_directive_present: canvasDirectivePresent,
          directive_source: directiveSource,
        },
        'handleUserMessage: response extracted',
      );
      await emitMessageProcessedAudit();
      // Finding O2-v2 Site 2: if the model emitted a ProposedEntryCard
      // directive, ship the post-filled card (not the loose model
      // emission) to the client. successCard is the strict
      // ProposedEntryCardSchema-valid version.
      const responseDirective: CanvasDirective | undefined =
        successCard !== undefined
          ? { type: 'proposed_entry_card', card: successCard }
          : parsedRespond.canvas_directive;

      const response: AgentResponse = {
        session_id: session.session_id,
        response: {
          template_id: parsedRespond.template_id,
          params: parsedRespond.params,
        },
        canvas_directive: responseDirective,
        trace_id: ctx.trace_id,
      };
      if (onboardingComplete) {
        // Pre-decision 11b: at onboarding completion, look up the
        // user's first active membership (created either earlier
        // in this session via createOrganization for fresh users,
        // or pre-existing for invited users) and update
        // agent_sessions.org_id from null to the returned org_id.
        // The production chat's mount-time conversation fetch is
        // keyed on (user_id, org_id), so this update is what lets
        // the onboarding transcript survive into the production
        // chat. Uses the function-scoped db (adminClient) already
        // in scope for audit emits.
        const { data: firstMembership } = await db
          .from('memberships')
          .select('org_id')
          .eq('user_id', input.user_id)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (firstMembership?.org_id) {
          const { error: orgUpdateErr } = await db
            .from('agent_sessions')
            .update({ org_id: firstMembership.org_id })
            .eq('session_id', session.session_id);
          if (orgUpdateErr) {
            log.error(
              {
                err: orgUpdateErr.message,
                session_id: session.session_id,
                org_id: firstMembership.org_id,
              },
              'onboarding-complete org_id update failed; conversation resume may not find the session',
            );
          } else {
            log.info(
              { session_id: session.session_id, org_id: firstMembership.org_id },
              'onboarding-complete: session org_id updated for conversation resume',
            );
          }
        } else {
          log.warn(
            { user_id: input.user_id, session_id: session.session_id },
            'onboarding-complete but no active membership found — conversation resume will miss',
          );
        }
        response.onboarding_complete = true;
      }
      return response;
    }

    // No respondToUser. If tool calls succeeded, feed results back and continue.
    if (otherTools.length > 0) {
      messages.push({ role: 'assistant', content: resp.content });
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // No tool calls at all AND no respondToUser → structural failure.
    // §6.2: structural retry budget is independent of Q13.
    // Master §6.2 item 5: on structural-retry exhaustion the
    // orchestrator "surfaces a generic error template
    // { template_id: 'agent.error.structured_response_missing',
    // params: {} } and logs AGENT_STRUCTURED_RESPONSE_INVALID."
    // Session 3 closes the Session 2 divergence (throw → return
    // template response) per sub-brief §6.7.
    if (structuralRetries >= STRUCTURAL_MAX_RETRIES) {
      log.error(
        { code: 'AGENT_STRUCTURED_RESPONSE_INVALID' },
        'structural retry budget exhausted — returning fallback template',
      );
      // Sub-brief §6.4 item 5: failure path — conversation
      // persists, onboarding state does not. Pass `undefined`.
      const structuralFailureTurn: PersistedAssistantTurn = {
        role: 'assistant',
        id: crypto.randomUUID(),
        template_id: 'agent.error.structured_response_missing',
        params: {},
        timestamp: new Date().toISOString(),
        trace_id: ctx.trace_id,
      };
      await persistSession(
        session.session_id,
        messages,
        resp,
        ctx.trace_id,
        log,
        undefined,
        [...existingTurns, userTurn, structuralFailureTurn],
      );
      await emitMessageProcessedAudit();
      return {
        session_id: session.session_id,
        response: {
          template_id: 'agent.error.structured_response_missing',
          params: {},
        },
        trace_id: ctx.trace_id,
      };
    }
    structuralRetries += 1;
    messages.push({ role: 'assistant', content: resp.content });
    messages.push({
      role: 'user',
      content: 'You must end every turn with a call to the respondToUser tool. Use template_id and params to format your response.',
    });
  }
}

// -----------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------

async function resolvePersona(user_id: string, org_id: string | null): Promise<Persona> {
  // Onboarding path (master decision A, brief §3): an onboarding
  // user has no org membership yet and will become a controller
  // of the org they create via createOrganization. Returning
  // 'controller' here matches the tool whitelist the onboarding
  // flow requires (updateUserProfile, createOrganization,
  // updateOrgProfile, listIndustries, respondToUser). Session 5
  // Pre-decision 6 confirms this stub is correct — kept as-is
  // with this comment as the durable reasoning.
  if (org_id === null) return 'controller';
  const m = await getMembership(user_id, org_id);
  if (!m) {
    throw new ServiceError('ORG_ACCESS_DENIED', `No active membership for user in org ${org_id}`);
  }
  return m.role as UserRole;
}

async function executeTool(
  toolName: string,
  validatedInput: unknown,
  ctx: ServiceContext,
  session: AgentSessionRow,
  log: Logger,
): Promise<unknown> {
  // db at function scope per Clarification D implementation note.
  // Used by the ai_actions insert (dry_run branch) and by the
  // agent.tool_executed audit emit below. adminClient() is a
  // module-level singleton; cheap to call once per invocation.
  const db = adminClient();

  // Finding O2 (Option 3a): org-scoped tools receive org_id from
  // session.org_id, not from the model. Read-tool schemas no
  // longer declare org_id (Part 1 of the plan); ledger-tool
  // schemas keep org_id because they're shared with non-agent
  // callers, and the orchestrator overwrites whatever the model
  // emitted. In both cases the authoritative org_id is
  // session.org_id. Reject with a loud error if session.org_id is
  // null for any org-scoped tool — createOrganization is the only
  // legal null-org tool and it has no org_id field.
  const ORG_SCOPED_TOOLS = new Set([
    'listChartOfAccounts',
    'checkPeriod',
    'listJournalEntries',
    'postJournalEntry',
    'reverseJournalEntry',
  ]);
  if (ORG_SCOPED_TOOLS.has(toolName) && session.org_id === null) {
    throw new Error(
      `${toolName} called without an active org (session.org_id is null). ` +
        'Only onboarding tools (createOrganization) may run with a null-org session.',
    );
  }

  try {
    // Ledger-mutating tools with dry_run=true write ai_actions
    // (master §5.8 trace_id propagation; §6.5 dry_run scope).
    if (toolName === 'postJournalEntry' || toolName === 'reverseJournalEntry') {
      const rawInput = validatedInput as {
        org_id?: string;
        dry_run?: boolean;
        idempotency_key?: string;
      };
      // Finding O2 + O2-v2: overwrite any org_id with the
      // authoritative session.org_id before the ai_actions write
      // and the downstream service call. session.org_id is non-null
      // here (ORG_SCOPED_TOOLS guard above).
      //
      // O2-v2 moves the primary injection pre-Zod (Site 1 in
      // handleUserMessage's main loop), so when called from that
      // path rawInput.org_id already equals session.org_id and this
      // overwrite is a no-op. It stays as defense-in-depth for any
      // future code path that calls executeTool directly (tests,
      // replays, regressions that bypass the main-loop pre-Zod hook).
      const input = { ...rawInput, org_id: session.org_id as string };
      if (input.dry_run === true) {
        if (!input.idempotency_key) {
          throw new Error('idempotency_key required on agent-sourced dry_run');
        }
        const { data, error } = await db
          .from('ai_actions')
          .insert({
            org_id: input.org_id,
            user_id: ctx.caller.user_id,
            session_id: session.session_id,
            trace_id: ctx.trace_id,
            tool_name: toolName,
            tool_input: input,
            status: 'pending',
            idempotency_key: input.idempotency_key,
          })
          .select('ai_action_id')
          .single();
        if (error || !data) {
          log.error({ err: error?.message }, 'ai_actions insert failed');
          throw new Error(`ai_actions insert failed: ${error?.message ?? 'unknown'}`);
        }
        log.info(
          { ai_action_id: data.ai_action_id, tool_name: toolName },
          'ai_actions row written (dry-run)',
        );
        return {
          dry_run_entry_id: data.ai_action_id,
          status: 'proposed',
        };
      }
      // dry_run=false is replayed by /api/agent/confirm (master §13.3).
      // The orchestrator never posts directly; the confirm route
      // reads ai_actions.tool_input and replays with dry_run:false.
      throw new Error(`${toolName} with dry_run=false is not invoked via the orchestrator — use /api/agent/confirm (master §13.3)`);
    }

    // Non-ledger mutating tools — wrapped with withInvariants per
    // sub-brief §6.5 table.
    if (toolName === 'updateUserProfile') {
      // Own-profile-only: user_id comes from ctx.caller, not from
      // tool input. The tool schema is the patch only.
      return await withInvariants(
        userProfileService.updateProfile,
        { action: 'user.profile.update' },
      )(
        {
          user_id: ctx.caller.user_id,
          patch: validatedInput as UpdateUserProfilePatch,
        },
        ctx,
      );
    }

    if (toolName === 'createOrganization') {
      // Onboarding tool — org doesn't exist yet. withInvariants
      // Invariant 3 (org-access) and Invariant 4 (role) both skip
      // because input.org_id is undefined (CreateOrgProfileInput
      // has no org_id field).
      //
      // The agent's tool schema (createOrganizationInputSchema, 8
      // fields) is narrower than orgService's createOrgProfileSchema
      // which also requires accountingFramework + defaultReportBasis.
      // The DB columns for both have defaults ('aspe' / 'accrual'
      // per migration 109), so merging them at the dispatch site
      // keeps the agent's conversation light without a schema
      // reconciliation. Session 5 is the first session to exercise
      // this path end-to-end; the gap is the same class as Session
      // 4's missing idempotency_key column write.
      const toolInput = validatedInput as Record<string, unknown>;
      const serviceInput = {
        accountingFramework: 'aspe' as const,
        defaultReportBasis: 'accrual' as const,
        ...toolInput,
      } as CreateOrgProfileInput;
      return await withInvariants(
        orgService.createOrgWithTemplate,
        { action: 'org.create' },
      )(serviceInput, ctx);
    }

    if (toolName === 'updateOrgProfile') {
      // Patch-only tool input — orchestrator supplies org_id from
      // session.org_id. If the agent calls updateOrgProfile during
      // onboarding (session.org_id === null) we reject rather than
      // guessing which org to target.
      if (session.org_id === null) {
        throw new Error(
          'updateOrgProfile called without an active org (onboarding session)',
        );
      }
      return await withInvariants(
        orgService.updateOrgProfile,
        { action: 'org.profile.update' },
      )(
        {
          org_id: session.org_id,
          patch: validatedInput as UpdateOrgProfilePatch,
        },
        ctx,
      );
    }

    // Read-only tools — no withInvariants wrap; each service
    // performs its own org-access check via ctx.caller.org_ids.
    if (toolName === 'listIndustries') {
      return await orgService.listIndustries({}, ctx);
    }

    // Finding O2: read-tool schemas no longer carry org_id; the
    // orchestrator supplies it from session.org_id. The
    // ORG_SCOPED_TOOLS guard above guarantees non-null here.
    // Service signatures accept only { org_id } today; the tool
    // schemas' additional fields (include_inactive, limit,
    // offset) are forward-compatible and ignored by the service
    // as in the prior implementation.
    const orgId = session.org_id as string;

    if (toolName === 'listChartOfAccounts') {
      return await chartOfAccountsService.list({ org_id: orgId }, ctx);
    }

    if (toolName === 'checkPeriod') {
      const input = validatedInput as CheckPeriodInput;
      return await periodService.isOpen(
        { org_id: orgId, entry_date: input.entry_date },
        ctx,
      );
    }

    if (toolName === 'listJournalEntries') {
      return await journalEntryService.list({ org_id: orgId }, ctx);
    }

    // Unknown tool — shouldn't reach here (buildSystemPrompt + the
    // toolByName lookup in handleUserMessage gate this), but fail
    // loudly if it does.
    throw new Error(`executeTool: unhandled tool ${toolName}`);
  } finally {
    // Clarification D: skip the agent.tool_executed audit emit
    // when session.org_id is null (onboarding); the call site
    // services like orgService.createOrgWithTemplate already
    // capture their own provenance via withInvariants-driven
    // audit rows. Clarification F: try/catch prevents a thrown
    // audit error from poisoning the user-facing request — the
    // emit is outside a service transaction, so atomicity is
    // not guaranteed until Phase 2's events-table migration.
    if (session.org_id !== null) {
      try {
        await recordMutation(db, ctx, {
          org_id: session.org_id,
          action: 'agent.tool_executed',
          entity_type: 'agent_session',
          entity_id: session.session_id,
          tool_name: toolName,
        });
      } catch (err) {
        log.error(
          { err: String(err), action: 'agent.tool_executed', tool_name: toolName },
          'agent audit write failed; continuing (tx-atomicity gap per Clarification F)',
        );
      }
    }
  }
}

async function persistSession(
  sessionId: string,
  messages: Anthropic.Messages.MessageParam[],
  lastResponse: Anthropic.Messages.Message,
  trace_id: string,
  log: Logger,
  state?: Record<string, unknown>,
  newTurns?: unknown[],
): Promise<void> {
  const db = adminClient();
  // Record the assistant turn so the session transcript reflects
  // the full exchange.
  const conversation = [
    ...messages,
    { role: 'assistant' as const, content: lastResponse.content },
  ];
  // Sub-brief §6.4 item 5: the `state` parameter is passed from
  // the success path only. Failure paths (Q13 exhaustion,
  // structural-retry exhaustion) pass `undefined` so the column
  // is omitted from the UPDATE and the state machine does not
  // advance on a failed turn.
  //
  // Session 7 Commit 3 (Pre-decision 14): newTurns carries the
  // full replacement for agent_sessions.turns — caller computes
  // [...existingTurns, userTurn, assistantTurn] so every
  // persistSession path records the exchange symmetrically with
  // conversation. Omitted when callers have not migrated yet.
  const updatePayload: Record<string, unknown> = {
    conversation,
    last_activity_at: new Date().toISOString(),
  };
  if (state !== undefined) {
    updatePayload.state = state;
  }
  if (newTurns !== undefined) {
    updatePayload.turns = newTurns;
  }
  const { error } = await db
    .from('agent_sessions')
    .update(updatePayload)
    .eq('session_id', sessionId);
  if (error) {
    log.error({ err: error.message, session_id: sessionId, trace_id }, 'persistSession failed');
  }
}
