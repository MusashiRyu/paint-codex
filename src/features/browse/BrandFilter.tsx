import React from 'react';
import styles from './BrandFilter.module.css';

interface BrandFilterProps {
  brands: string[];
  selectedBrand: string | undefined;
  onBrandChange: (brand: string | undefined) => void;
}

export const BrandFilter: React.FC<BrandFilterProps> = ({
  brands,
  selectedBrand,
  onBrandChange,
}) => {
  return (
    <div className={styles.brandFilter}>
      <label className={styles.filterLabel}>Filter by Brand:</label>
      <div className={styles.brandOptions}>
        <button
          className={`${styles.brandButton} ${!selectedBrand ? styles.active : ''} ${!selectedBrand ? 'active' : ''}`}
          onClick={() => onBrandChange(undefined)}
        >
          All Brands
        </button>
        {brands.map((brand) => (
          <button
            key={brand}
            className={`${styles.brandButton} ${selectedBrand === brand ? styles.active : ''} ${selectedBrand === brand ? 'active' : ''}`}
            onClick={() => onBrandChange(brand)}
          >
            {brand}
          </button>
        ))}
      </div>
    </div>
  );
};