# UNIT mq3 · PROOF (forks row 1289 (1)) — branch claude/mq3-build

A build, no spec. Measured 22 Nov 2026 (UTC) in a cloud build seat; every line below names the command that produces it.
Every push to this branch carries `[skip ci]` in its head commit message (row 1289 (2)): its neutral legs are read on
the land tip the runner cuts from this tree, never here.

## Base
- Cut from main `d585648e3438147d97140248c69f900af7327d58` (`git fetch origin main`, `git checkout -b claude/mq3-build FETCH_HEAD`), written to `ci/mq3/BASE`.

## The edit (named files only), lines at this cut
- `.github/workflows/suite.yml:62-63` — the mciq sentence kept, `claude/*-build, claude/*-spec` STRUCK in place (`~~…~~`) with a one-line pointer to mq3.
- `.github/workflows/suite.yml:65-75` — ADDED, the mq3 header comment: why (the runner's 22 Nov measurement, row 1289), the syntax, what still runs, and the sentence "A seat that needs the neutral machine before its cut asks the runner for a land tip."
- `.github/workflows/suite.yml:78` — CHANGED (was `:66`): `["**", "!superseded/**", "!claude/*-queue"]` → `["**", "!superseded/**", "!claude/*-queue", "!claude/*-build", "!claude/*-spec"]`. Same negated-pattern syntax as mciq, appended after it (the LAST match decides).
- pull_request, workflow_dispatch, the concurrency group and every job are byte-equal to d585648 (clause KEEP and LEGS below).
- `ci/mciq/witness_mciq.mjs:10-12` (THE LAW, old words struck), `:19-21` (THE NAMED REFS, struck + re-cut), `:25-26` (the BUILD clause, struck + re-cut), `:54-55` (REFS: `claude/mbank-build`, `claude/mjset-spec` → `run: false`, `~~run: true~~` beside each), `:249-250` (the GREEN line, old text struck in a comment).
- `ci/mciq/run_mutants_mciq.mjs:13-16` (header: M3 re-cut, M4 added), `:31`, `:33` (the failure lines' count 3 → 4), `:40-42` (M3 re-cut in place — it drops only mciq's two negations, since `["**"]` would now also redden BUILD; old edit struck in a comment — and the ONE added mutant M4 that restores the old list and is RED by BUILD).

## The unit witness, both ways (22 Nov 2026) — `node ci/mq3/witness_mq3.mjs --org <LF tree> --base-org <LF tree d585648>`
- build tree (17d855e) vs base: `GREEN MQ3 a push to main, land/** and every other branch draws a run and claude/*-build, claude/*-spec, claude/*-queue and superseded/** draw none, both legs and the other triggers byte-kept · 10 clause(s)` (exit 0)
- base tree read as the org: `RED MQ3 · BUILD, SPEC` (exit 1).
- By name, on the build: main · land/mjset · land/mq3-build · land/maud43-spec · claude/some-other-branch · ordinary-branch DRAW A RUN; claude/mbank-build · claude/maud43-spec · claude/mbank-queue · superseded/mgat-007676e draw NO run. On the base the first eight draw a run, the last two none.
- GitHub's filter glob (`*` never crosses `/`, `**` does, `?` `+` `[]` `\` `!`, last match decides) is implemented in the witness, no dependency.

## Mutants (22 Nov 2026) — `node ci/mq3/run_mutants_mq3.mjs --org <LF tree 17d855e> --base-org <LF tree d585648>`
- `run_mutants: 9 of 9 mutant(s) RED by the clause that names them · control GREEN` — M1 land/** dropped (LAND) · M2 main dropped (MAIN) · M3 the build exclusion removed (BUILD) · M4 the spec exclusion removed (SPEC) · M5 a pattern that also swallows land/**, `"!**-build"` (LAND, via land/mq3-build) · M6 `"!claude/**"` appended (OTHER) · M7 mciq's two exclusions removed (IGNORE) · M8 npm-test's matrix cut to `[22]` (LEGS) · M9 the concurrency block changed (KEEP).

## The mciq witness, re-cut (22 Nov 2026)
Reference for the seat-time BOUND: the LF tree of d585648 with this build's `ci/mq3/` laid over it, so only mciq's named files differ.
- new witness, build as org: `GREEN MCIQ the push trigger runs main, land/** and every other branch and draws no run for superseded/**, claude/*-queue, claude/*-build or claude/*-spec, both legs and the other triggers kept · 8 clause(s)` (exit 0).
- new witness, base d585648 as org: `RED MCIQ · BUILD` (exit 1) — the re-cut clause both ways.
- OLD witness (d585648's) on the build: `RED MCIQ · BUILD`; on the base: `GREEN MCIQ … · 8 clause(s)` — the old expectation, measured.
- `node ci/mciq/run_mutants_mciq.mjs`: `run_mutants: 4 of 4 mutant(s) RED by the clause that names them · control GREEN` (exit 0); M4 the old list restored → `RED MCIQ · BUILD`. The OLD runner on the build: `run_mutants: 1 of 3 … · control RED`.
- Against its own BASE 7bf008b (what the WITNESSES member does, BOUND dropped as seat-time): build `RED MCIQ · BOUND` only, base d585648 (old witness) `RED MCIQ · BOUND` only — so the member reads GREEN at head both sides.

## Members touched, before and after (22 Nov 2026, LF trees, BOUND is seat-time and dropped by the member)
Each unit that reads suite.yml, its witness at HEAD against its own BASE, run by hand (the member runs only on the neutral machine; off it, one named skip line). Last line, base d585648 → build 17d855e:
- mherm `RED MHERM · BOUND` → `RED MHERM · BOUND` · mdtl same · mdtl2 same · mshard same · mprk same · ms1 same · mclk same · mlaw same · mciq `RED MCIQ · BOUND` → same — nothing beyond BOUND on either side.
- mrj `GREEN MRJ … · 7 clause(s)` → same. mrf and mrj: their BASE `52b51c1` is not a commit in this shallow clone, so mrf read `RED MRF · USAGE` on both sides (unmeasured here, not a verdict) — F3.
- `node scripts/ci_verdict.mjs selftest` (reads suite.yml): base `ALL CHECKS PASSED` · build `ALL CHECKS PASSED`.
- `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, LF clones (core.autocrlf=false), run one after the other, 22 Nov 2026: base d585648 `organism_test: 170 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)` (exit 0) · build 17d855e `organism_test: 170 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)` (exit 0).

## LAW M and the law pack (row 1130 (2)) — `node scripts/lawpack.mjs gate`, LF clones, 22 Nov 2026
BASE  (d585648) `lawpack · 1952 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7`
build (17d855e) `lawpack · 1952 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7`
both  `lawpack: GREEN — no law's finding count rose, and every rule is on disk`. Every count equal: this build raises none.
- `node scripts/models.mjs check`: exit 0 on both trees (22 Nov 2026).
- Canon-count replay (LOAD ZERO BLOCK 7) over the COMMIT blobs before each push: in ci/mq3/LEDGER.jsonl.
- LAST: after the runs, no process naming an mq3/mciq temp dir survived (`ps`, 22 Nov 2026), and the planted trees were removed.

## CI (the neutral machine)
- Every push here carries `[skip ci]`: no run is drawn by this branch. The runner names the land tip's two legs to the architect.

## FORKS
- F1 · the effort receipt tool `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository (`Error: Cannot find module`); nothing written under campaign-2026-09/.
- F2 · mciq's M3 had to be re-cut beside the one added mutant: its old edit (`["**"]`) now reddens BUILD as well as IGNORE, so it would no longer be RED by its one clause. A · keep the re-cut (it drops only mciq's two negations) · B · the architect rules M3 should be retired instead.
- F3 · mrf and mrj's BASE 52b51c1 is absent from this shallow clone: those two members were not measured both ways here (each reads only the first `timeout-minutes` of suite.yml — `ci/mrf/witness_mrf.mjs:49`, `ci/mrj/witness_mrj.mjs:50-52` — and this build moves no `timeout-minutes` line). A · the land tip's neutral legs (full clone) judge them · B · a seat with a full clone re-runs them.
- F4 · the pull_request trigger is untouched (byte-equal), so a PR opened FROM a build or spec branch still draws a run — today no seat opens one. Same shape as mciq F3.
- F5 · ci/mshard/TIMES carries no entry for mq3 (a file beyond the named ones): the shard plan places mq3 as an unknown unit, as with every unit before its first timing.

## THE WITNESSES MEMBER over this tree (forks row 1292 (3), 22 Nov 2026)
- `ORGANISM_TEST_PROFILE=hermetic GITHUB_ACTIONS=true GITHUB_WORKSPACE=<clone> node scripts/organism_test.mjs witnesses`, unsharded, over an LF clone of dd3df41 (core.autocrlf=false) holding every remote ref, as `fetch-depth: 0` does: `organism_test: 125 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 0 (hermetic: named, not run)` (exit 0) · `WITNESSES · 59 unit(s) judged in 1669.3 s` · mq3 among them, GREEN at head against its BASE.
- F6 · a first run on a clone made by a local `git clone` alone (local branches only) read 95 passed, 5 failed: mr3, mrf, mrj and mrt `its BASE is in the clone` (their BASEs 52b51c1 and 51055bb are reachable only from remote branches), and the member then threw `TypeError [ERR_INVALID_ARG_TYPE] … Received null` at scripts/organism_test.mjs:3250 instead of judging the next unit. That was the planted clone, not this tree: with the remote refs fetched in, all units judged green. The throw on a unit after a missing-BASE unit is a member observation for the architect (scripts/organism_test.mjs is not a named file here).

CHECKPOINT · 2026-11-22T07:17Z · tip dd3df41 + this proof · WITNESSES member 59 unit(s) judged · 125 passed, 0 failed (exit 0) · witness GREEN MQ3 · 10 clause(s) · run_mutants 9 of 9 · control GREEN · for the runner's land tip
