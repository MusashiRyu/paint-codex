# Retro 021 — The equivalent tile learns it is already owned

A result row has always said IN LIST when the paint it names is in the active
list. The equivalent tiles under it — which stand for paints too, and which are
one tap from adding one — said nothing. The same paint could appear twice on
one screen, badged in the row and unbadged in a tile, and the tile is the one
the user is deciding from.

## What was done

### The badge, on the paint the tile stands for

`SearchSheet` already had the fact: `activeIds`, the set behind the row badge.
Each tile now reads it for its own paint and renders the same
`<Badge tone="success">IN LIST</Badge>` the row uses — one badge, one meaning,
two places.

The tile stays a jump button. Membership does not disable it: unlike the row,
where the badge *replaces* the add button because there is nothing left to do,
a tile's job is to go to the paint, which is still worth doing when the paint is
already listed.

### Where the badge goes: the swatch is square again

There was no room for it. The tile's swatch was `size="block"` — a 34px bar
across the full column — so the tile's first row was entirely colour.

The swatch is now `size="tile"`: a `--control-lg` square, same 34px height, so
the tile's height is unchanged and only the colour gives ground. The badge sits
in what it gave up. The tile keeps its width — the grid is still
`minmax(104px, 1fr)`, unchanged from 019 — because the point was never a
narrower tile, it was a first row with two things in it.

`.equivHead` is a flex row with `flex-wrap`. A `Badge` is `flex-shrink: 0`, so
on a card too narrow to seat 34px + gap + badge the badge wraps under the
swatch and the tile grows a line, rather than the badge being clipped to
"IN LI". Verified in Chromium at 360px (side by side, as designed) and at 320px
(wrapped, legible).

### The label swallows what it names

The badge is inside the button, and a button with `aria-label` exposes that
label *instead of* its content — so adding the badge told a screen reader
nothing. The label now carries it: `Go to Gory Red by Vallejo, already in list`.

That is a behaviour change to an accessible name the tests match on exactly,
which is the reason it is spelled out here: a future assertion on
`Go to X by Y` will miss a listed paint, and should.

## Files changed

**Modified**
- `src/shared/ui/Swatch.tsx` / `Swatch.module.css` — `block` → `tile`, square
- `src/features/search/SearchSheet.tsx` — per-tile membership, badge, label
- `src/features/search/SearchSheet.module.css` — `.equivHead`
- `src/test/SearchSheet.test.tsx` — a listed and an unlisted tile in one card
- `.design-sync/previews/Swatch.tsx` — `BlockInATile` → `TileHead`
- `documentation/0.1-architecture.md` — Badge, Swatch and Search sheet rows

## Assumptions made

- **`block` had one caller, so it was renamed rather than kept.** A square
  named `block` would be a lie in the one place it is used, and the bundle is
  generated from this source — nothing outside the repo pins the old name.
- **The wrap at 320px is better than a second, smaller badge.** A compact
  variant would fit that width, at the cost of two IN LIST badges in the design
  system that mean the same thing and differ only in padding. The screen it
  affects is a 320px phone, and what it does there is add one line to a tile.
- **A listed equivalent still jumps.** The alternative — disabling the tile, as
  `.equivCard:disabled` anticipates — would remove the only route to a paint's
  own row and its equivalents, which is a reason to visit it whether or not it
  is already in a list.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
