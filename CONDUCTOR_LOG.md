# ⚪🔴 CONDUCTOR_LOG — Arsenal AI FC · Build Ledger

**Append-only.** One block per agent, in build order (per `CONDUCTOR.md` §11 spec). A fresh Claude Code or chat session runs the §0 boot — reads `OPS_STATE.md` + `CONDUCTOR.md` + this file — then resumes from the last unfinished agent. **A green log is a claim; the committed `.mjs` is the fact** — always fetch/read the actual file (CONDUCTOR §9 anti-hallucination rule).

_Last updated: 2026-07-10 · Branch: `main`_

Build order (CONDUCTOR §3): **#0 Shared Capture Layer → #1 FSRS → #2 Calibration → #3 Nemesis → #4 learning-state → Manager (capstone, LAST).**

---

## Ledger

## 0. Shared Capture Layer (`capture.mjs`) — green · 2026-07-10
- Design capsule: single writer of `reps_log.jsonl`; one JSON/line per study rep `{ts, surface:"gem"|"colab", concept, question, confidence(int 0-100), correct(bool), note?}`; two intakes — `paste` (Gems) + `pull` (Colab→Drive, Option B); deterministic, zero-LLM. Three consumers (FSRS/Calibration/Nemesis) READ it, never write it.
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
- Deviations / notes: **pull-path built REAL but DORMANT** — design-validation found Google Drive for Desktop NOT installed on the machine (no `My Drive`, no `GoogleDriveFS`, only C:/D:). So `pull` is a safe no-op until wired (it reports the exact enable steps, never fakes a pull). Task `ArsenalFC-CapturePull` created **DISABLED**, cadence 12:00/15:00/18:00/21:00 (aligned to existing ArsenalFC pulses) for when enabled. **TO ENABLE (captain, one-time):** install Google Drive for Desktop → create the `My Drive\arsenal\reps_inbox` folder (or set env `ARSENAL_REPS_INBOX`) → `schtasks /Change /TN ArsenalFC-CapturePull /ENABLE`.
- Commit: see STEP-B commit in `git log` (this build).
