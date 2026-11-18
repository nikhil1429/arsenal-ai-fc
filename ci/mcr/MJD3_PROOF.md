# MJD3 PROOF — the settle tail of a judge round is bounded inside its budget (forks row 1025 (4))

**Base:** `origin/claude/mtail-landing` at `074ead9` (it existed, so the mtail changes are under this build; it is also
`origin/main` per the architect's row 1028 message). **Branch:** `claude/mcr-mjd3-build`. **Files edited:**
`scripts/gaffer_brain.mjs` only (sha256 `d4221153…`, +136 / −24). Witness and mutants live in `ci/mcr/`.

## What was built (branch B1 of `ci/mtail/FD_SPEC.md`, as ruled)

| Ruled | Where in `scripts/gaffer_brain.mjs` |
|---|---|
| gradeJudge reserves the tail before it sizes a batch | `settleReserveMs`, `judgeBatchWithTail` (beside `judgeBatchSize`); the round loop sizes with them and kills the call at `call_ms = remaining − tail` |
| each settle step re-reads what remains before it spawns | `settleBatch`: `left()` / `fits()` before the key_doubt card, before the second opinion, before the 💎 card, before each dispatch |
| an item that does not fit stays OUTSTANDING, never coerced | `deferred[]` (no settled row, no dispatch); on every receipt as `deferred` |
| the second opinion is handed a deadline clipped to what remains | `secondWithin(item, min(WATCHER_DEADLINE_MS, room))`: an abort at the deadline on the round's timer, later fetches refused, retry sleeps ended (`callWatcher` forwards `sleepFn`) |
| callers and the close budget do not move | `scripts/sitting.mjs`, `dugout.mjs`, `postmatch.mjs` untouched (clause BOUND) |
| ADDED: a kill mid-settle never counts a rep twice | a checked `dispatching` write-ahead row before the owner is called; `outstandingGrades` treats it as taken; `inDoubtGrades` names it; `in_doubt` on every receipt |

## Witness, both ways — `node ci/mcr/witness_mjd3.mjs --org <tree> --base-org <base tree>`

Trees are LF `git archive` exports under the temp dir. Scale measured each run: `R = JUDGE_DISPATCH_MS / (20 · S)`, S the
slowest of three `node -e 0` starts, so the real slack is 20 node starts (≥ 10, the ruling's floor).

Build vs base (`ci/mcr/out_mjd3/witness_build.txt`):
```
GREEN J1 · returned at 240547 of 330000 clock ms · settled 2 of 6 · outstanding 4 · coerced 0 · batches [{"size":3,"budget_ms":99974.5…,"tail_ms":200000}]
GREEN J2 · overshot call · returned at 280496 of 330000 clock ms · settled 2 · outstanding 4 · deferred 1
GREEN J3 · second opinion(s) handed deadline(s) [20000] at clock [60335] · returned at 140431 of 330000
GREEN J4 · round 1 exit 9 after 2 rep(s) · round 2 reps {"c:0":1,"c:1":1,"c:2":1,"c:3":1} · twice none · in doubt [{"of":"m1","ref":"hidden_test:c:1"}]
GREEN BOUND · differs: scripts/gaffer_brain.mjs
GREEN LAST · 0 node process(es) naming <tmp>/mjd3-XXXX
GREEN MJD3 the settle tail is bounded inside the round's budget and a kill mid-settle never dispatches twice · 6 clause(s)
```
(the J lines above are from the run before the saved one; the saved file carries its own numbers, same verdicts)

Base vs base (`ci/mcr/out_mjd3/witness_base.txt`): `RED J1 J2 J3` (killed at the child cap — the tail and the unbounded
second-opinion walk run past it), `RED J4` (`c:1` dispatched twice, no `in_doubt`), last line `RED MJD3 · J1 J2 J3 J4`.

## Mutants — `node ci/mcr/run_mutants_mjd3.mjs` (`ci/mcr/out_mjd3/run_mutants.txt`)
```
MUTANT J1 · the tail reserve is zero → RED MJD3 · J1 J2 · RED by its clause
MUTANT J2 · the settle never re-reads what remains → RED MJD3 · J2 · RED by its clause
MUTANT J3 · the second opinion is handed no deadline → RED MJD3 · J1 J3 · RED by its clause
MUTANT J4 · a write-ahead row does not take a capture out of the queue → RED MJD3 · J4 · RED by its clause
MUTANT BOUND · a caller moves too (scripts/sitting.mjs touched) → RED MJD3 · BOUND · RED by its clause
run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN (LAST has no mutant: the witness's own cleanup)
```

## Gates
- `node scripts/gaffer_brain.mjs selftest`: base **190 passed, 0 failed** → build **194 passed, 0 failed** (4 new mjd3 asserts).
- `node scripts/models.mjs check`: exit 0.
- The neutral machine: the suite workflow's run on each push of this branch (ids in `ci/mcr/LEDGER.jsonl`).

## Existing asserts touched (no assert deleted, none renamed)
- `mjud F3 · the first batch is killed at what the CHECK left …` — its predicate now subtracts the batch's own reserved tail
  (the ruled change: the call is killed at what remains minus the tail); the name is unchanged.
- Five selftest `appendRow` plants (L2 by code, L2 by hand, L2 settlement write, mclose, mjday) now answer the new
  `dispatching` row ok and record only what they recorded before; their predicates are unchanged.

## FORKS (for the architect)
1. **IN DOUBT is at-most-once.** A capture killed between its write-ahead row and the owner's write is never re-dispatched,
   so that rep is counted ZERO times (named on every receipt). Exactly-once needs an idempotency key read by the OWNERS
   (`capture.mjs rep`, `rejirah.mjs grade`, `doubtminer.mjs retire`) — files outside this unit.
2. **FD_SPEC's `T_item(second) = 3·JD + S` is measured as `2·JD + S`:** a 💎 card and the owner dispatch are exclusive
   (a diamond is never dispatched, `settleBatch`), so the reserve is `2·JUDGE_DISPATCH_MS (+ WATCHER_DEADLINE_MS)`.
3. **The reserve is exact**, so when every plant runs to its full timeout, real overhead defers the last item of a batch
   (J1: 2 of 3 settled). Throughput cost named in FD_SPEC B1; measurable on the ledger as captures settled per round.
4. `WATCHER_DEADLINE_MS` is now exported (the witness reads it rather than typing it).
5. After a deadline, models.mjs's walk may still iterate its remaining candidates × keys in the background; every fetch
   is refused at once and every sleep ends at once, so it ends in microseconds — measured only through J1/J3's LAST.
