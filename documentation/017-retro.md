# Retro 017 — The pre-launch sweep

A health, architecture and documentation pass over the whole repo with nothing
in particular broken. The interesting result is what it did *not* find: no
TODOs, no `console.*`, no `any`, no `@ts-ignore`, no unused locals, no unused
CSS class, no unused design token, and no drift between the tokens and the
components that consume them. What it did find was concentrated in two places —
files nobody reads until they mislead someone, and one build warning that had
been scrolling past for long enough to stop registering.

## What was done

### The build had a warning, and it was telling the truth

`vite build` had been printing the 500 kB chunk warning on every run. The
advice attached to it — split the big chunk out with a dynamic `import()` — is
the one thing this app must not do. `paintRepository` resolves
cache-then-bundled *at module import* so every read is synchronous and there is
never a paintless first render; making the catalog arrive asynchronously
would make the one thing the app is for the one thing it has to wait for. In a
packaged app the payload is on local disk and costs no round trip.

So the limit is raised to 1600 kB in `vite.config.ts`, with the reasoning
next to it. Raised, not switched off, and set just above the current 1,474 kB:
a fourth brand would trip it again, and that is exactly when someone should
look. A warning that is correct to ignore should be configured away with its
reason recorded, not ignored every day forever.

### `plan.md` had become a lie at the repo root

The pre-build plan sat in the root directory, next to `README.md`, where it read
as current documentation. It is not:

- it defers the runtime catalog refresh, which shipped in 013;
- it lists `src/features/browse/*` — `BrandFilter`, `PaintCard`, `ResultsGrid` —
  deleted in 005;
- it lists `useDarkMode.ts` and `hexToHSL`, which were never built;
- it says CI is not yet configured. It has been since 005.

Deleting it would have thrown away the only record of why the folders are
shaped the way they are and what was deliberately excluded at the start. So it
moved to `documentation/000-plan.md` — the number puts it before `001-retro.md`,
which is where it belongs chronologically — with a superseded banner naming
each false statement so nobody has to work out which parts still hold.

### The README opened with the Vite template

Thirty-two lines about `@vitejs/plugin-react` versus `plugin-react-swc`, the
React Compiler, and how to enable type-aware lint rules — none of it written
about this project, all of it the first thing a reader saw. Replaced with what
Paco is, what it is built on, how to run it, and where the documentation lives.
Everything below that point was already this project's own and stayed.

### Dead code

- **`getAutocompleteSuggestions`** in `features/search/search.ts` had no caller
  anywhere in the app — only four tests, which existed solely to exercise it.
  Removed, tests included. A test that is the only reason a function is not dead
  is not coverage; it is a second copy of the same dead code.
- **`initializeSearchIndex`** was exported but only ever used inside its own
  module. It is now a `FUSE_OPTIONS` constant and a `new Fuse(...)` at the call
  site — which also made it worth writing down *why* the index is rebuilt per
  call rather than memoised: the catalog can be swapped underneath by the
  background refresh, and a cached index would go on answering with paints that
  have left it.
- **`src/assets/`** — `react.svg`, `vite.svg` and `hero.png`, unreferenced from
  anywhere in `src/`, `public/`, `index.html` or `tools/`. Two of them are the
  Vite template's. Directory removed.
- **`tsconfig.tools.tsbuildinfo`** was committed. It is `tsc -b` incremental
  state, rewritten by every build. Untracked and added to `.gitignore` as
  `*.tsbuildinfo`.

### `jsx-a11y` is now on

The lint run was clean, but it was clean partly because it was not looking very
hard. The wider oxlint categories were tried and rejected on evidence rather
than taste — `pedantic` and `suspicious` report the automatic JSX transform as a
missing `React` import in every component, `perf` reports the scraper's
deliberately paced sequential fetches as a bug, and `restriction` objects to
inline comments, which this codebase is largely made of. A linter that has to be
ignored is not a linter, so none of those are enabled.

`jsx-a11y` is different: it caught four real things, all four of which are
deliberate, and it would catch a fifth that was not. It is on, with those four
rules off and the reason for each written beside it in `.oxlintrc.json`
(`.oxlintrc.json` accepts comments, which is what made that possible):

| Rule | Why it is off |
| --- | --- |
| `no-autofocus` | A sheet opens because someone asked for it; the field it exists to fill is the point. The rule is about autofocus on page load. |
| `click-events-have-key-events` | The backdrop click is a convenience on top of Escape and the Android back gesture, both already wired. |
| `no-static-element-interactions` | Same backdrop. Giving a decorative div a key handler would announce it as a control. |
| `prefer-tag-over-role` | `<dialog>` brings a top layer, a `::backdrop` and its own focus and Escape behavior, all of which `Sheet` would have to fight rather than use. |

Verified live by probing it with an `<img>` missing an `alt` — it fires.

### Documentation caught up with the code

- `paintRepository.resetPaints` claimed it was "also used if a cache is
  rejected". It is not, and cannot be: a rejected cache never reaches it because
  `readCachedCatalog` answers `undefined` and the seeding falls through to the
  bundled array on its own. It is a test seam and now says so.
- `0.2-design-system.md` said "Nine components" over a table of ten.
  `ExternalLink` had been added to `shared/ui/` after that sentence was written
  and never counted — and, for the same reason, was missing from the
  `src/index.ts` barrel, which claims to be *the* public surface of the design
  system. Both fixed.
- `0.1-architecture.md` gained rows for `vite.config.ts`, `.oxlintrc.json`,
  `src/index.ts` and `src/domain/shopLinkRepository.ts` — four real files the
  component table did not cover — and its test count moved from 120 to 124.
- `shopLinkRepository.ts` had a one-line doc comment and no trailing newline. It
  now says what it is: no refresh and no cache layer, unlike the paint
  catalog, because it is a build-time crawl behind a flag that is off.

### The release checklist contradicted the open items

`release-checklist.md` opened with **"Nothing is blocking the first
submission"**. `OPEN-ITEMS.md` item 2 said the store screenshots are stale and
"must happen before the next Play submission". Both were written honestly, three
retros apart, and a reader would have hit the contradiction at precisely the
wrong moment. The checklist now opens with the screenshots as the one
outstanding item, and says the privacy policy is live in the same breath.

The screenshot run was retried rather than assumed: `CHROME_PATH` pointed at the
installed Edge produces the same `Code: 0` launch failure, so puppeteer-core
finds the binary and it refuses to start. Installing Chrome is a shorter path
than debugging that.

## Measured, and found not to be a problem

- **`npm audit`** reports three moderate advisories.
  `npm audit --omit=dev` reports zero. The chain is `@capacitor/cli` → `xcode` →
  `uuid`, entirely build tooling, and `npm audit fix --force` would downgrade
  the CLI that builds the release in exchange for nothing a user could be
  affected by. Recorded as OPEN-ITEMS 7 so the number does not cause a scare
  during a release, and so nobody runs the `--force`.
- **Unused exports.** Twenty-eight exports have no consumer outside their own
  file. All but the two removed above are either type exports that are part of a
  function's public signature, or barrel entries — that is what the barrel is
  for.
- **Unused CSS and tokens.** Seventeen module classes looked unused to a naive
  grep and every one is reached through `styles[size]` or `styles[variant]`.
  Every token in `tokens.css` has at least one consumer. Nothing to remove.
- **Unused component variants.** `Sheet size="auto"`, `Swatch size="sm"` and
  `GhostButton size="md"` looked unused because they are the *defaults* and no
  caller passes them by name. All three are rendered. The primitives have no
  dead variants.
- **The lint categories.** Discussed above. `pedantic`, `suspicious`, `perf` and
  `restriction` were each run and each rejected with a specific reason.

## Files changed

**New**
- `documentation/017-retro.md`

**Modified**
- `README.md` — the Vite template header replaced with the project's own; a
  linting section added
- `.oxlintrc.json` — `jsx-a11y` plugin on, four rules off with reasons
- `.gitignore` — `*.tsbuildinfo`
- `vite.config.ts` — `build.chunkSizeWarningLimit`
- `src/features/search/search.ts` — dead function removed, index rationale added
- `src/test/searchUtils.test.ts` — the four tests for it removed
- `src/domain/paintRepository.ts` — `resetPaints` comment corrected
- `src/domain/shopLinkRepository.ts` — documented, trailing newline
- `src/index.ts` — `ExternalLink` added to the barrel
- `documentation/0.1-architecture.md` — four new rows, test count, search row
- `documentation/0.2-design-system.md` — nine → ten components
- `documentation/OPEN-ITEMS.md` — item 2 updated, item 7 added
- `documentation/release-checklist.md` — the blocking-item contradiction fixed

**Moved**
- `plan.md` → `documentation/000-plan.md`, with a superseded banner

**Deleted**
- `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`
- `tsconfig.tools.tsbuildinfo` (untracked, now gitignored)

## Assumptions made

- The bundle stays one chunk. If the catalog ever needs to load
  asynchronously, that is an architecture change with a retro of its own, not a
  build-config tweak.
- `ExternalLink` belongs in the barrel because the barrel's own comment says it
  carries the primitives and `ExternalLink` is one. `.design-sync/config.json`
  keeps its explicit `componentSrcMap`, which is unchanged — adding a preview
  there is design-sync's business, not the barrel's.
- `000-plan.md` is worth keeping. The alternative was deleting it; the folder
  structure it argued for is still the one in use, and that argument is not
  recorded anywhere else.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
