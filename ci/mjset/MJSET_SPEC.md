# MJSET SPEC — every capture of a day that is over is settled by code (unit mjset, row 1234 (1) · row 1235)

> A CLOUD SPEC SEAT's spec (21 Nov 2026). It builds nothing, edits no existing file, makes no live model call: every
> model reply below is PLANTED. Base: `origin/main` = **7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f** (`git rev-parse FETCH_HEAD`
> after `git fetch origin main`, 21 Nov 2026), units mdet, mdtl2 and mclk on it. Every `file:line` below is at that sha.
> Ledger of acts: `ci/mjset/LEDGER.jsonl`. Ground = THE RUNNER COUNTS of row 1235 (2) (his laptop, 21 Nov 2026, read-only):
> this seat cannot reach his state, so it never re-derives them; it only explains them by the code.

## 0 · HEADLINE (21 Nov 2026)

1. **THE SELF-BLOCK IS PERMANENT AND IS MADE BY THE ESTIMATOR, NOT BY THE LANE.** `judgeBatchSize`
   (`scripts/gaffer_brain.mjs:2007-2010`) puts the killed rows' per-capture FLOORS into the *fast* end of the spread, so a
   batch killed at a SHORT bound (a floor is a lower bound, never a fast observation) inflates the margin. Replayed at base on
   the runner's own shape (1 ok row 172766 ms / 1 item + floors, slowest 90086): **size 0, "NO BATCH FITS"**; with the ok row
   alone: **size 1, call bound 240000 ms**. Any floor below 105532 ms/capture blocks for ever; every real floor is ≤ 90086.
   Nothing can ever unblock it: no round starts ⇒ no new ok row ⇒ the history (`readJournal(BRAIN_LEDGER, Infinity)`,
   `:2390`) never changes. A second route to the same fixed point: one 1-capture kill at its full bound alone gives size 0.
2. **THE KILLS ARE THE TAIL RESERVE SHRINKING THE CALL.** The call bound is `remaining − settleReserveMs(batch)`
   (`:2029-2035`), and the tail is 2·JUDGE_DISPATCH_MS per capture (`:2024-2026`), so a batch of n non-second-judge captures
   is killed at 300 − 60·n s: n=4 ⇒ 60 s, n=3 ⇒ 120 s, n=2 ⇒ 180 s, n=1 ⇒ 240 s (measured, P5). The runner's kill bounds of
   18-19 Nov (60 / 120 / 180 s) are exactly n = 4 / 3 / 2, and the slowest floor 90086 = 180172 / 2. A bigger batch gets LESS
   time, and one capture alone took 172766 ms. (Hypothesis consistent with every count; measured by a command in §8.)
3. **THE ONE OK ROUND SETTLED NOTHING BY A PATH THE CODE ALLOWS, SILENTLY OK.** Six planted paths of `gradeJudge` leave an
   ok ledger row and **no** dispatching / settled row (J1-J6, §3), and five of them exit 0 printing "0 item(s) graded". The
   strongest structural one: **HEAD-OF-LINE** — the queue is judged oldest day first (`judgeOrder`, `:2045`) and the budget fits
   one capture, so a head capture the judge declines (its own law 5, `:1499`) is taken again by every round, for ever (P3).
   The head is a **19 Aug capture: pre-cyborg**. Which path fired on 19 Nov is NAMED NOT GUESSED (§9).
4. **THE 59: 2 PRE-CYBORG (19 Aug), 57 AFTER THE FLOOR** — 59 − 2 = 57, row 1235 (4)'s number. Fate proposed (§4): the 2 are
   set aside by a code row naming the floor (kept, never judged, never dropped); the 57 drain by the same path, oldest first.
5. **UPSTREAM: zero captures 18-21 Nov is the bank line (unit mbank), not this unit.** Shared lines named in §6. Ruled by
   the architect (forks row 1237 (1), 21 Nov 2026): no study turn called the bank, so the capture is lost BEFORE it. Every
   line where this unit assumes a bank call is in §13. No fix is designed for it.

## 1 · THE ROUND — why the judge child is killed, each failure class, its retry at the NEXT carrier

### 1.1 The path, by file:line (base 7bf008b)

| step | where | what it does |
|---|---|---|
| carriers | `scripts/sitting.mjs:1036-1052` | every sitting close (his or idle) with `waiting > 0` spawns `judge-due --trigger sitting.close`, waited `JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS` (`:217-220`) |
| | `scripts/postmatch.mjs:853-860` | the day close (evening anchor; the morning `dayclose-prev` for a slept day) spawns `judge-due --trigger day.close`; an UNSETTLED judge line is re-run at the next anchor (`:533`, `:864-868`) |
| the door | `scripts/gaffer_brain.mjs:2718-2736` | `judge-due` refuses without `ARSENAL_ORGAN=1` (`:1906`), asks `judgeDue` (`:1893`), then `gradeJudge` |
| one budget | `:177` `JUDGE_BUDGET_MS`, `:182` `JUDGE_DISPATCH_MS`, `:190` `WATCHER_DEADLINE_MS` | the round's ONE clock starts at `:2079`, before the external check |
| the head | `:1486` `judgeCartridge` | measured: 14635 chars / 14891 bytes (planted `who:""`) — the "15 KB head"; under the 26,000-char argv cap (`scripts/claudegen.mjs:159`) |
| the body | `:1522` `buildJudgePrompt` | his ground per concept (`capsuleGround` `:1291`) + the items |
| sizing | `:1978` judgeRates · `:1992` judgeFloors · `:2000` judgeBatchSize · `:2024` settleReserveMs · `:2029` judgeBatchWithTail | §2 |
| the call | `:2108-2129` → `claudeGen(p, "opus", budgetMs, ["--effort","max"], head)` (`scripts/claudegen.mjs:448-453`, `execFileSync` with `timeout`) | ONE brain-ledger row per call, appended at `:2113` (shared append lane, schema brain.mjs) |
| kill text | `scripts/claudegen.mjs:274` `KILLED (<sig>) after <n>ms`; `gaffer_brain.mjs:1973` JUDGE_KILL_RE | |
| auth text | `scripts/claudegen.mjs:52` AUTH_REFUSAL_RE (matches "OAuth session expired", "could not be refreshed") | |

### 1.2 Why the child is killed at its bound (measured at base, P5 — command in §8)

The call is killed at `call_ms = remaining − settleReserveMs(batch)` (`:2034`, passed as `budget_ms` at `:2411`, clipped at
`:2110`). `settleReserveMs` reserves 2·JUDGE_DISPATCH_MS per capture (+ WATCHER_DEADLINE_MS for a second-judge type,
`:1721`). Last lines of P5:

```
P5 n 1 tail 60000 call_ms 240000
P5 n 2 tail 120000 call_ms 180000
P5 n 3 tail 180000 call_ms 120000
P5 n 4 tail 240000 call_ms 60000
```

The one ok row took 172766 ms for ONE capture (row 1235 (2)). So any batch of 2 or more is killed by construction, and a
batch of one fits with ~67 s to spare. The kill is NOT the lane being slow beyond its budget; it is the batch size the
floors' history chose, sent into a bound that shrinks as the batch grows. The 300 s kills of 15-18 Nov do not fit this
formula (a tail ≥ 60 s means no call bound reaches 300 s) — NAMED NOT GUESSED (§9, N2).

### 1.3 The failure classes and their retry — every one at the NEXT carrier, never a loop (base already says "NO RETRY ANYWHERE", `:1962`)

| class | reason (receipt) | where | retry | card? |
|---|---|---|---|---|
| K1 batch killed (n ≥ 2) | `batch-killed` | `:2416-2422`, `:2468` | next carrier (sitting close / next anchor); the row becomes a floor (`:1992`) | no |
| K2 one capture killed | `judge-one-capture-past-budget` (RED) | `:2450-2455` | next carrier — **at base it never comes: its floor (= its bound) alone gives size 0 for ever (P4)** | no (an architect budget/effort question, row 963 (1)) |
| K3 login refused | `judge-auth-refused` (RED) | `:2438-2448` | next carrier; the card key is `judge:auth:<IST day>` (one per day, fileGuard) | **YES — the only one: his hand logs in** |
| K4 lane down (any other error, a limit wall) | `lane-down` | `:2468` | next carrier | no |
| K5 unparseable reply | `unparseable` | `:2426`, `:2474` | next carrier | no |
| K6 no batch fits | `judge-batch-cannot-fit` (RED) | `:2403-2407`, `:2463` | **never — the self-block (§2)** | no |
| K7 the external check ate the budget | `judge-budget-spent-by-external-check` | `:2405`, `:2457` | next carrier | no |
| K8 settled row not on disk | `settle-write-failed` | `:2381`, `:2477` | next carrier | no |

Proposed (the round branch the counts select): **no new class, no new card, no new retry.** K1/K4/K5/K7/K8 already retry at
the next carrier and stay. K2 and K6 are the two that never retry — both are repaired by the ONE change of §2. K3 keeps its
card (his hand) and keeps retrying at the next carrier.

## 2 · THE SELF-BLOCK — "NO BATCH FITS THE BUDGET", for ever

### 2.1 The mechanism (`scripts/gaffer_brain.mjs:2000-2015`)

```
seen   = [...rates, ...floors]                 // :2007 — a FLOOR (lower bound) enters the set
slow   = max(seen), fast = min(seen)           // :2008 — the smallest FLOOR becomes the "fastest observation"
per    = slow + (slow − fast)                  // :2009-2010
size   = floor(remaining / per)                // :2011
size   = min(size, ceil(remaining / maxFloor) − 1)   // :2013
```

A floor says "this capture took LONGER than d/n". Read as `fast`, a batch of 4 killed at 60 s (floor 15000) claims the
lane can grade a capture in 15 s, and the spread it opens (172766 − 15000) is charged to every later round as margin.

### 2.2 Measured at base (planted ledger rows, pure functions, no state, no model) — P1 / P2 / P3 / P4 / P6

```
P1 size 0 | 1 ok judge row(s) + 3 killed row(s) as floors (slowest floor 90086 ms/capture, the size held strictly below it): slowest 172766 ms/capture + margin 157766 ms (the rows' own spread) against 240000 ms left — not even ONE capture fits with its settle tail reserved (60000 ms)
P2 fastfloor 15000 size 0 · 60000 size 0 · 90086 size 0 · 105000 size 0 · 106000 size 1
P3 ok-only size 1 call_ms 240000
P4 one-capture-floor size 0 | 0 ok judge row(s) + 1 killed row(s) as floors (slowest floor 240000 ms/capture ...) — not even ONE capture fits
P6 ok false reason judge-batch-cannot-fit gens 0 writes 0
```

P1 is the runner's own post-match line ("1 ok judge row plus 10 killed rows taken as floors, slowest floor 90086 ms per
capture"), reproduced with 3 floors. Why it is FOR EVER: the history is the whole ledger (`:2390`, `Infinity`), only an ok
or killed call adds a row, and a round that starts no call adds none — a fixed point. A typed `judge-round` rides the same
`gradeJudge`, so even his hand cannot open it.

### 2.3 The smallest change (law L8: the budget is a GUARD — the kill bound — never a gate that never opens)

**In `gradeJudge`'s loop, `:2402-2408` only:** when `judgeBatchWithTail` returns size 0 **and no batch of this round has
started** (`batches.length === 0`) **and** one capture's call bound is positive (`remaining − settleReserveMs([items[at]]) > 0`),
start a batch of exactly ONE capture with `budget_ms = remaining − settleReserveMs([items[at]])`. Everything after it is
unchanged: an ok batch settles; a kill of that one capture is K2 (RED, the round stops, no second call); the next batch is
sized by the old rule (so the round never grows past one guarded call). The sizing functions (`:2000`, `:2029`) are NOT
edited: their receipts and the mjd2 shrink stay byte for byte, and K6 stays reachable — only when not even ONE capture's call
bound is positive (the external check ate the budget is still K7).

Cost of it, named: each carrier that fires spends at most ONE judge call of ≤ 240 s on one capture (the same as base's
pre-mjd2 "no ok row ⇒ ONE capture" rule, `:2002-2005`). A capture that dies at that bound is K2 at every carrier: the
measurement (its duration, its item) is on the ledger, and K2's text already names it an architect question.

Two alternatives the architect may prefer (FORK F1): correct the estimator (floors raise `slow` only, never `fast`), or both.

### 2.4 Who it touches

`scripts/gaffer_brain.mjs` only (sole writer of `gaffer_grade_queue.jsonl`, header `:7`). The ledger row shape (`:2113-2126`)
is untouched (brain.mjs owns the schema). The callers' waits (`sitting.mjs:220`, `postmatch.mjs:409`) already cover
JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS and do not move. The base selftest assert `:3534-3536` ("a size that cannot fit ONE
capture starts NO batch") plants an ok row of 400000 ms / 1 item: under §2.3 that history still starts nothing only if the
guard is skipped when the HISTORY says one capture exceeds the bound — **a fork (F2)**: re-base that assert (L9: struck, not
erased, by the architect's ruling) or keep it by guarding only when the slowest OK rate fits the one-capture bound.

## 3 · THE JOIN — why the ok round of 19 Nov wrote no settled and no dispatching row

Every row of the queue is written by `gradeJudge` alone: the write-ahead `dispatching` row (`:2362`, unit mjd3) BEFORE the
owner (`ownerCommand` `:1798` → rejirah.mjs / doubtminer.mjs / capture.mjs through `dispatch` `:2170-2188`), then `settled`
(`:2380`). The ledger row (`:2113`) is written the instant the call returns, before `settleBatch` (`:2232`) runs, and its
`ok` is the CALL's, not the round's. So "1 ok judge row" proves only that the CLI answered.

Planted at base (one capture, every reply planted, every write planted — P2/P3 commands in §8); the last lines:

```
J0 normal (control)                ok true  reason -            gens 1 queue rows ["dispatching","settled"]
J1 --dry, reply planted            ok true  reason -            gens 1 queue rows []
J2 unparseable reply               ok false reason unparseable  gens 1 queue rows []
J3a grade id not copied            ok true  reason -            gens 1 queue rows [] missed 1
J3b verdict outside legal set      ok true  reason -            gens 1 queue rows [] missed 1
J4 deferred (wall clock past tail) ok true  reason -            gens 1 queue rows [] deferred 1
J5 diamond (second judge disagrees) ok true reason -            gens 1 queue rows [] diamonds 1
J6 write-ahead row refused         ok true  reason -            gens 1 queue rows [] refused 1
round 1 ok true graded 0 missed ["voice_rep:tokenization"] outstanding 2 batches 1   (×3 rounds)
judged per round: id c1 | id c1 | id c1
```

The hypotheses, every one planted, none asserted:

- **H1 · a `--dry` round made a LIVE call.** `judge-round --dry` (`:2734`) skips the check (`:2083`) and every write, but the
  default `gen` (`:2108`) is not gated by `dry`: a dry round spends a live Opus call and appends an ok ledger row that then
  feeds `judgeRates` — a rehearsal that changes the sizing history. The receipt is `ok:true`, exit 0.
- **H2 · the reply was not JSON** (`:2234-2236`): ledger ok, round `unparseable`, exit 1.
- **H3 · the judge declined or mis-copied** (`:2248-2250`, its own law 5 at `:1499` invites a declined grade): `missed`,
  exit 0, "0 item(s) graded … 1 still outstanding".
- **H4 · deferred** (`:2315`, `:2327`, `:2357`): the wall clock (`clock() − t0`, which includes the external check and every
  spawn, `:2394`) left less than the item's tail; exit 0.
- **H5 · a 💎** (`:2338-2341`): a second-judge type (`:1721`) the second family disagreed on is a CARD and no row, by design;
  exit 0.
- **H6 · the write-ahead row refused** (`:2363`): `refused`, the owner is not called; exit 0.
- **H7 · HEAD-OF-LINE** — the structural one. `judgeOrder` (`:2045`) puts the oldest capture first, the measured budget fits
  one capture (§1.2), so a capture that returns H3/H4/H5 is the head of EVERY round: one declined capture stops the whole
  queue, silently, for ever (P3: three rounds, the same `c1`, `c2` never reached). The oldest outstanding captures are the
  two of 19 Aug — pre-cyborg, captured under the broken instrument (CLAUDE.md, GAME ON), the likeliest to be declined.
- **H8 · the caller killed the process after the ledger row and before the write-ahead row.** The outer waits
  (`sitting.mjs:220`, `postmatch.mjs:471-473` with `:853-857`) start before `gradeJudge`'s `t0` (process start,
  `holdJudgePort` `:2733`), so the outer bound is shorter than the inner by the boot time. Low on the arithmetic (inner ends ≤
  JUDGE_BUDGET_MS after `t0`, outer = + JUDGE_DISPATCH_MS), kept named.

What discriminates them is on HIS laptop, not here (§9, N1). **The build designs no join fix past H7's rotation and H1's
dry gate, and both are forks (F3, F4) until N1 is measured.** What the counts select for the join branch is *naming* it —
this section — and the witness clauses W8/W9 that a build would carry if the architect rules them in.

## 4 · THE 57 / 59 OLD CAPTURES (row 1235 (4))

The runner's queue: 59 unsettled — 19 Aug 2 · 7-8 Sep 4 · 23-27 Sep 22 · 5-18 Oct 29 · 13 Nov 1 · 16 Nov 1.
The floor is ONE reader: `gameOnEpoch()` (`scripts/registry.mjs:226`, the registry row `game_on_epoch`, canon 7744acf1;
its env door `ARSENAL_REGISTRY`, `registry.mjs:59`, plants it under the temp dir); its instant in the selftests is
2026-08-30T02:00:00Z = 07:30 IST (`calibration.mjs:662`, `learning_state.mjs:710`).

- **Before it: the 2 captures of 19 Aug.** Proposed fate (FORK F5 option A): set aside BY CODE, never judged — a row
  `kind:"pre_cyborg"` (`of`, `ts`, `floor` = the epoch's instant read from gameOnEpoch, `why` naming canon 7744acf1) appended by
  gaffer_brain.mjs itself (its own file, `appendRowChecked`), read by `outstandingGrades` (`:1420-1423`) as not outstanding and
  by `inDoubtGrades` (`:1438`) as not in doubt; the capture rows are never rewritten or deleted (L9); every round's receipt
  names the set-aside count; `queue` (`:2783`) says them. They are not his evidence (his 30 Aug word) and judging them would
  write reps into rejirah_log / reps_log dated 19 Aug — evidence the ruling forbids citing. They are also the HEAD of the
  oldest-first queue (H7).
- **After it: the 57.** Settled by the SAME path, oldest day first (`judgeOrder`), one guarded capture per carrier at the
  measured rate (§2.3) — so they drain over carriers, never in one round, and never silently dropped: every receipt carries
  `outstanding`. The day each verdict is filed under stays the CAPTURE's (`captureDay`, `:1932`, unit mjday). Their
  `confidence`/`aided` capture quality is not this unit's question (it is the instrument's; named, not judged here).

## 5 · LIVE MODEL CALLS — none

Every judge round is a live Opus call (`:2111`). This spec made NONE: every reply above is a planted `generate`, every
second opinion a planted `secondOpinion`, every write a planted `appendRow`, every owner a planted `dispatch`, every card a
planted `fileCard` / `retireCard`. A build's witness must do the same AND run over an exported tree (`--org` / `--base-org`,
git-archive under `os.tmpdir()`), because the un-planted `gen` appends to the tree's own `dressing-room/state/brain_ledger.jsonl`
(`:946`, `:2113`): H1's witness proves the dry gate through a planted `claude` on PATH that writes a marker under the temp
dir — never the real binary.

## 6 · WHERE UNIT mjset AND UNIT mbank TOUCH THE SAME CODE (claude/mbank-build 5db4a07, diffed against 7bf008b)

mbank edits `scripts/gaffer_brain.mjs` at base hunks `:128` (an import), `:1320` (after capsuleGround), `:1332-1400`
(gradeCapture — the bank), `:2293` (the register's hedge count inside `settleBatch`), `:2689-2694` (main, the capture verb),
`:3466` (selftest). mjset's build would edit `:1420-1442` (outstandingGrades / inDoubtGrades — F5), `:2045-2054` (judgeOrder —
F3), `:2108` (gen — F4), `:2399-2431` (the round loop — §2.3), `:3534-3536` (the selftest assert — F2) and add its own
selftest asserts. **Shared:** the same file; `settleBatch` (`:2232-2387`) holds mbank's `:2293` and mjset touches none of
it; both add selftest asserts near `:3466-3540`. **No line is edited by both.** The landing order is a fork (F6).

## 7 · THE WITNESS A BUILD WOULD CARRY — clauses (RED on base 7bf008b, GREEN on the build) and one mutant each

`ci/witness/mjset/witness_mjset.mjs --org <dir> --base-org <dir>`: both trees git-archive exports under `os.tmpdir()`; it
imports `scripts/gaffer_brain.mjs` from each, plants every dep (as P1-P6), plants the registry through `ARSENAL_REGISTRY`
under the temp dir; binds no port, names no live service, POSTs nothing, restarts nothing; every wait bounded by a measured
node start. Every clause prints one line; the last line is the verdict.

| clause | plant | base (RED) | build (GREEN) | mutant (one per clause) |
|---|---|---|---|---|
| W1 SELF-BLOCK OPENS | the runner's history (1 ok 172766/1 + floors 15000, 30000, 40000, 90086) + 2 captures | `cannot-fit`, 0 calls | exactly ONE call of ONE capture, its settled row lands | M1 remove the guard |
| W2 ONE-CAPTURE FLOOR | history = one killed 1-capture row at 240000 | 0 calls | ONE call | M2 guard only when `rates.length > 0` |
| W3 A GUARD, NOT A GATE | W1's history; read the call's `budget_ms` | (no call) | `budget_ms === remaining − settleReserveMs([head])` and ≤ JUDGE_BUDGET_MS | M3 guarded call gets `remaining` (no tail) |
| W4 NO LOOP | W1's history; the planted call is KILLED | `cannot-fit`, 0 calls | `judge-one-capture-past-budget`, exactly 1 call | M4 the guard re-fires after a kill in the same round |
| W5 THE ONE CARD | W1's history; the call refuses with "OAuth session expired and could not be refreshed" | 0 calls, 0 cards | `judge-auth-refused`, exactly 1 card, key `judge:auth:<IST day>` | M5 drop the auth branch's card |
| W6 RETRY AT THE NEXT CARRIER | two `gradeJudge` runs in sequence over W4's queue + the killed row appended | 0 + 0 calls | 1 + 1 calls (each round tries once) | M6 a kill writes a "do not retry" marker |
| W7 PRE-CYBORG FATE (F5 A) | captures at 2026-08-30T01:59Z, 02:01Z, the registry epoch planted | both judged | the 01:59Z capture set aside by ONE `pre_cyborg` row, never handed to `generate`; capture rows byte-identical; receipt names it | M7 the floor read as UTC midnight 30 Aug |
| W8 HEAD-OF-LINE (F3 A) | the judge declines c1 every time; 2 rounds | c1, c1 | c1, then c2 | M8 rotation removed |
| W9 DRY TOUCHES NOTHING (F4 A) | `--dry` with no planted `generate`, a planted `claude` on PATH writing a marker under the temp dir | marker written | no marker, receipt says DRY | M9 the dry gate removed |
| W10 NO REGRESSION | the base selftest's own fixtures (`:3525-3536`) except the one F2 re-bases; K7 external check eats the budget | GREEN | GREEN | — |

`ci/mjset/run_mutants_mjset.mjs` applies M1-M9 one at a time to a copy of the build tree under the temp dir; each mutant
must turn exactly its own clause RED.

## 8 · MEASUREMENTS BY COMMAND (this seat, cloud, 21 Nov 2026; last line each)

| act | command | last line |
|---|---|---|
| base | `git fetch origin main && git rev-parse FETCH_HEAD` | `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f` |
| head size | `node -e 'import("./scripts/gaffer_brain.mjs").then(m=>console.log(Buffer.byteLength(m.judgeCartridge({who:""}))))'` | `14891` |
| P1-P6 sizing | `node <scratch>/p1.mjs $PWD/scripts/gaffer_brain.mjs` (pure exports, planted ledger rows) | `P6 ok false reason judge-batch-cannot-fit gens 0 writes 0` |
| J0-J6 join | `node <scratch>/p2.mjs $PWD/scripts/gaffer_brain.mjs` (planted generate/appendRow/dispatch/cards) | `J6 write-ahead row refused ok true reason - gens 1 queue rows [] … refused 1` |
| H7 | `node <scratch>/p3.mjs $PWD/scripts/gaffer_brain.mjs` | `judged per round: id c1 \| id c1 \| id c1` |
| suite | `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` (base, bare cloud checkout, no `npm ci`) | `exit 2` — the hermetic members' gate FAILS here on lawpack, ci_verdict, red_cause, done, probe, fsrs, mutagen; fsrs / mutagen / done stop on `ERR_MODULE_NOT_FOUND` (no node_modules). An environment answer on base, before any file of this spec; the neutral machine is the verdict (§11) |
| mbank overlap | `git fetch origin claude/mbank-build && git diff -U0 7bf008b FETCH_HEAD -- scripts/gaffer_brain.mjs \| grep '^@@'` | `@@ -3466,0 +3540,23 @@ function selftest2(stub, S) {` |

The three probe scripts are planted-only (they import the base's exports and pass every dep); they lived in the seat's
scratchpad and are restated in this spec's §2.2 / §3 outputs. A build carries them as W1-W9.

## 9 · NAMED NOT GUESSED — what the cloud cannot reach, and what measures it on his laptop

- **N1 · which join path fired on 19 Nov 18:10 UTC.** The receipt went to stdout only. Measure, read-only: the sitting
  record's `judge.out` for the 19 Nov sitting close (`sitting.mjs:1050`, its owner's log) and the judge line of the 19 Nov
  post-match record (`postmatch.mjs:574-582`, "JUDGE: …"); `0 item(s) graded … still outstanding` ⇒ H3/H4/H5/H6;
  `unparseable` ⇒ H2; no carrier line at that minute ⇒ a typed round (H1 if its argv carried `--dry`); a 💎 or `key_doubt`
  card dated 19 Nov in the deck (`node scripts/captains_call.mjs status`) ⇒ H5; the item's id on the ledger row is not
  stored (`items` only), so the head capture's id is inferred by `node scripts/gaffer_brain.mjs queue` (oldest first).
- **N2 · the 300 s kill rows (15-18 Nov).** The formula of §1.2 cannot produce a 300 s call bound. Measure: those rows'
  `duration_ms`, `items`, `killed`, `error` on the brain ledger (`job:"gaffer_judge"`), and whether their tree carried mjd3
  (`git log --format=%h -1 --before=<row ts> origin/main -- scripts/gaffer_brain.mjs` on his machine's checkout).
- **N3 · the floors' full list** (10 killed rows): `items` and `duration_ms` of each, to confirm P1's shape (any floor
  < 105532 ms/capture blocks) on the real rows.
- **N4 · the 19 Aug captures' types** (`node scripts/gaffer_brain.mjs queue`): a type outside `VERDICT_TYPES` would make H3
  certain for it.
- **N5 · whether "the 57" of row 1235 (4) are exactly the 59 minus the two 19 Aug captures** (the arithmetic agrees; the
  row's own source is not reachable here).
- **N6 · the login state today** (K3): the last ledger row's error text; only his hand clears it.

## 10 · FORKS — every choice for the architect

- **F1 · the self-block repair.** (A) the one-capture guard in the round loop only (§2.3) · (B) correct the estimator: floors
  raise `slow`, never `fast` (`:2007-2010`) · (C) both · (D) window the ledger history. **Recommend A** — the smallest change
  that makes the round always try one item; B is a correct reading of a lower bound but leaves P4's route (one killed
  one-capture row) blocked; D types a window. Decides: N3 (if every real floor is from a multi-capture batch, B alone opens
  today's block, but not P4's).
- **F2 · the base selftest assert `:3534-3536`.** (A) re-base it (struck, not erased): a history whose slowest OK rate
  exceeds the one-capture bound still starts ONE guarded call · (B) keep it: the guard fires only when the slowest OK rate
  fits the one-capture bound. **Recommend B** — it keeps the ruled RED of row 963 (1) for a lane measured too slow, and still
  opens today's block (172766 < 240000). Decides: the architect's reading of row 963 (1).
- **F3 · head-of-line (H7).** (A) a capture with a `missed` / `deferred` / 💎 outcome goes behind the rest for the next round
  (order by the capture's last attempt, read from the round's own rows — a new `attempted` row kind, gaffer_brain's own file)
  · (B) no change until N1 · (C) a per-capture attempt cap (types a number — refused by the brief). **Recommend B, then A if
  N1 reads H3/H4/H5.**
- **F4 · `--dry` makes a live call (H1).** (A) under `dry`, an un-injected `gen` returns a DRY reply and calls nothing
  (stricter) · (B) leave. **Recommend A** — "dry" promises touch nothing (its own comment, `:2344-2350`), and a dry ledger row
  moves the sizing history. Decides: none needed (the code reads it), N1 says whether it fired.
- **F5 · the 2 pre-cyborg captures.** (A) set aside by a `pre_cyborg` row (§4) · (B) judge them like the rest, oldest first ·
  (C) order them last and judge them when the queue is otherwise empty. **Recommend A** (his 30 Aug word: they measure the
  instrument). Decides: his word is already canon; the architect rules the row kind.
- **F6 · landing order with unit mbank** (same file, no shared line, §6). (A) mbank first, mjset built on it · (B) mjset first.
  **Recommend A** — mbank is upstream (no captures since 17 Nov) and is already in build.
- **F7 · the effort / budget question** (172766 ms for ONE capture at effort max, his 14 Aug ruling, `:2097`): the queue
  drains at one capture per carrier. (A) no change in this unit (named only) · (B) an architect row on effort. **Recommend A.**
- **F8 · mpres class (row 1235 (5))** — filed, one small build AFTER the study-facing ones; not specced here.

## 11 · FILES A BUILD WOULD TOUCH

- `scripts/gaffer_brain.mjs` — `:2399-2431` (F1 A), `:3534-3536` (F2), `:1420-1442` + its `queue` print `:2783` (F5 A),
  `:2045-2054` (F3 A, only if ruled), `:2108` (F4 A), its own selftest asserts.
- `ci/witness/mjset/witness_mjset.mjs` (new) · `ci/mjset/run_mutants_mjset.mjs` (new) · `ci/mjset/PROOF.md`, `ci/mjset/BASE`,
  `ci/mjset/LEDGER.jsonl` (this branch's).
- Beyond them, each a FORK: `scripts/registry.mjs` (none needed — `gameOnEpoch` is read, never edited); `scripts/sitting.mjs`
  / `scripts/postmatch.mjs` (none needed — their waits already cover the round).

## 13 · WHERE THIS UNIT ASSUMES A BANK CALL HAPPENS (architect ruling, forks row 1237 (1), 21 Nov 2026)

The ruling's ground (the runner's zero-captures read, his laptop, counts only; never re-derived here): over 17-21 Nov,
no study turn called `bank_answer` and no call was refused, so **the capture is lost BEFORE the bank**. Where the cause sits
(the teaching turn or the surface) is the architect's call. This unit designs NO fix for it. Below is every line at base
7bf008b where mjset's path assumes a capture row reached the queue. Each is a plain dependency, none a repair:

| # | file:line | what it assumes |
|---|---|---|
| B1 | `scripts/gaffer_brain.mjs:1327-1415` (gradeCapture, the append at `:1412`) | the ONLY door that writes a `capture` row; every capture this unit settles was banked through it |
| B2 | `scripts/dugout.mjs:1897` (the `bank_answer` tool), handler `:2166` | the code-surface bank; zero calls ⇒ zero rows (row 1237 (1)) |
| B3 | `scripts/sitting.mjs:599-600` (bank() → `gaffer_brain.mjs capture`) | the sitting's bank; `S.stats.banked` counts it |
| B4 | `scripts/gaffer_brain.mjs:2689-2694` (main, `capture` verb) | the CLI door B2 and B3 reach (mbank edits these lines, §6) |
| B5 | `scripts/gaffer_brain.mjs:1420-1423` outstandingGrades · `:1893-1903` judgeDue | "due" = outstanding capture rows exist; no row ⇒ "nothing outstanding", the round never starts |
| B6 | `scripts/sitting.mjs:1036-1039` | the close fires the judge only when `banked > 0` or the queue has rows waiting |
| B7 | `scripts/postmatch.mjs:800` (queueEvidenceOf(day, outstandingBank())) · `:852-857` judgeRun | the day close's judge step and its queue-only evidence read the bank's rows |
| B8 | `scripts/gaffer_brain.mjs:918` outstandingBank · `scripts/forge_session.mjs:866`, `:2866` | the forge close's "judged" gate counts the same rows |
| B9 | `scripts/gaffer_brain.mjs:2045` judgeOrder · `:1932` captureDay | the order and the filed day come from the capture row's own `ts` |
| B10 | `scripts/daily_green.mjs:228-236` (rung 4) | "examiner GREEN" = a settled row on the day. With no capture it reads R ("did not run"), the same as a failed round |

Consequence, named and not repaired: every clause of §7 (W1-W9) plants its captures directly as queue rows. The witness
proves the settle path given a capture, and nothing about whether a capture is made. On the days of row 1237 (1), mjset's
build changes nothing, because B5 finds no outstanding rows and no round is due. The 59 old captures are the only work the
build would do until the bank question is ruled. B10 cannot tell "no capture" from "no settle", which is a fork for the
architect (F9), not a fix: (A) leave it · (B) the rung names which of the two it is.

## 14 · WHERE THIS UNIT ASSUMES A BANKED MOMENT OR A CRACK ROW (runner context, forks rows 1239 (3) / 1240, 21 Nov 2026)

The ground, counted on his laptop and never re-derived here: the pacer ran on every teaching day from 13 to 21 Nov. The
moments that make a bank due (the sharp check, the jirah) were almost never reached, and the crack file was never born.
Row 1240 branch B puts this upstream of the bank (§13) and of the judge. This unit's scope does not change and no fix is
designed. Here is every line at base 7bf008b where mjset's path rests on such a moment or row:

| # | file:line | what it assumes |
|---|---|---|
| M1 | `scripts/forge_session.mjs:148` MOMENTS (`sharp_check` "BANK-DUE", `:143-146`) | a banked moment is declared before his answer |
| M2 | `scripts/study_scope.mjs:266-267` BANKED_MOMENTS / bankDueAt (`jirah`, `sharp_check`) | the ONE predicate for "this reply must be banked": with no such moment declared, nothing is due, and so nothing reaches §13's B1 |
| M3 | `scripts/teaching_gate.mjs:637-650` (bankDueAt over the previous moments) | the gate asks for a bank only after a banked moment. It never asks on a day with none, which matches no gate red naming a missing bank (row 1237 (1)) |
| M4 | `scripts/forge_session.mjs:810` (no INTERVIEW-register line) · `:873` (axis never grilled: jirah) · `:882` closeGate · `:888` (unjudged banked answers) | the forge close's gates assume jirah / interview captures exist, and their `judge-round` text is the typed door |
| M5 | the crack row: `scripts/forge_session.mjs:28-29` (SOLE WRITER of `cracks.jsonl`, unit mcrk) | **this unit reads NO crack row.** `grep -n "cracks.jsonl" scripts/gaffer_brain.mjs scripts/sitting.mjs scripts/postmatch.mjs` → nothing. The judge's ground is the capture row plus the capsule (`:1291`), so the crack file's absence does not touch the settle path |

The consequence matches §13's: mjset settles captures that exist. On a day with no banked moment (M1-M3) there is no
capture, and the build is idle by design. Whether the pacer should reach the banked moments is outside this unit.

## 12 · THE NEUTRAL MACHINE

The check runs of this branch's pushed sha, read through the public API with no token (`curl -s
https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`), are recorded in `ci/mjset/LEDGER.jsonl`
(act `ci`) after each push.
