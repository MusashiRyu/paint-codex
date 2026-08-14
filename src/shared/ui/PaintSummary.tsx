import type { ReactNode } from 'react';
import type { Paint } from '../../domain/types';
import { Swatch } from './Swatch';
import styles from './PaintSummary.module.css';

export interface PaintSummaryProps {
  paint: Paint;
  /**
   * Makes the swatch and the text one button. Given, `children` are rendered
   * *beside* that button rather than inside it — a button may not nest another,
   * and two tab stops for one paint is what `PaintItem` already avoids by
   * keeping its remove action a sibling.
   */
  onSelect?: () => void;
  /** Accessible name for that button. Required when `onSelect` is given. */
  selectLabel?: string;
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
 *
 * Spans throughout, whether or not it is a button, so there is one render path
 * rather than two that have to be kept looking alike: a button may only hold
 * phrasing content, and the layout comes from `display` in the stylesheet.
 */
export function PaintSummary({ paint, onSelect, selectLabel, children }: PaintSummaryProps) {
  const body = (
    <>
      <Swatch color={paint.hex} size="md" as="span" />
      <span className={styles.paintInfo}>
        <span className={styles.paintName}>{paint.name}</span>
        <span className={styles.paintBrand}>{paint.brand}</span>
        <span className={styles.paintMeta}>
          {paint.category && <span>{paint.category}</span>}
          {paint.category && <span className={styles.metaDot}>·</span>}
          <span className={styles.metaHex}>{paint.hex}</span>
        </span>
      </span>
    </>
  );

  return (
    <div className={styles.paintRow}>
      {onSelect ? (
        <button type="button" className={styles.selectable} onClick={onSelect} aria-label={selectLabel}>
          {body}
        </button>
      ) : (
        body
      )}
      {children}
    </div>
  );
}
