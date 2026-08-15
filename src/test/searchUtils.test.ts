import { describe, it, expect } from 'vitest';
import type { Paint } from '../domain/types';
import { searchPaints } from '../features/search/search';
import { getUniqueBrands, getTopMatches } from '../domain/paintQueries';
import { getDeltaLabel, getDeltaQuality, getDeltaStyle } from '../shared/lib/color';

const mockPaints: Paint[] = [
  {
    id: 'citadel-base-ceramite-white',
    brand: 'Citadel',
    name: 'Ceramite White',
    hex: '#ffffff',
    category: 'Base',
    matches: [
      { id: 'vallejo-game-color-dead-white', delta: 0.0 },
      { id: 'army-painter-warpaints-dragon-red', delta: 45.2 },
    ],
  },
  {
    id: 'citadel-base-mephiston-red',
    brand: 'Citadel',
    name: 'Mephiston Red',
    hex: '#9b0e05',
    category: 'Base',
    // Deliberately not in delta order: getTopMatches is what sorts them.
    matches: [
      { id: 'vallejo-game-color-dead-white', delta: 6.78 },
      { id: 'army-painter-warpaints-dragon-red', delta: 4.47 },
    ],
  },
  {
    id: 'vallejo-game-color-dead-white',
    brand: 'Vallejo',
    name: 'Dead White',
    hex: '#ffffff',
    category: 'Game Color',
    matches: [
      { id: 'citadel-base-ceramite-white', delta: 0.0 },
      { id: 'army-painter-warpaints-dragon-red', delta: 45.2 },
    ],
  },
  {
    id: 'army-painter-warpaints-dragon-red',
    brand: 'Army Painter',
    name: 'Dragon Red',
    hex: '#9a1b1e',
    category: 'Warpaints',
    matches: [
      { id: 'citadel-base-mephiston-red', delta: 4.47 },
      { id: 'vallejo-game-color-dead-white', delta: 45.2 },
    ],
  },
];

const mockIndex = new Map(mockPaints.map((paint) => [paint.id, paint]));

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
    const matches = getTopMatches(mockPaints[1], mockIndex); // Mephiston Red
    expect(matches.map((match) => match.paint.name)).toEqual(['Dragon Red', 'Dead White']);
  });

  it('respects the limit', () => {
    expect(getTopMatches(mockPaints[1], mockIndex, 1)).toHaveLength(1);
  });

  it('returns all matches when limit >= matches length', () => {
    const paint = mockPaints[0]; // Ceramite White with 2 matches
    expect(getTopMatches(paint, mockIndex, 10)).toHaveLength(paint.matches.length);
  });

  it('filters out matches at or beyond the maximum delta', () => {
    const matches = getTopMatches(mockPaints[0], mockIndex, 10, 7);
    expect(matches.map((match) => match.paint.name)).toEqual(['Dead White']);
  });

  it('drops a match whose paint has left the catalog', () => {
    const retired = new Map(mockIndex);
    retired.delete('army-painter-warpaints-dragon-red');
    const matches = getTopMatches(mockPaints[1], retired, 10);
    expect(matches.map((match) => match.paint.name)).toEqual(['Dead White']);
  });
});
