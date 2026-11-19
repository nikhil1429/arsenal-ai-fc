# MRUNG PROOF — the rung receipt (unit mrung · row 1058 (5) · rulings forks row 1122 (2))

> Branch `claude/mrung-build`, cut from `origin/main` at `224f9b90758d13edb42550f002d6c845cc7bb2a8` (`ci/mrung/BASE`),
> 19 Nov 2026. Spec: `ci/mrung/MRUNG_SPEC.md`, carried whole from `claude/mrung-spec` at `0e0f001` (its own ledger stays
> at `0e0f001:ci/mrung/LEDGER.jsonl`). Every act is a row of `ci/mrung/LEDGER.jsonl`. Where the spec and the ruling
> differ, the ruling won; each difference is in §6.

## 0 · THE BASE MOVED — measured, not assumed

The spec was measured at `a18c167`; main is `224f9b9` (19 Nov 2026). `git diff --stat a18c167 224f9b9 -- scripts/done.mjs
scripts/day.mjs scripts/sitting.mjs scripts/daily_green.mjs scripts/xray.mjs scripts/registry.mjs package.json .gitignore`
is empty: every `file:line` the spec cites still holds at this base.

## 1 · WHAT WAS BUILT (the named files, and only them)

| File | What | Anchor at the build |
|---|---|---|
| `scripts/rung_receipt.mjs` | NEW. Sole writer of `dressing-room/state/rung_receipts.jsonl` (header `:5`). Verbs `red` · `green` · `loop` · `show` · `verify` · `selftest`; no verdict, exit, sha or meter is ever a flag (`parseArgs`). Every row hash-chained (`rowSha`, `readReceipts`/`parseReceipts`). The reader's doors: `readPlan`, `rowProblem`, `clauseVerdict`, `loopVerdict`. | `:66` readPlan · `:136` rowProblem · `:173` clauseVerdict |
| `scripts/done.mjs` | `rungs()` re-read from the receipts keyed by the plan v3 list; the old body frozen as `rungsLegacy` (L9); `--receipts <file>`; `OLD_RECORDED_DAY` exported (F7 a); the stale meter comment corrected to `daily_green.mjs` header `:4`, append `:422`. The reader is loaded by dynamic import in `measure()` — a static import cycle under top-level await never settles (measured: exit 13). | `:44` RECEIPTS · `:46` OLD_RECORDED_DAY · `:77` rungsLegacy · `:107` rungs · `:206` the import |
| `scripts/day.mjs` | NEW pure export `dayProof(D)` beside `closeCounts`; still sole writer of nothing. | `:204` dayProof · `:207` the fulltime test · `:209` the bound host |
| `package.json` | `node scripts/rung_receipt.mjs selftest` joins `organism:selftest` (the coverage law). | `:18` |
| `ci/mrung/` | `BASE`, `MRUNG_SPEC.md` (carried), `LEDGER.jsonl`, `witness_mrung.mjs`, `run_mutants_mrung.mjs`, this file. | — |

No `.gitignore` line was needed for F9 (b): `git check-ignore -v dressing-room/state/rung_receipts.jsonl` exits 1 at this
base (19 Nov 2026) — the path is not ignored, so the receipt is TRACKED the day its writer first appends. The file itself
is not born on this branch: this seat never writes under `dressing-room/state`.

## 2 · THE WITNESS, BOTH WAYS (by last line)

`node ci/mrung/witness_mrung.mjs --org <tree> --base-org <clone of 224f9b9 under os.tmpdir()>`, 19 Nov 2026:

| Tree | Last line | Exit |
|---|---|---|
| BUILD (this branch) | `GREEN MRUNG the rung receipt measures red before, a real day's green and the meter, and done.mjs reads it UNREAD before it guesses · 17 clause(s)` | 0 |
| BASE (224f9b9) | `RED MRUNG · W1, W2, W3, W4, W5, W6, W7, W8, W9, W10, W11, W12, W13` | 1 |

Every W clause is RED on the base and GREEN on the build; the two CARRIED GUARDS G1 (old day) and G2 (one line) read GREEN
on both, as do BOUND and LAST. The base's own words for the two defects row 1058 names (the witness's W1/W2 lines on the
base, 19 Nov 2026): a hand file typed `"RED hand typed"`/`"GREEN hand typed"`/`"x"=="x"` prints `DONE rungs 1/1 clauses
GREEN`, and an empty `rungs/` prints `DONE rungs 0/0 clauses GREEN`. On the build the first prints `UNREAD (no plan v3
list) · hand 1 REFUSED (typed: hand contract)` and the second `UNREAD (no plan v3 list)`; a plan of zero clauses prints
`UNREAD (the plan v3 list holds no clause)`.

THE PRIVATE RECEIPT (F9 b, clause W13): the witness plants a close row carrying a marker word in `concept`/`task` and a
host session id, and a witness whose output carries a marker word; the receipt the organ writes holds neither marker nor
the host id nor the planted git identity, every row's keys are the contract's own, and `day_proof` holds exactly
`source, sitting_id, closed_at, reason`.

THE PORT CLASS (row 1053): the witness binds no port, names no service, POSTs nothing, restarts nothing and spawns no
model; its state is reached only through `ARSENAL_RUNG_STATE_DIR` (refused outside `os.tmpdir()`) and day.mjs's own
`ARSENAL_SITTING_STATE_DIR`, both pointing under its temp root. Every planted git repo is `git init` under
`core.autocrlf=false`. LAST: no node process naming the temp root survives; the longest child of the build run took under
3 s against the organ's `WITNESS_TIMEOUT_MS` (the LAST line prints both, `witness_mrung.mjs` run of 19 Nov 2026).

## 3 · THE MUTANTS

`node ci/mrung/run_mutants_mrung.mjs --org . --base-org <clone of 224f9b9>`, 19 Nov 2026:
`run_mutants: 13 of 13 mutant(s) RED by the clause that names them · control GREEN`.
M1–M12 are the spec's §7 table as written; M13 (the writer stores the witness's last output line) is added for W13.

## 4 · SELFTESTS AND SUITE MEMBERS, BEFORE AND AFTER

| Touched | Before (base 224f9b9) | After (this branch) |
|---|---|---|
| `rung_receipt.mjs selftest` | absent (the organ did not exist) | `rung_receipt selftest: all 13 pass` (19 Nov 2026, `node scripts/rung_receipt.mjs selftest`) |
| `done.mjs` | no selftest mode (its net is the suite's `done()` section and ci/mdone) | unchanged: no selftest mode |
| `day.mjs` | no selftest mode (its net is ci/mday) | unchanged: no selftest mode |
| suite member `SUITE MEMBER · rung_receipt selftest exits 0` | not a member | `ok` (the build's suite, 19 Nov 2026) |
| suite `WHAT IS LEFT` (done.mjs --hermetic) | the three `ok` lines (one `DONE · ` line · LIVE · laws both ways) | the same three `ok` lines (the build's suite, 19 Nov 2026) |

THE SUITE (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, each on a FRESH clone under
`os.tmpdir()`, 19 Nov 2026):

| Tree | Headline line |
|---|---|
| BASE `224f9b9` | `organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` (19 Nov 2026) |
| BUILD `1e396e4` | `organism_test: 144 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` (19 Nov 2026) |

The three reds are the SAME on both (pre-existing at the base): the coverage law naming `deck_lint, home_pin, probe,
study_scope`; `SUITE MEMBER · sandbox selftest exits 0`; and the all-members line, which names only `sandbox` on both.
The one added `ok` is `SUITE MEMBER · rung_receipt selftest exits 0`. Two earlier measurements were discarded and are in
the ledger: a first base clone without `node_modules` (done() NOT MEASURABLE), and a clone a discarded run had left a
`brain_ledger.jsonl` in (its brain-ledger block runs only when that file exists). An earlier build tip `e022fc1` read a
NEW red — the selftest assumed the repo sits outside `os.tmpdir()`, false in a temp clone — fixed at `1e396e4`.

`node scripts/models.mjs check` (19 Nov 2026): `models check · config scan: 19 file(s) · hits 0 · declared 0
(fuelboard_config.json 0 of baseline 0)` — exit 0.

## 5 · THE RULINGS, AS BUILT (row 1122 (2))

- **F1 (b)** a real day is a full-time close with a bound host: `day.mjs dayProof` (`:204`) — a `sitting_review` row
  closed on D with reason `fulltime` and a non-empty `host_session_id`; the record only his own `day.mjs end` writes
  (word 240). W7 plants (a) no close, (b) a day-rollover close, (d) a fulltime close with no host — each refused — and
  (c) a fulltime close with a host — accepted, its sitting id on the green row.
- **F2 (a)** every hand file in `<campaign>/rungs/` but the plan is REFUSED clause by clause and counted in nothing
  (`hand N REFUSED`, outside n). `rungsLegacy` is frozen, never called.
- **F3 (a)** — THE CONTRACT lane M's campaign-side verb must write, read from this repo:
  `scripts/rung_receipt.mjs:55-60` (the comment and `PLAN_CONTRACT`), its ONE reader `scripts/rung_receipt.mjs:66`
  (`readPlan`), at `<campaign>/rungs/plan_v3.json` (`PLAN_FILE`, `:59`): `{ plan: "v3", source, source_sha256 (64 hex),
  rungs: [{ rung, clauses: [{ id, witness }] }], loops: [{ loop }] }`, ids matching `^[A-Za-z0-9._-]+$`, each witness a
  `node <tracked path> [args]` string (F4 a). Keys `<rung>:<clause>`; loops `loop:<id>`. The reader that consumes it is
  `scripts/done.mjs:107`. The verb itself is NOT built here (the campaign lives outside the repo).
- **F4 (a)** `parseWitness`: `node <repo-relative path git ls-files tracks> [args]`, no shell or quote character.
- **F5 (a)** ONE new door `ARSENAL_RUNG_STATE_DIR`, honoured only under `os.tmpdir()` (`stateDir`); the real-day read
  rides `ARSENAL_SITTING_STATE_DIR` (`day.mjs:55`).
- **F6 (a)** loops ride the same file, `kind: "loop"`, four artefacts hashed by the organ at write time.
- **F7 (a)** the constant stays in done.mjs (`:46`, now exported); every meter row records `old_day` and `old_day_green`.
- **F8 (b)** `WITNESS_TIMEOUT_MS`, a new export of `rung_receipt.mjs` (`:52`) — see FORK 1 for how its value is held.
- **F9 (b)** TRACKED (no ignore line needed, §1); a row holds a day, a sitting id, shas, exits and the witness command —
  no output text, no word of his, no person name (W13).
- **F10 (a)** — NOT built: FORK 2.
- **(3)** `ci/mrung/` is written whole (witness, BASE, mutants, spec, ledger, this proof) whichever landing order holds.

## 6 · FORKS

1. **F8 (b) vs "never type a timeout".** The ruling asks a new exported constant; the brief forbids typing a timeout.
   Held both ways: `WITNESS_TIMEOUT_MS` is a NEW export of `rung_receipt.mjs` whose value is READ from an owner —
   `postmatch.mjs CHILD_TIMEOUT_MS`, the organism's owner-CLI child bound — never a literal. Measured against it: every
   planted witness run in this proof (LAST line). The slowest plan v3 witness is NOT measurable here (the plan is
   campaign-side); if it exceeds the bound, `red` refuses with "did not finish" and writes nothing.
2. **F10 (a) — the registry row is a write to a STATE file this seat may not touch.** `registry.json` is a tracked file
   under `dressing-room/state`, sole writer `scripts/registry.mjs`, rows seeded only through its CLI (its header). This
   brief forbids every write under `dressing-room/state`. The row, for the runner's hand at the laptop (one command,
   its receipt prints): `node scripts/registry.mjs set --table lanes --json '{"subject":"rung_receipts","schema_owner":"rung_receipt.mjs","witness":"scripts/rung_receipt.mjs SOLE WRITER header · forks row 1122 (2) F9 b / F10 a","consumers":[{"name":"done.mjs"}],"reach":"any","writes_to":"rung_receipts.jsonl","files":["dressing-room/state/rung_receipts.jsonl"],"why":"the rung receipt: rung_receipt.mjs measures each plan v3 clause (red before, green on a real day, meter equal); done.mjs reads it"}'`.
3. **The spec's `last_line` field is NOT stored.** Spec R2 put the witness's last output line on `red`/`green` rows;
   the ruling F9 (b) says the tracked receipt holds a day, a sitting id and hashes, none of his words. Output text is
   printed on the verb's own stdout only; the row keeps `out_sha256`. M13 kills a writer that stores it.
4. **The loop row stores a file's basename, never its path** (a laptop path names a user directory); its sha256 is the
   organ's own. The spec said `path`.
5. **The green row carries `red_sha`** (the red row's `row_sha256`) beside the spec's fields, so the reader pairs a green
   with exactly the red it re-ran.
6. **W7 gains (d)** (a fulltime close with no host) — the bound-host half of F1 (b); **W13 is added** — the ruling's
   planted-receipt proof of F9 (b).
7. **`dayProof` takes no `current`** (the spec's signature had it): an open sitting has no close row, so it can never be
   a real day; the open sitting is not read.
8. **The hermetic `orphan verbs` count differs from the spec's line** (spec at `a18c167`: 171; here, at the base and the
   build alike: the G2 line of the witness, 19 Nov 2026). The base and the build agree, so it is not this unit's; the
   difference is the environment the two seats measured in, not traced further.
9. **`scripts/organism_test.mjs` is not touched**: W11's hermetic receipt read is not added to the suite's `done()`
   section (the spec's own fork; the architect's call).
10. **The effort receipt** (`campaign-2026-09/tools/effort_receipt.mjs`) is not in this repository; its error is named
    in the seat's final message and nothing is written under `campaign-2026-09/`.

## 8 · FOLLOW-UP — forks row 1130 (the architect's ruling on ed29f4d)

**What the ruling measured, re-measured here** (`node scripts/lawpack.mjs report`, 19 Nov 2026): at `ed29f4d` the law pack's
`jugad-literal-subject-list` read 95 on the build against 93 on the base (frozen baseline 90); `depcruise_errors` 13 on
both. The two new findings were both in `scripts/rung_receipt.mjs`: `COMMON` (the row's common fields) and `LOOP_ROLES`.

**(1) Fixed at the site, by derivation, never by an ignore line.** The common fields and each kind's own fields are now keys
of ONE owner structure, `ROW_SHAPE`; `COMMON`, `FIELDS` and `ROW_FIELDS` are derived from it. The loop's four roles are
the keys of `LOOP_FLAGS` (role → its CLI flag); `LOOP_ROLES`, the loop verb's flags and its required set are derived from
it. No `law-waiver` line was added.

THE LAW PACK GATE'S COUNT LINE (`node scripts/lawpack.mjs report`, 19 Nov 2026):

| Tree | Line |
|---|---|
| BASE `224f9b9` | `lawpack · 1928 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13` |
| BUILD `09be994` | `lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13` |

Every FINDING count is equal. The RAW match count (the ast-grep hits before the law pack's judgement) rises by 5 with the
new code; it is not a gated count (the `frozen:` line names none), and is named here rather than left for a reader to find.

**The new witness clause G3** (LAWPACK): every count on the findings line of the `--org` copy is no higher than on
`--base-org`. On the build: `GREEN G3 · 11 count(s) · higher than BASE: none · jugad 93 vs 93 · depcruise 13 vs 13`. It
is GREEN on the base too (a tree is never higher than itself): a guard, like G1 and G2. **Its mutant M14** re-lists
`LOOP_ROLES` as a literal array: `M14 G3 · KILLED · RED MRUNG · G3`.

**(3) Fork 9, as ruled:** the hermetic receipt read joins the suite's `done()` section (`scripts/organism_test.mjs`, now a
named file of this unit). Three asserts, a planted plan and receipt under `os.tmpdir()` built by a child with
`rung_receipt.mjs`'s own row math: GREEN through `--receipts`, UNREAD without it, a zero-clause plan UNREAD never 0/0.
`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs done` (19 Nov 2026): `organism_test: 10 passed, 0 failed ·
ruled 0 · UNRULED 0 · LIVE 0 (hermetic: named, not run)`.

**Fork 2, as ruled:** the registry row is the runner's one command at the landing (§6 fork 2 holds the command).
**Forks 1, 3, 4, 5, 6, 7, 8:** ruled as built.

**Every measurement, re-taken at `09be994`** (19 Nov 2026):

| Measurement | Last line |
|---|---|
| witness, BUILD | `GREEN MRUNG the rung receipt measures red before, a real day's green and the meter, and done.mjs reads it UNREAD before it guesses · 18 clause(s)` (exit 0) |
| witness, BASE | `RED MRUNG · W1, W2, W3, W4, W5, W6, W7, W8, W9, W10, W11, W12, W13` (exit 1) |
| mutants | `run_mutants: 14 of 14 mutant(s) RED by the clause that names them · control GREEN` |
| BOUND | `5 file(s) differ from --base-org (package.json, scripts/day.mjs, scripts/done.mjs, scripts/organism_test.mjs, scripts/rung_receipt.mjs)` |
| suite, BUILD (fresh clone) | `organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` (19 Nov 2026) — the same three reds as the base, +3 RUNGS asserts |
| suite, BASE (fresh clone) | `organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` (19 Nov 2026) |
| `node scripts/rung_receipt.mjs selftest` | `rung_receipt selftest: all 13 pass` |
| `node scripts/models.mjs check` | exit 0 |

The member lines touched by the follow-up: `SUITE MEMBER · rung_receipt selftest exits 0` `ok` before and after; the
`WHAT IS LEFT` section, three `ok` lines before, six after (the three above added).

## 7 · THE NEUTRAL MACHINE

Read signed-out through the public API (`curl https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`), 19 Nov 2026.
Each push cancels the run of the push before it (the workflow's concurrency), so only the last push of a burst is judged:

| sha | workflow run | check runs | conclusion |
|---|---|---|---|
| `ef242af` | `44440084971` | `135278456934` node 24 · `135278457217` node 22 | node 24 success · node 22 cancelled (superseded) |
| `e022fc1` | `44440688509` | `135280561691` node 24 · `135280562112` node 22 | both cancelled (superseded) |
| `1e396e4` | `44441080560` | `135281881714` node 24 · `135281881368` node 22 | cancelled (superseded) |
| `ed29f4d` | `44441322699` | `135282672906` node 22 · `135282672477` node 24 | both success · B1 annotation `GREEN` vs base 224f9b9 ("no member red that is not red at the merge base") |
| `58913b9` · `f266835` · `09be994` | the follow-up pushes (row 1130) | — | named in the seat's final message |

The push that carries this file is judged by the same workflow; its run and verdict are named in the seat's final
message, not here (a file cannot carry the verdict of the commit that writes it).
