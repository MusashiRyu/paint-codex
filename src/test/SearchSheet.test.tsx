import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import type { Paint } from '../domain/types';
import { SearchSheet } from '../features/search/SearchSheet';

afterEach(cleanup);

const catalog: Paint[] = [
  {
    id: 'citadel-base-mephiston-red',
    brand: 'Citadel',
    name: 'Mephiston Red',
    hex: '#9b0e05',
    category: 'Base',
    // Deliberately unsorted, and one match beyond the close threshold.
    matches: [
      { id: 'vallejo-game-color-mid-red', delta: 5.4 },
      { id: 'army-painter-warpaints-dragon-red', delta: 1.2 },
      { id: 'vallejo-game-color-incubi-darkness', delta: 11.76 },
      { id: 'vallejo-game-color-gory-red', delta: 3.65 },
    ],
  },
  {
    id: 'vallejo-game-color-mid-red',
    brand: 'Vallejo',
    name: 'Mid Red',
    hex: '#8d1109',
    category: 'Game Color',
    matches: [{ id: 'citadel-base-mephiston-red', delta: 5.4 }],
  },
  {
    id: 'army-painter-warpaints-dragon-red',
    brand: 'Army Painter',
    name: 'Dragon Red',
    hex: '#9a1b1e',
    category: 'Warpaints',
    matches: [{ id: 'citadel-base-mephiston-red', delta: 1.2 }],
  },
  {
    id: 'vallejo-game-color-incubi-darkness',
    brand: 'Vallejo',
    name: 'Incubi Darkness',
    hex: '#094345',
    category: 'Game Color',
    matches: [{ id: 'vallejo-game-color-gory-red', delta: 4.2 }],
  },
  {
    id: 'vallejo-game-color-gory-red',
    brand: 'Vallejo',
    name: 'Gory Red',
    hex: '#810504',
    category: 'Game Color',
    matches: [{ id: 'citadel-base-mephiston-red', delta: 3.65 }],
  },
  {
    id: 'scale75-black-abyssal-black',
    brand: 'Scale75',
    name: 'Abyssal Black',
    hex: '#101010',
    matches: [{ id: 'citadel-base-mephiston-red', delta: 20 }],
  },
];

function renderSheet() {
  const onAdd = vi.fn();
  const onClose = vi.fn();
  render(
    <SearchSheet
      paintCatalog={catalog}
      listedPaintIds={undefined}
      onAdd={onAdd}
      onClose={onClose}
    />
  );
  fireEvent.click(screen.getByText('BROWSE FULL CATALOG'));
  return { onAdd, onClose };
}

/**
 * The result card a paint is rendered in. Every card carries equivalents of
 * its own, so an assertion about one paint's tiles has to be scoped to it or
 * it is really an assertion about the whole catalogue.
 */
const cardFor = (name: string) =>
  // Matched on the card's own heading, not on the name anywhere: a paint's
  // name also appears as an equivalent tile inside every card that lists it.
  screen
    .getByText(name, { selector: '[class*="paintName"]' })
    .closest('[class*="resultCard"]') as HTMLElement;

describe('SearchSheet equivalents', () => {
  it('orders equivalents closest first regardless of snapshot order', () => {
    renderSheet();

    const deltas = within(cardFor('Mephiston Red'))
      .getAllByText(/^Δ /)
      .map((el) => Number(el.textContent!.replace('Δ ', '')));

    expect(deltas).toEqual([1.2, 3.65, 5.4]);
  });

  it('hides matches at or beyond the close threshold', () => {
    renderSheet();
    const card = within(cardFor('Mephiston Red'));

    expect(card.queryByText('Δ 11.76')).not.toBeInTheDocument();
    expect(card.getByText('Δ 5.40')).toBeInTheDocument();
  });

  it('reports paints whose only matches are distant as having none', () => {
    renderSheet();

    expect(
      within(cardFor('Abyssal Black')).getByText('No close equivalents catalogued.')
    ).toBeInTheDocument();
  });

  it('names the range an equivalent belongs to, not just its brand', () => {
    renderSheet();

    // Two paints from one brand can share a name across ranges, so the brand
    // alone no longer says which paint a tile stands for.
    const tile = within(cardFor('Mephiston Red')).getByRole('button', {
      name: 'Go to Gory Red by Vallejo',
    });
    expect(within(tile).getByText('Vallejo · Game Color')).toBeInTheDocument();
  });

  it('marks an equivalent that is already in the list', () => {
    render(
      <SearchSheet
        paintCatalog={catalog}
        listedPaintIds={['vallejo-game-color-gory-red']}
        onAdd={vi.fn()}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('BROWSE FULL CATALOG'));
    const card = within(cardFor('Mephiston Red'));

    // The tile reports membership exactly as the result card above it does...
    const listed = card.getByRole('button', {
      name: 'Go to Gory Red by Vallejo, already in list',
    });
    expect(within(listed).getByText('IN LIST')).toBeInTheDocument();

    // ...and a paint that is not in the list carries no badge.
    const unlisted = card.getByRole('button', { name: 'Go to Mid Red by Vallejo' });
    expect(within(unlisted).queryByText('IN LIST')).not.toBeInTheDocument();
  });

  it('colours each pill from the shared delta thresholds', () => {
    renderSheet();
    const card = within(cardFor('Mephiston Red'));

    // 1.2 is very close, 3.65 and 5.4 are close.
    expect(card.getByText('Δ 1.20')).toHaveStyle({ background: 'var(--ok-bg)' });
    expect(card.getByText('Δ 3.65')).toHaveStyle({ background: 'var(--warn-bg)' });
    expect(card.getByText('Δ 5.40')).toHaveStyle({ background: 'var(--warn-bg)' });
  });
});

/**
 * A catalogue where the equivalents are themselves paints, which is what a
 * jump needs. Dragon Red is deliberately referenced but absent.
 */
const jumpCatalog: Paint[] = [
  {
    id: 'citadel-base-mephiston-red',
    brand: 'Citadel',
    name: 'Mephiston Red',
    hex: '#9b0e05',
    category: 'Base',
    matches: [
      { id: 'vallejo-game-color-gory-red', delta: 3.65 },
      { id: 'army-painter-warpaints-dragon-red', delta: 1.2 },
      // One character, so the fuzzy index cannot find it by its own name.
      { id: 'vallejo-game-color-x', delta: 2.1 },
    ],
  },
  {
    id: 'vallejo-game-color-gory-red',
    brand: 'Vallejo',
    name: 'Gory Red',
    hex: '#810504',
    category: 'Game Color',
    matches: [{ id: 'citadel-base-mephiston-red', delta: 3.65 }],
  },
  {
    id: 'vallejo-game-color-x',
    brand: 'Vallejo',
    name: 'X',
    hex: '#800000',
    category: 'Game Color',
    matches: [{ id: 'citadel-base-mephiston-red', delta: 2.1 }],
  },
];

function renderJumpSheet() {
  const onAdd = vi.fn();
  render(
    <SearchSheet
      paintCatalog={jumpCatalog}
      listedPaintIds={undefined}
      onAdd={onAdd}
      onClose={vi.fn()}
    />
  );
  fireEvent.click(screen.getByText('BROWSE FULL CATALOG'));
  return { onAdd };
}

const searchBox = () => screen.getByPlaceholderText('Search by name or brand...');

describe('SearchSheet equivalent jump', () => {
  it('shows the paint an equivalent names, ready to add', () => {
    const { onAdd } = renderJumpSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Go to Gory Red by Vallejo' }));

    // The clicked equivalent now has a row of its own, with its own add button.
    fireEvent.click(screen.getByLabelText('Add Gory Red to list'));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'vallejo-game-color-gory-red' })
    );
  });

  it('moves the brand filter off one that would hide the clicked paint', () => {
    renderJumpSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Citadel' }));

    fireEvent.click(screen.getByRole('button', { name: 'Go to Gory Red by Vallejo' }));

    // Gory Red is a Vallejo paint; a Citadel filter left in place would hide it.
    expect(screen.getByLabelText('Add Gory Red to list')).toBeInTheDocument();
  });

  it('lands on the clicked paint even when the fuzzy search misses it', () => {
    renderJumpSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Go to X by Vallejo' }));

    expect(screen.getByLabelText('Add X to list')).toBeInTheDocument();
  });

  it('stops pinning the jumped-to paint once the user searches again', () => {
    renderJumpSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Go to X by Vallejo' }));

    fireEvent.change(searchBox(), { target: { value: 'Gory' } });

    expect(screen.queryByLabelText('Add X to list')).not.toBeInTheDocument();
  });

  it('omits an equivalent whose paint has left the catalogue', () => {
    renderJumpSheet();

    // Dragon Red is the closest match Mephiston Red stores, but no paint in
    // this catalogue has that id — a refresh can retire one. Rendering the
    // tile anyway would offer a jump that goes nowhere.
    expect(
      screen.queryByRole('button', { name: 'Go to Dragon Red by Army Painter' })
    ).not.toBeInTheDocument();
    expect(
      within(cardFor('Mephiston Red'))
        .getAllByText(/^Δ /)
        .map((el) => el.textContent)
    ).toEqual(['Δ 2.10', 'Δ 3.65']);
  });
});

describe('SearchSheet brand filter', () => {
  it('derives its chips from the catalogue rather than a hardcoded list', () => {
    renderSheet();

    // Scale75 is absent from the old hardcoded list.
    expect(screen.getByRole('button', { name: 'Scale75' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Citadel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('filters results down to the selected brand', () => {
    renderSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Scale75' }));

    expect(screen.getByText('Found 1 paint(s)')).toBeInTheDocument();
    expect(screen.getByText('Abyssal Black')).toBeInTheDocument();
    expect(screen.queryByText('Mephiston Red')).not.toBeInTheDocument();
  });
});

describe('SearchSheet dismissal', () => {
  it('closes on Escape', () => {
    const { onClose } = renderSheet();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('exposes the sheet as a modal dialog', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByLabelText('Close search')).toBeInTheDocument();
  });
});

describe('SearchSheet focus management', () => {
  it('keeps focus inside the sheet when tabbing off the last control', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog');
    const focusable = [
      ...dialog.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])'),
    ];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('wraps backwards from the first control to the last', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog');
    const focusable = [
      ...dialog.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])'),
    ];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('pulls focus back in if it escapes to the page behind', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    renderSheet();

    outside.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);

    outside.remove();
  });

  it('returns focus to whatever opened it', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(
      <SearchSheet
        paintCatalog={catalog}
        listedPaintIds={undefined}
        onAdd={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(document.activeElement).not.toBe(trigger);

    unmount();
    expect(document.activeElement).toBe(trigger);

    trigger.remove();
  });
});
