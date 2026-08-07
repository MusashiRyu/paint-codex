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

- Set `featureFlags.markdownExport` to `true` or `false` to enable or disable Markdown export UI.

## Mobile Deployment (iOS + Android)

This project is wrapped with Capacitor and includes native projects in `ios/` and `android/`.

### 1) Build and sync web assets

```bash
npm run cap:build
```

This runs a production Vite build and syncs `dist/` into both native projects.

### 2) Android release flow

Prerequisites:
- JDK 17+ installed
- `JAVA_HOME` set
- Android Studio SDK + build tools installed

Build commands:

```bash
# optional local verification
npm run android:build:debug

# Play Store artifact (.aab)
npm run android:build:release
```

Release artifact path:
- `android/app/build/outputs/bundle/release/app-release.aab`

Notes:
- Configure signing in `android/app/build.gradle` (release signingConfig) before store upload.
- Bump `versionCode` / `versionName` in `android/app/build.gradle` for each release.

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
