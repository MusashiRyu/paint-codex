import { useMemo } from 'react';
import { deriveTheoryColors } from '../../domain/colorLab';
import { findNearestPaint } from '../../domain/paintRepository';
import type { Paint } from '../../domain/types';
import { SectionHeading } from '../../shared/ui/SectionHeading';
import { NearestPaintCard } from './NearestPaintCard';
import { PaintSlot } from './PaintSlot';
import styles from './MatchPanel.module.css';

interface MatchPanelProps {
  paintCatalog: Paint[];
  base: Paint | null;
  activeIds: Set<string>;
  onPick: () => void;
  onClear: () => void;
  onAddPaint?: (paint: Paint) => void;
}

export function MatchPanel({
  paintCatalog,
  base,
  activeIds,
  onPick,
  onClear,
  onAddPaint,
}: MatchPanelProps) {
  const derived = useMemo(() => (base ? deriveTheoryColors(base.hex) : []), [base]);

  const cards = useMemo(
    () => derived.map((color) => ({ ...color, nearest: findNearestPaint(color.hex, paintCatalog) })),
    [derived, paintCatalog]
  );

  return (
    <>
      <div className={styles.slot}>
        <PaintSlot
          paint={base}
          label="a Base Paint"
          variant="row"
          onPick={onPick}
          onClear={onClear}
        />
      </div>

      {cards.length === 0 ? (
        <div className={styles.empty}>
          Select a paint to see its complementary color, highlight, and shade.
        </div>
      ) : (
        <>
          <SectionHeading>Colour Theory</SectionHeading>
          {cards.map((card) => (
            <NearestPaintCard
              key={card.key}
              heading={card.label}
              hex={card.hex}
              description={card.description}
              nearest={card.nearest}
              inList={card.nearest ? activeIds.has(card.nearest.paint.id) : false}
              onAdd={onAddPaint}
            />
          ))}
        </>
      )}
    </>
  );
}
