# MF2 PROOF — a LIVE assert is not EXECUTED in the hermetic profile (B1 FORK 2 · rows 1022 (3)(4) / 1024 (2))

**Base:** `origin/main` at `15edfec` (not stacked: a different file). **Branch:** `claude/mf2-build`.
**Named file:** `scripts/organism_test.mjs` only.

## Measured before writing (at `15edfec`)
- `assert()` (`scripts/organism_test.mjs:45-49`) asks `liveAssert(name)` (`:220-225`) first and returns without judging — but
  every argument, the condition included, is already evaluated at the call: a LIVE assert was COMPUTED, then ignored.
- The table `LIVE_ASSERTS` (`:158-208`) holds 49 keys (counted from the file, 18 Nov 2026); their call sites sit in three
  modes: `integrity()` (`:377`, five sites), `laws()` (`:748`, forty-two sites in six blocks: SNAPSHOT `:750-783`,
  GUT-WORD `:789-803`, A9 `:870-928`, LOAD ZERO BLOCK 1–4 + HIS ANSWERS `:934-1079`, ONE SCHEDULE `:1149-1170`,
  S8 `:1742-1772`) and `hermetic()` (`:2006`, two sites: the trip metric's snapshots `:2161` and the sanctioned write's `:2217`).
- Which blocks mix LIVE and hermetic members: ONE SCHEDULE (two LIVE, one hermetic — the frozen-twins check reads source only);
  `hermetic()` (the trip metric is LIVE, the selftest loop and the F-6 instrument are hermetic). Every other block above holds
  LIVE members only; nothing after `:1079` reads a binding those blocks declare.
- The mode-level and selftest-level LIVE members were already never run (`:2713`, `:227`); this unit touches neither.

## What was built
| Ruled | Where |
|---|---|
| a LIVE assert is not executed under hermetic, never computed then ignored | `skipLive(...names)`: each LIVE block is entered only when it is false. True only under the hermetic profile AND only when EVERY name handed is a member of `LIVE_ASSERTS` (a name off the table runs its block as before — the table stays the one ratchet, a member joins only by a row); each name is then printed `LIVE <name> — <reason>` exactly as `liveAssert` prints it |
| the mixed blocks split at block level | ONE SCHEDULE: its two LIVE asserts (and the three owner imports that feed only them) sit inside the gate; the frozen-twins assert stays outside. `hermetic()`: the snapshots, hashes, forensics and verdict of the trip metric sit inside the gate; the selftest loop runs exactly as before either way; the sanctioned-write block is gated, its `gitignored` assert is not |
| the full profile runs every assert exactly as before | `skipLive` returns false under the full profile, so every block runs unchanged; `liveAssert` stays in `assert()` as the backstop (nothing deleted, nothing renamed) |
| no assert deleted or renamed, the LIVE count does not rise | the same 49 call sites; two LIVE names whose number is read off live state are printed FOLDED under hermetic (`(# declaration(s) checked)`; the others' numbers come from source and are printed exact) |

## Witness, both ways — `node ci/mf2/witness_mf2.mjs --org <tree> --base-org <tree>`
LF `git archive` trees of `15edfec` (base) and the build commit, the repo's `node_modules` linked in, a planted `claude` /
`gemini` that refuses first on PATH. The PLANT (F1): in each copy, every assert call whose name is a `LIVE_ASSERTS` member
gets a side effect evaluated with the call — one marker file per site into a temp dir.

- Build vs base (`ci/mf2/out/witness_build.txt`): F1 · F2 · F3 · F4 · BOUND · LAST GREEN —
  `GREEN MF2 a LIVE assert is never executed in the hermetic profile, and the full profile runs every one as before · 6 clause(s)`
  (F1: 49 sites planted; hermetic markers build 0, base 49; full markers 49 on both.)
- Base vs base (`ci/mf2/out/witness_base.txt`): see that file's last line; F1 is the clause RED on the base (the base
  computes every LIVE assert under hermetic). **F2, F3, F4 are preservation clauses** (the build must equal the base), so
  base-vs-base reads them GREEN by construction; each is shown to bite by its own mutant below.

## Mutants — `node ci/mf2/run_mutants_mf2.mjs --org <build> --base-org <base>` (`ci/mf2/out/run_mutants.txt`)
MUTANTS_LINE

F1 (skipLive never skips), F2 (FOUR-MOMENTS judged inverted), F3 (a hermetic member joins `LIVE_ASSERTS` with no row — the
count rises), F4 (skipLive skips under the full profile), BOUND (a second file touched), LAST (the suite leaves a process
naming its tree; the runner kills it after the witness named it).

## Gates (measured 18 Nov 2026, this container)
- `scripts/organism_test.mjs` carries no `selftest` mode (it IS the suite, excluded from its own coverage by name, `:60`);
  its headline is the measurement: `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` in the repo checkout,
  base `organism_test: 139 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)` → build the SAME line
  (the one red, on both, is `EVERY organ with a selftest is wired into a suite`, orphaned: home_pin, probe, study_scope)
- full profile in the archive trees, measured 18 Nov 2026 (F4): `organism_test: 284 passed, 20 failed · ruled 0 · UNRULED 20` on base and build, member for member
- `node scripts/models.mjs check` exit 0

## FORKS
1. **The laws() sandbox is still built under hermetic.** `const sb = sandbox()` (`:787`) copies dressing-room/state, and
   hermetic members (FOUR-MOMENTS, BLIND RAIL, …) run inside it, so the copy still happens; no LIVE assert executes in it any
   more. Not building it needs those hermetic members moved onto a planted state tree — a separate unit.
2. **Two LIVE names print folded under hermetic** (`a declared external producer … (# declaration(s) checked)`): their number
   is read off `state/brain_config.json`, which is exactly what is no longer computed. The member, its key and the count are
   unchanged; the base printed the number.
3. **`LIVE selftest thalamus` prints once, not twice**: the base printed it a second time from the sanctioned-write block,
   which is now gated. `lived` already counted it once; the headline is unchanged.
4. `liveAssert` stays inside `assert()` as a backstop: a future LIVE member whose block is not gated would still be named,
   never judged — computed again, though. A suite assert that a LIVE name never reaches `assert()` under hermetic would close
   that; it changes the suite's output, so it is left for a ruling.
