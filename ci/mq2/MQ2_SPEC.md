# MQ2 SPEC — the thalamus config file has two writers on main (forks row 1161 (6))

**HEADLINE (2026-11-19):** at main `fb42118` the file `dressing-room/state/thalamus_config.json` has **three** writers,
not two. The code graph sees two (`gate_tune.mjs`, `thalamus.mjs`); the third (`watchman.mjs` `probeWakeEconomy`, the
LADDER G15 wake-economy re-fit) is invisible to it. **No header claims SOLE WRITER of the file.** Each writer claims a
KEY lane in prose (gate_tune: `tiers` · thalamus: the `adjudicator` block · watchman: `deep.est_tokens_per_wake`), and
no code holds that partition. The three write in **two different formats**. Measured on a planted file: one
`gate_tune apply` turns the file into indent-2, and after that the thalamus 818 setter **refuses the file** (exit 2, "not
byte-equal on the JSON.stringify(o, null, 1) round trip"). That is a live defect between organs, and the reason this row
is more than bookkeeping. All three do whole-file read-modify-write with no cross-process guard. The install script turns
on run-on-next-wake for every task, so after a missed night the two nightly writers can fire together.
**Recommendation: fate A.** `thalamus.mjs` becomes the declared SOLE WRITER through ONE narrow exported writer with a
closed table of per-caller key lanes. It writes in one format (indent 1, the live file's measured format) and guards
against a stale read. `gate_tune` and `watchman` call it. No allowlist entry is added, because a gate may only get
stricter.

Unit mq2 · CLOUD SPEC SEAT · spec only, nothing built. Branch `claude/mq2-spec`. Ledger: `ci/mq2/LEDGER.jsonl`.

## 0 · The base

- Cut from `origin/main` **fb42118** (`fb4211870093e6b8657655eb02ebcfc425f1eab1`) by `git fetch origin main; git checkout -b
  claude/mq2-spec FETCH_HEAD`, 2026-11-19T12:26:55Z. The clone is shallow (`git rev-parse --is-shallow-repository` → `true`).
- Blobs at the cut (`git hash-object`): `scripts/thalamus.mjs` f529fcf · `scripts/gate_tune.mjs` f998c7e ·
  `scripts/watchman.mjs` ee43176 · `scripts/xray.mjs` 47b9de0 (the same xray blob the mxb spec cut on).
- The input: `git show 4d329ff:ci/mxb/MXB_SPEC.md` (§3 "Q2 stays at its base row", §6 F-Q2), read whole.
- `npm ci --ignore-scripts` first (acorn, the IR's parser, is a devDependency; the clone had no `node_modules`).
- The hermetic suite at the cut, 2026-11-19 (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`):

```
organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
  · [UNRULED] EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)
      orphaned: deck_lint, home_pin, probe, study_scope
```
  That one RED is already on main, has nothing to do with this unit, and this spec does not touch it.

- **The probe** (`ci/mq2/witness/probe_base.mjs`, committed with this spec). It plants a synthetic config under
  `os.tmpdir()` and never reads his file. On the cut, 2026-11-19:

```
node ci/mq2/witness/probe_base.mjs --repo .
P1 gate_tune apply exit 0 · file after apply indent2 · 818 setter exit 2
P1 RED — the setter must still work after an apply
P2 writers gate_tune.mjs,thalamus.mjs · readers dugout.mjs,gate_tune.mjs,thalamus.mjs · Q2 rows for it 1 · Q5 0 · declared sole none · allowlisted false
P2 RED — one declared writer, no Q2 row, no allowlist entry
P3 watchman edge in IR false · watchman STATE_DIR env door false
P3 RED — a plant can reach watchman's refit writer
mq2 probe: 3 RED of 3
```

## 1 · The writers, by file:line (base fb42118)

Command: `grep -rn '"thalamus_config.json"' scripts/*.mjs` plus reading each write site. Last line of the grep:
`scripts/watchman.mjs:1918:    const p = join(STATE_DIR, "thalamus_config.json");`

| # | writer | path built | read | write | format written | trigger |
|---|---|---|---|---|---|---|
| W-a | `gate_tune.mjs` `apply` | `CONFIG` `:67` (`STATE_DIR` `:55`, env door `ARSENAL_GATETUNE_STATE_DIR`) | `:208` | `:210` `writeAtomic(CONFIG(), r.cfg)` → `:76-80` | `JSON.stringify(obj, null, 2)`, no newline (`:78`) | his haan on a wind-tunnel card: `captains_call.mjs:1835` spawns `gate_tune.mjs apply <file>` |
| W-b | `gate_tune.mjs` `score` (auto-revert) | `CONFIG` `:67` | `:252` | `:253` `writeAtomic(CONFIG(), applyRevert(cfg, live, now))` | same `writeAtomic`, indent 2 | nightly: `nightshift.mjs:1345` `execFileSync(… "gate_tune.mjs", "score")` (task ArsenalFC-NightShift, `setup/INSTALL_CYBORG_TASKS.ps1:137`, 02:40) |
| W-c | `thalamus.mjs` `config adjudicator-role` (unit 818 setter) | `CONFIG` `:136`, or `--config <path>` whose basename must equal it (`:2942`) | `:2944` `readConfigBytes` (bytes, `:2883`) | `:2952` `writeAtomic(path, ed.out)` → `:166-171` | a STRING `JSON.stringify(out, null, 1)` (`:2920`); it **refuses** any file that is not byte-equal on that round trip (`:2889`) | by hand / a session (CLI); dispatched before the daemon's imports (`:3091`) |
| W-d | `watchman.mjs` `probeWakeEconomy` (LADDER G15) | `p = join(STATE_DIR, "thalamus_config.json")` `:1918`; `STATE_DIR` `:122` has **no env door** | `:1919` `readJson(p)` | `:1925` `writeFileSync(p + ".tmp" + process.pid, JSON.stringify(c, null, 1)); renameSync(…, p)` | indent 1, no newline | nightly: `watchman.mjs:2137` inside the sweep (task ArsenalFC-Watchman, 23:55 by `scripts/daykey.mjs:282` / `scripts/limits.mjs:545`), only once ten honest cortex rows exist (`:1909`) and only if the fit moved (`:1922`) |

**What each write puts in the file.** Every writer rewrites the WHOLE file from its own read. The KEYS each one changes:
- W-a: `tiers` (merged with `p.diff.new`, `:136`), `_gate_tune_legacy["tiers@<date>"]` (`:135`), `_gate_tune_receipt` (`:137-142`).
- W-b: `applyRevert` `:178-185`: `tiers` merged with `live.revert_diff.new` (`:179`) and `_gate_tune_receipt` extended with `reverted_at`, `reverted_id`, `revert_why` (`:180-183`).
- W-c: `adjudicator.role` only (it never writes `enabled`), plus `_adjudicator_model_retired_<YYYY-MM-DD>` placed directly
  after the block when a `model` key is retired (`:2898-2909`). Its post-condition (`:2910-2919`) proves every other key
  is byte-identical before any byte moves.
- W-d: `deep.est_tokens_per_wake` (`:1923`), `_wake_economy_refit` (`:1924`).

**Why the graph sees two of the three.** `xray.mjs` records a write for W-a at `gate_tune.mjs:79` and for W-c at
`thalamus.mjs:170` (the two `writeAtomic` renames, `xray.mjs:509-513` models `renameSync` as WRITE(dst)). For
watchman.mjs it records no edge to the file at all, neither the read `:1919` nor the rename `:1925`. It does record the
IIFE read at `:1905` in the same function (measured: `ir.organs["watchman.mjs"].reads` holds `brain_ledger.jsonl@1905`
and nothing between `:1906` and `:1935`). The arrow that does both acts is the right operand of `deps.writeCfg || ((f) =>
{…})`, bound to `const write` (`:1917`) and called as `write(fit)` (`:1927`). That is the same family as mxc's "context of
a const arrow" gap. **Named, not diagnosed further here.** mxc owns the evaluator (§5 F-XRAY).

## 2 · Which header claims SOLE WRITER

Command: `grep -n "SOLE WRITER\|sole writer\|single writer\|DECLARED OWNER\|owns ONLY" scripts/{gate_tune,thalamus,watchman}.mjs`
plus the IR's own reading. `ir.declared_sole_writers.filter(d => d.file === "thalamus_config.json")` → `[]` (2026-11-19).

- **None claims the FILE.** That is why Q5 is 0 for this row and why only Q2 catches it.
- `gate_tune.mjs:18-19`: "the DECLARED OWNER of thalamus_config.json's `tiers` edits made under the wind-tunnel lane"
  (`:45` WRITES: "thalamus_config.json (tiers, under the ruling above)"). That is a key-lane claim.
- `thalamus.mjs:66-67` and `:2867`: "the SOLE writer of the adjudicator block". That is a key-lane claim too.
- `watchman.mjs:1899-1900`: "this probe owns ONLY this one key + its receipt". A third key-lane claim, inside a comment.
- **A stale header, named:** `thalamus.mjs:34-43` says "ONE file outside that five is written, and only as an APPENDER
  on the DOCUMENTED shared lane: brain_ledger.jsonl". Since unit 818 (`:2862`) this organ also writes
  `thalamus_config.json`, so the sentence is false at the cut.

## 3 · Every reader (base fb42118)

| reader | site | what it reads | when |
|---|---|---|---|
| `thalamus.mjs` `loadConfig` | `:266` (default `CONFIG` `:136`) | the whole file, merged over `DEFAULT_CONFIG` `:175` | the daemon ONCE at start (`:3103`, no hot reload; gate_tune `:213` says "restart the thalamus"); also `:1378` adjudicate, `:2854` status, selftest sites |
| `cortex.mjs` | `:66` imports `loadConfig as loadThalamusConfig`; calls `:708`, `:1001`, `:1989`, `:2293` | `deep.*` among others (`:836` `cfg.deep.est_tokens_per_wake`, W-d's key) | per cortex wake |
| `nightshift.mjs` | `:120` import; `:1314` `windTunnel(rows, … loadThalamusConfig(), …)` | `tiers` (the tunnel measures the drift W-a's DRIFT GUARD checks) | nightly 02:40 |
| `dugout.mjs` | `:2650` `readJson(join(STATE_DIR, "thalamus_config.json"))` | the whole file, for a status tool | on call |
| `models.mjs` `configCheck` | `:633-635` (`readdirSync(stateDir).filter(f => f.endsWith(CONFIG_SUFFIX))`, `CONFIG_SUFFIX` `:624`) | every `*_config.json`, this one included (LAW M's scan of `adjudicator.model`) | `models.mjs check` |
| `gate_tune.mjs` | `:208`, `:252` | read-to-write (W-a, W-b) | — |
| `watchman.mjs` | `:1919` | read-to-write (W-d) | — |

The IR names three of these readers (`dugout.mjs, gate_tune.mjs, thalamus.mjs`, probe P2). cortex and nightshift read
through thalamus's exported `loadConfig`, so the IR charges their reads to thalamus. models reads by `readdirSync`, and
watchman's read is the blind arrow from §1.

## 4 · Can the writes interleave?

**Yes, and the harm comes in two kinds.**

1. **The format clash. It needs no race, and the probe measured it (P1, RED on base).** W-a and W-b write indent 2;
   W-c demands indent 1 and refuses anything else (`:2889`); W-d writes indent 1. The live file is indent 1 at the cut (measured as
   a boolean only, no content printed: `JSON.stringify(o, null, 1) === text` → `true`, and `_gate_tune_legacy` is present,
   so at least one apply happened and something rewrote the file at indent 1 afterwards). **After the next `gate_tune apply`
   or auto-revert, the 818 setter is dead** until W-d happens to rewrite the file, and W-d rewrites only when the fit moves
   (`watchman.mjs:1922`). Nothing reports this: the setter's refusal is correct by its own law (`:2889`).
2. **A lost update (a race, not measured live).** Each writer runs read → modify a JS object → tmp + rename, with no
   lock and no check that the file is unchanged between its read and its rename (W-a `:208→:210`, W-b `:252→:253`,
   W-c `:2944→:2952`, W-d `:1919→:1925`). If two processes overlap, the later rename silently drops the keys the earlier
   one wrote. W-a's DRIFT GUARD (`:131-132`) compares `tiers` only, so it cannot see a W-d or W-c key move. **Opportunity:**
   W-b runs at 02:40 and W-d at 23:55 by slot, but `setup/INSTALL_CYBORG_TASKS.ps1:177,183` sets `StartWhenAvailable =
   $true` on every task ("run-on-next-wake"). So after a night the laptop slept through, both fire at wake. W-c (hand)
   and W-a (his haan) can come at any time. Whether the live tasks carry that setting is NAMED (§7).
3. **The tmp names.** W-a/W-b use `<path>.<pid>.tmp`, W-c `<path>.<pid>.tmp`, W-d `<path>.tmp<pid>`. Two processes never
   share a tmp name, so no torn file: rename is atomic. The harm is only the lost update in (2).

## 5 · The fates (lettered), each with the witness clause that holds it

### A · ONE writer — `thalamus.mjs` SOLE WRITER through ONE narrow exported writer ★ recommended
`thalamus.mjs` exports `patchThalamusConfig(lane, patchFn, { path, why })`. Its contract:
- **A CLOSED lane table in thalamus.mjs**, one row per caller and never an open setter (row 834 (3)'s NARROW law):
  `gate_tune:tiers` → keys `tiers`, `_gate_tune_legacy`, `_gate_tune_receipt` (the same keys `applyRevert` stamps,
  `gate_tune.mjs:179-183`) · `watchman:wake_economy` → `deep.est_tokens_per_wake`,
  `_wake_economy_refit` · `setter:adjudicator` → `adjudicator`, `_adjudicator_model_retired_*` (the 818 verb routes
  through it, keeping its own byte post-condition). A lane name not in the table, or a patch that changes any key outside
  the lane, is refused by name and nothing is written.
- **ONE format:** `JSON.stringify(o, null, 1)`, no trailing newline. That is the live file's measured format and the one
  W-c already demands.
- **A stale-read guard:** read bytes → sha → patch → re-read bytes just before the rename. If the sha moved, refuse
  loudly and write nothing (no retry loop, no number). Fork F3 decides the guard's kind.
- `gate_tune.mjs` `apply` (`:210`) and `score` revert (`:253`) call it; its `writeAtomic` stays for the ledger only.
  `watchman.mjs` `probeWakeEconomy`'s default `writeCfg` (`:1917-1926`) calls it. watchman already imports from
  thalamus (`watchman.mjs:118`); gate_tune gains one import.
- Headers: `thalamus.mjs` says "SOLE WRITER of thalamus_config.json (through patchThalamusConfig; lanes: …)" and fixes
  the stale `:40` sentence. `gate_tune.mjs:18-19,45` says it OWNS the tiers proposal lane and WRITES THROUGH
  `thalamus.patchThalamusConfig`. `watchman.mjs:1899` does the same for its key.
- watchman gains an env door on its STATE_DIR (`:122`), so a witness can plant W-d (probe P3). This is a test door
  only, the same shape as `ARSENAL_GATETUNE_STATE_DIR`.

**Witness clauses for A** (each plant RED on base `fb42118`, GREEN on the build; every tree under `os.tmpdir()`):

| clause | plant / check | base | build |
|---|---|---|---|
| A1 FORMAT-APPLY | indent-1 planted file → `gate_tune apply` → file is indent 1 AND the 818 setter then exits 0 | RED (probe P1: indent2, setter exit 2) | GREEN |
| A2 FORMAT-REVERT | plant a live mutation past its window, out of band → `gate_tune score` reverts → file indent 1, setter exits 0 | RED (`:253` → `:78` indent 2; to be RUN in the build seat) | GREEN |
| A3 WATCHMAN-REACH | with watchman's env door → `probeWakeEconomy` with ten planted honest rows → the key and receipt land, every other key byte-identical, file indent 1 | RED (probe P3: no door) | GREEN |
| A4 LANE FENCE | `patchThalamusConfig("watchman:wake_economy", o => { o.tiers.tau0 = 9 })` and an unknown lane are refused, file unchanged | RED (no such export: `grep -n "export function patchThalamusConfig" scripts/thalamus.mjs` → nothing) | GREEN |
| A5 STALE READ | between the writer's read and its rename (a planted hook), another lane's write lands → the first writer refuses and the second writer's key survives | RED (no guard: a whole-file write from a stale object is accepted, `gate_tune.mjs:208→210`) | GREEN |
| A6 GRAPH | `queries(build())` on a planted tree: no Q2 row for the file, `MULTI_WRITER_ALLOWLIST` unchanged, Q5 0 | RED (probe P2: Q2 row 1) | GREEN |
| A7 DECLARED | `ir.declared_sole_writers` names `thalamus.mjs` for `thalamus_config.json` and Q5 stays 0 | RED (probe P2: declared none) | GREEN |
| A8 SAME BODY | the law pack and the hermetic suite, base vs build: no new RED; `xray` unresolved per organ only falls | — | GREEN |

**Mutants, one per clause** (each must turn its clause RED on the build):
M1 the writer emits indent 2 → A1 · M2 `score`'s revert keeps its own `writeAtomic(CONFIG(), …)` → A2 · M3 the watchman
door removed → A3 · M4 the lane-key check dropped → A4 · M5 the re-read sha compare dropped → A5 · M6 `gate_tune apply`
keeps a direct `writeAtomic(CONFIG(), …)` → A6 (Q2 row returns) · M7 the SOLE WRITER header line removed → A7 · M8 the
`:40` stale sentence kept AND a new state write added to thalamus → A8's law pack row (if no law reads it, M8 is NAMED as
unkillable and A8 narrows to the suite diff).

### B · A DECLARED SHARED KEY LANE
The file joins `MULTI_WRITER_ALLOWLIST` (`xray.mjs:1066-1068`) with a "shared key lane" declaration in each writer's
header (grep-able like brain_ledger's "shared append lane", `talk.mjs`), plus ONE shared format helper.
Witness: A1, A2, A3 (format and reach), A5 (the guard still needed), and B6: Q2 is 0 BECAUSE the path is allowlisted,
with the header line present in all three writers (`grep -c "shared key lane"` = one per writer).
**Against:** it LOOSENS a gate (Q2 stops judging this file for any future fourth writer), and the brief's law is that a
gate may only get stricter. It also keeps three organs that each must remember the format and the guard.

### C · SPLIT THE FILE
watchman's `est_tokens_per_wake` moves to its own file (watchman sole writer), and `thalamus.loadConfig` overlays it. The
adjudicator block and the tiers stay with thalamus, with gate_tune writing through thalamus as in A.
Witness: A1, A2, A6, A7 and C3: cortex `:836` reads the same `est` value from the overlay as it read from the old key.
**Against:** a reader shape moves (cortex, `models configCheck`), and the old key needs a `*Legacy` freeze (L9). It is
more surface than A for one key.

### D · FIX THE FORMAT ONLY, keep three writers
gate_tune's `writeAtomic` writes indent 1. Witness A1, A2. Q2 stays at its base row, and the lost update stays open. This
is a fix for the defect, not a fate for the law. It is listed because it is the smallest landing that unblocks the 818
setter.

## 6 · FORKS (the architect rules)

- **F1 · the fate.** (A) one writer by exported writer · (B) declared shared key lane · (C) split the file · (D) format
  only. **Recommend A.** B loosens Q2. C moves readers for one key. D leaves the law broken. Decider: A6 + A7 GREEN with
  the allowlist untouched, and A8 showing no new RED.
- **F2 · does A's exported writer break row 834 (3) ("no general setter is born")?** (a) no: a CLOSED lane table of three
  named callers is narrow, and the 818 verb stays the only CLI · (b) yes: each lane must be its own named export
  (`applyTiers`, `refitWakeEconomy`, `setAdjudicatorRole`) with no lane argument. **Recommend b** if the architect reads
  834 (3) strictly. It costs three small exports instead of one. Decider: the ruling text of row 834 (3), which this
  seat cannot read (§7).
- **F3 · the cross-process guard.** (a) re-read sha before rename, refuse on change (no lock file, small residual
  window between compare and rename, named) · (b) an exclusive lock file next to the config (`openSync(…, "wx")`), which
  needs a stale-lock story · (c) none, relying on the slots. **Recommend a.** Decider: §7 N1 (whether run-on-next-wake is
  live). If it is, c is out.
- **F4 · the format.** (a) indent 1, no newline: the live file (measured) and W-c's demand · (b) indent 2: gate_tune's.
  **Recommend a.** (b) would need the 818 setter's round trip rewritten, and it would reformat his file once.
- **F5 · xray's blindness to watchman's `||`-arrow writer** (`watchman.mjs:1917`). (a) A removes the inline writer, so
  the blindness is moot for this file; report it to mxc as one more const-arrow case · (b) hold mq2 until mxc lands.
  **Recommend a.** Decider: mxc's spec, if its const-arrow rule names a LogicalExpression init.
- **F6 · the stale `thalamus.mjs:40` sentence.** (a) fixed in A's build (A edits that header anyway) · (b) its own row.
  **Recommend a.**
- **F7 · his live file.** (a) no write at landing: it is indent 1 already (measured), and A only changes who writes next ·
  (b) a one-time normalisation. **Recommend a.** (b) touches his state for nothing.
- **F8 · selftest wiring.** If A adds `patchThalamusConfig` asserts to `thalamus.mjs selftest`, they are judged by the
  existing suite wiring. (a) the witness lives in `ci/mq2/witness/` only · (b) both. **Recommend b.** The selftest is what
  survives the seat.

## 7 · NAMED, NOT GUESSED (unreachable from the cloud)

- **N1** whether the LIVE tasks ArsenalFC-Watchman and ArsenalFC-NightShift carry `StartWhenAvailable`, and whether they
  have ever run in the same minute. On his laptop: `schtasks /query /tn ArsenalFC-Watchman /xml` and
  `schtasks /query /tn ArsenalFC-NightShift /xml` (the `<StartWhenAvailable>` element), plus their Last Run Time.
- **N2** whether a gate_tune mutation is live right now, which decides if W-b can fire tonight: `node scripts/gate_tune.mjs
  status` on his machine. This seat does not print state.
- **N3** the file's format history: this clone is shallow (one commit touches the file). On a full clone:
  `git log --format=%h -- dressing-room/state/thalamus_config.json`, then run the round-trip check per commit
  (`ci/mq2/witness/probe_base.mjs` shows the predicate) to find the commit where an apply left indent 2.
- **N4** whether the 818 setter has ever been refused in his use: his terminal history. No organ journals a refusal
  (`thalamus.mjs:2925` only prints).
- **N5** the ruling text of row 834 (3) and of LADDER G15's "blanket ladder haan" (`watchman.mjs:1924`). They live in the
  forks ledger, which this repo does not carry. It decides F2.
- **N6** whether the thalamus daemon is up and when it last restarted. It loads the config once (`thalamus.mjs:3103`), so a
  write only bites after a restart: `node scripts/services.mjs status` on his machine.

## 8 · Files a build would touch (fate A)

- `scripts/thalamus.mjs`: the export, the lane table, the header, the 818 verb routed through it, selftest asserts (F8).
- `scripts/gate_tune.mjs`: `apply` `:210` and `score` `:253` through the export; the header `:18-19`, `:45`.
- `scripts/watchman.mjs`: `probeWakeEconomy`'s default writer `:1917-1926` through the export; the STATE_DIR env door
  `:122`; the comment `:1899`.
- `ci/mq2/witness/witness_mq2.mjs` (new), A1-A8 and M1-M8.

**Beyond them, each a fork:** `scripts/xray.mjs` (untouched under A; the allowlist under B) · `scripts/cortex.mjs` and
`scripts/models.mjs` (readers, untouched under A; moved under C) · `scripts/captains_call.mjs:1835` and
`scripts/nightshift.mjs:1345` (spawn the gate_tune CLI, untouched) · `xray_graph.json` re-freeze (the runner's act at a
landing, mxb F-SELFTEST / mxh F-B).

## 9 · The neutral machine

The CI check runs for this branch's tip are read with
`curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` (no token). They are recorded
in the FINAL MESSAGE and in `ci/mq2/LEDGER.jsonl`. The suite workflow (`.github/workflows/suite.yml:43-45`, push on
`**`) is the one that runs on a non-main branch.

**Check runs of `d11aa70` (the spec's first push), read 2026-11-19 by the curl above:** workflow run 44525377613 —
job 135564419787 `npm test · node 22` **success** · job 135564420245 `npm test · node 24` **success**.

**The effort receipt (2026-11-19):** `node campaign-2026-09/tools/effort_receipt.mjs --fleet mq2 --seat 00 --model
claude-opus-5-5` → `Error: Cannot find module '/home/user/arsenal-ai-fc/campaign-2026-09/tools/effort_receipt.mjs'`
(exit 1). This repository does not carry `campaign-2026-09/`, so nothing was written under it.
