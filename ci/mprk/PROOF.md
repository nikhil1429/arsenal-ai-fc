# MPRK PROOF · one owner for parked items, one card where each returns

Unit **mprk** · forks rows 1173 (3) / 1190 · spec `ci/mprk/MPRK_SPEC.md` on `claude/mprk-spec` at **5e604bc** (read whole,
with its `LEDGER.jsonl`). Build branch `claude/mprk-build`, cut from `origin/main` **5759cce** (`git fetch origin main &&
git rev-parse FETCH_HEAD` → `5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90`, measured 20 Nov 2026; `ci/mprk/BASE` holds it).
Nothing was merged into main, nothing landed, nothing deleted, no PR, no force push, no live model call.

## 1. What was built (the ruling, row 1190)

| ruling | built as | where |
|---|---|---|
| owner | new organ `scripts/parked.mjs`, SOLE WRITER of `dressing-room/state/parked.jsonl` (append-only: `ev:"park"` / `ev:"close"`, `by` ∈ haan · na · undo · at-source); stamps `concept` / `axis` / `step` read-only from `forge_session.json` (null outside a fresh session, the owner's own `isStale` imported) | `scripts/parked.mjs` |
| F4 a · the act tail is the ONE write door | `park` row in the acts OWNER table; the owner is spawned with his words on stdin; a `guard` refuses `park` from any door but `code` (the tail) | `scripts/acts.mjs` |
| F1 a · ranks beside hand-filed | Captain's Call source 6: ONE card per open park, key `park:<id>`, source `parked`, rank 0 | `scripts/captains_call.mjs` `deriveCards`, `pickCard` |
| haan / na / baad | dispatch `{kind:"park", id}` → `parked.mjs close <id> --by haan|na` through the owner-CLI pattern (a failed close keeps the card live); baad = the generic sleep to the next local day, the park stays open | `applyAnswer`, `main` |
| F3 a · the park key joins the retire-at-source keys | `/^park:[^\s:]+$/` in `RETIRE_AT_SOURCE_KEYS`; `sweepClosedParks` retires a card whose park a close row names (an undo, at-source) in the sync, through `retireCard` | `captains_call.mjs` |
| F2 a · no backfill | the ledger starts empty; nothing imports by pattern | `parked.mjs` header |
| F5 (a) ships, (b) behind ONE switch OFF | `LIST_SUPERSEDED_BY_CARDS = false`: `parked.mjs close-list` prints this session's parks with their reasons (a); ON it prints one line naming the card surface and no list (b). Flipped only on his word | `parked.mjs` |
| F6 a · machine notices out of scope | named in the `parked.mjs` header so they are not lost; no code | — |
| F7 a · crash-belt line stays, tail beside it | the two skill lines say so; the archived SAMJHAO record is untouched | skills |
| (3) the two skill lines | forge and learn `SKILL.md` park lines name the tail `<<ACT {"acts":[{"verb":"park","args":{"text":"<his words>"}}]}>>` | `.claude/skills/{forge,learn}/SKILL.md` |
| skeleton | the `[PARK]` line names the tail at the same byte weight (the widest skeleton 2797 → 2809 B, budget 2814 B unchanged, measured 20 Nov 2026) | `scripts/teaching_bar.mjs` |
| `.gitignore` | one line: `dressing-room/state/parked.jsonl` (`git check-ignore -v` → `.gitignore:470`) | `.gitignore` |
| one suite | `node scripts/parked.mjs selftest` in `squad:selftest`, after `captains_call` | `package.json` |

`schemas/captains_call.json.schema.json` enumerates no dispatch kinds (`grep -n "kind\|enum"` → only the `answer` enum), so it is untouched.

## 2. The witness, both ways (20 Nov 2026)

`node ci/mprk/witness_mprk.mjs --org <tree> --base-org <LF tree 5759cce>`, each tree a `git archive` LF tree under the
scratch dir with `node_modules` linked, the witness run from a copy of `ci/mprk/` (the ms1 member's shape).

```
--org <LF tree 958f995 (the organs at the build tip)>
GREEN MPRK one owner for parked items, one card where each returns · 15 clause(s)            (exit 0)
--org <LF tree 5759cce>
RED MPRK · K1, K3K4, K5, K6, K7, K8, F3, F4, K9, K2, F5, SKILL, COVER, BOUND                 (exit 1)
```

LAST is GREEN on the base by its nature (no process survives either run), as in `ci/mrf/PROOF.md`; its mutant plants a
surviving child. Every other clause is RED at base and GREEN at head. The organs did not move after 958f995 (the later
commits touch only `ci/mprk/`).

## 3. The mutants (20 Nov 2026)

`node ci/mprk/run_mutants_mprk.mjs --org <LF tree 958f995 + this dir> --base-org <LF tree 5759cce>`:

```
RED   K1 · the `park` row dropped from acts.mjs OWNERS (renamed away) · RED MPRK · K1 (exit 1)
RED   K2 · captains_call.mjs writes parked.jsonl itself · RED MPRK · K2 (exit 1)
RED   K3K4 · dealGuard ignores the fresh forge session · RED MPRK · K3K4 (exit 1)
RED   K5 · deal emits every live park · RED MPRK · K5 (exit 1)
RED   K6 · the park dispatch never calls the owner's close · RED MPRK · K6 (exit 1)
RED   K7 · baad writes a close row · RED MPRK · K7 (exit 1)
RED   K8 · the park reverse returns argv:null · RED MPRK · K8 (exit 1)
RED   F3 · park: left out of RETIRE_AT_SOURCE_KEYS · RED MPRK · F3 (exit 1)
RED   K9 · parked.mjs add stamps forge_session.json · RED MPRK · K9 (exit 1)
RED   F4 · the tail-only door guard dropped · RED MPRK · F4 (exit 1)
RED   F5 · the F5 switch shipped ON · RED MPRK · F5 (exit 1)
RED   SKILL · forge/SKILL.md's park line names the note verb · RED MPRK · SKILL (exit 1)
RED   COVER · parked's selftest unwired from its suite · RED MPRK · COVER (exit 1)
RED   BOUND · scripts/sitting.mjs touched · RED MPRK · BOUND (exit 1)
RED   LAST · the witness leaves a node process naming its temp dir · RED MPRK · LAST (exit 1)
control · GREEN MPRK one owner for parked items, one card where each returns · 15 clause(s) (exit 0)
run_mutants: 15 of 15 mutant(s) RED by the clause that names them · control GREEN
```

## 4. Selftests, members, laws (20 Nov 2026, LF clones made with `core.autocrlf=false`)

Each touched selftest, its headline line before (5759cce) and after (9d4309b):

```
acts           before: acts selftest: 58 passed, 0 failed           after: acts selftest: 58 passed, 0 failed
captains_call  before: captains_call selftest: 156 passed, 0 failed after: captains_call selftest: 163 passed, 0 failed
turn_hook      before: turn_hook: 168 passed, 0 failed              after: turn_hook: 168 passed, 0 failed   (teaching_bar's cases ride here)
parked         before: (absent)                                     after: parked selftest: 20 passed, 0 failed
```

Member lines touched (the hermetic suite, `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`):

```
before:  ok   SUITE MEMBER · captains_call selftest exits 0
after:   ok   SUITE MEMBER · captains_call selftest exits 0
before:  (no parked member)
after:   ok   SUITE MEMBER · parked selftest exits 0
```

`acts` and `turn_hook` ride `organism:selftest`, which the hermetic profile names and does not run as members; their
selftests are measured directly above. The hermetic suite's headline, both trees, measured 20 Nov 2026:

```
5759cce  organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)   exit 2
9d4309b  organism_test: 148 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)   exit 2
```

The three fails are the same on both and are the base's own: the selftest-coverage law (`orphaned: deck_lint, home_pin,
probe, study_scope`), `SUITE MEMBER · sandbox selftest exits 0`, and the all-members roll-up (sandbox). The one new pass is
the parked member. The first build cut (b36247c) read a fourth fail, `LOAD ZERO BLOCK 6 · ...the list of things the
organism may ask him may only SHRINK`; it was removed at its cause (§6, FORK-1), never by an ignore line.

**The law pack** (`node scripts/lawpack.mjs gate`, exit 1 on both trees, LF clones, 20 Nov 2026). The count line, both trees:

```
5759cce  lawpack · 1940 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
9d4309b  lawpack · 1942 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7
```

**No finding count rose.** The one RED (`jugad-literal-subject-list ROSE — 93, baseline 90`) is on the base. The raw
CANDIDATE total moved by two, and both are `jugad-literal-subject-list` candidates the judge clears (findings stay 93):
`const retired = [];` in `sweepClosedParks` and `const out = [];` in `parked.mjs` `readLedger` — empty accumulators, not
subject lists (measured by `lawpack.measure()` per site, base vs build).

**`node scripts/models.mjs check`** → exit 0 on both
(`models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)`).

**xray** (`xray.mjs` `build()` + `queries()`, 20 Nov 2026): `dressing-room/state/parked.jsonl W=parked.mjs R=parked.mjs`;
Q2 1 · Q5 0 on both trees (the Q2 row is the base's `thalamus_config.json`).

**Canon-count replay** (LOAD ZERO BLOCK 7 over the COMMIT blobs, `git show <sha>:<path>` for every tracked `.md` outside
`docs/archive/`), run before every push that touched a markdown file: `undeclared 0` each time (ledger).

## 5. The registry row (the LANDER's act — written here, never run)

```
node scripts/registry.mjs set --table lanes --json '{"subject":"parked","schema_owner":"parked.mjs","writes_to":"parked.jsonl","witness":"scripts/parked.mjs SOLE WRITER header · ci/mprk/witness_mprk.mjs K2 · forks row 1190","consumers":[{"name":"captains_call.mjs"},{"kind":"him"}],"reach":"any","why":"his parked words, kept verbatim by their one owner (the act tail is its one write door); captains_call.mjs source 6 reads them and each returns to HIM as ONE card at an anchor he already hits, closed only by his haan / na, an undo, or at source"}'
```

## 6. Where the build differs from the spec, and FORKS

- **The ruling wins (named):** the unit witness is `ci/mprk/witness_mprk.mjs` (the spec wrote `witness.mjs`); K3 and K4 are
  one clause `K3K4` (the spec's own pairing); F3, F4, F5, SKILL, COVER, BOUND, LAST are clauses beside the spec's K1–K9.
- **K9 as built:** K4 needs the planted forge session given `closed_at`, so "byte-identical before and after" is read as:
  only the witness re-plants the two study files, and each is checked unchanged before every re-plant and at the end.
- **The owner row carries more than the spec's argv:** `--act <act id>` (the park row names the act that wrote it) and an
  optional `why` (the close list's "with reasons"). The receipt is one JSON line led by `"id"`, which `reverse` reads.
- **FORK-1 · `WHY_CODE_CANNOT_DECIDE`.** The brief names a `park:` entry. The suite law LOAD ZERO BLOCK 6 holds that table
  SHRINK-ONLY (`<= 16`), and a gate may only get stricter, so the build does NOT add the row: the park card carries its
  own reason in `why_code_cannot_decide` (the field `whyForCard` reads first — the hand-filed door's shape), exported as
  `PARK_WHY`. The decision gate keeps the card the same way; the table stays 16. If the architect wants the table row,
  the shrink-only bound is a suite edit (beyond the named files) and needs its own ruling.
- **FORK-2 · acts.mjs beyond "one OWNER row".** Three edits sit in the named file, outside the row: `dispatch` passes
  `door` to a verb's `guard` (one argument; `job`'s guard ignores it), which is what makes F4 a mechanical (the ball
  schema enum and `do` derive from the table, so without the guard every door would write parks); and the ball prompt
  names `park` as never-for-a-ball (its selftest asserts the prompt names every verb).
- **FORK-3 · the flow atlas.** `organism_test.mjs atlas` (a LIVE-profile member) re-derives the atlas from the IR; the
  build moves the IR (a new organ and file node). Rebuilding `dressing-room/state/xray_graph.json` and
  `dressing-room/state/flow_atlas.json` writes under the state dir, which this seat may not touch. The lander runs
  `node scripts/xray.mjs build && node scripts/flow_atlas.mjs build`. (A fresh LF clone of the BASE already reads
  `STALE IR` on `flow_atlas.mjs check`, because the check compares mtimes.)
- **FORK-4 · F5 (b)'s record.** On his yes, the switch flips and SAMJHAO_MERGED §3-C4 "the close message includes the
  parked list" and `samjhao:R91` are struck, not erased. Both files are outside the named set: the lander's edit.
- **FORK-5 · the act skill.** `.claude/skills/act/SKILL.md` lists the verbs by example and does not name `park`; it is
  outside the named set and was not edited.
- **FORK-6 · registry birth.** `parked.jsonl` does not exist until the first park. If the registry's born check reads
  the lanes row's `writes_to` as a file that must exist, the row is born-red until he parks once; a `born` door (the
  `rejirah.mjs born` shape) would be a new mode, not built.
- **NAMED NOT GUESSED (spec §6, unchanged):** N1 the crash belt, N2 how often the teacher parks, N3 live MCP park
  notes, N4 deck pressure — all laptop-only. **N5:** `teaching_audit.mjs` runs its hook at import, so no clause plants a
  turn through `auditTurn`; neither the gate nor the audit strips an `<<ACT` tail (`grep -n "ACT_TAIL\|<<ACT"` → none),
  so whether the audit reads the tail line as the reply's last sentence is measured on his laptop, not here.

## 7. The neutral machine

The check runs of each pushed tip are read through the public API with curl and no token
(`GET /repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`) and recorded in `ci/mprk/LEDGER.jsonl`. Each push
cancels the previous tip's runs (the workflow's concurrency); the last tip's ids and verdict are in the seat's final
message.

## 8. Merges of new mains (20 Nov 2026; `ci/mprk/BASE` kept at 5759cce, forks row 1200 (2))

| new main | merge commit | conflicts | how both intents hold |
|---|---|---|---|
| 3f22388 (mlaw) | 4b334be | `package.json` suite lines only | union: `organism:selftest` gains main's `done.mjs` member; `squad:selftest` keeps mprk's `parked.mjs` member; each side had changed only its own line |
| cebe3eb (mcov) | 5291eee | `package.json` suite lines only | union: `organism:selftest` gains main's `deck_lint`, `home_pin`, `probe`, `study_scope` members; `squad:selftest` keeps `parked.mjs` |
| 6a6bdff (mmeter) | e6bcb5b | none (git merged clean; main touched no named file of this unit) | nothing to resolve |

After each merge the witness ran on the merged LF tree with the bound judged against the parent (`GREEN MPRK … · 15 clause(s)`),
the parent main alone read RED on the 14 clauses, and the mutants read `15 of 15 … · control GREEN` (ledger rows).

## 9. The probe red on d2d9383's node 24 leg — (b), not this unit's bytes (measured 20 Nov 2026)

The neutral machine at d2d9383 (base 6a6bdff): node 24 job 136344033976 read `FAIL SUITE MEMBER · probe selftest exits 0`
and its roll-up; node 22 job 136344034295 read the same member `ok`. Both runners are Windows Server 2025. The member
prints no detail line in the job log.

- **The same red on main's own tip.** 6a6bdff's node 22 job 136341665594 reads `FAIL SUITE MEMBER · probe selftest exits 0`
  and `B1_VERDICT node 22 RED`, with no mprk byte in that tree. Its node 24 job 136341665059 reads the member `ok`. The
  member flips leg by leg on a tree that does not change, so the red follows the runner, not a diff.
- **Our earlier tips:** c00dd6c read it `ok` on both legs (jobs 136292881859, 136292881395), and so did main 6a6bdff's
  first pair (136292644270, 136292643782).
- **What probe reads.** Its selftest plants its own fixture repos under the temp dir (`w(path.join(REPO, ".gitignore"), …)`
  at `scripts/probe.mjs:1374`, `:1701`, `:1964`, `:2162`). It reads no skill file, no `package.json` and no `.gitignore` of
  the tree under test, and none of this unit's paths. It spawns real git, grep, sed and wc segments under a per-segment
  timeout (`SEG_TIMEOUT_MS`, `:205`), so it is clock-bound on a slow runner.
- **This container, the merged tree and main, node 22.23.5 and node 24.22.3 (CI's node 24 version), three runs each:**

```
t_m (d2d9383 tree)  node 22  run1/2/3  exit 0 · probe selftest: 176/176 ok · GREEN
t_main (6a6bdff)    node 22  run1/2/3  exit 0 · probe selftest: 176/176 ok · GREEN
t_m (d2d9383 tree)  node 24  run1/2/3  exit 0 · 176 PASS · 0 FAIL
t_main (6a6bdff)    node 24  run1/2/3  exit 0 · 176 PASS · 0 FAIL
ORGANISM_TEST_PROFILE=hermetic node24 scripts/organism_test.mjs suites (LF clone of d2d9383):
  ok   SUITE MEMBER · probe selftest exits 0
  organism_test: 62 passed, 2 failed · UNRULED 2   (the two are this container's base reds: sandbox selftest and its roll-up)
```

Verdict: **(b)**. The red is probe's own clock on the Windows runner, with the same red on main 6a6bdff's own run. Nothing
here was changed and `scripts/probe.mjs` is untouched. The runner carries it to the architect.
