import { describe, it, expect } from 'vitest';
import { mixRamp, deriveTheoryColors, MIX_STEP_PERCENTS } from '../domain/colorLab';
import { findNearestPaint, getLabIndex, setPaints, resetPaints } from '../domain/paintRepository';
import { getTopMatches } from '../domain/paintQueries';
import { getPaintIndex } from '../domain/paintRepository';
import type { Paint } from '../domain/types';

/**
 * The Color Lab computes colours that are not paints, then finds the paint
 * nearest each one. Both halves are asserted here: the transforms, and the
 * lookup that turns their output back into something buyable.
 */

const paint = (id: string, brand: string, hex: string, matches: Paint['matches'] = []): Paint => ({
  id,
  brand,
  name: id,
  hex,
  matches,
});

describe('mixRamp', () => {
  it('starts at A and ends at B exactly', () => {
    // The endpoints are what the slots above the strip show, so a rounding
    // error here would render the same paint in two different colours.
    const ramp = mixRamp('#102030', '#A0B0C0');
    expect(ramp[0].hex).toBe('#102030');
    expect(ramp[ramp.length - 1].hex).toBe('#A0B0C0');
  });

  it('steps in 20% increments', () => {
    expect(mixRamp('#000000', '#FFFFFF').map((s) => s.pct)).toEqual([...MIX_STEP_PERCENTS]);
  });

  it('interpolates linearly between the two', () => {
    // 50% is not a step, so the midpoint check is the pair either side of it.
    const ramp = mixRamp('#000000', '#FFFFFF');
    expect(ramp[2].hex).toBe('#666666'); // 40% of 255 = 102 = 0x66
    expect(ramp[3].hex).toBe('#999999'); // 60% of 255 = 153 = 0x99
  });

  it('returns nothing for a hex it cannot parse', () => {
    // A catalogue restored from localStorage never went through the parser's
    // normalizeHex, so this input is reachable. The panel renders its empty
    // state rather than a swatch of "#NaNNaNNaN".
    expect(mixRamp('not-a-hex', '#FFFFFF')).toEqual([]);
    expect(mixRamp('#FFFFFF', '#GGG')).toEqual([]);
  });

  it('emits uppercase hex, like the catalogue', () => {
    // These render in a column beside catalogue hexes; mixed case would show.
    for (const step of mixRamp('#0a0b0c', '#d4d5d6')) {
      expect(step.hex).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});

describe('deriveTheoryColors', () => {
  it('returns complementary, highlight and shade in that order', () => {
    expect(deriveTheoryColors('#6A0A01').map((c) => c.key)).toEqual([
      'complementary',
      'highlight',
      'shade',
    ]);
  });

  it('wraps a hue past 360 rather than clamping it', () => {
    // Every base above hue 180 derives a complementary past 360. Clamping would
    // collapse the whole blue-to-magenta half of the wheel onto red.
    const [complementary] = deriveTheoryColors('#0F3B6E'); // Macragge Blue, hue ~212
    expect(complementary.hex).toBe('#6E420F');
  });

  it('lightens for a highlight and darkens for a shade', () => {
    const [, highlight, shade] = deriveTheoryColors('#55672C');
    const lightness = (hex: string) =>
      Number.parseInt(hex.slice(1, 3), 16) +
      Number.parseInt(hex.slice(3, 5), 16) +
      Number.parseInt(hex.slice(5, 7), 16);
    expect(lightness(highlight.hex)).toBeGreaterThan(lightness('#55672C'));
    expect(lightness(shade.hex)).toBeLessThan(lightness('#55672C'));
  });

  it('caps the highlight below white', () => {
    // Without the ceiling every pale base derives the same #FFFFFF, and the
    // highlight card stops saying anything about the paint it came from.
    const [, highlight] = deriveTheoryColors('#F0EEE8');
    expect(highlight.hex).not.toBe('#FFFFFF');
  });

  it('floors the shade above black', () => {
    // The mirror of the highlight cap: every dark base would derive #000000.
    const [, , shade] = deriveTheoryColors('#101010');
    expect(shade.hex).not.toBe('#000000');
  });

  it('returns nothing for a hex it cannot parse', () => {
    expect(deriveTheoryColors('#12345')).toEqual([]);
  });
});

describe('findNearestPaint', () => {
  const catalog = [
    paint('near', 'Citadel', '#FF0000'),
    paint('far', 'Vallejo', '#00FF00'),
    paint('middling', 'Army Painter', '#CC1111'),
  ];

  it('returns the true minimum, not the first close enough', () => {
    const found = findNearestPaint('#FE0101', catalog);
    expect(found?.paint.id).toBe('near');
  });

  it('reports the delta at two decimals, like a stored match', () => {
    // Equivalents render ΔE from the snapshot at this precision. A Lab number
    // beside one of those has to read the same way.
    const found = findNearestPaint('#CC1111', catalog);
    expect(found?.delta).toBe(0);
    const other = findNearestPaint('#DD2222', catalog);
    expect(other?.delta).toBe(Math.round(other!.delta * 100) / 100);
  });

  it('will return a same-brand paint where getTopMatches would not', () => {
    // The reason this exists rather than reusing the equivalents: a computed
    // colour has no brand to exclude, so excluding one would hide the answer.
    const citadelPair = [
      paint('citadel-a', 'Citadel', '#FF0000', [{ id: 'vallejo-far', delta: 40 }]),
      paint('citadel-b', 'Citadel', '#FE0000'),
      paint('vallejo-far', 'Vallejo', '#00FF00'),
    ];
    const index = getPaintIndex(citadelPair);

    expect(findNearestPaint('#FE0000', citadelPair)?.paint.id).toBe('citadel-b');
    // The same paint's equivalents skip the neighbour entirely: it is same-brand.
    expect(getTopMatches(citadelPair[0], index).map((m) => m.paint.id)).toEqual(['vallejo-far']);
  });

  it('answers null on an empty catalogue or an unreadable colour', () => {
    expect(findNearestPaint('#FF0000', [])).toBeNull();
    expect(findNearestPaint('not-a-hex', catalog)).toBeNull();
  });

  it('skips a paint whose own hex does not parse', () => {
    // Same reachable-bad-cache case as the transforms guard against. A NaN
    // distance must not win the comparison and become the answer.
    const withBad = [paint('bad', 'Citadel', '#ZZZZZZ'), paint('good', 'Vallejo', '#00FF00')];
    expect(findNearestPaint('#00FF00', withBad)?.paint.id).toBe('good');
  });
});

describe('getLabIndex', () => {
  it('rebuilds when the catalogue is replaced', () => {
    // The background refresh swaps the catalogue mid-session. An index held
    // against the old array would answer with paints that have left it.
    const first = [paint('a', 'Citadel', '#FF0000')];
    const second = [paint('b', 'Vallejo', '#00FF00')];

    setPaints(first);
    const before = getLabIndex();
    setPaints(second);
    const after = getLabIndex();

    expect(after).not.toBe(before);
    expect(findNearestPaint('#00FF00')?.paint.id).toBe('b');
    resetPaints();
  });

  it('hands back the same array for the same catalogue', () => {
    const catalog = [paint('a', 'Citadel', '#FF0000')];
    expect(getLabIndex(catalog)).toBe(getLabIndex(catalog));
  });
});
