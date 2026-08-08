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
 * Run once against the pre-migration snapshot, which is in git history:
 *
 *   git show <commit>:src/data/paints.snapshot.json > legacy.json
 *   node tools/scraper/buildIdMigration.mjs legacy.json
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

const legacyPath = process.argv[2];
if (!legacyPath) {
  console.error('Usage: node tools/scraper/buildIdMigration.mjs <legacy-snapshot.json>');
  process.exit(1);
}

const legacy = JSON.parse(readFileSync(legacyPath, 'utf8'));
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

const migration = {};
const unmapped = [];
for (const paint of legacy) {
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
  const target = nearest(paint.hex, group);
  // An id that survived the change unaltered needs no entry.
  if (target.id !== paint.id) migration[paint.id] = target.id;
}

writeFileSync(OUT_PATH, JSON.stringify(migration, null, 2) + '\n');

console.log(`legacy paints : ${legacy.length}`);
console.log(`mapped        : ${Object.keys(migration).length}`);
console.log(`unchanged     : ${legacy.length - Object.keys(migration).length - unmapped.length}`);
console.log(`no longer in upstream: ${unmapped.length}`);
for (const name of unmapped) console.log(`  ${name}`);
console.log(`\nWrote ${OUT_PATH}`);
