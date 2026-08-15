# Store submission material

Everything Google Play and the App Store ask for that is text or artwork rather
than code.

| File | What it is |
| --- | --- |
| [`listing.md`](./listing.md) | **Play.** App name, descriptions, release notes, contact details, categorization, target audience, App access, and every Data safety answer with its reasoning. |
| [`listing-appstore.md`](./listing-appstore.md) | **App Store.** Name, subtitle, keywords, promotional text, description, App Privacy answers, age rating, and the reviewer notes. |
| [`privacy-policy.md`](./privacy-policy.md) | The privacy policy, shared by both. **The source** — edit this one. |
| `docs/privacy.html` | Generated from the markdown. Self-contained: no external stylesheet, font or script, so it can be dropped on any host. Live at `https://musashiryu.github.io/paint-codex/privacy.html`. |
| `graphics/` | Generated. Do not hand-edit; regenerate. |

**Two listing files rather than one.** The stores do not ask for the same
things: Play wants a short description and a long one, Apple wants a subtitle,
a 100-character keyword list and promotional text that can be changed without
shipping a build. `npm run listing:check` checks both against their own limits.

The mechanics of building and uploading are one file per store:
[`release-checklist.md`](../documentation/release-checklist.md) for Play,
[`ios-release-checklist.md`](../documentation/ios-release-checklist.md) for the
App Store.

## Regenerating the graphics

```bash
npm run icons             # from tools/icons/source/icon.svg
npm run build             # screenshots serve dist/, they do not build it
npm run screenshots
npm run feature-graphic
npm run privacy           # privacy-policy.md -> docs/privacy.html + docs/index.html
npm run listing:check     # both listings against their own character limits
```

`npm run screenshots` writes both stores' sets in one run: `screenshots/` at
1080×1920 for Play and `screenshots-ios/` at 1290×2796 for the App Store.

Screenshots are the one asset that goes stale invisibly — they are captured
from the built app, so any visual change invalidates them and nothing
complains. Re-run them after a UI change.

`graphics/` is committed rather than ignored. It is a few megabytes, and having
the exact assets that were uploaded sitting next to the copy that describes
them is worth more than the space — otherwise "which icon is live?" has no
answer but the Console.

## Why the copy lives here and not in the Console

Store copy written directly into a web form is reviewed by nobody, versioned
nowhere, and rewritten from memory every time it changes. Keeping it in the
repo means the character limits are checked automatically, the trademark
disclaimer cannot quietly disappear, and the Data safety answers carry their
reasoning — so the next person to fill that form in does not have to re-derive
whether fetching a public URL counts as collecting data.
