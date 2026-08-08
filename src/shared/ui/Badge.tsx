import type { CSSProperties, ReactNode } from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  /** `success` is the muted green membership tone; omit when passing `style`. */
  tone?: 'success';
  /** Fills its column and centres — the delta pill under an equivalent tile. */
  block?: boolean;
  /**
   * For badges whose colour is computed rather than fixed — the ΔE pill, whose
   * three-part colour comes from `shared/lib/color.ts`.
   */
  style?: CSSProperties;
  title?: string;
  as?: 'div' | 'span';
  children: ReactNode;
}

/**
 * A static status label. Never interactive — anything clickable is a `Pill`.
 */
export function Badge({ tone, block = false, style, title, as = 'div', children }: BadgeProps) {
  const className = [styles.badge, tone ? styles[tone] : '', block ? styles.block : '']
    .filter(Boolean)
    .join(' ');

  const Tag = as;
  return (
    <Tag className={className} style={style} title={title}>
      {children}
    </Tag>
  );
}
