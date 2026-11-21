# MJSET BUILD — PROOF (unit mjset · forks rows 1244 / 1245 / 1260 (2) / 1269 · a cloud build seat, 21 Nov 2026)

> Not a landing. This seat moves no main, lands nothing, opens no PR, makes no live model call (every judge child in every
> clause is planted). The spec is `ci/mjset/MJSET_SPEC.md` on `claude/mjset-spec` @ 09d7f71 (read whole, with its ledger);
> where it and the ruling text differ, THE RULING WINS and §4 names each difference. Section 15 of the spec (the drain) is NOT
> built (row 1260 (1) / (4): it waits on HIS word). Every count below is a measurement of 21 Nov 2026 by the command beside it. A first tip run of the suite (21 Nov 2026) read `organism_test: 167 passed, 1 failed` — the clause witness printed no `PLANTS` line; fixed at 6b5c78b and re-run green, not retried until green.
> Acts in order: `ci/mjset/LEDGER.jsonl`.

## 1 · THE BASE (provisional, row 1269 (1) / (2))

- Cut: `git checkout -b claude/mjset-build f635d68b1bce300b58aa031ed49278b8bbe3e5a8`, the mbank BUILD tip (fetched 21 Nov 2026:
  `origin/claude/mbank-build` had NOT moved past it — `git log --oneline -1 origin/claude/mbank-build` → `f635d68`).
- `ci/mjset/BASE` = `f635d68b1bce300b58aa031ed49278b8bbe3e5a8`. mbank is adopted there provisionally and is not on main: a
  re-cut mbank tip, or a main carrying mbank, is merged into this branch by a merge commit when a message names it (none had
  arrived at this checkpoint).
- The spec's lines are at its own base 7bf008b. Re-measured at the cut by `grep -n` before any edit (§5).

## 2 · THE WITNESS, BOTH WAYS (by last line; trees are `git archive` exports under os.tmpdir(), node_modules linked)

| leg | command | last line |
|---|---|---|
| head | `node ci/mjset/witness_mjset.mjs --org <tip export> --base-org <f635d68 export>` | `GREEN MJSET the judge round always tries one capture (…) · 14 clause(s)` (exit 0) |
| base | `node ci/mjset/witness_mjset.mjs --org <f635d68 export> --base-org <f635d68 export>` | `RED MJSET · W1, W2, W3, W4, W5, W6, W7, W8, W9, W11, W12, W13` (exit 1) |
| clause witness, build | `node ci/witness/mjset/witness_mjset.mjs plants --tree <tip>` | `PLANTS mjset · 12 of 12 plant(s) as expected` (exit 0) |
| clause witness, base | `node ci/witness/mjset/witness_mjset.mjs plants --tree <f635d68>` | `PLANTS mjset · 0 of 12 plant(s) as expected` (exit 1) |

The 14 of the head leg (21 Nov 2026) = W1-W9, W11, W12, W13 (each GREEN on the build AND RED on the base) + BOUND (6 files
differ, every one named) + LAST (0 survivors). The base leg of every clause, read off its own line (21 Nov 2026):

- W1 `calls 0 · reason judge-batch-cannot-fit` (the runner's history blocks for ever) · W2 / W3 / W4 / W5 `calls 0 · reason
  judge-batch-cannot-fit` (one killed one-capture row alone, P4) · W6 `round 1: 1 call(s) · round 2: 0 call(s)` · W7
  `judged ["m7a","m7b"]` (the 01:59Z capture judged) · W8 `round 1 head c1 · round 2 head c1` · W9 `the planted claude reached
  1 time(s)` (a dry round made a call) · W11 `postmatch.mjs exports no kept-try door; its redo REPLACES the earlier JUDGE line
  in place` · W12 `J1 / J3 / J4 / J5 / J6 NO` (no reason on the receipt; J2 unparseable ok on both) · W13 `total_cost_usd ABSENT`.

## 3 · THE MUTANTS (`node ci/mjset/run_mutants_mjset.mjs --org <tip export> --base-org <f635d68 export>`, 21 Nov 2026)

`run_mutants: 13 of 13 mutant(s) RED by the clause that names them · control GREEN` — M1 the estimator reverted (W1) · M2 the
guard removed (W2) · M3 the guarded call without its tail and M3b the guard ignoring the slowest ok rate (W3) · M4 the guard
re-firing in the same round (W4) · M5 the auth branch filing no card (W5) · M6 a kill on the history as a do-not-retry marker
(W6) · M7 the floor read by IST day, not instant (W7) · M8 the rotation removed (W8) · M9 the dry gate removed (W9) · M11 the
morning try replacing the evening try (W11) · M12 the settled_nothing field dropped (W12) · M13 an absent cost read as 0 (W13).

## 4 · WHAT WAS BUILT, AND WHERE THE RULING DIFFERS FROM THE SPEC

Files (BOUND, 21 Nov 2026): `scripts/gaffer_brain.mjs` · `scripts/postmatch.mjs` (row 1245 (1), the one file granted) ·
`ci/witness/mjset/witness_mjset.mjs` (clause witness) · `ci/mjset/witness_mjset.mjs` (unit witness — the landing law's
NO-CI-DIR file; the brief's TWO KINDS paragraph names it beside the clause witness) · `ci/mjset/run_mutants_mjset.mjs` ·
`ci/mjset/BASE` · `ci/mjset/PROOF.md` · `ci/mjset/LEDGER.jsonl`. NOT edited: `scripts/registry.mjs` (gameOnEpoch is read),
`scripts/sitting.mjs`, `package.json`, `scripts/claudegen.mjs` (FORK mjset-cost), any mbank file, anything under dressing-room/state.

- **F1 C** (the ruling, not the spec's A): BOTH. (i) `judgeBatchSize` — a floor raises the slowest rate only and never the
  fast end; the margin is the OK rates' own spread (0 with one ok row or none). (ii) the guard in `gradeJudge`'s loop — when
  no batch of this round has started and the estimator says 0, ONE capture is tried at `remaining − settleReserveMs([head])`.
  Difference named: the spec's W1 (guard) is split — W1 is now the ESTIMATOR's clause (the runner's history opens WITHOUT the
  guard: `guarded false · margin 0`) and W2 the guard's (P4, which the estimator alone leaves blocked).
- **F2 B**: the guard fires only when the slowest OK rate fits the one-capture bound; the base selftest assert
  (`gaffer_brain.mjs:3629-3631` at the cut, "a size that cannot fit ONE capture starts NO batch") stands unchanged, and W3
  holds it as its second half. A floor alone never refuses the guard (it is a lower bound).
- **F3 A**: every capture a round tried and did not settle gets ONE `attempted` row (this organ's own queue, checked); the
  next round orders never-attempted captures first (oldest day first, `judgeOrder` byte for byte) and then the attempted ones,
  least recently first (`declinedLast`). Difference named: the spec listed missed / deferred / 💎; the build also rotates
  `refused` (J6, the write-ahead row refused) and `killed` (a one-capture batch the lane killed) — the ruling's class "a queue
  one item can hold for ever" covers both; the architect may strike either.
- **F4 A**: under `dry`, an un-injected judge calls nothing and writes no ledger row; an injected `generate` still runs (the
  selftests' stub, the rule the dispatch already keeps). The receipt says `settled_nothing: "dry"`, the head line `DRY RUN`.
- **F5 A**: a capture whose own instant is before `gameOnEpoch()` gets ONE `pre_cyborg` row (`of`, `ts`, `floor`,
  `captured_at`, `why` naming canon 7744acf1) and `outstandingGrades` reads it as not outstanding; the capture row is never
  touched (W7 reads it byte-identical). The receipt carries `pre_cyborg` (floor, count, rows); `queue` names the ones the next
  round sets aside. A round over PLANTED rows reads no live registry (its floor is planted with them, `deps.gameOnEpoch`), so
  no fixture reads his state. An unreadable floor sets nothing aside and says so on the receipt (FORK mjset-floor below).
- **F6 A**: built on mbank (the cut); `settleBatch` keeps mbank's register hedge line untouched.
- **F7**: not built (row 1244: the drain is §15, served to him).
- **Row 1245 (1)** (postmatch.mjs): every try is a line of its own, `JUDGE TRY · <anchor> · <ISO instant> · <the JUDGE line
  it wrote>`, appended and never replaced; the newest try stays the ONE `^JUDGE: ` line (so `judge_settled` and the redo read
  the newest and every reader of `^JUDGE: ` is unchanged). A record written before the clause keeps its old JUDGE line as a
  try of its CLOSED-BY carrier the moment a later try lands; a refreshed record carries every earlier try. The instant is the
  close's own clock (`closeTimer().stepNow()`). One selftest assert added (inside the granted clause). Difference named: W11
  reads the kept-try door and autoclose's source (the redo goes through it, no `text.replace`); it does not run a whole close,
  whose children (the archivist, the judge CLI that holds the judge port) the port class keeps out of a witness.
- **Row 1245 (2)**: every ok round with graded 0 and a call made (or a dry round) carries `settled_nothing` — the names of the
  causes present, joined by `+`, from dry / missed / deferred / diamond / refused (`no-grade` if none applies); the CLI head line
  says `SETTLED NOTHING: <reason>`, so `postmatch.mjs judgeLineOf` keeps it in the record. J2 (unparseable) stays ok:false.
- **Row 1245 (3)**: no card and no question about the login was added; K3's card (W5) is the only one.
- **Row 1260 (2)**: the judge's ledger row is built by an exported `judgeLedgerRow` (the same fields, moved byte for byte, the
  `...ledgerForensics(r)` spread kept at the call site for claudegen's WIRE scan) plus `total_cost_usd` — the CLI's own number
  unchanged, null when absent, never 0. Difference named: the spec's §2.4 / §6 said "no field is added to the row"; the ruling
  adds this one. **(3) kept:** D3 and D4 are refused; no guard was loosened (the guard adds a call bound, it removes none).

## 5 · THE SPEC'S LINES RE-MEASURED AT THE CUT (spec base 7bf008b → cut f635d68, `grep -n`, 21 Nov 2026)

gaffer_brain.mjs: judgeRates `:1978` → `:2029` · judgeFloors `:1992` → `:2043` · judgeBatchSize `:2000` (seen/slow/fast
`:2007-2010`) → `:2051` (`:2058-2061`) · settleReserveMs `:2024` → `:2075` · judgeBatchWithTail `:2029` → `:2080` · judgeOrder
`:2045` → `:2096` · gradeJudge `:2079` clock → `:2129` · default gen `:2108` → `:2159` · the round loop `:2399-2431` →
`:2450-2482` · outstandingGrades `:1420` → `:1471` · inDoubtGrades `:1438` → `:1489` · `queue` print `:2783` → `:2852-2857` ·
the CLI head line `:2739` → `:2811` · the F2 assert `:3534-3536` → `:3629-3631`. postmatch.mjs: closeTimer `:464-475` → `:464` ·
parseMachineRecord `:499-508` → `:499-508` · judgeLineOf `:574-582` → `:574-581` · the redo `:864-868` → `:868`. The mbank build
moved gaffer_brain.mjs by about 51 lines above the judge; no line the spec cites was edited by mbank (its §6 holds).

## 6 · NO OTHER MEMBER TURNED RED (cut f635d68 → tip, each by its headline line, 21 Nov 2026)

| member | cut | tip |
|---|---|---|
| `node scripts/gaffer_brain.mjs selftest` | `gaffer_brain selftest: 198 passed, 0 failed` | `gaffer_brain selftest: 205 passed, 0 failed` (7 mjset asserts added) |
| `node scripts/postmatch.mjs selftest` | `ALL CHECKS PASSED` | `ALL CHECKS PASSED` (1 mjset assert added) |
| `node scripts/models.mjs check` | exit 0 | exit 0 |
| landed mbank witness `ci/mbank/witness_mbank.mjs --base-org <5301f15>` | `RED MBANK · BOUND` (B1-B20 + LAST GREEN) | `RED MBANK · BOUND` (B1-B20 + LAST GREEN) |
| the mjset spec witness | none exists (the spec branch carries only the spec and its ledger) | — |
| hermetic suite `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` (a local clone, core.autocrlf=false, node_modules from `npm ci`) | `organism_test: 167 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)` | `organism_test: 168 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)` — the one more is the suite member CLAUSE WITNESS · ci/witness/mjset/witness_mjset.mjs |

The mbank witness's BOUND reads RED at the cut already: its base 5301f15 predates the main its tip f635d68 carries (units
mclk, mdet, mdtl2), so files beyond its named list differ; the same line at the tip, every B clause GREEN at both.

## 7 · FORKS (written, not edited)

- **FORK mjset-cost** · `scripts/claudegen.mjs` parseOut reads the envelope (`JSON.parse(stdout)`) and drops
  `j.total_cost_usd` (it appears there only in a fixture string). Until ONE line hands it back on the result
  (`total_cost_usd: j.total_cost_usd ?? null`), every live judge row carries `total_cost_usd: null` — honestly absent, never 0
  (W13 (b) reads exactly that through a planted CLI whose envelope carries the field). A file beyond the named list: the
  architect rules whether mjset gains it or another unit carries it.
- **FORK mjset-floor** · an unreadable `game_on_epoch` (registry.mjs throws, "may never silently pass as no floor") sets
  nothing aside and is NAMED on the receipt and the CLI line; the round still judges. The stricter reading — refuse the round
  until the floor reads — would stop every judge round on a broken registry row. The architect rules.
- **FORK mjset-rotate** · F3 A's outcome list includes `refused` and `killed` beyond the spec's three (§4); strike either by ruling.
- **OWED BY THE RUNNER (his laptop, counts only, never guessed here):** whether his CLI prints `total_cost_usd` (the newest
  `gaffer_judge` row after the first ordinary round, and after FORK mjset-cost); N6 the login, read by the first judge round
  after landing (K3's card if it refuses); the first round's `settled_nothing` reason if it settles nothing; the count of
  `pre_cyborg` rows it writes (the spec's N4 / N5 read 2).

## CHECKPOINT

CHECKPOINT · 2026-11-21 · done: F1 C · F2 B · F3 A · F4 A · F5 A · F6 A (on mbank f635d68) · row 1245 (1) (2) (3) · row 1260 (2) · witness both ways · 13 of 13 mutants · the hermetic suite green at cut and tip · resume from: a message naming a re-cut mbank tip or a main carrying mbank (merge it, re-run the unit witness and mutants, push), or the architect's ruling on FORKS mjset-cost / mjset-floor / mjset-rotate.
