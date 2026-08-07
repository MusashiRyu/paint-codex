# 001-retro

## What was done
- Filtered equivalent paint suggestions to close matches only and sorted them by delta.
- Fixed the search autocomplete dropdown stacking so it renders above neighboring panels.
- Allowed spaces while renaming lists and removed paint counts from list tab labels.
- Refreshed key panel, card, and header styling for the current app presentation.

## Files changed
- `src/app/App.tsx`
- `src/features/browse/BrandFilter.module.css`
- `src/features/browse/PaintCard.module.css`
- `src/features/browse/PaintCard.tsx`
- `src/features/browse/browse.ts`
- `src/features/export/ExportPanel.module.css`
- `src/features/lists/ListsPanel.module.css`
- `src/features/lists/ListsPanel.tsx`
- `src/features/search/SearchBar.module.css`
- `src/shared/lib/color.ts`
- `src/shared/styles/global.css`
- `src/test/PaintCard.test.tsx`
- `src/test/markdownExport.test.ts`
- `documentation/0.1-architecture.md`

## Assumptions made
- Close equivalents should use the existing delta threshold of less than 7.
- Markdown exports should continue listing only the user-selected paints, even when match data exists.

## Deferred items
- Native iOS signing and App Store archive steps remain Mac/Xcode-only.
- Android release signing is still separate from the debug/test packaging flow.
