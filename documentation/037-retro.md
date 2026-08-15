# Retro 037 — Reading the open items instead of adding to them

A walkthrough of every item in `OPEN-ITEMS.md`, item by item, to decide what
each one is actually for. Thirteen items went in and nine came out. Of the four
that closed, exactly one was closed by doing the work it described.

## The list had been quietly damaged

Item 7 — an item still awaiting an answer from App Store review — had lost its
heading and its entire lead blockquote. Commit `bae0d79`, a small correction
about Play's default language, removed 27 lines it had no business touching.
What survived was the *tail* of item 7, sitting under item 3's heading.

So the file had been presenting a live open item as though it were part of
"The cached catalog is ~2.2 MB of localStorage", an item marked **Watch, not
fix**. Anyone scanning headings — which is the only way a 380-line file gets
read — would have seen a storage note and moved on.

The lost blockquote was not filler. It held the newest reasoning in the item —
among it, that an information request from a reviewer is not a pass on
everything else. All of it restored verbatim from `ee5da94`.

**The numbers were never stable identifiers.** Walking the file's history for
item 7's heading turned up that `### 4.` has meant three different things —
"Sheet chrome is duplicated", "iOS signing and archive are Mac-only", and "The
cached catalogue is ~2.2 MB" — at different times. Retro 024's "item 4 narrowed"
therefore points at nothing recoverable. The numbers are labels within a
snapshot of the file, not references, and older retros citing them should be
read that way.

## What the walkthrough actually found

Nine of the thirteen needed no decision at all, which is worth saying plainly
because it is the useful output of a review like this:

- **Three are correctly parked.** Items 3 (localStorage headroom) and 6 (`npm
  audit`) are watch-items; 9 (no Swift compile in CI) is deferred on macOS
  runner cost against two untouched template files. `npm audit --omit=dev` was
  re-run and still reports **0**, so item 6's premise holds.
- **Four are one device session behind one push.** Items 10, 13 and 16 are all
  "unverified on an iPhone", and item 12 is the build they are waiting on.
  Master was pushed during this session (`fa6a127`), which unblocks the release
  workflow and therefore all four.
- **Item 5** (affiliate revenue) is blocked on a commercial decision and is
  correctly waiting for install numbers that do not exist pre-launch.
- **Item 15** is a dropdown in App Store Connect.

That left four real decisions.

## The export feature is gone

Items 1 and 2 had been carried since 005 and 014 as separate open items. Both
were dormant behind `appConfig.featureFlags.markdownExport`, which has been
`false` since it was introduced. Item 1 said mobile export needs
`@capacitor/filesystem` and `@capacitor/share` before the flag can go on; item 2
said the shop-link snapshot covers 186 of 2,279 paints and would need a heavy
re-crawl.

Neither was ever going to be done. A flag whose only value has been `false` for
eleven releases is not optionality — it is unreachable code with a switch on it,
and two open items describing repairs to unreachable code overstate what is
outstanding.

Deleted:

| File | What it was |
| --- | --- |
| `src/features/export/markdownExport.ts` | The generator |
| `src/domain/shopLinkRepository.ts` | `getShopLinks()` |
| `src/data/shopLinks.snapshot.json` | 26 KB, 186 of 2,279 paints |
| `tools/scraper/scrapeShopLinks.mjs` | The vliegeruit.com crawl |
| `src/test/markdownExport.test.ts` | Six tests |

Plus the `markdownExport` flag and its interface field, `App.handleExport` and
its `exportFlash` state, `ListsPanel`'s `onExportList`/`exportFlash` props and
the export `IconButton`, the `.exportFlash` CSS rule, two `ListsPanel` tests,
and the `scrape:shoplinks` npm script.

Two things fell out that the grep for the feature name would not have found:
`appConfig` became an unused import in `App.tsx` — the export flag was the only
thing App read from config — and `tools/scraper/types.ts` lost its last
notional consumer. The types file was **kept**: it is the shape any future
scraper starts from, and item 5's affiliate work is the likely caller. That is
recorded in the scraper README rather than left for someone to rediscover.

Tests went 222 → 214. Lint, typecheck and `check:layout` all clean.

**This does interact with item 5**, which wanted the scraper retargeted at an
affiliate retailer. Deleting it is still right: both the scraper and the
snapshot were aimed at vliegeruit.com, which has no affiliate program and is
therefore not the retailer that work would use. Item 5 now says "written from
scratch" instead of "retargeted", which is what it always meant.

## Item 8 may not be an item

Item 8 — twelve testers for fourteen continuous days — has been called the
longest pole to a public Play release since 025. The requirement is real, but it
applies to **personal** developer accounts registered after late 2023.
Organization accounts are exempt and can apply for production without a closed
test at all.

Nobody has checked which kind of account this is. Eleven retros of release
planning have been shaped by a constraint whose premise costs one console screen
to confirm. The item now says so, and says where to look.

That is the pattern this session kept running into, and it is worth naming: an
item that has been carried long enough starts being treated as a fact about the
world rather than a claim someone once wrote down. Item 8 is the clearest case,
item 7's damage is the most consequential, and the unstable numbering is the
mechanism that let both hide.

## The homework came back, and both items closed

Two console checks were handed off at the end of the walkthrough. Both came
back the same day, and both closed their items outright.

**Item 8 was never real.** The account is an **organization** account, which
Google exempts from the twelve-tester requirement entirely. Production can be
applied for without a closed test at all. An item carried since retro 025 as
"the single longest pole in the schedule" — language this repo used in
`release-checklist.md` as well as in OPEN-ITEMS — evaporated on one console
screen.

Its trailing half was stale too, and in a way worth recording separately: the
item said the package name registration was "still in **Draft** pending the app
signing key's SHA-256". `release-checklist.md` line 41 has said since
2026-08-10 that it is **done**, and that "earlier revisions of this file listed
it as an outstanding Draft; it was not, because Google now registers package
names itself." The checklist corrected itself and OPEN-ITEMS never heard about
it. So item 8 was two claims, both false, sitting under a heading nobody
reread.

**Item 15 is done.** App Store Connect's primary language is English (U.S.) as
of 2026-08-15. The pair item 14 described — American copy under a listing
declaring itself British — is consistent on both halves for the first time.

`release-checklist.md` needed four edits to catch up, which is the real cost of
having let this drift: step 0's 12-testers note, the "one thing is outstanding"
summary near the top, step 6's framing of closed testing as a gate, and the
pointer back to step 0 that told the reader not to assume production was close.
The note itself is **kept rather than deleted** — it is still the first thing
to check on any new account, and a future reader who finds a populated closed
track deserves to know why it was started. It now says why it does not bind
here, and adds the one caveat that matters for a *converted* account: the rule
is written about account type at registration, so trust the console's own
behavior over the rule as stated.

## Where the release actually stands now

Play has no blockers left. Production is a decision, not a wait.

The App Store is down to item 12, and item 12 is down to its mechanical tail:
push, run the workflow, attach the build, record the flow on the phone, reply.
The device session that recording requires is the same one that closes items 10,
13 and 16.

Four items closed today. One of them — the App Store language — was closed by
doing what it asked. The other three were closed by finding out they described
work nobody was ever going to do, or work that had already been done and never
recorded back. That ratio is the argument for reading the list end to end
occasionally instead of only appending to it.
