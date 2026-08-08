/**
 * Colour maths and the single source of truth for how a ΔE match quality is
 * classified. Anything rendering a delta must go through here, so the same
 * number never reads as "close" in one view and "distant" in another.
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

/** Legacy class-name form, kept for the CSS-module pill styling. */
export function getDeltaColorClass(delta: number): string {
  const quality = getDeltaQuality(delta);
  if (quality === 'very-close') return 'delta-green';
  if (quality === 'close') return 'delta-yellow';
  return 'delta-red';
}

export function getDeltaLabel(delta: number): string {
  const quality = getDeltaQuality(delta);
  if (quality === 'very-close') return 'Very close';
  if (quality === 'close') return 'Close';
  return 'Distant';
}

/** Convert a `#rrggbb` string to `[hue 0-360, saturation 0-100, lightness 0-100]`. */
export function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l * 100];
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return [h * 360, s * 100, l * 100];
}
