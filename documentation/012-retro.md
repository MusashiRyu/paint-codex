# Retro 012 — Closing out the Play Store work

Everything that remained for a submission except the one thing that needs an
account rather than code.

## What was done

### 1. The privacy policy is a page, not a file

Play wants a URL. `store/privacy-policy.md` was markdown, and every plausible
host treats a bare `.md` differently — GitHub Pages only renders it when Jekyll
is configured with a theme, so dropping it in as-is serves raw text with the
pipe tables showing.

`npm run privacy` renders it into `store/privacy.html`: one file, 6.2 KB, with
no external stylesheet, font or script. Self-contained on purpose — a privacy
policy that phones a CDN while claiming the app contacts nobody would be its
own small joke. The markdown stays the source.

Light by default, dark when the reader prefers it, rather than the app's
near-black in both. This is the page someone might print, read on a borrowed
phone, or be sent by a reviewer; legibility beats brand. Verified by rendering
it — no horizontal scroll at either 360px or 820px, which is where the long
catalog URL would otherwise push the layout sideways.

### 2. Two Console fields nobody had written down

**Release notes.** Play asks for "What's new" on every release including the
first, 500 characters. Written for 1.0.0.

**Store settings.** Contact email is required *and shown publicly on the
listing* — worth knowing before typing a personal address into it. Phone and
website are optional and equally public.

`npm run listing:check` picked the release-notes field up with no change to the
script, which is what reading the limits out of the document headings was for.

### 3. The privacy-policy hosting question, answered properly

The blocker section now names three hosts in the order that makes sense here,
and warns off the obvious shortcut: **privacy-policy generator sites**. They
host for free, which is the appeal, but they emit boilerplate asserting
analytics, cookies and third-party sharing this app does not do — and Play
cross-checks the policy against the Data safety answers. The accurate text
already exists; only hosting was ever missing.

### 4. A finding that outlives the store work

**This repo has no git remote, and two GitHub Actions workflows that have
therefore never run.** `ci.yml` has never verified a commit. `upstream-check.yml`
— which `0.1-architecture.md` calls *the alarm for the silent refresh* — has
never armed.

That second one gets worse, not better, at launch. The catalog refresh is
silent by design: no spinner, no toast, no error surface. It degrades to "no
change" rather than to a broken screen, which is the right behavior and also
means a markup change upstream would strand every install on its bundled
snapshot with nothing to notice it. The workflow is the only thing that would
tell anyone. Recorded in the release checklist, since pushing to GitHub would
resolve the policy hosting, CI and the alarm together.

## Files changed

### New
- `tools/store/privacy-page.mjs`, `store/privacy.html`
- `documentation/012-retro.md`

### Modified
- `store/listing.md` — release notes, store settings, hosting requirements
- `store/README.md`, `documentation/release-checklist.md`
- `package.json` — `privacy` script, `marked` as a devDependency

## Verified, not assumed

- **Clean release build**, `gradlew clean bundleRelease` from scratch rather
  than an up-to-date task graph. 4.99 MB, `jar verified`,
  `CN=Paco, O=Musashi, C=NL`.
- **Every store asset against Play's stated requirements** — 512×512 no-alpha
  icon, 1024×500 feature graphic, four 1080×1920 screenshots. All pass.
- Lint clean, typecheck clean, 95 tests pass.

## Measured, and found not to be a problem

- **Headless Edge will not launch from Git Bash on this machine** but launches
  fine from PowerShell, same executable and same arguments. It fails with
  `Failed to launch the browser process: Code: 0` and an empty stderr, which
  reads like a browser problem and is not one. Anything driving Puppeteer here
  should be run from PowerShell.

## Open items

See [OPEN-ITEMS.md](OPEN-ITEMS.md). The privacy policy URL is the last
shipping blocker and needs a hosting decision, not code.
