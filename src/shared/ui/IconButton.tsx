import type { MouseEvent, ReactNode } from 'react';
import styles from './IconButton.module.css';

export interface IconButtonProps {
  /** `sm` is the inline remove; `md` is a header action. */
  size?: 'sm' | 'md';
  tone?: 'neutral' | 'active' | 'danger';
  /** Sets both the accessible name and the tooltip — these buttons are icon-only. */
  label: string;
  onClick: () => void;
  /** Rare: used to keep focus in an input so a click commits rather than blurs. */
  onMouseDown?: (e: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}

/**
 * A round, outline-only icon button. Carries its own label because it never
 * has visible text.
 */
export function IconButton({
  size = 'md',
  tone = 'neutral',
  label,
  onClick,
  onMouseDown,
  children,
}: IconButtonProps) {
  const className = [styles.btn, styles[size], tone !== 'neutral' ? styles[tone] : '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      onMouseDown={onMouseDown}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
