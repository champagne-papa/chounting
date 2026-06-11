# Ratified-contract scope discipline

When a ratified contract — an ADR, a ratified design spec, a governing
statement in canonical specs (e.g., the doc-sync-pass framing at
`invariants.md`'s "Bidirectional reachability statement") — names the
scope of a reconciliation, an amendment, or a deferred follow-up pass,
that scope binds the drafter. Adjacent issues uncovered while doing the
named work get **carry-forward framing**, not absorbed into the current
arc.

## What the discipline forbids

- Sweeping unrelated drift into a commit just because you're touching the
  same file (the locale-overlap trap).
- Expanding the substantive scope of an amendment beyond what the ratified
  contract named, because the expansion feels coherent.
- Authoring fixes for issues uncovered during characterization, before the
  characterization has surfaced for adjudication.

## What the discipline requires

- When you find drift adjacent to the named scope, **flag it for
  carry-forward** (tracker entry, friction-journal observation, separate
  commit, or future arc), NOT for absorption.
- When the carry-forward is small AND has clean substantive separation
  from the named work, a **companion commit** in the same arc is
  acceptable — but as its own commit, not folded into the scope-named
  one. (Item 6 → 6.5 split is the canonical example.)
- When the ratified contract is itself imprecise about scope, **the
  drafter's job is to surface the imprecision, not to interpret it
  outward**. The contract's text wins.

## Why this matters

Ratified contracts are the project's coordination substrate. If drafters
expand scope at will when a contract names work, the contract no longer
reliably predicts what a commit will touch. Reviewers reading the
contract need to read the commit too; commits stop being grep-able by
contract reference. The discipline preserves the contract → commit
mapping.

The opposite failure mode (drafters refusing adjacent work that's
genuinely in scope) is rarer in practice — most contracts are written
conservatively about scope, so drafter-expansion is the dominant failure
mode the discipline guards against.

## Worked instances

`hygiene-post-ring2a-core` arc, 2026-05-27:

- **Item 3** (`327e9cf6`): ADR-0025 forward-flagged the taxonomy
  vocabulary gap as a future hygiene pass. Item 3 added the two missing
  tokens but **deferred ADR frontmatter retrofits** (in scope by locale,
  out of scope per the "vocabulary pass" naming) to a follow-on item.
- **Item 5** (`92a79e25`): ADR-0025 §8 named `rule-type-core.md` §5.7
  prose as future doc-hygiene. Item 5 reconciled §5.7's two
  INV-AGENT-002 references but **left the §11.1 worked-example twin
  (L1525) uncoupled** — outside §8's named §5.7 scope, even though it
  referenced the same INV.
- **Item 6 → 6.5** (`4da0f01f` → `4ef072a9`): the locale-overlap test.
  Item 6 touched CLAUDE.md for a lint cross-reference. An invariants-
  count straggler in the same file (L14 "the 20 invariants") surfaced
  during the disk read. The straggler was **split into Commit B (item
  6.5)** rather than folded, because item 6's substantive scope was
  lint discipline, not invariant-count reconciliation. The locale-
  overlap of "we're editing CLAUDE.md anyway" did not license the
  expansion.
- **Item 8** (`00491e2c`): ADR-0025 §10 named the "recent matches"
  detail surface as needing a read endpoint over `rule_evaluation_log`.
  Item 8 **flagged the deferred work** (a small brief in `post-mvp/`)
  rather than authoring the endpoint, even though the brief's author
  had enough context to begin authoring.

Plus the loop-closing meta-instance: this codification's own bounded
read of the T8 dispatchTrigger deviation (Condition-1 characterization
in the same closeout) held to characterization, not investigation —
codifying a discipline that the codification act itself practices.

## When to apply

Any time the question "should I just fix this while I'm here?" arises.
The answer is almost always: **no — flag it, carry forward, ship the
named scope cleanly**.

---

**Origin:**
- First codified: `hygiene-post-ring2a-core` arc, 2026-05-27 (arc closeout).
- Evidence basis: N=4 within the hygiene arc (items 3 / 5 / 6 / 8 at
  `327e9cf6` / `92a79e25` / `4da0f01f` / `00491e2c`), plus the loop-
  closing meta-instances at the item 6 → 6.5 split (`4ef072a9`) and at
  this codification's own bounded-read discipline (held to Condition-1
  characterization, not investigation). Each was an adjudication moment
  where the discipline was load-bearing; held in every instance.
- Promoted from: empirical observation across hygiene-arc items 3 / 5 /
  6 / 6.5 / 8, surfaced consistently as "Decision-8 scope discipline" in
  arc-execution adjudications; no antecedent friction-journal entry —
  the discipline crystallized within this arc rather than graduating
  from a prior pattern.
- Cross-references: `docs/07_governance/friction-journal.md`
  (hygiene-post-ring2a-core arc-summary entry, 2026-05-27); ADR-0025 §8 +
  §10 (two of the four ratified contracts naming this hygiene arc's
  items); CLAUDE.md "Standing session principles" section.

**Evaluation basis:**

- **Load-bearing (prescriptive).** Generates operator action at scope-
  adjudication moments: when adjacent drift surfaces, the drafter
  applies the discipline by flagging for carry-forward rather than
  absorbing. Item 6 → 6.5 split is the canonical positive-instance —
  the discipline produced an observable artifact (a separate commit)
  that wouldn't exist without it.
- **Generalizable.** Applies wherever ratified contracts name scope:
  ADRs (the dominant case), spec governing statements
  (`invariants.md`'s "Bidirectional reachability statement" in item 4),
  design-spec amendments, brief-locked scopes, ratified-and-pinned
  plans. Substrate class is "ratified contract with named scope," not
  coupled to ADRs specifically. Generalizes naturally beyond hygiene-
  arc contexts.
- **Stable.** The discipline guards a drafter-side failure mode (scope
  expansion at will) that has not shown signs of going away. The
  convention's frame ("named scope binds the drafter") is invariant
  under the evolution of specific contracts.
