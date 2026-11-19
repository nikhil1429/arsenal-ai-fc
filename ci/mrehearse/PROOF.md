# mrehearse · PROOF — B-rehearsal:night-replay (unit 5 of the mwit spec)

**Base:** main `fb42118` (`fb4211870093e6b8657655eb02ebcfc425f1eab1`, fetched 19 Nov 2026; `ci/mrehearse/BASE`).
**Spec:** `ci/mwit/MWIT_SPEC.md` @ `88bf69d` (read whole, with `ci/mwit/plant_day.mjs` and `ci/mwit/LEDGER.jsonl`).
**Rulings applied:** rows 1162 / 1163 as given in the brief — F3 A (copy scripts/ beside a snapshot), F4 A (clauses 9-11
carried from the recorded meter row), F10 A (witness under `ci/witness/mrehearse/`), F11 (no suite edit: unit mmeter's member
runs the plants), row 1162 (5) (a fact only his laptop holds reads UNREAD on the cloud, never green).
**Ledger:** `ci/mrehearse/LEDGER.jsonl` (one row per act). The tip that carries this file is named in the last section.

## What was built (named files only)

| file | what |
|---|---|
| `scripts/rehearse.mjs` (new) | SOLE WRITER of `dressing-room/state/rehearsal_log.jsonl`. `run`: inside a begun, unclosed night (night.mjs's own `nightOf`, read only) it measures `git rev-parse HEAD`, snapshots the state dir under `os.tmpdir()`, writes THAT commit's `scripts/` + `package.json` beside it out of git (`ls-tree` + one `cat-file --batch`), runs the real `daily_green.mjs --json --date D`, keeps STATUS only per clause, carries 9-11 from the recorded meter row (F4 A; none → UNREAD, `would_be_11: null`), appends ONE row `{at, night, day, code_sha, greens, clauses[{n,status}], would_be_11, carried, replay}`, deletes the temp root, and reports to the night by `night.mjs mark --kind rehearse --unit rehearse`. `last [--night D]`: read-only line. |
| `scripts/night.mjs` (EDIT) | ONE mark kind more, `rehearse`; that kind's row carries `head`, measured by the night itself (`git rev-parse HEAD`, read only, injectable door `head` for the selftest). Not a launch: no count of the NIGHT line moves. One selftest assert added. |
| `ci/witness/mrehearse/witness_rehearse.mjs` (new) | Clause face `--night N [--org dir]` (exit 0/1/2 per spec §0) and plants face `plants --org --base-org [--only]`. |
| `ci/mrehearse/{BASE,LEDGER.jsonl,PROOF.md,run_mutants_mrehearse.mjs}` | this seat's record and mutant runner. |

**The clause's exit law (the witness header is the contract):** 0 iff a rehearsal row exists for night N, its `at` lies
between the night's own `armed` row and its `closed` row (or now while open — read from the night factory's rows, no
hour typed), its `code_sha` equals the `head` on the night's `rehearse` mark, and `would_be_11` is a boolean that agrees
with the row's eleven statuses; 1 if outside the night / sha mismatch / disagreement; 2 if no night, no row, no mark, or
`would_be_11` null.

## The witness, both ways (19 Nov 2026, by command; base tree = `git archive fb42118`)

```
node ci/witness/mrehearse/witness_rehearse.mjs plants --org . --base-org <base>          # BUILD
  GREEN W1 · exit 0 · rows 1 · sha = HEAD · marks 1 · replay ok · would_be_11 true · clause 0
  GREEN W2 · before 2 (no rehearsal row) · run exit 0 · after 1 (row lies outside the night)
  GREEN W3 · run 0 · first 0 · mark 0 · after 1 (code_sha ≠ the night's head)
  GREEN W4 · recorded 10 RED: 9/10/11 GREEN/RED/GREEN · would false · clause 0 | no recorded row: UNREAD×3 · would null · clause 2
  GREEN W5 · exit 1 · log born false · night log unchanged true
  GREEN W6 · sole true · others none · clean true · row keys at,night,day,code_sha,greens,clauses,would_be_11,carried,replay
  GREEN BOUND · 5 file(s) differ · outside the unit: none
  GREEN LAST · 0 process(es) name the temp root · org state byte-identical
GREEN MREHEARSE night-replay · 8 clause(s)                                                  exit 0

node ci/witness/mrehearse/witness_rehearse.mjs plants --org <base> --base-org <base>     # BASE
RED MREHEARSE · W1,W2,W3,W4,W5,W6                                                           exit 1

node ci/witness/mrehearse/witness_rehearse.mjs --night 2026-11-19                           # the clause, on this cloud
UNREAD B-rehearsal:night-replay · night log unreadable or absent                            exit 2
```

The clause on the cloud reads **UNREAD** (row 1162 (5)): the night log and the rehearsal log live on his laptop only.

## Mutants (one per clause)

```
node ci/mrehearse/run_mutants_mrehearse.mjs --org . --base-org <base>
  RED (killed) W1 · spec (d): the snapshot runs the OLD tree (HEAD~) and stamps it
  RED (killed) W2 · the night's window not read                     (own: the witness)
  RED (killed) W3 · code_sha not compared with the night's head     (own: the witness)
  RED (killed) W4 · F4 A dropped: 9-11 read off the snapshot's machine
  RED (killed) W5 · a night no runner began is rehearsed
  RED (killed) W6 · the reason text reaches the log
  control · GREEN MREHEARSE night-replay · 8 clause(s)
run_mutants: 6 of 6 mutant(s) RED by the clause that names them · control GREEN
```

BOUND and LAST are structural (no mutant): BOUND is RED by construction whenever a file outside the unit differs.

## Red before, through the receipt organ (row 1162 (5))

The real red-before is a write to `rung_receipts.jsonl` (live state, his laptop) — **owed there, UNREAD here**: this cloud
seat may not write a state file. Proven on a temp state dir through the organ's own door (19 Nov 2026):

```
ARSENAL_RUNG_STATE_DIR=<tmp> node scripts/rung_receipt.mjs red --rung mrehearse --clause B-rehearsal.night-replay --cmd "node ci/witness/mrehearse/witness_rehearse.mjs --night 2026-11-19"
rung_receipt: red mrehearse:B-rehearsal.night-replay · exit 2 · out 6a2106076f95 · head 7e145494525b · last: UNREAD B-rehearsal:night-replay · night log unreadable or absent
```

(`--clause B-rehearsal:night-replay` is REFUSED: the organ's clause id pattern has no `:` — FORK F-h.) On his laptop the
red is the same command at the landed sha, before the first night runs `rehearse.mjs run`.

## Selftests and members touched (before → after, 19 Nov 2026)

```
node scripts/night.mjs selftest            before: night selftest: 22 passed, 0 failed
                                           after:  night selftest: 23 passed, 0 failed
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
                                           before: organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (exit 2)
                                           after:  organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (exit 2)
                                           the one red on both: the coverage law, orphaned: deck_lint, home_pin, probe, study_scope (unchanged)
node scripts/models.mjs check              before and after: exit 0 · hits 0
node scripts/xray.mjs report               before and after: Q2 (0) · Q5 (0)
```

No suite member was edited (F11: the suite file is unit mmeter's). `scripts/rehearse.mjs` has no selftest mode, so the
coverage law does not name it (FORK F-b).

## The law pack counts (LF trees, `npm ci --ignore-scripts`, `node scripts/lawpack.mjs gate`, 19 Nov 2026)

```
BASE  findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
BUILD findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
both: lawpack: 2 RED (jugad-literal-subject-list 93 vs frozen 90 · depcruise_errors 13 vs frozen 7 — already on the base)
```

No count rose (raw matches 1933 → 1934; raw is not a finding).

## Where the spec and the ruling differ (the ruling won)

- Spec UNITS: "every unit adds its witness to organism_test.mjs" → row 1162 (2): no suite edit here.
- Generic tail `ci/mrehearse/witness_mrehearse.mjs` → the UNITS row's `ci/witness/mrehearse/witness_rehearse.mjs`.
- Spec (b) names the row `{ day, code_sha, at, greens, clauses[status only], would_be_11 }`; the row also carries
  `night`, `carried` (which clauses, from which meter row) and `replay` (`ok` or why not) — F4 A needs the first two said.

## FORKS

- **F-a** `.gitignore` does not cover `dressing-room/state/rehearsal_log.jsonl` (`git check-ignore` prints nothing; the
  night log is ignored at `.gitignore:536`). `.gitignore` is not a file of this unit — the line is owed before landing.
- **F-b** `rehearse.mjs` has no `selftest` mode (its test is this witness); a selftest mode would make the coverage law
  name it and require a `package.json` suite line (row 1162 (2)).
- **F-c** `recordedRow` keeps the meter's "last row for a date wins" rule in 3 lines because `latestByDate` is
  file-private at the base (`scripts/daily_green.mjs:356`); fold onto unit mmeter's export once it is on main.
- **F-d** the trigger: nothing calls `rehearse.mjs run` at night yet. The runner's night (campaign side / runner skill) is
  not a file of this unit; until wired, every night reads UNREAD (2).
- **F-e** the plants face is `plants --org <dir> --base-org <dir> [--only …]` — unit mmeter's suite member should call it so.
- **F-f** the `rehearse` mark row carries `head` (measured by night.mjs) — the payload of the one new kind, the fact the
  clause's "HEAD the night ran at" needs; no other kind changed.
- **F-g** `would_be_11` is `null` (clause 2) when no recorded meter row exists for D (F4 A has nothing to carry).
- **F-h** `rung_receipt.mjs` refuses clause ids with `:` (`/^[A-Za-z0-9._-]+$/`); the spec's ids carry one. Recorded here as
  `B-rehearsal.night-replay`; the architect rules the mapping (or the pattern).
- **F-i** "every wait is bounded" vs "never type a timeout": no child waits on a service (each is a finite git/node CLI),
  so no bound is typed.

## CI of the tip

The work tip **`55d6d3d40a5166a2df347ce087d2cd6e3c2a7119`** (every file of the unit; the commit after it adds only this
section and its ledger row), read 19 Nov 2026 with the FULL sha:

```
NODE_USE_ENV_PROXY=1 node scripts/ci_verdict.mjs 55d6d3d40a5166a2df347ce087d2cd6e3c2a7119
ci_verdict 55d6d3d GREEN — npm test · node 22: GREEN (base fb42118 · 0 new red · 1 base red · 126 live) [run 135779763483] | npm test · node 24: GREEN (base fb42118 · 0 new red · 1 base red · 126 live) [run 135779763750] (3 calls)
```

The earlier push `7e14549` reads RED (cancelled, both legs, runs 135778299752 / 135778300587): its runs were cancelled by
the next push, never reached a verdict — not a red of the code.

Effort receipt: `node campaign-2026-09/tools/effort_receipt.mjs --fleet mrehearse --seat 00 --model claude-opus-5-5` →
`Error: Cannot find module '…/campaign-2026-09/tools/effort_receipt.mjs'` (exit 1; this repository carries no
`campaign-2026-09/`); nothing written under it.
