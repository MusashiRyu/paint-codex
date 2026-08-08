import type { Paint } from '../../domain/types';
import { getShopLinks, type ShopLinkMap } from '../../domain/shopLinkRepository';

/**
 * Only what the export needs. The store holds paint ids, so the caller
 * resolves them against the catalogue before handing them over.
 */
export interface ExportableList {
  name: string;
  paints: Paint[];
}

function buildVliegeruitSearchLink(paint: Paint): string {
  const query = encodeURIComponent(`${paint.brand} ${paint.name}`);
  return `https://www.vliegeruit.com/paint/?s=${query}`;
}

export function buildVliegeruitLink(
  paint: Paint,
  linksMap: ShopLinkMap = getShopLinks()
): string {
  return linksMap[paint.id] ?? buildVliegeruitSearchLink(paint);
}

export function generatePaintListMarkdown(list: ExportableList): string {
  const header = `## Paint List: ${list.name}`;

  if (list.paints.length === 0) {
    return `${header}\n\n_No paints in this list yet._`;
  }

  const lines = list.paints.map(
    (paint) => `- [${paint.brand}] [${paint.name}](${buildVliegeruitLink(paint)})`
  );

  return `${header}\n${lines.join('\n')}`;
}

export function getExportFilename(listName: string): string {
  const safe = listName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${safe || 'paint-list'}.md`;
}