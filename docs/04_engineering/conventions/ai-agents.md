# AI-agent conventions

Agent-tool authoring rules, agent-mediated session discipline, and
the conventions that govern how AI agents interact with chounting's
data model and ai_action surfaces.

See [`README.md`](./README.md) for the routing rule that determines
when a rule belongs here vs. another topical file.

Agent-tool authoring rules also live in the `agent-tool-authoring`
skill at `.claude/skills/agent-tool-authoring/`. This file holds the
codified procedural conventions that earned their place at ≥3 fires;
the skill holds the operational checklist that fires when editing
agent tooling.

---

## Per-Entry Row-Card Pairing Post-Paste Verification

Each agent-mediated session that posts via tools verifies the
row+card structural pairing at the entry boundary, after the
operator paste has landed in the agent UI. Before each agent-
initiated action that may write a `pending` `ai_action` — and as
the immediate post-paste verification step on operator-paste turns —
the executor or EC verifies that no orphaned `pending` `ai_actions`
exist for the active `session_id`. An orphan is a `pending` row
without a paired ProposedEntryCard via matching
`idempotency_key` (the Site 2 post-fill pairing established by
OI-2). The check is generic SQL
(`SELECT COUNT(*) FROM ai_actions WHERE
session_id=<current> AND status='pending'` plus the row-card
pairing inspection on any non-zero count) and is failure-class-
agnostic: it catches orphans regardless of the failure mechanism
that produced them.

**Pairing — what the verification is actually about (Obs-C,
captured in `phase-1.2-retrospective.md` §3 Pattern 6; original
section (o), commit `5fb3b7b`):** orphan-prevention is two-part
structural (pending row + paired ProposedEntryCard via matching
`idempotency_key`), not row-presence-state. A pending row with a
paired card is a normal in-flight proposal; a pending row without a
paired card is the orphan signature this convention catches. The
verification's load-bearing check is the pairing, not the row count
alone.

**Temporal scope — post-paste verification, not preflight gating
(Cluster B Item 1 / Obs-F, captured in
`phase-1.2-retrospective.md` §3 Pattern 6; original section (p),
commit `f221bab`):** the agent UI's paste-acceptance is permissive
(input field accepts paste whenever submission is enabled), and the
WSL-Claude-backend verification runs in the backend loop unaware of
UI state. The two surfaces are not synchronized; the verification
cannot block the paste before the fact. It catches orphan state
existing when the verification runs, but does not catch orphan
state arising during the gap between UI paste and backend
verification. An optional UI-side interlock (input field disabled
while WSL loop has unresolved disposition routing) is a separate
UX-backlog item, not blocked on this convention.

Rationale: source evidence from S8-0424/0425 Phase E (C6 EC-2
actual run). The verification caught all 7 staled orphans correctly
across two distinct failure classes during the run — 5 OI-2 stalls
(false-success narration with no card rendered;
`agent.response.natural` template variant emitted) and 2
structural-response-invalid events (Entry 12; agent emitted valid
`tool_input` but failed `respondToUser` emission across
`STRUCTURAL_MAX_RETRIES`). The mechanism does not require the
operator or EC to know in advance which class will fire. Full
source detail in
`docs/07_governance/friction-journal/phase-1.2.md` Phase E sections
(i) and (j); rename rationale captured in
`docs/07_governance/retrospectives/phase-1.2-retrospective.md` §3
Pattern 6 (Cluster B Item 1 in original section (p) and Obs-C in
original section (o)).

Scope: applies to any session that posts to `ai_actions` via the
agent toolchain. Entry boundary = the immediate post-paste window
in agent-mediated runs (the natural unit of work for paid-API
verification sessions); generalizes to any agent-initiated action
that may write a `pending` row in sessions where pending orphans
can accumulate. Resolution path for non-zero pending count: stale
the orphans with `status='stale'` + `staled_at` timestamp +
descriptive reason-string (per the `stale_status_has_timestamp`
check constraint); operator approves the SQL before execution per
the Mutual Hallucination-Flag-and-Retract Discipline EC-direction
sub-track datapoint EC-#4 (see
[`session/iterative-catching.md`](./session/iterative-catching.md)).

Composes with: **Mutual Hallucination-Flag-and-Retract Discipline
EC-direction sub-track** (in [`session/iterative-catching.md`](./session/iterative-catching.md))
— sibling pre-action hygiene rule; this convention verifies session
state while EC-direction qualifies EC-claim shape; they reinforce
rather than overlap. **Re-verify Environmental Claims at Each Gate**
(in [`session/iterative-catching.md`](./session/iterative-catching.md)) — this
convention is a gate-time environmental-anchor check on agent-
session state, making it a mechanical enforcer of that broader
convention's intent. **Session Lock File Convention** (in
[`session/iterative-catching.md`](./session/iterative-catching.md)) — operates within
active session-lock context; `session_id` from `agent_sessions` is
distinct from the session-lock label, but both anchor at session-
start and decay if not verified.

---
**Origin:**
- First codified: Phase 1.2, 2026-04-25, C6 closeout commit (prior
  name: "Per-Entry Pending-Orphan Preflight")
- Evidence basis: N=7 staled orphans across two failure classes
  caught at S8-0424/0425 Phase E C6 EC-2 actual run
- Promoted from:
  `docs/07_governance/friction-journal/phase-1.2.md` Phase E
  section (i); rename evidence captured in
  `docs/07_governance/retrospectives/phase-1.2-retrospective.md`
  §3 Pattern 6 (section (o) Obs-C, commit `5fb3b7b`; section (p)
  Cluster B Item 1, commit `f221bab`)
- Cross-references: ADR-0009 (before-state-capture convention);
  Mutual Hallucination-Flag-and-Retract Discipline EC-direction
  sub-track (in `session/iterative-catching.md`); Re-verify Environmental
  Claims at Each Gate (in `session/iterative-catching.md`); Session Lock
  File Convention (in `session/iterative-catching.md`)
- Rename and amendment: 2026-04-26 (renamed from "Per-Entry
  Pending-Orphan Preflight" to surface row+card structural pairing
  per Obs-C, and to flip temporal framing from "preflight gating"
  to "post-paste verification" per Cluster B Item 1)
