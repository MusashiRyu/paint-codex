import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

/**
 * The test run extends the app's own Vite config rather than restating it.
 *
 * These were two standalone configs, and they had already drifted: `vite.config.ts`
 * defines an `@` -> `src` alias that `tsconfig.app.json` also declares in
 * `paths`, and this file did not. Nothing imports through `@/` yet, so the gap
 * was invisible — but the first module that did would have typechecked, built,
 * and failed to resolve only under test.
 *
 * Merging means the alias, the React plugin and anything added to the app
 * config later are shared by construction. Only `test` belongs here.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: false,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/features/**', 'src/domain/**', 'src/shared/**'],
      },
    },
  })
);
