# WORKING MEMORY ARCHITECTURE — the Ambient Cyborg Brain

> Build spec. Produced from a 6-lens design panel (memory · real-time cognition · capture ·
> ADHD augmentation · orchestration · integration) + adversarial critique + synthesis.
> Goal: the Gaffer + the Claude brain **see me everywhere, remember everything, think about
> me 24/7** across every surface — so the machine carries the memory/context/analysis load
> and Nikhil just learns and codes. Everything here **layers on** the existing organism; it
> replaces nothing.

## The four laws (any design that breaks these is disqualified)
1. **Single writer per file.** `thalamus.mjs` owns `afferent.jsonl` + `workspace.json`. Every new organ gets its **own** file; it never co-writes an existing one.
2. **One budget meter.** Every Claude call routes through `brain.mjs headroom()` against the one ledger, with a **live-headroom reserve** so background thinking can NEVER throttle a live turn.
3. **Async never blocks the voice.** Deep/Opus work is async and folds in at a quiet beat; the live turn only touches millisecond retrieval.
4. **Proposes, never auto-acts on canon** (`who_he_is`, drills, capsules, medical/Goalkeeper). Human approves. The medical boundary is sacred.

---

## THE CEILING (the honest answer to "is this the top?")

**Yes — there is a materially higher ceiling than a safe design.** The true maximum: an always-on, *paced*, multi-surface brain where every room (Code, Desktop, Gaffer, ambient ActivityWatch) writes through the one thalamus door; a **free** continuous distiller holds his 4 working-memory slots externally; and the **never-fired Opus cortex finally ignites** — thinking about him around the clock and pouring the whole 5x plan into deep reads every night, while a measured live-reserve guarantees it can never slow a live turn.

**But the ceiling is a CONTROLLER, not a firehose.** One always-on Opus extended-thinking stream drains an ~800k window in under an hour — literal 24/7 Opus is *impossible* on the Max plan and would be the *wrong* design even if it were free. So:
- **Haiku** carries the always-on continuous layer (~1% of Opus cost).
- **Sonnet** carries the every-few-minutes synthesis.
- **Opus** is reserved for genuine doubts + the overnight flood.
- **Gemini-flash (free)** carries the distiller + dreamer at zero Max cost.
- One **governor** pins it all to a target burn rate.

The real wall sits in four honest places no architecture removes:
1. **Claude Desktop has no hook API** → its capture is model-mediated (an MCP tool the model chooses to call) + the clipboard turnstile as the deterministic backstop. This is his *primary* study room and its capture is structurally softer than Code's.
2. **claude.ai / Colab passive capture** needs a DOM-brittle browser extension he must install and keep enabled — aspirational, not day-one.
3. The **800k/window, 12M/week caps are Anthropic-unpublished estimates** — the machine must LEARN the real ceiling by probing at 3am.
4. **No pixel sight** — ActivityWatch is metadata, not pixels; anything he reads silently on screen stays invisible unless a nerve reports it.

Within those four walls, this design **is** the ceiling.

---

## THE SPINE (unchanged, sacred)
`thalamus.mjs` (:4113) stays the SOLE writer of `afferent.jsonl` + `workspace.json` and the single `POST /afferent` door every nerve calls. `brain.mjs` stays the ONE budget meter via `headroom()`. Nothing below co-writes an existing file. The affect firewall + verbatim/gut-word laws apply at every **new** door, not just the voice door.

## Layer 1 — Universal capture (every surface → an afferent source, zero tap)
- **Claude Code (crown jewel — the only surface with deterministic hooks).** New checked-in `.claude/settings.json` hooks: `SessionStart` injects the rehydrate cartridge + working_set; `UserPromptSubmit` injects a timeboxed (~200ms, skip-on-timeout) recall hint; `Stop`/`PostToolUse` fire-and-forget POST the turn to `:4113` (modality `code`/`tool`). Each shells a tiny `hooks/afferent-post.mjs` with a hard ~200-300ms timeout that fails silently if `:4113` is down — a dead daemon never taxes a live CLI turn. **Scrub text before any git op** (repo is PUBLIC).
- **Claude Desktop (primary study room — the honest floor, no hooks).** A `scribe` MCP tool the model calls at each concept-close + a strong project instruction (modality `desktop-study`). **Backstop:** existing `turnstile.mjs` clipboard path (copy = captured). Model-mediated = softer than Code.
- **ActivityWatch → `context.mjs`.** Graduates `presence.mjs` from stall-only to **delta-only ambient context** (app/title/URL on CHANGE, ~60s floor) → `:4113` modality `context`, so every bound moment carries what-app/what-concept.
- **Colab.** Existing clipboard turnstile + `paste-session` skill — copy is the whole move.
- **claude.ai web (aspirational).** A `MutationObserver` browser extension → `:4113` modality `web`. Read-only, DOM-brittle. **Cut for day-one.**

## Layer 2 — Working memory (the ADHD-tax remover)
`distiller.mjs` — new daemon, SOLE writer of a new `working_set.json`, reads `afferent.jsonl` + `workspace.json` **read-only**, runs the **free Gemini-flash pool** (registered as an 8th tank in `fuelboard.mjs` so it can't starve embed/dugout/dmn). Every ~5 min / N events it maintains a ~1KB externalized **4-slot whiteboard**: *concept-in-motion · open-loop · where-he-left-off · next-obvious-step.* Zero Max budget. **This file re-hydrates him after any context switch.**

## Layer 3 — Shared retrieval + injection
`organism-memory` MCP (`scripts/mcp-memory.mjs`) registered in BOTH `.mcp.json` and Claude Desktop's own config. Tools: `recall(query)`, `note(kind,text)`, `get_context()` (= `buildRehydrateCartridge()` + working_set), `remember_fact()`. Writes route THROUGH `POST :4113/afferent` (thalamus stays sole writer). `remember_fact` **stages** to a new `identity_facts.pending.jsonl` and needs a separate human confirm (Law 4). `recallReflex` is promoted from a Gaffer-internal function to a **shared** `recall()` over ONE cosine surface merging `episodes.jsonl` + `recall_index.jsonl` at read time.

## Layer 4 — Continuous paced cognition (fires the never-fired cortex)
The 15-30min cron becomes a resident pacer **folded into `brain.mjs`** (`brain.mjs --daemon`, 60-90s poll) — NOT a separate scheduler. It computes `target_burn = remaining_headroom / time_to_window_edge` and dispatches:
- **Haiku PULSE** (60-90s, engaged-mode only, hard daily cap, metered every pulse): semantic watch of the afferent tail above thalamus's deterministic salience; escalate/hold.
- **Sonnet SYNTHESIS** (every few min): folds recent work into a live session-read; keeps `day_cartridge` + `working_set` current in real time.
- **Opus DEEP-READ** = existing `cortex.mjs` (:4112), fired on genuine `tau1` doubts + flooded overnight.

The pacer **never writes `wake_queue`** — it only POSTs afferent and lets the thalamus decide+enqueue, so there's exactly one scheduling authority and one wake writer.

## Layer 5 — The governor (pinning the 5x plan)
- `reserveNow()` replaces the static `day_reserve_frac=0.25` with a **measured live reserve** (AW window-title + AFK + per-surface heartbeat files). While live: `background_allowed = cap − used − live_reserve` (Law 3 by construction). Idle: reserve collapses to ~0 and the pacer floods to the 95% overnight target.
- **Overnight ceiling-probe (EWMA):** replaces the one-way `Math.max` ratchet with an EWMA that deliberately probes the knee at 3am (a lockout there is free); learns the true `observed_window_ceiling`; probe cutoff ~05:30 so any CLI backoff clears before the 07:30 study window.
- `maxThinkingFor(mode, headroom)`: scales `MAX_THINKING_TOKENS` — **16k live / 32-60k overnight** — AND derives cortex's `min_headroom_tokens` from that budget (not the flat 50000) so the deepest reads can't overshoot the meter.

## Layer 6 — Overnight deepening
`dmn.mjs` stays the **cheap Gemini dreamer** (grafting raw Opus onto it would create a second unmetered spend path — a Law 2 breach). Concept-graph synthesis into a new `concept_graph.json` routes through cortex via a NEW `consolidation` wake type enqueued by the thalamus — keeping exactly ONE Opus spend path. dmn's away-gate (never dream over his shoulder) is preserved.

---

## The cognition engine (model ladder + governor)
| Rung | Model | Cadence | Role | Cost |
|---|---|---|---|---|
| Pulse | **Haiku** | 60-90s (engaged only) | semantic watch above salience; escalate/hold | ~1% of Opus |
| Synthesis | **Sonnet** | every few min | live session-read; keep working_set/cartridge current | moderate |
| Deep read | **Opus** (cortex :4112) | on `tau1` doubt + overnight flood | extended thinking 16k live / 32-60k night | high, gated |
| Distiller + dreamer | **Gemini-flash** (free) | ~5 min / hourly | working_set + overnight rollouts | **zero Max** |

**Net:** Haiku thinks about him all day at ~1% cost, Sonnet keeps his working-set live, and every night the pacer pours the entire remaining plan into deep Opus reads + dmn rollouts (two overlapping 5h windows across the 9.5h night → ~1.5M tokens/night) — while the live reserve keeps his live turns untouched. **Gemini Live carries all voice for free, so ~100% of Max stays available for Claude cognition; the two never compete for the same meter.**

---

## What the ADHD tax removal actually buys
- **Externalized working memory** — `working_set.json` holds his 4 slots continuously, on the free pool. His prefrontal cortex never carries context across an app-switch again. *The single biggest ADHD-PI tax, lifted for zero Max budget.*
- **Zero capture tax on every surface** — type = captured (Code hooks), copy = captured (turnstile), study = captured (scribe MCP + `/forge`), ambient = captured (context.mjs). He never runs a log command again.
- **No re-explaining across rooms** — a doubt raised by voice is present when he opens Code; a Desktop confusion resurfaces in the Gaffer.
- **Context-switch recovery** — after a stall or surface change, `get_context()` / SessionStart re-serves exactly where he was ("you were mid-thought on kv-cache in this doc"). Re-entry is a read, not a decision.
- **No budget anxiety** — lockouts only ever happen at 3am while he sleeps.
- **Proactive escalation without a decision** — the Haiku pulse decides FOR him whether a moment deserves a deep read.
- **Calibration guard** — full turns (with gut-word) are captured, not just the clean reps he chooses to log, so the record reflects his real confusion.
- **Nothing to manage** — pacer, reserve, ceiling-hunt, thinking-depth all self-tune. Zero executive-function load.

---

## Phased build (each phase proven green before the next — CLAUDE.md law)
- **Phase 0 — Governor hardening** (cheap, high-value, no new spend path). `reserveNow()` + `maxThinkingFor()` + cortex `min_headroom_tokens` fix + overnight ceiling-probe EWMA (05:30 cutoff). All additive to `brain.mjs headroom()`, self-tests stay green. **Ship first.**
  - *touches:* `scripts/brain.mjs` (headroom, self_tune ~463-490), `scripts/cortex.mjs` (env 100/122, gate 173), per-surface heartbeat files.
- **Phase 1 — Working memory + Code capture (the ADHD-tax core).** `distiller.mjs` (sole writer `working_set.json`, free pool, 8th fuelboard tank) + net-new `.claude/settings.json` Code hooks (capture + injection, fail-silent, scrub-before-git).
  - *touches:* `scripts/distiller.mjs` (new), `working_set.json` (new), `.claude/settings.json` (new), `hooks/afferent-post.mjs` (new), `scripts/fuelboard.mjs`.
- **Phase 2 — Shared retrieval + Desktop bridge.** `organism-memory` MCP (recall/note/get_context/remember_fact→staged) in `.mcp.json` + Desktop config; scribe tools routing reps through `capture.mjs`; shared `recall()` over merged index.
  - *touches:* `scripts/mcp-memory.mjs` (new), `scribe_log.jsonl` (new), `identity_facts.pending.jsonl` (new), `.mcp.json`, Desktop config (outside repo), `scripts/hippocampus.mjs`, project instructions.
- **Phase 3 — Ignite the deep brain.** `brain.mjs --daemon` pacemaker + `context.mjs` ambient bridge → the never-fired cortex gets a real multi-surface river and FIRES. Verify a real `tau1` wake enqueues and cortex serves it.
  - *touches:* `scripts/brain.mjs` (--daemon), `scripts/context.mjs` (new), `scripts/thalamus.mjs` (unchanged), `scripts/cortex.mjs` (confirm fires).
- **Phase 4 — Haiku pulse (measured, not assumed).** `haiku_pulse` job, hard daily cap, metered every pulse. Prototype + measure real per-call CLI cost for several days before trusting "continuous". **The single most fragile piece.**
  - *touches:* `scripts/brain.mjs`, `brain_ledger.jsonl`.
- **Phase 5 — Overnight deepening + reboot-proofing.** `concept_graph.json` via a cortex `consolidation` wake (ONE Opus path); register `distiller`/`context`/`brain --daemon` reboot-proof.
  - *touches:* `scripts/cortex.mjs`, `concept_graph.json` (new), `scripts/dmn.mjs`, scheduled-tasks.
- **Phase 6 — Aspirational web capture** (only if he actually studies on claude.ai). MutationObserver extension, self-test-guarded.

---

## Honest limits (read before building)
- **Claude Desktop has no hook API** — his primary study room's capture is model-mediated or clipboard only. No deterministic passive full-transcript path. Code (hooks) is the ONLY surface with guaranteed capture.
- **"Continuous" ≠ nonstop Opus** — physics wall. Paced controller, not firehose.
- **The plan caps are unpublished estimates** — until several nights of probing, daytime spend stays conservative; running hot will surface the real Max-5x limits faster than any docs.
- **`haiku_pulse` "cheap enough to be continuous" is asserted, not derived** — each `claude -p` call carries real CLI overhead; at 60-90s it could run 500k-1M+ tokens/day and cannibalize the overnight Opus budget. **Hard-cap + meter from day one; measure before trusting.**
- **No pixel sight** — AW is metadata only; silent on-screen reading stays invisible. computer-use/OCR is out of scope (battery/CPU/privacy/brittle).
- **Privacy surface widens** — full-turn FinOps capture may include client data; cross-surface capture co-occurs with biometric/medication context. Repo is PUBLIC → `afferent.jsonl`, `scribe_log.jsonl`, `working_set.json`, `identity_facts.pending.jsonl` stay gitignored + local; hook text scrubbed before commit; affect firewall + verbatim law at every new door.
- **Proposal volume grows** — nothing auto-writes canon (Law 4 holds), but the batch-glance review ritual must scale with it. `remember_fact` stages to `identity_facts.pending.jsonl` pending his confirm. Goalkeeper medical boundary untouched.
- **Embeddings depend on the free Gemini pool** — a lane-dry outage means new moments land without vectors (swept later) and real-time recall degrades to lexical during the outage.
