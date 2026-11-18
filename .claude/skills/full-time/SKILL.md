---
name: full-time
description: The 30-second evening close — HIT/MISS, one signal, KAL-line, throw-in routing, then the evening organs run. Use when the captain says "full time", "post match", "done for today", or "closing".
---

# /full-time — close the day, weld tomorrow

> **unit mday (forks rows 1044 / 1050) — THE CLOSE IS `node scripts/day.mjs end`, AND THIS SKILL IS HIS ANSWER.** When he
> means the day is over, in any words, the session runs `day.mjs end` once: it closes the sitting (the judge fires by code),
> writes the machine half of the day (`postmatch.mjs autoclose --anchor close`) and deals ONE card — it never waits on him.
> This skill is the ANSWER path: his result line, whenever it comes, rides `node scripts/day.mjs answer --hit <X> …`, which
> forwards to postmatch (the UPGRADE door on a machine-closed day) and then runs scorer → setpiece → viz → the card (each
> measured NOT idempotent by day, so they ride his answer only — ruling F4). The four trigger phrases in the description
> stay as DISCOVERY text for this skill, never as a matcher.

1. Ask, in ONE compact message: Result (HIT/MISS/PARTIAL/REST)? · one signal
   worth naming? · KAL-line (tomorrow's pre-decided first move)?
   (checked 10 Aug 2026 — those four result words are exactly the set the code
   accepts and nothing else passes validation:
   `grep -n '\["HIT", "MISS", "PARTIAL", "REST"\]' scripts/postmatch.mjs`.
   ADD, on a MISS only: the diagnostic — start / block / sleep — because the
   ledger renders that line and step 3 needs `--diag` to fill it. Ask it inside
   this same message, never as a second round-trip.)
2. Show pending throw-ins from `loose_balls.jsonl` (routed:false) **and from
   `dugout_notes.jsonl`** — both files feed the SAME routing gate, each with
   your one-line routing proposal (doubt → which capsule · edge → ledger ·
   KAL-candidate). He says "go" or corrects — batch, never line-by-line.
   (corrected 10 Aug 2026: this step named only `loose_balls.jsonl` until today,
   so every note he voiced to the Gaffer was invisible at the close — while
   postmatch itself had been printing them all along. Evidence:
   `grep -n "dugout_notes" scripts/postmatch.mjs` — the `pendingBalls` array
   concatenates both sources, keys notes `note:<ts>` and suffixes them 〔dugout〕;
   a live `--dry` run on 10 Aug 2026 listed **7 pending — 2 loose balls + 5
   dugout notes**. Never take the count from this line; run the dry render.)
   `routed:false` is CORRECT and stays: throwin.mjs stamps it on arrival
   (`grep -n "routed: false" scripts/throwin.mjs`) and never flips it back — the
   routed record lives in postmatch's own `routed_balls.json`, which the same
   filter subtracts (`grep -n "routedIds" scripts/postmatch.mjs`).
   NOTE postmatch's own render prints only the **first five** pending
   (`grep -n "pendingBalls.slice" scripts/postmatch.mjs`) while the header carries
   the true total — if the header says more than five, read the two files yourself.
3. **WHICH DAY HIS LINE CLOSES — read it before step 1's ask goes out (mpast, ruling A1):**
   `node scripts/postmatch.mjs named` (READ-ONLY, writes nothing) prints the day his ONE line closes:
   the NEWEST open day the day-close card names (`--date <day>`), the OLDER named days, and
   `KAL asked` / `KAL not asked`. When it names a day other than today, step 1's ONE message asks
   "Result for **<that day>**?" (the KAL only when it says `KAL asked` — only yesterday or today),
   and SAYS, never asks, "<older days> close with no line of yours". Never one question per day,
   never one result copied onto several days. When it names no day, the close is today, as before.
   Then run ONE command — `day.mjs answer` forwards these flags to postmatch and runs the chain below after it
   (unit mday; the day's ONE judge call already fired BY CODE at the sitting's close, row 68 (d), so no judge step is typed here):
   `node scripts/day.mjs answer --hit <X> --signal "<s>" --kal "<k>" [--diag start|block|sleep] [--route all] [--date <the day named prints>]`
   which runs `node scripts/postmatch.mjs` with exactly those flags
   (`--date` is REFUSED by name, nothing written, for a malformed date, a future day, a day with no
   machine record, or his own closed day; every older named day gets ONE line recording that no line
   of his was given — read as closed, never re-asked.)
   → `node scripts/scorer.mjs` → `node scripts/setpiece.mjs` →
   `node scripts/viz.mjs` → `node scripts/captains_call.mjs deal` (day.mjs answer runs these four itself).
   All four scripts exist and all four run bare on their default mode — verified
   10 Aug 2026 by reading each file's own MODES header, not by trusting this line
   (`grep -n "^// MODES" scripts/postmatch.mjs scripts/scorer.mjs scripts/setpiece.mjs scripts/viz.mjs`).
   What that first command actually does, read out of `scripts/postmatch.mjs`
   on 10 Aug 2026 — five things this step did not say:
   · **On a MISS, pass `--diag`.** The ledger renders a "DIAGNOSTIC (pick one)"
     line on MISS days and without the flag it prints the un-chosen placeholder
     "start / block / sleep" (`grep -n "DIAGNOSTIC (pick one)" scripts/postmatch.mjs`).
     Step 1 above never asked for it — on a MISS, ask for it, then pass it.
   · **`--route all` routes EVERYTHING; a correction needs the route-only verb.**
     `node scripts/postmatch.mjs route <id> <id>…` (or `route all`) writes
     `routed_balls.json` and touches neither season nor notebook, so a correction
     can never double a matchday (`grep -n "mode === \"route\"" scripts/postmatch.mjs`).
     Added 10 Aug 2026: step 2 has always let him correct the batch and this step
     offered only the all-or-nothing flag, with no way to run his subset.
   · **No `--hit`, no record.** A non-TTY run with no `--hit` REFUSES and exits 1
     rather than defaulting to HIT — B1, 9 Aug 2026
     (`grep -n "nothing recorded, nothing fabricated" scripts/postmatch.mjs`).
     Same law as the KAL-line: a declined prompt writes no KAL-LINE at all, and
     downstream readers correctly see null (`grep -n "the prompt was declined" scripts/postmatch.mjs`).
   · **One full-time per day.** If `post_match/<today>.md` already exists, the run
     writes NOTHING and prints "today is already closed"; `--force` is the
     deliberate override (`grep -n "double-click guard" scripts/postmatch.mjs`).
     A silent no-op is not a close — read the output before telling him it landed.
   · **postmatch does more than the ledger, by itself.** Every close also writes
     `dressing-room/SEASON.md` (the logbook — Claude fills 100%, he writes ZERO)
     and fires `shadow.mjs score`; every 30th matchday it fires `brain.mjs trigger
     reanalysis` (`grep -n "shadow.mjs\|SEASON_MD\|trigger" scripts/postmatch.mjs`).
     Do not run those by hand here — it already did.
   And one about the second command: **`scorer.mjs` bare scores the LEDGER day,
   not the wall-clock day** — before 04:00 local it is still closing YESTERDAY's
   book (`grep -n "LEDGER_DAY_CUTOFF_HOUR" scripts/scorer.mjs`). `--date=YYYY-MM-DD`
   exists precisely so this skill can name the day when it knows better; the code
   says so in its own words (`grep -n "full-time skill name the day explicitly" scripts/scorer.mjs`).

   **CHAIN DRIFT — flagged, NOT fixed (10 Aug 2026):** the scheduled evening spine
   has grown two organs this chain does not run. Live order is
   scorer 22:35 → **scoreboard 22:38** → **nikhil-model 22:39** → setpiece 22:40 →
   doubtminer → physio → examiner → wall 23:00 → scout → wallpaper
   (`grep -n "export const EVENING" -A 20 scripts/conductor.mjs`; LADDER D1,
   9 Aug 2026, with scoreboard added by H1 on 10 Aug). This skill still goes
   scorer → setpiece with nothing between, so a hand-run close leaves
   `brain_outcomes.jsonl` (scoreboard) and the model's evening ingest to the
   scheduled 22:38/22:39 tasks. Read the order live, never from this paragraph.
   Whether /full-time should also run those two is a DESIGN change — it needs the
   captain's word. Do not add them on your own.
4. For each routed doubt-class throw-in: draft the capsule doubt to the
   cold-reader standard (HIS words, maine-socha-X-phir-Y, atomic, subject
   named) and emit the ONE gist file edit for him to paste — Option A,
   never auto-written.
   (checked 10 Aug 2026, holds — and "Option A" is the CODE's own word, not just
   canon prose: `grep -n "Option-A" scripts/mirror.mjs` → "The gist stays the
   MASTER (captain's manual Option-A writes only)". The one wording to keep
   honest: `mirror.mjs` IS a script and it DOES write
   `dressing-room/state/capsules/` (`grep -n "OUTPUT: dressing-room/state/capsules" scripts/mirror.mjs`
   for its own declaration, `grep -n '"capsules", id' scripts/mirror.mjs` for the write) —
   what is true is that **no OTHER organ writes there**, and that the local tree
   is a re-fetched MIRROR of the gist. So after his paste the doubt comes back on
   the next mirror run; before it, the local copy legitimately does not have it.)
5. (unit mday: `day.mjs answer` and `day.mjs end` already DEALT — do not deal again; use the card line their output printed. The text below is the deal's own law, kept.)
   Run `node scripts/captains_call.mjs deal` (THE CAPTAIN'S CALL, 7 Aug 2026).
   If a card prints, add its ONE line to the reply and take his one-word answer
   (haan/na/baad → `answer <id> <word>`). One card max — the queue never shows.
   (checked 10 Aug 2026 against `scripts/captains_call.mjs` — the date, `deal`,
   `answer <id> <haan|na|baad>` and the one-card law all hold:
   `grep -n "^// MODES" scripts/captains_call.mjs`, and `deal` prints exactly one
   card via `pickCard`. `deal` is also the DEFAULT mode
   (`grep -n 'process.argv\[2\] || "deal"' scripts/captains_call.mjs`).
   Two live facts this step did not carry:
   · **When only ONE card is live, `deal` prints NO id** and tells him the
     id-elided form — `answer <word>` binds to the most recently dealt live card
     (LADDER A1, 9 Aug 2026: `grep -n "resolveAnswerArgs" scripts/captains_call.mjs`).
     Following `answer <id> <word>` literally after a one-card deal means guessing
     an id that was never printed. Use whatever form the deal's own second line says.
   · **Silence is a designed outcome, not a failure.** `deal` returns silently
     under `ARSENAL_ORGAN=1` or while a fresh forge session is open
     (`grep -n "export function dealGuard" scripts/captains_call.mjs`), and it also
     prints nothing when no card is due. Do not re-run it or announce a problem.
   · A dispatch that FAILS does not consume his word — the card stays live and
     re-deals at the next anchor (`grep -n "card stays live" scripts/captains_call.mjs`).
     If `answer` exits non-zero, say so; do not report the ask as settled.)
6. Reply ≤6 lines: result echoed · twin line ONLY if postmatch shows one ·
   tomorrow's compiled drill kinds · the call card if one dealt · "wall
   repainted." Then stop. Sleep is training; do not open new topics.
   (checked 10 Aug 2026, all four hold. The twin rule is enforced in code, not
   just here — the THE BOOK line renders IFF `twin.json.voice` is non-null and
   this organ never invents one: `grep -n "THE BOOK" scripts/postmatch.mjs`. The
   drill "kinds" are a real field — `drills[].kind` in `drills.json`, written by
   setpiece as the sole writer: `grep -n "OUTPUT: dressing-room/state/drills.json" scripts/setpiece.mjs`;
   read tomorrow's live, never from any doc. One word to keep precise: "wall
   repainted" = `viz.mjs` rewrote `dressing-room/club/wall.html` + `wall_data.json`
   (`grep -n "OUTPUT: wall_data.json" scripts/viz.mjs`). It is NOT the desktop —
   the DESKTOP wallpaper is painted by `setup\WALLPAPER.ps1`, which this skill
   does not run; it rides the scheduled evening spine at 23:10
   (`grep -n "wallpaper" scripts/conductor.mjs`). Never tell him his desktop
   changed on the strength of this step.)
