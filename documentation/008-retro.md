# Retro 008 — Preparing for the Play Store

Everything between a working app and an uploadable one, except the artwork.

## What was done

### 1. Release signing, with Play App Signing

An upload key was generated and `buildTypes.release` now carries a
`signingConfig`. Closes the oldest open item, raised in 002.

The key is an **upload** key, not the app signing key: Google holds the latter
under Play App Signing, which is the difference between losing the keystore
being an inconvenience and losing it meaning the app can never be updated
again. It lives at `%USERPROFILE%\.android-keystores\paco-upload.jks` with
credentials in the *user* `gradle.properties`, so neither is in the repo — and
neither depends on `android/.gitignore` continuing to ignore `*.jks`.

The guard matters more than the config. Without an upload key Gradle happily
builds an **unsigned** bundle: it compiles, it looks right, and Play rejects it
on upload after the wait. A `taskGraph.whenReady` check now throws at
configuration time when a release task is requested without credentials, while
leaving debug builds alone so a fresh clone still runs `assembleDebug`.

Verified end to end: `jarsigner -verify` reports `jar verified` and
`CN=Paco, O=Musashi, C=NL` against the produced `.aab`.

### 2. One source mark becomes every icon

`tools/icons/generate-icons.mjs` takes a single square SVG or PNG and writes
five density buckets × three shapes, eleven splash canvases, the 512px Play
icon, `public/favicon.svg`, and the ground colour as an XML resource.

Three things it gets right that hand-exporting usually does not:

- **The adaptive foreground is transparent and inset to 66dp.** The launcher
  masks a 108dp canvas down to roughly its centre; artwork with its own baked
  background shows as a square inside a circle, and artwork drawn full-bleed
  gets its edges clipped.
- **The legacy icon carries its own ground.** `minSdkVersion` is 24, so API
  24–25 launchers still draw a flat bitmap with no layers to composite.
- **The ground colour is written, not typed twice.** The PNGs and the XML come
  from one constant, so they cannot disagree.

It refuses to run without a source rather than emitting placeholder art.

### 3. The launch no longer flashes white

The splash was Capacitor's default: their logo on a white field, tearing down
into a near-black app.

The ground turns out to need declaring in three places, because three different
things paint it — `@drawable/splash` before API 31, `windowSplashScreenBackground`
on API 31+ where the system draws its own splash and ignores the drawable, and
`android:windowBackground` for the gap between the splash going away and the web
layer's first paint. Any one missed and the flash survives.

### 4. Store graphics are generated, not exported

`npm run screenshots` drives the built app in headless Chromium at 1080×1920
and captures four listing screenshots. `npm run feature-graphic` renders the
1024×500 banner.

Both use a browser already on the machine via `puppeteer-core`, so nothing
downloads a Chromium. The feature graphic in particular *needs* a browser: it
sets the wordmark in the app's own self-hosted Cinzel woff2, and an image
compositing library would have fallen back to whatever serif the machine had.

The screenshot run seeds `localStorage` directly rather than clicking two lists
into being every time, and blocks `githubusercontent.com` so a capture can
never depend on upstream or on the network.

### 5. Listing copy, privacy policy and Data safety, in the repo

`store/` now holds the app name, both descriptions, the categorisation, the
target-audience answers and every Data safety answer *with its reasoning* —
including why fetching a public URL is not "collection" and why device backup
is not declarable. Copy written straight into a Console form is versioned
nowhere and re-derived from memory every time it changes.

`npm run listing:check` reads each field's character limit out of its own
heading in `store/listing.md` and checks the copy against it.

### 6. Screenshot list names are invented

The first capture used real faction names. The catalogue naming paint brands is
nominative use — a conversion table has to say "Citadel" to be a conversion
table — but a public listing whose screenshots are covered in another company's
faction trademarks is a different thing, and draws complaints against the
listing rather than the app. The seeds are now invented names, and the full
description carries an explicit non-affiliation disclaimer.

## Files changed

### New
- `tools/icons/generate-icons.mjs`, `tools/icons/README.md`
- `tools/store/screenshots.mjs`, `tools/store/feature-graphic.mjs`,
  `tools/store/check-listing.mjs`
- `store/README.md`, `store/listing.md`, `store/privacy-policy.md`
- `store/graphics/` — feature graphic and four screenshots
- `documentation/release-checklist.md`

### Modified
- `android/app/build.gradle` — signingConfig, release guard, `versionName` 1.0.0,
  a note on why R8 stays off
- `android/app/src/main/res/values/styles.xml` — splash and window backgrounds
- `android/app/src/main/res/values/ic_launcher_background.xml` — dark ground
- `index.html` — title now `Paco — Paint Codex`
- `package.json` — `icons`, `screenshots`, `feature-graphic`, `listing:check`;
  `sharp` and `puppeteer-core` as devDependencies
- `README.md`, `documentation/0.1-architecture.md`, `documentation/OPEN-ITEMS.md`

Lint clean, typecheck clean, 90 tests pass, release bundle builds and verifies.

## Decisions taken, not fixed

- **R8 stays off.** This is a Capacitor shell — R8 would shrink a few hundred KB
  of AndroidX next to ~2 MB of web assets, and Capacitor resolves plugins
  reflectively, so a bad keep rule breaks the app *only* in release builds. Bad
  trade for a first release. Recorded in the gradle file so it is not read as an
  oversight.
- **Home-screen label stays `Paco`; the listing title is `Paco - Paint Codex`.**
  Keeps the label short and the package id (`com.musashi.paco`) coherent while
  the listing stays searchable.
- **Target age 13+.** Ticking any under-13 band pulls the app into the Families
  policy and its disclosure requirements, for nothing.
- **`store/graphics/` is committed.** A few megabytes against always knowing
  which assets are live.

## Measured, and found not to be a problem

- **Release bundle size: 5.04 MB.** Dominated by the two background PNGs in
  `public/imagery/` (~1.8 MB combined), not by code. Well inside any Play limit
  and not worth compressing until something else needs the room — which is also
  why R8 buys so little here.

## Open items

See [OPEN-ITEMS.md](OPEN-ITEMS.md). Two new blockers, both waiting on things
outside the code: the app icon needs artwork, and the privacy policy needs a
public URL.
