# UNIT mdtl · PROOF — a red witness leaves its failing clause readable, from public bytes only (forks rows 1167 (2) / 1186)

Seat: cloud build seat `mdtlb · 00`, branch `claude/mdtl-build`, built 2026-11-20. Spec: `ci/mdtl/MDTL_SPEC.md` on
`claude/mdtl-spec` at **9d5c9b8** (read whole, with its ledger). Not a landing; nothing here merges into main.

## 1 · THE BASE

| Command (2026-11-20) | Last line |
|---|---|
| `git fetch origin main; git rev-parse FETCH_HEAD` | `5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90` |
| `cat ci/mdtl/BASE` | `5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90` |

The branch was cut with `git checkout -b claude/mdtl-build FETCH_HEAD` at that sha. It does not carry the seat branch's
`.claude/settings.json` commit.

## 2 · WHAT WAS BUILT (shape A + R2, every fork as row 1186 rules it)

- **`scripts/witness_cause.mjs` (new, SOLE WRITER of NOTHING).** It has pure exports only:
  - `idsInSource`: a clause id is a quoted literal of the witness's own tracked source, or a header claim id;
  - `claimOf`: the FIRST header claim line, at the indent of the header's own BOUND claim (derived, never typed). A `~~`
    line or a struck span is skipped (L9);
  - `causesOf`: one `{id, text}` per failing clause. Any other token becomes ONE `WITHHELD` entry and never leaves;
  - the member literals for `KILLED` and `GRAMMAR`;
  - `verifyCause`, the second check. A cause is kept only if it rebuilds byte for byte from the unit's source, or is a
    member literal; otherwise it is `WITHHELD`;
  - a `selftest` (F6 A).
- **`scripts/organism_test.mjs`.**
  - The judged assert `WITNESS ‹u› · GREEN at head against its BASE` keeps its name and detail **byte-identical**, so
    KNOWN_RED matching is untouched.
  - When it is red, its causes are pushed into a module-level `causes`, and the machine line gains `causes` **only when not
    empty**. Nothing new is printed to the log.
  - The module is loaded by `await import` guarded by `existsSync`, so a base tree measured by this instrument (the
    suite.yml fallback) has no hard dependency on it.
- **`scripts/ci_verdict.mjs`.**
  - `parseSuite` reads `causes`.
  - `compareLines` runs `causesFor` → `verifyCause` with `readSrc` = the workspace witness file (`workspaceSrc`; the pure
    default withholds everything). Each NEW witness red's existing NEW RED message becomes `name` + `%0A` + one
    `cause · <ID> · <text>` line per cause. The verdict payload gains `cause` only when it is not empty.
  - **No annotation is added.** A GREEN head's output is byte-identical (D4).
  - `readVerdict` prints `<red> — cause: <ID> · <text> ; …`.
  - Its selftest gains the mdtl fixtures.
- **`package.json`.** Only `&& node scripts/witness_cause.mjs selftest` is added to `organism:selftest`, after
  `ci_verdict.mjs selftest` (F6 A).
- **`.github/workflows/suite.yml`: untouched** (F4 B). No landed witness is edited (F3 A). Shape C is not built (F2 R2).

**WHERE THE RULING AND THE SPEC DIFFER (the ruling wins):**
- **BOUND names `package.json` too.** It is the selftest wiring of F6 A. The spec's §4 BOUND named the three scripts only.
- **The second check is STRICTER than the spec's §3.1.** The spec asked that the text be "a substring of" the source. This
  build asks that the whole cause REBUILD from the source: the id must be in `idsInSource`, and the text must equal
  `claimOf(src, id)` (or the no-claim literal). A gate may only get stricter.
- **The member's BASE / CLONE / TREES / PORT reds carry no cause line.** Their assert names are already member literals that
  say what failed, and F7 A scopes the unit to witness reds. A cause is built for the judged assert's three shapes:
  clauses, `KILLED`, `GRAMMAR`.

## 3 · THE WITNESS, BOTH WAYS (each tree an LF tree, core.autocrlf=false)

```
node ci/mdtl/witness_mdtl.mjs --org <LF tree of the build> --base-org <LF tree of 5759cce>
GREEN MDTL a red witness leaves its failing clause readable, from public bytes only · 8 clause(s)      (exit 0)

node ci/mdtl/witness_mdtl.mjs --org <LF tree of 5759cce> --base-org <LF tree of 5759cce>
RED MDTL · D1 D2 D5 BOUND                                                                              (exit 1)
```

D3, D4 and LAST are guards: they are GREEN at base by design (spec §4), and their mutants are what bite. SETUP is GREEN
whenever the --org tree's suite.yml names its bound and its head grep.

## 4 · THE MUTANTS

```
node ci/mdtl/run_mutants_mdtl.mjs
CONTROL · GREEN · GREEN MDTL a red witness leaves its failing clause readable, from public bytes only · 8 clause(s)
MUTANT D1-m · RED by D1 · compareLines drops the cause line and the payload's cause field · RED MDTL · D1 D2 D5
MUTANT D2-m · RED by D2 · the literal-of-source check is removed: any ID-grammar token is a clause id · RED MDTL · D2
MUTANT D3-m · RED by D3 · the member writes the cause into the judged detail · RED MDTL · D3
MUTANT D4-m · RED by D4 · the payload always carries cause: {} · RED MDTL · D4
MUTANT D5-m · RED by D5 · verifyCause is reduced to the grammar check only (no source rebuild) · RED MDTL · D5
MUTANT BOUND-m · RED by BOUND · suite.yml's head grep gains a widened log channel (|^  witness ‹) · RED MDTL · D2 BOUND
MUTANT LAST-m · RED by LAST · compare's module spawns a detached node that outlives its parent · RED MDTL · LAST
run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN
```

The D2-m mutant removes the literal-of-source law in BOTH places of the one module (causesOf and verifyCause). Removing it
in causesOf alone does not leak: the second check withholds the canary. That is the design of two checks in two files. The
mutant measures the law, not one copy of it. SETUP has no mutant: it is a precondition, and it is never a claim about the
build.

## 5 · SELFTESTS AND MEMBER LINES, BEFORE (5759cce) AND AFTER (the build), by command, 2026-11-20

```
node scripts/ci_verdict.mjs selftest      before: ci_verdict selftest: 21 passed, 0 failed · ALL CHECKS PASSED
                                          after:  ci_verdict selftest: 26 passed, 0 failed · ALL CHECKS PASSED
node scripts/witness_cause.mjs selftest   before: (absent: ERR_MODULE_NOT_FOUND)
                                          after:  witness_cause selftest: 11 passed, 0 failed · ALL CHECKS PASSED
```

The `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` member lines (this container, after `npm ci`):

```
before (5759cce worktree):
  ok   SUITE MEMBER · ci_verdict selftest exits 0
  FAIL all 53 hermetic suite members pass (every one RUN, not chained)      <- SUITE MEMBER · sandbox selftest (canary tripwire)
  FAIL EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)   orphaned: deck_lint, home_pin, probe, study_scope
  SKIP WITNESSES — the witnesses member runs on the neutral machine only (B2): a witness may bind ports
  organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
after (the build):
  ok   SUITE MEMBER · ci_verdict selftest exits 0
  ok   SUITE MEMBER · witness_cause selftest exits 0
  ok   all 54 hermetic suite members pass (every one RUN, not chained)
  FAIL EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)   orphaned: deck_lint, home_pin, probe, study_scope
  SKIP WITNESSES — the witnesses member runs on the neutral machine only (B2): a witness may bind ports
  organism_test: 150 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
```

The coverage-law red is the same on both sides, with the same four orphans, and witness_cause is not among them (F6 A). It
is the BASE RED the spec's M3 names. The base's sandbox red ran while the build's suite was running beside it in the same
container (a canary tripwire that counts attempts), and it is not a member this unit touches. The neutral machine judges
both legs (§10).

## 6 · THE LAW PACK COUNTS (row 1130 (2)), `node scripts/lawpack.mjs gate`, on LF trees, 2026-11-20

```
BASE  5759cce: lawpack · 1940 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
BUILD:         lawpack · 1940 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
both sides:    lawpack: 1 RED — a gate may only get stricter (§10-D rule 6)   (jugad-literal-subject-list ROSE — 93, baseline 90)
```

The raw match count first read +2 on the build. Both matches were the jugad rule's candidates on two of this build's own
lines: `const causes = []`, and a `const` holding a planted annotation in the ci_verdict selftest. Each was removed at its
cause: `causes` joins the `fails, passed` declaration, and the planted annotation is inlined. No ignore line was used. The
`jugad-literal-subject-list 93 vs frozen 90` RED is identical on both sides; it is a BASE red of this container's tree, not
of this build.

## 7 · `node scripts/models.mjs check` (2026-11-20)

```
models check: 138 file(s) · literal model names outside models.mjs: 0 · declared fixture lines: 10 · brain_config claude aliases ok
exit 0
```

## 8 · MEASUREMENTS THE SPEC LEFT TO THE BUILD

- **N5 (2026-11-20).** `claimOf` over every `ci/*/witness_*.mjs` of the build tree (scratchpad `tools/n5.mjs`, its last
  line): `n5 · 39 witness unit(s) · 231 clause-literal id(s) · 199 with a header claim · 32 without · longest claim 140
  chars`.
  - The 32 ids without a claim each read `(no header claim for this id in its source)`, which is still the clause id: R2
    names WHAT failed.
  - mf2's F2 and F4 read their "RE-CUT by unit mrf …" line, as the spec measured.
  - This build's own `SETUP` was found unclaimed here and was given its header line.
- **N4.** The longest header claim line is 140 characters (the N5 line above). The neutral machine's per-annotation limit
  is still not published. No size is typed.

## 9 · FORKS

- **F5 · THE PORT-HELD PRINTERS, A NAMED ROW (row 1186 F5 A).** `scripts/organism_test.mjs` still promotes every
  `PORT_HELD …` machine line a witness prints to an ok assert name. These are runtime bytes that already pass the
  workflow's grep. This unit does not touch that path. It goes to the architect as its own row: **the PORT_HELD fields under
  the same literal-of-source law**, decided by a scan of every PORT_HELD printer.
- **FORK-B1 · a file beyond the named ones.** None. The touched files are exactly the named ones (BOUND, §3).
- **FORK-B2 · unit mdtl2 (row 1186 F7 A).** It is named here for every other no-cause red, such as the 1b8c379 `GATES` red
  (spec M3). It is to be specced first and launched when mdtl is adopted. Not built here.
- **FORK-B3 · the stricter second check (§2).** For the architect to ratify, or to send back to the spec's substring rule.
- **FORK-B4 · the effort receipt.** `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository, as the brief
  foresaw. Its error is named in the final message, and nothing was written under `campaign-2026-09/`.

## 10 · CHECK RUNS

The check runs of each pushed tip are read by curl from the public API and recorded in `ci/mdtl/LEDGER.jsonl`. A file
cannot carry its own verdict (row 1167 (3)).

## 11 · NEW MAIN cebe3eb MERGED (forks rows 1187 (2) / 1181 (2) / 1201), 2026-11-20

The runner's first two new-main lines (3f22388, then cebe3eb) said to STOP on a conflict beyond the package.json member
line, and this seat stopped twice (ledger rows `merge-main-FORK`). Row 1201 withdrew that order. Main cebe3eb
(`cebe3ebe4024c2144b934b3032b3fb837285d926`, units mlaw and mcov) is now merged as a merge commit: no rebase, no force push.
`ci/mdtl/BASE` stays 5759cce (row 1200 (2)). `scripts/organism_test.mjs` merged with no conflict: mcov's MEMBER_BOUND_MS and
kill naming sit beside mdtl's `causes`, and the cause block still follows the judged assert.

**Every hunk resolved, each keeping both intents:**

| # | File:line (merged) | Main meant (mlaw / mcov) | mdtl meant | The result |
|---|---|---|---|---|
| H1 | `package.json:18` (`organism:selftest`) | five members added: done, deck_lint, home_pin, probe, study_scope | `witness_cause.mjs selftest` added after `ci_verdict.mjs selftest` | the union: main's line, plus mdtl's one member in its place (checked by a set diff: mdtl's only extra member is that one) |
| H2 | `scripts/ci_verdict.mjs:49` (parseSuite's JSDoc return type) | `lawpack: Record<string, number> \| null` | `causes: string[]` | both fields in the one type |
| H3 | `scripts/ci_verdict.mjs:56-57` (parseSuite's return) and the mlaw functions after it | `lawpack: parseLawpack(text)`, plus `parseLawpack` and `lawpackRises` | `causes: …` | both fields in the return; main's two functions kept byte for byte |
| H4 | `scripts/ci_verdict.mjs:160-169` (compareLines' head) | a 7th parameter `baseline = null`, passed to `judge` | mdtl's `causesFor`, `workspaceSrc`, and a `readSrc` parameter | both: `compareLines(head, base, label, headSha, baseSha, baseSrc, baseline = null, readSrc = () => "")`. Main's position for `baseline` is kept, so every main caller is unchanged. mdtl's `readSrc` moves to 8th, and mdtl's two selftest calls were shifted to pass `null` for `baseline` |
| H5 | `scripts/ci_verdict.mjs:358-362` (main's `compare`) | head/base parsed once, the frozen baseline read only when the base has no law pack line, `baseline` passed | `workspaceSrc` passed as the source door | main's block, with `workspaceSrc` appended after `baseline` |

No hunk had two intents that could not both hold.

**On the merged tree (tip of the merge, by command, 2026-11-20):**

```
node scripts/ci_verdict.mjs selftest      ci_verdict selftest: 34 passed, 0 failed · ALL CHECKS PASSED
node scripts/witness_cause.mjs selftest   ALL CHECKS PASSED
witness --org <merged> --base-org <5759cce, BASE>      RED MDTL · BOUND
  (D1-D5, SETUP and LAST GREEN; BOUND names main's own files, and the member drops BOUND by its boundIds, F1 A)
witness --org <merged> --base-org <cebe3eb, parent>    GREEN MDTL a red witness leaves its failing clause readable, from public bytes only · 8 clause(s)
witness --org <5759cce> --base-org <5759cce>           RED MDTL · D1 D2 D5 BOUND
run_mutants --org <merged> --base-org <cebe3eb>        run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN
node scripts/lawpack.mjs gate (merged)    lawpack · 1939 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7 · lawpack: GREEN
node scripts/lawpack.mjs gate (cebe3eb)   the same count line, every count equal (its RED is the raw-NUL scan's git ls-files in a plain tree that is not a git checkout)
node scripts/models.mjs check             exit 0 · literal model names outside models.mjs: 0
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all (merged, this container)
  ok   SUITE MEMBER · ci_verdict selftest exits 0
  ok   SUITE MEMBER · witness_cause selftest exits 0
  ok   all 59 hermetic suite members pass (every one RUN, not chained)
  organism_test: 157 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 124 (hermetic: named, not run)   (exit 0; the coverage-law base red is gone with mcov)
```

## 12 · NEW MAIN 6a6bdff MERGED (unit mmeter; forks rows 1187 (2) / 1181 (2) / 1201), 2026-11-20

Main `6a6bdfff4349b849398b69d0748b27d37c874b85` is merged as merge commit 5465136. **No conflicted hunk**: git merged
`scripts/organism_test.mjs` (mmeter's `clauses` mode, which walks `ci/witness/`) beside mdtl's `causes`, and mmeter changes
nothing else this unit touches. This unit has no `ci/witness/mdtl/`, so the new mode judges no clause of mdtl.
`ci/mdtl/BASE` stays 5759cce (row 1200 (2)).

```
witness --org <merged> --base-org <5759cce, BASE>     RED MDTL · BOUND   (D1-D5, SETUP, LAST GREEN; BOUND names main's files, dropped by the member)
witness --org <merged> --base-org <6a6bdff, parent>   GREEN MDTL a red witness leaves its failing clause readable, from public bytes only · 8 clause(s)
run_mutants --org <merged> --base-org <6a6bdff>       run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all   organism_test: 159 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 124 (hermetic: named, not run)
node scripts/lawpack.mjs gate             lawpack: GREEN — no law's finding count rose (1939 raw · jugad 90 · bare-catch 37 · depcruise 7)
node scripts/models.mjs check             exit 0
```

## 13 · NEW MAIN b3a61c6 MERGED (unit mpres), 2026-11-20

Main `b3a61c6fa0a248554ad447ece8c02f9f0a1d1660` is merged as merge commit 411a494 (no rebase, no force push). `ci/mdtl/BASE`
stays 5759cce (row 1200 (2)).

**The one conflicted hunk, H6 · `package.json:18` (`organism:selftest`).** mpres added `node scripts/senses.mjs selftest`
after the `state.mjs` member; mdtl added `node scripts/witness_cause.mjs selftest` after `ci_verdict.mjs`. The result is
the UNION: main's line plus mdtl's one member in its place, nothing else changed. A set diff confirms it: mdtl's only extra
member is that one, and main's only extra member is `senses.mjs`. No other file conflicted.

```
node scripts/senses.mjs selftest                       senses selftest: 18 passed, 0 failed   (exit 0)
node scripts/ci_verdict.mjs selftest                   ALL CHECKS PASSED
node scripts/witness_cause.mjs selftest                ALL CHECKS PASSED
witness --org <merged> --base-org <b3a61c6, parent>    GREEN MDTL a red witness leaves its failing clause readable, from public bytes only · 8 clause(s)
witness --org <merged> --base-org <5759cce, BASE>      RED MDTL · BOUND   (main's files; dropped by the member)
run_mutants --org <merged> --base-org <b3a61c6>        run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN
node scripts/models.mjs check                          exit 0
```

CHECKPOINT · merged b3a61c6 at 2026-11-20T16:22Z · resume from: read the check runs of this push, then wait for the next ruling
