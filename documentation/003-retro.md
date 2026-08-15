# Retro 003 — Complete UI Redesign (Grimoire/Dark Fantasy Theme)

## What was done

Abandoned the previous browse-first UI and implemented a full redesign based on a Claude Design HTML mockup — "Paint Codex" / dark fantasy grimoire style.

The design is by [Lukas Stordeur](https://github.com/LukasStordeur). This retro records the implementation; the look it implements is that design's, not this session's.

### New app structure (lists-first flow):
- **Viewport**: Full-screen card with two-layer dark background (grungy texture page bg + swirling abstract art card bg)
- **Header**: "PAINT CODEX" / "Color Manager" with Cinzel font and gold decorative SVG divider
- **Tab bar**: Horizontally scrollable list tabs (icon + name, color-coded border) + dashed "+ New" button
- **Content area**: Active list's paints grouped by category (Base Layer, Edge, Other), with export / edit / delete header actions; empty state with grimoire messaging
- **FAB**: Gold gradient circular + button (bottom-right, absolute) to open search sheet
- **Search sheet**: Bottom-sheet overlay (88% height) with text input, brand filter chips, fuzzy search results, equivalents grid with ΔE color pills, IN LIST badge, and + add button
- **New list sheet**: Bottom-sheet overlay with name input, 8-icon emblem picker, 5-color banner picker, CREATE LIST button

### Background images added:
- `public/imagery/bg-page.png` — dark grungy/aged texture (full page background)
- `public/imagery/bg-card.png` — dark swirling abstract art (card background)

### Fonts changed:
- Replaced Cormorant Garamond + Barlow + JetBrains Mono with **Cinzel** (headers) + **EB Garamond** (body)

## Files changed

### New files:
- `src/shared/ui/ListIconSvg.tsx` — renders one of 8 SVG emblems (skull/star/shield/wing/crown/flame/moon/drop)
- `src/features/lists/PaintItem.tsx` / `.module.css` — single paint row in list view
- `src/features/search/SearchSheet.tsx` / `.module.css` — search bottom sheet
- `src/features/lists/NewListSheet.tsx` / `.module.css` — new list creation bottom sheet
- `src/app/App.module.css` — app-level card + viewport + FAB styles

### Rewritten:
- `src/app/App.tsx` — new layout; removed old browse/export/search bar wiring; renders ListsPanel + SearchSheet + NewListSheet + FAB
- `src/features/lists/ListsPanel.tsx` — replaced with tabs + grouped list content view
- `src/features/lists/ListsPanel.module.css` — complete restyle
- `src/shared/styles/global.css` — complete restyle; stripped old shell classes; new CSS variables
- `index.html` — title updated, Google Fonts link for Cinzel + EB Garamond added

### Modified:
- `src/app/providers/store.ts` — added `ListIcon` type; added `icon` and `color` fields to `PaintList`; updated `createList` signature (optional `icon`/`color` with defaults); added `version: 1` + `migrate` to persist config for backward compat

### Preserved (not changed):
- `src/features/browse/BrandFilter.tsx` / `.module.css` — kept for test compatibility, unused in new UI
- `src/features/browse/PaintCard.tsx` / `.module.css` — same
- `src/features/browse/ResultsGrid.tsx` / `.module.css` — same
- `src/features/export/ExportPanel.tsx` / `.module.css` — same
- `src/features/search/SearchBar.tsx` / `.module.css` — same
- `src/features/export/markdownExport.ts` — export logic still used by App.tsx
- `src/features/search/search.ts` — fuzzy search still used by SearchSheet
- All domain and test files

## Assumptions made

- The 390×844px card is presented centered on desktop; on mobile (Capacitor) it fills the viewport via `width: 100%; height: 100%`
- Paint `category` field maps to the design's "type" groups; most paints have no category and fall into an implicit "Other" group (current data limitation)
- The `paint.matches[]` array maps to the design's "Equivalent Paints" section
- Export triggers a `.md` file download (matching existing `markdownExport.ts` behavior) rather than clipboard copy
- The delete list button is disabled (opacity 0.3, pointer-events none) when only 1 list exists

## Deferred items

Tracked in [OPEN-ITEMS.md](OPEN-ITEMS.md), the single living list. This section
used to restate the open items and drifted out of date as later retros closed
them; git history has what was outstanding on the day.
