# ⚪🔴 THE DAILY LOOP — the sitting edition

> Rewritten 18 Aug 2026 (OVERHAUL Block 1, §13). The 16 KB "zero-tax edition" is verbatim at
> `docs/archive/THE_DAILY_LOOP_2026-08-18.md` — a record, not a work order.
> Every number and location here lives in a command, never in prose. Never trust a line, run its command.

## The whole day, three moves

| | You do | The club does |
|---|---|---|
| **1 · Morning** | Read ONE line: `node scripts/state.mjs` (it is also line 1 of every Claude Code session and the morning phone push). Answer the ONE card if there is one. | Says: pushed · daemons · suite · sitting · next · needs-you. Everything else it already did. |
| **2 · Sitting** | Open ONE sitting. **Text:** `/learn` in Claude Code (reads the state, routes: concept → `/forge`, due Re-Jirah → round, staged mock → scrimmage). **Voice:** the DUGOUT icon (`setup/launchers/`) — Re-Jirah recital + bank/judge with the Gaffer. Say your gut-word before every answer. | Paces THE METHOD (`node scripts/forge_session.mjs contract`), banks every answer instantly, judges the round with ONE Opus call, captures the reps — no copy, no paste. |
| **3 · Full-time** | Say *"full time"* to the Gaffer, or `/full-time` in Claude Code, or the FULL TIME icon — HIT/MISS · one signal · KAL-line. Then sleep. | Scores the day, stages tomorrow, runs the dark lane behind THE GATE (`node scripts/brain.mjs gate show`). |

**That's it.** Nothing to remember (L7 — anything you must remember is a design failure, his 11 Aug words).
Anything that needs your word rides ONE card at an anchor you already hit: `node scripts/captains_call.mjs status`.

## Where the pieces are (verify, never recall)

- The bell: `grep -n "BELL HOUR" scripts/brain.mjs` — full-time rings at 22:00 with grace, his 9 Aug ruling; the evening chain agrees (`grep -n "id: \"bell\"" scripts/conductor.mjs`).
- The surfaces: `ls .claude/skills/` — each `SKILL.md` says when it fires. `/matchday` is the long morning if you want it; the state line is the short one.
- Which LLM lanes are asleep and why (nothing is deleted; a lane wakes itself on real data): `node scripts/brain.mjs gate show`.
- The Gaffer: `setup/open_dugout.ps1` (what the DUGOUT icon runs) → `http://localhost:4114`.
- **The sitting brain — Block 3 of the overhaul, BUILT 18 Aug 2026:** one persistent Claude session behind every mouth (`sitting.mjs`, port 4117, `node scripts/sitting.mjs status`). Until it lands: teaching in `/forge`, Re-Jirah with the Gaffer. `ORGANISM_OVERHAUL__2026-08-18.md` BUILD LOG says which block is done.

## If you study OUTSIDE a sitting (claude.ai · Colab · a Gem)

Copy the reps-JSON block — the turnstile is watching the clipboard (`node scripts/turnstile.mjs selftest`; the daemon table is `grep -n "DAEMONS = \[" -A6 scripts/daemon_watchdog.mjs`). From the phone, share it to the throw-in channel (`grep -n "looksLikeContract" scripts/throwin.mjs`). The rep shape and the closed vocabulary (surface · track · axis) live in the owner, not here: `grep -n "const SURFACES\|const TRACKS\|const AXES" scripts/capture.mjs`. Listening (NotebookLM) is not a rep, by the gate.

**The whole system, one line:** open a sitting; say full time; the club does everything else — and tells you in one line whether it did.
