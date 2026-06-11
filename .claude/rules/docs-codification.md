---
paths:
  - "docs/07_governance/friction-journal.md"
  - "docs/07_governance/friction-journal/**/*.md"
  - "docs/07_governance/retrospectives/**/*.md"
  - "CLAUDE.md"
  - "docs/04_engineering/conventions/**/*.md"
---

# Docs-codification rule (path-scoped) — load-bearing routing pointer

When editing the friction-journal, retrospectives, CLAUDE.md, or
the topical conventions files — i.e., the surfaces where new
codifications land:

- **Invoke the `codify-convention` skill before adding any new
  codified rule.** When a friction-journal pattern has fired
  observation-grain N≥3 times and is graduating to a codified
  convention, the skill walks the routing decision tree, picks
  the destination file, and drafts the codification block with
  origin metadata. See `.claude/skills/codify-convention/SKILL.md`.
- **Canonical routing source.** The routing decision tree lives
  at `docs/04_engineering/conventions/README.md` "Routing rule"
  + "Routing decision tree". The `codify-convention` skill
  projects this; if the README changes, the skill follows.
- **Observation-grain vs application-grain N count.** Observation-
  grain N (the pattern surfaces as a new finding in distinct
  sessions / chunks / contexts) is the codification threshold;
  application-grain N within one session is one instance from
  threshold-counting perspective. See
  `docs/04_engineering/conventions/README.md` "Codification
  convention: observation-grain vs application-grain N count".
- **Origin-metadata footer format.** Every codified rule carries
  a standardized footer (`First codified` / `Evidence basis` /
  `Promoted from` / `Cross-references`) per v2.2 §5.3. The
  `codify-convention` skill drafts it.
- **Default-to-CLAUDE.md anti-pattern.** If a candidate looks like
  it wants to go in CLAUDE.md but its trigger description doesn't
  match "fires every session" or "fires every session that does
  X-shape common work," redirect to the appropriate topical file.
  This is the failure mode the routing forcing function exists to
  prevent.

This rule is the load-bearing pointer of the post-reorg routing
forcing function. Four redundant pointers per v2.2 §10.5:
this rule + `conventions/README.md` (canonical) +
`codify-convention` skill + CLAUDE.md "Codification routing"
section.
