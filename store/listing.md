# Play Store listing

Everything the Play Console asks for, written out so it is reviewed here rather
than improvised into a web form at midnight. Character limits are Google's and
are checked by `npm run listing:check`.

---

## Store listing

**App name** (30 char limit)

```
Paco - Paint Codex
```

**Short description** (80 char limit) — shown under the icon in search results

```
Find paint equivalents across Citadel, Vallejo and Army Painter. Offline.
```

**Full description** (4000 char limit)

```
Paco is a paint conversion table and list keeper for miniature painters.

Found a recipe that calls for a paint you do not own? Paco shows you the
closest equivalents across Citadel, Vallejo and The Army Painter, ranked by how
close the match actually is — not by a guess, but by a measured colour distance
between the two paints.

BUILD YOUR LISTS

Keep a list per army, per project, or per shelf. Give each one a name, an
emblem and a banner colour, and add paints to it as you go. Lists are grouped
by paint category so a long one stays readable.

SEARCH THE CATALOGUE

Fuzzy search across every paint in the catalogue by name or brand. Filter to a
single brand when you already know what you are shopping for. Every result
shows its swatch, its hex value, and the equivalents in the other two ranges
with a delta score for each — so you can tell a near-perfect substitute from a
rough one at a glance.

WORKS WITH THE RADIO OFF

Paco ships the whole catalogue inside the app. There is no loading screen, no
sign-in and no "you appear to be offline". It quietly checks for an updated
catalogue when you open it, and if that check fails — no signal, aeroplane
mode, hobby shop basement — nothing about the app changes.

NO ACCOUNTS, NO ADS, NO TRACKING

There is no sign-up, because there is nothing to sign up to. Paco has no
analytics, no advertising and no crash reporting. Your lists live on your
device and are never uploaded. The app makes exactly one network request, for
the public paint conversion table it is built on, and it sends nothing about
you with it.

—

Paint data is derived from the open paint-conversion table maintained by
redgrimm at github.com/redgrimm/paint-conversion.

Paco is an independent app. It is not affiliated with, endorsed by, or
sponsored by Games Workshop Limited, Acrylicos Vallejo S.L., or The Army
Painter ApS. Citadel, Vallejo and The Army Painter are trademarks of their
respective owners, used here only to identify the paint ranges the app
converts between.
```

**Release notes** (500 char limit) — the "What's new" text for version 1.0.0

```
First release.

Paint conversion across Citadel, Vallejo and The Army Painter, with a measured
colour distance for every match rather than a guess. Build a list per army or
project, search the whole catalogue by name or brand, and see the closest
equivalents side by side.

Works entirely offline. No account, no ads, no tracking.
```

Play keeps release notes per language and per release. Reuse this wording for a
first release on any track; write a real changelog from 1.0.1 onward.

---

## Store settings

| Field | Value | Notes |
| --- | --- | --- |
| Contact email | `redacted@example.invalid` | **Required**, and shown publicly on the listing. |
| Contact website | — | Optional. Point it at the privacy policy host once that exists. |
| Contact phone | — | Optional. Leave blank; it is also shown publicly. |
| External marketing | Leave unticked | The app does not advertise outside Play. |

---

## Categorisation

| Field | Value | Why |
| --- | --- | --- |
| App category | **Art & Design** | Tools is the fallback, but this is a hobby utility and Art & Design is where painters browse. |
| Tags | Painting, Hobby, Reference | |
| Contains ads | **No** | |
| In-app purchases | **No** | |
| Free or paid | **Free** | |

## Target audience and content

| Question | Answer |
| --- | --- |
| Target age groups | **13+** — do not tick any under-13 band |
| Appeals to children | **No** |
| Content rating | Everyone / PEGI 3 — every IARC question answers "none" |
| News app | No |
| COVID-19 / health app | No |
| Government app | No |
| Financial features | None |

Ticking any under-13 age band puts the app under the Families policy, which
brings its own SDK, ads and disclosure requirements. There is no reason to
accept that here.

## App access

**All functionality is available without restrictions.** No login, no account,
no region lock, no gated features. The reviewer needs no credentials.

`appConfig.featureFlags.markdownExport` is `false`, so the export action is not
in the build at all — there is no hidden or unreachable feature to declare.

---

## Data safety form

The whole form, answered. The short version is that the app collects nothing,
but Google asks the question about a dozen ways.

**Does your app collect or share any of the required user data types?**
→ **No**

That single answer closes out the entire data-type matrix. The rest of this
section records *why* it is the honest answer, because the form's definition of
"collect" is broader than most people assume.

| Google's question | Answer | Reasoning |
| --- | --- | --- |
| Is data collected or shared? | No | Lists never leave the device. There is no server to send them to. |
| Does a third-party SDK collect data? | No | The app has four runtime dependencies: React, Zustand, Fuse.js and Capacitor. None phone home. |
| Analytics? | No | None integrated. |
| Crash logs? | No | No crash reporting SDK. Android's own Play-console crash collection is platform-level and is not developer collection. |
| Advertising or marketing? | No | No ad SDK, no ID for advertisers. |
| Personal info, financial info, location, contacts, photos, files? | No | The app requests no permission that would reach any of them. `INTERNET` is the only permission declared. |
| Is data encrypted in transit? | N/A | Nothing is transmitted. The one outbound request is an HTTPS `GET` for a public file and carries no user data. |
| Can users request deletion? | N/A | Uninstalling removes everything. Nothing is held anywhere else. |

**On the catalogue request.** Fetching a public URL means GitHub's servers see
an IP address, as any HTTP request does. Google's guidance is explicit that
this is not "collection" by the developer — we neither receive nor store it.
It is disclosed in the privacy policy regardless, because a user reading
"contacts nobody" deserves to know a request goes out at all.

**On device backup.** `android:allowBackup` is `true`, so Android may include
the app's local storage in the user's own encrypted device backup. That is the
user backing up their own data to their own Google account, not the developer
collecting it, and it is not declarable on this form. It is disclosed in the
privacy policy.

## Privacy policy URL

Required for every app, whether or not it collects anything.

`npm run privacy` renders [`privacy-policy.md`](./privacy-policy.md) into
[`docs/privacy.html`](../docs/privacy.html) — a single self-contained file with
no external stylesheet, font or script, served by GitHub Pages from `docs/`.
Paste the resulting URL into Play Console → App content → Privacy policy.

The markdown stays the source; edit it and re-run, never edit the HTML.

Play's requirements for the URL, all of which the generated page satisfies:

- Publicly reachable with **no login** and no geo-restriction.
- **Not publicly editable** — so not a wiki page.
- A live page, **not a PDF** download and not text shown only inside the app.
- Must stay up for as long as the app is listed.

One thing to get right: Play cross-checks the policy against the Data safety
answers above. This policy says the app collects nothing, and that is true —
which is exactly why a generated boilerplate policy from a
privacy-policy-generator site would be a liability rather than a shortcut.
Those templates assert analytics, cookies and third-party sharing that Paco
does not do, and the contradiction is what gets flagged.

---

## Graphics

Generated, not hand-exported. See [`tools/icons/`](../tools/icons/) and
[`tools/store/`](../tools/store/).

| Asset | Requirement | Source |
| --- | --- | --- |
| App icon | 512×512 PNG, no transparency | `npm run icons` → `store/graphics/icon-512.png` |
| Feature graphic | 1024×500 PNG | `npm run feature-graphic` → `store/graphics/feature-graphic.png` |
| Phone screenshots | 2–8, 1080×1920 | `npm run screenshots` → `store/graphics/screenshots/` |

Screenshot list names are invented on purpose — see the comment in
`tools/store/screenshots.mjs`.
