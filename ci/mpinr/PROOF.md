# UNIT mpinr · PROOF — mpin-read: the shared module `scripts/own_source.mjs` (forks row 1160 (1))

Branch `claude/mpinr-build`, cut from origin/main **fb4211870093e6b8657655eb02ebcfc425f1eab1** (`ci/mpinr/BASE`; fb42118 is
main's tip at the cut, measured by `git rev-parse origin/main`, 19 Nov 2026). The spec is `ci/mpin/MPIN_SPEC.md` at fb7c6b2.
The tip this proof is about is named in `ci/mpinr/LEDGER.jsonl` (its last rows) and in the final message, never typed here
before it exists. Every number below is a command's printed line, dated 19 Nov 2026, measured on LF clones under /tmp
(`git clone -c core.autocrlf=false`, base with `npm ci`, the build with the base's node_modules copied in).

## WHAT IS BUILT (named files only)
- `scripts/own_source.mjs` (new) — SOLE WRITER of nothing. It holds:
  - `ownCode(url, sel)`, the narrow primitive of spec §Q1, for unit mpin-narrow. Selectors are `{fn}`, `{decl}`, `{imports}`
    and `{header}`. CRLF is folded and whole-line comments are blanked. It THROWS when the anchor is missing or ambiguous, and when
    the range touches a column-0 `function selftest…(` block.
  - `CHILD_RUN_BOUND` + `childBoundMs()`, THE ONE NAMED BOUND of row 1160 (1). Its value is READ from its owner's declaration,
    `scripts/conductor.mjs:165` `const STEP_TIMEOUT_MS = …;` (mcon's selftest child bound), through ownCode. It is never typed.
  - `childRun(script, args, o)`: every child gets that bound as its timeout. A child killed at it has `killed: true`, its
    `why` reads `KILLED at the bound — …`, and `pass(pred)` is false whatever pred says. A child that never started reads `NOT RUN`.
  - `tempCopy({root})`: scripts/ copied under os.tmpdir(), with a state dir holding registry.json ONLY (mcon F6).
  - `doorGuard(box)`: a preload that records AND refuses every child_process door (mcon's guard), planted under os.tmpdir() only.
- `package.json` — the one line of row 1160 (1): `&& node scripts/own_source.mjs selftest` appended to `organism:selftest`
  (`git diff --numstat` → `1 1 package.json`).
- `ci/mpinr/` — `witness_mpinr.mjs`, `run_mutants_mpinr.mjs`, `BASE`, `LEDGER.jsonl`, this file.

## THE SPEC CLASSIFIER AT THIS CUT (spec instruments run unedited: mcon's census from 4c4feb8, classify_mpin from fb7c6b2)
```
$ node census_mcon.mjs --org <clone fb42118> --modules <base npm ci>                       (19 Nov 2026)
CENSUS MCON · 38 own-literal pin(s) in 27 assert(s) · 1 own-assert · 78 unresolved · 145 file(s) walked
$ node classify_mpin.mjs --org <clone fb42118> --modules <base> --census <census --json>    (19 Nov 2026)
CLASSIFY MPIN · 117 site(s) · same-shape 39 · own-assert 0 · honest 78 · reads-false 0 · not-evaluable 0
$ (the same two on the build clone)                                                         (19 Nov 2026)
CENSUS MCON · 38 own-literal pin(s) in 27 assert(s) · 1 own-assert · 78 unresolved · 148 file(s) walked
CLASSIFY MPIN · 117 site(s) · same-shape 39 · own-assert 0 · honest 78 · reads-false 0 · not-evaluable 0
```
- **Difference from the spec's headline** (spec Q0: 39 / 28 · 118 sites · same-shape 40, at 4b00cf5): mcon's conductor repair
  has landed on main (`land/mcon` 980e953 is under fb42118), so conductor:1601 left the class. The spec predicted exactly this
  (`with mcon's 4c4feb8 landed first: 38`).
- **The build moves no count.** The walk grows by the 3 new `.mjs` files (own_source + the two ci/mpinr scripts), which carry no
  pin. This unit adds a primitive and converts no pin; the conversions are mpin-narrow's (and FK3).

## THE WITNESS, both ways (fresh LF clones, 19 Nov 2026)
```
$ node ci/mpinr/witness_mpinr.mjs --org <clone fb42118> --base-org <clone fb42118>
RED MPINR · SELFTEST · SUITE · NARROW · KILLED · GUARD · COPY · LEAF · ONLY-NAMED          (exit 1)
$ node ci/mpinr/witness_mpinr.mjs --org <clone of the build> --base-org <clone fb42118>
GREEN MPINR own_source module · 9 clause(s)                                                (exit 0)
```
- **LAST is the one clause that is not RED on base.** It is the witness's hygiene clause ("no node process naming the temp
  root survives"). Nothing runs on base, so it reads GREEN there. It is planted both ways another way:
  - its detector must SEE a planted detached sleeper under the root before any clause runs;
  - its mutant (below) leaves a real survivor and reads RED.
- **NARROW also checks that the spec's narrow targets resolve.** One target per distinct selector of spec §Q1 (audit deal /
  runAudit, awayday TAIL_BUDGET / checkLane, dugout main / imports, forge_session header, gaffer_brain VERIFY_TIMEOUT_MS, gates
  main, mutagen coveredFiles) resolves on the judged tree and holds its pinned text: `10/10 spec targets resolve` (19 Nov 2026).

## THE MUTANTS (one per clause, 19 Nov 2026)
```
$ node ci/mpinr/run_mutants_mpinr.mjs --org <clone of the build> --base-org <clone fb42118>
  RED  SELFTEST · RED  SUITE · RED  NARROW · RED  KILLED · RED  GUARD · RED  COPY · RED  LEAF · RED  ONLY-NAMED · RED  LAST
  control — witness exit 0 · GREEN MPINR own_source module · 9 clause(s)
run_mutants: 9 of 9 mutant(s) RED by the clause that names them · control GREEN
```
- **The first run read `8 of 9`.** The runner waited for the witness with the same single bound that the witness gives each of
  its own children. Under the KILLED mutant (the child timeout removed), the mutated selftest's hanging child ran the full bound,
  so the runner killed the witness before it printed its RED (`witness exit null`). The runner now waits for the bound × (clauses + 1),
  derived from its MUTANTS list. The witness is unchanged.

## EACH TOUCHED SELFTEST, BEFORE AND AFTER (its headline line)
- own_source: before, absent at fb42118 (no `scripts/own_source.mjs`). After: `own_source selftest: 30 passed, 0 failed`
  (19 Nov 2026).
- No other organ's selftest is touched.

## THE MEMBER LINE OF EVERY MEMBER TOUCHED, BEFORE AND AFTER
Command: `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`.

| Run | Headline (19 Nov 2026) | Member line |
|---|---|---|
| base | `organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` | none |
| build | `organism_test: 158 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` | `ok   SUITE MEMBER · own_source selftest exits 0` |

- **The three reds are the same on both runs:** the selftest-coverage law (orphaned deck_lint, home_pin, probe, study_scope), the
  sandbox member, and the hermetic roll-up (it names sandbox only).
- **The 11 extra passes, by a diff of the `ok` lines** (19 Nov 2026):
  - the own_source member (+1);
  - the organs-parse count (+1);
  - BLOCK 7's file count (+1);
  - eight asserts that read the gitignored brain ledger.
- **Why the brain-ledger asserts passed only on build:** an earlier suite run in that same clone left that ignored file behind.
  It is the clone's environment, not this build.
- **A named catch.** A first build suite run (19 Nov 2026) read 4 failed. own_source's own "guard refused outside os.tmpdir()" plant
  was the scripts dir, which IS under /tmp in a /tmp clone, so it was not refused and wrote `scripts/door_guard.mjs` into that
  clone. The witness's ONLY-NAMED clause caught it.
  - The plant is now a dir that does not exist (`<parent of os.tmpdir()>/own-source-never-<pid>`), so a failed refusal can write
    nothing.
  - The re-run above is clean.
- **Named as found, outside this unit:** the sandbox member leaves `dressing-room/state/CANARY_MUST_NEVER_EXIST.json` untracked in
  the clone (spec §SUITE named the same).

## LAW M
`node scripts/models.mjs check` → exit 0 (19 Nov 2026).

## THE LAW PACK COUNTS (row 1130 (2)), `node scripts/lawpack.mjs gate` on LF trees (19 Nov 2026)
```
BASE  lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
BUILD lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
```
- **Every count is equal.** The gate is RED on both for the same two pre-existing reasons, mlaw's: jugad 93 against baseline 90,
  and depcruise 13 against 7.
- **An earlier draft raised the raw count by 4.** Its four `const x = [` arrays in own_source.mjs were jugad raw matches. They were
  removed at their cause (`flatMap`, a ternary argv, `Array.of()`), never by an ignore line.
- **`node scripts/gates.mjs report`, base against build** (19 Nov 2026):
  - the only difference is the @ts-check list, which grew 18 → 19, and that list may only grow;
  - checkJs diagnostics are 297 on both, and every lint count is equal;
  - the same 3 pre-existing REDs stand on both.

## FORKS (each written, none edited)
- **FK1 · the bound's owner (the ruling against the brief's "never type a timeout").** Row 1160 (1) has the module HOLD the ONE
  named bound.
  - The owner the house already reads for a child bound is postmatch's exported `CHILD_TIMEOUT_MS` (rung_receipt F8 (b)).
  - **Importing it would close cycles.** `npx depcruise scripts/postmatch.mjs` lists capture, examiner, intent, forge_session and
    gaffer_brain in postmatch's import closure (19 Nov 2026), and those are the organs mpin-read and mpin-narrow will make import
    this module.
  - **The plant that proves it:** own_source importing postmatch, with capture importing own_source, moved `depcruise_errors`
    13 → 16 (19 Nov 2026).
  - So own_source imports node builtins only (the LEAF clause). It holds the NAME of the bound, and reads the VALUE from conductor's
    declaration, the F5 (b) owner. Nothing is typed. If the architect would rather the value be typed once here as its owner,
    that is one line.
- **FK2 · `{header}` keeps its comments.** Spec §Q1's "every whole-line comment is blanked", read literally, would blank a header
  selector whole, and forge_session's NARROW row (#34) reads a header. Every other selector blanks.
- **FK3 · the READ edits of spec §Q4.** The spec gives mpin-read the 13 READ conversions inside the selftests of dugout, capture,
  intent, examiner and awayday. This seat's brief names only `scripts/own_source.mjs`, `package.json` and `ci/mpinr/`, so none of
  those organ files is edited here. The module carries what they need (`childRun` under the bound, `tempCopy`, `doorGuard`). Who
  makes those edits is the architect's ruling.
- **FK4 · `ci_verdict` from this container.** `node scripts/ci_verdict.mjs <full sha>` answered `403` on the check-runs read
  (19 Nov 2026). The same public URL read with plain `curl` and no token answers, so the CI verdicts are read that way and named in
  the LEDGER.
- **FK5 · the effort receipt.** `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository. Its error is named in the
  LEDGER and the final message, and nothing is written under `campaign-2026-09/`.

## NAMED, NOT GUESSED
- **N1 · Windows.** The witness, the runner and the module fold CRLF and use no POSIX shell. The witness's process list is
  PowerShell's `Get-CimInstance` on win32. Every run here was Linux; the architect's laptop re-run is the Windows measurement.
- **N2 · the LIVE selftests.** No LIVE member is touched. own_source's member is hermetic and RUNS in the hermetic profile (the
  member line above).
