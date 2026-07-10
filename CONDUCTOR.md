# ⚪🔴 THE CONDUCTOR — Arsenal AI FC · Autonomous Build Runner
**Thread-agnostic master brief.** Read by BOTH surfaces: **Claude Code** (the builder, on the machine) and **chat/web Claude** (the validator). It governs building every signal-source agent, each fully-tested-green before the next, with **The Manager built LAST as the capstone**. The captain's only job is to brainstorm each agent's design; everything else is automated.

> Place this at repo root as `CONDUCTOR.md`. It is canon-level. It pairs with `OPS_STATE.md` (live state) and a new `CONDUCTOR_LOG.md` (the build ledger). Last updated: 2026-07-10.

---

## §0 — HOW TO USE THIS FILE (boot sequence — run FIRST, every session)

**Any fresh Claude Code session OR chat session, before doing anything, reads three files from the repo:**
1. `OPS_STATE.md` — live state, the single anchor.
2. `CONDUCTOR.md` — this file, the operating contract.
3. `CONDUCTOR_LOG.md` — the append-only build ledger (what's ✅ done, what's next).

Then **resume from the last unfinished agent in `CONDUCTOR_LOG.md`.** No memory of prior chats is needed — the repo IS the memory. This is the answer to "what if a Code thread fills up and I start a new one": **you lose nothing.** The new session reads these three files and continues exactly where the last left off.

---

## §1 — THE MODEL (why this file exists)

- **All agents get built today**, signal-source agents first, **Manager as the capstone LAST** (integrated + tested against REAL agent JSONs, not §10 dummy).
- **The captain (Nikhil) only brainstorms design.** He does not write code, run terminals, manage git, or approve line-by-line. His single gate is: *"is this agent's design right?"* — one yes per agent, at the design stage only.
- **Claude Code builds fully autonomously** within an approved design: reads canon → writes the file → runs its selftest → self-fixes until green → logs → commits + pushes autonomously after the pre-push secret-check (standing autonomy, §2.5).
- **Agents self-populate.** The captain starts using the whole system tomorrow morning. As he learns and ships, each agent's **capture-hook** ingests real data automatically — he logs nothing by hand. Agents must therefore be built **empty-safe** and light up as data arrives.
- **Honest frame (non-negotiable, from the Gaffer's honesty-overrides):** the *build quality* bar is "god-tier" (defined concretely in §4). But no agent's **output** ever sells "10x / exponential / on steroids." The accurate frame is *compounding, self-correcting, directed-efficiency.* Hype in an agent's output is a bug.

---

## §2 — ROLES & THE ONE BRIDGE (read this — it's the honesty spine)

There are **three actors** and **exactly one bridge** between the two AI surfaces:

| Actor | Owns | Never does |
|---|---|---|
| **Captain (Nikhil)** | Design decisions (the one gate, at design-time). Grants standing autonomy (§2.5). | Terminal, files, git, line-approval, per-commit approval. |
| **Claude Code** (machine) | **Validates the approved design against machine-reality** (does it run? conventions? schema? feasible?) BEFORE building — then writes + runs + selftests + commits + pushes every repo file autonomously after the pre-push secret-check. Autonomous within an approved design (§2.5). | Design an agent unilaterally. Push a secret/biometric (the pre-push check blocks it). Fabricate data. |
| **Chat/web Claude** (this surface) | Brainstorms each agent's design with the captain. **Validates** every build against this brief. Owns architecture + visualization. | Touch the machine or the repo directly. Hand off repo files. |

**THE ONE BRIDGE:** chat-Claude and Claude Code **cannot talk to each other.** They are separate sessions. The only thing they share is **the repo.** So:
- Design flows **captain → (brainstorm with chat-Claude) → captain pastes an approved design capsule → Claude Code.**
- Verification flows **Claude Code → writes `CONDUCTOR_LOG.md` in the repo → chat-Claude reads it (fetches from GitHub while public; captain pastes it once private) → validates.**

Any claim of "the two Claudes coordinate automatically" is false. Coordination = the captain's paste + the shared repo. This brief is built around that truth.

---

## §2.5 — LABOUR DIVISION & STANDING AUTONOMY (captain's grant, 10 Jul)

**Standing autonomy supersedes the old per-commit gate.** The captain granted Claude Code standing permission to **create, edit, run, selftest, commit AND push** within this repo **without per-step approval** (auto-accept edits ON). Every commit-gate reference elsewhere in this file is read through this section.

- **LABOUR DIVISION.** The captain does **ZERO manual labour** — no file-drops, no terminal, no git, ever. Claude Code **creates / edits / runs / selftests / commits / pushes EVERYTHING** under standing autonomy + a mandatory pre-push secret-check. The captain's only inputs: (i) design brainstorm with chat-Claude, (ii) pasting an approved command/capsule, (iii) a one-time Gemini-side wiring (Colab cell + Drill-Gem prompt).
- **Two-gate design.** (1) chat-Claude + captain brainstorm the design capsule; (2) Claude Code **design-validates it against machine-reality** (conventions, schema, feasibility, Windows/ESM) BEFORE building. No unilateral design; no build on an unvalidated capsule.
- **Capture = Option B.** Colab reps auto-write to Google Drive → local `capture.mjs pull` (scheduled) ingests them zero-paste; Gems stays copy-paste (`capture.mjs paste`). Needs Google Drive for Desktop; if absent, the pull-path is built but dormant + its scheduled task disabled until the captain wires Drive (never faked).
- **Stop-and-ask ONLY if:** (a) a real secret/token/biometric would leak onto the PUBLIC repo, (b) a design decision is genuinely ambiguous and not covered by an approved capsule, or (c) a selftest cannot reach green after Code's own fixes. Otherwise Code runs to green and pushes.
- **Pre-push secret-check (EVERY push).** Before every push Code self-runs `git check-ignore` on secrets/tokens/biometrics/logs/reps-data; if anything would leak it STOPS and tells the captain — it does not push.

---

## §3 — BUILD ORDER

**Done + live:** Goalkeeper ✅ · Time-Auditor ✅.

**Signal-source agents (build first, one green before the next):**
> **Proposed order (confirm at the first design-gate):**
> **0. Shared Capture Layer** → **1. FSRS** → **2. Calibration** → **3. Nemesis** → **4. learning-state**

Rationale: FSRS, Calibration and Nemesis all feed off the **same study-session data**, so a **shared capture layer is built first** (one hook, three consumers — see §7). Then the three consumers. `learning-state` (the Maidan/fluency map) is closest to the Manager and is the one canon defers to the "first R1 run," so it's built last among the four (see §13 fork).

**Capstone (build LAST):**
- **The Manager** — M-2 `system.md` (soul) → M-3 `claude -p` + billing guards → M-4 sandbox §11 scenarios → M-5 scheduled tasks + ntfy. `M-1 manager.mjs` already exists as a **web-sandbox reference** — Claude Code places + re-tests it against the **real** agent JSONs now present, not the §10 dummy.

**AutoPush** = parked for the FinOps repo (per the locked decision), not built here.

---

## §4 — THE GOD-TIER BAR (13 gates — every agent passes ALL before it's "green")

1. **Single responsibility + single writer.** One agent → one JSON → exactly one writer process. Everyone else reads.
2. **Deterministic-first, zero LLM by default.** Referees compute; they don't reason. LLM only where judgment is genuinely required, and only then with the billing guards (§10). Cheaper, faster, testable, no-token.
3. **NEVER fabricate.** Missing/empty input → the agent writes a **valid-but-empty** JSON with `"status":"awaiting_data"` and skips gracefully. It never invents a number. (This is what makes the "data from tomorrow" plan safe.)
4. **Capture-hook shipped.** Each agent ships with a working, documented mechanism that ingests its data as the captain works — no manual logging (§7).
5. **Confidence / quality tags** where a signal can be soft (the Goalkeeper pattern: HIGH vs LOW-confidence signals; never let a low-confidence signal drive a hard verdict).
6. **Layering, never replace.** An existing engine is frozen verbatim; new logic layers on top. Nothing is deleted.
7. **Machine conventions.** Node 22, ESM, Windows-safe entry guard `pathToFileURL(process.argv[1])`, `STATE_DIR` under `dressing-room/state/`, `JSON.stringify(_, null, 2)`, matches `CLAUDE.md` + `scripts/timeaudit.mjs` house style exactly.
8. **Atomic writes.** temp file → rename. A parse-fail reads as missing-file, never a half-written JSON.
9. **Selftest mode.** `node <agent>.mjs selftest` runs the whole pipeline on a baked mock (timeaudit/oura pattern), asserts every check, and prints an explicit **ALL CHECKS PASSED**. No agent is "done" until its selftest is green **and** re-run clean.
10. **Manager-schema-ready.** Output JSON matches the field contract in `THE_MANAGER__Master_Prompt.md` §4 + §10 so the capstone integrates with zero rework.
11. **Secrets / PII safe.** Any secret/biometric/med data is gitignored AND *verified* ignored (`git check-ignore`), never trusted by comment. Source-code PII (e.g. med names) flagged once.
12. **Observability.** Each run logs one line (timestamp, input-present?, output-written, counts) so the verification loop (§9) can see it.
13. **Self-documenting.** Top-of-file header comment: what + why + input-contract + capture-hook + output-schema. (Satisfies "explain every file" — Code authors it; the captain does not line-approve it.)

---

## §5 — THE PER-AGENT LOOP (the repeatable cycle)

```
[1] DESIGN     captain + chat-Claude brainstorm the agent → fill the §6 Design Capsule.
               (This is the captain's ONLY touch. God-tier bar §4 is assumed.)
                     │  captain pastes the filled capsule into Claude Code
                     ▼
[1.5] DESIGN-VALIDATE   Claude Code checks the capsule against machine-reality BEFORE
               building — conventions (CLAUDE.md / timeaudit.mjs), schema (§4/§10),
               feasibility, Windows/ESM gotchas. Flags anything that won't run; captain
               resolves it with chat-Claude. Only a validated capsule proceeds to build.
                     ▼
[2] BUILD      Claude Code reads canon + the validated capsule → writes the .mjs (+ capture-hook)
               matching §4 → runs selftest → self-fixes until ALL CHECKS PASSED.
                     ▼
[3] LOG        Claude Code appends an entry to CONDUCTOR_LOG.md (§11 spec):
               files written, selftest output verbatim, schema-check, deviations.
                     ▼
[4] VERIFY     chat-Claude reads CONDUCTOR_LOG.md (fetch while public / paste once private)
               → runs the §9 checklist → ✅ or ❌-with-reason.
                     ▼
[5] COMMIT     Claude Code commits + pushes autonomously after the pre-push secret-check (§2.5). Updates OPS_STATE
               (NEXT ACTION → next agent). Then → next agent. Manager LAST.
```

**Autonomy rule:** inside step [2], Claude Code does **not** pause for per-step approval. It runs to a green selftest on its own. Under standing autonomy (§2.5), Code also commits + pushes on its own after the pre-push secret-check; the only human gate is **design [1]**, and only when the design is ambiguous / not covered by an approved capsule. Step **[1.5] design-validate is Claude Code's own machine-reality check** on the pasted capsule — it does not need the captain, but it must surface any "this won't run / this breaks a convention" flag before writing code.

---

## §6 — THE DESIGN CAPSULE (the one human artifact per agent)

Brainstormed by captain + chat-Claude, then pasted to Code. Schema is mostly pre-fixed by canon (§10 of THE_MANAGER); the **real design work is the capture-hook**.

```
AGENT: <name>
PURPOSE (1 line): <what signal it produces>
OUTPUT FILE: dressing-room/state/<file>.json   (single writer: this agent)
OUTPUT SCHEMA: <exact fields + types — from THE_MANAGER §4/§10>
DATA SOURCE: <where the raw data comes from as the captain works>
CAPTURE-HOOK: <the exact mechanism that ingests it — THE crux>
DETERMINISTIC or LLM: <which, and why>
EMPTY-STATE OUTPUT: <what it writes when no data yet — status:"awaiting_data">
SELFTEST GREEN = : <what the baked-mock run must assert>
OPEN QUESTION(S): <anything unresolved to settle before build>
```

---

## §7 — THE CAPTURE-HOOK PRINCIPLE (what makes "I just learn, agents populate" real)

An agent with no data intake is a dead scaffold. So **every signal-source agent ships with a capture-hook** — the thing that turns the captain's normal work into the agent's input, automatically.

**The god-tier move: one Shared Capture Layer, three consumers.** FSRS (cards), Calibration (confidence-vs-accuracy), and Nemesis (recurring misses) all need the **same raw event**: *a study/drill/mock rep with a question, the captain's predicted confidence, and whether he got it right.* So instead of three brittle hooks, build **one capture** that emits a single append-only `dressing-room/state/reps_log.jsonl` per rep, and the three agents each read it and compute their own view:
- **FSRS** ← turns reps into a card deck + review schedule.
- **Calibration** ← turns (confidence, correct?) pairs into a Brier gap + danger-zone.
- **Nemesis** ← turns repeated misses into ranked recurring weaknesses.

**Locked surfaces (10 Jul):** the captain works ONLY on **Colab, Gems, and NotebookLM (Gemini Pro).** These are cloud surfaces — no silent local hook is possible; capture is a **session-end structured report → one paste → local `capture.mjs` → `reps_log.jsonl`**. Rep-capture comes from the **Drill Gem** (concept/Bolo drills — configured to ask the captain's confidence *before* revealing the answer, so the calibration pair is baked in) and **Colab** (Python drills). **NotebookLM = study/input, not a rep surface.** The hook logs *outcomes* (what was drilled + confidence + correct?), never *how* he learns — the learning pedagogy is untouched (Nidhi's protected domain). Friction target: **one paste per session, nothing per-rep.** Empty until the captain starts tomorrow — and that's fine (gate §4.3). *(Locked: **Option B** — Colab reps auto-write to Google Drive → local `capture.mjs pull` (scheduled) ingests them, zero-paste; Gems stays copy-paste.)*

---

## §8 — SESSION CONTINUITY (the captain's exact question, answered)

**Q: "If one Claude Code thread fills up and I start a new session, does it continue from where I left off?"**

**A: Yes — because the repo is the memory, not the chat.** A new Code session has no memory of the old chat, BUT:
- It runs the §0 boot: reads `OPS_STATE.md` + `CONDUCTOR.md` + `CONDUCTOR_LOG.md`.
- `CONDUCTOR_LOG.md` shows the last ✅ agent and the next one pending.
- It resumes there. Zero loss.

**The rule that keeps this true:** at the close of **every** agent, Claude Code (a) appends to `CONDUCTOR_LOG.md`, and (b) updates `OPS_STATE.md`'s NEXT ACTION to the next agent — both committed under the captain's "go." If those two writes happen, any number of sessions chain seamlessly across the day.

---

## §9 — CHAT-CLAUDE VERIFICATION LOOP (keeping me in the loop, thread-agnostic)

Any fresh chat/web Claude thread can verify the build is on-plan by running this checklist against `CONDUCTOR_LOG.md` (+ the actual committed files):

**Fetch (while repo is PUBLIC):** `curl -s https://raw.githubusercontent.com/nikhil1429/arsenal-ai-fc/main/CONDUCTOR_LOG.md` and the agent's `.mjs`. **After the repo is PRIVATE:** the captain pastes the log; raw-fetch will 401.

**Per-agent checklist (✅ all, or flag ❌ with the exact gate):**
1. Does the committed `.mjs` exist at the expected path? (fetch it — don't assume.)
2. Does its output schema match THE_MANAGER §4/§10? (field names/types.)
3. Selftest output in the log = **ALL CHECKS PASSED**, and re-run clean?
4. Empty-state path present (`status:"awaiting_data"`, no fabricated numbers)?
5. Capture-hook present + documented in the header?
6. Single-writer respected (no other file writes this JSON)?
7. Secrets/PII gitignored + verified (not just commented)?
8. Layering respected (no existing engine deleted)?
9. Deviations noted in the log — are any of them a silent scope-cut?

**Anti-hallucination rule for the validator:** never call an agent "done" from the log's word alone — **fetch the actual committed file and read it.** (A green log is a claim; the file is the fact. This is the exact failure this whole project has hit before.) If GitHub raw looks stale, cache-bust (`?nocache=<ts>`) or ask Code to disk-verify.

---

## §10 — GUARDRAILS (non-negotiable, every agent, every session)

- **AI proposes, code validates, human approves.** Auto-approve nothing.
- **`ANTHROPIC_API_KEY` is NEVER set** (would trigger per-token billing) + Extra-Usage OFF = hard $100 ceiling. Deterministic agents use no tokens at all; any LLM agent uses `claude -p`, never the API key.
- **Standing autonomy (§2.5).** Code creates/edits/runs/commits/pushes without per-step approval; it STOPS only for the three exceptions (secret-leak / ambiguous-uncovered-design / selftest-cannot-green) and always self-runs the pre-push secret-check.
- **Never fabricate** (gate §4.3) — the cardinal rule.
- **Atomic writes; single-writer-per-file; layering; Windows-safe ESM** (gates §4.6–4.9).
- **Secrets/biometrics/logs gitignored + verified** (gate §4.11).
- **Anti-corruption:** never regenerate a large canon file at the tail of a heavy thread — surgical edits only, one commit.
- **No calendar pressure, ever.** Pace is the captain's. "Time is short" is never in an output.

---

## §11 — `CONDUCTOR_LOG.md` SPEC (what Code writes per agent — makes verification possible)

Append-only. One block per agent, in build order:

```
## <N>. <AGENT> — <STATUS: green | in-progress | blocked>  ·  <timestamp>
- Design capsule: <1-line summary of the approved design>
- Files written: <paths>
- Selftest: <verbatim last ~10 lines, must contain ALL CHECKS PASSED>
- Output schema: <fields written> — matches THE_MANAGER §4/§10? <yes/no>
- Empty-state: <status:"awaiting_data" path confirmed? yes/no>
- Capture-hook: <what it is + where documented>
- Secrets/PII: <gitignored + verified? yes/no>
- Deviations / notes: <anything that differs from the capsule, honestly>
- Commit: <hash once pushed>
```

---

## §12 — DEFINITION OF DONE + REPO-PRIVATE FLIP

**An agent is DONE when:** all 13 gates (§4) pass · selftest green + re-run clean · committed + pushed on "go" · `CONDUCTOR_LOG.md` + `OPS_STATE.md` updated.

**The build is DONE when:** all four signal-source agents + the Shared Capture Layer are done, AND the Manager capstone (M-2→M-5) is done and its `manager.mjs` re-tests green on the real agent JSONs.

**Then — repo-private flip:** the captain flips the repo to private. From that point: (a) chat-Claude verification switches from raw-fetch to captain-paste; (b) source-code PII is no longer public (a side benefit). Do the flip only after the full build is green, so nothing is half-committed behind the wall.

---

## §13 — OPEN DESIGN FORKS (resolve in brainstorm — do NOT hallucinate these)

These are real, unsettled, and must be decided by captain + chat-Claude before the relevant agent is built. Claude Code must not pick a side on its own.

1. **Shared Capture Layer mechanism (agent #0) — RESOLVED (10 Jul): Option B.** Colab reps auto-write to Google Drive → local `capture.mjs pull` (scheduled) ingests them, zero-paste; Gems stays copy-paste. Requires Google Drive for Desktop sync on the machine — Claude Code **design-validates this before building**; if sync isn't set up, it builds the paste-path fully and stubs the pull-path with a clear TODO + scheduled-task placeholder (never fakes the pull).
2. **Nemesis vs Manager as writer of `weaknesses.json`.** THE_MANAGER §4 says *"Manager is the writer."* Single-writer rule then implies Nemesis should write a raw `nemesis_events.json` (or read `reps_log.jsonl`) and the **Manager derives** ranked `weaknesses.json` at capstone time. Confirm this split so two processes don't write one file.
3. **`learning-state` scope today.** Canon defers the Maidan/Re-Jirah/fluency **schema-fy** to the "first R1 run" (Phase-2 lead). Building it fully today pulls R1 forward. Decide: minimal `learning_state.json` stub now (schema + empty-safe) with full instrumentation at R1, OR full build now. Either is fine — just choose deliberately, don't drift.

---

*The Conductor governs the build; the captain governs the design; the repo governs the memory. Manager last. Agents self-populate. No hype in the output. ⚪🔴*
