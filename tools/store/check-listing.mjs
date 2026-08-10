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

const here = dirname(fileURLToPath(import.meta.url));
const storeDir = join(here, '..', '..', 'store');

const LISTINGS = [
  { store: 'Play', file: 'listing.md' },
  { store: 'App Store', file: 'listing-appstore.md' },
];

/**
 * `**Field name** (80 char limit)` followed by the next fenced block.
 *
 * The `[^`]*` between the two is what keeps a field bound to its own fence: it
 * cannot cross a backtick, so a heading whose fence is missing fails to match
 * rather than silently measuring some later block. It also means the prose
 * between a heading and its fence must not contain inline code.
 */
const FIELD = /\*\*(.+?)\*\*\s*\((\d+)\s*char limit\)[^`]*```\r?\n([\s\S]*?)```/g;

function parseFields(markdown) {
  return [...markdown.matchAll(FIELD)].map(([, name, limit, body]) => ({
    name,
    limit: Number(limit),
    // The store counts the field's content; the fence's trailing newline is ours.
    length: body.replace(/\r\n/g, '\n').trimEnd().length,
  }));
}

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
  for (const { name, limit, length } of fields) {
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
