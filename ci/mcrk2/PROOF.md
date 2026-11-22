# MCRK2 PROOF — the crack verb never loses his words; the miss falls on the teacher by name

Unit mcrk2, build seat (unit mcrk2b, forks rows 1243 / 1246 / 1258 / 1269). Written by a cloud build seat on 21 Nov 2026.
**Not a landing.** Nothing here moves main; nothing is merged into main; no PR is opened.

## 1. The base — PROVISIONAL (row 1269 (1) and (2))

- **Branch:** `claude/mcrk2-build`, cut from the mbank build tip with
  `git fetch origin claude/mbank-build && git checkout -b claude/mcrk2-build f635d68b1bce300b58aa031ed49278b8bbe3e5a8`.
- **`ci/mcrk2/BASE`** = `f635d68b1bce300b58aa031ed49278b8bbe3e5a8`. On 21 Nov 2026 `origin/claude/mbank-build` had **not** moved
  past it (its tip read `f635d68`), so no newer sha is named.
- mbank is adopted at that tip **only provisionally**, until its two legs read green. It is not on main. When a message
  names a re-cut mbank tip, or a main that carries mbank, this seat merges it (a merge commit, never a rebase or a force
  push), re-runs the unit witness at the merge and names the merge and its result here.
- **The spec** is `ci/mcrk2/MCRK2_SPEC.md` at `9a6beb4` (claude/mcrk2-spec), carried here byte-equal and left as it is.
  Its ledger rows are carried at the head of `ci/mcrk2/LEDGER.jsonl`.

## 2. The ruling as built (row 1258, forks F1 to F9)

| fork | ruled | built |
|---|---|---|
| F1 | A | `teaching_gate.mjs` reds **`C.crack-gap`** (mouth `count`) on that turn by name, and `teaching_audit.mjs` counts drift **`crack-gap`** in its own audit lane. No card is filed; no note is blocked |
| F2 | C | the verb reads his words only through mbank's reader **`readHisPrompt({ since, sessionId: CLAUDE_CODE_SESSION_ID, fresh: true })`**; a consumed record and another session's record both refuse |
| F3 | A | the gate knows the turn by `prompt_session_id === payload.session_id` plus a once-latch (`crack_gaps` on its own log row). No text join, no time join |
| F4 | B, F4-m yes | `notes_compiler.mjs settleCrackAxis`: a containing window of its session, else exactly one axis declared in its turn; ambiguity refuses; a moment logged with no axis gives an axis-none crack its moment |
| F5 | A | §7 below, once |
| F6 | A | `ci/witness/mcrk/witness_crack.mjs` K3 narrowed in place, citing row 1243; the inverted legs live in mcrk2 G2 / G3; nothing skipped |
| F7 | B | one sentence in `.claude/skills/forge/REFERENCE.md` (the `crack` paragraph) tells the teacher before the miss |
| F8 | A | `moment: "undeclared"`, `axis: "none"`, never null; plus `gap` and `gap_owner: "teacher"` |
| F9 | A | the gate red is study-scope only (out of scope the gate returns before it); outside scope the drift lane still counts it |

## 3. The changed files (the bound)

```
scripts/forge_session.mjs          crackRow (branch 4 first; axis "none"; moment "undeclared"; gap + gap_owner), the crack case
                                   (readHisPrompt with since, the calling session id, fresh), the verb print line (GAP), the
                                   header law line, the selftest crack block (two legs inverted by ruling, new legs added)
scripts/notes_compiler.mjs         pacerSessions, settleCrackAxis, compileDay (settle + unplaced named), buildNote (gap row is a
                                   crack; GAPS line), render (moment undeclared / axis settled label), header, selftest
scripts/teaching_gate.mjs          CHECKS C.crack-gap (count), RANK, decide() input `cracks`, stopHook read + log field
                                   crack_gaps, selftest
scripts/teaching_audit.mjs         crackGapDrift (pure) + its emitter before staging, CHECKED_RULES + RULE_NOTES + the oracle
                                   mirror, SEED_GAP declares crack-gap, selftest
.claude/skills/forge/REFERENCE.md  one sentence (F7 B)
ci/witness/mcrk/witness_crack.mjs  K3 narrowed (F6 A); its ENV drops CLAUDE_CODE_SESSION_ID (FORK mcrk2-F6w)
ci/witness/mcrk2/witness_crack_gap.mjs · ci/mcrk2/{BASE, witness_mcrk2.mjs, run_mutants_mcrk2.mjs, PROOF.md, LEDGER.jsonl,
MCRK2_SPEC.md (carried byte-equal)}
```

Never edited: `scripts/registry.mjs`, `scripts/teaching_contract.mjs`, `package.json`, `scripts/study_scope.mjs` and every
other mbank file, anything under `dressing-room/state`. The mbank reader is read through its export only.

## 4. The witness, both ways (21 Nov 2026)

The org and base trees are `git archive` copies under the seat's scratch dir (a working tree carries hook-written state files,
which BOUND would name).

```
$ node ci/mcrk2/witness_mcrk2.mjs --org <archive HEAD> --base-org <archive f635d68>     # exit 0
GREEN MCRK2 the crack verb writes his words with the moment named undeclared or the axis named none, refuses only when his words of this turn are not on disk (absent, stale, consumed, another session's), the gap reds on the teaching gate once and counts as drift, no card, no note blocked, the compiler settles its axis from the pacer ledger · 14 clause(s)

$ node ci/mcrk2/witness_mcrk2.mjs --org <archive f635d68> --base-org <archive f635d68>  # exit 1
RED MCRK2 · G2, G3, G3b, G4, G5, G6, G7, G8, G9, G10, G12, MCRK CARRY

$ node ci/witness/mcrk2/witness_crack_gap.mjs plants                                    # the suite's clause-witness walk, exit 0
PLANTS mcrk2 · 12 of 12 plant(s) as expected
```

Every clause of the clause witness is RED on the base for its own reason (G4 at base: (a)(b)(c) refused, **(d) consumed and
(e) another session's slot WRITTEN**; MCRK CARRY at base: K3 not narrowed). BOUND and LAST are seat-time clauses.

## 5. The mutants (21 Nov 2026)

```
$ node ci/mcrk2/run_mutants_mcrk2.mjs --org <archive HEAD> --base-org <archive f635d68>   # exit 0
run_mutants: 21 of 21 mutant(s) RED by the clause that names them · control GREEN
```

M1 gap on every row · M2 the no-moment refusal back · M3 the no-axis refusal back · M3b the axis check ahead of the prompt
check · M4d fresh dropped · M4e the calling session id dropped · M5 the crack case writes the session · M6a the gap red a
patch · M6b the once-latch dropped · M6c another session's gap reds · M7a the emitter dropped · M7b crack-gap undeclared ·
M7c the emitter files a card · M8 a gap group skipped · M8b GAPS silent · M9a an unsettled row placed by a guess · M9b
settling dropped · M10 readCracks drops gap rows · M10b the verb line silent · M12e a direct record read in the crack case ·
M-carry the seat's session id reaches the mcrk plants again. (M5 was first written as a bare `save(s)`, which rewrites the
same bytes and proved nothing; it now touches `updated_at`, a real session write.)

## 6. Every touched selftest and member, before (the cut f635d68) and after (this tip), by its headline line

```
                                             cut f635d68 (21 Nov 2026)                     tip (21 Nov 2026)
node scripts/forge_session.mjs selftest      forge_session selftest: 244 passed, 0 failed  forge_session selftest: 245 passed, 0 failed
node scripts/notes_compiler.mjs selftest     notes_compiler selftest: 48 passed, 0 failed  notes_compiler selftest: 51 passed, 0 failed
node scripts/teaching_gate.mjs selftest      teaching_gate selftest: 130 passed, 0 failed  teaching_gate selftest: 132 passed, 0 failed
node scripts/teaching_audit.mjs selftest     ALL CHECKS PASSED (153 passed, 0 failed)      ALL CHECKS PASSED (154 passed, 0 failed)
ci/witness/mcrk/witness_crack.mjs plants     PLANTS mcrk · 11 of 11 plant(s) as expected   PLANTS mcrk · 11 of 11 plant(s) as expected
ci/witness/mbank/witness_bank.mjs plants     (green at the cut: its member line ok)        PLANTS mbank · 19 of 19 plant(s) as expected
ci/witness/mcap/witness_capability.mjs       (green at the cut: its member line ok)        PLANTS mcap · 86 of 86 plant(s) as expected
ci/witness/mmeter/witness_meter.mjs          (green at the cut: its member line ok)        PLANTS mmeter · 18 of 18 plant(s) as expected
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
  cut  organism_test: 167 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)
  tip  organism_test: 168 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)
  (the only member lines that moved: + CLAUSE WITNESS · ci/witness/mcrk2/witness_crack_gap.mjs plants — ok;
   LOAD ZERO BLOCK 7 scans one more canon file — ok)
node scripts/models.mjs check                exit 0 · literal model names outside models.mjs: 0
```

The mcrk witness reads 11 plants without `--base-tree` (CODEC BOUND is a base-vs-build clause, said on its own line).

## 7. F5 A — the two lost cracks of 21 Nov, named once

**Two crack answers of 21 Nov 2026, 11:32 IST, are LOST.** The verb refused both (the first: no axis ON; the second, seven
seconds later: no moment declared on axis d), so no row was written, and the only door that holds his words, the prompt
record, is overwritten at every later prompt. Both misses were the teacher's, not his. Row 1258 F5 A grants no recovery door,
and none is built. The runner repeats the count at each day close until mcrk2 lands (row 1243 (5)).

## 8. Where the build differs from the spec (the ruling and the brief win), each named

1. **`words_src` stays `"teaching_audit_last.prompt"`** (spec §11.3 proposed `"study_scope.hisPrompt"`). mbank's clause B12,
   a member at this tip, asserts the old value.
2. **`crackRow` keeps its `auditLast` argument** and gains `prompt` (the door's result, what the verb passes) and `sessionId`;
   the spec's signature took `prompt` only. mbank's B12 and the selftest call the pure function with a record object; the same
   door (`hisPrompt` with since, sessionId, fresh) is applied inside.
3. **The env-absent refusal (spec §11.2, clause G12c) is NOT built — FORK mcrk2-F12** (ruled by row 1281 (2): no refusal,
   the organism's gap instead; §10). With no `CLAUDE_CODE_SESSION_ID` the
   verb passes `sessionId: null`, and mbank's `readHisPrompt` then reads the shared slot with `since` and `fresh` and no session
   check (mbank's own contract). Refusing there would turn the landed mcrk witness and every neutral-machine leg red (the
   neutral machine has no session id). The ruling's F2 C names "the calling session id", and with none there is nothing to
   compare. The architect may rule it stricter.
4. ~~**No seed row for `crack-gap` in `teaching_contract.mjs`** (never edited by this brief)~~ — FORK mcrk2-F13, **ruled by row
   1281 (3): the seed row is built (§10); the rest of this item is the record of 21 Nov.** The id is
   declared in `teaching_audit.mjs SEED_GAP`, the file's own declared-gap list, whose ratchet goes red the day the owner seeds
   it. Until then `autohit crack-gap` exits 1 on his laptop and the drift is counted in the audit lane's own log row
   (`teaching_audit.jsonl` drifts + staged). Spec G7's "the contract CLI lists crack-gap" leg is replaced by the SEED_GAP leg.
5. ~~**The pacer `status` suffix (spec §6, G10's status leg) is not built**: the brief names `forge_session.mjs` for crackRow
   and the verb print line. G10 holds readCracks and the print line instead.~~ **Built by row 1281 (6)** (§10).
6. **FORK mcrk2-F6w — one edit in `witness_crack.mjs` beyond K3.** Its `ENV` now deletes `CLAUDE_CODE_SESSION_ID`. Without it,
   on any seat or on his laptop (where Claude Code sets the variable) K1, K2, K3b, K4 and K7 go RED: the verb, now reading
   through the calling session's own record, rightly refuses a plant whose prompt record was written by `sess-witness`.
   Measured here: with the seat's id the narrowed witness read 6 of 11; with the variable absent 11 of 11.
7. **Spec G12 (interleave) at this base.** mbank already writes HIS words when his session has its own record; the defect
   left at f635d68 is the fallback to another session's shared slot when his own record is absent. That is G4 (e) here, RED
   at base. G12 holds the source check and the own-record leg.
8. **The gate's turn join.** In scope with an unreadable transcript, `decide` returns before any check (as it always has),
   so a gap row written on such a turn reds on the next readable Stop of that session, once (the latch). Named, not changed.
9. **Settling (F4 B) — the turn's end** is his next archived record of the same session (`prompt_session_id`, else the
   concept stamp) after `prompt_at`, read from the word lane for the days of the row; with none, `[prompt_at, row.at]`.
10. **Other units' mutant anchors.** At this tip mbank's `run_mutants_mbank.mjs` M17 anchor (`auditLast: ownC ? …`) no longer
    lands: that line is the one F2 C replaces by ruling (its behaviour is held by mcrk2 G4 (e) / G12, mutants M4e / M12e).
    The B12 and B13 anchors and mcrk's K7 anchor were kept landing (byte-equal lines). mcrk's M5 and M8 anchors already did
    not land at the base f635d68 (pre-existing, not this unit's).

## 9. OWED to the runner (his laptop only; never guessed here)

- Whether a sitting was bound to the 11:32 IST session (F9): `node scripts/sitting.mjs status`.
- Whether Claude Desktop sets `CLAUDE_CODE_SESSION_ID` for a Bash child (spec §10, F2-b; it decides how often FORK mcrk2-F12
  applies): `node -e "console.log(!!process.env.CLAUDE_CODE_SESSION_ID)"` in a Desktop study session (a boolean, never the value).
- How often moments are logged with `axis: null` (F4-m reach): over `forge_sessions.jsonl`, `moments_log[].axis === null`.
- That `node scripts/teaching_audit.mjs report` names `crack-gap` UNWIRED until the contract's owner seeds it (FORK mcrk2-F13).

## 10. FORKS — RULED by forks row 1281 (22 Nov 2026 IST, through runner M); the old text struck in place

- **mcrk2-F6w** — ~~`witness_crack.mjs`'s ENV drops `CLAUDE_CODE_SESSION_ID` (beyond F6 A's K3): forced, or the landed member reds wherever the variable is set.~~
  **RULED (1): accepted — a witness plants its own session and names it.** The mcrk2 clause witness now does the same: every
  pacer call runs as `sess-witness` with that session's own prompt record, unless a clause names another (G4 (e), G6, G7, G12)
  or none (G13).
- **mcrk2-F12** — ~~no refusal when the calling session id is absent (spec §11.2's G12c not built): the shared slot with since + fresh, as mbank's reader does.~~
  **RULED (2): no refusal; his words are kept. BUILT:** a crack written with no calling session id carries gap
  `session-unchecked`, `gap_owner: "organism"` (joined `+` with a teacher gap: `teacher+organism`); `teaching_gate` counts
  `C.crack-unchecked` (count mouth, never a block, never the teacher's `C.crack-gap`); `teaching_audit`'s teacher drift counts
  only a teacher part. The pacer writes `calling_session_id_present` (a boolean only, never the id) at `start`, and at `resume`
  only when the session has none: once per forge session. Clause **G13**, mutant **M13** (a second, **M13b**, holds the
  boolean). **OWED:** the first Desktop sitting after landing is the measurement (read the boolean of that session); absent
  there returns as a fork.
- **mcrk2-F13** — ~~`crack-gap` has no seed row in `teaching_contract.mjs` (not this unit's file); declared in SEED_GAP; owed to the contract's owner.~~
  **RULED (3): mcrk2 gains `scripts/teaching_contract.mjs` for the ONE seed row. BUILT:** `r("crack-gap", …)` beside
  `uncaptured-rep`, and `crack-gap` left `teaching_audit.mjs SEED_GAP` in the same commit (3147a60); the contract selftest's
  seed-size pins move with the one row (the seed carries one more rule; the audit-id list names crack-gap). The spec's contract
  CLI leg returns in **G7** (`list` names it, `autohit crack-gap` exits 0 on an empty planted state); mutant **M7b** drops the
  seed row. The bound now names `scripts/teaching_contract.mjs`.
- **mcrk2-F14** — ~~mbank's mutant M17 anchor is replaced by ruling (F2 C); whoever re-cuts mbank or lands second re-anchors it (class of row 1253).~~
  **RULED (4): mcrk2 lands second, so it re-anchors mbank's M17 at its re-cut and gains `ci/mbank/run_mutants_mbank.mjs` for
  that anchor only (the class of row 1253). NOT DONE NOW — done at the re-cut (ruling (7)).**
- **mcrk2-F15** — ~~the gates' +1 checkJs diagnostic at this tip is mbank's `scripts/organism_test.mjs` LANE_ENV line (9074365), not an mcrk2 byte; for mbank's re-cut.~~
  **RULED (5): moot after the merge of a main carrying mbank.** Until then the gates report on this branch keeps reading that one
  mbank diagnostic (§14); this unit's five organs carry none.
- **mcrk2-F16** — ~~`ci/mcrk2/MERGED.json`, a file beyond the brief's list, on the ruled class of row 1200 (2), so BOUND can judge a build with main merged in.~~
  **RULED (5): accepted, the class of row 1200 (2).**
- **Spec §6 status suffix** (§8 item 5 above: ~~not built~~) — **RULED (6): built.** The close report's crack line, the pacer's
  one crack count, now names the gaps beside it: `(k with a named gap — the teacher's miss, or the organism's when the session
  id was unreadable; his words written all the same)`, only when k > 0. **G10** holds it; mutant **M10c**.
- **RULED (7):** re-cut above mbank after mjset and mdayq, by row 1279 (5). Main is NOT merged until the runner sends its sha.

## 6b. The neutral machine's `witnesses` member, emulated (21 Nov 2026)

Run on a clean local clone at the cut and at the tip, with the member's own flags
(`GITHUB_ACTIONS=true GITHUB_WORKSPACE=<clone> ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs witnesses`,
no session id). This container's repository is a shallow clone, so the units whose BASE commit it lacks read
"its BASE is in the clone" RED at the cut and at the tip alike; that is the container, not the tree. The diff of every
member line, cut to tip:

```
>   ok   WITNESS ‹mcrk2› · GREEN at head against its BASE
<   ok   WITNESSES · 51 unit(s) judged in 828.5 s (B5: the member's own seconds, measured every run)
>   ok   WITNESSES · 52 unit(s) judged in 804.4 s (B5: the member's own seconds, measured every run)
```

Every other unit's line (mbank, mcap, mcrk, mclk, mdet, mdtl2 and the rest whose BASE is here) is byte-equal: GREEN at head
against its BASE at both. The neutral machine's own check runs of the pushed tip are named in the ledger (act `ci-read`).

## 12. The neutral machine on the build tip 9384bee (read with curl, no token, 21 Nov 2026)

```
136880452049  hermetic twice · node 22   success    15:02:34Z → 15:12:08Z
136880452270  hermetic twice · node 24   success    15:16:27Z → 15:26:05Z
136880452939  npm test · node 24         success    15:19:08Z → 16:17:41Z  (head success · merge base success · the neutral verdict success)
136880452293  npm test · node 22         cancelled  15:17:05Z → 16:17:17Z  (head success · merge base CANCELLED by the job's timeout-minutes · verdict skipped)
```

The node 22 cancel is the job's own bound (suite.yml `timeout-minutes`) reached in the merge-base run, after the head run
read success. It is the class row 1269 (3) names (an unsplit leg that meets the bound) and it is **pre-existing at the base**:
on f635d68 itself both npm-test legs were cancelled at the bound (check runs 136855935336 node 22 and 136855935714 node 24,
each 60 min; its hermetic legs 136855935644 / 136855935651 success). No retry was run (refused in advance).

## 13. THE MERGE OF MAIN a0645d2 (runner M, forks rows 1272 (5) / 1273 (1), 22 Nov 2026 IST)

- `git fetch origin main` (a0645d2: mshard + mgat landed), then a merge commit, no rebase, no force push. Still stacked on the
  provisional mbank f635d68. **No conflict.** Main touched none of this unit's named files (`git diff 7bf008b a0645d2` over
  them is empty); the only file both sides carry is `scripts/organism_test.mjs` (mbank's bytes + mshard's), merged by git.
- **BOUND after the merge:** `ci/mcrk2/MERGED.json` (new, the class of row 1200 (2), `ci/mgat/MERGED.json`) lists every file
  outside the named set with the LF sha256 of git's own three-way merge of BASE and main (`git merge-tree --write-tree
  f635d68 a0645d2`), each checked equal to the tip's blob. BOUND accepts a file outside the named set only when listed with
  those bytes; a stray byte reads `RED MCRK2 · BOUND` (checked). The clauses stay against BASE f635d68.

```
at the merge (22 Nov 2026)
node ci/mcrk2/witness_mcrk2.mjs --org <archive tip> --base-org <archive f635d68>    GREEN MCRK2 … · 14 clause(s)   (BOUND · 51 file(s) differ · the merge's bytes (MERGED.json a0645d2) 37 · outside the named files 0)
node ci/mcrk2/witness_mcrk2.mjs --org <archive f635d68> --base-org <same>          RED MCRK2 · G2, G3, G3b, G4, G5, G6, G7, G8, G9, G10, G12, MCRK CARRY
node ci/mcrk2/run_mutants_mcrk2.mjs                                                 run_mutants: 21 of 21 mutant(s) RED by the clause that names them · control GREEN
forge_session selftest: 245 passed, 0 failed · notes_compiler selftest: 51 passed, 0 failed · teaching_gate selftest: 132 passed, 0 failed
teaching_audit: ALL CHECKS PASSED (154 passed, 0 failed) · witness_crack: PLANTS mcrk · 11 of 11 · models check exit 0
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
  organism_test: 168 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 125 (hermetic: named, not run)   — the one red is GATES (below)
node scripts/gates.mjs report   (tip)
  gates types  · … · other checkJs diagnostics 297 (baseline 296, may only fall)
  gates lint   · 344 error(s) · 2 warning(s) · no-empty 262 · no-unused-vars 82 · (directive) 2 (frozen: no-empty 262 · no-unused-vars 82 · warnings 2)
  gates: 1 RED — a gate may only get stricter (§10-D rule 6)
node scripts/gates.mjs report   (git's merge of BASE f635d68 and main a0645d2, WITHOUT any mcrk2 byte: tree 4e81424)
  other checkJs diagnostics 297 · lint identical — the same RED
```

**The +1 checkJs diagnostic is not this unit's bytes — FORK mcrk2-F15.** tsc names it in `scripts/organism_test.mjs`
(`Property 'ARSENAL_ORGAN' does not exist on type '{ CLAUDE_CODE_SESSION_ID … }'`, the `LANE_ENV` line), which `git blame`
gives to mbank's commit 9074365 (forks row 1265, mbank-10 a), inside the provisional base. The file is not one of mcrk2's
named files, so it is named and not edited; no baseline is raised and nothing is ignored. This unit's four organs add 0
diagnostics (tsc main a0645d2 → tip differ by that one mbank line only) and no lint count rises.

## 14. ROW 1281 BUILT (22 Nov 2026), on 8ec60e5's line (provisional mbank f635d68 + main a0645d2; main NOT re-merged)

```
node ci/mcrk2/witness_mcrk2.mjs --org <archive tip> --base-org <archive f635d68>    GREEN MCRK2 … · 15 clause(s)   (BOUND · 52 file(s) differ · the merge's bytes (MERGED.json a0645d2) 37 · outside the named files 0)
node ci/mcrk2/witness_mcrk2.mjs --org <archive f635d68> --base-org <same>          RED MCRK2 · G2, G3, G3b, G4, G5, G6, G7, G8, G9, G10, G13, G12, MCRK CARRY
node ci/mcrk2/run_mutants_mcrk2.mjs                                                 run_mutants: 24 of 24 mutant(s) RED by the clause that names them · control GREEN
node scripts/forge_session.mjs selftest      forge_session selftest: 246 passed, 0 failed
node scripts/notes_compiler.mjs selftest     notes_compiler selftest: 51 passed, 0 failed
node scripts/teaching_gate.mjs selftest      teaching_gate selftest: 133 passed, 0 failed
node scripts/teaching_audit.mjs selftest     ALL CHECKS PASSED (154 passed, 0 failed)
node scripts/teaching_contract.mjs selftest  cut: teaching_contract selftest: 118 passed, 0 failed · tip: teaching_contract selftest: 118 passed, 0 failed
node ci/witness/mcrk/witness_crack.mjs plants   PLANTS mcrk · 11 of 11 plant(s) as expected
node scripts/models.mjs check                exit 0
node scripts/gates.mjs report                gates: 1 RED — a gate may only get stricter (§10-D rule 6)   (297 vs 296: mbank's organism_test.mjs line, as at 4b17f89; this unit's five organs 0 diagnostics; lint at its frozen counts)
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all   organism_test: 168 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 125 (hermetic: named, not run) — the one red is GATES (the mbank line), as at 4b17f89
```

## 11. CHECKPOINT

CHECKPOINT · ROW 1281 BUILT at 2026-11-22 (IST) · (2) G13/M13, (3) seed row + G7 CLI leg/M7b, (6) close suffix G10/M10c · witness
GREEN both ways, 24 of 24 mutants RED, control GREEN · resume from: the runner's main sha (after mbank lands and mjset + mdayq
re-cut) → re-cut above it by row 1279 (5), re-anchor mbank's M17 there (row 1281 (4)), regenerate MERGED.json, re-run witness
and mutants, name it here
