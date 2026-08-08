# Scraper Tool

This folder contains development-only tooling and is never shipped in the app bundle.

## Purpose

`scrape.mjs` fetches paint conversion data from redgrimm and writes app data to:

- `src/data/paints.snapshot.json`

`scrapeShopLinks.mjs` crawls Vliegeruit brand paint pages and writes product link mappings to:

- `src/data/shopLinks.snapshot.json`

## Run

From repository root:

```bash
npm run scrape
npm run scrape:shoplinks
```

## Notes

- `scrape.mjs` is the one exception to "no imports from `src/`": it imports
  `PAINT_CATALOG_URL` and `parsePaintCatalog` from
  `src/domain/paintCatalogSource.ts`, because the app refreshes the same
  catalogue at runtime and a second parser would let the two disagree about the
  same document. The import runs on Node's type stripping, so that module must
  stay free of non-erasable syntax and of value imports from `src/`.
- `scrapeShopLinks.mjs` keeps the original rule: no imports from `src/`, and
  its types stay local in `tools/scraper/types.ts`.
