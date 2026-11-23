# UNIT mtrain · PROOF (row 1313 (2), serving its law (1)) — branch claude/mtrain-build

A build, no spec. Measured 22 Nov 2026 (UTC) in a cloud build seat; every line below names the command that produces it.

## Base
- Cut from main `84cbc03126eddb85c7d5cf54b51610068800315c` (`git fetch origin main`, `git checkout -b claude/mtrain-build FETCH_HEAD`), written to `ci/mtrain/BASE`.

## The verb at the cut (84cbc03, found by text)
- `scripts/land.mjs:13` C1 (row 1023) THE SHA JUDGED IS THE SHA LANDED · `:65` THE LEDGER (L2) · `:129` `function verdictAt(t)` · `:182` the MULTI-COMMIT refusal · `:214-215` step 6, `const v = verdictAt(T);` · `:164` / `:262` the two ledger `record(...)` calls · `:353` main() hands opt to land().

## What moved (named files only: scripts/land.mjs, ci/mtrain/) — `git diff -U0 84cbc03 HEAD -- scripts/land.mjs`
Every edited line of the verb, at the tip (old line → new lines):
- `:14` → `:14-18` the header: the old line's words all kept (C1's sentence on `:13` untouched); the law line C1-TRAIN (row 1313 (1)) written BESIDE C1, never instead of it, naming the four refusals and that the landed commit is still exactly one commit and still what main becomes.
- `+:29` a MODES line for `--train-top <sha>` (added; the usage line of `main()` is NOT edited — FORK F3).
- `+:163-184` two new functions: `trainTopArg(argv)` (the flag's grammar: once, `--train-top <sha>`, a value that is not another flag) and `trainTop(T, raw)` (the top resolves; T is the top, or `git rev-list --first-parent --parents <top> ^T` ends at a commit whose first parent is T; every commit of that chain has one parent).
- `:160` → `:187` the JSDoc of `land()` gains `trainTop` · `+:189-190` `topOf` (the `train_top` field, `{}` without the flag) · `:164` → `:193` `stop()`'s ledger row spreads `...topOf` · `+:198` REFUSED TRAIN-TOP-FLAG right after BAD-UNIT, before any fetch.
- `:214-215` → `:244-248` step 6: the top is checked (REFUSED TRAIN-TOP-UNRESOLVED · TRAIN-TOP-NOT-DESCENDANT · TRAIN-TOP-MERGE, nothing landed) and the verdict is read at the top under the flag, at T without it.
- `:262` → `:295` the LANDED ledger row spreads `...topOf` · `:353` → `:386` main() passes `trainTop: trainTopArg(argv)`.
- No other line moves: one commit per landing (MULTI-COMMIT), the state/settings/NO-CI-DIR/tripwire/names-gate/sitting/live/judge gates, the ff, the push and every printed line are byte-identical. Without the flag the ledger row is byte-identical to today (`...{}` adds no key).

## The unit witness, both ways (22 Nov 2026) — `node ci/mtrain/witness_mtrain.mjs --org <tree> [--base-org <tree>]`, LF trees through a private index
- tip tree vs 84cbc03 tree: `GREEN MTRAIN the verdict read at a train top · 10 clause(s)` (exit 0) — TOP · NONDESC · MERGE · TIP · FLAG · LEDGER · TRAIN · HEADER, each base RED and build GREEN, then TREE BOUND (3 differing paths, all named) and LAST (0 survivors).
- 84cbc03 read as head: `RED MTRAIN · TOP, NONDESC, MERGE, TIP, FLAG, LEDGER, TRAIN, HEADER, TREE BOUND` (exit 1).
- no --base-org (rows 1307 (1) / 1311 (1)): `GREEN MTRAIN the verdict read at a train top · 9 clause(s)` (exit 0), the line `TREE BOUND not judged — no --base-org: BOUND is never judged against a frozen sha`. The one whole-tree clause carries the id `TREE BOUND` (the suite member's `boundIds` drops it at head).
- Planted, never live: bare origin + seat + laptop repos under os.tmpdir(), each made with core.autocrlf=false at init/clone; the planted `scripts/ci_verdict.mjs` answers GREEN only for the shas named by the env door `MTRAIN_GREEN`; no port, no network, no service, no model.

## Mutants (22 Nov 2026) — `node ci/mtrain/run_mutants_mtrain.mjs`
- `run_mutants: 8 of 8 mutant(s) RED by the clause that names them · control GREEN` — the row's three: M1 a top that is not a descendant accepted (RED by NONDESC) · M2 a merge between accepted (RED by MERGE) · M3 the verdict still read at the tip with the flag given (RED by TOP); and M4 no flag reads the parent (TIP) · M5 the flag twice accepted (FLAG) · M6 the landing row drops the top (LEDGER) · M7 a multi-commit landing under the flag (TRAIN) · M8 the law line drops row 1313 (1) (HEADER).

## Members touched, before and after (22 Nov 2026)
- mland unit witness `node ci/mland/witness_mland.mjs --org <tree> --base-org <7fde711 tree>`: at the cut `RED MLAND · BOUND`; at the tip `RED MLAND · BOUND` — the same last line, BOUND its only ✗ both times (BOUND is dropped by the suite member).
- `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, on shared clones with the pinned node_modules linked, 22 Nov 2026: cut `organism_test: 173 passed, 0 failed · ruled 0 · UNRULED 0`; tip `organism_test: 171 passed, 2 failed · UNRULED 2` — the two were CLAUSE WITNESS mcap and mdayv (each printing every plant as expected) while both suites ran at once; the tip's `clauses` member re-run alone, 22 Nov 2026: first `13 passed, 1 failed` (mcrk2 12 of 13), then `organism_test: 14 passed, 0 failed · UNRULED 0`; `node ci/witness/mcrk2/witness_crack_gap.mjs plants` 13 of 13 at cut and tip. None of the three reads scripts/land.mjs or ci/mtrain/ (FORK F2).
- The same suite run in this seat's own checkout (no node_modules, 22 Nov 2026): 151 passed, 8 failed — every red an ERR_MODULE_NOT_FOUND or a shallow-clone read; measured again on the clones above.
- WITNESSES member, the neutral flags (`ORGANISM_TEST_PROFILE=hermetic GITHUB_ACTIONS=true GITHUB_WORKSPACE=<tip clone> node scripts/organism_test.mjs witnesses`), on a shared clone of the tip, 22 Nov 2026: `witnesses · 64 unit(s) · 1464.6 s` · `organism_test: 124 passed, 5 failed · UNRULED 5` — 59 of 64 units GREEN at head against their BASE, mtrain among them (`witness ‹mtrain› 13.1 s · GREEN MTRAIN the verdict read at a train top · 10 clause(s)`). The 5 reds are mr3 · mrf · mrj · mrt · mrv, each `its BASE is in the clone` (52b51c1 / 51055bb are not commits of this seat's clone, which holds main's history only — the member never fetches): a seat measurement limit, not a red of this unit (FORK F5).
- `node scripts/models.mjs check`: exit 0 (22 Nov 2026), `hits 0 · declared 0`.

## The law pack counts (row 1130 (2)) — `node scripts/lawpack.mjs gate` on LF trees, 22 Nov 2026
- BASE 84cbc03 and build tip, identical: `owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7`. No count rises. Both trees also print the same `INSTRUMENT DEAD — the raw-NUL byte scan: git ls-files failed` (an LF tree is not a git work tree), exit 1 on both sides alike.

## Canon count (row 1169) — the LOAD ZERO BLOCK 7 scan replayed over the COMMIT blobs (`git show <sha>:<path>`)
- see the ledger row `canon scan` for the pushed sha.

## FORKS
- F1 · `--train-top` resolves the top LOCALLY only (`git rev-parse`); the verb fetches `origin main` and `land/<unit>` as today and never the top. The runner fetches the top before the call (REFUSED TRAIN-TOP-UNRESOLVED names it). A · keep (no fetch line moves) · B · the verb fetches `<top>` too.
- F2 · the hermetic `clauses` member reads red on a different clause witness per run under load (mcap, mdayv, then mcrk2), all green alone; none reads this unit's files. Named for the architect, not fixed here (beyond the named files).
- F3 · `main()`'s usage string (`land.mjs:384`) is not edited, so `land.mjs help` does not show `--train-top`; the header MODES line does. A · keep (no other line moves) · B · add it to the usage string.
- F5 · five landed units' BASE shas (mr3 · mrf · mrj · mrt · mrv) are absent from a clone of main's history, so the WITNESSES member cannot judge them in a seat; the neutral machine's checkout decides them.
- F4 · the effort receipt tool `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository (see the final message).
