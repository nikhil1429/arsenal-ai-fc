# unit mdet · PROOF — the coverage detector stops reading comments

Forks row 1151 (3) F3 B. Branch `claude/mdet-build`, cut 20 Nov 2026 from main `cebe3ebe4024c2144b934b3032b3fb837285d926`
(`git fetch origin main` · `git rev-parse FETCH_HEAD`; units mlaw and mcov are on it). `ci/mdet/BASE` names that sha.

## 1 · What is measured at the cut (20 Nov 2026)

The detector at base: `scripts/organism_test.mjs:306` (`hasSelftest`, `git show cebe3eb:scripts/organism_test.mjs | grep -n "hasSelftest = "`):
`` /['"`]selftest['"`]/.test(src) || /function selftest\(/.test(src) `` over the RAW bytes — a comment, a usage string or a word in any
string literal counts. Its two consumers: `coverage()` (the law: every script that has a selftest sits in exactly one suite) and
`hermetic()`'s selftest loop (the trip metric's targets).

**The new detector** (`selftestForm`, built in step 2) lexes the source — comments blanked, every string / template / regex body
blanked — and accepts exactly two forms:
- **dispatch** · a whole literal `selftest` that is an operand of `===` `==` `!==` `!=` or a `case` label (the mode the script branches on);
- **self-run** · a CALL of its own `selftest()` in code — not its declaration, not `x.selftest()`, not a method definition. A script run
  bare IS its selftest (claudegen: `package.json:_selftest_coverage_law` names that class). Without this form claudegen would MOVE
  has → none and leave the coverage law: the gate would loosen. See FORK F1.

## 2 · THE CENSUS (20 Nov 2026, before any edit of the detector)

Command: `node scripts/organism_test.mjs census` on the build tree (a READ mode outside `all`). Columns: the legacy reading and the
line of the word that made it say has; the new reading, its form and the line of its dispatch / self-run call; MOVES.
Every scripts/*.mjs except organism_test.mjs itself (the detector's own `scripts()` excludes it, at base as on the build).

**What moves: nothing at this cut.** No script moves has → none, none moves none → has. The one script the legacy reading fooled
(study_scope, mcov F3) gained a real verb in unit mcov, so it now reads has by a dispatch. The one script the dispatch-only rule
WOULD have moved is claudegen (the legacy reading says has from its declaration `scripts/claudegen.mjs:579`; the new one from its bare
self-run call `:1006`) — held by the self-run form. The witness plants each class both ways (§3).

<!-- census:begin -->
| script | legacy | legacy at | detector | form | at | moves |
|---|---|---|---|---|---|---|
| acts.mjs | has | 67 | has | dispatch | 67 | — |
| archive_audit.mjs | has | 819 | has | dispatch | 819 | — |
| archivist.mjs | has | 2689 | has | dispatch | 3485 | — |
| audit.mjs | has | 971 | has | dispatch | 1265 | — |
| audit_preload.mjs | none | — | none | — | — | — |
| awayday.mjs | has | 1231 | has | dispatch | 1231 | — |
| benchmark.mjs | has | 1257 | has | dispatch | 1257 | — |
| blackbox.mjs | has | 103 | has | dispatch | 300 | — |
| bootroom.mjs | has | 792 | has | dispatch | 792 | — |
| brain.mjs | has | 5431 | has | dispatch | 7104 | — |
| calibration.mjs | has | 1123 | has | dispatch | 1123 | — |
| capsule_bridge.mjs | has | 860 | has | dispatch | 860 | — |
| captain.mjs | has | 97 | has | dispatch | 97 | — |
| captains_call.mjs | has | 1738 | has | dispatch | 1738 | — |
| capture.mjs | has | 2620 | has | dispatch | 2620 | — |
| ci_verdict.mjs | has | 308 | has | dispatch | 308 | — |
| claims.mjs | has | 274 | has | dispatch | 274 | — |
| claudegen.mjs | has | 579 | has | self-run | 1006 | — |
| conductor.mjs | has | 1748 | has | dispatch | 1748 | — |
| context.mjs | has | 1000 | has | dispatch | 1270 | — |
| context_manifest.mjs | has | 1484 | has | dispatch | 1484 | — |
| cortex.mjs | has | 2173 | has | dispatch | 2173 | — |
| council.mjs | has | 484 | has | dispatch | 484 | — |
| course.mjs | has | 904 | has | dispatch | 904 | — |
| daemon_watchdog.mjs | has | 1060 | has | dispatch | 1060 | — |
| daily_green.mjs | has | 753 | has | dispatch | 753 | — |
| day.mjs | none | — | none | — | — | — |
| daykey.mjs | has | 353 | has | dispatch | 353 | — |
| deck_lint.mjs | has | 153 | has | dispatch | 153 | — |
| deep.mjs | has | 796 | has | dispatch | 796 | — |
| distiller.mjs | has | 1183 | has | dispatch | 1183 | — |
| dmn.mjs | has | 1019 | has | dispatch | 1570 | — |
| done.mjs | has | 287 | has | dispatch | 287 | — |
| doubtminer.mjs | has | 917 | has | dispatch | 1346 | — |
| dugout.mjs | has | 6496 | has | dispatch | 6496 | — |
| examiner.mjs | has | 508 | has | dispatch | 785 | — |
| exchanges.mjs | has | 302 | has | dispatch | 302 | — |
| flow_atlas.mjs | has | 418 | has | dispatch | 418 | — |
| forge_session.mjs | has | 3169 | has | dispatch | 3169 | — |
| freeze.mjs | has | 212 | has | dispatch | 212 | — |
| fsrs.mjs | has | 1113 | has | dispatch | 1113 | — |
| fuelboard.mjs | has | 623 | has | dispatch | 651 | — |
| gaffer_brain.mjs | has | 2787 | has | dispatch | 2787 | — |
| gaffer_state.mjs | has | 632 | has | dispatch | 632 | — |
| gate.mjs | has | 977 | has | dispatch | 978 | — |
| gate_tune.mjs | has | 202 | has | dispatch | 202 | — |
| gates.mjs | has | 483 | has | dispatch | 483 | — |
| groundsman.mjs | has | 676 | has | dispatch | 676 | — |
| harness_text.mjs | has | 60 | has | dispatch | 60 | — |
| harvest.mjs | has | 351 | has | dispatch | 351 | — |
| heartbeat.mjs | has | 457 | has | dispatch | 457 | — |
| herd.mjs | has | 392 | has | dispatch | 393 | — |
| hippocampus.mjs | has | 564 | has | dispatch | 1758 | — |
| home_pin.mjs | has | 97 | has | dispatch | 166 | — |
| intent.mjs | has | 360 | has | dispatch | 360 | — |
| keeper.mjs | has | 326 | has | dispatch | 326 | — |
| land.mjs | none | — | none | — | — | — |
| lawpack.mjs | has | 937 | has | dispatch | 937 | — |
| learn_digest.mjs | has | 220 | has | dispatch | 220 | — |
| learning_state.mjs | has | 1011 | has | dispatch | 1011 | — |
| learnstate.mjs | has | 2178 | has | dispatch | 2178 | — |
| learnstate_hook.mjs | none | — | none | — | — | — |
| limits.mjs | has | 1214 | has | dispatch | 1214 | — |
| manager.mjs | has | 1724 | has | dispatch | 1724 | — |
| mcp-memory.mjs | has | 621 | has | dispatch | 621 | — |
| mirror.mjs | has | 332 | has | dispatch | 332 | — |
| models.mjs | has | 435 | has | dispatch | 435 | — |
| mutagen.mjs | has | 156 | has | dispatch | 997 | — |
| nemesis.mjs | has | 643 | has | dispatch | 643 | — |
| night.mjs | has | 266 | has | dispatch | 266 | — |
| nightshift.mjs | has | 1994 | has | dispatch | 1994 | — |
| nikhil_model.mjs | has | 519 | has | dispatch | 519 | — |
| notes_compiler.mjs | has | 1012 | has | dispatch | 1012 | — |
| notes_corrections.mjs | has | 202 | has | dispatch | 202 | — |
| oura_auth.mjs | has | 248 | has | dispatch | 248 | — |
| oura_coach.mjs | has | 1090 | has | dispatch | 1090 | — |
| outbox.mjs | has | 599 | has | dispatch | 599 | — |
| outwork_audit.mjs | has | 438 | has | dispatch | 438 | — |
| physio.mjs | has | 1719 | has | dispatch | 1719 | — |
| postmatch.mjs | has | 1370 | has | dispatch | 1370 | — |
| presence.mjs | has | 1064 | has | dispatch | 1064 | — |
| probe.mjs | has | 2284 | has | dispatch | 2284 | — |
| pulse.mjs | has | 376 | has | dispatch | 376 | — |
| python_state.mjs | has | 479 | has | dispatch | 479 | — |
| rails.mjs | has | 645 | has | dispatch | 973 | — |
| reconcile.mjs | has | 823 | has | dispatch | 823 | — |
| register.mjs | has | 160 | has | dispatch | 161 | — |
| registry.mjs | has | 67 | has | dispatch | 67 | — |
| rejirah.mjs | has | 1242 | has | dispatch | 1242 | — |
| repo_bundle.mjs | none | — | none | — | — | — |
| resume_pointer.mjs | has | 287 | has | dispatch | 322 | — |
| rung_receipt.mjs | has | 273 | has | dispatch | 273 | — |
| samjhao.mjs | has | 99 | has | dispatch | 99 | — |
| sandbox.mjs | has | 339 | has | dispatch | 386 | — |
| scoreboard.mjs | has | 626 | has | dispatch | 626 | — |
| scorer.mjs | has | 598 | has | dispatch | 602 | — |
| scout.mjs | has | 1256 | has | dispatch | 1256 | — |
| selfknowledge.mjs | has | 521 | has | dispatch | 521 | — |
| services.mjs | has | 29 | has | dispatch | 1163 | — |
| session_meter.mjs | has | 814 | has | dispatch | 814 | — |
| setpiece.mjs | has | 1527 | has | dispatch | 1527 | — |
| shadow.mjs | has | 509 | has | dispatch | 509 | — |
| shipped.mjs | has | 356 | has | dispatch | 356 | — |
| sitting.mjs | has | 1525 | has | dispatch | 1525 | — |
| speak.mjs | has | 145 | has | dispatch | 145 | — |
| spool.mjs | has | 267 | has | dispatch | 267 | — |
| sprintsync.mjs | has | 338 | has | dispatch | 338 | — |
| state.mjs | has | 456 | has | dispatch | 456 | — |
| study_rail_replay.mjs | has | 411 | has | dispatch | 411 | — |
| study_scope.mjs | has | 42 | has | dispatch | 748 | — |
| swallow.mjs | has | 68 | has | dispatch | 91 | — |
| talk.mjs | has | 239 | has | dispatch | 239 | — |
| tasks.mjs | has | 428 | has | dispatch | 428 | — |
| teaching_audit.mjs | has | 2529 | has | dispatch | 2861 | — |
| teaching_bar.mjs | none | — | none | — | — | — |
| teaching_contract.mjs | has | 1474 | has | dispatch | 1971 | — |
| teaching_gate.mjs | has | 1344 | has | dispatch | 1344 | — |
| teaching_terms.mjs | none | — | none | — | — | — |
| test_coach_v2.mjs | none | — | none | — | — | — |
| thalamus.mjs | has | 1238 | has | dispatch | 1238 | — |
| throwin.mjs | has | 594 | has | dispatch | 594 | — |
| timeaudit.mjs | has | 37 | has | dispatch | 353 | — |
| tokenizer_play.mjs | has | 143 | has | dispatch | 143 | — |
| tone.mjs | has | 193 | has | dispatch | 193 | — |
| touchline.mjs | has | 542 | has | dispatch | 542 | — |
| treasury.mjs | has | 294 | has | dispatch | 296 | — |
| turn_hook.mjs | has | 676 | has | dispatch | 766 | — |
| turnstile.mjs | has | 247 | has | dispatch | 247 | — |
| twin.mjs | has | 607 | has | dispatch | 607 | — |
| unleash_verdict.mjs | has | 150 | has | dispatch | 150 | — |
| usage_tap.mjs | has | 311 | has | dispatch | 311 | — |
| validators.mjs | has | 218 | has | dispatch | 218 | — |
| viz.mjs | has | 1554 | has | dispatch | 1554 | — |
| watchman.mjs | has | 3287 | has | dispatch | 3287 | — |
| watchman_brief.mjs | none | — | none | — | — | — |
| widget.mjs | has | 277 | has | dispatch | 277 | — |
| xray.mjs | has | 213 | has | dispatch | 1407 | — |
<!-- census:end -->
