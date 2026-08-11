# Retro 027 — 1.1.0, and the number that cannot be reused

A build for the store, not a change to the app. The work being shipped is retros
021–026; this one records the version bump and the artifacts.

## What was done

### The bump

`versionCode` 1 has been used. Retro 025 wrote that down at the time —
"`versionCode` stays 1; it has now been used and the next upload has to increase
it" — and the release checklist's status section says where: internal *and*
closed testing, 2026-08-10. Play rejects a reused code and there is no way to
reclaim a number, so the first thing this session did was read that, not build.

| | Was | Now |
| --- | --- | --- |
| `versionCode` | 1 | 2 |
| `versionName` | 1.0.0 | 1.1.0 |

**1.1.0 rather than 1.0.1.** What ships is a feature — a paint's row opens its
equivalents, and equivalent tiles now report list membership — not a fix to
1.0.0. The checklist's own example (`1.0.0` → `1.0.1`) is an illustration of the
edit, not a policy.

Four files restate those two numbers, and `src/test/appVersion.test.ts` pins all
of them to `build.gradle`, so a half-done bump fails the verify step instead of
shipping:

- `android/app/build.gradle` — the source of truth
- `APP_VERSION` in `src/app/config.ts` (web build's About sheet)
- `MARKETING_VERSION`, both iOS configurations
- `CURRENT_PROJECT_VERSION`, both iOS configurations

The iOS pair are the easy ones to forget — they cannot be built on this machine,
so nothing here ever renders them. The test is the only thing that looks.

### The artifacts

| Artifact | Size | Purpose |
| --- | --- | --- |
| `android/app/build/outputs/bundle/release/app-release.aab` | 5.15 MB | The Play upload |
| `android/app/build/outputs/apk/release/app-release.apk` | 5.3 MB | Hardware smoke test — an `.aab` cannot be installed |

Both from one `npm run cap:build` — Gradle packages whatever is already in
`android/app/src/main/assets/public` and does not build the web app, so skipping
that step ships a bundle that runs perfectly while omitting the release.

### How it was verified

Not by trusting the task graph:

- `npm run lint`, `npx tsc -b --noEmit`, 147 tests — the checklist's step 2, and
  what CI runs.
- `jarsigner -verify -verbose:summary -certs` on the `.aab` → `jar verified.`,
  `CN=Paco, O=Musashi, C=NL`.
- `apksigner verify --print-certs` on the APK → the same DN. The two tools are
  not interchangeable: `jarsigner` only understands v1 JAR signing and calls a
  v2/v3-signed APK unsigned, which is why the checklist names one tool per
  artifact.
- `aapt2 dump badging` → `versionCode='2' versionName='1.1.0'`, read out of the
  built APK rather than off the gradle file that was edited.
- The `.aab`'s own `base/assets/public/assets/` unzipped and grepped: it carries
  `Show equivalents for` and `minmax(136px`, so the bundle really holds this
  session's web build.

## Files changed

**New**
- `documentation/027-retro.md`

**Modified**
- `android/app/build.gradle` — `versionCode` 2, `versionName` 1.1.0
- `src/app/config.ts` — `APP_VERSION`
- `ios/App/App.xcodeproj/project.pbxproj` — both configurations, both values
- `documentation/release-checklist.md` — the status section

## Assumptions made

- **The store listing needs no edit.** Nothing changed about what the app is,
  its categorisation, its data-safety answers or its screenshots — `02-search.png`
  was already re-rendered against the new tile grid in 023. If the release notes
  for the track should mention the row tap, that is Console text, not a repo
  file.
- **iOS keeps sharing the number.** `CURRENT_PROJECT_VERSION` is pinned to
  `versionCode` so there is one number to bump. iOS and Play count uploads
  separately, so if App Store Connect ever rejects a build number, that pin is
  the thing to reconsider — not the bump.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
