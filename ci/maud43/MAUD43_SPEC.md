# MAUD43 SPEC — the one-time rebuild of the session-mismatch audit turns of 17-21 Nov 2026

> Unit **maud43** (forks row 1250 (4); the architect's ruling of 21 Nov 2026 about 19:25 IST). A **SPEC**: nothing is built
> here, no state of his is read, no model is called. Branch `claude/maud43-spec`, cut from the mbank BUILD tip
> **f635d68b1bce300b58aa031ed49278b8bbe3e5a8** (row 1269 (1), mbank provisionally adopted, NOT on main). At the cut,
> `origin/claude/mbank-build` had not moved past it (it read `f635d68b…`). Main was `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f`,
> without mbank. Every `file:line` below is read at f635d68. Ledger: `ci/maud43/LEDGER.jsonl`.

## 0 · THE HEADLINE (21 Nov 2026)

**The spec's central finding is a fork, not a plan.** The per-session record mbank adds
(`prompts_by_session` in `teaching_audit_last.json`) keeps ONE entry per Claude session: its open prompt, or a STUB of its
last Stop (`scripts/teaching_audit.mjs:1645` stubOf). It keeps **no history of turns**. Also, the 17-21 Nov sessions ran on
his laptop on main, where the map did not exist yet. So the record can name **a session's transcript**
(`transcript_path` on its entry, else `scripts/study_scope.mjs:100` transcriptPathFor). That is the "by session id" half of
the ruling. It **cannot name the turn inside that transcript**.

The rows give no turn locator either. A mismatch row has `turn_id: null` (`:1864`, set only when the prompt paired). It
also has no transcript line id. The only per-turn key it carries is its own instant `ts`, and the ruling forbids a join by
time.

The spec therefore proposes a join that uses **session id plus ORDER, never time and never text** (FORK maud43-1 (a)). For
one session, its k-th audit row maps to the k-th human turn of its transcript, read by the organ's own `turnsOf`
(`:1443`). This holds **only when the counts are equal**, and each pair is cross-checked against facts the old row already
recorded from that same transcript. Any other session is **unpairable**: it is counted and nothing is written for it. How
many of the 43 this reaches is a **NAMED LAPTOP COUNT (C3)**. A cloud seat does not guess it.

What a rebuild can restore is narrow. Exactly ONE check of the audit reads his words: **confusion-is-literal**
(`:942-950`). Its other prompt-time inputs (the moment and rep window ends) are state snapshots that no transcript holds.
The L5 samajh half (`samajh_check`) and the L4 picture half were already read from the transcript at Stop time
(`:1770-1775`, source `"transcript_path"`), even on mismatch rows.

## 1 · THE OWNER and its one verb

| What | file:line at f635d68 |
|---|---|
| The sole writer of `teaching_audit.jsonl` + `teaching_audit_last.json` | `scripts/teaching_audit.mjs:82-89` (header: "this organ is their single writer") |
| The log path, and the state-dir seam the witness uses | `:163` `LOG`, `:162` `STATE_DIR = process.env.ARSENAL_AUDIT_STATE_DIR \|\| …dressing-room/state` |
| `.gitignore` keeps the log out of the public repo | `.gitignore:324` |
| The append writer (one line per row) | `:1606` `appendLogReal` |
| The CLI dispatcher (the verb is added here) | `:2916-2932`; the usage line `:2932` |
| The nearest existing verb, pure over a handed transcript | `:2900` `replayMain` |

**The verb (proposed):** `node scripts/teaching_audit.mjs rebuild-mismatch --from <ISO> --to <ISO> [--apply]`.
- With no `--apply` it is the **dry run** (§5). Nothing is written.
- `--from` / `--to` are required and have no default (FORK maud43-7). The verb refuses with exit 2 when either is missing
  or does not parse.
- The verb writes only through `appendLogReal`. It never calls `contractCall` / `autoHit` / `stampChecked` (`:1583-1593`)
  and never writes `teaching_audit_last.json` (FORK maud43-4).

## 2 · THE SOURCE: from a lost turn to its transcript, by session id

```
mismatch row r  (user_text_source matches /^session-mismatch/, r.ts inside --from/--to, r carries no `rebuilt_from`)
  └─ r.session_id ─► the transcript path, the SAME expression transcriptAlive already uses (:1647):
        v = mapOf(last.prompts_by_session)[sid]          // mbank's per-session record: stub or open entry
        path = v.transcript_path || transcriptPathFor(sid) // study_scope.mjs:100 (~/.claude/projects/<slug>/<sid>.jsonl)
  └─ the whole file, read once  ─►  turns = turnsOf(raw)   // :1443, his human prompts via promptOfLine :1413, each with its blocks
  └─ rowsS = every audit row of sid, in log order, rebuilt rows excluded
  └─ PAIR iff rowsS.length === turns.length   (FORK maud43-1 (a))
        and for EVERY k:  rowsS[k].samajh_check.seen   === samajhOf(turns[k]).seen     when the old value is not null
                          rowsS[k].new_idea            === turn-k's pictureFacts(...).new_idea  when the old value is not null
     then r = rowsS[k]  ↔  turns[k]
```

- **Never by text.** No string of his is compared with anything. The cross-check compares two booleans the organ already
  derived from that same transcript, and it can only refuse a pair, never pick one.
- **Never by time.** No `timestamp` field of a transcript line is read, and `r.ts` is used only to select rows into the
  window (FORK maud43-7), never to locate a turn. Witness clause W6 proves this by planting transcripts whose line
  timestamps are absurd.
- **The per-session record is read, not written**, through the same `mapOf` / `transcriptAlive` lines (`:1644-1647`). On
  his laptop, a 17-21 Nov session has an own entry only if it prompted again after mbank landed. NAMED LAPTOP COUNT C7.

## 3 · WHAT IS WRITTEN: one appended row per rebuilt turn (his law 9)

One JSON line is appended to `teaching_audit.jsonl` per rebuilt turn, through `appendLogReal`. The old row is never
rewritten, moved or deleted, and W2 checks that the log's prefix stays byte-identical. Shape (FORK maud43-3 (a): the keys
stay OFF the fields the readers count):

```
{ "rebuilt_at": "<ISO now>", "rebuilt_from": "transcript", "supersedes": "<rowId of the old line>",
  "of_ts": "<old row ts>", "session_id": "<sid>", "concept": "<old concept>", "step": <old measured.step>,
  "user_text_source": "rebuilt-from-transcript",
  "prev_step": <the same session's previous row measured.step | null>, "prev_step_source": "own-session previous row" | null,
  "drifts_rebuilt": ["confusion-is-literal"] | [], "evidence_rebuilt": [...], "excerpts_rebuilt": [...],
  "window": { "moments": null, "reps": null, "moments_by_kind": null,
              "why": "a prompt-time state snapshot is in no transcript" },
  "staged": [] }
```

- `rowId` (FORK maud43-2 (a)): sha256 of the old line's exact bytes, without its newline.
- **Why no `ts`, no `scope`, no `drifts`.** Each of the three readers of this log keys on exactly those fields:
  `scripts/teaching_contract.mjs:292-295` windowDrift (the 14-day ranking reads `r.ts`, `studyRowOf`, `r.drifts`),
  `scripts/watchman.mjs:284-287` (rows today by `ts`), and `scripts/study_scope.mjs:746-756` studySessionsOfDay (a study
  session of a day by `scope === "study"` and `ts`). A rebuilt row carrying them would (i) double-count drifts in his
  ranking, (ii) inflate the watchman's rows-today on the rebuild day, and (iii) make the rebuild day look like a study day
  to `postmatch autoclose`. With these keys, none of the three readers sees a rebuilt row, and **no reader file is
  touched**.
- **The check code is the organ's own** (FORK maud43-6 (a)). `auditTurn` (`:856`) is called unchanged with
  `assistantText` = the turn's last text block, `userText` = `turns[k].prompt`, `session = { concept, step }` rebuilt from
  the old row, `prevStep` (FORK maud43-5), and every window input null. Only the `confusion-is-literal` drift is kept from
  its result. The other drifts were already judged on the old row against the real `last_assistant_message`.
- `excerpts_rebuilt` carries `quote(userText)` (`:948`), exactly as a live row does. The file is gitignored (`.gitignore:324`).

## 4 · WHAT IS REFUSED

| Case | Verdict | Written | Latched |
|---|---|---|---|
| transcript path null or `existsSync` false | **lost** | ONE row `{rebuilt_at, rebuilt_from:"transcript", supersedes, of_ts, session_id, lost:true, why:"transcript gone"}` | yes: never retried, even if the file reappears |
| a row whose `rowId` is already the `supersedes` of a rebuilt or lost row | **already** | nothing | it is the latch |
| a session where the counts differ, or any cross-check disagrees | **unpairable** | nothing | no (FORK maud43-8 (a)): a later ruling can reach it |
| a transcript that exists but cannot be read (EISDIR, EACCES) | **unpairable** (reason `unreadable`) | nothing | no |
| a rebuilt row itself (`rebuilt_from` present) | never a candidate | — | — |

**The once-latch, by code.** The verb reads the whole log once. It builds `done = Set(rows.filter(r => r.rebuilt_from ===
"transcript").map(r => r.supersedes))` and drops every candidate in `done` before planning. A second `--apply` therefore
appends zero lines (W4), and a lost turn is named once (W3).

## 5 · THE DRY RUN: counts only

Without `--apply`, the verb reads the log, the per-session record and the transcripts, plans, prints ONE line, and writes
nothing:

```
rebuild-mismatch · window <from>..<to> · candidates <n> · rebuild <r> · lost <l> · unpairable <u> · already <d> · drifts found <f> · DRY RUN: nothing written
```

With `--apply`, the same line ends `· written <w>`. No prompt text, excerpt, concept name or path is ever printed, in
either mode (W5 plants a canary string in his prompt). Session ids are not printed either.

## 6 · THE WITNESS: planted transcripts, no live state, no model call, no port

File (a build's): `ci/maud43/witness_maud43.mjs --org <tree> [--base-org <tree>]`, plus `ci/maud43/run_mutants_maud43.mjs`
(the mbank pattern: `ci/mbank/witness_mbank.mjs`, `ci/mbank/run_mutants_mbank.mjs`).
- **Plants.** Everything goes under `mkdtempSync(join(os.tmpdir(), "maud43-"))`, written by node. It plants a `state/`
  holding `teaching_audit.jsonl` and `teaching_audit_last.json`, and a `home/.claude/projects/<projectSlug(org)>/` holding
  `<sid>.jsonl` transcripts.
- **The child.** `node <org>/scripts/teaching_audit.mjs rebuild-mismatch …` is spawned with env
  `ARSENAL_AUDIT_STATE_DIR=<tmp>/state`, `HOME` = `USERPROFILE` = `<tmp>/home`, `ARSENAL_AUDIT_NO_SPAWN=1` (`:1584`: belt
  and braces, so no path can reach his teaching_contract.json), and no `ANTHROPIC_API_KEY`.
- **What it never does.** It binds no port, names no service, POSTs nothing, restarts nothing, and calls no model. There is
  no polling wait. Each spawn is a pure CLI that exits by itself, so nothing waits that could need a bound.
- **Base vs build.** On base (f635d68) the verb is unknown: the dispatcher prints the usage line and writes nothing, so
  **every clause is RED on base** (each demands the counts line or a rebuilt row as positive evidence). Every clause is
  GREEN on the build.

| Clause | Plant | GREEN on the build | Its mutant (RED by that clause) |
|---|---|---|---|
| **W1 REBUILD** | session A: a fresh row at step 3, then a mismatch row at step 4. A's transcript: turn 1 plain, turn 2 his prompt "samajh nahi aaya …" | one appended row, `supersedes` = rowId(old), `user_text_source "rebuilt-from-transcript"`, `drifts_rebuilt` ⊇ confusion-is-literal, `prev_step 3` | **M1** userText taken from the shared `prompt` slot (another session's text planted there) → no drift |
| **W2 KEPT** | W1's tree | the log's first N bytes are byte-identical after `--apply` | **M2** the old row is rewritten in place with a `superseded_by` key |
| **W3 LOST** | session B: a mismatch row, no transcript | ONE lost row; a second `--apply` appends nothing for B even after B's transcript is planted | **M3** a lost row does not enter `done` → a second lost row (or a rebuild) |
| **W4 ONCE** | W1's tree, `--apply` twice | the second run reads `written 0 · already 1` | **M4** the latch set is empty → a duplicate rebuilt row |
| **W5 DRY** | W1's tree, his prompt carries canary `ZQX-MAUD43-CANARY` | the counts line is printed; the log is byte-identical; stdout+stderr hold no canary, no concept, no session id | **M5** the dry run appends (or prints the excerpt) |
| **W6 NO TIME** | session C: two turns, every transcript `timestamp` set to `1970-01-01T00:00:00Z` and the order of the two rows' `ts` reversed relative to the file | rebuilds exactly as W1 (the confusion turn is row 2) | **M6** the locator picks the last prompt whose timestamp ≤ `r.ts` → the wrong or no turn |
| **W7 UNPAIRABLE** | session D: three rows, a transcript with two human turns (and a `<task-notification>` line, refused by `promptOfLine`) | `unpairable 1`, nothing written for D | **M7** the count-equality guard removed → a row is written for D |
| **W8 CROSS-CHECK** | session E: equal counts, but row 1 recorded `samajh_check.seen 1` while turn 1 has no marker (a shifted pairing) | `unpairable 1` | **M8** the cross-check removed → a row is written for E |
| **W9 OWN RECORD** | session F: transcript planted at a custom path, named only by F's stub in `prompts_by_session` (`transcript_path`) | F rebuilds | **M9** the locator ignores the record and uses `transcriptPathFor` only → F reads lost |
| **W10 READERS BLIND** | W1's tree after `--apply` | `windowDrift` (imported from `<org>/scripts/teaching_contract.mjs`) over the planted rows gives the same counts before and after; the rebuilt row has no `ts` / `scope` / `drifts` key | **M10** the rebuilt row carries `ts` + `drifts` → windowDrift counts change |
| **W11 NO AUTOHIT** | the source of the verb | `staged: []` on every rebuilt row; the function body reachable from `rebuildMain` names none of `contractCall` / `autoHit` / `stampChecked` / `writeLastReal` | **M11** the verb stages its drift through `io.autoHit` → `staged` non-empty |

The witness's last line is `GREEN MAUD43 … · 11 clause(s)` or `RED MAUD43 · W…`. The mutant runner's last line is
`run_mutants: 11 of 11 mutant(s) RED by the clause that names them · control GREEN`.

## 7 · THE RUN on his laptop: a runner step only, never from the cloud

1. **Preconditions.** mbank is on main. This spec is ruled. The build of the ruled forks is landed by its own row, with W1-W11
   and M1-M11 read on the neutral machine.
2. **The runner hand, his laptop, the owner CLI.** First run the dry run:
   `node scripts/teaching_audit.mjs rebuild-mismatch --from 2026-11-17T00:00:00+05:30 --to 2026-11-22T00:00:00+05:30`
   (the window is FORK maud43-7). Its line is quoted into the landing row. Then run the same command with `--apply`, ONCE.
   Its line, `written <w>`, is the "counted in its landing row" of row 1250 (4).
3. The run happens nowhere else. No cloud seat runs it, and no witness touches his tree.

## FORKS (each the architect's)

- **maud43-1 · the turn inside a transcript.** (a) ORDER: the k-th row of the session ↔ the k-th human turn (`turnsOf`),
  only when the counts are equal and the recorded `samajh_check.seen` / `new_idea` agree; else unpairable.
  (b) the row's own `ts` as an ORDER bound within its own session's file: the last human prompt written before `r.ts`
  (PROOF §10's proposal in `ci/mbank/PROOF.md`). This needs "never by time" relaxed to "time as order inside one file", and
  W6 inverts. (c) per SESSION, not per turn: one row per session naming every row it supersedes. (d) forward-only
  `turn_id`: reaches none of the 43, since none carries one. **Recommend (a).** Decided by laptop count **C3**
  (ordinal-pairable rows of the 43); if C3 is far below C2, (b) is the only route to the rest.
- **maud43-2 · the supersede key.** (a) sha256 of the old line's bytes. (b) `{session_id, ts}`. (c) the line ordinal in the
  log. **Recommend (a)**: unique, immutable, and reading no order. Decided by **C6** (duplicate session+ts keys; if 0, (b)
  is equally sound and more readable).
- **maud43-3 · where the rebuilt rows live.** (a) the same log, keys kept off `ts` / `scope` / `drifts`: no reader
  touched. (b) the same log with normal keys, and the three readers (`teaching_contract.mjs`, `watchman.mjs`,
  `study_scope.mjs`) taught to skip or supersede: three files beyond the bound. (c) a new file
  `teaching_audit_rebuilt.jsonl`, same sole writer: it needs a `.gitignore` line, or his words become TRACKED in a public
  repo. Measured here: `git check-ignore -v dressing-room/state/teaching_audit_rebuilt.jsonl` exits 1 (not ignored), and
  `.gitignore` is beyond the bound. **Recommend (a).**
- **maud43-4 · does a rebuilt drift auto-count?** (a) never: it is counted in the row and the landing row only. (b) through
  `autohit`, like a live drift, which moves his 14-day ranking off turns from four days back. **Recommend (a)**: a
  rebuilt drift is a finding about the instrument's gap, and his ruling "a measured drift AUTO-COUNTS" (header `:47-52`)
  was made for the live lane. Decided by the dry run's `drifts found` once built: if 0, the fork is moot.
- **maud43-5 · prevStep.** (a) the same session's previous audit row's `measured.step` (session id + log order). (b) null,
  so the confusion check can never fire and the rebuild restores only `user_text_source`. **Recommend (a).** Decided by
  **C1**'s "with an own earlier row".
- **maud43-6 · the check code.** (a) call `auditTurn` unchanged and keep the one rule. (b) factor `:942-950` into an
  exported pure function (an edit to `auditTurn`, behaviour-neutral, and its selftest must show it). (c) recompute only
  `samajhOf`, which is already on the row, so it adds nothing. **Recommend (a).**
- **maud43-7 · the window.** (a) `--from` / `--to` required, no default; the runner passes IST
  `2026-11-17T00:00:00+05:30` .. `2026-11-22T00:00:00+05:30`. (b) every session-mismatch row in the whole log, which also
  reaches the October rows (the 11 Oct 2026 census in the header, `:124`, measured 412 of 1,519). **Recommend (a)**, with
  the boundary question named. "17-21 Nov" in `ci/mbank/PROOF.md` §10 does not say IST or UTC, so **C1** is run both
  ways.
- **maud43-8 · unpairable.** (a) not latched, counted only. (b) named lost once, like a gone transcript.
  **Recommend (a)**: it keeps maud43-1 (b) open for those turns.
- **maud43-9 · the window ends of a rebuilt row** (moments / reps / by kind). (a) null, with the named why. (b) the keys
  omitted. **Recommend (a)**: the organ's own null-path law (`:133-135`, "I could not see" is not "none").
- **maud43-10 · the model tail.** `scripts/brain.mjs:2740` tails the newest rows of this log to a gated model lane. Rebuilt
  rows would ride that tail. (a) accept: they carry no more of his words than a live row. (b) a build line that keeps them
  out, in brain.mjs, a file beyond the bound. **Recommend (a).**

## NAMED, NOT GUESSED (owed by the runner, on his laptop, read-only)

ONE command, run from the repository root on his laptop. It reads `teaching_audit.jsonl`, `teaching_audit_last.json` and
the transcripts, and writes nothing. It prints counts only: no text, no session id, no path. Its window is the IST one. Run
it again with `FROM=2026-11-17T00:00:00Z TO=2026-11-22T00:00:00Z` for UTC (FORK maud43-7). It imports the organ's own
`transcriptPathFor` and `turnsOf`, so its pairing is the spec's (a), minus the cross-check.

```
node --input-type=module -e 'import{readFileSync as R,existsSync as E}from"node:fs";import{join as J}from"node:path";import{transcriptPathFor as T}from"./scripts/study_scope.mjs";import{turnsOf as U}from"./scripts/teaching_audit.mjs";const D=process.env.AUD||J("dressing-room","state");const rows=R(J(D,"teaching_audit.jsonl"),"utf8").split("\n").map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(r=>r&&typeof r.ts==="string");let last=null;try{last=JSON.parse(R(J(D,"teaching_audit_last.json"),"utf8"))}catch{}const own=last&&last.prompts_by_session&&typeof last.prompts_by_session==="object"?last.prompts_by_session:{};const lo=Date.parse(process.env.FROM||"2026-11-17T00:00:00+05:30"),hi=Date.parse(process.env.TO||"2026-11-22T00:00:00+05:30");const inW=r=>{const t=Date.parse(r.ts);return t>=lo&&t<hi};const W=rows.filter(inW),M=W.filter(r=>/^session-mismatch/.test(String(r.user_text_source||"")));const S=[...new Set(M.map(r=>r.session_id))];let alive=0,aliveRows=0,pair=0,pairRows=0,ownN=0;for(const s of S){if(own[s])ownN++;const v=own[s]||{};const p=(v&&typeof v.transcript_path==="string"&&v.transcript_path)||T(s),n=M.filter(r=>r.session_id===s).length;if(!p||!E(p))continue;alive++;aliveRows+=n;const all=rows.filter(r=>r.session_id===s).length;if(U(R(p,"utf8")).length===all){pair++;pairRows+=n}}const prev=M.filter(r=>rows.indexOf(r)>rows.findIndex(x=>x.session_id===r.session_id)).length;const smj=M.filter(r=>r.samajh_check&&r.samajh_check.source==="transcript_path").length;const k=new Map();for(const r of rows){const key=r.session_id+"|"+r.ts;k.set(key,(k.get(key)||0)+1)}const dup=[...k.values()].filter(n=>n>1).length;const allM=rows.filter(r=>/^session-mismatch/.test(String(r.user_text_source||""))).length;console.log(`window rows ${W.length} · mismatch ${M.length} (whole log ${allM}) · sessions ${S.length} · own record ${ownN} · transcript alive ${alive} (rows ${aliveRows}) · lost ${M.length-aliveRows} · ordinal-pairable sessions ${pair} (rows ${pairRows}) · with an own earlier row ${prev} · samajh from transcript ${smj} · duplicate session+ts keys ${dup}`)'
```

The command was proven HERE only on a planted tree under `os.tmpdir()` (`AUD=<tmp>/state HOME=<tmp>/home`, 21 Nov 2026).
That is a check of the command, not a count of his:

```
window rows 3 · mismatch 2 (whole log 2) · sessions 2 · own record 0 · transcript alive 1 (rows 1) · lost 1 · ordinal-pairable sessions 1 (rows 1) · with an own earlier row 1 · samajh from transcript 2 · duplicate session+ts keys 0
```

| Id | Fact owed | Field of that line |
|---|---|---|
| C1 | how many of the 17-21 Nov audit rows are session-mismatch (the "43 of 101" quoted in PROOF §10 is the runner's, not re-derived), IST vs UTC | `window rows` · `mismatch` (both windows) |
| C2 | how many sessions, and whose transcripts still exist on his laptop (Claude Code's own retention may have deleted some) | `sessions` · `transcript alive (rows)` · `lost` |
| C3 | how many of those rows FORK maud43-1 (a) reaches | `ordinal-pairable sessions (rows)` |
| C4 | how many already carry the L5 samajh half from the transcript | `samajh from transcript` |
| C5 | how many have a prevStep under FORK maud43-5 (a) | `with an own earlier row` |
| C6 | whether `{session_id, ts}` is unique (FORK maud43-2) | `duplicate session+ts keys` |
| C7 | how many of the sessions the per-session record names at run time | `own record` (0 before mbank lands on main) |
| C8 | how many NEW drifts a rebuild finds (FORK maud43-4) | not measurable before the build: the dry run's `drifts found` |
| C9 | the rows they would supersede | the dry run's `rebuild` + `lost` (they are the candidates, by construction) |

## FILES a build would touch (all within this bound)

- `scripts/teaching_audit.mjs`: the pure `rowIdOf` / `rebuildPlan` / `rebuiltRow`, `rebuildMain`, one dispatcher line
  (`:2916-2932`), the usage line (`:2932`), and one header paragraph naming the verb.
- `ci/maud43/witness_maud43.mjs`, `ci/maud43/run_mutants_maud43.mjs`, `ci/maud43/PROOF.md`, `ci/maud43/LEDGER.jsonl`.

**Beyond the bound, each one a fork:** `.gitignore` (maud43-3 (c)), `scripts/teaching_contract.mjs` /
`scripts/watchman.mjs` / `scripts/study_scope.mjs` (maud43-3 (b)), `scripts/brain.mjs` (maud43-10 (b)). The same goes for
wiring the witness into `scripts/organism_test.mjs` (the mbank witness rides there by its own row; this spec proposes the
seat-time witness only, and the suite member is the architect's call).

## MEASUREMENTS at the cut (21 Nov 2026, this cloud container)

```
$ node scripts/teaching_audit.mjs rebuild-mismatch
teaching_audit: hook | report | probe [--clean|--text "..."] | seed-terms [--concept <c>] | replay <transcript.jsonl> | selftest
$ node scripts/teaching_audit.mjs selftest
ALL CHECKS PASSED (153 passed, 0 failed)
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
organism_test: 150 passed, 8 failed · ruled 0 · UNRULED 8 · LIVE 125 (hermetic: named, not run)
```

On 21 Nov 2026, the hermetic reds in this container are environmental and are not this spec's: there is no
`node_modules` (`ERR_MODULE_NOT_FOUND` for done / fsrs / mutagen, a lawpack plant needing acorn), plus ci_verdict /
red_cause / probe selftests. The spec changes no code, so the neutral machine's verdict on this tip is the measurement of
record. Its check runs are named below.

## CHECK RUNS of the pushed tip

(written on the push that follows the first one; see the last section)
