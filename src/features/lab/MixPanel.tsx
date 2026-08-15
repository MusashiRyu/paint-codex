import { useMemo } from 'react';
import { mixRamp } from '../../domain/colorLab';
import { findNearestPaint } from '../../domain/paintRepository';
import type { Paint } from '../../domain/types';
import { SectionHeading } from '../../shared/ui/SectionHeading';
import { NearestPaintCard } from './NearestPaintCard';
import { PaintSlot } from './PaintSlot';
import styles from './MixPanel.module.css';

interface MixPanelProps {
  paintCatalog: Paint[];
  a: Paint | null;
  b: Paint | null;
  activeIds: Set<string>;
  onPick: (slot: 'a' | 'b') => void;
  onClear: (slot: 'a' | 'b') => void;
  onAddPaint?: (paint: Paint) => void;
}

/** Both ends of the ramp are the slots above it, so only the middle is news. */
const isEndpoint = (pct: number) => pct === 0 || pct === 100;

export function MixPanel({
  paintCatalog,
  a,
  b,
  activeIds,
  onPick,
  onClear,
  onAddPaint,
}: MixPanelProps) {
  const ramp = useMemo(() => (a && b ? mixRamp(a.hex, b.hex) : []), [a, b]);

  // Four scans of the catalog, and only when both slots are full. Memoized
  // against the ramp so switching tabs does not repeat them.
  const steps = useMemo(
    () =>
      ramp
        .filter((step) => !isEndpoint(step.pct))
        .map((step) => ({ ...step, nearest: findNearestPaint(step.hex, paintCatalog) })),
    [ramp, paintCatalog]
  );

  return (
    <>
      <div className={styles.slots}>
        <PaintSlot
          paint={a}
          label="Paint A"
          variant="stacked"
          onPick={() => onPick('a')}
          onClear={() => onClear('a')}
        />
        <PaintSlot
          paint={b}
          label="Paint B"
          variant="stacked"
          onPick={() => onPick('b')}
          onClear={() => onClear('b')}
        />
      </div>

      {ramp.length === 0 ? (
        <div className={styles.empty}>Select two paints above to preview their mix.</div>
      ) : (
        <>
          <SectionHeading>Mix Preview</SectionHeading>
          <div className={styles.note}>Layered in 20% increments, from Paint A to Paint B.</div>

          {/* The strip carries the percentage and the hex and nothing else —
           * six blocks across a 346px card is 55px each, and a paint name does
           * not fit in 55px. The cards below are where the names go. */}
          <div className={styles.strip}>
            {ramp.map((step) => (
              <div key={step.pct} className={styles.block} style={{ background: step.hex }} />
            ))}
          </div>
          <div className={styles.stripLabels}>
            {ramp.map((step) => (
              <div key={step.pct} className={styles.stripLabel}>
                <div className={styles.pct}>{step.pct}%</div>
                <div className={styles.hex}>{step.hex}</div>
              </div>
            ))}
          </div>

          {steps.map((step) => (
            <NearestPaintCard
              key={step.pct}
              heading={`${step.pct}% mix`}
              hex={step.hex}
              nearest={step.nearest}
              inList={step.nearest ? activeIds.has(step.nearest.paint.id) : false}
              onAdd={onAddPaint}
            />
          ))}
        </>
      )}
    </>
  );
}
