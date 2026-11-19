# mid — SPEC (cloud spec seat, 19 Nov 2026)

Unit **mid** · forks row 1148 (2): *"Proof forks F-A, F-B, F-C are one class, fate (b) for all, none left: unit mid named, spec first, one
seat now."* Branch `claude/mid-spec`, cut from `origin/main` **`4b00cf5`** (`git fetch origin main && git checkout -b claude/mid-spec
FETCH_HEAD`, 19 Nov 2026 UTC). Every fact below was measured by a command on 19 Nov 2026; each has its row in `ci/mid/LEDGER.jsonl`.
This seat builds nothing: the two `.mjs` files under `ci/mid/` are the spec's MEASUREMENTS (plants under `os.tmpdir()`), not organs.

No CHECKPOINT open.

**THE TREE MEASURED.** Main does NOT hold mact: `git merge-base --is-ancestor 018592e origin/main` exits 1 (19 Nov 2026). Every file:line
below is at **main `4b00cf5`**. `git diff --stat a583afb 4b00cf5 -- scripts/acts.mjs scripts/claims.mjs scripts/outbox.mjs scripts/tasks.mjs
scripts/registry.mjs scripts/sitting.mjs` is EMPTY, so mact's base line numbers hold here for those six files. Where a plant was also run on
mact's tip (`018592e`, an LF tree made by `ci/mact/lftree.mjs` read out with `git show 018592e:ci/mact/lftree.mjs`), it says so.

**HEADLINE.** The same harm class sits in **six** mints and **eleven** by-id readers, not the four mact's census named; every reader in it
does one of four wrong things with two rows (acts on the first · drops the second · overwrites the first · merges/closes both). mact's
process-local sequence closes the ONE-process case for acts and claims only, and **measured, it leaves the two-process case open**: two
children on one clock mint the SAME act id and the SAME claim id on mact's own tip. A **process identity beside the sequence** closes it
(measured: differ). Proposal: **ONE shared pure mint** `scripts/mint.mjs` (`<prefix><ms36><pid36 fixed 7><seq36><bucket2>`) used by all six
mints, plus the mact two-row REFUSAL extended to every reader that acts on one id (outbox, tasks, sitting agenda, registry rulings).

---

## Q1 · Every mint in the census and the near shapes (re-derived at `4b00cf5`)

Commands (19 Nov 2026), last lines in the ledger:

```
grep -rnE "toString\(36\)" --include=*.mjs --include=*.js . | grep -v node_modules | grep -v "^./ci/"
grep -rnE "randomUUID|randomBytes\(|Math\.random\(\)" --include=*.mjs scripts hooks tools | grep -v "toString(36)"
grep -rnE "id\s*[:=]\s*\`[^\`]*\\\$\{(Date\.now\(\)|now\.getTime\(\)|Date\.parse|now\b|ts\b|nowMs|stamp)" --include=*.mjs scripts hooks
grep -rnE "(_id|Id|\bid)\s*[:=]\s*\`[^\`]*\\\$\{" --include=*.mjs scripts hooks | grep -iE "now|date|time|ts|random|hex|seq|stamp"
```

### 1-A · THE CLASS — `<prefix><ms base36><one of 1296 buckets>` (or less), a reader acts by the id

| # | Mint (file:line at `4b00cf5`) | Shape | Per pair, one ms | Owner of the ledger (script header) |
|---|---|---|---|---|
| 1 | `scripts/acts.mjs:71` | `a<ms36><bucket2>` | 1 in 1296 | acts.mjs (`acts.jsonl`) — mact repairs it (seq) |
| 2 | `scripts/claims.mjs:82` | `k<ms36><bucket2>` | 1 in 1296 | claims.mjs (`claims.jsonl`) — mact repairs it (seq) |
| 3 | `scripts/outbox.mjs:119` (called `:235`) | `o<ms36><bucket2>` | 1 in 1296 | `outbox.mjs:4` SOLE WRITER of `outbox.jsonl` |
| 4 | `scripts/tasks.mjs:92` (called `:200`) | `t<ms36><bucket2>` | 1 in 1296 | `tasks.mjs:4` SOLE WRITER of `tasks.jsonl` |
| 5 | `scripts/registry.mjs:749` | `rul-<Date.now() 36><bucket2>` — the clock is `Date.now()`, NOT the `at` argument | 1 in 1296 | `registry.mjs:4` SOLE WRITER of `registry.json` |
| 6 | `scripts/sitting.mjs:189` | `ag<ms36>` — **no random part** | **certain** | `sitting.mjs:175-178` the agenda is this organ's sole write (`sitting_agenda.jsonl`) |

### 1-B · NEAR SHAPES — named, each with what makes it near

| Mint | Shape | Per pair | Its by-id reader |
|---|---|---|---|
| `scripts/notes_compiler.mjs:126` (`n-`, `g-`) | `<p>-<ms36>-<randomBytes(3) hex>` | 1 in 2^24 per ms | `noteState` `:153-160` (supersedes Set, `lastGate` by `of`) |
| `scripts/notes_corrections.mjs:48` (`c-`) | same | 1 in 2^24 per ms | `active` `:69-73` (supersedes Set), `add --supersedes` `:120` |
| `scripts/resume_pointer.mjs:58` (`p-`, `c-`) | same | 1 in 2^24 per ms | `pointerState` `:80-86` (`consumed.of === newest.id`) |
| `scripts/learnstate.mjs:798` (`b-`) | same, `now` a ms number | 1 in 2^24 per ms | none found (`grep -n "b-" scripts/learnstate.mjs`: selftest only) |
| `hooks/afferent-post.mjs:267` (`event_id`) | `<ms36>-<Math.random base36, up to 8 chars>` | ~1 in 36^8 per ms | `scripts/thalamus.mjs:782` DROPS a seen `event_id` as a duplicate |
| `scripts/sitting.mjs:198` (`sit_`) | `sit_<IST day>_<HHMM>_<randomBytes(2) hex>` | 1 in 65536 per **minute** | one open sitting at a time (a second open JOINS, `sitting.mjs` selftest "ONE OPEN SITTING") |
| `scripts/cortex.mjs:890` | `sit_<ms>` conversation id | certain per ms | one cortex session file (overwrite by design) |
| `scripts/gaffer_brain.mjs:1364` · `scripts/thalamus.mjs:870` | `<type>:<ref>:<iso>` · `m_<ms>_<hash32>` | equal ⇔ equal input in one ms | dedupe BY DESIGN — an equal id is the same moment, not a collision |
| `scripts/acts.mjs:88` (verb `rule` default) | `act-<Date.now() 36>` | certain per ms | `scripts/teaching_contract.mjs:335` REFUSES a second rule with one id — the right behaviour already |
| `scripts/captains_call.mjs:443…1893` | `c${s.next_id++}` — a counter in the state file, saved by tmp+rename `:110-111`, no lock | — | not a duplicate id: two processes racing LOSE a whole card (last rename wins). Out of class — FORK F-6 |
| `.tmp` names `course.mjs:538`, `capture.mjs:628`, `python_state.mjs:321` | pid + `++tmpSeq` + ms | — | already carry process identity + a sequence: **the shape this spec proposes**, in the organism already |

### 1-C · Every difference from mact's census (`018592e:ci/mact/PROOF.md` §8)

1. **NEW** `scripts/learnstate.mjs:798` `b-<ms36>-<hex6>` — absent from mact's census (its grep keyed on `getTime()`/`Date.now()` before
   `.toString(36)`; this one is `now.toString(36)` on a number).
2. **NEW** `scripts/sitting.mjs:198` `sit_…_<hex4>` (65536 per minute) and `scripts/cortex.mjs:890` `sit_<ms>` — absent.
3. **NEW** `scripts/gaffer_brain.mjs:1364`, `scripts/thalamus.mjs:870`, `scripts/captains_call.mjs` `c<next_id++>` — absent (named here as out
   of class, with why).
4. **READER NAMED** for `hooks/afferent-post.mjs:267`: `thalamus.mjs:782` drops a duplicate `event_id` (mact named the mint, no reader).
5. **SECOND READER** of the `rul-` id: `registry.mjs:756` files the card with `--key ruling:<id>`, and `captains_call.mjs:1490` (`fileGuard`)
   files NOTHING for a key ever seen — a second ruling with an equal id loses its card as well as its row.
6. **CROSS-ORGAN READERS** of the agenda and task ids: `outbox.mjs:191-195` `CLOSERS` turn a `close_ref` `agenda:<id>` / `task:<id>` into
   `sitting.mjs agenda done <id>` / `tasks.mjs finish <id>` — the relay closes BY ID in another organ.
7. **claims "importers"**: mact wrote that `turn_hook.mjs`, `sitting.mjs`, `study_scope.mjs`, `teaching_gate.mjs` import claims.mjs. Measured:
   `grep -rnE "claims\.mjs" --include=*.mjs scripts hooks | grep -v ^scripts/claims` finds only comments and a hook-order assert
   (`turn_hook.mjs:548`); NO organ imports it. The conclusion stands (no reader of a claim id); the word "importers" does not.
8. **Line numbers**: mact's `outbox.mjs:157-161`, `tasks.mjs:126-131`, `registry.mjs:471-480` hold at `4b00cf5` (the diff above is empty).

---

## Q2 · What each reader does with two rows TODAY, and what it should do

**The plant.** `node ci/mid/plant_mid.mjs [--org <tree>]` drives every organ's OWN mint twice on one clock with `Math.random` pinned to 0
(the 1-in-1296 draw made certain), every ledger a temp file under `os.tmpdir()` through the organ's own env door (`ARSENAL_OUTBOX_LEDGER`,
`ARSENAL_TASKS_LEDGER`, `ARSENAL_REGISTRY` = a COPY of the tree's tracked registry, `ARSENAL_SITTING_STATE_DIR`) or its `path`/`deps`
argument; owners are stubbed (no spawn), no port bound (`ARSENAL_SITTING_PORT` planted, `sitting.mjs` main never runs), no model call.
The near-shape readers (7-9) are planted by rows, since a 1-in-2^24 draw is not forced through the mint.

Last line, **main `4b00cf5`** (19 Nov 2026):
`PLANT_MID · 9 readers · 0 error(s) · acts.undo=ACTS-ON-FIRST · claims.mint=SHARED-ID · outbox.fold=DROP-SECOND · tasks.fold=OVERWRITE-FIRST · registry.addRuling=MERGE-SECOND-OVER-FIRST · sitting.agenda=DROP-ONE-CLOSES-BOTH · resume_pointer.state=DROP-NEW (read as consumed) · notes_compiler.noteState=SUPERSEDE-ONE-RETIRES-BOTH · notes_corrections.active=SUPERSEDE-ONE-RETIRES-BOTH`

Last line, **mact tip `018592e`** (19 Nov 2026): the same, except `acts.undo=IDS-DIFFER · claims.mint=IDS-DIFFER` (its sequence; one process).

| Reader (file:line) | Two rows, one id — TODAY (planted) | What it should do |
|---|---|---|
| acts `undo` `:226`, `resolveFailed` `:250/:253`, `rerouteFailed` `:279/:289` | **ACTS ON THE FIRST**: `undo(<shared id>)` called `hippocampus.mjs forget m1` — the first act's owner — when the two rows were a `note` and a `pref` | REFUSE (mact F-2 (c), built on its tip) |
| claims — none | the ids are equal (`kmwn551c000` twice) but no organ looks a claim up by id (`claims.mjs:280/281/289` only print it; `freshReceipt` `:121` walks `ok`/`ts`/`session`) | nothing to refuse; the mint alone |
| outbox `fold` `:157-161` (+ `ack` `:301-308`, `undeliver` `:288-297`, `post` dup `:233`, CLI `ack <id>`) | **DROPS THE SECOND**: 2 post rows → fold size 1, kept subject ONE; `ack(<id>)` meant for TWO acked ONE; TWO is never delivered, and because `post`'s dup check (`:233`) reads the fold, a re-post of TWO is not seen as on the road | the mint never repeats; on a legacy pair: `ack`/`undeliver`/a deliver REFUSE an id two post rows hold (named, no row), and `stats`/`findings` name the pair |
| tasks `foldTasks` `:126-131` (+ `taskOf` `:144`, `transition` `:211`, `execTask` `:225`, CLI `claim|finish|status <id>`) | **OVERWRITES THE FIRST**: 3 create rows (2 planted + the re-ask) → fold size 1, kept subject `planted_job_two`; re-asking the FIRST job is **not a replay** (`reask_first_replays: false`) — the first ask runs twice, the 18 Aug double-spend this organ exists to stop (`tasks.mjs:317`) | the mint never repeats; on a legacy pair: `claim`/`finish`/`fail`/`progress` REFUSE an id two creates hold; the fold names it |
| registry `addRuling` `:749-750` → `upsertRow` `:478-480` keyed `subject \|\| id` | **MERGES THE SECOND OVER THE FIRST**: both calls `ok:true`, ONE `rulings` row, text `planted ruling TWO` — his first ruling's words are gone from the table; its card (`--key ruling:<id>`, `:756`) is refused as already filed (`captains_call.mjs:1490`) | `addRuling` never upserts over an existing ruling: a ruling row is append-only, so an id already in `rulings` is re-minted once, else refused |
| sitting agenda `openAgenda` `:180-182`, CLI `drop` `:1487`, `done` `:1495`, outbox closer `agenda:<id>` | **ONE DROP CLOSES BOTH**: two asks, ids `agmwn551c0` twice; open 2 → after dropping ONE, open 0 — his second ask vanishes unserved | the mint never repeats; `drop`/`done` REFUSE an id two agenda rows hold |
| resume_pointer `pointerState` `:80-86` (near) | **DROPS THE NEW**: a NEW pointer sharing a consumed pointer's id reads as consumed — never served | via the shared mint (F-4) or leave |
| notes_compiler `noteState` `:153-160` (near) | **SUPERSEDING ONE RETIRES BOTH**; a cold gate `of` the id applies to both | via the shared mint (F-4) or leave |
| notes_corrections `active` `:69-73` (near) | **SUPERSEDING ONE RETIRES BOTH** | via the shared mint (F-4) or leave |
| thalamus `:782` (near, not planted: needs a live nucleus) | drops the second `event_id` as a duplicate (read off the code) | leave (36^8 per ms) — NAMED |

---

## Q3 · Does ONE shared mint carrying the process identity close the two-process case the sequence alone leaves open?

**Yes, measured.** `node ci/mid/two_proc_mid.mjs [--org <tree>]` spawns two node children; each mints one act (`acts.mjs dispatch`) and one
claim (`claims.mjs fileClaim`, temp ledger) through the organ's own mint on ONE planted clock with `Math.random` pinned, then computes the
proposed shape (as a model) on the same clock. 19 Nov 2026:

| Tree | Last line |
|---|---|
| main `4b00cf5` | `TWO_PROC · acts SAME · claims SAME · proposed differ` |
| mact tip `018592e` | `TWO_PROC · acts SAME · claims SAME · proposed differ` (children read `amwn551c0000` twice: seq 0 in each process) |

Why the sequence cannot: it is process-local, so every fresh process starts at 0 — two processes in one ms are back to the 1-in-1296
bucket. Two processes in one ms are the organism's normal life: the Stop hooks run in their own processes (`teaching_gate.mjs:15`), the
relay and the ticks are scheduled organs, and outbox/tasks' locks are STEPPED OVER when they cannot be taken (`outbox.mjs:140/:146`,
`tasks.mjs:161/:167`) or stolen after 5 s (`outbox.mjs` `withLock`), so the lock is not a guarantee either.

**The proposed mint** (one pure module, writes nothing): `mintId(prefix, now = new Date(), { pid = process.pid } = {})` →
`<prefix><ms36><pid36 padStart(7)><seq36><bucket2>`. Fixed widths read back whole: ms36 is 8 chars for this era, pid36 is 7 (36^7 > 2^32, the
Windows PID range), bucket 2, so seq is the rest. Among LIVE processes a pid is unique, so pid+seq is unique on one machine at one time; the
bucket stays as the belt for pid reuse inside one ms. An old id (10 chars after its prefix) can never equal a new one (≥ 18). The shape is
the one the organism already uses for its `.tmp` names (`course.mjs:538`, `capture.mjs:628`, `python_state.mjs:321`).

**What it does NOT close (NAMED):** two MACHINES writing one ledger. No cloud seat writes his state; whether any of his own devices do is
read on his laptop (NAMED NOT GUESSED).

---

## Q4 · Which ids are parsed back by shape

```
grep -rnE "parseInt\([^)]*36\)" --include=*.mjs scripts hooks           → (empty, 19 Nov 2026)
grep -rnE "/\^(a|t|o|k|ag|rul-|sit_|c-|n-|g-|p-|b-)" --include=*.mjs scripts hooks
```

**No organ reads the clock back out of an id.** What reads an id by its shape:

| Where | What it reads | Survives the proposed shape? |
|---|---|---|
| `scripts/outbox.mjs:198` `parseCloseRef` `/^([a-z]+):(.+)$/` | `agenda:<id>` · `task:<id>` — the id is opaque `.+` | yes (alphanumeric) |
| `scripts/organism_test.mjs:1102` `/^\s*(ag\S+)\s.*BLOCK 4 close ka test/m` | an agenda id off the screen | yes (`ag` kept, no space) |
| `scripts/organism_test.mjs:1045`, `scripts/tasks.mjs:314` `/^t/` | a task id's prefix | yes |
| mact's acts selftest `/^a[0-9a-z]+$/` (on `018592e`) | an act id's charset | yes |
| `scripts/resume_pointer.mjs:185/221` `/^p-/` `/^c-/` · `notes_corrections.mjs:145` `/^c-/` · `notes_compiler.mjs:746` `/^n-/` · `learnstate.mjs:2116` `/^b-/` | near-shape prefixes, selftests only | yes IF F-4 keeps the `<p>-` prefix |
| `scripts/teaching_contract.mjs:711` `a.id.slice("forge:".length)` | a session start ts out of a `forge:<iso>` anchor id | out of class (an anchor, not a mint) |
| `scripts/captains_call.mjs:558/604` `c.key.split(":")[2]` | a mission id out of a card key | out of class (mission ids) |

---

## THE CODE PATH (proposed)

**ONE shared mint + the two-row refusal at every reader that acts on one id.** Per-file repairs are the fork's option (b)/(c); the
measurement that decides is Q3's (`TWO_PROC` reads `SAME` for any mint without a process identity) and the law pack's jugad count (six
inline copies of one mint shape are six places to drift).

1. **NEW `scripts/mint.mjs`** — pure, writes no state, no import of any organ; `export function mintId(prefix, now, { pid } = {})` and
   `export function parseId(prefix, id)` → `{ ms, pid, seq, bucket }` (for the witness and any future reader); a `selftest` mode; joins ONE
   suite in `package.json` (the coverage law, `organism_test.mjs:292-316`).
2. **The six mints call it**: `acts.mjs:71` (replaces mact's `idSeq` if mact has landed), `claims.mjs:82` (replaces `claimSeq`),
   `outbox.mjs:119`, `tasks.mjs:92`, `registry.mjs:749` (and its clock becomes `at`, so a witness can plant it — F-5), `sitting.mjs:189`.
3. **The refusals** (mact's F-2 (c) pattern, one named line, no owner called, no row appended):
   outbox `ack`/`undeliver`/deliver on an id two post rows hold · tasks `transition` (`claim|progress|finish|fail`) on an id two creates hold
   · sitting `agenda drop|done` on an id two agenda rows hold · registry `addRuling` never `upsertRow`s over a `rulings` row with its id
   (re-mint once, else refuse). The folds name a pair (`ambiguous: n`) instead of dropping/overwriting silently.

Owners-only: every write stays in its own organ; `mint.mjs` writes nothing; no organ writes another's file.

## THE WITNESS (for the build seat; every plant under `os.tmpdir()`)

| Clause | Plant | RED on base (`4b00cf5`) | GREEN on the build |
|---|---|---|---|
| **W1 one process** | each of the six mints 32× on one clock, `Math.random` pinned | 1 distinct id per mint (measured by `plant_mid.mjs` for 2 calls) | 32 distinct per mint |
| **W2 two processes** | `two_proc_mid.mjs` shape: two children, one clock, pinned random, each of the six mints | `SAME` (measured for acts, claims) | `differ` for all six |
| **W3 read back** | `parseId` on a minted id with a planted short pid (`{pid: 7}`) and a planted seq; every Q4 regex run on a new id | no `mint.mjs` (RED by absence) | `{ms, pid, seq}` equal to the planted; every Q4 regex matches |
| **W4 outbox pair** | two post rows with one id (rows, as a legacy ledger) → `ack(id)` | `ack` lands on ONE (measured) | refused `ambiguous`, no row appended |
| **W5 tasks pair** | two create rows with one id → `claim(id)` / `finish(id)` | lands on the survivor (measured: overwrite) | refused `ambiguous`, no row |
| **W6 registry** | a registry file holding `rul-X`; `addRuling` with the mint injected to return `rul-X` | 1 row, the first ruling's text gone (measured: merge) | 2 rows (re-minted) or a named refusal; first text intact |
| **W7 agenda pair** | two agenda rows with one id → `agenda drop <id>` | both closed (measured: open 2 → 0) | refused `ambiguous`; open stays 2 |
| **W8 BOUND** | `git diff --name-only <base> <build>` | — | exactly the named files below |
| **LAST** | `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` in LF trees; `node scripts/lawpack.mjs gate`; `node scripts/models.mjs check` | base headline (below) | same reds only, the new `mint` member green; no law-pack count rises |

**Mutants, one per clause** (each must turn its clause RED, control GREEN):
M1 `(seq++)` → `(seq)` → W1 · M2 the pid part removed → W2 · M3 `padStart(7)` removed → W3 (planted pid 7 reads back wrong) · M4 the outbox
`ack` guard removed → W4 · M5 the tasks `transition` guard removed → W5 · M6 `addRuling`'s existing-id check removed → W6 · M7 the agenda
`drop` guard removed → W7 · M8 one organ (`sitting.mjs:189`) keeps its local mint → W1 (and W8 names the file unchanged).

**THE PORT CLASS (row 1053):** no clause binds a port, names a live service, POSTs at a daemon or restarts anything; `sitting.mjs` is
imported (its `main` guard, `sitting.mjs` last line, stays shut) with `ARSENAL_SITTING_PORT` and `ARSENAL_SITTING_STATE_DIR` planted under
the temp dir; every child wait is bounded by the spawn's own timeout.

**The suite at this base** (LF tree of `4b00cf5`, `git init` with `core.autocrlf=false`, `npm ci --ignore-scripts`, ANTHROPIC_API_KEY and
GITHUB_ACTIONS unset, 19 Nov 2026):
`organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)` — the 3 reds (19 Nov 2026) are the tree
recipe's, the same class mact's §4 named: the coverage law (`orphaned: deck_lint, home_pin, probe, study_scope`), `SUITE MEMBER · sandbox`,
and the hermetic-members roll-up. Of the touched organs (19 Nov 2026): `claims`, `registry`, `resume_pointer`, `notes_corrections` are
hermetic members (ok); `acts`, `outbox`, `tasks`, `sitting`, `notes_compiler` are LIVE (read `state/registry.json` / `state/captain.json`) —
named, not run in this profile.

---

## FORKS

- **F-1 · the code path.** (a) ONE shared mint `scripts/mint.mjs` with the process identity, used by all six · (b) mact's per-file
  sequence copied into outbox, tasks, registry, sitting · (c) per-file sequence + pid inlined in each of six files.
  **Recommend (a).** Decides: Q3 — (b) reads `TWO_PROC · … SAME` (measured on mact's tip); (c) closes it but six copies of one shape (the
  law pack's `jugad-literal-subject-list` / drift class) and a new file is the coverage-law cost of (a) only.
- **F-2 · the process identity.** (a) `process.pid` fixed 7 base36 · (b) pid + `process.hrtime` start · (c) a per-process random nonce at
  load. **Recommend (a)**: unique among live processes on one machine (a guarantee, not a draw); (c) is a draw again; (b) only adds length.
  Decides: W2 + whether any ledger is written from two machines (NAMED NOT GUESSED).
- **F-3 · legacy pairs at the readers.** (a) REFUSE by name (mact's F-2 (c)) in outbox, tasks, sitting agenda; registry re-mints/refuses ·
  (b) a finding only (stats), the verbs still act · (c) leave. **Recommend (a)** — the same ruling mact took for acts. Decides: W4-W7, and
  the duplicate count in his ledgers (NAMED NOT GUESSED).
- **F-4 · the near shapes** (`notes_compiler`, `notes_corrections`, `resume_pointer`, `learnstate` `b-`, `afferent-post` `event_id`,
  `sitting` `sit_`). (a) leave (1 in 2^24 per pair per ms; 36^8 for the event id; one open sitting) · (b) move them onto `mintId` keeping
  their `<p>-` prefix (every Q4 regex keeps matching). **Recommend (a)** for this unit, the plants recorded: the planted readers show the
  SAME harm (DROP-NEW, RETIRES-BOTH), so "one class, none left" may mean (b) — that is the architect's reading of row 1148 (2), not mine.
- **F-5 · `registry.mjs:749` reads `Date.now()`, not its `at` argument.** (a) the mint takes `at`'s clock (plantable) · (b) leave.
  **Recommend (a)** — W6 cannot plant the clock otherwise.
- **F-6 · `captains_call.mjs` `c${s.next_id++}`** (a state counter, tmp+rename `:110-111`, no lock: a lost update, not a duplicate id).
  (a) out of class, its own unit · (b) fold in. **Recommend (a).** Decides: two `captains_call file` processes in one window → card count.
- **F-7 · the landing order.** (a) build mid on main AFTER mact lands (mid replaces `idSeq`/`claimSeq` with `mintId`, and keeps mact's
  refusals) · (b) stack on `claude/mact-build` `018592e` · (c) build on main without mact (re-does mact's refusals). **Recommend (a).**
- **F-8 · the receipt** (`campaign-2026-09/tools/effort_receipt.mjs`) is not in this repository; its error is named in the final message.

## NAMED, NOT GUESSED

- **How many ids are already held by two rows** in his `acts.jsonl`, `outbox.jsonl`, `tasks.jsonl`, `sitting_agenda.jsonl` and `registry.json`
  `rulings`: this seat read no live state. On his laptop, counts only, nothing printed of a row:
  `node -e "const f=require('fs');for(const p of ['acts','outbox','tasks','sitting_agenda']){const m=new Map();for(const l of f.readFileSync('dressing-room/state/'+p+'.jsonl','utf8').split('\n')){try{const r=JSON.parse(l);const k=r.id&&(r.ev==='post'||r.ev==='create'||r.kind==='agenda'||r.verb)?r.id:null;if(k)m.set(k,(m.get(k)||0)+1)}catch{}}console.log(p,[...m.values()].filter(n=>n>1).length)}"`
- **How often two processes mint in one ms on his machine** (Windows Task Scheduler, the three Stop hooks): the rate is a property of his
  machine; the same count above is its lower bound.
- **Whether any ledger is written from two machines** (F-2): read off his device list; no cloud seat writes his state.
- **Windows PID width**: the 7-char pad covers 2^32; the live max is read with `Get-Process | Measure-Object Id -Maximum` on his laptop.
- **The LIVE selftests** of `acts`, `outbox`, `tasks`, `sitting`, `notes_compiler` were not run by this seat (they read his state); the
  build seat runs them with the ledgers pointed under the temp dir, as mact did.

## FILES A BUILD WOULD TOUCH

`scripts/mint.mjs` (new) · `scripts/acts.mjs` · `scripts/claims.mjs` · `scripts/outbox.mjs` · `scripts/tasks.mjs` · `scripts/registry.mjs` ·
`scripts/sitting.mjs` · `package.json` (one suite gains `node scripts/mint.mjs selftest`). Beyond them, each a FORK: `.dependency-cruiser.cjs`
(only if a rule refuses a new shared leaf module) · `scripts/organism_test.mjs` (only if the coverage law needs more than the package.json
line) · the F-4 files if (b).

## THE NEUTRAL MACHINE

Read with `curl -sS https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs` (no token). Rows appended per push below.

| Push | Check runs | Verdict |
|---|---|---|
