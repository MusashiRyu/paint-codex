# Store submission material

Everything Google Play asks for that is text or artwork rather than code.

| File | What it is |
| --- | --- |
| [`listing.md`](./listing.md) | App name, short and full description, categorisation, target audience, App access, and every Data safety answer with its reasoning. |
| [`privacy-policy.md`](./privacy-policy.md) | The privacy policy. **Needs publishing at a public URL** before submission — Play requires a link, not a file. |
| `graphics/` | Generated. Do not hand-edit; regenerate. |

The mechanics of building and uploading a release are in
[`documentation/release-checklist.md`](../documentation/release-checklist.md).

## Regenerating the graphics

```bash
npm run icons             # needs tools/icons/source/icon.svg -- see tools/icons/README.md
npm run build             # screenshots serve dist/, they do not build it
npm run screenshots
npm run feature-graphic
npm run listing:check     # copy against Play's character limits
```

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
