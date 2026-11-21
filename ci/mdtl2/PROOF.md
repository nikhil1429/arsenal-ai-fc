# UNIT mdtl2 · PROOF — every no-cause red that is not a witness red leaves its cause, from public bytes only

Build seat, unit mdtl2 (forks rows 1186 (2) F7 A / 1207 (1) / 1220). Branch `claude/mdtl2-build`. Measured 2026-11-21.
Spec: `ci/mdtl2/MDTL2_SPEC.md` on `claude/mdtl2-spec` at **d39e060**, read whole with its ledger. Where the spec and the
ruling text of row 1220 differ, the ruling wins; every difference is named in §6.

## 1 · THE BASE

- Cut from main **25f13f270cc513cfa18ac6cf7bee35fc38001013** (`git fetch origin main; git rev-parse origin/main` answered the
  same sha on 2026-11-21: main had not moved past the cut). `ci/mdtl2/BASE` holds it (spec N5: the main that holds unit mdtl).
- The spec's a3c544b lines, re-measured at 25f13f2 by file:line before the edit (2026-11-21):

```
organism_test.mjs  causes / assert         a3c544b :46 / :46-50   →  25f13f2 :46 / :47-51
organism_test.mjs  suites() member assert                          →  25f13f2 :405 (red-why :407)
organism_test.mjs  MPOOL usage_tap assert                          →  25f13f2 :2256
organism_test.mjs  lawpack gate assert                             →  25f13f2 :2744
organism_test.mjs  clause witness assert                           →  25f13f2 :2823
organism_test.mjs  witness_cause import (mdtl)   a3c544b :2958     →  25f13f2 :2958
organism_test.mjs  mode throw assert                               →  25f13f2 :3093
ci_verdict.mjs     judge :111-113 / causesFor / readVerdict :204   →  25f13f2 :116-118 / :146 / :218 (no-verdict leg :234)
```

## 2 · THE NAMED FILES (spec §5; nothing else differs outside ci/ — the witness BOUND clause checks it)

| File | What |
|---|---|
| `scripts/red_cause.mjs` (NEW) | `SOLE WRITER of: NOTHING`. The alphabet (`alphabetOf`, acorn's tokenizer: LIT + SKEL), `repOf`, `pathTok`, `kindOf`, the builders (`memberCause` K1/K3/K4, `rollupCause` K2, `throwCause` K6, `detailCause` K5 + K12 PORT, `lawpackCause` K7, `clauseCause` K11 via witness_cause's `idsInSource`/`claimOf` unchanged, `sectionCause` K14/K15, `stepCause` K17), the hook door `causesOfDetail`, and `verify` — the second check. Its `selftest`. |
| `scripts/organism_test.mjs` | 4 hunks: the guarded import + the ONE generic hook in `assert` (`:44-63`), the K1/K4 push in `suites()`, the K3 push at MPOOL, the K11 push at the clause witness. No judged name or detail changed. |
| `scripts/ci_verdict.mjs` | `causesFor` dispatch (a `WITNESS ‹u› · GREEN at head …` red → mdtl's `verifyCause`, unchanged; every other red → `red_cause.verify`), `judge` (K14/K15 `lost` causes), `readVerdict` (K17 step lane; `(head)`/`(base)` causes printed), the workspace doors, and the plumbing named in §6 D6. |
| `package.json` | `&& node scripts/red_cause.mjs selftest` after `witness_cause.mjs selftest` in `organism:selftest` (F11 A). |
| `ci/mdtl2/` | `BASE`, `witness_mdtl2.mjs`, `run_mutants_mdtl2.mjs`, `LEDGER.jsonl`, this file. |

Not edited: `scripts/witness_cause.mjs` (F1 A), `.github/workflows/suite.yml` (spec §5 item 5), any state file.

## 3 · THE WITNESS, BOTH WAYS (2026-11-21; trees are LF clones under os.tmpdir(), node_modules linked)

`node ci/mdtl2/witness_mdtl2.mjs --org <tree> --base-org <tree of 25f13f2>`:

```
--org = the build (975c0c0)  →  GREEN MDTL2 every no-cause red that is not a witness red leaves its cause, from public bytes only · 15 clause(s)   (exit 0)
--org = the base (25f13f2)   →  RED MDTL2 · E1 E2 E3 E4 E5 E6 E7 E8 E9 BOUND   (exit 1)
```

At the base the guards E10 RULED, E11 GREEN-SILENT, E12 MDTL-INTACT and LAST read GREEN, by design (spec §6 table); SETUP is
GREEN both ways. Its E2 line at the base: `hex 0 · numeric 0 · salad 0` — nothing leaks there either, and nothing explains
(spec M10).

## 4 · THE MUTANTS (2026-11-21)

`node ci/mdtl2/run_mutants_mdtl2.mjs` (default mode: it builds HEAD and ci/mdtl2/BASE itself) — last line:

```
run_mutants: 14 of 14 mutant(s) RED by the clause that names them · control GREEN
```

E1-m … E12-m, BOUND-m, LAST-m, each RED by its own clause (the full table of the run is in the ledger).

## 5 · EVERY TOUCHED MEMBER, BEFORE AND AFTER (2026-11-21)

`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, LF clones under os.tmpdir() after `npm ci`:

```
cut 25f13f2   organism_test: 160 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 124 (hermetic: named, not run)
tip 975c0c0   organism_test: 161 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 124 (hermetic: named, not run)
both          FAIL SUITE MEMBER · sandbox selftest exits 0   +  its roll-up   (container-bound: spec N6, its neutral legs green)
green at the cut and not green at the tip: 0   ·   the one new green: SUITE MEMBER · red_cause selftest exits #

node scripts/ci_verdict.mjs selftest     cut: ci_verdict selftest: 34 passed, 0 failed   tip: ci_verdict selftest: 38 passed, 0 failed
node scripts/red_cause.mjs selftest      cut: (absent)                                   tip: red_cause selftest: 24 passed, 0 failed
node scripts/witness_cause.mjs selftest  untouched, ok at both
LAW PACK — every rule file present, and no law's finding count rose   ok at both
node scripts/models.mjs check            exit 0 (literal model names outside models.mjs: 0)
KNOWN_RED table (organism_test.mjs)      sha256 6263b06224a446b3 at the cut and at the tip · 0 live entries at both
```

Every judged name and detail is byte-identical (the witness's E10, and the member parity above), so every KNOWN_RED entry
keeps its match — the table holds none today, and its bytes did not move.

**The channel, read live in this container (2026-11-21)**: the tip's machine line carries
`SUITE MEMBER · sandbox selftest exits 0 · exit 1 · FAIL NEGATIVE CONTROL · writing LIVE dressing-room/state is DENIED · and 3 more`
and `all … hermetic suite members pass … · sandbox · exit 1`. The first failing check of the N6 sandbox red is its
negative-control canary tripwire, read from public bytes only — consistent with the spec's "container-bound" answer.

**THE NEUTRAL MACHINE'S FIRST READ (acf442b, 2026-11-21; check runs 136662682507 node 22 · 136662682054 node 24, both
`failure`).** The channel read two reds out from public bytes on its first leg:
- **its own bug.** `SUITE MEMBER · red_cause selftest exits 0 — cause: exit 1 · FAIL throwCause: ERR and the first frame
  under the root as path:line; the message never leaves` (both legs). `throwCause` read a file URL with `fileURLToPath`,
  which answers by the HOST's platform: the selftest's drive-less frame threw on Windows. Fixed in 975c0c0 (read by text,
  a Windows frame planted in the selftest). The red was read, not guessed, and not retried.
- **THE PROBE (row 1220, unit mprb F1 C), node 22 only:** `SUITE MEMBER · probe selftest exits 0 — cause: exit 1 · FAIL …/…`
  and the roll-up `probe · exit 1`. This is **the first public read of a probe red**, and it is the evidence mprb waits for:
  probe exited 1 with **exactly one** failing check line (no `and <n> more`), on node 22 and not on node 24 of the same sha.
  Its spelling `…/…` is a path-join template of probe.mjs (`${d}/${e.name}`), which names nothing; 975c0c0 refuses a
  skeleton with no word character in its static bytes and lets a longer literal opening win, so the next probe red reads
  either a literal of probe.mjs or WITHHELD. Which check it is stays **NAMED NOT GUESSED** until that leg. Under the spec §4
  table it is a K1 red with ONE failing check: not an import-level death (that fails every check). A retry until green is
  refused in advance.

## 6 · DIFFERENCES FROM THE SPEC (the build, named)

- **D1 · one cause text per red.** `memberCause` returns ONE text (`exit 1 · FAIL <lit> · and 2 more`), not
  `[{ id, text }]`; a machine-line entry is `<red> · <text>`, the payload `cause[<red>]` an array of texts.
- **D2 · K12 CLONE is a skeleton.** `<7-hex> is not a commit here …` reads as the skeleton of organism_test.mjs
  (`… is not a commit here (the member never fetches)`): the 7-hex is a fill and is withheld — stricter than the spec's
  LIT of `ci/<u>/BASE`.
- **D3 · the hook builds every kind known from (name, detail).** K2, K5, K6, K7, K10, K12 ride the ONE generic hook in
  `assert`; only K1/K4 (`suites()`), K3 (MPOOL) and K11 (clause witness) need the run's output, so only they are site
  pushes. organism_test.mjs is 4 hunks.
- **D4 · K7.** The rule ids are the tokens of a `RED` line that are whole literals of lawpack.mjs in rule-id grammar; the
  rest is its LIT/SKEL, or a literal that opens it at a word boundary followed by ` …`.
- **D5 · the alphabet is read by acorn's tokenizer** (the repo's pinned devDependency), never a hand regex (LAW T). With no
  acorn every alphabet is empty: every cause WITHHELD, the lane fails closed.
- **D6 · ci_verdict plumbing beyond the brief's three functions.** `judge` cannot see a dead run's raw text from inside
  `compareLines`, so `compareLines` takes one more parameter (`io`: the workspace doors and the two raw outputs; absent = the
  pure default, every non-witness cause WITHHELD) and `main` passes it; the workspace doors (`workspaceTracked`,
  `workspaceFile`) sit beside mdtl's `workspaceSrc`. Written as **FK1** below.
- **D7 · the reader's call bound.** A leg with no verdict annotation costs ONE more call (F6 A ruled), so the header's
  "at most 3 calls" holds for a commit whose legs carry verdicts; a dead leg adds one.
- **D8 · E10 is measured over the suites and clauses runs.** The coverage and throw runs' details differ between the two
  trees for reasons that are the tree, not this unit (the orphan list names red_cause.mjs only at the build; stack line
  numbers shift), so they are not a byte-identity guard.
- **D9 · E2-m and E6-m.** E2-m is "a skeleton keeps its fill bytes" (F4 B undone), which lets the salad out; the spec's
  "any word of the source" widening is not what the build's LIT check could become. E6-m edits the builder AND the second
  check: a builder-only skip is caught by `verify` (that is the design), so it would not bite E6.
- **D10 · the guards.** E10, E11, E12 and LAST are GREEN at the base by the spec's own table; every other clause is RED at
  the base and GREEN at the build.
- **D12 · skeleton strength (975c0c0, after the neutral read).** A skeleton must carry a word character in its static
  bytes, and between a covering skeleton and a literal opening the spelling with more public bytes wins (a tie to the
  skeleton). The spec ranked skeleton before prefix unconditionally; the probe red showed a `…/…` win.
- **D11 · the witness links node_modules** into each copy (the pinned parser), and unlinks it before removal; SETUP is RED
  when none with acorn is found beside either tree.

## 7 · THE PARALLEL BUILD (mkp24)

`claude/mkp24-build` read at the start (3898668) and before the last push (b5fc77b, 2026-11-21): its one organism_test.mjs hunk is
`@@ -3010,7 +3010,10 @@ async function witnesses()`. This build's four hunks sit at `@@ -44,10`, `@@ -405,6`,
`@@ -2256,6`, `@@ -2821,8`: **no line overlaps**. `git merge-tree --write-tree HEAD origin/claude/mkp24-build` is clean
(2026-11-21). Neither edit touches the other's `scripts/witness_cause.mjs` lines (this build does not edit it at all).

## 8 · FORKS (for the architect)

- **FK1 · the compareLines / main plumbing (D6).** (A) keep it — K14/K15 need the raw text; (B) move the section cause into
  `parseSuite`'s null case. Rec A: the pure default stays WITHHELD, and the payload key is the spec's.
- **FK2 · the SLOT digits.** The member computes the exit code, the bound and the count; the second check can verify only
  their grammar, so a forged machine line could carry digits in those slots (the machine line is written by the suite
  itself, on the runner). (A) accept, as F3 B reads; (B) bound the exit slot to 0..255 and the count to the member's own
  failing-line grammar. Rec A, named.
- **FK3 · kindOf is the grammar of organism_test.mjs's assert names.** A renamed assert falls to `detail` (tracked paths
  only, or no cause): fail-safe, never a leak. (A) accept; (B) export the name grammar from organism_test.mjs. Rec A.
- **FK4 · N3, the annotation limit.** A K5 detail that names many organs (the coverage orphan list) makes a long cause;
  no size is typed here. To be measured by the first such red on a runner.
- **FK5 · the suite workflow's concurrency.** `cancel-in-progress` cancels a branch's earlier runs, so of a burst of pushes
  only the last tip is judged (2dc41f4's legs read `cancelled`). Named, not changed (suite.yml is not this unit's file).

## 9 · CHECK RUNS AND THE CANON-COUNT REPLAY

The check runs of each pushed tip are read with curl from the public API and recorded in `ci/mdtl2/LEDGER.jsonl` (a file
cannot carry its own verdict, row 1167 (3)). Before each push that touches this file, the LOAD ZERO BLOCK 7 scan is
replayed over the COMMIT blobs (`git show <sha>:<path>` for every tracked `.md`, its two regexes read from that commit's own
organism_test.mjs); its line is in the ledger.
