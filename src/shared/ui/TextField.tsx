import type { InputHTMLAttributes } from 'react';
import styles from './TextField.module.css';

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> & {
  /**
   * `pill` is the standing input in a sheet. `inline` replaces a label in
   * place — an edit-in-place rename — so it wears the display face.
   */
  variant?: 'pill' | 'inline';
};

/**
 * A text input. Every other prop passes through to the element, because the
 * blur/keydown handling an edit-in-place field needs is the caller's business.
 */
export function TextField({ variant = 'pill', ...rest }: TextFieldProps) {
  return <input type="text" className={`${styles.input} ${styles[variant]}`} {...rest} />;
}
