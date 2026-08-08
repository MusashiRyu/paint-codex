import { ListsPanel } from 'paco';
import type { Paint, PaintList } from 'paco';

const LISTS: PaintList[] = [
  { id: 'l1', name: 'Death Guard', icon: 'skull', color: '#7a2430', paintIds: ['p1', 'p2', 'p3'] },
  { id: 'l2', name: 'Ultramarines', icon: 'crown', color: '#1c3a44', paintIds: [] },
];

const PAINTS: Paint[] = [
  { id: 'p1', brand: 'Citadel', name: 'Mephiston Red', hex: '#9B0E05', category: 'Base Layer', matches: [] },
  { id: 'p2', brand: 'Citadel', name: 'Abaddon Black', hex: '#141414', category: 'Base Layer', matches: [] },
  { id: 'p3', brand: 'Citadel', name: 'Nuln Oil', hex: '#1B1B1B', category: 'Shade', matches: [] },
];

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: 390, height: 560, background: 'var(--bg-page)', borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px var(--gold-inset)' }}>
    {children}
  </div>
);

const noop = () => {};

/** Tabs, the list header actions, and paints grouped by category. */
export const WithPaints = () => (
  <Frame>
    <ListsPanel
      lists={LISTS}
      activeListId="l1"
      activePaints={PAINTS}
      onSelectList={noop}
      onOpenNewList={noop}
      onOpenSearch={noop}
      onRemovePaint={noop}
      onDeleteList={noop}
      onRenameList={noop}
    />
  </Frame>
);

/** An empty list still gets its header, so it can be renamed and deleted. */
export const EmptyList = () => (
  <Frame>
    <ListsPanel
      lists={LISTS}
      activeListId="l2"
      activePaints={[]}
      onSelectList={noop}
      onOpenNewList={noop}
      onOpenSearch={noop}
      onRemovePaint={noop}
      onDeleteList={noop}
      onRenameList={noop}
    />
  </Frame>
);

/** No lists at all — the state deleting the last list drops to. */
export const NoLists = () => (
  <Frame>
    <ListsPanel
      lists={[]}
      activeListId={undefined}
      activePaints={[]}
      onSelectList={noop}
      onOpenNewList={noop}
      onOpenSearch={noop}
      onRemovePaint={noop}
      onDeleteList={noop}
      onRenameList={noop}
    />
  </Frame>
);
