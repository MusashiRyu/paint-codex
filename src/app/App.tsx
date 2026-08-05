import { useMemo, useState } from 'react';
import type { Paint } from '../domain/types';
import { getPaints } from '../domain/paintRepository';
import { searchPaints } from '../features/search/search';
import { SearchBar } from '../features/search/SearchBar';
import { BrandFilter } from '../features/browse/BrandFilter';
import { ResultsGrid } from '../features/browse/ResultsGrid';
import { getUniqueBrands } from '../features/browse/browse';
import { useDarkMode } from '../shared/hooks/useDarkMode';

function App() {
  const [query, setQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>();
  const [selectedPaint, setSelectedPaint] = useState<Paint | undefined>();
  const isDarkMode = useDarkMode();

  const paintList = useMemo(() => getPaints(), []);
  const brands = useMemo(() => getUniqueBrands(paintList), [paintList]);

  const results = useMemo(() => {
    if (selectedPaint) {
      return [selectedPaint];
    }
    return searchPaints(paintList, query, selectedBrand);
  }, [query, selectedBrand, selectedPaint, paintList]);

  const handleSearch = (q: string) => {
    setQuery(q);
    setSelectedPaint(undefined);
  };

  const handleSelectSuggestion = (paint: Paint) => {
    setSelectedPaint(paint);
    setQuery(paint.name);
  };

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🎨 Paint Converter</h1>
          <p className="app-subtitle">
            Find equivalent miniature paints across brands
          </p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <SearchBar
            paints={paintList}
            onSearch={handleSearch}
            onSelectSuggestion={handleSelectSuggestion}
          />

          <BrandFilter
            brands={brands}
            selectedBrand={selectedBrand}
            onBrandChange={setSelectedBrand}
          />

          <ResultsGrid paints={results} />
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>
            Paint data sourced from{' '}
            <a
              href="https://redgrimm.github.io/paint-conversion/"
              target="_blank"
              rel="noopener noreferrer"
            >
              redgrimm.github.io
            </a>
          </p>
          <p>
            Paint availability from{' '}
            <a
              href="https://www.vliegeruit.com/paint/"
              target="_blank"
              rel="noopener noreferrer"
            >
              vliegeruit.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;