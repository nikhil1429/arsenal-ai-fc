# MDAYQ SPEC — two cold questions at his day end, banked, then the close (unit mdayq, rows 1241 / 1242)

Spec seat, cloud, 21 Nov 2026. Branch `claude/mdayq-spec`, cut from `origin/main` at
`7bf008b9` (unit mclk on land/mdtl2 on land/mdet — measured: `git log --oneline -1 FETCH_HEAD` → `7bf008b unit mclk …`).
Built nothing. Edited no existing file. No live model call. Not a landing.
Every `file:line` below is at base `7bf008b` unless it names another branch.

## 0 · HEADLINE (21 Nov 2026)

The served design (row 1241 (1), approved by his word 279 "yes, approved") needs **four small code paths and two skill
lines**, and nothing else of his 5 Sep shape moves:

1. **A sixth legal moment kind `day_close`** in the ONE home of the moment fence — `scripts/forge_session.mjs:148` `MOMENTS`,
   mirrored by assertion in `scripts/teaching_gate.mjs:391` `MOMENT_KINDS` — and in study_scope's two lists that make a
   moment gut-bearing (`scripts/study_scope.mjs:231`) and bank-due (`scripts/study_scope.mjs:266`, `bankDueAt` `:267-272`).
   That one addition is "the fourth banked moment": the skeleton then prints the trio, the gate wants the gut word on that
   turn, and the bank is due on his reply, by the code that already does it for `sharp_check`.
2. **The gate the bank needs.** Measured: the bank door itself (`gaffer_brain.mjs capture`, `gradeCapture` `:1327`) has NO
   axis-close gate — it accepts any `voice_rep --surface code --axis <a-i>` today. What it lacks is a way to say which
   moment a row answered, and that gap has a cost: `axisDoneGate` (`scripts/forge_session.mjs:782-797`, filter `:791`)
   counts EVERY row on that axis since its `now` mark, so a day-close answer banked on the still-open axis would pay half
   the axis-done gate without the sharp check ever being asked. The gate is therefore a **row field `moment: "day_close"`**
   written by the bank and **excluded** by `axisDoneGate` (fork F3).
3. **The skip, by code** — a pure `dayCloseDue({session, history, D})` exported by the pacer (which owns both files it
   reads): not due when an axis was marked DONE on IST day D, or when the day holds no teaching turn; due otherwise, with
   the day's material named (fork F1 / F2).
4. **The order at his day end, by code** — `scripts/day.mjs end` (`:127-170`) gains a step 0 that, when the day is due and
   neither both day-close rows are banked nor `--dayq left` is given, **prints the ask and writes nothing** (exit 0); the
   model asks, he answers, the bank takes each answer, and the second `end` runs the close as today (fork F4).
5. **Two skill lines**: `.claude/skills/learn/SKILL.md:45-49` (step 5, day end) and `.claude/skills/forge/SKILL.md:39-44`
   (THE BANK: "THREE banked moments" gains the day-close one, the per-axis three unchanged).

What the runner's counts (21 Nov 2026, on his laptop, never re-derived here) say about why: from 17 Nov zero
`bank_answer` calls on every day, zero captures; a sharp check only on 13 and 16 Nov; axis marks on 15, 17, 21 Nov only.
So on most taught days of that window nothing of his was banked at all. The day-close moment is the one banked moment
that does not wait for an axis to close.

## 1 · THE SKILL LINES AND THE ORDER AT HIS DAY END (WHAT TO SPEC (1))

### 1.1 Where the day end lives today

| what | file:line | today |
|---|---|---|
| learn skill, day end | `.claude/skills/learn/SKILL.md:45-49` | "when HE means the study day is over … run `node scripts/day.mjs end` ONCE" |
| learn skill, the banked moments | `.claude/skills/learn/SKILL.md:56-60` | four elicitations + "THE BANK line at its three moments" |
| forge skill, THE BANK | `.claude/skills/forge/SKILL.md:39-44` | "At the axis's THREE banked moments only — the sharp check, the Bolo, the interview line" |
| forge skill, moment verbs | `.claude/skills/forge/SKILL.md:31` | `moment pehle_guess\|widget_gate\|check_q\|jirah\|sharp_check` |
| the end's own doc | `scripts/day.mjs:22-23`, `:30-40` | steps 1 pointer · 2 sitting close (fires the judge) · 3 postmatch autoclose · 4 evening organs · 5a night arm · 5 deal · 6 the ONE message |
| the end | `scripts/day.mjs:127-170` | refuse (`:129-131`) · already (`:132-134`) · pointer (`:137-141`) · `closeSitting` (`:144-148`, `:156`) · `machineHalf` (`:150-155`, `:157`) · night (`:161-162`) · deal (`:164`) |
| the close fires the judge | `scripts/sitting.mjs:1036-1044` | `queue` → `waiting > 0` or `banked > 0` → `judge-due --trigger sitting.close` |

### 1.2 The proposed order (the code path)

```
his meaning: the day is over (any words — no phrase list, L6; study_scope CLOSING :228 already marks such a prompt system-talk)
  └─ model: node scripts/day.mjs end [--pointer "…"]
       step 0 (NEW, read-only): forge_session.dayCloseDue({session, history, D})
         · not due (axis closed on D · no teaching turn · already 2 day-close rows banked on D) → steps 1..6 exactly as today
         · due, and no `--dayq left` → prints ONE block and RETURNS, writing nothing, exit 0:
             DAYQ · ask first · concept <c> · axis <x> (<name>) · today's material: <axes declared on D, by name> ·
             Q1 recall · Q2 what-it-does-not-do · one at a time:  node scripts/forge_session.mjs moment day_close
             · then bank his answer · then: node scripts/day.mjs end
  └─ model: `moment day_close`, asks Q1 (recall) with the trio as its last line (teaching_gate A.gut-by-moment :537)
  └─ he answers (gut word first) → bankDueAt says due → model banks:
       node scripts/gaffer_brain.mjs capture voice_rep <c>:<x> --axis <x> --surface code --moment day_close --probe recall --asked "<Q1>" [--latency_ms n]
       (mbank's code door takes HIS bytes and HIS gut word off the prompt record — §4.3)
  └─ `moment day_close`, Q2 (what it does NOT do), the trio → his answer → the same line with --probe negative_space
  └─ model: node scripts/day.mjs end   → step 0 reads 2 banked day-close rows on D → steps 1..6 as today;
       the sitting close sees `waiting > 0` (sitting.mjs:1038-1039) and the ONE judge of the day grades both (§4.4)
```

Why the ask lives in `end` and not only in the skill: L3 ("no sitting is run by prose") and the twelfth-start law in
CLAUDE.md — a skill line alone is the prose the 30 Jul root cause names (`forge_session.mjs:10-22`). The step 0 refusal is
the same shape as the pacer's three gates: it names the command that clears it.

### 1.3 The skill lines (text a build would write; nothing else in either skill changes)

- `.claude/skills/learn/SKILL.md:45` step 5 — after "run `node scripts/day.mjs end […]` ONCE." insert: "If it prints
  `DAYQ · ask first`, ask the two day-close questions ONE at a time, each after `moment day_close`, each with his gut word
  (the trio), bank each answer with `--moment day_close`, then run `end` again. If he says he is leaving before he answers,
  run `node scripts/day.mjs end --dayq left` — the day closes as taught, nothing banked, no card."
- `.claude/skills/forge/SKILL.md:41` THE BANK — "At the axis's THREE banked moments only …" gains one sentence: "Plus ONE
  day-close pair at his day end (`day.mjs end` asks for it by code): one recall, one what-it-does-not-do, each banked with
  `--moment day_close`. Never per idea."
- `.claude/skills/forge/SKILL.md:31` — the `moment` verb list gains `day_close` (the pacer selftest already fails a doc
  that drops a verb, `forge_session.mjs:71-82`).

## 2 · THE FOURTH BANKED MOMENT IN THE PACER, AND THE GATE THE BANK NEEDS (WHAT TO SPEC (2))

### 2.1 Every list that names the moment kinds, at base

| list | file:line | role | change |
|---|---|---|---|
| `MOMENTS` | `scripts/forge_session.mjs:148` | the ONE home (exported) | + `day_close` |
| `MOMENT_KINDS` | `scripts/teaching_gate.mjs:391` | the gate's fence, asserted equal to MOMENTS (`:1264-1270`) | + `day_close` |
| `GUT_BEARING_MOMENTS` | `scripts/study_scope.mjs:231` | a reply to it is an answer; the gate wants the trio (`teaching_gate.mjs:531`, `:537`) | + `day_close` |
| `BANKED_MOMENTS` | `scripts/study_scope.mjs:266` | the gate's test-moment set, read by `teaching_audit.mjs:1357`, `:1514`, `teaching_gate.mjs:717` | + `day_close` |
| `bankDueAt` | `scripts/study_scope.mjs:267-272` | the skeleton's [BANK] and the gate's B.bank, ONE predicate | + one line: `prev.includes("day_close") && c.answer` → "answers the day-close question your last turn declared" |
| B.moment / B.moment-kind fix text | `scripts/teaching_gate.mjs:145-146` | the patch words that list the legal kinds | + `day_close` |
| pacer selftest | `scripts/forge_session.mjs:1715-1716` | asserts `MOMENTS.length === 5` | re-based to 6 (L9: struck, not erased; a gate only gets stricter — the bogus-kind refusal stays) |
| organism_test | `scripts/organism_test.mjs:1083-1085` | `moment pop_quiz` must be refused | unchanged (still refused) |

`addMoment` (`scripts/forge_session.mjs:351-405`) needs no new branch: `day_close` falls to the common path, counted in
`question_moments`, in `moments_by_axis[current_axis]`, and logged with its axis and clock in `moments_log` (`:354-356`).
It is NOT subject to the one-check-question law (`:362`, that is `check_q` only) and never feeds `checkSpent` (`:345-349`).

### 2.2 The gate — measured, then proposed

Measured (read of the code, base 7bf008b):
- `gradeCapture` (`scripts/gaffer_brain.mjs:1327`) refuses: unknown type · no gut (`:1331`) · empty · no material · a code
  rep without `--axis` (`:1343-1344`) · a short `--asked` · a bad `--probe` · a bad `--register`. **No refusal reads the
  pacer, an axis close, or a session.** A day-close answer with an axis letter is accepted today.
- The row carries `axis`, `surface`, `probe`, `register` (`:1386-1395`) — **no field names the moment** it answered.
- `axisDoneGate` (`scripts/forge_session.mjs:782-797`): `mine` = every row on axis `a` with `ts` ≥ the axis's `now`
  mark (`:791`); "≥ 1 banked answer" is met by ANY such row. A day-close row on the open axis would meet it.
- `lockGate` (`:860-875`, the negative-space line `:872`): "≥ 1 `--probe negative_space`" over the session's rows — a day-close Q2 banked
  with that probe would meet the LOCK's negative-space requirement (fork F3 (c)).
- `closeGate` (`:881-889`): wants every banked row of the session judged — the day-close rows are judged at the same
  close (§4.4), so no change.

Proposed:
- `gradeCapture` takes `deps.moment`; the row gains `moment: "day_close" | null` (null when not declared, NEVER guessed —
  the A3 rule at `:1389-1391`). Legal values: `day_close` only (the three per-axis banked moments keep being identified as
  today). A `--moment` outside that set is refused like a bad probe.
- `axisDoneGate` `:791` filter gains `&& r.moment !== "day_close"`. Nothing else in the gate moves.
- The CLI parse at `scripts/gaffer_brain.mjs:2686-2696` (base; `:2737-2770` on `claude/mbank-build`) passes `flag("moment")`.

## 3 · THE SKIP, READ FROM THE PACER LEDGER BY CODE (WHAT TO SPEC (3))

The pacer is SOLE WRITER of both files the skip reads (`scripts/forge_session.mjs:23`, `:61-62`): the live
`forge_session.json` and the history `forge_sessions.jsonl` (`:105`). Each session object carries
`axes_marked_at[x] = {at, step, jirah_before}` (`markAxis`, `:286-304`) with the axis in `axes_done` or `axes_deferred`,
`axes_now_history[]` (`setCurrentAxis`, `:335-337`) and `moments_log[]` (`:354-356`). A history row carries
`axes_marked_at` too (`coverage`, `:978`).

```
dayCloseDue({ session, history, D, bank }) — PURE, exported by forge_session.mjs; day.mjs imports it (read only)
  sessions = [session, ...history rows]
  closedToday = any s, any x in s.axes_done with istDayOf(s.axes_marked_at[x].at) === D       → { due:false, why:"axis x (<name>) closed on D — its moments are banked" }
  taughtToday = any s with an axes_now_history / moments_log entry whose istDayOf(at) === D    (F2 decides the source)
  !taughtToday                                                                                   → { due:false, why:"no teaching turn on D", taught:false }
  banked = bank rows with moment "day_close" and istDay(ts) === D                                (gaffer_brain bankRows, read only)
  banked.length >= 2                                                                             → { due:false, why:"day-close pair banked", done:true }
  else → { due:true, concept, axis: the last axis declared on D, material: the axes declared on D by name, asked: banked.length }
```

A DEFERRED mark is not a close (`axes_deferred` is "deferred ≠ dropped", `:48-49`): only `axes_done` skips. Uses the pacer's
own `istDayOf` (`:648-651`), the same IST rule as `day.mjs:73`.

## 4 · THE FORKS OF ROW 1242 (2), EACH WITH OPTIONS (WHAT TO SPEC (4)) — full list in §8

### 4.1 How the teacher picks the two questions from that day's own material

Code drives, model composes (L3). Step 0 prints the material by code: the concept, the axes declared on D by letter AND
name (`axes_now_history`, his 9 Oct law), the moments declared on D with their kinds (`moments_log`), and the day's resume
pointer(s). The teacher composes Q1 (recall of an idea taught TODAY) and Q2 (what that idea does NOT do) from that list and
from the conversation it holds. The capsules (`dressing-room/state/capsules/*.json`) may say where he will break (their
`traps`), but a capsule is never the proof and never the source of the question: GAME ON (CLAUDE.md, 30 Aug 2026).
Options in F1.

### 4.2 No teaching turn that day · he says he is done and leaves before answering

- **No teaching turn on D** → step 0 says `not due (no teaching turn)`; steps 1-6 run as today. The day reads as it does
  today: nothing banked, no card for it.
- **He says he is leaving** (any words, read for meaning) → the model runs `day.mjs end --dayq left`: steps 1-6 run, the
  end line says `day-close: unanswered (he left) · day taught · nothing banked`, NO card is filed (no `captains_call file`
  is added anywhere — step 5 `deal` deals from the existing queue only, `day.mjs:164`).
- **He answers Q1 then leaves** → `--dayq left`; Q1 is banked and is judged by the same close; Q2 is simply not asked.
- **He walks away with no message** → no turn exists to run anything; the night code closes the day
  (`scripts/conductor.mjs:158` `dayclose` 22:57 → `postmatch.mjs autoclose --anchor evening`; `:106` the morning
  `dayclose-prev`). Measured consequence: `day.mjs dayProof` (`:204-213`) says such a day is not a REAL day (no fulltime
  close) — that is the base's behaviour for any day he never ends, unchanged by this unit.
- **"Never red on him"**: measured, the day meter `scripts/daily_green.mjs` clause 1 `cReps` (`:181-187`) and clause 4
  `cExaminer` (`:232-238`) already print RED on a study day with zero reps / no settled row — they did on every day from
  17 Nov by the runner's counts. That RED is the instrument's verdict on the organism, but row 1241 (2)'s "na" branch says
  the meter should name such a day *taught, nothing banked, never red*. That is a `daily_green.mjs` edit, outside row
  1242 (1)'s scope → fork F6.

### 4.3 His words through the mbank door (unit mbank, `claude/mbank-build` @ `cfdf866`)

mbank's code door: a capture carrying `--said` or `--surface code` takes HIS bytes from the prompt record through
`forge_session.mjs hisPrompt` (mbank `:651-674`), refuses an absent / consumed / other-session / no-turn-id record, and
reads the gut word off HIS message (`codeDoorWords`, mbank `gaffer_brain.mjs:1322-1358`), refusing a `--gut` that is not
his (row 270). A day-close answer goes through exactly that door — **mdayq adds no word path of its own**. Two
dependencies on mbank: (a) the gut word is read by `classifyPrompt` only on a reply to a gut-bearing moment
(`study_scope.mjs:244`) → `day_close` must be in `GUT_BEARING_MOMENTS` (§2.1) or mbank's door reads `gut: undefined` and
base `gradeCapture` `:1331` refuses `no-gut`; (b) mbank requires the prompt record of THIS turn (`fresh: true`), so the
bank line must run in the turn his answer arrives, before `end`.

**Every line where the two units would touch the same code** (mbank diff vs 7bf008b, from `git diff -U0 7bf008b
origin/claude/mbank-build`):

| file | mbank edits (its hunks) | mdayq would edit | same line? |
|---|---|---|---|
| `scripts/gaffer_brain.mjs` | `:129` import · `:1322-1358` code door · `:1370-1373` · `:1439-1451` row fields (spoken_src, turn_id, prompt_at, session_checked, dup check) · `:2737-2770` CLI capture · `:3540-3562` selftest | row field `moment` beside `:1393` (base) = mbank's row block `:1439-1451` · CLI `flag("moment")` in the `gradeCapture` call `:2758-2762` (mbank) · selftest | **YES — the row object and the CLI call** |
| `scripts/forge_session.mjs` | `:651-674` hisPrompt · `:683-699` crackRow · `:820` · `:896` gate messages · `:2725-2734` selftest | `:148` MOMENTS · `:791` axisDoneGate filter · a new pure `dayCloseDue` · `:1715` selftest | `:820` / `:896` are message strings of the same two gates — adjacent, not the same line |
| `scripts/study_scope.mjs` | `:217-219` GUT_LEAD area | `:231`, `:266`, `:267-272` | no |
| `scripts/teaching_gate.mjs` | `:141`, `:143` (B.bank, B.bank-verbatim fix text) | `:145-146` (B.moment fix text), `:391` | adjacent rows of the same `CHECKS` object |
| `.claude/skills/learn/REFERENCE.md` | `:465+1` | — | no |

So mdayq builds ON mbank (fork F5 (a)).

### 4.4 The judge of these two rides the same close, with unit mjset (`claude/mjset-spec` @ `2a5838c`)

The two rows are banked BEFORE step 2. The sitting close then reads `gaffer_brain.mjs queue` → `waiting > 0`
(`scripts/sitting.mjs:1036-1039`) and fires `judge-due --trigger sitting.close` (`:1044`) — the day's ONE judge, by code,
no new call. mdayq adds no judge path. What mjset changes (its §1-§3: the killed child, the self-block "no batch fits the
budget", the join) decides whether that round actually settles them; until mjset lands, the day-close pair waits like
every other capture and is retried at the next carrier (`postmatch.mjs:853-860` day close). mjset touches
`gaffer_brain.mjs:1420-1442`, `:2045-2054`, `:2108`, `:2399-2431`, `:3534-3536` (its §11) — none is a line mdayq edits.

## 5 · NOTHING ELSE OF HIS 5 SEP SHAPE MOVES (WHAT TO SPEC (5))

- **No bank per idea**: `check_q`, `pehle_guess`, `widget_gate` stay out of `BANKED_MOMENTS` (W6 plants it).
- **No gut word per idea**: `GUT_BEARING_MOMENTS` gains `day_close` only; `check_q` stays trio-less (`forge_session.mjs:146`).
- **No new card**: no `captains_call.mjs file` is added; `day.mjs:164` `deal` unchanged (W7 plants it).
- **Nothing he must remember beyond ending his day**: the ask is printed by code to the MODEL at `end`; he types nothing.
- The axis's three banked moments, the three pacer gates and their bypass flag (`:778`) are unchanged except the one
  `:791` exclusion.
- Until mdayq lands nothing changes in his sittings (row 1242 (4)); the architect tells him the day it is live.

## 6 · EVERY MODEL CALL IN A WITNESS IS PLANTED (WHAT TO SPEC (6)) · THE PORT CLASS (row 1053)

No clause reaches `claude -p`, an API key or the network. The close's judge is planted the way `sitting.mjs` already
plants it in its selftest (`scripts/sitting.mjs:1552`, a stubbed `owner` for `judge-round` / `judge-due`); `day.mjs end`
steps that spawn owners run in a temp org tree with `ARSENAL_SITTING_STATE_DIR` under `os.tmpdir()` (`day.mjs:55`).
A planted `claude` on `PATH` writes a marker under the temp dir; every clause asserts the marker is absent. No clause binds
a fixed port, names a live service, POSTs at a daemon or restarts anything: the sitting's daemon is DOWN in every plant, so
`closeDoor` takes its local door (`day.mjs:33`, F10 of mday); any port is planted only through an env door under the temp
dir, every wait bounded by the owner's own bound (`sitting.mjs ownerTimeoutMs`, read, never typed).

## 7 · THE WITNESS A BUILD WOULD CARRY (WHAT TO SPEC (7)) — RED on base 7bf008b, GREEN on the build, one mutant each

Shape: `ci/mdayq/witness_mdayq.mjs --org <head tree> --base-org <base tree>` running the head's clause code
`ci/witness/mdayq/witness_dayq.mjs plants --org <tree>` once per tree (the mmeter / mbank shape); `ci/mdayq/run_mutants_mdayq.mjs`.
All state planted under `os.tmpdir()` by node, never under a `dressing-room/state` path.

| clause | plant | base | build | mutant |
|---|---|---|---|---|
| W1 KIND | `moment day_close` on a planted live session with axis c ON | refused (`moment not …`) | counted in question_moments, moments_by_axis.c, moments_log with axis c | M1 drop `day_close` from MOMENTS |
| W2 FENCE | pacer MOMENTS vs gate MOMENT_KINDS vs skeleton kinds | equal, 5 kinds | equal, 6 kinds, `day_close` in all | M2 add it to MOMENTS only (fence assert RED) |
| W3 GUT + DUE | `classifyPrompt("shayad - wo X karta hai", {prevMoments:["day_close"]})` and `bankDueAt` | gut read only because of the lead; `bankDueAt` null | answer true, due "answers the day-close question …" | M3 drop `day_close` from BANKED_MOMENTS |
| W4 ROW | `gradeCapture` dry with `moment: "day_close"`; and with `moment: "pop"` | no `moment` field | row.moment === "day_close"; "pop" refused `bad-moment`; absent → null | M4 default an absent moment to `day_close` |
| W5 AXIS GATE | axis c opened; ONE planted bank row axis c `moment:"day_close"` after the mark | `axis c done` gate: ok on the banked-answer half | refused "no banked answer for axis c" | M5 remove the `:791` exclusion |
| W6 NO PER-IDEA BANK | `bankDueAt` after `check_q`, `pehle_guess`, `widget_gate` | null | null | M6 add `check_q` to BANKED_MOMENTS |
| W7 SKIP | `dayCloseDue` on (i) axis b done on D · (ii) axis b deferred on D · (iii) nothing declared on D · (iv) declared on D, nothing banked · (v) two day-close rows on D | no such export | (i) not due · (ii) due · (iii) not due, taught false · (iv) due with axis + material · (v) not due, done | M7 count a deferred mark as a close |
| W8 ORDER | temp org, sitting open, due day, `day.mjs end` | closes the sitting | prints `DAYQ · ask first`, sitting.json byte-identical, no postmatch file, no night row, no deal | M8 run step 0 after `closeSitting` |
| W9 ANSWERED | same tree + two planted day-close rows on D, `end` | — | closes; the planted judge stub is called once with `--trigger sitting.close` and the queue holds the 2 rows | M9 skip the bank read (always "ask first") |
| W10 LEFT | due day, `end --dayq left` | flag ignored, closes | closes; line carries `unanswered (he left) · day taught · nothing banked`; captains_call file byte-identical apart from `deal`'s own write (diffed against a base `end`) | M10 file a card on `left` |
| W11 NO LIVE CALL | every clause, planted `claude` on PATH | no marker | no marker | M11 call the real judge (marker written) |
| W12 NO REGRESSION | `forge_session.mjs`, `study_scope.mjs`, `teaching_gate.mjs`, `gaffer_brain.mjs`, `day.mjs` selftests + `ci/mday/witness_mday.mjs` | GREEN | GREEN | — |

W8-W10 replay mday's own temp-org plant (`ci/mday/witness_mday.mjs`), whose F-clauses already exercise `end`'s order.

## 8 · FORKS — every choice the architect must rule

- **F1 · where the two questions come from.** (a) step 0 prints the day's material by code (concept, axes declared on D
  by name, moments of D, pointers of D); the teacher composes both from it and the conversation; capsule traps may inform,
  never source · (b) the teacher composes from the conversation alone (no printed material) · (c) code picks the idea (the
  last `moments_log` entry on D before `end`), the teacher only words it. **Recommend (a)** — L3, and it costs zero tokens.
  Decides it: a planted day with two axes declared; (a) prints both by name, (c) picks one by a rule nobody ruled.
- **F2 · what counts as "a teaching turn" on D.** (a) the pacer's own ledger: an `axes_now_history` or `moments_log` entry
  on D (one owner, the same reader as the skip) · (b) `teaching_audit.jsonl` rows with `scope:"study"` on D
  (`teaching_audit.mjs:159`, its single writer; legacy rows are unstamped, `:1816-1817`) · (c) either. **Recommend (a).**
  Decides it: the runner's counts — on 18 and 19 Nov the turn counts are 3 and 4 with 1 and 3 pacer moments; a day with
  turns and zero moments has not been seen in 13-21 Nov; a laptop count of such days over all history would settle it.
- **F3 · the gate the bank needs.** (a) `moment: "day_close"` row field, excluded from `axisDoneGate` only · (b) the same,
  AND excluded from `lockGate`'s negative-space count, so the LOCK still asks its own concept-level negative-space probe ·
  (c) no field; bank the pair with `--probe recall` / `negative_space` and accept that it pays the axis and LOCK gates.
  **Recommend (b)** — the LOCK's negative-space probe is on the WHOLE concept (`forge_session.mjs:872`); a day's
  one-idea Q2 is not that. Decides it: W5 plus a W5' on `lockGate`.
- **F4 · the order at his day end.** (a) step 0 inside `end` (ask first, write nothing, the second `end` closes) ·
  (b) a separate read-only verb `day.mjs dayq` the skill line runs before `end` (prose-held: a session that skips it closes
  with no questions) · (c) close first, ask after (the judge would not ride the same close; violates row 1242 (1)).
  **Recommend (a)**. Decides it: W8; (b) cannot carry W8 because nothing refuses.
- **F5 · landing with mbank and mjset.** (a) mbank → mjset → mdayq, mdayq built on the merged tip (same lines in
  `gaffer_brain.mjs`, §4.3) · (b) mdayq before mjset (no shared line with mjset; the pair then waits on the self-block).
  **Recommend (a).** Decides it: `git merge-tree` of the three tips at build time.
- **F6 · the meter on a taught day with nothing banked ("never red on him").** (a) out of scope: named to the meter's
  owner (daily_green / unit mmeter) as a count, ruled later · (b) mdayq's build edits `daily_green.mjs` clauses 1 and 4 to
  N-A `taught · nothing banked` when `dayCloseDue` says `left` / `not due (no teaching turn)`. **Recommend (a)**: row 1242
  (1) names the scope exactly, and the clauses are RED today for the same days. Decides it: the runner's count of study
  days since 13 Nov whose clause 1 reads RED (laptop, `daily_green.jsonl`).
- **F7 · the axis letter a day-close row carries** when no axis is ON at `end` (the bank refuses a code rep without one,
  `gaffer_brain.mjs:1343-1344`). (a) the last axis declared on D, printed by step 0 · (b) not due when no axis was declared
  on D · (c) a concept-level row with `axis:null` (needs the code-no-axis refusal relaxed — a gate getting looser: refused
  by the law). **Recommend (a)**, (b) as its fallback.
- **F8 · one question per turn.** (a) Q1, his answer, bank, then Q2 (the one-question-per-message law, HOW_HE_LEARNS #1) ·
  (b) both in one message. **Recommend (a)**; (b) is the quiz-dump shape the gate's R2 refuses.
- **F10 · a day-close answer the door refuses (another session's prompt in the slot, or no session id).** Options and recommendation in ROW 1246: (a) refuse `no-session`, re-ask once, then `end --dayq lost` · (b) straight to `--dayq lost` · (c) wait for the per-session record. **Recommend (a).**
- **F9 · the two crack refusals of 21 Nov (row 1241 (3)).** Named to the mcrk owner, not specced here: (i) "no axis is ON"
  (`forge_session.mjs:658`), (ii) "no moment declared on axis d before his answer" (`:667`). The runner counts, over the
  days since mcrk landed, how many refusals cost a captured crack; counts only, then ruled. mdayq does not touch `crackRow`.

## 9 · NAMED NOT GUESSED — what the cloud cannot reach

- Whether the registry row `probe_kinds` (`gaffer_brain.mjs:913`, read from `registry.json`, a state file) holds `recall`
  and `negative_space` on his laptop (the forge skill documents both, `.claude/skills/forge/SKILL.md:45`). Measures it:
  `node -e "import('./scripts/gaffer_brain.mjs').then(m=>console.log([...m.PROBE_KINDS].join(' ')))"` on his laptop.
- Whether any day in his history had teaching turns but no pacer entry (F2). Measures it: the runner's per-day count of
  study-scoped `teaching_audit.jsonl` rows vs `moments_log` / `axes_now_history` entries, all IST days.
- How often he ends a day with words that the model must read as "leaving" vs "done" — no record exists; measured only
  after a build, by counting `--dayq left` lines in `sitting_reviews.jsonl` closes.
- Whether the judge round settles two day-close rows at the sitting close on his machine before mjset lands — mjset §9.
- The hermetic suite in this cloud checkout has no `node_modules` (7 members exit on `ERR_MODULE_NOT_FOUND` /
  bare-checkout skips, §10); the neutral CI machine and his laptop install them.

## 10 · MEASUREMENTS BY COMMAND (this seat, cloud, 21 Nov 2026; last line each, also in `ci/mdayq/LEDGER.jsonl`)

```
git fetch origin main && git log --oneline -1 FETCH_HEAD   → 7bf008b unit mclk (forks rows 1227 / 1228 …)
node scripts/forge_session.mjs selftest                     → forge_session selftest: 243 passed, 0 failed
node scripts/study_scope.mjs selftest                       → study_scope selftest: 61 passed, 0 failed
node scripts/teaching_gate.mjs selftest                     → teaching_gate selftest: 130 passed, 0 failed
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
                                                            → organism_test: 150 passed, 8 failed · ruled 0 · UNRULED 8 · LIVE 125 (hermetic: named, not run)
   (the 8: lawpack, ci_verdict, red_cause, done, probe, fsrs, mutagen members + the all-members assert — no node_modules in this checkout)
git diff --stat 7bf008b origin/claude/mbank-build | tail -1 → 16 files changed, 858 insertions(+), 17 deletions(-)
git diff --stat 7bf008b origin/claude/mjset-spec | tail -1  → 2 files changed, 378 insertions(+)
```

## 11 · FILES A BUILD WOULD TOUCH

- `scripts/forge_session.mjs` — `:148` MOMENTS · `:791` axisDoneGate · `lockGate` negative-space count (F3 b) · new pure
  `dayCloseDue` (exported) · `:1715-1716` selftest re-base · the usage line `:3319` (derived) · its own asserts.
- `scripts/study_scope.mjs` — `:231`, `:266`, `:267-272` · its selftest (`:835-849` region).
- `scripts/teaching_gate.mjs` — `:145-146` fix text · `:391` MOMENT_KINDS · its fence assert stays as is.
- `scripts/gaffer_brain.mjs` — `gradeCapture` row field `moment` + its refusal · CLI `flag("moment")` · selftest.
- `scripts/day.mjs` — step 0 in `end` (`:127-136`), `--dayq left` parse (`:239`), the doc block `:30-40`, `QUESTIONS` untouched.
- `.claude/skills/learn/SKILL.md:45-49` · `.claude/skills/forge/SKILL.md:31`, `:41`.
- `ci/mdayq/` (witness, mutants, BASE, LEDGER, PROOF) · `ci/witness/mdayq/witness_dayq.mjs`.
- **Beyond them, each a fork:** `scripts/daily_green.mjs` (F6 b) · `scripts/learn_digest.mjs:161` (its "three banked
  moments an axis" line — accurate as written, since the day-close pair is per DAY; touch only if the architect wants the
  digest to print it) · `scripts/teaching_bar.mjs:301-306` (reads `bankDueAt`, no edit needed; named because its selftest
  `:624-635` will exercise the new kind).

## ROW 1246 · EVERY PLACE THIS UNIT TAKES HIS WORDS, AND WHO ELSE CAN WRITE THE SLOT (architect, by the runner, 21 Nov 2026)

The ground (runner, his laptop, counts only, never re-derived here): `scripts/teaching_audit.mjs` `promptHook` (`:1635`,
the record `prompt: { text, …, session_id, at }` at `:1640-1650`) writes `teaching_audit_last.json` on EVERY
UserPromptSubmit of every session in this repo. Its one guard is `ARSENAL_ORGAN=1` (`:1872`), so the runner and architect
sessions write it too. The audit's own Stop rows for 17-21 Nov: 101 audited turns, 43 session-mismatch. mbank is being
amended so that teaching_audit keeps the record PER SESSION and `hisPrompt` reads its own session's record.

### Where mdayq takes his words (file:line at 7bf008b, plus the mbank lines it would ride)

| # | words | read where | through hisPrompt with its own session id? |
|---|---|---|---|
| R1 | the day-close answers Q1 / Q2 (the bytes banked) | `gaffer_brain.mjs capture` code door: on `claude/mbank-build` `cfdf866` `scripts/gaffer_brain.mjs:2748-2752`: `sessionId = CLAUDE_CODE_SESSION_ID`, `readHisPrompt({ sessionId, fresh: true, needTurn: true })` (`scripts/forge_session.mjs:674` → `hisPrompt` `:661-672`, the session check `:668`), then `codeDoorWords` | **YES.** mdayq adds no reader. It only adds `--moment day_close` to the same call. At base `7bf008b` there is no door: `scripts/gaffer_brain.mjs:2688-2689` takes `--said` (the teacher's copy) or stdin. So mdayq must build on mbank (F5 (a)). |
| R2 | his gut word on each day-close answer | `codeDoorWords` → `classifyPrompt(prompt.text)` over the SAME `prompt` object from R1 (mbank `gaffer_brain.mjs:1322-1358`) | **YES**, the same read. It is not a second one. |
| R3 | whether his message is an answer (so the bank is due) | the gate and the skeleton classify the turn's prompts from the session's OWN transcript (`scripts/teaching_gate.mjs:337`, `prompts.push` per transcript line), then `bankDueAt` (`study_scope.mjs:267`) | Not through hisPrompt, and it needs no session id: the transcript is this session's own file. It never banks bytes, only says "due". |
| R4 | the crack row | **mdayq does not touch it.** Base `scripts/forge_session.mjs:3292` → `crackRow` (`:652-677`) reads `auditLast.prompt` directly (`:659-662`). The only check is the `since` floor, with no session id. On mbank, `:683` reads `hisPrompt(auditLast, { since })`, still **without `sessionId`** | **NO, today and on mbank `cfdf866`.** The crack row would inherit the per-session record only if mbank's amendment makes `crack` pass `CLAUDE_CODE_SESSION_ID` the way the bank does at `:2748-2750`. This is named to the mbank / mcrk owners. It is not fixed here. |
| R5 | `day.mjs end` step 0 and `dayCloseDue` | read the pacer's `forge_session.json` + `forge_sessions.jsonl` and the bank's rows (`bankRows`, `gaffer_brain.mjs:927`) | They read no words at all, only moments, marks and bank rows by day. |

So mdayq reads his words in exactly one place, R1, through `hisPrompt` with its own session id. When mbank's per-session
record lands, R1 inherits it with no mdayq change. R4 is the one reader with no session id, and it belongs to mcrk.

### The case: his answer and another session's prompt in the same turn

1. He types Q1's answer in his study session S. promptHook writes the slot: `{text: his answer, session_id: S}`.
2. Before the model's bank line runs in S, a runner or architect prompt in session R overwrites the shared slot:
   `{text: R's prompt, session_id: R}`. This is the 43-of-101 class.
3. **The shared slot as it stands (mbank `cfdf866`):** `readHisPrompt({ sessionId: S })` returns `other-session` (`:668`).
   The bank refuses (`gaffer_brain.mjs:2751`), and nothing is banked: no copy of his words, and no row in R's words.
   Without a session id (`CLAUDE_CODE_SESSION_ID` unset) the check is skipped (`:668` needs `sessionId`), and R's words
   would be banked as his. The row's `session_checked: false` would be the only trace (mbank `gaffer_brain.mjs:1445`).
4. **The per-session record (the amendment):** S reads S's own record. R's prompt cannot reach it, so the case cannot
   happen for R1.

**What mdayq does then (fork F10):**
- (a) **Recommended.** A `day_close` bank refuses without a session id. This is stricter only, mdayq-scoped: `--moment
  day_close` with `sessionId` null is refused `no-session`. On an `other-session` refusal the teacher asks the SAME
  question once more, as one turn with the trio. His re-typed answer then lands as a fresh record of S. If that is
  refused again, the model runs `day.mjs end --dayq lost`. The close runs and the line says `day-close: answer not
  banked (door refused: other-session) · day taught`. Nothing is banked, there is no card, and nothing is red on him.
  `dayCloseDue` (§3) counts banked rows only, so a refused answer is never counted as asked-and-banked. Once the
  per-session record lands, the re-ask path stays as dead weight but harmless, and the next build may strike it (L9).
- (b) No re-ask: the first refusal goes straight to `--dayq lost`. He re-types nothing, but one parallel prompt costs
  the answer.
- (c) Wait for mbank's amendment before mdayq builds (F5 (a) already orders mbank first). Then (a)'s re-ask is never
  written, and only the `no-session` refusal is kept.

What decides it: the runner's 43 / 101 mismatch rate measured again AFTER the per-session record lands. If it reads 0 for
the code door, choose (c). New witness clauses for a build:
- **W13 PARALLEL PROMPT:** a planted slot whose `session_id` is not the bank's. Base (mbank tip): refused `other-session`.
  Build: refused, no row, `end` prints `ask first` again. Mutant M13 drops the `sessionId` argument.
- **W14 NO SESSION ID:** `--moment day_close` with `CLAUDE_CODE_SESSION_ID` unset. Base: banked, `session_checked`
  false. Build: refused `no-session`. Mutant M14 lets the null id through.

## 12 · CI ON THIS PUSH

Filled after the push from the public check-runs API (`curl https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`).
