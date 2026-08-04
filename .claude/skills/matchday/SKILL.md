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
