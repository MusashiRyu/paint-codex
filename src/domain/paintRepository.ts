import paintsSnapshot from '../data/paints.snapshot.json';
import type { Paint } from './types';

/**
 * Returns the bundled paint snapshot.
 * Runtime refresh is intentionally deferred.
 */
export function getPaints(): Paint[] {
  return paintsSnapshot as Paint[];
}

let indexCache: Map<string, Paint> | undefined;

/** Catalogue keyed by paint id, built once. */
export function getPaintIndex(): Map<string, Paint> {
  indexCache ??= new Map(getPaints().map((paint) => [paint.id, paint]));
  return indexCache;
}

/**
 * Resolve stored ids to catalogue entries, so a list always reflects the
 * current snapshot. Ids no longer present are dropped rather than rendered as
 * holes — a paint can disappear when the catalogue is rescraped.
 */
export function resolvePaints(paintIds: string[]): Paint[] {
  const index = getPaintIndex();
  const resolved: Paint[] = [];
  for (const id of paintIds) {
    const paint = index.get(id);
    if (paint) resolved.push(paint);
  }
  return resolved;
}