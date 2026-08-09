# THE CLOUD SENTINEL — the organ that cannot die with the laptop

> P3 of THE PEAK PLAN, built 9 Aug 2026 on the captain's verbatim word:
> *"yes lets build p1 p2 p3 p7 to the peak of its powers and make sure data
> flows everywhere wherever it is required."* Design CORRECTED from the first
> draft during planning: pushed repo state is LAST NIGHT's, so it cannot tell
> whether TODAY's sheet spoke — the sentinel therefore polls the **ntfy topic's
> own JSON history**, which is the only truth about what reached his phone.

## What it is
A **claude.ai cloud routine** (not a repo script, not a scheduled task on this
machine): `ArsenalFC Cloud Sentinel — morning sheet watchdog`, id
`trig_01FqdFtH75MdnwY9DnXsCtry`, managed at <https://claude.ai/code/routines>.
Daily at **05:00 UTC = 10:30 IST** — deliberately AFTER the laptop's own
absence-bell window closes (brain.mjs closeHM = formation_read 08:45 + 90min =
10:15), so it never races a laptop that woke late and was about to speak for
itself. (The approved plan sketched "~08:50 IST"; at 08:50 a healthy morning's
sheet may legitimately not have arrived yet — formation_read is `window:"any"`
— so an 08:50 sentinel would false-alarm on slow mornings. One-line revert:
change the routine's cron to `20 3 * * *`.)

## What it does (READ + PUSH ONLY — cloud never writes state)
1. Polls `https://ntfy.sh/<topic>/json?poll=1&since=12h`, keeps `event=="message"`
   rows whose **IST** date is today.
2. Stays SILENT if any of: `⚪🔴 Team sheet is up` (sheet spoke) ·
   `⚪🔴 No sheet this morning` (laptop's own absence bell) · a title containing
   `cloud sentinel` (it already spoke — the inclusive `since` window re-serves
   rows, so dedup is by title, never by watermark).
3. Otherwise the laptop slept: it renders a ≤8-line mini-brief from the
   **last-pushed public repo state** (conductor.json `finished`, sprint current,
   last rep ts, `git log -1` as "state as of") and pushes ONE notification:
   Title `⚪🔴 Subah — cloud sentinel` · Tags `soccer,cloud` · body opening
   **"Laptop soya — sheet nahi aayegi. Laptop kholte hi conductor catch-up
   chala dega."**

## Laws it carries
- The Title **must** wear the ⚪🔴 badge — throwin.mjs:214 swallows any unbadged
  title into loose_balls.jsonl as the captain's own thought.
- It never rings a substitute full-time bell — the bell refuses to ring late BY
  DESIGN (brain.mjs BELLS grace window), and that ruling is not the cloud's to
  reverse.
- Max ONE push per run; zero on a healthy morning.
- **The topic is a secret**: it lives only in the routine's own prompt on the
  captain's claude.ai account (and locally in the gitignored
  `dressing-room/state/throwin_topic.txt`). It is never committed — this file
  deliberately does not contain it.

## Proven (unrun system = hypothesis)
- 9 Aug 2026, 17:37 IST: manual `run` fired with a `⚪🔴 Team sheet is up` row
  already in today's history → the sentinel stayed silent (no new row on the
  topic). The push leg's first live proof will be the first genuinely dead
  morning; its logic is the same decide branch, inverted.

## Change / disable
Update or disable at <https://claude.ai/code/routines> (routine
`trig_01FqdFtH75MdnwY9DnXsCtry`), or via the schedule skill in a Claude Code
session. Deleting requires the web UI.
