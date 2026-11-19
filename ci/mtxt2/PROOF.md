# PROOF · unit mtxt2 — the other switch-off prose (forks rows 1114 (4) / 1118 (1))

Every number on this page is a measurement of 19 Nov 2026, each beside the command that printed it.

## BASE
- Cut from `origin/main` at `224f9b9` (unit mtxt's landing) — `git fetch origin main && git checkout -b claude/mtxt2-build FETCH_HEAD`, 19 Nov 2026.
- Base CI (public API, no token, 19 Nov 2026): `npm test · node 22` and `npm test · node 24` completed success on `224f9b9`.
- Read first, as the brief orders: unit mtxt's proof (`claude/mtxt-build:ci/mtxt/PROOF.md`) and its diff (`git diff 224f9b9~1 224f9b9`). The citation form used here is mtxt's: *"his 20 Aug 2026 switch-off … his 30 Aug 2026 word"* plus `grep -n "nothing burns tokens\|ORGANISM IS BACK ON" docs/archive/ORGANISM_AUDIT__2026-08-19.md` (his 20 Aug word at `:54`, his 30 Aug word at `:23`, the same grep CLAUDE.md cites).

## STEP 1 · EVERY CANDIDATE, BY GREP, AT THE BASE (file:line at `224f9b9`)
Command: `grep -n -i "switched off\|switch-off\|switched-off\|S12\|OFF until\|until S12" scripts/services.mjs scripts/rails.mjs` (19 Nov 2026).

| file:line (base) | what it said | fate |
|---|---|---|
| services.mjs:13-14 | header: 28 Aug relaunch "into an organism his standing order **says** is SWITCHED OFF" | replace — kept as dated history ("then held OFF"), both words cited |
| services.mjs:20-21 | header: "S12 turns things on … A rung that leaves something running has broken the switch-off" | replace — "starting a unit is HIS word, never this file's", both words cited by the grep, verbs named |
| services.mjs:213-214 | logon template comment: "S12 turns things on" | replace — "starting it is HIS word" |
| services.mjs:242-243 | logon template comment: "The organism is SWITCHED OFF … S12 enables … would break the switch-off" | replace — "An installer enables nothing: enabling is HIS word", grep cited |
| services.mjs:246 | logon `Write-Host "(disabled — S12 enables it on his word)"` | replace — "(disabled — enabling it is his word; what runs: node scripts/services.mjs status)" |
| services.mjs:657 | comment quoting the measured parse failure on the `Write-Host "… (disabled — S12 enables it …)"` line | replace — quote kept, S12 dropped: `Write-Host "… (disabled — …)"` (the em-dash, which is the point, stays) |
| services.mjs:694 | install.ps1 header: "S12 turns things on" | replace — "Starting a unit is his word, never this script's", grep cited, verb named |
| services.mjs:774 | install.ps1 comment: "it would surface at S12 as a confusing logon failure" | replace — "at the first start" |
| services.mjs:826 | install.ps1 comment: "S12 flips these to auto" | replace — "auto is his word, never this script's" |
| services.mjs:832 | install.ps1 `Write-Host "… or it will fail to start at S12"` | replace — "… or it will fail to start" |
| services.mjs:850 | install.ps1 `Write-Host "S12 is what turns the organism back on …"` | replace — "This script starts nothing: starting a unit is your word (your 20 Aug 2026 switch-off was lifted by your 30 Aug 2026 word)." |
| services.mjs:861 | comment: "what S12's pre-flight should call" | replace — "what a pre-flight should call before any unit is started" |
| services.mjs:990 | grant-logon-right `Write-Host "… S12 must not turn anything on until this reads GRANTED."` | replace — "no service should be started until this reads GRANTED." |
| services.mjs:1010 | README: 28 Aug `--help` "woke four daemons inside a switched-off organism" | replace — dated history: "inside an organism his 20 Aug 2026 order then held off" |
| services.mjs:1028 | README: "S12 turns the organism back on, stage by stage, on your word." | replace — both words cited by the grep, `node scripts/services.mjs status` named |
| rails.mjs:30 | rail 3 comment: "The organism is also SWITCHED OFF until S12." | replace — both words cited by the grep; "the rail stands on the three above" |
| rails.mjs:199 | claude-p deny: "… (L6), … (L5), its spend lands in no ledger, and the organism is SWITCHED OFF until S12" | replace — the switched-off clause only; rail id `claude-p`, the fix, and L6 / L5 / the ledger kept |

**KEPT — measured true, or not a switch-off claim:**
- services.mjs:1062 — "the question the switch-off cares about": dated reasoning about the statusLine scope, states no state.
- services.mjs:1070 — unit mtxt's RUNNING line (already cites the 30 Aug word).
- services.mjs:1231, 1233, 1308, 1309 — the SELFTEST's comments and assert labels ("THE SWITCH-OFF HOLDS …", "… flagged against the switch-off …"). The behaviour they assert is TRUE today (read at `:1234-1235`: `start= demand`, no `sc.exe start`, no `Start-ScheduledTask`, every logon file carries `Disable-ScheduledTask`) — but they are the test's own text, so they are a FORK (F2), not edited.
- rails.mjs:33 — a verbatim quote of the order's §10-C ("S12's canary runs must never be blocked"); rails.mjs:37 and the selftest lines `ARSENAL_RAILS_OVERRIDE=S12:<rail>` — the override TOKEN is code and test input, not a claim.

## STEP 2 · LIVE BEHAVIOUR, MEASURED (so a true statement keeps its meaning)
- The installer STILL registers every logon task disabled and every service `start=demand`, and starts nothing: the generator's own code at base `services.mjs:244` (`Disable-ScheduledTask -TaskName $id`) and `:826` (`sc.exe config $id start= demand`), held by the selftest assert at `:1233-1235`. So "registered disabled / start=demand / starts nothing" was KEPT everywhere; only "S12 turns it on" and "the organism is switched off" were dropped.
- NOT REACHABLE from the cloud, so NAMED, never pasted: what `node scripts/services.mjs status` and `node scripts/state.mjs` print on his machine today. The new texts name these verbs and state no count or state.

## STEP 3 · WHAT CHANGED
- `git diff 224f9b9 HEAD --stat` (19 Nov 2026): `scripts/services.mjs` and `scripts/rails.mjs` (text only) plus `ci/mtxt2/` — nothing else.
- Every edited string was grepped across the repo before the edit (`grep -rn "THE SWITCH-OFF HOLDS\|S12 enables it\|S12 turns\|SWITCHED OFF until S12\|organism is SWITCHED OFF\|disabled — S12" .`, 19 Nov 2026). No selftest pins an edited string (the services asserts read `start= demand` / `Disable-ScheduledTask` / `session 0`, all kept; no rails assert reads the claude-p `why`). The other hits are files beyond the named ones — FORKS F1, F3.
- PowerShell safety, held by text choice: no new double quote inside a `Write-Host "…"` string; the cited grep sits only in `#` comments and the README; inside JS templates it is written `\\|` so the emitted text reads `\|` (checked by `node -e` over `emit({ write: false })`, 19 Nov 2026).

## SELFTEST, BEFORE AND AFTER (19 Nov 2026)
- `node scripts/services.mjs selftest` — before (224f9b9): `services selftest: 19 passed, 0 failed` · after: `services selftest: 19 passed, 0 failed`
- `node scripts/rails.mjs selftest` — before (224f9b9): `rails selftest: 106 passed, 0 failed` · after: `rails selftest: 106 passed, 0 failed`
- And inside the witness (clauses T1, T2, both trees on temp copies): base and org headlines equal.

## `node scripts/models.mjs check` — exit 0 (19 Nov 2026)
Last line: `models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)`

## WITNESS, BOTH WAYS (19 Nov 2026, `node ci/mtxt2/run_mutants_mtxt2.mjs --repo . --base 224f9b9`, build `99df2c9`)
- BASE  (`--org base --base-org base`): `RED MTXT2 · O1, O2, K1, K2, T1, T2, D1, G1, N1, BOUND` (exit 1)
- BUILD (`--org build --base-org base`): `GREEN MTXT2 the switch-off / S12 prose of services.mjs and rails.mjs replaced by his two words cited and the verbs named, text only · 11 clause(s)` (exit 0)
- Both trees are CLONES under os.tmpdir() made with `-c core.autocrlf=false` at the committed sha.
- Honest note: K1, K2, T1, T2, D1 and BOUND are invariance clauses; on the base they read RED through their "the file differs from the base" conjunct. Their teeth are the mutants below (T1/T2/D1 mutants are text-only, so K1/K2 stay GREEN while they go RED).

## MUTANTS (same run, 19 Nov 2026)
One per clause, each on a copy of the build clone, `--only <clause>`:
O1 an S12 claim back in an installer string · O2 the switched-off clause back in a rails comment · K1 a code token in services.mjs · K2 a code token in rails.mjs · T1 a services-asserted string changed · T2 a rails-asserted string changed · D1 the claude-p deny lost its ledger reason · G1 the cited grep finds no 30 Aug line · N1 a live count/state typed into a new line · BOUND a file beyond the named ones · LAST a planted orphan naming the temp root.
`run_mutants: 11 of 11 mutant(s) RED by the clause that names them · control GREEN`

## SUITE (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 19 Nov 2026, both on clones under os.tmpdir())
- base clone 224f9b9: `organism_test: 139 passed, 5 failed · ruled 0 · UNRULED 5`
- build clone 99df2c9: `organism_test: 139 passed, 5 failed · ruled 0 · UNRULED 5`
- The FAIL lists are identical, name for name (`diff` of the two `✗`/FAIL lists, 19 Nov 2026): the selftest-coverage law, fsrs and mutagen `ERR_MODULE_NOT_FOUND` (no node_modules in this container), the sandbox tripwire, the hermetic-members roll-up — the same five unit mtxt named. Like for like: no delta; no red names services.mjs or rails.mjs.

## CI OF THE PUSHES (public API, no token)
- `3f45932` (the text commit): workflow run 44437071962 — both jobs `cancelled` (superseded by the next push).
- `99df2c9` (text + witness): workflow run 44437515450 — `npm test · node 22` (135270066610) and `npm test · node 24` (135270067120); verdict in the LEDGER and the FINAL MESSAGE (in progress when this file was written).
- The proof commit that carries this file gets its own run; it is named in the FINAL MESSAGE, never typed here before it exists.

## FORKS (files beyond the named ones, or rulings this unit may not make — written, not edited)
- F1 · `setup/services/*` are GENERATED by `services.mjs emit` and still carry the old text (`install.ps1:30`, `README.md:33`, `ArsenalFC-Dugout.logon.ps1:8,37,41`, `ArsenalFC-Turnstile.logon.ps1:8,37,41`). Re-emitting writes beyond the named files, so it was not run. `node scripts/services.mjs emit` regenerates them; it is a write of files he installs from — his or the architect's call.
- F2 · the selftest's own text at `services.mjs:1231, 1233, 1308, 1309` still names "the switch-off" (assert labels "THE SWITCH-OFF HOLDS …", "… flagged against the switch-off …"). The behaviour is true (installer starts nothing); renaming a test's labels is editing the test — not done.
- F3 · `scripts/conductor.mjs:1668` — "S9 installs ownership; S12 turns things on, his …": a file beyond the named ones.
- F4 · the install.ps1 `Write-Host "  DONE - and NOTHING IS RUNNING …"` line (base `:849`) was kept: it is the installer's own claim about its run, not a switch-off claim; whether a reinstall over a running service makes it false was not measured (no Windows box here).
- F5 · branch: the brief names `claude/mtxt2-build`; the session's default branch is `claude/mtxt2-queue-build-m65mwj`. Built and pushed on `claude/mtxt2-build` per the brief; no PR opened (the brief forbids it).
- F6 · the witness is written to run on Windows (CRLF folded, PowerShell process list, no POSIX shell, node-made copies) but was run only on Linux from the cloud.
