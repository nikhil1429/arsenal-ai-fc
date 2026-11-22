# MG9 PROOF — the G9 witness's own wait, repaired

Unit mg9 (forks rows 1314 (2) / 1315 (4)), built by the mcrk2 seat on 22 Nov 2026 IST. **Not a landing.** It rides as a car
of train 2.

## 1. Base and bound

- **Branch:** `claude/mg9-build`, cut from main **84cbc03** (`git checkout -b claude/mg9-build 84cbc03`).
- **`ci/mg9/BASE`** = `84cbc03126eddb85c7d5cf54b51610068800315c`.
- **Bound:** `ci/witness/mcrk2/witness_crack_gap.mjs` and `ci/mg9/` only. **No product byte changes.**

## 2. The defect (measured on claude/mcrk2-g9 5e975f6: ci/mcrk2/G9_50.txt and G9_PROBE.txt)

The G9 and G8 plants stamp archive records up to 40 ms in the future (`later(10|20|40)`), and compileDay then read its own
clock. A machine that reached the compile in under 20 ms had those records dropped, because `scripts/exchanges.mjs:129`
drops any record after `now`. G9 (ii) then read NOT PLACED, and G8 would lose its diff. The race was in the witness's own
wait, not the product's settle.

## 3. The repair in one line

`archive()` returns `lastAt`, the latest record time it planted, and the `compile` helper hands compileDay
`now: () => new Date(Math.max(Date.now(), lastAt + 1))`. All five G8 / G9 compile calls pass their archive's `lastAt`. The old
helper line is kept, struck in place (`~~const compile = (N, p, arc, D) => …~~`), with the reason beside it.

## 4. The unit witness, both ways (22 Nov 2026)

`ci/mg9/witness_mg9.mjs` has four clauses: FAST, STRUCK, BOUND and LAST. FAST plants the fast machine deterministically on a
temp copy of --org. It makes compileDay's default clock lag one second behind the real one, and it plants the witness copy's
future records 100× further ahead. Only a witness that hands the compile a clock no earlier than the last record it planted
reads GREEN there.

```
node ci/mg9/witness_mg9.mjs --org <archive tip> --base-org <archive 84cbc03>    GREEN MG9 … · 4 clause(s)
node ci/mg9/witness_mg9.mjs --org <archive 84cbc03> --base-org <same>          RED MG9 · FAST, STRUCK
   (at the base FAST reads G8 RED · compile skipped, and G9 RED · (i) NOT PLACED · (ii) NOT PLACED: the flip, made deterministic)
node ci/mg9/run_mutants_mg9.mjs --org <tip> --base-org <84cbc03>               run_mutants: 4 of 4 mutant(s) RED by the clause that names them · control GREEN
   M1 the old wait restored · M2 G9 (ii)'s call drops its lastAt · M3 the archive reports lastAt 0 · M4 the struck text deleted
```

The first FAST lagged only the product's default clock, and M2 / M3 read GREEN against it: a witness passing the plain real
clock still passed. FAST was widened, by planting the records further ahead, before any count was taken.

## 5. Fifty runs, three ways each (22 Nov 2026); every line is in this directory

The three ways: (a) the tip alone · (b) the base tree alone · (c) the tip beside `ci/witness/mbank/witness_bank.mjs plants`,
both running at the same time.

```
ci/mg9/G9_50.txt      G9 on the REPAIRED witness (--only G9)   (a) GREEN 50 RED 0 · (b) GREEN 50 RED 0 · (c) GREEN 50 RED 0
                      (b) = the repaired witness judging the base tree 84cbc03 (the product is byte-equal)
ci/mg9/MCAP_50.txt    ci/witness/mcap/witness_capability.mjs   (a) GREEN 50 RED 0 · (b) GREEN 0 RED 50 · (c) GREEN 50 RED 0
                      (b) = mcap's base 5759cce, RED by contract: the same "38 of 86" in all 50 runs
ci/mg9/MDAYV_50.txt   ci/witness/mdayv/witness_dayv.mjs        (a) GREEN 50 RED 0 · (b) GREEN 0 RED 50 · (c) GREEN 50 RED 0
                      (b) = mdayv's base 7bf008b, RED by contract: the same "4 of 27" in all 50 runs
```

**mcap: no flip in 150. mdayv: no flip in 150.** Nothing races in their bytes on the clock. mcap stamps every planted instant
from a fixed date (`ci/witness/mcap/witness_capability.mjs:300` `OPEN = "2026-11-10T08:00:00.000Z"`, `:301` `at(m)`).
mdayv reads the clock once (`ci/witness/mdayv/witness_dayv.mjs:291`, "THE ONE READ") and hands that instant to every child.
Neither has a sleep, a timeout, or a `Date.now() + n` stamp. Whatever turned them red under mtrain's F2 load was not
reproduced by one concurrent witness on this machine. **Named, not guessed:** a heavier load, or the caller's own bound
reached under load (the suite member's job time, not a clause), are the candidates left for that seat's own measurement.

## 6. CHECKPOINT

CHECKPOINT · repair built (compile handed max(real, lastAt + 1); old wait struck) · witness GREEN 4 clauses at tip, RED MG9 · FAST, STRUCK at 84cbc03 · mutants 4/4, control GREEN · G9 repaired 150/150 GREEN · mcap and mdayv: no flip in 150 (base RED by contract) · left: the WITNESSES member over this tree (running), its count on the next push
