import { useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Android routes the back gesture straight to the activity, which finishes it —
 * Capacitor core registers no handler of its own. Without this, backing out of an
 * open sheet closes the whole app.
 *
 * Layers register here while they are open. Back dismisses the topmost one and
 * only exits the app once nothing is left to close, which is what Android would
 * have done from the root screen anyway.
 */

type Dismiss = () => void;

const dismissStack: Dismiss[] = [];
let listenerAttached = false;

function handleBack() {
  const top = dismissStack[dismissStack.length - 1];
  if (top) {
    top();
    return;
  }
  void CapacitorApp.exitApp();
}

async function attachListener() {
  if (listenerAttached) return;
  listenerAttached = true;
  try {
    await CapacitorApp.addListener('backButton', handleBack);
  } catch {
    // No native back button on this platform (browser, tests) — nothing to attach to.
    listenerAttached = false;
  }
}

export function useBackDismiss(active: boolean, onDismiss: Dismiss) {
  // Kept in a ref so a re-rendered callback doesn't churn the stack entry.
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!active) return;

    const entry: Dismiss = () => dismissRef.current();
    dismissStack.push(entry);
    void attachListener();

    return () => {
      const index = dismissStack.lastIndexOf(entry);
      if (index !== -1) dismissStack.splice(index, 1);
    };
  }, [active]);
}
