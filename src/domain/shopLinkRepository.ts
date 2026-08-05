import shopLinksSnapshot from '../data/shopLinks.snapshot.json';

export type ShopLinkMap = Record<string, string>;

/**
 * Returns bundled shop links keyed by paint id.
 */
export function getShopLinks(): ShopLinkMap {
  return shopLinksSnapshot as ShopLinkMap;
}