# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Feature Flags

Application feature toggles live in [src/app/config.ts](src/app/config.ts).

- `featureFlags.markdownExport` — shows or hides the "Export list" download action in the list header. **Currently `false`.** The export logic itself (`src/features/export/markdownExport.ts`) stays in place and tested; only the UI entry point is gated.

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
Citadel, Vallejo and Army Painter tables — 2,422 paints across every range each
brand sells.

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

`.github/workflows/ci.yml` runs lint, typecheck, tests and a production build
on every push and pull request. To reproduce it locally:

```bash
npm run lint && npx tsc -b --noEmit && npm test && npx vite build
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
- **JDK 21** installed and `JAVA_HOME` pointing at it
- Android Studio SDK + build tools installed

> **Do not use Android Studio's bundled JBR.** It ships Java 25, and the Gradle
> wrapper pinned here (8.14.3) rejects it with
> `Unsupported class file major version 69`. A build can appear to succeed on
> Java 25 while Gradle is reusing cached compiled build scripts, then fail as
> soon as a dependency change forces a recompile. Use JDK 21, e.g.
> `JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot`.

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
- The gradle scripts invoke `.\gradlew.bat` rather than `gradlew.bat`. Windows
  environments that set `NoDefaultCurrentDirectoryInExePath=1` (Git for Windows
  does this) stop `cmd.exe` from resolving executables in the working directory,
  so the bare name fails in both PowerShell and Git Bash.

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
`tools/icons/source/icon.svg` — see [tools/icons/README.md](tools/icons/README.md).
Edit that one file rather than any generated PNG.

Screenshots go stale silently: they are captured from the built app, so a UI
change invalidates them and nothing complains. Re-run `npm run screenshots`
after any visual change that reaches a captured screen.

Listing copy, the Data safety answers and the privacy policy text are in
[store/](store/).

### 3) iOS release flow

Prerequisites (macOS only):
- Xcode installed
- Apple Developer account and signing certificates/profiles

Open project:

```bash
npm run cap:ios
```

Then in Xcode:
- Select target `App`
- Set Team and Signing
- Set bundle version/build numbers
- Product > Archive, then distribute via App Store Connect

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
