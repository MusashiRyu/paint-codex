# Retro 004 — Delta Badge Alignment, Android Back Gesture, List Rename

## What was done

Three fixes on top of the 003 redesign, plus the Android build-toolchain
corrections needed to produce a working test APK.

### 1. Delta (ΔE) badges bottom-anchored

The Δ pills sat directly after the paint name, so a tile whose name wrapped to
two lines pushed its badge lower than its neighbours' — badges did not line up
across a row. They are now pinned to the bottom of each tile.

- `src/features/browse/PaintCard.module.css` — `.matchItem` gets `height: 100%`
  so each tile fills its grid row, `.matchInfo` gets `flex: 1` to absorb the
  slack, `.deltaBadge` gets `margin-top: auto`.
- `src/features/search/SearchSheet.module.css` — `.equivCard` becomes a column
  flex container, `.equivSwatch` gets `flex-shrink: 0` so it cannot compress in
  a tall card, `.equivPill` gets `margin-top: auto`. The pill's former
  `margin-top: 7px` moved to `.equivBrand`'s `margin-bottom` so the gap
  survives the auto margin.

### 2. Android back gesture closed the app instead of the open sheet

Root cause: **Capacitor 8 core registers no back handling at all.** Grepping
`BridgeActivity`/`Bridge` for `onBackPressed`, `OnBackInvoked`, and `goBack`
returns nothing, so the gesture hit Android's default and finished the
activity. No web-layer state could observe it, and the History API alone could
not have fixed it — the WebView never saw the event.

- Added the `@capacitor/app@8.1.1` dependency (matches core 8.5.0), which
  surfaces a `backButton` event.
- New `src/shared/hooks/useBackDismiss.ts` — a module-level LIFO stack of
  dismiss callbacks. Layers register while open; back dismisses the topmost and
  only calls `exitApp()` once the stack is empty, matching what Android would
  have done from the root screen. The listener attaches lazily and fails soft on
  platforms without a native back button.
- `src/app/App.tsx` registers the search sheet and the new-list sheet.
- `src/features/lists/ListsPanel.tsx` registers the rename editor, so back
  cancels a rename rather than leaving it open.

### 3. Pencil icon renames the list instead of toggling paint edit mode

The pencil beside the list name toggled an `editMode` that only added a second
remove button to the left of each paint row. It now edits the list name.

- `src/features/lists/ListsPanel.tsx` — the header name swaps for an input with
  its text preselected. Enter or blur commits, Escape discards, switching tabs
  cancels. A `skipCommitRef` guard stops a trailing blur from committing after
  an Escape. The pencil button uses `onMouseDown` + `preventDefault` so clicking
  it to confirm does not blur-commit and then immediately reopen a fresh rename.
- `src/app/App.tsx` — passes `onRenameList` through to the store's existing
  `renameList`, which was already implemented but unused.
- `src/features/lists/PaintItem.tsx` / `.module.css` — the `editMode` prop and
  `.removeLeft` button were removed rather than relocated. The "×" on the right
  is always visible, so no capability was lost.

This closes the "Rename list functionality" item deferred in retro 003.

### 4. Android build toolchain

- **JDK.** `JAVA_HOME` was unset on the dev machine. The first APK build used
  Android Studio's bundled JBR (Java 25) and appeared to succeed, but only
  because Gradle was reusing cached compiled build scripts. Adding a dependency
  invalidated that cache and the next build failed with
  `Unsupported class file major version 69` — Gradle 8.14.3 does not support
  Java 25. Builds must use JDK 21.
- **npm script.** `android:build:debug` / `android:build:release` invoked
  `gradlew.bat` by bare name. Environments with
  `NoDefaultCurrentDirectoryInExePath=1` (set by Git for Windows, and inherited
  by PowerShell) stop `cmd.exe` resolving executables from the working
  directory, so both scripts failed with
  `'gradlew.bat' is not recognized`. Changed to `.\gradlew.bat`.

## Files changed

### New files
- `src/shared/hooks/useBackDismiss.ts`
- `src/test/ListsPanel.test.tsx` — 6 cases covering the rename commit/cancel paths

### Modified
- `src/app/App.tsx`
- `src/features/lists/ListsPanel.tsx` / `ListsPanel.module.css`
- `src/features/lists/PaintItem.tsx` / `PaintItem.module.css`
- `src/features/browse/PaintCard.module.css`
- `src/features/search/SearchSheet.module.css`
- `package.json` — added `@capacitor/app`, fixed gradle script paths
- `README.md`, `documentation/0.1-architecture.md`

## Assumptions made

- Removing `editMode` entirely was preferred over relocating it to another
  control, since the always-visible "×" already covers paint removal.
- Back exiting the app when no overlay is open is correct — it matches Android's
  default behaviour from a root activity.
- An empty or whitespace-only rename is a no-op that keeps the previous name;
  this falls out of the existing `renameList` store guard.

## Deferred items

- **An empty list cannot be renamed.** The list header (export / rename / delete)
  only renders when the list has paints, so a newly created empty list has no
  rename affordance. Pre-existing behaviour, not introduced here.
- The back-gesture fix is verified by construction and by the plugin registering
  natively (`capacitor.plugins.json`), but has not been confirmed on a physical
  device.
- `JAVA_HOME` is still unset on the dev machine; each build needs it exported to
  JDK 21 manually. Pinning it in the npm script or a `gradle.properties`
  `org.gradle.java.home` was not done, as it would hard-code a machine-specific
  path.
- The old browse grid (BrandFilter / ResultsGrid / PaintCard / SearchBar /
  ExportPanel) remains unused dead code, as noted in retro 003. `PaintCard`'s
  CSS was touched here only because it still carries the Δ badge styling.
