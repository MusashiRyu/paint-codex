# Retro 014 — The catalogue's real source, and 310 paints became 2,422

The request was to add PaintAtlas as a paint source. Following it to its own
stated origin turned it into a source *replacement* instead, and along the way
into a paint-id change that had to be migrated rather than shipped.

## What was done

### 1. PaintAtlas turned out to be a front-end, not a source

The three URLs asked for — `paintatlas.com/brands/{citadel,vallejo,army-painter}`
— are Next.js pages. The brand page carries names and links only: 367 Citadel,
940 Vallejo, 536 Army Painter. Colour, range, opacity and ΔE live on the
individual paint pages, so a full ingest is ~1,843 page fetches of ~107 KB
each. Their `robots.txt` disallows `/api/`, and the imprint restricts copies of
the pages to private, non-commercial use.

That same imprint names where the data comes from:
`Arcturus5404/miniature-paints` — **MIT**, on GitHub, README reading *"Feel free
to use or improve any of these paints in your own personal projects."* One
markdown table per brand, `raw.githubusercontent.com`, and its unique-name
counts come out at exactly 367 / 940 / 536.

So PaintAtlas is a rendering of that repo plus computed ΔE. Reading the repo
gets the same data, licensed for reuse, in three fetches instead of 1,843, from
the host the runtime refresh already talks to. The 1,843-page crawl would also
have been build-time-only — no phone is doing that at launch — which would have
meant either killing the runtime refresh or hosting our own mirror.

The general lesson: when a site is a nice front-end over public data, find out
whose data it is before writing a scraper for the front-end.

### 2. Replaced redgrimm rather than merging

Old catalogue: 310 paints, of which 206 had no `category` at all. New: 2,422
across every range each brand sells, all with a range name.

Merging was the other option and was worse in a specific way. `setPaints`
replaces the whole catalogue, so any paint the merge added would have vanished
on the first successful runtime refresh from redgrimm — the merge would have
had to be redone at runtime, on the phone, forever, to hide the fact that there
were two sources.

### 3. Equivalents are now ours

Upstream ships colour, not conversions. `attachMatches` converts every paint to
CIELAB and keeps each one's six nearest neighbours from *other* brands.

This is strictly better coverage than what it replaced: redgrimm only had
matches for the paints in its table, so most of the catalogue had none.
Every one of the 2,422 has six now.

The metric is CIE76, and that is a decision rather than a default. The
thresholds in `shared/lib/color.ts` — 3 for "indistinguishable", 7 for "still
usable" — are expressed on the CIE76 scale. CIEDE2000 models perception better
but returns systematically smaller numbers, so switching to it would have
silently reclassified every match in the app without either constant changing.

~6M pair comparisons, so the inner loop is arithmetic over a `Float64Array`
keeping a running top six rather than sorting per paint. 30 ms on this machine,
and it runs at idle and unawaited on a phone.

### 4. `Match` became an id, because a name stopped identifying a paint

Citadel sells two different paints called Abaddon Black — an Air and a Base —
at different colours. The old `Match` carried `{brand, name, hex, delta}` and
`SearchSheet` resolved it back through a brand+name index, which under the new
data would land on whichever of the two was indexed last.

`Match` is `{id, delta}` now. `getTopMatches` takes the id index, sorts, caps
and resolves in one pass, and drops an id whose paint has left the catalogue —
which also deleted the old "equivalent we don't carry" disabled-tile state,
since an unresolvable match is now simply not rendered. Storing two fields
instead of four also matters at 2,422 × 6: the snapshot ships in the bundle
*and* is mirrored into localStorage.

### 5. The id change had to be migrated, and 20 paints could not be

Ids went from `citadel-abaddon-black` to `citadel-base-abaddon-black`. Lists
persist paint ids and `resolvePaints` drops what it cannot find, so shipping
this unmigrated would have emptied every saved list with no message at all.

`tools/scraper/buildIdMigration.mjs` writes `src/data/paintIdMigration.json`
and the store's v2 → v3 migration applies it. Each old id maps to the new paint
of the same brand and name whose colour is nearest the one the old snapshot
carried — nearest, because the old catalogue stored one hex per name and it is
that hex which says which range the entry really came from.

Two refinements were needed. Punctuation-insensitive name matching, because the
two sources disagree on "Deathworld Forest" vs "Death World Forest". And a tie
break preferring brush ranges over airbrush ones: the old catalogue was built
from redgrimm's Citadel "Base Layer" and Vallejo Game/Model ranges — brush paint
throughout — so when a name exists in both Air and Base at the same colour,
Averland Sunset among them, Base is what the saved list meant.

290 of 310 mapped. The remaining 20 are paints the new source does not carry,
and they were deliberately left unmapped: a colour-nearest fallback would have
put a different product in someone's list under the old name. They drop out at
resolve time, the way any retired paint does.

The id itself deliberately excludes the product code, even though the code is
shorter and unique. Upstream leaves it null for whole ranges and fills some in
later — an id that changes when a spreadsheet cell is filled in would empty a
list just as silently, and for no reason at all.

### 6. A gap found while writing a test: one brand can go missing quietly

The rejection floor was half the bundled paint count in total. With one document
per brand the realistic failure is one file being renamed while the other two
answer normally — and Citadel is 452 of 2,422, so losing it whole leaves 1,970,
comfortably over a floor of 1,211. The refresh would have adopted a catalogue
with no Citadel paints in it.

`findShortfall` now checks each brand against half of what that brand shipped,
as well as the total. `checkUpstream.mjs` does the same, so the alarm and the
runtime agree.

### 7. `paintSnapshot.test.ts`

`npm run scrape` is hand-run and never runs in CI, so nothing had ever asserted
against the shipped JSON itself — a scrape from a half-broken upstream, or an
edit straight to the file, would have reached a release unchallenged. Seven
cases now cover unique ids, renderable colours, every match resolving inside the
same file, no same-brand equivalents, and every migration target existing.

## Numbers

| | Before | After |
| --- | --- | --- |
| Paints | 310 | 2,422 |
| Citadel / Vallejo / Army Painter | 104 / 139 / 67 | 452 / 1,266 / 704 |
| Paints with no range | 206 | 0 |
| Paints with equivalents | partial | all |
| Snapshot on disk | 176 KB indented | 1.20 MB minified |
| Bundle (gzip) | — | 273 KB |
| Tests | 101 | 113 |

## What is worth remembering

**Follow the attribution.** The imprint of the site we were asked to scrape
named an MIT repo with the same data. Five minutes of reading replaced a
1,843-page crawl of questionable standing with three fetches of licensed data.

**An id scheme is persisted state.** It is not obvious that renaming ids needs a
`version` bump the way renaming a *field* does, because the type never changes.
`resolvePaints` failing silently is what makes it dangerous rather than loud.

**A floor over a sum hides a failure in a part.** The total-count guard had been
right for one document and was wrong the moment there were three, and nothing
about the code changed to make it wrong.

## Not done

- **Screenshots were not regenerated.** The catalogue content and the equivalent
  tiles both changed, so `store/` screenshots are stale. `npm run screenshots`
  fails on this machine — Edge will not launch under puppeteer-core, unrelated
  to this work. Tracked in OPEN-ITEMS.
- **Shop links were remapped, not re-crawled.** 186 of 191 survived the id
  change; the other 2,236 paints have no link. Dormant while
  `featureFlags.markdownExport` is off. Tracked in OPEN-ITEMS.
