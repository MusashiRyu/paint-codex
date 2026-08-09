# Retro 019 — Removing an email address, including from history

The contact email address is gone from the repo and from every commit in it.
Three occurrences in the working tree, two commits' worth in history, and one
stale branch nobody had noticed was still holding it.

## What was done

### The three live occurrences

Not, as it happened, in `AboutSheet.tsx`. The About sheet links out to the
privacy policy, and the address was on *that* page — which is what "the about
page has an email address" turned out to mean.

| Where | Was | Now |
| --- | --- | --- |
| `store/privacy-policy.md` | Contact section | Points at the public issue tracker |
| `docs/privacy.html` | Generated from the above | Regenerated with `npm run privacy` |
| `store/listing.md` | Play's contact-email field | Recorded as chosen in Console, not written down |

**No address replaces it.** The privacy policy now sends people to
`github.com/MusashiRyu/paint-codex/issues`, with the two caveats that honestly
follow: an issue is public, so nothing private belongs in one; and there is
nothing to request access to or erasure of in the first place, because the app
holds no personal data. That second point matters more than it looks — a
Contact section on a privacy policy implies a data-subject request channel, and
this one has no records to act on. Saying so is more useful than implying
otherwise.

`store/listing.md` keeps the row and drops the value. That is a deliberate
exception to the entire reason that file exists — every other field is reviewed
in the repo *so that it is not improvised into a web form at midnight* — so the
Notes cell says why, and `release-checklist.md` step 4 now carries a callout,
because a required field that cannot be copied out of the repo is precisely the
one that gets forgotten at submission time.

### The history rewrite

`git filter-repo` was unavailable — it is a Python script and Python is not
installed on this machine — so this was `git filter-branch` with a content
filter, across all 75 commits of `master`.

**Anyone holding a clone of this repo must re-clone.** Every commit hash from
the first one onward has changed; `origin/master` moved from `f9e7373` to
`0263168` by force-push. There are no other branches, no tags and no open PRs,
which is the only reason this was cheap.

#### The first pass missed a file, and the reason generalises

The obvious filter is a list of the paths you know are affected:

```sh
for f in store/privacy-policy.md store/listing.md docs/privacy.html; do …
```

That pass ran clean and the pickaxe still found two commits. The privacy page
was originally generated at **`store/privacy.html`** and only moved to `docs/`
later, so in the commits where it was introduced the path in the filter did not
exist yet.

A path-based history filter is only as good as your memory of every path a file
has ever had — and a rename is exactly the thing you forget. The second pass
matched on content instead:

```sh
grep -rlI "$DOMAIN" . | while read -r f; do sed -i "s/…/…/g" "$f"; done
```

`$DOMAIN` held the address; this document deliberately does not restate it,
for the reason retro 020 records.

Slower per commit, correct regardless of where the file lived. Redacted to
`redacted@example.invalid` rather than to a marker, because `.invalid` is a
reserved TLD that can never route and it keeps the surrounding HTML valid.

#### The branch nobody was looking at

`backup/pre-email-rewrite` — 59 commits, local-only, never pushed, tip
`412c833`. It was the safety net for an *earlier* rewrite that changed the
commit author from a personal Gmail address to the GitHub noreply, and it had
outlived its purpose by a couple of days.

It was still holding both the address and the old author email — the second
being the very thing that earlier rewrite existed to remove. Deleting it, then
`gc --prune=now`, purged both. The author email across all of history is now
the noreply address alone.

### How it was verified

Pickaxe (`git log --all -S`) is the usual check and it is not sufficient on its
own: `-S` matches a commit where the *count* of a string changed, so a commit
that only ever removed the address still shows up, which reads as a failure when
it is not. The check that actually settles it is a scan of every blob in the
object store — `--batch-all-objects`, so unreachable objects are included too:

```sh
git cat-file --batch-all-objects --batch-check='%(objecttype) %(objectname)' \
  | awk '$1=="blob"{print $2}' \
  | while read b; do git cat-file blob "$b" | grep -qI "$DOMAIN" && echo "HIT $b"; done
```

Zero hits after the gc. Before it, that same scan is what confirmed the two
remaining sources were the stale remote-tracking ref and the backup branch,
rather than something the filter had missed.

The tip tree was diffed against the pre-rewrite commit and is byte-identical, so
the rewrite touched history and nothing else. `git fsck` is clean. Lint,
typecheck, 127 tests, build and `listing:check` all pass.

## Measured, and found not to be a problem

- **Removing the address does not un-publish it.** The repo is public and the
  privacy policy has been live on GitHub Pages, so the address has already been
  served, crawled and very likely cached. GitHub also keeps unreachable objects
  reachable by API for a while after a force-push. The rewrite stops it being
  *distributed* going forward; it is not a recall, and it was not treated as one.
- **A pre-scrub bundle existed for the duration.** `git bundle create --all`
  into the session scratchpad, kept until the push was verified, then deleted —
  keeping it would have preserved on disk exactly what the scrub removed.

## Files changed

**New**
- `documentation/019-retro.md`

**Modified**
- `store/privacy-policy.md` — Contact section
- `store/listing.md` — contact-email row
- `docs/privacy.html` — regenerated
- `documentation/release-checklist.md` — callout at step 4

**History**
- All 75 commits of `master` rewritten; force-pushed
- `backup/pre-email-rewrite` deleted

## Assumptions made

- **GitHub Issues is an adequate privacy contact for this app.** It is public,
  which is a real drawback for a privacy question, and it is defensible only
  because there is no personal data and therefore no request anyone could need
  to make privately. If the app ever collects anything, this needs a private
  channel and the policy needs rewriting.
- **The Play contact email is set in Console and never returns to the repo.**
  The checklist callout is the only thing preventing that from being discovered
  at submission time.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
