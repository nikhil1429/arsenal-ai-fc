# MORNING_RUNBOOK.md — living inside the organism ⚪🔴
### The daily surface area is four verbs + one glance. Everything else runs itself.

## Day 0 (once): wire it
`setup/README.md`, top to bottom (~25 min). Then the organism is autonomous.

> (corrected 10 Aug 2026 — the file and the ~25 min are both right; "then the organism is
> autonomous" is now INCOMPLETE, and incompletely in the one place that matters. `setup/README.md`
> is a 9-step table (`INSTALL_TASKS.ps1` → NTFY → Gemini CLI → Colab → Gems → NotebookLM →
> SURFACES → wallpaper → 12th player) and the word "conductor" does not appear anywhere in it:
> `grep -ni "conductor" setup/README.md` returns NOTHING. So a fresh wire off that file alone
> leaves you with the OLD morning — 14 staggered ArsenalFC-* alarms, no order, no dependency
> gate — which is precisely the shape that failed on 4 Aug 2026, when 29 ArsenalFC-* tasks all
> fired at the same instant (16:28:23) as a missed-schedule catch-up burst and several died on
> each other's missing dependencies, every one of which succeeds when run alone. (That measured
> count is `setup/INSTALL_CONDUCTOR.ps1`'s own — its "WHY THIS EXISTS" block says 4 failed and
> then names 3, so take the shape, not the tally, from it.) Two more installers, both written
> to be run BY HIM because they change the machine's schedule, complete the wiring:
> `setup/INSTALL_CONDUCTOR.ps1` (registers ArsenalFC-Morning-Conductor, disables the 14 it
> replaces) and `setup/INSTALL_EVENING_CONDUCTOR.ps1` (registers ArsenalFC-Evening-Conductor at
> 22:00, disables the 9 evening rows — Bell · Scorer · SetPiece · Doubtminer · Physio-PM ·
> Examiner · Wall-PM · Scout · Wallpaper). Both are idempotent (`/F` overwrites) and both revert
> in one command with `-Revert`.)

## Every morning (0 taps if tasks are installed)
By 08:50 the body has already: mirrored your capsules (06:55) → checked its own
vitals (07:30) → sealed the twin's bets (08:35) → run the full sensory pass
(08:39) → let the Goalkeeper + signal cascade run as always (08:30–08:44) →
had the brain write the sheet through the Manager (08:45) → repainted the wall
(08:50).

> (corrected 10 Aug 2026 — the ORDER above is still exactly right and every organ named still
> does that job. The CLOCK is what rotted, twice. Those seven times stopped being ALARM times on
> 4 Aug 2026, when `setup/INSTALL_CONDUCTOR.ps1` retired the 14 staggered rows and handed the
> morning to ONE ordered chain; and they stopped being MORNING times on 7 Aug 2026, when the
> captain moved that chain to **09:15**. Nothing above happens "by 08:50" any more — it all
> happens inside one sequential run that STARTS at 09:15: 16 steps, one at a time, 3-minute
> timeout each, a late start yielding a LATE day instead of a broken one.
> Evidence, read off the live Task Scheduler on this box on 10 Aug 2026 — not off a doc:
> `Get-ScheduledTask -TaskName "ArsenalFC-*" | Select-Object TaskName,State` →
> `ArsenalFC-Morning-Conductor` = **Ready**, trigger 09:15, while Mirror (06:55), SprintSync and
> Thalamus (07:00), Cortex (07:02), Turnstile (07:04), Physio-AM (07:30), Goalkeeper (08:30),
> Twin (08:35), Heartbeat (08:39), FSRS (08:40), Calibration (08:42), Nemesis (08:43),
> LearningState (08:44) and Wall-AM (08:50) ALL read **Disabled** — the 14 the conductor
> replaced, one for one. The old times survive inside the chain purely as step LABELS, and the
> code says so in as many words:
> `grep -n "the wall-clock time the replaced task used to hold" scripts/conductor.mjs`.
> Never read the morning's shape off this paragraph again. Read it live, two commands:
> **`node scripts/conductor.mjs plan`** (the ordered steps, and it prints "Nothing was run") plus
> the schtasks query above (the hour they actually fire). An hour written into prose rots the
> next time he moves it — this one moved 30 minutes and took the whole paragraph down with it.)

**Your one glance:** open `dressing-room/club/wall.html` (pin the tab, or let
the wallpaper carry it). First line is your own KAL-line. Then play:

> (verified 10 Aug 2026 — path and KAL-line both HOLD. `grep -n "wall.html" scripts/viz.mjs`
> shows viz.mjs declaring itself sole writer of `dressing-room/club/wall.html`, and
> `grep -n "KAL-line front and center" scripts/viz.mjs` is a live selftest assertion, not a
> comment. Two mechanics BEHIND the glance did change and were on no page: (1) the wall is
> repainted every **30 minutes all day**, not once in the morning — `ArsenalFC-Wall-Live` is
> Ready with trigger 10:38 and a PT30M repeat; (2) `ArsenalFC-Wallpaper` reads **Disabled**,
> because the wallpaper is now the last step of the EVENING chain
> (`ArsenalFC-Evening-Conductor`, Ready, 22:00 — see
> `grep -n "WALLPAPER.ps1" scripts/conductor.mjs`). So "let the wallpaper carry it" is still
> true; the row that used to carry it is not the thing carrying it. Do NOT re-enable
> ArsenalFC-Wallpaper to "fix" a stale desktop — that double-runs it against the chain.)

- **PASTE** — yesterday's Gem session JSON: `node scripts/capture.mjs paste`
- **SOLVE** — today's drills are in `dressing-room/state/drills.json` (≤3,
  first ball winnable; the sheet names the one thing)
- **BOLO** — as the FORGE demands; the confessional stays unmeasured
- **COPY-BACK** — capsule edits to the gist, as always
- **(THROW-IN)** — any stray thought: dictate to your ntfy topic from anywhere

> (verified 10 Aug 2026 — all five verbs above CHECK OUT against the code, nothing to repair:
> `node scripts/capture.mjs` with no args prints `paste [file] [--chain]` as a real mode (and two
> more this page never mentions: `rep …` for one rep as it happens, and `pull` for the Drive
> inbox). `dressing-room/state/drills.json` exists and is written by setpiece.mjs alone; the two
> laws quoted here are asserted in its selftest, not merely intended —
> `grep -n "≤3 DRILLS LAW" scripts/setpiece.mjs` and
> `grep -n "FIRST BALL WINNABLE" scripts/setpiece.mjs` — with the real cap tighter than "≤3" on a
> non-green day (GREEN 3 · AMBER 2 · RED 1: `grep -n "max_drills" scripts/setpiece.mjs`). "The
> sheet names the one thing" is literal: `dressing-room/state/team_sheet.md` carries a
> `⚽ TODAY'S ONE THING` line. "The confessional stays unmeasured" is constitutional and tested —
> `grep -n "confessional stays unmeasured" scripts/touchline.mjs`. And the throw-in line is WIRED
> on this box (`throwin_state.json` → `"wired": true`), polling every 15 minutes
> (`ArsenalFC-Throwin`, Ready, PT15M repeat), storing byte-for-byte and counting your usage never
> — `grep -n "NEVER COUNTS USAGE" scripts/throwin.mjs`. Do not read a count of anything off this
> block; read the drills live with `cat dressing-room/state/drills.json`.)

## Tomorrow's first REAL rep (how blood enters)
1. Study in Colab → each `log_rep(...)` flushes instantly (setup/COLAB_SETUP.md).
2. Or a Gem session → paste the JSON array once at the end.
3. Within the hour: capture ingests → the next heartbeat re-fits FSRS,
   calibration, nemesis, the Maidan → the touchline starts reading your live
   state → tonight's set pieces compile from YOUR exact day. Full pressure,
   day one.

> (corrected 10 Aug 2026 — the chain is real and in that exact order
> (`grep -n "in fixed order" scripts/heartbeat.mjs` → "capture pull → fsrs → calibration →
> nemesis → learning_state → timeaudit pulse"), and the Colab claim above it holds too: the v4
> cell writes and closes per call — `grep -n "per-rep flush" setup/COLAB_SETUP.md`. What "within
> the hour" never said is its BOUNDARY. `ArsenalFC-CapturePull` is a DAILY 09:00 trigger with a
> PT1H repeat over a PT13H duration, i.e. hourly **09:00–22:00 only**. A rep flushed at 23:30
> does not wait an hour; it waits for 09:00. Read it live rather than off this line:
> `(Get-ScheduledTask -TaskName "ArsenalFC-CapturePull").Triggers[0].Repetition`. The touchline
> re-reads on its own PT30M repeat, and the set pieces compile inside the evening chain, not
> here.)

## Every evening (30 seconds, the one human ritual)
```powershell
npm run postmatch
```
HIT/MISS → one signal → KAL-line. It shows the day's quiet adaptations
(disclosed, always), the twin's line if — and only if — you beat the book,
and any throw-ins awaiting your one-word routing. matches_played counts a
conscious REST as a won day. Then sleep; sleep is training.

> (verified 10 Aug 2026 — every clause of this paragraph is a CONSTITUTIONAL, selftested rule in
> postmatch.mjs, not a description: `grep -n "CONSTITUTIONAL" scripts/postmatch.mjs` lists the
> KAL-LINE parser contract, the always-disclosed adaptations, the win-only twin line, and
> `grep -n "conscious rest = won day (outwork law)" scripts/postmatch.mjs` shows REST sitting in
> the WON_DAY set beside HIT and PARTIAL. `npm run postmatch` is still the live command. Two
> things this page does not mention and which are true today: the ritual accepts four results,
> not two — `--hit HIT|MISS|PARTIAL|REST` — and postmatch now also writes
> `dressing-room/SEASON.md`, the logbook Claude fills 100% and he writes zero of. Read its
> current modes from the code, never from here: `grep -n "^// MODES:" scripts/postmatch.mjs`.)

## While you sleep (4–5 nights/week, laptop open)
The brain drains the overnight queue toward plan-exhaustion: drill phrasing in
the DOSSIER register, doubt-cluster analysis, lexicon mining, wall insights,
scrimmage staging when the scout opens a door, ~~Sunday's season review~~ + genome
proposal. You wake to a body that got sharper — the wall's brain meter shows
the receipts.

> (corrected 10 Aug 2026 — five of the six items hold; the sixth has been OFF for over a week and
> the seventh is gated shut. Checked live against `dressing-room/state/brain_config.json`, the
> brain's own job table, not against any doc:
>
> · `drill_forge` · `doubt_clusters` · `lexicon_mine` · `wall_insights` · `scrimmage_staging` —
>   all `enabled: true`, all `window: "overnight"`. TRUE as written.
> · **`season_review` is `enabled: false`** — struck through above. It was disabled 2 Aug 2026
>   (audit #63) and kept off through 6 Aug, for a reason worth knowing before anyone re-enables
>   it: it had no reader. 17 runs and 48,781 Opus tokens went into `brain_out/season/`, which no
>   `.mjs` opens, and its own note claimed it "words the Boot Room's proposal" — a seam that does
>   not exist, since bootroom.mjs contains no `brain_out` reference at all. Its own config carries
>   the re-enable conditions verbatim; read them there, not here:
>   `node -e "const j=require('./dressing-room/state/brain_config.json');
>   const s=j.jobs.find(x=>x.id==='season_review'); console.log(s.enabled, s._DISABLED_2026_08_02)"`.
> · The **genome proposal** is a different organ on a different clock, and it is currently
>   SILENT. It is not part of the brain's overnight LLM queue at all: `ArsenalFC-BootRoom` is a
>   WEEKLY task, Sunday 20:00 (evening, not overnight), running the deterministic
>   `scripts/bootroom.mjs` — `grep -n "propose-if-Sunday" scripts/bootroom.mjs`. And it is behind
>   a volume speak-gate it has not yet reached: its last recorded run (9 Aug 2026, in
>   `bootroom_log.jsonl`) says `outcome: "gate_closed"`, 17 of 200 reps —
>   `grep -n "the genome is listening, not proposing yet" scripts/bootroom.mjs`,
>   and the threshold itself at `grep -n "gates.bootroom_min_reps" scripts/limits.mjs` (need 200,
>   effect "the genome proposes no mutation"). So it has never filed a proposal and will not
>   until the reps arrive. Read the live counter — never a number off this page — with
>   `node scripts/physio.mjs` (prints `bootroom_mutation <have>/200 reps` on the climbing line).
> · One thing this list implies that is only half true: not everything the brain writes overnight
>   is READ by the body. `node scripts/brain.mjs status` prints a "for your eyes (nothing reads
>   these — glance and bin)" section, and on 10 Aug 2026 `drill_forge` and `doubt_clusters` — two
>   of the six named above — were in it. `lexicon_mine`, `wall_insights` and `scrimmage_staging`
>   declare a `code` surface, i.e. an organ actually opens them. Which is which changes as
>   consumers get wired, so read it live and never from this paragraph.
> · The brain meter DOES show the receipts: `grep -n "brain meter shows overnight sharpening"
>   scripts/viz.mjs` is a live selftest assertion on exact counts, not a label.
> · "4–5 nights/week, laptop open" is HIS habit, not a setting. (NOT VERIFIED 10 Aug 2026 —
>   nothing in the code encodes or measures it; treat as a claim.))

## When something feels off
`node scripts/brain.mjs status` (budget + eligibility) ·
`node scripts/physio.mjs` (what's bleeding) ·
`npm test` — **the authority**: runs every suite member INDEPENDENTLY and reports all of them
(`npm run test:suites` prints the membership + the total). ~~Live on 2026-08-06: **62 members, all green.**~~
**Read the membership and the verdict off the runner, never off this line: `npm run test:suites`.**

<!-- corrected 10 Aug 2026. The struck line above is the exact defect the comment BELOW it exists
     to prevent, re-committed one line later. Audit #108 wrote "Hence the command, not the number"
     on 6 Aug and then hardcoded that day's number in the very next sentence. It rotted in four
     days: `npm run test:suites` on 10 Aug 2026 reports **73** suite members, not 62, because the
     Ladder (A→G) and Phase H added organs — scoreboard, nikhil_model, harvest, daemon_watchdog,
     captains_call, benchmark, gate_tune and more — each of which entered a suite under the
     `_selftest_coverage_law` in package.json. The count is derivable in one line and should be
     taken there instead: `node -e "const p=require('./package.json').scripts;
     console.log(p['organism:selftest'].split('&&').length + p['squad:selftest'].split('&&').length)"`
     (10 Aug 2026: 51 + 22 = 73, matching the runner's own "all 73 suite members" assertion).
     "all green" is the worse half of the rot — a PASS/FAIL verdict is a snapshot of one minute,
     not a property of the repo, and a runbook that asserts green teaches you to skip the run.
     Never restore a number or a verdict here. -->

<!-- The paragraph below is the 6 Aug 2026 audit note, kept as written. Its own parenthetical
     "(live: 43 and 19, total 62)" was TRUE on 6 Aug and is now stale for exactly the reason it
     was written — chain membership grows. Live on 10 Aug 2026: 51 and 22, total 73. Derive it,
     do not read it. -->


<!-- audit #108, 6 Aug 2026. The two lines below are FROZEN as-written and are no longer the
     instruction. They read `npm run organism:selftest` (31 suites) · `npm run squad:selftest`
     (all 8 original agents) — both counts wrong (live: 43 and 19, total 62), and both commands
     are `&&` chains, i.e. FAST-FAIL membership records, not nets: one red organ leaves every
     member after it unrun and unreported (package.json `_runner_law`). A hardcoded count in a
     runbook rots the first time an organ is added — audit #107 added four and neither number
     moved. Hence the command, not the number. -->
~~`npm run organism:selftest` (31 suites) · `npm run squad:selftest` (all 8 original agents).~~
Those two chains still exist and are still useful for a fast pre-commit glance — just don't read
a count off them.

## Sunday
Off. ~~The organism idles with you.~~ The Boot Room files its one proposal for
Monday's sheet; your "haan, chalao" is the only word it will ever act on.

> (corrected 10 Aug 2026 — three claims, one true, one false, one gated.
>
> · **"Off"** — TRUE, and deliberately unmeasured. `grep -n "Sunday off" scripts/outwork_audit.mjs`
>   → won-day #5 is "deliberately unchecked (his life; a rest day needs no permission slip)".
>   Nothing scores you on a Sunday. That is a design decision, not an oversight.
> · **"The organism idles with you"** — FALSE, and it has probably never been true. The machine
>   keeps a full Sunday: `ArsenalFC-BrainTick` fires every 30 minutes all day, both conductors run
>   DAILY (`ArsenalFC-Morning-Conductor` 09:15, `ArsenalFC-Evening-Conductor` 22:00),
>   `ArsenalFC-PresenceFit` runs 03:30 *specifically* on Sundays, and the brain has a Sunday-ONLY
>   overnight job — `market_scan`, `days: ["Sun"]`, `enabled: true`. Verify with
>   `Get-ScheduledTask -TaskName "ArsenalFC-*" | Select-Object TaskName,State`. The correct
>   sentence is: YOU idle; the organism keeps recording, so Monday starts on a full week of data
>   instead of six days and a hole.
> · **"The Boot Room files its one proposal for Monday's sheet"** — the Sunday timing is right
>   (`ArsenalFC-BootRoom`, weekly, Sunday 20:00) and the approval law is right and enforced
>   (`grep -n "approve_genome" scripts/dugout.mjs` — a SPOKEN GATE that never fires from
>   inference), but two details on this line are wrong today. (a) It has filed NOTHING and cannot
>   yet — `dressing-room/state/mutations.jsonl`, the proposal ledger, DOES NOT EXIST on this box,
>   and the last two entries of `dressing-room/state/bootroom_log.jsonl` read `"quiet_day"` (9/200)
>   and `"gate_closed"` (17/200). See the genome note in the "While you sleep" section above, and
>   read the live counter with `node scripts/physio.mjs` — it said 21/200 the same afternoon,
>   because the log records what the gate saw on the genome's LAST Sunday run while physio
>   recomputes the rep count today. Two true numbers, hours apart. Write neither one down.
>   (b) "Monday's sheet" is not where it lands. `grep -n "genome\|mutation" scripts/manager.mjs`
>   returns nothing at all — the sheet builder never opens `mutations.jsonl`, so no proposal has
>   ever reached `team_sheet.md`. (The brain DOES touch the file, but only as a config-declared
>   input to the overnight `deep_reanalysis` job, which writes an analysis file, not the sheet —
>   `node scripts/brain.mjs status` currently lists it under "absent" for exactly that job.)
>   The proposal surfaces instead through physio → `loop_vitals.genome`
>   (`grep -n "genomePending" scripts/physio.mjs`), which the `/matchday` and `/genome` skills and
>   the Dugout open. So when it does start filing, say "genome" — do not go looking for it on
>   `team_sheet.md`.)
