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

### 2. Shop links cover 186 paints out of 2,279
**Raised:** 014 · **Dormant while the export flag is off**

`shopLinks.snapshot.json` was remapped through the id migration rather than
re-crawled, so it still only covers what the 310-paint catalogue had. Re-running
`npm run scrape:shoplinks` would crawl vliegeruit.com for 2,279 paints with a
per-paint search fallback — a much heavier crawl than the one that produced the
current file, and worth pacing deliberately.

Only `features/export/markdownExport.ts` reads it, and that is behind
`appConfig.featureFlags.markdownExport`, which is `false`.

### 3. The cached catalogue is ~2.2 MB of localStorage
**Raised:** 014 · **Watch, not fix**

The snapshot is 1.14 MB of JSON, which localStorage stores as UTF-16 — about
2.2 MB against a quota that is typically 5 MB. It fits, and a write failure is
already handled (the refresh applies for the session and simply does not
persist). Worth remembering before anything else large is persisted, and before
the catalogue grows by another brand.

### 4. iOS signing and archive are Mac-only
**Raised:** 001 · **Environmental**

Nothing left to fix in the repo. Everything an iOS submission needs that can be
prepared on Windows was prepared at 024 — icon, splash, privacy manifest,
`Info.plist`, device family, listing copy, screenshots — and
[`ios-release-checklist.md`](./ios-release-checklist.md) is the whole path from
enrolment onward.

What genuinely requires macOS is signing, archiving and uploading. As of
2026-08-14 that runs on a hosted macOS runner rather than a physical Mac:
[`.github/workflows/ios-release.yml`](../.github/workflows/ios-release.yml)
archives and uploads to App Store Connect, signing with an App Store Connect
API key and `-allowProvisioningUpdates` so no certificate is exported from
anywhere. Setup is four repository secrets and no Mac at any point. **Untested
end to end** — the workflow has not yet completed a real run.

**Nothing here compiles Swift**, so the iOS target's correctness is asserted by
string checks in `src/test/iosProject.test.ts` rather than by a build. A broken
`AppDelegate` would still reach the Mac undetected.

### 5. The shop links earn nothing, and could
**Raised:** 015 · **Blocked on a commercial decision, not on code**

Item 2 is about the *coverage* of `shopLinks.snapshot.json`. This is about the
fact that even at full coverage it pays nothing: the URLs are plain product
links to vliegeruit.com with no referral parameter, so every purchase the app
sends over earns the app zero.

That matters because this is the route with actual revenue
potential. The app already knows exactly which paint someone wants, so a buy
link genuinely helps them rather than taxing their attention — the opposite
trade to an ad.

Four things gate it, in order:

1. **A retailer with an affiliate programme.** vliegeruit.com has no known one,
   so the current snapshot points somewhere that pays nothing no matter how
   complete it gets. Element Games, Wayland Games and Amazon all run programmes.
   Choosing one is the decision everything else waits on — and it interacts with
   item 2, since switching retailer means re-crawling anyway.
2. **Retargeting the snapshot and the scraper** at that retailer's URL scheme,
   including the referral parameter.
3. **A per-paint buy affordance.** A real design decision inside `SearchSheet`
   and `ListsPanel`, not a link drop. The app has no commercial surface anywhere
   today; adding one changes what it feels like to use.
4. **Disclosure.** Affiliate links need saying so in `store/listing.md` and
   `store/privacy-policy.md` — and they would give the
   destination a reason to know the visit came from Paco, which the privacy
   policy currently promises does not happen. That paragraph would have to
   change. The cost here is not only compliance; it is tone.

Not started. Decision as of 2026-08-09: revisit after launch when
there are install numbers to reason about.

### 8. Production access needs twelve testers for fourteen continuous days
**Raised:** 025 · **Waiting, not work**

1.0.0 went to internal and closed testing on 2026-08-10. Production access
cannot even be *applied* for until a closed test has held **at least twelve
testers opted in for fourteen continuous days**. The clock does not start until
the twelfth opts in, and it resets if the count drops below twelve — so this is
recruitment and retention, not a wait that passes on its own.

This is the longest pole to a public release and nothing in the repo shortens
it. One smaller thing trails it:

- The package name registration is still in **Draft** pending the app signing
  key's SHA-256 from **Release → Setup → App signing**. Minutes of work, but the
  registration is not complete without it.

The hardware smoke test is done — all five checks in release-checklist step 5
passed on the 1.0.0 release APK on 2026-08-10, including the About sheet's
outbound links, which had never been proven on a device before.

### 6. `npm audit` reports three moderate advisories, all dev-only
**Raised:** 017 · **Watch, not fix**

`npm audit` says three moderate. `npm audit --omit=dev` says zero: the chain is
`@capacitor/cli` → `xcode` → `uuid`, and the advisory is a missing buffer bounds
check in `uuid` v3/v5/v6 when a caller supplies its own `buf`. None of that code
is in the app — `@capacitor/cli` is the tool that runs `cap sync`, and nothing
it depends on is bundled.

Written down because the fix is a trap: `npm audit fix --force` downgrades
`@capacitor/cli` to 8.4.2, a breaking change to the toolchain that builds the
release, in exchange for nothing that reaches a user. Wait for Capacitor to
bump its own dependency. Re-check with `npm audit --omit=dev` before each
release — that is the number that matters.

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
| About sheet's outbound links unproven on hardware — the WebView `target="_blank"` handoff | 015 | 025 — confirmed on the 1.0.0 release APK, 2026-08-10 |
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
| Store screenshots stale after the catalogue change | 014 | 018 — regenerated; the browser was never the problem |
| A build still fell over on `JAVA_HOME` — set persistently in 007, absent from any shell older than that change | 004, 022 | 022 — `tools/android/gradle.mjs` resolves the JDK per build, so no shell has to be right |
| iOS app icon and splash were Capacitor's placeholder | 001 | 024 — `npm run icons` writes both from the same source mark |
| `CapApp-SPM/Package.swift` was committed with Windows path separators, which are invalid Swift escape sequences | 024 | 024 — `tools/ios/fix-spm-paths.mjs` runs after every `cap:sync`, asserted by `iosProject.test.ts` |

Two items from 003 — "unselect list" and a dark-mode toggle — were deliberate
removals in the redesign rather than pending work, and are not tracked.
