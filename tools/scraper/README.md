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

- Do not import from `src/` into scraper code.
- Keep scraper type definitions local in `tools/scraper/types.ts`.