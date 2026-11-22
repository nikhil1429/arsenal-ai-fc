# MAUD43 SPEC — the one-time rebuild of the session-mismatch audit turns of 17-21 Nov 2026

> Unit **maud43** (forks row 1250 (4); the architect's ruling of 21 Nov 2026 about 19:25 IST; **forks row 1282 of
> 22 Nov 2026 rules maud43-1..10**; **row 1283 (2)** adds the Stop-time `new_idea` reading). A **SPEC**: nothing is built here, no state of his is read, no model is called.
> Branch `claude/maud43-spec`, cut from the mbank BUILD tip **f635d68b1bce300b58aa031ed49278b8bbe3e5a8** (row 1269 (1),
> mbank provisionally adopted, NOT on main). At the cut, `origin/claude/mbank-build` had not moved past it. Main was
> `7bf008b`. On 22 Nov 2026 main `a0645d23bd33770da4a1bcc9d0d84d696a643d42` (mshard + mgat) was merged in, as the runner
> ordered (rows 1272 (5) / 1273 (1)). That merge touches none of the files this spec cites, so every `file:line` below,
> read at f635d68, still holds. Ledger: `ci/maud43/LEDGER.jsonl`.
>
> **This revision (22 Nov 2026) is the spec as ruled by row 1282.** It becomes a BUILD only after mbank lands on main, and
> only when the runner says so. Not a landing.
>
> **ACCEPTED as the ruled spec, row 1286 (22 Nov 2026); BUILT on `claude/maud43-build`, cut from main
> `d585648e3438147d97140248c69f900af7327d58` (mbank landed, row 1284).** The proof is `ci/maud43/PROOF.md`; the base is
> `ci/maud43/BASE`. The `file:line` anchors below are read at f635d68. Every one is byte-identical at d585648 (§ RE-ANCHOR):
> `git diff --stat f635d68 d585648` over the six cited files prints nothing. The build's own lines are named there.

## 0 · THE HEADLINE (revised 22 Nov 2026, row 1282)

The per-session record mbank adds (`prompts_by_session` in `teaching_audit_last.json`) keeps ONE entry per Claude session
and **no history of turns** (`scripts/teaching_audit.mjs:1645` stubOf). The 17-21 Nov sessions also predate it on his
laptop. So **the session id names the one transcript file** (`scripts/study_scope.mjs:100` transcriptPathFor; an own
record's `transcript_path` when one exists). A mismatch row carries no turn locator (`turn_id: null`, `:1864`).

**The ruled join, maud43-1 (b) narrowed.** Inside that ONE file, a row's turn is **the last human prompt written before the
row's own stamp**. Time orders the lines of one file. It never picks a session and never crosses a file. The row's two
recorded booleans (`samajh_check.seen`, `new_idea`) must agree with the turn, or the row is **unpairable**. A turn reached
by more than one row is **rebuilt once, naming every row it supersedes**.

**C3, answered by the runner on his laptop** (row 1282 (2), read-only, counts only, IST window 17-22 Nov):

```
of 47: PAIR 47 · CROSS-CHECK FAIL 0 (seen 0 of 47 checked · new_idea 0 of 47 checked) · SHARED TURNS 6 (rows 12; of them paired 12) · no prompt before ts 0 · no file 0 · distinct turns reached 41
```

**How that count read `new_idea` (row 1283 (2)).** The runner's count handed `pictureFacts` an EMPTY last assistant
message (`pictureFacts(turn.blocks, "")`). The audit did not read it that way at Stop time: `turnPicture`
(`:1468-1471`) passes the Stop hook's `last_assistant_message`. The two readings can differ. `pictureOrder` (`:1378-1391`)
takes the final text from that message, so a turn that continues past the Stop (a shared turn) has a different final
text. So `CROSS-CHECK FAIL 0` on `new_idea` is measured under the empty-message reading only. **The build reads it as the
Stop did** (§2), and its dry run re-measures C3 under that reading (§7).

The booleans are not vacuous: `seen=0/new_idea=false 38 · seen=0/new_idea=true 4 · seen=1/new_idea=false 5`. So, on the
runner's count of 22 Nov 2026, the rebuild would write 41 rebuilt rows for 47 old rows, and 0 lost rows. The "43" of the
unit's name is the earlier count quoted in `ci/mbank/PROOF.md` §10; the IST 17-22 Nov window reads 47.

What a rebuild restores is narrow. Exactly ONE check of the audit reads his words: **confusion-is-literal**
(`:942-950`). The moment and rep window ends are prompt-time state snapshots that no transcript holds. The L5 samajh half
and the L4 picture half were already read from the transcript at Stop time (`:1770-1775`, source `"transcript_path"`),
even on mismatch rows. That is exactly why those two halves can serve as the cross-check.

## 1 · THE OWNER and its one verb

| What | file:line at f635d68 |
|---|---|
| The sole writer of `teaching_audit.jsonl` + `teaching_audit_last.json` | `scripts/teaching_audit.mjs:82-89` (header: "this organ is their single writer") |
| The log path, and the state-dir seam the witness uses | `:163` `LOG`, `:162` `STATE_DIR = process.env.ARSENAL_AUDIT_STATE_DIR \|\| …dressing-room/state` |
| `.gitignore` keeps the log out of the public repo | `.gitignore:324` |
| The append writer (one line per row) | `:1606` `appendLogReal` |
| The CLI dispatcher (the verb is added here) | `:2916-2932`; the usage line `:2932` |
| The nearest existing verb, pure over a handed transcript | `:2900` `replayMain` |
| The readers the join reuses (pure, exported) | `:1413` promptOfLine · `:1420` turnOf · `:1523` samajhOf · `:1394` pictureFacts |

**The verb:** `node scripts/teaching_audit.mjs rebuild-mismatch --from <ISO> --to <ISO> [--apply]`.
- With no `--apply` it is the **dry run** (§5). Nothing is written.
- `--from` / `--to` are required and have no default (maud43-7 (a), ruled). The runner passes the IST bounds
  `2026-11-17T00:00:00+05:30` .. `2026-11-22T00:00:00+05:30`. Either one missing or not parsing gives exit 2.
- The verb writes only through `appendLogReal`. It never calls `contractCall` / `autoHit` / `stampChecked`
  (`:1583-1593`), and never writes `teaching_audit_last.json` (maud43-4 (a), ruled).

## 2 · THE SOURCE: from a lost turn to its transcript (the row 1282 (1) join)

```
mismatch row r  (user_text_source matches /^session-mismatch/, r.ts inside --from/--to, r carries no `rebuilt_from`)
  └─ r.session_id ─► ONE file, the SAME expression transcriptAlive already uses (:1647):
        v = mapOf(last.prompts_by_session)[sid]           // mbank's per-session record: stub or open entry, read only
        path = v.transcript_path || transcriptPathFor(sid) // study_scope.mjs:100
     (no file ⇒ LOST, §4)
  └─ L = that file's lines, read once per session
  └─ at = the LAST index i with promptOfLine(L[i]) !== null  AND  Date.parse(JSON.parse(L[i]).timestamp) < Date.parse(r.ts)
     (none ⇒ UNPAIRABLE "no prompt before ts", §4)
  └─ end = the next index after `at` with promptOfLine !== null, else L.length
  └─ turn = turnOf(L.slice(at, end).join("\n"))            // :1420, the whole turn, up to his next prompt
  └─ STOP-TIME VIEW (row 1283 (2)): view = turnOf(the lines of L.slice(at, end) whose `timestamp` <= r.ts, plus any line with
        no timestamp), i.e. the tail this row's Stop read; stopMsg = the text of view's LAST text block (the Stop hook's
        last_assistant_message: the Stop fires after that message is written)
  └─ CROSS-CHECK, each only when the old value is not null:
        r.samajh_check.seen === samajhOf(turn).seen                     // :1523 (his prompt only; the view changes nothing)
        r.new_idea          === pictureFacts(view.blocks, stopMsg).new_idea  // :1394, exactly as turnPicture :1468 did
     (any disagreement ⇒ UNPAIRABLE "cross-check", §4)
  └─ the TURN KEY = (r.session_id, at). Every paired row with the same key is ONE turn (§3, shared turns)
```

- **Time orders lines of ONE file only.** The file is chosen by the session id alone, before any timestamp is read. No
  other session's file is ever opened for this row, and no folder is scanned. W12 proves that a prompt of another session
  nearer in time is never picked.
- **`new_idea` is read as the Stop read it (row 1283 (2)).** The message is never empty. For a turn that continues past
  this row's Stop, `pictureFacts(turn.blocks, "")` takes the LAST text of the whole slice, while the Stop took its own
  message. W14 holds exactly such a turn.
- **Never by text.** No string of his is compared with anything. The cross-check compares two booleans the organ already
  derived from that same file, and it can only refuse a pair.
- **The per-session record is read, not written**, through the same `mapOf` / `transcriptAlive` lines (`:1644-1647`).
- This is the exact join of the runner's C3 measurement (row 1282 (2)), so the build reaches the rows that count reached.

## 3 · WHAT IS WRITTEN: one appended row per rebuilt TURN (his law 9)

One JSON line is appended to `teaching_audit.jsonl` **per distinct turn key**, through `appendLogReal`. The old rows are
never rewritten, moved or deleted; W2 checks that the log's prefix stays byte-identical. The keys stay OFF the fields the
readers count (maud43-3 (a), ruled):

```
{ "rebuilt_at": "<ISO now>", "rebuilt_from": "transcript",
  "supersedes": ["<rowId>", ...],          // EVERY paired row of this turn key, in log order (one or more)
  "of_ts": ["<old ts>", ...],              // same order as supersedes
  "session_id": "<sid>", "concept": "<the last superseded row's concept>", "step": <the last superseded row's measured.step>,
  "user_text_source": "rebuilt-from-transcript",
  "prev_step": <measured.step of the same session's row just before the FIRST superseded row | null>,
  "prev_step_source": "own-session previous row" | null,
  "drifts_rebuilt": ["confusion-is-literal"] | [], "evidence_rebuilt": [...], "excerpts_rebuilt": [...],
  "window": { "moments": null, "reps": null, "moments_by_kind": null,
              "why": "a prompt-time state snapshot is in no transcript" },
  "shared_turn_source": "the last superseded row (its Stop saw the whole turn)",   // row 1286 (1): the choice NAMED on the row
  "stop_message_source": "the stop-time view's last text block",                   // row 1286 (2)
  "staged": [] }
```

- **The two ruled choices are fields on every rebuilt row (row 1286 (1) / (2)).** For a shared turn, `step`, `concept`
  and `assistantText` come from the LAST superseded row, because its last Stop saw the whole turn. The Stop message is
  rebuilt as the Stop-time view's last text block; W14 holds a turn where that differs from the turn's own last text.
- **The shared-turn rule (row 1282 (1)).** On the runner's count of 22 Nov 2026, 6 turns are reached by 12 rows. Each such
  turn is ONE rebuilt row, and its `supersedes` names all of its rows. One turn, one confusion check, so one drift at
  most. The other rows that reach it are typically the Stops of a turn that a non-human line re-entered, such as a
  `<task-notification>`; `promptOfLine` refuses those lines, so their Stops read the same human prompt.
- `rowId` (maud43-2 (a), ruled): sha256 of the old line's exact bytes, without its newline.
- **Why no `ts`, no `scope`, no `drifts`.** Each of the three readers keys on exactly those fields:
  `scripts/teaching_contract.mjs:292-295` windowDrift (the 14-day ranking: `r.ts`, `studyRowOf`, `r.drifts`),
  `scripts/watchman.mjs:284-287` (rows today by `ts`), `scripts/study_scope.mjs:746-756` studySessionsOfDay (`scope` +
  `ts`). With these keys, no reader sees a rebuilt row, and no reader file is touched.
- **The check code is the organ's own** (maud43-6 (a), ruled). `auditTurn` (`:856`) is called unchanged:
  - `assistantText` = the last superseded row's Stop message (its `stopMsg`, §2);
  - `userText` = `turn.prompt`;
  - `session = { concept, step }`, from the last superseded row;
  - `prevStep` as above (maud43-5 (a), ruled), and every window input null (maud43-9 (a), ruled).

  Only the `confusion-is-literal` drift is kept from its result.
- `excerpts_rebuilt` carries `quote(userText)` (`:948`), exactly as a live row does. The file is gitignored
  (`.gitignore:324`). The model tail of `scripts/brain.mjs:2740` may carry it, as it carries live rows (maud43-10 (a),
  ruled).

## 4 · WHAT IS REFUSED

| Case | Verdict | Written | Latched |
|---|---|---|---|
| the session's file is absent (path null, or `existsSync` false) | **lost** | ONE row per old row `{rebuilt_at, rebuilt_from:"transcript", supersedes:[rowId], of_ts:[ts], session_id, lost:true, why:"transcript gone"}` | yes: never retried, even if the file reappears |
| a row whose `rowId` already appears in any `supersedes` of a rebuilt or lost row | **already** | nothing | it is the latch |
| no human prompt in its own file stamped before `r.ts` | **unpairable** (`no prompt before ts`) | nothing | no (maud43-8 (a), ruled) |
| a cross-check boolean disagrees | **unpairable** (`cross-check`) | nothing | no |
| the file exists but cannot be read (EISDIR, EACCES) | **unpairable** (`unreadable`) | nothing | no |
| a rebuilt or lost row itself (`rebuilt_from` present) | never a candidate | — | — |

**The once-latch, by code.** The verb reads the whole log once. It builds `done = Set(rows.filter(r => r.rebuilt_from ===
"transcript").flatMap(r => r.supersedes))` and drops every candidate in `done` before planning. Because a shared turn
latches all of its rows at once, a second `--apply` appends zero lines (W4), and a lost row is named once (W3).

## 5 · THE DRY RUN: counts only

Without `--apply`, the verb reads, plans, prints ONE line, and writes nothing:

```
rebuild-mismatch · window <from>..<to> · candidates <n> · paired <p> · turns <t> (shared <s>, rows <sr>) · lost <l> · unpairable <u> (no prompt <a> · cross-check <b> · unreadable <c>) · already <d> · drifts found <f> · DRY RUN: nothing written
```

With `--apply`, the line ends `· written <w>`, where w = t + l. No prompt text, excerpt, concept name, path or session id
is printed in either mode (W5 plants a canary in his prompt). On the runner's C3 count, the dry run would read
`candidates 47 · paired 47 · turns 41 (shared 6, rows 12) · lost 0 · unpairable 0`. The `drifts found` field is still
unmeasured: the runner reads it from the dry run once the verb is built.

## 6 · THE WITNESS: planted transcripts, no live state, no model call, no port

File (a build's): `ci/maud43/witness_maud43.mjs --org <tree> [--base-org <tree>]`, plus `ci/maud43/run_mutants_maud43.mjs`
(the mbank pattern: `ci/mbank/witness_mbank.mjs`, `ci/mbank/run_mutants_mbank.mjs`).
- **Plants.** Everything goes under `mkdtempSync(join(os.tmpdir(), "maud43-"))`, written by node. It plants a `state/`
  holding `teaching_audit.jsonl` and `teaching_audit_last.json`, and a `home/.claude/projects/<projectSlug(org)>/` holding
  `<sid>.jsonl` transcripts, every line with a `timestamp`.
- **The child.** `node <org>/scripts/teaching_audit.mjs rebuild-mismatch …` is spawned with env
  `ARSENAL_AUDIT_STATE_DIR=<tmp>/state`, `HOME` = `USERPROFILE` = `<tmp>/home`, `ARSENAL_AUDIT_NO_SPAWN=1` (`:1584`), and
  no `ANTHROPIC_API_KEY`.
- **What it never does.** It binds no port, names no service, POSTs nothing, restarts nothing, and calls no model. There is
  no polling wait: each spawn is a pure CLI that exits by itself.
- **Base vs build.** On base the verb is unknown and only the usage line prints, so **every clause is RED on base** (each
  demands the counts line or a rebuilt row). Every clause is GREEN on the build.

| Clause | Plant | GREEN on the build | Its mutant (RED by that clause) |
|---|---|---|---|
| **W1 REBUILD** | session A: a fresh row at step 3 (stamped after A's prompt 1), then a mismatch row at step 4 stamped after A's prompt 2, "samajh nahi aaya …" | one appended row: `supersedes` = [rowId(old)], `user_text_source "rebuilt-from-transcript"`, `drifts_rebuilt` ⊇ confusion-is-literal, `prev_step 3` | **M1** userText taken from the shared `prompt` slot (another session's text planted there) → no drift |
| **W2 KEPT** | W1's tree | the log's first N bytes are byte-identical after `--apply` | **M2** the old row is rewritten in place with a `superseded_by` key |
| **W3 LOST** | session B: a mismatch row, no file | ONE lost row; a second `--apply` appends nothing for B, even after B's file is planted | **M3** a lost row's ids do not enter `done` → a second lost row (or a rebuild) |
| **W4 ONCE** | W1's tree, `--apply` twice | the second run reads `written 0 · already 1` | **M4** an empty latch set → a duplicate rebuilt row |
| **W5 DRY** | W1's tree; his prompt carries the canary `ZQX-MAUD43-CANARY` | the counts line prints; the log is byte-identical; stdout+stderr hold no canary, no concept, no session id | **M5** the dry run appends (or prints the excerpt) |
| **W6 TIME ORDERS ONE FILE** (inverted, row 1282 (1)) | session C: three human prompts at T1 < T2 < T3; the mismatch row stamped between T2 and T3; prompt 2 carries the marker; the rows' log order is deliberately NOT the turn order | the rebuilt row is turn 2 (drift present, `samajh_check.seen 1` agrees) | **M6** the locator takes the k-th prompt by row ordinal (the old (a)), or the FIRST prompt before `ts`, or the last prompt of the file → the wrong turn: no drift, or a cross-check refusal |
| **W7 NO PROMPT BEFORE TS** | session D: a mismatch row stamped before D's first prompt | `unpairable 1 (no prompt 1 …)`, nothing written for D | **M7** the `< ts` bound dropped (the first prompt of the file taken) → a row is written for D |
| **W8 CROSS-CHECK** | session E: the row's stamp reaches a turn with no marker, but the row recorded `samajh_check.seen 1` | `unpairable 1 (… cross-check 1 …)` | **M8** the cross-check removed → a row is written for E |
| **W9 OWN RECORD** | session F: its file at a custom path, named only by F's stub in `prompts_by_session` (`transcript_path`) | F rebuilds | **M9** the record ignored, `transcriptPathFor` only → F reads lost |
| **W10 READERS BLIND** | W1's tree after `--apply` | `windowDrift` (imported from `<org>/scripts/teaching_contract.mjs`) gives the same counts before and after; the rebuilt row has no `ts` / `scope` / `drifts` key | **M10** the rebuilt row carries `ts` + `drifts` → windowDrift counts change |
| **W11 NO AUTOHIT** | the source of the verb | `staged: []` on every rebuilt row; no function reachable from `rebuildMain` names `contractCall` / `autoHit` / `stampChecked` / `writeLastReal` | **M11** the verb stages its drift through `io.autoHit` → `staged` non-empty |
| **W12 ANOTHER SESSION NEARER IN TIME** (new, row 1282 (1)) | session G: its own prompt at T, its mismatch row at T+10 min. Session H (another file in the same planted projects folder): a prompt at T+9 min carrying the marker, so it is NEARER in time to G's row | G's rebuilt row reaches G's own turn: no drift, cross-check agrees; H's file is never read for G (counts line `turns 1` for G) | **M12** the locator scans every `*.jsonl` of the projects folder for the nearest prompt before `ts` → H's prompt is picked: the drift appears / the cross-check refuses |
| **W13 SHARED TURN** (new, row 1282 (1)) | session K: ONE human prompt carrying the marker; two mismatch rows after it (the second Stop re-entered by a `<task-notification>` line) | ONE rebuilt row; `supersedes` names both rowIds in log order; `turns 1 (shared 1, rows 2)`; a second `--apply` writes 0 | **M13** one rebuilt row per old row → two rebuilt rows for one turn |

| **W14 STOP-TIME new_idea** (new, row 1283 (2)) | session N: ONE human prompt at T; an assistant text opening a term by its asli naam (`asliNaamAct` true, e.g. "Iska asli naam hai **tokenizer**.") at T+20s; N's mismatch row at T+30s recorded `new_idea: true`; then a `<task-notification>` line and a plain assistant text at T+60s (same turn slice). The two readings DIFFER: `pictureFacts(slice, "")` gives false, the Stop-time view with its message gives true (measured on the planted tree, §NAMED) | N pairs and rebuilds (`new_idea` agrees) | **M14** the cross-check reads `pictureFacts(turn.blocks, "")` over the whole slice → `unpairable (cross-check 1)`, no row for N |

The witness's last line is `GREEN MAUD43 … · 14 clause(s)` or `RED MAUD43 · W…`. The mutant runner's last line is
`run_mutants: 14 of 14 mutant(s) RED by the clause that names them · control GREEN`.

## 7 · THE RUN on his laptop: a runner step only, never from the cloud (row 1282 (4))

1. **Preconditions.** mbank is on main (row 1270 (3)). This spec is ruled (row 1282). The build is landed by its own row,
   with W1-W14 and M1-M14 read on the neutral machine.
2. **The runner hand, his laptop, the owner CLI, ONCE.** First the dry run:
   `node scripts/teaching_audit.mjs rebuild-mismatch --from 2026-11-17T00:00:00+05:30 --to 2026-11-22T00:00:00+05:30`.
   Its line is quoted into the landing row beside C3 (`candidates 47 · paired 47 · turns 41`). Any difference from C3
comes from the Stop-time `new_idea` reading (row 1283 (2)), and it is named there, never hidden. Then the same command
   with `--apply`, once. Its `written <w>` is the "counted in its landing row" of row 1250 (4).
3. It runs nowhere else. No cloud seat runs it, and no witness touches his tree.

## FORKS: all ruled by forks row 1282 (22 Nov 2026), struck in place

- ~~**maud43-1 · the turn inside a transcript.** (a) ORDER … (b) the row's own `ts` as an ORDER bound within its own
  session's file … (c) per SESSION … (d) forward-only `turn_id` … **Recommend (a).**~~ **RULED (b), narrowed:** inside the
  ONE file its session id names, the last human prompt written before the row's own stamp. Time orders lines of one file;
  it never picks a session and never crosses a file. The two recorded booleans must agree, or the row is unpairable. A
  turn reached by more than one row is rebuilt once, naming every row it supersedes. The time clause inverts (W6), and W12
  is added. C3 answered: `of 47: PAIR 47 · CROSS-CHECK FAIL 0`.
- ~~**maud43-2 · the supersede key.** (a) sha256 of the old line's bytes; (b) `{session_id, ts}`; (c) the line ordinal.~~
  **RULED (a)**, now a list (shared turns).
- ~~**maud43-3 · where the rebuilt rows live.** (a) same log, keys off `ts`/`scope`/`drifts`; (b) teach the three readers;
  (c) a new file needing a `.gitignore` line.~~ **RULED (a).**
- ~~**maud43-4 · does a rebuilt drift auto-count?** (a) never; (b) through `autohit`.~~ **RULED (a): never.**
- ~~**maud43-5 · prevStep.** (a) the same session's previous row; (b) null.~~ **RULED (a)** (for a shared turn: the row
  just before the first superseded row).
- ~~**maud43-6 · the check code.** (a) `auditTurn` unchanged, one rule kept; (b) factor `:942-950`; (c) `samajhOf` only.~~
  **RULED (a).**
- ~~**maud43-7 · the window.** (a) required, no default; (b) the whole log.~~ **RULED (a)**, with the IST bounds.
- ~~**maud43-8 · unpairable.** (a) not latched; (b) lost once.~~ **RULED (a).**
- ~~**maud43-9 · the window ends.** (a) null with the named why; (b) omitted.~~ **RULED (a).**
- ~~**maud43-10 · the model tail.** (a) accept; (b) keep them out in brain.mjs.~~ **RULED (a).**

No fork is open. The two choices below were **RULED YES by row 1286 (1) / (2) (22 Nov 2026)**, and each is named in a
field of the rebuilt row (§3):
- for a shared turn, `step`, `concept` and `assistantText` come from the LAST superseded row, because that row's Stop closed
  the turn;
- "as the audit did at Stop time" (row 1283 (2)) is read as the Stop-time VIEW: the turn's lines stamped at or before the
  row's `ts`, with the view's last text as `last_assistant_message`. The rows do not store that message, so this is the
  one way to rebuild it from the file. It orders by time inside the one file only, as row 1282 (1) allows.

## RE-ANCHOR: f635d68 → d585648 → the build (22 Nov 2026)

`git diff --stat f635d68 d585648 -- scripts/teaching_audit.mjs scripts/study_scope.mjs scripts/teaching_contract.mjs
scripts/watchman.mjs scripts/brain.mjs .gitignore` prints nothing. So every anchor above holds at d585648 unchanged, and
**no anchor moved between the cut and the base.** The build's own edits to `scripts/teaching_audit.mjs` shift its later
lines, named here:

| Anchor | f635d68 = d585648 | the build |
|---|---|---|
| header `WRITES:` paragraph (the verb's line is inserted above it) | `:82` | `:86` |
| `STATE_DIR` · `LOG` | `:162` · `:163` | `:166` · `:167` |
| `auditTurn` · the confusion check | `:856` · `:942-950` | `:860` · `:946-954` |
| `pictureOrder` · `pictureFacts` · `promptOfLine` · `turnOf` · `samajhOf` · `turnPicture` | `:1378` · `:1394` · `:1413` · `:1420` · `:1523` · `:1468` | `:1382` · `:1398` · `:1417` · `:1424` · `:1527` · `:1472` |
| `contractCall` · `appendLogReal` | `:1583` · `:1606` | `:1587` · `:1610` |
| `mapOf` · `stubOf` · `transcriptAlive` | `:1644` · `:1645` · `:1647` | `:1648` · `:1649` · `:1654`, now via the new `transcriptOf` `:1653` (the one expression, behaviour-neutral) |
| Stop row `turn_id` · the Stop's turn read | `:1864` · `:1772` | `:1871` · `:1779` |
| `replayMain` | `:2900` | `:2907` |
| THE REBUILD SECTION (new) | — | `:2916` header · `rebuildPlan` `:2963` · `rebuildMain` `:3048` |
| dispatcher `rebuild-mismatch` (new) · usage line | `:2931` (replay) · `:2932` | `:3093` · `:3094` |

The cited readers in other files (`teaching_contract.mjs:292-295`, `watchman.mjs:284-287`, `study_scope.mjs:100` /
`:746-756`, `brain.mjs:2740`, `.gitignore:324`) are untouched by the build.

## NAMED, NOT GUESSED (owed by the runner, on his laptop, read-only)

ONE command, updated to the row 1282 (1) join, run from the repository root on his laptop. It reads `teaching_audit.jsonl`
and the transcripts, and writes nothing. It prints counts only: no text, no session id, no path. It imports the organ's
own `transcriptPathFor`, `promptOfLine`, `turnOf`, `samajhOf` and `pictureFacts`, so its join is the spec's. It reads
`new_idea` the Stop-time way (row 1283 (2)): over the view stamped at or before the row, with that view's last text as the
message. The runner's 22 Nov count used `pictureFacts(turn.blocks, "")`, so a re-run of this command is the C3 re-measure
under the ruled reading. It does NOT
read the per-session record: the record names no 17-21 Nov session before mbank lands. Its output format is the runner's
own line, row 1282 (2).

```
node --input-type=module -e 'import{readFileSync as R,existsSync as E}from"node:fs";import{join as J}from"node:path";import{transcriptPathFor as T}from"./scripts/study_scope.mjs";import{promptOfLine as P,turnOf as O,samajhOf as Q,pictureFacts as F}from"./scripts/teaching_audit.mjs";const D=process.env.AUD||J("dressing-room","state");const rows=R(J(D,"teaching_audit.jsonl"),"utf8").split("\n").map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(r=>r&&typeof r.ts==="string");const lo=Date.parse(process.env.FROM||"2026-11-17T00:00:00+05:30"),hi=Date.parse(process.env.TO||"2026-11-22T00:00:00+05:30");const M=rows.filter(r=>{const t=Date.parse(r.ts);return t>=lo&&t<hi&&/^session-mismatch/.test(String(r.user_text_source||""))});const cache=new Map();const linesOf=s=>{if(!cache.has(s)){const p=T(s);cache.set(s,p&&E(p)?R(p,"utf8").split("\n"):null)}return cache.get(s)};let pair=0,fail=0,nofile=0,noprompt=0,sc=0,nc=0,sf=0,nf=0;const turns=new Map(),combo={};for(const r of M){const L=linesOf(r.session_id);if(!L){nofile++;continue}const rt=Date.parse(r.ts);let at=-1;for(let i=0;i<L.length;i++){if(P(L[i])===null)continue;let ts=NaN;try{ts=Date.parse(JSON.parse(L[i]).timestamp)}catch{}if(Number.isFinite(ts)&&ts<rt)at=i}if(at<0){noprompt++;continue}let end=L.length;for(let i=at+1;i<L.length;i++)if(P(L[i])!==null){end=i;break}const tsOf=l=>{try{return Date.parse(JSON.parse(l).timestamp)}catch{return NaN}};const t=O(L.slice(at,end).join("\n"));const v=O(L.slice(at,end).filter(l=>{const x=tsOf(l);return !Number.isFinite(x)||x<=rt}).join("\n"));const fin=v.blocks?[...v.blocks].reverse().find(b=>b.kind==="text"):null;const s=t.blocks?Q(t).seen:null,n=v.blocks?F(v.blocks,fin?fin.text:"").new_idea:null;const os=r.samajh_check?r.samajh_check.seen:null,on=r.new_idea;let bad=false;if(os!==null&&os!==undefined){sc++;if(os!==s){sf++;bad=true}}if(on!==null&&on!==undefined){nc++;if(on!==n){nf++;bad=true}}if(bad){fail++;continue}pair++;const k=r.session_id+"#"+at;turns.set(k,(turns.get(k)||0)+1);const c=`seen=${os}/new_idea=${on}`;combo[c]=(combo[c]||0)+1}const sh=[...turns.values()].filter(n=>n>1);console.log(`of ${M.length}: PAIR ${pair} · CROSS-CHECK FAIL ${fail} (seen ${sf} of ${sc} checked · new_idea ${nf} of ${nc} checked) · SHARED TURNS ${sh.length} (rows ${sh.reduce((a,b)=>a+b,0)}) · no prompt before ts ${noprompt} · no file ${nofile} · distinct turns reached ${turns.size} · ${Object.entries(combo).map(([k,v])=>k+" "+v).join(" · ")}`)'
```

The command was proven HERE only on a planted tree under `os.tmpdir()` (`AUD=<tmp>/state HOME=<tmp>/home`, 22 Nov 2026):
five mismatch rows: one with no file, one `seen` cross-check refusal, one turn shared by two rows, and session N (W14's
shape), where the two `new_idea` readings differ. That is a check of the command, not a count of his. With this command
(the Stop-time reading):

```
of 5: PAIR 3 · CROSS-CHECK FAIL 1 (seen 1 of 4 checked · new_idea 0 of 4 checked) · SHARED TURNS 1 (rows 2) · no prompt before ts 0 · no file 1 · distinct turns reached 2 · seen=1/new_idea=false 2 · seen=0/new_idea=true 1
```

With the empty-message reading on the same plant (the runner's 22 Nov form), N is refused:

```
of 5: PAIR 2 · CROSS-CHECK FAIL 2 (seen 1 of 4 checked · new_idea 1 of 4 checked) · SHARED TURNS 1 (rows 2) · no prompt before ts 0 · no file 1 · distinct turns reached 1 · seen=1/new_idea=false 2
```

| Id | Fact | Status (22 Nov 2026) |
|---|---|---|
| C1 | session-mismatch rows in the IST window | **47** (runner, row 1282 (2)) |
| C2 | files present / lost | **no file 0** (runner) |
| C3 | rows the ruled join reaches | **PAIR 47 · CROSS-CHECK FAIL 0** (runner, `new_idea` under the EMPTY-message reading). OWED: the re-run under the Stop-time reading, row 1283 (2) (the command above) |
| C3b | shared turns | **6 turns / 12 rows; 41 distinct turns** (runner) |
| C4 | the booleans are not vacuous | **38 / 4 / 5** (runner, three combinations) |
| C5 | rows with a prevStep (an own earlier row) | OWED: not in the runner's line; the dry run's planning names it once built |
| C6 | duplicate session+ts keys | moot: maud43-2 (a) keys on the line's bytes |
| C7 | sessions the per-session record names at run time | OWED at run time; 0 before mbank lands |
| C8 | NEW drifts a rebuild finds | OWED: the dry run's `drifts found` once built |
| C9 | the rows they would supersede | the 47 paired rows, in 41 rebuilt rows (runner's counts) |

## FILES a build would touch (all within this bound)

- `scripts/teaching_audit.mjs`: the pure `rowIdOf` / `rebuildPlan` / `rebuiltRow`, `rebuildMain`, one dispatcher line
  (`:2916-2932`), the usage line (`:2932`), and one header paragraph naming the verb.
- `ci/maud43/witness_maud43.mjs`, `ci/maud43/run_mutants_maud43.mjs`, `ci/maud43/PROOF.md`, `ci/maud43/LEDGER.jsonl`.

Nothing beyond the bound is needed now that maud43-3 (a), 4 (a) and 10 (a) are ruled. Wiring the witness into
`scripts/organism_test.mjs` stays the architect's call.

## MEASUREMENTS

At the cut (21 Nov 2026, this cloud container):

```
$ node scripts/teaching_audit.mjs rebuild-mismatch
teaching_audit: hook | report | probe [--clean|--text "..."] | seed-terms [--concept <c>] | replay <transcript.jsonl> | selftest
$ node scripts/teaching_audit.mjs selftest
ALL CHECKS PASSED (153 passed, 0 failed)
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
organism_test: 150 passed, 8 failed · ruled 0 · UNRULED 8 · LIVE 125 (hermetic: named, not run)
```

On 21 Nov 2026 the hermetic reds in this container were environmental (there was no `node_modules`); the neutral machine's
legs were green.

**The gates on the merged tip** (22 Nov 2026, after `npm ci --ignore-scripts`):

```
$ node scripts/gates.mjs report
gates types  · 21 organ(s) @ts-check'd (baseline 14, may only grow) · undefined-symbol family 0 (must be 0) · other checkJs diagnostics 297 (baseline 296, may only fall)
gates lint   · 344 error(s) · 2 warning(s) · no-empty 262 · no-unused-vars 82 · (directive) 2 (frozen: no-empty 262 · no-unused-vars 82 · warnings 2)
gates: 1 RED — a gate may only get stricter (§10-D rule 6)
```

The one diagnostic over baseline is not this unit's. Diffing `tsc --noEmit` output, main a0645d2 alone gives 296 and this
tip gives 297. The extra one is `scripts/organism_test.mjs(2549,226): error TS2339: Property 'ARSENAL_ORGAN' does not exist
on type '{ CLAUDE_CODE_SESSION_ID: string; …'`, a byte of mbank commit `9074365` (mbank-10 a), which this branch is stacked
on as briefed. This unit adds only `ci/maud43/*.md` / `.jsonl`, and zero diagnostics. Every tip carrying mbank f635d68 on
the new main carries this red until the mbank seat fixes its line. No baseline was raised and nothing was ignored.

## CHECK RUNS of earlier pushes

Read through the public API, no token: `curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`.

| sha | run id | name | conclusion |
|---|---|---|---|
| `7d6148b` (the first spec push) | 136869420247 / 136869420411 | npm test · node 22 / 24 | success / success |
| `7d6148b` | 136869420414 / 136869420678 | hermetic twice · node 22 / 24 | success / success |
| `d7e3677` (the check-run push) | 136883698379 / 136883698532 | npm test · node 22 / 24 | success / in progress at the last read |
| `d7e3677` | 136883698542 / 136883698564 | hermetic twice · node 22 / 24 | success / success |

STATUS · spec REVISED to forks row 1282 at 2026-11-22 (UTC) · nothing built · all ten forks ruled · the build waits on
mbank landing on main and the runner's word

~~CHECKPOINT · revision pushed at 2026-11-22 (UTC) · resume from: the runner's word that mbank is on main, then BUILD
§1-§6 exactly (W1-W14 / M1-M14), base leg = that main~~ BUILT, see `ci/maud43/PROOF.md`.
