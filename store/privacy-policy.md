# Privacy Policy — Paco (Paint Codex)

**Last updated: 9 August 2026**

Paco is a paint-conversion and list-keeping app for miniature painters. It has
no accounts, no analytics, no advertising and no crash reporting.

**Paco collects no personal data.** Nothing you enter is transmitted anywhere.

---

## What Paco stores, and where

Your paint lists — their names, emblems, banner colors, and which paints are
in them — are stored **on your device only**, in the app's local storage. They
are never uploaded, never synced to a server, and no one but you can read them.

Paco also caches a copy of the paint catalog on your device so it works
offline.

Deleting the app deletes all of it.

## The only network requests

Paco contacts exactly one host — `raw.githubusercontent.com` — once per launch,
for three public files:

```
https://raw.githubusercontent.com/Arcturus5404/miniature-paints/main/paints/Citadel_Color.md
https://raw.githubusercontent.com/Arcturus5404/miniature-paints/main/paints/Vallejo.md
https://raw.githubusercontent.com/Arcturus5404/miniature-paints/main/paints/Army_Painter.md
```

These are public paint color tables hosted on GitHub. Paco downloads them to
keep the catalog current between app releases. The requests send **no
identifiers, no account information and nothing about your lists** — they are
anonymous requests for public files, the same ones your browser would make if
you opened those links.

As with any request to any website, GitHub's servers will see your device's IP
address and a standard user-agent string. That data is handled by GitHub, not
by us, under [GitHub's Privacy
Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).
We never see it.

If the requests fail — no signal, airplane mode, GitHub down — Paco carries on
with the catalog it already has. The app is fully usable offline.

## Links that leave the app

The About screen contains a few links: a tip page on Ko-fi, the paint data
source and the design credit on GitHub, and this policy.

Tapping one hands the address to **your own browser** and Paco takes no further
part in it. Paco itself never contacts any of those sites, and the handoff
carries nothing about you — not your lists, not an identifier, and not even the
fact that you arrived from Paco, because every link in the app is marked
`noreferrer`.

Once a page is open in your browser, that site's own privacy policy applies, not
this one. Leaving a tip is entirely optional: nothing in Paco is locked, limited
or switched off if you never do, and Paco is not told whether you did.

## Device backup

Android's own backup feature may include Paco's data (your lists) in the
encrypted device backup it makes to **your** Google account, if you have that
turned on in your Android settings. This is a function of Android, controlled
entirely by you in **Settings → Google → Backup**; that copy belongs to you and
we have no access to it.

## Permissions

Paco requests one Android permission:

| Permission | Why |
| --- | --- |
| `INTERNET` | The catalog requests described above. Nothing else. |

Paco does not request access to your location, camera, microphone, contacts,
photos, files, or any other device data.

## Children

Paco collects no data from anyone, including children under 13. There is
nothing in the app directed at children and nothing that identifies any user.

## Third parties

There are none inside the app. No SDKs, no trackers, no ad networks, no
analytics providers. The paint catalog's host (GitHub) is described above and
receives nothing but ordinary anonymous requests for public files.

The sites behind the About screen's links are third parties in the ordinary
sense — but Paco does not embed, contact or load anything from them. They are
addresses handed to your browser when you choose to tap one, exactly as if you
had typed them yourself.

## Changes

If this policy changes, the updated version will be published at this same
address with a new "last updated" date. Since the app collects nothing, any
change would be about the app doing *less*, or about a new network request
being added — and a new request would be described here before it shipped.

## Contact

Questions about this policy: open an issue at
[github.com/MusashiRyu/paint-codex/issues](https://github.com/MusashiRyu/paint-codex/issues).

That tracker is public, so do not put anything private in an issue. There is
also nothing here to request access to or erasure of: the app collects no
personal data and sends none anywhere, so the only questions this section can
answer are about the policy itself.
