import { beforeEach, describe, expect, it } from 'vitest';
import type { Paint } from '../domain/types';
import { useAppStore } from '../app/providers/store';

const samplePaint: Paint = {
  id: 'citadel-mephiston-red',
  brand: 'Citadel',
  name: 'Mephiston Red',
  hex: '#9b0e05',
  category: 'Base Layer',
  matches: [],
};

beforeEach(() => {
  localStorage.removeItem('paco-app-store');
  useAppStore.setState({ lists: [], selectedListId: undefined });
});

describe('list store', () => {
  it('creates and auto-selects a list', () => {
    const id = useAppStore.getState().createList('My List');
    const state = useAppStore.getState();
    expect(id).not.toBe('');
    expect(state.lists).toHaveLength(1);
    expect(state.selectedListId).toBe(id);
  });

  it('renames a list', () => {
    const id = useAppStore.getState().createList('Old Name');
    useAppStore.getState().renameList(id, 'New Name');
    expect(useAppStore.getState().lists[0].name).toBe('New Name');
  });

  it('adds a paint once and blocks duplicates', () => {
    const id = useAppStore.getState().createList('Favorites');
    const first = useAppStore.getState().addPaintToList(id, samplePaint);
    const second = useAppStore.getState().addPaintToList(id, samplePaint);

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(useAppStore.getState().lists[0].paints).toHaveLength(1);
  });

  it('removes a paint from a list', () => {
    const id = useAppStore.getState().createList('Favorites');
    useAppStore.getState().addPaintToList(id, samplePaint);
    useAppStore.getState().removePaintFromList(id, samplePaint.id);
    expect(useAppStore.getState().lists[0].paints).toHaveLength(0);
  });

  it('deletes a selected list and selects the next one', () => {
    const first = useAppStore.getState().createList('One');
    const second = useAppStore.getState().createList('Two');
    useAppStore.getState().selectList(first);

    useAppStore.getState().deleteList(first);
    const state = useAppStore.getState();
    expect(state.lists.map((l) => l.name)).toEqual(['Two']);
    expect(state.selectedListId).toBe(second);
  });
});