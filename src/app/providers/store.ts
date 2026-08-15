import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import paintIdMigration from '../../data/paintIdMigration.json';
import type { Paint } from '../../domain/types';
import { DEFAULT_LIST_COLOR } from '../../shared/ui/listPalette';

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
 * corrected hex or a new equivalent in the catalog snapshot never reached
 * paints already saved in a list. Resolve against the catalog at read time
 * with `resolvePaints` from the domain layer.
 */
export type PaintList = {
  id: string;
  name: string;
  icon: ListIcon;
  color: string;
  paintIds: string[];
};

/**
 * Union of every shape ever persisted, kept for the migration: `paints` is the
 * pre-v2 embedded copies, `paintIds` everything since. Both optional, because
 * `migrate` walks the versions in order and the list is mid-conversion between
 * the two while it does.
 */
type LegacyPaintList = Omit<PaintList, 'paintIds'> & {
  paints?: Paint[];
  paintIds?: string[];
};

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
      createList: (name, icon = 'star', color = DEFAULT_LIST_COLOR) => {
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
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as {
          lists: LegacyPaintList[];
          selectedListId?: string;
        };
        let lists = state.lists ?? [];

        // v0 -> v1: lists gained an icon and a banner color.
        // The color is deliberately the literal v1 shipped with, not
        // DEFAULT_LIST_COLOR: a migration has to keep writing what it wrote
        // then, or changing the palette silently rewrites old lists.
        if (version < 1) {
          lists = lists.map((l) => ({
            ...l,
            icon: (l.icon ?? 'star') as ListIcon,
            color: l.color ?? '#c9a86a',
          }));
        }

        // v1 -> v2: embedded paint copies become ids resolved from the catalog.
        if (version < 2) {
          lists = lists.map(({ paints, ...rest }) => ({
            ...rest,
            paintIds: (paints ?? []).map((paint) => paint.id),
          }));
        }

        // v2 -> v3 and v3 -> v4: paint ids have moved twice. First the
        // catalog changed source and an id gained its range
        // (`citadel-white-scar` -> `citadel-layer-white-scar`); then rows that
        // were the same color under two range names merged into one entry, so
        // `citadel-air-abaddon-black` folded into `citadel-base-abaddon-black`.
        //
        // `resolvePaints` drops ids it cannot find, so an unmigrated list would
        // have emptied itself with no message. One map covers both steps: it is
        // built from every superseded snapshot at once and checked to contain
        // no entry whose target is itself a key, which is what makes applying
        // it twice safe. Ids absent from it are either unchanged or paints the
        // new source does not carry; both are left alone and the second kind
        // drops out at resolve time, as any retired paint does.
        if (version < 4) {
          const renames: Record<string, string> = paintIdMigration;
          lists = lists.map((l) => ({
            ...l,
            paintIds: (l.paintIds ?? []).map((id) => renames[id] ?? id),
          }));
        }

        return { ...state, lists };
      },
    }
  )
);