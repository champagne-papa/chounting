// eslint-rules/withInvariants-wrap-or-annotate.js
//
// LT-01(b) custom ESLint rule (S30; UF-006 mechanism facet).
//
// Asserts: every property of every `export const <serviceName> = {
// ... }` literal in src/services/**/*.ts is either
// (i) wrapped in `withInvariants(...)` at the property value
// (Pattern A), OR
// (ii) preceded by a canonical-form annotation comment matching
// `// withInvariants: skip-org-check (pattern-X: rationale-string)`.
//
// Empty starting allowlist (annotation-default discipline; allowlist
// reserved for future standing-architectural exemptions where rule-
// scope-refinement isn't viable).
//
// Handles two AST shapes:
// - Object-literal method shorthand: `async name(...) {...}` →
//   Property{method: true, value: FunctionExpression}.
// - Bare property reference (function imported into the literal):
//   `post,` → Property{shorthand: true, value: Identifier}.
//
// Wrap detection: Property{value: CallExpression} with callee
// Identifier 'withInvariants'.

'use strict';

const CANONICAL_FORM = /^\/\/\s*withInvariants:\s*skip-org-check\s*\(pattern-[A-Z][A-Z0-9]?:\s*.+\)\s*$/;

function isWithInvariantsCall(node) {
  return (
    node &&
    node.type === 'CallExpression' &&
    node.callee &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'withInvariants'
  );
}

function hasCanonicalAnnotation(comments) {
  if (!comments || comments.length === 0) return false;
  for (const c of comments) {
    if (c.type !== 'Line') continue;
    const raw = `//${c.value}`;
    if (CANONICAL_FORM.test(raw)) return true;
  }
  return false;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Service-layer org-scoped exports must be wrapped in withInvariants() or annotated with a canonical-form skip-org-check comment.',
    },
    schema: [],
    messages: {
      missingWrapOrAnnotate:
        "Service-layer export '{{name}}' must be either wrapped in withInvariants(...) or preceded by a canonical-form skip-org-check comment matching `// withInvariants: skip-org-check (pattern-X: rationale-string)` (S29a; UF-006 mechanism facet).",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();

    function checkProperty(prop) {
      // Skip non-Property nodes (SpreadElement etc.)
      if (prop.type !== 'Property') return;

      // Pass: property value is `withInvariants(...)` call
      if (isWithInvariantsCall(prop.value)) return;

      // Pass: leading canonical-form annotation comment
      const leading = sourceCode.getCommentsBefore(prop);
      if (hasCanonicalAnnotation(leading)) return;

      // Resolve a name for the message
      let name = '<anonymous>';
      if (prop.key && prop.key.type === 'Identifier') {
        name = prop.key.name;
      } else if (prop.key && prop.key.type === 'Literal') {
        name = String(prop.key.value);
      }

      context.report({
        node: prop,
        messageId: 'missingWrapOrAnnotate',
        data: { name },
      });
    }

    return {
      ExportNamedDeclaration(node) {
        const decl = node.declaration;
        if (!decl || decl.type !== 'VariableDeclaration') return;
        for (const declarator of decl.declarations) {
          const init = declarator.init;
          if (!init || init.type !== 'ObjectExpression') continue;
          for (const prop of init.properties) {
            checkProperty(prop);
          }
        }
      },
    };
  },
};
