# THE CLOUD SENTINEL — the organ that cannot die with the laptop

> P3 of THE PEAK PLAN, built 9 Aug 2026 on the captain's verbatim word:
> *"yes lets build p1 p2 p3 p7 to the peak of its powers and make sure data
> flows everywhere wherever it is required."* Design CORRECTED from the first
> draft during planning: pushed repo state is LAST NIGHT's, so it cannot tell
> whether TODAY's sheet spoke — the sentinel therefore polls the **ntfy topic's
> own JSON history**, which is the only truth about what reached his phone.

## ⚠ CHANNEL STATUS — read by `watchman.mjs`, and it is the ONLY thing that demotes the daily RED

CHANNEL_STATUS: BLOCKED since 2026-08-15 — the cloud routine's own egress policy refuses ntfy.sh (403 from the session proxy gateway). The routine itself fires daily and COMPLETES; it is the CHANNEL that is impossible, not the organ.

**Delete the line above the day the channel works again, and `sentinel-blind` returns to RED in the same
edit.** It lives here rather than in `watchman.mjs` deliberately: a status frozen inside code is the
prose-rot this repo keeps finding — a fact still being obeyed long after it stopped being true — and
this document is the thing that owns the sentinel's contract.

Evidence, from the routine's own run log (`ArsenalFC Cloud Sentinel`, 15 Aug 2026 10:33 IST, *Completed*):

> *"Cloud Sentinel couldn't run today — network egress policy blocked ntfy.sh entirely. Every curl to
> https://ntfy.sh failed with a 403 policy denial from this session's proxy gateway… a 403/407 is an
> organization policy block, not a transient error."*

Why this is a demotion and not a deletion: the check is still **correct** — nothing of ours reached the
topic today — and the LAPTOP half of that is a real signal, owned by `mouth-silent-today`. What changed
is only the LEVEL, because a RED that can never clear is an alarm he learns to ignore, which is the
exact failure the watchman exists to prevent. Same call, same reasoning, as `tier2-vanished`.

**The real fix is a channel the cloud environment permits**, and that is its own work order — not a
line in this one.

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

> **The "not a repo script, not a scheduled task" half is VERIFIED; the routine's
> own half is not repo-checkable** (checked 10 Aug 2026). Verified live here:
> no sentinel script exists (`ls scripts/ | grep -i sentinel` → nothing) and no
> sentinel task exists on this box (`Get-ScheduledTask | ? TaskName -like
> "*Arsenal*"` → a long ArsenalFC-* list, none of them a sentinel; count them
> live rather than trusting a number written here). Also HELD on
> re-check: `closeHM` really is `at + 90min` and `at` really is 08:45, so the
> absence window really does close at 10:15 — evidence `grep -n "closeHM"
> scripts/brain.mjs` (the sheet job is picked by `cfg.ntfy.push_after`) and
> `node -e "const c=require('./dressing-room/state/brain_config.json');const
> f=c.jobs.find(j=>j.id==='formation_read');console.log(f.at,f.window)"` →
> `08:45 any`, which also holds the `window:"any"` claim above.
> **NOT VERIFIABLE FROM THIS REPO 10 Aug 2026:** the routine id, its cron, and
> whether it is still enabled live only on claude.ai — the local scheduled-task
> MCP (`list_scheduled_tasks`) returns none, because it lists *this machine's*
> Claude Code tasks, not cloud routines. Treat the id and the 05:00 UTC cron as
> a CLAIM until read at <https://claude.ai/code/routines>. (Same for everything
> under "What it does" below: that is the routine's PROMPT, which lives on his
> account — this file is its transcript, not its source.)

## What it does (READ + PUSH ONLY — cloud never writes state)
1. Polls `https://ntfy.sh/<topic>/json?poll=1&since=12h`, keeps `event=="message"`
   rows whose **IST** date is today.
2. Stays SILENT if any of: `⚪🔴 Team sheet is up` (sheet spoke) ·
   `⚪🔴 No sheet this morning` (laptop's own absence bell) · a title containing
   `cloud sentinel` (it already spoke — the inclusive `since` window re-serves
   rows, so dedup is by title, never by watermark).
   *(both titles re-checked byte-for-byte 10 Aug 2026 and BOTH HELD — they are
   `SHEET_PUSH_TITLE` and `SHEET_ABSENCE_TITLE` in the code; evidence
   `grep -n "SHEET_PUSH_TITLE =\|SHEET_ABSENCE_TITLE =" scripts/brain.mjs`. If
   either constant is ever reworded, this routine goes blind and starts
   false-alarming on healthy mornings — re-grep before trusting this list.)*
3. Otherwise the laptop slept: it renders a ≤8-line mini-brief from the
   **last-pushed public repo state** (conductor.json `finished`, sprint current,
   last rep ts, `git log -1` as "state as of") and pushes ONE notification:
   Title `⚪🔴 Subah — cloud sentinel` · Tags `soccer,cloud` · body opening
   **"Laptop soya — sheet nahi aayegi. Laptop kholte hi conductor catch-up
   chala dega."**
   > **CORRECTED 10 Aug 2026 — "sprint current" IS NOT IN THE PUBLIC REPO.**
   > This line has named four mini-brief inputs since 9 Aug; three of them are
   > tracked and one is **gitignored**, so the cloud can never read it:
   > `git check-ignore -v dressing-room/state/sprint.json` →
   > `.gitignore:134  dressing-room/state/sprint.json`. (The field itself is
   > real on THIS machine — it is `progress.current`, not a top-level `current`:
   > `node -e "console.log(require('./dressing-room/state/sprint.json').progress.current)"`
   > → `{id: "1-04", task: "Hallucinations", …}` — but a gitignored file is not
   > pushed, so from the cloud's side that line is dark, not stale.) The other
   > three HOLD: `git ls-files --error-unmatch dressing-room/state/conductor.json
   > dressing-room/state/reps_log.jsonl` returns both (tracked → pushable), and
   > conductor.json really does carry `finished` (an ISO stamp). What the routine
   > actually prints for the sprint line is unknown from here — read the prompt
   > at claude.ai/code/routines. **This one needs the captain's ruling**: either
   > the sprint line comes out of the brief, or it is re-pointed at a tracked
   > file (`git ls-files "dressing-room/state/*.json"` lists what IS public —
   > `learning_state.json` is in there), or sprint.json stops being ignored.
   > Second, smaller correction to the same line: `conductor.json` is the
   > **MORNING** conductor only — the evening chain writes a different file, and
   > the code says so out loud: `grep -n "sentinel both read only the MORNING"
   > scripts/watchman.mjs`. So the brief's "finished" stamp reports the morning
   > chain, never last night's.

## Laws it carries
- The Title **must** wear the ⚪🔴 badge — the throw-in echo filter swallows any
  unbadged title into loose_balls.jsonl as the captain's own thought.
  *(HELD on re-check 10 Aug 2026, but the citation was a line number and this
  repo's line numbers drift within days, so it is now a grep:
  `grep -n "ECHO FILTER" scripts/throwin.mjs` — the branch two lines under it is
  `if (m.title && String(m.title).includes("⚪🔴")) continue;`, i.e. badged rows
  are dropped and everything else becomes a verbatim loose ball. It was
  throwin.mjs:214 when this file was written and it still is; the grep is so it
  survives the next edit that isn't.)*
- It never rings a substitute full-time bell — the bell refuses to ring late BY
  DESIGN (brain.mjs BELLS grace window), and that ruling is not the cloud's to
  reverse. *(HELD 10 Aug 2026: `grep -n "A catch-up bell at the wrong hour"
  scripts/brain.mjs` — `bell` mode returns silent when `lateBy < -5` or
  `lateBy > grace_min`, and `BELLS.fulltime` is `{at: "22:00", grace_min: 75}`.
  Note the bell's own Windows task `ArsenalFC-Bell-FullTime` reads **Disabled**
  on this box today — read that state live, never from here:
  `Get-ScheduledTask ArsenalFC-Bell-FullTime | select State`.)*
- Max ONE push per run; zero on a healthy morning.
- **The topic is a secret**: it lives only in the routine's own prompt on the
  captain's claude.ai account (and locally in the gitignored
  `dressing-room/state/throwin_topic.txt`). It is never committed — this file
  deliberately does not contain it.
  *(corrected 10 Aug 2026: "only … (and …)" named TWO homes; the code resolves
  THREE, in precedence order — `cfg.ntfy.topic` inside the committed
  brain_config.json (which is why it warns out loud that the file is public and
  the topic IS the password), then env `ARSENAL_NTFY_TOPIC`, then the gitignored
  txt. Evidence: `grep -n "function resolveNtfyTopic" scripts/brain.mjs`, and
  the same env-first order in `grep -n "ARSENAL_NTFY_TOPIC" scripts/watchman.mjs
  scripts/throwin.mjs`. The gitignore claim itself HOLDS:
  `git check-ignore -v dressing-room/state/throwin_topic.txt` →
  `.gitignore:83`. And the committed `brain_config.json` ntfy.topic is `""`
  today — check it live, never from here.)*

## Proven (unrun system = hypothesis)
- 9 Aug 2026, 17:37 IST: manual `run` fired with a `⚪🔴 Team sheet is up` row
  already in today's history → the sentinel stayed silent (no new row on the
  topic). The push leg's first live proof will be the first genuinely dead
  morning; its logic is the same decide branch, inverted.
- (added 10 Aug 2026 — this section read as if nothing on the laptop watched
  the watcher, which stopped being true the day the ladder's E8 landed.) **The
  laptop now probes the sentinel's pulse every night**: `probeSentinel()` in
  watchman.mjs polls the same ntfy JSON history since local midnight and raises
  a **RED `sentinel-blind`** when the day holds neither a laptop row nor this
  routine's fallback — "the mouth and the cloud sentinel cannot both be silent
  on the same day". Evidence: `grep -n "probeSentinel" scripts/watchman.mjs`
  (defined once, called once from the nightly sweep), and its proof-of-life test
  matches on a ⚪🔴 title, an RFC2047-encoded title, **or the literal string
  `Laptop soya`** — `grep -n "Laptop soya" scripts/watchman.mjs`. That last one
  is load-bearing for the body text in step 3 above: reword the "Laptop soya"
  opener in the routine's prompt and the watchman stops recognising the
  sentinel's own voice. `ArsenalFC-Watchman` reads Ready on this box today —
  read that live, never from here.

## Change / disable
Update or disable at <https://claude.ai/code/routines> (routine
`trig_01FqdFtH75MdnwY9DnXsCtry`), or via the schedule skill in a Claude Code
session. Deleting requires the web UI.

*(NOT VERIFIED 10 Aug 2026 — could not confirm from code; treat as a claim. A
`schedule` skill does exist in this session's skill roster and describes itself
as managing "scheduled cloud agents (routines)", but it is not a file in this
repo or in `~/.claude/skills/`, so neither its reach over THIS routine nor the
"deleting requires the web UI" half is checkable from here. What IS checkable
and does NOT apply: the local `list_scheduled_tasks` MCP returns "No scheduled
tasks found" — it manages this machine's Claude Code tasks, not cloud routines,
so do not read its emptiness as the sentinel being gone.)*
