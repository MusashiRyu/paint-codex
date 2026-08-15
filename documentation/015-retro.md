# Retro 015 — The About sheet, and the credits the app owed

The prompting problem was simple: **the paint data and the design are both
other people's work, and the app itself acknowledged neither.** Both credits
existed only in `store/listing.md`, which is read once before installing and
never again. An app built from two other people's contributions should say so
on the device it runs on.

## What was done

### 1. The app had nowhere to put it — which was its own problem

`App.tsx` was one card and two sheets. No settings screen, no about screen, no
menu, no router. The credits needed a home, and none existed.

So `AboutSheet` leads with what the app is, then the support section, then
credits, privacy and the trademark disclaimer. The credits are the part that
justified the sheet.

Reached from an ⓘ `IconButton` in the header. `.headerWrap` was already
`justify-content: space-between` with a single child, so it had been built
expecting a right-hand item — no layout change was needed.

### 2. The support action is a GhostButton, and that was the interesting decision

`GoldButton` is the loudest control in the app. The support action did not get
it.

The mechanical reason is that `GoldButton` is round and icon-only, so a text
label was never going to fit. The real reason is the second one: the design
system caps the gold gradient at two instances, both already spent (the FAB and
the add button), and the About sheet is an informational surface — putting the
app's heaviest control on it would make that control read as the point of the
screen. It is not the point of the screen. The credits are.

`GhostButton size="lg" block` is the same control CREATE LIST uses — the
established committing action inside a sheet.

### 3. `target="_blank"` is load-bearing, not decoration

The app had never opened an external URL, so there was no mechanism for it. No
`@capacitor/browser`, no `@capacitor/app-launcher`, no `window.open`, not one
`<a href>` in `src/**`.

It turns out none is needed: Capacitor's Android bridge implements
`onCreateWindow`, so an off-origin `target="_blank"` navigation is handed to the
system browser. Without `target`, the same link loads *inside* the WebView and
replaces the app with a website, with no way back.

That made `target`/`rel` a correctness contract rather than boilerplate, so it
lives in `shared/lib/externalLink.ts` as one constant rather than being
hand-typed per anchor — which also means a single file changes if a device ever
fails to hand off and `@capacitor/browser` becomes necessary. `noreferrer` is
in there for the same reason: the privacy policy now claims the destination is
not told where the visit came from, and that has to be true of every link, not
of the ones someone remembered.

`AboutSheet.test.tsx` asserts the pair across **every** link the sheet renders
rather than a chosen one, because neither failure is visible in a browser.

**Still unverified on hardware.** The project already has one web API that
silently does nothing inside the WebView — the blob download in `handleExport`,
OPEN-ITEMS item 1 — so "it works in `npm run dev`" proves nothing here.

### 4. Two things were extracted rather than copied

`ACTION_ICON` was local to `ListsPanel` and the header button needed the same
24px grid and stroke weight; it moved to `shared/ui/actionIcon.ts`. `GhostButton`
gained an `href` variant as a union type — `onClick` and `href` are mutually
exclusive, because a control that leaves the app has nothing to disable and no
handler to run.

Its stylesheet now states `display`, `text-align` and `text-decoration`
explicitly. A `<button>` already centers its label, sits inline-block and has no
underline; an `<a>` does none of the three, and without those the two renderings
would have been *nearly* identical, which is the worst kind.

### 5. A version display that cannot go stale

The About sheet shows the version — `App.getInfo()` on device, falling back to
`APP_VERSION` in `config.ts` on web. That fallback is a second source of truth
for a number that already lives in `android/app/build.gradle`, and it is shown
only on the path nobody tests on, so it would rot silently.

`src/test/appVersion.test.ts` reads `build.gradle` and pins the two together.
Bumping `versionName` for a release now fails CI until the constant follows.

## Files changed

### New
- `src/features/about/AboutSheet.tsx`, `AboutSheet.module.css`
- `src/shared/ui/ExternalLink.tsx`, `ExternalLink.module.css`
- `src/shared/lib/externalLink.ts`, `src/shared/ui/actionIcon.ts`
- `src/test/AboutSheet.test.tsx`, `src/test/appVersion.test.ts`
- `documentation/015-retro.md`

### Modified
- `src/app/config.ts` — `appConfig.links`, `supportLink` flag, `APP_VERSION`
- `src/app/App.tsx` — header About action, third sheet, third `useBackDismiss`
- `src/features/lists/ListsPanel.tsx` — imports the extracted `ACTION_ICON`
- `src/shared/ui/GhostButton.tsx` / `.module.css` — anchor variant
- `store/listing.md` — the About screen's links, and the reviewer note
- `store/privacy-policy.md` — "Links that leave the app"; "Third parties" no
  longer claims there are none full stop
- `documentation/0.1-architecture.md`, `0.2-design-system.md`,
  `release-checklist.md`, `OPEN-ITEMS.md`

## Decisions taken

- **Affiliate links deferred**, as OPEN-ITEMS item 6. They are blocked on
  choosing a retailer that actually runs a program — vliegeruit.com has no
  known one, so the existing 186 links earn nothing however complete they get.
- **No new runtime dependency.** Still four, which is what `listing.md`'s Data
  safety reasoning is built on. If the device test forces `@capacitor/browser`,
  that sentence has to be corrected before submission.

## Assumptions made

- **The support page is taken on trust.** `config.ts` points at a page supplied
  by the developer. It could not be checked from here — the host answers
  automated requests with a 403 — so the on-device test in the release
  checklist is the only thing that confirms the link lands somewhere real.
- **The paint-data credit follows `listing.md`** as of retro 014
  (`Arcturus5404/miniature-paints`, MIT, Miniature Painter Pro team) rather than
  the older redgrimm attribution.

## Open items

See [OPEN-ITEMS.md](OPEN-ITEMS.md). Item 6 is new. Nothing here blocks
submission, but one thing gates it: the on-device check that the About sheet's
links open the system browser at all, and land on the right pages.
