# PROOF: unit mtail (forks rows 1017 (2)-(5) / 1019 (1)) · branch claude/mtail-judge-tail

BASE = main **d0c8c96**, the parent of the branch's first commit 95323ab (the seat's effort key).
Build commit = **be66159**. Its five named files are unchanged after it.
Named files: `scripts/postmatch.mjs`, `scripts/sitting.mjs`, `scripts/gaffer_brain.mjs`, `scripts/brain.mjs`, `scripts/claudegen.mjs`.
Full outputs are in `ci/mtail/out/`, with one row per step in `ci/mtail/LEDGER.jsonl`.
The F-D spec is in `ci/mtail/FD_SPEC.md`.

## 1 · MEASURE FIRST (each fact at BASE d0c8c96)

| # | Fact | file:line at BASE |
|---|---|---|
| M1 | F-B: the close's judge step is `fits(JUDGE_BUDGET_MS + CHILD_TIMEOUT_MS)`, then `spawnMs(f, CHILD_TIMEOUT_MS)`. So the judge-due child's timeout can be as low as `JUDGE_BUDGET_MS`, with no `JUDGE_DISPATCH_MS` margin. The compile's reserves for the judge also count `JUDGE_BUDGET_MS` alone. | `scripts/postmatch.mjs:848-851`, `:826-838` |
| M2 | The close budget is `autocloseBudget() = READER_BUDGET_MS + JUDGE_BUDGET_MS + 3·CHILD_TIMEOUT_MS`. postmatch imports `JUDGE_BUDGET_MS` but not `JUDGE_DISPATCH_MS`. | `scripts/postmatch.mjs:398`, `:77` |
| M3 | Both exports exist in their owner: `JUDGE_BUDGET_MS`, `JUDGE_DISPATCH_MS`. | `scripts/gaffer_brain.mjs:175`, `:180` |
| M4 | F-C: the sitting CLI waits a typed **240000** ms on `/close`. | `scripts/sitting.mjs:1368` |
| M5 | The daemon's close runs, in series: `queue`, then `judge-due --trigger sitting.close`, then the pacer's `forge_session close` (conditional), then `intent close`. Each is a spawnSync at `ownerTimeoutMs` (20 s; judge verbs `JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS`). Then `session.close()`. Then the review, spawned detached and never waited. | `scripts/sitting.mjs:1005`, `:1017`, `:1025`, `:1039`, `:1051`, `:1054`, `:1061`; `:212-216` |
| M6 | The session's close grace is a typed `3000` inside `close()`. | `scripts/claudegen.mjs:557` |
| M7 | So the longest close is 20 + 330 + 20 + 20 + 3 s = 393 s, against a CLI wait of 240 s. | M4 + M5 + M6 |
| M8 | The auth literal lives at `export const JUDGE_AUTH_RE = /…/i`. brain imports it from gaffer_brain and re-exports it as `AUTH_FAIL_RE`. A string copy of the pattern sits in gaffer_brain's VOCAB-AGNOSTIC allowlist. | `scripts/gaffer_brain.mjs:1945`; `scripts/brain.mjs:91`, `:969-970`; `scripts/gaffer_brain.mjs:2919` |
| M9 | claudegen imports no organ, so it is a leaf. brain already imports it statically, and gaffer_brain imports it dynamically. | `scripts/claudegen.mjs:15-18`, `:977-978`; `scripts/brain.mjs:80`; `scripts/gaffer_brain.mjs:1616` |
| M10 | mpm F1: `captureDay` is defined, not exported, in gaffer_brain. postmatch carries a pinned copy with its own IST helper `istDayOf`. The selftest pins the two byte for byte. mpast uses `istDayOf` twice. | `scripts/gaffer_brain.mjs:1903`, `:211`; `scripts/postmatch.mjs:733-743`, `:1252-1256`, `:664`, `:683` |
| M11 | postmatch already imports gaffer_brain, so importing `captureDay` adds no edge. The depcruise no-circular count is **7** at BASE. | `scripts/postmatch.mjs:77`; `out/base_lawpack.txt` |
| M12 | F-D: the settle of the batch whose call ends at the budget runs with no budget check. Per item it can do a key-doubt card, a second opinion, a 💎 card and an owner dispatch, each card and dispatch at `JUDGE_DISPATCH_MS`. | `ci/mtail/FD_SPEC.md` §1 (D1-D15) |

## 2 · THE BUILD (be66159; the five named files, edited in place)

- **(1) F-B · postmatch.mjs.**
  - `export const JUDGE_CHILD_MS = JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS`. Both terms are imported from gaffer_brain and none is typed.
  - Every judge reserve of the close is now this value: the judge step's `fits`, and the compile's `f0`, `s0`, `f1` and `s1`. So the spawned judge-due child gets at least budget + margin. If the time left cannot cover that, the child is not started and its line reads UNSETTLED by name.
  - `autocloseBudget()` does not move.
  - The cost, named: the margin comes out of the time the earlier children leave. The compile now starts only if the archive step took at most `CHILD_TIMEOUT_MS − JUDGE_DISPATCH_MS`.
- **(2) F-C · sitting.mjs.**
  - `CLOSE_OWNER_STEPS` is close()'s own owner steps as written. `closeWaitMs()` is the sum of their `ownerTimeoutMs`, plus claudegen's `SESSION_CLOSE_MS`.
  - The CLI's `/close` wait is `closeWaitMs()`, which is 393 s. The typed 240 s is gone.
  - The selftest reads every `owner(…)` call inside close() against the list, so the list cannot drift from the code.
  - Residual, named: fs writes and the HTTP transit inside the close carry no timeout of their own. A child that ignores SIGTERM can outlive its spawnSync timeout. Neither is covered.
- **(3) The auth literal to the leaf · claudegen.mjs, gaffer_brain.mjs, brain.mjs.**
  - The ONE literal is now `AUTH_REFUSAL_RE` in claudegen, exported.
  - gaffer_brain has `import { AUTH_REFUSAL_RE } from "./claudegen.mjs"` and `export const JUDGE_AUTH_RE = AUTH_REFUSAL_RE`.
  - brain has `import { classifyLimit, AUTH_REFUSAL_RE } from "./claudegen.mjs"` and `const AUTH_FAIL_RE = AUTH_REFUSAL_RE`. Its import of gaffer_brain is removed, so brain now imports no gaffer_brain at all.
  - gaffer_brain's allowlist entry for the pattern string is removed, because the literal left that file. That is a stricter gate.
  - claudegen's `3000` close grace is now the named export `SESSION_CLOSE_MS`, the same value.
  - depcruise no-circular is 7 at BASE and 7 at build.
- **(4) mpm F1 · gaffer_brain.mjs, postmatch.mjs.**
  - gaffer_brain declares `export function captureDay`. postmatch imports it.
  - The pinned copy and its copy of the IST helper are removed. The two mpast callers of `istDayOf` now read the IST day through the owner's rule: `istDayOf = (d) => captureDay({ ts: d.toISOString() }).day`.
  - The selftest pin is replaced by checks that the imported function IS gaffer_brain's (`captureDay === gbMod.captureDay`), that postmatch defines none, that no IST-helper copy is left, and that the IST midnight is read correctly.
  - No new cycle, so no FORK.
- **(5) F-D** is a spec only (`ci/mtail/FD_SPEC.md`). Nothing of it is built.

## 3 · THE PROOF OWED

### P1 · the witness, both ways: `node ci/mtail/witness_mtail.mjs --org <tree> --base-org <BASE tree>`

The trees are LF git-archive trees of be66159 and d0c8c96, each git-initialised by `ci/mtail/sides.mjs`.

| side | last line | exit |
|---|---|---|
| build be66159 | `GREEN MTAIL the judge tail · 6 clause(s)` | 0 |
| BASE d0c8c96 | `RED MTAIL · T1 F-B · T2 F-C · T3 AUTH · T4 F1` | 1 |

BASE is RED at every clause the build feeds:
- **T1:** P1's judge child was spawned with a timeout of 307495 ms and KILLED (ETIMEDOUT) while the fake child ran 322500 ms, which is past the budget alone.
- **T2:** a 316500 ms close was aborted at the 240000 ms wait.
- **T3:** `AUTH_REFUSAL_RE` is absent, the pattern sits in gaffer_brain, and the objects are not the same.
- **T4:** `captureDay` has two definitions and postmatch does not import it.

The guards BOUND and LAST are GREEN on both sides. BOUND on the build: it differs from BASE in exactly the five named tracked files. LAST: 0 survivors and 0 fake-claude spawns.

The two time-bound plants run on a clock scaled by 100 (w_preload.mjs). It arms the organ's OWN spawnSync timeout and AbortSignal.timeout at 1/100. Every duration is derived from the trees' exports or source.

Outputs: `out/P1_build.txt`, `out/P1_base.txt`.

### P2 · selftests, BASE vs build (last lines from `out/{base,build}_*.txt`)

| gate | BASE | build |
|---|---|---|
| `postmatch.mjs selftest` | `ALL CHECKS PASSED` (82 ✓) | `ALL CHECKS PASSED` (83 ✓) |
| `sitting.mjs selftest` | `sitting selftest: 98 passed, 0 failed` | `sitting selftest: 99 passed, 0 failed` |
| `gaffer_brain.mjs selftest` | `gaffer_brain selftest: 189 passed, 0 failed` | `gaffer_brain selftest: 190 passed, 0 failed` |
| `brain.mjs selftest` | `SELFTEST FAILED` (442 ✓, 1 ✗) | `SELFTEST FAILED` (443 ✓, the same 1 ✗) |
| `claudegen.mjs` | `ALL CHECKS PASSED` (59 ✓) | `ALL CHECKS PASSED` (62 ✓) |
| `daily_green.mjs selftest` | `daily_green selftest: 75 passed, 0 failed` | `daily_green selftest: 75 passed, 0 failed` (unmoved) |
| `organism_test.mjs laws` | `organism_test: 113 passed, 2 failed · ruled 0 · UNRULED 2` | the same, with the same two FAIL lines (diff empty) |

- brain's one ✗ is `GEMINI SHIM — a spaced %APPDATA% path is QUOTED`. It is a Windows-path assertion that is RED on this Linux box at BASE as well, as recorded by unit mjud.
- The two organism_test FAILs (A9, LOAD ZERO BLOCK 2) are pre-existing.
- The mjud, mjdg, mpm and mpast clauses stay green:
  - the mjud msit clauses in sitting and in gaffer_brain;
  - the mpast and mpm F5 clauses in postmatch, where the pin clause was replaced by the import clause;
  - the mauth clause, rewritten to the leaf direction.

### P3 · mutants: `node ci/mtail/run_mutants.mjs --org <build tree> --base-org <BASE tree>`

Last line: **`run_mutants: 6 of 6 mutant(s) RED by the clause that names them · control GREEN`**.

| mutant | clause | what it does |
|---|---|---|
| m_t1 | T1 | the judge step back to `fits(JUDGE_BUDGET_MS + CHILD_TIMEOUT_MS)` |
| m_t2 | T2 | `closeWaitMs()` minus the judge budget |
| m_t3 | T3 | JUDGE_AUTH_RE restated as its own literal |
| m_t4 | T4 | postmatch carries its own captureDay again |
| m_bound | BOUND | a comment in daily_green.mjs |
| m_last | LAST | the close spawns `claude` |
| control | none | a comment-only edit of postmatch, stays GREEN |

Each mutant went RED by its own clause alone. Outputs: `out/P3_run_mutants.txt`, `out/mutant_*.txt`.

### P4 · `node scripts/models.mjs check`

`models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)`, exit 0 on both sides.

### P5 · lawpack, types, lint: BASE vs build

| gate | BASE | build |
|---|---|---|
| `node scripts/lawpack.mjs` | `lawpack: GREEN — no law's finding count rose, and every rule is on disk` | the same. The count lines are identical, and depcruise no-circular is 7 = 7 (diff empty). |
| `node scripts/gates.mjs types` | 14 organs · undefined-symbol 0 · other checkJs **296** | 14 · 0 · **296** |
| `node scripts/gates.mjs lint` | **344** errors · 2 warnings (no-empty 262 · no-unused-vars 82) | **344** · 2 (262 · 82) |

No count rises.

### Gates that cannot run here (named, not skipped)

- **The witness on Windows** was not run, because this box is Linux. It is built to port:
  - node_modules is a junction;
  - path keys use forward slashes;
  - `claude.cmd` sits beside the sh fake, and the PATH key is found case-insensitively;
  - the process list uses PowerShell CIM, with no `/proc`;
  - the fake daemon is plain node:http.
- **CI `suite`** is a note, not a gate of this unit. Every push of the branch read failure, the seat commit 95323ab (BASE + the key, no code) included, so the red is pre-existing:

  | run | commit | verdict |
  |---|---|---|
  | 44280041403 | seat 95323ab | failure |
  | 44281670611 | step 1 be66159 | failure |
  | 44282746174 | step 2 06ef187 | failure |
  | 44283351835 | step 3 6b7c1e7 | in progress at the time of writing |

  Later runs are in the final message.
- **The worktree rail** refuses a bare `git worktree add`, and the registry tool it names (`campaign-2026-09/tools/v/worktree.mjs`) is not in this repository. Each side is therefore a `git archive` tree with its own `git init` (`ci/mtail/sides.mjs`), so lawpack and organism_test read `git ls-files` on it.

### A note on the outputs (named, not hidden)

The repository is public, so committed outputs mask every word of a human commit author's name, read from git and never typed. Daemon stderr is kept outside the repo.

The first build-side outputs, in commit 6b7c1e7, were masked by HEAD's author, which at that moment was this session's own commit. One line of `out/build_brain_selftest.txt` therefore carried the person's name inside a tracked script's file name. The mask now reads every human author in recent history, and the outputs were re-run and replaced in the next commit. History was not rewritten.

## 4 · FORKS (named, with file:line; not built here)

- **F-D** is ruled spec-only here: `ci/mtail/FD_SPEC.md`, with branches B1, B2 and B3. Every branch touches `scripts/gaffer_brain.mjs` (`:2104-2236` settleBatch, `:1969-1985` judgeBatchSize). B2 also touches every caller's wait (`scripts/sitting.mjs:215`, `scripts/dugout.mjs:2064`, `scripts/postmatch.mjs` JUDGE_CHILD_MS) and `autocloseBudget`.
- **The archive step's own slot (a consequence of F-B, named).** `scripts/postmatch.mjs` (i) still spawns `archivist.mjs run` at a full `CHILD_TIMEOUT_MS` and does no fits check. An archive that uses more than `CHILD_TIMEOUT_MS − JUDGE_DISPATCH_MS` now leaves the compile UNSETTLED; it is retried at the next anchor. Bounding the archive's timeout is a ruling, not done here.
- **dugout.mjs** is not named in this unit, and its funnel already waits `JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS` (`scripts/dugout.mjs:2064`). Nothing is owed there by items 1-4.

## 5 · LANDING ITEMS

`scripts/postmatch.mjs` · `scripts/sitting.mjs` · `scripts/gaffer_brain.mjs` · `scripts/brain.mjs` · `scripts/claudegen.mjs` · `ci/mtail/` (PROOF.md, FD_SPEC.md, witness_mtail.mjs, w_preload.mjs, run_mutants.mjs, sides.mjs, gates.mjs, ledger.mjs, LEDGER.jsonl, out/).
