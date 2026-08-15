import type { ResolvedMatch } from '../../domain/paintQueries';
import type { Paint } from '../../domain/types';
import { getDeltaLabel, getDeltaStyle } from '../../shared/lib/color';
import { Badge } from '../../shared/ui/Badge';
import { GoldButton } from '../../shared/ui/GoldButton';
import { PaintSummary } from '../../shared/ui/PaintSummary';
import { SectionHeading } from '../../shared/ui/SectionHeading';
import { Swatch } from '../../shared/ui/Swatch';
import styles from './NearestPaintCard.module.css';

interface NearestPaintCardProps {
  /** Names the computed color — "Complementary", "40%". */
  heading: string;
  /** The computed color itself, which is not a paint and cannot be bought. */
  hex: string;
  /** One line on what the color is for. Omitted on the mix steps. */
  description?: string;
  /** The catalog paint closest to `hex`, from `findNearestPaint`. */
  nearest: ResolvedMatch | null;
  /** Whether that paint is already in the active list. */
  inList: boolean;
  /** Omitted when there is no list to add to; the button then does not render. */
  onAdd?: (paint: Paint) => void;
}

/**
 * A computed color, and the real paint you would reach for instead.
 *
 * The computed swatch and its hex come first because they are the answer to
 * what was asked; the card under them is what makes the answer actionable. The
 * ΔE is shown rather than hidden even when it is large — a derived color has
 * no reason to have a near neighbour, and saying "the closest thing is not very
 * close" is more useful than implying a match.
 */
export function NearestPaintCard({
  heading,
  hex,
  description,
  nearest,
  inList,
  onAdd,
}: NearestPaintCardProps) {
  return (
    <section>
      <SectionHeading>{heading}</SectionHeading>

      <div className={styles.derived}>
        <Swatch color={hex} size="tile" />
        <span className={styles.derivedHex}>{hex}</span>
        {description && <span className={styles.derivedNote}>{description}</span>}
      </div>

      {nearest ? (
        <div className={styles.card}>
          <PaintSummary paint={nearest.paint}>
            <div className={styles.actions}>
              <Badge
                as="span"
                title={getDeltaLabel(nearest.delta)}
                style={{
                  background: getDeltaStyle(nearest.delta).background,
                  border: `1px solid ${getDeltaStyle(nearest.delta).border}`,
                  color: getDeltaStyle(nearest.delta).color,
                }}
              >
                Δ {nearest.delta.toFixed(2)}
              </Badge>
              {inList ? (
                <Badge tone="success">IN LIST</Badge>
              ) : (
                onAdd && (
                  <GoldButton
                    label={`Add ${nearest.paint.name} to list`}
                    onClick={() => onAdd(nearest.paint)}
                  >
                    +
                  </GoldButton>
                )
              )}
            </div>
          </PaintSummary>
        </div>
      ) : (
        <div className={styles.none}>No paint in the catalog to compare.</div>
      )}
    </section>
  );
}
