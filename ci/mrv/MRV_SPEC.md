# MRV SPEC — mlv1 I2 MID and I3 JUDGE on node 24, measured by repetition, one fate per clause

Unit **mrv** · forks row 1119 (4) F-d · cut from `52b51c1` (the ms1 tip the architect re-ran GREEN) · written 19 Nov 2026
by a cloud spec seat. It builds nothing: every file under `ci/mrv/` is a MEASUREMENT INSTRUMENT (no `witness_mrv.mjs`, so
the suite's witness member never runs it, `scripts/organism_test.mjs:2764-2768`). The ledger of every act is
`ci/mrv/LEDGER.jsonl`.

## 0. HEADLINE

**Neither clause is a fault in the code under test. Both are clocks in the witness's plant, and I3's red is only a
cascade of I2's.** Fate: **I2 (a) witness repaired · I3 (a) witness repaired.** No clause is dropped.

- **I2 MID** is red when the witness's SECOND keeper start does not answer inside a bound measured from ONE sample of the
  first start (`ci/mlv1/witness_mlv1.mjs:89` `BOUND = BOUNDS.boot + SLACK`, used at `:109`). A start is a noisy quantity:
  its spread across runs is wider than one slack. On win32 a second, OS-only cause joins it: `killTree` (`:67-72`)
  waits for the KEEPER's exit after `taskkill /T /F`, never for the worker's port to be freed. A new keeper that probes a
  still-held port (`scripts/keeper.mjs:172`) sleeps one `KEEP_POLL_MS` (`scripts/keeper.mjs:111`) by design.
- **I3 JUDGE** has no precondition of its own: it reuses whatever keeper and sitting I2 left behind (`:134`). In every
  measured run where I2 was red, I3 was red too: on the neutral machine, under local load, and under every I2 plant.
- The repair is witness-only. Each wait for a keeper START ends on an EVENT (answering and open · the keeper's own
  "keeper waiting" line · its exit), the same rule as the first boot (`:84`). A kill is followed by a bounded wait for
  the port to bind. I3 stands on its own idle keeper. Each part is RED on its plant in the base witness and GREEN in the
  repair. One mutant per clause is RED, node 22 and node 24 both.

## 1. MEASUREMENTS (every one by command; the last line as printed)

### 1.1 The neutral machine: every leg of every push that ran the mlv1 witness

Read anonymously through the public API: runs, then jobs, then each job's log, keeping only the lines that name mlv1
(scratch script `fetchlogs.mjs`, its shape: `GET /repos/…/actions/workflows/suite.yml/runs`, `GET /actions/runs/<id>/jobs`,
`GET /actions/jobs/<id>/logs`). Measured 19 Nov 2026, over every suite run created since 17 Nov 2026:

```
legs 554 · with mlv1 lines 380 · 8 legs ran WITNESS ‹mlv1› (all claude/ms1-build: the witness member lives only there)
run          job           sha      node  version  WITNESS ‹mlv1› · GREEN at head against its BASE
44413918338  135189162294  3ed6c9c  22    22.23.4  ok
44413918338  135189162604  3ed6c9c  24    24.22.3  ok
44417920009  135202961143  f98e914  22    22.23.4  ok   · 4.9 s
44417920009  135202961645  f98e914  24    24.22.2  ok   · 4.2 s
44422239918  135217887740  3966f61  22    22.23.4  ok   · 4.1 s
44422239918  135217888222  3966f61  24    24.22.2  FAIL · 3.2 s · red beyond BOUND: I2 MID I3 JUDGE
44429565409  135243231510  52b51c1  22    22.23.4  ok   · ran in 5.0 s
44429565409  135243231639  52b51c1  24    24.22.2  FAIL · ran in 3.4 s (the detail is not printed at this tip: names only)
```

Count red of total, the neutral machine (dated 19 Nov 2026): **node 22: 0 of 4 · node 24: 2 of 4.** I2 and I3 are red
together on the one leg that prints its clauses. **Both red legs ran FASTER than every green leg** (3.2 s and 3.4 s,
against 4.1 s to 5.0 s). That is the timing of an early return: I2 gives up before `close()`, whose owner `spawnSync`
calls (`scripts/sitting.mjs:1036`, `:1044`, `:1070`) are the slow part of a green run.

### 1.2 Local repetition, idle (fresh LF trees per run, `core.autocrlf=false`, doors on OS-picked ports)

```
node ci/mrv/measure_mlv1.mjs --root . --head 52b51c1 --n 40 --out <scratch>/r22.jsonl
MRV MEASURE · node v22.23.5 · 40 run(s) · I1 0/40 · I2 0/40 · I3 0/40 · XML 0/40 · BOUND 40/40 · LAST 0/40 red
<node v24.22.2> ci/mrv/measure_mlv1.mjs --root . --head 52b51c1 --n 40 --node <node v24.22.2> --out <scratch>/r24.jsonl
MRV MEASURE · node v24.22.2 · 40 run(s) · I1 0/40 · I2 0/40 · I3 0/40 · XML 0/40 · BOUND 40/40 · LAST 0/40 red
```

BOUND is red on every run by construction, because head 52b51c1 has moved twenty files past `ci/mlv1/BASE`. The suite
drops BOUND (`judgeLast`, `scripts/organism_test.mjs:2799`), so it is not part of F-d. Node 24.22.2 is the exact
version of both red neutral legs, fetched as the `node-linux-x64@24.22.2` package from the npm registry. Linux, idle,
first boot: node 22 median 204 ms (range 184 to 255) with slack median 26 ms. Node 24 median 241 ms (range 221 to 323)
with slack median 28 ms. **The boot's spread across runs is several slacks wide.** A bound of one boot sample plus one
slack is therefore a coin that can land either way.

### 1.3 Local repetition under CPU contention (eight `node -e 'for(;;){}'` burners)

```
MRV MEASURE · node v22.23.5 · 20 run(s) · I1 0/20 · I2 1/20 · I3 1/20 · XML 0/20 · BOUND 20/20 · LAST 0/20 red
  run 12 · I2 · boot 312 bound 376 · the planted open sitting did not resume
  run 12 · I3 · no DEFERRED line · held pid → the same pid · freed → no retire        (run 3.06 s; green median 3.27 s)
MRV MEASURE · node v24.22.2 · 20 run(s) · I1 0/20 · I2 0/20 · I3 0/20 · XML 0/20 · BOUND 20/20 · LAST 0/20 red
```

The red run had the LOWEST first boot of its batch (312 ms, against a median of 448), so it had the tightest bound. I2
failed at `:109`, the wait for the re-started keeper. I3 then found I2's keeper came up late with the planted sitting
still OPEN, because I2 returned before its close. So the worker deferred for "live work", never naming the judge, and
never retired. That is a cascade, not an I3 fault. On Linux the red is still node 22 at 1 in 20, not node 24: **Linux
does not reproduce the node 24 skew**, which is named in §7.

### 1.4 The arm window (could a closure write be missed between "port answers" and "watcher armed"?)

```
node ci/mrv/probe_arm.mjs --root . --head 52b51c1 --n 3
MRV ARM · node v22.23.5 · 3 rep(s) · files 47 · slack med 22 ms · boot med 168 max 183 ms · arm med 41 max 60 ms · arm > boot+slack in 0/3
```

The worker answers `/status` (`scripts/sitting.mjs:1407`) BEFORE `retireWhenIdle` arms (`:1411`): it imports
`brain.mjs`, `gate.mjs` and the registry, then walks the import closure of 47 files. A write in that window is NOT lost:
the watchers are installed (`scripts/keeper.mjs:143-148`) and THEN `retirer.check()` runs (`scripts/sitting.mjs:1414`).
Its `staleSources` (`scripts/brain.mjs:7097-7106`, strict `>` against the boot instant) sees any earlier write. **The code
has no intermittent behaviour here.** The arm (median 41 ms) is far inside boot + slack.

### 1.5 The plant matrix: each cause planted, base RED, repair GREEN, one mutant per clause RED

The variants are made by `node ci/mrv/variants_mlv1.mjs <repo> <scratch>/var`. Each run uses
`MRV_PLANT=<p> node ci/mrv/measure_mlv1.mjs --root . --head 52b51c1 --n 3 --witness <scratch>/var/<v>/witness_mlv1.mjs`.

Each plant's duration is the run's OWN measured first boot (`BOUNDS.boot`), never a typed number.

- **p1** makes I2's re-started keeper boot one measured BOOT slower. A busy wait runs in its first process only, through
  `NODE_OPTIONS --import`, with a once-marker under the run's temp dir.
- **p2** keeps the killed worker's port held for one measured BOOT after the kill. This models `taskkill /T /F`'s
  teardown lag, which cannot run on Linux.
- **p3** leaves no keeper up before I3 (the state a red I2 leaves).

Measured 19 Nov 2026, red of total:

```
variant      plant   node v22.23.5            node v24.22.2
base         p1      I2 3/3 · I3 3/3          I2 3/3 · I3 3/3
base         p2      I2 3/3 · I3 3/3          I2 3/3 · I3 3/3
base         p3      I2 0/3 · I3 3/3          I2 0/3 · I3 3/3
repaired     p1      I2 0/3 · I3 0/3          I2 0/3 · I3 0/3
repaired     p2      I2 0/3 · I3 0/3          I2 0/3 · I3 0/3
repaired     p3      I2 0/3 · I3 0/3          I2 0/3 · I3 0/3
repaired     none    I2 0/3 · I3 0/3          I2 0/3 · I3 0/3
mutant-i2a   p1      I2 3/3 · I3 0/3          I2 3/3 · I3 0/3     (I2's event wait removed)
mutant-i2b   p2      I2 3/3 · I3 0/3          I2 3/3 · I3 0/3     (I2's port-free wait removed)
mutant-i3    p3      I2 0/3 · I3 3/3          I2 0/3 · I3 3/3     (I3's own keeper removed)
I1, XML and LAST: 0 red in every cell
```

The why lines (node 22, first run of each cell) reproduce the neutral machine's shape: a fast red, with I2 at `:109` and
I3 cascading.

```
base_p1      0.99 s  I2: the planted open sitting did not resume | I3: no daemon up
base_p2      1.27 s  I2: the planted open sitting did not resume | I3: no daemon up
repaired_p2  1.66 s  I2: deferred … · close true · after close pid → <new> · 0 item(s) lost | I3: DEFERRED naming the judge · freed → <new>
mutant-i2b   1.73 s  I2: the planted open sitting did not resume | I3: DEFERRED naming the judge …   (I3 now stands alone)
```

The two mutant-i2 rows are the proof that the repaired I3 no longer inherits I2's red: I2 is red, and I3 stays green.

### 1.6 The repair under the same CPU contention as §1.3

```
8× burners + node ci/mrv/measure_mlv1.mjs --root . --head 52b51c1 --n 20 --witness <scratch>/var/repaired/witness_mlv1.mjs
MRV MEASURE · node v22.23.5 · 20 run(s) · I1 0/20 · I2 0/20 · I3 0/20 · XML 0/20 · BOUND 20/20 · LAST 0/20 red
8× burners + <node v24.22.2> ci/mrv/measure_mlv1.mjs … --witness <scratch>/var/repaired/witness_mlv1.mjs
MRV MEASURE · node v24.22.2 · 20 run(s) · I1 0/20 · I2 0/20 · I3 0/20 · XML 0/20 · BOUND 20/20 · LAST 0/20 red
```

Read honestly: the base's natural rate under this load was 1 in 20, so 0 in 20 for the repair does not decide by
itself. The plants in §1.5 are the decisive evidence: each cause is made certain and then removed.

### 1.7 The suite on this branch (the seat's own measurement, dated 19 Nov 2026)

```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      (exit 2)
organism_test: 140 passed, 4 failed · ruled 0 · UNRULED 4 · LIVE 126 (hermetic: named, not run)
  FAIL EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law) · orphaned: deck_lint, home_pin, probe, study_scope
  FAIL SUITE MEMBER · fsrs selftest exits 0        (ERR_MODULE_NOT_FOUND: this cloud seat has no node_modules; no npm ci run)
  FAIL SUITE MEMBER · mutagen selftest exits 0     (the same)
  FAIL all 52 hermetic suite members pass (every one RUN, not chained)   (the two above)
  ok   LOAD ZERO BLOCK 7 · no canon file states a live count a command can produce (93 files scanned, 1 declared)
git diff --name-only 52b51c1..HEAD   →   ci/mrv/ only (LEDGER.jsonl, MRV_SPEC.md, measure_mlv1.mjs, probe_arm.mjs, variants_mlv1.mjs)
```

None of the four names a file of this branch. The diff is `ci/mrv/` only, so each is a red of the base tree in this
container. A base-tree run was refused by the repo's worktree rail, whose tool lives on his laptop. The neutral machine
(§8) judges head against its merge base, and that is the authority. The witness member itself does not run here
(`GITHUB_ACTIONS` unset, `scripts/organism_test.mjs:2835`).

## 2. THE CAUSES, by file:line at `52b51c1`

| # | cause | where | class | which node / OS |
|---|---|---|---|---|
| C1 | a keeper RE-START is waited on with one sample of the first start + one slack | `ci/mlv1/witness_mlv1.mjs:89`, `:109` | clock in the plant | both nodes. Reproduced on Linux under load (§1.3) and by p1 (§1.5) |
| C2 | a kill returns at the keeper's exit, not at the worker port's release. The next keeper then finds the port held and sleeps one poll | `ci/mlv1/witness_mlv1.mjs:67-72` (`taskkill` at `:68`), against `scripts/keeper.mjs:172-176` and `:111` | race in the plant | win32 only (the Linux branch at `:70` SIGTERMs the keeper, which forwards to the worker, `scripts/keeper.mjs:164`, and exits after it). Modelled by p2. Not measured on Windows (§7) |
| C3 | I3 has no precondition of its own: it reads the keeper and sitting I2 left | `ci/mlv1/witness_mlv1.mjs:134` | coupling in the plant | every I2 red so far carried an I3 red (§1.1, §1.3, §1.5) |

What I measured and RULED OUT as the code's own intermittent behaviour:

- the serve-to-arm window (§1.4; closed by the arm-time `check()`, `scripts/sitting.mjs:1414`);
- the strict `>` boot-instant rule (`scripts/brain.mjs:7103`): I1 was 0 red in every one of the 220 local runs, dated
  19 Nov 2026;
- `close()`'s own work (`scripts/sitting.mjs:1024-1086`): it finishes before `onClosed` (`:1084`), and the `/close`
  response is awaited before the retire wait starts (witness `:117`).

The keeper's one-poll sleep on a held port (`scripts/keeper.mjs:172-176`) is its designed contract ("probing every …"),
asserted in its own selftest (`scripts/keeper.mjs`, the `ALREADY RESIDENT (69) waits poll_ms` case).

## 3. ONE FATE PER CLAUSE

- **I2 MID: fate (a), the witness is repaired.** Two edits, both in `ci/mlv1/witness_mlv1.mjs`:
  1. **(a-1) the re-start is a BOOT and is waited like the first one** (`:84`'s rule). It replaces `:108-109`'s
     `waitFor(…, BOUND)`. The wait ends on an EVENT: `/status` answers with `open: true`, OR the keeper prints its own
     `keeper waiting` line (`scripts/keeper.mjs:173`, a named red: the port outlived the kill), OR the keeper exits. It
     re-reads at `SLACK` steps, the one node start measured in the run (`:44`). Its outer bound is the member's derived
     `timeout: left` (`scripts/organism_test.mjs:2873`, from the job's own `timeout-minutes`). No ratio is typed.
  2. **(a-2) after a kill, the port must bind before the next keeper starts.** Insert after `:102`: wait, bounded by
     `BOUND`, until a test bind of `PORT` on 127.0.0.1 succeeds. Red if it does not, with the why `:<port> still held
     <BOUND> ms after the kill`. On win32 this absorbs taskkill's teardown lag. On Linux it passes on the first probe.
  The DEFERRED wait (`:113`) and the after-close retire wait (`:118`) KEEP `BOUND`: those are the contract's promptness
  claims about the code (a deferral and a retire within one keeper start). The arm measurement (§1.4) shows the code
  meets them with room. **A gate may only get stricter:** neither of those two waits is loosened.
- **I3 JUDGE: fate (a), the witness is repaired.** I3 plants its own precondition. It replaces `:134`: when `portUp()`
  answers nothing, or answers with an open sitting, I3 kills the keeper, waits for the port to bind (a-2's rule), makes
  the planted sitting closed (fork F-3 decides how), starts its own keeper, and waits for it as a BOOT (a-1's rule,
  answering with `open: false`). Then the clause runs unchanged from `:135`. Its red then names only its own cause.
- **Why not (b), the code?** No intermittent code path was found (§2, ruled out). The only code-side candidate is the
  keeper's one-poll sleep on a held port, and that is a designed contract with its own selftest. Shortening it changes
  what the service does on his machine to make a witness green, which is the wrong direction. It is listed as fork F-2
  (option B) so the architect rules it, not this seat.

### 3.1 The proposed code path (witness only). The measured variant is `<scratch>/var/repaired/witness_mlv1.mjs`, made by `ci/mrv/variants_mlv1.mjs`

```js
// after :102 (a-2)
const freeHere = () => new Promise((res) => { const s = createServer(); s.once("error", () => res(false)); s.listen(PORT, "127.0.0.1", () => s.close(() => res(true))); });
if (!(await waitFor(freeHere, BOUND))) return { ok: false, why: `:${PORT} still held ${BOUND} ms after the kill` };
// :108-109 (a-1)
keeper = startKeeper();
let s1 = null;
for (;;) { const s = await portUp(); if (s && s.open) { s1 = s; break; } if (keeper.exitCode != null || out.some((l) => /keeper waiting/.test(l))) break; await sleep(SLACK); }
// :134 (I3's own precondition)
let s1 = await portUp();
if (!s1 || s1.open) { await killTree(keeper); await waitFor(freeHere, BOUND); /* F-3: make the planted sitting closed */ keeper = startKeeper(); s1 = null;
  for (;;) { const s = await portUp(); if (s && !s.open) { s1 = s; break; } if (keeper.exitCode != null || out.some((l) => /keeper waiting/.test(l))) break; await sleep(SLACK); } }
if (!s1) { await killTree(judge); return { ok: false, why: "no daemon up" }; }
```

A build should also make the `keeper waiting` exit of a-1 say so in I2's why, instead of the generic "did not resume".

### 3.2 Owners and writes

The witness writes only under its own `os.tmpdir()` tree: `COPY` (`:48`), the sitting state dir `SDIR` (`:52`) and its
temp marker. `scripts/sitting.mjs` is the SOLE WRITER of `sitting.json` / `sitting_out.jsonl` (its header,
`scripts/sitting.mjs:14-16`). The witness already PLANTS both under `SDIR` (`:103-105`, the landed precedent); it never
writes his tree's. The repair adds one more plant write in I3's branch (F-3, option A) or none (F-3, option B, through
the organ's own `/close` door). Nothing touches `dressing-room/state` of any live tree. The witness's process sweep
(`LAST`, `:166-179`) still applies, unchanged.

### 3.3 The port class (row 1053)

The witness binds no fixed port: `PORT` is OS-picked (`:53`), and the judge port is the keeper's env door
`ARSENAL_JUDGE_PORT`, honoured only under the temp dir (`scripts/keeper.mjs:85-92`), which the member plants
(`scripts/organism_test.mjs:2870`). a-2's test bind is on that same planted `PORT`. No live service is named, nothing is
POSTed to a live daemon (the `/close` of F-3 B goes to the witness's own planted keeper), and nothing is restarted
outside the temp tree. Every wait is bounded: by `BOUND`, by an event plus the member's derived `left`, or by the
keeper's exit.

## 4. THE WITNESS CLAUSES AND THEIR MUTANTS (for the build seat)

| clause | plant (RED on base) | GREEN on build | mutant (one per clause, RED) |
|---|---|---|---|
| I2 MID (a-1) | p1: the re-started keeper boots one measured BOOT slower | repaired, p1: 0/3 red on both nodes | mutant-i2a: a-1 reverted to `waitFor(…, BOUND)`, red 3/3 on both |
| I2 MID (a-2) | p2: the killed worker's port is held one measured BOOT past the kill | repaired, p2: 0/3 red on both | mutant-i2b: a-2 removed, red 3/3 on both |
| I3 JUDGE | p3: no keeper up when I3 begins | repaired, p3: 0/3 red on both | mutant-i3: I3's own keeper removed, red 3/3 on both |

I1, XML, BOUND and LAST are untouched by the repair: I1, XML and LAST read 0 red in every cell. The build seat should
carry the three plants as env-selected clauses of a witness for the repaired witness (fork F-4), and the mutants
through the ms1 mutant runner shape (`ci/ms1/run_mutants_ms1.mjs`).

## 5. FORKS (each for the architect)

- **F-1 · how a landed witness is re-cut.** ms1 carried every landed witness "bytes unchanged" (F8 A, commit
  `3c0a84e`). Options:
  - **A.** Edit `ci/mlv1/witness_mlv1.mjs` in place. `ci/mlv1/BASE` stays `009f52e`, because the code under test is
    unchanged.
  - **B.** Cut a new unit dir (for example `ci/mlv1r/`) and keep `ci/mlv1/` frozen (L9). The member then runs both, and
    the old one stays flaky.
  - **C.** As A, with the old bytes frozen beside it as `witness_mlv1Legacy.mjs`. That is not a witness file name, so
    the member never runs it.

  Recommendation: **C**. It is L9's freeze shape, and only one judged witness remains. Decided by: the architect's
  rule for re-cutting a witness, since no measurement decides it.
- **F-2 · I2's fate.** Options:
  - **A.** The witness is repaired (a-1 and a-2).
  - **B.** The code is repaired: `keep()` re-probes a held port at `SLACK`-like steps for one boot before falling to
    `pollMs` (`scripts/keeper.mjs:172-176`).
  - **C.** Both.

  Recommendation: **A**. B changes a designed, selftested service contract on his machine to suit a witness. Decided
  by: one Windows measurement of how long a killed worker's port stays held after `taskkill /T /F` (§7 N1). If it is
  longer than a keeper start on his laptop too, then a WinSW restart costs him one poll, and B becomes a real fix for a
  real behaviour. That would be a separate unit, not this fate.
- **F-3 · how I3 makes a left-open sitting closed.** Options:
  - **A.** Plant the closed state into `SDIR/sitting.json` (the witness's existing planted-state precedent, `:103`).
    This is what the measured variant does.
  - **B.** POST `/close` through the planted keeper's own door, so the owner writes its own file.
  - **C.** Delete the planted `sitting.json`.

  Recommendation: **B**. The owner writes its own file, and the door is the witness's own planted keeper. C is out: it
  deletes. Decided by: B's run must stay inside I3's bound, because a close spawns owner calls; one measured run
  answers that.
- **F-4 · where the three plants live.** Options:
  - **A.** A witness for the repaired witness (`ci/mrv2/witness_mrv2.mjs`), which runs the repaired mlv1 under p1, p2
    and p3 and expects GREEN, plus a mutant runner.
  - **B.** Env-selected plants inside `witness_mlv1.mjs` itself, inert unless set.
  - **C.** Only this spec's matrix, as a record.

  Recommendation: **A**. B puts plant code into the judged witness. C leaves the repair unwitnessed. Decided by: the
  architect.
- **F-5 · the measurement instruments in `ci/mrv/`.** Options:
  - **A.** Keep them on the spec branch only (a record).
  - **B.** Land them beside the build as `ci/mrv/` tools.

  Recommendation: **A**. Decided by: whether any later unit re-measures a flaky member. If one does, B.

## 6. NAMED FILES A BUILD WOULD TOUCH

- `ci/mlv1/witness_mlv1.mjs` (the repair, §3). Under F-1 C, also `ci/mlv1/witness_mlv1Legacy.mjs` (the frozen bytes).
- Under F-4 A: `ci/mrv2/witness_mrv2.mjs`, `ci/mrv2/BASE`, and a mutant runner beside it.
- **Beyond these, as a fork:** none proposed. `scripts/keeper.mjs` is touched only if F-2 B or C is ruled, and that
  would be its own unit. `ci/mlv1/BASE` is unchanged under F-1 A or C. `scripts/organism_test.mjs` is unchanged: the
  member already plants the doors and derives `left`.

## 7. NAMED, NOT GUESSED (out of reach from the cloud; what would measure each on his laptop or the neutral machine)

- **N1 · C2 on Windows.** How long a killed worker's port stays held after `taskkill /PID <keeper> /T /F` returns, node
  22 and 24. Measure: on Windows, start `node scripts/sitting.mjs daemon` on a planted tree with
  `ARSENAL_SITTING_PORT` set to an OS-picked port, kill it the witness's way, then test-bind that port at one-slack
  steps and print the first instant it binds, repeated.
- **N2 · why node 24, not 22.** Linux shows no node skew: idle 0/40 on both; under load node 22 was red 1/20 and node 24
  0/20. The neutral machine shows node 24 at 2/4 and node 22 at 0/4. The hypothesis is that node 24 starts faster on
  Windows, so a new keeper reaches its port probe sooner after the kill, and C2 bites more often. It is not measured.
  Measure: N1's probe on both nodes, plus the first-boot sample each leg prints (`first keeper up in … ms`, which lives
  only in the runner's `out.txt` today).
- **N3 · the why lines of the two red neutral legs.** The workflow prints names only (`suite.yml`'s grep), and the
  member's `out.txt` stays on the runner (`scripts/organism_test.mjs:2872-2880`). So which `:109` / `:134` branch fired
  on Windows is inferred from the run's seconds (§1.1), not read. Measure: run the mlv1 witness by hand on his laptop,
  repeatedly, with `--org`/`--base-org` LF trees, and read its clause lines. Or the architect rules a workflow step that
  prints witness why lines (a workflow change, so not this seat's).
- **N4 · the rate.** Four node 24 legs is too few a sample to state a rate. A repeated Windows run of
  `measure_mlv1.mjs`-shaped repetition (this seat cannot drive a Windows runner without a workflow edit) would give
  one.

## 8. THE NEUTRAL MACHINE ON THIS BRANCH

<!-- RESULT-CI -->
(read after the last push; the next push carries it)

## 9. STATUS

All the measured steps are on the branch (§1.1 to §1.5). §1.6 and §8 are filled by the next push.
