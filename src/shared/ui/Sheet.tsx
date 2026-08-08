import type { ReactNode } from 'react';
import { useDismissOnEscape } from '../hooks/useDismissOnEscape';
import { useFocusTrap } from '../hooks/useFocusTrap';
import styles from './Sheet.module.css';

export interface SheetProps {
  /** Header text, set in display caps. */
  title: string;
  /** Accessible name for the dialog itself. */
  label: string;
  /** Accessible name for the close button — say what is being closed. */
  closeLabel?: string;
  /**
   * `auto` sizes to its content (a short form); `tall` is a fixed-height sheet
   * whose body scrolls (a long list). A tall sheet is a flex column, so a child
   * with `flex: 1` is what scrolls.
   */
  size?: 'auto' | 'tall';
  onClose: () => void;
  children: ReactNode;
}

/**
 * A bottom sheet: dim backdrop, rounded lip, header with a close action.
 *
 * It owns the dismissal and focus contract so a caller cannot forget half of
 * it — Escape closes, focus is trapped inside and returned to the trigger, and
 * the dialog role and modal flag are always set. Backdrop clicks close;
 * clicks inside do not. The Android back gesture is the caller's to wire, with
 * `useBackDismiss`, because the open flag lives with the caller.
 */
export function Sheet({
  title,
  label,
  closeLabel = 'Close',
  size = 'auto',
  onClose,
  children,
}: SheetProps) {
  useDismissOnEscape(onClose);
  const sheetRef = useFocusTrap<HTMLDivElement>();

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${styles[size]}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <button className={styles.closeBtn} onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
