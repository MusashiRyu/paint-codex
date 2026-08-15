import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../shared/styles/global.css';
import App from './App';
import { refreshPaintCatalog } from '../domain/paintCatalogSync';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/**
 * Check upstream for catalog changes once per launch.
 *
 * Deliberately outside React: it must run exactly once, and an effect under
 * StrictMode runs twice in development. Queued for idle time so it competes
 * with neither first paint nor the user's first interaction, and left
 * unawaited because nothing in the UI waits on the result.
 */
function scheduleCatalogRefresh(): void {
  const start = () => void refreshPaintCatalog();
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(start, { timeout: 5_000 });
  } else {
    // Safari and older WebViews; a plain deferral is close enough.
    setTimeout(start, 1_000);
  }
}

scheduleCatalogRefresh();
