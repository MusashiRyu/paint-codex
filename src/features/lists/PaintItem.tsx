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
      <div className={styles.swatch} style={{ background: hex }} />
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
      <button className={styles.removeRight} onClick={onRemove} aria-label="Remove paint" title="Remove paint">
        ×
      </button>
    </div>
  );
}
