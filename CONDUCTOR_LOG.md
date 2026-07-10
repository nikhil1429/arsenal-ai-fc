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
- Commit: FSRS build — this STEP-2 commit (see `git log`).
