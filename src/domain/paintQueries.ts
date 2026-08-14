import { hexToLab } from './paintCatalogSource';
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
 *
 * These are cross-brand only, because they were built that way by the parser.
 * For "what is nearest to this colour" — where the answer may be any brand, and
 * where there is no paint to have precomputed matches for — see
 * `paintRepository.findNearestPaint`.
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

/**
 * Chroma below which a hue angle is arithmetic rather than colour. Adeptus
 * Battlegrey (#4A4C58) computes a hue of 285° and would file under purple; it
 * is a grey. The 541 paints under this threshold — a quarter of the catalogue —
 * are given a band of their own instead.
 */
const ACHROMATIC_CHROMA_MAX = 10;

/**
 * Hue bands the wheel is cut into, and the lightness step inside a band.
 *
 * The banding is not cosmetic: it is what makes the later keys fire at all. No
 * two of 2,279 hue angles are ever equal, so an unbanded "hue, then lightness"
 * sort never reaches its second key and orders the catalogue by a float nobody
 * can see. Measured over the shipped snapshot as the median CIE76 gap between
 * neighbouring entries — which is the number this ordering exists to make small:
 *
 *   catalogue order (brand blocks)        ΔE 36.95   121 adjacent pairs under 7
 *   raw hex string                        ΔE 23.02   411
 *   hue 15°, then lightness               ΔE  9.25   866
 *   hue 15°, lightness 10, then chroma    ΔE  5.91  1370   <- this
 *
 * The median neighbour therefore sits inside CLOSE_DELTA_MAX, which is the
 * property the browse view needs: scrolling one card is a substitutable colour.
 * A 5-wide lightness band scores marginally better at the median (5.66) and
 * distinctly worse at the p90 (19.23 against 15.58), so 10 it is.
 */
const HUE_BAND_DEGREES = 15;
const LIGHTNESS_BAND = 10;

/** Ahead of every hue band, so the neutrals do not scatter through the wheel. */
const ACHROMATIC_BAND = -1;

interface PerceptualKey {
  paint: Paint;
  band: number;
  lightnessBand: number;
  chroma: number;
}

function perceptualKey(paint: Paint): PerceptualKey {
  const [lightness, a, b] = hexToLab(paint.hex);

  // A catalogue read back out of localStorage has not been through
  // `normalizeHex`, and a comparator that returns NaN leaves Array#sort free to
  // produce any order at all.
  if (!Number.isFinite(lightness)) {
    return { paint, band: ACHROMATIC_BAND, lightnessBand: 0, chroma: 0 };
  }

  const chroma = Math.sqrt(a * a + b * b);
  const lightnessBand = Math.floor(lightness / LIGHTNESS_BAND);
  if (chroma < ACHROMATIC_CHROMA_MAX) {
    return { paint, band: ACHROMATIC_BAND, lightnessBand, chroma };
  }

  const degrees = (Math.atan2(b, a) * 180) / Math.PI;
  const hue = degrees < 0 ? degrees + 360 : degrees;
  return {
    paint,
    band: Math.min(Math.floor(360 / HUE_BAND_DEGREES) - 1, Math.floor(hue / HUE_BAND_DEGREES)),
    lightnessBand,
    chroma,
  };
}

/**
 * The catalogue in perceptual order: the near-neutrals first as a black-to-white
 * ramp, then the hue wheel from red, each band running dark to light and, within
 * one step of lightness, dull to vivid.
 *
 * The wheel is circular and a list is not, so it has to be cut somewhere. It is
 * cut at red, which leaves the deepest crimsons at the bottom of the list and
 * the reds at the top — the one pair of neighbours this order separates. The
 * neutrals lead rather than sit in the middle so they do not add a second cut.
 *
 * Decorate-sort-undecorate, so `hexToLab` runs once per paint rather than twice
 * per comparison: ~2,300 conversions instead of ~50,000.
 */
export function sortPaintsPerceptually(paints: Paint[]): Paint[] {
  const keys = paints.map(perceptualKey);
  keys.sort(
    (x, y) =>
      x.band - y.band ||
      x.lightnessBand - y.lightnessBand ||
      x.chroma - y.chroma ||
      // A total order, so the browse list is a function of the catalogue's
      // contents and not of the order the brands were parsed in — five paints
      // share #000000. Plain comparison rather than localeCompare, which would
      // order the catalogue differently on differently-configured phones.
      (x.paint.id < y.paint.id ? -1 : x.paint.id > y.paint.id ? 1 : 0)
  );
  return keys.map((key) => key.paint);
}
