# UNIT mt1 · PROOF — the single-sample retire wait takes T2's repair (forks rows 1139 (1) / 1276 / 1277)

> Witness-only. Branch `claude/mt1-build`, cut from main 0ee0516 and merged up to main **96be529** (row 1277; mtrap shares
> no `ci/mlv*` file with this unit). `ci/mt1/BASE` = 96be52946a2aa37cd4eae561b595c39e81296c0c. It carries no mbank byte.
> Every run below is from 22 Nov 2026, in this cloud seat, on LF clones (`core.autocrlf=false`), node v22.23.5.
> **node 24 was not run here; it is owed to the neutral machine's two legs.**

## 1 · WHAT CHANGED (only `ci/mlv1/witness_mlv1.mjs`, `ci/mlv2/witness_mlv2.mjs`, `ci/mlv3/witness_mlv3.mjs`, plus `ci/mt1/`)

Each file gains a header block naming unit mt1 and row 1276, and ONE helper, `retireThenBoot(n0, isNew)`, of T2's repaired
shape (rows 1135 / 1139, the "UNIT mrv" block in mlv3's header). The **retire keeps its bound**: a `RETIRING` line, or the
keeper's clean-retire `worker exit … respawn now` line, must appear within BOOT + SLACK of the act that retires. The
**respawned worker is a BOOT that ends on an event**: it answers · a worker exit that is not a clean retire, or a second
one · `keeper waiting` · the keeper's exit. Each changed clause prints `retire <ms> · respawn <ms>`, so a later red carries
its own measurement.

| Clause | Before (struck in place) | After |
|---|---|---|
| mlv1 I1 IDLE, I2 MID (after close), I3 JUDGE (after the port is freed) | `const s2 = await waitFor(<a new pid>, BOUND);` | `const rb = await retireThenBoot(nR, <a new pid>), s2 = rb.s2;` |
| mlv2 C1 IDLE, C2 LANE (after the lane closes), C3 JUDGE (after the port is freed), K5 DOOR (after `/restart`) | the same single sample | the same helper |
| mlv3 T1 IDLE, T3 INFLIGHT (after the body ends), T4 JUDGE (after the port is freed) | `const s2 = await waitFor(newBoot(s1), BOUND);` | the same helper |

`nR` is `out.length` taken just before the act that retires (the closure write, the close, the lane's release, the body's
end, the restart call). mlv3 T2 already had this shape (unit mrv) and is unchanged. Every assertion is unchanged: what each
clause claims is still claimed. Every DEFERRED, drain, lane and idle wait keeps its bound, and no promptness claim about the
code is loosened.

## 2 · THE PLANT, ONE PER CHANGED CLAUSE, AND THE MUTANTS

The plant is a copy of the tree whose `scripts/keeper.mjs` waits, before each RESPAWN, as long as the worker it replaces
ran. That is the keeper's own measured `ran`; no number is typed. It gives a respawn slower than one first-boot sample: the
neutral machine's shape. A stop during that wait stops the keeper, as its loop head does. Each mutant puts ONE site back to
the single sample.
```
$ node ci/mt1/witness_mt1.mjs --org <build e9052da> --base-org <main 96be529>
  GREEN PLAIN-mlv1 · GREEN MLV1 … · changed clauses GREEN with their retire/respawn times 3/3
  GREEN P-mlv1-I1 · org GREEN · retire 6 ms · respawn 646 ms | base RED
  GREEN P-mlv1-I2 · org GREEN · retire 2 ms · respawn 621 ms | base RED
  GREEN P-mlv1-I3 · org GREEN · retire 2 ms · respawn 1113 ms | base RED
  GREEN PLAIN-mlv2 · GREEN MLV2 … · changed clauses GREEN with their retire/respawn times 4/4
  GREEN P-mlv2-C1 · org GREEN · retire 3 ms · respawn 676 ms | base RED
  GREEN P-mlv2-C2 · org GREEN · retire 7 ms · respawn 1681 ms | base RED
  GREEN P-mlv2-C3 · org GREEN · retire 1 ms · respawn 2673 ms | base RED
  GREEN P-mlv2-K5 · org GREEN · retire 30 ms · respawn 3126 ms | base RED
  GREEN PLAIN-mlv3 · GREEN MLV3 … · changed clauses GREEN with their retire/respawn times 3/3
  GREEN P-mlv3-T1 · org GREEN · retire 6 ms · respawn 680 ms | base RED
  GREEN P-mlv3-T3 · org GREEN · retire 0 ms · respawn 1660 ms | base RED
  GREEN P-mlv3-T4 · org GREEN · retire 1 ms · respawn 2153 ms | base RED
  GREEN BOUND · 8 file(s) differ
  GREEN LAST · 0 survivor(s)
GREEN MT1 … · 15 clause(s)
$ node ci/mt1/witness_mt1.mjs --org <main 96be529> --base-org <main 96be529>
RED MT1 · PLAIN-mlv1, P-mlv1-I1, P-mlv1-I2, P-mlv1-I3, PLAIN-mlv2, P-mlv2-C1, P-mlv2-C2, P-mlv2-C3, P-mlv2-K5, PLAIN-mlv3, P-mlv3-T1, P-mlv3-T3, P-mlv3-T4
$ node ci/mt1/run_mutants_mt1.mjs --org <build> --base-org <main 96be529>
run_mutants: 10 of 10 mutant(s) RED by the clause that names them · control GREEN
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all          # on the build clone
organism_test: 169 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)
$ node scripts/gates.mjs report                                               # LF clone of the build
gates types  · 21 organ(s) @ts-check'd (baseline 14, may only grow) · undefined-symbol family 0 (must be 0) · other checkJs diagnostics 296 (baseline 296, may only fall)
gates lint   · 344 error(s) · 2 warning(s) · no-empty 262 · no-unused-vars 82 · (directive) 2 (frozen: no-empty 262 · no-unused-vars 82 · warnings 2)
gates: GREEN — nothing rose, the undefined-symbol families are 0 on both sides, and every schema'd state file matches
```
On the base, each plant clause is RED by the single-sample wait it removes. Run by hand on 0ee0516's mlv1 under the plant:
`the same pid … after 281 ms (no retire)` · `after close pid → UNCHANGED` · `freed → no retire`.

## 3 · THE ORDER, mlv0 THEN mlv3 (the architect's line (i)-(iii), row 1276)

`ci/mt1/MLV0_MLV3_40.txt`: mlv0's witness then mlv3's, back to back, twenty times with the BASE mlv3 witness (tree 0ee0516)
and twenty with the repaired one. Each line holds mlv0's last line, the listening node ports and witness-family node
processes at the moment mlv3 starts (lsof / ps), the first boot, the bound, and T1's line (the repaired one carries its
retire and respawn times).
```
base mlv3 after mlv0      T1 red 0 / 20
repaired mlv3 after mlv0  T1 red 0 / 20
at mlv3 start, all 40     listening node ports [] · witness-family node processes 0
```
**(ii) does not apply:** mlv0 leaves no process and no held port behind it, so mlv0 is not changed. **(iii): the base is
green forty of forty after mlv0.** mt1 lands as ruled on the plant above, and **the neutral-machine cause of T1's red (node
24, run 137021937008) stays UNMEASURED: named, not explained.** This seat reproduced it neither alone (mbank's
`ci/mbank/MLV3_50.txt`: 0/50) nor in the real order (0/40).

CHECKPOINT · mt1 built at the branch tip on main 96be529 · `GREEN MT1 … · 15 clause(s)` / `RED MT1 · <all 13>` (main) · `run_mutants: 10 of 10 … · control GREEN` · hermetic `169 passed, 0 failed` · gates GREEN (checkJs 296, lint frozen) · order 0/20 · 0/20 · NEXT: the architect's re-run; the neutral legs (node 22 and node 24) read on this tip; mbank re-cut above mt1 after it lands
