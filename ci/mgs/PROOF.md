# unit mgs — THE LAND WAIT · proof (forks row 1087 (3), built 18 Nov 2026)

Branch `claude/mgs-build`, cut from `origin/main` **7c3c2792cafb48b618c28d24c47af9988fd720a7** (`git fetch origin main; git checkout -b claude/mgs-build FETCH_HEAD`).
Named files only: `scripts/groundsman.mjs`, `ci/mgs/` (this file, `LEDGER.jsonl`, `witness_mgs.mjs`, `run_mutants_mgs.mjs`). `.claude/settings.json` is not touched.

## 1 · The groundsman as it stands (measured at the base 7c3c279, file:line)

| Fact | Where |
|---|---|
| The unattended push (laptop, the scheduled one) is `pushOnlyPass` | `scripts/groundsman.mjs:324` |
| It decides to push in two places: own unpushed commits with a clean index → `git push`; otherwise stage → verify → commit → `git push` | `:378-382` · `:388-391` |
| The Kennel's night loop (`nightPass`) pushes too, after its tick | `:301` |
| It fetches **only** `origin main` each pass (so `refs/remotes/origin/land/*` are as fresh as the last `land.mjs` fetch, never fetched by the groundsman) | `:366` |
| `heldCommits` lists the land refs from the TRACKING refs `refs/remotes/origin/land/` — used only to let a landed sha in `@{u}..HEAD` pass, never to wait | `:147-165` (list at `:155`; L4 comment `:152-154`) |
| One pass of the laptop lane = one process: `main()` push mode runs `pushOnlyPass` once | `:638-648` |
| The next pass is the next scheduled run: task `ArsenalFC-Groundsman-Push`, `/SC DAILY /ST 03:45` | `setup/INSTALL_CYBORG_TASKS.ps1:165` |
| The Kennel: one pass now, then `setInterval(pass, 30 * 60000)` | `:634-635` |
| What it prints (push mode): the away-day read-back, then `push-only — PUSHED…` or the `why`, then the day-key | `:645` · `:646` · `:647` |
| What it prints (night mode): `ticked` / `ticked + pushed` / `idle (step: why)` — an `ok:true` idle printed nothing of why | `:633` |
| After a push it skips today: it returns a `why` (PUSH-RACE, NO-FETCH, refused, held → ONE card keyed by the first held sha), and the next pass pushes own unpushed commits through the clean-index branch | `:166-172` · `:367` · `:378-382` |
| Why a state push between cut and landing costs a re-judge: `land.mjs` refuses `MAIN-MOVED` when origin main is not the judged tip's parent, and `LOCAL-AHEAD` when his main holds commits origin lacks | `scripts/land.mjs:184` · `:180` |

The last row decides WHERE the wait sits: a pass that committed locally and did not push would leave his main ahead of origin, and `land.mjs:180` refuses that (`LOCAL-AHEAD`). So the wait sits **before staging**: a holding pass stages nothing and commits nothing.

## 2 · What was built (`scripts/groundsman.mjs`, build tip after this proof's push)

- `landHold(run, now)` (`:292`): `git ls-remote --heads origin` — origin's land refs **as they are at this pass** (not a tracking ref an older fetch left); missing tip objects are fetched by sha (no tracking ref is moved, so `heldCommits` reads exactly what it read before); per ref:
  - tip an ancestor of `@{u}` (origin main, fetched this pass) → never holds;
  - tip an ancestor of `HEAD` (the L4 landing `land.mjs` left on his main, which this push itself LANDS) → never holds — a landed sha passes exactly as before;
  - age past `LAND_HOLD_MAX_H` → named **STALE**, does not hold;
  - else it holds.
- `pushOnlyPass` (`:421`, after origin is met so HEAD is what the push carries) and `nightPass` (`:334`, after its tick and the held-commit refusal) return `idle: "LAND-WAIT"` with ONE line naming every holding ref (and every stale one) — nothing staged, nothing committed, nothing pushed; the next pass reads again. A STALE-only pass pushes and still names the stale refs (`land_line`, printed on the same push-only line; the night line too).
- A remote that cannot be read (`ls-remote`, or the fetch of a tip, or a tip's time) → `idle NO-LAND-READ`, named, never a push.
- Nothing else changed: the two allowlist locks, the held-commit refusal, meetOrigin, the read-back are untouched (diff: `git diff 7c3c279 -- scripts/groundsman.mjs`).

### The age constant and what age means

`const LAND_HOLD_MAX_H = 24;` — declared once, `scripts/groundsman.mjs:290`, its ruling row (1087 (3)) in the comment.
**Age = now − the land tip commit's COMMITTER time.** The reason: it is the one clock plain git carries over the wire — `ls-remote` gives no time and a remote's reflog (the ref's last update) is not readable over the git protocol (only a host API has it, and a local bare origin has none) — and a land branch is CUT as a fresh commit, so its committer time stamps the cut. Committer, not author: a rebuild keeps the author date. The value: the push task is daily, so a 24-hour age lets an abandoned ref hold at most one night's push. The number itself is the architect's to rule (open question 1).

## 3 · The witness, both ways (by last line)

`node ci/mgs/witness_mgs.mjs --org <dir> --base-org <dir>` — real git, one local bare origin per clause under `os.tmpdir()`, clones with `core.autocrlf=false`, a planted `GIT_CONFIG_GLOBAL`, no port, no network, every `node` call the groundsman makes planted. Each gate clause must be RED on the base and GREEN on the build; the keep clause (C5) GREEN on both.

```
--org <base 7c3c279> --base-org <base>   →  RED MGS · C1, C2, C3, C4, C6, C7      (exit 1)
--org .  (build)    --base-org <base>   →  GREEN MGS land wait · 7 clause(s)    (exit 0)
```

The build run, clause by clause (18 Nov 2026):

```
GREEN C1 HOLD [gate] · base RED — pushed=true idle=undefined line=""
GREEN C2 ANCESTOR [gate] · base RED — with-judged: pushed=true line="" · landed-alone: pushed=true why=""
GREEN C3 STALE [gate] · base RED — age=24h · with-fresh: pushed=true line="" · aged-alone: pushed=true line=""
GREEN C4 NEXT [gate] · base RED — pass1: pushed=true · the judged land tip can no longer land: origin refused the fast-forward (main moved under the cut)
GREEN C5 LANDED [keep] · base GREEN — pushed=true origin-main-is-land-tip=true
GREEN C6 NO-READ [gate] · base RED — pushed=true idle=undefined line=""
GREEN C7 KENNEL [gate] · base RED — ticked=true pushed=true idle=undefined line=""
GREEN LAST no process naming the temp root survives (/proc)
GREEN MGS land wait · 7 clause(s)
```

C4 on the base reproduces the 19 Nov shape exactly: the state push moved main under the cut and origin refused the land tip's fast-forward.
The clock-bound plant (C3) back-dates the aged tip by the declared age plus a node start measured in the run plus the one-second floor of a commit date; no ratio is typed.

## 4 · The mutants

`node ci/mgs/run_mutants_mgs.mjs --org . --base-org <base>` — one exact text replacement per clause, the groundsman's import closure read from the source; a mutant counts only if the clause that names it is RED.

```
KILLED mutant C1 (the unattended push never waits) · RED clauses [C1, C2, C3, C4]
KILLED mutant C2 (a land ref main (or this push) already holds still holds) · RED clauses [C2, C4, C5]
KILLED mutant C3 (the age is never consulted) · RED clauses [C3]
KILLED mutant C4 (the land refs are read once per process) · RED clauses [C2, C3, C4]
KILLED mutant C5 (the L4 landing this push carries is held like a judged ref) · RED clauses [C5]
KILLED mutant C6 (a remote that cannot be read is taken as no land refs) · RED clauses [C6]
KILLED mutant C7 (the Kennel's night pass never waits) · RED clauses [C7]
run_mutants: 7 of 7 mutant(s) RED by the clause that names them · control GREEN
```

Each mutant run is bounded by the control's measured wall time counted twice (derived in the run).

## 5 · The groundsman's selftest, the suite, models check

```
node scripts/groundsman.mjs selftest   base 7c3c279 → ALL CHECKS PASSED
node scripts/groundsman.mjs selftest   build        → ALL CHECKS PASSED
node scripts/models.mjs check          build        → exit 0 · models check · config scan: 19 file(s) · hits 0 · declared 0
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all   (18 Nov 2026, after npm ci)
  base  7c3c279 → organism_test: 140 passed, 3 failed · UNRULED 3 (coverage law orphans deck_lint/home_pin/probe/study_scope · sandbox · the members aggregate)
  build 5967817 → organism_test: 142 passed, 1 failed · UNRULED 1 (the same coverage-law orphans, untouched by this unit)
```

The coverage-law FAIL is on the base and names organs this unit does not touch; the base's sandbox FAIL did not recur on the build run (a flake of that member, not this unit).
The CI verdicts of each push are in `LEDGER.jsonl` (check runs read through the public API, no token).

## 6 · FORKS

- F1 · The Kennel's `nightPass` carries the same wait (C7). The ruling names "the groundsman's unattended push"; both lanes push unattended to main, so both wait. If the architect meant the laptop lane only, the four lines at `:334-337` come out and C7 goes.
- F2 · No mock assert was added to the groundsman's own selftest: the clauses are witnessed on real git in `ci/mgs/`. A hermetic chain entry for `ci/mgs/witness_mgs.mjs` in `scripts/organism_test.mjs` is NOT written (the brief names that file as a FORK): it needs a base tree, which the suite does not carry.
- F3 · A holding pass names the refs on the push-only line every night it holds; it does NOT card him (the ruling asks for one printed line, not a card). The hold clears by itself, so it is not his homework.
- F4 · The `@{u}`-ancestor test is implied by the `HEAD`-ancestor test after origin is met (`@{u}` ⊆ HEAD on every path that reaches it); both are kept, the first for the ruling's own words. C2's mutant therefore removes both.

## 7 · Open questions for the architect

1. The age value: 24 hours (one daily push pass). A judging that lasts longer than that will see its ref named STALE and the state push go out. Rule the number.
2. Age = the tip's committer time. If land refs are ever pushed as an OLD commit (no fresh cut commit), they age from the build, not the cut — rule whether `land.mjs`'s cut always makes a fresh commit, or the age should read something else.
