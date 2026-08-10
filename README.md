# Arsenal AI FC ⚪🔴

**Arsenal AI FC** is a football-club-themed multi-agent personal accountability and execution system built for one specific user. Built for **Node 22**, using **ESM** modules on **Windows**, it runs entirely as a set of deterministic `.mjs` organs. These components communicate asynchronously over a git-based, single-writer JSON state bus located in `dressing-room/state`.

> **Three precisions on the paragraph above (added 10 Aug 2026 — none of it was rewritten, all of it was checked against the code; this file had not been touched since `caa8dea`, 15 Jul 2026).**
> - **Node 22 · ESM · Windows — all three hold.** `package.json` carries `"type": "module"`; the live interpreter is `node --version` → `v22.14.0`. Count the organs live rather than trusting any number in prose: `git ls-files "scripts/*.mjs" | wc -l`.
> - **"deterministic" is the *law*, not a description of every call.** The math, thresholds and validation are deterministic code; several organs still make live LLM calls (`brain.mjs`, `cortex.mjs`, `council.mjs`, `claudegen.mjs`). The rule that makes both true at once is **AI proposes · code validates · human approves**.
> - **"single-writer" has one deliberate, code-documented exception.** `brain_ledger.jsonl` is a **shared append lane** by design — `brain.mjs` owns the schema, and `cortex.mjs`, `council.mjs`, `selfknowledge.mjs`, `nightshift.mjs` and `dmn.mjs` all append their own spend to it so one real window is counted. Verify: `grep -rn "brain_ledger.jsonl" scripts/*.mjs`. Every other bus file is single-writer.
> - **"git-based" is true only of the tracked minority.** Most of the bus is gitignored personal state and never leaves the laptop — compare `git ls-files "dressing-room/state" | wc -l` against `ls dressing-room/state | wc -l` and read the reasons in `.gitignore`. The *multi-node* git bus (laptop ↔ the Pi "Kennel") is **not live**: `grep -n "TRANSPORT" scripts/groundsman.mjs` still says `bus_lease.json` is LOCAL and gitignored until the Kennel physically arrives.

## The Two-Speed Cyborg Brain

The cognitive core of the system is a two-speed "cyborg brain" designed to provide instant response and deep reasoning:
- **Reflex Brain (Fast):** Powered by Gemini Live, providing instant reflexes for voice and vision.
- **Deep Brain (Slow):** Powered by Claude Opus via `cortex.mjs`, taking over when true, profound judgment is required.
- **The Relay:** The entire system is governed by a `thalamus` salience relay, which scores incoming moments and dictates when the deep brain needs to be awakened versus when the reflex brain is sufficient.

> **Checked against the code, 10 Aug 2026 — all three held; four details worth having:**
> - **Reflex Brain = `dugout.mjs`.** It serves a local browser page (mic + speakers + camera frames) that talks to the **Gemini Live API on the free tier**, and it rotates a **pool** of the captain's free project keys on quota (`GEMINI_API_KEY`, `GEMINI_API_KEY_2/_3…`, read at runtime from `~/.gemini/.env`, never from the repo). Verify: `grep -n "GEMINI_API_KEY" scripts/dugout.mjs`. Vision is real, not aspirational — `realtimeInput.video{mimeType:image/jpeg}` (`grep -n "realtimeInput.video" scripts/dugout.mjs`).
> - **Deep Brain = `claude -p` on the Max subscription, never an API key.** `grep -n "ANTHROPIC_API_KEY" scripts/cortex.mjs` — it refuses to run at all if the metered key is set.
> - **The relay is a real daemon, not a metaphor:** a localhost HTTP nucleus on **127.0.0.1:4113** (`grep -n "4113" scripts/thalamus.mjs`), one of the resident daemons in `setup/START_DAEMONS.vbs` — read that file for the live list and its port locks (`:4111` turnstile · `:4112` cortex · `:4113` thalamus · `:4116` brain pacer; the Dugout on `:4114` is deliberately NOT started there). Note its own STATUS header (9 Aug 2026): the Startup-folder copy of that `.vbs` was **superseded** by `ArsenalFC-Brain.bat`, which is the live logon persistence; the `.vbs` remains the **manual** restart verb (`wscript setup\START_DAEMONS.vbs`).
> - **"The entire system" over-reaches slightly.** The gate decides *what gets thought about* on the two-speed brain lane; it does not sit in front of the scheduled organs (the conductor, the nightly jobs, the Task-Scheduler lane), and by the file's own law it never decides what gets **said** — outbound speech still passes the shadow ratify-gate and the win-only law. Evidence: `grep -n "never what gets SAID" scripts/thalamus.mjs`.

## The Three Layers

The organism operates across three distinct functional layers:
1. **Learning Layer:** Gathers and processes study routines, spaced repetition concepts, and manages the assimilation of new data.
2. **Outwork-Execution Layer:** Manages daily goals, tracks work sessions, guards time limits, and ensures the daily threshold of effort is met.
3. **Cyborg Brain Layer:** Evaluates inputs, executes long-term strategic decisions, dynamically routes tasks, and schedules overnight background processing.

> **Where each layer's code actually is, and one over-claim (checked 10 Aug 2026):**
> - **Learning Layer** — canon lives in `learning-layer/` (read `learning-layer/LEARNING_LAYER_MAP.md` first: it is a map + index, not canon). Spaced repetition is `scripts/fsrs.mjs` (`ts-fsrs` is one of only two runtime dependencies in `package.json`).
> - **Outwork-Execution Layer** — `scripts/timeaudit.mjs` (reads ActivityWatch locally, splits active time into Learning / Building / Meta) and `scripts/outwork_audit.mjs` (asks whether the day's cadence did its job).
> - **"guards time limits, and ensures the daily threshold of effort is met" over-claims, and the gap is deliberate.** The organism **records and reports**; it does not enforce a threshold. `outwork_audit.mjs` describes itself as *"deterministic, evidence-paired, threshold-free … per the captain's standing no-guessed-numbers rule"* (`grep -n "threshold-free" scripts/outwork_audit.mjs`), and `scripts/limits.mjs` exists precisely to *strip* numbers that were asserted rather than measured — its header carries the captain's own ruling that limits wait for 30–45–60 days of real data (`grep -n "THE NUMBERS LEDGER" scripts/limits.mjs`). Expect a report, not a gate.
> - **Cyborg Brain Layer** — `scripts/brain.mjs` (its own header calls it *"a deterministic job runtime"*; it also owns the measured-not-vibed usage ledger, and its daemon is the `:4116` pacer named in `setup/START_DAEMONS.vbs`), plus `scripts/thalamus.mjs`, `scripts/cortex.mjs`, `scripts/nightshift.mjs`. Overnight scheduling is real and rides Windows Task Scheduler; read the live schedule from the installers in `setup/` (`INSTALL_*.ps1`), never from prose.

## How to Run It

This is a personal, bespoke rig, not a consumer SaaS application. However, the system leverages strict automated selftests and tools to ensure every component runs flawlessly.

> *(Precision, 10 Aug 2026: "ensure every component runs flawlessly" is stronger than anything the code can promise, and the repo's own standing law says so — **"unrun system = hypothesis. Nothing is 'done' until it has actually run."** The selftests prove GREEN **at the moment they are run**, on the members listed in `package.json`, and no further. There is no green figure written down here on purpose: get it by running `npm test`, never by reading a number out of a document. No count in this file was left hardcoded for the same reason.)*

### Core NPM Commands
- `npm test` — **the authority, and it was missing from this list until 10 Aug 2026.** `package.json`'s own `_runner_law` (6 Aug 2026) rules that the two `&&` chains below are **fast-fail membership records, not the net**: measured, `brain.mjs` sits at position 16 of the organism chain, so one red organ left every organ AFTER it unrun and unreported, and the suite said "failed" rather than "N unverified". (Re-derived live 10 Aug 2026 — still position **16**, but now of **51** members, not the 43 `_runner_law` measured on 6 Aug; the blast radius has grown, not shrunk. Re-derive rather than quoting either number: `node -e "const c=require('./package.json').scripts['organism:selftest'].split('&&');console.log(c.length, c.findIndex(s=>s.includes('brain.mjs'))+1)"`.) `npm test` (`node scripts/organism_test.mjs all`) parses those same two strings and runs every member **independently**, reporting all of them. Use the chains to fail fast; use `npm test` to know.
- `npm run organism:selftest` — (corrected 10 Aug 2026: this said "Runs **all** test suites for the underlying organism anatomy and core organs" until today. It runs **one of two** suites, and as an `&&` chain it stops at the first red organ. Evidence: the `organism:selftest` and `squad:selftest` strings in `package.json`, plus the `_runner_law` note sitting between them.) Runs the organism-anatomy / core-organ suite. Read its live membership from `package.json` — never from prose, it grows most weeks.
- `npm run squad:selftest` — Validates the learning state, time auditing, and squad calibration modules. (Still true 10 Aug 2026: `learning_state.mjs`, `timeaudit.mjs` and `calibration.mjs` are all in the chain — but so are a dozen more, including `capture`, `forge_session`, `fsrs`, `nemesis`, `manager`, `rejirah`, `python_state`, `widget`, `captains_call`, `benchmark` and `gate_tune`. Read the string in `package.json` for the live list.)
- `npm run dugout` — Boots up the real-time spoken coach, creating the primary voice and vision interface (powered by Gemini Live). (Verified 10 Aug 2026 — it serves `http://localhost:4114`, the captain's number; `grep -n "const PORT" scripts/dugout.mjs`.)

> **A coverage law lives in `package.json`, not here** (`_selftest_coverage_law`): every `scripts/*.mjs` that has a `selftest` mode must appear in exactly one of the two suites, in the same commit that adds it. Since 6 Aug 2026 `node scripts/organism_test.mjs coverage` asserts that mechanically, so the next omission fails a test instead of waiting for an audit. The one deliberate exception is `repo_bundle` (a generator, no selftest). *(Run live 10 Aug 2026 while repairing this file: `node scripts/organism_test.mjs coverage` → 6 passed, 0 failed. Re-run it rather than believing that sentence — an unrun check is a hypothesis.)*

### The Claude Skills — count them live: `ls .claude/skills/`
The system defines custom skills inside the `.claude/skills/` directory (one `SKILL.md` per folder) for Claude's use during deep thinking.

> **(corrected 10 Aug 2026: the heading said "The 11 Claude Skills" and the body said "defines 11 custom skills". Live check the same day — `git ls-files ".claude/skills/*/SKILL.md" | wc -l` → **15**. Four skills shipped after this file was last written on 15 Jul 2026 and never reached it: `learn` (18 Jul), `fire` (9 Aug), `harvest` (9 Aug), `gist-patch` (9 Aug) — dates from `git log --diff-filter=A`. A hardcoded count in a README rots on the very next skill, so the heading now names the command instead of a number, and the list below is a snapshot with a date on it.)**

Snapshot, 10 Aug 2026 — re-derive it with `ls .claude/skills/` rather than trusting this list:
1. `fire` — *(new since the 15 Jul list)*
2. `forge`
3. `full-time`
4. `gem-sync`
5. `genome`
6. `gist-patch` — *(new since the 15 Jul list)*
7. `harvest` — *(new since the 15 Jul list)*
8. `learn` — *(new since the 15 Jul list)*
9. `matchday`
10. `organism-doctor`
11. `paint`
12. `paste-session`
13. `rematch`
14. `scrimmage`
15. `talk`

## The Hard Laws

The organism's constitution is enforced in code, not in prompts. These are the inviolable laws of the system:
- **No Metered API Key Ever:** Hard code-enforced financial ceiling. Claude usage is strictly via OAuth Max subscription to prevent infinite API billing; Gemini uses multiple free-tier developer keys.
  - *(Verified 10 Aug 2026 — this one is real and it is in the code, not the prose. Four organs refuse outright if `ANTHROPIC_API_KEY` is set: `brain.mjs` (`guards.refuse_if_api_key_env`), `cortex.mjs`, `claudegen.mjs`, `talk.mjs`; `council.mjs` silently skips its Claude cross-family chair rather than spend a metered token. Verify: `grep -rn "ANTHROPIC_API_KEY" scripts/*.mjs`. The Gemini key pool is `GEMINI_API_KEY` + numbered siblings out of `~/.gemini/.env`, rotated on quota: `grep -n "GEMINI_API_KEY" scripts/dugout.mjs`.)*
- **Personal Data is Gitignored:** The repo is public, but all personal transcripts, biometrics, and state files remain completely local and strictly excluded by `.gitignore`.
  - **(corrected 10 Aug 2026 — this was the most dangerous line in the file, because someone acting on it would push without a glance. The word that is wrong is "all". `.gitignore` is a hand-written denylist, and the captain has deliberately ruled several personal files ONTO the public remote:**
    - **`readiness.json` (Oura biometrics) and `intake_log.json` (medication-intake timing) are TRACKED**, by his decision **D10, 5 Aug 2026**, re-put to him BY CLASS on 10 Aug 2026 (medication timing, drug names as field keys) and re-confirmed — *"dono rehne do"*. Both rulings are recorded verbatim in `.gitignore` itself, under the "personal health / medication data" and "KAAM 0" blocks, precisely so the reversal is auditable and the next reader knows it is a **decision, not an oversight**.
    - **`reps_log.jsonl` (his study reps) is TRACKED**, same D10 ruling.
    - Going the other way, some files that WERE public are now stopped: `captains_call.json` was untracked on 10 Aug 2026 after it had already reached the public remote (one card carried a verbatim window of a memory fact). His ruling that day: history is **not** rewritten, because a rewrite is not a full erase — this stops the bleed and nothing else.
    - So the honest statement of the law is: **transcripts, moments, hippocampus memory and voice/vision state are excluded by construction; biometrics and reps are on the remote by the captain's explicit, twice-confirmed word.** Never assert the split from this file — read `.gitignore` (it is annotated with the reason for every rule) and count live: `git ls-files "dressing-room/state" | wc -l` vs `ls dressing-room/state | wc -l`. **Glance before every push.**)
- **Humane Clamps:** No artificial hype, no shame spirals, no unbroken streaks, no anxiety-inducing countdowns. The system acts as an energy giver and operates on earned proactivity (win-only voicing).
  - *(Verified 10 Aug 2026, all four clamps found live in code, not just in prompts: the honest-frame ban ("never 10x, exponential, on steroids; no shame, no streaks, no countdowns") is compiled into the deep-brain instruction — `grep -n "no shame, no streaks" scripts/cortex.mjs` — and asserted by a selftest on the outbound push, `grep -n "no shame/streak/hype" scripts/brain.mjs`. Win-only voicing is enforced in `shadow.mjs`, `twin.mjs`, `postmatch.mjs` and `hippocampus.mjs`: `grep -rn "win-only" scripts/*.mjs`.)*
- **Medical Clamp:** Biometrics never drive a verdict alone. Prosody or emotion never feeds a score. A "RED" state means doctor-referral or rest—never self-interpreted by the LLM.
  - *(Verified and made precise 10 Aug 2026. The first two clauses hold exactly: RED requires a sustained multi-day sleep-architecture convergence and can never be triggered by a lone readiness number or a confounded medicated RHR/HRV reading (`grep -n "RED is RARE" scripts/oura_coach.mjs`); prosody/emotion/tone/stress/mood/sentiment are STRIPPED at the thalamus door before an event is even logged, nested fields included (`grep -n "AFFECT_FIELDS" scripts/thalamus.mjs`).*
    *The third clause compresses **two separate mechanisms** into one phrase, which is worth knowing before you act on it: a **RED verdict** sets the day's ceiling to LOW — i.e. **rest** ("If the body verdict is RED: the only agenda is rest", `grep -n "the only agenda is rest" scripts/dugout.mjs`). The **doctor referral is an independent safety flag**, not the verdict: `safety.refer_doctor` fires on ≥3 consecutive days of ≥2 clean concerning physiological signals and is computed regardless of GREEN/AMBER/RED (`grep -n "refer_doctor" scripts/oura_coach.mjs`). Both are deterministic code, so "never self-interpreted by the LLM" holds — no LLM is in that path at all.)*
