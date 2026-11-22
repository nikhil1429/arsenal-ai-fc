# unit mstrike · C:capability-c22 · PROOF

CHECKPOINT · 2026-11-21T09:00Z · rows 1233 (2)/1236 merge: main 7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f merged by `git merge FETCH_HEAD` (merge commit 8fa31dd; no rebase, no force) · conflicted files: none · BASE = 7bf008b (row 1172 keyed BASE to the merged main) · added: `plants` mode, because main's clause-witness member runs `witness plants` · witness plants: PLANTS mstrike · 6 of 6 plant(s) as expected (exit 0) · witness build: GREEN MSTRIKE the asked-first strike is read, and read first · 1 clause(s) (6 plant(s), BOUND, LAST) (exit 0) · witness base 7bf008b: RED MSTRIKE · C22 (C22.1, C22.2, C22.3, C22.4, C22.5, C22.6) (exit 1) · mutants: run_mutants: 2 of 2 mutant(s) RED by the clause that names them · control GREEN · local hermetic suite: 167 passed, 0 failed · legs of d7432017533368220479c47bc43cd4c281183e6a, read through the public API (curl, no token): hermetic twice · node 22 run 136775655819 success; hermetic twice · node 24 run 136775656106 queued; npm test · node 22 run 136775656001 queued; npm test · node 24 run 136775656000 in_progress · ci_verdict d743201 PENDING (exit 1); no leg is red. UNREAD, not green: the neutral legs have not finished, and they are read once, never polled · resume from: read the legs of this proof's own tip once

CHECKPOINT · STOPPED at 2026-11-20T01:28Z · row 1172 merge: main 5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90 merged into this branch (merge commit 3410fb84e96e51f11942a45243c03838040c2f9f; the pushed tip is the commit above it that carries this line) · BASE = 5759cce · resolution hunks: none (no conflict; this branch touches only ci/witness/mstrike/ and ci/mstrike/, neither of which main touches; scripts/organism_test.mjs and package.json untouched here) · witness build: GREEN MSTRIKE the asked-first strike is read, and read first · 1 clause(s) (6 plant(s), BOUND, LAST) (exit 0) · witness base 5759cce: RED MSTRIKE · C22 (C22.1, C22.2, C22.3, C22.4, C22.5, C22.6) (exit 1) · mutants: run_mutants: 2 of 2 mutant(s) RED by the clause that names them · control GREEN · resume from: nothing owed; await the architect

~~CHECKPOINT · STOPPED at 2026-11-19T12:38Z · resume from step 2~~ — RESUMED 19 Nov 2026 on the runner's message (his word 270); steps 2-5 done below.

**Base:** origin/main `fb4211870093e6b8657655eb02ebcfc425f1eab1` (fb42118; `ci/mstrike/BASE`). **Spec:** `ci/mwit/MWIT_SPEC.md` @ 88bf69d §C:capability-c22, read whole with its ledger and `ci/mwit/plant_day.mjs`. **Work tip judged here:** `b4e613b462a9b609957e570d31950b691148dc90` (witness + mutants); this proof's own commit is judged by its own push (named in the seat's final message).

**Named files (all new):** `ci/witness/mstrike/witness_strike.mjs` · `ci/mstrike/BASE` · `ci/mstrike/PROOF.md` · `ci/mstrike/LEDGER.jsonl` · `ci/mstrike/run_mutants_mstrike.mjs`. No organ file, no suite file, no `package.json`, no `.claude/settings.json` is touched (ci-only unit, row 1162 (2)/(4)).

## Step 1 · measured at the base (file:line at fb42118; no state content read or printed)
- The strike: `scripts/learnstate.mjs` askedFirst `:710-731`; the brief row `{…, asked_first}` is built by briefRowOf `:761-788` (an `asked_first.strike` only if the printed text carried it, `:775-777`); learnstate is the SOLE WRITER of brief_log.jsonl (header `:16-21`, recordBrief `:794`).
- The real day: `scripts/day.mjs` dayProof `:204-213` (takes `reviews` as an argument); the review row carries opened_at and host_session_id (`scripts/sitting.mjs:1062`, sole writer `:20`).
- The transcript path: `scripts/study_scope.mjs` transcriptPathFor `:99-102`; human rows humanText `:638`. study_scope has **no assistant-turn reader**. The organ that parses teacher turns is `scripts/teaching_gate.mjs` parseTranscript `:327` / turnsOf `:357` (`firstTurn` `:376-377`), and it uses study_scope's humanText. Divergence from the spec (b), which says "study_scope.mjs's own turn reader": the witness uses teaching_gate's parser (measured: it imports cleanly from a copied scripts/ tree with no state).
- The receipt organ: `scripts/rung_receipt.mjs` parseWitness `:224`; red refuses an exit 0 `:306`; door ARSENAL_RUNG_STATE_DIR, honoured only under os.tmpdir() (header F5).
- Bound for every spawn: `.github/workflows/suite.yml:62` timeout-minutes, read from the tree (the ms1 pattern).
- land.mjs readsOf `:272`: a witness declares `// READS:` header lines.

## The witness (19 Nov 2026, each by command, last line verbatim)

Trees are git clones made with `core.autocrlf=false` (LF), base at fb42118 and build at b4e613b, under the session scratchpad.

```
node ci/witness/mstrike/witness_strike.mjs --org <build> --base-org <base>   → exit 0
GREEN MSTRIKE the asked-first strike is read, and read first · 1 clause(s) (6 plant(s), BOUND, LAST)
node ci/witness/mstrike/witness_strike.mjs --org <base> --base-org <base>    → exit 1
RED MSTRIKE · C22 (C22.1, C22.2, C22.3, C22.4, C22.5, C22.6)
CRLF checkout (core.autocrlf=true, core.eol=crlf; the witness file itself CRLF) → exit 0
GREEN MSTRIKE the asked-first strike is read, and read first · 1 clause(s) (6 plant(s), BOUND, LAST)
```

The six plants: asked first → 0 · asked only in the third teacher turn → 1 · another question first → 1 · no strike briefed → 2 · rollover close (not a real day) → 2 · real day, transcript absent → 2. On the base, the reader is absent from `--org`, so every plant is RED.

**The reader on this cloud (row 1162 (5)):** `node ci/witness/mstrike/witness_strike.mjs --day 2026-11-19` → exit 2,
`UNREAD MSTRIKE · C22 day 2026-11-19 · sitting_reviews.jsonl unreadable`. The real day, its sitting and its transcript exist only on his laptop, so the cloud reads UNREAD and never green.

**Red before, through the receipt organ** (its F5 door `ARSENAL_RUNG_STATE_DIR` pointing at a `mktemp -d` dir, in the build clone; the live ledger is never opened):
```
rung_receipt: red C:capability-c22 · exit 2 · out b7c0c8be2d19 · head b4e613b462a9 · last: UNREAD MSTRIKE · C22 day 2026-11-19 · sitting_reviews.jsonl unreadable
rung_receipt: verify · 1 row(s) · chain holds
```
The live red row is his laptop's to record: the same `red` command without the door, at a HEAD that carries the witness.

**READS list (land.mjs CR4):** `node scripts/land.mjs reads-probe ci/witness/mstrike/witness_strike.mjs -- --day 2026-11-19` → `VALID LIST · 2 repo path(s) opened, all declared`.

## Mutants

```
node ci/mstrike/run_mutants_mstrike.mjs --org <build> --base-org <base>   → exit 0
  KILLED M1 C22 asked anywhere in the sitting · exit 1 · RED MSTRIKE · C22 (C22.2)
  KILLED M2 C22 another question may come first · exit 1 · RED MSTRIKE · C22 (C22.3)
  control · exit 0 · GREEN MSTRIKE the asked-first strike is read, and read first · 1 clause(s) (6 plant(s), BOUND, LAST)
run_mutants: 2 of 2 mutant(s) RED by the clause that names them · control GREEN
```
M1 is the spec's (d). M2 guards the "before any other question" reading.

## Selftests and members touched

None: no organ and no suite member is edited, so there is no selftest or member line to compare before and after. The suite measurement, `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 19 Nov 2026, last line, exit 2 on both trees:
```
base  fb42118: organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
build b4e613b: organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
```
Both trees fail the same three: the coverage law (orphaned deck_lint, home_pin, probe, study_scope), the sandbox selftest, and the hermetic-members roll-up. All three are base reds this unit does not touch.

`node scripts/models.mjs check` → exit 0 (`literal model names outside models.mjs: 0`).

## The law pack counts (row 1130 (2)) — `node scripts/lawpack.mjs gate`, LF clones, `npm ci` node_modules, 19 Nov 2026

```
base  fb42118: findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
build b4e613b: findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
```
Every count is equal, so the build raises none. The gate exits 1 on both trees (`lawpack: 2 RED`): jugad-literal-subject-list stands at 93 against a baseline of 90, and depcruise_errors at 13 against 7. Both are base reds; this unit adds none.

## FORKS
- **F-A · the turn reader.** Spec (b) says "study_scope.mjs's own turn reader". study_scope exports only human-row readers (humanText `:638`, firstHumanPrompt `:148`) and has no teacher-turn reader. The witness reads teacher turns through `teaching_gate.mjs` parseTranscript `:327` / turnsOf `.firstTurn` `:376-377`, which rides study_scope's humanText, and names the transcript file by study_scope's transcriptPathFor `:99`.
- **F-B · "asked first, before any new idea".** Read here as: the strike's quoted trap appears in the reply to the host session's FIRST prompt, before that reply's first question mark. Residual: if the host session held prompts before /learn bound it, that first reply is what gets judged, which is the stricter reading. "New idea" itself is not read; text before the strike, such as "you are here", is allowed.
- **F-C · which brief's strike.** It is the latest `brief_log.jsonl` row of day D carrying `asked_first.strike` and stamped at or before the host transcript's first prompt (rows carry no session id).
- **F-D · ms1's member** judges `ci/<unit>/witness_<unit>.mjs` against `ci/<unit>/BASE`. This unit's witness sits at `ci/witness/mstrike/witness_strike.mjs` per its UNITS row, so ms1 would not find it as things stand. Not resolved here: no file outside the named ones is written.
- **F-E · plants mode for unit mmeter's one member** (row 1162 (2)). The witness's plants mode is `--org <tree> --base-org <tree>`, as in land.mjs step 8. ~~A bare run with no args prints usage and exits 2 (UNREAD), so a member that walks ci/witness must pass the two trees.~~ RESOLVED 21 Nov 2026: `witness_strike.mjs plants [--org <tree>]` is the suite's mode. It prints `CLAUSE C22 GREEN|RED · k/n plant(s)` and ends `PLANTS mstrike · k of n plant(s) as expected`, which main's clause-witness member reads. BOUND is skipped in that mode only, because the mode has no second tree to compare against.
- **F-F · BOUND on a live checkout.** On a working tree, BOUND reads every file, including a state file a hook appended to. Run against clean trees (the member's clones, or `git archive`) it is exact.
- **F-G · the effort receipt.** `campaign-2026-09/tools/effort_receipt.mjs` is not in this repo; its error is named in the seat's final message, and nothing is written under campaign-2026-09/.
