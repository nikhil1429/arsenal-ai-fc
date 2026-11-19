# MRUNG SPEC — the rung receipt (unit mrung · row 1058 (5) · forks rows 1108 / 1109)

> A SPEC, not a build. Base: `origin/main` at `a18c167f0ecda8f688cc8edb161439f7e9bdab3a`, read 19 Nov 2026.
> Every `file:line` below is at that sha. Every measurement was taken in a hermetic copy (the tracked code under
> `os.tmpdir()`, no state dir, campaigns planted by a node script — `ci/mrung/LEDGER.jsonl` holds each act).
> Nothing here names a budget, a timeout, a size or a model id; every count is the output of a named command.

**ROW 1058 (5), verbatim:** *Rungs and loops: their fate is unit mrung, named now, spec first: the plan v3 rung
clauses get a machine-readable receipt (red before, green on a real day, meter equal); until it lands done.mjs keeps
printing UNREAD, never a guessed zero.*

**HEADLINE.** At base, `done.mjs` already reads rungs — but from a HAND contract: a JSON file whose `red_before` /
`green_real_day` are free strings matched by `/^RED\b/` / `/^GREEN\b/` and whose `meter_before`/`meter_after` are two
strings compared for equality (`scripts/done.mjs:58-62`, `:80-81`). MEASURED (probe `typed_strings_count_green`, 19 Nov
2026): a planted clause typed `"RED hand typed"`, `"GREEN hand typed"`, `"x" == "x"` prints `rungs 1/1 clauses` —
**a typed row counts GREEN today**. And an empty `rungs/` directory prints `rungs 0/0 clauses` (probes `camp-e2`,
`camp-e3`) — **the guessed zero row 1058 forbids is reachable today**. The spec replaces the hand contract with ONE
append-only receipt file written by ONE new organ, `scripts/rung_receipt.mjs`, which RUNS the witness itself and
records exit code, output sha256 and git HEAD sha; `done.mjs` reads it keyed by a campaign-side plan v3 list, and
prints every plan clause with no complete receipt as **UNREAD** — never 0, never a count of nothing.

---

## 0 · WHAT done.mjs PRINTS FOR RUNGS AND LOOPS TODAY (measured, base a18c167)

| # | Fact | file:line | Measured by (hermetic copy, 19 Nov 2026) |
|---|---|---|---|
| 0.1 | No `--campaign` ⇒ `rungs UNREAD (no --campaign)` | `scripts/done.mjs:71`, `:168` | `done.mjs line --hermetic` → `… rungs UNREAD …` exit 0 |
| 0.2 | `--campaign` without `rungs/` ⇒ `UNREAD (<dir> absent)` | `scripts/done.mjs:73` | probe `campaign_without_rungs_dir` → `rungs UNREAD` |
| 0.3 | **`rungs/` present but empty ⇒ `0/0 clauses`** (a guessed zero) | `scripts/done.mjs:75-84`, `:168` | probe `camp-e2` → `DONE rungs 0/0 clauses GREEN` |
| 0.4 | **A rung file with `clauses: []` vanishes** — counted in neither n nor red | `scripts/done.mjs:78` | probe `camp-e3` → `0/0` |
| 0.5 | **A typed string verdict counts GREEN** | `scripts/done.mjs:80-81` | probe `typed_strings_count_green` → `rungs 1/1 clauses` |
| 0.6 | A missing field ⇒ not green, named `S1:c1` | `scripts/done.mjs:82`, `:186` | probe `missing_fields` → `0/1 … not green: S1:c1` |
| 0.7 | The old recorded day `2026-11-13` must still read RED on the meter, or NO clause is green | `scripts/done.mjs:40`, `:63-69`, `:81` | probe `no_old_day_row` → `old day: the meter holds no 2026-11-13 row` |
| 0.8 | Hermetic + campaign without `--meter` ⇒ meter path `""` ⇒ `the meter is unreadable` ⇒ nothing green | `scripts/done.mjs:165`, `:65` | probe `hermetic_campaign_no_meter` |
| 0.9 | Loops: a loop is green iff four paths exist and the ladder's sha256 equals a TYPED `ladder_sha256` | `scripts/done.mjs:85-92` | read; the typed sha is the writer's own claim |
| 0.10 | The meter comment names `daily_green.mjs:91` as its sole writer — **stale**: the append is `scripts/daily_green.mjs:422`, the header `:4` | `scripts/done.mjs:38` | `grep -n appendFileSync scripts/daily_green.mjs` |
| 0.11 | `done.mjs` is SOLE WRITER of NOTHING | `scripts/done.mjs:5` | header |
| 0.12 | The suite holds `done.mjs line --hermetic` to ONE `DONE · ` line, exit 0 | `scripts/organism_test.mjs:2708-2722` | read |

The hermetic line itself (19 Nov 2026, `done.mjs line --hermetic` in the copy):
```
DONE · orphans lanes 5 · orphan verbs 171 · rungs UNREAD · rules laws 8/8 both ways (8/8 RED-planted) | ten laws LIVE | laws_register LIVE | teaching rules LIVE · units UNREAD · census UNREAD · reach LIVE (the consumer map is the live registry)
```

---

## 1 · CLAUSE R1 — THE RECEIPT FILE AND ITS ONE WRITER

**File:** `dressing-room/state/rung_receipts.jsonl` — append-only, one JSON row per MEASUREMENT (never per verdict).
**Sole writer:** NEW organ `scripts/rung_receipt.mjs`, its header carrying `SOLE WRITER of dressing-room/state/rung_receipts.jsonl`
(the form `grep -rn "SOLE WRITER" scripts/*.mjs` finds, `CLAUDE.md` owners-only rule). No other organ writes it; a hand
cannot (the rail already denies an editor write and a shell write under the state path — `scripts/rails.mjs:24`, `:204`).
**Readers:** `scripts/done.mjs` (only). xray's Q2 (`scripts/xray.mjs:1052-1054`) is the static check of the one writer.

**Owners it touches (each by its door):**
| Owner | What the new organ needs | Door (base) |
|---|---|---|
| `scripts/day.mjs` (sole writer of nothing, `:13-14`) | the REAL DAY proof (§4) | NEW pure export `dayProof(D)` beside `closeCounts` (`scripts/day.mjs:188`); reads through the existing env door `ARSENAL_SITTING_STATE_DIR` (`scripts/day.mjs:55`) |
| `scripts/sitting.mjs` (sole writer of `sitting_reviews.jsonl`, `:20`, row written `:1062-1066`) | nothing written; its close row is READ via `day.mjs dayProof` | read only |
| `scripts/daily_green.mjs` (sole writer of `daily_green.jsonl`, `:4`, append `:422`) | the meter's bytes, hashed before and after the green run; the old-day row read | read only |
| git | `HEAD` sha, `merge-base --is-ancestor` | `spawnSync("git", …)` read-only |

**Verbs (the CLI — no verdict is ever an argument):**
```
node scripts/rung_receipt.mjs red    --rung <id> --clause <id> --cmd "<witness command>"
node scripts/rung_receipt.mjs green  --rung <id> --clause <id> --day <YYYY-MM-DD IST>
node scripts/rung_receipt.mjs loop   --loop <id> --sheet <p> --page <p> --acts <p> --ladder <p>     (fork F6)
node scripts/rung_receipt.mjs show   [--rung <id>]          (read-only; one line per key)
node scripts/rung_receipt.mjs verify                        (read-only; walks the chain, exit 1 on a break)
node scripts/rung_receipt.mjs selftest
```
`green` takes NO `--cmd`: it re-runs the exact command the `red` row recorded (so "the same witness" is by
construction, not by claim). Any flag outside this table (`--exit`, `--verdict`, `--sha`, `--meter`, `--green`, …) is
REFUSED before anything runs — the typed door does not exist.

---

## 2 · CLAUSE R2 — THE ROW SHAPE

Every row, every kind:
```
{ "v": 1, "kind": "red"|"green"|"meter"|"loop", "key": "<rung>:<clause>", "rung": "<id>", "clause": "<id>",
  "at": "<ISO UTC>", "by": "rung_receipt.mjs",
  "prev_sha256": "<row_sha256 of the previous row, or 64 zeros for the first>",
  "row_sha256": "<sha256(prev_sha256 + canonical JSON of this row without row_sha256)>" , ...kind fields }
```
| kind | the measurement | fields (each MEASURED by the organ, never passed in) |
|---|---|---|
| `red` | RED BEFORE | `cmd`, `cmd_sha256` (= sha256(cmd)), `head_sha` (`git rev-parse HEAD`), `exit` (integer, the child's status), `out_sha256` (sha256 of stdout+stderr bytes), `last_line` (the output's last non-empty line, clipped) |
| `green` | GREEN ON A REAL DAY | `cmd`, `cmd_sha256` (must equal the red row's), `head_sha`, `red_head_sha`, `ancestor` (exit of `git merge-base --is-ancestor <red_head_sha> <head_sha>`, integer), `exit`, `out_sha256`, `last_line`, `day`, `day_proof` (`{ source: "sitting_reviews.jsonl", sitting_id, closed_at, reason }` from `day.mjs dayProof`) |
| `meter` | METER EQUAL | written by the SAME `green` invocation, around the child run: `meter: "daily_green.jsonl"`, `before_sha256`, `after_sha256`, `equal` (boolean, computed), `old_day: "2026-11-13"` (from `done.mjs:40`, fork F7), `old_day_green` (the latest meter row for that date, `daily_green.mjs` row shape `:413`), `green_sha` (the green row's `row_sha256`) |
| `loop` | the loop's artefacts | `files: [{ role, path, sha256 }]` hashed at write time (fork F6) |

**The writer refuses (exit 1, the file byte-unchanged, one line naming why):**
- `red` whose child exits 0 — a red-before that is not red is not a red-before;
- `red` whose `--cmd` is not a repo-relative `node <path>` with `<path>` tracked by `git ls-files` (fork F4);
- `green` with no `red` row for the key; with `head_sha == red_head_sha` (nothing was built between); with
  `ancestor != 0`; with a `--day` that `day.mjs dayProof` does not prove real (§4);
- any unknown flag; a `--rung`/`--clause` not matching `^[A-Za-z0-9._-]+$`;
- a broken chain on the existing file (it never appends onto a file `verify` would reject).
A `green` whose child exits non-zero, or whose meter moved, is NOT refused: it is RECORDED (the fact is kept; L9) and
the reader prints the clause RED with the reason. Refusal is for malformed input; measurement is for facts.

---

## 3 · CLAUSE R3 — HOW done.mjs READS IT (and the plan v3 list)

**The plan v3 rung list is NOT READABLE from the cloud.** It lives with the campaign outside this repository
(the runner's own files, `.claude/skills/runner/SKILL.md:71-85` name the campaign root as a laptop path). This seat
read none of it and does not guess its rungs, its clauses or their count.

**The shape the runner fills from it** — campaign-side, written by the campaign's own writer (`campaign.mjs`,
sole writer of its ledger per `.claude/skills/runner/SKILL.md:64`; which verb is fork F3), at
`<campaign>/rungs/plan_v3.json`:
```
{ "plan": "v3", "source": "<the plan v3 file name, relative to the campaign root>", "source_sha256": "<sha256 of its bytes>",
  "rungs": [ { "rung": "<id>", "clauses": [ { "id": "<id>", "witness": "node <repo path> <args>" } ] } ],
  "loops": [ { "loop": "<id>" } ] }
```
Keyed `<rung>:<clause>` — the same key the receipt rows carry.

**The reader (done.mjs `rungs()` replaced; the old body frozen as `rungsLegacy`, L9):**
1. no `--campaign` ⇒ `rungs UNREAD (no --campaign)` (unchanged, `:71`);
2. no `plan_v3.json`, unreadable, or `source_sha256` absent ⇒ `rungs UNREAD (no plan v3 list)`;
3. a plan holding zero clauses ⇒ `rungs UNREAD (the plan v3 list holds no clause)` — **never `0/0`** (fixes 0.3/0.4);
4. receipts read from `dressing-room/state/rung_receipts.jsonl` (laptop) or `--receipts <file>` (planted; the only
   source in the hermetic form — hermetic without `--receipts` ⇒ every clause UNREAD, the state file never opened);
5. the chain is walked first; a break at row k ⇒ every row from k on is REFUSED (`chain`);
6. per plan clause, the LATEST complete triple (red, green, its meter row by `green_sha`) decides:
   - **GREEN** ⇔ `red.exit ≠ 0` ∧ `green.exit = 0` ∧ `green.cmd_sha256 = red.cmd_sha256 = sha256(plan witness)` ∧
     `green.ancestor = 0` ∧ `green.head_sha ≠ red.head_sha` ∧ `green.day_proof` present ∧ `meter.equal` ∧
     `meter.before_sha256 = meter.after_sha256` ∧ `meter.old_day_green = false`;
   - **RED (<why>)** ⇔ a complete, well-formed triple that fails one of those;
   - **REFUSED (<why>)** ⇔ a row that is TYPED: `by ≠ "rung_receipt.mjs"`, a missing field, `exit` not an integer,
     a sha field not 64 hex, `cmd_sha256 ≠ sha256(cmd)`, `row_sha256` wrong, or any string `RED`/`GREEN` verdict field;
   - **UNREAD** ⇔ no row for the key, or a red with no green yet (`UNREAD (red recorded, no green)`).
7. a legacy `rungs/*.json` hand file present ⇒ each of its clauses prints REFUSED (`typed: hand contract`) and counts
   in nothing (fixes 0.5; fork F2);
8. the line: `rungs <g>/<n> GREEN · <u> UNREAD · <r> RED · <x> REFUSED · <lg>/<ln> loops` where n is the plan's clause
   count; `report` names every non-green key with its word and why.
`done.mjs` stays SOLE WRITER of NOTHING (`:5`) and stays ONE line in `line` mode (`scripts/organism_test.mjs:2716`).

---

## 4 · CLAUSE R4 — WHAT PROVES A DAY IS REAL

**His own learn day** is the day `day.mjs end` closed — the record is the sitting organ's close row:
- `day.mjs end` closes the sitting through its own door with reason `fulltime` — `scripts/day.mjs:146`;
- `sitting.mjs` appends that close as `{ kind: "sitting_review", sitting_id, closed_at, reason, opened_at,
  host_session_id, turns, banked, … }` to `sitting_reviews.jsonl` — `scripts/sitting.mjs:1062-1066`;
- `day.mjs` itself already reads that row as the day's "already closed" stamp — `scripts/day.mjs:132`
  (`close_reason === "fulltime" && dayOf(closed_at) === D`), and counts learn days from the same file —
  `scripts/day.mjs:184-192` (`closeCounts`);
- the start side: the sitting opened by `day.mjs start` (`scripts/day.mjs:114`, `by: "day start · <door>"`) from the
  `/learn` hook doors (`scripts/day.mjs:15-19`).

**Proposed reader**, a pure export in `day.mjs` (still sole writer of nothing):
`dayProof(D, { reviews, current }) → { real: true, sitting_id, closed_at, reason } | { real: false, why }` —
real iff a `sitting_review` row has `reason === "fulltime"`, `dayOf(closed_at) === D`, and `host_session_id` non-null
(a sitting bound to his `/learn` session). Which of the three readings counts is fork F1.

---

## 5 · CLAUSE R5 — THE ENV DOOR AND THE PORT CLASS (row 1053)

- The organ resolves its state dir as `ARSENAL_RUNG_STATE_DIR` when set, **and refuses to start if that path is
  not under `os.tmpdir()`**; otherwise `dressing-room/state`. The real-day read rides day.mjs's existing door
  `ARSENAL_SITTING_STATE_DIR` (`scripts/day.mjs:55`). (Fork F5: one door or two.)
- The witness child is spawned with the organ's env minus nothing; its bound is read from an owner, never typed
  (fork F8 names which).
- No witness here binds a port, names a live service, POSTs at a daemon or restarts anything: the sitting is never
  opened — its close row is PLANTED as a file under `os.tmpdir()`; git HEADs come from a throwaway `git init` repo
  under `os.tmpdir()`; the meter is a planted file. Every child wait is bounded by `spawnSync`'s owner-read bound.

---

## 6 · WITNESS CLAUSES — `ci/mrung/witness_mrung.mjs` (proposed)

Every plant is written by the witness itself (a node script) under `os.tmpdir()`; BASE = a hermetic copy of
`a18c167`, BUILD = a hermetic copy of the build. Each clause must read **RED on base, GREEN on build**, except the two
CARRIED GUARDS, which must read GREEN on both (a regression net, named as such, not counted as new).

| W | Plant | Base (a18c167) | Build |
|---|---|---|---|
| W1 TYPED-REFUSED | legacy `rungs/S1.json` with `"RED hand typed"`/`"GREEN hand typed"`/`"x"=="x"` + old day RED meter | `rungs 1/1 clauses` (measured) ⇒ RED | `REFUSED 1 (typed: hand contract)`, GREEN 0 |
| W2 NO-GUESSED-ZERO | `rungs/` empty, and a plan with `rungs: []` | `0/0 clauses` (measured) ⇒ RED | `rungs UNREAD (the plan v3 list holds no clause)` |
| W3 NO-RECEIPT-UNREAD | plan with 2 clauses, full receipt for 1 | the plan file read as a rung file ⇒ no `UNREAD` word ⇒ RED | `1/2 GREEN · 1 UNREAD` |
| W4 WRITER-MEASURES | `rung_receipt.mjs red` on a planted witness that exits 1 | organ absent ⇒ RED | one `red` row: `exit 1`, `out_sha256` = sha256 of its output, `head_sha` = the temp repo's HEAD |
| W5 RED-MUST-BE-RED | `red` on a witness that exits 0 | absent ⇒ RED | refused, receipt file byte-equal |
| W6 NO-TYPED-FLAG | `red … --exit 1`; `green … --verdict GREEN` | absent ⇒ RED | refused before any child runs (a planted witness that writes a marker file left no marker) |
| W7 REAL-DAY | `green --day D` with planted `sitting_reviews` (a) no row for D, (b) a `day-rollover` row, (c) a `fulltime` row with host | absent ⇒ RED | (a)(b) refused; (c) row with `day_proof.sitting_id` |
| W8 METER-EQUAL | the planted witness appends one line to the planted meter during `green` | absent ⇒ RED | meter row `equal:false`; done prints the clause `RED (meter moved)` |
| W9 CHAIN | node appends a well-shaped row with a wrong `prev_sha256` | absent ⇒ RED | `verify` exit 1; done prints `REFUSED (chain)` from that row on; `red` refuses to append |
| W10 SAME-WITNESS, MOVED HEAD | `green` at the same HEAD as `red`; `green` after the plan's witness changed | absent ⇒ RED | the first refused; the second `RED (witness changed)` |
| W11 HERMETIC-PLANTED | `done.mjs report --hermetic --campaign c --receipts r` | `--receipts` ignored ⇒ no GREEN ⇒ RED | the planted green clause reads GREEN; with no `--receipts`, every clause UNREAD and no state path opened |
| W12 ONE-WRITER | xray Q2 over the build: `rung_receipts.jsonl` has exactly one writer | the file has no writer ⇒ not in the graph ⇒ RED | one writer `rung_receipt.mjs`, `done.mjs` among readers |
| G1 OLD-DAY (carried) | meter with `2026-11-13 green:true` | not green (measured `:63-69`) | not green (`meter.old_day_green`) |
| G2 ONE-LINE (carried) | `done.mjs line --hermetic` | one `DONE · ` line | one `DONE · ` line containing `rungs UNREAD` |

## 7 · MUTANTS — `ci/mrung/run_mutants_mrung.mjs` (one per clause; each must turn its W RED)

| M | Mutation (on the build) | Kills |
|---|---|---|
| M1 | reader accepts a string `green_real_day` matching `/^GREEN\b/` again | W1 |
| M2 | an empty plan returns `{ read: true, g: 0, n: 0 }` | W2 |
| M3 | a clause with no receipt counts RED instead of UNREAD | W3 |
| M4 | the writer records `exit: 1` as a constant instead of the child's status | W4 (witness exits 2 in a sub-plant) |
| M5 | the `exit === 0` refusal in `red` is removed | W5 |
| M6 | unknown flags are ignored instead of refused | W6 |
| M7 | `dayProof` drops the `reason === "fulltime"` test | W7(b) |
| M8 | `after_sha256` is taken before the child runs | W8 |
| M9 | the reader skips the chain walk | W9 |
| M10 | the `head_sha ≠ red_head_sha` refusal is removed | W10 |
| M11 | `--receipts` is parsed but the hermetic branch still returns UNREAD for all | W11 |
| M12 | `done.mjs` gains an `appendFileSync` of the receipt file | W12 |

---

## 8 · FORKS — for the architect

- **F1 · what is a real day.** (a) any sitting open that IST day (`daily_green.mjs:134-152`, `day.mjs:190-192`);
  (b) a `fulltime` close (`day.mjs:132`/`:146`, `sitting.mjs:1062`) with a bound host; (c) (b) plus his own
  post-match RESULT line (`day.mjs:203`). **Recommend (b)** — it is the one record only `day.mjs end`, on his meaning,
  writes; (a) counts a rollover close, (c) waits on an answer the day law says is never waited on (`day.mjs:126`).
  *Decides it:* on his laptop, count IST days per reading from `sitting_reviews.jsonl` and `post_match/`.
- **F2 · the legacy hand contract** (`done.mjs:58-62`). (a) REFUSED and counted in nothing; (b) read alongside,
  marked LEGACY, counted apart; (c) silently dropped. **Recommend (a)** (row 1058: never a guessed number; L9 keeps
  the body as `rungsLegacy`). *Decides it:* whether any `<campaign>/rungs/*.json` exists on his laptop today.
- **F3 · who writes `plan_v3.json`.** (a) `campaign.mjs` (a new verb, campaign-side); (b) `rung_receipt.mjs plan
  --from <plan v3 file>` writing into the campaign dir; (c) the runner by hand. **Recommend (a)**: D5 A keeps
  campaign data off main, and a hand is the typed door again. *Decides it:* `node campaign.mjs` verb list on the laptop.
- **F4 · which commands may be a witness.** (a) `node <tracked path> …` only; (b) any command; (c) a path under
  `ci/` or a `scripts/*.mjs selftest`. **Recommend (a)**. *Decides it:* the witness strings in plan v3.
- **F5 · the state-dir door.** (a) a new `ARSENAL_RUNG_STATE_DIR`, honoured only under `os.tmpdir()`; (b) reuse
  `ARSENAL_SITTING_STATE_DIR`; (c) in-process fixture only (the `daily_green.mjs` pattern, header "ONE ROOT
  OVERRIDE"). **Recommend (a)**: the witness must spawn the CLI, which (c) cannot reach, and (b) re-points another
  owner's files.
- **F6 · loops.** (a) loops ride the same file as `kind: "loop"` rows whose hashes the organ takes; (b) loops keep
  `done.mjs:85-92` and only the typed `ladder_sha256` is replaced; (c) loops are a later unit, printed UNREAD.
  **Recommend (a)**, one file one writer. *Decides it:* the loop list in plan v3.
- **F7 · the old recorded day.** (a) keep the constant `done.mjs:40` and record it on each meter row; (b) the plan
  file names it; (c) drop the check. **Recommend (a)** until a ruling moves it.
- **F8 · the witness child's bound.** (a) read from `sitting.mjs ownerTimeoutMs` (`scripts/sitting.mjs:219`);
  (b) a new exported constant in `rung_receipt.mjs`, measured by its PROOF; (c) none. **Recommend (b)** —
  `ownerTimeoutMs` is keyed by the sitting's owners, not a witness. *Decides it:* the slowest plan v3 witness, timed.
- **F9 · tracked or ignored.** `daily_green.jsonl` is TRACKED; `sitting_reviews.jsonl` is ignored (`.gitignore:328`).
  The receipt carries a day and a sitting id. (a) ignore it (data private); (b) track it (the neutral machine can
  read real receipts). **Recommend (a)** — the hermetic form reads planted receipts only. *Decides it:* his ruling
  (code public, data private, 14 Aug 2026).
- **F10 · the registry.** A new state file may need its lane row in `scripts/registry.mjs` (the kickoff's
  "NEVER BORN" registry line). (a) add a row in the build; (b) a follow-on unit. **Recommend (a)** if the registry
  lists every state file; named, not measured here.

## 9 · NAMED, NOT GUESSED

| Fact | Why not reachable here | What measures it on his laptop |
|---|---|---|
| The plan v3 rung list, its rungs, clauses, witnesses | outside this repository (campaign root) | `ls <campaign>/` and the plan file named in CURRENT.md's boot order |
| Whether `<campaign>/rungs/*.json` or `loops/*.json` exist today | campaign-side | `ls <campaign>/rungs <campaign>/loops` |
| The live `done.mjs report` output (non-hermetic) | reads live state | `node scripts/done.mjs report --campaign <campaign>` |
| How many fulltime-closed days exist (F1) | `sitting_reviews.jsonl` is ignored, not in the clone | a read-only node count over it by `day.mjs closeCounts` |
| Whether the 2026-11-13 meter row reads RED | the meter rows were not opened (state content is not printed here) | `node scripts/done.mjs report --campaign <c>` old-day field |
| `campaign.mjs` verbs (F3) | campaign-side | `node campaign.mjs` usage |
| The slowest witness runtime (F8) | needs the plan witnesses | time each `red` run |
| Whether the registry demands a row (F10) | `registry.mjs` rules not traced in this seat | `node scripts/registry.mjs selftest` after planting the file |

## 10 · FILES A BUILD WOULD TOUCH

- `scripts/rung_receipt.mjs` — NEW, sole writer of `dressing-room/state/rung_receipts.jsonl`, with `selftest`.
- `scripts/done.mjs` — `rungs()` re-read from receipts + plan (old body frozen `rungsLegacy`), `--receipts` flag,
  the stale `:38` comment corrected to `daily_green.mjs:422`.
- `scripts/day.mjs` — NEW pure export `dayProof`.
- `package.json` — `rung_receipt.mjs selftest` joins a suite chain (the coverage law, `package.json`
  `_selftest_coverage_law`).
- `ci/mrung/witness_mrung.mjs`, `ci/mrung/run_mutants_mrung.mjs`, `ci/mrung/PROOF.md`.
- Beyond them, each a fork: `.gitignore` (F9) · `scripts/registry.mjs` (F10) · campaign-side `campaign.mjs` (F3,
  not in this repo) · `scripts/organism_test.mjs` (only if the architect wants the hermetic W11 in the suite's
  `done()` section).

## 11 · CHECK RUNS (the neutral machine)

Read signed-out through the public API (`curl https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`), 19 Nov 2026:

| sha | workflow run | check run | conclusion | B1 verdict (annotation) |
|---|---|---|---|---|
| `fa71a3fd233595223d9f3eefe4d704e390797698` (this spec's first push) | `44427768810` suite | `135236943802` npm test · node 22 | success | `GREEN` — head fa71a3f vs base a18c167, "no member red that is not red at the merge base" |
| same | same | `135236944439` npm test · node 24 | success | — |

The push that carries this table is judged by the same workflow; its run is named in the seat's final message, not here
(a file cannot carry the verdict of the commit that writes it).
