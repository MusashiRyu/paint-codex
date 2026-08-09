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
import { existsSync, readdirSync } from 'node:fs';
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

/**
 * Chromium downloaded by Playwright into its shared cache, newest build first.
 *
 * This binary belongs to another tool. Nothing here installs it, nothing here
 * updates it, and a `playwright uninstall` would take it away — it is a
 * convenience, not a dependency, and everything still works without it. It is
 * on the list because it is a real Chromium that was already sitting on the
 * machine while this script was declaring no browser available.
 */
function playwrightChromiums() {
  const root = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright');
  if (!root || !existsSync(root)) return [];
  try {
    return readdirSync(root)
      .filter((name) => name.startsWith('chromium-'))
      // Build numbers, so compare numerically — 'chromium-9' sorts after
      // 'chromium-1234' as a string.
      .sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))
      .map((name) => join(root, name, 'chrome-win64', 'chrome.exe'));
  } catch {
    return [];
  }
}

/**
 * Ordered by preference, not by likelihood. CHROME_PATH first because an
 * explicit override must always win; Edge last because it is the one with a
 * demonstrated failure on the maintainer's machine — see 018.
 */
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ...playwrightChromiums(),
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
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
          'citadel-base-macragge-blue',
          'citadel-layer-calgar-blue',
          'citadel-base-abaddon-black',
          'citadel-layer-white-scar',
          'citadel-base-mephiston-red',
          'citadel-base-averland-sunset',
        ],
      },
      {
        id: 'seed-rust-and-bone',
        name: 'Rust & Bone',
        icon: 'skull',
        color: '#7a8a5a',
        paintIds: [
          'citadel-base-caliban-green',
          'citadel-base-waaagh-flesh',
          'citadel-layer-ushabti-bone',
          'citadel-base-steel-legion-drab',
          'citadel-base-ratskin-flesh',
        ],
      },
    ],
    selectedListId: 'seed-cobalt',
  },
  version: 4,
};

/**
 * The first candidate that actually starts, not the first one that exists.
 *
 * Those are different things, and the difference cost two retros. Edge is
 * installed on the maintainer's machine and refuses to launch under
 * puppeteer-core (`Failed to launch the browser process: Code: 0`, empty
 * stderr). Picking by `existsSync` meant Edge was chosen, the run died, and the
 * error said "no Chromium found" while a working Chromium sat on the same disk.
 * Trying each in turn means installing a browser later, or losing one, needs no
 * edit here.
 *
 * The rejection list is the whole point of the failure message: "absent" sends
 * you to install something, a launch error sends you to a different browser.
 */
async function launchBrowser() {
  const rejected = [];

  for (const path of CHROME_CANDIDATES) {
    if (!existsSync(path)) {
      rejected.push(`${path}\n      absent`);
      continue;
    }
    try {
      const browser = await puppeteer.launch({
        executablePath: path,
        headless: true,
        args: ['--hide-scrollbars', '--force-color-profile=srgb'],
      });
      console.log(`chromium: ${path}`);
      return browser;
    } catch (error) {
      const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
      rejected.push(`${path}\n      exists, but did not start: ${reason}`);
    }
  }

  throw new Error(
    `No Chromium could be launched. Tried:\n    ${rejected.join('\n    ')}\n\n` +
      `Set CHROME_PATH to a Chrome or Edge binary that starts.`
  );
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
  // Browser before preview: a browser that will not start is the failure worth
  // reporting, and there is no reason to have a server running while finding
  // that out.
  const browser = await launchBrowser();

  // `preview` is declared out here and started inside the try so that a preview
  // that fails to come up still closes the browser. Starting it before the try
  // would leak a headless Chromium on that path.
  let preview;
  try {
    preview = await startPreview();
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
    preview?.kill();
  }
}

main().catch((error) => {
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
});
