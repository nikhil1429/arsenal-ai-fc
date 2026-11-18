# mlv0 · THE STATUS LINE AND THE JUDGE PORT — PROOF (forks row 1031, M0 ITEM 1, 18 Nov 2026)

Branch `claude/mlv0-build`, made from `origin/main` at `15edfec` (18 Nov 2026). Spec: `ci/mcr/MLIVE_SPEC.md` §3 on
`claude/mcr-mlive-spec` (the spec's own base was `074ead9`; every fact below was re-measured at `15edfec`).

## What was measured at the base (18 Nov 2026, `15edfec`)

| Fact | Where |
|---|---|
| `services.mjs status` prints one summary line from `sc.exe query` only; no unit's boot or bytes are read | `scripts/services.mjs:1036-1073`, `:1106` |
| conductor's tier 1 compares `module_mtime_ms` to the ENTRY file only (the K6 hole); tier 2 runs only with no stamp | `scripts/conductor.mjs:640-681` |
| thalamus and sitting already publish `booted_at` on `/status` | `scripts/thalamus.mjs:3135`; `scripts/sitting.mjs:1018`, `:1116` |
| cortex answers only `POST /restart` (deliberately no `/status`, until tier 1 reads the graph) | `scripts/cortex.mjs:2084-2110` |
| brain's `:4116` singleton answers nothing (`createSingleton(() => {})`) | `scripts/brain.mjs:7656` |
| context publishes `boot_ts` in its stamp (`readStamp`) | `scripts/context.mjs:145-160` |
| `sourceGraph` / `staleSources` exported by brain (static + dynamic local imports, strict `>`) | `scripts/brain.mjs:7070-7106` |
| no reader of "a judge round is running"; the round is the `judge-round` / `judge-due` CLI arm around `gradeJudge` | `scripts/gaffer_brain.mjs:2705-2717` |
| the retires that exist today: brain worker, context worker | `scripts/brain.mjs:7688-7694`; `scripts/context.mjs:1317-1328` |
| the landing verb (its step 11) is **NOT IN THIS REPOSITORY** — `grep -rn "landing verb\|step 11" scripts` finds no such verb | — (NAMED, not guessed: see FORKS) |

## What was built (the named files only)

- `scripts/services.mjs` — M1 A / M3 A: `status` prints, under the unchanged summary line, one line per headless unit
  (NOT INSTALLED · STOPPED · RUNNING booted <iso> current · STALE naming each moved file · UNVERIFIED never current),
  from the unit's OWN boot instant against `brain.sourceGraph(entry)`; an unreadable entry is UNVERIFIED too. Then the
  judge line. Exports `closureVerdict`, `bootOf`, `unitLines`. Two selftest clauses added.
- `scripts/conductor.mjs` — K6: a `/status` stamp with `booted_at` is judged against the whole closure; the old tiers
  stay (L9) for a stamp with no boot instant and for no stamp.
- `scripts/cortex.mjs` — M2 A: `GET /status` answers `booted_at` and `pid` only (never `module_mtime_ms`); one selftest
  clause; the "NO /status ROUTE" header is layered as superseded, not deleted.
- `scripts/brain.mjs` — M2 A: the `:4116` singleton answers `GET /status` with `booted_at`; M4 A: its retire defers
  while the judge port is held.
- `scripts/context.mjs` — M4 A: its retire defers while the judge port is held (a second import line, so the pinned
  keeper import stays byte-for-byte).
- `scripts/keeper.mjs` — M4 A: `JUDGE_PORT` (4118, added to the port registry comment), `holdJudgePort`, `judgeHeld`,
  `portFree` exported; one selftest clause (on an OS-picked port, never the live one).
- `scripts/gaffer_brain.mjs` — M4 A: the judge CLI arm holds the judge port before `gradeJudge`, for the process's life.

## Witness, both ways (by last line, 18 Nov 2026)

```
node ci/mlv0/witness_mlv0.mjs --org . --base-org <base copy of 15edfec>
GREEN MLV0 the status line reads the closure, and the judge port defers every retire · 7 clause(s)      (exit 0)

node ci/mlv0/witness_mlv0.mjs --org <base copy of 15edfec> --base-org <same>
RED MLV0 · S1 CLOSURE, S2 K6, S3 UNVERIFIED, M2 BOOT, M4 JUDGE                                          (exit 1)
```

On the base, S2 reads `already running (build current)` with an imported module moved after boot: the 18 Nov hole.
The base copy is `git archive 15edfec` plus a byte copy of the state dir made by a node script under the scratchpad
(the organs read registry rows at import); nothing of it is printed or committed.

## Mutants (18 Nov 2026)

```
node ci/mlv0/run_mutants_mlv0.mjs --org . --base-org <base copy>
  mutant S1 (the closure walk replaced by the entry file alone): RED by its clause
  mutant S2 (conductor's closure tier switched off (the entry-only stamp decides)): RED by its clause
  mutant S3 (an unreadable boot instant judged as if read): RED by its clause
  mutant M2 (cortex's GET /status route removed): RED by its clause
  mutant M4 (the brain's retire stops reading the judge port): RED by its clause
run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
```

## Each touched selftest, before → after (headline lines, run 18 Nov 2026 in this container)

```
keeper        keeper selftest: 15 passed, 0 failed      →  keeper selftest: 16 passed, 0 failed
services      services selftest: 17 passed, 0 failed    →  services selftest: 19 passed, 0 failed
cortex        ALL CHECKS PASSED                         →  ALL CHECKS PASSED
conductor     ALL CHECKS PASSED (111 passed, 0 failed)  →  ALL CHECKS PASSED (111 passed, 0 failed)
context       ALL CHECKS PASSED                         →  ALL CHECKS PASSED
gaffer_brain  gaffer_brain selftest: 194 passed, 0 failed → gaffer_brain selftest: 194 passed, 0 failed
brain         SELFTEST FAILED (one ✗: GEMINI SHIM, a Windows %APPDATA% quoting assert) → SELFTEST FAILED (the SAME one ✗, diffed line for line)
```

brain and gaffer_brain are LIVE members under the hermetic profile (they read state); run here directly. brain's one
red is on the base too, before any edit — a platform assert, not this unit's.

```
node scripts/models.mjs check   → exit 0 (models check · config scan: hits 0)
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all  → exit 2, one UNRULED red:
  EVERY organ with a selftest is wired into a suite — orphaned: home_pin, probe, study_scope
  (the SAME red on the base copy by `organism_test.mjs coverage`, 18 Nov 2026: none of those files is touched here)
```

## The ruling vs the spec (named)

- The ruling's M1 A is "services status only": the spec's §4 restart verb is **not built** (row 1031: the keeper
  retires on its own; no restart verb ahead of the per-unit measurement).
- The spec puts `booted_at` publishing on cortex only ("thalamus, sitting already do"); the ruling's M2 A says "each
  unit publishes its booted_at", so brain's singleton publishes it too, and context's stamp `boot_ts` is read as its
  boot instant.
- M4 A: "the landing verb and every retire read it" — every retire that exists today (brain, context) reads it here;
  sitting, cortex and thalamus retires are ITEMS 2-4 and read it there.

## FORKS

1. **The landing verb is not in this repository** (its step 11 lives in the campaign tooling outside the repo). It is
   not edited. What it must read is built and exported: `keeper.mjs judgeHeld()` and the `judge` line of
   `node scripts/services.mjs status`. Wiring the verb to refuse while the judge line reads RUNNING is the
   architect's, in the tool's own home.
2. conductor's selftest gained no K6 clause (the witness S2 and its mutant hold it); adding one is a later, stricter
   gate, not needed for this landing.
3. The witness's M2 brain half and M4 retire halves are SOURCE checks (the arm reads `judgeHeld()` before RETIRING),
   because a live brain or context worker in a witness would read live state. The judge port half is behavioural (a
   real process holds the real port; its death frees it).

## The architect's class note: core.autocrlf (18 Nov 2026)

Measured on this unit's files: **no witness here plants git** (no clone, no init; every plant is an fs copy), and every
line it reads from a process or a log is split on `\r?\n`. Two CRLF hazards were found and closed:
- the mutant runner matched a multi-line edit site in LF only; it now matches in the file's OWN line ending;
- BOUND hashed raw bytes, so a CRLF checkout against an LF base read every file as changed; it now hashes text with
  CRLF folded to LF (a line ending is not a change).

Proven on copies converted to CRLF (scripts/ and setup/, the laptop's checkout shape), 18 Nov 2026:

```
witness --org <CRLF build> --base-org <CRLF base>    GREEN MLV0 the status line reads the closure, and the judge port defers every retire · 7 clause(s)
run_mutants --org <CRLF build> --base-org <CRLF base> run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
witness --org <CRLF base>  --base-org <CRLF base>    RED MLV0 · S1 CLOSURE, S2 K6, S3 UNVERIFIED, M2 BOOT, M4 JUDGE
```
