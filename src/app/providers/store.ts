import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Paint } from '../../domain/types';

export type ListIcon =
  | 'skull'
  | 'star'
  | 'shield'
  | 'wing'
  | 'crown'
  | 'flame'
  | 'moon'
  | 'drop';

/**
 * A list stores paint *ids*, not paint objects. Embedding copies meant a
 * corrected hex or a new equivalent in the catalogue snapshot never reached
 * paints already saved in a list. Resolve against the catalogue at read time
 * with `resolvePaints` from the domain layer.
 */
export type PaintList = {
  id: string;
  name: string;
  icon: ListIcon;
  color: string;
  paintIds: string[];
};

/** Shape persisted before version 2, kept for the migration. */
type LegacyPaintList = Omit<PaintList, 'paintIds'> & { paints?: Paint[] };

type AppStore = {
  lists: PaintList[];
  selectedListId?: string;
  createList: (name: string, icon?: ListIcon, color?: string) => string;
  renameList: (listId: string, name: string) => void;
  deleteList: (listId: string) => void;
  selectList: (listId: string | undefined) => void;
  addPaintToList: (listId: string, paintId: string) => boolean;
  removePaintFromList: (listId: string, paintId: string) => void;
};

function createListId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `list-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      lists: [],
      selectedListId: undefined,
      createList: (name, icon = 'star', color = '#c9a86a') => {
        const trimmed = name.trim();
        if (!trimmed) {
          return '';
        }

        const newId = createListId();
        set((state) => ({
          lists: [...state.lists, { id: newId, name: trimmed, icon, color, paintIds: [] }],
          selectedListId: newId,
        }));
        return newId;
      },
      renameList: (listId, name) => {
        const trimmed = name.trim();
        if (!trimmed) {
          return;
        }
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId ? { ...list, name: trimmed } : list
          ),
        }));
      },
      deleteList: (listId) => {
        set((state) => {
          const nextLists = state.lists.filter((list) => list.id !== listId);
          const nextSelected =
            state.selectedListId === listId
              ? nextLists[0]?.id
              : state.selectedListId;
          return {
            lists: nextLists,
            selectedListId: nextSelected,
          };
        });
      },
      selectList: (listId) => {
        set({ selectedListId: listId });
      },
      addPaintToList: (listId, paintId) => {
        const targetList = get().lists.find((list) => list.id === listId);
        if (!targetList || targetList.paintIds.includes(paintId)) {
          return false;
        }

        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId ? { ...list, paintIds: [...list.paintIds, paintId] } : list
          ),
        }));
        return true;
      },
      removePaintFromList: (listId, paintId) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? { ...list, paintIds: list.paintIds.filter((id) => id !== paintId) }
              : list
          ),
        }));
      },
    }),
    {
      name: 'paco-app-store',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as {
          lists: LegacyPaintList[];
          selectedListId?: string;
        };
        let lists = state.lists ?? [];

        // v0 -> v1: lists gained an icon and a banner colour.
        if (version < 1) {
          lists = lists.map((l) => ({
            ...l,
            icon: (l.icon ?? 'star') as ListIcon,
            color: l.color ?? '#c9a86a',
          }));
        }

        // v1 -> v2: embedded paint copies become ids resolved from the catalogue.
        if (version < 2) {
          lists = lists.map(({ paints, ...rest }) => ({
            ...rest,
            paintIds: (paints ?? []).map((paint) => paint.id),
          }));
        }

        return { ...state, lists };
      },
    }
  )
);