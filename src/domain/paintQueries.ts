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
 * Key for `indexPaintsByName`. Brand and name are folded so a case or spacing
 * drift between the row that names an equivalent and the row that defines it
 * cannot hide a paint from the lookup, and joined on a separator no brand
 * carries so no two pairs can collide.
 */
export function paintNameKey(brand: string, name: string): string {
  return `${brand.trim().toLowerCase()}::${name.trim().toLowerCase()}`;
}

/**
 * Brand+name index over the catalogue. A `Match` carries no id, so resolving an
 * equivalent back to the paint it stands for needs a lookup; the map keeps that
 * off the render path when the full catalogue is on screen.
 */
export function indexPaintsByName(paints: Paint[]): Map<string, Paint> {
  return new Map(paints.map((paint) => [paintNameKey(paint.brand, paint.name), paint]));
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
