import type { Paint } from './types';
import { hashString } from '../shared/lib/hash';

/**
 * Persistence for a catalog fetched at runtime, so an update survives the
 * app being closed. The bundled snapshot stays the floor: this cache is only
 * ever an overlay on top of it, and anything that fails to validate is thrown
 * away rather than repaired.
 */

const STORAGE_KEY = 'paco-paint-catalog';
const CACHE_VERSION = 1;

export type CachedCatalog = {
  /** Hash of the upstream HTML this catalog was parsed from. */
  htmlHash: string;
  paints: Paint[];
};

type StoredCatalog = CachedCatalog & {
  version: number;
  /**
   * Signature of the snapshot bundled with the build that wrote this entry.
   * When it stops matching, the app has been updated with a different
   * snapshot and we drop the cache — otherwise shipping a corrected catalog
   * in a release would never reach anyone who had already cached the bad one.
   */
  bundledSignature: string;
};

/** Identity of a catalog's contents, for equality checks only. */
export function signCatalog(paints: Paint[]): string {
  return `${paints.length}-${hashString(JSON.stringify(paints))}`;
}

function isPaintArray(value: unknown): value is Paint[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  // Spot-check the first entry; a wholesale validation would cost more than
  // the refresh that replaces a bad cache a second later.
  const first: unknown = value[0];
  if (typeof first !== 'object' || first === null) return false;
  const paint = first as Partial<Paint>;
  return (
    typeof paint.id === 'string' &&
    typeof paint.brand === 'string' &&
    typeof paint.name === 'string' &&
    typeof paint.hex === 'string' &&
    Array.isArray(paint.matches)
  );
}

/**
 * The cached catalog, or undefined if there is none we can trust. Signing
 * the bundled snapshot is deferred until an entry actually exists, so a first
 * launch does not pay for a comparison it has nothing to compare against.
 */
export function readCachedCatalog(bundledPaints: Paint[]): CachedCatalog | undefined {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable outright (private mode, disabled cookies).
    return undefined;
  }
  if (!raw) return undefined;

  try {
    const stored = JSON.parse(raw) as Partial<StoredCatalog>;
    if (
      stored.version !== CACHE_VERSION ||
      typeof stored.htmlHash !== 'string' ||
      !isPaintArray(stored.paints) ||
      stored.bundledSignature !== signCatalog(bundledPaints)
    ) {
      clearCachedCatalog();
      return undefined;
    }
    return { htmlHash: stored.htmlHash, paints: stored.paints };
  } catch {
    clearCachedCatalog();
    return undefined;
  }
}

export function writeCachedCatalog(bundledPaints: Paint[], entry: CachedCatalog): void {
  const stored: StoredCatalog = {
    version: CACHE_VERSION,
    bundledSignature: signCatalog(bundledPaints),
    ...entry,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Out of quota or storage unavailable. The refreshed catalog still
    // applies to this session; it just will not survive a restart.
    clearCachedCatalog();
  }
}

export function clearCachedCatalog(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — there is no fallback for storage we cannot touch.
  }
}
