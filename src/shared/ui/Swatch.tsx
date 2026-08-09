import styles from './Swatch.module.css';

export interface SwatchProps {
  /** Any CSS colour — in this app, a paint's `#RRGGBB`. */
  color: string;
  /** `sm` in a list row, `md` in a search result, `tile` atop a tile. */
  size?: 'sm' | 'md' | 'tile';
  /**
   * Render as a `span` when the swatch sits inside a button, which may only
   * contain phrasing content.
   */
  as?: 'div' | 'span';
}

/** A block of colour with an inset dark ring, so pale paints stay visible. */
export function Swatch({ color, size = 'sm', as = 'div' }: SwatchProps) {
  const Tag = as;
  return (
    <Tag
      className={`${styles.swatch} ${styles[size]}`}
      style={{ background: color }}
    />
  );
}
