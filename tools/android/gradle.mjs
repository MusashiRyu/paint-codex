/**
 * Run the Gradle wrapper on a JDK this build actually supports, whatever the
 * shell's environment happens to say.
 *
 * Usage (through the npm scripts, which is the only way it is called):
 *   node tools/android/gradle.mjs assembleDebug
 *
 * ## Why this exists
 *
 * `gradlew` picks its JVM from `JAVA_HOME`, and on this project that has failed
 * in three different ways, each of which reports itself as something else:
 *
 * 1. **The variable is set, and the shell does not have it.** `JAVA_HOME` was
 *    set persistently (User scope) on 2026-08-08, but a process inherits its
 *    environment block at launch — an editor or terminal started before that
 *    never sees it, and neither does anything it spawns, for as long as it
 *    lives. Symptom: `JAVA_HOME is not set` from a machine where it plainly is.
 * 2. **The variable points at a JDK Gradle rejects.** Android Studio's bundled
 *    JBR is Java 25; the pinned Gradle 8.14.3 refuses it with `Unsupported
 *    class file major version 69`. Worse, that failure hides behind Gradle's
 *    compiled-script cache — the build succeeds until a dependency change
 *    forces a recompile, so it looks like the dependency broke it.
 * 3. **The variable points at a JDK that was upgraded.** Adoptium installs into
 *    a version-stamped directory, so an update moves the path out from under a
 *    hardcoded value.
 *
 * So the JDK is resolved here, per run, by *asking each candidate what version
 * it is* rather than trusting a path — and the wrapper JAR is launched with
 * that `java` directly. Nothing downstream reads `JAVA_HOME` off the shell.
 *
 * Set `PACO_JDK_HOME` to override the search entirely.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const androidDir = join(repoRoot, 'android');
const wrapperJar = join(androidDir, 'gradle', 'wrapper', 'gradle-wrapper.jar');

const isWindows = process.platform === 'win32';

/**
 * The Gradle in `gradle-wrapper.properties` runs on 17 through 24. 21 is what
 * this project has been built and released on, so it wins when several JDKs
 * qualify; the wider range is there so a machine with only 17 or 23 still
 * builds instead of being told to install a third JDK.
 */
const PINNED = 21;
const MIN = 17;
const MAX = 24;

/**
 * `JAVA_HOME` as the *machine* holds it, for processes whose environment block
 * predates it being set — failure mode 1 above. Reading the registry is not a
 * clever trick here, it is the only way to see the current value from inside a
 * stale process.
 */
function persistedJavaHome() {
  if (!isWindows) return [];
  const keys = [
    'HKCU\\Environment',
    'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment',
  ];
  const found = [];
  for (const key of keys) {
    try {
      const out = execFileSync('reg', ['query', key, '/v', 'JAVA_HOME'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      // REG_SZ / REG_EXPAND_SZ, value last on the line, spaces allowed in it.
      const value = out.match(/JAVA_HOME\s+REG_(?:EXPAND_)?SZ\s+(.+)/)?.[1]?.trim();
      // A trailing separator is legal in the registry and fatal in a join().
      if (value) found.push(value.replace(/[\\/]+$/, ''));
    } catch {
      // No such value, or no reg.exe. Neither is an error worth reporting:
      // this is one source among several.
    }
  }
  return found;
}

/** Every JDK sitting in the usual install roots for this platform. */
function installedJdks() {
  const roots = isWindows
    ? [
        'C:/Program Files/Eclipse Adoptium',
        'C:/Program Files/Java',
        'C:/Program Files/Microsoft',
        'C:/Program Files/Amazon Corretto',
        'C:/Program Files/Zulu',
      ]
    : process.platform === 'darwin'
      ? ['/Library/Java/JavaVirtualMachines']
      : ['/usr/lib/jvm', '/usr/java'];

  const homes = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    try {
      for (const name of readdirSync(root)) {
        // A JRE has no javac and cannot build; the version probe below is what
        // actually decides, so this only keeps the candidate list readable.
        if (!/jdk|java/i.test(name)) continue;
        const home = join(root, name);
        // macOS bundles are directories with the real home nested inside.
        homes.push(process.platform === 'darwin' ? join(home, 'Contents', 'Home') : home);
      }
    } catch {
      // Unreadable root; the next one may work.
    }
  }
  // Newest first: 'jdk-21.0.12' should beat 'jdk-21.0.4', and it is a string
  // sort per path segment, so this is a preference and not a guarantee.
  return homes.sort().reverse();
}

/** Ordered by trust, not by likelihood — an explicit override always wins. */
function candidateHomes() {
  const seen = new Set();
  return [
    process.env.PACO_JDK_HOME,
    process.env.JAVA_HOME,
    ...persistedJavaHome(),
    ...installedJdks(),
  ]
    .filter(Boolean)
    .map((home) => home.replace(/[\\/]+$/, ''))
    .filter((home) => {
      const key = home.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

const javaBinary = (home) => join(home, 'bin', isWindows ? 'java.exe' : 'java');

/**
 * The major version a JDK reports, or null if it will not answer. Asking the
 * binary is the whole point: a directory named `jdk-21` can hold anything, and
 * Studio's `jbr` is named after no version at all.
 */
function majorVersion(home) {
  const java = javaBinary(home);
  if (!existsSync(java)) return null;
  // `-version` writes to stderr on every JDK there has ever been.
  const result = spawnSync(java, ['-version'], { encoding: 'utf8' });
  if (result.error || result.status !== 0) return null;
  const text = `${result.stderr}${result.stdout}`;
  // "21.0.12" -> 21, and the pre-9 "1.8.0_402" -> 8.
  const version = text.match(/version "(\d+)(?:\.(\d+))?/);
  if (!version) return null;
  const major = Number(version[1]);
  return major === 1 ? Number(version[2]) : major;
}

/**
 * The first candidate that reports a version Gradle accepts, preferring the
 * pinned one. Returns the rejections too — "absent" sends you to install a
 * JDK, "Java 25" sends you to a different one, and the message has to be able
 * to say which.
 */
function resolveJdk() {
  const rejected = [];
  const usable = [];

  for (const home of candidateHomes()) {
    if (!existsSync(javaBinary(home))) {
      rejected.push(`${home}\n      no java binary`);
      continue;
    }
    const major = majorVersion(home);
    if (major === null) {
      rejected.push(`${home}\n      exists, but did not report a version`);
      continue;
    }
    if (major < MIN || major > MAX) {
      rejected.push(`${home}\n      Java ${major}; this Gradle needs ${MIN}-${MAX}`);
      continue;
    }
    if (major === PINNED) return { home, major, rejected };
    usable.push({ home, major });
  }

  if (usable.length > 0) return { ...usable[0], rejected };

  throw new Error(
    `No JDK ${MIN}-${MAX} could be used. Tried:\n    ${rejected.join('\n    ') || '(nothing)'}\n\n` +
      `Install Temurin ${PINNED}, or set PACO_JDK_HOME to a JDK that qualifies.`
  );
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('usage: node tools/android/gradle.mjs <gradle task> [...]');
  process.exit(2);
}
if (!existsSync(wrapperJar)) {
  console.error(`Gradle wrapper missing at ${wrapperJar}. Run \`npx cap sync\`.`);
  process.exit(1);
}

const { home, major, rejected } = resolveJdk();
if (major !== PINNED) {
  console.warn(`warning: building on Java ${major}; ${PINNED} is what this project ships on.`);
}
console.log(`jdk: ${home} (Java ${major})`);
if (rejected.length > 0) console.log(`  skipped ${rejected.length} other candidate(s)`);

/*
 * The same command `gradlew.bat` builds, with the JDK decided above. Launching
 * the wrapper JAR rather than the .bat also steps around
 * `NoDefaultCurrentDirectoryInExePath`, which is set in this user's environment
 * and stops cmd.exe resolving `gradlew.bat` from the working directory.
 *
 * JAVA_HOME is exported for the child regardless: the Android Gradle Plugin and
 * some toolchain lookups read it independently of the JVM they are running on.
 */
const gradle = spawnSync(
  javaBinary(home),
  ['-Xmx64m', '-Xms64m', '-Dorg.gradle.appname=gradlew', '-jar', wrapperJar, ...args],
  {
    cwd: androidDir,
    stdio: 'inherit',
    env: { ...process.env, JAVA_HOME: home },
  }
);

if (gradle.error) {
  console.error(`Could not start Gradle: ${gradle.error.message}`);
  process.exit(1);
}
process.exit(gradle.status ?? 1);
