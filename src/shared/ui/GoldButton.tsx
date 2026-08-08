import type { ReactNode } from 'react';
import styles from './GoldButton.module.css';

export interface GoldButtonProps {
  /** `md` sits inline in a row; `lg` is the elevated floating action. */
  size?: 'md' | 'lg';
  /** Accessible name — this button is icon-only. */
  label: string;
  /** Positioning is the caller's; the button owns only its own look. */
  className?: string;
  onClick: () => void;
  children: ReactNode;
}

/**
 * The primary action, and the only filled control in the app: a round gold
 * gradient. Use it for "add something", nothing else — its weight is the whole
 * point, and it stops working once it is everywhere.
 */
export function GoldButton({
  size = 'md',
  label,
  className,
  onClick,
  children,
}: GoldButtonProps) {
  return (
    <button
      type="button"
      className={[styles.btn, styles[size], className].filter(Boolean).join(' ')}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  );
}
