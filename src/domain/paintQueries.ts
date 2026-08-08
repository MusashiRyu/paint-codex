import type { Paint } from './types';

/**
 * Pure queries over the paint catalogue. Kept out of the feature folders so
 * more than one view can share them without importing across features.
 */

/** Brands present in the catalogue, sorted, for building filter controls. */
export function getUniqueBrands(paints: Paint[]): string[] {
  const brands = new Set(paints.map((p) => p.brand));
  return Array.from(brands).sort();
}

/** An equivalent, resolved to the paint it stands for. */
export interface ResolvedMatch {
  paint: Paint;
  delta: number;
}

/**
 * A paint's equivalents, best first and capped, resolved against the
 * catalogue. Callers must not render `paint.matches` directly: it stores ids
 * and deltas, and an id whose paint has since left the catalogue is dropped
 * here rather than rendered as a hole.
 */
export function getTopMatches(
  paint: Paint,
  index: Map<string, Paint>,
  limit = 3,
  maxDelta = Number.POSITIVE_INFINITY
): ResolvedMatch[] {
  const resolved: ResolvedMatch[] = [];
  for (const match of paint.matches) {
    if (match.delta >= maxDelta) continue;
    const target = index.get(match.id);
    if (target) resolved.push({ paint: target, delta: match.delta });
  }
  return resolved.sort((a, b) => a.delta - b.delta).slice(0, limit);
}
