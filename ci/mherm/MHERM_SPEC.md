# MHERM SPEC — why the hermetic run is not a function of the tree alone

Unit mherm · forks row 1151 (3) · F5 of the mcov proof (`git show 1a4a275:ci/mcov/PROOF.md`, §11 FORKS).
Base: `origin/main` **fb42118** at the cut, 19 Nov 2026. Every `file:line` below is at fb42118.
Every measurement is a command; its last line is in `ci/mherm/LEDGER.jsonl` (one row per act).
This is a SPEC. Nothing here is built on any branch. The "temp build" named below lived in a scratch clone
under the session's scratch dir only, to measure the GREEN side of each witness; it is not committed anywhere.

## HEADLINE (measured 19 Nov 2026)

The hermetic `all` reads **where the tree sits**, not only what it holds. `audit_preload.mjs:131` lets the collar
write anywhere under `os.tmpdir()`; a fresh clone made under the temp dir therefore lies under that allowance, so the
sandbox canary's two "live" writes (`sandbox.mjs:200-201`) are **not denied** — they land in the clone. That is the red.
And those two landed files are what a second run reads: `brain_ledger.jsonl` is the gate of a block
(`organism_test.mjs:1610`) that is silently skipped when the file is absent, so run 2 opens ten asserts run 1 never ran.
A third, smaller leak: `tone.mjs:58` writes `scripts/tone.log` into the tree and its selftest (`tone.mjs:182-183`)
reads whatever an earlier run left there. Outside the tree, five selftests leave temp files behind in `os.tmpdir()`.

The fix is one law in two places: **a run's temp dir is its own**. The sandbox gives its children its own `.tmp`
(T1), the suite gives every child one per-run temp dir and removes it at exit (T2), the brain-ledger block is
named LIVE in the hermetic profile instead of being gated on a gitignored file (T3), and tone's selftest hands
its failure log a dir under its own box (T4). On a temp build of exactly those four, a fresh clone under the
temp dir run twice gives **byte-equal verdict lines**, an unchanged `git status --porcelain --ignored`, and nothing
left under the temp dir.

---

## Q1 · which members differ, run to run and tree to tree

Measured with `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 19 Nov 2026.

| tree | run | headline (its last summary line) |
|---|---|---|
| fresh clone c1 under `os.tmpdir()` (`core.autocrlf=false`, `npm ci`) | 1 | `organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126` (19 Nov 2026) |
| same clone c1 | 2 | `organism_test: 157 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126` (19 Nov 2026) |
| working tree (`/home/user/...`, NOT under `os.tmpdir()`) | 1 | `organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126` (19 Nov 2026) |

Verdict lines (`grep -E "^  (ok  |FAIL|LIVE) |^organism_test:"`) of c1 run 1 and run 2: `cmp` → `differ: char 17687, line 109`.

Members whose verdict differs:

1. **`SUITE MEMBER · sandbox selftest exits 0`** — FAIL in c1 (both runs), ok in the working tree.
   c1 last line: `sandbox:   · the tripwire recorded EXACTLY four attempts … recorded 2: fetch, spawn-billing |   · …and the live state file the canary aimed at was never created`.
   Working tree: `ok   SUITE MEMBER · sandbox selftest exits 0`.
2. **`all 53 hermetic suite members pass`** (the roll-up at `organism_test.mjs:386`) — FAIL in c1, ok in the working
   tree; it is item 1 carried up, not a second cause.
3. **Ten asserts that exist only in run 2** (present, `ok`, in c1 run 2; absent from c1 run 1 and from the working tree):
   `LOAD ZERO · every lane in the brain ledger…` (`organism_test.mjs:1613`) · `LOAD ZERO · ...and every off-road
   declaration NAMES…` (`:1616`) · `S7 RATCHET · every gated lane has a DECLARED RIGHT CONSUMER…` (`:1635`) ·
   `S7 RATCHET · ...and the gate's table is the ONE copy…` · the six `RUNG A ·` asserts from `:1720` on.
   They differ by **existence**, not by verdict: the block is entered only when `brain_ledger.jsonl` parses.

The one red common to all three trees — `EVERY organ with a selftest is wired into a suite` (orphaned: deck_lint,
home_pin, probe, study_scope) — is a function of the tree (identical in every run); it is the mcov unit's (F1 RULED B),
not landed on fb42118, and not this unit's.

## Q2 · the sandbox member: its assert, the input, the plant

**The asserts** (`scripts/sandbox.mjs`, selftest at `:312`):
- `:330` `NEGATIVE CONTROL · writing LIVE dressing-room/state is DENIED` — c1/c2: `"liveWrite":"ESCAPED"`
- `:331` `NEGATIVE CONTROL · appending the LIVE brain_ledger is DENIED` — `"ledger":"ESCAPED"`
- `:332` `the tripwire recorded EXACTLY four attempts` — `recorded 2: fetch, spawn-billing`
- `:334` `…and the live state file the canary aimed at was never created`
  (standalone c2: `sandbox: 11 passed, 4 failed`, exit 1, 19 Nov 2026)

**The path that produces it (cross-file):**
1. `sandbox.mjs:200-201` aims the canary at `join(ROOT, "dressing-room", "state", …)` — the REAL tree.
2. `sandbox.mjs:137` arms every child with `audit_preload.mjs` through `NODE_OPTIONS`; `sandbox.mjs:114-139` sets
   HOME/APPDATA/LOCALAPPDATA/npm dirs into the sandbox but **leaves TMPDIR/TEMP/TMP as the parent's**.
3. `audit_preload.mjs:91` `const TMP = norm(os.tmpdir())` — read in the child, from that inherited env.
4. `audit_preload.mjs:124-133` `writeAllowed`: `under(p, SANDBOX)` → allow; **`:131` `under(p, TMP)` → allow**;
   else deny + `trip("fs-write-escape")` (`:139`).
5. A tree under `os.tmpdir()` ⇒ the canary's two targets are under TMP ⇒ allowed, not tripped ⇒ the file is
   written for real, the tripwire holds 2 rows (fetch `:186`, claude `:187`), and four asserts read red.

**The input:** the **position of the tree relative to `os.tmpdir()`** — on POSIX the `TMPDIR` env var, on Windows
`TEMP`/`TMP`. Not a git config, not a cache, not a file.

**The plant, both ways** (c2, a fresh clone under the temp dir; the two files run 1 left were removed by a node script):
- default env → `sandbox: 11 passed, 4 failed` (exit 1) <!-- measured 19 Nov 2026 -->
- `TMPDIR=<scratch>/othertmp` (a dir that is not an ancestor of the clone) → `sandbox: 15 passed, 0 failed` (exit 0) <!-- measured 19 Nov 2026 -->
- the working tree (not under `/tmp`) under the suite → `ok SUITE MEMBER · sandbox selftest exits 0`.

So "the architect measured the same on his laptop" is what this predicts if his scratch clone sat under `%TEMP%`
(NAMED below — not reachable from here).

## Q3 · every file the first run leaves, and who reads it on the second

`git status --porcelain --ignored`, c1 (19 Nov 2026):
- before run 1: `!! node_modules/`
- after run 1 and after run 2 (same set):

| path | written by | read on run 2 by | effect |
|---|---|---|---|
| `?? dressing-room/state/CANARY_MUST_NEVER_EXIST.json` (untracked, **not** ignored) | the canary, `sandbox.mjs:188` via `:200` | `sandbox.mjs:335` (`existsSync`) | red either way in a temp-dir clone; on a tree outside tmp it is never written |
| `!! dressing-room/state/brain_ledger.jsonl` (one row `{}`) | the canary, `sandbox.mjs:189` via `:201` — a breach of the shared append lane (`talk.mjs:17` names the lane's appenders; the canary is not one) | `organism_test.mjs:1603` (gate at `:1610`); `sandbox.mjs:214` (`ledgerFingerprint`) | opens the ten asserts of Q1·3 |
| `!! scripts/tone.log` | `tone.mjs:58` (writeAtomic's failure log, `__dirname`), driven by the selftest at `:176` | `tone.mjs:182-183` | verdict unchanged, but on run 2 the assert reads run 1's line: a writeAtomic that stopped logging would still read green |

The working tree run left only `!! scripts/tone.log` (and `node_modules/` from `npm ci`): no canary file, no ledger.

**Plant of the ledger alone** (c2, clean): `organism_test.mjs laws` → `74 passed, 0 failed · LIVE 42`; plant a one-row <!-- measured 19 Nov 2026 -->
`brain_ledger.jsonl` by node → `84 passed, 0 failed · LIVE 42` (both 19 Nov 2026). The ten are exactly that delta.

**Outside the tree** (`find /tmp -newer <mark>`, excluding the session's own dirs), each run left:
`hippo-{test,batch,full,pending,race,mat,bump}-<ms>.jsonl` (`hippocampus.mjs:1251`, `:1259` and siblings) ·
`harvest-XXXXXX/` (`harvest.mjs:245`) · `harvest-scrub-XXXXXX/` (`harvest.mjs:312`) · `mirror-selftest-<ms>/`
(`mirror.mjs:316`) · `pulse-audit-XXXXXX/` (`pulse.mjs:355`). Every name is a fresh mkdtemp or a millisecond stamp,
so **no second run reads any of them** — they are leaks, not inputs. Under `$HOME`, the find (which excluded npm's
own cache and `node_modules`) saw only the session's own transcript dir, which is not the run's.

**Census limit, named:** a grep of `organism_test.mjs` for the shape `"dressing-room", "state", "<name>"` finds 7 names
(19 Nov 2026), 4 absent in a fresh tree; three of those four are read under a planted `sb`/`d` root (`:1120`, `:2511`,
`:2590`), so `brain_ledger.jsonl` at `:1603` is the only ROOT read of a gitignored file **by that shape**. A read built
another way (a `STATE` const, an organ's own path) is not covered by this grep — see fork F4.

## Q4 · the code path that makes the run a function of the tree

**The law:** a hermetic run reads nothing it did not plant, and every file it writes lives under its own temp dir.

| # | file (owner) | change | why |
|---|---|---|---|
| T1 | `scripts/sandbox.mjs` (sole owner of its sandbox) · `buildSandbox` `:90-94` and env `:114-139` | `mkdirSync(join(root,".tmp"))`; the child env sets `TMPDIR`, `TEMP`, `TMP` to it | the preload's `TMP` (`audit_preload.mjs:91`) becomes the sandbox's own; `:131` can no longer cover the real tree |
| T2 | `scripts/organism_test.mjs` `run()` `:53-56` | one `mkdtempSync(join(tmpdir(),"organism-run-"))` per process, removed on `exit`; every spawn's env (`opts.env` or `process.env`) gets `TMPDIR`/`TEMP`/`TMP` = it | every child's temp writes live under the run's own dir and vanish with it (Q3 outside list) |
| T3 | `scripts/organism_test.mjs` `:1600` | under the hermetic profile `ledgerLanes` is `null` and the block is printed by name with `liveNamed` ("reads state/brain_ledger.jsonl — gitignored: absent in a fresh tree, born by a run"); the full profile is unchanged | the block's existence stops depending on a gitignored file; it is NAMED, never silently skipped |
| T4 | `scripts/tone.mjs` (sole writer of tone.json, header `:20`; tone.log's only writer `:58`) `writeAtomic` `:43` | a 4th param `logDir = __dirname`; the selftest (`:176`, `:182-183`) passes its own `box` | the selftest writes and reads its failure line under its own temp box; the scheduled path still logs beside the script |

The temp build of exactly T1–T4 (scratch only, a diff of 3 files) measured, 19 Nov 2026:
- fresh clone c3 under `/tmp`, run 1 and run 2: `organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 127` both times;
  verdict lines `cmp` → **byte-equal**; `git status --porcelain --ignored` before = after = `!! node_modules/`;
  nothing new under `/tmp`.
- its only red is the coverage-law red of Q1 (mcov's), identical to the working tree on base; LIVE is 127 = base 126 + T3's one named line.

## WITNESS CLAUSES (each RED on base fb42118, GREEN on the temp build)

The port class (row 1053) holds for every clause: no fixed port, no live service, no POST, no restart; every child
bounded by `run()`'s existing timeout; every plant under the witness's own `mkdtempSync(os.tmpdir())`.

| clause | plant | RED on base (measured 19 Nov 2026) | GREEN on temp build | mutant (one per clause) → expected |
|---|---|---|---|---|
| W1 · the sandbox collar denies the canary for a tree that sits UNDER the temp dir | run `sandbox.mjs selftest` with `TMPDIR`/`TEMP`/`TMP` = an ancestor of ROOT (env door; no tree move) | c2: `11 passed, 4 failed` | c3: `15 passed, 0 failed` | drop T1 → RED (c5, with T2 kept: in-suite `ok`, standalone `exit 1 · …never created`) — which is why W1 must spawn the sandbox with its own env, not ride the suite's T2 | <!-- measured 19 Nov 2026 -->
| W2 · a run leaves the tree as it found it | `git status --porcelain --ignored` before/after the run, in a fresh clone under the temp dir | c1: +`CANARY_MUST_NEVER_EXIST.json`, +`brain_ledger.jsonl`, +`scripts/tone.log` | c3: equal | drop T4 → `scripts/tone.log` appears (base shows it); drop T1 and T2 → the canary file appears |
| W3 · a planted gitignored ledger changes no hermetic verdict line | `organism_test.mjs laws` hermetic, without and with a one-row `brain_ledger.jsonl` planted under a copy's state dir | c2: 74 vs 84 passed | T3: both print the one LIVE line, no ledger assert | drop T3 → 74 vs 84 (base) | <!-- measured 19 Nov 2026 -->
| W4 · nothing a run writes outlives it outside the tree | the whole run with `TMPDIR`/`TEMP`/`TMP` = a fresh witness dir X; after exit X holds nothing | c1: 11 names left in `/tmp` | c3: none | drop T2 → c4: 11 names left (`hippo-*` ×7, `harvest-*`, `harvest-scrub-*`, `mirror-selftest-*`, `pulse-audit-*`) |
| W5 · a fresh clone and its second run give byte-equal verdict lines | fresh clone under the temp dir; `all` twice; `cmp` the `^  (ok  \|FAIL\|LIVE) \|^organism_test:` lines | c1: `differ: char 17687, line 109` | c3: byte-equal | drop T1+T2 (the canary returns) → differ; drop T3 alone does NOT redden W5 (T1/T2 stop the ledger being born) — W3 holds T3 |

W1, W3 are cheap, in-suite candidates (one selftest spawn; one `laws` spawn). W2, W4, W5 need whole runs; see F2.

## FORKS (each the architect's to rule)

- **F1 · where the collar's temp lives.** (A) T1 only — sandbox children get the sandbox's own `.tmp` ·
  (B) also drop the `under(p, TMP)` allowance at `audit_preload.mjs:131` and let every temp write fall under SANDBOX ·
  (C) instead deny the real ROOT by name (a new env `ARSENAL_AUDIT_LIVE_ROOT`) before the TMP allowance.
  **Recommend A**: measured GREEN, smallest, and `:131`'s reason (organs that mkdtemp) still holds — now inside the sandbox.
  Decides it: a trace run (`ARSENAL_AUDIT_TRACE`) of `sandbox.mjs ci` counting writes outside SANDBOX under A.
- **F2 · where W2/W4/W5 run.** (A) a CI step in `suite.yml` that clones fresh into the temp dir and runs `all` twice ·
  (B) a new witness organ with its own selftest · (C) W1/W3 in the suite, W2/W4/W5 as the CI step.
  **Recommend C**: a whole-suite double run cannot live inside the suite it measures. Decides it: the step's wall time
  on the windows runner (two runs measured here took about a minute each on Linux, 19 Nov 2026; Windows NAMED below).
- **F3 · T3's shape.** (A) `liveNamed` one line (measured: LIVE +1) · (B) ten `LIVE_ASSERTS` rows through `skipLive`,
  one per assert name, folded · (C) the hermetic block reads a planted ledger fixture under its own temp dir and runs
  all ten. **Recommend C** long-run (stricter: the ten run on every CI push), **A** for this unit (smallest, measured).
  Decides it: whether a fixture ledger can hold the lanes `:1612`/`:1720` need without reading `brain_config.json`'s live jobs.
- **F4 · the census.** (A) stop at the grep census of Q3 · (B) a build adds a TRACE pass (the preload in trace mode over
  the hermetic window) that names every read of a gitignored path that the run did not plant. **Recommend B** as its own unit.
- **F5 · the outside leaks.** (A) T2 alone (measured: covers all five organs) · (B) also each organ cleans in `finally`.
  **Recommend A** for this unit; B belongs to each organ's owner.
- **F6 · the branch.** The harness opened this session on `claude/mherm-queue-receipt-92g0j8`; the brief names
  `claude/mherm-spec`, cut from `origin/main` fb42118, which carries no settings change. Pushed there per the brief.

## NAMED, NOT GUESSED (laptop measurements)

- Where his scratch clone sat: `node -e "console.log(require('os').tmpdir())"` beside the clone's path; the prediction is
  that the clone is under it. Then the W1 plant on Windows: `set TEMP=<dir not above the clone>` and `set TMP=…`, run
  `node scripts\sandbox.mjs selftest` — prediction `15 passed, 0 failed`. <!-- measured 19 Nov 2026 -->
- Whether `under()` (`audit_preload.mjs:84-88`) matches on Windows when `os.tmpdir()` returns an 8.3 short name
  (`RUNNER~1`) and ROOT a long one: `node -e "console.log(require('os').tmpdir(), process.cwd())"` on the runner and laptop.
- Whether the CI base clone at `$RUNNER_TEMP/b1_base` (`suite.yml:131`) sits under `os.tmpdir()` on windows-latest:
  print both in the workflow. If it does, the base column reds the sandbox for this reason; the head checkout does not.
- The Windows wall time of the double run (F2): a timed `all` ×2 on the runner.
- The check runs of this branch's push are read in the section below; the job logs need a token and were not read.

## FILES A BUILD WOULD TOUCH

`scripts/sandbox.mjs` · `scripts/organism_test.mjs` · `scripts/tone.mjs` · (F2 A/C) `.github/workflows/suite.yml`.
Beyond them, as forks: `scripts/audit_preload.mjs` (F1 B/C) · a new witness organ (F2 B) · `hippocampus.mjs`,
`harvest.mjs`, `mirror.mjs`, `pulse.mjs` (F5 B).

## CHECK RUNS OF THIS BRANCH

(filled after the push; see below)
