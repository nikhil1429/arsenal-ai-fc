# mact — BUILD PROOF (cloud build seat, 19 Nov 2026)

Unit **mact** · forks rows 1138 / 1138 (2) · branch `claude/mact-build`, cut from `origin/main` **`a583afb`**
(`git fetch origin main && git checkout -b claude/mact-build FETCH_HEAD`, 19 Nov 2026 UTC; `ci/mact/BASE`).
Spec: `393f561:ci/mact/MACT_SPEC.md` (cut from `224f9b9`; `git diff --stat 224f9b9 a583afb -- scripts/acts.mjs scripts/claims.mjs` is empty,
so every spec line number holds at this base). Every line below was measured by a command on 19 Nov 2026; each has its row in `ci/mact/LEDGER.jsonl`.

No CHECKPOINT open.

## 0. What the ruling ordered, and what was built

Row 1138 (2): fate (b) with (a), F-1 (c) · F-2 (a) AND (c) · F-3 (b) · F-4 (b) to mlaw2 · F-5 (a).

| Ruling | Built (file:line at the build tip) |
|---|---|
| F-1 (b) + F-2 (a): the id gains a process-local sequence | `scripts/acts.mjs:75-76` — `let idSeq = 0;` and the mint `a<ms36><seq36><bucket2>` |
| F-1 (a): a red is named, never a throw | `scripts/acts.mjs` the three undo asserts (`undo(note)`, `undo(agenda)`, `undo(pref)`, base `:491/:497/:499`) read `calls[n]?.argv?.…` — the same condition otherwise |
| F-2 (c): undo, resolve and reroute REFUSE an id held by two rows, always | `scripts/acts.mjs:79-80` (`idHeldByTwo`, `ambiguous`); `undo` after its `no act` line; `resolveFailed` for the id AND the `--by` id; `rerouteFailed` for the id AND the `--by` id. A refusal calls no owner and appends no row. |
| F-3 (b): the same one-line repair at the claims mint | `scripts/claims.mjs:82-83` — `let claimSeq = 0;` and the mint `k<ms36><seq36><bucket2>` |
| F-4 (b) | not here: unit mlaw2 (row 1137 (4)). `acts` stays LIVE in the hermetic profile. |
| F-5 (a) | the mrf text is a record; nothing touched. |

The acts selftest gains ONE block of two asserts (after the reroute block, before `OWNERS`, so no earlier count moves): 32 acts on one
planted clock mint 32 distinct ids and a turn's six refused acts six; and the five ambiguous cases refuse with no owner called and no row.

**Where the spec and the ruling differ (the ruling wins):** the spec recommended F-2 (a) only and F-3 (a); the ruling took F-2 (a)+(c) and
F-3 (b), so the witness gains W5 (the two-row refusal) and W6 (the claims mint) beyond the spec's W1-W4, and mutants M5/M6. The spec's
W4 plant (only the mint put back) cannot test the guard once F-2 (c) is in: the undo refuses, `uN.ok && …` short-circuits and `calls[n]` is
never read — measured (19 Nov 2026): the first mutant run read `run_mutants: 5 of 6`, M4 (the `:497` guard removed) SURVIVED. W4 now plants
the base's BEHAVIOUR (the mint put back AND the two-row refusal switched off) and M4 removes the guard at the base's own crash line (`:499`).

## 1. The witness, both ways (by last line)

`node ci/mact/lftree.mjs <sha> <dir>` makes each LF tree (git archive, core.autocrlf=false, core.eol=lf, the commit's tracked files only).

| Tree | Command | Last line |
|---|---|---|
| base `a583afb` | `node ci/mact/witness_mact.mjs --org <base> --base-org <base>` | `RED MACT · W1, W2, W3, W4, W5, W6` (exit 1) |
| build `154fa03` (code tip; later commits touch only `ci/mact/`) | `node ci/mact/witness_mact.mjs --org <build> --base-org <base>` | `GREEN MACT an act or claim id is minted once per process and no verb acts on an id two rows hold · 8 clause(s)` (exit 0) |

The clause lines, base → build (19 Nov 2026):

| Clause | Base | Build |
|---|---|---|
| W1 planted clock, pinned random, 32 dispatch | 1 distinct id | 32 distinct |
| W2 live clock, 20000 turns of 6 refused acts | two EQUAL ids in 221 turns (262 and 233 in earlier runs; spec 224; theory 15/1296 of 20000 ≈ 231) | 0 |
| W3 every forced pair | control 56/0 · calls 32 · pairs 496 · **red 23 · crash 1** (the spec's numbers exactly) | control 58/0 · calls 70 · pairs 2415 · red 0 · crash 0 |
| W4 base behaviour + pair 0-2 | NO HEADLINE · stack YES | `acts selftest: 53 passed, 5 failed` · stack none (19 Nov 2026) |
| W5 an id held by two rows | refused 0 of 5 (undo and reroute each called an owner) | refused 5 of 5 · calls 0 · rows 0 · the one-row control still acts |
| W6 claims mint, 32 fileClaim | 1 distinct id | 32 distinct |
| BOUND | 0 files differ | 2 files differ: `scripts/acts.mjs`, `scripts/claims.mjs` |
| LAST | 0 survivors · shim 0 spawns | 0 survivors · shim 0 spawns |

**The pair preload had to be exact.** The first `pair_random.mjs` left the unforced draws truly random, and W3 on base read red 33 · crash 2:
the extra reds were the natural 1-in-1296 collisions on the other draws (pair `1,5` red once, green once, serially). Now call i returns bucket
i and only call k is forced onto j, so the sweep is a measurement, not a draw: red 23 · crash 1, twice.

## 2. The mutants

`node ci/mact/run_mutants_mact.mjs --org <build 154fa03> --base-org <base>` (19 Nov 2026):

| Mutant | Edit | Killed by |
|---|---|---|
| M1 | `(idSeq++)` → `(idSeq)` | W1 · 1 distinct |
| M2 | a validation-refused act mints the base shape (no sequence) | W2 · two equal ids in 229 turns |
| M3 | the sequence a local of the mint (resets every call) | W3 · red 562 of 2415 |
| M4 | `calls[10]?.argv?.join` → `calls[10].argv.join` (the base's crash line) | W4 · NO HEADLINE · stack YES |
| M5 | `idHeldByTwo`: `.length > 1` → `.length > 2` | W5 · refused 0 of 5 |
| M6 | `(claimSeq++)` → `(claimSeq)` | W6 · 1 distinct |

Last line: `run_mutants: 6 of 6 mutant(s) RED by the clause that names them · control GREEN` (exit 0).

## 3. Each touched selftest, before and after (headline, LF trees, ledgers pointed under the temp dir)

| Selftest | Base `a583afb` | Build |
|---|---|---|
| `node scripts/acts.mjs selftest` | `acts selftest: 56 passed, 0 failed` (19 Nov 2026, ×3) | `acts selftest: 58 passed, 0 failed` (19 Nov 2026) |
| `node scripts/claims.mjs selftest` | `✓ claims.mjs selftest — 24 passed, 0 failed` (19 Nov 2026) | `✓ claims.mjs selftest — 24 passed, 0 failed` (19 Nov 2026) |

## 4. The member lines, before and after

`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` in each LF tree (git init with core.autocrlf=false, `node_modules` from one
`npm ci --ignore-scripts`, ANTHROPIC_API_KEY and GITHUB_ACTIONS unset), 19 Nov 2026:

| Line | Base | Build |
|---|---|---|
| acts member | `LIVE selftest acts — not run in the hermetic profile: reads state/registry.json, state/captain.json` | the same |
| claims member | `ok   SUITE MEMBER · claims selftest exits 0` | the same |
| headline | `organism_test: 143 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` | the same (19 Nov 2026) |

The 3 reds are the same on both trees (19 Nov 2026): the coverage law, `SUITE MEMBER · sandbox`, and the hermetic-members roll-up — the tree
recipe the spec named in its §7 (not acts, not claims); the neutral machine reads every pushed code commit green (§7).

## 5. `node scripts/models.mjs check`

Build checkout: exit 0, `literal model names outside models.mjs: 0`. Base LF tree: exit 0 (19 Nov 2026).

## 6. The law pack counts (row 1130 (2))

`node scripts/lawpack.mjs gate` in each LF tree (19 Nov 2026):

- **BASE:** `lawpack · 1928 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 1`
- **BUILD:** `lawpack · 1928 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 1`

Every count equal. The first build draft read **1930** raw matches: two `const X = [ … ]` shapes in the new selftest block (raw
`jugad-literal-subject-list` hits, not findings). Removed at the cause — the block now counts into an object and holds its five results in a
named object — never by an ignore line. Both trees print the same 2 RED against the frozen baseline (`jugad-literal-subject-list ROSE — 93,
baseline 90` and `depcruise_errors ROSE — 13, baseline 7`): they are main's at `a583afb`, unchanged by this build.

## 7. The neutral machine (suite workflow, `curl -sS https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`)

| Push | Run | Check runs (node 22 · node 24) | Verdict |
|---|---|---|---|
| `f06b852` skeleton | — | — | superseded |
| `defecbd` witness | `44447398375` | `135302772444` · `135302772054` | cancelled · cancelled (superseded) |
| `8653fd6` code + mutants | `44447854002` | `135304340193` · `135304339694` | cancelled · cancelled (superseded) |
| `154fa03` code tip | `44448190208` | `135305453072` · `135305453408` | **success · success** |
| `8864da4` W4 replant | `44449439817` | `135309489003` · `135309488697` | **success · success** |
| later pushes | named in the final message | | |

## 8. The F-3 census — every id minted in that shape, and who looks it up by id (grep at the build tip)

`grep -rnE "getTime\(\)\.toString\(36\)|Date\.now\(\)\.toString\(36\)" --include=*.mjs .` and `grep -rn "1296" --include=*.mjs .`, 19 Nov 2026.

**The exact shape (`<prefix><ms base36><one of 1296 buckets>`, no sequence):**

| Mint | Repaired here? | A reader that looks it up by id |
|---|---|---|
| `scripts/acts.mjs:71` (base) | **yes** (F-2) | `undo` `:226`, `resolveFailed` `:250/:253`, `rerouteFailed` `:279/:289` (base lines) — now refuse two rows |
| `scripts/claims.mjs:82` (base) | **yes** (F-3) | **none**: no `.id ===` in `claims.mjs`; its importers (`turn_hook.mjs`, `sitting.mjs`, `study_scope.mjs`, `teaching_gate.mjs`) never read a claim's id; `freshReceipt` (`:121`) walks rows by `ok`/`ts`/`session` |
| `scripts/outbox.mjs:119` | no — FORK | `fold` `:157-161` keys a Map by `r.id` (a second post with the same id is DROPPED, `if (!by.has(r.id))`, and its deliver/ack lands on the first); `post` `:238`, deliver `:292/:297`, `ack` `:301-308` (CLI `ack <id>` `:677`) all `fold(...).get(id)` |
| `scripts/tasks.mjs:92` | no — FORK | `foldTasks` `:126-131` keys a Map by `r.id` (a second create OVERWRITES the first); `taskOf` `:144`, `:203`, `:211`, `:216` read `.get(id)` |
| `scripts/registry.mjs:749` (`rul-`, `Date.now()`) | no — FORK | `addRuling` → `upsertRow` `:471-480` keys on `subject || id` — a second ruling with an equal id would MERGE over the first ruling's row |

**Near shapes, named (not the 1296 shape):** `notes_compiler.mjs:126`, `notes_corrections.mjs:48`, `resume_pointer.mjs:58` (`<ms>-<randomBytes(3) hex>`,
1 in 16.7 M per pair in one ms) · `hooks/afferent-post.mjs:267` (`<ms>-<8 base36 random chars>`) · `sitting.mjs:189` (`ag<ms>`, **no random part at
all**: two agenda rows added in one ms share an id). The `.tmp` names in `course.mjs:538`, `capture.mjs:628`, `python_state.mjs:321` carry
`pid` + a sequence already; `capture.mjs:1109` is a file name; `acts.mjs:97` is a teaching-contract id default.

## 9. FORKS (beyond the named files: written, not edited)

- **F-A · `outbox.mjs:119` and `tasks.mjs:92` mint the 1296 shape and BOTH fold by id** (outbox drops a second post, tasks overwrites a
  first create). (a) leave · (b) the same one-line sequence in each, own unit, with W1/W6's plant per mint. Deciding measurement: the W6
  plant pointed at `post` / `create` (32 calls, one `now`, pinned random) → distinct ids.
- **F-B · `registry.mjs:749` `rul-` ids**: a collision would merge two of his rulings into one row (`upsertRow` keys on `subject || id`).
  (a) leave · (b) the sequence there too. Deciding measurement: two `addRuling` in one ms with pinned random → two rows in `rulings`.
- **F-C · `sitting.mjs:189` `ag<ms>` has no random part**: two agenda adds in one ms share an id (and `agenda drop <id>` would drop by it).
  (a) leave · (b) a sequence. Deciding measurement: two `agenda add` with one planted `now` → two ids.
- **F-D · the duplicate count in his acts ledger** is the runner's at the landing (row 1138 (2)), never this seat's: this seat read no
  `dressing-room/state` file.
- **F-E · the effort receipt** (`campaign-2026-09/tools/effort_receipt.mjs`) is not in this repository; its error is named in the final message.

## 10. NAMED, NOT GUESSED

- The Windows / node 24 rate: the neutral machine runs node 24 on Linux only; the witness is written CRLF-proof (every read folds `\r\n`,
  PowerShell for the process table, `.cmd` shims) but was RUN on Linux only (node v22.23.5, 4 CPUs), 19 Nov 2026.
- Whether an id already in his acts ledger is held by two rows: from this build, `undo`/`resolve`/`reroute` refuse such an id by name.
