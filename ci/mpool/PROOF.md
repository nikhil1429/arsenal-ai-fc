# MPOOL BUILD — PROOF

Unit **mpool**, build seat (forks rows 1062 / 1066). Branch `claude/mpool-build`, cut 18 Nov 2026 from
`origin/main` @ `b1fc984a3c14dcafb907f8acc71853a9c24f7665` (`git fetch origin main`, then a branch on that tip).
Spec: `ci/mpool/MPOOL_SPEC.md` on `claude/mpool-spec` @ `8d4d532`. Where the spec and the ruling text differ, the
ruling wins, and each difference is named in §2.

## 1. What landed on this branch (named files only)

| File | What |
|---|---|
| `scripts/usage_tap.mjs` | **new**: `statusline · panel · verdict · need · status · selftest`; exports `readReading`, `readRule`, `verdict`, `parseStatusline`, `readingPath`, `campaignRoot`. Sole writer of `usage_reading.json` in the campaign root, found ONLY through the env door `ARSENAL_CAMPAIGN_ROOT` (default absent) |
| `scripts/organism_test.mjs` | the hermetic loop's kept result for `usage_tap.mjs selftest` is JUDGED: assert `MPOOL · usage_tap selftest runs in the hermetic chain and exits 0 (forks row 1062)` (a read of `hermeticRuns`, never a second spawn) |
| `.claude/skills/runner/SKILL.md` | the runner twin (F8 C): one line after the "WINDOWS ARE NOT MEASURED" bullet (`usage_tap.mjs verdict`, by exit code) and one after "THE POOL IS HIS PANEL" (`usage_tap.mjs need`, his spoken numbers through `panel`) |
| `ci/mpool/witness_mpool.mjs` · `run_mutants_mpool.mjs` · `PROOF.md` · `LEDGER.jsonl` | the witness, its mutants, this proof, the ledger |

**F8: built C alone.** `scripts/day.mjs` does not exist on `origin/main` at the cut (`ls scripts/day.mjs` → No such
file). **A is OWED**: `day.mjs start` runs `usage_tap.mjs need` as one more owner call, once mday lands.

## 2. Where the ruling moved the spec (THE RULING WINS)

1. **F1 A** — the reading lives in the campaign root; the spec named the place, the build names the door:
   `ARSENAL_CAMPAIGN_ROOT`, default absent. Absent ⇒ `statusline`, `panel` and `need` write nothing and say so
   (ADDED (ii), witness WA.ii).
2. **F3 B** — the statusLine setting goes in the organism repo's project settings, NOT his user settings (the spec
   recommended A). It is not edited here: see the SETTINGS LINE.
3. **F4 A + rule 4** — the spec left the law home's shape open (its N6). The build reads `<root>/tools/model_law.mjs`
   **as text** for ONE contract line `POOL_READING_MAX_AGE_MIN = <whole minutes>` (never imported, never executed).
   No line ⇒ every verdict is `WAIT · rule unreadable`. The value (five hours, row 1062) is **not typed in this
   repo**; the law-home line is FORK F-b.
4. **F5 B** — the tap has NO percent line. The spec's rule 6 is dropped; the spec's W4.4 ("WAIT because a pct is over
   the line → no card") is re-planted as "WAIT because the window rolled → no card", and clause **F5** holds that a
   fresh, whole 99 % reading is GO.
5. **F6 B** — `verdict` exits 0 GO / 3 WAIT; that is the gate's read.
6. **F7 B** — `need` files only on WAIT for want of a source: no reading, no `read_at`, a future stamp, or a reading at
   or past the age bound. Rolled, half, or rule-unreadable files nothing (asking him would not change the answer).
7. **F9 A** — a reading with no reset time is judged by the age bound alone (clause F9).
8. **F10 A** — his spoken numbers become a reading only by the session running `panel`; `captains_call.mjs` is never a
   writer path into the reading.
9. **ADDED (i)** — not in the spec: the statusline verb exits 0 with one line, and a guard fires one measured boot
   before the ruled second if stdin never closes (clause WA.i).
10. **The mutants** — the spec put them on the Stryker lane; the brief rules `ci/mpool/run_mutants_mpool.mjs`. The
    spec's μ2.2 (off by one at the exact edge) cannot be planted on a real clock across processes, so the edge is held
    by the tap's own selftest (`W2.2 at the bound exactly → WAIT`, injected clock); the witness mutant for W2.2 loosens
    the bound instead.
11. Spec W3.3 (a stored GO cannot outlive its reading) is held by W3.2 (no GO key exists) plus W2.2 / W4.5.

## 3. The witness, both ways (last lines)

```
node ci/mpool/witness_mpool.mjs --org . --base-org <scratch clone of b1fc984>
GREEN MPOOL the usage tap · 31 clause(s)                                              (exit 0)

node ci/mpool/witness_mpool.mjs --org <scratch clone of b1fc984> --base-org <the same>
RED MPOOL · W1.1, W1.2, W1.3, W1.4, W1.5, WA.i, WA.ii, W2.1, W2.2, W2.3, W2.4, W2.5, W2.6, W2.7, W2.8, W3.1, W3.2, W3.4, W4.1, W4.2, W4.3, W4.4, W4.5, W4.6, F2, F5, F9, C, J, S   (exit 1)
```

The base clone was made with `git clone -c core.autocrlf=false --no-checkout` + `checkout --detach b1fc984`
(a clone, not a worktree: the repo rail refuses a bare worktree). The witness itself plants no git repo.
The clock-bound clause WA.i judges against the ruled one second plus the slowest of three bare node starts measured
in the same run (printed on the witness's first line).

## 4. The mutants

```
node ci/mpool/run_mutants_mpool.mjs --org . --base-org <scratch clone of b1fc984>
run_mutants: 31 of 31 mutant(s) RED by the clause that names them · control GREEN    (exit 0)
```

The LAST mutant (a detached node child naming the campaign root) needs `/proc` to be seen; on an OS without it the
runner prints SKIP for it and does not count it.

## 5. Touched selftests, before and after (headline lines)

```
usage_tap selftest — before: the file does not exist at b1fc984
usage_tap selftest — after:  usage_tap selftest 31/31 — all clauses hold

ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
  before (b1fc984, scratch clone, npm ci):  organism_test: 137 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
  after  (0e13338, this checkout, npm ci):  organism_test: 140 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)
```

- The one red on both is the base red `EVERY organ with a selftest is wired into a suite` — at the base it names
  `deck_lint, home_pin, probe, study_scope`; on the build it adds `usage_tap` (package.json is not a named file:
  FORK F-a). The CI verdict compares by assertion name, so it stays a base red, not a new one.
- The base's two other reds (`sandbox selftest exits 0` and the 50-members line it rolls into) are the scratch
  clone's location: the sandbox collar's negative controls aim at the live state path, which the clone does not have.
  The same selftest passes in this checkout and on the neutral machine.
- `+ MPOOL · usage_tap selftest runs in the hermetic chain and exits 0 (forks row 1062)` is new and green.

`node scripts/models.mjs check` → exit 0 (literal model names outside models.mjs: 0), 18 Nov 2026.

## 6. The neutral machine (curl, no token, `GET /repos/<owner>/<repo>/commits/<sha>/check-runs`)

| push | run | node 22 | node 24 |
|---|---|---|---|
| `0e13338` (the tap) | 44404092346 | cancelled (superseded by the next push) | cancelled |
| `b54552c` (the witness) | 44404561192 | 135156332871 success | 135156333223 success |
| `7693690` (the mutants) | 44405336983 | 135158937591 success | 135158938008 success |

The push carrying this file is read the same way; its ids are in the ledger and the seat's final message.

## SETTINGS LINE

The project `.claude/settings.json` key the runner lands apart, by hand, under a later row (row 1062 F3 B). This
branch never edits that file; the witness plants this object into its temp copy only.

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"$CLAUDE_PROJECT_DIR/scripts/usage_tap.mjs\" statusline",
    "padding": 0
  }
}
```

The command uses the same `$CLAUDE_PROJECT_DIR` shape as the hooks already in that file. The env door
`ARSENAL_CAMPAIGN_ROOT` is deliberately NOT in this object: its value is a path on his laptop that names a person, so
it cannot sit in a tracked file of a public repo (FORK F-c).

## 7. What a hermetic witness cannot see (owed to the runner, on his laptop, BEFORE the land branch is cut)

- **ADDED (iii)** — in a scratch dir, that the statusLine stdin of CLI **2.1.326** carries the `rate_limits` block (the
  spec measured 2.1.327 in a cloud seat). Present ⇒ the full unit lands. Absent ⇒ only the card fallback lands and the
  gap is a named red.
- **ADDED (iv)** — `usage_tap.mjs status` beside his spoken panel numbers, once; the difference is recorded.
- That a statusLine command receives `$CLAUDE_PROJECT_DIR` on his Windows CLI (the hooks do; the statusLine is not
  measured), and that `ARSENAL_CAMPAIGN_ROOT` reaches the CLI's environment.
- Spec N2 / M9: the statusLine runs only in a terminal CLI, not on the desktop Code tab.

## FORKS (files beyond the named ones — written here, never edited)

- **F-a** `package.json`: `usage_tap.mjs selftest` joins a suite string (`organism:selftest`) so the coverage law stops
  naming it orphaned. Until then the hermetic chain judges it through the organism_test assert above.
- **F-b** the campaign law home `<root>/tools/model_law.mjs` gains ONE line,
  `export const POOL_READING_MAX_AGE_MIN = 300;` (row 1062 F4, "five hours until a row moves it"), under that file's own
  writer. Until it exists every verdict is WAIT · rule unreadable.
- **F-c** `ARSENAL_CAMPAIGN_ROOT` set in his laptop's user environment (not in any tracked file).
- **F-d** the SETTINGS LINE into the project `.claude/settings.json` (F3 B), by hand under a later row.
- **F-e** the campaign launch gate reads `usage_tap.mjs verdict` by exit code (F6 B), campaign-side.
- **F-f** F8 A: `scripts/day.mjs start` runs `usage_tap.mjs need` once mday lands.
- **F-g** the hang caps (the witness's sync-child cap and the mutant runner's cap) are multiples of times measured in
  the run. They cap a hung child, they never judge a clause; the one clock-bound judgement (WA.i) uses the ruled second
  plus a measured node start, with no ratio.
