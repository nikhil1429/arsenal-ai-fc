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
- Deviations / notes: **pull-path is now LIVE (Option B wired 10 Jul).** Google Drive for Desktop is installed + synced (My Drive mounts at `G:`, GoogleDriveFS running). Inbox = `G:/My Drive/arsenal/reps_inbox`, resolved from machine-local `capture_config.json` (gitignored) with env `ARSENAL_REPS_INBOX` override — **no hardcoded user path in the script** (the earlier `USERPROFILE\My Drive` guess was removed). **Round-trip PROVEN:** wrote a rep `.jsonl` into the inbox → `node scripts/capture.mjs pull` → `pulled 1 from 1 file(s)`, appended to `reps_log.jsonl` and moved the source to `/done`; test rep then removed so nothing persists. Task `ArsenalFC-CapturePull` **ENABLED — Status: Ready**, next run 2026-07-11 12:00, cadence 12:00/15:00/18:00/21:00. (History: built DORMANT on 10 Jul when Drive was absent; flipped LIVE once Drive was installed.) Gems `paste` path unchanged (live from day one).
- Commit: #0 build `ea10f85` · NUL-fix `0177aa6` · Option-B-LIVE this commit (see `git log`).
