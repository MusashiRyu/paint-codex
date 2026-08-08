# Store submission material

Everything Google Play asks for that is text or artwork rather than code.

| File | What it is |
| --- | --- |
| [`listing.md`](./listing.md) | App name, descriptions, release notes, contact details, categorisation, target audience, App access, and every Data safety answer with its reasoning. |
| [`privacy-policy.md`](./privacy-policy.md) | The privacy policy. **The source** — edit this one. |
| `docs/privacy.html` | Generated from the markdown. Self-contained: no external stylesheet, font or script, so it can be dropped on any host. Live at `https://musashiryu.github.io/paint-codex/privacy.html`. |
| `graphics/` | Generated. Do not hand-edit; regenerate. |

The mechanics of building and uploading a release are in
[`documentation/release-checklist.md`](../documentation/release-checklist.md).

## Regenerating the graphics

```bash
npm run icons             # from tools/icons/source/icon.svg
npm run build             # screenshots serve dist/, they do not build it
npm run screenshots
npm run feature-graphic
npm run privacy           # privacy-policy.md -> docs/privacy.html + docs/index.html
npm run listing:check     # copy against Play's character limits
```

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
