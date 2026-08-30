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
**⛔ 20 Aug 2026 — THE ORGANISM IS SWITCHED OFF by his order** (all ArsenalFC tasks Disabled, daemons killed;
ONE exception: thalamus, capture-only, zero tokens). RED state lines are EXPECTED and deliberate; **re-enable
NOTHING** — the reboot is rung S12 of the open work order's §10 ladder, on HIS word only, stage by stage.

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

## LAW T — THE TOOLING LAW (19 Aug 2026, standing · universal · binds every session)
**Record: `docs/archive/TOOLING_LAW__2026-08-19.md`. Read it before proposing any tool, model or agent.**
His law: *zero token wastage* is **ROUTING, not austerity** — every unit of work goes to the cheapest
TIER that gives the SAME quality, depth and speed; paying above it is waste, paying below it is worse
(the answer gets redone). Ask first: **computation, breadth, or judgement?**
- **TIER 0 · deterministic code — free AND better.** `tsc --checkJs` + JSDoc · ESLint · dependency-cruiser
  · knip · semgrep (the organism's OWN laws, off hand-written regex) · c8 · Stryker. Each rides `npm test`
  as a gate, and **a gate may only get stricter**. Where a hand-rolled scan and an industry tool disagree,
  **the industry tool wins**; the hand-rolled one narrows to what only this organism can know.
- **TIER 1 · Gemini — BREADTH only.** Extended thinking **ON, always, both accounts** (his ruling; it costs
  him nothing and buys recall). **Nothing it says is believed without a TIER 0 check** (his ruling too —
  its RECALL is the product, not its precision). Its one unmatched job: the whole canon in ONE context.
- **TIER 2 · Claude — judgement only.** His intent · the SHAPE of a bug class · code that must be right.
- **Agents fan out by CONCERN, never by directory**, over `xray`'s graph, and every finding must name the
  cross-file path that produces it — the bugs here are non-local, and a chunked reader finds none of them.

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
- ⭐ **GAME ON — 30 Aug 2026, 7:30 AM IST. THE PRE-CYBORG ERA IS CLOSED** (his word; canon `7744acf1`).
  EVERY learning record dated before that stamp is **PRE-CYBORG: baseline/test, and it measures the
  INSTRUMENT, not him** — the capture was demonstrably broken (reps carry `confidence:null`,
  `latency_ms:null`, `aided:null`, the organism's own `confidence_source:"unrecorded-samjhao-era"`,
  and 22 were BACK-FILLED on 29 Aug rather than captured live). Kept, never deleted (L9); never cited
  as evidence of what he knows. **THE SYLLABUS RESTARTS AT THE FIRST TOPIC** — tokenization,
  embeddings, inference & sampling and context window are re-opened as UNLEARNED, and their Re-Jirah
  overdue clocks are pre-cyborg artifacts that must NOT drive the queue (a Re-Jirah tests a proof
  that no longer exists). ⚠ **BUT THE NOTES ARE NOT WITHDRAWN — ONLY THE PROOF IS** (his correction,
  same breath, canon `b40e585d`): *"keep my 4 closed topic notes data as a powerful resource and use
  that while teaching me everything from the scratch again."* The four capsules
  (`dressing-room/state/capsules/*.json`, ~211 KB, nine axes each, still IMMUTABLE) are the
  teaching resource — `doubts` holds HIS OWN questions, `traps` the exact baits he fell for,
  `calibration` what he predicted about himself. **Teach from zero WITH them open: they say in
  advance where he will break.** Never "you already know this" (HOW_HE_LEARNS #10).
  ~~DAY 1 = 18 Aug 2026~~ and the nine "official first day" declarations
  before it stand in canon, struck not erased: **this is the twelfth start, so it is held by a CODE
  PATH and not by intention** — his own law, *"jo cheez use yaad rakhni pade, woh ek DESIGN FAILURE
  hai."* Teaching is `samjhao`, never verbatim `padho`.
- ⚠ **AND THE INSTRUMENT MUST TURN TOWARD HIM.** Measured 30 Aug on the organism's own ledger:
  **78.0% of all tokens were spent by the organism on ITSELF, 17.3% reached his study**; the suite
  holds **129 tests for the organism and ZERO gates on him**; and `struggle-first` lives in prose,
  which by **L4** means it is not a law at all. From this era every organ carries the bar it already
  applies to itself — quality, intensity, gravity, and the shape of his ADHD brain — and what an
  organ reports FIRST is his number, not its own.

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
- `THE_GAFFER.md` — the Gaffer's spec. `ARCHIVE__DAY_ONE_SPEC.md` — law-referenced. the MODELS + ACTS record: `docs/archive/MODELS_AND_ACTS__2026-08-18.md` (LAW M + LAW A, built 18 Aug 2026) · **LAW T: `docs/archive/TOOLING_LAW__2026-08-19.md`**.
- `docs/archive/` — every record (the OVERHAUL plan + BUILD LOG `ORGANISM_OVERHAUL__2026-08-18.md`, MASTERPLAN, THE_MANAGER__Master_Prompt — canon for the gated sheet lane — the old CLAUDE.md).Records, not work orders.
- **TWO WORK ORDERS ARE OPEN (his word, 20 Aug 2026). Read the one your session is for; never mix them.**
  A session does ENGINEERING or LEARNING, not both — no system/notes/tool work mid-concept (HOW_HE_LEARNS #12).

ORDER-GATE: docs/archive/ORGANISM_AUDIT__2026-08-19.md

  ↑ a CONTRACT LINE, not prose — `rails.mjs orders` (the §3-C commit gate) resolves the blocking
  order from it and REFUSES to run if it is missing (ruled 25 Aug 2026; S10's registry absorbs it).
- **① ENGINEERING — `docs/archive/ORGANISM_AUDIT__2026-08-19.md`** — the audit + plan order, **running in
  parallel and expected to close by end of next week (~27 Aug)**. It carries HIS INTENT (§0), HIS GATE
  CORRECTION (§1 — C is "did it reach its RIGHT consumer"), what is measured, what is known FALSE, and
  **§10 (20 Aug) — THE EXECUTION PLAN: the session ladder S1–S12.** An engineering session **OPENS THIS
  FIRST**, pastes its version-3 prompt, and executes exactly ONE rung under §10-D's rules.
- **② LEARNING — `docs/archive/SAMJHAO_ORDER__2026-08-20.md`** — samjhao of the four closed fundamentals
  (tokenization → embeddings → inference → context), then Re-Jirah on all four. Multi-session; **§0 is the
  resume pointer and the ONLY place progress lives.** Method, notes law (what gets captured and where),
  scope, both research lanes, the 2026 patch list and the career picture are all settled there — do not
  re-derive them. Also carries §9: the **design lane is this lane's job now** (Claude Design retired).
- Its predecessor, **closed 19 Aug 2026 (all ten blocks ☑)**: `docs/archive/LOAD_ZERO__2026-08-19.md` — a record now, not a work order.
- Repo: `nikhil1429/arsenal-ai-fc`, branch `main`.
