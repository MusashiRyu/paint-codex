# Retro 033 — A scroll that did not land where it was asked

Opening the catalogue on a paint — tapping a row to see what sits near it —
sometimes showed an empty sheet on iOS. Title, search box, brand chips, and
then nothing: no cards, and not even the "Found 2,279 paint(s)" line above
them. One finger-scroll and the right paint was there, at the right position,
in the right colour.

That last detail is the whole diagnosis. The scroller was where it was supposed
to be. The cards were not.

## What was wrong

The browse list is windowed: about nine cards are mounted and two spacer divs
stand in for the other 2,270. Opening on a paint sets the window around it,
lets it be measured, then scrolls the card to the top geometrically:

```js
el.scrollTop += card.getBoundingClientRect().top - scrollerBox.top - ANCHOR_GAP;
```

and then swallows the scroll event that write causes, on the reasoning that the
hook already knows where it put the scroller.

It knew where it had *asked* for it to be. Writing `scrollTop` is clamped to the
scroll extent the engine currently believes in, and this scroller is **947,443
pixels tall**. On WebKit that belief lags the spacers already in the DOM, the
jump stops short, and the window — mounted around a card several thousand
pixels further down — is nowhere near the viewport. What is under the viewport
is the top spacer, which is an empty div.

Then the one event that would have caught it was thrown away.

The geometry is not in dispute; it can be demonstrated without iOS anywhere in
the picture. Put the scroller somewhere the mounted window does not cover and
ask what is drawn:

```
scrollTop: 2000, mounted: cards 5-12, cardsInViewport: 0, countLineVisible: false
>>> BLANK results area — the reported symptom, from geometry alone.
```

## Why it was iOS only, and why the checks were clean

Chromium lands every one of those writes exactly. So does jsdom. The layout
check reported **all 63 surface/width combinations clean** on the build that
shipped this, and it was right to: at no width does a desktop engine reproduce
the condition, because at no width does it refuse a scroll.

This is the second bug in four retros where the check could not have caught the
fault with any additional *rule* — 030 was the safe-area insets, which a machine
with no notch reports as zero. Both needed the environment to be broken on
purpose rather than sampled more carefully. `checkScrollLanding` now caps every
`scrollTop` write on the page, which puts a Chromium into exactly the state a
WebKit gets into by itself, and asserts the rule that actually matters:

> Wherever the scroller ends up, something is drawn there.

On the code as it shipped:

```
Scroll landing: FAIL
  landed-outside-window: scroller stopped at 2000px with cards 752-759
  mounted; nothing is drawn in the results area
```

## The fix

Three changes, and the first is the one that matters:

**Read the landing back.** The scroll *position* updates synchronously on
assignment — only the event is deferred — so `el.scrollTop` says immediately
whether the write took. A short landing is retried on the next commit, by which
time layout has usually caught up, and settled for after three tries.

**Derive the window from where the scroller actually is, not from where it was
sent.** This is the part that makes a bad landing survivable rather than fatal:
the worst case becomes "opened slightly off" instead of "opened on nothing".
Moving the window is always safe, which is worth stating plainly because it is
what makes this cheap — the top spacer is `offsets[start]`, so every card keeps
its absolute position no matter which of them are mounted. Re-ranging never
moves content.

**Stop swallowing scroll events.** The flag had a second failure mode nobody had
hit yet: it was a latch, cleared only by an event. A programmatic write that
moved nothing — clamped to where the scroller already was, or rounded to the
same device pixel — produced no event, so the flag stayed set and ate the user's
next real scroll instead.

### A correction that had never once run

Found while reading the same effect. Scrolling *up* brings unmeasured cards into
the window above the viewport; their real heights replace estimates, and
everything below them moves unless the scroll is corrected by the same amount.
That correction was there, and was a no-op:

```js
const after = offsets.current[topIndex] + into + headerOffset.current;
if (Math.abs(after - before) > 0.5) { ... }
```

`offsets.current` is rebuilt during render, not here — so it is the *same* array
that produced `topIndex` and `into` four lines above, and `after` equals `before`
by construction. The condition could never be true. Summing from the `heights`
map the pass has just written is what it meant to do.

It was measurable the whole time. Before, a **1px** scroll moved the anchored
card 36px; after, it moves it 1px.

## What this did not fix

- **Not confirmed on the device.** Everything above was demonstrated on a
  Chromium with its scrolling deliberately broken, because there is no WebKit on
  this machine. The reasoning about *why* WebKit clamps is the part that rests
  on inference; that a short landing produces exactly this blank screen, and
  that the fix covers it, does not. Open item 11.
- **The scroller is still ~950,000px tall.** The fix makes a bad landing
  harmless rather than making the jump small. If WebKit turns out to have
  trouble with the extent itself rather than with the timing of it, that is a
  different fix — anchoring the window near the top and letting the spacers grow
  as the user scrolls, which is a redesign of the hook.
- **`ANCHOR_TRIES` is a guess.** Three commits is enough for layout to catch up
  in every case that can be produced here. Nothing measured how many a real
  device needs.
