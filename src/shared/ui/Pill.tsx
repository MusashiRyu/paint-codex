import type { CSSProperties, ReactNode } from 'react';
import styles from './Pill.module.css';

export interface PillProps {
  /** `sm` for filter chips, `md` for list tabs. */
  size?: 'sm' | 'md';
  /** Applies the gold active treatment. */
  selected?: boolean;
  /** Dashed outline — the "create one" slot rather than an existing value. */
  dashed?: boolean;
  /**
   * Escape hatch for a pill tinted with user-chosen colour (a list's banner),
   * which cannot come from a token. Prefer `selected` for everything else.
   */
  style?: CSSProperties;
  onClick?: () => void;
  children: ReactNode;
}

/**
 * A horizontal chip: list tabs, brand filters, the "+ New" slot.
 *
 * Always a button — every pill in this app selects something. Static labels
 * are `Badge`, not a disabled Pill.
 */
export function Pill({
  size = 'md',
  selected = false,
  dashed = false,
  style,
  onClick,
  children,
}: PillProps) {
  const className = [
    styles.pill,
    styles[size],
    selected ? styles.selected : '',
    dashed ? styles.dashed : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={className} style={style} onClick={onClick}>
      {children}
    </button>
  );
}
