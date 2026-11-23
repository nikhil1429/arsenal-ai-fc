# mcanary · THE THREE B-CANARY CLAUSES — PROOF (forks rows 1162 / 1163, 19 Nov 2026 UTC)

Branch `claude/mcanary-build`, cut from `origin/main` at **`fb42118`** (`fb4211870093e6b8657655eb02ebcfc425f1eab1`, fetched
19 Nov 2026 12:34Z; `ci/mcanary/BASE`). Spec: `ci/mwit/MWIT_SPEC.md` at **`88bf69d`** (`git show 88bf69d:ci/mwit/MWIT_SPEC.md`),
read whole with its `LEDGER.jsonl` and `plant_day.mjs`. Ledger of every act: `ci/mcanary/LEDGER.jsonl`. Stopped once on his
pause (word 269, CHECKPOINT at `0c62d5b`, 2026-11-19T12:38:01Z) and resumed on word 270 from that tip.

## Files (only these differ from the base — BOUND, below)

| file | what |
|---|---|
| `ci/witness/mcanary/canary.mjs` | the canary file's ONE writer (`pass` · `run` · `show` · `verify`) — header names it SOLE WRITER |
| `ci/witness/mcanary/canaries.jsonl` | the tracked canary file, EMPTY at this build (no real canary has run after a pass line) |
| `ci/witness/mcanary/witness_canary.mjs` | the one reader: `<id>` (clause read, exit 0/1/2) and `plants [--org] [--base-org] [--only]` |
| `ci/mcanary/{BASE, LEDGER.jsonl, PROOF.md, run_mutants_mcanary.mjs}` | this unit's record |

No organ file is edited (a ci-only unit, row 1162 (4)); `scripts/organism_test.mjs` is not touched (row 1162 (2), F11:
unit mmeter's member runs every witness's plants mode).

## Measured at the base (`fb42118`)

| fact | where |
|---|---|
| no canary file, writer or witness at the base | `git ls-tree -r fb42118 --name-only \| grep -ci canary` → `0` |
| the chain the canary rows ride: `rowSha` / `parseReceipts` (imported, never copied) | `scripts/rung_receipt.mjs:101`, `:107-121` |
| the one child bound, read from its owner (no timeout typed): `WITNESS_TIMEOUT_MS = CHILD_TIMEOUT_MS` | `scripts/rung_receipt.mjs:51` |
| the witness form the receipt accepts (`node <tracked path> [plain args]`) | `scripts/rung_receipt.mjs:224` (`parseWitness`) |
| a session record's keys, read from THIS seat's own `get_session` (shape only; nothing of it is written anywhere): `id`, `created_at`, `environment_kind` (`anthropic_cloud`), `status_bucket`, `configured_model`, `external_metadata.last_served_model`, `session_context.outcomes[].git_repository.git_info.branches` | ledger row 3 |
| a seat's commits carry its session in a `Claude-Session: https://claude.ai/code/<session id>` trailer | `git log origin/main --format=%B -200 \| grep -c "Claude-Session: https://claude.ai/code/session_"` → `46` (19 Nov 2026) |

## The design (the spec's §B-canary, as built)

- **Writer.** `pass --id <id> --line <words> --seat <name>…` appends the pass row (before the launch). `run --id <id> --session
  <seat>=<record.json>… [--remote <name>]` appends the run row, MEASURED: each seat's facts are read out of the session
  record the session tool returned at return (saved to a file), its unit off its branch name, and "its push reached its
  branch" by git — `ls-remote` the branch tip, fetch it, find the newest commit carrying that session's trailer. The run row
  names the pass row's sha. Any flag outside a verb's set is refused; a run with no pass row, a seat the pass row does not
  name, or an unreadable remote is refused with nothing appended. No verdict, time or model is an argument.
- **Reader.** For id X: no file / no pass / no run / an unread fact → **2**; a broken chain, a run naming another pass row
  (the pass line edited after the run), a run started at or before its pass line, or a failed predicate → **1**; else **0**.
  Predicates: *launch-no-laptop* — one seat, `environment_kind` is the cloud's, push reached. *opus-vs-fable* — two seats, one
  unit, each served the model it was configured with, the two served models differ, both pushes reached. *design-fleet* —
  every named seat's push reached and its status bucket reads review-ready or completed.

## The witness, both ways (19 Nov 2026)

```
node ci/witness/mcanary/witness_canary.mjs plants --org . --base-org <scratch>/base      (base = git archive fb42118 | tar -x)
  GREEN launch-no-laptop · 15 of 15 case(s)
  GREEN opus-vs-fable · 8 of 8 case(s)
  GREEN design-fleet · 5 of 5 case(s)
  live  launch-no-laptop · exit 2 · CANARY launch-no-laptop UNREAD · no canary file      (run before the empty file was made; now: "no pass row for it")
  GREEN BOUND · 5 file(s) differ from --base-org
  GREEN LAST · 0 node process(es) naming a temp root survive
GREEN MCANARY plants both ways, BOUND held · 3 clause(s)
```

RED on the base: in every clause the base half plants the ok case on the base tree and reads `setup: pass exit 1` (the base
has no canary organ) — never 0. The clause read on this build's tracked file:
`node ci/witness/mcanary/witness_canary.mjs launch-no-laptop` → `CANARY launch-no-laptop UNREAD · no pass row for it`, exit 2
— the honest red-before for `rung_receipt.mjs red` (it refuses only an exit 0, `scripts/rung_receipt.mjs:306`), and on the
cloud a fact only the campaign holds reads UNREAD, never green (row 1162 (5)).

Re-taken with every file in place (19 Nov 2026, same command): the three clauses as above, the three live reads
`exit 2 · … UNREAD · no pass row for it`, `GREEN BOUND · 7 file(s) differ from --base-org`, `GREEN LAST · 0 node process(es)
naming a temp root survive`, last line `GREEN MCANARY plants both ways, BOUND held · 3 clause(s)`, exit 0.

## Mutants (one per clause, spec (d))

```
node ci/mcanary/run_mutants_mcanary.mjs --org .
  KILLED   launch-no-laptop · (d) the started_at > pass.at check dropped · RED MCANARY · launch-no-laptop
  KILLED   opus-vs-fable · (d) two different unit ids accepted · RED MCANARY · opus-vs-fable
  KILLED   design-fleet · (d) returns counted >= 1 instead of every seat · RED MCANARY · design-fleet
run_mutants: 3 of 3 mutant(s) RED by the clause that names them · control GREEN
```

## Selftests and members touched

None. No organ with a selftest is edited and no suite member is added or changed (row 1162 (2)). The suite, BASE and build,
by `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` (19 Nov 2026):

```
BASE  fb42118 : organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)   EXIT 2
BUILD         : organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)   EXIT 2
the one red, both: [UNRULED] EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)
```

## The law pack counts and LAW M (by command, on this LF tree, 19 Nov 2026)

```
node scripts/lawpack.mjs gate      (BASE fb42118 and BUILD — the first two lines are byte-identical)
lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)      exit 1 on BASE and on BUILD (jugad-literal-subject-list 93 vs 90 · depcruise_errors 13 vs 7 — both already at the base)

node scripts/models.mjs check      (BUILD)
models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)      exit 0
```

The build raises no count (the law pack's rules read `scripts/**`; this unit adds nothing there). The base's own two REDs are
named, not this unit's.

## Where the ruling text and the spec differ

- Spec UNITS note "every unit adds its witness to `organism_test.mjs`": overruled by row 1162 (2) — not edited.
- Spec names the plants on the witness; the brief names `ci/mcanary/witness_mcanary.mjs` — read as the `ci/witness/mcanary/`
  witness (the brief says so); its plants mode is `plants`.

## FORKS

- **FK1 · how the run row reads a session.** The session tool has no command-line door, so `canary.mjs run` takes the record
  the runner saved from that tool's result, per seat, and reads every fact out of it (its sha256 is on the row). (a) as built;
  (b) a campaign launch ledger that stores the records. Recommend (a).
- **FK2 · a seat's unit.** Read off its branch name `claude/<unit>-…` (the convention every seat branch here carries), since no
  launch ledger is in this repo (spec N7). (a) as built; (b) the launch ledger's unit field. Recommend (a) until N7 is reachable.
- **FK3 · "no attached machine".** Judged by `environment_kind === "anthropic_cloud"` (the value measured on this cloud seat).
  Which key `get_session` uses for an attached Remote Control computer is NOT measured (no machine was attached to observe):
  NAMED, not guessed. (a) as built; (b) add that key once a record with a computer attached is read.
- **FK4 · opus-vs-fable's predicate.** Same unit · each seat served its configured model · two different served models · both
  pushed. Which seat is Opus and which is Fable lives in the pass line's words only; asserting it by machine would put a
  model id into tracked data or code (LAW M). (a) as built; (b) the pass row names a model ROLE per seat, resolved by
  `scripts/models.mjs`. Recommend (a).
- **FK5 · a broken chain.** Reads **1** (the record is shown edited by a hand), never 0 or 2. (a) as built; (b) 2.
- **FK6 · the suite member's argv.** Unit mmeter's member runs every witness's plants mode; this witness takes `plants` and,
  with no `--base-org`, judges the build half only and says so in its last line (`… base half and BOUND NOT JUDGED`).
- **FK7 · the base tree.** The worktree rail refused `git worktree add` (ledger); the base for BOUND and the base half was made
  by `git archive fb42118 | tar -x` into the scratchpad — a plain tree, no checkout left behind.

## Named, not reached

- **N8** the pass lines and the real launches (cloud launch, Opus beside Fable, the design fleet) — campaign acts; the file
  ships empty and every id reads UNREAD (2) here.
- the effort receipt tool `campaign-2026-09/tools/effort_receipt.mjs` — not in this repository (run at the end; its error is
  named in the final message; nothing is written under `campaign-2026-09/`).

## CI

Read by the public API with curl, no token, and `NODE_USE_ENV_PROXY=1 node scripts/ci_verdict.mjs <full sha>` (19 Nov 2026):

```
19005bae135f0ebeaede8b0b9ec28f1caa994bc5  (the proof's own commit)
135779275053 npm test · node 22 completed success
135779273055 npm test · node 24 completed success
ci_verdict 19005ba GREEN — npm test · node 22: GREEN (base fb42118 · 0 new red · 1 base red · 126 live) [run 135779275053] | npm test · node 24: GREEN (base fb42118 · 0 new red · 1 base red · 126 live) [run 135779273055] (3 calls)   exit 0
```

The tip that carries this section changes only this file and the ledger; its two legs are read the same way and named in the
seat's final message.

Effort receipt (the brief's last step): `node campaign-2026-09/tools/effort_receipt.mjs --fleet mcanary --seat 00 --model …`
→ `Error: Cannot find module '/home/user/arsenal-ai-fc/campaign-2026-09/tools/effort_receipt.mjs'`, exit 1 — the tool is not
in this repository; nothing was written under `campaign-2026-09/`.

## Merge of main (row 1172, 20 Nov 2026)

CHECKPOINT · STOPPED at 2026-11-20T01:28:40Z · merged tip `531c9a2f1a264f0851988e03782313f0b5d6fa6b` (merge of main into `c7b8fa2`) · BASE now `5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90` (`ci/mcanary/BASE`) · resolution hunks: NONE — the merge was clean; of the two contested files only `scripts/organism_test.mjs` moved, on main's side alone (this unit adds no member, row 1162 (2)), and `package.json` did not move · witness `node ci/witness/mcanary/witness_canary.mjs plants --org . --base-org <git archive 5759cce>` → `GREEN MCANARY plants both ways, BOUND held · 3 clause(s)` (BOUND: 7 file(s) differ, all named) · mutants `node ci/mcanary/run_mutants_mcanary.mjs --org .` → `run_mutants: 3 of 3 mutant(s) RED by the clause that names them · control GREEN` · resume from: the architect's next message.

## Merge of main 7bf008b (forks rows 1233 (2) / 1236, 21 Nov 2026)

- merge: `a4e48c2` (main `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f` into `475ffad`), a merge commit, no rebase, no force. Conflicted
  files: NONE — the merge was clean; `scripts/organism_test.mjs`, `package.json` and `ci/` carry every landed line of main as-is.
- BASE: `ci/mcanary/BASE` = `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f` — the brief keys BASE to the main this branch merges (row 1172).
- one edit on top (`520231a`): main now carries unit mmeter's suite member, which reads a witness GREEN only on a
  `PLANTS <unit> · k of n plant(s) as expected` line; the witness prints that line, and `CLAUSE <id> RED · k/n plant(s)` on a red
  clause. No predicate, case or mutant edit site moved.
- mclk: no witness of this unit derives a day from the clock (it compares recorded `created_at` / pass `at` instants only), so the
  planter's one instant is not read here.
- witness on the merged tree, `node ci/witness/mcanary/witness_canary.mjs plants --org . --base-org <git archive 7bf008b>` (21 Nov 2026)
  → `PLANTS mcanary · 30 of 30 plant(s) as expected` · `GREEN MCANARY plants both ways, BOUND held · 3 clause(s)`.
- mutants, `node ci/mcanary/run_mutants_mcanary.mjs --org .` → `run_mutants: 3 of 3 mutant(s) RED by the clause that names them · control GREEN`.
- suite, `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` on the merged tree → exit 0, no failed assertion; the
  CLAUSE WITNESS member reads mcanary GREEN.
- CI on `520231ae21b4f1337601c584371c3f4c98f6ace3`, read by the public API with curl, no token, and
  `NODE_USE_ENV_PROXY=1 node scripts/ci_verdict.mjs <full sha>` (21 Nov 2026):

```
136775494247 npm test · node 24 completed success
136775494256 npm test · node 22 completed cancelled
ci_verdict 520231a RED — npm test · node 22: RED (cancelled; no verdict annotation — the run never reached its verdict · step npm test · hermetic · merge base · cancelled) [run 136775494256] | npm test · node 24: GREEN (base 7bf008b · 0 new red · 0 base red · 125 live) [run 136775494247]   exit 1
```

  THE RED, named: the node 22 leg never judged. Its annotation reads `The job has exceeded the maximum execution time of 1h0m0s`.
  The step times, from the public jobs API: `npm test · hermetic · head` ran 08:09:45Z→09:07:56Z (≈58 min) and passed, which left
  the `merge base` step under a minute before the runner's job limit cancelled it at 09:08:34Z, and the verdict step was skipped. On
  node 24 the same head step ran ≈47 min and the merge-base step ≈3 min, then GREEN with 0 new red. So the cause is the job's
  wall-clock limit on the node 22 runner, not an assertion; the job logs are not on the tokenless API, so which member spent the
  minutes is NOT measured here. No retry was run (a retry until green is refused).

CHECKPOINT · 2026-11-21 · merge sha `a4e48c2` (main `7bf008b` in, clean, no conflicted file) · BASE `7bf008b` · witness `GREEN MCANARY plants both ways, BOUND held · 3 clause(s)` · mutants `3 of 3 … · control GREEN` · legs on `520231a`: node 24 GREEN [136775494247] · node 22 RED — cancelled at the 1h job limit before its merge-base step [136775494256] · resume from: the architect's next message.
