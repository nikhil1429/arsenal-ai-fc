# mid — PROOF (cloud build seat, 19 Nov 2026)

Unit **mid** · forks row 1159 (1)-(3). Branch `claude/mid-build`, cut from `origin/main` **`fb4211870093e6b8657655eb02ebcfc425f1eab1`**
(`git fetch origin main && git checkout -b claude/mid-build FETCH_HEAD`, 19 Nov 2026 UTC; one line in `ci/mid/BASE`). Mact is on this
base (`git merge-base --is-ancestor a4338f0 HEAD` exits 0). The spec is `ci/mid/MID_SPEC.md` at `8b2c556` (claude/mid-spec), read whole
with its ledger, `plant_mid.mjs` and `two_proc_mid.mjs`. Every act has its row in `ci/mid/LEDGER.jsonl` (ts, act, cmd, last_line).
Every measurement below was taken on 19 Nov 2026 in LF trees (`git archive <sha>`, `git -c core.autocrlf=false init`,
`npm ci --ignore-scripts`, ANTHROPIC_API_KEY and GITHUB_ACTIONS unset), never in a tree holding his state.

No CHECKPOINT open.

## What was built (row 1159 (1)-(3) only)

| Row | What | Where |
|---|---|---|
| (1) F-1 A | ONE shared pure mint, `mintId(prefix, now, {pid, random})` and `parseId(prefix, id)`; writes nothing, imports no organ | `scripts/mint.mjs` (new) |
| (1) F-2 A | the process id, fixed width 7 (base 36), beside the sequence: `<prefix><ms36 ×8><pid36 ×7><seq36><bucket36 ×2>` | `scripts/mint.mjs` |
| (1) | all six mints call it: acts `a` · claims `k` · outbox `o` · tasks `t` · registry `rul-` · sitting agenda `ag` | the six organs |
| (1) F-5 A | the registry mint takes the clock of its `at` argument (`mint("rul-", new Date(at))`), and the mint is injectable | `scripts/registry.mjs` `addRuling` |
| (2) F-3 A | the two-row refusal BY NAME: outbox `ack` · `undeliver` · the relay's deliver; tasks `claim` · `progress` · `finish` · `fail`; sitting agenda `drop` · `done` (CLI) and `agendaMark` drop/done | outbox, tasks, sitting |
| (2) | a ruling row is never upserted over: `addRuling` re-mints ONCE, else refuses by name; `upsertRow` refuses a `rulings` row whose id is held (belt) | `scripts/registry.mjs` |
| (2) | the folds name a pair: outbox `fold` and tasks `foldTasks` carry `ambiguous: n`; sitting `openAgenda` carries `ambiguous: n` | outbox, tasks, sitting |
| (3) F-7 A | one build seat on main `fb42118`, mact's refusals KEPT (acts `undo`/`resolveFailed`/`rerouteFailed` unchanged), its two process-local sequences (`idSeq`, `claimSeq`) REPLACED by the shared mint | acts, claims |
| (3) | `package.json`: ONE suite line — `organism:selftest` gains `&& node scripts/mint.mjs selftest` (the coverage law) | `package.json` |

Not built (later units, by the brief): mid2 (row 1159 (4)) and mcnt (row 1159 (5)). F-4's near shapes and F-6 (`captains_call`) are untouched.

## Measured before writing — the base, file:line at `fb42118`

| Fact | file:line |
|---|---|
| acts mint (mact's `idSeq`) | `scripts/acts.mjs:75-76`; mact's refusals `:77-80`, `:238`, `:262`, `:266`, `:293`, `:304` |
| claims mint (mact's `claimSeq`) | `scripts/claims.mjs:82-83` |
| outbox mint · fold · relay · undeliver · ack | `scripts/outbox.mjs:119` · `:156-174` · `:262-286` · `:290-301` · `:303-312` |
| tasks mint · fold · transition | `scripts/tasks.mjs:92` · `:125-143` · `:206-217` |
| registry upsertRow · addRuling (clock `Date.now()`, not `at`) | `scripts/registry.mjs:471-483` · `:746-760` (mint `:749`) |
| sitting agenda mint (no random part) · openAgenda · agendaMark · CLI drop · CLI done | `scripts/sitting.mjs:189` · `:180-183` · `:193` · `:1487` · `:1495-1501` |
| the SOLE WRITER of each ledger (script header) | `outbox.mjs:4`, `tasks.mjs:4`, `registry.mjs:4`, `claims.mjs:5`, `sitting.mjs:175-178` (the agenda) — every write in this build stays in its own organ; `mint.mjs` writes nothing |

## The spec's two-process plants (owed at this build) — last lines

```
base  fb42118  node ci/mid/two_proc_mid.mjs --org <LF fb42118>   →  TWO_PROC · acts SAME · claims SAME · proposed differ
build fbb22b0  node ci/mid/two_proc_mid.mjs --org <LF fbb22b0>   →  TWO_PROC · acts differ · claims differ · proposed differ
base  fb42118  node ci/mid/plant_mid.mjs --org <LF fb42118>      →  PLANT_MID · 9 readers · 0 error(s) · acts.undo=IDS-DIFFER · claims.mint=IDS-DIFFER · outbox.fold=DROP-SECOND · tasks.fold=OVERWRITE-FIRST · registry.addRuling=MERGE-SECOND-OVER-FIRST · sitting.agenda=DROP-ONE-CLOSES-BOTH · resume_pointer.state=DROP-NEW (read as consumed) · notes_compiler.noteState=SUPERSEDE-ONE-RETIRES-BOTH · notes_corrections.active=SUPERSEDE-ONE-RETIRES-BOTH
build fbb22b0  node ci/mid/plant_mid.mjs --org <LF fbb22b0>      →  PLANT_MID · 9 readers · 0 error(s) · acts.undo=IDS-DIFFER · claims.mint=IDS-DIFFER · outbox.fold=IDS-DIFFER · tasks.fold=IDS-DIFFER · registry.addRuling=IDS-DIFFER · sitting.agenda=IDS-DIFFER · resume_pointer.state=DROP-NEW (read as consumed) · notes_compiler.noteState=SUPERSEDE-ONE-RETIRES-BOTH · notes_corrections.active=SUPERSEDE-ONE-RETIRES-BOTH
```

(The plants were read out with `git show 8b2c556:ci/mid/<file>` into a scratch dir; they are the spec's, not copied onto this branch.
The three near-shape readers still read their harm — F-4 was not ruled into this unit.)

## The witness — `ci/mid/witness_mid.mjs --org <build> --base-org <base>`, both ways by last line

```
node ci/mid/witness_mid.mjs --org <LF fbb22b0> --base-org <LF fb42118>   →  GREEN MID one shared mint + two-row refusals · 9 clause(s)   (exit 0)
node ci/mid/witness_mid.mjs --org <LF fb42118> --base-org <LF fb42118>   →  RED MID · W1, W2, W3, W4, W5, W6, W7, W8                   (exit 1)
```

Each clause runs against the base and must read RED there, and against the build and must read GREEN there (the header is the
contract). The base side of each, from the GREEN run:

```
W1  base {"acts":32,"claims":32,"outbox":1,"tasks":1,"registry":1,"sitting":1}            build: 32 each
W2  base same: acts, claims, outbox, tasks, registry, sitting                             build: same none
W3  base "no scripts/mint.mjs in this tree"                                               build: ms, pid 7, bucket 0, seq +1; every Q4 shape matches
W4  base ack LANDED · undeliver LANDED · relay delivered 1                                build: all three refused "ambiguous", 0 rows, fold ambiguous 2
W5  base claim LANDED                                                                     build: claim and finish refused "ambiguous", 0 rows, fold names it
W6  base remint: one row, text TWO (ONE gone) · always-X: one row, text THREE             build: remint two rows ONE+TWO · always-X refused, text ONE intact
W7  base open 2 → 0 after one drop; CLI drop exit 0                                       build: open stays 2; CLI exit 1 "ambiguous"
W8  base (base vs base) the named files unchanged                                         build: outside none · unchanged_named none
LAST                                                                                      0 node process(es) name the temp dir
```

The port class (row 1053): no clause binds a port, names a live service, POSTs or restarts anything; `ARSENAL_SITTING_PORT` is an env
door and the sitting state dir is under `os.tmpdir()`; every child wait is bounded by `rung_receipt.mjs` `WITNESS_TIMEOUT_MS`, read from
the base tree's own owner — no timeout is typed. After a witness run, `git status --short --ignored` of the build tree is empty
(19 Nov 2026): it writes nothing under either tree.

## The mutants — `node ci/mid/run_mutants_mid.mjs --org <LF fbb22b0> --base-org <LF fb42118>`

```
  M1 → W1 · RED   (seq++) → (seq)                                  witness: RED MID · W1, W3
  M2 → W2 · RED   the pid part removed from the id                  witness: RED MID · W2, W3
  M3 → W3 · RED   padStart(PID_WIDTH) removed                       witness: RED MID · W3
  M4 → W4 · RED   the outbox ack guard removed                      witness: RED MID · W4
  M5 → W5 · RED   the tasks transition guard removed                witness: RED MID · W5
  M6 → W6 · RED   addRuling's existing-id check (re-mint + refuse)  witness: RED MID · W6
  M7 → W7 · RED   the agendaMark drop/done guard removed            witness: RED MID · W7
  M8 → W1 · RED   sitting.mjs keeps its local `ag<ms36>` mint       witness: RED MID · W1, W2, W3
  control · GREEN MID one shared mint + two-row refusals · 9 clause(s)
run_mutants: 8 of 8 mutant(s) RED by the clause that names them · control GREEN
```

M6 note: with `addRuling`'s check removed, `upsertRow`'s belt still refuses the always-X plant, so W6's re-mint half (X then Y must give
two rows) is what turns it RED — the clause asks for both halves of "re-mint once, else refuse".

## Each touched selftest, before and after, by its headline line

Run directly in each LF tree, 19 Nov 2026 (`node scripts/<organ>.mjs selftest`):

```
acts      base: acts selftest: 58 passed, 0 failed              build: acts selftest: 58 passed, 0 failed
claims    base: ✓ claims.mjs selftest — 24 passed, 0 failed     build: ✓ claims.mjs selftest — 24 passed, 0 failed
outbox    base: outbox: 46 passed, 0 failed                     build: outbox: 46 passed, 0 failed
tasks     base: tasks: 38 passed, 0 failed                      build: tasks: 38 passed, 0 failed
registry  base: registry selftest: 61 passed, 0 failed          build: registry selftest: 61 passed, 0 failed
sitting   base: sitting selftest: 99 passed, 0 failed           build: sitting selftest: 99 passed, 0 failed
mint      base: (absent)                                        build: ✓ mint.mjs selftest — 8 passed, 0 failed
```

## The member line of every touched member, before and after

`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 19 Nov 2026:

```
base   LIVE selftest acts — not run in the hermetic profile: reads state/registry.json, state/captain.json
base   LIVE selftest outbox — not run in the hermetic profile: reads state/registry.json
base   LIVE selftest tasks — not run in the hermetic profile: reads state/registry.json …
base   LIVE selftest sitting — not run in the hermetic profile: reads state/captain.json
base   ok   SUITE MEMBER · claims selftest exits 0
base   ok   SUITE MEMBER · registry selftest exits 0
build  (the same six lines, unchanged)
build  ok   SUITE MEMBER · mint selftest exits 0
```

Suite headline both ways (the same three reds, all of the tree recipe's class the spec named; the new `mint` member is green):

```
base  fb42118: organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
build fbb22b0: organism_test: 148 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
reds (both): coverage law "orphaned: deck_lint, home_pin, probe, study_scope" · SUITE MEMBER · sandbox selftest exits 0 · the hermetic-members roll-up (sandbox)
```

## `node scripts/models.mjs check`

```
base  fb42118: models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)   exit 0
build fbb22b0: exit 0
```

## THE LAW PACK COUNTS (row 1130 (2)) — `node scripts/lawpack.mjs gate`, LF trees, 19 Nov 2026

```
BASE  fb42118: lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
BUILD fbb22b0: lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
```

**No count rose; every count is EQUAL.** The gate's own verdict is `lawpack: 2 RED` on BOTH — `jugad-literal-subject-list 93` against a
frozen 90 and `depcruise_errors 13` against a frozen 7 — and both were already RED on main `fb42118` before this build (NAMED: not this
unit's, not touched here).

## Where the spec and the ruling differ (THE RULING WINS)

1. **LAST.** The spec's LAST row is the suite + law pack + models; the brief's is "no node process naming the temp dir survives". The
   witness's LAST is the brief's; the suite, law pack and models are measured in this proof above instead.
2. **The witness takes `--org` and `--base-org`** and plants every clause both ways in ONE run (the spec's table names RED/GREEN per
   tree). W2 covers all six mints (the spec measured acts and claims).
3. **W1 on base reads 32 for acts and claims**: mact's sequence (on main since `a4338f0`) already closes ONE process for those two; the
   clause is RED on base through the other four.
4. **ms36 is zero-padded to 8** (the spec: "8 chars for this era"), so a planted pre-era clock still reads back whole — stricter, not wider.
5. **The registry belt**: beyond `addRuling`, `upsertRow` refuses a `rulings` row whose id is held, so the `registry.mjs set` door cannot
   overwrite his words either (inside the named file).
6. **The spec's "stats/findings name the pair"** is not built: the ruling says "the folds name a pair", and they do (`ambiguous: n`).
7. **Fold choice kept**: outbox's fold keeps the FIRST post (as before), tasks' fold keeps the LATER create (as before); each now names
   the pair, and every verb on that id refuses — no fold rule was changed.

## FORKS

- **FORK-1 · no file beyond the named ones was edited.** `git diff --name-only fb42118 <tip>` = `scripts/mint.mjs`, the six organs,
  `package.json`, `ci/mid/*`. No `.dependency-cruiser.cjs`, no `organism_test.mjs` change was needed (the package.json line satisfied the
  coverage law: `ok SUITE MEMBER · mint selftest exits 0`).
- **FORK-2 · a legacy pair has no way out now.** Every verb refuses an id two rows hold, so a pair already in his `outbox.jsonl`,
  `tasks.jsonl` or `sitting_agenda.jsonl` stays open/pending forever (and the relay holds such an outbox row back each sweep, naming
  it in `refused_ambiguous`). A sitting that served a pair will not close it at close (refused, named on stderr). Whether a pair needs
  a resolve door (his word picks one row), and how many pairs exist, is the architect's call — the count is read on his laptop with the
  spec's NAMED command.
- **FORK-3 · the base law pack is RED on main `fb42118`** (jugad 93/90, depcruise 13/7) — measured, unchanged by this build; whose unit
  lowers it is not this seat's.
- **FORK-4 · the effort receipt** — `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository; its error is named in the final
  message and nothing is written under `campaign-2026-09/`.

## NAMED, NOT GUESSED

- How many ids his live ledgers already hold twice (the spec's count command, on his laptop).
- Whether any ledger is written from two machines (the mint guarantees one machine only).
- The live Windows PID maximum (7 base-36 chars cover 2^32; read with `Get-Process | Measure-Object Id -Maximum`).

## THE NEUTRAL MACHINE

Read with `curl -sS https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` (no token).

| Push | Check runs | Verdict |
|---|---|---|
| `7885631` | run `44524298793` | cancelled (a newer push superseded it) |
| `07f3e1b` | run `44524824295` | cancelled (a newer push superseded it) |
| `d1b5be1` | run `44525090694` · `135563418930` (node 22) · `135563418710` (node 24) | read at the next push |
