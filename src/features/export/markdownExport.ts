import type { Paint } from '../../domain/types';
import type { PaintList } from '../../app/providers/store';

export function buildVliegeruitLink(paint: Paint): string {
  const query = encodeURIComponent(`${paint.brand} ${paint.name}`);
  return `https://www.vliegeruit.com/paint/?s=${query}`;
}

export function generatePaintListMarkdown(list: PaintList): string {
  const header = `## Paint List: ${list.name}`;

  if (list.paints.length === 0) {
    return `${header}\n\n_No paints in this list yet._`;
  }

  const lines = list.paints.map(
    (paint) => `- [${paint.brand}] ${paint.name} — [link](${buildVliegeruitLink(paint)})`
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