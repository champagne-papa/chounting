# Product Requirements Documents

**Document class: PRDs.** Feature-level product intent
documents — the bridge between product vision (`/00_product/`)
and system specs (`/02_specs/`). The canonical axis is
feature-level-intent: what features should do and why, separate
from architecture (`/03_architecture/`) and execution
(`/09_briefs/`). PRD-vs-feature-spec terminology distinction is
acknowledged but not litigated; this folder holds feature-level
intent under either name.

What goes here: feature-level product intent documents — what
the feature should do, who it's for, what makes it valuable,
what constraints apply. Current contents are Phase 2 feature
specs from the agent autonomy design sprint
(2026-04-16 provenance encoded in each file's `Status:` header).
Future PRDs land here when features need product-level intent
docs separate from architecture and execution. An `ls` is the
inventory; per V2 Part 1 Principle 2, top-level folders are
document classes (not file indexes), so individual files are not
enumerated here.

What does NOT go here: product vision and constraints
(→ `/00_product/`); system invariants and enforcement-bearing
rules (→ `/02_specs/`); system design and component
relationships (→ `/03_architecture/`); implementation surface
(→ `/04_engineering/`); per-phase execution briefs and
chunks (→ `/09_briefs/`).

Cross-references: `/00_product/` (product vision; the upstream
class that informs feature intent); `/02_specs/` (system truth;
the downstream class that enforces feature intent in code);
`/04_engineering/` (implementation surface); `/09_briefs/`
(per-phase execution).
