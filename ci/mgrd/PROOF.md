# PROOF · unit mgrd — THE STATE PUSH MEETS ORIGIN (ruling row 1029 (3))

Branch `claude/mgrd-build`, made from `origin/main` at `15edfec` (18 Nov 2026). Spec: `ci/mcr/B2_SPEC.md` §4, clauses
G1–G3 plus MUT, on branch `claude/mcr-b2-spec`. Where the spec and the ruling differ the RULING wins (named below).

## 1 · MEASURED at the base `15edfec`

| Fact | Where |
|---|---|
| The ONE unattended committer + pusher of `dressing-room/state/` is `pushOnlyPass` (mode `push`) | `scripts/groundsman.mjs:238-295`, `:394-405` (main's `push` mode) |
| Its schedule: task `ArsenalFC-Groundsman-Push`, `groundsman.mjs push`, `DAILY /ST 03:45`, through `run_logged.cmd` | `setup/INSTALL_CYBORG_TASKS.ps1:165` |
| It never fetched: header "No pull, no lease, no tick" | `scripts/groundsman.mjs:234-237` |
| Range read `@{u}..HEAD` (held landings) before staging | `scripts/groundsman.mjs:147-160`, called `:280` |
| Staging, lock 1 | `scripts/groundsman.mjs:283` |
| Own commit made BEFORE the push; a rejected push only reports | `scripts/groundsman.mjs:291-293` |
| The Kennel's `nightPass` already pulls `--ff-only` first (untouched by this unit) | `scripts/groundsman.mjs:190-191` |
| The card owner CLI and its keyed `file` verb | `scripts/captains_call.mjs:1731-1734` |

## 2 · BUILT (`scripts/groundsman.mjs`, the one named code file)

- `sh` takes an optional extra env (the rebuild's private `GIT_INDEX_FILE`) — `scripts/groundsman.mjs:184-187`.
- `meetOrigin` + `dirtyOverlap` + `cardOnce` — `scripts/groundsman.mjs:189-264`:
  ancestor → as before; no own commit → `git merge --ff-only <O>`; own state commits + origin moved by NO state path →
  each rebuilt by plumbing (`read-tree O` into a private index, `rm --cached -f dressing-room/state`, `read-tree
  --prefix=dressing-room/state/ <c>:dressing-room/state`, `write-tree`, `commit-tree` with its own author + message),
  then `read-tree -m -u` (two-way: his dirty paths stay, an overlap refuses) and a compare-and-swap `update-ref HEAD`.
  Origin moved a STATE path → `idle STATE-CONFLICT`, card key `groundsman:conflict:<O12>`, nothing rewritten. A dirty
  path origin moved → `idle DIRTY-PATH <path>`, card key `groundsman:dirty:<O12>`, nothing moved. Cards ride
  `captains_call.mjs file --line … --key …` only (its key idempotency keeps it ONE card).
- `pushOnlyPass` fetches `origin main` FIRST every night (`:356`), then the held range (fresh), then `meetOrigin` (`:361`);
  with nothing new to stage but own commits still unpushed it pushes them (`:368`). A rejected push is `idle PUSH-RACE`,
  never forced.

Ruling vs spec: the spec put the fetch AFTER the held read (§4 "between :281 and :283"); the ruling says the push
FETCHES before staging — built as fetch → held read → meet → stage, so the held read sees the fresh `@{u}`.

## 3 · WITNESS — `ci/mgrd/witness_mgrd.mjs` (real git, a bare origin, plants under `os.tmpdir()`)

Run 18 Nov 2026 over archive trees (`git archive`) of base `15edfec` and build `5fe154b`:

```
  ✓ G1 · base RED · build GREEN — rebuilt+pushed true (groundsman: push-only — PUSHED (the sentinel's mini-brief reads tonight's truth)) · conflict idles one key true
  ✓ G2 · base RED · build GREEN — ff+pushed true · dirty idles one key true
  ✓ G3 · base RED · build GREEN — fetched on a quiet night true · held still refuses true
  ✓ BOUND · 2 differing path(s), all named
  ✓ LAST · 0 node process(es) naming the temp dir survive
GREEN MGRD state push meets origin · 5 clause(s)
```

Both ways: every clause is run on the base (must be RED — the base never fetched) and on the build (must be GREEN); a
clause GREEN on the base fails the witness ("does not discriminate").

## 4 · MUTANTS — `ci/mgrd/run_mutants_mgrd.mjs`

```
  ✓ M1 G1 · the rebuild lays NO own state subtree over origin's tree (own bytes lost) → RED MGRD · G1, BOUND
  ✓ M2 G1 · a moved state path is never seen (the conflict check is blind) → RED MGRD · G1, BOUND
  ✓ M3 G2 · no fast-forward when behind (the ff is skipped) → RED MGRD · G2, BOUND
  ✓ M4 G2 · a dirty-path refusal files no card → RED MGRD · G2, BOUND
  ✓ M5 G3 · the nightly fetch is gone → RED MGRD · G1, G2, G3, BOUND
  ✓ control → GREEN MGRD state push meets origin · 5 clause(s)
run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
```

(BOUND goes red on every mutant too: the mutant's groundsman bytes are not the build's — expected, and the named clause
is red in its own right.)

## 5 · TOUCHED SELFTEST, headline before and after

```
node scripts/groundsman.mjs selftest   # at 15edfec, 18 Nov 2026
ALL CHECKS PASSED
node scripts/groundsman.mjs selftest   # at 5fe154b, 18 Nov 2026 (two new asserts: the fetch comes first; a failed fetch stages nothing)
ALL CHECKS PASSED
```

## 6 · SUITE (hermetic, a shared clone + npm ci each), 18 Nov 2026

```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
15edfec  organism_test: 137 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
5fe154b  organism_test: 137 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
```

The same three reds by name at both shas (the coverage law's orphans; `sandbox` selftest; the members roll-up): no new red.

## 7 · `node scripts/models.mjs check` → exit 0 (18 Nov 2026, at 5fe154b)

## 8 · FORKS

1. The spec's G2/G3 rows say "refused exactly as today (:281)" for a held range — kept, but the range is now read AFTER
   the fetch; a commit that origin already holds no longer counts as held (it is not in `@{u}..HEAD`). Named, not ruled.
2. A STATE-CONFLICT is any `dressing-room/state/` path moved on origin since the meeting point (the spec's rule), not
   only a path the own commits also touched — the stricter reading. A finer per-path rebuild is possible; architect's call.
3. The rebuilt commits carry their original author and message but a new committer date (commit-tree); their shas
   differ from the local ones by construction.
4. `nightPass` (the Kennel) is unchanged: it already pulls `--ff-only` first and is not installed.
5. `scripts/groundsman.log` (laptop) stays UNREAD: whether the diverged-main shape ever happened is not measured here.
