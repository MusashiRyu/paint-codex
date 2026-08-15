import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { Paint } from '../../domain/types';
import { ANCHOR_GAP, CARD_METRICS, estimateCardHeight, visibleTileCount } from './cardMetrics';

/**
 * Mount only the cards on screen, and keep the scroll honest about the rest.
 *
 * The search sheet browses the whole catalog — 2,279 paints, ~37 DOM elements
 * and a match lookup each. Rendered whole that is ~84,000 elements and 8,722
 * focusable buttons, which the focus trap re-queries on every Tab. So the list
 * renders a window of about nine cards and two spacer divs whose heights stand
 * in for everything above and below.
 *
 * Hand-rolled rather than a library: both store listings answer their privacy
 * forms with "four runtime dependencies", so a fifth is a form to re-answer
 * rather than a line in package.json.
 */

/** Cards kept mounted either side of the visible range. */
const OVERSCAN = 3;

/**
 * Below this many results, render everything and let both spacers be 0.
 *
 * A short list is not what this exists for, and a window over one costs more
 * than it saves: measurement, spacers, and a scroll listener for a page that
 * does not scroll. It also keeps every small-fixture test rendering exactly as
 * it did before there was a window.
 */
export const WINDOW_BYPASS_BELOW = 24;

/** Viewport to assume before the scroller has been laid out — and under jsdom. */
const FALLBACK_VIEWPORT = 800;

/**
 * Landings to attempt before settling for wherever the anchor scroll got to.
 *
 * Writing `scrollTop` is a request, not a result: the engine clamps it to the
 * scroll extent it currently believes in, and on a scroller nearly a million
 * pixels tall that belief can lag the spacers already in the DOM. Each retry
 * costs one commit, and the range is taken to wherever the scroll actually
 * landed either way, so a run of failures is slightly-wrong rather than blank.
 */
const ANCHOR_TRIES = 3;

export interface WindowedList {
  /** The scroll container. */
  scrollerRef: (node: HTMLDivElement | null) => void;
  /** Wrapper around the cards, so the header above them can be measured out. */
  windowRef: (node: HTMLDivElement | null) => void;
  /** First and last+1 index to render. */
  start: number;
  end: number;
  /** Spacer heights, in px, standing in for the cards outside the window. */
  topPad: number;
  bottomPad: number;
  /** Called with each card's node as it mounts and unmounts. */
  registerCard: (id: string, node: HTMLDivElement | null) => void;
  /** Widen the window toward `index`, for keyboard focus leaving its edge. */
  growAround: (index: number) => void;
}

export function useWindowedList(
  items: Paint[] | null,
  paintsById: Map<string, Paint>,
  anchorId: string | null
): WindowedList {
  const scroller = useRef<HTMLDivElement | null>(null);
  const windowEl = useRef<HTMLDivElement | null>(null);
  const cards = useRef(new Map<string, HTMLDivElement>());

  /** Measured card pitches, keyed by paint id — not by index, so the order can change. */
  const heights = useRef(new Map<string, number>());
  /** Prefix sum of pitches: offsets[i] is where card i starts. */
  const offsets = useRef<Float64Array>(new Float64Array(1));
  /** Scroller width the heights were measured at; a change invalidates all of them. */
  const measuredWidth = useRef(0);
  /** Distance from the top of the scroller's content to the first card. */
  const headerOffset = useRef(0);
  /** Bumped when a measurement moves, to rebuild offsets and re-render spacers. */
  const [version, setVersion] = useState(0);
  /**
   * Bumps asked for, against `version` bumps that have rendered.
   *
   * The two differ for exactly as long as a re-render is outstanding, and that
   * window is where anchoring goes wrong: the spacers in the DOM still have the
   * old heights, so the anchor card's measured position is the old one. React
   * may run a layout effect more than once before that re-render lands — it
   * does so on every commit under StrictMode — so "did this pass change
   * anything" is not the same question as "is the DOM up to date".
   */
  const requestedVersion = useRef(0);
  const bumpVersion = useCallback(() => {
    requestedVersion.current += 1;
    setVersion((v) => v + 1);
  }, []);
  /**
   * An id to bring to the top once its card is mounted. Seeded with the anchor
   * the sheet opened on: the basis check below only fires when the list or the
   * anchor *changes*, and the first render is not a change.
   */
  const pendingScrollId = useRef<string | null>(anchorId);
  /** Landings left to attempt for `pendingScrollId`; see the anchor block. */
  const scrollTries = useRef(ANCHOR_TRIES);
  /**
   * The same id again, tracked apart because moving focus is not a geometric
   * operation. The scroll has to wait for the card to have a box; focus does
   * not, and holding it back until the scroll succeeds would mean a keyboard or
   * a screen reader lands on a sheet that merely happens to be near the paint.
   */
  const pendingFocusId = useRef<string | null>(anchorId);

  const list = items ?? [];
  const windowed = list.length >= WINDOW_BYPASS_BELOW;

  const anchorIndex = anchorId ? list.findIndex((paint) => paint.id === anchorId) : -1;

  const [range, setRange] = useState(() => initialRange(list.length, anchorIndex, windowed));

  const builtFor = useRef<Paint[] | null>(null);
  const builtVersion = useRef(-1);

  /**
   * A card's pitch: measured if it has ever been on screen, estimated if not.
   *
   * Memoized on `paintsById` alone — everything else it reads is a ref — so the
   * layout effect below can depend on it without re-running on every render.
   */
  const heightOf = useCallback(
    (paint: Paint): number => {
      const measured = heights.current.get(paint.id);
      if (measured !== undefined) return measured;
      return estimateCardHeight(
        visibleTileCount(paint, paintsById),
        measuredWidth.current || FALLBACK_VIEWPORT
      );
    },
    [paintsById]
  );

  // Rebuilt during render, not in an effect: the spacers this feeds are part of
  // the same output, and an effect would paint one frame of wrong heights.
  if (builtFor.current !== items || builtVersion.current !== version) {
    const next = new Float64Array(list.length + 1);
    let acc = 0;
    for (let i = 0; i < list.length; i++) {
      next[i] = acc;
      acc += heightOf(list[i]);
    }
    next[list.length] = acc;
    offsets.current = next;
    builtFor.current = items;
    builtVersion.current = version;
  }

  /** The index whose card contains `y`, by binary search over the prefix sums. */
  const indexAt = useCallback((y: number) => {
    const at = offsets.current;
    let low = 0;
    let high = at.length - 1;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (at[mid + 1] <= y) low = mid + 1;
      else high = mid;
    }
    return low;
  }, []);

  const rangeFor = useCallback(
    (scrollTop: number, viewport: number) => {
      if (!windowed) return { start: 0, end: list.length };
      const top = Math.max(0, scrollTop - headerOffset.current);
      return {
        start: Math.max(0, indexAt(top) - OVERSCAN),
        end: Math.min(list.length, indexAt(top + viewport) + 1 + OVERSCAN),
      };
    },
    [indexAt, list.length, windowed]
  );

  /**
   * Mount the cards the scroller is actually looking at.
   *
   * The one rule this list cannot break: wherever the scroll ends up, the
   * window has to cover it. Moving the window never moves content — the top
   * spacer is `offsets[start]`, so every card keeps its absolute position no
   * matter which of them happen to be mounted — so this is always safe to call
   * and there is never a reason not to.
   */
  const syncRange = useCallback(
    (el: HTMLDivElement) => {
      const next = rangeFor(el.scrollTop, el.clientHeight || FALLBACK_VIEWPORT);
      setRange((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    },
    [rangeFor]
  );

  // A new list, or a new anchor, starts the window over — offsets measured
  // against one list mean nothing against another. Render-phase, per React's
  // documented "adjusting state when props change", so no wrong frame paints.
  const basis = useRef({ items, anchorIndex });
  if (basis.current.items !== items || basis.current.anchorIndex !== anchorIndex) {
    basis.current = { items, anchorIndex };
    setRange(initialRange(list.length, anchorIndex, windowed));
    if (anchorIndex >= 0) {
      pendingScrollId.current = anchorId;
      pendingFocusId.current = anchorId;
      scrollTries.current = ANCHOR_TRIES;
    } else if (scroller.current) scroller.current.scrollTop = 0;
  }

  /*
   * Measure whatever is mounted, then hold the view still.
   *
   * Runs after every commit, before paint. Measuring card i only moves the
   * offsets *after* i, so scrolling down needs no correction at all — those
   * cards were measured on the way past. Scrolling up into cards nobody has
   * seen is the case that moves the ground, so the index at the top of the
   * viewport is noted first and put back afterwards.
   */
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const scrollerBox = el.getBoundingClientRect();

    const width = el.clientWidth;
    let resized = false;
    if (width && width !== measuredWidth.current) {
      // A different width can mean a different column count, so every
      // measurement taken at the old one is void — not just the mounted ones,
      // and not just the measurements: the estimates change too.
      measuredWidth.current = width;
      heights.current.clear();
      resized = true;
      bumpVersion();
    }

    if (windowEl.current) {
      // Geometry rather than `offsetTop`: the cards, the window and the
      // scroller do not share an offsetParent, and mixing them silently
      // measures against the sheet instead of against the list.
      headerOffset.current =
        windowEl.current.getBoundingClientRect().top - scrollerBox.top + el.scrollTop;
    }

    const before = el.scrollTop;
    const topIndex = indexAt(Math.max(0, before - headerOffset.current));
    const into = Math.max(0, before - headerOffset.current - offsets.current[topIndex]);

    let changed = false;
    for (const [id, node] of cards.current) {
      const height = node.getBoundingClientRect().height + CARD_METRICS.margin;
      // jsdom reports 0 for every rect, and an element mid-layout can too.
      // Either way that is not a measurement.
      if (height <= CARD_METRICS.margin) continue;
      if (Math.abs((heights.current.get(id) ?? -1) - height) > 0.5) {
        heights.current.set(id, height);
        changed = true;
      }
    }

    if (changed) {
      bumpVersion();
      /*
       * Hold the view still, against what this pass just measured.
       *
       * The offsets rebuild on the next render, so the corrected position has
       * to be summed from `heights` directly. Reading it back out of
       * `offsets.current` — which is what this did — makes `after` equal
       * `before` by construction, because that same stale array produced
       * `topIndex` and `into` a few lines above. The correction was a no-op for
       * as long as it existed, and scrolling up into cards nobody had measured
       * moved the ground under the finger by however much their estimates were
       * out.
       */
      const rows = items ?? [];
      let topOffset = 0;
      for (let i = 0; i < topIndex; i++) topOffset += heightOf(rows[i]);
      const after = topOffset + into + headerOffset.current;
      if (Math.abs(after - before) > 0.5) el.scrollTop = after;
    }

    /*
     * Bring the anchor to the top — but only once the spacers in the DOM are
     * the ones the current measurements imply.
     *
     * Two separate things have to be true, and the difference cost a debugging
     * session. "This pass measured nothing new" is not enough: React can run
     * this effect again before the re-render that a previous pass asked for,
     * and does exactly that on every commit in development. That second pass
     * sees stable measurements and a stale DOM, scrolls to where the card was
     * before the spacers grew, and leaves the user looking at blank space
     * 92,000px from anything — which is what happened, in dev only, after the
     * production build had been verified clean.
     *
     * So the id also stays pending while a version bump is outstanding.
     */
    const settled = requestedVersion.current === version;
    const pending = pendingScrollId.current;
    if (pending && settled && !changed && !resized) {
      const card = cards.current.get(pending);
      if (card && pendingFocusId.current === pending) {
        pendingFocusId.current = null;
        card.focus?.({ preventScroll: true });
      }

      const box = card?.getBoundingClientRect();
      // A card with no box has not been laid out yet, and under jsdom never
      // will be. Scrolling to it would be scrolling to zero, so wait instead.
      if (card && box && box.height > 0) {
        // Geometric, so it holds whatever the offsetParent chain looks like and
        // wherever the list is already scrolled to. Short of the top by the
        // width of the ring the anchored card wears, which is drawn outside its
        // border box and would otherwise be cut off.
        const want = el.scrollTop + (box.top - scrollerBox.top - ANCHOR_GAP);
        el.scrollTop = want;

        /*
         * Did it land?
         *
         * This used to assume so, and that assumption is the bug behind an
         * empty sheet on iOS: the browse list is nearly a million pixels tall,
         * WebKit clamps a jump into it against a scroll extent it has not
         * finished laying out, and the scroller stops short of the card. The
         * window mounted around the anchor is then nowhere near the viewport,
         * which is left inside a spacer — a blank screen, until a finger
         * scrolls and the range is finally derived from a real position.
         *
         * Reading `scrollTop` back says so immediately: the scroll *position*
         * updates synchronously on assignment, only the event is deferred. So
         * a short landing is retried on the next commit, by which time layout
         * has usually caught up, and then settled for either way.
         */
        const landed = Math.abs(el.scrollTop - want) <= 1;
        if (landed || --scrollTries.current <= 0) pendingScrollId.current = null;
        else bumpVersion();
        // Whatever happened above, mount what the scroller is now looking at.
        syncRange(el);
      }
    }
    // Every commit that can change a card's height is in this list: a new list,
    // cards entering or leaving the window, and a re-measure. It converges,
    // because a pass that moves nothing does not bump the version.
  }, [bumpVersion, heightOf, indexAt, items, range.start, range.end, syncRange, version]);

  // Rotation changes the column count and so every card's height, and React has
  // no reason to re-render for it. Width only: the Android soft keyboard
  // changes the height, and re-measuring for that would be a waste.
  useLayoutEffect(() => {
    const onResize = () => {
      const width = scroller.current?.clientWidth ?? 0;
      if (width && width !== measuredWidth.current) bumpVersion();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [bumpVersion]);

  /*
   * Plain listener rather than React's onScroll, so `passive` is explicit and a
   * test's fireEvent.scroll hits the same path a finger does.
   *
   * Every scroll counts, including the ones this hook causes. There used to be
   * a flag here that swallowed the next event after a programmatic write, on
   * the reasoning that the hook already knew where it had put the scroller —
   * but it only knew where it had *asked* for it to be, and swallowing the
   * event threw away the one correction that would have caught the difference.
   * The flag was also a latch: a write that moved nothing produced no event to
   * clear it, and the next real scroll was eaten instead.
   */
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !windowed) return;
    const onScroll = () => syncRange(el);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [syncRange, windowed]);

  const registerCard = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) cards.current.set(id, node);
    else cards.current.delete(id);
  }, []);

  /*
   * Tab is why this exists. The focus trap wraps at the last focusable element
   * in the dialog, which under a window is the last one *mounted* — so tabbing
   * off the edge of the window would wrap to the search box instead of walking
   * into the next card. The default action runs in this same task, so the
   * window has to widen synchronously; a scroll-driven grow lands too late.
   */
  const growAround = useCallback(
    (index: number) => {
      setRange((prev) => {
        const start = Math.max(0, Math.min(prev.start, index - OVERSCAN));
        const end = Math.min(list.length, Math.max(prev.end, index + OVERSCAN + 1));
        return start === prev.start && end === prev.end ? prev : { start, end };
      });
    },
    [list.length]
  );

  const start = Math.min(range.start, Math.max(0, list.length - 1));
  const end = Math.min(range.end, list.length);

  return {
    scrollerRef: useCallback((node: HTMLDivElement | null) => {
      scroller.current = node;
    }, []),
    windowRef: useCallback((node: HTMLDivElement | null) => {
      windowEl.current = node;
    }, []),
    start,
    end,
    topPad: windowed ? offsets.current[start] : 0,
    bottomPad: windowed ? offsets.current[list.length] - offsets.current[end] : 0,
    registerCard,
    growAround,
  };
}

function initialRange(length: number, anchorIndex: number, windowed: boolean) {
  if (!windowed) return { start: 0, end: length };
  if (anchorIndex < 0) return { start: 0, end: Math.min(length, OVERSCAN * 2 + 3) };
  return {
    start: Math.max(0, anchorIndex - OVERSCAN),
    end: Math.min(length, anchorIndex + OVERSCAN + 2),
  };
}
