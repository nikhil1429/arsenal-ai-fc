# mmach · PROOF — the machine reads a broken branch RED by name, its clean sibling GREEN, with no login

Unit **mmach** of the mwit spec (`ci/mwit/MWIT_SPEC.md` on `claude/mwit-spec` @ `88bf69d`, §B-machine), rulings forks rows
1162 / 1163. Branch `claude/mmach-build`, cut from `origin/main` at **`fb4211870093e6b8657655eb02ebcfc425f1eab1`**
(fetched 19 Nov 2026); main `5759cce` merged in on 20 Nov 2026, so `ci/mmach/BASE` is now `5759cce`. The siblings' own base stays `fb42118` (the record). Ledger: `ci/mmach/LEDGER.jsonl`. Every run below is dated 19 Nov 2026 (UTC) and
named by its command.

CHECKPOINT · STOPPED at 2026-11-21T07:32:52Z (rows 1233 (2) / 1236, 21 Nov 2026) · merge commit a02bd8a7449c506b66b5d8358f116c1962e05468 = main 7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f merged (a merge commit, no rebase, no force) · conflicted files: NONE (the merge was clean; this unit edits no scripts/organism_test.mjs, package.json or other unit's ci/ path) · BASE = 7bf008b (the brief keys BASE to the sha the build stands on, as at 5759cce) · fixed tip 3acce06c5b0782001bd63cd504c6c710dbf369bf: main's ci_verdict.mjs (unit mdtl) now imports witness_cause.mjs and red_cause.mjs and may append ` — cause: a ; b` to a new red, so the plant tree copies the reader's sibling imports derived from its source and the planted assert is found in the new-red text by its own boundaries; a `plants` mode answers unit mmeter's member (ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs clauses, 21 Nov 2026: `CLAUSE WITNESS · ci/witness/mmach/witness_machine.mjs plants` ok, `PLANTS mmach · 25 of 25 plant(s) as expected`) · witness --org <merged> --base-org <7bf008b>: GREEN MMACH … · 5 clause(s) (exit 0); --org <7bf008b>: RED MMACH · B-machine:broken-red, B-machine:clean-green, B-machine:read-no-login (exit 1); the same on CRLF copies · run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN · real reads: broken HOLDS · clean HOLDS · nologin UNREAD (cloud) · legs of the tip: see the ledger row `ci` after this commit's push · the witness derives no day from the clock (mclk does not apply). Resume from: the runner's next order.

CHECKPOINT · STOPPED at 2026-11-20T01:28:27Z (row 1172, 20 Nov 2026) · main 5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90 merged into this branch (merge commit = the parent of the commit carrying this line) · BASE = 5759cce · resolution hunks: NONE (the merge was clean; scripts/organism_test.mjs and package.json untouched by this unit) · witness --org <merged> --base-org <5759cce>: GREEN MMACH the machine reads the broken branch RED by name, its clean sibling GREEN, both with no login (planted both ways) · 5 clause(s) (exit 0); --org <5759cce>: RED MMACH · B-machine:broken-red, B-machine:clean-green, B-machine:read-no-login (exit 1); the same on CRLF copies · run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN · resume from: the runner's next order.

CHECKPOINT · STOPPED at 2026-11-19T12:38:15Z · resume from the witness both ways (kept as history: RESUMED on the
architect's message, his word 270, and carried through below).

## Files (named files only)

| file | what |
|---|---|
| `ci/witness/mmach/witness_machine.mjs` | the witness: three clause reads (`broken` · `clean` · `nologin`) + the plants (`--org --base-org`) |
| `ci/witness/mmach/machine.json` | the RECORD: the two sibling shas, their base, the planted assert's name — no verdict |
| `ci/mmach/run_mutants_mmach.mjs` | one mutant per clause |
| `ci/mmach/BASE` · `LEDGER.jsonl` · `PROOF.md` | the base sha, the acts, this file |
| branch `claude/mmach-broken` @ `2995f43bc688bfe4594f43614278e1a7478aacad` | base + ONE byte: `scripts/tokenizer_play.mjs:208` expects 12 tokens at 0 merges, not 11 |
| branch `claude/mmach-clean` @ `399b7192abe567fb0715a7fa0fbc2e024a3306a1` | the break reverted (child of the broken commit; its tree `1244e55` equals the base's) |

Neither sibling is landed or merged into anything. Both were made by git plumbing on a private index (no checkout).

## The three clauses, read for real (one reader: `scripts/ci_verdict.mjs <sha>` as a child)

`node ci/witness/mmach/witness_machine.mjs <mode>` on this cloud (19 Nov 2026), last line, exit:

```
broken   MMACH broken · HOLDS — RED by name on every leg: SUITE MEMBER · tokenizer_play selftest exits 0 · child exit 1 · ci_verdict 2995f43 RED — node 22: RED (base fb42118 · 2 new red: SUITE MEMBER · tokenizer_play selftest exits 0 ; all 53 hermetic suite members pass …) [run 135563440013] | node 24: RED (… same …) [run 135563439651]   exit 0
clean    MMACH clean · HOLDS — GREEN on every leg · child exit 0 · ci_verdict 399b719 GREEN — node 22: GREEN (base fb42118 · 0 new red · 1 base red · 126 live) [run 135563456751] | node 24: GREEN (…) [run 135563456388]   exit 0
nologin  MMACH nologin · UNREAD — UNREAD — the API was not read · child exit 2 · ci_verdict 399b719 UNREADABLE — GET …/check-runs?per_page=100 answered 403   exit 2
```

`nologin` reads **UNREAD on the cloud, never green** (row 1162 (5)): it scrubs every token key AND every proxy key (a
proxy can carry a credential the reader never sees), and this cloud's only road out is its proxy. Its green is his
laptop's fact (spec N4: `node ci/witness/mmach/witness_machine.mjs nologin` there).

## Red before, through the receipt organ

At `5d5ebc7` (the witness tracked, no record) each clause read exits 2. Recorded by the receipt organ's own CLI with its
state door `ARSENAL_RUNG_STATE_DIR` under `os.tmpdir()` (a node script; the tracked receipt under dressing-room/state is
never touched here — FORK K2):

```
rung_receipt: red B-machine:broken-red · exit 2 · out 729ae9246b48 · head 5d5ebc74f8de · last: MMACH broken · UNREAD — no record (ci/witness/mmach/machine.json absent)
rung_receipt: red B-machine:clean-green · exit 2 · out 8a0411b9c2f3 · head 5d5ebc74f8de · last: MMACH clean · UNREAD — no record …
rung_receipt: red B-machine:read-no-login · exit 2 · out 87aa9b02d797 · head 5d5ebc74f8de · last: MMACH nologin · UNREAD — no record …
rung_receipt: verify · 3 row(s) · chain holds
```

## The witness both ways (LF trees of BASE and the build tip built under os.tmpdir() by a node script; private index, core.autocrlf=false)

```
witness --org <build 8904e05> --base-org <BASE fb42118>   GREEN MMACH the machine reads the broken branch RED by name, its clean sibling GREEN, both with no login (planted both ways) · 5 clause(s)   (exit 0)
witness --org <BASE>          --base-org <BASE>           RED MMACH · B-machine:broken-red, B-machine:clean-green, B-machine:read-no-login   (exit 1)
the same two on CRLF copies of every file the witness reads  GREEN … · 5 clause(s) (exit 0) · RED MMACH · B-machine:broken-red, B-machine:clean-green, B-machine:read-no-login (exit 1)
```

Plants per clause (all ✓ on the build): broken — both legs RED naming the planted assert → 0 · RED naming another → 1 ·
RED naming it plus its aggregate → 0 · one leg RED, one GREEN → 1 · GREEN → 1 · PENDING → 2 · API 403 → 2 · no record → 2.
clean — both GREEN → 0 · one leg RED → 1 · no network (403, exit 2) → 2 · PENDING → 2 · no record → 2 · sibling on another
base → 1. nologin — planted GREEN with GITHUB_TOKEN, GH_TOKEN, HTTPS_PROXY in the parent env → 0 and the planted API saw
no token, no proxy key, no Authorization header, 3 calls · planted RED → 0 · 403 → 2 · no record → 2 · a ci_verdict.mjs
with an Authorization header → 1 (static half). BOUND: 6 path(s) differ, all under `ci/witness/mmach/` or `ci/mmach/`.
LAST: no node process names the temp root.

## Mutants

```
node ci/mmach/run_mutants_mmach.mjs --org <build> --base-org <BASE>   (LF, and again on CRLF copies — same line)
  control · exit 0 · GREEN MMACH … · 5 clause(s)
  ✓ M1 (B-machine:broken-red, witness: accept any RED, the name check dropped) · RED MMACH · B-machine:broken-red
  ✓ M2 (B-machine:clean-green, witness: UNREADABLE read as green) · RED MMACH · B-machine:clean-green
  ✓ M3 (B-machine:read-no-login, org: ci_verdict sends Authorization: Bearer $GITHUB_TOKEN) · RED MMACH · B-machine:broken-red, B-machine:clean-green, B-machine:read-no-login, BOUND
  ✓ M4 (BOUND, org: a stray file in scripts/) · RED MMACH · BOUND
  ✓ M5 (LAST, witness: a detached node child naming the temp root) · RED MMACH · LAST
run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN
```

## Selftests, members, models, the law pack

- **Selftests touched:** none — no product file changed (`git diff --stat fb42118 HEAD` names only `ci/mmach/**` and
  `ci/witness/mmach/**`). **Members touched:** none (row 1162 (2): the suite file is unit mmeter's alone).
- **Suite** (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 19 Nov 2026): BASE `organism_test: 149
  passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126` (exit 2); build — the same line, the same one red (`EVERY organ with a
  selftest is wired into a suite`, a base red).
- **`node scripts/models.mjs check`** (19 Nov 2026): `models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)` — exit 0.
- **Law pack gate** (`node scripts/lawpack.mjs gate` on LF trees, 19 Nov 2026), BASE fb42118 and build 8904e05 print the
  SAME count line: `owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 ·
  bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 ·
  raw-nul-in-source 0 · depcruise_errors 13` (both exit 1: `jugad-literal-subject-list` and `depcruise_errors` already over
  their frozen baselines ON MAIN). The build raises no count.

## Where this differs from the spec (named)

- **broken-red names the planted assert AMONG the new reds** — the spec's own word. The seat first required it to be the
  ONLY new red; the neutral machine printed TWO for the one-byte break (the member and its aggregate `all 53 hermetic suite
  members pass`), so the exactly-one rule was this seat's addition, not the spec's, and was dropped (commit 8904e05).
- **Stricter than the spec, kept:** every required leg must name it (not just the line); clean also requires the record's
  clean sibling to share the broken branch's base; nologin also strips proxy keys and the git credential path.

## FORKS

- **K1 · ms1 cannot find this witness.** The ms1 member judges `ci/<unit>/witness_<unit>.mjs`; the UNITS row puts this one at
  `ci/witness/mmach/witness_machine.mjs`, so `ci/mmach/BASE` alone does not get it judged. The walk of `ci/witness/` is
  unit mmeter's member (row 1162 (2)); until it lands, nothing on the neutral machine runs these plants.
- **K2 · the tracked receipt.** The real red-before belongs in `dressing-room/state/rung_receipts.jsonl` (tracked, F9 b);
  this seat never writes state, so it was recorded only through the organ's tmpdir door. Who records it, where.
- **K3 · nologin on the cloud.** By design UNREAD here (proxy stripped). Rule whether stripping the proxy is right, or
  whether a proxy that injects no credential may stand.
- **K4 · the effort receipt.** `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository (see the final message).

## CI (the neutral machine, read by the public API with curl, no token; verdict by `ci_verdict.mjs <full sha>`)

Siblings and the checkpoint tip — rows `ci` in the ledger. The tip that carries this file is judged by its own push; its
runs are named in the ledger and the final message.
