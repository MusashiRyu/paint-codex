# Retro 009 — The test suite was running on a different Vite

Started as an audit-noise cleanup and turned out to be a fidelity problem.

## What was done

### 1. Vitest 2 → 4, which removes a second Vite from the tree

`vitest@2.1.9` declares `dependencies.vite: "^5.0.0"` — a hard dependency, not
a peer. npm therefore installed a nested `vite@5.4.21` with `esbuild@0.21.5`
under `node_modules/vitest/`, while `npm run build` used the top-level
`vite@8.1.5`.

**The tests were transformed and resolved by a toolchain three majors from the
one that ships.** A green run said less than it appeared to. `@vitejs/plugin-react@6.0.4`
also declares `peerDependencies: { vite: "^8.0.0" }`, and `vitest.config.ts`
was loading that plugin into the 5.4.21 instance — an unsatisfied peer that
worked by luck.

Vitest 3 does not fix this: `vitest@3.2.7` still hard-depends on
`^5 || ^6 || ^7`, so it would keep a nested copy. Only Vitest 4 takes Vite 8
(`^6 || ^7 || ^8`, plus a non-optional peer) and dedupes onto the project's own.

It was a drop-in — no config changes, 90 tests pass, coverage still reports.
The tree is now a single `vite@8.1.5` everywhere.

### 2. `vitest.config.ts` extends `vite.config.ts` instead of restating it

Found while looking at the above. The two configs were standalone and had
already drifted: `vite.config.ts` defines an `@` → `src` alias, matching the
`paths` entry in `tsconfig.app.json`, and the test config declared neither.

Nothing imports through `@/` today, so the gap was invisible — but the first
module that did would have typechecked, built, and failed to resolve *only*
under test. `mergeConfig` makes the alias and the React plugin shared by
construction.

Verified rather than assumed: a throwaway test importing
`@/shared/lib/hash` resolves and runs under the merged config. (The first
version of that probe failed on its own assertion — `hashString` returns a
string, not a number — which is a good argument for writing the probe before
trusting the fix.)

### 3. `coverage/` is gitignored

`npm run test:coverage` was leaving an untracked directory behind.

## Files changed

### New
- `documentation/009-retro.md`

### Modified
- `package.json`, `package-lock.json` — `vitest` and `@vitest/coverage-v8` to ^4.1.10
- `vitest.config.ts` — merges the app config
- `.gitignore` — `coverage`
- `documentation/0.1-architecture.md` — test-config row, and a convention

Lint clean, typecheck clean, 90 tests pass, build clean.

## Decisions taken, not fixed

- **The remaining three moderate advisories stay.** They are one chain:
  `uuid` → `xcode` → `@capacitor/cli`. `npm audit fix --force` "fixes" it by
  *downgrading* `@capacitor/cli` 8.5.0 → 8.4.2, which is a breaking change and
  moves backwards. The advisory is a missing buffer bounds check in uuid v3/v5/v6
  when a `buf` argument is passed; the code path lives in `xcode`, which
  Capacitor's CLI uses at build time to manipulate iOS project files. Dev-only,
  never in the shipped bundle, not reachable from untrusted input. It clears
  when Capacitor bumps `xcode`. **Do not run `npm audit fix --force` on this
  repo.**

## Measured, and found not to be a problem

- **Audit count 11 → 3.** Both criticals and both highs were the nested Vite 5 /
  esbuild chain and went with it; `nanoid` and `postcss` cleared under a plain
  `npm audit fix`. None of the eleven ever shipped — they were all dev
  dependencies — which is why this was not a Play Store blocker, only a
  correctness one.
- **Test wall-clock is unchanged**, ~1.7–2.2s for 90 tests across both majors.
  The upgrade was not a performance trade.

## Open items

See [OPEN-ITEMS.md](OPEN-ITEMS.md). Unchanged by this session.
