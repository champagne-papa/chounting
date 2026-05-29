# Four-category prompt-drift typology

When a prompt — an arc resumption directive, an ADR draft, a brief,
a session-handoff — frames expected substrate or state, the prompt's
framing is subject to four structurally distinct categories of drift
between prompt-encoding-time and prompt-execution-time. Each category
catches drift by a different discriminator; the typology operates as
a HEAD-pass checklist that future arcs run against their own prompts
rather than rediscovering each class cold.

## The four categories

- **(A) prompt-vs-disk.** The prompt asserts substrate state that
  has drifted from disk-truth. Discriminator: **read the substrate
  directly**. Don't trust the prompt's account of what exists at
  disk.

- **(B) prompt-vs-ratified-contract.** The prompt paraphrases a
  ratified contract (ADR, design spec, governing statement) and the
  paraphrase has drifted from the contract's text. Discriminator:
  **re-read the ratified contract's exact text**. Don't trust a
  rollout summary's paraphrase of an ADR's Decisions section.

- **(C) prompt-vs-running-environment.** The prompt assumes runtime-
  environment state (local DB state, migration apply order, lock
  presence, env-var values) that doesn't match the executor's actual
  environment. Discriminator: **verify the executor's running
  environment** matches the prompt's assumed state.

- **(D) gap-fill at consumer.** Earlier work introduced state that
  the prompt's framing doesn't surface to the consumer that needs to
  know about it. The drift is in what the prompt does NOT say rather
  than what it asserts. Discriminator: **at the consumer site, ask
  what would be needed to complete the work** — name the gap rather
  than fill it silently.

## How to apply

At every prompt's HEAD pass, before authoring substantive work:

1. **(A) Disk verification.** Read the substrate (files, git state,
   schema, working tree, origin/staging HEAD) the prompt asserts.
   Surface any delta between prompt-claimed and disk-actual state.

2. **(B) Ratified-contract verification.** For every cited ADR,
   spec, or governing statement, re-read the contract's text
   directly. Don't paraphrase from memory or from the prompt's
   summary.

3. **(C) Environment verification.** Confirm the executor's running
   environment matches assumed state (DB schema applied, migrations
   current, lock state, env-vars set, network reachability).

4. **(D) Gap-fill at consumer.** Identify earlier-work side effects
   the prompt doesn't surface. Name the gap; don't fill silently.

When any category surfaces drift, **stop, surface, hold for
adjudication** before proceeding with the prompt's substantive work.
The catch is the discipline working at the cheapest available layer
(HEAD-pass before downstream commits land).

## Worked instances

`hygiene-post-ring2a-core` arc, 2026-05-27 close:

- **ADR-0025 Ring 2A-core rollout banking** (`8a69ab8f` →
  `dc1d959e`): the originating observation. Five-commit rollout
  produced one catch per category: (A) at commit 2 (`101e7920` —
  prompt assumed `rule_registry` would land in commit 3, but disk
  had it at HEAD from a prior Ring 1 arc); (B) at commit 3
  (`eaccc37d` — five service-method signatures drifted from ratified
  Decisions 6/7 during prompt-drafting); (C) at commit 3 test
  session (PGRST202 until migration `20240165` applied locally);
  (D) at commit 4 (`c326adb8` — Commit 3's additions surfaced
  gap-fill needs).
- **Hygiene close meta-observation** (`9f320ded`): "four-category
  vigilance extends from drafter-side to reviewer-side" generalized
  the discipline. Explicit framework citation by name; framework's
  second observation-grain instance per the codification taxonomy.

`T8 dispatchTrigger investigation` arc, 2026-05-28 close
(`183935ee`):

- **Category-A-shaped catch (mechanism-tagged at graduation
  review).** HEAD-pass disk-read falsified the hygiene closeout's
  date-arithmetic hypothesis; the actual mechanism was PostgREST
  truncation. The catch substantively instantiates category-A's
  read-disk discriminator (don't trust the prompt's projection),
  caught the drift before the investigation arc invested in the
  wrong hypothesis. T8 closeout does not cite the framework by
  name; loose-interpretation per the README §family-tag assignment
  convention's mechanism-tagging-at-graduation-time-discriminator
  counts the catch as a framework-mechanism instance.

`umbrella test-isolation discipline` arc, 2026-05-28 close
(`462ad426`):

- **Two category-A-shaped catches (mechanism-tagged at graduation
  review).** Umbrella closeout banks them as meta-observations of
  their own shape (not as framework instances by name); loose-
  interpretation counts them as framework mechanism instances.
  Meta-observation #1: convention-existence catch — resumption
  prompt named `docs/04_engineering/conventions/testing.md` as the
  venue to check for existing test-isolation convention; HEAD-pass
  found the canonical discipline at
  `.claude/skills/integration-test-rules/SKILL.md` §3. Meta-
  observation #2: substrate-deletability-vs-failure-mode-axis
  distinction — class conflation in the prompt's framing surfaced
  via mechanism analysis at sub-class grain.

`companion-462ad426` arc, 2026-05-29 close (`a4cc0f02`):

- **Clean execution baseline**: the arc itself didn't fire fresh
  (A)-class drift; banked sub-observations recorded prior arcs'
  catches as substrate. Clean-execution arcs are part of the
  evidence basis — they demonstrate the discipline-working
  baseline against which manifestation counts get calibrated.

`typology codification` arc, 2026-05-29 (loop-closing meta-
instance):

- **(A) Lineage-anchor drift caught at HEAD-pass step 2.**
  `origin/staging` was at `462ad426` (umbrella close), not
  `a4cc0f02` (companion close) as the resumption prompt asserted.
  Caught via the category-A discriminator (read disk, don't trust
  prompt's projection). The codification arc itself manifested
  category-A drift at HEAD-pass; the discipline being codified
  caught it via its own mechanism — loop-closing meta-instance
  shape, same as T4's "codifying a discipline that the codification
  act itself practices." The catch's sub-pattern mechanism (the
  advisor + operator + executor bilateral-grain affirmation
  feedback loop bypassing single-side review) is documented at
  `projection-from-model.md`'s Worked instances.

## When to apply

At every prompt's HEAD pass. The typology operates *on prompts*, so
the application surface is the moment a prompt is received and
HEAD-pass begins. Catches at HEAD-pass are the cheapest layer;
catches at downstream commits, post-commit review, or post-push are
progressively more expensive. The `codify-convention` skill, the
`writing-plans` skill, and any future skill that intercepts prompts
at HEAD-pass time should invoke the four-category check explicitly.

---

**Origin:**

- First codified: typology codification arc, 2026-05-29 (arc
  closeout).
- Evidence basis: process-meta-pattern shape per
  `docs/04_engineering/conventions/README.md` §Three-category
  codification taxonomy. Observation-grain N=2 with explicit shape
  match (introduction at ADR-0025 Ring 2A-core rollout banking
  during hygiene arc + hygiene close [`9f320ded`]); N=3 confirms
  via implicit-application across T8 close [`183935ee`] + umbrella
  close [`462ad426`] + companion close [`a4cc0f02`], each
  instantiating the framework's mechanism at HEAD-pass per the
  README §family-tag assignment convention's mechanism-tagging-at-
  graduation-time-discriminator (loose-interpretation adjudicated
  at this arc's HEAD-pass). Distinct timing surfaces: codification-
  decision (hygiene close) + multi-arc-handoff (T8 close) +
  substrate-collapse-disambiguation (umbrella close) + small-scope-
  carry-forward-closure (companion close) + codification-arc-self-
  application (this arc's HEAD-pass loop-closing meta-instance).
- Promoted from: friction-journal banking entry at 2026-05-27
  "Four-category prompt-drift typology from the ADR-0025 Ring 2A-
  core rollout" (banked at commit `ef100ed6` during hygiene arc,
  line 16132 of `friction-journal.md`).
- Cross-references:
  - `docs/04_engineering/conventions/README.md` §Three-category
    codification taxonomy + §family-tag assignment (the
    codification framework supporting this graduation).
  - `docs/04_engineering/conventions/ratified-contract-scope.md`
    (sibling framework-discipline codification at process-meta-
    pattern grain; same codification shape).
  - `docs/04_engineering/conventions/projection-from-model.md`
    (sub-pattern codification — specific failure mode within
    category A, codified separately at this same arc).
  - `docs/07_governance/friction-journal.md` banking sites: line
    16132 (commit `ef100ed6` — typology introduction); line 16203
    (commit `9f320ded` — hygiene-arc closeout); line 16359 (commit
    `183935ee` — T8 closeout); line 16540 (commit `462ad426` —
    umbrella closeout); line 16768 (commit `a4cc0f02` — companion
    closeout).

**Evaluation basis:**

- **Load-bearing (prescriptive).** The convention generates concrete
  operator action at every prompt's HEAD pass: run the four-category
  checklist against the prompt's framing. Each category has a
  discriminator that fires a specific verification step. Without
  the codified framework, future arcs would re-derive the discipline
  cold rather than running the checklist; catches would happen
  unevenly (some firing, others missed depending on the executor's
  attention state). The framework's HEAD-pass-checklist shape is
  the load-bearing operator-action surface.

- **Generalizable.** Operates at any prompt-bearing surface — arc
  resumption prompts, ADR drafts, brief authoring, codify-
  convention skill invocations, session-handoff prompts. The four
  categories are substrate-class-agnostic; they apply across
  feature arcs (ADR-0025 Ring 2A-core rollout), hygiene arcs
  (`hygiene-post-ring2a-core`), investigation arcs (T8), discipline
  arcs (umbrella test-isolation), small-scope hygiene arcs
  (companion), and meta-codification arcs (this typology
  codification). Surface diversity across N=5 distinct arc-shapes
  with timing-surface diversity per Origin's distinct-timing-
  surfaces list.

- **Stable.** The four categories crystallized at ADR-0025 Ring
  2A-core rollout (2026-05-27) and have remained stable across
  hygiene → T8 → umbrella → companion → typology codification arcs
  (N=5 timing surfaces over ~3 days). No category has been added or
  removed; no sub-shape distinction has destabilized the framework's
  shape. Mechanism-anchored at "prompt-vs-X drift discrimination"
  where X ranges over disk / ratified-contract / running-environment
  / consumer-gap — the framework's stability is bounded by whether
  new drift classes surface that don't fit existing categories,
  which has not occurred across five arc applications.
