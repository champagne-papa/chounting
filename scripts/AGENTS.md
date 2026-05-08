# scripts/

`scripts/*.sh` is bash for shell-shaped cross-repo operations (session lifecycle, install hooks, validation, floor tests, friction-journal audits — the existing convention). `scripts/<domain>/*.ts` is TypeScript (runtime `tsx`) for cross-repo docs / governance tooling per ADR-0021 Decision item 3 — current consumers: `scripts/adr/` (linter + index generator); reserved: `scripts/briefs/` (Session 5) and `scripts/docs/` (Session 6). Language choice follows shape of work, not folder location.
