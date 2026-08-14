# Retro 030 — Two bugs the first device screenshot found

The app had never run on iOS hardware. Retro 029 closed the release pipeline
and said so explicitly: *"The app has never run on iOS hardware. Unchanged by
any of this. It is what TestFlight is for."*

The first screenshot back from a real iPhone had two faults in it, and both had
been in the repo since the beginning.

1. `PAINT CODEX` was drawn behind `23:17`. The status bar sat on top of the
   title, the two sets of glyphs interleaved, and the app name read as
   `PAIN CODEX`.
2. Rotating the phone rotated the app — into a landscape window the layout was
   never designed for, on both platforms.

## What was wrong

### The web layer fills the screen, and nothing told it to move

Capacitor's iOS `CAPBridgeViewController` sets
`contentInsetAdjustmentBehavior = .never` and gives the WebView the full view
bounds. That is the right default for an app that wants to draw its own
background to the edges, which this one does — but it means the status bar and
the home indicator are painted *on top of* the app, and moving out from under
them is the app's job.

Nothing in the CSS did. There was not a single `env(safe-area-inset-*)` or
`--safe-area-inset-*` anywhere in `src/`, and the meta viewport read
`width=device-width, initial-scale=1.0`.

Which is the actual root cause, and the part worth remembering: **the insets
report zero until the viewport asks for them.** Adding padding without
`viewport-fit=cover` changes nothing on either platform, because `env()`
resolves to `0px` in both. The fix is two halves and only works as a pair.

### Android was already correct, and would have broken on the same commit

Worth reading Capacitor 8's `SystemBars.java` before touching this. It greps
the meta tag — literally, with a JS snippet checking
`metaContent.includes("viewport-fit=cover")` — and branches:

- **Without** `viewport-fit=cover`: it pads the WebView's *parent view* by the
  system bar insets and injects `--safe-area-inset-*: 0px`. The app is letterboxed
  and nothing overlaps. This is what Android was doing, which is why the bug
  was reported as an iOS bug.
- **With** it, on WebView 140+: it passes the insets through, the WebView goes
  edge to edge, and the real values are injected.

So adding the meta tag on its own would have *introduced* the overlap on
Android while fixing it on iOS. The CSS half is not a refinement of the meta
tag half; each without the other is a regression on one platform.

The two platforms then report the inset by different routes — Android sets
custom properties on `<html>`, iOS injects nothing and leaves `env()` as the
only source — so each token reads both, in order:

```css
--inset-top: var(--safe-area-inset-top, env(safe-area-inset-top, 0px));
```

The `0px` tail is not cosmetic. These land inside `calc()`, which rejects a
bare `0` as a length and drops the whole declaration.

### An absolutely positioned element does not move for its parent's padding

The obvious fix — one `padding` on `.card` — moves the header and does nothing
to the FAB or the sheets, because an absolutely positioned element resolves its
offsets against the containing block's **padding box**, and padding does not
shrink the padding box. The FAB would have stayed exactly where it was, over
the home indicator, in a card that had visibly moved everything else.

So four consumers spend the inset individually: the header's top padding, the
FAB's `bottom` offset, the list's bottom padding (the FAB's landing zone, which
has to rise with it or the button lands back on the last paint), and the
sheets' bottom padding. The sheets keep their *ground* at `bottom: 0` on
purpose — the sheet colour should still run under the home indicator; only the
content inside it should not.

### The orientation lock was two lines that had never been written

Capacitor's Android template sets no `android:screenOrientation` at all, so the
default is sensor-driven. Its iOS template ships all three portrait/landscape
entries. Neither had been touched.

Both are now declared, and both are asserted, because they are values to *hold*
rather than to set once: a `cap add ios` on a fresh clone would restore the
landscape entries, and an Android Studio dialog can rewrite the manifest.

`android:configChanges` keeps `orientation` in its list even though the
activity can no longer rotate. It is not redundant — it is what stops the
activity being recreated on the config changes it still receives, and a
recreation reloads the WebView, losing an open sheet and whatever was typed
into the search.

## The check that passed while the app was broken

`npm run check:layout` drives a real Chromium across seven widths and five
surfaces, and reported **all 35 combinations clean** on the build that shipped
this bug.

It was not being lax. A desktop Chromium has no notch to report, so every inset
it resolves is `0px`, so the broken layout and the fixed one are pixel-identical
under it. The check could not have caught this, at any width, with any extra
rule of the kind it already had — the information simply was not present in the
environment.

The fix was to stop sampling the insets and start **injecting** them: set the
custom properties Capacitor would have set, then assert every consumer moved by
the amount it was given. Deltas rather than pixel values, so the check survives
a change to the gutter or the FAB offset.

Confirmed both ways before being trusted. With the fix reverted in the built
CSS, the new pass reports:

```
Safe area: FAIL
         inset-ignored: app title moved 0px for a 59px inset (22 -> 22)
```

Which is the reported bug, in the words of a check, on a machine with no phone
attached.

Three cheap string assertions back it up, because the browser check has a hole
it cannot close: it injects the custom properties directly, so it passes
whether or not the meta tag ever asked for real ones. `androidShell.test.ts`
asserts `viewport-fit=cover` in `index.html`, the portrait lock in the
manifest, and that both tokens still read both sources; `iosProject.test.ts`
gains the matching `UISupportedInterfaceOrientations` assertion.

## What this did not fix

- **The insets are still unverified on hardware.** Everything above was proven
  against injected values on a desktop Chromium. The numbers used are an
  iPhone 15 Pro's, and the arithmetic is a delta, so a device that reports
  something else is still handled — but the first real confirmation is the next
  TestFlight build.
- **Left and right insets have no tokens.** Correct while both platforms are
  locked to portrait, where those are always zero. Landscape would need them,
  and would need a great deal more than them.
- **Android 16 ignores the portrait lock on large screens.** The app targets
  SDK 36, and displays 600dp and wider rotate regardless. A foldable opened
  flat will show the landscape window this retro is about. Phones-only for now,
  and the platform's call to make.
- **Nothing else has been seen on an iPhone.** One screenshot found two bugs
  that had survived twenty-nine retros. That ratio is the argument for getting
  the next build onto the device rather than for assuming these were the last
  two.
