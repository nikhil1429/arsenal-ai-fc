# mguard · C:capability-c31, THE SPEND GUARD — SPEC (forks row 1163 (6), 19 Nov 2026 UTC)

CHECKPOINT · STOPPED at 2026-11-19T12:38Z · resume from: write §3 (the proposed code path), §4 (witness clauses + plants), §5 (mutants), FORKS, NAMED NOT GUESSED and the file list from the in-hand findings below; then push, read CI by curl, run the effort receipt.

Stopped by the pause message (his word #269, 19 Nov 2026). What follows is IN HAND: measured, not yet the full spec.

Branch `claude/mguard-spec`, cut from `origin/main` at **`fb42118`** (`fb4211870093e6b8657655eb02ebcfc425f1eab1`, fetched
2026-11-19 UTC). Every `file:line` below is at that base. Source design: `git show 88bf69d:ci/mwit/MWIT_SPEC.md` §C:capability-c31 and UNITS row 13.

## 1 · Measured at the cut (by command, last line verbatim; 19 Nov 2026)

```
node scripts/usage_tap.mjs selftest | tail -1
usage_tap selftest 31/31 — all clauses hold          (19 Nov 2026)

node scripts/usage_tap.mjs verdict ; echo exit $?
WAIT · no campaign root (ARSENAL_CAMPAIGN_ROOT unset) · five-hour ?% · weekly ?% · age ? min · source none
exit 3

git grep -n -i "away.brain\|spend.guard" -- ':!dressing-room'
(only brain.mjs:5604-5631 "S12 SPEND-GUARD" — a VERB guard on brain's argv, not this clause: a name collision)

ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all ; echo exit $?
exit 2   (19 Nov 2026; the cloud container lacks modules — tail names ERR_MODULE_NOT_FOUND for fsrs, mutagen)
```

## 2 · The three answers row 1163 (6) asks for (in hand)

**The writer of the headroom figure — `scripts/usage_tap.mjs`.** SOLE WRITER of `usage_reading.json` in the campaign root
(outside this repo), `scripts/usage_tap.mjs:10-11`; the one write `:118-122`; fed by the statusLine stdin
`rate_limits.five_hour / seven_day` (`:93-115`). It is the only figure that sees the WHOLE pool (cloud seats + his sessions
+ the organism). Explicitly NOT the pool: brain.mjs's `token_vitals.json` (`scripts/brain.mjs:126`, `tokenVitals`
`:1085-1137`, `headroom()` `:466-487`) — an estimate of the organism's own ledger only (`scripts/usage_tap.mjs:22-23`).

**The surface where he sees it — the statusLine.** `.claude/settings.json:86-90` runs `usage_tap.mjs statusline`, whose
printed line is `five-hour N% · weekly N% · read now` (`scripts/usage_tap.mjs:171-175`). Second surface: the learn-start
pool note, `scripts/day.mjs:115-118` (`usage_tap.mjs need`, its ONE keyed card through captains_call, `usage_tap.mjs:204-210`).

**The reader of spend inside an away span — NONE at the cut.** Measured why:
- `usage_tap.mjs` keeps ONE reading, overwritten (`:118-122`): no history, so no figure at span start AND end.
- `scripts/session_meter.mjs:166` buckets a row as `[key, lane, weighted, output]` under its IST day — no timestamp, so a
  sub-day span cannot be intersected; and it reads only laptop transcripts (`:5`), blind to cloud seats.
- `brain.mjs` `windowUsage` (`:455-458`) has per-row ts but is the organism's half only.
- Away spans exist only as a pure function: `presence.mjs` `awayIntervals` (`:476-495`, exported `:1118`) over AW AFK
  events fetched live from localhost (`:594`); the focus row it appends (`:735`, sole writer of presence_log.jsonl, `:16`)
  does NOT carry the spans.

## 3 · Direction in hand (to be written out on resume; not yet a proposal of record)

Reader = a pure export in the tap's owner (`usage_tap.mjs`) over an APPEND history of readings it alone writes; span source
= presence's focus row carrying its merged away spans (its own file); surface = the first statusLine reading after a closed
span records and prints the span's spend and the headroom left. Witness `ci/witness/mguard/witness_guard.mjs --day <D>`,
exit 0/1/2 by the mwit §0 law; base reads 2 (no reading history). Forks to write: history file vs none; span source
(presence row vs AW export vs campaign's declared away); reset-inside-span = unread vs lower bound; read-and-show only vs a
launch-needs-GO stop half (his words 266-268 favour read-and-show).
