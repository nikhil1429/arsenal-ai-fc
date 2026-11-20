# MR3 PROOF — repair unit mr3 · mjd3 J4 re-based on unit mjd4 (forks rows 1107 (2), 1112, 1119)

Build seat: unit mr3 (cloud builder), branch `claude/mr3-build`, cut 19 Nov 2026 from **`52b51c194c47fee16bf1b10b30d98e45915b190f`**
(the ms1 tip the architect re-ran GREEN, row 1119 (1); `ci/mr3/BASE` holds it). Spec: `ci/mr3/MR3_SPEC.md` at `78b7da0` on
`claude/mr3-spec`, read whole with its ledger. Every act is a row of `ci/mr3/LEDGER.jsonl`. Nothing under `scripts/` is repaired;
no state file is read or written (every plant lives under `os.tmpdir()`).

## 1. What the build changes (named files only)

| File | Change |
|---|---|
| `ci/mjd3/witness_mjd3.mjs` | J4 RE-BASED (fate (a), row 1112 (1)): header keeps the OLD J4 text struck (`~~…~~`) and names unit mjd4, `15edfec`, row 1030 (2) and row 1112 (1); the plant owner honours `--idem` (the owners' law, F3 A); the receipt carries `resolved_in_doubt`; `runIn` reads the owner log; the J4 predicate is the spec's §3.1; the GREEN last line no longer says "never dispatches twice" |
| `ci/mjd3/BASE` | **unchanged** `074ead9` (F1 A) |
| `scripts/organism_test.mjs` | the KNOWN_RED entry `WITNESS ‹mjd3› · GREEN at head against its BASE` (row 1107, owner unit mr3) leaves; one RETIRED record line (L9) under RETIRED ENTRIES. Nothing else |
| `ci/mr3/` | `BASE`, `LEDGER.jsonl`, `witness_mr3.mjs`, `run_mutants_mr3.mjs`, `PROOF.md` (new) |

`git diff --stat 52b51c1 claude/mr3-build` names only these files (the witness's BOUND guard checks it on the trees).

**No merge of main, measured.** The brief: merge `origin/main` if an edited file differs between `52b51c1` and `origin/main`.
They differ, but only by ms1's own commits: `git diff --stat 95b07a6 origin/main -- scripts/organism_test.mjs ci/` is empty
(main `224f9b9`, 19 Nov 2026; `95b07a6` = `git merge-base 52b51c1 origin/main`), so main moved none of the files edited here
since the base already merged it; a merge would add only files beyond the named ones (CLAUDE.md, captains_call, cortex,
keeper, services, thalamus) and turn BOUND red. Named as **F-M** below for the architect.

## 2. Measured before writing (base `52b51c1`, LF trees by `git -c core.autocrlf=false archive`)

| Run (19 Nov 2026) | Last line | J4 line |
|---|---|---|
| landed mjd3 witness, `--org 52b51c1 --base-org 074ead9` | `RED MJD3 · J4 BOUND` | `round 1 exit 9 after 2 rep(s) · round 2 reps {"c:0":1,"c:1":2,"c:2":1,"c:3":1} · twice c:1 · in doubt []` |

The capture door at the base: `scripts/gaffer_brain.mjs:1855` `argv.push(...idemArgv(s));` (the key the M-J4 mutant removes);
rejirah `:1803`, doubtminer `:1811` (as the spec's §3).

## 3. The re-based mjd3 witness, both ways (19 Nov 2026)

| `--org` | `--base-org` | Last line | J4 |
|---|---|---|---|
| build (52b51c1 + the edit) | `074ead9` | `RED MJD3 · BOUND` (J1 J2 J3 J4 LAST GREEN) | `GREEN J4 · … doubted m1 · handed {"c:0":1,"c:1":2,"c:2":1,"c:3":1} · on the owner's log {"c:0":1,"c:1":1,"c:2":1,"c:3":1} · every hand-off keyed true · resolved ["m1"] · in doubt [] · settled from in-doubt true` |
| `074ead9` (its BASE) | `074ead9` | `RED MJD3 · J1 J2 J3 J4` | `RED J4 · doubted null · … keyed false · resolved null · in doubt null` |
| `3a73782` (mjd3's landing, pre-mjd4) | `074ead9` | `RED MJD3 · J4 BOUND` | `RED J4 · doubted m1 · handed once each · keyed false · resolved null · in doubt ["m1"]` |

## 4. Witness `ci/mr3/witness_mr3.mjs`, both ways (19 Nov 2026)

Clauses: J4 RE-BASED · K1 STALE-GONE (no ‹mjd3› entry AND the member's own `judgeLast`/`boundIds`, read out of the tree's
`organism_test.mjs`, pass the mjd3 last line) · K2 STRUCK (old text struck, the four names, `ci/mjd3/BASE` kept) · K3 OTHERS
(every other entry byte-equal, nothing joined) · guards BOUND, LAST.

```
--org build --base-org 52b51c1   →  GREEN MR3 mjd3 J4 re-based on mjd4 (row 1112 (1)) and its ruled-red entry gone · 6 clause(s)   (exit 0)
--org 52b51c1 --base-org 52b51c1 →  RED MR3 · J4 K1 K2 K3   (exit 1; BOUND and LAST GREEN, they are guards)
```

## 5. Mutants `ci/mr3/run_mutants_mr3.mjs --org <build> --base-org <52b51c1>` (19 Nov 2026)

```
KILLED M-J4 (clause J4) · exit 1 · RED MR3 · J4 K1 BOUND
KILLED M-K1 (clause K1) · exit 1 · RED MR3 · K1 K3
KILLED M-K2 (clause K2) · exit 1 · RED MR3 · K2
KILLED M-K3 (clause K3) · exit 1 · RED MR3 · K3
KILLED M-BOUND (clause BOUND) · exit 1 · RED MR3 · BOUND
KILLED M-LAST (clause LAST) · exit 1 · RED MR3 · LAST · swept 1 survivor(s)
CONTROL · exit 0 · GREEN MR3 mjd3 J4 re-based on mjd4 (row 1112 (1)) and its ruled-red entry gone · 6 clause(s)
run_mutants: 6 of 6 mutant(s) RED by the clause that names them · control GREEN
```

M-J4 is the spec's registered mutant (F4 A: one per clause; the spare M-J4b is not registered).

<!-- §6 onward filled after the member and suite runs -->
