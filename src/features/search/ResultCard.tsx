import { memo } from 'react';
import type { Paint } from '../../domain/types';
import { getTopMatches } from '../../domain/paintQueries';
import { CLOSE_DELTA_MAX, getDeltaLabel, getDeltaStyle } from '../../shared/lib/color';
import { Badge } from '../../shared/ui/Badge';
import { GoldButton } from '../../shared/ui/GoldButton';
import { Swatch } from '../../shared/ui/Swatch';
import styles from './ResultCard.module.css';

/**
 * Equivalents shown per paint. The snapshot stores exactly this many, so the
 * cap is really the delta filter below — a paint with no near neighbour in
 * another brand shows fewer tiles, or none.
 */
export const MAX_EQUIVALENTS = 6;

export interface ResultCardProps {
  paint: Paint;
  /** Resolves an equivalent's stored id to the paint it stands for. */
  paintsById: Map<string, Paint>;
  /** Ids in the active list — the IN LIST badge, on the card and on its tiles. */
  activeIds: Set<string>;
  /** True for the card the sheet is anchored on: the gold ring, and focusable. */
  anchored: boolean;
  /** Position in the list and its length, for `aria-posinset` / `aria-setsize`. */
  position: number;
  total: number;
  onAdd: (paint: Paint) => void;
  onJump: (paint: Paint) => void;
  /** Lets the sheet hold the node, to scroll to it and to measure it. */
  registerCard: (id: string, node: HTMLDivElement | null) => void;
}

/**
 * One paint in the results list, with its cross-brand equivalents.
 *
 * Memoised, and that is the point of it existing as a component: the list is
 * windowed, so a scroll re-renders the sheet several times a second. Without
 * the memo every mounted card re-renders and re-sorts its matches on each one;
 * with it, only the cards that just entered the window do any work. That
 * depends on every prop being stable — `onAdd`, `onJump` and `registerCard` are
 * `useCallback`s in the sheet, and the two collections are memoised there.
 */
function ResultCardImpl({
  paint,
  paintsById,
  activeIds,
  anchored,
  position,
  total,
  onAdd,
  onJump,
  registerCard,
}: ResultCardProps) {
  const inList = activeIds.has(paint.id);
  const equivalents = getTopMatches(paint, paintsById, MAX_EQUIVALENTS, CLOSE_DELTA_MAX);

  return (
    <div
      ref={(node) => registerCard(paint.id, node)}
      className={`${styles.resultCard} ${anchored ? styles.resultCardJumped : ''}`}
      tabIndex={anchored ? -1 : undefined}
      /* The list is windowed, so the DOM holds a handful of a few thousand
       * cards. These two say so, rather than letting a screen reader announce
       * "9 items" for the whole catalogue. */
      role="listitem"
      aria-posinset={position}
      aria-setsize={total}
      data-index={position - 1}
    >
      {/* Paint summary row */}
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
        {inList ? (
          <Badge tone="success">IN LIST</Badge>
        ) : (
          <GoldButton label={`Add ${paint.name} to list`} onClick={() => onAdd(paint)}>
            +
          </GoldButton>
        )}
      </div>

      {/* Equivalents, closest first */}
      <div className={styles.equivalents}>
        <div className={styles.equivLabel}>Equivalent Paints:</div>
        {equivalents.length > 0 ? (
          <div className={styles.equivGrid}>
            {equivalents.map(({ paint: equivalent, delta }) => {
              const style = getDeltaStyle(delta);
              // The same membership fact the card above reports, on the paint
              // the tile stands for.
              const equivInList = activeIds.has(equivalent.id);
              return (
                <button
                  key={equivalent.id}
                  type="button"
                  className={styles.equivCard}
                  onClick={() => onJump(equivalent)}
                  aria-label={
                    `Go to ${equivalent.name} by ${equivalent.brand}` +
                    // The badge is inside the button, so its text is swallowed
                    // by this label unless it is repeated.
                    (equivInList ? ', already in list' : '')
                  }
                >
                  {/* Spans, since a button may only hold phrasing content. */}
                  <span className={styles.equivHead}>
                    <Swatch color={equivalent.hex} size="tile" as="span" />
                    {equivInList && (
                      <Badge as="span" tone="success" compact>
                        IN LIST
                      </Badge>
                    )}
                  </span>
                  <span className={styles.equivName}>{equivalent.name}</span>
                  <span className={styles.equivBrand}>
                    {equivalent.category
                      ? `${equivalent.brand} · ${equivalent.category}`
                      : equivalent.brand}
                  </span>
                  <Badge
                    as="span"
                    block
                    title={getDeltaLabel(delta)}
                    style={{
                      background: style.background,
                      border: `1px solid ${style.border}`,
                      color: style.color,
                    }}
                  >
                    Δ {delta.toFixed(2)}
                  </Badge>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.noEquiv}>No close equivalents catalogued.</div>
        )}
      </div>
    </div>
  );
}

export const ResultCard = memo(ResultCardImpl);
