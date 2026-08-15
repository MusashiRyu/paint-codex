import type { ReactNode } from 'react';
import styles from './SectionHeading.module.css';

export interface SectionHeadingProps {
  children: ReactNode;
}

/**
 * The gold rule that divides a scrolling surface into named groups.
 *
 * Extracted from `ListsPanel`'s category headings once the Color Lab wanted the
 * same rule five more times — the mix preview, the color theory block, its
 * three derived colors, and each list in the paint picker. The heading is
 * always uppercase Cinzel over a hairline; the caller supplies only the words.
 */
export function SectionHeading({ children }: SectionHeadingProps) {
  return <div className={styles.sectionHeading}>{children}</div>;
}
