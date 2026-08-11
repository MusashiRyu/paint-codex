import type { Paint } from '../../domain/types';
import { CLOSE_DELTA_MAX } from '../../shared/lib/color';
import { MAX_EQUIVALENTS } from './ResultCard';

/**
 * A result card's height, before anything has been laid out.
 *
 * The list is windowed, so the cards above and below the viewport are not in
 * the DOM and their heights have to come from somewhere. They are estimated
 * here and replaced with measurements the moment a card is on screen.
 *
 * The estimate is worth having because card height is variable but not
 * unpredictable: what dominates it is the number of equivalent tiles, and that
 * is a property of the data, countable with no layout at all. Tile-count aware,
 * the estimate is out by about a wrapped line — call it 15px. A single constant
 * would be out by 380px, which is the difference between a scroll that feels
 * like a list and one that lurches.
 */

/**
 * The card's box, in pixels, as `ResultCard.module.css` builds it. Each number
 * is the sum of the CSS it stands for, written out so a change to that CSS has
 * an obvious number to change here.
 *
 * Nothing depends on these being exactly right, and this app never draws a
 * scrollbar (`global.css` hides them), so an error is not even a rendered
 * pixel — only the feel of a long fling through cards nobody has seen yet.
 */
export const CARD_METRICS = {
  /** padding 14×2 + border 1×2 + margin-bottom 14. The pitch, not the box. */
  chrome: 44,
  /** .paintRow: 16px name + 3 + 11px brand + 2 + 12px meta, at ~1.4 leading. */
  head: 59,
  /** .equivalents: 12 margin + 12 padding + 1 rule + 15 label + 8 label margin. */
  equivChrome: 48,
  /** .noEquiv, one 13px line. */
  noEquiv: 18,
  /** .equivCard: 20 chrome + 34 swatch + 7 + 14 name + 2 + 14 brand + 7 + 23 pill. */
  tile: 122,
  /** .equivGrid `gap`. */
  tileGap: 10,
  /** .equivGrid's `minmax` floor — the same 136 the stylesheet states. */
  tileMin: 136,
  /** .resultCard padding ×2 + border ×2: scroller width minus this is grid width. */
  inset: 30,
  /** .resultCard margin-bottom, which `getBoundingClientRect` does not include. */
  margin: 14,
} as const;

/** Columns `repeat(auto-fill, minmax(136px, 1fr))` fits into `width`. */
export function equivalentColumns(width: number): number {
  const { tileMin, tileGap } = CARD_METRICS;
  return Math.max(1, Math.floor((width + tileGap) / (tileMin + tileGap)));
}

/**
 * Tiles a paint will actually render: what `getTopMatches` keeps, without
 * resolving anything. Counting rather than resolving is the point — this runs
 * for every paint in the catalogue, not just the mounted ones.
 */
export function visibleTileCount(paint: Paint, paintsById: Map<string, Paint>): number {
  let count = 0;
  for (const match of paint.matches) {
    if (match.delta >= CLOSE_DELTA_MAX) continue;
    if (!paintsById.has(match.id)) continue;
    if (++count === MAX_EQUIVALENTS) break;
  }
  return count;
}

/** A result card's pitch: its own height plus the margin below it. */
export function estimateCardHeight(tileCount: number, scrollerWidth: number): number {
  const m = CARD_METRICS;
  const base = m.chrome + m.head + m.equivChrome;
  if (tileCount === 0) return base + m.noEquiv;
  const rows = Math.ceil(tileCount / equivalentColumns(scrollerWidth - m.inset));
  return base + rows * m.tile + (rows - 1) * m.tileGap;
}
