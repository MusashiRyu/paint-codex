import { useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { APP_VERSION, appConfig } from '../../app/config';
import { ExternalLink } from '../../shared/ui/ExternalLink';
import { GhostButton } from '../../shared/ui/GhostButton';
import { Sheet } from '../../shared/ui/Sheet';
import styles from './AboutSheet.module.css';

interface AboutSheetProps {
  onClose: () => void;
}

/**
 * The app's only informational surface: what Paco is, who it is built from, and
 * the one place it asks for anything. The credits are the load-bearing part —
 * the paint data and the design are both other people's work, and until this
 * sheet existed that was acknowledged only in the store listing, which nobody
 * reads after installing.
 */
export function AboutSheet({ onClose }: AboutSheetProps) {
  const [version, setVersion] = useState(APP_VERSION);

  useEffect(() => {
    let cancelled = false;

    CapacitorApp.getInfo()
      .then((info) => {
        if (!cancelled) setVersion(info.version);
      })
      .catch(() => {
        // No native package to ask (browser, tests). The build-time constant
        // in config.ts already holds the right answer for those.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Sheet
      title="ABOUT PACO"
      label="About Paco"
      closeLabel="Close about"
      size="tall"
      onClose={onClose}
    >
      <div className={styles.body}>
        <p className={styles.prose}>
          Paco converts paint between Citadel, Vallejo and The Army Painter, ranking every
          equivalent by a measured colour distance rather than by eye. The whole catalogue
          ships inside the app and refreshes itself when it can, so it keeps working with
          the radio off.
        </p>

        {appConfig.featureFlags.supportLink && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>Support</h2>
            <p className={styles.prose}>
              Paco is free, carries no advertising and collects nothing about you — and it
              will stay that way. If it has saved you a wasted trip to the shop, you can
              leave a tip. Nothing in the app is locked behind it.
            </p>
            <div className={styles.tipRow}>
              <GhostButton size="lg" block href={appConfig.links.support}>
                LEAVE A TIP
              </GhostButton>
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Credits</h2>
          <p className={styles.prose}>
            Paint data is derived from the open colour database at{' '}
            <ExternalLink href={appConfig.links.paintData}>miniature-paints</ExternalLink> (MIT),
            published by the Miniature Painter Pro team.
          </p>
          <p className={styles.prose}>
            The Paint Codex design is by{' '}
            <ExternalLink href={appConfig.links.design}>Lukas Stordeur</ExternalLink>.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Privacy</h2>
          <p className={styles.prose}>
            No accounts, no analytics, no crash reporting. Your lists are stored on this
            device and are never uploaded.{' '}
            <ExternalLink href={appConfig.links.privacy}>Read the privacy policy</ExternalLink>
            .
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Legal</h2>
          <p className={styles.legal}>
            Paco is an independent app. It is not affiliated with, endorsed by, or
            sponsored by Games Workshop Limited, Acrylicos Vallejo S.L., or The Army
            Painter ApS. Citadel, Vallejo and The Army Painter are trademarks of their
            respective owners, used here only to identify the paint ranges the app
            converts between.
          </p>
        </section>

        <div className={styles.version}>VERSION {version}</div>
      </div>
    </Sheet>
  );
}
