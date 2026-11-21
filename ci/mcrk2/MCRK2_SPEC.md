# MCRK2 SPEC — clause one: the crack verb never loses his words

Unit mcrk2, first clause (study-facing, under row 1234). Ruling row 1243, read in the brief, quoted below. Forks rows
1173 / 1189 / 1217 / 1234 / 1243. Written by a cloud spec seat on 21 Nov 2026. **A spec, not a build:** no
existing file is edited on this branch. Everything below is measured at the cut, or it is named as unmeasured.

- **Branch:** `claude/mcrk2-spec`, cut from `origin/main` with `git fetch origin main` + `git checkout -b claude/mcrk2-spec FETCH_HEAD`.
- **Base (the cut):** main = **`7bf008b`** (unit mclk's land tip, which carries mdet and mdtl2). Every `file:line` below is at `7bf008b`.
- **Ledger:** `ci/mcrk2/LEDGER.jsonl`, one row per act.

> **Row 1243, verbatim (its decision cell):** (1) The existing plan unit mcrk2 takes this as its first clause, study-facing under row 1234, spec seat now: the crack verb never loses his words. BRANCHES inside the verb: axis and moment present, written as today; axis ON and no moment declared before his answer, WRITTEN with the moment named undeclared; no axis ON, WRITTEN with the axis named none and the concept of the open session; the prompt record absent, stale or from another session, refused as today, since then there are no words of his to write. (2) A gap so named is the teacher miss, never his: it reds on the teaching gate of that turn by name and counts as drift; it files no card and blocks no note. (3) The notes compiler reads a crack with a named gap as a crack; the spec states how its axis is settled at compile, from the pacer ledger of that turn, never guessed. (4) The two lost cracks of 21 Nov: the spec states whether the prompt record of those turns still exists to recover them; if not, named lost, once. (5) The runner repeats the count at each day close until mcrk2 lands, one line to the architect.

---

## 0. Measurements at the base (run in this container on 21 Nov 2026, at 7bf008b)

Dated record. Each command was run from the repository root; its last line is copied as it printed.

```
$ git fetch origin main && git log --oneline -1 FETCH_HEAD
7bf008b unit mclk (forks rows 1227 / 1228 (adopted at bd09ef1)): land branch on land/mdtl2 4d582d5 ...

$ node scripts/forge_session.mjs selftest            # last line
forge_session selftest: 243 passed, 0 failed

$ node scripts/notes_compiler.mjs selftest           # last line
notes_compiler selftest: 48 passed, 0 failed

$ node ci/witness/mcrk/witness_crack.mjs plants --tree . --base-tree <git archive 7bf008b>   # last line
PLANTS mcrk · 12 of 12 plant(s) as expected

$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all   # first run, no node_modules in the container
organism_test: 150 passed, 8 failed · ruled 0 · UNRULED 8 · LIVE 125 (hermetic: named, not run)
#   the 8 reds were each ERR_MODULE_NOT_FOUND (lawpack, ci_verdict, red_cause, done, probe, fsrs, mutagen + the roll-up):
#   the container's own missing install, not the tree. After `npm ci`:
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all   # last line, exit 0
organism_test: 166 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)
```

The neutral machine's check runs on this branch's tips are named in §9.

**The runner's counts** (rows 1240 / 1241 / 1243, taken on his laptop on 21 Nov 2026) are the ground for this spec.
They are not re-derived here. The ones this clause rests on: since mcrk landed (21 Nov morning) the crack verb was called
twice, wrote 0 rows and refused 2. Both calls were in one session at 11:32 IST. The first was refused with *no axis is ON*.
The second came seven seconds later, with axis d set, and was refused with *no moment declared on axis d before his answer*.
`cracks.jsonl` has never been born. `bank_answer` calls were 0 on every day from 17 Nov, so there were zero captures from 17 Nov.

---

## 1. Today's verb, by file:line (base 7bf008b)

**Owner.** `scripts/forge_session.mjs:28-32` names itself the SOLE WRITER of `dressing-room/state/cracks.jsonl`:
append-only, the row written by `crack` alone, never through `save()`, gitignored. The path is `CRACKS` at `:116`. It reads
`teaching_audit_last.json` read-only: `AUDIT_LAST` at `:107` and `loadAuditLast()` at `:1351-1357`. That file's owner is
`teaching_audit.mjs`. Its `promptHook` at `scripts/teaching_audit.mjs:1635-1656` writes `prompt {text, step, moments,
moments_by_kind, reps, session_id, at}` at every UserPromptSubmit. Its Stop half, `stopHook` at `:1658-1668` and
`:1775`, stamps `consumed_at` on the prompt only when the Stop pairs with the same Claude session.

**The pure core, `crackRow`, `forge_session.mjs:653-679`.** It runs its checks in this order:

| order | line | check | today |
|---|---|---|---|
| 1 | `:655` | no session / no concept | REFUSED "no active session" |
| 2 | `:656` | `closed_at` set | REFUSED "was closed" |
| 3 | `:657-658` | `current_axis` not in AXES | **REFUSED "no axis is ON"** (the first refusal of 21 Nov) |
| 4 | `:659-662` | prompt absent · text empty · `at` unparseable · `at` before `started_at` | REFUSED "his words are not on disk" |
| 5 | `:663-667` | no non-refused moment on the axis before `prompt.at` | **REFUSED "no moment declared on axis X"** (the second refusal of 21 Nov) |
| 6 | `:668-678` | — | the row: `{v:1, kind:"crack", id, at, day, concept, axis, moment, moment_at, words, words_src, prompt_at, prompt_session_id, step, session_started_at, bank_of}` |

**The verb, `forge_session.mjs:3286-3304`.** `live(need(load()))` comes first. `need` is at `:1480` and `live` at `:1483`.
`live` refuses a closed session and a stale one (STALE_HOURS) before `crackRow` is reached. Then come `readBank` and
`crackRow`. A refusal prints to stderr and exits 1. `readCracks` is unreadable → refused. `sameCrack` at `:691` is the
idempotence key, `(session_started_at, prompt_at)`. Then `appendCrack` at `:693-698` appends and reads back. It prints
the length of his words and never the words.

**Two facts the ruling's "as today" depends on:**

- **F-a · ORDER.** The axis check (row 3) runs **before** the prompt check (row 4). The first refusal of 21 Nov
  therefore says nothing about whether his words were on disk at that moment: the axis check short-circuited.
- **F-b · "FROM ANOTHER SESSION" IS NOT CHECKED TODAY.** Row 4 refuses absent, empty and *before-this-forge-session*
  prompts. It does **not** read `prompt.consumed_at`, which marks a prompt already paired to a finished Stop, i.e. an
  earlier turn's words. It also does not compare `prompt.session_id` with anything; `:676` only records it. The record
  `teaching_audit_last.json` is shared by every Claude session on the machine: `teaching_audit.mjs:1663-1667` names the
  parallel-session interleave. So "refused as today" covers absent and stale-before-start, and does **not** cover a
  parallel session's prompt. This is fork **F2**.

**The moment log.** `addMoment` at `forge_session.mjs:351-356` logs every moment with `axis: current_axis || null`. So a
moment declared with no axis ON is logged with `axis: null`. Today `crackRow`'s filter at `:664-665` (`m.axis === axis`)
can never select such a moment.

---

## 2. Q1 — the four branches inside the verb

### 2.1 Proposed code path (`scripts/forge_session.mjs`, `crackRow` only + the verb's print line)

The new order of checks inside `crackRow`. Rows 1 and 2 are untouched.

1. `:655` no session → REFUSED (unchanged).
2. `:656` closed → REFUSED (unchanged). `live()` at `:1483` still refuses closed and stale *sessions* before `crackRow` runs.
3. **The prompt check moves to third place**, ahead of the axis check. Absent, empty, unparseable, or `at < started_at` →
   REFUSED "his words are not on disk …", with the same text as today. If **F2** is ruled (a) or (c), a
   `consumed_at` set → REFUSED "his words of this turn are not on disk (the prompt record is an earlier turn's, consumed at
   <t>)". If **F2** is ruled (b) or (c), the session check below is added. This is branch 4 of row 1243.
4. **Axis resolution, never refused.** `axis = current_axis` if it is a legal axis. Otherwise `axis = "none"` and
   `gap = "axis-none"`. The concept is `s.concept`, i.e. "the concept of the open session". This is branch 3.
5. **Moment resolution, never refused.** The last non-refused legal moment before `prompt.at` whose `m.axis` equals the
   axis. With `axis === "none"`, the candidates are moments logged with `axis: null` (fork **F4** on whether those count).
   With none found: `moment = "undeclared"`, `moment_at = null`, and `gap = "moment-undeclared"` (when the axis is ON). For
   axis none with no moment the gap is `"axis-none+moment-undeclared"`. This is branch 2; branch 1 is the unchanged path.
6. The row is today's row plus **two additive fields**: `gap` (`null` | `"moment-undeclared"` | `"axis-none"` |
   `"axis-none+moment-undeclared"`) and `gap_owner: "teacher"`, which is set whenever `gap` is non-null (row 1243 (2): the
   miss is the teacher's, never his). `v` stays `1`: the change is additive and no reader keys on `v`; see §6. `moment` is
   **never `null`**. Ruling 1189 (7) mcrk-7 a forbade `moment:null`, so the miss is the **string** `"undeclared"`, named and
   not blank. `axis` is the string `"none"` and never `null`, for the same reason.
7. `bank_of` keeps its rule at `:669-672`. With axis `"none"` no bank row matches (bank rows carry a real axis), so it is
   `null`. That is truthful.

The verb's print at `:3302` adds ` · GAP <gap> (the teacher's miss, named — red on this turn's teaching gate)` when `gap`
is set. It still prints the length of his words only. `sameCrack` at `:691` is unchanged: one row per answer, gap or not.

### 2.2 The four branches, each planted (witness clauses G1–G4, §7)

| branch (row 1243 (1)) | plant | base 7bf008b | build |
|---|---|---|---|
| B1 axis + moment present | axis c ON, `moment check_q`, prompt after | written (K1) | written, `gap:null`: **unchanged** (a guard clause, green both sides) |
| B2 axis ON, no moment before his answer | axis d ON, no moment, prompt after (the 21 Nov 11:32 second shape) | **REFUSED** exit 1 | **WRITTEN** exit 0: axis d, `moment:"undeclared"`, `moment_at:null`, `gap:"moment-undeclared"`, words byte-equal |
| B3 no axis ON | session open at step 3, no `axis now`, prompt (the 21 Nov 11:32 first shape) | **REFUSED** exit 1 | **WRITTEN** exit 0: `axis:"none"`, concept of the session, `gap` per step 5 |
| B4 prompt absent / stale / other session | (a) no record (b) `at` before `started_at` (c) empty text (d) `consumed_at` set [F2] (e) other `session_id` [F2] | (a)(b)(c) REFUSED; (d)(e) **written** | all REFUSED, exit 1, no file born |
| B4×B3 order | no axis ON **and** no prompt record | REFUSED "no axis is ON" | REFUSED "his words are not on disk" (the prompt check is first) |

---

## 3. Q2 — the gap is the teacher's miss: red by name, counted as drift, no card, no note blocked

**Owners at the base:**

- **The teaching gate of that turn** is `scripts/teaching_gate.mjs` (G2), a Stop hook in its own process. It is the SOLE WRITER of
  `dressing-room/state/teaching_gate.jsonl` (`:58`). Its check catalogue `CHECKS` is at `:98` (`B.moment` at `:145`), its
  rank `RANK` at `:173-174`, and `red()` at `:486`. A **`count`** mouth is a PRESENCE red: it is logged and drift-counted,
  **never blocked** (`:94-96`, `:754`, `:766`). It gates the study session only (`:28-31`, the G0 scope).
- **The drift ranking** is `scripts/teaching_contract.mjs`. It is the sole writer of `teaching_contract.json` (`:46`). Its
  code lane `autohit` is at `:1889-1897` (`autoHitRule` at `:353-364` refuses an id the file does not hold). New seed rules
  reach the live file through `withSeedDefaults` at `:924` (via `load` at `:945-951`).
- **The only caller of `autohit`** is `scripts/teaching_audit.mjs`: `autoHit` at `:1588`, which goes through `contractCall`, a
  child process of the CLI. That is the door, and no file is written directly. Its emitted ids are mirrored in
  `CHECKED_RULES` at `:186-193`, and the selftest mirror at `:2135-2145` may only widen.

**Proposed code path (each organ writes only its own file; every cross-organ act goes through the owner's reader or CLI):**

- **G2 red.** `teaching_gate.mjs` gains the check id **`C.crack-gap`**: family C (state), mouth **`count`**, and a fix line:
  *"agle turn se: answer se PEHLE `forge_session.mjs moment <kind>` (aur `axis <x> now`) — crack ke words likhe gaye, gap
  teacher ka hai"*. `stopHook` at `:785-812` reads the crack rows through **`readCracks` imported from forge_session.mjs**,
  read-only, the same import notes_compiler already makes at `notes_compiler.mjs:109`. It passes them to `decide()` as a new
  input `cracks`. Inside study scope, `decide` reds `C.crack-gap` for each row with `gap` set whose `prompt_session_id ===
  payload.session_id` and whose id this session's own log rows have not yet named. The log row gains `crack_gaps: [ids]` in the
  gate's own file, so each gap reds **once**, on the first Stop after it is written, which is that turn's Stop (the verb runs
  mid-turn). The red's detail names the row id and the gap, for example *"crack ck-… written with moment undeclared on axis d —
  the teacher's miss"*. Mouth `count` means the turn is allowed, so the red **blocks nothing**. `C.crack-gap` is placed in
  `RANK` beside `B.moment` (fork **F3** for the identity rule).
- **Drift count.** `teaching_audit.mjs` `stopHook` gains one emitter. When the paired prompt (`paired` at `:1668`) has a crack
  row with `prompt_at === p.at` and `gap` set (read through the same imported `readCracks`), it pushes drift
  **`crack-gap`** (evidence: row id, gap, axis, concept, never his words). It joins the list before staging, as `missDrift`
  does at `:1732`. The existing `io.autoHit` → `teaching_contract.mjs autohit crack-gap` then counts it. `CHECKED_RULES` and
  its selftest mirror widen by `"crack-gap"` together, and the machine-sees semantics row is added beside `:228-231`.
  `teaching_contract.mjs` gains the seed rule `r("crack-gap", …)` beside `uncaptured-rep` at `:219`. Without that seed,
  `autohit` exits 1 on his laptop: this is the re-seed trap that file's own header names twice.
- **No card.** Neither path calls `captains_call.mjs`, and the witness asserts that no `captains_call*` state file is born.
  **No note blocked.** `notes_compiler.mjs` never refuses or skips a compile because of a gap (§4); the gap becomes a named
  line in the note's `GAPS`, marked as the teacher's.

Whether one or both lanes carry it is fork **F1**. The ruling says "reds on the teaching gate … and counts as drift", and those
are two owners at the base.

---

## 4. Q3 — the compiler reads a gap crack as a crack; its axis is settled from the pacer's ledger, never guessed

**Base readers:** `compileDay` at `notes_compiler.mjs:447-508` reads the rows once at `:470-471`, then filters them per
`(concept, axis)` group at `:494`: `String(r.axis).toLowerCase() === a && inWin(r.at)`. The groups come **only** from
`axisWindows` at `:250-271`. Those windows are made from the pacer's own ledger: `forge_session.json` + `forge_sessions.jsonl`,
`axes_now_history` (or `axes_now_at`), and `axes_marked_at` (`declarationsOf` at `:238-245`). `buildNote` at `:352-367` stamps
`moment / words / crack_id / words_at` onto the turn's diff item, or adds an empty-diff item plus a named gap.

**What base does with the new rows:**

- `moment:"undeclared"` on a real axis is stamped as-is. `buildNote` copies `r.moment` without checking it. **The note
  compiles**, and the crack is a crack. Only the naming is missing.
- `axis:"none"` matches no group at `:494`. **The words are dropped silently**: they are in no note, and the compile
  result does not name them. That is the loss row 1243 (3) forbids.

**Proposed code path (`scripts/notes_compiler.mjs`):**

1. A new pure function, `settleCrackAxis(row, sessions, ex)`, which reads the pacer's ledger only, i.e. the same session
   objects `axisWindows` reads, matched by `row.session_started_at === s.started_at` and `row.concept`. It returns
   `{axis, by}` or `{axis:null, why}`:
   - (i) a real axis → `{axis: row.axis, by: "the row"}`;
   - (ii) `axis:"none"` and **exactly one** window of that session contains `row.prompt_at` → that window's axis,
     `by: "axis window <from>…<to>"`;
   - (iii) else, **exactly one distinct axis** declared in that session's `axes_now_history` inside **the turn**, i.e.
     `[row.prompt_at, the next record of his in ex after prompt_at)` (or `[prompt_at, row.at]` when ex holds no later record of
     his) → that axis, `by: "axis declared in the turn at <t>"`;
   - (iv) else → `{axis:null, why: "no axis in the pacer ledger of its turn" | "two axes declared in its turn (<x>, <y>)"
     | "its session is not in the pacer ledger"}`. **Never** the last moment's axis, the last marked axis, or a text
     match: those would be guesses. Which of (ii) and (iii) are adopted is fork **F4**.
2. At `:494`, a row joins the group whose `a` equals its **settled** axis. The row object handed to `buildNote` keeps
   `axis:"none"` and gains `axis_settled: {axis, by}`; the stored row is never rewritten.
3. In `buildNote` at `:352-367`, a gap row is a crack like any other: the same stamp, plus `gap` on the item. It adds one
   `gaps` line: *"crack row <id>: <gap> — the teacher's miss, not his"*. The render (`:426-427`) prints `· moment undeclared`
   or `· axis settled <x> (<by>)` on his `[N]` HIS WORDS line. That is a label, and his words stay untouched.
4. An unsettled row (iv) is in no note, but it is **named on the compile result**. This is beside the existing
   `cracksNote` (`:471`): `"… · <k> crack row(s) unplaced: <id> (<why>)"`, printed through the existing result line at
   `:716`. The words stay in `cracks.jsonl`, the owner's file. Nothing is lost, and nothing is placed by a guess.
5. A gap never sets `ok:false`, never skips a group, and never refuses a compile (the "blocks no note" law).

---

## 5. Q4 — the two refused cracks of 21 Nov 11:32 IST: can the same door recover them?

**The verb's own read** is `loadAuditLast()` → `teaching_audit_last.json` → `.prompt` (`forge_session.mjs:1351`,
`:659-662`). That record is **overwritten at every UserPromptSubmit**, on every Claude session on the machine
(`teaching_audit.mjs:1635-1656`). The `teaching_audit.jsonl` log row (`:1813-1830`) carries `user_text_source`, never the
text. So the same door can recover them **iff** the record still holds the prompt of the 11:32 IST turn: `prompt.at`
before 11:32 IST on 21 Nov, after the forge session's `started_at`, and no later prompt submitted since.

**The read** (on his laptop; prints the timestamp, an 8-character session prefix, `consumed_at` and the length of the
text, **never the text**):

```
node -e "const f=require('fs');const j=JSON.parse(f.readFileSync('dressing-room/state/teaching_audit_last.json','utf8'));const p=j.prompt||{};const s=JSON.parse(f.readFileSync('dressing-room/state/forge_session.json','utf8'));console.log(JSON.stringify({prompt_at:p.at||null,sid8:String(p.session_id||'').slice(0,8),consumed_at:p.consumed_at||null,len:String(p.text||'').length,session_started_at:s.started_at||null,current_axis:s.current_axis||null}))"
```

**The decision rule** (code-shaped, applied by whoever runs it):

- recoverable ⇔ `prompt_at` ∈ [`session_started_at`, 2026-11-21T06:02Z] (11:32 IST = 06:02 UTC; the refusal's own second is
  on the runner's transcript, not here) **and** `len > 0`. In that case the build's verb, once landed, writes it through the
  same door with `crack` (no args) in a session still on that forge session, and the row's gap names the miss;
- otherwise **named lost, once**: *"two crack answers of 21 Nov 11:32 IST are lost — the prompt record was overwritten
  before the verb could write them (the teacher's miss: no axis ON, then no moment declared)"*. Fork **F5** decides where
  that one line lives.

From the cloud the expectation is **unread**, and that is stated as unread, not as an answer. The runner counted 20 teaching
turns on 21 Nov, and any later prompt overwrites the record. Other copies of his words exist (the session transcript, and the
archive word lane that the compiler reads at `notes_compiler.mjs:480`), but they are **not the verb's door**. Recovery
through them would be a new door, and that is fork **F5 (c)**.

---

## 6. Q5 — every reader of cracks.jsonl at the cut, and what each sees after the change

Found with `grep -rn "readCracks\|cracks.jsonl\|CRACKS\b" --include=*.mjs .` at 7bf008b.

| reader | file:line | after the change |
|---|---|---|
| the verb's idempotence | `forge_session.mjs:3294-3297` (`sameCrack` `:691`) | unchanged: one row per `(session_started_at, prompt_at)`, gap rows included |
| pacer `status` | `forge_session.mjs:3273-3275` | counts gap rows in "cracks this session: n"; **proposed** suffix ` (k with a named gap — the teacher's miss)` |
| notes compiler, compile | `notes_compiler.mjs:470-471`, `:494` | settles axis (§4); unplaced rows named on the result |
| notes compiler, build/render | `notes_compiler.mjs:352-367`, `:426-427`, `:391` | a gap crack is a crack; `gaps` names the teacher's miss; HIS WORDS line labelled |
| teaching gate (new reader) | `teaching_gate.mjs` `stopHook` `:785` (proposed) | reads, reds `C.crack-gap` once |
| teaching audit (new reader) | `teaching_audit.mjs` `stopHook` `:1658` (proposed) | reads, emits drift `crack-gap` |
| mcap witness c18 | `ci/witness/mcap/witness_capability.mjs:218-225` (via `readCracks` when exported), predicate `:226ff` | sees the rows. A `moment:"undeclared"` row is **not a legal moment**, so c18 stays red for that answer. That is correct: the miss is visible and not laundered. Not edited. |
| mcrk witness | `ci/witness/mcrk/witness_crack.mjs:98` (K-plants), K3 `:175-192` | **K3 (b) and (c) go RED on the build**: they assert today's two refusals. This file is a **suite member**: the CLAUSE WITNESSES walk at `scripts/organism_test.mjs:2962-2990` runs every `ci/witness/*/witness_*.mjs`. See fork **F6**. |
| skill text | `.claude/skills/forge/REFERENCE.md:84` | "refused when absent, never typed by you" stays true (branch 4); no edit required (fork F7) |

No reader keys on `v`. `dugout.mjs` and `brain.mjs` only use the word "crack" in prose and are not readers.

---

## 7. Q6 — the witness clauses and the mutants

**Shape.** A new clause witness `ci/witness/mcrk2/witness_crack_gap.mjs plants [--tree] [--base-tree] [--only] [--tmp]`,
copying the `witness_crack.mjs` contract (`:12-23`). Every plant is a copy of `<tree>/scripts` under `os.tmpdir()`, with a
planted `dressing-room/state` written by the witness's own node code (`writeFileSync`). It never opens the repository's state
dir, deletes every `ARSENAL_*` variable, and puts a refusing `claude`/`gemini` shim on PATH. **Port class (row 1053):** it binds
no port, names no service, POSTs nothing and restarts nothing. Every wait is a `spawnSync` that ends with its child, and no
timeout, budget or size is typed. The walk at `organism_test.mjs:2962` picks it up with no suite edit. There is also a unit
witness `ci/mcrk2/witness_mcrk2.mjs` and a mutant runner `ci/mcrk2/run_mutants_mcrk2.mjs`, on the `ci/mcrk/` pattern.

Each clause: what is planted · RED on base 7bf008b · GREEN on the build · its mutant (which must turn it RED).

| id | plant → assertion | base | build | mutant (one per clause) |
|---|---|---|---|---|
| **G1 BOTH** | axis c + check_q + prompt → exit 0, 1 row, moment check_q, `gap:null`, words byte-equal | GREEN (guard) | GREEN | M1: set `gap:"moment-undeclared"` unconditionally → RED |
| **G2 UNDECLARED** | axis d ON, no moment, prompt → exit 0, 1 row, axis d, `moment:"undeclared"`, `moment_at:null`, `gap:"moment-undeclared"`, `gap_owner:"teacher"`, words byte-equal | **RED** (refused, exit 1) | GREEN | M2: **restore the `:667` refusal** → RED |
| **G3 NOAXIS** | open session, no `axis now`, prompt → exit 0, 1 row, `axis:"none"`, concept = session's, `gap` starts `axis-none`, words byte-equal | **RED** (refused) | GREEN | M3: **restore the `:658` refusal** → RED |
| **G3b ORDER** | no axis ON **and** no prompt record → exit 1 "his words are not on disk", no file | **RED** (says "no axis is ON") | GREEN | M3b: move the prompt check back after axis resolution → RED |
| **G4 REFUSE** | (a) no record (b) `at` < `started_at` (c) empty text, plus F2's (d) `consumed_at` set / (e) other `session_id` → each exit 1, its named line, no `cracks.jsonl` | (a)(b)(c) GREEN, (d)(e) **RED** | GREEN | M4: drop the `pAt < sAt` test → (b) RED; M4d: drop the F2 test → (d)/(e) RED |
| **G5 SESSION BYTES** | the G2 and G3 plants: `forge_session.json`, `forge_sessions.jsonl`, `resume_pointer.jsonl`, `relocks.jsonl`, `teaching_audit_last.json` byte-equal before/after, **and** the row exists | **RED** (no row) | GREEN | M5: `save(s)` inside the crack case → RED |
| **G6 GATE** | `teaching_gate.mjs decide()` imported from the copy: a planted study sitting + transcript + gap row with `prompt_session_id` = payload's → `reds` ∋ `C.crack-gap`, `decision:"allow"`, its detail names the row id; the second Stop (log row names it) → no red; a gap row of another session → no red | **RED** (no such id) | GREEN | M6a: mouth `"patch"` → RED (it blocks); M6b: drop the once-latch → RED |
| **G7 DRIFT** | `teaching_audit.mjs stopHook` with a planted `io`: paired prompt `at` = row's `prompt_at`, gap set → drifts ∋ `crack-gap`, `io.autoHit` called with it; `teaching_contract.mjs` CLI on an empty planted state → `rules` lists `crack-gap`; `CHECKED_RULES` ∋ it | **RED** | GREEN | M7a: drop the emitter → RED; M7b: drop the seed → RED (autohit exits 1) |
| **G7b NO CARD** | after G6+G7 on one plant: no `captains_call*` state file born, `teaching_gate.jsonl` decision `allow` | GREEN (guard) | GREEN | M7c: emitter files a card through the CLI → RED |
| **G8 NOTE NOT BLOCKED** | end-to-end through the verb: axis c ON, no moment, prompt, teacher ```diff turn in a planted archive root → `crack`, then `compileDay` → `ok:true`, op compiled, the crack item carries `moment:"undeclared"` + his words + `gap`, `gaps` names "the teacher's miss" | **RED** (no row: refused) | GREEN | M8: `compileDay` skips a group holding a gap row → RED |
| **G9 SETTLE** | three axis-none plants via the verb: (i) a window contains `prompt_at` → the note of that axis carries it, `axis_settled.by` names the window; (ii) one `axis b now` inside the turn → axis b's note, `by` names the declaration; (iii) none / two axes → in no note, the result names `unplaced` with its why | **RED** (no row; and a planted row is silently dropped at `:494`) | GREEN | M9a: settle by the last moment's/marked axis (a guess) → (iii) RED; M9b: drop settling → (i)(ii) RED |
| **G10 READERS** | pacer `status` on a session with one gap row prints `cracks this session: 1 (1 with a named gap …)`; `readCracks` returns gap rows unchanged (`kind:"crack"`) | **RED** | GREEN | M10: status filters gap rows out → RED |
| **G11 MCRK CARRY** | `witness_crack.mjs` (after F6) plants GREEN on the build | — | GREEN | (covered by M2/M3 turning G2/G3 red) |

**Files a build would touch:**

- `scripts/forge_session.mjs`: `crackRow` (`:653-679`), the crack case print (`:3302`), the status line (`:3274-3275`), the
  header law line (`:28-32`: "refused only when his words are not on disk"), and its selftest crack block (`:2665-2702`). The
  REFUSES assert at `:2678-2685` loses its two refusal legs and gains G2/G3's write legs. That is a guarded behaviour
  inverted by ruling, and it is named here (fork F6).
- `scripts/notes_compiler.mjs`: `settleCrackAxis`, `compileDay` `:470-471`/`:494`, `buildNote` `:352-367`, render
  `:426-427`, the result line `:716`, and the header `:62-66`, with selftest clauses.
- `scripts/teaching_gate.mjs`: `CHECKS` (`:98`), `RANK` (`:173-174`), `decide()` input, `stopHook` read + log field, and
  selftest clauses.
- `scripts/teaching_audit.mjs`: the emitter in `stopHook`, `CHECKED_RULES` `:186-193`, the semantics table near `:228-231`,
  and the selftest mirror `:2135-2145`.
- `scripts/teaching_contract.mjs`: the seed rule near `:219`.
- **New:** `ci/witness/mcrk2/witness_crack_gap.mjs`, `ci/mcrk2/witness_mcrk2.mjs`, `ci/mcrk2/run_mutants_mcrk2.mjs`,
  `ci/mcrk2/PROOF.md`, `ci/mcrk2/BASE`.
- **Beyond these, each a fork:** `ci/witness/mcrk/witness_crack.mjs` (F6, forced: a suite member goes red otherwise) ·
  `.claude/skills/forge/REFERENCE.md:84` (F7) · `learning-layer/teaching_gate/RULE_TABLE.json` (not needed:
  `completeness` at `teaching_gate.mjs:821-835` refuses only unmapped *rows* and mappings to *missing* ids, never an unmapped
  check id; named so a builder does not touch canon).

---

## 8. FORKS — each needs the architect's ruling

- **F1 · which lanes carry the gap.** (a) teaching_gate `C.crack-gap` (count mouth) **and** teaching_audit drift
  `crack-gap` → `teaching_contract autohit` · (b) teaching_gate only (its log is G2's count; the contract ranking does not
  see it) · (c) teaching_audit drift only (no G2 red). **Recommend (a):** row 1243 (2) says both "reds on the teaching
  gate" and "counts as drift", and at the base those are two owners. *Measured by:* G6 + G7.
- **F2 · "from another session" in branch 4.** Today's verb does not check it (§1 F-b). (a) refuse when `prompt.consumed_at`
  is set, i.e. an earlier turn's words · (b) refuse when `prompt.session_id` ≠ the session that is calling, which needs an
  identity the verb can read; the open sitting's `host_session_id` is the only one on disk · (c) both · (d) as today, no
  new check. **Recommend (a)** now. It is local, it needs no identity, and a gate only gets stricter. (b) needs F2-b's
  measurement first. *Measured by:* on his laptop, how often `consumed_at` is set when a crack would be run: the
  `teaching_audit.jsonl` `user_text_source` mix of study turns. Plus whether Claude Code hands a Bash child its session id
  (named in §10).
- **F3 · the gate's turn identity.** (a) `prompt_session_id === payload.session_id` plus a once-latch in the gate's own
  log · (b) parse the crack call's tool_result line in the turn's transcript (`parseTranscript` at `:327` reads tool_use
  today, and tool_result reading would be new) · (c) a time join on `row.at` within the turn. **Recommend (a):** it uses no
  text and no time join, the same spirit as row 1194 (1).
- **F4 · how an axis-none crack is settled.** (a) a containing window only (§4 ii) · (b) a window, else exactly one axis
  declared in the turn (§4 ii + iii) · (c) (b) plus the axis of an `axis:null`-logged moment's next declaration. **Recommend
  (b):** both read the pacer's ledger of that turn and refuse on ambiguity. (c) starts to guess. *Measured by:* on his
  laptop, over `forge_sessions.jsonl`, how many sessions declared a moment with `axis:null` (`moments_log[].axis === null`),
  i.e. how often (c) would differ. Also, sub-fork F4-m: do moments logged with `axis:null` give an axis-none crack its
  moment (step 5)? Recommend **yes**, since that moment was really declared before his answer.
- **F5 · the two lost cracks of 21 Nov.** (a) if §5's read says lost: one line in the build's `ci/mcrk2/PROOF.md` and the
  runner's next day-close line to the architect, once · (b) as (a), plus one teaching_contract `flag` by the teacher of
  that session · (c) recover from the archive word lane or the transcript through a new one-shot door. **Recommend (a):**
  row 1243 (4) says "named lost, once", and (c) is a new door that row 1243 did not grant.
- **F6 · the mcrk witness's K3 (b)/(c).** It is a suite member, so on the build it goes red. (a) the build narrows K3 to
  (a)(d)(e) in place and cites row 1243; the inverted assertions live in mcrk2's G2/G3 · (b) K3 split into `K3` (kept
  refusals) + `K3bcLegacy`, marked superseded and skipped by name · (c) leave it and accept a red suite. **Recommend
  (a):** L9 is honoured by the git history plus the PROOF naming the two inverted legs. A skip (b) is a quieted gate.
- **F7 · the skill carriers.** (a) no skill edit: REFERENCE.md `:84` stays true · (b) one added sentence in REFERENCE.md:
  "an undeclared moment or no axis still writes his words; the gap reds on you". **Recommend (a)** for clause one; carry (b)
  to mcrk2's later clauses if the architect wants the teacher told before the miss rather than after.
- **F8 · the gap's spelling.** (a) `moment:"undeclared"` / `axis:"none"` strings plus `gap` · (b) `moment:null` / `axis:null`
  plus `gap`. **Recommend (a):** ruling 1189 (7) mcrk-7 a forbade `moment:null`, and row 1243 says "named undeclared" and
  "named none".
- **F9 · gate scope.** The G2 gate judges only a bound study sitting (`teaching_gate.mjs:28-31`). A gap written in an
  unbound session reds only through the F1 drift lane. (a) accept · (b) let `C.crack-gap` red outside scope too (a
  count, never a block). **Recommend (a)** for clause one. *Measured by:* whether the 21 Nov 11:32 session had a sitting
  bound (§10).

---

## 9. The neutral machine on this branch

The check runs of each pushed tip, read from the public API with no token
(`curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`), are recorded in
`ci/mcrk2/LEDGER.jsonl` (act `ci-read`) and in the seat's final message. A spec-only diff carries no code. The
suite's head-vs-base verdict therefore measures the canon-count law (LOAD ZERO BLOCK 7) over this file, and nothing else
moves.

---

## 10. NAMED, NOT GUESSED — what the cloud could not reach, and what would measure it on his laptop

- **Do the two 21 Nov prompts still exist?** Run the §5 read on his laptop. It prints the timestamp, session prefix,
  consumed and length only.
- **Was a sitting bound to the 11:32 IST session?** (F9) Run `node scripts/sitting.mjs status`, or compare
  `sitting.json.host_session_id` with the 8-character session prefix of the runner's transcript.
- **What did the first refusal's prompt record hold?** (F-a) It is unrecoverable by construction: the axis check
  short-circuited. The `teaching_audit.jsonl` row of that turn's Stop gives `user_text_source` (fresh / mismatch /
  missing): `grep` that day's rows by ts, fields only.
- **How often is `consumed_at` set mid-turn?** (F2) Count `user_text_source` over study-scope rows of `teaching_audit.jsonl`
  since 13 Nov.
- **Does a Bash child of Claude Code see its session id?** (F2-b) In a study session, run `node -e "console.log(Object.keys(process.env).filter(k=>/SESSION/i.test(k)).join(' '))"`.
  It prints names only, never values.
- **How often are moments declared with no axis?** (F4) Over `forge_sessions.jsonl`, count `moments_log` entries with
  `axis === null`.
- **The live seed of teaching_contract.json** carries no `crack-gap` today. It is gitignored, so only the build's `load()`
  growth (G7b's seed leg) proves it travels: `node scripts/teaching_contract.mjs status` after landing.
- **Refusals are not persisted anywhere.** The verb writes nothing on refusal (K3, by design), so the runner's count of
  refused calls comes from transcripts. Row 1243 (5) keeps that count at each day close until mcrk2 lands; this spec adds
  no refusal ledger.
- **Whether `npm ci` is part of the neutral machine's hermetic run:** yes, per `suite.yml` (the `npm ci` step before the
  hermetic run). This container needed it too (§0).
