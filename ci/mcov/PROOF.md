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
- `scripts/organism_test.mjs` — the roster is REMOVED in the same commit (at `1a4a275` the file was byte-equal to the base).
  No exemption line; the coverage law, its detector and its floor are unchanged.

FOLLOW-UP (forks row 1151 (1), 19 Nov 2026): on his laptop the probe selftest alone takes longer than the run helper's
default bound, and the member run killed it and read the kill as a plain non-zero exit. In `scripts/organism_test.mjs`:

- (b) `HEAVY_BOUND_MS` names, once, the long bound the heavy modes (gates, lawpack, flow_atlas) each typed; those three
  sites now read it, so no new number is typed. A suite member's run takes it in `suites()`, and so does `hermetic()`'s
  selftest loop, so the identical-command key that hands a hermetic result to `suites()` still matches (ONE RUN PER
  SELFTEST, row 880 (1)). The run helper's own default is unchanged.
- (a) the run helper returns `killed: <bound>` when its bound kills the child; `redWhy()` turns that into
  `killed by the suite bound (<bound> ms) — not an exit code`, which is the member assert's FAIL detail and the roll-up's
  tail. The assert NAME is unchanged, so the neutral verdict compares the same names across trees.
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
all (hermetic), in this checkout at head (re-measured at `1a4a275` and at `12e7e09`, the same line; at `12e7e09` `suites: reused 55 of 127 member result(s) from hermetic (identical command), ran 72`, so the long-bound key still matches):
                           organism_test: 149 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 126 (hermetic: named, not run)
all (hermetic), fresh scratch clones, FIRST run of each:
                           base:  organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
                           head:  organism_test: 147 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 126 (hermetic: named, not run)
                           (the shared red on both is `SUITE MEMBER · sandbox selftest exits 0` and its roll-up — FORK F5)
```

## 6. The witness, both ways (after the row 1151 follow-up, 19 Nov 2026, tip `12e7e09`; wall time 12 min, the hang plant's bound)

```
$ node ci/mcov/witness_mcov.mjs --org . --base-org <clone of a583afb>
BOUND · 9 path(s) differ between the orgs: ci/mcov/BASE, ci/mcov/LEDGER.jsonl, ci/mcov/PROOF.md, ci/mcov/run_mutants_mcov.mjs, ci/mcov/tools/readprobe.mjs, ci/mcov/witness_mcov.mjs, package.json, scripts/organism_test.mjs, scripts/study_scope.mjs
HOLDS C1 COVERAGE · base RED (orphaned: deck_lint, home_pin, probe, study_scope) · build GREEN (wired, no orphan)
HOLDS C2 HERMETIC · base RED (not judged green: deck_lint, probe, study_scope) · build GREEN (deck_lint, probe, study_scope judged ok)
HOLDS C3 LIVE-NAMED · base RED (home_pin neither named nor run) · build GREEN (home_pin named LIVE)
HOLDS C4 VERB · base RED (exit 0 · last line: study_scope: scope --session <id> | unbound --session <id> [--transcript p] [--prompt "…"] [--entrypoint e]   (read-only; the hook path is t) · build GREEN (exit 0 · last line: study_scope selftest: 61 passed, 0 failed)
HOLDS C5 ONE RECORD · base RED (deck_lint in 0 suite string(s) · home_pin in 0 suite string(s) · probe in 0 suite string(s) · study_scope in 0 suite string(s)) · build GREEN (one record: package.json only, no member list in the suite file)
HOLDS C6 SLOW-GREEN · base RED (judged red: FAIL SUITE MEMBER · mcov_slow selftest exits 0 FAIL SUITE MEMBER · mcov_hang selftest exits 0) · build GREEN (slept 120000 ms (the helper default) and was judged ok)
HOLDS C7 HANG-NAMED · base RED (not named: detail "LIVE selftest capture — not run in the hermetic profile: reads state/heartbeat_config.json" · roll-up does not name a kill) · build GREEN (named: killed by the suite bound (600000 ms) — not an exit code · roll-up names it)
LAST · no process names the temp dir
GREEN MCOV the four coverage orphans wired in package.json, each in its profile, a member's kill named · 7 clause(s)
```

C5 (forks row 1143 (1)) reads a "member list" as an array literal in `scripts/organism_test.mjs` (parsed with acorn) holding two
or more string elements that are exactly names of package.json suite members. Measured at head: zero such arrays; the
removed roster was one (the C5 mutant re-adds it and C5 names it at its line). Single-organ spawn argv (for example a
`"--q", "probe"` argument) is not a list.

C6 / C7 (forks row 1151 (1)) ride one extra clone per tree: two plant files (`scripts/mcov_slow.mjs` sleeps the run helper's
default bound, read from that tree's own source; `scripts/mcov_hang.mjs` never exits) appended to that clone's
`organism:selftest` string only. On the base the slow member is killed at the helper's default and the hang's red reads
as a bare exit (its FAIL line carries no detail, and the roll-up names no kill); on the build the slow member is judged ok
and the hang is named `killed by the suite bound (600000 ms) — not an exit code` in its FAIL detail and in the roll-up.

Earlier tips, for the record (19 Nov 2026): `0bc4617` read `GREEN MCOV … · 4 clause(s)`; `1a4a275` read `GREEN MCOV … · 5 clause(s)`.

## 7. The mutants (after the row 1151 follow-up, 19 Nov 2026, tip `12e7e09`)

```
$ node ci/mcov/run_mutants_mcov.mjs --org .
mutant C1 COVERAGE · RED by its clause (orphaned: deck_lint) — deck_lint dropped from its package.json suite string
mutant C2 HERMETIC · RED by its clause (not judged green: deck_lint, probe, study_scope) — suites() skips the three hermetic members
mutant C3 LIVE-NAMED · RED by its clause (home_pin judged as a hermetic member) — home_pin's LIVE entry deleted (it would run hermetic)
mutant C4 VERB · RED by its clause (exit 0 · last line: study_scope: scope --session <id> | unbound --session <id> [--transcript p] [--prompt "…"] [--entrypoint e] | selftest   (read-only; the hoo) — the selftest verb no longer answers
mutant C5 ONE RECORD · RED by its clause (member list organism_test.mjs:82 [deck_lint, home_pin, probe, study_scope]) — a second member list beside package.json (the removed roster, re-added)
mutant C6 SLOW-GREEN · RED by its clause (judged red: FAIL SUITE MEMBER · mcov_slow selftest exits 0 killed by the suite bound (120000 ms) — not an exit code) — the suites member run back on the helper's default bound (a race, not a hang guard)
mutant C7 HANG-NAMED · RED by its clause (not named: detail "exit null" · roll-up does not name a kill) — a kill by the bound read as a bare exit again
control · C1 COVERAGE GREEN · C2 HERMETIC GREEN · C3 LIVE-NAMED GREEN · C4 VERB GREEN · C5 ONE RECORD GREEN · C6 SLOW-GREEN GREEN · C7 HANG-NAMED GREEN
run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN
```

## 8. Law pack counts, BASE and build (`node scripts/lawpack.mjs gate`, LF trees, 19 Nov 2026; build re-measured at `1a4a275` and at `12e7e09`, the same line)

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

```
12e7e09  135503765187 npm test · node 22 success · 135503765871 npm test · node 24 success
1a4a275  135454191058 npm test · node 22 success · 135454190348 npm test · node 24 success
fed58b2  135306767180 npm test · node 22 success · 135306766855 npm test · node 24 success
```


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
- **F8 · the witness waits the real long bound.** C7's hang plant is ended only by the suite runner's own bound, so one
  witness run takes that long (12 min, 19 Nov 2026), and so does the mutant runner (its planted runs go concurrently). No
  door shortens it: a door that lowers the member bound for a test is a second number. (A) it stays · (B) a lower-only
  env door for the member bound, planted by the witness. **Recommend A**.
- **F7 · the branch.** The harness opened this session on `claude/mcov-effort-receipt-76c5ko` (carrying the settings key
  commit `f9fd723`), not `claude/mcov-queue`; the build branch was cut from `origin/main` as the brief says, and carries no
  settings change.


## 12. RE-CUT ON land/mgat 1b8c379 (Runner M, rows 1158 (1) / 1166 (2) / 1168 (2), 19 Nov 2026)

Main moved to `5759cce`; `land/mgat` `1b8c379e6551b34124ed6070aac2ed9208c8076c` is mgat on it. The three-way merge of this
branch onto it was not clean, so the seat merged it (merge commit `d74f9d4`, parents `2684b64` and `1b8c379`; no rebase,
no force) and `ci/mcov/BASE` is now `1b8c379`. The diff from the new base is exactly the named files (`git diff --name-only
1b8c379 HEAD`): `ci/mcov/*`, `package.json`, `scripts/organism_test.mjs`, `scripts/study_scope.mjs`.

THE RESOLUTION HUNKS, both sides' intent kept:
- `package.json` `organism:selftest`: main appended `rung_receipt` and mcov appended its four at the same tail. Measured, the
  two lines were the same string with those tails removed. Resolved as main's line plus mcov's four after it:
  `… && node scripts/night.mjs selftest && node scripts/rung_receipt.mjs selftest && node scripts/deck_lint.mjs selftest &&
  node scripts/home_pin.mjs selftest && node scripts/probe.mjs selftest && node scripts/study_scope.mjs selftest`.
- `scripts/organism_test.mjs` `gates()`: mgat made the hermetic profile run `gates.mjs lint` (the ajv half named LIVE) with a
  typed `{ timeout: 600000 }`; mcov had named that value once as `HEAVY_BOUND_MS`. Resolved as mgat's hunk with
  `{ timeout: HEAVY_BOUND_MS }`, so the file still types the value once (`grep -n 600000` finds only line 57).

```
$ node ci/mcov/witness_mcov.mjs --org . --base-org <clone of 1b8c379>      # on the merged tree, 19 Nov 2026
BOUND · 9 path(s) differ between the orgs: ci/mcov/BASE, ci/mcov/LEDGER.jsonl, ci/mcov/PROOF.md, ci/mcov/run_mutants_mcov.mjs, ci/mcov/tools/readprobe.mjs, ci/mcov/witness_mcov.mjs, package.json, scripts/organism_test.mjs, scripts/study_scope.mjs
HOLDS C1 COVERAGE · base RED (orphaned: deck_lint, home_pin, probe, study_scope) · build GREEN (wired, no orphan)
HOLDS C2 HERMETIC · base RED (not judged green: deck_lint, probe, study_scope) · build GREEN (deck_lint, probe, study_scope judged ok)
HOLDS C3 LIVE-NAMED · base RED (home_pin neither named nor run) · build GREEN (home_pin named LIVE)
HOLDS C4 VERB · base RED (exit 0 · last line: study_scope: scope --session <id> | unbound --session <id> [--transcript p] [--prompt "…"] [--entrypoint e]   (read-only; the hook path is t) · build GREEN (exit 0 · last line: study_scope selftest: 61 passed, 0 failed)
HOLDS C5 ONE RECORD · base RED (deck_lint in 0 suite string(s) · home_pin in 0 suite string(s) · probe in 0 suite string(s) · study_scope in 0 suite string(s)) · build GREEN (one record: package.json only, no member list in the suite file)
HOLDS C6 SLOW-GREEN · base RED (judged red: FAIL SUITE MEMBER · mcov_slow selftest exits 0 FAIL SUITE MEMBER · mcov_hang selftest exits 0) · build GREEN (slept 120000 ms (the helper default) and was judged ok)
HOLDS C7 HANG-NAMED · base RED (not named: detail "LIVE selftest capture — not run in the hermetic profile: reads state/heartbeat_config.json" · roll-up does not name a kill) · build GREEN (named: killed by the suite bound (600000 ms) — not an exit code · roll-up names it)
LAST · no process names the temp dir
GREEN MCOV the four coverage orphans wired in package.json, each in its profile, a member's kill named · 7 clause(s)
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs coverage    # merged tree
organism_test: 10 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 0 (hermetic: named, not run)
```

Not re-run on the merged tree (named, not claimed): the mutants (last read at `12e7e09`: 7 of 7 RED, control GREEN), the law
pack, the whole hermetic run, and the neutral legs of the new tip; the architect re-runs once.

SUPERSEDED by section 13 (row 1172) · was: CHECKPOINT · STOPPED at 22:30 UTC 19 Nov 2026 · tip = the commit that carries this line (its parent `45f852b`, merge
`d74f9d4`) · resolution hunks: package.json organism:selftest tail, organism_test.mjs gates() run bound · resume from: the
architect's re-run


## 13. RE-MERGE OF MAIN 5759cce (row 1172, 20 Nov 2026) — section 12's land/mgat merge reverted

`land/mgat` `1b8c379` read RED on both neutral legs and will not land now, so this branch carried mgat's bytes. Done, in
order (new commits only; no force push, no history rewrite):

1. `git revert -m 1 d74f9d4` → `b03ad49`. After it, the tree outside `ci/mcov/` equals the pre-merge tip `2684b64`.
2. Main `5759cce` is an ANCESTOR of `1b8c379`, so after the revert a plain `git merge 5759cce` is a no-op (git counts it as
   already merged) and would leave main's changes reverted. So the real merge of `2684b64` with `5759cce` was made on a
   scratch branch (merge `6046fdf`, deleted after), and recorded on this branch as the merge commit `5bb30d0` whose parents
   are `b03ad49` and `5759cce`, whose tree is `6046fdf`'s outside `ci/mcov/` and this branch's `ci/mcov/`. Checked:
   `git diff 6046fdf HEAD -- . ':!ci'` is empty, so outside `ci/` the tree equals the pre-merge tip merged with main.
3. `ci/mcov/BASE` = `5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90` (`cbf7a05`). `git diff --name-only 5759cce HEAD` lists exactly
   the named files: `ci/mcov/*`, `package.json`, `scripts/organism_test.mjs`, `scripts/study_scope.mjs`.

THE RESOLUTION HUNK (the one conflict with main): `package.json` `organism:selftest`. Main appended `rung_receipt` and mcov its
four at the same tail. Measured: the two lines were the same string with those tails removed. Resolved as main's line,
then mcov's four: `… && node scripts/night.mjs selftest && node scripts/rung_receipt.mjs selftest && node scripts/deck_lint.mjs
selftest && node scripts/home_pin.mjs selftest && node scripts/probe.mjs selftest && node scripts/study_scope.mjs selftest`.
`scripts/organism_test.mjs` merged with main cleanly (its conflict in section 12 was with mgat's `gates()` hunk, now gone).

```
$ node ci/mcov/witness_mcov.mjs --org . --base-org <clone of 5759cce>      # re-merged tree, 20 Nov 2026
BOUND · 9 path(s) differ between the orgs: ci/mcov/BASE, ci/mcov/LEDGER.jsonl, ci/mcov/PROOF.md, ci/mcov/run_mutants_mcov.mjs, ci/mcov/tools/readprobe.mjs, ci/mcov/witness_mcov.mjs, package.json, scripts/organism_test.mjs, scripts/study_scope.mjs
HOLDS C1 COVERAGE · base RED (orphaned: deck_lint, home_pin, probe, study_scope) · build GREEN (wired, no orphan)
HOLDS C2 HERMETIC · base RED (not judged green: deck_lint, probe, study_scope) · build GREEN (deck_lint, probe, study_scope judged ok)
HOLDS C3 LIVE-NAMED · base RED (home_pin neither named nor run) · build GREEN (home_pin named LIVE)
HOLDS C4 VERB · base RED (exit 0 · last line: study_scope: scope --session <id> | unbound --session <id> [--transcript p] [--prompt "…"] [--entrypoint e]   (read-only; the hook path is t) · build GREEN (exit 0 · last line: study_scope selftest: 61 passed, 0 failed)
HOLDS C5 ONE RECORD · base RED (deck_lint in 0 suite string(s) · home_pin in 0 suite string(s) · probe in 0 suite string(s) · study_scope in 0 suite string(s)) · build GREEN (one record: package.json only, no member list in the suite file)
HOLDS C6 SLOW-GREEN · base RED (judged red: FAIL SUITE MEMBER · mcov_slow selftest exits 0 FAIL SUITE MEMBER · mcov_hang selftest exits 0) · build GREEN (slept 120000 ms (the helper default) and was judged ok)
HOLDS C7 HANG-NAMED · base RED (not named: detail "LIVE selftest capture — not run in the hermetic profile: reads state/heartbeat_config.json" · roll-up does not name a kill) · build GREEN (named: killed by the suite bound (600000 ms) — not an exit code · roll-up names it)
LAST · no process names the temp dir
GREEN MCOV the four coverage orphans wired in package.json, each in its profile, a member's kill named · 7 clause(s)
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs coverage    # re-merged tree
organism_test: 10 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 0 (hermetic: named, not run)
```

Not re-run on this tree (named, not claimed): the mutants (last read at `12e7e09`: 7 of 7 RED, control GREEN), the law pack,
the whole hermetic run and the neutral legs of the new tip; the architect re-runs once.

CHECKPOINT · STOPPED at 01:40 UTC 20 Nov 2026 · tip = the commit that carries this line (parent `cbf7a05`; re-merge `5bb30d0`; revert `b03ad49`) · base 5759cce · resolution hunk: package.json organism:selftest tail (main's rung_receipt, then mcov's four) · resume from: the architect's re-run
