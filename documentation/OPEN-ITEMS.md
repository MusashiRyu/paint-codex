# Open Items

The single living list of known-but-unfixed things. Retros record what a
session *did*; this records what is still outstanding. When a retro defers
something, it goes here — not into a "Deferred items" section that six later
files then restate incompletely.

**Working agreement:** add an item when you defer it, delete it when it is
done. Do not keep a resolved item around with a strikethrough — the retro that
closed it is the record.

---

## Open

### 1. The app icon and splash are still Capacitor's placeholder
**Raised:** 008 · **Blocks shipping**

`mipmap-*/ic_launcher.png` is the Capacitor logo and every `drawable-*/splash.png`
is that logo on white. `public/favicon.svg` is still Vite's. Shipping another
project's mark as the app icon is a listing rejection risk, and the white splash
flashes into a near-black app.

Everything downstream is ready: drop the mark at `tools/icons/source/icon.svg`
and `npm run icons` writes all five densities, both legacy shapes, the adaptive
foreground, the splash canvases, the 512px Play icon and the favicon. Waiting
only on artwork. See [`tools/icons/README.md`](../tools/icons/README.md).

### 2. The privacy policy has no public URL
**Raised:** 008 · **Blocks shipping**

Play requires a policy URL for every app, including one that collects nothing.
The text is written and accurate — [`store/privacy-policy.md`](../store/privacy-policy.md)
— but it needs hosting. GitHub Pages on this repo is the least effort.

### 3. Markdown export cannot work in the Android WebView
**Raised:** 005 · **Dormant while the flag is off**

Capacitor registers no `DownloadListener`, so the anchor-click blob download in
`App.handleExport` silently does nothing on a device. Harmless today because
`appConfig.featureFlags.markdownExport` is `false` and the UI entry point is
hidden.

Before that flag goes back on, mobile export needs `@capacitor/filesystem` to
write the file and `@capacitor/share` to hand it off. Decision taken
2026-08-08: leave as is for now.

### 4. Sheet chrome is duplicated across the two overlays
**Raised:** 009 · **Cosmetic, not blocking**

`SearchSheet.module.css` and `NewListSheet.module.css` are byte-identical for
`backdrop`, `sheet`, `sheetHeader`, `sheetTitle` and `closeBtn`. The pill, the
round icon button, the gold gradient button and the rounded input each appear
in two to four places as well.

The token extraction made these duplicates *consistent* — they now resolve to
the same values by construction — but only shared primitives would make them
singular. That is a structural change touching five components, deliberately
left out of the token work so the two could be reviewed apart.

### 5. iOS signing and archive are Mac-only
**Raised:** 001 · **Environmental**

Nothing to fix in the repo. The flow in the README's iOS section requires Xcode
on macOS. Plan as of 2026-08-08: reach a Mac over Parsec and follow those steps
there.

Note that `tools/icons/` writes Android and web assets only, so
`ios/App/App/Assets.xcassets/AppIcon.appiconset` still holds the Capacitor
placeholder. Extending the generator is the easy part of an iOS submission.

---

## Recently closed

Listed only so a reader of the older retros can see where each thread ended.
Prune this section once it stops being useful.

| Item | Raised | Closed by |
| --- | --- | --- |
| Rename a list | 003 | 004 |
| Dead browse UI (BrandFilter / PaintCard / ResultsGrid / SearchBar / ExportPanel) | 003, 004 | 005 |
| Google Fonts loaded from a CDN | 005 | 005 |
| Saved lists went stale against the catalogue | 005 | 005 |
| No CI | 005 | 005 |
| Back gesture unverified on hardware | 004 | Confirmed working on device, 2026-08-08 |
| Empty list could not be renamed | 004 | 007 |
| Dialogs had no focus management | 006 | 007 |
| `filterPaintsByColor` unused | 005 | 007 — removed |
| `JAVA_HOME` unset on the dev machine | 004 | 007 — set to JDK 21 |
| `android:allowBackup="true"` | 005 | Accepted 2026-08-08; paint lists are not sensitive |
| Android release signing not configured | 002 | 008 — upload key generated, `signingConfig` wired, release build fails loudly without it |

Two items from 003 — "unselect list" and a dark-mode toggle — were deliberate
removals in the redesign rather than pending work, and are not tracked.
