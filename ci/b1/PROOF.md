# B1 · THE NEUTRAL VERDICT — PROOF

Unit B1 (cloud runner mb1). Forks rows 939 (1)(2) / 1006 (2) / 1012. Branch `claude/b1-neutral-verdict-5ukvby` (the
session's assigned name for the brief's `claude/b1-neutral-verdict`; the final head is mirrored there too).
Every step has one row in `ci/b1/LEDGER.jsonl` (ts, act, cmd, last_line, out). The files under `out/` are REDACTED
transcripts: they keep the assert and member lines, the headline and the verdict, and drop every detail line, because a
detail line can quote a state file and this repo is public. The full outputs stayed in the session scratchpad.

> ⚠ **`.claude/settings.json` MUST NEVER LAND ON MAIN.** The branch's first commit `660be16` adds one key to it
> (`modelSettings.claude-opus-5-5.effortLevel`, the seat effort). This unit never edited, staged or reverted it.
> B1 reaches main by the named paths under LANDING ITEMS only.

## 0 · the base

`git fetch origin main && git merge-base HEAD FETCH_HEAD` → **`5767e2126b67788929390f3caa1089b4349fc5a0`** (main's tip:
the branch forks at main).

## (a) the no-headline death: cause, fix, witness

**Cause:** `scripts/organism_test.mjs` `writersOf()` was added by 6032898 (row 814's ONE WRITER instrument, first CI run
c9124edb). It ends a function body at the first line that IS `"}"`. On a Windows checkout under `core.autocrlf` every
line ends `"\r"`, so `"}\r"` never matches. `j` then runs to `code.length`, and the body loop reads `x.code[code.length]`,
which is `undefined`. The result is `TypeError: Cannot read properties of undefined (reading 'search')` at
**`scripts/organism_test.mjs:573`** of the base (`:738` now). The error is uncaught in `main()`, so the process dies before
the headline. CI dies after about 87 s, after `coverage` and `integrity` and partway into `laws`.

**Fix** (`scripts/organism_test.mjs`):
- The source is read as LF (`.replace(/\r\n?/g, "\n")`, `:688`).
- The body end is clamped to the last line.
- A CRLF fixture plants the instrument both ways. It includes a body left open at end of file, which threw on LF too.
- `main()` turns a mode that throws into a named red (`MODE <m> · ran to its end`), never a dead runner.

| step | command | LAST line |
|---|---|---|
| base, CRLF clone | `git -c core.autocrlf=true clone …; node scripts/organism_test.mjs laws` | `exit 1` (stack: `organism_test.mjs:573 TypeError`) — `out/a0_base_crlf_laws.txt` |
| fixed, same clone, 18 Nov 2026 | `node scripts/organism_test.mjs laws` | `organism_test: 114 passed, 2 failed · ruled 0 · UNRULED 2` — `out/a1_fixed_crlf_laws.txt` |
| fixed, whole suite, 18 Nov 2026 | `npm test` (CRLF clone) | `organism_test: 177 passed, 6 failed · ruled 0 · UNRULED 6` — `out/a2_fixed_crlf_all.txt` |
| Windows CI | suite.yml on this branch | see THE CI RUNS READ |

## (b) the hermetic profile

`ORGANISM_TEST_PROFILE=hermetic` (or `--hermetic`) is what suite.yml runs. Each LIVE member is printed as
`  LIVE <name> — not run in the hermetic profile: <reason>`:
- a LIVE selftest is never spawned (in `hermetic()` or `suites()`);
- a LIVE mode is never entered;
- a LIVE assert inside a mode that also holds hermetic asserts is not judged (FORK 2).

Nothing is deleted. Plain `npm test` (the full profile) runs everything as before.

**Measured, never recalled.** `ci/b1/probe.mjs` was preloaded with `NODE_OPTIONS=--import`, so every child that keeps the
environment inherits it, across one full run. It journalled:
- every read of a state file's bytes, keyed by content hash against the checkout's own state files, so a sandbox COPY
  counts and a planted fixture does not;
- every process-table spawn;
- every port and host reached.

Each event was attributed to the selftest child or the assert window it fell in (`out/b0_probe_attribution.jsonl`, names
only). A second run with `Date` shifted +90 days named the members whose verdict moves with the clock (`dugout`,
`watchman`). Two members went red under the probe's load alone, so they time the wall clock (`blackbox`, `turn_hook`):
see `out/b1_clock_shift_diff.txt`.

**The result, measured 18 Nov 2026:** 72 selftests, 5 modes (`path`, `alive`, `gates`, `lawpack`, `atlas`) and 49 asserts of
`laws`/`integrity`/`hermetic` are LIVE (`LIVE_SELFTESTS`, `LIVE_MODES`, `LIVE_ASSERTS` in `scripts/organism_test.mjs`).
As of 18 Nov 2026, 50 suite members run hermetic.

| step | command | LAST line |
|---|---|---|
| head (CRLF clone), 18 Nov 2026 | `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` | `organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` — `out/b2_hermetic_head_crlf.txt` (runs in 28 s) |
| base by head's instrument, 18 Nov 2026 | same, on 5767e21 | `organism_test: 136 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` — `out/b3_hermetic_base_crlf.txt` |

## (c) the verdict · (d) every red an annotation

In suite.yml, each matrix leg (node 22, node 24, Windows) measures the HEAD tree and its MERGE BASE, both in the hermetic
profile and both with the HEAD's `organism_test.mjs` (laid over a local clone of the base, never committed there).
`node scripts/ci_verdict.mjs compare` then works as follows:
- Every head red absent at the base is a `::error` (NEW RED).
- Every head red also red at the base is a `::warning` (BASE RED).
- GitHub renders 10 annotations per level per step, so a tenth annotation carries every red past the ninth. No red is
  dropped.
- Then ONE verdict annotation (`notice` when GREEN, `error` when RED) carries the JSON verdict.
- The step's exit is the job's: 0 GREEN, 1 RED.

A member's identity is its name with digit runs folded, so "all 122 …" and "all 123 …" are one member. A head or base run
with no headline is RED. The log prints names only.

| step | command | LAST line |
|---|---|---|
| local rehearsal | `node scripts/ci_verdict.mjs compare --head … --base … --label "linux crlf"` | `B1_VERDICT linux crlf GREEN — no member red that is not red at the merge base · head 7721d59 · base 5767e21 · 0 new red · 3 base red · 0 base red now passing` — `out/c0_verdict_local_crlf.txt` |

BASE REDS named by the local rehearsal (Linux, 18 Nov 2026): `EVERY organ with a selftest is wired into a suite` (orphans home_pin,
probe, study_scope), `SUITE MEMBER · sandbox selftest exits 0` (the collar canary escapes off Windows), and
`all N hermetic suite members pass`. The Windows base reds are in THE CI RUNS READ.

## (e) the reader

`node scripts/ci_verdict.mjs <sha>` prints ONE verdict line in at most 3 API calls and sends no token:
1. the commit's check runs;
2. and 3. the annotations of the two `npm test · node N` legs.

It answers PENDING or NONE after ONE call and never polls. It is wired into `organism:selftest`.

| step | command | LAST line |
|---|---|---|
| selftest (planted fetch) | `node scripts/ci_verdict.mjs selftest` | `ALL CHECKS PASSED` (13 / 0) — `out/e0_ci_verdict_selftest.txt` |
| base, live API | `node scripts/ci_verdict.mjs 5767e21…` | `ci_verdict 5767e21 RED — npm test · node 22: RED (failure; no verdict annotation — the run never reached its verdict) [run 134647547323] \| npm test · node 24: RED (…) [run 134647546909] (3 calls)` — `out/e1_reader_base_5767e21.txt` |

⚠ **Anonymity in THIS sandbox could not be shown.** The session's egress proxy answered `X-Ratelimit-Limit: 15000`, which
means it authenticates GitHub calls on the way out. The reader itself sends no token, so on any plain machine it runs at
the anonymous limit.

## (f) the away-day reds — CAUSED, never fixed here

| red (awayday.yml, newest) | branch | file:line | witness |
|---|---|---|---|
| `S893 F1 NEVER THE PROCESS TABLE` | **a defect, not the laptop** | `scripts/context.mjs:1194`. `SRC` (read at `:1192`) is CRLF on the Windows checkout, and `SRC.split(/\nfunction lane\(deps = \{\}\) \{\n/)` needs `{\n`, which `{\r\n` never matches. `laneCode` is `""`, so `/readStamp\(\)/` fails. | red by name on a CRLF clone of 5767e21, green on an LF clone (`out/f0_…`, `out/f1_…`) |
| `S880B THE STAMP MOVES ON A POLL WITH NO WINDOW CHANGE` | **a defect, not the laptop** | `scripts/context.mjs:1100`. `workerArm` (sliced from the CRLF `SRC` read at `:1057`, split at `:1061-1062`) is tested with `/\n {6}\}\n(?: {6}\/\/[^\n]*\n)* {6}try \{ stampPoll…/`, which `\r\n` never matches. | same pair: CRLF `SELFTEST FAILED` with exactly these two `✗`, LF `ALL CHECKS PASSED` |

Same class as unit mcrlf (02a181c): the fix is `.replace(/\r\n/g, "\n")` on the two own-source reads. context.mjs is not
this unit's file, so it is FORK 1.

## THE PLANTED RED and THE CLEAN READ (witnessed 18 Nov 2026, Windows runner, node 22 and 24)

The plant branch `claude/b1-neutral-verdict-plant` is this branch plus ONE assert,
`B1 PLANTED RED · a member red on the plant branch only` (517e14b). It is merged forward, never rebased, and never lands.

1. **First witness, a HOLE found and closed.** With the base measured by the head's instrument, the plant read
   `ci_verdict 517e14b GREEN`, because the planted assert rode the instrument onto the base and was red on both sides
   (`out/w0_…`). The fix is in f89ed50: the base runs ITS OWN instrument first. Only when that instrument dies before its
   machine line (5767e21's does) is the head's laid over the base. In that case the verdict gets the base's own source,
   and an assert the base never had is NEW (`newInInstrument`, planted both ways in the selftest).
2. **Second witness, f89ed50 / 49d12f0.** The plant read RED by name, and the clean branch read RED as well. The clean
   branch's red was a GENUINE new red: `LOAD ZERO BLOCK 7 · no canon file states a live count…`. This PROOF.md, a
   tracked `.md`, stated undated counts. The verdict caught it, and the lines were dated, which is the law's own
   "records" exemption. The gate is unchanged.
3. **Final witness:** see the reads below.

## THE CI RUNS READ (check-run ids; every read by `node scripts/ci_verdict.mjs <sha>`, ≤3 calls each)

| sha | read (LAST line) |
|---|---|
| 5767e21 (base, main) | `RED — node 22: RED (failure; no verdict annotation — the run never reached its verdict) [run 134647547323] \| node 24: … [run 134647546909] (3 calls)` |
| cc1b869 (branch v1) | `GREEN — node 22: GREEN (base 5767e21 · 0 new red · 1 base red · 126 live) [run 134688375121] \| node 24: GREEN (…) [run 134688375773] (3 calls)` |
| 517e14b (plant v1) | `GREEN — … 0 new red · 2 base red … [runs 134688495108 / 134688494740]` ← THE HOLE |
| f89ed50 (branch v2) | `RED — 1 new red: LOAD ZERO BLOCK 7 · no canon file states a live count … [runs 134695317349 / 134695316983]` ← a real red, this file's |
| 49d12f0 (plant v2) | `RED — 2 new red: B1 PLANTED RED · a member red on the plant branch only ; LOAD ZERO BLOCK 7 … [runs 134695334936 / 134695335289]` |
FINAL_READS_HERE

## FORKS (each needs a file this unit may not edit, or a ruling)

1. **context.mjs:1100 and :1194 — the two away-day reds** are CRLF defects in the selftest's own-source slicing. The
   fix is the mcrlf shape on the reads at `:1057` and `:1192`. Lane M's file.
2. **LIVE asserts inside `laws()` / `integrity()` / `hermetic()` are computed but not judged.** They share one sandbox
   with hermetic asserts. Truly not running them needs a block-level split of those modes. The brief allowed this file
   (organism_test.mjs), but the split is about 30 blocks, so it is left for a ruled unit.
3. **The definition of live, taken literally, puts 72 of 122 selftests out of CI (measured 18 Nov 2026).** Most read config-shaped state
   (`registry.json`, `captain.json`, `*_config.json`) at import. A narrower line is a RULING, not a session's call: count
   only files the laptop's unattended push rewrites (measured since 15 Sep: `examiner_drill`, `awayday`,
   `audit_ledger`, `learning_state`, `conductor*`, `readiness`, `sitting`, …), or plant a state tree per selftest.
4. **The hermeticity law (`running all N selftests leaves live state untouched`) is LIVE.** It hashes the state tree, so
   CI no longer checks it. It still runs on his laptop and in the watchman's sweep.
5. **The probe measured on Linux.** A process-table probe gated on `process.platform === "win32"` never fires there.
   Such a member would show on Windows as a BASE red on a branch, or as a new red on a main push after state churn. A
   Windows probe run is the closing measurement.
6. **`sandbox selftest` writes `CANARY_MUST_NEVER_EXIST.json` into the checkout's real state on Linux** (the collar
   canary escaped; reproduced on every Linux run). It is a base red here, and on Windows see CI. Lane owning
   `scripts/sandbox.mjs`.
7. **The reader's anonymity** could not be witnessed in this sandbox (see (e)).
8. **awayday.yml / ci_manifest.json / awayday.mjs are unchanged.** Its two reds are FORK 1, and it runs the full
   profile by design.

## LANDING ITEMS (named paths; never `.claude/settings.json`)

- `scripts/organism_test.mjs`
- `scripts/ci_verdict.mjs`
- `package.json`
- `.github/workflows/suite.yml`
- `ci/b1/` (PROOF.md, LEDGER.jsonl, probe.mjs, out/) — the record. A landing may take it or leave it; it is never a
  runtime dependency.
