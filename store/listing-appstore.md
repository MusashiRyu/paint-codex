# App Store listing

Everything App Store Connect asks for, written out so it is reviewed here
rather than improvised into a web form at midnight. Character limits are
Apple's and are checked by `npm run listing:check`.

This is a **separate file from [`listing.md`](./listing.md) on purpose.** The two
stores do not ask for the same things: Play wants one short description and one
long one, Apple wants a subtitle, a keyword list and promotional text that can
be changed without shipping a build. Maintaining one file with "and for iOS…"
footnotes is how a listing ends up half-migrated.

---

## Product page

**App name** (30 char limit)

```
Paco - Paint Codex
```

**Subtitle** (30 char limit) — sits under the name in search results and on the product page

```
Miniature paint conversion
```

**Keywords** (100 char limit) — comma separated, no space after the commas; spaces are billed against the limit

```
citadel,vallejo,army painter,minis,wargame,tabletop,swatch,palette,colour,color,hobby,acrylic
```

Apple already indexes the app name and subtitle, so nothing from either is
repeated here — "paint", "codex", "miniature" and "conversion" would be wasted
characters. See the trademark note at the bottom of this section before
changing the first three.

**Promotional text** (170 char limit) — editable any time without submitting a build, so it is the field to use for news

```
Every paint Citadel, Vallejo and The Army Painter sell, with the closest match in the other two ranges measured rather than guessed. Works with no signal at all.
```

**Description** (4000 char limit)

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
device and are never uploaded. The app talks to exactly one host, for the
public paint colour tables it is built on, and it sends nothing about you with
it.

Paco is free, and every part of it is. No feature is locked, limited or nagged
about.

—

The Paint Codex design is by Lukas Stordeur (github.com/LukasStordeur).

Paint data is derived from the open colour database at
github.com/Arcturus5404/miniature-paints (MIT), published by the Miniature
Painter Pro team.

Paco is an independent app. It is not affiliated with, endorsed by, or
sponsored by Games Workshop Limited, Acrylicos Vallejo S.L., or The Army
Painter ApS. Citadel, Vallejo and The Army Painter are trademarks of their
respective owners, used here only to identify the paint ranges the app
converts between.
```

This is the Play full description with **one paragraph removed** — its
closing paragraph, which is Play-specific copy with no App Store equivalent.

**What's New 1.0.0** (4000 char limit) — not shown for a first release; Apple displays the description instead. Written now so the next release has a house style to follow

```
First release.

Paint conversion across Citadel, Vallejo and The Army Painter, with a measured
colour distance for every match rather than a guess. Build a list per army or
project, search the whole catalogue by name or brand, and see the closest
equivalents side by side.

Works entirely offline. No account, no ads, no tracking.
```

**What's New 1.1.0** (4000 char limit) — the same copy as Play's release notes; the two stores ship the same app and there is nothing iOS-specific to say

```
Tap a paint in one of your lists to open it in the full catalogue, now ordered
by colour: the paints above and below it are the nearest colours across all
three brands. When nothing is an exact equivalent, scroll a little either way
and take the closest thing.

Paints you already own are marked IN LIST wherever they appear, including as
equivalents of something else.

Still entirely offline. No account, no ads, no tracking.
```

iOS has not shipped 1.0.0 yet, so this text is what the first App Store release
will carry only if it goes out at 1.1.0 or later — otherwise it is the second
release's notes. Nothing here needs deciding until the archive can be built; see
OPEN-ITEMS 4.

### On the brand names in the keyword field

"citadel", "vallejo" and "army painter" are other companies' marks. They are in
the keyword list because the app's entire function is converting between those
three specific ranges — a conversion tool that cannot be found by the name of
what it converts is not findable at all, and this is the same nominative use
the description already relies on.

What is deliberately **not** there: "warhammer", "40k", "age of sigmar", or any
faction name. Those describe a game the app has nothing to do with, so using
them would be reaching for someone else's search traffic rather than describing
this app. It is the same line the screenshots draw — see the list-naming
comment in `tools/store/screenshots.mjs`.

If a trademark complaint ever arrives, dropping the three brand names from the
keyword field is a metadata edit that needs no build and no review.

---

## App information

| Field | Value | Notes |
| --- | --- | --- |
| Bundle ID | `com.musashi.paco` | Must be registered in the Developer portal before an App Store Connect record can be created. Matches Android's `applicationId`, which is not required but is one less thing to get wrong. |
| SKU | `paco-ios-001` | Internal only, never shown to anyone, and permanent — it cannot be changed after the record is created. |
| Primary language | English (U.K.) | The copy is written in British English: "colour" throughout. |
| Primary category | **Graphics & Design** | The App Store's nearest equivalent to Play's Art & Design, and where hobby colour tools sit. |
| Secondary category | **Reference** | It is a lookup table before it is anything else. |
| Copyright | `2026 <name on the developer account>` | Public on the listing, and must match the legal name the account is enrolled under — an individual enrolment shows a personal name here. Filled in at submission rather than recorded, for the same reason as the contact email. |
| Content rights | **No third-party content** | The question targets media the app streams or displays under licence. The paint data is openly licensed (MIT) reference data that the app derives its own values from, and the credit is in the description regardless. |
| Age rating | **4+** | Every question in the questionnaire answers "None". No violence, no unrestricted web access — the only outbound links are fixed URLs handed to Safari. |
| Price | **Free** | |
| In-app purchases | **None** | No StoreKit integration exists. |

### URLs

| Field | Value |
| --- | --- |
| Support URL | `https://musashiryu.github.io/paint-codex/` |
| Marketing URL | *Optional. Same page; leave blank rather than duplicate it.* |
| Privacy policy URL | `https://musashiryu.github.io/paint-codex/privacy.html` |

**The support URL is required and Apple checks it.** It has to resolve to a page
that offers a way to get help, not a 404 and not a redirect to the App Store.
The GitHub Pages landing page generated by `npm run privacy` serves as one.

The contact email is not recorded here for the same reason it is not recorded
in `listing.md`: this repo is public.

---

## App Privacy

Apple's questionnaire, answered. It is a different form from Play's Data safety
with the same true answer underneath.

**Do you or your third-party partners collect data from this app?**
→ **No, we do not collect data from this app**

That single answer produces a "Data Not Collected" privacy label and closes the
entire data-type matrix. It must stay consistent with
[`ios/App/App/PrivacyInfo.xcprivacy`](../ios/App/App/PrivacyInfo.xcprivacy),
which declares the same thing to the build system — Xcode aggregates every
binary's manifest into a privacy report, and a report that disagrees with the
answers typed into App Store Connect is a question you get asked during review.

| Apple's question | Answer | Reasoning |
| --- | --- | --- |
| Contact info, identifiers, usage data, diagnostics? | No | Nothing is transmitted. There is no server to transmit to. |
| Do third-party SDKs collect data? | No | Four runtime dependencies — React, Zustand, Fuse.js, Capacitor. None phone home. |
| Analytics or crash reporting? | No | None integrated. Apple's own crash collection is platform-level and is not developer collection. |
| Tracking, as Apple defines it? | No | No advertising identifier, no data shared with a data broker, no cross-app linkage. The app never presents an App Tracking Transparency prompt because it has nothing to ask for. |
| Data linked to the user? | N/A | Nothing collected, so nothing to link. |

**On the catalogue request.** One HTTPS `GET` for a public file goes to
`raw.githubusercontent.com` at launch. GitHub's servers see an IP address, as
any HTTP request does. That is not developer collection under either store's
definition — we neither receive nor store it — and it carries no user data. It
is disclosed in the privacy policy anyway, because a user reading "contacts
nobody" deserves to know a request goes out at all.

**On device backup.** Lists live in the WebView's local storage inside the app
container, which is included in the user's own iCloud or encrypted local
backup. That is the user backing up their own device, not the developer
collecting anything.

---

## App Review Information

| Field | Value |
| --- | --- |
| Sign-in required | **No** |
| Demo account | Not needed. Every feature is reachable on first launch with no account, no region lock and nothing gated. |
| Contact | First and last name, phone and email of whoever can answer during review. Not recorded here. |

**Notes for the reviewer** — paste this into the Notes field:

```
Paco is fully functional offline and requires no account. Every feature is
available immediately on first launch.

The app makes exactly one network request, at launch: an HTTPS GET to
raw.githubusercontent.com for an updated copy of the public paint colour table
the app is built on. If it fails, the bundled catalogue is used and nothing
about the app changes. No user data is sent with it. The app can be reviewed
entirely in aeroplane mode.

Citadel, Vallejo and The Army Painter are named throughout because the app's
function is converting between those three paint ranges. The app is
independent and not affiliated with any of them; the disclaimer is in the
description.
```

---

## Export compliance

Answered in the build, not in the form.
[`ios/App/App/Info.plist`](../ios/App/App/Info.plist) sets
`ITSAppUsesNonExemptEncryption` to `false`, so App Store Connect stops asking
the question on every single upload.

That answer is correct rather than convenient: the app implements no
cryptography, and the one network call is an ordinary HTTPS request. Use of
HTTPS alone is exempt.

---

## Graphics

Generated, not hand-exported. See [`tools/icons/`](../tools/icons/) and
[`tools/store/`](../tools/store/).

| Asset | Requirement | Source |
| --- | --- | --- |
| App icon | 1024×1024 PNG, **no alpha channel**, no rounded corners | `npm run icons` → `ios/App/App/Assets.xcassets/AppIcon.appiconset/` |
| iPhone 6.9" screenshots | 2–10, 1290×2796 portrait | `npm run screenshots` → `store/graphics/screenshots-ios/` |

The icon is built into the app rather than uploaded separately — App Store
Connect reads it from the archive, which is why a transparent one fails *after*
the upload rather than during it.

**No iPad screenshots**, because `TARGETED_DEVICE_FAMILY` is `1`. Restoring
iPad support makes a 13" set (2064×2752) mandatory, and makes the reviewer test
a layout that has only ever been checked at phone widths.

One screenshot size is enough: Apple scales the 6.9" set down for every smaller
iPhone. Older display sizes are only worth uploading to show a genuinely
different layout, and there is not one here.
