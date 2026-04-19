// src/agent/orchestrator/index.ts
// Phase 1.2 Session 2 — the Double Entry Agent orchestrator.
// Master brief §5.1 signatures, §5.2 main loop.
//
// In Session 2 callClaude is fixture-driven. Session 4 swaps in
// the real Anthropic client without touching this file.
//
// Main-loop steps (master §5.2):
//   1. loadOrCreateSession
//   2. orgContextManager.load       — DEFERRED to Session 4
//   3. getPersonaForUser             — via getMembership
//   4. buildSystemPrompt             — DEFERRED to Session 3 (placeholder)
//   5. Conversation truncation       — full history (master §5.2 step 5)
//   6. callClaude                    — mocked via fixture queue
//   7. Tool-call validation retry    — Q13 budget, max 2
//   8. executeTool                   — inline dispatcher
//   9. persistSession                — updates conversation + last_activity_at
//  10. extractResponse               — respondToUser tool_use

import type Anthropic from '@anthropic-ai/sdk';
import type { Logger } from 'pino';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import type { CanvasContext } from '@/shared/types/canvasContext';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import type { ProposedEntryCard } from '@/shared/types/proposedEntryCard';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import { adminClient } from '@/db/adminClient';
import { getMembership } from '@/services/auth/getMembership';
import type { UserRole } from '@/services/auth/canUserPerformAction';
import { callClaude } from './callClaude';
import { loadOrCreateSession } from './loadOrCreateSession';
import { toolsForPersona, type Persona } from './toolsForPersona';
import { buildSystemPrompt } from './buildSystemPrompt';

const Q13_MAX_VALIDATION_RETRIES = 2;
const STRUCTURAL_MAX_RETRIES = 1;
const MODEL = 'claude-sonnet-4-20250514';

export interface HandleUserMessageInput {
  user_id: string;
  org_id: string | null;
  locale: 'en' | 'fr-CA' | 'zh-Hant';
  message: string;
  session_id?: string;
  canvas_context?: CanvasContext;
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
}

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

  // Step 1: session
  const session = await loadOrCreateSession(
    {
      user_id: input.user_id,
      org_id: input.org_id,
      locale: input.locale,
      session_id: input.session_id,
    },
    log,
  );

  // Step 3: persona (simplified for Session 2 — no org means controller
  // for onboarding flow scaffolding; Session 5 refines).
  const persona = await resolvePersona(input.user_id, input.org_id);
  const tools = toolsForPersona(persona);
  const toolByName: Map<string, (typeof tools)[number]> = new Map(
    tools.map((t) => [t.name as string, t] as const),
  );

  // Step 4: system prompt via buildSystemPrompt (Session 3). Session
  // 4 will load orgContext via OrgContextManager; Session 3 passes
  // null so the builder's onboarding branch and skeleton identity
  // block carry through.
  const system = buildSystemPrompt({
    persona,
    orgContext: null,
    locale: input.locale,
    canvasContext: input.canvas_context,
    user: { user_id: input.user_id },
  });

  // Step 5: full conversation history (master §5.2 step 5 — no
  // truncation, no rolling window in Phase 1.2).
  const messages: Anthropic.Messages.MessageParam[] = [
    ...(session.conversation as Anthropic.Messages.MessageParam[]),
    { role: 'user', content: input.message },
  ];

  let validationRetries = 0;
  let structuralRetries = 0;

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

      const parsed = def.zodSchema.safeParse(tu.input);
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

      try {
        const output = await executeTool(tu.name, parsed.data, ctx, session.session_id, log);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(output),
        });
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

    // Q13 budget: if validation failed, retry up to MAX times
    if (hadValidationError) {
      validationRetries += 1;
      if (validationRetries > Q13_MAX_VALIDATION_RETRIES) {
        log.warn({ retries: validationRetries }, 'Q13 budget exhausted — surfacing clarification');
        await persistSession(session.session_id, messages, resp, ctx.trace_id, log);
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
    if (respondBlock) {
      await persistSession(session.session_id, messages, resp, ctx.trace_id, log);
      const parsedRespond = (respondBlock.input as {
        template_id: string;
        params: Record<string, unknown>;
        canvas_directive?: CanvasDirective;
      });
      log.info(
        { template_id: parsedRespond.template_id, had_tool_calls: otherTools.length > 0 },
        'handleUserMessage: response extracted',
      );
      return {
        session_id: session.session_id,
        response: {
          template_id: parsedRespond.template_id,
          params: parsedRespond.params,
        },
        canvas_directive: parsedRespond.canvas_directive,
        trace_id: ctx.trace_id,
      };
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
      await persistSession(session.session_id, messages, resp, ctx.trace_id, log);
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
  // Onboarding path: no org yet — the user will become a controller
  // of the org they create (master decision A). Session 5 refines
  // the onboarding persona flow end-to-end; Session 2's stub is
  // sufficient for orchestrator tests that don't exercise the
  // persona-pre-org case.
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
  sessionId: string,
  log: Logger,
): Promise<unknown> {
  // Ledger-mutating tools with dry_run=true write ai_actions
  // (master §5.8 trace_id propagation; §6.5 dry_run scope).
  if (toolName === 'postJournalEntry' || toolName === 'reverseJournalEntry') {
    const input = validatedInput as {
      org_id: string;
      dry_run?: boolean;
      idempotency_key?: string;
    };
    if (input.dry_run === true) {
      if (!input.idempotency_key) {
        throw new Error('idempotency_key required on agent-sourced dry_run');
      }
      const db = adminClient();
      const { data, error } = await db
        .from('ai_actions')
        .insert({
          org_id: input.org_id,
          user_id: ctx.caller.user_id,
          session_id: sessionId,
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
    // dry_run=false path — Session 4 wires the real journalEntryService.post
    throw new Error(`${toolName} with dry_run=false not yet wired (Session 4)`);
  }

  // Session 2 stubs for remaining tools. Session 4 wires real
  // service calls for updateUserProfile/createOrganization/
  // updateOrgProfile; the read-only tools (list*, checkPeriod)
  // likewise get real implementations in Session 4 or beyond.
  log.debug({ tool_name: toolName }, 'executeTool: session-2 stub');
  return { tool: toolName, status: 'session-2-stub' };
}

async function persistSession(
  sessionId: string,
  messages: Anthropic.Messages.MessageParam[],
  lastResponse: Anthropic.Messages.Message,
  trace_id: string,
  log: Logger,
): Promise<void> {
  const db = adminClient();
  // Record the assistant turn so the session transcript reflects
  // the full exchange.
  const conversation = [
    ...messages,
    { role: 'assistant' as const, content: lastResponse.content },
  ];
  const { error } = await db
    .from('agent_sessions')
    .update({
      conversation,
      last_activity_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId);
  if (error) {
    log.error({ err: error.message, session_id: sessionId, trace_id }, 'persistSession failed');
  }
}
