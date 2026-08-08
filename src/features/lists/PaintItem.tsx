import { IconButton } from '../../shared/ui/IconButton';
import { Swatch } from '../../shared/ui/Swatch';
import styles from './PaintItem.module.css';

interface PaintItemProps {
  name: string;
  brand: string;
  type?: string;
  hex: string;
  onRemove: () => void;
}

export function PaintItem({ name, brand, type, hex, onRemove }: PaintItemProps) {
  return (
    <div className={styles.item}>
      <Swatch color={hex} />
      <div className={styles.info}>
        <div className={styles.name}>{name}</div>
        <div className={styles.meta}>
          <span className={styles.brand}>{brand}</span>
          {type && (
            <>
              <span className={styles.dot}>·</span>
              <span className={styles.type}>{type}</span>
            </>
          )}
        </div>
      </div>
      <div className={styles.hex}>{hex}</div>
      <IconButton size="sm" tone="danger" label="Remove paint" onClick={onRemove}>
        ×
      </IconButton>
    </div>
  );
}
