/**
 * Builds documents in the shape of the Arcturus5404 brand tables, so parser
 * and refresh tests can work from realistic input without carrying a 270 KB
 * fixture around.
 */

import type { CatalogDocument } from '../../domain/paintCatalogSource';

export type CatalogRow = {
  name: string;
  set: string;
  code?: string;
  hex: string;
};

/**
 * One brand's markdown table. `withCode` is explicit rather than inferred from
 * the rows because the two column layouts are the thing worth testing:
 * Citadel's table has no Code column and every other brand's does.
 */
export function buildBrandDocument(
  brand: string,
  rows: CatalogRow[],
  { withCode = true }: { withCode?: boolean } = {}
): CatalogDocument {
  const heading = withCode ? ['Name', 'Code', 'Set', 'R', 'G', 'B', 'Hex'] : ['Name', 'Set', 'R', 'G', 'B', 'Hex'];

  const body = rows.map((row) => {
    const digits = row.hex.replace('#', '');
    // Upstream's Hex cell is a preview image followed by the code span. The
    // image repeats the digits twice, which is exactly what the parser must
    // not read them from.
    const hexCell = `![${row.hex}](https://placehold.co/15x15/${digits}/${digits}.png) \`${row.hex}\``;
    const rgb =
      digits.length === 6
        ? [0, 2, 4].map((at) => String(parseInt(digits.slice(at, at + 2), 16)))
        : ['0', '0', '0'];

    const cells = withCode
      ? [row.name, row.code ?? 'null', row.set, ...rgb, hexCell]
      : [row.name, row.set, ...rgb, hexCell];
    return `|${cells.join('|')}|`;
  });

  return {
    brand,
    markdown: [
      `# ${brand}`,
      `![${brand}](../logos/${brand}.png "${brand}")`,
      '',
      `|${heading.join('|')}|`,
      `|${heading.map(() => '---').join('|')}|`,
      ...body,
    ].join('\n'),
  };
}

/** `count` distinct paints per brand, for size-threshold tests. */
export function buildCatalogDocumentsOfSize(count: number, seed = 'p'): CatalogDocument[] {
  return ['Citadel', 'Vallejo', 'Army Painter'].map((brand, brandIndex) => {
    const rows: CatalogRow[] = [];
    for (let i = 0; i < count; i++) {
      const value = (0x111111 * (i + 1) + brandIndex) % 0xffffff;
      rows.push({
        name: `${seed} ${brand} ${i}`,
        set: 'Base',
        hex: `#${value.toString(16).padStart(6, '0').toUpperCase()}`,
      });
    }
    return buildBrandDocument(brand, rows, { withCode: brand !== 'Citadel' });
  });
}
