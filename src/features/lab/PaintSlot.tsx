import type { Paint } from '../../domain/types';
import { ACTION_ICON } from '../../shared/ui/actionIcon';
import { IconButton } from '../../shared/ui/IconButton';
import { Swatch } from '../../shared/ui/Swatch';
import styles from './PaintSlot.module.css';

interface PaintSlotProps {
  /** What the slot holds, or null for the empty prompt. */
  paint: Paint | null;
  /** What the slot is for — "Paint A", "a Base Paint". Used in every label. */
  label: string;
  /**
   * `stacked` is the pair on the Mixing tab, two to a row with the swatch above
   * the name. `row` is the single wide slot on Matching.
   */
  variant: 'stacked' | 'row';
  onPick: () => void;
  onClear: () => void;
}

/**
 * One of the Color Lab's paint slots: an empty invitation, or a filled card.
 *
 * Filled, the swatch stays a button — re-picking is the common correction, and
 * making the user clear first would be two taps for one decision. The clear
 * action is separate and small, in the corner.
 */
export function PaintSlot({ paint, label, variant, onPick, onClear }: PaintSlotProps) {
  if (!paint) {
    return (
      <button
        type="button"
        className={`${styles.empty} ${styles[variant]}`}
        onClick={onPick}
        aria-label={`Select ${label}`}
      >
        <span className={styles.plus}>+</span>
        <span className={styles.emptyLabel}>Select {label}</span>
      </button>
    );
  }

  return (
    <div className={`${styles.filled} ${styles[variant]}`}>
      <div className={styles.clear}>
        <IconButton size="sm" tone="danger" label={`Clear ${label}`} onClick={onClear}>
          <svg {...ACTION_ICON}>
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </IconButton>
      </div>

      <button
        type="button"
        className={styles.swatchButton}
        onClick={onPick}
        aria-label={`Change ${label}, currently ${paint.name} by ${paint.brand}`}
      >
        <Swatch color={paint.hex} size={variant === 'stacked' ? 'wide' : 'md'} as="span" />
      </button>

      <div className={styles.info}>
        <div className={styles.slotName}>{paint.name}</div>
        <div className={styles.slotBrand}>{paint.brand}</div>
        <div className={styles.hex}>{paint.hex}</div>
      </div>
    </div>
  );
}
