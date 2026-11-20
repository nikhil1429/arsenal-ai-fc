# mcap · PROOF (unit mcap, forks rows 1162 / 1163, 19 Nov 2026)

**Base.** `origin/main` at `fb42118` (`fb4211870093e6b8657655eb02ebcfc425f1eab1`), fetched 2026-11-19T12:37Z. This is
`fb42118` itself (the brief: "fb42118 or later"). `ci/mcap/BASE` holds that sha. The spec is `ci/mwit/MWIT_SPEC.md` at
`88bf69d`, read whole (§0, §1, every clause section, UNITS, FORKS, NAMED NOT GUESSED). The sibling it names,
`ci/mwit/plant_day.mjs`, is mmeter's planter; this unit plants its own state and does not use it.

Branch `claude/mcap-build`. Its named files, and only these, differ from BASE (19 Nov 2026):
`ci/witness/mcap/witness_capability.mjs` · `ci/witness/mcap/capability_map.json` · `ci/mcap/PROOF.md` ·
`ci/mcap/LEDGER.jsonl` · `ci/mcap/BASE` · `ci/mcap/run_mutants_mcap.mjs`. No organ file is edited. `scripts/organism_test.mjs`
is not edited (row 1162 (2): mmeter's one suite member walks `ci/witness/<unit>/` and runs `plants`; this witness prints the
`PLANTS mcap · k of n plant(s) as expected` line it reads). `.claude/settings.json` is not touched.

Record (resolved): CHECKPOINT · STOPPED at 2026-11-19T12:37:50Z · resume from step 1 (the architect's STOP, his word #269). RESUMED
2026-11-19T18:08Z (23:38 IST) on the architect's RESUME (his word #270) from that line; every step below is after the resume.

## 1 · Measured at the base (file:line at `fb42118`)

| fact | where |
|---|---|
| the gate's check ids, family, mouth | `CHECKS` `scripts/teaching_gate.mjs:98-164`; selftest `:871` |
| the gate's log row (sole writer teaching_gate.mjs) | `scripts/teaching_gate.mjs:807`: `ts, session, sitting, decision, scope, reds, patch, counted, cls, moment, second_pass, surviving, …`; a second pass logs what SURVIVED `:762-763` |
| `cls` on the row is the classifier's KIND of his prompt | `scripts/teaching_gate.mjs:518` |
| the legal moments | `MOMENT_KINDS` `scripts/teaching_gate.mjs:391` (= forge_session `MOMENTS` `:138`) |
| the audit's rule ids | `CHECKED_RULES` `scripts/teaching_audit.mjs:186-192`; selftest `:1971` |
| the audit's Stop row (writer teaching_audit.mjs, log `:159`) | `scripts/teaching_audit.mjs:1813-1830`: `ts, session_id, scope, sitting_id, concept, step, drifts[], measured{questions,…}` (`:1288-1297`) |
| the study classifier, flags `answer · confusion · system · question` | `classifyPrompt` `scripts/study_scope.mjs:231-262`; banked moments `BANKED_MOMENTS` `:265` |
| a REAL day | `dayProof` `scripts/day.mjs:204-213` over `sitting_reviews.jsonl` (writer `scripts/sitting.mjs`, row `:1062`) |
| the bank's capture rows (his words) and the judge's settled rows | `gaffer_grade_queue.jsonl`, sole writer `scripts/gaffer_brain.mjs:7`; capture row `:1362-1397` (`spoken`, `concept`, `axis`, `day`); settled row `:2252-2262` (`verdict`, `of`, `day`) |
| every judge verdict, per type | `VERDICT_TYPES` `scripts/gaffer_brain.mjs:976-994` |
| the compiled notes and their crack items | `compiled_notes.jsonl`, sole writer `scripts/notes_compiler.mjs:4`; `noteState` `:153`, `noteDay` `:134`; crack item `{mark:"T", kind:"crack", at, rid, galat[], sahi[]}` `:311,322` |
| which state files a cloud clone holds | tracked: `teaching_gate.jsonl`, `compiled_notes.jsonl`; NOT tracked: `sitting_reviews.jsonl`, `teaching_audit.jsonl`, `gaffer_grade_queue.jsonl` (`git ls-files`) — so every clause reads UNREAD on the cloud (no real day), never green (row 1162 (5)) |

## 2 · The witness

`node ci/witness/mcap/witness_capability.mjs <c07|c10|c12|c13|c18|c28|c32> --day <D> [--org <dir>]`: the receipt's form (a
tracked path and plain args). Its header is the contract. Plants: `plants [--org <dir>]`. Unit: `--org <dir> --base-org <dir>`.
The five readers (turns · nonanswer · crack · park · close) and the map's validation against its owners are in the header.

Measured, by command (19 Nov 2026):

```
node ci/witness/mcap/witness_capability.mjs plants
PLANTS mcap · 80 of 80 plant(s) as expected            (exit 0)

node ci/witness/mcap/witness_capability.mjs plants --org <clone of fb42118>
PLANTS mcap · 36 of 80 plant(s) as expected            (exit 1)

node ci/witness/mcap/witness_capability.mjs --org . --base-org <clone of fb42118>          (build)
  C:capability-c07 · base RED (… a real day, three judged turns, no red → 0…) · build GREEN (13/13)
  C:capability-c10 · base RED · build GREEN (11/11)
  C:capability-c12 · base RED · build GREEN (11/11)
  C:capability-c13 · base RED · build GREEN (9/9)
  C:capability-c18 · base RED · build GREEN (10/10)
  C:capability-c28 · base RED · build GREEN (13/13)
  C:capability-c32 · base RED · build GREEN (13/13)
  BOUND · GREEN · 5 file(s), every one named
  LAST · GREEN · no process names the temp prefix
GREEN MCAP capability map + witness (c07 c10 c12 c13 c18 c28 c32), RED on base and GREEN on build · 7 clause(s)   (exit 0)

node ci/witness/mcap/witness_capability.mjs --org <clone of fb42118> --base-org <clone of fb42118>   (the base tree)
RED MCAP · C:capability-c07, C:capability-c10, C:capability-c12, C:capability-c13, C:capability-c18, C:capability-c28, C:capability-c32, BOUND   (exit 1)

node ci/witness/mcap/witness_capability.mjs c07 --day 2026-11-18      (this cloud, real repo)
MCAP C:capability-c07 · UNREAD · 2026-11-18 is not a real day (no sitting closed on 2026-11-18)   (exit 2; c18 the same)
```

**Red before, through the receipt organ (row 1162 (5)).** Recorded on a TEMP ledger only, through the organ's own door
`ARSENAL_RUNG_STATE_DIR` (honoured under os.tmpdir() only, `scripts/rung_receipt.mjs:19`); the live
`rung_receipts.jsonl` was never opened (the brief forbids any write under dressing-room/state). Every one of the seven was
ACCEPTED (exit 2, a red the organ records), at head `6f526b8`:

```
ARSENAL_RUNG_STATE_DIR=<tmp> node scripts/rung_receipt.mjs red --rung capability --clause capability-cNN --cmd "node ci/witness/mcap/witness_capability.mjs cNN --day 2026-11-18"
rung_receipt: red capability:capability-c07 · exit 2 · out b78a791fd4a7 · head 6f526b84db2e · last: MCAP C:capability-c07 · UNREAD · 2026-11-18 is not a real day …
(c10 d72926c864b8 · c12 805c7a8808fe · c13 02a6dff42b57 · c18 9a4d7d56fb0d · c28 64ecd2f03b8e · c32 32bae434af79 — all exit 2)
```

The organ refuses a `--clause` with a colon (`/^[A-Za-z0-9._-]+$/`), so the receipt's clause id is `capability-cNN` for the
spec's `C:capability-cNN`. The rung id `capability` is this seat's word; the plan's rung id for the ten is NAMED N1/N12 (not
in this repo). **His laptop records the live red** with the same command and the real ledger; the green is
`rung_receipt.mjs green --rung capability --clause capability-cNN --day D` on his first real day after the landing.

## 3 · Mutants (one per clause)

```
node ci/mcap/run_mutants_mcap.mjs
  control · GREEN · PLANTS mcap · 80 of 80 plant(s) as expected
  RED  C:capability-c07 · the map drops A.new-terms · clause RED
  RED  C:capability-c10 · the map keeps A.position only (A.count-form dropped) · clause RED
  RED  C:capability-c12 · the map drops B.bank · clause RED
  RED  C:capability-c13 · a question is read as an answer (question dropped from the non-answer kinds) · clause RED
  RED  C:capability-c18 · the crack row's words are not compared with his · clause RED
  RED  C:capability-c28 · the map drops the audit id no-system-mid-concept · clause RED
  RED  C:capability-c32 · the close half is dropped (an open moment at close is never red) · clause RED
run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN
```

The per-id plants are pinned to the RULED ids (`RULED` in the witness), never to the map they judge: a plant derived from
the map could not catch a map that narrowed (found in this build — the first mutant run would have read 0 for c07/c10/c12).

## 4 · Selftests and suite members

No organ is edited, so no organ selftest changed; none is touched. No suite member is touched (row 1162 (2)). The witness is
judged by mmeter's member once both land; its plants line is the member's contract (`claude/mmeter-build` `4d75624`).

```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all     (19 Nov 2026)
  this checkout (build, node_modules installed by npm ci):
    organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
    the one FAIL: EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law) — the base red CI names on main
    ok   LOAD ZERO BLOCK 7 · no canon file states a live count a command can produce (91 files scanned, 1 declared)
  two equal local clones (fb42118 and the build), same node_modules:
    base  : 157 passed, 3 failed · build : 147 passed, 3 failed — the SAME three FAILs on both (the coverage law, SUITE MEMBER ·
    sandbox selftest exits 0, all 53 hermetic suite members pass); the asserts that differ are LOAD ZERO / RUNG A ledger
    reads, which follow what each clone's state holds, not this unit's files. The neutral machine (below) is the authority.
```

## 5 · LAW M and the law pack (row 1130 (2)), LF trees

```
node scripts/models.mjs check
models check: 137 file(s) · literal model names outside models.mjs: 0 · declared fixture lines: 10 · brain_config claude aliases ok      (exit 0)

node scripts/lawpack.mjs gate        (BASE clone fb42118)
lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
node scripts/lawpack.mjs gate        (build)
lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
```

Every count equal: this build raises none. Both trees read `lawpack: 2 RED` (jugad-literal-subject-list 93 over a frozen
90, depcruise_errors 13 over a frozen 7) — on BASE as on the build, so it is pre-existing in this cloud's checkout and not
this unit's; named, not fixed (no organ file is this unit's).

## 6 · Where the ruling and the spec differ (the ruling wins)

- **F13.** Spec recommends (c) (hold c13/c18/c28); row 1163 (7) builds all seven now. Built.
- **c13.** Spec map `{A.confusion-literal, B.moment}` set aside: row 1163 (2) is the whole meaning. "A question or a complaint"
  is read as the classifier's KIND `question`, `confusion` or `system` (`study_scope.mjs:207-213`: the complaint riding a
  message is flagged `system`; his own not-understanding is `confusion`). A reply whose kind is `answer` (a gut-word lead) is
  never red, even with a complaint riding it — the classifier's own rank. The reply is classified with no prior moment: the
  rep row does not carry one.
- **c18.** Spec map `{B.bank-verbatim, B.bank}` set aside: row 1163 (3) is the whole meaning. "Judged broken" is a SETTLED
  verdict the map names per type (`cracked`, `standing`, `failed`, `collapsed`, `not_yet`, `fell_in`, `missed`); every
  VERDICT_TYPES type must be placed (`doubt_quality` is not an answer), so a new type cannot slip past.
- **c28.** Row 1163 (4): "the proposed map" = `{checks: A.buying, audit: no-system-mid-concept}`, plus the park turn. A
  park turn is a gate row of the sitting whose `cls` is `system`; "ends on the micro-question … handed back in the same
  turn" is read off the audit row of the same Stop: `measured.questions ≥ 1`. A sitting with no park turn reads UNREAD.
- **F14 (a)** (row 1162 (1)): the plants copy `scripts/` under os.tmpdir(); the seams are deleted from env, never used.
- **F11** (row 1162 (2)): no suite edit; the UNITS table's "every unit edits organism_test.mjs" is overruled.
- **Survival.** Spec (b)3 says "no row's reds (first pass or surviving)"; the witness counts a first-pass BLOCK red only
  through its second-pass row when one follows (the patch was added; the gate logs what survived, `:762-763`). Named as a
  reading, for the architect.

## 7 · Residuals and FORKS

- **FORK mcap-1 · c18 has no crack-row owner.** No organ writes a crack row stamped concept, axis, MOMENT and HIS WORDS.
  The nearest is `notes_compiler.mjs`'s crack item (concept/axis on the compiled row, one diff as `galat`/`sahi`) — it
  carries no `moment` and no `words` (it is the teacher's ```diff, `[T]`). So on every real day with a broken answer, c18
  reads RED until an owner stamps them. (a) notes_compiler stamps `moment` + `words` on its crack item (from the bank row the
  diff answers); (b) the pacer's `crack` verb — `study_scope.mjs:285` ALLOWS `forge_session.mjs crack`, but forge_session has
  no `crack` case (`scripts/forge_session.mjs:2771-3169` cases) — is built as the crack row's sole writer. The witness reads
  the compiled note today; (b) would change its source.
- **Residual mcap-2 · c28 "is a parked item ever shown again".** Row 1163 (4) asks it named: **no organ holds parked items.**
  A park is one line in a teacher turn; nothing records it, so nothing can return it (the kickoff brief's `CARRIED FROM`
  line carries the forge pointer, not a parked item). → a FORK: a parked-items owner, if he wants the return.
- **Residual mcap-3 · c28 "ends on".** The audit measures a question COUNT per turn, not its position, and the gate's
  `A.question-last` does not run on a system-classified turn (`teaching_gate.mjs:31-35`). "Ends on" is read as "hands back
  ≥ 1 question in that turn"; the position needs an owner reading (the audit row could carry `question_last`).
- **Residual mcap-4 · selftest "planted both ways".** The map validation requires each id to be NAMED in its organ's selftest
  body; it does not run the selftest to prove both directions (running it is the suite's job).
- **Residual mcap-5 · c32 close half.** "Answered or banked before he left" is read as: a capture row after the last gate
  row that declared a banked moment, at or before the close. A banked moment never declared (an undeclared question) is not
  seen (row 266: an undeclared question is a quiz-dump red, another check's).
- **NAMED (cloud cannot read):** the live `sitting_reviews.jsonl`, `teaching_audit.jsonl`, `gaffer_grade_queue.jsonl`
  (laptop only — every clause reads UNREAD here); the plan v3 rung id for the capability clauses (N1/N12); TEACHING GATE v2
  (N13) — not needed by row 1163.

## 8 · CI (the neutral machine, read by the public API, no token)

```
5bdf778 · 135782545638 npm test · node 22 (in progress at read) · 135782544916 npm test · node 24 completed success
6f526b8 · both legs cancelled (superseded by the next push)
```

The final tip's two legs are named in the ledger and the final message.

Read at 2026-11-19T18:38Z, once: `ci_verdict b37ebfc GREEN — npm test · node 22: GREEN (base fb42118 · 0 new red · 1 base red · 126 live) [run 135786526980] | npm test · node 24: GREEN (base fb42118 · 0 new red · 1 base red · 126 live) [run 135786526210]`.

## 9 · Row 1173 and the merge of main 5759cce (row 1172), 20 Nov 2026

**Row 1173 rules FORK mcap-1 as (b):** unit mcrk builds the pacer's crack verb as the SOLE WRITER of the crack row (his words
verbatim, concept, axis, moment, written at the moment the answer breaks), and the notes compiler reads that row. Option (a)
is refused. **c18 is not weakened, skipped or re-labelled.** Until mcrk lands, c18 reads a TRUE red on any real day with a
broken answer. The reason: no organ on main writes a crack row carrying `moment` and `words` (his words). The only crack
items on main are notes_compiler's `[T]` diff items (`galat`/`sahi`, no moment, no words, `scripts/notes_compiler.mjs:311,322`),
so the witness's crack-row predicate (a legal moment · his words equal to the capture's `spoken` · one diff) finds none, and
the broken answer is red. That red is the capability's real state today, not a defect of the witness. When mcrk lands, the
witness's SOURCE moves to mcrk's row (a witness change, so a fresh red before is owed). **Residual mcap-2** (are parked
items ever shown again) goes to unit **mprk**.

**The merge.** `git merge --no-edit origin/main` at main `5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90` (ms1 + mrj + mrt + mr3 +
mrf + mrv landed), merge commit `b53eb4c`. No land/* branch was merged. **No conflict hunks:** `scripts/organism_test.mjs` and
`package.json` are untouched by this unit, so main's side stands whole and nothing of either side was removed. `ci/mcap/BASE`
now reads `5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90` (commit after the merge).

**FORK mcap-6 · ms1's member does not find this witness.** main's WITNESSES member (`scripts/organism_test.mjs:2800-2806`,
`witnessFile`) judges only `ci/<unit>/witness_<unit>.mjs`, with its cwd a copy of `ci/<unit>/` (`:2919-2924`). This unit's
witness sits at `ci/witness/mcap/witness_capability.mjs` (the UNITS row, F10 A, and the brief). So on CI the member does not
see it: it is not red, and not judged. mmeter's member (it walks `ci/witness/`, `claude/mmeter-build` `4d75624`) is not on
main. (a) a thin `ci/mcap/witness_mcap.mjs` that hands its args to the ci/witness witness — a file beyond this unit's named
ones, so not added; (b) ms1's `witnessFile` also looks in `ci/witness/<unit>/` (an edit of the suite file, which is mmeter's
by row 1162 (2)); (c) mmeter's member landing covers it.

Measured on the merged tree, by command (20 Nov 2026):

```
node ci/witness/mcap/witness_capability.mjs plants
PLANTS mcap · 80 of 80 plant(s) as expected                     (exit 0)
node ci/witness/mcap/witness_capability.mjs --org . --base-org <clone of 5759cce>
  BOUND · GREEN · 6 file(s), every one named
  LAST · GREEN · no process names the temp prefix
GREEN MCAP capability map + witness (c07 c10 c12 c13 c18 c28 c32), RED on base and GREEN on build · 7 clause(s)   (exit 0)
node ci/witness/mcap/witness_capability.mjs --org <clone of 5759cce> --base-org <clone of 5759cce>
RED MCAP · C:capability-c07, C:capability-c10, C:capability-c12, C:capability-c13, C:capability-c18, C:capability-c28, C:capability-c32, BOUND   (exit 1)
node ci/mcap/run_mutants_mcap.mjs
run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN   (exit 0)
```

CHECKPOINT · STOPPED at 2026-11-20 (UTC, after this push) · merged tip = this commit's parent chain on `claude/mcap-build`
(merge `b53eb4c`, BASE commit, this proof commit) · base 5759cce · resolution hunks: none (no conflict) · witness `GREEN MCAP … · 7 clause(s)` /
base `RED MCAP · … BOUND` · mutants `run_mutants: 7 of 7 … · control GREEN` · resume from: the architect's next ruling (FORK mcap-6; c18 re-sourced once mcrk lands).

## 10 · Row 1194: c18 re-shaped (fork mcrk-4 ruled "neither a nor b"), 20 Nov 2026

**The ruling.** c18 stops comparing texts. The old predicate was `fold(words) === fold(capture.spoken)`. On his laptop,
the runner measured that it held for only part of the capture rows, because his words live twice: once in the prompt record
and once in the teacher's bank copy. **The new shape:** c18 joins the crack row to its capture by the TURN IDENTITY both
records carry, never by time and never by text (row 1194 (1), (4)). It requires a legal moment, non-empty words, and words
that came from the prompt record. Rows dated before 30 Aug 2026 are pre-cyborg and enter no count (row 1194 (3)).

**The field names, coordinated with the mcrk build** (`claude/mcrk-build` `977823a`, not on main):
- The crack row (`cracks.jsonl`, sole writer `forge_session.mjs` once mcrk lands, `crackRow`) carries `bank_of`, the `id` of
  the capture row of that turn. The judge's settled row names the same capture by `of`. So the join reads: settled.`of` =
  capture.`id` = crack.`bank_of`. That is identity on both sides, with no time and no text.
- `words_src: "teaching_audit_last.prompt"` is the prompt record (the UserPromptSubmit write). `moment` is checked against
  teaching_gate `MOMENT_KINDS`.
- The diff is the compiled crack item whose `crack_id` names the crack row (mcrk's notes_compiler stamps `crack_id`). That
  is also an identity join. The "one diff" requirement of row 1163 (3) stands.
- The map carries `join: {crack_field: "bank_of", capture_field: "id"}`, `words_src` and `cyborg_from: "2026-08-30"`. A map
  that lacks any of these reads UNREAD.
- The witness reads crack rows through the owner's `readCracks` when the tree exports it (the mcrk tree). On main, which
  has no reader, it reads the file the owner declares, read-only.

**The dependency (named).** Until mcrk lands, main has no `cracks.jsonl` writer. So c18 is a TRUE red on any real day with a
broken answer ("no crack row carries its turn identity"). This is unchanged from row 1173.
- `bank_of` is chosen by the crack verb at write time, as the axis's first bank row after his prompt (mcrk `crackRow`). That
  pick is the organ's, not this witness's: the witness never joins by time.
- If mcrk renames `bank_of` or `words_src`, this map moves with it. A map change is a witness change, so a fresh red is owed.

Plants for c18, both ways (20 Nov 2026), all as expected:
- **0:** the crack row is joined by turn identity, with a legal moment, words from the prompt record, and its diff.
- **0:** his words differ from the bank's copy and the identity matches. No text is compared.
- **1:** no crack row.
- **1:** no turn identity on the crack row.
- **1:** the identity names another capture, while the words equal his (a text join would pass this one).
- **1:** empty words.
- **1:** words not from the prompt record.
- **1:** an illegal moment.
- **1:** another axis.
- **1:** no compiled item names the crack row.
- **2:** no broken answer.
- **2:** the capture is absent.
- **2:** a pre-cyborg day.
- **2:** a map without a broken verdict for a type, or without a join, or no map at all.

```
node ci/witness/mcap/witness_capability.mjs plants
CLAUSE C:capability-c18 GREEN · 16/16 plant(s)
PLANTS mcap · 86 of 86 plant(s) as expected                    (exit 0)
node ci/witness/mcap/witness_capability.mjs plants --org <clone of claude/mcrk-build 977823a + this map>
PLANTS mcap · 86 of 86 plant(s) as expected                    (exit 0; crack rows read through mcrk's readCracks)
node ci/witness/mcap/witness_capability.mjs --org . --base-org <clone of 5759cce>
GREEN MCAP capability map + witness (c07 c10 c12 c13 c18 c28 c32), RED on base and GREEN on build · 7 clause(s)   (exit 0)
node ci/witness/mcap/witness_capability.mjs --org <clone of 5759cce> --base-org <clone of 5759cce>
RED MCAP · C:capability-c07, C:capability-c10, C:capability-c12, C:capability-c13, C:capability-c18, C:capability-c28, C:capability-c32, BOUND   (exit 1)
node ci/mcap/run_mutants_mcap.mjs
  RED  C:capability-c18 · the text comparison is restored in place of the turn-identity join (row 1194 (1) refuses it) · clause RED
run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN   (exit 0)
```

**FORK mcap-7 · row 1194 (4) "no witness may use a time join" reaches three more clauses.** This build moved only c18, as
ordered. Three other readers still join by time, because the records they read carry no shared turn identity on main:
- **c13** keeps the capture rows inside the sitting's `[opened_at, closed_at]`. Capture rows carry no sitting id.
- **c28** pairs a park turn's gate row with the audit row of the same Stop by session and the neighbouring gate rows' `ts`.
  The gate row carries no turn id, and the audit row carries none either.
- **c32** reads "banked after the last banked moment, before the close" by `ts`.

The options:
- (a) The owners stamp one turn id on every gate, audit and capture row of a turn. That is an organ build, so it belongs
  to another unit, and these three clauses then join by it.
- (b) Rule these three as windows, not joins. They filter by an interval and pair no two records by an instant.
- (c) The three read UNREAD until (a) lands.

This seat does not decide it.
