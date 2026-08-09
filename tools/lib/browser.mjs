/**
 * The one way this repo starts a browser, and the one way it serves `dist/`.
 *
 * Three tools drive a real Chromium — the store screenshots, the feature
 * graphic and the layout check — and each had grown its own copy of the
 * candidate list. The copies had already drifted into a bug: `screenshots.mjs`
 * learned in 018 that a browser which *exists* is not a browser that *starts*,
 * and `feature-graphic.mjs` was still picking by `existsSync` and would have
 * chosen the same broken Edge.
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..', '..');

/**
 * Chromium downloaded by Playwright into its shared cache, newest build first.
 *
 * This binary belongs to another tool. Nothing here installs it, nothing here
 * updates it, and a `playwright uninstall` would take it away — it is a
 * convenience, not a dependency, and everything still works without it. It is
 * on the list because it is a real Chromium that was already sitting on the
 * machine while this script was declaring no browser available.
 */
function playwrightChromiums() {
  const root = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright');
  if (!root || !existsSync(root)) return [];
  try {
    return readdirSync(root)
      .filter((name) => name.startsWith('chromium-'))
      // Build numbers, so compare numerically — 'chromium-9' sorts after
      // 'chromium-1234' as a string.
      .sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))
      .map((name) => join(root, name, 'chrome-win64', 'chrome.exe'));
  } catch {
    return [];
  }
}

/**
 * Ordered by preference, not by likelihood. CHROME_PATH first because an
 * explicit override must always win; Edge last because it is the one with a
 * demonstrated failure on the maintainer's machine — see 018. The bare Linux
 * paths are what CI has.
 */
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ...playwrightChromiums(),
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);

/**
 * The first candidate that actually starts, not the first one that exists.
 *
 * Those are different things, and the difference cost two retros. Edge is
 * installed on the maintainer's machine and refuses to launch under
 * puppeteer-core (`Failed to launch the browser process: Code: 0`, empty
 * stderr). Picking by `existsSync` meant Edge was chosen, the run died, and the
 * error said "no Chromium found" while a working Chromium sat on the same disk.
 *
 * The rejection list is the whole point of the failure message: "absent" sends
 * you to install something, a launch error sends you to a different browser.
 */
export async function launchBrowser() {
  const rejected = [];

  for (const path of CHROME_CANDIDATES) {
    if (!existsSync(path)) {
      rejected.push(`${path}\n      absent`);
      continue;
    }
    try {
      const browser = await puppeteer.launch({
        executablePath: path,
        headless: true,
        args: [
          '--hide-scrollbars',
          '--force-color-profile=srgb',
          // Chrome's sandbox needs unprivileged user namespaces, which the CI
          // image's AppArmor policy denies; /dev/shm there is small enough that
          // a page can die mid-run. Neither belongs on a dev machine.
          ...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []),
        ],
      });
      console.log(`chromium: ${path}`);
      return browser;
    } catch (error) {
      const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
      rejected.push(`${path}\n      exists, but did not start: ${reason}`);
    }
  }

  throw new Error(
    `No Chromium could be launched. Tried:\n    ${rejected.join('\n    ')}\n\n` +
      `Set CHROME_PATH to a Chrome or Edge binary that starts.`
  );
}

/**
 * Serve `dist/` with vite preview and resolve once it is actually answering.
 * Returns the child process and the origin; the caller kills the child.
 */
export async function startPreview(port = 4173) {
  const origin = `http://localhost:${port}`;
  if (!existsSync(join(repoRoot, 'dist', 'index.html'))) {
    throw new Error('dist/index.html not found. Run `npm run build` first.');
  }
  // Vite's JS entry point rather than `npx vite`: on Windows npx resolves to a
  // .cmd, which Node refuses to spawn without a shell, and a shell then wants
  // the arguments concatenated into one escaped string. Running the script with
  // the current node binary sidesteps both.
  const viteBin = join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(process.execPath, [viteBin, 'preview', '--port', String(port), '--strictPort'], {
    cwd: repoRoot,
    stdio: 'ignore',
  });

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(origin);
      if (res.ok) return { child, origin };
    } catch {
      // Not listening yet.
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  child.kill();
  throw new Error(`vite preview did not come up on ${origin} within 30s.`);
}
