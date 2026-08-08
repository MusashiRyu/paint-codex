import { useState } from 'react';
import type { ListIcon } from '../../app/providers/store';
import { ListIconSvg } from '../../shared/ui/ListIconSvg';
import { DEFAULT_LIST_COLOR, LIST_COLORS } from '../../shared/ui/listPalette';
import { GhostButton } from '../../shared/ui/GhostButton';
import { Sheet } from '../../shared/ui/Sheet';
import { TextField } from '../../shared/ui/TextField';
import styles from './NewListSheet.module.css';

interface NewListSheetProps {
  onClose: () => void;
  onCreate: (name: string, icon: ListIcon, color: string) => void;
}

const ALL_ICONS: ListIcon[] = ['skull', 'star', 'shield', 'wing', 'crown', 'flame', 'moon', 'drop'];

export function NewListSheet({ onClose, onCreate }: NewListSheetProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<ListIcon>('star');
  const [color, setColor] = useState(DEFAULT_LIST_COLOR);

  const canCreate = name.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate(name.trim(), icon, color);
  };

  return (
    <Sheet title="FORGE A NEW LIST" label="Create a new list" onClose={onClose}>
      <div className={styles.nameField}>
        <TextField
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="List name..."
          autoFocus
        />
      </div>

      <div className={styles.sectionLabel}>Choose an emblem</div>
      <div className={styles.iconGrid}>
        {ALL_ICONS.map((ic) => (
          <button
            key={ic}
            type="button"
            className={`${styles.iconTile} ${icon === ic ? styles.iconTileSelected : ''}`}
            onClick={() => setIcon(ic)}
            aria-label={ic}
          >
            <ListIconSvg icon={ic} size={20} />
          </button>
        ))}
      </div>

      <div className={styles.sectionLabel}>Choose a banner color</div>
      <div className={styles.colorRow}>
        {LIST_COLORS.map((opt) => (
          <button
            key={opt.hex}
            type="button"
            className={styles.colorSwatch}
            style={{
              background: opt.hex,
              border: `2px solid ${color === opt.hex ? '#ffffff' : 'transparent'}`,
              boxShadow: `var(--shadow-swatch-ring)${color === opt.hex ? ', var(--shadow-selected-ring)' : ''}`,
            }}
            onClick={() => setColor(opt.hex)}
            aria-label={opt.label}
          />
        ))}
      </div>

      <div className={styles.createRow}>
        <GhostButton size="lg" block disabled={!canCreate} onClick={handleCreate}>
          CREATE LIST
        </GhostButton>
      </div>
    </Sheet>
  );
}
