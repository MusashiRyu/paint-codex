import { describe, expect, it } from 'vitest';
import bundledPaints from '../data/paints.snapshot.json';
import paintIdMigration from '../data/paintIdMigration.json';
import { MAX_MATCHES } from '../domain/paintCatalogSource';
import type { Paint } from '../domain/types';

/**
 * Assertions about the shipped snapshot itself, not about the parser that
 * produced it. `npm run scrape` writes this file by hand-run rather than in
 * CI, so a scrape done from a half-broken upstream, or an edit made straight
 * to the JSON, would otherwise reach a release unchallenged.
 */

const paints = bundledPaints as Paint[];
const ids = new Set(paints.map((paint) => paint.id));

describe('bundled snapshot', () => {
  it('carries every brand the app claims to cover', () => {
    const brands = new Set(paints.map((paint) => paint.brand));
    expect([...brands].sort()).toEqual(['Army Painter', 'Citadel', 'Vallejo']);
  });

  it('gives every paint a unique id', () => {
    expect(ids.size).toBe(paints.length);
  });

  it('gives every paint a renderable colour and a range', () => {
    for (const paint of paints) {
      expect(paint.hex).toMatch(/^#[0-9A-F]{6}$/);
      expect(paint.category).toBeTruthy();
      expect(paint.name).toBeTruthy();
    }
  });

  it('resolves every match to a paint in the same file', () => {
    for (const paint of paints) {
      expect(paint.matches.length).toBeLessThanOrEqual(MAX_MATCHES);
      for (const match of paint.matches) {
        expect(ids.has(match.id)).toBe(true);
        expect(Number.isFinite(match.delta)).toBe(true);
      }
    }
  });

  it('lists no paint twice under the same brand, name and colour', () => {
    const seen = new Map<string, string>();
    for (const paint of paints) {
      const key = `${paint.brand}|${paint.name.toLowerCase()}|${paint.hex}`;
      expect(seen.has(key)).toBe(false);
      seen.set(key, paint.id);
    }
  });

  it('never shows one paint two equivalents that read identically', () => {
    // Six tiles resolving to two colours is what the range merge fixed; this
    // is the assertion that keeps it fixed.
    const byId = new Map(paints.map((paint) => [paint.id, paint]));
    for (const paint of paints) {
      const shown = paint.matches.map((match) => byId.get(match.id)!);
      const distinct = new Set(shown.map((m) => `${m.brand}|${m.name.toLowerCase()}|${m.hex}`));
      expect(distinct.size).toBe(shown.length);
    }
  });

  it('never offers a paint as an alternative to its own brand', () => {
    const brandOf = new Map(paints.map((paint) => [paint.id, paint.brand]));
    for (const paint of paints) {
      for (const match of paint.matches) {
        expect(brandOf.get(match.id)).not.toBe(paint.brand);
      }
    }
  });

  it('points every id the store migration renames at a paint that exists', () => {
    // The map is what carries saved lists across the id change. An entry
    // pointing at nothing would empty a list as surely as no entry at all,
    // and far less visibly.
    for (const target of Object.values(paintIdMigration as Record<string, string>)) {
      expect(ids.has(target)).toBe(true);
    }
  });
});
