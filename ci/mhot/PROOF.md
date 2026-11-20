# MHOT PROOF — the suite's members become one file each

Unit **mhot**, forks rows 1172 (3) / 1187. Build seat (cloud), 2026-11-20. Branch `claude/mhot-build`. Spec:
`ci/mhot/MHOT_SPEC.md` on `claude/mhot-spec` at `099123f` (read whole; the spec branch also carries its ledger and
`ci/mhot/measure_mhot.mjs`). Where the spec and row 1187 differ, the ruling won; every difference is named in §6.
Every count below is inside a fenced command output or on a dated line (LOAD ZERO BLOCK 7).

## 1 · BASE

```
$ git fetch origin main && git rev-parse FETCH_HEAD
5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90
$ git checkout -b claude/mhot-build FETCH_HEAD          # (made from origin/main, the same sha)
$ cat ci/mhot/BASE
5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90
```

## 2 · F2's CONDITION, MEASURED FIRST — does any guard refuse a new top-level path `suite/`?

Row 1187 (1): F2 A holds only if the build measures first that no guard refuses it. Measured on 2026-11-20 in a clone of
`5759cce` under `os.tmpdir()` (made with `core.autocrlf=false`), with `suite/members/zz_probe.json` written and staged:

```
$ git check-ignore -v suite/members/zz_probe.json        exit 1 · not ignored
$ node scripts/archivist.mjs tripwire                     exit 0 · tripwire: 1 staged path(s), nothing that may not be published.
$ node scripts/freeze.mjs status                          exit 0 · freeze: NOT in force (FREEZE.md absent)
$ node scripts/rails.mjs orders --quiet                   exit 1 · rails: 3 PROBLEM(S) in the OPEN order
$ (same rails command on bare main 5759cce, no probe)     exit 1 · rails: 3 PROBLEM(S) in the OPEN order
$ git commit (core.hooksPath=hooks)                       exit 0
```

The rails gate reds identically with and without the probe (its problems are files the open order names, under
`dressing-room/`). `scripts/groundsman.mjs` `PUBLISH_ALLOWLIST` gates only the night-shift's own push (`git add -u`
over its list), never a runner's push. `scripts/land.mjs` treats only new `ci/` paths as witnesses (`WITNESS_DIR`).
**No guard refuses `suite/`: F2 A stands, no fork.**

## 3 · WHAT WAS BUILT (row 1187: F1 B · F2 A · F3-F5 A · F6 A · F7 A · F8 A · F9 A narrowed)

- `suite/members/<organ>.json` = `{"suite": …, "argv": […], "live": null | "<reason>"}`, one for each member of the
  three base strings, generated from `5759cce`'s `package.json` and its `LIVE_SELFTESTS` table by a script, never typed.
- `scripts/organism_test.mjs`: `export function suiteRoll(root)` is the one reader (a defect is named, never dropped; a
  tree with no member directory is a defect). coverage(), suites(), the hermetic LIVE lookup and the new verbs `chain
  <suite>` and `roll [--json]` read through it. The two verbs sit beside `selftest`, outside `MODES`, so `all` never runs
  them (F8 A). `LIVE_SELFTESTS` is folded into the files, with a struck record comment (L9); `suiteMembers` is retired with
  a struck comment. New asserts: each suite's npm script is `chain <its own name>`; the roll reads clean; one place for a
  LIVE reason; suites() reds an empty or defective roll and never passes "all 0 members".
- `package.json` lines 17-22 only: the three suite strings become `node scripts/organism_test.mjs chain <suite>`, written
  once; the three law prose keys rewritten once (F7 A).
- `scripts/audit.mjs` lines 582-587: the "suite members" count spawns `organism_test.mjs roll --json` (no own list).
- `ci/mfac/witness_mfac.mjs` W7 and `ci/mpool/witness_mpool.mjs` P: re-cut in place as ADDED edits (F6 A). The old
  string count stays, the tree's own `roll --json` count is added, the property ("in exactly one suite") is unchanged.
- `LIVE_ASSERTS`, `MODES`, `LIVE_MODES`, `KNOWN_RED` stay where they are (F3 A, F4 A, F5 A); their reopening triggers are
  the spec's §7.
- F9 A narrowed is the runner's rule for the interim, so this build carries no code for it.

Named files only: `suite/members/*.json` · `scripts/organism_test.mjs` · `package.json` · `scripts/audit.mjs` ·
`ci/mfac/witness_mfac.mjs` · `ci/mpool/witness_mpool.mjs` · `ci/mhot/{witness_mhot.mjs, run_mutants_mhot.mjs, BASE,
PROOF.md, LEDGER.jsonl}`. The BOUND clause holds it.

## 4 · THE WITNESS AND ITS MUTANTS

`ci/mhot/witness_mhot.mjs --org <dir> --base-org <dir>` (header = contract). The two trees are LF checkouts made through a
private index (the `lfTree` shape of the witnesses member), `node_modules` linked. Run on 2026-11-20:

```
$ node ci/mhot/witness_mhot.mjs --org <LF tree of df1d8c7> --base-org <LF tree of 5759cce>
  ok   H1 · build GREEN · base RED · DISJOINT ADD …        base: merge-tree exit 1 · CONFLICT (content): Merge conflict in package.json
  ok   H2 · build GREEN · base RED · DISJOINT LIVE …       base: merge-tree exit 1 · CONFLICT (content): Merge conflict in scripts/organism_test.mjs
  ok   H3 · build GREEN · base RED · COVERAGE …            build: three files: ok · c removed: FAIL orphaned: zz_mhot_c
  ok   H4 · build GREEN · base RED · EVERY MEMBER …        build: a ok · b FAIL · c ok
  ok   H5 · build GREEN · base RED · THE CHAIN FAST-FAILS  build: A ran · B red · C not reached · exit 1
  ok   H6 · build GREEN · base RED · ONE READER …          base:  1 copy site(s): scripts/audit.mjs:585
  ok   H7 · build GREEN · base RED · NOTHING LOST …        build: 124 base member(s) · lost 0 · changed 0 · non-member LIVE reasons lost 0
  ok   H8 · build GREEN · base RED · FAILS CLOSED …        build: suites exit 2 names the missing directory · chain exit 1 names it
  ok   H9 · build GREEN · base RED · LANDED READERS …      build: mfac W7 GREEN · mpool P GREEN (base RED) · reader literals stand
  ok   BOUND · 131 file(s) differ · beyond the named: none · package.json only lines 17-22: yes · audit.mjs only lines 582-587: yes
  ok   LAST · no node process naming the temp root survives
GREEN MHOT the member roll · 11 clause(s)                                    (exit 0)

$ node ci/mhot/witness_mhot.mjs --org <LF tree of 5759cce> --base-org <LF tree of 5759cce>
RED MHOT · H1, H2, H3, H4, H5, H6, H7, H8, H9                                (exit 1)

$ node ci/mhot/run_mutants_mhot.mjs --org <LF tree of df1d8c7> --base-org <LF tree of 5759cce>
  ok   M-H1 … M-H9, M-BOUND, M-LAST · each → exit 1 · RED MHOT · <its own clause>
  ok   CONTROL · the unmutated witness over --org → exit 0 · GREEN MHOT the member roll · 11 clause(s)
run_mutants: 11 of 11 mutant(s) RED by the clause that names them · control GREEN
```

## 5 · MEASUREMENTS (2026-11-20, by command, on LF trees)

**The suite, like for like.** Both trees are clones of this repository under `os.tmpdir()` made with
`core.autocrlf=false`, `node_modules` linked, so both legs share one environment (a clone reds `sandbox`'s canary on both,
which is the clone and not the tree):

```
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      # clone at 5759cce
organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      # clone at df1d8c7
organism_test: 151 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
   the same three reds by name and detail (coverage orphans deck_lint, home_pin, probe, study_scope · SUITE MEMBER sandbox · the all-members assert);
   the same LIVE list; the four added lines are the four new ok asserts of §3; every other ok/FAIL line identical
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      # this checkout at 5b03b03 (git, node_modules installed)
organism_test: 153 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
   (the spec measured 5759cce in the same kind of checkout: 149 passed, 1 failed, the same orphan red)
```

**The member lines.** Every `SUITE MEMBER · <organ> selftest exits 0` line of the two clone runs above, sorted, is
byte-identical base vs build (`diff` empty). The LIVE members print the same `LIVE selftest <organ> — <reason>` lines,
because each member file holds its reason byte-equal (H7).

**The touched selftests** (headline, before → after). `organism_test.mjs` has no selftest (it IS the suite, `SELF`).

```
$ node scripts/audit.mjs selftest        # clone at 5759cce
audit: 55 passed, 2 failed               (DoD (static): ROOT CANON cites 0 dead paths · … 0 stale grep claims — state-dependent)
$ node scripts/audit.mjs selftest        # clone at df1d8c7
audit: 55 passed, 2 failed               (the same two, every ok/FAIL line identical)
$ node scripts/organism_test.mjs roll | tail -1
roll: 124 member(s) · 0 defect(s) · suite/members          (= the 124 distinct organs the base audit.mjs regex counted)
```

**THE LAW PACK COUNTS** (row 1130 (2)), in the two clones:

```
$ node scripts/lawpack.mjs gate | head -1        # 5759cce
findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
$ node scripts/lawpack.mjs gate | head -1        # df1d8c7
findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
```

No count rose (both legs red `jugad-literal-subject-list` 93 against its frozen 90 identically: a base red, not this
unit's). `xray.mjs report` Q1-Q6 are equal on both clones (Q2 0, Q5 0).

```
$ node scripts/models.mjs check ; echo $?
models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)
0
```

**LOAD ZERO BLOCK 7 over the commit blobs** (row 1169) — the suite's two regexes and its three exemptions, replayed over
`git show <sha>:<path>` of every tracked `.md` outside `docs/archive/`, before every push that touches a `.md`:

```
$ node <scratchpad>/canon.mjs <sha>
CANON_SCAN <sha> files 98 declared 1 undeclared 0        (the push of this file; the ledger names each sha)
```

## 6 · WHERE THE BUILD DIFFERS FROM THE SPEC TEXT (named; the ruling wins)

1. **H8 is judged both ways.** The spec called its base side a GREEN guard; the brief requires every clause RED at base
   and GREEN at head. H8 is "the tree's own instrument, over base's package.json and no `suite/`, reds NAMING the missing
   directory": base's instrument cannot name it (RED), the build's does (GREEN).
2. **H3, H4, H5 plant by the member-file door on both trees** (their subject is that a member added by its file is
   covered, run and chained); H1 and H2 plant by the tree's own door, as the spec says.
3. **H7 is "nothing lost", a superset per suite, not set equality**, so a later unit that ADDS a member file does not red
   it at head. The argv it expects is the one base's runner ran (`test_coach_v2` bare, read from base's own special
   case). Each LIVE reason is byte-equal, strictly — see FORK F11.
4. **H9 runs mpool's whole witness** (it has no `--only`) against a planted "before usage_tap" tree built from the build
   (usage_tap.mjs and its member file removed), and reads clause P's own line. mfac runs `--only W7`.
5. **`claudegen`'s member file says `["selftest"]`.** The && string ran it bare; the authority runner (suites()) ran it
   with `selftest`; claudegen ignores its argv (`scripts/claudegen.mjs` calls `selftest()` unconditionally), so the file
   keeps the runner's command and hermetic()'s reuse key. `test_coach_v2` keeps `[]`.
6. **`chain` runs members in file-name order**, not the old string order (the spec's "walk order"). It stops at the first
   red as before.

## 7 · FORKS (each one the architect rules)

- **F10 · `home_pin`'s LIVE reason has no member file.** At base `home_pin` is in `LIVE_SELFTESTS` but in no suite string
  (one of mcov's four orphans), and hermetic()'s loop spawns every organ with a selftest, member or not. A member file for
  it would be a file beyond "one for each member of the three base strings" and would decide mcov's subject. So the table
  keeps exactly that one line, and coverage() reds a reason held in both places. Whoever gives `home_pin` a member file
  (mcov's re-cut) moves the reason into it and deletes the line. *Options:* A keep this residual table (built) · B a
  member-shaped file with no suite (`"suite": null`) for non-members · C mcov's re-cut decides.
- **F11 · H7's byte-equal LIVE reasons versus later edits.** mlaw removes `lawpack` from LIVE; after mhot lands its re-cut
  edits `suite/members/lawpack.json` (`live: null`), and ‹mhot› H7 at head will then read `lawpack` as changed. *Options:*
  A that unit re-cuts H7 as an ADDED edit (this unit's precedent for W7 / P) · B H7 judges only members whose file is
  byte-equal to this build's (needs the build's file set as a record) · C H7 is BOUND-class (dropped at head).
- **F12 · BOUND after main moves.** BOUND compares against `--base-org`. When this branch merges a new main, the files that
  main brought differ from `5759cce`, so BOUND reds against `BASE` (the witnesses member drops BOUND by its F1 A rule). The
  re-run after each merge passes `--base-org` = the new main's LF tree and names it in the ledger.

## 8 · INTERIM (row 1187 (2), F9 A narrowed — the runner's rule, recorded, not built)

Until mhot lands, the second of mcov and mlaw to land is resolved by the runner as the union of both member sets on the
one `package.json` `organism:selftest` line and nothing else, then one architect re-run of that unit witness. At mhot's own
landing every seat in flight that adds a member re-cuts to a member file (row 1187 (3)).

## 9 · CHECK RUNS

Recorded per push in `ci/mhot/LEDGER.jsonl` (read through the public API with no token). The FINAL MESSAGE names the last
push's runs and verdict.
