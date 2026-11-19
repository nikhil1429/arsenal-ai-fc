# mrf — SPEC (cloud spec seat, 19 Nov 2026)

Unit **mrf** · forks rows 1107 (2) / 1108 / 1109 · branch `claude/mrf-spec`, cut from `origin/main` **`a18c167`**
(`git fetch origin main && git checkout -b claude/mrf-spec FETCH_HEAD`, 19 Nov 2026 UTC).
Subject: unit mf2's landed witness, `ci/mf2/witness_mf2.mjs`, reads RED at head on clauses **F2** and **F4**.
The witness lives on `claude/ms1-build`. The brief names `3966f61`, and its newest tip is `3981f36`.
`git diff 3966f61 3981f36 -- ci/mf2` is **empty**, so both tips carry the same bytes (`ci/mf2/BASE` = `15edfec`).
This seat builds nothing. Every number below is a measurement this seat made on 19 Nov 2026, with the command named.
Each measurement's row is in `ci/mrf/LEDGER.jsonl`.

## 0. HEADLINE

| Clause | First red on first-parent main | Its unit · ruling row | What moved | FATE |
|---|---|---|---|---|
| **F2** | **`d0c8f06`** | **mdn2** · rows 1065 / 1079 (commit). The code cites row 1051 (4), `organism_test.mjs:2702` | members **added** only: the three `WHAT IS LEFT` asserts. Then `902b6cc` mpool (row 1099) +2 and `a18c167` mfac (row 1103) +1. No base member's verdict moved | **(a) RE-BASE** |
| **F4** | **`9f6f9ab`** | **mday** · rows 1075 / 1078 (commit), F10 A rows 1044 / 1050 (`sitting.mjs:28`) | a base member's verdict **moved ok → FAIL**: `A2 · sitting.mjs open --no-spawn …` (`organism_test.mjs:2452-2453`). The same six additions as F2 come after | **(b) REPAIR** the A2 matcher, **and** (a) re-base the six additions (fork F-2) |

F4 is the clause ms1's proof described as "its first difference a sitting assert". It is a **real red in the full profile
on main since mday**. The neutral machine cannot see it, because the suite workflow runs the hermetic profile only, and A2
sits in `path()`, a LIVE mode (`organism_test.mjs:209-210`). mday changed what `open --no-spawn` prints on purpose, and its
proof (`ci/mday/PROOF.md:14,45`) never names the suite assert that reads that line.

## 1. Recipe and cost per leg

- **Trees:** the ms1 member's own recipe (`lfTree`, `ot_ms1.mjs:2808`): `git -c core.autocrlf=false -c core.eol=lf
  --work-tree=<tmp> checkout <sha> -- .` through a private `GIT_INDEX_FILE`, under `os.tmpdir()`, with the repo's
  `node_modules` symlinked in. `npm ci` ran once in the checkout. `git diff 15edfec a18c167 -- package-lock.json` is
  empty, so one install serves both trees exactly.
- **No model call:** a refusing `claude` / `gemini` shim is first on PATH, and the witness plants its own as well.
  `ANTHROPIC_API_KEY` and `GITHUB_ACTIONS` are deleted from the env.
- **Doors:** every `export const *PORT` with an env door gets an OS-picked free port (listen 0, read, release), the
  ms1 member's F5 B recipe. At head these are `ARSENAL_JUDGE_PORT` and `ARSENAL_SITTING_PORT`. No fixed port, no live
  service.
- **Scripts:** scratchpad `measure.mjs` (one witness invocation per pair) · `dump.mjs` (per commit: the suite once per
  profile, members read with the witness's own regexes and `fold`) · `analyze.mjs` (F2 / F4 recomputed offline from
  the dumps, plus an LCS diff of the full sequence) · `a2.mjs` (A2's own command) · `selfrel.mjs` (fork F-1 (B)). Their
  bodies are named in the ledger.
- **Cost, Linux container, node v22, three runs side by side:** one witness invocation (four suite runs) took
  **199.6–221.6 s**. One suite run of one tree took **22.5–26.5 s** in the hermetic profile and **77.2–84.1 s** in the
  full profile. On the neutral machine, ms1's PROOF §5.3 (`ci/ms1/PROOF.md:150` on `claude/ms1-build`) measured mf2 at
  586.9 s (node 22) and 682.7 s (node 24) per leg.

## 2. Reproduction (the witness's last line, by command)

`node measure.mjs origin/claude/ms1-build out 3 <org>:<base>` is `node ci/mf2/witness_mf2.mjs --org <LF tree org>
--base-org <LF tree base>` run from a copy of `ci/mf2` under the temp dir.

| Leg | Last line | Seconds |
|---|---|---|
| head `a18c167` vs BASE `15edfec` | **`RED MF2 · F2 F4 BOUND`** | 204.7 |
| BASE `15edfec` vs itself | `RED MF2 · F1` (the BASE red mf2's spec names) | 199.6 |
| mf2's land `7fde711` vs BASE | `RED MF2 · BOUND` (F1–F4 GREEN; BOUND because mgrd + mjd5 + mlv0's blobs sit between) | 199.9 |

At head (19 Nov 2026), F2 reads `base hermetic judged 140, build 146 · verdict moved or absent: none`. F4 reads `base
304 member(s), build 310 · first difference at 133`: the MPOOL assert. Its headline went from `284 passed, 20 failed` to
`289 passed, 21 failed`. F1 and F3 are GREEN at head: 49 LIVE call sites planted, no hermetic marker, LIVE 126 = 126.
**mf2's own property still holds at head.** Only the two clauses that compare whole member lists are red.

## 3. The bisect: every first-parent commit `7fde711 … a18c167`

Commits before `7fde711` do not carry mf2's change (F1 is RED there by design), so the search runs from the land commit
to head. Every commit was measured. That costs more than a bisect, but it gives the exact first red of each clause
separately. Command: `node dump.mjs dump 3 15edfec $(git rev-list --first-parent --reverse 7fde711^..origin/main)`, then
`node analyze.mjs dump 15edfec <sha…>`. The boundaries were then confirmed with the witness itself, `measure.mjs` → `out2/`.

| Commit | Unit | hermetic members (base 140) | full members (base 304) | F2 | F4 | What moved |
|---|---|---|---|---|---|---|
| `7fde711` | mf2 | 140 | 304 | GREEN | GREEN | — |
| `33d1432` | mland | 140 | 304 | GREEN | GREEN | — |
| `009f52e` | mlv0 | 140 | 304 | GREEN | GREEN | — |
| `669200d` | mlv1 | 140 | 304 | GREEN | GREEN | — |
| `4d166d3` | mdone | 140 | 304 | GREEN | GREEN | — |
| `5e43987` | mlv2 | 140 | 304 | GREEN | *red (flake)* in the dump · GREEN in the witness re-run (`RED MF2 · BOUND`) | `SUITE MEMBER · acts selftest` ok→FAIL once, see §6 |
| `40347a6` | deck rules | 140 | 304 | GREEN | GREEN | — |
| `90f55dd` | mlv3 | 140 | 304 | GREEN | GREEN | — |
| `b1fc984` | mjd6 | 140 | 304 | GREEN | GREEN (dump) · *red (flake)* in the witness | the same acts flake, §6 |
| **`9f6f9ab`** | **mday** | 140 | 304 | GREEN | **RED** | **A2 ok→FAIL** at full index 161, confirmed by the witness: `RED MF2 · F4 BOUND` |
| `cb30003` | mday settings | 140 | 304 | GREEN | RED | A2 (witness: `RED MF2 · F4 BOUND`) |
| **`d0c8f06`** | **mdn2** | **143** | 307 | **RED** | RED | +3 `WHAT IS LEFT` (both profiles); witness: `RED MF2 · F2 F4 BOUND` |
| `7c3c279` | groundsman push | 143 | 307 | RED | RED | — |
| `3e3ce63` | mlj | 143 | 307 | RED | RED | — |
| `54c5dce` | mday2 | 143 | 307 | RED | RED | — |
| `3824171` | mgs | 143 | 307 | RED | RED | — |
| `902b6cc` | mpool | **145** | 309 | RED | RED | +`MPOOL · usage_tap …` (`organism_test.mjs:2233`) · +`SUITE MEMBER · usage_tap` (`package.json:18`) |
| `89d3e1c` | mpool settings | 145 | 309 | RED | RED | — |
| `a18c167` | mfac | **146** | 310 | RED | RED | +`SUITE MEMBER · night` (`package.json:18`) |

The member counts in this table were measured on 19 Nov 2026. Read with the LCS diff at head (`analyze.mjs dump 15edfec
a18c167`), the full sequence is the base's sequence plus **exactly six insertions**, plus **one verdict move (A2)**.
Nothing was removed or renamed, and no other base member's verdict moved.

## 4. Clause F2: fate (a) RE-BASE

**Measured:** F2 first turns red at `d0c8f06` (unit mdn2, rows 1065 / 1079). All six members that only the build judges
were added on purpose by three ruled units. The suite workflow judged each one as it landed, and each is `ok` at head.
`verdict moved or absent: none` holds at every commit in the range.

| Folded member name (the witness's `fold`) | Unit · commit · row | Code |
|---|---|---|
| ``WHAT IS LEFT · done.mjs --hermetic exits # and prints exactly ONE `DONE · ` line`` | mdn2 · `d0c8f06` · 1065 / 1079 (code: 1051 (4)) | `organism_test.mjs:2715-2716` |
| `WHAT IS LEFT · the hermetic form reads no live state: reach and the three laptop rule sets say LIVE` | mdn2 · `d0c8f06` | `:2717-2718` |
| `WHAT IS LEFT · every laws/*.yml rule is planted BOTH ways (a RED and a CLEAN plant in lawpack.mjs)` | mdn2 · `d0c8f06` | `:2720-2721` |
| `MPOOL · usage_tap selftest runs in the hermetic chain and exits # (forks row #)` | mpool · `902b6cc` · 1099 (code: 1062 / 1066) | `:2228-2235` |
| `SUITE MEMBER · usage_tap selftest exits #` | mpool · `902b6cc` · 1099 | `package.json:18` → `suites()` `:383` |
| `SUITE MEMBER · night selftest exits #` | mfac · `a18c167` · 1103 | `package.json:18` → `:383` |

**Why the clause will keep turning red:** `SUITE MEMBER · <m>` is data-driven from `package.json` (`suites()`,
`organism_test.mjs:364-383`). F2 as written, `bh.members.length === oh.members.length` with an empty `added`
(`witness_mf2.mjs:84-91`), therefore turns red on **every** later unit that adds an organ to a suite. That happened 3
times in the 12 units since mf2 (measured 19 Nov 2026). mf2's property is "a LIVE assert is not executed in the hermetic
profile, and nothing else moves". It does not say "the suite never grows".

**The exact new expectation:** fork F-1 picks the form, and §7 holds each one with its witness clauses and mutants. At
head under each form:
- F-1 (A), the allow-list: base hermetic members ∪ ADDED (the six names above, with their verdict `ok`) = build hermetic
  members, as a set of (verdict, name), and no base member's verdict moves.
- F-1 (B), self-relative: the build's hermetic run equals the same tree's run with `skipLive` neutralised, as a set.
  Measured at head: 146 = 146, and nothing is only in one.
- F-1 (C), monotone: no base member vanishes or goes ok → FAIL. Additions, and FAIL → ok, are NAMED in the clause line
  and never red. At head: 0 moved, 6 added.

**Files and owners (head `a18c167`):** `ci/mf2/witness_mf2.mjs:84-91` on `claude/ms1-build` (the witness has no
state-file writer, and its trees sit under the temp dir). It reads `scripts/organism_test.mjs`, whose header is
`READ-ONLY on dressing-room/state`, and writes into it only inside its temp copy (the plant). No state file is touched.

## 5. Clause F4: fate (b) REPAIR (A2), plus the F2 re-base for its six additions

**Measured:** F4 first turns red at `9f6f9ab` (unit mday, rows 1075 / 1078). Its first difference is index 161, where
`ok A# · sitting.mjs open --no-spawn on a box with no daemon exits #, says so in one line, and spawns no child` became
`FAIL`. Driven by its own command (`a2.mjs`: A2's call in an LF tree under the temp dir, state planted there, an
OS-picked port):

| Commit | harness session id | exit | `/no-spawn/` in the output | A2 |
|---|---|---|---|---|
| `b1fc984` (before mday) | absent / planted | 0 / 0 | true / true | ok / ok |
| `9f6f9ab` (mday) | absent | 0 | **false** | **FAIL** |
| `a18c167` (head) | absent | 0 | **false** | **FAIL** |

So A2 fails on **every** machine, with or without a harness id. At head its stdout is exactly ONE line: `sitting: OPEN
<id> · … · host NOT BOUND (no hook stamp and no harness id) — … · door local`. Exit is 0, no daemon was started, and the
stderr carries the open's own log line.

**The regressing line:** `scripts/organism_test.mjs:2453`, the matcher `/no-spawn/.test(ns.out)`. It matched the words of
the line `sitting.mjs` printed before mday. mday froze that line in a comment (`sitting.mjs:1436-1439`) and replaced it
with `openLocal` + `openLine` (`sitting.mjs:1440-1442`, `:1361`, `:1380`). That change was ruled (F10 A, rows 1044 /
1050). Its own comment keeps A2's three claims: *"the same open(), still no child spawned, still exit 0"*. Nothing in
mday's ruling asked for the suite's A2 to go red, and mday's proof never measured it, so **main regressed**.

**The smallest repair, without undoing mday** (fork F-2 picks the side): `scripts/organism_test.mjs:2453` becomes

    ns.code === 0 && /^sitting: (?:OPEN|JOINED) \S+ .* · door local$/m.test(ns.out) && !/could not start the daemon/.test(ns.out)

This is the shape `openLine` prints for a local-door open (`sitting.mjs:1384`), plus A2's own never-a-daemon guard. The
assert's NAME is unchanged, so its key, and mf2's F4 sequence, keep their place. `sitting.mjs` stays byte-identical, so
the line stays mday's. Expected after the repair, at head (measured 19 Nov 2026 before the repair, so a prediction): F4's
moved list becomes empty, and the full headline becomes `290 passed, 20 failed` (the base's `284 passed, 20 failed` plus
the six added members, all ok).

**Then F4's six additions** are F2's six names, the same rows (§4), re-based by the same form as F2 (fork F-1). Under (A)
and (C), the build's full sequence with those six names removed equals the base's sequence member for member (verdict,
name). Under (B), the build's full run equals its neutralised run: measured at head, 310 = 310, first difference none,
`289 passed, 21 failed` on both (19 Nov 2026).

**Files and owners (head `a18c167`):** `scripts/organism_test.mjs:2450-2453` (A2, inside `path()` `:2302`, whose
sandbox is `sandbox()` under the temp dir). `scripts/sitting.mjs` is the **SOLE WRITER** of `sitting.json`
(`sitting.mjs:14`). A2 drives it only through its CLI (`open --no-spawn`) with `ARSENAL_SITTING_STATE_DIR` set to the
sandbox, so no other organ writes its file. `ci/mf2/witness_mf2.mjs:99-106` (F4).

## 6. The flake this measurement met (not a clause, named)

`SUITE MEMBER · acts selftest exits #` went ok → FAIL in **2** of the 38 full-profile suite runs this seat made
(19 Nov 2026): the `5e43987` dump, and the build leg of the `b1fc984` witness run. Both ran three or four at once. A third
run, the BASE leg of the `d0c8f06` witness run, read one more FAIL than the base. The witness prints no member lines, so
that member is unnamed: acts is the candidate, not a proof. `git log 15edfec..a18c167 -- scripts/acts.mjs` is empty.
`node scripts/acts.mjs selftest` in an LF tree of `b1fc984` passed **6 of 6** alone, and the `5e43987` witness re-run
read F4 GREEN. The flake is load-dependent and belongs to no commit in the range. Under every F-1 form it would read as a
base member going ok → FAIL, which is a true red for that run. See fork F-4.

## 7. The proposed witness: `ci/mrf/witness_mrf.mjs` (a build seat writes it; this seat writes no code)

CONTRACT: `node ci/mrf/witness_mrf.mjs --org <tree> --base-org <tree>`, BASE = `a18c167` (head at this spec; the base
of the repair). Trees are copied under `os.tmpdir()`, and a refusing model shim is first on PATH. The last line is
`GREEN MRF … · <n> clause(s)` or `RED MRF · <ids>`.

| Clause | Plant | RED on BASE `a18c167` | GREEN on the build |
|---|---|---|---|
| **A2.1 LINE** | `node scripts/organism_test.mjs path` (full profile) on each tree; read A2's verdict line | `FAIL A2 · …` | `ok A2 · …` |
| **A2.2 BITES** | in a copy of the build, `sitting.mjs`'s `--no-spawn` branch planted to print `could not start the daemon` beside the open line | — (BASE is already red) | A2 `FAIL` (the guard still bites) |
| **A2.3 SHAPE** | in a copy of the build, `openLine`'s ` · door local` suffix planted away | — | A2 `FAIL` (the matcher reads the local door, not any line) |
| **F2R** | the re-based F2 (per F-1) run by mf2's witness itself, `--org <build> --base-org 15edfec` | `RED MF2 · F2 …` | F2 GREEN, naming the six added members |
| **F4R** | the re-based F4 (per F-1), same run | `RED MF2 · … F4 …` | F4 GREEN |
| **F1-KEEP** | mf2's F1 and F3, untouched | GREEN (measured) | GREEN |
| **BOUND** | outside `ci/`, only `scripts/organism_test.mjs` differs between BASE and build | — | GREEN |
| **LAST** | no node process naming the run's temp dir survives | — | GREEN |

**The mutants, one per clause** (`ci/mrf/run_mutants_mrf.mjs`, each must turn its own clause RED):
- M-A2.1: revert `:2453` to `/no-spawn/` → A2.1 RED.
- M-A2.2: drop `!/could not start the daemon/` → A2.2 RED.
- M-A2.3: loosen the matcher to `/^sitting: /m` → A2.3 RED.
- M-F2R: under (A), drop one ADDED entry; under (B), make `skipLive` skip a name off the LIVE table (drop its `every`
  check, `organism_test.mjs:236`); under (C), plant one base hermetic assert forced false → F2R RED.
- M-F4R: under (A) or (C), plant a base full member renamed; under (B), drop `PROFILE !== "hermetic"` from `skipLive`
  (`:234`), so the full profile skips → F4R RED.
- M-BOUND: touch `scripts/sitting.mjs` in the build tree → BOUND RED.

**The ms1 list moves in the same landing:** the KNOWN_RED entry `WITNESS ‹mf2› · GREEN at head against its BASE` (detail
`red beyond BOUND: F2 F4`, owner unit mrf, `scripts/organism_test.mjs:2912` on `claude/ms1-build` `3981f36`) leaves
the list in the landing that turns the member GREEN. `rulingOf` reads a passed entry as STALE and exits 2
(`ot_ms1.mjs` `rulingOf`).

**THE PORT CLASS (row 1053):** `witness_mrf.mjs` binds no fixed port, names no live service, POSTs nothing at a daemon,
and restarts nothing. A2's call reads `ARSENAL_SITTING_PORT` through its env door. The suite itself types the literal
`"45177"` there (`organism_test.mjs:2451`, nothing listens on it). Whether the repair also moves that literal to an
OS-picked port is fork F-3. Every wait is bounded by the spawn's own `timeout` from the job's `timeout-minutes`, read at
run time from `.github/workflows/suite.yml`, never typed.

## 8. FORKS (for the architect)

**F-1 · the form of the F2 / F4 re-base.**
- (A) Allow-list: an `ADDED` table in `witness_mf2.mjs`, one row per folded name with unit, commit and row. Exact and
  literal, but every later suite addition re-reds mf2 and costs a re-base unit (3 of 12 units since mf2, measured).
- (B) Self-relative: BASE for F2 / F4 = the org tree with `skipLive` neutralised (`return false`, i.e. every LIVE block
  entered, as before mf2). It never re-reds on later additions. Measured at head: hermetic 146 = 146, full 310 = 310,
  first difference none. At `15edfec` there is no `skipLive` to plant, which reads RED, the BASE red. But it is blind to
  A2-like regressions in other organs, by design.
- (C) Monotone against `15edfec`: no base member vanishes or goes ok → FAIL. Additions and FAIL → ok are named, never
  red. Measured over the range: red exactly at `9f6f9ab` (A2) and nowhere else, apart from the §6 flake.
- **Recommendation: (C)**, with the A2 repair landing beside it. Of the three, only (C) would have flagged the one real
  regression in the range and nothing deliberate. Deciding measurement: run each form over the 19 dumps (`analyze.mjs`
  with the form's rule), which this seat already holds; count the commits each would have flagged.

**F-2 · which side repairs A2.**
- (a) The suite's matcher (`organism_test.mjs:2453`), as §5.
- (b) `sitting.mjs`'s local-door line also carries `--no-spawn` (`:1442`). That is a byte change to mday's ruled output.
- **Recommendation: (a).** The ruled behaviour stays mday's, and the assert follows it. Deciding measurement: `node
  scripts/organism_test.mjs path` (full) on his laptop after each option. Both should read A2 `ok`, and (b) also moves
  `sitting.mjs`'s own selftest bytes.

**F-3 · A2's typed port.**
- (a) Leave `"45177"` (`organism_test.mjs:2451`), outside this unit.
- (b) Replace it with an OS-picked port in the same repair.
- **Recommendation: (b)**, as row 1053's class applied to the suite. Deciding measurement: `grep -n '"45177"'
  scripts/organism_test.mjs` = 0 after, and A2 still ok.

**F-4 · the acts flake (§6).**
- (a) Name it and leave it.
- (b) A unit to find its cause under load.
- **Recommendation: (b)**, as its own row, not inside mrf. Deciding measurement: the full suite at `a18c167`, three
  copies at once, repeated until the rate is known.

**F-5 · where the re-based witness lives.** `ci/mf2/` exists only on `claude/ms1-build`, which is not landed.
- (a) mrf builds on top of `claude/ms1-build`.
- (b) mrf waits for ms1 to land.
- (c) mrf's build re-cuts `ci/mf2/witness_mf2.mjs` alone, and ms1 carries it.
- **Recommendation: (a)**: the KNOWN_RED entry it retires is ms1's. Deciding measurement: `git merge-base --is-ancestor
  origin/claude/ms1-build origin/main` at build time.

## 9. NAMED NOT GUESSED (what the cloud cannot reach)

- **A2 on his laptop** (Windows, the organism off, so the daemon is down): `node scripts/organism_test.mjs path` (full
  profile) at head. The prediction is `FAIL A2` with the local-door line, as here.
- **A real harness id on his laptop:** here a planted malformed id made `open --no-spawn` print `open failed — host needs
  --session …` with **exit 0** (`a2.mjs`, planted run). Whether his real session id ever takes that branch: `node
  scripts/sitting.mjs open --surface code --no-spawn` in a sandbox state dir from a Claude Code terminal there.
- **The acts flake on Windows / the neutral machine:** the hermetic run on CI never showed it (`c38cbf0` GREEN). Rate
  under load on his laptop: the F-4 measurement there.
- **The witness's cost on `windows-latest` after the re-base:** measured only by the suite workflow once the build
  pushes (ms1's §5.3 is the before).
- **CRLF:** this seat made LF trees only (`core.autocrlf=false`, `core.eol=lf`). The witness splits on `/\r?\n/`. A
  laptop checkout with `autocrlf=true` would be measured by ms1's W-B1.2.

## 10. The files a build would touch

- `scripts/organism_test.mjs:2453` (F-2 (a)) · `:2451` (only under F-3 (b)) · the ms1 KNOWN_RED entry `:2912` on
  `claude/ms1-build` (removed in the same landing).
- `ci/mf2/witness_mf2.mjs:84-91` (F2) and `:99-106` (F4), per F-1, on `claude/ms1-build`.
- `ci/mrf/`: `witness_mrf.mjs`, `run_mutants_mrf.mjs`, `BASE`, `PROOF.md`, `LEDGER.jsonl`.
- **Beyond them, as forks:** `scripts/sitting.mjs:1442` (only under F-2 (b)).

## 11. The neutral machine (suite workflow on this branch's pushes)

Read with `curl -sS https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` (public, no token):

| Push | Run | Check runs | Verdict |
|---|---|---|---|
| `c38cbf0` (checkpoint) | `44427357827` | `135235536370` node 22 · `135235536788` node 24 | success · success |
| `bf0f06a` (ledger) | `44428227669` | `135238533297` node 22 · `135238533779` node 24 | (read at the next push) |
