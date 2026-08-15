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

Nothing here is a bug. The whole unverified-fix backlog — the safe area, the
anchor scroll, the zoom lock and the tile-jump landing, four fixes shipped
blind between retros 030 and 039 — closed on the iPhone 15 Pro Max on
2026-08-15. What is left is one question about a
store account that was closed too early.

### 8. Does the twelve-tester gate survive an app transfer?
**Raised:** 025 · **Reopened 2026-08-15 · Play support ticket open, awaiting reply**

Play production access is gated, for personal developer accounts registered
after 2023-11-13, on a closed test holding **twelve testers opted in for
fourteen continuous days**. Organization accounts are exempt.

**The history matters and was misrecorded twice.** Paco was published under a
*personal* developer account, registered in 2026 and therefore subject to the
rule. It was later moved to the company's organization account by Google's
**app transfer** process, which is complete; closed-test binaries have shipped
under the new owner since. That is not the same thing as a converted account —
Google does not convert accounts, and retro 037's closure and the first version
of this reopened item both described one.

**The Play Console still shows the requirement after the transfer.** That is
the observable this repo said to trust over the rule, and 037 closed the item
without looking at it.

What is established:

- Google's
  [official page](https://support.google.com/googleplay/android-developer/answer/14151465)
  gates on "personal developer accounts created after November 13, 2023" and is
  **silent on app transfers**. It describes the requirement as a property of the
  *account*, which taken literally would mean an app under an exempt account is
  exempt.
- **The community sources conflict**, and neither could be read from this
  machine — Google's forum renders its thread bodies in JavaScript, so only the
  titles are retrievable. One is titled
  [Transfer of App to Business account still requires closed testing!](https://support.google.com/googleplay/android-developer/thread/279206872/transfer-of-app-to-business-account-still-requires-closed-testing),
  which is somebody in this exact position reporting this exact symptom; another
  asks for a
  [waiver for existing apps moved personal → org](https://support.google.com/googleplay/android-developer/thread/409685281/personal-to-org-account-14-day-closed-testing-waiver-for-existing-apps).
  Titles corroborate the console; they do not report a resolution.
- Secondary write-ups split. Some say a transferred app inherits the
  requirement and no waiver is given; others say it should not apply and a
  persistent display is worth a support ticket. Every one of them sells tester
  recruitment.
- **Nothing shipped is blocked.** 1.2.3 released to closed testing without
  complaint. This gates production only.

So it is genuinely unresolved, and the honest summary is that the requirement
may follow the app rather than the account — which the official page does not
say and the forum titles suggest.

**Uploading builds does not advance this.** The gate counts twelve testers
*opted in continuously for fourteen days*; binaries pushed to the closed track
are not progress toward it. If the opted-in count is below twelve the clock
reads zero however active the track is. Worth stating because an active track
feels like progress and is not.

Two things to do, in order:

1. **Release → Production → Create new release.** The authority, over any card
   on the account home page — that surface carries generic onboarding. Gated
   means a testing-requirements message and an "apply for production access"
   flow with a tester counter. Ungated closes this item.
2. ~~**If gated, open a Play Developer Support ticket**~~ **Done 2026-08-15.**
   A ticket is open, citing the completed transfer. This is the case the
   documentation does not cover, so it is a question for the people who can
   read the account's state rather than one to answer from policy pages.

   When the reply lands, record **which** question it answered: whether the
   requirement is evaluated against the *current* owner or the account of
   original publication. A reply that merely restates the policy page answers
   neither, and is worth pushing back on once — that page is silent on
   transfers, which is why the ticket exists.

**Start recruiting testers now, in parallel, rather than waiting for the
answer.** The gate is fourteen *continuous* days behind twelve opted-in
testers, so a bad answer received in a week costs three weeks, not one. Twelve
opt-ins standing when the reply arrives cost nothing if the answer is good —
they are people who wanted the app — and save the whole fortnight if it is
bad. This is the rare case where hedging is strictly cheaper than deciding.

If it does apply, recruitment is the whole route. Registering yet another
account is not one: the app is already where it should be, and a third account
would mean a new package name and re-doing signing, the listing and the store
presence, to escape a gate that a fortnight of testers clears.

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
| The zoom lock was unverified on hardware — opening search left the whole app zoomed in and pannable | 036 | 039 — confirmed on the iPhone 15 Pro Max against 1.2.3, 2026-08-15. The `TextField` 16px-floor fallback is not needed |
| The tile-jump landing was unverified on WebKit — searching, then tapping an equivalent tile, landed among the blacks at the top of the browse order | 038 | 039 — confirmed on the iPhone 15 Pro Max against 1.2.3, 2026-08-15, against all six checks including the late-revert watch and the mid-jump flick. The scroller-extent redesign held in reserve since 033 is **not needed** |
| Play production access needed twelve testers for fourteen continuous days — carried since 025 as the longest pole to release | 025 | 037 — closed as moot on the organization-account exemption, then **reopened the same day**: the Play Console still shows the requirement. Back in the Open section above. The package-name half of the item was genuinely stale and stays closed: `release-checklist.md` recorded it done on 2026-08-10 and OPEN-ITEMS never caught up |
| App Store primary language declared English (U.K.) while the copy was American | 035 | 037 — changed to English (U.S.) in App Store Connect, 2026-08-15. The pair item 14 described is now consistent on both halves |

Two items from 003 — "unselect list" and a dark-mode toggle — were deliberate
removals in the redesign rather than pending work, and are not tracked.
