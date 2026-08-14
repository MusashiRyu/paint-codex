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

/**
 * The app has two screens and no router, so which one is showing is App's
 * state. Everything below is about that seam: what each screen brings with it,
 * and what a Color Lab add does to a list the Lab never shows.
 */

const goToCollab = () => fireEvent.click(screen.getByRole('button', { name: 'Collab' }));

describe('App navigation', () => {
  it('swaps the screen and says which one it is', () => {
    render(<App />);
    expect(screen.getByText('Color Manager')).toBeInTheDocument();

    goToCollab();

    expect(screen.getByText('Color Laboratory')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Paint A')).toBeInTheDocument();
    expect(screen.queryByText('Color Manager')).not.toBeInTheDocument();
  });

  it('leaves the FAB behind on the List screen', () => {
    // The FAB adds a paint to the list being shown, and the Lab shows none —
    // a button that hovered over both would mean two different things.
    render(<App />);
    goToCollab();
    expect(screen.queryByLabelText('Add paint')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.getByLabelText('Add paint')).toBeInTheDocument();
  });
});

describe('App adding from the Color Lab', () => {
  /** Fill the Matching slot with the seeded list's one paint. */
  const seedMatchSlot = () => {
    goToCollab();
    fireEvent.click(screen.getByText('Matching'));
    fireEvent.click(screen.getByLabelText('Select a Base Paint'));
    fireEvent.click(screen.getByLabelText(`Select ${paint.name} by ${paint.brand}`));
  };

  it('names the list it added to', () => {
    // The confirmation has to name the destination: the Lab shows no list, so
    // "Added ✓" alone would not say where the paint went.
    render(<App />);
    seedMatchSlot();

    const add = screen.getAllByLabelText(/^Add /)[0];
    const added = add.getAttribute('aria-label')!.replace(/^Add | to list$/g, '');
    fireEvent.click(add);

    expect(screen.getByText('Added to Ultramarines')).toBeInTheDocument();
    expect(useAppStore.getState().lists[0].paintIds).toContain(
      getPaints().find((p) => p.name === added)?.id
    );
  });

  it('badges the card instead of offering it twice', () => {
    // The offer disappearing is what makes the duplicate case unreachable, and
    // is why `handleLabAdd` ignores what `addPaintToList` returns.
    render(<App />);
    seedMatchSlot();

    const add = screen.getAllByLabelText(/^Add /)[0];
    const name = add.getAttribute('aria-label')!.replace(/^Add | to list$/g, '');
    fireEvent.click(add);

    expect(screen.queryByLabelText(`Add ${name} to list`)).toBeNull();
    expect(screen.getAllByText('IN LIST').length).toBeGreaterThan(0);
  });

  it('withholds the add button entirely when there is no list', () => {
    useAppStore.setState({ lists: [], selectedListId: undefined });
    render(<App />);
    goToCollab();
    fireEvent.click(screen.getByText('Matching'));

    // No lists, so the picker's My Lists mode has nothing in it and the
    // catalogue search is the only way to fill the slot.
    fireEvent.click(screen.getByLabelText('Select a Base Paint'));
    fireEvent.click(screen.getByText('Search Catalog'));
    fireEvent.change(searchBox(), { target: { value: paint.name } });
    // Tapping the card is what picks it. `getAll` because an equivalent tile on
    // some other result may stand for this same paint, and carries the same
    // label — both select it, so either will do.
    fireEvent.click(screen.getAllByLabelText(`Select ${paint.name} by ${paint.brand}`)[0]);

    expect(screen.getByText('Color Theory')).toBeInTheDocument();
    expect(screen.queryByLabelText(/ to list$/)).toBeNull();
  });
});
