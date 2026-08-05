import { describe, it, expect } from 'vitest';
import type { Paint } from '../domain/types';
import {
  searchPaints,
  getAutocompleteSuggestions,
} from '../features/search/search';
import {
  getUniqueBrands,
  filterPaintsByColor,
  getTopMatches,
} from '../features/browse/browse';
import {
  getDeltaColorClass,
  getDeltaLabel,
  hexToHSL,
} from '../shared/lib/color';

const mockPaints: Paint[] = [
  {
    id: 'citadel-ceramite-white',
    brand: 'Citadel',
    name: 'Ceramite White',
    hex: '#ffffff',
    category: 'Base Layer',
    matches: [
      { brand: 'Vallejo', name: 'Dead White', hex: '#ffffff', delta: 0.0 },
      { brand: 'Army Painter', name: 'Matt White', hex: '#ffffff', delta: 0.0 },
    ],
  },
  {
    id: 'citadel-mephiston-red',
    brand: 'Citadel',
    name: 'Mephiston Red',
    hex: '#9b0e05',
    category: 'Base Layer',
    matches: [
      { brand: 'Vallejo', name: 'Gory Red', hex: '#810504', delta: 6.78 },
      { brand: 'Army Painter', name: 'Dragon Red', hex: '#9a1b1e', delta: 4.47 },
    ],
  },
  {
    id: 'vallejo-dead-white',
    brand: 'Vallejo',
    name: 'Dead White',
    hex: '#ffffff',
    category: 'Game',
    matches: [
      { brand: 'Citadel', name: 'Ceramite White', hex: '#ffffff', delta: 0.0 },
      { brand: 'Army Painter', name: 'Matt White', hex: '#ffffff', delta: 0.0 },
    ],
  },
  {
    id: 'army-painter-dragon-red',
    brand: 'Army Painter',
    name: 'Dragon Red',
    hex: '#9a1b1e',
    category: 'Base',
    matches: [
      { brand: 'Citadel', name: 'Mephiston Red', hex: '#9b0e05', delta: 4.47 },
      { brand: 'Vallejo', name: 'Gory Red', hex: '#810504', delta: 3.65 },
    ],
  },
];

// ─── searchPaints ────────────────────────────────────────────────────────────

describe('searchPaints', () => {
  it('returns all paints when query is empty and no brand filter', () => {
    const results = searchPaints(mockPaints, '');
    expect(results).toHaveLength(mockPaints.length);
  });

  it('returns only matching brand when query is empty and brand filter is set', () => {
    const results = searchPaints(mockPaints, '', 'Citadel');
    expect(results.every((p) => p.brand === 'Citadel')).toBe(true);
    expect(results).toHaveLength(2);
  });

  it('finds paints by name (exact)', () => {
    const results = searchPaints(mockPaints, 'Ceramite White');
    expect(results.some((p) => p.name === 'Ceramite White')).toBe(true);
  });

  it('finds paints by partial name', () => {
    const results = searchPaints(mockPaints, 'white');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.name.toLowerCase().includes('white'))).toBe(true);
  });

  it('supports fuzzy matching for typos', () => {
    // "ceramite whit" should still find "Ceramite White"
    const results = searchPaints(mockPaints, 'ceramite whit');
    expect(results.some((p) => p.name === 'Ceramite White')).toBe(true);
  });

  it('applies brand filter on top of query results', () => {
    const results = searchPaints(mockPaints, 'red', 'Citadel');
    expect(results.every((p) => p.brand === 'Citadel')).toBe(true);
  });

  it('returns empty array when no match found', () => {
    const results = searchPaints(mockPaints, 'xyznonexistentpaint');
    expect(results).toHaveLength(0);
  });
});

// ─── getAutocompleteSuggestions ──────────────────────────────────────────────

describe('getAutocompleteSuggestions', () => {
  it('returns empty array for empty query', () => {
    expect(getAutocompleteSuggestions(mockPaints, '')).toHaveLength(0);
  });

  it('returns suggestions matching the query', () => {
    const suggestions = getAutocompleteSuggestions(mockPaints, 'white');
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('respects the limit parameter', () => {
    const suggestions = getAutocompleteSuggestions(mockPaints, 'white', 1);
    expect(suggestions).toHaveLength(1);
  });

  it('returns at most 10 by default', () => {
    const suggestions = getAutocompleteSuggestions(mockPaints, 'a');
    expect(suggestions.length).toBeLessThanOrEqual(10);
  });
});

// ─── getUniqueBrands ─────────────────────────────────────────────────────────

describe('getUniqueBrands', () => {
  it('returns all unique brands sorted alphabetically', () => {
    const brands = getUniqueBrands(mockPaints);
    expect(brands).toEqual(['Army Painter', 'Citadel', 'Vallejo']);
  });

  it('returns empty array for empty paint list', () => {
    expect(getUniqueBrands([])).toHaveLength(0);
  });

  it('deduplicates brands', () => {
    const brands = getUniqueBrands(mockPaints);
    const unique = [...new Set(brands)];
    expect(brands).toEqual(unique);
  });
});

// ─── getDeltaColorClass ──────────────────────────────────────────────────────

describe('getDeltaColorClass', () => {
  it('returns delta-green for delta < 3', () => {
    expect(getDeltaColorClass(0)).toBe('delta-green');
    expect(getDeltaColorClass(1.5)).toBe('delta-green');
    expect(getDeltaColorClass(2.99)).toBe('delta-green');
  });

  it('returns delta-yellow for 3 <= delta < 7', () => {
    expect(getDeltaColorClass(3)).toBe('delta-yellow');
    expect(getDeltaColorClass(5)).toBe('delta-yellow');
    expect(getDeltaColorClass(6.99)).toBe('delta-yellow');
  });

  it('returns delta-red for delta >= 7', () => {
    expect(getDeltaColorClass(7)).toBe('delta-red');
    expect(getDeltaColorClass(10)).toBe('delta-red');
    expect(getDeltaColorClass(20)).toBe('delta-red');
  });
});

// ─── getDeltaLabel ────────────────────────────────────────────────────────────

describe('getDeltaLabel', () => {
  it('returns "Very close" for delta < 3', () => {
    expect(getDeltaLabel(0)).toBe('Very close');
    expect(getDeltaLabel(2.5)).toBe('Very close');
  });

  it('returns "Close" for 3 <= delta < 7', () => {
    expect(getDeltaLabel(3)).toBe('Close');
    expect(getDeltaLabel(6)).toBe('Close');
  });

  it('returns "Distant" for delta >= 7', () => {
    expect(getDeltaLabel(7)).toBe('Distant');
    expect(getDeltaLabel(15)).toBe('Distant');
  });
});

// ─── hexToHSL ────────────────────────────────────────────────────────────────

describe('hexToHSL', () => {
  it('converts white (#ffffff) to [0, 0, 100]', () => {
    const [h, s, l] = hexToHSL('#ffffff');
    expect(h).toBe(0);
    expect(s).toBe(0);
    expect(l).toBeCloseTo(100, 0);
  });

  it('converts black (#000000) to [0, 0, 0]', () => {
    const [h, s, l] = hexToHSL('#000000');
    expect(h).toBe(0);
    expect(s).toBe(0);
    expect(l).toBe(0);
  });

  it('converts pure red (#ff0000) to hue ~0', () => {
    const [h, s, l] = hexToHSL('#ff0000');
    expect(h).toBeCloseTo(0, 0);
    expect(s).toBeCloseTo(100, 0);
    expect(l).toBeCloseTo(50, 0);
  });

  it('converts pure blue (#0000ff) to hue ~240', () => {
    const [h] = hexToHSL('#0000ff');
    expect(h).toBeCloseTo(240, 0);
  });

  it('converts pure green (#00ff00) to hue ~120', () => {
    const [h] = hexToHSL('#00ff00');
    expect(h).toBeCloseTo(120, 0);
  });

  it('handles lowercase hex', () => {
    const [h1, s1, l1] = hexToHSL('#ff0000');
    const [h2, s2, l2] = hexToHSL('#FF0000');
    expect(h1).toBeCloseTo(h2, 5);
    expect(s1).toBeCloseTo(s2, 5);
    expect(l1).toBeCloseTo(l2, 5);
  });
});

// ─── filterPaintsByColor ─────────────────────────────────────────────────────

describe('filterPaintsByColor', () => {
  it('returns all white/achromatic paints when filtering hue 0-10 low saturation', () => {
    // White has 0 saturation, so it won't pass a saturation filter > 0
    const results = filterPaintsByColor(mockPaints, 0, 360, 0, 90);
    // Should include high-lightness paints
    expect(results.some((p) => p.hex === '#ffffff')).toBe(true);
  });

  it('filters out paints outside hue range', () => {
    // Pure blues are ~210-270; whites/reds should be excluded with minSaturation > 0
    const results = filterPaintsByColor(mockPaints, 0, 30, 50, 0);
    // Mephiston Red (#9b0e05) and Dragon Red (#9a1b1e) have hue ~0-5 and saturation > 50
    expect(results.some((p) => p.name.includes('Red'))).toBe(true);
  });

  it('returns empty array when no paints match', () => {
    // Hue range 200-210 with high saturation won't match any mock paints
    const results = filterPaintsByColor(mockPaints, 200, 210, 80, 0);
    expect(results).toHaveLength(0);
  });
});

// ─── getTopMatches ────────────────────────────────────────────────────────────

describe('getTopMatches', () => {
  it('returns matches sorted by delta ascending', () => {
    const matches = getTopMatches(mockPaints[1]); // Mephiston Red
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i].delta).toBeGreaterThanOrEqual(matches[i - 1].delta);
    }
  });

  it('respects the limit', () => {
    const matches = getTopMatches(mockPaints[1], 1);
    expect(matches).toHaveLength(1);
  });

  it('returns all matches when limit >= matches length', () => {
    const paint = mockPaints[0]; // Ceramite White with 2 matches
    const matches = getTopMatches(paint, 10);
    expect(matches).toHaveLength(paint.matches.length);
  });
});
