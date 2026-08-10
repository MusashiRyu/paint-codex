# Retro 024 — Everything an iOS submission needs that a Mac is not required for

The iOS side had been parked behind "the archive flow is macOS-only" since 001.
That is true of signing, archiving and uploading. It had quietly become the
reason nothing *else* was done either — the icon was still Capacitor's blue
placeholder, there was no App Store listing copy, no screenshots at any size
Apple accepts, and `Info.plist` still carried the template's defaults.

This session did the part that does not need a Mac, and found one bug that
would have eaten the Mac session itself.

Decisions taken at the top, because they shaped everything after: **iPhone
only** for 1.0, and the Apple Developer Program is **not yet enrolled**, so the
checklist starts at enrolment rather than at App Store Connect.

## The bug: `Package.swift` could never have compiled

`ios/App/CapApp-SPM/Package.swift` was committed containing:

```swift
.package(name: "CapacitorApp", path: "..\..\..\node_modules\@capacitor\app")
```

`cap sync` writes local package paths with the host platform's separator, and
every sync in this repo's history ran on Windows.

This is not a wrong-separator problem that SPM would shrug off. Swift reads a
backslash in a string literal as an escape introducer, so that line contains
`\n` — an actual newline — followed by `\.`, `\@` and `\a`, none of which are
valid escape sequences. **The manifest does not parse.** The `CapApp-SPM`
dependency never resolves and Xcode fails before compiling a line of app code,
with an error naming Swift syntax and giving no hint that the cause was a sync
run on a different operating system.

Nothing here would ever have caught it. Nothing on Windows builds the iOS
target, so the whole cost lands on whoever opens the project on a borrowed Mac
with a booked slot running out.

Fixed three ways, because one was not enough:

- `tools/ios/fix-spm-paths.mjs` rewrites the paths. Only the `path:` arguments
  — the sibling `url:` is an https URL that is already correct, and a blanket
  replace would be a rule that happens to work rather than one that says what
  it means.
- It runs from `cap:sync`, not by hand. `Package.swift` carries a "DO NOT
  MODIFY — managed by Capacitor CLI commands" banner and means it: every sync
  puts the backslashes back, so a one-off edit would have lasted until the next
  `npm run cap:build`.
- `src/test/iosProject.test.ts` asserts the committed file is clean, so a sync
  that went around the script turns CI red instead of reaching a Mac.

**Honest scoping of the severity.** `ios/App/App/public` is gitignored, so a
fresh clone on a Mac has to run `npm run cap:build` before it has an app to
build at all — and that regenerates `Package.swift` correctly on macOS. So the
happy path was never broken. What was broken is the repo's committed state and
the very natural move of opening the Xcode project first to look around.

## What else was done

### The icon is the app's own

`npm run icons` now writes the iOS app icon and launch image from the same
source mark as everything else, so `tools/icons/` is no longer "Android and web
only". Two things differ from the Android outputs and both are load-bearing:

**The icon is flattened.** App Store Connect rejects an upload whose icon
carries an alpha channel, and it rejects it *after* the archive and upload
rather than during the build. The Play listing icon was already flattened for
the same class of reason; iOS just punishes it later and from further away.

**The launch image's mark is less than half the size of Android's.**
`LaunchScreen.storyboard` shows a square image with `scaleAspectFill`, which
crops rather than letterboxes. Filling a 1290×2796 phone from a 2732×2732
square keeps only 1290/2796 ≈ 46% of the source's width on screen, so Android's
0.32 ratio would have rendered a mark two thirds of the screen wide. Dividing
through gives 0.148 and the two platforms now look the same on launch.

### `Info.plist`, three corrections

| Was | Now | Why |
| --- | --- | --- |
| `UIRequiredDeviceCapabilities` = `armv7` | `arm64` | Capacitor's template default. `armv7` is 32-bit and the deployment target is iOS 15, which is arm64-only — the template described a device set that cannot exist. |
| No `ITSAppUsesNonExemptEncryption` | `false` | Without it *every* upload stops in App Store Connect to ask the export-compliance question by hand, TestFlight builds included. HTTPS-only use is exempt and the app implements no cryptography, so the answer is correct rather than merely convenient. |
| `UISupportedInterfaceOrientations~ipad` | removed | Never read while the device family is `1`. |

### iPhone only

`TARGETED_DEVICE_FAMILY` went from `"1,2"` to `1` in both configurations.

The project had claimed iPad support since Capacitor scaffolded it, and nothing
had ever tested it. Paco is a single-column phone layout; `check-layout.mjs`
asserts seven phone widths and stops at 540. Claiming iPad means a reviewer
opens a stretched phone UI on a 13" display, which is the shape of a Guideline
4.0 rejection, *and* makes a 2064×2752 screenshot set mandatory.

Asserted in `iosProject.test.ts` so it cannot come back via a checkbox in an
Xcode dialog.

### A privacy manifest that says nothing, deliberately

`ios/App/App/PrivacyInfo.xcprivacy`, wired into the Resources build phase —
a manifest that is not in that phase is not in the app.

All four values are empty arrays or `false`, and they are present rather than
absent so the file reads as an answer instead of a stub. Capacitor's frameworks
ship their own manifests and cover the `UserDefaults` access the bridge makes;
the App target's Swift is unmodified `AppDelegate`/`SceneDelegate` boilerplate
that touches no required-reason API, so declaring one here would have been
over-declaring.

The pbxproj edits — file reference, build file, group membership, resources
phase — were made by hand and then validated by parsing the result with the
`xcode` package that `@capacitor/cli` already depends on. A pbxproj is easy to
corrupt and the corruption does not show up until Xcode refuses to open the
project.

### Listing copy, and a second file rather than footnotes

`store/listing-appstore.md`. The stores do not ask for the same things: Apple
wants a 30-character subtitle, a 100-character keyword list and promotional
text editable without a build; Play wants a short description and neither of
the first two. One file with "and for iOS…" footnotes is how a listing ends up
half-migrated.

`check-listing.mjs` now checks both and reports per store. Ten fields, all
within limits.

Two judgment calls are written into that file rather than left implicit:

- **Brand names are in the keyword field, faction names are not.** "citadel",
  "vallejo" and "army painter" describe what the app converts between —
  the same nominative use the description already relies on. "warhammer" and
  faction names describe a game the app has nothing to do with, and reaching
  for that search traffic is the line the screenshots already refuse to cross.

### Screenshots at a size Apple accepts

`npm run screenshots` now writes both sets from one sequence — 1080×1920 into
`screenshots/`, 1290×2796 into `screenshots-ios/`. One sequence over a
`DEVICES` list rather than one per store: both listings show the same app, and
two sequences drift the moment one is updated for a UI change.

430 CSS px at 3× is not a number picked for this file. It is already one of the
seven widths `check-layout.mjs` asserts, so the layout in the iOS screenshots is
a layout under test.

All eight shots were opened and looked at, which the script's own closing
message asks for — two of its steps use `?.click()` and would no-op silently if
a selector stopped matching.

### The checklist

`documentation/ios-release-checklist.md`, starting from enrolment: the $99/yr
recurring fee, individual vs organisation and the D-U-N-S delay, the bundle ID,
the App Store Connect record, the Mac session, TestFlight, submission. Plus the
macOS-CI-runner option, which is the one that stops releases depending on
somebody being available.

It also states plainly that **nothing in this repo compiles Swift**. The tests
added here are string assertions over project files, not a build. A broken
`AppDelegate` still reaches the Mac undetected, and pretending otherwise would
be worse than the gap.

## Files changed

**New**
- `tools/ios/fix-spm-paths.mjs`
- `src/test/iosProject.test.ts`
- `ios/App/App/PrivacyInfo.xcprivacy`
- `store/listing-appstore.md`
- `store/graphics/screenshots-ios/*.png` — four shots at 1290×2796
- `documentation/ios-release-checklist.md`
- `documentation/024-retro.md`

**Modified**
- `ios/App/App/Info.plist` — arm64, export compliance, dead iPad key removed
- `ios/App/App.xcodeproj/project.pbxproj` — device family, privacy manifest
- `ios/App/CapApp-SPM/Package.swift` — forward slashes
- `ios/App/App/Assets.xcassets/**` — real icon and launch image
- `tools/icons/generate-icons.mjs` — the iOS outputs
- `tools/store/screenshots.mjs` — a device list instead of one viewport
- `tools/store/check-listing.mjs` — both listings
- `package.json` — `cap:sync` runs the SPM fix; `cap:build` goes through it
- `README.md`, `store/README.md`, `tools/icons/README.md`
- `documentation/0.1-architecture.md` — three tool rows updated, one added
- `documentation/release-checklist.md` — points at the iOS file
- `documentation/OPEN-ITEMS.md` — item 4 narrowed, two closed

## Checked, and found not to be a problem

- **Nothing Android-facing changed, and neither did the Play screenshots.**
  `npm run icons` rewrites all 33 files and `npm run screenshots` recaptures
  eight; `git status` lists only the four iOS assets. So the icon generator's
  Android output is byte-identical, and — the useful one — the `DEVICES`
  refactor in `screenshots.mjs` reproduces the Play set exactly rather than
  merely producing something plausible at the same dimensions.
- **430 CSS px was already under test.** The iOS screenshot width needed no new
  layout coverage — `check-layout.mjs` has asserted it since 023.
- **The pbxproj still parses**, verified with the `xcode` package rather than by
  eye, and both build configurations report the same device family.

## Assumptions made

- **The 1024px master is sufficient for the AppIcon.** Modern Xcode renders
  every smaller size from a single universal entry, and the `Contents.json`
  Capacitor ships already declares exactly that. If a future Xcode wants the old
  multi-size set, the generator grows a density loop like Android's.
- **One screenshot size is enough.** Apple scales the 6.9" set down for smaller
  iPhones. A second set only earns its place if the layout genuinely differs,
  and between 6.9" and 6.1" it does not.
- **Individual enrolment.** The checklist recommends it and flags what it costs
  — the seller name on the listing is a personal legal name. If a company name
  matters, the D-U-N-S request is the first thing to start and nothing here
  changes except the enrolment path.
- **`iosProject.test.ts` guards the right things.** It asserts what would
  regress silently and be expensive to discover: the SPM paths, the two plist
  keys, the device family, the privacy manifest's presence in the build. It
  cannot assert that the app works.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
