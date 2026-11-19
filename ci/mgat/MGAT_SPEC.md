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
| `organism_test.mjs gates` (full) | `4 passed, 1 failed` | same | same |

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
