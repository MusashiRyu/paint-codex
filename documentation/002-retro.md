# 002-retro

## What was done
- Added explicit Capacitor sync and Android build scripts to support local testing and release packaging.
- Documented the mobile deployment workflow for Android and iOS in the repository README.
- Ignored local Android keystore files so signing material stays out of version control.

## Files changed
- `package.json`
- `README.md`
- `android/.gitignore`
- `documentation/0.1-architecture.md`

## Assumptions made
- Android SDK and Java are configured locally per developer machine rather than hardcoded in tracked Gradle files.
- Release signing material should remain local and not be committed.

## Deferred items
- Release signing config in `android/app/build.gradle` is still pending.
- iOS archive/signing remains a Mac/Xcode workflow.
