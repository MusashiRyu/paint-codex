import { useMemo, useState } from 'react';
import type { PaintList } from '../../app/providers/store';
import { resolvePaints } from '../../domain/paintRepository';
import type { Paint } from '../../domain/types';
import { PaintSearch } from '../search/PaintSearch';
import { Pill } from '../../shared/ui/Pill';
import { SectionHeading } from '../../shared/ui/SectionHeading';
import { Sheet } from '../../shared/ui/Sheet';
import { Swatch } from '../../shared/ui/Swatch';
import styles from './PaintPickerSheet.module.css';

interface PaintPickerSheetProps {
  paintCatalog: Paint[];
  lists: PaintList[];
  onPick: (paint: Paint) => void;
  onClose: () => void;
}

/**
 * Choosing a paint for a Color Lab slot.
 *
 * Two ways in, because they answer different questions. **My Lists** is for a
 * paint you own, which is most of them — you are mixing what is on the desk.
 * **Search Catalog** is the List screen's own search, `PaintSearch` itself
 * rather than a lookalike, so the Lab gets Fuse ranking, the color-ordered
 * browse and windowing over all 2,279 paints for free, and gets them again
 * whenever that search improves.
 *
 * The search is mounted with no `listedPaintIds`, so every card offers its
 * button instead of an IN LIST badge. Membership is the wrong fact here: the
 * question is which paint goes in the slot, and a paint already in your list is
 * no less pickable for it.
 */
export function PaintPickerSheet({
  paintCatalog,
  lists,
  onPick,
  onClose,
}: PaintPickerSheetProps) {
  const [mode, setMode] = useState<'lists' | 'search'>('lists');

  // Resolved rather than stored: a list holds ids, and one whose paint has left
  // the catalog must not render as a blank row you can pick.
  const sections = useMemo(
    () =>
      lists
        .map((list) => ({ id: list.id, name: list.name, paints: resolvePaints(list.paintIds, paintCatalog) }))
        .filter((section) => section.paints.length > 0),
    [lists, paintCatalog]
  );

  return (
    <Sheet
      title="SELECT PAINT"
      label="Select a paint"
      closeLabel="Close paint picker"
      size="tall"
      onClose={onClose}
    >
      <div className={styles.modes}>
        <Pill selected={mode === 'lists'} onClick={() => setMode('lists')}>
          My Lists
        </Pill>
        <Pill selected={mode === 'search'} onClick={() => setMode('search')}>
          Search Catalog
        </Pill>
      </div>

      {mode === 'search' ? (
        <PaintSearch
          paintCatalog={paintCatalog}
          listedPaintIds={undefined}
          action="select"
          onPick={onPick}
        />
      ) : (
        <div className={styles.lists}>
          {sections.length === 0 ? (
            <div className={styles.empty}>
              No paints saved yet — search the catalog instead.
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.id}>
                <SectionHeading>{section.name}</SectionHeading>
                {section.paints.map((paint) => (
                  <button
                    key={paint.id}
                    type="button"
                    className={styles.row}
                    onClick={() => onPick(paint)}
                    aria-label={`Select ${paint.name} by ${paint.brand}`}
                  >
                    <Swatch color={paint.hex} size="tile" as="span" />
                    <span className={styles.info}>
                      <span className={styles.rowName}>{paint.name}</span>
                      <span className={styles.rowBrand}>{paint.brand}</span>
                    </span>
                    <span className={styles.hex}>{paint.hex}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </Sheet>
  );
}
