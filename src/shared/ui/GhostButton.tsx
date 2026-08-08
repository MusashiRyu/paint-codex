import type { ReactNode } from 'react';
import { EXTERNAL_LINK_PROPS } from '../lib/externalLink';
import styles from './GhostButton.module.css';

interface GhostButtonBase {
  /** `quiet` drops the fill — an offer rather than the urged action. */
  tone?: 'primary' | 'quiet';
  size?: 'sm' | 'md' | 'lg';
  /** Full width, for a sheet's committing action. */
  block?: boolean;
  children: ReactNode;
}

/**
 * Either a button or a link out of the app, never both — a control that leaves
 * the app has nothing to disable and no handler to run, and one that stays has
 * no destination.
 */
export type GhostButtonProps =
  | (GhostButtonBase & { onClick: () => void; disabled?: boolean; href?: never })
  | (GhostButtonBase & { href: string; onClick?: never; disabled?: never });

/**
 * An outlined pill action with a text label — the app's workhorse button.
 * Distinct from `GoldButton`, which is filled, round and icon-only.
 *
 * Given `href` it renders an anchor instead, styled identically. That is a real
 * anchor rather than a button with a click handler because it *is* a link: it
 * should announce as one, and the WebView's external handoff keys off the
 * `target` an anchor carries.
 */
export function GhostButton(props: GhostButtonProps) {
  const { tone = 'primary', size = 'md', block = false, children } = props;

  const className = [
    styles.btn,
    styles[size],
    tone === 'quiet' ? styles.quiet : '',
    block ? styles.block : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (props.href !== undefined) {
    return (
      <a className={className} href={props.href} {...EXTERNAL_LINK_PROPS}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {children}
    </button>
  );
}
