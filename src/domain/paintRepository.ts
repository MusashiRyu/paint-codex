import paintsSnapshot from '../data/paints.snapshot.json';
import type { Paint } from './types';
import { readCachedCatalog, signCatalog } from './paintCatalogCache';

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
