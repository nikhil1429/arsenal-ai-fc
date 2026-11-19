# mwit · A WITNESS FOR EVERY CLAUSE OF PLAN v3 — SPEC (forks rows 1141 (2) / 1142 (3), 19 Nov 2026 UTC)

**Headline (19 Nov 2026, measured at the cut):** the daily meter's exit is **0 on a day that reads 5 of 11**
(`node ci/mwit/plant_day.mjs 5` → `meter exit 0`), so today nothing in this repo turns a red day into a red exit. All 30
clauses of the table are designed below as ONE command each with ONE exit law; each names its unit; none stays owed
without a named unit. **Amended 19 Nov 2026 by the architect's message:** clause 29 (C:capability-rungs) is now TEN clauses
(C:capability-c07 … c32), so the table is **39 clauses**, covered by thirteen units. The strict meter exit is first (§A:day-11). Cloud/laptop facts are in
NAMED NOT GUESSED, never guessed.

Branch `claude/mwit-spec`, cut from `origin/main` at **`4b00cf5`** (`4b00cf57b0c0c25610769fe85e110d1ffac6a3fc`, fetched
2026-11-19T09:41Z). Every `file:line` below is at that base. This seat builds nothing: the only code it adds is the
measuring planter `ci/mwit/plant_day.mjs` (a measurement, not a witness). Ledger: `ci/mwit/LEDGER.jsonl`.

## 0 · The exit law every witness below obeys (one law, stated once)

| exit | meaning |
|---|---|
| 0 | the clause HOLDS — every fact it names was read and computed |
| 1 | RED — read, and the clause does not hold |
| 2 | UNREAD — a fact it needs is absent or unreadable; never a green |

A witness is `node <tracked path> [plain args]` — the only form the receipt organ accepts (`scripts/rung_receipt.mjs:17-18`
F4 (a), `parseWitness` `:224`). Its "red before" is recorded by `rung_receipt.mjs red`, which REFUSES a witness that exits 0
(`scripts/rung_receipt.mjs:306`); its "green on a real day" by `rung_receipt.mjs green --day D`, which re-runs the SAME
command at a descendant HEAD, requires `day.mjs dayProof(D).real` (`scripts/day.mjs:204-213`: a `sitting_review` row with
reason `fulltime` and a bound host; writer of that file `scripts/sitting.mjs:20`), the meter byte-equal across the run, and
the old day still RED (`scripts/rung_receipt.mjs:182-209` clauseVerdict). So **every clause rides the receipt organ that
already exists**; this spec adds witnesses, not a second receipt. Port class (row 1053): no witness below binds a port,
names a live service, POSTs to a daemon or restarts anything; the network ones read the public GitHub API read-only, at
most 3 anonymous calls (`scripts/ci_verdict.mjs:18-19`). Witness paths sit under `ci/witness/<unit>/` (land.mjs S1,
`scripts/land.mjs:15-16`) — see FORK F10.

## 1 · Measured at the cut (each by command, last line verbatim; 19 Nov 2026)

```
node ci/mwit/plant_day.mjs 5
PLANT want 5/11 · got 5/11 · meter exit 0 · line: DAILY GREEN 2026-11-19 IST · 5/11 · streak 0 study day(s) · 1.reps G · 2.pointer G · 3.notes G · 4.examiner G · 5.rejirah R(not born: rejirah_log.jsonl) · 6.cards G · 7.readiness R(not born: readiness.json) · 8.fulltime R(not born: post_match/) · 9.daemons R(not born: daemon_watchdog.json (no watchdog…) · 10.suite R(not born: watchman_last.json (no sweep)) · 11.pushed R(unreadable: git)

node scripts/done.mjs --hermetic ; echo exit $?
DONE · orphans lanes 5 · orphan verbs 120 · rungs UNREAD · rules laws 8/8 both ways (8/8 RED-planted) | ten laws LIVE | laws_register LIVE | teaching rules LIVE · units UNREAD · census UNREAD · reach LIVE (the consumer map is the live registry)
exit 0

NODE_USE_ENV_PROXY=1 node scripts/ci_verdict.mjs 4b00cf57b0c0c25610769fe85e110d1ffac6a3fc ; echo exit $?
ci_verdict 4b00cf5 GREEN — npm test · node 22: GREEN (base 3f84c80 · 0 new red · 1 base red · 126 live) [run 135307381568] | npm test · node 24: GREEN (base 3f84c80 · 0 new red · 1 base red · 126 live) [run 135307381242] (3 calls)
exit 0
(without NODE_USE_ENV_PROXY=1 in this cloud: "… answered 403", exit 2 — Node's fetch ignores HTTPS_PROXY here; curl reads the same URL 200)

ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)   [EXIT 2; the one red = the base red CI names]

meter ledger (tracked dressing-room/state/daily_green.jsonl, read by node -e, counts only)
rows 7 dates 4 latest 2026-11-18 greens 6 study true green false · 2026-11-13 greens 6 green false · any 11/11: 0
```

**How the planter measures without touching state:** `ci/mwit/plant_day.mjs` copies `scripts/` into a fresh
`os.tmpdir()` root, so `daily_green.mjs`'s `ROOT = join(HERE, "..")` (`scripts/daily_green.mjs:90`) is the temp root; it
plants eight state files there by `writeFileSync` (the tracked `registry.json` is READ and re-planted with a `note_blocks`
lane, because `gate.mjs:146` throws at import on an empty lanes table — measured, ledger row 2), runs the REAL CLI, prints
its last line and exit, and deletes the root. The live ledger is never opened. No port, no network, no model.

**Owners touched (read only, every one):** `daily_green.jsonl` — sole writer `scripts/daily_green.mjs:4`, append `:422` ·
`rung_receipts.jsonl` — `scripts/rung_receipt.mjs:5` · `sitting_reviews.jsonl` / `sitting.json` — `scripts/sitting.mjs:14,20`
· `night_log.jsonl` — `scripts/night.mjs:11` · `teaching_contract.json` — `scripts/teaching_contract.mjs:46` ·
`.git/land_ledger.jsonl` — `scripts/land.mjs:3-5,65` (inside `.git`, never tracked) · CI check runs — `.github/workflows/suite.yml`
(writer: the workflow), read by `scripts/ci_verdict.mjs:153`.

---

## A:day-11 — THE STRICT EXIT FIRST

**(a) Reads it today.** `node scripts/daily_green.mjs` (line mode). Measured on a planted 5/11 day: **exit 0** (§1). The code:
`main()` exits 1 only when `!out.ok` (`scripts/daily_green.mjs:758`, an unreadable ledger) and otherwise prints the line and
falls off the end (`:760`) — exit 0 at 0/11, 5/11 and 11/11 alike. `row.green` (`:413`) is `reds === 0 && sd.known`, which on
a NON-study day is true with N-A clauses, i.e. below 11/11. On the tracked meter at the cut no row reads 11/11 (§1).

**(b) Witness.**
1. *The strict exit (in the owner, FORK F1 (a)).* `daily_green.mjs` line/`--json` modes exit **0 iff `greens === 11`**, exit
   **3** when the line reads below 11/11 (any RED or any N-A — the clause says "reads 11/11", and N-A is not G), exit 1 as
   today for unreadable (`:758`). The line printed is unchanged byte for byte (its readers parse it). Note the meter still
   APPENDS on every run (`:420-424`), so this exit is for the anchor that runs it, never the receipt's witness (see 2).
2. *The clause witness (read-only).* `node ci/witness/mmeter/witness_meter.mjs day11` — reads the tracked meter
   (`dressing-room/state/daily_green.jsonl`, writer `scripts/daily_green.mjs:4`) through its own exported `latestByDate`
   semantics (export it; today it is file-private at `:356`), takes the LATEST date's LATEST row, and exits 0 iff
   `greens === 11 && study === true && clauses.length === 11 && clauses.every(c => c.status === "GREEN")`; exit 1 below;
   exit 2 when the ledger is absent/unreadable or the row lacks a field. It never writes, so the receipt's meter-equal
   check (`scripts/rung_receipt.mjs:204`) holds across its own run.
- **RED before at the cut:** the latest meter row is 2026-11-18 with greens 6 (§1) → exit 1. The strict-exit half: the
  planter's 5/11 day exits 0 today → its own selftest assert ("a 5/11 day exits nonzero") fails on base.
- **GREEN on a real day:** the day D he studies and closes by full time (dayProof real, `scripts/day.mjs:204`), on which
  `daily_green.mjs` (run by its anchor) appends an 11/11 study row (`:422`).
- **Plants:** `ci/witness/mmeter/plant_day.mjs` (this seat's `ci/mwit/plant_day.mjs`, moved and extended to plant 11/11:
  git init + a bare origin under the temp root for clause 11, a fresh `daemon_watchdog.json` / `watchman_last.json`,
  `readiness.json`, `post_match/<D>.md`, `rejirah_log.jsonl`). Base: 5/11 → exit 0 (RED for the assert); build: 5/11 → 3,
  11/11 → 0. Witness on a planted meter: a 6/11 latest row → 1; an 11/11 latest row → 0; no file → 2; an 11/11 row on a
  non-study day (N-A) → 1.

**(c) Unit:** **mmeter** (with A:old-day-red: one reader, the meter ledger).

**(d) Mutant:** in the build, `process.exit(out.row.greens === 11 ? 0 : 3)` → `process.exit(0)`: the planted 5/11 day exits 0
and the strict-exit assert goes RED. Witness mutant: `greens === 11` → `greens >= 5`.

## A:old-day-red

**(a) Reads it today.** `done.mjs`'s `oldDayRed` (`scripts/done.mjs:69-75`, file-private, called only by the FROZEN
`rungsLegacy`) and the receipt's meter row (`scripts/rung_receipt.mjs:328-330`, `old_day_green`), both keyed by
`OLD_RECORDED_DAY = "2026-11-13"` (`scripts/done.mjs:46`). No command prints it alone. Measured: the tracked meter's
2026-11-13 row reads greens 6, green false (§1).

**(b) Witness.** `node ci/witness/mmeter/witness_meter.mjs oldday` — reads the meter's LATEST 2026-11-13 row through
`done.mjs`'s `oldDayRed`, exported (one read path, not a copy); exit 0 iff `green === false`; 1 if it reads green; 2 if no
such row or the meter is unreadable. Meaning of "on the old code": FORK F5.
- **RED before at the cut:** the clause HOLDS today (row is red), so a red-before needs a planted state: the receipt cannot
  record it honestly → FORK F2. Proposed: the witness also requires the 13 Nov row to carry the code sha that wrote it
  (`daily_green.mjs` stamps `code_sha` on every row it appends — a build in the owner); the 13 Nov row has none → exit 2 at
  the cut; GREEN once (F5 (b)) a replay of the 13 Nov snapshot at that row's code reads red, or (F5 (a)) the architect rules
  the existing row sufficient.
- **GREEN on a real day:** the same day as A:day-11 — the 13 Nov row still red while D reads 11/11.
- **Plants:** meter with a 13 Nov red row → 0; with a later 13 Nov green row appended → 1; without → 2.

**(c) Unit:** **mmeter**. **(d) Mutant:** `green === false` → `green !== true` (a row with `green: null` turns 0 — the plant
with a null row must stay 2).

## B-machine:broken-red

**(a) Reads it today.** `node scripts/ci_verdict.mjs <sha>` (`scripts/ci_verdict.mjs:16-19,225-232`: 0 GREEN, 1 RED, 2
unreadable) reads any sha's verdict; nothing names a deliberately broken branch. No record of one exists in the repo
(`git grep -n "broken" -- ci` names none for this clause).

**(b) Witness.** `node ci/witness/mmach/witness_machine.mjs broken` — reads `ci/witness/mmach/machine.json` (tracked, written
once by the unit: `{ broken: { sha, branch, planted_assert } , clean: { sha, branch } }`), runs `ci_verdict.mjs <broken.sha>`
as a child, exits 0 iff the child exits 1 AND its line names `planted_assert` among the NEW reds (the "by name" half — the
annotation title carries the member name, `scripts/ci_verdict.mjs:5-15`). 2 if the record is absent or the verdict is
PENDING/UNREADABLE.
- **RED before at the cut:** `machine.json` absent → exit 2.
- **GREEN:** the unit pushes a branch whose only change breaks one hermetic assert, records its sha, and on a real day the
  read names it.
- **Plants:** a planted fetch (ci_verdict's own selftest seam) returning a RED leg naming the assert → 0; RED naming
  another → 1; GREEN → 1; no record → 2.

**(c) Unit:** **mmach** (3, 4, 5 share ONE reader: ci_verdict over the recorded pair). **(d) Mutant:** drop the name check
(accept any RED) → the "RED naming another" plant goes 0.

## B-machine:clean-green

**(a)** As above; `ci_verdict.mjs 4b00cf5` → GREEN, exit 0 (§1) — the main tip, not a recorded clean branch.
**(b)** `node ci/witness/mmach/witness_machine.mjs clean` — exit 0 iff `ci_verdict.mjs <clean.sha>` exits 0 and both legs
read GREEN. RED before: no record → 2. GREEN: the recorded clean sibling of the broken branch (same base, the break
reverted) reads GREEN. **(c)** **mmach**. **(d)** Mutant: treat exit 2 (UNREADABLE) as green → the no-network plant goes 0.

## B-machine:read-no-login

**(a)** `ci_verdict.mjs <sha>` already reads with **no token** (`scripts/ci_verdict.mjs:153`: only `Accept` and
`User-Agent` headers). Measured: GREEN, exit 0 with `NODE_USE_ENV_PROXY=1`; exit 2 (403) without, in this cloud only (§1).
**(b)** `node ci/witness/mmach/witness_machine.mjs nologin` — spawns `ci_verdict.mjs <clean.sha>` with an env scrubbed of
every `*TOKEN*` / `GH_*` / `GITHUB_*` key and no git credential helper, and exits 0 iff the child prints one verdict line
and exits 0 or 1 (a READ, whatever the verdict); 2 on UNREADABLE. Static half: the witness greps ci_verdict's source for
an `Authorization` header and exits 1 if one appears.
- **RED before at the cut:** no record → 2 (FORK F2: the reader itself is already built by unit B1; this witness's red is
  the missing record, the only honest red left).
- **GREEN:** the record exists; the read succeeds with the scrubbed env on his laptop (no proxy there — NAMED N4).
**(c)** **mmach**. **(d)** Mutant: add `Authorization: Bearer ${process.env.GITHUB_TOKEN}` to the fetch → static half exit 1.

## B-pull:real-pull-landing

**(a)** `node scripts/land.mjs count` (`scripts/land.mjs:25,68`) counts landings from `.git/land_ledger.jsonl` — his clone
only. The verdict is read at T and T is what main becomes (`scripts/land.mjs:13-14` C1, `:128-130`, `:250`). Nothing records
whether a gate ran on the laptop. Cloud: not readable (NAMED N5).

**(b)** `node ci/witness/mpull/witness_pull.mjs` — reads the land ledger (`git rev-parse --git-path land_ledger.jsonl`, the
verb's own path, `:64`), takes the newest `LANDED` row's sha T, and exits 0 iff (i) T is an ancestor-or-equal of
`origin/main` and `origin/main`'s first-parent chain contains T itself (not a rewrite of it); (ii) `ci_verdict.mjs T` exits 0;
(iii) the row carries `local_gate: false` — a field the landing verb must start recording (a build in land.mjs: did the
landing run any `organism_test`/`npm test` child on this machine; today none of its children is the suite, C3 `:14-15`, so
the field is a stated `false`, measured by the verb, never typed). 2 when the ledger or the field is absent.
- **RED before at the cut:** no `local_gate` field on any row (the verb never wrote one) → 2.
- **GREEN on a real day:** the first landing after the build, on his laptop, by `land.mjs <unit>`.
- **Plants:** a temp clone + bare origin (land.mjs's own witness shape, `scripts/land.mjs:28`) with a planted ledger row and
  a planted verdict fetch: all three true → 0; T absent from origin's first-parent chain → 1; verdict RED → 1;
  `local_gate: true` → 1; no field → 2.

**(c)** **mpull**. **(d)** Mutant: compare by tree (`rev-parse T^{tree}`) instead of commit sha → the "rewritten commit,
same tree" plant goes 0.

## B-left:one-command

**(a)** `node scripts/done.mjs` IS the one command (`scripts/done.mjs:4-30`). Measured hermetic: one line, exit 0, with
rungs / units / census UNREAD (§1). Its exit is always 0 (`:248`), so "answers" is not an exit today.

**(b)** `node ci/witness/mleft/witness_left.mjs answers --campaign <dir>` — spawns `done.mjs json --campaign <dir>` (not
hermetic) and exits 0 iff every check is COMPUTED: `orphans` numeric, `rungs.read === true`, `units.read`, `census.read`,
`rules.ten`/`register`/`teaching` non-null and not `unread`, `reach` an array. Any UNREAD/LIVE word → 2 (a line the reader
cannot compute is never green). It does not judge zero — that is C:finish-zero.
- **RED before at the cut:** no campaign dir in this repo → rungs/units/census UNREAD → 2.
- **GREEN on a real day:** on his laptop with the campaign dir present, every check computed.
- **Plants:** a planted campaign (plan_v3.json + units.json + census.json) with `--receipts` planted → 0 hermetic-except-
  rules; without `--campaign` → 2.

**(c)** **mleft** (7, 27, 29, 30: ONE reader, `done.mjs json`). **(d)** Mutant: treat `rungs.read === false` as answered →
the no-campaign plant goes 0.

## B-hands:clicks-off

**(a)** Nothing. The tracked `.claude/settings.json` holds no `permissions` key (measured: `node -e` keys = `_comment, hooks,
… statusLine`, permissions `null`). The one-time setting lives in his user settings on the laptop (NAMED N6).

**(b)** `node ci/witness/mhands/witness_hands.mjs clicks` — reads the settings chain Claude Code reads (user
`~/.claude/settings.json`, project `.claude/settings.json`, project `.claude/settings.local.json`; the home is re-pointable
ONLY by an env door under `os.tmpdir()` for plants) and exits 0 iff the effective `permissions.defaultMode` is a no-prompt
mode for the runner's surface; AND (real-day half) his day's runner transcripts carry zero permission-prompt events (the
transcript reader `study_scope.mjs` owns, its `humanText`/attachment walk). 2 when a settings file is unparseable or the
transcripts are not on this machine.
- **RED before at the cut:** no setting in any file this repo sees → 1; transcripts absent in the cloud → 2.
- **GREEN on a real day:** the setting set once; the day's runner ran with zero prompts.
- **Plants:** temp home with the mode set → 0; unset → 1; unparseable → 2.

**(c)** **mhands** (8, 9: one reader, the runner's settings + transcripts). **(d)** Mutant: read only the project file →
the "user-file only" plant goes 1.

## B-hands:fresh-runner

**(a)** Nothing in this repo. The runner launches from the campaign tree (`.claude/skills/runner/SKILL.md` boots it; the
launch record is campaign-side, NAMED N7).

**(b)** `node ci/witness/mhands/witness_hands.mjs fresh --campaign <dir>` — for every unit the campaign launched in the
window, exits 0 iff each unit ran in a session whose transcript begins at that unit (a distinct session id per unit, its
first human prompt is the unit's brief) and no transcript carries a human `/clear` prompt (the same `/clear` skip
`study_scope.mjs` already recognises). 2 without the campaign or transcripts.
- **RED before at the cut:** no campaign → 2. **GREEN:** a real day's units each in a fresh session, no `/clear`.
- **Plants:** two units, two sessions → 0; two units one session → 1; a `/clear` → 1.

**(c)** **mhands**. **(d)** Mutant: dedupe by unit id instead of session id → the "two units one session" plant goes 0.

## B-rehearsal:night-replay

**(a)** Nothing replays a recorded day. `study_rail_replay.mjs` replays transcripts against the RAIL, not the meter
(`scripts/study_rail_replay.mjs:1-20`). `daily_green.mjs` re-points its root only in-process for its selftest
(`scripts/daily_green.mjs:54-55,381-382`). The night exists as a factory (`scripts/night.mjs:1-35`, `mark --kind …`).

**(b)** A new organ **`scripts/rehearse.mjs`**, SOLE WRITER of `dressing-room/state/rehearsal_log.jsonl`: at night (an act of
the night, through `night.mjs mark --kind …` — its CLI, never its file), it snapshots the recorded day's state files into an
`os.tmpdir()` root, copies the NEW code's `scripts/` beside it (the planter's proven method, FORK F3 (a)), runs
`daily_green.mjs --date D` there, and appends `{ day, code_sha, at, greens, clauses[status only], would_be_11 }`. Clauses
9-11 read the machine NOW (`scripts/daily_green.mjs:69`): FORK F4. Witness: `node ci/witness/mrehearse/witness_rehearse.mjs
--night <N>` — exit 0 iff a rehearsal row exists for night N, its `at` lies inside that night (IST day N evening → N+1
morning, read from the night factory's own row for N, never a typed hour), its `code_sha` equals the HEAD the night ran
at, and `would_be_11` is a computed boolean; 1 if the row is outside the night; 2 if absent.
- **RED before at the cut:** no rehearsal organ, no row → 2.
- **GREEN on a real day:** the night after his recorded day, the row is written and says 11/11 or not (the clause asks it
  SAYS so; whether it says yes is the L* clauses' and A:day-11's business).
- **Plants:** planted night row + rehearsal row in-window → 0; row stamped next afternoon → 1; none → 2.

**(c)** **mrehearse**. **(d)** Mutant: run the snapshot with the OLD tree's `scripts/` (HEAD~) → `code_sha` mismatch → 1.

## B-canary:launch-no-laptop

**(a)** Nothing in this repo; a launch is a campaign/cloud act (NAMED N8).

**(b)** `node ci/witness/mcanary/witness_canary.mjs launch-no-laptop` — reads a hash-chained canary file
`ci/witness/mcanary/canaries.jsonl` (tracked; rows `pass` then `run`, chained like `rung_receipt.mjs:101` rowSha). Exit 0
iff a `pass` row (the pass line, its sha) exists for the id, a `run` row for the id exists with `started_at > pass.at`,
the run row's `pass_sha` equals the pass row's sha (the line was not edited after), and the run row's measured outcome
satisfies the pass line's machine predicate. For THIS id the predicate: the unit's session ran with no attached machine
(`get_session` of the run's session shows no Remote Control computer) and its push reached its branch. 1 on a failed
predicate or a run before its pass line; 2 when absent.
- **RED before at the cut:** no canary file → 2. **GREEN:** a real launch after its pass line.
- **Plants:** pass then run (ok) → 0; run before pass → 1; pass edited after run → 1; none → 2.

**(c)** **mcanary** (11, 12, 13: one reader, the canary file). **(d)** Mutant: drop the `started_at > pass.at` check → the
"run before pass" plant goes 0.

## B-canary:opus-vs-fable

**(a)** Nothing (NAMED N8). **(b)** `node ci/witness/mcanary/witness_canary.mjs opus-vs-fable` — same reader; the pass row
names TWO seats on ONE unit; the run row carries both seats' session ids, each seat's served model as the session
reports it (`get_session` `external_metadata.last_served_model`, read at return — never typed), and each seat's measured
outcome; exit 0 iff both ran the same unit id and the pass line's predicate holds over the pair. RED before: none → 2.
**(c)** **mcanary**. **(d)** Mutant: accept two different unit ids → the mismatched-unit plant goes 0.

## B-canary:design-fleet

**(a)** Nothing (NAMED N8). **(b)** `node ci/witness/mcanary/witness_canary.mjs design-fleet` — same reader; the pass row names
the fleet's seats; the run row lists every seat's return; exit 0 iff every named seat returned and the pass predicate
holds. RED before: none → 2. **(c)** **mcanary**. **(d)** Mutant: count returns `>= 1` instead of every seat → 0 on a
partial fleet plant.

## B-factory:four-numbers

**(a)** Nothing collects them per window. Pieces exist: landings — `.git/land_ledger.jsonl` (`scripts/land.mjs:65`); his
hands — the HUMAN stops in the same ledger (`scripts/land.mjs:45,68,162`); memory-wait — the night's memory floor
(`scripts/night.mjs:24-25`, `may` answers NO on the floor); laptop test-loads — no recorder (NAMED N9).

**(b)** `node ci/witness/mfactory/witness_factory.mjs --window <id> --campaign <dir>` — reads the campaign's window row
(NAMED N9: its file and writer) and exits 0 iff the row carries all four fields, each a finite number with a `source`
naming its owner reader; 1 if a field is missing; 2 if the window row is absent. (The clause's own pass line: presence
on that window row — not their values.)
- **RED before at the cut:** no window row here → 2. **GREEN:** the first window closed after the build.
- **Plants:** four numeric fields → 0; three → 1; a string "n/a" → 1; no row → 2.

**(c)** **mfactory**. **(d)** Mutant: `Number.isFinite` → `!= null` → the "n/a" plant goes 0.

## L2:rehearsal-green · L3:rehearsal-green · L4:rehearsal-green · L5:rehearsal-green · L6:rehearsal-green · L7:rehearsal-green

(One section per id is required; these six share ONE design and differ only in `<n>`. Each id is listed here verbatim.)

- **L2:rehearsal-green** · **L3:rehearsal-green** · **L4:rehearsal-green** · **L5:rehearsal-green** · **L6:rehearsal-green** ·
  **L7:rehearsal-green**

**(a)** The only loop reader is `rung_receipt.mjs`'s `loopVerdict` (`scripts/rung_receipt.mjs:211-219`), read by `done.mjs`
(`scripts/done.mjs:126-129`): GREEN = four artefacts (sheet, page, acts, ladder) hashed (`:142-143,174`). That is
PRESENCE, not "reads green". Hermetic: UNREAD (no receipts). What loops 2-7 ARE is in plan v3 line 100, not in this repo
(NAMED N1).

**(b)** `node ci/witness/mloop/witness_loop.mjs --loop L<n> --source rehearsal --night <N>` — reads the rehearsal row of
night N (unit mrehearse's `rehearsal_log.jsonl`) and the loop's own definition from the plan v3 list (`loops[]`, the
contract `scripts/rung_receipt.mjs:60`, extended per FORK F7 (b) so each loop names the meter clauses or witness it is
judged by); exit 0 iff every clause the loop names reads GREEN in that rehearsal row; 1 if one reads RED; 2 if the loop has
no definition or the row is absent.
- **RED before at the cut:** no rehearsal row, no loop definitions → 2.
- **GREEN:** the night after a real day, the rehearsal of the new code reads the loop's clauses green.
- **Plants:** loop L<n> → clauses {1,2}; rehearsal row with 1,2 G → 0; 2 R → 1; no definition → 2.

**(c)** **mloop** (all twelve L* ids: one reader). **(d)** Mutant: judge by `loopVerdict` (artefacts hashed) → the "artefacts
present, clause RED" plant goes 0.

## L2:real-day-green · L3:real-day-green · L4:real-day-green · L5:real-day-green · L6:real-day-green · L7:real-day-green

- **L2:real-day-green** · **L3:real-day-green** · **L4:real-day-green** · **L5:real-day-green** · **L6:real-day-green** ·
  **L7:real-day-green**

**(a)** As above: `loopVerdict` presence only; UNREAD hermetic.
**(b)** `node ci/witness/mloop/witness_loop.mjs --loop L<n> --source day --day <D>` — the same reader, over the METER row of
day D (`daily_green.jsonl`, writer `scripts/daily_green.mjs:4`) instead of the rehearsal row, and only when `dayProof(D).real`
(`scripts/day.mjs:204`); exit 0 iff the loop's named clauses read GREEN on D; 1 RED; 2 not a real day / no definition.
RED before: no definitions → 2. GREEN: the real day after the build. **(c)** **mloop**. **(d)** Mutant: skip the dayProof
check → the "not a real day, clauses green" plant goes 0.

## C:census-510

**(a)** `done.mjs` `census()` (`scripts/done.mjs:141-148`) reads `<campaign>/census.json`: PENDING count and "neither a fate+rung
nor serves-no-step". Hermetic: `census UNREAD` (§1). It does not count pieces nor how each was decided.
**(b)** `node ci/witness/mleft/witness_left.mjs census --campaign <dir>` — via `done.mjs json`, plus the census file's
rows: exit 0 iff the row count equals the census size the plan v3 list states (FORK F6 (a): read, never typed), PENDING
is 0, unfated is 0, and every row carries `decided_by: "code"` OR `decided_by: "judgement"` with a `code_cannot` reason
naming the check that could not decide. 1 on any miss; 2 without the census or the size.
- **RED before at the cut:** census UNREAD → 2. **GREEN:** the census closed, on his laptop's campaign dir.
- **Plants:** N rows all fated by code → 0; one judgement row without `code_cannot` → 1; N-1 rows → 1; absent → 2.

**(c)** **mleft**. **(d)** Mutant: drop the row-count check → the N-1 plant goes 0.

## C:rule-witnesses

**(a)** `done.mjs` rules (`scripts/done.mjs:151-172`) prints `teaching rules <n>` only (a count, no witness), LIVE hermetic.
`laws/*.yml` rules are planted both ways by `lawpack.mjs` (8/8 at the cut, 19 Nov 2026, §1) — those are organism laws,
not the teaching rules. `teaching_contract.json` is untracked (`git ls-files` names only `laws_register.json`), writer
`scripts/teaching_contract.mjs:46`.
**(b)** `node ci/witness/mrulew/witness_rules.mjs` — reads the teaching rule ids through `teaching_contract.mjs`'s exported
reader (laptop) and a tracked map `ci/witness/mrulew/rule_witness.json` `{ <rule-id>: "node <tracked path> [args]" }`;
exit 0 iff every rule id has a witness, every witness command parses by `rung_receipt.mjs parseWitness` (`:224`), and each
has a RED and a CLEAN plant (the lawpack shape, `done.mjs:155-158`); 1 on a rule without one; 2 if the rules are unreadable
(cloud).
- **RED before at the cut:** no map → 1 on the laptop, 2 here. **GREEN:** every rule witnessed.
- **Plants:** 2 rules, 2 witnesses, planted both ways → 0; one missing → 1; no rules file → 2.

**(c)** **mrulew**. **(d)** Mutant: accept a witness with only a RED plant → 0 on the one-way plant.

## THE TEN CAPABILITY CLAUSES (architect's message, 19 Nov 2026: clause 29 is now ten; the table is 39 clauses)

Each of the ten cites plan v3 line 102 and `ARCHITECT_PLAN_v2__2026-10-06.md` line 16. **Neither is in this repo**
(`git ls-files | grep -i ARCHITECT_PLAN` names nothing; NAMED N12), so a capability's name below is the message's own word,
and its MEANING is read off the organ that already carries that name, by file:line, never guessed. The message says the
teaching ones come from **TEACHING GATE v2**, a spec queued 23 Sep and still unruled: its file
`queue/SPEC_v2__2026-09-23_teaching-gate.md` is cited by `scripts/teaching_gate.mjs:4` but is **not tracked**
(`git ls-files | grep -i SPEC_v2` names nothing; NAMED N13). What IS on main from it is the G2 gate:
`scripts/teaching_gate.mjs` (a Stop hook, sole writer of `dressing-room/state/teaching_gate.jsonl`, `:58`; append `:807`;
its check ids `CHECKS` `:98-164`; row keys at the cut, read by `node -e` over the tracked log, keys only:
`ts, session, sitting, decision, scope, reds, patch, counted, …`), and the rule table
`learning-layer/teaching_gate/RULE_TABLE.json` (built 23 Sep 2026, every RULES.jsonl row mapped to a check id or an exemption).

**THE SHARED READER (unit mcap — C07, C10, C12, C13, C18, C28, C32).** `node ci/witness/mcap/witness_capability.mjs <cNN> --day <D>`:
1. reads a tracked map `ci/witness/mcap/capability_map.json` `{ "<cNN>": { "checks": [<teaching_gate CHECKS ids>], "audit": [<teaching_audit CHECKED_RULES ids>] } }`
   — every id must exist in `CHECKS` (`scripts/teaching_gate.mjs:98`) or `CHECKED_RULES` (`scripts/teaching_audit.mjs:186`)
   and carry a planted-both-ways case in that organ's selftest (`teaching_gate.mjs selftest`, `:64`); an id that does not → 2;
2. requires `day.mjs dayProof(D).real` (`scripts/day.mjs:204`) and takes that day's sitting id;
3. reads `teaching_gate.jsonl` rows whose `sitting` is that sitting (the gate's scope is the study session only,
   `scripts/teaching_gate.mjs:25-28`): exit 0 iff at least one teacher turn was judged AND no row's `reds` (first pass or
   `surviving`) names a mapped check; 1 if one does; 2 if the day is not real, no turn was judged, or the map/log is unreadable.
- **RED before at the cut (every one of the seven):** no map file → 2. **GREEN:** his real day after the build, zero surviving
  reds of that capability's checks across the sitting.
- **Plants (every one):** a temp state dir through the gate's own seam `ARSENAL_GATE_STATE_DIR` (`:80`, honoured for its
  selftest — FORK F14 whether a witness may use it) with a planted real day + three judged rows: none red → 0; one red of a
  mapped check → 1; a red of an UNmapped check only → 0; zero judged rows → 2; a map id absent from `CHECKS` → 2.
- **The mapping itself is the TEACHING GATE v2 dependency:** which check ids a capability is judged by is that spec's
  business. Every map row below is this seat's PROPOSAL read off the organ's own names; FORK F13 rules it.

## C:capability-c07

**(a)** C07 one-idea. Read today by the G2 gate's per-turn checks `A.one-question` and `A.new-terms`
(`scripts/teaching_gate.mjs:101,105`) and by `teaching_audit.mjs`'s `one-idea` rule (`scripts/teaching_audit.mjs:187,770,886`;
`act-mt2kgn09` "C7 one-idea, position BY NAME", `:179`). No command answers "did C07 hold on day D" — the gate log counts reds
per turn, nothing folds them per capability. Hermetic: nothing reads it (the log is live state).
**(b)** `node ci/witness/mcap/witness_capability.mjs c07 --day <D>` — proposed map `{ checks: ["A.one-question", "A.new-terms",
"A.position"], audit: ["one-idea", "act-mt2kgn09"] }`. Red at cut: no map → 2. Green: a real day with no surviving red of those.
**(c)** **mcap**. **(d)** Mutant: drop `A.new-terms` from the map → the plant with a two-new-names turn goes 0.

## C:capability-c10

**(a)** C10 real terms. Read today by `A.count-form` ("idea 2 of 4" forbidden — position by NAME only,
`scripts/teaching_gate.mjs:110`) and `teaching_audit.mjs`'s abstract-progress-counter drift (his words quoted at
`scripts/teaching_audit.mjs:491`, the drift at `:1234`). Same gap: no per-capability day answer.
**(b)** `node ci/witness/mcap/witness_capability.mjs c10 --day <D>` — proposed map `{ checks: ["A.count-form", "A.position"],
audit: ["terminology"] }`. Red at cut: no map → 2. Green: no surviving red on a real day. **(c)** **mcap**.
**(d)** Mutant: map `A.position` only → the planted "idea 2 of 4" turn goes 0.

## C:capability-c12

**(a)** C12 gut-word. Read today by `A.gut-trio` / `A.gut-by-moment` (`scripts/teaching_gate.mjs:103-104`), the bank door's
GUT-WORD LAW ("no gut-word, no rep", `scripts/study_scope.mjs:259`) and the close warning that a gut-word dies unbanked
(`scripts/forge_session.mjs:813`).
**(b)** `node ci/witness/mcap/witness_capability.mjs c12 --day <D>` — proposed map `{ checks: ["A.gut-trio", "A.gut-by-moment",
"B.bank"] }`. Red at cut: no map → 2. Green: a real day where every gut-bearing moment carried the trio and every gut-word
reply was banked. **(c)** **mcap**. **(d)** Mutant: drop `B.bank` → the "trio asked, reply not banked" plant goes 0.

## C:capability-c13

**(a)** C13 non-answer. The nearest organ reading is `study_scope.mjs`'s classifier — what counts as an ANSWER and what a bare
"ok" is (`scripts/study_scope.mjs:199-204,826-834`) — and `A.confusion-literal` (`scripts/teaching_gate.mjs:125`). What the
CAPABILITY demands of a non-answer (re-ask? bank as `pata nahi`? stop?) is not written in this repo → **the design depends
on TEACHING GATE v2 (FORK F13)**.
**(b)** `node ci/witness/mcap/witness_capability.mjs c13 --day <D>` — proposed map `{ checks: ["A.confusion-literal", "B.moment"] }`,
plus, once F13 rules the behaviour, one new gate check that judges the turn after a classified non-answer. Red at cut: no map → 2.
**(c)** **mcap**. **(d)** Mutant: classify a bare "ok" as an answer → the planted non-answer turn's red disappears → 0.

## C:capability-c18

**(a)** C18 crack capture. The capture organs: the bank checks `B.bank`, `B.bank-verbatim` (`scripts/teaching_gate.mjs`,
CHECKS family B, `:141-157`), the reps' sole writer `capture.mjs` (`scripts/teaching_audit.mjs:982`), and the capsule's
crack-map (FORGE, `scripts/learnstate.mjs:581`). No reader says a crack seen in the sitting reached a captured row.
**(b)** `node ci/witness/mcap/witness_capability.mjs c18 --day <D>` — proposed map `{ checks: ["B.bank-verbatim", "B.bank"] }`.
Whether "crack" means a wrong answer, a named trap or a doubt is TEACHING GATE v2's (FORK F13). Red at cut: no map → 2.
**(c)** **mcap**. **(d)** Mutant: drop `B.bank-verbatim` → the "paraphrased crack" plant goes 0.

## C:capability-c22

**(a)** C22 asked-first strike. Read today: `learnstate.mjs askedFirst` (`scripts/learnstate.mjs:700-736`, forks row 550 (2) F3)
picks ONE cold strike from a gate-passed note, and the SessionStart brief prints it or its named absence (`:1084-1091`; this
session's kickoff printed "ASKED-FIRST (C22) — koi strike nahi …"). The writer of the row it rides is `learnstate.mjs` itself
(row shape `:21`; `compiled_notes.jsonl` it reads is the notes compiler's, `:22`). Nothing reads whether the strike was
ASKED, and asked FIRST, in the sitting.
**(b)** `node ci/witness/mstrike/witness_strike.mjs --day <D>` — exit 0 iff on real day D the learnstate row carried a strike
(`asked_first.strike`) AND the sitting's first teacher turn (transcript, through `study_scope.mjs`'s own turn reader) asks
that note's question before any new idea; 1 if a strike existed and was not asked first; 2 if no strike existed that day
(a day with no gate-passed note cannot witness the clause — never a green) or the day is not real.
- **RED before at the cut:** this session's own kickoff names no strike → 2. **GREEN:** a real day with a strike asked first.
- **Plants:** row with strike + first turn asks it → 0; asks it third → 1; no strike → 2.
**(c)** **mstrike** (its own reader: the learnstate row + the transcript). **(d)** Mutant: accept "asked anywhere in the
sitting" → the "asked third" plant goes 0.

## C:capability-c28

**(a)** C28 park. HOW_HE_LEARNS #12 and #14 (system work and buying talk parked in one line, kickoff card) are read by
`teaching_audit.mjs` `no-system-mid-concept` (`scripts/teaching_audit.mjs:188`) and the gate's `A.buying`
(`scripts/teaching_gate.mjs:140`). Whether "park" also means the parked item is RETURNED later (a carry) is not in this repo
(FORK F13).
**(b)** `node ci/witness/mcap/witness_capability.mjs c28 --day <D>` — proposed map `{ checks: ["A.buying"], audit:
["no-system-mid-concept"] }`. Red at cut: no map → 2. **(c)** **mcap**. **(d)** Mutant: drop the audit id → the
"engineering mid-concept" plant goes 0.

## C:capability-c29

**(a)** C29 reach. Read today by `done.mjs`'s REACH READER (`scripts/done.mjs:172-197`): per lane, static reach (its declared
consumer reads its files) and window reach (consumed inside the gate's window, `gate.mjs consumerSatisfied`). Hermetic:
`reach LIVE` (§1) — it reads the live registry and `consumption.jsonl` (writer `brain.mjs:132`, `scripts/done.mjs:45`).
**(b)** `node ci/witness/mleft/witness_left.mjs reach --campaign <dir>` — via `done.mjs json`: exit 0 iff every lane that
has a consumer (not NO CONSUMER, not RETIRED) reads `reached: true`; 1 on any unreached lane; 2 on `reach LIVE` / UNREAD.
Whether C29's "reach" is THIS lane reach or the teaching reach (an idea reaching him) is TEACHING GATE v2's word — FORK F13.
- **RED before at the cut:** hermetic `reach LIVE` → 2. **GREEN:** the laptop morning read, every consumed lane reached.
- **Plants:** planted rows all reached → 0; one `win:false` → 1; LIVE → 2.
**(c)** **mleft** (it reads `done.mjs json`, the same reader). **(d)** Mutant: count static reach alone → the "static yes,
window no" plant goes 0.

## C:capability-c31

**(a)** C31 away-brain GUARD. Nothing in this repo carries that name (`git grep -n -i "away.brain"` names nothing). The nearest
organ is `presence.mjs` (the stall sensor: KNOWN-AWAY spans from the AFK watcher, `scripts/presence.mjs:441-473`). What the
GUARD guards (his away time from the organism? a lesson resumed after he left?) is unwritten here → **NAMED N14 and
FORK F13**; no design is guessed past its shape.
**(b)** `node ci/witness/mguard/witness_guard.mjs --day <D>` — shape only: exit 0 iff on real day D every period the owner
reader marks AWAY carries the guard's recorded act and no organ act he would have had to answer landed inside it; 1 on one
unguarded; 2 while the guard's definition and owner are unruled (which is the cut: 2).
**(c)** **mguard**. **(d)** Mutant (once defined): drop the away-span intersection → the "act during an away span" plant goes 0.

## C:capability-c32

**(a)** C32 answer-before-leave. Read today by the close warnings that a session ends with nothing banked
(`scripts/forge_session.mjs:813,1353`) and by the bank duty `B.bank` (a graded reply banked before the turn ends,
`scripts/teaching_gate.mjs` family B). Nothing reads, at the sitting's close, that his last open question was answered or
banked before he left.
**(b)** `node ci/witness/mcap/witness_capability.mjs c32 --day <D>` — proposed map `{ checks: ["B.bank", "B.judge-once"] }`
plus the close half: the sitting's close row (`sitting_reviews.jsonl`, writer `scripts/sitting.mjs:20`) has no open moment
after the last banked answer. Red at cut: no map → 2. Green: a real day whose close left no unanswered moment.
**(c)** **mcap**. **(d)** Mutant: drop the close half → the "left with a question open" plant goes 0.

## C:finish-zero

**(a)** `node scripts/done.mjs --hermetic` → `orphans lanes 5 · orphan verbs 120 · rungs UNREAD …`, exit 0 (§1). The three
checks are orphans, rungs, rules (`scripts/done.mjs:7-15`).
**(b)** `node ci/witness/mleft/witness_left.mjs finish --campaign <dir>` — exit 0 iff `orphans.lanes === 0 && orphans.verbs ===
0`, rungs `g === n` with `u = r = x = 0` and loops `lg === ln`, and every rule set computed with laws `both === n` (and the
laptop sets non-LIVE, the register `site === n`); 1 on any nonzero; 2 when a check is UNREAD/LIVE.
- **RED before at the cut:** 5 orphan lanes → 1 (and rungs UNREAD → 2; the witness reports the worse, 2).
- **GREEN on a real day:** the morning `done.mjs` reads zero on all three on his laptop.
- **Plants:** planted campaign, zero everywhere → 0; one orphan lane → 1; rungs UNREAD → 2.
**(c)** **mleft**. **(d)** Mutant: `lanes === 0` dropped → the one-lane plant goes 0.

---

## UNITS

| order | unit | clauses | files (new unless marked) |
|---|---|---|---|
| 1 | **mmeter** | A:day-11, A:old-day-red | `scripts/daily_green.mjs` (EDIT: strict exit `:758-760`, export `latestByDate` `:356`, `code_sha` on the row `:413`) · `scripts/done.mjs` (EDIT: export `oldDayRed` `:69`) · `ci/witness/mmeter/witness_meter.mjs` · `ci/witness/mmeter/plant_day.mjs` (from `ci/mwit/plant_day.mjs`) |
| 2 | **mmach** | B-machine:broken-red, B-machine:clean-green, B-machine:read-no-login | `ci/witness/mmach/witness_machine.mjs` · `ci/witness/mmach/machine.json` · one deliberately broken branch + its clean sibling (pushed, never landed) |
| 3 | **mleft** | B-left:one-command, C:census-510, C:capability-c29, C:finish-zero | `ci/witness/mleft/witness_left.mjs` (reads `scripts/done.mjs json`, no edit) |
| 4 | **mpull** | B-pull:real-pull-landing | `scripts/land.mjs` (EDIT: `local_gate` measured on the ledger row `:250`) · `ci/witness/mpull/witness_pull.mjs` |
| 5 | **mrehearse** | B-rehearsal:night-replay | `scripts/rehearse.mjs` (sole writer of `rehearsal_log.jsonl`) · `scripts/night.mjs` (EDIT: one `mark` kind) · `ci/witness/mrehearse/witness_rehearse.mjs` |
| 6 | **mloop** | the twelve L2..L7 rehearsal-green / real-day-green ids | `ci/witness/mloop/witness_loop.mjs` · `scripts/rung_receipt.mjs` (EDIT: `PLAN_CONTRACT.loops` names its clauses, FORK F7) |
| 7 | **mhands** | B-hands:clicks-off, B-hands:fresh-runner | `ci/witness/mhands/witness_hands.mjs` |
| 8 | **mcanary** | the three B-canary ids | `ci/witness/mcanary/witness_canary.mjs` · `ci/witness/mcanary/canaries.jsonl` (+ its one writer verb inside the witness file's sibling `ci/witness/mcanary/canary.mjs`) |
| 9 | **mfactory** | B-factory:four-numbers | `ci/witness/mfactory/witness_factory.mjs` |
| 10 | **mrulew** | C:rule-witnesses | `ci/witness/mrulew/witness_rules.mjs` · `ci/witness/mrulew/rule_witness.json` |
| 11 | **mcap** | C:capability-c07, -c10, -c12, -c13, -c18, -c28, -c32 | `ci/witness/mcap/witness_capability.mjs` · `ci/witness/mcap/capability_map.json` (the map waits on FORK F13) |
| 12 | **mstrike** | C:capability-c22 | `ci/witness/mstrike/witness_strike.mjs` |
| 13 | **mguard** | C:capability-c31 | `ci/witness/mguard/witness_guard.mjs` (after FORK F13 / N14 define the guard) |

Order reason: mmeter first (the strict exit is the one every L*/A clause leans on); mmach before mpull (the pull reads the
machine); mrehearse before mloop (the loop's rehearsal source). Every unit also adds its witness to `organism_test.mjs`'s
hermetic table (the suite runs the plants) — `scripts/organism_test.mjs` is the one file every unit edits (FORK F11).

## FORKS

- **F1 · where the strict meter exit lives.** (a) `daily_green.mjs` line/json exit 0 iff 11/11, 3 below (the default
  changes; a gate only gets stricter); (b) a `--strict` flag, default unchanged; (c) no owner change — the read-only witness
  carries it. **Recommend (a)** plus the read-only witness for the receipt. Decides it: callers that read the exit —
  measured here none in the repo (`git grep -n daily_green -- ':!dressing-room' ':!docs'` names no spawner); his laptop's
  Task Scheduler entries are NAMED N3.
- **F2 · clauses whose reader already exists at the cut** (B-machine:read-no-login: ci_verdict.mjs; B-left:one-command:
  done.mjs; A:old-day-red holds today). The receipt refuses a red-before that exits 0 (`rung_receipt.mjs:306`). (a) the
  witness reads a stricter fact not yet true (the recorded sha pair; the campaign dir; the code-sha stamp) so the red is
  honest; (b) the architect rules them met by their building units (B1, mdone) with no receipt; (c) record a red at a
  pre-organ commit by hand (the receipt cannot: no typed verdict, `:26`). **Recommend (a).**
- **F3 · how the rehearsal re-points the meter.** (a) copy `scripts/` beside a snapshot under `os.tmpdir()` (proven:
  `ci/mwit/plant_day.mjs`); (b) an env door in `daily_green.mjs` honoured only under `os.tmpdir()` (the receipt's F5 shape) —
  against its own header's "no env var" (`:54-55`). **Recommend (a).**
- **F4 · clauses 9-11 in a rehearsal** (they read the machine NOW, `:69`). (a) carry the recorded day's 9-11 verdicts from
  its meter row; (b) N-A in the rehearsal and `would_be_11` judged over 1-8 + the recorded 9-11; (c) read the night machine
  live. **Recommend (a).** Decides it: whether the night machine's daemons/push state equals the day's (N3).
- **F5 · "still reads red on the old code".** (a) the meter's latest 2026-11-13 row (written by the code of that day) is
  red; (b) replay the 13 Nov snapshot with that row's code sha and read red. **Recommend (a) now, (b) once rows carry
  `code_sha`.** Decides it: whether a 13 Nov state snapshot exists on his laptop (N10).
- **F6 · the census size and the capability-rung set.** (a) read from the plan v3 list (campaign); (b) a constant typed in
  the witness — forbidden by the brief ("never type a size"); (c) the census file's writer declares its own size. **Recommend
  (a).** (Amended 19 Nov 2026: the capability set is now ten named clauses, so F6 binds the census size only.)
- **F7 · what makes a loop "read green".** (a) `loopVerdict` as built (four artefacts hashed — presence); (b) each loop in the
  plan v3 list names the meter clauses / witnesses it is judged by, and green = those read GREEN on the source. **Recommend
  (b).** Decides it: plan v3 line 100's text (N1).
- **F8 · grouping.** (a) one unit mleft for the four `done.mjs`-reading clauses; (b) census and capability rungs as their own
  units. **Recommend (a)** (one reader).
- **F9 · the exit of `done.mjs` itself.** (a) `done.mjs` exits nonzero unless all three checks are zero; (b) the witness
  carries the law, `done.mjs` stays exit 0 for the /matchday anchor. **Recommend (b).** Decides it: how the matchday skill
  treats a nonzero exit (measure at the anchor on his laptop).
- **F10 · witness location.** (a) `ci/witness/<unit>/` (land.mjs S1; a new file there lands only with the names-gate, Q4,
  `scripts/land.mjs:17-18`); (b) `ci/<unit>/` like `ci/mday/`. **Recommend (a).**
- **F11 · files beyond the named ones.** `scripts/organism_test.mjs` (each witness's plants in the hermetic table) and
  `package.json` (a selftest script line if the suite's coverage law asks it, `package.json:_selftest_coverage_law`). Rule
  them in or out per unit.
- **F13 · TEACHING GATE v2 (queued 23 Sep 2026, unruled) — the meaning and the check ids of the teaching capabilities.**
  C13 (what a non-answer demands), C18 (what a crack is), C28 (does park include the return), C29 (lane reach or teaching
  reach), C31 (what the away-brain GUARD guards) and every `capability_map.json` row depend on it. (a) rule TEACHING GATE v2
  first, then mcap builds the map from it; (b) mcap builds now on this seat's proposed maps (read off the G2 gate's own
  check names) and F13 re-maps later — a map change is a witness change, so `rung_receipt` refuses the old green
  (`witness changed`, `scripts/rung_receipt.mjs:200`); (c) split: build c07/c10/c12/c32 (names already explicit in the organs)
  now, hold c13/c18/c28/c29/c31. **Recommend (c).** Decides it: the spec file's text (N13) and the 6 Oct record line 16 (N12).
- **F14 · may a witness use an organ's selftest seam?** mcap's plants re-point `teaching_gate.mjs` through
  `ARSENAL_GATE_STATE_DIR` (`:80`, "the selftest's seam and nothing else's"). (a) the witness plants a copied `scripts/` tree
  under `os.tmpdir()` (the `plant_day.mjs` method, no seam); (b) widen the seam's declared users to `ci/witness/`.
  **Recommend (a).**
- **F12 · the meter's N-A on a non-study day.** The clause reads "11/11"; `row.green` is true on a non-study day with N-A.
  (a) the strict exit and witness require `greens === 11` (as designed); (b) accept `row.green`. **Recommend (a)** — the clause
  text, unedited.

## NAMED NOT GUESSED

- **N1** loops 2-7's definitions and plan v3 lines 84-147 — the plan is in the campaign tree (`tools/m/plan_v3.mjs`), not this
  repo. Measure: `node tools/m/plan_v3.mjs` in the campaign tree, lines 100-103.
- **N2** ~~which ten rungs are the capability rungs~~ — answered by the architect's message (19 Nov 2026): the ten C-ids below. Their definitions: N12.
- **N3** who runs `daily_green.mjs` and reads its exit on his laptop (Task Scheduler / conductor). Measure: `schtasks /query
  /fo LIST /v | findstr daily_green` and `git grep -n daily_green -- setup`.
- **N4** `ci_verdict.mjs` signed-out on his laptop with no proxy. Measure: `node scripts/ci_verdict.mjs <sha>` there with
  `GITHUB_TOKEN`/`GH_TOKEN` unset.
- **N5** `.git/land_ledger.jsonl` (rows, LANDED shas) — his clone only. Measure: `node scripts/land.mjs count`.
- **N6** his user-level `~/.claude/settings.json` permission mode. Measure: read `permissions.defaultMode` there.
- **N7** the campaign's launch ledger (unit → session id) and the runner transcripts. Measure: the campaign tree's launch
  record and `~/.claude/projects/*/*.jsonl` on the laptop.
- **N8** the canaries' pass lines and runs (cloud launch, Opus beside Fable, design fleet) — campaign/cloud acts. Measure:
  the campaign's canary records and `get_session` of each seat.
- **N9** the factory window row (file, writer) and the laptop test-load and memory-wait recorders. Measure: the campaign's
  window table; `node scripts/night.mjs status` for the memory floor's waits.
- **N10** a state snapshot of 13 Nov 2026 (for F5 (b)). Measure: `node scripts/archivist.mjs status` on the laptop.
- **N12** `ARCHITECT_PLAN_v2__2026-10-06.md` (line 16) — not tracked here. Measure: the architect's copy, line 16, and plan v3
  line 102 (`node tools/m/plan_v3.mjs` in the campaign tree).
- **N13** `queue/SPEC_v2__2026-09-23_teaching-gate.md` (TEACHING GATE v2) — cited by `scripts/teaching_gate.mjs:4`, not tracked.
  Measure: the file on his laptop / the campaign tree.
- **N14** the away-brain GUARD's definition and owner organ (C31). Measure: the 6 Oct record and TEACHING GATE v2.
- **N11** the live meter's rows after the 19 Nov cloud cut (his laptop writes it). Measure: `node ci/witness/mmeter/witness_meter.mjs day11` there, once built.

## CI of this push

Push of `57613d1` (19 Nov 2026), read by the public API with curl, no token:

```
135476577676 npm test · node 22 completed success
135476578501 npm test · node 24 completed success
NODE_USE_ENV_PROXY=1 node scripts/ci_verdict.mjs 57613d1722534db2f394bb88b449f3bcb6f889a0
ci_verdict 57613d1 GREEN — npm test · node 22: GREEN (base 4b00cf5 · 0 new red · 1 base red · 126 live) [run 135476577676] | npm test · node 24: GREEN (base 4b00cf5 · 0 new red · 1 base red · 126 live) [run 135476578501] (3 calls)
```

The commit that carries this section is judged by its own push; its runs are named in the seat's final message.
