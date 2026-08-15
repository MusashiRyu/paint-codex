import type { Match, Paint } from './types';

/**
 * The upstream paint catalog: `Arcturus5404/miniature-paints`, one
 * markdown table per brand, served raw from GitHub under MIT.
 *
 * Both the build-time scraper (`tools/scraper/scrape.mjs`) and the runtime
 * background refresh read these URLs and run the parser below, so a snapshot
 * on disk and a snapshot fetched on a phone can never disagree about how the
 * documents are read.
 *
 * The brand labels are ours, not upstream's file names: the app says
 * "Citadel", the file is `Citadel_Colour.md`. Keeping the mapping here means
 * a rename upstream is a one-line change and never leaks into paint ids.
 */
export const PAINT_CATALOG_SOURCES: readonly { brand: string; url: string }[] = [
  {
    brand: 'Citadel',
    url: 'https://raw.githubusercontent.com/Arcturus5404/miniature-paints/main/paints/Citadel_Colour.md',
  },
  {
    brand: 'Vallejo',
    url: 'https://raw.githubusercontent.com/Arcturus5404/miniature-paints/main/paints/Vallejo.md',
  },
  {
    brand: 'Army Painter',
    url: 'https://raw.githubusercontent.com/Arcturus5404/miniature-paints/main/paints/Army_Painter.md',
  },
];

/** One fetched brand document, paired with the brand label it belongs to. */
export interface CatalogDocument {
  brand: string;
  markdown: string;
}

/**
 * Equivalents stored per paint. Matched to the six the search sheet renders:
 * storing more would only ever be filtered back down, and the snapshot is
 * shipped in the bundle and mirrored into localStorage, so every extra match
 * is paid for three times.
 */
export const MAX_MATCHES = 6;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalize to `#RRGGBB`, or reject.
 *
 * Upstream writes `#rrggbb` in a code span. Anything else is not a color a
 * browser will render, and the Lab conversion below slices six digits
 * unconditionally — a four-digit value would give it NaN. Dropping the entry
 * loses one paint; letting it through puts an invisible swatch in the UI.
 */
function normalizeHex(raw: string): string | null {
  const digits = raw.replace(/^#/, '').toUpperCase();
  if (/^[0-9A-F]{6}$/.test(digits)) return `#${digits}`;
  if (/^[0-9A-F]{3}$/.test(digits)) {
    return `#${[...digits].map((digit) => digit + digit).join('')}`;
  }
  return null;
}

/**
 * The color literal in a Hex cell:
 *   ![#A32F26](https://placehold.co/15x15/A32F26/A32F26.png) `#A32F26`
 *
 * Read from the backticked span rather than the row at large, because the
 * preview image URL repeats the same digits twice and an unanchored search
 * would happily take a substring of one of those.
 */
const HEX_CELL_PATTERN = /`\s*#([0-9a-fA-F]{3,6})\s*`/;

interface ParsedRow {
  name: string;
  set: string;
  code?: string;
  hex: string;
}

/**
 * Read one brand's markdown table.
 *
 * Columns are located by heading rather than by position: Citadel's table is
 * `|Name|Set|R|G|B|Hex|` and every other brand's is `|Name|Code|Set|R|G|B|Hex|`,
 * so a fixed index would silently read the code column as the range for two
 * brands out of three.
 */
function parseBrandTable(markdown: string): ParsedRow[] {
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'));
  if (lines.length < 3) return [];

  const cells = (line: string) =>
    line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());

  const heading = cells(lines[0]);
  const nameColumn = heading.indexOf('Name');
  const setColumn = heading.indexOf('Set');
  const hexColumn = heading.indexOf('Hex');
  const codeColumn = heading.indexOf('Code');
  if (nameColumn < 0 || setColumn < 0 || hexColumn < 0) return [];

  const rows: ParsedRow[] = [];
  // Line 1 is the `|---|---|` delimiter.
  for (const line of lines.slice(2)) {
    const columns = cells(line);
    if (columns.length <= hexColumn) continue;

    const name = columns[nameColumn];
    const set = columns[setColumn];
    if (!name || !set || set === 'null') continue;

    const hexMatch = columns[hexColumn].match(HEX_CELL_PATTERN);
    if (!hexMatch) continue;
    const hex = normalizeHex(hexMatch[1]);
    if (!hex) continue;

    // Upstream writes a literal "null" where a product has no code.
    const rawCode = codeColumn >= 0 ? columns[codeColumn] : '';
    const code = rawCode && rawCode !== 'null' ? rawCode : undefined;

    rows.push({ name, set, code, hex });
  }

  return rows;
}

/**
 * Ranges that are the same color in a different medium.
 *
 * Where one name is sold at one color across several ranges, the brush
 * version leads: it is what someone browsing a color usually wants, and it is
 * what the pre-Arcturus catalog held, so the lists carried over by
 * `paintIdMigration.json` land on it.
 */
const SPRAYED = /\b(air|spray|primer|varnish)\b/i;

/** Primary range first, and never dependent on where a row sat in the file. */
function byRangePreference(a: string, b: string): number {
  return Number(SPRAYED.test(a)) - Number(SPRAYED.test(b)) || a.localeCompare(b);
}

interface MergedRow {
  name: string;
  hex: string;
  ranges: string[];
  code?: string;
}

/**
 * Collapse rows that describe the same paint, within one brand.
 *
 * Upstream lists a color once per range it is sold in, so Citadel's Abaddon
 * Black arrives as both Air and Base at `#000000` and Vallejo's Black three
 * times over. Those are one entry with several ranges, not several paints: on
 * screen they are the same name, the same swatch and the same hex, and a
 * search answering with six identical-looking rows is worse than one answering
 * with one. It also fixes the equivalents, where six tiles could resolve to
 * two actual colors.
 *
 * A name at *different* colors is a different paint and is kept — Citadel's
 * Administratum Grey really is a different gray in Layer and in Air.
 */
function mergeRanges(rows: ParsedRow[]): MergedRow[] {
  const merged = new Map<string, MergedRow>();
  for (const row of rows) {
    const key = `${row.name.toLowerCase()} ${row.hex}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { name: row.name, hex: row.hex, ranges: [row.set], code: row.code });
    } else if (!existing.ranges.includes(row.set)) {
      existing.ranges.push(row.set);
    }
  }

  for (const entry of merged.values()) entry.ranges.sort(byRangePreference);
  return [...merged.values()];
}

/**
 * Assign stable ids within one brand.
 *
 * The id is brand + primary range + name, deliberately *not* the product code:
 * upstream leaves the code null for whole ranges and fills some in later, and
 * an id that changes when a spreadsheet cell is filled in silently empties
 * every saved list that referenced it.
 *
 * What survives the merge above and still clashes is a handful of rows sharing
 * a name and a primary range at different colors — Vallejo reissues under two
 * product codes, mostly. Those are ordered by code then color and suffixed
 * `-2`, `-3`. Ordering by the row's own content rather than by its position in
 * the file is what keeps the suffixes from shuffling when upstream re-sorts.
 */
function assignIds(brand: string, rows: ParsedRow[]): Paint[] {
  const prefix = slugify(brand);

  const groups = new Map<string, MergedRow[]>();
  for (const row of mergeRanges(rows)) {
    const id = `${prefix}-${slugify(row.ranges[0])}-${slugify(row.name)}`;
    const group = groups.get(id);
    if (group) group.push(row);
    else groups.set(id, [row]);
  }

  const paints: Paint[] = [];
  for (const [id, group] of groups) {
    group.sort(
      (a, b) => (a.code ?? '').localeCompare(b.code ?? '') || a.hex.localeCompare(b.hex)
    );
    group.forEach((row, index) => {
      paints.push({
        id: index === 0 ? id : `${id}-${index + 1}`,
        brand,
        name: row.name,
        hex: row.hex,
        // Every range the color is sold in, primary first. Dropping the rest
        // would make the merge look like data loss to anyone checking against
        // upstream.
        category: row.ranges.join(' · '),
        ...(row.code ? { code: row.code } : {}),
        matches: [],
      });
    });
  }

  return paints;
}

/** sRGB component to linear light. */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function labComponent(t: number): number {
  return t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29;
}

/**
 * `#RRGGBB` to CIELAB under D65, the white point sRGB is defined against.
 *
 * Exported, and deliberately still here rather than in `shared/lib/color.ts`:
 * this module is loaded by the scraper through type stripping and must stay
 * free of value imports from `src/`. Browse order and match deltas are computed
 * from this one function, so the two cannot be measured in different Labs.
 */
export function hexToLab(hex: string): [number, number, number] {
  const r = linearize(parseInt(hex.slice(1, 3), 16));
  const g = linearize(parseInt(hex.slice(3, 5), 16));
  const b = linearize(parseInt(hex.slice(5, 7), 16));

  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;

  const fx = labComponent(x);
  const fy = labComponent(y);
  const fz = labComponent(z);

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * Attach each paint's nearest equivalents from the *other* brands.
 *
 * Upstream ships color, not conversions, so the equivalents are ours. The
 * metric is CIE76 — a plain Euclidean distance in CIELAB — because that is
 * the scale the thresholds in `shared/lib/color.ts` are expressed on: 3 for
 * "indistinguishable", 7 for "still usable". CIEDE2000 is the better model of
 * perception but returns systematically smaller numbers, so adopting it would
 * quietly reclassify every match in the app without either constant changing.
 *
 * Same-brand equivalents are left out. Someone looking at a Citadel paint
 * wants to know what to buy instead of it, and the nearest Citadel paint is
 * an answer to a different question.
 */
function attachMatches(paints: Paint[]): void {
  const count = paints.length;
  const lab = new Float64Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [l, a, b] = hexToLab(paints[i].hex);
    lab[i * 3] = l;
    lab[i * 3 + 1] = a;
    lab[i * 3 + 2] = b;
  }

  // ~6M pairs at three brands, so the inner loop stays arithmetic on a typed
  // array and keeps only the running top six rather than sorting per paint.
  for (let i = 0; i < count; i++) {
    const li = lab[i * 3];
    const ai = lab[i * 3 + 1];
    const bi = lab[i * 3 + 2];
    const brand = paints[i].brand;
    const best: Match[] = [];
    let worst = Number.POSITIVE_INFINITY;

    for (let j = 0; j < count; j++) {
      if (paints[j].brand === brand) continue;
      const dl = li - lab[j * 3];
      const da = ai - lab[j * 3 + 1];
      const db = bi - lab[j * 3 + 2];
      const squared = dl * dl + da * da + db * db;
      if (best.length === MAX_MATCHES && squared >= worst) continue;

      const delta = Math.sqrt(squared);
      let at = best.length;
      while (at > 0 && best[at - 1].delta > delta) at--;
      best.splice(at, 0, { id: paints[j].id, delta });
      if (best.length > MAX_MATCHES) best.pop();
      if (best.length === MAX_MATCHES) {
        const bound = best[MAX_MATCHES - 1].delta;
        worst = bound * bound;
      }
    }

    // Two decimals is what the UI renders; keeping seventeen would inflate
    // the snapshot and the cached copy of it for digits nobody ever sees.
    paints[i].matches = best.map((match) => ({
      id: match.id,
      delta: Math.round(match.delta * 100) / 100,
    }));
  }
}

/**
 * Parse the fetched brand documents into a flat catalog with equivalents.
 *
 * A document that yields no rows contributes nothing rather than throwing:
 * the caller's paint-count floor is what decides whether the result is
 * usable, and one brand's file moving should not cost the other two.
 */
export function parsePaintCatalog(documents: CatalogDocument[]): Paint[] {
  const paints: Paint[] = [];
  for (const document of documents) {
    paints.push(...assignIds(document.brand, parseBrandTable(document.markdown)));
  }

  attachMatches(paints);
  return paints;
}
