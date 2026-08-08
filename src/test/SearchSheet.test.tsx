import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import type { Paint } from '../domain/types';
import { SearchSheet } from '../features/search/SearchSheet';

afterEach(cleanup);

const catalog: Paint[] = [
  {
    id: 'citadel-mephiston-red',
    brand: 'Citadel',
    name: 'Mephiston Red',
    hex: '#9b0e05',
    category: 'Base Layer',
    // Deliberately unsorted, and one match beyond the close threshold.
    matches: [
      { brand: 'Vallejo', name: 'Mid Red', hex: '#8d1109', delta: 5.4 },
      { brand: 'Army Painter', name: 'Dragon Red', hex: '#9a1b1e', delta: 1.2 },
      { brand: 'Vallejo', name: 'Incubi Darkness', hex: '#094345', delta: 11.76 },
      { brand: 'Vallejo', name: 'Gory Red', hex: '#810504', delta: 3.65 },
    ],
  },
  {
    id: 'scale75-black',
    brand: 'Scale75',
    name: 'Abyssal Black',
    hex: '#101010',
    matches: [{ brand: 'Citadel', name: 'Abaddon Black', hex: '#141414', delta: 20 }],
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

describe('SearchSheet equivalents', () => {
  it('orders equivalents closest first regardless of snapshot order', () => {
    renderSheet();

    const deltas = screen
      .getAllByText(/^Δ /)
      .map((el) => Number(el.textContent!.replace('Δ ', '')));

    const ascending = [...deltas].sort((a, b) => a - b);
    expect(deltas).toEqual(ascending);
    expect(deltas[0]).toBe(1.2);
  });

  it('hides matches at or beyond the close threshold', () => {
    renderSheet();

    expect(screen.queryByText('Δ 11.76')).not.toBeInTheDocument();
    expect(screen.getByText('Δ 5.40')).toBeInTheDocument();
  });

  it('reports paints whose only matches are distant as having none', () => {
    renderSheet();

    expect(screen.getByText('No close equivalents catalogued.')).toBeInTheDocument();
  });

  it('colours each pill from the shared delta thresholds', () => {
    renderSheet();

    // 1.2 is very close, 3.65 and 5.4 are close.
    expect(screen.getByText('Δ 1.20')).toHaveStyle({ background: 'var(--ok-bg)' });
    expect(screen.getByText('Δ 3.65')).toHaveStyle({ background: 'var(--warn-bg)' });
    expect(screen.getByText('Δ 5.40')).toHaveStyle({ background: 'var(--warn-bg)' });
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
