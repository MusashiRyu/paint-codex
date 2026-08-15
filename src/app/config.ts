export interface FeatureFlags {
  supportLink: boolean;
}

/** Every URL the app can send someone to. There are no others. */
export interface AppLinks {
  support: string;
  privacy: string;
  paintData: string;
  design: string;
}

export interface AppConfig {
  featureFlags: FeatureFlags;
  links: AppLinks;
}

/**
 * The version the About sheet falls back to on the web build, which has no
 * native package to ask. On a device `App.getInfo()` answers instead and this
 * value is never shown.
 *
 * `src/test/appVersion.test.ts` pins it to `versionName` in
 * `android/app/build.gradle`, so the two cannot drift apart unnoticed.
 */
export const APP_VERSION = '1.2.3';

export const appConfig: AppConfig = {
  featureFlags: {
    // Toggles the About sheet's support section.
    supportLink: true,
  },
  links: {
    support: 'https://ko-fi.com/musashiryu',
    privacy: 'https://musashiryu.github.io/paint-codex/privacy.html',
    paintData: 'https://github.com/Arcturus5404/miniature-paints',
    design: 'https://github.com/LukasStordeur',
  },
};
