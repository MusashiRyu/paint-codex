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

MIX AND MATCH IN THE COLOR LAB

Pick two paints and see the blend between them in twenty per cent steps, or
pick one and get its complementary, its highlight and its shade. Every colour
Paco works out is matched back to the nearest real paint in the catalogue, with
the same delta score the equivalents use — so a mix you cannot buy still ends
at one you can, and it goes straight into a list.

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

**What's New 1.2.0** (4000 char limit) — the same copy as Play's release notes, for the same reason

```
THE COLOR LAB

A second screen. Pick two paints and see the blend between them in 20% steps,
or pick one and get its complementary, its highlight and its shade. Every
colour Paco works out is matched back to the nearest real paint, with the same
delta score the equivalents use, and goes straight into a list.

Also fixed: the title no longer sits behind the status bar, the app stays in
portrait, and opening a paint's equivalents no longer lands on a blank list.
```

**1.2.0 is what the App Store will see first.** Nothing has shipped there: the
1.1.0 archive was rejected on Guideline 2.1 before review reached the app, and
1.2.0 is the build that answers it. So the blocks above it are house style and
history rather than text anyone will read — Apple shows the description, not the
notes, for a first release.

It is worth being deliberate about the last line for that reason. Naming the
three fixes is right for Play, where 1.1.0 is live and users met those bugs. For
Apple it also answers, in one sentence and without drawing attention to it, the
"what changed since the build you rejected" question a reviewer may have.

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
| SKU | `paco-ios-001` | Internal only, never shown to anyone, and permanent — it cannot be changed after the record is created. The `-001` is not decoration: SKUs are unique per account and are never released, so a deleted app record spends its SKU for good. The case that bites is a bundle ID that turns out wrong after a build has been uploaded against it, which freezes it and forces a new record. A numbered SKU makes the successor obvious (`paco-ios-002`) instead of improvised, and zero-padding sorts correctly in the sales and financial reports the field appears in. |
| Primary language | English (U.K.) | The copy is written in British English: "colour" throughout. |
| Primary category | **Graphics & Design** | The App Store's nearest equivalent to Play's Art & Design, and where hobby colour tools sit. |
| Secondary category | **Reference** | It is a lookup table before it is anything else. |
| Copyright | `2026 Musashi Ryu` | The **rights holder**, which here is a person and not the account: the rights are held personally and Future Fox is only the publishing account. So this deliberately does *not* match the seller name Apple derives from the enrolment, and the mismatch is correct rather than an oversight to tidy up. No `©` — Apple renders it, and typing one gives two. The year is when the rights were obtained. Editable at any time, including after release. |
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

### The first submission was rejected for an empty Notes field

Submission `7fce4ac9-c042-4e78-8187-a3397c78dd81`, 14 August 2026, came back
under **Guideline 2.1 — Information Needed**. Not a bug report and not a
judgement about the app: Apple asked seven questions and requested a screen
recording, because the Notes field carried three paragraphs where it needed to
answer all of them.

The block below is the replacement, and it is written to Apple's seven
questions in their order — app function and audience, setup and access,
external services, regional differences, regulated industry and third-party
material, plus the permissions/purchases/UGC prompts the recording request
enumerates.

**It describes both screens, because the resubmission ships both.** `feat/color-lab`
merges before the next build, so Collab is in the binary a reviewer opens and
belongs in the flow. The reverse is the rule that matters and it is easy to get
wrong in either direction: the notes describe *the build being submitted*, not
the branch and not the design. Before every submission, walk the numbered steps
against the actual archive — the first draft of this block described a "starter
list" the store does not seed and a `NEW LIST` button that reads **New**, both
from writing it out of memory rather than out of the code.

**3,926 of the field's 4,000 characters**, and the listing check now measures it
on every run, so drift shows up rather than being discovered in the form. There
is not much room: anything added has to displace something, which is the reason
this is prose and not an essay.

**Notes for the reviewer** (4000 char limit) — paste this into the Notes field.
The limit is declared so the listing check measures this like any other field.
No inline code in this paragraph, deliberately: the checker binds a heading to
its own fence with a pattern that cannot cross a backtick, so one here would
silently drop the field from the run rather than fail it.

```
WHAT THE APP DOES, AND FOR WHOM

Paco is an offline paint-conversion reference for miniature painters -
hobbyists who paint tabletop miniatures. It ships a catalogue of 2,279 paints
from Citadel, Vallejo and The Army Painter and, for each, shows the nearest
match in the other two brands, ranked by a measured CIE colour distance rather
than a guess. Two screens, from the bottom bar: List keeps saved paints and
searches the catalogue; Collab is a colour laboratory that blends or derives a
colour and names the closest real paint.

ACCESS - NO LOGIN, NOTHING GATED

No account, sign-in, demo credentials or sample files. Everything is available
on first launch and works offline; the app can be reviewed end to end in
aeroplane mode. It opens with no lists, so step 1 creates one.

LIST

1. Tap "+ New" in the tab bar. Give the list a name, an emblem and a banner
   colour, then create it.
2. Tap the gold "+", bottom right, to open the catalogue.
3. Search by name ("Abaddon") or brand ("Vallejo"), or filter to one brand.
   Each result shows a swatch, brand, category and hex, plus its closest
   equivalents in the other two brands, each with a delta score.
4. Tap the gold "+" on a result to add it; it then reads IN LIST.
5. Tap a paint in the list to reopen the catalogue anchored on it, ordered by
   colour; tap any equivalent tile to jump to that paint.

COLLAB

6. Mixing tab: tap Select Paint A, then Select Paint B; each opens a picker
   offering My Lists and Search Catalog. The Mix Preview strip shows the blend
   in 20% steps, each resolved to the nearest real paint.
7. Matching tab: pick a base paint to get its complementary, highlight and
   shade under Color Theory, each likewise resolved to a real paint.
8. The gold "+" on any of those cards adds that paint to the current list.

That is the whole app. There is no further screen, mode or unlockable state.

EXTERNAL SERVICES

One, and it is optional. At launch the app makes three anonymous HTTPS GET
requests to raw.githubusercontent.com for the public, MIT-licensed paint tables
at github.com/Arcturus5404/miniature-paints, refreshing the bundled catalogue
between releases. No user data, identifiers or cookies are sent; if they fail,
the bundled catalogue is used and nothing observable changes.

Nothing else: no server of our own, no authentication, analytics, crash
reporting, advertising SDK, AI or ML service, payment processor, or third-party
data collection. Runtime dependencies are React, Zustand, Fuse.js and
Capacitor. All colour maths runs on the device.

PERMISSIONS

None requested, and no system prompt appears: no location, contacts, camera,
microphone, photos or notifications, and no App Tracking Transparency prompt -
there is no advertising identifier and nothing to track.

PURCHASES

None. No in-app purchase, subscription or paid tier, and no StoreKit code in
the binary. Nothing is locked, limited, trial-gated or time-restricted: every
feature described above is free and available immediately, in every region.

USER-GENERATED CONTENT

None that leaves the device. Users name their own lists, which stay in local
storage. Nothing is uploaded, shared or visible to any other user, so there is
nothing to report or block.

REGIONAL DIFFERENCES

None. Identical catalogue, features and content in every region: no geo-gating,
no regional pricing (free everywhere). English (U.K.) only.

REGULATED INDUSTRY AND THIRD-PARTY MATERIAL

Neither applies. The colour data derives from the openly licensed (MIT) public
database credited above and in the app. The three brands are named only as a
nominative reference to the ranges the app converts between; Paco is not
affiliated with, endorsed by or sponsored by Games Workshop, Acrylicos Vallejo
or The Army Painter, as the description states. No artwork, logo or trade dress
of theirs is reproduced.

TESTED ON

iPhone 15 Pro Max, iOS 26.x - physical device, via TestFlight.
```

**No em dashes, no typographic quotes, no `Δ`.** The block is deliberately
plain ASCII: it is pasted into a web form that has mangled non-ASCII before,
and a mojibake'd notes field is a worse first impression than a hyphen.

### The screen recording

Apple wants it captured on a physical device on the latest OS, starting from
launch. iOS Screen Recording (Settings → Control Centre → Screen Recording)
produces a `.mp4` that App Store Connect accepts directly.

**Record the build that is actually under review.** A recording of a newer
local build is a description of an app Apple does not have, and the differences
are exactly what a reviewer is looking at.

**Four flows, and only four**, because those are the app's core features and
Apple asked for the typical path through them. In order, roughly 90 to 120
seconds at a pace that can be read:

1. **Create a new list** — name, emblem, banner colour. It is also the app's
   genuine first-run state, so the recording starts where a real user does
   rather than in a populated app that has to be explained.
2. **Add a paint to it** — search, read the equivalents, tap the gold "+" and
   watch the result turn to IN LIST.
3. **Mix two colours** — the Mixing tab, both slots filled, the Mix Preview
   strip resolving each step to a real paint.
4. **Match one colour** — the Matching tab, a base paint, complementary,
   highlight and shade under Color Theory.

Two conditions on the recording rather than steps in it:

- **Aeroplane mode on before launch.** It demonstrates the central claim in one
  gesture, and removes any question about what the network request is doing.
- **Search something with a near-miss**, so a delta score is visibly doing work
  rather than reading 0.00 on an exact match.

**Nothing else.** No About screen — it is not a user
flow, and a reviewer asked for typical usage is owed typical usage. No settings
tour, no empty-state gallery, no rotation demo. Every extra second is a second
of something that was not asked for.

Steps 3 and 4 are why this matters more than it did in August. A reviewer who
sees only List may reasonably read the app as a lookup table with a saved-items
feature; the Mix Preview strip resolving to paints that can actually be bought
is the part that is hard to mistake for a generic list app.

Attach it in **App Review Information → Attachment** (one file) as well as in
the Resolution Center reply. The Notes field survives to the next submission;
a Resolution Center thread does not.

### Devices tested

Apple's question 2, and the answer belongs here rather than only in the reply,
because it has to be re-answered truthfully at every submission.

| Device | OS | How |
| --- | --- | --- |
| iPhone 15 Pro Max | iOS 26.x | TestFlight, physical device |

One device is a thin answer and there is no point pretending otherwise. It is
also the honest one: `TARGETED_DEVICE_FAMILY` is `1`, the layout is a single
column checked at seven phone widths, and the 6.9" screenshot set is what Apple
scales to every smaller iPhone. Adding a second physical device is the single
highest-value thing available here — see
[ios-release-checklist.md](../documentation/ios-release-checklist.md#6-testflight),
where one screenshot from this device found two bugs that had survived
twenty-nine retros.

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

**One shot per section of the description**, since 1.2.0: the list, the
catalogue with its equivalents, and the Color Lab's two halves. Before that all
four were List screens. That matters more here than on Play — this listing is
attached to a submission already returned once for an incomplete account of
what the app is, and four pictures of a list under a description of a colour
laboratory is the same failure in a second medium.
