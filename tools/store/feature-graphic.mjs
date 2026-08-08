/**
 * Render the Play Store feature graphic: 1024x500, the banner at the top of
 * the listing.
 *
 * Drawn in a headless browser rather than composited with an image library so
 * it can use the app's actual self-hosted Cinzel woff2. Rendering the wordmark
 * through a system font renderer means whatever serif that machine happens to
 * have, and a listing banner set in the wrong typeface is worse than none.
 *
 * Usage:
 *   npm run feature-graphic
 *
 * Output: store/graphics/feature-graphic.png
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const outDir = join(repoRoot, 'store', 'graphics');

/** Fixed by Google. Not a suggestion -- Play rejects any other size. */
const WIDTH = 1024;
const HEIGHT = 500;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

/** Swatches lifted from the bundled catalogue, so the colours are real paints. */
const SWATCHES = [
  '#14397A', // Macragge Blue
  '#456EB5', // Calgar Blue
  '#9B0E0E', // Mephiston Red
  '#FBBA00', // Averland Sunset
  '#003B1D', // Caliban Green
  '#C6C180', // Ushabti Bone
];

function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      `No Chromium found. Tried:\n  ${CHROME_CANDIDATES.join('\n  ')}\n` +
        `Set CHROME_PATH to a Chrome or Edge binary.`
    );
  }
  return found;
}

/**
 * Everything is inlined as data URIs. The page is loaded via setContent, which
 * has no origin, so a relative font or image URL would resolve to nothing and
 * fail silently -- producing a banner in Times New Roman on a flat background.
 */
async function buildHtml() {
  const font = (await readFile(join(repoRoot, 'public', 'fonts', 'cinzel-500-latin.woff2'))).toString('base64');
  const texture = (await readFile(join(repoRoot, 'public', 'imagery', 'bg-card.png'))).toString('base64');

  const swatchRow = SWATCHES.map(
    (hex) => `<div class="swatch" style="background:${hex}"></div>`
  ).join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face {
    font-family: 'Cinzel';
    font-style: normal;
    font-weight: 500 700;
    font-display: block;
    src: url(data:font/woff2;base64,${font}) format('woff2');
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden;
    background: #050409;
    font-family: 'Cinzel', serif;
    -webkit-font-smoothing: antialiased;
  }
  .stage { position: relative; width: 100%; height: 100%; }
  .texture {
    position: absolute; inset: 0;
    background-image: url(data:image/png;base64,${texture});
    background-size: cover; background-position: center;
    opacity: 0.55;
  }
  /* Play crops the edges of this banner in some placements and overlays its own
     chrome at the bottom, so the artwork fades out rather than ending on a hard
     edge and nothing important sits in the outer band. */
  .vignette {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 50% 45%, rgba(5,4,9,0) 0%, rgba(5,4,9,0.55) 62%, rgba(5,4,9,0.95) 100%);
  }
  .content {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 26px;
  }
  .title {
    font-weight: 700; font-size: 96px; letter-spacing: 0.06em;
    color: #dcb877;
    text-shadow: 0 2px 24px rgba(0,0,0,0.75);
  }
  .subtitle {
    font-weight: 500; font-size: 27px; letter-spacing: 0.42em;
    color: #ab9f8c; text-indent: 0.42em;
  }
  .rule { display: flex; align-items: center; gap: 14px; }
  .rule .line { width: 150px; height: 1px; background: rgba(201,168,106,0.38); }
  .rule .pip {
    width: 9px; height: 9px; background: #c9a86a; opacity: 0.62;
    transform: rotate(45deg);
  }
  .swatches { display: flex; gap: 15px; margin-top: 4px; }
  .swatch {
    width: 52px; height: 52px; border-radius: 11px;
    border: 1px solid rgba(201,168,106,0.30);
    box-shadow: 0 3px 14px rgba(0,0,0,0.6);
  }
</style></head>
<body>
  <div class="stage">
    <div class="texture"></div>
    <div class="vignette"></div>
    <div class="content">
      <div class="title">PAINT CODEX</div>
      <div class="rule"><span class="line"></span><span class="pip"></span><span class="line"></span></div>
      <div class="subtitle">CITADEL &middot; VALLEJO &middot; ARMY PAINTER</div>
      <div class="swatches">${swatchRow}</div>
    </div>
  </div>
</body></html>`;
}

async function main() {
  const chrome = findChrome();
  console.log(`chromium: ${chrome}`);
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ['--hide-scrollbars', '--force-color-profile=srgb'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
    await page.setContent(await buildHtml(), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    await mkdir(outDir, { recursive: true });
    const path = join(outDir, 'feature-graphic.png');
    await page.screenshot({ path });
    console.log(`  wrote ${path.replace(repoRoot, '.')}  (${WIDTH}x${HEIGHT})`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
});
