import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import type { Paint } from '../domain/types';
import { getBrowseOrder, getPaintIndex } from '../domain/paintRepository';
import { SearchSheet } from '../features/search/SearchSheet';
import { estimateCardHeight, visibleTileCount } from '../features/search/cardMetrics';
import { WINDOW_BYPASS_BELOW } from '../features/search/useWindowedList';

afterEach(cleanup);

/**
 * The windowed list, over a catalog big enough to need one.
 *
 * jsdom has no layout engine, so every `getBoundingClientRect` is zero and no
 * card is ever measured — which is exactly what makes this testable. Heights
 * stay at their estimates, and `estimateCardHeight` is imported here rather
 * than hardcoded, so these assertions describe the mechanism and not a pixel.
 * `scrollTop` does round-trip in jsdom, so the scroll path is real.
 *
 * What jsdom cannot show — that the anchored card is on screen, that it does
 * not drift once measured, that the extent is right — is asserted in a real
 * browser by `tools/layout/check-layout.mjs`.
 */

const COUNT = 200;

/** A catalog walking the hue wheel, so the browse order is well spread. */
function buildCatalog(count = COUNT): Paint[] {
  const paints: Paint[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / count;
    const [r, g, b] = hslToRgb(hue, 0.7, 0.45);
    paints.push({
      id: `browse-${String(i).padStart(3, '0')}`,
      brand: i % 3 === 0 ? 'Citadel' : i % 3 === 1 ? 'Vallejo' : 'Army Painter',
      name: `Paint ${String(i).padStart(3, '0')}`,
      hex: `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase(),
      category: 'Test',
      matches: [],
    });
  }
  // One paint with an equivalent 40 places away in the finished order, so a
  // tile tap has somewhere to go.
  return paints;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255)) as [number, number, number];
}

const catalog = buildCatalog();
const order = getBrowseOrder(catalog);
const index = getPaintIndex(catalog);

/** Where a card starts, from the same estimates the component uses. */
function offsetOf(position: number): number {
  let acc = 0;
  for (let i = 0; i < position; i++) {
    // 800 is the hook's fallback viewport width, which is what jsdom reports as 0.
    acc += estimateCardHeight(visibleTileCount(order[i], index), 800);
  }
  return acc;
}

function renderBrowse(paints = catalog, focusPaintId?: string) {
  render(
    <SearchSheet
      paintCatalog={paints}
      listedPaintIds={[]}
      focusPaintId={focusPaintId ?? null}
      onAdd={vi.fn()}
      onClose={vi.fn()}
    />
  );
  if (!focusPaintId) fireEvent.click(screen.getByText('BROWSE FULL CATALOG'));
  return {
    scroller: document.querySelector('[class*="results"]') as HTMLDivElement,
    spacers: [...document.querySelectorAll('[class*="spacer"]')] as HTMLDivElement[],
  };
}

const mountedNames = () =>
  screen.queryAllByText(/^Paint /, { selector: '[class*="paintName"]' }).map((el) => el.textContent);

describe('SearchSheet windowed list', () => {
  it('mounts a handful of cards while reporting the whole catalog', () => {
    renderBrowse();

    expect(screen.getByText(`Found ${COUNT} paint(s)`)).toBeInTheDocument();
    expect(mountedNames().length).toBeGreaterThan(0);
    expect(mountedNames().length).toBeLessThan(16);
  });

  it('gives the cards it did not mount to the spacers', () => {
    const { spacers } = renderBrowse();

    const mounted = mountedNames().length;
    const total = offsetOf(COUNT);
    const rendered = offsetOf(mounted);
    const padding = spacers.reduce((sum, el) => sum + parseFloat(el.style.height || '0'), 0);

    // Nothing is lost: what is on screen plus what the spacers stand in for is
    // the whole catalog's height.
    expect(padding + rendered).toBeCloseTo(total, 0);
  });

  it('moves the window as the list is scrolled', () => {
    const { scroller } = renderBrowse();
    const target = order[120];
    expect(mountedNames()).not.toContain(target.name);

    scroller.scrollTop = offsetOf(120);
    fireEvent.scroll(scroller);

    expect(mountedNames()).toContain(target.name);
    expect(mountedNames()).not.toContain(order[0].name);
  });

  it('opens on a paint half-way down and mounts its neighbours', () => {
    const anchor = order[120];
    renderBrowse(catalog, anchor.id);

    const names = mountedNames();
    expect(names).toContain(anchor.name);
    // The colors either side of it are what the user came to scroll through.
    expect(names).toContain(order[119].name);
    expect(names).toContain(order[121].name);
    expect(names).not.toContain(order[0].name);
  });

  it('rings the paint it opened on', () => {
    const anchor = order[120];
    renderBrowse(catalog, anchor.id);

    const card = screen
      .getByText(anchor.name, { selector: '[class*="paintName"]' })
      .closest('[class*="resultCard"]');

    expect(card?.className).toMatch(/resultCardJumped/);
  });

  it('tells assistive tech the size of the list, not the size of the window', () => {
    renderBrowse();

    const [first] = document.querySelectorAll('[role="listitem"]');
    expect(first).toHaveAttribute('aria-setsize', String(COUNT));
    expect(first).toHaveAttribute('aria-posinset', '1');
  });

  it('renders a short list whole, with no spacers to speak of', () => {
    const short = catalog.slice(0, WINDOW_BYPASS_BELOW - 1);
    const { spacers } = renderBrowse(short);

    expect(mountedNames()).toHaveLength(short.length);
    for (const spacer of spacers) expect(spacer.style.height).toBe('0px');
  });
});
