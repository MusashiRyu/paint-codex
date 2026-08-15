import { useCallback, useMemo, useState } from 'react';
import type { Paint } from '../../domain/types';
import { getUniqueBrands } from '../../domain/paintQueries';
import { getBrowseOrder, getPaintIndex } from '../../domain/paintRepository';
import { GhostButton } from '../../shared/ui/GhostButton';
import { Pill } from '../../shared/ui/Pill';
import { TextField } from '../../shared/ui/TextField';
import { ResultCard, type ResultAction } from './ResultCard';
import { searchPaints } from './search';
import { useWindowedList } from './useWindowedList';
import styles from './PaintSearch.module.css';

export interface PaintSearchProps {
  paintCatalog: Paint[];
  /** Ids already in the active list, used for the IN LIST badge. */
  listedPaintIds: string[] | undefined;
  /**
   * Open the catalog at one paint: the whole thing in color order, scrolled
   * to that paint and nothing filtered out, so the colors either side of it
   * are there to scroll through when it has no close equivalent. Omitted or
   * null is the blank search the FAB opens. Read once, at mount; after that the
   * query, the brand filter and the anchor belong to the user.
   */
  focusPaintId?: string | null;
  /** What the gold button does — see `ResultAction`. */
  action?: ResultAction;
  onPick: (paint: Paint) => void;
}

const ALL_BRANDS = 'All';

/**
 * The catalog itself: search field, brand filters, and the windowed results.
 *
 * Deliberately renders no chrome of its own and returns a fragment, so the
 * `flex: 1` on the results list resolves against whichever `Sheet` is holding
 * it. Split out of `SearchSheet` so the Color Lab's paint picker could offer
 * the real search — Fuse ranking, color-ordered browse, windowing over all
 * 2,279 paints — rather than a second, worse one built to look like it.
 */
export function PaintSearch({
  paintCatalog,
  listedPaintIds,
  focusPaintId,
  action = 'add',
  onPick,
}: PaintSearchProps) {
  /*
   * Resolved once, at mount, and deliberately not in an effect: `paintCatalog`
   * changes identity when the background refresh lands, and an effect keyed on
   * it would wipe whatever the user had typed and re-anchor the list away from
   * wherever they had scrolled to. A lazy initialiser, because this scans the
   * catalog.
   */
  const [focusPaint] = useState(() =>
    focusPaintId ? paintCatalog.find((p) => p.id === focusPaintId) : undefined
  );

  /*
   * Opening on a paint is a browse, not a search. The query stays empty and the
   * brand filter stays on All on purpose: narrowing to the paint's own brand
   * hides exactly the cross-brand neighbours the user opened this to see.
   */
  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>(ALL_BRANDS);
  const [browseAll, setBrowseAll] = useState(Boolean(focusPaint));
  /** Where the list is anchored: the ringed card, and where it opens. */
  const [anchorId, setAnchorId] = useState<string | null>(focusPaint?.id ?? null);

  // Derived from the catalog so a new brand in the snapshot needs no code change.
  const brands = useMemo(() => [ALL_BRANDS, ...getUniqueBrands(paintCatalog)], [paintCatalog]);

  const activeIds = useMemo(() => new Set(listedPaintIds ?? []), [listedPaintIds]);

  // An equivalent stores the id of the paint it stands for; this turns it back
  // into the paint. Memoized against the catalog array by the repository.
  const paintsById = useMemo(() => getPaintIndex(paintCatalog), [paintCatalog]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q && !browseAll) return null; // show empty prompt

    // Color order, not catalog order: browsing is for finding what sits near
    // a paint, so the list has to be arranged by what "near" means.
    const ordered = getBrowseOrder(paintCatalog);
    const pool =
      brandFilter === ALL_BRANDS ? ordered : ordered.filter((p) => p.brand === brandFilter);

    // Fuse ranks by relevance, so the pool's color order survives only as the
    // tiebreak between equal scores — which is an improvement on brand order.
    return q ? searchPaints(pool, q) : pool;
  }, [query, brandFilter, browseAll, paintCatalog]);

  const list = useWindowedList(results, paintsById, anchorId);
  const { growAround } = list;

  /*
   * Show what sits around the paint an equivalent stands for.
   *
   * A move, not a search. The old jump wrote the target's name into the search
   * box and its brand into the filter, which answered "show me this paint" —
   * the question here is "show me what is near it", and a query and a brand
   * filter are the two things that can hide the answer.
   *
   * No dependencies, so `ResultCard` stays memoized across a scroll.
   */
  const jumpToMatch = useCallback((target: Paint) => {
    setQuery('');
    setBrandFilter(ALL_BRANDS);
    setBrowseAll(true);
    setAnchorId(target.id);
  }, []);

  const handlePick = useCallback((paint: Paint) => onPick(paint), [onPick]);

  return (
    <>
      <div className={styles.searchField}>
        <TextField
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setAnchorId(null);
          }}
          placeholder="Search by name or brand..."
          /* Not when the sheet opened on a paint: the soft keyboard would cover
           * the colors the user came to compare, and the anchor then moves
           * focus to the card anyway, leaving the keyboard up over nothing. */
          autoFocus={!focusPaint}
        />
      </div>

      {/* Brand filters */}
      <div className={styles.filterRow}>
        {brands.map((b) => (
          <Pill key={b} size="sm" selected={brandFilter === b} onClick={() => setBrandFilter(b)}>
            {b}
          </Pill>
        ))}
      </div>

      {/* Results */}
      <div
        className={styles.results}
        ref={list.scrollerRef}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          // Tab off the edge of the window would wrap to the search box, since
          // the focus trap only sees what is mounted. Widen first — the default
          // action runs in this same task.
          const card = (event.target as HTMLElement).closest<HTMLElement>('[data-index]');
          if (!card) return;
          growAround(Number(card.dataset.index) + (event.shiftKey ? -2 : 2));
        }}
      >
        {results === null && (
          <div className={styles.emptyPrompt}>
            <div className={styles.emptyPromptText}>Search the grimoire for a paint...</div>
            <GhostButton tone="quiet" size="sm" onClick={() => setBrowseAll(true)}>
              BROWSE FULL CATALOG
            </GhostButton>
          </div>
        )}

        {results !== null && (
          <>
            <div className={styles.resultCount}>Found {results.length} paint(s)</div>
            {/* The window: spacers standing in for the cards outside it, and a
             * list role, so a screen reader is told 2,279 rather than the nine
             * that happen to be mounted. Usually one run of cards between two
             * spacers; during an anchor landing there are two runs, so the
             * jump's target stays mounted while the scroller is still en
             * route. The cards are keyed by paint id at this level — not
             * wrapped per-segment — so a segment boundary moving across a card
             * does not remount it. */}
            <div className={styles.window} ref={list.windowRef} role="list">
              {list.segments.flatMap((seg) => [
                <div
                  key={`spacer-${seg.start}`}
                  className={styles.spacer}
                  style={{ height: seg.pad }}
                  aria-hidden="true"
                />,
                ...results.slice(seg.start, seg.end).map((paint, at) => (
                  <ResultCard
                    key={paint.id}
                    paint={paint}
                    paintsById={paintsById}
                    activeIds={activeIds}
                    action={action}
                    anchored={paint.id === anchorId}
                    position={seg.start + at + 1}
                    total={results.length}
                    onAdd={handlePick}
                    onJump={jumpToMatch}
                    registerCard={list.registerCard}
                  />
                )),
              ])}
              <div className={styles.spacer} style={{ height: list.endPad }} aria-hidden="true" />
            </div>
          </>
        )}
      </div>
    </>
  );
}
