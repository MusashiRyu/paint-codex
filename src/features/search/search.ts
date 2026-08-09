import Fuse, { type IFuseOptions } from 'fuse.js';
import type { Paint } from '../../domain/types';

const FUSE_OPTIONS: IFuseOptions<Paint> = {
  keys: ['name', 'brand', 'category'],
  threshold: 0.3,
  minMatchCharLength: 2,
  ignoreLocation: true,
};

/**
 * Fuzzy search over the catalogue, optionally narrowed to one brand.
 *
 * The index is rebuilt per call rather than memoised: the catalogue can be
 * replaced underneath by the background refresh, and a stale index would keep
 * answering with paints that are no longer in it. Building over 2,279 entries
 * is cheap enough that caching it would buy less than the invalidation costs.
 */
export function searchPaints(
  paints: Paint[],
  query: string,
  brandFilter?: string
): Paint[] {
  if (!query.trim()) {
    return brandFilter
      ? paints.filter((p) => p.brand === brandFilter)
      : paints;
  }

  const fuse = new Fuse(paints, FUSE_OPTIONS);
  let results = fuse.search(query).map((result) => result.item);

  if (brandFilter) {
    results = results.filter((p) => p.brand === brandFilter);
  }

  return results;
}
