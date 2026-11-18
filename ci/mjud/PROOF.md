# UNIT mjud — PROOF

One seat, four parts, one file family: **msit** (no caller kills a judge verb inside the judge's own budget), **F3** (the external check is inside the round's ONE budget), **mjd2** (a killed batch teaches the size), **mauth** (the auth refusal pattern has one home).
BASE = main `5767e21`. Branch `claude/mjud-judge-round`. Named files changed: `scripts/gaffer_brain.mjs`, `scripts/sitting.mjs`, `scripts/dugout.mjs`, `scripts/brain.mjs`. Everything else written is under `ci/mjud/`.
No live model call was made: every gate ran on a git-archive tree under `os.tmpdir()` with a fake `claude` first on PATH (`ci/mjud/sides.mjs`, which logged **0** spawns on every run), and every model call in the witness is a planted function.

## 1 · MEASURED FIRST (BASE `5767e21`, file:line)

| # | Fact at BASE | Where |
|---|---|---|
| 1 | The judge exports ONE budget, `JUDGE_BUDGET_MS = 300000`. | `scripts/gaffer_brain.mjs:175` |
| 2 | The verbs that reach `gradeJudge` are `judge-round` and `judge-due` only. `judge` is the Watcher (`judgePass`), `judge-night` is `gradeNight`. | `scripts/gaffer_brain.mjs:2508-2520` · `:2397` · `:2554` |
| 3 | **Census of judge-verb spawns** (call shapes `"gaffer_brain.mjs", ["judge-…"` and `join(…,"gaffer_brain.mjs"), "judge-…"` across `scripts/` + `hooks/`; skills/docs only name the verb in prose): three sites. | below |
| 3a | sitting close → `owner("gaffer_brain.mjs", ["judge-due", "--trigger", "sitting.close"])` → `ownerCli`, which kills **every** owner call at **20 s**. | `scripts/sitting.mjs:1014` · `:208` |
| 3b | dugout `judge_round` tool → `sh("gaffer_brain.mjs", ["judge-round"])` → the default `sh`, which kills **every** tool spawn at **60 s**. | `scripts/dugout.mjs:2203` · `:2058` |
| 3c | postmatch day close → `run("gaffer_brain.mjs", ["judge-due", "--trigger", "day.close"], { timeout: s.ms })` with `fits(JUDGE_BUDGET_MS + CHILD_TIMEOUT_MS)` then `spawnMs(f, CHILD_TIMEOUT_MS)` ⇒ timeout ≥ `JUDGE_BUDGET_MS`. Already at or above the budget; READ only. | `scripts/postmatch.mjs:711-715` |
| 3d | Not a judge-verb spawn: dugout `wakeTheWatcher` spawns `gaffer_brain.mjs judge` detached (the Watcher, no timeout by design). | `scripts/dugout.mjs:2937` |
| 4 | The judge's own children after a batch (the captain's-call card, the owner dispatch) are killed at two bare `timeout: 30000` literals; no constant is exported for them. | `scripts/gaffer_brain.mjs:2032` · `:2044` |
| 5 | **F3**: the external check (`verifyCitedFacts`) runs at `:1980-1982`, BEFORE the round's clock `t0` is taken at `:2197-2198`; every batch's `remaining` (`:2204`) and the opening size (`:2202`) count a full `JUDGE_BUDGET_MS` after the check. The check's own kill is a fresh `180000` regardless of the round. | `scripts/gaffer_brain.mjs:1980-1982` · `:2197-2204` · `:1607` |
| 6 | **mjd2**: `judgeRates` keeps `ok === true` rows only; `judgeBatchSize` derives from those alone — a batch killed at its budget leaves the next size unchanged. | `scripts/gaffer_brain.mjs:1931-1935` · `:1937-1950` |
| 7 | **mauth**: `brain.mjs` holds its own module-private `AUTH_FAIL_RE` without the observed judge refusal "OAuth session expired and could not be refreshed"; `gaffer_brain.mjs` restates it widened as `JUDGE_AUTH_RE`. Two literals. | `scripts/brain.mjs:961` (read at `:1003`) · `scripts/gaffer_brain.mjs:1929` |
| 8 | The import graph: `depcruise` no-circular = **7** at BASE (lawpack's ratchet holds it). A `gaffer_brain.mjs → brain.mjs` import, static or dynamic, measured on a scratch copy: **10** (three new cycles through `brain → captains_call → forge_session ⇢ gaffer_brain` and `brain ⇢ sitting`). The reverse, `brain.mjs → gaffer_brain.mjs`: **7**. | `ci/mjud/out/base_lawpack.txt` · scratch trial (not kept) |
| 9 | The CI `suite` is already RED on the seat commit `0584eb8` = BASE + the settings key (run `44265044353`): `organism_test.mjs:573 writersOf` TypeError on the Windows runner, "npm test produced no headline line". | GitHub Actions |

## 2 · WHAT WAS BUILT

- **msit** — `gaffer_brain.mjs:180` exports ONE new constant, `JUDGE_DISPATCH_MS`, which names the existing 30 s of the judge's own owner and card children (the two literals of fact 4 now read it; the value is unchanged). `sitting.mjs:214` `ownerTimeoutMs` and `dugout.mjs:2063` `shTimeoutMs` return `JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS` (both imported) for `gaffer_brain.mjs judge-round|judge-due`, and the caller's existing 20 s / 60 s for everything else (now named `OWNER_TIMEOUT_MS` / `TOOL_TIMEOUT_MS`, values unchanged). `ownerCli` (`sitting.mjs:219`) and the default `sh` (`dugout.mjs:2067`) read them. Each file gains one selftest clause.
- **F3** — the round's clock `t0` is taken before the check (`gaffer_brain.mjs:2019`). The check is handed `verifyBudgetMs` = what is left, its call is killed at `min(VERIFY_TIMEOUT_MS, that)` (`:1619`; `VERIFY_TIMEOUT_MS` names the existing 180 s at `:1557`), it reports `duration_ms`, and with nothing left it does not start and says why. The check's time is charged as already spent (`:2240`). If no batch starts and a full budget would have started one, the round returns `reason: "judge-budget-spent-by-external-check"`, RED, with nothing judged (`:2303`). postmatch's close budget is untouched.
- **mjd2** — `judgeFloors` (`gaffer_brain.mjs:1961`) takes judge rows the lane KILLED (`killed` / `timed_out` field, or the error text matched by the existing `JUDGE_KILL_RE`) and turns each one's `duration_ms / items` into a strict floor. `judgeBatchSize` (`:1969`) counts floors in the slowest-plus-spread estimate and caps the size strictly below `remaining / floor`. With no floors it behaves exactly as before. It reads only fields the rows already carry. No field is added to the ledger.
- **mauth** — ONE literal, `gaffer_brain.mjs:1945` `JUDGE_AUTH_RE`, which already held the OAuth words. `brain.mjs:91` imports it, `brain.mjs:969` `const AUTH_FAIL_RE = JUDGE_AUTH_RE;` (same RegExp object) is exported. That widens brain's dead-brain auth flag to the observed refusal. The direction is a FORK (F-A below).

## 3 · THE PROOF OWED

### P1 · the witness, both ways — `node ci/mjud/witness_mjud.mjs --org <tree> --base-org <BASE tree>`
| side | last line | exit |
|---|---|---|
| build (git-archive of the branch) | `GREEN MJUD judge budget reaches every caller, the external check, the kill and the auth pattern · 11 clause(s)` | 0 |
| BASE `5767e21` | `RED MJUD · M1 SITTING · M2 DUGOUT · M3 CENSUS · M4 F3-EAT · M5 F3-CLIP · M6 MJD2 · M8 MAUTH` | 1 |

On BASE, every clause the build feeds is RED: M1 20000 ms, M2 60000 ms, M3 sites not covered, M4 2 judge calls after the check ate the budget, M5 the first batch killed at a fresh 300000, M6 size 12 then 12, M8 not exported and 2 literals. The guards M7, M9, BOUND and LAST are GREEN on both sides. BOUND on the build: it differs from BASE in exactly the 4 named files. LAST on both sides: the fake claude logged 0 spawns, and no node process naming the temp dir survived. Full outputs: `out/witness_head.txt`, `out/witness_base.txt`.

### P2 · selftests, BASE vs build (last lines, from `out/{base,build}_*.txt`)
| gate | BASE | build |
|---|---|---|
| `gaffer_brain.mjs selftest` | `gaffer_brain selftest: 183 passed, 0 failed` | `gaffer_brain selftest: 189 passed, 0 failed` (≥ 183 ✔) |
| `sitting.mjs selftest` | `sitting selftest: 97 passed, 0 failed` | `sitting selftest: 98 passed, 0 failed` |
| `dugout.mjs selftest` | `ALL CHECKS PASSED` | `ALL CHECKS PASSED` (+1 clause) |
| `brain.mjs selftest` | `SELFTEST FAILED` — 442 ✓, 1 ✗ `GEMINI SHIM — a spaced %APPDATA% path is QUOTED` | same: 442 ✓, the same 1 ✗ (a Windows-path assertion, RED on this Linux box at BASE as well; not changed by this unit) |
| `daily_green.mjs selftest` | `daily_green selftest: 68 passed, 0 failed` | `daily_green selftest: 68 passed, 0 failed` (unmoved) |
| `organism_test.mjs laws` | `organism_test: 113 passed, 2 failed · ruled 0 · UNRULED 2` | `organism_test: 113 passed, 2 failed · ruled 0 · UNRULED 2` (the same two, pre-existing) |

### P3 · mutants — `node ci/mjud/run_mutants.mjs --org <build tree> --base-org <BASE tree>`
Last line: `run_mutants: 11 of 11 mutant(s) RED by the clause that names them · control GREEN`. There is one mutant per clause, M1–M9 plus BOUND and LAST. m1 and m2 are the two callers' mutants. m3 plants a new uncovered caller. ml makes a model call through a worker thread that the recorder cannot see, and the fake claude logs it. The first run read 10 of 11: m7 was MISSED because M7's 12-capture queue capped both sizes. The plant now queues 40 captures, and M7 also asserts that the size is below the queue. Both directions were re-run after that change. Outputs: `out/run_mutants.txt`, `out/mutant_*.txt`.

### P4 · `node scripts/models.mjs check`
`models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)`, exit 0 on both sides.

### P5 · lawpack, types, lint — BASE vs build
| gate | BASE | build |
|---|---|---|
| `node scripts/lawpack.mjs` | `lawpack: GREEN — no law's finding count rose, and every rule is on disk` | the same; the finding lists are identical (`diff` empty; depcruise no-circular 7 = 7) |
| `node scripts/gates.mjs types` | 14 organs · undefined-symbol 0 · other checkJs **296** | 14 · 0 · **296** |
| `node scripts/gates.mjs lint` | **344** errors · 2 warnings (no-empty 262 · no-unused-vars 82) | **344** · 2 (262 · 82) |

No count rises.

### Gates that cannot run here (named, not skipped)
- **The witness on Windows**: not run, because this box is Linux. It is built to port: node_modules is a junction on win32, path keys use forward slashes, `claude.cmd` sits beside the sh fake, the PATH key is found case-insensitively, the process list uses PowerShell CIM, and there is no `/proc`.
- **CI `suite`** (a note, not a gate of this unit): step 1 `d85d310` gave run `44268323942` FAILURE. That is the same `organism_test.mjs:573 writersOf` TypeError as on the seat commit `0584eb8` (run `44265044353`), so it is pre-existing (fact 9). Step 2 `36df7ac` gave run `44268948058`, cancelled when the next push superseded it. Later runs are recorded in the final message.

## 4 · FORKS (named, with file:line; not built here)
- **F-A · direction of the auth import.** The brief rules "`brain.mjs AUTH_FAIL_RE` … exported; `gaffer_brain.mjs` imports it". Built that way, it closes three import cycles (depcruise no-circular 7 → 10, both static and dynamic), and lawpack's ratchet would go RED. A gate may only get stricter, so the ONE literal lives at `scripts/gaffer_brain.mjs:1945` and `scripts/brain.mjs:91/969` imports and re-exports it as `AUTH_FAIL_RE`. The functional ask is met: one pattern, brain widened, exported. The direction is the architect's ruling. The alternative leaf home is `scripts/claudegen.mjs`, already imported by `brain.mjs:80` (static) and by `gaffer_brain.mjs` (dynamic), but it is not a named file.
- **F-B · postmatch's judge child has no dispatch margin.** `scripts/postmatch.mjs:711-715` gives `judge-due` at least `JUDGE_BUDGET_MS` and no `JUDGE_DISPATCH_MS`, so a round that spends its whole budget can still be killed while it dispatches. postmatch is READ only, and the close budget never moves (Part 2).
- **F-C · the sitting CLI waits 240 s for a close that may now take up to 330 s.** `scripts/sitting.mjs:1368` `post("/close", …, 240000)` is an HTTP wait, not a spawn. The daemon's close keeps running. Only the CLI's print can read "aborted". Left as it was ("every non-judge spawn keeps its timeout").
- **F-D · `JUDGE_DISPATCH_MS` covers ONE owner spawn after the budget, not the round's whole tail.** Per settled item, `settleBatch` can make one second-opinion call, card filings and owner dispatches at `JUDGE_DISPATCH_MS` each (`scripts/gaffer_brain.mjs` settleBatch / dispatch). Bounding the whole tail is a design question.

## 5 · LANDING ITEMS
`scripts/gaffer_brain.mjs` · `scripts/sitting.mjs` · `scripts/dugout.mjs` · `scripts/brain.mjs` · `ci/mjud/` (witness_mjud.mjs, w_drive.mjs, w_preload.mjs, run_mutants.mjs, sides.mjs, ledger.mjs, LEDGER.jsonl, out/, PROOF.md).
