# UNIT mdtl2 · EVERY NO-CAUSE RED THAT IS NOT A WITNESS RED LEAVES ITS CAUSE, FROM PUBLIC BYTES ONLY (spec, forks rows 1186 (2) F7 A / 1207 (1))

Seat: cloud spec seat, unit mdtl2. Branch `claude/mdtl2-spec`, cut from origin/main **6a6bdfff4349b849398b69d0748b27d37c874b85**
(fetched 2026-11-20). Units mlaw, mcov and mmeter are on it. Unit mdtl is NOT on it: mdtl is read from `claude/mdtl-build`
**a3c544b** (adopted, row 1207 (1)), and its spec from `claude/mdtl-spec` **9d5c9b8**. This file is a SPEC. It builds nothing,
lands nothing, edits no existing file and quotes no state file. Every `file:line` below is at 6a6bdff unless a3c544b is named.

## 0 · THE HEADLINE

Unit mdtl gives a red WITNESS its cause: a clause id that is a literal of the witness's tracked source, plus that clause's
header claim. Every other red still reaches the verdict as a NAME and nothing else. The live example is node 24 of
claude/mprk-build d2d9383 (check run 136344033976), which reads only `SUITE MEMBER · probe selftest exits 0` and its roll-up.
The same red sits on main 6a6bdff's own node 22 leg (136341665594), at a tree with no mprk byte. No channel brings out
which of probe's checks failed, so the red can be neither ruled nor fixed from the public record.

**The proposal is the mdtl law, widened by kind (shape A, reason R2):**
- every cause is rebuilt by the verdict, a different file from the one that built it, out of a **closed public alphabet
  per kind**:
  - a whole string literal of the tracked file that printed the line;
  - a template skeleton of that file (its static bytes, with `…` for each fill);
  - a repo-relative path tracked at head;
  - a JS builtin error class;
  - digits only in a slot the member itself computed or validated whole (FORK F3).
- anything else becomes ONE `WITHHELD` entry, and its bytes never leave;
- it rides the transport mdtl built (the machine line's `causes`, the NEW RED message, the payload `cause`). It adds no
  annotation, no artifact, no log line and no workflow edit.

With it, the probe red reads
`SUITE MEMBER · probe selftest exits 0 — cause: exit 1 · FAIL <the first failing check, as the literal of scripts/probe.mjs that names it> · and <n> more`.
The exact check is NAMED NOT GUESSED (N1): it stayed on the runner, which is exactly the gap this unit closes.

Two measurements decide the shape (§1):
- **M9:** a raw member tail on the runner carries a planted state canary today; only the grep keeps it off the record.
- **M10:** a mode-throw message carries 10 of the 17 characters of a planted canary. So no raw detail, tail or message
  ever leaves. Only literals rebuilt from public source do.

## 1 · MEASUREMENTS (each by command, its last line, 2026-11-20)

`API=https://api.github.com/repos/nikhil1429/arsenal-ai-fc`. Tools are in this seat's scratchpad. Their source is
summarised in §1.1, so a build can re-run each one.

| # | Command | Last line (2026-11-20) |
|---|---|---|
| M1 | `git fetch origin main; git rev-parse FETCH_HEAD` | `6a6bdfff4349b849398b69d0748b27d37c874b85` |
| M2 | `curl -s $API/commits/d2d9383416860ab1173e1f095a07a81bf0051914/check-runs` | `136344033976 npm test · node 24 failure` (node 22: `136344034295 … success`) |
| M3 | `curl -s $API/check-runs/136344033976/annotations` | `failure \| NEW RED · node 24 1/2 \| SUITE MEMBER · probe selftest exits 0`. Its pair is `NEW RED · node 24 2/2 \| all 59 hermetic suite members pass (every one RUN, not chained)`, and the verdict payload has `new` = those two names, `base_red 0`. **No cause.** |
| M4 | `curl -s $API/check-runs/136341665594/annotations` (main 6a6bdff, node 22) | `NEW RED · node 22 1/2 \| SUITE MEMBER · probe selftest exits 0`. The same red on main's own tree. mprk PROOF §9 (`git show 1997102:ci/mprk/PROOF.md`) measured probe GREEN 176/176 in a container, on both trees and both node versions. |
| M5 | `curl -s $API/actions/jobs/136344033976` (step names and conclusions) | `9 the neutral verdict \| failure`; steps 1-8 `success`. Step metadata is a public field with no log byte in it (see K17). |
| M6 | `node tools/census.mjs scripts/organism_test.mjs --tmpl` | `census · 209 assert call site(s) · 33 with an interpolated or computed name · 14 enclosing function(s)` |
| M7 | `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` in an LF clone of 6a6bdff under `os.tmpdir()` (after `npm ci`) | see the fenced block below. Its two reds are this container's: `SUITE MEMBER · sandbox selftest exits 0` and its roll-up. |
| M8 | `node tools/printers.mjs <LF clone of 6a6bdff>`: every suite member's selftest, every marked check line, tested against its own organ's tracked source | see the fenced block below |
| M9 | `node tools/skeleton.mjs <clone> probe turn_hook lawpack teaching_gate harness_text dugout xray limits brain` (the members M8 found with lines that open with no literal) | see the fenced block below |
| M10 | `node tools/measure_base.mjs <repo> <node_modules>`: a toy SUITE MEMBER in a clone of 6a6bdff that reads a PLANTED state file (node writes it under `os.tmpdir()`). It prints a literal failing check, a canary check and a word-salad check (public words in an order no literal has), and writes the canary on stderr. Then `ci_verdict.mjs compare` runs against a planted green base | see the fenced block below |
| M11 | `node tools/measure_throw.mjs <plant>`: package.json opens with a canary, so `coverage` THROWS while parsing it | see the fenced block below |
| M12 | `node scripts/ci_verdict.mjs selftest` (6a6bdff) | `ALL CHECKS PASSED` |
| M13 | `curl -s https://api.github.com/rate_limit` | `core limit 15000`. The agent proxy authenticates, so no read here proves anonymous readability (N2). |
| M14 | the canon-count replay over the COMMIT blobs (§9) | `canon_scan <sha> · … md blobs · 1 declared · 0 undeclared` |

```
M7   organism_test: 156 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 124 (hermetic: named, not run)
M8   printers · 129 member(s) · 7 red here · 128 print marked check lines · 8166 check line(s): whole-literal 7707 · literal-head 216 · no literal 243 · fail-marked 19
     markers {"✓":6150,"✗":3,"ok":1796,"PASS":201,"FAIL":16}      (probe: checks 176 · whole 134 · head 0 · none 42)
M9   skeleton · 9 organ(s) · 1540 check line(s): whole literal 1261 · template skeleton 117 · neither 162
     (probe: literal 134 · skeleton 23 · neither 19)
M10  reds at head ["SUITE MEMBER · toy_member selftest exits 0","all 3 hermetic suite members pass (every one RUN, not chained)"]
     leaving lines 17 · naming the canary 0 · naming the salad 0 · naming the literal check 0 · naming the skeleton 0
     payload has cause false · compare exit 1
     (runner-only) machine line names the canary true · raw roll-up detail names it true
M11  reds ["MODE coverage · ran to its end (a throw is a red, never a dead runner)"]
     detail names a canary prefix 10 of 17 chars · detail names the canary false · detail error class SyntaxError · detail names a scripts/ frame true · leaving lines naming the canary 0 of 8
```

**What M10 and M11 settle.**
- At base, nothing leaks: zero leaving lines carry the canary. But nothing explains either: zero carry the failing check.
- The bytes that WOULD explain sit in the machine line's `unruled[].detail` (`organism_test.mjs:3099`), and that same
  field carries the canary (M10). A throw's message carries a canary prefix (M11).
- So the mdtl ruling carries over unchanged: **raw detail is refused; only rebuilt literals leave.**
- The word-salad plant is new here. A token-level allow list ("any word that appears in the source") would let the salad
  out, so the alphabet is whole literals and skeletons, never words.

### 1.1 · The tools (scratchpad; summarised, not committed)

- `mktree.mjs`: an LF clone (`core.autocrlf=false`) of a sha under `os.tmpdir()`, written by node.
- `census.mjs`: every `assert(` call site, grouped by enclosing function. A name is "interpolated" when it is a template
  with `${…}` or a computed expression.
- `printers.mjs`: runs each member exactly as `suites()` does (`organism_test.mjs:400`). The bound is HEAVY_BOUND_MS, read
  out of the clone's `organism_test.mjs` and never typed.
  - A check line is `^\s*(✓|✔|ok|PASS|✗|✘|FAIL|…)\s+(.+)$`.
  - WHOLE means its text is one string literal of `scripts/<m>.mjs`. HEAD means it opens with a non-empty literal. Only
    counts are printed, never a line.
- `skeleton.mjs`: the same, adding SKELETON. A template literal of the organ whose static segments, in order, match the
  whole name.
- `measure_base.mjs`, `measure_throw.mjs`: as M10 and M11.
  - The suite.yml head grep is read out of the clone's `.github/workflows/suite.yml`, never typed.
  - "Leaving" means the union of: the grep over the member output; every line of compare's stdout (the annotations); the
    `^B1_VERDICT ` lines (the step summary).
- `canon_scan.mjs`: §9.

## 2 · THE CENSUS (question a): every red kind the verdict can carry that is not a witness red

A verdict red is a NAME in `reds` (`organism_test.mjs:3100`, from `assert` at `:46-50`), a name `ci_verdict.mjs` makes
itself, or a leg with no verdict at all. "Today" means what `node scripts/ci_verdict.mjs <sha>` and the annotations show.

| K | Kind | Emitted at (6a6bdff) | Today on the verdict | Its runner-only detail |
|---|---|---|---|---|
| K1 | **suite member selftest exit**: `SUITE MEMBER · <m> selftest exits 0` | `organism_test.mjs:405`, the red-why line `:406` (`redWhy` `:73`) | the name only (M3, the probe example) | none in the assert; the member's whole output (`r.out`) is in hand at `:403` |
| K2 | **the hermetic roll-up**: `all <n> hermetic suite members pass (every one RUN, not chained)` | `organism_test.mjs:409-410` | the name only (M3) | `<m>: <redWhy> \| <the last 3 output lines>`, a RAW TAIL that carries the canary (M10) |
| K3 | **a member judged inside a mode**: `MPOOL · usage_tap selftest runs in the hermetic chain and exits 0 (forks row 1062)` | `organism_test.mjs:2256` | the name only | the FAIL or selftest lines of the output, a raw tail |
| K4 | **killed by the bound**: K1, K2 or K3 when `run()` returns `killed` | `organism_test.mjs:66-72`, `:73` | the same name as an exit (only `:406`, runner-only, says killed) | `killed by the suite bound (<ms> ms) — not an exit code` |
| K5 | **a mode assert with a computed detail**: coverage `:314-345`, integrity `:417-636`, laws `:790-2086` (laws holds 114 of the 209 sites, M6) | each `assert` site | the name, digits folded | free text per site: organ basenames (`orphaned: …` `:327`), paths, counts, quoted output |
| K6 | **a mode throw**: `MODE <c> · ran to its end (a throw is a red, never a dead runner)` | `organism_test.mjs:3093` | the name only | the stack's first 3 lines, whose message carries state bytes (M11) |
| K7 | **the law pack gate**: `LAW PACK — every rule file present, and no law's finding count rose …` | `organism_test.mjs:2744`; its RED lines are made at `lawpack.mjs:563`, `:568`, `:666`, `:673`, `:679`, `:958` | the name only | the `RED  <…>` lines, in which `:679` quotes depcruise's raw output |
| K8 | **a law pack rise, by number**: `LAW PACK ROSE · <law> <b> → <h>` | `ci_verdict.mjs:82` (`lawpackRises` `:78`) | **self-naming**: the law and both counts ARE the name | n/a. *Which* finding rose has no channel (§4) |
| K9 | **the law pack baseline is unreadable**: `LAW PACK BASELINE UNREADABLE · …` | `ci_verdict.mjs:80` | self-naming literal | n/a |
| K10 | **what is left**: `WHAT IS LEFT · …` (four asserts and three rung asserts) | `organism_test.mjs:2762-2789` | the name only | raw slices of done.mjs's line |
| K11 | **a clause witness**: `CLAUSE WITNESS · ci/witness/<u>/<f> plants — …` | `organism_test.mjs:2823` | the name (it carries the path) | the `PLANTS` line, or the exit plus a raw `FAIL\|RED` slice. NOT a mdtl red: mdtl judges `WITNESS ‹u› · GREEN at head …` only |
| K12 | **the witness member's own reds**: `WITNESS ‹u› · carries a BASE file (B6)`, `· its BASE is in the clone`, `· its trees are built …`, `· binds no fixed service port (B4)` | `organism_test.mjs:2962`, `:2965`, `:2970`, `:2973` | the name only. mdtl's build leaves these causeless by design (a3c544b PROOF §2) | a literal (B6), a 7-hex sha, a git error text, or `fixedPortHits` paths and ports |
| K13 | **the ruling instrument**: `KNOWN-RED · <the self-check's literal>` | `organism_test.mjs:3086` | self-naming literal | none |
| K14 | **the head died before its machine line** | `ci_verdict.mjs:112` (`judge`) | `RED · the head run produced no headline line`, with `new` = [] | the head file's last `── <section>` line (a literal or skeleton of organism_test.mjs, `section` `:51`) |
| K15 | **the base died before its machine line** | `ci_verdict.mjs:113` | every head red becomes NEW, each as its own kind | as K14, for the base |
| K16 | **a LIVE-only red** (gates `:2697`, the trip metric `:2287`, path, alive, atlas) | `LIVE_MODES` `:227`, `skipLive` `:251` | never run on the neutral machine, so never a verdict red (M7: `GATES — LIVE`) | out of scope; named so a later profile change does not orphan it |
| K17 | **no verdict annotation at all** (job killed at `timeout-minutes`, `npm ci` failed, a step crashed, cancelled) | `ci_verdict.mjs:204` (`readVerdict`) | `RED (<conclusion>; no verdict annotation — the run never reached its verdict)` | none on the run. The job's **step names and conclusions** are public API fields (M5) |

The census command for a build is `node tools/census.mjs` (M6). A new `assert(` site joins K5 unless it is K1-K4 or K10-K13.

## 3 · THE PUBLIC BYTES PER KIND (question b), and the canary plant that proves each

THE ALPHABET. Each entry is closed, and each one rebuilds byte for byte from a file the verdict can read in the workspace:

| Code | Public bytes | Rebuild check (made by ci_verdict, not by the member) |
|---|---|---|
| **LIT(f)** | one whole string literal (`"…"`, `'…'`, or a template with no fill) of tracked file `f` | the text equals a literal of the workspace's `f` |
| **SKEL(f)** | a template literal of `f` written as its static segments joined by `…`. **The fill bytes never leave** | the text equals the skeleton of a template of `f` |
| **PATH** | a repo-relative path tracked at head, optionally followed by `:<line>` | `git ls-files --error-unmatch <path>` in the workspace (or the `ls-files` set read once) |
| **ERR** | a JS builtin error class name | a member table: `Error TypeError RangeError SyntaxError ReferenceError EvalError URIError AggregateError` |
| **SLOT** | digits in a slot the member COMPUTED (an exit code, the bound in ms) or VALIDATED as a whole grammar line (`CLAUSE <ID> RED · <k>/<n> plant(s)`) | the slot's grammar is a member literal, and the digits sit only where the grammar holds them |
| **ID(f)** | mdtl's clause id and header claim (`witness_cause.mjs` `idsInSource` / `claimOf`, a3c544b) | mdtl's `verifyCause`, unchanged |
| **WITHHELD** | `a cause that is not public bytes of its own tracked source was withheld` (a member literal) | always allowed |

PER KIND. A **CANARY PLANT** is planted under `os.tmpdir()` by node, and the witness clause of §5 holds each one.

- **K1 / K3 / K4: member exit.**
  - Cause: `exit <n>` or `killed at the member's bound (<ms> ms)` (SLOT, from `r.code` / `r.killed`, never parsed from
    the output);
  - then the FIRST failing check line of the output. Its marker is `✗|✘|FAIL` and its text is the longest LIT or SKEL of
    `scripts/<m>.mjs` that opens it at a word boundary;
  - then `and <n> more` (SLOT: the count of the other failing check lines). This is FORK F2.
  - A failing line that rebuilds from neither LIT nor SKEL is WITHHELD.
  - Coverage, measured (M8, M9): 7707 of 8166 marked check lines are WHOLE literals of their own organ, and SKEL takes
    117 of the 279 that were not, across the nine outliers.
  - *Plant:* M10's toy member reads the state canary and prints three failing checks:
    1. a literal, which must be readable as `FAIL the toy member planted check fails on purpose`;
    2. `✗ <CANARY>`, which must be WITHHELD;
    3. `✗ the toy check read <SALAD>`, which must read as the skeleton `the toy check read …`, with no salad word in any
       leaving line.
  - A NUMERIC canary (12 random digits, written in the state file and printed in a failing check) must appear in no
    leaving line (FORK F3 B).
- **K2: roll-up.**
  - Cause: the red MEMBER NAMES (each one PATH-checked as `scripts/<m>.mjs` at head), each with its K1 SLOT (`exit <n>`).
  - **The 3-line tail never leaves.** *Plant:* as M10, where the tail line holds the canary and the salad.
- **K5: mode-assert detail.**
  - Cause: the PATH tokens of the detail, in order and deduplicated (an organ basename counts when `scripts/<t>.mjs` is
    tracked). With FORK F3 B, no free digits.
  - The rest is `…`. Words never leave. This is FORK F5.
  - *Plant:* an UNTRACKED file `scripts/<CANARY>.mjs` with a selftest sits beside a tracked unwired one (`git add` in the
    plant). Coverage then reds with `orphaned: <tracked>, <CANARY>`. The tracked one must be readable, and the canary
    must be WITHHELD, since it is not a path tracked at head.
- **K6: mode throw.**
  - Cause: ERR (the stack's first token when it is in the table), plus the first PATH frame under the workspace
    (`scripts/<f>.mjs:<line>`).
  - The message NEVER leaves.
  - *Plant:* M11. Its detail holds 10 of the 17 canary characters. The cause must read
    `SyntaxError · scripts/organism_test.mjs:<line>`, and no canary prefix of 2 or more characters may appear in any
    leaving line.
- **K7: law pack gate.**
  - Cause: the RULE ID of each `RED` line (a LIT of `scripts/lawpack.mjs`: the `RULE_IDS` literals), plus which red
    template fired, as SKEL of `lawpack.mjs` (`… ROSE — …, baseline …`).
  - The counts are already in K8's name, so they are not repeated. `:679`'s raw depcruise text is WITHHELD.
  - *Plant:* a lawpack stand-in whose `RED` line carries the canary after the skeleton.
- **K8 / K9 / K13: self-naming.** The name IS its public cause. No change, and no cause entry (byte-identical guard).
- **K10: what is left.**
  - Cause: SKEL of `scripts/done.mjs` for the line it printed (`DONE · …`), fills withheld.
  - done.mjs `--hermetic` reads no state by its own contract (`:2764`), but this unit does not lean on that.
  - *Plant:* a done stand-in prints the canary inside its line.
- **K11: clause witness.**
  - Cause: each `CLAUSE <ID> RED · <k>/<n> plant(s)` line, with ID(f) over the clause witness file named in the assert
    (`ci/witness/<u>/<f>`, PATH-checked) and SLOT k/n.
  - It reuses mdtl's `idsInSource` / `claimOf` unchanged.
  - *Plant:* a toy `ci/witness/toy/witness_toy.mjs` prints `CLAUSE Q<CANARY> RED · 0/1 plant(s)`, which must be WITHHELD
    (not a literal of its source), and `CLAUSE P1 RED · 0/1`, which must be readable with P1's claim.
- **K12: witness member reds.**
  - Cause: B6 is a member literal (`ci/<unit>/BASE is absent` or `… is not one 40-hex line`). CLONE is its 7-hex BASE,
    which is LIT of the tracked `ci/<u>/BASE`. TREES is WITHHELD, because a git error text can quote paths. PORT is the
    `fixedPortHits` paths (PATH) and the port digits (SLOT of the hit grammar).
  - *Plant:* a toy unit whose BASE file holds the canary, so B6 reds. The canary must not leave, and the member literal
    must.
- **K14 / K15: no machine line.**
  - Cause (computed by compare, from the head or base file it already reads): `last section · <title>`, where the title
    is the last `^── ` line, as LIT or SKEL of the workspace's `scripts/organism_test.mjs`. If there is none,
    `no section reached`.
  - *Plant:* a head file with a forged last `── <CANARY>` line, which must be WITHHELD.
- **K17: no verdict annotation (reader only).**
  - Cause: the job's first step whose conclusion is not `success`/`skipped`, read from `GET /actions/jobs/<id>`. That is
    ONE extra call, only for such a leg. It prints `step <name> · <conclusion>`.
  - Step names are GitHub metadata of a public repo, with no log bytes. Rebuild: the name is a `name:` literal of the
    reader's `.github/workflows/suite.yml`, or one of the runner's own `Set up job` / `Run <uses>` / `Post Run <uses>` /
    `Complete job` shapes. Otherwise `step (unnamed) · <conclusion>`.
  - *Plant:* the reader's planted fetch serves a jobs payload whose failed step is named `<CANARY>`, which must print
    `step (unnamed) · failure`.

THE RESIDUAL (the same as mdtl R2). WHICH public literal is chosen can depend on state: a check that fails on a state
value names a different literal than one that passes. The channel is log2 of the literal set per cause, never a state
byte. mdtl accepted this for clause ids; it is named here as FORK F10 so the ruling is explicit for every kind.

## 4 · WHERE NO PUBLIC CAUSE CHANNEL EXISTS (question c), and shape C as a fork, never built

- **K1, check lines of no literal shape.** Measured (M9): 162 of the 1540 check lines across the nine outliers rebuild from
  neither LIT nor SKEL (their names are built by concatenation or come from a table). They read WITHHELD.
- **K5, a detail that holds no tracked path.** The cause is `…`: the name alone, as today.
- **K6, the message of a throw.** By construction it is never public.
- **K8, which finding rose.** `lawpack.mjs gate` prints counts, not findings (`:956-979`), so the rise has no named
  file:line on the runner to carry.
- **K14 with no section reached** (a crash before `section` `:51` first runs).

**SHAPE C (FORK F8), never built.** An organ may declare an opt-in `CAUSES` table of literals, and print
`CAUSE <CODE>` lines that the member maps to that table's literal (LIT of the organ):
- for K1, a selftest that names its own failing check by code;
- for K8, `lawpack.mjs gate` printing each NEW finding's `PATH:<line>` (public source locations; this needs a head-vs-base
  finding diff, so it is its own row);
- for K6, an organ wrapping its mode with a coded throw.

Each would be its own unit, launched only when a measured no-cause red of that kind recurs.

## 5 · THE CODE PATH PROPOSED (after mdtl lands; shape A, the recommendations of §7)

1. **New `scripts/red_cause.mjs`** (header `SOLE WRITER of: NOTHING`; pure exports, no IO but what callers hand it, and a
   `selftest`, FORK F11 A).
   - `literalsOf(src)` and `skeletonsOf(src)`, the alphabet of §3. No length is typed. A skeleton needs at least one
     non-blank static segment.
   - `memberCause({ member, code, killed, out, src })` covers K1, K3 and K4. It returns `[{ id, text }]`: the SLOT entry,
     then the FIRST failing check as LIT or SKEL or WITHHELD, then `and <n> more`.
   - `rollupCause`, `detailCause` (K5), `throwCause` (K6), `lawpackCause` (K7), `doneCause` (K10), `clauseCause` (K11,
     which imports `idsInSource` / `claimOf` from `witness_cause.mjs` unchanged) and `memberLitCause` (K12).
   - `verify(line, reds, readFile, tracked)` is **the second check**. It finds the red's kind by its name's literal
     opening, rebuilds the cause from the file that kind names (`scripts/<m>.mjs`, `scripts/organism_test.mjs`,
     `scripts/lawpack.mjs`, `scripts/done.mjs`, `ci/witness/<u>/<f>`), and returns it, or the WITHHELD literal.
2. **`scripts/organism_test.mjs`.**
   - At `:403-406` (suites), `:2256` (MPOOL), `:409` (roll-up), `:2744` (lawpack), `:2762-2789` (done), `:2823`
     (clauses), `:2962-2973` (witness member) and `:3093` (mode throw), push `red_cause` entries into mdtl's module-level
     `causes` (a3c544b `:46`).
   - K5 sites get ONE generic hook inside `assert` (`:46-50`): on a red with a detail, push
     `detailCause(name, detail)`. That is one edit, not 114.
   - **Every judged name and detail stays byte-identical**, so every KNOWN_RED entry (`:3027`) keeps its match.
   - The import is guarded by `existsSync`, exactly as mdtl's (a3c544b `:2958`), so a base measured by this instrument has
     no hard dependency.
3. **`scripts/ci_verdict.mjs`.**
   - `causesFor` (a3c544b) dispatches: a `WITNESS ‹u› · GREEN at head …` red goes to mdtl's `verifyCause`, unchanged;
     every other red goes to `red_cause.verify`, with `readFile` taken from the workspace and `tracked` from one
     `git ls-files` read.
   - `judge` (`:111-113`, K14/K15) hands compare the last-section cause, under the payload key `cause["(head)"]` /
     `cause["(base)"]`.
   - `readVerdict` (`:204`, K17) makes one `/actions/jobs/<id>` call for a leg with no verdict annotation only.
   - No annotation is added. A GREEN head's output is byte-identical to base.
4. **`package.json`.** Add `&& node scripts/red_cause.mjs selftest` to `organism:selftest`, after
   `witness_cause.mjs selftest` (FORK F11).
5. **`.github/workflows/suite.yml`: no change.**

**Owners.** No state file is read or written on this path. `ci_verdict.mjs:5` says `SOLE WRITER of: NOTHING`, and
`organism_test.mjs:2860` says "Sole writer of nothing" (and `:3096`: "this suite writes nothing it does not own").
`witness_cause.mjs` (a3c544b) is read through its exports only and never edited. The new module writes nothing.

## 6 · THE WITNESS (ci/mdtl2/witness_mdtl2.mjs; BASE = the main sha mdtl lands at, N5)

It runs on `--org` and `--base-org`, as mdtl's does:
- each tree is COPIED under `os.tmpdir()` into a git copy (LF);
- each copy's package.json suite strings are replaced by the toy members only (as M10);
- planted state is written by node under `<tmp>/planted/dressing-room/state/` and reaches a toy through an env door only;
- each copy runs `node scripts/organism_test.mjs <mode>` with `GITHUB_ACTIONS=true`, `GITHUB_WORKSPACE=<copy>` and
  `ORGANISM_TEST_PROFILE=hermetic` in the child env only;
- then the copy's own `ci_verdict.mjs compare` runs against a planted all-green base, then `readVerdict` with a planted
  fetch.

There is no network. "Leaving" is M10's three-channel union.

| Clause | Claim | base (mdtl on main) | build |
|---|---|---|---|
| **E1 MEMBER** | toy member red: its NEW RED message and its reader line read `exit 1 · FAIL the toy member planted check fails on purpose · and 2 more` | RED (M10: the literal check in 0 leaving lines) | GREEN |
| **E2 NO-LEAK** | the hex canary, the numeric canary and the word salad are in 0 leaving lines, **and** a WITHHELD cause and the skeleton `the toy check read …` are readable | RED: the conjunction (M10, `payload has cause false`) | GREEN |
| **E3 ROLLUP** | the roll-up's cause names `toy_member · exit 1` and none of the tail | RED | GREEN |
| **E4 PATH** | the coverage orphan plant: the tracked orphan is readable, and the untracked `scripts/<CANARY>.mjs` is WITHHELD | RED | GREEN |
| **E5 THROW** | the M11 plant: `SyntaxError · scripts/organism_test.mjs:<n>` is readable, and no canary prefix of 2 or more characters leaves | RED (M11: no cause) | GREEN |
| **E6 CLAUSE** | the K11 toy clause witness: `P1` and its claim are readable, and `Q<CANARY>` is WITHHELD | RED | GREEN |
| **E7 HEADLESS** | a head file with no machine line and a forged `── <CANARY>` last section: the payload carries `(head)` WITHHELD. A head whose last section is a literal reads it | RED | GREEN |
| **E8 READER** | planted fetch, a leg with no verdict annotation: the reader prints `step npm test · hermetic · head · failure` for a suite.yml step name, `step (unnamed) · failure` for a canary step name, and adds ONE call | RED (the reader never reads steps) | GREEN |
| **E9 SECOND-CHECK** | a forged machine-line cause for each kind (text in no source) is rewritten to WITHHELD by compare | RED | GREEN |
| **E10 RULED** (guard) | every judged name and detail is byte-identical to base, so KNOWN_RED matches are kept | GREEN | GREEN |
| **E11 GREEN-SILENT** (guard) | an all-green toy run gives compare output byte-identical between base's and build's ci_verdict | GREEN | GREEN |
| **E12 MDTL-INTACT** (guard) | mdtl's own D1 plant (a `WITNESS ‹toy›` clause cause) reads byte-identical on base and build | GREEN | GREEN |
| **BOUND** | outside `ci/`, only `scripts/red_cause.mjs` (new), `scripts/organism_test.mjs`, `scripts/ci_verdict.mjs` and `package.json` differ (by text, CRLF folded) | RED (the module is absent) | GREEN |
| **LAST** | no node process naming the temp dir survives | GREEN | GREEN |

**THE PORT CLASS (row 1053).**
- No clause binds a port, names a live service, POSTs anywhere or restarts anything.
- The toys bind nothing.
- The witness's outer wait takes the bound derived from `--org`'s `suite.yml` `timeout-minutes` (as mdtl's does), and
  child waits take the member's own `MEMBER_BOUND_MS` door (`organism_test.mjs:62`, it may only lower). Nothing is typed.
- There is no `claude` or `gemini` call; the member's refusing shims stand.

**MUTANTS (one per clause, each must turn its own clause RED on the build):**
- **E1-m**: `memberCause` drops the failing-check entry.
- **E2-m**: LIT is widened to "any word of the source", so the salad leaves; or F3 A is applied, so the numeric canary
  leaves.
- **E3-m**: the roll-up cause copies the tail.
- **E4-m**: PATH drops the tracked check.
- **E5-m**: `throwCause` keeps the message.
- **E6-m**: `clauseCause` skips `idsInSource`.
- **E7-m**: the last section is copied raw.
- **E8-m**: the reader prints the step name unchecked.
- **E9-m**: `verify` is reduced to its grammar check.
- **E10-m**: the cause is written into the judged detail.
- **E11-m**: the payload always carries `cause: {}`.
- **E12-m**: `causesFor` routes WITNESS reds to `red_cause.verify`.
- **BOUND-m**: suite.yml's head grep gains `|^         ` (the detail lines), so BOUND reds; E2 also reds.
- **LAST-m**: a toy spawns a detached `node -e` that sleeps past its parent.

## 7 · FORKS (each for the architect to rule)

- **F1 · where the code lives.**
  - (A) a new `scripts/red_cause.mjs` that imports `witness_cause.mjs` and never edits it;
  - (B) extend `witness_cause.mjs`.
  - **Rec A.** mdtl's bytes stay as adopted; E12 holds it. *Decides it:* nothing to measure; it is a layering choice (L9).
- **F2 · how many failing checks per member red.**
  - (A) every distinct failing check;
  - (B) the FIRST, plus `and <n> more`.
  - **Rec B.** One line per red by construction, and no size typed. An import-level death fails every check, and A would
    print hundreds. *Decides it:* the longest LIT or SKEL per organ against the annotation limit (N3).
- **F3 · digits.**
  - (A) any digit run (R2 read literally);
  - (B) digits only in a member-computed or member-validated SLOT.
  - **Rec B.** It is stricter: a count read off a state file is a state byte. The E2 numeric canary under mutant E2-m is
    the measurement.
- **F4 · template skeletons.**
  - (A) whole literals only;
  - (B) plus SKEL, with fills withheld.
  - **Rec B.** Measured (M9): SKEL takes 117 of the 279 non-whole lines across the outliers, probe's included (23 of 42).
- **F5 · mode-assert detail (K5).**
  - (A) PATH tokens only;
  - (B) also whole literals of organism_test.mjs found in the detail;
  - (C) no cause (the name is enough).
  - **Rec A.** B lets detail phrasing choose among many literals, a wider choice channel. *Decides it:* a per-site count
    of K5 details that hold a tracked path (a build's first measurement).
- **F6 · the reader's step lane (K17).**
  - (A) one jobs call for a leg with no verdict;
  - (B) none.
  - **Rec A.** *Decides it:* N2, signed out.
- **F7 · a run with no machine line (K14/K15).**
  - (A) compare names the last section;
  - (B) not.
  - **Rec A.**
- **F8 · shape C (§4).**
  - (A) named, not built, with a row per kind when it recurs;
  - (B) build the lawpack finding rows now.
  - **Rec A.**
- **F9 · the roll-up (K2).**
  - (A) red member names plus SLOT;
  - (B) no cause (the members carry their own).
  - **Rec A.** It is the only red that names WHICH member when the member asserts are capped at 9 per level.
- **F10 · the choice residual (§3).**
  - (A) accept it as mdtl R2 did;
  - (B) refuse every cause chosen by a state-dependent branch.
  - **Rec A.** B cannot be decided statically, and it would refuse mdtl's own clause ids.
- **F11 · selftest wiring.**
  - (A) `red_cause.mjs selftest` in `organism:selftest`;
  - (B) covered by the ci_verdict selftest only.
  - **Rec A** (the coverage law, `package.json` `_selftest_coverage_law`).
- **F12 · sequencing.**
  - (A) the build cuts from the main that carries mdtl, and resolves with mshard by name (row 1207 (2));
  - (B) build now on a3c544b.
  - **Rec A.** The build edits mdtl's `causesFor`.
- **F13 · K12 TREES** (git error text).
  - (A) WITHHELD;
  - (B) a PATH of the failing tree.
  - **Rec A.**

## 8 · NAMED NOT GUESSED

- **N1.** Which of probe's checks failed on node 24 of d2d9383 (136344033976) and on 6a6bdff's node 22 (136341665594). The
  output stayed on the runner. *Measure:* the build's first run after landing; or on his laptop, `node scripts/probe.mjs
  selftest` under load, run repeatedly.
- **N2.** Whether a **signed-out** client reads `/actions/jobs/<id>` and `/check-runs/<id>/annotations`. Here the proxy
  authenticates (M13). *Measure on his laptop:* `curl -s -o NUL -w "%{http_code}" https://api.github.com/repos/nikhil1429/arsenal-ai-fc/actions/jobs/136344033976`
  with no token.
- **N3.** The neutral machine's per-annotation message limit, against the longest LIT/SKEL per organ. *Measure:* the
  build's own scan of the longest literal, and one planted red with the longest one on a runner.
- **N4.** How the Windows runner's redirected output encodes `✓` / `✗` (M8 measured UTF-8 under Linux). *Measure:* the
  build's E1 on the neutral machine, where both legs must read the literal.
- **N5.** The main sha mdtl lands at. It is the BASE of this unit's witness, and it was not on main at this cut.
- **N6.** Whether `SUITE MEMBER · sandbox selftest exits 0` (red in this container, M7, both alone and beside a running
  suite) is container-bound. Its runner-only tail names a canary-tripwire check. *Measure:* the neutral legs of this
  branch (§10).

## 9 · THE CANON-COUNT REPLAY (row 1169)

Before each push, the LOAD ZERO BLOCK 7 scan (`organism_test.mjs:1920-1944`) is replayed over `git show <sha>:<path>` for every
tracked `.md` of the commit. Its two regexes are read from that commit's own `organism_test.mjs` (scratchpad
`tools/canon_scan.mjs`). Any undeclared line means no push. Every count in this file sits in a fenced block or on a dated
line.

## 10 · CHECK RUNS OF THIS BRANCH

The check runs of each pushed tip are read with curl from the public API and recorded in `ci/mdtl2/LEDGER.jsonl`. A file
cannot carry its own verdict (row 1167 (3)).
