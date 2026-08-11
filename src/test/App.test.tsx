import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../app/App';
import { useAppStore } from '../app/providers/store';
import { getPaints, resetPaints } from '../domain/paintRepository';

/**
 * The search sheet opens two ways — blank from the FAB, or on one paint from
 * that paint's row — and which one you get is App's state, not the sheet's. So
 * the seam between them can only be tested here: neither component test can see
 * a stale `focusPaintId` surviving a close.
 */

const paint = getPaints()[0];

beforeEach(() => {
  localStorage.clear();
  resetPaints();
  useAppStore.setState({ lists: [], selectedListId: undefined });
  // App refreshes the catalogue on mount; keep the test off the network.
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

  const listId = useAppStore.getState().createList('Ultramarines');
  useAppStore.setState((state) => ({
    lists: state.lists.map((list) =>
      list.id === listId ? { ...list, paintIds: [paint.id] } : list
    ),
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const searchBox = () => screen.getByPlaceholderText('Search by name or brand...');

describe('App search sheet entry points', () => {
  it('opens the catalogue at the paint whose row was tapped', () => {
    render(<App />);

    fireEvent.click(
      screen.getByLabelText(`Show equivalents for ${paint.name} by ${paint.brand}`)
    );

    // The only test that puts the real 2,279-paint catalogue through the sheet,
    // so it is also the end-to-end net for the windowed list: the tapped paint
    // is mounted, its card is anchored, and nothing was searched for.
    expect(searchBox()).toHaveValue('');
    const card = screen
      .getByText(paint.name, { selector: '[class*="paintName"]' })
      .closest('[class*="resultCard"]');
    expect(card?.className).toMatch(/resultCardJumped/);
    expect(screen.getByText(`Found ${getPaints().length} paint(s)`)).toBeInTheDocument();
  });

  it('opens blank from the add button afterwards', () => {
    render(<App />);

    fireEvent.click(
      screen.getByLabelText(`Show equivalents for ${paint.name} by ${paint.brand}`)
    );
    fireEvent.click(screen.getByLabelText('Close search'));
    fireEvent.click(screen.getByLabelText('Add paint'));

    // The focused paint has to be cleared on close, or the FAB keeps re-opening
    // on whatever row was tapped last.
    expect(searchBox()).toHaveValue('');
    expect(screen.getByText('Search the grimoire for a paint...')).toBeInTheDocument();
  });

  it('opens blank from the add button on a fresh app', () => {
    render(<App />);

    fireEvent.click(screen.getByLabelText('Add paint'));

    // A handler wired to a DOM onClick is called with the event; if that event
    // ever reached `openSearch` as a paint id, this is where it would show.
    expect(searchBox()).toHaveValue('');
  });
});
