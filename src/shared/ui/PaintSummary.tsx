import type { ReactNode } from 'react';
import type { Paint } from '../../domain/types';
import { Swatch } from './Swatch';
import styles from './PaintSummary.module.css';

export interface PaintSummaryProps {
  paint: Paint;
  /**
   * The trailing action area — an IN LIST badge, an add button, a ΔE badge, or
   * a stack of them. A slot rather than props because "what you can do with
   * this paint" is the only thing that differs between the surfaces showing
   * one: the search results add it to a list, the Color Lab adds the nearest
   * paint to a colour you cannot buy.
   */
  children?: ReactNode;
}

/**
 * One paint, named and described: swatch, name, brand, range · hex.
 *
 * Lifted out of `ResultCard` when the Color Lab needed the same row without
 * the equivalents grid under it. Every class name is unchanged by that move —
 * `SearchSheet.test.tsx` and `check-layout.mjs` both select on `paintName`.
 */
export function PaintSummary({ paint, children }: PaintSummaryProps) {
  return (
    <div className={styles.paintRow}>
      <Swatch color={paint.hex} size="md" />
      <div className={styles.paintInfo}>
        <div className={styles.paintName}>{paint.name}</div>
        <div className={styles.paintBrand}>{paint.brand}</div>
        <div className={styles.paintMeta}>
          {paint.category && <span>{paint.category}</span>}
          {paint.category && <span className={styles.metaDot}>·</span>}
          <span className={styles.metaHex}>{paint.hex}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
