# App icon

Drop the master mark here and run `npm run icons`. One source file becomes
every launcher icon, every splash canvas and the Play listing icon.

```
tools/icons/source/icon.svg     preferred -- resolution independent
tools/icons/source/icon.png     1024x1024 or larger
```

## What the mark needs to be

- **Square and centered**, on a **transparent** background. The generator adds
  the ground color and the padding each target needs; artwork that bakes in
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
| Adaptive background color | `android/.../values/ic_launcher_background.xml` |
| Splash, both orientations | `android/.../drawable-{port,land}-*/splash.png` |
| iOS app icon, 1024px | `ios/.../Assets.xcassets/AppIcon.appiconset/` |
| iOS launch image, 2732px square | `ios/.../Assets.xcassets/Splash.imageset/` |
| Play listing icon, 512px | `store/graphics/icon-512.png` |
| Browser tab icon | `public/favicon.svg` |

The adaptive background is a color resource rather than a bitmap, so it is
written from the `BACKGROUND` constant in `generate-icons.mjs`. Change the
color there, not in the XML — the XML is regenerated.

## iOS

Covered, from the same source mark. Two things about it differ from Android and
are worth knowing before changing the code that writes them:

- **The app icon is flattened to remove the alpha channel.** App Store Connect
  rejects an upload whose icon carries one, and it does so *after* the archive
  and upload rather than during the build — a long way to travel on a borrowed
  Mac to find out. It is one 1024px master; iOS renders every smaller size.
- **The launch image is square, and its mark is much smaller than Android's.**
  `LaunchScreen.storyboard` displays it with `scaleAspectFill`, which crops a
  square source hard on a tall phone — only about 46% of its width survives on
  a 6.9" iPhone. `IOS_SPLASH_MARK_RATIO` is Android's 0.32 divided through by
  that, so the mark lands at the same apparent size on both platforms.

The `Contents.json` files in each imageset are Capacitor's and already name the
paths the generator writes, so they are read rather than written.
