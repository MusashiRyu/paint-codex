/**
 * Assert the app's layout invariants at every phone width it will meet.
 *
 * Usage:
 *   npm run build && npm run check:layout
 *
 * ## Why a browser, and not a unit test
 *
 * The bug this exists for: the IN LIST badge in an equivalent tile sat beside
 * its swatch on a 390px phone and wrapped under it on a 412px one — the grid
 * fits a third column there, and three columns are narrower than two. Every
 * unit test passed, because jsdom has no layout engine. `getBoundingClientRect`
 * returns zeroes, `grid-template-columns` is a string nobody resolves, and a
 * wrapped flex line is indistinguishable from an unwrapped one.
 *
 * So the check has to be a real engine at real widths. It drives the built app
 * exactly as the store screenshots do, and asserts geometry rather than pixels:
 * no screenshot to re-approve when a colour changes, and a failure names the
 * element and the two numbers that disagree.
 *
 * ## The widths
 *
 * Not "a phone and a big phone" — the specific CSS widths that change how many
 * equivalent columns fit, which is where this class of bug lives. 320 is the
 * narrowest phone still in use; 412 and 430 are the Pixel and iPhone Pro Max
 * sizes that first fit three columns; 540 is a small tablet in portrait.
 */
import { launchBrowser, startPreview } from '../lib/browser.mjs';

const WIDTHS = [320, 360, 390, 412, 430, 480, 540];

/**
 * Two lists and a paint that is an equivalent of several others, so the sheet
 * renders tiles that are in the list and tiles that are not. `version` must
 * track the store's persist version in src/app/providers/store.ts.
 */
const SEED = {
  state: {
    lists: [
      {
        id: 'seed-a',
        name: 'Cobalt Knights',
        icon: 'shield',
        color: '#4a6fa5',
        paintIds: [
          'citadel-base-mephiston-red',
          'citadel-layer-evil-sunz-scarlet',
          'citadel-base-macragge-blue',
          'citadel-base-abaddon-black',
        ],
      },
      { id: 'seed-b', name: 'Rust & Bone', icon: 'skull', color: '#7a8a5a', paintIds: [] },
    ],
    selectedListId: 'seed-a',
  },
  version: 4,
};

/**
 * The four surfaces the app has. Each says how to reach itself from a freshly
 * loaded page; the rules below are then run against whatever is on screen, so
 * a new sheet is one entry here rather than a new set of assertions.
 */
const SURFACES = [
  { name: 'lists', open: async () => {} },
  {
    name: 'search',
    open: async (page) => {
      await page.click('button[aria-label="Add paint"]');
      await page.waitForSelector('input[placeholder="Search by name or brand..."]');
      await page.type('input[placeholder="Search by name or brand..."]', 'red');
      await page.waitForSelector('button[aria-label^="Go to"]');
    },
  },
  {
    name: 'new-list',
    open: async (page) => {
      await page.evaluate(() => {
        const tab = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '+New');
        tab?.click();
      });
      await page.waitForSelector('[aria-label="Create a new list"]');
    },
  },
  {
    name: 'about',
    open: async (page) => {
      await page.click('button[aria-label="About Paco"]');
      await page.waitForSelector('[aria-label="About Paco"][role="dialog"]');
    },
  },
];

/** Ran in the page: every rule, so one pass reports all of them. */
function collectViolations() {
  const out = [];
  const round = (n) => Math.round(n * 10) / 10;

  // 1. Nothing may push the page sideways. A phone that scrolls horizontally is
  //    a layout that has already failed, whatever it looks like.
  if (document.documentElement.scrollWidth > window.innerWidth) {
    out.push({
      rule: 'page-overflow',
      detail: `document is ${document.documentElement.scrollWidth}px wide in a ${window.innerWidth}px viewport`,
    });
  }

  // 2. An equivalent tile's IN LIST badge shares the swatch's row. The tile is
  //    sized for the pair; a badge on its own line means the grid let a column
  //    get narrower than its contents. This is the rule the whole file exists
  //    for — a 412px phone fits a third column, and three columns are narrower
  //    than two, so the bug appeared on the roomiest devices.
  const tiles = [...document.querySelectorAll('button[aria-label^="Go to"]')];
  let badged = 0;
  for (const tile of tiles) {
    const head = tile.firstElementChild;
    const [swatch, badge] = head?.children ?? [];
    if (!badge) continue;
    badged += 1;
    const s = swatch.getBoundingClientRect();
    const b = badge.getBoundingClientRect();
    if (b.top >= s.bottom - 1) {
      out.push({
        rule: 'badge-wrapped',
        detail: `${tile.getAttribute('aria-label')}: badge top ${round(b.top)} is below swatch bottom ${round(s.bottom)}`,
      });
    }
    const tileBox = tile.getBoundingClientRect();
    if (b.right > tileBox.right + 0.5 || b.left < tileBox.left - 0.5) {
      out.push({
        rule: 'badge-outside-tile',
        detail: `${tile.getAttribute('aria-label')}: badge spans ${round(b.left)}-${round(b.right)}, tile ${round(tileBox.left)}-${round(tileBox.right)}`,
      });
    }
  }
  if (tiles.length > 0 && badged === 0) {
    out.push({ rule: 'no-badges', detail: 'no tile rendered an IN LIST badge; the seed is wrong' });
  }

  // 3. Nothing may spill sideways out of the surface holding it — the sheet if
  //    one is open, the app card otherwise. Catches a chip row, a long paint
  //    name or a badge escaping its card at any width.
  const container = document.querySelector('[role="dialog"]') ?? document.querySelector('main, #root > div');
  if (container) {
    const box = container.getBoundingClientRect();
    for (const el of container.querySelectorAll('*')) {
      const elBox = el.getBoundingClientRect();
      if (elBox.width === 0) continue;
      // The brand filter and list tab rows scroll sideways on purpose, so
      // anything *inside* one is allowed past the edge — the row itself is not.
      // Walking the whole chain matters: a chip's overflowing text sits two
      // levels down from the scroller, inside a button.
      let scrolled = false;
      for (let p = el.parentElement; p && p !== container; p = p.parentElement) {
        if (['auto', 'scroll'].includes(getComputedStyle(p).overflowX)) {
          scrolled = true;
          break;
        }
      }
      if (scrolled) continue;
      if (elBox.right > box.right + 0.5 || elBox.left < box.left - 0.5) {
        out.push({
          rule: 'surface-overflow',
          detail: `<${el.tagName.toLowerCase()} class="${el.className}"> spans ${round(elBox.left)}-${round(elBox.right)}, surface ${round(box.left)}-${round(box.right)}`,
        });
      }
    }

    // 4. A label clipped by its own box reads as a shorter word.
    for (const el of container.querySelectorAll('button, [class*="Name"], [class*="Brand"], [class*="Label"]')) {
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'auto') {
        out.push({
          rule: 'text-clipped',
          detail: `<${el.tagName.toLowerCase()} class="${el.className}"> content ${el.scrollWidth}px in ${el.clientWidth}px`,
        });
      }
    }
  }

  return out;
}

async function openApp(browser, origin, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 780, deviceScaleFactor: 1, isMobile: true, hasTouch: true });

  // The catalogue refresh would otherwise swap the paints mid-run, making the
  // check depend on upstream and on the network.
  await page.setRequestInterception(true);
  page.on('request', (req) => (req.url().includes('githubusercontent.com') ? req.abort() : req.continue()));

  // localStorage is origin-scoped, so the page has to exist before seeding it.
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.evaluate((seed) => localStorage.setItem('paco-app-store', JSON.stringify(seed)), SEED);
  await page.goto(origin, { waitUntil: 'networkidle0' });
  await page.waitForSelector('button[aria-label="Add paint"]');
  return page;
}

async function main() {
  const browser = await launchBrowser();
  let preview;
  try {
    preview = await startPreview();
    let failures = 0;

    for (const width of WIDTHS) {
      for (const surface of SURFACES) {
        const page = await openApp(browser, preview.origin, width);
        await surface.open(page);
        // Cinzel is self-hosted so this resolves immediately, but a measurement
        // taken mid-swap is a measurement of the fallback serif.
        await page.evaluate(() => document.fonts.ready);

        const violations = await page.evaluate(collectViolations);
        const columns = await page.evaluate(() => {
          const grid = document.querySelector('[class*="equivGrid"]');
          return grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0;
        });
        await page.close();

        const label =
          `${String(width).padStart(4)}px  ${surface.name.padEnd(9)}` +
          (columns ? ` ${columns} equivalent column(s)` : '');
        if (violations.length === 0) {
          console.log(`  ok   ${label}`);
        } else {
          failures += 1;
          console.log(`  FAIL ${label}`);
          for (const v of violations) console.log(`         ${v.rule}: ${v.detail}`);
        }
      }
    }

    const total = WIDTHS.length * SURFACES.length;
    if (failures > 0) {
      console.error(`\n${failures} of ${total} surface/width combinations have layout violations.`);
      process.exitCode = 1;
    } else {
      console.log(`\nAll ${total} surface/width combinations clean.`);
    }
  } finally {
    preview?.child.kill();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
