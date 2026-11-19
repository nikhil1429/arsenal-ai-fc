# PROOF — unit mrt BUILD (forks rows 1107 (2) / 1112 (1) / 1119 (1) (2) (4) F-c / 1120 (1) (4))

Written 19 Nov 2026 by the cloud builder seat (unit mrt). Branch `claude/mrt-build`. Every measurement below is the output of the
command beside it, run 19 Nov 2026 on linux, node 22, on LF clones (`core.autocrlf=false`) under `os.tmpdir()`. Nothing landed,
no PR, no live model call, no push to any ref but this branch, nothing under `dressing-room/state` written or staged.

## 1. BASE — what the build is cut from

- `git checkout -b claude/mrt-build 52b51c1` (the ms1 tip the architect re-ran GREEN, row 1119 (1)).
- `scripts/keeper.mjs` differs between `52b51c1` and `origin/main` (unit mport landed after the ms1 base), so before any edit:
  **`git merge --no-edit origin/main` → merge commit `51055bb`** (main tip `224f9b9`; clean, no conflict; a merge, never a rebase).
- **`ci/mrt/BASE` = `51055bb2df441989707f57e2038378b3db831e0c`** — the tree every edit was made on (`52b51c1` + main).
  DIFFERENCE FROM THE BRIEF'S WORDING, named: the brief says "the sha you cut from"; the branch is cut from `52b51c1`, but a
  BASE of `52b51c1` would make BOUND read main's merged files (CLAUDE.md, captains_call, cortex, services, thalamus) as this
  unit's. `51055bb` is a commit of this branch, so it is in every clone that carries the build (the member never fetches).

## 2. THE DIFF (`git diff --stat 51055bb <tip>`) — named files only

| File | What | Ruling |
|---|---|---|
| `scripts/keeper.mjs` | `sourceGraph` / `staleSources` appended VERBATIM (body + inline comments, from `brain.mjs` 7070-7106 at BASE), exported; `const { sourceGraph, staleSources } = await import("./brain.mjs");` (BASE line 124) deleted; header MODES line names them | row 1120 (1) T3 (b), F1 A |
| `scripts/brain.mjs` | the two definitions replaced by `export { sourceGraph, staleSources } from "./keeper.mjs";`; line 89's import gains both names (brain's selftest and retire path call them unqualified). brain's STALE-CODE RETIREMENT comment block stays where it was | row 1120 (1) F1 A |
| `ci/mtail/w_preload.mjs` | ABORT seam re-cut (spec §4.3): only `POST /close`'s wait on the scaled clock; every wait logged unscaled with `{ms, method, path, scaled}`; old header text struck | row 1120 (1) T2 (a), F2 A, F3 A; row 1119 (4) F-c |
| `ci/mtail/witness_mtail.mjs` | T2: `waitOf` reads the `POST /close` row, new conjunct `probed` (first request `GET /status`, unscaled) for slow and fast; T3: edge-set form (every no-circular from→to row of `--org` is a row of BASE's) beside the count; old clause text stays in the header, struck, the re-cut names unit mrt and row 1120 (1) | row 1120 (1) F5 B; row 1112 (1) |
| `scripts/organism_test.mjs` | the KNOWN_RED entry `WITNESS ‹mtail› · GREEN at head against its BASE` (row 1107, owner unit mrt) removed; a two-line retired note in its place | row 1120 (4) |
| `ci/mrt/*` | witness, mutants, BASE, LEDGER, this PROOF | — |

Not touched: `scripts/lawpack.mjs` (`BASELINE.depcruise_errors` stays 7 — the repair makes main meet it), `scripts/sitting.mjs`
(mday's ruled behaviour, read only), `.claude/settings.json`. No state file is read or written by the repair; keeper.mjs writes
nothing (its header) and brain.mjs's sole-writer lanes are untouched.

## 3. MEASURED BEFORE WRITING (at BASE 51055bb)

```
dependency-cruiser --config .dependency-cruiser.cjs --output-type json scripts hooks
  BASE 51055bb : no-circular 13 · keeper.mjs local deps: scripts/brain.mjs (dynamic, keeper.mjs:124)
  build        : no-circular 7  · keeper.mjs local deps: none
    rows: brain→sitting · brain→state · context_manifest→learnstate · context_manifest→sitting · learnstate→brain ·
          learnstate→state · sitting→state
node scripts/lawpack.mjs gate
  BASE : RED jugad-literal-subject-list ROSE — 93, baseline 90 · RED depcruise_errors ROSE — 13, baseline 7 · lawpack: 2 RED
  build: RED jugad-literal-subject-list ROSE — 93, baseline 90 · lawpack: 1 RED   (jugad = unit mlaw, row 1120 (1) F4 A — not this unit)
```

## 4. THE WITNESS BOTH WAYS (`node ci/mrt/witness_mrt.mjs --org <tree> --base-org <LF 51055bb>`)

```
--org <LF build tip>   GREEN MRT the T3 repair · 6 clause(s)                     (exit 0)
--org <LF 51055bb>     RED MRT · R1 CYCLES · R2 LEAF · R4 LAWPACK                 (exit 1)
```

R1, R2 and R4 are RED on the base and GREEN on the build. **R3 MLV1 KEPT is the contrast clause** (spec §5.1): it is GREEN on
both sides by design, because the repair must not undo mlv1's deferred retire. Its RED way is the mutant M-R3 (§5). This is
named as a DIFFERENCE from the brief's "RED on the base" for every clause. BOUND is GREEN on the build (5 named files differ) and
GREEN on base-vs-base.

DIFFERENCE FROM THE SPEC, named: spec §5.1 R1 reads "vs `--base-org` d0c8c96". The ms1 member hands this witness
`--base-org` = `ci/mrt/BASE` (51055bb, 13 cycles), so a count comparison against it alone would be GREEN on the base as well. R1
therefore reads the ruled reference that is in the BASE tree: lawpack's frozen `BASELINE.depcruise_errors` (7), imported from
`--base-org`'s own lawpack.mjs (so a build cannot loosen the gate it is judged by). It also asserts ≤ BASE's own count, and
that no circular edge touches keeper.mjs. The edge-set form against d0c8c96 (F5 B) lives where the ruling puts it, in mtail T3.

## 5. MUTANTS (`node ci/mrt/run_mutants_mrt.mjs --org <LF build> --base-org <LF 51055bb>`)

```
  control · GREEN MRT the T3 repair · 6 clause(s) (exit 0)
  M-R1 · RED by R1 CYCLES · RED MRT · R1 CYCLES · R2 LEAF · R4 LAWPACK (exit 1)
  M-R2 · RED by R2 LEAF · RED MRT · R2 LEAF (exit 1)
  M-R3 · RED by R3 MLV1 KEPT · RED MRT · R3 MLV1 KEPT (exit 1)
  M-R4 · RED by R4 LAWPACK · RED MRT · R4 LAWPACK · BOUND (exit 1)
  M-BOUND · RED by BOUND · RED MRT · BOUND (exit 1)
run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
```

M-R2 shows R2 is not R1 restated: brain keeps its own copy, there is no cycle, and R1 stays GREEN. M-R4 tightens lawpack's
frozen count to one below the build's, so it also trips BOUND because lawpack.mjs is outside the named files; R1 stays GREEN
because it reads the BASE's lawpack.

## 6. THE LANDED mtail WITNESS, RE-CUT (`node ci/mtail/witness_mtail.mjs --org <tree> --base-org <LF d0c8c96>`, ci/mtail/BASE unchanged)

```
--org <LF build>    ok T1 F-B · ok T2 F-C (… CLI wait 393000 ms · probe GET /status 1200 ms · contrast printed) ·
                    ok T3 AUTH (… depcruise no-circular 7 vs BASE 7 · rows not in BASE's: none) · ok T4 F1 · RED BOUND · ok LAST
                    RED MTAIL · BOUND                         (BOUND is dropped by the ms1 member: GREEN beyond BOUND)
--org <LF 51055bb>  RED MTAIL · T3 AUTH · BOUND               (T3: no-circular 13 vs BASE 7; six rows not in BASE's)
--org <LF d0c8c96>  RED MTAIL · T1 F-B · T2 F-C · T3 AUTH · T4 F1   (T2: CLI wait 240000 ms · probe POST /close — BASE has no probe)
```

T2 by repetition, measured 19 Nov 2026 with the build suite running beside it (CPU contention):

```
for i in 1..10: node ci/mtail/witness_mtail.mjs --org <LF build> --base-org <LF d0c8c96>
  T2 F-C ok in 10 of 10 runs   (the spec measured head 7/10 RED under the old seam)
```

F5 B was not planted by its own mutant (a cycle swapped for another one). It is NAMED, not run: the conjunct is
`newRows.length === 0` beside `cOrg <= cBase`, and the base leg above shows the rows it reads.

## 7. SELFTESTS TOUCHED — before (51055bb) and after (build), headline line

```
node scripts/keeper.mjs selftest   (ARSENAL_JUDGE_PORT planted from a listen(0) port, LF clone under os.tmpdir)
  before: keeper selftest: 17 passed, 0 failed
  after : keeper selftest: 17 passed, 0 failed
node scripts/brain.mjs selftest    (HOME / USERPROFILE / ARSENAL_ARCHIVE under a temp dir) — brain prints no count headline;
                                   counted by its own ✓ / ✗ lines:
  before: 443 ✓ · 1 ✗ (GEMINI SHIM — a spaced %APPDATA% path is QUOTED before cmd.exe parses it) · exit 1
  after : 443 ✓ · 1 ✗ (the same assert) · exit 1 · the ✓/✗ line set is IDENTICAL on both sides (diff empty)
```

The GEMINI SHIM failure is a cmd.exe quoting assert that cannot pass on linux (spec N2). The SOURCE GRAPH asserts that brain's
selftest drives through the re-export pass on both sides.

## 8. THE MEMBER — every member touched, before and after

`ORGANISM_TEST_PROFILE=hermetic GITHUB_ACTIONS=true node scripts/organism_test.mjs all` on an LF clone of each side (the member
runs only under that env), 19 Nov 2026:

```
(see §8.1, filled from the clean base run)
```

## 9. models check

```
node scripts/models.mjs check   → exit 0 (literal model names outside models.mjs: 0)
```

## 10. NEUTRAL MACHINE (suite workflow; check runs read via the public API, no token)

| Push | Run | Check runs | Conclusion |
|---|---|---|---|
| `2a0e37c` | `44438967888` | `135274781369` node 22 · `135274781900` node 24 | cancelled (superseded) |
| `08629d1` | `44439264907` | `135275831299` node 22 · `135275831674` node 24 | cancelled (superseded) |
| `06db9f8` | `44439372749` | `135276191246` node 22 · `135276191776` node 24 | cancelled (superseded) |
| `b4c9d19` | `44439863633` | `135277799076` node 22 · `135277799449` node 24 | see the final message |
| `044ebf8` | `44440113630` | `135278640263` node 22 · `135278640519` node 24 | see the final message |

The last push's runs are named in the seat's final message (this file cannot carry its own sha).

## 11. FORKS (not edited; the architect's to rule)

- **FK1 · main carries UNRULED reds the ms1 member sees, at BASE and at the build alike (not this unit's).** Main's mport made
  `JUDGE_PORT = plantedPort("ARSENAL_JUDGE_PORT", 4118)`, so `organPorts()` (organism_test.mjs) no longer reads an env door on
  that line. B4 then flags every witness that names `JUDGE_PORT` (mland, mlj, mlv0, mlv1, ms1). Also UNRULED on both sides:
  the selftest-coverage law (orphaned deck_lint, home_pin, probe, study_scope), the sandbox member (tripwire attempts), and
  `WITNESS ‹mfac›` (F4 W3.2). Owner: the ms1 seat's assembled landing (row 1119 (2)), or a unit the architect names.
- **FK2 · ci/mrt/BASE = 51055bb, not 52b51c1** (§1). Decides: whether the assembled landing wants a BASE outside main's first
  parent. It is a commit of this branch, so it arrives with the merge.
- **FK3 · R3 is GREEN on the base by design** (§4). Its RED way is a mutant. Decides: whether the brief's "each clause RED on the
  base" admits the spec's contrast clause.
- **FK4 · F5 B has no own mutant** (§6). A swap mutant needs a second cycle planted while one is removed. Can be added if ruled.
- **FK5 · lawpack in a state-less copy reads one more RED than in a full clone** (the witness's R4 copy: `lawpack: 2 RED`; the
  clone: `1 RED`). R4 reads only the `depcruise_errors` line, so the clause is unaffected; the extra line is NAMED, not chased.

## 12. NAMED NOT GUESSED

- N1 (spec) — T2 on windows-latest with the re-based seam: the neutral machine's two legs, §10.
- N2 (spec) — brain selftest GEMINI SHIM on win32.
- N5 (spec) — a resident on his laptop retiring on the moved bytes after a landing (keeper.mjs and brain.mjs both move, both
  are in the closure): `node scripts/services.mjs status` on his laptop only.
- The effort receipt tool `campaign-2026-09/tools/effort_receipt.mjs` — its result is named in the final message.
