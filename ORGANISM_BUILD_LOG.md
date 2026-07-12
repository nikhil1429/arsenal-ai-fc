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
- **Phase:** 1 — DESIGN PASS (in progress)

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
- **P2 BUILD — INLINE MODE.** The 13-agent organ-build workflow (run wf_ec5db480-112)
  failed entirely: "session limit hit · resets 7am Asia/Calcutta" — the repo-read
  fan-out consumed the Max-plan window. DO NOT spawn subagents until after 07:00 IST.
  Builder is writing organs INLINE, one at a time, committing per organ.
- Organ order: mirror → throwin → heartbeat → physio → twin → touchline → setpiece →
  scorer → scout → bootroom → doubtminer → postmatch → viz → brain.mjs (+ system.md #6–#11).
- Each organ: scripts/<name>.mjs + committed config + selftest green + real-run line.
  Specs live in ORGANISM_ANATOMY.md §3–§7 AND (fuller) in the workflow script file:
  workflows/scripts/organism-organ-build-wf_ec5db480-112.js (per-organ spec blocks —
  a fresh session should read that file for the exact contracts).
- DONE so far: ladder_config.json + dossier_weights.json + brain_config.json committed;
  .gitignore block for ALL new state outputs committed (cb9fff2).
- Resume-point if cut: check `git log --oneline` for last organ committed; continue
  with the next one in the order above, spec from the workflow script file.

## Decisions & assumptions
- Reader agents restricted to git-TRACKED files only (secrets/personal state are
  all gitignored — clean rule, zero leak risk).
- Untracked `arsenal_ai_fc_squad.png` left untouched (captain's file, not mine).

## Money-gate list (needs captain + Nidhi)
- (none yet)

## Flags for captain
- (none yet)
