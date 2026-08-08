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
- Configure signing in `android/app/build.gradle` (release signingConfig) before store upload.
- Bump `versionCode` / `versionName` in `android/app/build.gradle` for each release.
- The gradle scripts invoke `.\gradlew.bat` rather than `gradlew.bat`. Windows
  environments that set `NoDefaultCurrentDirectoryInExePath=1` (Git for Windows
  does this) stop `cmd.exe` from resolving executables in the working directory,
  so the bare name fails in both PowerShell and Git Bash.

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
