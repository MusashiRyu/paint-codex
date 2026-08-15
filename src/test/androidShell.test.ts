import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards on the Android manifest and on the one line of `index.html` the
 * device layout depends on.
 *
 * Same failure mode as `iosProject.test.ts`, one platform over: nothing in the
 * per-push CI run assembles the Android app or opens it on a screen, so a
 * manifest edited by an Android Studio dialog is invisible until an APK is on
 * a phone. These are the assertions cheap enough to run on every push.
 *
 * Resolved from the Vitest root rather than `import.meta.url`, which the
 * transform rewrites to a non-`file:` URL that `readFileSync` rejects.
 */
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('AndroidManifest.xml', () => {
  const manifest = read('android/app/src/main/AndroidManifest.xml');

  /**
   * Portrait only, matching `UISupportedInterfaceOrientations` in the iOS
   * Info.plist. Capacitor's template sets no orientation at all, so the
   * default is sensor-driven and the app rotated into a landscape window the
   * layout was never designed for.
   */
  it('locks the activity to portrait', () => {
    expect(manifest).toMatch(/android:screenOrientation="portrait"/);
  });

  /**
   * Not redundant with the lock above. `configChanges` is what stops the
   * activity being recreated on the config changes it still receives -- a
   * recreation reloads the WebView, losing an open sheet and the search a user
   * had typed.
   */
  it('handles configuration changes without recreating the activity', () => {
    const configChanges = manifest.match(/android:configChanges="([^"]+)"/)?.[1];

    expect(configChanges, 'android:configChanges not found').toBeDefined();
    for (const change of ['orientation', 'screenSize', 'keyboardHidden', 'uiMode']) {
      expect(configChanges).toContain(change);
    }
  });
});

describe('index.html', () => {
  const html = read('index.html');

  /**
   * The one thing that switches the safe-area insets on, and the reason the
   * app title rendered behind an iPhone's clock. Both platforms report
   * `env(safe-area-inset-*)` as 0 without it, and Capacitor's Android
   * SystemBars plugin greps this exact substring off the meta tag to decide
   * whether to hand the insets to the web layer or to pad the native view
   * instead.
   *
   * It cannot be caught by `npm run check:layout`: that check injects the
   * inset custom properties directly, so the layout there moves correctly
   * whether or not the meta tag ever asked for real ones. A desktop Chromium
   * has no notch to report, which is exactly how this shipped.
   */
  it('opts into the safe-area insets', () => {
    const viewport = html.match(/<meta name="viewport" content="([^"]+)"/)?.[1];

    expect(viewport, 'no viewport meta tag').toBeDefined();
    expect(viewport).toContain('viewport-fit=cover');
  });

  /**
   * iOS zooms the page in when a text input with a computed font-size under
   * 16px takes focus, and does not zoom back out on blur -- the web view is
   * left scaled and pannable in both axes. Every input in the app is under
   * that threshold on purpose (15px search field, 13px inline rename) and the
   * search sheet autofocuses, so opening and closing it was enough to trigger
   * it. Pinning the scale is what prevents it; a 16px floor on inputs would
   * mean changing type sizes the design chose.
   *
   * Like the assertion above, `npm run check:layout` cannot catch this: a
   * desktop Chromium has no soft keyboard and no focus zoom to suppress.
   */
  it('pins the page scale, so a focused input cannot zoom the web view', () => {
    const viewport = html.match(/<meta name="viewport" content="([^"]+)"/)?.[1];

    expect(viewport, 'no viewport meta tag').toBeDefined();
    for (const limit of ['minimum-scale=1.0', 'maximum-scale=1.0', 'user-scalable=no']) {
      expect(viewport).toContain(limit);
    }
  });
});

describe('safe-area tokens', () => {
  const tokens = read('src/shared/styles/tokens.css');

  /**
   * Two sources, because the platforms report the inset differently: Android
   * sets `--safe-area-inset-*` on `<html>` from the native window insets, iOS
   * offers only `env()`. Losing either half breaks exactly one platform, which
   * is the kind of regression that gets found on a device rather than here.
   *
   * The `0px` tail matters too — these land inside `calc()`, which rejects a
   * bare `0` as a length and drops the whole declaration.
   */
  for (const edge of ['top', 'bottom']) {
    it(`reads the ${edge} inset from both platforms`, () => {
      const token = tokens.match(new RegExp(`--inset-${edge}:([^;]+);`))?.[1];

      expect(token, `--inset-${edge} not defined`).toBeDefined();
      expect(token).toContain(`var(--safe-area-inset-${edge}`);
      expect(token).toContain(`env(safe-area-inset-${edge}`);
      expect(token).toContain('0px');
    });
  }
});
