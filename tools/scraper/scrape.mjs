/**
 * Paint scraper — fetches and parses redgrimm.github.io/paint-conversion
 * Outputs src/data/paints.snapshot.json with Citadel, Vallejo (Game + Model), and Army Painter paints.
 *
 * Run with: node tools/scraper/scrape.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', '..', 'src', 'data', 'paints.snapshot.json');

const URL = 'https://raw.githubusercontent.com/redgrimm/paint-conversion/master/index.html';

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Parse a td cell with match info like:
 *   <td class="good-match"><strong>Dead White</strong><br>Vallejo - Game - #ffffff<br>0.00</td>
 *   <td class="decent-match"><strong>Golden Yellow</strong><br>Vallejo - Model - #f7c65e<br>6.07</td>
 *   <td class="poor-match"><strong>Army Green</strong><br>Army Painter - #6e7645<br>5.18</td>
 */
function parseMatchCell(cell) {
  const nameMatch = cell.match(/<strong[^>]*>([^<]+)<\/strong>/);
  if (!nameMatch) return null;
  const name = nameMatch[1].trim();

  const brandLineMatch = cell.match(/<strong[^>]*>[^<]+<\/strong><br>\s*([^\n<]+)/);
  if (!brandLineMatch) return null;
  const brandLine = brandLineMatch[1].trim();

  const deltaMatch = cell.match(/<br>\s*([\d.]+)\s*<\/td>/);
  if (!deltaMatch) return null;
  const delta = parseFloat(deltaMatch[1]);

  const hexMatch = brandLine.match(/#([0-9a-fA-F]{3,6})/);
  if (!hexMatch) return null;
  const hex = '#' + hexMatch[1].toUpperCase();

  let brand;
  if (brandLine.includes('Vallejo - Game')) {
    brand = 'Vallejo';
  } else if (brandLine.includes('Vallejo - Model')) {
    brand = 'Vallejo';
  } else if (brandLine.includes('Army Painter')) {
    brand = 'Army Painter';
  } else if (brandLine.includes('P3 Formula')) {
    return null;
  } else {
    return null;
  }

  return { brand, name, hex, delta };
}

/**
 * Parse a source paint <td class="filled"> cell like:
 *   <strong class='owned'>Ceramite White</strong><br>Citadel - Base Layer - #ffffff
 */
function parseSourceCell(cell) {
  const nameMatch = cell.match(/<strong[^>]*>([^<]+)<\/strong>/);
  if (!nameMatch) return null;
  const name = nameMatch[1].trim();

  const metaMatch = cell.match(/Citadel\s+-\s+([^-]+?)\s+-\s+(#[0-9a-fA-F]{3,6})/i);
  if (!metaMatch) return null;
  const category = metaMatch[1].trim();
  const hex = metaMatch[2].toUpperCase();

  return { name, category, hex };
}

async function main() {
  console.log('Fetching from:', URL);
  const response = await fetch(URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  console.log('Fetched', html.length, 'bytes');

  const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];
  console.log('Found', rows.length, 'table rows');

  const paints = [];

  for (const row of rows) {
    const cells = row.match(/<td[^>]*>[\s\S]*?<\/td>/g);
    if (!cells || cells.length < 2) continue;

    const firstCell = cells[0];
    if (!firstCell.includes('Citadel')) continue;

    const source = parseSourceCell(firstCell);
    if (!source) continue;

    const matches = [];

    for (let i = 1; i < cells.length; i++) {
      const cell = cells[i];
      if (!cell.includes('<br>') || cell.includes('class="color-col"')) continue;

      const match = parseMatchCell(cell);
      if (match) {
        matches.push(match);
      }
    }

    if (matches.length === 0) continue;

    paints.push({
      id: `citadel-${slugify(source.name)}`,
      brand: 'Citadel',
      name: source.name,
      hex: source.hex,
      category: source.category,
      matches,
    });
  }

  console.log(`Parsed ${paints.length} Citadel paints`);

  const vallejoMap = new Map();
  const apMap = new Map();

  for (const paint of paints) {
    for (const match of paint.matches) {
      const key = `${match.brand}|${match.name}`;
      if (match.brand === 'Vallejo') {
        if (!vallejoMap.has(key)) {
          vallejoMap.set(key, {
            id: `vallejo-${slugify(match.name)}`,
            brand: 'Vallejo',
            name: match.name,
            hex: match.hex,
            category: '',
            matches: [],
          });
        }
        const vPaint = vallejoMap.get(key);
        if (!vPaint.matches.find((m) => m.name === paint.name && m.brand === 'Citadel')) {
          vPaint.matches.push({
            brand: 'Citadel',
            name: paint.name,
            hex: paint.hex,
            delta: match.delta,
          });
        }
      } else if (match.brand === 'Army Painter') {
        if (!apMap.has(key)) {
          apMap.set(key, {
            id: `army-painter-${slugify(match.name)}`,
            brand: 'Army Painter',
            name: match.name,
            hex: match.hex,
            category: '',
            matches: [],
          });
        }
        const apPaint = apMap.get(key);
        if (!apPaint.matches.find((m) => m.name === paint.name && m.brand === 'Citadel')) {
          apPaint.matches.push({
            brand: 'Citadel',
            name: paint.name,
            hex: paint.hex,
            delta: match.delta,
          });
        }
      }
    }
  }

  for (const [, vPaint] of vallejoMap) {
    for (const citadelMatch of vPaint.matches) {
      const citadelPaint = paints.find((p) => p.name === citadelMatch.name && p.brand === 'Citadel');
      if (!citadelPaint) continue;
      for (const m of citadelPaint.matches) {
        if (m.brand === 'Army Painter' && !vPaint.matches.find((x) => x.name === m.name && x.brand === 'Army Painter')) {
          vPaint.matches.push({ brand: 'Army Painter', name: m.name, hex: m.hex, delta: m.delta });
        }
      }
    }
  }

  for (const [, apPaint] of apMap) {
    for (const citadelMatch of apPaint.matches) {
      const citadelPaint = paints.find((p) => p.name === citadelMatch.name && p.brand === 'Citadel');
      if (!citadelPaint) continue;
      for (const m of citadelPaint.matches) {
        if (m.brand === 'Vallejo' && !apPaint.matches.find((x) => x.name === m.name && x.brand === 'Vallejo')) {
          apPaint.matches.push({ brand: 'Vallejo', name: m.name, hex: m.hex, delta: m.delta });
        }
      }
    }
  }

  const allPaints = [
    ...paints,
    ...Array.from(vallejoMap.values()),
    ...Array.from(apMap.values()),
  ];

  writeFileSync(OUT_PATH, JSON.stringify(allPaints, null, 2));
  console.log(`✓ Wrote ${allPaints.length} total paints to ${OUT_PATH}`);
  console.log(`  Citadel: ${paints.length}`);
  console.log(`  Vallejo: ${vallejoMap.size}`);
  console.log(`  Army Painter: ${apMap.size}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});