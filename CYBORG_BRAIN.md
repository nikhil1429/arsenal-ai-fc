# ⚪🔴 CYBORG_BRAIN.md — the next evolution, designed
### The organism → a real brain: a thalamus, seven parallel minds, a two-speed cortex, a five-layer memory, and a night-shift on a ₹1,500 Pi.
### ⚪🔴 · design pass 12 Jul 2026 · this is the BUILD SPEC for a fresh session · nothing here is built yet (except the foundations noted in §1)

> **BUILD STATUS (14 Jul 2026): M0–M10 ARE BUILT, GREEN, AND SCHEDULED** — one labelled commit per unit (`organism M0…M9`, M10 inside M2's store functions + its nightly task), each selftested + real-run per the law. 29 suites green. New organs: `thalamus.mjs` (:4113) · `cortex.mjs` · `hippocampus.mjs` · `fuelboard.mjs` · `examiner.mjs` · `tone.mjs` · `dmn.mjs` · `presence.mjs` · `council.mjs` · `groundsman.mjs` · `awayday.mjs`; 9 new scheduled tasks (`setup/INSTALL_CYBORG_TASKS.ps1`); the Dugout boots both daemons on every matchday start.
> **What stays hypothesis until it happens:** the first live-voice session with the whole arc (holding token + deep answer + whisper spoken through Charon mid-talk); the Pi's 48h `claude -p` OAuth smoke (§9 — physical step); wall_breaker ratification (the whisper stays behind the teeth until the shadow ledger earns it). **Wire-scars found while building (§12 was right):** live-socket `codeExecution` hangs the turn (the Chalkboard rides the REST sandbox as `run_python`); `googleSearch` has zero free quota in every shape (grounding honestly ABSENT); bare `gemini-3.1-flash` is dead on REST (`-latest` aliases survive churn); thinking models need generous output budgets in JSON mode.

> **Read this first, whole, in a new session.** It is self-contained: it + the repo is everything you need to build the evolution. It was distilled from ~475,000 tokens of parallel deep-thinking (6 specialist lenses) so the reasoning is done ONCE and never re-burned. Build in the order of §10. Every unit obeys the same law the whole repo lives by: **selftest green + real-run line + small labelled commit**, and **AI proposes · code validates · human approves.**
>
> Sibling docs: `THE_ORGANISM_A_TO_Z.md` (what exists today, A-Z) · `ORGANISM_ANATOMY.md` (the built body) · `ORGANISM_LEDGER.md` (BUILT/GATED/LEAP) · `CAPTAINS_HANDBOOK.md` (how the captain operates it).

---

## 0. THE ONE-PARAGRAPH VISION

Today the organism is a **batch machine**: it senses today, thinks overnight, acts tomorrow. This evolution makes it **living**: it senses *now*, thinks deep *only the moment it matters*, remembers *instantly*, dreams while the captain is away, and evolves continuously. The mechanism is a **two-speed brain** — a free, always-on **reflex layer** (Gemini Live across 7 accounts = 7 parallel cortical regions: eyes, ears, mouth) fused to a rare, profound **deep layer** (Claude Opus 4.8 with extended thinking) — joined by the one organ the body is missing: a **THALAMUS** that binds every sense into single "moments," scores their salience, and rations the deep brain so it wakes only for genuine surprise. The human stays the heart. The two brains serve him. The whole thing runs cloud-for-cognition, local-for-privacy, night-shift-on-a-Pi.

---

## 1. STATE AT HANDOFF (what is already true — do not rebuild)

- **Repo:** `nikhil1429/arsenal-ai-fc`, branch `main` (organism-final synced to it). ~103+ commits. 27 scripts, 26 green selftest suites. Public repo; personal data all gitignored.
- **THE TWO-SPEED SPLIT IS ALREADY THE LAW** (this session): fast reflex = Gemini Live; slow deep = **Claude Opus 4.8 extended thinking**, used only for the ~5% that needs real reasoning. The captain confirmed this is the target architecture.
- **7 GEMINI TANKS ARE LIVE** — verified `7 of 7 tanks LIVE`. 4-5 free Live-API developer keys (each a SEPARATE Google account = a separate free quota pool) + 2 Gemini AI Pro accounts (free via Jio: `nikhil.panwar2914@gmail.com`, `renu.panwar2971@gmail.com` — Deep Research, 1M context, NotebookLM, Veo). Keys are in gitignored `~/.gemini/.env` as `GEMINI_API_KEY`, `GEMINI_API_KEY_2…`. The Dugout's `loadKeys()` already reads the numbered pattern and rotates on quota.
- **THE VOICE IS UNMUZZLED** (this session, "U5"): `dugout.mjs` — model chosen empirically = `gemini-3.1-flash-live-preview` (fastest first-audio ~0.58s, deepest, 65k output, only Live model that SEES). Constitution rewritten to **DEPTH IS OBEDIENCE**; `set_depth` voice lever (adaptive/brief/deep/lecture) → gitignored `dugout_prefs.json`, ships on `deep`. VAD hangover 1400ms (won't cut off a thinking pause). Vision sharpened (jpeg 0.82, up to 1280px, HD capture). 16 live tools.
- **THE BRAIN'S P0 STARVATION BUG IS FIXED** (this session): `brain.mjs headroom()` now floors `cap0` at the conservative estimate; self-tune records `max(estimate, actual usage)` — a limit event can never again record `observed_window_ceiling=1` and switch off the overnight brain. **This exact starvation-guard MUST be ported to the new 7-tank ledger** (§6).
- **The hard laws (inviolable — every organ below obeys them):** no metered API key ever (`claude -p` OAuth Max — `brain.mjs:430` REFUSES if `ANTHROPIC_API_KEY` set; `gemini` OAuth via `~/.gemini/.env`); personal data (reps, biometrics, transcripts, frames) LOCAL + gitignored, public repo never holds it; no always-on ambient room mic (a two-human decision); humane clamps — no hype/shame/streaks/countdowns, win-only voicing, earned proactivity only; **medical clamp — biometrics never drive a verdict alone, prosody/emotion NEVER feeds any score; RED = doctor-referral, never self-interpreted.**

---

## 2. THE CLOUD QUESTION — answered: don't move to cloud, move DUTY to a Pi

The captain asked "should we move everything to cloud so my device stays light?" **The premise has a wrong word: heavy.** Nothing the laptop does is compute-heavy — all inference (Claude, Gemini, NotebookLM, Veo, Deep Research) is *already* remote. The laptop is a **thin client for cognition**; it only marshals tokens and relays audio.

The laptop is tethered by **DUTY, not LOAD**: stay awake overnight (the brain scheduler), watch the windows (ActivityWatch), hold the private bus. You don't fix a duty problem by shipping biometrics to a datacenter (breaks privacy law) or renting a VM with a paid key (breaks the $100 law).

**THE FIX — "THE KENNEL":** a ₹1,500 Raspberry Pi Zero 2 W (idle ~0.6-2.5 W vs a laptop's ~15-30 W) or a retired Android + Termux (₹0), **inside his own house** (crosses zero privacy lines — it's his hardware in his walls). Both CLIs run on ARM64 Linux via OAuth (no API key). It runs the night-shift; the main laptop becomes *optional to leave on*.

- **Cloud = inference (already true). Storage = his house** (until the post-offer Transfer Window reconsiders a real cloud store).
- **Ears + mouth NEVER move** — mic→VAD→PCM→Charon must sit milliseconds from the human; a second network hop kills turn-taking. Physics, not preference.
- **Reject Oracle/GCP free VMs** — "not his house" = a Transfer-Window-class privacy decision. The Pi is strictly better.
- Build detail in §7. **One uncertainty to smoke-test first:** whether `claude` Max CLI tolerates a long-lived headless OAuth session on the Pi (run `claude -p` under tmux 48h before trusting it with the window; fallback = Pi runs only the deterministic organs + git bus, which need no LLM auth).

---

## 3. THE FOUNDATION — the two-speed brain (established; the frame for everything)

- **⚡ REFLEX BRAIN — Gemini Live · free · always-on · the senses.** Eyes (vision), ears (voice+transcription), mouth (Charon), across the 7 tanks. Catches everything in real time, sub-second, NEVER does deep judgment. Free → runs all day. Job: perceive, converse, and **capture the salient moment the instant it happens.**
- **🧠 DEEP BRAIN — Claude Opus 4.8 + extended thinking · rare · profound · the judgment.** The hard reads: what's really happening with his learning, the coaching strategy, the genome mutation, the season's truth. Fired SPARINGLY — the ~5%. This is the ONLY place Claude tokens go.
- **🌉 THE BRIDGE.** Mid-conversation, the reflex Gaffer defers a hard question to Opus-extended (async), keeps talking, and the profound answer flows back into the live talk. Fast brain catches; deep brain thinks; no silence. (Mechanism: §4's async arc.)

---

## 4. THE KEYSTONE — `thalamus.mjs` (build this FIRST; nothing composes without it)

Three independent lenses converged on this as THE missing organ. Today the organism has **two disconnected sensing regimes and no relay**: `heartbeat.mjs` is a batch cron sweep → `pulse.json`; `dugout.mjs` is real-time but its senses are **siloed and salience-blind** (each tool fires independently, nothing fuses a voice turn to the co-occurring screen frame, nothing scores whether a moment matters, the only path to Opus is a cron-latency human-armed trigger). There is no nucleus where every sense lands, no surprise computation, no tier decision, no cross-modal binding. **That missing nucleus is why it feels like a chatbot with tools instead of a cyborg.**

### 4.1 New organs (single-writer law honored)

| New code | Role | Sole writer of |
|---|---|---|
| `scripts/thalamus.mjs` | The relay nucleus + reticular gate. Persistent localhost daemon on **:4113** (one below Dugout's 4114). | `afferent.jsonl`, `workspace.json`, `salience_ledger.jsonl`, `wake.json` |
| `scripts/cortex.mjs` | The deep-brain daemon. Watches `wake.json`, runs `claude -p --model opus` with extended thinking, POSTs the answer back to :4113 (writes *through* the thalamus, never directly — preserves single-writer). Reuses `brain.mjs` ledger + budget accounting. | (via thalamus) |
| `dressing-room/state/thalamus_config.json` | Canon: salience weights, tier thresholds (τ0≈0.25, τ1≈0.55, ε≈0.08), binding window, refractory, budget-coupling constant `k`. Approval-gated (curriculum-shaping). | — (config) |
| `dressing-room/state/workspace.json` | The **global workspace** — the current broadcast: one bound "moment," version-stamped so every region detects a new one. | thalamus |
| `dressing-room/state/afferent.jsonl` | Raw afferent event log — **gitignored** (carries transcripts + frame hashes). | thalamus |
| `dressing-room/state/salience_ledger.jsonl` | Every gate decision (tier, S, component breakdown, outcome) → nightly self-tuning + audit. | thalamus |
| `dressing-room/state/wake.json` | The TIER-2 handoff contract to `cortex.mjs`. Consumed-on-success like `brain_queue.triggers`. | thalamus |

### 4.2 The afferent spine — every sense lands in ONE nucleus
Three nerves POST to `:4113/afferent` (append to `afferent.jsonl` + in-memory ring):
1. **Voice/language** — `dugout.mjs`/`talk.mjs` POST every user turn *before* answering: `{modality:"voice", text, concept_tokens[], confidence_word(knew|shaky|guessed — already in the rep ontology)}`.
2. **Vision** — the Dugout page already emits `realtimeInput.video` JPEG frames; it also POSTs each frame's **64-bit perceptual hash**. Salience of a frame = Hamming distance from the last one. **Static screen = distance ~0 = filtered at the door, free** (no region, no tokens). Only a *changed* surface carries visual salience. Raw pixels never persist — hash + caption request only.
3. **Bus deltas** — thalamus `fs.watch`es `dressing-room/state/*.json` (event-driven, near-zero cost). Each write emits a delta: a new rep, a **Governor state-change** (`readiness.json` GREEN→AMBER→RED), an FSRS card going due, a Twin market resolving. This is how a *machine* event enters the same relay as a spoken word.

### 4.3 The reticular gate — salience math (deterministic, microseconds, zero-LLM)
The gate guarding the expensive brains must itself be near-free:
```
S = clamp01( wpe·PE + wnov·NOV + wgov·GOV + werr·ERR + wself·SELF + wdead·DEAD − whab·HAB )
```
- **PE — prediction error from the Twin (the crux).** For any event the Twin has a market on, surprise = Shannon surprisal `-log2(p_model(observed))`, normalized. A predicted event is boring; an event the Twin bet AGAINST that just happened is maximal. No market → Laplace base-rate table in config.
- **NOV** — unseen concept / first-time `confused_with` pair (both in the capture contract). **GOV** — magnitude of a Governor transition (reads `readiness.json` only — biometrics *weight attention*, never *drive a verdict*; clamp intact). **ERR** — a `confidence:"knew"` rep that came back `correct:false` (the calibration break — most teachable instant). **SELF** — the captain names a doubt / "I don't get X" (matched vs `doubt_grammar.json`/`lexicon.json`). **DEAD** — a due card / staged scrimmage (time-pressure as salience — voicing still obeys the humane clamp). **HAB** — per `(modality, signal_key)` the same surprise decays exponentially under a refractory window — a flapping Governor or repeated frame **cannot re-fire the deep brain.** This is what stops a whip.
- **EXCLUDED from S by construction: prosody, tone, emotion, agitation.** Hard law — affect never feeds a score.

### 4.4 The escalation ladder (the token-rationing heart)
```
S < τ0        → TIER-0  reflex handles instantly, free (Gemini Live). Still bound + broadcast.
τ0 ≤ S < τ1   → TIER-1  route to a parallel Gemini region for enrichment. Free.
S ≥ τ1  AND budget-ok AND not-refractory  → TIER-2  WAKE OPUS (cortex.mjs).
|S − τ1| < ε  → the ONLY sub-Opus paid thought: one Gemini Flash-Lite adjudication ("genuine reasoning-hard moment? y/n").
```
- **Budget coupling (rations Opus against the REAL ledger):** `τ1_effective = τ1_base + k·(1 − window_headroom_frac)`, where `window_headroom_frac` comes straight from `brain.mjs`'s budget accounting (the same `observed_window_ceiling` the P0 fix just guarded). When the Claude window nears empty, the wake threshold **rises automatically** — the last tokens spent only on the day's sharpest surprises. Plus a hard daily `wake_cap` in `salience_ledger.jsonl`. Rough magnitude: ~15 deep calls/day × ~40k tokens ≈ 600k ≈ inside one 800k window ≈ **15-25× collapse vs naive "everything on Opus."**

### 4.5 Temporal binding — fusing voice+vision+bus into one moment
The nucleus holds a **binding window B ≈ 900ms**. Afferent events inside B that are referentially linked (co-temporal voice+frame, or sharing a `concept_token`) fuse into one `moment{moment_id, modalities[], spotlight, context[]}`. **Winner-take-all:** highest-S event is the spotlight; the rest attach as bound context. "He says *'wait, why does attention scale like this'* while a softmax diagram is on screen and an FSRS card on that exact concept just went due" = **one moment**, not three. **The broadcast IS the write:** thalamus writes the bound moment to `workspace.json` atomically, version-stamped; every region subscribes by watching the version bump. That shared file is the global-workspace substrate the organism currently lacks.

### 4.6 The async arc — the deep answer flows into the live talk
1. TIER-2 fires → thalamus writes `wake.json {moment_id, spotlight, bound_context, deadline_ms}`.
2. `cortex.mjs` (watching) spawns `claude -p --model opus` **extended thinking**, feeding the bound moment + relevant bus slice (twin, slip, learning_state, the capsule). POSTs answer to `:4113/deep-answer`; thalamus folds it into `workspace.json.deep`.
3. Meanwhile the reflex gave a **holding token** in the Gaffer's voice ("*ruko — isko theek se sochta hoon*"). At its next turn boundary the Dugout reads `workspace.json`, sees a `deep` answer for the live `moment_id`, and **injects it via `realtimeInput.text`** (the scar-table-verified runtime path) so Charon speaks Opus's reasoning *in the Gaffer's voice, mid-conversation.* (Note: `3.1-flash-live` is sequential-only on function calls — the async defer happens out-of-band through the thalamus + session resumption keeps the socket alive across the ~10-20s Opus round-trip.)

### 4.7 Selftest bar (unrun = hypothesis)
`thalamus.mjs selftest` must assert deterministically with injected afferents: (1) a low-`p` Twin event outscores a predicted one; (2) a repeated event is refractory-suppressed (no double-wake); (3) `τ1_effective` rises as `window_headroom_frac`→0; (4) a voice+frame+bus triple inside B fuses to one `moment_id`; (5) prosody/emotion fields are ignored; (6) the ambiguous band calls the tiny model at most once. Then a live smoke: a genuine surprise reaching `wake.json`, the answer landing in `workspace.json.deep`.

---

## 5. THE SEVEN TANKS — seven parallel minds, each a DIFFERENT model

**The technical jewel:** the marquee senses are **mutually exclusive on one model.** The seeing/teaching Gaffer (`3.1-flash-live`) *cannot* do affective/proactive audio or `NON_BLOCKING` async calls — those are `gemini-2.5-flash-native-audio` + `v1alpha` only. On one socket you get one or the other. **Rate limits are per-PROJECT** (not per-key), so 7 accounts = 7 independent quota pools, each running a *different model simultaneously.* Mutual exclusion dissolves into division of labor.

| Tank | Account | Region | Model | Job |
|---|---|---|---|---|
| **T1 Gaffer** | free key | language/mouth | `3.1-flash-live` (Charon) | voice + **code execution** + **search grounding** + thinking. The only mouth. |
| **T2 Watcher** | free key | vision | `3.1-flash-live` vision-only | continuous screen/paper → fires `spinning`/`stuck-30s`/`wrong-answer-forming` at the thalamus. Never speaks. |
| **T3 Cochlea** | free key | affective ears | `2.5-native-audio` v1alpha, affective ON, modalities muted | hears tone/stress, continuous-transcribes → **affect firewall** (§5.1). |
| **T4 Bridge/Deep** | (routes to `cortex.mjs`/Opus) | prefrontal | Opus 4.8 extended | the deep judgment, woken by the thalamus. |
| **T5 Scout** | **Pro account** | research | Gemini 3.x Pro, 1M ctx | Deep Research, whole-season/repo synthesis, NotebookLM, out-of-band. |
| **T6 Hippocampus** | free key | memory | `gemini-embedding-001` | embed/recall (already partly real, `dugout.mjs:279`). |
| **T7 DMN / failover** | **Pro account** | default-mode | Gemini Pro / any | dreams when he's away (§6.3); absorbs any tank that trips so the conversation never dies. |

**Concurrency is real:** T1 talks *while* T2 watches the same screen *while* T3 hears the sigh *while* T7 pre-drafts — four sockets on four accounts, gated by one thalamus. Needs a **per-tank credential/project router** (the key-list exists; the router does not).

### 5.1 EARS at ceiling — the Cochlea + the AFFECT FIREWALL
Native-audio affective dialog hears tone/stress. **The law forces a firewall:** a new `affectFirewall()` in `thalamus.mjs` converts "sounds flat/strained" into *at most* a timing/softening hint for the mouth ("offer the floor-touch now, gently") and then **discards it.** It is structurally forbidden from writing any `.json` the Governor/Twin/genome read. Affect can change *when* and *how warmly* the Gaffer speaks — **never a number.** Declared-surface only: attaches to the *same* getUserMedia session he already opens — never a new ambient mic.

### 5.2 MOUTH at ceiling — three organs the Gaffer is missing
- **THE CHALKBOARD — code execution** (`{codeExecution:{}}` in the tools array, `dugout.mjs:564`): the Gaffer **runs Python live** to *prove* an answer or execute his own code mid-drill and read the real output. For an AI-PE candidate this is the single highest-signal capability — "don't trust me, watch it run." Wire into the scrimmage; reps flow to `scorer.mjs` like any market. Grades the **code, never the coder** — win-only on the result, miss resolves silently into FSRS weight.
- **THE SCOUT'S EARPIECE — search grounding** (`{googleSearch:{}}`): current real-world facts mid-sentence with citations. **Firewalled to factual queries only — never his private state** (no personal string ever enters a search query).
- **Thinking before speech** — set `thinkingLevel` on 3.1, gated by turn difficulty via the thalamus (not globally — latency).

### 5.3 EYES at ceiling — the Watcher tank + the video-cap dodge
A second `3.1-flash-live` session doing **nothing but vision**, streaming his declared screen/paper continuously, forming its own running observations (never pausing when the talk pauses). **Why it's legal on quota:** true audio+video is capped at **2 minutes** (video ~258 tok/s). The Watcher uses **frame-mode** — discrete `realtimeInput.video{jpeg}` chunks on an *audio-context* session (the shape `dugout.mjs:644` already proved) at 1 frame/1-2s — billed as audio (~25 tok/s), lives to the 15-min cap, then resumes. **Frame-mode is the whole reason continuous eyes are affordable.**

### 5.4 The two Live-session must-builds
Both currently absent and hard-capping every session at ~10-15 min: **session resumption** (tokens valid ~2h) + **context-window compression** (sliding window, e.g. trigger 25k/keep 8k). Everything "while you work" and the async arc depend on these.

---

## 6. MEMORY — the five-layer hippocampus (answers "will memory be contained?")

**Yes — because containment is not the session's job.** The live window is deliberately lossy (sliding-window "compression amnesia" — a preference stated 40 min in is blurred by minute 90). The durable brain lives in a new gitignored `dressing-room/hippocampus/` dir, written *outside* the session. The session forgets freely; the organ remembers.

| Layer | What | Status | The missing organ |
|---|---|---|---|
| **L0 Working** | the live Live-API session | exists, lossy | **The Rehydrator** — on handle-rotation/reload, prepend a non-spoken cartridge: last-N durable episodes + all identity facts + today's `who_he_is`. Generalizes `loadDayCartridge()` to mid-session. |
| **L1 Instant episodic** | salient moments written the MOMENT they happen | partial (`recall_index.jsonl` but BATCH) | **The Scribe** — a live `mark_moment(kind, text)` async tool (`kind∈{doubt,win,preference,thread}`); handler appends to `hippocampus/episodes.jsonl` + embeds on the dedicated Hippocampus key. Async → no audio stall. |
| **L2 Durable facts** | "remember I…" → always injected | not built | **The Ledger of Self** — `hippocampus/identity_facts.json`; `remember(fact)`/`forget(id)` tools (captain-gated, surfaced not silent); `buildSystemInstruction()` unconditionally injects the (tiny) full ledger every session. Distinct from episodes: facts are *always present*, episodes are *searched*. |
| **L3 Consolidation** | nightly "who he is right now" | exists shallow (`day_cartridge` + `buildFingerprint` = a config collage) | **The Consolidator** — nightly on **Gemini 1M (Pro, free)** → `hippocampus/who_he_is.json` (~1-2KB: `fingerprint`, `open_threads`, `recent_wins/cracks`, `voice_tuning`, `do_not`). Loads at the TOP of every session so it opens KNOWING him. Opus-extended reserved for the rare night the 1M lane flags a contradiction. Prosody NEVER enters it. |
| **L4 Proactive recall** | memory surfaces when the topic does | not built (recall is pull-only) | **The Thalamic Recall Reflex** — per-turn: embed the turn → cosine vs `episodes.jsonl` + `who_he_is.open_threads` → if ≥0.55 inject an ephemeral non-spoken hint; the Gaffer weaves it only if it earns the turn (win-only, never "as you said Tuesday…" theatre). This IS the salience gate deciding when the Scribe fires. |

**The real ceiling to name — the vector store doesn't scale.** `recall_index.jsonl` is a flat file, linear-scanned per query — fine at a few thousand, slow at ~50-100k (a year of talk), and there's no forgetting so noise accumulates. **Fix (dependency-free, no external vector DB — that would break the local-only law):** nightly, (a) **shard episodes by month** + a curated "greatest-hits" hot shard; (b) **prune/merge** near-duplicates and drop low-salience old ones via an FSRS-style decay applied to memory itself — **biological forgetting, the feature not the bug**; (c) keep the hot working set in one small file. Recall stays O(recent).

**Continuity — the three survival paths:** page-reload → resumption restores the compressed window + Rehydrator re-states detail = zero felt loss. New day → `who_he_is` + `identity_facts` load at kickoff = opens knowing him. Long continuous talk → compression evicts freely because L1 already captured the salient bits; the thalamus re-fetches on demand. **Cost:** embeddings free (dedicated tank), consolidation on Gemini 1M (free), search = local cosine (zero network), storage = gitignored JSONL. Inside the ceiling by construction. **Layering, not replacement:** `recall_index.jsonl`/`indexRecall()` stay verbatim as the batch back-fill floor; the Scribe/Reflex are the live layer on top.

---

## 7. THE EMERGENT CROWN — capabilities impossible on the old substrate

Each is impossible on the current serial/single-brain/cron substrate and trivial once you have parallel regions + a thalamus + a DMN + the two-speed brain.

- **(a) THE DEFAULT MODE NETWORK — `dmn.mjs` ("The Rest Room").** Fires **during the day, when the captain is AWAY** (ActivityWatch `away` signal), using idle free tanks as scratch cortex. Pulls the Twin's weak-point vector (worst FSRS retrievability × lowest-confidence markets) and runs a **Monte-Carlo interview simulation** — 20-40 rollouts fanned across parallel regions, each a different interviewer persona, probing exactly his soft concepts. Scores where the simulated candidate stalls, and for each predicted stall **pre-drafts the exact 15-second reframe + next drill** into `dmn_precache.json`. Output is INERT — it only loads ammunition; it never fires. Dreams only about his REAL weak points from real reps (never fabricated). May only spend a tank's measured headroom (`ceiling − used − reserve`) — converts use-it-or-lose-it free quota into consolidation; blast radius $0.
- **(e) PREDICTIVE PRESENCE — the fusion (DMN × Thalamus × Twin).** THE most transformative capability. The Twin flags a **stall-signature forming** (telemetry matches the leading edge of a pattern that historically precedes abandonment — tab-thrash + long dwell, the touchline's stuck-spinning). The thalamus queries `dmn_precache.json` — and the Rest Room **already drafted the intervention hours ago.** So the whisper is **instant, zero model latency** — it lands in the 3-second window where it can still catch him, instead of 20 seconds later when he's gone. **ADHD-PI doesn't fail from not-knowing; it fails in the gap between "stuck" and "gone." This is the only mechanism that closes that gap to zero.** Still passes the earned-voice gate + RED clamp + win-only framing ("you were about to crack this, here's the handhold" — never "about to fail again").
- **(b) THE COUNCIL — `council.mjs` ("The Back Room").** When the reflex hits the Bridge, instead of one Opus call, fan the question to **three cheap regions in parallel with adversarial framings** — Steelman (best case), Prosecutor (hardest attack), Captain's-Own-Voice (how HE'd defend it, seeded from his FORGE capsules) — then their three drafts become context for **one** Opus-extended *integration* call that adjudicates. Cheap parallel breadth, expensive serial judgment. If the three split hard, the *disagreement itself* is shown as signal.
- **(c/d) THE LIVE EXAMINER — `examiner.mjs` (extends `nemesis.mjs`).** Code execution (§5.2) in the scrimmage → runs his code live against hidden tests. Reflex executes (fast/free), deep judges architecture. The build-it-live-under-a-stranger's-gaze rehearsal = highest-transfer drill for an AI-PE interview.
- **(f) THE LIVING DOSSIER — `dossier.json`.** A running belief-state updated INTRA-DAY by the thalamus from every salience event (a stall, a nailed drill, a fast recovery) — a live Bayesian posterior over the Twin's priors. Every region reads it. Medical clamp absolute: the intra-day capacity nudge can only ever *lower* demand, never raise RED→green; prosody never enters; local + gitignored.

**The 3 most transformative for an ADHD-PI interview candidate:** (1) Predictive Presence (closes the stuck→gone gap), (2) The Rest Room (manufactures the reps he can't self-initiate), (3) The Live Examiner (rehearses the exact build-live stressor).

---

## 8. THE ECONOMY + NEUROMODULATION (how it stays cheap, light, law-clean)

- **Two currencies, never mixed:** Gemini tokens (abundant, free, per-account-per-day rate-limited) vs Opus judgment (scarce — the Max 5h rolling window + weekly cap that `brain.mjs` already models). The thalamus is the exchange desk.
- **`scripts/fuelboard.mjs` → `dressing-room/state/tanks.json`** — the account-allocation ledger making "7 parallel regions" real. Per tank: `region` (pinned), `quota_est`/`quota_used_today` (measured, reset on the account's local-midnight), `observed_ceiling` (**inherits the exact starvation-guard: `Math.max(est, observed)`** — a 429 at low usage must not strand a region at ceiling=1), `state (HOT|WARM|COLD|DEAD)`. `pickTank(region, state)` prefers the pinned tank, borrows T7 then any idle HOT — **never borrows T1/T2 mid-conversation** (user-visible stall). The **fuel gauge** (7 bars in the Dugout) = the organism's interoception.
- **Neuromodulation — `scripts/tone.mjs` → `tone.json`** — one scalar `arousal ∈ {conserve, nominal, open}` derived ONLY from the already-computed Governor verdict (never biometrics directly — clamp). Every organ reads it as a multiplier. RED (`conserve`): dampens the reflex (shorter turns, lower frame rate), **mutes the DMN** (no dreaming — a depleted captain rests), **raises the thalamus escalation threshold** (conserve the window). GREEN (`open`): the inverse. One knob, whole-brain effect — that's what makes it neuromodulation. Stale Governor → default `nominal`, not `open` (fail toward conserve).
- **Degradation guards:** a tank dies → failover to T7. All free tanks cold → drop vision → drop to text → **hard stop before touching Opus for reflex** (a quota outage must never silently drain the Max window). Opus unavailable → route the escalation to Gemini Pro 1M with `provenance:gemini-fallback` marked on the bus (never drop it silently). DMN runaway → bounded to $0 + drafts-only by construction.
- **Add a `naive_shadow` counter** to the ledger: token-count each turn to estimate "what this would have cost on Opus," so the fuel gauge shows the captain the real multiplier the thalamus saves (`count_tokens` is free).

---

## 9. THE KENNEL — the night-shift body (§2's build detail)

- **`scripts/groundsman.mjs`** on a Pi Zero 2 W (or dead Android + Termux): loop → `git pull` the bus → `brain.mjs tick` → `git push` **public-safe outputs only** → private state on an encrypted local volume never pushed.
- **`dressing-room/state/bus_lease.json`** — the single-writer law across two nodes. Heartbeat lease: laptop present → laptop holds it, Kennel idles; laptop dark > TTL → Kennel takes it and drains the overnight queue. **Load-bearing** — without it, laptop + Pi double-write the ledger and corrupt the self-tuning budget. Add a `host_id`/lease field to `brain_config.json`.
- **THE AWAY-DAY RUNNER** — a GitHub Actions cron on the PUBLIC repo for genuinely public-safe deterministic chores only (selftest CI, `repo_bundle.mjs`, wall regen). Guard with a **`public_safe:true` manifest flag per job** — the workflow REFUSES any job lacking it, so nothing touching biometrics/transcripts can ever leak into a cloud runner. A CI lane, NOT a home for the brain (Actions can't hold a long-lived Claude OAuth session).
- **Smoke-test first:** `claude -p` under tmux on the Pi for 48h — verify headless OAuth persistence before trusting the Kennel with the window. Fallback: Kennel runs only deterministic organs + git bus (no LLM auth needed).

---

## 10. THE BUILD ORDER (the mutation path — each unit: selftest + real-run + commit)

Dependency-driven. The thalamus is the spine; memory and tanks hang off it.

- **M0 — Live-session must-builds** (unblocks everything "while you work"): session resumption + context-window compression in `dugout.mjs`. *(Small, isolated, do first.)*
- **M1 — THE THALAMUS** (`thalamus.mjs` + `cortex.mjs` + config + the 4 state files). The keystone. §4. Selftest bar in §4.7. Wire the afferent POST from `dugout.mjs`; wire the async arc back.
- **M2 — MEMORY the live layer** — the Scribe (`mark_moment`), the Ledger of Self (`remember`/`forget` + unconditional inject), the Rehydrator, the Thalamic Recall Reflex, the Consolidator (`who_he_is.json` on Gemini 1M). §6.
- **M3 — THE TANKS as parallel regions** — `fuelboard.mjs` + `tanks.json` (port the starvation-guard) + the per-tank project router. Split the Watcher (T2) and Cochlea (T3) into their own sockets with the affect firewall. §5, §8.
- **M4 — THE MOUTH ceiling** — code execution (the Chalkboard, into the scrimmage/`examiner.mjs`) + search grounding (firewalled) + `thinkingLevel`. §5.2.
- **M5 — NEUROMODULATION** — `tone.mjs` + `tone.json`, wired into reflex verbosity, the DMN gate, and the thalamus threshold. §8.
- **M6 — THE DEFAULT MODE NETWORK** — `dmn.mjs` (the Rest Room: away-signal → interview simulation → `dmn_precache.json`). §7a.
- **M7 — PREDICTIVE PRESENCE** — the wiring of Twin stall-signature × thalamus × precache, through the earned-voice gate. §7e. The crown.
- **M8 — THE COUNCIL** (`council.mjs`) + **the LIVING DOSSIER** (`dossier.json`). §7b, §7f.
- **M9 — THE KENNEL** — smoke-test the Pi OAuth first, then `groundsman.mjs` + `bus_lease.json` + the Away-Day Runner. §9. *(Can run in parallel with the above — it's the body, not the brain.)*
- **M10 — memory scaling** — month-sharding + prune/merge + the forgetting curve, once the store is real. §6.

---

## 11. THE LAWS THIS EVOLUTION OBEYS (inherited, none weakened)
No metered API key ever (`cortex.mjs` = `claude -p` Max; regions = free Gemini pool — the thalamus's job is literally to *protect* the ceiling). Personal data local + gitignored (afferent, frames-as-hashes, hippocampus, dossier — the public repo holds the *machinery*, never the moments). No ambient mic (the voice nerve carries only turns Dugout already captures). Medical clamp absolute (Governor read-only into GOV; biometrics weight attention never drive a verdict; prosody excluded from every score by construction; RED = doctor-referral). Humane clamp / earned proactivity (the gate deciding a moment is salient does NOT grant it a voice — outbound speech still passes `shadow.mjs`'s ratify gate + win-only voicing; the thalamus decides *what gets thought about*, never *what gets said*). AI proposes · code validates · human approves (the DMN/Council/Consolidator all emit drafts on the bus; nothing auto-acts). Layering never replace (every new organ sits on top of the proven code — `embedTexts`, `cosine`, `execRecall`, `loadDayCartridge`, `buildSystemInstruction`, the budget accounting — none rewritten).

---

## 12. HONEST RISKS (unrun = hypothesis)
- **Preview churn** — `native-audio-preview-12-2025`, `3.1-flash-live-preview`, `v1alpha` affective/proactive are all preview surfaces; IDs/features shift (this session already logged `text-embedding-004` → 404). **Every tank's model behind a pref** (as `dugout_prefs.json` already does) so a killed preview swaps without a rewrite.
- **Free-tier per-project TPM/RPM is modest** — the 1000-concurrent/4M-TPM numbers are Vertex/Firebase, NOT the Developer-API free tier. One tank ≈ one conversation's budget, not infinite — which is *why* 7 projects matter; T7 is the shock absorber.
- **Pi Claude OAuth longevity unverified** — smoke-test 48h before trusting the night-shift (§9).
- **Flat-file memory won't scale to a year** — M10 (sharding + forgetting) before the store grows large.
- **The whole thing is a hypothesis until it runs** — build in §10 order, selftest + real-run each, exactly as the U-series and E2E pass did.

---

*The organism already owns the neuromodulation (Governor), the prediction (Twin), the sleep-consolidation (digest), and the plasticity (genome). This evolution adds the three things it lacks — **parallel regions, a thalamus, and a default-mode network** — and wires the two-speed relay. That is the line between a batch pipeline and a mind. Build the keystone first. It proposes. You decide. COYG.* ⚪🔴
