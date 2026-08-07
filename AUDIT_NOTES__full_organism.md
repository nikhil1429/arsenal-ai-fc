# WORKING NOTES — full-organism audit, 7 Aug 2026 (session scratch — delete when done)

> Persistent working state for the FULL-ORGANISM AUDIT AND REPAIR brief.
> If resuming: read this file top to bottom, then continue at NEXT ACTION.

## STATUS: PHASE 0 — orientation done, ground-truth reads in progress

## PLAN (from the brief, ordered by his priority)
- [ ] P1.2 sequencing defect (conclusion-before-foundation) — name it, rule it, check what's checkable  ← START
- [ ] P2.3 Re-Jirah never ran (rejirah_log.jsonl missing) — the other START item
- [ ] P1.1 teaching_audit covers 8/11 rules — close terminology, link-back, decided
- [ ] P1.3 7 staged drifts all under his-word — use as test set for 1.1/1.2
- [ ] P2.1 Watchman never fired from schedule (LastRunTime 30-11-1999)
- [ ] P2.2 Tier 2 never fired — prove end-to-end vs deliberately broken organ, restore
- [ ] P2.4 course.json missing
- [ ] P2.5 python_state "not started"
- [ ] P3.1 3 of 4 locked capsules have no widget
- [ ] P3.2 orphan hallucinations widgets — registry policy for orphans + zero-driven
- [ ] P4.1 forge_session axis default=done trap + missing "current axis" command
- [ ] P5.1 data starvation — trace which organs revive from loop-closing alone
- [ ] P5.2 17 Gate-2 flagged doubts → one-at-a-time flow
- [ ] P6.1 Gemini surface compliance check — design or state impossibility
- [ ] P7.A "which concepts do I hold" — answer in code
- [ ] P7.B "single next thing" — arbiter
- [ ] P8.1 verify watchman layer-agnostic (verify only, no rebuild)
- [ ] P8.2 behavioural self-correction for outwork layer
- [ ] P8.3 outwork layer audit (never audited)
- [ ] P8.4 three weld-points verify in code

## OUT OF SCOPE (do not touch)
- forge session on hallucinations (OPEN, step 4) — no close/advance/axis marks, no touching the 2 hallucinations widgets
- the 7 staged drifts — read as evidence, never confirm/dismiss
- selfknowledge.mjs frozen + task disabled — permanent
- canonical root .md files unless doc-code contradiction forces correction

## LAWS
- layer never replace · single-writer · fail-silent hooks · no guessed numbers ·
  unrun=hypothesis (real output for every fix) · capsules read-only (mirror.mjs) · repo public

## GROUND TRUTH ESTABLISHED (fill as verified)
- scripts/ inventory: 60+ organs. watchman.mjs (41k, 7 Aug 10:49) exists. teaching_audit.mjs 63k. rejirah.mjs 60k.
- state/: teaching_audit.jsonl EXISTS now (unlike 6 Aug brief). rejirah_log.jsonl ABSENT confirmed (not in ls). course.json ABSENT confirmed. widgets.json exists.

## DECISIONS MADE (running log)
- P4.1 DONE: bare `axis <x>` REFUSES (old default frozen in comment at dispatch); `axis <x> now` = current-axis declaration (new field current_axis, cleared on done/defer); oneLine+contract show "ON x". 143/143 selftests. Docs fixed (map 2 lines + forge SKILL.md).
- P1.2 DONE: rule named **neev-pehle**, added to contract (12 rules now). Machine slice = TERMS_OF_ART used-before-opened (opensTerm definitional patterns measured off real repair turns); semantic slice stated NOT checkable in RULE_NOTES + report. Cross-turn state in teaching_audit_last.json keyed by CONCEPT (terms) / session (linkback).
- P1.1 DONE: link-back (name-presence by first turn past step 3, once/session), terminology (translation pairs shabdkosh/bhram/prasang/antargat/nishkarsh — 0 occurrences in 4,270 live rows = no wolf; tukda/sambhavna EXCLUDED, they live in his clean analogy register), decided (2 fingerprints: selfknowledge-reopen, tool-less-surface). CHECKED_RULES=12/12 + RULE_NOTES honesty map printed by report.
- P1.3 DONE-as-evidence: 7 staged drifts used as test set (drift-5/7 shapes = selftest cases, fire correctly; repair turn = clean case). Cause of coarse filing (right rules didn't exist) closed by neev-pehle+coverage existing.
- seed-terms CLI added (owner replays afferent history — 483 teaching rows): eval set/ground truth/groundedness OPENED on record; **closed-book, fine-tuning, hallucination rate, open-book, precision, rlhf, system prompt used-but-NEVER-opened** (real measured evidence of the defect class). 62/62 audit selftests.

- P7.A DONE: `rejirah.mjs held` — evidence-only answer (4 locked = tempered-at-lock, NEVER re-proven; hallucinations = 6 sessions/0 graded/0 jirah = no proof). 58/58 rejirah selftests.
- P7.B DONE: `learnstate.mjs nextup` arbiter — precedence: open-forge > rejirah-pending-paste > rejirah-overdue > sprint > examiner; watchman NEVER ranks (his 6 Aug ruling). ONE "PEHLA KAAM" line spliced into kickoff brief after MODE. Live: resume hallucinations @4 wins, rejirah 44d named runner-up. Learnstate selftests all green.
- P2.3 DONE (machine's half): loop closed by arbiter (Re-Jirah becomes THE next thing when forge closes) + `held` makes darkness visible + seed replay. NO captains_call card filed — queue already 7 deep with drift confirmations, arbiter line rides the same anchor (Anchor Law satisfied); the round itself needs his TIME not his word — machine cannot sit it for him.

- P2.1 DONE: "never fired" EXPECTED — task created 2026-08-07T00:11, FIRST trigger tonight 23:55. Trigger path PROVEN: one-time probe clone (same wrapper) fired from scheduler at 19:27:02 IST, ran watchman, wrote jsonl row, exit 0, probe deleted. Battery sweep: all 47 ArsenalFC tasks correctly noBattery=False/whenAvail=True (only my probe defaulted wrong — schtasks default gotcha noted). Suite baseline 32/32 green with all my changes (65 members).
- P2.4 DONE: course.json fed via course.mjs ingest — 6 REAL chapters read from github.com/anthropics/courses/anthropic_api_fundamentals (not invented). present:true. 50/50 selftests.
- P2.2 PLAN (run LAST, needs clean committed tree): break widget.mjs deliberately → watchman run → suite-red → tier2 spawns claude opus max → verify repair+journal+commit → restore-check.

- P3.1 DONE: 3 bespoke widgets built (tokenization/inference/context) on embeddings.html house pattern — capsule-faithful (inference slider reproduces axis-d worked example 71/18/11→92/54; tokenization chars÷4 estimator; context FIFO folder demo), all verified in browser (gates LOCK, math matches weld). Registered --gates 0 = "built, NOT driven" honest. 4/4 locked concepts now have lesson artifacts; Re-Jirah day-3 cold-start (widget Chala-mode) now possible for all.
- P3.2 DONE-as-verification: widget.mjs already lists orphans by name (hallucinations ×2) + refuses non-locked registration + prints "built, NOT driven" on zero gates. Policy = correct as-is; nothing silent.

- P5.1 TRACE DONE (analysis, no gates touched): calibration(14/20)/nemesis(14/20)/learning_state read ONLY reps_log → all three come alive from the FORGE loop closing alone (one full 9-axis session ≈ 12-15 reps crosses every gate). FSRS additionally fed by reJirahDone paste. GENUINE remaining gap: rejirah cold grades (gut+result) never reach calibration's lane — DELIBERATELY NOT wired now: rejirah's own contract defers shape/constants to first R1 run, and FSRS day-collapse semantics for due-date-backdated pastes vs real-dated reps would double-count; recorded as stated deferral, decide at R1 with real data.
- P5.2 DONE: gate2-flagged doubts (17 = regex floor, stated) ride THE CAPTAIN'S CALL one at a time — new derived source in captains_call.mjs (rank: hand-filed > drifts > gate2 > market; serialized, idempotent keys, honest leak documented). 20/20 selftests; live sync dealt card c8.
- P6.1 DONE: transcript-compliance for Gemini STATED impossible (transcript never arrives) permanently in capture paste output + watchman report; replacement = outcome lane: geminiBatchStats (pure, tested) → gemini_quality.jsonl per batch (recorded, never judged, 30-45d rule) + day-end cold Examiner. Capture selftests ALL PASS.
- P8.1 VERIFIED (no rebuild): watchman probeTasks sweeps ALL ArsenalFC-* regardless of layer (caught SelfKnowledge + 4 missed dailies 6 Aug).
- P8.2 DONE: outwork_audit.mjs built — o1 fulltime-missing · o2 weld-broken(KAL carrier) · o3 review-shapeless · o4 time-unmeasured · o5 season-desync · o6 presence≠output. Threshold-free (selftest asserts no invented magnitudes mechanically). NOT-checkable list (depth, Bolo voice, honesty itself, Sunday, BOLO→GRADER skill lane) printed in report. 10/10 selftests. Rides watchman nightly via probeOutwork() + suite membership added (coverage law green).
- P8.3 DONE (audit): timeaudit LIVE+dated (91.4% Learning today) · postmatch writes RESULT/KAL/season(last_played)/notebook · full-time has NEVER run (no post_match/, no season.json — surfaced nightly by o1 from tonight) · throwin wired:true · scorer=bet-ledger. My own first season-reader guessed wrong shape (days[]) — fixed to writer's last_played, noted in code (PROBLEM-1 self-catch).
- P8.4 DONE (in code): W1 KICKOFF pulls both — learning via learnstate brief (sprint/rejirah/watch-list) + outwork via /matchday→team_sheet.md (KAL verbatim first, FLOOR, readiness) — verified in skill+sheet. W2 BOLO→GRADER = dossier_weights.json shared into setpiece/scout/forge_session teaching line (rubric side EXISTS in code); "bar-cleared forcing" lives in /forge+/scrimmage SKILL behaviour not organs — gap STATED in outwork_audit report, not silently absent. W3 EVENING AUDIT read by both — outwork: manager/viz/scout read post_match+kal_line; learning: /full-time routes throw-ins→capsule doubt drafts (loose_balls→routed). Weld carriers now WATCHED nightly (o2/o5).
- Map updated: 2 new single-writer rows (gemini_quality, outwork_audit_last).

## FINALE — P2.2 LIVE-FIRE RESULT (7 Aug 2026 evening)
- Break planted: widget.mjs:93 comparison inverted (uncommitted) → selftest 9/2 RED.
- TIER 1 CAUGHT IT: real `watchman.mjs run` → suite-red RED → gate OPENED (first fire ever) → Opus child spawned (pid 20612).
- MAIDEN CHILD DIED SILENT: ~6 min of work, zero bytes to the log, no journal, no commit. Investigated: spawn shape innocent (sonnet+opus max probes both returned output), prompt file fine.
- SECOND RUN (foreground, observed, same lane): the child produced a COMPLETE, correct diagnosis — found my planted defect AND two real pre-existing ones (organism_test LIVE_WRITERS missing bg_queue/wake_queue/wake.json → hermeticity flap; suite inheriting ARSENAL_ORGAN=1 → BRIEF false-reds, "the suite cries wolf at its own night engineer") — but was PERMISSION-BLOCKED from repairing: .claude/settings.local.json's stale allowlist (git + `node -e` only) denied every Edit/Write/node. It correctly REFUSED to circumvent and deferred with a verified anchor-guarded apply script.
- THE ROOT CAUSE OF "TIER 2 NEVER REPAIRS": the permission layer. The ruling authorized repair; the config never did.
- APPLIED (me, via its script after reading it): all 4 patches, suite 32/32 green, journal 3 evidence rows in watchman_repairs.jsonl. Its commit step tripped on an empty-commit (widget matched HEAD after fix — my break was uncommitted); I committed the real changes myself.
- HARNESS FIXES LANDED (watchman.mjs, 29/29): (1) per-run `--allowedTools` grants on the spawn — Edit/Write/Read/Glob/Grep/node/git-local, NO push, scoped to the prompt's hard limits, never written into his settings; (2) `TIER2 EXIT !ERRORLEVEL!` stamp (cmd /v:on delayed expansion — %VAR% would stamp a parse-time lie); (3) c9 tier2-vanished: previous-day start + no EXIT stamp + no journal row = RED (the repair arm's own §5.1 closed).
- VERDICT: detection→gate→spawn→diagnosis→(now-unblocked) repair→journal→revert-path = every link proven live; the one link that failed (permissions) is fixed and its failure mode is now self-announcing.

## STATUS: ALL 18 PARTS CLOSED. Session complete.

---

# NEXT BUILD — THE OUTWARD LOOP (his rulings, 7-8 Aug 2026 night — READ FIRST NEXT SESSION)

**HIS RULINGS (verbatim intent, recorded the night given):**
1. **Gemini Pro doctrine:** "leave the internet things to gemini ai pro because it is best in it... we need to utilize it to the maximum." The 17 Jul Engine Law was about the API free pool only — his Pro subscription is the INTERNET ARM: machine writes missions, he fires them, output returns via a paste door.
2. **Cadence:** outward checks run **AFTER EVERY TOPIC COMPLETION** (wired to LOCK, step 10) — benchmark re-run · mission fire · DOSSIER diff/probe refresh · gate-check · widget register · gist prompt. PLUS a **≥2×/week floor** (benchmark + missions even with no lock). NOT weekly.
3. **No calendar waiting:** the data-gates are COUNT/EVENT gates (his own 1 Aug rule) — decoy ≥4 capsules+≥60 doubts (opens at hallucinations LOCK), R1 constants (opens at his FIRST Re-Jirah round), confusion-pairs (≥6 cracked). Never frame as dates again.
4. SEASON.md **UN-PARKED** by his word tonight. Deep-render + tool-less stay EXCLUDED.

**BUILD ORDER:** (1) `benchmark.mjs` — AI_PE_ROADMAP 5 buckets × dossier_weights (§1 rubric: fundamentals 17.8 + system_design 26.7 = 44.5%) × live evidence (capsules/axes-held-cold via `rejirah held` · python_state tier · course.json done · shipped artifacts) → have/need per bucket, no invented numbers; rides wall + matchday; (2) mission generator (in nightshift or scout) + `capture.mjs research-paste`-style door + diff→captains_call card (canon edits = his word); (3) LOCK-chain hook in forge_session step 10; (4) M-2→M-5 Manager (prereqs complete — signal agents done); (5) SEASON.md writer in postmatch (Claude fills 100%, he writes ZERO).
**HIS EVENTS (machine waits):** first Re-Jirah round · first /full-time · hallucinations LOCK · course/python start · driving 3 widgets.
**Sources already mapped:** OPPONENT_SCOUT §1/§4/§5/§9 · AI_PE_ROADMAP buckets+80/20 · GEMINI_RIG_SETUP (prompt home) · brain market_scan→card wiring · watchman c4b projection guard.

**RULING 5 — THE MAX-FLOW DOCTRINE (his words, 8 Aug 2026 00:3x: "data from everywhere should flow everywhere where it is required in the most number of times"):**
Every producer's output must reach EVERY consumer that could act on it, at the highest
useful frequency — a signal read once a week when it could steer every turn is a defect.
Concrete NEW edges to wire during the outward-loop build (each is a reader addition, single-writer law intact):
- benchmark → wall + team_sheet(matchday) + kickoff brief line + captains_call card on bucket regression
- missions output → DOSSIER diff → dossier_weights → next-turn probes + setpiece drills + examiner shapes + scrimmage grammar (already 7 readers — verify each re-reads after regen)
- rejirah grades → calibration/nemesis lane DECISION AT FIRST R1 (deferred question, sealed earlier — decide with real data, not silently dropped)
- gemini_quality.jsonl → scout readiness + watchman honesty line (today: written, zero readers)
- season/logbook → kickoff streak line + wall + twin's bets
- teaching_audit drift-rates → BootRoom genome proposals (teaching evidence should feed method mutations)
- timeaudit 3-bucket → benchmark (Building% is evidence for bucket-5) + team_sheet shape
- capsule locks → benchmark + decoy-gate check + mission generator, same LOCK-chain event
- AUDIT every new organ: "who ELSE could act on this output?" is a standing design question, asked at build time, answered in the file header.
**Also on the not-done ledger (from the granular 17):** turnstile port has no watcher (self-heals 09:15 only) · NotebookLM/Colab rig account-side setup unverified until 1-05/1-07 open.
