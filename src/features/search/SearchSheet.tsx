import type { Paint } from '../../domain/types';
import { Sheet } from '../../shared/ui/Sheet';
import { PaintSearch } from './PaintSearch';

interface SearchSheetProps {
  paintCatalog: Paint[];
  /** Ids already in the active list, used for the IN LIST badge. */
  listedPaintIds: string[] | undefined;
  /**
   * Open the catalog at one paint. See `PaintSearch` — the anchoring, and the
   * reasons it is read once at mount, live there.
   */
  focusPaintId?: string | null;
  onAdd: (paint: Paint) => void;
  onClose: () => void;
}

/**
 * The List screen's catalog search: `PaintSearch` in a sheet.
 *
 * Everything that makes the search work moved to `PaintSearch` so the Color
 * Lab's picker could hold the same component under a different header. What is
 * left here is the chrome and the one word that differs — this sheet adds a
 * paint to a list, the picker's returns one to a slot.
 */
export function SearchSheet({
  paintCatalog,
  listedPaintIds,
  focusPaintId,
  onAdd,
  onClose,
}: SearchSheetProps) {
  return (
    <Sheet
      title="SEARCH PAINTS"
      label="Search paints"
      closeLabel="Close search"
      size="tall"
      onClose={onClose}
    >
      <PaintSearch
        paintCatalog={paintCatalog}
        listedPaintIds={listedPaintIds}
        focusPaintId={focusPaintId}
        action="add"
        onPick={onAdd}
      />
    </Sheet>
  );
}
