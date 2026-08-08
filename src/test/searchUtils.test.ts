import { describe, it, expect } from 'vitest';
import type { Paint } from '../domain/types';
import {
  searchPaints,
  getAutocompleteSuggestions,
} from '../features/search/search';
import { getUniqueBrands, getTopMatches } from '../domain/paintQueries';
import { getDeltaLabel, getDeltaQuality, getDeltaStyle } from '../shared/lib/color';

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

// ─── getDeltaQuality / getDeltaStyle ─────────────────────────────────────────

describe('getDeltaQuality', () => {
  it('classifies against the shared thresholds', () => {
    expect(getDeltaQuality(0)).toBe('very-close');
    expect(getDeltaQuality(2.99)).toBe('very-close');
    expect(getDeltaQuality(3)).toBe('close');
    expect(getDeltaQuality(6.99)).toBe('close');
    expect(getDeltaQuality(7)).toBe('distant');
  });
});

describe('getDeltaStyle', () => {
  it('maps each quality onto its own token group', () => {
    expect(getDeltaStyle(1)).toEqual({
      background: 'var(--ok-bg)',
      border: 'var(--ok-border)',
      color: 'var(--ok-text)',
    });
    expect(getDeltaStyle(5)).toEqual({
      background: 'var(--warn-bg)',
      border: 'var(--warn-border)',
      color: 'var(--warn-text)',
    });
    expect(getDeltaStyle(9)).toEqual({
      background: 'var(--bad-bg)',
      border: 'var(--bad-border)',
      color: 'var(--bad-text)',
    });
  });

  it('agrees with getDeltaQuality on every boundary', () => {
    const pairs: Array<[number, string]> = [
      [2.99, 'ok'],
      [3, 'warn'],
      [6.99, 'warn'],
      [7, 'bad'],
    ];
    for (const [delta, token] of pairs) {
      expect(getDeltaStyle(delta).background).toBe(`var(--${token}-bg)`);
    }
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
