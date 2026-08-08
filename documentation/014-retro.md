# Retro 014 — The catalogue's real source, and 310 paints became 2,279

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

Old catalogue: 310 paints, of which 206 had no `category` at all. New: 2,279, covering
every range each brand sells, every one of them carrying its range.

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
Every one of the 2,279 has six now.

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
instead of four also matters at 2,279 × 6: the snapshot ships in the bundle
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
answer normally — and Citadel is 378 of 2,279, so losing it whole leaves 1,901,
comfortably over a floor of 1,139. The refresh would have adopted a catalogue
with no Citadel paints in it.

`findShortfall` now checks each brand against half of what that brand shipped,
as well as the total. `checkUpstream.mjs` does the same, so the alarm and the
runtime agree.

### 7. `paintSnapshot.test.ts`

`npm run scrape` is hand-run and never runs in CI, so nothing had ever asserted
against the shipped JSON itself — a scrape from a half-broken upstream, or an
edit straight to the file, would have reached a release unchallenged. Eight
cases now cover unique ids, renderable colours, every match resolving inside the
same file, no same-brand equivalents, no two entries sharing a brand, name and
colour, no paint being shown two tiles that read identically, and every
migration target existing.

### 8. Then the duplicates, which were the same bug twice

Keeping every range variant was the right call for paints that differ, and the
wrong one for paints that do not. Upstream lists a colour once per range it is
sold in, so Citadel's Abaddon Black arrived as both Air and Base at `#000000`
and Vallejo's Black three times over. 143 rows were a brand, name and colour
already present under another range label.

On screen those are indistinguishable: same name, same swatch, same hex, only
the range chip differs. Two symptoms, one cause:

- Search results listed the same paint several times.
- **492 paints — 20% of the catalogue — had equivalent tiles that repeated.**
  Abaddon Black's six tiles were three Vallejo Blacks and three Army Painter
  Matt Blacks, all `#000000`, all Δ0: six tiles carrying two answers.

The fix is one entry per brand + name + colour, whose `category` lists every
range it is sold in, primary first — `Base · Air`. Nothing is lost against
upstream, because the ranges are all still there. A name at a *different*
colour stays a separate paint, which is what the original decision was actually
about: Administratum Grey really is a different grey in Layer and in Air.

2,422 → 2,279 paints. Repeating equivalent tiles: 492 → 0. Abaddon Black now
gets six distinct answers instead of two repeated three times.

"Primary range" is brush before airbrush, then alphabetical — the same
preference the migration already used, for the same reason: brush is what
someone browsing a colour usually wants, and it is what the old catalogue held.

### 9. The id scheme changed twice in one session, which the map had to absorb

Merging ranges retired 143 ids that had existed for exactly one commit. Rather
than a second map file, `buildIdMigration.mjs` now takes every superseded
snapshot at once and unions the result, and the store applies that one map at
both v2 → v3 and v3 → v4.

That only works because no entry's target is itself a key — otherwise the
second pass would resolve one hop further and land somewhere nobody chose. The
script asserts it rather than assuming it, and refuses to write a map that
fails, alongside a check that every target exists in the catalogue.

433 entries now: 290 legacy ids, 143 merged-away ones.

## Numbers

| | Before | After |
| --- | --- | --- |
| Paints | 310 | 2,279 |
| Citadel / Vallejo / Army Painter | 104 / 139 / 67 | 378 / 1,203 / 698 |
| Paints with no range | 206 | 0 |
| Paints with equivalents | partial | all |
| Paints whose equivalent tiles repeat | — | 0 (was 492 pre-merge) |
| Snapshot on disk | 176 KB indented | 1.14 MB minified |
| Bundle (gzip) | — | 274 KB |
| Tests | 101 | 120 |

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

**"Keep every variant" and "remove duplicates" are the same decision seen from
two sides.** The variants worth keeping are the ones that differ in something
the user can see. Air and Base Abaddon Black differ in a label; Layer and Air
Administratum Grey differ in colour. Only the second is a variant to a person
holding a pot of paint, and the rule that separates them is just "is any
rendered field different".

## Not done

- **Screenshots were not regenerated.** The catalogue content and the equivalent
  tiles both changed, so `store/` screenshots are stale. `npm run screenshots`
  fails on this machine — Edge will not launch under puppeteer-core, unrelated
  to this work. Tracked in OPEN-ITEMS.
- **Shop links were remapped, not re-crawled.** 186 of 191 survived; the other
  2,093 paints have no link. Dormant while `featureFlags.markdownExport` is
  off. Tracked in OPEN-ITEMS.
