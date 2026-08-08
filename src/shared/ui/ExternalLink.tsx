import type { ReactNode } from 'react';
import { EXTERNAL_LINK_PROPS } from '../lib/externalLink';
import styles from './ExternalLink.module.css';

export interface ExternalLinkProps {
  href: string;
  children: ReactNode;
}

/**
 * An inline text link that leaves the app. The only anchor style there is —
 * Paco has no internal navigation, so every link in it is by definition a
 * handoff to the browser, and every one of them goes through here to pick up
 * the `target`/`rel` contract in `lib/externalLink`.
 */
export function ExternalLink({ href, children }: ExternalLinkProps) {
  return (
    <a className={styles.link} href={href} {...EXTERNAL_LINK_PROPS}>
      {children}
    </a>
  );
}
