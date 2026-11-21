# UNIT MCRK · PROOF — the pacer's `crack` verb, sole writer of the crack row

> Forks rows 1173 (1) / 1189, his words 266 / 268 / 270 / 271 / 272 / 273. A BUILD on a seat branch: nothing here is
> landed, merged or moved onto main. Spec: `ci/mcrk/MCRK_SPEC.md` on `claude/mcrk-spec` @ 02c6f57. Where the spec and row
> 1189 differ, ROW 1189 WINS, and §6 names each difference. Every number below is a command with its last line, measured
> 20 Nov 2026 in the cloud container. The act log is `ci/mcrk/LEDGER.jsonl`.

## 1 · BASE

```
$ git fetch origin main && git rev-parse FETCH_HEAD          # 20 Nov 2026, at the cut
5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90
$ git checkout -b claude/mcrk-build FETCH_HEAD
$ cat ci/mcrk/BASE
5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90
```

Both trees are LF git worktrees (`git -c core.autocrlf=false worktree add --detach <dir> <sha>`) of 5759cce and of the
build tip, `node_modules` linked from one `npm ci --ignore-scripts`.

## 2 · WHAT IS BUILT (the named files, nothing else)

| File | What |
|---|---|
| `scripts/forge_session.mjs` | LAWS header: SOLE WRITER of `dressing-room/state/cracks.jsonl`. MODES names `crack`. `export const CRACKS`, `crackRow` (pure), `readCracks`, `sameCrack`, `appendCrack` (append, then read back). `case "crack"`: `live(need(load()))`, the bank read through the existing `readBank`, `crackRow`, the idempotence check, `appendCrack`. It never calls `save()`/`apply()`, and it prints the LENGTH of his words, never the words. The contract carrier rides the existing question-moments line (mcrk-5 a). `close` counts the session's crack rows. The `default` branch REFUSES an unknown verb by name, exit 1 (`process.exitCode`, because this body also runs inside a hook's CALL); the bare call keeps the usage, exit 0. Six selftest cases. |
| `scripts/notes_compiler.mjs` | `compileDay` reads the rows once through `readCracks` (absent and unreadable are both named on the result and the summary line, never fatal). `buildNote({…, cracks})`: each row of the concept and axis attaches to the FIRST teacher record at or after it, before his next record. That turn's first unstamped crack item gains `moment`, `words`, `crack_id` and `words_at`; `galat`/`sahi` stay `diffBlocks(x.text)`. A row whose turn has no diff is an item with `galat:[]`, `sahi:[]` and the gap `crack row <id> has no ```diff in its turn — the teacher's diff is missing`. The render puts his words on their OWN `[N … · crack <id>]` line above the `[T] CRACK` line (G-B). With no rows the note is byte-equal to the base build's, so no note recompiles at the landing. Three selftest cases. |
| `.gitignore` | `dressing-room/state/cracks.jsonl` (mcrk-2 a). `git check-ignore -v` → `.gitignore:119`. |
| `.claude/skills/forge/SKILL.md` · `.claude/skills/forge/REFERENCE.md` · `.claude/skills/learn/SKILL.md` | one line each, naming `node scripts/forge_session.mjs crack`, run in the same turn as the ```diff |
| `ci/witness/mcrk/witness_crack.mjs` | the CLAUSE witness: K1 … K9 by plants on copies under os.tmpdir() (its header is the contract) |
| `ci/mcrk/witness_mcrk.mjs` · `ci/mcrk/BASE` | the UNIT witness against BASE 5759cce: it runs the clause witness over `--org` with `--base-org` as its base, and adds BOUND and LAST |
| `ci/mcrk/run_mutants_mcrk.mjs` | one mutant per clause, plus the control |
| `ci/mcrk/PROOF.md` · `ci/mcrk/LEDGER.jsonl` | this file · the act log |

Untouched, as ruled: `scripts/teaching_gate.mjs`, `ci/witness/mcap/`, `scripts/study_scope.mjs` (it already admits the
verb), `scripts/teaching_audit.mjs` and `scripts/gaffer_brain.mjs` (both read only), and every file under
`dressing-room/state/`. The open study session on disk is not opened (§5).

## 3 · THE WITNESS, BOTH WAYS (last lines, 20 Nov 2026)

```
$ node ci/mcrk/witness_mcrk.mjs --org <LF tree of the build tip> --base-org <LF tree of 5759cce>     # exit 0
  GREEN K1 · 1 row · words byte-equal · tokenization axis c moment check_q
  GREEN K2 · crack exit 0 · rows 1 · 5 file(s) byte-equal (absent stays absent)
  GREEN CODEC BOUND · 9 of 9 codec bodies byte-equal · crackRow exported
  GREEN K2c · status identical · contract 9 line(s) vs base 9 · base lines kept · crack carrier on 1 line(s)
  GREEN K3 · (a) no prompt record refused · (b) prompt before the moment refused · (c) no axis ON refused · (d) stale session refused · (e) closed session refused
  GREEN K3b · first exit 0 · second exit 0 · "already written ck-…" · rows 1
  GREEN K4 · moment check_q at the last non-refused c entry
  GREEN K5 · 1 crack item(s) · moment check_q · words his, verbatim · crack_id ck-witness-0001 · diff the base build's
  GREEN K6 · row item galat 0 · sahi 0 · gap named · the row-less diff unstamped
  GREEN K7 · crack exit 0 · compile skipped/compiled · c18 0 (the broken answer has its crack row)
  GREEN K8 · contract names it · forge/SKILL.md names it · learn/SKILL.md names it · forge/REFERENCE.md names it · rails admits it
  GREEN K9 · unknown verb → exit 1 named · bare → exit 0
  GREEN BOUND · 10 file(s) differ
  GREEN LAST · 0 survivor(s)
GREEN MCRK the pacer's crack verb writes his verbatim words, concept, axis and moment as one gitignored row, never writes the session, refuses what it cannot prove, and the compiler stamps it on its turn's crack item keeping the teacher's diff · 14 clause(s)

$ node ci/mcrk/witness_mcrk.mjs --org <LF tree of 5759cce> --base-org <LF tree of 5759cce>          # exit 1
RED MCRK · K1, K2, CODEC BOUND, K2c, K3, K3b, K4, K5, K6, K7, K8, K9
```

On the base, every clause is RED for its own reason: `crack` falls to the usage line with exit 0 and writes nothing; the
contract and the three skills are silent; the compiler ignores the rows; an unknown verb exits 0. BOUND and LAST read
GREEN on the base leg because nothing differs and nothing survives. The member's layout was run too: only `ci/mcrk/`
copied into an empty working dir, so the clause witness is read from `--org`. The head leg printed the same GREEN line.

## 4 · THE MUTANTS (20 Nov 2026)

```
$ node ci/mcrk/run_mutants_mcrk.mjs --org <build tip tree> --base-org <5759cce tree>                  # exit 0
  M1 no crack case → K1 · M2 crack saves the session → K2 · M3 load re-stamps updated_at → CODEC BOUND ·
  M4 no contract carrier → K2c · M5 a placeholder for a missing prompt → K3 · M6 no idempotence → K3b ·
  M7 the FIRST moment → K4 · M8 words from the archive record → K5 · M9 sahi filled from his words → K6 ·
  M10 the axis of moments_log[0] → K7 · M11 no forge SKILL line → K8 · M12 unknown verb exits 0 → K9
run_mutants: 12 of 12 mutant(s) RED by the clause that names them · control GREEN
```

Each mutant edits ONE file of a copy, and only when its anchor occurs exactly once. Each must print `RED MCRK · <its clause>`.

## 5 · MEASUREMENTS, BASE → BUILD (each by command, 20 Nov 2026)

```
$ node scripts/forge_session.mjs selftest          # base 5759cce → build
forge_session selftest: 237 passed, 0 failed       →   forge_session selftest: 243 passed, 0 failed
$ node scripts/notes_compiler.mjs selftest
notes_compiler selftest: 45 passed, 0 failed       →   notes_compiler selftest: 48 passed, 0 failed

# the member lines of the two touched selftests (ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all),
# identical base and build:
  LIVE selftest forge_session — not run in the hermetic profile: reads state/concepts.json, state/registry.json …
  LIVE selftest notes_compiler — not run in the hermetic profile: reads state/captain.json

$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      # the build, in the session's own checkout
organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
#   the one FAIL is the base's own (spec §1 measured the same headline at 5759cce): "EVERY organ with a selftest is
#   wired into a suite" — orphaned: deck_lint, home_pin, probe, study_scope
$ (the same command in the two LF worktrees, base and build)
organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)     # base AND build
#   identical on both: the coverage law above, "SUITE MEMBER · sandbox selftest exits 0" and its roll-up. The sandbox
#   fail reproduces standalone in the worktree on BOTH trees (its tripwire records 2 of 4 attempts there): it belongs to
#   the worktree layout, not to this unit.

$ node scripts/lawpack.mjs gate        # base 5759cce, LF worktree (exit 1)
lawpack · 1940 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
  RED  jugad-literal-subject-list ROSE — 93, baseline 90. A gate may only get stricter (§10-D rule 6).
$ node scripts/lawpack.mjs gate        # build tip, LF worktree (exit 1)
lawpack · 1940 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
  RED  jugad-literal-subject-list ROSE — 93, baseline 90. A gate may only get stricter (§10-D rule 6).
#   byte-identical count line. Its one RED is the base's own. `lawpack report` is identical base vs build too.

$ node scripts/models.mjs check         # build tip (exit 0)
models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)

$ git check-ignore -v dressing-room/state/cracks.jsonl
.gitignore:119:dressing-room/state/cracks.jsonl	dressing-room/state/cracks.jsonl
```

**No count rose, and none was hidden.** The first build tip moved three things, each removed at its cause and never by an
ignore line:
- the raw match total rose by two (a `const rows = []` in `readCracks` and a selftest fixture array). Now `readCracks` is
  a filter pipeline and the fixture is `Object.freeze([…])`.
- one existing jugad finding (`forge_session.mjs:148`, `MOMENTS`) gained the lane tag in `lawpack report`. The new
  header prose said "his words", and lawpack's `LANE_SIGNATURE` reads the first 12 000 characters of a file. That prose
  now says "the text he typed".

**Canon count (row 1169):** every tracked `.md` of each pushed commit was replayed through the suite's LOAD ZERO
BLOCK 7 scan, over `git show <sha>:<path>` blobs. The tip before this proof read
`canon-count replay @ HEAD: 97 md blob(s) · undeclared 0 · declared 1` (20 Nov 2026).

## 6 · WHERE THE BUILD DIFFERS FROM THE SPEC (row 1189 wins; each one named)

- **Names guard on the crack row (spec §3.1): not run.** Row 1189 (2) makes `cracks.jsonl` ignored by git, and the
  compiled note, which is tracked and guarded at its own append, stays the one public copy. Running the guard from the
  pacer would mean `forge_session.mjs` importing `notes_compiler.mjs` (dynamic, string literal). The suite's NO SHIM
  CALLEE walk follows string-literal dynamic imports, and the pacer is a `turn_hook` callee, so its hook closure would grow by the
  compiler's whole graph. The guard on the compiled note is unchanged.
- **`readCracks` is imported STATICALLY by the compiler (spec §3.5 said dynamic).** `compileDay` is synchronous, and every
  caller (postmatch, its selftest) calls it that way. The pacer is already reached by the hooks, so this adds no new hook
  closure. Only `postmatch.mjs` imports the compiler.
- **Spec K2b is the clause `CODEC BOUND`.** It compares base against build, so it is a seat-time clause in the BOUND
  family. The suite member's `boundIds` drops it at later heads, as it drops BOUND, and a later unit's lawful edit to
  `load()` is not made red forever. It is RED on the base (crackRow absent) and GREEN on the build, like every clause.
- **K7 replicates mcap c18's predicate** (`b37ebfc:ci/witness/mcap/witness_capability.mjs:205-225`) instead of running
  the mcap witness, because ci/witness/mcap/ is not on main and is not touched (row 1189 (4)). The predicate is the same:
  a live note of day D, the same concept and axis, a crack item with a legal moment (`teaching_gate.mjs` MOMENT_KINDS, read
  from the tree), `fold(words) === fold(spoken)`, and `galat` and `sahi` both non-empty.
- **K9 UNKNOWN is a clause the spec did not have**: row 1189 (8) ("a silent exit 0 on an unknown pacer verb is fixed in
  the same build as a refusal by name"). Mutant M12 covers it.
- **K5's archive copy of his reply is the whitespace-folded text**, so the clause can tell "words from the row" (the
  prompt record's bytes) from "words from the archive record" (M8). **K7 plants an axis b moment before axis c's**, so
  M10 ("the axis of moments_log[0]") has something to catch.
- **No `--said` and no teacher fallback** (mcrk-1 a). No `moment:null` (mcrk-7 a). No teaching_gate rule (mcrk-5 a; unit
  mcrk2 is named for the stop-check and is not built here). `ci/witness/mcap/` is untouched (mcrk-4 is the runner's
  laptop measurement).
- **Waits:** the spec's "one timeout constant" is not typed (the brief: never type a timeout). Every spawn is a
  `spawnSync` that ends with its child, and the outer bound is the suite member's own `left`.

## 7 · THE REGISTRY ROW (mcrk-6 a): a state write, the LANDER's, NOT RUN HERE

```
node scripts/registry.mjs set --table emit_contract --json '{"subject":"cracks","surface":"forge_session.mjs","writes_to":"cracks.jsonl","fired_by":"teacher","witness":"ci/mcrk/witness_mcrk.mjs"}'
```

`registry.mjs` (`:77`) requires `witness` on an `emit_contract` row, and `:357-363` refuses a subject outside the
`emit_declared_set` mechanisms row unless the row carries `"ruling":"RULING__YYYY-MM-DD_slug"` naming a queue file. The
cloud cannot read the registry's state to know whether `cracks` is in that set (§8). If the set refuses, the receipt names
the door.

## 8 · NAMED, NOT MEASURED (the cloud cannot reach these)

- **His open session** (`forge_session.json` is gitignored). On his laptop, before and after the landing and after a `crack`:
  `node -e "console.log(require('crypto').createHash('sha256').update(require('fs').readFileSync('dressing-room/state/forge_session.json')).digest('hex'))"`
  and `node scripts/forge_session.mjs status` must both read equal. K2 and CODEC BOUND prove this by plants and by source
  bytes. The session is likely STALE, and `crack` refuses a stale one until the teacher's `resume`.
- **The prompt record is live on every study turn**, and UserPromptSubmit's write lands before the teacher's first tool call:
  one live turn on his laptop. Print only `prompt.at` and `prompt.session_id`, never the text.
- **mcrk-4**: the runner's measurement on his laptop over the capture rows. `ci/witness/mcap/` is left untouched.
- **xray Q2/Q5 on the build** (`node scripts/xray.mjs report`) is the lander's run. It writes xray's own state file, so a
  seat does not run it.
- **The neutral machine's verdict on the tip**: read through the public API (the ledger's `ci` row and the final message).

## 9 · FORKS (one line each)

- FORK mcrk-b1 · `CODEC BOUND` (spec K2b) sits in the BOUND family, so the member does not judge it at later heads. If the
  architect wants the codec frozen at every head, it is renamed `K2b` (one literal) and a later unit's `load()` edit
  becomes a ruling.
- FORK mcrk-b2 · K2c compares `status` and `contract` against the BASE code. A later unit that rewords the contract's base
  lines makes WITNESS ‹mcrk› red at that head. Keep it (the open-session claim is against base), or move it into the BOUND family too.
- FORK mcrk-b3 · the registry row's `ruling` field: needed only if `cracks` is outside `emit_declared_set`. That is a
  state read the lander makes.
- FORK mcrk-b4 · the names guard is not run on the gitignored crack row (§6). If his words should be guarded before they
  are even written privately, the guard must reach the pacer without growing its hook closure (a new owner-side export).

## 10 · ROW 1194 (1) — c18 BY TURN IDENTITY: STOPPED, A FORK (20 Nov 2026)

The ruling: join the crack row to its capture by the turn identity both records carry, never by time or text. It also
says: if no shared turn identity exists today, stop and name the fork. **None exists.** By command, at this tip:

- **The prompt record** (`scripts/teaching_audit.mjs:1635-1653`, promptHook) writes `prompt: {text, step, moments,
  moments_by_kind, reps, session_id, at}`. `session_id` is the hook's Claude Code session, which spans every turn of a
  sitting, so it is not a turn. `at` is a clock.
- **The bank capture** (`scripts/gaffer_brain.mjs:1360-1398`) writes `{v, kind:"capture", id, ts, day, type, ref,
  concept, label, gut, asked, standard, key, extra, axis, latency_ms, note, surface, probe, register, spoken, hedges}`.
  It carries no session id, no turn id and no prompt stamp, and its `id` is `type:ref:<capture ISO>`, a clock.
  `grep -n "session_id\|prompt_at\|turn_id\|uuid" scripts/gaffer_brain.mjs` finds no such field on the row.
- They share only concept, axis and clocks. Row 1194 (4) forbids the clocks, and concept/axis is not one turn.

**FORK mcrk-4c · a turn identity has no carrier.** Some owner must mint a per-turn id and both records must carry it.
For example: teaching_audit's promptHook stamps a `turn_id` into `prompt`, the bank line passes it to
`gaffer_brain.mjs capture`, and the crack row copies it from `prompt`. Two of those three are outside this seat's paths
(`teaching_audit.mjs` and `gaffer_brain.mjs`), so the build stays as it was. `words` is still `prompt.text` byte for
byte. The crack row already carries `prompt_session_id` and `prompt_at`. No join clause was added, so as not to invent
one. CHECKPOINT · STOPPED at 2026-11-20T07:10Z on row 1194 (1) · resume from the architect's ruling on FORK mcrk-4c.

## 11 · THE MERGES OF NEW MAIN (forks rows 1187 (2) / 1181 (2) / 1200 (2) / 1201), 20 Nov 2026

| Main | Merge commit | Conflicting hunks |
|---|---|---|
| 3f22388 (unit mlaw) | 78db147 | none |
| cebe3eb (unit mcov) | e4d9f41 | none |
| 6a6bdff (unit mmeter) | e8aa2d9 | none |

None of the three mains touches a file this unit touches, and this unit never edits `package.json` or
`scripts/organism_test.mjs`. So every merge was clean, there was no hunk to reconcile, and there is no fork.
`ci/mcrk/BASE` stays 5759cce (row 1200 (2)). The clauses are judged against it, and BOUND against the merge's parent.

**What the mmeter main changed for this unit:** its new member `clauses` walks `ci/witness/<unit>/witness_*.mjs` in
`plants` mode with no base tree. That run exposed a defect in this unit's own K2c. With no `--base-tree`, the session
file's writer is the tree's own code, so its contract carries the crack line as well. K2c stripped the carrier on one
side only, so the run read `10 of 11`. K2c now strips it on both sides. With a base tree the comparison is unchanged,
and mutant M4 still bites on the carrier count. The member then read
`organism_test: 7 passed, 0 failed · ruled 0 · UNRULED 0` (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs clauses`, 20 Nov 2026).
