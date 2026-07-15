# Arsenal AI FC ⚪🔴

**Arsenal AI FC** is a football-club-themed multi-agent personal accountability and execution system built for one specific user. Built for **Node 22**, using **ESM** modules on **Windows**, it runs entirely as a set of deterministic `.mjs` organs. These components communicate asynchronously over a git-based, single-writer JSON state bus located in `dressing-room/state`.

## The Two-Speed Cyborg Brain

The cognitive core of the system is a two-speed "cyborg brain" designed to provide instant response and deep reasoning:
- **Reflex Brain (Fast):** Powered by Gemini Live, providing instant reflexes for voice and vision.
- **Deep Brain (Slow):** Powered by Claude Opus via `cortex.mjs`, taking over when true, profound judgment is required.
- **The Relay:** The entire system is governed by a `thalamus` salience relay, which scores incoming moments and dictates when the deep brain needs to be awakened versus when the reflex brain is sufficient.

## The Three Layers

The organism operates across three distinct functional layers:
1. **Learning Layer:** Gathers and processes study routines, spaced repetition concepts, and manages the assimilation of new data.
2. **Outwork-Execution Layer:** Manages daily goals, tracks work sessions, guards time limits, and ensures the daily threshold of effort is met.
3. **Cyborg Brain Layer:** Evaluates inputs, executes long-term strategic decisions, dynamically routes tasks, and schedules overnight background processing.

## How to Run It

This is a personal, bespoke rig, not a consumer SaaS application. However, the system leverages strict automated selftests and tools to ensure every component runs flawlessly.

### Core NPM Commands
- `npm run organism:selftest` — Runs all test suites for the underlying organism anatomy and core organs.
- `npm run squad:selftest` — Validates the learning state, time auditing, and squad calibration modules.
- `npm run dugout` — Boots up the real-time spoken coach, creating the primary voice and vision interface (powered by Gemini Live).

### The 11 Claude Skills
The system defines 11 custom skills inside the `.claude/skills/` directory for Claude's use during deep thinking:
1. `forge`
2. `full-time`
3. `gem-sync`
4. `genome`
5. `matchday`
6. `organism-doctor`
7. `paint`
8. `paste-session`
9. `rematch`
10. `scrimmage`
11. `talk`

## The Hard Laws

The organism's constitution is enforced in code, not in prompts. These are the inviolable laws of the system:
- **No Metered API Key Ever:** Hard code-enforced financial ceiling. Claude usage is strictly via OAuth Max subscription to prevent infinite API billing; Gemini uses multiple free-tier developer keys.
- **Personal Data is Gitignored:** The repo is public, but all personal transcripts, biometrics, and state files remain completely local and strictly excluded by `.gitignore`.
- **Humane Clamps:** No artificial hype, no shame spirals, no unbroken streaks, no anxiety-inducing countdowns. The system acts as an energy giver and operates on earned proactivity (win-only voicing).
- **Medical Clamp:** Biometrics never drive a verdict alone. Prosody or emotion never feeds a score. A "RED" state means doctor-referral or rest—never self-interpreted by the LLM.
