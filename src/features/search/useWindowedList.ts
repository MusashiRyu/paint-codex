import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { Paint } from '../../domain/types';
import { ANCHOR_GAP, CARD_METRICS, estimateCardHeight, visibleTileCount } from './cardMetrics';

/**
 * Mount only the cards on screen, and keep the scroll honest about the rest.
 *
 * The search sheet browses the whole catalog — 2,279 paints, ~37 DOM elements
 * and a match lookup each. Rendered whole that is ~84,000 elements and 8,722
 * focusable buttons, which the focus trap re-queries on every Tab. So the list
 * renders a window of about nine cards and spacer divs whose heights stand in
 * for everything outside it.
 *
 * Hand-rolled rather than a library: both store listings answer their privacy
 * forms with "four runtime dependencies", so a fifth is a form to re-answer
 * rather than a line in package.json.
 */

/** Cards kept mounted either side of the visible range. */
const OVERSCAN = 3;

/**
 * Below this many results, render everything and let the spacers be 0.
 *
 * A short list is not what this exists for, and a window over one costs more
 * than it saves: measurement, spacers, and a scroll listener for a page that
 * does not scroll. It also keeps every small-fixture test rendering exactly as
 * it did before there was a window.
 */
export const WINDOW_BYPASS_BELOW = 24;

/** Viewport to assume before the scroller has been laid out — and under jsdom. */
const FALLBACK_VIEWPORT = 800;

/*
 * The anchor landing, and why it is a feedback loop rather than a write.
 *
 * Writing `scrollTop` is a request, not a result — but not in the way this
 * file used to think. WebKit's setter forces layout first and clamps against
 * *fresh* layout, so the main thread accepts a jump into spacers that grew in
 * this same commit and reads the accepted value straight back. What it cannot
 * promise is that the position survives: on iOS the scroller is backed by a
 * UIScrollView in another process, the new content size reaches it on a later
 * layer-tree commit, and that commit can reset the offset to (0,0) — WebKit
 * bug 195584's failure class — pushing the collapse back to the page as
 * ordinary scroll events, frames after the write "succeeded".
 *
 * So no single write, and no read-back, can be trusted. The landing instead:
 *
 *  - keeps the anchor's cards mounted alongside wherever the scroller
 *    actually is (two windows, three spacers), so no frame is ever blank and
 *    the loop always has a card to measure;
 *  - runs on animation frames, re-reading the card's real geometry each frame
 *    and writing only the remaining error — read-back is never consulted;
 *  - declares arrival only after the card holds its position for
 *    LANDING_STABLE_FRAMES consecutive frames;
 *  - keeps a guard window after arrival, because the UIScrollView reset can
 *    land *after* a genuine landing: a collapse of several viewports with no
 *    finger on the screen re-arms the landing instead of being obeyed.
 *
 * TanStack Virtual retries scrollToIndex once per frame for up to 10 frames
 * for the same reason; react-virtuoso holds a watch window after the scroll.
 * The budget below is theirs with room for the iOS keyboard-dismiss
 * animation (~250ms), which the reported repro includes: the search field is
 * focused when the tile is tapped, and moving focus to the card starts the
 * dismissal mid-landing.
 */
/** Frames the landing loop may run before settling for wherever it is. */
const LANDING_DEADLINE_FRAMES = 30;
/** Consecutive on-target frames before the landing counts as arrived. */
const LANDING_STABLE_FRAMES = 2;
/** How far off the card may sit and still count as on target, in px. */
const LANDING_TOLERANCE = 2;
/** How long after arrival a spontaneous collapse is treated as the engine's. */
const LANDING_GUARD_MS = 600;
/** Re-landings the guard may spend before believing the collapse. */
const LANDING_GUARD_REARMS = 2;

/** One mounted run of cards; `pad` stands in for everything since the last. */
export interface WindowSegment {
  start: number;
  end: number;
  pad: number;
}

interface LandingState {
  id: string;
  gen: number;
  frame: number;
  deadline: number;
  stable: number;
}

interface GuardState {
  id: string;
  index: number;
  until: number;
  rearms: number;
}

export interface WindowedList {
  /** The scroll container. */
  scrollerRef: (node: HTMLDivElement | null) => void;
  /** Wrapper around the cards, so the header above them can be measured out. */
  windowRef: (node: HTMLDivElement | null) => void;
  /**
   * The mounted runs of cards, in order, each led by its spacer. Usually one;
   * two while an anchor landing is in flight and the scroller is elsewhere.
   */
  segments: WindowSegment[];
  /** Spacer height after the last segment, in px. */
  endPad: number;
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
  /**
   * The same id again, tracked apart because moving focus is not a geometric
   * operation. The scroll has to wait for the card to have a box; focus does
   * not, and holding it back until the scroll succeeds would mean a keyboard or
   * a screen reader lands on a sheet that merely happens to be near the paint.
   */
  const pendingFocusId = useRef<string | null>(anchorId);
  /** The running landing loop, if any. See the block comment above. */
  const landing = useRef<LandingState | null>(null);
  /** Generation counter: a stale loop sees a newer gen and stops itself. */
  const landingGen = useRef(0);
  /** Armed after a landing; watches for the engine reverting it. */
  const guard = useRef<GuardState | null>(null);
  /** A finger or wheel since the landing was armed — the user owns the scroll. */
  const userScrolled = useRef(false);

  const list = items ?? [];
  const windowed = list.length >= WINDOW_BYPASS_BELOW;

  const anchorIndex = anchorId ? list.findIndex((paint) => paint.id === anchorId) : -1;

  const [range, setRange] = useState(() => initialRange(list.length, anchorIndex, windowed));
  /**
   * The index whose window stays mounted regardless of where the scroller is —
   * state, not a ref, because the extra segment it mounts is render output.
   * Set while an anchor scroll is pending; cleared when the landing resolves.
   */
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(
    anchorIndex >= 0 ? anchorIndex : null
  );

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
   * window has to cover it. Moving the window never moves content — each
   * segment's spacer is summed from the same offsets, so every card keeps its
   * absolute position no matter which of them happen to be mounted — so this
   * is always safe to call and there is never a reason not to. While an anchor
   * is pinned, its segment rides along regardless of what this derives.
   */
  const syncRange = useCallback(
    (el: HTMLDivElement) => {
      const next = rangeFor(el.scrollTop, el.clientHeight || FALLBACK_VIEWPORT);
      setRange((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    },
    [rangeFor]
  );
  // Latest-ref, so the landing loop — which outlives any one commit — never
  // holds a syncRange built against a list that has since been replaced.
  const syncRangeRef = useRef(syncRange);
  syncRangeRef.current = syncRange;

  /** Stop the landing loop without resolving it; callers decide what follows. */
  const cancelLanding = useCallback(() => {
    const l = landing.current;
    if (!l) return;
    cancelAnimationFrame(l.frame);
    landing.current = null;
  }, []);

  /**
   * The landing is over — arrived, out of frames, or cancelled. Hand the
   * mounted range back to wherever the scroller really is, release the pinned
   * segment, and arm the guard if this was an arrival.
   */
  const finishLanding = useCallback(
    (el: HTMLDivElement, id: string, arrived: boolean, index: number) => {
      cancelLanding();
      pendingScrollId.current = null;
      setPinnedIndex(null);
      if (arrived) {
        guard.current = {
          id,
          index,
          until: performance.now() + LANDING_GUARD_MS,
          // A re-landing keeps spending the same budget; a fresh landing resets it.
          rearms: guard.current?.id === id ? guard.current.rearms : LANDING_GUARD_REARMS,
        };
        userScrolled.current = false;
      } else {
        guard.current = null;
      }
      syncRangeRef.current(el);
    },
    [cancelLanding]
  );

  /**
   * Drive the scroller to the anchor, one frame at a time, judging only by
   * the card's real geometry. See the block comment at the top of the file
   * for why nothing shorter survives iOS.
   */
  const startLanding = useCallback(
    (id: string, index: number) => {
      cancelLanding();
      const gen = ++landingGen.current;
      const state: LandingState = {
        id,
        gen,
        frame: 0,
        deadline: LANDING_DEADLINE_FRAMES,
        stable: 0,
      };
      landing.current = state;
      const step = () => {
        const l = landing.current;
        if (!l || l.gen !== gen) return; // superseded by a newer landing
        const el = scroller.current;
        if (!el || pendingScrollId.current !== id) {
          landing.current = null;
          return;
        }
        // Fresh look-up every frame: the node can be replaced by a re-render,
        // and a detached node measures as a stable rect of zeroes — which two
        // frames of would count as "arrived", somewhere that is nowhere.
        const node = cards.current.get(id);
        const box = node?.isConnected ? node.getBoundingClientRect() : undefined;
        if (box && box.height > 0) {
          const off = box.top - el.getBoundingClientRect().top - ANCHOR_GAP;
          // An anchor near the end of the list can never reach the top; the
          // fully-scrolled position is its landing. The off bound keeps a
          // lying read-back from faking this: a real bottom landing is short
          // by less than a viewport, a clamped one by hundreds of thousands.
          const maxTop = el.scrollHeight - el.clientHeight;
          const atMax = off > 0 && off <= el.clientHeight && el.scrollTop >= maxTop - 1;
          if (Math.abs(off) <= LANDING_TOLERANCE || atMax) {
            if (++l.stable >= LANDING_STABLE_FRAMES) {
              finishLanding(el, id, true, index);
              return;
            }
          } else {
            l.stable = 0;
            // Relative, from live geometry: the remaining error is real
            // whatever scrollTop claims, and each write is re-clamped against
            // a layout one frame fresher than the last.
            el.scrollTop = el.scrollTop + off;
          }
        }
        if (--l.deadline <= 0) {
          finishLanding(el, id, false, index);
          return;
        }
        l.frame = requestAnimationFrame(step);
      };
      state.frame = requestAnimationFrame(step);
    },
    [cancelLanding, finishLanding]
  );

  // A new list, or a new anchor, starts the window over — offsets measured
  // against one list mean nothing against another. Render-phase, per React's
  // documented "adjusting state when props change", so no wrong frame paints.
  // A landing in flight is against the old order; its generation is bumped so
  // the loop stops itself on its next frame.
  const basis = useRef({ items, anchorIndex });
  if (basis.current.items !== items || basis.current.anchorIndex !== anchorIndex) {
    basis.current = { items, anchorIndex };
    landingGen.current += 1;
    landing.current = null;
    guard.current = null;
    setRange(initialRange(list.length, anchorIndex, windowed));
    setPinnedIndex(anchorIndex >= 0 ? anchorIndex : null);
    if (anchorIndex >= 0) {
      pendingScrollId.current = anchorId;
      pendingFocusId.current = anchorId;
    } else {
      pendingScrollId.current = null;
      if (scroller.current) scroller.current.scrollTop = 0;
    }
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
       * Hold the view still, against what this pass just measured — but only
       * when nothing else is steering. While an anchor scroll is pending the
       * landing loop is the one writer; a second writer computing a slightly
       * different target from prefix sums resets the loop's stability counter
       * every frame, and the two can ping-pong the whole deadline away.
       */
      if (!pendingScrollId.current) {
        /*
         * The offsets rebuild on the next render, so the corrected position
         * has to be summed from `heights` directly. Reading it back out of
         * `offsets.current` — which is what this did — makes `after` equal
         * `before` by construction, because that same stale array produced
         * `topIndex` and `into` a few lines above.
         */
        const rows = items ?? [];
        let topOffset = 0;
        for (let i = 0; i < topIndex; i++) topOffset += heightOf(rows[i]);
        const after = topOffset + into + headerOffset.current;
        if (Math.abs(after - before) > 0.5) el.scrollTop = after;
      }
    }

    /*
     * Kick the landing — but only once the spacers in the DOM are the ones
     * the current measurements imply. "This pass measured nothing new" is not
     * enough: React can run this effect again before the re-render a previous
     * pass asked for, and does exactly that on every commit in development.
     * So the id also stays pending while a version bump is outstanding.
     *
     * The first write happens here, pre-paint, so the common case — an engine
     * that simply honours the write — shows no travel at all. Everything
     * after the first write belongs to the loop.
     */
    const settled = requestedVersion.current === version;
    const pending = pendingScrollId.current;
    if (pending && settled && !changed && !resized && !landing.current) {
      const card = cards.current.get(pending);
      if (card && pendingFocusId.current === pending) {
        pendingFocusId.current = null;
        card.focus?.({ preventScroll: true });
      }

      const box = card?.getBoundingClientRect();
      // A card with no box has not been laid out yet, and under jsdom never
      // will be. Scrolling to it would be scrolling to zero, so wait instead.
      if (card && box && box.height > 0) {
        el.scrollTop = el.scrollTop + (box.top - scrollerBox.top - ANCHOR_GAP);
        const index = anchorIndex >= 0 ? anchorIndex : indexAt(el.scrollTop);
        startLanding(pending, index);
      }
    }
    // Every commit that can change a card's height is in this list: a new list,
    // cards entering or leaving the window, and a re-measure. It converges,
    // because a pass that moves nothing does not bump the version.
  }, [
    anchorIndex,
    bumpVersion,
    heightOf,
    indexAt,
    items,
    range.start,
    range.end,
    startLanding,
    version,
  ]);

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

  // A landing loop must not outlive the sheet that asked for it.
  useLayoutEffect(() => () => cancelLanding(), [cancelLanding]);

  /*
   * Plain listeners rather than React's handlers, so `passive` is explicit and
   * a test's fireEvent hits the same path a finger does.
   *
   * Every scroll counts, including the ones this hook causes. There used to be
   * a flag here that swallowed the next event after a programmatic write, on
   * the reasoning that the hook already knew where it had put the scroller —
   * but it only knew where it had *asked* for it to be, and swallowing the
   * event threw away the one correction that would have caught the difference.
   *
   * The guard is the exception that proves the rule: within its window, a
   * collapse of several viewports with no finger down is not scrolling, it is
   * the engine reverting a landing it had accepted — the UIScrollView reset
   * described at the top of the file. That one event is answered rather than
   * obeyed. Everything else, including every user gesture, is obeyed.
   */
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !windowed) return;
    const onScroll = () => {
      const g = guard.current;
      if (g) {
        if (performance.now() >= g.until) {
          guard.current = null;
        } else if (!userScrolled.current && g.rearms > 0) {
          const anchorTop = headerOffset.current + offsets.current[g.index];
          const viewport = el.clientHeight || FALLBACK_VIEWPORT;
          if (el.scrollTop < anchorTop - 3 * viewport) {
            g.rearms -= 1;
            pendingScrollId.current = g.id;
            setPinnedIndex(g.index);
            startLanding(g.id, g.index);
          }
        }
      }
      syncRangeRef.current(el);
    };
    // A gesture while a landing is in flight is the user taking the wheel:
    // stop steering, hand the range to wherever they take it, disarm the
    // guard. Without the hand-back a cancelled landing would leave the range
    // pinned to a window the scroller is nowhere near.
    const onGesture = () => {
      userScrolled.current = true;
      guard.current = null;
      if (landing.current) {
        const id = landing.current.id;
        cancelLanding();
        if (pendingScrollId.current === id) pendingScrollId.current = null;
        setPinnedIndex(null);
        syncRangeRef.current(el);
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('touchstart', onGesture, { passive: true });
    el.addEventListener('pointerdown', onGesture, { passive: true });
    el.addEventListener('wheel', onGesture, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('touchstart', onGesture);
      el.removeEventListener('pointerdown', onGesture);
      el.removeEventListener('wheel', onGesture);
    };
  }, [cancelLanding, startLanding, syncRange, windowed]);

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

  /*
   * The mounted runs of cards. One, almost always. Two while an anchor is
   * pinned and the scroller is far from it: the scroll-derived window keeps
   * whatever the user is looking at populated, the pinned window keeps the
   * landing's target mounted and measurable. The blank-sheet bug of retro 033
   * and the unmounted-anchor bug of retro 038 were both single-window
   * problems — one window can only be in one place.
   */
  const segments: WindowSegment[] = [];
  {
    const clamp = (v: number) => Math.max(0, Math.min(v, list.length));
    const runs: { start: number; end: number }[] = [];
    const scrollRun = { start: clamp(range.start), end: clamp(range.end) };
    if (scrollRun.end > scrollRun.start) runs.push(scrollRun);
    if (windowed && pinnedIndex !== null && pinnedIndex >= 0 && pinnedIndex < list.length) {
      runs.push({
        start: clamp(pinnedIndex - OVERSCAN),
        end: clamp(pinnedIndex + OVERSCAN + 2),
      });
    }
    runs.sort((a, b) => a.start - b.start);
    let cursor = 0;
    for (const run of runs) {
      const last = segments[segments.length - 1];
      if (last && run.start <= last.end) {
        // Overlapping or adjacent runs are one window, not two.
        last.end = Math.max(last.end, run.end);
        cursor = offsets.current[last.end];
        continue;
      }
      segments.push({
        start: run.start,
        end: run.end,
        pad: windowed ? offsets.current[run.start] - cursor : 0,
      });
      cursor = offsets.current[run.end];
    }
    if (segments.length === 0) segments.push({ start: 0, end: 0, pad: 0 });
  }
  const lastSeg = segments[segments.length - 1];
  const endPad = windowed ? offsets.current[list.length] - offsets.current[lastSeg.end] : 0;

  return {
    scrollerRef: useCallback((node: HTMLDivElement | null) => {
      scroller.current = node;
    }, []),
    windowRef: useCallback((node: HTMLDivElement | null) => {
      windowEl.current = node;
    }, []),
    segments,
    endPad,
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
