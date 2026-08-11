import paintsSnapshot from '../data/paints.snapshot.json';
import type { Paint } from './types';
import { readCachedCatalog, signCatalog } from './paintCatalogCache';
import { sortPaintsPerceptually } from './paintQueries';

/**
 * The live paint catalogue.
 *
 * Three layers, newest wins: a catalogue refreshed from upstream this session,
 * one cached from a previous session, and the snapshot bundled with the build.
 * The bundled snapshot is always present, so reads are synchronous and the app
 * has paints to show before any network call is made — see `paintCatalogSync`
 * for the refresh that runs in the background at launch.
 */

const bundledPaints = paintsSnapshot as Paint[];

export function getBundledPaints(): Paint[] {
  return bundledPaints;
}

const cached = readCachedCatalog(bundledPaints);

let paints: Paint[] = cached?.paints ?? bundledPaints;
let sourceHtmlHash: string | undefined = cached?.htmlHash;
let indexCache: Map<string, Paint> | undefined;
let indexedCatalog: Paint[] | undefined;
let browseOrderCache: Paint[] | undefined;
let browsePositionCache: Map<string, number> | undefined;
let browseOrderedCatalog: Paint[] | undefined;
let signatureCache: string | undefined;

const listeners = new Set<() => void>();

/** Returns the current catalogue. The reference is stable until it changes. */
export function getPaints(): Paint[] {
  return paints;
}

/**
 * Identity of the current catalogue's contents, memoised. Lets the refresh
 * tell "upstream changed" from "upstream changed in a way that matters".
 */
export function getCatalogSignature(): string {
  signatureCache ??= signCatalog(paints);
  return signatureCache;
}

/**
 * Hash of the upstream document the current catalogue came from, or undefined
 * when we are still serving the bundled snapshot. The refresh compares against
 * this to decide whether a fetched document is worth parsing.
 */
export function getSourceHtmlHash(): string | undefined {
  return sourceHtmlHash;
}

/**
 * Record which upstream document the current catalogue matches, without
 * touching the catalogue itself. Used when a changed document turns out to
 * parse to the paints we already have — worth remembering, not worth a render.
 */
export function markSourceHtmlHash(htmlHash: string): void {
  sourceHtmlHash = htmlHash;
}

/** Subscribe to catalogue replacements. Returns an unsubscribe function. */
export function subscribeToPaints(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Replace the catalogue and notify subscribers. Callers own validation — this
 * takes whatever it is given, which is why `paintCatalogSync` is the only
 * production caller.
 */
export function setPaints(next: Paint[], htmlHash?: string): void {
  paints = next;
  sourceHtmlHash = htmlHash;
  signatureCache = undefined;
  for (const listener of listeners) listener();
}

/**
 * Restore the bundled snapshot.
 *
 * A test seam, and only that: a rejected cache never reaches here, because
 * `readCachedCatalog` answers undefined and the seeding above falls through to
 * the bundled array on its own. Kept because the catalogue is module state
 * seeded at import, so a test that replaces it has no other way back.
 */
export function resetPaints(): void {
  setPaints(bundledPaints, undefined);
}

/**
 * Catalogue keyed by paint id. Memoised against the array it was built from,
 * so replacing the catalogue invalidates it without anyone having to remember
 * to say so.
 */
export function getPaintIndex(catalog: Paint[] = getPaints()): Map<string, Paint> {
  if (!indexCache || indexedCatalog !== catalog) {
    indexCache = new Map(catalog.map((paint) => [paint.id, paint]));
    indexedCatalog = catalog;
  }
  return indexCache;
}

/**
 * The catalogue in perceptual order — what the search sheet browses.
 *
 * Memoised against the array it was built from, on the same contract as
 * `getPaintIndex` and for the same reason: the background refresh replaces the
 * catalogue, and an order held against the old array would put the browse view
 * at paints that have left it. The sort is ~2ms, so this is not about the cost
 * of sorting; it is about paying it once per catalogue rather than once per
 * sheet, and the sheet unmounts on every close.
 */
export function getBrowseOrder(catalog: Paint[] = getPaints()): Paint[] {
  if (!browseOrderCache || browseOrderedCatalog !== catalog) {
    browseOrderCache = sortPaintsPerceptually(catalog);
    browsePositionCache = new Map(browseOrderCache.map((paint, at) => [paint.id, at]));
    browseOrderedCatalog = catalog;
  }
  return browseOrderCache;
}

/**
 * Each paint's position in `getBrowseOrder`, for opening the list on one of
 * them. Built with the order rather than by the caller, so the two can never
 * disagree about where a paint is.
 */
export function getBrowsePosition(catalog: Paint[] = getPaints()): Map<string, number> {
  getBrowseOrder(catalog);
  return browsePositionCache as Map<string, number>;
}

/**
 * Resolve stored ids to catalogue entries, so a list always reflects the
 * current snapshot. Ids no longer present are dropped rather than rendered as
 * holes — a paint can disappear when the catalogue is rescraped.
 */
export function resolvePaints(paintIds: string[], catalog: Paint[] = getPaints()): Paint[] {
  const index = getPaintIndex(catalog);
  const resolved: Paint[] = [];
  for (const id of paintIds) {
    const paint = index.get(id);
    if (paint) resolved.push(paint);
  }
  return resolved;
}
