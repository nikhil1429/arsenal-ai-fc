---
name: matchday
description: Morning kickoff in one command — run the sensory pass, show the sheet, today's drills, and the wall. Use when the captain says "matchday", "kickoff", "morning", or starts his day.
---

# /matchday — one glance, then play

You are inside ARSENAL AI FC. The captain is #14, ADHD-PI: ONE idea at a time,
visuals over walls of text, no hype, no calendar pressure, never streaks.

1. Run: `node scripts/heartbeat.mjs` then `node scripts/brain.mjs status`.
2. Read (do not dump raw): `dressing-room/state/team_sheet.md`,
   `dressing-room/state/drills.json`, `dressing-room/state/loop_vitals.json`.
   Also glance the newest file in `dressing-room/state/brain_out/market/` — the
   Scout's weekly MARKET PROPOSAL (added 7 Aug 2026; until then it had no reader
   at all and reconcile bled it as an orphan). If one exists that is newer than
   the captain's last matchday, add ONE line to the reply: its "Honest read"
   sentence + the file path. THE FLOW (his ruling, 7 Aug): he reads it against
   `learning-layer/OPPONENT_SCOUT.md`; only HE edits that canon; if he does,
   `dressing-room/state/dossier_weights.json` must be regenerated to match — the
   watchman's nightly `projection-stale` check catches a canon edit whose
   projection lagged. Never summarize the whole proposal into the sheet; one
   line + path, his to open.
3. Reply in ≤10 lines, in this order:
   - His KAL-line verbatim, first — the sheet resumes him, never addresses him.
   - THE ONE THING from the sheet (one line, why in half a line).
   - Today's ≤3 drills as a numbered list (kind + concept only).
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
