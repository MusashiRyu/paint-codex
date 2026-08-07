import { useMemo, useState } from 'react';
import { getPaints } from '../domain/paintRepository';
import { useAppStore } from './providers/store';
import { generatePaintListMarkdown, getExportFilename } from '../features/export/markdownExport';
import { ListsPanel } from '../features/lists/ListsPanel';
import { SearchSheet } from '../features/search/SearchSheet';
import { NewListSheet } from '../features/lists/NewListSheet';
import { useBackDismiss } from '../shared/hooks/useBackDismiss';
import type { ListIcon } from './providers/store';
import styles from './App.module.css';

function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [newListOpen, setNewListOpen] = useState(false);
  const [exportFlash, setExportFlash] = useState(false);

  const {
    lists,
    selectedListId,
    createList,
    deleteList,
    selectList,
    addPaintToList,
    removePaintFromList,
  } = useAppStore();

  const paintCatalog = useMemo(() => getPaints(), []);

  // Back gesture closes an open sheet instead of the app.
  useBackDismiss(searchOpen, () => setSearchOpen(false));
  useBackDismiss(newListOpen, () => setNewListOpen(false));

  const activeList = useMemo(
    () => lists.find((l) => l.id === selectedListId) ?? lists[0],
    [lists, selectedListId]
  );

  const handleExport = () => {
    if (!activeList) return;
    const md = generatePaintListMarkdown(activeList);
    const filename = getExportFilename(activeList.name);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
            <div className={styles.subtitle}>Color Manager</div>
          </div>
        </div>
        <svg
          width="100%"
          height="10"
          viewBox="0 0 346 10"
          className={styles.divider}
          aria-hidden="true"
        >
          <line x1="0" y1="5" x2="145" y2="5" stroke="#c9a86a" strokeOpacity="0.3" strokeWidth="1" />
          <path d="M167 1 L171 5 L167 9 L163 5 Z" fill="#c9a86a" fillOpacity="0.55" />
          <line x1="193" y1="5" x2="346" y2="5" stroke="#c9a86a" strokeOpacity="0.3" strokeWidth="1" />
        </svg>

        {/* Lists panel (tabs + content) */}
        <ListsPanel
          lists={lists}
          activeListId={activeList?.id}
          onSelectList={selectList}
          onOpenNewList={() => setNewListOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onRemovePaint={(paintId) => {
            if (activeList) removePaintFromList(activeList.id, paintId);
          }}
          onDeleteList={(listId) => deleteList(listId)}
          onExportList={handleExport}
          exportFlash={exportFlash}
        />

        {/* Floating action button */}
        <button
          className={styles.fab}
          onClick={() => setSearchOpen(true)}
          aria-label="Add paint"
        >
          <span className={styles.fabIcon}>+</span>
        </button>

        {/* Search sheet overlay */}
        {searchOpen && (
          <SearchSheet
            paintCatalog={paintCatalog}
            activeList={activeList}
            onAdd={(paint) => {
              if (activeList) addPaintToList(activeList.id, paint);
            }}
            onClose={() => setSearchOpen(false)}
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
      </div>
    </div>
  );
}

export default App;