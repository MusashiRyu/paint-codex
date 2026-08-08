# Retro 016 — The gutter the equivalents grid left behind

One CSS rule, but it was the wrong kind of rule rather than the wrong value.

## What was done

`.equivGrid` was a wrapping flex row of fixed 104px tiles. Flex wrap fills a row
with as many tiles as fit and drops the remainder onto the next line; whatever
width is left over stays left over. The card's own `--pad-card` sits on both
sides, so the left edge of the first tile lined up with the card padding and the
right edge of the last one did not — the leftover accumulated there and read as
lopsided padding rather than as spare space, and it changed with the viewport.

It is now a grid:

```css
grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
```

104px stays as the minimum, so the number of columns is what flex was already
choosing. The difference is that the tracks are `1fr`, so the leftover width is
divided across the columns instead of pooling at the end. `.equivCard` drops its
fixed `width` and takes `min-width: 0`; `Swatch size="block"` and `Badge block`
were already `width: 100%`, so they follow the tile without a change.

### `auto-fill`, not `auto-fit`

`auto-fit` collapses the empty tracks, which means two equivalents on a wide
screen would each take half the card — tiles ballooning to the width of the
paint row above them. `auto-fill` keeps the tracks, so a short row stays
tile-sized and the whitespace is honestly "there are only two of these" rather
than a layout artefact. A partly-filled last row still ends short, which is what
a grid is supposed to look like.

## Files changed

### Modified
- `src/features/search/SearchSheet.module.css` — `.equivGrid`, `.equivCard`
- `documentation/0.1-architecture.md` — search sheet row

### New
- `documentation/016-retro.md`

## Assumptions made

- **Verified by lint, typecheck and the 18 `SearchSheet` tests, not on a
  device.** Nothing here is testable in jsdom — it has no layout — so the visual
  result is reasoned from the grid algorithm rather than observed. Worth a
  glance on a phone and on a wide desktop window the next time the app is run.

## Open items

See [OPEN-ITEMS.md](OPEN-ITEMS.md). Nothing added or closed.
