/**
 * The shared spec for the app's stroked line icons: 24px grid, drawn in
 * `currentColor` so the button around it owns the color, at the one weight the
 * design uses. An icon that sets its own stroke or fill is a bug.
 *
 * Spread onto an `<svg>` and give it `<path>` children.
 */
export const ACTION_ICON = {
  viewBox: '0 0 24 24',
  width: 15,
  height: 15,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;
