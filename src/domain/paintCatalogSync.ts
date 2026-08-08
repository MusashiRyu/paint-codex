import { PAINT_CATALOG_URL, parsePaintCatalog } from './paintCatalogSource';
import { signCatalog, writeCachedCatalog } from './paintCatalogCache';
import {
  getBundledPaints,
  getCatalogSignature,
  getPaints,
  getSourceHtmlHash,
  markSourceHtmlHash,
  setPaints,
} from './paintRepository';
import { hashString } from '../shared/lib/hash';
import type { Paint } from './types';

/**
 * Background refresh of the paint catalogue.
 *
 * Runs once at launch, off the critical path: the app is already interactive
 * on the bundled or cached catalogue, and if this succeeds the new paints swap
 * in underneath. Nothing here reports progress or failure to the user —
 * offline is the normal case, not an error worth a dialog.
 */

const FETCH_TIMEOUT_MS = 15_000;

/**
 * Upstream is a scraped HTML table, so a markup change reads as "most paints
 * vanished" rather than as a parse error. Anything under this share of the
 * snapshot we ship is treated as a broken parse, not as deletions.
 */
const MIN_PAINT_RATIO = 0.5;

export type PaintCatalogSyncResult =
  | { status: 'updated'; paintCount: number }
  | { status: 'unchanged' }
  | { status: 'rejected'; reason: string }
  | { status: 'failed'; reason: string };

let inFlight: Promise<PaintCatalogSyncResult> | undefined;

async function fetchCatalogHtml(): Promise<string> {
  // AbortController rather than AbortSignal.timeout: the latter needs a
  // WebView newer than some still-supported Android devices ship.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(PAINT_CATALOG_URL, {
      // Revalidate rather than trust the 5-minute max-age, so a launch really
      // does check. Unchanged upstream answers 304 and costs us a round trip,
      // not the document. No custom headers, so there is no CORS preflight.
      cache: 'no-cache',
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function runRefresh(): Promise<PaintCatalogSyncResult> {
  let html: string;
  try {
    html = await fetchCatalogHtml();
  } catch (error) {
    return { status: 'failed', reason: error instanceof Error ? error.message : 'fetch failed' };
  }

  const htmlHash = hashString(html);
  if (htmlHash === getSourceHtmlHash()) {
    return { status: 'unchanged' };
  }

  let nextPaints: Paint[];
  try {
    nextPaints = parsePaintCatalog(html);
  } catch (error) {
    return { status: 'rejected', reason: error instanceof Error ? error.message : 'parse failed' };
  }

  const floor = Math.floor(getBundledPaints().length * MIN_PAINT_RATIO);
  if (nextPaints.length < floor) {
    return {
      status: 'rejected',
      reason: `parsed ${nextPaints.length} paints, expected at least ${floor}`,
    };
  }

  // The document changed but the paints in it may not have — upstream is a
  // whole web page, most of which is not catalogue data. Remember the document
  // so the next launch short-circuits, but skip the render.
  if (signCatalog(nextPaints) === getCatalogSignature()) {
    markSourceHtmlHash(htmlHash);
    writeCachedCatalog(getBundledPaints(), { htmlHash, paints: getPaints() });
    return { status: 'unchanged' };
  }

  writeCachedCatalog(getBundledPaints(), { htmlHash, paints: nextPaints });
  setPaints(nextPaints, htmlHash);
  return { status: 'updated', paintCount: nextPaints.length };
}

/**
 * Fetch upstream and adopt it if it parses to a plausible catalogue.
 *
 * Concurrent calls share one request. Never rejects — every outcome, including
 * being offline, comes back as a result the caller may ignore.
 */
export function refreshPaintCatalog(): Promise<PaintCatalogSyncResult> {
  inFlight ??= runRefresh().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}
