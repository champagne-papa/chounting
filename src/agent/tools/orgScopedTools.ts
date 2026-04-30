// src/agent/tools/orgScopedTools.ts
//
// Derived ORG_SCOPED_TOOLS Set. Single source of truth for "tools
// whose null-org rejection is gated by Set membership at the
// orchestrator dispatcher (executeTool)." Tools with their own
// per-tool null-org check (e.g., updateOrgProfile at the per-tool
// dispatcher case) are intentionally excluded; the
// `gatedByDispatcherSet` flag on each ToolDef is the canonical
// decision point.
//
// LT-04 / QUALITY-006 closure (S30; Path C arc). The drift test in
// `tests/unit/agent/orgScopedTools.test.ts` asserts derivation
// correctness against the registry.

import * as tools from './index';

export const ORG_SCOPED_TOOLS: ReadonlySet<string> = new Set(
  Object.values(tools)
    .filter((t) => t.gatedByDispatcherSet)
    .map((t) => t.name),
);
