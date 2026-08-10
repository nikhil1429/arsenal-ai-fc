# THE ORGANISM — LIVE X-RAY

> **Snapshot: 10 August 2026.** Built by reading every line of all 74 scripts (~54,500 lines),
> every .md in the repo, every hook, every installer, every skill, and the live state bus —
> plus a live check of the running daemons, the scheduler, and git.
>
> **THIS FILE WILL ROT. That is the repo's own most-repeated law.** Nothing here is canon.
> Every count, every threshold, every "currently" below was true on 10 Aug 2026 and is
> re-checkable with the commands in Appendix A. When this file and the code disagree,
> **the code wins and this file is wrong.**
>
> Repo: 282 commits, 8 Jul → 10 Aug 2026 (33 days), 246 tracked files, branch `main`, PUBLIC.

---

## CONTENTS

- **PART 0** — What this thing actually is, in one page
- **PART 1** — YOUR DAY (the routine, hour by hour, surface by surface)
- **PART 2** — YOUR SURFACES (every place you touch it)
- **PART 3** — THE ORGANS (all 74 scripts, what each one does)
- **PART 4** — THE CLOCK (every scheduled thing, in time order)
- **PART 5** — THE LAWS (the constitution, and where each law came from)
- **PART 6** — THE NUMBERS (every gate and threshold + its origin)
- **PART 7** — WHAT IS LIVE vs WHAT IS DARK (10 Aug 2026)
- **PART 8** — THE HONEST READ (where the bottleneck actually is)
- **APPENDIX A** — Verify-live commands

---

# PART 0 — WHAT THIS THING ACTUALLY IS

A **football club made of Node scripts** that carries the executive-function load your ADHD-PI
brain under-supplies — starting, holding, feeling time, switching — so that the only thing left
for you is **the rep**.

Physically it is:

- **74 deterministic `.mjs` scripts** on Windows/Node 22, no framework, no database.
- **A JSON state bus** at `dressing-room/state/` — ~110 files, **one writer per file, always**.
- **~50 Windows scheduled tasks** + **5 resident daemons** on ports 4111–4116.
- **LLM calls only through `claude -p`** on your Max subscription. The code **refuses to start**
  if `ANTHROPIC_API_KEY` is set — that is the hard $0-marginal-cost ceiling, enforced in 7+ files.
- **Free Gemini keys** (10 in `~/.gemini/.env`) for exactly three things Claude physically cannot do:
  the live voice, embeddings, and the 1M-token whole-season re-read.
- **Two phone pushes a day**, constitutionally. That is the entire notification surface.

Logically it is **four layers**:

| Layer | What it is | Core organs |
|---|---|---|
| **SENSES** | Everything that happens to you gets onto one bus | thalamus · presence · context · turnstile · throwin · harvest · afferent hooks |
| **MEMORY** | Nothing you say once has to be said twice | hippocampus (5 layers) · distiller · mcp-memory · learnstate |
| **BRAIN** | Deterministic scheduler that spends a token budget on thinking about you | brain.mjs (30 jobs) · cortex (Opus) · nightshift · dmn · agenda/diary/dreams |
| **HANDS + GOVERNANCE** | Nothing acts without your word | manager (the sheet) · captains_call (one card) · setpiece (drills) · bootroom (genome) · scout (missions) |

And it has **one non-negotiable shape**: **AI proposes · code validates · you approve.**
The LLM is never allowed to do arithmetic, never allowed to invent a number, and never allowed
to change the system. Code computes, code validates, and you say one word.

---

# PART 1 — YOUR DAY

This is the actual routine now that it is unleashed. **Bold = you.** Everything else is the machine.

## 1.1 — Overnight (you are asleep, laptop sleeping-not-shutdown)

| Time | What happens |
|---|---|
| 22:00–07:30 | The brain's **overnight window**: budget cap rises to 95% of the 1.6M/5h window. It drains ~20 LLM jobs in priority order. |
| 22:45 | **THE AGENDA** (Opus) — the night's first thought. Reads the day's salience summary, yesterday's outcomes and teaching drifts, and decides which jobs run *lean* or *skip* tonight. "Spend follows surprise." |
| 02:10 | **Consolidate** — the nightly `who_he_is.json` is rewritten from your last 2 days of concept-bearing turns. Any validation failure ⇒ yesterday's portrait stands. |
| 02:20 | **HippoStore** — old memories shard by month; weak ones move to cold storage. **Never deleted.** |
| 02:40 | **THE NIGHT SHIFT** — 8 jobs: builds tomorrow's probe bank; grades each probe's difficulty by answering it 4× and measuring disagreement; builds distractors from *your own documented confusions*; refreshes the Gemini Examiner cartridge; runs the **wind tunnel** (replays every gate decision to see if the attention threshold should move — report-only); **pre-answers ~25 doubts you are predicted to have tomorrow**; and re-reads your entire ~400k-char history in one Gemini pass looking for contradictions. |
| 03:00 | **Concept graph** (Opus, via cortex) + **THE DIARY** — the brain writes one page in first person: attended · believed · tested · was wrong · **will change**. |
| overnight | **night_coach** (Opus) — reads your whole study day, writes tomorrow's misconception map *and pre-writes tomorrow's lesson*, then **rehearses it against a simulation of you** built from your own doubt-grammar and lexicon, and revises once. |
| overnight | **dreams** (DMN recombination), **model_mine** (proposes cause→effect edges about you), team-talk mp3s, the poster, the Gemini wall render, drill enrichment, lexicon mining. |
| 03:45 | **Groundsman** pushes the night's state to the public repo behind a two-lock allowlist. |
| 03:52 | **WakeProbe** — a standing experiment proving whether this laptop can be woken by a timer at all. |

## 1.2 — Morning

| Time | What happens |
|---|---|
| ~08:45 | **`formation_read`** (Opus, priority 100) runs the Manager. Every number is pre-computed by code; the LLM only judges; a single un-traceable digit gets the whole sheet thrown out and the deterministic skeleton printed instead. **The sheet always appears.** |
| ~08:45 | **PHONE PUSH #1** — "⚪🔴 Team sheet is up", first 10 lines of the sheet, plus the team-talk line if the mp3 exists. |
| by 10:15 | If the sheet never ran (laptop asleep) → **absence push**: "No sheet this morning, captain — the machine was not awake for it." Never a fake sheet. |
| 09:15 | **THE MORNING CONDUCTOR** — one task, 16 organs in strict order: mirror (pull capsules from your gist) → sprintsync (your Google Sheet → sprint.json) → daemon health checks → physio → **Goalkeeper (the Oura pull)** → twin (seals today's 3 bets) → heartbeat → FSRS → calibration → nemesis → learning-state → the signals gate → the sheet → the wall. Order **is** the product; a failed step exits non-zero so Task Scheduler finally means something. |
| 10:30 IST | **Cloud sentinel** (a claude.ai routine, not a repo script) — if the whole morning was silent it pushes ONE line: "Laptop soya…" + a mini-brief from last-pushed state. |

**YOUR MOVE — pick one:**

- **Phone buzzes → read it.** That's the whole obligation.
- **Open Claude Code → type `matchday`** → you get ≤10 lines: *your own KAL-line first*, THE ONE THING, ≤3 drills, brain phase, and **exactly one card** to answer `haan / na / baad`.
- **Or double-click launcher 1 (MATCHDAY — THE DUGOUT)**, press START, say **"good morning"** — the Gaffer opens from your KAL-line already wearing last night's cartridge, the night coach's read, your locked capsule book, your live sprint position, and your measured think-time.

## 1.3 — Study (the ground)

The register flips to **GROUND at 10:30**: bias-to-silence. Nothing pings you. The Gaffer speaks
only when you declare a stoppage ("done", "next kya").

**Three tracks, and the machine picks — you don't have to:**

**A. Concept track (FORGE)** — `/forge <concept>`, or `/learn` and it routes you here.
```
node scripts/forge_session.mjs start <concept>     ← MUST be first; without it THE METHOD never reaches the turn
```
Then Claude walks THE METHOD's 12 steps, declaring position every message:
`0 TIME-BOX → 1 DARAAR-MAP (all 9 axes shown up front = visible finish line) → 2 PEHLE-GUESS
→ 3 SAMJHAO → 4 DIKHAO + the widget → 5 SAATH-KARO → 6 AKELE-KARO → 7 BOLO (spoken first)
→ 8 CALIBRATE → 9 JIRAH → 10 LOCK → 11 RE-JIRAH`.
Exactly **four question-moments are legal** (Pehle-Guess · widget gates · ONE check-question per
pass in steps 3–6 · Jirah). A second check-question in one pass is **hard-refused by the code** and
counted. Every rep is banked the moment it happens — **you never copy anything**:
```
node scripts/capture.mjs rep --concept <c> --axis <a> --q "…" --gut knew|shaky|guessed --correct true|false
```
**Your only real obligation inside a session is the gut-word before the answer.** No gut-word, no rep —
because `knew` + wrong is the single most valuable data point in the entire system, and it only
exists if the confidence was locked before the outcome.

At step 10 (LOCK) the chain fires by itself: stages a Gemini "what's actually being asked about this
concept" mission, runs the benchmark, re-pulls the capsule mirror, checks whether the widget was
*driven* (not just built), and tells you the one gist paste that is yours.

Close with `node scripts/forge_session.mjs close` — it reads out loud how long you actually sat,
which steps never ran, which axes are claims rather than grades, and how many reps got banked
(shouting if the answer is zero).

**B. Python track** — `/learn` on a `skill` day.
`python_state.mjs subtopic <name> --tier T0` → drills in Colab (struggle-first, hints only) →
`close --why "<one line>"`. Fluency is **declared with a reason, never computed** — there is not one
threshold in that file, by your own 1 Aug rule. Forge grammar on Python is **hard-refused**.
JS-hangovers get named (`watch <name>`) and are injected into every future close-packet.

**C. Course track** — `course.mjs at <n>` / `done <n>`. It never invents a chapter.

**Whatever you do, it's being captured:** every prompt you type and every answer you get is POSTed
to the thalamus within ~250ms; every window change is a metadata delta; tab-thrash is sampled every
minute; your focus/break minutes are ledgered with AFK subtracted. Copy a reps-JSON block anywhere
on the machine and the **turnstile** catches it off the clipboard and says *"reps andar."*

## 1.4 — The back edge (Re-Jirah) — the thing that is currently most overdue

```
node scripts/deep.mjs due                    ← the cold queue: QUESTIONS ONLY, answers withheld by law
node scripts/rejirah.mjs grade <c> <axis> held|cracked --gut <word>
node scripts/rejirah.mjs close <c>           ← prints the one-line gist patch
/gist-patch                                  ← Claude drives your Chrome, pre-fills it, YOU click Save
node scripts/mirror.mjs                      ← pulls it back; only now does the round exist
```
Until that paste lands, **five organs believe the round never happened** (fsrs, deep, capsule_bridge,
dugout, shipped) — which is why the kickoff brief shouts PENDING.

## 1.5 — The outward loop (Gemini)

```
/fire            → Claude opens Gemini Deep Research, pastes the mission, and stops. YOU click Start.
"le lo"          → Claude reads the finished report out of Chrome and ingests it verbatim.
/harvest         → after any Gem study sitting: Claude reads the WHOLE conversation into the bus.
/gem-sync        → weekly: refreshes THE EXAMINER Gem with last night's cartridge.
```
Returns become diff cards. **Canon changes only on your word.** `mission audit-close --note "<your word>"`
is the event — never a date — that unlocks the benchmark.

## 1.6 — Evening

| Time | What happens |
|---|---|
| 20:40 | Evening team-talk mp3 written (60–90s). |
| 21:50 | `evening_voice` (Opus) compiles the day for tomorrow's cartridge. |
| **22:00** | **PHONE PUSH #2 — the full-time bell.** "30 seconds, then sleep." Late ⇒ **silent, out loud** (a 75-min grace, then it refuses rather than bell you at 15:23). |
| 22:00 | **THE EVENING CONDUCTOR** — bell → scorer 22:35 → scoreboard 22:38 → nikhil-model ingest 22:39 → **setpiece 22:40 (tomorrow's ≤3 drills)** → doubtminer 22:45 → physio-pm 22:50 → examiner 22:55 (tomorrow's code round) → wall 23:00 → scout 23:05 → wallpaper 23:10. |
| 23:55 | **THE WATCHMAN** — the night audit (below). |

**YOUR MOVE — 30 seconds:** type `/full-time` (or launcher 3, or say "full time" to the Gaffer):
1. Result — **HIT / MISS / PARTIAL / REST**
2. One signal
3. **The KAL-line** — one sentence for tomorrow

That's it. It writes `post_match/<date>.md`, appends the season row, updates the notebook,
regenerates `SEASON.md`, routes any throw-ins, and — this is the weld — **tomorrow's team sheet
and tomorrow's wall both open with that KAL-line, verbatim.** The morning resumes you mid-thought.

**A conscious REST counts as a won day.** MISS never shames — the word "failed" is absent from
the writer by assertion, and a missed commitment renders as **"↻ went again."**

## 1.7 — Night audit (23:55) — the thing that watches the watchers

Tier 1 is pure deterministic code, no LLM: did an organ that *had work* produce output? Do
self-reports match the state they report on? Did the schedulers themselves run? Are the daemons
answering? Did the evening chain report? **Did yesterday's lesson actually land?** Did *anything*
reach your phone today? Is canon clean in git? Plus the full test suite, the behavioural day-audit,
and the produce-vs-consume reconciliation.

If it finds anything real, **once per night, inside the overnight window**, it spawns a detached
**Opus repair child** with scoped tool grants (Edit/Write/Read/Grep/Bash(node)/local git — **no push,
no schtasks, no rm, no network**), under your 7.1 ruling: repair without asking, every change
reversible with the revert path recorded, everything journaled with its evidence. Hard walls: never
your capsules, never the learning layer, never the 4 canonical .md files, never secrets or biometrics.

## 1.8 — Weekly

- **Sunday 20:00** — the **Boot Room** files at most ONE genome proposal (a change to the method
  itself), evidence-gated, with a pre-registered metric and an auto-revert plan. `/genome` reads it
  to you; only **"haan, chalao"** applies it. Medical rules, the readiness ladder, the Goalkeeper and
  the honest frame are **constitutionally outside** the genome — hard-rejected by name.
- **Sunday** — the model audit card (which edges about you are tested/warming/retired).
- **Weekly** — `/gem-sync`; the **≥2×/week outward floor** (your own ruled number) surfaces only when unmet.
- **Sunday off.** Strict, canon-locked. The organism idles with you.

---

# PART 2 — YOUR SURFACES

Six places the organism touches you. **You never open a terminal by design.**

## 2.1 — Claude Code (the main study room)

The moment a session starts, **13 hooks fire without you asking**:

**SessionStart (5, in order):**
1. `teaching_contract.mjs reset-turns` — the turn clock's session boundary
2. `learnstate.mjs brief` → assembled by `context_manifest.mjs` under a hard **12,000-char ceiling**,
   worst-priority-first, with a footer naming every part's bytes and anything MISSING/TRIMMED
3. `forge_session.mjs boot` — ≤2 lines: is a session open, is it stale, what was last recorded
4. `watchman.mjs brief` — one line, only if last night found something (or if the watchman itself died)
5. `captains_call.mjs deal` — **max ONE card**

**UserPromptSubmit (5, on every single prompt you type):**
1. `hooks/afferent-post.mjs` — your words onto the bus (~250ms hard abort, secrets scrubbed, **no length cap** by your 6 Aug ruling)
2. `forge_session.mjs contract` — THE METHOD's 12-step strip, META-FREEZE, the axes ledger, the four-moment counter
3. `teaching_contract.mjs print` — ≤5 **drift-ranked** rules (the one you've been failed on most, first) + the context-fill gauge
4. `teaching_audit.mjs hook` — records your prompt so the Stop-side checks can see it
5. `hippocampus.mjs recall-hint` — a **network-free** lexical recall reflex (~3.6% of turns earn a line quoting your own past words, with its date)

**Stop (2, on every answer):** the answer captured as `claude-code-teaching`; then the turn is
**audited against 11 canon-scoped checks** and every measured drift **auto-counts** into the ranking —
which changes what gets re-injected on your very next prompt. Nobody asks you. Reversible with
`unhit-auto`. **PreCompact (1):** the whole brief is reprinted so orientation survives compaction.

**The 15 skills — word → ritual:**

| You say | Skill | What it does |
|---|---|---|
| matchday · kickoff · morning | `/matchday` | heartbeat + brain status → KAL-line first, ONE thing, ≤3 drills, one card |
| forge \<concept\> | `/forge` | the 12-step METHOD with zero capture tax |
| learn · aaj ka session · continue · where was I | `/learn` | reads state, routes by track, hands concept days to /forge |
| full time · post match · done for today | `/full-time` | 3 questions → postmatch → scorer → setpiece → wall → card |
| scrimmage · mock me | `/scrimmage` | 5 interview-weighted probes, /25, hedge-density logged silently |
| rematch · tape room | `/rematch` | past-you as the opponent; a clean win retires the doubt |
| paste session · log reps | `/paste-session` | capture + heartbeat, delta only |
| fire · fire M01 · le lo · packet bhejo | `/fire` | Chrome → Gemini Deep Research; **your** Start click |
| harvest · gemini le lo | `/harvest` | reads a whole Gem sitting onto the bus |
| patch paste · gist patch | `/gist-patch` | pre-fills the reJirahDone line; **your** Save click |
| gem sync | `/gem-sync` | refreshes THE EXAMINER Gem |
| paint · poster · dikhao | `/paint` | hands you the ready-made render prompt / film kit |
| genome · mutation · boot room | `/genome` | one proposal, your word approves |
| doctor · health check · kya haal hai | `/organism-doctor` | brain-alive first, then an 8-system chart |
| talk to me · baat karte hain | `/talk` | ≤3 spoken sentences per turn + neural voice |

## 2.2 — The Dugout (the voice) — `localhost:4114`

A local HTTP bridge serving one self-contained page that opens a **Gemini Live** socket
(`gemini-3.1-flash-live-preview`, voice **Charon** — chosen by live probe: 316 vs 192 words on the
same prompt, 0.58s vs 7.9s to first audio, and the only Live model with vision).

- **Depth defaults to `lecture`** — your verbatim ruling *"make gaffer as talkative and elaborative
  as possible."* `set_depth` is your lever to dial **down**.
- **28 live tools** it can call mid-sentence, each routed to the owning script:
  `get_today · get_tape_room · retire_doubt · log_reps · take_note · get_calibration · get_capsule ·
  get_rejirah · set_reminder · ratify_interruption · semantic_recall · checkpoint · run_postmatch ·
  approve_genome · route_throwins · scrimmage_report · set_depth · mark_moment · get_context ·
  recall_memory · get_diary · get_model · remember · forget · run_python · read_url · get_club_report ·
  get_organism`.
- **Guards:** `log_reps` refuses any rep without a legal gut-word. `run_postmatch` refuses an empty
  KAL-line ("no weld, no write") and any result outside HIT/MISS/PARTIAL/REST. `run_python` runs a
  code firewall before touching the network. Every write goes through its owner script.
- **VAD tuned to you:** silence hangover **1400ms** — measured from your own >1.4s think-pauses,
  because the default 900ms was cutting your deep answers in half.
- **Whiteboard** (rear camera at your paper) and **Screen** buttons; a silent second socket — **the
  Watcher** — sees every second frame and speaks at most one ≤15-word line when you're SPINNING,
  STUCK or forming a wrong answer. Its audio is never played.
- **Day registers:** KICKOFF (<10:30, opens from your KAL-line and dispatches you to the exact next
  station) · GROUND (<20:30, bias-to-silence) · FULL-TIME (walks the 30-second ritual).
- **Phone:** `--lan` (launcher 5) binds the LAN with a one-run key.
- Boot side-effect: if the thalamus doesn't answer in 1200ms, **the Dugout boots the brain** (spawns
  thalamus, cortex, turnstile detached).

## 2.3 — Your phone

**Exactly two utterances a day**, by constitution: the 08:45 sheet and the 22:00 bell. Plus:
the absence line if the morning was dead; the cloud sentinel's single "Laptop soya…" at 10:30 IST;
and **throw-ins in the other direction** — dictate any stray thought to the ntfy topic from anywhere
and it lands **verbatim** in `loose_balls.jsonl` within 15 minutes, waits for the evening, and is
**never counted against you**. Paste a reps-JSON block to the same topic and it becomes blood instead.

## 2.4 — The Wall — `dressing-room/club/wall.html`

One self-contained dark HTML file, zero network, opens from disk, **refreshes itself every 5 minutes**
and is re-rendered every 30. Panels: the NOW strip (reps today, learning minutes, building minutes,
struggle read — odometers that only count **up**, never quota bars) · the Maidan pitch with your weak
handoff drawn as a frayed pass · season (matches, doubts retired, weekly consistency — **never a
streak**) · calibration curve · the derby table of confusion pairs · drills · commitments (8 days of
KAL-lines paired with the next day's result) · the body strip (**verdict word and colour only — never
a raw biometric**) · the brain · the twin's book · ≤3 insight lines. **On a RED day the wall collapses
to your KAL-line and one sentence:** *"Rotation day. One five-minute floor-touch is the whole match."*

## 2.5 — The desktop (9 launchers, no 8)

`0` Handbook · **`1` MATCHDAY — THE DUGOUT** · **`2` THE WALL** · **`3` FULL TIME (30 seconds)** ·
`4` SCRIMMAGE · `5` DUGOUT ON PHONE · `6` TALK (bench voice) · `7` SEASON FILM (3 taps) ·
`9` THE WHOLE REPO (one file) · plus LIGHTEN THE MACHINE.

Daily you touch **two**: 1 and 2. The desktop **wallpaper itself** is regenerated nightly with your
KAL-line, the verdict dot, matches, doubts retired and weekly consistency.

## 2.6 — Gemini (the internet arm + the volume engine)

Your Pro account is the **internet arm** — the machine writes the missions, **you fire them**.
The Coach Gem drills you on Python; **THE EXAMINER** Gem is refreshed weekly from the night shift's
own cartridge; NotebookLM is listening-only (never a rep surface); Colab logs reps per-rep to a Drive
inbox swept hourly.

---

# PART 3 — THE ORGANS

All 74 scripts. Format: **name** — what it is · when it runs · what it owns.

## 3.1 — THE BRAIN

**`brain.mjs`** (3,537 lines) — the LLM job runtime. A resident daemon beats **every 15 seconds**
(singleton on :4116), re-reads its config every beat, computes headroom, and runs one tick.
- **Budget:** 5h window ≈ **1,600,000 tokens**, week ≈ **24,000,000** — your share of the 20x plan
  under your own split ruling (Nidhi 800k/12M + your study 800k/12M + the organism 1.6M/24M, zero remainder).
- **Phases:** study 09:00–21:00 caps at **40%** ("the organism is forbidden from spending your study
  capacity on itself" — and it *rises automatically* when you go idle ≥20 min) · overnight 22:00–07:30
  floods to **95%** · a 05:30–07:30 **taper** back down so any lockout clears before you sit.
- **The boot-tax fix:** `claude -p` boots the whole interactive CLI (~44k cache tokens per call).
  With `--system-prompt … --tools "" --strict-mcp-config` that measured **49,411 → 5,663 tokens (−88.5%)**.
  Generated output went from 3.6% to 24.9% of a call — "the machine is finally mostly thinking."
- **The cognitive fingerprint** sits at the head of every analysis prompt: your own anchor metaphors
  mined verbatim from your speech, your wrong-prior shapes, your live overconfidence rate, where you
  are mid-concept right now, and the fixed traits (ADHD-PI, ~4 working-memory slots, Hinglish welds,
  walls of text = shutdown).
- **The mouth:** two ntfy utterances a day, badge-signed `⚪🔴` so the throw-in poller can't swallow them.
- **The haiku pulse:** an always-on cheap watch over the afferent tail, **only while you're engaged**
  (idle >10 min = skip; "never pulse the void"), ≥150s apart. Currently a **pure instrument at weight 0.00**.

**`cortex.mjs`** — the Opus lane on :4112. Drains the wake queue, runs up to **2 concurrent**
extended-thinking reads (16k thinking live / 48k overnight), and POSTs the answer back **through** the
thalamus so single-writer holds. Hard guards: refuses if an API key is set; never re-buys a thought;
TTL 30 min; the answer must pass the banned-phrase check or it is **DECLINED, never softened**.

**`nightshift.mjs`** — the 02:40 idle-quota drain, 8 jobs, hard budget of 62 LLM calls for the whole shift.
**`dmn.mjs`** — fires only when you're **away** (AFK-verified): up to 100 Monte-Carlo interview rollouts
across idle free lanes, each cluster then facing one hostile counter-rollout — **broken ⇒ dropped**
("better no ammunition than wrong ammunition"). Output is **inert** by design.
**`scoreboard.mjs`** — H1 ground truth: joins what the machine predicted/taught against what your reps
actually say. Append-only with supersede-by-append.
**`nikhil_model.mjs`** — H3: causal day-edges about you from a **closed 7-fact vocabulary**, three-valued
(null = UNOBSERVED, never false), every number re-derived by code, medication language hard-blocked,
retired only by your `galat`.
**`gate_tune.mjs`** — the only path by which a wind-tunnel proposal can reach the attention gate, on your haan,
with a drift guard, a measured watch window and **auto-revert**.
**`claudegen.mjs`** — the shared `claude -p` wrapper for every non-brain organ, same lean flags, same honest meter.

## 3.2 — THE SENSES

**`thalamus.mjs`** (1,999 lines) — the afferent bus + salience gate on :4113. Everything lands here.
- **The formula (live):**
  `S = clamp01( 0.35·PE + 0.20·NOV + 0.25·GOV + 0.45·ERR + 0.45·SELF + 0.15·DEAD + 0.00·PULSE − 0.40·HAB )`
  - **SELF 0.45** — you naming your own confusion, matched against 29 markers in Latin Hinglish *and* Devanagari
  - **ERR 0.45** — wrong-while-`knew` = 1.0, wrong-while-`shaky` = 0.4, wrong-while-`guessed` = 0.15
  - **PE 0.35** — Bayesian surprise against the twin's markets
  - **GOV 0.25** — a body-verdict flip weights attention and **can never wake the deep brain alone**
  - **NOV 0.20**, **DEAD 0.15** (deadlines nudge, never dominate — there is no urgency machine here)
  - **HAB −0.40** — exponential, 10-minute time constant, saturating after 4 repetitions. *This is why it never nags.*
- **Tiers:** <0.25 logged only · 0.25–0.40 free reflex/enrichment · **≥0.40 wakes Opus**.
  The bar rises as the budget drains: `τ1_eff = 0.40 + 0.35 × (1 − headroom)` → 0.75 at zero headroom.
  "The machine gets more selective as it gets tired — nobody designed that as a metaphor."
- **Guards:** 15-minute refractory per signal; wake cap `min(15, allowed_tokens/40000)`;
  a near-miss inside ±0.10 gets **one** cheap adjudication and fails **closed**.
- **THE AFFECT FIREWALL:** `modality:"affect"` never enters. Prosody, emotion, tone, stress, agitation,
  mood and sentiment are recursively **deleted at the door**. At most it becomes a timing hint to the
  mouth. **Your inner life is not an input.** This is not policy — it is a signal the machine cannot receive.
- **Provenance, not modality:** your surfaces (voice, claude-code, organism-memory, gemini-study) are
  "self"; the coach's own words (`*-teaching`) are deny-listed, so it can never quote itself back as you.
- **Binding:** events within 900ms fuse into one *moment* with a single spotlight winner. ~343 moments/day.
- A suppressed moment is **never lost** — it queues for the DMN's free second spotlight.

**`presence.mjs`** (every minute) — tab-thrash telemetry + a focus/break ledger with AFK subtracted.
Only the **onset** of a stall posts. On a conserve/RED day it senses but stays off the wire.
**`context.mjs`** — one afferent per window change, metadata only, canon-filtered (~145/day).
**`distiller.mjs`** (every 15 min) — the **4-slot externalized working memory**:
`concept_in_motion · open_loop · where_left_off · next_step`. `next_step` is **drills-only, verbatim** —
never LLM-invented. Runs on the free Gemini pool, costs the Claude budget nothing.
**`turnstile.mjs`** (:4111) — the clipboard gate: copy = captured. Only a legal reps array is even parsed;
everything else is ignored, never logged, never stored.
**`throwin.mjs`** (every 15 min) — the phone lane. Three iron guards: verbatim · **never counts usage** ·
the topic is a secret.
**`harvest.mjs`** — a whole Gemini sitting onto the bus, turn by turn, with two dedup layers.
**`shadow.mjs`** — **earned proactivity**: every would-have-spoken moment is logged silently and resolved
later; a type earns a voice only at ≥10 scorable shadows **and** ≥0.70 hit-rate **and** your spoken
ratification — and loses it again if the rate decays.
**`hooks/afferent-post.mjs`** — the zero-tax capture nerve, 250ms hard abort, always exit 0, never writes stdout.

## 3.3 — THE MEMORY

**`hippocampus.mjs`** (1,457 lines) — five layers:
- **L1 The Scribe** — verbatim moments. A **narrator guard** rejects any text written in third person:
  the machine may never paraphrase you and store it as your words.
- **L2 The Ledger of Self** — identity facts, capped at **40** ("small enough to ALWAYS be present"),
  each rendered **with its age** so a 24-day-old fact can never read like this morning's word.
- **L3 The Consolidator** — nightly `who_he_is.json` from your own concept-bearing turns. A strict
  validator (six keys, banned phrases, an **affect-leak check**) — **any failure and yesterday's portrait stands**.
- **L4 The Recall Reflex** — cosine over your own past moments; plus a network-free lexical twin for the hook.
- **L0 The Rehydrator** — the cartridge every session boots from.
- **Forgetting is a feature**: FSRS-flavoured decay moves old memories to cold storage. **Move, never delete.**

**`mcp-memory.mjs`** — the `organism-memory` MCP server: `get_context` · `recall` · `note` ·
`remember_fact`. **`remember_fact` only STAGES** — it is canon only after a card asks you and you say haan.
**`learnstate.mjs` + `context_manifest.mjs`** — the SessionStart brief and its 12,000-char budget,
with a footer that names every byte and everything trimmed (built because 1,957 characters of your
memory were being dropped silently at every single session start).

## 3.4 — THE LEARNING LOOP

`forge_session.mjs` (the 12-step pacer + the two clocks that cannot be forged) · `capture.mjs`
(the single funnel every graded moment passes; three clocks so an authored timestamp can't fake a rep) ·
`rejirah.mjs` (the back edge — WHICH axes and HOW HARD) · `fsrs.mjs` (real FSRS-6 via ts-fsrs, WHEN a
concept returns; day-collapsed, worst-grade-wins) · `deep.mjs` (the cold re-read surface — questions
only) · `mirror.mjs` (pulls your gist, + a dated backup every day) · `capsule_bridge.mjs` (where the two
schedulers agree and disagree) · `widget.mjs` (built ≠ **driven**) · `python_state.mjs` · `course.mjs` ·
`learning_state.mjs` (the Maidan) · `calibration.mjs` (ECE against knew .95 / shaky .65 / guessed .30) ·
`nemesis.mjs` (your nemesis is *a kind of thinking*, not a topic) · `examiner.mjs` (tomorrow's code round) ·
`doubtminer.mjs` (the decoy map, your own lexicon, the tape room, and FORGE_SPEC Gate 2).

## 3.5 — THE HANDS

`manager.mjs` + `dressing-room/manager/system.md` (587 lines — the Gaffer's constitution: two brains,
8 precedence rungs, the formation-read, the season arc, the honesty-overrides) · `setpiece.mjs`
(tomorrow's ≤3 drills; **first ball winnable by law**; RED ⇒ exactly one 5-minute floor-touch and the
withheld harder work is **disclosed at post-match, never hidden**) · `scorer.mjs` (the Slip: three books,
one arithmetic) · `twin.mjs` (the book on you — **win-only voice**, and any market whose name matches
`/abandon|fail|dread|quit|stall/` is **structurally stripped**) · `postmatch.mjs` · `viz.mjs` (the wall) ·
`captains_call.mjs` (the one-card surface, ~20 lanes) · `scout.mjs` (missions + no-projected-dates) ·
`benchmark.mjs` (counts and names only — **never a composite score**) · `bootroom.mjs` (the genome) ·
`throwin/speak/tone/talk/heartbeat/touchline`.

## 3.6 — THE IMMUNE SYSTEM

`watchman.mjs` (Tier 1 + the Opus repair child) · `teaching_contract.mjs` + `teaching_audit.mjs`
(the live-session enforcement pair) · `outwork_audit.mjs` (did the *day* do its job) ·
`organism_test.mjs` (**`npm test` is the authority** — 73 members run independently, plus hermeticity,
integrity, law-proofs and a full end-to-end drive of the learning loop in a throwaway copy) ·
`reconcile.mjs` (the one instrument that detects **absence**, not failure) · `limits.mjs` (every number
in the organism next to its live data, with its **origin**) · `validators.mjs` (the one zero-hallucination
validator) · `physio.mjs` (proprioception; **the Goalkeeper is exempt from its own signal table** — a
safety brake that can be relegated by a score is a brake that will one day be off) · `daemon_watchdog.mjs` ·
`groundsman.mjs` · `awayday.mjs` + the Windows CI · `selfknowledge.mjs` (**frozen by your ruling** — and
it refuses *before* spending a token, un-freezing itself automatically the day something reads it).

## 3.7 — THE BODY

**`oura_coach.mjs`** — the Goalkeeper, v2-recalibrated, zero LLM. Three **HIGH-confidence** axes only can
move a verdict: sleep-architecture trend, sleep vs **your own** baseline (floor 6.5h — your range, never
a textbook 8h), and resilience trend. RHR, HRV and temperature live in a **LOW-confidence tier that is
architecturally incapable of setting a verdict** — with a hard guard that forces the verdict back to
GREEN if only they fired. **GREEN is the default** ("the grind honored"). **RED requires convergence**,
never hours. Sustained concerning physiology → **DOCTOR-REFERRAL, full stop**, message-only, and the
selftest scans the entire output for dose/advice language. It never comments on medication; a late dose
only ever *explains* a bad-REM night, never counts against you.

`timeaudit.mjs` (Learning/Building/Meta from ActivityWatch, browser-focus-clipped, targets Building ≥60% /
Meta ≤25%) · `physio.mjs` · `fuelboard.mjs` (8 free-Gemini tanks with a starvation guard and a cross-process
lock) · `conductor.mjs` (the two chains).

---

# PART 4 — THE CLOCK

## 4.1 — Resident (always on)

| Port | Daemon | Beat |
|---|---|---|
| 4111 | turnstile (clipboard) | 4s poll |
| 4112 | cortex (Opus lane) | fs.watch + 5s poll |
| 4113 | thalamus (the gate) | event-driven + 60s bus poll |
| 4114 | **dugout** | only when **you** open it — deliberately excluded from the watchdog |
| 4115 | brain tick lock | transient |
| 4116 | brain daemon | **15s** |
| 5600 | ActivityWatch | — |

## 4.2 — The 24 hours

| Time | What |
|---|---|
| **every 1 min** | presence · dugout reminders |
| **every 5 min** | tone (the arousal scalar, from the body verdict only) |
| **every 10 min** | shadow-detect · daemon watchdog |
| **every 15 min** | throw-in poller · distiller |
| **every 30 min** | touchline · brain tick · wall-live |
| **hourly** | capture-pull (Colab inbox) · DMN · hippocampus index |
| 02:10 | consolidate (who_he_is) |
| 02:20 | hippocampus store (shard + cold) |
| **02:40** | **THE NIGHT SHIFT** (8 jobs) |
| 03:00 | concept graph · **the diary** |
| 03:30 Sun | presence threshold refit |
| **03:45** | groundsman push to the public repo |
| 03:52 | wake probe |
| 07:00–07:06 | thalamus · cortex · turnstile · brain daemon boot |
| **08:45** | **the team sheet + PHONE PUSH #1** |
| **09:15** | **THE MORNING CONDUCTOR** (16 organs, ordered) |
| 10:30 IST | cloud sentinel (only if the morning was silent) |
| 12:00 / 15:00 / 18:00 | time-auditor pulses |
| 12:30 / 14:30 / 16:30 | midday digests (the day becomes memory before midnight) |
| 13:30 | midday re-read |
| 14:20 | midday cartridge (the afternoon Gaffer reboots knowing your morning) |
| 20:00 Sun | **THE BOOT ROOM** (one genome proposal) |
| 20:40 | evening team-talk mp3 |
| 21:50 | evening voice · physio-PM |
| **22:00** | **THE BELL + PHONE PUSH #2** + the evening conductor |
| 22:35→23:10 | scorer → scoreboard → model ingest → **setpiece** → doubtminer → physio → examiner → wall → scout → wallpaper |
| 22:45 | **the agenda** (the night's allocation) |
| 22:00–07:30 | the overnight drain (~20 LLM jobs by priority) |
| **23:55** | **THE WATCHMAN** (+ Opus repair child if needed) |

## 4.3 — The brain's job table (30 jobs, priority order)

`formation_read` 100 (the sheet, Opus) · `agenda` 95 · `evening_voice` 90 · `deep_reanalysis` 85 ·
`season_review` 80 **(off)** · `night_coach` 72 · `drill_forge` 70 · `dugout_digest` 65 ·
`midday_digest ×3` 62 · `midday_cartridge` 61 · `midday_reread` 60 · `day_cartridge` 58 ·
`doubt_clusters` 55 · `teamtalk_am` 52 · `deep_twin` 50 · `teamtalk_pm` 45 · `lexicon_mine` 45 ·
`wall_insights` 40 · `gemini_render` 35 · `scrimmage_staging` 30 · `market_scan` 28 (Sun) ·
`maidan_poster` 25 · `wall_review` 24 · `widget_spec` 22 · `capsule_premap` 20 · `model_mine` 20 ·
`dreams` 15 · `diary` 10.

**Every job must declare a `surface`** — where its output actually appears — because eight jobs were
once writing 3.27M tokens/week into directories no line of code ever opened. Four categories:
`code` (a .mjs opens it, cite file:line) · `job_input` · `human_file` (for your eyes, listed by path
in `brain status`) · `media`. **A job with no address is reported, not silenced.**

---

# PART 5 — THE LAWS

Every one of these is enforced in code, not prose. Most were bought with a real failure.

## Money
1. **Never a metered API key.** The code refuses to start if `ANTHROPIC_API_KEY` is set. Extra-Usage off. The ceiling is structural.

## Truth
2. **AI proposes · code validates · you approve.** The LLM never does arithmetic.
3. **The zero-invented-number law.** Every digit in the team sheet must trace to a pre-computed feature *or to the prompt itself*. One un-traceable digit and the whole sheet is thrown out and the deterministic skeleton prints. **A hallucinated number physically cannot reach your eyes.**
4. **Silence beats a guess.** `awaiting_data` over a plausible number. Every gate shows `n/needed`, never a bare refusal.
5. **Unmeasured ≠ zero.** A blind sensor reports blindness. ActivityWatch down does not render as "Building 0% — off track."
6. **Unrun = hypothesis.** Nothing is done until it has actually run.
7. **Never guess a number.** Your 1 Aug standing rule: open everything, collect 30–45–60 days of real data, *then* set the limit. Two permitted exceptions: a plan-wall safety net and a failure-repeat guard.
8. **A green selftest, an `ok:true`, and an exit code 0 are claims — the file is the fact.**

## Structure
9. **One writer per file, always.**
10. **Layering, never replace.** Every superseded engine is frozen verbatim in the same file (`analyzeLegacy`, `modeAxisLegacy`, `deadVerdictLegacy`…) so the improvement is a measured difference, not a claim.
11. **Never delete an organ for having no reader — give it an address.**
12. **Fail silent, never loud.** Every hook path exits 0; every failure resolves to no wake, no whisper, no fabrication.

## You
13. **THE GUT-WORD LAW.** `knew|shaky|guessed` before the answer, never re-graded. No gut-word, no rep.
14. **Only four question-moments exist.** Anything else is a quiz-dump, and the fifth is refused by code.
15. **The visualization contract.** One widget per concept; the widget **is** the lesson; **driven**, not merely built.
16. **Capsule prose is sacred.** Immutable; never re-emitted; only ever a targeted edit — and **your paste** is the only master write.
17. **Dheema ≠ lamba.** One idea per message, opened all the way down. (Currently your #1 measured drift: 47 hits.)
18. **THE ANCHOR LAW.** If a thing needs you, it rides an anchor you already hit. If it can't ride an anchor, it doesn't need you. **Max one card per anchor.**
19. **Automate the friction, protect the baking.** Anything you have to remember is a design defect, not a discipline problem.

## Care
20. **The medical clamp.** Data-analyst, never prescriber. Biometrics can never drive a verdict alone. Sustained concern → "see your doctor," full stop. Mood/agitation is never self-interpreted.
21. **THE AFFECT FIREWALL.** Prosody, emotion and agitation are excluded *by construction*. They may change how warmly it speaks, never what it concludes.
22. **No hype, no shame, no streaks, no countdowns.** `10x`, `on steroids`, `god-tier`, `time is short` are banned strings checked in code. The schema *cannot hold a deadline*. A miss is "↻ went again."
23. **Rest counts as a won day.** RED means "rotation is a strength — I'm resting you because I rate you."
24. **The only rival is kal-wala-Nikhil.**
25. **Earned proactivity.** Nothing interrupts you until its shadow record has proven itself *and* you have ratified it out loud.
26. **Report-only self-improvement.** The gate proposes its own retunes and cannot apply them. The Boot Room proposes method changes and cannot apply them. *"A machine that rewires itself without its human's signature is not a cyborg. It is a parasite."*

---

# PART 6 — THE NUMBERS (and where each came from)

**Cold-start gates — dormant by law, not broken:**

| Gate | Needs | Origin |
|---|---|---|
| Calibration ECE + danger zone | 20 reps | design |
| Nemesis axis-pattern | 20 reps + 3 concepts | design (headline is live from rep 1) |
| Learning-state fluency | 12 reps | design, v0 hypothesis |
| Twin's voice | 30 scored resolutions | design |
| Boot Room's first mutation | 200 reps | design |
| Doubt clusters | 4 capsules **and** 60 doubts | design — **already open** |
| Tape-room rematch | doubt ≥14 days old | design |
| Confusion pairs | 6 cracked grades across ≥2 concepts | design |
| Body archive lines | 84 body-days | **external** (12 weeks is a real physiological window) |
| Shadow → voice | ≥10 scorable **and** ≥0.70 hit-rate | design |
| Widget "driven" | ≥2 gates driven | the contract's own 2–3 |

**Measured, not guessed:** the boot tax (49,411→5,663) · think-pause hangover 1400ms · the
transcript-fill budget (4.1 bytes/token × 1M) · the presence stall signature (p95 of calm × 1.25) ·
the pulse base rate (131/881) · the anchor-phrase floor (his own anchors are 11 chars, so a 12-char
floor inside the matcher made the miner 0-for-115) · the recall-hint threshold 0.30 (raw fired on 42%
of turns = theatre; normalised fires on 3.6%).

**Ruled by you:** the bell at 22:00 · the outward floor ≥2×/week · the budget split of the 20x plan ·
`τ1` at 0.40 ("handbrake off") · lecture depth by default · drift auto-counting ("ok do it..") ·
self-repair without asking · public-repo data · the selfknowledge freeze.

**Still honestly guessed** (and `limits.mjs` says so, per row): the pulse daily cap 200 · the distiller's
15-minute cadence · several v0 learning-state thresholds. All waiting on 30–45–60 days of real data —
your own rule, applied to your own machine.

---

# PART 7 — LIVE vs DARK (10 Aug 2026)

## Running and healthy
All 5 daemons up (turnstile · cortex · thalamus · brain daemon · AW). 282 commits. `npm test` at
**73 members across 32 suites**. Last night produced a **complete H-phase chain** — agenda → model_mine
→ dreams → reanalysis → night_coach — plus the full nightshift bundle, the wall, the poster, and the
morning team-talk mp3, all dated 10 Aug and **waiting for you**.

**And it produced them honestly**, which is the most important sentence in this file:
- `model_mine` proposed **0 edges** and said why: the 14-day fact grid has 0 finalized days.
- `dreams` generated **0 bridges** and **refused before spending a token**: the crack inventory is empty.
- `market`, `doubts` and `twin_read` all wrote "too thin to say" instead of inventing numbers.

**A machine that refuses to fabricate on day one is the whole point of the build.**

## Waiting on you (the honest list)

| Thing | State |
|---|---|
| **The forge session on `hallucinations`** | **Open, reopened 7 times since 30 Jul, never past 50% step coverage, 0 axes graded, `method_clean:false` on all 7.** Currently step 3, axis a, 1 question-moment used. |
| **Reps** | **17 total.** Calibration warming (17/40 for trend), nemesis 1/20, genome 17/200. |
| **Re-Jirah** | 4 capsules locked, **3 never re-tempered**: embeddings 46d · inference 43d · context 39d overdue. Only tokenization has rounds (2/3). |
| **FSRS** | 5 cards, **4 overdue**, 0 due today. |
| **`/full-time`** | **Never run.** `SEASON.md` has zero rows. That's why the sheet still says "Matchday 1 · Introduction". |
| **Missions** | 5 staged (M01–M04 + T-hallucinations), **0 fired**. Benchmark stays hard-gated behind them. Outward floor 0/2 this week. |
| **Widgets** | 4 built; only embeddings has been **driven** (3 gates). The other three are, by the registry's own doctrine, failed widgets. |
| **Python** | `python_state.json` completely blank — the 16h biggest rock hasn't opened. |
| **Course** | 6 chapters ingested, 0 covered. |
| **Cards open** | ~8, incl. gem-sync 10d overdue · **Gemini CLI login failing 10× straight (blocking night renders)** · the gate-tune proposal · your own Manager §6 review. |
| **Identity facts** | The two 17-Jul facts are still the ledger, both flagged stale, both dealt as forget-cards. |
| **Oura** | Writing on schedule but the **content is >100h stale** — the ring data hasn't refreshed. |

## Dark until fed
The twin's voice (5–14 of 30 resolutions) · the DMN precache (loaded, deliberately inert until the
earned-voice gate opens) · shadow whispers (7 logged, 0 resolved, gate shut) · the deep brain's adjudicator
(0 of 131 escalations has ever produced a verified verdict) · the Kennel/Pi lane · the pulse weight (0.00
by design until its own cost is measured) · the wall's Gemini render lane (needs the one-time `gemini` CLI login).

---

# PART 8 — THE HONEST READ

The machine is finished and running. **The loop is not closed, and the open end is human.**

Every automated organ ran last night. Every one of them refused to invent data. The night coach even
pre-wrote today's lesson for you — a measured misconception map on `hallucinations`: axis-d
(measure + range) is **0/2 cold**; axis-a is **scaffold-dependent** (0/4 cold-bare, 2/2 when a concrete
artefact is in front of you); axis-c "holds warm, dies cold." That page is sitting in
`brain_out/night_coach/2026-08-10.md` right now.

Meanwhile the deep re-read wrote the sharper sentence: **intake has badly outrun retrieval.**
112 doubts captured; 17 reps done; 0 concepts held cold. Four capsules locked in June, three never
re-tested. The FSRS card served `inference` seven times for zero conversions.

Nothing in this system can fix that, and by design nothing will try — because the one thing it is
forbidden to do is the rep. Five things close the loop, in this order:

1. **`node scripts/forge_session.mjs close`** — the open `hallucinations` session has been hanging for 29 hours. One closed loop unblocks the arbiter, the drills and the coverage report.
2. **One `/full-time`, tonight.** It costs 30 seconds and it births `season.json`, `SEASON.md`, the matchday counter, the KAL→kickoff weld, and three brain jobs that are currently starved of inputs.
3. **One Re-Jirah round** on embeddings — `deep.mjs due` → grade → close → paste. Five organs are waiting on that one paste.
4. **Fire M01.** One click on Gemini opens the benchmark gate — the whole outward loop is staged and untouched.
5. **Reps.** 3 more unlock nemesis's axis-pattern; 23 more unlock the calibration trend. One serious forge day does both.

---

# APPENDIX A — VERIFY LIVE (never trust this file's numbers)

```bash
npm test                                        # the authority: 73 members, run independently
node scripts/brain.mjs status                   # budget, phase, eligible jobs, health
node scripts/limits.mjs human                   # every number + its origin + live have/need
node scripts/physio.mjs                         # what is bleeding right now
node scripts/reconcile.mjs report               # what is produced but never read
node scripts/watchman.mjs report                # last night's sweep + coverage honesty
node scripts/learnstate.mjs nextup              # the arbiter: THE one next thing
node scripts/rejirah.mjs due                    # the cold queue + pending pastes
node scripts/deep.mjs due                       # the questions themselves
node scripts/widget.mjs list                    # built vs driven
node scripts/scout.mjs outward                  # the ≥2/week floor
node scripts/captains_call.mjs list             # every open card
```
```powershell
Get-ScheduledTask -TaskName ArsenalFC-* | Get-ScheduledTaskInfo   # the real clock
```

**And the standing rule this whole file lives under:** when the prose and the code disagree,
the code is right. Fix the prose.

**COYG.** ⚪🔴


