# PROOF · unit mland — THE LANDING VERB, `scripts/land.mjs` (rulings row 1029)

Branch `claude/mland-build`, made from the ITEM 1 tip `claude/mgrd-build` `38dd20a` (18 Nov 2026). Spec:
`ci/mcr/B2_SPEC.md` §2 (the verb in twelve steps), §3, §6 (V1–V8, CR1–CR4, MUT) on branch `claude/mcr-b2-spec`.
Where the spec and the ruling differ the RULING wins; each difference is named in §2 below.

## 1 · MEASURED at the base `38dd20a`

| Fact | Where |
|---|---|
| L1: `rails.mjs` owns no git-ref write (`grep -n "update-ref\|\"merge\"\|\"push\"" scripts/rails.mjs` → no line) ⇒ a NEW organ | `scripts/rails.mjs` |
| The verdict reader: one line `ci_verdict <sha7> GREEN\|RED\|PENDING\|NONE\|UNREADABLE …`, `[run <id>]` per leg; exit 0 only GREEN, 2 UNREADABLE | `scripts/ci_verdict.mjs:128-158`, `:216-233` |
| The sitting reader: `sitting.mjs status` prints `OPEN …` or `no open sitting` / `none open` | `scripts/sitting.mjs:1332-1336` |
| The tripwire: `archivist.mjs tripwire` reads `git diff --cached` vs `git ls-tree HEAD`, exit 1 on a block | `scripts/archivist.mjs:1856-1905`, `:3483` |
| OS units: WinSW `<arguments>scripts/X.mjs …` and logon `node scripts\X.mjs`; MCP servers in `.mcp.json` | `setup/services/ArsenalFC-*.xml`, `ArsenalFC-*.logon.ps1:16`, `.mcp.json:2-13` |
| A keeper unit is one whose entry imports `./keeper.mjs` (brain, context) | `scripts/brain.mjs:89`, `scripts/context.mjs:83` |
| The coverage law counts any organ with a quoted selftest mode; land.mjs carries none (its witness is ci/mland/) | `scripts/organism_test.mjs:273`, `:294` |
| The groundsman's held range (L4 learns here) | `scripts/groundsman.mjs:147-160` (ITEM 1 tip) |
| UNREAD: the mlive spec's §6 judge-round reader (no such file on any branch this seat fetched) — step 7 reads the sitting only | — |
| UNREAD: the campaign names list and its gate (campaign repo) — taken as an INPUT file, format below | — |

## 2 · BUILT

`scripts/land.mjs` (new; `// @ts-check`; tsc + eslint print nothing for it, 18 Nov 2026) and `scripts/groundsman.mjs`
(L4 only). The twelve steps, each refusal a NAME, nothing moved by any refusal:

1 fetch `origin main land/<unit>` · 2 T/P/M/O, `MERGE-COMMIT`, `NOT-ON-MAIN` · 4 (read before 3) exactly ONE commit in
`origin/main..T` → `MULTI-COMMIT` (L3) · 3 `M == O == P` → `LOCAL-AHEAD` / `LOCAL-BEHIND` / `LOCAL-DIVERGED` /
`MAIN-MOVED` (row 1023) · 5 `STATE-PATH`, `SETTINGS-PATH`, `TRIPWIRE` (the real tripwire over a private index holding
T, HEAD = P), and Q4 `NAMES-GATE-ABSENT` / `NAMES-LIST-PATH` · 6 the verdict AT T (`VERDICT-RED`/`-PENDING`/`-UNREADABLE`)
· 7 `SITTING-OPEN` / `SITTING-UNREADABLE` · 8 `--live <witness>` each run once with `--org <T> --base-org <P>` in SHARED
CLONES (`git clone --shared`, never `git worktree add`) → `STOP LIVE-RED` · 9 `git merge --ff-only T` in his tree →
`STOP DIRTY-PATH <path>` / `STOP NOT-FF` · 10 push `main` (never forced); on a refusal one re-push iff origin still sits
at P, else `PUSHED NO PUSH-REJECTED`, main STAYS at T, ONE card `land:<unit>:push`, retry verb `land.mjs push <unit>`
(L4) · 11 acts and stale units PRINTED (`npm ci` iff the lockfile moved; a non-keeper OS unit whose static import
closure holds a moved path; keepers named as retiring themselves) — nothing restarted, nothing installed · 12 ONE line
`LANDED <unit> <T7> · verdict <run ids> · acts … · stale units … · unattended <n> of 10 …`.

Also: `count` (L2 — landings since the last stop a human resolved, from `.git/land_ledger.jsonl`, never tracked);
`carry <witness> <H0> <H1> --green-at <sha>` (§3.1 per commit, C2 header `// READS:` lines); `reads-probe <witness>`
(CR4 — an fs probe preloaded by `--import data:`; every repo path opened must be declared).

Groundsman (L4): `heldCommits` knows a commit whose sha is the tip of an `origin/land/*` ref as LAWFUL (not held);
`meetOrigin` never rebuilds one — origin moved past an unpushed landing → `idle LANDING-BEHIND`, ONE card
`groundsman:landing:<O12>`, nothing rewritten.

Ruling vs spec, named:
- C1 A (row 1023): no verdict ever carries; `carry` is a READER for runners and the verb never consults it. The spec's
  branch C1 B is not built.
- L4 A: the spec's groundsman recognition was "by tree = T's tree"; built as the stricter "sha = an origin/land/* tip".
- Step 8: the spec said a temp `git worktree`; the correction says an archive tree or a shared clone — shared clones.
- Step 11: the spec RAN `npm ci` and the mlive restart verb; the correction says PRINT and restart nothing — printed only.
- Q4: the names-gate result is an input file `--names-gate <json>` = `{ sha, result: "PASS", paths: [...], list_sha256 }`
  (the format is this seat's; the campaign's gate must emit it). Absent, another sha, not PASS, a new ci/witness path it
  never covered, or no `list_sha256` → REFUSED. Any landed blob whose sha256 IS the list → `NAMES-LIST-PATH`.
- Spec step 7's judge-round reader (`JUDGE-RUNNING`) is UNREAD (FORK 1).

## 3 · WITNESS — `ci/mland/witness_mland.mjs` (real git, bare origin, planted organs, under `os.tmpdir()`)

Run 18 Nov 2026 over archive trees of base `38dd20a` and build `6e85080`:

```
  ✓ V1 · base RED · build GREEN — red true · green true · verdict asked for T true (LANDED x e377b2c · verdict 111 222 · acts none · stale units none · unattended 1)
  ✓ V2 · base RED · build GREEN — red true (REFUSED MAIN-MOVED · x 5dac524 — origin/main 7d87cac is not )
  ✓ V3 · base RED · build GREEN — red true (REFUSED LOCAL-AHEAD · x 1857c7e — his main holds commits ori)
  ✓ V4 · base RED · build GREEN — red true · green true (STOP DIRTY-PATH · x 06ae97e — README.md is dirty here and T )
  ✓ V5 · base RED · build GREEN — refused-push holds main at T true · retry + accept true (PUSHED NO PUSH-REJECTED · x bb961e9 — main stays at bb961e9 )
  ✓ V6 · base RED · build GREEN — red true
  ✓ V7 · base RED · build GREEN — red true (REFUSED STATE-PATH · x da6be34 — dressin | REFUSED SETTINGS-PATH · y 441a588 — .cla)
  ✓ V8 · base RED · build GREEN — lock+closure true (LANDED x 60d4086 · verdict 111 222 · acts npm ci (printed, not run) · stale units Sitting · keepers retire themselves: B) · neither true
  ✓ CR1 · base RED · build GREEN — NO-CARRY · scripts/sitlib.mjs is touched in H0..H1 | CARRIES · 1 touched path(s) in fdf918d..97f2604, n
  ✓ CR2 · base RED · build GREEN — NO-CARRY · no READS line — a witness with no decla | CARRIES · 1 touched path(s) in 1dd53e5..d017fc1, n
  ✓ CR3 · base RED · build GREEN — diff empty true · NO-CARRY · scripts/sitlib.mjs is touched in H0..H1 and read 
  ✓ CR4 · base RED · build GREEN — INVALID LIST · opened README.md which no READS line declares | VALID LIST · 2 repo path(s) opened, all declared
  ✓ L2 · base RED · build GREEN — unattended 2 of 10 lan → after a STOP unattended 0 of 10 lan
  ✓ L3 · base RED · build GREEN — red true (REFUSED MULTI-COMMIT · x 9eca1bd — 2 commits in or)
  ✓ L4 · base RED · build GREEN — night pushes the landing true · origin moved → idle, one card true
  ✓ Q4 · base RED · build GREEN — absent true · list blob true · gate PASS lands true
  ✓ S8 · base RED · build GREEN — red true · green at T's bytes true
  ✓ BOUND · 3 differing path(s), all named
  ✓ LAST · 0 node process(es) naming the temp dir survive
GREEN MLAND landing verb · 19 clause(s)
```

The base has no verb, so V/CR/L2/L3/Q4/S8 are RED there by absence; L4 is planted by git alone and is RED on the base
by behaviour (the ITEM 1 groundsman HOLDS the landing).
ITEM 1's witness still holds at this tip (G1–G3 GREEN against `15edfec`; its BOUND names land.mjs as off its bound, as
it must).

## 4 · MUTANTS — `ci/mland/run_mutants_mland.mjs`

```
  ✓ M1 V1 · the verdict at T is never read → RED MLAND · V1
  ✓ M2 V2 · a moved origin is not seen → RED MLAND · V2
  ✓ M3 V3 · a local-ahead main is not seen → RED MLAND · V3
  ✓ M4 V4 · a dirty named path is not named → RED MLAND · V4
  ✓ M5 V5 · a refused push undoes the landing (main reset to P) → RED MLAND · V5
  ✓ M6 V6 · an open sitting is not seen → RED MLAND · V6
  ✓ M7 V7 · a state path is not seen → RED MLAND · V7
  ✓ M8 V8 · a moved lockfile names no npm ci → RED MLAND · V8
  ✓ M9 CR1 · hits is always false → RED MLAND · CR1
  ✓ M10 CR2 · a witness with no list is given one → RED MLAND · CR2
  ✓ M11 CR3 · touched is read from the net diff, not per commit → RED MLAND · CR3
  ✓ M12 CR4 · an undeclared open is not named → RED MLAND · CR4
  ✓ M13 L2 · a human stop never resets the count → RED MLAND · L2
  ✓ M14 L3 · two commits pass the one-commit gate → RED MLAND · L3
  ✓ M15 L4 · the groundsman does not know a landing (held again) → RED MLAND · L4
  ✓ M16 Q4 · an absent names-gate result passes → RED MLAND · Q4
  ✓ M17 S8 · a RED live witness is not a stop → RED MLAND · S8
  ✓ control → GREEN MLAND landing verb · 19 clause(s)
run_mutants: 17 of 17 mutant(s) RED by the clause that names them · control GREEN
```

## 5 · TOUCHED SELFTEST, headline before and after (18 Nov 2026)

```
node scripts/groundsman.mjs selftest   # at 38dd20a
ALL CHECKS PASSED
node scripts/groundsman.mjs selftest   # at 6e85080
ALL CHECKS PASSED
```

`scripts/land.mjs` is new and carries no selftest mode by design (its net is ci/mland/; a selftest mode would join
the coverage law's orphan list until package.json wires it — FORK 3).

## 6 · SUITE (hermetic, shared clone + npm ci), 18 Nov 2026

```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
6e85080  organism_test: 137 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
```

The same three reds by name as at `15edfec` and `5fe154b`: no new red.

## 7 · `node scripts/models.mjs check` → exit 0 (18 Nov 2026, at 6e85080)

## 8 · FORKS

1. Step 7's judge-round reader (`REFUSED JUDGE-RUNNING`): the spec defers it to "§6 of the mlive spec", which this seat
   could not read — not built; the verb reads the sitting only.
2. Q4's input format is this seat's (`{ sha, result, paths, list_sha256 }`); the campaign's gate must emit it, and the
   list's sha256 is the only fact about the list that ever reaches the laptop's verb.
3. S1 (`ci/witness/<unit>` + one suite member running them all) needs a suite member in `scripts/organism_test.mjs` or
   `package.json` — files beyond this unit's names. Not built; the verb's Q4 gate already guards any new ci/witness file.
4. L2's ledger lives in `.git/land_ledger.jsonl` of HIS clone (not state, never pushed). Which stops count as "a stop a
   human had to resolve": DIRTY-PATH, PUSH-REJECTED, NOT-FF, LOCAL-DIVERGED, LIVE-RED, TRIPWIRE — the waits (pending
   verdict, open sitting, main moved, local ahead) do not reset the count. The architect may move a name across.
5. L4 "the verb retries the push": built as ONE immediate re-push iff a fresh fetch shows origin still at P, then the
   `push <unit>` verb and the groundsman's night (which now pushes a lawful landing with its state) — no retry loop.
6. Stale-unit reach is a STATIC import closure (literal `import`/`export … from`/`import("…")` strings); a dynamic path
   built at runtime is not seen.
7. CR4's probe sees the witness process's own `fs` calls, not a child process it spawns.
