# Android release checklist

The end-to-end path from a clean checkout to a build live on Google Play.
Store *copy* lives in [`store/listing.md`](../store/listing.md); this file is
the mechanics.

---

## Nothing is blocking the first submission

The privacy policy is live. Paste this into Play Console → App content →
Privacy policy:

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

### 1. Create the app

**All apps → Create app.**

| Field | Value |
| --- | --- |
| App name | `Paco - Paint Codex` |
| Default language | English (United States) |
| App or game | **App** |
| Free or paid | **Free** — irreversible; a free app can never be made paid |
| Declarations | Developer Programme Policies, US export laws |

### 2. Enrol in Play App Signing

Accept the default. Google generates and holds the app signing key; the
keystore on this machine is only the **upload** key. That is exactly why losing
it locally is recoverable — support can reset an upload key and could never
reset an app signing key.

### 3. App content

Every answer is in [`store/listing.md`](../store/listing.md). In Console order:

- **Privacy policy** → `https://musashiryu.github.io/paint-codex/privacy.html`
- **App access** → all functionality available without restrictions
- **Ads** → contains no ads
- **Content rating** → questionnaire; every question answers "none"
- **Target audience** → 13+, and **do not tick any under-13 band**
- **Data safety** → does not collect or share any user data
- **News / government / financial / health** → no to all

### 4. Store listing and settings

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

### 5. Closed testing, then production

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

`android/app/build.gradle`:

- `versionCode` — an integer, **must increase on every upload**. Play rejects a
  reused one, and there is no way to reclaim a number.
- `versionName` — the human string, e.g. `1.0.0` → `1.0.1`.

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

**JDK 21 only.** Gradle 8.14.3 rejects Android Studio's bundled JBR (Java 25)
with `Unsupported class file major version 69`. `JAVA_HOME` is set persistently
at User and Machine scope on this machine, but a shell opened before that was
set carries the old environment block and will need it exported by hand:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot'
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

The bundle cannot be installed directly. Either build a release APK, or install
the debug APK — accepting that debug differs in signing and debuggability:

```bash
npm run android:build:debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Worth actually looking at, because these only misbehave in a packaged build:

- The launcher icon and its shape on the home screen.
- The splash: it should be the app's near-black, with no white flash into the
  first painted frame.
- The back gesture closing an open sheet rather than the app.
- The app working with the radio off — the catalogue refresh must fail quietly.

### 6. Upload and roll out

Play Console → the track → Create new release → upload the `.aab` → release
notes → review → roll out. Start at a staged percentage on production.

---

## Deliberate settings, so nobody "fixes" them later

| Setting | Value | Why |
| --- | --- | --- |
| `minifyEnabled` | `false` | This is a Capacitor shell. R8 would shrink a few hundred KB of AndroidX next to ~2 MB of web assets, and Capacitor resolves plugins reflectively, so a bad keep rule breaks the app *only* in release builds. Revisit if native code ever grows. |
| `android:allowBackup` | `true` | Paint lists are not sensitive, and users expect a list to survive a new phone. Disclosed in the privacy policy. |
| `targetSdkVersion` | `36` | Above Play's current floor. Note that API 35+ enforces edge-to-edge, which is why the splash and window backgrounds are set explicitly. |
| `minSdkVersion` | `24` | Capacitor's default. Keeping it means the legacy (non-adaptive) launcher icons still matter on API 24–25, which is why the generator writes them. |
| Signing | upload key only | Google holds the app signing key under Play App Signing. |

## Not covered here

**iOS.** The archive flow is macOS-only and the iOS launcher icons are still
Capacitor's placeholder — `tools/icons/` writes Android and web assets only.
See [`OPEN-ITEMS.md`](./OPEN-ITEMS.md).
