# Retro 018 — Four unused SVGs the sweep walked past

A one-item follow-up to [017](017-retro.md). The unused images were deleted
from `dist/imagery/`, which is a build directory: `npm run build` copies
`public/` over it and every deleted file came straight back. The deletion had
to happen at the source to mean anything.

## What was done

`public/imagery/` held six files. Two are load-bearing — `bg-page.png` and
`bg-card.png`, referenced from `App.module.css` as `/imagery/*.png`. The other
four — `aquila-inspired.svg`, `heraldic-mark.svg`, `inquisition-inspired-i.svg`
and `iron-texture.svg` — were referenced from nowhere at all. A search across
the whole tree including gitignored and hidden directories returned only
Gradle's generated asset-merge manifest, which lists them because they were in
the folder, not because anything asks for them.

They are early design-exploration marks from before the app settled on the
`icons.svg` sprite and the two background textures. About 3 KB combined, so
this is tidiness rather than a size win — the point is that a `public/`
directory is a promise that everything in it is served, and four files in it
were not.

Deleted at the source, rebuilt, and `npx cap sync` re-copied `dist/` into both
native projects, which drops them from the Android and iOS asset bundles too.

## Why 017 missed them

017's dead-code pass removed `src/assets/` after checking that nothing in
`src/`, `public/`, `index.html` or `tools/` referenced those three files. It
checked what `public/` *refers to*; it never asked what `public/` *contains*.
An unused asset in a static-serve directory has no importer to be missing, so
nothing about it looks wrong until someone lists the folder. Worth adding to
the next sweep: enumerate `public/` and grep each entry, rather than only
following references out of the source tree.

## Verified

- `npm run build` — clean, no warnings.
- `npm test` — 12 files, 124 tests, all passing.
- `dist/imagery/`, `android/app/src/main/assets/public/imagery/` and
  `ios/App/App/public/imagery/` each hold exactly the two PNGs.

## Files changed

**Deleted**
- `public/imagery/aquila-inspired.svg`
- `public/imagery/heraldic-mark.svg`
- `public/imagery/inquisition-inspired-i.svg`
- `public/imagery/iron-texture.svg`

**Added**
- `documentation/018-retro.md` — this file

No documentation needed correcting: `0.1-architecture.md` and `003-retro.md`
only ever named the two PNGs, and 008's bundle-size note is about those same
two megabytes. The generated native copies under `android/` and `ios/` are
build output and are refreshed by `cap sync`.

## Assumptions made

- The four SVGs are not wanted for future design work. Nothing references them,
  nothing documents them, and git keeps them recoverable if that turns out to
  be wrong.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
