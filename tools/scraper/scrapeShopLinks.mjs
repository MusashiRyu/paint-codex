import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAINTS_PATH = join(__dirname, '..', '..', 'src', 'data', 'paints.snapshot.json');
const OUT_PATH = join(__dirname, '..', '..', 'src', 'data', 'shopLinks.snapshot.json');

const BASE_URL = 'https://www.vliegeruit.com';
const BRAND_SOURCES = {
  Citadel: '/citadel/',
  Vallejo: '/vallejo-verf/',
  'Army Painter': '/warpaints-the-army-painter/',
};

const BRAND_SEARCH_HINTS = {
  Citadel: 'citadel',
  Vallejo: 'vallejo',
  'Army Painter': 'army painter',
};

const SET_KEYWORDS = [
  'set',
  'bundle',
  'complete',
  'starter',
  'box',
  'collection',
  'paint station',
];

function normalizeText(input) {
  return input
    .toLowerCase()
    .replace(/&amp;/g, ' and ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b\d+\s*ml\b/g, ' ')
    .replace(/\b(game color|model color|air color|xpress color|warpaints fanatic|citadel|vallejo|army painter|the)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalizeHref(href) {
  const decoded = decodeHtml(href).replace(/\s+/g, '');
  return decoded.startsWith('http') ? decoded : `${BASE_URL}/${decoded.replace(/^\//, '')}`;
}

function cleanTitle(raw) {
  return decodeHtml(raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function isLikelySet(title) {
  const normalized = title.toLowerCase();
  return SET_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function tokenize(text) {
  return new Set(normalizeText(text).split(' ').filter(Boolean));
}

function scoreCandidate(paintName, productTitle) {
  const a = normalizeText(paintName);
  const b = normalizeText(productTitle);
  if (!a || !b) return 0;

  if (a === b) return 1;
  if (b.startsWith(a + ' ') || b.endsWith(' ' + a) || b.includes(' ' + a + ' ')) return 0.95;
  if (a.startsWith(b + ' ') || a.endsWith(' ' + b) || a.includes(' ' + b + ' ')) return 0.9;

  const aTokens = tokenize(a);
  const bTokens = tokenize(b);
  if (!aTokens.size || !bTokens.size) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }

  const overlap = intersection / aTokens.size;
  const jaccard = intersection / new Set([...aTokens, ...bTokens]).size;
  return overlap * 0.75 + jaccard * 0.25;
}

function buildSearchPath(query) {
  const params = new URLSearchParams({
    route: 'product/search',
    search: query,
    description: '1',
  });
  return `/index.php?${params.toString()}`;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchPage(path) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }
  return response.text();
}

function extractPageLinks(html) {
  const links = new Set();
  const re = /href="([^"]*\/page-\d+\/?)"/g;
  let match;
  while ((match = re.exec(html))) {
    const href = match[1];
    if (href.includes('/index.php?route=')) continue;
    if (href.startsWith('http')) {
      if (href.startsWith(BASE_URL)) {
        links.add(href.replace(BASE_URL, ''));
      }
      continue;
    }
    links.add(href.startsWith('/') ? href : '/' + href);
  }
  return [...links];
}

function extractProducts(html) {
  const products = [];
  const re = /<a[^>]*href="([^"]*index\.php\?route=product\/product[^"]*product_id=\d+[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = re.exec(html))) {
    const href = match[1];
    const rawText = match[2];
    const title = cleanTitle(rawText);
    if (!title) continue;
    const normalizedHref = normalizeHref(href);
    products.push({ title, url: normalizedHref });
  }
  return products;
}

async function crawlBrandProducts(path) {
  const visited = new Set();
  const queue = [path];
  const productMap = new Map();

  while (queue.length > 0) {
    const nextPath = queue.shift();
    if (!nextPath || visited.has(nextPath)) continue;
    visited.add(nextPath);

    let html;
    try {
      html = await fetchPage(nextPath);
    } catch (error) {
      console.warn(`Skipping ${nextPath}: ${error.message}`);
      continue;
    }

    const products = extractProducts(html);
    for (const product of products) {
      if (!productMap.has(product.url)) {
        productMap.set(product.url, product);
      }
    }

    const pageLinks = extractPageLinks(html);
    for (const page of pageLinks) {
      if (!visited.has(page)) queue.push(page);
    }
  }

  return [...productMap.values()];
}

function pickBestProduct(paint, products) {
  let best = null;
  let bestScore = 0;

  for (const product of products) {
    if (isLikelySet(product.title)) continue;
    const score = scoreCandidate(paint.name, product.title);
    if (score > bestScore) {
      bestScore = score;
      best = product;
    }
  }

  return bestScore >= 0.62 ? best : null;
}

function pickBestProductFromSearch(paint, products) {
  let best = null;
  let bestScore = 0;

  for (const product of products) {
    if (isLikelySet(product.title)) continue;
    const score = scoreCandidate(paint.name, product.title);

    const titleNorm = normalizeText(product.title);
    const hintNorm = normalizeText(BRAND_SEARCH_HINTS[paint.brand] || paint.brand);
    const brandBoost = titleNorm.includes(hintNorm) ? 0.06 : 0;
    const adjusted = Math.min(1, score + brandBoost);

    if (adjusted > bestScore) {
      bestScore = adjusted;
      best = product;
    }
  }

  return bestScore >= 0.66 ? best : null;
}

async function resolveBySearch(paint) {
  const queries = [
    `${BRAND_SEARCH_HINTS[paint.brand] || paint.brand} ${paint.name}`,
    paint.name,
  ];

  for (const query of queries) {
    const path = buildSearchPath(query);
    let html;
    try {
      html = await fetchPage(path);
    } catch (error) {
      console.warn(`Search failed for "${query}": ${error.message}`);
      continue;
    }

    const products = extractProducts(html);
    const best = pickBestProductFromSearch(paint, products);
    if (best) {
      return best;
    }

    await wait(140);
  }

  return null;
}

async function main() {
  const paints = JSON.parse(readFileSync(PAINTS_PATH, 'utf8'));
  const linksMap = {};

  const brandProducts = {};
  for (const [brand, path] of Object.entries(BRAND_SOURCES)) {
    console.log(`Crawling ${brand} catalog from ${path}`);
    const products = await crawlBrandProducts(path);
    brandProducts[brand] = products;
    console.log(`  Found ${products.length} unique product links`);
  }

  let mappedCount = 0;
  for (const paint of paints) {
    const products = brandProducts[paint.brand] || [];
    const best = pickBestProduct(paint, products);
    if (best) {
      linksMap[paint.id] = best.url;
      mappedCount += 1;
    }
  }

  const firstPassCount = mappedCount;
  let secondPassAdded = 0;
  const unmapped = paints.filter((paint) => !linksMap[paint.id]);

  console.log(`Second pass search for ${unmapped.length} unmapped paints...`);
  for (let i = 0; i < unmapped.length; i++) {
    const paint = unmapped[i];
    const found = await resolveBySearch(paint);
    if (found) {
      linksMap[paint.id] = found.url;
      mappedCount += 1;
      secondPassAdded += 1;
    }

    if ((i + 1) % 30 === 0) {
      console.log(`  Search progress: ${i + 1}/${unmapped.length}, added ${secondPassAdded}`);
    }

    await wait(80);
  }

  writeFileSync(OUT_PATH, JSON.stringify(linksMap, null, 2) + '\n');

  const coverage = ((mappedCount / paints.length) * 100).toFixed(2);
  console.log(`First pass: ${firstPassCount}/${paints.length}`);
  console.log(`Second pass added: ${secondPassAdded}`);
  console.log(`Mapped ${mappedCount}/${paints.length} paints (${coverage}%)`);
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});