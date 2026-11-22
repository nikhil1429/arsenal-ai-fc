# MAUD43 PROOF — the rebuild verb, built (22 Nov 2026)

> Unit **maud43**, BUILD ORDER of runner M (22 Nov 2026 10:42 IST). The ruled spec is `ci/maud43/MAUD43_SPEC.md`
> (accepted, row 1286; its two named choices ruled YES, row 1286 (1) / (2)). Branch `claude/maud43-build`, cut from main
> **d585648e3438147d97140248c69f900af7327d58** (mbank landed, row 1284), recorded in `ci/maud43/BASE`. The cut was taken
> with `core.autocrlf false` and `core.eol lf` set before the checkout, after an explicit
> `+refs/heads/main:refs/remotes/origin/main` fetch. `ci/maud43/` was carried from `claude/maud43-spec` 5e33567.
> **Not a landing. The verb was NEVER run on live state:** every run below is against a tree planted under `os.tmpdir()`.
> The dry run and the `--apply` on his laptop are the runner's hand (spec §7).

## 1 · WHAT WAS BUILT (one file, `scripts/teaching_audit.mjs`)

- **The verb** `rebuild-mismatch --from <ISO> --to <ISO> [--apply]` (dispatcher `:3093`, usage line `:3094`). It is a dry
  run unless `--apply` is given. With either bound missing or not parsing, it reads nothing and exits 2.
- **`rebuildPlan`** (`:2963`) is pure over what it is handed: the log text, the per-session record, the window, and a file
  reader. Its helpers:
  - `turnAt` finds the last human prompt stamped before the row, inside ONE file;
  - `stopView` builds the Stop-time view and the Stop message (row 1283 (2));
  - `rowIdOf` gives the sha256 of the old line.
- **`rebuildMain`** (`:3048`) reads the log and the record, plans, and prints ONE counts line. Under `--apply` it appends
  through `appendLogReal` only. `written` is MEASURED by re-reading the log, and the verb exits 1 if any row failed to
  land.
- **`transcriptOf`** (`:1653`) is the one expression that names a session's file. The stub keeper `transcriptAlive` and
  the verb both read it; it is behaviour-neutral for `transcriptAlive`.
- **The header** carries one paragraph naming the verb (`:82-85`), and the section's own header block (`:2916`) states the
  join, the cross-check, the shared-turn rule, what is written and what is refused.
- **What the verb never does.** It calls no `contractCall` / `autoHit` / `stampChecked` / `writeLastReal` (W11), so a
  rebuilt drift never auto-counts. Its rows carry no `ts` / `scope` / `drifts` key (W10). Both ruled choices are fields on
  every rebuilt row: `shared_turn_source` and `stop_message_source`.

## 2 · THE WITNESS, both legs (22 Nov 2026)

The base tree is `git archive d585648`, extracted under the seat's scratch directory with `node_modules` linked.

```
$ node ci/maud43/witness_maud43.mjs --org . --base-org <d585648 tree> --bound-base d585648
GREEN MAUD43 the session-mismatch turns rebuild once from their own session's file, appended, latched, unread by the rankers, never auto-counted · 15 clause(s)
```

Each of W1-W14 holds on the build and FAILS on base d585648 (there the verb is unknown and only the usage line prints).
BOUND is the fifteenth clause: `git diff --name-only d585648 HEAD` names only `scripts/teaching_audit.mjs` and
`ci/maud43/`. Every clause plants its own state dir and HOME under `os.tmpdir()`, and spawns the verb with
`ARSENAL_AUDIT_STATE_DIR`, `HOME` / `USERPROFILE` and `ARSENAL_AUDIT_NO_SPAWN=1`. The witness's `run` refuses any state
dir outside its own temp dir. No port, no service, no POST, no model call.

## 3 · THE MUTANTS (22 Nov 2026)

```
$ node ci/maud43/run_mutants_maud43.mjs --org . --base-org <d585648 tree>
run_mutants: 14 of 14 mutant(s) RED by the clause that names them · control GREEN
```

M1 his words from the shared slot · M2 the old row rewritten in place · M3 a lost row not latched · M4 an empty latch ·
M5 the dry run appends · M6 the FIRST prompt before ts · M7 the `< ts` bound dropped · M8 the cross-check removed ·
M9 the per-session record ignored · M10 the rebuilt row carries ts / scope / drifts · M11 the drift staged through
autoHit · M12 the locator reads every transcript of the folder · M13 one rebuilt row per old row · M14 `new_idea` read with
an empty message over the whole turn. Each is RED by its own clause only (`--only <id>`).

## 4 · THE GATES, on this LF tree (22 Nov 2026, `node_modules` from `npm ci --ignore-scripts`)

```
$ node scripts/gates.mjs report        # base d585648, before the build
gates types  · 21 organ(s) @ts-check'd (baseline 14, may only grow) · undefined-symbol family 0 (must be 0) · other checkJs diagnostics 296 (baseline 296, may only fall)
gates lint   · 344 error(s) · 2 warning(s) · no-empty 262 · no-unused-vars 82 · (directive) 2 (frozen: no-empty 262 · no-unused-vars 82 · warnings 2)
gates: GREEN — nothing rose, the undefined-symbol families are 0 on both sides, and every schema'd state file matches
$ node scripts/gates.mjs report        # the build
gates types  · 21 organ(s) @ts-check'd (baseline 14, may only grow) · undefined-symbol family 0 (must be 0) · other checkJs diagnostics 296 (baseline 296, may only fall)
gates lint   · 344 error(s) · 2 warning(s) · no-empty 262 · no-unused-vars 82 · (directive) 2 (frozen: no-empty 262 · no-unused-vars 82 · warnings 2)
gates: GREEN — nothing rose, the undefined-symbol families are 0 on both sides, and every schema'd state file matches
```

The checkJs count is 296 on both sides, and no lint count rose. No baseline was touched and nothing was ignored. The
297 red of the spec branch was mbank's `scripts/organism_test.mjs:2549`; on main d585648 it reads 296.

## 5 · THE ORGAN AND THE SUITE (22 Nov 2026)

```
$ node scripts/teaching_audit.mjs selftest
ALL CHECKS PASSED (153 passed, 0 failed)
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
organism_test: 170 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)
```

## 6 · THE PLANTED-TREE DRY RUN (22 Nov 2026)

The tree: five session-mismatch rows under `os.tmpdir()`. One session has no file, one row fails the `seen` cross-check,
two rows reach one turn, and one session's two `new_idea` readings differ (W14's shape). The command, with
`ARSENAL_AUDIT_STATE_DIR` / `HOME` / `USERPROFILE` pointed into that tree and `ARSENAL_AUDIT_NO_SPAWN=1`:

```
$ node scripts/teaching_audit.mjs rebuild-mismatch --from 2026-11-17T00:00:00+05:30 --to 2026-11-22T00:00:00+05:30
rebuild-mismatch · window 2026-11-17T00:00:00+05:30..2026-11-22T00:00:00+05:30 · candidates 5 · paired 3 · turns 2 (shared 1, rows 2) · lost 1 · unpairable 1 (no prompt 0 · cross-check 1 · unreadable 0) · already 0 · drifts found 0 · DRY RUN: nothing written
```

It agrees with the spec's laptop count command on the same plant (`PAIR 3 · CROSS-CHECK FAIL 1 · SHARED TURNS 1 (rows 2) ·
no file 1 · distinct turns reached 2`). On his laptop, the runner's C3 under the Stop-time reading (row 1285) says the dry
run should read `candidates 47 · paired 47 · turns 41 (shared 6, rows 12) · lost 0 · unpairable 0`. Its `drifts found` is
measured there, by the runner's hand.

## 7 · STILL THE RUNNER'S (spec §7)

On his laptop, by the owner CLI, once: the dry run first (its line quoted into the landing row beside C3), then `--apply`
once. Nothing here ran against his state.

CHECKPOINT · BUILT at 2026-11-22 (UTC) on claude/maud43-build · witness GREEN (W1-W14 + BOUND) · mutants 14 of 14 RED ·
gates 296 = baseline, lint unchanged · resume from: the neutral machine's verdict on this tip, then the landing row
(runner) and the laptop run (§7)
