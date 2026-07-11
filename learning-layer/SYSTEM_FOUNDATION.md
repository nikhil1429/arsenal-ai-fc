# SYSTEM_FOUNDATION — Arsenal AI FC · consolidated base (Pass-1 diagnosis + Pass-2 repair-blueprint)
**[CONSOLIDATED BASE — Pass-1 + Pass-2, verbatim merge]**

> **What this file is.** A straight consolidation of the two prior metacognition passes into one base document — **verbatim; nothing added, deleted, softened, or reinterpreted.** No new analysis lives here.
>
> **Pass-1 (`SYSTEM_METACOGNITION.md`) — the DIAGNOSIS: what IS.** Read from disk, agents run to capture real schemas, every load-bearing claim adversarially re-verified. It maps the two layers as-built, the real emitted schemas, and locates the defects exactly (**7.1–7.10**) with an evidence-grade ledger (**[RUN]/[DISK]/[AGENT]**).
>
> **Pass-2 (`SYSTEM_BLUEPRINT.md`) — the REPAIR-BLUEPRINT: what SHOULD BE to fix/wire what exists.** For both layers + the weld: the ceiling end-state, the delta current→ceiling (referenced to 7.1–7.10), the **9 open-fork** recommendations, second-order wiring ideas, and the single sequenced path. Evidence-grade (**[DISK]/[AGENT]/[ASSUMPTION]**).
>
> **Scope line — read this.** This consolidated file is the **REPAIR-AND-WIRE base**: it diagnoses the system as built and prescribes how to fix, calibrate, and wire *what already exists*. It is **NOT** a from-scratch re-imagination of the system — that is the next pass.
>
> **Merge rules honored.** Pure consolidation. Every finding, defect, fork, recommendation, `file:line` citation, and `[RUN]/[DISK]/[AGENT]/[ASSUMPTION]` tag is preserved exactly. The two source files are left untouched on disk. Each pass keeps its own front-matter, honest-frame note, evidence-legend, and read-ledger — they document two distinct production runs and differ in wording, so **both are retained** (no exact-duplicate paragraph was dropped; nuances are never collapsed). Part 3 is a navigation-only cross-reference that collates links **already present** in the two files and asserts no new claim.

═══════════════════════════════════════════════════════════════════════════════
# PART 1 · PASS-1 — THE DIAGNOSIS (what IS)
*Below is `learning-layer/SYSTEM_METACOGNITION.md`, reproduced verbatim. Nothing altered.*
═══════════════════════════════════════════════════════════════════════════════

# SYSTEM_METACOGNITION — Arsenal AI FC · the LEARNING layer + the OUTWORK layer
**[DRAFT — captain review]**

> **What this is.** A full-system, two-pass metacognition of the *system around* both layers — read from disk (repo = truth), agents run to capture real schemas, then every load-bearing claim adversarially stress-tested and re-verified against disk. **Nothing here is committed canon.** It proposes; you decide. Genuine design choices are surfaced as **OPEN FORK** — never silently picked.
>
> **Guardrails honored.** (1) **Pedagogy is untouched.** How you *study* — the FORGE method, Jirah, the 9-axis drill, cold-reader doubt-capture — is Nidhi's domain and is **not** analyzed or redesigned here. This is about the wiring, signal, scheduling, and accountability *around* learning. System and method are separable. (2) **No hype.** The honest frame is *compounding, self-correcting, directed-efficiency* — the multiplier is your consistency, the ceiling is biology. "Ceiling" below means **maximum depth-of-effect per load-bearing word**, scope-matched. (3) The Manager **M-2 soul** (`system.md`) is in progress in another thread and is **not** evaluated as final.
>
> **How it was produced.** 7 parallel readers + 1 empirical runner + 3 adversarial critics (workflow), plus the orchestrator's own disk reads of the load-bearing sources (`capture.mjs`, `FORGE_SPEC.md`, `manager.mjs`, all live `state/*.json`). Evidence grade is tagged per finding: **[RUN]** proven by executing code · **[DISK]** read directly by the orchestrator · **[AGENT]** read from disk by a sub-reader, not personally re-verified.

---

## 0. TL;DR — the five findings that actually matter

1. **The learning layer has never processed one real rep.** `dressing-room/state/reps_log.jsonl` does not exist. Every rep-derived agent (FSRS, Calibration, Nemesis, learning_state) emits `awaiting_data`. "Green" means *selftest-passes + empty-safe*, **not** *works on real data*. Thresholds in the four config files are self-described **v0 seed hypotheses**, uncalibratable at zero data. **[DISK/RUN]**

2. **The outwork layer has real data but measures the wrong thing — and even that signal is dropped before it reaches you.** The one live accountability number is **time-in-app** (Building 7.7% vs 60% target). Nothing measures *shipped output*. And a field-name/shape mismatch means `timeaudit.json` **never reaches the team sheet at all** (`manager.mjs` reads `T.building_pct`/`T.on_track`; the file emits `buckets.Building.pct`/`onTrack`). The loudest real accountability signal in the whole system is silently null. **[DISK]**

3. **The Manager quietly breaks its own bias-to-silence law.** Its header promises "a section is present ONLY when its agent is status ok." True for `cards` + `calibration` (status-gated) — but `headline`, `axis_pattern`, and the whole `formation` block (incl. `rejirah_due`) are gated on **file existence**, not status. Combined with *nemesis-headline-has-no-volume-gate* and *FSRS-has-no-floor*, a **single rep** can surface a weakness headline + an "overdue" line while volume-gated agents (calibration, axis-pattern) correctly stay silent. Harmless at 0 reps (everything's null); bites at 1–19 reps. **[DISK]**

4. **The closed loop is open.** "Did today's ONE THING get done?" has no on-disk answer. The post-match writer isn't built; `season.json` doesn't exist so `matches_played` is stuck at 0 → **Matchday 1 / Introduction forever**; `notebook.json` (the Season-Arc memory) is never written; HIT/MISS grading is an in-thread prose ritual. The loop that would make the whole football metaphor *advance* is narrative, not wired. **[DISK/AGENT]**

5. **The richest studying produces zero repo signal — by construction.** `THE-FORGE.html` (the 9-axis capsule + its own date-driven Re-Jirah scheduler) has **no wire into `reps_log`**. The signal comes from a *separate* Drill-Gem that **re-derives** questions on the same concepts/axes but never reads the capsule. So it isn't "rich capsule compressed" — it's *rich capsule never extracted; a parallel, coarser re-collection.* Two spaced-rep schedulers (FORGE Re-Jirah vs repo FSRS) run in air-gapped worlds; `learning_state` even borrows the "Re-Jirah" name for FSRS output. **[DISK/AGENT]**

> **The single highest-leverage move, both layers agree:** stop polishing a chain that has processed zero reps. Get **one real study rep** flowing end-to-end so "green" becomes "works", **fix the two silent drops** (timeaudit→sheet; the 6-of-N concept registry), then calibrate the seed thresholds against reality. Everything else on the ceiling lists is polishing hypotheses.

---

## 1. Evidence-grade ledger — verified-by-RUNNING vs canon-described

| Agent / artifact | How verified | Grade |
|---|---|---|
| `capture.mjs` reps_log line shape (13 fields) | field-validation exercised by selftest (`confused_with`/`edge`/canonicalize/dedup/unregistered) + orchestrator read source | **[RUN]+[DISK]** |
| `fsrs.mjs` schedule logic | selftest: interval growth/lapse/monotonicity, skill→0 cards, due/overdue, empty-safe | **[RUN]** |
| `calibration.mjs` ECE/danger/trend | selftest: ECE 0.2125 hand-check, danger-fire, gates, axis-sharpen, 3 trend states, config/registry-missing | **[RUN]** |
| `nemesis.mjs` relapse/axis-cluster/headline | selftest: qualification rules, recency, axis-cluster strength 3, healed-close, single-headline, receipts | **[RUN]** |
| `learning_state.mjs` fluency/maidan/rejirah-join | selftest: aided-gating, velocity, per-axis rollup, rejirah join, edge/confusion, warming_up suppression | **[RUN]** |
| `manager.mjs` M-1 wrapper (35 asserts) | selftest: gating, render hygiene, no-invented-number guard, staleness, local-date | **[RUN]** |
| Goalkeeper v2 verdict + medical boundary | `test_coach_v2.mjs` baked mock: convergence gate, doctor-referral fires, **zero med advice** | **[RUN]** |
| All 15 live `state/*.json` real shapes | orchestrator read every file directly | **[DISK]** |
| `reps_log.jsonl` **absent** | `ls`/glob → not found (confirmed 3×) | **[DISK/RUN]** |
| Manager gating bug (§3 above) | orchestrator read `manager.mjs:89-134, 236` | **[DISK]** |
| timeaudit→sheet field mismatch | orchestrator read `manager.mjs:113-116, 236` + `timeaudit.json` | **[DISK]** |
| FORGE capsule richness + Re-Jirah | orchestrator read `FORGE_SPEC.md` in full | **[DISK]** |
| Signal-script internals (line refs) | sub-readers read `fsrs/calibration/nemesis/learning_state.mjs` | **[AGENT]** |
| Outwork docs + `oura_coach.mjs` internals | sub-reader read all in full | **[AGENT]** |
| Old-rig contents + re-map | sub-reader read `setup-rig.mjs` + rig state | **[AGENT]** |
| Canon intent (Masterplan/Manager/Gaffer §-refs) | sub-reader read all in full | **[AGENT]** |

**Could NOT run** (honest gaps): `oura_coach.mjs` live (no selftest mode; live pull hits Oura + overwrites `readiness.json` — Goalkeeper proven via mock instead) · `timeaudit.mjs` live (would overwrite `timeaudit.json`; note it *appears* to have a selftest mode — worth a follow-up run) · `oura_auth.mjs` (OAuth flow). **State dir was byte-identical before/after all runs** (`state_dir_intact: true`, backup+re-checksum). **[RUN]**

---

## 2. Empirical facts — the REAL emitted schemas (not canon-described)

### 2.1 `reps_log.jsonl` — the shared study-event stream (the spine of the learning layer)
Single writer = `capture.mjs`. **Currently absent (0 reps).** Line shape (code-truth, `validateRep`), 13 fields:
```
{ ts, surface:"gem"|"colab", track:"concept"|"skill",
  concept(canonicalized via concepts.json), axis:"a".."i"|null (ONE per rep; skill MUST be null),
  question, confidence:"knew"|"shaky"|"guessed", correct:bool,
  latency_ms:int>=0|null, aided:bool|null(skill-only), unregistered:bool,
  confused_with:id|null, edge:free-text|null, note? }
```
**Field usage is heavily asymmetric** (this is the whole signal story):
- Used by ≥1 agent: `ts`, `concept`, `correct`, `confidence`, `track` (all four); `axis` (calibration danger-sharpen, nemesis cluster, learning_state rollup — **not** FSRS); `latency_ms`, `aided`, `confused_with`, `edge` (**learning_state only**).
- **Never read by any signal agent** (dead after `validateRep`): `question`, `note`, `surface`, `unregistered`. *(`question` is not fully dead — it is the dedup key `ts+question` at ingest; with Gem-fabricated `ts` this is a silent-drop vector, not signal.)* **[AGENT/DISK]**

### 2.2 Live state schemas (all real, from disk) **[DISK]**
| File | Real shape (keys) | Current value |
|---|---|---|
| `cards.json` (FSRS) | `date, engine, request_retention, total_cards, due_today, overdue, hardest_due[], status, generated_at` | `awaiting_data`, 0 |
| `fsrs_store.json` | `date, engine, request_retention, generated_at, cards:[]` | empty; `engine:"fsrs-6 (ts-fsrs 5.4.1)"` |
| `calibration.json` | `date, calibration_gap(ECE), trend, overconfidence_rate, buckets{knew,shaky,guessed:{n,accuracy}}, danger_zone[], total_reps, status, low_confidence, generated_at` | `awaiting_data`, gap null |
| `weaknesses.json` (Nemesis) | `date, status, low_confidence, headline, axis_pattern, weaknesses[], total_reps, generated_at` | `awaiting_data`, headline null |
| `learning_state.json` | `date, generated_at, total_reps, status, low_confidence, maidan_stage_focus, weak_connection, python_fluency{}, rejirah_due[], core_vs_light{}, concepts[], axes[], maidan{stages[],handoffs[]}` | `awaiting_data`; Maidan baked but empty (runnable_frac 0, handoffs all 🔴) |
| `timeaudit.json` | `date, mode, generatedAt, activeMinutes, buckets{Learning,Building,Meta:{minutes,pct,top}}, productiveMinutes, onTrack, flags[], dataOk, note` | **REAL**: L 88.8% / B 7.7% / M 3.5%, `onTrack:false`, pulse |
| `readiness.json` (Goalkeeper) | `ok, engine, day, mode, nights, verdict, ceiling, workType[], timing{}, signals{}, tiers{}, medication{}, periodization{}, safety{}, guardrail` | **REAL**: GREEN / HIGH, 29 nights, v2 |
| `manager_notes.json` | `last_run, matchday, phase, source, reason, staleness{}` | matchday 1, introduction, `source:"fallback"` |
| `concepts.json` | 9 axes (a–i) + 6 concepts + 5 skills; **every entry `core:true`** | registry canon |

**Two schema-honesty notes:** (a) `fsrs_store.json` label says `fsrs-6` but the installed `ts-fsrs` is 5.4.1 (cosmetic). (b) **`core:true` is constant across all 11 registry entries** — there is not one `light` entry — so `core_vs_light` partitions *nothing* (zero bits) yet is computed, consumed by the Manager as a fixed key, and branched on in Maidan handoff tie-breaks. Dead ontology dimension carried through three layers. **[DISK]**

### 2.3 The FORGE capsule (the rich study artifact — lives OUTSIDE the repo) **[DISK]**
Per concept, `FORGE_SPEC.md` locks a capsule with **9 axes** (`faultLines` a–i), each carrying `strike`/`weld`/`status`/`deep`; plus capsule-level `deep`/`threeWays`/`traps`/`bridges`/`doubts`/`edgeMap`/`confusionPairs`/`bolo`; **plus its own spaced-rep scheduler** ("Re-Jirah": `lockedOn + 3d/2wk/6wk`, with reserved per-axis `nextDue`/`lastResult`/`calibrationGap`/`fluencyState`). This is the study world (Colab / Drill-Gem / GitHub Gist / `THE-FORGE.html`). **None of this structure has a field in `reps_log`.**

---

## 3. Flow map — the LEARNING layer (start → end)

```
STUDY WORLD (outside repo)                    REPO SIGNAL WORLD                         COACH
─────────────────────────                     ────────────────                         ─────
THE-FORGE.html (9-axis capsule           ┌──►  capture.mjs ──► reps_log.jsonl ──┬─► fsrs.mjs ─────► cards.json ─────┐
 + Re-Jirah scheduler)   ── NO WIRE ──X  │     (paste + pull)   [ABSENT: 0 reps] ├─► calibration ─► calibration.json ┤
                                         │                                       ├─► nemesis ─────► weaknesses.json ─┼─► manager.mjs
Drill-Gem (Gemini bot; RE-DERIVES  ──────┘                                       └─► learning_state ► learning_state.json ┘  (M-1, no LLM)
 questions on same concepts/axes,                                                        ▲                              │
 never reads the capsule)                                             fsrs_store.json ───┘ (rejirah_due JOIN)           ▼
Colab (Python skill reps) ───────────────────────────────────────────────────────────────────────────────► team_sheet.md
```

**The wire that carries signal:** Drill-Gem paste + Colab `log_rep` → `capture.mjs` (`paste`/`pull`) → `reps_log.jsonl` → four consumers each recompute their own view → Manager reads their outputs, **gates on status**, surfaces derived signals only (which axis breaks, what's due, fluency colour) — never rich content.

**The wire that does NOT exist:** `THE-FORGE.html` → `reps_log`. The capsule's Re-Jirah writes back to capsule `<id>.json` files; it emits **zero** reps_log lines. So the signal is a **re-derivation** by a separate bot, not an **extraction** from the capsule. **[AGENT, grep-confirmed: 0 hits for `log_rep|reps_log` in FORGE files]**

**Rating / grading compression** (`fsrs.mjs`): `incorrect→Again` (confidence dropped on **every** miss — a confident-wrong and a guessed-wrong decay identically), `correct+guessed→Hard`, `+shaky→Good`, `+knew→Easy`. FSRS uses only `{concept, ts, correct+confidence}`; it is **blind to axis, latency, aided**. Card unit = concept; `track:"skill"` reps produce zero cards. **[RUN/AGENT]**

**Where the signal is thin by construction:** three agents each compute a *different* "dominant axis" — nemesis = miss-axes-only; calibration = knew-wrong plurality; learning_state = **all-reps volume plurality**. These answer three different questions (which axis you keep failing / are overconfident on / log most), so they should **not** be unified. But the one that decorates `rejirah_due`'s axis label is the *volume-plurality* one — the least diagnostic, and unstable at low volume (flips with nearly every new rep). **[AGENT]**

---

## 4. Flow map — the OUTWORK layer (start → end)

```
ActivityWatch daemon (:5600, external)  ──► timeaudit.mjs ──► timeaudit.json {B 7.7% vs 60, onTrack:false}
                                                                    │
Oura ring → cloud (1–2d lag)  ──► oura_coach.mjs ──► readiness.json {GREEN/HIGH/workType/timing}
                                                                    │
                                                     ┌──────────────┴───────────────┐
                                                     ▼                               ▼
                                              manager.mjs (M-1, no LLM) ──► team_sheet.md ──► [human executes]
                                                     ▲                               │
                              season.json [ABSENT]───┘        post_match/<yest>.md [ABSENT: read, never written]
                                                     │
                                          manager_notes.json (run log; NO commitment/HIT-MISS field)
```

**What is real and works end-to-end:** the **readiness → team-sheet** path (verdict/ceiling/workType/timing render correctly; missing readiness safely defaults to "grind honored / GREEN"). The Goalkeeper's own internal loop (trends, convergence-gated verdict, safety-referral, medical boundary) is genuinely closed and self-correcting. **[DISK/RUN]**

**What is measured:** **time-in-app only.** "Building %" = seconds in editors/terminals/github/localhost. **Nothing** reads commits, PRs, tests-passing, deploys, or demo-runs. The doctrine file's own rule — *"Presence ≠ output; 12 ghante baith ke zero seekha = won-day NAHI"* (`DAILY_CADENCE`) — is enforced only by manual honest-grading, never by code. **[AGENT]**

**Automation reality:** exactly **one** real scheduled task exists — `ArsenalFC-Goalkeeper` (daily 08:30), and it binds the **legacy** engine (v2 marked "DONE, pending live run"). The ntfy backstop is **disabled** (`ntfy.enabled:false`). Manager 08:45 + evening post-match tasks are planned (M-5), unbuilt. Manager brain (M-3 `claude -p`) is a stub (`llm = async () => null`) → **always** falls back. **[DISK/AGENT]**

---

## 5. Old rig → live arsenal — the reconciliation re-map

**Bottom line: there is NO runtime dependency of the live arsenal on the old rig.** `timeaudit.mjs` calls the ActivityWatch REST API directly (`localhost:5600`), **bypassing the rig's MCP entirely**. The shared substrate is the AW daemon itself — third-party infra that *neither* repo installs or owns. Retiring the rig cannot break the AW feed. The rig installs **no** daemon, scheduled task, or ntfy. Its on-disk state shows it was barely run (empty audit log, 2 seed entries). **[AGENT, disk-grounded]**

| Old-rig role | Live arsenal owner | Status |
|---|---|---|
| `auditor` (3-bucket via AW MCP) | **Time-Auditor** `timeaudit.mjs` | **Replaced + upgraded** (zero-token, direct REST) |
| auditor MEMORY (bucket map, web-dedup) | `buckets.json` + `pickBuckets()` | Migrated as config/logic |
| `examiner`/scrimmage (mock interview) | Interviewers #11–16 + Nemesis #17 | **Design-only** — not coded; rig is the only working version |
| `ledger-keeper` (repeat-mistake store) | `weaknesses.json` + `nemesis.mjs` | Partially replaced (schema-fied) |
| `scout` (job-market scan) | Job-Market Scanner #22 | **Design-only** — not coded |
| `curriculum` (surfacing arm) | capture→fsrs→calibration→learning_state chain | Superseded by richer schema (empty until reps) |
| `distribution` (build-log + git read) | Build-in-Public #24 | **Design-only** — not coded |
| DOSSIER / rejirah / python-fluency state | `learning-layer/OPPONENT_SCOUT.md`, `FORGE_SPEC`, `PYTHON_SYLLABUS` | **Copied into repo** |
| *(none)* | **Goalkeeper #3** (Oura) | **NET-NEW** — rig had no biometrics |
| *(none)* | **Manager #1** (central reconciler) | **NET-NEW** — rig had no central reasoner |

The rig's *only* residual value: working prompts for **4 roles arsenal designed but never coded** (examiner, scout, distribution, curriculum). That's reference value, not a dependency. Canon already holds the mapping (`MASTERPLAN §15/§386`). **The "reconciliation parked" note is correct and safe to keep parked** — see **OPEN FORK F-9**.

---

## 6. Implemented vs what-SHOULD-be (per component, precise)

### LEARNING layer
| Component | Built? | What SHOULD be (scope-matched) |
|---|---|---|
| `capture.mjs` | ✅ built, selftest-green; v2/v3 fields (axis/latency/aided/confused_with/edge) | **Correct + robust.** One gap: wire the dead `unregistered` flag to a one-line "N reps logged against non-canon concepts" surface (cheap, prevents silent phantom-topic fragmentation). |
| `fsrs.mjs` | ✅ built (ts-fsrs FSRS-6) | Correct engine. Decide its authority vs FORGE Re-Jirah (**F-1**); consider a reliability floor (**F-2**). |
| `calibration.mjs`/`nemesis.mjs`/`learning_state.mjs` | ✅ built, empty-safe | Sound. **Calibrate the v0 seed thresholds** (min_reps 20/12, latency 8000ms, held2/fluent3) against *real* reps — impossible today at 0 data. |
| One real rep end-to-end | ❌ never happened | **The gating milestone.** Everything else is downstream of this. |
| `concepts.json` coverage | ⚠️ 6 concepts registered | Register the rest of the syllabus (**agent-reported target is larger, ~17**) *before* you climb the ladder, or most future reps fragment into phantom topics. **Verified: registry has 6; core:true on all.** |
| FORGE→repo bridge | ⚠️ manual re-derivation | Document explicitly that `THE-FORGE.html` does **not** feed `reps_log` (closes the biggest silent-loss misconception). Wiring it is a schema/scheduler decision (**F-3**). |

### OUTWORK layer
| Component | Built? | What SHOULD be |
|---|---|---|
| `timeaudit.mjs` | ✅ built, real data | **Fix the seam to the Manager** (§7.1 — ~5 lines). Consider rolling-window + slide detection (the rig-spec it duplicates had 2-week rolling + 3-week slide; this is single-day, no history). |
| `oura_coach.mjs` (Goalkeeper) | ✅ built + real data + mock-proven | Live-run the v2 engine once (still "pending live run"). Fix the `personal_sleep_need ~4.45h` calibration below the locked 6–7h band (known-issue; medical logic untouched). |
| `manager.mjs` (M-1) | ✅ deterministic wrapper | Faithful, *more realistic than the §10 dummy* for 6 signals. **3 §4 gaps** (§7.3). M-2 soul + M-3 brain are the delivered product (in progress — not evaluated). |
| Output signal (shipped work) | ❌ none | Add a token-free git/CI reader (commits today, tests-pass) as a `build_output` feature so "Building%" (time) is corroborated by "did anything ship" (**F-4**). |
| Post-match / closed loop | ❌ read, never written | Build the loop-closer (records HIT/MISS, writes `season.json`/`matches_played`, sets KAL-line). Deterministic script vs LLM-authored (**F-5**). |
| Scheduling (M-5) + ntfy | ❌ planned / disabled | Wire the 08:45 + evening tasks; enable ntfy as the "did-you-show-up" backstop. |

### The intended weld (canon) that isn't wired yet
Canon frames one **learning↔execution control loop** — Feedback (eval scoreboard → next drill: "you can't fool the scoreboard"), Feedforward (Manager pre-empts), Flywheel (each ship spawns learning targets). The scoreboard is the **FinOps eval harness** — Phase 2/5, **not built**, and **the FinOps product itself is not in this repo.** So the throughline "what learning is FOR" is currently **narrative, not wired** (**F-8**). **[AGENT]**

---

## 7. Gaps & squeezes — located exactly (the defects)

**7.1 — [HIGH] Time-Auditor's signal never reaches the team sheet.** `manager.mjs:113-116` reads `T.building_pct / T.building_target / T.meta_pct / T.on_track` (flat snake_case). `timeaudit.json` emits `buckets.Building.pct` (nested) + `onTrack` (camelCase). Flat keys resolve to `null` → `F.time` all-null. Worse, the only render line — `manager.mjs:236 if (F.time && F.time.on_track) …` — fires *only when on_track is truthy*, so **an off-track day is structurally suppressed**, and `building_pct`/`meta_pct` are read but never rendered anywhere. The author *did* normalize readiness's real shape (`:108`) but left timeaudit on the dummy schema; the M-1 real-run masked it because timeaudit was `stale` that day. **No `timeaudit` fixture exists in the Manager selftest**, so the seam was never tested. **[DISK]**

**7.2 — [HIGH] The Manager violates its own bias-to-silence law.** `manager.mjs:89-90` status-gates only `cards` (`okCards`) and `calibration` (`okCal`). Lines `126-127` (`headline`, `axis_pattern`) and `128-134` (`formation` incl. `rejirah_due`) gate on **object existence** (`bus.weaknesses ?`, `bus.learning_state ?`) — the files always exist. Because **nemesis headline has no volume gate** and **FSRS has no reliability floor** (`status ok at store.length≥1`), a single rep yields a Manager sheet with a weakness headline + an FSRS-fed "overdue" line while calibration/axis-pattern (N≥20) correctly stay silent. The layer is not "silent together"; its two *least* statistically-grounded sub-signals speak first and loudest. Harmless at 0 reps; a real early-data asymmetry at 1–19. **[DISK]** *(Corrects the orchestrator's own earlier phrasing "Manager gates learning fields on status===ok" — disproved on disk.)*

**7.3 — [MED] Manager is narrower than its §4 contract (3 gaps).** **[AGENT]**
- `intake_log.json` is listed in §4 (context-only) but **not read** by `loadBus`.
- The §4 promise "any new agent just drops its JSON in, zero re-wiring" (`unknown *.json → {agent,ts,summary}` digest) is **not implemented** — `loadBus` reads a *fixed whitelist*; a new agent needs a code edit.
- `signal_confidence` tags (emphasized in §4/§10) are dropped; only `convergence`/`flags` propagate.

**7.4 — [MED] The closed loop is unwired (no output persistence).** No post-match writer; `season.json` absent → `matches_played` stuck at 0 → phase frozen at Introduction; `notebook.json` never written → Season-Arc "references real shared history" has no data source; `manager_notes.json` has no commitment/HIT-MISS field. Yesterday's floor cannot be checked today without re-reading the thread. **[DISK/AGENT]**

**7.5 — [MED] Concept registry undershoots the syllabus.** `concepts.json` registers **6** concepts; the syllabus/roadmap targets many more. On the first rep of an unregistered concept, `topicOf`'s raw-id fallback silently coins a phantom topic and no agent warns (the `unregistered` flag has zero consumers). This is *guaranteed* to trigger as you climb, not hypothetical. **[DISK: registry=6; AGENT: syllabus larger]**

**7.6 — [MED] The 9-axis fan-out is statistically under-powered at solo volumes.** One axis per rep spreads each concept across 9 axes → ~54 `(concept,axis)` cells for 6 core concepts. Per-axis signal needs ~9× the volume of per-concept signal; `axis_pattern` needs N≥20 **and** ≥3 concepts on one axis, per-axis fluency needs consecutive cold-fast streaks. At realistic solo study rates each cell sits at 1–2 reps for weeks → the *richest captured dimension (axis)* is the *least usable*, perpetually `warming_up`. Not a bug — a design limit to plan around. **[AGENT]**

**7.7 — [LOW] Emit-reliability failure points, all silent.** Drill-Gem instruction-drift can malform the JSON array → `capture.mjs` drops those reps (no coercion, no alert); Colab needs a manual `flush_reps()` at session-end (forget it → the whole session's reps never reach the inbox); Gem-fabricated `ts` drives FSRS ordering + the `ts+question` dedup key → rounded/reused timestamps collide and drop distinct reps. **[AGENT]**

**7.8 — [LOW] Two spaced-rep schedulers, one borrowed name.** FORGE Re-Jirah (date-driven, per-axis, in `THE-FORGE.html`) and repo FSRS (drill-history, per-concept). `learning_state.rejirah_due` borrows the "Re-Jirah" **name** but is fed by FSRS. *Not an active collision* (they're air-gapped; the Manager reads only FSRS, so no consumer receives contradictory dates; FORGE's per-axis controller is itself reserved/unbuilt) — a **naming/authority ambiguity + parallel unbuilt design**. Fix is a rename + one doc line, not a scheduler merge. **[AGENT — severity downgraded by adversarial pass]**

**7.9 — [LOW] Dead/vacuous ontology carried through layers.** `core:true` on all 11 registry entries (partitions nothing) yet computed as `core_vs_light`, consumed by the Manager, branched on in handoff tie-breaks. `confused_with`+`edge` (built + selftested) feed only `learning_state`'s `edge_map`/`confusion_pairs`, which the M-1 Manager never surfaces — and are re-collected coarsely at capture rather than extracted from FORGE's (reserved, empty) `confusionPairs`/`edgeMap`. Triple-speculative plumbing. **[DISK/AGENT]**

**7.10 — Over-build flags (the §18 gate should catch these).** Four config files commit **dozens of v0 seed thresholds before one rep exists** (uncalibratable → false precision); `learning_state` bakes a full empty Maidan against the OS's own "defer Maidan until drilling"; nemesis ships a full open→closed→pruned lifecycle state machine never run on real data; the Goalkeeper's `analyzeLegacy` (~120 dead-but-shipped lines) is kept for reference under "never replace, always layer." All are *correct-but-early* — the elevated-ceiling instinct building the instrument before the measurement. **[AGENT]**

---

## 8. Ceiling targets + a sequenced path

The honest ceiling for both layers is **not more machinery** — it's turning a proven-empty pipeline into a proven-working one, then calibrating on reality. Sequence (each step small, scope-matched, high-effect):

**Phase A — make it real (unblocks everything):**
1. **Fix 7.1** (timeaudit→Manager seam): normalize in `computeFeatures` (`T.buckets?.Building?.pct`, `T.onTrack`), render the Building-vs-target line unconditionally when fresh, add a `timeaudit` selftest fixture. *~5 lines; reconnects the loudest live signal.*
2. **Fix 7.5** (register the syllabus in `concepts.json` + wire `unregistered` to a one-line canon-drift surface). *Cheap; prevents guaranteed phantom fragmentation.*
3. **Log one real study rep end-to-end** so `reps_log.jsonl` exists and the chain emits `status:"ok"` at least once. "Green" → "works" (the OS's own bar).

**Phase B — close the loop + honest accountability:**
4. **Resolve 7.2** (make bias-to-silence consistent: existence-gate → status-gate for headline/axis_pattern/formation, or give nemesis-headline a volume gate). Decide via **F-2**.
5. **Build the loop-closer** (post-match writer → `season.json`/`matches_played`/KAL-line). Decide via **F-5**.
6. **Add a real output signal** (git/CI reader) so accountability stops being a presence proxy. Decide via **F-4**.

**Phase C — calibrate + document the two worlds:**
7. **Calibrate the v0 seed thresholds** against the first weeks of real reps (they're placeholders today).
8. **Document the FORGE↔repo relationship** (the two schedulers, the re-derivation bridge) so no reader believes rich capsule study is being captured. Decide wiring via **F-1/F-3**.
9. **Fix the Goalkeeper baseline** (`personal_sleep_need` → 6–7h band).

**Explicitly NOT recommended now** (over-build): unifying the three "dominant axis" definitions (they're distinct by design — unifying is a regression); building the Re-Jirah per-axis controller in parallel to FSRS; adding more capture fields without a named consumer; polishing the empty Maidan.

---

## 9. OPEN FORKS — captain decides (not picked here)

- **F-1 · Decay authority.** (A) Repo FSRS is the acknowledged decay brain; update the OS clause that says "curriculum surfaces, doesn't model." (B) Build the OS's Re-Jirah per-axis controller and demote FSRS to a mirror. — *A = honest to what ships, cheap, but discards FORGE's per-axis grading the OS prizes; B = preserves designed fidelity but duplicates a working engine and is deferred "first R1" work.*

- **F-2 · FSRS reliability floor + Manager gating.** (A) Keep FSRS gate-free (1 rep → live schedule) and existence-gated formation — a motivating due-date from day one. (B) Add a `warming_up` floor + status-gate headline/formation so the whole layer is silent-together. — *A = signal on day one but the two least-grounded sub-signals speak loudest early; B = coherent silence but delays any scheduling signal. (Critics split: "motivating & directionally-correct" vs "premature & misleading.")*

- **F-3 · FORGE-capsule → reps_log wiring.** (A) Leave disconnected by design; repo signal stays Drill-Gem/Colab re-derivation. (B) Wire `THE-FORGE.html` to emit a rep per axis-recall (capture the actual rich studying). — *A = clean air-gap but the richest studying produces zero repo signal; B = captures it but needs an emit hook in a baked-only HTML app + schema/scheduler reconciliation (per-axis grade has no field today).* **Note: (B) touches the study surface — coordinate with the pedagogy owner; it is a wiring decision, not a method change.**

- **F-4 · Output measurement.** (A) Instrument real output (git/CI/demo-runs). (B) Keep time-in-app + human HIT/MISS. — *A = objective, un-gameable, closes "presence≠output" in code, costs a reader + FinOps-repo coupling; B = zero new code, keeps the ADHD-friendly honest-mirror ritual but a low-output day passes.*

- **F-5 · Loop-closer authoring.** (A) Deterministic `postmatch.mjs` now (token-free, testable). (B) Wait for the M-3 LLM Manager to author post-match as judgment. — *A = the loop closes now but state-mutation lives in a second script; B = matches the two-brain design + single authoring surface but the loop stays open until the whole LLM Manager ships.*

- **F-6 · timeaudit contract ownership.** (A) Auditor emits flat `building_pct/on_track` to match the Manager. (B) Manager normalizes the existing nested/camelCase shape (as it already does for readiness). — *B is lower blast-radius and consistent with how readiness is handled; A keeps the consumer simple but changes a public JSON.*

- **F-7 · Maidan/fluency scaffolding.** (A) Keep the baked-but-empty Maidan as a ready target. (B) Strip it until a real rep populates it (honor the OS "build when drilling"). — *A gives the Manager a shape to surface once data lands; B avoids empty structure reading as built progress.*

- **F-8 · What this repo IS.** (A) Treat it as *only* the accountability rig; the FinOps product ships in a separate repo (mark this in OPS_STATE so no reader mistakes the rig for the product). (B) Fold a FinOps build-progress signal in here to wire the "what learning is for" throughline. — *A keeps state clean + matches reality but leaves the throughline narrative; B wires it but couples rig to product.*

- **F-9 · Old-rig reconciliation.** (A) Retire now — safe for all live agents (no dependency) but loses the only working examiner/scout/distribution. (B) **Keep as read-only reference** (recommended: near-zero cost, preserves 4 unbuilt roles' battle-tested prompts) → port them → then retire. (C) Merge now (highest one-time effort). — *No dependency gates retirement; the only gate is that arsenal hasn't re-coded those 4 roles.*

---

## 10. Appendix — canon contradictions & open decisions found

- **Canon self-contradiction (unreconciled):** `MASTERPLAN §14` lists `weaknesses.json` writer as **"Manager only"**, but `THE_MANAGER §5` (Fork A3) says **Nemesis** writes it and the Manager only consumes. The **built code follows Fork A3** (Nemesis writes, Manager reads `headline`/`axis_pattern` verbatim). Two canon files disagree on the single writer — worth reconciling the Masterplan line. **[AGENT]**
- **"Matchday N" ambiguity:** code = `matches_played + 1` (dummy 12 → Matchday 13); `THE_MANAGER §11 Example B` labels the same state "Matchday 14" (= `season_day`). Canon never disambiguates. **[AGENT]**
- **Promised-but-not-computed:** `weekly-consistency%` and `day-N-of-M` are promised (`§9`, OPS_STATE) but `computeFeatures` computes neither. **[AGENT]**
- **Deferred by canon (legitimately open):** `learning_state` schema-fy "at first R1"; meds-PII decision in M-2 §8; Goalkeeper `personal_sleep_need` calibration (do-not-tune-mid-sprint); AutoPush parked to the FinOps repo. **[AGENT/DISK]**

---
*End of draft. Every load-bearing defect (7.1, 7.2, 7.5, 2.2 core-flag, FORGE-bridge) was re-verified against disk after the adversarial pass. Forks are yours to call.*


═══════════════════════════════════════════════════════════════════════════════
# PART 2 · PASS-2 — THE REPAIR-BLUEPRINT (what SHOULD BE to fix/wire what exists)
*Below is `learning-layer/SYSTEM_BLUEPRINT.md`, reproduced verbatim. Nothing altered.*
═══════════════════════════════════════════════════════════════════════════════

# SYSTEM_BLUEPRINT — Arsenal AI FC · the ceiling END-STATE of both layers + the path there
**[DRAFT — captain review]**

> **What this is.** Pass-2 of the system metacognition. Pass-1 (`SYSTEM_METACOGNITION.md`) was the **diagnosis — what IS**. This is the **blueprint — what SHOULD BE**: the absolute-ceiling end-state of both layers and the single ordering to get there. It **builds on** Pass-1's facts (defects 7.1–7.10, forks F-1–F-9) and does **not** re-litigate them. Nothing here is committed canon — it proposes; you decide. Every genuine choice stays an **OPEN FORK**.
>
> **Ceiling, honestly.** "Ceiling" = **maximum depth-of-effect per load-bearing word / per built component**, scope-matched (OPS_STATE 🔒 elevated-ceiling; CONDUCTOR §1). The *analysis* below goes to that ceiling. The *outcome frame* never sells "10x / exponential / on steroids" — the honest frame is **compounding, self-correcting, directed-efficiency**: the multiplier is your consistency, the ceiling is biology (reps × time × sleep). A god-tier version doesn't make you learn faster than biology; it **wastes fewer of your reps and loses none of your signal**.
>
> **Guardrails honored.** (1) **Pedagogy untouched.** HOW you study — FORGE method, 9-axis Jirah, cold-reader doubt-capture, Bolo — is Nidhi's protected domain (`FORGE_SPEC.md`, `PROJECT_OS.md` THE METHOD). This blueprint designs the SYSTEM *around* learning (capture / signal / scheduling / accountability / the weld) and never the study method. Where a move touches the study surface (F-3), it's flagged as a **wiring** decision to coordinate with the pedagogy owner, not a method change. (2) **Never fabricate** — every claim is cited `file:line` or tagged `[ASSUMPTION]`. (3) **M-2 in flight is not touched.** `dressing-room/manager/system.md` (the Gaffer soul, #6–#11 pending) is another thread's build; this file references it read-only and edits no canon.
>
> **How it was produced.** The orchestrator read the load-bearing sources from disk directly (`SYSTEM_METACOGNITION.md`, `About.md`, `AI_PE_ROADMAP.md`, `OPS_STATE.md`, `CONDUCTOR.md`, `CONDUCTOR_LOG.md`, `THE_MANAGER__Master_Prompt.md`, `FORGE_SPEC.md`, `OPPONENT_SCOUT.md`, `DAILY_CADENCE.md`, `PROJECT_OS.md`, `scripts/manager.mjs`) + 7 parallel disk-grounded readers over the remaining subsystems. Evidence grade: **[DISK]** read by the orchestrator · **[AGENT]** read by a sub-reader · **[ASSUMPTION]** not evidenced.

---

## 0. TL;DR — the ceiling in five moves

1. **The ceiling is not more machinery — it is a proven-empty pipeline turned proven-working, then never losing a rep of signal again.** Pass-1's verdict holds: the highest-leverage move is not a new agent, it is *one real rep flowing end-to-end* + *stop the two silent drops* + *calibrate on reality*. A god-tier version adds exactly three things on top: it **captures the richest studying instead of re-deriving a coarse shadow of it** (F-3), it **measures what shipped instead of time-in-app** (F-4), and it **closes the loop so the season actually advances** (F-5/7.4). Everything else is polish.

2. **LEARNING-layer ceiling = extraction, not re-derivation.** Today the richest artifact in the whole system — the FORGE 9-axis capsule with its reserved per-axis `lastResult`/`calibrationGap`/`fluencyState` and capsule-level `edgeMap`/`confusionPairs`/`buildHook` — produces **zero** agent-readable signal by construction (`FORGE_SPEC.md:176`). The repo signal is a *parallel, coarser re-collection* by the Drill-Gem. The ceiling wires the capsule's own graded fields into `reps_log` so the deepest study *is* the signal.

3. **OUTWORK-layer ceiling = the rig stops measuring the one thing its own doctrine forbids.** The live headline number is Building **time-in-app** (7.7% vs 60%) — which `DAILY_CADENCE.md:57`/`PROJECT_OS.md:598` call *"won-day NAHI."* The ceiling reads **shipped output** (git/CI/eval-pass) as the Building signal, closes the loop (post-match → `season.json` → phase advances → `notebook.json` gives the Gaffer real memory), and computes **weekly-consistency%**, the metric the OS declares canonical (`PROJECT_OS.md:583`) but no code computes.

4. **The WELD is fully designed and entirely unwired.** `THE_MANAGER §7` names one learning↔execution control loop — Feedback ("*you cannot fool the scoreboard*", :221), Feedforward (:222), Flywheel (:223). But the scoreboard (the FinOps eval harness) is unbuilt, the FinOps product is not in this repo (F-8), the Manager reads only today's snapshot so Feedforward is *structurally impossible*, and `buildHook` (the Flywheel's one real hook) is display text. The ceiling wires all three halves — and the cheapest, highest-value wire is a **thin cross-repo scoreboard contract**, not folding the product in.

5. **The single highest-leverage ordering:** fix the two silent drops (7.1 seam + 7.5 registry) → **one real rep** → close the loop (post-match writer) → add the output signal (git reader) → calibrate the seed thresholds → wire the scoreboard-feedback half → wire the FORGE bridge (with the pedagogy owner) → add feedforward. Each step unblocks the next; none of it is a new organism.

---

## 1. Orient — the two layers, named precisely, and the weld

The repo's own architecture (`PROJECT_OS.md:396–491`) already names two **peer** execution layers; the mission's "two layers" map onto them exactly:

- **LEARNING layer** = the **decay + drill engine** — *what to learn, how cold it should be, how it's tested.* Flow: study world → `capture.mjs` → `reps_log.jsonl` → four signal agents (`fsrs`/`calibration`/`nemesis`/`learning_state`) → Manager coaching. Owns: FSRS decay, calibration ECE, nemesis axis-cluster, the Maidan/fluency map, Re-Jirah. `[DISK: PROJECT_OS.md:397–453]`
- **OUTWORK layer** = the **consistency + accountability engine** — *did you show up, where did time go, is it sliding/burning, did it ship + get documented.* Flow: ActivityWatch → `timeaudit`; Oura → Goalkeeper → `readiness`; git/eval → *(unbuilt)* → Manager → team-sheet → human executes → post-match closes the loop. `[DISK: PROJECT_OS.md:476–617]`
- **THE WELD** = the one **learning↔execution control loop** that makes them a single self-correcting organism, welded at **three seams** (`PROJECT_OS.md:483–491`): (1) KICKOFF pulls from both, (2) **BOLO → GRADER** graded against the DOSSIER to *"bar-cleared,"* not *"held"* (`PROJECT_OS.md:554–556`; `EXECUTION_FINAL_Tier2_Metamorphosis.md:161`), (3) EVENING AUDIT both read. The canon's own line: *"Neither alone: audit akela ghante GINTA (khokhla — presence ≠ output) · learning akela consistency-scaffold ke bina (spiral). Loop dono ko baandhta."* `[DISK: PROJECT_OS.md:490–491]`

**The one bar every design choice below is judged against:** *does this make THIS human waste fewer reps and lose less signal on the path to a shipped, defensible FinOps product toward the 20–25 LPA AI Product Engineer role?* (`About.md`, `AI_PE_ROADMAP.md`). Not "is it clever."

---

## 2. LEARNING LAYER

### 2.1 — END-STATE at the ceiling (capability by capability)

A god-tier learning layer does eight things today's doesn't. Each names the mechanism, the consumer, and why it compounds toward the role.

**L-E1 · One rep is proven to flow end-to-end (the gate under everything).** `reps_log.jsonl` exists; all four agents emit `status:"ok"` at least once; the Manager's SQUAD REPORTS block renders a real reconciled line instead of the empty-pipeline `"just you and me"` fallback (`team_sheet.md:14`). *"Green"→"works,"* the OS's own bar (`PROJECT_OS.md:326`). — **Consumer:** every downstream agent; the whole layer is a hypothesis until this fires. `[DISK: Pass-1 §0.1; live-state reader — learning_state.json total_reps 0; reps_log.jsonl ABSENT]`

**L-E2 · Capture is EXTRACTION, not re-derivation (the single biggest silent loss closed).** The FORGE 9-axis capsule Re-Jirah emits a rep per axis-recall carrying the capsule's **own** graded fields — `lastResult` (held-clean/held-struggle/cracked), `calibrationGap` (predicted-vs-actual), per-axis `axisType` — so the repo signal *is* the deepest studying, not a coarser parallel re-collection by the Drill-Gem. — **Consumer:** `calibration.mjs` axis-sharpen, `nemesis.mjs` axis-cluster, `learning_state.mjs` per-axis rollup — all three today *re-derive* axis from coarse Gem reps. **Why it compounds:** the axes a–i literally mirror the interview probe-types (§4 below); wiring them makes every deep-study session score directly against interview-defensible depth. `[DISK: FORGE_SPEC.md:70–75, 176 "Locked capsules abhi tak in fields ke bina hain — R1 mein populate"; AGENT: capture-pipeline reader]`

**L-E3 · The full 17-concept syllabus is registered with a real core/light partition.** `concepts.json` holds all 17 foundations/course/FinOps concepts (`PROJECT_OS.md:225–237`) + the Python skills, with a **discriminating** `core`/`light` flag — so reps stop fragmenting into phantom topics and `core_vs_light` carries real bits. — **Consumer:** `capture.mjs` `unregistered` flag (`capture.mjs:104`), `learning_state.mjs` Maidan stages (`:53–57`), the Manager's drill-prioritization. **Why:** the registry *is* the curriculum; 6-of-17 (`concepts.json:16–21`) structurally cannot score 11 concepts the captain will study. `[DISK/AGENT — closes 7.5 + 7.9]`

**L-E4 · The `unregistered` and silent-drop paths are non-silent.** A rep against a non-canon concept surfaces as a one-line "N reps logged off-registry → register or rename" prompt; a malformed Gem paste, a forgotten Colab `flush_reps()`, or a `ts+question` dedup collision produces a **receipt**, not a vanished line. — **Consumer:** the Manager's morning sheet (a dropped rep becomes a headline) + the captain's phone (ntfy). **Why:** this is a self-auditing ingestion pipeline for his own reps — the *exact* shape of the FinOps M2 bank-reconciliation module and the LLMOps "reconciliation → golden dataset" differentiator (`AI_PE_ROADMAP.md:75`). `[DISK: capture.mjs:104; AGENT: capture.mjs:356–357/363–365 counts printed to stdout only, pull exits 0 regardless — extends 7.7]`

**L-E5 · The signal is decision-grade at solo volumes.** The 9-axis fan-out (~54 `(concept,axis)` cells across 6 core concepts) is *planned around*, not fought: **concept-level** signal leads (calibration, FSRS, nemesis-recurrence), and **axis-level** is treated as a slowly-emerging cross-concept meta-pattern (nemesis's "your nemesis is a KIND of thinking, not a topic"). The Manager never decorates a due-line with the *volume-plurality* axis — the least diagnostic, unstable-at-low-volume label Pass-1 flagged. — **Consumer:** the Manager formation-read (which weak *connection*, not which noisy axis). `[AGENT/DISK — plans around 7.6; Pass-1 §3 "the volume-plurality one — the least diagnostic"]`

**L-E6 · The FORGE interview-DEFENSE bank is surfaced.** The capsule already stores `doubts` (the cold-reader interview bank), `interviewLines`, `edgeMap` ("yeh defend kar sakta, yeh nahi — edge pe bluff NAHI = senior signal"), `confusionPairs` (X-vs-Y from the real error-log), and `buildHook` (the exact FinOps spot + a defend-able decision). At the ceiling these reach a consumer instead of dying in the capsule. — **Consumer:** the Manager's `🗣️ BOLO` line + the (unbuilt) SCRIMMAGE examiner. **Why:** *"Definitions are free now. The judgment is the part you're paying for"* (`OPPONENT_SCOUT.md:15`) — DEFEND + NEGATIVE-SPACE probes are the role's #1 senior signal, and this bank is pre-built ammunition for them. `[DISK: FORGE_SPEC.md:80–95; OPPONENT_SCOUT.md:94–121, 143–157]`

**L-E7 · Decay has one authority.** One decay brain owns "which concept/axis is due" (F-1) instead of two air-gapped schedulers sharing a borrowed name (FORGE date-driven Re-Jirah vs `learning_state.rejirah_due` which is FSRS output wearing the "Re-Jirah" label). — **Consumer:** `learning_state.mjs:240–248` → Manager `due_high_leverage`. **Why:** un-owned control loops silently disagreeing is precisely the system-design defect the role screens for. `[DISK: learning_state.mjs:20 "decay stays FSRS-owned; we only join axis"; 7.8 / F-1]`

**L-E8 · The Manager coaches the learning FORMATION honestly.** Bias-to-silence is *uniform* (7.2 resolved); the daily ONE-THING can be a **weak connection in the load-bearing core** ("tokenization→embeddings, not the concept"), chosen with shipping-equal rigor; intensity is dialed by readiness (GREEN = hardest connection at match-intensity; AMBER = consolidate one *held* connection); `held≠fluent` is enforced **only on the core** (selective fluency), never drilling all 17 to GHANA (misallocation). — **Consumer:** `team_sheet.md` ⚽ ONE THING. `[DISK: THE_MANAGER §6.5:206–209; PROJECT_OS.md:445–448 selective fluency]`

**Ideal flow — learning layer at the ceiling:**
```
FORGE 9-axis capsule Re-Jirah ──(per-axis grade: lastResult/calibrationGap)──┐
Drill-Gem (concept reps, volume) ────────────────────────────────────────────┤
Colab log_rep (Python skill reps) ──(auto-flush)─────────────────────────────┼─► reps_log.jsonl
                                                                              │    (+ receipt: appended|dup|rejected)
   ┌──────────────────────────────────────────────────────────────────────────┘
   ▼
 fsrs (decay) · calibration (ECE + danger) · nemesis (cross-concept axis) · learning_state (Maidan/fluency)
   │                                   │
   ▼                                   ▼
 Manager formation-read ───► team_sheet: ONE weak connection (core) · BOLO from the capsule's DEFEND bank
                                    │
                                    ▼  human drills the ONE thing → outcome graded → back to reps_log
```

### 2.2 — DELTA current → ceiling (component by component)

| Component | Current (cited) | Ceiling | Gap | Pass-1 |
|---|---|---|---|---|
| One real rep end-to-end | **Never happened.** All four agents read `reps_log.jsonl`; it is absent → all `awaiting_data` (`nemesis:53`,`fsrs:58`,`calibration:50`,`learning_state:44`) | first rep flows; chain emits `ok` once | **the gate** | §0.1 |
| `concepts.json` registry | 6 concepts + 5 skills; **`core:true` on all 11** (dead partition) | 17 concepts + real core/light | partial/wrong | 7.5, 7.9 |
| `unregistered` flag | wired to nothing (`capture.mjs:104`) | one-line canon-drift surface + retro-register | missing | 7.5 |
| FORGE→`reps_log` bridge | **no wire**; capsule's graded fields are commented schema, populated "at first R1" (`FORGE_SPEC.md:176`) | per-axis emit → reps_log | missing | F-3 / 7.8 |
| `fsrs.mjs` reliability | correct engine; **no floor** — `status:"ok"` at `store.length>0` (`fsrs.mjs:170`); blind to axis/latency/aided; skill reps → 0 cards | volume floor consistent with the other three | partial | F-2 / §3 |
| seed thresholds (4 configs) | v0 hypotheses uncalibratable at 0 data; **and inconsistent**: `warming_up_min_reps` 12 (learning_state) vs 20 (nemesis) vs `min_reps` 20 (calibration) | calibrated from first weeks; **one coherent gate** | partial | 7.10 + **new (gate-incoherence)** |
| decay authority | two schedulers, one name (`learning_state.rejirah_due` = FSRS output) | one authority (F-1) | wrong | 7.8 / F-1 |
| 9-axis fan-out | volume-plurality axis decorates `rejirah_due` — least diagnostic, unstable | concept-level leads; axis = slow meta-pattern | wrong-emphasis | 7.6 |
| DEFEND/interview bank | `edgeMap`/`confusionPairs`/`doubts`/`buildHook` reach no agent | surfaced to BOLO + SCRIMMAGE | missing | 7.9 (extends) |
| Maidan scaffolding | baked-but-empty; `core_vs_light` branched-on but zero-bit | build when drilling (F-7) | over-built | 7.10 / F-7 |

---

## 3. OUTWORK LAYER

### 3.1 — END-STATE at the ceiling (capability by capability)

**O-E1 · The loudest live signal reaches the sheet.** The `timeaudit → Manager` seam is fixed (7.1/F-6): the Manager reads the shape `timeaudit.mjs` actually emits (nested `buckets.Building.pct` + camelCase `onTrack`), renders the Building-vs-target line **unconditionally when fresh** (not only when `on_track` is truthy → an off-track day currently vanishes), and no `null` leaks into the Opus prompt. Plus a **rolling window + slide-flag** (≥60% Building rolling-2wk, flag if 3 consecutive weeks drop) instead of a single-day read. — **Consumer:** `manager.mjs computeFeatures → team_sheet.md`. `[DISK: manager.mjs:113–116, 176, 236; AGENT: timeaudit.mjs:196–206 nested/camelCase; Tier-2 guide slide-rule]`

**O-E2 · Output is measured, not presence.** A token-free git/CI reader emits a `build_output` signal (commits merged today, tests green, demo responds, eval-pass%) so "Building%" (time) is *corroborated by* "did anything ship." The rig stops measuring the one thing its own doctrine forbids — the DAILY_CADENCE law *"12 ghante baith ke zero seekha = won-day NAHI"* becomes enforced in **code**, not honor. — **Consumer:** the AUDITOR / Manager HIT-MISS; the human's public GitHub presence. **Why:** the DOSSIER's single biggest research-confirmed lever is *"notebook→live API = the single biggest differentiator"* and *"invisible-in-private-repos = sabse bada, sabse-kam-effort fix: repos public + build-log."* `[DISK: DAILY_CADENCE.md:57; OPPONENT_SCOUT.md:204, 207; AGENT: Tier-2 guide:286 distribution reads git-diff — F-4]`

**O-E3 · The loop is CLOSED and the season advances.** A post-match writer records HIT/MISS + welds the KAL-line → increments `matches_played` in `season.json` (so the Season Arc unfreezes from Introduction) → appends `notebook.json` (the ~30–40 day compressed memory that gives the Gaffer *real* moments to reference, not scripted nostalgia). This *is* the designed-but-PARKED LOGBOOK/SEASON.md (`DAILY_CADENCE.md:82–92`), finally built. — **Consumer:** `manager.mjs` `phaseFor()` + the Gaffer voice block. **Why:** an earned, deepening coach relationship is the ADHD adherence mechanism, and adherence over 30–45 days is the only thing that actually prints the reps and the ship. `[DISK: manager.mjs:20–21 "increments at post-match", :74–79; DAILY_CADENCE.md:82–92; PROJECT_OS.md:217 "SEASON.md abhi PARKED" — 7.4 / F-5]`

**O-E4 · Feedforward is possible.** The Manager holds trend/history — multi-day readiness slope (from the Goalkeeper's own `week_mean_readiness`), weekly-consistency%, focus-slide — so it can *pre-empt*: *"next week's concept is hard and readiness is trending down → lighten the shipping load now."* Today `computeFeatures` reads **only today's snapshot** — feedforward is structurally impossible. — **Consumer:** the intensity-dial + the KAL-line. **Why:** burnout is his #1 documented failure mode; anticipatory lightening is the circuit-breaker that lets 45 days of intensity run without the chain snapping on day 12. `[DISK: manager.mjs computeFeatures — no history; THE_MANAGER:222 Feedforward — new]`

**O-E5 · Weekly-consistency% exists as a signal.** The metric the OS declares canonical — *"WEEKLY CONSISTENCY, NEVER FRAGILE STREAKS"* (`PROJECT_OS.md:205–207, 583`) — is computed (won-days/7) and surfaced by the Manager, replacing any streak. A miss doesn't shatter it (shame-spiral guard). Promised in `THE_MANAGER §9` and OPS_STATE; `computeFeatures` computes neither it nor day-N-of-M today. — **Consumer:** team-sheet + Governor slide-detection. `[DISK: PROJECT_OS.md:583; Pass-1 §10 "promised-but-not-computed"]`

**O-E6 · The examiner and the scout exist.** THE SCRIMMAGE grades Bolo/answers against the DOSSIER **probe-bank + §1 time-weights** (not a generic 0-5 rubric), forcing *"bar-cleared."* THE SCOUT runs a weekly job-market form-watch that feeds the DOSSIER (§9 closed-loop) so the test-set tracks reality instead of a 29-Jun-2026 snapshot. Both are **design-only** today (`PROJECT_OS.md:538, 546`); both have battle-tested prompts in the old rig (`examiner.md`, `scout.md` — F-9). — **Consumer:** the human under interview fire; the DOSSIER. `[DISK: OPPONENT_SCOUT.md:3, 219; PROJECT_OS.md:538–547]`

**O-E7 · The belt is armed and the brain is live.** The ntfy "did-you-show-up" backstop is enabled (disabled today, `ntfy.enabled:false`); the 08:45 Manager + evening post-match tasks are scheduled (M-5); M-3 swaps the LLM stub (`manager.mjs:255 llm=async()=>null`, always falls back) for `claude -p` so the sheet's *quality* (not just appearance) carries judgment, under the hard $100 billing guards. — **Consumer:** the human's phone + morning sheet. `[DISK: manager.mjs:255; Pass-1 §4; OPS_STATE cadence]`

**O-E8 · The Goalkeeper baseline is honest.** `personal_sleep_need` anchors to the locked 6–7h band, not the data-driven ~4.45h that judges "on track" against too-low a bar. Medical logic untouched (data-interpretation only; akathisia → doctor). — **Consumer:** `readiness.json` verdict. `[DISK: OPS_STATE known-issue]`

**Ideal flow — outwork layer at the ceiling:**
```
ActivityWatch ─► timeaudit (rolling + slide) ──┐
git/CI ────────► build_output (shipped, eval%) ─┤
Oura ──────────► Goalkeeper ─► readiness ───────┼─► Manager (feedforward: trend+history+weekly-consistency%)
season.json / notebook.json (history) ──────────┘        │
                                                          ▼  team_sheet: ONE thing + never-zero floor
                                              human executes + ships
                                                          │
                     post-match writer ◄── HIT/MISS + build_output + Bolo-grade
                     → season.json++ (phase advances) · notebook.json · KAL-line → tomorrow's floor
                     ntfy belt: "did you show up?" (deterministic, AI-independent)
```

### 3.2 — DELTA current → ceiling (component by component)

| Component | Current (cited) | Ceiling | Gap | Pass-1 |
|---|---|---|---|---|
| `timeaudit → team-sheet` seam | flat keys read (`manager.mjs:113–116`) vs nested/camelCase emitted; `:236` renders only if `on_track` truthy; `:176` leaks `Building null%` into the Opus prompt; **no timeaudit fixture in selftest** (`:282–299`) | shape matches; line renders when fresh; no null | wrong | **7.1** |
| output measurement | **none** — nothing reads commits/PRs/tests/deploys; Building = time-in-app | git/CI `build_output` corroborates time | missing | **F-4** |
| closed loop / post-match | read never written; `season.json`/`notebook.json`/`post_match/` **absent**; `matches_played` frozen 0 → **Introduction forever** | deterministic loop-closer writes state + KAL | missing | **7.4 / F-5** |
| weekly-consistency% | promised (`§9`, OS) — `computeFeatures` computes neither it nor day-N-of-M | computed + surfaced | missing | §10 |
| feedforward / trend | single-day snapshot; no history | trend model → pre-empt | missing | new |
| write hygiene (`timeaudit.mjs` + `oura_coach.mjs`) | **both skip the atomic temp→rename** the six signal agents use — `timeaudit.mjs:276/293` (schema-outlier camelCase/nested) + `oura_coach.mjs:607/691` (**biometric `readiness.json`**) | atomic + house-style, both | wrong | new / F-6 |
| SCRIMMAGE / SCOUT / LEDGER / DISTRIBUTION | **design-only** (4 of 6 rig agents unbuilt; `PROJECT_OS.md:535–553`) | ported from old-rig prompts (F-9) | missing | §5 |
| scheduling M-5 + ntfy | planned / `ntfy.enabled:false` | 08:45 + evening wired; belt armed | missing | §4 |
| Manager brain (M-3) | stub `llm=async()=>null` → always fallback (`:255`) | `claude -p` under $100 guard | in progress | — |
| Goalkeeper baseline | `personal_sleep_need ~4.45h` < locked 6–7h | anchored to band | wrong | OPS known-issue |

> **Sharpest single line of the outwork layer (verbatim-grounded self-contradiction):** the rig's **headline number is Building time-share** — which its own doctrine (`PROJECT_OS.md:598–600`) condemns as *presence, not output.* The layer measures the thing it forbids as the standard. Fixing that (O-E2) is the outwork ceiling in one move. `[AGENT: outwork-doctrine reader; DISK: DAILY_CADENCE.md:57]`

---

## 4. THE WELD — learning ↔ execution as one control loop

### 4.1 — END-STATE at the ceiling

`THE_MANAGER §7` and `§6.5` design one closed loop where *"roughly half your tasks ARE the learning layer … it is half the content of what the execution layer executes on"* (`:198`). At the ceiling all three halves are wired:

**W-E1 · Feedback (near half, closes daily).** Two scoreboards route failures back to `reps_log` as tomorrow's KAL-line drill-target — *"you cannot fool the scoreboard"* (`:221`):
- **Shipping-side scoreboard** = the FinOps **eval harness** (RAGAS/golden-dataset/`api_logs`): a failed faithfulness/relevancy metric, or a cost-per-correct regression, becomes the next thing to drill. `[DISK: FINOPS_AI_CONCEPTS.md:66–68; THE_MANAGER:221]`
- **Learning-side scoreboard** = THE SCRIMMAGE grading Bolo to *"bar-cleared"* against the DOSSIER — a probe-type he can't defend becomes a `weaknesses.json` entry for the Nemesis re-attacker. `[DISK: PROJECT_OS.md:554–556]`

**W-E2 · Feedforward (far half, anticipatory).** The Manager holds a model of the whole system (readiness trend × upcoming-concept-difficulty × slide) and lightens *before* the collision. — **Consumer:** the intensity-dial. `[DISK: THE_MANAGER:222]`

**W-E3 · Flywheel (attack ↔ defense).** Each shipped FinOps feature (M1→M2→M3) auto-spawns **DEFEND-capsules** (`PROJECT_OS.md:455–463`; every build-decision = a DEFEND-axis) pre-loaded with the real WHY + metric at ship-time, via the capsule's existing `buildHook` field ("FinOps mein exact spot + defend-able decision", `FORGE_SPEC.md:86`); each learned concept sharpens the next feature. — **Consumer:** the Re-Jirah controller + the eval harness. **Why:** project-defense (round 5b) is *"YOUR weapon,"* and *"90% of candidates fail the 'what did it do for the BUSINESS' probe — tere paas real answer hai"* (`OPPONENT_SCOUT.md:143, 157`); capturing the metric at ship-time keeps the ₹81.5-lakh answer cold. `[DISK]`

**The axis ↔ probe-type spine (the weld's diagnostic backbone).** The FORGE `axisType` (recall/reconstruct/defend, `FORGE_SPEC.md:71`) maps 1:1 onto the DOSSIER probe-types (RECALL/RECONSTRUCT/DEFEND/NOVEL/NEGATIVE-SPACE, `OPPONENT_SCOUT.md:73–121`), and the DOSSIER's round-mode (R-early/mid/late = mini-mock, `:218`) maps onto Re-Jirah rounds. So a nemesis "cross-concept axis you keep failing" *is* a probe-type weakness, and the SCRIMMAGE can drill exactly the probe-type the interview grades — anti-overfit by construction (the DOSSIER's stated purpose, `:5`). `[DISK]`

**Ideal weld flow:**
```
        LEARNING                         WELD (the control loop)                      OUTWORK
  capsule axis-grade ─► reps_log ─► nemesis: weak PROBE-TYPE ──┐
                                                               ▼
                            ┌──────────────  Manager  ◄── readiness trend (feedforward) ── Goalkeeper
                 KAL-line ◄─┤  (feedback → tomorrow's drill)   │
                            └──────────────► team_sheet ──► human drills + SHIPS ──► git/eval
                                                                                        │
      FinOps eval harness (RAGAS/api_logs) ◄───────────────────────────────────────────┘
                 │  fail metric → weaknesses.json → drill        ship → buildHook → DEFEND-capsule (flywheel)
                 ▼
        THE SCRIMMAGE (DOSSIER-graded, "bar-cleared") → weak probe-type → back to reps_log
```

### 4.2 — DELTA current → ceiling

| Weld component | Current (cited) | Ceiling | Gap | Pass-1 |
|---|---|---|---|---|
| Feedback scoreboard | **no scoreboard** — FinOps eval harness unbuilt, product not in this repo; *"can't fool the scoreboard"* has no scoreboard | eval-summary JSON + SCRIMMAGE feed drill routing | missing | 7.4 / F-8 |
| Feedforward | Manager reads only today | trend model → pre-empt | missing | new |
| Flywheel (`buildHook`) | display text only | ship → DEFEND-capsule auto-spawn | missing | 7.4 |
| SCRIMMAGE (learning scoreboard) | design-only; grades only self-authored capsules | grades vs shipped eval + timed 5a mini-mock | missing | §5 / new |
| SCOUT (test-set currency) | design-only; DOSSIER frozen 29-Jun | weekly diff → versioned probe-bank | missing | F-9 (+ F-8 currency-loop) |
| repo identity | rig ≟ product ambiguous | rig marked as rig; thin scoreboard-contract from FinOps repo | wrong-framing | F-8 |
| M2 spec (the named moat) | **zero spec** yet *"reconciliation→golden-dataset"* is the stated differentiator | authored spec = a second real dataset | missing | new |

---

## 5. THE 9 OPEN FORKS — strongest recommendation + tradeoff (still OPEN — captain decides)

For each Pass-1 fork: my reasoned recommendation and the cost of being wrong. **None is silently picked.**

**F-1 · Decay authority.** → **Recommend a hybrid, leaning (A): FSRS is the concept-level decay brain; FORGE Re-Jirah becomes per-axis GRADE-capture, not a competing scheduler.** They operate at different grains — FSRS schedules the concept *card*; the capsule grades each *axis*. The code already takes this stance (`learning_state.mjs:20` "decay stays FSRS-owned; we only join axis"). So: FSRS owns "which concept is due"; the capsule's `lastResult`/`calibrationGap` feed calibration/nemesis as *signal*, not as a second "when." This avoids rebuilding a working engine (option B duplicates `ts-fsrs` and is deferred R1 work). **Tradeoff:** requires a captain-gated one-line update to the OS's curriculum clause (`PROJECT_OS.md:404–405, 548` — the curriculum agent *surfaces* due-items and runs no decay-model of its own) so it names FSRS as the explicit decay authority, plus a rename to kill the borrowed "Re-Jirah" name (7.8). Option B preserves the OS's designed per-axis fidelity but duplicates a working engine. `[DISK: learning_state.mjs:20; FORGE_SPEC.md:71–75; PROJECT_OS.md:404–405, 548]`

**F-2 · FSRS reliability floor + Manager gating.** → **Recommend (B), placed AGENT-SIDE (the layering-consistent fix): keep FSRS *scheduling* live from rep 1 (a due-date is motivating and directionally-correct), but give each under-grounded agent its own floor** — null the nemesis headline when its already-computed `warming_up` status is set (`nemesis.mjs:237` computes it, `:240–242` leaves the headline ungated while `:246` correctly gates `axis_pattern`), and add a volume floor beside FSRS's `store.length ? "ok"` (`fsrs.mjs:170`). This keeps every agent authoritative over its own confidence — as `calibration`/`learning_state` already are — instead of re-implementing per-signal reliability logic inside the M-1 wrapper; Pass-1 F-2 itself offered this ("give nemesis-headline a volume gate"). Reserve *Manager-side* gating only for genuinely cross-signal loudness-arbitration. **Also fold in the coherence fix:** unify the three `warming_up` thresholds (12/20/20) so agents cross into confidence *together* on the same stream. **Tradeoff:** a due-date/relapse exists internally but isn't surfaced until warm — a slight delay in the early nudge, against the pure-A option's early-but-misleading loudness. `[DISK: nemesis.mjs:237/240–242/246, fsrs.mjs:170; config files 12/20/20]`

**F-3 · FORGE-capsule → `reps_log` wiring.** → **Recommend (B): wire it — as a per-axis-recall EMIT — but sequence it late and coordinate with the pedagogy owner.** This is the highest-value learning-layer move (the richest studying producing zero repo signal is the single biggest silent loss) *and* the most gated: the capsule's controller fields are reserved/populated "at first R1" (`FORGE_SPEC.md:176`) and the engine is baked-only HTML needing an emit hook (`FORGE_SPEC.md:20`). So it comes **after** one real rep + the R1 schema-fy. **Tradeoff:** it touches the study surface — but it is *wiring* (emit a rep), not a method change; the 9-axis pedagogy, Jirah, and cold-reader law are untouched. Option A keeps the clean air-gap but permanently leaves the deepest studying invisible to the scoreboard. `[DISK: FORGE_SPEC.md:20, 176 — coordinate with Nidhi's domain]`

**F-4 · Output measurement.** → **Recommend (A): instrument real output (a token-free git/CI reader), and keep the human HIT/MISS ritual beside it as corroboration, not replacement.** This is the role's #1 research-confirmed lever (`OPPONENT_SCOUT.md:204, 207`) and the only thing that enforces *presence≠output* in code. The git reader is objective and un-gameable; the human grade stays the ADHD-friendly honest mirror. **Tradeoff:** costs a reader + a thin coupling to the FinOps repo (paired with F-8's contract). Option B (time-in-app + human grade only) is zero new code but lets a low-output day pass as a won day. `[DISK: DAILY_CADENCE.md:57; AGENT: Tier-2:286]`

**F-5 · Loop-closer authoring.** → **Recommend (A) now — `postmatch.mjs`, deterministic — with the LLM authoring only the VOICE.** The loop closes *now*, token-free and testable, and it unblocks the Season Arc (`matches_played`/phase is otherwise frozen at Introduction forever, `manager.mjs:20–21, 86`). State-mutation (`season.json`/`notebook.json`) should be deterministic single-writer (no fabrication), exactly matching the §9 SPLIT where the wrapper does math+state and Opus does voice. **Tradeoff:** state-mutation lives in a second script (consistent with the wrapper pattern). Option B (wait for the M-3 LLM Manager to author post-match) matches single-authoring-surface but leaves the loop open until the whole LLM Manager ships. `[DISK: manager.mjs:20–21; THE_MANAGER §9:255–259]`

**F-6 · timeaudit contract ownership.** → **Recommend (B): the Manager normalizes the nested/camelCase shape, as it already does for readiness (`manager.mjs:108`).** Lower blast-radius; doesn't change a public JSON other consumers may read; consistent with an existing precedent. **And separately fix atomicity in *both* non-atomic writers** — `timeaudit.mjs` (`:276/293`) and `oura_coach.mjs` (`:607/691`, which writes the **biometric** `readiness.json`, where a half-write matters more) both skip the house-style temp→rename the six signal agents use — regardless of which side owns the field-shape. **Tradeoff:** the Manager carries the normalization (already does for readiness). Option A (auditor emits flat keys) keeps the consumer simple but mutates a public contract. `[DISK: manager.mjs:108, timeaudit.mjs:276/293, oura_coach.mjs:607/691]`

**F-7 · Maidan / fluency scaffolding.** → **Recommend (B): strip the baked-empty Maidan emit until a real rep populates it — honor the OS's own law.** `PROJECT_OS.md:453` is verbatim: *"DEFER: Maidan artifact + fluency-drill mechanics ka detail = BUILD WHEN DRILLING, pehle nahi."* An empty baked Maidan reads as built progress (false precision) and the Manager branches on a zero-bit `core_vs_light`. Keep the config *skeleton* (structure) but don't emit a populated-looking Maidan; light-tighten to what a real rep can fill. **Tradeoff:** the Manager loses a shape to surface until data lands — but it has nothing real to surface at 0 reps anyway. This is the OS's own stated principle + the §18 anti-over-build gate, so B is strongly grounded. `[DISK: PROJECT_OS.md:453; 7.10 / F-7]`

**F-8 · What this repo IS.** → **Recommend (A) for identity + a thin data-coupling for the weld: this repo is the accountability RIG (mark it in OPS_STATE so no reader mistakes it for the product); the FinOps product ships separately BUT its eval harness emits a small summary JSON (eval-pass%, cost-per-correct, `api_logs` rollup) this rig READS as the scoreboard signal.** That wires the "what learning is FOR" throughline (F-8's whole point) without folding the product build into the rig. **Tradeoff:** needs a stable cross-repo contract JSON. Pure-A leaves the throughline narrative; pure-B (fold FinOps progress in here) couples rig to product. This thin coupling is the cheapest way to make the weld's Feedback half real. `[DISK: FINOPS_AI_CONCEPTS.md:66–68, 132; F-8]`

**F-9 · Old-rig reconciliation.** → **Recommend (B): keep as read-only reference → port the 4 unbuilt roles' prompts (`examiner.md`→SCRIMMAGE, `scout.md`→SCOUT, distribution, curriculum) → then retire.** Near-zero cost, no runtime dependency gates retirement (`timeaudit.mjs` hits AW directly), and it preserves battle-tested prompts for exactly the 4 outwork agents the arsenal designed but never coded. **Tradeoff:** none material; the only "gate" is that those 4 roles haven't been re-coded — which is what porting fixes. Retire-now (A) loses the prompts; merge-now (C) is the highest one-time effort. `[DISK: Pass-1 §5]`

---

## 6. SECOND-ORDER IDEAS — the consuming wires Pass-1 diagnosed but never designed (each: mechanism · named consumer · why it compounds)

Every one is grounded in a repo file and fits `About.md` + the roadmap; none is generic ambition; no feature without a named consumer. **Honesty note (self-audit against the anti-generic bar):** two capabilities that would otherwise sit here are *already named* and are **not** counted as second-order — **weekly-consistency%** (Pass-1 §10 `SYSTEM_METACOGNITION.md:260`; and O-E5 above) and **feedforward pre-emption** (Pass-1 §6 canon `SYSTEM_METACOGNITION.md:180`; and O-E4 / W-E2 above); both are implementations of already-named items, folded into O-E5 / O-E4, not new ideas. Below, **⟳** marks the one item (S1) that is the concrete *wire* behind a §2–3 END-STATE capability; **S2–S5** are additive beyond both Pass-1's diagnosis and this doc's END-STATE.

**S1 · ⟳ [WELD] The interview-DEFENSE bank pipeline (the concrete wire behind L-E6).** The FORGE capsule already holds a ready-made interview-defense bank (`doubts`, `interviewLines`, `edgeMap`, `confusionPairs`, `buildHook`) — but no agent surfaces it (Pass-1 flagged it as *dead* in 7.9; it is actually *un-plumbed ammunition*). **Mechanism:** a reader that, for the day's concept, pulls the capsule's DEFEND-axis + `edgeMap` and hands it as the SCRIMMAGE's probe and the Manager's BOLO. **Consumer:** `team_sheet.md 🗣️ BOLO` + THE SCRIMMAGE. **Compounds:** every FinOps decision + concept becomes a rehearsed DEFEND-rep toward round 5b (his weapon); *"definitions are free, judgment is what you pay for."* `[DISK: FORGE_SPEC.md:80–95; OPPONENT_SCOUT.md:15, 143]`

**S2 · [WELD] The axis→probe-type→SCRIMMAGE router.** The DOSSIER designs itself as the test-set (§9) and `axisType` maps 1:1 to probe-types. **Mechanism:** nemesis's cross-concept "axis you keep failing" is translated to a DOSSIER probe-type; the SCRIMMAGE drills *that* probe-type in R-late mode. **Consumer:** THE SCRIMMAGE + the Manager formation-read (which probe-type is the weak handoff). **Compounds:** drilling maps to what the interview *actually grades*, not to notes — the DOSSIER's stated anti-overfit purpose. `[DISK: OPPONENT_SCOUT.md:73–121, 218; nemesis reframe CONDUCTOR_LOG §3]`

**S3 · [OUTWORK/WELD] `api_logs` as the observability scoreboard.** Bucket-4's `api_logs` (model/tokens/latency/cost/confidence/promptVersion) is his LLMOps differentiator (Zomato-ops→LLMOps). **Mechanism:** the FinOps repo's `api_logs` rollup emits a weekly cost/latency/eval-pass summary the rig reads as "did it ship AND is it healthy." **Consumer:** the Manager's `🏆 TROPHY` line + post-match. **Compounds:** builds the artifact the interview's *most-decided, most-skipped* round grades (Production/Eval, *"yahीं decide hota"*, `OPPONENT_SCOUT.md:33`) and fills his named exposed gap ("production-scale actual numbers — abhi lived-experience nahi", `:203`). `[DISK: AI_PE_ROADMAP.md:74; FINOPS_AI_CONCEPTS.md:68; OPPONENT_SCOUT.md:33, 108]`

**S4 · [OUTWORK] The build-log / DISTRIBUTION wire as the anti-invisibility fix.** The DOSSIER's biggest-lowest-effort lever: *"invisible-in-private-repos = sabse bada fix: repos public + build-log"* (`OPPONENT_SCOUT.md:205`). **Mechanism:** the F-4 git reader feeds the DISTRIBUTION agent (`PROJECT_OS.md:552`), which drafts a 120–180 word no-hype build-log + a conventional-commit from the diff (human posts/pushes). **Consumer:** the human's public GitHub/LinkedIn presence + post-match. **Compounds:** the `build_output` signal doubles as portfolio evidence — one artifact scores twice (accountability + distribution). `[DISK: OPPONENT_SCOUT.md:205, 207; PROJECT_OS.md:552]`

**S5 · [OUTWORK/WELD] Emit→ingest reconciliation receipt (kill the false-green).** `capture.mjs` counts rejected/duplicate reps but only prints to stdout, and `pull` exits 0 whether it ingested reps, found no inbox, or is unconfigured — so a dropped rep (bad Gem JSON, forgotten `flush_reps()`, `ts` collision) is invisible by construction (extends 7.7 with the exact mechanism). **Mechanism:** `pull` writes a `pull_receipt.json` (emitted-vs-landed manifest) every run; ntfy on mismatch. **Consumer:** the Manager reads it to know `reps_log` is *actually* fresh before building the sheet (today it can't tell "no studying" from "pull silently broken"). **Compounds:** a self-auditing ingestion pipeline is the same data-integrity guarantee FinOps invoice-ingestion (M1) must make — *"AI proposes, code validates"* on his own reps. `[DISK/AGENT: capture.mjs:356–357, 363–365]`

*(Weekly-consistency% and feedforward pre-emption, which a first draft listed here as S6/S7, are removed as second-order: both are Pass-1-named / already in the END-STATE — see the honesty note above. Their mechanisms live in O-E5 and O-E4/W-E2 + Phase-B/C of §7.)*

---

## 7. THE SINGLE SEQUENCED PATH — the one ordering that unblocks the most

Honoring the build order (Manager is the capstone, M-2→M-5 in flight in another thread — **not touched here**) and Pass-1's Phase A/B/C, extended to the weld + second-order. Each step is small, scope-matched, and unblocks the next.

**Phase A — make it real + stop the bleeding (unblocks everything).**
1. **Fix the two silent drops.** (a) `timeaudit → Manager` seam via F-6 (normalize in `computeFeatures`, render Building-vs-target when fresh, add a timeaudit selftest fixture); (b) register the 17-concept syllabus in `concepts.json` + real core/light + wire `unregistered` to a one-line surface. *~cheap; reconnects the loudest live signal + prevents guaranteed phantom fragmentation before reps flow.* `[7.1, 7.5, 7.9, F-6]`
2. **Log one real study rep end-to-end.** `reps_log.jsonl` exists; the chain emits `ok` once. *"Green"→"works."* **This is the gate under every learning-layer step below.** `[§0.1]`

**Phase B — close the loop + honest accountability.**
3. **Build the loop-closer** (`postmatch.mjs`, F-5) → `season.json`/`matches_played`/`notebook.json`/KAL-line + weekly-consistency% (O-E5 / Pass-1 §10). *Unblocks: Season Arc advance (phase unfreeze), feedforward history, the KAL→KICKOFF weld in code.* `[7.4, §10]`
4. **Add the output signal** (git/CI reader, F-4) + wire the DISTRIBUTION build-log (S4). *Unblocks: presence≠output enforced in code + the role's #1 lever (public evidence).* `[F-4]`
5. **Resolve the gating asymmetry** (F-2: agent-side floors — gate the nemesis headline + add an FSRS floor — and unify the 12/20/20 warming-up gate). *Unblocks: a coherent bias-to-silence so the two least-grounded sub-signals stop speaking loudest early.* `[7.2]`

**Phase C — calibrate + wire the weld.**
6. **Calibrate the v0 seed thresholds** against the first weeks of real reps (7.10) — they are placeholders today, uncalibratable at 0 data.
7. **Wire the weld's Feedback half** — *rig-side consumer + contract only.* Build the rig-side reader for the FinOps eval-harness summary JSON (F-8 thin contract) + the `api_logs` observability signal (S3) + port THE SCRIMMAGE from the old rig (F-9), graded on the DOSSIER via the axis→probe-type router (S2) + the DEFEND-bank pipeline (S1 / L-E6). **Hard external dependency:** the *producer* — the FinOps eval harness — is out-of-repo, unbuilt, and currently zero-spec (§4.2; M2 has no spec though it is the named "reconciliation→golden-dataset" differentiator). This step wires a *reader*; **"can't fool the scoreboard" stays BLOCKED until that producer emits the contract JSON** — authoring the M2 / eval-harness spec is the real gate (a FinOps-repo task per F-8), not rig work. *Unblocks the rig side; flags the product-side gate.* `[7.4, F-8]`
8. **Wire the FORGE→`reps_log` bridge** (F-3, coordinate with the pedagogy owner) — the richest studying finally emits signal. *Highest-value, most-gated; comes after one real rep + R1.* `[F-3]`
9. **Add Feedforward + fix the Goalkeeper baseline** (O-E4 / W-E2 trend model — readiness slope × next-concept hardness → pre-empt; `personal_sleep_need` → 6–7h band). *The far half of the loop + an honest body-signal.*

**Explicitly NOT recommended now (over-build — the §18 gate should catch these):** building the FORGE per-axis Re-Jirah controller *in parallel* to FSRS (F-1 option B — duplicates a working engine); unifying the three "dominant axis" definitions (distinct by design; unifying is a regression, Pass-1 §8); emitting a populated-looking empty Maidan (F-7); adding capture fields without a named consumer.

> **The one sentence:** get **one real rep** flowing, **stop the two silent drops**, **close the loop**, **measure what ships** — then, and only then, wire the two scoreboards and the FORGE bridge. Everything before "one real rep" is polishing a hypothesis.

---

## 8. Read-ledger — verified vs assumed

**Read directly by the orchestrator [DISK]:** `SYSTEM_METACOGNITION.md` (Pass-1, full) · `About.md` · `AI_PE_ROADMAP.md` · `OPS_STATE.md` · `CONDUCTOR.md` · `CONDUCTOR_LOG.md` · `THE_MANAGER__Master_Prompt.md` (full) · `FORGE_SPEC.md` (full) · `OPPONENT_SCOUT.md` (full) · `DAILY_CADENCE.md` (full) · `PROJECT_OS.md` (full) · `scripts/manager.mjs` (full — 7.1/7.2/7.3 re-verified against current lines).

**Read by disk-grounded sub-readers [AGENT]:** `ARSENAL_AI_FC_MASTERPLAN.md` · `THE_GAFFER.md` · `dressing-room/manager/system.md` (read-only, M-2 in flight) · `FORGE_DESIGN.md` · `FORGE_DEEP_RENDER_BRIEF.md` · `PYTHON_SYLLABUS.md` · `capture.mjs` · `MANUAL_WIRING.md` · `GEMINI_LOOP.md` · `GEMINI_RIG_SETUP.md` · `God-Tier_Gemini_Workflow.md` · `EXECUTION_FINAL_Tier2_Metamorphosis.md` · `Tier-2_Accountability_Rig...md` · `FINOPS_AI_CONCEPTS.md` · `FINOPS_MODULE3_PROCUREMENT_INTEL.md` · `nemesis/calibration/fsrs/learning_state/timeaudit.mjs` · all `dressing-room/state/*.json` + 4 config files.

**Verified (re-confirmed against disk this pass):**
- 7.1 timeaudit seam: `manager.mjs:113–116` flat keys vs `timeaudit.mjs` nested/camelCase; `:236` on_track-only render; **new**: `:176` leaks `null` into the Opus prompt; **new**: no timeaudit fixture in selftest (`:282–299`). **[DISK+AGENT]**
- 7.2 bias-to-silence: `manager.mjs:89–90` status-gates cards/calibration vs `:126–134` existence-gates weaknesses/learning_state; `nemesis.mjs:240–242` headline no volume gate; `fsrs.mjs:170` no floor. **[DISK+AGENT]**
- 7.3 §4 contract: `loadBus:45–55` hardcoded whitelist (no glob despite `:5` docstring), `intake_log` unread, `low_confidence` never read into `F`. **[DISK+AGENT]**
- `computeFeatures` reads only today's snapshot → feedforward structurally impossible. **[DISK]**
- 17-concept syllabus enumerable on disk: `PROJECT_OS.md:225–237`. **[DISK]**
- `PROJECT_OS.md:453` "BUILD WHEN DRILLING" (F-7) and `:583` weekly-consistency canon, verbatim. **[DISK]**
- **New this pass:** warming-up gate incoherence (12/20/20); **two** non-atomic writers — `timeaudit.mjs` (`:276/293`) and `oura_coach.mjs` (`:607/691`, biometric `readiness.json`) — skip the house-style atomic write; capture pull false-green (`capture.mjs:363–365`); M2 has zero spec though it is the named "reconciliation→golden-dataset" differentiator; M3 spec stale on stack (JS vs the Python-drop). **[AGENT]**

**Assumed / not evidenced [ASSUMPTION] — flagged in place:** the exact names of syllabus concepts #10–17 beyond the enumerated streams (streams are on disk; individual course/FinOps concept titles inferred from `PROJECT_OS.md:234–237`); that the old-rig `examiner.md`/`scout.md` prompts are portable as-is (Pass-1 §5 asserts reference-value, not re-tested here); that a Manager staleness edge (manager_notes showed `stale(2026-07-09)` while `timeaudit.json` is `2026-07-10`) would suppress a fresh signal after 7.1 is fixed — **a verify-item, not a confirmed bug.**

---
*End of draft. Analysis to the ceiling; frame honest — compounding, self-correcting, directed-efficiency. Every fork is yours to call. ⚪🔴*


═══════════════════════════════════════════════════════════════════════════════
# PART 3 · CROSS-REFERENCE APPENDIX (navigation only — no new claim)
═══════════════════════════════════════════════════════════════════════════════

> One-glance map of the **defect → fork → repair-locus** links that are *already stated* across Parts 1–2. This appendix only **collates** those links for navigation; it introduces no new finding and no new linkage. **"—"** = Pass-1 assigns no fork to that defect. Codes: Pass-1 **§7.x/§2.x** = defect · **F-x** = open fork · Pass-2 **L-E/O-E/W-E** = end-state capability · **§7 A/B/C** = sequenced-path phase-step.

## A. Defect → fork → repair-locus

| Pass-1 defect | short name | fork(s) | Pass-2 end-state | sequenced-path step |
|---|---|---|---|---|
| 7.1 | timeaudit signal never reaches the sheet | F-6 | O-E1 | §7 A.1(a) |
| 7.2 | Manager breaks its own bias-to-silence | F-2 | L-E8 | §7 B.5 |
| 7.3 | Manager narrower than its §4 contract | — | (re-verified, Pass-2 §8) | — |
| 7.4 | closed loop unwired (post-match / season) | F-5 (loop) · F-4 (output) | O-E3 · O-E2 · W-E1 | §7 B.3 · B.4 |
| 7.5 | concept registry undershoots (6 vs 17) | — | L-E3 · L-E4 | §7 A.1(b) |
| 7.6 | 9-axis fan-out under-powered at solo volume | — (design limit) | L-E5 | (plan-around) |
| 7.7 | emit-reliability silent failures | — | L-E4 · S5 | §7 A (with the drops) |
| 7.8 | two spaced-rep schedulers, one borrowed name | F-1 | L-E7 | §5 F-1 |
| 7.9 (+ §2.2 core-flag) | dead/vacuous ontology (core:true on all) | — | L-E3 · L-E6 | §7 A.1(b) |
| 7.10 | over-build flags (seed thresholds, empty Maidan) | F-7 (Maidan) | (calibrate) | §7 C.6 · F-7 |
| weld | learning↔execution loop narrative-not-wired | F-8 · F-3 | §4 (W-E1–3) | §7 C.7 · C.8 |
| old rig | 4 designed-not-coded roles | F-9 | O-E6 | §5 F-9 |

## B. Fork index (each fork's full recommendation + tradeoff lives in Part 2 §5)

| fork | topic (verbatim §5 name) | primary defect it addresses |
|---|---|---|
| F-1 | Decay authority | 7.8 |
| F-2 | FSRS reliability floor + Manager gating | 7.2 |
| F-3 | FORGE-capsule → reps_log wiring | weld / richest-study loss |
| F-4 | Output measurement | 7.4 (output) |
| F-5 | Loop-closer authoring | 7.4 (closed loop) |
| F-6 | timeaudit contract ownership | 7.1 |
| F-7 | Maidan / fluency scaffolding | 7.10 |
| F-8 | What this repo IS | weld / scoreboard |
| F-9 | Old-rig reconciliation | old rig (Pass-1 §5) |

---
*End of consolidated base. Parts 1–2 are the two source files verbatim; Part 3 is navigation only. Next pass = the from-scratch re-imagination, not this file. ⚪🔴*
