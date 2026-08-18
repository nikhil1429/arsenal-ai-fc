# HANDOFF — AUDIT #107, THE LEARNING-LAYER WIRING REPAIR
**Written 5 Aug 2026, end of session. READ THIS FIRST if you are the next session.**

This is a carry-forward, not canon. Canon is `learning-layer/PROJECT_OS.md` + `FORGE_SPEC.md` +
`FORGE_DESIGN.md`; the map is `learning-layer/LEARNING_LAYER_MAP.md`; the version history is
`learning-layer/OS_CHANGELOG.md` **v3.14**, which carries the same repair in canon form.
If this file and canon disagree, **canon wins and this file is wrong.**

---

## 0. WHAT THIS SESSION WAS

The captain asked for the whole learning layer to be explained, then audited, then **fixed —
every single item**. A 31-item defect list was produced from measurement (not from docs), he
ruled on 12 decisions, and the repair shipped. **META-FREEZE was overridden by him explicitly
and repeatedly** ("we need to fix the issues first" / "we need to fix every single issue") —
that is the exception canon allows, and it is logged in `OS_CHANGELOG.md` v3.14 as canon requires.

**The one-line finding:** the code was never broken. All 25 organs passed their selftests before
the repair and after it. What was broken was **delivery, write-paths and ownership** — things
that existed but never reached the session, and things the session could read but never write back.

---

## 1. HIS DECISIONS — these are now canon, do not re-open them

| id | decision | note |
|---|---|---|
| **D0** | META-FREEZE overridden for this repair | logged, v3.14 |
| **D1** | CONTEXT WARNING rides the **transcript's SIZE**, not the turn counter | *refined mid-session after measurement — see §3* |
| **D2** | SessionStart budget = **12,000 chars**, spent worst-priority-first, with a manifest footer | |
| **D3** | Re-Jirah results go to `rejirah_log.jsonl`; controller fields are **DERIVED**. **Capsules are NEVER written to.** | ⚠ **see §6 — this was decided without reading `FORGE_SPEC.md` in full** |
| **D4** | **FSRS owns WHEN** a concept returns · **FORGE/rejirah owns WHICH AXES + HOW HARD** | no more scheduler conflict |
| **D5** | Widget = **registry (A)**, never a generator | a generator makes the generic widget canon forbids |
| **D6** | **No** — do not draft fixes for the 17 flagged doubts yet | content is his; only he edits the gist |
| **D7** | **No** auto-close of a stale forge session | his agency, not the machine's |
| **D8** | SprintSync **ON**, plus a `synced_at` stamp the brief age-tags | |
| **D9** | **No** METHOD block without an open session | obligation moved into `/forge`, which now auto-`start`s |
| **D10** | His personal study/health data **travels with the repo** (ruled twice, files named) | **credentials and anything naming OTHER people stay ignored** — not covered by his ruling |
| **D11** | Target = **17 concepts** (`PROJECT_OS.md:190`), 4 locked, **13 to go** | |

---

## 2. WHAT SHIPPED (committed — 19 files, +1,940 / −69)

**New organs**
- **`scripts/rejirah.mjs`** — the Re-Jirah controller and **the loop's missing back edge**.
  `grade <concept> <axis> held|cracked --gut <word>` · `state [concept]` · `due`.
  Every controller-v0 reserved field is DERIVED: `axisType` · `nextDue` · `lastResult` ·
  `calibrationGap` · `fluencyState` · `edgeMap`. Clean hold **expands** that axis's interval;
  a crack **resets** it; **confident-and-cracked escalates** (tighter + harder mode).
  25 selftests, write path proven against a real temp file.
- **`scripts/widget.mjs`** — the Visualization Contract's registry (it had **no code owner**;
  `viz.mjs` is the club wall, not a concept-widget engine). `list` · `register` · `open`.
  Standard is **"driven", not "built"** — <2 guess-gates reads `built, NOT driven`.
- **`scripts/context_manifest.mjs`** — the SessionStart assembler. 12k budget, footer names every
  part's bytes and anything MISSING or TRIMMED. Surfaces **PENDING IDENTITY FACTS**, which
  previously only `get_context` showed — and `get_context` is a call a model must *remember*.

**Changed**
- `teaching_contract.mjs` — transcript-size fill gauge (soft 60% / hard 100%), `tx:` anchor class,
  `hookPayload()` caching (fd 0 is one-shot), `transcript_warn_bytes` in state.
  `doneConcepts()` now reads **Sheet ∪ locked capsules** with fuzzy dedupe.
  Frozen verbatim beside their successors: `bumpTurnLegacy` · `blockLinesLegacy` · `blockLinesV2` ·
  `resolveAnchorLegacy`. **51 selftests.**
- `learnstate.mjs` — renders through the assembler (falls back to the frozen path on any throw);
  `loadMemory(cap)` takes the caller's cap, default unchanged; sprint freshness tag.
- `capture.mjs` — new **`rep`** verb: one rep, as it happens, through the **same** validator/dedupe.
- `doubtminer.mjs` — gate2-flagged doubts are **held out of the rematch queue**
  (`eligible:false`, `ineligible_reason`). Content untouched; re-admitted automatically on repair.
- `sprintsync.mjs` — writes `progress.synced_at`.
- `.claude/settings.json` — SessionStart now runs `teaching_contract.mjs reset-turns` **first**;
  **`PreCompact`** added (prints the brief).
- `.claude/skills/forge/SKILL.md` — **auto-`start` is now the skill's first action**; rejirah grade;
  widget registry; `capture rep`; Gate-2 count corrected 16 → **17**.
- `.claude/skills/learn/SKILL.md` — rejirah grade in the Re-Jirah branch; forge auto-start note.
- `CLAUDE.md` — OPS_STATE is at **repo root**, not Google Drive (that line was wrong); OPS_STATE is
  **stale for the learning layer**; new organs documented.
- `.gitignore` — D10 applied, with the previous rules frozen in a comment so the reversal is auditable.
- `learning-layer/OS_CHANGELOG.md` — **v3.14**, nine numbered findings.

---

## 3. THE MEASUREMENTS — do not re-measure these, they are recorded

**The clock defect (the one that was invisible).** Across three consecutive turns of ONE
conversation the Claude Code session id changed — `bd2d46c2…` → `fa94c375…` — and the turn
counter went **1 → 1 → 2**. It zeroed at exactly the moment context was *largest*. Audit #38's
"always fires" had inverted into the worse, silent **"never fires."**
`transcript_path` is not the fix either (a fork mints a new file) — **but the new file inherits
the history: 710,280 → 958,257 bytes.** Size survives what identity does not.

**The threshold, derived from his own history** (3,780 transcripts in this project's store):
p50 **28,197** · p90 **63,367** · p95 **99,557** · p99 **2,263,929** · max **12,171,532** bytes.
Only **49 (1.3%)** ever pass 1 MB — those are the long study sessions. Warn budget **1,500,000**
therefore fires on ~1% of sessions and can never become the line he learns to ignore.
It is a **v0 hypothesis** (transcript bytes ≠ context tokens) and lives in state, retunable.
*It fired for real at the end of this session: 1.76 MB = 123%.*

**The memory loss.** Cartridge **4,157** chars, `MEMO_MAX` **2,200** → **1,957 (47%) dropped
silently at every SessionStart**. Brief now assembles at **7,345 / 12,000** with memory at 4,157/4,157.

**The method, honestly.** `forge_sessions.jsonl`, four recorded runs, all on `hallucinations`:

| ended | steps | axes | elapsed | method_clean |
|---|---|---|---|---|
| 31 Jul 12:25 | 6/12 | 5/9 | 1251.4 min | false |
| 31 Jul 22:51 | 4/12 | 0/9 | 626.2 min | false |
| 02 Aug 09:00 | 3/12 | 0/9 | 2045.2 min | false |
| 04 Aug 16:24 | 3/12 | 0/9 | 3320.2 min | false |

Zero LOCK, zero capsule, **CORE axis `d` never closed in any run**, `pehle_guess 0 · widget_gate 0
· check_q 1 · jirah 0`. **THE METHOD has never once completed.** No code fixes this.

**Everything else.** `reps_log` = **9 lines** → calibration (gate 20), nemesis (20) and
learning_state (12) are ALL still dormant *by law, not by breakage*.
Capsules **4** — tokenization · embeddings · inference · context — **80,511 chars of `deep` across
36/36 axes**, and `reJirahDone` is `[]` for three of the four (tokenization has two rounds).
Overdue: tokenization R3 ~8d · embeddings R1 ~42d · inference R1 ~39d · context R1 ~35d.
Gate 2: **112 checked, 17 flagged** (cryptic 7 · meta 8 · fragment 2 · near-dup 0) → tape room is
now **95 eligible, 17 withheld**. **17 is a MACHINE FLOOR, not the truth** — the detector is a fixed
pattern list, so the real count is ≥17.
Widgets: **0/4 locked capsules have one**; the single file in the repo (`hallucinations.html`,
30 Jul) is an **orphan** — its concept is not locked.
Teaching contract: **10 rules** (5 seeded + `one-idea` + `deeper-not-longer` +
`no-meta-midconcept` + `literal` + `you-are-here`).

---

## 4. THE FIRST THREE THINGS NEXT SESSION — in this order

1. **Read `FORGE_SPEC.md`, `GEMINI_LOOP.md` and `PYTHON_SYLLABUS.md` IN FULL.** Not grep. See §6.
2. **Re-check D3 against the full `FORGE_SPEC.md`.** If the spec says something the derived-fields
   design misses, **reverse it and say so out loud.** The code is green either way; the *reasoning*
   is what was never verified against the whole text.
3. **Build `python_state.json`** — the spec is already canon, it does not need designing:
   ```
   { subtopic, tier, fluency: "🔴"|"🟡"|"🟢", close_sign_at, watch_list[], last_packet }
   ```
   `GEMINI_LOOP.md:406` — *"SUBTOPIC close = packet CLOSE-SIGN (LIGHT). **Roz-ka unit**"* → 🟡 Held.
   THREE-GRAIN CLOSE (§11.3): subtopic (daily) → tier (milestone, **capsule NAHI**) →
   foundations-concept (Forge 9-axis, **never** on Python). `:193` says a fresh Claude thread must
   READ this first — so canon already demanded this file; nobody built it.
   Single writer; `learnstate.mjs` splices its brief exactly like `courseBrief()` does.

---

## 5. STILL OPEN — split honestly

**~~Blocked on him~~ SUPERSEDED — DO NOT RUN (9 Aug 2026 launch audit):** the five tasks
below are now DELIBERATELY Disabled — heartbeat chain + conductor + START_DAEMONS own those
organs, and re-enabling the tasks would double-run them. The command is kept only as history:

```
schtasks /change /tn ArsenalFC-Heartbeat /enable && schtasks /change /tn ArsenalFC-SprintSync /enable && schtasks /change /tn ArsenalFC-Mirror /enable && schtasks /change /tn ArsenalFC-Turnstile /enable && schtasks /change /tn ArsenalFC-Thalamus /enable
```
FSRS / Calibration / Nemesis / LearningState are **deliberately left disabled** — the heartbeat
chain runs all four (one writer-chain, one failure surface). Turnstile and Thalamus daemons are
running now but **die on reboot** without their tasks. Also: `git push` is his.

**Open code, not done:**
- **#19 `THE-FORGE.html`** — **CLOSED 9 Aug 2026** (his word: "as of now forge.html mein hi
  rakho"): built IN-REPO at the root (the off-repo copy was lost — the exact out-of-git rot
  the Drive-tag scar documents). Live gist fetch + baked SNAP fallback, renders EVERY capsule
  field incl. `deep`+`viz` with a completeness footer (FORGE_DESIGN §4). Regenerate:
  `node setup/build_forge_html.mjs`.
- **#26 `python_state.json`** — spec above, not built.
- `dressing-room/state/bootroom_log.jsonl` and `conductor.json` are **untracked and uncovered by
  `.gitignore`** — daemon output, deliberately left out of this commit. A small separate decision.
- 14 of the 17 cold-start-card rules still arrive only once per session; three highest-damage ones
  were seeded into the per-turn rotation. All 17 cannot fit the 5-line anti-wall law.

**Only he can do:**
METHOD actually running end-to-end (#7-9) · sitting the Re-Jirah rounds (#10) · repairing the 17
doubts' wording on the gist (#14, he deferred) · 13 more capsules (#16) · producing reps (#21) ·
the course chapter paste (#24 — `course.json` still `present:false`, and **1-05 and 1-06 are both
course-track**) · gem sync (#27, stamp is 30 Jul).

---

## 6. THE HONEST CAVEAT — read this before trusting §2

**I was not fully aligned with the organism when I made these calls.**

**Read in full:** `LEARNING_LAYER_MAP.md` · `.claude/skills/forge/SKILL.md` · `learn/SKILL.md` ·
`learnstate.mjs` · `teaching_contract.mjs` · `deep.mjs` · `context_manifest`'s neighbours ·
25 organs' selftests · `.gitignore` · `.claude/settings.json`.

**NOT read — only grepped:** `FORGE_SPEC.md` (32 KB) · `GEMINI_LOOP.md` (37 KB) ·
`PYTHON_SYLLABUS.md` (22 KB) · `FORGE_DESIGN.md` (18 KB) · `HOW_HE_LEARNS.md` (26 KB — only the
cold-start card arrived, via the hook) · `OPPONENT_SCOUT.md` · `DAILY_CADENCE.md` · most of
`PROJECT_OS.md`.

**The consequence already showed up once.** I told him the Python track needed a design decision
about its unit. It did not — `GEMINI_LOOP.md:406` defines it plainly. He caught it. **The most
expensive instance of the same gap is D3**, where I rejected `FORGE_SPEC.md`'s own stated plan for
populating the reserved fields while having read only a summary of that spec. The decision still
looks right and its code is green — **but the opinion does not stand on the whole text.** That is
why §4 item 2 exists.

---

## 7. HIS RULES THAT COST THE MOST WHEN BROKEN

- **His clear instruction > your understanding. Never cut scope silently — ASK.** (drifted 2× on record)
- **ONE new idea per message, ONE check-question, then STOP.** 2 items break him; 3 break him harder.
- **Deeper, never longer.** *"jitna dheere ho sake, har ek cheez poori tarah samjhao."*
- **Take him at his word.** "Samajh nahi aaya" is literally true — stop, restart from zero.
- **No system/notes/tool work mid-concept.** Name it, park it, hand back the micro-question.
- **Gut-word BEFORE the answer, never re-graded after. No gut-word, no rep.**
- **Owners-only writes:** `capture.mjs` · `hippocampus.mjs` · `forge_session.mjs` · `rejirah.mjs` ·
  `widget.mjs`. Never hand-edit a state file.
- **Analogies from everyday physical things only** (food, house, shop, city). Never geometric —
  every abstract analogy has failed him on record.
- **Call `organism-memory` MCP `get_context` at session start** (CLAUDE.md, non-negotiable).
  The brief now carries the full cartridge, but `get_context` is still the deeper door.
