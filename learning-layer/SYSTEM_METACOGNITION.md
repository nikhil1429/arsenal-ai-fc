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
