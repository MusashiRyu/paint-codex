import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import App from '../app/App';
import bundledPaints from '../data/paints.snapshot.json';
import { useAppStore } from '../app/providers/store';
import { getPaints, resetPaints } from '../domain/paintRepository';
import { PAINT_CATALOG_SOURCES } from '../domain/paintCatalogSource';
import { refreshPaintCatalog } from '../domain/paintCatalogSync';
import { buildBrandDocument, buildCatalogDocumentsOfSize } from './helpers/catalogMarkdown';

/**
 * The point of the background refresh: paints added upstream appear in a list
 * the user already saved, without the user doing anything.
 */

const NEW_PAINT_NAME = 'Freshly Added Red';
const NEW_PAINT_ID = 'citadel-base-freshly-added-red';

/** Enough per brand to clear the per-brand half-the-snapshot floor. */
const PER_BRAND = (() => {
  const counts = new Map<string, number>();
  for (const paint of bundledPaints as { brand: string }[]) {
    counts.set(paint.brand, (counts.get(paint.brand) ?? 0) + 1);
  }
  return Math.ceil(Math.max(...counts.values()) / 2) + 8;
})();

// A plausible-sized catalogue that also contains the new paint.
const REFRESHED = (() => {
  const documents = buildCatalogDocumentsOfSize(PER_BRAND);
  const citadel = documents[0];
  const extra = buildBrandDocument(
    'Citadel',
    [{ name: NEW_PAINT_NAME, set: 'Base', hex: '#B21807' }],
    { withCode: false }
  );
  // Append the extra row to the Citadel table rather than replacing it.
  const row = extra.markdown.split('\n').at(-1)!;
  return [{ ...citadel, markdown: `${citadel.markdown}\n${row}` }, documents[1], documents[2]];
})();

function stubFetch(documents: { markdown: string }[]) {
  const byUrl = new Map(
    PAINT_CATALOG_SOURCES.map((source, index) => [source.url, documents[index].markdown])
  );
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(byUrl.get(url) ?? ''),
      })
    )
  );
}

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

    stubFetch(REFRESHED);
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
