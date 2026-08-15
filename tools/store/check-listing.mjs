/**
 * Check the store listing copy against each store's character limits.
 *
 * The consoles truncate silently in some fields and reject in others, and
 * either way you find out while staring at a form rather than while writing.
 * Every field declares its own limit in its heading, so this stays correct as
 * fields are added.
 *
 * Two files, because the two stores do not ask for the same things: Play wants
 * a short description and a long one, Apple wants a subtitle, a keyword list
 * and promotional text. The limits differ even where the fields look alike --
 * Play's release notes cap at 500 characters, Apple's What's New at 4000.
 *
 * Usage:
 *   npm run listing:check
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFields } from './listingFields.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const storeDir = join(here, '..', '..', 'store');

const LISTINGS = [
  { store: 'Play', file: 'listing.md' },
  { store: 'App Store', file: 'listing-appstore.md' },
];

let failed = false;
let total = 0;

for (const { store, file } of LISTINGS) {
  const path = join(storeDir, file);
  const fields = parseFields(await readFile(path, 'utf8'));

  if (fields.length === 0) {
    console.error(`No "(N char limit)" fields found in ${path}.`);
    process.exit(1);
  }

  console.log(`${store}  (store/${file})`);
  for (const { name, limit, body } of fields) {
    // The wrapped source, which is never shorter than what `paste-field.mjs`
    // hands the console -- so this can over-count but never under-count, and a
    // field that passes here cannot be rejected for length.
    const length = body.length;
    const ok = length <= limit;
    if (!ok) failed = true;
    console.log(`  ${ok ? 'ok  ' : 'OVER'} ${name.padEnd(20)} ${String(length).padStart(4)} / ${limit}`);
  }
  console.log('');
  total += fields.length;
}

if (failed) {
  console.error('At least one field is over its store\'s limit.');
  process.exit(1);
}
console.log(`${total} fields within limits.`);
