import { useMemo, useState } from 'react';
import type { PaintList } from '../../app/providers/store';
import { getPaintIndex } from '../../domain/paintRepository';
import type { Paint } from '../../domain/types';
import { Pill } from '../../shared/ui/Pill';
import { useBackDismiss } from '../../shared/hooks/useBackDismiss';
import { MatchPanel } from './MatchPanel';
import { MixPanel } from './MixPanel';
import { PaintPickerSheet } from './PaintPickerSheet';
import styles from './ColorLab.module.css';

/** Which slot the picker is filling. */
type SlotName = 'a' | 'b' | 'match';

interface ColorLabProps {
  paintCatalog: Paint[];
  /** Every saved list, for the picker's My Lists mode. */
  lists: PaintList[];
  /** Ids in the active list, for the IN LIST state on each card. */
  activeListPaintIds: string[] | undefined;
  /** Omitted when there is no list to add to. */
  onAddPaint?: (paint: Paint) => void;
}

/**
 * The Collab screen: mix two paints, or derive colour theory from one.
 *
 * Slots hold paint *ids*, not paints, on the same reasoning the store does —
 * the background refresh can replace the catalogue mid-session, and a held
 * `Paint` object would go on showing a colour that had left it. Resolving on
 * every render costs a map lookup.
 */
export function ColorLab({ paintCatalog, lists, activeListPaintIds, onAddPaint }: ColorLabProps) {
  const [tab, setTab] = useState<'mixing' | 'matching'>('mixing');
  const [slotIds, setSlotIds] = useState<Record<SlotName, string | null>>({
    a: null,
    b: null,
    match: null,
  });
  const [picking, setPicking] = useState<SlotName | null>(null);

  // Back gesture closes the picker instead of the app.
  useBackDismiss(picking !== null, () => setPicking(null));

  const paintsById = useMemo(() => getPaintIndex(paintCatalog), [paintCatalog]);
  const activeIds = useMemo(() => new Set(activeListPaintIds ?? []), [activeListPaintIds]);

  const slotPaint = (slot: SlotName): Paint | null => {
    const id = slotIds[slot];
    return id ? (paintsById.get(id) ?? null) : null;
  };

  const fill = (slot: SlotName, paint: Paint) => {
    setSlotIds((prev) => ({ ...prev, [slot]: paint.id }));
    setPicking(null);
  };

  const clear = (slot: SlotName) => setSlotIds((prev) => ({ ...prev, [slot]: null }));

  return (
    <>
      <div className={styles.tabBar}>
        <Pill selected={tab === 'mixing'} onClick={() => setTab('mixing')}>
          Mixing
        </Pill>
        <Pill selected={tab === 'matching'} onClick={() => setTab('matching')}>
          Matching
        </Pill>
      </div>

      <div className={styles.content}>
        {tab === 'mixing' ? (
          <MixPanel
            paintCatalog={paintCatalog}
            a={slotPaint('a')}
            b={slotPaint('b')}
            activeIds={activeIds}
            onPick={setPicking}
            onClear={clear}
            onAddPaint={onAddPaint}
          />
        ) : (
          <MatchPanel
            paintCatalog={paintCatalog}
            base={slotPaint('match')}
            activeIds={activeIds}
            onPick={() => setPicking('match')}
            onClear={() => clear('match')}
            onAddPaint={onAddPaint}
          />
        )}
      </div>

      {picking && (
        <PaintPickerSheet
          paintCatalog={paintCatalog}
          lists={lists}
          onPick={(paint) => fill(picking, paint)}
          onClose={() => setPicking(null)}
        />
      )}
    </>
  );
}
