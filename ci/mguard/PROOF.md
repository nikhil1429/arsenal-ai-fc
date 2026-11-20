# mguard · THE SPEND GUARD — BUILD PROOF (forks rows 1176 / 1177 (3), 20 Nov 2026 UTC)

Branch `claude/mguard-build`, cut from `origin/main` at **`5759cce`** (`5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90`, fetched
20 Nov 2026 UTC; `ci/mguard/BASE`). Spec: `ci/mguard/MGUARD_SPEC.md` on `claude/mguard-spec` at `4eb934d`, read whole with
its ledger. `scripts/usage_tap.mjs`, `scripts/presence.mjs` and `.claude/skills/runner/SKILL.md` are byte-identical
between the spec's base `fb42118` and `5759cce` (`git diff --stat fb42118 5759cce -- <the three>` printed nothing), so
every spec `file:line` holds at this base. Ledger: `ci/mguard/LEDGER.jsonl`. Nothing was landed, merged or opened.

## Built — row 1176 (1)–(3) and row 1177 (3)

| row / fork | what the build does | file |
|---|---|---|
| **(3) FIRST CLAUSE** | no root variable ⇒ the statusline line (and a stderr line) reads `RED · usage tap · no campaign root (ARSENAL_CAMPAIGN_ROOT unset) — this reading (five-hour N% · weekly N%) is DROPPED, nothing written`; `status`, `verdict` and `need` read RED by the same name (verdict still refuses by exit 3). A write that throws reads RED the same way. Exit 0, one line, inside the bound — fail open never fails open INTO a reading-shaped line | `scripts/usage_tap.mjs` |
| G1 A | the reading history `usage_readings.jsonl` beside the reading in the campaign root, appended by statusline and panel only when a pct or a reset moved (dedupe by value) or when the row records what the line showed | `scripts/usage_tap.mjs` |
| G2 A | presence's focus row records `away: [[startIso, endIso], …]` and `back_at`; read-only reader `awaySpans` (bounded tail read) | `scripts/presence.mjs` |
| G3 A | `spanSpend` (PURE): a reset inside the bracket, or an unknown reset, makes that window UNREAD | `scripts/usage_tap.mjs` |
| G4 A, as stricter | selftest W3.1 now names EXACTLY THREE writes (the reading's tmp, its rename, the history's one append); W3.3: the history's name has one home in code | `scripts/usage_tap.mjs` |
| G5 A | read and show only: no stop, no throttle, no card | — |
| G6 A (B fallback) | the statusLine prints `back · away <span> IST · spent five-hour +a% weekly +b% · left five-hour x% weekly y%` (or `spend unread (<why>)`) and the history row carries `shown`. G6 B, the learn-start note, is the named fallback and is NOT built | `scripts/usage_tap.mjs` |
| G7 A | the tap reads presence through `awaySpans` (presence's own reader), imported only on a render with a root. The render time is measured on his laptop at the re-run (below), never guessed | `scripts/usage_tap.mjs`, `scripts/presence.mjs` |
| G8 | `scripts/organism_test.mjs` OUT (the witness walker covers `ci/mguard/witness_mguard.mjs`); the runner skill line IN | `.claude/skills/runner/SKILL.md` |
| row 1177 (3) | a day with NO away-span rows reads `U1177 · UNREAD · no away-span rows …` in the judge: never a day with no spend. Planted both ways (clause U1177) | `ci/witness/mguard/witness_guard.mjs` |
| P5 | the real-day judge `node ci/witness/mguard/witness_guard.mjs --day <D> [--org <dir>]`: exit 0 holds · 1 red · 2 unread | `ci/witness/mguard/witness_guard.mjs` |

**G7's measurement, by command (his laptop, at the re-run; the number is NOT measured here):** with the root set and a
saved statusLine stdin block, `Measure-Command { Get-Content block.json | node scripts/usage_tap.mjs statusline }` at
`5759cce` and again at this build (bash: `time (node scripts/usage_tap.mjs statusline < block.json)`). The fail-open
guard inside the tap is unchanged and still ends the render inside the ruled bound.

## The witness, both ways (by last line, 20 Nov 2026, this cloud container)

```
node ci/mguard/witness_mguard.mjs --org . --base-org <LF tree of 5759cce>
GREEN MGUARD the spend guard · 7 clause(s)                                   (exit 0)

node ci/mguard/witness_mguard.mjs --org <LF tree of 5759cce> --base-org <LF tree of 5759cce>
RED MGUARD · JUDGE                                                           (exit 1)
```

Clause by clause (build / base): R1176.3 GREEN / RED · U1177 GREEN / RED · G1 GREEN / RED · G2 GREEN / RED ·
G3 GREEN / RED · G4 GREEN / RED · LAST ok. The judge on a planted base copy reads `READER · UNREAD` (exit 2): at
`5759cce` c31 is UNREAD, never green.

## The mutants (20 Nov 2026)

```
node ci/mguard/run_mutants_mguard.mjs --org . --base-org <LF tree of 5759cce>
  M0 → R1176.3 · M1177 → U1177 · M1 → G1 · M2 → G2 (also G4) · M2b → G2 · M3 → G3 · M4 → G4
run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN
```

## Selftests touched, by headline (20 Nov 2026)

```
node scripts/usage_tap.mjs selftest | tail -1     before (5759cce): usage_tap selftest 31/31 — all clauses hold
                                                  after  (build):   usage_tap selftest 45/45 — all clauses hold
node scripts/presence.mjs selftest | tail -1      before: ALL CHECKS PASSED      after: ALL CHECKS PASSED (six MGUARD checks added)
node scripts/models.mjs check ; echo exit $?      models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0) · exit 0
```

## Members touched, before and after

`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 20 Nov 2026, this container (`npm ci` of the pinned
lockfile first). BASE ran on an LF tree of `5759cce` made a git repo; the build ran in the clone.

```
                                                       BASE 5759cce        BUILD
SUITE MEMBER · usage_tap selftest exits 0               ok                  ok
SUITE MEMBER · presence selftest exits 0                ok                  ok
MPOOL · usage_tap selftest runs in the hermetic chain   ok                  ok
WITNESSES (the walker)                                  SKIP (neutral machine only, B2) — both
last line (BASE)   organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
last line (BUILD)  organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
```

The build's one red, `EVERY organ with a selftest is wired into a suite` (orphaned: deck_lint, home_pin, probe,
study_scope), is also on BASE, and none of its organs is touched here. BASE's two other reds (`SUITE MEMBER · sandbox
selftest exits 0` and the all-members line that it carries) come from that scratch tree's sandbox canary. They are not
on the build run.

## The law pack counts (row 1130 (2)), by command, on LF trees (20 Nov 2026)

`node scripts/lawpack.mjs gate`, each tree an LF checkout through a private index, made a git repo with
`core.autocrlf=false`, `node_modules` linked from an `npm ci` of the pinned lockfile:

```
BASE  5759cce · lawpack · 1940 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
BUILD          · lawpack · 1945 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
```

Every judged count is EQUAL; no count rises. Both trees print the same one RED,
`jugad-literal-subject-list ROSE — 93, baseline 90`. It is on BASE as cut, so it was not raised here (FORK F8).

## Canon-count replay (row 1169), over COMMIT blobs

The suite's LOAD ZERO BLOCK 7 law, replayed with `git show <sha>:<path>` over every tracked `.md` outside
`docs/archive/`, before each push that touched markdown: `canon replay <sha> · … · undeclared 0 · declared 1`
(the one declared line is main's own). Run again on the tip that carries this file.

## The neutral machine (public API, curl, no token)

Check runs read at `api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` and `…/check-runs/<id>/annotations`:

- `fa7c18f`: 136024667228 / 136024666833 · cancelled (superseded by the next push)
- `37d6a32`: 136026011388 / 136026010983 · cancelled
- `13f6889`: 136026941301 (node 22) / 136026940969 (node 24) · superseded
- **`1fe86f6`: 136027924936 (node 22) · failure · 136027925181 (node 24) · failure.** Both legs carry the same B1_VERDICT:
  `RED · "1 member(s) red that are not red at the merge base" · new: ["WITNESS ‹mpool› · GREEN at head against its BASE"]
  · base_red 1 · fixed 0 · pass 229 · fail 2 · live 126 · profile hermetic`. The ONE new red is F1 below, and it is the
  red this proof predicted. The `WITNESS ‹mguard›` member is not in the new-red list. BASE `5759cce` reads success on both legs
  (135919452425 / 135919452846).

**The verdict of the last push is RED, by F1 alone.** The fix is in `ci/mpool/witness_mpool.mjs`, a file this build may
not touch. It goes to the architect.

## FORKS

- **F1 · the mpool witness's W3.1 against G4 A.** `ci/mpool/witness_mpool.mjs:157-160` (a landed unit's witness, judged
  at HEAD by the suite's walker) asserts that the tap makes EXACTLY TWO writes. Row 1176 G4 A rules three. At this build
  `node ci/mpool/witness_mpool.mjs --org . --base-org <LF tree b1fc984>` reads `RED MPOOL · W3.1`, and every other clause
  of it stays green, so on the neutral machine the WITNESSES member `WITNESS ‹mpool› · GREEN at head against its BASE`
  is expected RED. `ci/mpool/` is not a named file, so it was NOT edited. The fix is the architect's: either that clause
  counts the three writes G4 A names, or a KNOWN_RED row. The ruling was not bent to dodge it (the history is a true
  one-line append, not a tmp+rename rewrite).
- **F2 · two witness paths.** The spec puts its witness at `ci/witness/mguard/witness_guard.mjs`, and the real-day judge
  (P5) is built there. The suite's walker (`scripts/organism_test.mjs:2800`, `witnessFile`) only finds
  `ci/<unit>/witness_<unit>.mjs`, so the plant witness the brief names is `ci/mguard/witness_mguard.mjs` and runs
  `--org`'s judge. Both paths are named in the brief.
- **F3 · `shown` is a list.** The spec writes `shown: { span, five, week }`. The build writes
  `shown: [{ span, read, why, bracket, five, week }]`, so two spans closed in one presence row are both recorded (G4
  covers "every READ span"). The line names the newest span plus "(+k earlier span(s) recorded)".
- **F4 · G3's scope.** The spec scans "the tracked tree". The judge scans `scripts/*.mjs` (the organs, the owners-only
  law's domain), with comments stripped. A writer is a file that names the history (its name, or the tap's
  `historyPath(` door) AND carries a write call. The history's name has ONE home (tap selftest W3.3), and everyone
  else derives the path from `historyPath`.
- **F5 · dedupe by value has a cost.** Suppose a span has no percent change across it and its edge rows are older than
  the age bound. It reads UNREAD (unbracketed): stricter, never a green. How often that happens is measured from the
  history on his laptop.
- **F6 · a new READ door, `ARSENAL_PRESENCE_LOG`** (default absent ⇒ presence's own ledger). The tap and the judge
  honour it. The tap's selftest uses it to stay off his live ledger. It reads only, and no organ writes through it.
- **F7 · G4's "first history row".** This was narrowed to the first `source: statusline` row at or after the presence
  row that first closed the span. A `his-panel` row never carries `shown`.
- **F8 · BASE's law pack is already RED** (`jugad-literal-subject-list` 93 vs baseline 90 at `5759cce`, this container).
  It is not raised here. Whether the neutral machine sees the same is read from its law-pack member.
- **F9 · G6 B (the learn-start note) is not built:** it is the ruled fallback, for a span after which no render follows.
- **F10 · the statusline's write-failure path also reads RED.** This extends row 1176 (3) to the one other place where a
  reading could vanish while a line still printed.
- **F11 · hermetic suite in this container:** see "Members touched". The bare `npm test` was never run whole.
- **F12 · the session-start hook rewrote a tracked state file** (`dressing-room/state/brief_log.jsonl`) in this working
  tree. It was never staged, committed or read.
- **Ruling vs spec, named:** the ruling adds R1176.3 (not in the spec) and the peer ruling row 1177 (3) adds U1177. G8
  drops the spec's suite-file plant. G7's number is deferred to his laptop.
- **Not mine, per row 1176 (4)/(5):** no variable was set and no settings file of any kind was written; the zero
  sense-pass reads are the runner's.

## NAMED NOT GUESSED

N-G1 … N-G6 of the spec stand unchanged (his AFK data, the campaign launch ledger, whether the sense pass runs while
he is away, whether his surface renders statusLine with the root set, the render wall time, the age bound's value).
