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

FOLLOW-UP (forks row 1143 (1), 19 Nov 2026, F1 ruled B): the first build wired the four through a `SUITE_ROSTER` list in
`scripts/organism_test.mjs` (commits `01727fd`..`fed58b2`). The ruling moved them, by a seat follow-up, into the ONE record:

- `package.json` — the four are appended to the `organism:selftest` string (`deck_lint`, `home_pin`, `probe`, `study_scope`,
  each `node scripts/<organ>.mjs selftest`). The `suites()` runner spawns and asserts each as a member, and the hermetic
  profile names `home_pin` LIVE from its existing `LIVE_SELFTESTS` entry.
- `scripts/organism_test.mjs` — the roster is REMOVED in the same commit; the file is byte-equal to the base again (the BOUND
  line no longer lists it). No exemption line; the coverage law, its detector and its floor are unchanged.
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
all (hermetic), in this checkout at head (re-measured after the follow-up, the same line):
                           organism_test: 149 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 126 (hermetic: named, not run)
all (hermetic), fresh scratch clones, FIRST run of each:
                           base:  organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
                           head:  organism_test: 147 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 126 (hermetic: named, not run)
                           (the shared red on both is `SUITE MEMBER · sandbox selftest exits 0` and its roll-up — FORK F5)
```

## 6. The witness, both ways (after the follow-up, 19 Nov 2026)

```
$ node ci/mcov/witness_mcov.mjs --org . --base-org <clone of a583afb>
BOUND · 8 path(s) differ between the orgs: ci/mcov/BASE, ci/mcov/LEDGER.jsonl, ci/mcov/PROOF.md, ci/mcov/run_mutants_mcov.mjs, ci/mcov/tools/readprobe.mjs, ci/mcov/witness_mcov.mjs, package.json, scripts/study_scope.mjs
HOLDS C1 COVERAGE · base RED (orphaned: deck_lint, home_pin, probe, study_scope) · build GREEN (wired, no orphan)
HOLDS C2 HERMETIC · base RED (not judged green: deck_lint, probe, study_scope) · build GREEN (deck_lint, probe, study_scope judged ok)
HOLDS C3 LIVE-NAMED · base RED (home_pin neither named nor run) · build GREEN (home_pin named LIVE)
HOLDS C4 VERB · base RED (exit 0 · last line: study_scope: scope --session <id> | unbound …) · build GREEN (exit 0 · last line: study_scope selftest: 61 passed, 0 failed)
HOLDS C5 ONE RECORD · base RED (deck_lint in 0 suite string(s) · home_pin in 0 suite string(s) · probe in 0 suite string(s) · study_scope in 0 suite string(s)) · build GREEN (one record: package.json only, no member list in the suite file)
LAST · no process names the temp dir
GREEN MCOV the four coverage orphans wired in package.json, each in its profile · 5 clause(s)
```

C5 (forks row 1143 (1)) reads a "member list" as an array literal in `scripts/organism_test.mjs` (parsed with acorn) holding two
or more string elements that are exactly names of package.json suite members. Measured at head: zero such arrays; the
removed roster was one (the C5 mutant re-adds it and C5 names it at its line). Single-organ spawn argv (for example a
`"--q", "probe"` argument) is not a list. Before the follow-up the witness ran with four clauses and read
`GREEN MCOV the four coverage orphans wired, each in its profile · 4 clause(s)` (19 Nov 2026, tip `0bc4617`).

## 7. The mutants (after the follow-up, 19 Nov 2026)

```
$ node ci/mcov/run_mutants_mcov.mjs --org .
control · C1 COVERAGE GREEN · C2 HERMETIC GREEN · C3 LIVE-NAMED GREEN · C4 VERB GREEN · C5 ONE RECORD GREEN
mutant C1 COVERAGE · RED by its clause (orphaned: deck_lint) — deck_lint dropped from its package.json suite string
mutant C2 HERMETIC · RED by its clause (not judged green: deck_lint, probe, study_scope) — suites() skips the three hermetic members
mutant C3 LIVE-NAMED · RED by its clause (home_pin judged as a hermetic member) — home_pin's LIVE entry deleted (it would run hermetic)
mutant C4 VERB · RED by its clause (exit 0 · last line: study_scope: scope … | selftest …) — the selftest verb no longer answers
mutant C5 ONE RECORD · RED by its clause (member list organism_test.mjs:71 [deck_lint, home_pin, probe, study_scope]) — a second member list beside package.json (the removed roster, re-added)
run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
```

## 8. Law pack counts, BASE and build (`node scripts/lawpack.mjs gate`, LF trees, 19 Nov 2026; build re-measured after the follow-up, same line)

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

- **F1 · where the four are wired — RULED B (forks row 1143 (1), 19 Nov 2026), BUILT** by the seat follow-up: the four are in
  the `organism:selftest` string and the roster is removed from the suite file; C5 holds it.
- **F2 · home_pin could be hermetic.** Its only live read is `state/captain.json` through `archivist.mjs`'s import-time
  `captain()` calls; nothing in its verdict reads it. (A) it stays LIVE · (B) a unit makes that read lazy in `archivist.mjs`
  and takes home_pin off `LIVE_SELFTESTS`. Its table reason also says it "reaches a localhost port it does not listen on":
  measured, the only connects are its fixture hook reaching the selftest's own `listen(0)` stub. **Recommend B**, its own unit. RULED (forks row 1143 (2)): it goes to unit mlaw2.
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
