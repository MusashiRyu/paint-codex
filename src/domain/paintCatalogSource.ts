import type { Match, Paint } from './types';

/**
 * The upstream paint catalogue: redgrimm's conversion table, served as raw
 * HTML from GitHub. Both the build-time scraper (`tools/scraper/scrape.mjs`)
 * and the runtime background refresh read this one URL and run the parser
 * below, so a snapshot on disk and a snapshot fetched on a phone can never
 * disagree about how the markup is read.
 */
export const PAINT_CATALOG_URL =
  'https://raw.githubusercontent.com/redgrimm/paint-conversion/master/index.html';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Colour literal, with the run of hex digits bounded so a longer value is
 * rejected rather than silently truncated to its first six.
 */
const HEX_PATTERN = /#([0-9a-fA-F]{3,6})(?![0-9a-fA-F])/;

/**
 * Normalise to `#RRGGBB`, or reject.
 *
 * Upstream writes `#rgb` or `#rrggbb`. Anything else is not a colour a browser
 * will render, and `hexToHSL` slices six digits unconditionally — a four-digit
 * value would give it NaN. Dropping the entry loses one paint; letting it
 * through puts an invisible swatch in the UI.
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
 * Parse an equivalent-paint cell:
 *   <td class="good-match"><strong>Dead White</strong><br>Vallejo - Game - #ffffff<br>0.00</td>
 *
 * Vallejo's Game and Model ranges collapse to one "Vallejo" brand; P3 and any
 * brand we do not carry are dropped.
 */
function parseMatchCell(cell: string): Match | null {
  const nameMatch = cell.match(/<strong[^>]*>([^<]+)<\/strong>/);
  if (!nameMatch) return null;
  const name = nameMatch[1].trim();

  const brandLineMatch = cell.match(/<strong[^>]*>[^<]+<\/strong><br>\s*([^\n<]+)/);
  if (!brandLineMatch) return null;
  const brandLine = brandLineMatch[1].trim();

  const deltaMatch = cell.match(/<br>\s*([\d.]+)\s*<\/td>/);
  if (!deltaMatch) return null;
  // `[\d.]+` also matches things like "..." — parseFloat answers NaN, which
  // would sort unpredictably and render as "Δ NaN".
  const delta = parseFloat(deltaMatch[1]);
  if (!Number.isFinite(delta)) return null;

  const hexMatch = brandLine.match(HEX_PATTERN);
  if (!hexMatch) return null;
  const hex = normalizeHex(hexMatch[1]);
  if (!hex) return null;

  let brand: string;
  if (brandLine.includes('Vallejo - Game') || brandLine.includes('Vallejo - Model')) {
    brand = 'Vallejo';
  } else if (brandLine.includes('Army Painter')) {
    brand = 'Army Painter';
  } else {
    return null;
  }

  return { brand, name, hex, delta };
}

/**
 * Parse the row's source cell, which is always a Citadel paint:
 *   <strong class='owned'>Ceramite White</strong><br>Citadel - Base Layer - #ffffff
 */
function parseSourceCell(cell: string): { name: string; category: string; hex: string } | null {
  const nameMatch = cell.match(/<strong[^>]*>([^<]+)<\/strong>/);
  if (!nameMatch) return null;
  const name = nameMatch[1].trim();

  const metaMatch = cell.match(
    /Citadel\s+-\s+([^-]+?)\s+-\s+(#[0-9a-fA-F]{3,6})(?![0-9a-fA-F])/i
  );
  if (!metaMatch) return null;

  const hex = normalizeHex(metaMatch[2]);
  if (!hex) return null;

  return {
    name,
    category: metaMatch[1].trim(),
    hex,
  };
}

/**
 * Invert the Citadel-keyed table into a flat catalogue.
 *
 * Upstream lists one row per Citadel paint with its Vallejo/Army Painter
 * equivalents. We also want to look a Vallejo paint up directly, so every
 * equivalent is promoted to a paint of its own, pointing back at the Citadel
 * paints that named it and — via those — across to the other third-party
 * brand.
 */
export function parsePaintCatalog(html: string): Paint[] {
  const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) ?? [];
  const citadelPaints: Paint[] = [];

  for (const row of rows) {
    const cells = row.match(/<td[^>]*>[\s\S]*?<\/td>/g);
    if (!cells || cells.length < 2) continue;
    if (!cells[0].includes('Citadel')) continue;

    const source = parseSourceCell(cells[0]);
    if (!source) continue;

    const matches: Match[] = [];
    for (let i = 1; i < cells.length; i++) {
      const cell = cells[i];
      if (!cell.includes('<br>') || cell.includes('class="color-col"')) continue;

      const match = parseMatchCell(cell);
      if (match) matches.push(match);
    }

    if (matches.length === 0) continue;

    citadelPaints.push({
      id: `citadel-${slugify(source.name)}`,
      brand: 'Citadel',
      name: source.name,
      hex: source.hex,
      category: source.category,
      matches,
    });
  }

  const byBrand = new Map<string, Map<string, Paint>>([
    ['Vallejo', new Map()],
    ['Army Painter', new Map()],
  ]);
  const idPrefix: Record<string, string> = {
    Vallejo: 'vallejo',
    'Army Painter': 'army-painter',
  };

  for (const paint of citadelPaints) {
    for (const match of paint.matches) {
      const brandPaints = byBrand.get(match.brand);
      if (!brandPaints) continue;

      let derived = brandPaints.get(match.name);
      if (!derived) {
        derived = {
          id: `${idPrefix[match.brand]}-${slugify(match.name)}`,
          brand: match.brand,
          name: match.name,
          hex: match.hex,
          category: '',
          matches: [],
        };
        brandPaints.set(match.name, derived);
      }

      if (!derived.matches.some((m) => m.brand === 'Citadel' && m.name === paint.name)) {
        derived.matches.push({
          brand: 'Citadel',
          name: paint.name,
          hex: paint.hex,
          delta: match.delta,
        });
      }
    }
  }

  // Reach through each Citadel link to pick up the *other* third-party brand,
  // so a Vallejo paint also lists its Army Painter cousins and vice versa.
  const citadelByName = new Map(citadelPaints.map((paint) => [paint.name, paint]));
  for (const [brand, brandPaints] of byBrand) {
    const otherBrand = brand === 'Vallejo' ? 'Army Painter' : 'Vallejo';
    for (const derived of brandPaints.values()) {
      for (const citadelMatch of [...derived.matches]) {
        const citadelPaint = citadelByName.get(citadelMatch.name);
        if (!citadelPaint) continue;

        for (const m of citadelPaint.matches) {
          if (m.brand !== otherBrand) continue;
          if (derived.matches.some((x) => x.brand === otherBrand && x.name === m.name)) continue;
          derived.matches.push({ brand: otherBrand, name: m.name, hex: m.hex, delta: m.delta });
        }
      }
    }
  }

  return [
    ...citadelPaints,
    ...(byBrand.get('Vallejo')?.values() ?? []),
    ...(byBrand.get('Army Painter')?.values() ?? []),
  ];
}
