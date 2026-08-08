/**
 * Paint scraper — fetches the brand tables from Arcturus5404/miniature-paints
 * and writes src/data/paints.snapshot.json, the catalogue bundled with the app.
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
import { PAINT_CATALOG_SOURCES, parsePaintCatalog } from '../../src/domain/paintCatalogSource.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', '..', 'src', 'data', 'paints.snapshot.json');

async function main() {
  const documents = [];
  for (const source of PAINT_CATALOG_SOURCES) {
    console.log('Fetching', source.brand, 'from:', source.url);
    const response = await fetch(source.url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${source.url}`);
    const markdown = await response.text();
    console.log('  ', markdown.length, 'bytes');
    documents.push({ brand: source.brand, markdown });
  }

  const paints = parsePaintCatalog(documents);
  if (paints.length === 0) throw new Error('Parsed 0 paints — upstream format has changed');

  // Written minified rather than indented: the snapshot ships in the bundle
  // and is mirrored into localStorage, so pretty-printing costs roughly a
  // third of it twice over for whitespace nobody reads.
  writeFileSync(OUT_PATH, JSON.stringify(paints));

  const counts = {};
  for (const paint of paints) counts[paint.brand] = (counts[paint.brand] ?? 0) + 1;

  console.log(`\n✓ Wrote ${paints.length} total paints to ${OUT_PATH}`);
  for (const [brand, count] of Object.entries(counts)) {
    console.log(`  ${brand}: ${count}`);
  }

  const matchless = paints.filter((paint) => paint.matches.length === 0).length;
  if (matchless > 0) console.log(`  (${matchless} with no cross-brand equivalents)`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
