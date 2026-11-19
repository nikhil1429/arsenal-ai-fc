# MRV PROOF — the three keeper-family witnesses stand on their own clocks and preconditions

Unit **mrv** · forks rows 1135 and 1139 (1) · cloud build seat · branch `claude/mrv-build` · written 19 Nov 2026.
Every act is a row of `ci/mrv/LEDGER.jsonl`.

## 0. BASE

`ci/mrv/BASE` = `cf1ca54e43778c87c91c9322b57819f3f07726a4`: the ms1 seat's tip at launch (row 1135 (6)). It was cut with
`git checkout -b claude/mrv-build cf1ca54`. `ci/mlv1/BASE`, `ci/mlv2/BASE` and `ci/mlv3/BASE` are KEPT unchanged (F-1 A).

## 1. WHAT WAS BUILT (named files only)

| file | what |
|---|---|
| `ci/mlv1/witness_mlv1.mjs` | re-cut in place (row 1135 (1)-(3), (5)). (a-1) I2's re-started keeper is waited as a BOOT, ending on an event. (a-2) after I2's kill, a port-free wait bounded by BOOT + SLACK, which prints the `PORT_HELD` machine line. (I3) I3 stands on its own precondition: if no keeper answers, it kills, frees the port and starts its own keeper. If it finds an open sitting, it closes it through the planted keeper's own `/close` door (F-3 B). The header names each changed wait with unit mrv and the row, with the old text struck |
| `ci/mlv2/witness_mlv2.mjs` | re-cut in place (row 1139 (1)). The first boot is a BOOT (event wait), and every clause after the first stands on its own keeper through `ready()` |
| `ci/mlv3/witness_mlv3.mjs` | as mlv2. Plus, by the ruling on 03ec8d7, T2's wait for the RESPAWNED worker is a BOOT (event wait), while the retire DECISION keeps its BOOT + SLACK bound |
| `ci/mrv/witness_mrv.mjs` | the unit's own witness (F-4 A): ten clauses (eight plant clauses, BOUND, LAST) |
| `ci/mrv/plant_mrv.mjs` | the plant preload (p1, p1w, p2, p3). Inert unless MRV_PLANT is set, MRV_DIR is under the temp dir, and the process is a planted keeper, worker or keeper witness |
| `ci/mrv/run_mutants_mrv.mjs` | one mutant per plant clause |
| `ci/mrv/BASE`, `ci/mrv/LEDGER.jsonl`, `ci/mrv/PROOF.md` | — |

`scripts/organism_test.mjs` is NOT touched. Its `KNOWN_RED` carries no entry naming the mlv1 witness at cf1ca54
(`grep -n "mlv1" scripts/organism_test.mjs` → no KNOWN_RED line), so there was nothing to remove. No state file was
written; `.claude/settings.json` is not in this branch's diff.

The waits that were KEPT and not loosened (row 1135 (2)):

- mlv1: I1, I2's DEFERRED wait, I2's after-close retire wait, and I3's DEFERRED and freed waits.
- mlv2 / mlv3: every DEFERRED, retire, lane and drain wait.
- mlv3: T1's prompt retire. T2's retire DECISION keeps BOOT + SLACK: a RETIRING line must appear within that bound of
  the write.

The keeper's one-poll sleep on a held port (`scripts/keeper.mjs:220-224`, `KEEP_POLL_MS` at `:161`) is unchanged (F-2 A).

## 2. MEASURED BEFORE WRITING (base cf1ca54, LF tree, 19 Nov 2026)

`node <scratch>/rep.mjs --tree <LF tree of cf1ca54> --witness ci/<w>/witness_<w>.mjs --n <k> --node <22.23.5 | 24.22.2>`
(node 24.22.2 is the `node-linux-x64@24.22.2` package). Red of total per clause:

```
idle      node 22  mlv1 0/15 · mlv2 0/15 · mlv3 0/15     node 24  mlv1 0/15 · mlv2 0/15 · mlv3 0/15
6 burners node 22  mlv1 0/15 · mlv2 0/15 · mlv3 0/15     node 24  mlv1 I2 MID 1/15 · I3 JUDGE 1/15 (the cascade) · mlv2 0/15 · mlv3 0/15
idle, 30  node 22  mlv3 T2 ONCE 2/30 (both: "retire NO", the respawned worker not up within one first-boot sample + SLACK)
          node 24  mlv3 0/30
```

The sites, read at cf1ca54:

- **A keeper start waited on by a sample:** mlv1 `:109` (I2's re-start, `BOUND`). mlv2 `:130` and mlv3 `:144` (the
  first boot, `BOOT0` = two IMPORTs + three SLACKs, from one sample each). mlv3 `:171-172` (T2's respawned worker,
  `BOUND`).
- **A kill not followed by a port wait:** mlv1 `:102`.
- **A clause leaning on an earlier clause's state:** mlv1 I3 `:134`, mlv2 C2/C3/K5 `:150/:172/:184`, mlv3 T2/T3/T4
  `:165/:183/:209`.

## 3. THE WITNESS, BOTH WAYS (19 Nov 2026, `node ci/mrv/witness_mrv.mjs --org <tree> --base-org <LF tree of cf1ca54>`)

```
build (cf1ca54 + this branch's ci/mlv1-3, ci/mrv), node 22.23.5 (exit 0):
  GREEN MRV the keeper-family witnesses wait a keeper start as a boot, free the port after a kill, and stand each clause on its own keeper · port held 1 ms after the kill (linux, node v22.23.5) · 10 clause(s)
build, node 24.22.2 (exit 0):
  GREEN MRV … · port held 1 ms after the kill (linux, node v24.22.2) · 10 clause(s)
base cf1ca54, node 22.23.5 and node 24.22.2 (exit 1, both):
  RED MRV · M1 RESTART, M1 PORTHELD, M1 ALONE, M2 BOOT, M2 ALONE, M3 BOOT, M3 RESPAWN, M3 ALONE
```

Each plant clause engages on the base and reproduces the shape that was measured there:

- M1 RESTART: `I2 MID · the planted open sitting did not resume`, then `I3 JUDGE · no daemon up`.
- M3 RESPAWN: `T2 ONCE … retire NO`.
- M2 BOOT and M3 BOOT: `cannot run: no daemon answers its planted port`.

BOUND passes on the build: 8 files differ, all named.

The re-cut keeper witnesses, unplanted, repeated (`rep.mjs --n 10`, then `--n 30` for mlv3, 19 Nov 2026):

- node 22: mlv1 0/10, mlv2 0/10, mlv3 0/30.
- node 24: mlv1 0/10, mlv2 0/10, mlv3 0/30.

The base reference for mlv3 was T2 at 2/30 on node 22.

## 4. MUTANTS (19 Nov 2026, `node ci/mrv/run_mutants_mrv.mjs --org <build tree> --base-org <LF tree of cf1ca54>`)

```
node 22.23.5: run_mutants: 8 of 8 mutant(s) RED by the clause that names them · control GREEN
node 24.22.2: run_mutants: 8 of 8 mutant(s) RED by the clause that names them · control GREEN
```

Each mutant reverts one repair:

- M1 RESTART: the one-sample `waitFor` is back.
- M1 PORTHELD: the port-free wait is removed.
- M1 ALONE: I3 has no keeper of its own.
- M2/M3 BOOT: `waitFor(portUp, BOOT0)` is back.
- M2/M3 ALONE: `ready()` starts no keeper.
- M3 RESPAWN: the respawn wait is bounded by one sample again.

## 5. SELFTESTS, MEMBERS, LAWS (19 Nov 2026, each on LF clones made with core.autocrlf=false)

- **Selftests touched:** none. No organ file is in the diff.
- **Members touched:** WITNESS ‹mlv1›, ‹mlv2› and ‹mlv3› are re-cut, and ‹mrv› is new. The neutral machine judges them
  (§7). This container cannot run the witness member (`GITHUB_ACTIONS` unset, `scripts/organism_test.mjs` WITNESS_SKIP).
- **The hermetic suite** (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, exit 2 on both). Base
  and build print the same headline: `organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126`. The three
  fails are identical and are the cf1ca54 tree's own in this container: the selftest-coverage law, `sandbox selftest`,
  and the all-members roll-up.
- **`node scripts/lawpack.mjs gate`** (exit 1 on both). The count line is byte-identical base vs build:
  `findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7`.
  Its one RED (`jugad-literal-subject-list ROSE — 93, baseline 90`) is on the base, and belongs to unit mlaw (row 1120
  (1) F4 A), not this unit. **No count rose.**
- **`node scripts/models.mjs check`** → exit 0
  (`models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)`).

## 6. WHERE THE BUILD DIFFERS FROM THE SPEC (the ruling wins)

- **F-1:** the spec recommended C (a Legacy copy). Row 1135 (2) ruled A: in place, the old text struck, no Legacy copy.
- **F-3:** the measured variant planted the closed sitting (A). The ruling is B: the owner closes through the planted
  door. The close is bounded by BOOT + SLACK.
- **F-4:** the spec named `ci/mrv2/witness_mrv2.mjs`. The ruling names `ci/mrv/witness_mrv.mjs`. The spec put the plants
  inside variant copies. Here they enter from OUTSIDE the judged witness: a preload and a holder child, so the judged
  bytes carry no plant code.
- **F-5 A:** the spec's instruments (`measure_mlv1.mjs`, `variants_mlv1.mjs`, `probe_arm.mjs`) stay on
  `claude/mrv-spec`. This seat's own repetition script stayed in its scratch dir.
- **F-6** (the spec's open fork, aa1b019): replaced by row 1139 (1) F-6 A, which brings mlv2 and mlv3 into this unit.
- **p2's hold:** the spec held the port for one BOOT. Here it is held for BOOT − SLACK, both measured by mlv1. A hold of
  exactly BOOT sits at the a-2 bound's edge (bound BOOT + SLACK), so it would judge the timer, not the wait. One early
  local run measured `held 243 ms · bound 258 ms`. The base is still red with the shorter hold.
- **p2's mechanism:** a holder outside the keeper's tree. The judged witness learns of the keeper's exit only once the
  holder holds the port. A race-only holder lost to mlv1's own probe on Linux (measured, ledger), so it modelled nothing.

## 7. THE NEUTRAL MACHINE

<!-- RESULT-CI -->
These were read through the public API with curl and no token (`GET /actions/runs/<id>/jobs`, `GET /actions/jobs/<id>/logs`),
on 19 Nov 2026.

**Run 44502507102 · head 65161b2 (the build tip before this proof) · merge base 224f9b9 · conclusion failure.**

```
job 135485619618  npm test · node 22  failure
  ok   WITNESS ‹mlv1› · GREEN at head against its BASE      (ran in 4.9 s)
  ok   WITNESS ‹mlv2› · GREEN at head against its BASE      (ran in 5.9 s)
  ok   WITNESS ‹mlv3› · GREEN at head against its BASE      (ran in 5.7 s)
  ok   WITNESS ‹mrv› · GREEN at head against its BASE       (ran in 96.7 s)
  B1_VERDICT node 22 RED — 2 member(s) red that are not red at the merge base · head 65161b2 · base 224f9b9 · 2 new red · 1 base red
  new: WITNESS ‹mf2› · WITNESS ‹mjd3›
job 135485620317  npm test · node 24  failure
  ok   WITNESS ‹mlv1› · GREEN at head against its BASE      (ran in 4.4 s)
  ok   WITNESS ‹mlv2› · GREEN at head against its BASE      (ran in 5.7 s)
  ok   WITNESS ‹mlv3› · GREEN at head against its BASE      (ran in 4.8 s)   ← red at 03ec8d7 (run 44449927896, job 135311176092); GREEN here
  ok   WITNESS ‹mrv› · GREEN at head against its BASE       (ran in 93.8 s)
  B1_VERDICT node 24 RED — 2 member(s) red that are not red at the merge base · head 65161b2 · base 224f9b9 · 2 new red · 1 base red
  new: WITNESS ‹mf2› · WITNESS ‹mjd3›
```

The two new reds, ‹mf2› and ‹mjd3›, come with the cf1ca54 cut. Each is ruled in its KNOWN_RED (row 1107: owners mrf
and mr3), and by the architect's word they are NOT this unit's. **No keeper-family member and no mrv member is red on
either leg.** The run of the push that carries this proof cannot be written into it; the final message names it.

### 7.1 The three keeper witnesses, both ways (19 Nov 2026, local, LF trees)

Each ran as `node <build>/ci/<u>/witness_<u>.mjs --org <tree> --base-org <LF tree of ci/<u>/BASE>`, with the build at
65161b2 and each unit's own BASE kept: mlv1 009f52e, mlv2 4d166d3, mlv3 40347a6.

```
                 at the build (--org 65161b2)     at its own BASE (--org BASE)
node 22.23.5
  mlv1           RED MLV1 · BOUND                 RED MLV1 · I1 IDLE, I2 MID, I3 JUDGE
  mlv2           RED MLV2 · BOUND                 RED MLV2 · C1 IDLE, C2 LANE, C3 JUDGE, K5 DOOR, LIVE-SAFE
  mlv3           RED MLV3 · BOUND                 RED MLV3 · T1 IDLE, T2 ONCE, T3 INFLIGHT, T4 JUDGE, LIVE-SAFE
node 24.22.2
  mlv1           RED MLV1 · BOUND                 RED MLV1 · I1 IDLE, I2 MID, I3 JUDGE
  mlv2           RED MLV2 · BOUND                 RED MLV2 · C1 IDLE, C2 LANE, C3 JUDGE, K5 DOOR, LIVE-SAFE
  mlv3           RED MLV3 · BOUND                 RED MLV3 · T1 IDLE, T2 ONCE, T3 INFLIGHT, T4 JUDGE, LIVE-SAFE
```

At the build, only BOUND is red: the build has moved past each unit's BASE, and the member drops BOUND (`judgeLast`), so
each member reads GREEN, as the neutral machine shows above. At each BASE, every behaviour clause is red: the keeper code
is not there yet.

## 8. FORKS (each for the architect)

- **F-7 · the port-held figure cannot reach a leg's log from the named files** (row 1135 (5)). The witness prints it
  (`PORT_HELD mlv1 · <platform> · node <v> · held <ms> ms after the kill …`), and witness_mrv's GREEN last line carries
  it. But the workflow's log carries assert NAMES only (`.github/workflows/suite.yml`, the `grep -E "^  (ok  |FAIL|LIVE) "`
  of the head step), and the member writes the witness's output to a runner temp file (`scripts/organism_test.mjs`,
  `out.txt` in `witnesses()`). Options:
  - **A.** The member echoes a witness's `PORT_HELD` lines as a named measurement line, as it does `ran in <s> s (B5)`
    (`scripts/organism_test.mjs`, unit ms1's file).
  - **B.** The workflow greps `^PORT_HELD ` from the member's output (`suite.yml`).
  - **C.** The runner reads it on his laptop.

  The Windows figure stays UNMEASURED until one of these is ruled.
- **F-8 · ANSWERED by run 44502507102:** mlv3 is GREEN on node 24 at 65161b2. What follows is kept as the record. The
  mlv3 node-24 neutral red's clause was inferred, not read. The log names only `WITNESS ‹mlv3›`. T2 is the
  only mlv3 clause that reds anywhere it was measured (base node 22, 2/30, "retire NO"), and the ruling on 03ec8d7 put
  that red in this class. If the neutral machine still reds mlv3 after this push, the clause is another one, and it needs
  F-7's kind of door to be read.
- **F-9 · mlv2 and mlv3 lose their first-boot TIME bound** (`BOOT0`), as mlv1's first boot never had one (`:84`, "unbounded
  by design"). I read BOOT0 as a witness clock, not a promptness claim about the code: no clause reds on it, and it only
  shrinks every later bound when a boot is slow. If the architect reads it as a claim, the repair narrows to keeping BOOT0
  as a named red on the first boot.
- **F-10 · witness_mrv's run time on the neutral machine.** It took 88.0 s (node 24) and 93.9 s (node 22) at 03ec8d7.
  M3 ALONE's mutant takes about 61 s, because T2 then waits its own drain tick plus BOUND.

## 9. OPEN QUESTIONS

- F-7 (how the Windows port-held figure reaches the runner's row) and F-9 (BOOT0) need a ruling. F-8 is answered (mlv3 is
  GREEN on node 24 at 65161b2, run 44502507102).

## 10. STATUS

COMPLETE at the push that carries this file. The architect re-runs the three keeper witnesses before anything merges
this branch.
