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
 *   npm run listing:paste                        # list the fields
 *   npm run listing:paste -- notes               # print, matched loosely
 *   npm run listing:paste -- notes --copy        # straight to the clipboard
 *
 * Use `--copy`, not `| clip`. See the note above the copy itself: the pipe
 * decodes in the console's code page and silently mangles anything outside it.
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
import { execFileSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
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
  say('Usage: npm run listing:paste -- [--copy] [--play|--appstore] <part of a field name>\n');
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

/*
 * `--copy` puts it on the clipboard without a pipe, because the pipe is lossy.
 *
 * `| clip` looks like the obvious way to do this and quietly corrupts anything
 * outside the console's active code page: clip.exe decodes its stdin with that
 * code page, 437 on this machine, so a UTF-8 em dash arrives as three question
 * marks. `listing:check` now rejects non-ASCII in a field so the fields cannot
 * carry one -- this is the second half of the same guarantee, for the day one
 * legitimately can.
 *
 * A temp file rather than stdin: it is the one channel where both ends can be
 * told the encoding outright, and PowerShell's own stdin decoding has the same
 * code page problem being avoided.
 */
if (args.includes('--copy')) {
  const tmp = join(tmpdir(), `paco-listing-${process.pid}.txt`);
  await writeFile(tmp, text, 'utf8');
  try {
    execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Set-Clipboard -Value ([IO.File]::ReadAllText('${tmp}', [Text.Encoding]::UTF8))`,
      ],
      { stdio: 'ignore' }
    );
    say('');
    say('Copied to the clipboard.');
  } finally {
    await rm(tmp, { force: true });
  }
} else {
  say('');
  process.stdout.write(text);
}
