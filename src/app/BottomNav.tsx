import styles from './BottomNav.module.css';

/** The app's two top-level destinations. */
export type Screen = 'lists' | 'collab';

interface BottomNavProps {
  screen: Screen;
  onSelect: (screen: Screen) => void;
}

/**
 * The bottom navigation bar.
 *
 * Lives in `app/` rather than `shared/ui/` and takes no items: it names this
 * app's two screens, so it is shell rather than a primitive and is deliberately
 * absent from the design-system barrel.
 *
 * It is also the new owner of the home-indicator inset. The bar is the lowest
 * thing on the screen now, so it pads itself and everything above it clears the
 * bar instead of the inset — see `--nav-height`.
 */
export function BottomNav({ screen, onSelect }: BottomNavProps) {
  return (
    <nav className={styles.nav} aria-label="Main">
      <button
        type="button"
        className={`${styles.tab} ${screen === 'lists' ? styles.active : ''}`}
        onClick={() => onSelect('lists')}
        aria-current={screen === 'lists' ? 'page' : undefined}
      >
        {/* A written list: three ruled lines with a bullet each. */}
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="5" cy="6" r="1.3" fill="currentColor" stroke="none" />
          <line x1="9" y1="6" x2="20" y2="6" />
          <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <circle cx="5" cy="18" r="1.3" fill="currentColor" stroke="none" />
          <line x1="9" y1="18" x2="20" y2="18" />
        </svg>
        <span className={styles.label}>List</span>
      </button>

      <button
        type="button"
        className={`${styles.tab} ${screen === 'collab' ? styles.active : ''}`}
        onClick={() => onSelect('collab')}
        aria-current={screen === 'collab' ? 'page' : undefined}
      >
        {/* A drop of paint. */}
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3 C16 9 18 12.5 18 15.5 C18 19 15.3 21 12 21 C8.7 21 6 19 6 15.5 C6 12.5 8 9 12 3 Z" />
        </svg>
        <span className={styles.label}>Collab</span>
      </button>
    </nav>
  );
}
