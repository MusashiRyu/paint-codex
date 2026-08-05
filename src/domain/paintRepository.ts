import paintsSnapshot from '../data/paints.snapshot.json';
import type { Paint } from './types';

/**
 * Returns the bundled paint snapshot.
 * Runtime refresh is intentionally deferred.
 */
export function getPaints(): Paint[] {
  return paintsSnapshot as Paint[];
}