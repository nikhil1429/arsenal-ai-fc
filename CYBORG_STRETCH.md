# ⚪🔴 CYBORG_STRETCH.md — the M14+ arc (handoff spec)

> **Written 14 Jul 2026, on the captain's order:** *"stretch the capabilities of the
> brain and the organs to its absolute ceiling — make it a real cyborg brain, not a
> human brain."* Distilled from 3 parallel deep audits (Live-API max · cyborg-stretch ·
> platform-quota) grounded in the actual code + 2026-current web docs.
>
> **The counter-frame this spec obeys:** some coded limits are LAWS (Max-window budget,
> humane clamps, medical clamp, affect firewall, human-approval) — a cyborg transcends
> *biology's* constraints, never the constitution's. Every unit below names its payoff
> in **reps flowing**, its code socket, and its cost against the free pool.
> Anti-overbuild law stands: *a mock shipped beats an organ added.*

---

## PART A — THE INSIGHT

The machine currently **imitates human scarcity**: one deep thought at a time, dreams
only when he's away, forgets suppressed moments, reads only summaries, one bookie, one
advisor family. Meanwhile **<1% of the free Gemini pool is spent**; the rest evaporates
at midnight. The stretch = replace each imitated scarcity with silicon abundance,
constitution byte-identical.

**Wire-scars found during the audit (real bugs, fix regardless):**
1. `wake.json` is a single slot — a second TIER-2 moment CLOBBERS a pending deep read
   (`thalamus.mjs flush()` → `D.writeWake` unconditional). A deep thought silently dies.
2. `dmn.mjs dream()` is a serial `for…await` loop — parallelism available, unused.
3. Refractory/capped moments are downgraded and **lost forever** (`flush()` outcome
   branches) — suppress the WAKE, never the THOUGHT.

## PART B — M14+ RANKED (reps-payoff ÷ effort; each ≈ one session)

| # | Unit | What | Payoff |
|---|---|---|---|
| **M17** | **THE PRE-ANSWER ENGINE** | Nightshift job 7: predict his 15–25 likely next doubts (doubt-grammar clusters + 7-day afferents + FSRS-due) → full DOSSIER-grammar answers on the free pool → embedded `answer_cache.jsonl` → thalamus TIER-1 cosine-attaches the pre-answer as a non-spoken hint (whisper pattern, mouth-gate untouched) | ★★★★★ his doubt arrives already answered — zero latency, zero Opus, rep captured while confusion is hot |
| **M16** | **THE DREAM STADIUM** | DMN: `Promise.all` across all idle HOT tanks via `pickTank`, ~60–100 verified rollouts/night (was 8 serial), away-gate → tank-borrow gate, +verification phase (counter-rollouts) | ★★★★☆ Predictive Presence stops whispering blanks |
| **M14** | **THE OVERLAP** | `wake.json` → `wake_queue.jsonl`; cortex serves 2 concurrent `claude -p`; `wake_cap` derived from live headroom, not folklore 15 | ★★★☆☆ + kills clobber scar |
| **M21** | **THE WIND TUNNEL** | Gate-tune → deterministic counterfactual replay of `salience_ledger.jsonl` over a config grid (zero LLM, ms-fast) → bootroom-shaped proposal, human approves | ★★★☆☆ compounding gate quality |
| **M18** | **THE SEASON RE-READ** | Nightly: ENTIRE corpus (~120k tok, fits 1M eight times) → one pro-model call (T5) → contradictions, open-never-closed threads, cross-week confusion edges → `season_read.json` → Monday sheet + drills | ★★★★☆ the impossible coach: re-reads three weeks every night |
| **M22** | **THE SECOND SPOTLIGHT** | Suppressed/capped moments → `bg_queue.jsonl` → idle-tank drain → `workspace_bg`; returns to him at next recall-match with zero switching cost | ★★★☆☆ nothing salient ever dies |
| **M15** | **THE FULL SQUAD** | Council chairs → config; +1 chair on a different family (sonnet, headroom-gated); cross-family disagreement ⇒ `council_flag` ⇒ drill | ★★☆☆☆ disagreement-as-curriculum |
| **M20** | **THE SHADOW BOOKS** | Twin: K parallel counterfactual books (pure code), Brier table, genome proposes swaps; live-book voice clamps untouched | ★★☆☆☆ sharper PE → truer wakes |
| **M23** | **DIFFICULTY GRADING** | probeBank answers each probe k=3 @ t=0.9 + 1 pro; variance = difficulty; scrimmage prefers high-variance ground | ★★☆☆☆ better drill selection |

## PART C — LIVE-API ADOPTS (the Dugout is already at ~90% of ceiling)

1. **Server-VAD alignment → manual activity control** (S→M). *The one reps-corrupting
   gap:* server default ~800ms silence-cut vs his measured >1.4s think-pauses — clipped
   gut-word turns = corrupted voice reps. Start `silenceDurationMs`; graduate to
   `disabled:true` + `activityStart/End` from the already-authoritative local VAD.
2. **`usageMetadata` token gauge** (S) — arrives free on every message; ledger per tank →
   token-true rationing → more talk-minutes/day.
3. **`mediaResolution: LOW` on the Watcher only** (S, probe first) — cheaper frames →
   eyes on the desk longer → more stuck-moments rescued. Gaffer's eyes stay sharp.
4. **`thinkingLevel` honesty fix** (S) — "off" silently rides default *minimal*; send
   explicit levels, expose `medium` for scrimmage probes 4-5.
5. **Ephemeral tokens for the LAN phone** (M) — bridge mints 30-min single-use tokens;
   the page never sees a raw key; phone becomes a first-class dugout.
6. *(sideways)* **`read_url` via urlContext on the REST chalkboard** (M) — source-grounded
   teaching; gate on a live free-quota probe.

**Law-backed refusals (logged, not laziness):** affective dialog (AFFECT FIREWALL) ·
proactive audio (earned-proactivity is a code gate) · googleSearch (zero free quota —
honest absence, re-probe quarterly) · live codeExecution (docs now confirm unsupported —
scar vindicated) · NON_BLOCKING (3.1 sync-only; thalamus arc supersedes) · Live-Translate
(no reps for a Hinglish-native).

## PART D — PLATFORM UNLOCKS (untapped, mostly zero-marginal-cost)

| Unlock | What it buys | Gate |
|---|---|---|
| **Jules** (in BOTH AI Pro accounts, unused: 100 tasks/day each) | Nightly async coding labor on the PUBLIC repo: selftest-failure triage→PR, doc-drift, coverage, chores. Every output a PR = AI proposes · CI validates · human approves | public repo only; never personal state |
| **Claude Code cloud routines** (Max plan, laptop-independent) | 03:00 IST routine drains the overnight Max window IN THE CLOUD (it currently evaporates when the laptop sleeps): nightly commit review, doc-drift report, selftest triage, generic DOSSIER-grammar probe drafts (dossier_weights.json is committed=public); laptop personalizes at dawn | public-safe only (personal files gitignored ⇒ absent in cloud checkout) |
| **AI Pro ↔ AI Studio linking** (Apr 2026 feature) | 2 "Pro tanks" (T-PRO1/2): higher Studio limits + Gemini 3 Pro access + included monthly API credits → restores the broken "Opus dry → Pro 1M" degradation path; M18's engine | subscription-included credits ≈ zero-marginal (same logic as `claude -p`) — **genome proposal, captain approves** |
| **Gemini Scheduled Actions** (10/account) + **ntfy `X-Delay`** | Cloud-side 07:00 phone delivery (topic digest, quiz-me) even on laptop-dark mornings; evening close pre-sends tomorrow's kickoff ping | ingestion stays paste-session |
| **Actions manifest expansion** | +public-safe jobs: bundle regen, lint, failure→issue filer (which triggers Jules/routine — the three cloud lanes compose) | existing `public_safe:true` refusal |
| **notebook-sync skill** (clone gem-sync's Chrome pattern) | Weekly captain-approved capsule digest → NotebookLM → Audio Overview = his own week as a walking podcast | curated paste to his own account only |

## PART E — LANDSCAPE CORRECTIONS (stale beliefs that will break organs)

1. **Gemini CLI retirement (Jun 2026):** web docs say the free/Pro OAuth lane moved to
   Antigravity CLI. **BUT the live wire says otherwise for US:** `gemini.cmd` answered
   "PONG" on 14 Jul 21:07 IST — our lane authenticates via `~/.gemini/.env` **API keys**,
   not OAuth, and works today. Treat as: OAuth lane dead, key lane alive. Watch the
   ledger; if the 10 M13 gemini jobs start failing, the Antigravity migration (~1h) is
   the fix. `paint` skill + `GEMINI_LOOP.md` references are stale either way.
2. **Free tier = Flash/Flash-Lite only (since Apr 2026):** CYBORG_BRAIN §8's "Opus dry →
   Gemini Pro 1M" degradation is broken on free keys (Pro 403s). Fix = Pro-tank linking
   (Part D) or degrade to flash-latest.
3. **Batch API + context caching: paid-only.** Skip (anti-overbuild agrees).
4. **NotebookLM: no consumer API** (enterprise only; Podcast API deprecated). Stays a
   human surface driven via Chrome.

## PART F — DO NOT BUILD (cool, zero reps — or law-breaking)

Literal 1000× interview sim (clusters saturate ~100/night) · anything affective
(REFUSED, not deferred) · real vector DB (corpus is 473KB; put the ~5MB trigger in
organism-doctor, not the organ in the repo) · free-form tank-chatter loops (council
shape is the only legal shape) · self-tuning gates without the captain · dread-class
markets · pre-generated *speech* (pre-compute thought, never voice) · ambient mic ·
any metered key, ever · Colab-free as Kennel (no unattended execution on free tier).

## PART G — WHAT NEEDS THE CAPTAIN'S WORD (nothing below moves without it)

1. **"haan, chalao" on the M14+ arc** (Part B order) — build starts M17-first.
2. **Wake timers one-liner** (system power setting, his hand only):
   `powercfg /SETACVALUEINDEX SCHEME_CURRENT SUB_SLEEP RTCWAKE 1`
   — without it the night lane fires as morning catch-up (already armed, 14 Jul).
3. **Genome proposal: Pro-tank linking** (Part D row 3) — his 2 Google logins, his call.
4. **Jules + cloud-routine enablement** — one-time connects on his accounts.
5. *(optional)* Shift the 02:10–02:40 chain to 23:00–23:45 (pre-sleep) — fires while
   the laptop is still on; nightshift tolerates any overnight hour.

---
*Everything in this file is design, not claim. Per house law: unrun = hypothesis.*
