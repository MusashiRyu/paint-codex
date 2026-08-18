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

Every unverified-fix item is now closed. The backlog that closed on the iPhone
on 2026-08-15 — the safe area, the anchor scroll, the zoom lock and the
tile-jump landing — is not carried here any more, and the soft-keyboard fix
closed on the Galaxy S9 on 2026-08-16 with the black screen gone and a
smaller thing left behind, which is a raised concern below rather than open
work. The App Store release went live on 2026-08-18.

**One item is left, and it is the Play one.** No longer a question — Google
support answered it on 2026-08-18 and the gate applies. What remains is
recruiting six more testers and waiting out fourteen days, which is work
nothing in this repository can do.

### 8. Six more testers, then fourteen continuous days
**Raised:** 025 · **Answered by Google support 2026-08-18 · Recruitment is the whole remaining task**

**The gate survives an app transfer. It is settled, and it applies here.**
Google support replied to the ticket opened on 2026-08-15: they cannot lift it,
and the only route around it they offered is republishing the app under a
**different bundle ID**. That has been declined — see below.

**Which question that answers, since this item asked.** The requirement is
evaluated against **the account of original publication, not the current
owner.** Support's own workaround is the proof: a *new* app record created
under the organization account is exempt, while *this* app record is not, and
the only difference between them is where each was first published. Paco was
published under a personal account registered in 2026 and moved to the
company's organization account by app transfer; the transfer moved the app and
left the obligation attached to it.

So Google's
[official page](https://support.google.com/googleplay/android-developer/answer/14151465)
describing the requirement as a property of the *account* is, for transferred
apps, misleading — and the forum threads titled for this exact symptom were
right. The console was right too, which is the third time on this item that
**trusting the observable over the rule** would have got there first. That is
the lesson worth keeping.

**Rebuilding under a new bundle ID is declined, and this is a decision rather
than a deferral.** The strongest reason is not the rework, though there is
plenty — new package name, new upload key, new signing, new listing, new store
presence, and six testers asked to opt in again to what is visibly a different
app. It is that `applicationId` is `com.musashi.paco` and so is the **iOS
bundle ID of a listing that is already live on the App Store**. That identity
cannot follow a Play rename. Changing it buys a fortnight and pays for it with
permanent divergence between the two stores, forever, on every document and
every future release. A fortnight of recruitment is cheaper than that on any
horizon longer than a fortnight.

**What is left is arithmetic.** Six testers are opted in. The gate is twelve,
opted in **continuously for fourteen days**, and the clock does not start until
the twelfth. So the earliest possible production access is fourteen days after
the sixth new opt-in, and nothing shipped, uploaded or fixed moves that date.

Three things make the fortnight go wrong, all of them avoidable:

1. **Recruit a buffer, not exactly six.** The counter resets if the opted-in
   number drops below twelve, and a reset costs the whole fourteen days rather
   than the days since the drop. Aim for fifteen or sixteen. The marginal
   tester is free; the marginal reset is two weeks.
2. **Opt-in is the counted event, not installation.** A tester who is sent the
   link, means well and never clicks it counts for nothing. Chase the click
   specifically, and confirm the count in the console rather than against the
   list of people who said yes.
3. **Tell testers not to leave the programme when they lose interest.** The
   opt-out is one button on the same page as the opt-in, it is the obvious
   thing to press when someone is done looking, and it is indistinguishable
   from a reset trigger. Ask them to stay opted in until told otherwise.

**Uploading builds is still not progress.** Restated because an active track
feels like movement and the clock does not count releases.

The tester list is worth attaching as a **Google Group** rather than a raw
email list if it is not one already: members can then be added and removed
without touching the track, which matters when the count has to be held above a
threshold for a fortnight. Countries were widened to worldwide on 2026-08-10,
so a tester anywhere can install and that is not a hidden blocker.

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

### 19. The keyboard covers the sheet's lower half on Android 10
**Raised:** 041 · **Left alone — the black screen is gone and the rest is one legacy phone**

The `adjustNothing` fix from 040 landed on the second of the two outcomes that
item predicted. On the Galaxy S9 the web view no longer collapses — the sheet
is drawn full height, the app is visible, nothing is black — but it does not
shrink for the keyboard either, so the keyboard covers its lower half.

**That settles the one part of 040 that was inference.** Below API 30 there are
no real IME insets, and 040 reasoned that androidx's fallback to the root
view's *visible* insets would still yield the keyboard's height once the window
stopped resizing. It does not. With the window frozen the plugin pads by zero
and nothing adjusts. The mechanism above API 29 is unaffected and was never in
doubt: API 30+ dispatches IME insets for real whatever the adjust mode, which
is every Android device newer than this one.

What it costs is bounded and was priced before the fix shipped. The search
field sits at the top of a `tall` sheet and stays visible, typing works, and
the results scroll — the lower half of the list is behind the keyboard until it
is dismissed. That is a worse keyboard on one legacy device, against a black
screen on every device below Android 15 before it.

**Left alone rather than fixed, for three reasons.** It affects API 29 and
below only. The only real fix left is `@capacitor/keyboard` plus a CSS
variable, which 040 rejected as a new dependency and a timing heuristic — the
timing half of that objection is gone now that nothing resizes underneath it,
but the dependency half is not, and both store listings answer their privacy
forms on this app's dependency count. And it is upstream as
[capacitor#8466](https://github.com/ionic-team/capacitor/issues/8466), where a
plugin-side fix would cost this repo nothing.

Promote it if an Android 10 device becomes something this app is aimed at, or
if a second report arrives from a phone that is not the S9.

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
| The zoom lock was unverified on hardware — opening search left the whole app zoomed in and pannable | 036 | 039 — confirmed on the iPhone 15 Pro Max against 1.2.3, 2026-08-15. The `TextField` 16px-floor fallback is not needed |
| The tile-jump landing was unverified on WebKit — searching, then tapping an equivalent tile, landed among the blacks at the top of the browse order | 038 | 039 — confirmed on the iPhone 15 Pro Max against 1.2.3, 2026-08-15, against all six checks including the late-revert watch and the mid-jump flick. The scroller-extent redesign held in reserve since 033 is **not needed** |
| The soft-keyboard fix was unverified on hardware — the web view collapsed to a ~34px black strip when the keyboard opened | 040 | 041 — tested on the Galaxy S9 against `versionCode` 8, 2026-08-16. **The black screen is gone.** The API 29 half of the fix was inference and it was wrong: the sheet stays full height and the keyboard covers its lower half. That is 040's own predicted failure mode, priced before it shipped, and it is the raised concern above rather than a reopened fix |
| Play production access needed twelve testers for fourteen continuous days — carried since 025 as the longest pole to release | 025 | 037 — closed as moot on the organization-account exemption, then **reopened the same day**: the Play Console still shows the requirement. Back in the Open section above. The package-name half of the item was genuinely stale and stays closed: `release-checklist.md` recorded it done on 2026-08-10 and OPEN-ITEMS never caught up |
| App Store primary language declared English (U.K.) while the copy was American | 035 | 037 — changed to English (U.S.) in App Store Connect, 2026-08-15. The pair item 14 described is now consistent on both halves |

Two items from 003 — "unselect list" and a dark-mode toggle — were deliberate
removals in the redesign rather than pending work, and are not tracked.
