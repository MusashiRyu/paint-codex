import { useEffect, useMemo, useState } from 'react';
import type { PaintList } from '../../app/providers/store';
import styles from './ListsPanel.module.css';

interface ListsPanelProps {
  lists: PaintList[];
  selectedListId?: string;
  notice?: string;
  onCreateList: (name: string) => void;
  onSelectList: (listId: string | undefined) => void;
  onRenameList: (listId: string, name: string) => void;
  onDeleteList: (listId: string) => void;
  onRemovePaint: (listId: string, paintId: string) => void;
}

export function ListsPanel({
  lists,
  selectedListId,
  notice,
  onCreateList,
  onSelectList,
  onRenameList,
  onDeleteList,
  onRemovePaint,
}: ListsPanelProps) {
  const [newListName, setNewListName] = useState('');
  const [renameDraft, setRenameDraft] = useState('');
  const selectedList = useMemo(
    () => lists.find((list) => list.id === selectedListId),
    [lists, selectedListId]
  );

  useEffect(() => {
    setRenameDraft(selectedList?.name ?? '');
  }, [selectedList?.id, selectedList?.name]);

  const handleCreate = () => {
    const trimmed = newListName.trim();
    if (!trimmed) {
      return;
    }
    onCreateList(trimmed);
    setNewListName('');
  };

  const commitRename = () => {
    if (!selectedList) {
      return;
    }

    const trimmed = renameDraft.trim();
    if (!trimmed) {
      setRenameDraft(selectedList.name);
      return;
    }

    if (trimmed === selectedList.name) {
      setRenameDraft(selectedList.name);
      return;
    }

    onRenameList(selectedList.id, trimmed);
    setRenameDraft(trimmed);
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Paint Lists</h2>
        <p className={styles.subtitle}>Create and manage your saved paint sets.</p>
      </div>

      <div className={styles.createRow}>
        <input
          className={styles.input}
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCreate();
            }
          }}
        />
        <button className={styles.primaryButton} onClick={handleCreate}>
          Create List
        </button>
      </div>

      {notice && <p className={styles.notice}>{notice}</p>}

      <div className={styles.listTabs}>
        {lists.length === 0 && (
          <p className={styles.emptyMessage}>No lists yet. Create one to start saving paints.</p>
        )}
        {lists.map((list) => {
          const isSelected = selectedListId === list.id;
          return (
            <div key={list.id} className={styles.listTabRow}>
              <button
                className={`${styles.listTab} ${isSelected ? styles.active : ''}`}
                onClick={() => onSelectList(list.id)}
              >
                {list.name}
              </button>
              <button
                className={styles.deleteButton}
                onClick={() => onDeleteList(list.id)}
                title="Delete list"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>

      {selectedList && (
        <div className={styles.selectedListSection}>
          <div className={styles.selectedListHeader}>
            <input
              className={styles.renameInput}
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitRename();
                }
              }}
              aria-label="Rename selected list"
            />
            <button className={styles.secondaryButton} onClick={() => onSelectList(undefined)}>
              Unselect
            </button>
          </div>

          {selectedList.paints.length === 0 ? (
            <p className={styles.emptyMessage}>No paints in this list yet.</p>
          ) : (
            <ul className={styles.paintItems}>
              {selectedList.paints.map((paint) => (
                <li key={paint.id} className={styles.paintItem}>
                  <div className={styles.paintItemLeft}>
                    <span
                      className={styles.paintSwatch}
                      style={{ backgroundColor: paint.hex }}
                      title={paint.hex}
                    />
                    <span>{paint.brand} - {paint.name}</span>
                  </div>
                  <button
                    className={styles.removeButton}
                    onClick={() => onRemovePaint(selectedList.id, paint.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}