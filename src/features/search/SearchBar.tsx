import React, { useState, useEffect } from 'react';
import type { Paint } from '../../domain/types';
import { getAutocompleteSuggestions } from './search';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  paints: Paint[];
  onSearch: (query: string) => void;
  onSelectSuggestion: (paint: Paint) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  paints,
  onSearch,
  onSelectSuggestion,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Paint[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (query.trim()) {
      const results = getAutocompleteSuggestions(paints, query, 8);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, paints]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleSuggestionClick = (paint: Paint) => {
    setQuery(paint.name);
    onSelectSuggestion(paint);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={styles.searchBarContainer}>
      <div className={styles.searchInputWrapper}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search paint by name... (e.g., 'Ceramite White')"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setShowSuggestions(true)}
        />
        {query && (
          <button
            className={styles.clearButton}
            onClick={() => {
              setQuery('');
              onSearch('');
              setSuggestions([]);
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className={styles.suggestionsDropdown}>
          {suggestions.map((paint) => (
            <div
              key={paint.id}
              className={styles.suggestionItem}
              onClick={() => handleSuggestionClick(paint)}
            >
              <div
                className={styles.suggestionColor}
                style={{ backgroundColor: paint.hex }}
                title={paint.hex}
              />
              <div className={styles.suggestionText}>
                <div className={styles.suggestionName}>{paint.name}</div>
                <div className={styles.suggestionBrand}>{paint.brand}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};