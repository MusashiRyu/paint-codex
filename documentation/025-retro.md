# Retro 025 — The first upload, and a checklist corrected by contact with the Console

Paco 1.0.0 is on Google Play, on the internal and closed testing tracks. That
is the whole outcome of this session; almost no code changed.

What the session actually produced, beyond the upload itself, is a
`release-checklist.md` that matches reality. The checklist had been written from
Google's documentation and from reasoning about how Play works. The live Console
contradicted it three times in the first twenty minutes, and each contradiction
was the kind that costs an hour if you meet it alone at midnight.

## The three corrections

### The package name is registered before the app exists

The checklist said Console never asks for a package name, and that the string is
claimed silently by the first `.aab` upload. That is how it used to work and it
is wrong now.

There is an **Android developer verification** section with a *Register package
name* button, a *First, enter your package name* dialog taking the package name
and a friendly name, and a Draft state afterwards. It comes before **Create
app**, not after.

The friendly name is an internal label. `com.musashi.paco` had to be typed in
before an app entry existed at all.

### The verification key is the app signing key, not the upload key

Having registered the name, Console asks for a public key — and this is the one
worth getting right, because the obvious answer is wrong.

At that point in the flow the **upload key is the only key that exists**, so it
is the one you reach for. But Google's own wording says the certificate wanted
is the one whose "signing key is what Android uses to verify that app updates
are from you", and a device verifies an update against the key that signed the
*installed* app. Under Play App Signing that is Google's app signing key. An
update carrying only the upload key's signature is refused.

That key does not exist until Play App Signing enrollment, which happens at the
first release. So the correct order is: leave the package name in Draft, do
everything else, then read the fingerprint from **Release → Setup → App
signing**.

The recoverable part: more than one key can be registered per package, so
registering the upload key first is a mistake you can add your way out of rather
than one that strands the package name.

Also worth knowing, because it sends you down a blind alley otherwise: the field
takes a **SHA-256 fingerprint typed in**, not a certificate file. Exporting
`.pem` and `.der` was wasted effort. The fingerprint comes out of a signed
artefact without needing the keystore password:

```bash
"$JAVA_HOME/bin/keytool" -printcert -jarfile \
  android/app/build/outputs/bundle/release/app-release.aab
```

### Internal testing does not start the fourteen-day clock

Not a checklist error so much as a gap it left open. The 12-testers rule was
documented; that **internal** testing does not count toward it was not. The
tracks look equivalent in the Console sidebar and the fast, no-review one is the
tempting place to start.

Both tracks now have the build: internal for a quick real-device check, closed
because it is the only one where the clock runs.

## The bundle was stale, which is exactly the failure the checklist warns about

The `.aab` on disk was built 2026-08-08. Commit `a70c435` on 08-09 changed tile
sizing in the web app. Uploading that artefact would have claimed the package
name against a build missing the fix — and the release would have looked fine,
because a Capacitor bundle packages whatever last landed in
`android/app/src/main/assets/public`.

Rebuilt through `npm run cap:build` first, as the checklist has said to since
008. It grew 5,230,000 → 5,400,966 bytes, which is the fix arriving.

The APK, by contrast, was already current: Gradle reported
`:app:packageRelease UP-TO-DATE` against the freshly synced assets. Both
artefacts verify as `CN=Paco, O=Musashi, C=NL`.

## The deobfuscation warning

Every upload draws a Console warning about a missing deobfuscation file. It is
`minifyEnabled false` working as intended — nothing is obfuscated, so there is
no mapping file to supply and traces already carry real names. Recorded next to
the setting in the deliberate-settings table, because the warning suggests its
own fix and taking it would trade release-only breakage for a few hundred KB.

## Files changed

**New**
- `documentation/025-retro.md`

**Modified**
- `documentation/release-checklist.md` — package name registration as step 1,
  the key question, steps renumbered, the deobfuscation note, and a status
  section that says where the release actually is
- `documentation/OPEN-ITEMS.md` — item 8

**Not changed, deliberately**
- No source file. `versionCode` stays 1; it has now been used and the next
  upload has to increase it.

## Checked, and found not to be a problem

- **The store assets all clear Play's stated limits**, measured rather than
  assumed: icon 512×512 / 11 KB, feature graphic 1024×500 / 448 KB, four
  screenshots at 1080×1920 and ≤1 MB each. The screenshots are exactly 9:16 and
  exactly at the 1080 px promotion-eligibility floor, and four is exactly the
  minimum for that eligibility — so dropping one would cost it.
- **`npm run listing:check` passes all ten fields** across both stores.
- **The full verify ran before the rebuild** — lint, `tsc -b --noEmit`, and 134
  tests across 13 files.
- **All five hardware checks in release-checklist step 5 passed** on the 1.0.0
  release APK: launcher icon, splash with no white flash, back gesture closing
  each sheet including the About layer, the catalog refresh failing quietly
  with the radio off, and the About sheet's outbound links.

  The last of those had never been proven on a device since the About sheet
  shipped at 015 — nothing in the app opened an external URL before it, and
  `npm run dev` cannot test the WebView's `target="_blank"` handoff. It works.
  Had it not, the fix would have added `@capacitor/browser` as a fifth runtime
  dependency and forced a rewrite of the Data safety reasoning in
  `store/listing.md`, with the build already in testers' hands.

## Assumptions made

- **The app signing key is the right one to register.** Argued from Google's
  wording about update verification and from how Play App Signing works, not
  from a line of documentation stating it outright — the Play Console PDF guide
  says so, but it did not extract cleanly enough to quote. If Console rejects
  it, the upload key is the other candidate and both can be registered.
- **`com.musashi.paco` is worth living with.** It is not the reverse-DNS of a
  domain anyone owns, which is convention rather than rule and never checked.
  Flagged before registering and accepted deliberately; it is now permanent
  across all of Play.
- **The build went to testers before the hardware check, not after.** Deliberate
  — the fourteen-day clock only runs on the closed track, so starting it was
  worth more than the ordering. The check then passed on all five points, but
  that was luck confirming a judgment call rather than the judgment being
  safe. A failure on the links would have meant a new dependency and a corrected
  Data safety answer with the build already distributed.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
