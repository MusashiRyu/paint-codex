# 010 — Clicking an equivalent jumps to that paint

## What was done

The equivalents grid in the search sheet was read-only: it told you that
Vallejo's Gory Red is a 3.65 ΔE stand-in for Mephiston Red, but adding it meant
retyping the name into the search box and finding it yourself. Each tile is now
a button that takes you to that paint's own row, where the existing `+` adds it.

The jump does three things:

- **Seeds the query with the target's name and moves the brand filter to the
  target's brand.** Leaving the filter alone would have been worse than doing
  nothing — clicking a Vallejo equivalent while filtered to Citadel would have
  emptied the results.
- **Pins the target if the fuzzy search misses it.** Searching a paint's exact
  name almost always finds it, but Fuse's `minMatchCharLength: 2` means a
  one-character name never matches itself. A jump that lands on an empty list is
  a dead end, so the target is prepended when the search does not return it.
  The pin is dropped as soon as the user edits the query or the brand filter,
  so it cannot follow them into an unrelated search.
- **Highlights and focuses the row it landed on**, so the jump is visible on a
  long result list and the next Tab reaches that row's add button.

An equivalent that names a paint the catalog does not carry renders as a
disabled tile rather than a link to nowhere. In practice the inverted snapshot
promotes every equivalent to a paint of its own, so this is a guard, not a
common case.

Resolving a tile to a paint needed a new lookup: a `Match` carries brand, name,
hex and delta, but no id. `indexPaintsByName` builds that map once per
catalog rather than scanning the catalog per tile — with the full catalog
on screen there are six tiles per result across a thousand results.

## Files changed

**New**

- `documentation/010-retro.md`

**Modified**

- `src/domain/paintQueries.ts` — added `paintNameKey` and `indexPaintsByName`
- `src/features/search/SearchSheet.tsx` — equivalents are buttons; jump state,
  result pinning, scroll-and-focus, highlighted target row
- `src/features/search/SearchSheet.module.css` — button reset, hover/focus
  state on the equivalent tile, `.resultCardJumped` ring
- `src/test/SearchSheet.test.tsx` — five jump tests on their own fixture
- `documentation/0.1-architecture.md` — search sheet and paint queries rows

Lint clean, typecheck clean, 95 tests pass.

## Assumptions made

- **Moving the brand filter is the right surprise.** The alternative was
  resetting it to All. Moving it to the target's brand keeps the result list
  narrow and the chip row shows what happened.
- **The tile is a button, not a second add control.** Adding the equivalent
  straight from the tile would be one tap fewer, but it hides which paint was
  added and gives no chance to look at the row first. The ask was to get *to*
  the color quickly, not to add it blind.
- **Tile contents became spans.** A `<button>` may only hold phrasing content;
  the swatch, name, brand and pill were `div`s.

## Open items

See [OPEN-ITEMS.md](OPEN-ITEMS.md). Unchanged by this session.
