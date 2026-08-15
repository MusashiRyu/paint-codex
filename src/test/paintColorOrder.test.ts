import { describe, expect, it } from 'vitest';
import type { Paint } from '../domain/types';
import { hexToLab } from '../domain/paintCatalogSource';
import { sortPaintsPerceptually } from '../domain/paintQueries';
import { getBrowseOrder, getBrowsePosition, getPaints } from '../domain/paintRepository';

/**
 * The browse order is the feature: a paint's neighbours in this list are what
 * the user is offered when the catalog holds no close equivalent. So the
 * tests that matter are not "is it sorted" but "are neighbours actually near
 * each other", measured in the same ΔE the app judges matches in.
 */

const paint = (id: string, hex: string): Paint => ({
  id,
  brand: 'Test',
  name: id,
  hex,
  matches: [],
});

const deltaE = (a: string, b: string) => {
  const [l1, a1, b1] = hexToLab(a);
  const [l2, a2, b2] = hexToLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
};

describe('sortPaintsPerceptually', () => {
  it('leads with the near-neutrals, dark to light', () => {
    const order = sortPaintsPerceptually([
      paint('red', '#FF0000'),
      paint('white', '#FFFFFF'),
      paint('black', '#000000'),
      paint('gray', '#808080'),
    ]).map((p) => p.id);

    expect(order.slice(0, 3)).toEqual(['black', 'gray', 'white']);
    expect(order[3]).toBe('red');
  });

  it('draws the neutral line at chroma, not at how gray a color looks', () => {
    // #4A4C58 computes a hue of 285° and would file under purple; it is a gray.
    const order = sortPaintsPerceptually([
      paint('purple', '#8000FF'),
      paint('battlegrey', '#4A4C58'),
      paint('white', '#FFFFFF'),
    ]).map((p) => p.id);

    expect(order).toEqual(['battlegrey', 'white', 'purple']);
  });

  it('runs each hue band dark to light', () => {
    // All three sit in the same 15° band (hue 32-38°), so lightness decides.
    const order = sortPaintsPerceptually([
      paint('light-red', '#C01411'),
      paint('dark-red', '#4A0603'),
      paint('mid-red', '#960C09'),
    ]).map((p) => p.id);

    expect(order).toEqual(['dark-red', 'mid-red', 'light-red']);
  });

  it('breaks a step of lightness on chroma, dull before vivid', () => {
    // Same band, same 10-wide lightness step (L 13.2 and 18.1): chroma is what
    // is left, and it is the axis that decides whether two paints of one
    // darkness read as the same color.
    const order = sortPaintsPerceptually([
      paint('vivid', '#5A0F0C'),
      paint('dull', '#4A0603'),
    ]).map((p) => p.id);

    expect(order).toEqual(['dull', 'vivid']);
  });

  it('walks the wheel from red', () => {
    const order = sortPaintsPerceptually([
      paint('blue', '#0F4B8F'),
      paint('red', '#960C09'),
      paint('green', '#1E7A2E'),
    ]).map((p) => p.id);

    expect(order).toEqual(['red', 'green', 'blue']);
  });

  it('orders by the catalog contents, not by the order brands were parsed in', () => {
    const paints = [
      paint('a', '#960C09'),
      paint('b', '#0F4B8F'),
      paint('c', '#000000'),
      paint('d', '#1E7A2E'),
      paint('e', '#FF9999'),
    ];

    const forwards = sortPaintsPerceptually(paints).map((p) => p.id);
    const backwards = sortPaintsPerceptually([...paints].reverse()).map((p) => p.id);

    expect(backwards).toEqual(forwards);
  });

  it('does not let an unparseable color scramble the sort', () => {
    // A catalog read back out of localStorage has not been validated. A NaN
    // comparator leaves Array#sort free to return any order at all.
    const order = sortPaintsPerceptually([
      paint('red', '#960C09'),
      paint('broken', 'not-a-color'),
      paint('black', '#000000'),
    ]).map((p) => p.id);

    expect(order).toHaveLength(3);
    expect(order).toContain('broken');
    expect(order.indexOf('black')).toBeLessThan(order.indexOf('red'));
  });
});

describe('the shipped catalog in browse order', () => {
  const order = getBrowseOrder(getPaints());

  /**
   * The number the ordering exists to make small. Raw catalog order scores a
   * median of 36.95 with 121 close pairs; this order measured 5.91 and 1,370
   * when it was chosen. The floors are loose enough to survive a rescrape and
   * tight enough that a broken comparator cannot pass.
   */
  it('puts a substitutable color one card away, on average', () => {
    const gaps: number[] = [];
    for (let i = 1; i < order.length; i++) gaps.push(deltaE(order[i - 1].hex, order[i].hex));
    const sorted = [...gaps].sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    const closePairs = gaps.filter((gap) => gap < 7).length;

    expect(median).toBeLessThan(8);
    expect(closePairs).toBeGreaterThan(1200);
  });

  it('keeps every paint, exactly once', () => {
    expect(order).toHaveLength(getPaints().length);
    expect(new Set(order.map((p) => p.id)).size).toBe(order.length);
  });

  it('reports where each paint sits, so the sheet can open on one', () => {
    const positions = getBrowsePosition(getPaints());
    const midway = order[1000];

    expect(positions.get(midway.id)).toBe(1000);
    expect(positions.size).toBe(order.length);
  });

  it('memoizes against the catalog array, as the id index does', () => {
    const catalog = getPaints();

    expect(getBrowseOrder(catalog)).toBe(getBrowseOrder(catalog));
    // A refreshed catalog is a new array, and must not reuse the old order.
    expect(getBrowseOrder([...catalog])).not.toBe(getBrowseOrder(catalog));
  });
});

describe('hexToLab', () => {
  it('is the same conversion the stored deltas were computed in', () => {
    const [black] = hexToLab('#000000');
    const [white] = hexToLab('#FFFFFF');

    expect(black).toBeCloseTo(0, 5);
    expect(white).toBeCloseTo(100, 5);
  });
});
