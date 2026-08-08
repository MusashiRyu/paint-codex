/**
 * One-shot generator for src/data/paintIdMigration.json.
 *
 * Paint ids used to be brand + name (`citadel-abaddon-black`). Moving to the
 * Arcturus5404 tables split most of those in two — Citadel sells Abaddon Black
 * as both an Air and a Base paint, with different colour — so the id gained
 * the range (`citadel-base-abaddon-black`). Lists persist paint ids and
 * `resolvePaints` drops ids it cannot find, so without a map every saved list
 * would have emptied itself silently on update.
 *
 * The old id is matched to the new paint of the same brand and name whose
 * colour is nearest the one the old snapshot carried. Nearest rather than
 * first: the old catalogue stored one hex per name, and it is that hex which
 * says which range the entry actually came from.
 *
 * Takes every superseded snapshot at once and unions the result, because the
 * ids have now moved twice: once when the source changed, and again when rows
 * that were the same colour under two range names were merged into one entry.
 * The store applies the same map at each version step, so one file covers a
 * store that has sat at any of them.
 *
 * Run against the snapshots in git history, oldest first:
 *
 *   git show <commit>:src/data/paints.snapshot.json > v1.json
 *   node tools/scraper/buildIdMigration.mjs v1.json v2.json
 *
 * The output is committed, so this does not run again unless the mapping has
 * to be rebuilt.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CURRENT_PATH = join(__dirname, '..', '..', 'src', 'data', 'paints.snapshot.json');
const OUT_PATH = join(__dirname, '..', '..', 'src', 'data', 'paintIdMigration.json');

const priorPaths = process.argv.slice(2);
if (priorPaths.length === 0) {
  console.error('Usage: node tools/scraper/buildIdMigration.mjs <old-snapshot.json>...');
  process.exit(1);
}

const current = JSON.parse(readFileSync(CURRENT_PATH, 'utf8'));

const key = (brand, name) => `${brand.trim().toLowerCase()}::${name.trim().toLowerCase()}`;

/**
 * Fallback key, punctuation and spacing removed. The two sources disagree on
 * "Deathworld Forest" vs "Death World Forest" and "Bronze Flesh Tone" vs
 * "Bronze Fleshtone" — the same product, spelled by two different scrapers.
 */
const looseKey = (brand, name) =>
  `${brand.trim().toLowerCase()}::${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

const candidates = new Map();
const looseCandidates = new Map();
for (const paint of current) {
  for (const [map, k] of [
    [candidates, key(paint.brand, paint.name)],
    [looseCandidates, looseKey(paint.brand, paint.name)],
  ]) {
    const group = map.get(k);
    if (group) group.push(paint);
    else map.set(k, [paint]);
  }
}

const channels = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/**
 * Ranges the legacy catalogue never contained. It was built from redgrimm's
 * table, which carried Citadel "Base Layer" and "Edge" and Vallejo's Game and
 * Model ranges — brush paint throughout. Where a name now exists in both a
 * brush and an airbrush range at the same colour, and it often does, the
 * brush one is what the saved list meant.
 */
const SPRAYED = /\b(air|spray|primer|varnish)\b/i;

function nearest(hex, group) {
  const [r, g, b] = channels(hex);
  let best = group[0];
  let bestScore = [Infinity, Infinity];
  for (const paint of group) {
    const [pr, pg, pb] = channels(paint.hex);
    const score = [
      (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2,
      SPRAYED.test(paint.category ?? '') ? 1 : 0,
    ];
    // Colour first, brush-over-airbrush second, then catalogue order, which
    // is stable across runs.
    if (score[0] < bestScore[0] || (score[0] === bestScore[0] && score[1] < bestScore[1])) {
      bestScore = score;
      best = paint;
    }
  }
  return best;
}

const live = new Set(current.map((paint) => paint.id));
const migration = {};

for (const priorPath of priorPaths) {
  const prior = JSON.parse(readFileSync(priorPath, 'utf8'));
  const unmapped = [];
  let mapped = 0;

  for (const paint of prior) {
    // An id the current catalogue still has needs no entry, whichever
    // snapshot it came from.
    if (live.has(paint.id)) continue;

    const group =
      candidates.get(key(paint.brand, paint.name)) ??
      looseCandidates.get(looseKey(paint.brand, paint.name));
    // Deliberately no colour-based fallback for what is left: those are paints
    // the new source does not carry, and mapping them to whatever is nearest
    // would put a different product in someone's list under the old name.
    if (!group) {
      unmapped.push(`${paint.brand} — ${paint.name}`);
      continue;
    }
    migration[paint.id] = nearest(paint.hex, group).id;
    mapped += 1;
  }

  console.log(`${priorPath}`);
  console.log(`  paints    : ${prior.length}`);
  console.log(`  mapped    : ${mapped}`);
  console.log(`  unchanged : ${prior.length - mapped - unmapped.length}`);
  console.log(`  no longer in upstream: ${unmapped.length}`);
  for (const name of unmapped) console.log(`    ${name}`);
}

/**
 * The store applies this map at more than one version step, so a value that is
 * also a key would resolve one hop further on the second pass and land
 * somewhere nobody chose. Fail loudly rather than ship that.
 */
const chained = Object.values(migration).filter((target) => target in migration);
if (chained.length > 0) {
  console.error(`\nFAIL: ${chained.length} entries chain through another entry.`);
  process.exit(1);
}

const missing = Object.values(migration).filter((target) => !live.has(target));
if (missing.length > 0) {
  console.error(`\nFAIL: ${missing.length} entries point at an id the catalogue does not have.`);
  process.exit(1);
}

writeFileSync(OUT_PATH, JSON.stringify(migration, null, 2) + '\n');
console.log(`\nWrote ${Object.keys(migration).length} entries to ${OUT_PATH}`);
