export interface FeatureFlags {
  markdownExport: boolean;
}

export interface AppConfig {
  featureFlags: FeatureFlags;
}

export const appConfig: AppConfig = {
  featureFlags: {
    // Off for now: Markdown download is opt-in until the format settles.
    markdownExport: false,
  },
};