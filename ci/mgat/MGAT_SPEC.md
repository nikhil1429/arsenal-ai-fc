# MGAT SPEC — unit mgat (forks row 1137 (5)), cloud spec seat

Written 19 Nov 2026 by the cloud spec seat (unit mgat). A SPEC, not a build: nothing on main moved, no PR, no live
model call. Branch `claude/mgat-spec`, cut from `origin/main` **`a583afb`** (`git fetch origin main && git checkout -b
claude/mgat-spec origin/main`, 19 Nov 2026 UTC). Main has moved one commit past the mlaw seat's base `224f9b9`
(`a583afb` mtxt2 touches `scripts/services.mjs` and `scripts/rails.mjs` only; no lint site moved, §1). Every number
below is a measurement made 19 Nov 2026 on linux, node 22, on LF trees with the state directory excluded; its
command is beside it and its row is in `ci/mgat/LEDGER.jsonl`. Read first, not re-measured where they agree:
`git show da6d5e8:ci/mlaw/MLAW_SPEC.md` §2.5 / §2.6 and its tools `ci/mlaw/tools/gatesz.mjs`, `gatesbis.mjs`.
This seat's scratch tools are `ci/mgat/tools/*.mjs` (they build no organ and write only under `os.tmpdir()` and
`ci/mgat/LEDGER.jsonl`).


## 0. HEADLINE

1. **The three rises are confirmed by command at each commit and its parent, and they agree with mlaw §2.6 to the
   unit:** `0b209b2` mgrd 262 → 263 (S1, `groundsman.mjs:263`) · `5e43987` mlv2 263 → 265 (S2/S3, `cortex.mjs:2344`) ·
   `1fcaec9` mjd7 265 → 268 (S4-S6, `captains_call.mjs:1691`, `:1699` ×2). Each is a COPY of a shape already in its
   own file (§1.3). Head `a583afb` still reads 268.
2. **No site needs a re-base.** Measured (§2): none is bound by swallow.mjs's lane law (0 of 6 under lawpack's own
   judge). Five are designed swallows and are DECLARED at the site with their reason. The two cortex ones are
   REPAIRED by folding the copy into one `releaseLock()`. 268 → 262 = the frozen baseline. `LINT_BASELINE` is not
   touched, so the gate gets no looser.
3. **`gates` can leave `LIVE_MODES`.** Its tsc + eslint half (`gates.mjs lint`, already in the file) printed
   byte-identical output with the state folder absent, empty and tracked (§3.2). The ajv half reads his state and stays
   LIVE, named `gates schema half`. On a temp-tree build, all seven witness clauses read RED on base and GREEN on the
   build, and each of seven mutants turns its own clause RED (§4, §5). W7: a planted new empty catch is now RED on the
   hermetic profile.
4. **Order matters:** the LIVE exit must land WITH or AFTER the site fates, never before. Otherwise its own new member
   is red (§3.3, F1).

## 1. QUESTION 1 — each rise, by command at the commit and its parent, and every new site by file:line

### 1.1 Recipe
- `ci/mgat/tools/report.mjs <sha>` — the mlaw `gatesz.mjs` recipe (LF tree, empty state dir planted, `gates.mjs
  report`), printing the exit code beside the lint line.
- `ci/mgat/tools/sites.mjs <sha>` — eslint (`scripts hooks --format json`, the same argv as `gates.mjs:325`) at the
  commit AND at its first parent; a site is keyed by (file, trimmed source line, occurrence), so a site that only
  MOVED is not counted new. Prints `NEW` / `GONE` rows and the two counts.

### 1.2 The three rises (agree with mlaw §2.6 to the unit, so mlaw's census stands; named, not re-bisected)

| Parent → commit (unit) | `report.mjs` parent → commit (19 Nov 2026) | `sites.mjs` last line (19 Nov 2026) |
|---|---|---|
| `15edfec` → `0b209b2` (mgrd) | exit 0 · no-empty 262 → exit 1 · no-empty 263 | `mgat sites 15edfec -> 0b209b2: no-empty 262 -> 263 · new 1 · gone 0` |
| `4d166d3` → `5e43987` (mlv2) | exit 1 · 263 → exit 1 · 265 | `mgat sites 4d166d3 -> 5e43987: no-empty 263 -> 265 · new 2 · gone 0` |
| `8c729c8` → `1fcaec9` (mjd7) | exit 1 · 265 → exit 1 · 268 | `mgat sites 8c729c8 -> 1fcaec9: no-empty 265 -> 268 · new 3 · gone 0` |
| head `a583afb` | `mgat report a583afb: exit 1 · no-empty 268` | `mgat sites a583afb: no-empty 268` (`--all`) |

`15edfec` is the last GREEN `gates report` on the empty plant (exit 0). Each rise commit changes exactly one file
(`git diff --stat <sha>^1 <sha>`: `1 file changed` each), and that file is the one its message names.

### 1.3 The six new sites (line numbers at head `a583afb`; the rise commit's line in brackets)

| # | Rise | Site at head | The block |
|---|---|---|---|
| S1 | mgrd `0b209b2` | `scripts/groundsman.mjs:263:59` (`:253`) | `} finally { try { rmSync(idx, { force: true }); } catch {} }` — the private `GIT_INDEX_FILE` under `os.tmpdir()` removed after the state-push rebuild (`:244` names it) |
| S2 | mlv2 `5e43987` | `scripts/cortex.mjs:2344:107` (`:2352`) | `try { lock.closeAllConnections && lock.closeAllConnections(); } catch { }` inside the `retire` callback handed to `keeper.mjs retireWhenIdle` |
| S3 | mlv2 `5e43987` | `scripts/cortex.mjs:2344:139` (`:2352`) | `try { lock.close(); } catch { }` — same callback, then `process.exit(KEEP_EXIT.RETIRED)` |
| S4 | mjd7 `1fcaec9` | `scripts/captains_call.mjs:1691:161` (`:1691`) | `parseRows`: `try { o.push(JSON.parse(l)); } catch { }` over the grade-queue rows read since the cursor |
| S5 | mjd7 `1fcaec9` | `scripts/captains_call.mjs:1699:146` (`:1699`) | `GRADE_QUEUE_IO.readRange`: `try { fd = openSync(p, "r"); while … readSync … } catch { }` |
| S6 | mjd7 `1fcaec9` | `scripts/captains_call.mjs:1699:208` (`:1699`) | same line, `finally { if (fd !== null) { try { closeSync(fd); } catch { } } }` |

Each of the six COPIES a shape already in its own file before the rise (the reason its author did not see it as new):
S2/S3 copy `cortex.mjs:2284-2285` (the lock-release path, present at `4d166d3`); S4 copies the inner `catch { }` of
`captains_call.mjs:103` `readLinesJson`; S1 copies the file's own `readJson` at `groundsman.mjs:44` (`catch {}`).
Those originals are inside the frozen 262 and stay out of this unit (§6 names it as a fork).

## 2. QUESTION 2 — each site's fate, by measurement

### 2.1 Recipe
- `node ci/mgat/tools/fate.mjs` (19 Nov 2026, last line `mgat fate: probes done`) drives the call each empty block
  guards on plants under `os.tmpdir()`: no port is bound (the http server is created, never listened on), and
  captains_call is imported with `ARSENAL_CALL_STATE_DIR` (`captains_call.mjs:80`) planted under the temp dir.
- `node ci/mgat/tools/lawsite.mjs` (19 Nov 2026) hands the six sites to the law pack's own judge, `lawpack.mjs`
  `judgeBareCatch` (`:353`, lanes `:92`, fs I/O `:94`). Last line: `mgat lawsite: 0 of 6 new no-empty sites fall under
  the law pack's bare-catch half (lane ∧ fs I/O)`. So swallow.mjs's law (`swallow.mjs:14-19`, a lane catch that guards
  fs I/O swallows ONLY through `swallow()`) binds none of the six: S2/S3 sit in a lane (cortex) but guard an http
  server, not fs I/O; S1, S4-S6 sit outside the eight lanes. No owner's law asks for a `swallow()` call or a rethrow here.

### 2.2 What reaches each block (the probe's lines, verbatim)

| # | Probe line(s) | What a failure costs if it is swallowed |
|---|---|---|
| S1 | `S1 rmSync missing file, force: no throw` · `S1 rmSync a DIRECTORY at the index path, force: THROWS ERR_FS_EISDIR` | `force: true` already covers ENOENT; what is left is a directory at a pid-named temp path (EISDIR) or a Windows lock (EPERM/EBUSY, §7). The cost is ONE leftover temp file under `os.tmpdir()`. The push result is already decided above it (`groundsman.mjs:258-262`), and nothing reads the index again |
| S2 | `S2 closeAllConnections, never listened: no throw` | none reachable on this runtime. The owner's own words at the original, `cortex.mjs:2281-2283`: "The OS frees the port on exit regardless; these two are tidiness" |
| S3 | `S3 close, never listened: no throw · close() returned` · `S3 close twice: no throw · close() returned` | none reachable. `process.exit(KEEP_EXIT.RETIRED)` follows on the same line, so a throw here would only ever skip the exit, which is the one thing the retire must not skip |
| S4 | `S4 torn tail: rows 1 · cursor.offset 31 = first line bytes 31 (re-read next sync)` · `S4 merged middle line: rows 2 of 3 appended (lines 3) · mode whole · result keys rows,cursor,mode,why (no count of the dropped line)` | a torn TAIL is designed and already asserted (`captains_call.mjs:2754-2755`, "a half-written tail row is never passed"). A complete line that does not parse (a torn append merged with the next) is dropped and nothing counts it. Its cost is on the SAFE side: the dropped row can only be a `settled` row the sweep would have used to RETIRE a doubt card (`captains_call.mjs:1432`), so the card stays live and still reaches him |
| S5 | `S5 readRange missing path: no throw · returned bytes 0` · `S5 readRange a directory: no throw · returned bytes 0` · `S5 cursor held, file then removed: mode whole · why ahead · rows 0` | a short read. The caller already handles it: a length mismatch against the anchor falls back to ONE whole read (`captains_call.mjs:1710-1711`), and the probe shows the fallback taken |
| S6 | `S6 closeSync an fd already closed: THROWS EBADF` | EBADF is the one way in, and the fd is opened on the same line and closed only here. Nothing can be handed back from a `finally` |

### 2.3 The fate of each site

No site needs a RE-BASE. A re-base raises `LINT_BASELINE["no-empty"]` (`gates.mjs:92`), which loosens the gate,
and §2.2 shows a stricter path exists for every one of the six:

| # | Fate | Why, by §2.2 |
|---|---|---|
| S1 | **(b) designed, DECLARED AT THE SITE** | the swallow is the designed behaviour (tidiness; the result is decided before the `finally`). Declaring it means a comment inside the block that names why. ESLint's `no-empty` does not report a block that holds a comment (shown in §4, clause W2), so the count falls by 1. `LINT_BASELINE` is not touched. This is the idiom the same files already use, ten times in `captains_call.mjs` (`grep -n "catch { /\*" scripts/captains_call.mjs`: lines 1169 … 1354) |
| S2 + S3 | **(a) REPAIR AT THE SITE — fold the copy into its original** | the `retire` callback at `cortex.mjs:2344` re-types the two-line release at `:2284-2285` without the owner's reason beside it. The repair hoists ONE `function releaseLock()` holding those two lines, with their existing comment (`:2281-2283`), and calls it from both places. Two empty blocks leave the file and the two originals stay (they are inside the frozen 262). Behaviour is byte-for-byte the same calls in the same order |
| S4 | **(b) designed, DECLARED AT THE SITE** | the torn-tail skip is designed and asserted (`:2754`). The merged-line drop is on the safe side (a card stays live). Whether to COUNT the dropped line as well is fork F3 |
| S5 | **(b) designed, DECLARED AT THE SITE** | the short read is handled one level up (`:1710-1711`), and the probe shows the whole-read fallback |
| S6 | **(b) designed, DECLARED AT THE SITE** | EBADF from a `finally` close cannot be acted on |

Net, if all of this is built: no-empty 268 → 262 (−1 S1, −2 S2/S3, −3 S4-S6), equal to the frozen baseline. The gate
turns GREEN with its baseline unmoved. Measured on a built tree in §3.3, not typed.

## 3. QUESTION 3 — can the `gates` mode leave `LIVE_MODES` and ride the hermetic profile?

### 3.1 Where it sits today (at `a583afb`)
- `scripts/organism_test.mjs:212` — `gates` in `LIVE_MODES` ("validates every schema-d file of dressing-room/state (ajv)
  and reads state/laws_register.json"). `:2809` — in the hermetic profile a LIVE mode is named and never entered.
- `.github/workflows/suite.yml:68` (`ORGANISM_TEST_PROFILE: hermetic`) is the neutral machine. Its head and base steps
  (`:111`, `:125`) run `organism_test.mjs all`, so `gates()` (`organism_test.mjs:2668-2677`) has never run there.
- `gates()` spawns `gates.mjs report` (`:2670`). `report` runs THREE halves: tsc, eslint (`gates.mjs:313-333`
  `measure`) and the ajv half (`validateState`, `gates.mjs:240`, which reads the state folder at `:72`). The verb
  `lint` (`gates.mjs:500-503`) runs `measure()` and `judge(m)` (BOTH the type and the lint ratchet) and exits BEFORE
  `validateState` is called (`:506`). So `gates.mjs lint` is the state-free half of the same gate, already in the file.
- The ajv half's subjects (`schemas/*.schema.json`, four): `laws_register.json` and `registry.json` are TRACKED;
  `captains_call.json` and `models.json` are not (`git ls-files --error-unmatch`, 19 Nov 2026). The hermetic law's own
  definition (`organism_test.mjs:72-73`) names "a file of dressing-room/state … its bytes are still his" as LIVE. So
  the ajv half is LIVE by that definition, even on a CI checkout.

### 3.2 The verdict with the state folder absent and present (`node ci/mgat/tools/stateverdict.mjs a583afb [verb]`)
Plants: Z = folder absent · E = folder present, empty · T = the commit's tracked state present. 19 Nov 2026:

| Verb | Z | E | T |
|---|---|---|---|
| `report` | exit 1 · stdout sha256 `e98db026f6ba` · schema `0/0 … 4 NOT MEASURED` | exit 1 · `e98db026f6ba` | exit 1 · `478294663f78` · schema `2/2 … 2 NOT MEASURED` |
| `lint` | exit 1 · `30e59a39627e` | exit 1 · `30e59a39627e` | exit 1 · `30e59a39627e` |
| `organism_test.mjs gates` (full), 19 Nov 2026 | `4 passed, 1 failed` | same | same |

Each plant carries the one RED `LINT ROSE — no-empty 268, baseline 262` (last line of each run `mgat stateverdict
a583afb: done`, ledger rows `stateverdict a583afb` and `stateverdict a583afb lint`). The `report` VERDICT does not move
with state, but its OUTPUT does: the schema line. Read on a planted bad state file (§4 W4/W5, plant X), the ajv half
DOES move the verdict. That is what it is for, and why it stays LIVE. The `lint` output is byte-identical on all
three plants.

### 3.3 Answer
**Yes. The gate's tsc + eslint half can ride the hermetic profile, and its ajv half stays LIVE, named.** This is the
SPLIT that mlaw's census table names for this member (`git show da6d5e8:ci/mlaw/MLAW_SPEC.md`, the census row `gates
| 212 | SPLIT`), now with the split's door measured: the verb `lint` already exists. The proposed path (§3.4) makes the
NEXT no-empty rise RED on the neutral machine (W7). Today that rise is read only by the watchman's nightly full run on
his laptop, as mlaw §0.2 measured for the law pack.

**ORDER MATTERS — measured from the verdict step, not guessed:** `ci_verdict.mjs compare` judges the head against the
merge base, and an assert the head ADDS is a new member, never an "old red" (`suite.yml:117-120`, the step's own
comment). If `gates` leaves `LIVE_MODES` while no-empty still reads 268, the landing that does it goes RED on its own
new member. So the site repair (§2.3) must land BEFORE or WITH the LIVE exit, never after (fork F1).

### 3.4 The code path proposed (every edit exact, in `ci/mgat/tools/build.mjs` `EDITS`; applied only to temp trees)

| Edit | File:line at `a583afb` | Owner (header) | Change |
|---|---|---|---|
| S1 | `scripts/groundsman.mjs:263` | groundsman.mjs (its own code; it writes no other organ's file here) | declare the block: a comment naming why |
| S2S3-fn | `scripts/cortex.mjs:2274` (before `retireIfArmed`) | cortex.mjs | hoist `function releaseLock()` with the two original lines and their reason (`:2281-2285`) |
| S2S3-a | `scripts/cortex.mjs:2281-2285` | cortex.mjs | the original release becomes `releaseLock();` |
| S2S3-b | `scripts/cortex.mjs:2344` | cortex.mjs | the copy becomes `releaseLock();` |
| S4 / S5 / S6 | `scripts/captains_call.mjs:1691`, `:1699` (×2) | captains_call.mjs (sole writer of `captains_call.json`, `:21`; the grade queue is READ ONLY here, `:1633`) | declare each block |
| LIVE | `scripts/organism_test.mjs:212` | organism_test.mjs (writes nothing it does not own, `:2814`) | `gates` leaves `LIVE_MODES` |
| HALF | `scripts/organism_test.mjs:2670` | organism_test.mjs | hermetic: `liveNamed("gates schema half", …)` and spawn `gates.mjs lint`; full: `report` exactly as today |

No state file is written by any edit. `scripts/gates.mjs` is NOT touched: `LINT_BASELINE` stays 262 (`gates.mjs:92`),
and no new verb is needed. Not a single number is typed by the build: the existing `{ timeout: 600000 }` at `:2670` is
kept as it is.

## 4. WITNESS CLAUSES (each plant RED on base `a583afb`, GREEN on the build) — `ci/mgat/tools/witness.mjs`

Plants (built by the witness script under `os.tmpdir()`, never by a shell write): Z = state folder absent · E = present,
empty · T = the commit's tracked state · X = T with `registry.json` overwritten by a value no schema object accepts.
No port is bound. No live service is named or POSTed at, nothing restarts, and every child is a `spawnSync` that returns.

| Clause | What it asserts | base `a583afb` (19 Nov 2026) | build (19 Nov 2026) |
|---|---|---|---|
| W1 | `gates.mjs report` on E exits 0 and its no-empty equals the tree's own frozen `LINT_BASELINE` | RED `gates report exit 1 · no-empty 268 · frozen 262` | GREEN `exit 0 · no-empty 262 · frozen 262` |
| W2 | per touched file, no more no-empty sites than at the parent of the rise that added them | RED `groundsman.mjs 2 (≤ 1 at 15edfec) · cortex.mjs 10 (≤ 8 at 4d166d3) · captains_call.mjs 5 (≤ 2 at 8c729c8)` | GREEN `1 · 8 · 2` |
| W3 | hermetic `organism_test.mjs gates` ENTERS the mode: an `ok GATES —` assert, no `LIVE MODE gates` | RED `LIVE MODE gates — not run in the hermetic profile` | GREEN `LIVE gates schema half … \| ok GATES —` |
| W4 | the hermetic verdict is entered AND identical on Z and on X (state cannot move it) | RED `live ["MODE gates"]` (never entered) | GREEN `Z {"pass":5,"fail":0,"reds":[],"live":["gates schema half"]} · X the same` |
| W5 | the ajv half still guards: the FULL profile on X fails, and hermetic NAMES `gates schema half` LIVE | RED `full on X: fail 1 · hermetic LIVE ["MODE gates"]` | GREEN `full on X: fail 1 · hermetic LIVE ["gates schema half"]` |
| W6 | cortex: one `releaseLock()`, called twice; the retire line holds no bare catch | RED `releaseLock() calls 0 · retire line bare catches 2` | GREEN `calls 2 · bare catches 0` |
| W7 | ONE planted new empty catch turns the HERMETIC `gates` mode RED (the next rise has a neutral reader) | RED `LIVE MODE gates — not run` | GREEN `FAIL GATES —` |

Last lines: `mgat witness a583afb base: W1 RED · W2 RED · W3 RED · W4 RED · W5 RED · W6 RED · W7 RED` and `mgat witness
a583afb build: W1 GREEN · W2 GREEN · W3 GREEN · W4 GREEN · W5 GREEN · W6 GREEN · W7 GREEN` (ledger rows `witness
a583afb base` / `witness a583afb build`).

### 4.2 The behaviour guard (not a clause: GREEN on base by construction) — `node ci/mgat/tools/guard.mjs a583afb`
Each touched organ's own selftest on the T plant, base vs build, hermetic env. 19 Nov 2026: `groundsman … ALL CHECKS
PASSED · SAME`, `cortex … ALL CHECKS PASSED · SAME`, `captains_call … captains_call selftest: 156 passed, 0 failed ·
SAME`. Last line: `mgat guard a583afb: 3 of 3 organ selftests unchanged by the build`. (On the E plant cortex's
selftest dies on both trees alike, `gate: the registry lanes table is EMPTY/unreachable`. It reads `registry.json`,
`organism_test.mjs:98`. So the guard uses T.)

## 5. MUTANTS (one per clause; each turns its clause RED on the build) — `ci/mgat/tools/build.mjs` `MUTANTS`

| Mutant | What it undoes | Its clause on the mutant (19 Nov 2026, last line of `witness.mjs a583afb <M> <W>`) |
|---|---|---|
| M1 | S1 left undeclared | `mgat witness a583afb M1 (S1 left undeclared): W1 RED` |
| M2 | S5's declaring comment stripped back to `catch { }` | `… M2 (…): W2 RED` |
| M3 | `gates` put back in `LIVE_MODES` | `… M3 (…): W3 RED` |
| M4 | the hermetic half runs `report` (the ajv half reads state) instead of `lint` | `… M4 (…): W4 RED` |
| M5 | the schema half is no longer named LIVE | `… M5 (…): W5 RED` |
| M6 | the retire callback re-types the release inline | `… M6 (…): W6 RED` |
| M7 | the hermetic `gates` mode returns before it runs the gate | `… M7 (…): W7 RED` |

### 5.2 The seat's suite measurement — `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` (`node ci/mgat/tools/suite.mjs a583afb base|build`, T plant, linux, 19 Nov 2026)
- base: `mgat suite a583afb base: exit 2 · organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)`
- build: `mgat suite a583afb build: exit 2 · organism_test: 144 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)`
- The three reds are the SAME on both: the `_selftest_coverage_law` assert, `SUITE MEMBER · sandbox selftest exits 0`, and
  the roll-up of the suite members. None of them touches a file of this build. They are reds on this linux temp tree, and
  the neutral machine (windows) read `5de84f7` GREEN (§8), so they are not named here as anything but this seat's
  environment (N6). LIVE names differ by exactly one: base only `MODE gates`, build only `gates schema half`. The one new
  pass is the `GATES —` assert.

## 6. FORKS (each the architect's to rule)

- **F1 · the order of the two halves.** (A) ONE build carries the site fates AND the LIVE exit, so the landing's head
  reads `ok GATES` and the base reads `LIVE MODE gates`, and nothing new is red · (B) two builds: the sites first, then
  the LIVE exit · (C) the LIVE exit first. **Recommend A.** C is ruled out by measurement: a head that ADDS the
  `GATES` member while no-empty reads 268 goes RED on a new member (§3.3; base witness W1 RED + W3 RED). B costs one
  more neutral verdict and buys nothing W1-W7 do not already show together. What decides it: the neutral verdict on
  an A build (one run of `suite.yml`).
- **F2 · how a designed empty block is told apart.** (A) a comment inside the block naming why (four sites, the
  idiom `captains_call.mjs` already uses ten times; the count falls, `LINT_BASELINE` is untouched) · (B) re-base:
  raise `LINT_BASELINE["no-empty"]` by the designed sites (loosens the gate; the brief allows it only when it is
  measured as designed) · (C) give every site a binding and a `swallow()` call (swallow.mjs's law binds none of the six,
  §2.1; it adds a ledger row per process for a failure no reader acts on). **Recommend A.** It is the only option where
  the gate stays at least as strict. What decides it: W1 + W2 on the build (GREEN, §4) and the mutant M2 (§5). They
  show a stripped comment is caught.
- **F3 · S4's merged-line drop.** (A) declare only (the cost is on the safe side: a card stays live) · (B) also COUNT
  the dropped lines: `parseRows` returns them, and `readGradeQueueSince` carries `dropped` beside `why`, with no state
  shape change (the cursor field is the same). **Recommend A now, B as its own unit** if a measurement on his laptop
  ever shows a dropped line (§7 N3). What decides it: `node scripts/captains_call.mjs` grade-queue lines that do not
  parse, counted on his real queue.
- **F4 · S2/S3 by fold, or declared in place.** (A) fold the copy into one `releaseLock()` (W6) · (B) declare the
  copy with the original's comment. **Recommend A.** It removes the copy that made the rise, and the guard shows
  cortex's own selftest unchanged (§4.2). What decides it: the cortex selftest on the build on his laptop (N2).
- **F5 · the pre-existing copies' originals** (`groundsman.mjs:44`, `captains_call.mjs:103` ×2, `cortex.mjs:2284-2285`
  under A of F4, and the other 258): inside the frozen 262 they are not this unit's. (A) leave them · (B) a later unit
  declares them and RATCHETS the baseline down. **Recommend A here.** Each one removed later is a fall the gate already
  prints (`LINT FELL … tighten`).
- **F6 · the `gates` SELFTEST** is a separate LIVE member (`organism_test.mjs:116`, `LIVE_SELFTESTS`). (A) out of this
  unit · (B) census it here. **Recommend A.** mlaw's census (`ci/mlaw/tools/summarize.mjs`) already holds the selftest
  class. Not re-measured.
- **F7 · LIVE_MODES is edited by two units.** mlaw proposes `lawpack` leave the same object (`organism_test.mjs:213`).
  (A) whichever lands second re-cuts on the first (disjoint lines, `:212` vs `:213`) · (B) one build for both.
  **Recommend A.** The edits touch adjacent lines, not the same line. What decides it: `git merge-tree` of the two build
  branches.

## 7. NAMED NOT GUESSED (a cloud seat cannot reach these; what measures each on his laptop)

- **N1 · Windows wall time of the hermetic `gates` mode** on the CI runner (tsc + eslint over every organ). The
  workflow's ceiling is `suite.yml:60`. The mode's own spawn already carries its existing ceiling (`organism_test.mjs:2670`).
  Measured by: the build's first neutral run. Its step time is in the run's log.
- **N2 · the six fates on Windows:** EPERM/EBUSY for S1 (an antivirus lock on a temp file), and the cortex retire
  on a live keeper. Measured on his laptop by: `node scripts/groundsman.mjs selftest` and `node scripts/cortex.mjs
  selftest` on the build branch, and `node scripts/keeper.mjs` status after one armed retire. That last one is a live
  daemon, so it is never done from a witness.
- **N3 · whether his real grade queue has ever had a line that does not parse** (F3). Measured on his laptop by a read
  of the queue through captains_call's exported `readGradeQueueSince` with the dropped-line count of F3 B. A cloud seat
  must not read his state.
- **N4 · CRLF trees.** Every count here is on an LF tree. eslint's `no-empty` is line-ending-blind by rule, and mlaw
  §2.6 measured the same 262 frozen value on LF. The neutral machine is CRLF (`suite.yml`, windows-latest). Measured
  by: the build's neutral run (W1's count is printed in its `GATES` assert only on red).
- **N5 · the full profile on his live state** (the ajv half now reads `captains_call.json` and `models.json`, which no
  checkout carries). Measured on his laptop by: `node scripts/gates.mjs report` on the build branch.
- **N6 · the three linux-only reds of §5.2** (coverage law, sandbox selftest, the roll-up). They are the same on base and
  build, and the neutral machine read `5de84f7` GREEN. Why they are red on a linux temp tree was not chased (not this
  unit). Measured by: the same `suite.mjs` run on windows, or the neutral run's head output.

## 8. THE NEUTRAL MACHINE ON THIS BRANCH
Check runs of this branch's pushes, read through the public API without a token
(`curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`), 19 Nov 2026:

| Push | node 22 | node 24 |
|---|---|---|
| `5de84f7` (step 1) | `135302564171` completed success | `135302564459` completed success |
| `236d72f` (step 2) | `135305179549` cancelled (superseded by the next push) | `135305179168` cancelled |
| `787d6b2` (step 3) | `135307261882` cancelled (superseded) | `135307261544` cancelled |
| `9d1cbe8` (witness) | `135308651018` completed **failure** | `135308651239` completed **failure** |

`9d1cbe8`'s RED is this spec's own: the B1 verdict annotation names ONE new red, `LOAD ZERO BLOCK 7 · no canon file
states a live count a command can produce` (base red 1, the coverage law, not new). Its cause was the §3.2 table row
holding a suite count with no date within two lines (`node ci/mgat/tools/canon.mjs ci/mgat/MGAT_SPEC.md`, the
scan's regexes copied from `organism_test.mjs:1898-1915`, read `1 undated live-count line(s)` at line 112). Dated in the
next push. The same tool then read `0 undated live-count line(s)`. The final push's runs are named in the seat's FINAL
message, because a file cannot carry its own sha's verdict.

The branch adds only `ci/mgat/**` (no organ, no state), so the head and the merge base run the same organs. A GREEN
here says this branch made nothing red. It cannot say anything about the build, which is on no branch (the witness
runs it on temp trees only).

## 9. FILES A BUILD WOULD TOUCH (and nothing else)

1. `scripts/groundsman.mjs` — S1 (`:263`).
2. `scripts/cortex.mjs` — S2/S3 fold (`:2274`, `:2281-2285`, `:2344`).
3. `scripts/captains_call.mjs` — S4/S5/S6 (`:1691`, `:1699`).
4. `scripts/organism_test.mjs` — LIVE (`:212`) and HALF (`:2670`).

NOT touched, by design: `scripts/gates.mjs` (no baseline moves, no new verb), `eslint.config.mjs`, any state file,
`.github/workflows/suite.yml`. Any file beyond these four is a fork for the architect, not this build's. The exact
bytes are `ci/mgat/tools/build.mjs` `EDITS`. A build seat applies them with each `from` matched exactly once, or the
build refuses.
