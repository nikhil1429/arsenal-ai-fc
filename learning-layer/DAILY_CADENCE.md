# DAILY_CADENCE.md — The Match-Day Ritual (Kickoff · Ground · Full-Time)
# Nikhil × Claude · locked 20 Jun 2026 · OPERATIONAL layer · OS v3.13 stamp 08 Jul 2026
#   *(corrected 10 Aug 2026: the "v3.13" stamp is STALE. OS_CHANGELOG.md's newest entry is
#     **v3.14 (05 Aug 2026) — AUDIT #107, THE LEARNING-LAYER WIRING REPAIR**. PROJECT_OS.md's own
#     header still reads v3.13 too and now carries the same correction; the version line is HIS to
#     set, so nothing is bumped here. Never read the OS version from this line — read it live:
#     `grep -n "^# v3\." learning-layer/OS_CHANGELOG.md | head -1`.)*
# Yeh = HOW-EACH-DAY-RUNS. Project files mein rakho → har thread context mein AUTO-LOAD.
#   *(corrected 10 Aug 2026: **this file is NOT auto-loaded — by anything.** "Project files" was the
#     old claude.ai Project surface; he works in Claude Code now and this file lives in the repo at
#     `learning-layer/DAILY_CADENCE.md`. NOTHING splices it into a session. The SessionStart hooks are
#     exactly five — `teaching_contract.mjs reset-turns` · `learnstate.mjs brief` ·
#     `forge_session.mjs boot` · `watchman.mjs brief` · `captains_call.mjs deal`
#     (`grep -n "SessionStart" -A 12 .claude/settings.json`) — and the assembled brief names its own
#     parts in a footer: orientation · card · pending_facts · memory. No cadence part exists; run
#     `node scripts/learnstate.mjs brief` and read the last line yourself. The only code that
#     mentions this file at all is repo_bundle.mjs's index string
#     (`grep -rn "DAILY_CADENCE" scripts/`). So: a session **Reads** this file, or it does not
#     arrive. Note the split this creates — the RITUAL is wired in code (see every correction below),
#     the PROSE is not. Do not plan on the strength of "it auto-loads".)*
# Yeh standup teen baar design hua aur kabhi zinda nahi hua kyunki usko GHAR + FORMAT nahi mila.
# Ab ghar mil gaya — yahi woh file hai. PROJECT OPERATING SYSTEM + OS OUTWORK EXECUTION LAYER ke saath padho.
#
# OUTWORK-RELATIONSHIP (OS v3.13): yeh file = daily-loop ARM of OUTWORK EXECUTION LAYER
#   (canonical = EXECUTION_FINAL_Tier2_Metamorphosis.md + Tier-2 guide + OS OUTWORK section).
#     *(checked 10 Aug 2026 — HELD. Both canonical files are TRACKED IN THIS REPO under
#       `learning-layer/`, not on any Drive and not in "project files":
#       `git ls-files learning-layer/ | grep -iE "EXECUTION_FINAL|Tier-2"`. The OS's own OUTWORK
#       section is there too: `grep -n "OUTWORK EXECUTION LAYER — CANONICAL" learning-layer/PROJECT_OS.md`.)*
#   KICKOFF = thread-level K1 (morning-priming shape) · FULL-TIME = thread-level K4 (evening-audit shape).
#   3 unique guards (WON-DAY=5 · PRESENCE ≠ OUTPUT · KAL→KICKOFF weld) ab OS OUTWORK §RULES mein bhi
#   UP-ported — dono file carry karte, CONFLICT pe OS jeet-ta. In guards ka canonical GHAR yahi (yahaan se port hue).
#     *(checked 10 Aug 2026 — HELD, all three, and the OS credits this file by name as the origin
#       ("DAILY_CADENCE se PORTED"). Verify all three in one pass:
#       `grep -nE "WON-DAY = 5 NON-NEGOTIABLES|PRESENCE ≠ OUTPUT|KAL → KICKOFF WELD" learning-layer/PROJECT_OS.md`.
#       The pointer edit is there as well: `grep -n "DAILY_CADENCE ab OUTWORK" learning-layer/PROJECT_OS.md`.)*
# (THE_ACADEMY philosophy DELIBERATELY skip — Nikhil ka call. Yeh sirf daily loop mechanics.)
#   *(NOT VERIFIED 10 Aug 2026 — there is no THE_ACADEMY file anywhere in the repo
#     (`git ls-files | grep -i academy` returns nothing), so this skip cannot be checked against
#     anything on disk. Treat it as a scoping claim, not a pointer; do not go looking for the file.)*

---

## THE SPINE (ek line — sab isi pe tika)
**Process control kar — trophy follows.** Table dekh ke league nahi jeette; har din STANDARD hit
karke. Standard = point; points jud ke table khud climb. Outcome chase NAHI. Pace Nikhil ki.

---

## 3 PHASES — har din / har thread

### 1 ▸ KICKOFF  (thread start · ~5 min HARD time-box)
**Claude karta:**
- Forge gist CURL + (jab SEASON.md bane) logbook read.
  > *(corrected 10 Aug 2026 — BOTH halves are machine work now, neither is a manual step.*
  > *(1) The gist CURL is gone. `mirror.mjs` pulls the capsules from the gist into a local*
  > *READ-ONLY mirror at `dressing-room/state/capsules/`, and it is step 1 of the morning*
  > *conductor chain — read the chain live in `dressing-room/state/conductor.json` (`order`);*
  > *the 10 Aug 03:45 pass recorded `{"id":"mirror","ok":true}`. Evidence:*
  > *`grep -n "THE CAPSULE-MIRROR" scripts/mirror.mjs`.*
  > *(2) "jab SEASON.md bane" — **woh ban chuki hai.** `dressing-room/SEASON.md` exists on disk,*
  > *un-parked by his word 7 Aug 2026 and shipped 8 Aug, written 100% by `postmatch.mjs`*
  > *(`ls dressing-room/SEASON.md` · `grep -n "SEASON_MD" scripts/postmatch.mjs`). The kickoff*
  > *brief carries its streak line — `grep -n "logbook: dressing-room/SEASON.md"*
  > *scripts/learnstate.mjs` — but only ONCE a season exists; `season.json` has no first row yet,*
  > *so today that line is silent BY DESIGN, not broken. The LOGBOOK section at the bottom of this*
  > *file said "TO BUILD ⏸ PARKED" until today; it is corrected there too.)*
- Surface: **STREAK** · kal ki **KAL-LINE** (aaj ka pehla move, raat ko pre-decided) · har track kahan
  hai (ladder / M1 / Python) · koi due Re-Jirah.
  > *(corrected 10 Aug 2026 — this entire surface is RENDERED BY CODE now. Read it live with*
  > *`node scripts/learnstate.mjs brief` (the SessionStart hook) and `/matchday`; never assemble it*
  > *by hand, and never copy a value out of this file. Where each piece actually comes from:*
  > *· **STREAK** → learnstate's SEASON line, from `season.json`, silent until the first /full-time*
  > *writes row 1 — `grep -n "won-day(s)" scripts/learnstate.mjs`*
  > *· **KAL-LINE** → `manager.mjs` is the SOLE writer of `team_sheet.md` and quotes yesterday's*
  > *KAL-line verbatim as sheet line 2 (`grep -n "KAL-?LINE" scripts/manager.mjs`); /matchday prints*
  > *it FIRST (`grep -n "KAL-line verbatim" .claude/skills/matchday/SKILL.md`)*
  > *· **tracks** → sprint position + next-up ride the brief; the Python track has its own reader*
  > *(`grep -n "pythonBrief" scripts/learnstate.mjs`). **M1 is NOT surfaced** — it has no machine*
  > *source and postmatch.mjs names it as deferred rather than faking it:*
  > *`grep -n "DEFERRED, not faked" scripts/postmatch.mjs`*
  > *· **due Re-Jirah** → wired and loud; the 10 Aug brief printed `RE-JIRAH OVERDUE (4)`*
  > *(`grep -n "RE-JIRAH OVERDUE" scripts/learnstate.mjs`).)*
- Aaj ka **FLOOR** propose — ek clear, do-able target.
  > *(corrected 10 Aug 2026 — the floor is PROPOSED BY THE MACHINE and it is a **never-zero***
  > ***minimum**, not a target he negotiates: manager.mjs writes it into the sheet unconditionally*
  > *(`grep -n "FLOOR (never-zero)" scripts/manager.mjs`) and deliberately does NOT set it to the*
  > *KAL-line. Watch the name collision: the brief's `OUTWARD FLOOR: n/2 this week` is a DIFFERENT*
  > *floor — his ruled ≥2×/week outward count — `grep -n "OUTWARD FLOOR" scripts/learnstate.mjs`.)*

**Nikhil:** floor confirm / adjust. Bas.
**GUARD:** ~5 min hard time-box → planning-rabbit-hole yahin rukta. Subah design-session nahi, ek decision.

### 2 ▸ GROUND PE  (execution — din ka asli kaam)
- **FLOOR** work, full depth. Painfully-slow stays. Yahi sab kuch hai.
- **SURPLUS** rack (optional) — sirf TAB surface jab floor DONE + energy bachi ho.

**GUARD:** surplus hamesha **MAY**, kabhi **MUST** nahi. (floor-creep rok.)

### 3 ▸ FULL-TIME  (thread close)
**Claude karta:**
- **Honest review:** floor HIT / MISS. Flatter NAHI — jhoota "won day" bekaar hai.
  > *(corrected 10 Aug 2026 — the grade has **FOUR** values in code, not two:*
  > *`postmatch.mjs --hit HIT|MISS|PARTIAL|REST` (`grep -n "MODES:" -A 3 scripts/postmatch.mjs`).*
  > *The whole close is wired as `/full-time` → `node scripts/postmatch.mjs --hit <X> --signal "<s>"*
  > *--kal "<k>" [--route all]` → scorer → setpiece → viz*
  > *(`grep -n "postmatch.mjs --hit" .claude/skills/full-time/SKILL.md`).)*
- **SAVE-FLAG (step 4a):** koi bhi pending doubt / crack / decision → gist mein, thread band hone se PEHLE.
  > *(checked 10 Aug 2026 — HELD. "step 4a" resolves: it is PROJECT_OS's THREAD OPENER 4a*
  > *(`grep -n "4a. RECALL = CAPTURE MOMENT" learning-layer/PROJECT_OS.md`), which FORGE_SPEC names*
  > *as one half of GATE 1 (`grep -n "opener-4a" learning-layer/FORGE_SPEC.md`). "gist mein" is still*
  > *exactly right — the gist stays the MASTER and only HIS paste writes it; `capsules/` is a*
  > *one-way read-only mirror (`grep -n "the mirror never writes back" scripts/mirror.mjs`).*
  > *What the machine carries NOW, added since this line was written: pending doubts land in*
  > *`loose_balls.jsonl` (throwin.mjs sole writer) and /full-time routes them and drafts the ONE*
  > *gist edit for him to paste — `grep -n "loose_balls" .claude/skills/full-time/SKILL.md`.)*
- **Build-day:** commit reminder.
  > *(NOT VERIFIED as wired, 10 Aug 2026 — no organ and no skill prints a commit reminder.*
  > *`grep -rni "commit" .claude/skills/*/SKILL.md` returns only an unrelated gut-word "committed"*
  > *in /learn and a commit HASH in /matchday; /full-time's six steps contain no such step. Treat*
  > *this as a Claude-behaviour instruction with no code behind it. The only automated git write in*
  > *the repo is the groundsman's allowlist-guarded push lane, and it commits STATE, never his build*
  > *(`grep -n "kennel: night-shift outputs" scripts/groundsman.mjs`).)*
- **KAL-LINE:** kal ka pehla move ABHI decide (energy ab hai; subah groggy ko zero ambiguity)
  → seedha agle KICKOFF ko feed.
  > *(checked 10 Aug 2026 — HELD, and it is now enforced END-TO-END in code, which is more than this*
  > *line ever claimed: `postmatch.mjs --kal` writes the `KAL-LINE → …` line into*
  > *`post_match/<date>.md`; `manager.mjs` parses it with the identical contract regex and quotes it*
  > *as sheet line 2 (`grep -n "manager.mjs's exact parser contract" scripts/postmatch.mjs`);*
  > */matchday prints it first; and the weld is WATCHED nightly — outwork_audit's o2 check fires when*
  > *yesterday's KAL exists but today's sheet does not (`grep -n "o2 WELD-BROKEN" scripts/outwork_audit.mjs`).)*

---

## WON-DAY = 5 NON-NEGOTIABLES  (Claude inhi pe HONESTLY grade karta)
1. Floor-attempt **YA** conscious-rest
2. Depth jab kaam ho
3. **Bolo** har chhue concept pe
4. Honest review
5. Sunday off

> **VOLUME standard NAHI hai.** Presence ≠ output. 12 ghante baith ke zero seekha = won-day NAHI.

*(checked 10 Aug 2026 — all five HELD as written, and all five are PORTED into the OS:*
*`grep -n "WON-DAY = 5 NON-NEGOTIABLES" learning-layer/PROJECT_OS.md`. But be honest about what a*
*machine can see — the code already is. outwork_audit.mjs's header walks the five one by one:*
*#1 floor-attempt/conscious-rest and #4 honest review are visible only as PAPER TRAIL ("the RESULT:*
*line exists"); #2 depth and #3 Bolo are NOT machine-checkable at all; #5 Sunday off is*
*DELIBERATELY unchecked — "his life; a rest day needs no permission slip from a script"*
*(`grep -n "Sunday off" scripts/outwork_audit.mjs`). And the PRESENCE ≠ OUTPUT line above is no*
*longer honour-only: it is a real check, o6, INFO-grade — learning minutes > 0 with zero reps AND*
*zero teaching afferents on the same day (`grep -n "o6 PRESENCE" scripts/outwork_audit.mjs`).)*

---

## GUARDS — 3 failure-modes, pre-empted
- **DOPAMINE LOOP** → kickoff hard time-boxed.
- **FLOOR-CREEP** → surplus may, never must.
- **SHAME-SPIRAL** → floor-miss + conscious-rest = **LOAD-MANAGED**, failure NAHI. Streak intact.
  > *(checked 10 Aug 2026 — the shame-spiral guard is the ONE of these three that lives in code, and*
  > *it is stricter than this line: postmatch.mjs counts HIT, PARTIAL **and** REST as won days*
  > *(`grep -n "WON_DAY = new Set" scripts/postmatch.mjs`), renders REST as "LOAD-MANAGED — conscious*
  > *rest. That is a won day.", and its selftest pins a NO SHAME LAW — a MISS may not print*
  > *failure/streak language anywhere (`grep -n "NO SHAME LAW" scripts/postmatch.mjs`). The other two*
  > *(dopamine time-box, floor-creep) stay human rules with no organ behind them — nothing measures*
  > *kickoff length and nothing tracks surplus.)*

---

## HARD RULES (cadence-level)
- **NO DATE-COUNTDOWN.** Table-position dikhta hai; "X din bache" kabhi nahi. (URGENCY ≠ KAINCHI.)
  > *(checked 10 Aug 2026 — HELD, and enforced in code in at least four independent places, which is*
  > *rare for a rule written in prose: brain.mjs's prompt LAWS ban dates/deadlines/countdowns in any*
  > *teaching line; cortex.mjs and dugout.mjs carry the same inviolable; manager.mjs renders a PAST*
  > *ship date as ELAPSED rather than a negative countdown; and benchmark.mjs's selftest asserts no*
  > *"deadline / days left / due by" string can reach the report. Grep them live:*
  > *`grep -rn "countdown" scripts/brain.mjs scripts/cortex.mjs scripts/dugout.mjs scripts/manager.mjs`*
  > *· `grep -n "days left" scripts/benchmark.mjs`.)*
- Progress-check **milestone-based** (~weekly), date-based nahi.
- **APPLY-TRIGGER = M1 demo-able** (UI + eval dashboard) → **PARALLEL apply** (curriculum 17/17 NAHI). Date nahi.
  > *(annotated 10 Aug 2026 — "M1" checks out: it is the sprint's own theme "M1 Extraction Core*
  > *(Python)" (`grep -n "M1 Extraction Core" dressing-room/state/sprint.json`) and rides the season*
  > *as `pipeline_item` in the Manager. The **"17" does not check out against any code** — it is*
  > *AI_PE_ROADMAP.md's own foundations tally (`grep -n "Foundations progress" learning-layer/AI_PE_ROADMAP.md`),*
  > *prose-sourced and hand-maintained; nothing computes it. The machine-side registry counts*
  > *something else entirely — count it yourself rather than trusting either number:*
  > *`node -e "const c=require('./dressing-room/state/concepts.json');console.log(Object.keys(c.concepts).length)"`.*
  > *Read the 17 as the roadmap's tally, re-read it THERE, and never quote it from this line.)*
- Table climbs by meeting daily standard — table *dekhne* se nahi.

---

## KAL → KICKOFF WELD  (sabse bada mechanic)
Raat ki KAL-line = subah ka pehla move, pre-decided. Morning decision-fatigue **kill**.
(March tracker ka best field — "tomorrow's first task, zero ambiguity" — ab ek living loop.)

*(checked 10 Aug 2026 — "ab ek living loop" is now LITERALLY true, in code, which it was not when*
*this line was written. The full chain, each link greppable: `postmatch.mjs --kal` writes*
*`KAL-LINE → …` into `post_match/<date>.md` → `manager.mjs` parses it with the same contract regex*
*and puts it verbatim on sheet line 2 (`grep -n "manager.mjs's exact parser contract" scripts/postmatch.mjs`)*
*→ /matchday reads it out FIRST, before anything else (`grep -n "KAL-line verbatim" .claude/skills/matchday/SKILL.md`)*
*→ SEASON.md carries the last one on record (`grep -n "KAL→KICKOFF weld" scripts/postmatch.mjs`)*
*→ and outwork_audit's o2 check watches nightly for a KAL that never reached a sheet*
*(`grep -n "o2 WELD-BROKEN" scripts/outwork_audit.mjs`). The one link the machine deliberately does*
*NOT check is whether the sheet HONOURS the KAL — that is the Gaffer's semantic lane, by design.)*

---

## LOGBOOK (SEASON.md) — ✅ **BUILT + LIVE**  (this heading read "TO BUILD ⏸ PARKED" until 10 Aug 2026)
> (corrected 10 Aug 2026 — **THE MOST EXPENSIVE STALE LINE IN THIS FILE.** This heading said
> "TO BUILD ⏸ PARKED" and the section below told every session to wait for his word. **HIS WORD
> CAME ON 7 AUG 2026 AND THE LOGBOOK SHIPPED ON 8 AUG.** It is on disk right now —
> `dressing-room/SEASON.md` — machine-written 100% by `scripts/postmatch.mjs`, which is its sole
> writer. Evidence: `ls dressing-room/SEASON.md` · `grep -n "SEASON_MD" scripts/postmatch.mjs` ·
> `grep -n "un-parked by his word" scripts/postmatch.mjs`. Regenerate it any time with
> `node scripts/postmatch.mjs season`. **Never re-plan this build.** Every design bullet below is
> kept verbatim as the scar, each now marked SHIPPED or DEFERRED against the code.)

**Build-condition MET:** emb (6/21) + inf (6/24) + context (6/28) LOCK ho chuke — toh ab buildable.
  > *(checked 10 Aug 2026 — **HELD, exactly.** capsule_map.json carries `embeddings 2026-06-21` ·*
  > *`inference 2026-06-24` · `context 2026-06-28` (plus `tokenization 2026-06-15`, which this line*
  > *did not name). Never trust that list from prose — print it live:*
  > *`node -e "const m=require('./dressing-room/state/capsule_map.json');console.log(m.concepts.filter(c=>c.locked_on).map(c=>c.concept+' '+c.locked_on).join(' | '))"`.)*
PHIR BHI parked (Nikhil ka call) — build jab Nikhil bole, abhi nahi.
  > *(corrected 10 Aug 2026 — **usne bol diya.** His word landed 7 Aug 2026 and the build landed*
  > *8 Aug. This sentence is now history, not an instruction. The shipped file's own header says so*
  > *in his terms: "un-parked by his word, 7 Aug 2026; he writes ZERO here".)*
**Kya hai:** Execution-memory — Forge ka sibling (Forge = knowledge-memory). Match-record, diary nahi.
  > *(checked 10 Aug 2026 — **HELD, and shipped verbatim.** The rendered file's first line reads*
  > *"Execution-memory, Forge ka sibling" — this design sentence survived into the artefact word for*
  > *word: `grep -n "Execution-memory, Forge ka sibling" scripts/postmatch.mjs`.)*
**CATCH:** Claude 100% bharta · Nikhil ZERO likhta (sirf Full-Time pe ek paste).
  > *(corrected 10 Aug 2026 — the first half HELD and the parenthesis is now WRONG in his favour:*
  > ***there is no paste at all.** At /full-time he answers three things in chat (result · one signal ·*
  > *KAL-line) and the machine writes the row, the ledger and the whole logbook. The only paste left*
  > *anywhere in the loop is the CAPSULE gist paste, which is a different lane (see SAVE-FLAG above).)*
**Design (compact):**
- TABLE layer (standings, ~weekly): ladder X/17 · M1 % · Python tier · 5-bucket thin-watch · streak · 7-day form-line.
  > *(corrected 10 Aug 2026 — SHIPPED, but not field-for-field, and the standings regenerate at*
  > ***every full-time**, not ~weekly. What actually renders (`grep -n "renderSeasonMd" scripts/postmatch.mjs`,*
  > *then read the function): season day · matchdays played · current run in won-days · form line ·*
  > *capsules locked · python tier + fluency · benchmark buckets · KAL→KICKOFF weld.*
  > *· "ladder X/17" shipped as **`capsules locked: N`** — no /17 denominator, because no code owns*
  > *the 17 (see the APPLY-TRIGGER note above).*
  > *· "M1 %" is **DEFERRED, not faked** — postmatch.mjs names it in that exact phrase along with*
  > *floor/surplus/save-flag per row and won-day=5 scoring: `grep -n "DEFERRED, not faked" scripts/postmatch.mjs`.*
  > *· "5-bucket thin-watch" is **RIGHT** — benchmark.mjs carries AI_PE_ROADMAP's own five buckets*
  > *(`grep -n "ROADMAP_BUCKETS" scripts/benchmark.mjs`), with 6-cross-cut and 7-domain riding beside*
  > *as differentiators, not as a sixth bucket. But it is **GATED pre-audit** today, so the line*
  > *renders as `benchmark: GATED (pre-audit)` until the full-syllabus audit closes — read it live:*
  > *`node scripts/benchmark.mjs report`.)*
- MATCH ROWS (daily, newest-top): floor / result / surplus / locked-cracked / save-flag / KAL.
  > *(corrected 10 Aug 2026 — SHIPPED with FOUR columns, not six: `| date | MD | result | KAL |`.*
  > ***floor · surplus · locked-cracked · save-flag are DEFERRED** — they have no machine source and*
  > *the code refuses to invent one. "newest-top" HELD (`rows.slice(-30).reverse()`), with one detail*
  > *this design never mentioned: SEASON.md renders the **last 30** rows and `season.json` holds the*
  > *uncapped ledger. Read the renderer, never this bullet:*
  > *`grep -n "MATCH ROWS (newest first" scripts/postmatch.mjs`.)*
- Mechanics: streak · form-line (rest-dot **neutral**) · KAL→kickoff weld · won-day=5 · shame-spiral guard · no date-countdown · **honest-grade rule**.
  > *(checked 10 Aug 2026 — six of seven SHIPPED. streak (`grep -n "function seasonStreak" scripts/postmatch.mjs`)*
  > *· form-line with the **rest-dot genuinely neutral** — REST renders `◦` and a MISS renders a small*
  > *`·`, never an ✗ (`grep -n "FORM_GLYPH" scripts/postmatch.mjs`) · KAL weld line · shame-spiral*
  > *guard, selftested (`grep -n "NO SHAME LAW" scripts/postmatch.mjs`) · no-date-countdown, stated in*
  > *the file's own header line "Tarikh yahan sirf RECORD hai — kabhi demand nahi" · honest-grade rule.*
  > ***won-day=5 SCORING is the one DEFERRED item** — the five non-negotiables are not scored anywhere;*
  > *see the "DEFERRED, not faked" list.)*
- Home = sibling **gist** · format = **markdown v1** (HUD-render baad mein, jab logbook khud ko prove kare).
  > *(corrected 10 Aug 2026 — **the home is WRONG. It is not a gist.** The logbook is a tracked file in*
  > *this repo at `dressing-room/SEASON.md` (`git ls-files | grep -i season`). Nothing about it touches*
  > *the gist lane, which belongs to the capsules alone. "markdown v1" HELD — it renders as markdown*
  > *and the HUD-render is still unbuilt. Pointing a session at a gist for this file would send it*
  > *looking for something that has never existed.)*
**Full design** = is file ke discussion-thread mein (build ke waqt re-surface hoga).
  > *(corrected 10 Aug 2026 — that discussion-thread is not in this repo and cannot be re-surfaced,*
  > *and it no longer matters: **the built artefact is now the design of record.** Read the renderer*
  > *(`renderSeasonMd` in `scripts/postmatch.mjs`) and the file it writes. Where the build and this*
  > *design differ, the BUILD is the truth and the bullets above say which is which.)*

---

ॐ RADHA RANI KI KRIPA SE 🙏🏽
