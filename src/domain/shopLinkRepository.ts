import shopLinksSnapshot from '../data/shopLinks.snapshot.json';

export type ShopLinkMap = Record<string, string>;

/**
 * Bundled shop links, keyed by paint id.
 *
 * Read only by `features/export/markdownExport.ts`, which is behind
 * `appConfig.featureFlags.markdownExport`. Unlike the paint catalog there is
 * no refresh and no cache layer: these are a build-time crawl, and coverage is
 * partial — see OPEN-ITEMS 3.
 */
export function getShopLinks(): ShopLinkMap {
  return shopLinksSnapshot as ShopLinkMap;
}
