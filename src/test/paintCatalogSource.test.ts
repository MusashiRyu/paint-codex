import { describe, expect, it } from 'vitest';
import { MAX_MATCHES, parsePaintCatalog } from '../domain/paintCatalogSource';
import { buildBrandDocument, buildCatalogDocumentsOfSize } from './helpers/catalogMarkdown';

const citadel = (rows: Parameters<typeof buildBrandDocument>[1]) =>
  buildBrandDocument('Citadel', rows, { withCode: false });

describe('parsePaintCatalog', () => {
  it('reads a Citadel row, whose table has no Code column', () => {
    const [paint] = parsePaintCatalog([
      citadel([{ name: 'Mephiston Red', set: 'Base', hex: '#9B0E05' }]),
    ]);

    expect(paint).toEqual({
      id: 'citadel-base-mephiston-red',
      brand: 'Citadel',
      name: 'Mephiston Red',
      hex: '#9B0E05',
      category: 'Base',
      matches: [],
    });
  });

  it('reads the Code column every other brand carries', () => {
    const [paint] = parsePaintCatalog([
      buildBrandDocument('Vallejo', [
        { name: 'Bloody Red', code: '72.010', set: 'Game Color', hex: '#D41C1C' },
      ]),
    ]);

    expect(paint).toMatchObject({
      id: 'vallejo-game-color-bloody-red',
      brand: 'Vallejo',
      name: 'Bloody Red',
      category: 'Game Color',
      code: '72.010',
    });
  });

  it('locates columns by heading rather than position', () => {
    // Same data, Code and Set the other way round.
    const document = buildBrandDocument('Vallejo', [
      { name: 'Bloody Red', code: '72.010', set: 'Game Color', hex: '#D41C1C' },
    ]);
    document.markdown = document.markdown
      .replace('|Name|Code|Set|', '|Name|Set|Code|')
      .replace('|Bloody Red|72.010|Game Color|', '|Bloody Red|Game Color|72.010|');

    expect(parsePaintCatalog([document])[0]).toMatchObject({
      id: 'vallejo-game-color-bloody-red',
      category: 'Game Color',
      code: '72.010',
    });
  });

  it('keeps one paint per range, so a name in two ranges is two paints', () => {
    const paints = parsePaintCatalog([
      citadel([
        { name: 'Abaddon Black', set: 'Air', hex: '#000000' },
        { name: 'Abaddon Black', set: 'Base', hex: '#010101' },
      ]),
    ]);

    expect(paints.map((paint) => paint.id)).toEqual([
      'citadel-air-abaddon-black',
      'citadel-base-abaddon-black',
    ]);
  });

  it('collapses rows identical in range, name and colour', () => {
    const paints = parsePaintCatalog([
      buildBrandDocument('Vallejo', [
        { name: 'Black', code: '72.051', set: 'Game Color', hex: '#000000' },
        { name: 'Black', code: '72.094', set: 'Game Color', hex: '#000000' },
      ]),
    ]);

    expect(paints).toHaveLength(1);
    expect(paints[0].id).toBe('vallejo-game-color-black');
  });

  it('suffixes a genuine clash by code, not by row order', () => {
    const ordered = parsePaintCatalog([
      buildBrandDocument('Vallejo', [
        { name: 'Alien Purple', code: '72.776', set: 'Game Air', hex: '#6D62A6' },
        { name: 'Alien Purple', code: '76.076', set: 'Game Air', hex: '#7161A8' },
      ]),
    ]);
    const reversed = parsePaintCatalog([
      buildBrandDocument('Vallejo', [
        { name: 'Alien Purple', code: '76.076', set: 'Game Air', hex: '#7161A8' },
        { name: 'Alien Purple', code: '72.776', set: 'Game Air', hex: '#6D62A6' },
      ]),
    ]);

    const identify = (paints: typeof ordered) => paints.map((p) => `${p.id} ${p.code}`).sort();
    expect(identify(ordered)).toEqual([
      'vallejo-game-air-alien-purple 72.776',
      'vallejo-game-air-alien-purple-2 76.076',
    ]);
    // The whole point of ordering by content: reversing the file must not move
    // which paint owns the unsuffixed id.
    expect(identify(reversed)).toEqual(identify(ordered));
  });

  it('matches across brands, closest first, and never to its own brand', () => {
    const paints = parsePaintCatalog([
      citadel([{ name: 'Mephiston Red', set: 'Base', hex: '#9B0E05' }, { name: 'Khorne Red', set: 'Base', hex: '#9B0E06' }]),
      buildBrandDocument('Vallejo', [
        { name: 'Gory Red', set: 'Game Color', hex: '#9B0E07' },
        { name: 'Distant Blue', set: 'Game Color', hex: '#0000FF' },
      ]),
    ]);

    const mephiston = paints.find((p) => p.id === 'citadel-base-mephiston-red');
    expect(mephiston?.matches.map((m) => m.id)).toEqual([
      'vallejo-game-color-gory-red',
      'vallejo-game-color-distant-blue',
    ]);
    // Khorne Red is one unit away but is a Citadel paint, so it is not offered
    // as an alternative to another Citadel paint.
    expect(mephiston?.matches.every((m) => !m.id.startsWith('citadel-'))).toBe(true);
    expect(mephiston?.matches[0].delta).toBeLessThan(mephiston?.matches[1].delta ?? 0);
  });

  it('gives an identical colour a delta of zero', () => {
    const paints = parsePaintCatalog([
      citadel([{ name: 'Abaddon Black', set: 'Base', hex: '#000000' }]),
      buildBrandDocument('Army Painter', [
        { name: 'Matt Black', set: 'Warpaints', hex: '#000000' },
      ]),
    ]);

    expect(paints[0].matches).toEqual([{ id: 'army-painter-warpaints-matt-black', delta: 0 }]);
  });

  it(`stores at most ${MAX_MATCHES} equivalents`, () => {
    const documents = buildCatalogDocumentsOfSize(20);
    const paints = parsePaintCatalog(documents);

    expect(paints).toHaveLength(60);
    for (const paint of paints) {
      expect(paint.matches.length).toBe(MAX_MATCHES);
    }
  });

  it('resolves every stored match id to a paint in the same catalogue', () => {
    const paints = parsePaintCatalog(buildCatalogDocumentsOfSize(12));
    const ids = new Set(paints.map((paint) => paint.id));

    for (const paint of paints) {
      for (const match of paint.matches) expect(ids.has(match.id)).toBe(true);
    }
  });

  it('expands a three-digit hex to the six-digit form', () => {
    const [paint] = parsePaintCatalog([citadel([{ name: 'Short', set: 'Base', hex: '#FA0' }])]);
    expect(paint.hex).toBe('#FFAA00');
  });

  it.each(['#FFFF', '#FFFFF', '#FFFFFFF'])('rejects the unrenderable hex %s', (hex) => {
    const paints = parsePaintCatalog([
      citadel([
        { name: 'Bad', set: 'Base', hex },
        { name: 'Good', set: 'Base', hex: '#112233' },
      ]),
    ]);

    expect(paints.map((paint) => paint.name)).toEqual(['Good']);
  });

  it('skips a row whose range upstream left null', () => {
    const paints = parsePaintCatalog([
      buildBrandDocument('Army Painter', [
        { name: 'Nameless', code: 'WP1401', set: 'null', hex: '#A32F26' },
        { name: 'Abomination Gore', code: 'WP1402', set: 'Warpaints', hex: '#A32F26' },
      ]),
    ]);

    expect(paints.map((paint) => paint.name)).toEqual(['Abomination Gore']);
  });

  it('lets one brand fail without taking the others with it', () => {
    const paints = parsePaintCatalog([
      { brand: 'Citadel', markdown: '# Citadel\n\nUpstream moved this file.' },
      buildBrandDocument('Vallejo', [
        { name: 'Bloody Red', code: '72.010', set: 'Game Color', hex: '#D41C1C' },
      ]),
    ]);

    expect(paints.map((paint) => paint.brand)).toEqual(['Vallejo']);
  });

  it('reads nothing out of documents that are not tables', () => {
    expect(parsePaintCatalog([{ brand: 'Citadel', markdown: '# Citadel\n\nno table' }])).toEqual([]);
    expect(parsePaintCatalog([{ brand: 'Citadel', markdown: '' }])).toEqual([]);
    expect(parsePaintCatalog([])).toEqual([]);
  });
});
