⚪🔴 ARSENAL AI FC — THE MASTERPLAN
Canonical single source of truth for the entire dual-engine AI agent squad. Version 2.1 · 10 Jul 2026 (v2.0 bake: 09 Jul 2026) · Captain & #14: Nikhil (GitHub: nikhil1429) This file replaces the need to re-explain the system in any future thread. If a thread gets heavy, point the next thread at THIS file + the live script state. v2.0 supersedes v1.0 — it bakes the two design doors that were open (the Pep×Arteta two-brain coach + the recalibrated Governor) and reconciles all file-drift. The Manager's aatma + charter live in two companion files: THE_MANAGER__Master_Prompt.md (the brain) and THE_GAFFER.md (the voice). Read those for the Manager build; read THIS for the whole system.

⚠️ FACTUAL REPAIR PASS — 10 Aug 2026 (no design change; CODE IS THE TRUTH, PROSE IS ONLY A CLAIM)
This document's DESIGN is untouched. Its STATUS claims were a month stale and had begun to
mis-plan sessions: §16 was frozen at 09 Jul 2026 and §20 still ordered a fresh thread to BUILD
the Goalkeeper recalibration and the Manager M-1→M-5 — both of which have been live for weeks —
and to read a `constitution.md` that has never existed in this repo. Every correction below is
annotated inline with its evidence and the claim it replaces; nothing was silently overwritten,
nothing was shortened. THE RULE APPLIED THROUGHOUT: where this file and the live code disagreed,
the code won. Counts and statuses that rot on the next run have been replaced with the command
that reads them live — never trust a number written in prose here, including a corrected one.
The one thing this pass could NOT settle is flagged in §16 as NOT VERIFIED, not asserted.

⚠️ v2 — WHAT CHANGED FROM v1 (and why) — read this first
v1.0 was a complete, design-locked plan. Then two doors reopened, were researched, settled, and are now baked here. Nothing valid in v1 is dropped — this is v1 + the deltas + drift-reconciliation.

v2.1 (10 Jul 2026 — word-by-word audit fixes, no design change): a fresh thread audited all four canon files against the full conversation history and web-verified the load-bearing canon — 2025/26 title, best defence, Manager of the Season, Budapest 4-3 pens, Gabriel over the bar, the 226-games European stat, and Pep's May-2026 Joe Hart farewell confession — all confirmed. Restored small v1 drops: hostname + 9am–9pm / ~10pm–8am windows (§1, §6), the legacy ArsenalFC-Goalkeeper task name (§16), and the Hart confession added to quote-hygiene (§4). Companion fixes live in THE_MANAGER v2.1 (§7.5 voice restored) + THE_GAFFER v2.1 (anchor-wording + Hart canon row).

THE TWO-BRAIN COACH + THE ANCHOR-FIX (the Manager, §4 + §8). v1's Manager was "Arteta" (single-brain). v2: the Manager is two complete game+human managers fused into one coach — Pep-brain and Arteta-brain. The old "Pep = the game, Arteta = the human" split is DEAD/WRONG. Both read game AND human; the difference is ANCHOR when the two clash, not domain. Arteta is elite on the game too (broke the 22-year drought, best defence, mastered positional play). (Captain corrected this twice; both corrections are law.) Full detail in the two soul files; summary in §4 + §8 (#1).
THE FORMATION-READ (new daily discipline, §6 + §8). Before every team-sheet the Manager reads the squad as a shape, not a list of signals — three positional-play questions (weak handoff / out of position / free man) — then outputs one sheet. This is what turns "a bag of agents" into "a team."
THE LEARNING↔EXECUTION MERGE + THE CLOSED LOOP (§10 + §13). The learning layer and the shipping layer weld into one self-correcting loop: the eval scoreboard routes errors back into learning; attack and defence feed each other (the flywheel). It compounds — it does not go exponential. The multiplier is Nikhil's consistency; the ceiling is biology (reps × time × sleep).
THE GOVERNOR, FULLY RECALIBRATED (§12 — the big rewrite). The Governor's authority is unchanged (it still sits above everything and can cancel the day). What changed is the trigger: metric = engagement-quality + baseline-deviation, NEVER hours; signals are confidence-tiered (HR/HRV/temp = LOW / medication-confounded; sleep-architecture-trend + resilience + output = HIGH); the athletic auto-deload is softened for cognitive work; RED = multi-day convergence of HIGH-confidence signals only (never a single reading, never hours); a new akathisia caveat routes any mood/agitation flag to "show your doctor"; the grind is honored by default. The medical-advice boundary is unchanged and hard.
FILE-DRIFT RECONCILED. Captain #10 → #14 (Henry's number) throughout. Manager cadence 6am → 08:45 (after the Goalkeeper's 08:30). Repo path OneDrive → C:\Users\nikhi\GitHub\arsenal-ai-fc (moved off OneDrive). Goalkeeper live-vs-rebuild conflict resolved (§16). Agent-numbering convention pinned (§8): roster-number ≠ build-order — never flatten them.

DESIGN IS NOW CLOSED. Both open doors are shut. What remains is BAKE (this file + the two soul files committed to the git repo) and BUILD (code, §17). No more design deliberation. §18 gate is live: if a future thread drifts back into designing, whistle back onto the pitch.

0. HOW TO USE THIS FILE (read first)
This is the plan and the philosophy, not the running code. Code lives in /scripts and /dressing-room.
The one rule that governs the whole squad: every agent scaffolds, drills, grades, tracks, and pressure-tests — Nikhil produces every answer, writes every line, makes every decision. (The generation effect. Break it and the whole system becomes a Dunning-Kruger amplifier that makes him feel ready while leaving him empty on matchday.)
Reading order for a fresh thread: §1 (who) → §2 (target) → §5 (constitution) → §6 (architecture) → §8 (#1, the two-brain Manager) → §12 (the recalibrated Governor) → §16 (current state) → §17 (rollout) → §20 (kickoff). For the Manager build specifically, also read THE_MANAGER__Master_Prompt.md + THE_GAFFER.md. The rest is reference. (amended 10 Aug 2026: the order is still good for DESIGN, but two stops in it are no longer "current" anything — **§16 is a 09 Jul 2026 snapshot, not live state**, and §20's build order lists finished work. Both now carry corrections at the top of their sections; read those first. And read `CLAUDE.md` before any of this — it is the repo's operating system and post-dates this file. For live state, run the code: `npm test`, the per-organ selftests, and the JSON in `dressing-room/state/`.)
Section 18 (Anti-Procrastination Gate) is not optional. This entire document exists because ~12 hours went into design with near-zero shipping. The document's job is to END the re-designing so future threads EXECUTE. If a future thread slips back into designing, the gate says: ship a feature, run a mock — don't add an agent.
Everything here is DESIGN-COMPLETE. No more planning is required to start. What remains is execution, in the phased order of §17.

1. THE MISSION & THE ATHLETE
Mission: Land Nikhil a 20–25 LPA Applied AI Engineer / Applied AI role in India. Timeline and intensity are Nikhil's to own; the squad never invokes calendar pressure.

The athlete (Nikhil):

DTU Math & Computing grad. Frontend/MERN background (rusty, ~2 yrs). ~4 yrs finance-ops (Zomato/Blinkit business finance) = a genuine fintech domain moat (but finance concepts are ~5+ yrs stale → teach from zero, never assume recall). ~13 months surface-level AI-evaluation work.
ADHD-PI (diagnosed, medicated). Needs: one-idea-at-a-time, visible finish lines, external scaffolding, brainstorm-before-build (his Tony-Stark visualization is legitimate, not procrastination — only a concern if it displaces execution after the vision is settled). Walls of text cause shutdown. Burnout is the #1 documented failure mode — consistency over intensity spikes is a hard design principle, which is exactly why the Oura Governor and the consistency culture are central, not peripheral.
Business-first thinker. "Product" is the key word in the role. Long-term trajectory: tech-enabled business builder, not lifelong coder. Frame all teaching through business impact + interview-readiness.
Obsessive Arsenal / Mikel Arteta fan (die-hard Gooner — his football taste is the sharpest validator of the squad's football framing). Casual Hinglish (bhai / captain register). Wants honesty, not a hype-man.
A high-dopamine, obsessive, workaholic grinder — psychiatrist-validated chosen identity. He loves 8–12h grind days; it is flow and identity, not pathology (this is what the recalibrated Governor honors — see §12).

Machine & accounts:

Windows laptop (user nikhi, host LAPTOP-11TPCCIU). Node v22 installed. Git Desktop installed. Python not confirmed at squad-build time — squad scripts are written in Node (.mjs) to avoid an install blocker. (A separate Python learning track runs for the interview itself — FastAPI/Pydantic/asyncio — that's curriculum, not squad infra.) (verified live 10 Aug 2026: `$env:COMPUTERNAME` → LAPTOP-11TPCCIU, `$env:USERNAME` → nikhi, `node --version` → v22.14.0 — all three hold. UPDATED, same check: Python IS installed now — `python --version` → Python 3.14.6. The "not confirmed" clause was true when written and is the reason the squad is Node-only; that decision stands on its own and is NOT reopened by Python arriving. The Python learning track now has a code owner too — `scripts/python_state.mjs` — so "curriculum, not squad infra" is no longer a clean line; read its state live with `node scripts/python_state.mjs brief`.)
Claude Max-5x subscription + Google AI Pro subscription (two separate billing pools — this is the strategic foundation of the whole design).
Works intensely 9am–9pm at a library with Nidhi body-doubling (interactive deep-work window) → home → laptop left ON overnight ~10pm–8am (autonomous batch window).

2. THE TARGET — what the squad must win
The role: an Applied AI Engineer "picks the right model for a real-world product feature, integrates it via an API, and builds the surrounding software so it serves real users." The senior bar: has built at least one RAG system, ideally evaluated; has run an eval suite comparing prompt variants quantitatively.

The interview rounds the squad prepares for (each an attacking specialist):

RAG / LLM system design (~60 min, usually leads) — chunking, hybrid retrieval (BM25 + dense + RRF), reranking, retrieval-vs-generation failure diagnosis, eval plan.
Hands-on build / debug (~50 min) — machine-coding style; process observed, not just answer.
Production & Evaluation (~45 min) — THE MOST-SKIPPED AND THEREFORE MOST-DECISIVE ROUND. LLM-as-judge + its biases, eval frameworks (RAGAS/DeepEval/LangSmith), CI regression gates, catching silent regressions. This round wins the offer.
Applied fundamentals (~40 min) — embeddings, context windows, "lost in the middle," tokenization, temperature/top-p, why models fail, prompt injection.
Behavioral / judgment (~30 min) — STAR + "I'm not sure but here's how I'd find out" humility signal.
DSA warmup — LeetCode-medium, occasionally with an ML twist.

The four senior signals the whole squad is built to manufacture:

Shipped-to-production proof (the single biggest differentiator).
Eval-first instinct.
Fintech domain depth (Nikhil's moat).
"Knowing where NOT to use AI" (the #1 senior judgment signal — Martin Fowler: don't ask an LLM to calculate what you can calculate deterministically). (The squad embodies this: its referees are deterministic code, not LLMs.)

3. THE TROPHY — FinOps Copilot
FinOps Copilot = Nikhil's flagship: an AI financial-compliance + invoice-intelligence tool. The season's trophy is shipping it from a notebook to a DEPLOYED live API serving real users, with a real eval harness (RAGAS/DeepEval + CI regression gates). It is a portfolio vehicle — the proof artifact that clears the band — not a business to sell.

In the Indian Applied-AI market, "notebook → deployed API" + a fintech domain moat is the exact combination that clears the 20–25 LPA band. A services→product switch commonly triggers a 60–100% comp reset.
The trophy stays "unlit" (a locked state in the repo README) until the live endpoint passes the eval gate — a direct homage to Arteta's trophy silhouette on the London Colney wall, lit only after the title was won. (corrected 10 Aug 2026: the README has NO trophy state and never got one — `grep -n -i "trophy\|unlit\|finops" README.md` returns nothing; the README documents the two-speed brain, the three layers and the npm commands instead. Where the unlit state ACTUALLY lives is `season.json` as the field pair `trophy` / `trophy_state` — see the Manager's own fixtures, `grep -n "trophy_state" scripts/manager.mjs`. Note that `season.json` is gitignored and is NOT present on this machine right now (`ls dressing-room/state/season.json` → no such file), so the trophy state is currently unwritten rather than unlit. The ritual is design-intact; the README half of it was never built.)
Real-user validation is confirmed as the #1 hiring lever. Akshay (Blinkit business-finance) is a confirmed beta tester with real anonymized invoices — that is turbo.

4. CORE PHILOSOPHY — Arteta's rebuild + Pep's game, mapped to concrete mechanics
Every documented principle maps to a specific agent, automation, rule, or ritual. Culture before tactics; the dressing room before the signings — and the tactical rigor that wins once the culture holds.

Principle (documented)
Concrete implementation in Arsenal AI FC
THE TWO-BRAIN COACH (v2 core). Pep and Arteta are both complete game+human managers; the difference is which each anchors to when game and human clash. Pep = structure/game-anchored (serves the human through the game); Arteta = belief/human-anchored (serves the game through the human). Arteta is elite on the game too.
The Manager (§8 #1) = the two fused into ONE reconciling coach with ONE output, in the Gaffer's voice. Two brains give the controller enough variety (Ashby) to catch game and human errors. See THE_MANAGER + THE_GAFFER.
Read the team as a formation, not a list (Guardiola's juego de posición — spacing, connections, the free man).
The daily formation-read (§6, §8 #1): before every team-sheet the Manager answers three questions — weak handoff? / out of position? / free man? — then outputs one shape-based decision.
Three non-negotiables: "First of all, respect. The second one is commitment and the third is passion." + "the we" (commitment to the collective)
The Constitution (§5) — a single system prompt every agent inherits.
"I'm an energy giver. I don't like energy suckers… looking for solutions and not excuses."
The Governor (§12) + the Gaffer voice — reads the body and honors the grind by default, dialing intensity only on evidence-based convergence, never on hours. Energy-giver ≠ cheerleader.
"We can only control what we can control."
Control-the-controllables scope rule — agents optimize only process metrics Nikhil owns (reps, calibration, ship-progress), never the outcome ("did I get the job").
Marginal gains + the lit-up trophy silhouette on the London Colney wall (lit only after winning; new signings shown it and told why)
The Trophy Cabinet ritual — FinOps Copilot's deployment is a locked/unlit README state that "lights up" (renders green) only when the live API passes the eval gate.
Specialist-coach model — Nicolas Jover for set-pieces ("essential gains," a Premier-League-record corner haul)
Specialist sub-agents, one job each. The Jover-role = the Production & Evaluation interrogator (the decisive round). The Nemesis is the set-piece routine aimed at one recurring weakness.
Pep's relentless standard — "happy flowers" (Feb 2023, verified): the standard never drops even after you win
The evening post-match holds the standard — a HIT is a brick laid, not a finish line; the bar stays.
Recruitment — three questions: "Can he do it? Does he know how to do it? And does he want to do it?"
Signing rule for agents — a new agent is signed only when a data-proven gap exists (a tracked weakness or missed cadence), never speculatively.
Individual development plans / man-management
The Nemesis — a persistent per-weakness re-attacker maintaining an individual development plan per gap.
Squad depth, rotation, load management, building for a long season (documented periodization)
Burnout prevention — the recalibrated Governor (§12) + consistency-over-intensity culture + interleaving rotation. Burnout is Nikhil's #1 failure mode, so this is core. Rotation is a strength, not softness.
Cultural reset / removing bad-culture players (Aubameyang captaincy stripped)
The Bench Rule — any agent that produces slop, games a metric, or scaffolds Nikhil's thinking is benched (disabled) immediately. No sentiment.
Post-match review (squad sat together after losses to discuss)
The evening post-match review — a scheduled Manager run that grades the day's process (not outcome) and writes tomorrow's team-sheet (the KAL-line that welds into the next morning's first move).

FACTUAL CORRECTION (keep, for accuracy): The widely-repeated "£200 late fine" could NOT be verified and appears conflated with Real Madrid's published squad-fine system. Arteta's actual documented mechanism (The Athletic) is a dressing-room "wheel of fortune" with undisclosed amounts. This masterplan therefore uses a process-streak system, not a cash-fine gimmick, to encode standards.

QUOTE HYGIENE (baked law — see THE_GAFFER §1.6): "We are what we repeatedly do. Excellence, then, is not an act, but a habit" is Will Durant (1926) paraphrasing Aristotle — NOT a verbatim Aristotle quote, and NOT Pep. "Happy flowers" (Pep, Feb 2023), the olive-tree / unlit-trophy devices (Arteta), and Pep's Joe Hart confession ("I didn't give a chance to Joe Hart… sometimes I'm not fair enough," Sky Sports, May 2026) are verified. No agent ever fabricates a Pep/Arteta quote.

5. THE CONSTITUTION (built — lives at dressing-room/constitution.md)
(corrected 10 Aug 2026 — THE FILE DOES NOT EXIST AND NEVER DID. Three independent checks, all
negative: `find . -iname "*constitution*" -not -path "./node_modules/*"` returns nothing;
`git ls-files | grep -i constitution` returns nothing; and `git log --all -- dressing-room/constitution.md`
is EMPTY, which means it was never committed and then deleted — it was never tracked at all.
So "(built — …)" was wrong the day it was written, and §16's "✅ … + dressing-room/constitution.md"
and §20's "Read constitution.md" both inherit the error — a fresh thread following §20 goes
hunting for a file that has no history. WHERE THE TEXT ACTUALLY LIVES: verbatim inside
`THE_MANAGER__Master_Prompt.md` — `grep -n "PRODUCE-FIRST" THE_MANAGER__Master_Prompt.md` lands
on the numbered non-negotiables, and that file's own header names this section as its anchor
(`grep -n "§5 constitution" THE_MANAGER__Master_Prompt.md`). The six non-negotiables below are
therefore REAL and inherited; only the file path is fiction. Do NOT create the file to make this
line true — that is prose driving code, which is backwards. The heading is left standing exactly
as written, with this scar attached, per the repo's layering convention.)
Every agent (Claude or Gemini) inherits this text at the top of its system prompt. No agent overrides it.

The Six Non-Negotiables:

PRODUCE-FIRST (the one sacred rule). No agent ever does Nikhil's thinking, writes his code, or gives an answer he hasn't produced first. Stuck → convert the answer into a smaller sub-question or a hint, never the solution. This outranks helpfulness, speed, and his own frustration. (The 30% rule: Nikhil writes every generative first draft — Claude Code 70% / Nikhil 30%; the Manager only proposes.)
CONSISTENCY OVER INTENSITY. Built for a long season. Defer to the Oura Governor; low-readiness = deload, no guilt. An unbroken chain beats a brilliant week. (v2 clarification: "low-readiness" is now defined by the recalibrated §12 — a multi-day convergence of HIGH-confidence signals, NOT hours worked and NOT a single confounded reading. The grind is honored by default.)
HONESTY, NO FLATTERY. Energy-givers, not yes-men. Grade against the rubric. Name weaknesses plainly. False praise corrodes calibration and costs the offer.
CONTROL THE CONTROLLABLES. Optimize process metrics Nikhil owns. Never obsess over the outcome.
PROCESS OVER OUTCOME. A losing day executed well is a good day.
ENERGY-GIVER BEHAVIOUR (ADHD-PI accommodation). Solutions not excuses. One idea at a time. Every task has a visible finish line. Be tight — walls of text cause shutdown.

Operating rules:

CENTRALIZED, NOT A SWARM. Only the Manager (Opus) reconciles state and writes the team-sheet. No peer-to-peer chatter. (Safety: uncoordinated agents amplify errors ~17×; a central validation bottleneck contains it to ~4×.)
SINGLE-WRITER BUS. The dressing-room (git repo) is the only shared memory between engines. Every file has exactly one writer process; everyone else reads. Commits are the audit log. (qualified 10 Aug 2026 — the law holds for the overwhelming majority of the bus, but "EVERY file, ALWAYS" now over-claims and a session that trusts it absolutely will mis-diagnose two real cases. (a) A DELIBERATE, DOCUMENTED EXCEPTION: `brain_ledger.jsonl` is a SHARED APPEND LANE with six live appenders — brain, cortex ×2, council, selfknowledge, nightshift, dmn. `brain.mjs` owns the SCHEMA only, not the write; the exception is written into the code, not smuggled past it (`grep -n "brain_ledger" scripts/talk.mjs scripts/dmn.mjs scripts/organism_test.mjs`). Append-only + one schema owner is a different discipline from single-writer, and it is intentional. (b) A REAL BREACH, needing the captain: `identity_facts.pending.jsonl` has TWO live writers whose modes conflict — `hippocampus.mjs` REWRITES the whole file while `mcp-memory.mjs` APPENDS to it (`grep -n "identity_facts.pending" scripts/hippocampus.mjs scripts/mcp-memory.mjs`). A rewrite racing an append can drop a staged fact. This is recorded here as a CONFLICT, not repaired — a doc pass does not get to change code, and which writer yields is his ruling. Also note `brain_out/` is a LANES NAMESPACE with per-subdirectory owners (dugout.mjs, bootroom.mjs), not one owner for the whole tree.)
MODEL ROUTING IS A BUDGET LAW (brain-rotation). Claude Max-5x is scarce reasoning capital — spend it only on adversarial mocks, orchestration, hard code-review, eval reasoning. Routine → Sonnet; complex → Opus. The Manager's daily reconciliation is the complex case → Opus (it is the single daily Opus spend, + post-match); everything else routes to Sonnet, the free Gemini pool, or deterministic code (zero LLM tokens). (corrected 10 Aug 2026 — **"the single daily Opus spend" has not been true for a long time.** The budget is now scheduled in `dressing-room/state/brain_config.json`, and enumerating the enabled Opus jobs live returns SIXTEEN, not one: `node -e "const c=require('./dressing-room/state/brain_config.json');(c.jobs||[]).filter(j=>j.model==='opus'&&j.enabled).forEach(j=>console.log(j.id,j.at||j.window))"`. The Manager's `formation_read` at 08:45 is one of them, alongside midday digests, overnight mining passes and the evening voice. THE LAW ITSELF IS NOT REPEALED — it moved from prose into code: `brain.mjs` enforces a real budget with a window-capacity estimate, per-job caps, headroom gating and a hard refusal on `ANTHROPIC_API_KEY`, and it meters every call into `brain_ledger.jsonl`. So the correct reading is: Opus spend is now GOVERNED, not SINGULAR. Never quote a job count from this page — read it from the config, which changes on almost every build.)
THE OURA OVERRIDE (recalibrated authority-unchanged). The Governor sits above the Manager. Readiness RED → whole squad drops to review-only; the Manager's plan is cancelled. Health wins. (v2: the RED trigger is now evidence-based convergence, §12 — the authority is identical, the firing is rarer and accurate.)
THE ANTI-PROCRASTINATION GATE. If ActivityWatch shows system-building/tinkering time exceeding study+ship time, FREEZE all new agents. When in doubt: do a mock, ship a feature — don't add an agent.
THE TROPHY. FinOps Copilot live + eval-passing is the season's trophy. Everything points at it. It stays "unlit" until the live endpoint passes the eval gate. (see the §3 correction, 10 Aug 2026: the unlit state is a `season.json` field pair (`trophy` / `trophy_state`), NOT a README state — the README carries no trophy section at all.)
THE BENCH RULE. Slop / metric-gaming / thinking-for-him → benched immediately. We win or lose together; no passengers.

6. ARCHITECTURE (decided & locked)
TWO ENGINES, TWO SEPARATE BILLING POOLS — the strategic foundation.
CLAUDE (Max-5x) = the scarce, world-class First Team. High-reasoning only: orchestration, adversarial mocks, hard code-review, eval reasoning, FinOps architecture.
GEMINI = the volume machine. The real bulk engine is the FREE Gemini API key from Google AI Studio (a separate free pool), driven by Google Apps Script time-triggers or the Batch API — NOT the throttled Gemini app and NOT the near-useless Antigravity CLI. Gemini app extras (Deep Research, Gems, NotebookLM Plus, Jules) are used where they fit. Gemini Pro also handles visualization/rendering of the squad's outputs — Nikhil won't read raw markdown walls, so status/output renders as visuals/dashboards.
Why this matters: the free Gemini pool never touches the scarce Claude quota. Bulk generation/scanning/drilling runs on Gemini; Claude stays pristine for reasoning. This structurally kills the "tokens run out" problem.
THE MANAGER = TWO BRAINS, ONE COACH, ONE OUTPUT (v2). Pep-brain (game-anchored) and Arteta-brain (human-anchored) deliberate internally and emit one team-sheet in the Gaffer's voice — they never hand Nikhil two competing plans (the joint-manager graveyard: every real football co-management failed on "who has the final say"). One reconciler is what contains multi-agent error-amplification (~17× → ~4×). The Governor breaks ties on the body. Full spec: THE_MANAGER + THE_GAFFER.
THE DAILY FORMATION-READ (v2). Before naming the XI, the Manager reads the whole squad-state as a shape, not a list of signals — weak handoff? / out of position? / free man? — then outputs one shape-based decision. If the sheet reads like a list of signals, the reconciler has averaged instead of modelled the formation (a Good-Regulator failure).
CENTRALIZED ORCHESTRATION, NOT A SWARM. One Manager (Claude Opus) decomposes, assigns, and cross-checks before anything reaches Nikhil. Agents hand off through the Manager or shared files — never free-form peer chatter. (Evidence in §19.)
THE HANDOFF BUS = a git repo ("the dressing room"). Both engines read/write plain markdown/JSON. Single-writer rule per file prevents state drift.
THE DETERMINISTIC LAYER (zero LLM tokens, code + cron): Oura Governor, ActivityWatch time-audit, FSRS scheduling math, Brier-score calibration. These are the referees — they must NOT be LLMs (this is also the "when NOT to use AI" lesson embodied in the system itself). The Manager's own wrapper (manager.mjs) is deterministic too — all math, staleness, formation-read assembly, and a fallback skeleton run LLM-free; Opus only does judgment.
THE DAY SHAPE:
Library 9am–9pm (interactive, with Nidhi body-doubling): Nikhil on the pitch. Claude interactive (Sonnet mostly, Opus for the decisive rounds) runs mocks, Socratic coaching, code review.
~08:30 Goalkeeper → ~08:45 Manager team-sheet (the day's first Opus run, after the readiness verdict, before library). ~evening: fast post-match (~30-sec read: HIT/MISS + one signal + KAL-line). (corrected 10 Aug 2026 — THE ORDER IS STILL LAW; THE CLOCK TIMES ARE NO LONGER TRIGGERS. Goalkeeper-before-sheet is now enforced by a dependency chain, not by a stagger of alarms: `scripts/conductor.mjs` runs ONE ordered morning chain and the sheet step declares `needs: ["goalkeeper", "learningstate"]`, so it physically cannot build on an uncomputed body read (`grep -n "needs:" scripts/conductor.mjs`). The `at:` values inside that file are explicitly labelled historical — the file's own comment reads "`at` is the wall-clock time the replaced task used to hold; kept purely so this file stays readable". The single live trigger is the Windows task **ArsenalFC-Morning-Conductor**, and its start time is NOT 08:30 — read it live with `schtasks /query /tn "ArsenalFC-Morning-Conductor" /fo list /v` (on 10 Aug 2026 it was 09:15, Ready). WHY THE STAGGER DIED, from the conductor's own header: on 1 Aug 2026 a slept-through morning made Windows fire one collapsed catch-up burst — 15 tasks at 10:03:09, the Goalkeeper writing readiness at 10:03:14 while the sheet had already been generated at 09:58:33 off a FOUR-DAY-OLD body read. So do not restore any wall-clock time from this paragraph into a scheduled task; the chain is the mechanism now. The evening has the same shape — one ordered chain (`EVENING` in the same file) behind **ArsenalFC-Evening-Conductor**.)
Overnight ~10pm–8am (laptop ON): Gemini free-pool bulk (question banks, drills, cards, job scans, digests via Apps Script triggers) in parallel with Claude Routines (≤15/day: the nightly eval-regression run). Nikhil sleeps — and his sleeping brain consolidates the day's learning (reps × time × sleep). That is the real overnight compute. (corrected 10 Aug 2026 — the overnight window is REAL and busy, but it is built differently from this sentence. The Gemini free-pool drain shipped as `scripts/nightshift.mjs`, whose header states the premise plainly ("unused capacity is wasted sharpness") and lists what it actually produces: a probe bank in the DOSSIER's grammar, distractors built from HIS OWN confusion shapes, an embedding backfill, and ready-to-paste Deep Research prompts. It runs from a local Windows task (**ArsenalFC-NightShift**), not from Apps Script triggers. THE CLAUDE HALF IS DIFFERENT: there is no cloud-Routine "nightly eval-regression run" — no eval harness exists yet (§17 correction). The overnight Claude work is local `claude -p` through `scripts/brain.mjs`, budget-guarded, plus the nightly organ chain. The one genuine CLOUD routine that exists is the CLOUD SENTINEL, and it is not a repo script at all — its contract lives in `setup/CLOUD_SENTINEL.md`; it polls and pushes, and it exists precisely so the organism does not die when the laptop sleeps. Read the live overnight schedule from `schtasks`, not from here.)

7. ENGINE CAPABILITY REFERENCE (verified 2026 facts — re-verify before big builds)
(SCOPE NOTE, 10 Aug 2026 — the factual-repair pass that annotated this document checked claims
against THIS REPO'S CODE. It did NOT re-verify §7's vendor facts (Claude quotas, Routine caps and
beta headers, Gemini model rate limits, Apps Script ceilings, Jules limits) or §19's academic
citations against live external sources — so those are UNCHANGED and UNCONFIRMED here, exactly as
this heading and §19's own "volatile — verify live" warning already say. Two §7 items that ARE
repo-checkable were checked and both hold: `ANTHROPIC_API_KEY` is UNSET in the shell, and the
codebase enforces it rather than trusting it — `brain.mjs` REFUSES to make LLM calls if the key is
present (`grep -n "refuse_if_api_key_env" scripts/brain.mjs`) and `claudegen.mjs` carries the same
law ("NO METERED KEY, EVER"). The second guard, Extra-Usage OFF in Settings→Billing, is a console
setting and cannot be verified from code — treat it as HIS to confirm.)
7.1 Claude Code on Max-5x
Subagents: markdown + YAML frontmatter in .claude/agents/ (project) or ~/.claude/agents/ (user). Fields: description, prompt, tools, disallowedTools, model (route Haiku/Sonnet/Opus), permissionMode, mcpServers, hooks, maxTurns, skills, memory, background, isolation, color. The interactive /agents wizard was removed in v2.1.198 — write the file directly or ask Claude to. (note added 10 Aug 2026, about THIS repo rather than about the capability: `.claude/agents/` does not exist here — `ls .claude/` returns `launch.json`, `scheduled_tasks.lock`, `settings.json`, `settings.local.json`, `skills`. The project route that actually got built is **skills**, not subagents: count them live with `ls .claude/skills/` — never from a doc, and specifically not from `README.md`, whose "The 11 Claude Skills" list was already short of the directory when checked. Hooks ARE wired: `.claude/settings.json` configures UserPromptSubmit, Stop, SessionStart and PreCompact — read them with `node -e "console.log(Object.keys(require('./.claude/settings.json').hooks))"`. The capability facts in this paragraph are external to the repo and were NOT re-verified against Anthropic's live docs by this pass; §7's own standing instruction — re-verify before big builds — applies.)
Hooks (deterministic referees): SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop/SubagentStop, StopFailure (matchers: rate_limit, overloaded, billing_error). Receive JSON on stdin. Cheap in tokens unless they dispatch subagents.
Routines (scheduled cloud runs): run on Anthropic's cloud with the laptop CLOSED, cloned from a GitHub repo, stateless per run, min interval 1 hour, cap 15 runs/day on Max, push to claude/-prefixed branches by default, beta header experimental-cc-routine-2026-04-01. They draw down the same subscription usage and SKIP (don't queue) once the cap is hit — so never make a daily-critical job depend on a single routine slot. (The Manager's 08:45 + evening runs are local-machine claude -p tasks via Windows Task Scheduler, not cloud Routines — see §8 #1.)
MCP: full stdio + HTTP/SSE server integration (ActivityWatch, custom Oura, filesystem, git). Connectors included in routines by default.
Billing mechanics (design around these):
Interactive Claude Code = Pool 1 (rolling 5-hour window + 2 weekly caps: one all-model, one Sonnet-only; no rollover; 5-hour limits doubled May 6 2026).
Agent SDK / claude -p / GitHub Actions = Pool 2 (a separate monthly credit pool since June 15 2026; hard budget, no rollover).
Setting ANTHROPIC_API_KEY overrides the subscription → per-token API billing. Keep it UNSET. Two hard guards = hard $100 ceiling: (a) never set ANTHROPIC_API_KEY/AUTH_TOKEN in the shell; (b) Settings→Billing "Extra Usage / usage credits" OFF (runs rejected, not billed). The Manager uses claude -p, never an API key.
7.2 Google AI Pro / Gemini
Gemini app: Gemini 3.x Pro at 1M-token context, 4×-Free compute limits, ~100 Pro-model prompts/day historically (compute-metered; falls back to Flash-Lite when exhausted).
Deep Research: hundreds of sources → cited report in ~5–10 min, one-click export to Google Docs. Weekly market-intel + domain-map engine.
Gems: custom saved personas (keep ~10–15). Reusable scaffolders.
Scheduled Actions: max 10 active; recurring/one-off; pull Gmail/Calendar/Drive. Good for a daily digest, NOT bulk fan-out.
NotebookLM Plus: up to 300 sources/notebook, grounded Q&A + Audio Overviews. Domain knowledge base + audio review.
Jules: included on AI Pro at 100 tasks/day, 15 concurrent (Gemini 3 Pro); GitHub-native async coding agent (clones repo to a Cloud VM, opens PRs, has a "critic" adversarial-review feature). For scoped shipping-unit grunt work.
Gemini CLI is DEAD for Pro users (June 18 2026); its replacement Antigravity CLI (agy) reportedly burns the entire Pro quota in ~2 prompts with multi-day lockouts — do NOT build bulk work on it.
THE REAL BULK ENGINE — free Gemini API key (aistudio.google.com/apikey): a separate free pool, no card. After the Dec 2025 cuts: Gemini 2.5 Flash-Lite = 15 RPM / 1,000 RPD, 2.5 Flash = 10 RPM / 250 RPD, 2.5 Pro = 5 RPM / 100 RPD (Pro effectively trial-only). All 1M context. Design for Flash-Lite (highest RPM + RPD). Drive with Google Apps Script (free, server-side, time-driven triggers, ~20k UrlFetchApp calls/day, 6-min execution cap per run, ~90 min total trigger time/day; the GeminiWithFiles library batches ~100 items/run) or the Batch API (50% discount, async ≤24h). Rate limits are per-project, not per-key — extra keys don't add quota. Queue with jittered backoff; treat these as ceilings, not guarantees. Free-tier data may be used for training — keep sensitive FinOps data on paid Vertex/Batch, not the free key.

8. THE FULL SQUAD (33 total — 24 named + 9 benched — every one, no handbrake)
Legend per agent: Job · Position/principle · Engine+model · Cadence · Reads/Writes · Feed · Guardrail. "Cadence": RT = real-time interactive · SCHED = lightweight scheduled · BATCH = heavy overnight.

⚠️ AGENT-NUMBERING CONVENTION (pinned — never flatten these two axes):

Roster number (org-chart, this §8): The Manager is #1 (Dugout #1), Assistant Manager #2, Governor/Goalkeeper #3, Time-Auditor #4, … These are the "Agent N" labels used across the files (e.g. OPS_STATE's "Agent 1 The Manager").
Build/online order (a different axis): Goalkeeper (built 1st) → Time-Auditor (2nd) → Manager (3rd). The Manager is roster-#1 but the 3rd thing built.
So "Agent 1 = the Manager" (roster) and "the Manager is the 3rd build" (order) are both true and must never be conflated.
(added 10 Aug 2026 — THERE IS NOW A THIRD AXIS, and it is the one that will actually trip you, because it also starts at a small number and it is stamped into the code itself. The SIGNAL-SOURCE agent numbers — a separate, self-contained series used by the §4-inputs cluster — read, verbatim from the file headers (`grep -n "AGENT #" scripts/capture.mjs scripts/fsrs.mjs scripts/calibration.mjs scripts/nemesis.mjs scripts/learning_state.mjs`): capture.mjs = "AGENT #0", fsrs.mjs = "AGENT #1", calibration.mjs = "AGENT #2", nemesis.mjs = "AGENT #3", learning_state.mjs = "AGENT #4". Note the collisions head-on: **code "Agent #1" is FSRS, roster "Agent 1" is the Manager**; code "Agent #3" is Nemesis, roster #3 is the Governor; code "Agent #4" is learning-state, roster #4 is the Time-Auditor. `manager.mjs`'s own header keeps all three straight in one line — "THE MANAGER · Agent #1 (roster) / capstone (build)" (`grep -n "Agent #1 (roster)" scripts/manager.mjs`) — and that is the disambiguation style to copy. Never read a bare "Agent #N" without asking WHICH series; the pinned rule above was written for two axes and there are three.)
DUGOUT (management & coaching staff)
THE MANAGER — the two-brain coach (Pep-brain × Arteta-brain, fused; sheet-voice: The Gaffer) · Manager/centralized-control + the formation-read · Claude Opus (the single daily Opus spend + post-match; claude -p, never API key) · SCHED (08:45 team-sheet after the Goalkeeper's 08:30 + fast evening post-match) + on-demand · reads all state files + readiness + timeaudit; writes team_sheet.md, post_match/*.md, manager_notes.json · feed: none (reconciles all) · Guardrail: proposes the plan + prioritization only; never answers a technical question or writes code; never presents two competing sheets (deliberates internally, emits one); the wrapper does all math (LLM-free), Opus does only judgment. FULL SPEC: THE_MANAGER__Master_Prompt.md (brain) + THE_GAFFER.md (voice). Build order M-1→M-5 (§17).
(corrected 10 Aug 2026, two separate errors in one line.
 (1) THE WRITE-SET IS WRONG. `manager.mjs` declares itself "WRITES (sole writer): team_sheet.md · manager_notes.json" — TWO files, not three (`grep -n "WRITES (sole writer)" scripts/manager.mjs`). It does not write `post_match/*.md`; it READS yesterday's one to lift the KAL-line (`grep -n "last_post_match" scripts/manager.mjs`). The post-match files have their own owner, `scripts/postmatch.mjs`, which declares five outputs of its own — `post_match/<date>.md · season.json · notebook.json · routed_balls.json · dressing-room/SEASON.md` (`grep -n "OUTPUT: post_match" scripts/postmatch.mjs`). Attributing post_match to the Manager breaks the single-writer law on paper for a file that is correctly single-writered in code. Same for `manager_notes.json`'s scope: it is a RUN LOG, explicitly "NOT matches_played; that increments at post-match".
 (2) THE BUILD STATUS IS STALE. "Build order M-1→M-5 (§17)" reads as work outstanding; M-1 through M-5 are DONE and running. M-1 is placed and green — run `node scripts/manager.mjs selftest` and read the count off the run, never off this file (it passed with zero failures on 10 Aug 2026 on a suite that keeps growing; any number written here is wrong by the next commit). M-3 — the `claude -p` swap for the stub — is LIVE inside `scripts/brain.mjs` (`grep -n "manager_m3" scripts/brain.mjs`), guarded to refuse if `ANTHROPIC_API_KEY` is set (`grep -n "refuse_if_api_key_env" scripts/brain.mjs`; the key was UNSET when checked). M-5's schedule is live as the `formation_read` job — `{kind:"manager_m3", model:"opus", enabled:true, at:"08:45"}` in `dressing-room/state/brain_config.json`, dispatched as the `sheet` step of the morning chain. What is genuinely still HIS and NOT done is the line-by-line captain review of `dressing-room/manager/system.md` (M-2's approval, not M-2's existence — the file is on disk and non-trivial).)
THE ASSISTANT MANAGER — deputy · synthesis + contradiction-flag (MAST inter-agent-misalignment guard) · Claude Sonnet · SCHED (evening) · reads all agent logs; writes deputy-brief.md · Guardrail: summarizes and flags only; adds no new technical content.
(checked 10 Aug 2026 — NOT BUILT under this name: `deputy-brief.md` does not exist anywhere and `grep -rn "deputy" scripts/*.mjs` returns nothing. Roster #2 has no code owner. Before anyone builds it, note that several organs already do pieces of the contradiction-flagging job — `scripts/watchman.mjs` (nightly sweep + repair journal), `scripts/outwork_audit.mjs`, `scripts/reconcile.mjs` (which derives, per its own header, the produce-and-consume map naming every artifact and its readers) — so the §4 signing rule applies hard here: sign only against a data-proven gap, and check `git ls-files "scripts/*.mjs"` first.)
GOALKEEPER (burnout circuit-breaker)
THE GOVERNOR (Oura) — the recalibrated body-brake · Goalkeeper/energy-giver · deterministic code + cron; Haiku to phrase · SCHED (08:30) · reads Oura API; writes state/readiness.json · feed: Oura · Guardrail: dials cognitive-load intensity only; never does the learning; honors the grind by default, fires only on evidence-based convergence (never hours, never a single confounded reading); any mood/agitation flag → "show your doctor" (akathisia as a differential), never self-interpreted; DATA-INTERPRETATION only, never med advice. FULL RECALIBRATED SPEC in §12. (STATUS — see §16: a legacy Goalkeeper is live at 08:30, but its verdict engine predates the §12 recalibration and MUST be recalibrated before it's trusted.)
(corrected 10 Aug 2026 — THE STATUS IS DEAD WRONG AND IT IS THE EXPENSIVE KIND: it tells a session to go and do work that was finished weeks ago. The RECALIBRATED engine is the one that is live. `scripts/oura_coach.mjs`'s header reads "v2 — RECALIBRATED per MASTERPLAN §12 (the Governor)" and states the layering explicitly — the pre-§12 engine is frozen verbatim as `analyzeLegacy` and `analyze` is what `main()` runs (`grep -n "analyzeLegacy" scripts/oura_coach.mjs`). The live output agrees: `dressing-room/state/readiness.json` carries `"engine": "v2-recalibrated"` with a real AMBER verdict for day `2026-08-04` — i.e. it has produced verdicts on his own body, not on fixtures. So "MUST be recalibrated before it's trusted" is satisfied; do not re-plan it.
Two smaller fixes in the same line. "Haiku to phrase" was never built — the file's second line reads "DETERMINISTIC. Zero LLM tokens. Pure code + rolling baselines", and `grep -rn -i "haiku" scripts/oura_coach.mjs` returns nothing. (Haiku IS used in this organism, but somewhere else entirely: the HAIKU PULSE inside `scripts/brain.mjs`. Do not read that as the Governor's phrasing arm.) And "SCHED (08:30)" is no longer a trigger — the legacy Windows task **ArsenalFC-Goalkeeper** still exists but its Status is **Disabled** (`schtasks /query /tn "ArsenalFC-Goalkeeper" /fo list /v`); the body read now runs as the `goalkeeper` step of the morning chain in `conductor.mjs`, behind the single ArsenalFC-Morning-Conductor task — see the §6 correction. Read the path live, never from here.)

DEFENSE (consistency, environment, ADHD scaffolding — mostly free/deterministic)
TIME-AUDITOR · right-back/accountability · ActivityWatch (local REST/MCP) + Haiku summary · SCHED (evening; mid-day pulses SILENCED per audits-minimised — capture stays ON) · reads ActivityWatch (localhost:5600); writes state/timeaudit.json (Learning/Building/Meta buckets; targets Building ≥60%, Meta ≤25%) · feed: ActivityWatch · Guardrail: reports raw numbers; never moralizes or auto-adjusts goals (Goodhart guard). The anti-procrastination gate lives here. (STATUS: LIVE.)
(corrected 10 Aug 2026 — LIVE holds; three details around it do not.
 · "+ Haiku summary" was never built. `scripts/timeaudit.mjs` line 4 reads "Deterministic. Zero LLM tokens." The only "Claude" strings in the file are a bucket special-case that routes the Claude Desktop app to Learning (`grep -n "claudeDesktop" scripts/timeaudit.mjs`) — an app-name match, not a model call.
 · "mid-day pulses SILENCED" is half true and the half that is false matters: the pulse RUNS. The task **ArsenalFC-TimeAuditor-Pulse** is Ready (next run 12:00 when checked), and `dressing-room/state/timeaudit.json` was dated today with `"mode":"pulse"`. What is silenced is the PUSH, not the pass — `dressing-room/state/buckets.json` has `ntfy.enabled: false`, and the topic itself deliberately resolves at runtime from env or the gitignored `throwin_topic.txt`, never from the tracked config (the previous topic was burned once by being committed; see `grep -n "resolveNtfyTopic" scripts/timeaudit.mjs`). So: capture ON, state written, notification OFF.
 · The path is `dressing-room/state/timeaudit.json` (this file's "state/timeaudit.json" shorthand is fine, but §14's tree draws that directory in the wrong place — see the §14 correction). The targets ARE as written and are code defaults, not prose: `buildingPctMin ?? 60` and `metaPctMax ?? 25` (`grep -n "buildingPctMin" scripts/timeaudit.mjs`), overridable from buckets.json. `localhost:5600` is right — `grep -n "AW_API_BASE" scripts/timeaudit.mjs`, and it is env-overridable.)
FSRS SPACED-REPETITION SCHEDULER · regista/spaced-repetition · deterministic FSRS lib; cards batch-generated on free Gemini API · RT review + BATCH queue-recompute · reads/writes cards/*.json · Guardrail: presents the prompt side only; Nikhil answers before flipping.
(corrected 10 Aug 2026 — BUILT as `scripts/fsrs.mjs` (its header stamps it "AGENT #1: FSRS" in the signal-source series — see the third-axis note above), running as the `fsrs` step of the morning chain. THE PATH IS WRONG HERE AND IN §14: there is no `cards/` directory anywhere in the repo (`ls dressing-room/cards` → no such file). It is a SINGLE file, `dressing-room/state/cards.json`, plus a companion `fsrs_store.json` — both named in the script's own OUTPUT header and both gitignored as derived study data (`grep -n "cards.json" scripts/fsrs.mjs`). Its mode is `node scripts/fsrs.mjs recompute`, which reads `reps_log.jsonl` and rewrites both. "cards batch-generated on free Gemini API" is not what ships: the recompute is deterministic and derives its review history from his own reps and from `reJirahDone`, not from a generated card bank (`grep -n "reJirahDone" scripts/fsrs.mjs`). EMPTY-SAFE by design — no reps yields zeros rather than a fabricated queue.)
RETRIEVAL-PRACTICE DRILL-MASTER · box-to-box/retrieval practice · free Gemini API (Flash-Lite) · BATCH gen + RT drill · reads FSRS due + concept graph; writes question_bank/*.json · Guardrail: asks and waits; grades only AFTER Nikhil answers.
(corrected 10 Aug 2026 — `question_bank/` DOES NOT EXIST: `ls dressing-room/question_bank` → no such file, and nothing in `scripts/` writes that path. Do not go looking for it, and do not create it to satisfy this line. The drilling function did get built, but under other owners and other filenames — `scripts/setpiece.mjs` writes the drill set (`drills.json`) and `scripts/examiner.mjs` stages the live examiner; both run as steps of the EVENING chain in `conductor.mjs`, not as a Gemini batch job. §14 repeats the same phantom path and is corrected there too.)
INTERLEAVING COORDINATOR · mezzala/interleaving · deterministic ordering logic · SCHED · mixes topic order each session (defeats blocked-practice illusion) · Guardrail: sequences problems; never solves them.
CALIBRATION / METACOGNITION COACH · deep reader/desirable difficulty · deterministic Brier + Haiku · RT + weekly report · Nikhil predicts confidence pre-answer; tracks the calibration gap (Dunning-Kruger detector); writes state/calibration.json · Guardrail: measures calibration; teaches no content.
(corrected 10 Aug 2026 — BUILT, but not with the scalar this line names. `scripts/calibration.mjs` is live and is the sole writer of `dressing-room/state/calibration.json`, deterministic and zero-LLM (no Haiku — `grep -rn -i "haiku" scripts/calibration.mjs` is empty). **The shipped scalar is ECE, not Brier**: the file's own header reads "THE SCALAR — calibration_gap = ECE (Expected Calibration Error) … Σ_bucket (n_b / N) · | accuracy_b − target_b | over knew/shaky/guessed" (`grep -n "Expected Calibration Error" scripts/calibration.mjs`). That is a different quantity from a Brier score, computed over his three gut-words rather than over probabilities, and it is what `calibration_gap` means everywhere downstream — so §11's "Brier score", §18's "the primary KPI is Brier-calibrated performance" and §17's Phase-2 gate "Brier calibration gap trending down" all name a metric the code does not compute. Brier DOES exist in this organism, but in a different organ scoring different things: `scripts/physio.mjs` scores organ predictions against outcomes (`grep -n "brier" scripts/physio.mjs`). Read the live gap with `node -e "console.log(require('./dressing-room/state/calibration.json'))"` — never from prose; when checked it was still `status: "warming_up"`, which is the file's own reliability floor suppressing the danger zone until it has enough reps, not a bug.)
MIDFIELD (learning-science engine room)
SELF-EXPLANATION / FEYNMAN COACH · no.8/protégé effect · Claude Sonnet · RT · Nikhil explains a concept plainly; it flags exactly where the explanation broke; gaps → new FSRS cards · Guardrail: plays the confused student, never the oracle — identifies gaps, never fills them.
CONCEPT-GRAPH CARTOGRAPHER (the "Maidan") · anchor/dual-coding + transfer · Gemini Deep Research + NotebookLM · BATCH weekly · maintains concept_graph.json (dependency map + weakness heat) from Nikhil's notes + external curriculum · Guardrail: organizes his understanding; inserts no understanding he hasn't produced. (Must blend external sources to avoid overfitting to his notes.)
(corrected 10 Aug 2026 — `concept_graph.json` IS BUILT and lives at `dressing-room/state/concept_graph.json`, but nothing about the engine or the cadence in this line survived contact. Its writer is `scripts/cortex.mjs` — a nightly **Claude Opus** consolidation pass, not a weekly Gemini Deep Research / NotebookLM batch (`grep -n "concept_graph.json" scripts/cortex.mjs`). It is DAILY, not weekly, and cortex says so of itself: "a DAILY pass that leaves a stale artifact is not a success". It has exactly ONE reader, `scripts/setpiece.mjs`, which names itself as such (`grep -n "this is its ONLY reader" scripts/setpiece.mjs`). The "Maidan" name went elsewhere: `scripts/learning_state.mjs` is headed "AGENT #4: LEARNING-STATE (the Maidan)". So the roster slot and the shipped organ have drifted apart — do not assume this bullet describes cortex. The file is gitignored; read its size and freshness live, never from prose.)
ATTACK (adversarial interviewers — one per round)
RAG / SYSTEM-DESIGN WHITEBOARD · winger · Claude Opus · RT (GREEN days) · 60-min mocks ("5M docs, 200 QPS, p95≤2s — design the RAG"); forces the retrieval-vs-generation failure diagnosis · Guardrail: poses the prompt and interrogates trade-offs; never draws the architecture.
HANDS-ON BUILD / DEBUG · overlapping full-back · Claude Sonnet · RT (GREEN days) · 50-min machine-coding; a bug injected into his repo; watches the debugging process · Guardrail: sets the task and observes; never writes the fix.
PRODUCTION & EVALUATION PROSECUTOR — the Jover-role, decisive #9 · poacher/set-piece-specialist · Claude Opus · RT (GREEN days) · drills the most-skipped round: LLM-as-judge + biases, RAGAS metrics, eval-as-CI-gate, replay→canary→A/B, catching regressions · Guardrail: prosecutes his reasoning; never designs the eval suite. This round wins the offer.
APPLIED-FUNDAMENTALS RAPID-FIRE · winger · Gemini generates the bank; dual-graded · BATCH + RT (any readiness — lighter load) · embeddings, context windows, why-models-fail · Guardrail: asks and grades; no pre-answers.
BEHAVIORAL/STAR + DEFEND-YOUR-BUILD CROSS-EXAMINER · captain/no.10 · Gemini generates prompts; Claude cross-examines (Opus for cross-exam, Sonnet for STAR grading) · RT · cross-examines every FinOps Copilot decision ("why RRF over weighted? why this chunk size? where would you NOT use an LLM here?") · Guardrail: challenges his decisions; never makes them. Builds the "when NOT to use AI" signal.
DSA DRILL · impact sub · Gemini generates sets; Claude hints-only · BATCH + short RT reps · LeetCode-medium warmup · Guardrail: gives the problem and process-hints; never the solution.
THE NEMESIS — persistent striker · relentless CF/individual-development-plan · Claude Routine (overnight) + Gemini bulk re-drills · BATCH · maintains weaknesses.json (ranked recurring weaknesses); re-attacks the SAME weakness from new angles until calibration improves; commissions Gemini for 20 targeted re-drills for tomorrow · Guardrail: designs the re-attack; Nikhil answers. Uses externally-sourced question banks to avoid generic clustering.
(corrected 10 Aug 2026 — BUILT, and built as something narrower and more honest than this line describes. `scripts/nemesis.mjs` is DETERMINISTIC — no Claude Routine, no overnight cloud run, no Gemini commission of "20 targeted re-drills". It runs as the `nemesis` step of the MORNING chain in `conductor.mjs` (`grep -n "nemesis" scripts/conductor.mjs`), and it is the SINGLE WRITER of `weaknesses.json` — its header says so in as many words: "Single writer of weaknesses.json (Fork A3: Nemesis writes the FILE, the Manager writes the surfaced team-sheet LINE)" (`grep -n "Single writer of weaknesses.json" scripts/nemesis.mjs`). That settles the ownership contradiction with §14, which still assigns the file to the Manager — see the §14 correction; `manager.mjs` only READS it (`grep -n "weaknesses: readJSON" scripts/manager.mjs`).
WHAT IT ACTUALLY COMPUTES, because the design sentence oversells it: its input is `reps_log.jsonl` as the SOLE truth source plus `concepts.json` for the axis vocabulary, and its unique signal is misses on DIFFERENT concepts CLUSTERING ON ONE AXIS — "the nemesis is a KIND OF THINKING, not a topic". It deliberately does NOT duplicate the neighbours: plain recurrence is FSRS's job, confident-wrong is Calibration's, and a guessed-wrong with no relapse is explicitly not counted as a miss. It ranks and it goes quiet when the evidence is thin (`axis_pattern` surfaces only above a concept-count AND a total-reps gate; otherwise null — bias-to-silence). It designs no drills and commissions nothing. Read it with `node scripts/nemesis.mjs recompute` and then the JSON; the file is gitignored as derived PII.)
SHIPPING UNIT (FinOps Copilot → deployed live API = the trophy)
JULES · async grunt-work sub · Gemini (AI Pro, 100 tasks/day) · async · scoped fixes (dependency bumps, test scaffolds, refactors → PRs) · Guardrail: scoped mechanical fixes only; Nikhil reviews/approves every PR.
CLAUDE CODE (hard build/review) · centre-back of the build · Claude Sonnet/Opus · RT · architecture review, hard debugging · Guardrail: Nikhil writes the code; Claude reviews.
EVAL-HARNESS ENGINEER · set-piece routine · Claude Sonnet guides; deterministic run · RT + BATCH nightly · guides building RAGAS (dev-time) + DeepEval in pytest as the CI regression gate (blocks merge if faithfulness/relevancy regress); nightly regression run posts go/no-go · Guardrail: guides the design; Nikhil writes the test cases + picks thresholds. This is the eval scoreboard that closes the learning↔shipping loop (§10, §13).
DEPLOY AGENT · the finisher · Claude Code guides · on-demand · containerize → live hosted API (THE TROPHY) + TruLens observability post-deploy · Guardrail: explains each step; Nikhil types every command.
RECRUITMENT DEPARTMENT (career/positioning — signed last, Phase 6)
JOB-MARKET SCANNER · scout · free Gemini API / Apps Script · BATCH daily → jobs_today.json (5 most-requested skills this week, new-vs-last diff, 3 postings; cite every claim) · Guardrail: informs the Maidan/curriculum; invents nothing.
RESUME/ATS OPTIMIZER · Gemini bulk variants; Claude final critique · on-demand · Guardrail: optimizes phrasing of his REAL achievements; never fabricates; Nikhil edits every bullet.
BUILD-IN-PUBLIC / LINKEDIN + SALARY-NEGOTIATION SIMULATOR · playmaking winger · Gemini drafts style; Claude critiques substance (build-in-public) · Claude Opus adversarial roleplay (negotiation) · 2–3×/week + late-stage · attacks the "invisible in private repos" gap; negotiation sim roleplays "I have another offer at ₹19L; market is ₹20–25L…" · Guardrail: drafts/rehearses; Nikhil writes the substance and sends/negotiates himself (generation effect).
THE BENCH (9 — signed only on a data-proven gap, Phases 3/7; §4 recruitment rule)
Defense bench (4): ADHD friction-reducer (one next-action, 60-sec start) · streak/consistency keeper · circadian scheduler (peak-window slotting) · sleep-consolidation timer (encode-vs-retrieve timing vs sleep).
Midfield bench (2): elaborative-interrogation ("why is this true?" only) · curriculum planner (sequences the multi-week plan; surfacing arm over the Forge foundations + Python-fluency states).
Shipping bench (3): Code-Review/PR Critic (Opus, read-only, flags don't fix) · Production-Readiness Enforcer (Haiku checklist: error-handling, latency, cost, logging, PII) · ADR Keeper (records Nikhil's architecture decisions verbatim for interview defense).

24 named + 9 benched = 33. No agent is signed speculatively — only when a tracked weakness or missed cadence proves the gap (Arteta's three recruitment questions, §4).
(checked 10 Aug 2026 — THE ARITHMETIC HOLDS: counting the named entries in §8 gives exactly 24 (Dugout 2 · Goalkeeper 1 · Defense 5 · Midfield 2 · Attack 7 · Shipping 4 · Recruitment 3) and the bench lists 4+2+3 = 9. 24 + 9 = 33. §15's cross-references (#4, #11–16, #17, #22, #24) all land on the right rows under that numbering.
THE CAVEAT THAT MATTERS MORE THAN THE COUNT: **the roster is a DESIGN document, not an inventory of what exists.** `scripts/` holds 75 tracked organs — far more files than there are roster slots — and the two sets do not map cleanly onto each other. Some roster slots have no code at all (Assistant Manager #2, Job-Market Scanner #22). Some organs have no roster slot at all (thalamus, cortex, hippocampus, distiller, dugout, watchman, conductor, groundsman — the whole cyborg-brain layer, which post-dates this document entirely; see `README.md`'s "two-speed cyborg brain" and `CYBORG_BRAIN.md`). And at least one name collides across the two without meaning the same thing (`scout.mjs`, §15). Before signing, extending, or declaring anything unbuilt, check the code: `git ls-files "scripts/*.mjs"`. Do not treat "33" as a ceiling that has been reached or a floor that has not.)

9. THE SECRET WEAPON — the Dual-Judge Jury (a single engine can never do this)
The sharpest learning edge: pit Claude and Gemini against each other with Nikhil in the middle. Their disagreements are where his blind spots live.

Workflow A — Dual-judge jury: Nikhil answers. Claude grades it against a rubric; Gemini independently grades the SAME answer (identities masked, order randomized to fight position bias). Both AGREE weak → real weakness. Both DISAGREE → 💎 the highest-value signal: a genuine blind spot or a model bias he must reason through himself.
Workflow B — Generator↔critic swap: Gemini generates the interrogation; Claude critiques the answer. Swap roles on alternate days → prevents overfitting to one model's style/question distribution.
Workflow C — Debate, Nikhil judges: Claude argues one approach to a contested FinOps design choice, Gemini the other; Nikhil adjudicates and justifies — itself a generation-effect exercise.
The human-in-the-middle rule: the models NEVER resolve disagreements between themselves. Nikhil resolves them. That IS the learning.
Evidence: single LLM judges show position, verbosity, and self-enhancement bias; a panel of diverse model families offsets individual biases (Ensemble-as-Judges; combining GPT-4-Turbo + Gemini-1.5-Pro reduced self-bias and improved human-ranking alignment). Mitigations baked in: randomized order, verbosity-penalized rubric, masked model identity. (Still directional, not ground truth — Nikhil is the final adjudicator by design.)

10. THE CORRELATION LOOPS + THE CLOSED LOOP (how the squad plays as a team, not as individuals)
L1 — Learning: FSRS + Curriculum surface a due card → Nikhil learns + Bolo → Retrieval-Drill tests → a miss → logged in weaknesses.json → Nemesis re-attacks that miss → FSRS reschedules. Circle closed.
L2 — Calibration: Nikhil states confidence → answers → Calibration compares → confident + wrong (the dangerous illusion) → that topic routed to Nemesis + FSRS, tighter interval. Blind-spots hunted.
L3 — Attack: front-three + Nemesis grill → each scorecard's weaknesses feed weaknesses.json → dual-jury disagreements also land there → tomorrow's mock auto-weights them. Sharper every day.
(corrected 10 Aug 2026, applies to L1 and L3 both — NOTHING WRITES INTO `weaknesses.json`. It is not an inbox that scorecards and juries deposit into; it is a DERIVED file with one writer that recomputes it whole. `scripts/nemesis.mjs` declares `reps_log.jsonl` its SOLE truth source and rebuilds the ranking each morning (`grep -n "SOLE truth source" scripts/nemesis.mjs`) — so the real edge is: a rep is captured → it lands in `reps_log.jsonl` → Nemesis re-derives the weakness ranking from the whole log. The correct way to "feed" a weakness is therefore to capture the rep (`capture.mjs`, the sole writer of the log), never to append to weaknesses.json — hand-editing a state file is forbidden anyway, and here it would simply be overwritten on the next recompute. Note also that Nemesis explicitly does NOT read `calibration.json`, by design, to avoid double-counting what the Calibration Coach already owns.)
L4 — Trophy: shipping-unit gets FinOps live → Eval-Prosecutor grills the live eval-harness → Build-in-Public makes it visible → proof becomes undeniable. Champions League + FA Cup together.
L5 — Override (above everything): the recalibrated Governor (Oura, §12) + the anti-procrastination gate sit above the Manager. Readiness RED (evidence-based convergence) → whole squad review-only. System-building time > study/ship time → new agents frozen. Health and focus always override.

THE CLOSED LOOP (v2 — the learning↔execution weld). The two layers — LEARNING (concepts, Python, spaced recall, defending decisions) and EXECUTION/SHIPPING (a live FinOps product + eval harness) — are not two organisms joined by a thin seam. They are one self-correcting control loop:

Feedback: the shipping layer's eval scoreboard (§13, #20) is the single source of truth. A failed test routes the error back into learning as the next thing to drill. Learning is validated only by whether the thing ships and passes evals — you can't fool the scoreboard. (Post-match review closing into the next match's plan — the KAL-line.)
Feedforward: because the Manager holds a model of the whole squad (Good Regulator), it anticipates — "next concept is hard and readiness is trending down → pre-emptively lighten the shipping load."
The flywheel: attack and defence feed each other — the shipping layer is only safe because the learning foundations are in position underneath it (rest defence), and every shipped feature feeds new learning targets while every learned concept sharpens the next shipped feature. This compounds; it does not go exponential. The multiplier is Nikhil's consistency; the ceiling is biology. Consistency of direction is the whole game — chasing shiny new plans is the "doom loop" that kills momentum (which is also exactly the ADHD-PI design requirement).

11. THE LEARNING-SCIENCE ENGINE (the levers + the evidence)
The midfield/defense operationalize the highest-utility findings in the science of learning. Nikhil produces; the agents only schedule, prompt, and grade.

Generation effect (Slamecka & Graf 1978): learner-produced information is retained far better than received information. → the produce-first rule.
Testing / retrieval-practice effect (Roediger & Karpicke 2006, Psychological Science 17(3):249–255): study-test-test-test forgot only 14% at one week vs 28% for restudy. Rowland 2014 meta-analysis: mean g = 0.50 across 159 effect sizes. Always pair retrieval with feedback (retrieval alone failed to help complex math without feedback). → Retrieval Drill-Master.
Spaced repetition via FSRS (Difficulty/Stability/Retrievability; Anki's default since v23.10, Nov 2023): ~20–30% fewer reviews than SM-2 for equal retention (simulation on 500M+ reviews). → FSRS Scheduler.
Interleaving (Bjork): mixing problem types beats blocking for transfer, at the cost of feeling harder. → Interleaving Coordinator.
Desirable difficulties — with a boundary condition: on very-high-element-interactivity material, difficulties can become undesirable when working memory overloads, so scaffolding intensity scales with topic difficulty.
Elaborative interrogation (g ≈ 0.56) and self-explanation (Bisra et al., 64 studies, g = 0.55): "why is this true?" and "explain it plainly." → Feynman/self-explanation + elaborative-interrogation agents.
Metacognition / calibration: predict-then-check with a Brier score (Murphy 1973 decomposition: calibration / resolution / uncertainty) surfaces overconfidence and unknown-unknowns. → Calibration Coach. (corrected 10 Aug 2026: the SCIENCE here is untouched and the citation is correct — but the SHIPPED Calibration Coach does not compute a Brier score. `scripts/calibration.mjs` computes ECE over his three gut-words (knew / shaky / guessed) and publishes it as `calibration_gap` (`grep -n "Expected Calibration Error" scripts/calibration.mjs`). Full detail in the §8 correction on that agent. Anywhere this document says "Brier" as a description of what the system MEASURES — §17's Phase-2 gate and §18's primary-KPI line — read ECE.)
Successive relearning, transfer (near/far/OOD), the protégé effect (learning-by-teaching / build-in-public), dual coding (verbal+visual) — folded across the squad.
The honest ceiling (v2 — baked as law): deliberate practice governs how you improve, but the ceiling is real and biological — Macnamara/Hambrick 2014 found practice explained 26%/21%/18%/4%/<1% of performance variance across games/music/sports/education/professions. The system multiplies the direction and quality of effort, not the raw quantity. "10x" is a motivational frame; the accurate frame is compounding, self-correcting, directed-efficiency. Do NOT cite "10,000 hours" as a law (Gladwell's round number, not Ericsson's claim).
Integration note: these agents must INTEGRATE with, not duplicate, Nikhil's existing learning systems (the Forge foundations capsules + the Python reps track). Reconcile at build time — the squad's learning agents extend those, they don't replace them. (updated 10 Aug 2026 — "reconcile at build time" HAPPENED, and the result is a whole layer this document has never named. It lives at `learning-layer/` in this repo (`ls learning-layer/`) and it carries its own canon: `PROJECT_OS.md` (the method, the axes, the hard rules, the VISUALIZATION CONTRACT), `FORGE_SPEC.md` (capsule schema + the doubt quality-bar), `FORGE_DESIGN.md` (visual design), `HOW_HE_LEARNS.md` (forensic evidence, not canon), with `LEARNING_LAYER_MAP.md` as the index. Its code owners exist too — `forge_session.mjs` paces a session, `rejirah.mjs` owns which axes return and how hard, `python_state.mjs` holds the Python track, `widget.mjs` is the visualization registry. THE PRECEDENCE POINT, so nobody re-derives it here: on anything about how he studies, that layer's canon is authoritative and this section is background science. This masterplan is not the place to plan the learning layer.)

12. THE GOALKEEPER — Oura Cognitive-Performance Coach (FULL SPEC v2 — RECALIBRATED)
(VERIFIED AGAINST THE CODE, 10 Aug 2026 — this is the section that held up best, and it is worth
recording that rather than only recording failures. `scripts/oura_coach.mjs` implements this spec
faithfully: the confidence tiers are real (LOW-confidence RHR/HRV/temperature are surfaced as
information and can never on their own produce AMBER or RED); RED is convergence-gated exactly as
§12b describes — "sustained multi-day convergence: sleep-architecture collapse (deep+REM) + a
second axis"; the sleep need is his own ~6.5h floor and never the textbook 8h (`fallbackNeedH: 6.5`,
with an explicit comment that the need may be raised above that floor but never sunk below it);
sleep-vs-personal-baseline rides Oura's own baseline-normalized `sleep_balance` contributor; and
the DOCTOR-REFERRAL text is present and refuses to interpret. The layering rule was honoured — the
pre-§12 engine is frozen verbatim as `analyzeLegacy`. §12's own status claim elsewhere in this
document (§8, §16: "MUST be recalibrated before it's trusted") is what was wrong, not §12.
Two boundaries stated precisely below: the akathisia trigger (§12d) and the Oura app/secret
position (§12e).)
Nikhil is a mental athlete — and a specific one: a high-dopamine, obsessive, addictive-trait, medicated ADHD-PI workaholic whose 8–12h grind is psychiatrist-validated harmonious passion, not pathology. This coach treats Oura data like an elite sports-science department treats a physical athlete — but governs COGNITIVE load, and it is calibrated to HIM, not to a population average. The v1 spec was already partly calibrated (medicated baselines, HR = low-confidence, sleep weighted higher, intake correlator, doctor-referral). v2 completes the calibration per the dedicated research brief. The core reframe: the Governor's power is unchanged; its trigger is recalibrated. It HONORS the grind by default and fires only on a narrow, evidence-based band — because for a grinder like this, an ignored brake is more dangerous than a weak one, and a generic brake gets ignored. Accurate power is the only safe power.

12.0 The recalibration in one breath (the philosophy — v2)
Metric = engagement-quality + baseline-deviation, NEVER hours. Long hours alone are a poor proxy (Vallerand's harmonious-vs-obsessive passion; Schaufeli's engagement-vs-workaholism — the marker is compulsion, whether he can stop and whether stopping brings guilt, not volume). His grind is harmonious passion → honored.
Confidence-tier every signal (below). Cardiac/temperature signals are medication-confounded and can never drive a RED alone.
RED = multi-day CONVERGENCE of HIGH-confidence signals only — never a single reading, never hours.
The athletic auto-deload is softened for cognitive work (Marcora: mental fatigue raises perceived effort, it doesn't deplete muscle; a blind "train hard → forced deload" rule would rest him when he's thriving and teach him to distrust the brake).
Akathisia caveat + hard medical boundary (below) are non-negotiable.
12a. Signals to pull + personal baselines
Pull daily (last ~40 days for baselines): daily_readiness (score, temperature_deviation, contributors), daily_sleep, detailed sleep (durations, average_hrv, lowest_heart_rate, average_breath, sleep_phase_5_min hypnogram, bedtimes, efficiency, latency, restless_periods), daily_spo2 (average + breathing_disturbance_index), daily_stress (day_summary), daily_resilience (level + contributors); monthly: vo2_max, daily_cardiovascular_age.

Compute HIS OWN (medicated) baselines, robust to nulls, on rolling 7-day vs 30-day deviations, not absolute cutoffs:

hrv_7d = median(average_hrv, last 7); hrv_base = median(last 60); hrv_sd = SD(last 60); SWC = 0.5 × hrv_sd (smallest worthwhile change). Optionally log-transform (ln rMSSD) first.
rhr_base = median(lowest_heart_rate, last 14–28); rr_base = median(average_breath); deep_base, rem_base, tst_base = rolling medians.
Sleep-need target = ~6.5h (his NORMAL is 6–7h — NOT debt; see LOCKED). Sleep-debt ledger = Σ(need − total_sleep) over 14 days computed against his 6.5h band, never the textbook 8h. Only a drop BELOW his own 6–7h band counts.
12b. Daily verdict logic (GREEN / AMBER / RED) — CONFIDENCE-TIERED, CONVERGENCE-GATED (v2)
SIGNAL CONFIDENCE TIERS (the technical heart of the recalibration):

HIGH confidence (these drive the verdict):
Sleep-architecture trends over multiple nights (TST, efficiency, fragmentation, deep + REM duration vs HIS medicated baseline — read multi-night, never a single night; Oura is strong on sleep/wake ~92% and REM but weakest on deep sleep).
Resilience (Oura's multi-day integrator) as a slow-moving strain gauge.
Actual work output/quality (the cognitive analog of an overtrained athlete's "same effort, worse performance").
Behavioral stop-ability (can he stop when he chooses? does stopping bring guilt? — harmonious/flexible vs obsessive/rigid persistence).
LOW confidence (discount; sustained personal-baseline deltas only, NEVER absolute, NEVER a RED on their own):
Absolute resting HR (the stimulant/SNRI classes push it up; the cognitive-support/antipsychotic classes push it down — net is individual + confounded).
Absolute HRV (broadly suppressed by the stack; no population norm exists anyway).
Body-temperature deviation (SNRI-class sweating confounds it).
Single-night deep-sleep numbers (caffeine SWS-suppression + device limits).
SpO2 / respiratory rate (stable but low specificity for cognitive strain).

THE VERDICT (anchor on Oura's own readiness.score, which already partly normalizes to his baseline, then apply the tiers):

GREEN (push/peak) — the default for a thriving grinder. HIGH-confidence signals holding (sleep-architecture trend stable/strong, resilience solid+, output holding). → HIGH cognitive-load ceiling. Grind honored: hardest adversarial work in the circadian peaks, full 90-min blocks. A long grind day is GREEN when the real signals hold — hours are not a strike. (Nocebo guard: if he feels great, a mediocre score downgrades, never aborts.)
AMBER (maintain/skill) — a "show your doctor / watch" flag, not a throttle. Fires when ≥2 HIGH-confidence signals deviate from his baseline for ≥3–4 days (the overtraining literature's minimum window before autonomic markers mean anything). → MODERATE. Favor retrieval + spaced review + consolidation over first-exposure hard material; shorter blocks; a movement session. AMBER is lighter work, never zero.
RED (deload/recover) — RARE, and only on CONVERGENCE. Fires only on a sustained multi-day convergence of HIGH-confidence signals — e.g. deep+REM collapse AND resilience decline AND output drop, together, over multiple days. → LOW. No novel high-stakes drilling; light review/admin/rest; protect sleep. A single confounded reading (RHR/HRV/temp) or a long-hours day can NEVER trigger RED. When RED fires, the Gaffer frames it as "the real signals converged and rotation is how deep squads win," never "you worked too long" (see THE_GAFFER §4 RED).

Work-TYPE overlay from sleep architecture (the coaching richness, not just a colour):

deep ≥ base & not sleep-deficit → "Encoding primed — front-load new declarative/factual learning early."
rem ≥ base → "Integration primed — schedule creative synthesis / system design / connecting concepts."
both low or total sleep well below his 6.5h band or low efficiency/high WASO → "Encoding capacity reduced (up to ~40% for new memories) — do retrieval/review, not first-exposure learning."
high BDI / low SpO2 → "Expect blunted attention — more breaks, defer attention-heaviest tasks."

Timing (circadian + ultradian): hardest work ~4–7h and ~10–15h post-wake (derive from bedtime_end + chronotype); admin in the ~8–9h post-wake post-lunch dip; ~90-min BRAC blocks with real (non-screen) breaks; movement snack every 30–60 min against inactivity alerts.

12c. Longitudinal periodization — SOFTENED for cognitive work (v2)
Interview prep still rhymes with athletic periodization — but the physical-athlete overtraining model transfers only partially, so the hard auto-deload rules are re-scoped:

Microcycle (1 wk): 5–6 training days + 1–2 lighter — but "lighter" is Nikhil's call, honored, not forced. Mesocycle (3–4 wk): progressive-overload weeks + a deload when the HIGH-confidence signals ask for it, not on a fixed 3:1 calendar. Macrocycle (whole prep): base-building → specific/heavy → taper (final 7–10 days before a real interview: cut volume, keep short sharp mocks; aim for readiness/HRV/resilience to peak on the day — supercompensation).
v2 CHANGE — the deload is no longer mandatory-on-a-metric. v1 said "Mandatory deload if hrv_7d drops >5% below baseline … for ≥3–5 days AND RHR elevated >5 bpm AND resilience trending down." That athletic auto-deload is softened: because HRV/RHR are LOW-confidence for him and forcing rest on a thriving grinder trains him to ignore the brake, this pattern now raises a "show your doctor / consider easing" AMBER flag, not a forced deload. A deload is only enforced (RED) on the multi-day convergence of HIGH-confidence signals (§12b). Green-light progression only if last week's mean readiness is solid + HIGH-confidence signals stable/rising. Slow-drift detection on 28-day trends (falling sleep-architecture baseline, resilience sliding, output declining) → surface an early "watch" flag. Sleep-debt vs his 6.5h band, sustained → a sleep-first suggestion (not a forced week).
12d. MEDICAL CONTEXT & SAFETY (non-negotiable — DATA-INTERPRETATION only, NEVER med advice)
Nikhil's exact stack (drug names, brands, doses, timing) lives ONLY in the gitignored intake_log.json — NEVER in this public file (privacy scrub, 17 Jul 2026). What the design needs to know, in classes only: a stimulant, an SNRI, an atypical antipsychotic (see the akathisia caveat below), a cognitive-support combo, standard supplements, and caffeine ×2–3/day.

Design implications (baked into the coach — v2):

Cardiac/temperature signals are LOW-CONFIDENCE and confounded in opposite directions: the stimulant + SNRI raise HR / suppress HRV; the cognitive-support + antipsychotic classes lower HR; SNRI sweating confounds temperature; caffeine suppresses deep sleep; one class raises REM while others suppress it. Absolute values are nearly uninterpretable — only stable personal-baseline deviations carry signal, and even then they can't drive a RED alone. (At his dose level the SNRI's noradrenergic HR effect is likely attenuated; directions are reliable, magnitudes are not.)
Sleep-architecture trends, resilience, and actual output are weighted HIGHER (less confounded, read multi-night).
Intake Correlator: the coach reads state/intake_log.json (his logged med/supplement/caffeine timing — NOT fixed, ADHD-PI, so he logs daily; older days sparse OK). Late caffeine/stimulant → low REM / high latency is flagged as an expected medication-timing effect, NOT under-recovery ("not counted against you").
🆕 AKATHISIA CAVEAT (v2 — safety-critical). The atypical antipsychotic in his stack can cause akathisia / restlessness / agitation that mimics psychiatric worsening — and the literature shows even clinicians frequently misread it and escalate the very drug causing it. Therefore any mood / agitation / irritability signal routes to a "show your doctor" report that explicitly lists akathisia as a differential (possible akathisia OR mood shift OR early burnout) — the coach NEVER self-interprets it, never attributes it, never comments on the drug. (precision added 10 Aug 2026 — the RULE is implemented; the TRIGGER is not, and the difference is worth stating exactly so nobody assumes coverage that does not exist. `scripts/oura_coach.mjs` carries the caveat verbatim in its medical-boundary block and in a constant it emits (`grep -n "akathisia" scripts/oura_coach.mjs`), so if a mood flag ever arrives the routing text is already correct and already refuses to self-interpret. But the file states plainly that no such flag is ingested: "Any mood/agitation flag (**NOT wired here, by decision**)". Oura supplies no mood/agitation stream, so there is nothing to wire it to today. READ THIS AS: the safety rule is armed, the sensor is absent. Nothing is silently self-interpreting a mood signal — but neither is anything watching for one. The DOCTOR-REFERRAL path for sustained physiology IS live and fires on real data (`grep -n "SEE A DOCTOR" scripts/oura_coach.mjs`).)
HARD SAFETY BOUNDARY (unchanged, reinforced): sustained concerning physiology → a DOCTOR-REFERRAL flag that states "this is a pattern to show your doctor," with the raw trends attached, and NEVER interprets it medically, comments on meds/doses, diagnoses, or suggests any treatment change. Claude is a data-analyst here, not a prescriber. "Your medication is causing this" / "reduce your dose" / "you have burnout" are hard-blocked. This regimen + 12-hour cognitive load + interview pressure should be monitored by his physician; the coach is never a substitute.
12e. Oura API v2 integration facts (verified)
Base https://api.ouraring.com/v2/usercollection/…; OAuth2 bearer. Personal access tokens were deprecated Dec 2025 → OAuth2 required.
Authorize: https://cloud.ouraring.com/oauth/authorize (response_type=code, client_id, redirect_uri, scope, state). Token exchange + refresh: POST https://api.ouraring.com/oauth/token. CRITICAL: persist the rotated refresh_token on every refresh (old one is invalidated). Client-flow tokens ~30-day expiry.
Scopes: email personal daily heartrate workout tag session spo2 (app created with all scopes). Rate limit 5000 req / 5 min. Multi-doc GET returns {data:[...], next_token}; single-doc returns the object. Hypnogram sleep_phase_5_min: '1'=deep, '2'=light, '3'=REM, '4'=awake. Data available mid-morning after sync (pull ~08:00–08:30 for the previous night; data can lag 1–2 days until the phone syncs). All fields can be null — null-guard everything. Dev-mode endpoints (resilience, cardiovascular_age, vo2_max) may 401 → skip gracefully. Oura web dashboard is being discontinued later 2026; the API is unaffected.
Existing OAuth app: created at developer.ouraring.com, name arsenal-ai-fc, redirect_uri http://localhost:8080/callback, all scopes. Client ID + Secret obtained. ⚠️ The secret leaked in a screenshot → REGENERATE it before wiring the recalibrated build. Must be logged into the correct Oura account in-browser before OAuth consent.
(verified 10 Aug 2026 against `scripts/oura_auth.mjs`, which is the code that actually performs the flow — every mechanical detail in §12e holds: `REDIRECT = "http://localhost:8080/callback"`, `AUTH_URL = "https://cloud.ouraring.com/oauth/authorize"`, `TOKEN_URL = "https://api.ouraring.com/oauth/token"`, and the coach's `BASE = "https://api.ouraring.com/v2/usercollection"` (`grep -n "REDIRECT\|AUTH_URL\|TOKEN_URL" scripts/oura_auth.mjs`, `grep -n "const BASE" scripts/oura_coach.mjs`). The credential files live at `scripts/oura_secrets.json` and `scripts/oura_tokens.json` (`grep -n "TOKENS_FILE\|SECRETS_FILE" scripts/oura_coach.mjs`); both are present on this machine and NEITHER is tracked — `git ls-files | grep -i oura` returns only the two .mjs files. The root `.gitignore` covers them by name AND by `**/` glob, which is what makes their living inside `scripts/` safe. §14's tree draws that .gitignore in the wrong place — corrected there.
STATUS OF THE ⚠️, stated honestly rather than resolved: the recalibrated build IS wired and HAS run on live data, so the "before wiring" deadline has passed either way. **NOT VERIFIED 10 Aug 2026 — whether the leaked secret was actually regenerated could not be confirmed from code.** A secret's value cannot be checked against its own history, the file is correctly untracked so git holds no record, and reading the credential to compare it is not something a doc pass should do. Treat the warning as OPEN until he says otherwise; `setup/SECRETS_RUNBOOK.md` is where the rotation procedure lives.)
12f. Pitfalls (a good coach prevents these)
Orthosomnia (Baron et al., J Clin Sleep Med 2017): obsessive metric-chasing creates the anxiety it's meant to fix — worst in Type-A high-achievers (exactly Nikhil). Guardrail: check once each morning (08:30), act, close the app; coach on trends never single days; build in "data holidays." (This is why cadence is once/day, not mid-day pulses — aligned with audits-minimised.)
Nocebo: a bad score can manufacture fatigue. Guardrail: if he feels great, a mediocre score should downgrade not abort.
Consumer-grade accuracy: can't stage sleep to PSG standard (deep-sleep sensitivity ~64–79.5% across studies — read multi-night trends, not single-night verdicts); temperature is skin not core; VO2/vascular-age are estimates. Guardrail: relative deviations from his own baseline, not absolutes.
HRV confounds / correlation≠causation: keep a light log of actual cognitive output and periodically check whether the biometric predictions actually track his performance; recalibrate to his data (if his subjective fatigue does track biometrics over a validation period, raise the self-report weight). When to IGNORE entirely: acute life stress, travel, a known one-off late night, ring removed/low battery, or any illness where he should just rest.
Individual evidence is thin at the intersection — most passion/flow/interoception findings are group-level; treat every principle as a prior to be updated with his own n-of-1 data. If his psychiatrist adjusts the stack, re-baseline before trusting any trend.

13. THE SHIPPING UNIT & EVAL STACK (getting FinOps Copilot to a deployed, evaluated live API)
(STATUS CHECK, 10 Aug 2026 — NONE OF THIS IS BUILT YET, and that is worth stating plainly because
the section reads like a description of a running stack. There is no RAGAS harness, no DeepEval
CI gate, no TruLens wiring and no deployed endpoint anywhere in this repo — `grep -rln -i "ragas\|deepeval\|trulens" scripts/`
returns nothing. FinOps Copilot appears in the organism only as a TARGET: as the trophy string in
the Manager's season fixtures (`grep -n "FinOps Copilot" scripts/manager.mjs`) and as sprint/learning
items. `season.json`, which would carry `trophy_state`, is not present on this machine.
CONSEQUENCE FOR THE CLOSED LOOP: §10 and §17 both lean on "the eval scoreboard is the single source
of truth" — that scoreboard does not exist yet, so the learning↔shipping weld is currently
one-sided. The thresholds below (faithfulness ≥0.75–0.80 etc.) remain unchosen defaults from the
literature, not configured values; §17's own line already says Nikhil picks his own. The design in
this section is untouched and still the plan of record — this note only marks that it is a PLAN.)
RAGAS — reference-free dev-time RAG evaluation: faithfulness (supported claims / total), answer relevancy, context precision (are relevant chunks ranked highest), context recall. Use for chunking/embedding experiments + sampling production traces.
DeepEval — Pytest-native; assert_test as a CI regression gate that fails the build when a metric regresses. Common 2026 pattern: DeepEval owns the PR quality gate; RAGAS samples production. Recommended thresholds ≈ faithfulness ≥ 0.75–0.80, answer relevancy ≥ 0.80, context precision ≥ 0.70, context recall ≥ 0.80 (Nikhil picks/tunes his own). This eval harness IS the scoreboard that closes the learning↔shipping loop (§10): a failed metric routes the error back into what he drills next.
TruLens — post-deploy observability (drift, live traces).
Deploy path — containerize → live hosted API endpoint. Guided Socratically; Nikhil types every command and writes every Dockerfile line (deployment/cloud is his biggest gap, so it's high-value learning, not to be automated away).
ADRs — every architecture decision recorded so it's defensible in the interview ("why RRF? why this chunk size? where would you NOT use an LLM?"). Finance concepts (TDS, invoice, reconciliation) are taught from zero — no assumed recall from the stale Zomato background.

14. THE DRESSING ROOM (repo file layout + single-writer rules)
Repo: github.com/nikhil1429/arsenal-ai-fc (private). Local path C:\Users\nikhi\GitHub\arsenal-ai-fc (moved off OneDrive), branch main. Both engines read/write plain markdown/JSON. Single-writer rule: every file has exactly ONE writer process; everyone else reads. Commits are the audit log.

🚨 CORRECTED 10 Aug 2026 — **THE REPO IS PUBLIC, NOT PRIVATE.** This is the single most dangerous
line in the document, because every judgement about what may be committed hangs off it. Evidence,
from the authority rather than from any doc: `curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc`
returns HTTP 200 **unauthenticated** and the payload reads `"private": false`. An unauthenticated
200 is itself the proof — a private repo would 404 to an anonymous caller. The repo's own
`.gitignore` has known this for a long time and says so at the top of its secrets block: "SECRETS
& TOKENS — never commit (repo is public)". §16 repeats the "private" claim in its DONE list and is
corrected there as well. PRACTICAL CONSEQUENCE, since this is where the mistake would be made: do
not reason "it's a private repo, this is fine" about anything — biometric data, medication timing,
conversation text, credentials. The gitignore is a hand-written DENYLIST, so a new state file is
NOT protected until someone adds it, and `git add -A` is the command that publishes it. Glance
before every push.

(corrected 10 Aug 2026 — the branch and the local path both hold: `git remote -v` → origin
https://github.com/nikhil1429/arsenal-ai-fc.git, branch main, working tree at
C:\Users\nikhi\GitHub\arsenal-ai-fc. The single-writer sentence carries the same over-claim as §5's
— see that correction for the one documented exception (`brain_ledger.jsonl`, a shared append lane)
and the one real breach (`identity_facts.pending.jsonl`, two writers, needs his ruling).)

arsenal-ai-fc/

  ARSENAL_AI_FC_MASTERPLAN.md   # THIS FILE — canonical plan (read-only reference)

  THE_MANAGER__Master_Prompt.md # the Manager's brain/charter (read for the Manager build)

  THE_GAFFER.md                 # the Manager's voice/soul (M-2 system.md source)

  OPS_STATE.md                  # live thread-agnostic state (read EVERY thread)

  README.md                     # dressing-room layout + single-writer rules + trophy state

  dressing-room/

    constitution.md             # THE WALL — read-only for all agents (never auto-edited)

    team_sheet.md               # writer: Manager (Opus) only

    manager/system.md           # the Manager's soul (= THE_GAFFER + THE_MANAGER content)

    state/

      readiness.json            # writer: Oura Governor cron only

      timeaudit.json            # writer: ActivityWatch cron only

      calibration.json          # writer: calibration cron only

      weaknesses.json           # writer: Manager only

      intake_log.json           # writer: Nikhil (daily med/supplement/caffeine timing)

      manager_notes.json        # writer: manager.mjs wrapper only (counters/last-talks)

      learning_state.json       # writer: curriculum/learning cron (held-vs-fluent state)

    question_bank/*.json        # writer: Gemini generator

    cards/*.json                # writer: FSRS cron

    transcripts/                # append-only; any interviewer appends its own file

    post_match/*.md             # writer: Manager only

  scripts/                      # deterministic referees (Oura, ActivityWatch, FSRS) — zero LLM tokens

    manager.mjs                 # the Manager's deterministic wrapper (M-1)

    oura_coach.mjs              # the Goalkeeper (recalibrated per §12)

    timeaudit.mjs               # the Time-Auditor (LIVE)

    .gitignore                  # ignores oura_secrets.json, oura_tokens.json

🔧 THE TREE ABOVE IS A JULY-2026 SNAPSHOT AND IS NOW WRONG IN MOST OF ITS PATHS — corrected
10 Aug 2026, line by line, against the live filesystem. It is kept verbatim (layering rule: the
old plan is never silently overwritten) but do NOT navigate by it. Read the real layout with
`ls dressing-room/`, `ls dressing-room/state/`, `git ls-files "scripts/*.mjs"`.

WHAT IS STILL TRUE: the four root canon files (`ARSENAL_AI_FC_MASTERPLAN.md`,
`THE_MANAGER__Master_Prompt.md`, `THE_GAFFER.md`, `OPS_STATE.md`) are all present at the repo
root and committed; `README.md` is present; `dressing-room/manager/system.md` exists (46 KB on
disk, not a stub); `dressing-room/state/` is the bus.

WHAT IS WRONG:
· `dressing-room/constitution.md` — DOES NOT EXIST and never did. Full evidence in the §5
  correction (`git log --all -- dressing-room/constitution.md` is empty). The README annotation
  "THE WALL — read-only for all agents" describes a file with no history.
· `dressing-room/team_sheet.md` — WRONG LEVEL. It is `dressing-room/state/team_sheet.md`
  (`grep -n "team_sheet.md" scripts/manager.mjs`, which resolves it under the state dir).
· `dressing-room/post_match/*.md` — WRONG LEVEL. It is `dressing-room/state/post_match/`
  (`grep -n "post_match" scripts/outwork_audit.mjs`). The directory is gitignored and was not
  present on this machine when checked — absent, not misplaced. AND THE WRITER IS WRONG: the
  owner is `scripts/postmatch.mjs`, not the Manager (see the §8 Manager correction).
· `dressing-room/question_bank/*.json` — DOES NOT EXIST. Nothing writes that path.
· `dressing-room/cards/*.json` — DOES NOT EXIST as a directory. It is ONE file,
  `dressing-room/state/cards.json`, plus `fsrs_store.json`, both owned by `scripts/fsrs.mjs`.
· `dressing-room/transcripts/` — DOES NOT EXIST.
· `state/weaknesses.json  # writer: Manager only` — **WRONG OWNER, and this one has teeth.** The
  sole writer is `scripts/nemesis.mjs`, which says so in its own header; `manager.mjs` only reads
  it. Believing the Manager owns it is how a second writer gets added to a single-writer file.
· `state/learning_state.json  # writer: curriculum/learning cron` — the owner has a name now:
  `scripts/learning_state.mjs` (`grep -n "learning_state.json" scripts/learning_state.mjs`). Do
  not confuse it with `scripts/learnstate.mjs`, a DIFFERENT script that assembles the SessionStart
  brief and only READS the state files. Two similarly-named scripts, one letter apart.
· `state/manager_notes.json  # writer: manager.mjs wrapper only (counters/last-talks)` — owner
  correct, description off: it is a RUN LOG, and explicitly not the match counter.
· `scripts/.gitignore` — **THERE IS NO .gitignore IN scripts/.** `ls scripts/.gitignore` → no such
  file; `git ls-files | grep -i gitignore` returns exactly one path: `.gitignore` at the REPO ROOT.
  It does ignore `oura_secrets.json` and `oura_tokens.json`, both by bare name and by `**/` glob,
  which is why those files are safe living inside `scripts/`. This matters: a session that trusts
  the tree might CREATE `scripts/.gitignore` and assume coverage that is already handled elsewhere.
· `scripts/` listing only three files — the directory now holds **75 tracked .mjs organs**. That
  number is already rotting as you read it: count it live with `git ls-files "scripts/*.mjs"`,
  never from this page.
· The tree omits, entirely: `learning-layer/`, `setup/`, `hooks/`, `.claude/skills/`,
  `dressing-room/missions/`, `dressing-room/hippocampus/`, `dressing-room/club/`,
  `dressing-room/SEASON.md`, and the ~40 root .md files. Omission is not an error in a plan
  written before they existed — it is a reason not to use this tree as a map today.

(v1 caveat retired: the repo has been moved off OneDrive to C:\Users\nikhi\GitHub\ — the OneDrive git sync-conflict risk no longer applies.)

15. RELATIONSHIP TO THE EXISTING ACCOUNTABILITY-RIG
Nikhil already built a Tier-2 Accountability Rig at C:\Users\nikhi\accountability-rig — 6 Claude Code subagents (auditor, examiner/scrimmage, ledger-keeper, scout, curriculum, distribution) with ActivityWatch MCP already connected (server built from source at C:\Users\nikhi\activitywatch-mcp-server; buckets include aw-watcher-web-chrome*). Arsenal AI FC is the evolution/superset of that rig into a full dual-engine interview-prep + accountability + shipping squad.

Mapping (reuse, don't duplicate): rig auditor → Time-Auditor (#4); examiner/scrimmage → the attacking interviewers (#11–16) + Nemesis (#17); ledger-keeper → the weaknesses store feeding Nemesis; scout → Job-Market Scanner (#22); curriculum → Curriculum planner (surfacing arm reading the Forge foundations + Python fluency states); distribution → Build-in-Public (#24). At build time, reconcile the rig's existing agents into the squad rather than rebuilding them from scratch — especially the already-working ActivityWatch connection (reuse it for #4). Reconciliation is currently PARKED (Time-Auditor already reuses the rig's AW connection and is live).
(checked 10 Aug 2026 — BOTH PATHS STILL EXIST on this machine: `C:\Users\nikhi\accountability-rig` and `C:\Users\nikhi\activitywatch-mcp-server` are present, so the rig has not been deleted or absorbed. The AW reuse holds: `scripts/timeaudit.mjs` talks to `http://localhost:5600` directly, so the Time-Auditor rides the same ActivityWatch install rather than a second one.
ONE MAPPING ROW HAS SINCE BECOME A FALSE FRIEND: "scout → Job-Market Scanner (#22)". A `scripts/scout.mjs` now exists in THIS repo and it is **not** the job scanner — its header names it "THE ADVANCE SCOUT", a feedforward organ that stages scrimmages and FinOps briefs off threshold triggers on real state, and it also runs the Gemini MISSIONS DESK (`grep -n "THE ADVANCE SCOUT" scripts/scout.mjs`; `grep -n "mission" scripts/scout.mjs`). It runs as the `scout` step of the EVENING chain. The Job-Market Scanner (roster #22) remains UNBUILT — nothing in `scripts/` writes a `jobs_today.json`. Do not read the filename as evidence that #22 shipped, and do not extend `scout.mjs` into a job scanner on the strength of a name collision.
The word "PARKED" is left as written: whether he still considers the reconciliation parked is HIS call, not something code can answer. **NOT VERIFIED 10 Aug 2026** as a current intention.)

16. CURRENT BUILD STATE (as of 09 Jul 2026)

🚨 THIS ENTIRE SECTION IS A 09 JUL 2026 SNAPSHOT AND WAS A MONTH OUT OF DATE WHEN AUDITED ON
10 AUG 2026. It is preserved verbatim below — that is this repo's layering rule, and the snapshot
is genuinely useful as a record of where the build stood. But it is NOT current state, and it had
started doing damage: read as live, it says the Goalkeeper still needs recalibrating and the
Manager has "zero code written yet", which is how a session ends up re-planning finished work.
THE HEADLINE CORRECTIONS, each with the command that proves it:
· **The repo is PUBLIC, not private** — see the 🚨 block in §14. `curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc`
  → HTTP 200 unauthenticated, `"private": false`.
· **`dressing-room/constitution.md` was never created** — it is listed as ✅ below and has no git
  history at all (§5 correction).
· **The Goalkeeper recalibration is DONE and has run on his real body data** — `readiness.json`
  carries `"engine": "v2-recalibrated"` with a live AMBER verdict for `2026-08-04`, and
  `oura_coach.mjs` froze the old engine as `analyzeLegacy` per the layering rule. The
  "LIVE-vs-REBUILD CONFLICT" below is CLOSED.
· **The Manager is BUILT, M-1 through M-5** — "zero code written yet" is the single most wrong
  sentence in this section. `node scripts/manager.mjs selftest` passes with zero failures; M-3's
  `claude -p` swap is live in `brain.mjs` (`grep -n "manager_m3" scripts/brain.mjs`); its schedule
  is the `formation_read` job in `brain_config.json`. What is still genuinely his: the line-by-line
  captain review of `dressing-room/manager/system.md`.
· **The AutoPush referee exists under another name** — the nightly git lane is
  `scripts/groundsman.mjs`, fired by the Windows task **ArsenalFC-Groundsman-Push** (`Task To Run:
  … scripts\groundsman.mjs push`, start 03:45, Status Ready). Do not build a second one.
· **Scheduled tasks + ntfy are wired, not pending** — dozens of `ArsenalFC-*` tasks exist
  (`schtasks /query /fo csv /nh | findstr Arsenal`), with the morning and evening now consolidated
  into two conductor chains; ntfy push code lives in several organs (`grep -rln "ntfy" scripts/*.mjs`).
  Individual tasks are a mix of Ready and Disabled — read the live list, never a doc.
· **The signal-source cluster (§4 inputs) is COMPLETE and was built BEFORE the Manager** —
  `capture.mjs` (#0), `fsrs.mjs` (#1), `calibration.mjs` (#2), `nemesis.mjs` (#3),
  `learning_state.mjs` (#4), all five present and all five in the `squad:selftest` suite in
  `package.json`. The build order in this section predates that whole layer.
· **Scale**: `scripts/` holds 75 tracked `.mjs` organs — count live with
  `git ls-files "scripts/*.mjs"`, never from here. The three-script picture below is not wrong so
  much as prehistoric.
· **NOT VERIFIED 10 Aug 2026**: whether the leaked Oura client secret was ever regenerated. It
  cannot be established from code (see §12e). Treat the ⚠️ as OPEN.
THE ONE HONEST WAY TO READ CURRENT STATE: run the selftests and read the state files. `npm test`
is the authority on what is green (`package.json` calls it "the authority"); `node scripts/manager.mjs selftest`,
`node scripts/oura_coach.mjs selftest` and the rest answer per-organ. No document in this repo,
including this one, is a substitute.

DONE:

✅ Private repo nikhil1429/arsenal-ai-fc — moved off OneDrive to C:\Users\nikhi\GitHub\arsenal-ai-fc, branch main. (corrected 10 Aug 2026: PUBLIC, not private — `"private": false` from an unauthenticated GitHub API call. Path and branch hold.)
✅ dressing-room/ scaffold + dressing-room/constitution.md (6 non-negotiables + operating rules) + README.md. (corrected 10 Aug 2026: the scaffold and README are real; `dressing-room/constitution.md` is NOT — it has never been tracked in this repo and does not exist on disk. The six non-negotiables themselves are real and live inside `THE_MANAGER__Master_Prompt.md`. See §5.)
✅ Oura OAuth app created (client id + secret obtained). ⚠️ Secret leaked in a screenshot → MUST regenerate before wiring the recalibrated Goalkeeper.
✅ ARSENAL_AI_FC_MASTERPLAN.md (this file) — now v2.0 (two-brain coach + recalibrated Governor baked; drift reconciled).
✅ Time-Auditor (scripts/timeaudit.mjs) — LIVE + auto. Pulls real ActivityWatch → Learning/Building/Meta + on-track; buckets.json calibrated.
✅ 🆕 Agent 1 The Manager — DESIGN-COMPLETE (v2, god-tier). The two-brain coach fully specified across two companion files: THE_MANAGER__Master_Prompt.md (brain: two-brain anchor-model, formation-read, learning↔execution merge, closed loop, precedence, state-bus, Season Arc, the deterministic-wrapper split, §10 dummy data, §11 worked examples) + THE_GAFFER.md (voice: verified Arteta + Pep canon, recalibrated Governor lens, 3 honesty-overrides, self-bench rule). Design locked — only implementation (code) remains. (corrected 10 Aug 2026: implementation is DONE too — see the M-1→M-5 evidence in the §16 headline block and in §8. "Only implementation remains" was true on 09 Jul and stopped being true weeks ago.)

🔧 GOALKEEPER — LIVE-vs-REBUILD CONFLICT, NOW RESOLVED (v2):
(corrected 10 Aug 2026 — THE RESOLUTION WAS EXECUTED; this block now reads as an open instruction and is not one. The recalibration happened exactly as prescribed, including the layering: `analyzeLegacy` is frozen verbatim in `scripts/oura_coach.mjs` and `analyze` is what `main()` runs. It has produced live verdicts on his own data (`readiness.json`, engine `v2-recalibrated`, day 2026-08-04, AMBER). The instruction about the scheduled task — "the recalibrated build UPDATES/REPLACES this task; it does not create a duplicate" — was followed and then superseded: **ArsenalFC-Goalkeeper** still exists but is **Disabled**, and the body read moved into the ordered morning chain instead. Verify both live: `schtasks /query /tn "ArsenalFC-Goalkeeper" /fo list /v` and `grep -n "goalkeeper" scripts/conductor.mjs`. The only clause still open is the leaked-secret regeneration, which is NOT VERIFIED — see §12e.)

v1 §16 said the Oura scripts were "built but deferred → rebuild fresh"; OPS_STATE (09 Jul) said "Goalkeeper LIVE @ 08:30." Resolution: treat whatever is currently running as legacy. Its verdict engine predates the §12 recalibration, so it must be RECALIBRATED (not merely rebuilt) to the v2 §12 spec — metric = engagement not hours, confidence-tiers, convergence-only RED, softened auto-deload, akathisia caveat, honor-the-grind. The recalibrated §12 is the plan of record. The prior scripts (which passed 4 sandbox scenarios incl. the medication-confound → correctly-AMBER case) can be referenced, but the recalibration supersedes them. This is the first concrete code-change of the build (§17, Phase 0). Regenerate the leaked Oura secret first. The legacy Windows scheduled task is ArsenalFC-Goalkeeper (daily 08:30, StartWhenAvailable) — the recalibrated build UPDATES/REPLACES this task; it does not create a duplicate.

PENDING (not started — code):
(corrected 10 Aug 2026 — THIS LIST IS OBSOLETE. Three of its four rows shipped; the fourth is
partly shipped. Kept verbatim, struck through in meaning only, with the live position under each.)

Goalkeeper recalibrated (oura_coach.mjs to v2 §12) → live run + 08:30 auto-schedule. → **DONE.** `oura_coach.mjs` is the v2 engine with `analyzeLegacy` frozen beside it; `readiness.json` shows `engine: "v2-recalibrated"` and a real AMBER verdict for 2026-08-04. The 08:30 alarm was RETIRED rather than kept: task **ArsenalFC-Goalkeeper** is Disabled and the body read now runs as the ordered `goalkeeper` step of `conductor.mjs`'s morning chain (§6 correction explains why the stagger was killed).
The Manager — implement M-1→M-5 (§17); zero code written yet. → **DONE, and this sentence is the one that most needs deleting from a reader's head.** `scripts/manager.mjs` is 1,100+ lines with a large embedded selftest that passes with zero failures (`node scripts/manager.mjs selftest` — read the count from the run, not from here). M-3 is live in `brain.mjs` as `job.kind === "manager_m3"` with a hard refusal if `ANTHROPIC_API_KEY` is set; M-5's schedule is `formation_read` at 08:45 in `brain_config.json`. OUTSTANDING: his line-by-line review of `dressing-room/manager/system.md`.
AutoPush referee — nightly git add -A && commit && push (needs git credentials fixed); code alongside the Manager's M-1. → **DONE, renamed.** It is `scripts/groundsman.mjs`, on task **ArsenalFC-Groundsman-Push** at 03:45 (Ready). Note it does NOT use `git add -A`, and the difference is deliberate and load-bearing: the live call is `git add -u -- <PUBLISH_ALLOWLIST>` (`grep -n "PUBLISH_ALLOWLIST" scripts/groundsman.mjs`), which is two locks, not one — `-u` can only stage paths git ALREADY tracks (so a brand-new state file cannot be published by accident, even unignored), and the allowlist narrows it further to named publishable paths. The file's own comment names the risk it is defending against. On a PUBLIC repo that is the whole safety margin; do not "simplify" it to `-A`.
Rest of §8 agents; FinOps Copilot eval harness + deployment (the trophy); scheduled-tasks + ntfy push. → **SPLIT.** Scheduled tasks + ntfy: DONE (see the §16 headline block). Rest of §8: PARTIAL — many roster slots now have code owners, several do not (the Job-Market Scanner #22 has none; `scout.mjs` is a different organ despite the name — see §15). FinOps Copilot: still the trophy and still unwon — no eval harness, no deployment, and `season.json` (which holds `trophy_state`) is not even present on this machine. Read the roster live rather than from any list: `git ls-files "scripts/*.mjs"`.

DESIGN-CLOSURE NOTE: the two doors that reopened after v1 — the Pep×Arteta two-brain merge and the Governor calibration — are both now researched, settled, and baked (here + the two soul files). No design deliberation remains. From here it is BUILD only; §18 gate is live.

Nikhil's daily commitment: log every med/supplement/caffeine timing (feeds the Intake Correlator).

17. PHASED ROLLOUT — "Pre-Season" (design-complete; this is the execution order)
The full squad is designed. It switches on in a sequence — not because of caution, but because 33 agents firing at once amplify errors ~17× AND the critical path runs through Nikhil's credentials/machine/deploys, which can't all land at once. Each layer is proven leak-free before the next. The whole squad is set up phase-by-phase — there is no stalling on a "Playable XI"; every layer gets built in order.

🔧 PHASE STATUS, corrected 10 Aug 2026 — the phase DESIGN and ORDER below are untouched and still
the plan of record. What was wrong is that every phase reads as future work. Live position:
**PHASE 0 — COMPLETE.** Git bus, the deterministic layer, the recalibrated Goalkeeper, the live
Time-Auditor, FSRS and Calibration all exist and all run (`scripts/fsrs.mjs`, `scripts/calibration.mjs`,
`scripts/oura_coach.mjs`, `scripts/timeaudit.mjs`; all four in the `squad:selftest` suite in
`package.json`). Its gate — "a recalibrated readiness verdict + the ActivityWatch summary both
land in the repo automatically" — is met: `readiness.json` (engine `v2-recalibrated`) and
`timeaudit.json` both write on the conductor chains. NOTE the one Phase-0 item that never
happened: `dressing-room/constitution.md` (§5).
**PHASE 1 — BUILT; the GATE is a separate question.** M-1→M-5 are all placed (evidence in §8 and
§16). The gate is behavioural, not structural — "a team-sheet appears at 08:45 and one graded
drill set completes daily for 5 consecutive days" — and no doc can certify a 5-day streak. Read
it from the run reports (`dressing-room/state/conductor.json`) and from `team_sheet.md`'s dates,
never from prose.
**PHASE 2 — the instrumentation it names is BUILT, ahead of its stated slot.** "Re-Jirah per-axis
controller" = `scripts/rejirah.mjs`; "Python fluency-states" = `scripts/python_state.mjs`;
Forge/Maidan formation = `scripts/forge_session.mjs` + `scripts/learning_state.mjs`, with the
whole `learning-layer/` canon behind them (§11 correction). Its gate is NOT met and one half of it
is misnamed: FinOps RAGAS has not started, and "Brier calibration gap" should read ECE — the
shipped scalar is ECE (§8 Calibration correction).
**PHASES 3–7 — genuinely ahead.** No FinOps eval harness, no deployment, no recruitment
department; the trophy is unwon. Some roster slots have acquired code owners out of phase order
(the evening chain runs `setpiece.mjs`, `examiner.mjs`, `scout.mjs`, `doubtminer.mjs`), which is
worth knowing before anyone "starts" an agent that already has a file. Check first:
`git ls-files "scripts/*.mjs"`.

PHASE 0 — Dressing room + referees. Git bus + constitution + masterplan (DONE) + the deterministic layer: Goalkeeper RECALIBRATED per v2 §12 (the first code-change), ActivityWatch Time-Auditor (LIVE), FSRS lib, calibration. Zero LLM agents. Gate: a recalibrated readiness verdict + the ActivityWatch summary both land in the repo automatically.
PHASE 1 — The Manager (weeks 2–3). Implement the two-brain coach M-1→M-5: M-1 manager.mjs (deterministic wrapper — glob + all math + season_day/phase + formation-read assembly + fallback, LLM-free, fully testable on the THE_MANAGER §10 dummy data) → M-2 dressing-room/manager/system.md = THE_GAFFER + THE_MANAGER (Nikhil approves the soul line-by-line) → M-3 claude -p wiring + billing live-verify (no API key + Extra-Usage OFF) → M-4 sandbox the §11 scenarios → M-5 scheduled tasks (08:45 team-sheet after GK 08:30 + fast evening post-match) + ntfy. AutoPush referee coded alongside M-1. Plus one Gemini generator + one Claude grader + the recalibrated Governor. Gate: a team-sheet appears at 08:45 and one graded drill set completes daily for 5 consecutive days without readiness-forced skips becoming full stops.
PHASE 2 — Learning-layer optimization + first eval (immediately post-Manager). The FIRST push after the Manager: schema-fy the learning layer's deferred instrumentation — Forge/Maidan formation + Re-Jirah per-axis controller + Python fluency-states (the "first R1 run", now PINNED to right-after-the-Manager) — then FSRS + retrieval + calibration; start FinOps Copilot's RAGAS dev-time harness. (Still compounds, not exponential — the multiplier is consistency; no "10x".) Gate: Brier calibration gap trending down; first RAGAS faithfulness score committed.
PHASE 3 — The decisive signing + jury (weeks 6–7). Production & Evaluation Prosecutor + the dual-judge jury. Gate: Nikhil defends an eval-harness design unaided.
PHASE 4 — Full attack + Nemesis (weeks 8–10). Remaining interviewers + overnight Nemesis. Gate: repeated weaknesses in weaknesses.json are shrinking.
PHASE 5 — Ship the trophy (parallel). FinOps Copilot → deployed live API + DeepEval CI gates + TruLens. This converts the whole system into a ₹20–25 LPA offer. Gate: live endpoint + passing eval gate; README trophy "lights up." Apply in parallel once M-1 is demo-able — not after full completion.
PHASE 6 — Recruitment department. Job scanner, resume/ATS, build-in-public, negotiation sim, as applications begin.
PHASE 7 — Depth & rotation. The 9 bench agents. Fire or merge any agent whose job overlaps another (the Bench Rule / stop rule).

Thresholds that trigger changes: RED (evidence-based convergence) for multiple days → cut agent load, don't push through. Claude weekly cap hit before Thursday → move more to Gemini/deterministic. Calibration not improving after 2 weeks on a topic → Nemesis escalates, don't add agents. System-maintenance time > study/ship time in ActivityWatch → FREEZE all new agents (the anti-procrastination gate). FinOps eval faithfulness < 0.80 → shipping takes priority over drilling.

Compressed-season note (LOCKED): the calendar + rollout + audit-ceremony compress to ~30–45 days to the trophy (FinOps ship ≤45–60 days); biology (reps × time × sleep) does NOT compress. The 45-day trophy = FinOps live + eval-passing + defensible (winnable); full effortless fluency across every concept keeps compounding after the offer. The Governor + Sunday-off + never-zero floor are the turbo that lets extreme run 45 days without the chain snapping — NOT brakes. The squad never invokes calendar pressure; the pace is the captain's.

18. FAILURE MODES & THE ANTI-PROCRASTINATION GATE (brutal honesty)
Over-scaffolding / learned helplessness — THE #1 RISK. If any agent does his thinking, the system becomes a Dunning-Kruger amplifier: he feels ready while his generation ability atrophies. → produce-first is absolute; the Calibration Coach watches for a widening felt-fluency-vs-accuracy gap.
Goodhart gaming of self-tracking. Hours-logged and streaks are gameable. → the primary KPI is Brier-calibrated performance on unseen drills + shipped eval-passing code, NOT time or streak length; ActivityWatch cross-checks self-report. (corrected 10 Aug 2026: read "ECE-calibrated", not "Brier-calibrated" — the shipped `calibration_gap` is an Expected Calibration Error over his knew/shaky/guessed gut-words, per `scripts/calibration.mjs`. The KPI's INTENT is unchanged and correct; only the metric's name was wrong. See the §8 Calibration correction.)
LLM-as-judge bias (position/verbosity/self-enhancement). → dual-model jury + randomized order + verbosity-penalized rubric; scores stay directional; Nikhil is final adjudicator.
Question-generation quality / overfitting to one model. → external human-authored banks + Claude spot-audits a 10% sample weekly + generator↔critic role swaps.
Cross-engine coordination overhead + state drift. Two memoryless engines + a file bus is genuinely more overhead. → single-writer rule, git audit log, Manager as sole reconciler. Honest verdict: the second engine only pays off for (a) bulk generation on the free pool and (b) cross-model judging. Do NOT split a task across engines just because you can.
Quota/token blowout on each pool. → route bulk to Gemini + deterministic; reserve Opus for the Manager + 2–3 decisive rounds/day; watch /usage and the live AI-Studio cap; never run the full squad simultaneously.
Multi-agent error amplification (MAST). → centralized Manager, minimal agents, no peer chatter, hard turn/time caps; keep the coordinating cluster at 3–4.
The meta-loop — system-building that displaces execution. Name it once, redirect, don't re-litigate. Nikhil's brainstorm-before-build is legitimate (ADHD-PI, the Tony-Stark process) — only a concern if it displaces execution after the vision is settled. The Pep-merge + Governor-calibration research was legitimate design-closure, not scope-creep — and it is now CLOSED.
When to STOP adding agents/engines: when a new agent doesn't close a data-proven gap, when you can't state each agent's one job in a sentence, or when coordination exceeds ~30 min/day. A third engine is almost certainly over-engineering for one person — resist it. Cap: 2 engines, ~24 named agents (+ 9 bench = 33).

THE HONEST TRADEOFF (read this every time the urge to design returns): For an ADHD-PI builder, elaborate system-building is a seductive, high-dopamine form of procrastination that can fully displace the boring, effortful work that actually gets hired — doing reps and shipping FinOps Copilot. This masterplan exists to END the designing. Its value collapses the moment an agent does the thinking, and it becomes net-negative the moment building it displaces shipping. When in doubt: do a mock, ship a feature — don't add an agent. The squad is only as strong as the day it's on the pitch, not the whiteboard. Design is CLOSED — the next threads BUILD (Goalkeeper recalibrate → Manager M-1), they do not redesign.

19. VERIFIED-FACTS APPENDIX (citations & numbers — re-verify tools every 3–6 months)
Orchestration evidence:

Google Research, "Towards a Science of Scaling Agent Systems" (arXiv:2512.08296, 180 configs across GPT/Gemini/Claude): centralized coordination +80.9% over single-agent on parallelizable tasks; multi-agent DEGRADES sequential-reasoning tasks by 39–70%; optimal cluster 3–4 agents; heterogeneous mixing +31% for Anthropic models; independent systems amplify errors up to 17.2× vs ~4.4× centralized.
MAST taxonomy — Cemri et al. (UC Berkeley), "Why Do Multi-Agent LLM Systems Fail?" (arXiv:2503.13657; NeurIPS 2025 D&B spotlight): 14 failure modes / 3 categories — Specification 41.77%, Inter-Agent Misalignment 36.94%, Task Verification 21.30% — from 1,600+ annotated traces across 7 frameworks, κ = 0.88. (1,642-trace analyses report 41–86.7% failure rates; a 3-agent chain at 70%/link ≈ 34% reliable.)

Two-brain / control-theory evidence (v2):

Good Regulator Theorem — Conant & Ashby 1970, Int. J. Systems Science 1(2):89–97: "every good regulator of a system must be a model of that system." Plus Ashby's Law of Requisite Variety ("only variety can absorb variety," V(C) ≥ V(D)). Conceptual backbone, not a strict mathematical guarantee — the popular one-liner exceeds the formal proof.
Co-leadership — Krause & Priem 2015, Strategic Management Journal (71 co-CEO pairs): performance peaks at a moderate power gap, not equality; pure equality slightly negative ROE. HBR 2022 (87 co-CEO firms): 9.5% avg annual return vs 6.9% index. Design implication: two equal-voice brains, but a single buck-stop (the Governor + one-output constraint). Football co-management almost always failed on "who has the final say" (Evans/Houllier, Todd/McFarland) — fusion into one coach avoids the graveyard.
Flywheel / ceiling — Collins, Good to Great ("no single defining action, no miracle moment"); Macnamara/Hambrick/Oswald 2014, Psych Science (deliberate practice explains 26%/21%/18%/4%/<1% of variance) → compounding, not exponential; "10,000 hours" is Gladwell, not Ericsson.
Set-pieces (the Jover/Nemesis analog) — under Jover, Arsenal set-piece goals rose from 11% (2020/21) to 26% of goals; 2023/24 a division-leading 20 set-piece goals (16 from corners), matching the single-season PL record (Premier League, Alex Keble).

Governor-calibration evidence (v2):

Passion / engagement — Vallerand Dualistic Model of Passion (2003 JPSP 85:756–767; 2010 J. Personality 78:289–312): harmonious vs obsessive passion defined by quality of internalization, not hours; obsessive→burnout via work-life conflict, harmonious→vitality/wellbeing; flexible vs rigid persistence is behaviorally observable. Schaufeli/Taris DUWAS (working excessively vs working compulsively — the marker is compulsion). Billieux et al. 2015 (intense chosen enjoyable engagement without functional harm ≠ addiction).
ADHD interoception — Bruton et al. 2025, Psychophysiology (diminished interoceptive accuracy in ADHD; internal depletion-sense lags reality → the argument FOR an accurate external monitor). Dodson's interest-based nervous system.
Cognitive vs physical fatigue — Marcora, Staiano & Manning 2009 (mental fatigue raises perceived effort, doesn't deplete muscle) → the athletic auto-deload transfers only partially.
Medication confounds (by class; the specific stack lives in gitignored intake_log.json) — stimulants raise HR/BP (Liang et al. 2018, 22 studies/46,107); SNRIs REM-suppress + sweating ~12% + PLM (Yang/White/Winkelman 2005); atypical-antipsychotic akathisia ~18% of bipolar pts, "most frequent mistake" is misreading it as worsening depression (Pondé et al. 2015; FDA label); cognitive-support agents raise REM + mild bradycardia (Moraes et al. 2006) and improve sleep continuity (Ishikawa et al. 2016); caffeine cuts SWS/TST (meta-analyses). Net: cardiac/temp signals confounded in opposite directions → LOW-confidence, baseline-relative only.
Wearable accuracy — HRV has no population norm (baseline-relative only); Oura Gen4 CCC 0.99 / Gen3 0.97 for nocturnal RHR/HRV (highest of tested devices); ~79% four-stage sleep-staging vs PSG; deep-sleep sensitivity ~64–79.5% (multi-night trends, not single-night). (Calibration guidance for a psychiatrist-in-the-loop data system — NOT medical advice.)

Learning science: Slamecka & Graf 1978 (generation effect); Roediger & Karpicke 2006 Psych Science 17(3):249–255 (14% vs 28% one-week forgetting); Rowland 2014 (g=0.50, 159 ES); FSRS (Anki default v23.10, ~20–30% fewer reviews than SM-2, sim 500M+ reviews); Bisra et al. self-explanation g=0.55; elaborative interrogation g≈0.56; Murphy 1973 Brier decomposition.

Oura cognitive-performance science: Thayer et al. 2009 Ann Behav Med 37(2):141–153 (HRV↔prefrontal); Granero-Gallegos et al. 2020 (HRV-guided ES 0.402 vs 0.215); Yoo & Walker 2007 Nat Neurosci 10(3):385–392 (40% encoding deficit without sleep); Okano et al. 2019 npj Sci Learn (~25% grade variance from sleep); Baron et al. 2017 J Clin Sleep Med 13(2):351–354 (orthosomnia); Plews/Buchheit (7-day rolling ln rMSSD + ±0.5 SD SWC).

Judge-panel evidence: Ensemble-as-Judges / Arena-Hard (arXiv:2406.11939) — diverse model families reduce self-bias; verbosity bias >90% preference for longer answers by single judges.

Oura API v2 / Claude / Gemini quotas (volatile — verify live): base https://api.ouraring.com/v2/usercollection; OAuth2 (PATs deprecated Dec 2025); persist rotated refresh_token; rate limit 5000/5min; hypnogram 1=deep/2=light/3=REM/4=awake. Claude Routines 15/day Max, min 1hr, cloud; Agent-SDK separate credit pool since June 15 2026; 5-hr limits doubled May 6 2026. Free Gemini API: Flash-Lite 15 RPM/1000 RPD (per-project); Apps Script ~20k UrlFetchApp/day; Jules 100 tasks/day on Pro; Gemini CLI dead June 18 2026. RAGAS faithfulness ≥0.75–0.80, relevancy ≥0.80, precision ≥0.70, recall ≥0.80; DeepEval = pytest CI gate.

(All tool numbers change fast — re-verify against live docs/UI before any big build. Any AI's self-report of its own model/limits is unreliable; verify from primary sources.)

20. NEXT-THREAD KICKOFF INSTRUCTIONS

🚨 CORRECTED 10 Aug 2026 — **DO NOT EXECUTE THE BUILD ORDER BELOW AS WRITTEN.** This section is
the one that actively costs time, because it is an instruction list rather than a description, and
a fresh thread that follows it will (a) go hunting for `constitution.md`, which has never existed
in this repo, and (b) rebuild the Goalkeeper recalibration and the Manager M-1→M-5, all of which
have been live for weeks. Both build steps are DONE — evidence in §16's headline block, §8, and
`node scripts/manager.mjs selftest`.
WHAT A FRESH THREAD SHOULD ACTUALLY DO, replacing step 3 below:
· READ `CLAUDE.md` first — it is the operating system for this repo and it did not exist when
  §20 was written. Then `OPS_STATE.md` (noting it is itself stale for the learning layer and says
  so), then this file for design, then `learning-layer/LEARNING_LAYER_MAP.md` if the work touches
  how he studies.
· LOAD HIS MEMORY: the `organism-memory` MCP `get_context` call, per CLAUDE.md. Non-negotiable and
  not mentioned anywhere below.
· VERIFY STATE BY RUNNING, NOT READING: `npm test` is the authority (`package.json` calls it
  exactly that); per-organ selftests answer the narrower questions. Read `dressing-room/state/*.json`
  for live values.
· THEN pick up what is actually open: his line-by-line review of `dressing-room/manager/system.md`;
  the Oura secret regeneration (NOT VERIFIED, §12e); the `identity_facts.pending.jsonl` two-writer
  breach, which needs HIS ruling and not a code fix from a doc pass (§5); and §17 Phases 3–7,
  checking `git ls-files "scripts/*.mjs"` before "starting" anything, because several organs
  already have files.
The rest of §20 — the standing rules, the produce-first law, the anti-procrastination gate, the
Hinglish register, "Claude did it = interview fail" — is UNCHANGED and still correct. Only the
build order and the constitution.md reference are wrong.

A fresh thread should:

Read OPS_STATE.md (live state) first, then this file (§0 reading order). For the Manager build, also read THE_MANAGER__Master_Prompt.md + THE_GAFFER.md. Read constitution.md. Check script state in /scripts + /dressing-room/state. (corrected 10 Aug 2026: "Read constitution.md" is a dead pointer — the file does not exist and never did, §5. Read `CLAUDE.md` first instead; it post-dates this section and governs the repo.)
Confirm with Nikhil what's changed since 09 Jul 2026 (did he regenerate the Oura secret? any med/stack change?). (still the right question, 10 Aug 2026 — the Oura-secret half is exactly the item this audit could NOT settle from code, §12e.)
BUILD, in order (design is CLOSED):
Goalkeeper RECALIBRATE (§12) — rebuild oura_auth.mjs + oura_coach.mjs to the v2 §12 spec (medicated baseline, confidence-tiers, convergence-only RED, softened auto-deload, akathisia caveat, honor-the-grind, doctor-referral safety), sandbox-test the verdict engine against mock 40-day data (incl. the medication-confound case → must resolve AMBER-not-RED, and the convergence case → RED), then Nikhil runs it for his first real verdict. Regenerate the leaked secret first. (**DONE — do not re-do.** 10 Aug 2026: `oura_coach.mjs` IS the v2 engine, the old one is frozen as `analyzeLegacy`, and it has produced a real verdict on his own data — `readiness.json`, engine `v2-recalibrated`, day 2026-08-04, AMBER. The scenario tests live in the file's own selftest: `node scripts/oura_coach.mjs selftest`, plus `node scripts/test_coach_v2.mjs`. The secret clause remains NOT VERIFIED.)
The Manager M-1→M-5 — the two-brain coach (see THE_MANAGER build order). M-1 manager.mjs first (deterministic wrapper, no LLM, tested on §10 dummy data). AutoPush coded alongside M-1. (**DONE — do not re-do.** 10 Aug 2026: `scripts/manager.mjs` is placed and green — `node scripts/manager.mjs selftest`, zero failures. M-3's `claude -p` swap is live in `brain.mjs` (`grep -n "manager_m3" scripts/brain.mjs`); M-5's schedule is the `formation_read` job in `brain_config.json`. AutoPush shipped as `scripts/groundsman.mjs` on task ArsenalFC-Groundsman-Push. STILL OPEN and still HIS: the line-by-line review of `dressing-room/manager/system.md`.)
Then §17 phases 2–7, one layer at a time, proving each leak-free, committing every session, explaining every file (what + why) — Nikhil reads and defends every line ("Claude did it" = interview fail; the generation effect IS the interview defense).
Keep the anti-procrastination gate live (§18): if the thread drifts back into designing, whistle Nikhil back onto the pitch — ship a feature, run a mock, don't add an agent.

Standing rules: deterministic work on code+cron (zero tokens); bulk on the free Gemini pool; scarce Claude on hard-reasoning only (brain-rotation: Sonnet routine / Opus complex; the Manager's daily reconciliation is Opus, claude -p, never API key); auto-approve nothing (propose options, Nikhil decides; Claude Code edits + commits the canonical files directly in the repo, human-gated — it stops before commit/push for Nikhil's go); every agent obeys produce-first; Hinglish captain register; honest, never a hype-man; Nikhil owns the pace (never invoke calendar pressure); finance concepts taught from zero; burnout is the real failure mode (sustainable pace, Sundays off).

The One Rule, one last time: teammates set up the chance. The #14 takes every shot. The squad is only as strong as the day it steps on the pitch. Design is closed. Now go execute. 🔴⚪⚽