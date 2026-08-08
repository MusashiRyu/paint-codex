/**
 * Capture Play Store screenshots by driving the real production build.
 *
 * Store screenshots are the one asset that goes stale invisibly: the app gets
 * restyled, the listing keeps showing last year's UI, and nobody notices
 * because nobody looks at their own listing. Driving the built app means
 * regenerating them is one command rather than an afternoon with a device.
 *
 * Usage:
 *   npm run build          # the script serves dist/, it does not build it
 *   npm run screenshots
 *
 * Output: store/graphics/screenshots/*.png at 1080x1920.
 *
 * Uses puppeteer-core against a Chromium already on the machine, so no browser
 * download. Override with CHROME_PATH if it picks the wrong one.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const outDir = join(repoRoot, 'store', 'graphics', 'screenshots');

const PORT = 4173;
const ORIGIN = `http://localhost:${PORT}`;

/**
 * 1080x1920 is the safest phone screenshot Play takes: 9:16, comfortably inside
 * the 320-3840px bounds. Rendered as 360 CSS pixels at 3x rather than a 1080px
 * viewport, so the app lays out as a phone instead of a very large tablet.
 */
const VIEWPORT = { width: 360, height: 640, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

/**
 * Seed state, written straight into the persist key rather than clicked in.
 * Screenshots of an empty app sell nothing, and building the same two lists
 * through the UI on every run is slow and fragile.
 *
 * The `version` must track the store's persist version in
 * src/app/providers/store.ts, or the migration runs against the wrong shape.
 *
 * List names are deliberately invented rather than real faction names. The
 * catalogue naming paint brands is nominative use -- a conversion chart has to
 * say "Citadel" to be a conversion chart. A store listing whose screenshots are
 * covered in another company's faction trademarks is not that, and is the kind
 * of thing that draws a complaint against the listing rather than the app.
 */
const SEED = {
  state: {
    lists: [
      {
        id: 'seed-cobalt',
        name: 'Cobalt Knights',
        icon: 'shield',
        color: '#4a6fa5',
        paintIds: [
          'citadel-macragge-blue',
          'citadel-calgar-blue',
          'citadel-abaddon-black',
          'citadel-white-scar',
          'citadel-mephiston-red',
          'citadel-averland-sunset',
        ],
      },
      {
        id: 'seed-rust-and-bone',
        name: 'Rust & Bone',
        icon: 'skull',
        color: '#7a8a5a',
        paintIds: [
          'citadel-caliban-green',
          'citadel-waaagh-flesh',
          'citadel-ushabti-bone',
          'citadel-steel-legion-drab',
          'citadel-ratskin-flesh',
        ],
      },
    ],
    selectedListId: 'seed-cobalt',
  },
  version: 2,
};

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

/** Serve dist/ with vite preview and resolve once it is actually answering. */
async function startPreview() {
  if (!existsSync(join(repoRoot, 'dist', 'index.html'))) {
    throw new Error('dist/index.html not found. Run `npm run build` first.');
  }
  // Vite's JS entry point rather than `npx vite`: on Windows npx resolves to a
  // .cmd, which Node refuses to spawn without a shell, and a shell then wants
  // the arguments concatenated into one escaped string. Running the script with
  // the current node binary sidesteps both.
  const viteBin = join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--port', String(PORT), '--strictPort'],
    { cwd: repoRoot, stdio: 'ignore' }
  );

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(ORIGIN);
      if (res.ok) return child;
    } catch {
      // Not listening yet.
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  child.kill();
  throw new Error(`vite preview did not come up on ${ORIGIN} within 30s.`);
}

/**
 * The catalogue refresh fires once per launch against raw.githubusercontent.com.
 * Left alone it can swap the paints mid-capture, so a screenshot run would
 * depend on upstream and on the network. Block it and let the app fall back to
 * the bundled snapshot, which is what a fresh install shows anyway.
 */
async function blockUpstream(page) {
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.url().includes('githubusercontent.com')) req.abort();
    else req.continue();
  });
}

async function openApp(browser) {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await blockUpstream(page);

  // localStorage is origin-scoped, so the page has to exist before seeding it.
  await page.goto(ORIGIN, { waitUntil: 'domcontentloaded' });
  await page.evaluate((seed) => {
    localStorage.setItem('paco-app-store', JSON.stringify(seed));
  }, SEED);
  await page.goto(ORIGIN, { waitUntil: 'networkidle0' });
  await page.waitForSelector('button[aria-label="Add paint"]');
  return page;
}

async function shoot(page, name) {
  await mkdir(outDir, { recursive: true });
  // Fonts are self-hosted, so this resolves immediately -- but a screenshot
  // taken mid-swap shows the fallback serif, which looks like a different app.
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 400));
  const path = join(outDir, `${name}.png`);
  await page.screenshot({ path });
  console.log(`  wrote ${path.replace(repoRoot, '.')}`);
}

async function main() {
  const chrome = findChrome();
  console.log(`chromium: ${chrome}`);
  const preview = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ['--hide-scrollbars', '--force-color-profile=srgb'],
  });

  try {
    const page = await openApp(browser);

    await shoot(page, '01-list');

    await page.click('button[aria-label="Add paint"]');
    await page.waitForSelector('input[placeholder="Search by name or brand..."]');
    await page.type('input[placeholder="Search by name or brand..."]', 'blue', { delay: 40 });
    await shoot(page, '02-search');
    await page.click('button[aria-label="Close search"]');

    // Second list: a different palette, so the two list screenshots do not read
    // as the same picture twice.
    await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('button')];
      tabs.find((b) => b.textContent?.includes('Rust & Bone'))?.click();
    });
    await shoot(page, '03-second-list');

    await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('button')];
      tabs.find((b) => b.textContent?.trim().startsWith('+'))?.click();
    });
    await page.waitForSelector('input[placeholder="List name..."]');
    await page.type('input[placeholder="List name..."]', 'Crimson Order', { delay: 40 });
    await shoot(page, '04-new-list');

    console.log('\nDone. Review every shot before uploading -- Play rejects');
    console.log('screenshots showing placeholder or debug content.');
  } finally {
    await browser.close();
    preview.kill();
  }
}

main().catch((error) => {
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
});
