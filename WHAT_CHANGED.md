# WHAT_CHANGED.md — the organism-final branch, and the one command that undoes it

## The one-command revert
```powershell
git checkout main            # the pre-organism system, exactly as it was
git branch -D organism-final # (optional) delete the branch locally
```
`main` was never touched. No existing file was modified except three additive
ones (below). No scheduled task was created by the build (INSTALL_TASKS.ps1 is
yours to run); no system setting was changed; no secret was read or committed.

## What was added (all on branch `organism-final`)
- **14 new organs** in `scripts/`: mirror · throwin · heartbeat · physio ·
  twin · touchline · setpiece · scorer · scout · bootroom · doubtminer ·
  postmatch · viz · brain — each with a green selftest, each single-writer,
  each empty-safe.
- **12 committed configs** in `dressing-room/state/`: ladder_config ·
  dossier_weights · brain_config · mirror_config · throwin_config ·
  heartbeat_config · physio_config · twin_config · touchline_config ·
  setpiece_config · scorer_config · scout_config · doubtminer_config ·
  forge_profile (the genome).
- **Docs**: ORGANISM_ANATOMY.md (design constitution) · ORGANISM_LEDGER.md
  (BUILT/GATED/[LEAP], honest) · MORNING_RUNBOOK.md · ORGANISM_BUILD_LOG.md ·
  this file.
- **setup/** — the complete wiring pack (10 files, paste-ready).

## The only modified existing files (all additive)
1. `.gitignore` — one new block ignoring every new personal-data output
   (verified with `git check-ignore` before every commit).
2. `package.json` — new npm scripts only (`organism:selftest`, `squad:selftest`,
   `heartbeat`, `wall`, `postmatch`, `brain`, `brain:status`).
3. `ORGANISM_BUILD_LOG.md` — created by this build (its own ledger).

**Never touched:** every green agent (capture, fsrs, calibration, nemesis,
learning_state, manager, oura_coach, oura_auth, timeaudit, test_coach_v2),
every canon doc (OPS_STATE, CONDUCTOR, MASTERPLAN, THE_MANAGER, THE_GAFFER,
CLAUDE.md), dressing-room/manager/system.md (M-2 resumes at #6 as CONDUCTOR_LOG
says), all learning-layer files, all existing schtasks.

## Proof
`npm run squad:selftest` — all 8 original agents still green (run 12 Jul 2026:
22/22 suites green total). A green log is a claim; run it yourself — that's
the law.
