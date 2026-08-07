import { useMemo, useState } from 'react';
import type { Paint } from '../../domain/types';
import type { PaintList } from '../../app/providers/store';
import { searchPaints } from './search';
import styles from './SearchSheet.module.css';

interface SearchSheetProps {
  paintCatalog: Paint[];
  activeList: PaintList | undefined;
  onAdd: (paint: Paint) => void;
  onClose: () => void;
}

type BrandFilter = 'All' | 'Citadel' | 'Vallejo' | 'Army Painter';

function deltaStyle(delta: number): { bg: string; border: string; color: string } {
  if (delta <= 2) return { bg: 'var(--ok-bg)', border: 'var(--ok-border)', color: 'var(--ok-text)' };
  if (delta <= 4) return { bg: 'var(--warn-bg)', border: 'var(--warn-border)', color: 'var(--warn-text)' };
  return { bg: 'var(--bad-bg)', border: 'var(--bad-border)', color: 'var(--bad-text)' };
}

export function SearchSheet({ paintCatalog, activeList, onAdd, onClose }: SearchSheetProps) {
  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<BrandFilter>('All');
  const [browseAll, setBrowseAll] = useState(false);

  const activeIds = useMemo(
    () => new Set(activeList?.paints.map((p) => p.id) ?? []),
    [activeList]
  );

  const results = useMemo(() => {
    const q = query.trim();
    const pool =
      brandFilter === 'All'
        ? paintCatalog
        : paintCatalog.filter((p) => p.brand === brandFilter);

    if (!q && !browseAll) return null; // show empty prompt
    if (!q && browseAll) return pool;
    return searchPaints(pool, q);
  }, [query, brandFilter, browseAll, paintCatalog]);

  const showEmptyPrompt = results === null;
  const showResults = results !== null;

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const BRANDS: BrandFilter[] = ['All', 'Citadel', 'Vallejo', 'Army Painter'];

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={stopPropagation}>
        {/* Sheet header */}
        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitle}>SEARCH PAINTS</div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
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
          {BRANDS.map((b) => (
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
          {showEmptyPrompt && (
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

          {showResults && (
            <>
              <div className={styles.resultCount}>Found {results!.length} paint(s)</div>
              {results!.map((paint) => {
                const inList = activeIds.has(paint.id);
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

                    {/* Equivalents */}
                    {paint.matches.length > 0 && (
                      <div className={styles.equivalents}>
                        <div className={styles.equivLabel}>Equivalent Paints:</div>
                        <div className={styles.equivGrid}>
                          {paint.matches.map((match) => {
                            const ds = deltaStyle(match.delta);
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
                                  style={{
                                    background: ds.bg,
                                    border: `1px solid ${ds.border}`,
                                    color: ds.color,
                                  }}
                                >
                                  Δ {match.delta.toFixed(2)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {paint.matches.length === 0 && (
                      <div className={styles.equivalents}>
                        <div className={styles.equivLabel}>Equivalent Paints:</div>
                        <div className={styles.noEquiv}>No equivalent paints catalogued.</div>
                      </div>
                    )}
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
