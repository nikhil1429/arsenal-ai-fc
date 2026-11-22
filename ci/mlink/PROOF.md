# UNIT mlink · PROOF (forks rows 1311 (4) / 1312) — branch claude/mlink-build

A build seat, no spec. Measured 22 Nov 2026 (UTC) in a cloud build seat (linux, node v22.23.5); every line names the command that produces it.

## Base
- Cut from main `84cbc03126eddb85c7d5cf54b51610068800315c` (`git fetch origin main`, `git checkout -b claude/mlink-build FETCH_HEAD`), written to `ci/mlink/BASE`.

## The fault, re-measured at the cut (22 Nov 2026)
- `scripts/organism_test.mjs:2784` at 84cbc03, in `sandbox()`: `if (existsSync(join(ROOT, "node_modules"))) cpSync(join(ROOT, "node_modules"), join(d, "node_modules"), { recursive: true });`
- On linux, `cpSync` of a node_modules that is itself a dir symlink re-makes the link (dest is a symlink to the link's target): no throw, no copy (a node one-liner on a planted `/tmp` link, 22 Nov 2026). So the fault only bites under win32's rule: node's cp re-makes a met link through `symlinkSync` with no type, and a non-junction symlink needs a privilege his laptop does not hold (the runner's EPERM, `node:internal/fs/cp onLink`).
- Hence the witness's WIN32 door (below): on a non-Windows host it emulates exactly that rule; on a Windows host it adds only the privilege rule to the host as it is.

## The fix (named files only) — `scripts/organism_test.mjs`
- New helper `linkNodeModules(src, dest)` at `scripts/organism_test.mjs:2789`: `symlinkSync(realpathSync(src), dest, process.platform === "win32" ? "junction" : "dir")`. Its header comment (`:2779-2788`) cites rows 1311 (4) and 1312 and keeps the old line struck beside it (`:2787`), never deleted.
- The copy line, now `scripts/organism_test.mjs:2797`: `if (existsSync(join(ROOT, "node_modules"))) linkNodeModules(join(ROOT, "node_modules"), join(d, "node_modules"));` Every other line of the suite is byte for byte (`git diff 84cbc03 HEAD -- scripts/organism_test.mjs`: one line replaced, the helper and its comment added).
- The choice off win32, measured and named: a **dir symlink**, not the old copy. Measured: the old line on a real folder (the neutral machine's `npm ci` tree) made a full copy per sandbox; on a link it re-made the link. A dir symlink to the realpath makes no copy on any platform, and the witness's L:real-target reads the real folder's marker whole after the suite's own rm of its run temp dir (the sandbox inside it) on both doors.

## Every other copy in the suite that can meet a link to node_modules (named, none edited) — at the tip
- `scripts/organism_test.mjs:2459` (mherm W3 tree): `cpSync` per `git ls-files` entry, no `recursive`. It meets node_modules only if node_modules is TRACKED; measured once by accident on a scratch tree whose `git add -A` tracked the link: `MODE hermetic` threw `Recursive option not enabled, cannot copy a directory: …/node_modules/`. In a real clone node_modules is gitignored, so it never meets it. Named, not edited.
- `scripts/organism_test.mjs:2461` (mherm, a plain tree): `cpSync(ROOT, tree, { recursive, filter })`, the filter drops `node_modules` and `.git` before descent. Cannot meet it.
- `scripts/organism_test.mjs:2464` (mherm): `symlinkSync(join(ROOT, "node_modules"), …, win32 ? "junction" : "dir")` — a junction, so no EPERM; its target is ROOT's node_modules lexically (a junction to a junction when ROOT's is one). Named as FORK F2, not edited.
- `scripts/organism_test.mjs:2795` (`sandbox()`): `cpSync` of scripts, dressing-room, learning-layer, package.json. None holds node_modules. Cannot meet it.
- `scripts/organism_test.mjs:3241` (the WITNESSES member): links a junction to ROOT's node_modules into each tree it builds. Named, left as the brief says.
- `scripts/organism_test.mjs:3252` (the WITNESSES member): `cpSync` of the `ci/<unit>` dir. No node_modules there. Cannot meet it.

## The unit witness, both ways (22 Nov 2026) — `node ci/mlink/witness_mlink.mjs --org <tree> --base-org <tree>` (LF trees, no .git)
- head (HEAD) vs base (84cbc03): `GREEN MLINK the sandbox links node_modules to the REAL folder (a junction at the win32 door), no copy through a link; the base copies through it (EPERM at the win32 door) · 5 clause(s)` (exit 0)
  - L:no-copy · head native `symlinkSync(dir) → link`, win32 `symlinkSync(junction) → link` · base native `cpSync → link`, win32 `cpSync threw EPERM → absent` → HOLDS
  - L:real-target, L:junction → HOLDS (same plants); BOUND · 3 file(s) differ, every one named → HOLDS; LAST → HOLDS
- base read as head (`--org <base> --base-org <base>`): `RED MLINK · L:no-copy, L:real-target, L:junction` (exit 1)
- bare form, head (`--org <head>`, no --base-org): `GREEN MLINK bare: the head's sandbox links node_modules to the REAL folder (a junction at the win32 door), no copy through a link · 4 clause(s)` (exit 0); BOUND reads `not judged: no --base-org (row 1307 (1)); never against a frozen sha`.
- bare form, base: `RED MLINK · L:no-copy, L:real-target, L:junction` (exit 1).
- The plant: the tree's scripts/ and package.json copied under os.tmpdir(), its node_modules a dir symlink (a junction on win32) to a REAL folder elsewhere under the temp dir. The plant's own suite runs `path` with a probe preloaded by `node --import` (not NODE_OPTIONS): it reads the one call that makes `<arsenal-test-*>/node_modules` and what lies there, then ends the child; the suite's own exit hook removes its run temp dir.

## Mutants (22 Nov 2026) — `node ci/mlink/run_mutants_mlink.mjs`
- `run_mutants: 3 of 3 mutant(s) RED by the clause that names them · control GREEN` — M1 the old cpSync restored (RED by L:no-copy) · M2 the realpath dropped, a link to the link (RED by L:real-target, alone) · M3 the win32 branch a plain symlink with no type (RED by L:junction).

## The suite (22 Nov 2026) — `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, each on an LF tree (git init, core.autocrlf=false, node_modules a dir symlink to this clone's `npm ci` folder — the shape of the fault, on linux)
- base 84cbc03: `organism_test: 173 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)` (exit 0)
- build HEAD: `organism_test: 173 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 125 (hermetic: named, not run)` (exit 0)
- (A first pass ran both trees at once and read 5 and 3 reds: the scratch trees tracked the node_modules link — see :2459 above — and two clause witnesses read `86 of 86` / `27 of 27` yet FAIL under the contention; each re-read GREEN alone and the sequential runs above are the measurement.)
- `node scripts/organism_test.mjs selftest` (its headline, before and after, 22 Nov 2026): `organism_test is itself the test suite — run \`node scripts/organism_test.mjs all\`` both times.

## The law pack counts (row 1130 (2)) — `node scripts/lawpack.mjs gate` on LF trees (git init + add, node_modules linked), 22 Nov 2026
- base 84cbc03 and build HEAD, byte-identical output: `lawpack · 1965 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 90 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 7` · `lawpack: GREEN — no law's finding count rose, and every rule is on disk`. No count rose.

## models
- `node scripts/models.mjs check`: exit 0 (22 Nov 2026).

## The WITNESSES member (row 1311 (4) brief item 4)
- `GITHUB_ACTIONS=true GITHUB_WORKSPACE=<clone> ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs witnesses`: running at this checkpoint; its count lands at the next checkpoint.

## FORKS
- F1 · the effort receipt tool `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository (its error is named in the seat's final message): A · the runner carries it · B · drop the step for cloud seats.
- F2 · `scripts/organism_test.mjs:2464` (mherm) links a junction to ROOT's node_modules LEXICALLY, so on a tree whose node_modules is a junction it makes a junction to a junction (works, no EPERM, but not the real folder): A · leave it (it does not throw) · B · route it through `linkNodeModules` in a later unit.
- F3 · the WIN32 door is an emulation off Windows (process.platform reads win32; the privilege rule thrown by the probe). Not measured on a Windows host by this seat: A · the runner re-runs the witness on his laptop (both doors run there natively, the WIN32 door adding only the privilege rule) · B · accept the emulation.
- F4 · off win32 the sandbox's node_modules is now a dir symlink where it was a copy (on the neutral machine's real folder): A · keep (no copy anywhere, measured above) · B · keep the old copy off win32 when the source is a real folder.

CHECKPOINT · 1 at 2026-11-22 (UTC) · the fix, the witness both ways, the mutants · resume from: the WITNESSES member count, then the effort receipt.
