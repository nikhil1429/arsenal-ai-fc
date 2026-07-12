# ORGANISM_BUILD_LOG.md — live build ledger (resumability anchor)

> **Rule:** a fresh session must be able to resume from ONLY this file + the repo.
> Updated continuously. Committed frequently. Never leave the repo half-broken.

## Mission
Build THE ORGANISM to final form on branch `organism-final` per the captain's
v-final brief (2026-07-12): full body + brain, handbrake off imagination/brain/
intensity, brain runs HOT (exhausts Claude Max 5x), Gemini Pro as second brain,
visualization as a first-class organ, complete setup pack, ready for blood
tomorrow. ONE stop only: money. Humane clamps stay (win-only voicing, cold-start
gag, exception-only voice, Governor never ranked, adaptation disclosed).

## Trust conditions (binding)
- Scope = this repo only. Branch = `organism-final`; never touch `main`.
- Layer, never destroy: all green agents stay intact + runnable.
- Selftests must RUN, old and new, results shown.
- Secrets untouchable: never read/print/commit oura_secrets.json, oura_tokens.json,
  readiness.json, intake_log.json, *.log, or any gitignored personal state.
  `git check-ignore` every data path before commit.
- Commits small + labelled, on branch only. No push to main. Merge = captain's review.
- Revert = `git checkout main` + delete branch.

## Status
- **Branch:** organism-final (created from main @ fcb007f)
- **Phase:** COMPLETE + SUPERPOWER PASS (captain's second order, 12 Jul) —
  full body + brain + arsenal: 7 Claude Skills (.claude/skills/), repo .mcp.json
  (his AW server), Gemini prompt-pack pipeline + sanitizer fold-in (viz.mjs),
  market_scan/maidan_poster/widget_spec brain jobs + per-job extra_args
  (brain.mjs). 22/22 suites re-verified green after upgrades. Folded/skipped
  superpowers logged with reasons in ORGANISM_LEDGER.md.
- **CAPTAIN ACTIVATION (2 min, harness would not let the builder do it):**
  `powershell -ExecutionPolicy Bypass -File setup\INSTALL_TASKS.ps1`
  (+ optional wallpaper line in setup/WALLPAPER.ps1 header). Everything else
  is live the moment those tasks exist.

## Phase plan
- [x] P0a Branch + build log seeded
- [x] P0b Full repo read — 7 parallel readers mapped every tracked file; digests at
      scratchpad map_agent_{0..6}.md (0=trilogy 1=scripts-signal 2=gemini-rig
      3=canon-ops 4=masterplan-manager 5=forge-learning 6=scripts-body).
      THE_ORGANISM.md read in full by builder. Environment probed: Node 22,
      claude CLI present, NO gemini CLI (setup pack installs), 8 live ArsenalFC-*
      schtasks (GK 08:30, FSRS 08:40, Cal 08:42, Nem 08:43, LS 08:44, CapturePull
      09:00 hourly, TimeAuditor 12:00/21:00).
- [ ] P1 Design pass — fresh deepest metacognitive pass; final organ list (BUILT vs [LEAP])
      → output: ORGANISM_ANATOMY.md (committed). Builder authors it directly.
- [ ] P2 Build — organs, brain runtime, Manager-orchestrator, visualization, arsenal
- [ ] P3 Setup pack (`setup/`) — Colab, Gems, NotebookLM, Gemini Pro, Oura/AW/ntfy/Supabase/GitHub
- [ ] P4 Selftests — ALL old + new, run + shown
- [ ] P5 Ledger (THE_ORGANISM build-ledger), morning runbook, what-changed/how-to-revert, money-gate list
- [ ] P6 Final report to captain

## Done
- 2026-07-12: branch `organism-final` created; build log seeded.

## In progress
- **P2 BUILD — INLINE MODE** (subagents dead until 07:00 IST session-limit reset;
  builder writes organs inline, selftest-gated, one commit each).
- **ORGANS GREEN (selftest + real run + committed):**
  1. mirror.mjs (aad542b) — real run pulled all 4 REAL capsules from the gist.
  2. throwin.mjs (7ad2839) — dormant-safe; verbatim + never-counts laws.
  3. heartbeat.mjs (dc31a3d) — real run beat 6/6 live agents; timeaudit bridge works.
  4. physio.mjs (31a4d97) — real run found a TRUE effort_uncaptured bleed;
     doubt_clusters speak-gate already OPEN (real capsules).
  5. twin.mjs (2f9bfbb) — sealed 3 real humble bets; voice silent (gag holds).
  6. touchline.mjs (f9e0af1) — ear exiled by hardcode; no-ping law.
  7. setpiece.mjs (e623bd9) — after doubtminer ran: compiled the FIRST REAL DRILL
     (tape-room rematch on tokenization for 2026-07-13).
  8. scorer.mjs (9cde874) — real run resolved 2 of the twin's real bets.
  9. scout.mjs (e8ae073 + fix) — no-dates law; LEARN/RATIFY proposal.
  10. bootroom.mjs + forge_profile.json (e723059) — genome seeded v1.0.
  11. doubtminer.mjs (44ce8d5) — READ HIS 112 REAL DOUBTS (gate open, status ok);
      112 tape-room rematches eligible; 25 verbatim anchors extracted.
- **NEXT (exact order):** 12. postmatch.mjs (evening ledger; KAL-line writer matching
  manager.mjs regex /KAL-?LINE\s*→\s*(.+)/i; season.json + notebook.json + routed_balls;
  --dry for verification) → 13. viz.mjs (CLUB WALL html per ANATOMY §6) → 14. brain.mjs
  (hot runtime per ANATOMY §5 + brain_config.json already committed; M-3 via
  runManager({llm}) import — manager.mjs UNTOUCHED) → dressing-room/manager/system.md
  sections #6–#11 DRAFTS (label them for captain review; meds fork at #8 = generic
  "your stack") → npm scripts in package.json → setup/ pack (NTFY_SETUP, GEMINI_CLI_SETUP,
  gems prompts, Colab flush cell from MANUAL_WIRING, install_tasks.ps1 with schedule
  from ANATOMY §7, wallpaper.ps1, 12TH_PLAYER_DECISION, Oura/AW/Supabase/GitHub notes)
  → P4 run ALL selftests old+new → ORGANISM_LEDGER.md + MORNING_RUNBOOK.md +
  WHAT_CHANGED.md + money-gate list → final report.
- Full per-organ specs: workflows/scripts/organism-organ-build-wf_ec5db480-112.js.

## Decisions & assumptions
- Reader agents restricted to git-TRACKED files only (secrets/personal state are
  all gitignored — clean rule, zero leak risk).
- Untracked `arsenal_ai_fc_squad.png` left untouched (captain's file, not mine).

## Money-gate list (needs captain + Nidhi — NOT done, would cost new money)
1. **ntfy Pro (~$5/mo)** — true access-control (reserved topics) for the
   throw-in channel. Built instead: free long-random secret topic
   (security-by-obscurity, honest note in setup/NTFY_SETUP.md).
2. **Nothing else.** Claude Max 5x + Gemini AI Pro cover everything built;
   Gemini CLI, ntfy free tier, Supabase free tier, ActivityWatch, schtasks
   are all free-at-the-margin.

## Flags for captain (no money, your call)
1. **system.md sections #6–#11 deliberately NOT drafted** — the repo's own
   anti-corruption law forbids writing soul sections at the tail of a heavy
   thread. The brain's 08:45 formation_read runs on the 5 LOCKED sections
   (the operative core) with the wrapper's validator + fallback guaranteeing
   the sheet. Resume M-2 at #6 in a fresh session — the one soul task left.
2. **Oura client secret** (pre-existing flag) — leaked in a screenshot once;
   regeneration is free, 2 minutes (setup/SURFACES.md).
3. **timeaudit.mjs IST date bug** (pre-existing) — stamps yesterday's date via
   toISOString; heartbeat's bridge works around it without touching the green
   script. One-line fix available whenever you want it.
4. **SEASON_CHANGELOG.md is gitignored** (privacy-first default) — it will
   contain your study-performance evidence lines; flip to committed if you
   want it public as an interview artifact.
5. **The Twelfth Player** — nothing built; decision doc for you and Nidhi at
   setup/12TH_PLAYER_DECISION.md.
