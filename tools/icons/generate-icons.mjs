/**
 * Generate every launcher icon, splash and store graphic from one source mark.
 *
 * Android wants the same artwork at a dozen sizes across three shapes (legacy
 * square, legacy round, adaptive foreground), Play wants a 512px listing icon,
 * and the splash wants a full-bleed canvas per density and orientation. Hand
 * exporting that is how a project ends up shipping a stale icon in one bucket.
 * This regenerates all of it, so the source mark is the only thing to edit.
 *
 * Usage:
 *   npm run icons
 *
 * Source: tools/icons/source/icon.svg, or icon.png at 1024x1024 or larger.
 * The mark should be square and centred, with its own padding kept minimal --
 * this script adds the padding each target needs.
 */
import { Buffer } from 'node:buffer';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const sourceDir = join(here, 'source');
const androidRes = join(repoRoot, 'android', 'app', 'src', 'main', 'res');
const storeDir = join(repoRoot, 'store', 'graphics');

/**
 * The icon's ground. Matches --bg-page in src/shared/styles/global.css: the
 * launcher icon, the splash and the app's first painted frame are all the same
 * black, so launching reads as one continuous surface rather than three.
 */
const BACKGROUND = '#050409';

/** Density buckets, as multiples of mdpi. The names are Android's, not ours. */
const DENSITIES = [
  { name: 'mdpi', scale: 1 },
  { name: 'hdpi', scale: 1.5 },
  { name: 'xhdpi', scale: 2 },
  { name: 'xxhdpi', scale: 3 },
  { name: 'xxxhdpi', scale: 4 },
];

/** Legacy launcher icon: 48dp square. */
const LEGACY_DP = 48;

/**
 * Adaptive icon: a 108dp canvas of which only the centre 72dp is guaranteed
 * visible -- the launcher masks the rest and may parallax it. Sizing the mark
 * to 66dp keeps it inside that safe zone with room to spare, so no launcher
 * shape clips it.
 */
const ADAPTIVE_DP = 108;
const ADAPTIVE_SAFE_DP = 66;

/** Splash canvases, portrait. Landscape is the same list transposed. */
const SPLASH_PORTRAIT = [
  { name: 'mdpi', width: 320, height: 480 },
  { name: 'hdpi', width: 480, height: 800 },
  { name: 'xhdpi', width: 720, height: 1280 },
  { name: 'xxhdpi', width: 960, height: 1600 },
  { name: 'xxxhdpi', width: 1280, height: 1920 },
];

/** Fraction of the splash's shorter edge the mark occupies. */
const SPLASH_MARK_RATIO = 0.32;

/** Play Store listing icon. Fixed by Google, not by us. */
const STORE_ICON_PX = 512;

async function findSource() {
  let entries;
  try {
    entries = await readdir(sourceDir);
  } catch {
    entries = [];
  }
  const svg = entries.find((f) => f.toLowerCase() === 'icon.svg');
  const png = entries.find((f) => f.toLowerCase() === 'icon.png');
  const chosen = svg ?? png;
  if (!chosen) {
    throw new Error(
      `No source mark found.\n\n` +
        `Put the app icon at one of:\n` +
        `  tools/icons/source/icon.svg   (preferred -- resolution independent)\n` +
        `  tools/icons/source/icon.png   (1024x1024 or larger)\n\n` +
        `It should be a square, centred mark on a transparent background.\n` +
        `Until then the app still ships Capacitor's placeholder logo, which\n` +
        `must not reach the Play Store.`
    );
  }
  return join(sourceDir, chosen);
}

/**
 * Rasterise the source at exactly `px`. Sharp renders SVG at its intrinsic
 * size and then resamples, which quietly costs sharpness on a small source, so
 * ask for the density that lands on the size we want instead.
 */
async function renderSource(sourcePath, px) {
  const input = await readFile(sourcePath);
  if (sourcePath.toLowerCase().endsWith('.svg')) {
    const meta = await sharp(input).metadata();
    const intrinsic = Math.max(meta.width ?? px, meta.height ?? px);
    const density = Math.min(2400, Math.max(72, Math.ceil((px / intrinsic) * 72)));
    return sharp(input, { density })
      .resize(px, px, { fit: 'contain', background: '#00000000' })
      .png()
      .toBuffer();
  }
  return sharp(input)
    .resize(px, px, { fit: 'contain', background: '#00000000' })
    .png()
    .toBuffer();
}

/** A square canvas of BACKGROUND with the mark centred at `markPx`. */
async function onBackground(sourcePath, canvasPx, markPx, { alpha = false } = {}) {
  const mark = await renderSource(sourcePath, markPx);
  return sharp({
    create: {
      width: canvasPx,
      height: canvasPx,
      channels: 4,
      background: alpha ? '#00000000' : BACKGROUND,
    },
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toBuffer();
}

/** Circular crop, for the round launcher icon some OEM skins still ask for. */
function circleMask(px) {
  return Buffer.from(
    `<svg width="${px}" height="${px}"><circle cx="${px / 2}" cy="${px / 2}" r="${px / 2}" fill="#fff"/></svg>`
  );
}

async function write(path, buffer) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buffer);
  return path;
}

async function generateLauncherIcons(sourcePath) {
  const written = [];
  for (const { name, scale } of DENSITIES) {
    const dir = join(androidRes, `mipmap-${name}`);
    const legacyPx = Math.round(LEGACY_DP * scale);

    // The legacy icon carries its own background: pre-API-26 launchers draw
    // the bitmap as-is, with no adaptive layers to composite it onto.
    const square = await onBackground(sourcePath, legacyPx, Math.round(legacyPx * 0.72));
    written.push(await write(join(dir, 'ic_launcher.png'), square));

    const round = await sharp(square)
      .composite([{ input: circleMask(legacyPx), blend: 'dest-in' }])
      .png()
      .toBuffer();
    written.push(await write(join(dir, 'ic_launcher_round.png'), round));

    // The adaptive foreground is transparent: the background layer is a colour
    // resource, so baking the ground in here would defeat the mask entirely.
    const adaptivePx = Math.round(ADAPTIVE_DP * scale);
    const safePx = Math.round(ADAPTIVE_SAFE_DP * scale);
    const foreground = await onBackground(sourcePath, adaptivePx, safePx, { alpha: true });
    written.push(await write(join(dir, 'ic_launcher_foreground.png'), foreground));
  }
  return written;
}

async function generateSplashes(sourcePath) {
  const written = [];
  for (const { name, width, height } of SPLASH_PORTRAIT) {
    for (const [suffix, w, h] of [
      ['port', width, height],
      ['land', height, width],
    ]) {
      const markPx = Math.round(Math.min(w, h) * SPLASH_MARK_RATIO);
      const mark = await renderSource(sourcePath, markPx);
      const canvas = await sharp({
        create: { width: w, height: h, channels: 4, background: BACKGROUND },
      })
        .composite([{ input: mark, gravity: 'centre' }])
        .png()
        .toBuffer();
      written.push(await write(join(androidRes, `drawable-${suffix}-${name}`, 'splash.png'), canvas));
    }
  }
  // drawable/splash.png is the fallback for any bucket the pair above misses.
  const fallbackMark = await renderSource(sourcePath, Math.round(480 * SPLASH_MARK_RATIO));
  const fallback = await sharp({
    create: { width: 480, height: 800, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: fallbackMark, gravity: 'centre' }])
    .png()
    .toBuffer();
  written.push(await write(join(androidRes, 'drawable', 'splash.png'), fallback));
  return written;
}

/**
 * The browser tab icon, from the same mark. Kept in this script rather than
 * left as a hand-copied file because a favicon that disagrees with the launcher
 * icon is exactly the kind of drift nobody notices for a year.
 */
async function generateFavicon(sourcePath) {
  if (sourcePath.toLowerCase().endsWith('.svg')) {
    // An SVG favicon stays sharp at every tab size; no reason to rasterise it.
    return [await write(join(repoRoot, 'public', 'favicon.svg'), await readFile(sourcePath))];
  }
  const png = await renderSource(sourcePath, 180);
  return [await write(join(repoRoot, 'public', 'favicon.png'), png)];
}

async function generateStoreIcon(sourcePath) {
  // Play rejects transparency on the listing icon, so flatten onto the ground
  // rather than shipping the alpha channel the launcher icons keep.
  const icon = await onBackground(sourcePath, STORE_ICON_PX, Math.round(STORE_ICON_PX * 0.72));
  const flattened = await sharp(icon).flatten({ background: BACKGROUND }).png().toBuffer();
  return [await write(join(storeDir, 'icon-512.png'), flattened)];
}

/**
 * Both colours the native shell needs, from the one constant above.
 *
 * `splash_background` is the same value as `ic_launcher_background` but is a
 * separate name on purpose: styles.xml reads it for the window background, and
 * a launcher icon whose ground later stops matching the app's would otherwise
 * silently drag the splash with it.
 */
async function writeBackgroundColor() {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generated by tools/icons/generate-icons.mjs. Edit BACKGROUND there, not here. -->
<resources>
    <color name="ic_launcher_background">${BACKGROUND}</color>
    <color name="splash_background">${BACKGROUND}</color>
</resources>
`;
  return [await write(join(androidRes, 'values', 'ic_launcher_background.xml'), xml)];
}

async function main() {
  const sourcePath = await findSource();
  console.log(`source: ${sourcePath}`);
  const written = [
    ...(await generateLauncherIcons(sourcePath)),
    ...(await generateSplashes(sourcePath)),
    ...(await generateStoreIcon(sourcePath)),
    ...(await generateFavicon(sourcePath)),
    ...(await writeBackgroundColor()),
  ];
  for (const path of written) console.log(`  wrote ${path.replace(repoRoot, '.')}`);
  console.log(`\n${written.length} files written.`);
  console.log('Run `npm run cap:sync` if you changed anything the native project copies.');
}

main().catch((error) => {
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
});
