import { useMemo, useRef, useState } from 'react';
import type { PaintList } from '../../app/providers/store';
import type { Paint } from '../../domain/types';
import { ListIconSvg } from '../../shared/ui/ListIconSvg';
import { useBackDismiss } from '../../shared/hooks/useBackDismiss';
import { PaintItem } from './PaintItem';
import styles from './ListsPanel.module.css';

const CATEGORY_ORDER = ['Base Layer', 'Layer', 'Edge', 'Shade', 'Technical', 'Contrast'];

interface ListsPanelProps {
  lists: PaintList[];
  activeListId: string | undefined;
  /** Active list's paints, already resolved from the catalogue by the caller. */
  activePaints: Paint[];
  onSelectList: (id: string) => void;
  onOpenNewList: () => void;
  onOpenSearch: () => void;
  onRemovePaint: (paintId: string) => void;
  onDeleteList: (listId: string) => void;
  onRenameList: (listId: string, name: string) => void;
  /** Omitted when the markdownExport feature flag is off; hides the export action. */
  onExportList?: () => void;
  exportFlash?: boolean;
}

export function ListsPanel({
  lists,
  activeListId,
  activePaints,
  onSelectList,
  onOpenNewList,
  onOpenSearch,
  onRemovePaint,
  onDeleteList,
  onRenameList,
  onExportList,
  exportFlash,
}: ListsPanelProps) {
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  // Escape unmounts the input; guard so the trailing blur can't commit anyway.
  const skipCommitRef = useRef(false);

  const activeList = useMemo(
    () => lists.find((l) => l.id === activeListId),
    [lists, activeListId]
  );

  const startRename = () => {
    if (!activeList) return;
    skipCommitRef.current = false;
    setDraftName(activeList.name);
    setRenaming(true);
  };

  const commitRename = () => {
    if (skipCommitRef.current) {
      skipCommitRef.current = false;
      return;
    }
    // An empty or whitespace-only name is rejected by the store, keeping the old one.
    if (activeList) onRenameList(activeList.id, draftName);
    setRenaming(false);
  };

  const cancelRename = () => {
    skipCommitRef.current = true;
    setRenaming(false);
  };

  // Back gesture backs out of the rename rather than closing the app.
  useBackDismiss(renaming, cancelRename);

  const sections = useMemo(() => {
    if (!activeList || activePaints.length === 0) return [];
    const byCategory = new Map<string, Paint[]>();
    for (const paint of activePaints) {
      const cat = paint.category ?? 'Other';
      const group = byCategory.get(cat) ?? [];
      group.push(paint);
      byCategory.set(cat, group);
    }
    const entries = Array.from(byCategory.entries());
    entries.sort(([a], [b]) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return entries.map(([type, items]) => ({ type, items }));
  }, [activeList, activePaints]);

  const hasPaints = sections.length > 0;
  const canDelete = lists.length > 1;

  return (
    <>
      {/* Tab bar */}
      <div className={styles.tabBar}>
        {lists.map((list) => {
          const isActive = list.id === activeListId;
          return (
            <button
              key={list.id}
              className={styles.tabPill}
              onClick={() => {
                onSelectList(list.id);
                cancelRename();
              }}
              style={{
                border: `1px solid ${isActive ? list.color : 'rgba(255,255,255,0.1)'}`,
                background: isActive ? `${list.color}26` : 'none',
                color: isActive ? '#e4c98a' : '#9a8f79',
              }}
            >
              <ListIconSvg icon={list.icon} size={13} />
              <span>{list.name}</span>
            </button>
          );
        })}
        <button className={styles.newTabBtn} onClick={onOpenNewList}>
          <span className={styles.newTabPlus}>+</span>
          <span>New</span>
        </button>
      </div>

      {/* Scrollable content */}
      <div className={styles.content}>
        {hasPaints && (
          <div className={styles.listHeader}>
            {renaming ? (
              <input
                className={styles.listNameInput}
                value={draftName}
                autoFocus
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitRename();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelRename();
                  }
                }}
                aria-label="List name"
              />
            ) : (
              <div className={styles.listName}>{activeList!.name}</div>
            )}
            <div className={styles.listActions}>
              {exportFlash && <span className={styles.exportFlash}>Exported ✓</span>}
              {onExportList && (
                <button className={styles.iconBtn} onClick={onExportList} title="Export list">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4 V15 M8 11 L12 15 L16 11 M5 19 H19" />
                  </svg>
                </button>
              )}
              <button
                className={`${styles.iconBtn} ${renaming ? styles.iconBtnActive : ''}`}
                // Keep focus in the input, so the click commits instead of
                // blur-committing and then reopening a fresh rename.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => (renaming ? commitRename() : startRename())}
                title="Rename list"
                aria-label="Rename list"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20 L4.8 16.2 L15.5 5.5 C16.3 4.7 17.6 4.7 18.4 5.5 C19.2 6.3 19.2 7.6 18.4 8.4 L7.7 19.1 Z" />
                  <path d="M14 7 L17 10" />
                </svg>
              </button>
              <button
                className={styles.iconBtnDanger}
                onClick={() => canDelete && onDeleteList(activeList!.id)}
                title="Delete list"
                style={{ opacity: canDelete ? 1 : 0.3, pointerEvents: canDelete ? 'auto' : 'none' }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 7 H19 M9 7 V5 C9 4.4 9.4 4 10 4 H14 C14.6 4 15 4.4 15 5 V7 M7 7 L7.7 19 C7.8 19.6 8.3 20 8.9 20 H15.1 C15.7 20 16.2 19.6 16.3 19 L17 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {hasPaints &&
          sections.map(({ type, items }) => (
            <div key={type}>
              <div className={styles.sectionType}>{type}</div>
              {items.map((paint) => (
                <PaintItem
                  key={paint.id}
                  name={paint.name}
                  brand={paint.brand}
                  type={paint.category}
                  hex={paint.hex}
                  onRemove={() => onRemovePaint(paint.id)}
                />
              ))}
            </div>
          ))}

        {!hasPaints && (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="#c9a86a" strokeOpacity="0.4" strokeWidth="1">
              <path d="M12 3 L14.2 9.2 L21 9.6 L15.6 13.8 L17.4 20.4 L12 16.5 L6.6 20.4 L8.4 13.8 L3 9.6 L9.8 9.2 Z" />
            </svg>
            {activeList ? (
              <>
                <div className={styles.emptyTitle}>Your grimoire is empty</div>
                <div className={styles.emptyMsg}>No paints have been recorded for this list yet.</div>
                <button className={styles.addFirstBtn} onClick={onOpenSearch}>
                  + ADD FIRST PAINT
                </button>
              </>
            ) : (
              <>
                <div className={styles.emptyTitle}>No lists yet</div>
                <div className={styles.emptyMsg}>Create your first list to start tracking paints.</div>
                <button className={styles.addFirstBtn} onClick={onOpenNewList}>
                  + CREATE FIRST LIST
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}