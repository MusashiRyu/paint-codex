# Retro 019 — One version number, four places, no enforcement on three

Prompted by a question about the `1.0.0` at the bottom of the About sheet: how
is that determined? Tracing it turned up a system that was half-built. The
Android half was solid and enforced. The iOS half was Capacitor's default, said
`1.0` where everything else said `1.0.0`, and nothing would ever have noticed.

## Where the version actually comes from

`android/app/build.gradle` decides it — `versionCode 1`, `versionName "1.0.0"`,
both hand-edited per release. Everything user-visible descends from those two
lines.

The About sheet does not read a constant. `AboutSheet` calls
`CapacitorApp.getInfo()` and shows the *installed package's* version, so on a
device the number is whatever was actually shipped and cannot be stale. The
`1.0.0` in `src/app/config.ts` is only the fallback for the web build, where
there is no native package to ask.

That fallback was already pinned to `build.gradle` by `appVersion.test.ts`, and
the reasoning in that test is the right one: the value shows only on the path
nobody tests on, so nothing but an assertion will catch it going stale.

## What was wrong

The same argument applies twice more, harder, and had not been made:

- `MARKETING_VERSION` was `1.0` in both iOS build configurations, against a
  `versionName` of `1.0.0`. Already drifted, at rest, in the repo.
- `CURRENT_PROJECT_VERSION` was `1`, which happens to match `versionCode 1` —
  by coincidence, not by anything.

Neither can be rendered on this machine, because an iOS build needs a Mac
(OPEN-ITEMS 4). A value nobody can see locally and no test asserts is not a
value, it is a guess that will be discovered by the App Store.

## What was done

`MARKETING_VERSION` is now `1.0.0` in both configurations. `Info.plist` already
reads both settings through `$(MARKETING_VERSION)` and
`$(CURRENT_PROJECT_VERSION)`, so there was nothing to change there.

`appVersion.test.ts` grew from one assertion to four: `versionName` and
`versionCode` are extracted from `build.gradle`, then `APP_VERSION`,
`MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` are each asserted against
them. The pbxproj is matched with `matchAll` rather than `exec` deliberately —
it carries a Debug and a Release configuration today and Xcode adds more when a
scheme is added, so asserting on the first match would let a second
configuration drift silently.

The test was checked by breaking it, not by watching it pass: setting
`MARKETING_VERSION` back to `1.0` and `versionCode` to `2` produced
`expected '1.0' to be '1.0.0'` and `expected '1' to be '2'`, then both edits
were reverted. A pin that has never been seen to fail is not known to be a pin.

## What was deliberately left

`package.json` still says `"version": "0.0.0"`. It is the Vite template's
default and nothing reads it — not the build, not Capacitor, not the store
listing. Adding it to the pinned set would mean one more thing to bump for a
number that appears nowhere. Left alone, and written down here so the next
person who greps `version` does not think it is a bug.

Also unchanged: the two *internal* version counters, which are correctly
unrelated to the release version. `store.ts` has `version: 4` on the persisted
list state with a cumulative `migrate`; `paintCatalogCache.ts` has
`CACHE_VERSION = 1`, which invalidates rather than migrates. Tying either to
the release number would mean a patch release implying a migration.

## Verified

- `npm run lint` — clean.
- `npx tsc -b --noEmit` — clean.
- `npm test` — 12 files, 127 tests (was 124), all passing.
- Both failure modes of the new assertions observed, then reverted.

## Files changed

**New**
- `documentation/019-retro.md`

**Modified**
- `ios/App/App.xcodeproj/project.pbxproj` — `MARKETING_VERSION` `1.0` → `1.0.0`
  in the Debug and Release configurations
- `src/test/appVersion.test.ts` — rewritten; four assertions, pbxproj coverage
- `documentation/release-checklist.md` — step 1 now says to edit `build.gradle`
  and nothing else, with a table of what restates it and when each is shown
- `documentation/0.1-architecture.md` — the `config.ts` and tests rows

## Assumptions made

- **One number for both stores.** `CURRENT_PROJECT_VERSION` is pinned to
  `versionCode` so there is a single integer to bump. iOS and Play count
  uploads independently, so if App Store Connect ever rejects a build number
  that pin is what to reconsider — noted in the checklist rather than solved in
  advance for a store the app has never submitted to.
- **`MARKETING_VERSION` is unquoted in the pbxproj.** `1.0.0` needs no quotes
  there and Xcode writes it bare; if Xcode ever rewrites the file with quotes,
  the test's `([^;]+)` capture will include them and fail loudly rather than
  pass wrongly.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
