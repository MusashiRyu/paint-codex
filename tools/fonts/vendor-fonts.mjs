import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SCRATCH = process.argv[2];
const REPO = process.argv[3];
const KEEP = new Set(['latin', 'latin-ext']);

const css = readFileSync(join(SCRATCH, 'gf.css'), 'utf8');

// Each @font-face is preceded by a /* subset */ comment.
const blocks = [];
const re = /\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
let m;
while ((m = re.exec(css)) !== null) {
  blocks.push({ subset: m[1], body: m[2] });
}

const kept = blocks.filter((b) => KEEP.has(b.subset));
const urls = new Map(); // remote url -> local filename

function fieldOf(body, name) {
  const found = body.match(new RegExp(`${name}:\\s*([^;]+);`));
  return found ? found[1].trim() : '';
}

for (const b of kept) {
  const url = fieldOf(b.body, 'src').match(/url\(([^)]+)\)/)[1];
  if (urls.has(url)) continue;
  const family = fieldOf(b.body, 'font-family').replace(/['"]/g, '').replace(/\s+/g, '');
  const weight = fieldOf(b.body, 'font-weight');
  const style = fieldOf(b.body, 'font-style');
  const suffix = style === 'italic' ? '-italic' : '';
  urls.set(url, `${family.toLowerCase()}-${weight}${suffix}-${b.subset}.woff2`);
}

// Weights that share a URL are one variable file; name it by the URL's first use.
const outDir = join(REPO, 'public', 'fonts');
mkdirSync(outDir, { recursive: true });

const manifest = [...urls.entries()].map(([url, file]) => ({ url, file }));
writeFileSync(join(SCRATCH, 'font-manifest.json'), JSON.stringify(manifest, null, 2));

const rules = kept.map((b) => {
  const src = fieldOf(b.body, 'src');
  const url = src.match(/url\(([^)]+)\)/)[1];
  const local = urls.get(url);
  return b.body
    .replace(/src:\s*[^;]+;/, `src: url('/fonts/${local}') format('woff2');`)
    .replace(/@font-face\s*\{/, '@font-face {');
});

const header = `/*
 * Self-hosted copies of Cinzel and EB Garamond (SIL Open Font License 1.1).
 *
 * Vendored rather than loaded from fonts.googleapis.com: the packaged
 * Capacitor app has no network guarantee, so a CDN link means the grimoire
 * typography silently falls back to a system serif offline, and every launch
 * would disclose the device IP to a third party.
 *
 * Only the latin and latin-ext subsets are shipped. Regenerate with
 * tools/fonts/vendor-fonts.mjs if the family list changes.
 */
`;

writeFileSync(
  join(REPO, 'src', 'shared', 'styles', 'fonts.css'),
  header + '\n' + rules.join('\n\n') + '\n'
);

console.log(`font-face blocks kept: ${kept.length} (of ${blocks.length})`);
console.log(`unique files to download: ${urls.size}`);
