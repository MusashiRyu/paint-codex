import type { CSSProperties, ReactNode } from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  /** `success` is the muted green membership tone; omit when passing `style`. */
  tone?: 'success';
  /** Fills its column and centers — the delta pill under an equivalent tile. */
  block?: boolean;
  /** Cut down to the delta pill's height, to sit level with it in a tile. */
  compact?: boolean;
  /**
   * For badges whose color is computed rather than fixed — the ΔE pill, whose
   * three-part color comes from `shared/lib/color.ts`.
   */
  style?: CSSProperties;
  title?: string;
  as?: 'div' | 'span';
  children: ReactNode;
}

/**
 * A static status label. Never interactive — anything clickable is a `Pill`.
 */
export function Badge({
  tone,
  block = false,
  compact = false,
  style,
  title,
  as = 'div',
  children,
}: BadgeProps) {
  const className = [
    styles.badge,
    tone ? styles[tone] : '',
    block ? styles.block : '',
    compact ? styles.compact : '',
  ]
    .filter(Boolean)
    .join(' ');

  const Tag = as;
  return (
    <Tag className={className} style={style} title={title}>
      {children}
    </Tag>
  );
}
