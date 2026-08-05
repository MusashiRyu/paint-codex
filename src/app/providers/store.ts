import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Paint } from '../../domain/types';

export type PaintList = {
  id: string;
  name: string;
  paints: Paint[];
};

type AppStore = {
  lists: PaintList[];
  selectedListId?: string;
  createList: (name: string) => string;
  renameList: (listId: string, name: string) => void;
  deleteList: (listId: string) => void;
  selectList: (listId: string | undefined) => void;
  addPaintToList: (listId: string, paint: Paint) => boolean;
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
      createList: (name) => {
        const trimmed = name.trim();
        if (!trimmed) {
          return '';
        }

        const newId = createListId();
        set((state) => ({
          lists: [...state.lists, { id: newId, name: trimmed, paints: [] }],
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
      addPaintToList: (listId, paint) => {
        const targetList = get().lists.find((list) => list.id === listId);
        if (!targetList) {
          return false;
        }

        const alreadyInList = targetList.paints.some((item) => item.id === paint.id);
        if (alreadyInList) {
          return false;
        }

        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId ? { ...list, paints: [...list.paints, paint] } : list
          ),
        }));
        return true;
      },
      removePaintFromList: (listId, paintId) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  paints: list.paints.filter((paint) => paint.id !== paintId),
                }
              : list
          ),
        }));
      },
    }),
    {
      name: 'paco-app-store',
    }
  )
);