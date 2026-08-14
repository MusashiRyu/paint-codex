/**
 * The colour transforms behind the Color Lab: blending two paints, and deriving
 * a complementary, a highlight and a shade from one.
 *
 * Pure and catalogue-free on purpose. Turning a computed colour back into a
 * paint you can buy is a separate job, and it lives with the catalogue in
 * `paintRepository.findNearestPaint`.
 *
 * Every hex in and out is `#RRGGBB`, uppercase, matching the catalogue's own
 * format — these values are rendered directly beside catalogue hexes.
 */

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * A catalogue read back out of localStorage has not been through the parser's
 * `normalizeHex`, so a malformed hex is reachable here. Returning null rather
 * than NaN channels keeps `#NaNNaNNaN` off the screen: the panels render their
 * empty state instead.
 */
function parseHex(hex: string): Rgb | null {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  const n = Number.parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toHex({ r, g, b }: Rgb): string {
  return (
    '#' +
    [r, g, b]
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
      .toUpperCase()
  );
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;

  return { h: h * 60, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  // The wheel is circular, so a derived hue past 360 — every complementary of a
  // hue above 180 — has to wrap rather than clamp.
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let rgb: [number, number, number];
  if (hue < 60) rgb = [c, x, 0];
  else if (hue < 120) rgb = [x, c, 0];
  else if (hue < 180) rgb = [0, c, x];
  else if (hue < 240) rgb = [0, x, c];
  else if (hue < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];

  return { r: (rgb[0] + m) * 255, g: (rgb[1] + m) * 255, b: (rgb[2] + m) * 255 };
}

/** The blend ratios the mix strip shows, as percentages of Paint B. */
export const MIX_STEP_PERCENTS = [0, 20, 40, 60, 80, 100] as const;

export interface MixStep {
  /** How much of Paint B is in this step, 0 to 100. */
  pct: number;
  hex: string;
}

/**
 * Paint A to Paint B in 20% steps, endpoints included.
 *
 * The interpolation is in sRGB, which is worth a word because the app measures
 * colour in CIELAB everywhere else. A mix strip is a preview of a blend, not a
 * measurement: nothing is compared against a threshold here, so the smoother
 * Lab path would buy an inverse conversion nothing else in the app wants. The
 * ΔE shown against each step is still computed in Lab, so the number and the
 * swatch it sits under never disagree.
 *
 * Neither is a model of physical paint, which mixes subtractively. The strip
 * says what these two colours look like blended, and the nearest-paint row
 * under it is what makes that actionable.
 */
export function mixRamp(hexA: string, hexB: string): MixStep[] {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  if (!a || !b) return [];

  return MIX_STEP_PERCENTS.map((pct) => {
    const t = pct / 100;
    return {
      pct,
      hex: toHex({
        r: a.r + (b.r - a.r) * t,
        g: a.g + (b.g - a.g) * t,
        b: a.b + (b.b - a.b) * t,
      }),
    };
  });
}

export type TheoryKey = 'complementary' | 'highlight' | 'shade';

export interface TheoryColor {
  key: TheoryKey;
  label: string;
  /** One line on what the colour is for, shown under the heading. */
  description: string;
  hex: string;
}

/**
 * How far each derived colour moves from its base, in HSL.
 *
 * These are the design's numbers, and they are deliberately blunt: a highlight
 * is "much lighter and a little less saturated", a shade is "much darker and a
 * little more saturated". The clamps matter more than the deltas — without the
 * lightness ceiling every pale base derives the same white, and without the
 * floor every dark base derives the same black.
 */
const HIGHLIGHT = { saturation: -12, lightness: +38, lightnessMax: 95 };
const SHADE = { saturation: +8, lightness: -32, lightnessMin: 6 };

/**
 * A paint's complementary, highlight and shade.
 *
 * Order is fixed and is the order they render in: the contrast colour first,
 * then the two that sit either side of the base on a blended edge.
 */
export function deriveTheoryColors(hex: string): TheoryColor[] {
  const rgb = parseHex(hex);
  if (!rgb) return [];
  const { h, s, l } = rgbToHsl(rgb);

  return [
    {
      key: 'complementary',
      label: 'Complementary',
      description: 'Opposite hue — for contrast trim and accents.',
      hex: toHex(hslToRgb({ h: h + 180, s, l })),
    },
    {
      key: 'highlight',
      label: 'Highlight',
      description: 'Lightened for edge highlights and raised details.',
      hex: toHex(
        hslToRgb({
          h,
          s: Math.max(0, s + HIGHLIGHT.saturation),
          l: Math.min(HIGHLIGHT.lightnessMax, l + HIGHLIGHT.lightness),
        })
      ),
    },
    {
      key: 'shade',
      label: 'Shade',
      description: 'Darkened for recesses and shadow work.',
      hex: toHex(
        hslToRgb({
          h,
          s: Math.min(100, s + SHADE.saturation),
          l: Math.max(SHADE.lightnessMin, l + SHADE.lightness),
        })
      ),
    },
  ];
}
