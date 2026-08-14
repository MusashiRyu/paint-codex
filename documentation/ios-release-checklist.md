# iOS release checklist

The end-to-end path from a clean checkout to a build live on the App Store.
Store *copy* lives in [`store/listing-appstore.md`](../store/listing-appstore.md);
this file is the mechanics.

Separate from [`release-checklist.md`](./release-checklist.md), which is the
Android path, because almost nothing transfers. Different account, different
fees, different artefact, different review culture. The one genuinely shared
step is the version bump, and that lives in the Android file because
`android/app/build.gradle` is where the numbers are decided.

---

## What is already done

The point of this section is that the Mac session should be short. Everything
below is committed and needs no Mac to have happened.

| Prepared | Where | Notes |
| --- | --- | --- |
| App icon | `ios/App/App/Assets.xcassets/AppIcon.appiconset/` | Real mark, 1024×1024, alpha channel stripped. Regenerate with `npm run icons`. |
| Launch image | `ios/App/App/Assets.xcassets/Splash.imageset/` | Same mark on the same ground as the app's first painted frame. |
| Export compliance | `ios/App/App/Info.plist` | `ITSAppUsesNonExemptEncryption` is `false`, so uploads stop asking. |
| Device capability | `ios/App/App/Info.plist` | `arm64`, replacing Capacitor's impossible `armv7`. |
| Privacy manifest | `ios/App/App/PrivacyInfo.xcprivacy` | No tracking, no collection, wired into the Resources build phase. |
| Device family | `ios/App/App.xcodeproj/project.pbxproj` | iPhone only. |
| Version numbers | `project.pbxproj`, both configurations | Pinned to the gradle values and asserted by `src/test/appVersion.test.ts`. |
| Listing copy | `store/listing-appstore.md` | Name, subtitle, keywords, promotional text, description, App Privacy answers, reviewer notes. |
| Screenshots | `store/graphics/screenshots-ios/` | 1290×2796, the 6.9" iPhone size. `npm run screenshots`. |
| Shared scheme | `ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme` | Committed so `xcodebuild -scheme App` resolves on a fresh clone. Asserted by `iosProject.test.ts`. |
| Release workflow | `.github/workflows/ios-release.yml` | Archives and uploads from a hosted Mac. Needs four repository secrets — see "The CI path". |
| Privacy policy URL | Already live | The same page Play uses. |

`src/test/iosProject.test.ts` asserts most of the above on every push,
because none of it is exercised by any build that runs on Windows.

## What still needs a Mac

Signing, archiving and uploading. There is no way around this: the toolchain
that produces a `.ipa` and talks to App Store Connect is macOS-only, and Apple
has never shipped it anywhere else.

**Check `xcodebuild -version` before committing to a machine.** Since 28 April
2026 App Store Connect rejects anything not built with **Xcode 26 or later**
against the iOS 26 SDK, and Apple raises that floor most Aprils, so this
paragraph has a shelf life —
[developer.apple.com/news/upcoming-requirements](https://developer.apple.com/news/upcoming-requirements/)
is the current answer.

The check comes first because the version is not independent of the machine.
Xcode 26 wants macOS Sequoia 15.6 or newer, Sequoia wants a 2018-or-later Mac,
and an older Intel Mac therefore cannot be brought up to submitting standard at
any amount of effort. A Mac with a years-old Xcode on it is not an hour from an
archive; it is an OS upgrade and a ~15 GB download away, if it qualifies at all.

**The Mac does not have to be yours, or even exist.** Three ways to get one:

1. **A macOS CI runner.** What this project uses — see "The CI path" below.
   Hosted runners come with a current Xcode already installed, so the version
   problem above solves itself, and releasing waits on nobody's availability.
   The setup is four repository secrets and no Mac at any point.
2. **Borrow or remote into a Mac.** The original plan, Parsec to a Mac. Fine
   *if it meets the Xcode floor above*, which is worth checking rather than
   assuming. An hour if nothing is wrong.
3. **A rented Mac.** MacStadium, Scaleway and similar, by the hour or month.
   The fallback if CI is unavailable and no suitable Mac is to hand.

Steps 0 to 2 and 6 to 7 are the same whichever you pick. Only the archive
differs: "The CI path" or steps 3 to 5.

---

## One-time setup

### 0. Before anything: the Apple Developer Program

**US$99 per year, recurring**, and that difference from Play's one-off $25
matters more than it looks: the app has to be worth renewing, and if the
membership lapses the app is removed from sale.

Enrol at [developer.apple.com/programs](https://developer.apple.com/programs/)
or through the Apple Developer app on an iPhone or iPad.

- **Two-factor authentication is required** on the Apple ID before enrolment
  will proceed. Turn it on first.
- **Individual or Organization.** Individual is the fast path: no company
  paperwork, approved in roughly a day or two. The cost is that the seller name
  shown publicly on the listing is the enrolling person's legal name. An
  Organization enrolment shows a company name instead but requires a legal
  entity and a **D-U-N-S number**, which is free but can take a week or more to
  obtain and verify. If a company name on the listing matters, start the D-U-N-S
  request before anything else in this document.
- **Approval is not instant.** Budget a couple of days, occasionally more if
  Apple asks for identity documents.

> **There is no iOS equivalent of Play's 12-testers-for-14-days rule.** That
> requirement is the long pole on Android and it has no counterpart here — a
> new Apple account can submit to review as soon as it is approved. TestFlight
> is available and worth using, but nothing forces a testing period first.

### 1. Register the bundle ID

**Certificates, Identifiers & Profiles → Identifiers → +**

| Field | Value |
| --- | --- |
| Type | App IDs → App |
| Description | `Paco Paint Codex` |
| Bundle ID | **Explicit** → `com.musashi.paco` |
| Capabilities | None. No push, no iCloud, no Sign in with Apple, no associated domains. |

Explicit rather than wildcard: a wildcard ID cannot be used with several
capabilities and there is no reason to leave that door open. The value matches
Android's `applicationId`, which is not required but is one less thing to hold
in your head.

> **Do not continue on to Certificates afterwards.** The sidebar puts
> *Certificates* directly above *Identifiers*, and having just registered one
> thing by hand it reads as the next manual step. It is not — step 4 has Xcode
> create the certificates and profiles itself, and this project has no
> capabilities that would need otherwise.
>
> Three reasons it is worth actively avoiding rather than merely skipping:
> **Create a New Certificate** wants a Certificate Signing Request, which
> Keychain Access generates *on a Mac*, so the page cannot be finished from
> Windows anyway. Routing around that with OpenSSL leaves the private key on
> whichever machine made the CSR, so the Mac that archives cannot sign with the
> resulting certificate without a `.p12` export carried across — more work than
> automatic signing, for the same outcome. And Apple allows only two
> distribution certificates per account: spending one on an unusable key means
> revoking it later, which invalidates every profile issued against it.
>
> If a certificate ever does have to be made by hand — the CI route in "What
> still needs a Mac" is the realistic case — it is **Apple Distribution**, the
> all-platform one Xcode itself creates. *iOS Distribution (App Store Connect
> and Ad Hoc)* is the older iOS-only equivalent and also works. Neither
> *Developer ID* row is ever relevant; those sign apps distributed outside the
> store.

### 2. Create the App Store Connect record

**[appstoreconnect.apple.com](https://appstoreconnect.apple.com) → Apps → +
→ New App.**

Every value is in
[`store/listing-appstore.md`](../store/listing-appstore.md) under "App
information", except two that exist only in this dialog and nowhere in the
finished listing:

- **Platforms.** iOS only. Leave macOS, tvOS and visionOS unticked —
  `TARGETED_DEVICE_FAMILY` is `1` and there is no build for any of them.
- **User Access.** **Full Access.** Limited Access is for an organisation
  hiding some of its apps from some of its people; on a one-person account it
  can only produce an allowlist to maintain for a team that does not exist.
  Admin, Finance and Reports roles ignore app-level limits regardless. Unlike
  the two fields below it is editable later, under Users and Access.

Two fields cannot be changed afterwards, so read them twice:

- **SKU.** Internal only and permanent. `paco-ios-001`.
- **Bundle ID.** Fixed once a build has been uploaded against it.

**The app name must be unique across the entire App Store**, not merely
unregistered by you. If `Paco - Paint Codex` is taken, the listing name is what
changes, and `store/listing-appstore.md` and `store/listing.md` should then
agree with each other.

The name under the icon is a different string and does not follow. It is
`Paco` on both platforms — `CFBundleDisplayName` in `Info.plist` and `app_name`
in `strings.xml` — because a home screen truncates anything longer. Changing
the store name is not a reason to touch either.

---

## The CI path, which needs no Mac at all

**This is the route this project actually uses.**
[`.github/workflows/ios-release.yml`](../.github/workflows/ios-release.yml)
archives on a hosted macOS runner and uploads to App Store Connect. It replaces
steps 3 to 5 entirely; steps 6 and 7 are unchanged, and the one-time setup above
still has to have happened.

CI used to be the option deferred to a later release, on the grounds that
setting it up meant exporting a distribution certificate — which needs a Mac,
and is circular when a Mac is the thing being worked around. That objection is
obsolete. An **App Store Connect API key** is created entirely in the web UI,
and `-allowProvisioningUpdates` has Xcode issue the certificate and profile on
the runner. Nothing is exported from anywhere, and the setup is four repository
secrets.

What is left is a genuine advantage rather than a workaround: the runner
already has a current Xcode, so the version floor above never has to be
chased, and a release does not wait on a particular machine being free.

### Create the API key

**App Store Connect → Users and Access → Integrations → App Store Connect API
→ +**, with the **App Manager** role.

The `.p8` file downloads **once and only once**. Apple will not serve it again;
losing it means revoking the key and issuing another.

### Set the four repository secrets

**Settings → Secrets and variables → Actions → New repository secret.**

| Secret | Where it comes from |
| --- | --- |
| `APPLE_TEAM_ID` | The 10-character Team ID, top right of the developer portal. |
| `ASC_KEY_ID` | Shown in the key list next to the key just created. |
| `ASC_ISSUER_ID` | Above the key list. One issuer ID for the whole account. |
| `ASC_KEY_P8_BASE64` | The `.p8`, base64 encoded. |

Base64 because a secret is a single string and a PEM file is not. On Windows:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\Downloads\AuthKey_XXXXXX.p8")) | Set-Clipboard
```

The Team ID is a secret here only because the repo is public and `pbxproj`
deliberately carries no `DEVELOPMENT_TEAM`; the workflow passes it to
`xcodebuild` at build time instead.

### Run it

**Actions → iOS release → Run workflow.** Manual only, deliberately: every run
consumes a `CFBundleVersion` that cannot be reused, so it must never fire on a
push.

The **build number override** input exists for exactly the trap described under
"Every release" — a burned build number. Left blank, the number comes from the
project and stays pinned to gradle's `versionCode`.

Two things the workflow does that a person in Xcode would not have to:

- **Asserts the Xcode version before building.** Runner images carry several,
  and the default is not always the newest. A wrong one is otherwise a rejected
  upload forty minutes later rather than a failure in ten seconds.
- **Needs a shared scheme.** Xcode keeps schemes under `xcuserdata` until
  shared, and that is not committed, so `xcodebuild -scheme App` on a fresh
  clone would fail with "scheme not found" while the project opens perfectly on
  a developer machine. `App.xcscheme` is committed and asserted by
  `iosProject.test.ts`.

There is no separate **Validate App** step on this path. Validation failures
arrive as upload errors instead.

---

## The first archive, if you do have a suitable Mac

Steps 3 to 5 are the manual equivalent of the workflow above. Use them if a Mac
running Xcode 26 or newer is available and you would rather watch it happen.

### 3. Get the project onto the Mac and build the web app

```bash
git clone <repo> && cd paco
nvm use                # Node 22, per .nvmrc
npm ci
npm run cap:build      # vite build + cap sync
```

**Use the npm bundled with Node 22, and do not upgrade it.** `npm ci` prints a
notice offering a newer major version; take it some other week. The lockfile is
only ever validated against the Node that
[`ci.yml`](../.github/workflows/ci.yml) pins, and the way an unfamiliar npm
fails is by deciding `package-lock.json` needs rewriting — which is dependency
resolution to debug on a machine that may be borrowed, in exchange for nothing
this project needs. `engines` in `package.json` records the floor rather than
the exact version, so a newer Node already on the Mac is not worth fighting.

**This is not optional, and it is not the same as opening the project.**
`ios/App/App/public` is gitignored — the web assets are a build output, so a
fresh clone has an Xcode project with no app inside it. `cap:build` is what puts
one there.

**No `pod install`.** Most Capacitor iOS instructions tell you to run it. This
project is on the Swift Package Manager path (`ios/App/CapApp-SPM/`), not
CocoaPods, so there is nothing to install — Xcode resolves the packages itself
on first open.

> **If Xcode reports a Swift parse error in `Package.swift` before you have run
> anything:** that is the Windows path-separator bug. `cap sync` writes local
> package paths with the host separator, and on Windows the resulting string
> literal contains invalid Swift escape sequences rather than a wrong path.
> `npm run cap:build` on the Mac regenerates it correctly, and
> `tools/ios/fix-spm-paths.mjs` repairs it on Windows so the committed file is
> never broken. It is called out here because the error message names Swift
> syntax and gives no hint that a sync on another operating system caused it.

Then:

```bash
npm run cap:ios        # cap:build + open the project in Xcode
```

### 4. Signing

Xcode → target **App** → **Signing & Capabilities**.

- Tick **Automatically manage signing**.
- Choose the **Team** that appeared when the Apple ID was added under Xcode →
  Settings → Accounts.

Xcode then creates the development and distribution certificates and the
provisioning profiles on its own. There is no manual certificate step for a
project with no capabilities, which this one is.

Nothing here is committed. Signing settings live in the pbxproj, so **do not
commit the `DEVELOPMENT_TEAM` value** if the repo is public — and this one is.

### 5. Archive, validate, upload

1. Set the run destination to **Any iOS Device (arm64)**. Archive is greyed out
   while a simulator is selected, which is the most common five minutes lost in
   this whole process.
2. **Product → Archive.**
3. In the Organizer window that opens: **Validate App** first. It runs the same
   checks the upload does, and failing here costs seconds rather than a full
   upload.
4. **Distribute App → App Store Connect → Upload.**

Then wait. Processing takes anywhere from a few minutes to about an hour before
the build is selectable in App Store Connect.

Two things that fail *after* the upload rather than during the build, and are
already handled in this repo — listed so that seeing them means something has
regressed rather than something is unfinished:

- An app icon with an alpha channel. `npm run icons` strips it.
- The export compliance question. `Info.plist` answers it.

### 6. TestFlight

Optional but nearly free. **Internal testers** — up to 100 people on the team —
need no Beta App Review and get the build as soon as processing finishes. It is
the only way to see the app on real hardware before the public does, and this
app has never run on an iPhone.

External testing is a larger step (Beta App Review, a public link, up to 10,000
testers) and is not needed for a first release.

Worth checking specifically on a device, because none of it can be checked here:

- The launch image is the app's own black rather than a white flash.
- Safe-area insets on a notched device — the header and the floating add button
  are the two things that would collide with system chrome.
- The catalogue loads with the device in aeroplane mode.
- Outbound links open in Safari rather than inside the app.

### 7. Submit for review

In App Store Connect, on the version:

1. Attach the processed build.
2. Fill in everything from `store/listing-appstore.md` — description, keywords,
   subtitle, promotional text, support URL, privacy policy URL, category, age
   rating, App Privacy, and the reviewer notes.
3. Upload the screenshots from `store/graphics/screenshots-ios/` into the
   **6.9" Display** slot, and only that one.

   The iPhone tab stacks several size slots and they look identical. The 6.9"
   one is at the top; the **6.5"** immediately below it takes 1242×2688 or
   1284×2778 and rejects these files with "the dimensions of one or more
   screenshots are wrong". The files are 1290×2796 and are not the problem —
   the drop target is. Apple scales 6.9" down for every smaller iPhone, so
   filling the other iPhone slots is optional and pointless.

   The same box takes **app previews**, which are videos rather than stills —
   15 to 30 seconds, three per size, and optional in a way screenshots are
   not. Skip them. Apple wants footage of the app genuinely running on a
   device, and per "What this repo cannot check" it has never run on one; a
   preview cannot be honestly made before step 6 has happened. They can be
   added later without resubmitting a binary.

   Leave **iPad** empty, and not merely because there is no build for it:
   supplying iPad screenshots claims a tablet layout that
   `TARGETED_DEVICE_FAMILY = 1` does not provide, which is the Guideline 4.0
   rejection described in the settings table below. Apple Watch, likewise.
4. Choose the release option. **Manual release** for a first submission —
   approval at 3am and an app live before anyone has looked at the listing is a
   bad trade for the two minutes it saves.
5. Submit.

Review is usually a day or two. A first submission from a new account gets the
most thorough look the app will ever get, which is the reasoning behind the tip
link decision in `store/listing-appstore.md` — settle that before submitting.

---

## Every release

**Bump the version in `android/app/build.gradle` and nowhere else first.** The
iOS values restate it, and
[`release-checklist.md`](./release-checklist.md#1-bump-the-version) is where
that table lives. `src/test/appVersion.test.ts` fails the build if they drift.

Then: `npm run cap:build`, archive, upload, submit.

One iOS-specific trap. `CFBundleVersion` (`CURRENT_PROJECT_VERSION`) must
**increase on every upload to App Store Connect**, not merely on every release.
A build that is uploaded and then withdrawn burns its number permanently. Since
that value is currently pinned to Android's `versionCode`, burning an iOS build
number means bumping `versionCode` too and shipping a Play version that differs
from the last one by nothing at all.

That pin is a convenience, not a law. If iOS uploads start needing their own
numbering — a few failed uploads in a row will do it — unpin
`CURRENT_PROJECT_VERSION`, let it run ahead, and relax the assertion in
`appVersion.test.ts` to "greater than or equal" rather than deleting it.

---

## Deliberate settings, so nobody "fixes" them later

| Setting | Value | Why |
| --- | --- | --- |
| `TARGETED_DEVICE_FAMILY` | `1` | iPhone only. The app is a single-column phone layout and `check-layout.mjs` only asserts phone widths. Restoring iPad makes a 13" screenshot set mandatory and puts a stretched layout in front of a reviewer under Guideline 4.0. Asserted by `iosProject.test.ts`. |
| `IPHONEOS_DEPLOYMENT_TARGET` | `15.0` | Capacitor 8's floor, and what `CapApp-SPM/Package.swift` declares. Raising it drops devices for nothing; lowering it is not possible. |
| `UIRequiredDeviceCapabilities` | `arm64` | Capacitor's template says `armv7`, which is 32-bit and cannot coexist with an iOS 15 target. |
| `ITSAppUsesNonExemptEncryption` | `false` | HTTPS-only use is exempt and the app implements no cryptography. Answered in the plist so no upload stops to ask. |
| `UISupportedInterfaceOrientations` | portrait + both landscape | Matches Android, which does not lock orientation either. |
| No `~ipad` orientation key | — | Never read while the device family is `1`. It comes back with iPad support, not before. |
| Swift Package Manager, not CocoaPods | — | Capacitor's current default. `ios/App/Pods` is gitignored only because the template ships that ignore rule; there is no Podfile. |
| `PrivacyInfo.xcprivacy` | all four values empty | An explicit "nothing" rather than an absent file. Must agree with the App Privacy answers in App Store Connect. |

---

## What this repo cannot check

Written down so the gap is known rather than assumed away.

- **Nothing here compiles Swift.** CI runs lint, typecheck, tests, a web build
  and the layout check. It does not build the iOS target, so a broken
  `AppDelegate` would reach the Mac undetected. The tests in
  `iosProject.test.ts` are string assertions over project files, not a build.
- **The app has never run on iOS hardware or in the Simulator.** Safe-area
  behaviour, WebView scroll bounce, keyboard avoidance in the search sheet and
  the launch image transition are all unverified. That is what step 6 is for.
- **Screenshots are captured in desktop Chromium at an iPhone viewport**, not on
  iOS Safari. The engines differ. The layout check has the same limitation and
  says so.
