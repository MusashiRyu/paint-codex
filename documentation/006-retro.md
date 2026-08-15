# Retro 006 — Hardening the Runtime Catalog

Follow-up to the 005 audit, after the runtime catalog refresh landed. The
refresh changed two things the earlier findings assumed: the app now makes a
network request, and the catalog is now parsed from a third party at runtime
rather than only at build time. Everything here follows from those two facts.

## What was done

### 1. Upstream is validated, not trusted

`parsePaintCatalog` was written against a document that was only ever read on a
developer's machine, where a bad parse shows up immediately. It now runs on
users' phones against whatever upstream happens to serve.

Two gaps, both latent rather than live — every one of the 1296 colors in the
current snapshot is a well-formed six-digit hex:

- The hex pattern accepted `{3,6}` digits and passed them through unchanged. A
  four- or five-digit value is not a color any browser renders, so the swatch
  would come out invisible, and `hexToHSL` slices six digits unconditionally
  and would have answered `NaN`. Three-digit values now expand to six, anything
  else is dropped, and the digit run is bounded so a longer value is refused
  rather than silently truncated to its first six.
- `parseFloat` on the delta had no finiteness check, and `[\d.]+` also matches
  `...`. A `NaN` delta sorts unpredictably and renders as `Δ NaN`.

Dropping a malformed entry costs one paint. Letting it through puts an
unrenderable swatch on screen. Live upstream still parses byte-identically to
the bundled snapshot.

### 2. The tools/src import boundary now actually holds

`.oxlintrc.json` has forbidden `tools/` from importing app code since before the
refresh. A probe showed it was not doing so:

| Import in `tools/` | Before | After |
| --- | --- | --- |
| `'src/domain/types'` | blocked | blocked |
| `'@/domain/types'` | **passed** | blocked |
| `'../../src/domain/types'` | **passed** | blocked |
| `'../../src/domain/paintCatalogSource.ts'` | passed | allowed, explicitly |

`@/*` matches one path segment, so it never covered `@/domain/types`, and no
pattern covered relative specifiers — which is how imports are actually
spelled. The rule was passing by accident.

It also needed an exception rather than a loophole: `tools/scraper` imports
`parsePaintCatalog` deliberately, so that a bundled snapshot and a refreshed
one cannot disagree about the same markup. That edge is now named in the rule's
message. The reverse direction (`src/` importing build tooling) had the same
relative-path gap and was fixed to match.

### 3. An alarm for the silent refresh

The refresh swallows every failure by design, and that is right for the user —
being offline is normal and deserves no dialog. The cost lands on us: if
redgrimm changes their markup, the parse drops under the rejection floor, every
install quietly falls back to the snapshot it shipped with, and the first
signal is a bug report months later.

`tools/scraper/checkUpstream.mjs` runs the same parser against the live
document, and `.github/workflows/upstream-check.yml` runs it weekly, on demand,
and on any change to the parser, the snapshot or the scraper — so a parser edit
is checked against the real page and not only against synthetic fixtures.

It fails on a fetch error, a parser throw, a count under the floor, or an
unusable color. A snapshot that has merely fallen behind upstream is reported
rather than failed: the runtime refresh already covers that, and it only means
new installs ship slightly older data.

Verified in both directions — it passes today at 310 of 310 paints, and
renaming upstream's `<strong>` tags drops the parse to 0 and exits non-zero.

### 4. Documentation that had gone false

- The conventions list still claimed *"the app makes no network request of its
  own. Keep it that way"*, three bullets below the entry describing the
  refresh. Replaced with the rule that actually applies: the refresh is the one
  request, and a second needs as good a reason — it exists because paint data
  goes stale between releases, and it degrades to "no change" rather than to a
  broken screen. Added a companion convention that upstream is untrusted input.
- `plan.md` still said the scraper duplicates its own types. It imports them.

## Files changed

### New
- `tools/scraper/checkUpstream.mjs`
- `.github/workflows/upstream-check.yml`

### Modified
- `src/domain/paintCatalogSource.ts` — `normalizeHex`, bounded hex pattern, finite-delta guard
- `src/test/paintCatalogSource.test.ts` — 5 cases for the above
- `.oxlintrc.json`, `package.json` (`check:upstream`)
- `documentation/0.1-architecture.md`, `plan.md`

94 tests pass.

## Measured — don't chase these

- **Reading the cached catalog at import.** Synchronous `localStorage` +
  `JSON.parse` + a signature comparison at module scope looks like a startup
  risk. It is **0.7 ms** on a 105 KB entry. Fine even at ten times that on a
  slow phone.
- **The snapshot's bundle representation.** Vite already emits it as
  `JSON.parse(\`…\`)` rather than an object literal, which is the fast path —
  the usual `json: { stringify: true }` tweak would be a no-op.
- **CORS.** `raw.githubusercontent.com` answers `Access-Control-Allow-Origin: *`
  with `max-age=300` on a 188 KB document. The documented reasoning holds.

## Deferred items

Tracked in [OPEN-ITEMS.md](OPEN-ITEMS.md), the single living list. This section
used to restate the open items and drifted out of date as later retros closed
them; git history has what was outstanding on the day.
