/**
 * Paint scraper — fetches redgrimm.github.io/paint-conversion and writes
 * src/data/paints.snapshot.json, the catalogue bundled with the app.
 *
 * The parsing itself lives in src/domain/paintCatalogSource.ts because the app
 * refreshes the same catalogue at runtime; keeping one parser is what stops a
 * bundled snapshot and a refreshed one from disagreeing.
 *
 * Run with: node tools/scraper/scrape.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PAINT_CATALOG_URL, parsePaintCatalog } from '../../src/domain/paintCatalogSource.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', '..', 'src', 'data', 'paints.snapshot.json');

async function main() {
  console.log('Fetching from:', PAINT_CATALOG_URL);
  const response = await fetch(PAINT_CATALOG_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  console.log('Fetched', html.length, 'bytes');

  const paints = parsePaintCatalog(html);
  if (paints.length === 0) throw new Error('Parsed 0 paints — upstream markup has changed');

  writeFileSync(OUT_PATH, JSON.stringify(paints, null, 2));

  const counts = {};
  for (const paint of paints) counts[paint.brand] = (counts[paint.brand] ?? 0) + 1;

  console.log(`✓ Wrote ${paints.length} total paints to ${OUT_PATH}`);
  for (const [brand, count] of Object.entries(counts)) {
    console.log(`  ${brand}: ${count}`);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
