import type { Match, Paint } from './types';

/**
 * Pure queries over the paint catalogue. Kept out of the feature folders so
 * more than one view can share them without importing across features.
 */

/** Brands present in the catalogue, sorted, for building filter controls. */
export function getUniqueBrands(paints: Paint[]): string[] {
  const brands = new Set(paints.map((p) => p.brand));
  return Array.from(brands).sort();
}

/**
 * A paint's equivalents, best first and capped. The snapshot stores matches in
 * arbitrary order, so callers must not render `paint.matches` directly.
 */
export function getTopMatches(
  paint: Paint,
  limit = 3,
  maxDelta = Number.POSITIVE_INFINITY
): Match[] {
  return paint.matches
    .filter((match) => match.delta < maxDelta)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, limit);
}
