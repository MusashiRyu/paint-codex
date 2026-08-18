# Retro 043 — The gate follows the app, and the console was right all along

Google support answered the ticket opened on 2026-08-15. They cannot lift the
twelve-testers-for-fourteen-days requirement, and the only route around it they
offered is republishing the app under a different bundle ID.

That closes the longest-lived open question in this repository, in the
direction nobody wanted, and it makes the remaining work entirely
non-technical: six more testers.

## What the answer actually answers

Item 8 asked a specific question and said to record **which** question any
reply resolved: is the requirement evaluated against the *current* owner of the
app, or against the account of *original publication*? A reply that merely
restated the policy page would have answered neither.

This one answers it, and not through what support said — through what they
offered. **A new bundle ID escapes the gate.** A new app record created under
the organization account is exempt; this app record is not; and the only
difference between the two is where each was first published. The requirement
attaches to the app at publication and rides the transfer with it.

So the requirement is a property of the app's origin, not of the account that
currently holds it — which is precisely what
[Google's own page](https://support.google.com/googleplay/android-developer/answer/14151465)
does not say. It describes the rule as a property of the account and is silent
on transfers, and that silence is what three revisions of this repo's notes
read as an exemption.

## Third time the console was right

Worth stating plainly because it is the transferable lesson and it took three
goes.

- **2026-08-15, morning.** Item 8 closed as moot on the organization-account
  exemption. Read from the rule.
- **2026-08-15, hours later.** Reopened, because the Play Console still
  displayed the gate. The console contradicted the rule and the console was
  not believed — it was recorded as an anomaly worth a support ticket rather
  than as the answer.
- **2026-08-18.** Support confirms the console.

At no point did the console change its mind. The repo's own rule —
*trust the console over the rule* — was written down in `release-checklist.md`
before any of this and was correct every time; what failed was acting on it
when the official documentation said something more convenient. An observable
that disagrees with the documentation is not noise to be escalated. It is
usually just the answer, and the escalation is how you find out slowly.

The one thing the ticket did buy is *why*, and that turned out to be worth
having: the origin-not-owner reading is not in any public source and would not
have been guessed from the console alone.

## The workaround is declined, and the reason is not the rework

Republishing under a new bundle ID would work. It is still the wrong trade, and
the reason is worth separating from the obvious one.

The obvious one is cost: new package name, new upload key, new signing, new
listing, new store presence, and six testers asked to opt in again to what
looks to them like a different app. Real, but it is a week of work against a
fortnight of waiting, which is not a decisive margin.

The decisive one is that `applicationId` is `com.musashi.paco` and **so is the
iOS bundle ID of a listing that has been live on the App Store since
2026-08-18**. An App Store record's bundle ID is immutable and cannot follow a
Play rename. The two stores would carry different identities permanently, in
every document, every release, and every future version of the release
checklists that currently get to say "the same value on both."

That is a permanent cost paid for a two-week saving, and it gets worse the
longer the app lives. Declining it is not stubbornness about rework.

## What is left is arithmetic

Six testers are opted in. Twelve are needed, opted in **continuously** for
fourteen days, and the clock does not start until the twelfth. The earliest
production access is therefore fourteen days after the sixth new opt-in, and
no build, fix or upload moves that date.

Three ways the fortnight goes wrong, all avoidable and all now in
[OPEN-ITEMS.md](./OPEN-ITEMS.md): recruiting exactly twelve rather than a
buffer, since a drop below twelve resets the full fourteen days rather than the
days since the drop; counting people who agreed rather than people who clicked,
since opt-in is the counted event; and testers pressing the opt-out button when
they are done looking, which is the obvious thing to press and is
indistinguishable from a reset.

The recruitment itself is not a software problem and this repo cannot help with
it beyond making sure nothing technical is in the way. Nothing is: countries
were widened to worldwide on 2026-08-10, so a tester anywhere can install.

## The shape of the two stores now

Apple — the store this repo spent four retros being careful about, with the
strictest review — is done and live. Play, which shipped first and easily, is
the one still gated, on a rule about where an app was first published.

Nothing already shipped is affected on either store. The closed track is
unaffected and always was; this gates production only.

## No version bump, no build

Documentation only. `versionCode` 8 / `versionName` 1.2.3 is the released build
on both stores.

## Files changed

**Modified**

- `documentation/OPEN-ITEMS.md` — item 8 rewritten. It was a question awaiting
  an answer; it is now a settled finding plus a recruitment task, retitled to
  say so. The Open preamble follows.
- `documentation/release-checklist.md` — three places asserted the opposite of
  what is now known. Step 0's 12-testers note said "and why it does not apply
  here"; step 6 said closed testing was "a choice rather than a gate" and that
  "nothing gates [production] but the review itself"; and the step 0 summary
  called production merely "may not be" clear.

**New**

- `documentation/043-retro.md` — this file.

## Assumptions made

- **"Six testers" means six opted in**, as the console counts them, rather than
  six people who agreed to help. If it is the latter the remaining number is
  larger than six and the plan is unchanged.
- Support's reply is taken as the operative answer. It is a support response
  and not a published policy statement, and the origin-not-owner reading is
  inferred from the workaround they offered rather than quoted from them. It
  agrees with the console, which is the evidence that has been right throughout.
- No retro before this one has been edited. 025 and 037 carry the earlier wrong
  readings and keep them; 037 already carries its own correction note.

Outstanding work is in [OPEN-ITEMS.md](./OPEN-ITEMS.md).
