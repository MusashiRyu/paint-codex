# App icon

Drop the master mark here and run `npm run icons`. One source file becomes
every launcher icon, every splash canvas and the Play listing icon.

```
tools/icons/source/icon.svg     preferred -- resolution independent
tools/icons/source/icon.png     1024x1024 or larger
```

## What the mark needs to be

- **Square and centred**, on a **transparent** background. The generator adds
  the ground colour and the padding each target needs; artwork that bakes in
  its own background will sit as a visible square inside the adaptive icon's
  mask.
- **Minimal internal padding.** The script insets the mark to Android's 66dp
  adaptive safe zone. Padding already in the artwork is added on top of that
  and the icon ends up looking small next to its neighbours on the home screen.
- **Legible at 48px.** That is the real launcher size. Fine strokes and small
  text disappear; the app's Cinzel wordmark will not survive it. A single bold
  silhouette will.
- **Reading on near-black.** The ground is `#050409`, the app's `--bg-page`.
  A dark mark will vanish into it; the gold palette (`--gold`, `#c9a86a`) is
  what the rest of the app uses against this ground.

## What gets written

| Output | Where |
| --- | --- |
| Legacy launcher icon, 48dp | `android/.../mipmap-*/ic_launcher.png` |
| Round launcher icon | `android/.../mipmap-*/ic_launcher_round.png` |
| Adaptive foreground, 108dp canvas | `android/.../mipmap-*/ic_launcher_foreground.png` |
| Adaptive background colour | `android/.../values/ic_launcher_background.xml` |
| Splash, both orientations | `android/.../drawable-{port,land}-*/splash.png` |
| Play listing icon, 512px | `store/graphics/icon-512.png` |
| Browser tab icon | `public/favicon.svg` |

The adaptive background is a colour resource rather than a bitmap, so it is
written from the `BACKGROUND` constant in `generate-icons.mjs`. Change the
colour there, not in the XML — the XML is regenerated.

## iOS

Not covered. `ios/App/App/Assets.xcassets/AppIcon.appiconset` still holds the
Capacitor placeholder and needs the same treatment before an App Store
submission; nobody has needed it yet because the iOS build is Mac-only.
