# ADR-0036 — Compliance Assumptions / First-Class Jurisdictions (Decision 10) — Design Spec

**Status:** DRAFT for review · 2026-05-31 · pre-ratification design spec (lifecycle stage 1
of 3: `specs/` → `ratification-packages/` → ratified ADR in `docs/07_governance/adr/`).
**Reserves:** ADR-0036 (V1 Governance Plan, `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`).
**Anchored at:** HEAD `6af5d776` (branch `staging`).
**Posture:** **Decision 10 is OPEN — CTO/business decides at the ratification-package
stage.** This is a **Shape-2 neutral options spec**: it frames the decision against
verified current-state, lays out the jurisdiction options and their consequence maps, and
states what each gates — but it does **not** pick a jurisdiction. No disk supplies the
answer; Decision 10 is "the one open strategic input" (a business/market call). No new
substrate, no invariant registration, no code.

> **Why this is a decision-frame, not a decision.** Unlike ADR-0029/0030 (consolidation —
> disk supplied the answer), ADR-0036 closes **Decision 10**, which the charter marks
> "Decide" with no default. Per the decision-hole guard, this spec surfaces the decision
> with its grounded options and consequences; it does not manufacture a jurisdiction
> choice that is the business's to make. The ratification package folds in the CTO
> direction; ADR-0036 cannot ratify with Decision 10 open.

---

## 0. What this ADR will do

Establish the **compliance assumptions** for V1 by recording which jurisdictions are
**first-class** (drive architecture) vs. deferred — closing Decision 10. The decision
"materially changes architecture" (residency, retention, automated-decision explanation
per the deep-research report), so it must be made against accurate current-state and with
each option's architectural blast radius explicit. This spec provides that frame; the CTO
picks the option at ratification.

---

## 1. Verified current-state (the frame the decision is made against)

**Compliance/residency substrate is genuinely net-new.** Scanned the migration tree at
HEAD `6af5d776`:

- **No** migration for data residency, retention policy, privacy/PIPEDA, PIA workflow,
  automated-decision explanation, or a compliance-jurisdiction concept. None exists.
- **The only "jurisdiction" on disk is tax-rate scoping:** `tax_codes.jurisdiction`
  (`text NOT NULL`, `initial_schema.sql:208`, indexed with `effective_from`). **This is
  GST/HST tax-rate jurisdiction — NOT data-residency or compliance jurisdiction.** ADR-0036
  must not conflate the two: a tax-rate jurisdiction (which province's GST/HST rate
  applies) is a different concept from a compliance jurisdiction (which privacy/residency
  regime governs the data).
- **The only geographic anchor is per-address:** `organization_addresses.country`
  (`char(2)`, CHECK `^[A-Z]{2}$`) + `region text` (migration `20240110`).
  `organizations` itself carries only `phone_country_code` (migration `20240109`) — **no
  org-level or legal-entity-level residency/jurisdiction designation.** So today the
  system knows an address's country, but has no first-class "this org operates under
  regime X" concept.
- **Tenant isolation only:** RLS enforces multi-tenant data isolation. That is the
  entirety of the privacy/compliance posture today (matches the V1 proposal's "only RLS
  isolation today").

**Body-authoring pins (verify against disk when authoring the ADR body):**
`tax_codes.jurisdiction` (tax-rate field) and `organization_addresses.country/region`
(the geographic anchor) — both confirmed above; re-confirm at body-author time per the
symbol-resolution discipline.

**Consequence of the frame:** because the substrate is net-new, Decision 10 does not
reconcile existing code — it *sets the requirements* for the V2 governance-hardening track
(R8). The decision's cost is entirely forward (what V2 must build), not a migration of
shipped surface.

---

## 2. The decision (Decision 10) — OPEN

**The question:** which jurisdictions are **first-class** for CHOUnting — i.e., which
privacy/residency/recordkeeping regimes drive V1's compliance assumptions and gate the V2
hardening track?

This is a **business/market call**, not a disk-grounded one. No lean is offered (none can
be grounded — see §4). The options and their consequences are laid out neutrally below;
the CTO picks at ratification.

---

## 3. Options + consequence map (neutral; CTO chooses)

Stated as nested scopes (each adds to the prior). The deep-research report's priority
ordering is the consequence backbone: **CRA recordkeeping → PIPEDA → Quebec → BC/AB PIPA**,
with CCPA/GLBA/PCI/SOX gated on customer type.

| Option | First-class regimes | What it gates in V2 (R8 hardening track) | Architectural blast radius |
|---|---|---|---|
| **(a) Canada-only, federal** | CRA recordkeeping (in-Canada residency, 6-yr retention) + PIPEDA | Residency engine (in-Canada data storage); retention engine (6-yr+); audit-export surface | Residency = where data physically lives (storage region pinning); retention = a lifecycle/purge engine. Both net-new. Smallest coherent scope. |
| **(b) Canada incl. Quebec** | (a) + Quebec private-sector (Law 25) | + PIA workflow; + **automated-decision explanation** surface; + breach register | Automated-decision explanation is the heavy one — it reaches into the agent/rule path (every auto-decision must be explainable to the data subject). Touches the Logic Receipt / evidence model directly. |
| **(c) Canada + provincial PIPA** | (b) + BC PIPA + Alberta PIPA | + per-province residency/retention variance handling | Province-as-first-class-dimension: the `organization_addresses.region` field graduates from descriptive to policy-bearing. |
| **(d) Canada + US** | any of (a)–(c) + CCPA/CPRA + (if applicable) GLBA / FTC Safeguards + IRS recordkeeping | + US-residency option; + CCPA data-subject-rights surface; + (fin-customer) GLBA controls | Multi-country residency (data can't assume in-Canada); doubles the residency/retention matrix. |
| **(e) + financial-institution / public-company customers** | + PCI DSS (if card data) + SOX/PCAOB ICFR (if public-company) | + PCI baseline; + SOX change-control discipline on ledger-affecting code | PCI only if card data is ever stored/transmitted; SOX only if public-company customers. Both are customer-type-gated, not jurisdiction-gated — listed for completeness. |

> **Planning-grade, not settled law.** The regulatory specifics above (CRA 6-yr
> retention, PIPEDA, Law 25 PIA / automated-decision rights, BC/AB PIPA, CCPA/CPRA,
> PCI/SOX) are domain analysis carried from the deep-research report — **not disk facts,
> and time-sensitive** (statutes change). They are sanity-checked as domain-reasonable
> but are **not** legally authoritative or verified-current. Before the V2 hardening track
> *builds* to any of them, the specific obligations (retention periods, explanation
> requirements, residency rules) must be validated with legal/compliance counsel against
> current statute. Do not let "6-yr retention" or "Law 25 requires X" harden from a
> research report into an engineering target without that check. This consequence map is
> for *scoping the decision*, not for implementation.

**What's first-class vs. deferred is the decision.** Every option defers the rest to "when
a customer in that regime appears." The V1 proposal's lean (not a ratified default, just
the proposal's framing) was **Canada-first** — option (a) or (b) — but the charter
deliberately left this OPEN as the strategic input, so it is presented here as one option
among five, not the recommendation.

---

## 4. Why no lean is offered (decision-hole guard at the spec level)

Decision 11 (ADR-0030) had a disk-grounded answer, so an advisory lean was legitimate
(i′ was lightest-on-disk). **Decision 10 has no disk default** — there is nothing on disk
to ground a jurisdiction recommendation in; the answer depends on market/customer strategy
the codebase cannot supply. Offering a lean here would be *fabricating the exact strategic
input the decision-hole guard says to surface, not manufacture*. So this spec frames and
surfaces; it does not pick. (This is the decision-hole guard applied at the **spec** level,
not just the package level: because Decision 10 has no disk default, a spec that *picked*
would manufacture motion around a business call — so the spec stays neutral and the
decision rides to ratification.)

---

## 5. What ADR-0036 does NOT do

- **No code, no migration, no substrate.** The residency/retention/PIA engines are V2
  hardening-track work (R8), gated *by* this decision — ADR-0036 sets requirements, builds
  nothing.
- **No invariant registration.** (Privacy/residency invariants, if any, are named when the
  V2 track opens, per register-on-enforcement.)
- **No conflation of tax-jurisdiction with compliance-jurisdiction** — §1 states the
  distinction explicitly; `tax_codes.jurisdiction` stays a tax-rate field.
- **No pick of jurisdiction** — Decision 10 is OPEN; the CTO decides at ratification.
- **Not a coding blocker for the AP wedge** — per the V1 proposal, compliance hardening is
  a parallel V2 track; ADR-0036 opens it (sets the jurisdiction frame) without gating V1's
  AP wedge. Residency/retention decisions should precede the *hardening build*, not the AP
  wedge.

---

## 6. Lifecycle next steps (not this spec)

Per the ADR README lifecycle — **design spec → ratification package → ratified ADR** — and
the rule that an ADR body is the *post-ratification* artifact:

1. Reviewer verifies this design spec (greenfield frame against disk; the two field pins;
   the option/consequence map; no-lean discipline).
2. **CTO supplies the Decision-10 direction** (which option a–e is first-class) — by the
   ratification-package stage at the latest. Decision 10 cannot stay open through
   ratification.
3. Author the **ratification package** at `docs/09_briefs/v1/ratification-packages/` —
   produces the ADR-0036 body content with Decision 10 resolved.
4. **On ratification**, the ADR-0036 body lands at
   `docs/07_governance/adr/0036-compliance-assumptions.md` (`status: ratified`) — never
   before; `adr:check` green. Design spec preserved as historical reference.
5. Banks local on `staging`; pushes at retrospective close.

**Parallelization note:** ADR-0036 is independent of Decision 11 / ADR-0030 (which stays
parked at "spec done, awaiting Decision 11"). The two Wave-0 decision-closing ADRs proceed
on independent tracks; neither blocks the other.
