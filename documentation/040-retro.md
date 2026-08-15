# Retro 040 — The keyboard was being paid for twice

A screenshot from the Galaxy S9: the search sheet open, the keyboard up, and
between them nothing. A sliver of `SEARCH PAINTS` under the status bar, the
close ✕ beside it, and then black all the way down to the number row. The same
flow on a Galaxy S22 is fine. iOS is fine. The browser is fine.

One device, one moment, and the whole app gone.

## What the screenshot already said

The black is not the app's. Every surface the app paints — the page ground, the
card, the sheet — carries a background image and a gradient over it; none of
them is flat black. Flat black is `splash_background`, the window behind the
web view. So the web view was not covering the space, and since the card is
`height: 100%` of `#root` of `body` of `html`, the card cannot be shorter than
the web view. The web view itself had collapsed.

By how much is measurable off the image. The S9 is 360 CSS px wide at density
3, so its viewport is ~740px tall and the keyboard in the shot takes the bottom
~353. The header strip that survives sits about 20–33px below the top of the
window, and the sheet is `height: 88%` anchored to the bottom of the card: a
card ~34px tall puts its header exactly there. 740 − 353 − 353 ≈ 34.

The keyboard had been subtracted twice.

## Both subtractions, and why only old phones see both

The first is Capacitor's. `SystemBars.initWindowInsetsListener` pads the web
view's *parent* by the IME inset whenever the keyboard is visible — that is the
plugin making room for the keyboard, and on Android 15+ it is the only thing
that does. An app targeting SDK 35 is edge-to-edge, and an edge-to-edge window
is never resized for the IME.

The second is Android's. Below 15 the platform still honours
`windowSoftInputMode`, and the default resizes the window. Nothing tells the
plugin this has happened, so it pads a view that has already shrunk, and the
same 353px comes out twice.

That is the whole difference between the two phones. Not the WebView version,
not One UI, not the age of the hardware: the S22 is on an Android that stopped
resizing windows, the S9 is on one that still does. Every device below Android
15 has this bug, and this app has never been on one until now.

It is upstream as
[capacitor#8466](https://github.com/ionic-team/capacitor/issues/8466), reported
against 8.3.x on API 29 with an ~867px padding and a web view left at "roughly
6% of expected height". 8.5.0 fixed the half of that report about
`insetsHandling: 'disable'` being ignored — the guard is in the installed
source — and left the double subtraction alone, because from the plugin's side
it is not wrong.

## The fix is to stop resizing the window

`android:windowSoftInputMode="adjustNothing"` on the activity. The window is
left alone on every Android version, the plugin's padding becomes the single
adjustment everywhere, and old phones start behaving like new ones instead of
the other way round.

The inset still reaches the plugin with the window frozen. On API 30+ the IME
insets are dispatched whatever the adjust mode — `adjustNothing` suppresses the
automatic resize, not the reporting. On API 29 there are no real IME insets at
all and androidx synthesises one, and the branch it lands on is the reason this
works: `WindowInsetsCompat.Impl20` falls back to the root view's *visible*
insets, which track whatever covers the window — including a keyboard the
window was never resized for.

Three alternatives were considered and dropped:

- **`insetsHandling: 'disable'`** turns off the padding, which fixes the S9 by
  making Android's resize the only subtraction — and breaks every Android 15+
  device, where nothing resizes and the keyboard would simply cover the sheet.
  It also takes the safe-area injection with it.
- **`adjustPan`** stops the double subtraction too, by sliding the whole window
  up instead. The header leaves the screen and the layout is no longer where it
  says it is.
- **`@capacitor/keyboard` plus a CSS variable** moves the whole problem into
  the web layer, where it would then have to detect whether the native side had
  already resized to avoid subtracting twice again. A new dependency and a
  timing heuristic to solve what one manifest attribute solves.

## What is inference, and what it costs if it is wrong

The mechanism is established: the arithmetic, the upstream report on the same
API level, and the plugin source in `node_modules`. What is inferred is the
API 29 half of the fix — that the visible-insets fallback still yields the
keyboard height once the window stops resizing. On API 30+, which is every
Android device newer than this one, the reporting is documented and not in
doubt.

If that inference is wrong, the plugin pads by zero and nothing adjusts: the
sheet stays full height and the keyboard covers its lower half. The search
field sits at the top of a `tall` sheet and stays visible; the results scroll.
That is a worse keyboard experience on one legacy device, not a black screen —
so the failure mode of being wrong here is bounded, which is why this shipped
without a diagnostic build first.

## Files changed

**Modified**

- `android/app/src/main/AndroidManifest.xml` — `windowSoftInputMode="adjustNothing"`,
  with the double-subtraction mechanism written down beside it.
- `src/test/androidShell.test.ts` — asserts the attribute. It is one word, in a
  file Android Studio also writes to, and nothing between here and a phone
  reads it.
- `documentation/0.1-architecture.md` — a Native row for the soft keyboard.

**New**

- `documentation/040-retro.md` — this file.

## Assumptions made

- The S9 is on Android 10 (API 29), the last version Samsung shipped for it.
  Anything from API 24 to 34 has the same bug and takes the same fix; only the
  inset-reporting argument above is version-specific.
- No version bump. Nothing here is store-facing yet and the check on device is
  the keyboard itself, which is unambiguous. 1.2.3 / versionCode 7 stands until
  a release is cut.

Outstanding work is in [OPEN-ITEMS.md](./OPEN-ITEMS.md), including this fix,
which is unverified on hardware.
