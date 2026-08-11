# Retro 028 — The catalogue in colour order, and only nine cards of it

Retro 026 gave a list row a one-tap route to its equivalents: it opened the
search sheet *focused* on that paint — name in the box, brand chip selected, one
result card. Testing it found the flaw. The question a painter actually asks is
"what can I use instead of this?", and when the catalogue holds no close
equivalent, a one-result search is the one view that cannot answer it.

So the row now opens the **whole catalogue**, ordered so that neighbours are
neighbouring colours, parked at the paint you tapped. Scroll up or down and you
are walking through the colours nearest to it.

That makes 2,279 cards the default view. Rendered whole that is ~84,000 DOM
elements and 8,722 focusable buttons — which the focus trap re-queries on every
Tab. So the list had to stop rendering what nobody is looking at.

## What was done

### The order is measured, not asserted

"Sorted by hex" was the ask. Raw hex sorts by red channel first, so `#FF0000`
and `#FF00FF` land adjacent while two near-identical greys separate. What the
feature needs is that the card below the one you are reading is a colour you
could actually substitute — so the ordering was chosen by measuring exactly
that, as the median CIE76 gap between neighbouring entries over the shipped
snapshot:

| ordering | median ΔE | p90 | adjacent pairs under ΔE 7 |
| --- | --- | --- | --- |
| catalogue order (brand blocks) | 36.95 | 79.38 | 121 |
| raw hex string | 23.02 | 67.30 | 411 |
| hue band → lightness | 9.25 | 33.98 | 866 |
| **hue band → lightness band → chroma** | **5.91** | **15.58** | **1,370** |

The median neighbour sits *inside* the app's own `CLOSE_DELTA_MAX` of 7. A
5-wide lightness band scores better at the median (5.66) and distinctly worse at
the p90 (19.23), so 10 it is.

Two details carry the result:

- **The banding is what makes the later keys fire.** No two of 2,279 hue angles
  are ever equal, so an unbanded "hue, then lightness" sort never reaches its
  second key and orders the catalogue by a float nobody can see. That ordering
  scores 9.25 — better than hex, and nowhere near what banding gets.
- **The near-neutrals lead, as one black-to-white ramp.** Below chroma 10 a hue
  angle is arithmetic rather than colour: Adeptus Battlegrey (`#4A4C58`)
  computes a hue of 285° and would file under purple. It is a grey. 541 of the
  2,279 paints are in that band.

The sort cost — the question that was asked — is a non-issue in the direction
nobody expects: **raw hex 6.92 ms, perceptual 2.29 ms** including all 2,279 Lab
conversions, because numeric comparison beats `localeCompare`. It is memoised
against the catalogue array, on the same contract as the id index.

`hexToLab` was already in `paintCatalogSource.ts` and is now exported rather
than moved: that module is loaded by the scraper through type stripping and must
stay free of value imports from `src/`. Exporting it also means the browse order
and the stored ΔE deltas are computed in the same Lab by construction, rather
than by two copies staying in step.

### The list renders nine cards

`useWindowedList` mounts the cards in view plus three either side, and gives
everything else to two spacer divs whose heights come from a prefix scan over
measured-or-estimated heights.

Hand-rolled, ~230 lines. Both store listings answer their privacy forms with
"four runtime dependencies: React, Zustand, Fuse.js and Capacitor", so a fifth
is a form to re-answer rather than a line in `package.json`.

What made it tractable: **card height is variable but not unpredictable.** What
dominates it is the number of equivalent tiles, and that is countable from the
data with no layout at all. A tile-count-aware estimate is out by about a
wrapped line; a flat constant would be out by 380px. So the estimates are close
enough that replacing them with measurements barely moves anything — and this
app draws no scrollbar, so the residual error is not even a rendered pixel.

Below 24 results the window turns itself off and renders everything. That is
what kept the whole existing test suite passing on its 6- and 3-paint fixtures,
including the focus-trap tests that enumerate the first and last focusable
element in the dialog.

### Two things the window broke, fixed in the same change

- **Tab stopped at the edge of the window.** `useFocusTrap` wraps at the last
  focusable element in the dialog, which under a window is the last one
  *mounted* — so tabbing off the edge jumped back to the search box instead of
  walking into the next card. A `keydown` handler on the scroller widens the
  window first; the default action runs in the same task, so a scroll-driven
  grow would land too late.
- **Screen readers would have seen nine paints.** `role="list"` on the window,
  `role="listitem"` with `aria-posinset`/`aria-setsize` on each card.

### The layout check caught the bug on its first run

The new `browse` surface carries three rules that no unit test can express,
because jsdom measures everything as zero: `window-not-mounted`, `extent-short`
and `anchor-drifted`.

`anchor-drifted` failed at all seven widths immediately, and it was right. The
first layout pass discovers the scroller's width — and the width decides the
column count, which decides every card's estimated height. Anchoring before that
pass put the card **92,000px above the viewport**: the scroll had been set from
estimates computed at the fallback width of 800px, five columns instead of two.
The fix is that the anchor waits for a pass that measures nothing new, which is
at most two frames later and before either has painted.

Worth stating plainly: this is a bug that only exists in a real engine, that
looks like nothing in the DOM (the card is mounted, ringed and correct — just
not where the scroll is), and that no test written against jsdom could ever have
caught. The rule that caught it was written the same hour, from the plan's list
of "things jsdom cannot see".

## Files changed

**New**
- `src/features/search/ResultCard.tsx` / `ResultCard.module.css`
- `src/features/search/cardMetrics.ts`
- `src/features/search/useWindowedList.ts`
- `src/test/paintColorOrder.test.ts`, `src/test/SearchSheetWindow.test.tsx`
- `documentation/028-retro.md`

**Modified**
- `src/domain/paintCatalogSource.ts` — `hexToLab` exported
- `src/domain/paintQueries.ts` — `sortPaintsPerceptually`
- `src/domain/paintRepository.ts` — `getBrowseOrder`, `getBrowsePosition`
- `src/features/search/SearchSheet.tsx` / `SearchSheet.module.css`
- `src/test/SearchSheet.test.tsx`, `src/test/App.test.tsx`
- `tools/layout/check-layout.mjs` — the `browse` surface and its three rules
- `documentation/0.1-architecture.md` — four rows rewritten, three added

## Measured, and found not to be a problem

- **`getTopMatches` per rendered card.** It was never the cost: six map lookups
  and a six-element sort. At nine mounted cards it is tens of microseconds. The
  84,000 DOM elements were the cost.
- **The sort on every open.** Memoised against the catalogue array, so it runs
  once per catalogue and not once per sheet.
- **The bundle.** No new dependency; ~4 kB of code against 160 kB of headroom
  under the warning limit. Both store listings' "four runtime dependencies"
  sentence stands, and neither privacy form is re-answered.

## Assumptions made

- **Search results are not re-ordered.** Typing still gives Fuse's relevance
  ranking; the colour order survives only as the tiebreak between equal scores,
  which is an improvement on brand order and invisible otherwise.
- **A tile tap leaves search mode.** It clears the query and any brand filter,
  because those are the two things that can hide what sits next to the paint it
  names. That makes a tile tap and a row tap land in the same place, which is
  the point.
- **Clearing a search returns you to the top, not to where you were.** Keeping a
  last-anchor would be easy and was not asked for; the scroll position of a
  discarded search is not obviously worth restoring.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
