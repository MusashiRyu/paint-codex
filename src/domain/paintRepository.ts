import paintsSnapshot from '../data/paints.snapshot.json';
import type { Paint } from './types';
import { readCachedCatalog, signCatalog } from './paintCatalogCache';
import { hexToLab } from './paintCatalogSource';
import type { ResolvedMatch } from './paintQueries';
import { sortPaintsPerceptually } from './paintQueries';

/**
 * The live paint catalog.
 *
 * Three layers, newest wins: a catalog refreshed from upstream this session,
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
let labIndexCache: Float64Array | undefined;
let labIndexedCatalog: Paint[] | undefined;
let signatureCache: string | undefined;

const listeners = new Set<() => void>();

/** Returns the current catalog. The reference is stable until it changes. */
export function getPaints(): Paint[] {
  return paints;
}

/**
 * Identity of the current catalog's contents, memoized. Lets the refresh
 * tell "upstream changed" from "upstream changed in a way that matters".
 */
export function getCatalogSignature(): string {
  signatureCache ??= signCatalog(paints);
  return signatureCache;
}

/**
 * Hash of the upstream document the current catalog came from, or undefined
 * when we are still serving the bundled snapshot. The refresh compares against
 * this to decide whether a fetched document is worth parsing.
 */
export function getSourceHtmlHash(): string | undefined {
  return sourceHtmlHash;
}

/**
 * Record which upstream document the current catalog matches, without
 * touching the catalog itself. Used when a changed document turns out to
 * parse to the paints we already have — worth remembering, not worth a render.
 */
export function markSourceHtmlHash(htmlHash: string): void {
  sourceHtmlHash = htmlHash;
}

/** Subscribe to catalog replacements. Returns an unsubscribe function. */
export function subscribeToPaints(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Replace the catalog and notify subscribers. Callers own validation — this
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
 * the bundled array on its own. Kept because the catalog is module state
 * seeded at import, so a test that replaces it has no other way back.
 */
export function resetPaints(): void {
  setPaints(bundledPaints, undefined);
}

/**
 * Catalog keyed by paint id. Memoized against the array it was built from,
 * so replacing the catalog invalidates it without anyone having to remember
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
 * The catalog in perceptual order — what the search sheet browses.
 *
 * Memoized against the array it was built from, on the same contract as
 * `getPaintIndex` and for the same reason: the background refresh replaces the
 * catalog, and an order held against the old array would put the browse view
 * at paints that have left it. The sort is ~2ms, so this is not about the cost
 * of sorting; it is about paying it once per catalog rather than once per
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
 * Every paint's color in CIELAB, flat as `[L, a, b, L, a, b, …]`.
 *
 * Memoized against the array it was built from, on the same contract as
 * `getPaintIndex`. A typed array rather than objects because the only thing
 * that reads it is a scan over all 2,279 entries, several times per screen.
 */
export function getLabIndex(catalog: Paint[] = getPaints()): Float64Array {
  if (!labIndexCache || labIndexedCatalog !== catalog) {
    const lab = new Float64Array(catalog.length * 3);
    for (let i = 0; i < catalog.length; i++) {
      const [l, a, b] = hexToLab(catalog[i].hex);
      lab[i * 3] = l;
      lab[i * 3 + 1] = a;
      lab[i * 3 + 2] = b;
    }
    labIndexCache = lab;
    labIndexedCatalog = catalog;
  }
  return labIndexCache;
}

/**
 * The catalog paint closest to an arbitrary color, with its ΔE.
 *
 * This is the Color Lab's bridge back to reality: a mixed or derived color is
 * not a paint, so it has no precomputed `matches` to read and needs a live
 * scan. CIE76 in the Lab of `hexToLab`, which is the Lab the snapshot's own
 * deltas were measured in — the two numbers have to mean the same thing.
 *
 * Unlike `getTopMatches` this does **not** exclude any brand. Equivalents
 * answer "what do I buy instead of this Citadel paint", where the same brand is
 * an answer to a different question; this answers "what is closest to this
 * color", where every paint is a candidate.
 *
 * Null on an empty catalog or an unparseable color. The delta is often past
 * `CLOSE_DELTA_MAX` — a computed color has no reason to have a near neighbour
 * — and that is signal, not failure, which is why nothing is filtered here.
 */
export function findNearestPaint(hex: string, catalog: Paint[] = getPaints()): ResolvedMatch | null {
  if (catalog.length === 0) return null;
  const [l, a, b] = hexToLab(hex);
  if (!Number.isFinite(l)) return null;

  const lab = getLabIndex(catalog);
  let bestAt = -1;
  let bestSquared = Number.POSITIVE_INFINITY;

  for (let i = 0; i < catalog.length; i++) {
    const dl = l - lab[i * 3];
    const da = a - lab[i * 3 + 1];
    const db = b - lab[i * 3 + 2];
    const squared = dl * dl + da * da + db * db;
    if (squared < bestSquared) {
      bestSquared = squared;
      bestAt = i;
    }
  }

  if (bestAt === -1) return null;
  // Two decimals, the same precision the snapshot stores its own deltas at, so
  // a Lab number and an equivalent's number read alike.
  return {
    paint: catalog[bestAt],
    delta: Math.round(Math.sqrt(bestSquared) * 100) / 100,
  };
}

/**
 * Resolve stored ids to catalog entries, so a list always reflects the
 * current snapshot. Ids no longer present are dropped rather than rendered as
 * holes — a paint can disappear when the catalog is rescraped.
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
