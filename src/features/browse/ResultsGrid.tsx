import React from 'react';
import type { Paint } from '../../domain/types';
import { PaintCard } from './PaintCard';
import styles from './ResultsGrid.module.css';

interface ResultsGridProps {
  paints: Paint[];
  isLoading?: boolean;
  onAddToList?: (paint: Paint) => void;
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({
  paints,
  isLoading = false,
  onAddToList,
}) => {
  if (isLoading) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.loading}>Loading paints...</div>
      </div>
    );
  }

  if (paints.length === 0) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.noResults}>
          <p>No paints found. Try a different search.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.resultsContainer}>
      <div className={styles.resultsHeader}>
        <p className={styles.resultsCount}>Found {paints.length} paint(s)</p>
      </div>
      <div className={styles.resultsGrid}>
        {paints.map((paint) => (
          <PaintCard
            key={paint.id}
            paint={paint}
            onAddToList={onAddToList}
          />
        ))}
      </div>
    </div>
  );
};