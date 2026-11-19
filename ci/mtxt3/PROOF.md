# PROOF · unit mtxt3 — the selftest's switch-off labels (services.mjs) and the S12 lines (conductor.mjs) · forks row 1124 (3)

Every number on this page is a measurement of 19 Nov 2026, each beside the command that printed it.

## BASE
- `git fetch origin main land/mtxt2` then `git merge-base --is-ancestor a583afb origin/main` → exit 1 (19 Nov 2026): main does NOT yet carry a583afb.
- So, per the brief, cut from **`a583afb`** (land/mtxt2 — unit mtxt2's adopted bytes of services.mjs and rails.mjs): `git checkout -b claude/mtxt3-build a583afb`. `ci/mtxt3/BASE` carries the full sha.
- Read first, as the brief orders: unit mtxt's proof and unit mtxt2's proof (`claude/mtxt2-build:ci/mtxt2/PROOF.md`, its FORKS F2 / F3) and mtxt2's diff (`git diff 224f9b9 b13d699`). The citation form used here is theirs, byte for byte: *"his 20 Aug 2026 switch-off, lifted by his 30 Aug 2026 word"* plus `grep -n "nothing burns tokens\|ORGANISM IS BACK ON" docs/archive/ORGANISM_AUDIT__2026-08-19.md` (his 30 Aug word at `:23`, his 20 Aug word at `:54`, measured 19 Nov 2026), and the verbs `node scripts/services.mjs status` · `node scripts/state.mjs`.

## STEP 1 · EVERY CANDIDATE, MEASURED AT THE BASE (file:line at `a583afb`)
Command: `grep -n -i "switch-off\|switched off\|switched-off\|S12" scripts/services.mjs scripts/conductor.mjs` (19 Nov 2026).

| file:line (base) | what it said | fate |
|---|---|---|
| services.mjs:1238-1239 | selftest comment "⛔ THE SWITCH-OFF. A rung that leaves something running has broken it …" | replace — "⛔ THE INSTALLER STARTS NOTHING. Starting a unit is HIS word, never a generated file's", both words cited by the grep (build `:1238-1240`) |
| services.mjs:1240 | assert label "THE SWITCH-OFF HOLDS — every service installs start=demand, every logon task registers DISABLED, and the installer starts nothing" | label only → "THE INSTALLER STARTS NOTHING — every service installs start=demand, every logon task registers DISABLED, and no start verb is emitted" (build `:1241`); its CHECK at `:1241-1242` byte-identical |
| services.mjs:1315 | selftest comment "… the one thing that would mean the switch-off broke." | replace — "… a running unit: whether it SHOULD run is his word, read by `node scripts/state.mjs`." (build `:1316`) |
| services.mjs:1316 | assert label "THE LINE SHOUTS IF ANYTHING IS RUNNING — a running row is flagged against the switch-off, not reported as health" | label only → "… a running row is flagged ⚠ RUNNING, not reported as health" (build `:1317`); its CHECK at `:1317` byte-identical |
| conductor.mjs:1668-1670 | THE RULED LINE: "S9 installs ownership; S12 turns things on, his word per stage. … arming it to fire them is S12's" | replace — "turning a lane on is HIS word, never this file's", both words cited by the grep, "arming it to fire them is his word too", verbs named (build `:1668-1673`) |
| conductor.mjs:1729 | console line "conductor: NOTHING WAS RUN — this reports what the fold no longer covers. S12 arms the firing, on his word." | **edited beyond the ruled line, and why:** it states the same stale S12 claim the ruled comment states, in a printed string (a named-file, printed-string edit the brief allows). Only the S12 sentence → "Arming the firing is his word." (build `:1732`); "NOTHING WAS RUN" kept |

**KEPT — measured true, or not a switch-off claim:** services.mjs lines `245, 698, 855, 1033, 1069, 1077` (base) are unit mtxt2's own citations ("his 20 Aug 2026 switch-off, lifted by …") and are outside the selftest. No other S12 / switched-off token is in conductor.mjs (same grep, 19 Nov 2026).

## STEP 2 · THE BEHAVIOUR THE TWO ASSERTS HOLD IS TRUE TODAY (so only the label moves)
- Their checks, unchanged (build `services.mjs:1241-1243`, `:1317`): `start= demand` in install.ps1, no `sc.exe start`, no `Start-ScheduledTask`, every `.logon.ps1` carries `Disable-ScheduledTask`; `statusLine` of a running row prints `⚠ RUNNING as an OS unit: brain`. Both pass: `node scripts/services.mjs selftest` → `services selftest: 19 passed, 0 failed` (19 Nov 2026, base and build).
- NOT REACHABLE from the cloud, so NAMED, never pasted: what `node scripts/services.mjs status` / `node scripts/state.mjs` print on his machine today. The new text names the verbs and states no count or state.

## STEP 3 · ASSERT LABELS ARE MEMBER KEYS — MEASURED, NOT ASSUMED
- `scripts/ci_verdict.mjs:46` `keyOf` folds digit runs of a **red** name; `judge()` (`:62-70`) computes `fresh` = head reds whose key is not a base red. A label that PASSES on both sides is in neither `reds` list, so a rename of a passing assert can make no fresh red; a vanished passing member is not a red either (`fixed` is computed from base reds only).
- The inner labels of `services.mjs selftest` never reach the suite's reds: `scripts/organism_test.mjs:383` judges a member selftest as `SUITE MEMBER · ${m} selftest exits 0` — its EXIT CODE (and the hermetic loop at `:2227` stores the run for it). The member key for services.mjs is therefore unchanged by this unit.
- Unit ms1's member (on `claude/ms1-build`, not on this base: `git show origin/claude/ms1-build:scripts/organism_test.mjs`, `witnesses()`) keys on `WITNESS ‹unit› GREEN at head against its BASE` — the witness's LAST line and exit code (`judgeLast`), BOUND dropped. It runs `ci/mtxt3/witness_mtxt3.mjs --org <head tree> --base-org <BASE tree>`; this witness reads GREEN on that call (below). Its other conditions are met: `ci/mtxt3/BASE` is one 40-hex line, the witness binds no port (no `listen(`, no exported `*PORT` named).
- No file pins either label, old or new: `grep -rn "THE SWITCH-OFF HOLDS\|THE LINE SHOUTS IF ANYTHING\|flagged against the switch-off\|THE INSTALLER STARTS NOTHING" .` outside `scripts/services.mjs` and `ci/` → no hit (19 Nov 2026). Held as clause M1.
- Verdict: **no new red, no vanished member read as red** — the rename did not wait. No FORK raised on this point.

## STEP 4 · EVERY EDITED STRING, GREPPED BEFORE THE EDIT
`grep -rn "THE SWITCH-OFF HOLDS\|THE LINE SHOUTS IF ANYTHING\|flagged against the switch-off\|S12 arms the firing\|S12 turns things on, his\|IT RUNS NOTHING\|NOTHING WAS RUN" .` (19 Nov 2026): hits only in the two named files, plus `docs/archive/ORGANISM_AUDIT__2026-08-19.md:3633, :8481` — the order's OWN record of its rungs ("S9 INSTALLS ownership; S12 turns things on, his word"), a record that quotes no line of conductor.mjs and pins nothing; not edited (see FORK F3). conductor.mjs's selftest reads `/NOTHING WAS RUN/` (`:1601`), kept.

## SELFTEST, BEFORE AND AFTER (19 Nov 2026, temp clones made with `-c core.autocrlf=false`)
- `node scripts/services.mjs selftest` — before (a583afb): `services selftest: 19 passed, 0 failed` · after: `services selftest: 19 passed, 0 failed`
- `node scripts/conductor.mjs selftest` — before (a583afb): `ALL CHECKS PASSED (111 passed, 0 failed)` · after: `ALL CHECKS PASSED (111 passed, 0 failed)`
- Inside the witness (clauses T1, T2, both trees on temp copies): base and org headlines equal.

## `node scripts/models.mjs check` — exit 0 (19 Nov 2026)
Last line: `models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)`

## WITNESS, BOTH WAYS (19 Nov 2026, `node ci/mtxt3/run_mutants_mtxt3.mjs --repo . --base a583afb`)
- BASE  (`--org base --base-org base`): `RED MTXT3 · O1, O2, K1, K2, A1, M1, T1, T2, G1, N1, BOUND` (exit 1)
- BUILD (`--org build --base-org base`): `GREEN MTXT3 the services.mjs selftest's switch-off labels and the conductor.mjs S12 lines restated, his two words cited by the grep, every assert check byte-identical · 12 clause(s)` (exit 0)
- Honest note: K1, K2, A1, M1, T1, T2, N1, BOUND are invariance clauses; on the base they read RED through their "the unit is absent" conjunct. Their teeth are the mutants below.

## MUTANTS (same run, 19 Nov 2026)
One per clause, each on a copy of the build clone, `--only <clause>`:
O1 the switch-off back in a selftest assert label · O2 the S12 claim back in the conductor console line · K1 a code token in services.mjs · K2 a code token in conductor.mjs · A1 an assert CHECK changed (the selftest still passes) · M1 another file pins a renamed label · T1 a services-asserted string changed · T2 a conductor-asserted string changed (foldLine's `COVERED`) · G1 the cited grep finds no 30 Aug line · N1 a live count typed into a new line · BOUND a file beyond the named ones · LAST a planted orphan naming the temp root.
`run_mutants: 12 of 12 mutant(s) RED by the clause that names them · control GREEN`
- Finding on the way (not edited — beyond a text-only unit): the first T2 mutant dropped "NOTHING WAS RUN" from the fallback console line and the conductor selftest stayed GREEN. Measured why: the assert at `conductor.mjs:1597-1601` slices `src.indexOf('if (mode === "fallback")')`, and the FIRST such occurrence is the selftest's own string literal at `:1598`, so the slice contains the selftest's own `/NOTHING WAS RUN/` at `:1601` and the pin satisfies itself. FORK F4.

## SUITE (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 19 Nov 2026, both on clones under os.tmpdir())
- base clone a583afb: `organism_test: 139 passed, 5 failed · ruled 0 · UNRULED 5`
- build clone b3ca04e: `organism_test: 139 passed, 5 failed · ruled 0 · UNRULED 5`
- The red lists are identical, name for name (`diff` of the two `ORGANISM_TEST_VERDICT` reds, 19 Nov 2026): the selftest-coverage law, the fsrs / mutagen / sandbox members (`ERR_MODULE_NOT_FOUND` — no node_modules in this container — and the sandbox tripwire) and the hermetic-members roll-up. Like for like: no delta; no red names services.mjs or conductor.mjs.

## CI OF THE PUSHES (public API, no token — `curl https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`)
- `bdcc752` (the text commit): run 44440456178 — both legs `cancelled` (superseded by the next push).
- `8148bbf` (witness): run 44440731252 — both legs `cancelled` (superseded).
- `b3ca04e` (mutants + ledger): run 44440876524 — `npm test · node 22` (135281191542) and `npm test · node 24` (135281191336); verdict in the LEDGER and the FINAL MESSAGE.
- The commit that carries this file gets its own run; named in the FINAL MESSAGE, never typed here before it exists.

## FORKS (files beyond the named ones, or rulings this unit may not make — written, not edited)
- F1 · `setup/services/*` (generated by `services.mjs emit`) are untouched by this unit — the selftest text is not emitted into them; mtxt2's F1 (their stale installer text) stands as it was.
- F2 · conductor.mjs:1729 (base) was edited beyond the ruled comment — named above, with its why. If the architect rules the ruling meant the comment alone, revert that one string.
- F3 · `docs/archive/ORGANISM_AUDIT__2026-08-19.md:3633, :8481` still say "S12 turns things on, his word" — the order's own dated record; a record, not a work order, and beyond the named files.
- F4 · conductor.mjs's selftest assert "the fallback mode RUNS NOTHING …" (`:1597-1601`) is self-satisfying on `/NOTHING WAS RUN/` (its slice starts at the selftest's own string literal). A code fix in a selftest — beyond a text-only unit.
- F5 · branch: the brief names `claude/mtxt3-build`; the session's default branch is `claude/mtxt3-queue-work-4skhq4`. Built and pushed on `claude/mtxt3-build` per the brief; no PR opened (the brief forbids it).
- F6 · the witness is written to run on Windows (CRLF folded, PowerShell process list, no POSIX shell, node-made copies) but was run only on Linux from the cloud.
