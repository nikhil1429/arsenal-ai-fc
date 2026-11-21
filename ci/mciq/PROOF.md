# UNIT mciq · PROOF (forks row 1256 (2)) — branch claude/mciq-build

A build, no spec: the class that removes a standing brake. Measured 21 Nov 2026 (UTC) in a cloud build seat; every line
below names the command that produces it.

## Base
- Cut from main `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f` (`git fetch origin main`, `git checkout -b claude/mciq-build FETCH_HEAD`), written to `ci/mciq/BASE`.

## The edit (named files only) — `.github/workflows/suite.yml`, lines at this cut
- `.github/workflows/suite.yml:43-52` — ADDED, the header comment (why, row 1256, the syntax and how it composes).
- `.github/workflows/suite.yml:55` — CHANGED (was `:45` at 7bf008b): `branches: ["**"]` → `branches: ["**", "!superseded/**", "!claude/*-queue"]`.
- Nothing else in the file moved: pull_request, workflow_dispatch, the concurrency group and both jobs' matrices are byte-equal to 7bf008b.
- For the merge class (item (4)): unit mherm (landed) wrote the hermetic-twice job, below line 230, untouched here; unit mshard (not landed) rewrites the file — the later of mshard and mciq lands by the merge class, carrying these two hunks.
- **Syntax, named:** `branches` with NEGATED patterns (not `branches-ignore`). GitHub reads the patterns in order and the LAST matching one decides; `branches` and `branches-ignore` cannot both sit on one event, and keeping `"**"` first leaves every other ref exactly as it was. It composes: a push filter gates the push event alone, so pull_request and workflow_dispatch trigger as before; an excluded ref starts no run, so it never enters the concurrency group (`suite-${{ github.ref }}`), which is unchanged.

## The unit witness, both ways (21 Nov 2026) — `node ci/mciq/witness_mciq.mjs --org <LF tree> --base-org <LF tree 7bf008b>`
- build tree (HEAD) vs base: `GREEN MCIQ the push trigger runs main, land/**, claude/*-build, claude/*-spec and every other branch and draws no run for superseded/** or claude/*-queue, both legs and the other triggers kept · 8 clause(s)` (exit 0)
- base tree read as the org: `RED MCIQ · IGNORE` (exit 1) — claude/mbank-queue and superseded/mgat-007676e each draw a run on 7bf008b.
- no --base-org: `RED MCIQ · KEEP, BOUND` (exit 1).
- By name, on the build: main · land/mbank · claude/mbank-build · claude/mjset-spec · ordinary-branch RUN; claude/mbank-queue · superseded/mgat-007676e draw NO run. On the base every one of the seven runs.
- MAIN, LAND, BUILD, LEGS, KEEP hold on the base as on the build (the base already ran every ref); their RED side is planted by the mutants below.
- The glob (GitHub's filter cheat sheet: `*` never crosses `/`, `**` does, `?` `+` `[]` `\` `!`) is implemented in the witness itself, no dependency.

## Mutants (21 Nov 2026) — `node ci/mciq/run_mutants_mciq.mjs --org <LF tree HEAD> --base-org <LF tree 7bf008b>`
- `run_mutants: 3 of 3 mutant(s) RED by the clause that names them · control GREEN` — M1 the land/** trigger dropped (RED MCIQ · LAND, row 1256 (2)'s named mutant) · M2 main dropped (RED MCIQ · MAIN) · M3 the ignore removed (RED MCIQ · IGNORE).

## Members touched, before and after (21 Nov 2026)
- `node scripts/ci_verdict.mjs selftest` (reads suite.yml's matrix line): LF tree 7bf008b `ALL CHECKS PASSED` · LF tree of the build `ALL CHECKS PASSED`.
- The WITNESSES member (`scripts/organism_test.mjs`, unit ms1) gains unit mciq; off the neutral machine it is one named skip line.
- unit mherm's witness names suite.yml in its BOUND (a seat-time clause the member drops): not re-run here.
- SUITE_PLACEHOLDER

## LAW M and the law pack (row 1130 (2)) — `node scripts/lawpack.mjs gate`, LF clones (core.autocrlf=false), 21 Nov 2026
BASE  (clone 7bf008b) `lawpack · 1953 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7`
build (clone 6e61181) `lawpack · 1953 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7`
both  `lawpack: GREEN — no law's finding count rose, and every rule is on disk`. Every count equal: this build raises none.
- `node scripts/models.mjs check`: exit 0 (21 Nov 2026).
- Canon-count replay (LOAD ZERO BLOCK 7) over the COMMIT blobs before the push: CANON_PLACEHOLDER

## CI (the neutral machine) — check runs read through the public API
- See ci/mciq/LEDGER.jsonl for each push's run ids and verdicts.

## FORKS
- F1 · the effort receipt tool `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository: A · the runner carries it · B · drop the step for cloud seats.
- F2 · this branch's own pushes: `claude/mciq-build` is a build tip and still draws both legs (row 1256 (2)); only `claude/mciq-queue` stops drawing runs, and only once this lands.
- F3 · a pull_request event is not filtered by this edit: a PR opened FROM a queue or superseded branch would still run (none is opened by any seat today). A · leave it · B · add the same negations under pull_request (`branches` there filters the BASE branch, not the head, so it cannot express this; it would need a job-level `if:` on github.head_ref).
- F4 · row 1256 (3), named for him, not ruled: whether a build tip whose tree equals its land tip needs its own pair of legs; runs can be cancelled only by his hand in the GitHub page.
