# UNIT mdtl · A RED WITNESS LEAVES ITS FAILING CLAUSE READABLE (spec, forks row 1167 (2))

Seat: cloud spec seat, unit mdtl. Branch `claude/mdtl-spec`, cut from origin/main **5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90**
(fetched 2026-11-20). This file is a SPEC. It builds nothing, lands nothing and quotes no state file. Every `file:line` below
is at 5759cce.

## 0 · THE HEADLINE

Today a red witness on the neutral machine shows up only as an assert name. Its cause is computed, but it stays on the runner,
and that is on purpose: the detail line has no safety rule. Measured here (§1 M6), a planted witness that reads a planted
state file gets its canary into the detail through the **clause-id channel** (`red beyond BOUND: P1 P2 Q<CANARY>`). So
"print the detail" is the one shape this spec rules out.

**Proposed (shape A + R2):** a cause may leave the machine only if it is made of bytes that are already public:
- a clause id that is a **literal in the witness's own tracked source**;
- that clause's **one-line claim**, read from the witness's own tracked header;
- the member's own literals, and digit runs.

The cause goes inside the annotations that already exist: the NEW RED message and the B1 VERDICT payload. It adds no new
annotation, no artifact and no log channel. The anonymous reader (`node scripts/ci_verdict.mjs <sha>`) then prints, for
example, `WITNESS ‹mf2› … · F2 · MONOTONE over the hermetic members …`.

## 1 · MEASUREMENTS (each by command, its last line)

| # | Command | Last line (2026-11-20) |
|---|---|---|
| M1 | `git fetch origin main; git rev-parse FETCH_HEAD` | `5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90` |
| M2 | `curl -s $API/commits/1b8c379e65…/check-runs` | `135921298241 npm test · node 24 completed failure` (node 22 leg: 135921298755, failure; workflow run 44626408769) |
| M3 | `curl -s $API/check-runs/135921298755/annotations` (and the same for …241) | `failure \| NEW RED · node 22 1/2 \| GATES — undefined-symbol families 0 on both sides, …` |
| M3b | the same, the mf2 row on both legs | `failure \| NEW RED · node 2x 2/2 \| WITNESS ‹mf2› · GREEN at head against its BASE`. **This is the no-cause red: a name, no clause, no reason.** |
| M4 | `curl -s $API/commits/5759cce…/check-runs` | `135886176499 npm test · node 22 completed success` (and node 24: 135919452846 / 135886177254 success) |
| M5 | `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` (this container, no `npm ci`) | the headline at 2026-11-20 read 141 passed, 4 failed · UNRULED 4 · LIVE 126. The reds are the selftest-coverage law, the fsrs and mutagen members (`ERR_MODULE_NOT_FOUND`: no node_modules here) and the hermetic-members roll-up. `SKIP WITNESSES — … neutral machine only (B2)`. **The container measures nothing about witnesses.** |
| M6 | scratchpad `measure_base.mjs` at 5759cce: a git copy under `os.tmpdir()` with a planted `ci/toy` witness (header claims P1/P2, RED P1 P2 plus an id built from a planted canary). Run with `GITHUB_ACTIONS=true GITHUB_WORKSPACE=<copy> ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs witnesses`, then `ci_verdict.mjs compare` against a planted all-green base | `detail "[{…"red beyond BOUND: P1 P2 Q<CANARY>"}]"`. The lines before it: `leaving lines (suite.yml grep + compare stdout) 13 · naming the canary 0 · naming clause P1 0 · naming P1's claim 0` · `payload has cause false` · `machine line has causes false` |
| M7 | `node scripts/ci_verdict.mjs selftest` | `ALL CHECKS PASSED` |
| M8 | `node scripts/ci_verdict.mjs 1b8c379e65…` (this container) | `ci_verdict 1b8c379 UNREADABLE — GET …/check-runs?per_page=100 answered 403`. curl through the agent proxy answered 200 on the same path. See NAMED NOT GUESSED N3. |
| M9 | `curl -s https://api.github.com/rate_limit` | core `limit 15000`. **The proxy is not anonymous**, so no curl reading here proves anonymous readability (N1, N2). |
| M10 | canon scan replayed over the COMMIT blobs (§9) | `canon_scan <sha> · … md blobs · 1 declared · 0 undeclared` |

So the evidence of row 1171 (5) reproduces from the public API. 1b8c379 shows `WITNESS ‹mf2›` red on both legs with no cause.
The mlv3 red (one in six legs) is the same shape, because it takes the same path (§2 P3).

## 2 · THE PATH A CAUSE TAKES TODAY (file:line at 5759cce)

- **P1 · the witness** prints clause lines (`RED   <ID> · <why>`) and a LAST line `RED <UNIT> · <ids>`. For mf2 see
  `ci/mf2/witness_mf2.mjs:40` (the clause printer) and `:130` (the last line). For mlv3 see `ci/mlv3/witness_mlv3.mjs:55-60`
  (the clause printer; the why can be `threw: <message>`) and `:318-319` (the last line). The why is DYNAMIC. mlv3 copies a
  tree's `dressing-room/state` as bytes (`:76`), so a why can carry state content. Each witness's header states every clause's
  claim as a comment line (mf2 `:9-23`, mlv3 `:13-21`). These lines are tracked, public bytes.
- **P2 · the member** `scripts/organism_test.mjs` (header `:2795`: "Sole writer of nothing"):
  - `judgeLast` `:2840-2851` keeps the ids left after BOUND is dropped (`boundIds` `:2838`);
  - the witness's last line is printed on the runner only (`:2932`);
  - `PORT_HELD` machine lines are promoted to **ok assert names** (`:2937`). These are dynamic runtime bytes that already
    pass the workflow's grep. They hold platform, node version and ms counts only, by the witnesses' own grammar
    (`ci/mlv1/witness_mlv1.mjs:109`). See FORK F5;
  - the judged assert `:2938` has a stable name (KNOWN_RED, row 1107 (1)(c)) and the detail `red beyond BOUND: <ids>`;
  - `assert` `:46-50` prints the detail on the next line, on the runner only;
  - the machine line `:3032-3035` carries `unruled[].detail` and `reds` (names).
- **P3 · the workflow** `.github/workflows/suite.yml`:
  - `:115`: `grep -E "^  (ok  |FAIL|LIVE) |^organism_test:|^── "` lets names out and never the indented detail line;
  - `:39-40` states the rule ("the log carries NAMES only");
  - `:151-156`: compare, and a step summary of the `B1_VERDICT` line.
- **P4 · compare** `scripts/ci_verdict.mjs` (header `:5`: "SOLE WRITER of: NOTHING", `:22`: "never a detail line"):
  - `compareLines` `:93-104` emits NEW RED errors (cap 9 when RED) and BASE RED warnings, then ONE verdict annotation whose
    payload `:98-100` has `new` (names);
  - `annotate` `:81-90` (GitHub renders 10 per level per step, which is why the new reds are capped at 9 and the 10th is the
    verdict);
  - parsing is `parseSuite` `:36-43`.
- **P5 · the reader** `readVerdict` `:130-151` reads only the verdict annotation's payload and prints `new` (`:148`).

No state file is written anywhere on this path, and every organ on it says it writes nothing (`ci_verdict.mjs:5`,
`organism_test.mjs:2795`). The unit touches no state file and no other organ's file.

## 3 · THE CODE PATH PROPOSED (shape A · reason R2 · transport T1, the recommendations of §6)

1. **New `scripts/witness_cause.mjs`.** Header `SOLE WRITER of: NOTHING`; pure exports, no IO except what callers hand it.
   - `ID = /^[A-Z][A-Z0-9-]*$/` (the grammar `boundIds` already assumes).
   - `idsInSource(src)`: every id that appears in the witness source as a clause literal (`clause("<ID>`, `clause('<ID>`,
     `` clause(`<ID> ``) or as a header claim line.
   - `claimOf(src, id)`: the FIRST header comment line, before the first `import`, of the form `//   <ID>` followed by ` · ` or by
     whitespace, then text (all three header shapes measured: mf2 `F2 · …`, mlv3 `T2 ONCE      …`, both `BOUND <text>`).
     Measured limit: mf2's F2 and F4 claim lines open "RE-CUT by unit mrf (…)", so the first line names the re-cut and not
     the claim. See FORK F3. Lines that carry `~~` (struck text, L9) are skipped, and so is a line inside a struck span.
     It returns the line's own text up to its end, which is one line by construction. **No length is typed.**
   - `causesOf({ unit, left, src, memberWhy })` returns one entry per failing clause, `{ id, text }`:
     - an id in `left` that is in `idsInSource(src)` keeps `text = claimOf(src, id)`, or the literal
       `(no header claim for this id in its source)`;
     - any other token becomes ONE entry with id `WITHHELD` and the literal
       `a clause id that is not a literal of the witness's own source was withheld`. The token itself NEVER leaves.
     - The member's own reds are mapped to member literals: `GRAMMAR` → `the LAST line is not the witness grammar`, with the
       exit code's digits; `KILLED` → `killed at the member's bound (suite.yml timeout-minutes)`; `BASE` / `CLONE` / `TREES`
       / `PORT` → the existing literal assert names at `organism_test.mjs:2897-2908`.
   - `causeText(member, c)` = `` `${member} · ${c.id} · ${c.text}` ``.
   - `verifyCause(line, readSrc)` is the second check, made by a different file: the line must parse as
     `WITNESS ‹unit› · … · <ID> · <text>`, and `<text>` must be a member literal or a substring of
     `readSrc(ci/<unit>/witness_<unit>.mjs)`. Otherwise the line is dropped and replaced by the WITHHELD literal.
2. **`scripts/organism_test.mjs` `:2938`.** It also pushes `causesOf(...)` for that member into a module-level `causes[]`.
   **The assert's name and detail stay byte-identical**, so every KNOWN_RED entry (`:2988-2991`) still matches. The machine
   line `:3032-3035` gains `causes: [causeText…]`. Nothing new is printed to the log.
3. **`scripts/ci_verdict.mjs`.**
   - `parseSuite` reads `causes` (an array of strings; absent means `[]`).
   - `compareLines` runs `verifyCause` with `readSrc` = the workspace file. For each NEW red that owns causes, its existing
     NEW RED annotation's message becomes `name` + `%0A` + one `cause · <id> · <text>` line per cause. The verdict payload
     gains `cause: { "<red name>": ["<id> · <text>", …] }`, **only when not empty**, so a GREEN head's output is
     byte-identical to base.
   - **No annotation is added**, so the per-level cap at `:96` is untouched.
   - `readVerdict` `:148` appends ` — cause: <id> · <text> ; …` after each new red that has one.
4. **`.github/workflows/suite.yml`: no change** (transport T1). The `:39-40` comment gains one dated line naming the cause
   channel. That is the only optional edit there (FORK F4).

## 4 · THE WITNESS (ci/mdtl/witness_mdtl.mjs, BASE = 5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90)

The witness runs on `--org` and `--base-org`. Each tree is COPIED under `os.tmpdir()` and turned into a git copy, exactly as
M6 did. The copy's `ci/` holds ONLY the toy witnesses the witness plants. Each copy runs
`node scripts/organism_test.mjs witnesses` with `GITHUB_ACTIONS=true`, `GITHUB_WORKSPACE=<copy>` and
`ORGANISM_TEST_PROFILE=hermetic` planted in the child env only. Then it runs the copy's own `scripts/ci_verdict.mjs compare`
against a planted all-green base output, and the copy's `readVerdict` with a **planted fetch** built from those annotations.
There is no network.

The planted "state file" is written by node under `<tmp>/planted/dressing-room/state/` and holds a random canary. "Leaves the
machine" is measured as the union of three channels:
- the member lines that the `--org` tree's own `suite.yml` grep selects (the regex is read from the file, never typed);
- every line of compare's stdout (the annotations);
- the `^B1_VERDICT ` lines (the step summary).

| Clause | Claim | base 5759cce | build |
|---|---|---|---|
| **D1 CAUSE** | toy A (header `//   P1 · the planted clause claims one thing`, prints `RED TOY · P1`) is red, and its NEW RED annotation **and** the reader line both carry `P1 · the planted clause claims one thing` | RED. Measured by M6: `naming clause P1 0 · naming P1's claim 0` | GREEN |
| **D2 NO-LEAK** | toy B reads the planted state file and prints the canary in its why, on stderr, and as a clause id `Q<CANARY>` that matches the id grammar. The canary appears in **zero** leaving lines, **and** a `WITHHELD · a clause id that is not a literal …` cause IS readable for toy B | RED: the WITHHELD cause is not readable (M6, `payload has cause false`). The canary half reads 0 at base too (M6), so the conjunction is what makes base red | GREEN |
| **D3 RULED** | the judged name and detail of each toy member are byte-identical to the base tree's (`WITNESS ‹toy› · GREEN at head against its BASE`, `red beyond BOUND: P1`), so a KNOWN_RED entry keeps its match | GREEN (guard: it is GREEN on base by design; mutant D3-m is what bites) | GREEN |
| **D4 GREEN-SILENT** | an all-green toy run gives compare output byte-identical between the base's and the build's `ci_verdict.mjs` | GREEN (guard, as D3) | GREEN |
| **D5 SECOND-CHECK** | a head output whose machine line carries a forged `causes` entry whose text is in no source and no literal (planted text) is re-written by compare to WITHHELD. The forged text appears in no leaving line | RED: base compare ignores `causes`, so no WITHHELD cause is readable. The forged-text half reads 0, so the conjunction makes base red | GREEN |
| **BOUND** | outside `ci/`, only `scripts/witness_cause.mjs` (new), `scripts/organism_test.mjs` and `scripts/ci_verdict.mjs` differ (by text, CRLF folded) | RED (the module is absent) | GREEN |
| **LAST** | no node process naming the temp dir survives | GREEN | GREEN |

**THE PORT CLASS (row 1053).**
- No clause binds a port, names a live service or POSTs anywhere.
- The member's own `freePort()` (`organism_test.mjs:2872`) is OS-picked, so it is inside the class.
- The toys bind nothing.
- Every child wait is bounded by the member's own `left` (`:2921`), which is derived from `suite.yml` timeout-minutes. The
  witness's outer wait takes the same derived bound, read from `--org`'s `suite.yml`. **Nothing is typed.**
- There is no `claude` or `gemini` call; the member's refusing shims stand (`:2911-2914`).

### Mutants (one per clause, each must turn its clause RED on the build)

- **D1-m**: `compareLines` drops the `%0A cause` line and the payload `cause` field.
- **D2-m**: `causesOf` accepts any `ID`-grammar token, which removes the `idsInSource` check. The canary then leaves as an id.
- **D3-m**: the member writes the cause into the judged detail (`red beyond BOUND: P1 · <text>`).
- **D4-m**: the payload always carries `cause: {}`.
- **D5-m**: `verifyCause` is reduced to the grammar check only (no source substring).
- **BOUND-m**: `suite.yml`'s grep gains `|^  witness ‹` (a widened log channel), so BOUND reds on the extra file. D2 would
  also red, because the canary rides the witness's last line.
- **LAST-m**: a toy spawns a detached `node -e` that sleeps past its parent.

## 5 · WHAT A BUILD TOUCHES

- `scripts/witness_cause.mjs` (new) · `scripts/organism_test.mjs` (`:2938`, `:3032-3035`) · `scripts/ci_verdict.mjs`
  (`:36-43`, `:93-104`, `:148`, its selftest `:160-217` gains the D1/D2/D5 fixtures) · `ci/mdtl/witness_mdtl.mjs`,
  `ci/mdtl/BASE`.
- The selftest-coverage law (`package.json` `_selftest_coverage_law`, a BASE RED in M3) may want `witness_cause.mjs` wired if
  it gets a selftest mode. That is FORK F6.
- **Beyond these, each a fork:** `.github/workflows/suite.yml` (F4); any landed `ci/<unit>/witness_*.mjs` (F3, the ms1 seat's
  rule (3): no proof text is edited after a green pair); `ci/mlv3` or `ci/mf2` gaining opt-in CAUSE codes (F2 C).

## 6 · FORKS (each for the architect to rule)

- **F1 · where the cause rides.**
  - (A) inside the existing NEW RED message and the verdict payload;
  - (B) an uploaded artifact (`actions/upload-artifact`);
  - (C) the step summary;
  - (D) a widened log grep line.
  **Rec A.** It is the only channel the existing anonymous reader already reads, it adds no annotation and keeps the cap, and
  it needs no workflow edit. B and D depend on reads that may need a token (N1, N2). C has no REST read. *Decides it:* N1/N2
  measured signed-out on his laptop.
- **F2 · what "its own one-line reason" is.**
  - (R1) ids only;
  - (R2) id + the clause's header claim (public bytes, zero witness edits);
  - (R3) the runtime why through a redactor (a deny-list cannot prove it never quotes state; M6 shows the id channel alone
    leaks);
  - (C) R2 plus an opt-in `CAUSE <ID> <CODE>` line, where CODE picks a literal from a `CAUSES` table in the witness source.
  **Rec R2 now and C later, by row.** R3 is refused by M6. *Decides it:* whether "reason" must say WHY it failed (C) or WHAT
  failed (R2).
- **F3 · landed witnesses.** (A) edit none; mf2 and mlv3 get R2 from their existing headers. (B) back-fill CAUSE codes into
  mf2 and mlv3. **Rec A** (row 1167 (3): no proof text edited after a green pair). *Decides it:* §4's claimOf over every
  `ci/*/witness_*.mjs`, counting clause ids with no header claim (a build measures it; see N5).
- **F4 · suite.yml comment.** (A) one dated comment line; (B) untouched. **Rec B.** BOUND stays tighter.
- **F5 · `PORT_HELD` names** (`organism_test.mjs:2937`): runtime bytes already pass the grep today. (A) out of scope here;
  (B) the same literal-of-source law over its fields. **Rec A, with a named row.** Its grammar is numbers and a platform
  token, by the witnesses' own header (`ci/mlv1/witness_mlv1.mjs:30`). *Decides it:* a scan of every PORT_HELD printer.
- **F6 · module selftest.** (A) `witness_cause.mjs` has a `selftest` wired into a suite; (B) it is covered only through
  `ci_verdict.mjs selftest`. **Rec A** (the coverage law). *Decides it:* `package.json` `_selftest_coverage_law` at the
  build's base.
- **F7 · scope.** (A) witness reds only (row 1167 (2) says *witness*); (B) every red, e.g. 1b8c379's `GATES` red, also
  no-cause (M3). **Rec A.** B needs a source-literal law per assert detail, which is its own unit.

## 7 · NAMED NOT GUESSED

- **N1.** Whether a **signed-out** client can read a public repo's job logs. Here `curl …/actions/jobs/135921298755/logs`
  answered 200, but through an authenticating proxy (M9). *Measure on his laptop:* `curl -s -o NUL -w "%{http_code}" <same>`
  with no token.
- **N2.** Whether a signed-out client can download an artifact zip. No artifact exists on run 44626408769 to try. *Measure:*
  any run with an artifact, signed out.
- **N3.** Why the reader (node `fetch`, `ci_verdict.mjs:154-158`) got 403 here while curl got 200 on the same path. Node's
  fetch takes a different proxy road in this container. *Measure:* `node scripts/ci_verdict.mjs 1b8c379e65…` on his laptop.
- **N4.** The neutral machine's per-annotation message size limit, which F1 A's `%0A` lines sit under. It is not published in
  the repo. No size is typed here; a build measures the longest header claim line instead.
- **N5.** How many landed witness clause ids have a header claim line in the form `claimOf` reads. Not counted from the cloud
  here; it is the build's first measurement, by its own `claimOf` over the `--org` tree.
- **N6.** mlv3's red cause on the leg where it failed (one in six legs). The full output stayed on the runner and no channel
  brought it out. That is exactly what this unit fixes; it cannot be recovered.

## 8 · CHECK RUNS OF THIS BRANCH

Pushed 2026-11-20. The check runs of this tip are read through the public API with curl after the push and recorded in
`ci/mdtl/LEDGER.jsonl`. A file cannot carry its own verdict (row 1167 (3)).

## 9 · THE CANON-COUNT REPLAY (row 1169)

Before each push, the LOAD ZERO BLOCK 7 scan (`organism_test.mjs:1898-1917`) is replayed over `git show <sha>:<path>` for every
tracked `.md` of the commit (scratchpad `tools/canon_scan.mjs`). Any undeclared line means no push.
