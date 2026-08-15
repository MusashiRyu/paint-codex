# Retro 035 — Finishing the English conversion

The repo settled on American English a session ago and `store/` was held back on
purpose: the copy was in front of an App Store reviewer and the listing's
primary language was registered English (U.K.), so British was *correct* there.
Open item 14 recorded that, and recorded what would have to move with it.

Two hand edits — `colour` → `color`, `aeroplane` → `airplane` — landed inside
the reviewer notes and broke that. Not because the edits were wrong, but because
one American word among six British ones in a block a reviewer reads end to end
is worse than either consistent choice.

So the deferral got re-examined rather than the edits reverted, and its premise
had expired. Item 14 said "in front of a reviewer right now"; the submission had
been **rejected**, so nothing was in front of anyone. A resubmission being
assembled from scratch is the cleanest moment such a switch will ever get.

## What moved

79 replacements across the three `store/` files, plus `categorisation` in two
places that the first scan missed because the word list only had `-our` and
`-ue` endings and not `-isation`.

The two exceptions held:

- **The keyword field keeps both `colour` and `color`.** It is an index rather
  than a sentence, people search both, and it is billed by the character rather
  than read by anyone.
- **`Citadel_Colour.md`** is the upstream database's filename. Renaming it in
  our code would only break the fetch. It joined the README's proper-nouns
  exception, which had not previously said anything about upstream identifiers.

Case had to be carried across rather than lowercased, because the description's
section headings are set in caps: `SEARCH THE CATALOGUE` becomes `SEARCH THE
CATALOG`, not `SEARCH THE catalog`. Worth writing down because the obvious
`replace(/catalogue/gi, 'catalog')` silently gets that wrong and the result
reads as a typo in the largest text on the store page.

The published privacy page was regenerated and its generator fixed — a CSS
comment in `privacy-page.mjs` was serving the word `catalogue` inside the HTML
at a public URL.

## The two strings that actually shipped

Auditing the rest of the repo to check item 14's premise turned up something
better than a documentation inconsistency. Two **user-facing** strings were
still British, in an app whose other labels read `BROWSE FULL CATALOG` and
`Color Theory`:

- `No paint in the catalogue to compare.` — the Color Lab's empty match
- `No close equivalents catalogued.` — a result card with nothing near it

Both render on screens the reviewer's own shot list walks through, under a store
description that says "catalog" four times. Nobody would reject a build for it;
it is exactly the kind of thing that survives forever because it is too small to
schedule.

Fixing them cost a rebuild: 1.2.0's `.aab` and APK had already been cut and
verified, and an artifact that no longer matches its source is worse than no
artifact. Both were rebuilt and re-verified.

## What was left alone, deliberately

Roughly 300 British spellings remain in `src/` and `tools/` comments. They were
measured rather than converted, and the README now says so instead of implying
the repo is uniformly American.

The reasoning is the same one that held `store/` back, pointed the other way:
the change would touch most files in the repo, reach no user, and land on a
release-ready `master` between a verified build and its upload. A three-hundred
line diff whose entire content is `colour` → `color` is not free — it is a wall
of noise across every `git blame` for a word nobody reads.

They get corrected in passing. The rule governs what is newly written.

## What this did not do

- **The console setting has not moved.** App Store Connect still declares the
  listing English (U.K.) while its copy is now American, which is the precise
  state item 14 warned against. It is one dropdown and it is open item 15, but
  until it is changed this session has traded one inconsistency for another —
  and this one is visible to users.
- **Play's default language was never recorded**, so nobody knows whether it
  needs the same change. Worth a look in the same sitting.
