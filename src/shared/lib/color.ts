/**
 * Convert hex color to HSL (Hue, Saturation, Lightness)
 */
export const CLOSE_DELTA_MAX = 7;

/**
 * Delta threshold for very close matches.
 */
const VERY_CLOSE_DELTA_MAX = 3;

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

/**
 * Get delta color class for display
 * Green: < 3, Yellow: < 7, Red: >= 7
 */
export function getDeltaColorClass(delta: number): string {
  if (delta < VERY_CLOSE_DELTA_MAX) return 'delta-green';
  if (delta < CLOSE_DELTA_MAX) return 'delta-yellow';
  return 'delta-red';
}

/**
 * Get delta quality label
 */
export function getDeltaLabel(delta: number): string {
  if (delta < VERY_CLOSE_DELTA_MAX) return 'Very close';
  if (delta < CLOSE_DELTA_MAX) return 'Close';
  return 'Distant';
}