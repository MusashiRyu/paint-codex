import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards on the iOS native project, for the things that cannot be built here.
 *
 * Every assertion in this file protects against the same failure mode: the iOS
 * target is only ever compiled on a borrowed Mac, so a regression introduced on
 * this machine is invisible until someone is sitting in front of that Mac with
 * a booked slot running out. These are the checks cheap enough to run on every
 * push and specific enough to be worth it.
 *
 * Version numbers are asserted separately, in `appVersion.test.ts`.
 *
 * Resolved from the Vitest root rather than `import.meta.url`, which the
 * transform rewrites to a non-`file:` URL that `readFileSync` rejects.
 */
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('CapApp-SPM/Package.swift', () => {
  const packageSwift = read('ios/App/CapApp-SPM/Package.swift');
  const localPaths = [...packageSwift.matchAll(/path:\s*"([^"]*)"/g)].map((m) => m[1]);

  it('declares at least one local package path', () => {
    // If Capacitor ever stops emitting local paths the assertion below becomes
    // vacuously true, and this test would pass while guarding nothing.
    expect(localPaths.length).toBeGreaterThan(0);
  });

  /**
   * `npx cap sync` writes these with the host separator, so a sync run on
   * Windows emits `..\..\..\node_modules\@capacitor\app`. That is not merely
   * the wrong separator: Swift reads a backslash as an escape introducer, so
   * the literal contains `\n`, `\.`, `\@` and `\a` and the manifest fails to
   * parse. The package never resolves and the Xcode build dies before it
   * reaches any app code.
   *
   * `tools/ios/fix-spm-paths.mjs` repairs it and runs from the `cap:sync`
   * script. This test is what catches a sync that went around it.
   */
  it('uses forward slashes in local package paths', () => {
    for (const path of localPaths) {
      expect(path, 'run `node tools/ios/fix-spm-paths.mjs`').not.toContain('\\');
    }
  });
});

describe('Info.plist', () => {
  const plist = read('ios/App/App/Info.plist');

  /**
   * Without this key every upload stops in App Store Connect to ask the export
   * compliance question by hand, including every TestFlight build.
   */
  it('answers the export compliance question', () => {
    expect(plist).toMatch(/<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);
  });

  /**
   * Capacitor's template ships `armv7`, a 32-bit capability that no device
   * able to run an iOS 15 deployment target has ever had.
   */
  it('requires arm64 rather than Capacitor default armv7', () => {
    expect(plist).toContain('<string>arm64</string>');
    expect(plist).not.toContain('<string>armv7</string>');
  });
});

describe('project.pbxproj', () => {
  const pbxproj = read('ios/App/App.xcodeproj/project.pbxproj');

  /**
   * iPhone only. Restoring iPad support is a deliberate decision with a cost
   * attached -- a mandatory 13" screenshot set, and a reviewer testing a layout
   * that has only ever been checked at phone widths -- so it should not happen
   * by way of an Xcode dialog nobody remembers clicking.
   */
  it('targets iPhone only', () => {
    const families = [...pbxproj.matchAll(/TARGETED_DEVICE_FAMILY = ([^;]+);/g)].map((m) => m[1]);

    expect(families.length, 'TARGETED_DEVICE_FAMILY not found').toBeGreaterThan(0);
    for (const family of families) expect(family).toBe('1');
  });

  /** A privacy manifest that is not in the Resources phase is not in the app. */
  it('bundles the privacy manifest', () => {
    expect(pbxproj).toContain('PrivacyInfo.xcprivacy in Resources');
  });
});
