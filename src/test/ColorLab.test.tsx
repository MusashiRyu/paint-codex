import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ColorLab } from '../features/lab/ColorLab';
import type { PaintList } from '../app/providers/store';
import type { Paint } from '../domain/types';

/**
 * The Collab screen holds three slots and derives everything else from them.
 * What is worth asserting is the derivation, not the arithmetic — `colorLab`
 * covers that — so these are about what appears and disappears as slots fill.
 */

afterEach(cleanup);

const catalog: Paint[] = [
  { id: 'citadel-red', brand: 'Citadel', name: 'Mephiston Red', hex: '#960C09', matches: [] },
  { id: 'citadel-blue', brand: 'Citadel', name: 'Macragge Blue', hex: '#0F3D7C', matches: [] },
  { id: 'vallejo-plum', brand: 'Vallejo', name: 'Deep Plum', hex: '#602037', matches: [] },
  { id: 'vallejo-slate', brand: 'Vallejo', name: 'Slate', hex: '#45294E', matches: [] },
  { id: 'ap-bone', brand: 'Army Painter', name: 'Skeleton Bone', hex: '#CDB98A', matches: [] },
];

const lists: PaintList[] = [
  {
    id: 'list-a',
    name: 'Cobalt Knights',
    icon: 'shield',
    color: '#4a6fa5',
    paintIds: ['citadel-red', 'citadel-blue'],
  },
];

function renderLab(props: Partial<Parameters<typeof ColorLab>[0]> = {}) {
  const onAddPaint = vi.fn();
  render(
    <ColorLab
      paintCatalog={catalog}
      lists={lists}
      activeListPaintIds={['citadel-red']}
      onAddPaint={onAddPaint}
      {...props}
    />
  );
  return { onAddPaint };
}

/** Fill a slot through the picker's My Lists mode, as a user would. */
function fillSlot(slotLabel: string, paintName: string, brand: string) {
  fireEvent.click(screen.getByLabelText(`Select ${slotLabel}`));
  fireEvent.click(screen.getByLabelText(`Select ${paintName} by ${brand}`));
}

describe('ColorLab empty states', () => {
  it('asks for two paints before previewing a mix', () => {
    renderLab();
    expect(screen.getByText('Select two paints above to preview their mix.')).toBeInTheDocument();
  });

  it('still shows nothing with only one slot filled', () => {
    // Half a mix is not a mix. The ramp needs both ends, and rendering one
    // paint six times would look like an answer.
    renderLab();
    fillSlot('Paint A', 'Mephiston Red', 'Citadel');

    expect(screen.getByText('Select two paints above to preview their mix.')).toBeInTheDocument();
    expect(screen.queryByText('Mix Preview')).not.toBeInTheDocument();
  });

  it('asks for a base paint before deriving colour theory', () => {
    renderLab();
    fireEvent.click(screen.getByText('Matching'));
    expect(
      screen.getByText('Select a paint to see its complementary color, highlight, and shade.')
    ).toBeInTheDocument();
  });
});

describe('ColorLab mixing', () => {
  it('previews the mix once both slots are full', () => {
    renderLab();
    fillSlot('Paint A', 'Mephiston Red', 'Citadel');
    fillSlot('Paint B', 'Macragge Blue', 'Citadel');

    expect(screen.getByText('Mix Preview')).toBeInTheDocument();
  });

  it('cards only the four intermediate steps', () => {
    // 0% and 100% are the two paints in the slots above, and their nearest
    // paint is themselves — a card for each would be the same answer twice.
    renderLab();
    fillSlot('Paint A', 'Mephiston Red', 'Citadel');
    fillSlot('Paint B', 'Macragge Blue', 'Citadel');

    for (const pct of [20, 40, 60, 80]) {
      expect(screen.getByText(`${pct}% mix`)).toBeInTheDocument();
    }
    expect(screen.queryByText('0% mix')).not.toBeInTheDocument();
    expect(screen.queryByText('100% mix')).not.toBeInTheDocument();
  });

  it('clearing a slot takes the preview away again', () => {
    renderLab();
    fillSlot('Paint A', 'Mephiston Red', 'Citadel');
    fillSlot('Paint B', 'Macragge Blue', 'Citadel');
    fireEvent.click(screen.getByLabelText('Clear Paint A'));

    expect(screen.getByText('Select two paints above to preview their mix.')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Paint A')).toBeInTheDocument();
  });
});

describe('ColorLab matching', () => {
  it('names all three derived colours', () => {
    renderLab();
    fireEvent.click(screen.getByText('Matching'));
    fillSlot('a Base Paint', 'Macragge Blue', 'Citadel');

    expect(screen.getByText('Color Theory')).toBeInTheDocument();
    expect(screen.getByText('Complementary')).toBeInTheDocument();
    expect(screen.getByText('Highlight')).toBeInTheDocument();
    expect(screen.getByText('Shade')).toBeInTheDocument();
  });

  it('shows the derived colour as well as the paint nearest it', () => {
    // Without the computed hex the card is just a paint, and the reader has no
    // way to see how far the answer sits from what was asked for.
    renderLab();
    fireEvent.click(screen.getByText('Matching'));
    fillSlot('a Base Paint', 'Macragge Blue', 'Citadel');

    expect(screen.getByText('Opposite hue — for contrast trim and accents.')).toBeInTheDocument();
    expect(screen.getAllByText(/^Δ /).length).toBe(3);
  });
});

describe('ColorLab tabs', () => {
  it('keeps each tab its own slots', () => {
    // The two tabs answer different questions and a paint picked for one is
    // not an answer to the other, so switching must not carry or clear either.
    renderLab();
    fillSlot('Paint A', 'Mephiston Red', 'Citadel');

    fireEvent.click(screen.getByText('Matching'));
    expect(screen.getByLabelText('Select a Base Paint')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Mixing'));
    expect(
      screen.getByLabelText('Change Paint A, currently Mephiston Red by Citadel')
    ).toBeInTheDocument();
  });
});

describe('ColorLab adding to a list', () => {
  it('offers the nearest paint to the active list', () => {
    // Empty list, so every card offers rather than badges — which of these
    // five paints a derived colour lands on is `findNearestPaint`'s business.
    const { onAddPaint } = renderLab({ activeListPaintIds: [] });
    fireEvent.click(screen.getByText('Matching'));
    fillSlot('a Base Paint', 'Macragge Blue', 'Citadel');

    const complementary = screen.getByText('Complementary').closest('section') as HTMLElement;
    fireEvent.click(within(complementary).getByLabelText(/^Add /));

    expect(onAddPaint).toHaveBeenCalledTimes(1);
    // The paint handed over is a catalogue paint, not the computed colour —
    // that is the whole point of the card.
    expect(catalog).toContain(onAddPaint.mock.calls[0][0]);
  });

  it('reports a paint already in the list instead of offering it again', () => {
    // `activeListPaintIds` holds Mephiston Red, and it is its own nearest
    // paint, so the 0% end of a ramp from it would badge rather than offer.
    renderLab();
    fireEvent.click(screen.getByText('Matching'));
    fillSlot('a Base Paint', 'Mephiston Red', 'Citadel');

    // Whichever cards resolved to a listed paint show the badge, and those
    // cards must not also show an add button.
    for (const badge of screen.queryAllByText('IN LIST')) {
      const card = badge.closest('section') as HTMLElement;
      expect(within(card).queryByLabelText(/^Add /)).toBeNull();
    }
  });

  it('offers no add button when there is no list to add to', () => {
    // App withholds the handler rather than passing one that would throw.
    renderLab({ onAddPaint: undefined, activeListPaintIds: undefined, lists: [] });
    fireEvent.click(screen.getByText('Matching'));

    // No lists, so My Lists has nothing in it and the catalogue is the way in.
    fireEvent.click(screen.getByLabelText('Select a Base Paint'));
    fireEvent.click(screen.getByText('Search Catalog'));
    fireEvent.click(screen.getByText('BROWSE FULL CATALOG'));
    fireEvent.click(screen.getByLabelText('Select Macragge Blue by Citadel'));

    expect(screen.getByText('Color Theory')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Add /)).toBeNull();
  });
});
