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

### 1. The privacy policy has no public URL
**Raised:** 008 · **Blocks shipping**

Play requires a policy URL for every app, including one that collects nothing.
The text is written and accurate — [`store/privacy-policy.md`](../store/privacy-policy.md)
— but it needs hosting. GitHub Pages on this repo is the least effort.

### 2. Markdown export cannot work in the Android WebView
**Raised:** 005 · **Dormant while the flag is off**

Capacitor registers no `DownloadListener`, so the anchor-click blob download in
`App.handleExport` silently does nothing on a device. Harmless today because
`appConfig.featureFlags.markdownExport` is `false` and the UI entry point is
hidden.

Before that flag goes back on, mobile export needs `@capacitor/filesystem` to
write the file and `@capacitor/share` to hand it off. Decision taken
2026-08-08: leave as is for now.

### 3. iOS signing and archive are Mac-only
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
| App icon and splash were Capacitor's placeholder | 008 | 011 — real mark supplied, all 29 assets generated |
| Sheet chrome duplicated across the two overlays | 009 | 009 — extracted into `shared/ui/` primitives |

Two items from 003 — "unselect list" and a dark-mode toggle — were deliberate
removals in the redesign rather than pending work, and are not tracked.
