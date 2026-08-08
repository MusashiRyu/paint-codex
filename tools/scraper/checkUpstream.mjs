/**
 * Upstream health check.
 *
 * The runtime refresh is deliberately silent: if the upstream tables change
 * shape, `parsePaintCatalog` starts returning too few paints, the refresh
 * rejects the result, and every install quietly serves the snapshot it shipped
 * with. That is the right behaviour for a user and a terrible one for us —
 * nobody finds out. This runs the same parser against live upstream on a
 * schedule so the failure shows up as a red build instead of a bug report
 * months later.
 *
 * Exit codes: 0 healthy (whether or not the snapshot is stale), 1 unhealthy.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PAINT_CATALOG_SOURCES, parsePaintCatalog } from '../../src/domain/paintCatalogSource.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = join(__dirname, '../../src/data/paints.snapshot.json');

/** Same floor the runtime refresh applies, kept in step deliberately. */
const MIN_PAINT_RATIO = 0.5;

const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
const floor = Math.floor(snapshot.length * MIN_PAINT_RATIO);

const documents = [];
for (const source of PAINT_CATALOG_SOURCES) {
  try {
    const response = await fetch(source.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    documents.push({ brand: source.brand, markdown: await response.text() });
  } catch (error) {
    console.error(`FAIL: could not fetch ${source.brand} — ${error.message}`);
    process.exit(1);
  }
}

let parsed;
try {
  parsed = parsePaintCatalog(documents);
} catch (error) {
  console.error(`FAIL: parser threw on upstream markup — ${error.message}`);
  process.exit(1);
}

console.log(`bundled snapshot : ${snapshot.length} paints`);
console.log(`live upstream    : ${parsed.length} paints`);
console.log(`rejection floor  : ${floor}`);

if (parsed.length < floor) {
  console.error(
    `\nFAIL: upstream parses to ${parsed.length} paints, below the floor of ${floor}.\n` +
      'The runtime refresh is rejecting these documents, so installs are stuck on\n' +
      'the bundled snapshot. Upstream format has probably changed —\n' +
      'src/domain/paintCatalogSource.ts needs updating.'
  );
  process.exit(1);
}

/**
 * A brand dropping out on its own stays under the total floor, because the
 * other two carry it. Checked per brand for that reason.
 */
for (const source of PAINT_CATALOG_SOURCES) {
  const live = parsed.filter((paint) => paint.brand === source.brand).length;
  const shipped = snapshot.filter((paint) => paint.brand === source.brand).length;
  console.log(`  ${source.brand}: ${live} live / ${shipped} shipped`);
  if (live < Math.floor(shipped * MIN_PAINT_RATIO)) {
    console.error(`\nFAIL: ${source.brand} parses to ${live} paints, less than half of ${shipped}.`);
    process.exit(1);
  }
}

const malformed = parsed.filter((paint) => !/^#[0-9A-F]{6}$/.test(paint.hex));
if (malformed.length > 0) {
  console.error(`\nFAIL: ${malformed.length} paints parsed with an unusable hex.`);
  process.exit(1);
}

if (JSON.stringify(parsed) === JSON.stringify(snapshot)) {
  console.log('\nOK: snapshot matches upstream.');
} else {
  // Not a failure: the runtime refresh picks this up on its own. It is only a
  // signal that a fresh install ships older data than a running app has.
  console.log('\nOK: parser healthy, but upstream has moved on from the snapshot.');
  console.log('Run `npm run scrape` to refresh what new installs ship with.');
}
