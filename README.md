# Paco — Paint Codex

A paint conversion table and list keeper for miniature painters. Look up a
paint and Paco shows the closest equivalents in the other brands, ranked by a
measured colour distance rather than by a guess; keep the results in named
lists you build yourself.

2,279 paints across every range Citadel, Vallejo and The Army Painter sell. The
whole catalogue ships in the app, so it works with the radio off — the only
network request it ever makes is a silent check for a newer catalogue at
launch, and failing that check changes nothing a user can see.

React 19 + TypeScript + Vite, wrapped for Android and iOS with Capacitor.
State is Zustand persisted to localStorage; styling is CSS Modules over a token
layer; search is Fuse.js. There is no backend, no account and no analytics.

## Getting started

```bash
npm install
npm run dev          # Vite dev server
npm test             # Vitest
npm run lint         # oxlint
npm run build        # tsc -b && vite build
npm run check:layout # layout invariants at 7 phone widths, in a real browser
```

`check:layout` needs `npm run build` first — it drives `dist/`. It exists
because jsdom has no layout engine: the IN LIST badge wrapping onto its own
line on a 412px phone, but not a 390px one, passed all 128 unit tests. See
[tools/layout/check-layout.mjs](tools/layout/check-layout.mjs).

Documentation lives in [documentation/](documentation/):
[0.1-architecture.md](documentation/0.1-architecture.md) is the component table
and the conventions, [0.2-design-system.md](documentation/0.2-design-system.md)
is the token and primitive layer, `NNN-retro.md` is one file per work session,
and [OPEN-ITEMS.md](documentation/OPEN-ITEMS.md) is the single list of known
outstanding work.

## Linting

`.oxlintrc.json` runs oxlint's default `correctness` set plus the `react`,
`typescript`, `oxc` and `jsx-a11y` plugins. Four `jsx-a11y` rules are switched
off, each with its reason written next to it in that file — autofocus into a
sheet's own input, the backdrop's click-to-dismiss, and `role="dialog"` over a
native `<dialog>`. Nothing else is disabled, and the run must be clean.

The wider categories (`pedantic`, `restriction`, `perf`) are deliberately not
enabled: on this codebase they report the automatic JSX transform as a missing
`React` import, the scraper's deliberately paced sequential fetches as a
performance bug, and every explanatory inline comment as a style violation.
A linter that has to be ignored is not a linter.

Two `no-restricted-imports` rules in the same file enforce the one structural
boundary that matters: `tools/` may not import app code and `src/` may not
import build tooling, with a single sanctioned exception for the shared
catalogue parser.

## Feature Flags

Application feature toggles live in [src/app/config.ts](src/app/config.ts).

- `featureFlags.markdownExport` — shows or hides the "Export list" download action in the list header. **Currently `false`.** The export logic itself (`src/features/export/markdownExport.ts`) stays in place and tested; only the UI entry point is gated.
- `featureFlags.supportLink` — shows or hides the support section in the About sheet. **Currently `true`.**

Every URL the app can send someone to lives beside them in `appConfig.links`.
Outbound links go through `EXTERNAL_LINK_PROPS`
([src/shared/lib/externalLink.ts](src/shared/lib/externalLink.ts)) — `target="_blank"`
is what makes the Android WebView hand a URL to the system browser, and without
it the page loads *inside* the app.

## Credits

The original **Paint Codex** design — the dark-fantasy grimoire look this app is
built on — is by [Lukas Stordeur](https://github.com/LukasStordeur). The gold
palette, the Cinzel/EB Garamond pairing and the card-on-texture layout all come
from that design; the token layer in `src/shared/styles/tokens.css` is an
extraction of it, not an invention.

Paint data comes from
[Arcturus5404/miniature-paints](https://github.com/Arcturus5404/miniature-paints)
(MIT), the colour database scraped and published by the
[Miniature Painter Pro](https://miniaturepainterpro.app/) team. Paco reads the
Citadel, Vallejo and Army Painter tables — 2,279 paints across every range each
brand sells. One colour sold under several range names is one entry listing all
of them, not one entry per label.

Equivalents are computed here rather than taken from upstream, which ships
colour only. See [documentation/0.1-architecture.md](documentation/0.1-architecture.md#paint-catalogue)
for how, and why the ΔE metric is the one it is.

Earlier releases used [redgrimm](https://github.com/redgrimm/paint-conversion)'s
conversion table, which carried 310 paints.

## Design system

Every colour, radius, type size, tracking and shadow lives in
[src/shared/styles/tokens.css](src/shared/styles/tokens.css). The rule: a raw
value may appear in a component stylesheet only if it is used exactly once —
the moment it turns up in a second file it becomes a token.

The shared UI primitives — `Sheet`, `Pill`, `Badge`, `IconButton`,
`GoldButton`, `GhostButton`, `TextField`, `Swatch` — live in
[src/shared/ui/](src/shared/ui/). Chrome belongs there, never in a feature
stylesheet.

The full system, including what is deliberately *not* tokenised, is in
[documentation/0.2-design-system.md](documentation/0.2-design-system.md).

## Fonts

Cinzel and EB Garamond are **self-hosted**, not loaded from Google Fonts. The
packaged Capacitor app has no network guarantee, so a CDN link would mean the
typography silently falls back to a system serif offline — and would disclose
the device IP to a third party on every launch, for an app that otherwise
contacts nobody.

The files live in `public/fonts/` and are declared in
`src/shared/styles/fonts.css`. To change the family list, edit the Google Fonts
URL in `tools/fonts/vendor-fonts.mjs` and re-run it; it downloads the woff2
files and regenerates the `@font-face` rules.

## Continuous Integration

`.github/workflows/ci.yml` runs lint, typecheck, tests, a production build and
the layout check on every push and pull request. To reproduce it locally:

```bash
npm run lint && npx tsc -b --noEmit && npm test && npx vite build && npm run check:layout
```

## Mobile Deployment (iOS + Android)

This project is wrapped with Capacitor and includes native projects in `ios/` and `android/`.

### 1) Build and sync web assets

```bash
npm run cap:build
```

This runs a production Vite build and syncs `dist/` into both native projects.

### 2) Android release flow

Prerequisites:
- **JDK 21** installed — `JAVA_HOME` does not have to point at it
- Android Studio SDK + build tools installed

> **The JDK is resolved per build, not read off the shell.** The
> `android:build:*` scripts go through `tools/android/gradle.mjs`, which asks
> each candidate JDK what version it is and launches the Gradle wrapper on the
> first one this Gradle accepts (17–24, preferring 21). It looks at
> `PACO_JDK_HOME`, then `JAVA_HOME`, then the persisted machine value, then the
> usual install roots — so a shell whose environment block predates `JAVA_HOME`
> being set still builds, and Android Studio's bundled JBR is skipped rather
> than picked.
>
> That JBR is why any of this exists: it ships Java 25, and the Gradle wrapper
> pinned here (8.14.3) rejects it with `Unsupported class file major version
> 69`. A build can appear to succeed on Java 25 while Gradle reuses cached
> compiled build scripts, then fail as soon as a dependency change forces a
> recompile. Set `PACO_JDK_HOME` to override the search.

Build commands:

```bash
# optional local verification
npm run android:build:debug

# Play Store artifact (.aab)
npm run android:build:release
```

Release artifact path:
- `android/app/build/outputs/bundle/release/app-release.aab`

Debug artifact path:
- `android/app/build/outputs/apk/debug/app-debug.apk`

Install on a connected device:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Notes:
- **Release signing is configured.** The upload key lives outside the repo at
  `%USERPROFILE%\.android-keystores\paco-upload.jks`, with credentials in
  `%USERPROFILE%\.gradle\gradle.properties`. A machine without them still builds
  debug, but a release build fails at configuration time rather than quietly
  producing an unsigned bundle.
- Bump `versionCode` / `versionName` in `android/app/build.gradle` for each release.
- The gradle scripts no longer invoke `gradlew.bat` at all: `tools/android/gradle.mjs`
  launches `gradle-wrapper.jar` with the JDK it resolved. That also sidesteps
  `NoDefaultCurrentDirectoryInExePath=1` (Git for Windows sets it), which stops
  `cmd.exe` resolving executables in the working directory and used to make the
  bare `gradlew.bat` name fail in both PowerShell and Git Bash.

The full submission path — Play Console setup, the every-release sequence, and
the settings that are deliberate rather than accidental — is in
[documentation/release-checklist.md](documentation/release-checklist.md).

## Store assets

Generated from source, never hand-exported, so they cannot drift from the app.

```bash
npm run icons             # launcher icons, splash, 512px Play icon, favicon
npm run build             # screenshots serve dist/, they do not build it
npm run screenshots       # 1080x1920 phone screenshots, driven through the real app
npm run feature-graphic   # 1024x500 listing banner
npm run listing:check     # store copy against Play's character limits
```

`npm run icons` regenerates everything from the mark at
`tools/icons/source/icon.svg` — Android launcher icons and splashes, the iOS
app icon and launch image, the Play listing icon and the favicon. See
[tools/icons/README.md](tools/icons/README.md). Edit that one file rather than
any generated PNG.

`npm run screenshots` writes two sets from one capture sequence: 1080×1920 into
`store/graphics/screenshots/` for Play and 1290×2796 into
`store/graphics/screenshots-ios/` for the App Store. Both stores show the same
app, so there is one sequence rather than one per store.

Screenshots go stale silently: they are captured from the built app, so a UI
change invalidates them and nothing complains. Re-run `npm run screenshots`
after any visual change that reaches a captured screen — and *look at them*, as
two of the capture steps use `?.click()` and would no-op silently if a selector
stopped matching. A run that exits zero is not proof.

Every browser-driven tool shares one launcher, `tools/lib/browser.mjs`, which
tries each candidate until one launches: `CHROME_PATH` if set, then Chrome, then
a Chromium in Playwright's shared cache, then Edge. If none start it prints each
candidate with why — `absent` reads very differently from `exists, but did not
start`, and only one of them means you need to install something.

Listing copy for both stores, the Data safety and App Privacy answers and the
privacy policy text are in [store/](store/).

### 3) iOS release flow

Prerequisites (macOS only):
- Xcode installed
- Apple Developer Program membership (US$99/yr) and a Team selected in Xcode

```bash
npm ci
npm run cap:ios      # vite build + cap sync + open Xcode
```

Then in Xcode: target `App` → Signing & Capabilities → tick **Automatically
manage signing** and pick the Team → set the run destination to **Any iOS
Device (arm64)** → Product → Archive → Validate, then Distribute.

`npm run cap:ios` is not optional on a fresh clone. `ios/App/App/public` is
gitignored, so a clone has an Xcode project with no web app inside it until a
build and sync have run. There is **no `pod install`** — this project uses Swift
Package Manager (`ios/App/CapApp-SPM/`), not CocoaPods.

Everything that does not need a Mac is already committed: the app icon and
splash come from the same source mark as Android's, `Info.plist` answers the
export-compliance question and asks for `arm64`, the privacy manifest is wired
into the target, and the listing copy and 1290×2796 screenshots are in
[store/](store/). `src/test/iosProject.test.ts` asserts the ones that would
otherwise regress unnoticed, since nothing on Windows compiles Swift.

The full submission path — Apple Developer enrolment, the bundle ID, App Store
Connect, TestFlight, and the settings that are deliberate rather than
accidental — is in
[documentation/ios-release-checklist.md](documentation/ios-release-checklist.md).

### 4) Useful Capacitor commands

```bash
# Sync native platforms without rebuilding web
npm run cap:sync

# Open native projects
npm run cap:android
npm run cap:ios
```

### 5) Native plugins

- `@capacitor/app` — required for Android hardware/gesture back handling.
  Capacitor core registers no back handler of its own, so without this plugin
  the back gesture finishes the activity and closes the app even when an
  overlay is open. Consumed via `src/shared/hooks/useBackDismiss.ts`.

Adding or removing a plugin requires a `npm run cap:sync` so the native
projects pick it up.
