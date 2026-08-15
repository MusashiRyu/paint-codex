# Retro 038 — The jump that only ever tried once

Reported from the device: search for green, open the Vallejo Game Color green,
tap its Warpstone Glow equivalent, and the list lands on a black paint.

This is the third visit to the same scroller, and the first one where the check
that was supposed to guard it was already passing.

## Reproduced before anything was touched

The report named a specific pair of paints, so the first move was to ask the
data whether the pair was even the problem. It was not: `Warpstone Glow`
resolves cleanly from `Green`'s match list, and sits at **browse position 1708
of 2,279**. Nothing about the equivalent is stale or mismapped.

The second question answered itself in the same output. The browse order opens
with twelve paints that are all `#000000`-ish:

```
0  #000000 Army Painter | Matt Black
1  #000000 Citadel      | Abaddon Black
2  #000000 Citadel      | Black Ink
3  #000000 Citadel      | Badab Black Wash
...
8  #010101 Vallejo      | Pure Black
```

So "it jumps to a black color" and "it lands at the top of the list" are the
same sentence. That reframed the whole thing: this is not a wrong anchor, it is
a jump that did not arrive.

Driving the built app in Chromium with `scrollTop` writes capped — the same
device `check-layout.mjs` already uses — reproduced it exactly:

```
scrollTop: 2000        scrollHeight: 948065
mounted cards: 0-7
visible: "Badab Black Wash", "Chaos Black"
ringed: null
```

`ringed: null` is the tell. The anchored card was not off screen; it was **not
in the DOM at all**.

## Two bugs, and the second one hid the first

The hook already knew a jump can fall short — retro 033 added exactly that,
and its comment says a short landing "is retried on the next commit". The retry
was real. It just could not run more than once, for two independent reasons.

**`syncRange` unmounted the anchor.** After a short landing the hook calls
`syncRange` to derive the window from where the scroller actually stopped,
which is what stops the sheet going blank — 033's whole fix. But it ran on the
retry path too. So the window moved to the top of the list, the anchor's card
unmounted, and the next pass hit `cards.current.get(pending)` → `undefined`,
skipped the entire block, and never decremented a try or scheduled another.
`ANCHOR_TRIES = 3` had been buying exactly one attempt since the day it was
written.

**A commit is not a frame.** Even with the card still mounted, the retry was
driven by `bumpVersion`, and React flushes a layout-effect `setState`
synchronously *before paint*. Every retry therefore re-asked an engine that had
not re-laid-out since the write that just fell short, and got the identical
clamp back. Three tries in one frame are one try. What lifts the clamp is a
frame.

The fix does both: a short landing schedules its retry on
`requestAnimationFrame`, and that callback re-mounts the anchor-centred window
before asking again. `syncRange` still runs every pass, so the list is never
blank while the retry is in flight — the anchor comes back on the retry frame
rather than by holding an empty screen until then.

`ANCHOR_TRIES` went 3 → 4, which is a real change now that a try is a frame
rather than a no-op. Four frames is about 65ms.

## The check was passing, and that was the finding

`checkScrollLanding` has guarded this scroller since 033 and it passed on the
broken build. Two reasons, both worth fixing rather than working around:

**Its rule was too weak.** It asserts that *something* is drawn where the
scroller stops. Landing among the blacks draws cards perfectly well — they are
simply the wrong ones. "Not blank" was the right rule for 033's bug and is not
a rule about arriving.

**Its clamp could never lift.** The harness caps every `scrollTop` write at
2000px forever. Nothing can satisfy that, so no assertion stronger than "not
blank" was even expressible — a retry that works and a retry that does not
produce identical results under a permanent cap.

So the harness grew a second mode. `lifting` clamps the write and then lets the
limit catch up one frame later, which is what WebKit actually does: the engine
lays out the region it was just asked about, but not before the write returns.
Under that model a working retry converges and a broken one does not, which is
the difference the old check could not see.

The new `checkAnchorLanding` takes the path the report names — search, tap an
equivalent tile — rather than the fresh-open path the old one takes, and
asserts the ringed card is on screen at the end. Confirmed both ways: it fails
on the pre-fix build with `anchor-not-reached: scroller stopped at 2000px; the
anchored card is not even mounted and the list is showing Badab Black Wash,
Chaos Black`, and passes after.

Worth saying plainly, because it is the lesson rather than the bug: **the check
did not miss this because nobody had thought about clamped landings. It missed
it because the model it used to think about them had exactly one failure mode
in it.**

## Why this path and not the one that was verified

Items 10 and 13 were confirmed on the iPhone 15 Pro Max the same day, and one
of them was this scroller. They pass because opening a paint from a list row
mounts a **fresh** sheet: the scroller is at zero, laid out for nothing, and
the anchor is in the initial window from the first commit.

Tapping an equivalent tile from inside an open sheet is a different animal. It
swaps a 270-result search for the whole 2,279-paint catalog under a scroller
that is already laid out for the short list, and then asks it to travel
680,000px. That is precisely the case where the engine's belief about the
extent is furthest behind the DOM — and item 13's own check list named it, as
"do it twice in a row without closing the sheet, via an equivalent tile". That
line was written about re-anchoring an already-scrolled *browse*; it did not
imagine the list changing length underneath the jump.

## What is still not known

The clamp model is inference. There is no WebKit on this machine, so `lifting`
is a hypothesis about iOS dressed as a test — a well-behaved one, since it
discriminates the fix from the bug, but not a measurement. What is established
is that the retry could only ever run once, and that one attempt is not enough
for a jump this size on any engine that clamps at all.
