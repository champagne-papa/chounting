# Agent Ladder

Per ADR-0020 Decision item 5, this folder is the empty target
home for Agent Ladder implementation. Three-rung autonomy:
Always Confirm / Notify & Auto-Post / Silent Auto, plus
promotion ceremonies, demotion paths, track-record state.

Canonical authority: docs/02_specs/agent_autonomy_model.md
Implementation begins: Phase 2 (interaction model extraction)

Important: Agent Ladder *policy logic* (decision rules,
promotion/demotion conditions) lives here in agent/.
Agent Ladder *durable state* (track records, rule rungs,
promotion ceremonies as audit events) is persisted through
services and the database — never held only in agent memory.
Per ADR-0020 dependency direction: agent code calls services;
services write to db.
