# Scraper Tool

This folder contains development-only tooling and is never shipped in the app bundle.

## Purpose

`scrape.mjs` fetches the Citadel, Vallejo and Army Painter color tables from
Arcturus5404/miniature-paints and writes app data to:

- `src/data/paints.snapshot.json`

## Run

From repository root:

```bash
npm run scrape
```

## Notes

- `scrape.mjs` and `checkUpstream.mjs` are the exception to "no imports from
  `src/`": they import `PAINT_CATALOG_SOURCES` and `parsePaintCatalog` from
  `src/domain/paintCatalogSource.ts`, because the app refreshes the same
  catalog at runtime and a second parser would let the two disagree about the
  same documents. The import runs on Node's type stripping, so that module must
  stay free of non-erasable syntax and of value imports from `src/` — which is
  why the CIELAB conversion lives inside it rather than in `shared/lib/color.ts`.
- `scrapeShopLinks.mjs` was deleted in 037 with the export feature it fed. It
  was the one tool holding to the original rule — no imports from `src/`, types
  kept local in `types.ts` — so `types.ts` now has no importer. Left in place
  rather than swept up with the feature: it is the shape any future scraper
  would start from. The affiliate-links idea that would have been its next
  caller was dropped in the same retro, so nothing is currently queued for it.
- `buildIdMigration.mjs` is a one-shot, not part of any pipeline. It produced
  `src/data/paintIdMigration.json` when paint ids gained their range, reading
  the pre-migration snapshot out of git history. Its output is committed; see
  the header comment before re-running it.

## Upstream

`Arcturus5404/miniature-paints` is MIT-licensed and its README invites reuse.
The three tables Paco reads are listed in `PAINT_CATALOG_SOURCES`, alongside the
brand labels the app shows — upstream's file is `Citadel_Colour.md`, the app
says "Citadel". Keep that mapping there rather than deriving it from the file
name, or a rename upstream leaks into every paint id.
