# UNIT MBANK · BUILD PROOF — the bank line takes his spoken words from the prompt record, one door, a turn id minted by the record's owner

> Forks rows 1189 (1) / 1194 / 1230 (the ruling). Spec: `ci/mbank/MBANK_SPEC.md` on `claude/mbank-spec` @ 653151d. Branch
> `claude/mbank-build`, cut from main **5301f1582f7a1dbc9ec9605434c9db5d8bd19107** (`ci/mbank/BASE`; mcrk is on it). At the cut
> `origin/main` had not moved past 5301f15. Every measurement below is a command with its last line, run on 21 Nov 2026 in a
> local clone of each tree made with `core.autocrlf=false` (cut = 5301f15, tip = the branch tip named in the ledger). The act
> log is `ci/mbank/LEDGER.jsonl`. No state file was opened, printed or copied; every plant lives under `os.tmpdir()`.

## 0 · WHAT THE BUILD DOES

- **The door.** `scripts/forge_session.mjs` exports the pure `hisPrompt(auditLast, {since, sessionId, fresh, needTurn})` and
  its one file read `readHisPrompt(opts)`. `crackRow` is re-pointed to it with exactly its old refusal (`since` only), so the
  mcrk clause witness reads as before. Every other refusal is opted into by the caller.
- **The turn id.** `scripts/teaching_audit.mjs` (the single writer of the prompt record) mints `prompt.turn_id` with
  `randomUUID()` at UserPromptSubmit. The Stop keeps it on the consumed prompt, and the paired Stop row carries it.
- **The code door** (`gaffer_brain.mjs capture` with `--said` or `--surface code`) reads the record through the door with
  `fresh`, `needTurn` and the session check on `CLAUDE_CODE_SESSION_ID`. It refuses an absent, before-session, consumed,
  other-session or turn-less record, and nothing is written. The row's `spoken` is HIS bytes: the whole message, or the
  slice `--said` selects (whitespace folded to match, his bytes kept). It adds `spoken_src:"prompt"`, `turn_id`, `prompt_at`
  and `session_checked`. The gut-word is read off his message. A `--gut` that disagrees, or one typed on a message with no
  gut-word, is refused. The hedge meter counts over `answerOf(said)`. A second capture of the same turn and slice is
  `already banked <id>`, and nothing is written.
- **The stdin doors** (voice, sitting) keep their own bytes and say `spoken_src:"voice"|"sitting"|"stdin"`, with `turn_id:null`.
- **The compiled crack item** carries `turn_id` beside `crack_id` (mbank-8 a, the one stamp in `scripts/notes_compiler.mjs`).

## 1 · THE WITNESS, BOTH WAYS (last lines)

```
$ node ci/mbank/witness_mbank.mjs --org <tip clone> --base-org <cut clone>
GREEN MBANK the code-surface bank keeps HIS bytes from the prompt record through one door, refuses a drifted, absent, consumed or foreign record, reads his gut-word off his message, and the bank row, the crack row and the compiled crack item carry the turn id the record's owner minted · 16 clause(s)

$ node ci/mbank/witness_mbank.mjs --org <cut clone> --base-org <cut clone>
RED MBANK · B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14

$ node ci/witness/mbank/witness_bank.mjs plants                       # the suite member's own call, on the tip
PLANTS mbank · 14 of 14 plant(s) as expected
$ node ci/witness/mbank/witness_bank.mjs plants --tree <cut clone>
PLANTS mbank · 0 of 14 plant(s) as expected
```
The 16 are B1-B14, BOUND (every file that differs is a named file) and LAST (0 survivors). On the build every clause reads GREEN on --org
and RED on --base-org; a clause that passed on the base would read RED there (no pass-through).

## 2 · THE MUTANTS

```
$ node ci/mbank/run_mutants_mbank.mjs --org <tip clone> --base-org <cut clone>
run_mutants: 14 of 14 mutant(s) RED by the clause that names them · control GREEN
```
M1-M12 are the spec's §4 list. M13 removes the compiled item's turn_id, so B13 reads RED. M14 drops the owner's mint, so
B14 reads RED.

## 3 · EACH TOUCHED MEMBER, BEFORE (cut) AND AFTER (tip), BY ITS HEADLINE

```
forge_session   cut: forge_session selftest: 243 passed, 0 failed     tip: forge_session selftest: 244 passed, 0 failed
teaching_audit  cut: ALL CHECKS PASSED (151 passed, 0 failed)         tip: ALL CHECKS PASSED (152 passed, 0 failed)
gaffer_brain    cut: gaffer_brain selftest: 194 passed, 0 failed      tip: gaffer_brain selftest: 198 passed, 0 failed
study_scope     cut: study_scope selftest: 61 passed, 0 failed        tip: study_scope selftest: 61 passed, 0 failed
teaching_gate   cut: teaching_gate selftest: 130 passed, 0 failed     tip: teaching_gate selftest: 130 passed, 0 failed
learn_digest    cut: learn_digest selftest 16/16 — all clauses hold   tip: learn_digest selftest 16/16 — all clauses hold
notes_compiler  cut: notes_compiler selftest: 48 passed, 0 failed     tip: notes_compiler selftest: 48 passed, 0 failed
turn_hook       cut: turn_hook: 168 passed, 0 failed                  tip: turn_hook: 168 passed, 0 failed

$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      # the whole hermetic profile
cut: organism_test: 165 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)
tip: organism_test: 165 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 125 (hermetic: named, not run)
     + ok   CLAUSE WITNESS · ci/witness/mbank/witness_bank.mjs plants — exit 0, every plant as expected
     - FAIL LAW PACK — every rule file present, and no law's finding count rose      ← the ONE red: FORK mbank-1 below

$ node scripts/models.mjs check ; echo "exit $?"
models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)
exit 0

$ node scripts/xray.mjs report | grep "Q2\|Q5"                          # cut and tip read the same
── Q2 LAW BREACH — more than one writer (allowlist honoured) (0)
── Q5 UNDECLARED WRITER — header says sole writer, IR disagrees (0)

$ node scripts/lawpack.mjs report | grep "DEPCRUISE no-circular\|^lawpack:"
cut: 7 no-circular lines · lawpack: GREEN — no law's finding count rose, and every rule is on disk
tip: 8 no-circular lines (+ scripts/forge_session.mjs → scripts/gaffer_brain.mjs) · lawpack: 1 RED — a gate may only get stricter (§10-D rule 6)
```
Every other member that reads GREEN at the cut reads GREEN at the tip, and the diff of the two suite logs holds only the
two lines above. `scripts/organism_test.mjs` and `package.json` are untouched.

## 4 · FORKS

- **mbank-1 · THE DOOR'S HOME: (A) as ruled trips the cycle rule, and (B) trips NO SHIM CALLEE. Neither stays green. I took
  neither on my own and propose (d).**
  - (A) as ruled: `gaffer_brain.mjs` reaches `readHisPrompt` by `await import("./forge_session.mjs")`. dependency-cruiser
    follows the dynamic import, and `forge_session.mjs` already reaches `gaffer_brain.mjs` the same way (`readBank`). That is
    a new `no-circular` (cut 7, tip 8), so the LAW PACK member reads RED. This is the one red on the tip.
  - (B), the branch the brief allows on a cycle, was measured by a probe on the build, not kept. `gaffer_brain.mjs`
    importing `./teaching_audit.mjs`, even dynamically, reads `FAIL NO SHIM CALLEE — no turn_hook callee is SHIM-reached after
    something already imported it` in `organism_test.mjs laws`. The cause: in turn_hook's `prompt` sequence, `sitting.mjs
    touch` (CALL) and `forge_session.mjs contract` (CALL) load gaffer_brain's closure before `teaching_audit.mjs hook` runs as
    a SHIM. The prompt hook would become a silent no-op, so no prompt record would be written at all. `forge_session.mjs`
    importing teaching_audit dies the same way. So B as written is refused by a suite member, not just a style rule.
  - **(d) proposed: the door in `scripts/study_scope.mjs`**, the leaf that teaching_audit, teaching_gate, teaching_bar and
    sitting already import. `forge_session.mjs` re-exports `hisPrompt`/`readHisPrompt` from it, so crackRow keeps the one
    door, and `gaffer_brain.mjs` imports it statically (it already imports `classifyPrompt`/`answerOf` from there). Probed
    on a throwaway clone of the tip, not pushed:
    ```
    lawpack: GREEN — no law's finding count rose, and every rule is on disk
    ok   NO SHIM CALLEE — no turn_hook callee is SHIM-reached after something already imported it
    organism_test: 74 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 43 (hermetic: named, not run)     # mode laws
    forge_session selftest: 244 passed, 0 failed · gaffer_brain selftest: 198 passed, 0 failed
    PLANTS mbank · 13 of 14 plant(s) as expected      # B9 pins the door's file; it is re-cut under (d)
    ```
    It widens `study_scope.mjs` beyond "the answerOf export only", which is why it is a fork and was not edited.
    *Decides it:* the architect's word. On (d) the resume is one step (§6).
- **mbank-0 (A)** stands: mcrk is on 5301f15, so the door is lifted once. The spec's anchors moved at the cut. In
  forge_session the crack code sits +74 lines from the spec's 5759cce (`crackRow` `:653`, the missing-bank lines `:797`,
  `:873`, which were the spec's `:723`, `:799`). study_scope GUT_LEAD `:216`. gaffer_brain `:1327`, `:1395`, `:2293` and
  `:2688` are as the spec cites. teaching_audit promptHook `:1635`, and the Stop spread `:1775`.
- **The spec's base-RED cells for B11 and B12 do not hold on this base.** mcrk landed, so crackRow exists at 5301f15 and the
  readers read any string. B11 also requires `spoken_src:"prompt"`. B12 also requires the prompt's `turn_id` on the crack
  row and crackRow going through `hisPrompt`. Both read RED at the cut and GREEN at the tip (§1).
- **Two clauses beyond the spec's twelve:** B13 STAMP (mbank-8 a: the compiled crack item carries `turn_id`) and B14 MINT
  (the real UserPromptSubmit hook mints a UUID, and the capture that follows carries it). The whole chain is witnessed, not
  only planted records.
- **The carriers keep `--said`; the spec made it optional.** `teaching_gate.mjs` `B.bank-verbatim` reds a bank with
  `no --said` (`:678`), and a gate may only get stricter, so the carriers teach `--said` as the selector of HIS bytes. Its
  omission still banks the whole message at the door. `scripts/teaching_bar.mjs` is NOT edited: its `[BANK]` line feeds the
  skeleton whose widest shape is measured against a byte budget at its own measurement. One added phrase read RED in
  `turn_hook selftest` ("the widest skeleton is 2903 B … budget 2814 B"), and no budget is typed here. The forge REFERENCE
  carries the rule once, in THE BANK section, rather than at its other three bank lines, so the shared file has fewer hunks
  for the mtrap merge.
- **Stricter at the door than the spec:** a `--gut` on a message that carries no gut-word is refused at the bank too (row
  270, already a gate red). The spec named only the disagreeing case.
- **mbank-7 (A):** `countHedges(answerOf(said))` at capture time for every door, and the same helper in the round's fallback.
  `scripts/register.mjs` is not touched.
- **study_scope.mjs** carries the `answerOf` export only, and no selftest case (the brief's narrowing). It is exercised by
  the gaffer_brain selftest and by B6. **notes_compiler.mjs** carries the one stamp only, and no selftest case; B13 holds it.
- **The CODE DOOR's session check** is skipped when `CLAUDE_CODE_SESSION_ID` is unset, and the row then says
  `session_checked:false`.

## 5 · OWED, NOT GUESSED

- **mcap seat (row 1194 (1)):** the c18 amendment in `ci/witness/mcap/*`, which joins by `turn_id` with `cap.spoken_src ===
  "prompt"` and drops `fold(words) === fold(spoken)`. That is not this unit's file. This build guarantees both rows (and the
  compiled crack item) carry the id.
- **The runner, on his laptop, counts only, before the landing row (spec §7):** `CLAUDE_CODE_SESSION_ID` set in a study turn
  and equal to the hook payload's `session_id` (booleans); `prompt.at` before the bank row's `ts` in one live turn; whether a
  Desktop study turn fires UserPromptSubmit; the mbank-3/-4/-5/-7 counts over the grade queue; xray Q2/Q5 on his tree;
  the share of Stop rows reading `session-mismatch`.
- **The parallel build (claude/mtrap-build @ a4191c9):** no line of the base is edited by both. forge_session: mbank edits
  the base lines around `:650`-`:676`, `:797`, `:873` and `:2701`; mtrap edits `:699`, `:729` and `:3121`. notes_compiler:
  mbank edits `:354` only; mtrap edits nineteen other hunks. `.claude/skills/forge/SKILL.md`: mbank after `:48`, mtrap after
  `:32`. `git merge-tree --write-tree` of the two tips exits 0. The second to land merges by the row 1212 class.

## 6 · CHECKPOINT

CHECKPOINT · STOPPED at 2026-11-21T06:40Z · resume from: the architect's ruling on FORK mbank-1. On (d): move
`hisPrompt`/`readHisPrompt` into `scripts/study_scope.mjs` (forge_session re-exports, gaffer_brain imports statically),
re-cut B9 to pin the door in study_scope, then re-run the witness both ways, the mutants and the hermetic profile, push once.
On (A) kept: the LAW PACK red needs a ruling of its own.

## 7 · NEW MAIN 7bf008b (mdet dfe26a1 · mdtl2 4d582d5 · mclk 7bf008b landed; the architect's order by the runner, forks rows 1226 / 1228, 21 Nov 2026)

`git fetch origin main && git merge --no-edit FETCH_HEAD` made merge commit `6a1d800` (6a1d800484f422c5e82bbe03e6e207cbba5bb78d). It applied with **no
conflicted file**. Main's change since 5301f15 touches `package.json` and `scripts/organism_test.mjs`, which this build never
edits, and none of this build's named files. Every landed line of the other units stands as main wrote it. `ci/mbank/BASE`
still names the cut (5301f15). Each run below is on 21 Nov 2026, with the base leg on a clone of main 7bf008b:
```
$ node ci/mbank/witness_mbank.mjs --org <merge clone> --base-org <main 7bf008b clone>
GREEN MBANK … · 16 clause(s)
$ node ci/mbank/witness_mbank.mjs --org <main 7bf008b clone> --base-org <main 7bf008b clone>
RED MBANK · B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14
$ node ci/witness/mbank/witness_bank.mjs plants --tree <merge clone>
PLANTS mbank · 14 of 14 plant(s) as expected
$ node ci/mbank/run_mutants_mbank.mjs --org <merge clone> --base-org <main 7bf008b clone>
run_mutants: 14 of 14 mutant(s) RED by the clause that names them · control GREEN
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
main 7bf008b: organism_test: 165 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 125 (hermetic: named, not run)
merge:        organism_test: 166 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 125 (hermetic: named, not run)
```
The merge's one red is still LAW PACK (FORK mbank-1, §4). Main's one red in that run was the mcap clause-witness member,
whose last line read `PLANTS mcap · 86 of 86 plant(s) as expected`. It is GREEN in the merge run and on its own re-run.
Both suites ran in parallel on one machine, so it is named as a load effect, not a verdict, and this build touches none of
its files. The witness derives no day from the clock, so the mclk door does not bear on it.

CHECKPOINT · merge 6a1d800 pushed · neutral legs: see the ledger row `ci` for this sha · resume from: the architect's ruling on FORK mbank-1 (§6)
