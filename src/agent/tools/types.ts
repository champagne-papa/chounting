// src/agent/tools/types.ts
//
// Shared base type + defineTool helper for the agent tool registry.
// Introduced at S30 LT-04 closure to enforce the per-tool
// `gatedByDispatcherSet: boolean` decision at the type level.
//
// `BaseToolDef` is the minimal contract every tool must satisfy:
// - name / description / input_schema / zodSchema (existing)
// - gatedByDispatcherSet (new at S30): does this tool's null-org
//   rejection happen at the orchestrator's ORG_SCOPED_TOOLS Set
//   membership lookup?
//
// `defineTool` is a generic identity helper that constrains its
// argument to `BaseToolDef`. It preserves the literal shape via
// `<T extends BaseToolDef>` so each tool's specific `name` /
// `zodSchema` types flow through to the union in toolsForPersona.ts.
// Compile-time enforcement: any tool object missing
// `gatedByDispatcherSet` (or with a non-boolean value) is rejected
// at the defineTool call site.
//
// Hard constraint C (S30 brief): required field, no default, no
// optional marker.

export interface BaseToolDef {
  name: string;
  description: string;
  input_schema: unknown;
  zodSchema: unknown;
  /**
   * True if this tool's null-org rejection is gated by membership
   * lookup in the orchestrator's ORG_SCOPED_TOOLS Set
   * (executeTool dispatcher). Tools with their own per-tool inline
   * null-org check (e.g., updateOrgProfile) or tools that
   * legitimately run with `session.org_id === null` (onboarding
   * tools, globally-shared reference reads, structural tools)
   * have `false`.
   *
   * Drives `ORG_SCOPED_TOOLS` derivation in
   * `src/agent/tools/orgScopedTools.ts`. The drift test in
   * `tests/unit/agent/orgScopedTools.test.ts` asserts the Set
   * matches the filter result.
   */
  gatedByDispatcherSet: boolean;
}

export function defineTool<T extends BaseToolDef>(tool: T): T {
  return tool;
}
