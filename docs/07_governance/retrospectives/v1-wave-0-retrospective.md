# V1 Wave-0 governance arc — retrospective

**Arc:** the V1 Final System Proposal reconciliation (Wave -1 safety + Wave 0
vocabulary/decisions/ratification). **Window:** 2026-05-31 → 2026-06-01. **Anchor:**
`11633dc6` (Ring 2B implementation close). **Commit range:** `11633dc6..HEAD` — eight
feature commits banked-local on `staging`, unpushed; the closeout set (this retrospective +
the 3a friction-journal entry + the 3c codifications + the doc reconciles) lands at this
retrospective's close, then the arc's first push fires.

Source friction-journal entry: `docs/07_governance/friction-journal.md` "V1 Wave-0
governance arc" (2026-05-31 / 2026-06-01).

---

## §1 Scope and timeline

"V1" = the first complete shippable CHOUnting system: the AP review-and-post wedge running
end-to-end on the controlled stack, with a manual fallback and an evidence chain. This arc
did **not** build the wedge — it reconciled the V1 *definition* against shipped reality,
stopped an ungoverned-auto-commit bleed, and opened the governance substrate (vocabulary,
the reserved ADR block, two ratified ADRs, two CTO decisions). The build waves (1–6) are
carry-forward.

The arc ran as a review-gated dialogue: the drafter (WSL Claude) authored each artifact,
surfaced it, the CTO verified against disk, and only then did work advance. That gate held
through every stage and is itself a source of the codifications in §3.

## §2 Chunks and commits

Eight feature commits (SHAs read from git):

| SHA | Wave | Summary |
|---|---|---|
| `7cb68895` | -1 | ADR-0007 Q78 V1-rescoping amendment (auto-commit gated to needs_review) — additive; preserves Q78 Option A, re-scopes *when* the capability is exercised, not the auth model |
| `de607fdb` | -1 | A-now bleed-stop: disable ungoverned auto-post; matched proposals return `parked_unposted` (park in `received`, no ledger write); commit machinery preserved for the post-V1 governed re-wire |
| `31ba9796` | 0 | V1 system definition ratified (Decisions 1–9) + Wave 0 opened; ADRs 0028–0036 reserved |
| `6af5d776` | 0 | ADR-0029 ratified — Autonomy Ladder Generalization (single `rule_autonomy_rung`; 5-ADR reconciliation; INV-AGENT editorial precision pass) |
| `feb5baaa` | 0 | glossary: 16 V1-arc terms added |
| `d9628a9e` | 0 | system_overview: S3 staleness banner + invariant count 18→25 |
| `dcb6ab6c` | 0 | ADR-0030 ratified — Decision-Module Composition + Disposition reconciliation (Decision 11 = i′); `ActionType` canonical contract |
| `031ce5ca` | 0 | C1 remediation: complete the bleed-stop test sweep — `classifier.integration.test.ts` committed→parked_unposted |

Closeout set (this retrospective close, SHAs assigned at commit): the 3a friction-journal
entry, the 3c codifications (`prediction-grounding.md` extension, `plan-authoring.md`
decision-hole, `iterative-catching.md` gate-precedence), this retrospective, and the
pending doc reconciles (§5).

## §3 Codification candidates

Six grounding guards fired across the arc, sharing the root "don't manufacture what you
can't ground." At codification they split **3 extend / 2 new / 1 dismiss** — routed
per-candidate through `codify-convention` against the temporal-grain rule and the
three-category taxonomy (these are *process meta-patterns*: threshold N=2-with-shape-match,
N=3 confirms).

- **Grounding-family → EXTEND `prediction-grounding.md`.** SHA-corollary, grep-count,
  attribution (the three in this entry's classification) plus related-field and numstat
  (broader arc) are confirm-shape claims about unobservable current state — they slot under
  the convention's existing confirm/discover frame. Added as a **second sub-shape axis**
  ("by claim type": commit hash / verification count / attribution / cross-reference / diff
  shape) alongside the original "by artifact class" axis, with a one-clause core-rule
  widening ("…or an unobservable current-state fact you have not read from its source").
  Not new files, not from-scratch N≥3 — the convention was already earned (Phase 6.5, N=3)
  and explicitly invites sub-shape extension. numstat is convention-based (the standing
  include-numstat rule), not a caught slip; named so honestly.
- **decision-hole → NEW in `session/plan-authoring.md`.** "Don't author past a
  decision-shaped hole." Process meta-pattern, observation-grain **N≥3** (ADR-0030 Part 2
  ratification; Decision-10 no-lean spec framing; Decision-10 defer / the
  "go-with-your-recommendation" non-referent stop). Routed to plan-authoring by the
  temporal-grain rule (every fire was at drafting time), with a one-clause header
  theme-line widening (the file's theme was disk-grounding; decision-hole is
  decision-ownership).
- **gate-precedence → NEW in `session/iterative-catching.md`.** "Don't collapse a
  reviewer's read-back into your own self-check." Process meta-pattern, **N=2 with shape
  match** across distinct commit-time gates (`feb5baaa` drafter-collapse; `d9628a9e`
  reviewer-loose-conditional). Codified **provisional until a third clean fire** confirms,
  per the `plan-authoring.md` drift-meta sub-curve-(b) N=2-exploratory precedent. The
  bilateral second instance surfaced a two-sub-mode structure (drafter collapses / reviewer's
  loose conditional invites it) and the convention binds both sides.
- **ADR-lifecycle → DISMISS (captured-elsewhere).** "An ADR body enters `adr/` only at
  ratification" is already codified — ADR README §"Pre-ratification design specs" +
  ADR-0021/0022 + `adr:lint`'s status-enum check. The arc's fire (the ADR-0029 stage-jump,
  caught by `adr:lint`) confirms the existing codification works; graduating would duplicate.

The extend-vs-add pass ran first (against `prediction-grounding.md` for the grounding-family,
`ratified-contract-scope.md` and the ADR README for ADR-lifecycle) — preventing both a
duplicate-convention and a misfile-by-theme (decision-hole's coordination-theme affinity to
`iterative-catching.md` was overridden by its drafting-time grain).

## §4 Discipline graduations

The arc's centerpiece discipline is **bidirectional verification under a review gate**: the
drafter grounds every claim against disk before asserting; the reviewer verifies against disk
before adopting (catches run both directions). Worked instances this arc:

- The keystone finding (ungoverned auto-commit) was downgraded from "auto-posting wrong bills
  now" to *structurally unreachable* once the vendor-identity matcher gap was read off disk —
  a self-correction in the friction record, not a defended claim.
- The C1 deviation surfaced only because the push-readiness *full* sweep ran where the arc had
  run "affected integration 9/9"; and the harness "exit 0" was caught as `meta.txt
  EXIT_CODE=1` — a green that wasn't, caught by reading the authoritative record over the
  report.
- C2 surfaced only pre-existing drift (four reachability INV-ids + a stale `control_matrix.md`
  count), all correctly bounded out of the arc's footprint — the gate doing its job.
- The 3c classification itself was corrected on the dwell (a "first five extend" contradiction
  caught on re-read), and the prediction-grounding EXTEND was checked for coherence at
  draft-time (it cohered under the confirm/discover frame), with a taxonomy mismatch
  (artifact-class vs claim-type axes) caught before apply.

Graduations cross-reference §3: the six guards' dispositions are the formal output of this
discipline operating on itself (the closeout took the arc's own grounding medicine — SHAs
from git, N-counts grounded in actual fires, no narrative displacing the record).

## §5 Carry-forwards

Each carries to the next arc's inventory; none was absorbed into this arc (ratified-contract-
scope; footprint discipline):

- **C2 reachability exceptions (pre-existing, documented not fixed):** `control_matrix.md:3`
  "the 24 invariants" → 25 (high-priority one-liner for the next touch of that file);
  `INV-AP-001/002` (Phase-5 AP invariants in `billService.ts` comments only — open severity
  question: enforced-but-unregistered vs cosmetic); `INV-CHECKPOINT-001` + `INV-AGENT-002`
  (known-reserved, register-on-enforcement, no action pending).
- **`clean_approval_count` drift-ledger item:** ADR-0007 Notes / ADR-0017 cross-ref cite a
  column that lives on `rule_track_records` (per ADR-0023 Decision 2); untouched this arc; fix on the next legitimate
  ADR-0007 touch.
- **State-narrative-docs refresh arc (paired):** the `system_overview` full-body rewrite +
  the `CURRENT_STATE.md` full refresh — both deeply Phase-1.1-stale; their true refresh is a
  scoped post-V1 doc undertaking, not a closeout fold. (This arc's Wave-0-close did the
  *banner*/targeted reconciles only.)
- **Wave-6 matcher-gap MUST-FIX:** the vendor_invoice extractor emits no vendor identity, so
  `matchVendor` resolves null for every vendor_invoice — blocks even human review-and-post
  coding. Add a vendor-identity field to the Stage-4 schema + Tier A/C.
- **friction-journal lint-debt:** 92 pre-existing `>12`-line bullets + journal-wide `###` in
  older committed entries trip the format scripts at exit 1 — pre-existing, out-of-footprint;
  a dedicated journal-lint pass.
- **gate-precedence provisional-until-N=3:** a third clean fire from an operationally distinct
  gate confirms (or revises) the N=2 codification.
- **The V1 build waves (1–6):** per the V1 charter — Workflow Core substrate, evidence object
  model, autonomy-gate recording, no-AI-only-paths registry, AP eval harness, and the AP
  Review wedge (V1 ships).
- **Decision 10 (deferred-by-design):** unparks when post-completion market strategy is set;
  ADR-0036 stays parked; the system_overview/charter reconcile lands the deferral durably in
  the repo at this close.
