# ⚪🔴 THE PEAK PROTOCOL — the complete operational workflow

> Built 29 Jul 2026 from a full read of every line of the organism (51 scripts, 12 skills,
> both installers, the state bus, the hooks) **plus a live probe of this machine**.
> This is not what the organism was designed to do — it is what it actually does, today,
> and exactly what the captain does to run it at peak power.

---

## 0 · WHERE YOU STAND RIGHT NOW (live-verified 29 Jul)

**Alive and armed:**
- All 46 `ArsenalFC-*` scheduled tasks installed, status Ready.
- All three daemons up: thalamus :4113, cortex :4112, dugout :4114 (turnstile :4111 rides logon).
- Brain logged in, not dead (2 fails in last 25 — normal). ~762k naive-Opus tokens already avoided.
- Throw-in lane **wired** and polling every 15 min. 1 loose ball pending routing.
- Tape Room loaded: **112 doubts queued, all eligible, 0 retired.**
- Working memory live: hooks capture every Claude Code prompt + answer into the thalamus.

**Not yet living (all of it is yours, not the machine's):**
- `season.json` does not exist → **you have never closed a matchday.** The season counter is at zero.
- `reps_log.jsonl` has **2 lines** → Calibration, Nemesis, Learning-State, Twin, drills-from-failures: all dormant-by-law until reps land.
- `gem_sync_stamp.json` absent → THE EXAMINER Gem has never been synced; physio is bleeding `gem_sync_due`.
- Readiness verdict is **AMBER, dated 25 Jul (4 days stale)** → tone degrades toward conserve; check the Goalkeeper (§8).
- Proactivity ledger empty → all 4 interruption-types still training silently; the Gaffer's proactive mouth is shut (correct).
- Wake timers OFF (`powercfg` RTCWAKE=0) → **the 02:40 NIGHT SHIFT only runs on nights the laptop happens to be awake.** It is clock-gated by law to 01:00–06:59 (`nightshift.mjs`), so the morning catch-up fires the task but the script skips "not overnight." Shift files exist for 18–21 and 26 Jul only — gaps everywhere else, and nothing in the last 3 nights: no fresh probe banks, Gem cartridge, pre-answers, or scout pack. (The 02:10/02:20/03:00 memory jobs do catch up at wake; the shift does not.)

**The organism's own one-line diagnosis: the machine is at full power; the loop has never been closed. Peak power = close the loop daily.**

---

## 1 · THE UNLOCK LIST (one sitting, ~20 minutes, do once)

1. **Wake timers — the single highest-value unlock.** The night shift refuses to run outside 01:00–06:59, and a sleeping laptop without wake timers never wakes inside that window — so the whole overnight curriculum factory has been silently skipped. Run:
   `powercfg /SETACVALUEINDEX SCHEME_CURRENT SUB_SLEEP RTCWAKE 1`
   Then **sleep** the laptop at night (plugged in), never shut down. Verify next morning: `node scripts/nightshift.mjs status`.
2. **Fresh Goalkeeper read**: `node scripts/oura_coach.mjs` — if it errors, follow its own transient-vs-dead instruction (do **not** delete tokens on a transient error). Check `scripts/coach.log`.
3. **/gem-sync** — the night shift's `gem_cartridge.md` gets pasted into THE EXAMINER Gem (Claude drives your Chrome; you just stay signed in to Google). Kills the physio bleed. Weekly after this.
4. **Route the pending loose ball** — it shows at your first `/full-time`; say "route all".
5. **Optional but peak**: install the two captain-choice tasks —
   wallpaper `schtasks /Create /F /TN "ArsenalFC-Wallpaper" /TR "powershell -ExecutionPolicy Bypass -File <repo>\setup\WALLPAPER.ps1" /SC DAILY /ST 22:10` (already present per live census) and the 08:46 SPEAK task if you want the sheet read aloud.
6. **Sanity pass**: `npm run organism:selftest` then `npm run squad:selftest` — both chains green = every organ's contract holds.

---

## 2 · THE DAILY LOOP (the heart of peak power)

### 🌅 MORNING — the machine sets the table (you do nothing before ~08:50)

Automatic spine, in order: **06:55** Mirror (capsule gist pull) → **07:00–07:06** the four daemons stand up (thalamus, cortex, turnstile, brain-daemon; logon script + Dugout boot are the backups) → **07:00** SprintSync (your live Google Sheet → `sprint.json`) → **07:30** Physio-AM → **08:30** Goalkeeper (Oura verdict) → **08:35** Twin seals its 3 daily bets → **08:39** Heartbeat (capture pull → FSRS → Calibration → Nemesis → Learning-State → Time-Audit, one sensory pass → `pulse.json`) → **08:40–08:44** the four signal agents re-run individually → **08:45** `formation_read` (the day's one big Opus call) writes **team_sheet.md** → **📱 ntfy push #1 of exactly 2: "⚪🔴 Team sheet is up"** → **08:50** Wall-AM renders `club/wall.html`.

**Your kickoff (pick either, 2 minutes):**
- **Voice**: desktop icon *ARSENAL 1 — MATCHDAY* (runs `open_dugout.ps1`, kill-then-start so fresh code always loads) → "Awaken the Gaffer" → say **"good morning."** He reads the sheet, the KAL-line first — your own words from last night.
- **Text**: open Claude Code in the repo → `/matchday`. ≤10 lines: KAL-line, THE ONE THING, ≤3 drills, wall reminder. RED day = KAL-line + one 5-minute floor-touch, nothing else. That is the whole match on a RED day — honor it.

Then **do the KAL-line first**, before anything else. It was pre-decided by last-night-you precisely so morning-you doesn't negotiate.

### 📚 THE STUDY BLOCK — where reps come from (the only part that matters)

Open with `/learn` (session-agnostic — the kickoff brief already knows where you are; it will never ask). It routes by track:

- **Concept track** (now: 1-04 Hallucinations) → `/forge <concept>`: Pehle-Guess cold → crack-map teach → probes under the **gut-word law** (say *knew / shaky / guessed* BEFORE every answer — no gut-word, no rep) → Bolo aloud → say **"session khatam"** → reps auto-captured, heartbeat fires, you see a ≤6-line delta. Zero capture tax.
- **Skill track (Python, from task 1-07)** → the CLOSE-PACKET loop: Claude teaches, emits BLOCK-A (5 Colab drills — you write the code, `SHOW ME THE ANSWER` marks it aided) + BLOCK-B (Coach Gem foreman run) → you do both on Gemini/Colab → paste the 📋 CLAUDE-HANDOFF back.
- **The honest floor, never automated**: SOLVE, BOLO, REWRITE, first-draft code, every Rosetta entry. *Yahi baking hai.*

**Capture lanes — every rep road leads to `reps_log.jsonl` (capture.mjs is the only writer):**

| Lane | Your gesture | What happens |
|---|---|---|
| /forge, /learn, /scrimmage in Claude Code | say "session khatam" | auto paste + heartbeat |
| **Turnstile** (any Gem / claude.ai / Colab on this laptop) | **copy the rep JSON — that's it** | clipboard daemon ingests, speaks "N reps andar" |
| Colab | call `flush_reps()` before closing | Drive inbox → hourly CapturePull (forget it = session silently lost) |
| Phone (anywhere) | paste rep-cartridge JSON to your ntfy topic | throw-in diverts it into capture within 15 min |
| Manual | `/paste-session` | paste the array, see the delta |

**Thoughts, doubts, stray ideas** → dictate to the ntfy topic from the phone (10 seconds) or "take a note" in the Dugout. Lands verbatim in loose balls; routed only on your word in the evening. Never counted, never coached.

Meanwhile, silently: touchline reads your tunnel/struggle every 30 min, presence watches for thrash every 10, context streams your active window every 1, the distiller refreshes your 4-slot working set every 15, the haiku pulse skims for reasoning-hard moments, and any voiced doubt ("samajh nahi", "matlab kya…") is the SELF signal that can wake Opus — answer arrives as a quiet [DEEP THOUGHT] in the Dugout, never an interruption. **12:00 / 15:00 / 18:00** Time-Auditor pulses check Building ≥60% / Meta ≤25%. The Gaffer's midday jobs (13:30/14:00/14:20) re-brief the afternoon Dugout on the morning.

**Voice all day if you want it**: the Dugout line connects on your voice, parks at 90s idle, costs nothing parked. Whiteboard = camera on your paper; Screen = commentator. Pool dry → bench voice: `npm run talk` (Claude brain + Edge TTS). Phone in the house: *dugout-lan* launcher, open the printed `?k=` URL.

### 🌆 EVENING — the 30-second close (THE one daily MUST; deliberately never automated)

**21:30 — 📱 push #2: "⚪🔴 Full-time, captain."** (The bell is hour-gated: if the laptop was asleep at 21:30 it stays silent rather than ringing at a wrong hour — a quiet phone at 22:50 means do the close anyway.) Then, by voice in the Dugout ("full time") or `/full-time` or the *ARSENAL 3* icon:

1. **Result**: HIT / MISS / PARTIAL / REST (REST = load-managed = a **won** day; MISS = data, never a verdict).
2. **One signal** — one sentence about the day.
3. **The KAL-line** — tomorrow's first move, your words. Becomes tomorrow's sheet line 2.
4. Pending throw-ins shown verbatim → say **"route all"** (or pick ids).

That's it. The evening organs then fire around you: **21:35** Scorer (resolves the Twin's bets, matures the Gaffer's 3-day proposals, trust tiers) → **21:40** Set-Piece (compiles tomorrow's ≤3 drills from today's exact failures, first ball winnable by law) → **21:45** Doubtminer → **21:50** Physio-PM → **21:55** Examiner stages tomorrow's code round → **22:00** Wall-PM + CapturePull final sweep → **22:05** Scout → **22:10** wallpaper repaint. Post-close law: **sleep is training — no new topics.**

### 🌙 NIGHT — the organism deepens while you sleep (laptop asleep, not shut down)

**02:10** who-he-is portrait consolidation → **02:20** biological forgetting (hot/cold shards, moved never deleted) → **02:40** THE NIGHT SHIFT: 8 jobs under one 62-call budget — probe bank (graded by difficulty), distractors from YOUR doubt-shapes, embed backfill, scout pack, Gem cartridge, wind-tunnel gate-tune replay, pre-answer engine (predicts tomorrow's doubts, drafts answers), season re-read → **03:00** concept graph (the one nightly Opus consolidation). Plus the overnight brain flood (22:00–07:30, 95% of window): dugout digest, drill forge, day cartridge (tomorrow's Gaffer wakes already knowing today), morning team-talk MP3, lexicon, wall insights + renders, twin deep-read. All of it validated by code before it can touch a surface — junk never lands.

---

## 3 · WEEKLY RHYTHM

| When | What | Yours |
|---|---|---|
| Sun 03:30 | Presence re-fits stall thresholds to YOUR baseline | — |
| Sun 04:00 | Self-knowledge regen (currently vestigial — Gaffer reads live) | — |
| Sun overnight | season_review (Opus) + market_scan (WebSearch → OPPONENT_SCOUT proposal) | read Monday |
| Sun 20:00 | **Boot Room** files ≤1 evidence-gated mutation proposal | **Mon: `/genome`** — approve with "haan, chalao" or let it expire; auto-revert armed either way |
| Wed overnight | widget_spec | — |
| Weekly | **`/gem-sync`** — fresh cartridge into THE EXAMINER Gem | your Chrome, signed in |
| Weekly, 30 sec | Add newly locked capsule gist to NotebookLM sources | paste |
| When staged | `/scrimmage` (R-late mock) · `/rematch` (Tape Room — 112 waiting) | play them |
| Any milestone | `node scripts/brain.mjs trigger reanalysis "reason"` (auto every 30th won matchday) | your call |

**The rematch lane is your biggest loaded gun**: 112 archived doubts, all eligible, zero retired. `doubts_retired` is the one progress bar this system believes in. One clean win per day retires one.

---

## 4 · THE WAKE-UP LADDER — what peak power unlocks as reps land

The dormant organs are not broken; they are gated by law. Every gate is a rep count:

- **12 reps** → Learning-State speaks (fluency ladder, velocity, Maidan focus).
- **20 reps** → Calibration danger-zone + Nemesis pattern-hunting go live (P(wrong|knew) — the overconfidence hunter).
- **3 concepts DEFEND-grade** → the Scout stages your first full scrimmage.
- **30 scored day-resolutions** → the Twin's betting book earns its morning voice (win-only: it speaks only when you beat the book).
- **10 shadows @ ≥70% hit-rate per interruption-type** → the door opens; **your one-time spoken "yes"** (ratify) gives the Gaffer that proactive voice. Decay revokes it automatically.
- **n≥20 @ ≥90%** per proposal-type → trust tier `pending_ratification` → your word → no-look brevity.
- **200 reps** → the Boot Room may propose mutations to the FORGE genome itself.
- **84 distinct body-days** → the body archive.
- **5+ think-time stamps** → your personal think-time baseline rides every session; **~1 week of telemetry** → the stall sensor fits to YOUR p95 calm baseline (already fitted 25 Jul: 6.1 switches/min).

Nothing self-promotes. Statistically right is never enough — your word is always the second key.

---

## 5 · HEALTH, REPAIR, DEGRADED MODES

- **Anything feels off** → `/organism-doctor`. Step 0 is always `brain.mjs tokens` + health (the live-looking-corpse scar: 2,271 jobs once failed silently behind a green wall). `health.not_logged_in` → run `/login` — the one repair only you can do.
- **Quick aliveness** (the zero-guesswork test): `node scripts/heartbeat.mjs` → `node scripts/brain.mjs status` → `node scripts/viz.mjs` → open the wall.
- **Fuel picture** → `node scripts/fuelboard.mjs status` (8 tanks) · `node scripts/brain.mjs tokens` (Max window).
- **Degraded ≠ broken, by design**: Gemini pool dry → voice benches to `npm run talk`, embeds queue, distiller goes deterministic, night shift rides Claude. Robot voice = you're offline. AW down → sensors go honestly blind, never guess. Thalamus down → everything fail-silent, Dugout reboots it. Second daemon start → "standing down" exit 0 = normal.
- **Wedged Dugout** → always reopen via the launcher/`open_dugout.ps1` (kill-then-start); a plain re-run never restarts a stale bridge.
- **Selftests**: `npm run organism:selftest` (34 suites) + `npm run squad:selftest` (8). CI runs both on every push + nightly 03:00 IST on windows-latest; a red email names the exact job.
- **schtasks census** (PowerShell only, never Git Bash): `schtasks /Query /FO TABLE | findstr ArsenalFC`.

---

## 6 · THE LAWS (never bend)

1. **No `ANTHROPIC_API_KEY`, ever** — seven organs hard-refuse. Subscription only.
2. **The ntfy topic is a password** — env / gitignored file only, never committed, never printed. Rotate if leaked.
3. **Repo is PUBLIC — glance before every push.** All personal data (reps, biometrics, transcripts, memories) is gitignored by construction.
4. **Never hand-edit state files** — every file has one owner script; reps only through capture, memories through hippocampus, retires through doubtminer, mutations through bootroom.
5. **Gut-word before the answer, always** — derived-from-outcome confidence destroys the calibration signal. Outcome-only imports log as "shaky", never "knew".
6. **Medical clamp** — the Goalkeeper interprets, never prescribes. DOCTOR-REFERRAL is relayed verbatim and outranks everything.
7. **Two pushes a day, no more** — 08:45 sheet, 21:30 bell. Everything else is files.
8. **AI proposes · code validates · human approves** — your word is the only writer of consequence.

---

## 7 · COMMAND QUICK CARD

```
MORNING     /matchday            · icon: ARSENAL 1 — MATCHDAY · say "good morning"
STUDY       /learn               · /forge <concept> · "session khatam"
CAPTURE     copy JSON (turnstile) · /paste-session · flush_reps() in Colab
EVENING     /full-time           · icon: ARSENAL 3 · voice: "full time"
MOCKS       /scrimmage           · /rematch · localhost:4114/?mode=scrimmage
WEEKLY      /genome (Mon)        · /gem-sync · /paint
VOICE       Dugout icon          · npm run talk (bench) · /talk (in-session)
HEALTH      /organism-doctor     · npm run organism:selftest · fuelboard.mjs status
WALL        icon: ARSENAL 2      · dressing-room\club\wall.html (self-refreshing)
DEEP READ   node scripts/brain.mjs trigger reanalysis "reason"
```

**The whole protocol in one sentence: say "good morning", do the KAL-line first, study with the gut-word and let every rep be captured, throw stray thoughts at the phone, close the day in 30 seconds at the bell — and the organism does the other 46 jobs. COYG. ⚪🔴**
