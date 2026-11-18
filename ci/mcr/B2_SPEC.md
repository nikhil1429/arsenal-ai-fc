# B2 · LANDING BY PULL — SPEC (unit mcr, item 1)

> A SPEC for the architect. **Nothing is built.** Base: `origin/main` at `76b0626` (the B1 landing; it carries
> `scripts/ci_verdict.mjs`). Every fact below names its file:line AT THAT BASE; a fact this cloud seat cannot reach is
> NAMED **UNREAD**, never guessed. No state file's content is quoted.

## 0 · The plan text (architect plan v3, approved 15 Nov) and what is already ruled

- **Plan:** branch `land/<unit>` → CI verdict GREEN at that sha → `git merge --ff-only` + push at a moment no sitting is
  open → post-pull acts by the owner CLI. A verdict CARRIES across commits that touch only files it does not read.
  Landed witnesses split HERMETIC (move beside the code, behind a names + privacy gate, run on CI) and LIVE (stay on the
  laptop, one process, at pull). `scripts/groundsman.mjs` rebases its state commit over a moved origin.
- **Ruled, row 1023:** the sha judged is the sha landed; the move is a fast-forward-only merge IN HIS TREE when his
  local `main`, `origin/main` and the branch parent are the same commit, then push `main`; his dirty files are other
  paths and stay; a git refusal for a dirty path is a STOP; no force, no rebase of main, no stash; if main moved
  meanwhile (an unattended state push) the branch is rebuilt on the new head and judged again.

## 1 · MEASURED at the base

### 1.1 The unattended state push today

| Fact | Where |
|---|---|
| ONE unattended committer of `dressing-room/state/`: `pushOnlyPass` (laptop) — and `nightPass` (the Kennel, not installed: "The Kennel's heartbeat task is NOT installed yet") | `scripts/groundsman.mjs:238-295`, `:189-220`; `setup/INSTALL_CYBORG_TASKS.ps1:200` |
| Every other `git commit` in `scripts/*.mjs` is a selftest fixture in a temp repo (archivist, audit, freeze, probe) | `scripts/archivist.mjs:188`, `scripts/audit.mjs:185`, `scripts/freeze.mjs:148`, `scripts/probe.mjs:1376` |
| Schedule: task `ArsenalFC-Groundsman-Push`, `groundsman.mjs push`, `DAILY /ST 03:45`, through `run_logged.cmd` | `setup/INSTALL_CYBORG_TASKS.ps1:161-165`, `:11-26` |
| Observed cadence on `origin/main`: 18 of the last 400 commits carry its subject; newest `c6966dc` 2026-11-18 03:45, `da6b763` 11-17 03:45, `3050957` 11-16 **09:10** (a missed 03:45 runs later) | `git log origin/main -400` |
| What it stages: `git add -u -- dressing-room/state/` (lock 1, tracked only), the index read back and every path matched against `PUBLISH_ALLOWLIST = ["dressing-room/state/"]` (lock 2) | `scripts/groundsman.mjs:283-290`, `:124-131` |
| Before staging it reads `@{u}..HEAD`: any commit there that is not its OWN (own subject AND every path on the allowlist) is a HELD landing → it refuses, cards ONCE (`--key groundsman:held:<sha12>`), pushes nothing; an unreadable range fails closed | `scripts/groundsman.mjs:146-167`, `:281` |
| **It never fetches and never pulls** ("No pull, no lease, no tick"). `@{u}` is the remote-tracking ref as of the last fetch/push | `scripts/groundsman.mjs:234-237` |
| **When origin moved:** the commit is already made locally (`:291`), then `git push` is rejected → `why: "push refused (…) — tomorrow's pass retries; nothing forced"` | `scripts/groundsman.mjs:291-293` |
| Consequence (derived from the two rows above, not yet observed in a log this seat can read): the next night `@{u}..HEAD` holds only its own commit(s) → passes `heldCommits` → commits again → push rejected again. Local `main` stays DIVERGED from `origin/main` until a human pulls; every night adds one more own commit. **UNREAD:** `scripts/groundsman.log` (laptop) — whether this has happened | derived |
| The Kennel's `nightPass` DOES `git pull --ff-only` first and idles on refusal | `scripts/groundsman.mjs:190-191` |

### 1.2 What holds old bytes after a pull, and the post-pull act each needs

| Organ | How it runs | Holds old bytes? | Post-pull act today | Where |
|---|---|---|---|---|
| Brain (`ArsenalFC-Brain`) | WinSW service → `brain.mjs daemon` = keeper over `daemon-worker` | No — the worker walks its static+dynamic import graph at boot and RETIRES (exit 75) on any newer mtime, checked before every beat; the keeper respawns at once | none (verify) | `setup/services/ArsenalFC-Brain.xml:15-16`; `scripts/brain.mjs:7063-7098`, `:7657-7684`; `scripts/keeper.mjs:21-25`, `:48-56` |
| Context (`ArsenalFC-Context`) | WinSW → `context.mjs daemon` = keeper | No — same retire rule over its graph | none (verify) | `setup/services/ArsenalFC-Context.xml:16`; `scripts/context.mjs:390-401`, `:1286` |
| Sitting (`ArsenalFC-Sitting`) | WinSW → `sitting.mjs daemon`, one process, HTTP :4117 | **Yes** | a restart BY HAND (measured 18 Nov on the laptop, per the brief) | `setup/services/ArsenalFC-Sitting.xml:16`; `scripts/sitting.mjs:1310-1315` |
| Cortex (`ArsenalFC-Cortex`) | WinSW → `cortex.mjs`, one process, :4112 lock | **Yes** — it has a `restart` mode that ARMS an exit-0-when-idle, whose message still promises the watchdog relaunch | by hand | `setup/services/ArsenalFC-Cortex.xml:16`; `scripts/cortex.mjs:2157`, `:2224-2233` |
| Thalamus (`ArsenalFC-Thalamus`) | WinSW → `thalamus.mjs`, one process, :4113 | **Yes** | by hand | `setup/services/ArsenalFC-Thalamus.xml:16`; `scripts/thalamus.mjs:62` |
| Turnstile, Dugout | logon tasks via `hidden_run.vbs` (desktop surface) | **Yes** until the next logon/relaunch | by hand | `setup/services/ArsenalFC-Turnstile.logon.ps1:15-16`, `ArsenalFC-Dugout.logon.ps1:15-16`; `scripts/daemon_watchdog.mjs:108`; `scripts/services.mjs:100` |
| MCP server `organism-memory` | stdio child of each Claude client session (`.mcp.json` → `scripts/mcp-memory.mjs`) | **Yes** until that client session restarts | none possible from the repo — the client owns the process | `.mcp.json:8-11` |
| "the dugout MCP server" (the brief's name) | **UNREAD in this tree:** `scripts/dugout.mjs` carries no MCP mode (grep `mcp` → 0 lines); the only repo-registered MCP server is `mcp-memory.mjs`. The laptop may register one outside the repo (Claude Desktop config) | — | — | `grep -n "mcp" scripts/dugout.mjs` → none |
| Scheduled one-shots (all `ArsenalFC-*` `schtasks` rows) | fresh process each run | No | none | `setup/INSTALL_CYBORG_TASKS.ps1:11-26` |
| `node_modules` | `npm ci` from the committed, pinned lockfile | Yes when `package-lock.json` moved | `npm ci` | `.github/workflows/suite.yml:91-93` |
| git hooks (`hooks/pre-commit`) | **UNREAD:** whether his clone sets `core.hooksPath=hooks` (no tracked setter: `grep -rn hooksPath scripts setup package.json` → only a selftest fixture, `scripts/archivist.mjs:177`) | — | — | — |

### 1.3 `organism_test.mjs` hermetic and LIVE lists today

| List | Count | Where |
|---|---|---|
| Profile switch: `ORGANISM_TEST_PROFILE=hermetic` or `--hermetic`, else `full` | — | `scripts/organism_test.mjs:83` |
| `LIVE_SELFTESTS` (organ selftests never spawned under hermetic) | 72 | `scripts/organism_test.mjs:84-158`, used `:227`, `:2166` |
| `LIVE_ASSERTS` (assert names, digit runs folded to `#`, prefix match at 90 chars) | 49 | `:159-209`, matched `:220-225`, applied inside `assert` `:46` |
| `LIVE_MODES` (`path`, `alive`, `gates`, `lawpack`, `atlas`) | 5 | `:210-216`, applied `:2713` |
| A LIVE assert is COMPUTED and then not judged (the block shares one sandbox with hermetic asserts) — the B1 FORK 2, item 4 of this queue | — | `:46`, `:71-76` |
| CI runs hermetic on both the head and its merge base; GREEN iff no red at head that is not red at base | — | `.github/workflows/suite.yml:28-40`, `:95-157`; `scripts/ci_verdict.mjs:1-25` |
| The table was measured by `ci/b1/probe.mjs` — **UNREAD at this base** (`ci/` is absent on main; it lives on `claude/b1-neutral-verdict-5ukvby`) | — | `scripts/organism_test.mjs:77-81` |
| The neutral verdict at main's tip `76b0626`: `npm test · node 22` run 134737191337 success, `· node 24` run 134737190476 success (a second pair in progress at read time); `public-safe-chores` 134741841410 failure (awayday.yml, not this lane) | — | public API `commits/76b0626/check-runs`, read anonymously by curl |
| `node scripts/ci_verdict.mjs 76b0626` in THIS container answered `UNREADABLE … 403` while curl to the same URL answered 200 — a container egress fact (Node's `fetch` vs the agent proxy), not a verdict | — | `scripts/ci_verdict.mjs:153` |

## 2 · THE VERB

**Name:** `node scripts/land.mjs <unit>` — a new owner, SOLE WRITER of nothing in `dressing-room/state/`; it moves
`refs/heads/main` in HIS tree and pushes it, and prints. (Where the verb lives is branch L1 below.)

**Inputs:** `<unit>` (the branch is `land/<unit>`; the unit name is `[a-z0-9-]+`, refused otherwise) · optional
`--dry` (every check, no move). Nothing else: the sha is READ, never typed.

**Steps, in order; each refusal is a NAME, and every refusal moves nothing:**

| # | Step | Refusal (exit non-zero, one line) |
|---|---|---|
| 1 | `git fetch origin main land/<unit>` | `REFUSED NO-FETCH` — the remote could not be read |
| 2 | `T = origin/land/<unit>`; `P = T^1`; `M = refs/heads/main`; `O = origin/main` | `REFUSED NO-BRANCH` · `REFUSED MERGE-COMMIT` (T has two parents) |
| 3 | `M == O == P` (row 1023) | `REFUSED LOCAL-AHEAD` (M has commits O lacks — e.g. a rejected state push; §4 resolves it first) · `REFUSED MAIN-MOVED` (O ≠ P — the branch is rebuilt on O and judged again, row 1023; or carried, branch C1) · `REFUSED LOCAL-BEHIND` (M behind O: pull first) |
| 4 | Exactly ONE commit in `P..T` | `REFUSED MULTI-COMMIT` (branch L3) |
| 5 | The paths of `P..T` hold no `dressing-room/state/` path, no `.claude/settings.json`, nothing the privacy belts refuse (`node scripts/archivist.mjs tripwire` over the range) | `REFUSED STATE-PATH` · `REFUSED SETTINGS-PATH` · `REFUSED TRIPWIRE` |
| 6 | The verdict at `T`: `node scripts/ci_verdict.mjs <T>` reads GREEN on every `npm test · node N` leg | `REFUSED VERDICT-RED` · `REFUSED VERDICT-PENDING` · `REFUSED VERDICT-UNREADABLE` (never "assume green") |
| 7 | No sitting open: `sitting.mjs status` (daemon or file) reads no OPEN sitting; no judge round running (§6 of the mlive spec names the reader) | `REFUSED SITTING-OPEN` · `REFUSED JUDGE-RUNNING` · `REFUSED SITTING-UNREADABLE` |
| 8 | The LIVE witnesses of the unit (§3.2), one process, at his tree, at `T`'s bytes in a temp `git worktree` (never his checkout) | `REFUSED LIVE-RED <witness>` |
| 9 | `git merge --ff-only T` on `main` in his tree | `STOP DIRTY-PATH <path>` (git refused for a dirty path: row 1023 — no stash, no force; he decides) · `REFUSED NOT-FF` |
| 10 | `git push origin main` (never `--force`) | `REFUSED PUSH-REJECTED` → `git reset --keep P`? **No** — see branch L4 |
| 11 | Post-pull acts by owner CLI, per §1.2: `npm ci` iff `package-lock.json` in `P..T`; for each OS unit whose static import closure holds a path of `P..T` and has no keeper: the mlive restart verb (item 3), refused as that verb refuses; the keepers (brain, context) are VERIFIED, not acted on | each act's own refusal, printed; a failed post-pull act never undoes the landing — it is a card at an anchor (`captains_call.mjs file --line … --key land:<unit>:<act>`) |
| 12 | ONE line: `LANDED <unit> <T7> · verdict <run ids> · acts <n ok>/<n> · stale units <list or none>` | — |

## 3 · THE CARRY RULE AND THE WITNESS SPLIT

### 3.1 The carry rule as a predicate

A witness `W` is a file with a header block declaring what it reads. **Declared-list format** (in the witness's own
header, so it travels with it):

```
// READS: scripts/postmatch.mjs
// READS: scripts/captains_call.mjs
// READS: .claude/skills/full-time/
```

one repo-relative path per line, `/`-separated; a trailing `/` means the directory and everything under it; no glob,
no `..`, no absolute path (a line that breaks this makes the list INVALID). The witness's own path is always in its
set implicitly.

```
reads(W)          = W.path ∪ { each READS line }          — undefined when W declares no READS line, or one is INVALID
touched(H0,H1)    = ⋃ paths of every commit c in H0..H1, both sides of a rename (git log --no-renames --format= --name-only H0..H1)
hits(p, r)        = r ends with "/" ? p starts with r : p == r
CARRIES(W,H0,H1)  ⇔ reads(W) is defined
                  ∧ GREEN(W, H0)
                  ∧ H0 is an ancestor of H1
                  ∧ ∀ p ∈ touched(H0,H1), ∀ r ∈ reads(W) : ¬hits(p, r)
```

Per COMMIT, never `git diff H0 H1`: a touch that a later commit reverts still drops the GREEN (the bytes went through
a state the witness never judged). A witness with no declared list NEVER carries. The rule says nothing about
whether the declared list is TRUE — that is clause CR4 below.

### 3.2 HERMETIC versus LIVE

| Class | Test (measurable) | Where it lives | When it runs |
|---|---|---|---|
| HERMETIC | its run reads no byte of `dressing-room/state/`, no port it does not open, no process table, no network, no unplanted clock — the five tests of `organism_test.mjs:72-75`; and its source and output pass a NAMES + PRIVACY gate (no person name, no state content, no credential path) | moved beside the code: `ci/witness/<unit>.mjs` on main (branch S1) | on CI, every push, inside the hermetic profile (one new mode, or one suite member) |
| LIVE | anything else | stays on the laptop, in the campaign's tree | step 8 of the verb, ONE process, at pull |

A witness is HERMETIC only by MEASUREMENT (the B1 probe preloaded into its run), never by its author's word. The
names + privacy gate is the existing tripwire (`node scripts/archivist.mjs tripwire`) plus a names list — **UNREAD:**
the campaign's names list lives in the campaign repo this seat cannot read.

## 4 · THE GROUNDSMAN REBASE

Today (§1.1) a moved origin makes the state push fail every night and leaves `main` diverged. The change, in
`pushOnlyPass`, between the held-range read (`:281`) and the staging (`:283`):

1. `git fetch origin main` — refusal: `idle NO-FETCH` (the pass still reports its read-back, as today).
2. If `O` is an ancestor of `HEAD`: proceed as today.
3. Else, if `HEAD` holds NO unpushed commit (`@{u}..HEAD` empty after the fetch): `git merge --ff-only O` — git
   refuses only when a dirty path overlaps a path `O` moved; that refusal is `idle DIRTY-PATH <path>` and a card once
   (`--key groundsman:dirty:<O12>`). Then stage / commit / push as today.
4. Else (own unpushed state commits AND a moved origin): every commit of `@{u}..HEAD` is its OWN (already proven by
   `heldCommits`), so each touches only `dressing-room/state/`. If `O..` (the moved commits) touch NO `dressing-room/state/`
   path, rebuild: for each own commit in order, a new commit whose tree is `O`'s tree with that commit's
   `dressing-room/state/` entries laid over it, parent the previous rebuilt commit, same message; then move `main` to
   the last one by `git merge --ff-only` from `O` (which changes in the working tree only the paths `O` moved — never a
   state path). If `O..` DID touch a state path: `idle STATE-CONFLICT` and a card once; nothing rewritten. (Mechanism:
   branch G1.)
5. Push. A rejection now means origin moved within seconds: `idle PUSH-RACE`, tomorrow retries (as today).

What this never does: force, stash, rebase of a commit that is not its own, touch a path off the allowlist.

## 5 · BRANCH TABLE (every open choice)

| Id | Choice | Branch A | Branch B | Cost | Measurable condition that decides |
|---|---|---|---|---|---|
| L1 | Where the verb lives | new `scripts/land.mjs` (one owner, one selftest) | a mode of `scripts/rails.mjs` (the §3-C commit gate already resolves the order) | A: one new organ in the registry; B: rails grows a mode that MOVES main | B iff `rails.mjs` already owns a write of a git ref (`grep -n "update-ref\|merge\|push" scripts/rails.mjs` > 0 in code, not fixtures) |
| L2 | Who runs it | his word at the laptop (`land <unit>` typed by a runner at his console) | an unattended task | B removes his hand but a landing is a deliberate act (row 769: machinery reaches origin only by a deliberate commit) | B only after N landings by A with 0 STOP/REFUSED that a human had to resolve — N is the architect's |
| L3 | Commits in `P..T` | exactly one | any, all judged at `T` | A: a seat must squash; B: intermediate shas are never judged | B iff every intermediate sha also has a verdict (CI runs on every push already — measurable per range) |
| L4 | Push rejected after the local ff | leave local `main` at `T`, print `PUSHED NO`, retry verb `land --push-only <unit>` | `git reset --keep P` (undo the local move) | A: his main is ahead of origin until retried; B: a ref rewrite in his tree | A unless the groundsman §4 step 3 would then refuse (it would: `LOCAL-AHEAD` is not own) — so A needs `heldCommits` to recognise a `land/` commit by its tree = `T`'s tree |
| C1 | Main moved by a state push between judge and land | rebuild the branch on the new head and judge again (row 1023, today's ruling) | the verdict CARRIES (§3.1) when every commit in `P..O` touches only paths outside the suite's declared reads, then rebuild and land with the carried GREEN | A: one more CI run (minutes) each time a 03:45 push interleaves; B: the sha landed is not the sha judged — **contradicts row 1023**, so B needs a new row | B iff (1) the hermetic suite's reads exclude `dressing-room/state/`, measured by the B1 probe over a full hermetic run (reads of state = 0), and (2) the architect rules it |
| C2 | Declared list home | header `// READS:` lines (§3.1) | a sidecar `<witness>.reads.json` | A travels with the file, needs a parser; B is JSON but can drift away from its witness | either; A unless a witness is not a JS file |
| C3 | Is the suite itself a carrying witness | no (no declared list → never carries) | yes, `READS: scripts/ ci/ hooks/ setup/ schemas/ laws/ learning-layer/ package.json package-lock.json` | B makes every state push carry the suite GREEN | B iff the probe in C1(1) reads 0 state bytes AND every file the suite opens is under those prefixes (probe: every `open` path) |
| S1 | Where hermetic witnesses go on main | `ci/witness/<unit>.mjs` (one dir, one suite member runs them all) | beside the organ, `scripts/<organ>.witness.mjs` | A: one member, one gate; B: the coverage law (`organism_test.mjs` coverage) would need to learn a new filename shape | A unless the architect wants the witness inside the organ's own selftest |
| G1 | Groundsman rebuild mechanism (§4 step 4) | plumbing: `git read-tree` into a temp index (`GIT_INDEX_FILE`), `commit-tree`, then `merge --ff-only` | `git rebase O` with `--autostash` | A never touches his working tree beyond the ff; B stashes — forbidden by row 1023's spirit and refuses on dirty state files without it | A unless B's measured refusals are 0 over a week of 03:45 logs (UNREAD: `scripts/groundsman.log`) |
| G2 | When the groundsman fetches | before staging every night (§4 step 1) | only after a rejected push | A: one fetch a night, and the divergence never forms; B: the commit is already made when the rebase is needed | A unless the 03:45 box is often offline (UNREAD: the log's `NO-FETCH` count) |

## 6 · WITNESS CLAUSES I WOULD WRITE (each planted both ways)

Witness `ci/mcr/witness_b2.mjs --org <dir>`, plants on copies under `os.tmpdir()`, a bare git repo as `origin`.

| Clause | Plant RED (must refuse) | Plant GREEN (must pass) |
|---|---|---|
| V1 sha | a `land/x` whose tip has a RED verdict (planted reader) | GREEN verdict → lands, `main` == `T` |
| V2 equal heads | origin/main one state commit past `P` → `REFUSED MAIN-MOVED` | equal → lands |
| V3 local ahead | a local own state commit not pushed → `REFUSED LOCAL-AHEAD` | none → lands |
| V4 dirty | a dirty file at a path `T` changes → `STOP DIRTY-PATH`, main unmoved, the dirty bytes unchanged | a dirty file at another path → lands, the dirty bytes unchanged |
| V5 no force | a reject from origin → no `--force` in the call log, `PUSHED NO` | accept → pushed |
| V6 sitting | an OPEN sitting file → `REFUSED SITTING-OPEN` | closed → lands |
| V7 state path | `T` touches `dressing-room/state/x.json` → `REFUSED STATE-PATH` | not → lands |
| V8 post-pull | `T` touches `package-lock.json` → the act list holds `npm ci` | not → it does not |
| CR1 carry | a commit in `H0..H1` touches a READS path → no carry | touches only other paths → carries |
| CR2 no list | a witness with no READS line → never carries | with a list → may carry |
| CR3 revert | a touch then a revert (diff empty) → no carry | — (CR1's green) |
| CR4 truthful list | the witness opens a file NOT in its list (probe) → `INVALID LIST` | every open path in its list → valid |
| G1 rebase | origin moved by a non-state commit, local holds an own state commit → rebuilt on `O`, pushed, own state bytes intact, no other path changed | origin moved by a STATE commit → `idle STATE-CONFLICT`, nothing rewritten |
| G2 ff | origin moved, no local own commit, a dirty state file → ff, the dirty file untouched, then the push | a dirty path `O` moved → `idle DIRTY-PATH`, card once |
| G3 held | a foreign commit in `@{u}..HEAD` → refused exactly as today (`:281`) | — (the existing selftest `scripts/groundsman.mjs:480-516` stands) |
| MUT | one mutant per clause: a touched pin must drop the GREEN (CR1 mutant: `hits` → always false ⇒ CR1 RED by name) | control GREEN |

## 7 · OPEN QUESTIONS FOR THE ARCHITECT

1. C1 contradicts row 1023 as worded — a carried verdict means the landed sha was not the judged sha. Keep 1023 (A), or a new row for B?
2. L4: on a rejected push after a local ff, leave `main` ahead (A) or undo (B)?
3. The "dugout MCP server" is not in this tree (§1.2). Where is it registered?
4. The names list of the privacy gate (§3.2) lives in the campaign repo: does it move with the first hermetic witness, or does main carry only the tripwire?
