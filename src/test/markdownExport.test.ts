import { describe, expect, it } from 'vitest';
import {
  buildVliegeruitLink,
  generatePaintListMarkdown,
  getExportFilename,
  type ExportableList,
} from '../features/export/markdownExport';
import type { ShopLinkMap } from '../domain/shopLinkRepository';

const sampleList: ExportableList = {
  name: 'Starter Reds',
  paints: [
    {
      id: 'citadel-mephiston-red',
      brand: 'Citadel',
      name: 'Mephiston Red',
      hex: '#9b0e05',
      category: 'Base Layer',
      matches: [
        {
          brand: 'Vallejo',
          name: 'Gory Red',
          hex: '#810504',
          delta: 3.65,
        },
        {
          brand: 'Citadel',
          name: 'Incubi Darkness',
          hex: '#094345',
          delta: 11.76,
        },
      ],
    },
    {
      id: 'vallejo-gory-red',
      brand: 'Vallejo',
      name: 'Gory Red',
      hex: '#810504',
      category: 'Game',
      matches: [],
    },
  ],
};

describe('markdownExport', () => {
  it('uses mapped product links when available', () => {
    const linksMap: ShopLinkMap = {
      'citadel-mephiston-red': 'https://www.vliegeruit.com/product/citadel-base-mephiston-red/',
    };

    const link = buildVliegeruitLink(sampleList.paints[0], linksMap);
    expect(link).toBe('https://www.vliegeruit.com/product/citadel-base-mephiston-red/');
  });

  it('falls back to vliegeruit search links with encoded query', () => {
    const link = buildVliegeruitLink(sampleList.paints[1], {});
    expect(link).toContain('https://www.vliegeruit.com/paint/?s=');
    expect(link).toContain('Vallejo%20Gory%20Red');
  });

  it('generates markdown with header and list lines', () => {
    const markdown = generatePaintListMarkdown(sampleList);

    expect(markdown).toContain('## Paint List: Starter Reds');
    expect(markdown).toContain('- [Citadel] [Mephiston Red](');
    expect(markdown).toContain('- [Vallejo] [Gory Red](');
  });

  it('does not include equivalent paint lines in markdown export', () => {
    const markdown = generatePaintListMarkdown(sampleList);

    expect(markdown).not.toContain('Equivalent:');
  });

  it('handles empty lists with a placeholder message', () => {
    const emptyMarkdown = generatePaintListMarkdown({
      ...sampleList,
      paints: [],
    });

    expect(emptyMarkdown).toContain('_No paints in this list yet._');
  });

  it('creates safe markdown filenames', () => {
    expect(getExportFilename('Starter Reds! 01')).toBe('starter-reds-01.md');
    expect(getExportFilename('')).toBe('paint-list.md');
  });
});