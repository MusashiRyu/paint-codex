import { useState } from 'react';
import type { ListIcon } from '../../app/providers/store';
import { ListIconSvg } from '../../shared/ui/ListIconSvg';
import styles from './NewListSheet.module.css';

interface NewListSheetProps {
  onClose: () => void;
  onCreate: (name: string, icon: ListIcon, color: string) => void;
}

const ALL_ICONS: ListIcon[] = ['skull', 'star', 'shield', 'wing', 'crown', 'flame', 'moon', 'drop'];

const COLOR_OPTIONS = [
  { hex: '#c9a86a', label: 'Gold' },
  { hex: '#7a2430', label: 'Crimson' },
  { hex: '#1c3a44', label: 'Teal' },
  { hex: '#5a3d6e', label: 'Purple' },
  { hex: '#cbb686', label: 'Bone' },
];

export function NewListSheet({ onClose, onCreate }: NewListSheetProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<ListIcon>('star');
  const [color, setColor] = useState('#c9a86a');

  const canCreate = name.trim().length > 0;

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate(name.trim(), icon, color);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={stopPropagation}>
        {/* Header */}
        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitle}>FORGE A NEW LIST</div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Name input */}
        <input
          className={styles.nameInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="List name..."
          autoFocus
        />

        {/* Icon picker */}
        <div className={styles.sectionLabel}>Choose an emblem</div>
        <div className={styles.iconGrid}>
          {ALL_ICONS.map((ic) => (
            <button
              key={ic}
              className={`${styles.iconBtn} ${icon === ic ? styles.iconBtnSelected : ''}`}
              onClick={() => setIcon(ic)}
              aria-label={ic}
            >
              <ListIconSvg icon={ic} size={20} />
            </button>
          ))}
        </div>

        {/* Color picker */}
        <div className={styles.sectionLabel}>Choose a banner color</div>
        <div className={styles.colorRow}>
          {COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.hex}
              className={styles.colorSwatch}
              style={{
                background: opt.hex,
                border: `2px solid ${color === opt.hex ? '#ffffff' : 'transparent'}`,
                boxShadow: `0 0 0 1px rgba(0,0,0,0.4)${color === opt.hex ? ', 0 0 0 3px rgba(201,168,106,0.35)' : ''}`,
              }}
              onClick={() => setColor(opt.hex)}
              aria-label={opt.label}
            />
          ))}
        </div>

        {/* Create button */}
        <button
          className={styles.createBtn}
          onClick={handleCreate}
          style={{ opacity: canCreate ? 1 : 0.4, pointerEvents: canCreate ? 'auto' : 'none' }}
        >
          CREATE LIST
        </button>
      </div>
    </div>
  );
}
