# mlj · THE JUDGE-HELD REFUSAL — PROOF (forks row 1040 (2) F1 · row 1043 (2) F1, 18 Nov 2026)

Branch `claude/mlj-build`, cut from `origin/main` at **`4d166d3`** (18 Nov 2026; mland and mlv0 are both in main there).
Spec: `ci/mlv0/PROOF.md` FORK 1 on `claude/mlv0-build`. The ruling: *the judge-held refusal = unit mlj, land.mjs reads
keeper judgeHeld, after mland and mlv0 are both in main.*

## What was measured at the base (`4d166d3`, 18 Nov 2026)

| Fact | Where |
|---|---|
| land.mjs reads no judge: the word `keeper` appears only in step 11's stale-units reader | `scripts/land.mjs:105`, `:110`, `:112`, `:240` |
| the stops that reset the count (row 1043 (2) F4, accepted as written) | `scripts/land.mjs:42` |
| step 7 (sitting) · step 8 (live witnesses) · step 11 + the `--dry` return · step 9 (the move) | `scripts/land.mjs:202`, `:206`, `:219-222`, `:223` |
| `land` is synchronous; `main()`'s code is assigned straight to `process.exitCode` | `scripts/land.mjs:156`, `:331` |
| keeper exports `JUDGE_PORT` (a fixed 4118, no env door), `holdJudgePort`, `judgeHeld` | `scripts/keeper.mjs:79`, `:83`, `:89` |
| the readers that exist: services status, brain's retire, context's retire; the holder: gaffer_brain's judge arm | `scripts/services.mjs:1125-1127`; `scripts/brain.mjs:89`, `:7698`; `scripts/context.mjs:84`, `:1321`; `scripts/gaffer_brain.mjs:113`, `:2733` |
| the precedent for a port env door | `scripts/sitting.mjs:108` (`ARSENAL_SITTING_PORT`) |

## What was built (the named files only)

- `scripts/land.mjs` — step **8½**, after every other gate and right before the move (and before the `--dry` line):
  `keeper.mjs` is imported THERE (dynamic, so `count` / `carry` / `push` / `reads-probe` never depend on it) and its
  `judgeHeld()` read. Held → `REFUSED JUDGE-HELD · <unit> <sha> — a judge round holds :<port> — land when it closes`
  (exit 1). A keeper that cannot answer → `REFUSED JUDGE-UNREADABLE` (fail closed). `HUMAN_STOPS` is unchanged, so a
  JUDGE-HELD refusal is a wait (ledger row `human:false`) and never resets the count. `land` became `async`; `main()`'s
  code reaches `process.exitCode` through a promise. The header carries the refusal.
- `scripts/keeper.mjs` — `JUDGE_PORT` gains the env door `ARSENAL_JUDGE_PORT` (the sitting precedent), **honoured ONLY
  when keeper.mjs's own file sits under the OS temp dir** (row 1064 rework of row 1053 (1): both paths through realpath,
  case-insensitive on win32). In his tree it reads 4118 whatever the env says; a non-port reads 4118 too. Every reader
  and the holder read the same constant. Nothing else changes.
- `ci/mlj/witness_mlj.mjs`, `ci/mlj/run_mutants_mlj.mjs`, `ci/mlj/LEDGER.jsonl`, this file.

## Witness, both ways (by last line, 18 Nov 2026)

```
node ci/mlj/witness_mlj.mjs --org . --base-org <git archive 4d166d3: scripts setup package.json>
GREEN MLJ the judge-held refusal · 8 clause(s)                                  (exit 0)

node ci/mlj/witness_mlj.mjs --org <base> --base-org <base>
RED MLJ · J1, J2, J3, J4, J5, K1, BOUND                                         (exit 1)
```

Clauses: J1 HELD (held refuses, his main and origin unmoved; the round closes and the SAME branch lands) · J2 DRY ·
J3 COUNT (1 of N survives a JUDGE-HELD; its row is `human:false`) · J4 LAST (a round opened by the planted sitting at
step 7 is still caught) · J5 KEEPER (the predicate IS keeper's export; a keeper with no `judgeHeld` fails closed while
`count` still answers) · K1 DOOR (under the temp dir the planted port is read, a non-port or unset reads 4118; the
SAME keeper bytes OUTSIDE the temp dir with a planted port read 4118 — row 1064) · BOUND · LAST.

The port class (row 1053): no fixed port is bound. Each round is a planted HOLDER process running the sandbox's own
keeper `holdJudgePort` on an OS-picked port, reaching land only through `ARSENAL_JUDGE_PORT`. The holder lives until a
stop file under the temp dir appears or the witness is gone, checked once per node start measured in the run; every
wait is bounded by what the run has already spent. No live service, no POST, no restart.

## Mutants (18 Nov 2026)

```
node ci/mlj/run_mutants_mlj.mjs --org . --base-org <base>
  M1 J1 the verb never reads the judge (a held round lands)                           → RED MLJ · J1
  M2 J2 --dry skips the judge gate                                                     → RED MLJ · J2
  M3 J3 JUDGE-HELD is counted as a stop a human resolves (resets the count)            → RED MLJ · J3
  M4 J4 the judge is read FIRST (before the verdict and the sitting), not last         → RED MLJ · J4
  M5 J5 the verb bind-tests its own fixed port instead of keeper's judgeHeld           → RED MLJ · J5
  M6 K1 keeper's JUDGE_PORT ignores its env door                                       → RED MLJ · K1
  M7 K1 the temp-dir guard removed (the door honoured in his tree too, row 1064)       → RED MLJ · K1
run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN
```

CRLF (the laptop's checkout shape; scripts/, setup/, ci/mlj/ converted by a node script under the scratchpad), 18 Nov 2026:

```
witness --org <CRLF build> --base-org <CRLF base>     GREEN MLJ the judge-held refusal · 8 clause(s)
witness --org <CRLF base>  --base-org <CRLF base>     RED MLJ · J1, J2, J3, J4, J5, K1, BOUND
run_mutants --org <CRLF build> --base-org <CRLF base> run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN
```

## Each touched selftest, before → after (headline lines, run 18 Nov 2026 in this container)

```
keeper   keeper selftest: 17 passed, 0 failed  →  keeper selftest: 17 passed, 0 failed     (node scripts/keeper.mjs selftest)
land     no selftest mode (its witness is ci/mland/witness_mland.mjs; see FORK 1)
```

```
node scripts/models.mjs check   → exit 0, base and build (18 Nov 2026)
tsc -p tsconfig.json --noEmit   → no diagnostic names land.mjs or keeper.mjs (18 Nov 2026; @types/node absent here)
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all, 18 Nov 2026, base 4d166d3 and build: the SAME line
  organism_test: 136 passed, 4 failed · ruled 0 · UNRULED 4 · LIVE 126 (hermetic: named, not run)   (exit 2 both)
  the four: the coverage orphans (home_pin, probe, study_scope) · fsrs and mutagen ERR_MODULE_NOT_FOUND (no
  node_modules in this container) · the 50-member roll-up of those two. None names a touched file.
```

## The ruling vs the spec (named)

- The spec (mlv0 FORK 1) said "wiring the verb to refuse while the judge line reads RUNNING". The ruling says land.mjs
  reads **keeper judgeHeld**; built that way. The verb never parses `services.mjs status`.
- The spec placed nothing; the ruling names no step. The refusal sits LAST before the move (8½), so a round opened
  while the verb checks is still caught (J4), and `--dry` refuses too (a DRY says "every check passed").
- Row 1043 (2) F4 accepted the list of stops that reset the count as written: JUDGE-HELD is NOT added to it (J3).

## FORKS

1. **mland's witness breaks at this build.** `ci/mland/witness_mland.mjs` (seat branch `claude/mland-build`) plants
   `scripts/keeper.mjs` as `export const keep = () => 0;`. At this build every landing clause there reads
   `REFUSED JUDGE-UNREADABLE` (fail closed, the right answer for a keeper that cannot answer). Measured 18 Nov 2026 on a
   scratch copy: with `export const JUDGE_PORT = 0;` and `export const judgeHeld = async () => false;` added to that stub,
   every mland clause's build side reads GREEN at this build. That file is not mine. The edit belongs to mland's home,
   or to ms1 (row 1043 (2) F3) when it lands.
2. **The env door is in keeper.mjs, not in land.mjs** (row 1064 (3) keeps it there). Row 1064 (1) RULED the reading
   of "under the temp dir": the door is honoured only for a keeper.mjs whose own path is under `os.tmpdir()`; his tree
   reads 4118 whatever its env says. K1's OUTSIDE case plants the same bytes in a dir outside the temp dir (his home,
   else the witness's own repo) and removes it before the clause returns.
3. **`land.mjs push <unit>` does not read the judge.** L4's retry moves no byte in his tree (main already holds T), so it
   cannot disturb a running round. If the architect wants it gated too, that is a stricter gate for a later unit.
4. **The check-to-move window is not closed.** A round that opens between `judgeHeld()` and `git merge --ff-only` (one
   process spawn) is not caught. Holding a lock across the move would need the judge arm to refuse while a landing holds
   one, which means gaffer_brain changes: not in this unit.
5. `scripts/land.mjs` has no selftest. Its witnesses are the units' ci files (no suite member runs them until ms1).

## Effort receipt

`node campaign-2026-09/tools/effort_receipt.mjs` — this repository does not carry that file. The error is in the FINAL
MESSAGE. Nothing is written under `campaign-2026-09/`.

## Row 1064 rework (18 Nov 2026)

Relayed by runner M: one defect, the door was honoured anywhere. Fixed in keeper.mjs only; K1 gained the OUTSIDE case
and mutant M7. The mland witness's keeper stub is NOT touched (unit ms1's landing). Re-run, 18 Nov 2026: witness build
GREEN (8 clauses), base RED (J1, J2, J3, J4, J5, K1, BOUND), mutants 7 of 7 with control GREEN, the same on CRLF copies;
`node scripts/keeper.mjs selftest` headline unchanged; `node scripts/models.mjs check` exit 0; the hermetic suite line is
the base's line (same four unruled reds, by `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`).
