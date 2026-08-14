# Retro 031 — Collab, and the second screen the app never had

A Claude Design zip arrived with two mockups in it: the app as it stands, and a
new screen called Color Lab. Mixing on one tab, Matching on the other, reached
by a bottom nav the app did not have.

The interesting part of the session was not building the screen. It was
deciding, three separate times, that the mock was describing an *intention*
rather than an implementation — and that the repo already had a better answer
than the one in the file.

## What shipped

**Collab**, the second screen, named for the play on Color Laboratory.

- **Mixing.** Two slots; a six-block strip from A to B in 20% steps; a card per
  intermediate step naming the closest real paint.
- **Matching.** One slot; complementary, highlight and shade, each under its own
  sub-heading with the derived colour, then a card naming the closest real paint.
- **A paint picker.** My Lists, or the List screen's own catalogue search.
- **Add to list from either tab**, with the destination named.

Three commits: the extractions, the maths, the screen.

## Three places the mock was wrong, and one where it was right

### 1. It measured colour in RGB

The mock's script computes nearest-paint as a Euclidean distance in sRGB, over
a 32-paint array, and grades the result against thresholds of 40 and 90.

The app has a CIELAB pipeline. `hexToLab` in `paintCatalogSource.ts` is what
every stored ΔE in `paints.snapshot.json` was measured with, and
`shared/lib/color.ts` carries thresholds of 3 and 7 with a comment explicitly
warning that switching metrics would silently reclassify every match in the app
without either constant changing.

Adopting the mock's numbers would have put two different meanings of the word
"close" on two screens of the same app — and the Color Lab's deltas render
*directly beside* the snapshot's own, in the same badge component, on cards
that look the same. So `findNearestPaint` is CIE76 in the same Lab, rounded to
the same two decimals, and classified through the same three functions.

What it does **not** share with `getTopMatches` is the brand exclusion, and
that difference is worth its doc comment. Equivalents skip same-brand paints
because "what do I buy instead of this Citadel paint" is not answered by another
Citadel paint. "What is closest to this colour" has no brand to exclude, and
excluding one would hide the answer.

### 2. It drew the picker's search itself

The mock's picker has a Search Catalog mode with its own input, its own brand
chips and its own result cards. Reimplementing that would have been a second,
worse search — no Fuse ranking, no perceptual browse order, no windowing, and
2,279 paints to render.

The blocker was structural, not conceptual: `SearchSheet` was a `Sheet` with the
search welded inside it, so the picker could not hold one without nesting
sheets. Splitting it took one commit and moved nothing else —
`SearchSheet.test.tsx`'s 28 cases passed untouched, which is what made the
split safe to believe.

`PaintSearch` renders a **fragment** rather than a wrapping div. `flex: 1` on
the results list has to resolve against the `Sheet` that holds it, and a
wrapper would have swallowed the flex context and collapsed the scroll.

The one prop that had to be added is `action: 'add' | 'select'`, and it changes
exactly one thing: the gold button's accessible name. A screen reader cannot be
told "add Mephiston Red to list" on a surface that puts it in a slot.

The picker mounts that search with **no** `listedPaintIds`, so every card is
pickable rather than badged IN LIST. That was a deliberate call: membership is
the wrong fact when the question is which paint goes in the slot, and a badge
where the control belongs reads as one that has been taken away.

#### The half of that which was wrong

Reusing the card kept its *interaction* too, and that turned out to be the one
thing that should not have been reused. On the List screen a card is something
you read, with a small gold `+` as the thing that acts on it — the card itself
has nowhere to go. In a picker every colour on screen is a candidate, so tapping
one has an obvious meaning, and the first thing anyone does is tap the swatch.

Reported straight off the running app: *"I didn't think of being able to select
it."* The `+` was there, and it was the only way in.

So in `select` mode the whole summary row is the button, and the `+` goes with
it — two adjacent tab stops calling one handler is noise a screen reader has to
walk through, and the row now carries the affordance. The equivalent tiles moved
with it: they select the paint they name rather than jumping the list to it.
Jumping is browsing, which is the right verb when you are filling a list and the
wrong one when you are filling a slot. The perceptual browse order is still
there to scroll if what you want is the colours nearby.

`PaintSummary` grew an `onSelect` for it, and the slot's children move *beside*
that button rather than inside — `PaintItem` had already solved the same problem
by keeping its remove action a sibling. Everything is spans now whether or not
it is a button, so there is one render path instead of two kept looking alike.

A ninth layout surface came with it. `collab-pick` only ever covered My Lists,
and a picking card is not the same box as an adding one: its row is pulled out
to the card's edges with a negative margin, which is precisely what the
surface-overflow rule exists to catch. `collab-search` covers it, and 63 of 63
combinations are clean.

The lesson is not "test the picker harder". It is that reuse copies decisions
along with code, and *this card is something you act on rather than something
you tap* was a decision the List screen had made for reasons the picker did not
share. Nothing in a test would have said so. Somebody opening the app did.

### 3. It drew the theory cards as three summaries

The mock puts complementary, highlight and shade in three compact cards, each
ending in a line of small text naming the nearest paint. The user asked for
something else, and it is better: a `COLOR THEORY` heading, then a sub-heading
per colour, then a card built like a search result — the ΔE, and either IN LIST
or the gold `+`.

That request is what turned `ResultCard`'s summary row into `PaintSummary`.
Once the Lab needed the same row without the equivalents grid, the row was the
shared thing and the grid was the specialisation. Both moves kept every class
name, because the tests and `check-layout.mjs` select on `[class*="paintName"]`
and `cardMetrics.ts` measures `.paintRow` from another feature's folder.

### 4. Where it was right: the strip

The one place the mock's layout survived intact is the blend strip, and it is
worth saying why the obvious "improvement" was rejected. The user asked for
every mix step to name its nearest paint, which invites putting the name under
each block. Six blocks across a 320px card is 46px a column. A paint name does
not fit in 46px; a percentage and a six-digit monospace hex just do.

So the strip stayed the mock's continuous band, and the names went into
full-width cards below it — the same `NearestPaintCard` the Matching tab uses,
which is what makes the two tabs read as one screen rather than two features.

Only the **four intermediate steps** get a card. 0% and 100% are the two paints
sitting in the slots directly above, and their nearest paint is themselves.

## The two things a test could not have told us

Both were found by looking at a screenshot, which is the argument for taking one.

**The nav bar has to be opaque.** The mock draws it at `rgba(10,8,14,0.94)`,
which is fine over the flat ground a mock has. Over the card's background image
6% is enough for a paint name scrolling underneath to read clearly through the
bar and compete with the labels on it — "CRIMSON / VALLEJO / Nocturne Models"
was legible behind `LIST`. It is now `#0a080d`, which is `--scrim-card-bottom`
with the alpha taken off, so the bar and the card bottom are the same colour and
the join is the gold hairline rather than a step.

`npm run check:layout` passed all 56 combinations with the translucent bar,
because nothing overflowed and nothing was clipped. Legibility is not geometry.

**The add confirmation has to name the list.** The List screen flashes
`Exported ✓` next to the list header, which works because the list is right
there. Collab shows no list at all, so a bare tick would confirm that *something*
happened somewhere. It reads `Added to Ultramarines`.

## A branch that was deleted before it shipped

`handleLabAdd` originally read:

```ts
const added = addPaintToList(activeList.id, paint.id);
setAddFlash(`${added ? 'Added to' : 'Already in'} ${activeList.name}`);
```

Writing the test for the `Already in` half is what killed it. A card only
renders its add button when the paint is **not** in the list, so there is no
sequence of taps that reaches the false branch — except a double-tap landing
before the re-render, and there "Added to Ultramarines" is both true and less
confusing than insisting the thing you just added was already there.

The return value is now ignored, with the reasoning written where the call is.
The test that replaced it asserts the actual invariant: after adding, the offer
is gone and the badge is there.

## Layout check

Three new surfaces — `collab-mix`, `collab-match`, `collab-pick` — taking the
sweep from 35 combinations to 56, and a fourth below took it to 63. All clean at the time, and the safe-area
pass still reports every inset consumer moving with its inset.

One naming hazard, and it is the second of its kind. The file already documents
that a paint row's label must not start with `Go to`, because that prefix is how
the equivalent-tile rule finds its elements. The Lab adds a near-miss of the
same shape: an empty slot is `Select Paint A` and a picker row is
`Select <name> by <brand>`. Every selector for either is exact or anchored on
the `" by "`, and that is now written down next to the `Go to` note.

## What did not change

- **No router.** `screen` is a `useState` in `App`, and a third destination
  would be a third value. Nothing here has a URL, a back stack of screens or a
  deep link, and the Android back gesture is already spoken for by
  `useBackDismiss`.
- **No persist bump.** Lists still hold catalogue paint ids. A mixed colour is
  not a paint and never becomes a list entry — what gets added is always the
  real paint nearest it.
- **No fifth runtime dependency.** The colour maths is 150 lines of arithmetic
  in `domain/colorLab.ts`.

## The one number that is not measured in Lab

`mixRamp` interpolates in sRGB, and the doc comment argues for it rather than
assuming it, because the rest of this retro is about refusing exactly that.

A mix strip is a preview of a blend, not a measurement. Nothing is thresholded
against it; the ΔE shown under each step is still computed in Lab, so the
number and the swatch it sits under never disagree. Lerping in Lab would need a
`labToHex` inverse that nothing else in the app wants, to smooth a ramp nobody
is measuring. Neither is a model of physical paint, which mixes subtractively —
and the cards under the strip are what make the preview actionable regardless.

## Where it stands

221 tests, 20 files. Lint and typecheck clean. 63 of 63 layout combinations
clean, against both the production build and the dev server — the StrictMode
path is worth the second run in a session that moved the windowed list into a
new file.

Both store descriptions now mention Collab. The screenshots do not — all eight
are List screens — and there are no release notes, because `APP_VERSION` is
still 1.1.0 and the version that ships this has not been decided. Both are
**OPEN-ITEMS 11**, and both are the wrong side of the line between building a
feature and shipping one.
