# mrf — PROOF (cloud build seat, 19 Nov 2026)

Unit **mrf** · forks rows 1107 (2) / 1119 / 1120 · branch `claude/mrf-build`, cut from **`52b51c1`** (the ms1 tip the
architect re-ran GREEN, row 1119 (1)): `git fetch origin claude/ms1-build && git checkout -b claude/mrf-build 52b51c1`,
19 Nov 2026 UTC. `ci/mrf/BASE` = `52b51c194c47fee16bf1b10b30d98e45915b190f`. Spec: `ci/mrf/MRF_SPEC.md` on
`claude/mrf-spec` at `13d2728`. Every act is a row of `ci/mrf/LEDGER.jsonl`.

## 0. THE RULING APPLIED (row 1120 (2))

| Fork | Ruled | What this build did | Where |
|---|---|---|---|
| F-1 | **C monotone** | mf2's F2 and F4 re-cut: no base member vanishes or goes ok → FAIL; additions and FAIL → ok are NAMED, never red. The rule lives in a sibling, `ci/mf2/monotone.mjs`, which both clauses call | `ci/mf2/witness_mf2.mjs` F2 / F4 and header · `ci/mf2/monotone.mjs` |
| F-2 | **(a)** the suite's matcher follows mday's line | A2 now reads `/^sitting: (?:OPEN\|JOINED) \S+ .* · door local$/m`, plus its never-a-daemon guard. The assert NAME is unchanged. `sitting.mjs` is byte-identical | `scripts/organism_test.mjs` A2 (in `path()`) |
| F-3 | **(b)** the typed port leaves | A2's `ARSENAL_SITTING_PORT` is OS-picked: a child binds 0, prints the port and releases it. The child rides `run()`'s own bound | same block |
| F-5 | **(a)** build on top of `claude/ms1-build` | cut from `52b51c1`; no other merge of ms1 and no other repair unit | — |
| F-4 | (b), unit mact, later, not this seat | not touched | — |
| row 1120 (4) | own known-red entry out, in the same diff | the KNOWN_RED entry `WITNESS ‹mf2› · GREEN at head against its BASE` (detail `red beyond BOUND: F2 F4`, owner unit mrf) is removed. Its record moved to the RETIRED ENTRIES comment (L9). mf2's two clauses are re-cut, naming unit mrf and row 1120, with each old text kept struck (`~~…~~`) in the header | `scripts/organism_test.mjs` KNOWN_RED · `ci/mf2/witness_mf2.mjs:11-22` |

**Where the spec and the ruling or brief differ (the ruling wins):**
- **BASE.** Spec §7 says BASE = `a18c167`. The brief says the sha I cut from, so `ci/mrf/BASE` = `52b51c1`.
- **The clauses F2R / F4R / F1-KEEP of spec §7 are not run inside `witness_mrf.mjs`.** The ms1 member already runs mf2's
  own witness at head against `15edfec` on every neutral run. Running it again inside mrf would add two full mf2 legs. The
  measured neutral cost (`ci/ms1/PROOF.md` §5.3, push `f98e914`) is 586.9 to 682.7 s per leg, against the job's own bound
  (`timeout-minutes` in `.github/workflows/suite.yml`). In their place, **MONO** plants the rule six ways and checks that F2
  and F4 both judge by it. The real run is measured by the member's recipe in §3. Named as fork Q-1.
- **Spec §1 recipe vs the trees here:** the same LF recipe (`core.autocrlf=false`, `core.eol=lf`, a private
  `GIT_INDEX_FILE`, under `os.tmpdir()`, `node_modules` linked).

**THE MERGE RULE, measured, not acted on (fork Q-2).** `scripts/organism_test.mjs` differs between `52b51c1` and
`origin/main` (`224f9b9`, fetched 19 Nov 2026). The whole difference is ms1's own edits: `git diff --stat 95b07a6 origin/main`
(95b07a6 = `git merge-base 52b51c1 origin/main`) names only CLAUDE.md, captains_call, cortex, keeper, services and thalamus.
So main's blob of the file equals the merge base's blob, and a merge would bring **nothing** to it. It would bring five other
files of three other repair units (mport, mjd7, mtxt) into this diff, against BOUND and "do not merge any other repair
unit". **No merge was made.** The ms1 land branch assembles main anyway.

## 1. The witness, both ways (LF trees under `os.tmpdir()`, 19 Nov 2026)

`node ci/mrf/witness_mrf.mjs --org <tree> --base-org <LF 52b51c1>`:

```
--org <the build>     GREEN MRF mf2 re-judged monotone and A2 following mday's line · 9 clause(s)        (exit 0)
--org <LF 52b51c1>    RED MRF · A2.1 LINE, A2.2 BITES, A2.3 SHAPE, A2.4 PORT, MONO, RECUT, KR, BOUND     (exit 1)
```

LAST is GREEN on the base by its nature (no process survives either run). Its mutant below plants a surviving child, and
that turns it RED. A build run took 15.5 s on Linux (19 Nov 2026).

## 2. The mutants (`ci/mrf/run_mutants_mrf.mjs`, 19 Nov 2026)

```
node ci/mrf/run_mutants_mrf.mjs --org <the build> --base-org <LF 52b51c1>
RED   A2.1 LINE · A2's matcher reverted to /no-spawn/
RED   A2.2 BITES · A2's never-a-daemon guard dropped
RED   A2.3 SHAPE · A2's matcher loosened to any sitting line
RED   A2.4 PORT · a typed ARSENAL_SITTING_PORT digit literal back in the suite (an OS-picked number, bound by nothing)
RED   MONO · monotone.mjs no longer reads ok → FAIL
RED   RECUT · F2's old text no longer struck
RED   KR · the ‹mf2› KNOWN_RED entry put back
RED   BOUND · scripts/sitting.mjs touched
RED   LAST · the witness leaves a node process naming its temp dir
control · GREEN MRF mf2 re-judged monotone and A2 following mday's line · 9 clause(s) (exit 0)
run_mutants: 9 of 9 mutant(s) RED by the clause that names them · control GREEN
```

No node process naming `mrfmut-` survived (`ps -eo args`, after the run, 19 Nov 2026).

## 3. Members touched, before and after

**`WITNESS ‹mf2› · GREEN at head against its BASE`.** This is the member's own recipe by hand (`ci/ms1/PROOF.md` §5.1):
LF trees of head and of `ci/mf2/BASE` (`15edfec`), `node_modules` linked, a refusing shim, every door port OS-picked, and
`ci/mf2` copied into a non-repo cwd. Measured 19 Nov 2026:

```
head 52b51c1 (before)   RED MF2 · F2 F4 BOUND   225.4 s   → the member reads: red beyond BOUND: F2 F4  (ruled by the entry this build removes)
head af85cb8 (after)    RED MF2 · BOUND         223.7 s   → the member reads: GREEN (BOUND ids dropped)
```

After, F2 reads `base hermetic judged 140, build 146 · vanished none · ok→FAIL none · added (named, never red) 6`. F4
reads `full profile: base 304 member(s), build 310 · vanished none · ok→FAIL none · added 6`, and the six are spec §4's
names, each `ok`. F1 (49 sites) and F3 (LIVE 126 = 126) are GREEN both times. Counts measured 19 Nov 2026.

**A2, its full-profile line by command (row 1120 (3)).** `node scripts/organism_test.mjs path` in an LF tree, 19 Nov 2026:

```
52b51c1 (before)   FAIL A2 · `sitting.mjs open --no-spawn` on a box with no daemon exits 0, says so in one line, and spawns no child
                   organism_test: 43 passed, 1 failed · ruled 0 · UNRULED 1
build   (after)    ok   A2 · `sitting.mjs open --no-spawn` on a box with no daemon exits 0, says so in one line, and spawns no child
                   organism_test: 44 passed, 0 failed · ruled 0 · UNRULED 0      (the same with CLAUDE_CODE_SESSION_ID unset)
```

In the full `all` profile against `15edfec` (the mf2 F4 run above, after), no base member moves ok → FAIL, so A2 at the
build reads as it did at `15edfec` (ok).

**`WITNESS ‹mrf› · GREEN at head against its BASE`** is a NEW member: `ci/mrf/BASE` makes the ms1 member judge it. At
this branch's tip against `52b51c1`, only the named files differ, so BOUND itself is GREEN.

**Touched selftests.** No organ's selftest is touched. The suite itself, hermetic, in LF trees with `GITHUB_ACTIONS`
unset, 19 Nov 2026:

```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
LF 52b51c1   organism_test: 141 passed, 5 failed · ruled 0 · UNRULED 5 · LIVE 126 (hermetic: named, not run)
LF 0399b73   organism_test: 141 passed, 5 failed · ruled 0 · UNRULED 5 · LIVE 126 (hermetic: named, not run)
```

The member lines are identical (folded, sorted). The same 5 reds sit on both trees, and they come from the tree having
no `.git`: coverage, LOAD ZERO BLOCK 7 with 0 files scanned, the gitignore check, the sandbox selftest, and the chain
total. They are not this unit's.

```
node scripts/models.mjs check     exit 0   (19 Nov 2026)
```

## 4. BOUND (19 Nov 2026)

`git diff --stat 52b51c1 HEAD` names only `scripts/organism_test.mjs`, `ci/mf2/witness_mf2.mjs`, `ci/mf2/monotone.mjs`
and `ci/mrf/*`. `.claude/settings.json` is not touched (it is not on this branch's history).

## 5. The neutral machine (suite workflow, read by `curl -sS https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`, no token)

| Push | Run | node 22 | node 24 |
|---|---|---|---|
| `af85cb8` | `44439321751` | `135275928383` cancelled (superseded) | `135275928156` cancelled |
| `f1b44b8` | `44439769397` | `135277486788` cancelled (superseded) | `135277486480` cancelled |
| `0399b73` | `44439996605` | `135278240336` (in progress at the next push) | `135278240672` |

The last push's verdict is in the ledger's last `ci-read` row and in the final message.

## 6. FORKS and open questions (for the architect)

- **Q-1 · mf2's real run is not inside mrf's witness.** The member judges it, at cost per leg (§0). If the architect wants
  F2R / F4R inside `witness_mrf.mjs` as well, that costs two mf2 legs per neutral run within the same job bound.
- **Q-2 · the merge rule read literally.** The file differs from main only by ms1's own edits, so no merge was made (§0).
  If the rule means "always merge main", the merge brings three other units' files into this diff.
- **Q-3 · A2 inherits the caller's `CLAUDE_CODE_SESSION_ID`** (`...process.env`). Here a real id reads `host <id> ·
  door local` and A2 is ok. The spec's §9 planted malformed id took `open failed — host needs --session` with exit 0,
  which the new matcher reads FAIL. Whether to strip the id from A2's env is not ruled. Not done.
- **Q-4 · F4 no longer compares the full headline and exit.** Under C, both are named in the line, not compared. An
  ADDED member that is FAIL is named, never red (the spec's form C, as ruled). It is a NEW red that only the full profile
  sees: unit mlaw's class (row 1120 (3)).
