# MLAW SPEC — unit mlaw (forks row 1120 (1) F4 A and (3)), cloud spec seat

Written 19 Nov 2026 by the cloud spec seat (unit mlaw). A SPEC, not a build: nothing on main moved, no PR, no live
model call. Branch `claude/mlaw-spec`, cut from `origin/main` **`224f9b9`** (`git fetch origin main && git checkout -b
claude/mlaw-spec FETCH_HEAD`, 19 Nov 2026 UTC). The clone is shallow: `git rev-list --first-parent --count origin/main`
read 49 on 19 Nov 2026, its oldest commit `1b3b2ba`, where the jugad baseline already reads 90. Every number below is a
measurement made 19 Nov 2026 on linux, node 22, on LF trees; its command is beside it and its row is in
`ci/mlaw/LEDGER.jsonl`. Read first, not re-measured: `ci/mrt/MRT_SPEC.md` at `2c66b26` (the depcruise 7 → 13 bisect,
first red `669200d` mlv1) and `ci/mrf/MRF_SPEC.md` at `13d2728` (A2 red in the FULL profile only, first red `9f6f9ab`).
The scratch scripts are committed as `ci/mlaw/tools/*.mjs` (they build no organ and write only under `os.tmpdir()`).

## 0. HEADLINE

1. **No single commit raised the literal-subject-list count from 90 to 93. Three commits did, one each.** Every
   first-parent commit was measured (49 of 49, not a bisect):
   `76b0626` B1 + mrdr 90 → 91 · `4d166d3` mdone 91 → 92 · `902b6cc` mpool 92 → 93. The FIRST is **`76b0626`, unit
   B1 + mrdr (forks rows 939 / 1006 (2) / 1012 / 1022)**. That is the same commit that made the law pack LIVE in the
   hermetic profile. So the commit that switched off the only neutral reader of the law pack was also the first
   commit the law pack would have refused.
2. **Why the red reached main with no machine reading it:** the neutral machine (`.github/workflows/suite.yml:68`,
   `ORGANISM_TEST_PROFILE: hermetic`) never enters mode `lawpack` (`organism_test.mjs:213` names it LIVE, `:2809` skips
   it) and never spawns `lawpack.mjs selftest` (`:120`). The landing verb reads that machine's verdict and nothing
   else (`land.mjs:127-135` → `ci_verdict.mjs`). The pre-commit hook runs no gate of it (`hooks/pre-commit:27,35`). The
   only reader left is the watchman's nightly FULL run on his laptop (`watchman.mjs:813`). It reads the exit code
   only (`:818`), and that exit was already non-zero from other reds (mrf §2: 21 failed in the full profile at
   `a18c167`), so a law pack red adds nothing it can see.
3. **The LIVE reason is not true for the gate's verdict.** `lawpack.mjs gate` printed byte-identical output on a tree
   with the state directory ABSENT and on the same tree with its tracked state present (§1.4). The only state bytes it
   reads come from the raw-NUL scan over `git ls-files` (`lawpack.mjs:543-557`). So the mode can ride the hermetic
   profile.
4. **Q2 (the class):** see §2. (Census in progress at this push.)

## 1. QUESTION 1 — the first commit at which the count went 90 → 93, and why it reached main unread

### 1.1 Recipe

- **Trees:** for each sha, `git -c core.autocrlf=false archive --format=tar <sha>` extracted under `os.tmpdir()` by a
  node script (`ci/mlaw/tools/tree.mjs`), with the state directory **excluded** (`--exclude`), the repo's
  `node_modules` symlinked in (`npm ci` once; the lockfile pins `@ast-grep/cli`, `knip`, `dependency-cruiser`), then
  `git init` and one commit inside, because `rawNulFiles` lists the tree with `git ls-files` (`lawpack.mjs:546`).
  Without the commit the gate printed `fatal: not a git repository`. That was measured once and then fixed in the recipe.
- **Command per tree:** `node scripts/lawpack.mjs gate`. The count is read off its `findings:` line. The named sites
  come from the tree's own exports: `judgeJugad(scan().matches)` (`lawpack.mjs:194`, `:283`).
- Scratch scripts: `tree.mjs` · `lawgate.mjs` · `jugadset.mjs` · `lawstate.mjs`.

### 1.2 The census over first-parent main (`git rev-list --first-parent --reverse origin/main`, all 49)

`node ci/mlaw/tools/lawgate.mjs $(git rev-list --first-parent --reverse origin/main)`. Each run took 3.1 to 3.7 s
(19 Nov 2026).

| Commits (first-parent order) | jugad | depcruise | gate |
|---|---|---|---|
| `1b3b2ba` … `d0c8c96` (19 commits) | 90 | 7 | GREEN |
| **`76b0626`** … `009f52e` (10) | **91** | 7 | 1 RED |
| `669200d` (mlv1) | 91 | **13** | 2 RED (MRT's bisect, same number) |
| **`4d166d3`** … `3824171` (13) | **92** | 13 | 2 RED |
| **`902b6cc`** … `224f9b9` (6) | **93** | 13 | 2 RED |

Last line at head `224f9b9`: `lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)` (19 Nov 2026).
The rise is monotone: no step falls, and `jugadset.mjs` shows that no finding left at any step (GONE is empty at
every boundary).

### 1.3 What each step added (`node ci/mlaw/tools/jugadset.mjs d0c8c96 76b0626 009f52e 4d166d3 3824171 902b6cc 224f9b9`)

| Step | Commit · unit · row (its message) | The new finding (site at head `224f9b9`) |
|---|---|---|
| 90 → 91 | `76b0626` · **B1 + mrdr** · forks rows 939 / 1006 (2) / 1012 / 1022. The message: "scripts/ci_verdict.mjs = the seat's" | `scripts/ci_verdict.mjs:106` `export const REQUIRED_LEGS = [<2 names>]`. These are the two job names of `suite.yml`'s matrix, typed as literals |
| 91 → 92 | `4d166d3` · **mdone** · forks row 1051 ("scripts/done.mjs (new)") | `scripts/done.mjs:41` `const SURFACES = [<2 names>]`. These are two organ file names, typed (the ledger site at the step was `:40`) |
| 92 → 93 | `902b6cc` · **mpool** · forks row 1099 ("scripts/usage_tap.mjs … from claude/mpool-build b6cb4a9") | `scripts/usage_tap.mjs:51` `const LAW_HOME = [<2 names>]`. These are two path segments, typed |

None of the three commit messages names the law pack, the jugad law or a waiver. None of the three lines carries a
`law-waiver:jugad` marker (`lawpack.mjs:300`, `waived(src, m.line, "jugad")`). `BASELINE["jugad-literal-subject-list"]`
is still 90 at head (`lawpack.mjs:129`).

### 1.4 Is the law pack's verdict a function of his state? (`node ci/mlaw/tools/lawstate.mjs 224f9b9`)

On one sha, two trees: state ABSENT (0 entries), and the sha's tracked state copied in by the node script (57
entries, never printed).

```
{"sha":"224f9b9","state_entries":0,"exit":1,"out_sha256":"145ddf2bda9ff572","last":"lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)"}
{"sha":"224f9b9","state_entries":57,"exit":1,"out_sha256":"145ddf2bda9ff572","last":"lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)"}
```

The outputs are equal. The scan paths are `scripts` and `hooks` (`lawpack.mjs:194`, depcruise `:581`). The import-graph
judge covers `scripts` and `hooks` (`:439`). The one reader of state bytes is `rawNulFiles` (`:543-557`). It reads
every tracked file with a text extension, his state included, and looks for byte 0. That is the "437,917 state reads"
of `organism_test.mjs:213`. The reads are real, but the verdict does not depend on them unless a state file carries a
raw NUL.

### 1.5 Which machine runs the law pack, in which profile, and which landing verb reads it

| Reader | Profile | Does it run the law pack? | Does a landing verb read it? |
|---|---|---|---|
| The neutral machine, `.github/workflows/suite.yml:68` (`ORGANISM_TEST_PROFILE: hermetic`), `:113` / `:133` / `:140` (`organism_test.mjs all`) | hermetic | **No.** Mode `lawpack` is in `LIVE_MODES` (`organism_test.mjs:213`), and `main()` skips it at `:2809` with `LIVE MODE lawpack`. `lawpack` selftest is in `LIVE_SELFTESTS` (`:120`) | **Yes, but only its verdict:** `land.mjs:127-135` `verdictAt(t)` → `ci_verdict.mjs`. The law pack is not in it |
| `npm test` = `node scripts/organism_test.mjs all` (`package.json` `scripts.test`) at his console | full | Yes: `lawpack()` `organism_test.mjs:2690-2700` runs `lawpack.mjs gate` | No verb reads it |
| The watchman's nightly sweep, `watchman.mjs:803-829` | full (no profile env) | Yes, inside `all` | It reads `r.status !== 0` only (`:818`). That exit is already non-zero from other full-profile reds (MRF §2), so a law pack red changes nothing it reads. Not a landing verb |
| `hooks/pre-commit` | — | No: it runs `archivist.mjs tripwire` (`:27`) and `rails.mjs orders` (`:35`) only | — |

There is a second wall, and it would hide the red even if the mode ran hermetic. The B1 verdict is GREEN iff no member
is red at HEAD **that is not red at the base**, judged BY NAME (`suite.yml:34-37`, `ci_verdict.mjs:35-42`). The law
pack is ONE assert with ONE fixed name (`organism_test.mjs:2698`). Once it is red at a base, each later rise (91 → 92
→ 93, and depcruise 7 → 13 at `669200d`) carries the same name and is red on both sides. So it reads as a **base red**
(a warning), never a new one. A rise in a law that is already over its baseline has no name of its own.

## 2. QUESTION 2 — by census, which full-profile members can ride the hermetic profile on planted state

(Census in progress at this push: next step.)

CHECKPOINT · step 1 (Q1) pushed 2026-11-19 UTC · resume from §2 census
