# unit mdayv · SPEC — the day meter judges a day after that day is over (forks rows 1195 / 1196 (2))

Spec seat, cloud, 20 Nov 2026. Builds nothing. Base: `origin/main` = `5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90`
(measured `git rev-parse FETCH_HEAD` after `git fetch origin main`, 20 Nov 2026). mmeter read whole at
`origin/claude/mmeter-build` = `ad2845e5a8df7d57f2929172a9017057e1992514`, `origin/land/mmeter` = `e83537b861266137ea454ff007c0ffd04a58d578`
(one commit over 5759cce: `git log --oneline origin/main..origin/land/mmeter` → `e83537b unit mmeter …`).
Every line number below is at 5759cce unless it says `@e83537b`. Ledger: `ci/mdayv/LEDGER.jsonl`.

## 0 · HEADLINE

A new mode of the meter's own organ, `node scripts/daily_green.mjs final`, writes the ONE **final** read of every IST day
that is over and has no final row yet, by code, at the first start after it. Every other row the meter writes is marked
**provisional**. A final row is written once per day and never followed by another row for that day. Two carriers run the
mode: `day.mjs start` (his /learn) and one new step of the conductor's MORNING chain, right after `dayclose-prev`. It is
read-only on every file but the meter's own ledger: it closes no sitting, ends no day, fires no judge, settles nothing,
arms nothing. The day end stays his words alone (his word 274, row 1195 (2), the two-act law of row 1042). The build waits
for mmeter on main (F8 A) because they share four places in `scripts/daily_green.mjs` (§3).

## 1 · MEASUREMENTS (command → last line, 20 Nov 2026, cloud, LF tree of 5759cce)

| # | Question | Command | Last line / answer |
|---|---|---|---|
| M1 | the meter row writer + its sole-writer header | `sed -n 4p scripts/daily_green.mjs` | `//   SOLE WRITER of dressing-room/state/daily_green.jsonl (SOLE WRITER: scripts/daily_green.mjs)` |
| M2 | its ONE write | `grep -n "appendFileSync(ledger" scripts/daily_green.mjs` | `422:    appendFileSync(ledger, JSON.stringify({ at: now.toISOString(), ...row }) + "\n");` |
| M3 | the row shape: no provisional / final field exists | `sed -n 413p scripts/daily_green.mjs` | `const row = { date: day, study: …, study_why: sd.why, green: …, greens, reds, clauses };` |
| M4 | the identity rule (same facts → nothing appended) | `sed -n 355p scripts/daily_green.mjs` | `const identity = (row) => JSON.stringify({ date: row.date, study: row.study, clauses: row.clauses });` |
| M5 | "the latest row for a date counts" | `sed -n 356,360p scripts/daily_green.mjs` | `for (const r of rows) if (…) m.set(r.date, r);   // append order: the last row for a date wins` |
| M6 | the IST day boundary of the meter | `sed -n 94,96p scripts/daily_green.mjs` | `IST_MS = 5.5 * 3600000` · `todayIst(now)`; a plain run reads TODAY (`day = date \|\| today`, :386) |
| M7 | the IST boundary of the start | `sed -n 73p scripts/day.mjs` | `istDay = (d) => new Date(d.getTime() + 330 * 60000)…` (same boundary, 00:00 IST) |
| M8 | the IST boundary of the morning chain | `sed -n 65,78p scripts/conductor.mjs` | `chainDay(mode)`: token / slot / clock; MORNING slot `CHAIN_SLOT.morning = "09:15"` (:59); `chain-1` = the slept day (postmatch.mjs:391) |
| M9 | who RUNS the meter in this repo | `git grep -n "daily_green" -- scripts .claude hooks setup` | no spawner: only readers — `done.mjs:43` (path), `rung_receipt.mjs:48` (file name), comments. No skill, hook or conductor step runs it. |
| M10 | readers of the meter rows | same grep + `git show e83537b:ci/witness/mmeter/witness_meter.mjs` | `done.mjs:69 oldDayRed` (last row of `OLD_RECORDED_DAY`, :46 = `2026-11-13`, must read `green === false`) · `rung_receipt.mjs:324-330` (meter sha before/after a green witness run must be EQUAL; old day's last `green`) · mmeter `witness_meter.mjs day11` (LATEST date's LATEST row) |
| M11 | the state line reads the meter? | `grep -n "daily_green" scripts/state.mjs` | nothing (the meter's header :71 names state.mjs "a future field") |
| M12 | the morning line | `sed -n 36p scripts/night.mjs` | `line  (read-only: the ONE morning line, silent when no night was armed)` — reads `night_log.jsonl` only, never the meter |
| M13 | any card reads the meter? | `git grep -n "daily_green" scripts/captains_call.mjs` | nothing |
| M14 | what a start knows about the previous day | `sed -n 102,123p scripts/day.mjs` | `sitting.json` (a sitting of an EARLIER day still open is closed first, reason `day-rollover`, :108-111), `usage_tap need` (:115), `night.mjs close --by learn-start` (:119). Nothing of the meter. |
| M15 | a start refuses when | `sed -n 103,104p scripts/day.mjs` | `ARSENAL_ORGAN === "1"` → silent; no hook-payload session id → `nothing opened` |
| M16 | the morning step that closes the slept day | `sed -n 106p scripts/conductor.mjs` | `{ id: "dayclose-prev", at: "07:05", args: ["scripts/postmatch.mjs", "autoclose", "--date", "chain-1", "--anchor", "morning"], … }` — it COMPILES the notes and fires the close's judge (postmatch.mjs:380-395); the next step is `physio` :107 |
| M17 | the conductor pins MORNING's shape | `grep -n "DAYCLOSE (mclose" scripts/conductor.mjs` | `1440: ok("DAYCLOSE (mclose, row 919 (A)) — the MORNING closes the SLEPT day: dayclose-prev, … right after the three daemons and before physio …"` |
| M18 | clauses 9-11 on a past date | `sed -n 292,338p scripts/daily_green.mjs` | daemons / suite / pushed read the machine NOW and print `(as of now)` when `day !== today` |
| M19 | clause 3 reads the note by its row's `day` | `sed -n 207-219p scripts/daily_green.mjs` | `(r.day \|\| istDay(r.ts \|\| r.at)) === day` — a note compiled after midnight that carries `day: D` still counts for D |
| M20 | the meter ledger is TRACKED | `git ls-files dressing-room/state/daily_green.jsonl` | `dressing-room/state/daily_green.jsonl` (a cloud clone's SessionStart writing it would dirty a tracked file) |
| M21 | a cloud session is detectable | `env \| grep -c "^CLAUDE_CODE_REMOTE="` in this seat | `1` (unverified on his laptop: N4) |
| M22 | the meter selftest at base | `node scripts/daily_green.mjs selftest` | `daily_green selftest: 75 passed, 0 failed` (20 Nov 2026) |
| M23 | the night selftest at base | `node scripts/night.mjs selftest` | `night selftest: 22 passed, 0 failed` (20 Nov 2026) |
| M24 | the suite at base, hermetic, after `npm ci --ignore-scripts` | `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` | `organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)` (exit 2, 20 Nov 2026). The one red is pre-existing: `orphaned: deck_lint, home_pin, probe, study_scope` (the selftest-coverage law). Bare checkout before `npm ci`: `141 passed, 4 failed` (20 Nov 2026) |
| M25 | `day.mjs` has no selftest verb | `node scripts/day.mjs selftest` | prints its usage line (its proof is `ci/mday/witness_mday.mjs`, `ci/mfac/witness_mfac.mjs`) |

THE RED-BEFORE (row 1196, the runner, his laptop, 20 Nov 2026, counts only — taken as given, not re-measured here):
rows for 18 Nov at 10:18Z and 19 Nov at 09:46Z; compiled notes at 16:30Z and 18:06Z; neither day read again, so clause 3
stands RED on the meter though the note exists. M9 says why: nothing in the repo re-runs the meter for a day that is over.

## 2 · THE CODE PATH (proposed, cut against main AFTER mmeter lands — F8 A)

### 2.1 · The meter (`scripts/daily_green.mjs`, its sole writer — the ONLY file that writes the ledger)

1. **The read mark.** Every row carries `read: "provisional" | "final"`. Every run that is not `final` mode writes
   `"provisional"`. `identity()` (:355) is unchanged: `read` stays out of it, so a provisional re-run on the same facts
   still appends nothing (ONE ROW PER DATE holds).
2. **The line.** The line keeps its head byte for byte (`DAILY GREEN <D> IST · <n>/11 · streak …`, the shape mmeter's
   plant regex `^DAILY GREEN \d{4}-\d{2}-\d{2} IST · 5\/11 · ` reads, `ci/witness/mmeter/witness_meter.mjs:115 @e83537b`)
   and gains ONE trailing token: `· read provisional` or `· read FINAL`. The head is never moved, so every reader that
   parses `· (\d+)/11 ·` (`ci/witness/mmeter/plant_day.mjs:88 @e83537b`) reads the same number.
3. **The mode `final [--through YYYY-MM-DD]`.** `--through` defaults to the IST day before `todayIst(now)` (a day is
   over only when its IST midnight has passed — M6/M7). It walks the days `D` from the first day after the newest final
   row (or the FLOOR, F2) to `--through`, oldest first, and for each `D` with no final row yet (F2 for which days):
   runs the SAME `witness({ date: D, now })`, and appends the row with `read: "final"` and `final_at: now` even when its
   identity equals the last provisional row (the final row is a fact of its own). A day that already has a final row is
   skipped and its line is printed with `read FINAL`. `--through` later than yesterday is REFUSED (exit 1, nothing written):
   a day not yet over has no final read.
4. **Written once, never overwritten.** Once a final row exists for `D`, the organ appends NO later row for `D` from any
   mode: a plain `--date D` prints the final row's line (`read FINAL`) and appends nothing. (`latestByDate` then returns
   the final row with no edit to it, because nothing is appended after it — the function mmeter exports stays byte-equal.)
5. **Clauses 9-11 in a final read** (F3): carried from the newest provisional row of `D` when one exists (they measured
   the machine ON `D`), each `why` suffixed `(carried <HH:MM> IST)`; with no provisional row of `D`, read now with the
   existing `(as of now)` mark.
6. **Read-only.** `final` touches no file but the ledger: no spawn but `git` (the existing `gitFacts`, plus mmeter's
   `codeSha` once it lands), no model, no network, no env re-point (the ONE root override stays the in-process fixture).
7. **Cloud guard** (F6): with `CLAUDE_CODE_REMOTE` set, `final` writes nothing and prints `DAILY GREEN · final: cloud
   session — the final read is his laptop's` (exit 0).
8. **Exit of `final`** (F7): 0 when every day it was asked for has a final row after the run (written now or before),
   1 when the ledger is unreadable or `--through` is refused. It does NOT use mmeter's `exitOf` (a red final day is a
   measured fact, not a failed run). Plain and `--date` modes keep mmeter's exit unchanged.

### 2.2 · The carriers (each through the meter's own CLI — never an import of its writer)

- **C-start · `scripts/day.mjs start`**: ONE more `ownerRun("daily_green.mjs", ["final"])`, AFTER the rollover close
  (:108-111) and AFTER `closeNight()` (:119), its last line riding the start's output as one line (`if (r.meterFinal)
  console.log(…)` beside :236). It runs on the ok and the not-ok path alike (a start whose sitting did not open still
  knows yesterday is over). Never waits on the judge the rollover close fired (F4 names that race).
- **C-morning · `scripts/conductor.mjs` MORNING**: ONE step `{ id: "meter-final", at: "07:06", args:
  ["scripts/daily_green.mjs", "final"] }` immediately after `dayclose-prev` (:106) and before `physio` (:107), no `needs`
  (a failed close must not stop the read, and the read must not stop the chain). Its budget is the conductor's default.
  The two carriers are idempotent against each other by 2.1 (4): the first writes, the second appends nothing.
- **NOT a carrier: SessionStart (`turn_hook.mjs start`)** — it fires in every session, the runner's and the cloud seats'
  included (it fired in this seat, 20 Nov 2026), and the ledger is tracked (M20). Named as fork F1 (c).

### 2.3 · How every reader tells provisional from final

| Reader | Today (M10-M13) | With mdayv |
|---|---|---|
| the meter's own line | no mark | trailing `· read provisional` / `· read FINAL` |
| `done.mjs oldDayRed` (:69) | last row of 13 Nov | unchanged; F2 FLOOR keeps `final` from ever writing a 13 Nov row, so its answer cannot move |
| `rung_receipt.mjs green` (:324-330) | meter sha equal across a witness run | unchanged; no carrier runs inside a witness run (the witness runs are spawned by the receipt, not by a start) — N6 |
| mmeter `witness_meter.mjs day11` | LATEST date's LATEST row | unchanged code; on a morning after a final read the LATEST date is yesterday's FINAL row (F5 names whether day11 should prefer `read: "final"`) |
| the state line (`state.mjs`) | does not read the meter | unchanged by this unit (F9) |
| the morning line (`night.mjs line`) | does not read the meter | unchanged by this unit (F9) |
| cards | none read the meter | unchanged; a final RED day files NO card (L7: nothing needs his word) |

## 3 · LINES MMETER ALSO TOUCHES (no mdayv edit to any of them before mmeter is on main)

`git diff origin/main origin/land/mmeter -- scripts/` (20 Nov 2026) touches `scripts/daily_green.mjs`, `scripts/done.mjs`,
`scripts/organism_test.mjs`. mdayv's overlaps, all in `scripts/daily_green.mjs`:

| mdayv edit | line @5759cce | mmeter's edit there |
|---|---|---|
| header: a THE FINAL READ paragraph + the `final` CLI line | :68-72 | inserts THE STRICT EXIT + THE CODE SHA paragraphs after :70 and rewrites the CLI line :72 |
| the row gains `read` (+ `final_at` on a final) | :413 | the same statement gains `code_sha` (split over two lines) |
| the write predicate (a final appends past identity) | :421 | none at :421, but it is inside the hunk at :433 @e83537b |
| `main()` gains the `final` mode and its exit | :750-761 | adds `process.exit(exitOf(out.row))` after :760 |
| selftest: the mdayv block | before `HERMETIC + ONE WRITE` (:741) | inserts its STRICT EXIT + CODE SHA block at the same anchor |

No mdayv edit touches `latestByDate` (:356, mmeter exports it) or `done.mjs` (mmeter exports `oldDayRed`) or
`organism_test.mjs` (mmeter adds the `clauses` member; mdayv's clause witness rides it with NO edit — its header says
"Later units add their witness file and no edit here", `organism_test.mjs @e83537b` THE CLAUSE WITNESSES).
The selftest's ONE-WRITE law (`daily_green.mjs` near :740, "the only write call is the ledger append") must still hold:
the `final` path reuses the single `appendFileSync(ledger,` call.

**THE REBASE.** The build cuts from `origin/main` the moment main carries `e83537b`'s tree (check: `git merge-base
--is-ancestor <mmeter land commit> origin/main` exit 0, or `git diff origin/main e83537b -- scripts/daily_green.mjs` empty).
Its plan is re-taken at that main: every `@5759cce` line in §2 / §3 is re-measured by the same `grep -n` commands (the
anchors are strings — `const row = { date: day`, `appendFileSync(ledger,`, `const out = await witness({ date })`,
`// ── HERMETIC + ONE WRITE ──`), never by the numbers here. If mmeter has not landed when the build is launched, the build
does not start (F8 A).

## 4 · THE WITNESSES

Two kinds (row 1184 (1)): the UNIT witness `ci/mdayv/witness_mdayv.mjs` + a 40-hex `ci/mdayv/BASE` (the base the build
cuts from — the main that carries mmeter), honouring `--org <dir>` and `--base-org <dir>`, every clause RED at base and
GREEN at head; and the clause witness `ci/witness/mdayv/witness_dayv.mjs` with a `plants` mode printing
`CLAUSE <id> GREEN|RED · k/n plant(s)` per clause and ending `PLANTS mdayv · k of n plant(s) as expected` (mmeter FK4).
Every plant: a copy of `<org>/scripts` + a planted `dressing-room/state` under `os.tmpdir()` (prefix `mdayv-wit-`), a
planted clock (the meter's in-process fixture is not reachable from a CLI, so the plant drives the clock through the
CHILD's real time: every planted record is dated relative to the child's NOW — yesterday = `todayIst - 1` — exactly as
`plant_day.mjs @e83537b` does). Planted git repos with `core.autocrlf=false`. Never reads his live state.
THE PORT CLASS (row 1053): no port bound, no service named, nothing POSTed, nothing restarted; every child `spawnSync`;
no typed timeout, budget or size. `day.mjs start` is driven with `ARSENAL_SITTING_STATE_DIR` and
`ARSENAL_NIGHT_STATE_DIR` (their existing seams, day.mjs:68 · night.mjs:47) pointed into the plant and a planted
`usage_tap` seam (N5); no sitting daemon is up, so the sitting door is the local one (day.mjs header, F10).

| Clause | Plant | RED at base (why) | GREEN at build |
|---|---|---|---|
| **V1 FINAL-AT-START** — the start after `D` writes `D`'s final read | yesterday `D`: a sitting opened+closed, reps, a provisional meter row with clause 3 RED written at 15:48 IST of `D`, a compiled note row `{day: D}` at 22:00 IST of `D`; run `day.mjs start` (planted session id) | no row of `D` carries `read: "final"`; `D`'s latest row has notes RED (nothing re-reads it) | exactly one row of `D` with `read: "final"`, its clause 3 GREEN; the start's output carries ONE line ending `read FINAL` |
| **V2 MORNING CARRIER** — the chain carries it | `import { MORNING }` from `<org>/scripts/conductor.mjs` | no step runs `daily_green.mjs final` | the step right after `dayclose-prev` is `scripts/daily_green.mjs final`, with no `needs` |
| **V3 READ-ONLY** — closes nothing, fires nothing | V1's plant plus an OPEN sitting of `D` in `sitting.json`; run `daily_green.mjs final` alone | (`final` is not a mode at base: the run writes a provisional TODAY row — RED by "no final row of D") | every planted file but `daily_green.jsonl` byte-equal (sha256 before/after: `sitting.json`, `sitting_reviews.jsonl`, `gaffer_grade_queue.jsonl`, `post_match/`, `night_log.jsonl`, `captains_call.json`); the open sitting stays open; static: no `spawn`/`exec` of anything but `git` reachable from the final path, no `claude`, no `fetch(` |
| **V4 ONCE** — written once, never overwritten | after V1's final row: run `final` again, then `--date D` | (base: no final row to keep) | no row appended by either; `--date D`'s line ends `read FINAL`; the final row is the last row of `D` |
| **V5 PROVISIONAL MARK** — a mid-day read is never the verdict | a plain run on a planted TODAY | rows carry no `read` field; the line has no mark | the row carries `read: "provisional"`; the line ends `· read provisional` and still matches `^DAILY GREEN \d{4}-\d{2}-\d{2} IST · \d+\/11 · ` |
| **V6 SKIPPED DAYS** — two days with no start | provisional rows for `D-2` and `D-1`, no start on either, the newest final row `D-3`; one start on `D` | no final row for `D-2` or `D-1` | final rows for `D-2` then `D-1`, oldest first; none for a day before the FLOOR; none for `2026-11-13` (`done.mjs oldDayRed` answer byte-equal before/after) |
| **V7 NOT BEFORE IT IS OVER** — no final read of today | `final --through <today>` | (base: writes a provisional today row — RED by "a today row was written") | exit 1, REFUSED, ledger byte-equal |
| **V8 CLOUD** (only if F6 A) | `CLAUDE_CODE_REMOTE=1`, V1's plant, `final` | (base writes a row) | ledger byte-equal, one line naming the cloud |

Mutants (`ci/mdayv/run_mutants_mdayv.mjs`, one per clause, each must turn exactly its clause RED, control GREEN):
M-V1 drop the `ownerRun("daily_green.mjs", ["final"])` from `start` · M-V2 delete the `meter-final` step · M-V3 let
`final` call the sitting close door (`closeDoor`) on an open sitting of `D` · M-V4 drop the "a final row exists → append
nothing" guard · M-V5 write `read: "final"` on a plain run · M-V6 walk only `--through` (one day) instead of the gap ·
M-V7 accept `--through <today>` · M-V8 drop the `CLAUDE_CODE_REMOTE` guard.

The meter's own selftest gains the same seven laws in-process (fixture clock), and the conductor's selftest pin at
`conductor.mjs:1440` is extended to name `meter-final` right after `dayclose-prev` (its EVENING pin :1410 is untouched).

## 5 · FORKS (the architect rules; recommendation first)

- **F1 · which starts carry the final read.** (a) `day.mjs start` only · (b) the conductor MORNING only · (c) both,
  idempotent · (d) (c) plus SessionStart. **Recommend (c)**: a skipped day (no /learn next morning) still gets its read
  at the morning chain; a laptop asleep at the chain's slot still gets it at /learn. (d) is refused by M20 (tracked
  ledger, every session fires SessionStart). Decides it: N1 (how often the MORNING chain actually ran on the days he
  started, his laptop's `conductor` log) — if the chain runs every morning, (b) alone suffices.
- **F2 · which days a final read covers.** (a) only yesterday · (b) every day from the newest final row (or the FLOOR) to
  yesterday · (c) (b) but only days that have a provisional row or are study days. FLOOR options: (i) the IST day the
  unit lands · (ii) `2026-11-14` (the day after `OLD_RECORDED_DAY`) · (iii) none. **Recommend (b)+(i)**: two skipped days
  are both judged, no day older than the code that judges it is rewritten, and 13 Nov can never move (`done.mjs`). (c)
  would leave a non-study day with no final read, which the streak (`streakFrom` :363, "a day with no row at all breaks
  it") reads as a break. Decides it: whether he wants 18 and 19 Nov re-read finally (they predate (i)) — his word, or (ii).
- **F3 · clauses 9-11 in a final read.** (a) carried from `D`'s newest provisional row, read now when none · (b) always
  read now `(as of now)` · (c) N-A in a final read. **Recommend (a)**: they measured the machine on `D`; the morning after
  says nothing of `D`'s daemons. Decides it: whether a provisional row of a study day exists on most days (N2).
- **F4 · the settle race.** The rollover close inside `start` (:108-111) and `dayclose-prev` both fire a judge and a
  compile whose writes may land AFTER the final read runs. (a) the final read runs anyway (the ruling: "at the first
  start after it") · (b) a day whose `post_match/<D>.md` is absent or whose sitting closed less than the close's own budget
  ago stays provisional until the next start, final at the second start at the latest · (c) the final read waits on the
  close in the same process. **Recommend (a)** with the carrier ORDER of §2.2 (after the close, after the chain's close
  step), because (c) makes a read wait on a judge and (b) can leave a day un-final for a whole day. Decides it: N3 (on how
  many days a compile or settled row of `D` was written after `D`'s first next start).
- **F5 · should mmeter's `day11` prefer the final row.** (a) no edit (it reads the LATEST row; after a final read that
  is the final row) · (b) after mmeter lands, `day11` reads the newest `read: "final"` row. **Recommend (a)** in this unit
  (no mmeter byte before it is on main, and none needed); (b) is a later unit's fork.
- **F6 · the cloud guard.** (a) `CLAUDE_CODE_REMOTE` set ⇒ `final` writes nothing · (b) no guard (cloud starts do not run
  `/learn`) · (c) guard on `ARSENAL_ORGAN` only. **Recommend (a)**: a cloud clone's ledger is stale and tracked. Decides
  it: N4 (that the variable is unset in his laptop sessions).
- **F7 · the exit of `final`.** (a) 0 when every asked day has a final row, 1 unreadable/refused · (b) mmeter's `exitOf`
  of the newest final row. **Recommend (a)**: the chain must not count a red DAY as a failed STEP.
- **F8 · when the build cuts.** (a) after mmeter is on main, from that main · (b) now from `land/mmeter e83537b`, rebase
  later. **Recommend (a)** — the ruling's own words ("edits nothing of it before mmeter is on main").
- **F9 · the state line and the morning line.** (a) untouched in this unit · (b) the state line gains `meter: D FINAL n/11`
  · (c) `night.mjs line` gains it. **Recommend (a)**: neither reads the meter today (M11, M12); adding a reader is a new
  surface, and L7 says nothing here needs his word.
- **F10 · the line mark's wording.** (a) trailing `· read provisional` / `· read FINAL` · (b) a mark after `IST ·`.
  **Recommend (a)**: (b) breaks mmeter's plant regex (§2.1 (2)).

## 6 · NAMED, NOT GUESSED (cloud cannot reach; what would measure it on his laptop)

- **N1** what wrote the 18 / 19 Nov afternoon rows (no repo spawner, M9): his Task Scheduler (`schtasks /query /fo csv |
  findstr /i green`) and the runner's own logs.
- **N2** on how many study days a provisional row exists at all: `node -e` over `daily_green.jsonl`, rows per date, counts only.
- **N3** on how many days a compile (`compiled_notes.jsonl` row with `day: D`) or a `settled` row was written after D's
  first next `day.mjs start` (its `sitting_reviews.jsonl` open stamp) or after 07:06 IST of D+1: counts only.
- **N4** `CLAUDE_CODE_REMOTE` is unset in his Windows Claude Code sessions: `node -e "console.log(!!process.env.CLAUDE_CODE_REMOTE)"` in a /learn session.
- **N5** (measured in the cloud, partly) `usage_tap.mjs` reads `ARSENAL_CAMPAIGN_ROOT` (`campaignRoot`, :63) and its own
  selftest points `ARSENAL_CALL_STATE_DIR` into a temp dir (:270), so a start plant can seat both under `os.tmpdir()`;
  whether `need` reaches anything else live on his laptop is not read here: `node scripts/usage_tap.mjs need` with both set.
- **N6** that no campaign tool runs `day.mjs start` or the MORNING chain INSIDE a `rung_receipt green` witness run (the
  meter-equal check would then see a final row): the campaign's own tools (not in this repo).
- **N7** whether the conductor MORNING task ran on 19 and 20 Nov (the brief says nothing re-read 18 / 19 Nov; the chain's
  `dayclose-prev` would have run at 07:05 on 19 and 20 Nov): `node scripts/pulse.mjs report` / the conductor log.
- **N8** the brief says 13 Nov "flipped green only because a read happened the next morning"; `done.mjs:46` holds 13 Nov
  as the day that must still read RED (`green === false`). Both can be true (clause 3 flipped, the day stayed red) — the
  13 Nov rows' `clauses[2].status` and `green`, counts only, would say.

## 7 · FILES A BUILD WOULD TOUCH

`scripts/daily_green.mjs` (the mode, the mark, its selftest) · `scripts/day.mjs` (one owner call in `start`, its header)
· `scripts/conductor.mjs` (one MORNING step, its selftest pin) · `ci/mdayv/BASE` · `ci/mdayv/witness_mdayv.mjs` ·
`ci/mdayv/run_mutants_mdayv.mjs` · `ci/mdayv/PROOF.md` · `ci/mdayv/LEDGER.jsonl` · `ci/witness/mdayv/witness_dayv.mjs`.
Beyond them, each a fork: `ci/mfac/witness_mfac.mjs` (its W5.4 / W9 read `day.mjs start`'s lines — if a new line breaks
them, the witness is a frozen unit's; F11: (a) the new line is printed only when a final row was written or confirmed and
matches neither `NIGHT ` nor `pool:`, so mfac stays untouched · (b) edit mfac's witness. Recommend (a)) ·
`tasks_expected.json` (a new MORNING step needs no new task: the chain is one task — re-check at build) · `package.json`
(no new selftest: `daily_green.mjs selftest` is already in `organism:selftest`, M24's law).

## 8 · CI (the neutral machine)

Read through the public API with curl (`/commits/<sha>/check-runs`, no token) and `NODE_USE_ENV_PROXY=1 node
scripts/ci_verdict.mjs <full sha>`, 20 Nov 2026. Tip `93aa206fd2f2d52fc3fbf98bc66b3fe90a048441`:
```
136153574158 npm test · node 22 completed success
136153573782 npm test · node 24 completed success
ci_verdict 93aa206 GREEN — npm test · node 22: GREEN (base 5759cce · 0 new red · 1 base red · 126 live) [run 136153574158] | npm test · node 24: GREEN (base 5759cce · 0 new red · 1 base red · 126 live) [run 136153573782] (3 calls)
```
The commit carrying this section adds only these lines and a ledger row; its own runs are judged by its push.

Effort receipt (the brief's last step), 20 Nov 2026: `node campaign-2026-09/tools/effort_receipt.mjs --fleet mdayv --seat 00
--model claude-opus-5-5` → `Error: Cannot find module '…/campaign-2026-09/tools/effort_receipt.mjs'` (exit 1); this
repository carries no `campaign-2026-09/`, so nothing was written under it.
