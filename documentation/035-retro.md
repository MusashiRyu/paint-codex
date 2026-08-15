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

## The three strings that actually shipped

Auditing the rest of the repo to check item 14's premise turned up something
better than a documentation inconsistency. Three **user-facing** strings were
still British, in an app whose other labels read `BROWSE FULL CATALOG` and
`Color Theory`:

- `No paint in the catalogue to compare.` — the Color Lab's empty match
- `No close equivalents catalogued.` — a result card with nothing near it
- `No paints saved yet — search the catalogue instead.` — the picker's My Lists
  tab with nothing to offer

All three render on screens the reviewer's own shot list walks through, under a store
description that says "catalog" four times. Nobody would reject a build for it;
it is exactly the kind of thing that survives forever because it is too small to
schedule.

The third one was found last and by accident. A grep for British words inside
JSX text missed it, because the pattern could not span a text node broken across
lines by the formatter — it turned up only in the *test* asserting on it, in a
list of test names that were all safe to convert. Worth remembering that a
string's assertion is sometimes easier to find than the string.

Fixing them cost a rebuild: 1.2.0's `.aab` and APK had already been cut and
verified, and an artifact that no longer matches its source is worse than no
artifact. Both were rebuilt and re-verified.

## The rest of it, after all

The plan was to leave `src/` and `tools/` alone — roughly 300 comments that
reach nobody, against a diff touching most files in the repo, landing on a
release-ready `master` between a verified build and its upload. That was written
down as a deliberate deferral and then reversed on the grounds that it has to
happen eventually and this is as good a time as any. 340 replacements across 82
files.

Three things had to be protected by hand, and none of them is a spelling:

- **`Citadel_Colour.md`** is upstream's filename, and one of the two lines
  carrying it is the fetch URL.
- **`gravity: 'centre'`** is a value the sharp library accepts, in three places
  in the icon generator.
- **`battlegrey` and `citadel-*-administratum-grey`** are a paint name and two
  paint ids. `Administratum Grey` needs no rule at all — matching `grey`
  case-sensitively leaves every capitalised one alone.

The first attempt got two things wrong and both are worth recording, because
both produce output that *looks* converted:

**Order the patterns longest-first.** `/catalogue(s?)/` run before `/catalogued/`
eats the stem and leaves `catalogd`; `/centre(s?)/` before `/centred/` leaves
`centerd`. Six of those shipped into the working tree before a grep for mangled
forms caught them.

**Exclude the files that quote the rule.** The sweep ran over this retro and the
README and rewrote "`colour` → `color`" as "`color` → `color`", which is not a
spelling change but a sentence that no longer says anything. Both are now
excluded from any automated pass and corrected by hand — the two genuine
stragglers in `documentation/`, both `judgement`, were fixed that way.

## What this did not do

- **The console setting has not moved.** App Store Connect still declares the
  listing English (U.K.) while its copy is now American, which is the precise
  state item 14 warned against. It is one dropdown and it is open item 15, but
  until it is changed this session has traded one inconsistency for another —
  and this one is visible to users.
- **Play needs nothing**, and this was almost written down as an unknown.
  Its default language is English (United States) and has been since the app
  was created — recorded in release-checklist step 2, where a search for
  "language" would have found it before the sentence claiming otherwise was
  written. Worth the correction rather than a quiet delete: it means Play has
  been declaring American while serving British copy for every release so far,
  so the conversion removed a mismatch there rather than creating one. The App
  Store is the only store where the setting still disagrees with the words.
