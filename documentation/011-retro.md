# Retro 011 — The real app icon

The icon pipeline built in 008 had been sitting idle waiting on artwork. The
artwork arrived, so this session is mostly running one command and checking
what came out.

## What was done

### 1. The mark

`tools/icons/source/icon.svg` — a paint drop above an open codex, filled with
the app's own gold ramp (`#e4c98a` → `#c9a86a` → `#b3903f`, the `--gold-bright`
/ `--gold` / `--gold-deep` tokens). Square viewBox, transparent ground, centred
on x=256, and close to edge-to-edge vertically, which is what the generator
wants — it adds each target's padding itself.

It survives the test that matters: at 48px, the mdpi launcher size, the drop
and the book still read as two distinct shapes.

### 2. 29 assets generated, and looked at

`npm run icons` wrote five density buckets across three shapes, eleven splash
canvases, the 512px Play icon, `public/favicon.svg` and the ground colour
resource.

Checked rather than assumed, because each of these fails differently:

- **512px Play icon** — flattened onto `#050409`, no alpha, as Play requires.
- **Adaptive foreground** — transparent, mark comfortably inside the 66dp safe
  zone, so no launcher mask clips it.
- **Splash** — the app's near-black with the mark centred. The white Capacitor
  splash is gone, which was the other half of this item.
- **Inside the bundle** — `mipmap-xxxhdpi/ic_launcher.png` went from
  Capacitor's 2786 bytes to 3015, confirming the AAB carries the new art rather
  than a cached resource.

### 3. Screenshots regenerated

Not part of the icon work, but the store screenshots were captured in 008 and
the UI has since been through the token layer and the `shared/ui` extraction.
They were showing an app that no longer exists.

The capture script survived the refactor untouched — the primitives kept the
accessible names and placeholders its selectors depend on
(`aria-label="Add paint"`, `placeholder="List name..."`). Worth noting that two
of its steps use `?.click()` and would have silently no-opped had that not held,
so the shots were verified by eye rather than by the script exiting zero.

## Files changed

### New
- `tools/icons/source/icon.svg`
- `documentation/011-retro.md`

### Modified
- `android/.../mipmap-*/` (15 files), `drawable-*/splash.png` (11),
  `values/ic_launcher_background.xml`
- `public/favicon.svg` — was still Vite's logo
- `store/graphics/icon-512.png`, `store/graphics/screenshots/` (4)
- `README.md`, `documentation/OPEN-ITEMS.md`,
  `documentation/release-checklist.md` — icon item closed, items renumbered

Release bundle builds and signs; 4.99 MB.

## Measured, and found not to be a problem

- **The exit-255 that was not a failure.** `npm run android:build:release`
  piped through PowerShell reported exit 255 while Gradle reported
  `BUILD SUCCESSFUL` and exit 0. Windows PowerShell 5.1 wraps a native
  command's stderr in ErrorRecords when it is redirected, which sets `$?`
  false regardless of the real exit code. The build was fine. Do not chase
  this one again.

## Open items

See [OPEN-ITEMS.md](OPEN-ITEMS.md). One shipping blocker left — the privacy
policy needs a public URL — and it needs a decision, not code.
