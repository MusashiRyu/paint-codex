import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PaintPickerSheet } from '../features/lab/PaintPickerSheet';
import type { PaintList } from '../app/providers/store';
import type { Paint } from '../domain/types';

/**
 * The picker's two modes answer different questions, and only one of them is
 * its own code — Search Catalog is `PaintSearch`, the List screen's search.
 * These assert the mode seam and the picking contract; how the search itself
 * behaves is `SearchSheet.test.tsx`'s job and is not repeated here.
 */

afterEach(cleanup);

const catalog: Paint[] = [
  { id: 'citadel-red', brand: 'Citadel', name: 'Mephiston Red', hex: '#960C09', matches: [] },
  { id: 'citadel-blue', brand: 'Citadel', name: 'Macragge Blue', hex: '#0F3D7C', matches: [] },
  { id: 'vallejo-plum', brand: 'Vallejo', name: 'Deep Plum', hex: '#602037', matches: [] },
];

const lists: PaintList[] = [
  {
    id: 'list-a',
    name: 'Cobalt Knights',
    icon: 'shield',
    color: '#4a6fa5',
    paintIds: ['citadel-red', 'citadel-blue'],
  },
  { id: 'list-b', name: 'Rust and Bone', icon: 'skull', color: '#7a8a5a', paintIds: [] },
  // A list holding an id the catalogue no longer has. `resolvePaints` drops it.
  { id: 'list-c', name: 'Retired', icon: 'moon', color: '#c9a86a', paintIds: ['gone-away'] },
];

function renderPicker(overrides: { lists?: PaintList[] } = {}) {
  const onPick = vi.fn();
  const onClose = vi.fn();
  render(
    <PaintPickerSheet
      paintCatalog={catalog}
      lists={overrides.lists ?? lists}
      onPick={onPick}
      onClose={onClose}
    />
  );
  return { onPick, onClose };
}

describe('PaintPickerSheet modes', () => {
  it('opens on My Lists, because that is where the paints you own are', () => {
    renderPicker();
    expect(screen.getByText('Cobalt Knights')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search by name or brand...')).not.toBeInTheDocument();
  });

  it('switches to the catalogue search', () => {
    renderPicker();
    fireEvent.click(screen.getByText('Search Catalog'));
    expect(screen.getByPlaceholderText('Search by name or brand...')).toBeInTheDocument();
  });

  it('lists each saved list under its own heading', () => {
    renderPicker();
    expect(screen.getByLabelText('Select Mephiston Red by Citadel')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Macragge Blue by Citadel')).toBeInTheDocument();
  });

  it('leaves out a list with nothing pickable in it', () => {
    // An empty list is a heading over nothing, and so is one whose paints have
    // all left the catalogue — `resolvePaints` drops those ids rather than
    // rendering rows that cannot be picked.
    renderPicker();
    expect(screen.queryByText('Rust and Bone')).not.toBeInTheDocument();
    expect(screen.queryByText('Retired')).not.toBeInTheDocument();
  });

  it('points at the catalogue when no list has anything in it', () => {
    renderPicker({ lists: [] });
    expect(screen.getByText('No paints saved yet — search the catalogue instead.')).toBeInTheDocument();
  });
});

describe('PaintPickerSheet picking', () => {
  it('hands back the paint a list row names', () => {
    const { onPick } = renderPicker();
    fireEvent.click(screen.getByLabelText('Select Macragge Blue by Citadel'));
    expect(onPick).toHaveBeenCalledWith(catalog[1]);
  });

  it('hands back the paint a search result names', () => {
    const { onPick } = renderPicker();
    fireEvent.click(screen.getByText('Search Catalog'));
    fireEvent.click(screen.getByText('BROWSE FULL CATALOG'));
    fireEvent.click(screen.getByLabelText('Select Deep Plum by Vallejo'));
    expect(onPick).toHaveBeenCalledWith(catalog[2]);
  });

  it('offers every search result, listed or not', () => {
    // The search is mounted with no list, on purpose. Membership is the wrong
    // fact here: a paint already in your list is no less pickable for a slot,
    // and an IN LIST badge where the button should be would look like a
    // control that had been taken away.
    renderPicker();
    fireEvent.click(screen.getByText('Search Catalog'));
    fireEvent.click(screen.getByText('BROWSE FULL CATALOG'));

    expect(screen.queryByText('IN LIST')).not.toBeInTheDocument();
    // Mephiston Red is in Cobalt Knights and is still pickable.
    expect(screen.getByLabelText('Select Mephiston Red by Citadel')).toBeInTheDocument();
  });

  it('says select, not add to list', () => {
    // The same `ResultCard` serves both surfaces; only the accessible name
    // separates "this goes in your list" from "this goes in the slot".
    renderPicker();
    fireEvent.click(screen.getByText('Search Catalog'));
    fireEvent.click(screen.getByText('BROWSE FULL CATALOG'));
    expect(screen.queryByLabelText(/to list$/)).toBeNull();
  });

  it('picks from the card itself, not from a button on it', () => {
    // The whole point of the row being the button. A card full of colour that
    // does nothing when tapped reads as broken on a surface whose entire job
    // is choosing a colour — this was reported from the app, not caught here.
    const { onPick } = renderPicker();
    fireEvent.click(screen.getByText('Search Catalog'));
    fireEvent.click(screen.getByText('BROWSE FULL CATALOG'));

    const row = screen.getByLabelText('Select Deep Plum by Vallejo');
    expect(row.tagName).toBe('BUTTON');
    // And the gold + is gone with it: two adjacent tab stops calling the same
    // handler is noise a screen reader has to walk through.
    expect(screen.queryByText('+')).toBeNull();

    fireEvent.click(row);
    expect(onPick).toHaveBeenCalledWith(catalog[2]);
  });

  it('picks an equivalent tile rather than browsing to it', () => {
    // Jumping the list to a tile is browsing, which is the right verb when
    // filling a list and the wrong one when filling a slot.
    const withEquivalents: Paint[] = [
      { ...catalog[0], matches: [{ id: 'vallejo-plum', delta: 2.4 }] },
      catalog[1],
      catalog[2],
    ];
    const onPick = vi.fn();
    render(
      <PaintPickerSheet
        paintCatalog={withEquivalents}
        lists={[]}
        onPick={onPick}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Search Catalog'));
    fireEvent.click(screen.getByText('BROWSE FULL CATALOG'));

    expect(screen.queryByLabelText(/^Go to /)).toBeNull();
    fireEvent.click(screen.getAllByLabelText('Select Deep Plum by Vallejo')[0]);
    expect(onPick).toHaveBeenCalledWith(withEquivalents[2]);
  });
});
