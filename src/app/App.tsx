import { useMemo, useRef, useState } from 'react';
import { resolvePaints } from '../domain/paintRepository';
import type { Paint } from '../domain/types';
import { useAppStore } from './providers/store';
import { usePaintCatalog } from './providers/usePaintCatalog';
import { generatePaintListMarkdown, getExportFilename } from '../features/export/markdownExport';
import { AboutSheet } from '../features/about/AboutSheet';
import { ColorLab } from '../features/lab/ColorLab';
import { ListsPanel } from '../features/lists/ListsPanel';
import { SearchSheet } from '../features/search/SearchSheet';
import { NewListSheet } from '../features/lists/NewListSheet';
import { BottomNav, type Screen } from './BottomNav';
import { ACTION_ICON } from '../shared/ui/actionIcon';
import { Badge } from '../shared/ui/Badge';
import { GoldButton } from '../shared/ui/GoldButton';
import { IconButton } from '../shared/ui/IconButton';
import { useBackDismiss } from '../shared/hooks/useBackDismiss';
import { appConfig } from './config';
import type { ListIcon } from './providers/store';
import styles from './App.module.css';

const markdownExportEnabled = appConfig.featureFlags.markdownExport;

function App() {
  const [screen, setScreen] = useState<Screen>('lists');
  const [searchOpen, setSearchOpen] = useState(false);
  /** The paint the search sheet opens on; null is the FAB's blank search. */
  const [focusPaintId, setFocusPaintId] = useState<string | null>(null);
  const [newListOpen, setNewListOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [exportFlash, setExportFlash] = useState(false);

  const {
    lists,
    selectedListId,
    createList,
    deleteList,
    renameList,
    selectList,
    addPaintToList,
    removePaintFromList,
  } = useAppStore();

  // Re-renders if the background refresh swaps the catalogue mid-session.
  const paintCatalog = usePaintCatalog();

  /*
   * The paint argument is required rather than defaulted, and every blank open
   * passes `null` explicitly. `onOpenSearch` and the FAB's `onClick` are wired
   * straight onto DOM handlers, so React calls them *with the SyntheticEvent* —
   * a defaulted parameter would type-check and then take an event object as the
   * paint id.
   */
  const openSearch = (paintId: string | null) => {
    setFocusPaintId(paintId);
    setSearchOpen(true);
  };

  // Clearing the focus is what stops the next FAB press re-opening on the last
  // paint a row was tapped for.
  const closeSearch = () => {
    setSearchOpen(false);
    setFocusPaintId(null);
  };

  // Back gesture closes an open sheet instead of the app.
  useBackDismiss(searchOpen, closeSearch);
  useBackDismiss(newListOpen, () => setNewListOpen(false));
  useBackDismiss(aboutOpen, () => setAboutOpen(false));

  const activeList = useMemo(
    () => lists.find((l) => l.id === selectedListId) ?? lists[0],
    [lists, selectedListId]
  );

  // Resolved from the catalogue, so a refreshed snapshot reaches saved lists.
  const activePaints = useMemo(
    () => (activeList ? resolvePaints(activeList.paintIds, paintCatalog) : []),
    [activeList, paintCatalog]
  );

  /*
   * Adding from the Color Lab happens on a screen that shows no list, so the
   * confirmation has to name where the paint went. Held in a ref so a second
   * add re-arms the timer rather than letting the first one cut it short.
   */
  const [addFlash, setAddFlash] = useState<string | null>(null);
  const addFlashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleLabAdd = (paint: Paint) => {
    if (!activeList) return;
    // The return value is deliberately ignored. A card only offers its button
    // when the paint is *not* in the list, so the duplicate case is reachable
    // only by a double-tap landing before the re-render — and there "Added to
    // Ultramarines" is both true and less confusing than telling someone the
    // thing they just added was already there.
    addPaintToList(activeList.id, paint.id);
    setAddFlash(`Added to ${activeList.name}`);
    clearTimeout(addFlashTimer.current);
    addFlashTimer.current = setTimeout(() => setAddFlash(null), 1500);
  };

  const handleExport = () => {
    if (!activeList) return;
    const md = generatePaintListMarkdown({ name: activeList.name, paints: activePaints });
    const filename = getExportFilename(activeList.name);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    // Revoking in the same tick can cancel the download before it starts.
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setExportFlash(true);
    setTimeout(() => setExportFlash(false), 1500);
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.headerWrap}>
          <div>
            <div className={styles.title}>PAINT CODEX</div>
            <div className={styles.subtitle}>
              {screen === 'lists' ? 'Color Manager' : 'Color Laboratory'}
            </div>
          </div>
          <IconButton label="About Paco" onClick={() => setAboutOpen(true)}>
            <svg {...ACTION_ICON}>
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 11 V16.5" />
              <path d="M12 7.8 V8.2" />
            </svg>
          </IconButton>
        </div>
        <svg
          width="100%"
          height="10"
          viewBox="0 0 346 10"
          className={styles.divider}
          aria-hidden="true"
        >
          <line x1="0" y1="5" x2="145" y2="5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
          <path d="M167 1 L171 5 L167 9 L163 5 Z" fill="currentColor" fillOpacity="0.55" />
          <line x1="193" y1="5" x2="346" y2="5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
        </svg>

        {/* Lists panel (tabs + content) — kept mounted only while it is the
            screen, so its rename draft and scroll reset like a screen should. */}
        {screen === 'lists' && (
        <ListsPanel
          lists={lists}
          activeListId={activeList?.id}
          activePaints={activePaints}
          onSelectList={selectList}
          onOpenNewList={() => setNewListOpen(true)}
          onOpenSearch={() => openSearch(null)}
          onShowEquivalents={(paintId) => openSearch(paintId)}
          onRemovePaint={(paintId) => {
            if (activeList) removePaintFromList(activeList.id, paintId);
          }}
          onDeleteList={(listId) => deleteList(listId)}
          onRenameList={(listId, name) => renameList(listId, name)}
          onExportList={markdownExportEnabled ? handleExport : undefined}
          exportFlash={markdownExportEnabled && exportFlash}
        />
        )}

        {screen === 'collab' && (
          <ColorLab
            paintCatalog={paintCatalog}
            lists={lists}
            activeListPaintIds={activeList?.paintIds}
            /* Undefined with no lists at all: there is nowhere to add to, so
               the cards show no add button rather than a dead one. */
            onAddPaint={activeList ? handleLabAdd : undefined}
          />
        )}

        {/* Floating action button — the List screen's action, so it goes with
            the List screen rather than hovering over the Lab. */}
        {screen === 'lists' && (
          <GoldButton
            size="lg"
            className={styles.fab}
            label="Add paint"
            onClick={() => openSearch(null)}
          >
            +
          </GoldButton>
        )}

        {addFlash && (
          <div className={styles.addFlash} role="status">
            <Badge tone="success">{addFlash}</Badge>
          </div>
        )}

        <BottomNav screen={screen} onSelect={setScreen} />

        {/* Search sheet overlay */}
        {searchOpen && (
          <SearchSheet
            /* The seed is read once, at mount. The sheet already unmounts on
             * close, so this only matters if it ever stops doing that — then
             * the key is what makes a new paint a new sheet. */
            key={focusPaintId ?? 'blank'}
            paintCatalog={paintCatalog}
            listedPaintIds={activeList?.paintIds}
            focusPaintId={focusPaintId}
            onAdd={(paint) => {
              if (activeList) addPaintToList(activeList.id, paint.id);
            }}
            onClose={closeSearch}
          />
        )}

        {/* New list sheet overlay */}
        {newListOpen && (
          <NewListSheet
            onClose={() => setNewListOpen(false)}
            onCreate={(name: string, icon: ListIcon, color: string) => {
              createList(name, icon, color);
              setNewListOpen(false);
            }}
          />
        )}

        {/* About sheet overlay */}
        {aboutOpen && <AboutSheet onClose={() => setAboutOpen(false)} />}
      </div>
    </div>
  );
}

export default App;