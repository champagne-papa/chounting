/**
 * ADR Linter
 *
 * Validates frontmatter for ADRs in `docs/07_governance/adr/`.
 * Forward-only — does not lint legacy ADRs (0001–0020) without
 * frontmatter; they are skipped cleanly.
 *
 * Checks:
 *  1. Filename `NNNN-` prefix matches frontmatter `id`.
 *  2. `id` is unique across all ADRs.
 *  3. `status` is one of: ratified, accepted, superseded, deprecated.
 *  4. `date` parses as valid ISO date and is not in the future.
 *  5. All `modules` values exist in `docs/02_specs/taxonomy.md`.
 *  6. All `features` values exist in `docs/02_specs/taxonomy.md`.
 *  7. `phase` is a known value from `docs/02_specs/taxonomy.md`
 *     Delivery-phases section, or empty.
 *  8. All `supersedes` IDs reference existing ADRs.
 *  9. All `superseded_by` IDs reference existing ADRs.
 * 10. All `related` IDs reference existing ADRs.
 * 11. All `invariants` values match `^INV-[A-Z]+-\d{3}$` AND exist
 *     in `docs/02_specs/invariants.md`. (Parses invariants.md for
 *     the canonical INV-ID list.) This is the load-bearing
 *     chounting-specific check.
 * 12. If `status` is `superseded`, `superseded_by` is non-empty.
 * 13. If ADR-A has `supersedes: [ADR-B]`, then ADR-B has
 *     `superseded_by: [ADR-A]`. Bidirectional consistency.
 *
 * Output: one finding per line, `path:field severity message`.
 * Severity is `error` (exit 1) or `warning` (exit 0 with output).
 *
 * Per ADR-0021: this script lives at top-level `scripts/<area>/`
 * (a new convention introduction for cross-repo TypeScript docs
 * tooling). The `tsx` runtime was already established by existing
 * `apps/web/scripts/*.ts`; the location pattern is what's new.
 *
 * Usage: `pnpm adr:lint`
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import matter from 'gray-matter';

const REPO_ROOT = process.cwd();
const ADR_DIR = resolve(REPO_ROOT, 'docs/07_governance/adr');
const TAXONOMY_PATH = resolve(REPO_ROOT, 'docs/02_specs/taxonomy.md');
const INVARIANTS_PATH = resolve(REPO_ROOT, 'docs/02_specs/invariants.md');

const NUMBERED_ADR_REGEX = /^(\d{4})-[a-z0-9-]+\.md$/;
const INV_ID_REGEX = /^INV-[A-Z]+-\d{3}$/;
const STATUS_VALUES = new Set([
  'ratified',
  'accepted',
  'superseded',
  'deprecated',
]);

type Frontmatter = {
  id?: string;
  title?: string;
  status?: string;
  date?: string;
  modules?: string[];
  features?: string[];
  phase?: string;
  supersedes?: string[];
  superseded_by?: string[];
  related?: string[];
  invariants?: string[];
};

type Adr = {
  filename: string;
  filepath: string;
  numericId: string;
  frontmatter: Frontmatter;
  hasFrontmatter: boolean;
};

type Finding = {
  path: string;
  field: string;
  severity: 'error' | 'warning';
  message: string;
};

function parseTaxonomySection(
  content: string,
  sectionHeader: string
): Set<string> {
  const values = new Set<string>();
  const lines = content.split('\n');
  let inSection = false;
  let sawHeaderRow = false;
  let sawSeparatorRow = false;

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      // New top-level section.
      const isTarget = line.match(/^##\s+(.+?)\s*$/)?.[1] === sectionHeader;
      inSection = isTarget;
      sawHeaderRow = false;
      sawSeparatorRow = false;
      continue;
    }
    if (!inSection) continue;
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (!trimmed.startsWith('|')) continue;
    if (!sawHeaderRow) {
      // First table row is the header (e.g., `| Value | ... |`).
      sawHeaderRow = true;
      continue;
    }
    if (!sawSeparatorRow) {
      // Second table row is the separator (e.g., `|---|---|`).
      sawSeparatorRow = true;
      continue;
    }
    // Data row: extract the first cell.
    const cells = trimmed.split('|').map((c) => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);
    if (cells.length === 0) continue;
    const value = cells[0];
    if (value.length === 0) continue;
    values.add(value);
  }

  return values;
}

async function loadTaxonomy(): Promise<{
  modules: Set<string>;
  features: Set<string>;
  phases: Set<string>;
}> {
  const content = await readFile(TAXONOMY_PATH, 'utf8');
  return {
    modules: parseTaxonomySection(content, 'Modules'),
    features: parseTaxonomySection(content, 'Features'),
    phases: parseTaxonomySection(content, 'Delivery phases'),
  };
}

async function loadInvariants(): Promise<Set<string>> {
  const content = await readFile(INVARIANTS_PATH, 'utf8');
  const matches = content.match(/INV-[A-Z]+-\d{3}/g) ?? [];
  return new Set(matches);
}

async function loadAdrs(): Promise<Adr[]> {
  const entries = await readdir(ADR_DIR);
  const adrs: Adr[] = [];

  for (const filename of entries) {
    const idMatch = filename.match(NUMBERED_ADR_REGEX);
    if (!idMatch) continue;
    const filepath = join(ADR_DIR, filename);
    const raw = await readFile(filepath, 'utf8');
    const parsed = matter(raw);
    const frontmatter = parsed.data as Frontmatter;
    const hasFrontmatter = Object.keys(frontmatter).length > 0;
    adrs.push({
      filename,
      filepath,
      numericId: idMatch[1],
      frontmatter,
      hasFrontmatter,
    });
  }

  return adrs;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === value;
}

function lintAdr(
  adr: Adr,
  allAdrIds: Set<string>,
  taxonomy: { modules: Set<string>; features: Set<string>; phases: Set<string> },
  invariants: Set<string>,
  adrsById: Map<string, Adr>
): Finding[] {
  const findings: Finding[] = [];
  const path = relative(REPO_ROOT, adr.filepath);
  const fm = adr.frontmatter;

  const error = (field: string, message: string) =>
    findings.push({ path, field, severity: 'error', message });

  // Check 1: filename id prefix matches frontmatter id.
  if (!fm.id) {
    error('id', 'frontmatter `id` is required');
  } else if (fm.id !== adr.numericId) {
    error(
      'id',
      `frontmatter id "${fm.id}" does not match filename prefix "${adr.numericId}"`
    );
  }

  // Check 3: status enum membership.
  if (!fm.status) {
    error('status', 'frontmatter `status` is required');
  } else if (!STATUS_VALUES.has(fm.status)) {
    error(
      'status',
      `invalid status "${fm.status}"; allowed: ${[...STATUS_VALUES].join(', ')}`
    );
  }

  // Check 4: date is valid ISO and not in future.
  if (!fm.date) {
    error('date', 'frontmatter `date` is required');
  } else if (!isValidIsoDate(fm.date)) {
    error('date', `date "${fm.date}" is not a valid ISO date (YYYY-MM-DD)`);
  } else {
    const today = new Date().toISOString().slice(0, 10);
    if (fm.date > today) {
      error('date', `date "${fm.date}" is in the future (today: ${today})`);
    }
  }

  // Check 5: modules values exist in taxonomy.
  for (const value of fm.modules ?? []) {
    if (!taxonomy.modules.has(value)) {
      error('modules', `unknown module "${value}"; not in taxonomy.md Modules section`);
    }
  }

  // Check 6: features values exist in taxonomy.
  for (const value of fm.features ?? []) {
    if (!taxonomy.features.has(value)) {
      error(
        'features',
        `unknown feature "${value}"; not in taxonomy.md Features section (currently deferred)`
      );
    }
  }

  // Check 7: phase known or empty.
  if (fm.phase && fm.phase.length > 0 && !taxonomy.phases.has(fm.phase)) {
    error('phase', `unknown phase "${fm.phase}"; not in taxonomy.md Delivery-phases section`);
  }

  // Check 8: supersedes references existing ADRs.
  for (const ref of fm.supersedes ?? []) {
    if (!allAdrIds.has(ref)) {
      error('supersedes', `references unknown ADR "${ref}"`);
    }
  }

  // Check 9: superseded_by references existing ADRs.
  for (const ref of fm.superseded_by ?? []) {
    if (!allAdrIds.has(ref)) {
      error('superseded_by', `references unknown ADR "${ref}"`);
    }
  }

  // Check 10: related references existing ADRs.
  for (const ref of fm.related ?? []) {
    if (!allAdrIds.has(ref)) {
      error('related', `references unknown ADR "${ref}"`);
    }
  }

  // Check 11: invariants regex + canonical-list membership.
  for (const inv of fm.invariants ?? []) {
    if (!INV_ID_REGEX.test(inv)) {
      error('invariants', `value "${inv}" does not match INV-DOMAIN-NNN format`);
      continue;
    }
    if (!invariants.has(inv)) {
      error('invariants', `unknown INV-ID "${inv}"; not in invariants.md`);
    }
  }

  // Check 12: superseded => superseded_by non-empty.
  if (fm.status === 'superseded' && (!fm.superseded_by || fm.superseded_by.length === 0)) {
    error(
      'superseded_by',
      'status is `superseded` but `superseded_by` is empty; must name at least one replacement ADR'
    );
  }

  // Check 13: bidirectional supersedes/superseded_by consistency.
  for (const replacedId of fm.supersedes ?? []) {
    const replaced = adrsById.get(replacedId);
    if (!replaced) continue; // Already flagged by check 8.
    const replacedSb = replaced.frontmatter.superseded_by ?? [];
    if (!replacedSb.includes(fm.id ?? adr.numericId)) {
      error(
        'supersedes',
        `inconsistent supersession: this ADR supersedes ${replacedId}, but ${replacedId}.superseded_by does not include ${fm.id ?? adr.numericId}`
      );
    }
  }

  return findings;
}

function lintIdUniqueness(adrs: Adr[]): Finding[] {
  // Check 2: id uniqueness across all ADRs (with frontmatter).
  const findings: Finding[] = [];
  const seen = new Map<string, string>();
  for (const adr of adrs) {
    if (!adr.hasFrontmatter || !adr.frontmatter.id) continue;
    const id = adr.frontmatter.id;
    const path = relative(REPO_ROOT, adr.filepath);
    if (seen.has(id)) {
      findings.push({
        path,
        field: 'id',
        severity: 'error',
        message: `duplicate ADR id "${id}"; also used by ${seen.get(id)}`,
      });
    } else {
      seen.set(id, path);
    }
  }
  return findings;
}

async function main(): Promise<void> {
  const [adrs, taxonomy, invariants] = await Promise.all([
    loadAdrs(),
    loadTaxonomy(),
    loadInvariants(),
  ]);

  // Universe of all valid ADR IDs (frontmatter id OR numeric prefix
  // for legacy ADRs without frontmatter).
  const allAdrIds = new Set<string>();
  const adrsById = new Map<string, Adr>();
  for (const adr of adrs) {
    const id = adr.frontmatter.id ?? adr.numericId;
    allAdrIds.add(id);
    adrsById.set(id, adr);
  }

  const findings: Finding[] = [];
  findings.push(...lintIdUniqueness(adrs));

  // Per-ADR checks (skip legacy ADRs without frontmatter).
  for (const adr of adrs) {
    if (!adr.hasFrontmatter) continue;
    findings.push(
      ...lintAdr(adr, allAdrIds, taxonomy, invariants, adrsById)
    );
  }

  // Output findings sorted by path then severity.
  findings.sort((a, b) => {
    if (a.path !== b.path) return a.path.localeCompare(b.path);
    if (a.severity !== b.severity) return a.severity.localeCompare(b.severity);
    return a.field.localeCompare(b.field);
  });

  for (const f of findings) {
    const stream = f.severity === 'error' ? process.stderr : process.stdout;
    stream.write(`${f.path}:${f.field} ${f.severity} ${f.message}\n`);
  }

  const errorCount = findings.filter((f) => f.severity === 'error').length;
  const warningCount = findings.filter((f) => f.severity === 'warning').length;

  const lintedCount = adrs.filter((a) => a.hasFrontmatter).length;
  const skippedCount = adrs.length - lintedCount;

  console.log(
    `adr:lint — ${lintedCount} ADR(s) linted, ${skippedCount} legacy ADR(s) skipped (no frontmatter); ${errorCount} error(s), ${warningCount} warning(s).`
  );

  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('adr:lint — failed:', err.message);
  process.exit(1);
});
