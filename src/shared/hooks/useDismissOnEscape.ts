import { useEffect, useRef } from 'react';

/**
 * Desktop counterpart to `useBackDismiss`: closes the layer on Escape.
 *
 * Mounted layers are the only ones listening, and the handler stops
 * propagation, so with nested layers the innermost one closes first.
 */
export function useDismissOnEscape(onDismiss: () => void) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      dismissRef.current();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
