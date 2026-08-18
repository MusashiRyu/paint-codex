# Retro 042 — Live on the App Store

1.2.3 was approved, released, and is on the App Store. That is the first
version of this app on Apple's store and the end of a thread this repo has been
carrying since retro 001.

This session wrote no code. It answered a question — the app is approved, what
now — and then recorded what the answer settled.

## Approval is not publication, and the checklist stopped one step short

The version had been submitted with **manual release** chosen, which
[ios-release-checklist.md](./ios-release-checklist.md) step 7 recommends for a
first submission and gives a good reason for: approval at 3am and an app live
before anyone has re-read the listing is a bad trade for the two minutes it
saves.

The document then ended at "Submit". So it recommended a setting whose entire
point is that a human presses a button later, and never mentioned the button.
An approved build sits at **Pending Developer Release** indefinitely; the store
listing does not appear; nothing is wrong and nothing is happening.

That gap is now step 8. It is a small omission and worth naming precisely,
because it is the shape a checklist fails in: every individual step correct,
and the document's *end* mistaken for the *goal*. Submission was the hard part,
so the file ended where the difficulty ended rather than where the app ships.

## What the two submissions cost, and what actually fixed it

Worth recording together, since the thread is now closed. The 2026-08-14
submission was rejected under **Guideline 2.1 — Information Needed**: three
paragraphs of reviewer notes where Apple wanted seven answers and a screen
recording. An information request is not a pass on everything else — it is a
reviewer asking what the app *is* before assessing what it contains.

So the first rejection was paperwork. The notes block, the recording shot list
and the tested-devices table that replaced it are in
[`listing-appstore.md`](../store/listing-appstore.md#app-review-information),
and the recording is attached under **App Review Information → Attachment**
where it persists to the next submission rather than only in a Resolution
Center reply, which does not.

## What is left open

One item, and it is Google's: whether the twelve-testers-for-fourteen-days gate
survives an app transfer from a personal account to an organization one. A
support ticket has been open since 2026-08-15. Nothing in this repo advances
it, uploading builds does not advance it, and recruiting testers in parallel is
still strictly cheaper than waiting for the answer.

The asymmetry between the two stores is now complete and slightly funny. Apple
— the store this repo spent four retros being careful about, with the
strictest review — is done. Play, which shipped first and easily, is the one
still gated, on a rule about account provenance that its own documentation
does not address.

## No version bump, no build

Nothing here reaches a device. `versionCode` 8 / `versionName` 1.2.3 is the
released build on both stores and the tag `v1.2.3` already names the cut.

## Files changed

**Modified**

- `documentation/ios-release-checklist.md` — step 8, "Release it": the button,
  what the statuses mean, how long the listing takes to appear, and the two
  settings (automatic release, phased release) that only exist once a version
  has shipped.
- `documentation/OPEN-ITEMS.md` — the Open preamble now says what is actually
  left, which is one item.

**New**

- `documentation/042-retro.md` — this file.

## Assumptions made

- **The released version is 1.2.3.** Not stated in the session, and inferred:
  it is the version pinned in `android/app/build.gradle`, the one
  `listing-appstore.md` says the App Store will see first, and the only tag
  after v1.2.2. If some other build was released, the version numbers in this
  retro and the Recently closed row are wrong and nothing else is.
- **The release happened on 2026-08-18**, the date of this session.
- The listing is not yet confirmed visible on the store. Propagation and search
  indexing can take up to a day; nothing in this repo tracks that and no item
  is being opened for it.

Outstanding work is in [OPEN-ITEMS.md](./OPEN-ITEMS.md).
