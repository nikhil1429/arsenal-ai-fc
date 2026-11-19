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
