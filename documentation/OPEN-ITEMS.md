# Open Items

The single living list of known-but-unfixed things. Retros record what a
session *did*; this records what is still outstanding. When a retro defers
something, it goes here — not into a "Deferred items" section that six later
files then restate incompletely.

**Working agreement:** add an item when you defer it, delete it when it is
done. Do not keep a resolved item around with a strikethrough — the retro that
closed it is the record.

**Two sections, and the difference is whether anyone is expected to act.**
*Open* is work that is waiting to be done or a decision waiting to be taken.
*Raised concerns* is what has been looked at, understood, and deliberately left
alone — recorded so it is not rediscovered as news, and so the reasoning for
leaving it survives. A concern moves up to Open when something changes its
premise, not because it has been sitting there a while.

Retro 037 split them after finding the list had been treating both kinds the
same, which made it read as nine outstanding tasks when most of it was settled
thinking.

**The numbers are labels, not identifiers.** They have been reused: `### 4.` has
meant three different things across this file's history. A number in an older
retro points at whatever occupied that slot when the retro was written, and two
of them — in `release-checklist.md` and `appVersion.test.ts` — pointed at an
item that had been closed for eight retros before 037 caught them. Cite items by
title, not by number.

---

## Open

### 16. The zoom lock is unverified on hardware
**Raised:** 036 · **The only unverified fix left**

Opening the search sheet on iOS left the whole app zoomed in and pannable after
it closed — iOS's focus zoom on a sub-16px input, which never reverses on blur.
`index.html` now pins the scale. The mechanism is not in doubt, but nothing on
this machine can observe it: a desktop Chromium has no soft keyboard, so
`npm run check:layout` sees the same page either way, and the assertion in
`androidShell.test.ts` reads the meta tag rather than a web view honouring it.

The safe-area and anchor-scroll fixes it used to be grouped with were both
confirmed on device on 2026-08-15. This one could not be checked in that pass
because the fix landed after the build under test; it needs the next one.

Check on the iPhone 15 Pro Max:

1. Open search from the FAB, type nothing, close it. The app is at the scale it
   started at and does not drag under a finger.
2. Do the same having typed a query, and again having scrolled the results.
3. Rename a list — the 13px inline field is the other input that trips this, and
   it is the one that could not be fixed by raising a font size.
4. Open the Color Lab's paint picker, which holds the same `PaintSearch`.
5. Pinch anywhere. Nothing should zoom; that is the cost of the fix and is worth
   seeing rather than assuming.

If the app still zooms, WKWebView is ignoring the scale limits and the fallback
is a 16px floor on `TextField`'s `pill` variant — which fixes search and leaves
the rename, for the reasons retro 036 sets out.

---

## Raised concerns

Looked at, understood, and deliberately left alone. Each of these has a reason
for being left that is worth more than the item itself — the fix is a trap, or
the cost outstrips what it buys, or the thing simply fits. None of them is
waiting on anybody.

Promote one to **Open** only when its premise changes.

### 3. The cached catalog is ~2.2 MB of localStorage
**Raised:** 014 · **Watch, not fix**

The snapshot is 1.14 MB of JSON, which localStorage stores as UTF-16 — about
2.2 MB against a quota that is typically 5 MB. It fits, and a write failure is
already handled (the refresh applies for the session and simply does not
persist). Worth remembering before anything else large is persisted, and before
the catalog grows by another brand.

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

### 9. Nothing compiles Swift until a release runs
**Raised:** 029 · **Deferred on cost, not difficulty**

`ci.yml` runs lint, typecheck, tests, a web build and the layout check on every
push, none of which build the iOS target. `src/test/iosProject.test.ts` asserts
the project settings as strings, which catches a regressed `Info.plist` or a
device family someone widened by clicking a dialog — but not code. A broken
`AppDelegate` therefore reaches the release workflow undetected and fails there,
minutes into a run that was meant to ship something.

The fix is known and is why this is deferred rather than open-ended: add a
compile-only iOS job to `ci.yml`. The cost is macOS runner minutes on every
push, at ten times the Linux rate on a private repo and against a shared free
allowance on a public one, to guard a target whose own Swift is two untouched
template files — `AppDelegate.swift` and `SceneDelegate.swift`.

Worth revisiting if any of those files ever gains real code, which today it has
not.

---

## Recently closed

Listed only so a reader of the older retros can see where each thread ended.
Prune this section once it stops being useful.

| Item | Raised | Closed by |
| --- | --- | --- |
| Rename a list | 003 | 004 |
| Dead browse UI (BrandFilter / PaintCard / ResultsGrid / SearchBar / ExportPanel) | 003, 004 | 005 |
| Google Fonts loaded from a CDN | 005 | 005 |
| Saved lists went stale against the catalog | 005 | 005 |
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
| Store screenshots stale after the catalog change | 014 | 018 — regenerated; the browser was never the problem |
| A build still fell over on `JAVA_HOME` — set persistently in 007, absent from any shell older than that change | 004, 022 | 022 — `tools/android/gradle.mjs` resolves the JDK per build, so no shell has to be right |
| iOS app icon and splash were Capacitor's placeholder | 001 | 024 — `npm run icons` writes both from the same source mark |
| `CapApp-SPM/Package.swift` was committed with Windows path separators, which are invalid Swift escape sequences | 024 | 024 — `tools/ios/fix-spm-paths.mjs` runs after every `cap:sync`, asserted by `iosProject.test.ts` |
| iOS signing and archive needed a Mac nobody here has — the only one is a 2015 model, permanently below the Xcode 26 floor | 001 | 029 — `ios-release.yml` archives and uploads from a hosted runner; a release is one button from Windows |
| Both stores showed one screen out of two — four List screenshots per store under a description of a color laboratory, and no release notes for the version carrying it | 031 | 034 — one shot per section of the description, and a 1.2.0 block in both listing files |
| `store/` was still British English while the rest of the repo was American, deferred because the listing declared itself English (U.K.) | 035 | 035 — converted with the privacy page; the console setting it pairs with is item 15 |
| Markdown export could not work in the Android WebView — no `DownloadListener` behind the anchor-click blob download | 005 | 037 — the export feature was deleted rather than fixed; the flag had been `false` since 005 |
| Shop links covered 186 paints out of 2,279, remapped through the id migration rather than re-crawled | 014 | 037 — deleted with the export feature that was its only reader |
| Affiliate revenue from the shop links — a retailer with a program, a retargeted crawl, a per-paint buy affordance and a disclosure paragraph | 015 | 037 — **dropped, not deferred.** Four gates deep, no retailer chosen, and it would put the app's first commercial surface in front of users. Retro 015 has the reasoning if it is ever revived |
| The App Store resubmission blocked on a build predating the safe-area and portrait fixes | 032 | 037 — **removed as active work, not as an open item.** The mechanics live in [ios-release-checklist.md](./ios-release-checklist.md); the answers Apple asked for live in [store/listing-appstore.md](../store/listing-appstore.md#app-review-information). A submission in flight is a task, not a known-but-unfixed thing |
| The safe-area fix was unverified on hardware — status bar overlap, FAB clearance, sheet insets, orientation lock | 030 | 037 — confirmed working on the iPhone 15 Pro Max, 2026-08-15 |
| The anchor-scroll fix was unverified on WebKit — opening the catalog on a paint showed an empty sheet on iOS | 033 | 037 — confirmed working on the iPhone 15 Pro Max, 2026-08-15. The ~950,000px scroller redesign the item held in reserve is not needed |
| Play production access needed twelve testers for fourteen continuous days — carried since 025 as the longest pole to release | 025 | 037 — **moot.** The developer account is an organization account, which Google exempts from the rule. The package-name half of the item was stale too: `release-checklist.md` recorded it done on 2026-08-10 and OPEN-ITEMS never caught up |
| App Store primary language declared English (U.K.) while the copy was American | 035 | 037 — changed to English (U.S.) in App Store Connect, 2026-08-15. The pair item 14 described is now consistent on both halves |

Two items from 003 — "unselect list" and a dark-mode toggle — were deliberate
removals in the redesign rather than pending work, and are not tracked.
