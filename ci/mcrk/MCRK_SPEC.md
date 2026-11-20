# UNIT MCRK · SPEC — the pacer's `crack` verb, sole writer of the crack row

> Forks row 1173 (1) + (2), his words 266 / 268 / 270 / 271. A SPEC, not a build: nothing here is built, landed or
> merged. Base = `origin/main` **5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90**, measured at the cut on 20 Nov 2026
> (`git fetch origin main && git rev-parse FETCH_HEAD`). Every `file:line` below is at that base. Every measurement is
> a command with its last line; the full act log is `ci/mcrk/LEDGER.jsonl` on this branch.

## 0 · HEADLINE

At base 5759cce the crack row has **no owner**: `study_scope.mjs:285` lets a study turn run `forge_session.mjs crack`,
but the pacer's switch (`forge_session.mjs:2770-3180`) has no `crack` case. The call falls to `default`, prints the usage
line and **exits 0, writing nothing**, so the teacher cannot tell it from a success. The compiled notes hold crack items with no `moment` and no
`words` (all of them, measured below), so the mcap witness's c18 reads RED on every day with a broken answer. That red
is TRUE (row 1173 (2)).

The build this spec proposes:
1. **`node scripts/forge_session.mjs crack`**, with no arguments. It is the SOLE WRITER of `dressing-room/state/cracks.jsonl`.
   It appends ONE row holding his words VERBATIM, the concept, the axis and the moment, at the moment the answer
   breaks. It **never calls `save()`**, so the open forge session file is never written by it (§3).
2. His words come from the prompt record that `teaching_audit.mjs` already writes at UserPromptSubmit
   (`teaching_audit_last.json` → `prompt.text`, `teaching_audit.mjs:1635-1653`). The pacer already reads that file
   read-only (`forge_session.mjs:100`). Concept, axis and moment come from the open session the pacer owns. **He types
   nothing. The teacher types nothing either: no `--said`, nothing to transcribe.**
3. `notes_compiler.mjs` reads the row through the pacer's exported reader. It stamps `moment`, `words` and `crack_id`
   on the crack item of that turn and **keeps the teacher's ```diff (galat and sahi) exactly as today**. A crack row
   whose turn has no diff yields an item with an empty diff and a NAMED gap. The compiler never fills the diff from
   his words.

## 1 · MEASUREMENTS (each by command, last line verbatim)

```
$ git rev-parse FETCH_HEAD                                     # after git fetch origin main
5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90

$ git show b37ebfc:ci/mcap/PROOF.md | sed -n 157,163p           # the evidence (fork mcap-1)
  the compiled note today; (b) would change its source.

$ grep -n "ALLOWED_CMD = " scripts/study_scope.mjs
285:export const ALLOWED_CMD = /(…|forge_session\.mjs["']?\s+(pointer|moment|crack|axis|status|step|contract|resume|boot|start|close|lockchain)|…)/i;

$ grep -n '^    case "' scripts/forge_session.mjs | cut -d'"' -f2 | tr '\n' ' '
start step axis moment pointer lockchain resume status contract boot close selftest

$ node scripts/forge_session.mjs crack ; echo "exit $?"         # scripts copy of 5759cce under the scratchpad, no state dir
exit 0                                                          # (after the usage line; nothing written)

$ node -e '<count crack items of compiled_notes.jsonl, counts only, no content>'
rows 15 · compiled 8 · crack items 22 · with moment 0 · with words 0

$ git check-ignore -v dressing-room/state/cracks.jsonl ; echo "exit $?"
exit 1                                                          # NOT ignored: a new file there is tracked by default

$ git check-ignore -v dressing-room/state/forge_session.json dressing-room/state/teaching_audit_last.json
.gitignore:114:dressing-room/state/forge_session.json   ·   .gitignore:315:dressing-room/state/teaching_audit_last.json

$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      # base, after npm ci --ignore-scripts
organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
#   the one FAIL is pre-existing at base: "EVERY organ with a selftest is wired into a suite" — orphaned:
#   deck_lint, home_pin, probe, study_scope. Before npm ci the same run also failed fsrs + mutagen (ERR_MODULE_NOT_FOUND).

$ node scripts/forge_session.mjs selftest
forge_session selftest: 237 passed, 0 failed

$ node scripts/notes_compiler.mjs selftest
notes_compiler selftest: 45 passed, 0 failed

$ node ci/witness/mcap/witness_capability.mjs plants             # on a git-archive tree of b37ebfc
PLANTS mcap · 80 of 80 plant(s) as expected                     # CLAUSE C:capability-c18 GREEN · 10/10 plant(s)

$ git diff --quiet 5759cce b37ebfc -- scripts/{forge_session,notes_compiler,study_scope,teaching_gate,gaffer_brain}.mjs && echo equal
equal                                                           # the mcap evidence reads the same organs as this base
```

## 2 · WHAT IS THERE AT BASE (file:line @ 5759cce)

| Fact | Where |
|---|---|
| The pacer's header: `SOLE WRITER of dressing-room/state/forge_session.json. Nothing else writes it.` | `scripts/forge_session.mjs:23` |
| The pacer is also SOLE WRITER of `relocks.jsonl`, an append-only sidecar. This is the precedent for a second file of its own | `scripts/forge_session.mjs:24-27`, `:102-106`, append at `:2889-2890` |
| It already reads `teaching_audit_last.json` READ-ONLY (owner teaching_audit.mjs) | `scripts/forge_session.mjs:100` |
| `teaching_audit.mjs` writes `prompt: {text, step, moments, moments_by_kind, reps, session_id, at}` at UserPromptSubmit, **before** the teacher's turn runs any tool | `scripts/teaching_audit.mjs:160` (LAST), `:1635-1653` (promptHook), `:1878` (dispatch) |
| The legal moments: one fence, pinned by a selftest | `forge_session.mjs:138` MOMENTS = `teaching_gate.mjs:391` MOMENT_KINDS (fence assert `teaching_gate.mjs:1264-1269`) |
| `moments_log` rows `{kind, axis, at, refused?}` are appended on every `moment` call | `forge_session.mjs:341-346` |
| `need` / `live` refuse a missing, closed or STALE session (`STALE_HOURS = 18`), and `apply` is the ONLY path that calls `save` | `forge_session.mjs:1406-1436`, `:158` |
| The DISPATCH DOC WIRE: the header MODES block and the `default` usage line must name every verb of the switch | `forge_session.mjs:75-76`, `:3176`, selftest `:2362-2392` |
| The per-turn contract (UserPromptSubmit → turn_hook prompt) | `forge_session.mjs:625` contractLines |
| The bank: `capture` rows `spoken: clip(said, 4000)`, where `said` is the TEACHER's `--said`; the `settled` verdict is written at the judge's round, **not** at the moment | `scripts/gaffer_brain.mjs:5-7` (sole writer), `:1395`, `:2253`; VERDICT_TYPES `:976-997`; banked moments `study_scope.mjs:265` |
| The compiler's header: `SOLE WRITER of dressing-room/state/compiled_notes.jsonl` | `scripts/notes_compiler.mjs:4`, `:13` |
| The compiler's crack item: one `tItem(x,"crack",{galat,sahi})` per ```diff block of a teacher record. It has no moment and no words | `notes_compiler.mjs:318-323` (DIFF_RE `:122`, diffBlocks `:286-294`) |
| His "cracked" answer is already an `[N]` item (`kind:"cracked"`) from the archive record before the diff | `notes_compiler.mjs:331-338` |
| `[N]` and `[T]` are never mixed (G-B) | `notes_compiler.mjs:35-37` |
| The compile runs AFTER the day (postmatch's close, `fulltime --date D`) | `scripts/postmatch.mjs:835`, `:846`, `:1579` |
| The mcap witness c18 reads `compiled_notes.jsonl`: a live note of day D, same concept and axis, an item `kind:"crack"` with `moment ∈ MOMENT_KINDS`, `fold(words) === fold(capture.spoken)`, and `galat` and `sahi` both non-empty | `b37ebfc:ci/witness/mcap/witness_capability.mjs:31-35`, `:205-225`; plants `:366-379` |
| The registry names the pacer's other sidecar as an `emit_contract` row (`subject:"relocks"`, `writes_to:"relocks.jsonl"`) | `dressing-room/state/registry.json` (owner `scripts/registry.mjs:4`); the schema was read, no content was printed |
| Rails admits the verb in a study turn already, so the call raises no permission prompt for him | `study_scope.mjs:285` (G3 every-segment law `:291-297`) |

## 3 · THE CODE PATH (proposed)

### 3.1 The row: shape, file, writer

**File** `dressing-room/state/cracks.jsonl`. It is append-only, one row per crack, and no id repeats.
**Header line** to add to the LAWS of `scripts/forge_session.mjs`, beside `:24`:
```
//   · SOLE WRITER of dressing-room/state/cracks.jsonl (unit mcrk, forks row 1173 (1)) — THE CRACK ROW, append-only:
//     `crack` writes ONE row at the moment his answer breaks — his words verbatim (teaching_audit_last.json's
//     prompt, read-only), the concept, the axis and the moment from this organ's own session. It NEVER calls save():
//     forge_session.json is not written by it. notes_compiler.mjs reads it through readCracks().
```
**Row**
```
{ v:1, kind:"crack", id:"ck-<base36 ms>-<4 hex>", at:<verb clock ISO>, day:<IST day of at>,
  concept, axis, moment, moment_at,            // the session's last NON-refused moments_log entry on `axis` with at < prompt_at
  words, words_src:"teaching_audit_last.prompt", prompt_at, prompt_session_id,
  step,                                        // the session's step at the call (a read, never a write)
  session_started_at,                          // ties the row to ONE forge session
  bank_of }                                    // the capture id of a bank row of concept:axis with at ≥ prompt_at, else null
```
`words` is `prompt.text` byte for byte: no trim, no fold, no clip. It passes the names guard BEFORE the append
(`notes_compiler.mjs:205` namesGuard, the F4 carve-out). A finding refuses the row and prints only the verdict.

### 3.2 The verb: `node scripts/forge_session.mjs crack`

It takes no argument. It is pure until the one append:
```
export function crackRow({ session, auditLast, bank = [], now = new Date() }) → { ok:true, row } | { ok:false, why }
export function appendCrack(row, path = CRACKS) → { ok, id, why? }   // read-back before ok:true (resume_pointer.mjs:91 appendChecked shape)
export function readCracks(path = CRACKS) → { rows, absent?, error? }
export const CRACKS = join(STATE_DIR, "cracks.jsonl")
```
The dispatch is `case "crack"`: `live(need(load()))`, then crackRow, then appendCrack. It never calls `apply`/`save`. Refusals exit 1, write
nothing and say one line each:
- no session, a closed session or a STALE one: the existing `need` / `live` wording (`:1406-1426`). A stale session is woken by the teacher's existing `resume`, never by him.
- `current_axis` null: `no axis is ON — declare it with axis <x> now`.
- no `prompt` in `teaching_audit_last.json`, or `prompt.at` < `session.started_at`: `his words are not on disk (the UserPromptSubmit record is absent) — no crack row is written from memory`.
- no legal moment on the axis before `prompt.at`: `no moment declared before his answer — the answer to an undeclared question is not a crack row`.
- a row with the same `session_started_at` + `prompt_at` already exists: it prints `already written <id>`, **exit 0**, and writes nothing. A second call is idempotent.

`bank_of` is read through the existing dynamic `readBank` (`forge_session.mjs:2749`, gaffer_brain bankRows read-only).
An unreadable bank leaves `bank_of:null` and says so. It never refuses the crack.

The DISPATCH DOC WIRE: `crack` joins the header MODES (`:75-76`) and the `default` usage line (`:3176`) in the same
landing (selftest `:2392` fails otherwise).

### 3.3 How the teaching session calls it, with no new act of his

He types nothing and remembers nothing. The teacher (Claude, in the forge/learn session) runs ONE command in **the same turn** in which
it writes the ```diff block. That is the turn whose prompt was his broken answer:
```
node scripts/forge_session.mjs crack
```
Three carriers hold it, each a file the teacher already reads:
1. **The per-turn contract** (code, re-read every turn through `turn_hook prompt`): contractLines (`:625`) gains
   `· crack → ```diff likho to usi turn mein: node scripts/forge_session.mjs crack (no args)`, riding the existing
   moments line (`:625` comment: per-turn additions ride existing lines). See FORK mcrk-5.
2. **The skills**: `.claude/skills/forge/SKILL.md:29-31` (the PACER verbs) and `.claude/skills/learn/SKILL.md:56-57`
   ("it IS the crack log, never log a crack later") each name the command, one line each. Also
   `.claude/skills/forge/REFERENCE.md:80` "THE PACER".
3. **Rails** already admits it (`study_scope.mjs:285`), so no permission prompt and no rail red. No study_scope edit.

Order inside the turn, when the answer was banked: the bank line first, then `crack`, so `bank_of` resolves. A crack
before the bank line still writes, with `bank_of:null`. The compiler joins by concept, axis and time, so `bank_of` is
a convenience and never a gate.

### 3.4 The compiler reads the row and keeps the teacher diff

`compileDay` (`notes_compiler.mjs:417`) reads `readCracks()` once (an absent file means no cracks, said in the summary;
an unreadable file is named on the summary line and never fatal). It hands `cracks` to `buildNote` (`:315`) for each
concept, axis and window.

In `buildNote`, each crack row `r` with `r.concept === concept`, `r.axis === axis` and `r.at` inside the window
attaches to **the first teacher record `x` with `x.at ≥ r.at`** that comes before the next `him` record:
- `x` has diffs: the FIRST crack item of `x` gains `{ moment:r.moment, words:r.words, crack_id:r.id, words_at:r.prompt_at }`.
  `galat` and `sahi` stay **exactly** `diffBlocks(x.text)`. That is the teacher's diff, kept.
- `x` has no diff: one item `{ mark:"T", kind:"crack", at:r.at, rid:null, galat:[], sahi:[], moment, words, crack_id }`
  is pushed, and a gap `crack row <id> has no ```diff in its turn — the teacher's diff is missing` is added. The diff is **never**
  built from his words.
- A diff with no crack row stays as at base (no moment, no words), so c18 stays RED for that broken answer. That red is true.

Render (G-B): the item's `words` print on their OWN `[N <prompt_at IST> · crack <id>]` line, above the `[T] CRACK
galat | sahi` line. One line never mixes authors. FORK mcrk-3 covers the item shape.

A recompile stays idempotent: the same rows give the same content_sha (`notes_compiler.mjs:69-72`).

### 3.5 Every reader of the row

| Reader | How | Proposed by |
|---|---|---|
| `scripts/notes_compiler.mjs` compileDay → buildNote | `readCracks()` imported from the pacer (a dynamic import, the readBank pattern, so no hook closure grows) | this spec |
| `scripts/forge_session.mjs` itself | idempotence check at `crack`, and a count on the `close` coverage line (`cracks N`), read-only | this spec |
| mcap witness c18 | unchanged: it reads the COMPILED note (`b37ebfc:…witness_capability.mjs:205-225`), which now carries moment and words | FORK mcrk-4 |
| `ci/witness/mcrk/witness_crack.mjs` | plants only, on copies under os.tmpdir() | this spec |

Nobody else writes it. `xray.mjs report` Q2/Q5 should still read 0 on the build. That is NAMED in §6, because xray needs `acorn` and the
cloud run had to `npm ci` first.

## 4 · THE OPEN STUDY SESSION ON DISK IS NOT DISTURBED (the proof)

The claim: a forge session open on the day of the landing keeps its `step`, axes (`axes_done`, `axes_deferred`,
`current_axis`, `axes_marked_at`, `axes_now_history`), `moments_log` and `resume_pointer` **byte-equal**, through the
landing and through any number of `crack` calls.

1. **By construction.** `crack` reaches the disk through `appendCrack` alone. There is no `save()` and no `apply()` on its path. The
   witness proves this both statically and dynamically (K2).
2. **The landing touches no line of the session's codec.** `load()` (`:1112-1171`), `save()` (`:1173-1185`), `blank()`,
   `STEPS`, `AXES`, `MOMENTS`, `need`, `live` and `apply` are byte-equal, base to build. K2b reads each function's source text from both trees and
   compares the bytes.
3. **The same file reads the same.** A session file written by BASE code (planted: step 3, axis c ON, a pointer,
   moments_log, a resume) loads under the BUILD to the same `status` line and the same `contract` lines, minus the one
   added crack line (K2c).
4. **His live session** (the one the SessionStart kickoff names as carried; its content is state and is not copied here) cannot be read from the cloud, because
   `forge_session.json` is gitignored (`.gitignore:114`). It is NAMED in §8 with the laptop command that measures it.

## 5 · THE WITNESS — `ci/witness/mcrk/witness_crack.mjs` (proposed)

Plants copy `scripts/` of the tree under test into `mkdtemp(os.tmpdir())` (F14 A, as mcap did). Every state file is
written there by the witness's own node code. The repo's `dressing-room/state` is never opened. No port, no daemon,
no POST, no restart, no model call. Every spawn has a bounded wait (`spawnSync` with the witness's one timeout
constant, the mcap witness's own). Usage: `node ci/witness/mcrk/witness_crack.mjs plants [--tree <dir>]`, which prints
`CLAUSE K<n> GREEN|RED` and a closing `PLANTS mcrk · N of N`. `--tree` = a git-archive of 5759cce for the RED leg.

| Clause | Plant | RED on base 5759cce | GREEN on build |
|---|---|---|---|
| **K1 · verb writes the row** | open session (axis c ON, a `check_q` moment), prompt record `"shaky — ek word ek token hota hai"` after it → `crack` | exit 0 with the usage line and no `cracks.jsonl` | exit 0, exactly 1 row; `words` byte-equal to prompt.text; concept, axis and moment match |
| **K2 · session undisturbed** | K1's plant; sha256 of `forge_session.json`, `forge_sessions.jsonl`, `resume_pointer.jsonl`, `relocks.jsonl` and `teaching_audit_last.json` before and after; an absent file stays absent | RED: no row (the clause needs the row AND equal bytes) | row written, every sha equal |
| **K2b · codec unchanged** | source text of load, save, blank, need, live and apply, plus the STEPS/AXES/MOMENTS literals, base vs build | RED: K2b needs `export function crackRow` in the build tree (absent) | every body byte-equal and crackRow present |
| **K2c · base file, build read** | a session file written by base `start`/`step 3`/`axis c now`/`pointer "…"`; `status` under the build | RED: the contract has no crack line | `status` identical; contract = base lines + the one crack line |
| **K3 · refusals write nothing** | (a) no prompt record (b) prompt.at before the last moment (c) no axis ON (d) stale session (e) closed session | exit 0, usage | each: exit 1, its named line, no file |
| **K3b · idempotent** | `crack` twice on one prompt | no row | second call `already written <id>`, exit 0, still 1 row |
| **K4 · the right moment** | moments `pehle_guess`, `check_q`, `check_q` (refused), `jirah` on axis b, then axis c `check_q`; prompt after | no row | `moment:"check_q"`, `moment_at` = the last NON-refused entry on axis c |
| **K5 · compiler stamps, keeps the diff** | buildNote with ex `[teacher q, him answer, teacher ```diff]` and the crack row | the crack item has no moment or words | the item carries moment, words and crack_id; galat and sahi deep-equal to the base build's for the same ex |
| **K6 · no diff ⇒ gap, never fabricated** | crack row whose turn has no diff, plus a second diff with no row | no gap and no item | item with `galat:[]`, `sahi:[]` and the named gap; the row-less diff item has no moment |
| **K7 · c18 end to end** | settled `missed` voice_rep plus its capture (`spoken` = prompt.text), `crack`, then compileDay over a planted archive root (`compileDay({root,stateDir})`), then mcap c18 over the planted org | c18 → 1 (RED · without a crack row) | c18 → 0 |
| **K8 · the teacher's carriers** | contractLines on an open session; grep of forge/SKILL.md, learn/SKILL.md and REFERENCE.md; ALLOWED_CMD admits `node scripts/forge_session.mjs crack` | contract has no crack line | every carrier names it and rails admits it |

**Mutants** (`ci/mcrk/run_mutants_mcrk.mjs`, one per clause, each RED by its own clause, control GREEN):
M1 delete `case "crack"` → K1 · M2 crack calls `save({...s, updated_at})` → K2 · M3 swap `load` for a variant that
re-stamps `updated_at` → K2b · M4 drop the contract line → K2c · M5 fall back to `words:""` on a missing prompt →
K3 · M6 drop the idempotence check → K3b · M7 take the FIRST moment, not the last non-refused one → K4 · M8 take `words`
from the archive `him` record and not the row → K5 · M9 fill `sahi` from `words` when the turn has no diff → K6 ·
M10 attach the row to `axis` from moments_log[0] → K7 · M11 drop the SKILL.md line → K8.

## 6 · FILES A BUILD WOULD TOUCH

- `scripts/forge_session.mjs`: the header LAWS + MODES, CRACKS, crackRow / appendCrack / readCracks, `case "crack"`, the usage line, the
  contract line, the `close` count, and selftest cases (verb, refusals, idempotence, no-save).
- `scripts/notes_compiler.mjs`: compileDay reads cracks, buildNote's `cracks` param, the render's `[N]` words line, and selftest cases.
- `.claude/skills/forge/SKILL.md`, `.claude/skills/forge/REFERENCE.md`, `.claude/skills/learn/SKILL.md`: one line each.
- `ci/witness/mcrk/witness_crack.mjs`, `ci/mcrk/run_mutants_mcrk.mjs`, `ci/mcrk/PROOF.md`, `ci/mcrk/LEDGER.jsonl` (seat branch).
- **Beyond them, each a FORK:** `.gitignore` (mcrk-2) · the registry `emit_contract` row through
  `registry.mjs set`, a state write done only at landing by its owner CLI (mcrk-6) · `scripts/teaching_gate.mjs` + its
  RULES.jsonl, if a diff-without-crack check is wanted (mcrk-5) · `ci/witness/mcap/*` (mcrk-4).
- **Untouched by construction:** `scripts/study_scope.mjs` (already admits it), `scripts/teaching_audit.mjs` (read
  only), `scripts/gaffer_brain.mjs` (read only), and every file under `dressing-room/state/` in the seat's tree.

## 7 · FORKS (the architect rules)

- **mcrk-1 · where his words come from.** (a) `teaching_audit_last.json` prompt.text, read-only: verbatim, zero
  transcription, refuse if absent · (b) the teacher passes `--said "<verbatim>"` (the bank line's pattern) · (c) (a), and fall back to
  (b) marked `words_src:"teacher"`. **Recommend (a)**, because (b) and (c) put a teacher's copy where the ruling asks for HIS words.
  *Decides it:* on his laptop, the share of study turns in `teaching_audit.jsonl` whose Stop row says `user_text_source:"fresh"`. If that
  is ≈ all of them, (a) loses nothing.
- **mcrk-2 · is `cracks.jsonl` tracked?** It is not ignored today (measured), so it would be PUBLIC and hold his verbatim words.
  (a) gitignore it, like forge_session.json (`.gitignore:114`) · (b) track it with the names guard before every append, like compiled_notes
  (F4). **Recommend (a)**: the compiled note (already tracked and guarded) is the one public copy. Privacy: "code public,
  data private". *Decides it:* his word. The witness reads plants only, either way.
- **mcrk-3 · the item shape (G-B).** (a) one `[T]` crack item with `words` as a field, rendered on its own `[N]` line ·
  (b) a separate `[N]` item `kind:"crack_words"` linked by `crack_id` (the mcap c18 would have to read the pair).
  **Recommend (a)**: the ruling says "its crack item", and the built mcap c18 reads `words` on that item.
- **mcrk-4 · c18's word equality.** c18 compares the crack `words` (his prompt) to `capture.spoken`, the TEACHER's `--said`
  (`gaffer_brain.mjs:1395`). A bank line that drops his gut-word reads RED. (a) keep the fold equality: a red names a
  non-verbatim bank line, which is true but is another defect than "no crack row" · (b) c18 joins by `bank_of` and requires
  `fold(spoken) ⊆ fold(words)` · (c) c18 reads `cracks.jsonl` directly, not the compiled note. **Recommend (b)**, as an mcap amendment.
  It keeps c18 red only "for the right reason" (row 1173 (2)). *Decides it:* on his laptop, how many capture rows' `spoken` equal his
  prompt of that turn after a fold.
- **mcrk-5 · enforcement.** (a) carriers only (contract line, skills) · (b) plus a teaching_gate Stop check, a turn whose
  reply holds a ```diff and whose shell commands hold no `forge_session.mjs crack`, as a new rule row (the gate may only get
  stricter) · (c) the Stop hook calls the pacer's exported writer itself. **Recommend (a) now and (b) as its own unit**. (c) makes the
  writer a hook, against "the pacer verb is the sole writer".
- **mcrk-6 · registry.** (a) the landing adds an `emit_contract` row `{subject:"cracks", surface:"forge_session.mjs",
  writes_to:"cracks.jsonl", fired_by:"teacher"}` through `registry.mjs set`, run by the lander · (b) no row.
  **Recommend (a)**, because relocks has one. A seat cannot do it, since it would be a state write.
- **mcrk-7 · moment when none fits.** (a) refuse, as above · (b) write `moment:null` and let c18 read it red. **Recommend (a)**:
  a row with no legal moment fails c18 anyway, and a refusal tells the teacher in the turn.

## 8 · NAMED, NOT GUESSED (the cloud cannot reach these)

- **His open session.** The cloud has no `forge_session.json` (gitignored). On his laptop, before and after the landing and after a
  `crack`: `node -e "console.log(require('crypto').createHash('sha256').update(require('fs').readFileSync('dressing-room/state/forge_session.json')).digest('hex'))"`
  and `node scripts/forge_session.mjs status`. Both must be equal. It is also likely STALE (more than 18 h since its last touch), and `crack` refuses a stale
  session until the teacher's `resume`.
- **The prompt record is live.** Whether `teaching_audit_last.json` gets `prompt` on every study turn on his machine:
  `node -e` printing only `prompt.at` and `prompt.session_id` (never the text) right after he sends a turn.
- **Turn-hook ordering.** That UserPromptSubmit's teaching_audit write finishes before the teacher's first tool call. The cloud
  has no live hook, so this is measured by the K1 plant's assumption plus one live turn on his laptop.
- **mcrk-1 and mcrk-4 measurements:** `user_text_source` shares and the spoken-vs-prompt equality on the live `teaching_audit.jsonl` and
  `gaffer_grade_queue.jsonl`. Both are gitignored, so they are not in the cloud.
- **xray Q2/Q5 on the build.** It needs `acorn` (`npm ci`) and is the lander's run: `node scripts/xray.mjs report`.
- **effort receipt tool**: `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository (reported in the final message).

## 9 · CI OF THIS BRANCH

Read through the public API with no token, `curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`.
The ids and the verdict are in the FINAL MESSAGE of this seat and in the ledger row `ci`. This spec changes no code, so the run judges
the spec's markdown against the suite's canon laws.
