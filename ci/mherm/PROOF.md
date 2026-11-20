# MHERM PROOF — the hermetic run becomes a function of the tree alone

Unit mherm · forks rows 1151 (3) / 1157 / 1178 (2) / 1200 (4) · branch `claude/mherm-build`.
Every measurement here is a command; its last line is a row of `ci/mherm/LEDGER.jsonl`. Measured 20 Nov 2026 on Linux,
node v22.23.5, unless a line says otherwise. Windows is read from the neutral machine (§10), never guessed.

## 1. The base

- Cut from `origin/main` at **`cebe3ebe4024c2144b934b3032b3fb837285d926`** (units mlaw and mcov on it): `git fetch origin main`,
  `git checkout -b claude/mherm-build origin/main`. `ci/mherm/BASE` holds that sha, one line.
- The spec read whole: `git show f99089b:ci/mherm/MHERM_SPEC.md`, with its `LEDGER.jsonl` (the only sibling file at f99089b).
  The spec's base was fb42118.

### Q4 re-measured at the cut (each `file:line` of the spec, at cebe3eb)

| spec (fb42118) | at cebe3eb | moved? |
|---|---|---|
| `sandbox.mjs:90-94` (buildSandbox mkdirs), `:114-139` (env), `:200-201` (canary targets), `:312` (selftest), `:334` (never created) | the same lines | no |
| `organism_test.mjs:53-56` `run()` | `:66-68` | **moved** (mlaw / mcov added the bound names above it) |
| `organism_test.mjs:1600` / `:1603` / `:1610` (ledger block, read, gate) | `:1623` / `:1626` / `:1633` | **moved** |
| `organism_test.mjs:1613` / `:1616` / `:1635` (LOAD ZERO ×2, S7 RATCHET) | `:1636` / `:1639` / `:1658` | **moved** |
| `organism_test.mjs:1720` (RUNG A) | first RUNG A assert `:1708` | **moved** |
| `organism_test.mjs:386` (the suite-members roll-up) | `:409` | **moved** |
| `audit_preload.mjs:91` (`TMP`), `:131` (the temp allowance) | the same lines | no |
| `tone.mjs:43` (writeAtomic), `:58` (tone.log), `:176`, `:182-183` | the same lines | no |
| `suite.yml:131` (the base clone) | `:127` | **moved** |

A temp leaker the spec did not have exists at the cut: **`done.mjs:263`** (`mkdtempSync(join(tmpdir(), "done-selftest-"))`),
beside the spec's `hippocampus.mjs:1251/1259/1268/1347/1356/1500/1556`, `harvest.mjs:245/312`, `mirror.mjs:316`, `pulse.mjs:355`.
T2 covers it like the others (§4, W4).

## 2. What was built (the named files only)

| # | file | change |
|---|---|---|
| T1 | `scripts/sandbox.mjs` | `buildSandbox` makes `<root>/.tmp`; the child env sets `TMPDIR`, `TEMP`, `TMP` to it |
| T2 | `scripts/organism_test.mjs` | one `mkdtempSync(join(tmpdir(), "organism-run-"))` per process (`RUN_TMP`), set as `TMPDIR`/`TEMP`/`TMP` in `process.env` (so this process and every inheriting child use it) and added to every `run()` spawn handed its own env; removed on `exit` |
| T3 | `scripts/organism_test.mjs` | under the hermetic profile the brain-ledger block is one `liveNamed` line (`LOAD ZERO · the brain-ledger lane block …`, reason: gitignored, absent in a fresh tree, born by a run); the full profile reads the ledger as before (F3 A) |
| T4 | `scripts/tone.mjs` | `writeAtomic(path, obj, attempts = 5, logDir = __dirname)`; the selftest passes its own box and reads the line there |
| F1 B | `scripts/audit_preload.mjs` | the collar's temp allowance (`if (under(p, TMP)) return true`) dropped, with the `TMP` const and the `os` import it left unused |
| F2 C · W1 W3 | `scripts/organism_test.mjs` | `mhermClauses()` in the `hermetic` mode: a `git ls-files` copy of the tree under `RUN_TMP`; W3 `laws` without and with a planted ledger, W1 the copy's sandbox selftest |
| F2 C · W2 W4 W5 | `.github/workflows/suite.yml` | the job `hermetic-twice` (matrix node 22, 24): a fresh clone of HEAD under `os.tmpdir()`, the hermetic `all` twice, `TMPDIR`/`TEMP`/`TMP` = the dir that holds the clone; prints each run's wall time |
| witness | `ci/mherm/witness_mherm.mjs`, `ci/mherm/run_mutants_mherm.mjs`, `ci/mherm/BASE`, `ci/mherm/LEDGER.jsonl`, this file | |

BOUND, by the witness (paths whose index blob differs from base): `.github/workflows/suite.yml`, `ci/mherm/*`,
`scripts/audit_preload.mjs`, `scripts/organism_test.mjs`, `scripts/sandbox.mjs`, `scripts/tone.mjs` — nothing else.

## 3. F1 B, by measurement

The ruling: a trace of the sandbox run counts writes outside the sandbox under A; zero drops the temp allowance too.
The trace (a scratch harness, never committed): `buildSandbox({ trace: true })` on the build with the allowance still in
place, then in the collar: the canary, `validators.mjs selftest`, `awayday.mjs run` (the `sandbox.mjs ci` lane), the direct
selftests of hippocampus, harvest, mirror, pulse, done, tone and claudegen (the organ the allowance's comment named), and the
hermetic `organism_test.mjs all`; then every `write` event of `<sandbox>/.audit/trace.jsonl` whose path is not under the sandbox.

```
F1B trace rows 93812 · writes 34245 · writes outside the sandbox 0 · non-canary fs-write-escape 0 · 65 s
```

**Zero ⇒ the allowance is dropped** (stricter). Re-measured after the drop:

```
sandbox: 15 passed, 0 failed
F1B trace rows 93816 · writes 34239 · writes outside the sandbox 0 · non-canary fs-write-escape 1 · 70 s
  ESCAPE-DENIED organism_test appendFileSync <sandbox>/.tmp/organism-run-…/arsenal-swallow-…/swallow_ledger.jsonl
```

The one new denial is **inside** the real sandbox: `swallow.mjs:265` spawns its fixture child with a planted
`ARSENAL_AUDIT_COLLAR: "x"`, so in a real collar that child's sandbox is the bogus `./x` and its scratch write lived only by
the temp allowance. Its verdict does not move — swallow's selftest in the collar, before and after the drop:

```
swallow: 10 passed, 3 failed     (before — the same three FAIL lines)
swallow: 10 passed, 3 failed     (after)
```

On 20 Nov 2026 the hermetic suite run in the collar read the same headline both ways (`153 passed, 3 failed`: swallow, claudegen and the
roll-up; claudegen's `SESSION: two turns on ONE child` case). Neither is this unit's (FORKS F-1, F-5). Measured 20 Nov 2026.

## 4. The witness, both ways (last lines)

`node ci/mherm/witness_mherm.mjs --org <build> --base-org <base clone at cebe3eb>` (20 Nov 2026, about 40 s):

```
  ok   W1 COLLAR · base RED (exit 1 · sandbox: 11 passed, 4 failed · the canary's live-state file was created in the tree · the canary appended the tree's brain_ledger) · build GREEN (exit 0 · sandbox: 15 passed, 0 failed)
  ok   W2 TREE · base RED (after: ?? dressing-room/state/CANARY_MUST_NEVER_EXIST.json · !! dressing-room/state/brain_ledger.jsonl · !! scripts/tone.log) · build GREEN (equal)
  ok   W3 LEDGER · base RED (laws 74 passed without the plant, 84 with it) · build GREEN (74 passed both ways, LIVE 43)
  ok   W4 TEMP · base RED (left in the run's temp dir: 12 — done-selftest-…, harvest-scrub-…, harvest-…, hippo-batch-…, …) · build GREEN (empty)
  ok   W5 TWICE · base RED (laws run 1: 74 passed · laws run 2: 84 passed) · build GREEN (74 passed both runs)
  ok   BOUND · 9 path(s) differ, each a named file
  ok   LAST · no process names the temp root
GREEN MHERM the hermetic run is a function of the tree (sandbox's own temp · the run's own temp · the ledger block LIVE · tone logs in its box · no collar temp allowance) · 5 clause(s)
```

At base (`--org <base> --base-org <base>`): `RED MHERM · W1 COLLAR, W2 TREE, W3 LEDGER, W4 TEMP, W5 TWICE`.
As the suite's WITNESSES member hands it (two plain LF trees, no `.git`): the same GREEN last line.

The workflow job's script, run locally both ways (20 Nov 2026):

```
base : MHERM_STEP run 1 · wall 59.4 s · linux · … 154 passed, 2 failed … / run 2 … 164 passed, 2 failed …  →  RED MHERM-STEP · W5 W2 W4
build: MHERM_STEP run 1 · wall 65.0 s · linux · … 158 passed, 0 failed … / run 2 … 158 passed, 0 failed …  →  GREEN MHERM-STEP W2 W4 W5 · 3 clause(s)
```

## 5. The mutants

`node ci/mherm/run_mutants_mherm.mjs --org <build> --base-org <base clone at cebe3eb>` (20 Nov 2026, about four minutes):

```
  RED  M-W1 → RED MHERM · W1 COLLAR
  RED  M-W2 → RED MHERM · W2 TREE
  RED  M-W3 → RED MHERM · W3 LEDGER
  RED  M-W4 → RED MHERM · W4 TEMP
  RED  M-W5 → RED MHERM · W1 COLLAR, W2 TREE, W3 LEDGER, W4 TEMP, W5 TWICE
  control → GREEN MHERM … · 5 clause(s)
run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
```

M-W1 takes back T1 **and** F1 B: the collar now holds by either lock, so dropping T1 alone leaves W1 green (measured by
the spec's c5 shape, which reddened only before F1 B). M-W5 takes back T1, F1 B, T2 and T3: the second run differs only when
the canary escapes into the tree AND the ledger block reads what it left.

## 6. Each touched selftest, before and after (headline)

| selftest (20 Nov 2026) | base, a clone under the temp dir | build, a clone under the temp dir |
|---|---|---|
| `node scripts/sandbox.mjs selftest` | `sandbox: 11 passed, 4 failed` (exit 1) | `sandbox: 15 passed, 0 failed` |
| `node scripts/tone.mjs selftest` | `ALL CHECKS PASSED` (and `scripts/tone.log` left in the tree) | `ALL CHECKS PASSED` (nothing left) |

Measured 20 Nov 2026. `organism_test.mjs` and `audit_preload.mjs` carry no selftest verb (the suite is itself; the preload is
inert unless armed).

## 7. Every member line touched, before and after

From the hermetic `all` of a fresh clone under the temp dir (20 Nov 2026):

```
base :  ok   SUITE MEMBER · tone selftest exits 0
        FAIL SUITE MEMBER · sandbox selftest exits 0
        FAIL all 58 hermetic suite members pass (every one RUN, not chained)
        organism_test: 154 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 124 (run 1)   164 passed (run 2)
build:  LIVE LOAD ZERO · the brain-ledger lane block (every ledger lane declared · S7 RATCHET · RUNG A ledger-side) — not run in the hermetic profile: …
        ok   MHERM W3 · a planted gitignored brain_ledger.jsonl changes no hermetic verdict line of `laws` (…)
        ok   MHERM W1 · the sandbox collar denies the canary for a tree that sits UNDER the temp dir (…)
        ok   SUITE MEMBER · tone selftest exits 0
        ok   SUITE MEMBER · sandbox selftest exits 0
        ok   all 58 hermetic suite members pass (every one RUN, not chained)
        organism_test: 158 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (both runs, byte-equal)
```

LIVE rises by exactly the one T3 line; passed rises by the two in-suite clauses (W1, W3). The ten ledger asserts are named,
not lost (unit mherm2 brings them back on a fixture).

## 8. `node scripts/models.mjs check`

```
models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)
```

Exit 0 (20 Nov 2026).

## 9. The law pack counts, BASE and build (`node scripts/lawpack.mjs gate`, LF clones, 20 Nov 2026)

```
BASE  lawpack · 1939 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
      lawpack: GREEN — no law's finding count rose, and every rule is on disk
build lawpack · 1939 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
      lawpack: GREEN — no law's finding count rose, and every rule is on disk
```

No count raised. The type and lint gates (`node scripts/gates.mjs types` / `lint`, same clones): BASE and build both read
`298 checkJs diagnostics` and `no-empty 272 · no-unused-vars 85` — red against their frozen baselines on BASE already, not
raised here. One lint finding the build first raised (`no-unused-vars` 86: the `os` import the dropped allowance left unused)
was removed at its cause.

## 10. The neutral machine

The check runs of every push, read through the public API with no token
(`curl -sS https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`), are rows of the ledger. A push
cancels the run of the push before it (the workflow's concurrency group), so only the last push of a burst completes.

**`327892e`** (the last push before main moved), workflow `suite`, read 20 Nov 2026:

| check run | job | conclusion | wall |
|---|---|---|---|
| 136311865420 | hermetic twice · node 22 | **success** | 13:32:40Z → 13:38:18Z |
| 136311872510 | hermetic twice · node 24 | **success** | 13:36:45Z → 13:42:21Z |
| 136311868101 | npm test · node 22 | failure | 13:34:37Z → 14:21:49Z |
| 136311867731 | npm test · node 24 | failure | 13:30:30Z → 14:23:01Z |

W2 · W4 · W5 hold on Windows, both nodes: the whole hermetic `all` twice in a fresh clone under `os.tmpdir()` fits in
about six minutes a job (so each Windows run is well under three; the per-run line is in the job log, which needs a token).
The npm-test verdict annotation, both legs: `1 member(s) red that are not red at the merge base` —
`NEW RED · WITNESS ‹mf2› · GREEN at head against its BASE`. Reproduced here (the member's shape: LF trees of HEAD and
of `ci/mf2/BASE`): `RED MF2 · F3 BOUND`, and F3 reads
`hermetic headline LIVE: build 125 · base 126 (build ≤ base) · … named LIVE only by the build: LOAD ZERO · the brain-ledger lane block …`.
The count holds; the red is the ONE new LIVE name T3 adds, which row 1157 (1) and (4) rule (F3 A, `liveNamed` one line).
mf2's F3 ratchet ("the build names LIVE no member the base did not") and F3 A cannot both hold: every T3 shape short of
F3 C (unit mherm2's fixture) names a LIVE line. Not worked around (no KNOWN_RED entry without a row): **FORK F-8**.
mf2's BOUND red is the bound class (its BASE is behind main), which the member drops.

## 10-M. Main moved — 6a6bdff merged (unit mmeter)

Runner M's message, 20 Nov 2026: main is `6a6bdfff4349b849398b69d0748b27d37c874b85` (unit mmeter). `git fetch origin main`,
`git merge --no-edit FETCH_HEAD` → merge commit `e1c1c07`. **No conflict**: `scripts/organism_test.mjs` auto-merged (main
added the `clauses` mode that walks `ci/witness/`, my unit edits `run()`, the ledger block and `hermetic()`; no hunk
touches the other's lines); `package.json` is not touched by this unit, so its `organism:selftest` line is main's. Both
intents hold: main's `clauses` mode is a member of `MODES`, and every child it spawns inherits the run's own temp (T2).
`ci/mherm/BASE` is unchanged (cebe3eb): the clauses are judged against it, the bound against the parent (row 1200 (2)) —
the witness and the mutant runner take `--bound-org <dir>` for that, the base org when it is absent.

Re-measured on the merged tree (20 Nov 2026):

```
witness --org <merge> --base-org <cebe3eb> --bound-org <6a6bdff>   → GREEN MHERM … · 5 clause(s)   (BOUND: 10 named paths)
witness --org <merge> --base-org <6a6bdff>                         → GREEN MHERM … · 5 clause(s)   (every clause RED at the parent too)
witness --org <merge> --base-org <cebe3eb>  (no --bound-org)       → RED MHERM · BOUND   (the mmeter files: the bound class)
run_mutants --org <merge> --base-org <cebe3eb> --bound-org <6a6bdff> → run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
working tree, hermetic all                                         → organism_test: 160 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125
lawpack gate, 6a6bdff and the merge (LF clones)                    → the same count line as §9, both GREEN
```

## 10-F. FORK F-8 ruled — mf2's F3, one clause with two doors (forks rows 1204 and 1205 (3))

Row 1204 ruled F-8 as option (a), narrowed to a listed admission ((b) and (c) refused; row 1157 (4) stands). Row 1205 (3)
then ruled F3 as ONE clause with TWO doors and gave both doors to the second of the mgat and mherm build seats to return.
**This seat is SECOND**: `claude/mgat-build` was read at `9897cb4` before this push (20 Nov 2026), and it already carries
door 1 (`ci/mf2/livenarrow.mjs`, its F3 re-statement). Its branch is not merged: `livenarrow.mjs` is brought by content
(`git show 9897cb4:ci/mf2/livenarrow.mjs`, byte-equal), and F3 here holds both doors in the one clause.

- **door 1** (unit mgat, row 1174 (2)): the build tree declares in `LIVE_NARROWS` the base LIVE name its new name narrows,
  that partner was LIVE at the base and is gone at the build (`liveNarrow`, unchanged; `node ci/mf2/livenarrow.mjs selftest`
  → `livenarrow selftest: 9 of 9`).
- **door 2** (this seat, row 1204 (2)): the name stands in `ci/mf2/LIVE_ADMITTED.json` with its ruling row; every assert listed
  under it is an assert name of the build's own source; the witness measured on its own base copy that the base hermetic run
  judged NONE of them; an entry the build no longer prints LIVE reads RED (unit mherm2 deletes it when its fixture lands).
- **the count**: the build's LIVE may exceed the base's by exactly the names door 2 admits; door 2's names leave the set and
  the count before door 1's rule judges what is left. ONE entry today: T3's name, row 1204, its ten asserts listed.

Measured on the merged tree (LF trees of HEAD and of `ci/mf2/BASE` 15edfec, the member's shape; 20 Nov 2026):

```
mf2 witness            → RED MF2 · BOUND        (F1 F2 F3 F4 LAST GREEN; BOUND is the bound class: mf2's BASE is behind main)
  GREEN F3 · hermetic headline LIVE: build 125 · base 126 + 1 admitted by door 2 (build ≤ base + door 2) · … · door 1 admitted (narrows a base name now gone): none · refused: none · door 2 admitted (row-listed, none of their asserts judged by the base): LOAD ZERO · the brain-ledger lane block …
node ci/mf2/run_mutants_mf2.mjs
  RED  M-D1-NOPARTNER → RED MF2 · F3 BOUND     (door 1: the list emptied, no LIVE_NARROWS partner — "no narrowed partner declared")
  RED  M-D2-UNLISTED → RED MF2 · F3 BOUND      (door 2: the entry renamed, the build's new name unlisted)
  RED  M-D2-JUDGED → RED MF2 · F2 F3 F4 BOUND  (door 2: a ledger planted in the base copy, so the base judged the ten — "the BASE judged 10")
  control → RED MF2 · BOUND  (its F3 GREEN)
run_mutants: 3 of 3 mutant(s) RED by the clause that names them · control GREEN
mherm witness --org <merge> --base-org <cebe3eb> --bound-org <6a6bdff>
  ok   BOUND · against the bound org (--bound-org) · 14 path(s) differ, each a named file (the four ci/mf2 files added to its list by rows 1204 / 1205 (3))
GREEN MHERM the hermetic run is a function of the tree (…) · 5 clause(s)
node ci/mherm/run_mutants_mherm.mjs (same orgs)
run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
```

The ms1 member judges the mf2 witness by its last line with BOUND dropped (the bound class, row 1200 (2)), so this tree's
`RED MF2 · BOUND` reads GREEN there; the npm-test leg that was red on `327892e` for this one member is the architect's re-run.
Files this added beyond the brief's list, each ruled to this seat by those rows: `ci/mf2/witness_mf2.mjs` (F3),
`ci/mf2/LIVE_ADMITTED.json`, `ci/mf2/run_mutants_mf2.mjs`, `ci/mf2/livenarrow.mjs` (mgat's, by content).

## 11. What the two named next units need from this build

- **mherm2** (a planted ledger fixture so the ten asserts run on every push · F5 B):
  - the hook is T3's one line in `organism_test.mjs` (`PROFILE === "hermetic" && liveNamed(…) ? null : …`): the fixture
    replaces the `null` with lanes read from a ledger planted under `RUN_TMP` (T2 gives every run that home and removes it);
  - the block also reads `brain_config.json` (tracked) and imports outbox / gate / brain: the fixture must give lanes those
    resolve, or the RUNG A and S7 asserts read a fixture's own gaps;
  - F5 B is now **five organs and their sites at cebe3eb**: hippocampus (the seven `hippo-*` stamps), harvest (`:245`, `:312`),
    mirror (`:316`), pulse (`:355`), done (`:263`). Under T2 the suite hides every one of them, so their witness must run each
    organ's selftest directly with `TMPDIR`/`TEMP`/`TMP` = a fresh dir (this witness's W4 shape, without T2) and read it empty.
- **mtrc** (the trace pass naming every read of a gitignored path a run did not plant):
  - T1 + F1 B make the collar's domain the sandbox alone, so a trace of the hermetic `all` in `buildSandbox({ trace: true })`
    (the harness of §3) sees every read as a sandbox path; the pass keeps `read`/`ENOENT`/`exists` events whose path
    `git check-ignore`s inside the sandbox tree and drops those the run wrote first (a `write` event earlier in the trace);
  - the trace's `existsSync` rows are where the ledger gate lived (`missing` on a fresh tree) — the class T3 named by hand.

## 12. Where this differs from the spec (the ruling wins)

1. **F1**: the spec recommended A; the ruling asked B by measurement. It measured zero, so B is built too.
2. **W1, W3 ride the suite** as two asserts of the `hermetic` mode (the spec called them "in-suite candidates").
3. **W2, W4, W5 are their own job**, `hermetic-twice`, not a step of `npm-test`: main's npm-test job ran 48 min of its
   60 (check run 136266834894, node 22, on cebe3eb, 20 Nov 2026), and the whole `all` twice would cross that bound. FORK F-2.
4. **The witness's W5** runs `laws` + `suites` then `laws`, not `all` twice: measured on base, the only verdict lines a
   second `all` changes are `laws` lines, and every left file is a `suites` member's. The `all`-twice form is the job.
5. **The spec's W1 mutant (drop T1)** no longer reddens W1, because F1 B is a second lock; the mutant takes both.
6. **A sixth leak site** (`done.mjs:263`) exists at the cut; covered by T2, named for mherm2.

## 13. FORKS (each the architect's)

- **F-1 · swallow's planted collar.** `swallow.mjs:265` hands its fixture child `ARSENAL_AUDIT_COLLAR: "x"`; inside a real
  collar that child's scratch write is now denied (§3). Verdict unchanged; swallow's owner decides whether its fixture should
  name the real collar or plant none. Not edited.
- **F-2 · a job, not a step.** The ruling says "a workflow step"; it is the one step of its own job (reason §12.3). Rule: keep
  the job, or fold it into npm-test once that job has room.
- **F-3 · the job's bound.** `hermetic-twice` types no `timeout-minutes` (a typed timeout is forbidden here); each run is bounded
  by npm-test's own `timeout-minutes`, read from the file, and the job takes the platform default. Rule a shared value if wanted.
- **F-4 · the verdict's legs.** `ci_verdict.mjs` derives `REQUIRED_LEGS` from the first job name line, so the house's verdict
  reader does not read `hermetic-twice`; the suite workflow run's conclusion (what awayday reads) does. Rule whether it is a leg.
- **F-5 · the collar's in-suite reds.** The hermetic suite inside a collar is red on swallow and claudegen before and after this
  build (§3) — not a gate today; named.
- **F-6 · Windows, named not guessed:** whether `os.tmpdir()` (an 8.3 short name on the runner) and the clone path compare
  equal inside the collar; whether a junction `node_modules` reads the same in `git status` before and after; the job's wall
  time per run. All three are printed by the `hermetic-twice` job's first run.
- **F-8 · RULED (rows 1204, 1205 (3); §10-F).** ~~mf2's LIVE ratchet against T3 (F3 A).~~ `ci/mf2/witness_mf2.mjs` F3 reds on the one LIVE name T3 adds (§10), so
  the neutral npm-test verdict of this branch is RED on that one member. Rule one: (a) mf2's F3 admits a LIVE name that
  replaces a block the base skipped SILENTLY (strictly more visible: before T3 the block's existence depended on a gitignored
  file), (b) a KNOWN_RED entry by a row, until mherm2's fixture retires the name, or (c) bring F3 C (mherm2) into this unit.
- **F-7 · the effort receipt.** `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository (see the final message).
