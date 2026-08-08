import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import App from '../app/App';
import { useAppStore } from '../app/providers/store';
import { getPaints, resetPaints } from '../domain/paintRepository';
import { refreshPaintCatalog } from '../domain/paintCatalogSync';
import { buildCatalogHtml, buildCatalogRows } from './helpers/catalogHtml';

/**
 * The point of the background refresh: paints added upstream appear in a list
 * the user already saved, without the user doing anything.
 */

const NEW_PAINT_NAME = 'Freshly Added Red';
const NEW_PAINT_ID = 'citadel-freshly-added-red';

// A plausible-sized catalogue that also contains the new paint.
const REFRESHED_HTML = buildCatalogHtml([
  ...buildCatalogRows(200),
  {
    name: NEW_PAINT_NAME,
    category: 'Base',
    hex: '#B21807',
    vallejo: { name: 'Gory Red', hex: '#8E1010', delta: 1.5 },
  },
]);

beforeEach(() => {
  localStorage.clear();
  resetPaints();
  useAppStore.setState({ lists: [], selectedListId: undefined });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('live catalogue in the app', () => {
  it('shows a newly published paint in a saved list without a reload', async () => {
    const listId = useAppStore.getState().createList('Blood Angels');
    // The user saved this id earlier; the bundled snapshot has never heard of it.
    useAppStore.setState((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId ? { ...list, paintIds: [NEW_PAINT_ID] } : list
      ),
    }));

    render(<App />);
    expect(screen.queryByText(NEW_PAINT_NAME)).toBeNull();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve(REFRESHED_HTML) })
    );
    await act(async () => {
      await refreshPaintCatalog();
    });

    expect(screen.getByText(NEW_PAINT_NAME)).toBeInTheDocument();
  });

  it('leaves the rendered list alone when the refresh fails', async () => {
    const bundled = getPaints();
    const listId = useAppStore.getState().createList('Blood Angels');
    useAppStore.setState((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId ? { ...list, paintIds: [bundled[0].id] } : list
      ),
    }));

    render(<App />);
    expect(screen.getByText(bundled[0].name)).toBeInTheDocument();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await act(async () => {
      await refreshPaintCatalog();
    });

    expect(screen.getByText(bundled[0].name)).toBeInTheDocument();
  });
});
