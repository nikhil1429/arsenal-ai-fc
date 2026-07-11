# ⚪🔴 CONDUCTOR_LOG — Arsenal AI FC · Build Ledger

**Append-only.** One block per agent, in build order (per `CONDUCTOR.md` §11 spec). A fresh Claude Code or chat session runs the §0 boot — reads `OPS_STATE.md` + `CONDUCTOR.md` + this file — then resumes from the last unfinished agent. **A green log is a claim; the committed `.mjs` is the fact** — always fetch/read the actual file (CONDUCTOR §9 anti-hallucination rule).

_Last updated: 2026-07-10 · Branch: `main`_

Build order (CONDUCTOR §3): **#0 Shared Capture Layer → #1 FSRS → #2 Calibration → #3 Nemesis → #4 learning-state → Manager (capstone, LAST).**

---

## Ledger

## 0. Shared Capture Layer (`capture.mjs`) — green · 2026-07-10
- Design capsule: single writer of `reps_log.jsonl`; one JSON/line per study rep `{ts, surface:"gem"|"colab", concept, question, confidence(enum: knew|shaky|guessed), correct(bool), note?}`; two intakes — `paste` (Gems) + `pull` (Colab→Drive, Option B); deterministic, zero-LLM. Three consumers (FSRS/Calibration/Nemesis) READ it, never write it.
- Files written: `scripts/capture.mjs` · `.gitignore` (+`reps_log.jsonl`) · scheduled task `ArsenalFC-CapturePull` (DISABLED placeholder).
- Selftest (`node scripts/capture.mjs selftest`, verbatim; re-run clean, exit 0):
  ```
  ✓ empty-safe: missing log loads as 0 reps
  ✓ valid-append: 2 valid reps appended
  ✓ malformed-reject: 7 rejected, only 1 valid appended
  ✓ dedup: identical ts+question not re-appended
  ✓ empty-ingest: no file fabricated
  ✓ pull dormant: missing inbox → 0 pulled, wired=false

  ALL CHECKS PASSED
  ```
- Output schema: `reps_log.jsonl` `{ts, surface, concept, question, confidence, correct, note?}` — this is the RAW shared layer; the Manager reads the DERIVED consumer JSONs (FSRS/Calibration/Nemesis) per THE_MANAGER §4, not this raw log. Raw rep contract = the §4 study-rep event. matches: yes (raw layer feeds the §4/§10 consumers).
- Empty-state: missing/empty `reps_log.jsonl` = valid awaiting-data; consumers treat absent as empty; capture NEVER fabricates a rep. yes.
- Capture-hook: session-end structured report → `paste` (Drill-Gem JSON array) + `pull` (Colab→Drive inbox, Option B). Documented in the `capture.mjs` header + `MANUAL_WIRING.md`.
- Secrets/PII: `reps_log.jsonl` gitignored + `git check-ignore` VERIFIED (personal study data kept off the PUBLIC repo). yes.
- Deviations / notes: **pull-path is now LIVE (Option B wired 10 Jul).** Google Drive for Desktop is installed + synced (My Drive mounts at `G:`, GoogleDriveFS running). Inbox = `G:/My Drive/arsenal/reps_inbox`, resolved from machine-local `capture_config.json` (gitignored) with env `ARSENAL_REPS_INBOX` override — **no hardcoded user path in the script** (the earlier `USERPROFILE\My Drive` guess was removed). **Round-trip PROVEN:** wrote a rep `.jsonl` into the inbox → `node scripts/capture.mjs pull` → `pulled 1 from 1 file(s)`, appended to `reps_log.jsonl` and moved the source to `/done`; test rep then removed so nothing persists. Task `ArsenalFC-CapturePull` **ENABLED — Status: Ready**, cadence **HOURLY 09:00–22:00 daily** (Daily trigger; repeat every 1h for a 13h duration → last run 22:00). Round-trip **re-confirmed LIVE** after the cadence change (`pulled 1 from 1 file(s)`, appended to `reps_log.jsonl` + moved to `/done`, test rep removed — nothing persists). (History: built DORMANT 10 Jul when Drive was absent → flipped LIVE once Drive installed → cadence changed from 12/15/18/21 to hourly 09:00–22:00.) Gems `paste` path unchanged (live from day one).
- Commit: #0 build `ea10f85` · NUL-fix `0177aa6` · Option-B-LIVE `604d914` · hourly-cadence `e933eaf`.
- Amendment (10 Jul): `confidence` **int 0-100 → enum `knew`|`shaky`|`guessed`** (one gut-word committed before the answer is revealed). Why: the 0–100 % scale was over-engineered false-precision; a 3-way gut-read is the honest, near-zero-friction signal and maps cleanly onto FSRS ratings downstream (guessed/shaky/knew → Hard/Good/Easy on a correct rep). `reps_log.jsonl` was empty (captain starts tomorrow) → **no migration needed**. Updated: `capture.mjs` validateRep + header, `MANUAL_WIRING.md` (Gem prompt asks the gut-word; Colab `log_rep` asserts the 3-set), selftest (added enum-reject + enum-accept). Selftest re-run **ALL CHECKS PASSED**.
- **Amendment v2 (10 Jul) — ontology at ground-zero** (`reps_log` was EMPTY → zero migration). Enriched the rep contract with: `track:"concept"|"skill"` · `axis:"a".."i"|null` (concept-only; skill MUST be null) · `latency_ms:int≥0|null` (optional) · `aided:bool|null` (skill-only) · `unregistered:bool` (concept not in registry → **SOFT: still logged, never dropped**). NEW canon file `dressing-room/state/concepts.json` (committed vocab: 9 axes + concept/skill IDs + aliases) — capture **READS only** (single-writer preserved), drives concept normalization (case-fold + alias) + the `unregistered` flag; missing registry ⇒ still logs. Strictly **additive (layering)** — every prior check retained; no `validateRepLegacy` needed (empty log, old checks are a subset). Selftest now **19 checks** (track/axis-accept/reject · skill-null-axis · skill+axis-reject · latency accept/reject · aided-only-on-skill · alias→canonical · unknown→unregistered · concepts-missing→still-logs · + all prior) → **ALL CHECKS PASSED**. `MANUAL_WIRING.md` emitters updated in lockstep (Gem emits `track:"concept"`+axis; Colab `log_rep` emits `track:"skill"`+`aided`) — REQUIRED, else new reps would reject. Commit: capture-v2 (see `git log`).

## 1. FSRS (`fsrs.mjs`) — green · 2026-07-10
- Design capsule: CONSUMER of `reps_log.jsonl` (never writes it). CONCEPT-level cards (card id = normalized concept string); every rep on a concept = one review event, replayed in `ts` order through the real FSRS algorithm. Rating map: incorrect→Again · correct+guessed→Hard · correct+shaky→Good · correct+knew→Easy. Outputs `cards.json` (Manager summary) + `fsrs_store.json` (per-card). Single writer = `fsrs.mjs`.
- Files written: `scripts/fsrs.mjs` · `package.json` + `package-lock.json` (ts-fsrs dependency) · `.gitignore` (+`cards.json`, `fsrs_store.json`) · scheduled task `ArsenalFC-FSRS` (daily 08:40, before the Manager's 08:45).
- **FSRS impl: `ts-fsrs` 5.4.1 — FSRS-6.0, 21-weight default parameters**, `request_retention` 0.90 (configurable via env `FSRS_RETENTION`), `enable_fuzz=false` (deterministic → reproducible selftest). Real vetted algorithm, not hand-rolled math. `node_modules` gitignored; `package.json`/`package-lock.json` committed for reproducible install.
- Selftest (`node scripts/fsrs.mjs selftest`, verbatim; exit 0):
  ```
  ✓ correct reviews lengthen interval (growth interval ≥ 7d)
  ✓ incorrect resets interval (lapse interval < 2d)
  ✓ sustained-correct interval > lapsed interval
  ✓ due/overdue counts (overdue=2, due_today=1)
  ✓ hardest_due ordered soonest-due first
  ✓ hardest_due tie-break by lowest-stability
  ✓ empty-safe: status awaiting_data, zero counts, no cards

  ALL CHECKS PASSED
  ```
  Plus a live end-to-end proof on real state: `capture paste` 4 reps → `fsrs recompute` → 2 cards, `overdue 1` (the lapsed "TDS 194C"), then cleaned back to `awaiting_data`.
- Output schema: `cards.json` `{date, engine, request_retention, total_cards, due_today, overdue, hardest_due[], status, generated_at}` — matches THE_MANAGER §10 (`due_today`/`overdue`/`hardest_due`/`status:"awaiting_data"`). matches: yes.
- Empty-state: no reps → `cards.json` `status:"awaiting_data"` + empty store; never fabricates a card. yes.
- Capture-hook: n/a — FSRS is a consumer; it reads Agent #0's `reps_log.jsonl`.
- Secrets/PII: `cards.json` + `fsrs_store.json` gitignored + `git check-ignore` VERIFIED (derived personal study data: concepts + schedule — kept off the PUBLIC repo). yes.
- Deviations / notes: introduces the repo's **first npm dependency** (`ts-fsrs`) — deliberate, per the captain's stated preference for a vetted impl; `package.json`/`package-lock.json` committed, `node_modules` gitignored (a fresh clone runs `npm install`). Recompute scheduled daily **08:40**; the optional "recompute after each capture pull" hook was left UNwired to keep `capture.mjs` single-purpose (can be added to the CapturePull task action later).
- Commit: FSRS build — STEP-2 commit `0361a6e`.
- **Fix (10 Jul, capture-v2 lockstep) — track-filter:** `validRep` now requires `track === "concept"`; `track:"skill"` (Python) reps are IGNORED by FSRS (canon: fluency is a #4 signal, not a spaced-recall card). Baked selftest mocks updated with `track:"concept"`; ADDED assertions `skill-track ⇒ ZERO cards` + `concept-track mocks still produce cards`. Rating map unchanged. Selftest **9 checks ALL CHECKS PASSED**; live proof: mixed concept+skill reps → only the concept card (`bpe`→`tokenization`). Commit: fsrs track-filter (see `git log`).

## 2. Calibration (`calibration.mjs`) — green · 2026-07-10
- Design capsule: CONSUMER of `reps_log.jsonl` (BOTH tracks — self-knowledge is domain-general). `calibration_gap` = **ECE** vs target accuracies `{knew:0.95, shaky:0.65, guessed:0.30}`; `overconfidence_rate` = P(wrong|knew); per-topic `danger_zone` (knew-WRONG only: ≥3 knew reps AND knew-accuracy < 0.67) with concept-track axis-sharpen; rep-count trend windows; reliability floor (`awaiting_data`/`warming_up`/`ok`) **biased to SILENCE**. Deterministic, zero-LLM. Single writer `calibration.json`.
- Files written: `scripts/calibration.mjs` · `dressing-room/state/calibration_config.json` (canon config) · `.gitignore` (+`calibration.json`) · scheduled task `ArsenalFC-Calibration` (daily 08:42, after FSRS 08:40 / before Manager 08:45).
- Selftest (`node scripts/calibration.mjs selftest`, verbatim tail; exit 0):
  ```
  ✓ axis-sharpen: shared axis ⇒ axis f
  ✓ axis-sharpen: mixed axes ⇒ no axis
  ✓ domain-general: skill (Python) topic CAN enter danger, no axis
  ✓ trend narrowing (2 full windows, gap shrinks)
  ✓ trend holding steady (delta < trend_delta)
  ✓ trend establishing baseline (<40 reps)
  ✓ config missing ⇒ defaults
  ✓ concepts.json missing ⇒ topic = raw normalized id

  ALL CHECKS PASSED
  ```
  (19 checks total: empty-safe · warming_up-suppresses-danger · ECE=0.2125 · overconf+null · buckets+empty-null · danger low/mid · gates 2-knew/shaky-wrong · axis-sharpen · domain-general · trend ×3 · config/registry-missing.) Live proof: 5 reps → `warming_up` (gap 0.5, overconf 0.67), danger **suppressed** even though chunking qualifies; cleaned to `awaiting_data`.
- Output schema: `calibration.json` `{date, calibration_gap(ECE), trend, overconfidence_rate, buckets{knew,shaky,guessed:{n,accuracy}}, danger_zone[{topic,confidence,accuracy,axis?,note}], total_reps, status, low_confidence, generated_at}` — §10 required (date/gap/trend/danger_zone) present + additive extras. matches: yes.
- Empty-state: 0 reps → `status:"awaiting_data"`, gap null, danger []; never fabricates. yes.
- Capture-hook: n/a — consumer of Agent #0's `reps_log.jsonl`.
- Secrets/PII: `calibration.json` gitignored + `git check-ignore` VERIFIED (derived study data: gap + confident-wrong topics). `calibration_config.json` = canon, trackable. yes.
- Deviations / notes: reads BOTH tracks per capsule (a knew-wrong on Python is a blind spot too). `danger_zone` SUPPRESSED below `min_reps` (Fork-4 bias-to-silence — an early false alarm teaches the captain to distrust the agent). ECE = Fork-1 scalar; full per-bucket breakdown kept (Fork-2 intent, nothing discarded). No new npm deps.
- Commit: Calibration build — this commit (see `git log`).

## 3. Nemesis (`nemesis.mjs`) — green · BUILT (Fork A resolved = A3) · 2026-07-10
BUILT + selftest green (Fork A resolved = A3). The locked design below drove the build and is retained for provenance; build details + build-capsule fixes are appended at the end of this block.
- REFRAME (locked, god-tier): Nemesis is NOT a ranked shame-list (harmful for ADHD-PI + redundant — recurrence=FSRS's job, confident-wrong=Calibration's). Its UNIQUE signal (no per-card view can make it) = CROSS-CONCEPT AXIS PATTERN: "misses on tokenization+chunking+retrieval all cluster on axis-e (failure-modes)" → your nemesis is a KIND OF THINKING, not a topic. This is the payoff for capturing `axis` from day 1. Frame = self-SCOUT (OPPONENT_SCOUT/DOSSIER idiom), never shame. No 10x/hype in output (compounding frame).
- Principles (locked): (1) signal = RELAPSE (broke AFTER learned) or confident-wrong — NOT mere wrong≥3 (else it repeats FSRS). (2) ONE headline nemesis ("today's #1 opponent"), full list collapsed below (ADHD single-focus). (3) receipts/evidence per entry (§10 evidence:[...]) — scouting report, not taunt. (4) healed/closed visible (beaten opponent = trophy; list never endless). (5) cold-start honest — cross-concept pattern needs volume, near-silent day-1 BY DESIGN; FLOOR = per-concept relapse (simple), CEILING = cross-concept axis meta-pattern (emerges over weeks). bias-to-silence.
- Forks LOCKED: B (miss-signal) = relapse OR confident-wrong OR shaky-wrong, grouped per topic+axis (this is where the shaky-wrong deliberately kept OUT of Calibration flows in). C (ranking) = headline one primary nemesis + the cross-concept axis pattern; recency-weighted recurrence, decay so stale/healed sink. D (healed) = last 3 clean on a topic + no knew-wrong ⇒ status:"closed" (kept in history, off active rank; no alarm-fatigue).
- Fork A — OPEN (resolve FIRST next thread): who writes weaknesses.json? THE_MANAGER §4 says "Manager is the writer"; CONDUCTOR §13 Fork-2 leaves it open. A1 = Nemesis writes ranked weaknesses.json directly (conflicts §4 wording). A2 = Nemesis writes raw nemesis_events.json, Manager derives ranked file at capstone. A3 = Nemesis is sole writer of weaknesses.json incl. rank, Manager only consumes (reconcile §4 as "Manager writes the team-sheet LINE, Nemesis writes the FILE" — consistent with FSRS→cards.json, Calibration→calibration.json). Chat-Claude lean = A3. Captain must pick, THEN the full build capsule is written.
- Schema target: THE_MANAGER §4/§10 weaknesses.json { weaknesses:[{id,topic,recurrence,last_seen,status,evidence[]}] } + additive axis-pattern field. Empty-safe (status:"awaiting_data"), single-writer, deterministic zero-LLM, output gitignored (derived PII), reads reps_log (both tracks) + calibration.json.

--- BUILD (2026-07-10) ---
- Files: `scripts/nemesis.mjs` · `dressing-room/state/nemesis_config.json` (canon, trackable) · `.gitignore` (+`weaknesses.json`) · scheduled task `ArsenalFC-Nemesis` (daily 08:43, after Calibration 08:42 / before Manager 08:45).
- **Fork A RESOLVED = A3:** Nemesis is the SOLE writer of `weaknesses.json` (incl. rank); the Manager consumes it + writes the team-sheet LINE (FSRS→cards.json / Calibration→calibration.json precedent). Post-green THE_MANAGER §4 one-line canon clarification pending — human-gated, not mid-build.
- **Build-capsule fixes baked:** [A] `id` = stable topic slug (never positional — history/evidence survive recompute) · [B] `recurrence` = RAW int, `score` = separate recency-weighted float · [C] **`calibration.json` NOT read** — clean 2-input consumer (`reps_log` + `concepts.json`); confident-wrong is re-derived here, no coupling. *(Supersedes the design line above that said "reads … + calibration.json".)* · [D] `axis_pattern.strength` = distinct-concept cluster size; single volume gate reused (`warming_up_min_reps`, no extra knob).
- Selftest (`node scripts/nemesis.mjs selftest`, verbatim tail; exit 0):
  ```
  ✓ healed ⇒ status closed, retained, not headline
  ✓ single-focus: exactly one headline object
  ✓ receipts: every real entry has non-empty evidence[]
  ✓ schema: {id,topic,recurrence,last_seen,status,evidence[]} present
  ✓ concepts.json absent ⇒ axis null + no axis_pattern

  ALL CHECKS PASSED
  ```
  (17 checks: empty-safe · relapse-vs-never-learned · confident-wrong · shaky-wrong · guessed-wrong-excluded · recency-weighting · id-stability · recurrence-int/score-float · axis-cluster+mixed-null · volume-gate · skill-relapse-no-axis · healed-closed · single-headline · receipts · schema · registry-missing.) Live: 3 reps → `warming_up` headline (chunking relapse axis f + async skill), axis_pattern suppressed; cleaned to `awaiting_data`.
- Output schema: `weaknesses.json` canonical `{id,topic,recurrence,last_seen,status,evidence[]}` + additive `{date,generated_at,total_reps,status,low_confidence,headline,axis_pattern{axis,concepts,strength,note}, per-entry axis,score}` — §4/§5/§10 present + extras. matches: yes.
- Empty-state: 0 reps → `status:"awaiting_data"`, weaknesses [], headline/axis_pattern null; never fabricates. yes.
- Secrets/PII: `weaknesses.json` gitignored + `git check-ignore` VERIFIED (weak topics + receipts). `nemesis_config.json` = canon, trackable. yes.
- Commit: Nemesis build — this commit (see `git log`).

## 4. learning-state (`learning_state.mjs`) — green · 2026-07-10
- Design capsule: the fluency / positional map (the **Maidan**). CONSUMER of `reps_log` (both tracks) + `fsrs_store.json` (join `due`→`rejirah_due`) + `concepts.json` (axis/bucket/**core**) + `learning_state_config.json` (thresholds + Maidan). Emits per concept/skill fluency 🔴🟡🟢 + velocity/trajectory + per-axis rollup + rejirah_due + edge-map + confusion-pairs + Maidan stages/handoffs + core_vs_light. Deterministic, zero-LLM. Single writer `learning_state.json`.
- **PART A `capture-v3`** (prior commit `6fe8df2`): `reps_log` gained `confused_with` (canonicalized like concept) + `edge` (verbatim) — the permanent raw inputs feeding edge-map + confusion-pairs. All prior capture checks + the 3 consumers stayed green.
- Files (PART B): `scripts/learning_state.mjs` · `learning_state_config.json` (canon) · `concepts.json` (+`core` flag on every entry) · `.gitignore` (+`learning_state.json`) · scheduled `ArsenalFC-LearningState` (daily 08:44, after FSRS/Cal/Nemesis, before Manager 08:45).
- LOCKED decisions honored: Maidan = **v0 SEED** (stage/handoff structure real domain architecture; latency/runnable thresholds are v0 hypotheses, R1-calibrated, lossless re-run) · **aided-gating IN** (skill 🟢 requires `aided:false`) · velocity IN · edge-map + confusion-pairs fed by real capture-v3 data · rejirah_due **joins** FSRS decay + axis (no decay re-impl — single-responsibility) · **DEFERRED to R1 (NOT built):** threshold calibration, drill-mechanics, pedagogical prereq-graph · Nidhi boundary: outcomes/state only.
- Selftest (`node scripts/learning_state.mjs selftest`, verbatim tail; exit 0):
  ```
  ✓ Maidan: weak_connection surfaces at ok volume
  ✓ warming_up: <min_reps ⇒ low_confidence + weak_connection null (suppressed)
  ✓ Manager surface fields present
  ✓ registry missing ⇒ graceful (raw id, bare axis letter, no crash)

  ALL CHECKS PASSED
  ```
  (20 checks: empty-safe · fluency-ladder · held≠fluent · regression · aided-gating true⇒not🟢/false⇒🟢 · latency-absent proxy · velocity improving/stalling · per-axis rollup · rejirah_due join + fsrs-missing⇒[] · edge-map-latest · confusion-pairs+attach · Maidan runnable+weak_connection · warming_up-suppress · Manager-surface-fields · registry-graceful.) **Ripple:** all 5 agents' selftests green after `concepts.json` `core` add. Live: 4 reps → chunking 🟢, pydantic 🔴, edge + core_vs_light populated; cleaned to awaiting_data.
- Output schema: `learning_state.json` — Manager §10 surface (`maidan_stage_focus, weak_connection, python_fluency, rejirah_due, core_vs_light`) + additive (`concepts[], axes[], maidan{}, edge_map, confusion_pairs`, envelope). matches: yes.
- Empty-state: 0 reps → `awaiting_data`, rep-derived lists `[]`, surface null/`{}`, `maidan.stages` skeleton from config (`runnable_frac:0`, `awaiting_data`); never fabricates a rep-derived value. yes.
- Capture-hook: n/a — consumer (capture-v3 added its two raw fields at the #0 layer).
- Secrets/PII: `learning_state.json` gitignored + `git check-ignore` VERIFIED. `learning_state_config.json` + `concepts.json` = canon, trackable. yes.
- Deviations / notes: registry-missing ⇒ **bare axis letter** (no label) + raw id — graceful, not null (learning-state keeps the rep's axis; concepts.json only supplies the label). Single volume gate (`warming_up_min_reps`) suppresses the `weak_connection`/`maidan_stage_focus` headline. No npm dep.
- Commit: learning-state build — this commit (see `git log`).

---
**SIGNAL-SOURCE AGENTS COMPLETE.** #0 Capture · #1 FSRS · #2 Calibration · #3 Nemesis · #4 learning-state — all built + selftest-green + scheduled (08:40–08:44) + outputs gitignored. Next & LAST = **the Manager capstone** (M-1 wrapper reference → M-2 soul → M-3 `claude -p` + billing guards → M-4 sandbox §11 → M-5 tasks), integrated + re-tested on the REAL agent JSONs now present.

## Manager (capstone) — M-1 `manager.mjs` PLACED + green · 2026-07-11
Capstone build step 1 of 5 (§9 THE SPLIT, Part 1 — the deterministic wrapper, NO LLM). This is NOT the full Manager: M-2→M-5 remain.
- **Placed VERBATIM** from web-Claude's proven prototype: `scripts/manager.mjs`, sha256 `f35c9f38…ca9c1`. Committed **`1d4e158`** (with `.gitignore`).
- Selftest: `node scripts/manager.mjs selftest` → **ALL CHECKS PASSED (35 passed, 0 failed)**. Baked fixtures = verbatim real agent outputs (rich mid-season + cold-start `awaiting_data`).
- **Re-tested against REAL agent JSONs (not §10 dummy)** — found + FIXED two real-data schema mismatches: (1) Goalkeeper `readiness.json` uses `day` / `workType[]` / `timing{}` (not `date` / `work_type_overlay` / timing-string) → wrapper reads the real fields, renders the timing object to a one-line SHAPE, puts workType in ENERGY, no more `[object Object]`; (2) UTC `toISOString` vs the agents' LOCAL `date` → wrapper now uses a **LOCAL date basis** so today-dated agents read `fresh`. Also: `STATE_DIR` is **script-anchored** (`join(__dirname, "..", "dressing-room", "state")`) like fsrs/calibration — **CWD-independent (VERIFIED in the placed file)**; readiness staleness is **Oura-lag tolerant** (≤2d via `day`).
- Design honored: **bias-to-silence propagates up** (a null / `awaiting_data` agent field ⇒ NO line); consumes Nemesis `headline` / `axis_pattern` **verbatim** (Fork A3 — not re-derived); **LLM = plugged stub** (M-1 sets NO API/key ⇒ always falls back — the sheet appears **unconditionally**); **zero-hallucination validator** (every number in the sheet ∈ FEATURES, else reject → fallback); atomic temp→rename writes.
- Real run (2026-07-11 live state): sheet rendered · `[source=fallback · no-llm (M-1)]` · staleness = readiness/cards/calibration/weaknesses/learning_state **fresh**, timeaudit `stale(2026-07-09)` (honest — not run since). SHAPE = real peak windows, ENERGY = ENCODE directive, no `[object Object]`.
- `.gitignore`: `team_sheet.md` · `manager_notes.json` · `season.json` · `captain_note.md` · `post_match/` — added + `git check-ignore -v` verified.
- **Record-correction:** the `1d4e158` commit message note "state dir CWD-relative → M-5 needs `Start In` = repo root" described the FIRST (superseded) placement `072baa8`. The corrected `f35c9f38` is script-anchored, so **M-5's scheduled task is CWD-independent — no `Start In` / `ARSENAL_STATE_DIR` required** (same as every other ArsenalFC task).
- Remaining: **M-2** `system.md` soul (THE_MANAGER + THE_GAFFER — captain approves line-by-line) → **M-3** `claude -p` wiring + billing guards (`ANTHROPIC_API_KEY` never set + Extra-Usage OFF = hard $100 ceiling; swap the stub) → **M-4** sandbox the §11 scenarios → **M-5** scheduled task 08:45 + ntfy.
