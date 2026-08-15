/**
 * Capture store screenshots by driving the real production build.
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
 * Output: one directory per store, see DEVICES below.
 *
 * Uses puppeteer-core against a Chromium already on the machine, so no browser
 * download. Override with CHROME_PATH if it picks the wrong one — the browser
 * and the preview server both come from tools/lib/browser.mjs.
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { launchBrowser, repoRoot, startPreview } from '../lib/browser.mjs';

const graphicsDir = join(repoRoot, 'store', 'graphics');

/**
 * One entry per store, because the two will not take each other's sizes.
 *
 * Both are given as CSS pixels at 3x rather than as a raw pixel viewport, so
 * the app lays out as a phone rather than as a very large tablet — a 1080px
 * viewport would render the desktop breakpoints and shrink them.
 *
 * - Play: 1080x1920 is the safest phone screenshot it takes. 9:16, comfortably
 *   inside the 320-3840px bounds.
 * - App Store: 1290x2796 is the 6.9" iPhone size, and it is the only iPhone set
 *   worth uploading — Apple scales it down for every smaller display, and a
 *   second set only earns its place if the layout genuinely differs. Sizes here
 *   are exact: App Store Connect rejects anything off by a pixel.
 *
 * 430 CSS px is not a number picked for this file. It is one of the seven
 * widths tools/layout/check-layout.mjs asserts against, so the layout in the
 * iOS screenshots is a layout that is already under test.
 */
const DEVICES = [
  {
    label: 'Play phone, 1080x1920',
    dir: 'screenshots',
    viewport: { width: 360, height: 640, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  },
  {
    label: 'App Store iPhone 6.9", 1290x2796',
    dir: 'screenshots-ios',
    viewport: { width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  },
];

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

async function openApp(browser, origin, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await blockUpstream(page);

  // localStorage is origin-scoped, so the page has to exist before seeding it.
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.evaluate((seed) => {
    localStorage.setItem('paco-app-store', JSON.stringify(seed));
  }, SEED);
  await page.goto(origin, { waitUntil: 'networkidle0' });
  await page.waitForSelector('button[aria-label="Add paint"]');
  return page;
}

async function shoot(page, outDir, name) {
  await mkdir(outDir, { recursive: true });
  // Fonts are self-hosted, so this resolves immediately -- but a screenshot
  // taken mid-swap shows the fallback serif, which looks like a different app.
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 400));
  const path = join(outDir, `${name}.png`);
  await page.screenshot({ path });
  console.log(`  wrote ${path.replace(repoRoot, '.')}`);
}

/** Move to the Collab screen and wait for its first empty slot. */
async function openCollab(page) {
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll('nav button')].find((b) =>
      b.textContent?.includes('Collab')
    );
    tab?.click();
  });
  await page.waitForSelector('button[aria-label="Select Paint A"]');
}

/**
 * Fill a Color Lab slot from the picker's My Lists mode.
 *
 * The empty slot's label is an exact `Select Paint A`; a picker row's is
 * `Select <name> by <brand>`. Both start with "Select", so every selector here
 * is exact or anchored on the " by " — the same collision `check-layout.mjs`
 * documents, and avoided the same way.
 */
async function fillSlot(page, slotLabel, paintName) {
  await page.click(`button[aria-label="Select ${slotLabel}"]`);
  await page.waitForSelector('[aria-label="Select a paint"][role="dialog"]');
  await page.click(`button[aria-label^="Select ${paintName} by "]`);
  await page.waitForSelector(`button[aria-label^="Change ${slotLabel}, currently ${paintName}"]`);
}

/**
 * The four shots, in order, against an already-seeded page.
 *
 * One sequence for every device rather than one per store: the point of a
 * screenshot set is that both listings show the same app, and two sequences
 * would drift the moment one of them was updated for a UI change.
 *
 * **One shot per section of the description.** The listing sells four things —
 * lists, the catalogue and its equivalents, the Color Lab, and offline — and
 * the first three are the ones a picture can carry. Until 1.2.0 all four shots
 * were List screens while the copy described a colour laboratory, which is a
 * worse listing than one that never mentions it: a reviewer reads the images
 * against the words. The second-list and new-list shots are what gave way, and
 * they were the two that showed a screen the set already had.
 *
 * Some steps use `?.click()` and would no-op silently if a selector stopped
 * matching, which is why the closing message says to look at the files.
 */
async function captureSequence(page, outDir) {
  await shoot(page, outDir, '01-list');

  await page.click('button[aria-label="Add paint"]');
  await page.waitForSelector('input[placeholder="Search by name or brand..."]');
  await page.type('input[placeholder="Search by name or brand..."]', 'blue', { delay: 40 });
  await shoot(page, outDir, '02-search');
  await page.click('button[aria-label="Close search"]');

  // Red into yellow: the blend runs through orange, so the strip reads as a
  // gradient at a glance. Two paints from opposite sides of the wheel mostly
  // pass through mud, which is true of paint and makes a poor picture.
  await openCollab(page);
  await fillSlot(page, 'Paint A', 'Mephiston Red');
  await fillSlot(page, 'Paint B', 'Averland Sunset');
  await page.waitForSelector('[class*="stripLabel"]');
  await shoot(page, outDir, '03-color-lab-mix');

  // The other half of the same screen: one paint in, three derived colours out,
  // each matched back to a real paint.
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Matching'
    );
    tab?.click();
  });
  await fillSlot(page, 'a Base Paint', 'Macragge Blue');
  await page.waitForSelector('[class*="derivedNote"]');
  await shoot(page, outDir, '04-color-lab-match');
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

    for (const { label, dir, viewport } of DEVICES) {
      console.log(`\n${label}`);
      // A fresh page per device rather than a resize: the app reads its layout
      // on mount, and a mid-session viewport change leaves the previous
      // device's measurements in place for anything that does not re-render.
      const page = await openApp(browser, preview.origin, viewport);
      await captureSequence(page, join(graphicsDir, dir));
      await page.close();
    }

    console.log('\nDone. Review every shot before uploading -- both stores');
    console.log('reject screenshots showing placeholder or debug content.');
  } finally {
    await browser.close();
    preview?.child.kill();
  }
}

main().catch((error) => {
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
});
