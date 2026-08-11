# Retro 026 — A paint you own is one tap from its equivalents

Paco is kept as a personal inventory. The question a painter actually asks of it
is "what else is close to this colour I already have?" — and until now the app
answered that only from the other end: tap the FAB, open the search sheet, type
the name of a paint that was already on screen, find its card, read the grid.

Five steps to reach data the app was holding about a row the user was looking
at.

## What was done

A paint's row in the list is now a button. It opens the search sheet **already
in the state an equivalent tile's jump produces**: that paint's card, pinned,
ringed in gold, scrolled to and focused, with its equivalents underneath.

No new sheet, no new component, no new grid. The shortest honest fix for "the
thing I want is five taps away" turned out to be a route to a screen that
already existed.

### The seed is a jump

`jumpToMatch` (SearchSheet, lines 91–95) writes three pieces of state: the
query, the brand filter, and the pinned id. `focusPaintId` seeds exactly those
three at mount, so a focused open **is** a jump — one behaviour to maintain,
not two, and everything downstream came free: the `results` memo already pins a
target the fuzzy search misses, and the effect that scrolls and focuses the
pinned card already keys off the pin.

**`useState` initialisers, not an effect.** An effect would need `paintCatalog`
in its deps, and that array changes identity every time the background refresh
lands — so a refresh mid-session would wipe a half-typed query and re-pin the
paint the user had deliberately searched away from. There is a test for this
exact case (`does not re-seed when the background refresh swaps the catalogue`),
because it is the kind of bug that only shows up on someone else's phone.

`autoFocus` on the search input is suppressed for a focused open. Left on, the
soft keyboard rises over the card the user came to read, and the focus effect
then moves focus to that card — leaving a keyboard up over nothing.

### The row is the button; remove is its sibling

Not a second icon button beside the `×`. `--control-sm` is 22px, and putting the
most-used action on this screen one edge away from an immediate, undoable delete
is a design that will eventually delete someone's paint. The row button wraps
the swatch, name and hex; the `×` stays its sibling inside `.item`, because a
button may not nest a button.

`.item` keeps its border and padding, so the row renders identically — the store
screenshots needed no re-render.

Two traps, both found by reading rather than by failing:

- **The label must not begin with "Go to".** `check-layout.mjs` selects
  equivalent tiles with `button[aria-label^="Go to"]`, and its `no-badges` rule
  fires when tiles exist but none carry a badge. A row matching that selector
  would have failed the `lists` surface at all seven widths — or worse, quietly
  changed what the rule was measuring. The label is `Show equivalents for
  <name> by <brand>`.
- **`openSearch(paintId)` takes a required argument.** `onOpenSearch` and the
  FAB's `onClick` are wired straight onto DOM handlers, so React calls them
  *with the SyntheticEvent*. A defaulted `(paintId = null)` would type-check and
  then take an event object as a paint id — breaking precisely the flow this
  change was not allowed to break. Required forces `() => openSearch(null)` at
  both sites, and `App.test.tsx` asserts the FAB still opens blank.

### Tested where the seam actually is

`App.test.tsx` is new. `focusPaintId` lives in App, so "the FAB is still blank
after a row was used" is unreachable from either component's tests — the state
that would be stale belongs to neither. It renders the real `App` against the
real store, the way `paintCatalogLive.test.tsx` already does.

147 tests pass, `check:layout` is clean at all 28 surface/width combinations
including 320px, where the row is tightest.

## Files changed

**New**
- `src/test/App.test.tsx`
- `documentation/026-retro.md`

**Modified**
- `src/features/lists/PaintItem.tsx` / `PaintItem.module.css` — the row button
- `src/features/lists/ListsPanel.tsx` — `onShowEquivalents(paintId)`
- `src/app/App.tsx` — `focusPaintId`, `openSearch`/`closeSearch`, the sheet key
- `src/features/search/SearchSheet.tsx` — `focusPaintId` and its three seeds
- `src/test/ListsPanel.test.tsx`, `src/test/SearchSheet.test.tsx`
- `.design-sync/previews/PaintItem.tsx`
- `documentation/0.1-architecture.md` — four rows

## Measured, and found not to be a problem

- **The store screenshots.** The row's markup changed and its rendering did not;
  `01-list.png` is unchanged, so nothing was re-rendered.
- **The layout check's fourth rule now inspects the row button.** `text-clipped`
  applies to every `button`, and the row is one now. It passes at all seven
  widths: the ellipsis happens inside `.name`, which clips, and the button's own
  scroll width never exceeds its box.

## Assumptions made

- **The row, not a new icon.** Discoverability is the trade: nothing on the row
  advertises that it is tappable. Against that, the row is the obvious thing to
  tap for "tell me about this paint", the sheet opening is its own feedback, and
  the alternative was a second 22px target beside a delete. Revisit only if the
  action goes unused.
- **`focusPaintId` is optional on `SearchSheet`, required on the row handler.**
  `SearchSheet` is published through `src/index.ts`, so an optional prop keeps
  that surface source-compatible; `PaintItem`'s handler is required because a
  row without it is a row with a dead button.
- **The seeded brand filter persists.** Arriving on a paint leaves its brand
  chip selected, so the user's *next* typed query is scoped to that brand until
  they tap "All". That is pre-existing jump behaviour, now reachable from the
  list — one tap to clear, and it also clears the pin.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
