export interface FeatureFlags {
  markdownExport: boolean;
}

export interface AppConfig {
  featureFlags: FeatureFlags;
}

export const appConfig: AppConfig = {
  featureFlags: {
    markdownExport: true,
  },
};