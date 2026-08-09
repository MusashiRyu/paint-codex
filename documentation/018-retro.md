# Retro 018 — The browser was there the whole time

The last thing blocking the first Play submission was four stale screenshots
that could not be regenerated because, as OPEN-ITEMS had said since 014, "no
Chrome is installed". That statement was true. It was also the wrong
conclusion, and it stood for four retros.

The screenshots are regenerated. No browser was installed.

## What was done

### The forensics, because they changed the answer

The question that started this was the user's, and it was the right one: before
installing Chrome, how were these screenshots made the first time?

- **`npm run screenshots` made them, on this machine, twice** — 2026-08-08 at
  18:38 (the first set, 008) and 21:11 (regenerated in 011 after the `shared/ui`
  extraction).
- **Driven by Edge, not Chrome.** Chrome has never been installed here; there is
  nothing in `C:\Program Files\Google\Chrome`,
  `C:\Program Files (x86)\Google\Chrome` or `%LOCALAPPDATA%\Google\Chrome`, not
  even an uninstall remnant. `findChrome()` fell past both Chrome paths to Edge,
  and Edge worked.
- **Edge's version is not what changed.** It was already on build
  151.0.4129.72 — updated that morning at 12:12 — for *both* successful runs.
- **The script is not what changed.** Its only edits since were seed paint ids
  and `version: 2 → 4`, nowhere near the launch path.

So "install Chrome" was never the fix, because Chrome was never the thing that
worked. Something about the machine changed between 21:11 on the 8th and the
014 session on the 9th, and per the decision taken this session that is not
being chased: with a browser that starts, the question is academic.

### There was a working Chromium on the disk the entire time

`%LOCALAPPDATA%\ms-playwright\chromium-1234\chrome-win64\chrome.exe`, version
151.0.7922.34. Downloaded 2026-08-08 at 20:18 — *between the two successful
runs* — by a `playwright-core` that briefly lived in this repo's
`node_modules`. The cache's `.links` file still names
`C:\Repositories\Paco\node_modules\playwright-core`, a path npm has since
pruned. The binary is orphaned and intact.

It captured all four screenshots on the first attempt.

### The actual defect: choosing a browser by existence

This is the part worth keeping. `findChrome()` returned the first candidate that
**existed**, and `main()` launched exactly that one:

```js
const found = CHROME_CANDIDATES.find((p) => existsSync(p));
```

Edge exists. So Edge was chosen. So the run died — and the error said *"No
Chromium found"*, which sent the reader off to install a browser while a working
Chromium sat on the same disk. Every part of that message was misleading, and it
was believed for four retros.

`launchBrowser()` now tries each candidate until one actually starts, collecting
the rejections, and the failure message distinguishes the two cases that matter:

```
    C:/Program Files/Google/Chrome/Application/chrome.exe
      absent
    C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe
      exists, but did not start: Failed to launch the browser process:  Code: 0
```

`absent` means install something. `exists, but did not start` means try a
different one. The old message could not tell them apart, which is precisely why
this took four retros instead of one command.

Candidate order is now `CHROME_PATH` → Chrome → Playwright's Chromium → Edge.
The override wins by construction; Edge goes last because it is the one with a
demonstrated failure here. The Playwright entry carries a comment saying plainly
that the binary belongs to another tool, is neither installed nor updated by
this project, and is a convenience rather than a dependency — everything still
works without it.

The reordering also means this self-heals. Installing Chrome later, or losing
the orphan to a cache prune, needs no edit.

One smaller thing fell out of moving the launch earlier: `main()` used to start
`vite preview` first, so a browser that failed left no server behind. With the
browser first, a preview failure would have leaked a headless Chromium. `preview`
is now declared outside the `try` and started inside it, so the `finally` closes
the browser on that path too.

### Verified by looking, not by exit code

011 recorded that two capture steps use `?.click()` and would silently no-op if
a selector stopped matching — so a zero exit code proves nothing. All four PNGs
were opened and checked against the current app:

| Shot | What confirms it is current |
| --- | --- |
| `01-list` | Category headings read `BASE · AIR`, and rows read `CITADEL · Base · Air` — the range merge from 014 |
| `02-search` | Equivalent tiles name brand *and* range (`Army Painter · Warpaints Fanatic`); `FOUND 228 PAINT(S)` against the 2,279 catalogue; tiles fill the card, the 016 grid fix |
| `03-second-list` | Rendered at all — it requires the `?.click()` tab switch to have landed |
| `04-new-list` | Requires the second `?.click()`; shows all 8 emblems and 5 banner colours |

All four are 1080×1920.

The fallback path was tested rather than assumed: `CHROME_PATH` pointed at
`package.json` (a file that exists and is not a browser) still produced
screenshots, falling through to the Playwright Chromium — the exact behaviour
the old code lacked. Forcing every candidate to fail produced the rejection
report above.

## Files changed

**New**
- `documentation/018-retro.md`

**Modified**
- `tools/store/screenshots.mjs` — `findChrome()` → `launchBrowser()`, Playwright
  cache candidate, reordered list, rejection-reporting failure message, preview
  leak on the browser-first path
- `store/graphics/screenshots/*.png` (4) — regenerated
- `documentation/OPEN-ITEMS.md` — item 2 closed and moved to *Recently closed*;
  3–7 renumbered to 2–6, cross-references in item 5 updated
- `documentation/release-checklist.md` — heading back to "Nothing is blocking
  the first submission", which is true again
- `documentation/0.1-architecture.md` — the screenshots row
- `README.md` — browser resolution, and that a green run is not proof

## Assumptions made

- **The Playwright Chromium may vanish.** Nothing here manages it, and a
  `playwright uninstall` would remove it. That is acceptable because the
  candidate list degrades: losing it is one more `absent` line, not a broken
  tool.
- **Edge's `Code: 0` stays unexplained.** Provably not the version and not the
  code; beyond that it is machine state. Recorded rather than solved.
- **The screenshots are correct as captured.** Checked by eye against the
  current UI, which is the only check that exists — no automated assertion
  covers what a screenshot depicts.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
