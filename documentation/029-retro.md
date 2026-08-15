# Retro 029 — Releasing to the App Store without a Mac

The iOS release had one plan since 001: reach a Mac over Parsec for an hour.
That plan died on inspection. The Mac is a 2015 MacBook Pro — macOS Monterey is
the last version it will ever run, Ventura dropped 2015 models, and Xcode 26
wants Sequoia 15.6. Since 28 April 2026 App Store Connect rejects anything not
built with Xcode 26 against the iOS 26 SDK. The machine was not behind; it was
permanently out of range, and no amount of downloading would change that.

So the release moved to a hosted macOS runner.
[`.github/workflows/ios-release.yml`](../.github/workflows/ios-release.yml) has
now archived and uploaded a real build. A release is `git push` and one button,
from Windows.

## What was done

### The objection that made CI "later" was already obsolete

The checklist had deferred CI to a second release on one specific ground: the
setup needs a distribution certificate and provisioning profile exported from a
Mac, base64'd into secrets and imported into a keychain per run. That is
circular when the missing Mac is the thing being worked around.

It is also no longer true. An **App Store Connect API key** is created entirely
in the web UI, and `xcodebuild -allowProvisioningUpdates` has Xcode *create* the
distribution certificate and App Store profile on the runner. Nothing is
exported from anywhere and no `.p12` ever exists. The setup is one key and four
repository secrets.

That reframes the comparison. CI was never the expensive option here — it was
the option whose cost was quoted from instructions written before the API
existed.

### Nine failures, six causes, and none of them said what they meant

The workflow was wrong in six distinct ways before it worked. Worth recording
in full, because the striking thing is not that they happened but that in every
case the error named something other than the fault:

| The error said | The cause was |
| --- | --- |
| `NSFileHandleOperationException: Broken pipe`, exit 134 | `xcodebuild -version \| head -1` — `head` closes the pipe and xcodebuild answers SIGPIPE with an uncaught Objective-C exception rather than exiting |
| `Your team has no devices from which to generate a provisioning profile` | Capacitor's template sets `CODE_SIGN_IDENTITY = "iPhone Developer"` at project level, so an archive asked for a *development* profile |
| `App has conflicting provisioning settings` | Automatic signing signs an archive for development and applies distribution only at export; the identity cannot be overridden |
| `iOS 26.0 is not installed` / `Found no destinations for the scheme` | Device platform support is a downloadable component, absent from some runner images |
| `Assets.xcassets: error: No simulator runtime version ... available` | On-demand resources are on by default and `actool` consults simulator runtimes while processing them, even compiling for device |
| `Cloud signing permission error` | The API key had App Manager; creating certificates needs Admin |

Three of those are worth more than a row.

**The platform, not the SDK.** `xcodebuild -showsdks` lists `iOS 26.0` on every
image, including the ones where nothing can be built for iOS. The SDK ships
inside Xcode; *device platform support* is separate and downloadable, and hosted
images carry it inconsistently. The same unchanged command archived on one run
and failed on the next, which read as a regression in the previous fix and was
not. Only `xcodebuild -showdestinations` says it plainly, listing the
destination as ineligible with the reason attached. `-runFirstLaunch` does not
install it; `-downloadPlatform iOS` does, and the workflow now runs that only
when the destination is actually unusable, because it costs several minutes and
a few GB.

**Signing has an order, and it is not the obvious one.** A runner is never a
registered device and never can be, so a development profile cannot be issued
to it — and automatic signing insists on one at archive time. Overriding the
identity is refused outright. The way through is that App Store distribution
profiles carry no device requirement: archive with signing off, and let
`-exportArchive` create the certificate and profile and sign there.

**Least privilege was the wrong instinct.** The API key was given App Manager
on the reasoning that it only needs to upload builds. But
`-allowProvisioningUpdates` does not use a distribution certificate, it creates
one, and certificates and profiles are gated to Account Holder and Admin. The
key authenticated perfectly and was refused only at the point of minting. A
key's role cannot be edited afterwards, so the correction cost a new key and two
updated secrets.

### The real blocker was that the errors could not be read

Diagnosis stalled twice, not on difficulty but on visibility. `xcodebuild`
interleaves the output of parallel tasks, so the line explaining a failure lands
hundreds of lines from `** ARCHIVE FAILED **`, and the Actions log viewer offers
no way to see them together. Two attempts at reading the asset catalog failure
found the banner, the list of failed commands and the compiler invocation — and
never the error itself.

The fix was to stop reading and start extracting: tee the build to a file,
reprint every `error:` line in a collapsed group at the end, and upload the log
and the `.xcresult` as an artifact. The next run named the cause in one line.
That change did not fix anything, and was the most valuable commit in the
sequence.

### Two project changes fell out of it

Everything else was workflow YAML, but the repo needed two things:

- **A shared scheme.** Xcode keeps schemes under `xcuserdata` until explicitly
  shared, and that is not committed. The project therefore opens perfectly on a
  developer machine while `xcodebuild -scheme App` fails with "scheme not
  found" on every fresh clone. `App.xcscheme` is now committed, and
  `iosProject.test.ts` ties its `BlueprintIdentifier` back to a target that
  exists in the pbxproj — a file-exists check would pass on a scheme pointing at
  a deleted target.
- **A recorded Node version.** `.nvmrc` and an `engines` floor, because nothing
  in the repo said which Node to install and the only honest answer lived in
  `ci.yml` where nobody setting up a machine would look. The floor is `>=22`
  rather than an exact pin, so a newer Node already installed is not a fight.

## What this did not fix

- **Nothing compiles Swift until a release runs.** Per-push CI still does not
  build the iOS target, so a broken `AppDelegate` surfaces minutes into a
  release rather than on the pull request. Closing that means macOS runner
  minutes on every push.
- **The app has never run on iOS hardware.** Unchanged by any of this. It is
  what TestFlight is for.
- **Runner images remain unstable ground.** The platform download is a
  mitigation, not a guarantee, and it is the difference between a 15-minute run
  and a 45-minute one. Image *versions* cannot be pinned — `macos-latest`
  already resolves to `macos-26`, and both the working and failing runs were the
  same label.
