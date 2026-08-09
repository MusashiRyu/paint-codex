/**
 * The design system's public surface.
 *
 * The app itself does not import this file — `main.tsx` is its entry. This
 * barrel exists so the component library has a declared boundary: what is in
 * here is a part other things may build with, and what is not is internal.
 *
 * It is also what `design-sync` bundles when publishing to Claude Design, so
 * anything added here becomes a component the design agent can compose with.
 * See documentation/0.2-design-system.md.
 */

/*
 * The tokens ride with the bundle. Importing them here rather than @importing
 * them from a stylesheet means they are inlined at build time, so nothing has
 * to resolve a relative path at runtime — every `var(--gold)` in the component
 * CSS below resolves wherever the bundle is loaded.
 */
import './shared/styles/tokens.css';

/* Primitives — chrome, shared by every feature. */
export { Sheet } from './shared/ui/Sheet';
export type { SheetProps } from './shared/ui/Sheet';
export { Pill } from './shared/ui/Pill';
export type { PillProps } from './shared/ui/Pill';
export { Badge } from './shared/ui/Badge';
export type { BadgeProps } from './shared/ui/Badge';
export { IconButton } from './shared/ui/IconButton';
export type { IconButtonProps } from './shared/ui/IconButton';
export { GoldButton } from './shared/ui/GoldButton';
export type { GoldButtonProps } from './shared/ui/GoldButton';
export { GhostButton } from './shared/ui/GhostButton';
export type { GhostButtonProps } from './shared/ui/GhostButton';
export { TextField } from './shared/ui/TextField';
export type { TextFieldProps } from './shared/ui/TextField';
export { Swatch } from './shared/ui/Swatch';
export type { SwatchProps } from './shared/ui/Swatch';
export { ExternalLink } from './shared/ui/ExternalLink';
export type { ExternalLinkProps } from './shared/ui/ExternalLink';
export { ListIconSvg } from './shared/ui/ListIconSvg';

/* The list banner palette — persisted values, so hex rather than tokens. */
export { LIST_COLORS, DEFAULT_LIST_COLOR } from './shared/ui/listPalette';
export type { ListColorOption } from './shared/ui/listPalette';

/* ΔE classification — the one place a match quality becomes a colour. */
export {
  CLOSE_DELTA_MAX,
  VERY_CLOSE_DELTA_MAX,
  getDeltaQuality,
  getDeltaStyle,
  getDeltaLabel,
} from './shared/lib/color';
export type { DeltaQuality, DeltaStyle } from './shared/lib/color';

/* Composed pieces — app parts, built from the primitives above. */
export { PaintItem } from './features/lists/PaintItem';
export { ListsPanel } from './features/lists/ListsPanel';
export { NewListSheet } from './features/lists/NewListSheet';
export { SearchSheet } from './features/search/SearchSheet';

/*
 * `App` is deliberately absent. It is the shell, not a part — it owns the
 * store wiring and the overlay state, so nothing can compose with it. Its
 * stylesheet also reaches for `/imagery/*.png`, served out of `public/` at the
 * web root, which only resolves inside the running app.
 */

/* Types a caller needs to talk to the composed pieces. */
export type { Paint, Match } from './domain/types';
export type { PaintList, ListIcon } from './app/providers/store';
