import { useEffect, useMemo, useRef, useState } from 'react';
import type { Paint } from '../../domain/types';
import {
  getTopMatches,
  getUniqueBrands,
  indexPaintsByName,
  paintNameKey,
} from '../../domain/paintQueries';
import { CLOSE_DELTA_MAX, getDeltaLabel, getDeltaStyle } from '../../shared/lib/color';
import { Badge } from '../../shared/ui/Badge';
import { GhostButton } from '../../shared/ui/GhostButton';
import { GoldButton } from '../../shared/ui/GoldButton';
import { Pill } from '../../shared/ui/Pill';
import { Sheet } from '../../shared/ui/Sheet';
import { Swatch } from '../../shared/ui/Swatch';
import { TextField } from '../../shared/ui/TextField';
import { searchPaints } from './search';
import styles from './SearchSheet.module.css';

interface SearchSheetProps {
  paintCatalog: Paint[];
  /** Ids already in the active list, used for the IN LIST badge. */
  listedPaintIds: string[] | undefined;
  onAdd: (paint: Paint) => void;
  onClose: () => void;
}

const ALL_BRANDS = 'All';

/** Equivalents shown per paint; the snapshot carries up to 10, most of them distant. */
const MAX_EQUIVALENTS = 6;

export function SearchSheet({
  paintCatalog,
  listedPaintIds,
  onAdd,
  onClose,
}: SearchSheetProps) {
  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>(ALL_BRANDS);
  const [browseAll, setBrowseAll] = useState(false);
  // The paint an equivalent was clicked through to, until the user searches again.
  const [jumpTargetId, setJumpTargetId] = useState<string | null>(null);

  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  // Derived from the catalogue so a new brand in the snapshot needs no code change.
  const brands = useMemo(
    () => [ALL_BRANDS, ...getUniqueBrands(paintCatalog)],
    [paintCatalog]
  );

  const activeIds = useMemo(() => new Set(listedPaintIds ?? []), [listedPaintIds]);

  // An equivalent names a paint but carries no id, so jumping to it needs a lookup.
  const paintsByName = useMemo(() => indexPaintsByName(paintCatalog), [paintCatalog]);

  const results = useMemo(() => {
    const q = query.trim();
    const pool =
      brandFilter === ALL_BRANDS
        ? paintCatalog
        : paintCatalog.filter((p) => p.brand === brandFilter);

    if (!q && !browseAll) return null; // show empty prompt
    if (!q && browseAll) return pool;

    const found = searchPaints(pool, q);
    // The jump seeds the query with the target's own name, but fuzzy scoring is
    // not a promise: pin the target rather than land the user on a list without
    // the paint they clicked.
    if (jumpTargetId && !found.some((p) => p.id === jumpTargetId)) {
      const target = paintCatalog.find((p) => p.id === jumpTargetId);
      if (target) return [target, ...found];
    }
    return found;
  }, [query, brandFilter, browseAll, paintCatalog, jumpTargetId]);

  // Scroll the jumped-to card into view and hand it focus, so the next Tab
  // reaches its add button.
  useEffect(() => {
    if (!jumpTargetId) return;
    const card = cardRefs.current.get(jumpTargetId);
    if (!card) return;
    card.focus?.({ preventScroll: true });
    card.scrollIntoView?.({ block: 'start' });
  }, [jumpTargetId, results]);

  /** Show the paint an equivalent stands for, ready to be added on its own row. */
  const jumpToMatch = (brand: string, name: string) => {
    const target = paintsByName.get(paintNameKey(brand, name));
    if (!target) return;
    setQuery(target.name);
    setBrandFilter(target.brand);
    setJumpTargetId(target.id);
  };

  return (
    <Sheet
      title="SEARCH PAINTS"
      label="Search paints"
      closeLabel="Close search"
      size="tall"
      onClose={onClose}
    >
      <div className={styles.searchField}>
        <TextField
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setJumpTargetId(null);
          }}
          placeholder="Search by name or brand..."
          autoFocus
        />
      </div>

      {/* Brand filters */}
      <div className={styles.filterRow}>
        {brands.map((b) => (
          <Pill
            key={b}
            size="sm"
            selected={brandFilter === b}
            onClick={() => {
              setBrandFilter(b);
              setJumpTargetId(null);
            }}
          >
            {b}
          </Pill>
        ))}
      </div>

      {/* Results */}
      <div className={styles.results}>
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
            {results.map((paint) => {
              const inList = activeIds.has(paint.id);
              const equivalents = getTopMatches(paint, MAX_EQUIVALENTS, CLOSE_DELTA_MAX);
              const jumpedTo = paint.id === jumpTargetId;
              return (
                <div
                  key={paint.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(paint.id, el);
                    else cardRefs.current.delete(paint.id);
                  }}
                  className={`${styles.resultCard} ${jumpedTo ? styles.resultCardJumped : ''}`}
                  tabIndex={jumpedTo ? -1 : undefined}
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
                      <GoldButton
                        label={`Add ${paint.name} to list`}
                        onClick={() => onAdd(paint)}
                      >
                        +
                      </GoldButton>
                    )}
                  </div>

                  {/* Equivalents, closest first */}
                  <div className={styles.equivalents}>
                    <div className={styles.equivLabel}>Equivalent Paints:</div>
                    {equivalents.length > 0 ? (
                      <div className={styles.equivGrid}>
                        {equivalents.map((match) => {
                          const style = getDeltaStyle(match.delta);
                          // Only paints the catalogue actually carries can be
                          // jumped to; anything else stays a plain tile.
                          const known = paintsByName.has(
                            paintNameKey(match.brand, match.name)
                          );
                          return (
                            <button
                              key={`${match.brand}-${match.name}`}
                              type="button"
                              className={styles.equivCard}
                              disabled={!known}
                              onClick={() => jumpToMatch(match.brand, match.name)}
                              aria-label={`Go to ${match.name} by ${match.brand}`}
                            >
                              {/* Spans, since a button may only hold phrasing content. */}
                              <Swatch color={match.hex} size="block" as="span" />
                              <span className={styles.equivName}>{match.name}</span>
                              <span className={styles.equivBrand}>{match.brand}</span>
                              <Badge
                                as="span"
                                block
                                title={getDeltaLabel(match.delta)}
                                style={{
                                  background: style.background,
                                  border: `1px solid ${style.border}`,
                                  color: style.color,
                                }}
                              >
                                Δ {match.delta.toFixed(2)}
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
            })}
          </>
        )}
      </div>
    </Sheet>
  );
}
