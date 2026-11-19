# mleft · PROOF (unit mleft, forks rows 1162 / 1163; spec ci/mwit/MWIT_SPEC.md @ 88bf69d, UNITS row 3)

**Base:** main `fb4211870093e6b8657655eb02ebcfc425f1eab1` (fb42118, measured at the cut 19 Nov 2026: `git rev-parse origin/main`),
written to `ci/mleft/BASE`. **Branch:** `claude/mleft-build`. **Tip:** named in the last section (the commit carrying this file
is judged by its own push; its sha is the branch tip the final message names).

**Named files (all new; no organ, no state file, no suite file edited):** `ci/witness/mleft/witness_left.mjs` ·
`ci/mleft/BASE` · `ci/mleft/LEDGER.jsonl` · `ci/mleft/PROOF.md` · `ci/mleft/run_mutants_mleft.mjs`.

**Stopped at 2026-11-19T12:38Z (STOP, his word 269), resumed on RESUME (his word 270)**, from the pushed tip `304d67c`, at the
step the checkpoint named. The checkpoint line is kept in LEDGER.jsonl.

## What the witness is

ONE reader: every clause spawns `node scripts/done.mjs json` (unit mdone, no edit) at its own tree's root and judges the JSON.
Exit law (spec §0): 0 holds · 1 RED · 2 UNREAD; UNREAD wins over RED (spec C:finish-zero "reports the worse, 2").

| clause | command (the receipt organ's form, `rung_receipt.mjs parseWitness`) | holds iff |
|---|---|---|
| B-left:one-command | `node ci/witness/mleft/witness_left.mjs answers --campaign <dir>` | every check of done.mjs json is COMPUTED (orphans numeric · rungs/units/census read · laws counted · ten/register/teaching neither LIVE nor unread · reach an array · not hermetic) |
| C:census-510 | `… census --campaign <dir>` | census read, PENDING 0, unfated 0, rows = the plan v3 list's `census_size` (never typed, F6 a), every row `decided_by: "code"` or `"judgement"` with a non-empty `code_cannot` |
| C:capability-c29 | `… reach --campaign <dir>` | row 1163 (5): every lane with a consumer (not NO CONSUMER, not RETIRED — read from `gate.mjs LANE_CONSUMERS`) reads `window: true` AND `reached: true`; the consumption ledger present; the campaign's plan v3 list present |
| C:finish-zero | `… finish --campaign <dir>` | orphans lanes 0 and verbs 0 · rungs g = n, u = r = x = 0, no hand row, chain holds, loops lg = ln · laws both = n · ten laws verify = n · register site = n · teaching rules counted |

Plants mode (`node ci/witness/mleft/witness_left.mjs [plants] [--org] [--base-org] [--only]`) is the suite's door (row 1162 (2)):
unit mmeter's one member runs it; this unit adds no suite edit (F11).

## The witness both ways (by last line; worktrees under os.tmpdir() made with `-c core.autocrlf=false`)

```
node ci/witness/mleft/witness_left.mjs --org <worktree fb42118> --base-org <worktree fb42118>
RED MLEFT · B-left:one-command, C:census-510, C:capability-c29, C:finish-zero          (exit 1)

node ci/witness/mleft/witness_left.mjs --org <worktree of the build> --base-org <worktree fb42118>
GREEN MLEFT what is left, read by one command — 18 plant(s) both ways · 4 clause(s) + BOUND + LAST   (exit 0, at 304d67c)
```

On the base the clauses have no command: main's `done.mjs json` exits 0 with rungs/units/census UNREAD and reach on 24 lanes all
window NO (measured 19 Nov 2026, ledger rows 4-5) — nothing on the base turns an unread or red fact into a nonzero exit.

After the c29 fix (below) the plant count rose by one (the `c29.no-plan` plant); the control run of the mutant runner reads it:

```
node ci/mleft/run_mutants_mleft.mjs
MUTANT B-left:one-command (treat rungs.read === false as answered) exit 1 KILLED · RED MLEFT · B-left:one-command
MUTANT C:census-510 (drop the row-count check) exit 1 KILLED · RED MLEFT · C:census-510
MUTANT C:capability-c29 (count static reach alone) exit 1 KILLED · RED MLEFT · C:capability-c29
MUTANT C:finish-zero (drop lanes === 0) exit 1 KILLED · RED MLEFT · C:finish-zero
CONTROL exit 0 GREEN · GREEN MLEFT what is left, read by one command — 19 plant(s) both ways · 4 clause(s) + LAST
run_mutants: 4 of 4 mutant(s) RED by the clause that names them · control GREEN
```

## Red before, through the receipt organ (row 1162 (5)) — planted, never the live receipt

The live receipt file is a state file (writer `scripts/rung_receipt.mjs`) and the plan v3 keys are campaign-side, so the real red
is recorded on his laptop by the runner. Here the organ's own door `ARSENAL_RUNG_STATE_DIR` (honoured only under os.tmpdir())
took the four commands; each recorded exit 2 (the organ refuses an exit 0), chain verified, the temp dir removed:

```
ARSENAL_RUNG_STATE_DIR=<tmp> node scripts/rung_receipt.mjs red --rung mleft --clause answers --cmd "node ci/witness/mleft/witness_left.mjs answers"
rung_receipt: red mleft:answers · exit 2 · … · last: LEFT B-left:one-command UNREAD · no --campaign (the campaign tree is his laptop's, never this repo's)
(census · reach · finish: the same, exit 2)
ARSENAL_RUNG_STATE_DIR=<tmp> node scripts/rung_receipt.mjs verify
rung_receipt: verify · 4 row(s) · chain holds
```

On the cloud every clause reads UNREAD (exit 2), never green: no campaign tree here.

## A fix found by measuring (c29)

`reach --campaign <empty dir>` first read **RED** in this cloud: the session's own SessionStart hook keeps a one-row
`consumption.jsonl` here (gitignored, untracked), so the window was judged over a cloud session's ledger, not his. The reach mode
now also requires the campaign's plan v3 list beside it (his laptop's tree) and reads UNREAD without it; plant `c29.no-plan`
holds it, and the c29 mutant still dies.

## Selftests and members touched

None. No organ is edited (done.mjs is read as built — UNITS row 3), and `scripts/organism_test.mjs` is not edited (row 1162 (2):
the suite file is unit mmeter's alone). Selftests before/after: none touched, so none to compare.

## Checks

```
node scripts/models.mjs check ; echo $?
models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)
0
```

Law pack counts (row 1130 (2)), `node scripts/lawpack.mjs gate` on LF worktrees (core.autocrlf=false), BASE fb42118 and the build:
the two outputs are **byte-identical** (`diff` empty). The count line, both trees:

```
lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)          (exit 1 on BASE and on the build alike)
```

The build raises no count (the laws scan `scripts/` and `hooks/`; this unit adds nothing there). The two reds
(jugad-literal-subject-list 93 > 90, depcruise_errors 13 > 7) are the BASE's own, named here, not this unit's to fix.

Suite, the brief's measurement, on LF worktrees of BASE and the build (`c164c07`), 19 Nov 2026 — identical on both:

```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
BASE  fb42118: organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)   exit 2
BUILD c164c07: organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)   exit 2
  · [UNRULED] EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)   orphaned: deck_lint, home_pin, probe, study_scope
  · [UNRULED] SUITE MEMBER · sandbox selftest exits 0
  · [UNRULED] all 53 hermetic suite members pass (every one RUN, not chained)
```

The same three reds stand on BASE in this worktree environment (the spec seat measured one red on its own base, 4b00cf5, in the
repo checkout); this unit adds none. The neutral machine's verdict is below.

## CI (the neutral machine; read with `ci_verdict.mjs <FULL sha>`, once per tip, never polled)

The push of `c164c079bb3b3596ba382440f5091568feeeadc4` (the c29 fix) read PENDING at 19 Nov 2026 ~18:50Z (node 22 and node 24
in progress). The final tip — the commit after the one carrying this file — and both of its legs are recorded in
`ci/mleft/LEDGER.jsonl` (act `ci`) and named in the seat's final message.

## Effort receipt

```
node campaign-2026-09/tools/effort_receipt.mjs --fleet mleft --seat 00 --model claude-opus-5-5
Error: Cannot find module '/home/user/arsenal-ai-fc/campaign-2026-09/tools/effort_receipt.mjs'   (exit 1)
```

This repository carries no `campaign-2026-09/`; nothing was written under it.

## FORKS

- **FK1 · the census size key.** The plan v3 contract (`rung_receipt.mjs PLAN_CONTRACT`) states no census size; F6 (a) says read
  it from the plan v3 list. The witness reads a new top-level `census_size` (a positive integer) from `<campaign>/rungs/plan_v3.json`
  — lane M's campaign-side writer must emit it; until it does, C:census-510 reads UNREAD. The key name is this seat's.
- **FK2 · the census row contract.** `decided_by` (`"code"` | `"judgement"`) and `code_cannot` are new fields on `census.json`
  rows; done.mjs's input contract (`scripts/done.mjs:64-67`) names `piece, fate, rung, serves_no_step` only. His census rows
  read RED until the census writer stamps them.
- **FK3 · retirement is not in done.mjs json.** Its reach rows drop `retired` (`scripts/done.mjs:245`), so the witness reads it
  from `gate.mjs LANE_CONSUMERS` (the registry's derived view) — a second read of the same table, not an edit of done.mjs.
- **FK4 · finish-zero GREEN rides a stub.** The real tree has orphan lanes and verbs (5 / 120 at the cut, 19 Nov 2026), so a zero
  state cannot be reached by real code; the zero, one-lane and unread finish plants run over a planted stub done.mjs printing a
  planted JSON. One finish plant runs the REAL done.mjs and reads RED.
- **FK5 · c29 static ∧ window.** The ruling: "reached means the window reach, never the static reach alone". Built as the spec
  designed it: `reached: true` (done.mjs: static ∧ window) AND `window: true`. A lane with window yes and static no reads RED;
  the architect may rule window alone.
- **FK6 · c29 needs the campaign's plan v3 list** (the fix above) — a guard on "this machine is his", stricter, never a green.
- **FK7 · the brief's two homes.** The generic tail names `ci/mleft/witness_mleft.mjs --org --base-org`; the UNITS row names
  `ci/witness/mleft/witness_left.mjs`. Built at the UNITS row's path, with `--org` / `--base-org` on its plants mode.
- **FK8 · the receipt's red-before.** Recorded here only through the organ's temp-dir door; the live red waits for his laptop
  (the plan v3 keys and the receipt file are his).
- **Spec vs ruling differences named:** F13 (c) held c29 (row 1162 (3)); row 1163 (5) returns it to this unit — built. The spec's
  "every unit edits organism_test.mjs" is overruled by row 1162 (2) — not edited.
