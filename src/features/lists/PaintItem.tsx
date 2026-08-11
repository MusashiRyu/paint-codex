import { IconButton } from '../../shared/ui/IconButton';
import { Swatch } from '../../shared/ui/Swatch';
import styles from './PaintItem.module.css';

interface PaintItemProps {
  name: string;
  brand: string;
  type?: string;
  hex: string;
  /** Opens the search sheet on this paint, where its equivalents are listed. */
  onShowEquivalents: () => void;
  onRemove: () => void;
}

export function PaintItem({
  name,
  brand,
  type,
  hex,
  onShowEquivalents,
  onRemove,
}: PaintItemProps) {
  return (
    <div className={styles.item}>
      {/* Most of the row is the button; remove is its sibling rather than its
       * child — a button may not nest one, and the action with no undo must not
       * be what a stray tap on the row hits.
       *
       * The label deliberately does not start with "Go to": that is how
       * tools/layout/check-layout.mjs picks equivalent tiles out of a page. */}
      <button
        type="button"
        className={styles.rowMain}
        onClick={onShowEquivalents}
        aria-label={`Show equivalents for ${name} by ${brand}`}
      >
        {/* Spans, since a button may only hold phrasing content. */}
        <Swatch color={hex} as="span" />
        <span className={styles.info}>
          <span className={styles.name}>{name}</span>
          <span className={styles.meta}>
            <span className={styles.brand}>{brand}</span>
            {type && (
              <>
                <span className={styles.dot}>·</span>
                <span className={styles.type}>{type}</span>
              </>
            )}
          </span>
        </span>
        <span className={styles.hex}>{hex}</span>
      </button>
      <IconButton size="sm" tone="danger" label="Remove paint" onClick={onRemove}>
        ×
      </IconButton>
    </div>
  );
}
