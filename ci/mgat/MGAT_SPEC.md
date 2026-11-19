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
