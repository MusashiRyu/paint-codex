import { useMemo, useState } from 'react';
import type { Paint } from '../../domain/types';
import type { PaintList } from '../../app/providers/store';
import { getTopMatches, getUniqueBrands } from '../../domain/paintQueries';
import { CLOSE_DELTA_MAX, getDeltaLabel, getDeltaStyle } from '../../shared/lib/color';
import { useDismissOnEscape } from '../../shared/hooks/useDismissOnEscape';
import { searchPaints } from './search';
import styles from './SearchSheet.module.css';

interface SearchSheetProps {
  paintCatalog: Paint[];
  activeList: PaintList | undefined;
  onAdd: (paint: Paint) => void;
  onClose: () => void;
}

const ALL_BRANDS = 'All';

/** Equivalents shown per paint; the snapshot carries up to 10, most of them distant. */
const MAX_EQUIVALENTS = 6;

export function SearchSheet({ paintCatalog, activeList, onAdd, onClose }: SearchSheetProps) {
  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>(ALL_BRANDS);
  const [browseAll, setBrowseAll] = useState(false);

  useDismissOnEscape(onClose);

  // Derived from the catalogue so a new brand in the snapshot needs no code change.
  const brands = useMemo(
    () => [ALL_BRANDS, ...getUniqueBrands(paintCatalog)],
    [paintCatalog]
  );

  const activeIds = useMemo(
    () => new Set(activeList?.paints.map((p) => p.id) ?? []),
    [activeList]
  );

  const results = useMemo(() => {
    const q = query.trim();
    const pool =
      brandFilter === ALL_BRANDS
        ? paintCatalog
        : paintCatalog.filter((p) => p.brand === brandFilter);

    if (!q && !browseAll) return null; // show empty prompt
    if (!q && browseAll) return pool;
    return searchPaints(pool, q);
  }, [query, brandFilter, browseAll, paintCatalog]);

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        onClick={stopPropagation}
        role="dialog"
        aria-modal="true"
        aria-label="Search paints"
      >
        {/* Sheet header */}
        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitle}>SEARCH PAINTS</div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close search">
            ×
          </button>
        </div>

        {/* Search input */}
        <input
          className={styles.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or brand..."
          autoFocus
        />

        {/* Brand filters */}
        <div className={styles.filterRow}>
          {brands.map((b) => (
            <button
              key={b}
              className={`${styles.filterChip} ${brandFilter === b ? styles.filterChipOn : ''}`}
              onClick={() => setBrandFilter(b)}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className={styles.results}>
          {results === null && (
            <div className={styles.emptyPrompt}>
              <div className={styles.emptyPromptText}>Search the grimoire for a paint...</div>
              <button
                className={styles.browseBtn}
                onClick={() => setBrowseAll(true)}
              >
                BROWSE FULL CATALOG
              </button>
            </div>
          )}

          {results !== null && (
            <>
              <div className={styles.resultCount}>Found {results.length} paint(s)</div>
              {results.map((paint) => {
                const inList = activeIds.has(paint.id);
                const equivalents = getTopMatches(paint, MAX_EQUIVALENTS, CLOSE_DELTA_MAX);
                return (
                  <div key={paint.id} className={styles.resultCard}>
                    {/* Paint summary row */}
                    <div className={styles.paintRow}>
                      <div
                        className={styles.paintSwatch}
                        style={{ background: paint.hex }}
                      />
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
                        <div className={styles.inListBadge}>IN LIST</div>
                      ) : (
                        <button
                          className={styles.addBtn}
                          onClick={() => onAdd(paint)}
                          aria-label={`Add ${paint.name} to list`}
                        >
                          +
                        </button>
                      )}
                    </div>

                    {/* Equivalents, closest first */}
                    <div className={styles.equivalents}>
                      <div className={styles.equivLabel}>Equivalent Paints:</div>
                      {equivalents.length > 0 ? (
                        <div className={styles.equivGrid}>
                          {equivalents.map((match) => {
                            const style = getDeltaStyle(match.delta);
                            return (
                              <div key={`${match.brand}-${match.name}`} className={styles.equivCard}>
                                <div
                                  className={styles.equivSwatch}
                                  style={{ background: match.hex }}
                                />
                                <div className={styles.equivName}>{match.name}</div>
                                <div className={styles.equivBrand}>{match.brand}</div>
                                <div
                                  className={styles.equivPill}
                                  title={getDeltaLabel(match.delta)}
                                  style={{
                                    background: style.background,
                                    border: `1px solid ${style.border}`,
                                    color: style.color,
                                  }}
                                >
                                  Δ {match.delta.toFixed(2)}
                                </div>
                              </div>
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
      </div>
    </div>
  );
}
