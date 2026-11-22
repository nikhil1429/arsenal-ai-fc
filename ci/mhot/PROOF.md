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

## 10 · THE BOUND SPLIT (forks row 1200 (2)-(3), a standing class — runner M's message, 2026-11-20)

**Where the design holds it.** The member files replace the strings, but the thing that judges a unit's landing is still
its unit witness. In `ci/mhot/witness_mhot.mjs`:

- the clauses H1-H9 take `--base-org`, the tree of the commit `ci/mhot/BASE` names (red there, green on the build);
- BOUND takes `--bound-base`, the tree of the PARENT of the land commit, and falls back to `--base-org` only when it is
  absent (`const BOUND_BASE`, `function bound(from = BOUND_BASE, to = ORG)`);
- BOUND finds the unit's two in-file edits by ANCHOR in the bound base, not by line number: in `package.json`, the six keys
  `_selftest_coverage_law` … `_runner_law` (lines 17-22 at `5759cce`); in `scripts/audit.mjs`, the `"suite members"` block
  (lines 582-587 at `5759cce`). A main that moved shifts those lines, and the old numeric check would have read the shift
  as foreign;
- `ci/mhot/BASE` is never rewritten. The neutral suite member still passes only `--org` / `--base-org` and drops BOUND by
  its F1 A rule; a hand run after a rebuild passes `--bound-base <LF tree of the land commit's parent>`.

The member files themselves add no bound of their own: `suite/members/*.json` is one named pattern in the BOUND set, and the
roll's reader (`suiteRoll`) is judged by the clauses against BASE, so the split carries through unchanged.

**The plant, clause HB.** The witness runs itself as a child over three planted trees under its temp root. P stands for a
land commit's parent: BASE's `package.json`, `audit.mjs` and `suite.yml`, plus two paths another unit landed. L is the
rebuilt land commit: P plus this unit's own edits. L2 is L plus one unit path outside the named files.

```
$ node ci/mhot/witness_mhot.mjs --org <LF tree of this commit> --base-org <LF tree of 5759cce>
  ok   HB · THE BOUND SPLIT (row 1200 (2)-(3)), planted · land vs parent: GREEN MHOT the member roll · 2 clause(s) · land vs BASE: RED MHOT · BOUND (the foreign paths named) · land+outside vs parent: RED MHOT · BOUND (names the outside path)
  ok   BOUND · against the BASE tree · 134 file(s) differ · beyond the named: none · package.json only its six law/suite keys: yes · audit.mjs only its suite-members block: yes
GREEN MHOT the member roll · 12 clause(s)                                    (exit 0)
$ node ci/mhot/witness_mhot.mjs --org <LF tree of 5759cce> --base-org <LF tree of 5759cce>
RED MHOT · H1, H2, H3, H4, H5, H6, H7, H8, H9                                (exit 1)
$ node ci/mhot/run_mutants_mhot.mjs --org <LF tree of this commit> --base-org <LF tree of 5759cce>
  ok   M-HB · BOUND judged against BASE again (the bound base ignored: row 1200 (2)-(3)'s split undone) → exit 1 · RED MHOT · HB
run_mutants: 12 of 12 mutant(s) RED by the clause that names them · control GREEN
```

HB is a guard like BOUND and LAST: it is judged on the build only. It tests the witness's own split, which exists in no
base tree.

## 11 · THE MERGE OF MAIN cebe3eb (units mlaw + mcov) — forks rows 1201 / 1187 (2) / 1181 (2) / 1200 (2), 2026-11-20

Merge commit `aae4d51` (parents `e0630cd`, this branch, and `cebe3eb`, main), a merge commit, never a rebase.
`ci/mhot/BASE` is unchanged (`5759cce`): the clauses are judged against it, and BOUND against the parent `cebe3eb`. The
earlier stop (fork MHOT-M1, LEDGER) was withdrawn by runner M under row 1201. Every conflicted hunk was resolved by keeping
both intents, and none had two intents that could not both hold.

**Hunk 1 · `package.json`, the conflicted file's lines 17-31 (the six keys at lines 17-22 of each side).**
- *Main meant:* unit mlaw appended `node scripts/done.mjs selftest`, and unit mcov appended `deck_lint`, `home_pin`, `probe`
  and `study_scope`, to the `organism:selftest` string. Main left the three law prose keys unchanged.
- *This unit meant:* the three suite scripts are `node scripts/organism_test.mjs chain <suite>`, written once, and the
  prose names the member files (F7 A, F8 A).
- *The result keeps both:* this unit's six lines stand, and the union of both member sets is taken in the member-file
  shape: five new files, `suite/members/{done,deck_lint,home_pin,probe,study_scope}.json`, each `organism:selftest` with argv
  `["selftest"]`, exactly the command main's string held. The union is checked by `organism_test.mjs coverage` on the merged
  tree, where every organ with a selftest is wired and none is double-billed.

**Hunk 2 · `scripts/organism_test.mjs`, the `LIVE_SELFTESTS` table, the conflicted file's lines 110-150.**
- *Main meant:* unit mlaw deleted the `lawpack` line (row 1137 (2) F2 A: its verdict reads no state byte, so it rides the
  hermetic profile) and left a two-line comment in its place.
- *This unit meant:* the table is folded into the member files (F1 B), and only a non-member's reason may stay in it.
- *The result keeps both:* the folded table stands; mlaw's comment is kept in it, verbatim, with one line saying where the
  removal now lives: `suite/members/lawpack.json` carries `live: null`, so lawpack runs in the hermetic profile exactly as
  mlaw intended. mcov made `home_pin` a member, so its reason moved byte-equal from the residual table into
  `suite/members/home_pin.json`, and the table holds no line (fork F10 is closed by mcov's landing; coverage's
  "one place" assert holds).

**Merged clean, kept as is:** mcov's `MEMBER_BOUND_MS` and its named kill (`redWhy`) inside this unit's roll-walking
`suites()`; the identical-command key now carries the member bound (`runKey`), which hermetic()'s loop and suites() share.

**This unit's own witness, re-cut on the merged tree (named files only):**
- H7, an ADDED edit holding the same property: ~~every LIVE reason byte-equal~~ → nothing HIDDEN and nothing LOST. A
  member's reason is base's byte-equal or `null`: a later unit that made a member run in the hermetic profile made the net
  stricter (mlaw's lawpack). A reason that changed text, or a member that became LIVE, is still red. A non-member base
  reason is found in the table or byte-equal in the member file a later unit gave it (home_pin). This settles F11 without a
  later re-cut, and it holds in the neutral member, which hands no parent tree.
- `run_mutants_mhot.mjs` hands `--bound-base` through to every witness run. M-HB (the split undone) reads `RED MHOT · HB,
  BOUND` when a real parent carrying foreign landed paths is handed in, because the one fault is seen by the plant and by
  the live bound. The runner accepts that pair for M-HB only, and only when `--bound-base` is given.

```
$ node ci/mhot/witness_mhot.mjs --org <LF 9fd9cff> --base-org <LF 5759cce> --bound-base <LF cebe3eb>
  ok   H7 · build GREEN · base RED · …  build: 124 base member(s) · lost 0 · changed 0 · un-LIVEd since (stricter) 1 (lawpack) · non-member LIVE reasons lost 0
  ok   BOUND · against the bound base (the land commit's parent) · 139 file(s) differ · beyond the named: none · package.json only its six law/suite keys: yes · audit.mjs only its suite-members block: yes
GREEN MHOT the member roll · 12 clause(s)                                    (exit 0)
$ node ci/mhot/witness_mhot.mjs --org <LF 5759cce> --base-org <LF 5759cce>
RED MHOT · H1, H2, H3, H4, H5, H6, H7, H8, H9                                (exit 1)
$ node ci/mhot/witness_mhot.mjs --org <LF 9fd9cff> --base-org <LF 5759cce>          # the neutral member's view: no parent
RED MHOT · BOUND                     (the paths mlaw and mcov landed read foreign against BASE; the member drops BOUND, F1 A)
$ node ci/mhot/run_mutants_mhot.mjs --org <LF 9fd9cff> --base-org <LF 5759cce> --bound-base <LF cebe3eb>
run_mutants: 12 of 12 mutant(s) RED by the clause that names them · control GREEN
$ node scripts/lawpack.mjs gate | head -1          # clone at 9fd9cff, and the same at cebe3eb: equal on every count
findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
$ node scripts/models.mjs check ; echo $?          # clone at 9fd9cff
models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)
0
```

**FORK MHOT-M2 · two newly landed witnesses read the chain strings** (files beyond this unit's named set, so measured and
not edited). Each was run on the merged tree and, as the control, on main `cebe3eb` itself, both against its own BASE, in
this container:

```
ci/mcov/witness_mcov.mjs   at cebe3eb: RED MCOV · BOUND, C2 HERMETIC, C5 ONE RECORD
                           at 9fd9cff: C1 COVERAGE, C6 SLOW-GREEN, C7 HANG-NAMED also red — its plants add mcov_slow / mcov_hang
                           by appending to the organism:selftest string (witness_mcov.mjs:92), which the build no longer reads
ci/mlaw/witness_mlaw.mjs   at cebe3eb: RED MLAW · JUGAD · SURFACES · HERMETIC · RISE · NOLINE · BOUND
                           at 9fd9cff: COVERAGE also red — "a package.json suite string runs it: NO" (done is a member file now)
```

The reds shared by both columns are this container (no git in the planted trees, `acorn` not loadable from a planted
tree) and the BOUND class, not the merge. The four new reds are the F6 class exactly: a landed witness that reads the
strings. In the neutral `witnesses` member, the head runs each against its BASE, so ‹mcov› and ‹mlaw› will red there on
this branch until they are re-cut. *Options:* A re-cut both in place as ADDED edits, F6 A's shape (mcov: plant by the
tree's door, the member file when `suite/members` exists, and count the roll in C1; mlaw: count `roll --json` beside the
strings in COVERAGE), by this seat under a row that names the two files · B a KNOWN_RED entry each, until their units
re-judge · C their own seats re-cut (row 1187 (3)'s rule, read as covering landed units too).

**The suite, like for like** (clones made with `core.autocrlf=false`, `node_modules` linked, 2026-11-20):

```
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      # clone at cebe3eb (main, the parent)
organism_test: 154 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 124 (hermetic: named, not run)
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      # clone at 9fd9cff (the merge + the H7 re-cut)
organism_test: 158 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 124 (hermetic: named, not run)
   the same two reds by name (the clone's sandbox canary: SUITE MEMBER sandbox and the all-members assert), the same LIVE
   list; the four added lines are this unit's four new ok asserts; every other ok/FAIL line identical
```

## 12 · THE MERGE OF MAIN 6a6bdff (unit mmeter) — forks rows 1201 / 1187 (2) / 1181 (2) / 1200 (2), 2026-11-20

Merge commit `638c520` (parents `9848bce`, this branch, and `6a6bdff`, main), a merge commit, never a rebase.
`ci/mhot/BASE` is unchanged (`5759cce`): the clauses are judged against it, and BOUND against the parent `6a6bdff`.
mmeter added no suite member (`package.json` is untouched by it), and nothing it landed reads the chain strings, the LIVE
table or `suiteMembers` (`git grep` over `ci/mmeter`, `ci/witness`, `daily_green.mjs`, `done.mjs` and its
`organism_test.mjs` diff).

**Hunk 1 (the only one) · `scripts/organism_test.mjs`, the header's `// CLI:` comment, the conflicted file's lines 29-34.**
- *Main meant:* unit mmeter added the `clauses` mode, the walk of `ci/witness/`, to the mode list.
- *This unit meant:* a second line naming the two roll verbs, `chain <suite>` and `roll [--json]`.
- *The result keeps both:* main's mode list with `clauses`, then this unit's verbs line. Both dispatches stand in code:
  `clauses: clauseWitnesses` in `MODES`, and `chain` / `roll` beside `selftest`, outside `MODES`.

```
$ node ci/mhot/witness_mhot.mjs --org <LF 638c520> --base-org <LF 5759cce> --bound-base <LF 6a6bdff>
  ok   H7 · … build: 124 base member(s) · lost 0 · changed 0 · un-LIVEd since (stricter) 1 (lawpack) · non-member LIVE reasons lost 0
  ok   BOUND · against the bound base (the land commit's parent) · 139 file(s) differ · beyond the named: none · package.json only its six law/suite keys: yes · audit.mjs only its suite-members block: yes
GREEN MHOT the member roll · 12 clause(s)                                    (exit 0)
$ node ci/mhot/witness_mhot.mjs --org <LF 5759cce> --base-org <LF 5759cce>
RED MHOT · H1, H2, H3, H4, H5, H6, H7, H8, H9                                (exit 1)
$ node ci/mhot/run_mutants_mhot.mjs --org <LF 638c520> --base-org <LF 5759cce> --bound-base <LF 6a6bdff>
run_mutants: 12 of 12 mutant(s) RED by the clause that names them · control GREEN
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      # clone at 6a6bdff (main, the parent)
organism_test: 156 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 124 (hermetic: named, not run)
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      # clone at 638c520 (the merge)
organism_test: 160 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 124 (hermetic: named, not run)
   the same two reds (the clone's sandbox canary), the same LIVE list; the four added lines are this unit's four ok asserts
$ node ci/mmeter/witness_mmeter.mjs --org <tree> --base-org <LF of ci/mmeter/BASE>     # at 638c520 and at 6a6bdff
RED MMETER · A:old-day-red, BOUND                    (identical on both: the merge moves nothing for mmeter's witness)
$ node scripts/lawpack.mjs gate | head -1            # clone at 638c520, and the same at 6a6bdff: equal on every count
findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
```

Fork MHOT-M2 (§11: mcov and mlaw's landed witnesses that read the chain strings) stands unchanged by this merge.

## 13 · FORKS ROW 1203 — the MHOT-M1 carry's two conditions (runner M, 2026-11-20) · STOPPED on (b)

**(a) lawpack left BOTH tables at unit mlaw (row 1137 (2) F2 A), and both removals are carried after the fold:**
- *The selftest, from `LIVE_SELFTESTS`:* lands in `suite/members/lawpack.json` = `{"suite":"organism:selftest","argv":["selftest"],"live":null}`.
  mlaw's two-line comment stays verbatim in the residual `LIVE_SELFTESTS` table (`scripts/organism_test.mjs:111-112`),
  with one line naming the member file (`:113-114`).
- *The mode, from `LIVE_MODES`:* this unit never folded `LIVE_MODES` (F4 A: it stays), so mlaw's removal and its comment
  merged clean. In the merged tree the table is byte-identical to main `6a6bdff`'s, `lawpack` absent, and the comment is at
  `scripts/organism_test.mjs:171`. Its "see LIVE_SELFTESTS" still points at the kept comment.
- *Measured:* in the hermetic run of the merged clone (`638c520`, §12), `SUITE MEMBER · lawpack selftest exits 0` and
  `LAW PACK — every rule file present, …` are both judged `ok`, and no `LIVE … lawpack` line is printed. That is exactly what
  main `6a6bdff`'s clone prints. Both ride the hermetic profile after the fold.

**(b) The mlaw witness beside this unit's witness, on the merged tree.** All three trees are git clones made with
`core.autocrlf=false`, because the law pack needs git and LF trees without `.git` read its counts as `?`. The trees are
`--org` = clone of `34c921b` (the merge `638c520` plus this unit's records), `--base-org` = clone of `5759cce` (both units'
BASE), and the parent = clone of `6a6bdff`. `ci/mlaw/witness_mlaw.mjs` has no `--bound-base` door, so its BOUND reads its BASE.
Under row 1200 (2) that is the class the neutral member drops.

```
$ node ci/mhot/witness_mhot.mjs --org <clone 34c921b> --base-org <clone 5759cce> --bound-base <clone 6a6bdff>
GREEN MHOT the member roll · 12 clause(s)                                    (exit 0)
$ node ci/mlaw/witness_mlaw.mjs --org <clone 34c921b> --base-org <clone 5759cce>
  RED  COVERAGE · done.mjs selftest mode present · a package.json suite string runs it: NO · the coverage law judged · orphans: none
  RED  BOUND · differs from BASE in 160 file(s): …
RED MLAW · COVERAGE · BOUND                                                  (exit 1)
$ node ci/mlaw/witness_mlaw.mjs --org <clone 6a6bdff> --base-org <clone 5759cce>      # the control: main itself
RED MLAW · BOUND                                                             (exit 1)
```

Every other mlaw clause (LEGS, JUGAD, SURFACES, HERMETIC, RISE, NOLINE, PORT, LAST) reads `ok` on both trees.

**FORK MHOT-M3 · clause `COVERAGE` of `ci/mlaw/witness_mlaw.mjs` reads RED on the merged tree** (row 1203: "if either reads
red, stop and name it as a fork with the clause name"). It is the mlaw half of MHOT-M2 (§11). The clause asks whether "a
`package.json` suite string runs" `done.mjs selftest`. After the fold, `done` is a member by its file
(`suite/members/done.json`), and the strings name no organ. The property the clause holds ("done's selftest is in a suite,
and the coverage law judged it with no orphan") is true on the merged tree: its own detail reads "the coverage law judged
· orphans: none". Only its reader is the old one. `ci/mlaw/witness_mlaw.mjs` is outside this unit's named files, so it is
not edited.
*Options:* A re-cut COVERAGE in place as an ADDED edit, F6 A's shape: the strings OR the tree's `roll --json` names
`done` with argv `["selftest"]`, by this seat under a row that names the file · B a KNOWN_RED entry until mlaw's seat
re-judges · C mlaw's seat re-cuts it. The mcov half of MHOT-M2 (C1, C6, C7) is not re-measured by this message and stands
as §11 records it.

**STOPPED here** per row 1203: the build does not return for the re-run of row 1187 until MHOT-M3 is ruled. Nothing in
code changed for this message.

## 14 · FORKS ROW 1204 — MHOT-M3 ruled option A: the mlaw witness re-cut in place (runner M, 2026-11-20)

`ci/mlaw/witness_mlaw.mjs` joins this unit's named files by row 1204, and the witness's BOUND set names it. Each re-cut is
an ADDED edit with its struck text kept, and none is a bare OR. One helper, `rollOf(tree)`, decides the shape:
- it returns `undefined` when the tree has no `suite/members` (the old shape: the strings and tables are the record);
- it returns `null` when the tree has one but its own `organism_test.mjs roll --json` cannot be read (a red, never a pass);
- otherwise it returns the roll.

**COVERAGE** (the clause row 1204 names). ~~a package.json suite string runs `node scripts/done.mjs selftest`~~ → a suite
runs it. Where the tree holds `suite/members`, the tree's own roll must name `done` with argv `["selftest"]`. Where it does
not, the old string test runs unchanged. Its detail line names which record it read.

**The other clauses that read a table literal the fold moved, checked for a vacuous pass:**
- **HERMETIC** — re-cut. It read `LIVE_SELFTESTS`'s keys through `tableKeys`. After the fold that table holds no member line,
  so two of its checks would have passed on nothing: "lawpack is not in LIVE_SELFTESTS" (empty table) and "the LIVE tables
  only shrink" (a member made LIVE in its file would be unseen). Re-cut: where a tree holds `suite/members`, its LIVE
  selftests are the residual table's keys plus every roll member whose `live` is a reason. Both checks now read the real
  set (71 on the merged tree: base's 72 minus lawpack, with home_pin counted from its member file).
- **LIVE_MODES and LIVE_ASSERTS inside HERMETIC** — not moved by the fold (F3 A, F4 A), so they are read as before.
- **JUGAD, RISE, NOLINE** run the law pack and the suite's `lawpack` mode; **LEGS** reads `ci_verdict.mjs`; **SURFACES**
  reads `done.mjs`; **PORT** reads `conductor.mjs`. None reads a record the fold moved, so none is re-cut.

**The mutants**, in `ci/mhot/run_mutants_mhot.mjs`, run over git-initialised copies (the law pack lists files with git).
mlaw's witness has no `--only`, so each mutant is judged by its red set: the mutant's set must be the control's set plus
exactly its own clause.
- **M-MLAW-COVERAGE:** `suite/members/done.json` removed. This is the one row 1204 asks for.
- **M-MLAW-HERMETIC:** `suite/members/lawpack.json` given a LIVE reason again.

**The runs** on git clones (`--org` = this commit, `--base-org` = `5759cce`, both units' BASE; the parent = `6a6bdff`):

```
$ node ci/mhot/witness_mhot.mjs --org <clone 800f57d> --base-org <clone 5759cce> --bound-base <clone 6a6bdff>
GREEN MHOT the member roll · 12 clause(s)                                    (exit 0)
$ node ci/mhot/witness_mhot.mjs --org <clone 5759cce> --base-org <clone 5759cce>
RED MHOT · H1, H2, H3, H4, H5, H6, H7, H8, H9                                (exit 1)
$ node ci/mlaw/witness_mlaw.mjs --org <clone 800f57d> --base-org <clone 5759cce>
  ok   COVERAGE · done.mjs selftest mode present · the tree's member roll (suite/members) runs it: yes · the coverage law judged · orphans: none
  ok   HERMETIC · LIVE selftests read from the table + the member roll (71) · lawpack in LIVE table(s): none · keys at --org not at --base-org: none · …
RED MLAW · BOUND                                                             (exit 1)
$ node <this commit's ci/mlaw/witness_mlaw.mjs> --org <clone 6a6bdff, no suite/> --base-org <clone 5759cce>
  ok   COVERAGE · done.mjs selftest mode present · a package.json suite string runs it: yes · …
RED MLAW · BOUND                                    (the old-shape branch holds on a tree without suite/members)
$ node ci/mhot/run_mutants_mhot.mjs --org <clone 800f57d> --base-org <clone 5759cce> --bound-base <clone 6a6bdff>
  ok   MLAW CONTROL · the unmutated copy → RED MLAW · BOUND
  ok   M-MLAW-COVERAGE · the done member file removed → RED MLAW · COVERAGE · BOUND
  ok   M-MLAW-HERMETIC · lawpack's member file given a LIVE reason again → RED MLAW · HERMETIC · BOUND
run_mutants: 14 of 14 mutant(s) RED by the clause that names them · control GREEN
```

**mlaw's BOUND** reads `--base-org` (`5759cce`), because the witness has no bound-base door. The paths mlaw, mcov and
mmeter landed read foreign there: that is row 1200 (2)'s class, which the neutral member drops. It is the same line main
`6a6bdff` itself prints (§13's control). Beyond BOUND, both witnesses are green on the merged tree, and the build returns
for the architect's re-run of row 1187.

**Still standing:** the mcov half of MHOT-M2 (§11: `ci/mcov/witness_mcov.mjs` C1, C6, C7 read or plant through the chain
string). Row 1204 rules only the mlaw half.

## 15 · THE MERGE OF MAIN b3a61c6 (unit mpres) — forks rows 1187 (2) / 1201 / 1200 (2), 2026-11-20

Merge commit `c9ecd40` (parents `a84f25f`, this branch, and `b3a61c6`, main), a merge commit, never a rebase.
`ci/mhot/BASE` is unchanged (`5759cce`): the clauses are judged against it, and BOUND against the parent `b3a61c6`.

**The one conflicted hunk · `package.json`, the six keys `_selftest_coverage_law` … `_runner_law` (lines 17-22 of each side).**
- *Main meant:* unit mpres added the member `node scripts/senses.mjs selftest` to the `organism:selftest` string, after
  `state.mjs`. It changed nothing else on those six keys: measured, the only difference between `6a6bdff` and `b3a61c6` in
  `package.json` scripts is that one added member.
- *This unit meant:* the three suite scripts are `node scripts/organism_test.mjs chain <suite>`, written once.
- *The result is the union of both member sets:* this unit's six lines stand, and mpres's member is its file,
  `suite/members/senses.json` = `{"suite":"organism:selftest","argv":["selftest"],"live":null}`. mpres added no LIVE
  reason (its diff does not touch `scripts/organism_test.mjs`). Nothing else changed. No other file conflicted.
  `ci/mpres/witness_mpres.mjs` reads no chain string.

```
$ node scripts/organism_test.mjs roll | tail -1
roll: 130 member(s) · 0 defect(s) · suite/members
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs coverage
organism_test: 13 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 0 (hermetic: named, not run)
$ node scripts/senses.mjs selftest
senses selftest: 18 passed, 0 failed                                         (exit 0)
$ node ci/mhot/witness_mhot.mjs --org <clone c9ecd40> --base-org <clone 5759cce> --bound-base <clone b3a61c6>
  ok   BOUND · against the bound base (the land commit's parent) · 141 file(s) differ · beyond the named: none · …
GREEN MHOT the member roll · 12 clause(s)                                    (exit 0)
$ node ci/mhot/witness_mhot.mjs --org <clone 5759cce> --base-org <clone 5759cce>
RED MHOT · H1, H2, H3, H4, H5, H6, H7, H8, H9                                (exit 1)
$ node ci/mhot/run_mutants_mhot.mjs --org <clone c9ecd40> --base-org <clone 5759cce> --bound-base <clone b3a61c6>
  ok   MLAW CONTROL · the unmutated copy → RED MLAW · BOUND
run_mutants: 14 of 14 mutant(s) RED by the clause that names them · control GREEN
$ node ci/mpres/witness_mpres.mjs --org <tree> --base-org <clone of ci/mpres/BASE>      # at c9ecd40 and at b3a61c6
RED MPRES · BOUND                    (identical on both: the merge moves nothing for mpres's witness; BOUND = row 1200 class)
```

CHECKPOINT · MERGED b3a61c6 at 16:27 UTC 2026-11-20 · tip = the commit that carries this line · resume from: the architect's re-run of row 1187 (the mcov half of MHOT-M2 still stands, §11)

## 16 · RESUMED (forks row 1232 (2), 2026-11-21) — the merge of main 5301f15, the removed lines, the witnesses, the legs

**1 · The merge.** Merge commit `1527a72` (parents `f9c7ed4`, this branch, and `5301f15`, main, after units mcap, mprk, mdtl,
mcrk and mherm), a merge commit, never a rebase, pushed inside the order's window. `ci/mhot/BASE` is unchanged
(`5759cce`). One conflicted hunk, `package.json`, the six keys `_selftest_coverage_law` … `_runner_law`:
- *Main meant:* two new members, `node scripts/witness_cause.mjs selftest` on `organism:selftest` and
  `node scripts/parked.mjs selftest` on `squad:selftest`. That is the only scripts difference `b3a61c6` → `5301f15`, measured.
- *This unit meant:* the chain commands, written once.
- *The result is the union:* this unit's six lines, plus `suite/members/witness_cause.json` (organism:selftest) and
  `suite/members/parked.json` (squad:selftest), both argv `["selftest"]` and `live: null`. No LIVE key was added on main.
- `scripts/organism_test.mjs` merged clean, so every landed line of every other unit stands as main has it.

**2 · Row 1204 (1), MHOT-M3 = A** is on this branch since `29f5f49` (§14): mlaw's COVERAGE and HERMETIC re-cut in place,
struck text kept, the roll where `suite/members` exists and the old string or table where it does not, with the mutant
"done member file removed" (M-MLAW-COVERAGE) and M-MLAW-HERMETIC. Their runs on this merge are below.

**3 · Row 1203 (2): every line a landed unit took out of a table is still out after the fold.** The list is derived, not
typed. Every first-parent landing of main from `5759cce` to `5301f15` is compared with its first parent, over
`LIVE_SELFTESTS`, `LIVE_ASSERTS`, `LIVE_MODES`, `KNOWN_RED` (its `assert:` names) and the member lists (the three
strings plus `suite/members/*.json`). Each removed key is then read at main and at this tip. At the folded tip a LIVE
selftest is the residual table's key OR a member file with a reason.

```
$ git log --first-parent --format=%h 5759cce..5301f15        # the landings scanned
3f22388 mlaw · cebe3eb mcov · 6a6bdff mmeter · b3a61c6 mpres · 56ed4ff mcap · b6de26b mprk · 25f13f2 mdtl · e436c17 mcrk · 5301f15 mherm
$ node <scratchpad>/removed.mjs 5759cce 5301f15 1527a72
REMOVED mlaw 3f22388 LIVE_SELFTESTS "lawpack" · at main out · at tip out
REMOVED mlaw 3f22388 LIVE_MODES "lawpack" · at main out · at tip out
REMOVED_SCAN 5759cce..5301f15 landings 9 removed 2 still-out-at-main-and-tip 2 back 0
```

At the tip, `lawpack` is a member with `live: null` (`suite/members/lawpack.json`), and `LIVE_MODES` is byte-equal to main's.

**4 · The witnesses on the merged tree** (git clones; `--base-org` = `5759cce`; the parent = `5301f15`):

```
$ node ci/mhot/witness_mhot.mjs --org <clone 1527a72> --base-org <clone 5759cce> --bound-base <clone 5301f15>
  ok   BOUND · against the bound base (the land commit's parent) · 143 file(s) differ · beyond the named: none · …
GREEN MHOT the member roll · 12 clause(s)                                    (exit 0)
$ node ci/mhot/witness_mhot.mjs --org <clone 5759cce> --base-org <clone 5759cce>
RED MHOT · H1, H2, H3, H4, H5, H6, H7, H8, H9                                (exit 1)
$ node ci/mhot/run_mutants_mhot.mjs --org <clone 1527a72> --base-org <clone 5759cce> --bound-base <clone 5301f15>
run_mutants: 14 of 14 mutant(s) RED by the clause that names them · control GREEN
$ node ci/mlaw/witness_mlaw.mjs --org <clone 1527a72> --base-org <clone 5759cce>
  ok   COVERAGE · done.mjs selftest mode present · the tree's member roll (suite/members) runs it: yes · …
  ok   HERMETIC · LIVE selftests read from the table + the member roll (71) · lawpack in LIVE table(s): none · …
RED MLAW · BOUND                                    (row 1200 class: mlaw's witness has no bound-base door)
$ node ci/mcov/witness_mcov.mjs --org <clone 5301f15> --base-org <clone of ci/mcov/BASE>       # the control: main itself
RED MCOV · BOUND
$ node ci/mcov/witness_mcov.mjs --org <clone 1527a72> --base-org <clone of ci/mcov/BASE>
RED MCOV · BOUND, C1 COVERAGE, C5 ONE RECORD, C6 SLOW-GREEN, C7 HANG-NAMED
```

**FORK MHOT-M2, the mcov half, now measured on git clones: this is what reds `WITNESS ‹mcov›` on the neutral legs.**
Each of the four is the F6 class: `ci/mcov/witness_mcov.mjs` reads or plants members through the `&&` strings.
- **C1 COVERAGE:** its plants add `mcov_slow` / `mcov_hang` by appending to the `organism:selftest` string
  (`witness_mcov.mjs:92`); the build reads member files, so they are orphans.
- **C5 ONE RECORD:** counts each organ "in exactly one suite string".
- **C6 SLOW-GREEN** and **C7 HANG-NAMED:** judge the planted members, which never become members.

No row has yet named `ci/mcov/witness_mcov.mjs` among this unit's files (row 1204 ruled the mlaw half only), so it is
measured here, not edited.
*Options:* A re-cut C1, C5, C6 and C7 in place as ADDED edits, row 1204's shape. Plant by the tree's door: a member file
where `suite/members` exists, else the string. Count the tree's roll where it exists, else the strings. Mutants:
`mcov_slow`'s planted member file removed → C6, and a second file for one organ → C5. B a KNOWN_RED entry until mcov's seat
re-judges. C mcov's seat re-cuts.

**5 · The neutral legs of `1527a72`** (workflow run 44873083652, read through the public API with no token):
`136751728064 hermetic twice · node 22 success` · `136751727827 hermetic twice · node 24 success` ·
`136751727977 npm test · node 22` and `136751727984 npm test · node 24` in progress at the time of writing (the ledger
carries their verdict when read). The previous tip `f9c7ed4` (run 44773570313): `npm test` node 22 and node 24 failure.

CHECKPOINT · RESUMED at 06:12 UTC 2026-11-21 · merged 5301f15 at 1527a72 · legs of 1527a72: hermetic twice ×2 success, npm test ×2 in progress (run 44873083652) · resume from: the npm test verdict, then the ruling on MHOT-M2's mcov half (§16)

## 17 · THE MERGE OF MAIN 7bf008b (units mdet, mdtl2, mclk) — forks rows 1226 / 1228, 2026-11-21

Merge commit `1a502c7` (parents `d90e9d4`, this branch, and `7bf008b`, main), a merge commit, never a rebase.
`ci/mhot/BASE` is unchanged (`5759cce`). Two conflicted files, both resolved keeping both intents:
- **`package.json`, the six keys `_selftest_coverage_law` … `_runner_law`.** *Main meant:* one new member,
  `node scripts/red_cause.mjs selftest` on `organism:selftest`, the only scripts difference `5301f15` → `7bf008b`,
  measured. *This unit meant:* the chain commands. *The result is the union:* this unit's six lines, plus
  `suite/members/red_cause.json` (organism:selftest, `["selftest"]`, `live: null`).
- **`scripts/organism_test.mjs`, `main()`'s verb dispatch** (beside `if (mode === "selftest")`). *Main meant:* unit mdet's
  `census` verb, a read never in `MODES`. *This unit meant:* the `chain` and `roll` verbs, also outside `MODES`.
  *The result keeps both:* all three dispatches stand, mhot's first and mdet's after.
- **Merged clean, kept:** mdet's coverage detector (`hasSelftest` → `selftestForm`, `hasSelftestLegacy` frozen), which
  `coverage()`'s roll-orphan check now calls; mdtl2's and mclk's lines. mclk's clock door: no clause of
  `ci/mhot/witness_mhot.mjs` derives a day from the clock, so none moves.

```
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs coverage
organism_test: 13 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 0 (hermetic: named, not run)
$ node scripts/organism_test.mjs roll | tail -1
roll: 133 member(s) · 0 defect(s) · suite/members
$ node ci/mhot/witness_mhot.mjs --org <clone 1a502c7> --base-org <clone 5759cce> --bound-base <clone 7bf008b>
  ok   BOUND · against the bound base (the land commit's parent) · 144 file(s) differ · beyond the named: none · …
GREEN MHOT the member roll · 12 clause(s)                                    (exit 0)
$ node ci/mhot/witness_mhot.mjs --org <clone 5759cce> --base-org <clone 5759cce>
RED MHOT · H1, H2, H3, H4, H5, H6, H7, H8, H9                                (exit 1)
$ node ci/mhot/run_mutants_mhot.mjs --org <clone 1a502c7> --base-org <clone 5759cce> --bound-base <clone 7bf008b>
run_mutants: 14 of 14 mutant(s) RED by the clause that names them · control GREEN
$ node ci/mlaw/witness_mlaw.mjs --org <clone 1a502c7> --base-org <clone 5759cce>
RED MLAW · BOUND                                    (row 1200 class: mlaw's witness has no bound-base door)
```

**The neutral legs of `1a502c7`** (workflow run 44877720834, read through the public API with no token):
`136766054402 hermetic twice · node 22 success` · `136766054349 hermetic twice · node 24 success` ·
`136766054066 npm test · node 22 failure` · `136766054386 npm test · node 24 failure`. The two `npm test` verdict
annotations (`B1_VERDICT`, head `1a502c7` over base `7bf008b`) name these as new member reds:
`WITNESS ‹mcov›`, `WITNESS ‹mprk›` and `WITNESS ‹mdtl2›` on both legs, plus `WITNESS ‹mlv3›` on node 24 only.
Earlier tips: `d90e9d4` (run 44874441824) and `1527a72` (run 44873083652): `hermetic twice` ×2 success, `npm test` ×2
cancelled, each superseded by the next push.

**Each witness red, measured here on git clones, at the merge and at main `7bf008b` (the control), against its own BASE:**

```
mcov   at 1a502c7: RED MCOV · BOUND, C1 COVERAGE, C5 ONE RECORD, C6 SLOW-GREEN, C7 HANG-NAMED      at 7bf008b: RED MCOV · BOUND
mprk   at 1a502c7: RED MPRK · COVER, BOUND                                                       at 7bf008b: RED MPRK · BOUND
mdtl2  at 1a502c7: RED MDTL2 · E1 E2 E3 E10 E11 BOUND                                            at 7bf008b: RED MDTL2 · BOUND
mlv3   at 1a502c7: RED MLV3 · BOUND                                                              at 7bf008b: RED MLV3 · BOUND
```

- **mlv3** is identical on both trees here: its node 24 red on the neutral machine (T1 IDLE, LIVE-SAFE: a worker and its
  held ports) is not from this unit's fold. Named, not chased; a re-run of the leg measures it.
- **FORK MHOT-M2, widened to three landed witnesses** (the F6 class: a landed witness that reads or plants members through
  the `&&` strings). None of their files is in this unit's named set: row 1204 named only mlaw's. Each is measured, not edited.
  - `ci/mcov/witness_mcov.mjs` **C1, C5, C6, C7** (§16).
  - `ci/mprk/witness_mprk.mjs` **COVER** (`:295-302`): counts `node scripts/parked.mjs selftest` across the suite strings,
    "must be 1". On the build it reads 0, while `suite/members/parked.json` holds it. The re-cut shape: the tree's roll where
    `suite/members` exists, else the strings.
  - `ci/mdtl2/witness_mdtl2.mjs` **E1, E2, E3, E10, E11**, all through `plantRepo` (`:136-140`). It plants `toy_member`
    by writing the `organism:selftest` string and copies no `suite/`, so on the build the planted tree has no member
    directory and the toy member never runs. The re-cut shape: where the tree holds `suite/members`, plant one member file
    per planted member (the chain strings as the build writes them); else the string.

  *Options for all three, one ruling:* A this seat re-cuts each in place as ADDED edits, row 1204's shape, under a row that
  names the three files, with one mutant each (the planted member file removed → that clause red) · B a KNOWN_RED entry
  each until their seats re-judge · C their own seats re-cut. Until it is ruled, `npm test` on this branch reds on these
  three by name, and on nothing this unit's own files cause.

CHECKPOINT · MERGED 7bf008b at 1a502c7 · 07:57 UTC 2026-11-21 · legs of 1a502c7 (run 44877720834): hermetic twice node 22 success, node 24 success · npm test node 22 failure, node 24 failure (new reds: WITNESS ‹mcov› ‹mprk› ‹mdtl2›, ‹mlv3› node 24 only) · resume from: the ruling on MHOT-M2 (mcov, mprk, mdtl2)

## 18 · RESUMED (forks row 1304 (2), 2026-11-22) — the merge of main 84cbc03, BASE moved by order, the fold, WITNESSES

**The merge.** Merge commit `87d327c` (parents `33f674e`, this branch, and `84cbc03`, main), a merge commit, never a rebase.
It came after 13 landings since `7bf008b` (mshard, mgat, mciq, mpres2, mdayv, mtrap, mt1, mbank, maud43, mq3, mjset, mdayq, mcrk2).
One conflicted hunk:
- **`scripts/organism_test.mjs`, `main()`'s verb dispatch.** *Main meant:* unit mshard's `witness-plan` verb, a read
  outside `MODES`. *This unit meant:* the `chain` and `roll` verbs. *Both kept:* mhot's, then mshard's, then mdet's `census`.
- `package.json` merged clean, and so did every other landed line (mgat's removal of `gates` from `LIVE_MODES` among them).

**BASE.** `ci/mhot/BASE` is set to `84cbc03126eddb85c7d5cf54b51610068800315c` by runner M's order under row 1304 (2). That
order postdates row 1200 (2)'s "no BASE file is rewritten" and is followed as the newer ruling. The clauses are therefore
judged against `84cbc03`, and BOUND against the same commit (the land commit's parent).

**The fold: every suite member is a member file; nothing dropped.**

```
$ node -e '<scripts of 7bf008b vs 84cbc03, per suite string: added / removed members>'
(no difference: no suite member landed in the strings since 7bf008b — 0 to fold from those 13 landings)
$ node scripts/organism_test.mjs roll --json | <count per suite>
organism:selftest 89 · squad:selftest 33 · audit:selftest 11 · total 133 · defects 0
$ node ci/mhot/witness_mhot.mjs … (H7, against BASE 84cbc03)
build: 133 base member(s) · lost 0 · changed 0 · un-LIVEd since (stricter) 0 · non-member LIVE reasons lost 0
$ node <scratchpad>/removed.mjs 7bf008b 84cbc03 87d327c
REMOVED mgat a0645d2 LIVE_MODES "gates" · at main out · at tip out
REMOVED_SCAN 7bf008b..84cbc03 landings 13 removed 1 still-out-at-main-and-tip 1 back 0
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs coverage
organism_test: 13 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 0 (hermetic: named, not run)
```

So the count folded is the whole of main's three strings: 133 members, each with its suite and argv byte-faithful (H7).
The list is `git ls-tree --name-only 87d327c suite/members/`. Of those 133, the ones landed since `7bf008b` number zero. The
ones landed since this unit's cut (`5759cce`) are the eleven folded at §11-§17:
`done`, `deck_lint`, `home_pin`, `probe`, `study_scope`, `senses`, `witness_cause`, `parked`, `red_cause`, and the moved
`lawpack` (live null) — with `home_pin` and `lawpack` counted once each.

**The witness both ways, the mutants, the WITNESSES member** (git clones; `--base-org` = `--bound-base` = `84cbc03`):

```
$ node ci/mhot/witness_mhot.mjs --org <clone 87d327c> --base-org <clone 84cbc03> --bound-base <clone 84cbc03>
GREEN MHOT the member roll · 12 clause(s)                                    (exit 0)
$ node ci/mhot/witness_mhot.mjs --org <clone 84cbc03> --base-org <clone 84cbc03>
RED MHOT · H1, H2, H3, H4, H5, H6, H7, H8, H9                                (exit 1)
$ node ci/mhot/run_mutants_mhot.mjs --org <clone 87d327c> --base-org <clone 84cbc03> --bound-base <clone 84cbc03>
  ok   MLAW CONTROL · the unmutated copy → RED MLAW · JUGAD · BOUND        (mlaw judged over this unit's BASE, not its own)
  ok   CONTROL · the unmutated witness over --org → exit 0 · GREEN MHOT the member roll · 12 clause(s)
run_mutants: 14 of 14 mutant(s) RED by the clause that names them · control GREEN
$ GITHUB_ACTIONS=true GITHUB_WORKSPACE=<clone> ORGANISM_TEST_PROFILE=hermetic ORGANISM_WITNESS_SHARD=k node scripts/organism_test.mjs witnesses   # k = 1, 2, 3
at 87d327c (59 units):  shard 1 36 passed, 1 failed · shard 2 48 passed, 2 failed · shard 3 47 passed, 5 failed   → 131 passed, 8 failed
at 84cbc03 (58 units): shard 1 38 passed, 0 failed · shard 2 47 passed, 2 failed · shard 3 46 passed, 4 failed → 131 passed, 6 failed
  witness ‹mhot› 21.3 s · GREEN MHOT the member roll · 12 clause(s)          (inside the member, at 87d327c)
```

The reds, by name:
- **"its BASE is in the clone":** ‹mr3› ‹mrf› ‹mrj› ‹mrt› ‹mrv› on BOTH trees. Their BASE commits are not in this
  container's local clone (the member never fetches): environment.
- **‹mlv2›:** red at main only, not from this fold.
- **The three new at `87d327c`:** ‹mcov›, ‹mprk›, ‹mdtl2›. This is fork MHOT-M2 exactly as §17 names it (landed witnesses
  that read or plant through the `&&` strings; their files are not named to this unit), awaiting its ruling.

CHECKPOINT · 11:22 UTC 2026-11-22 · tip = the commit carrying this line (merge 87d327c) · BASE 84cbc03 · folded 133 member files (0 new since 7bf008b) · witness GREEN 12 / base RED H1-H9 · mutants 14/14 control GREEN · WITNESSES 131 passed 8 failed at the tip (131 / 6 at main; new: ‹mcov› ‹mprk› ‹mdtl2› = MHOT-M2) · resume from: the next merge of main, and the ruling on MHOT-M2
