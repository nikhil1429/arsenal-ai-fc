# THE UNLEASH PLAN — 14 Aug 2026

> **FOR THE EXECUTING SESSION (Opus, next session): this file is your entire job.**
> Execute it phase by phase, top to bottom, without re-litigating decisions. Every phase
> carries: WHY (one line) · FILES · EXACT CHANGES · RECEIPT (run it, paste output in the
> commit message) · ROLLBACK. Commit after every phase on the branch. If a receipt fails,
> STOP that phase, apply its rollback, log the failure at the bottom of this file under
> §FAILURES, and continue with the next phase. Do not improvise beyond a phase's scope.

---

## §0 · AUTHORITY, GOAL, AND WHAT THIS SUPERSEDES

**The captain's word (14 Aug 2026, verbatim):** *"i want to fix everything … create a full
blown god tier beast mode plan which fixes everything. next session will follow it blindly
and just implement it … i want minimum token spend but maximum 24x7 output in the highest
intensity possible from every thing in the organism."*

That sentence is the standing authorization for every phase below, including the
thalamus_config edit in Phase 7 (approval-gated file — this ruling is its receipt) and the
lane closures in Phase 9. Nothing here needs a fresh ask. (He also said: skip the card
mechanism — deliver, don't deal cards about this plan.)

**Goal, made precise:** weighted token spend per day flat-or-down, while (a) the deep brain
actually fires on his live Gaffer talk, (b) the five gate-shut organs come alive, (c) every
routine lane runs at the cheapest depth that does its job, and (d) no organ that reaches him
is dumbed down.

**DAY-0 LAW: nothing in this plan waits for data.** Every intensity lever goes LIVE the day
this plan is executed — gates open, effort set, wake gate open at tau1 0.15, conversation
brain attached, Gaffer memory spliced, savings flowing. The ONLY things that happen later
are receipts (48h diff) and optional refits of numbers already live with provisional
values. If any phase tempts you to "wait and measure first," re-read this line: ship the
provisional value with a `_derivation` note and measure while LIVE. He is applying for
jobs in ~30 days; the machine runs at full intensity from day 0, not day 30.

**This plan SUPERSEDES** the 13 Aug artifact "FINAL PLAN — the token work" (c751ea17).
That plan's core claim — *"claude -p treats the whole prompt as one cache block; partial
reuse doesn't exist; therefore disable caching on 34 lanes"* — was **refuted by live probes
on this machine on 14 Aug**:

```
S1  cold:  --system-prompt <21.8k chars stable> + body A   → cw 4,966  cr 0
S2  warm:  SAME system, DIFFERENT body                      → cw 145    cr 4,829  ← split works
S3  warm:  byte-identical repeat                            → cw 0      cr 4,974
R1  seed:  plain -p, big body                               → cw 11,619
R2  resume: claude -p --resume <sid> tiny follow-up         → cw 379    cr 11,619 ← resume works
```

The system prompt has its **own cache breakpoint** that survives body changes; `--resume`
reads the whole prior context at 0.1×. The organism never saw this because
`ORGAN_SYSTEM_PROMPT` is 84 chars (~21 tokens — below every cache minimum) while the whole
stable head sits inside the user prompt. Background and the full audit:
`memory/token-plan-audit-14aug.md`.

**Cache physics used throughout** (verify nothing, these are from the API docs + probes):
write 1.25×, read 0.1×, TTL 5 min, caches are **per-model**, minimum cacheable prefix
haiku 4096 tokens / sonnet 1024 / opus 512. Keep-cache break-even: reuse (cr/cw) > 0.278.

---

## §PRE-FLIGHT (do all five before Phase 0)

1. `git status` must be clean apart from known untracked files (`bash.exe.stackdump`,
   `dressing-room/state/gate_tune_ledger.jsonl`). Then: `git checkout -b unleash-14aug`.
2. Baseline suite: `npm test` (or `node scripts/organism_test.mjs`). **The 14 Aug kickoff
   showed a standing `RED:suite-red` — if the suite is red, FIXING IT IS PART OF THIS
   PLAN (call it Phase −1, do it now):** `node scripts/watchman.mjs report`, diagnose the
   failing member(s) to root cause, repair, re-run to green, commit as `phase-1: suite
   green`. A red suite invalidates every receipt below — do not proceed on red. Then save
   the green pass count.
3. Baseline economics snapshot — run and SAVE the output to
   `dressing-room/state/unleash_baseline.json` (you will diff against it in Phase 10):
   ```bash
   node -e "
   const fs=require('fs');const cutoff=Date.now()-7*864e5;
   const rows=fs.readFileSync('dressing-room/state/brain_ledger.jsonl','utf8').trim().split(/\r?\n/).map(l=>{try{return JSON.parse(l)}catch(e){return null}}).filter(Boolean).filter(r=>Date.parse(r.ts||0)>cutoff);
   const by={};for(const r of rows){const j=r.job;if(!by[j])by[j]={n:0,cw:0,cr:0,inp:0,out:0,model:r.model};const b=by[j];b.n++;b.cw+=r.cache_creation_tokens||0;b.cr+=r.cache_read_tokens||0;b.inp+=r.input_tokens||0;b.out+=r.output_tokens||0;}
   fs.writeFileSync('dressing-room/state/unleash_baseline.json',JSON.stringify({at:new Date().toISOString(),days:7,lanes:by},null,1));
   console.log('baseline lanes:',Object.keys(by).length);"
   ```
4. Probe re-check (2 tiny haiku calls, ~30s): re-run the S1/S2 shape from §0 in a scratch
   dir. If S2's `cache_read` is 0, the CLI behavior changed — STOP the whole plan and
   report; everything below leans on that result.
5. Read `CLAUDE.md` fully. The §NEVER-TOUCH list at the bottom of this plan binds you.

---

## PHASE 0 · METER — make the board see models

**WHY:** every later receipt is read off this meter; model-blind it lies (pulse showed 35%
when it is 15%).

**FILES:** `scripts/brain.mjs` (the `spend` board / `spendOf()` path), `scripts/treasury.mjs`
if it duplicates the weighting.

**EXACT CHANGES:**
- Find the weighted-spend computation (`grep -n "spendOf\|weighted" scripts/brain.mjs scripts/treasury.mjs`).
- Multiply each row's weighted cost by a model factor, single source of truth:
  ```js
  // cost-weight per model, derived from list input prices (haiku $1 / sonnet $3 / opus $5 per MTok).
  const MODEL_MULT = { haiku: 1, sonnet: 3, opus: 5 };
  const mult = MODEL_MULT[row.model] ?? 3;
  ```
  Apply at READ time only — never rewrite ledger rows. Old rows keep their bytes.
- Do NOT change the token-type weights (1× input · 1.25× cache_write · 0.1× cache_read ·
  5× output) — they are correct and shared by all three tiers.
- Follow the layering law: freeze the old function as `spendOfLegacy` in the same file.

**RECEIPT:** `node scripts/brain.mjs spend` (or the board command found above) — pulse's
share must drop to ~15% and sonnet's night lanes must rise to the top. Paste the top-5 table.

**ROLLBACK:** call `spendOfLegacy` again (one-line switch).

---

## PHASE 1 · THE SPLIT — move the stable head into `--system-prompt`

**WHY:** the head (organ preamble + LAWS + fingerprint) is rebuilt and cache-WRITTEN on
every call and read almost never; in the system slot it becomes a separately-cached block
that survives body changes (probe S2). This is the single biggest lever in the plan.

**FILES:** `scripts/brain.mjs` — `buildAnalysisPrompt()` (line ~1787), `claudeExec()`
(line ~1382), `LEAN_ARGS` (line ~1370); `scripts/claudegen.mjs` — same pair
(`ARGS()`/`LEAN_ARGS` line ~98–160, `claudeGen` line ~391).

**EXACT CHANGES:**
1. Change `buildAnalysisPrompt(job, inputs, fingerprint, banned)` to return
   `{ system, body }` instead of one string:
   - `system` = the current `head` template EXACTLY as it exists at brain.mjs:1809
     (`"You are an organ of ARSENAL AI FC… Job: ${job.id}… LAWS:… ${quoteLaw}\n${fingerprint}"`)
     **prefixed by** the current `ORGAN_SYSTEM_PROMPT` text so nothing is lost.
     Everything in it is stable per lane between state changes — including the
     fingerprint (it only changes when he studies; while it is unchanged, every call reads it).
   - `body` = the current inputs section unchanged (`## INPUT k …`).
2. `claudeExec` gains an optional `systemPrompt` argument. When provided, the spawn args
   use `["--system-prompt", systemPrompt, "--tools", "", "--strict-mcp-config"]` instead of
   `LEAN_ARGS`, and `body` goes via stdin exactly as today (`input:` option — body size is
   safe; stdin has no argv limit).
3. **Windows argv cap (hard rule):** if `systemPrompt.length > 26000` chars, move the
   fingerprint out of `system` back into the top of `body` for that call and log a ledger
   note `split:"argv-capped"`. (CreateProcess limit is 32,767 chars total command line.)
4. Update every internal caller of `buildAnalysisPrompt` (grep for it; also the
   night-coach builder at brain.mjs:2198 and the `2441` fingerprint call site — same split
   pattern there).
5. `claudegen.mjs`'s lean path gets the same optional system-prompt-through parameter so
   `dmn.mjs`'s lanes can adopt the split later without further plumbing (do NOT change
   dmn's prompts in this phase).
6. Layering law: keep the old single-string path as `buildAnalysisPromptLegacy` and a
   `SPLIT_DISABLED=1` env check in `claudeExec` that routes back to it.

**Cache-minimum note (why this still helps small lanes):** sonnet needs 1024 tokens and
opus 512 in the *system+prefix* block — every analysis-lane head (preamble+fingerprint,
typically 2k–6k tokens) clears that. Haiku's minimum is 4096: **pulse is handled separately
in Phase 3** — do not force-pad here.

**RECEIPT:** pick one sonnet lane (`doubt_clusters`), run it twice by hand within 5 min:
`node scripts/brain.mjs run doubt_clusters` ×2 (use the manual-run path that exists — the
ledger's `manual:true` rows prove it). Second row must show `cache_read_tokens > 0` for the
first time in that lane's life. Paste both ledger rows.

**ROLLBACK:** `SPLIT_DISABLED=1` in the daemon env; legacy function still in file.

---

## PHASE 2 · CACHE-AWARE SCHEDULING — cluster same-model lanes inside the TTL

**WHY:** the cache is per-model with a 5-minute TTL. Two sonnet lanes 4 minutes apart share
the head for one write; 40 minutes apart they pay twice. Scheduling is free money.

**FILES:** `dressing-room/state/brain_config.json` (jobs' `at:` times only).

**EXACT CHANGES:**
- Read the live jobs list. For every group of jobs with the same `model` whose `at:` times
  are within the same hour and have no ordering dependency (a job that READS another job's
  output must stay after it — check each job's inputs via `gatherInputs` before moving it),
  re-time them into a chain 3–4 minutes apart. Known clusters from the live config:
  sonnet daytime digests (12:30 / 13:30 / 14:20 / 14:30 / 16:30) → 14:20, 14:23, 14:26,
  14:29, 14:32 unless an input dependency forbids; night sonnet lanes similarly; opus
  evening lanes (21:50 / 22:45) → 22:42 / 22:45.
- Conductor-armed and event-driven jobs (`window:"any"`, `manager_m3`'s morning-signals
  gate) are OUT OF SCOPE — do not touch their triggers.
- Comment each moved time with `"_ttl_note": "clustered for cache TTL, was HH:MM (14 Aug)"`.

**RECEIPT:** next night's ledger — the second-and-later jobs in each cluster show
`cache_read_tokens > 0`. (This receipt matures overnight; note it as PENDING in the commit
and verify in Phase 10.)

**ROLLBACK:** the `_ttl_note` fields carry every original time.

---

## PHASE 3 · PULSE ON A ROLLING SESSION — `--resume` for the highest-frequency lane

**WHY:** pulse runs every ~150 s (inside the TTL, forever, while he is active) and is the
No. 1 lane by writes (1.95M cw / 7d). Probe R2 proved a resumed session reads its entire
prior context at 0.1×. A rolling session also means the pulse REMEMBERS the day — the same
disease-class as the Gaffer's 6k-tail amnesia, fixed structurally.

**FILES:** `scripts/brain.mjs` — `runPulse()` (line ~648), `claudeExec()`, plus a small
runtime state file `dressing-room/state/pulse_session.json` (NEW — brain.mjs is its sole
writer; add the ownership header comment).

**EXACT CHANGES:**
1. `pulse_session.json` shape: `{ "id": "<claude session id>", "started_at": iso,
   "turns": n, "date": "YYYY-MM-DD" }`.
2. In `runPulse`: if a session exists for TODAY with `turns < 80`, call claude with
   `["--resume", id]` and a **delta body**: only the afferent rows newer than the last
   pulse (the tail logic already computes rows; filter by timestamp of the previous run),
   plus the standing one-line question. If no session / new day / turns ≥ 80 / resume
   errors (nonzero exit or missing `session_id` in the JSON reply): fall back to a fresh
   call **with the Phase-1 split** (system = pulse preamble + the stable lexicon cartridge
   so the block clears haiku's 4096-token minimum), and write the new `session_id` from the
   reply JSON into `pulse_session.json`.
3. The turn cap (80) and daily rotation are CONTEXT-BLOAT guards, not budgets — mark them
   `guard` in the comment (haiku context 200k; ~80 turns × ~2k tokens stays comfortably in).
4. Every resumed run logs `resume:true` in its ledger row (add the field at the
   `appendFileSync(LEDGER, …)` call site, brain.mjs:~3086 — additive field, breaks nothing).

**RECEIPT:** trigger 3 pulses by hand 2–3 min apart (or let the daemon do it while he is
active). Rows 2–3 must show `cache_read_tokens ≥ ~0.8 × (row 1's total context)` and
per-run weighted cost dropping ≥ 40% vs the 7-day baseline (`8,711 cw/run avg`). Paste rows.

**ROLLBACK:** delete `pulse_session.json` + env `PULSE_RESUME_DISABLED=1` check (add it in
the same edit; one line).

---

## PHASE 4 · PER-LANE CACHING SWITCH — off only where it still never pays

**WHY:** after Phases 1–3 most lanes will read their head; the 13 Aug "turn it off on 34
lanes" is stale. But genuinely isolated one-shots (a lane whose nearest same-model neighbor
is > 5 min away even after Phase 2) still pay 1.25× for nothing.

**FILES:** `scripts/brain.mjs` `claudeExec` env handling; `brain_config.json` per-job field.

**EXACT CHANGES:**
1. Add per-job optional `"caching": false`. In `claudeExec`, when the resolved job carries
   it, spawn with `env: { ...process.env, DISABLE_PROMPT_CACHING: "1" }`.
2. **Set it NOWHERE yet.** Decision comes from data in Phase 10: after 48h with the split
   live, any lane with `reuse < 0.278` AND no same-model neighbor within 5 min gets
   `"caching": false`. (On the 13 Aug data that set would have been ~30 lanes; the split
   will shrink it drastically — measure, don't guess. Never set it on: `haiku_pulse`
   (reuse 0.43 — the 13 Aug plan was wrong here), `lexicon_mine` (0.50), `dmn_rollout`
   (7.34), `ns_grade_probes` (0.93), `capsule_premap` (1.0).)

**RECEIPT:** `grep -n "DISABLE_PROMPT_CACHING" scripts/brain.mjs` shows the plumbing; config
untouched. The real receipt is Phase 10's re-measure.

**ROLLBACK:** remove the config fields (plumbing is inert without them).

---

## PHASE 5 · EFFORT — cheapest depth per lane, both directions

**WHY:** 30 jobs, zero set effort today; everything runs at default depth. Effort is the
biggest per-call output-token lever. His goal is BOTH directions: routine cheap, him-facing
deep. `job.extra_args` already flows into `claudeExec` (brain.mjs:2775) — **zero new
plumbing**; this phase is pure config.

**FILES:** `dressing-room/state/brain_config.json` only.

**EXACT CHANGES:** add `"extra_args": ["--effort", "<level>"]` per job (merge with any
existing extra_args). Haiku lanes get NOTHING (effort is unsupported on haiku — do not set
it on `haiku_pulse` or any haiku job; it would error). Mapping — apply by job id:

| Level | Jobs |
|---|---|
| `low` | all midday/teamtalk digests, `lexicon_mine`, `wall_insights`, `wall_review`, `gemini_render`, `maidan_poster`, `scrimmage_staging`, `day_cartridge`, `midday_cartridge`, `midday_reread`, `doubt_clusters`, `dugout_digest` |
| `medium` | `dmn_counter`, `dmn_rollout`, all `ns_*` night-shift lanes, `dreams`, `diary`, `model_mine` |
| `high` | `cortex_wake`, `night_coach`, `formation_read` (the Manager), `deep_reanalysis`, `evening_voice`, `agenda`, `council_chair` |

Any job not named: `medium`. Jobs Phase 9 disables: skip.

**RECEIPT:** `node -e "const c=require('./dressing-room/state/brain_config.json');console.log(c.jobs.filter(j=>(j.extra_args||[]).includes('--effort')).length,'jobs carry effort')"` →
must equal (total enabled non-haiku jobs). Next-night ledger: output_tokens/run drops on
`low` lanes, holds on `high` lanes — check in Phase 10.

**ROLLBACK:** strip the two array entries per job.

---

## PHASE 6 · OPEN THE GUESSED GATES — five organs come alive

**WHY:** five organs are SHUT today behind numbers nobody derived (his 1 Aug ruling:
no guessed numbers; gather real data first). Guards are NOT touched.

**FILES:** locate each knob's home via `node scripts/limits.mjs` output + grep — the five:

| Organ | Knob | Today | Set to |
|---|---|---|---|
| calibration | `window_size` | 40 | 20 |
| calibration | `danger.min_knew_reps` | 3 | 1 |
| boot room | `bootroom_min_reps` | 200 | 20 |
| twin | `twin_voice_min_resolutions` | 30 | 10 |
| apni ghadi | `min_cards` | 8 | 4 |

Values are the smallest that let the organ SPEAK on current data (have-column of
`limits.mjs`) while keeping a non-zero floor; each gets a comment
`"_derivation": "opened 14 Aug on his no-guessed-numbers ruling; refit from 30d data"`.
Leave `body_archive` (external, sleep science) and every GUARD row exactly as is. Leave
`day_reserve_frac` 0.40 alone — it protects his study window (captain-priority, not a
spend guess).

**RECEIPT:** `node scripts/limits.mjs` → the five rows flip SHUT→OPEN; guards section
byte-identical. Paste the gates table.

**ROLLBACK:** the old values are in this table.

---

## PHASE 7 · THE GAFFER'S DEEP BRAIN, 24x7 — open the wake gate

**WHY:** his most-repeated demand. `cortex_wake` fired 3× in 7 days not for money (23.7%
budget use, cap 15/day, 3 used) but because `tau1_base 0.36` sits above his real turns
(S ≈ 0.06–0.08). The repo already contains the DERIVED maths for the legal fix —
`thalamus_config.json` `_g14_pulse_bound_note`: any fitted `w_pulse ∈ (0, 0.04971]`,
derived as `measured precision × 0.04971`. Pulse said "escalate" 120/193 times and its
voice has weight **0.00**.

**FILES:** `dressing-room/state/thalamus_config.json` (approval-gated — §0's verbatim
ruling is the approval; write that into the change note), possibly via
`scripts/gate_tune.mjs` if it exposes a fit command (check `node scripts/gate_tune.mjs --help` first — prefer the owner organ's CLI over hand-editing; gate_tune owns this file).

**EXACT CHANGES (two independent legs — do BOTH):**
1. **Fit `w_pulse`:** measure pulse precision from data: of the pulse-escalation moments in
   the last 7d, what fraction did a human-visible signal later confirm (a wake that
   produced a served `[DEEP THOUGHT]`, or a card answered)? If the data to compute
   precision honestly does not exist yet, use the conservative floor the note allows:
   `weights.pulse = 0.02` (≈ 0.4 × ceiling), with
   `"_fit_note": "provisional 0.02 of the G14 ceiling 0.04971, his 14 Aug unleash ruling; refit from wake outcomes at 30d"`.
2. **Derive `tau1_base` — DAY 1, no waiting:** compute P90 of his last-7-days VOICE-turn
   salience scores (the thalamus writes per-moment S — find the store via
   `grep -n "salience" scripts/thalamus.mjs`, likely `workspace.json` / the afferent
   annotations; the 13 Aug session read "avg S = 0.06–0.08" from live state, so the data
   exists). Set `tau1_base = max(0.15, P90_voice_S)`. **If P90 cannot be computed in 15
   minutes of looking, do NOT defer — set `tau1_base = 0.15` immediately** (= 2× the
   already-measured 0.06–0.08 average, so his meaningful turns cross and filler doesn't),
   AND add the 2-line `{ts, S, modality}` append to
   `dressing-room/state/salience_log.jsonl` so the refit later is trivial. Either way the
   gate is OPEN from day 1. `wake_cap_per_day 15` and the refractory STAY (guards).
3. Do not touch any other weight.
4. **THE CONVERSATION BRAIN — his 12 Aug ask, delivered (this supersedes the earlier
   "wake-gate only" decision).** His words: *"sonnet not opus to save tokens for gaffer
   24x7… so it can remember and recall every single thing actively passively."* On 13 Aug
   that was rejected as too expensive — but that pricing assumed every call re-pays its
   full context. **Probe R2 changed the economics: `--resume` reads the whole prior
   context at 0.1×.** So build the brain as a **conversation-scoped rolling session**:
   - New state file `dressing-room/state/cortex_session.json` (sole writer: the cortex
     path): `{ conversation_id, session_id, turns, started_at }`.
   - Read `scripts/cortex.mjs` (the `claude -p` spawn near line 498) first. Change: on
     the FIRST wake of a dugout conversation, spawn as today but **capture and persist
     the reply's `session_id`**. Every LATER wake in the same conversation spawns with
     `--resume <session_id>` and sends ONLY the new turns since the last wake — the brain
     arrives already holding the whole conversation (cr ≈ full context at 0.1×).
   - **Model: `sonnet` for the attached conversation session** (3×, his instinct was
     right); keep `opus` exactly as today ONLY for moments scoring ≥ 2× tau1 (rare, deep).
   - **Refractory 15 min applies BETWEEN conversations, not inside one** — inside an
     active conversation the floor is 60s between wakes (the mouth needs time to speak
     anyway). This is the line that turns "one thought per 15 min" into "present through
     the whole conversation."
   - Rotate: conversation end / 2h / 40 turns → close the session record. Any `--resume`
     error → fall back to today's cold path (never block a wake on the optimization).
   - Cost honesty (write into the change note): a 30-min, ~30-turn conversation costs
     roughly 250–350k weighted (sonnet, resume-cached) ≈ ~1% of the weekly organism
     budget per long conversation — affordable at 23.7% utilization; the alternative
     (idle 24x7 loop) stays out because an empty room buys nothing.

**RECEIPT (add to Phase 7's):** during one real dugout conversation, ledger shows ≥2
`cortex` rows with `resume:true` and `cache_read_tokens > 0`, gap < 15 min.

**RECEIPT:** simulate: `node scripts/thalamus.mjs` selftest if present, then one live
evening: `wake_queue.jsonl` shows ≥1 wake per real Gaffer conversation, and
`cortex_wake` ledger rows > 3/week. Immediate receipt: print old→new config diff.

**ROLLBACK:** restore `weights.pulse 0` / old `tau1_base` (both in the diff).

---

## PHASE 8 · GAFFER TRUST — the three fixes the 13 Aug session found and dropped

**WHY:** the confabulation root causes are still live: no door to the data, laws in prose,
no auditor. "Maximum output" includes not being lied to.

**FILES:** `scripts/dugout.mjs`, `brain_config.json` (one new tiny lane), `scripts/brain.mjs`
(job kind if needed).

**EXACT CHANGES:**
1. **Doors:** add two read-only tools to the Gaffer's tool list (follow the exact
   registration shape of the existing 29 — grep `answer_card` in dugout.mjs and clone its
   pattern): `get_card(id)` → returns the card's full line + linked report path's first
   4k chars; `get_mission(id)` → returns `dressing-room/missions/<id>*` or
   `state/scout_reports/mission_<id>*` first 8k chars. Read-only, no writes, no new
   model calls.
2. **Law into code:** in the exact place dugout.mjs assembles the text it SPEAKS, strip
   machinery brackets mechanically: `text.replace(/\[(DEEP THOUGHT|[A-Z _-]{3,})\]/g, "")`
   — the "never mention the machinery" law stops being a sentence and becomes a filter.
3. **Auditor:** ONE new nightly haiku lane `gaffer_claim_audit` (`at: "03:10"`, model
   haiku, `caching` default, body = today's `brain_out/dugout/<date>.md` + the day's cards
   and mission ids; instruction: list every factual claim the Gaffer made about cards,
   missions, or state, mark each CONFIRMED/UNSUPPORTED against the supplied data, ≤15
   lines). Output to `brain_out/gaffer_audit/<date>.md`. Costs ~30–60k haiku tokens/night
   (≈0.5% of spend) — accepted under his ruling; it is the "koi organ nahi jaanchta" fix.
4. **MEMORY — kill the 6k-tail amnesia (the third root cause from 13 Aug).** Today a fresh
   connection (page reload, key rotate, new day) seeds the Gaffer with ONLY a 6,000-char
   tail of TODAY's file (`LIVE_TAIL_BUDGET`, `dugout.mjs:2402`; `buildRehydrate()` reads
   `localDate(now)+".md"` only) — yesterday's 35k-char conversation simply does not exist
   for it unless it happens to call `get_context`. Fix by SPLICE, not by raising the tail
   (the 11 Aug clamp protected the Live context window — respect its intent):
   - New seed = **[A]** latest `brain_out/dugout_digest/<most recent date>.md` first
     ~2,500 chars (the nightly Sonnet digest of his dugout talk — already produced, zero
     new spend) + **[B]** on a fresh day, yesterday's dugout file LAST ~2,000 chars +
     **[C]** today's 6k tail exactly as now + **[D]** one standing line: *"Deeper memory
     exists — call get_context/get_iceberg before claiming you don't remember."*
   - Hard cap the assembled seed at 12,000 chars total (≈3k tokens — still small for the
     Live context). Pure file reads; **zero new model calls**.
   - Guard: every splice part is fail-silent (missing digest file → skip that part).

**RECEIPT:** dugout selftest green; a scripted tool-call smoke test of `get_card` returns
real card text; the bracket-stripper has a unit assertion in the selftest; the audit lane
runs once by hand and produces a file; a forced reconnect logs the seed composition
(`[A]+[B]+[C]+[D]` byte counts) and a scripted "kal humne kya baat ki thi?" probe answers
from digest content instead of confabulating.

**ROLLBACK:** tools are additive; lane `enabled:false`; filter behind an env flag if it
ever eats a legitimate bracket; splice behind `DUGOUT_SPLICE_DISABLED=1` (seed falls back
to today's-tail-only exactly as before).

---

## PHASE 9 · CLOSE THE THREE DEAD LANES

**WHY:** `drill_forge` (opus) · `deep_twin` · `widget_spec` produce output with zero
readers (traced end-to-end on 13 Aug). His §0 word covers closure; layering law says
disable, never delete.

**FILES:** `brain_config.json`.

**EXACT CHANGES:** `"enabled": false` + `"_closed_note": "no reader (traced 13 Aug), closed
under his 14 Aug unleash ruling; revert = enabled:true"` on all three. (Resolves the 13 Aug
plan's contradiction where widget_spec sat in both keep-caching and close lists. The
`widget.mjs` REGISTRY — the Visualization Contract — is untouched; only the nightly spec
lane closes.)

**RECEIPT:** next daemon cycle skips all three (ledger silent for them); no watchman RED.

**ROLLBACK:** flip the three booleans.

---

## PHASE 10 · RECEIPTS, RE-MEASURE, AND THE 48-HOUR VERDICT

Run after 48h of the branch live (the daemon runs from the working tree):

1. Re-run the §PRE-FLIGHT baseline one-liner into `unleash_after.json`; diff per lane.
2. **Success criteria (all must hold):**
   - Organism weighted/day (Phase-0 meter) **down ≥ 20%** with run counts within ±10% of
     baseline (same work, cheaper).
   - `haiku_pulse`: cache reads on **> 60%** of runs; weighted/run down ≥ 40%.
   - Sonnet analysis lanes: `cache_read_tokens > 0` on the second-of-cluster runs.
   - `cortex_wake` fired on ≥ 1 real Gaffer conversation (wake_queue served rows).
   - `node scripts/limits.mjs`: 5 organs OPEN; guards byte-identical.
   - `npm test` green, watchman: no NEW reds.
3. Apply Phase 4's data-driven `"caching": false` to lanes still at reuse < 0.278 with no
   TTL neighbor.
4. Update `memory/token-plan-audit-14aug.md`: mark EXECUTED with the diff numbers, and
   append one line to `MEMORY.md`'s pointer.
5. Leave the branch committed; the nightly groundsman push lane carries state as usual.
   Merge to main only after the suite is green and the captain has glanced (repo push law).

## §NEVER TOUCH (binding on the executor)

- The four canonical files (`OPS_STATE.md`, `ARSENAL_AI_FC_MASTERPLAN.md`,
  `THE_MANAGER__Master_Prompt.md`, `THE_GAFFER.md`) — nothing in this plan needs them.
- GUARDS (failure backoff, runaway caps, API-key refusal, headroom floor, bell grace,
  sheet cap) and `day_reserve_frac`.
- `capsules/` (mirror.mjs territory), `hippocampus` state, `identity_facts`, the teaching
  layer, FORGE state, `oura_*` secrets, `.gitignore`.
- Never set `ANTHROPIC_API_KEY`; the billing guard's refusal is law (Max subscription only).
- The DMN budget (`MAX_ROLLOUTS_NIGHT 100`) — a separate, unfinished conversation; not in scope.
- Don't "fix" `brain_ledger.jsonl`'s shared-append design or any owners-partition rule.

## §FAILURES (executor appends here)

### F1 · PHASE 1's premise is REFUTED at this repo's real head size (14 Aug, measured)

The split is BUILT, live and correct — but it is worth a fraction of what the phase
claims, and the reason kills Phase 2 outright. Three sonnet probe pairs, run before
shipping (scratchpad `probe2.mjs` / `probe3.mjs`):

| probe | system block | run 1 | run 2 (different body) | verdict |
|---|---|---|---|---|
| A | 1,625 chars ≈ 406 tok — **the live analysis head** | cw 0 · cr 0 · in 823 | cw 0 · cr 0 | **not cached at all** |
| B | 5,200 chars ≈ 1,300 tok | cw 2,184 · cr 0 | cw 164 · **cr 2,026** | cached, the split pays |
| C | 4,600-char **identical prefix**, different lane tails | lane A cw 1,712 · cr 0 | lane B cw 1,712 · **cr 0** | **no prefix sharing** |

1. **The head is 406 tokens, not "2k–6k".** Measured live: fingerprint 977 chars,
   whole head 1,625. Sonnet's minimum cacheable prefix is 1024 tokens, opus's 512.
   Probe A says a block under the bar is not cached — it is charged as plain input.
2. **The obvious repair does not work.** Probe C tested the shared-cartridge idea
   (one identical block first, each lane's tail after): the second lane wrote its
   own cache and read nothing. The match is on the WHOLE system block, not on the
   longest common prefix. So padding heads to clear the bar would cost every lane
   ~900 tokens a run to buy a read that never arrives.
3. **Therefore PHASE 2 IS SKIPPED, not deferred** — its entire WHY ("two sonnet
   lanes 4 minutes apart share the head for one write") is what probe C refutes.
   Re-timing jobs carries real dependency risk for a measured gain of zero, so the
   `at:` times are left alone. If a future session wants clustering, the thing to
   cluster is repeats of ONE lane, not neighbours.
4. **What Phase 1 IS worth, and why it stays in:** the 406 head tokens move out of
   a user block that is cache-written at 1.25× and never read, into plain input at
   1.0× — small and certain. And it is the door Phase 3 needs: the ledger's new
   `split` field and the `--system-prompt` path are already wired, so the moment a
   lane repeats inside the TTL with a head over the bar the read costs no new code.
   Shipped as INERT-BUT-ARMED and labelled that way in the file, rather than left
   in the plan as the biggest lever when it measures ~1.3% of one call
   (live receipt: doubt_clusters cw 24,597 body vs 327-token head).

The three probe results are written into `brain.mjs` above `splitPrompt()` — the
only place in the repo that records them, so the next session does not re-derive
this lever's value from prose.
