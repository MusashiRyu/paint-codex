/**
 * Builds markup in the shape of redgrimm's conversion table, so parser and
 * refresh tests can work from realistic input without carrying a 190 KB
 * fixture around.
 */

export type CatalogRow = {
  name: string;
  category: string;
  hex: string;
  vallejo?: { name: string; hex: string; delta: number };
  armyPainter?: { name: string; hex: string; delta: number };
};

function matchCell(cssClass: string, name: string, brandLine: string, delta: number): string {
  return `<td class="${cssClass}"><strong>${name}</strong><br>${brandLine}<br>${delta.toFixed(2)}</td>`;
}

export function buildCatalogHtml(rows: CatalogRow[]): string {
  const body = rows
    .map((row) => {
      const cells = [
        `<td class="filled"><strong class='owned'>${row.name}</strong><br>Citadel - ${row.category} - ${row.hex}</td>`,
        '<td class="color-col"></td>',
      ];
      if (row.vallejo) {
        cells.push(
          matchCell(
            'good-match',
            row.vallejo.name,
            `Vallejo - Game - ${row.vallejo.hex}`,
            row.vallejo.delta
          )
        );
      }
      if (row.armyPainter) {
        cells.push(
          matchCell(
            'poor-match',
            row.armyPainter.name,
            `Army Painter - ${row.armyPainter.hex}`,
            row.armyPainter.delta
          )
        );
      }
      return `<tr>${cells.join('')}</tr>`;
    })
    .join('\n');

  return `<html><body><table>\n${body}\n</table></body></html>`;
}

/** `count` distinct rows, each yielding one paint per brand. */
export function buildCatalogRows(count: number, seed = 'p'): CatalogRow[] {
  const rows: CatalogRow[] = [];
  for (let i = 0; i < count; i++) {
    const hex = `#${(0x111111 * (i + 1)).toString(16).padStart(6, '0').slice(-6).toUpperCase()}`;
    rows.push({
      name: `${seed} Citadel ${i}`,
      category: 'Base',
      hex,
      vallejo: { name: `${seed} Vallejo ${i}`, hex, delta: 1 },
      armyPainter: { name: `${seed} Army ${i}`, hex, delta: 2 },
    });
  }
  return rows;
}

/** A catalogue of `count` paints per brand, for size-threshold tests. */
export function buildCatalogHtmlOfSize(count: number, seed = 'p'): string {
  return buildCatalogHtml(buildCatalogRows(count, seed));
}
