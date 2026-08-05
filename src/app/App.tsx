import { useMemo, useState } from 'react';
import type { Paint } from '../domain/types';
import { getPaints } from '../domain/paintRepository';
import { useAppStore } from './providers/store';
import { searchPaints } from '../features/search/search';
import { SearchBar } from '../features/search/SearchBar';
import { BrandFilter } from '../features/browse/BrandFilter';
import { ResultsGrid } from '../features/browse/ResultsGrid';
import { getUniqueBrands } from '../features/browse/browse';
import { ListsPanel } from '../features/lists/ListsPanel';
import { ExportPanel } from '../features/export/ExportPanel';
import { useDarkMode } from '../shared/hooks/useDarkMode';
import { appConfig } from './config';

function App() {
  const [query, setQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>();
  const [selectedPaint, setSelectedPaint] = useState<Paint | undefined>();
  const [listNotice, setListNotice] = useState('');
  const isDarkMode = useDarkMode();

  const {
    lists,
    selectedListId,
    createList,
    renameList,
    deleteList,
    selectList,
    addPaintToList,
    removePaintFromList,
  } = useAppStore();

  const paintList = useMemo(() => getPaints(), []);
  const brands = useMemo(() => getUniqueBrands(paintList), [paintList]);
  const selectedList = useMemo(
    () => lists.find((list) => list.id === selectedListId),
    [lists, selectedListId]
  );

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

  const handleAddToList = (paint: Paint) => {
    if (!selectedListId) {
      setListNotice('Select or create a list before adding paints.');
      return;
    }

    const added = addPaintToList(selectedListId, paint);
    setListNotice(
      added
        ? `Added ${paint.name} to your selected list.`
        : `${paint.name} is already in the selected list.`
    );
  };

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Paco Paint Codex</h1>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <ListsPanel
            lists={lists}
            selectedListId={selectedListId}
            notice={listNotice}
            onCreateList={(name) => {
              createList(name);
              setListNotice(`Created list \"${name}\".`);
            }}
            onSelectList={(listId) => {
              selectList(listId);
              setListNotice('');
            }}
            onRenameList={(listId, name) => renameList(listId, name)}
            onDeleteList={(listId) => {
              deleteList(listId);
              setListNotice('List deleted.');
            }}
            onRemovePaint={(listId, paintId) => {
              removePaintFromList(listId, paintId);
              setListNotice('Paint removed from list.');
            }}
          />

          {appConfig.featureFlags.markdownExport && (
            <ExportPanel selectedList={selectedList} />
          )}

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

          <ResultsGrid paints={results} onAddToList={handleAddToList} />
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