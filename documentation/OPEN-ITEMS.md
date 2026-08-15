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

### 3. The cached catalog is ~2.2 MB of localStorage
**Raised:** 014 · **Watch, not fix**

The snapshot is 1.14 MB of JSON, which localStorage stores as UTF-16 — about
2.2 MB against a quota that is typically 5 MB. It fits, and a write failure is
already handled (the refresh applies for the session and simply does not
persist). Worth remembering before anything else large is persisted, and before
the catalog grows by another brand.

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

1. **A retailer with an affiliate program.** vliegeruit.com has no known one,
   so any snapshot pointing there pays nothing no matter how complete it gets.
   Element Games, Wayland Games and Amazon all run programs. Choosing one is the
   decision everything else waits on.
2. **A scraper and a snapshot, written from scratch** against that retailer's
   URL scheme, including the referral parameter. Retro 037 deleted
   `scrapeShopLinks.mjs` and `shopLinks.snapshot.json` with the export feature,
   and that was the right call even for this item: both were aimed at
   vliegeruit.com, which is not the retailer this would use. What survives is
   `tools/scraper/types.ts` and the pattern in `scrape.mjs`, and both are still
   in git history if the crawl logic is worth reading back.
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

### 12. The App Store submission needs a new build before it can be answered
**Raised:** 032 · **Blocking the resubmission**

Submission `7fce4ac9-c042-4e78-8187-a3397c78dd81` was rejected on 2026-08-14
under **Guideline 2.1 — Information Needed**. Seven questions and a screen
recording; the answers are all written and live in
[`store/listing-appstore.md`](../store/listing-appstore.md#app-review-information).

**The answers are not the blocker. The binary is.** The build under review was
archived from `0a7914f`, which predates `2cd1f95` (safe area) and `a1a5b6f`
(portrait lock) by about ninety minutes. So the app Apple is holding still draws
`PAINT CODEX` behind the status bar and still rotates into landscape — the two
bugs retro 030 is about. Apple asked for a recording of it, on a device,
starting from launch. That recording would be ninety seconds of evidence for a
Guideline 2.1 *bugs and crashes* rejection to go with the information one.

So the order is fixed, and it is not the order the email implies:

1. ~~Merge `feat/color-lab`.~~ **Done 2026-08-15**, fast-forward, `b5f1a22`.
2. ~~Close item 11.~~ **Done 2026-08-15.** Four screenshots per store, one per
   section of the description; 1.2.0 release notes in both listing files.
3. ~~Bump `versionCode` / `versionName`.~~ **Done 2026-08-15**: 1.2.0,
   `versionCode` 4. The Play `.aab` and the smoke-test APK are built, signed and
   verified.
4. **Push master**, then run **Actions → iOS release**. The workflow builds from
   the pushed commit, so nothing before this point is visible to it. Expect 15
   to 45 minutes. ← **next**. The zoom fix (036, item 16) has to be in this
   build: step 6 records the search sheet, and the rejected binary leaves the
   app zoomed the moment that sheet opens.
5. Attach the new build to the version record.
6. Record the flow on the iPhone 15 Pro Max against *that* build. The shot list
   has to cover items 10 and 13 as well; that is the same session.
7. Paste the Notes block, attach the recording, reply.

Everything from 4 down is mechanical, and step 6 cannot start until 5 has
finished processing.

`CURRENT_PROJECT_VERSION` is 4 and the rejected upload burned 3, so the number
increases as App Store Connect requires. If step 4's run fails *after* uploading,
4 is burned too and the next attempt needs 5 — via the workflow's build-number
override, or by bumping `versionCode` again and shipping a Play version that
differs from this one by nothing.

Two smaller things to check while in App Store Connect, neither of them
certainly wrong:

- **Apple's email says "App Version 1.0 for iOS" while `MARKETING_VERSION` is
  `1.1.0`.** The version record and the build may have been allowed to disagree.
  Worth looking at, because checklist step 7.1 assumes App Store Connect
  prevents exactly this.
- **The screenshots still predate the safe-area fix**, and regenerating them for
  1.2.0 did not change that: they are captured in desktop Chromium, where the
  insets are always zero, so no screenshot this repo can produce has ever shown
  a status bar. They are not wrong, and they are not the new build either. The
  only way to a screenshot with real insets in it is a device capture, which is
  the same session as the recording in step 6.

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

### 10. The safe-area fix is unverified on hardware
**Raised:** 030 · **Waiting on the next TestFlight build · Now gates item 12**

The device is an **iPhone 15 Pro Max**, and it is the only one the app has ever
run on — worth recording here because Apple asks for that list at every
submission and retro 030 never wrote it down. Note the check injects an iPhone
15 Pro's 59/34 insets, which is a different phone; the arithmetic is a delta, so
that is fine, but the two numbers are not the same fact and should not be
conflated.

The four checks below are no longer only good practice. The screen recording
item 12 owes Apple has to be made on this device, against the build that carries
this fix, so the first hardware confirmation and the recording are the same
session.

The status bar overlap and the orientation lock are both fixed and both
asserted, but every assertion runs on a desktop Chromium with the insets
*injected* — there is no notch on this machine to report a real one. The
arithmetic is a delta rather than a pixel value, so a device reporting
something other than the 59/34 used in the check is still handled correctly.
What has not been seen is the app on a screen with the fix in it.

Check on the next build, in this order — the first is the reported bug, the
rest are the places the same inset is spent:

1. The title clears the clock, and the card's background still reaches the top
   of the screen rather than letterboxing.
2. The FAB clears the home indicator, and the last paint in a full list can be
   scrolled out from under the FAB.
3. A sheet's content clears the indicator while its background still runs under
   it.
4. Rotating the phone does nothing, on both platforms.

Also worth a glance on an Android device with a WebView older than 140, where
Capacitor pads the native view instead of passing the insets through. That path
reports zero to the CSS by design and should look exactly as it did before.

### 13. The anchor-scroll fix is unverified on WebKit
**Raised:** 033 · **Same session as item 10 · Waiting on the next TestFlight build**

Opening the catalog on a paint showed an empty sheet on iOS. The cause is
established and the fix is asserted, but the assertion runs on a Chromium whose
scrolling has been broken on purpose — there is no WebKit on the development
machine, so *why* WebKit lands a jump short is inference. That a short landing
produces exactly this blank screen, and that the window now follows the scroller
wherever it stops, is not.

Check on the same device pass as item 10, on the iPhone 15 Pro Max:

1. Open a list paint's equivalents — the card is on screen, ringed, at the top.
2. Do it for a paint at each end of the color order. **Pure Black** is the one
   that was reported (browse position 8, near the start); a white or a pale
   gray is the other end.
3. Do it twice in a row without closing the sheet, via an equivalent tile — that
   is the path that re-anchors an already-scrolled list rather than a fresh one.
4. Scroll *up* through cards nobody has measured and watch for the content
   shifting under the finger. The correction for that had never run; it does
   now, and a real device is where its cost shows.

If the sheet still opens blank, the next thing to reach for is **not** another
landing retry: it is the scroller's ~950,000px extent itself. Anchoring the
window near the top and growing the spacers as the user scrolls would keep every
jump small, at the cost of a redesign of `useWindowedList`.

### 16. The zoom lock is unverified on hardware
**Raised:** 036 · **Same session as items 10 and 13**

Opening the search sheet on iOS left the whole app zoomed in and pannable after
it closed — iOS's focus zoom on a sub-16px input, which never reverses on blur.
`index.html` now pins the scale. The mechanism is not in doubt, but nothing on
this machine can observe it: a desktop Chromium has no soft keyboard, so
`npm run check:layout` sees the same page either way, and the assertion in
`androidShell.test.ts` reads the meta tag rather than a web view honouring it.

Check on the iPhone 15 Pro Max, in the same pass as items 10 and 13:

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
| Shop links covered 186 paints out of 2,279, remapped through the id migration rather than re-crawled | 014 | 037 — deleted with the export feature that was its only reader. The affiliate question it fed is item 5, which needs a different retailer anyway |
| Play production access needed twelve testers for fourteen continuous days — carried since 025 as the longest pole to release | 025 | 037 — **moot.** The developer account is an organization account, which Google exempts from the rule. The package-name half of the item was stale too: `release-checklist.md` recorded it done on 2026-08-10 and OPEN-ITEMS never caught up |
| App Store primary language declared English (U.K.) while the copy was American | 035 | 037 — changed to English (U.S.) in App Store Connect, 2026-08-15. The pair item 14 described is now consistent on both halves |

Two items from 003 — "unselect list" and a dark-mode toggle — were deliberate
removals in the redesign rather than pending work, and are not tracked.
