# UNIT muna — PROOF (the build, ruled by row 1301)

Build branch `claude/muna-build`, cut from origin/main by `git fetch origin main && git checkout -b claude/muna-build origin/main`.
**BASE = `84cbc03126eddb85c7d5cf54b51610068800315c`** (`ci/muna/BASE`). Spec: `ci/muna/MUNA_SPEC.md` (from `claude/muna-spec`
639ffbc, ruled whole by row 1301). Every measurement below is a command run in the cloud seat, 22 Nov 2026; its last line is in
`ci/muna/LEDGER.jsonl`. This branch is pushed with `[skip ci]`; its neutral verdict is the land tip's, not this branch's.

## 1. What row 1301 changed against the spec, and where the build holds it

| Ruling | Code path |
|---|---|
| (1) F1 A + the SHA form of lane M's gate | `scripts/muna.mjs` `adopted()`: the door's gate argv + `<unit> --sha <40-hex>`; exit 0 GO, anything else not a candidate. Witness U2b (re-pushed after adoption), U10 (hand-only) |
| (1) the door names gate argv, LANDING command, names dir outside the tree | `readDoor()`: refuses a door without any of the three; refuses a names dir inside the work tree (NO-DOOR, one card `muna:door`). Witness U11, U13 |
| (2) F2 A · F3 A (absent = LEFT) | `licence()` reads `land.mjs count`; `pass()` step E leaves a tip with no `<unit>_<sha>.json`. Witness U9, U7, U13 |
| (3) F4 every 10 minutes · F11 | `setup/INSTALL_CYBORG_TASKS.ps1` `Mk "ArsenalFC-Muna" "muna.mjs pass" @("/SC","MINUTE","/MO","10")` beside Groundsman-Push; `setup/UNINSTALL_CYBORG_TASKS.ps1:2` names it |
| (4) F5 A · F6 A · F8 A · F10 A | `verbRow()` reads the verb's own `.git/land_ledger.jsonl` row (`human`); journal `.git/muna_journal.jsonl`; ONE landing command per pass; no lock. Witness U4, U6, U7, U8 |
| (5) F7 B | the landing command template carries no `--live`; a unit needing one is adopted hand-only and the gate refuses it (U10) |
| (6) F9 B | a LANDED line whose `acts` is not `none` files ONE card `muna:acts:<unit>:<sha12>`. Witness U14 |
| (7) the two added clauses | U10 (hand-only refused by the sha gate, not landed) · U11 (the landing command comes from the door: the door's wrapper is called and lands; a door naming a refusing command lands nothing) |

The landing verb `scripts/land.mjs` is not edited (BOUND holds it: the differing paths are only `scripts/muna.mjs`, `ci/muna/`,
the two installers).

## 2. The witness, both ways (22 Nov 2026)

```
node ci/muna/witness_muna.mjs --org <LF tree of the build commit> --base-org <LF tree of BASE>
```
Each of U1–U14 is RED on BASE (no `scripts/muna.mjs`) and GREEN on the build; BOUND and LAST green. Last line:
`GREEN MUNA landing with no session awake · 17 clause(s)` (exit 0).

## 3. The mutants (22 Nov 2026)

```
node ci/muna/run_mutants_muna.mjs --org <LF tree of the build commit>
```
One mutant per clause U1–U14 (U2b has its own), each an exact single-anchor edit of `scripts/muna.mjs`; the unmutated control
first. Last line: `run_mutants: 15 of 15 mutant(s) RED by the clause that names them · control GREEN`.

## 4. The suite's WITNESSES member

The member walks every `ci/<unit>/` holding `witness_<unit>.mjs` (`scripts/organism_test.mjs` `witnessUnits`): counted on the
build tree and on BASE by the command in LEDGER.jsonl — 64 units at the build, 63 at BASE (22 Nov 2026). muna's witness binds
no port, names no live service and prints the member's grammar (`GREEN MUNA …` / `RED MUNA · …`); the member runs it only on the
neutral machine.

## 5. What the runner does by hand at switch-on (row 1301 (8), unchanged by this build)

1. Write `.git/muna_door.json` in his laptop clone: `gate` = `node tools/m/units.mjs gate` with `gate_cwd` the campaign root;
   `land` = `["node","<campaign root>/tools/m/land_unit.mjs","{unit}","--row","{row}","--","--names-gate","{names}"]` with
   `land_cwd` his repo; `names_dir` OUTSIDE the work tree. Placeholders `{unit} {sha} {names} {row}` are filled by muna; `{row}`
   is read from the gate's GO line (`row <n>`) — if lane M's gate prints no row, a tip is LEFT NO-ROW (named, never guessed).
   muna reads the outcome from the landing command's output (the first line starting `LANDED ` / `REFUSED ` / `STOP ` /
   `PUSHED NO `) and its exit code: lane M's wrapper must pass the verb's line and code through — NAMED, not measured here.
2. Measure whether the one task row registers without an elevated console; register it, or ONE card.
3. The SNAPSHOT assert (`scripts/organism_test.mjs:916`, a LIVE assert the hermetic profile skips) reads RED on his laptop
   until `node scripts/watchman.mjs expect ArsenalFC-Muna --why "…"` (registered) or `expect-absent` (carried, not yet
   registered) — `tasks_expected.json` is a state file, so no land tip can carry it (`land.mjs:194` STATE-PATH).
4. The in-session timers keep watching cloud returns; only the landing duty moves, after muna's first landing is read by the
   architect.
