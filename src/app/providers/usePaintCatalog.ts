import { useSyncExternalStore } from 'react';
import { getPaints, subscribeToPaints } from '../../domain/paintRepository';
import type { Paint } from '../../domain/types';

/**
 * Subscribe a component to the paint catalog.
 *
 * The catalog is module state rather than React state because the domain
 * layer owns it and non-React code (the background refresh) replaces it. The
 * one binding lives here so `domain/` stays free of React.
 */
export function usePaintCatalog(): Paint[] {
  return useSyncExternalStore(subscribeToPaints, getPaints, getPaints);
}
