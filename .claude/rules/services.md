---
paths:
  - "apps/web/src/services/**/*.ts"
  - "apps/web/src/app/api/**/route.ts"
---

# Service-layer rule (path-scoped)

When editing service code under `apps/web/src/services/` or API
route handlers under `apps/web/src/app/api/**/route.ts`:

- **Zod boundary validation.** Use `.strict()` for chounting-defined
  shapes; `.passthrough()` only for third-party API responses. See
  `docs/04_engineering/conventions/schema.md` "Zod Schema Strictness"
  for full discipline.
- **`withInvariants` wrapping.** Route handlers wrap service
  functions in `withInvariants(serviceFn)(input, ctx)`. Service
  functions accept `(input, ctx: ServiceContext)`. See
  `docs/04_engineering/conventions/service-layer.md` "Service Function
  Template" + "The Same Schema, Three Consumers".
- **trace_id / idempotency propagation.** Every service call
  threads `ctx.trace_id`; idempotency check is the first step after
  Zod re-validation (BEFORE authorization). See the service template
  in `service-layer.md`.
- **Error-handling discipline.** Every `catch`, `if (error)`, and
  assigned-but-unused error variable must throw, `log.error` with
  context, or carry a comment explaining why the error is safe to
  swallow. Silent absorption is a review-fail. See `service-layer.md`
  "Error-Handling Review Rule".
- **`before_state` capture for audit-logged mutations.** Every
  mutating service writes `before_state` to `audit_log` before
  performing the mutation. See
  `docs/04_engineering/conventions/audit-permissions.md`.

This is an operational projection of canonical conventions; for
edge cases or full discipline, read the topical files above.
