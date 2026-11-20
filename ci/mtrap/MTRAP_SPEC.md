# UNIT MTRAP · SPEC — a note with fewer than three distinct traps is refused at compile, by name, before any reader is paid

> Forks row 1198 (1)–(6), his words 266 / 268 / 270 / 271 / 272 / 273 / 274. A SPEC, not a build: nothing here is built,
> landed or merged. Base = `origin/main` **5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90**, measured at the cut on 20 Nov 2026
> (`git fetch origin main && git rev-parse FETCH_HEAD`). Every `file:line` below is at that base unless a branch tip is named.
> Every measurement is a command with its last line; the act log is `ci/mtrap/LEDGER.jsonl` on this branch.
> Read first, whole: `02c6f57:ci/mcrk/MCRK_SPEC.md` (tip of `claude/mcrk-spec`), the build `claude/mcrk-build` at
> **937710b**, and the mcap build `claude/mcap-build` at **f8a7e15** (its PROOF at `ci/mcap/PROOF.md`). There is **no
> `claude/mcap-spec` branch** on the remote (`git fetch origin claude/mcap-spec` → `fatal: couldn't find remote ref`); the
> mcap spec was read as its build's PROOF.md. That is named, not guessed.

## 0 · HEADLINE

At base the cold gate pays a reader for a note that **cannot pass by construction**. `verdictOf`
(`scripts/notes_compiler.mjs:481-496`) passes only when the reader names three wrong answers that are three **distinct**
trap ids of the note (`:488`). A note holding two traps can never meet that clause, yet `gateDay` (`:562`) sends it to the
reader (`:589`) and writes a `fail` row (`:591-593`). The tracked ledger shows the shape: every a/b note since 13 Nov holds
two traps, all from cracks, and each got a paid `fail`. Three of them were green on every other clause.

The build this spec proposes, in one sentence: **one pure predicate `gateableOf(note)` in the compiler, read by every
reader of a note verdict**. It counts the note's distinct traps against the bar of three. A note under the bar is still
compiled and kept (L9, `sources[]`, mcap c18 reads it). But it is **refused at the gate, by name, with its count, before
any reader is called**. No row is written for it, and nothing old is rewritten. Every reader derives `not gateable` from the
same predicate. So the five old verdicts read as `not gateable` beside their kept `fail` rows from the landing on, with no
row touched. The refusal reaches the teaching turn on the pacer's per-turn contract line (`forge_session.mjs:654`, the
`axes:` line) as **`N trap(s) owed on axis x`**.

What it does NOT do (row 1198 (2), (3)):
- it invents no trap and pads no count;
- it does not loosen `verdictOf` (b refused);
- it never writes a two-trap note as `fail` by design (c refused).

## 1 · MEASUREMENTS (each by command, last line verbatim)

```
$ git fetch origin main && git rev-parse FETCH_HEAD
5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90

$ git rev-parse origin/claude/mcrk-spec origin/claude/mcrk-build origin/claude/mcap-build
02c6f57f22f826d210ad533a692c4f422277c1dc
937710bde43403e7f558bbb5b9a5f179df6dc50f
f8a7e15cf3de2ed0933a2466baf35b68765e42e3

$ git show origin/claude/mcrk-build:ci/mcrk/BASE ; git show origin/claude/mcap-build:ci/mcap/BASE
5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90          # both builds stand on this same base

$ grep -n "traps.push\|traps.forEach" scripts/notes_compiler.mjs        # where note.traps is built, and from what
323:        traps.push({ from: "crack", bait: d.galat.join(" / ") || "(no - line)", ... })   # one per ```diff of a teacher turn
348:  for (const c of corrections || []) traps.push({ from: "correction", ... })           # the live corrections lane
350:    if (typeof t === "string") traps.push({ from: "capsule", bait: t, truth: null });    # the immutable capsule's traps
351:    else if (t && (t.bait || t.wrong || t.truth)) traps.push({ from: "capsule", ... });
353:  traps.forEach((t, i) => { t.id = `T${i + 1}`; });

$ grep -n "const covered" scripts/notes_compiler.mjs
488:  const covered = wrong.length === 3 && wrong.every(inNote) && new Set(wrong.map((w) => w.trap)).size === 3;

$ node -e '<per gate row of the TRACKED compiled_notes.jsonl: day, axis, trap count, trap sources, verdict, booleans, trap ids>'
2026-11-13 axis a live false traps 2 from crack verdict fail reader role:cold_reader answered true fromNote true rebuild true trapIds [null,null,"T2"] distinctInNote 1
2026-11-14 axis a live false traps 2 from crack verdict fail reader role:cold_reader answered true fromNote true rebuild true trapIds [null,"T2","T1"] distinctInNote 2
2026-11-15 axis a live true traps 2 from crack verdict fail reader role:cold_reader answered true fromNote true rebuild true trapIds [null,null,"T2"] distinctInNote 1
2026-11-16 axis b live false traps 2 from crack verdict fail reader role:cold_reader answered true fromNote true rebuild false trapIds ["T1","T2",null] distinctInNote 2
2026-11-17 axis b live true traps 2 from crack verdict fail reader role:cold_reader answered true fromNote true rebuild false trapIds [null,"T1","T2"] distinctInNote 2
2026-11-17 axis c live false traps 5 from crack verdict fail reader role:cold_reader answered true fromNote true rebuild false trapIds [null,"T3",null] distinctInNote 1
2026-11-18 axis c live true traps 5 from crack verdict fail reader role:cold_reader answered true fromNote false rebuild false trapIds [null,"T4",null] distinctInNote 1
#   the cloud copy is the last commit of that file (git log -1 -- dressing-room/state/compiled_notes.jsonl → 7c3c279):
#   rows 15 compiled 8 superseded 5 gates 7. The runner's laptop probe names EIGHT gates (the third axis-c note is not
#   pushed) — §8. The five a/b rows are the five of row 1198 (4); the three a-axis ones are green on every other clause.

$ node -e '<per compiled row: trap ids vs distinct folded baits, placeholder baits, capsule present, corrections>'
2026-11-18 axis c ids 5 distinctBait 5 placeholderBait 0 gateRows 1 hasCapsule false corrections 0
#   every row: ids == distinct folded baits; no "(no - line)" placeholder; no capsule; no correction. All traps are cracks.

$ grep -n "const targets = \|for (const id of expect)" scripts/notes_compiler.mjs
562:  const targets = st.live.filter((n) => noteDay(n) === date && (again || !st.gates.some((g) => g.of === n.id && g.verdict !== "absent")));
600:  for (const id of expect) {

$ grep -ln "compiled_notes\|cold_gate\|askedFirst" scripts/*.mjs
scripts/exchanges.mjs scripts/forge_session.mjs scripts/gate.mjs scripts/learnstate.mjs scripts/models.mjs
scripts/notes_compiler.mjs scripts/notes_corrections.mjs scripts/organism_test.mjs scripts/postmatch.mjs scripts/study_scope.mjs
#   readers of a VERDICT among them: notes_compiler (gateDay, glance, status, summary) and learnstate (askedFirst = C22).
#   forge_session / exchanges / study_scope / gate / organism_test / models / notes_corrections name the file in comments,
#   a registry list or the role only — none reads a cold_gate row.

$ grep -n "compiled_notes\|cold_gate\|notes_compiler" scripts/state.mjs scripts/done.mjs scripts/daily_green.mjs ; echo "exit $?"
exit 1     # state, done and daily_green read NO note verdict (daily_green clause 3 reads note_blocks through the registry)

$ grep -n "ASKED-FIRST (C22) — koi" scripts/learnstate.mjs
1091:    L.push(af.strike ? `  ASKED-FIRST (C22) — cold, note ${af.note_id} band: ${af.strike} (galat ho tabhi note khulega)` : `  ASKED-FIRST (C22) — koi strike nahi: ${af.absent}`);

$ grep -n "cold_reader" scripts/models.mjs
449:  cold_reader: { ... env: "ARSENAL_CLAUDE_COLD_READER" },   # the role row (its model and effort are not retyped here, LAW M)

$ git ls-files | grep -c "rung_L1" ; git ls-files ci/witness | wc -l
0
0          # cloud/ml1/witness/rung_L1.mjs, named in notes_compiler.mjs:15 as fixing the two row kinds, is NOT in the tree

$ grep -n "circular" .dependency-cruiser.cjs | head -1
28:      name: "no-circular",

$ git show origin/claude/mcrk-build:scripts/notes_compiler.mjs | grep -n 'from "./forge_session.mjs"'
109:import { readCracks } from "./forge_session.mjs";   // unit mcrk — the crack rows' reader; ...

$ sed -n 190,192p scripts/state.mjs        # the organism's own precedent for breaking a cycle by a lazy import
  // reason nextFacts imports learnstate lazily (a static edge here would be a cycle), and wrapped

$ node scripts/notes_compiler.mjs selftest
notes_compiler selftest: 45 passed, 0 failed

$ node scripts/learnstate.mjs selftest | tail -1
ALL CHECKS PASSED

$ npm ci --ignore-scripts && ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
#   the one FAIL is pre-existing at base (the same one the mcrk spec names): "EVERY organ with a selftest is wired into a
#   suite" — orphaned: deck_lint, home_pin, probe, study_scope. This spec changes no code.
```

## 2 · WHAT IS THERE AT BASE (file:line @ 5759cce)

| Fact | Where |
|---|---|
| The compiler's header: `SOLE WRITER of dressing-room/state/compiled_notes.jsonl`. It has two row kinds, `compiled` and `cold_gate`, and a compiled row NEVER carries a verdict | `scripts/notes_compiler.mjs:4`, `:13-25` |
| TRAPS = the cracks, then the live corrections, then the capsule's traps, numbered T1…Tn | `:68-69`, built at `:316-353` |
| A crack trap is one per ```diff block of a teacher record; its bait is the `-` lines, or the placeholder `(no - line)` | `:321-324` (DIFF_RE `:122`, diffBlocks `:286-294`) |
| The cold gate's law: PASS iff answered from the note, rebuilds, and three wrong answers are three DISTINCT trap ids | header `:73-77`, verdictOf `:481-496`, the clause `:488` |
| The stub reader names the note's first three traps; a note under three traps FAILS even stubbed | `:508-514` |
| gateDay: targets = live notes of the day with no non-absent gate; the reader is called per target; a `fail` row is appended | `:556-596` (targets `:562`, call `:589`, row `:591-593`) |
| gateDay's `expect` loop writes a NAMED `absent` row (`day-unmatched`) for a compiled note the day key missed | `:597-610` |
| A recompile APPENDS a superseding row; the old one leaves the live set and stays byte-identical | `:21-24`, compileDay `:463-471`, noteState `:153-160` |
| The compile groups only the axis windows that touched day D; a note holds that day's windows' traps | `:428-436`, `:446-449` |
| summary line (read verbatim by postmatch's close line) | `:674-683`; postmatch reads it at `scripts/postmatch.mjs:563-569` |
| glance: one header with pass/fail/absent/not-gated counts, one block per live note with `gate <VERDICT>` and `traps T1 …` | `:616-640` |
| status: counts compiled, live, superseded, gate rows, live gate-passed | `:1003` |
| C22 asked-first: a note serves a strike only if its LATEST gate at or before now PASSED with traps named; else ONE absence line | `scripts/learnstate.mjs:700-729`, printed `:1091` |
| The pacer's per-turn contract, re-read every turn through `turn_hook prompt`; "per-turn additions ride on EXISTING lines" | `scripts/forge_session.mjs:625-660` (the `axes:` line `:654`); dispatch `case "contract"` `:2997-3007`, reads its inputs HERE (not in the pure renderer) |
| The reader role | `scripts/models.mjs:446-449` |
| The stub flag | `notes_compiler.mjs:114` STUB_ENV, CLI `:960` |

## 3 · THE CODE PATH (proposed)

### 3.1 The predicate — one home, pure

In `scripts/notes_compiler.mjs`, beside `verdictOf`:
```
export const TRAP_BAR = 3;                                      // row 1198 (1): the bar of three distinct traps STAYS
/** gateableOf — PURE. {gateable, have, need, owed}. `have` = distinct traps of the note by folded bait;
 *  a trap whose bait is the compiler's placeholder ("(no - line)") or empty does not count — the compiler
 *  invents none, so a missing bait is not a trap (row 1198 (2)). */
export function gateableOf(note) → { gateable: have >= TRAP_BAR, have, need: TRAP_BAR, owed: Math.max(0, TRAP_BAR - have) }
```
`verdictOf` and `stubReader` read `TRAP_BAR` where they now carry the literal three. That is `:486` slice, `:488` length
and size, and `:513` the stub's index list. **The behaviour does not change** (W7 proves it on a fixed fixture table).
The bar is not loosened, which refuses option b. See FORK mtrap-6 for keeping verdictOf byte-equal instead.

`have` is counted over `note.traps` exactly as built at `:316-353`. **Nothing is added to `traps`.** The predicate only
counts, so a compiler that pads a count is a mutant (M2), never a path.

### 3.2 The refusal — at the gate, by name, with its count, before any reader is paid

`gateDay` (`:556`): every target with `!gateableOf(n.note).gateable` is taken out **before** the reader line (`:589`),
the stub included. It is pushed as
```
{ of, concept, axis, op: "not-gateable", have, need, owed, why: "<concept>/<axis> <id> · <have> of <need> distinct traps — not gateable, no reader called · <owed> trap(s) owed on axis <axis>" }
```
- **No row is written** (FORK mtrap-1). The refusal is a fact of the note, derivable by every reader from the compiled
  row alone. A row would be a third row kind on a ledger whose kinds are fixed (`:13-18`).
- The `expect` loop (`:600`) skips a not-gateable note too. Otherwise the day key's `day-unmatched` absent row (`:605`)
  would be written for it. That would be a row a reader reads as "could not run", which is false: it was refused.
- `ok` is not falsified by a refusal, so `fulltime` exits as at base for a `fail` (FORK mtrap-5). A thin lesson is a fact
  about the teaching, not an organ fault. Exit 0 is what base gives the same note today, so this is no loosening.
- `compileDay`'s result row (`:471`) gains `gateable` and `owed` beside `traps`. The CLI `say` line (`:961`) prints
  `op not-gateable` on stderr, as for `refused`/`absent`. The compile "refuses it by name" there, before the gate.
- `summary` (`:674`) gains ` · <n> not gateable (< <need> traps)` between `absent (named)` and `not run`.
  `postmatch.compileLineOf` (`:563-569`) carries the summary verbatim and keys only on `unreached`, so it is untouched.

### 3.3 Every reader of a verdict, and what a refused note looks like to it

| Reader | At base | On the build |
|---|---|---|
| `gateDay` `:562`, `:589`, `:600` | reader paid, `fail` row | `op:"not-gateable"`, no row, no reader call |
| `summary` `:674` | `gate 0 pass / 1 fail / …` | `… / 0 fail / … · 1 not gateable (< 3 traps) · …` |
| `glanceLines` `:616-640` | `gate FAIL · traps T1 T2` | `gate NOT GATEABLE (2 of 3 traps · 1 owed)`; an old note with a kept fail row: `gate NOT GATEABLE (2 of 3 traps) · kept FAIL <gate id>`; the header gains `· N not gateable` |
| `status` `:1003` | counts | `· N live note(s) not gateable` |
| `learnstate.askedFirst` `:710-729` (C22, the kickoff) | one absence line, no counts | same candidates (a pass is still the only server). The absence line counts what it saw: `… — pass <p> · fail <f> · not gateable <g> (fewer than three traps, kept fail rows beside them) · ungated <u>`. FORK mtrap-9 decides live-only vs every gated note |
| pacer `contractLines` `:654` | nothing | the `axes:` line, when the latest live note of (concept, ON axis) is not gateable: ` · note <axis>: <have>/<need> traps — <owed> trap owed (from the lesson's own bait, never made up)` |
| mcap c18 (`f8a7e15:ci/witness/mcap/witness_capability.mjs:229-233`) | reads the live note of day D | unchanged: the compiled row is still written (FORK mtrap-1 a). Under mtrap-1 b, c18 would read a thin day RED for a reason that is not a crack |
| `models.mjs:449` cold_reader role | — | untouched; it is only called less |
| state.mjs · done.mjs · daily_green.mjs | read no verdict (measured, §1) | untouched |

### 3.4 The door to the teaching turn — the pacer's `axes:` line (measured, no new surface)

The candidates, each measured:
- **pacer** (`forge_session.mjs contract`). It runs on every prompt through `turn_hook prompt`
  (`.claude/settings.json:13`). It knows the concept and the ON axis, and its own law says per-turn additions ride
  existing lines (`:631-636`). Its dispatch reads disk inputs at `:3003-3007` and hands them to the pure renderer. That
  is exactly where the owed fact is read.
- **teaching_bar** (`teaching_bar.mjs`, sole writer of nothing, `:57`). It is per-turn, but it is message grammar, and it
  holds no concept or axis key.
- **the kickoff** (`learnstate brief`, SessionStart). It already reads compiled_notes (`:711`), but it runs once a session,
  not at the teaching turn.
- **the captain's call**. It is HIS word lane (CLAUDE.md "THE CAPTAIN'S CALL"). A trap owed is the teacher's job, not his.
  Refused.

**Recommend the pacer** (FORK mtrap-4). The import has to break a cycle. mcrk's build makes the compiler statically
import the pacer (`937710b:scripts/notes_compiler.mjs:109`), so a static pacer→compiler edge would trip the
`no-circular` rule (`.dependency-cruiser.cjs:28`). The `contract` case therefore takes
`await import("./notes_compiler.mjs")`, which is the `state.mjs:190` precedent. It reads the ledger once through the
compiler's exported `readRows`, `latestLive` (`:162`) and `gateableOf`, and passes `{owed}` into `contractLines` as a
parameter, the way `clock` rides (`:625`, `:3007`). An unreadable ledger costs only that fragment and never the contract.
The pure renderer stays disk-free.

Timing, said plainly: the compile runs at the day close (`postmatch.mjs:835`, `:846`). So the owed line reaches the
**next** teaching turn on that axis, not the turn that set the second trap. A live in-lesson count is FORK mtrap-8.

### 3.5 The five old verdicts — not rewritten (row 1198 (4))

Nothing is appended for them and nothing is edited. `gateDay` already skips a note with a non-absent gate (`:562`), so no
reader is called on them either way. From the landing on, the reader of a note runs `gateableOf(note)` on the compiled row
it already holds:
- every reader in §3.3 prints `not gateable` beside the kept `fail` row's id, and C22 counts them so;
- the three axis-c notes hold five traps each, so `gateableOf` reads them gateable, and their kept `fail` stands as a true
  reading (row 1198 (5)).

### 3.6 Supersession

A recompile of the same day appends a superseding row (`:463-471`). The new row's `gateableOf` decides afresh:
- a lesson that now holds three distinct traps is gated, and the reader is called once;
- a lesson still thin stays refused, with its new count;
- an `unchanged` compile (`:466`) changes nothing.

The superseded note leaves the live set (`noteState :156-157`). C22 already ignores it (`learnstate.mjs:717-721`).

## 4 · THE WITNESSES (proposed) — plants only, under os.tmpdir(), the reader stubbed by the compiler's own flag

**Unit witness** `ci/mtrap/witness_mtrap.mjs`, with `ci/mtrap/BASE` (40-hex, the base sha at the build's cut):
`node ci/mtrap/witness_mtrap.mjs --org <dir> --base-org <dir>`. It judges `--org`: each clause is RED on a `--base-org` tree
(a `git archive` of BASE) and GREEN on the build. It is never a pass-through. The BOUND clause reads both trees.
**Clause witness** `ci/witness/mtrap/witness_traps.mjs plants [--tree <dir>]`. Both kinds are carried (row 1184 (1)).

Every plant copies `scripts/` of the tree under test into `mkdtemp(os.tmpdir())` (F14 A). Its state files (the forge session
with axis windows, the archive day files through archivist's own writer, as the selftest does at
`notes_compiler.mjs:691-701`) are written there by the witness's own node code. The repo's `dressing-room/state` is never
opened. The reader is the compiler's own stub (`ARSENAL_COLD_READER=stub`, `:114`). Where a call count is judged, the
in-process `gateDay({reader})` of the copied module takes a counting reader that returns the stub's reply. **No port is
bound, no service is named, nothing is POSTed, nothing restarts. No model is called.** Every spawn is a `spawnSync` bounded
by the witness's one wait constant, which the build reads from the mcap witness (it is not typed here).

| Clause | Plant (a THIN LESSON, never a filled note) | RED on base | GREEN on build |
|---|---|---|---|
| **W1 · thin refused before the reader** | a lesson on axis a whose teacher turns carry two ```diff blocks; compile, then gate with a counting reader | reader called once, a `fail` row appended | reader called 0 times; result `op:"not-gateable"`, `have 2 · need 3 · owed 1`, names concept, axis and note id; no `cold_gate` row; the compiled row present with `note.traps` deep-equal to base's compile of the same lesson |
| **W2 · by name on the CLI** | W1's lesson through `notes_compiler.mjs fulltime --date D --stub --no-archive-run` | stdout has `gate 0 pass / 1 fail` | the stderr `not-gateable` line and the summary's `1 not gateable`; exit equal to base's exit for the same plant |
| **W3 · distinct, not ids** | three diffs, two whose `-` lines fold equal; and a diff with only `+` lines (placeholder bait) plus two real ones | stub paid on both, rows written | both refused (`have 2`) |
| **W4 · the bar reaches the reader** | three distinct diffs | (the predicate is absent) RED: W4 needs `gateableOf` exported and gateable:true | reader called once, the row written as at base |
| **W5 · told to the teaching turn** | an open session on the concept with axis a ON, plus the W1 ledger; `forge_session.mjs contract` in the copy | no owed text | the `axes:` line carries `note a: 2/3 traps — 1 trap owed`; every other contract line equals base's |
| **W6 · old verdicts read, not rewritten** | a ledger of five 2-trap compiled rows, each with a kept `fail` row; `gate --stub`, `glance`, `status`, and `learnstate brief` in the copy | no `not gateable` text anywhere | ledger bytes identical before and after; glance and status read `NOT GATEABLE … kept FAIL`; the C22 line counts `not gateable 5` |
| **W7 · bar not loosened (b refused), fail not by design (c refused)** | a fixture table of notes × replies through `verdictOf` | (`TRAP_BAR` absent) RED | every verdict equal to base's `verdictOf` on the same table; no `fail` row ever names a not-gateable note |
| **W8 · true fails stand** | three 5-trap notes with kept `fail` rows | C22 has no count | glance `FAIL` (not "not gateable"); C22 counts `fail 3` |
| **BOUND** | the file list of §6 | — | only those paths differ between `--base-org` and `--org` |

**Mutants** (`ci/mtrap/run_mutants_mtrap.mjs`), one per clause. Each must be RED by its own clause while the control stays
GREEN.

| Mutant | Change | Caught by |
|---|---|---|
| M1 | gateDay ignores `gateableOf` | W1 |
| M2 | pad `traps` to the bar with a filler `{from:"compiler"}` | W1 (the traps are no longer deep-equal) |
| M3 | the CLI `say` drops `not-gateable` | W2 |
| M4 | count distinct by id, not by folded bait | W3 |
| M5 | `gateableOf` returns false always | W4 |
| M6 | drop the contract fragment | W5 |
| M7 | append a `not_gateable` row for the old notes | W6 (bytes) |
| M8 | `covered` reads `>= 2` | W7 |
| M9 | call every failed note not gateable | W8 |

## 5 · LANDING ORDER AND WHAT mcrk / mcap TOUCH THAT THIS UNIT TOUCHES

Each hunk below is at the mcrk build `937710b` (base 5759cce); `git diff -U0 origin/main origin/claude/mcrk-build` was read.

| Line this unit touches | mcrk touches | mcap touches |
|---|---|---|
| `notes_compiler.mjs` header `:68-77` (TRAPS, GATE) | header `:63` (+3 lines) | — |
| imports `:102-105` | `+import { readCracks } from "./forge_session.mjs"` at its `:109` | — |
| `buildNote` `:316-353` (read only, no edit) | `:315-353` gains `cracks`; a no-diff crack item pushes **no trap** (its `traps.push` stays in the diffBlocks loop), so the count is unchanged | — |
| `compileDay` result `:471` | `:437`, `:460`, `:473` (its result gains `cracks`) | — |
| `verdictOf`/`stubReader` `:481-514`, `gateDay` `:556-610` | — | — |
| `summary` `:674-683` | `+` one segment after `names guard` | — |
| selftest | `+` cases after `:772` | — |
| `forge_session.mjs:654` `axes:` line, `case "contract"` `:2997-3007` | contractLines `:656` (the moments line, its crack carrier), hookMain `:3158-3176`; the header MODES and usage | — |
| `learnstate.mjs:710-729`, `:1091` | — | — |
| `ci/witness/mcap/*` | — | c18 reads the live compiled note only (`:229-233`), never a gate row or a trap count |

**Order: mcrk first, then mtrap, rebuilt on mcrk's landing.** Three reasons:
1. The summary, the contract and the compileDay result hunks are adjacent to mcrk's.
2. The cycle-safe dynamic import (§3.4) is only *needed* once mcrk's static compiler→pacer edge exists, and it is harmless
   before.
3. mcap's c18 depends on mcrk, not on mtrap.

mtrap is disjoint from mcap's paths (mcap changes only `ci/`), so their order is free. If the architect lands mtrap first,
its build cuts from 5759cce, and mcrk's rebuild takes the two adjacent hunks.

## 6 · FILES A BUILD WOULD TOUCH

- `scripts/notes_compiler.mjs`: header TRAPS/GATE lines; `TRAP_BAR`, `gateableOf`; verdictOf/stubReader read the bar;
  gateDay's targets and expect loop; the compileDay result fields; `say`, `summary`, `glanceLines`, `status`; selftest
  cases (thin refused, distinct by bait, placeholder, old notes untouched, true fails).
- `scripts/forge_session.mjs`: `case "contract"` reads the owed fact by dynamic import; contractLines takes it as a
  parameter onto the `axes:` line; selftest cases.
- `scripts/learnstate.mjs`: askedFirst's absence counts (through the compiler's exported `gateableOf`); selftest cases at
  `:2077-2102`.
- `ci/mtrap/BASE`, `ci/mtrap/witness_mtrap.mjs`, `ci/mtrap/run_mutants_mtrap.mjs`, `ci/mtrap/PROOF.md`,
  `ci/mtrap/LEDGER.jsonl`, `ci/witness/mtrap/witness_traps.mjs`.
- **Beyond them, each a FORK:**
  - the forge/learn SKILL.md lines that would tell the teacher what "trap owed" asks (FORK mtrap-10);
  - a static import edge learnstate→notes_compiler. learnstate already imports the pacer (`learnstate.mjs:37`); after
    mcrk the compiler does too. No cycle is visible, but the build runs `depcruise` and `xray.mjs report` to measure it.
- **Untouched by construction:** `scripts/models.mjs`, `scripts/postmatch.mjs`, `scripts/state.mjs`, `scripts/done.mjs`,
  `scripts/daily_green.mjs`, `ci/witness/mcap/*`, and every file under `dressing-room/state/`.

## 7 · FORKS (the architect rules)

- **mtrap-1 · the refusal's record.**
  - (a) No row: every reader derives it from the compiled row by `gateableOf`.
  - (b) No compiled row is written for a thin note.
  - (c) A third row kind `{kind:"not_gateable", of, have, need}` from the compiler.

  **Recommend (a).** The ledger's two kinds stay fixed (`:13-18`), and the five old notes read the same way as new ones
  with nothing appended (row 1198 (4)). (b) loses the note (L9). It would also turn mcap c18 RED on a thin day for the
  wrong reason. *Decides it:* whether any reader needs the refusal's instant. None measured in §3.3 does.
- **mtrap-2 · what "distinct" means.**
  - (a) Distinct trap ids (verdictOf's own `:488`).
  - (b) Distinct folded baits, and a placeholder bait does not count.

  **Recommend (b).** It is the stricter one, and a gate may only get stricter. *Measured:* on all tracked notes ids equal
  distinct baits and no placeholder occurs (§1), so (b) changes no verdict today.
- **mtrap-3 · do capsule traps count toward the three?**
  - (a) Yes, as built (`:349-352`). They are baits he took and the capsule recorded, not compiler inventions.
  - (b) Only this lesson's cracks and corrections count.

  **Recommend (a)**, because row 1198 (2) refuses invention, not the capsule. But the four capsules are pre-cyborg
  (CLAUDE.md GAME ON), so a capsule concept would clear the bar without one live crack. *Decides it:* his word. Every
  tracked note has no capsule (§1), so nothing measured today turns on it.
- **mtrap-4 · the door.**
  - (a) The pacer's `axes:` line (§3.4).
  - (b) teaching_bar.
  - (c) The kickoff only.
  - (d) The captain's call.

  **Recommend (a).** (d) is refused by THE CAPTAIN'S CALL.
- **mtrap-5 · exit status of a thin day.**
  - (a) Exit as at base for a `fail` (0), with the refusal named.
  - (b) Exit 1.

  **Recommend (a).** Under (b), postmatch's close would print `NOTES NOT DONE` (`postmatch.mjs:567-569`) for a teaching
  fact.
- **mtrap-6 · where the three lives.**
  - (a) `TRAP_BAR`, read by verdictOf/stubReader too; W7 proves behaviour equal on a table.
  - (b) verdictOf byte-equal, with gateableOf's three fenced to it by a selftest.

  **Recommend (a).** It is one home with no twin literal.
- **mtrap-7 · which count the owed line states.**
  - (a) The refused note's `owed`.
  - (b) That number, plus "a new day's note counts only the windows that touched its day" (`:428-436`).

  **Recommend (b)** in the skill line, (a) on the contract. *Decides it:* the laptop measurement in §8 of how often an
  axis spans two days.
- **mtrap-8 · a live in-lesson count.**
  - (a) Owed only after the close (as proposed).
  - (b) A later unit has the pacer count the lesson's crack rows from mcrk's `cracks.jsonl`.

  **Recommend (a) now and (b) as its own unit after mcrk.** A crack row is not a trap: a trap is a diff with a bait.
- **mtrap-9 · what C22 counts.**
  - (a) Live notes only.
  - (b) Every compiled note with a gate row at or before now.

  **Recommend (b).** Row 1198 (4) names "the five", and three of the five are superseded (§1, `live false`).
  *Decides it:* his laptop's `learnstate brief` must read `not gateable 5` and `fail 3` under (b).
- **mtrap-10 · the skill line.**
  - (a) No skill edit; the contract carries it.
  - (b) One line in `.claude/skills/forge/SKILL.md` and `learn/SKILL.md`: "trap owed = set one more bait from this lesson's
    own material (a ```diff of a real break); never write one to reach a count".

  **Recommend (b)**, beside mcrk's skill lines.

## 8 · NAMED, NOT GUESSED (the cloud cannot reach these)

- **The eighth gate.** The tracked ledger (last commit `7c3c279`) holds 7 gate rows. The probe names 8. On his laptop:
  `node scripts/notes_compiler.mjs status`, plus a `node -e` printing only day, axis, trap count and verdict per gate row.
  Expect 5 a/b with 2 traps and 3 axis-c with 5.
- **His live session and the door.** That `forge_session.json` (gitignored) is open on the concept with an axis ON, so that
  the `axes:` fragment would print: `node scripts/forge_session.mjs status` on his laptop.
- **The hook cost** of one dynamic import of the compiler on every prompt. On his laptop, time `node scripts/turn_hook.mjs
  prompt` base vs build with `ARSENAL_ORGAN` unset. The turn hook's own record names its in-process cost
  (`.claude/settings.json:2`).
- **depcruise and xray on the build** (`npx depcruise scripts --config .dependency-cruiser.cjs`,
  `node scripts/xray.mjs report` Q2/Q5 = 0). These are the lander's runs.
- **The rung L1 witness** (`cloud/ml1/witness/rung_L1.mjs`, named at `notes_compiler.mjs:15`) is not in this tree. Whether a
  copy elsewhere pins the gate's result `op` set is unmeasured.
- **Multi-day axis windows** (mtrap-7): `node scripts/notes_compiler.mjs glance --date D` for each study day, to see whether
  a note's windows span days.
- **The effort receipt tool** `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository (reported in the final
  message).

## 9 · CI OF THIS BRANCH

Read through the public API with no token:
`curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`. The ids and the verdict are in the
seat's FINAL MESSAGE and in the ledger row `ci`. This spec changes no code, so the run judges its markdown against the
suite's canon laws.

## 10 · NEW MAIN 3f22388 (unit mlaw landed) — read against this spec's base

Runner M's new-main line, 20 Nov 2026: main moved from 5759cce to **3f2238887947e5827d2ce8f07a480e9dea3f527c**
(`git fetch origin main && git rev-parse FETCH_HEAD`). This is a spec seat, so nothing is merged. The base section was
re-read against the new main:

```
$ git diff --quiet 5759cce 3f22388 -- scripts/notes_compiler.mjs scripts/forge_session.mjs scripts/learnstate.mjs \
    scripts/postmatch.mjs scripts/models.mjs scripts/state.mjs scripts/daily_green.mjs scripts/teaching_bar.mjs \
    scripts/study_scope.mjs .dependency-cruiser.cjs .claude/settings.json && echo "spec organs equal"
spec organs equal

$ git show 3f22388:scripts/done.mjs | grep -n "compiled_notes\|cold_gate\|notes_compiler" ; echo "exit $?"
exit 1

$ git ls-remote origin claude/mcrk-build claude/mcap-build claude/mcrk-spec
937710b… mcrk-build · f8a7e15… mcap-build · 02c6f57… mcrk-spec        # the read tips are unchanged
```

What the new main changes for this unit:
- **No file:line of §2–§6 moves.** Every organ this spec cites is byte-equal at 3f22388.
- **`scripts/done.mjs` still reads no note verdict**, so the §3.3 row stands. The suite now runs its selftest
  (`package.json` organism:selftest gained `node scripts/done.mjs selftest`).
- **The law pack now rides the hermetic profile** (`organism_test.mjs`, unit mlaw, forks row 1137 (2) F2 A). It prints
  ONE machine line, `ORGANISM_TEST_LAWPACK {…counts}`, which the neutral verdict reads (F3 A). The mtrap BUILD's hermetic
  run therefore judges its law-pack counts against the base. The new pacer→compiler dynamic import (§3.4) and the
  learnstate→compiler edge (§6) must add no law-pack finding. That is a build measurement, named here.
- **Cutting the build:** the mtrap build cuts from the newest main at its start (3f22388 or later), and `ci/mtrap/BASE`
  names that sha. The landing order of §5 (mcrk, then mtrap) stands.

## 11 · NEW MAIN cebe3eb (unit mcov landed) — read against this spec's base

Runner M's new-main line, 20 Nov 2026: main moved from 3f22388 to **cebe3ebe4024c2144b934b3032b3fb837285d926**. This is
a spec seat, so nothing is merged. The base section was re-read against the new main:

```
$ git diff --quiet 3f22388 cebe3eb -- scripts/notes_compiler.mjs scripts/forge_session.mjs scripts/learnstate.mjs \
    scripts/postmatch.mjs scripts/models.mjs scripts/state.mjs scripts/done.mjs scripts/daily_green.mjs \
    scripts/teaching_bar.mjs .dependency-cruiser.cjs .claude/settings.json && echo "spec organs equal"
spec organs equal

$ git show cebe3eb:scripts/study_scope.mjs | grep -n "ALLOWED_CMD = \|notes_compiler.mjs dayBounds" | cut -c1-40
286:export const ALLOWED_CMD = /(learn_dig
682:  const d0 = Date.parse(`${day}T00:00:0

$ git rev-parse origin/claude/mcrk-build origin/claude/mcap-build
622727bd331303b5a157a2a5f565638734483721
53537b638160827ebff42da2d7890c1853c2d88f

$ git diff --quiet 937710b origin/claude/mcrk-build -- scripts/notes_compiler.mjs scripts/forge_session.mjs && echo "mcrk organ hunks equal"
mcrk organ hunks equal
```

What the new main changes for this unit:
- **No organ line of §2–§6 moves.** `study_scope.mjs` gained a selftest verb, so its lines shift by one: ALLOWED_CMD is now
  `:286` (was `:285`) and the IST day-bounds comment is `:682` (was `:681`). This spec only names study_scope as
  untouched, so no proposal changes.
- **The base suite's one pre-existing red is gone at this main.** The orphan-selftest member (deck_lint, home_pin, probe,
  study_scope; §1) now has all four wired through `package.json` organism:selftest. The mtrap build's hermetic run
  therefore starts from a base with no known red. A red on the build is the build's.
- **THE MEMBER BOUND** (`organism_test.mjs:58-62`, row 1182 (2)): every member run now has a named bound, and a member red
  names its kills. The notes_compiler, forge_session and learnstate selftest cases this build adds (§6) ride their
  members' bound. The build measures that each member still finishes under the bound on the neutral machine. The bound is
  not typed here.
- **The sibling tips moved by merges only.** mcrk-build is now `622727b`: it merged main 3f22388, and its notes_compiler and
  forge_session hunks are byte-equal to the `937710b` read in §5. mcap-build is now `53537b6`: it merged main 3f22388 and
  left BASE at 5759cce. §5's line map and landing order stand.
- **BASE for the mtrap build** (the bound class, row 1200 (2)): the build cuts from the newest main at its start, writes
  that sha into `ci/mtrap/BASE` once, and never rewrites it after a later merge.

## 12 · NEW MAIN 6a6bdff (unit mmeter landed) — read against this spec's base

Runner M's new-main line, 20 Nov 2026: main moved from cebe3eb to **6a6bdfff4349b849398b69d0748b27d37c874b85**. This is
a spec seat, so nothing is merged. The base section was re-read against the new main:

```
$ git diff --quiet cebe3eb 6a6bdff -- scripts/notes_compiler.mjs scripts/forge_session.mjs scripts/learnstate.mjs \
    scripts/postmatch.mjs scripts/models.mjs scripts/state.mjs scripts/teaching_bar.mjs scripts/study_scope.mjs \
    .dependency-cruiser.cjs .claude/settings.json package.json && echo "spec organs equal"
spec organs equal

$ git show 6a6bdff:scripts/done.mjs | grep -n "compiled_notes\|cold_gate\|notes_compiler\|gateDay\|traps" ; \
  git show 6a6bdff:scripts/daily_green.mjs | grep -n "compiled_notes\|cold_gate\|notes_compiler\|gateDay\|traps"
(no line from either)

$ git show 6a6bdff:scripts/organism_test.mjs | grep -n "^function clauseWitnesses"
2809:function clauseWitnesses() {
```

What the new main changes for this unit:
- **No cited organ line moves.** The two organs mmeter changed (`done.mjs`, `daily_green.mjs`) still read no note
  verdict, so their rows in §3.3 stand. The day meter's new exit 3 on a short day does not read the compiled notes.
- **The clause witness now has a suite member** (`organism_test.mjs:2802-2826`, mode `clauses`, row 1162 (2) F11). It
  walks `ci/witness/<unit>/` and runs every `witness_*.mjs` in its `plants` mode on the tree under test. It reads GREEN
  iff the witness exits 0 AND its last such line is `PLANTS <unit> · k of n plant(s) as expected`, with n > 0 and k = n.
  So §4's `ci/witness/mtrap/witness_traps.mjs` is bound to two things:
  - its bare `plants` mode judges only the HEAD tree it sits in, and every plant as expected ends with
    `PLANTS mtrap · n of n plant(s) as expected`;
  - its RED-at-base leg runs only under `--tree <base archive>` (the unit witness `ci/mtrap/witness_mtrap.mjs` drives it),
    so the suite member never reads the base leg as a failure.
  The member is NOT MEASURABLE on a checkout with no node_modules. The build runs it after `npm ci --ignore-scripts`.
- **The sibling builds:** mmeter's own `ci/witness/mmeter/` sits beside where mtrap's would go, and the two touch disjoint
  paths. §5's landing order (mcrk, then mtrap) stands.
- **BASE for the mtrap build** is unchanged in kind (row 1200 (2)): written once from the main the build cuts from.
