/**
 * ADR Index Generator
 *
 * Regenerates the generator-managed sections of
 * `docs/07_governance/adr/README.md` between the
 * `<!-- BEGIN:generated-* -->` / `<!-- END:generated-* -->` markers.
 *
 * Reads frontmatter from every `.md` file in
 * `docs/07_governance/adr/` except `README.md`, `_template.md`,
 * and any file starting with `_`.
 *
 * Idempotent: running twice produces no diff.
 *
 * Legacy ADRs (0001–0020 without frontmatter) are handled by
 * extracting title from the H1, status from the `## Status`
 * section, date from the `## Date` section. Missing fields render
 * as `—` in the generated table. Legacy ADRs appear only in the
 * Current ADRs table; By-module / By-invariant / By-phase sections
 * skip them (no frontmatter values to group by).
 *
 * Per ADR-0021: this script lives at top-level `scripts/<area>/`
 * (a new convention introduction for cross-repo TypeScript docs
 * tooling). The `tsx` runtime was already established by existing
 * `apps/web/scripts/*.ts`; the location pattern is what's new.
 *
 * Usage: `pnpm adr:index`
 *
 * Optional flag:
 *   --check    Exit 1 if regeneration would change README.md.
 *              Used by CI / pre-commit to catch hand-edits inside
 *              marker blocks.
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import matter from 'gray-matter';

const REPO_ROOT = process.cwd();
const ADR_DIR = resolve(REPO_ROOT, 'docs/07_governance/adr');
const README_PATH = join(ADR_DIR, 'README.md');

type Frontmatter = {
  id?: string;
  title?: string;
  status?: string;
  // YAML may parse unquoted ISO dates as Date objects; readAdrs normalizes.
  date?: string | Date;
  deciders?: string[];
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
  id: string;
  title: string;
  status: string;
  date: string;
  hasFrontmatter: boolean;
  frontmatter: Frontmatter;
};

const STATUS_DASH = '—';

const NUMBERED_ADR_REGEX = /^(\d{4})-[a-z0-9-]+\.md$/;

function extractFromBody(body: string, sectionHeader: string): string {
  // Find `## <sectionHeader>` and capture the following paragraph
  // (until the next heading or end of file).
  const pattern = new RegExp(
    `^##\\s+${sectionHeader}\\s*\\n+([\\s\\S]*?)(?=\\n##\\s|$)`,
    'm'
  );
  const match = body.match(pattern);
  if (!match) return STATUS_DASH;
  // First non-blank line of the captured block.
  const firstLine = match[1].split('\n').find((l) => l.trim().length > 0);
  return firstLine ? firstLine.trim() : STATUS_DASH;
}

function extractTitle(body: string): string {
  // First H1 heading, strip "ADR-NNN: " or "ADR-NNNN: " prefix if
  // present. Legacy ADR-0001 uses 3-digit `ADR-001:`; 0007+ use
  // 4-digit `ADR-0007:`. Both forms strip cleanly.
  const match = body.match(/^#\s+(.+)$/m);
  if (!match) return STATUS_DASH;
  return match[1].replace(/^ADR-\d{3,4}:\s*/, '').trim();
}

function extractStatus(body: string): string {
  const raw = extractFromBody(body, 'Status');
  if (raw === STATUS_DASH) return STATUS_DASH;
  // Match the first single word that looks like a status keyword.
  const lc = raw.toLowerCase();
  if (lc.includes('superseded')) return 'Superseded';
  if (lc.includes('deprecated')) return 'Deprecated';
  if (lc.includes('ratified')) return 'Ratified';
  if (lc.includes('accepted')) return 'Accepted';
  return raw.split(/[;.]/)[0].trim();
}

function extractDate(body: string): string {
  const raw = extractFromBody(body, 'Date');
  if (raw === STATUS_DASH) return STATUS_DASH;
  // Match an ISO date if present.
  const isoMatch = raw.match(/\d{4}-\d{2}-\d{2}/);
  return isoMatch ? isoMatch[0] : raw;
}

async function readAdrs(): Promise<Adr[]> {
  const entries = await readdir(ADR_DIR);
  const adrs: Adr[] = [];

  for (const filename of entries) {
    // Skip non-numbered files (README.md, _template.md, _* anything).
    const idMatch = filename.match(NUMBERED_ADR_REGEX);
    if (!idMatch) continue;

    const filepath = join(ADR_DIR, filename);
    const raw = await readFile(filepath, 'utf8');
    const parsed = matter(raw);
    const frontmatter = parsed.data as Frontmatter;
    const hasFrontmatter = Object.keys(frontmatter).length > 0;
    const body = parsed.content;

    const id = (frontmatter.id ?? idMatch[1]).padStart(4, '0');
    const title = frontmatter.title ?? extractTitle(body);
    const status = frontmatter.status
      ? frontmatter.status.charAt(0).toUpperCase() + frontmatter.status.slice(1)
      : extractStatus(body);
    // YAML auto-parses unquoted ISO dates to Date objects; normalize.
    const rawDate = frontmatter.date;
    const date =
      rawDate instanceof Date
        ? rawDate.toISOString().slice(0, 10)
        : (rawDate ?? extractDate(body));

    adrs.push({
      filename,
      filepath,
      id,
      title,
      status,
      date,
      hasFrontmatter,
      frontmatter,
    });
  }

  // Sort by ID ascending.
  adrs.sort((a, b) => a.id.localeCompare(b.id));
  return adrs;
}

function adrLink(adr: Adr): string {
  return `[ADR-${adr.id}](./${adr.filename})`;
}

function generateCurrentAdrsTable(adrs: Adr[]): string {
  const lines: string[] = [];
  lines.push('| # | Title | Status | Date |');
  lines.push('|---|---|---|---|');
  for (const adr of adrs) {
    lines.push(
      `| ${adrLink(adr)} | ${adr.title} | ${adr.status} | ${adr.date} |`
    );
  }
  return lines.join('\n');
}

function groupByField(
  adrs: Adr[],
  field: 'modules' | 'invariants'
): Map<string, Adr[]> {
  const groups = new Map<string, Adr[]>();
  for (const adr of adrs) {
    const values = adr.frontmatter[field] ?? [];
    for (const value of values) {
      const list = groups.get(value) ?? [];
      list.push(adr);
      groups.set(value, list);
    }
  }
  return groups;
}

function groupByPhase(adrs: Adr[]): Map<string, Adr[]> {
  const groups = new Map<string, Adr[]>();
  for (const adr of adrs) {
    const phase = adr.frontmatter.phase;
    if (!phase) continue;
    const list = groups.get(phase) ?? [];
    list.push(adr);
    groups.set(phase, list);
  }
  return groups;
}

function renderGroupedSections(groups: Map<string, Adr[]>): string {
  const keys = [...groups.keys()].sort();
  if (keys.length === 0) {
    return '_No ADRs with this field populated yet. The first ADR with frontmatter values populating this field will appear here on next index regeneration._';
  }
  const blocks: string[] = [];
  for (const key of keys) {
    const adrsInGroup = (groups.get(key) ?? []).sort((a, b) =>
      a.id.localeCompare(b.id)
    );
    blocks.push(`### ${key}\n`);
    for (const adr of adrsInGroup) {
      blocks.push(`- ${adrLink(adr)} — ${adr.title} (${adr.status}; ${adr.date})`);
    }
    blocks.push('');
  }
  return blocks.join('\n').trim();
}

function replaceBetweenMarkers(
  source: string,
  markerName: string,
  replacement: string
): string {
  const begin = `<!-- BEGIN:${markerName} -->`;
  const end = `<!-- END:${markerName} -->`;
  const beginIdx = source.indexOf(begin);
  const endIdx = source.indexOf(end);
  if (beginIdx === -1 || endIdx === -1) {
    throw new Error(
      `Marker pair for "${markerName}" not found in README. ` +
        `Expected ${begin} and ${end}.`
    );
  }
  if (endIdx < beginIdx) {
    throw new Error(`END marker for "${markerName}" appears before BEGIN.`);
  }
  const before = source.slice(0, beginIdx + begin.length);
  const after = source.slice(endIdx);
  return `${before}\n${replacement}\n${after}`;
}

async function main(): Promise<void> {
  const isCheck = process.argv.includes('--check');

  const adrs = await readAdrs();

  let readme = await readFile(README_PATH, 'utf8');
  const originalReadme = readme;

  readme = replaceBetweenMarkers(
    readme,
    'generated-current-adrs',
    generateCurrentAdrsTable(adrs)
  );
  readme = replaceBetweenMarkers(
    readme,
    'generated-by-module',
    renderGroupedSections(groupByField(adrs, 'modules'))
  );
  readme = replaceBetweenMarkers(
    readme,
    'generated-by-invariant',
    renderGroupedSections(groupByField(adrs, 'invariants'))
  );
  readme = replaceBetweenMarkers(
    readme,
    'generated-by-phase',
    renderGroupedSections(groupByPhase(adrs))
  );

  if (readme === originalReadme) {
    console.log(`adr:index — no changes (${adrs.length} ADRs scanned).`);
    process.exit(0);
  }

  if (isCheck) {
    console.error(
      `adr:index --check — README.md regeneration would change content. ` +
        `Run \`pnpm adr:index\` and commit the result.`
    );
    process.exit(1);
  }

  await writeFile(README_PATH, readme, 'utf8');
  console.log(`adr:index — regenerated README.md (${adrs.length} ADRs scanned).`);
}

main().catch((err) => {
  console.error('adr:index — failed:', err.message);
  process.exit(1);
});
