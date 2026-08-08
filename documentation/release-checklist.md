# Android release checklist

The end-to-end path from a clean checkout to a build live on Google Play.
Store *copy* lives in [`store/listing.md`](../store/listing.md); this file is
the mechanics.

---

## Blocking before the first submission

### 1. The privacy policy needs a public URL

Play requires one for every app, including apps that collect nothing. The page
is written, accurate and built: `npm run privacy` renders
[`store/privacy-policy.md`](../store/privacy-policy.md) into
`docs/privacy.html`, a single self-contained file with no external stylesheet,
font or script. It will work on any host.

What is missing is a host. Three options, in the order they make sense here:

1. **GitHub Pages.** Free and permanent, and it solves two other things at the
   same time — see the note below.
2. **An owned domain.** Most durable, depends on nobody.
3. **Google Sites.** No repo, no code, accepted by Play. The fallback.

Then: Play Console → App content → Privacy policy.

> **This repo has no git remote, and two GitHub Actions workflows that have
> therefore never run.** `ci.yml` has never verified a commit, and
> `upstream-check.yml` — described in the architecture doc as *the alarm for
> the silent refresh* — has never armed. That alarm matters considerably more
> once real users are on the catalogue refresh, because the refresh is silent
> by design: a markup change upstream would otherwise strand every install on
> its bundled snapshot with no signal at all. Pushing to GitHub fixes the
> policy hosting, CI and the alarm in one move.

**Do not use a privacy-policy generator site to host it.** They produce
boilerplate asserting analytics, cookies and third-party sharing this app does
not do, and Play cross-checks the policy against the Data safety answers. A
contradiction there is a rejection risk. The accurate text already exists; only
hosting is missing. Also avoid Gists, Notion pages, expiring drag-and-drop
hosts, and PDFs — Play wants a live page, publicly reachable without a login
and not publicly editable.

---

## One-time Play Console setup

1. **Create the app.** Name `Paco - Paint Codex`, English (United States) as
   the default language, App (not Game), Free.
2. **Enrol in Play App Signing.** Accept the default: Google generates and
   holds the app signing key, and the keystore on this machine is only the
   *upload* key. This is why losing the local keystore is recoverable — support
   can reset an upload key, and could never reset an app signing key.
3. **Work through App content.** Privacy policy URL, ads declaration, app
   access, content rating questionnaire, target audience, data safety, and the
   government/financial/health declarations. Every answer is written out in
   [`store/listing.md`](../store/listing.md).
4. **Upload the graphics.** Icon, feature graphic and screenshots, all from
   `store/graphics/`. Regenerate rather than hand-editing:

   ```bash
   npm run icons             # needs tools/icons/source/icon.svg
   npm run build
   npm run screenshots
   npm run feature-graphic
   ```
5. **Set up a closed test track first.** Google requires a period of closed
   testing on a new personal developer account before production access opens
   up. Starting that early costs nothing and it is on the critical path.

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
