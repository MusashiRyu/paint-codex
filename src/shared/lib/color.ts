/**
 * The single source of truth for how a ΔE match quality is classified.
 * Anything rendering a delta must go through here, so the same number never
 * reads as "close" in one view and "distant" in another.
 */

/** A match at or above this delta is not shown as an equivalent. */
export const CLOSE_DELTA_MAX = 7;

/** Below this delta a match is treated as visually indistinguishable. */
export const VERY_CLOSE_DELTA_MAX = 3;

export type DeltaQuality = 'very-close' | 'close' | 'distant';

export function getDeltaQuality(delta: number): DeltaQuality {
  if (delta < VERY_CLOSE_DELTA_MAX) return 'very-close';
  if (delta < CLOSE_DELTA_MAX) return 'close';
  return 'distant';
}

/**
 * CSS custom property group backing each quality, so the pill colours in every
 * view come from one mapping.
 */
const QUALITY_TOKENS: Record<DeltaQuality, string> = {
  'very-close': 'ok',
  close: 'warn',
  distant: 'bad',
};

export interface DeltaStyle {
  background: string;
  border: string;
  color: string;
}

export function getDeltaStyle(delta: number): DeltaStyle {
  const token = QUALITY_TOKENS[getDeltaQuality(delta)];
  return {
    background: `var(--${token}-bg)`,
    border: `var(--${token}-border)`,
    color: `var(--${token}-text)`,
  };
}

export function getDeltaLabel(delta: number): string {
  const quality = getDeltaQuality(delta);
  if (quality === 'very-close') return 'Very close';
  if (quality === 'close') return 'Close';
  return 'Distant';
}
