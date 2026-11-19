# mguard · C:capability-c31, THE SPEND GUARD — SPEC (forks row 1163 (6), 19 Nov 2026 UTC)

RESUMED 2026-11-19 (his word #270) from `CHECKPOINT · STOPPED at 2026-11-19T12:38Z` (tip `4ab7872`). This file is the
whole spec; the checkpoint line is kept in the LEDGER.

**Headline (19 Nov 2026, measured at the cut):** the headroom figure has ONE writer (`scripts/usage_tap.mjs`) and ONE
surface (his statusLine), but **nothing reads spend inside an away span**: the tap keeps one overwritten reading, the
session meter has no time inside a day, and away spans live only inside a pure function fed live from ActivityWatch.
So c31 reads **2 (UNREAD) at the cut** and cannot read green until the tap keeps a reading history and presence records
the spans it already computes. The guard proposed here READS and SHOWS; it never throttles (his words 264-268).

Branch `claude/mguard-spec`, cut from `origin/main` at **`fb42118`** (`fb4211870093e6b8657655eb02ebcfc425f1eab1`, fetched
2026-11-19 UTC). Every `file:line` below is at that base. Source design: `git show 88bf69d:ci/mwit/MWIT_SPEC.md`,
§C:capability-c31 and UNITS row 13 (unit mguard, `ci/witness/mguard/witness_guard.mjs`). This seat builds nothing.
Ledger: `ci/mguard/LEDGER.jsonl`.

## 0 · The clause, as row 1163 (6) gives it

*"c31 is the spend guard, not a lesson guard: unit mguard is a spec seat now: it names the reader of spend inside an away
span, the writer of the headroom figure and the surface where he sees it, then the witness."* The mwit design's
"AWAY-BRAIN GUARD" / FORK F13 / N14 question (what it guards) is therefore ANSWERED by the row: spend. This spec does
not depend on TEACHING GATE v2. Exit law: mwit §0 (0 holds · 1 red · 2 unread, never a green).

## 1 · Measured at the cut (by command, last line verbatim; 19 Nov 2026)

```
git rev-parse origin/main
fb4211870093e6b8657655eb02ebcfc425f1eab1

node scripts/usage_tap.mjs selftest | tail -1                      (19 Nov 2026)
usage_tap selftest 31/31 — all clauses hold

node scripts/usage_tap.mjs verdict ; echo exit $?
WAIT · no campaign root (ARSENAL_CAMPAIGN_ROOT unset) · five-hour ?% · weekly ?% · age ? min · source none
exit 3

node scripts/usage_tap.mjs status
WAIT · no campaign root (ARSENAL_CAMPAIGN_ROOT unset) · five-hour ?% · weekly ?% · age ? min · source none

node -e 'import("./scripts/presence.mjs").then(m=>console.log(typeof m.awayIntervals, JSON.stringify(m.awayIntervals([{timestamp:"2026-11-19T00:00:00Z",duration:600,data:{status:"afk"}}]))))'
function [[1795046400000,1795047000000]]

git grep -n -i "away.brain\|spend.guard" -- ':!dressing-room' ':!docs'
scripts/brain.mjs:5604 … :5631 "S12 SPEND-GUARD" — a VERB guard on brain's argv (an unknown verb never means `tick`), NOT this clause

git grep -n "usage_tap\|usage_reading" -- ':!dressing-room' ':!scripts/usage_tap.mjs'
.claude/settings.json:88 (statusLine) · .claude/skills/runner/SKILL.md:106,113 · scripts/day.mjs:20,115-118 · scripts/organism_test.mjs:2232-2234 · package.json:18

ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all ; echo exit $?   (19 Nov 2026, this cloud container)
exit 2      — its tail names ERR_MODULE_NOT_FOUND (fsrs, mutagen): the container lacks the modules; the neutral legs are the judge
```

## 2 · The three answers (each by file:line at `fb42118`, with its owner)

### 2.1 The writer of the headroom figure — `scripts/usage_tap.mjs` (owner: itself)

- SOLE WRITER of `usage_reading.json`, which lives in the CAMPAIGN ROOT, outside this public repo
  (`scripts/usage_tap.mjs:10-11`); env door `ARSENAL_CAMPAIGN_ROOT`, default absent ⇒ writes nothing (`:12-13`, `:63-67`).
- Its input is Claude Code's statusLine stdin, `rate_limits.five_hour` / `rate_limits.seven_day` → `used_percentage` +
  `resets_at` (`:4-7`, `parseStatusline` `:93-115`). Its one write is tmp + rename (`writeReading` `:118-122`). A second
  source is his spoken panel (`panel` `:186-196`, source `his-panel`).
- The headroom figure is `100 − used_percentage` of each window, at the reading's `read_at`. It is the ONLY figure in the
  repo that sees the WHOLE pool (cloud seats, his laptop sessions and the organism share one plan).
- **Not the headroom figure (named so no build takes it):** `brain.mjs` `tokenVitals` → `token_vitals.json`
  (`scripts/brain.mjs:126`, `:1085-1137`; `headroom()` `:466-487`) — the organism's ledger against ESTIMATED caps
  (`DEFAULTS.budget` `:139`). The tap's own header says it is not a pool source (`scripts/usage_tap.mjs:22-23`) and its
  selftest holds that it never reads it (W1.5, `:259`).

### 2.2 The surface where he sees it — his statusLine (owner: `usage_tap.mjs statusline`)

- `.claude/settings.json:86-90` runs `node "$CLAUDE_PROJECT_DIR/scripts/usage_tap.mjs" statusline` on every render.
- The printed line is `five-hour N% · weekly N% · read now` (`scripts/usage_tap.mjs:171-175`), exit 0 always, inside the
  ruled bound (`:24-26`, `:156-182`).
- Second surface: the learn start — `scripts/day.mjs:115-118` runs `usage_tap.mjs need` once and puts the pool note in
  the start line; on WAIT-for-no-source it files ONE keyed card through `captains_call.mjs file` (`usage_tap.mjs:204-210`,
  `CARD_LINE` `:152`).
- What he SEES is printed, never recorded: nothing on disk says which line he was shown. A witness cannot read stdout
  after the fact — so §3 makes the tap record what it showed.

### 2.3 The reader of spend inside an away span — NONE at the cut

| candidate | why it cannot read it today | file:line |
|---|---|---|
| `usage_tap.mjs` reading | ONE reading, overwritten each render: no figure at the span's start AND its end | `scripts/usage_tap.mjs:118-122` |
| `session_meter.mjs` | a row is `[key, lane, weighted, output]` under its IST DAY — no time inside the day; reads only laptop transcripts, blind to cloud seats | `scripts/session_meter.mjs:166`, `:5`, sole writer `:4` |
| `brain.mjs` `windowUsage` | per-row ts, but the organism's half only (`engine === "claude"` rows of brain_ledger) | `scripts/brain.mjs:448-458` |
| `presence.mjs` `awayIntervals` | the away SPANS exist only as a pure function over AW AFK events fetched live (`fetchAfkEvents` `:594`, AW at `:39`); the focus row it appends (`:735`) does not carry them | `scripts/presence.mjs:476-495`, export `:1118`, sole writer of presence_log.jsonl `:16` |

So the c31 reader is a NEW pure function over two records that do not yet exist: a reading history (owner: the tap) and
recorded away spans (owner: presence).

## 3 · The code path proposed

**P1 · the reading history (owner `usage_tap.mjs`, its own file, campaign root).** `statusline` and `panel` also append the
reading to `usage_readings.jsonl` beside `usage_reading.json`, only when it differs from the history's last row in a pct or
a reset (dedupe by value; no typed count, no typed interval). The header contract becomes "SOLE WRITER of
`usage_reading.json` and `usage_readings.jsonl`". Its selftest W3.1 (`:264`, "the only writes are the reading's tmp and its
rename") is replaced by a stricter one naming exactly the three writes (FORK G4). Same env door, same fail-open, same
statusLine bound: the append is one line.

**P2 · the recorded away spans (owner `presence.mjs`, its own file `presence_log.jsonl`, gitignored `.gitignore:256,260`).**
The focus row (`:735`) gains `away: [[startIso, endIso], …]` = `awayIntervals(afk)` (`:476`) as ISO, and `back_at` = the
start of the first `not-afk` event after the last afk span (null while he is still away). A span is CLOSED iff `back_at`
is set and is after its end. Nothing new is fetched: the AFK events are already fetched on that pass (`:733`).

**P3 · the reader `spanSpend(readings, span, rule)` — PURE, exported by `usage_tap.mjs` (the readings' owner).**
- `r0` = the last history row with `read_at ≤ span.start`; `r1` = the first with `read_at ≥ span.end`. Each edge gap must be
  under the age bound read from its law home (`readRule`, `:77-83`; the bound is NEVER typed — `POOL_READING_MAX_AGE_MIN`
  in the campaign's `tools/model_law.mjs`). Otherwise the span is UNREAD (`why: "unbracketed"`).
- If a window's `resets_at` (on `r0` or any row between) falls inside `[r0.read_at, r1.read_at]`, that window is UNREAD
  (`why: "rolled"`), FORK G3.
- Else, per window: `spent = r1.pct − r0.pct`, `left = 100 − r1.pct`, over the bracket `[r0.read_at, r1.read_at]`
  (a cover of the span, stated as such — never claimed to be the span exactly).

**P4 · the surface records what it showed (owner `usage_tap.mjs statusline`).** On a render, if `presence_log.jsonl`'s tail
(read through presence's own exported reader `presenceTail`, `:306-310`, read-only) holds a CLOSED span whose end is after
the history's last `shown` row, the line becomes
`back · away <span> · spent five-hour +a% weekly +b% · left five-hour x% weekly y%`
and the appended history row carries `shown: { span, five: {spent,left}, week: {spent,left} }`. A span that is UNREAD shows
`back · away <span> · spend unread (<why>)` and records that. Read-only on presence's file; writes only its own file.

**P5 · the witness** `ci/witness/mguard/witness_guard.mjs --day <D>` (location: mwit FORK F10 (a)). Reads the campaign
root through the same env door, the repo's `presence_log.jsonl` (+ its archive siblings through `presenceTail`), imports
`spanSpend` and `readRule`. Exit 0/1/2 per §4. Binds no port, names no live service, POSTs nothing, restarts nothing; AW
is never called (the spans come from the recorded rows).

## 4 · Witness clauses — each plant RED on base, GREEN on the build

All plants: copy `scripts/` beside a planted tree under `os.tmpdir()` (mwit FORK F3 (a) / F14 (a), the
`ci/mwit/plant_day.mjs` method); plant a campaign root there with a planted law line; feed `usage_tap.mjs statusline` real
stdin blocks and `presence.mjs` sense through its `deps` (`afk`, `events`, `append` — the selftest door, `:733`, `:682`).
No state of `dressing-room/state` is read or written; no port; every child spawn is bounded by the suite's existing
spawn bound (never a typed one).

| clause | holds (exit 0) iff | plant → base | plant → build |
|---|---|---|---|
| **G1 · span** | day D's presence rows carry ≥ 1 CLOSED away span; none ⇒ the day is UNREAD (2), never green | a day with an AFK stretch and his return | base: rows carry no `away` ⇒ **2** · build: span found ⇒ passes to G2 |
| **G2 · read** | every closed span of D is bracketed by history rows inside the age bound with no reset inside; an unbracketed or rolled span ⇒ 2 (if no span is red) | readings rendered before he leaves and after he returns | base: no history file ⇒ **2** · build: `spanSpend` reads both windows ⇒ passes |
| **G3 · one writer** | the history file is written by `usage_tap.mjs` alone: in the tracked tree, the only write naming `usage_readings` is in `scripts/usage_tap.mjs` (static, comments stripped, the tap's own W-law method `:257-264`) | — | base: no writer at all ⇒ **2** · build: exactly one ⇒ passes; a planted second writer ⇒ **1** |
| **G4 · shown** | for every READ span, the first history row after the presence row that closed it carries `shown` equal to `spanSpend`'s figures (spent and left, both windows); missing or different ⇒ **1** | the return render | base: nothing recorded ⇒ **2** · build: equal ⇒ **0**; a planted wrong `shown` ⇒ **1** |

Verdict = the worst clause (1 over 2 over 0). **RED before:** at `fb42118` every real day reads **2** (no history, no
recorded spans) — a nonzero exit, which `rung_receipt.mjs red` accepts (it refuses only a 0, `scripts/rung_receipt.mjs:306`).
**GREEN on a real away span:** his laptop, a day D with a closed AFK span during which the runner or a cloud seat spent,
bracketed by statusLine renders, and the return render's `shown` row — via `rung_receipt.mjs green --day D`
(`scripts/day.mjs:204-213` dayProof; NAMED N-G1).

## 5 · Mutants — one per clause (each must turn its plant's exit to 0, and the witness must catch it)

- **M1 (G1):** treat "no closed span" as holds → the no-span plant reads 0 instead of 2.
- **M2 (G2):** drop the away-span intersection — bracket by the day's first and last reading instead of the span's edges
  (the mwit (d) mutant) → the "spend before he left" plant reads 0 with a figure that includes pre-span spend; held by the
  plant whose `shown` names only the span's spend. Twin: drop the age bound → the stale-bracket plant reads 0 instead of 2.
- **M3 (G3):** skip the static scan → the planted-second-writer plant reads 0 instead of 1.
- **M4 (G4):** accept any history row after the span as `shown` (no equality) → the wrong-`shown` plant reads 0 instead of 1.

## FORKS

- **G1 · where the span's spend is read.** (a) a reading HISTORY appended by the tap (P1) — the only source that sees cloud
  seats; (b) `session_meter.mjs` rows gain a timestamp — laptop-only, blind to cloud seats, so it under-reads every
  unattended fleet; (c) `brain.mjs` ledger — the organism's half only. **Recommend (a).** Decides it: whether cloud seats
  spend inside his away spans — the campaign's launch ledger against his AFK spans (N-G2).
- **G2 · where the away span comes from.** (a) presence's focus row records `away` + `back_at` (P2) — the organ that already
  fetches AFK; (b) the witness takes an AW export file by path (`--afk <file>`), the export done by hand; (c) the campaign's
  own declared away (the runner's "unattended" mark). **Recommend (a).** Decides it: whether the sense pass runs while he is
  away (laptop awake, Task Scheduler entry live) — N-G3.
- **G3 · a reset inside the bracket.** (a) that window UNREAD (2); (b) a lower bound `r1.pct` marked partial, counted read.
  **Recommend (a)** (an unread is never a green; a gate only gets stricter). Decides it: how often a five-hour reset falls
  inside his away spans — the history itself, after a week on his laptop.
- **G4 · the tap's selftest write law (W3.1, `scripts/usage_tap.mjs:264`).** (a) replace it with one naming exactly three
  writes (tmp, rename, the history append) — stricter in shape, never looser; (b) a second organ owns the history.
  **Recommend (a)** (one owner per file family). The architect rules whether (a) counts as "a gate only gets stricter".
- **G5 · read-and-show, or also a stop.** (a) read and show only — his words 264-268 ("work with full speed … i will reset
  weekly limit once it goes full"); (b) also: inside an away span every launch needs a GO verdict (`usage_tap.mjs verdict`,
  freshness only, no percent line — row 1062 F5 B); (c) a percent line — forbidden (F5 B, and no typed budget).
  **Recommend (a).** (b) needs the campaign's launch ledger (N-G2) and is a later rung if ruled.
- **G6 · the surface.** (a) the statusLine records and prints the away report (P4); (b) the learn-start pool note
  (`scripts/day.mjs:115-118`) carries it; (c) a captain's-call card. **Recommend (a)**, (b) as the fallback when no render
  follows the span; (c) refused: the report needs no word of his (the CAPTAIN'S CALL law). Decides it: N-G4.
- **G7 · the statusLine reading presence's file.** P4 reads `presence_log.jsonl`'s tail inside the statusLine's ruled bound.
  (a) through `presenceTail` (bounded tail read); (b) presence writes a tiny "last closed span" row the tap reads.
  **Recommend (a)**; measure the render's wall time on his laptop before ruling (N-G5).
- **G8 · files beyond the named ones** — `scripts/organism_test.mjs` (the witness's plants in the hermetic table, mwit F11)
  and `.claude/skills/runner/SKILL.md` (one line: the away report exists). Rule each in or out.

## NAMED NOT GUESSED

- **N-G1** his real away spans and his window — AFK data lives in ActivityWatch on his laptop only (the MCP server for it
  failed to connect in this session). Measure: `node scripts/presence.mjs status` and, once built, the focus rows' `away`.
- **N-G2** which cloud seats / runner launches spent inside an away span — the campaign's launch ledger, not in this repo.
  Measure: the campaign tree's launch record against the recorded spans.
- **N-G3** whether presence's sense pass runs while he is away (laptop asleep ⇒ no AW, no runner, no reading). Measure:
  `schtasks /query /fo LIST /v | findstr Presence` and a day's presence rows across a known absence.
- **N-G4** whether his surface renders statusLine at all (CLI vs the desktop app) and with `ARSENAL_CAMPAIGN_ROOT` set.
  Measure: `node scripts/usage_tap.mjs status` on his laptop with the root set (`source statusline` and a fresh `read_at`).
- **N-G5** the statusLine render's wall time with a presence tail read added. Measure: on his laptop, time
  `usage_tap.mjs statusline` with a real stdin block, before and after the build.
- **N-G6** the age bound's value — `POOL_READING_MAX_AGE_MIN` in the campaign's `tools/model_law.mjs`, not in this repo.
  Measure: `node scripts/usage_tap.mjs verdict` with the root set (a `rule unreadable` WAIT means it is absent).

## Files a build would touch

- `scripts/usage_tap.mjs` — EDIT (P1 history append, P3 `spanSpend` export, P4 shown line, selftest per FORK G4).
- `scripts/presence.mjs` — EDIT (P2: `away` + `back_at` on the focus row, `:735`; selftest plants).
- `ci/witness/mguard/witness_guard.mjs` — NEW (P5, §4, §5).
- Beyond them, as FORK G8: `scripts/organism_test.mjs`, `.claude/skills/runner/SKILL.md`. Never `.claude/settings.json`
  (its statusLine line already runs the tap; nothing changes there).

## CI of this spec's pushes (public API, curl, no token)

- `4ab78728a4bd66d235eacb173cd0e59be9b53e82` (the checkpoint): check runs `135566072467` npm test · node 24 — completed
  success; `135566072176` npm test · node 22 — completed success.
- `node scripts/ci_verdict.mjs 4ab78728a4bd66d235eacb173cd0e59be9b53e82` → `UNREADABLE — GET …/check-runs?per_page=100
  answered 403` (exit 2) from this container, while the same GET by curl answered 200: the reader's request is refused by
  this cloud's proxy path, not by GitHub's verdict. Named for the runner; not fixed here.
- This push's tip: named in the LEDGER's last row and in the final message (a file cannot carry its own sha).
