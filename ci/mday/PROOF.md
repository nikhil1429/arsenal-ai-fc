# mday · ONE START, ONE END, AND NOTHING FOR HIM TO REMEMBER — PROOF (forks rows 1044 / 1050, 18 Nov 2026 UTC)

Branch `claude/mday-build`, cut from `origin/main` at **`669200d`** (fetched 18 Nov 2026). The build order is the spec
`ci/mday/MDAY_SPEC.md` on `claude/mday-spec`, tip **`9421614`** (confirmed: `git log --oneline -1 origin/claude/mday-spec`
→ `9421614 unit mday: spec names the CI verdict of 2ddf436 …`), read whole. The spec measured at `33d1432`; every fact below
was RE-TAKEN at `669200d` (main moved two land commits, mlv0 + mlv1, which shifted `scripts/sitting.mjs`). Rulings: row 1050
F1-F10, verbatim in the brief. Where the spec and a ruling differ, the ruling won; each difference is named below.

## Measured at the base (`669200d`, `git grep -n … 669200d`)

| Fact | Where |
|---|---|
| the /learn START is prose: boot step 2 types `sitting.mjs open --surface code --no-spawn` | `.claude/skills/learn/SKILL.md:33` |
| with the daemon down, `open --no-spawn` prints one line and registers NOTHING | `scripts/sitting.mjs:1373` |
| the day END is three typed steps: judge-round → sitting close → /full-time | `.claude/skills/learn/SKILL.md:41` · `.claude/skills/learn/REFERENCE.md:501` · `.claude/skills/full-time/SKILL.md:42` |
| `sitting.json` has ONE writer, this daemon's file | `scripts/sitting.mjs:14` |
| the sitting's close fires the judge by code (`judge-due --trigger sitting.close`) | `scripts/sitting.mjs:228` (CLOSE_OWNER_STEPS) · close() at `:1021` |
| a JOIN rebinds the host to the session that ran the open (G0) | `scripts/sitting.mjs:705` |
| the study gate: study ⇔ payload session === the open sitting's host | `scripts/study_scope.mjs:71` |
| the night close's evidence (teaching_audit · the newest sitting's host · Desktop transcripts) | `scripts/study_scope.mjs:678` |
| the prompt hook (no /learn act); SessionStart deals ONE card in every session | `scripts/turn_hook.mjs:189` · `:302` |
| PreToolUse matcher has no `Skill`; rails decides every payload | `.claude/settings.json:72` · `scripts/rails.mjs:356`, `:373` |
| autoclose anchors evening/morning only; the card on the evening only; quiet rule | `scripts/postmatch.mjs:392`, `:409`, `:891`, `:474` |
| his close REFUSES with no `--hit` (blocks on his answer) | `scripts/postmatch.mjs:1476` |
| postmatch dates by the machine's LOCAL day (his laptop: IST) | `scripts/postmatch.mjs:75` |
| the night close: conductor `dayclose` (evening) / `dayclose-prev` (morning) | `scripts/conductor.mjs:100-106` |
| `deal` / `dealGuard` (silent under ARSENAL_ORGAN=1 or a fresh forge) | `scripts/captains_call.mjs:1642` · `:1141` |
| CLAUDE.md's own header bound | `CLAUDE.md:3` ("to ≤ 8 KB") |

**Named, not reached:** the architect measured on his laptop (row 1050): the sitting daemon up, the Evening and Morning conductor
tasks Ready, his learn sessions report `claude-desktop`, and a typed `/learn` reaches the transcript inline with no Skill call.
This seat cannot see his machine; those four facts are the architect's, carried, not re-measured. The memory MCP
(`organism-memory`) did not connect in this seat; nothing here rests on it.

## What was built (the named files only)

- **`scripts/day.mjs` (new)** — sole writer of nothing (F1 A). `start` (from either hook; binds the host from the payload) ·
  `end` (pointer → the sitting's close through its own door → `postmatch autoclose --anchor close` → the F4 organs → ONE
  `deal` → ONE line + the ONE message of questions; safe twice by the sitting's own fulltime stamp; refuses a non-host session,
  naming the night close — F5 A) · `answer` (forwards to postmatch's UPGRADE door, then scorer → setpiece → viz → deal) ·
  `status` (+ the two F8 counts) · `brief` (SessionStart line, F9).
- **`scripts/sitting.mjs`** — the LOCAL door, F10 A: `openLocal` / `closeLocal` run this file's own `createSitting` under the
  owner lock `sitting.json.lock` (exclusive create, holder pid; a dead holder is taken over once; a live one refuses, no wait);
  `openDoor` / `closeDoor` route daemon up → POST ONLY, down → local; the local door REFUSES while the daemon answers. CLI
  `open --no-spawn` (daemon down) and `close` (daemon down) use it; the old line is kept FROZEN in a comment (L9). The close row
  gains `opened_at` + `host_session_id` (F8). Two existing POST waits hoisted to named consts (same values, no new number).
- **`scripts/turn_hook.mjs`** — `learnCommandOf` (pure; the LEADING `/learn` token or its `<command-name>` tag) → `day.mjs start`
  CALL shape, before the scope is read; `start()` ends with `day.mjs brief`.
- **`scripts/rails.mjs`** — the Skill branch BEFORE `decide()`: Skill(learn) → `day.mjs start --by hook:skill` (detached, never
  waited); any other Skill passes untouched; the branch fails open on its own error (F7's two clauses).
- **`scripts/postmatch.mjs`** — anchor `close` (F3 A): counted as a close by `CLOSED_BY_RE`, no quiet defer, files the
  day-close card like the evening (`CARD_ANCHORS`); its selftest pin follows the new line.
- **`.claude/settings.json`** — F7 A, the diff of the matcher:
  ```
  -        "matcher": "Bash|PowerShell|Write|Edit|MultiEdit|NotebookEdit|Agent|Task|Workflow",
  +        "matcher": "Bash|PowerShell|Write|Edit|MultiEdit|NotebookEdit|Agent|Task|Workflow|Skill",
  ```
  plus one sentence appended to `_PreToolUse_comment` naming why. The seat branch's effort key is NOT on this branch (cut from main).
- **`.claude/skills/learn/SKILL.md`** step 2 → "already open by code; `day.mjs status` shows it"; step 5 → `day.mjs end`.
  **`REFERENCE.md §4`** → `day.mjs end`, no typed judge-round. **`full-time/SKILL.md`** → the ANSWER path (`day.mjs answer`).
- **`CLAUDE.md`** — Session start item 4: the end line (F9 A). **Size bound named, not settled (F9):** the header says
  "≤ 8 KB" (`CLAUDE.md:3`); the file was **15,444 bytes at `669200d`** and is **15,645 bytes** on this branch (`wc -c CLAUDE.md`,
  18 Nov 2026). The bound was already exceeded at the base; this line adds 201 bytes. Whether the bound stands is the architect's.

## Witness, both ways (by last line, 18 Nov 2026 UTC = 19 Nov IST)

```
node ci/mday/witness_mday.mjs --org . --base-org <git archive of 669200d>
GREEN MDAY /learn opens his day by code and one end closes it, safe twice, never waiting on his answer · 31 clause(s)   (exit 0)

node ci/mday/witness_mday.mjs --org <git archive of 669200d> --base-org <same>
RED MDAY · F4, W1.1, W6.1, W1.2, W1.3, W9, W2.1, W3.1, W5.1, W5.3, W6.2, W2.2, W4.3, W3.2, W2.3, W4.1, W2.4, W7.0, W7.1, W7.3, W8, W10   (exit 1)
```

GREEN on the base, by design (kept guards the spec names "Base GREEN"): W1.4, W2.5, W3.3, W4.2, W5.2, W6.3, W7.2, BOUND, LAST.
Every plant runs on a copy under os.tmpdir() with its own EMPTY state dir (nothing of his copied; F4 and W10 byte-copy tracked
state files the organs need — never printed), its own HOME / ARSENAL_ARCHIVE, a free port with no daemon (W10: a real keeper on
its own port), `TZ=Asia/Kolkata` (his laptop's clock; postmatch dates by the local day), and a fake `claude` first on PATH
(spawns counted and printed as planted; no live model call). No timeout, budget or ratio is typed: SLACK is one node start
measured in the run; the evening clock is the last study turn plus the quiet minutes postmatch declares in its own source plus
SLACK; a detached hand-off waits one measured run of the same verb plus SLACK; LAST waits the longest measured run plus SLACK.

## Mutants (18 Nov 2026 UTC)

```
node ci/mday/run_mutants_mday.mjs --org . --base-org <git archive of 669200d>
run_mutants: 25 of 25 mutant(s) RED by the clause that names them · control GREEN
```
One per clause: the spec's μ1.1-μ6.2 (μ4.2 is judged by W4.3, the clause it names), plus F4, W7.0-W7.3, W8, W9, W10 for the
clauses the rulings added. The invariant clauses W3.3, W4.2, W5.3, W6.3, BOUND and LAST carry no mutant of their own.

## The autocrlf class (row 1036) — on CRLF-converted copies (18 Nov 2026 UTC)

No witness plants git (nothing cloned, nothing init'd: every plant is an fs copy). Lines read from processes split on `\r?\n`;
BOUND hashes text with CRLF folded to LF; the mutant runner matches each edit site in the file's OWN line ending.
```
witness --org <CRLF build> --base-org <CRLF base>    GREEN MDAY … · 31 clause(s)
witness --org <CRLF base>  --base-org <CRLF base>    RED MDAY · F4, W1.1, W6.1, W1.2, W1.3, W9, W2.1, W3.1, W5.1, W5.3, W6.2, W2.2, W4.3, W3.2, W2.3, W4.1, W2.4, W7.0, W7.1, W7.3, W8, W10
run_mutants --org <CRLF build> --base-org <CRLF base> run_mutants: 25 of 25 mutant(s) RED by the clause that names them · control GREEN
```

## F4 — idempotence by day, per organ (the build's first act, witness clause F4, 18 Nov 2026 UTC)

Each organ run twice on the same day over a byte copy of --org's tracked state; idempotent ⇔ the second run rewrites no byte:
`scorer NOT idempotent (1 file rewritten, exit 0/0) · setpiece NOT idempotent (1 file rewritten, exit 0/0) · viz NOT idempotent
(5 files rewritten, exit 0/0)`. By the ruling's branch, **all three run on `answer` only** (`day.mjs` EVENING_ORGANS), none at
`end`. The clause re-measures every run: an organ that becomes idempotent turns F4 RED until it is promoted to `end`.

## Each touched selftest, before → after (headline lines, 18 Nov 2026 UTC)

```
sitting    sitting selftest: 99 passed, 0 failed  →  sitting selftest: 99 passed, 0 failed
turn_hook  turn_hook: 168 passed, 0 failed        →  turn_hook: 168 passed, 0 failed
rails      rails selftest: 106 passed, 0 failed   →  rails selftest: 106 passed, 0 failed
postmatch  ALL CHECKS PASSED                      →  ALL CHECKS PASSED
node scripts/models.mjs check → exit 0 (before and after)
```
`day.mjs` carries no `selftest` verb: its witness is `ci/mday/witness_mday.mjs` (the ruling's file), so the coverage law
(`package.json:_selftest_coverage_law`) needs no new member and package.json stays untouched.

**The hermetic suite** (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 18 Nov 2026 UTC, this container):
`organism_test: 136 passed, 4 failed · ruled 0 · UNRULED 4`. The four are NOT this unit's: the coverage law names
`home_pin, probe, study_scope` orphaned, and the SAME failure reads at `669200d` in this container
(`organism_test.mjs coverage` on the base archive, 18 Nov 2026: `9 passed, 1 failed`); `fsrs` and `mutagen` die on `ERR_MODULE_NOT_FOUND`
(`ts-fsrs`) because this container has no `node_modules` — the neutral machine runs `npm ci`. Its verdict is the judge (below).

## The rulings vs the spec (named)

- **R7 / F-witness:** the spec put the witness in `day.mjs selftest` joined to the hermetic chain; the ruling names
  `ci/mday/witness_mday.mjs` with `--org/--base-org`. Built as ruled; `scripts/organism_test.mjs` is NOT touched (fewer files).
- **F4:** the spec recommended C; the ruling made it a measured branch. Measured: none idempotent → answer only.
- **F8:** the spec put the two counts in `sitting.mjs stats`; they live in `day.mjs status` (`closeCounts`), because day.mjs
  imports sitting.mjs and the reverse would close a cycle. Read-only, never a card. Count (i) is the code-only ceiling
  (night-closed learn days); the spec's transcript refinement ("his last prompt after a teacher turn") is NOT built — a fork.
- **F10:** the clause "daemon up means the POST door only, never both" is code (`localDoor` refuses; `openDoor` routes) and
  witnessed by W10.

## Where this build departs from the spec's own text (named, my judgement)

1. **W1.3 — the host MOVES on a second session's /learn** (the spec said it stays the first). Base G0 law (`sitting.mjs:705`)
   rebinds on a JOIN because a second /learn session the same day is his NEW study session; keeping the old host would
   silence every study organ in the session he is actually in. W1.3 asserts the move and that the line says so (μ1.3 = no
   rebind → RED). The architect may rule otherwise.
2. **A sitting left open from an EARLIER IST day is closed (`day-rollover`) before today's start opens** — the local door has no
   idle timer, so without this today's /learn would JOIN yesterday's sitting. Not in the spec.
3. **R5's conditional re-deal at `start` is not built:** SessionStart already deals ONE card in every session (`turn_hook.mjs:302`)
   and is silenced by the same guard a start-deal would be, so `start` never deals (W5.2 holds the card shown once).
4. **"Already closed" is the sitting's own stamp** (closed today, reason fulltime). An `end` killed between its step 2 and step 3
   leaves step 3 to the night close (R4), not to a second `end`.
5. **The Skill door's hand-off is detached** (never waited, no bound): a sitting's open gathers context that a hook bound should
   not cut in half. The prompt door runs in-process (CALL shape).

## FORKS (files beyond the named, NOT edited)

1. `scripts/learn_digest.mjs:140` and `:153` still PRINT the old prose (judge-round → sitting close → /full-time, and "open the
   sitting FIRST"), and /learn's boot says "obey the screen". Until it changes, a session may type the old close by hand —
   the double judge door R2 removed. It needs its own build seat.
2. `package.json` — no change needed (day.mjs has no selftest verb); named because the spec put `day.mjs selftest` in the chain.
3. `scripts/study_scope.mjs` — untouched (F6 A, the transcript fallback stays as it is).
4. The CLAUDE.md size bound (≤ 8 KB stated, 15,645 bytes now) — the architect's (F9).
5. The F8 transcript refinement of the missed-close count — unbuilt; the code count is a ceiling.
6. `campaign-2026-09/tools/effort_receipt.mjs` does not exist here: `Error: Cannot find module
   '/home/user/arsenal-ai-fc/campaign-2026-09/tools/effort_receipt.mjs'` (exit 1). Nothing written under campaign-2026-09/.

## CI (the neutral machine)

Read through the public API with curl, no token (`GET /repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`); the ids and
verdicts of each push are rows `ci-read` in `ci/mday/LEDGER.jsonl`.
