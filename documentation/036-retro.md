# Retro 036 — The search sheet left iOS zoomed in

Reported from the device: open search, close it, and the app is zoomed in and
drags around under a finger in both axes. Double-tapping sometimes puts it
back.

Every detail in that report names the cause. A view that pans in both axes has
a scale above 1. Double-tap is WKWebView's own zoom-toggle gesture, which
*sometimes* lands back on 1.0 — that "sometimes" is the tell that the scale is
real rather than a layout that grew.

## What it was

iOS zooms the web view in when a text input whose computed `font-size` is under
16px takes focus, so the field is legible without pinching. It does not zoom
back out when the field blurs. That is the whole bug.

Two things turned it from a rarely-seen annoyance into "open the sheet, close
the sheet":

- **Every input in the app is under 16px.** The search field is `--size-xl`,
  15px. The edit-in-place rename is `--size-md`, 13px. The type ladder tops out
  at 20px for the app title, and body is 15px on a 390px card — the scale was
  designed for the card, and 16px is not a size in it below the sheet titles.
- **`PaintSearch` autofocuses.** The field takes focus on mount, so the zoom
  fires on open, with no tap. Closing the sheet unmounts the input, which blurs
  it and changes nothing — the scale had already been committed.

Closing the sheet then left the app at the same scale with no visible input to
blame, which is why the report reads as "the view" rather than "the search
box".

## The fix, and the one not taken

`index.html` now pins the scale:

```
minimum-scale=1.0, maximum-scale=1.0, user-scalable=no
```

The obvious alternative was to raise inputs to 16px, which fixes the cause
rather than suppressing the symptom. It was not taken, and the reason is the
13px field. `TextField`'s `inline` variant *replaces a display-face label in
place* — it is Cinzel at `--size-md` with tracking, sized to sit where the list
name was. At 16px it is no longer that; it is a text box that appeared where a
title used to be, and the rename stops reading as an edit and starts reading as
a form. Raising only the search field would have left the rename bug in place
while making the type ladder inconsistent about which inputs get a special
size.

The meta tag covers both inputs and any input added later, at the cost of
pinch-zoom — which this app has never offered in a meaningful sense anyway:
`html`, `body` and `#root` are all `overflow: hidden`, and every screen is
built to fit the card without scrolling the document.

**WKWebView honours the scale limits; mobile Safari has ignored them since iOS
10.** That distinction is the reason this fix works, and it is worth writing
down because the internet's advice on this bug is overwhelmingly "the meta tag
does not work, use 16px" — advice that is correct for a website and wrong here.
Paco ships as a Capacitor app on both stores and is not served as a web page.
If that ever changes, the 16px floor comes back as a real question.

`viewport-fit=cover` is still in the string, untouched. That is not incidental
tidiness: Capacitor's Android `SystemBars` plugin greps the meta content for
that exact substring to decide whether to hand the insets to the web layer, so
rewriting this tag is one of the few edits that can silently undo retro 030's
safe-area fix on the other platform.

## What guards it

`androidShell.test.ts` already asserted the one line of `index.html` the device
layout depends on; it now asserts three more keys in the same tag. The reason
that test file exists applies here word for word — `npm run check:layout` runs
in a desktop Chromium with no soft keyboard and no focus zoom to suppress, so
nothing in the automated layout pass can see this either way. It shipped
precisely because no check on this machine has an iPhone in it.

## Unverified on hardware

Like the safe-area fix (item 10) and the anchor-scroll fix (item 13), this is
reasoned and asserted but has never been seen on a screen. It joins those two
in the same device session, as open item 16 — and it has to be in the build
item 12 is waiting on, since that build is the one Apple gets a recording of.
