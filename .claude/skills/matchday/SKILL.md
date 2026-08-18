---
name: matchday
description: Morning kickoff in one command — run the sensory pass, show the sheet, today's drills, and the wall. Use when the captain says "matchday", "kickoff", "morning", or starts his day.
---

# /matchday — one glance, then play

You are inside ARSENAL AI FC. The captain is #14, ADHD-PI: ONE idea at a time,
visuals over walls of text, no hype, no calendar pressure, never streaks.

0. **THE STATE LINE FIRST** (overhaul §7.1, 18 Aug 2026): run `node scripts/state.mjs`
   and put its ONE line at the top of the reply, verbatim — pushed · daemons ·
   suite · sitting · next · needs-you. That line IS the answer to "is everything
   working / pushed / can I start?", so he never has to ask it. Then, because
   opening /matchday is HIM reading the sheet, stamp the consumption that THE
   GATE (§5.2) meters: `node scripts/brain.mjs consumed formation_read --kind opened --by matchday`
   (owner's door, one row on consumption.jsonl; a lane nobody reaches sleeps
   itself — this is how the sheet lane stays awake).
1. Run: `node scripts/heartbeat.mjs` then `node scripts/brain.mjs status`.
   (added 10 Aug 2026, verified — NOT a change to the two commands, both still
   exist and both still work: `heartbeat.mjs` DOES NOT BUILD THE SHEET, and this
   step used to read as if the pair refreshed everything you are about to show
   him. heartbeat's own squad is the SIGNAL organs only — never counted from
   this line, read it live off its canon:
   `node -e "console.log(require('./dressing-room/state/heartbeat_config.json').order.map(e=>e.name).join(', '))"`
   (`scripts/heartbeat.mjs` keeps a DEFAULTS mirror of that same list, and its
   selftest asserts the parity, so the file is a copy — the JSON is the source).
   No manager, no set-piece, no physio, no viz in it. The sheet is a DIFFERENT step:
   `grep -n 'id: "sheet"' scripts/conductor.mjs` → the morning chain runs
   `brain.mjs tick` at 08:45, and `grep -n "sole writer): team_sheet.md"
   scripts/manager.mjs` names manager.mjs its only writer. So on a morning the
   laptop slept through, `heartbeat.mjs` + `brain.mjs status` both come back
   healthy while `team_sheet.md` is YESTERDAY'S. That exact failure ran nine
   days before he caught it — `grep -n "THE MORNING THAT NEVER CAME"
   scripts/brain.mjs`. CHECK LINE 1 OF THE SHEET: it carries its own date. If
   that date is not today, say so out loud in the reply; never read a stale
   sheet as today's.)
2. Read (do not dump raw): `dressing-room/state/team_sheet.md`,
   `dressing-room/state/drills.json`, `dressing-room/state/loop_vitals.json`.
   Also run `node scripts/captains_call.mjs deal` — THE CAPTAIN'S CALL (7 Aug
   2026, his ADHD-PI ruling: reports are machine-face, decisions are one card).
   If it prints a card, put that ONE line in the reply and take his one-word
   answer (haan/na/baad → `node scripts/captains_call.mjs answer <id> <word>`).
   CORRECTED 10 Aug 2026 — the `<id>` here is now OPTIONAL, and `deal` OFTEN
   DOES NOT PRINT ONE, so this line as written sends you hunting an id that was
   never shown. Since LADDER A1 the dealer suppresses the id when exactly one
   card is live (`grep -n "the id is noise" scripts/captains_call.mjs` — the
   printer emits `[id]` only when the live count is >1), and `answer <word>`
   with no id binds to the card most recently DEALT, erroring out loud rather
   than guessing when that is ambiguous (`grep -n "resolveAnswerArgs"
   scripts/captains_call.mjs`). So: if `deal` showed you an id, pass it; if it
   showed you none, `node scripts/captains_call.mjs answer <word>` is the
   correct call and not a shortcut.
   Max ONE card; never list the queue. The Scout's weekly market proposal
   arrives this way too — on haan, YOU read the file it names and walk him
   through it in ≤3 lines (he never reads it himself). ADDED 10 Aug 2026
   (verified, and it does not change the rule — it widens who it applies to):
   the market card is no longer the only card that hands you a PATH. Several
   card sources now mint the same `open` dispatch — count them live with
   `grep -n 'kind: "open"' scripts/captains_call.mjs` (one hit is applyAnswer's
   own return, the rest are card mints), and they point at things like a
   teaching-audit row, a named report under `dressing-room/state/`, the market
   proposal, `dressing-room/manager/system.md` and `learning-layer/PROJECT_OS.md`.
   On haan the CLI prints the same instruction back at you for every one of them
   — "read it now and walk him through it in ≤3 lines: <path>" — so treat ANY
   open-path card the Scout's way, not just the Scout's. THE FLOW (his ruling):
   only HE edits `learning-layer/OPPONENT_SCOUT.md`; if he does,
   `dressing-room/state/dossier_weights.json` must be regenerated to match —
   the watchman's nightly `projection-stale` check catches a lagging projection.
3. Reply in ≤10 lines, in this order:
   - His KAL-line verbatim, first — the sheet resumes him, never addresses him.
     CORRECTED 10 Aug 2026 — "first" read here as unconditional, and it is not.
     TWO live facts, both from manager.mjs. (a) The KAL-line is CONDITIONAL: the
     sheet emits it only when yesterday's post-match left one — `grep -n
     "if (F.kal_line) L.push" scripts/manager.mjs` is the entire gate. Checked
     live on 10 Aug 2026: today's real `team_sheet.md` carries NO quoted line at
     all, because there is no prior post_match. No KAL-line ⇒ open on THE ONE
     THING instead; NEVER invent one, and never promote some other sentence into
     its place. (b) It is not reliably the second line either: since LADDER E4 a
     stale-readiness `⚠` header is spliced in AFTER line 1 at publish time
     (`grep -n "STALE-SHEET HEADER" scripts/manager.mjs`) — that header is what
     actually sits on line 2 of today's sheet. Read the sheet; do not count its
     lines.
   - THE ONE THING from the sheet (one line, why in half a line).
   - Today's ≤3 drills as a numbered list (kind + concept only).
     (added 10 Aug 2026: the "≤3" holds — it is a hard cap in code, not a doc
     number: `grep -n "max_drills" scripts/setpiece.mjs` shows the loader clamp
     `Math.min(j.max_drills, 3)`. But the DAY's cap is lower on a dampened body
     and lives in `dressing-room/state/ladder_config.json`, not here — so read
     the actual count off `drills.json`, never off this line.)
   - Physio line ONLY if something bleeds. Brain phase one-liner.
   - End: a reminder to open the wall + "COYG. ⚪🔴". NOTE: `open` is macOS —
     on his Windows box say `start "" "dressing-room\club\wall.html"` (cmd, run
     from the repo root) or just "double-click `dressing-room\club\wall.html`".
     Never print the macOS form.
     WHY THE QUOTES AND THE EMPTY `""` (issue #91, 2026-08-04): the previous
     version of this line read `start dressing-roomclubwall.html` — the
     backslashes were eaten at WRITE time by commit 34561e8 (a commit that was
     itself fixing skill bugs), and its fallback said `club/wall.html`, a path
     that does not exist from the repo root. Both forms errored. cmd's `start`
     reads a bare first token as the window TITLE, so the empty `""` is what
     makes the second argument the file. If you ever re-author this line, write
     the literal bytes and check them back (`cat -A`) — the real file is
     `dressing-room/club/wall.html` and nothing else.
4. If readiness verdict is RED: show KAL-line + the single floor-touch only.
   Nothing else. No summaries of what was withheld (post-match discloses).
   (added 10 Aug 2026 — this step held on every check, and here is where to read
   it from so it stays checkable. The verdict is already in front of you:
   `drills.json` carries `ladder_verdict`, and `readiness.json` is the
   Goalkeeper's own file. Every behaviour named above is wired, and the SOURCE
   OF TRUTH for it is tunable canon, not a script:
   `dressing-room/state/ladder_config.json`. Read its RED tier live — on
   10 Aug 2026 it holds
   `drill_modes_allowed: ["floor_touch"]` · `max_drills: 1` · `sheet_scope:
   "floor_only"` · `nemesis_headline: "withhold_disclose_at_postmatch"` ·
   `first_ball: "five_minute_floor_touch"` — and that fourth field is why
   "post-match discloses" is a wired fact and not a promise. TRAP, learned the
   same day while writing this note: the identical tier literal appears inside
   BOTH `scripts/heartbeat.mjs` and `scripts/setpiece.mjs`, and in both places it
   is a SELFTEST FIXTURE deliberately mirroring the canon file, not the runtime
   read — each file says so in a comment above it ("the tiers are now an inline
   fixture mirroring ladder_config.json's shape"; "Code is now tested against
   FIXTURES"). Grep either one and you are reading a copy that is free to drift.
   Quote the JSON. And read the KAL-line clause here through step 3's correction:
   on a RED day with no KAL-line on the sheet, it is the floor-touch alone.)
