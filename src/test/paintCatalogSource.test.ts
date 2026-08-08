import { describe, expect, it } from 'vitest';
import { parsePaintCatalog } from '../domain/paintCatalogSource';
import { buildCatalogHtml } from './helpers/catalogHtml';

describe('parsePaintCatalog', () => {
  it('reads a Citadel row with its equivalents', () => {
    const paints = parsePaintCatalog(
      buildCatalogHtml([
        {
          name: 'Mephiston Red',
          category: 'Base',
          hex: '#9B0E05',
          vallejo: { name: 'Gory Red', hex: '#8E1010', delta: 1.23 },
          armyPainter: { name: 'Dragon Red', hex: '#A01414', delta: 4.56 },
        },
      ])
    );

    const citadel = paints.find((paint) => paint.id === 'citadel-mephiston-red');
    expect(citadel).toEqual({
      id: 'citadel-mephiston-red',
      brand: 'Citadel',
      name: 'Mephiston Red',
      hex: '#9B0E05',
      category: 'Base',
      matches: [
        { brand: 'Vallejo', name: 'Gory Red', hex: '#8E1010', delta: 1.23 },
        { brand: 'Army Painter', name: 'Dragon Red', hex: '#A01414', delta: 4.56 },
      ],
    });
  });

  it('promotes each equivalent to a paint of its own', () => {
    const paints = parsePaintCatalog(
      buildCatalogHtml([
        {
          name: 'Mephiston Red',
          category: 'Base',
          hex: '#9B0E05',
          vallejo: { name: 'Gory Red', hex: '#8E1010', delta: 1.23 },
          armyPainter: { name: 'Dragon Red', hex: '#A01414', delta: 4.56 },
        },
      ])
    );

    expect(paints.map((paint) => paint.id)).toEqual([
      'citadel-mephiston-red',
      'vallejo-gory-red',
      'army-painter-dragon-red',
    ]);
  });

  it('links the two third-party brands to each other through their Citadel row', () => {
    const paints = parsePaintCatalog(
      buildCatalogHtml([
        {
          name: 'Mephiston Red',
          category: 'Base',
          hex: '#9B0E05',
          vallejo: { name: 'Gory Red', hex: '#8E1010', delta: 1.23 },
          armyPainter: { name: 'Dragon Red', hex: '#A01414', delta: 4.56 },
        },
      ])
    );

    const vallejo = paints.find((paint) => paint.id === 'vallejo-gory-red');
    expect(vallejo?.matches).toEqual([
      { brand: 'Citadel', name: 'Mephiston Red', hex: '#9B0E05', delta: 1.23 },
      { brand: 'Army Painter', name: 'Dragon Red', hex: '#A01414', delta: 4.56 },
    ]);

    const armyPainter = paints.find((paint) => paint.id === 'army-painter-dragon-red');
    expect(armyPainter?.matches).toEqual([
      { brand: 'Citadel', name: 'Mephiston Red', hex: '#9B0E05', delta: 4.56 },
      { brand: 'Vallejo', name: 'Gory Red', hex: '#8E1010', delta: 1.23 },
    ]);
  });

  it('lists a shared equivalent once, pointing at every Citadel paint that named it', () => {
    const paints = parsePaintCatalog(
      buildCatalogHtml([
        {
          name: 'Mephiston Red',
          category: 'Base',
          hex: '#9B0E05',
          vallejo: { name: 'Gory Red', hex: '#8E1010', delta: 1.23 },
        },
        {
          name: 'Khorne Red',
          category: 'Base',
          hex: '#6A0002',
          vallejo: { name: 'Gory Red', hex: '#8E1010', delta: 2.5 },
        },
      ])
    );

    const gory = paints.filter((paint) => paint.id === 'vallejo-gory-red');
    expect(gory).toHaveLength(1);
    expect(gory[0].matches).toEqual([
      { brand: 'Citadel', name: 'Mephiston Red', hex: '#9B0E05', delta: 1.23 },
      { brand: 'Citadel', name: 'Khorne Red', hex: '#6A0002', delta: 2.5 },
    ]);
  });

  it('drops brands the app does not carry', () => {
    const html = buildCatalogHtml([
      { name: 'Mephiston Red', category: 'Base', hex: '#9B0E05' },
    ]).replace(
      '</tr>',
      '<td class="good-match"><strong>Skorne Red</strong><br>P3 Formula - #8E1010<br>1.10</td></tr>'
    );

    // The P3 cell was the row's only equivalent, so the row yields nothing.
    expect(parsePaintCatalog(html)).toEqual([]);
  });

  it('ignores rows that are not Citadel paints and markup that is not a table', () => {
    expect(parsePaintCatalog('<html><body><p>no table here</p></body></html>')).toEqual([]);
    expect(parsePaintCatalog('')).toEqual([]);
  });
});
