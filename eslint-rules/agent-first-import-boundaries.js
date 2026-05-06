// eslint-rules/agent-first-import-boundaries.js
//
// Custom ESLint rule that codifies the import boundary rules from
// ADR-0020 (Agent-First Authority-Gradient Source Architecture)
// Appendix A. Each authority layer has an allowed-import set and
// a disallowed-import set; this rule scans `import` declarations
// in files under apps/web/src/<layer>/ and reports disallowed
// crossings.
//
// Rule logic defined here. Severity is set in
// apps/web/eslint.config.mjs at severity: 'off' for the
// 2026-05-05 substrate session. When Phase 1 storage code
// lands, that session enables the rule as 'error' in
// eslint.config.mjs as part of its validation gate (ADR-0020
// Sub-verification 2). The pattern matches Q29 ESLint rule
// deferral and the original no-restricted-imports rule on
// @/db/adminClient.
//
// Layer detection from the importing file's path:
// - apps/web/src/agent/**     → layer 'agent'
// - apps/web/src/services/**  → layer 'services'
// - apps/web/src/core/**      → layer 'core'
// - apps/web/src/db/**        → layer 'db'
// - apps/web/src/app/**       → layer 'app'
// - apps/web/src/contracts/** → layer 'contracts'
// - apps/web/src/components/, hooks/, lib/, shared/, middleware/
//   → not scoped by this rule (cross-cutting)
//
// Import target classification from the import source string:
// - '@/agent/...'      → target 'agent'
// - '@/services/...'   → target 'services'
// - '@/core/...'       → target 'core'
// - '@/db/...'         → target 'db'
// - '@/app/...'        → target 'app'
// - '@/contracts/...'  → target 'contracts'
// - relative paths (./ or ../) resolving into one of the above
//   are classified by their resolved location
// - everything else (npm packages, framework imports, etc.) is
//   not in scope for this rule
//
// Per-layer allowed-target sets per ADR-0020 Appendix A:
// (verbatim from CTO Handoff v2 §11)
//
//   agent:     [contracts, services, shared, packages/flags]
//   services:  [core, db, contracts, shared, packages/flags]
//   core:      [shared]                       (primitives only)
//   db:        [shared (env)]                 (no business orchestration)
//   app:       [services, contracts, components, packages/ui, packages/flags]
//   contracts: [zod, primitive shared types]  (no services / agent / app / db)
//
// Substrate scaffold note: the rule's exact scoping for relative
// paths and for the cross-cutting layers (shared/, hooks/, lib/,
// components/, middleware/) is intentionally permissive at v1.
// The first-consumer activation session (Phase 1 chunk 1) refines
// scoping when real consumer code surfaces edge cases.
//
// Client-component import boundary (per ADR-0020 Appendix A): client
// components ('use client' files under app/ or components/) cannot
// import services/, agent/, db/, or server-only contracts. The v1
// scaffold does not yet detect the 'use client' pragma; the
// first-consumer activation session adds the pragma-detection pass
// when Phase 1's first storage code lands and the rule flips from
// 'off' to 'error'.

'use strict';

// Per-layer allow tables. Each importing layer maps to the set of
// target layers it may import from. Targets not in the allow list
// produce a violation report.
const LAYER_ALLOW = {
  agent: new Set(['contracts', 'services', 'shared']),
  services: new Set(['core', 'db', 'contracts', 'shared']),
  core: new Set(['shared']),
  db: new Set(['shared']),
  app: new Set(['services', 'contracts', 'shared']),
  contracts: new Set(['shared']),
};

// Layer-specific explicit-deny entries. These produce violation
// reports with a specific message rather than the generic
// "layer X cannot import from layer Y." Useful for the
// load-bearing rules in Appendix A (agent → db/adminClient is
// the canonical example).
const EXPLICIT_DENY = {
  agent: [
    {
      pattern: /^@\/db\/adminClient$/,
      message:
        'agent code must not import @/db/adminClient directly. ' +
        'Per ADR-0020 Appendix A: agent → contracts → services → db. ' +
        'See docs/03_architecture/agent-tool-architecture.md for the ' +
        'canonical call chain.',
    },
    {
      pattern: /^@\/db\/repositories\//,
      message:
        'agent code must not import db repositories directly. ' +
        'Per ADR-0020 Appendix A: agent calls services; services ' +
        'call db. See docs/03_architecture/authority-gradient.md.',
    },
  ],
  core: [
    {
      pattern: /^@\/(db|services|agent|app)\//,
      message:
        'core/ code must not import db, services, agent, or app. ' +
        'Per ADR-0020 Appendix A: core/ is pure functions only ' +
        '(no DB, no network, no agent, no UI). See ' +
        'docs/03_architecture/folder-structure.md core/ section.',
    },
  ],
};

// Map an importing file's path to its authority layer.
// Returns null for cross-cutting / out-of-scope locations.
function detectImporterLayer(filename) {
  // Normalize to forward slashes for cross-platform stability.
  const f = filename.replace(/\\/g, '/');

  // Match against apps/web/src/<layer>/ patterns. Both absolute
  // and apps/web-relative paths are accepted because ESLint can
  // pass either depending on invocation.
  const match = f.match(/(?:^|\/)apps\/web\/src\/([^/]+)\//);
  if (!match) {
    // Fall back to src/<layer>/ when ESLint runs with cwd=apps/web.
    const fallback = f.match(/(?:^|\/)src\/([^/]+)\//);
    if (!fallback) return null;
    return classifyLayer(fallback[1]);
  }
  return classifyLayer(match[1]);
}

function classifyLayer(segment) {
  switch (segment) {
    case 'agent':
    case 'services':
    case 'core':
    case 'db':
    case 'app':
    case 'contracts':
      return segment;
    default:
      // components, hooks, lib, shared, middleware: cross-cutting,
      // not scoped by this rule at v1.
      return null;
  }
}

// Map an import source string to a target layer. Returns null
// for out-of-scope sources (npm packages, framework imports,
// etc.).
function classifyImportTarget(source) {
  // @/<layer>/... aliased imports
  const aliasMatch = source.match(/^@\/([^/]+)/);
  if (aliasMatch) {
    return classifyLayer(aliasMatch[1]);
  }
  // Bare specifier — treat as out-of-scope (npm package, etc.)
  if (!source.startsWith('.')) return null;
  // Relative path: at v1 we don't fully resolve relative paths.
  // The first-consumer session (Phase 1 chunk 1) refines this
  // when relative-path edge cases surface.
  return null;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'ADR-0020 Appendix A — agent-first authority-gradient ' +
        'import boundaries. Each authority layer has a defined ' +
        'allowed-import set; this rule reports crossings that ' +
        'violate the layer dependency direction.',
    },
    schema: [],
    messages: {
      disallowedImport:
        "Layer '{{importerLayer}}' may not import from layer " +
        "'{{targetLayer}}'. Per ADR-0020 Appendix A: " +
        '{{importerLayer}} → {{allowedTargets}}.',
      explicitDeny: '{{message}}',
    },
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const importerLayer = detectImporterLayer(filename);

    // Cross-cutting / out-of-scope file: rule does not apply.
    if (!importerLayer) return {};

    const allowedTargets = LAYER_ALLOW[importerLayer] || new Set();
    const denyRules = EXPLICIT_DENY[importerLayer] || [];

    function check(node, source) {
      if (typeof source !== 'string') return;

      // Explicit-deny pass first (more specific message).
      for (const deny of denyRules) {
        if (deny.pattern.test(source)) {
          context.report({
            node,
            messageId: 'explicitDeny',
            data: { message: deny.message },
          });
          return;
        }
      }

      // Generic layer-vs-layer check.
      const targetLayer = classifyImportTarget(source);
      if (!targetLayer) return; // out-of-scope (npm package, etc.)
      if (targetLayer === importerLayer) return; // intra-layer is fine

      if (!allowedTargets.has(targetLayer)) {
        context.report({
          node,
          messageId: 'disallowedImport',
          data: {
            importerLayer,
            targetLayer,
            allowedTargets: Array.from(allowedTargets).sort().join(', '),
          },
        });
      }
    }

    return {
      ImportDeclaration(node) {
        check(node, node.source && node.source.value);
      },
      ImportExpression(node) {
        const src = node.source;
        if (src && src.type === 'Literal') check(node, src.value);
      },
    };
  },
};
