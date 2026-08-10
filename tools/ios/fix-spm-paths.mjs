/**
 * Repair the local package paths in `ios/App/CapApp-SPM/Package.swift` after a
 * Capacitor sync run on Windows.
 *
 * ## The bug
 *
 * `npx cap sync` writes the path to each local plugin package using the host
 * platform's separator. On Windows that produces:
 *
 *     .package(name: "CapacitorApp", path: "..\..\..\node_modules\@capacitor\app")
 *
 * which is not a path problem. It is a **syntax error**. Swift string literals
 * treat a backslash as an escape introducer, so that line contains `\n` (a
 * newline) followed by `\.`, `\@` and `\a`, none of which are valid escape
 * sequences. `Package.swift` does not parse, the `CapApp-SPM` dependency never
 * resolves, and the Xcode build fails before it compiles a line of app code.
 *
 * Nothing on Windows notices, because nothing on Windows builds the iOS target.
 * The whole cost of this lands on whoever opens the project on a Mac -- which,
 * for this project, means a borrowed machine and a booked slot. Hence a script
 * rather than a note in a document.
 *
 * ## Why this is not just a one-off edit
 *
 * `Package.swift` carries a "DO NOT MODIFY - managed by Capacitor CLI commands"
 * banner, and it means it: every `cap sync` rewrites the file and puts the
 * backslashes back. So this runs *after* sync, from the `cap:sync` npm script,
 * and the fix survives.
 *
 * `src/test/iosProject.test.ts` asserts the file is clean, so a sync that
 * skipped this step turns CI red instead of reaching a Mac.
 *
 * Usage:
 *   node tools/ios/fix-spm-paths.mjs      # normally via `npm run cap:sync`
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const packageSwiftPath = join(
  here,
  '..',
  '..',
  'ios',
  'App',
  'CapApp-SPM',
  'Package.swift'
);

/**
 * Only the `path:` arguments are touched, not every backslash in the file.
 *
 * The `url:` dependency beside them is an https URL that is already correct,
 * and a blanket replace would be a rule that happens to work today rather than
 * one that says what it means.
 */
const PATH_ARGUMENT = /(path:\s*")([^"]*)(")/g;

export function normalisePaths(source) {
  return source.replace(PATH_ARGUMENT, (_, open, value, close) => open + value.replace(/\\/g, '/') + close);
}

async function main() {
  const original = await readFile(packageSwiftPath, 'utf8');
  const fixed = normalisePaths(original);

  if (fixed === original) {
    console.log('Package.swift: local package paths already use forward slashes.');
    return;
  }

  await writeFile(packageSwiftPath, fixed);
  console.log('Package.swift: rewrote Windows path separators in local package paths.');
  for (const [, , value] of original.matchAll(PATH_ARGUMENT)) {
    if (value.includes('\\')) console.log(`  ${value}\n    -> ${value.replace(/\\/g, '/')}`);
  }
}

// Importable for the test without running the rewrite.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(`\n${error.message}\n`);
    process.exitCode = 1;
  });
}
