# CLAUDE.md — Arsenal AI FC

> Read this at the start of EVERY session. Rewritten 18 Aug 2026 (OVERHAUL Block 1) to ≤ 8 KB: every number
> and location lives in a command, never in prose. Predecessor verbatim: `docs/archive/CLAUDE_2026-08-18.md`.
> If anything here conflicts with a request, surface it; never silently override.

## What this is
A football-club-themed multi-agent accountability + execution system for Nikhil (captain #14, ADHD-PI,
IST). Deterministic Node scripts (`.mjs`, Windows / Node 22) read/write a JSON state bus at
`dressing-room/state/*.json` under an **owners-only** law. LLM calls ride `claude -p` on the Max
subscription — **never an API key** (`ANTHROPIC_API_KEY` set ⇒ every organ refuses). Scheduling:
Windows Task Scheduler + `ntfy.sh`. **FREEZE: deferred by his word 18 Aug 2026 until the organism runs fine; the
guard is built and dormant** (`node scripts/freeze.mjs status`; it arms the day `FREEZE.md` returns to the root —
record: `docs/archive/FREEZE__deferred-2026-08-18.md`). **LAW M (18 Aug 2026): no organ names a model — a ROLE; `scripts/models.mjs`
resolves the live Gemini model + key and says why (`node scripts/models.mjs status` · `check` = 0 literals outside it).

## The ten laws (each is a code path — verify, never recall)
| # | Law | Verify |
|---|---|---|
| L1 | Intelligence at contact — the largest model sits in the conversation | `node scripts/brain.mjs spend 7` |
| L2 | One mind, many mouths — a surface is transport | `node scripts/sitting.mjs status` |
| L3 | Code drives, model composes, human speaks — no sitting is run by prose | `node scripts/forge_session.mjs contract` |
| L4 | A law is a code path or it does not exist — never a constitution paragraph | `node scripts/dugout.mjs selftest` |
| L5 | **THE GATE** — an LLM lane runs iff evidence exists ∧ its output reached HIM inside a window ∧ no fail streak; else it sleeps, journals, cards once, wakes ITSELF. No list, nothing deleted | `node scripts/brain.mjs gate show` · `gate wake <lane>` (his override, one window) |
| L6 | Transport law — small/frequent work never per-call `claude -p` | `node scripts/treasury.mjs` |
| L7 | Nothing he must remember or read — anchors, ONE card, one `state` line | `node scripts/captains_call.mjs status` |
| L8 | Numbers measured; gates open; guards not budgets; no calendar gate | `node scripts/limits.mjs` |
| L9 | Layering, never replace — freeze (`*Legacy`), fold, move; never delete | `git log -S` |
| L10 | Verifiable to him in one line, every anchor | `node scripts/state.mjs` |

## Session start (non-negotiable)
1. Call the **`organism-memory` MCP tool `get_context`** before teaching, planning or answering where he is — background context, true WHEN WRITTEN; `recall` for targeted lookups. Never ask him to re-explain what it knows.
2. Read the **STATE line** (line 1 of the SessionStart brief; `node scripts/state.mjs`) — pushed · daemons · suite · sitting · next · needs-you — so he never asks "is everything working?".
3. New durable facts go through `hippocampus.mjs` / MCP `note` + `remember_fact` (STAGES only; canon after he confirms). Never hand-edit state.

## Owners-only writes — the universal rule
Every state file has ONE writer; find it in the script header, never in a list here:
`grep -rn "SOLE WRITER\|sole writer\|single writer" scripts/*.mjs`. Deliberate exceptions are declared in code
(`brain_ledger.jsonl` is a SHARED APPEND LANE — `grep -n "shared append lane" scripts/talk.mjs`). Write to another
organ's file only through its CLI or exported writer. `node scripts/xray.mjs report` (Q2/Q5 must be 0) is the law's
mechanical check. Never hand-edit a state file.

## Rulings that are FINAL (verbatim; do not re-open, do not "harmonise")
- **PRIVACY, 14 Aug 2026:** *"archive HAMESHA repo ke bahar rahega. Code public, data private. Koi apwaad nahi, kabhi nahi."* Three code belts hold it: `archivist.mjs init` refuses a git work tree · `.gitignore` covers any bag · `hooks/pre-commit` tripwire (`node scripts/archivist.mjs tripwire`).
- **BIOMETRIC FILES STAY PUBLIC, 5 + 10 Aug 2026:** `readiness.json` / `intake_log.json` are TRACKED by his ruling, twice (`grep -n "RULED BY THE CAPTAIN, 5 Aug 2026" .gitignore` · `grep -n "dono rehne do" .gitignore`). The asymmetry with the archive is deliberate; a session that harmonises them reverses a captain's decision. Hard-ignored forever: `scripts/oura_secrets.json` · `scripts/oura_tokens.json` · anything naming OTHER people. **Glance before every push.**
- **THE GOALKEEPER'S MEDICAL BOUNDARY:** a data-analyst, never a prescriber. Interpret Oura data ONLY; **never** comment on, optimise or adjust medication (hard block on dose/diagnosis language). He is medicated ⇒ RHR/HRV/temperature are low-confidence and can NEVER drive a verdict alone; verdicts ride sleep-architecture, resilience, sleep-vs-baseline. Sustained concern ⇒ DOCTOR-REFERRAL flag, full stop. Any mood/agitation flag ⇒ "show your doctor", never self-interpreted.
- **VISUALIZATION CONTRACT STANDS, 1 Aug 2026** — *"11 point yes visuals are important for my adhd pi brain"* (`grep -n "11 point yes" learning-layer/HOW_HE_LEARNS.md`). One widget per concept; the widget IS the lesson.
- **CAPSULES ARE IMMUTABLE, their prose SACRED** — never re-emit a locked capsule; `capsules/` is a read-only mirror (`mirror.mjs` sole writer); his two paste-writes (`reJirahDone`, `doubts[]`) are the only edits.
- **THE CAPTAIN'S CALL, 7 Aug 2026:** reports are MACHINE-face; anything needing his word is ONE one-line card at an anchor he already hits (`node scripts/captains_call.mjs file --line "…"`), max ONE dealt per anchor. **If a thing needs the captain, it rides an anchor; if it cannot ride an anchor, it does not need the captain.**
- **DRIFT IS SELF-REPORTED and auto-counts, 7 Aug 2026 (his "ok do it..")** — the moment you break a teaching-contract rule, in that turn: `node scripts/teaching_contract.mjs flag <rule-id> --why "…"`. `unhit-auto <id>` walks it back. His `hits` lane is his alone.
- **SESSION-AGNOSTIC, VOCAB-AGNOSTIC, 15 Aug 2026:** never pattern-match the last incident's words or situation.
- **DAY 1 = 18 Aug 2026:** all earlier data is baseline/test; official learning starts now. Teaching is `samjhao`, never verbatim `padho`.

## Working style
Hinglish, direct, honest — not a hype-man; push back on vague/wrong. Business-first framing. Teach from zero. Live Oura runs need the gitignored tokens in `scripts/` (`.worktreeinclude` carries them). **Unrun system = hypothesis** — write the test, RUN it, show output. **AI proposes · code validates · human approves.**

## The learning layer (where he actually studies)
Read `learning-layer/LEARNING_LAYER_MAP.md` first (a map; canon wins). Canon in precedence: `PROJECT_OS.md` (THE METHOD, 12 steps, 9 axes) → `FORGE_SPEC.md` (capsule schema, cold-reader bar) → `FORGE_DESIGN.md` → `HOW_HE_LEARNS.md` (evidence + the 17-rule card). Four question-moments; gut-word before every answer. Surfaces: `ls .claude/skills/`. Re-Jirah: `node scripts/deep.mjs`. Judgement = the truth layer: bank instant + model-free (`bank_answer`), ONE Opus judge at round close (`judge_round`); every verdict has a way back.

## Read the numbers live — never from any document
| Question | Command |
|---|---|
| Everything working / pushed / next · the week board | `node scripts/state.mjs` · `state.mjs week` |
| Which LLM lanes are asleep and why | `node scripts/brain.mjs gate show` |
| Brain jobs, evidence, truth lane | `node scripts/brain.mjs status` · `spend 7` |
| The Watcher | `node scripts/gaffer_brain.mjs status` |
| The permanent record | `node scripts/archivist.mjs status` · `verify` |
| Every scheduled organ · the freeze | `node scripts/pulse.mjs report` · `watchman.mjs report` · `freeze.mjs status` |
| The whole body | `/organism-doctor` |
| Suite | `npm test` (authority; the chains fail fast) |

## Files of record
- `OPS_STATE.md` — a pointer to `state.mjs`. Old bodies: `docs/archive/`.
- `THE_GAFFER.md` — the Gaffer's spec. `ARCHIVE__DAY_ONE_SPEC.md` — law-referenced. `MODELS_AND_ACTS__2026-08-18.md` — the live work order (→ archive when ✅).
- `docs/archive/` — every record (the OVERHAUL plan + BUILD LOG `ORGANISM_OVERHAUL__2026-08-18.md`, MASTERPLAN, THE_MANAGER__Master_Prompt — canon for the gated sheet lane — the old CLAUDE.md).Records, not work orders.
- Repo: `nikhil1429/arsenal-ai-fc`, branch `main`.
