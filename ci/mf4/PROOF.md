# PROOF — unit mf4 · the F4 canary (forks rows 960 (3) / 1009 (2))

BASE = main `5767e21` (the parent of this branch's first commit, the seat key). NAMED FILE: `scripts/daily_green.mjs`.
Every row of evidence is one line of `ci/mf4/LEDGER.jsonl` (`ts, act, cmd, exit, last_line, out`); every full output is under
`ci/mf4/out/`, and every last line quoted here was read back from that file by `ci/mf4/step.mjs`. Temp paths in the kept
outputs are rewritten to `<scratch>`.

## 1 · MEASURE FIRST (each fact at BASE, file:line)

**How daily_green decides a study day today.**
- `scripts/daily_green.mjs:35-38`: the header's rule. A study day is a day that holds an open or closed sitting (`sitting.json` + the
  sitting organ's close rows in `sitting_reviews.jsonl`).
- `scripts/daily_green.mjs:123-140` `studyDay()`: it reads only `sitting.json` (the current sitting's `opened_at..closed_at` interval,
  or `opened_at..today` while open) and the `kind:"sitting_review"` rows of `sitting_reviews.jsonl` (`closed_at` on the day).
  Nothing else on disk is read.
- `scripts/daily_green.mjs:358` calls it. `:363` then reads clauses 1-5 as `N-A "not a study day"` whenever `!sd.study`.
  **So at BASE, a day with a learn session and no sitting registered reads N-A, which is the gap F4 names.**

**Where a sitting is registered (`sitting open`).**
- `scripts/sitting.mjs:14` is the SOLE WRITER of `dressing-room/state/sitting.json`.
- `scripts/sitting.mjs:674` `open()` builds the sitting, and `:473` `save()` writes it (`writeAtomic(F.sitting(), S)`).
- `scripts/sitting.mjs:92` is the reviews file path, and `:1036` `appendRow(F.reviews(), review)` adds the close row.
- `.claude/skills/learn/SKILL.md:33` is the learn boot's step 2: `node scripts/sitting.mjs open --surface code --no-spawn …`. That step
  is the registration a learn session can skip.

**What on disk marks a learn session for a day.**
- `scripts/exchanges.mjs:158` `sessionsNamedOn(day)` lists the Claude Code sessions the ARCHIVE names on that IST day (his
  `claude-code` rows in the `afferent` day file). The archive root is `scripts/archivist.mjs:87`: `$ARSENAL_ARCHIVE` or `~/CyborgArchive`.
- `scripts/study_scope.mjs:678` `studySessionsOfDay(day, { archiveSessions })`, source (c) at `:715-726`, judges each named session
  off its OWN transcript and keeps it only if `entrypointOfTranscript(tx) === "claude-desktop"` and `isLearnOpener(firstHumanPrompt(tx))`
  (`:724`). The transcript path is `:99` `transcriptPathFor`. The opener list is `:128-129` `learnTriggers()`, read from the learn
  skill's own frontmatter (`:140` `isLearnOpener`, `:148` `firstHumanPrompt`).
- `scripts/postmatch.mjs:658-660` already pairs the two the same way (`studySessionsOfDay(day, { archiveSessions: named.sessions })`).
  So a learn session is a session with source `"transcript"` in that result. The canary re-derives nothing.

## 2 · THE BUILD (`scripts/daily_green.mjs` only)
- New `learnDay()`. It is read ONLY when `studyDay()` says known and non-study. It calls `sessionsNamedOn` and then
  `studySessionsOfDay`, and keeps the sessions whose sources include `"transcript"`.
  - An absent archive day means no evidence, so the day reads as before.
  - An archive day file that exists but cannot be read is UNKNOWN: clauses 1-5 are RED `unreadable: learn evidence (…)`, and
    `study:null`.
  - When a fixture is passed, the live archive and the live home are never read.
- In `witness()`, a learn session on a no-sitting day sets `study:true` with `study_why "NO SITTING REGISTERED · …"`, and clauses 1-5
  read RED `NO SITTING: learn session <id8>`, never N-A. The red study day breaks the streak.
- A day with a sitting is never asked, so it reads as today. A day with neither reads as today.
- Selftest: **68 → 75**. Every old clause is kept and seven `MF4 …` clauses are added (canary, only-the-learn-session, sitting day as
  today, neither as today, streak, fail closed, privacy). The archive is written by archivist's own writer and the transcripts are
  planted at `transcriptPathFor`, all under `os.tmpdir()`.

## 3 · PROOF

**P1 · the witness both ways.** `ci/mf4/witness_mf4.mjs --org <LF git-archive tree> --base-org <BASE tree>`. The contract is in its
header, and it has 7 clauses: W1 CANARY · W2 SITTING · W3 NEITHER · W4 SELFTEST · W5 STREAK · W6 BOUND · W7 LAST.
- BUILD (`out/p1_witness_build.txt`, exit 0): `GREEN MF4 learn canary: no sitting + learn session RED, sitting and neither as today · 7 clause(s)`
- BASE (`out/p1_witness_base.txt`, exit 1): `RED MF4 · W1 CANARY · W5 STREAK · W4 SELFTEST`. These are exactly the three clauses the
  build feeds. W2/W3 are the as-today guards, W6/W7 are the bound and the last, and those four are GREEN on both sides by design.
- The final re-run on the final HEAD tree is in §4.

**P2 · selftests, BASE | BUILD (last lines).**
- `daily_green.mjs selftest`: `daily_green selftest: 68 passed, 0 failed` | `daily_green selftest: 75 passed, 0 failed`.
  This is the only file changed. Its count grows 68 → 75 because it is the file changed.
- `organism_test.mjs laws` (exit 2 on both sides): `organism_test: 113 passed, 2 failed · ruled 0 · UNRULED 2` |
  `organism_test: 113 passed, 2 failed · ruled 0 · UNRULED 2`.
  - The printed last line is `the burned strike is still being served as cold: fixture strike a?` on both sides.
  - The FAIL lines are byte-identical on both sides (A9 study_entry_points; LOAD ZERO BLOCK 2 coldness ratchet). Both are
    pre-existing at BASE and not touched here.

**P3 · mutants.** `ci/mf4/run_mutants.mjs` runs one mutant per witness clause, each with one exact edit, and each must be RED by the
clause that names it. Last line (`out/p3_run_mutants.txt`, exit 0): `run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN`.
- The W7 mutant spawns `claude --version` only. The fake `claude` is first on PATH and logged the spawn, and no live model was called.

**P4.** `node scripts/models.mjs check`, exit 0 on both sides: `models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)`.

**P5 · BASE | BUILD, no count rises.**
- `lawpack.mjs`: `lawpack: GREEN — no law's finding count rose, and every rule is on disk` on both sides. BASE was run in a local
  clone at 5767e21. A bare `git archive` tree has no `.git`, and there lawpack's NUL scan reads "INSTRUMENT DEAD"; that first try is
  kept as `out/base_lawpack.txt`'s predecessor row in the ledger.
- `gates.mjs types`: `… 14 organ(s) @ts-check'd (baseline 14, may only grow) · undefined-symbol family 0 (must be 0) · other checkJs diagnostics 296 (baseline 296, may only fall)` on both sides.
- `gates.mjs lint`: `… 344 error(s) · 2 warning(s) · no-empty 262 · no-unused-vars 82 · (directive) 2 (frozen: …)` on both sides.

**CI (a note).** `suite.yml` is red on every push of this branch:
- Runs 44267512611 (step 1), 44267946635 (step 2) and 44268332499 (step 3) are all `failure`, and later runs follow.
- The cause is `organism_test.mjs:573` `TypeError … reading 'search'` in `laws` on the Windows runner, followed by "npm test produced
  no headline line".
- main at BASE `5767e21` fails identically (run 44259017454), so this is pre-existing and of a different class. The BASE commit
  message names it too.
- The CI never reaches `daily_green` or this witness, so **the Windows run of the witness is NAMED as not exercised here**. The
  Windows-specific shapes are in place but unrun on Windows: the junction link, forward-slash path keys, the PowerShell process scan
  and `claude.cmd`.

## 4 · FINAL RE-RUN (the final HEAD tree)
See the LEDGER's last `P1 final` rows.

## 5 · FORKS
- **F-a (not a fix, a reach).** `scripts/organism_test.mjs:573` `writersOf` crashes on the Windows CI (`x.code[i]` undefined). It
  keeps `suite.yml` red on main and on this branch. It is outside the named file and not touched.
- **F-b (a scope note).** The canary reads source (c), the transcript, only. A day whose `teaching_audit.jsonl` carries `scope:"study"`
  rows (`study_scope.mjs:688-702`) with no sitting registered is not named by it. Such rows need a bound sitting to exist, so the
  case is not expected. Widening the canary to source (a) would be a separate ruling.
- **F-c (the receipt tool).** `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository. Its error is in the final message.

## 6 · LANDING ITEMS
- `scripts/daily_green.mjs`
- `ci/mf4/` (PROOF.md, LEDGER.jsonl, out/, witness_mf4.mjs, clock.mjs, run_mutants.mjs, step.mjs)
