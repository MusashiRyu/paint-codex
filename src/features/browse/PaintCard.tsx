import React from 'react';
import type { Match, Paint } from '../../domain/types';
import { getDeltaColorClass, getDeltaLabel } from '../../shared/lib/color';
import styles from './PaintCard.module.css';

interface PaintCardProps {
  paint: Paint;
  onAddToList?: (paint: Paint) => void;
}

export const PaintCard: React.FC<PaintCardProps> = ({ paint, onAddToList }) => {
  return (
    <div className={styles.paintCard}>
      <div className={styles.paintCardHeader}>
        <div className={styles.paintInfo}>
          <div className={styles.paintSwatch} style={{ backgroundColor: paint.hex }} />
          <div className={styles.paintDetails}>
            <h3 className={styles.paintName}>{paint.name}</h3>
            <p className={styles.paintBrand}>{paint.brand}</p>
            {paint.category && <p className={styles.paintCategory}>{paint.category}</p>}
            <p className={styles.paintHex}>{paint.hex}</p>
          </div>
        </div>
        {onAddToList && (
          <button
            className={styles.addToListBtn}
            onClick={() => onAddToList(paint)}
            title="Add this paint to a list"
          >
            +
          </button>
        )}
      </div>

      <div className={styles.paintMatches}>
        <h4 className={styles.matchesTitle}>Equivalent Paints:</h4>
        <div className={styles.matchesGrid}>
          {paint.matches.map((match, index) => (
            <MatchItem key={index} match={match} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface MatchItemProps {
  match: Match;
}

const MatchItem: React.FC<MatchItemProps> = ({ match }) => {
  const deltaClass = getDeltaColorClass(match.delta);
  const deltaLabel = getDeltaLabel(match.delta);

  return (
    <div className={styles.matchItem}>
      <div className={styles.matchSwatch} style={{ backgroundColor: match.hex }} />
      <div className={styles.matchInfo}>
        <p className={styles.matchName}>{match.name}</p>
        <p className={styles.matchBrand}>{match.brand}</p>
      </div>
      <div className={`${styles.deltaBadge} ${styles[deltaClass]} ${deltaClass}`} title={deltaLabel}>
        Δ {match.delta.toFixed(2)}
      </div>
    </div>
  );
};