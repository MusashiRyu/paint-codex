import { useEffect, useRef, useState } from 'react';

/**
 * Keep keyboard focus inside an overlay, and give it back when the overlay
 * closes.
 *
 * `role="dialog"` and `aria-modal` describe a layer as modal but do not make it
 * behave that way: without this, Tab walks straight out of the sheet and into
 * the page behind it, which is still rendered and still focusable.
 *
 * Returns a ref to attach to the overlay's container. Give that element
 * `tabIndex={-1}` so it can hold focus when nothing inside it can.
 */

/**
 * Deliberately layout-free. `offsetParent`/`getClientRects` look like the right
 * visibility test but report nothing for `position: fixed` elements — which a
 * bottom sheet is — and nothing at all under jsdom, which turns the whole trap
 * into a no-op. The attribute filters below cover the cases these sheets
 * actually produce.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
]
  .map((selector) => `${selector}:not([hidden]):not([aria-hidden="true"])`)
  .join(', ');

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
}

export function useFocusTrap<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);

  // Captured during the first render, not in the effect: React applies
  // `autoFocus` while committing, so by the time an effect runs the focus has
  // already moved into the layer and the real trigger is lost.
  const [previouslyFocused] = useState(() => document.activeElement as HTMLElement | null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // An autoFocus input inside the layer has already claimed focus; only step
    // in when nothing has.
    if (!container.contains(document.activeElement)) {
      (focusableWithin(container)[0] ?? container).focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusable = focusableWithin(container);
      if (focusable.length === 0) {
        // Nothing to move to, but focus must not leave the layer.
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const inside = container.contains(active);

      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };

    // Capture phase, on the document: focus may already have escaped the
    // container, in which case a listener on the container would never fire.
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      // Skip if the trigger has since left the DOM — focusing a detached node
      // silently drops focus to <body>, which is worse than leaving it be.
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [previouslyFocused]);

  return containerRef;
}
