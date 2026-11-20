# MPRES PROOF — a sensor whose input is dead reads red by name on the one state line

Unit mpres · forks rows 1177 (2) / 1191 · CLOUD BUILD SEAT · branch `claude/mpres-build` · written 20 Nov 2026.
The spec is `ci/mpres/MPRES_SPEC.md` at `e2e18d2` on `claude/mpres-spec`. Where the spec and the ruling differ, the
ruling wins, and every difference is named in §5. Every act is a row in `ci/mpres/LEDGER.jsonl`.

## 1 · The base

Cut from `origin/main` at the start of this seat, measured on 20 Nov 2026:

```
git fetch origin main && git rev-parse origin/main
5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90
```

`ci/mpres/BASE` holds that one line, so the unit ms1 member judges this witness against it.

## 2 · The witness, both ways (by last line)

Both trees are `git archive` LF trees under the scratch dir: BASE `5759cce`, and the build tip named in the ledger.

```
node ci/mpres/witness_mpres.mjs --org <lf build> --base-org <lf 5759cce>
GREEN MPRES a sensor whose input is dead reads red by name on the one state line, exits non-zero, and asks its launcher once per dead span · 18 clause(s)
(exit 0)

node ci/mpres/witness_mpres.mjs --org <lf 5759cce> --base-org <lf 5759cce>
RED MPRES · W1, W2, F9-ONCE, W12, F9-RED, W4, F7, W6, W10, W11, W3, W5, W7, W8, W9, W13
(exit 1)
```

Every behaviour clause is RED at base and GREEN at the build. BOUND and LAST are seat-time clauses and are GREEN both ways
(at base, BOUND compares the base with itself). W5 was a kept guard in the spec (green at base). Here it is RED at base,
because it asserts the fold's healthy verdict as well as the line's silence, and the fold does not exist at base.

The port class (row 1053), by construction. Every child the witness runs gets `--import <temp>/deadnet.mjs`, which
replaces `fetch` with a thrower that only records the URL. The witness process replaces its own `fetch` the same way. The
AW door is an RFC 6761 `.invalid` host, and the launcher door points at an absent path under the temp dir. A refusing
`claude`/`gemini` sits first on PATH. Nothing binds a port, and nothing reaches a live service or a daemon. At base, the
base organs dialled their hard-coded loopback default, and the dead network caught it; F7's RED shows it.

## 3 · The mutants

```
node ci/mpres/run_mutants_mpres.mjs --org <lf build> --base-org <lf 5759cce>
run_mutants: 16 of 16 mutant(s) RED by the clause that names them · control GREEN
```

Each mutant is listed in the runner's table, one per clause: W1 drops the snapshot, W2 resets dead_since, W3 says presence
is never dead, W4 drops the tail, W5 always prints `senses ✓`, W6 maps back to no_data, W7 reads dataOk as
truthy-by-default, W8 keys on have 0 alone, W9 drops the wired guard, W10 skips the stamp, W11 collapses to false, W12
exits 0, W13 treats absent as dead, F7 strips the env door, F9-ONCE asks every pass, F9-RED records every ask as asked.

## 4 · Each touched selftest, before and after (headline line)

Measured 20 Nov 2026. "base" is the base worktree and "build" is this branch. This box runs as root.

```
node scripts/presence.mjs selftest    base: ALL CHECKS PASSED              build: ALL CHECKS PASSED
node scripts/touchline.mjs selftest   base: ALL CHECKS PASSED              build: ALL CHECKS PASSED
node scripts/dmn.mjs selftest         base: ALL CHECKS PASSED              build: ALL CHECKS PASSED
node scripts/state.mjs selftest       base: state selftest: 24 passed, 0 failed    build: state selftest: 28 passed, 0 failed
node scripts/context.mjs selftest     base: ALL CHECKS PASSED              build: ALL CHECKS PASSED
node scripts/senses.mjs selftest      base: (no such organ)                build: senses selftest: 18 passed, 0 failed
node scripts/capture.mjs selftest     base: SELFTEST FAILED                build: SELFTEST FAILED
```

On this box, capture's two reds are the same two at base and at the build. Both are `CONCURRENT READER`. The held-handle
plant cannot hold against root. The three new mpres checks in capture are green.

### The member lines I touched (the hermetic suite, before and after)

```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      (git worktrees, 20 Nov 2026)
base  5759cce:  ok   SUITE MEMBER · touchline selftest exits 0
base  5759cce:  ok   SUITE MEMBER · presence selftest exits 0
base  5759cce:  ok   SUITE MEMBER · state selftest exits 0
base  5759cce:  LIVE selftest dmn / capture / context — not run in the hermetic profile (unchanged)
build:          ok   SUITE MEMBER · touchline selftest exits 0
build:          ok   SUITE MEMBER · presence selftest exits 0
build:          ok   SUITE MEMBER · state selftest exits 0
build:          ok   SUITE MEMBER · senses selftest exits 0          (new member, wired into organism:selftest)
build:          LIVE selftest dmn / capture / context — not run in the hermetic profile (unchanged)
```

The suite's last line, both ways: see the ledger rows `hermetic suite`. The reds at base and at the build are the same set
(the coverage law's four orphans `deck_lint, home_pin, probe, study_scope` · `sandbox` selftest on a root box · their
aggregate). `senses` is not an orphan.

### models check

```
node scripts/models.mjs check
models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)
(exit 0)
```

### The law pack counts, BASE and the build (row 1130 (2)), on LF trees, by command

```
node scripts/lawpack.mjs gate      BASE 5759cce:
lawpack · 1940 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7

node scripts/lawpack.mjs gate      BUILD:
lawpack · 1947 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7

node scripts/gates.mjs report      BASE 5759cce:  298 checkJs diagnostics · no-empty 272 · no-unused-vars 85
node scripts/gates.mjs report      BUILD:         298 checkJs diagnostics · no-empty 272 · no-unused-vars 85
```

The build raises no count. The first gates run of the build read `299 · 275 · 85`. The four new findings were removed at
their cause, in commit `c86b228`: a reason comment in each of three empty catches, and a typed probe variable in dmn's
selftest. No ignore line was added. Both trees are already RED against the frozen baselines, and they are RED by the
same amount: the law pack's `jugad-literal-subject-list` (frozen at a lower number), and the gates' type and lint
counts. That red is at base. It is not this unit's, and it is named here so no one mistakes it for this unit's.

## 5 · Where the build differs from the spec (the ruling wins)

- **F3 B, the table.** The spec proposed a new `senses` table, read by a new reader in `registry.mjs`. `registry.mjs`
  stays a fork, and its TABLES set is closed. So the table lives as the `mechanisms` row `senses`, which carries
  `subjects` (the enumeration: adding a sensor is a row edit) and `rows` (each sensor's file and input). The predicate is
  code, and it lives in `senses.mjs` `DEAD`. That shape needs no registry code change. It validates through the owner's
  own `set`: in a scratch copy, `set: 0 … "op":"added"` with no born-red row (ledger). This seat never ran it on the live
  file.
- **dmn's stamp.** The spec said to put the stamp into `dmn_precache.json`. It went into a dmn-owned `dmn_input.json`
  instead, because setpiece reads a same-day precache as a dream (`setpiece.mjs:497`, `:813`), and a stub would read as
  an empty dream.
- **F2 B reaches four owners.** presence, touchline, dmn (a gate-checked pass whose AFK read is dead) and capture pull
  (configured-missing) now exit non-zero. timeaudit, mirror and throwin are outside the named files, so they still exit
  0. Their own files already carry the dead input, and the line reads them (fork 2).
- **F9 B, bounded, holds in the registry row.** The `self_repair` row validates and is eligible (reversible, report
  anchor). presence reads it, and the bound is code: the ask is written into the snapshot before it is made, keyed to
  `dead_since`. So F9 does not come back as a fork.
- **W12's CLI leg.** It uses a planted dead network instead of an env door alone. That is because the base organ
  hard-codes its AW address, so an env door alone would have let the base dial loopback.

## 6 · The lander's acts (F3 B · F9 B) — written, never run by this seat

Seed the senses row: a command printed verbatim by `node scripts/senses.mjs status` while the row is absent.

```
node scripts/registry.mjs set --table mechanisms --json '{"subject":"senses","schema_owner":"senses.mjs","witness":"scripts/senses.mjs DEAD — one predicate per subject; ci/mpres/witness_mpres.mjs plants each both ways","subjects":["presence","touchline","timeaudit","dmn","mirror","capture","throwin"],"rows":[{"subject":"presence","owner":"presence.mjs","file":"presence_input.json","input":"activitywatch"},{"subject":"touchline","owner":"touchline.mjs","file":"pitch_read.json","input":"activitywatch"},{"subject":"timeaudit","owner":"timeaudit.mjs","file":"timeaudit.json","input":"activitywatch"},{"subject":"dmn","owner":"dmn.mjs","file":"dmn_input.json","input":"activitywatch"},{"subject":"mirror","owner":"mirror.mjs","file":"mirror_manifest.json","input":"capsule-gist"},{"subject":"capture","owner":"capture.mjs","file":"capture_pull.json","input":"drive-inbox"},{"subject":"throwin","owner":"throwin.mjs","file":"throwin_state.json","input":"ntfy"}],"notes":"unit mpres (forks rows 1177 (2) / 1191, F3 B): a sensor whose input is dead reads red by name on the one state line; a new sensor is a ROW ADD here plus its predicate in senses.mjs DEAD"}'
```

F9's one launcher. `<LAUNCHER>` is the one blank only his laptop can fill: the absolute path of ActivityWatch's own
launcher, which the runner read in rows 922/923. The row shape validated in a scratch copy (`op":"added"`, no born-red
row, presence's door reads it).

```
node scripts/registry.mjs set --table self_repair --json '{"subject":"activitywatch","artifact":"the ActivityWatch service (its own launcher, aw-qt)","launcher":"<LAUNCHER>","launcher_args":[],"reversible":true,"reverse_by":"quit ActivityWatch from its tray (the service it started is the one it already runs at login)","verified_by":"presence.mjs sense — the next pass reads the AW window bucket; presence_input.json alive:true","report_anchor":"the one state line (state.mjs senses tail: repair FAILED by name)","bound":"once per dead span (presence_input.json repair.span = dead_since); never a loop, never a second launcher","witness":"scripts/presence.mjs recordDeadInput + ci/mpres/witness_mpres.mjs F9-ONCE / F9-RED"}'
```

Until the self_repair row is seeded, presence asks nothing. It records `repair none (no self_repair row activitywatch)`,
and the line says `no repair door`. Until the senses row is seeded, the line says
`senses ? (no mechanisms/senses row (the lander seeds it))`. That is a stated unknown, not a red and not a pass.

## 7 · FORKS (files beyond the named ones — written here, not edited)

1. **F6 A ruled, `scripts/thalamus.mjs:3250` stays a fork.** The proposed edit is one row: `presence: { state:
   "event-only", why: "presence posts an afferent only on a leading edge; its liveness is presence_input.json, read by
   senses.mjs" }`.
2. **timeaudit / mirror / throwin exit codes (F2 B).** These three are outside the named files. On a dead input they still
   exit 0. Their own files carry it, and the line reads them. The edit is one line each, setting `process.exitCode = 1`
   on the dead branch (`timeaudit.mjs:458`, `mirror.mjs` main when `enumeration.ok === false && have === 0`,
   `throwin.mjs:614`).
3. **`setup/SURFACES.md:79`–`:81`** says presence.mjs and dmn.mjs hard-code the AW URL. That is false at this build (F7
   A). The doc should name `AW_API_BASE` (alias `ARSENAL_AW`) as the one door.
4. **The registry rows** in §6 are the lander's acts. No task is re-registered, and no setup script changes.

## 8 · Check runs

Read through the public API with no token after each push. The rows are in `ci/mpres/LEDGER.jsonl` (`act: "check runs"`).
