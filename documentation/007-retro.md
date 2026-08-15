# Retro 007 — Clearing the Deferred Backlog

The deferred items had accumulated across six retros, each restating the
previous list and drifting out of date. This session dispositioned all nine,
fixed the four that were worth fixing, and replaced the scattered lists with
one file.

## What was done

### 1. `documentation/OPEN-ITEMS.md` is now the single list

Every retro carried its own "Deferred items" section, and later retros restated
earlier ones incompletely — 006 said "unchanged from 005, plus one" while
silently dropping an item. Answering "what is still open?" meant reading six
files and reconciling them by hand.

Open work now lives in one file. Each retro's deferred section is replaced by a
pointer to it. Retros record what a session *did*; `OPEN-ITEMS.md` records what
is still outstanding, and items are deleted from it when closed rather than
struck through.

### 2. An empty list can now be renamed and deleted

The list header holding rename, export and delete was gated on `hasPaints`, so
a freshly created list had no way to be renamed — the affordance appeared only
after adding a paint. The header is now gated on the list existing.

Delete was also disabled whenever only one list remained (`canDelete =
lists.length > 1`, rendered at 30% opacity with `pointer-events: none`). That
guard is gone: deleting the last list is allowed and drops to the existing "No
lists yet" state, which already offers "CREATE FIRST LIST". The store's
`deleteList` already handled an empty result by clearing `selectedListId`.

### 3. Overlays trap focus and give it back

`role="dialog"` and `aria-modal` describe a layer as modal but do not make it
behave that way: Tab walked straight out of a sheet into the page behind it,
which is still rendered and still focusable.

`useFocusTrap` wraps focus at both ends, pulls it back if it escapes, and
restores it to whatever opened the sheet on close. Both sheets use it.

Two things the tests caught that the implementation got wrong first:

- **Visibility filtering by `offsetParent` is wrong here.** It reports `null`
  for `position: fixed` elements — which a bottom sheet is — and for everything
  under jsdom, which made the trap a silent no-op. Filtering is now
  attribute-based and layout-free.
- **The trigger must be captured during render, not in an effect.** React
  applies `autoFocus` while committing, so by the time an effect runs the focus
  is already on the sheet's input and the real trigger is lost. Captured in a
  `useState` initializer instead.

### 4. Dead color helpers removed

`filterPaintsByColor` was unused and kept only because it was tested. Removing
it left `hexToHSL` with no callers, so that went too.

While there, `getDeltaColorClass` turned out to be dead as well. Retro 005 kept
it "for the CSS-module pill styling" — but that styling lived in
`PaintCard.module.css`, which 005 itself deleted. The class names it returns
(`delta-green`, `delta-yellow`, `delta-red`) match no CSS in the repo. The
justification for keeping it was already false when it was written.

### 5. `JAVA_HOME` set on the dev machine

Persisted to the JDK 21 Temurin install at User scope, so Android builds no
longer need it exported by hand. Verified by building the debug APK with no
manual setup: `BUILD SUCCESSFUL`.

Note that already-open terminals keep the environment block they started with —
the value reaches new shells only.

## Files changed

### New
- `documentation/OPEN-ITEMS.md`
- `src/shared/hooks/useFocusTrap.ts`

### Modified
- `src/features/lists/ListsPanel.tsx` — header gated on the list, delete always enabled
- `src/features/search/SearchSheet.tsx`, `src/features/lists/NewListSheet.tsx` — focus trap
- `src/domain/paintQueries.ts` — `filterPaintsByColor` removed
- `src/shared/lib/color.ts` — `hexToHSL` and `getDeltaColorClass` removed
- `src/test/ListsPanel.test.tsx` (+4), `src/test/SearchSheet.test.tsx` (+4),
  `src/test/searchUtils.test.ts` (−12 for removed functions)
- All six retros — deferred sections replaced with a pointer
- `documentation/0.1-architecture.md`

90 tests pass.

## Decisions taken, not fixed

Recorded here because they were judgment calls rather than oversights:

- **Android release signing** — deferred until we are ready to ship.
- **Markdown export on Android** — left as is; dormant while the feature flag
  is off.
- **`android:allowBackup="true"`** — accepted. Paint lists are not sensitive,
  and turning it off would cost users their lists on device transfer for no
  real gain. Dropped from the open list rather than left as a standing item.
- **iOS signing** — will be handled from a Mac over Parsec, following the
  README's iOS section. Not a repo change.
- **Back gesture on hardware** — confirmed working on a device, closing the
  verification gap 004 left open.

## Open items

See [OPEN-ITEMS.md](OPEN-ITEMS.md).
