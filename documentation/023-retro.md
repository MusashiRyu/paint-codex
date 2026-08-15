# Retro 023 — The bug that only appears on the roomiest phones

The IN LIST badge added in 021 sat beside its swatch on a 390px phone and
wrapped under it on a 412px one. Not a rounding error: the equivalents grid
fits a *third* column at 412px, and three columns are narrower than two. More
screen, less tile.

Reported from a device. Every test passed.

## What was done

### The tile is now sized for what it holds

Measured rather than argued about, at five widths in a real engine:

| Viewport | Columns | Tile content | Head row needs |
| --- | --- | --- | --- |
| 360 | 2 | 120px | 106px ✔ |
| 390 | 2 | 135px | 106px ✔ |
| **412** | **3** | **87px** | **106px ✘** |
| **430** | **3** | **93px** | **106px ✘** |
| 480 | 3 | 110px | 106px ✔ |

The head row wants `34 + 8 + 63.7 = 105.7px`: swatch, gap, badge. That settled
the question of whether a smaller badge could fix it — the badge's *text* alone
is 45.7px, so even at zero padding it does not fit in 87px. The tile was too
narrow, and no badge size changes that.

So the grid floor went from `minmax(104px, 1fr)` to `minmax(136px, 1fr)` —
105.7px of content plus 18px of tile padding and 2px of border, rounded up.
A column can no longer be narrower than the pair it must hold.

Consequences, stated plainly because they are the trade:

- **Three columns are now unreachable.** The app is full-bleed below 500px and a
  fixed 390px card above it, so the widest sheet in practice holds two 136px
  columns and not three. A 412px phone shows two roomier tiles where it used to
  show three cramped ones.
- **320px drops to one column.** The narrowest phone still in use now stacks
  equivalents full-width. That is the only way to satisfy "the badge is always
  on the swatch's row" at that width; the alternative was keeping two columns
  and letting it wrap, which is the bug.

### A test that can see layout

`npm run check:layout` — `tools/layout/check-layout.mjs`, wired into CI after
the build.

**Why not a unit test:** jsdom has no layout engine. `getBoundingClientRect`
returns zeroes, `grid-template-columns` is a string nobody resolves, and a
wrapped flex line is indistinguishable from an unwrapped one. The 128 tests
that passed while this bug shipped were not weak tests; they were blind to the
entire class.

It drives the built app the way the store screenshots do — seeded
`localStorage`, upstream blocked — over **7 widths × 4 surfaces**:

| | |
| --- | --- |
| Widths | 320, 360, 390, 412, 430, 480, 540 — the sizes where the equivalents grid changes column count, not "a phone and a big phone" |
| Surfaces | lists, search, new-list, about |
| `page-overflow` | the document never exceeds the viewport |
| `badge-wrapped` | an IN LIST badge's top is above its swatch's bottom |
| `badge-outside-tile` | and the badge stays inside the tile |
| `surface-overflow` | nothing spills sideways out of its sheet or card — anything inside a deliberate horizontal scroller is exempt, checked by walking the ancestor chain rather than the parent, since a chip's text sits two levels below the scroller |
| `text-clipped` | `scrollWidth > clientWidth` on any label |

It asserts geometry, never pixels: no screenshot to re-approve when a color
changes, and a failure prints the element and the two numbers that disagree.

**It was verified by failing.** Reverting the grid to `104px` and re-running
produces `badge-wrapped` at 320px and 412px — the exact devices the report came
from — and a clean run at every width once restored. A check that has never
failed has not been tested.

### One browser launcher, not three

`tools/lib/browser.mjs` now owns `launchBrowser()` and `startPreview()`.

This was not tidying. Three tools drive a Chromium, each had grown its own copy
of the candidate list, and the copies had drifted: `screenshots.mjs` learned in
018 that a browser which *exists* is not a browser that *starts*, and
`feature-graphic.mjs` was still picking by `existsSync` — so it would still have
chosen the same broken Edge and reported "no Chromium found" with a working one
on the disk. Extracting the module fixed a live bug in a tool nobody had run
since.

`--no-sandbox` and `--disable-dev-shm-usage` are added under `CI` only: the
runner image's AppArmor policy denies the user namespaces Chrome's sandbox
needs, and neither flag belongs on a dev machine.

## Files changed

**New**
- `tools/layout/check-layout.mjs`
- `tools/lib/browser.mjs`
- `documentation/023-retro.md`

**Modified**
- `src/features/search/SearchSheet.module.css` — the grid floor
- `tools/store/screenshots.mjs`, `tools/store/feature-graphic.mjs` — onto the shared launcher
- `.github/workflows/ci.yml` — the layout check step
- `package.json` — `check:layout`
- `store/graphics/screenshots/02-search.png` — re-rendered against the new grid
- `documentation/0.1-architecture.md` — two tool rows, and the grid floor

## Measured, and found not to be a problem

- **A smaller badge cannot fix this.** 45.7px of text in 87px of tile, against
  34px of swatch and an 8px gap. Dropping the tracking and the padding buys
  ~17px and still overflows.
- **The store screenshots needed re-rendering, and only one changed.**
  `02-search.png` is the only shot with an equivalents grid in it.

## Assumptions made

- **Two roomy columns beat three cramped ones.** The floor is what enforces
  "badge always on the swatch's row", which is the rule that was asked for. If
  density on large phones turns out to matter more, the knob is one number in
  `.equivGrid` — and `check:layout` will say exactly what it costs.
- **CI has Chrome at `/usr/bin/google-chrome`.** The ubuntu runner image ships
  it and the candidate list already includes it, but this is the one claim here
  that was not verified locally — the first push proves it.
- **Four surfaces is the whole app.** Lists, search, new-list, about. A fifth
  sheet is one entry in `SURFACES`, not a new set of assertions.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
