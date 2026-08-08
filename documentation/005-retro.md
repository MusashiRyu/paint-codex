# Retro 005 — Codebase Audit: Architecture, Security, Best Practices

A full read of the codebase looking for architectural, security, and
clean-code problems, followed by the fixes that did not need a product
decision. Findings left open are listed at the end.

## What was done

### 1. Removed the browse UI superseded by the 003 redesign

Retro 003 noted these were dead and could go once their tests were handled.
An import-graph walk from `main.tsx` confirmed nothing outside their own
tests reached `BrandFilter`, `PaintCard`, `ResultsGrid`, `SearchBar`,
`ExportPanel` or `useDarkMode`. Deleted, with their CSS modules and the 25
component tests that only kept them compiling.

Their pure helpers were worth keeping and moved to a new
`src/domain/paintQueries.ts` (`getUniqueBrands`, `getTopMatches`,
`filterPaintsByColor`), so a view can use them without importing across
feature folders.

### 2. One delta scale instead of two

`SearchSheet` classified match quality with a local scale (green ≤ 2,
yellow ≤ 4) while `shared/lib/color.ts` used 3 and 7. The same ΔE could
therefore render green in the search sheet and yellow elsewhere, and the
sheet is the only view a user actually sees.

`color.ts` is now the single source of truth: it owns the thresholds and
exposes `getDeltaQuality` and `getDeltaStyle`, which maps a quality onto
its CSS token group. `SearchSheet` consumes those.

### 3. Equivalents were rendered in arbitrary order

`SearchSheet` mapped `paint.matches` straight to the DOM, but the snapshot
stores matches unordered. Measured against the bundled data:

- **219 of 310 paints** listed something other than their closest match first.
- **206 paints** included at least one match at or beyond the app's own
  "distant" threshold, up to 10 equivalents on a single paint.

The sorting and capping logic already existed in `getTopMatches` — it was
only ever wired to the deleted `PaintCard`. `SearchSheet` now goes through
it, sorted closest-first and capped at `CLOSE_DELTA_MAX`.

### 4. Brand filter chips were hardcoded

The chips were a literal `['All', 'Citadel', 'Vallejo', 'Army Painter']`
union type. A fourth brand in the snapshot would have been silently
unfilterable. They now derive from the catalogue via `getUniqueBrands`.

### 5. TypeScript strict mode, and typechecking the tests

`tsconfig.tools.json` set `strict: true`, but `tsconfig.app.json` — the
application itself — did not. Enabling it produced **zero** errors, so it
cost nothing.

Worse, `tsconfig.app.json` excluded `src/test` and `**/*.test.*` and no
other project included them, so test files were never typechecked at all.
A new `tsconfig.test.json` covers them and immediately caught a
`PaintList` fixture in `markdownExport.test.ts` still missing the `icon`
and `color` fields added by the 003 migration.

### 6. Accessibility and desktop dismissal

Both sheets were plain `div`s with unlabelled `×` buttons, and Escape did
nothing — the Android back gesture was the only way out. Added
`useDismissOnEscape` as the desktop counterpart to `useBackDismiss`, plus
`role="dialog"`, `aria-modal="true"` and labelled close buttons.

### 7. Export download revoke race

`handleExport` called `URL.revokeObjectURL` in the same tick as
`a.click()`, which can cancel the download before the browser starts it.
Deferred to a macrotask.

## Files changed

### New
- `src/domain/paintQueries.ts`
- `src/shared/hooks/useDismissOnEscape.ts`
- `src/test/SearchSheet.test.tsx` — 8 cases covering ordering, threshold, brand derivation, dismissal
- `tsconfig.test.json`

### Deleted
- `src/features/browse/` in full (BrandFilter, PaintCard, ResultsGrid, browse.ts + CSS)
- `src/features/search/SearchBar.tsx` / `.module.css`
- `src/features/export/ExportPanel.tsx` / `.module.css`
- `src/shared/hooks/useDarkMode.ts`
- `src/test/BrandFilter.test.tsx`, `PaintCard.test.tsx`, `ResultsGrid.test.tsx`

### Modified
- `src/shared/lib/color.ts`, `src/features/search/SearchSheet.tsx`
- `src/features/lists/NewListSheet.tsx`, `src/app/App.tsx`
- `tsconfig.app.json`, `tsconfig.json`
- `src/test/searchUtils.test.ts`, `src/test/markdownExport.test.ts`

Test count moved 75 → 63: 25 dead component tests removed, 13 added for
behaviour that had none.

## Measured, and found not to be a problem

Recorded so they are not re-raised:

- **Fuse.js index rebuilt on every keystroke.** Real, but the index build
  is 0.28 ms against 310 paints — cheaper than the 0.97 ms search it
  enables. Not worth memoising.
- **Denormalised paint copies in localStorage.** A 50-paint list is 16.7 KB
  versus 1.3 KB stored as ids. Irrelevant against the quota; the actual
  concern is staleness, listed below.
- **Injection surface.** No `dangerouslySetInnerHTML`, `innerHTML`, `eval`
  or `new Function` anywhere in `src/` or `tools/`. All 191 bundled shop
  links are `https://` and single-host. No paint name or brand contains
  characters that would break the generated markdown links.

## Deferred items

- **Google Fonts are loaded from a CDN** (`index.html`). In a packaged
  Capacitor app this means the typography silently falls back offline, and
  every launch discloses the device IP to a third party. Fonts should be
  vendored into `public/` and `@font-face`'d locally. Not done here because
  it adds binary assets and has licensing implications worth a decision.
- **Blob downloads do not work in the Android WebView.** Capacitor registers
  no `DownloadListener`, so `a.download` silently no-ops on device. Moot
  while `markdownExport` is flagged off; when it is turned back on, mobile
  export needs `@capacitor/filesystem` + `@capacitor/share` rather than an
  anchor click.
- **Lists store full copies of each paint**, including its `matches` array.
  A catalogue refresh (corrected hex, new equivalents) will not reach paints
  already in a list. Storing ids and resolving against the catalogue at read
  time would fix it, but needs a persist migration.
- **No CI.** `.github/` holds only modernize hooks; nothing runs `lint`,
  `tsc -b` or `vitest` on push.
- **`filterPaintsByColor` is unused.** Kept because it is tested and
  plausibly wanted for a colour-filter feature; delete it if not.
- **`android:allowBackup="true"`** (Capacitor default) lets `adb backup`
  pull app data off a device. Paint lists are not sensitive, so this is
  noted rather than changed.
- An empty list still cannot be renamed — carried over from retro 004.
