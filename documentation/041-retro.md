# Retro 041 — The S9 answered, and it said half

Retro 040 shipped a one-word manifest attribute against a black screen, and
ended by naming exactly what it did not know: whether API 29 would still report
the keyboard's height once the window stopped resizing for it. Two outcomes
were written down in advance. The phone picked the second one.

## What the phone showed

Open search on the Galaxy S9 and type. The app is there — full sheet, full
height, the header and the search field and the results all drawn on the
backgrounds they are supposed to be drawn on. The ~34px strip is gone and so is
the black under it.

The sheet does not shrink for the keyboard. It stays at its full `88%` and the
keyboard sits over its lower half.

So the fix did what it was for and did not do the thing that was inferred.

## The half that was established

The double subtraction is real and `adjustNothing` stops it. That was never the
uncertain part: the arithmetic came off the screenshot, the upstream report
([capacitor#8466](https://github.com/ionic-team/capacitor/issues/8466)) is the
same symptom on the same API level, and the plugin source in `node_modules`
shows `initWindowInsetsListener` padding the web view's parent unconditionally.
The window is no longer resized, the plugin's padding is the single adjustment,
and the web view is the size of the window on every Android version.

## The half that was inference, and it was wrong

Below API 30 there are no real IME insets. 040 argued the keyboard height would
still arrive, because androidx's `WindowInsetsCompat.Impl20` falls back to the
root view's *visible* insets — and those track whatever covers the window,
including a keyboard the window was never resized for.

The phone says it does not. With the window frozen the plugin pads by zero.

The likeliest reading is that "visible insets" on API 29 is
`View.getWindowVisibleDisplayFrame`, which is derived from the window's own
frame — and freezing the frame is precisely what `adjustNothing` does. The
fallback was reading the same quantity the fix had just pinned. That reading is
not worth more confidence than the last one, which is why it is written here as
an explanation rather than as the basis of a second attempt.

**This is the interesting part and it is worth naming.** The fix removed the
mechanism its own inset argument depended on. Not a wrong lookup or a missed
version guard: two halves of one change, each sound alone, in tension in a way
that reading either half does not show. A diagnostic build would have caught it;
040 decided against one because the failure mode was bounded, and the failure
mode was in fact bounded.

## What is left, and why nothing is being changed

The search field sits at the top of a `tall` sheet and stays visible. Typing
works, results render, and the ones under the keyboard scroll into view when it
is dismissed. That is a worse keyboard on Android 10 than on Android 15, and it
is the trade 040 priced: a worse keyboard on one legacy device against a black
screen on every device below Android 15.

Nothing changes above API 29. IME insets are dispatched for real from API 30
whatever the adjust mode, which is every Android device newer than this one,
and both the S22 and iOS behave exactly as before.

The remaining fix is `@capacitor/keyboard` plus a CSS variable, and half of
040's objection to it has expired — there is no longer a native resize to
detect and avoid double-counting, so the timing heuristic that made it ugly is
gone. The dependency is not gone, both store privacy answers quote this app's
dependency count, and the case for adding one is one phone on an API level
Capacitor may fix upstream anyway. So it stays a raised concern in
[OPEN-ITEMS.md](./OPEN-ITEMS.md), promotable if a second phone reports it.

No version bump. `versionCode` 8 is the build that was tested and it is still
the build to upload; nothing here changes a byte that reaches a device.

## Files changed

**Modified**

- `documentation/OPEN-ITEMS.md` — the unverified-fix item is closed; what the
  phone showed is a raised concern.
- `documentation/0.1-architecture.md` — the Soft keyboard Native row claimed
  the inset still arrives on API 29. It does not.
- `documentation/release-checklist.md` — the `versionCode` 8 smoke test has
  been run; recorded with its result.
- `android/app/src/main/AndroidManifest.xml` — comment only, same correction as
  the architecture row. The attribute is unchanged.

**New**

- `documentation/041-retro.md` — this file.

## Assumptions made

- The S9 is on Android 10 (API 29). Unverified in the console, carried over
  from 040, and it is the last version Samsung shipped for that phone. If it is
  actually on API 30+ then the inset argument fails for a different reason than
  the one above and the conclusion — no inset, sheet unshrunk — is unchanged.
- No release APK was built. Nothing in this session reaches a device: four
  markdown files and one XML comment, which `aapt2` strips before the manifest
  is packaged.

Outstanding work is in [OPEN-ITEMS.md](./OPEN-ITEMS.md).
