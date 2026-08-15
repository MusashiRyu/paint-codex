/**
 * Print one listing field with the hard wrap taken out, ready to paste.
 *
 * The listing files are wrapped at 80 columns so they can be read and reviewed
 * as markdown. Store consoles are plain textareas, so pasting a block straight
 * out of the file leaves a line break in the middle of every sentence — which
 * an App Review reviewer then reads. Unwrapping by hand risks mangling a field
 * that has to be exact, and there are fifteen of them across two files.
 *
 * Usage:
 *   npm run listing:paste                       # list the fields
 *   npm run listing:paste -- notes              # print, matched loosely
 *   npm run listing:paste -- notes | clip       # straight to the clipboard
 *
 * The match is case-insensitive and needs only to be contained in the field's
 * name, so `notes`, `1.2.0` and `subtitle` all work. An ambiguous match lists
 * the candidates rather than guessing, because guessing wrong here means
 * pasting the description into the What's New field.
 *
 * **An exact name beats a substring**, or one field would be unreachable: every
 * substring of the App Store's `Description` is also inside Play's `Short
 * description` and `Full description`, so nothing could ever select it. With
 * this rule `description` is the App Store's and `full description` is Play's.
 *
 * `--play` and `--appstore` narrow by store, which is what separates the two
 * fields that genuinely share a name — `App name` exists in both files.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFields, unwrap } from './listingFields.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const storeDir = join(here, '..', '..', 'store');

const LISTINGS = [
  { store: 'Play', file: 'listing.md' },
  { store: 'App Store', file: 'listing-appstore.md' },
];

const all = [];
for (const { store, file } of LISTINGS) {
  for (const field of parseFields(await readFile(join(storeDir, file), 'utf8'))) {
    all.push({ ...field, store, file });
  }
}

const args = process.argv.slice(2);
const wantStore = args.includes('--play')
  ? 'Play'
  : args.includes('--appstore')
    ? 'App Store'
    : null;
const query = args
  .filter((a) => !a.startsWith('--'))
  .join(' ')
  .trim()
  .toLowerCase();

/** Everything goes to stderr except the field itself, so `| clip` stays clean. */
const say = (line = '') => console.error(line);

const pool = wantStore ? all.filter((f) => f.store === wantStore) : all;

if (!query) {
  say('Usage: npm run listing:paste -- [--play|--appstore] <part of a field name>\n');
  for (const { store, name, limit } of pool) {
    say(`  ${store.padEnd(10)} ${name.padEnd(22)} ${limit} char limit`);
  }
  process.exit(1);
}

const exact = pool.filter((f) => f.name.toLowerCase() === query);
const hits = exact.length > 0 ? exact : pool.filter((f) => f.name.toLowerCase().includes(query));

if (hits.length === 0) {
  say(`No field matching "${query}". Run with no argument to list them.`);
  process.exit(1);
}
if (hits.length > 1) {
  say(`"${query}" matches ${hits.length} fields:\n`);
  for (const { store, name } of hits) say(`  ${store.padEnd(10)} ${name}`);
  say('\nNarrow it down, or pass --play / --appstore.');
  process.exit(1);
}

const [field] = hits;
const text = unwrap(field.body);

say(`${field.store} — ${field.name}`);
say(`${text.length} of ${field.limit} characters (${field.body.length} wrapped)`);
say('');

process.stdout.write(text);
