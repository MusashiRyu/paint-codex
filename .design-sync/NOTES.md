# design-sync notes — Paco

Repo-specific gotchas for future syncs. Read this before re-running.

## The repo is an app, not a library

Paco is a Capacitor/React application (`private: true`, no `main`/`exports`,
no library build). Two consequences the converter cares about:

- **`src/index.ts` is the design-system barrel**, added for this sync. It is
  not imported by the app — `main.tsx` is the app entry. `--entry ./src/index.ts`
  is what makes `PKG_DIR` resolve to the repo root; without it the converter
  looks for `node_modules/paco` and exits `[NO_DIST]`.
- **Components must be pinned in `componentSrcMap`.** There is no `.d.ts` tree
  to discover from (`[DTS] parsed 0 .d.ts files`), and the synth-entry fallback
  only fires when no `--entry` is passed. Without the pins the build reports
  `[ZERO_MATCH] no component exports — treating as tokens-only DS`. Adding a
  component to `src/index.ts` therefore also needs a `componentSrcMap` entry.

## `App` is deliberately not synced

`App.module.css` reaches for `/imagery/bg-page.png` and `/imagery/bg-card.png`,
served from `public/` at the web root. esbuild cannot resolve absolute URLs and
the build fails with `[UNRESOLVED_IMPORT]`. `App` is the shell anyway — it owns
the store wiring, so nothing can compose with it. If it is ever wanted, the
imagery has to become a bundled asset first.

## Tokens ride in the JS bundle, not via `@import`

`cfg.cssEntry` is appended into `_ds_bundle.css` **verbatim — its `@import`s are
not inlined**. Pointing `cssEntry` at `src/shared/styles/global.css` produced
`@import './tokens.css'` next to a `_ds_bundle.css` that had no `tokens.css`
beside it: a dangling import, and every `var(--gold)` resolved to nothing.

The fix is `import './shared/styles/tokens.css'` at the top of `src/index.ts`,
so esbuild inlines the tokens into the bundle CSS. **Do not remove that import.**
`cfg.tokensGlob` is not an option here — `copyTokens` returns early unless
`cfg.tokensPkg` names a package in `node_modules`, and Paco's tokens are in-repo.

## Fonts need a bundle-relative stylesheet

`src/shared/styles/fonts.css` uses `url('/fonts/*.woff2')` — absolute, because
the app serves them from `public/`. `extractFonts` resolves url()s relative to
the CSS file's own directory, so absolute paths resolve to `C:\fonts\…`, miss,
and nothing is copied: 14 `@font-face` rules shipped with no font files, and
every design would have rendered in a fallback serif.

`.design-sync/fonts.bundle.css` is the same file with the paths rewritten to
`../public/fonts/`, and `cfg.extraFonts` points at it. Regenerate it whenever
`src/shared/styles/fonts.css` changes:

```sh
sed "s|url('/fonts/|url('../public/fonts/|g" src/shared/styles/fonts.css > .design-sync/fonts.bundle.css
```

## `cfg.cssEntry` is a hand-written file

`.design-sync/ds-styles.css` is the DS-appropriate half of the app's
`global.css`: the box-sizing reset and body typography, but **not**
`html, body, #root { height: 100%; overflow: hidden }` or the hidden
scrollbars. Those exist so the app fills a device viewport and never
page-scrolls; imposed on a design canvas they clip whatever is being laid out.
If `global.css` gains something the library should have, copy it across by hand.

## Known render warns

- **Preview cards render on white.** The card harness hard-codes
  `<style>body{…background:#fff}</style>` *after* the stylesheet links, so it
  beats `body { background: var(--bg-page) }`. This is a preview-card artifact
  only — real designs get the `styles.css` closure with no such override. Every
  authored preview therefore wraps its content in its own dark `Panel`/`Frame`.
  Do not fork `lib/emit.mjs` to "fix" this; it defines the app contract.
- **`[GRID_OVERFLOW]` on ListsPanel, PaintItem, Sheet, TextField** — resolved
  with `cardMode: "column"` in `cfg.overrides`. Expected, already applied.
- **Sheet previews must autofocus their input.** Without it the focus trap
  lands on the close button and the card shows a browser focus ring that looks
  like a defect. Both real sheets autofocus, so this is faithful, not a hack.

## Not statically renderable

- **SearchSheet results, the equivalents grid and the ΔE pills.** They need a
  typed query or a click on "BROWSE FULL CATALOG"; `query` is internal state
  with no prop. Only `EmptyPrompt` is captured. The delta pills are covered
  instead by `Badge`'s `DeltaScale` story. Composing a fake result card was
  deliberately rejected — it would be a lookalike, not the real component.
- **ListsPanel rename mode**, for the same reason (internal `renaming` state).

## Re-sync risks

- **`fonts.bundle.css` is a copy.** It silently rots if `fonts.css` gains a
  weight or subset. Regenerate with the `sed` above and diff before trusting it.
- **`ds-styles.css` is a hand-maintained subset of `global.css`.** Drift here is
  invisible: designs would simply lack a global the app has.
- **`componentSrcMap` is an enumeration, not a discovery.** A component added to
  `shared/ui/` will be silently absent until it is added to both `src/index.ts`
  and the map.
- **The `paco` package version is `0.0.0`** (`private: true`), so the README
  version is meaningless and cannot be used to detect drift.
- **No browser on this machine can be driven except the installed Playwright
  chromium.** `npm run screenshots` (puppeteer-core → Edge) fails with
  `Failed to launch the browser process: Code: 0`; the repo's own store-screenshot
  tooling is therefore unusable here. Playwright chromium-1234 was installed for
  the render check and works.
- **Playwright lives in `.ds-sync/`, deliberately not in the app's
  `package.json`.** It was installed there first and then moved: as an app
  devDependency it would put a ~200 MB browser download into CI's `npm ci` for
  a tool the app itself never uses (the repo's own screenshot script uses
  `puppeteer-core`). `.ds-sync/` is gitignored, so a fresh clone re-installs it
  with the other converter deps — `cd .ds-sync && npm i esbuild ts-morph
  @types/react playwright`. The browser binaries are cached globally and survive.
- **Grades were all `carried forward` with zero cleared** on the final capture,
  so a re-sync with unchanged sources should re-verify nothing.
