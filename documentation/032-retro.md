# Retro 032 — The rejection was not about the app

Submission `7fce4ac9-c042-4e78-8187-a3397c78dd81` came back on **Guideline 2.1 —
Information Needed**. Seven questions, plus a screen recording captured on a
physical device.

It is worth being precise about what that is, because it looks worse than it is
and the temptation is to treat it as a verdict. Nothing was tested and found
wanting. Apple asked what the app is, what it talks to, how to reach its
features, and what it was tested on — and the Notes field answered three of
those in three paragraphs written for a different question. The reviewer stopped
before assessing the app, not because of it.

So the fix is a text field. Except that it is not, and the reason is the one
thing this session actually found.

## The build under review predates its own bug fixes

The rejection email asks for a recording of the app running. That is a
reasonable request that would, here, have produced ninety seconds of footage of
the two bugs retro 030 is about.

The successful `ios-release.yml` run archived `0a7914f`, at 17:57 UTC on 14
August. The submission went in at 19:53 UTC. And `2cd1f95` (move the layout out
from under the status bar) and `a1a5b6f` (lock both platforms to portrait)
landed at 21:38 UTC — **about ninety minutes after the binary Apple is
holding**.

The two facts that establish this are in different places and neither is
obvious from the other:

```
gh run list --workflow=ios-release.yml --json headSha,createdAt,conclusion
git log --format='%h %ad %s' --date=iso master
```

The first says which commit was archived. The second says what that commit did
not yet contain. Nothing in App Store Connect, and nothing in the repo, joins
them up — a version number is not a commit, and `MARKETING_VERSION` had read
`1.1.0` since 11 August, so it is identical across the fix boundary. A reviewer
opening this build sees `PAIN CODEX` behind the clock, exactly as the first
TestFlight screenshot did.

**The order the email implies is therefore wrong.** Answering it first, with the
recording it asks for, converts an information request into a bugs-and-crashes
rejection. Bump, release, attach, *then* record. OPEN-ITEMS 12 carries the
sequence.

There is a smaller companion oddity: Apple's email says "App Version 1.0 for
iOS" while `MARKETING_VERSION` is `1.1.0`. Checklist step 7.1 asserts App Store
Connect will not let a record and a build disagree like that. One of those two
things is wrong and it is worth finding out which, but it blocks nothing.

## What the Notes field has to carry now

Seven answers in **4,000 characters**, which is less room than it sounds once
setup instructions and a services list are in it. The block that went in is
about 3,890, and that budget is why it reads as prose rather than an essay.

Three things were decided rather than merely written.

### The flow had to be checked against the build, not remembered

The old notes said the app "requires no account. Every feature is available
immediately on first launch", which is true and useless — it does not tell a
reviewer where to tap. Writing the numbered flow meant reading the reviewed
build rather than the branch, and the first draft was wrong twice:

- It said "tap NEW LIST", which is a `Pill` reading **New**.
- It opened on "the List screen with a starter list". The store seeds
  `lists: []`, so the actual first screen is *No lists yet — Create your first
  list to start tracking paints.* A reviewer told to tap a "+" that adds a paint
  to a list that does not exist has been handed a dead end by the person asking
  them to approve the app.

Both came from describing the app from memory of the *design* rather than from
the code that was actually archived.

The rule that falls out of it: **the notes describe the build being submitted.**
Not the branch, not the design, not the app as it will shortly be. Which cuts
both ways, and did — the first version of this block described one screen,
because `0a7914f` has one. `feat/color-lab` merges before the resubmission, so
the block now describes two, and the flow gained a Collab section covering the
Mixing and Matching tabs, the My Lists / Search Catalog picker, and the fact
that every mixed colour resolves back to a real paint.

That last point is worth more to a reviewer than its length suggests. An app
that is only List reads plausibly as a lookup table with saved items; the Mix
Preview strip resolving to paints that can be bought is the part that is hard to
mistake for a generic list app.

There is a listing consequence and OPEN-ITEMS 11 already named it: master's
description does not mention Collab, the branch's does, and all four screenshots
in both stores are List screens. Shipping the merge makes those release
blockers rather than the tidy-up they were on the branch.

### The About screen is not a core flow

The first version of this block put the About sheet in both the flow and the
recording. The premise was that the reviewer would end up on the About screen.
They will not, because nothing sends them there. **Apple asked for "the typical
user flow through its core features"**, and About is not a core feature — the
four things a user actually does here are create a list, add a paint to it, mix
two colours, and match one. A version number and a credits list are not a flow,
and a recording that detours into one is answering a question nobody asked.

### Plain ASCII, deliberately

No em dashes, no typographic quotes, no `Δ`, in a repo whose entire house style
is em dashes. It is pasted into a web form, mojibake in a reviewer notes field
is a bad first impression, and none of the characters were load-bearing.

## What this did not fix

- **Nothing has been recorded yet, because nothing has been rebuilt.** Every
  answer is written; the video needs a device, and the device needs a build that
  is worth filming.
- **One device is a thin answer to question 2.** iPhone 15 Pro Max is honest and
  it is also all there is. A second phone is the cheapest available improvement
  to the next submission, and the ratio from retro 030 — one screenshot, two
  bugs that survived twenty-nine retros — is the argument.
- **The screenshots still come from desktop Chromium**, where the insets are
  always zero. They are not wrong, but they do not show the build the fix is in,
  and OPEN-ITEMS 11 already wanted them regenerated for a different reason.
- **An information request is not a pass on everything else.** The reviewer was
  asking what the app is before assessing what it contains.
