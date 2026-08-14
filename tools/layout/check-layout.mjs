/**
 * Assert the app's layout invariants at every phone width it will meet.
 *
 * Usage:
 *   npm run build && npm run check:layout
 *   PACO_LAYOUT_ORIGIN=http://localhost:5173 npm run check:layout   # against `npm run dev`
 *
 * ## Why the dev server is worth checking too
 *
 * The production build is what ships, so that is the default. But development
 * renders under `StrictMode`, which invokes every layout effect twice per
 * commit — and the windowed list anchors itself from a layout effect. The
 * second invocation runs before the re-render the first one asked for, so it
 * sees stable measurements and a stale DOM. That put the browse view 92,000px
 * from the card it had scrolled to, in dev only, after this check had passed
 * clean against the production build. Point it at the dev server when touching
 * anything that measures or scrolls.
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

/** The Collab screen, from a freshly loaded page. */
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
 * is exact or anchored on the " by " — the same collision the "Go to" prefix
 * has with paint rows, and avoided the same way.
 */
async function fillSlot(page, slotLabel, paintName) {
  await page.click(`button[aria-label="Select ${slotLabel}"]`);
  await page.waitForSelector('[aria-label="Select a paint"][role="dialog"]');
  await page.click(`button[aria-label^="Select ${paintName} by "]`);
  await page.waitForSelector(`button[aria-label^="Change ${slotLabel}, currently ${paintName}"]`);
}

/**
 * The eight surfaces the app has. Each says how to reach itself from a freshly
 * loaded page; the rules below are then run against whatever is on screen, so
 * a new sheet is one entry here rather than a new set of assertions.
 *
 * `browse` also runs the three extra rules in `collectBrowseViolations` — the
 * windowed list is the one thing here that jsdom cannot check at all, because
 * every measurement it takes is zero.
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
  {
    name: 'browse',
    browse: true,
    open: async (page) => {
      // The paint row's label deliberately does not start with "Go to", which
      // is how rule 2 picks equivalent tiles — so these two never collide.
      await page.click('button[aria-label^="Show equivalents for Mephiston Red"]');
      await page.waitForSelector('[class*="resultCardJumped"]');
      await page.waitForSelector('button[aria-label^="Go to"]');
    },
  },
  {
    // The tightest row in the app: six blend blocks across the card, each with
    // a percentage and a six-digit hex beneath it. At 320px that is 46px a
    // column, which is why this surface exists rather than the empty tab.
    name: 'collab-mix',
    open: async (page) => {
      await openCollab(page);
      await fillSlot(page, 'Paint A', 'Mephiston Red');
      await fillSlot(page, 'Paint B', 'Macragge Blue');
      await page.waitForSelector('[class*="stripLabel"]');
    },
  },
  {
    // Three derived colours, each with a whole sentence of description beside
    // its swatch, and a paint card under it carrying two badges and a button.
    name: 'collab-match',
    open: async (page) => {
      await openCollab(page);
      await page.evaluate(() => {
        const tab = [...document.querySelectorAll('button')].find(
          (b) => b.textContent?.trim() === 'Matching'
        );
        tab?.click();
      });
      await fillSlot(page, 'a Base Paint', 'Abaddon Black');
      await page.waitForSelector('[class*="derivedNote"]');
    },
  },
  {
    name: 'collab-pick',
    open: async (page) => {
      await openCollab(page);
      await page.click('button[aria-label="Select Paint A"]');
      await page.waitForSelector('[aria-label="Select a paint"][role="dialog"]');
      await page.waitForSelector('button[aria-label^="Select Mephiston Red by "]');
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

/**
 * Ran in the page, on the browse surface only: the three things about a
 * windowed list that no unit test can see, because jsdom measures everything
 * as zero.
 */
function collectBrowseViolations() {
  const out = [];
  const round = (n) => Math.round(n * 10) / 10;
  const scroller = document.querySelector('[class*="results"]');
  const cards = document.querySelectorAll('[class*="resultCard"]');
  const count = document.querySelector('[class*="resultCount"]')?.textContent ?? '';
  const total = Number(count.replace(/\D+/g, '')) || 0;

  // 1. The window is a window. Mounting the catalogue is what this replaced,
  //    and it would still "work" — just at 84,000 elements and a locked scroll.
  if (total > 100 && cards.length > 16) {
    out.push({
      rule: 'window-not-mounted',
      detail: `${cards.length} cards mounted for ${total} results; the list is not windowed`,
    });
  }

  // 2. The spacers carry what is not mounted, so the scroll is as long as the
  //    catalogue rather than as long as the window.
  if (scroller && total > 100 && scroller.scrollHeight < scroller.clientHeight * 50) {
    out.push({
      rule: 'extent-short',
      detail: `scrollHeight ${scroller.scrollHeight} for ${total} results in a ${scroller.clientHeight}px viewport`,
    });
  }

  // 3. The card the sheet opened on is on screen — and still on screen after
  //    measurement has replaced the estimates that positioned it.
  const anchor = document.querySelector('[class*="resultCardJumped"]');
  if (!anchor) {
    out.push({ rule: 'anchor-missing', detail: 'nothing carries the anchored ring' });
  } else if (scroller) {
    const a = anchor.getBoundingClientRect();
    const s = scroller.getBoundingClientRect();
    if (a.bottom < s.top + 1 || a.top > s.bottom - 1) {
      out.push({
        rule: 'anchor-drifted',
        detail: `anchor spans ${round(a.top)}-${round(a.bottom)}, scroller ${round(s.top)}-${round(s.bottom)}`,
      });
    } else if (a.top < s.top + 3) {
      // `--shadow-selected-ring` is 3px outside the border box. Landing the
      // border flush with the top of the list cuts the ring off, and the card
      // reads as sliding under the brand chips rather than as the thing the
      // sheet opened on.
      out.push({
        rule: 'anchor-ring-clipped',
        detail: `anchor top ${round(a.top)} leaves no room for its ring above ${round(s.top)}`,
      });
    }
  }

  return out;
}

/**
 * The status bar and the home indicator sit on top of the app, not beside it.
 *
 * The web layer fills the whole screen on both platforms, so the only thing
 * keeping the title out from under an iPhone's clock is the safe-area inset
 * the layout spends on itself. It shipped without one: the title read as
 * "PAIN CODEX" behind 23:17 on a real phone while all 35 combinations above
 * passed clean, because a desktop Chromium has no notch to report and every
 * inset it resolves is 0.
 *
 * So the insets are injected rather than waited for. Capacitor's Android
 * SystemBars plugin sets exactly these custom properties on <html>, and the
 * tokens fall back to env() for iOS where nothing is injected — driving the
 * custom properties exercises the same calc() chain either way.
 *
 * The expectations are deltas, not pixel values: what matters is that each
 * consumer moved by the inset it was given, whatever the underlying gutter,
 * FAB offset or sheet padding happen to be this month.
 */
const INSET_TOP = 59; // iPhone 15 Pro status bar
const INSET_BOTTOM = 34; // home indicator

/** Ran in the page, before and after the injection. */
function measureInsetConsumers() {
  // The insets are spent as padding, so a header's *border box* does not move
  // and the text inside it does. Measure the text.
  const title = document.querySelector('[class*="headerWrap"] [class*="_title_"]');
  const fab = document.querySelector('button[aria-label="Add paint"]');
  const list = document.querySelector('[class*="_content_"]');
  const sheet = document.querySelector('[role="dialog"]');
  const px = (el, prop) => (el ? parseFloat(getComputedStyle(el)[prop]) : null);
  return {
    // Distance from the top of the screen, which is what the status bar covers.
    titleTop: title ? title.getBoundingClientRect().top : null,
    // Distance to the bottom of the screen, which is what the indicator covers.
    fabBottom: fab ? window.innerHeight - fab.getBoundingClientRect().bottom : null,
    listPad: px(list, 'paddingBottom'),
    sheetPad: px(sheet, 'paddingBottom'),
  };
}

async function checkSafeArea(browser, origin) {
  const page = await openApp(browser, origin, 390);
  // With a sheet open, so the overlay's own bottom padding is measured in the
  // same pass as the card behind it.
  await page.click('button[aria-label="Add paint"]');
  await page.waitForSelector('[role="dialog"]');
  await page.evaluate(() => document.fonts.ready);

  const before = await page.evaluate(measureInsetConsumers);
  await page.evaluate(
    (top, bottom) => {
      document.documentElement.style.setProperty('--safe-area-inset-top', `${top}px`);
      document.documentElement.style.setProperty('--safe-area-inset-bottom', `${bottom}px`);
    },
    INSET_TOP,
    INSET_BOTTOM
  );
  const after = await page.evaluate(measureInsetConsumers);
  await page.close();

  const out = [];
  const expect = (key, inset, what) => {
    if (before[key] === null || after[key] === null) {
      out.push({ rule: 'inset-target-missing', detail: `${what}: nothing matched the selector` });
      return;
    }
    const moved = Math.round(after[key] - before[key]);
    if (moved !== inset) {
      out.push({
        rule: 'inset-ignored',
        detail: `${what} moved ${moved}px for a ${inset}px inset (${before[key]} -> ${after[key]})`,
      });
    }
  };

  expect('titleTop', INSET_TOP, 'app title');
  expect('fabBottom', INSET_BOTTOM, 'FAB');
  // The FAB's landing zone has to rise with the FAB, or the button lands back
  // on top of the last paint in the list.
  expect('listPad', INSET_BOTTOM, 'list bottom padding');
  expect('sheetPad', INSET_BOTTOM, 'sheet bottom padding');
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
    // An origin given by hand is a server someone else is running -- usually
    // `npm run dev`, to check the StrictMode double-invoke path.
    const external = process.env.PACO_LAYOUT_ORIGIN;
    if (!external) preview = await startPreview();
    const origin = external ?? preview.origin;
    console.log(`origin: ${origin}${external ? ' (given)' : ' (vite preview of dist/)'}`);
    let failures = 0;

    for (const width of WIDTHS) {
      for (const surface of SURFACES) {
        const page = await openApp(browser, origin, width);
        await surface.open(page);
        // Cinzel is self-hosted so this resolves immediately, but a measurement
        // taken mid-swap is a measurement of the fallback serif.
        await page.evaluate(() => document.fonts.ready);

        // The windowed list corrects its own scroll once cards are measured;
        // measuring it mid-correction measures the wrong frame.
        if (surface.browse) await new Promise((r) => setTimeout(r, 400));

        const violations = await page.evaluate(collectViolations);
        if (surface.browse) violations.push(...(await page.evaluate(collectBrowseViolations)));
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

    // Not part of the width sweep: it is one measurement of one surface, and
    // it needs the insets injected rather than sampled.
    const insetViolations = await checkSafeArea(browser, origin);
    if (insetViolations.length === 0) {
      console.log('Safe area: every inset consumer moved with its inset.');
    } else {
      console.error('Safe area: FAIL');
      for (const v of insetViolations) console.error(`         ${v.rule}: ${v.detail}`);
      process.exitCode = 1;
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
