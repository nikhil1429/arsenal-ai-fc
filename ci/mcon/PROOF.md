# UNIT mcon · PROOF (forks rows 1132 (3) / 1133 (3); unit mtxt3's fork F4)

Branch `claude/mcon-build`, cut from origin/main when the seat started.

## BASE
- `ci/mcon/BASE`: `3f84c80bdf37432587bb11d4faf82d5eed7d5f5d` (main = unit mtxt3's land, 3f84c80).
- Every measurement below ran on LF clones under /tmp (`git clone -c core.autocrlf=false`): base at 3f84c80, build at 11d787b (the last code tip; this file adds only the proof). Each clone had `npm ci` (19 Nov 2026).

## MEASURED BEFORE WRITING (base 3f84c80, file:line)
- `scripts/conductor.mjs:1597-1601`: the S9 (6) assert sliced from `src.indexOf('if (mode === "fallback")')`. The FIRST hit of that string is the assert's own string literal at `:1598`, and the slice ran to the real `if (mode === "plan")` in main (`:1741`). So the slice held the assert's own `/NOTHING WAS RUN/` at `:1601`, and the pin satisfied itself. The census below names the same hit mechanically: `subject scripts/conductor.mjs:1598-1740`.
- The real fallback branch is `scripts/conductor.mjs:1711-1734`. Its last line prints `conductor: NOTHING WAS RUN — …` at `:1732`.
- `STATE_DIR` is REPO-relative (`:50-51`), so a child run on a copy reads and writes only the copy. `STEP_TIMEOUT_MS` (`:165`) is the file's own bound for one organ; the child's wait reuses it, so no number is typed.
- conductor's import graph needs the tracked `registry.json` at import time (`scripts/gate.mjs:146` throws on an empty registry). The copy carries that one file and nothing else from the state dir.

## THE BUILD — scripts/conductor.mjs, that one selftest assert only
The S9 (6) block now runs `node --import <guard> <copy>/scripts/conductor.mjs fallback` on a copy of `scripts/` under os.tmpdir(). The copy's state dir is empty apart from the registry, and the day-key env is stripped. The preloaded guard replaces every `node:child_process` door (spawn, spawnSync, exec, execSync, execFile, execFileSync, fork, synced into the ESM bindings) with one that RECORDS the call and THROWS, so nothing ever runs. The assert passes only when all of these hold:
- the child exits 0;
- its first line is the fold line (`conductor fallback: …`);
- one line starts `conductor: NOTHING WAS RUN`;
- the guard recorded zero calls;
- the copy's state dir is unchanged.

When it fails it prints one `↳` line naming the exit code, the spawns, the state and the first stderr line.

## CONDUCTOR SELFTEST, BEFORE AND AFTER (headline line)
- base 3f84c80: `ALL CHECKS PASSED (111 passed, 0 failed)` (19 Nov 2026)
- build: `ALL CHECKS PASSED (111 passed, 0 failed)` (19 Nov 2026)
- Member line: the suite judges a member by its exit code (`SUITE MEMBER · conductor selftest exits 0`). conductor is a LIVE member, so the hermetic profile names it and does not run it, on both base and build (`LIVE selftest conductor — not run in the hermetic profile`, 19 Nov 2026). On the neutral machine, `npm test`'s `organism:selftest` chain runs it.

## WITNESS (`node ci/mcon/witness_mcon.mjs --org <tree> --base-org <base clone>`)
- build: `GREEN MCON the conductor S9 fallback assert reads a child run's real output (three fallback mutants RED it), the census of own-literal pins derived by code, only that one assert edited · 8 clause(s)` (exit 0)
- base: `RED MCON · F1, F2, F3, F4, C1, ONE, BOUND` (exit 1)
- It plants three fallback mutants:
  - F1: a `spawnSync` whose error is swallowed, so the exit code alone cannot see it.
  - F2: the fallback line without NOTHING WAS RUN. This is unit mtxt3's T2 mutant, which left the base GREEN.
  - F3: one file written to the state dir.
- The old assert misses all three (GREEN on the base); the repaired one catches all three (RED on the build).
- First run note: the first build run read `RED MCON · BOUND`, naming `scripts/tone.log`. That file was left in the build clone by the hermetic suite run (a gitignored log). It was removed from the clone, and the run above is on the clean clone.

## MUTANTS (`node ci/mcon/run_mutants_mcon.mjs --repo . --base 3f84c80 --modules <LF clone of 3f84c80 with npm ci>`)
- `run_mutants: 8 of 8 mutant(s) RED by the clause that names them · control GREEN`
- control BASE reads `RED MCON · F1, F2, F3, F4, C1, ONE, BOUND`; control BUILD reads GREEN.
- One mutant per clause:
  - F1 drops the spawn-record conjunct.
  - F2 puts the self-satisfying source pin back.
  - F3 drops the state-dir conjunct.
  - F4 makes the assert impossible to pass.
  - C1 adds an own-literal pin to the conductor selftest.
  - ONE edits a comment outside the block.
  - BOUND edits scripts/state.mjs.
  - LAST plants an orphan process.

## THE SPEC QUESTION — the census (`node ci/mcon/census_mcon.mjs --org <tree>`)
The shape is defined in code by `selfSatisfied()` and `range()` in `ci/mcon/census_mcon.mjs`. A hit is a positive `.test` / `.includes` / `.match` / `.exec` pin that meets two conditions:
- its subject is the file's own source, or a slice of it anchored on string literals and evaluated on the real text;
- that subject's range covers the pin's own literal, and the pin matches inside that literal's text.

Such a pin reads true whatever the code under test says. The counts below are the command's own last lines, pasted as printed:
- base 3f84c80: `CENSUS MCON · 39 own-literal pin(s) in 28 assert(s) · 1 own-assert · 78 unresolved · 144 file(s) walked`
- build: `CENSUS MCON · 38 own-literal pin(s) in 27 assert(s) · 1 own-assert · 78 unresolved · 147 file(s) walked`
- The two lists differ only by the conductor hit (line numbers dropped). Witness clause C1 checks this as a multiset compare.
- A hit is a PIN. One assert may hold several; the "in N assert(s)" figure counts distinct enclosing asserts. A self-satisfied pin cannot fail, but the assert holding it may still have other, honest conjuncts. The list says where the dead pins are, not that each assert is wholly dead.
- Every hit is listed here and none is edited (base 3f84c80, the command's text output):

```
== OWN LITERAL (counted)
  scripts/audit.mjs:1155  /ttl_days/  in assert(…) @ scripts/audit.mjs:1155  subject scripts/audit.mjs:1-1284
  scripts/audit.mjs:1155  /default_if_silent/  in assert(…) @ scripts/audit.mjs:1155  subject scripts/audit.mjs:1-1284
  scripts/audit.mjs:1156  /NO RED ASSERTION, NO AUTO-FIX/  in assert(…) @ scripts/audit.mjs:1156  subject scripts/audit.mjs:1-1284
  scripts/audit.mjs:1186  /"tag", "-f"/  in assert(…) @ scripts/audit.mjs:1186  subject scripts/audit.mjs:1-1284
  scripts/audit.mjs:1188  /--check/  in assert(…) @ scripts/audit.mjs:1187  subject scripts/audit.mjs:1-1284
  scripts/audit.mjs:1188  /organ's OWN selftest went red/  in assert(…) @ scripts/audit.mjs:1187  subject scripts/audit.mjs:1-1284
  scripts/audit.mjs:1188  /3-commit checkpoint/  in assert(…) @ scripts/audit.mjs:1187  subject scripts/audit.mjs:1-1284
  scripts/audit.mjs:1190  /reset", "--hard", "HEAD~1"/  in assert(…) @ scripts/audit.mjs:1189  subject scripts/audit.mjs:1-1284
  scripts/audit.mjs:1190  /downgraded to a RULING/  in assert(…) @ scripts/audit.mjs:1189  subject scripts/audit.mjs:1-1284
  scripts/awayday.mjs:890  /const TAIL_BUDGET = 650;/  in assert(…) @ scripts/awayday.mjs:888  subject scripts/awayday.mjs:1-1295
  scripts/awayday.mjs:924  /NOT RUN/  in assert(…) @ scripts/awayday.mjs:921  subject scripts/awayday.mjs:821-1295
  scripts/awayday.mjs:954  "captains_call.mjs"  in assert(…) @ scripts/awayday.mjs:952  subject scripts/awayday.mjs:1-1295
  scripts/awayday.mjs:954  '"file", "--line"'  in assert(…) @ scripts/awayday.mjs:952  subject scripts/awayday.mjs:1-1295
  scripts/awayday.mjs:964  /"--open", u/  in assert(…) @ scripts/awayday.mjs:958  subject scripts/awayday.mjs:1-1295
  scripts/capture.mjs:2269  /mode === "quarantine"/  in assert(…) @ scripts/capture.mjs:2267  subject scripts/capture.mjs:1-2972
  scripts/capture.mjs:2337  /quarantine_error: quarantineError/  in assert(…) @ scripts/capture.mjs:2332  subject scripts/capture.mjs:1-2972
  scripts/conductor.mjs:1601  /NOTHING WAS RUN/  in ok(…) @ scripts/conductor.mjs:1599  subject scripts/conductor.mjs:1598-1740
  scripts/dugout.mjs:3899  'req.url.startsWith("/rehydrate")'  in assert(…) @ scripts/dugout.mjs:3899  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:4112  /the card was NOT answered/  in assert(…) @ scripts/dugout.mjs:4111  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:4112  /never say it is done when it is not/  in assert(…) @ scripts/dugout.mjs:4111  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:4121  "THIS ONE IS NOT DONE YET"  in assert(…) @ scripts/dugout.mjs:4120  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:4121  "NEVER say it is handled"  in assert(…) @ scripts/dugout.mjs:4120  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:4121  "needs_reading"  in assert(…) @ scripts/dugout.mjs:4120  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:4237  "observeAndSaveTurn(body.lines"  in assert(…) @ scripts/dugout.mjs:4236  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:4241  'from "./gaffer_state.mjs"'  in assert(…) @ scripts/dugout.mjs:4240  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:4270  /detached: true, stdio: "ignore"/  in assert(…) @ scripts/dugout.mjs:4268  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:4526  "superviseTurn(r.state, r.standing, body.lines"  in assert(…) @ scripts/dugout.mjs:4525  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:4592  "SAME TTL deepFresh() already uses"  in assert(…) @ scripts/dugout.mjs:4591  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:4713  'req.url === "/recital"'  in assert(…) @ scripts/dugout.mjs:4712  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:5223  'req.url === "/sitting-turn"'  in assert(…) @ scripts/dugout.mjs:5223  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:5223  'req.url === "/spoken-relay"'  in assert(…) @ scripts/dugout.mjs:5223  subject scripts/dugout.mjs:1-6928
  scripts/dugout.mjs:5228  '[join(__dirname, "sitting.mjs"), "daemon"]'  in assert(…) @ scripts/dugout.mjs:5228  subject scripts/dugout.mjs:1-6928
  scripts/examiner.mjs:861  /carries NO serve receipt/  in assert(…) @ scripts/examiner.mjs:860  subject scripts/examiner.mjs:1-952
  scripts/forge_session.mjs:2587  "SOLE WRITER of dressing-room/state/forge_session.json. Nothing else writes it."  in assert(…) @ scripts/forge_session.mjs:2585  subject scripts/forge_session.mjs:1-3181
  scripts/gaffer_brain.mjs:3897  /const VERIFY_TIMEOUT_MS = 180000;/  in assert(…) @ scripts/gaffer_brain.mjs:3894  subject scripts/gaffer_brain.mjs:1-4041
  scripts/gates.mjs:473  /NOT MEASURED — not in this checkout/  in assert(…) @ scripts/gates.mjs:471  subject scripts/gates.mjs:1-522
  scripts/intent.mjs:307  /ARSENAL_ORGAN === "1"/  in assert(…) @ scripts/intent.mjs:307  subject scripts/intent.mjs:1-367
  scripts/intent.mjs:307  /__ARSENAL_HOOK_STDIN__/  in assert(…) @ scripts/intent.mjs:307  subject scripts/intent.mjs:1-367
  scripts/intent.mjs:307  /case "stop"/  in assert(…) @ scripts/intent.mjs:307  subject scripts/intent.mjs:1-367
== OWN ASSERT (listed, counted apart)
  scripts/thalamus.mjs:1927  /captainHoldFact\(/g  in assert(…) @ scripts/thalamus.mjs:1925  subject scripts/thalamus.mjs:1-3306
```

<details><summary>UNRESOLVED: a pin on a self-source subject whose range the census cannot evaluate (a derivation other than slice/indexOf). Named, not counted.</summary>

```
== UNRESOLVED (named, not counted)
  scripts/audit.mjs:1180  /watchman/i  in assert(…) @ scripts/audit.mjs:1179
  scripts/benchmark.mjs:1127  /console\.log\(`benchmark: /  in assert(…) @ scripts/benchmark.mjs:1126
  scripts/brain.mjs:5637  "daemon-worker"  in assert(…) @ scripts/brain.mjs:5636
  scripts/brain.mjs:6023  /absentEvidenceHistory\(/  in assert(…) @ scripts/brain.mjs:6022
  scripts/brain.mjs:6024  /LEDGER \+ "\.1"/  in assert(…) @ scripts/brain.mjs:6022
  scripts/brain.mjs:6024  /brain: inputs history —/  in assert(…) @ scripts/brain.mjs:6022
  scripts/brain.mjs:6054  /clippedEvidenceHistory\(/  in assert(…) @ scripts/brain.mjs:6053
  scripts/brain.mjs:6055  /brain: inputs elision —/  in assert(…) @ scripts/brain.mjs:6053
  scripts/brain.mjs:6060  /inputs_clipped: inputs_clipped \?\? null/  in assert(…) @ scripts/brain.mjs:6059
  scripts/brain.mjs:6061  /inputs_rows_dropped: inputs_rows_dropped \?\? null/  in assert(…) @ scripts/brain.mjs:6059
  scripts/capture.mjs:2535  /process\.exit\(1\)/  in assert(…) @ scripts/capture.mjs:2534
  scripts/capture.mjs:2537  /did NOT land/  in assert(…) @ scripts/capture.mjs:2536
  scripts/capture.mjs:2537  /NOT on disk/  in assert(…) @ scripts/capture.mjs:2536
  scripts/context.mjs:962  /const BOOT_MS = Date\.now\(\) - process\.uptime\(\) \* 1000;/  in assert(…) @ scripts/context.mjs:961
  scripts/context.mjs:963  /buildVerdict\(BOOT_MS, graphNow\(\)\)/  in assert(…) @ scripts/context.mjs:961
  scripts/context.mjs:965  /--daemon RETIRING/  in assert(…) @ scripts/context.mjs:961
  scripts/context.mjs:965  /\bbreak;/  in assert(…) @ scripts/context.mjs:961
  scripts/context.mjs:1042  /catch \(e\) \{[\s\S]*faultNote\(/  in assert(…) @ scripts/context.mjs:1041
  scripts/context.mjs:1043  /faults\+\+/  in assert(…) @ scripts/context.mjs:1041
  scripts/context.mjs:1043  /writeAtomic\(CONTEXT_STATE, withFault\(readJson\(CONTEXT_STATE\), note\)\)/  in assert(…) @ scripts/context.mjs:1041
  scripts/context.mjs:1044  /--daemon poll FAULTED/  in assert(…) @ scripts/context.mjs:1041
  scripts/context.mjs:1044  /--daemon recovered/  in assert(…) @ scripts/context.mjs:1041
  scripts/context.mjs:1068  /import \{ keep, KEEP_EXIT \} from "\.\/keeper\.mjs";/  in assert(…) @ scripts/context.mjs:1067
  scripts/context.mjs:1069  /await keep\(\{ name: "context", worker: \[process\.execPath, fileURLToPath\(import\.meta\.url\), "daemon-worker", \.\.\  in assert(…) @ scripts/context.mjs:1067
  scripts/context.mjs:1108  /export const STAMP_FRESH_MS = 3 \* CONTEXT_POLL_MS;/  in assert(…) @ scripts/context.mjs:1106
  scripts/context.mjs:1109  /export const CONTEXT_POLL_MS = DOOR\.pollMs \|\| FLOOR_MS;/  in assert(…) @ scripts/context.mjs:1106
  scripts/context.mjs:1149  /if \(posted\) \(deps\.save \|\| \(\(o\) => writeAtomic\(CONTEXT_STATE, withStamp\(o, stampOf\(readJson\(CONTEXT_STATE\)  in assert(…) @ scripts/context.mjs:1140
  scripts/context.mjs:1160  /const stamp = deps\.stamp !== undefined \? deps\.stamp : readStamp\(\);/  in assert(…) @ scripts/context.mjs:1156
  scripts/context.mjs:1161  /vbs\.includes\(RESIDENT_MATCH\)/  in assert(…) @ scripts/context.mjs:1156
  scripts/context.mjs:1177  /const STATE_DIR = DOOR\.stateDir \|\| join\(__dirname, "\.\.", "dressing-room", "state"\);/  in assert(…) @ scripts/context.mjs:1164
  scripts/cortex.mjs:1823  /consolidate/  in assert(…) @ scripts/cortex.mjs:1822
  scripts/dugout.mjs:4269  /wakeTheWatcher\(\);/  in assert(…) @ scripts/dugout.mjs:4268
  scripts/dugout.mjs:4273  /observeAndSaveTurn\(body\.lines, new Date\(\), judged\)/  in assert(…) @ scripts/dugout.mjs:4272
  scripts/dugout.mjs:4274  /superviseTurn\(r\.state, r\.standing, body\.lines, new Date\(\), judged && judged\.note\)/  in assert(…) @ scripts/dugout.mjs:4272
  scripts/dugout.mjs:4284  "[brief, tail].filter(Boolean)"  in assert(…) @ scripts/dugout.mjs:4283
  scripts/dugout.mjs:4363  /starvedNightFor\(/  in assert(…) @ scripts/dugout.mjs:4358
  scripts/dugout.mjs:4369  /never as a fact/  in assert(…) @ scripts/dugout.mjs:4358
  scripts/dugout.mjs:5208  /join\(__dirname, "fuelboard\.mjs"\), "fault", id\]/  in assert(…) @ scripts/dugout.mjs:5207
  scripts/dugout.mjs:5239  /timeout: shTimeoutMs\(script, argv\)/  in assert(…) @ scripts/dugout.mjs:5235
  scripts/dugout.mjs:5239  /sh\("gaffer_brain\.mjs", \["judge-round"\]\)/  in assert(…) @ scripts/dugout.mjs:5235
  scripts/forge_session.mjs:2021  /const\s+recorded\s*=\s*appendCoverage\(prev,\s*"force"/  in assert(…) @ scripts/forge_session.mjs:2014
  scripts/forge_session.mjs:2022  /forceDiscardLines\(prev,\s*recorded,\s*cov\)/  in assert(…) @ scripts/forge_session.mjs:2014
  scripts/forge_session.mjs:2284  "capsule_map.json"  (no enclosing assert)
  scripts/forge_session.mjs:2398  /now\|done\|defer/  in assert(…) @ scripts/forge_session.mjs:2396
  scripts/forge_session.mjs:2398  /now\|done\|defer/  in assert(…) @ scripts/forge_session.mjs:2396
  scripts/gaffer_brain.mjs:3899  /field_probes\.json/  in assert(…) @ scripts/gaffer_brain.mjs:3898
  scripts/learnstate.mjs:2016  /import \{[^}]*\} from "\.\/resume_pointer\.mjs";/  (no enclosing assert)
  scripts/learnstate.mjs:2151  /console\.log\(p\);\s*printed = p;/  in assert(…) @ scripts/learnstate.mjs:2148
  scripts/learnstate.mjs:2151  /recordBrief\(printed, \{ now \}\)/  in assert(…) @ scripts/learnstate.mjs:2148
  scripts/mutagen.mjs:967  /NODE_V8_COVERAGE/  in assert(…) @ scripts/mutagen.mjs:966
  scripts/nightshift.mjs:1587  /deps\.concepts \|\| drillConcepts\(deps\)/  in assert(…) @ scripts/nightshift.mjs:1586
  scripts/outbox.mjs:511  /ingest\(\)/  in assert(…) @ scripts/outbox.mjs:510
  scripts/outbox.mjs:513  /try \{ ingest\(\); \} catch/  in assert(…) @ scripts/outbox.mjs:512
  scripts/outbox.mjs:515  /BACKLOG_LOUD/  in assert(…) @ scripts/outbox.mjs:514
  scripts/outbox.mjs:515  /pending\(\)\.length/  in assert(…) @ scripts/outbox.mjs:514
  scripts/postmatch.mjs:949  "NOTES NOT DONE"  in assert(…) @ scripts/postmatch.mjs:948
  scripts/postmatch.mjs:1178  /fits\(JUDGE_CHILD_MS \+ CHILD_TIMEOUT_MS\)/  in assert(…) @ scripts/postmatch.mjs:1176
  scripts/postmatch.mjs:1178  /run\("gaffer_brain\.mjs", \["judge-due"[^\n]*timeout: s\.ms/  in assert(…) @ scripts/postmatch.mjs:1176
  scripts/postmatch.mjs:1187  /timeout: s\.ms/  in assert(…) @ scripts/postmatch.mjs:1186
  scripts/postmatch.mjs:1206  /writeAtomic\(pmFile/  in assert(…) @ scripts/postmatch.mjs:1205
  scripts/postmatch.mjs:1256  /else if \(CARD_ANCHORS\.includes\(anchor\)\) card = await dayCloseCard\(\{ day, run \}\);/  in assert(…) @ scripts/postmatch.mjs:1255
  scripts/postmatch.mjs:1256  /dayCloseCard\(/g  in assert(…) @ scripts/postmatch.mjs:1255
  scripts/postmatch.mjs:1257  /let card = "no card \(the morning anchor files none\)";/  in assert(…) @ scripts/postmatch.mjs:1255
  scripts/postmatch.mjs:1259  /run\("captains_call\.mjs", \["reline", "--family", DAYCLOSE_FAMILY, "--key", kept\.key, "--line", line\]/  in assert(…) @ scripts/postmatch.mjs:1258
  scripts/postmatch.mjs:1260  /run\("captains_call\.mjs", \["file", "--line", dayClosedLine\(day\), "--key", `\$\{DAYCLOSE_FAMILY\}:\$\{day\}`, "--why  in assert(…) @ scripts/postmatch.mjs:1258
  scripts/postmatch.mjs:1342  /if \(!isRealDay\(dateStr\)\) refuse\(/  in assert(…) @ scripts/postmatch.mjs:1341
  scripts/postmatch.mjs:1342  /if \(dateStr > today\) refuse\(/  in assert(…) @ scripts/postmatch.mjs:1341
  scripts/postmatch.mjs:1342  /if \(t == null\) refuse\(/  in assert(…) @ scripts/postmatch.mjs:1341
  scripts/postmatch.mjs:1342  /if \(hisResultOf\(t\)\) refuse\(/  in assert(…) @ scripts/postmatch.mjs:1341
  scripts/postmatch.mjs:1343  /existsSync\(join\(PM_DIR, dateStr \+ "\.md"\)\) && !parseMachineRecord\(priorPm\)/  in assert(…) @ scripts/postmatch.mjs:1341
  scripts/sitting.mjs:2083  /timeout: ownerTimeoutMs\(file, args\)/  in assert(…) @ scripts/sitting.mjs:2079
  scripts/sitting.mjs:2084  /owner\("gaffer_brain\.mjs", \["judge-due", "--trigger", "sitting\.close"\]\)/  in assert(…) @ scripts/sitting.mjs:2079
  scripts/sitting.mjs:2095  /await session\.close\(\)/  in assert(…) @ scripts/sitting.mjs:2094
  scripts/sitting.mjs:2097  /post\("\/close", \{ reason: opt\("--reason"\) \|\| "his_word" \}, closeWaitMs\(\)\)/  in assert(…) @ scripts/sitting.mjs:2094
  scripts/teaching_contract.mjs:1647  /preCyborg\(/  in assert(…) @ scripts/teaching_contract.mjs:1638
  scripts/teaching_contract.mjs:1647  /done_pre_restart/  in assert(…) @ scripts/teaching_contract.mjs:1638
  scripts/teaching_contract.mjs:1668  /refusedSave\("print/  in assert(…) @ scripts/teaching_contract.mjs:1666
  scripts/teaching_contract.mjs:1678  /fallbackTx\(tx, heldTx\)/  in assert(…) @ scripts/teaching_contract.mjs:1677
```
</details>

## THE LAW PACK COUNTS (`node scripts/lawpack.mjs gate`, LF clones, 19 Nov 2026)
- BASE: `lawpack · 1928 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13`
- build: `lawpack · 1928 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13`
- Every count is equal. The gate reads RED on BOTH trees (`jugad-literal-subject-list ROSE — 93, baseline 90` and `depcruise_errors ROSE — 13, baseline 7`, 19 Nov 2026). That RED already exists on main 3f84c80 and this build does not raise it: FORK F2.
- `node scripts/xray.mjs report` (19 Nov 2026): Q2 0 and Q5 0 on both trees.
- `node scripts/models.mjs check` (19 Nov 2026): base `models check: 136 file(s) · literal model names outside models.mjs: 0 · declared fixture lines: 10 · brain_config claude aliases ok` exit 0; build `models check: 136 file(s) · literal model names outside models.mjs: 0 · declared fixture lines: 10 · brain_config claude aliases ok` exit 0.

## SUITE (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, LF clones with npm ci, 19 Nov 2026)
- base: `organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` (19 Nov 2026)
- build: `organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` (19 Nov 2026)
- The red lists are identical, name for name (`diff` of the two UNRULED lists, 19 Nov 2026):
  - the selftest-coverage law (orphaned deck_lint, home_pin, probe, study_scope);
  - the sandbox member (its tripwire canary);
  - the hermetic-members roll-up.
- No red names conductor.mjs.

## CI OF THE PUSHES (public API, no token: `curl https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`)
- 432738f (the conductor edit): run 44448896552, both legs `cancelled` (superseded by the next push).
- 893373a (census): run 44449308597, both legs `cancelled` (superseded).
- f829225 (witness): run 44449558886, both legs `cancelled` (superseded).
- 11d787b (mutants + ledger, the last code push): run 44449735609. `npm test · node 22` (135310533827) completed `success`; `npm test · node 24` (135310533365) completed `success`.
- The commit carrying this file gets its own run. It is named in the LEDGER, not typed here before it exists.

## FORKS
- F1 · The census list above goes to the architect. Only the one conductor assert is edited; each other hit is a candidate for the same repair in its own unit.
- F2 · `lawpack gate` is RED on main 3f84c80 itself: two counts sit above their frozen baselines (measured on an LF clone with `npm ci`). This build leaves every count equal, and the cause is outside the named files.
- F3 · Branch: the brief names `claude/mcon-build`, while the session's default branch is `claude/mcon-queue-setup-qvxgp0` (which carries the seat's effort commit d48f24b). The work is built and pushed on `claude/mcon-build` as the brief says, and no PR is opened (the brief forbids it).
- F4 · The witness and the census are written to run on Windows (CRLF folded, PowerShell process list, node-made copies, no POSIX shell), but they were run only on Linux in the cloud.
- F5 · The census needs acorn (`npm ci`). On a bare checkout it answers NOT MEASURABLE (exit 2), and the witness's C1 then reads RED, with that reason named. `--modules <dir>` borrows another tree's node_modules.
- F6 · The repaired assert copies the tracked `registry.json` into its temp copy, because conductor's import graph throws without it (`scripts/gate.mjs:146`). It reads no other state file and writes none.
- F7 · The witness's BOUND clause walks untracked files too, so gitignored run output (`scripts/tone.log` from a suite run) in the judged tree makes it read RED. Judge a fresh clone.
