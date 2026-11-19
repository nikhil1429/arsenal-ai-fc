# MCOV PROOF — unit mcov (forks row 1137 (5), F7 A): the four orphaned selftests of the coverage red

Branch `claude/mcov-build`, cut from `origin/main` at `a583afba1427e6bca42167c55cba14a7b221b0c0` (`ci/mcov/BASE`), 19 Nov 2026.
Every output below is fenced: it is what a command printed on 19 Nov 2026 on LF trees (linux, node v22.23.5), never a claim.

## 1. The red, re-measured at the base

Member: `coverage` mode of `scripts/organism_test.mjs`. Assert at `scripts/organism_test.mjs:308` (base line numbers), detector
`hasSelftest` at `:289`, suite strings parsed from `package.json` at `:299-303`.

```
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs coverage      # at a583afb
  FAIL EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)
         orphaned: deck_lint, home_pin, probe, study_scope
organism_test: 9 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 0 (hermetic: named, not run)
```

## 2. Why each is orphaned (measured), and its ONE fate

| organ | why orphaned (by measurement) | live reads (`ci/mcov/tools/readprobe.mjs`) | fate |
|---|---|---|---|
| deck_lint | has a selftest verb (`deck_lint.mjs:117,153`); no package.json suite string names it since it was added (`git log -S "scripts/deck_lint.mjs" -- package.json` is empty) | none | (a) suite member, HERMETIC |
| probe | has a selftest verb (`probe.mjs:1351,2284`); no suite string ever named it (same `git log -S` empty) | none | (a) suite member, HERMETIC |
| home_pin | has a selftest verb (`home_pin.mjs:87,166`); no suite string ever named it; already in `LIVE_SELFTESTS` (`organism_test.mjs:119` base) | `state/captain.json` read twice, in-process, through `archivist.mjs`'s import (its top-level `captain()` calls); one `listen 0`; the fixture hook connects only to that ephemeral port | (a) suite member, LIVE in hermetic (dependency: `state/captain.json`), run in the full profile |
| study_scope | NO selftest verb (`study_scope.mjs:738-747` base: only `scope`, `unbound`); the detector matched the backticked word in its own header comment (`study_scope.mjs:42` base), so the law counted a selftest that did not exist; `selftest` printed the usage line and exited 0 | none | (b) a selftest verb is written (it runs the exported `scopeSelfCheck()` cases), then suite member, HERMETIC |

How the reads were measured: `MCOV_PROBE_LOG=<log> MCOV_PROBE_ROOT=<repo> NODE_OPTIONS=--import=ci/mcov/tools/readprobe.mjs node scripts/<organ>.mjs selftest`
(the preload journals every fs call under `dressing-room/state`, every connect and every listen, in the selftest and every child).

Note: `probe selftest` reads RED (`175/176`, V32-26 `ERR_MODULE_NOT_FOUND`) on a checkout with no `node_modules`; after `npm ci`,
as the suite workflow does, it is GREEN. Its hermetic fate stands on the CI install.

## 3. The build (named files only)

- `scripts/organism_test.mjs` — `SUITE_ROSTER` (the four), counted as ONE suite by `coverage()` (so a roster organ also in a
  package.json string reds as double-billed, and a roster name with no file reds as a ghost), appended by `suiteMembers()`, so
  `suites()` spawns and asserts each, and the hermetic profile names `home_pin` LIVE from its existing table entry. No
  exemption line; the coverage law, its detector and its floor are unchanged.
- `scripts/study_scope.mjs` — a `selftest` verb (prints each case, a headline, exit 1 on any fail) and its header comment
  corrected.
- `ci/mcov/` — `BASE`, `LEDGER.jsonl`, `PROOF.md`, `witness_mcov.mjs`, `run_mutants_mcov.mjs`, `tools/readprobe.mjs`.

## 4. Each touched selftest, before and after (headline line)

```
deck_lint   base: deck_lint selftest 13/13 — all clauses hold          head: deck_lint selftest 13/13 — all clauses hold
home_pin    base: home_pin selftest: 16 passed, 0 failed               head: home_pin selftest: 16 passed, 0 failed
probe       base: probe selftest: 176/176 ok · GREEN                   head: probe selftest: 176/176 ok · GREEN
study_scope base: study_scope: scope --session <id> | unbound … (the usage line, exit 0)
            head: study_scope selftest: 61 passed, 0 failed
```

## 5. Member lines touched, before and after

```
coverage (hermetic)        base: FAIL EVERY organ with a selftest is wired into a suite … orphaned: deck_lint, home_pin, probe, study_scope
                           head: ok   EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)
coverage line              base: organism_test: 9 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 0 (hermetic: named, not run)
                           head: organism_test: 10 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 0 (hermetic: named, not run)
suites (hermetic)          base: (no SUITE MEMBER line for any of the four)
                           head: ok   SUITE MEMBER · deck_lint selftest exits 0
                                 LIVE selftest home_pin — not run in the hermetic profile: reads state/captain.json · …
                                 ok   SUITE MEMBER · probe selftest exits 0
                                 ok   SUITE MEMBER · study_scope selftest exits 0
suites line (head)         organism_test: 60 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 72 (hermetic: named, not run)
all (hermetic), in this checkout at head:
                           organism_test: 149 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 126 (hermetic: named, not run)
all (hermetic), fresh scratch clones, FIRST run of each:
                           base:  organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
                           head:  organism_test: 147 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 126 (hermetic: named, not run)
                           (the shared red on both is `SUITE MEMBER · sandbox selftest exits 0` and its roll-up — FORK F5)
```

## 6. The witness, both ways

```
$ node ci/mcov/witness_mcov.mjs --org . --base-org <clone of a583afb>
BOUND · 6 path(s) differ between the orgs: ci/mcov/BASE, ci/mcov/LEDGER.jsonl, ci/mcov/tools/readprobe.mjs, ci/mcov/witness_mcov.mjs, scripts/organism_test.mjs, scripts/study_scope.mjs
HOLDS C1 COVERAGE · base RED (orphaned: deck_lint, home_pin, probe, study_scope) · build GREEN (wired, no orphan)
HOLDS C2 HERMETIC · base RED (not judged green: deck_lint, probe, study_scope) · build GREEN (deck_lint, probe, study_scope judged ok)
HOLDS C3 LIVE-NAMED · base RED (home_pin neither named nor run) · build GREEN (home_pin named LIVE)
HOLDS C4 VERB · base RED (exit 0 · last line: study_scope: scope --session <id> | unbound …) · build GREEN (exit 0 · last line: study_scope selftest: 61 passed, 0 failed)
LAST · no process names the temp dir
GREEN MCOV the four coverage orphans wired, each in its profile · 4 clause(s)
```

Each clause reads RED on the base clone and GREEN on the build clone in that one run (both ways). Run with the base as
`--org` and itself as `--base-org`, every clause reads BROKEN and the last line is `RED MCOV · C1 COVERAGE, C2 HERMETIC, C3 LIVE-NAMED, C4 VERB` (exit 1).

## 7. The mutants

```
$ node ci/mcov/run_mutants_mcov.mjs --org .
control · C1 COVERAGE GREEN · C2 HERMETIC GREEN · C3 LIVE-NAMED GREEN · C4 VERB GREEN
mutant C1 COVERAGE · RED by its clause (orphaned: deck_lint) — deck_lint dropped from the roster
mutant C2 HERMETIC · RED by its clause (not judged green: deck_lint, probe, study_scope) — suites() skips the roster's hermetic members
mutant C3 LIVE-NAMED · RED by its clause (home_pin judged as a hermetic member) — home_pin's LIVE entry deleted (it would run hermetic)
mutant C4 VERB · RED by its clause (exit 0 · last line: study_scope: scope … | selftest …) — the selftest verb no longer answers
run_mutants: 4 of 4 mutant(s) RED by the clause that names them · control GREEN
```

## 8. Law pack counts, BASE and build (`node scripts/lawpack.mjs gate`, LF trees, 19 Nov 2026)

```
BASE  lawpack · 1928 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
build lawpack · 1928 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
both  lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)   (jugad 93 vs baseline 90 · depcruise 13 vs baseline 7: the same on BASE, not raised here)
```

The two whole outputs are byte-identical (`diff` empty). No count rose.

Also (TIER 0, same both trees): `npx tsc -p tsconfig.json --noEmit` prints the same error set on BASE and build (positions folded,
`diff` empty); `npx eslint scripts/organism_test.mjs scripts/study_scope.mjs ci/mcov/` exits 0.

## 9. LAW M

```
$ node scripts/models.mjs check
models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)
exit 0
```

## 10. The neutral machine

Read with `curl https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` (no token). The runs of each
pushed sha are rows of `ci/mcov/LEDGER.jsonl` (act `ci`).

## 11. FORKS (each the architect's to rule)

- **F1 · where the four are wired.** `package.json` is beyond the named files, so the roster lives in `organism_test.mjs`
  (`SUITE_ROSTER`). (A) it stays · (B) at landing the four join a package.json suite string and the roster is emptied in the
  SAME commit (the double-billing assert reds a half-move). **Recommend B**: `organism_test.mjs:61-69` makes the suite strings
  the one membership record.
- **F2 · home_pin could be hermetic.** Its only live read is `state/captain.json` through `archivist.mjs`'s import-time
  `captain()` calls; nothing in its verdict reads it. (A) it stays LIVE · (B) a unit makes that read lazy in `archivist.mjs`
  and takes home_pin off `LIVE_SELFTESTS`. Its table reason also says it "reaches a localhost port it does not listen on":
  measured, the only connects are its fixture hook reaching the selftest's own `listen(0)` stub. **Recommend B**, its own unit.
- **F3 · the coverage detector reads comments.** `hasSelftest` (`organism_test.mjs:289` base) matched study_scope's header
  comment, so a file with no verb counted as having a selftest, and `selftest` on it printed usage and exited 0 (a member that
  could never go red). (A) leave · (B) a unit requires a dispatch on the word, with a census of what moves. **Recommend B.**
- **F4 · scopeSelfCheck runs twice in the full profile** (turn_hook's selftest and study_scope's). (A) keep · (B) turn_hook
  drops its call. **Recommend A**: turn_hook is LIVE in the hermetic profile, and the cases cost little.
- **F5 · the hermetic `all` is not a function of the tree alone.** In a fresh clone under the scratch dir, `sandbox selftest` reds
  on BASE and build alike (its tripwire recorded 2 of 4 attempts), and a SECOND `all` in the same clone opens about ten more
  asserts (the `LOAD ZERO` / `RUNG A` ledger block) because run 1 left gitignored files in that clone's state dir. Named, not
  chased: neither is this unit's, and the CI runner judges a fresh tree once.
- **F6 · the two law pack REDs** (jugad 93/90, depcruise 13/7) are on BASE as on the build: mlaw's, not this unit's.
- **F7 · the branch.** The harness opened this session on `claude/mcov-effort-receipt-76c5ko` (carrying the settings key
  commit `f9fd723`), not `claude/mcov-queue`; the build branch was cut from `origin/main` as the brief says, and carries no
  settings change.
