# Retro 034 — Cutting 1.2.0

`feat/color-lab` is on master and 1.2.0 is built for both stores. No new
features and no fixes: this is the release itself, which is its own piece of
work and worth recording as one.

## What went out, and why it is a minor bump

Three retros' worth of work reached a store artefact for the first time:

| From | What |
| --- | --- |
| 030 | The status bar overlap and the portrait lock |
| 031 | The Color Lab — a second screen |
| 033 | The blank sheet when opening a paint's equivalents |

A new screen is a minor bump, so 1.2.0 / `versionCode` 4. The bump has four
homes and `appVersion.test.ts` fails the build if any of them drift, which is
the only reason it takes one command rather than an afternoon of grep.

`versionCode` 3 is skipped rather than reused. It was cut for the App Store
upload that came back on Guideline 2.1, and `CFBundleVersion` must *increase on
every upload*, not on every release — a rejected build burns its number as
thoroughly as a released one.

## The listing was the work

The build was mechanical. What actually needed deciding was the store copy, and
open item 11 had been sitting on it since 031 with the reasoning already
written: **a listing that describes a colour laboratory and shows four pictures
of a list is worse than one that never mentions it.** The description had been
updated when Collab shipped. The screenshots had not.

So the shot list is now one per section of the description — the list, the
catalogue with its equivalents, and the Color Lab's two halves. The
second-list and new-list shots are what gave way, and they were the two showing
a screen the set already had.

That is a rule worth keeping rather than a one-off fix. The failure mode is not
"the screenshots are old"; it is that copy and images are edited in different
sessions by different reasoning, and only the copy gets updated when a feature
lands. Tying the count to the description's sections means the next feature that
earns a paragraph also earns a picture, or the mismatch is obvious.

**Mephiston Red into Averland Sunset** for the mix strip, deliberately. Two
paints from opposite sides of the wheel mostly blend through mud — true of
paint, and a poor picture. Red to yellow runs through orange and reads as a
gradient at a glance.

## Two things in the shipped screenshots to be aware of

Neither is wrong, and both were left alone rather than tuned away:

- The Matching shot's shade match is **Chaos Black, "Foundation
  (discontinued)"**. It is an accurate match at Δ4.16 out of a catalogue that
  includes discontinued ranges, which is a feature — a conversion table that
  hid them would be less useful to someone holding an old pot. It does read
  oddly on a product page.
- Its highlight match wears a **red Δ7.74 badge**. The instinct is to pick a
  base paint that scores green three times; the badge exists to say when a
  match is poor, and a set of screenshots where it never fires would be
  advertising a rubber stamp.

Both are the user's call, not the generator's, which is why they are here rather
than fixed in `screenshots.mjs`.

## What this did not do

- **Nothing is uploaded.** The `.aab` is signed and verified and the APK is
  built; both stores still need the manual steps. The iOS half cannot even start
  until master is pushed, because the workflow builds from the pushed commit.
- **Still no hardware confirmation.** Open items 10 and 13 both wait on this
  build, and so does the screen recording App Review asked for. That is one
  session on the iPhone 15 Pro Max, and it is the next real work.
- **No screenshot has ever shown a status bar.** They are captured in desktop
  Chromium, where the safe-area insets are always zero. Regenerating them for
  1.2.0 did not change that and no amount of regenerating will.
