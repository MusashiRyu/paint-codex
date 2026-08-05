import Fuse, { type IFuseOptions } from 'fuse.js';
import type { Paint } from '../../domain/types';

/**
 * Initialize Fuse.js search instance for fuzzy matching
 */
export function initializeSearchIndex(paints: Paint[]): Fuse<Paint> {
  const options: IFuseOptions<Paint> = {
    keys: ['name', 'brand', 'category'],
    threshold: 0.3,
    minMatchCharLength: 2,
    ignoreLocation: true,
  };

  return new Fuse(paints, options);
}

/**
 * Search paints by query and optional brand filter
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

  const fuse = initializeSearchIndex(paints);
  let results = fuse.search(query).map((result) => result.item);

  if (brandFilter) {
    results = results.filter((p) => p.brand === brandFilter);
  }

  return results;
}

/**
 * Get autocomplete suggestions based on query
 */
export function getAutocompleteSuggestions(
  paints: Paint[],
  query: string,
  limit = 10
): Paint[] {
  if (!query.trim()) {
    return [];
  }

  const fuse = initializeSearchIndex(paints);
  return fuse.search(query).slice(0, limit).map((result) => result.item);
}