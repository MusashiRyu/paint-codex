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

### 1. Markdown export cannot work in the Android WebView
**Raised:** 005 · **Dormant while the flag is off**

Capacitor registers no `DownloadListener`, so the anchor-click blob download in
`App.handleExport` silently does nothing on a device. Harmless today because
`appConfig.featureFlags.markdownExport` is `false` and the UI entry point is
hidden.

Before that flag goes back on, mobile export needs `@capacitor/filesystem` to
write the file and `@capacitor/share` to hand it off. Decision taken
2026-08-08: leave as is for now.

### 2. Store screenshots are stale after the catalogue change
**Raised:** 014 · **Blocked on this machine**

The catalogue went from 310 paints to 2,422 and the equivalent tiles now name a
range as well as a brand, so every captured screen has moved. `npm run
screenshots` cannot run here: puppeteer-core fails to launch Edge (`Failed to
launch the browser process: Code: 0`) and no Chrome is installed. Unrelated to
the data change — the seed data in `tools/store/screenshots.mjs` was already
updated to the new ids and persist version 3.

Install Chrome or set `CHROME_PATH`, then `npm run build && npm run
screenshots`. Must happen before the next Play submission.

### 3. Shop links cover 186 paints out of 2,422
**Raised:** 014 · **Dormant while the export flag is off**

`shopLinks.snapshot.json` was remapped through the id migration rather than
re-crawled, so it still only covers what the 310-paint catalogue had. Re-running
`npm run scrape:shoplinks` would crawl vliegeruit.com for 2,422 paints with a
per-paint search fallback — a much heavier crawl than the one that produced the
current file, and worth pacing deliberately.

Only `features/export/markdownExport.ts` reads it, and that is behind
`appConfig.featureFlags.markdownExport`, which is `false`.

### 4. The cached catalogue is ~2.3 MB of localStorage
**Raised:** 014 · **Watch, not fix**

The snapshot is 1.20 MB of JSON, which localStorage stores as UTF-16 — about
2.3 MB against a quota that is typically 5 MB. It fits, and a write failure is
already handled (the refresh applies for the session and simply does not
persist). Worth remembering before anything else large is persisted, and before
the catalogue grows by another brand.

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
| App icon and splash were Capacitor's placeholder | 008 | 011 — real mark supplied, all 29 assets generated |
| Privacy policy had no public URL | 008 | 013 — published to GitHub Pages |
| Repo had no remote, so CI and the upstream alarm had never run | 012 | 013 — pushed to github.com/MusashiRyu/paint-codex |
| Sheet chrome duplicated across the two overlays | 009 | 009 — extracted into `shared/ui/` primitives |

Two items from 003 — "unselect list" and a dark-mode toggle — were deliberate
removals in the redesign rather than pending work, and are not tracked.
