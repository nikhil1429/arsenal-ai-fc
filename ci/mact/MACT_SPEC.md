# mact — SPEC (cloud spec seat, 19 Nov 2026)

Unit **mact** · forks rows 1120 (2) F-4 (b) / 1123 (1) · branch `claude/mact-spec`, cut from `origin/main` **`224f9b9`**
(`git fetch origin main && git checkout -b claude/mact-spec FETCH_HEAD`, 19 Nov 2026 UTC). Subject: the `acts selftest`
flake the mrf spec met under load (`git show 13d2728:ci/mrf/MRF_SPEC.md`, §6 and fork F-4).
This seat builds nothing. Every number below is a measurement this seat made on 19 Nov 2026, with the command named;
each has its row in `ci/mact/LEDGER.jsonl`. The measurement scripts live in the seat's scratchpad; their bodies are in §9.

Load ×6 complete (19 Nov 2026). No CHECKPOINT open.

## 0. HEADLINE

**The flake is not load. It is an id collision, and it is in the code.** `newId` (`scripts/acts.mjs:71`) is
`a` + the clock's ms in base 36 + **one of 1296** random buckets. The selftest hands every `dispatch` the same planted
clock (`acts.mjs:453`, `now: new Date("2026-08-18T20:30:00Z")`), so all 32 ids it mints share one ms and differ only by
that bucket. When two collide, `undo` (`acts.mjs:226`, `rows.find((r) => r.id === id …)`) takes the **first** row with
that id, reverses the wrong act, and up to six asserts go red. In one draw (pair 0–2) the selftest itself throws
(`acts.mjs:499`, `calls[10].argv` on `undefined`) and the member exits with a stack instead of its names — the form the
mrf run and this seat's load probe met inside the suite.

- **Rate, predicted by a forced-pair sweep:** 23 of the 496 collision pairs red the selftest ⇒ **23/1296 ≈ 1.8 % per run**.
- **Rate, measured alone:** **5 red of 300** (serial). **Under load** (three full-profile suites at once, each on its
  own LF tree): **base 41 red of 2239 (1.83 %) · candidate 0 red of 2220**; the suite member itself read FAIL in 1 of 21 full-profile copies (the probe), ok in the 18 of the six rounds.
  Load only adds draws; the rate per run is the same, inside the binomial spread.
- **It reaches the live ledger too:** with the live clock and no `deps.now`, six acts refused at validation in one turn
  (no owner spawn, so no ms passes) mint **two equal ids in 224 of 20000 turns** on base (theory 15/1296 ≈ 1.16 %),
  **0 of 20000** on the candidate. An `undo`, `resolve` or `reroute` of the later act would act on the earlier one.
- **FATE: (b) REPAIR THE CODE** at `acts.mjs:71` (a process-local sequence, one line), **plus (a) one selftest
  hardening** at `acts.mjs:491/497/499` so a red is NAMED, never a TypeError that hides the asserts after it.
  No assert is dropped, no slack is typed: nothing here is a timing.

Why the suite on the neutral machine never saw it: `acts` is a LIVE selftest (`scripts/organism_test.mjs:85`,
"reads state/registry.json, state/captain.json"), so the hermetic profile CI runs never spawns it (`:241`, `:368`).

## 1. Recipe

- **Trees:** `git -c core.autocrlf=false -c core.eol=lf --work-tree=<tmp> checkout 224f9b9 -- .` through a private
  `GIT_INDEX_FILE`, under `os.tmpdir()`, the checkout's `node_modules` (one `npm ci --ignore-scripts`) symlinked in, and
  a `git init` + one commit inside the tree. Every state file any run touched is that tree's own copy under the temp dir.
- **No model call:** a refusing `claude` / `gemini` shim (exit 97) is first on PATH; `ANTHROPIC_API_KEY` and
  `GITHUB_ACTIONS` are deleted from the env.
- **Ports:** the one env door at base, `ARSENAL_SITTING_PORT` (`grep -rhoE "process\.env\.[A-Z_]*PORT[A-Z_]*"
  scripts/*.mjs` = that one name), gets an OS-picked free port per suite copy (listen 0, read, release). No fixed port,
  no live service, nothing POSTed, nothing restarted.
- **The candidate** is the §4 line applied in a second temp tree only. The repo's `scripts/` is untouched.
- **Machine:** Linux container, 4 CPUs (`nproc`), node v22.23.5.

## 2. Measurements (by command, last line)

| Act | Command | Last line |
|---|---|---|
| alone | `node alone.mjs <base tree> 300` | `300 runs, red 5 ms min/med/max 46 223 286` |
| alone reds | the 5 rows of `alone300.jsonl` | `undo(hold)` ×3 · `undo(card)` ×1 · `undo(agenda)` + crash (`Node.js v22.23.5`, 13 ok) ×1 |
| plant, base | `node --import pin_random.mjs scripts/acts.mjs selftest` ×3 (`Math.random = () => 0.5`) | exit 1 ×3, 6 FAIL each |
| plant, candidate | the same in the candidate tree ×3 | `acts selftest: 56 passed, 0 failed` ×3 (19 Nov 2026) |
| pair sweep | `node pairs.mjs <base tree>` | `calls 32 · control acts selftest: 56 passed, 0 failed · pairs 496 · red 23 · crash 1` (19 Nov 2026) |
| live clock, base | `node livems.mjs <base tree> 20000` | `turns 20000 · a turn with two mints in one ms 20000 · a turn with two EQUAL ids 224` |
| live clock, candidate | `node livems.mjs <candidate tree> 20000` | `… a turn with two EQUAL ids 0` |
| load probe | `node load.mjs 1 3 <base> <candidate>` | suite copies: acts member ok · (unread, matcher bug fixed after) · **FAIL** (the crash form; headline `293 passed, 17 failed` vs `294 passed, 16 failed`) · base loop 16 red of 368 · candidate 0 of 367 (19 Nov 2026) |
| load ×6 | `node load.mjs 6 3 <base> <candidate>` then `node analyze.mjs load6x3.jsonl` | `acts-under-load-base: red 41 of 2239 · ms min/med/max 69/338/1036` · `acts-under-load-build: red 0 of 2220 · ms min/med/max 159/342/860` · `suite-full: 18 runs · acts member FAIL 0 · ok 18` · every headline `294 passed, 16 failed` (19 Nov 2026) |
| hermetic (the brief’s measurement) | `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` in a fresh base tree | `organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` and `LIVE selftest acts — not run in the hermetic profile` (19 Nov 2026) |

**Red of total, per assert, by command** (the pair sweep is exact: one forced pair per run; alone and load are draws):

| Assert (`acts.mjs` line) | pair sweep: red pairs of 496 | alone: red of 300 | under load, base: red of 2239 | under load, candidate |
|---|---|---|---|---|
| `undo(card)` `:493` | 7 | 1 | 13 | 0 |
| `undo(agenda)` `:497` | 6 (1 a crash) | 1 (a crash) | 14 | 0 |
| `undo(pref)` `:499` | 5 | 0 | 13 | 0 |
| `stats` `:502` | 4 | 0 | 11 | 0 |
| `boardLine` `:506` | 4 | 0 | 11 | 0 |
| `undo(hold)` `:544` | 13 | 3 | 21 | 0 |
| the other 50 asserts | 0 | 0 | 0 | 0 |

The red pairs (Math.random call index, j–k): `0-1 0-2 1-2 0-7 … 6-7` (7) and `0-13 … 12-13` (13): the note / pref /
agenda mints (calls 0–2) collide with each other, the card mint (call 7) with any earlier one, and the hold mint
(call 13) with any earlier one. A collision whose later id is never undone reds nothing; that is why 473 pairs are green.

## 3. The cause, by file:line at `224f9b9` — each class the brief names, measured

| Class | Verdict | Evidence |
|---|---|---|
| **a clock** | **THE CAUSE, with the random space** | `:71` mints from `now` + 1296 buckets; `:453` plants one `now` for every dispatch; `:182` mints before validation, so a refused act (`:183`) spends no time. The pair plant reds base deterministically. |
| a fixed wait | none | `grep -n "setTimeout\|sleep" scripts/acts.mjs` at the selftest: none; no assert reads elapsed time (`ms` is only `typeof … === "number"`, `:488`). |
| a shared path or lock | none for the red | the selftest's only live read is the `acts.jsonl` stat at the start and end (`HERMETIC`, `:586`); it never red in 2600+ runs. Each copy had its own tree. |
| a port | none | `acts.mjs` binds and dials none (`grep -n "listen\|createServer\|fetch(" scripts/acts.mjs`: none in the selftest path). |
| a process start | none | the selftest spawns no organ (`exec` injected, `:452`); the pin fixture uses `mkdtempSync(tmpdir())` (`:631`). |
| a real race in `acts.mjs` | **yes, the same hole** | live `dispatchAll` (`:200`) of a turn's acts mints in one ms; two equal ids in 1.1 % of six-refused-act turns; `undo :226`, `resolve :250/:253`, `reroute :279/:289` all take the FIRST row with the id. |

Files and owners: `scripts/acts.mjs` is **SOLE WRITER** of `dressing-room/state/acts.jsonl` and `intent_cache.json`
(header `:5-6`). The repair touches only that file; it writes no other organ's state and changes no row's fields.
No reader parses the id's shape (`grep -rnE "\^a\[0-9a-z|newId" scripts hooks`: only `acts.mjs:71/:182`, and siblings
of their own in `claims.mjs:82`, `notes_compiler.mjs:126`, `notes_corrections.mjs:48`).

## 4. The code path proposed

**(b) `scripts/acts.mjs:71`**, the smallest path: one process never mints the same id twice, whatever clock it is handed.

```js
let idSeq = 0;   // mact: a process-local sequence — one process never mints the same id twice, whatever clock it is handed
const newId = (now) => `a${now.getTime().toString(36)}${(idSeq++).toString(36)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, "0")}`;
```

Why it is unique: the ms part has a fixed length for this era, the random part a fixed 2, so the sequence in between is
read back whole; within one process the sequence never repeats. Across processes the random part stays as it was.
Why the code and not the selftest: planting `deps.now` is the organ's own door for a fixture (`:179`), and the live path
mints in one ms as well (§2, live clock). A selftest that only staggered its clock would hide a hole the ledger has.

**(a) the selftest, `acts.mjs:491/:497/:499`:** `calls[8].argv` / `calls[9].argv` / `calls[10].argv` become
`calls[8]?.argv?.…` (optional chaining, the same expression otherwise), so a wrong-row undo is a named FAIL and every assert
after it still runs. No assert changes its condition; none is removed.

## 5. The witness (`ci/mact/witness_mact.mjs`, a build seat writes it; this seat writes no code)

Runs from a copy of `ci/mact` under the temp dir: `node witness_mact.mjs --org <LF tree>`. Every state under
`os.tmpdir()`, no port, no model call, every child spawn bounded by the runner's own default.

| Clause | Plant | RED on base `224f9b9` (measured) | GREEN on the build (measured on the candidate tree) |
|---|---|---|---|
| **W1 · unique under a planted clock** | `Math.random` pinned (`pin_random.mjs`), one fixed `deps.now`, 32 `dispatch` calls with an injected `exec`/`append` | all 32 ids equal (plant: 6 FAIL) | 32 distinct |
| **W2 · unique under the live clock** | no `deps.now`; `dispatchAll` of 6 validation-refused acts, 20000 turns, `append` injected | 224 turns with equal ids | 0 |
| **W3 · the selftest under every forced pair** | `pair_random.mjs` over all 496 pairs | 23 red | 0 red |
| **W4 · a red is named, never a throw** | the build tree with `:71` reverted (mutant M1) + pair 0–2 | `TypeError … reading 'argv'`, no `acts selftest:` line | last line `acts selftest: N passed, M failed`, M ≥ 1, no `Node.js v` |

Last line: `GREEN MACT · W1 W2 W3 W4` or `RED MACT · <clauses>`.

**Mutants, one per clause** (`ci/mact/run_mutants_mact.mjs`; each must turn its clause RED on the build tree):

| Mutant | Edit | Clause it kills |
|---|---|---|
| M1 | `:71` `(idSeq++)` → `(idSeq)` (never advances) | W1 |
| M2 | the sequence is advanced only on the owner path (after `:183`'s refusal return), refused acts mint without it | W2 |
| M3 | the sequence is a local inside `newId` (`let s = 0; … (s++)`) — resets each call | W3 |
| M4 | `:499` back to `calls[10].argv` (the guard removed), with M1 applied for the collision | W4 |

## 6. FORKS (for the architect)

**F-1 · the fate.**
- (a) Selftest only: stagger `deps.now` per dispatch (`:453`). Kills the flake; leaves the live hole of §2.
- (b) Code only: `:71`'s sequence. Kills the flake and the live hole; a future red still crashes the selftest at `:499`.
- (c) Both: `:71` + the optional-chaining guard at `:491/:497/:499`.
- **Recommendation: (c).** Deciding measurement: W2 (live clock) — (a) reads 224 of 20000, (b) and (c) read 0; W4 — only (c) reads a named red.

**F-2 · the id's form.**
- (a) Sequence between ms and random (§4). Shape stays `a[0-9a-z]+`, one or two chars longer.
- (b) `randomBytes(3).toString("hex")` suffix, as `notes_compiler.mjs:126` does. Not unique, only rarer (1 in 16.7 M per pair).
- (c) (a) + `undo`/`resolve`/`reroute` refuse an id held by two rows (`:226/:250/:279`, `filter(...).length > 1` ⇒ "ambiguous"), which guards the rows already in his ledger.
- **Recommendation: (a)**, with (c) only if his ledger holds a duplicate. Deciding measurement: on his laptop, `node -e` over `dressing-room/state/acts.jsonl` counting ids held by two rows (§7).

**F-3 · the siblings.** `claims.mjs:82` mints the same shape; no reader looks a claim up by id (`grep -n "\.id ===" scripts/claims.mjs`: none).
- (a) Leave it (no consumer to hurt). (b) The same one-line repair in a later unit.
- **Recommendation: (a)**, named. Deciding measurement: `grep -rn "find((r) => r.id ===" scripts/` over claims' readers at build time.

**F-4 · `acts` stays LIVE in the hermetic profile** (`organism_test.mjs:85`), so CI cannot see this class.
- (a) Leave it; the witness carries the proof. (b) A later unit makes the selftest hermetic (its `registry.json` / `captain.json` reads planted) so CI runs it.
- **Recommendation: (b)** as its own row, not inside mact. Deciding measurement: `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` printing `LIVE selftest acts` before, an `ok SUITE MEMBER · acts` after.

**F-5 · the mrf §6 note "6 of 6".** At `224f9b9` (19 Nov 2026) the selftest reads `56 passed` (`alone.mjs`, 300 of 300 runs that finished print 56 asserts). The mrf figure is a miscount or another invocation.
- (a) Leave mrf's text (a record). (b) Correct it in mrf's PROOF when mrf builds.
- **Recommendation: (b).** Deciding measurement: `node scripts/acts.mjs selftest | tail -1` at `b1fc984`.

## 7. NAMED NOT GUESSED (what the cloud cannot reach)

- **Duplicate ids already in his ledger:** `dressing-room/state/acts.jsonl` is gitignored (`acts.mjs:5`) and on his laptop
  only. Measure: `node -e "const m={};for(const l of require('fs').readFileSync('dressing-room/state/acts.jsonl','utf8').split('\n'))if(l)try{const r=JSON.parse(l);m[r.id]=(m[r.id]||0)+1}catch{};console.log(Object.values(m).filter(n=>n>1).length)"`
  — the count only, never a row. Any non-zero decides F-2 (c).
- **The rate on Windows / node 24:** the model predicts the same 23/1296; measure with `alone.mjs <tree> 300` there.
- **Whether a live turn ever carried two acts minted in one ms:** needs his ledger's `ts` values (same command, counting equal `ts` among adjacent rows).
- **The 3 hermetic reds in this seat’s tree** (the coverage law and `sandbox` `ERR_FS_EISDIR`, 19 Nov 2026) are not acts; the neutral machine read `109a5d0` green, so they are this seat’s tree recipe (the `node_modules` symlink or the `git init` inside the tree), named, not chased. Measure: the same command in a real clone on his laptop.
- **The full-suite count of this seat's 18 copies** was measured on Linux only; mrf's 2 of 38 was the same machine class.

## 8. The files a build would touch

- `scripts/acts.mjs:71` (the sequence) · `:491`, `:497`, `:499` (the guard).
- `ci/mact/`: `witness_mact.mjs`, `run_mutants_mact.mjs`, `pin_random.mjs`, `pair_random.mjs`, `BASE` (`224f9b9`), `PROOF.md`, `LEDGER.jsonl`.
- **Beyond them, as forks:** `acts.mjs:226/:250/:279` (only under F-2 (c)) · `claims.mjs:82` (only under F-3 (b)) ·
  `organism_test.mjs:85` (only under F-4 (b)).

## 9. The measurement scripts (scratchpad, bodies verbatim in the build's `ci/mact/`)

`lftree.mjs` (LF trees) · `shimenv.mjs` (refusing shims) · `alone.mjs` (serial repetition) · `pin_random.mjs`
(`Math.random = () => 0.5`) · `pair_random.mjs` (call k returns call j's bucket) · `pairs.mjs` (the 496-pair sweep) ·
`livems.mjs` (live clock, refused acts) · `load.mjs` (N rounds × 3 full-profile suites, acts looping in base and
candidate meanwhile) · `analyze.mjs`. Each is ≤ 25 lines; the build seat copies them in under §8.

## 10. The neutral machine (suite workflow on this branch's pushes)

Read with `curl -sS https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` (public, no token):

| Push | Run | Check runs | Verdict |
|---|---|---|---|
| `815ba77` (skeleton) | `44440129054` | node 22 `135278602224` · node 24 `135278601848` | cancelled · cancelled (superseded by the next push) |
| `109a5d0` (ledger) | `44440449965` | node 22 `135279758446` · node 24 `135279758152` | success · success |
| `0c30cbb` (ledger) | `44441614371` | node 22 `135283563877` · node 24 `135283564134` | cancelled · cancelled (superseded) |
| `a15c1a9` (spec draft) | `44441932617` | node 22 `135284653815` · node 24 `135284654501` | (in progress at the next push; read in the final message) |
