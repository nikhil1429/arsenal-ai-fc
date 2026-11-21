# mrulew · C:rule-witnesses — PROOF (19 Nov 2026)

Unit mrulew (forks rows 1162 / 1163; MWIT spec `ci/mwit/MWIT_SPEC.md` at `88bf69d`, UNITS row 10). A ci-only unit: no organ
file is edited, no suite file is edited (row 1162 (2), F11), no state file is written.

- **Base:** `fb4211870093e6b8657655eb02ebcfc425f1eab1` (origin/main at the cut, 19 Nov 2026) — `ci/mrulew/BASE`.
- **Branch:** `claude/mrulew-build`. The tip this proof describes is named in the commit that carries it and in the final message.
- **Named files:** `ci/witness/mrulew/witness_rules.mjs` · `ci/witness/mrulew/rule_witness.json` (UNITS row 10) ·
  `ci/mrulew/PROOF.md` · `ci/mrulew/LEDGER.jsonl` · `ci/mrulew/BASE` · `ci/mrulew/run_mutants_mrulew.mjs`.

## 1 · Measured at the base (19 Nov 2026, file:line at `fb42118`)

- The teaching rules' sole writer is `scripts/teaching_contract.mjs` (header :46); its file is `const STATE = join(ROOT, …)` (:69).
  It exports **no reader of the rules** (`grep -n '^export'`: :274, :275, :281, :319, :1701). `load()` (:945) is file-private and
  returns `seed()` (:167) when the file is absent (:947), and stored rules win over the seed (`withSeedDefaults` :924-925).
  So the witness reads the ids through the owner's CLI `list` (:1778, read-only) and checks first that the file EXISTS and
  parses: on the cloud the file is absent and the clause reads **UNREAD**, never the seed.
- The per-rule checker is `scripts/teaching_audit.mjs`: `auditTurn` (:852, pure) and `pictureFacts` + `pictureDrift` (:1390,
  :1473) for `act-mueywvag`; its checked ids are `CHECKED_RULES` (:186), 17 ids (19 Nov 2026, `node -e` over the export).
- The witness command form and its bound: `rung_receipt.mjs parseWitness` (:224) and `WITNESS_TIMEOUT_MS` (:52, from
  `postmatch.mjs` CHILD_TIMEOUT_MS) — imported from the tree under judgement, never typed.
- `coverage`'s check reads `registry.mjs coreAxes` (:181), which throws without the tracked registry (`subjectsOf` :134):
  the planted trees re-plant the tracked registry at the path `registry.mjs REGISTRY_PATH` (:59) names (the MWIT planter's method).

## 2 · The witness (header = contract)

`node ci/witness/mrulew/witness_rules.mjs` is THE CLAUSE READ (the receipt organ's witness command): every rule id the live
file holds has a row in `rule_witness.json` `rules`, the command parses by `parseWitness`, and `<cmd> --plant red` exits 1 and
`<cmd> --plant clean` exits 0. Exit 0 holds · 1 red · 2 unread. Each map command is `node ci/witness/mrulew/witness_rules.mjs rule <id>`.
That command plants the id's RED or CLEAN turn (`rule_witness.json` `plants.<id>`) through the tree's own `teaching_audit.mjs`.
Modes `plants` (for unit mmeter's member) and `--org <dir> --base-org <dir>` (the both-ways judge) are in its header.

**The map:** 17 rule ids (19 Nov 2026, the keys of `rule_witness.json` `rules`), the 16 the owner's seed carries plus
`act-mueywvag` (live on his laptop, `teaching_audit.mjs SEED_GAP` :213). Each id was probed against the base tree's checker:
it is named on its red plant and absent on its clean plant (ledger row "measure … probe2").

## 3 · Both ways, by last line (19 Nov 2026)

```
node ci/witness/mrulew/witness_rules.mjs                      (this cloud)
RULE-WITNESSES UNREAD · the live teaching rules file is absent here (his laptop holds it; never the seed)      exit 2

node ci/witness/mrulew/witness_rules.mjs judge                (base tree built from ci/mrulew/BASE)
  clause at head · exit 0 · RULE-WITNESSES HOLDS · 16 rule(s) · every one witnessed both ways
  clause at base · exit 1 · RULE-WITNESSES RED · no rule witness map (ci/witness/mrulew/rule_witness.json) · 16 rule(s) unwitnessed
GREEN MRULEW rule witnesses (16 seed rule(s): base 1 → head 0) · plants both ways · 4 clause(s) (exit 0)

--org <LF tree of HEAD> --base-org <LF tree of fb42118>, run from a copy of the witness dir (the ms1 member's shape)
  clause at head · exit 0 …   clause at base · exit 1 …   BOUND · no ci/mrulew/BASE here
RED MRULEW · BOUND        (exit 1: BOUND is a seat-time clause the ms1 judge drops; nothing else red)
```

The plants (`node ci/witness/mrulew/witness_rules.mjs plants`, 19 Nov 2026): P-ALL 0 · P-UNMAPPED 1 · P-NOSTATE 2 · P-TORN 2 ·
P-ONEWAY 1 · P-UNTRACKED 1 · P-NOMAP 1, every one as wanted → `GREEN MRULEW plants · 7 case(s) both ways · 16 seed rule(s) witnessed (exit 0)`.
LAST: `0 node process(es) naming the temp dir`; the temp root is removed (links unlinked first, never followed).

## 4 · Mutants (19 Nov 2026, `node ci/mrulew/run_mutants_mrulew.mjs`)

```
M-ONEWAY (the spec's: a witness with only a RED plant accepted) · RED by P-ONEWAY
M-UNMAPPED (a rule without a witness skipped) · RED by P-UNMAPPED
M-UNPARSED (parseWitness skipped) · RED by P-UNTRACKED
M-SEED (the owner's seed read as his rules) · RED by P-NOSTATE
run_mutants: 4 of 4 mutant(s) RED by the clause that names them · control GREEN
```

## 5 · Selftests, members, models, law pack, suite

- **Selftests touched:** none (no organ file is edited). **Suite members touched:** none (row 1162 (2): the suite file is unit mmeter's alone).
- `node scripts/models.mjs check` (19 Nov 2026): `models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)` — exit 0.
- **Law pack counts** (`node scripts/lawpack.mjs gate`, LF trees built by `git --work-tree` checkout, 19 Nov 2026) — BASE `fb42118` and the build read the SAME line:
  `owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13`
  (exit 1 on both trees, the base's own reds vs its frozen line: jugad 93 > 90, depcruise 13 > 7). No count is raised by this build.
- **Suite** (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 19 Nov 2026), base and build alike:
  `organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)` (exit 2) — the one red is
  the base's selftest-coverage law (deck_lint, home_pin, probe, study_scope), not this unit's.
- **CI** (public API, curl, no token): `f6287f0` — run 135779636770 `npm test · node 22` success · run 135779636287 `npm test · node 24` success.
  The final tip's two legs are named in the final message.

## 6 · Where the spec and the rulings differ (the ruling wins)

- Spec F11 / the UNITS footnote ("every unit edits organism_test.mjs") — overruled by row 1162 (2): no suite edit; the witness
  carries a `plants` mode for unit mmeter's one member.
- Spec C:rule-witnesses (b) says "through teaching_contract.mjs's exported reader": no such export exists at the base (§1) and
  this unit edits no organ; the read goes through the owner's CLI `list`, with the file's path read off the owner's source line.
- Spec's map shape `{ <rule-id>: "node …" }`: kept as `rules`, with the RED and CLEAN plants beside it as `plants` (the "RED and
  CLEAN plant" the clause demands needs a home inside the two named files).

## 7 · FORKS

- **FK1 · the ms1 member does not see this witness.** It walks `ci/<unit>/witness_<unit>.mjs`; this one sits at
  `ci/witness/mrulew/witness_rules.mjs` (UNITS row 10). `ci/mrulew/BASE` is written as asked; the judging rides unit mmeter's
  `ci/witness` member (`plants` mode). Either the ms1 member also walks `ci/witness/<unit>/`, or mmeter's member is the judge.
- **FK2 · mmeter's member and the tree it gives.** `plants` mode needs `<org>/scripts` (`--org`, default three dirs above the
  witness). A member that copies only `ci/witness/mrulew/` elsewhere must pass `--org`.
- **FK3 · a rule's real-day verdict.** `rule <id>` without `--plant` exits 2: a rule's day verdict is `teaching_audit.mjs`'s own
  lane (its audit log). The clause asks only that every rule be witnessed both ways.
- **FK4 · live ids beyond the map.** His laptop may hold ids added through `teaching_contract.mjs add` that no checker knows.
  Each reads RED (`<id>(none)`), which is the clause speaking; closing them is a checker build in an organ, not this unit's.
- **FK5 · NAMED NOT GUESSED:** the live rule ids and the clause's real verdict on his laptop. To measure: `node ci/witness/mrulew/witness_rules.mjs` there.
- **FK6 · the effort receipt.** `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository; its error is named in the final message, and nothing is written under `campaign-2026-09/`.

~~CHECKPOINT · STOPPED at 2026-11-19T12:37:57Z · resume from: write rule_witness.json and witness_rules.mjs …~~ — resumed on
his word 270 (19 Nov 2026); every step after it is above.

## 8 · Merge of main 5759cce (row 1172, 20 Nov 2026)

- `git merge --no-ff 5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90` into the tip `b703c70` with no conflict (this branch edits neither
  `scripts/organism_test.mjs` nor `package.json`). Resolution hunks: none. `ci/mrulew/BASE` now reads `5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90`.
- Witness on the merged tree: `GREEN MRULEW rule witnesses (16 seed rule(s): base 1 → head 0) · plants both ways · 4 clause(s) (exit 0)`;
  the cloud read is still `RULE-WITNESSES UNREAD …` (exit 2).
- Mutants on the merged tree: `run_mutants: 4 of 4 mutant(s) RED by the clause that names them · control GREEN`.

CHECKPOINT · STOPPED at 2026-11-20T01:29:11Z · merged tip = the commit carrying this line (its parents b703c70 and 5759cce) · base 5759cce · resolution hunks none · witness GREEN MRULEW (exit 0) · mutants 4 of 4 · control GREEN · resume from: nothing owed, awaiting the architect

## 9 · Merge of main 7bf008b (forks rows 1233 (2) / 1236, 21 Nov 2026)

- `git merge --no-edit origin/main` (7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f) into `b92a03f` with no conflict; no conflicted file. `ci/mrulew/BASE`
  moves to 7bf008b, as row 1172 keyed it to the main merged in (BOUND reads BASE..HEAD).
- The landed suite member of unit mmeter (`scripts/organism_test.mjs` clauseWitnesses) runs every `ci/witness/<unit>/witness_*.mjs plants` and
  requires a `PLANTS <unit> · k of n plant(s) as expected` line: the witness's plants mode now prints it (k, n counted from its own cases).
  No suite edit by this unit. The witness derives no day from the clock, so mclk's planter instant does not reach it.
- Witness: `GREEN MRULEW rule witnesses (16 seed rule(s): base 1 → head 0) · plants both ways · 4 clause(s) (exit 0)` · plants
  `PLANTS mrulew · 7 of 7 plant(s) as expected` · mutants `run_mutants: 4 of 4 mutant(s) RED by the clause that names them · control GREEN`.

CHECKPOINT · STOPPED at 2026-11-21T07:35:06Z · merge of main 7bf008b = the parent of the commit carrying this line · base 7bf008b · conflicted files none · witness GREEN MRULEW (exit 0) · mutants 4 of 4 · control GREEN · neutral legs of this tip: read after the push and named in the final message (and the next push's proof)
