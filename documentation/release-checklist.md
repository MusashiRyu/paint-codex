# Android release checklist

The end-to-end path from a clean checkout to a build live on Google Play.
Store *copy* lives in [`store/listing.md`](../store/listing.md); this file is
the mechanics.

---

## Where this actually stands

**1.0.0 (`versionCode` 1) was uploaded to internal *and* closed testing on
2026-08-10.** The store listing, categorisation, target audience and App
content answers are all filled in, so the one-time setup below is history
rather than instructions — it is kept because a second app, or a Console
redesign, makes it worth having.

Two things are outstanding, and only one of them is work:

- **The package name registration is still in Draft**, waiting on the app
  signing key's SHA-256 from **Release → Setup → App signing**. Minutes.
- **Production needs twelve testers opted in for fourteen continuous days.**
  Not work — waiting, plus recruitment. See the 12-testers note in step 0.

Paste this into Play Console → App content → Privacy policy:

```
https://musashiryu.github.io/paint-codex/privacy.html
```

Served by GitHub Pages from `docs/` on `master`, at
[github.com/MusashiRyu/paint-codex](https://github.com/MusashiRyu/paint-codex).
`npm run privacy` regenerates it from `store/privacy-policy.md`; push and Pages
redeploys within a minute.

**Keep that URL alive for as long as the app is listed.** Deleting the repo,
making it private, or renaming it breaks the link, and a dead privacy-policy
URL is a compliance problem rather than a broken bookmark. Renaming the repo in
particular is a silent trap: GitHub redirects the *repo*, not the Pages domain.

**Never replace this with a privacy-policy generator's page.** They emit
boilerplate asserting analytics, cookies and third-party sharing this app does
not do, and Play cross-checks the policy against the Data safety answers. A
contradiction there is a rejection risk.

---

## One-time Play Console setup

**This part cannot be automated.** The Play Developer API (`androidpublisher`)
manages apps that already exist — edits, releases, tracks, listings — but there
is no endpoint that creates an app. Creating the entry is web-UI only, behind a
verified developer account. Everything *after* the first release can be
scripted; this cannot.

Menu labels move around between Console redesigns. Where the wording below has
drifted, the field is still findable by name.

### 0. Before anything: the developer account

A one-off **$25** registration plus identity verification (ID, address, phone).
Verification is not instant — it can take days, occasionally longer. Nothing
below can start until it clears, so do it first.

> **You must verify access to a real Android device.** This is a separate check
> from the ID and phone steps — Console calls it *Android developer
> verification* — and it is the one requirement no amount of tooling gets you
> past. It wants the **Google Play Console app** installed on Android hardware,
> signed in with the account that owns the developer account.
>
> An emulator will not satisfy it. The check exists to prove real hardware and
> Play Integrity fails device-integrity on emulator images, which is the whole
> point of it.
>
> You do not have to *own* the device, only have access to one. Borrowing a
> phone or tablet works: install the app, sign in as yourself, verify, then sign
> out and remove the account. On a borrowed device, adding a second user profile
> (Settings → System → Multiple users) and deleting it afterwards keeps the two
> accounts from ever mixing.

> **The 12-testers rule.** Personal developer accounts registered from late 2023
> onward must run a **closed test with at least 12 testers opted in for 14
> continuous days** before they can even apply for production access. The 14
> days do not start until the twelfth tester has opted in, and the counter
> resets if you drop below twelve. This is the single longest pole in the
> schedule and it is invisible until you go looking for it — start the closed
> track the day the account clears, not after the listing is polished.

### 1. Register the package name

Console asks for this **before** the app entry exists, in a *First, enter your
package name* dialog behind **Register package name**. Two fields:

| Field | Value |
| --- | --- |
| Package name | `com.musashi.paco` |
| Friendly name | `Paco - Paint Codex` |

The package name has to match the `applicationId` in
`android/app/build.gradle` exactly — that file is the only place it is decided,
and a mismatch is not discovered until an upload is rejected much later. Copy
it rather than retyping it.

The Friendly name is an internal label for finding the package in Console
lists. It is not the store listing name and no user ever sees it.

Submitting that leaves the package in **Draft**, with *To finish registering
this package name, add your public key* and an **Add key** button. The field
wants a **SHA-256 certificate fingerprint typed in**, not a certificate file —
so exporting a `.pem` or `.der` is wasted effort.

That **Add key** button is the *new package name* path, which is the one this
app takes. A package name that already has installs gets **Select key**
instead, which lists fingerprints Google already associates with it and asks
you to prove ownership rather than assert a key.

**It wants the app signing key, not the upload key**, and the distinction is
easy to get backwards because at this point in the flow the upload key is the
only key that exists. Google's own wording is what settles it — the certificate
asked for is the one whose

> signing key is what Android uses to verify that app updates are from you.

A device verifies an update against the key that signed the *installed* app.
Under Play App Signing that is Google's app signing key, so an update carrying
only the upload key's signature is refused. The app signing key does not exist
until enrolment at step 3.

Prefer to leave the package in Draft, finish steps 2–6, then read the app
signing key's fingerprint from **Release → Setup → App signing** — that page
lists both keys — and register it here. If Console instead blocks app creation
until the package name is fully registered, add the upload key now and add the
app signing key afterwards; more than one key can be registered per package,
which is what makes that order recoverable.

To read the upload key's fingerprint without needing the keystore password,
take it from a signed artefact:

```bash
"$JAVA_HOME/bin/keytool" -printcert -jarfile \
  android/app/build/outputs/bundle/release/app-release.aab
```

> **This dialog is the point of no return.** Registering the string burns it
> globally across Play, permanently. Deleting the app entry afterwards does not
> release it — a second attempt needs a different name. Anything that wants to
> change the `applicationId` has to happen before this dialog is submitted, and
> at that point it is a one-line edit and a rebuild.
>
> `com.musashi.paco` is not the reverse-DNS of a domain anyone owns, which is
> the convention but not a rule and never checked. Recorded here so nobody
> later reads it as an oversight and "fixes" it — by then it cannot be fixed.

### 2. Create the app

**All apps → Create app.**

| Field | Value |
| --- | --- |
| App name | `Paco - Paint Codex` |
| Default language | English (United States) |
| App or game | **App** |
| Free or paid | **Free** — irreversible; a free app can never be made paid |
| Declarations | Developer Programme Policies, US export laws |

### 3. Enrol in Play App Signing

Accept the default. Google generates and holds the app signing key; the
keystore on this machine is only the **upload** key. That is exactly why losing
it locally is recoverable — support can reset an upload key and could never
reset an app signing key.

### 4. App content

Every answer is in [`store/listing.md`](../store/listing.md). In Console order:

- **Privacy policy** → `https://musashiryu.github.io/paint-codex/privacy.html`
- **App access** → all functionality available without restrictions
- **Ads** → contains no ads
- **Content rating** → questionnaire; every question answers "none"
- **Target audience** → 13+, and **do not tick any under-13 band**
- **Data safety** → does not collect or share any user data
- **News / government / financial / health** → no to all

### 5. Store listing and settings

**Grow → Store presence → Main store listing.** Short description, full
description and graphics, all from [`store/listing.md`](../store/listing.md)
and `store/graphics/`:

| Asset | File |
| --- | --- |
| App icon | `store/graphics/icon-512.png` |
| Feature graphic | `store/graphics/feature-graphic.png` |
| Phone screenshots | `store/graphics/screenshots/*.png` (all four) |

Then **Store settings** for category (Art & Design) and contact details, and
**Countries / regions** for availability.

> **The contact email is the one field you have to supply from memory.** It is
> required and shown publicly, and since 019 it is deliberately not recorded in
> `store/listing.md` — this repo is public and a listing address gets scraped.
> Every other field on this checklist can be copied out of the repo; this one
> cannot, which is exactly why it is called out here rather than left to the
> generic "contact details" above.
>
> Pick an address you are willing to publish, and prefer an alias you can retire
> over a personal mailbox. The privacy policy does *not* carry it — that points
> at the issue tracker instead — so this Console field is the only place it
> exists.

### 6. Closed testing, then production

**Testing → Closed testing → Create new release.** Upload
`app-release.aab`, paste the release notes from `listing.md`, add testers.

Read the 12-testers note in step 0 again before assuming production is close.

### Automating what comes next

Once the app exists and has had one manual release, uploads *can* be scripted
via the Play Developer API — a Google Cloud service account, granted access
under **Users and permissions**, driven by `fastlane supply` or
`r0adkll/upload-google-play` in Actions. Worth doing only once releases are
frequent enough to be a chore; the first one has to be by hand regardless.

### The upload key

Already generated. It lives **outside the repository** at
`%USERPROFILE%\.android-keystores\paco-upload.jks`, with credentials in
`%USERPROFILE%\.gradle\gradle.properties` under the `PACO_UPLOAD_*` names. The
repo never sees either.

Back up both. `android/.gitignore` ignores `*.jks` and `*.keystore`, so a
keystore committed by accident is unlikely, but a keystore lost with the
machine is not.

To read the upload certificate fingerprint, if the Console asks for it:

```bash
"$JAVA_HOME/bin/keytool" -list -v \
  -keystore "$USERPROFILE/.android-keystores/paco-upload.jks" \
  -alias paco-upload
```

---

## Every release

### 1. Bump the version

Edit `android/app/build.gradle` and nothing else. It is the only place a
release version is decided:

- `versionCode` — an integer, **must increase on every upload**. Play rejects a
  reused one, and there is no way to reclaim a number.
- `versionName` — the human string, e.g. `1.0.0` → `1.0.1`.

Three other files restate those two values, and `src/test/appVersion.test.ts`
asserts all three against the gradle file, so a half-done bump fails step 2
rather than shipping:

| Restates | Where | Shown when |
| --- | --- | --- |
| `versionName` | `APP_VERSION` in `src/app/config.ts` | Web build only — on a device `App.getInfo()` answers instead |
| `versionName` | `MARKETING_VERSION`, both iOS build configurations | `CFBundleShortVersionString` on an iOS build |
| `versionCode` | `CURRENT_PROJECT_VERSION`, both iOS build configurations | `CFBundleVersion` on an iOS build |

The iOS values are the easy ones to forget: they cannot be built on this
machine (OPEN-ITEMS 4), so nothing here ever renders them. `Info.plist` reads
both through `$(…)` and needs no edit.

Note that iOS and Play count uploads separately. `CURRENT_PROJECT_VERSION` is
pinned to `versionCode` to keep one number to bump; if App Store Connect ever
rejects a build number, that pin is the thing to reconsider — and the test with
it.

### 2. Verify

```bash
npm run lint && npx tsc -b --noEmit && npm test
```

This is what CI runs. Do not skip it — a release build does not typecheck the
web app any harder than a dev build does.

### 3. Build the bundle

```bash
npm run cap:build            # vite build + cap sync -- NEVER skip this
npm run android:build:release
```

**`cap:build` is not optional.** Gradle packages whatever already sits in
`android/app/src/main/assets/public`; it does not build the web app. Skip it and
you get a bundle that installs and runs perfectly while shipping the web assets
from whenever `cap sync` last ran — the release looks fine and silently omits
everything you just did.

Artifact: `android/app/build/outputs/bundle/release/app-release.aab`

**The JDK is no longer the shell's problem.** `npm run android:build:*` goes
through `tools/android/gradle.mjs`, which probes each candidate JDK for its
version and runs the Gradle wrapper on one this Gradle accepts (17–24,
preferring 21) — so an unset or stale `JAVA_HOME` no longer stops a build, and
Android Studio's bundled JBR (Java 25, rejected by Gradle 8.14.3 with
`Unsupported class file major version 69`) is skipped rather than picked. The
run prints the JDK it chose; if it is not 21 it also says so. Override with
`PACO_JDK_HOME`.

Only the npm scripts get this. Calling `gradlew` directly, or the
`"$JAVA_HOME/bin/…"` invocations of `keytool` and `jarsigner` below, still read
the variable — in a shell that does not have it, export it by hand:

```powershell
$env:JAVA_HOME = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User')
```

### 4. Confirm it is actually signed

A release build without the upload key configured now fails at configuration
time rather than producing an unsigned bundle — see the guard at the bottom of
`android/app/build.gradle`. To check the artifact itself:

```bash
"$JAVA_HOME/bin/jarsigner" -verify -verbose:summary -certs \
  android/app/build/outputs/bundle/release/app-release.aab
```

Expect `jar verified.` and `CN=Paco, O=Musashi, C=NL`.

### 5. Smoke-test the release build on hardware

An `.aab` cannot be installed on a device. Build an APK instead — prefer the
release one, which exercises the same signing config and resource processing
that ships, rather than the debug build's different key and debuggable flag:

```bash
npm run android:build:release:apk
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

> **`jarsigner -verify` reports a release APK as `jar is unsigned`. It is not.**
> That tool only understands v1 JAR signing, and an APK with `minSdkVersion` 24
> is signed with APK Signature Scheme v2/v3 and needs no v1 signature at all.
> Use `apksigner`, which is the tool that knows the difference:
>
> ```bash
> "$LOCALAPPDATA/Android/Sdk/build-tools/36.0.0/apksigner.bat" verify --print-certs \
>   android/app/build/outputs/apk/release/app-release.apk
> ```
>
> Expect `CN=Paco, O=Musashi, C=NL`. `jarsigner` remains the right tool for the
> `.aab`, which really is JAR-signed — which is exactly why the two disagree.

Confirming what actually got packaged, rather than trusting the task graph:

```bash
"$LOCALAPPDATA/Android/Sdk/build-tools/36.0.0/aapt2.exe" dump badging \
  android/app/build/outputs/apk/release/app-release.apk
```

Note that a release APK's resource paths are shortened by AAPT2, so the icon
appears as something like `application-icon-640:'res/BW.xml'` rather than
`ic_launcher`. Grepping the archive for `ic_launcher` finds nothing and means
nothing.

Worth actually looking at, because these only misbehave in a packaged build:

- The launcher icon and its shape on the home screen.
- The splash: it should be the app's near-black, with no white flash into the
  first painted frame.
- The back gesture closing an open sheet rather than the app — including the
  About sheet, which is the third layer registered with `useBackDismiss`.
- The app working with the radio off — the catalogue refresh must fail quietly.
- **Every link in the About sheet opening the system browser**, and each one
  landing on its real destination. The handoff relies on Capacitor's WebView
  intercepting a `target="_blank"` navigation, and the two failure modes are
  nothing happening at all, or the page loading *inside* the app with no way
  back. `npm run dev` proves nothing here — the repo already has one web API
  that silently does nothing in the WebView, the blob download in OPEN-ITEMS
  item 1.

  **Confirmed working on hardware, 2026-08-10, on the 1.0.0 release APK.** Kept
  on this list because it is a WebView behaviour rather than app code: a
  Capacitor or System WebView upgrade can take it away without anything in this
  repo changing. If it ever regresses, the fix is `@capacitor/browser`, which
  makes it the app's fifth runtime dependency and invalidates the "four runtime
  dependencies" sentence in the Data safety reasoning in `store/listing.md`.
- Returning to Paco from the browser, with the selected list still selected.

### 6. Upload and roll out

Play Console → the track → Create new release → upload the `.aab` → release
notes → review → roll out. Start at a staged percentage on production.

---

## Deliberate settings, so nobody "fixes" them later

| Setting | Value | Why |
| --- | --- | --- |
| `minifyEnabled` | `false` | This is a Capacitor shell. R8 would shrink a few hundred KB of AndroidX next to ~2 MB of web assets, and Capacitor resolves plugins reflectively, so a bad keep rule breaks the app *only* in release builds. Revisit if native code ever grows. **Every upload draws a Console warning about a missing deobfuscation file — that is this setting, working.** Nothing is obfuscated, so there is no mapping file to supply and crash traces already carry real names. It is informational and never blocks a release. |
| `android:allowBackup` | `true` | Paint lists are not sensitive, and users expect a list to survive a new phone. Disclosed in the privacy policy. |
| `targetSdkVersion` | `36` | Above Play's current floor. Note that API 35+ enforces edge-to-edge, which is why the splash and window backgrounds are set explicitly. |
| `minSdkVersion` | `24` | Capacitor's default. Keeping it means the legacy (non-adaptive) launcher icons still matter on API 24–25, which is why the generator writes them. |
| Signing | upload key only | Google holds the app signing key under Play App Signing. |
| `In-app purchases` | `No` | Correct: the field means purchases through Google Play's billing system, and the app has no billing integration — the About screen's links hand a URL to the browser. Do not "correct" this to `Yes` — that would declare an integration the app does not have. |
| `appConfig.featureFlags.supportLink` | `true` | Toggles the About screen's support section. The About screen stands on its own with the flag off. |

## Not covered here

**iOS.** Its own document:
[`ios-release-checklist.md`](./ios-release-checklist.md). Almost nothing
transfers between the two — different account, fee, artefact and review
culture — so keeping one file per store beats one file with "and for iOS…"
footnotes.

The one thing that genuinely spans both is the version bump in
[section 1 above](#1-bump-the-version), which is why that table names the iOS
build settings and stays here rather than being duplicated.
