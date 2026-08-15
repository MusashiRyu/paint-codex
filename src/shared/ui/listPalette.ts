/**
 * The list banner palette.
 *
 * These are design tokens that cannot live in `tokens.css`: the chosen value is
 * persisted into the store and rendered later as a bare color, so writing
 * `var(--gold)` to localStorage would store a string that means nothing outside
 * a stylesheet. They are hex here instead, in one place, because the picker and
 * the store default had drifted apart into two copies of the same five colors.
 *
 * Gold is the only entry that also exists as a CSS token (`--gold`). If it ever
 * changes, change it in both — a list created before the change keeps the old
 * value, which is correct: it is the user's choice, not the theme's.
 */
export interface ListColorOption {
  hex: string;
  label: string;
}

export const LIST_COLORS: ListColorOption[] = [
  { hex: '#c9a86a', label: 'Gold' },
  { hex: '#7a2430', label: 'Crimson' },
  { hex: '#1c3a44', label: 'Teal' },
  { hex: '#5a3d6e', label: 'Purple' },
  { hex: '#cbb686', label: 'Bone' },
];

/** What a list gets when the caller does not pick a color. */
export const DEFAULT_LIST_COLOR = LIST_COLORS[0].hex;
