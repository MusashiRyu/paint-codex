import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_VERSION } from '../app/config';

/**
 * `APP_VERSION` is only ever shown on the web build — on a device
 * `App.getInfo()` reports the real package version instead. That is exactly why
 * it can rot unnoticed: bump `versionName` for a release, ship it, and the two
 * disagree with nothing to catch it, because the path that would show the stale
 * value is the path nobody tests on.
 */
describe('APP_VERSION', () => {
  it('matches versionName in android/app/build.gradle', () => {
    // Resolved from the Vitest root rather than `import.meta.url`, which the
    // transform rewrites to a non-`file:` URL that `readFileSync` rejects.
    const gradle = readFileSync(resolve(process.cwd(), 'android/app/build.gradle'), 'utf8');

    const versionName = /versionName\s+"([^"]+)"/.exec(gradle)?.[1];

    expect(versionName, 'versionName not found in build.gradle').toBeDefined();
    expect(APP_VERSION).toBe(versionName);
  });
});
