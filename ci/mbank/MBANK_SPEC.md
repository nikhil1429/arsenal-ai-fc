# UNIT MBANK · SPEC — the bank line takes his spoken words from the prompt record

> Forks rows 1189 (1) / 1194 (2), his words 266 / 268 / 270 / 271 / 272 / 273. A SPEC, not a build: nothing here is
> built, landed or merged. Base = `origin/main` **5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90**, measured at the cut on
> 20 Nov 2026 (`git fetch origin main && git rev-parse FETCH_HEAD`). Every `file:line` below is at that base unless it
> says `mcrk-build` (= `origin/claude/mcrk-build` 937710b). Every measurement is a command with its last line; the act
> log is `ci/mbank/LEDGER.jsonl` on this branch. No state file was opened, printed or copied; every plant named here
> lives under `os.tmpdir()`.

## 0 · HEADLINE

At base 5759cce his answer lives TWICE. The prompt record (`teaching_audit_last.json` → `prompt.text`, written at
UserPromptSubmit by `teaching_audit.mjs:1636-1653`) holds what he typed. The bank row (`gaffer_grade_queue.jsonl`,
`kind:"capture"`) holds `spoken: clip(said, 4000)` (`gaffer_brain.mjs:1395`), where `said` is the TEACHER's
`--said "<his words>"` (`gaffer_brain.mjs:2688-2689`). The teacher's copy drifts: the runner's 20 Nov 2026 count on his
laptop (row 1194, counts only) found the copy exactly equal to his prompt for 37 of 65 rows, inside it for 46, 19 missing,
five of them near-verbatim. The only guard today is a Stop-hook red AFTER the row is written
(`teaching_gate.mjs:669-680`, `B.bank-verbatim`), so a drifted copy is banked, judged and compiled anyway.

The build this spec proposes:
1. **One door.** The mcrk build already reads the prompt record through the pacer (`loadAuditLast`,
   `forge_session.mjs:1277`; mcrk-build `:1351`) and gates it inside `crackRow` (mcrk-build `:659-662`). That gate is
   lifted into ONE exported pure function, `hisPrompt(auditLast, opts)`, in `scripts/forge_session.mjs`. `crackRow`
   calls it (same behaviour, re-pointed), and `gaffer_brain.mjs capture` calls it. No second reader of the prompt record.
2. **The code-surface bank takes his words from it.** `capture` on the code surface (any call carrying `--said` or
   `--surface code`) stores `spoken` = the prompt record's text, byte for byte (no trim, no fold; `clip` only at the
   existing ceiling), with `spoken_src:"prompt"`. It is REFUSED when the record is absent, empty, already consumed by
   its turn's Stop, or from another Claude session. It is never filled from a teacher copy.
3. **A turn identity both records carry.** `teaching_audit.mjs` promptHook mints `prompt.turn_id` (`randomUUID()`),
   because no shared turn identity exists today (measured §1, and mcrk-build `ci/mcrk/PROOF.md` §10, FORK mcrk-4c). The bank
   row and the crack row copy it. c18 joins by it (row 1194 (1)); no witness joins by time or by text (row 1194 (4)).
4. **The other doors are not teacher copies and keep their own words.** The voice lane (`dugout.mjs:2204-2207`, STT on
   stdin) and the sitting (`sitting.mjs:599-600`, his typed turn on stdin) already pass HIS text. They are stamped
   `spoken_src:"voice"` / `"sitting"` and are not routed through the prompt record (FORK mbank-3).

## 1 · MEASUREMENTS (each by command, last line verbatim)

```
$ git fetch origin main && git rev-parse FETCH_HEAD
5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90

$ git rev-parse origin/claude/mcrk-spec origin/claude/mcrk-build
937710bde43403e7f558bbb5b9a5f179df6dc50f                       # (mcrk-spec 02c6f57f22f826d210ad533a692c4f422277c1dc)

$ grep -n "spoken: clip(said" scripts/gaffer_brain.mjs
1395:    spoken: clip(said, 4000),

$ grep -n 'const said = flag("said")' scripts/gaffer_brain.mjs
2688:    const said = flag("said");

$ grep -rn "gradeCapture(" scripts/*.mjs | awk -F: '$2<3000' | wc -l
2                                                               # the definition (:1327) and the CLI (:2690): ONE production caller

$ grep -rln -- "--said" scripts .claude | sort | tr '\n' ' '
.claude/skills/forge/REFERENCE.md .claude/skills/forge/SKILL.md .claude/skills/learn/REFERENCE.md scripts/forge_session.mjs scripts/gaffer_brain.mjs scripts/learn_digest.mjs scripts/organism_test.mjs scripts/rails.mjs scripts/study_scope.mjs scripts/teaching_bar.mjs scripts/teaching_gate.mjs

$ sed -n 1360,1400p scripts/gaffer_brain.mjs | grep -c "session_id\|prompt_at\|turn_id"
0                                                               # the capture row carries no session, turn or prompt stamp

$ grep -n "turn_id" scripts/teaching_audit.mjs ; echo "exit $?"
exit 1                                                          # the prompt record carries no turn id either

$ grep -n "consumed_at: paired" scripts/teaching_audit.mjs
1775:    prompt: p ? { ...p, consumed_at: paired ? now : (p.consumed_at || null) } : null,

$ grep -n "export const HEDGE_RE" scripts/register.mjs
42:export const HEDGE_RE = /\b(shayad|matlab|i think|i guess|maybe|probably|sort of|kind of|hopefully|not sure|i feel like)\b/gi;

$ grep -n "^const GUT_LEAD" scripts/study_scope.mjs | cut -c1-60
215:const GUT_LEAD = /^\s*(?:gut[\s-]*word\s*(?:is|=|:|-|—)?\s*)?(

$ env | grep -c "^CLAUDE_CODE_SESSION_ID="                      # in THIS cloud container's Bash child
1

$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all    # base, after npm ci --ignore-scripts
organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
#   the one FAIL is pre-existing at base: "EVERY organ with a selftest is wired into a suite" —
#   orphaned: deck_lint, home_pin, probe, study_scope (the same line the mcrk spec measured).
```

## 2 · WHAT IS THERE AT BASE (file:line @ 5759cce)

### 2.1 The writer of the bank row

| Fact | Where |
|---|---|
| `gaffer_brain.mjs` is SOLE WRITER of `gaffer_grade_queue.jsonl` (captured spoken answers, append-only) | `scripts/gaffer_brain.mjs:5-7` |
| `gradeCapture({type, ref, spoken, gut}, deps)`: refuses unknown type, no gut-word, `said.length < 10`, no material | `gaffer_brain.mjs:1327-1334` |
| The row: `id: type:ref:<ISO>`, `ts`, `day`, …, `spoken: clip(said, 4000)`, `hedges: countHedges(said)` | `gaffer_brain.mjs:1360-1400` |
| The write is checked on disk (`appendRowChecked`); a failed write is `ok:false` with his words handed back on `row` | `gaffer_brain.mjs:1401-1415` |
| The CLI: `--said` beats stdin when both are offered; stdin stays for the voice lane | `gaffer_brain.mjs:2677-2695` |

### 2.2 Every reader of `spoken` (production; selftest plants excluded)

| Reader | Where | What it does with it |
|---|---|---|
| THE JUDGE prompt | `gaffer_brain.mjs:1522` buildJudgePrompt (`:1539`) | the judge grades this text |
| The fact-check prompt | `gaffer_brain.mjs:1583` buildVerifyPrompt (`:1594`, `clip(it.spoken, 2500)`) | checks cited facts in it |
| The frozen judge (`*Legacy`, L9) | `gaffer_brain.mjs:1671` (`:1699`) | kept, not live |
| The second judge | `gaffer_brain.mjs:1723` (`:1742`) | grades the same text |
| The disagreement card | `gaffer_brain.mjs:1774` (`:1779`, `clip(item.spoken, 220)`) | shows HIM his answer |
| The register + hedge meter at the round | `gaffer_brain.mjs:2293` (`validateRegister(…{spoken})`, `countHedges(it.spoken)` fallback) | which terms he SAID, his hedges |
| The capture-time hedge meter | `gaffer_brain.mjs:1399` (`countHedges(said)`) | counts hedges at the bank |
| The queue print | `gaffer_brain.mjs:2784` | length only |
| The compiler | `scripts/notes_compiler.mjs:457` (`said: p.spoken`) | puts it in the compiled note (the one public copy) |
| mcap c18 | `b37ebfc:ci/witness/mcap/witness_capability.mjs:205-225` | `fold(it.words) === fold(cap.spoken)` — row 1194 (1) retires this text compare |
| ci witnesses reading `spoken` | `grep -rl spoken ci/` → mjd3, mjd4, mjd5, mjd6, mjd7, mjud/w_drive, mpast, mpm, mtail, mpool/PROOF.md | plants only; each still reads a string `spoken` (§3.6) |

### 2.3 Every surface that banks

| Surface | Door | Whose words reach `spoken` today |
|---|---|---|
| Forge / learn study turn (Claude Code, `--surface code`) | `--said "<his words>"`, typed by the TEACHER | a teacher copy (the drift) |
| Carriers that teach the teacher the `--said` line | `teaching_bar.mjs:324` [BANK] · `learn_digest.mjs:160` · `forge_session.mjs:723`, `:799` (missing-bank lines) · `teaching_gate.mjs:141`, `:143` (fix texts) · `.claude/skills/forge/SKILL.md:45` · `.claude/skills/forge/REFERENCE.md:135-138`, `:334`, `:601-602` · `.claude/skills/learn/REFERENCE.md:467-468` | — |
| The rails admit it | `study_scope.mjs` shellInStudySet planted shapes `:888-892`, rails `rails.mjs:682-687` | — |
| The sitting (`sitting.mjs` bank) | stdin = `hisText` from the sitting's own turn door | his text (not a teacher copy) |
| The voice lane (Dugout, `dugout.mjs:2204-2207`) | stdin = the STT `answer` | his voice, transcribed (not a teacher copy) |
| Desktop / Gemini | no bank door of their own in this repo (Gemini sittings are harvested through `harvest.mjs` onto the afferent bus, not banked) | — (NAMED §8: whether a Desktop study turn fires UserPromptSubmit) |

### 2.4 The prompt record and its timing inside one turn

| Fact | Where |
|---|---|
| `teaching_audit.mjs` writes `teaching_audit_last.json` (it is that file's single writer) | `teaching_audit.mjs:82-83`, `:160` |
| promptHook writes `prompt: {text, step, moments, moments_by_kind, reps, session_id, at}` at UserPromptSubmit — BEFORE the teacher's first tool of that turn | `teaching_audit.mjs:1636-1653` |
| The Stop of the SAME Claude session stamps `prompt.consumed_at` (paired); a prompt from another session reads `session-mismatch` | `teaching_audit.mjs:1670`, `:1775` |
| The record is ONE slot: the next UserPromptSubmit of ANY session overwrites `prompt` | `teaching_audit.mjs:1638-1652` (`{...last, prompt:{…}}`) |
| The bank is the FIRST tool of the turn whose prompt is his answer | `teaching_bar.mjs:324` ("his message … → the FIRST tool") |
| So inside one turn: prompt written → bank runs (prompt present, `consumed_at` null) → Stop stamps `consumed_at` | the three rows above |
| The sitting's pacer block hands his text to `forge_session contract`, `teaching_contract print`, `hippocampus recall-hint` — NOT to teaching_audit, so a sitting writes no prompt record | `sitting.mjs:294-299` |
| Other readers of the record already exist (each reads its own fields): intent.mjs, teaching_bar.mjs, claims.mjs, forge_session.mjs | `intent.mjs:45`, `teaching_bar.mjs:252`, `claims.mjs:55`, `forge_session.mjs:100` |

### 2.5 The door the mcrk build reads (reuse it, never a second reader)

| Fact | Where (mcrk-build 937710b) |
|---|---|
| `loadAuditLast(path = AUDIT_LAST)` — the one-way, anything-wrong-is-null read (unchanged from base `:1277`) | `scripts/forge_session.mjs:1351` |
| `crackRow` gates `auditLast.prompt`: a string, non-blank text, a parseable `at`, `at ≥ session.started_at`, else `his words are not on disk … no crack row is written from memory` | `forge_session.mjs:653-662` |
| It copies `words: p.text` (byte for byte), `words_src:"teaching_audit_last.prompt"`, `prompt_at`, `prompt_session_id` | `forge_session.mjs:676` |
| The verb reads it once: `crackRow({session, auditLast: loadAuditLast(), …})` | `forge_session.mjs:3292` |
| No shared turn identity: STOPPED, FORK mcrk-4c | `ci/mcrk/PROOF.md` §10 |

### 2.6 His gut-word, in his prompt and in the copy

| Fact | Where |
|---|---|
| The gut-word is read off HIS prompt by ONE classifier: GUT_LEAD (prefix), GUT_INLINE, GUT_AFTER_BREAK, NO_IDEA → `cls.gut` | `study_scope.mjs:215-231` |
| The gate maps it `pakka→knew · shayad→shaky · pata nahi→guessed` and reds a `--gut` that disagrees or that is typed on a message with none (row 270) | `teaching_gate.mjs:311`, `:672-676` |
| The gut-word `shayad` is ALSO a hedge in the meter: a whole-prompt `spoken` that opens `shayad -` counts one hedge that is his calibration, not a hedge | `register.mjs:42-43` |

## 3 · THE CODE PATH (proposed)

### 3.1 The door: `hisPrompt` in `scripts/forge_session.mjs`

Lifted out of mcrk-build's `crackRow` (`:659-662`) into one exported PURE function. `crackRow` is re-pointed to it with the
same refusals and the same words; the dispatch keeps `loadAuditLast()` as its one file read.
```
export function hisPrompt(auditLast, { since = null, sessionId = null } = {})
  → { ok:true, text, at, session_id, turn_id }      // text = prompt.text byte for byte
  | { ok:false, reason, why }
// reason: "absent"    — no prompt object, or text not a non-blank string, or at unparseable
//         "before"    — since given and prompt.at < since              (crackRow passes session.started_at)
//         "consumed"  — prompt.consumed_at set: its turn's Stop already ran, the prompt is not THIS turn's
//         "other-session" — sessionId given and prompt.session_id differs (a parallel Claude session wrote the slot)
//         "no-turn-id" — prompt.turn_id absent (a record written before this unit: FORK mbank-6)
export function readHisPrompt(opts) → hisPrompt(loadAuditLast(), opts)   // the one file read, for gaffer_brain
```
`gaffer_brain.mjs` reaches it by a dynamic `import("./forge_session.mjs")` inside the capture branch only (the
`readBank` pattern, `forge_session.mjs:2749`, run the other way), so no static cycle and no hook closure grows.
`sessionId` is `process.env.CLAUDE_CODE_SESSION_ID` when set (measured set in a cloud Bash child; NAMED §8 for his
laptop); unset → the check is skipped and the row says `session_checked:false`.

### 3.2 The turn identity: `prompt.turn_id`, minted by its owner

`teaching_audit.mjs` promptHook (`:1636-1653`) adds `turn_id: randomUUID()` (`node:crypto`) to the `prompt` object. Its
writer is unchanged (teaching_audit.mjs, single writer of `teaching_audit_last.json`). The Stop's spread at `:1775` keeps it.
Its `teaching_audit.jsonl` Stop row gains `turn_id` from the paired prompt (null when not paired), so the audit ledger
can name the turn too. Readers: `hisPrompt` (one door), hence the bank row and the crack row.

### 3.3 The bank row (`gaffer_brain.mjs`, its sole writer)

`gradeCapture` gains `deps.prompt` (the door's `ok:true` result) and `deps.src`. The CLI decides the source:
- **code door** — `--said` given OR `--surface code`: call `readHisPrompt({ sessionId })`. Refused (exit 1, the
  existing `{ok:false, reason, say}` shape, nothing written) on any `ok:false`: `gaffer_brain: his words are not on disk
  (<reason>) — the bank takes them from the prompt record, never from a typed copy; nothing banked`. Else
  `said = prompt.text`, `spoken_src:"prompt"`, `turn_id = prompt.turn_id`, `prompt_at = prompt.at`.
  `--said`, if given, is a SELECTOR only (FORK mbank-4): it must be a whitespace-folded substring of `prompt.text`; the stored
  bytes are the matching slice OF THE PROMPT, never the teacher's argument. A `--said` that is not inside the prompt is REFUSED
  (`--said is not inside his message`), which is the B.bank-verbatim red moved from after the write to before it.
- **stdin door** (no `--said`, no `--surface code`): unchanged words; `spoken_src` = `"voice"` when `--note` starts
  `dugout-voice`/`scrimmage-voice`, `"sitting"` when it starts `sitting `, else `"stdin"`; `turn_id:null`.
- **gut-word** (FORK mbank-5): on the code door `gut` = `GUT_TO_FLAG[classifyPrompt(prompt.text).gut]` (study_scope's
  classifier, the bank's own predicate, imported); a `--gut` that disagrees is REFUSED; a prompt with no gut-word and no
  `--gut` is refused by the existing GUT-WORD LAW (`gaffer_brain.mjs:1330`).
- **hedges** (FORK mbank-7): `countHedges(answerOf(said))`, where `answerOf` strips the GUT_LEAD prefix the classifier
  matched (exported from study_scope.mjs beside GUT_LEAD). The judge round's fallback `:2293` uses the same helper.
- **idempotence**: a code-door capture whose `turn_id` + slice already has a row is `already banked <id>`, exit 0, nothing
  written (a re-run never makes two reps of one answer).

New row fields: `spoken_src`, `turn_id`, `prompt_at`, `session_checked`. `spoken` keeps its name and type (a string),
so every reader in §2.2 reads it unchanged. No teacher copy is stored (FORK mbank-2).

### 3.4 The crack row and c18 (row 1194 (1))

mcrk-build's `crackRow` takes `turn_id` from `hisPrompt` and writes it on the row. The mcap seat amends c18 to: the
broken answer's capture `cap` and a crack item with `it.turn_id === cap.turn_id` (the compiler stamps `turn_id` on the
item beside `crack_id`), a legal `moment`, non-empty `words`, `words_src === "teaching_audit_last.prompt"`, and
`cap.spoken_src === "prompt"`. No `fold(words) === fold(spoken)`. That amendment is the mcap seat's file, not this unit's
(row 1194 (1)); this unit only guarantees both rows carry the id.

### 3.5 The carriers

One line each, in the same landing, names the new bank shape: `--said` becomes optional (omit it: the whole message is
banked), and `--gut` is optional (read from his message): `teaching_bar.mjs:324`, `learn_digest.mjs:160`,
`forge_session.mjs:723`, `:799`, `teaching_gate.mjs:141`, `:143`, the three skill/reference files of §2.3. The planted
rails shapes (`study_scope.mjs:888-892`, `rails.mjs:682-687`) keep passing: they still name `--said`, which stays legal.

### 3.6 What does not change

`spoken` stays a string on every row, so the judge, the second judge, the fact-check, the card, the register, the
compiler and the ten ci witnesses of §2.2 read it as today. The stdin doors keep their bytes. `teaching_gate`'s
`B.bank-verbatim` stays (a gate may only get stricter); on a code-door row it can no longer fire on `--said`, because a
non-verbatim `--said` is refused before the write.

## 4 · THE WITNESSES

Two kinds (row 1184 (1)). Both plant every record under `mkdtemp(os.tmpdir())` by node code; the repo's
`dressing-room/state` is never opened. No port, no daemon, no POST, no restart, no model call (the capture door is
model-free by law, `gaffer_brain.mjs:1321`). Every spawn is `spawnSync` with the witness's one bounded wait constant,
reused from the mcrk witness (no new number typed).

- **Unit witness** `ci/mbank/witness_mbank.mjs` + `ci/mbank/BASE` (40-hex: the main sha the build is cut from),
  honouring `--org` and `--base-org`; every clause RED at base and GREEN at head; it spawns the clause witness on both trees
  and fails on a pass-through (the base leg must read RED).
- **Clause witness** `ci/witness/mbank/witness_bank.mjs plants [--tree <dir>]`, printing `CLAUSE B<n> GREEN|RED` and
  `PLANTS mbank · N of N`. It copies `scripts/` of the tree under test into the temp dir and points `STATE_DIR` there by the
  env door the organs already honour.

| Clause | Plant | RED on base | GREEN on build |
|---|---|---|---|
| **B1 · words from the prompt** | prompt record `{text:"pakka - plant answer one two three", at, session_id:S, turn_id:T}`; `capture voice_rep c:a --axis a --gut knew --said "plant answer one two three" --surface code` | `spoken` = the `--said` bytes; no `spoken_src` | `spoken` = the prompt slice byte-equal; `spoken_src:"prompt"`, `turn_id:T` |
| **B2 · a drifted copy cannot land** | the same prompt; `--said "plant answer one 2 three"` (one word changed) | row written with the drifted bytes | exit 1, `--said is not inside his message`, no row |
| **B3 · absent ⇒ refused** | (a) no record (b) blank text (c) `consumed_at` set (d) `session_id` ≠ `CLAUDE_CODE_SESSION_ID` planted in env | rows written from `--said` | each exit 1 with its reason; queue file byte-equal before/after |
| **B4 · whole message by default** | `--surface code` with no `--said` | exit 1 reading stdin empty → `empty` (or a hang avoided by an empty stdin plant) | `spoken` = whole `prompt.text` |
| **B5 · the gut-word is his** | prompt `shayad - …`, no `--gut` → row `gut:"shaky"`; `--gut knew` on it → refused | no-gut refusal / `knew` banked | `shaky` banked; the `knew` call refused |
| **B6 · the gut-word is not a hedge** | prompt `shayad - plant answer` with no hedge in the answer | `hedges:1` (when spoken is the prompt) — base keeps teacher bytes, so the clause plants base with `--said` = whole prompt | `hedges:0` |
| **B7 · turn identity on both rows** | prompt with `turn_id:T`; the code-door capture and (on an mcrk tree) `forge_session.mjs crack` | the capture has no `turn_id` | capture `turn_id === T` and crack `turn_id === T` |
| **B8 · the stdin doors keep their words** | `capture … --note "dugout-voice"` with stdin `voice plant words here`, no prompt record | row written (words equal) — RED on base only by the missing `spoken_src` | `spoken` = stdin bytes, `spoken_src:"voice"`, no refusal |
| **B9 · one door** | source scan: `teaching_audit_last` path literal appears in `forge_session.mjs` and `teaching_audit.mjs` and nowhere new; `gaffer_brain.mjs` imports `readHisPrompt` | no `hisPrompt` export | export present; gaffer_brain names no prompt-record path |
| **B10 · idempotent** | the B1 call twice | two rows | second `already banked <id>`, one row |
| **B11 · readers unchanged** | buildJudgePrompt, validateRegister and notes_compiler buildNote over a B1 row | — (no build row) | each reads `spoken` as a string; the judge prompt contains it byte-equal |
| **B12 · mcrk door unchanged** | mcrk-build's crackRow refusals and K1 plant through the re-pointed door | (base has no crackRow: RED by absence) | the same `why` lines and `words` as mcrk-build for the same plant |

**Mutants** (`ci/mbank/run_mutants_mbank.mjs`, one per clause, each RED by its own clause, control GREEN):
M1 store `said` (the flag) not the slice → B1 · M2 drop the substring check → B2 · M3 skip `consumed_at` → B3 ·
M4 require `--said` → B4 · M5 trust `--gut` over the prompt → B5 · M6 count hedges over the whole prompt → B6 ·
M7 drop `turn_id` from the row → B7 · M8 route stdin through the door → B8 · M9 a second `readFileSync` of the record
in gaffer_brain → B9 · M10 drop the idempotence key → B10 · M11 rename `spoken` → B11 · M12 change a crackRow `why` → B12.

**Red-before on his laptop** (row 1194 (2)): the same count the runner made, re-run by the build seat's PROOF as a
*description*, not a witness (it joins by time, a named weakness): 37 exactly equal of 65, five near-verbatim; the six
rows before 30 Aug 2026 excluded (row 1194 (3)). After the build the count is by `spoken_src === "prompt"` share, joined by
`turn_id`, which needs no time join.

## 5 · FILES A BUILD WOULD TOUCH

- `scripts/forge_session.mjs` — `hisPrompt`, `readHisPrompt`; crackRow re-pointed; the two missing-bank lines `:723`, `:799`; selftest cases.
- `scripts/teaching_audit.mjs` — promptHook mints `turn_id`; the Stop row carries it; selftest case.
- `scripts/gaffer_brain.mjs` — the CLI's code door, `gradeCapture` deps (`prompt`, `src`), the four new row fields, the gut and
  hedge rules, idempotence; `:2293` fallback via the same helper; selftest cases.
- `scripts/study_scope.mjs` — export `answerOf` (GUT_LEAD strip) beside `classifyPrompt` (it is already imported by the gate and the bar).
- Carriers: `scripts/teaching_bar.mjs:324`, `scripts/learn_digest.mjs:160`, `scripts/teaching_gate.mjs:141`, `:143`,
  `.claude/skills/forge/SKILL.md`, `.claude/skills/forge/REFERENCE.md`, `.claude/skills/learn/REFERENCE.md`.
- `ci/mbank/BASE`, `ci/mbank/witness_mbank.mjs`, `ci/witness/mbank/witness_bank.mjs`, `ci/mbank/run_mutants_mbank.mjs`, `ci/mbank/PROOF.md`, `ci/mbank/LEDGER.jsonl`.
- **Beyond them, each a FORK:** `scripts/notes_compiler.mjs` (stamping `turn_id` on the crack item — mcrk's file, mbank-8) ·
  `ci/witness/mcap/*` (c18 — the mcap seat's, row 1194 (1)) · `scripts/register.mjs` (only if mbank-7 picks (c)).
- **Untouched by construction:** `scripts/sitting.mjs`, `scripts/dugout.mjs` (their stdin bytes are unchanged), `scripts/rails.mjs`,
  every file under `dressing-room/state/`.

## 6 · FORKS (the architect rules)

- **mbank-0 · the build's base.** (a) cut from the main that carries the landed mcrk build, so the door is lifted once ·
  (b) cut from 5759cce now and create `hisPrompt` fresh; mcrk re-points at its landing. **Recommend (a)**: (b) leaves two
  doors for a window, which row 1194 (2) "through the same door" forbids. *Decides it:* whether mcrk lands first (the runner's order).
- **mbank-1 · where the one door lives.** (a) `forge_session.mjs` exports `hisPrompt` (the mcrk door, lifted) ·
  (b) `teaching_audit.mjs`, the record's writer, exports `readPromptRecord` and forge_session re-points to it ·
  (c) gaffer_brain reads the file itself. **Recommend (a)**: it is literally the door the mcrk build reads; (c) is a second reader
  and is refused by the brief. *Decides it:* `node scripts/xray.mjs report` on the build — if a forge_session⇄gaffer_brain dynamic
  pair trips a cycle rule, (b).
- **mbank-2 · the teacher's `said`.** (a) retired: no teacher copy on the row, `--said` survives only as a span selector ·
  (b) kept as `said_teacher` for audit, read by nobody · (c) `spoken` stays the copy and a new `words` field holds the prompt.
  **Recommend (a)**: (b) and (c) keep his words twice, which is the drift row 1194 (2) removes. *Decides it:* the ruling's text.
- **mbank-3 · surfaces without a prompt record.** (a) the door binds the code surface only (`--said` or `--surface code`);
  the voice and sitting stdin doors keep their own his-words and are stamped `spoken_src` · (b) every capture requires the
  prompt record (the voice lane and the sitting would refuse every answer) · (c) the code door falls back to `--said` marked
  `spoken_src:"teacher"`. **Recommend (a)**: those two doors already carry HIS text, not a copy; (c) is the copy row 1189 (1) refuses.
  *Decides it:* on his laptop, `spoken_src` would-be counts by `note` prefix over the grade queue (counts only), and whether any
  Desktop study turn banks (§8).
- **mbank-4 · a prompt that holds more than the answer.** (a) the whole message, always (one bank per turn) · (b) the whole
  message by default; `--said` selects a verbatim slice (folded-whitespace match, the stored bytes from the prompt) ·
  (c) several slices per turn, one row each. **Recommend (b)**: the 46 − 37 = 9 measured rows where the copy sat inside a longer
  prompt keep banking, with his bytes; (c) splits one answer into reps the gate counts twice. *Decides it:* on his laptop, the
  share of the 9 whose remainder is the English interview line (two banks of one message) — if many, (c) for that case.
- **mbank-5 · the gut-word.** (a) the teacher's `--gut` stays, the door only cross-checks · (b) the gut is read off his prompt
  by `classifyPrompt`; `--gut` optional and refused when it disagrees · (c) as today. **Recommend (b)**: the copy sometimes drops
  the gut-word, his prompt carries it, and row 270 already reds an invented one. *Decides it:* on his laptop, the count of code
  rows whose `gut` differs from `classifyPrompt(prompt).gut` (counts only).
- **mbank-6 · a record with no `turn_id`** (written before the landing, e.g. a sitting open across it). (a) refuse: one turn of
  re-asking · (b) bank with `turn_id:null`, c18 reads it UNREAD. **Recommend (a)**: a row that cannot be joined by turn is the
  join row 1194 (1) rules out, and the window is one prompt.
- **mbank-7 · the hedge meter.** (a) count over the answer with the gut-word lead stripped · (b) count over the whole prompt ·
  (c) drop `shayad` from HEDGE_RE. **Recommend (a)**: (b) counts his calibration as a hedge; (c) changes the scrimmage's meter
  (`register.mjs:40`, "verbatim the scrimmage's"). *Decides it:* on his laptop, the count of code rows with `gut:"shaky"` whose
  prompt opens with the GUT_LEAD `shayad`.
- **mbank-8 · `turn_id` on the compiled crack item.** (a) the mcrk build's notes_compiler stamps `turn_id` beside `crack_id`
  (needed by the amended c18 if it reads the compiled note) · (b) c18 reads `cracks.jsonl` directly by `turn_id` (mcrk-4 (c)).
  **Recommend (a)**, as an amendment the mcap/mcrk seats make; this unit does not edit notes_compiler.

## 7 · NAMED, NOT GUESSED (the cloud cannot reach these)

- **`CLAUDE_CODE_SESSION_ID` on his laptop**, and that it equals the hook payload's `session_id`: in a study turn,
  `node -e "console.log(!!process.env.CLAUDE_CODE_SESSION_ID)"` and, after the turn, `node -e` printing only whether
  `teaching_audit_last.json`'s `prompt.session_id` equals it (a boolean, never the id).
- **Turn ordering on his machine:** that promptHook's write lands before the bank (the first tool). One live study turn:
  `prompt.at` < the bank row's `ts` (print the two ISO stamps only).
- **Desktop study turns:** whether a Desktop sitting fires UserPromptSubmit (teaching_audit) at all — counts by
  `user_text_source` over `teaching_audit.jsonl` rows of a Desktop-surface day (gitignored; counts only).
- **The fork measurements** of mbank-3, -4, -5, -7, each a count over `gaffer_grade_queue.jsonl` joined to the prompt — today only by
  time (the named weakness, row 1194 (4)), so read as a description; after the landing they are read by `turn_id`.
- **xray Q2/Q5 and the cycle rule on the build:** `node scripts/xray.mjs report` (needs `acorn`, the lander's run).
- **The parallel-session overwrite:** how often two Claude sessions write the one prompt slot within one turn — the share of
  Stop rows reading `session-mismatch` (counts only).

## 8 · CI OF THIS BRANCH

Read through the public API with no token:
`curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`. The ids and verdict of the last
push are in the ledger row `ci` and in the seat's FINAL MESSAGE. This spec changes no code; the run judges the markdown
against the suite's canon laws.

## 9 · NEW MAIN 3f22388 (unit mlaw landed, runner M's new-main line, 20 Nov 2026)

Read against `3f2238887947e5827d2ce8f07a480e9dea3f527c`. **Nothing this spec cites moved:**
```
$ git diff --quiet 5759cce 3f22388 -- scripts/{gaffer_brain,teaching_audit,forge_session,study_scope,register,teaching_gate,teaching_bar,learn_digest,sitting,dugout,notes_compiler,rails,intent,claims}.mjs .claude/skills .gitignore && echo "cited files equal"
cited files equal
```
Every `file:line` of §1-§7 therefore stands at 3f22388. What the new main does change for this unit:
- **The build's base.** `ci/mbank/BASE` names the main the build is cut from, which is now 3f22388 or later (and, under
  FORK mbank-0 (a), the main that carries the landed mcrk build).
- **The suite line of §1 was measured at 5759cce, not re-run at 3f22388.** The new main edits `scripts/organism_test.mjs` and
  adds one member to `package.json`'s organism:selftest line (`node scripts/done.mjs selftest`), so the build seat re-measures the
  hermetic run on its own base. The LOAD ZERO BLOCK 7 canon law this spec is scanned against is unchanged (the diff of
  organism_test.mjs touches no BLOCK 7 line).
- **A build that touches package.json** (this spec proposes none) resolves the organism:selftest line as the union of both member
  sets (forks row 1187 (2)).

## 10 · NEW MAIN cebe3eb (unit mcov landed, runner M's new-main line, 20 Nov 2026)

Read against `cebe3ebe4024c2144b934b3032b3fb837285d926`. One cited organ moved; the rest did not:
```
$ git diff --quiet 3f22388 cebe3eb -- scripts/{gaffer_brain,teaching_audit,forge_session,register,teaching_gate,teaching_bar,learn_digest,sitting,dugout,notes_compiler,rails,intent,claims}.mjs .claude/skills .gitignore && echo "other cited files equal"
other cited files equal

$ git diff -U0 3f22388 cebe3eb -- scripts/study_scope.mjs | grep "^@@"
@@ -745 +746,10 @@ function cli() {
```
What the new main changes for this unit:
- **`scripts/study_scope.mjs` line numbers shift.** One line is added near the top (`:41-44`), and a selftest verb is added in `cli()`.
  At cebe3eb the anchors this spec cites read: GUT_LEAD `:216` (was `:215`), classifyPrompt `:232` (was `:231`), and the planted
  rails shapes `:898-902` (were `:888-892`). The code those lines name is unchanged; §2.6, §3.3 and §3.5 mean these lines.
  `answerOf` (§3.3, §5) is still proposed beside GUT_LEAD.
- **The pre-existing suite red of §1 is cured on the new main.** The organism:selftest line now carries the four orphans
  (deck_lint, home_pin, probe, study_scope). At cebe3eb the one pre-existing red of §1 is expected to be gone, but it was not re-run
  here. The build seat measures the hermetic run on its own base, and the bound (`MEMBER_BOUND_MS`, `scripts/organism_test.mjs`)
  is judged against the parent, never by a rewritten BASE (forks row 1200 (2)).
- **study_scope now has a selftest in the suite.** If a build adds `answerOf` to `study_scope.mjs`, its selftest case lands in
  that member, which now runs in the suite, so the gate gets stricter and no looser.
- **package.json:** this spec still proposes no change to it. A build that does touch it takes the union of both member sets (forks row 1187 (2)).
