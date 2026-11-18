# MFAC — BUILD PROOF (the night factory)

Unit **mfac** · forks rows 1069 and 1081 · his word 248 · build seat, branch `claude/mfac-build`.
Every line below that carries a count is dated (18 Nov 2026, UTC) or names the command that prints it.

## 0. The base and what I measured before writing

- **Base:** `origin/main` @ `7c3c279`, fetched 18 Nov 2026 (`git fetch origin main`; the branch was cut from it in a
  fresh clone made with `core.autocrlf=false`; the session's own checkout held a hook-written state file, so I did not
  switch branches inside it).
- **Unit mday is on main at the cut** (measured, not assumed): `scripts/day.mjs` is present at `7c3c279` with `start`
  (`scripts/day.mjs:91` at the base), `end` (`:111`), step 5 the deal (`:144-146`), the already path (`:116-118`) and the
  REFUSED path (`:113-115`); landed by `9f6f9ab` and `cb30003` (`git log -- scripts/day.mjs`).
- **The learn start reaches `day.mjs start` by code:** `scripts/turn_hook.mjs:201` (UserPromptSubmit, `/learn`) and
  `scripts/rails.mjs:305` (PreToolUse Skill, detached hand-off). Both run `main()` of `day.mjs`, so a line printed there
  reaches the session.
- **The card door:** `captains_call.mjs file --key` is idempotent by key (`scripts/captains_call.mjs:1803-1810`,
  `fileGuard` `:1480`), and the DECISION GATE retires a card whose key has no declared reason unless the filer passes
  `--why-code-cannot-decide` (`:1811-1819`, `whyForCard` `:350`). `night.mjs` passes the reason.
- **The suite's membership lives in `package.json`**, not in `organism_test.mjs`: the coverage law reads the three
  package.json chains (`scripts/organism_test.mjs:290-318` at the base) and the hermetic loop spawns every organ with a
  selftest (`:2219-2223`) but only judges suite members (`suites()`, `:363-387`). See FORK 1.
- **Base suite** (18 Nov 2026, `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` at `7c3c279`):
  `organism_test: 142 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)` — the one red is the
  base's own coverage orphans (`deck_lint, home_pin, probe, study_scope`), not this unit's.

## 1. What was built (named files only)

| File | What changed |
|---|---|
| `scripts/night.mjs` | **new** — arm · wait · begin · mark · stop · may · close · line · selftest; SOLE WRITER of `dressing-room/state/night_log.jsonl` (header) |
| `scripts/day.mjs` | `end()` step **5a** arms (`scripts/day.mjs:152-154`); `start()` closes the night (`:111`, `closeNight` `:92-95`) and `main` prints its ONE line (`:214`) |
| `scripts/organism_test.mjs` | `OWN_MEMBERS = ["night"]`: counted by the coverage law exactly once and judged by `suites()` (FORK 1) |
| `.gitignore` | `dressing-room/state/night_log.jsonl` (ADDED (i)); the BIOMETRIC ruling lines (`.gitignore:35-44`, `:389-397`) are byte-unchanged (`git diff 7c3c279 -- .gitignore` adds 4 lines at the end, removes none) |
| `ci/mfac/` | `witness_mfac.mjs`, `run_mutants_mfac.mjs`, `LEDGER.jsonl`, this file |

`scripts/land.mjs` is byte-identical to the base (witness W3.2). Nothing under `dressing-room/state/` is tracked or written
by this branch. `.claude/settings.json` is not on this branch's diff.

## 2. THE F4 CONFIG KEY and its refusing placeholder

- **Key:** `NIGHT_CONFIG.memory_floor_mb` in `scripts/night.mjs:56`.
- **Placeholder:** `FLOOR_UNSET` (`scripts/night.mjs:55`). While it stands, `node scripts/night.mjs may --act launch`
  answers `NO floor-unset · NIGHT_CONFIG.memory_floor_mb is the placeholder: the runner writes it from the blind-rail
  free-memory rows before the land branch (ruling F4 A)` and exits 1 (witness clause F4; selftest line 1).
- **Who fills it:** the runner, before it cuts the land branch, with a number of MB read from the blind-rail
  free-memory rows on his laptop. No session types it; this seat typed none (the witness plants the line as the box's own
  measured free memory in its temp copy only).

## 3. The witness, both ways (last lines, 18 Nov 2026)

`node ci/mfac/witness_mfac.mjs --org <dir> --base-org <base 7c3c279 tree>`

- **Build** (`--org` = this branch): `GREEN MFAC the night armed by the day end, held to its stops, closed by the learn start in ONE line · 25 clause(s)` (exit 0)
- **Base** (`--org` = `7c3c279`): `RED MFAC · F4 W1.1 W1.2 W6.2 W1.3 W1.4 W1.5 W2.1 W2.4 W2.2 W2.3 W3.1 W3.2 W4.1 W4.2 W4.3 W4.4 W4.5 W5.1 W5.2 W5.5 W5.3 W5.4` (exit 1) — every functional clause RED; BOUND and LAST GREEN on both sides by design.

Every clause the spec called a guard ("base GREEN") is written to need the organ, so it reads RED on a base that has no
night (W1.4 needs `arm --by evening` to REFUSE by name; W1.5 / W3.2 need `night.mjs` to exist; W5.4 needs `night.mjs line`).
The port class (row 1053): the sitting door's port is a free port with nothing on it (`ARSENAL_SITTING_PORT`), no live
service is named, nothing is POSTed, and every wait is bounded by the longest measured run plus one measured node start.

## 4. The mutants (18 Nov 2026)

`node ci/mfac/run_mutants_mfac.mjs --org <build> --base-org <base>` →
`run_mutants: 25 of 25 mutant(s) RED by the clause that names them · control GREEN` (two clean runs).

The ledger keeps the two runs that were not clean: the first had W5.1 SURVIVED (the start keeps only the first `NIGHT`
line, so the mutant now edits `day.mjs` as well); one run overlapped an orphaned earlier runner whose reaper matched the
shell, which cost W1.2 its second arm — the reaper is now limited to node processes, and the lone W1.2 mutant read RED in
8 of 8 runs.

## 5. Each touched selftest, before and after (headline lines, 18 Nov 2026)

| Selftest | Before (base `7c3c279`) | After (this branch) |
|---|---|---|
| `node scripts/night.mjs selftest` (18 Nov 2026) | absent (no organ) | `night selftest: 22 passed, 0 failed` |
| `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` (18 Nov 2026) | `organism_test: 142 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126` | `organism_test: 143 passed, 1 failed · ruled 0 · UNRULED 1` — the new pass is `SUITE MEMBER · night selftest exits 0`; the one red is the base's own orphan line, its detail unchanged |
| `scripts/day.mjs` | has no selftest verb at the base | still none (its behaviour is held by the witness) |

`node scripts/models.mjs check` → exit 0, `literal model names outside models.mjs: 0` (18 Nov 2026).

## 6. CI — the neutral machine

Read with curl, no token (`GET /repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`):
- `f2ce75c` (step 1): both legs cancelled — superseded by the next push (`suite.yml` concurrency).
- `614e93c` (the witness): workflow run `44411760994` · `135181584509` npm test · node 22 → **success** ·
  `135181585044` npm test · node 24 → **success** (18 Nov 2026).
- Later pushes: their run ids are in `ci/mfac/LEDGER.jsonl` (act `ci-read`) and in the seat's final message.

## 7. Where the spec and the ruling differ (THE RULING WINS)

| Spec (`ci/mfac/MFAC_SPEC.md`) | Ruling (row 1069) | Built |
|---|---|---|
| N3 W2.4: `may --act land` NO while `land.mjs count` is not READY | ADDED (ii): no landing at night | `may --act land` is ALWAYS `NO land-attended`; `night.mjs` reads and names no landing verb |
| §1: `mark --kind … landed …`; N5 line carries `<n> landed` | ADDED (ii): land-ready is the ceiling | `mark --kind landed` is REFUSED; the line says `<n> land-ready (no landing at night)` |
| §4: the `.gitignore` line is a fork | ADDED (i): ignored, by his pick | built |
| F4: three options | F4 A + the placeholder that refuses | §2 above |
| N2: `.claude/skills/runner/SKILL.md` gains THE NIGHT | F10 A + ADDED (iv): text only, lane S lands it | not edited; §8 below |
| N2 W2.1: GO needs armed ∧ no sitting ∧ memory ∧ no red | (not ruled) | also needs a `begun` row — a launch is the runner's act after `begin` (stricter; FORK 4) |

## 8. RUNNER SKILL NIGHT TEXT

For lane S to land in `.claude/skills/runner/SKILL.md` (this seat did not edit it):

> ### THE NIGHT (unit mfac · row 1069)
> The night is armed by HIS day end, never by you: `day.mjs end` writes the armed row through `node scripts/night.mjs arm`.
> 1. **Hold.** While you have nothing in hand, hold on `node scripts/night.mjs wait --since <iso of your last begin>` in a
>    Monitor (or an until-loop on `wait --once`). It is a shell process the harness watches: zero tokens while it waits. It
>    exits 0 the moment a night is armed and not yet begun.
> 2. **Begin.** `node scripts/night.mjs begin --runner runner`. Then your FIRST ACT checks that apply to a live session.
> 3. **Before every launch** ask both halves, and launch only on two GOs: `node scripts/night.mjs may --act launch` (the
>    organism's half: armed, begun, not stopped, no red, no sitting open, free memory at or above the F4 line) AND the
>    campaign's own gate (pool reading inside the launch rule's age line, the pool table, `his_words.mjs tail`).
> 4. **Mark every act:** `night.mjs mark --kind launch|return|land-ready|fork|red --unit <id>`. The furthest a night goes is
>    `land-ready` (a DRY pass of the landing verb). **Never land at night** — `may --act land` answers NO until a row grants
>    unattended landing.
> 5. **Stops** (one row each, `night.mjs stop --reason <r>`): `pool` when the pool reading ages past the launch rule's own
>    line (F3 A; B waits for unit mpool) · `memory` (`may` writes it itself) · `red` (`mark --kind red` stops the night,
>    F5 A) · `context` when your own context reaches its rotation line · `his-word` on any word of his · `done` when the
>    queue is empty. A fork outside your class is `mark --kind fork`: that thread waits for the architect, the night goes
>    on (F6 A). After any stop, run THE PAUSE's soft half and hold silent.
> 6. **The morning is not yours.** His `/learn` closes the night (`day.mjs start` → `night.mjs close`) and prints ONE line;
>    at most ONE card (`night:<D>`) waits for him when a land-ready unit or a fork does. Never print the night to him
>    yourself.
> 7. **If you were not alive at the day end** nothing spawns you (F2 A): the morning line says `never begun`.

## 9. FORKS (files beyond the named ones, or choices the rulings did not make)

1. **Suite membership.** The brief names `organism_test.mjs` for "night.mjs selftest joins the hermetic chain", but the
   chains live in `package.json` (`scripts/organism_test.mjs:290-318`). Without a membership, the coverage law would
   list `night` as an orphan. Built: `OWN_MEMBERS` in `organism_test.mjs` (counted once, judged by `suites()`; a
   package.json listing as well would be a dupe and red). The alternative: one `node scripts/night.mjs selftest` link in
   the `organism:selftest` chain of `package.json` (not a named file) and `OWN_MEMBERS` removed. The architect's call.
2. **The card's reason.** `captains_call.mjs`'s `WHY_CODE_CANNOT_DECIDE` has no `night:` prefix, so `night.mjs` passes
   `--why-code-cannot-decide` per call. A `night:` entry in that table is a `captains_call.mjs` edit (not named).
3. **The campaign half** (ADDED (iv), lane M): the runner's hold on `night.mjs wait`, and `night.mjs may --act launch`
   before each launch in the campaign's launch leg. Not in this repository (F7 A).
4. **`may` needs a begun row** (stricter than the spec's W2.1). If a launch before `begin` is ever wanted, that is a row.
5. **The learn start closes the night even when the sitting fails to open** (`scripts/day.mjs:111` sits before the
   `!r.ok` return): his study start is the closing act, not the sitting's success (F9 A read as "never waits").
6. **`wait` is event-driven** (`fs.watch` on the state dir; no poll interval typed). On a filesystem where watch events do
   not arrive, the runner's Monitor uses `wait --once` in an until-loop. Measured here on Linux only (NAMED 4).
7. **The witness's free-memory plant** is honoured only behind the `ARSENAL_NIGHT_STATE_DIR` seam
   (`ARSENAL_NIGHT_FREEMEM_MB`, `scripts/night.mjs` `main`), so no live run can be fed a fake reading without also moving
   its state dir.
8. **`day.mjs`'s header list** ("THE END, in this order") is not updated with step 5a — the brief allowed the two steps
   and nothing else in that file; the step itself carries its comment.
9. **Branch name.** The session harness named `claude/mfac-queue-receipt-pe47e1`; the brief names `claude/mfac-build`.
   Built and pushed on `claude/mfac-build` (the brief's word).

## 10. NAMED, NOT GUESSED

1. Rows 1069 / 1081 / 1080 / 1053 themselves: the ruling queue is outside this repository; I worked from the brief's text.
2. The blind-rail free-memory rows (the F4 value) live on his laptop.
3. `hooks/pre-commit` did not run on these commits (`core.hooksPath` unset in this container).
4. The witness and the mutants ran on Linux (node 22) only; the Windows path (`powershell.exe` process listing,
   `claude.cmd`) is written but not measured here. The neutral machine runs the suite, not this witness.
5. The memory MCP did not connect in this seat; nothing here rests on it.

## 11. FOLLOW-UP — forks row 1100 (19 Nov 2026, UTC)

Tip `c073089` adopted (the architect's Windows re-run: witness GREEN 25, base RED 22). Then, on this branch, new commits
only, never a force push:

1. **Merge.** `git merge 902b6cc` (unit mpool on main) → merge commit `1371611` (parents `c073089`, `902b6cc`). The one
   conflict was `scripts/day.mjs` `start()`: both owner calls run — mpool's `usage_tap.mjs need` first (its `pool:` note
   rides the start line), then the night's `close` (its ONE line rides as the second line). mpool's own witness
   (`ci/mpool/witness_mpool.mjs` from `claude/mpool-build`, `--base-org` main `3824171`) on this build: **clause D GREEN**;
   its `WA.i` and `S` read RED on this build AND on main `902b6cc` alike (they need the settings line, which is not on
   main), so they are not this merge's.
2. **FORK 1 ruled the package.json way.** `node scripts/night.mjs selftest` joins the `organism:selftest` string of
   `package.json` (after mpool's `usage_tap.mjs`); `OWN_MEMBERS` is gone and `scripts/organism_test.mjs` is byte-equal to
   main's again. Witness W7.
3. **FORK 8.** `scripts/day.mjs`'s header list names step 5a (`scripts/day.mjs:37-38`). Witness W8.
4. **THE NIGHT** (the text of §8) is in `.claude/skills/runner/SKILL.md` as `## THE NIGHT`, before CLOSE / ROTATION,
   merged onto main's copy with mpool's two lines kept. Witness W8.
5. Forks 2, 4, 5, 6, 7 stand as built; the F4 floor stays the refusing placeholder `FLOOR_UNSET`.

**Named files now:** `scripts/night.mjs`, `scripts/day.mjs`, `package.json`, `.claude/skills/runner/SKILL.md`,
`.gitignore`, `ci/mfac/` (`scripts/organism_test.mjs` no longer differs from main).

**Witness both ways (19 Nov 2026), base = main `902b6cc`:**
- Build: `GREEN MFAC the night armed by the day end, held to its stops, closed by the learn start in ONE line · 28 clause(s)`
- Base: `RED MFAC · F4 W1.1 W1.2 W6.2 W1.3 W1.4 W1.5 W2.1 W2.4 W2.2 W2.3 W3.1 W3.2 W4.1 W4.2 W4.3 W4.4 W4.5 W5.1 W5.2 W5.5 W5.3 W5.4 W7 W8 W9`
  (BOUND and LAST GREEN on both sides).

**Mutants (19 Nov 2026):** `run_mutants: 28 of 28 mutant(s) RED by the clause that names them · control GREEN`
(new: W7 the suite link dropped · W8 the skill's land ceiling reworded · W9 the merge drops the pool note).

**Suite (19 Nov 2026, hermetic, this build):** `organism_test: 145 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126` —
`SUITE MEMBER · night selftest exits 0` and `MPOOL · usage_tap selftest … exits 0` both pass; the one red is the base's
coverage orphans line with its detail unchanged. `node scripts/night.mjs selftest` → `22 passed, 0 failed`.
CI for the pushes of this follow-up: `ci/mfac/LEDGER.jsonl` (act `ci-read`) and the reply to the architect.
