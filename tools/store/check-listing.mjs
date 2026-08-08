/**
 * Check the store listing copy against Play's character limits.
 *
 * The Console truncates silently in some fields and rejects in others, and
 * either way you find out while staring at a form rather than while writing.
 * Every field in store/listing.md declares its own limit in its heading, so
 * this stays correct as fields are added.
 *
 * Usage:
 *   npm run listing:check
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const listingPath = join(here, '..', '..', 'store', 'listing.md');

/** `**Field name** (80 char limit)` followed by the next fenced block. */
const FIELD = /\*\*(.+?)\*\*\s*\((\d+)\s*char limit\)[^`]*```\r?\n([\s\S]*?)```/g;

const markdown = await readFile(listingPath, 'utf8');

const fields = [...markdown.matchAll(FIELD)].map(([, name, limit, body]) => ({
  name,
  limit: Number(limit),
  // Play counts the field's content; the fence's trailing newline is ours.
  length: body.replace(/\r\n/g, '\n').trimEnd().length,
}));

if (fields.length === 0) {
  console.error(`No "(N char limit)" fields found in ${listingPath}.`);
  process.exit(1);
}

let failed = false;
for (const { name, limit, length } of fields) {
  const ok = length <= limit;
  if (!ok) failed = true;
  const status = ok ? 'ok  ' : 'OVER';
  console.log(`${status} ${name.padEnd(20)} ${String(length).padStart(4)} / ${limit}`);
}

if (failed) {
  console.error('\nAt least one field is over Play\'s limit.');
  process.exit(1);
}
console.log(`\n${fields.length} fields within limits.`);
