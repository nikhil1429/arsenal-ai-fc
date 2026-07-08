# ⚪🔴 ARSENAL AI FC — OPS_STATE
**THE thread-agnostic anchor. A fresh thread reads this ONE file (+ MASTERPLAN for design) and knows everything: the pipeline, what's done, what's pending. No zip, ever.**
Keep BOUNDED (~1.5 pages). Resolved items compress to one line. This is STATE, not a log — history lives in git commits.

_Last updated: 2026-07-08 · Branch: `main`_

---

## ⚡ WHERE WE ARE (one glance)
**Phase 0 — deterministic referees.** Goalkeeper ✅ live · Time-Auditor ✅ live · **NEXT = Agent 3 The Manager.**

## THE 2-FILE RULE (kills the zip / repeating problem)
New thread reads exactly two files — no zip:
1. `https://raw.githubusercontent.com/nikhil1429/arsenal-ai-fc/main/ARSENAL_AI_FC_MASTERPLAN.md` — design + philosophy (static)
2. `https://raw.githubusercontent.com/nikhil1429/arsenal-ai-fc/main/OPS_STATE.md` — this (live state)

**New-thread opener (copy-paste):**
> Read arsenal-ai-fc via raw URLs: MASTERPLAN (design) + OPS_STATE.md (current state). Then continue from ▶ NEXT ACTION.

**Write discipline:** each thread-end, Claude drafts the OPS_STATE delta → Nikhil `git s` (add+commit+push). Transport later fully automated by the AutoPush referee (Pipeline Phase 0).

---

## 🎯 THE PIPELINE (what's coming — masterplan §17 has full detail)
- **Phase 0 — Deterministic referees** (zero LLM tokens, cron-driven): Goalkeeper ✅ · Time-Auditor ✅ · **AutoPush** (git auto-commit/push) · FSRS + calibration. ◀ we are here
- **Phase 1 — Playable XI:** The Manager (team-sheet + post-match) + 1 Gemini generator + 1 Claude grader.
- **Phase 2 — Midfield + first eval:** FSRS/retrieval/calibration + FinOps RAGAS harness.
- **Phase 3 — Decisive signing + jury:** Eval Prosecutor + dual-judge jury.
- **Phase 4 — Full attack + Nemesis:** remaining interviewers + overnight Nemesis.
- **Phase 5 — Ship the trophy:** FinOps Copilot → live API + eval CI gates. (= the ₹20–25 LPA offer.)
- **Phase 6 — Recruitment dept.** · **Phase 7 — Depth/rotation.**

## ✅ DONE (across previous threads)
- Repo `nikhil1429/arsenal-ai-fc` — **PUBLIC**, local `C:\Users\nikhi\GitHub\arsenal-ai-fc` (off OneDrive), branch `main`.
- `ARSENAL_AI_FC_MASTERPLAN.md` + `README.md` pushed. `dressing-room/` scaffold + `constitution.md` built.
- **Goalkeeper** (`scripts/oura_coach.mjs`): ✅ LIVE + auto. Task `ArsenalFC-Goalkeeper`, daily 08:30, `StartWhenAvailable`. First verdict AMBER (sleep-debt 44.5h). Oura OAuth + dev-mode-401-skip + ESM-entry bugs fixed.
- **Time-Auditor** (`scripts/timeaudit.mjs`): ✅ LIVE + auto. Tasks `ArsenalFC-TimeAuditor-Pulse` (12/15/18) + `-Full` (21:00). Pulls real ActivityWatch data → Learning/Building/Meta + on-track. `buckets.json` calibrated (claude.ai + gemini.google.com = Learning).
- **OPS_STATE.md** (this) — thread-agnostic anchor established; zip workflow retired.

## ⏳ PENDING (ordered)
1. **AutoPush referee** — Windows scheduled task: nightly `git add -A && commit && push` in repo. Deterministic, thread-agnostic transport (state pushes itself). Quick Phase-0 add.
2. **Agent 3 — The Manager** (Claude Opus): reads `readiness.json` + `timeaudit.json` → morning team-sheet (what to do, what energy, on-track). Resolves the claude.ai learn-vs-build ambiguity app-level can't. ~06:00 + ~21:30.
3. Playable XI → rest of §17 phases.

## ▶ NEXT ACTION (single finish line)
**Agent 3 — The Manager.** (Or AutoPush first if we want transport hands-free before Manager — Nikhil's call.)

## 🔒 LOCKED DECISIONS (do NOT re-litigate)
- **Cadence:** Goalkeeper 08:30 once/day (orthosomnia). Time-Auditor pulse 12/15/18 + full 21:00 (auto).
- **Buckets:** Learning / Building / Meta. Claude (desktop + `claude.ai`) → Learning; `gemini.google.com` → Learning; YouTube → Meta; Chrome by domain (Colab/GitHub/docs → Building/Learning); terminal/VS Code/GitHub Desktop → Building. Targets: Building ≥60%, Meta ≤25%. Editable in `buckets.json`.
- **Music-while-coding = non-issue:** ActivityWatch logs the FOCUSED tab only; background YouTube while VS Code is front counts as Building.
- **NO per-URL Gemini classification** (breaks deterministic zero-token design). Semantic nuance (e.g. claude.ai learn-vs-build) = BATCHED once/day in the Manager. **Gemini = bulk drills + end-of-build visualization ONLY.**
- **Meds:** no hardcoded timings; Nikhil logs each dose in `intake_log.json`; older days sparse OK. Psychiatrist-managed; HR signals low-confidence; doctor-referral safety flag; DATA-interpretation only, never med advice.
- **Push/human-gate:** Claude has NO github write in-chat + no cross-thread persistence → cannot auto-push. Claude drafts state; Nikhil (or the AutoPush cron) pushes. Auto-approve nothing (masterplan §20).

## 🧠 ENV FACTS / LESSONS (carry-forward)
- Windows PowerShell 5.1. ESM entry-check MUST use `pathToFileURL(process.argv[1])` (else silent exit). `cmd`/`start` splits URLs on `&` → print, don't auto-open. Log files show UTF-8 emoji as gibberish (cosmetic).
- Two systems coexist: `accountability-rig` (`C:\Users\nikhi\accountability-rig`, ActivityWatch MCP already connected; MCP server at `C:\Users\nikhi\activitywatch-mcp-server`) + `arsenal-ai-fc` (canonical). Reuse rig's AW connection; reconcile don't duplicate (§15). Reconciliation = parked.
- Oura: dev-mode endpoints (resilience, cardiovascular_age, vo2_max) 401 → skipped. Data lags 1-2 days until phone app syncs. Must be logged into correct Oura account in browser before OAuth consent.

## 📦 END-OF-BUILD TASKS (do ONLY when all agents are live — anti-procrastination gate §18)
1. **Modify project files + OS instructions** wherever the new squad needs wiring.
2. **Send ALL text/state data → Gemini Pro for VISUALIZATION.** Nikhil's ADHD brain can't read walls of text — the whole system's status/output must render as visuals, not markdown. (Bundle state JSONs + OPS_STATE → send-path to Gemini Pro → dashboards/visuals.) This is the intended daily-consumption surface.

## 🚨 GATE (§18 — read when the urge to design returns)
System-maintenance time > study/ship time in ActivityWatch → **FREEZE new agents.** When in doubt: ship a feature, run a mock — don't add an agent. Log every med/caffeine dose daily.
