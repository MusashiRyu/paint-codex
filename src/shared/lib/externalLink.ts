/**
 * The attribute pair every outbound link in the app carries.
 *
 * `target="_blank"` is what actually hands a URL to the system browser inside
 * the Android WebView: Capacitor's bridge implements `onCreateWindow` and opens
 * anything off-origin externally. Without it the page would try to load *inside*
 * the app, replacing the UI with a website and no way back.
 *
 * `rel` is not decoration either. `noopener` closes the reverse-window handle,
 * and `noreferrer` means the destination is never told which app the visit came
 * from — which is the behaviour the privacy policy claims, so it has to be true
 * of every link and not just the ones someone remembered.
 *
 * One constant rather than four hand-typed attribute pairs, so that if a device
 * ever fails to hand off and `@capacitor/browser` becomes necessary, there is a
 * single place that has to change.
 */
export const EXTERNAL_LINK_PROPS = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;
