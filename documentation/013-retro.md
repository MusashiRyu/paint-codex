# Retro 013 — On GitHub, and the last shipping blocker closed

The repo had never had a remote. Pushing it resolved three separate things at
once: the privacy policy needed a host, CI had never verified a commit, and the
upstream alarm had never armed.

## What was done

### 1. The author email was rewritten before the first push, not after

All 59 commits were authored by a personal gmail address. On a public repo that
is permanent and routinely scraped.

The point worth recording is the *timing*. A repo that has never been pushed has
no remote, no clones and no collaborators, so rewriting every commit costs
nothing but a few seconds. The same operation after the first push means a
force-push and a broken history for anyone who cloned. This was the last moment
it was free, which is why it was worth interrupting the push to do.

`git filter-branch --env-filter` over `-- master` only, deliberately not
`--branches`, so the `backup/pre-email-rewrite` branch created first still holds
the originals. Verified three ways: no gmail anywhere on `master`, the backup
branch still has it, and `master^{tree}` is byte-identical to the backup's tree
— content untouched, only SHAs and emails changed.

**The backup branch was never pushed.** It still contains the gmail; pushing
`--all` would have quietly undone the whole exercise.

### 2. Published, with Pages serving from `docs/`

`github.com/MusashiRyu/paint-codex`, public. Public matters: Pages needs a paid
plan on a private repo, and Actions minutes are unmetered on public ones.

The policy sits at an explicit `/privacy.html` rather than at the site root.
That URL goes into the Play Console and has to keep working for as long as the
app is listed; at the root it would have to move the first time this site wants
a landing page, and a dead privacy-policy link is a compliance problem rather
than a broken bookmark. `docs/index.html` is that landing page now, so the root
is not a 404 for anyone who trims the URL back.

Live and verified end to end — HTTP 200, and the served HTML actually contains
the policy text, the contact address and the non-affiliation notice rather than
merely existing.

### 3. The upstream alarm had never registered — and would not have

Enabling Actions was not enough. After the first push GitHub listed **two**
workflows: `ci.yml` and the Pages one. `upstream-check.yml` was on the remote,
was valid YAML, had `workflow_dispatch`, and Actions were enabled — but querying
it returned 404 and `gh workflow run` could not find it.

The cause: GitHub registers a workflow when an event evaluates it. The initial
push triggered `ci.yml`, which has no path filter. `upstream-check.yml` filters
on the parser, the snapshot, the scraper and itself — none of which the push
"changed", since every file was new but the filters are evaluated against a
diff. So it was never evaluated, never registered, and would have sat invisible
until the first Monday cron.

**An alarm nobody has ever heard ring is an assumption, not a safeguard.** It
took a commit touching the workflow file — which is in its own paths filter — to
register and fire it.

### 4. Both workflows moved to actions v7

Found while fixing the above: the Pages run warned that `actions/checkout@v4`
targets Node 20 and was being force-migrated to Node 24 by the runner. Both
actions are on **v7**; this repo pinned v4, three majors behind. Upgraded in
both workflows, which also provided the legitimate change to
`upstream-check.yml` that registration needed.

## Files changed

### New
- `docs/privacy.html`, `docs/index.html`
- `documentation/013-retro.md`

### Modified
- `.github/workflows/ci.yml`, `.github/workflows/upstream-check.yml` — actions v7
- `tools/store/privacy-page.mjs` — output moved to `docs/`
- `store/listing.md`, `store/README.md`, `documentation/release-checklist.md`,
  `documentation/OPEN-ITEMS.md` — live URL, blocker closed, items renumbered

## Decisions taken

- **Public, not private.** Pages on a private repo needs a paid plan, and the
  repo is clean — no keystore, no credentials, and the upload-key password
  appears nowhere in the working tree or anywhere in history. Both were checked
  before publishing rather than assumed, because a secret committed once and
  deleted later still ships with the repo.
- **`user.email` pinned per-repo, not globally.** Future commits here use the
  noreply address; the global config is left alone so other repos are unaffected.

## Open items

See [OPEN-ITEMS.md](OPEN-ITEMS.md). **Nothing blocks the Play Store submission
any more.** The two remaining items are a dormant feature flag and a Mac-only
iOS flow.
