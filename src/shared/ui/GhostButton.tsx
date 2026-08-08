import type { ReactNode } from 'react';
import styles from './GhostButton.module.css';

export interface GhostButtonProps {
  /** `quiet` drops the fill — an offer rather than the urged action. */
  tone?: 'primary' | 'quiet';
  size?: 'sm' | 'md' | 'lg';
  /** Full width, for a sheet's committing action. */
  block?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

/**
 * An outlined pill action with a text label — the app's workhorse button.
 * Distinct from `GoldButton`, which is filled, round and icon-only.
 */
export function GhostButton({
  tone = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  onClick,
  children,
}: GhostButtonProps) {
  const className = [
    styles.btn,
    styles[size],
    tone === 'quiet' ? styles.quiet : '',
    block ? styles.block : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
