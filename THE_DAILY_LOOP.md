# ⚪🔴 THE DAILY LOOP — zero-tax edition

> You learn in **Claude**, code in **Colab**, drill in **Gems**, listen in **NotebookLM**.
> The organism is the CLUB around those four — and after M12, feeding it costs
> **ONE gesture per session. Copy. That's the whole tax.**
>
> **THE TURNSTILE** watches your clipboard: the moment you copy a reps-JSON block
> — from claude.ai, Colab, a Gem, anywhere — it's captured, validated, heartbeat run,
> and a quiet voice says *"reps andar."* On the phone: share the JSON to your
> throw-in channel — same thing, automatically. You never open a terminal. Ever.
>
> *(re-verified 10 Aug 2026 against the code — this paragraph HELD, every clause.
> The daemon is `scripts/turnstile.mjs`, whose own header calls itself M12; it reads the
> clipboard on a 4-second cadence, hands the blob to `capture.mjs paste` — the owner, and
> the only validator — then runs `heartbeat.mjs` and speaks `"<n> reps andar. Session
> captured."` It also refuses to lie about a rejection: if capture appends nothing it says
> so out loud instead of going quiet (`grep -n "FABRICATION GUARD" scripts/turnstile.mjs`).
> The phone half is real too — `scripts/throwin.mjs` diverts a contract-shaped ntfy message
> straight to capture and never lets it become a loose ball
> (`grep -n "looksLikeContract" scripts/throwin.mjs`).
> **Never trust this paragraph, trust these two commands:**
> `node scripts/turnstile.mjs selftest` (the contract) and
> `powershell -c "Get-NetTCPConnection -LocalPort 4111 -State Listen"` (is it actually
> watching — the singleton lock IS the liveness proof; it was LISTENING when this was
> written). One trap for a future reader: the `ArsenalFC-Turnstile` scheduled task reads
> **Disabled** and that is CORRECT, not broken — `setup/INSTALL_CONDUCTOR.ps1` retired it
> into the morning chain (its `$replaced` list names it at 07:04), so the daemon now starts
> at logon and is respawned by `scripts/daemon_watchdog.mjs`, whose `DAEMONS` table is
> turnstile:4111 · cortex:4112 · thalamus:4113 · brain:4116.)*

---

## THE DAY

| When | You do | The club does |
|---|---|---|
| ☀️ ~08:45 **[1]** | Phone buzzes. Double-click **MATCHDAY**, say *"good morning."* | Reads you the day: verdict, ≤3 drills (first winnable by law), dues. Boots its own brain. |
| 📚 Learning | **Easiest: `/forge <concept>` in Claude Code** — zero paste, reps auto-captured at "session khatam". Or study on claude.ai with the one-time header (below) and just **copy** the JSON at the end. | The turnstile ingests the copy in seconds. |
| 💻 Colab | Code. At the end, the header cell prints the JSON → **copy it.** | Same. Copy = captured. |
| 📱 Gem drill | THE EXAMINER probes you, prints reps JSON → **share it to the throw-in channel** (or copy, if on laptop). | Throw-in poller recognizes blood vs thoughts — reps auto-capture, thoughts wait for evening. |
| 💭 Any stray thought | Throw-in from the phone, one line. | Lands verbatim, never counts against you. |
| 🎧 NotebookLM | Just listen. | Nothing to do — listening isn't a rep. |
| 🔬 Research **[2]** | When the Gaffer says *"scout pack tayyar hai"* — run it on the Pro account; share the summary back like a throw-in. | The NIGHT SHIFT reads it, not the doubtminer — and there is a second, newer research lane now. See **[2]**. |
| 🌙 22:00 **[3]** | *"full time"* → result · one signal · KAL-line → *"haan, chalao."* | Scores the day, stages tomorrow, works all night. |

### TABLE NOTES — the 10 Aug 2026 repair pass (this file had not been touched since 14 Jul 2026, `git log -- THE_DAILY_LOOP.md`)

**[1] ~08:45 HELD — and here is how to check it instead of believing this line.**
The morning push rides `formation_read`, the Manager's M-3 job:
`node -e "const j=require('./dressing-room/state/brain_config.json'); console.log(j.jobs.find(x=>x.id==='formation_read')); console.log(j.ntfy)"`
→ `at: "08:45"`, and `ntfy.push_after: ["formation_read"]` (the phone has exactly TWO
sanctioned utterances, ever — that sheet and the full-time bell; the config's own `_note`
says so). Observed live, not assumed: the last `formation_read` in `brain_ledger.jsonl` is
`2026-08-10T03:15:09Z` = **08:45 IST**, note `sheet source=llm (validated) · push sent`.
Read it yourself with
`node -e "const fs=require('fs');const r=fs.readFileSync('dressing-room/state/brain_ledger.jsonl','utf8').split('\n').filter(l=>l.includes('formation_read')).slice(-3);r.forEach(l=>console.log(JSON.parse(l).ts))"`.
**One thing under it moved, though:** the morning CHAIN that feeds the sheet is no longer
14 staggered alarms — it is ONE task, `ArsenalFC-Morning-Conductor`, and it fires at
**09:15, by his own word on 7 Aug 2026** (the reason is written into
`setup/INSTALL_CONDUCTOR.ps1` — `grep -n "09:15, the captain's word" setup/INSTALL_CONDUCTOR.ps1`).
So the 08:45 buzz comes from the resident brain daemon; 09:15 is the catch-up net under it.
That is also why a dozen `ArsenalFC-*` tasks read *Disabled* in Task Scheduler: they were
retired INTO the chain (`node scripts/conductor.mjs plan`), not switched off in anger.
The ≤3 drills law and the winnable opener are real and selftested —
`grep -n "≤3 DRILLS LAW\|winnableOpener" scripts/setpiece.mjs`. But "≤3" is the CEILING on a
green day only; the cap is per-verdict and it is TUNABLE canon, so read it from the live file
and never from a doc (not even from setpiece's selftest, whose ladder numbers are deliberately
a FIXTURE after a 25 Jul 2026 audit — `grep -n "Code is now tested against" scripts/setpiece.mjs`):
`node -e "const j=require('./dressing-room/state/ladder_config.json');for(const k of ['GREEN','AMBER','RED'])console.log(k,j[k].max_drills,j[k].first_ball)"`.

**[2] "Doubtminer digests it overnight" was WRONG — corrected 10 Aug 2026.**
`doubtminer.mjs` has exactly ONE input and it is not this lane: `dressing-room/state/capsules/*.json`
(`grep -n "INPUT (read-only)" scripts/doubtminer.mjs` → capsules, mirror's output). A research
summary thrown in from the phone lands VERBATIM in `loose_balls.jsonl` and is read by
**`nightshift.mjs`** (`grep -n "THROW-INS (stray thoughts, verbatim)" scripts/nightshift.mjs`)
and routed at full-time by **`postmatch.mjs`** (`grep -n "loose_balls" scripts/postmatch.mjs`).
Believing the old line would have you expect research to turn into doubt-grammar and the
Tape Room overnight; it never did and never will on that path.
**Also newer than this file:** since 8 Aug 2026 the outward lane is THE MISSIONS DESK inside
`scout.mjs` — `node scripts/scout.mjs mission list`, prompts in `dressing-room/missions/`,
return door `node scripts/scout.mjs mission ingest <ID> [--file <path>]`, and a `/fire` skill
that drives Chrome so the paste tax is zero (`grep -n "MODES:  run (default) · selftest · mission" scripts/scout.mjs`).
The scout pack itself is still real — `nightshift.mjs` writes `scout_pack.md` and the Gaffer
is told to mention it ONCE at a stoppage, never as an upsell.

**[3] 21:30 was STALE — the bell is 22:00.** Corrected 10 Aug 2026. His own ruling, 9 Aug 2026,
quoted in the code that owns the bell: *"bell time 10:00 krdo, i come back home at that time"*
— `grep -n "B3 (9 Aug 2026, HIS RULING)" scripts/brain.mjs`, where `BELLS.fulltime.at` is
`"22:00"` with a 75-minute grace, and a selftest holds the hour so it cannot drift back
(`grep -n "BELL HOUR" scripts/brain.mjs`). The evening chain agrees —
`grep -n "id: \"bell\"" scripts/conductor.mjs` → `at: "22:00"` — and so does the box
(`ArsenalFC-Evening-Conductor`, daily 22:00; the old standalone `ArsenalFC-Bell-FullTime`
task is Disabled because the chain swallowed it). A reader trusting 21:30 waits half an hour
for a buzz that is not coming, then closes the day late.
The three answers are exactly what `postmatch.mjs` takes —
`--hit HIT|MISS|PARTIAL|REST --signal "…" --kal "…"` — and *"haan, chalao"* is the
throw-in routing word (`--route all`); nothing is ever auto-written.

**THE ROWS THAT HELD** (checked the same day, listed so the next audit does not re-derive them
from scratch — and so nobody "corrects" a true line): *Learning* — `/forge` really does close
itself, `grep -n "session khatam / done / bas" .claude/skills/forge/SKILL.md`, and the reps go
out through `capture.mjs` (the owner), never by hand. *Gem drill* — the diversion is real
(`grep -n "blood or thought" scripts/throwin.mjs`), and thoughts really do wait for the evening
because `postmatch.mjs` is what routes an unrouted ball. One number the table hides: the phone
lane is a POLLER on a **15-minute** repeat, not a live wire — the clipboard is the 4-second one.
Read the cadence off the box, never off this page:
`schtasks /query /tn "\ArsenalFC-Throwin" /fo LIST /v`. *Any stray thought* — "lands verbatim,
never counts against you" is not a promise, it is two constitutional guards with selftests,
`grep -n "IRON GUARDS" scripts/throwin.mjs` (VERBATIM · NEVER COUNTS USAGE). *NotebookLM* —
"listening isn't a rep" is enforced at the gate: `surface` is a closed set of two, and
capture's own selftest uses `surface: "notebook"` as an example of a malformed rep it must
REJECT (`grep -n "surface: \"notebook\"" scripts/capture.mjs`).

**Weekly, one command:** `/gem-sync` in Claude Code — your phone examiner gets tonight's fresh probes pasted into it by Claude driving your Chrome. You watch.
*(verified 10 Aug 2026: the skill exists — `ls .claude/skills/gem-sync` — and "weekly" is not
your job to remember. The Physio holds the calendar: at **≥7 days** since the last stamp it
files a `gem_sync_due` bleed onto the vitals, and with no stamp at all it says the pocket
examiner is running on an old cartridge — `grep -n "gemSyncDue" scripts/physio.mjs`.)*

---

## ONE-TIME SETUP (5 minutes, once, then never again)

1. **claude.ai** → Settings → Profile ("what should Claude know about you") → paste the
   SESSION HEADER below. Every future thread knows the FORGE rules automatically.
2. **Colab** → keep a first cell with the same header text as a comment for the session's Claude/Gemini.
3. Done. (The Gem already has its rules via /gem-sync.)

*(NOT VERIFIED 10 Aug 2026 — steps 1 and 2 live on claude.ai and inside Colab, outside this
repo; no script or state file can confirm a profile field or a notebook cell, so treat them as
a claim, not a proven fact. Step 3 IS verified: the cartridge the Gem gets is written by
`nightshift.mjs` and it already carries the full rep shape, `grep -n "so I can paste it into my capture system" scripts/nightshift.mjs`.
And one thing this section never knew about the Colab lane: **copy is not the only path there.**
`capture.mjs` has a second door that reads a Drive inbox — `grep -n "function resolveInbox" scripts/capture.mjs`
— and on this box it is WIRED, not dormant: `dressing-room/state/capture_config.json` names an
inbox, `node scripts/capture.mjs pull` answers `pulled 0 from 0 file(s)` (wired-and-empty, not
"unconfigured"), and `ArsenalFC-CapturePull` runs that pull **hourly from 09:00**. Check both
live rather than believing this note: run the pull, then
`schtasks /query /tn "\ArsenalFC-CapturePull" /fo LIST /v`.)*

## THE SESSION HEADER (one-time paste into claude.ai preferences)

```
When we do a study/FORGE session: (1) ONE concept at a time; before I answer any
check-question I must state my gut-word first — "knew", "shaky", or "guessed" —
no gut-word, no answer counts. (2) Probe me along: what-it-is/analogy · why ·
mechanism · math · limits · trade-offs · build-hook · scale-gotcha · explain-3-ways.
(3) Be a skeptical interviewer, not a cheerleader. (4) When I say "session khatam",
output ONLY a JSON array of every rep:
[{"surface":"gem","track":"concept","concept":"<name>","axis":"<a-i>",
  "question":"<probe>","confidence":"knew|shaky|guessed","correct":true}]
(coding sessions: "surface":"colab","track":"skill","axis":null — a skill rep that still
carries an axis letter is REJECTED). "correct" is the honest verdict, true OR false —
never all-true. I will simply copy that block.
```

*(corrected 10 Aug 2026 — the coding-session parenthetical said only
`"surface":"colab","track":"skill"` and left `"axis":"<a-i>"` standing from the template
above it. That combination is **hard-rejected** by the one validator that matters:
`grep -n "axis only on track=concept" scripts/capture.mjs`, locked by the selftest
`grep -n "skill+axis ⇒ reject" scripts/capture.mjs`. The failure is not silent but it IS
total — the turnstile would hand the blob to capture, capture would append zero, and the
voice would say `"Woh session capture nahi hua, captain"`. A whole coding session, gone at
the gate. The `true OR false` clause is the same family of scar: capture's audit #108 note
records a miss he never made being written because a boolean was defaulted instead of read
(`grep -n "THE --correct FLAG IS PARSED, NEVER DEFAULTED" scripts/capture.mjs`).*

*Two more facts about this block, verified the same day, so nobody "fixes" it wrongly later:*
- *It carries **no `ts`** — and that is right for the two zero-tax lanes, because both stamp
  the arrival instant themselves: the clipboard lane in `turnstile.mjs` (`grep -n "ARRIVAL IS THE TIMESTAMP" scripts/turnstile.mjs`)
  and the phone lane in `throwin.mjs` (`grep -n "function completeReps" scripts/throwin.mjs`).
  If you ever hand a file to `node scripts/capture.mjs paste <file>` BY HAND, every rep needs
  a parseable ISO `ts` or it is rejected at the gate (`grep -n "ts not a parseable date" scripts/capture.mjs`).*
- *The surface/track/axis vocabulary is closed, not free text:
  `grep -n "const SURFACES\|const TRACKS\|const AXES" scripts/capture.mjs` →
  surface ∈ {gem, colab} · track ∈ {concept, skill} · axis ∈ a–i (9 axes) or null, and the
  field must be PRESENT even when null. The Gem's own cartridge already emits the full shape
  (`grep -n "so I can paste it into my capture system" scripts/nightshift.mjs`), which is why
  copying the Gem's output on the laptop works exactly like sharing it from the phone.*

## WHEN CURIOUS

| You want | Say / run |
|---|---|
| Everything the club did + what's dormant | Dugout: *"club report do"* |
| A zero-paste study session right here | `/forge <concept>` in Claude Code |
| Health check | `/organism-doctor` |
| A timed mock (code round on the Chalkboard) | SCRIMMAGE icon |
| Show someone the club | ARSENAL BRIEFING 1 / 2 icons |

*(all five rows checked 10 Aug 2026 — all five HELD. Evidence, in the same order:
`grep -n "club report do" scripts/dugout.mjs` (the Gaffer's own words to him) and
`grep -n "get_club_report" scripts/dugout.mjs` (the tool behind it) · `ls .claude/skills/forge` ·
`ls .claude/skills/organism-doctor` · the SCRIMMAGE icon opens the Dugout at
`http://localhost:4114/?mode=scrimmage` and THE CHALKBOARD behind it is a real sandbox tool,
`grep -n "THE CHALKBOARD" scripts/dugout.mjs`, firewalled off his personal data by pattern ·
and the two BRIEFING icons DO exist — but **not in the repo**. Nothing named BRIEFING has ever
been committed (`git log --all --diff-filter=A --name-only | grep -i briefing` comes back
empty); they live beside the others in the desktop folder **ARSENAL VAULT**, which holds a few
launchers `setup/launchers/` does not. So `ls setup/launchers/` is NOT the way to check this
row — open the vault.)*

*(one thing this table is now SHORT of, noted 10 Aug 2026 rather than guessed at: it names only
two of the Claude Code surfaces, and there are many more today — `/learn`, `/full-time`,
`/matchday`, `/harvest`, `/fire`, `/rematch`, `/paste-session`, `/genome`, `/gist-patch`,
`/paint`, `/talk`. Do not trust that sentence either, since it rots the next time one is added
— **list them live: `ls .claude/skills/`**, and each skill's own `SKILL.md` says when it fires.)*

**The whole system, one line:** you study wherever you like; **copying the reps block
is the only move you owe the club** — and inside Claude Code, not even that.
