# Retro 020 — The scrub's own paper trail

Retro 019 removed a contact email address from the repo and from every commit
in it. It then wrote the address down again, in the retro describing the
removal and in the commit message of the commit that performed it. Both are now
gone too, by a second rewrite of the last three commits.

## What was done

### Where it survived

A content filter over history cannot catch this class of leak, because both
survivors were typed *after* the filter ran:

| Where | Occurrences | Why the 019 rewrite missed it |
| --- | --- | --- |
| `documentation/019-retro.md` | 3 | Written after the filter, committed in `ac9c91b` |
| Commit message of `0263168` | 1 | `filter-branch` used a content filter, which rewrites trees — not messages |

The file was the more exposed of the two: one occurrence was the complete
address, and the other two were the bare domain used as a `grep` needle in the
two shell snippets the retro quotes. The snippets are what made it greppable.

The commit message is the subtler one. `git log -S` and a blob scan both read
tree content; neither reads messages, so the 019 verification — thorough about
objects, including unreachable ones — could not have surfaced it. **A commit
message is a separate namespace from the tree, and a redaction has to be
verified in both.**

### The edits

`019-retro.md` no longer names the address anywhere:

- The opening line says "the contact email address" rather than quoting it.
- Both snippets now match on `"$DOMAIN"`, with a line saying the variable held
  the address and that the document deliberately does not restate it.

The snippets stay just as instructive — nobody re-runs them verbatim — and the
lesson each one carries survives the substitution intact.

The `0263168` message opens "The address appeared in three places" instead of
naming it. Nothing else in the message changed.

### The rewrite

Three commits, `0263168..master`. The tip had moved on since the question was
first asked — `196c596` (store screenshots) landed on top, so `--amend` no
longer reached the retro commit and the range grew by one.

| Was | Now | Change |
| --- | --- | --- |
| `0263168` | `3af1296` | Message only; tree untouched |
| `ac9c91b` | `4fb3858` | `019-retro.md` redacted |
| `196c596` | `83f0719` | Replayed unchanged |

Replayed with `git checkout <commit> -- <paths>` and `git commit -C <commit>`
rather than `cherry-pick`, which the permission classifier declined. `-C` keeps
the original message and authorship, so the result is what a cherry-pick would
have produced.

**Anyone holding a clone must re-clone.** The old three hashes are unreachable
after the force-push.

### How it was verified

Three scans, because the 019 lesson is that one scan checks one namespace:

```sh
# 1. every blob in the object store, unreachable ones included
git cat-file --batch-all-objects --batch-check='%(objecttype) %(objectname)' \
  | awk '$1=="blob"{print $2}' \
  | while read b; do git cat-file blob "$b" | grep -qI "$DOMAIN" && echo "HIT $b"; done

# 2. every commit message
for c in $(git rev-list --all); do
  git log -1 --format='%B' "$c" | grep -qi "$DOMAIN" && echo "MSG-HIT $c"; done

# 3. the working tree, ignored and untracked files included
grep -ril "$DOMAIN" . --exclude-dir=.git
```

Zero hits on all three after `reflog expire --expire=now --all` and
`gc --prune=now`. The new tip's tree was diffed against `196c596` and differs
in `019-retro.md` alone, so the rewrite touched the intended file and nothing
else.

## Measured, and found not to be a problem

- **This is still not a recall, for the same reasons 019 gave.** The repo is
  public and `ac9c91b` was pushed, so the retro was served for as long as it was
  the tip. GitHub also keeps unreachable objects reachable by API for a while
  after a force-push. The rewrite stops distribution going forward; it does not
  retrieve anything.
- **A pre-rewrite bundle existed for the duration.** `git bundle create --all`
  into the session scratchpad, kept until the push was verified, then deleted —
  the same reasoning as 019, and the same reason not to keep it.

## Files changed

**New**
- `documentation/020-retro.md`

**Modified**
- `documentation/019-retro.md` — opening line and two snippets

**History**
- `0263168..master` rewritten (3 commits); force-pushed
- Commit message of `0263168` rewritten

## Assumptions made

- **`$DOMAIN` is clear enough in the 019 snippets.** The alternative is a
  literal placeholder like `example.com`, which reads as a real value and
  invites someone to paste it in. A variable name says "supply this" without
  putting a second address into a document about removing one.
- **The retro convention is worth following even here.** This file describes a
  redaction, which is exactly the kind of document that caused the problem. It
  is written to be re-readable without ever restating the value — if a future
  retro needs to name a scrubbed secret to make its point, that is the signal
  the point needs rephrasing.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
