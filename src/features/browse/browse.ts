import type { Match, Paint } from '../../domain/types';
import { hexToHSL } from '../../shared/lib/color';

/**
 * Get all unique brands from paint list
 */
export function getUniqueBrands(paints: Paint[]): string[] {
  const brands = new Set(paints.map((p) => p.brand));
  return Array.from(brands).sort();
}

/**
 * Filter paints by color (HSL range)
 * Returns paints with hex values in the specified hue range
 */
export function filterPaintsByColor(
  paints: Paint[],
  minHue: number,
  maxHue: number,
  minSaturation: number = 0,
  minBrightness: number = 0
): Paint[] {
  return paints.filter((paint) => {
    const [h, s, l] = hexToHSL(paint.hex);
    const hueInRange =
      (minHue <= maxHue && h >= minHue && h <= maxHue) ||
      (minHue > maxHue && (h >= minHue || h <= maxHue));

    return hueInRange && s >= minSaturation && l >= minBrightness;
  });
}

/**
 * Get top matches for a paint
 */
export function getTopMatches(
  paint: Paint,
  limit = 3,
  maxDelta = Number.POSITIVE_INFINITY
): Match[] {
  return paint.matches
    .slice()
    .sort((a, b) => a.delta - b.delta)
    .filter((match) => match.delta < maxDelta)
    .slice(0, limit);
}
