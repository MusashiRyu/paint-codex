# Retro 039 — "The fix didn't fix it", and what that turned out to mean

The report after 038 shipped: same flow, same result. Search green, tap the
Warpstone Glow equivalent, land on a black paint. On the face of it, the fix
failed on hardware.

It hadn't failed. It had never been there.

## The build on the phone predates the fix

`master` was ahead of origin by two commits, and the anchor fix (`fa7c194`) was
one of them. The iOS release workflow builds from the pushed commit; both of
the day's runs — 13:32 and 14:20 UTC — built from `8af4e2c`, the 1.2.1 cut,
which is the commit the anchor fix was built *on top of*. No binary containing
the fix has ever existed for iOS. The About sheet on the tested device would
say 1.2.1.

Worth recording how cheaply this was established: `git log origin/master` and
`gh run list --workflow=ios-release.yml --json headSha`. Two commands, and the
alternative was concluding a fix "doesn't work" from a device that had never
run it. The release checklist now cannot prevent this class of confusion —
nothing can force a push before a device test — but the About sheet's version
display can always settle which code is actually on the phone, and checking it
is now step one of any "still broken" report.

A side-finding from the same logs: both runs uploaded **build 5** (neither used
the workflow's build-number override — the log shows `BUILD_NUMBER:` empty on
both). App Store Connect accepted both uploads; the second will fail
asynchronous processing as a duplicate, which arrives as an email and can be
ignored. Build 6 is unburned, so 1.2.2 / versionCode 6 stands.

## And yet the fix was wrong anyway

Being unrun is not the same as being right, and this session stopped assuming.
038's fix — retry when `scrollTop` reads back short of what was asked — was
verified against a harness model in which the engine clamps the write and the
read-back reports the clamp. Actual research into WebKit says the device never
takes that path:

**WebKit's `setScrollTop` forces layout before clamping, and clamps against
fresh layout.** The spacers are already in the DOM when the write happens, so
the main thread accepts the ~680,000px jump and reads it back truthfully.
`landed` evaluates true, the pending anchor is cleared, and the retry — the
entire 038 mechanism — never fires. It also explains what a synchronous clamp
cannot: clamping against the stale 270-result extent would strand the list at
~88,000px, somewhere among the mid-catalog colors. The report says the top.

**What collapses the scroll is the compositor, afterwards.** iOS overflow
scrollers are backed by UIScrollViews in the UI process. The new content size
reaches them on a later layer-tree commit, and that adoption can reset the
scroller's offset to (0,0) — WebKit bug 195584's documented failure class,
"manifests as the UIScrollView contentOffset being reset to (0,0), clobbering
the intended scroll position" — with the near-zero position pushed back to the
page as ordinary, trusted scroll events a few frames later. The hook's
always-on scroll listener then re-derives the window at the top of the browse
order, which opens with twelve near-black paints. Everything in the report
follows.

This failure class is well-enough known that virtualization libraries carry
workarounds: TanStack Virtual retries `scrollToIndex` up to ten times, once
per animation frame, until the target *stays put*; react-virtuoso re-issues
the scroll inside a watch window after it appears to succeed. Nobody trusts
one write, and nobody trusts read-back.

## The landing is now a feedback loop

Three structural changes to `useWindowedList`, each closing a hole the
adversarial review established was load-bearing:

**Two windows while a landing is in flight.** The mounted range is now a list
of segments. Normally one — identical to the old behavior — but while an
anchor scroll is pending, the anchor's window stays mounted alongside whatever
the scroll position derives. This kills both prior bugs at once: the sheet can
never be blank (033's bug — the viewport's segment is always mounted), and the
landing can never lose its target (038's bug — the anchor's segment is always
mounted). The 038 retry died precisely because `syncRange` unmounted the
anchor it needed; segments make that impossible rather than unlikely. The
cards stay keyed by paint id in one flat list, so a segment boundary moving
across a card does not remount it.

**A geometry-judged landing loop.** One write per frame of the remaining error
— the anchor card's real `getBoundingClientRect` against the scroller's, never
`scrollTop` read-back — until the card holds position for 2 consecutive
frames, with a 30-frame deadline and the card re-looked-up from the registry
every frame (a detached node measures as a stable rect of zeroes, which two
frames of would count as "arrived", somewhere that is nowhere). While the loop
runs it is the only writer: the measure pass still records heights but its
hold-still correction stands down, because two writers computing slightly
different targets reset each other's stability forever. A touch, pointer or
wheel cancels the loop and hands the range back to wherever the user takes it.
An anchor near the end of the list, which can never reach the top, lands by
reaching the fully-scrolled position instead.

**A guard after arrival.** The UIScrollView reset can arrive after a genuine
landing. For 600ms — long enough to cover the ~250ms keyboard-dismiss
animation the reported flow includes, since the search field is focused when
the tile is tapped — a scroll event that collapses the position by more than
three viewports, with no finger down, is answered by re-arming the landing
rather than obeyed. Two re-arms maximum, then the engine wins; any user
gesture disarms the guard instantly. The discrimination is safe because the
measure pass's own corrections move the scroll by tens of pixels, and no
finger moves 680,000px in half a second.

## The harness stopped modeling one failure and started modeling four

The deeper lesson of 038 repeated itself within a day: the check passed while
the bug was live, *again*, because the model had exactly one failure mode in
it. The clamp helper now has four, each catching a different wrong
implementation:

| Mode | Models | Catches |
| --- | --- | --- |
| `hard` | An extent that never updates | A window that blanks instead of following |
| `lifting` | Layout catching up next frame | No retry at all |
| `slow-lift` | Layout catching up in 6 frames | Retry budgets counted in commits, or too few frames |
| `relapse` | **The device**: write accepted, snapped to 0 two frames later by a trusted scroll event | Declaring victory on read-back and not watching afterwards |
| `read-back-lie` | Transiently dishonest reads while clamped | Any verification that consults `scrollTop` instead of geometry |

The anchor check runs once per mode, and its assertion is frame-counted — the
ringed card must hold the screen for 10 consecutive rAF-polled frames, because
a single sample after `relapse`'s snap passes or fails by luck of where it
lands. It reads the true position through a stashed native getter, since under
`read-back-lie` the property itself is part of the test. And it fails loudly
if no write ever crossed the cap, so a future migration to `scrollTo()` —
which bypasses the property interceptor — cannot quietly turn the whole suite
into a no-op.

Verified in both directions: the new mechanism passes all four modes; the 038
code fails `slow-lift`, `relapse`, and `read-back-lie` while passing
`lifting` — the one mode it was built against.

## What is still inference

The `relapse` model is built from WebKit source, bug 195584, and library
workarounds — not from instrumenting the phone. It is a far better-grounded
hypothesis than 038's, and the mechanism now converges under every model
anyone has articulated, including several that are probably too hostile. But
the only evidence that counts is the same device that reported the bug,
running a build that — this time verifiably — contains the fix. The About
sheet must say 1.2.2 before any conclusion is drawn.
