# PROOF — unit mxw BUILD · xray reads an options-bag default path

Cloud builder, branch `claude/mxw-build`, written 2026-11-19 (UTC). Ruling row 1122 (1); spec `ci/mxw/MXW_SPEC.md`
at `e4013cb` (carried here unchanged, with its `witness/` siblings, so `ci/mxw/` is whole).

## BASE

`ci/mxw/BASE` = `224f9b90758d13edb42550f002d6c845cc7bb2a8` — `origin/main` at the moment this build was cut
(`git fetch origin main && git checkout -b claude/mxw-build FETCH_HEAD`). The spec measured on `95b07a6`; measured
2026-11-19 with `git diff --stat 95b07a6 224f9b9 -- scripts/xray.mjs scripts/notes_corrections.mjs scripts/learnstate.mjs`
→ empty, so every file:line of the spec holds at this base:

- `scripts/xray.mjs:621-633` — `seedDefaults`, the identifier-only rule at `:624` (`p.left.type !== "Identifier"`).
- `scripts/notes_corrections.mjs:106` — `add(p = {}, { path = LEDGER, … } = {})`; header SOLE WRITER at `:14`.
- `scripts/learnstate.mjs:794` / `:817` — `recordBrief(printed, { dir = STATE, … } = {})` / `bornBriefLog({ dir = STATE } = {})`; header `:17`.

## THE BUILD (F1 A only)

One file of the repo: `scripts/xray.mjs`, `seedDefaults` (`:621-636` on the build), the spec's patch applied as written
(`git apply` of `e4013cb:ci/mxw/witness/xray_seed_defaults.patch`, clean). A parameter yields `(name, defaultExpr)` slots:
`p = X` → `[p, X]` (base, unchanged); `{ a = X } = {}` → the inner slots; a property with no default yields nothing.
Same `evalNode`, same `isC` guard, same `paramEnv`. The fixpoint binder (`:656`) is untouched (F1 B not ruled).

Named files: `scripts/xray.mjs` · `ci/mxw/**` (BASE, LEDGER.jsonl, PROOF.md, witness_mxw.mjs, run_mutants_mxw.mjs,
MXW_SPEC.md, witness/). Nothing under `dressing-room/state` is in any commit of this branch.

## WITNESS — both ways (measured 2026-11-19, `node ci/mxw/witness_mxw.mjs --org <tree> --base-org <LF export of 224f9b9>`)

Each tree an LF export through a private index (`core.autocrlf=false`, `core.eol=lf`) under the scratch dir.

| --org | last line | exit |
|---|---|---|
| build (tip of this branch) | `GREEN MXW xray reads an options-bag default path · 8 clause(s)` | 0 |
| base 224f9b9 | `RED MXW · W1 W2 W5` | 1 |

W3 and W4 are invariants (GREEN both ways by design; their mutants carry them). W6 measured line on the build:
`(measured: Q2 1 → 1 · Q5 1 → 1)` (2026-11-19, the witness's own print). BOUND on the build: `differs only in 4 named
file(s)` at the time of that run. LAST: GREEN both ways; `ps -eo pid,args | grep -E "mxw-(witness|mutants)-"` → 0 after.

**Under the ms1 member** (measured 2026-11-19): a temp clone of `claude/ms1-build` `52b51c1` with this unit's
`ci/mxw/` + `scripts/xray.mjs` overlaid and every other `ci/<unit>/` removed (temp clone only), run
`GITHUB_ACTIONS=true ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs witnesses`:
`witness ‹mxw› 7.1 s · RED MXW · BOUND` → `ok WITNESS ‹mxw› · GREEN at head against its BASE` (BOUND is the one id the
member tolerates; that head differs from 224f9b9 by ms1's own files). Member last line:
`organism_test: 7 passed, 0 failed · ruled 0 · UNRULED 0` (command above, 2026-11-19).

## MUTANTS (measured 2026-11-19, `node ci/mxw/run_mutants_mxw.mjs --org <build export> --base-org <base export>`)

| clause | mutant | witness last line |
|---|---|---|
| W1 | M1 seedDefaults back to identifier-only (= base) | `RED MXW · W1 W2` |
| W2 | M3 the `= {}` AssignmentPattern(ObjectPattern) not unwrapped | `RED MXW · W1 W2` |
| W3 | M4 a no-default property inherits the bag's last default | `RED MXW · W3` |
| W4 | M2 slots() loses its `p = X` arm | `RED MXW · W4` |
| W5 | the real writer's default moved into the body (`notes_corrections.mjs:106`) | `RED MXW · W5 BOUND` |
| W6 | a second writer of brief_log.jsonl through an options-bag default | `RED MXW · W5 W6 BOUND` |
| BOUND | a file beyond the named ones differs (CLAUDE.md line 1) | `RED MXW · BOUND` |
| LAST | (own) a child naming the temp root alive at the sweep | `RED MXW · LAST` |
| control | unedited copy, whole witness | `GREEN MXW xray reads an options-bag default path · 8 clause(s)` |

`run_mutants: 8 of 8 mutant(s) RED by the clause that names them · control GREEN` (exit 0).
The spec's M4 was "not measured / maybe EQUIVALENT" (§6, §8): it is NOT equivalent once W3 plants a defaulted sibling
beside the no-default slot (`{ path, alt = join(STATE, "w3_alt.jsonl") } = {}`), which is the real house shape
(`{ path = LEDGER, now, by }`).

## TOUCHED SELFTEST — before and after, by headline

`xray` (the one organ touched), `node scripts/xray.mjs selftest` in each LF export (2026-11-19):
- base 224f9b9: `xray: 19 passed, 4 failed`
- build:        `xray: 19 passed, 4 failed`

The same four on both: three "`<calibration|dmn|rejirah>.mjs` really does contain NUL bytes" (0 NUL bytes in this
checkout, spec §8) and "unresolved_sinks is NON-INCREASING PER ORGAN" against its committed baseline (base: total
1475 → 2065; build: 1475 → 2015 — the build LOWERS the total by 50, measured by that command 2026-11-19). That
selftest is LIVE-only in the hermetic profile (it reads the committed IR), so the neutral machine never judges it.

## MEMBERS — before and after

No member file was touched (`scripts/organism_test.mjs` is not in this build: F4 rules the witness into `ci/mxw/`).
The hermetic suite, `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, each in a local `git clone`
(`core.autocrlf=false`) checked out at the sha (2026-11-19):
- base 224f9b9: `organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` exit 2
- build:        `organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` exit 2

The same three UNRULED on both (the spec's §8 three): the selftest-coverage law (`orphaned: deck_lint, home_pin, probe,
study_scope`), `SUITE MEMBER · sandbox selftest exits 0`, and the hermetic-members line that carries it (the sandbox
tripwire `recorded 2: fetch, spawn-billing`). The build moves no member verdict. (A first run in plain tree exports,
no `.git`, gave `141 passed, 5 failed` on base (2026-11-19) — `git ls-files failed` — an instrument artifact, not used.)

## node scripts/models.mjs check

Exit 0, 2026-11-19: `models check: 136 file(s) · literal model names outside models.mjs: 0 · …`.

## AT THE LANDING — what the RUNNER runs (not this seat)

**R1 · re-emit the derived state (spec §4)** — this seat may not touch `dressing-room/state`, so the IR and the atlas are
NOT re-emitted on this branch (FORK X1 below). Measured 2026-11-19 in an LF export of the build tip:
`node scripts/xray.mjs build` → `xray: 137 organs · 418 files · 2015 unresolved → dressing-room/state/xray_graph.json`;
`node scripts/flow_atlas.mjs check` → `STALE — derived 8824b039c1bf625a vs written 77675fe0b19c16c3` (exit 2);
`node scripts/flow_atlas.mjs build` then `check` → `flow_atlas check: OK 8824b039c1bf625a` (exit 0). The same three steps
on base 224f9b9 give `413 files · 2065 unresolved`, STALE `4dbf8f3b927ed6af` vs `77675fe0b19c16c3`, then OK — so main's
committed IR + atlas are already stale against main's own code (spec §8, NAMED, predates this unit). The hashes are of
these trees on this date; at the landing the tree is the land branch, so the runner reads its own hash, and the
expected last line is `flow_atlas check: OK <hash>` (exit 0).

**R2 · F3 A, the registry declaration through its own verb** (`scripts/registry.mjs set`, owner `registry.mjs:4`),
from the repo root, one command (it reads each row with `get`, adds `files`, and writes through `set`; it prints only the
receipts, never a row):

```
node -e 'const {execFileSync:x}=require("child_process");for(const s of ["notes_corrections","brief_log"]){const {updated_at,added_at,...r}=JSON.parse(x(process.execPath,["scripts/registry.mjs","get","--table","lanes","--subject",s],{encoding:"utf8"}));process.stdout.write(x(process.execPath,["scripts/registry.mjs","set","--table","lanes","--json",JSON.stringify({...r,files:[["dressing-room","state",s+".jsonl"].join("/")]})],{encoding:"utf8"}))}'
```

Expected last line: `{"ok":true,"table":"lanes","subject":"brief_log","op":"updated"}` (exit 0; the line before it is the
same receipt for `notes_corrections`). Measured 2026-11-19 in an LF export of the build tip: exit 0, that last line; on
each row the keys that changed are exactly `updated_at,files` (`files` before absent, after
`["dressing-room/state/notes_corrections.jsonl"]` / `["dressing-room/state/brief_log.jsonl"]`); `node scripts/registry.mjs
check` → `registry check: GREEN · 3 born-red row(s)` before and after (2026-11-19). `added_at` is carried by `upsertRow`'s
merge (`scripts/registry.mjs:479-480`), so stripping it from the input changes nothing.

## SPEC vs RULING — where they differ, the ruling won

1. Spec §9 item 2 / F4 (B) put a W1-W5 clause in `scripts/organism_test.mjs`; ruling F4: the witness lives in `ci/mxw/`
   and rides the member (ms1). `organism_test.mjs` is untouched.
2. Spec §4 has the BUILDER run `registry.mjs set`; ruling F3 A: the runner runs it at the landing (R2 above).
3. Spec F2 (header parser `xray.mjs:956`) and F5 (a "declared, zero writers" query): handed to unit mxh, not built here.
4. Spec witness `ci/mxw/witness/witness.mjs` (four plant clauses, a W5 note) → `ci/mxw/witness_mxw.mjs`, eight clauses:
   W3 plants a defaulted sibling (so M4 is killable), the spec's W5 is split into W5 (exact writers) and W6 (no new Q2/Q5
   entry vs the base), BOUND and LAST added. The spec base 95b07a6 → 224f9b9 (identical blobs for the three scripts).

## FINDINGS (named, not built)

- **N1 · a no-default destructured slot resolves to a same-name module const** — planted 2026-11-19: a fixture with
  `const path = join(STATE, "w3_shadow.jsonl")` at module scope and `noDefault(t, { path } = {}) { appendFileSync(path, t) }`
  reads as a writer of `w3_shadow.jsonl` on BOTH base 224f9b9 and the build (a destructured parameter does not shadow the
  module binding in xray's scope). Pre-existing, outside F1 A; it can invent a writer fact. Not in the witness (it would be
  RED on base and build alike). For the architect: triage with mxh's parser findings, or its own unit.
- **N2 · main's committed IR + atlas are stale against main's own code** (R1 above; spec §8 line 2).

## FORKS

- **X1 · the derived-state re-emit.** Spec §4 says the build commit must carry a rebuilt `xray_graph.json` and
  `flow_atlas.json`; this seat's brief forbids any write under `dressing-room/state`. Not done here; R1 names the two owner
  verbs for the runner. (A) the runner re-emits at the landing (this proof assumes it); (B) a seat is authorised to
  re-emit through the owners' verbs on its branch.
- **X2 · N1** above — whose unit.
- **X3 · the effort receipt** — see the ledger's last row (the tool it names is not in this repository).

## CHECK RUNS

Named in `ci/mxw/LEDGER.jsonl`, one row per read (public API, no token).
