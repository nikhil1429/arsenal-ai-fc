# CLAUDE.md — Arsenal AI FC

> Read this at the start of EVERY session. This repo has an operating system;
> follow it. If anything here conflicts with a request, surface the conflict —
> don't silently override.

## What this is
A football-club-themed **multi-agent personal accountability + execution system**
for Nikhil (human captain #14). Deterministic Node scripts (`.mjs`, Windows /
Node 22). Agents read/write a JSON **state bus** at `dressing-room/state/*.json`
(single writer per file). Scheduling via Windows Task Scheduler (`schtasks`) +
`ntfy.sh`. LLM calls via `claude -p` (Max subscription — **never** an API key).

## Build order (STRICT — one agent at a time, sequential)
1. **Goalkeeper** (Oura readiness coach) — v2 recalibrated, DONE, pending live run.
2. **Time-Auditor** (ActivityWatch tracker) — DONE.
3. **The Manager** (roster Dugout #1; 3rd in build order) — **NEXT: M-1** =
   `manager.mjs` deterministic wrapper, **no LLM**, testable on dummy data.
Do not start a new agent until the current one is proven (see "unrun" below).

## Non-negotiable principles
- **Layering, never replace.** When changing an engine, freeze the old one
  verbatim (e.g. `analyzeLegacy`) in the same file; the new one is the plan of
  record. Both stay in the codebase. README/migration note documents why.
- **AI proposes · code validates · human approves.** Use the LLM only for
  semantic/unbounded tasks. Use deterministic code for math, thresholds, and
  validation. The Manager only ever *proposes* — it never auto-acts.
- **Implementation-before-modification.** Get explicit approval on the plan
  before writing code for anything non-trivial.
- **No auto-approve.** Never save to memory or edit canonical files without
  explicit approval. Canonical files (live truth) = `OPS_STATE.md`,
  `ARSENAL_AI_FC_MASTERPLAN.md`, `THE_MANAGER__Master_Prompt.md`, `THE_GAFFER.md`
  (on Google Drive). If you change one without authorization, flag it loudly.
- **"Unrun system = hypothesis."** Nothing is "done" until it has actually run.
  Write the test, RUN it, show output. Mock tests use no live credentials.
- **Brain rotation:** Sonnet for routine work, Opus for complex/soul work — not
  fixed Opus.

## The Goalkeeper — medical boundary (hard rules)
- It is a **data-analyst, not a prescriber.** Interpret Oura data ONLY.
- **Never** comment on, optimise, or adjust medication. Hard block on any
  dose/diagnosis language.
- Nikhil is medicated → RHR / HRV / temperature are **low-confidence** signals
  and can NEVER drive a verdict alone. Verdicts ride on sleep-architecture
  trends, resilience, and sleep-vs-his-own-baseline.
- Sustained concerning physiology → **DOCTOR-REFERRAL** flag, full stop.
- Any mood/agitation flag (not wired) → "show your doctor" (akathisia as a
  differential), never self-interpreted.

## Secrets & safety
- Repo is **PUBLIC**. `oura_secrets.json` + `oura_tokens.json` are gitignored —
  **never commit them.** If already tracked: `git rm --cached <file>`.
- `readiness.json` / `intake_log.json` hold biometric + medication-timing data.
  Treat as private (gitignore or keep repo awareness).
- **Glance before every push.**

## Working style with Nikhil
- Hinglish, direct, honest — not a hype-man. Push back on vague/wrong.
- Business-first thinker; frame through impact, not jargon.
- Finance concepts (if they come up): teach from zero, no assumed recall.
- Live Oura run needs the gitignored tokens → run it in the real project folder
  (or add a `.worktreeinclude` listing the token files) so a Git-worktree
  session can see them.

## Files of record
- `OPS_STATE.md` (Google Drive) — live operational anchor; read first each thread.
- `GOALKEEPER_v2_migration.md` — what changed in the Goalkeeper recalibration.
- Repo: `nikhil1429/arsenal-ai-fc`, branch `main`.
