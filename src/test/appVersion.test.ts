import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_VERSION } from '../app/config';

/**
 * `android/app/build.gradle` is the one place a release version is decided.
 * Three other files restate it, and each of them is invisible on the path the
 * next person is likely to be looking at:
 *
 * - `APP_VERSION` shows only on the web build — on a device `App.getInfo()`
 *   reports the real package version instead, so a stale constant survives
 *   every hardware check.
 * - iOS `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` can only be built on a
 *   Mac, and this project archives on CI rather than owning one, so nothing on
 *   this machine ever renders them. They sat at Capacitor's `1.0` default
 *   against a `versionName` of `1.0.0` until this test was written.
 *
 * All three are asserted here so that bumping the version for a release and
 * missing one turns CI red instead of shipping a lie.
 *
 * Resolved from the Vitest root rather than `import.meta.url`, which the
 * transform rewrites to a non-`file:` URL that `readFileSync` rejects.
 */
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const gradle = read('android/app/build.gradle');
const versionName = /versionName\s+"([^"]+)"/.exec(gradle)?.[1];
const versionCode = /versionCode\s+(\d+)/.exec(gradle)?.[1];

/**
 * Every occurrence, not the first: the pbxproj carries a Debug and a Release
 * configuration, and Xcode adds more when a scheme is added. Asserting on one
 * match would let a second configuration drift silently.
 */
const pbxproj = read('ios/App/App.xcodeproj/project.pbxproj');
const allValues = (key: string) =>
  [...pbxproj.matchAll(new RegExp(`${key} = ([^;]+);`, 'g'))].map((m) => m[1]);

describe('release version', () => {
  it('is declared in build.gradle', () => {
    expect(versionName, 'versionName not found in build.gradle').toBeDefined();
    expect(versionCode, 'versionCode not found in build.gradle').toBeDefined();
  });

  it('matches APP_VERSION in src/app/config.ts', () => {
    expect(APP_VERSION).toBe(versionName);
  });

  it('matches MARKETING_VERSION in every iOS build configuration', () => {
    const marketing = allValues('MARKETING_VERSION');

    expect(marketing.length, 'MARKETING_VERSION not found in project.pbxproj').toBeGreaterThan(0);
    for (const value of marketing) expect(value).toBe(versionName);
  });

  it('matches CURRENT_PROJECT_VERSION in every iOS build configuration', () => {
    const current = allValues('CURRENT_PROJECT_VERSION');

    expect(current.length, 'CURRENT_PROJECT_VERSION not found in project.pbxproj').toBeGreaterThan(
      0
    );
    for (const value of current) expect(value).toBe(versionCode);
  });
});
