# Retro 022 — The JDK stops being the shell's problem

Building the release APK in 021 failed on `JAVA_HOME` again. Retro 007 closed
that item by setting the variable persistently, at User *and* Machine scope,
and the variable was set — `[Environment]::GetEnvironmentVariable('JAVA_HOME',
'User')` returned the Temurin path from the shell that was reporting it unset.

That is the whole bug. A process inherits its environment block when it starts.
The editor this session ran under was started before 007, so it has the old
block, and so does everything it spawns, for as long as it lives. "Set it
persistently" fixes the next shell, not this one, and there is no `npm run`
that can tell the difference.

## What was done

`tools/android/gradle.mjs` now sits behind the three `android:build:*` scripts.
It resolves a JDK and launches `gradle-wrapper.jar` on it directly, so nothing
in the chain reads `JAVA_HOME` off the shell.

### It asks, rather than trusts

The resolution rule is the one `screenshots.mjs` already uses for browsers, and
for the same reason: **take the first candidate that answers correctly, not the
first that exists.** Each candidate is run as `java -version` and its major
version parsed out.

| Candidate | Why it is on the list |
| --- | --- |
| `PACO_JDK_HOME` | An explicit override always wins |
| `JAVA_HOME` | Right on most machines, and free to check |
| `HKCU\Environment`, `HKLM\…\Session Manager\Environment` | The value the *machine* holds. A stale process cannot see it any other way — this is the row that fixes the bug |
| `Program Files/{Eclipse Adoptium,Java,Microsoft,Amazon Corretto,Zulu}`, `/usr/lib/jvm`, `/Library/Java/JavaVirtualMachines` | So a fresh clone builds without configuring anything |

Accepted: 17–24, preferring 21. The ceiling is what makes Studio's bundled JBR
a *skipped* candidate rather than a chosen one — it is Java 25, which Gradle
8.14.3 rejects with `Unsupported class file major version 69`, and which
otherwise fails only later, when a dependency change forces a build-script
recompile and Gradle can no longer serve the build from its cache. A directory
name could never have caught that: the JBR's path contains no version at all.

The run prints the JDK it picked, how many candidates it skipped, and a warning
if it landed on something other than 21.

### It launches the JAR, not the .bat

`gradlew.bat` is now unused by the npm scripts. The command is the one the .bat
builds — `java -Xmx64m -Xms64m -Dorg.gradle.appname=gradlew -jar
gradle-wrapper.jar <task>` — with `cwd` set to `android/`.

That drops the second environment trap for free: `NoDefaultCurrentDirectoryInExePath=1`
(Git for Windows sets it) stops `cmd.exe` resolving `gradlew.bat` from the
working directory, which is why the scripts had to say `.\gradlew.bat`. There
is no `.bat` in the chain any more, and no `cd` either.

`JAVA_HOME` is still exported into the child process — AGP and some toolchain
lookups read it independently of the JVM they are running on. The difference is
that its value is now decided here rather than inherited.

### How it was verified

Both failure modes, reproduced in a shell that genuinely lacks the variable:

| Shell state | Result |
| --- | --- |
| `JAVA_HOME` removed | `jdk: …\jdk-21.0.12.8-hotspot (Java 21)`, from the registry. `BUILD SUCCESSFUL`, exit 0 |
| `JAVA_HOME` = Studio's JBR | Same JDK 21 chosen, `skipped 1 other candidate(s)`. `BUILD SUCCESSFUL`, exit 0 |

## Measured, and found not to be a problem

- **`org.gradle.java.home` in `~/.gradle/gradle.properties` would have been one
  line.** It also pins an exact path — Adoptium installs into a version-stamped
  directory, so the next JDK update breaks every Gradle build on the machine
  with an error about a missing JVM rather than about the update. And it lives
  outside the repo, so a fresh clone learns nothing from it. The probe survives
  a JDK upgrade; the property does not.
- **Restarting the editor would have fixed this session.** It would not have
  fixed the class: any long-lived process predating an environment change hits
  the same wall, and "restart everything" is not a build step.

## Files changed

**New**
- `tools/android/gradle.mjs`
- `documentation/022-retro.md`

**Modified**
- `package.json` — the three `android:build:*` scripts
- `README.md` — the JDK prerequisite and the `.\gradlew.bat` note
- `documentation/release-checklist.md` — the JDK 21 section
- `documentation/0.1-architecture.md` — a Gradle launcher row
- `documentation/OPEN-ITEMS.md` — the recurrence, and what closed it

## Assumptions made

- **17–24 rather than 21 only.** The pinned Gradle supports the range; refusing
  a machine that has 17 or 23 would trade a real build for a preference. 21 is
  still preferred and anything else says so on the way past, so a build that
  ships on an untested JVM cannot do it silently.
- **A rejected `PACO_JDK_HOME` falls through rather than failing.** It is
  reported in the skipped count and the chosen JDK is printed on every run, so
  an override that does not qualify is visible without stopping the build.
- **The registry read is Windows-only and best-effort.** `reg.exe` missing, the
  value absent, or the query failing are all just "this source had nothing" —
  it is one candidate among several, not a precondition.

Open work: [OPEN-ITEMS.md](OPEN-ITEMS.md).
