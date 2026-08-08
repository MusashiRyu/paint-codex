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
    const first = useAppStore.getState().addPaintToList(id, samplePaint.id);
    const second = useAppStore.getState().addPaintToList(id, samplePaint.id);

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(useAppStore.getState().lists[0].paintIds).toEqual([samplePaint.id]);
  });

  it('removes a paint from a list', () => {
    const id = useAppStore.getState().createList('Favorites');
    useAppStore.getState().addPaintToList(id, samplePaint.id);
    useAppStore.getState().removePaintFromList(id, samplePaint.id);
    expect(useAppStore.getState().lists[0].paintIds).toHaveLength(0);
  });

  it('stores only ids, so a refreshed catalogue reaches saved lists', () => {
    const id = useAppStore.getState().createList('Favorites');
    useAppStore.getState().addPaintToList(id, samplePaint.id);

    const stored = JSON.stringify(useAppStore.getState().lists);
    expect(stored).not.toContain(samplePaint.hex);
    expect(stored).toContain(samplePaint.id);
  });

  it('migrates v1 lists with embedded paints down to ids', async () => {
    localStorage.setItem(
      'paco-app-store',
      JSON.stringify({
        version: 1,
        state: {
          selectedListId: 'l1',
          lists: [
            {
              id: 'l1',
              name: 'Old List',
              icon: 'skull',
              color: '#7a2430',
              paints: [samplePaint, { ...samplePaint, id: 'vallejo-gory-red' }],
            },
          ],
        },
      })
    );

    await useAppStore.persist.rehydrate();

    const [list] = useAppStore.getState().lists;
    // v3 runs straight after, so the ids arrive range-qualified.
    expect(list.paintIds).toEqual([
      'citadel-base-mephiston-red',
      'vallejo-game-color-gory-red',
    ]);
    expect(list).not.toHaveProperty('paints');
    // Fields from the earlier migration survive.
    expect(list.icon).toBe('skull');
    expect(list.color).toBe('#7a2430');
  });

  it('migrates a v0 list through every step at once', async () => {
    localStorage.setItem(
      'paco-app-store',
      JSON.stringify({
        version: 0,
        state: {
          selectedListId: 'l1',
          lists: [{ id: 'l1', name: 'Ancient', paints: [samplePaint] }],
        },
      })
    );

    await useAppStore.persist.rehydrate();

    const [list] = useAppStore.getState().lists;
    expect(list.paintIds).toEqual(['citadel-base-mephiston-red']);
    expect(list.icon).toBe('star');
    expect(list.color).toBe('#c9a86a');
  });

  it('carries v2 paint ids onto the ranges the new catalogue splits them into', async () => {
    localStorage.setItem(
      'paco-app-store',
      JSON.stringify({
        version: 2,
        state: {
          selectedListId: 'l1',
          lists: [
            {
              id: 'l1',
              name: 'Blood Angels',
              icon: 'skull',
              color: '#7a2430',
              // The second is a paint the new source does not carry at all.
              paintIds: ['citadel-abaddon-black', 'citadel-bugmans-glow'],
            },
          ],
        },
      })
    );

    await useAppStore.persist.rehydrate();

    const [list] = useAppStore.getState().lists;
    // Renamed where there is a mapping; left alone where there is not, so it
    // drops out at resolve time the way any retired paint does rather than
    // being silently pointed at a different product.
    expect(list.paintIds).toEqual(['citadel-base-abaddon-black', 'citadel-bugmans-glow']);
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