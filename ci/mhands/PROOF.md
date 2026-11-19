# mhands · HIS HANDS OFF THE RUNNER — PROOF (forks rows 1162 / 1163, 19 Nov 2026 UTC)

CHECKPOINT · STOPPED at 2026-11-19T12:38Z · resume from step 4: write ci/mhands/run_mutants_mhands.mjs (kept as the record of the pause, his word 269)
RESUMED 2026-11-19 (his word 270) from that line; every step after it is below.

Branch `claude/mhands-build`, cut from `origin/main` at **`fb42118`** (`fb4211870093e6b8657655eb02ebcfc425f1eab1`, fetched
19 Nov 2026; `ci/mhands/BASE`). The spec is `ci/mwit/MWIT_SPEC.md` at **`88bf69d`** (branch `claude/mwit-spec`), read whole with its
ledger and its one sibling `ci/mwit/plant_day.mjs`; the clause designs read whole: B-hands:clicks-off (spec `:201-217`), B-hands:fresh-runner
(`:219-231`), UNITS row 7 (`:527`). The tip this proof describes is named in the ledger's last `ci` row and in the final message.

## Files (named, and only these)

`ci/witness/mhands/witness_hands.mjs` (the witness, UNITS row 7) · `ci/mhands/BASE` · `ci/mhands/LEDGER.jsonl` · `ci/mhands/PROOF.md` ·
`ci/mhands/run_mutants_mhands.mjs`. No organ file, no suite file (row 1162 (2): mmeter alone edits `scripts/organism_test.mjs`), no
`package.json`, never `.claude/settings.json`.

## Measured at the base (fb42118, 19 Nov 2026)

| Fact | Where |
|---|---|
| the tracked project settings carry no `permissions` key | `.claude/settings.json` (keys by `node -e`: `_comment, hooks, …, statusLine`) |
| a transcript's first human prompt, skipping meta, tool results and the /clear-/model rows | `scripts/study_scope.mjs:148` (`firstHumanPrompt`) |
| a human line's text, and the /clear slash pattern | `scripts/study_scope.mjs:638` (`humanText`) · `:645` (`SLASH_NOISE`) |
| the trigger list read from a skill's frontmatter; exact-match opener | `scripts/study_scope.mjs:129` (`learnTriggers`) · `:140` (`isLearnOpener`) |
| the transcript folder's slug | `scripts/study_scope.mjs:98` (`projectSlug`) |
| the runner skill's own trigger list | `.claude/skills/runner/SKILL.md:3` |
| a receipt witness is `node <tracked path> [plain args]`; green re-runs the SAME command (no `--day` passed) | `scripts/rung_receipt.mjs:224` · `:329` |
| the night factory's launch mark carries a unit, never a session id | `scripts/night.mjs:139` |
| a transcript's user rows carry `permissionMode`; tool-result rows carry `permissionDecision {decision, source, …}`, source `config` | this cloud session's own transcript, keys only (ledger row 4) |

The settings precedence and the two ignored modes are Claude Code's documented behaviour (code.claude.com/docs/en/settings.md "Settings
precedence" and "A value you set is ignored"; permission-modes.md; managed-settings.md), read by a docs subagent and cited in the
witness header. The transcript fields are **undocumented** (sessions.md) — FORK Fh3.

## The witness both ways (19 Nov 2026, by command; base = a local clone of fb42118 made with core.autocrlf=false)

```
node ci/witness/mhands/witness_hands.mjs --org . --base-org <clone fb42118>
  GREEN B-hands:clicks-off · build 14/14 plants at their exit · base RED: the base carries no ci/witness/mhands/witness_hands.mjs (the clause command cannot run)
  GREEN B-hands:fresh-runner · build 9/9 plants at their exit · base RED: the base carries no ci/witness/mhands/witness_hands.mjs (the clause command cannot run)
  GREEN BOUND · 3 file(s) differ fb42118..4064109, all under ci/witness/mhands/ or ci/mhands/
  GREEN LAST · 0 node process(es) naming mhands-plant-* survive
GREEN MHANDS his hands off the runner: no click in the settings chain or the runner's day, one fresh session per unit · 4 clause(s)   (exit 0)

node ci/witness/mhands/witness_hands.mjs --org <clone fb42118> --base-org <clone fb42118>
RED MHANDS · B-hands:clicks-off, B-hands:fresh-runner   (exit 1)

node ci/witness/mhands/witness_hands.mjs plants        (the suite member's door, row 1162 (2))
GREEN MHANDS plants · 23 plant(s) both ways over 2 clause(s)   (exit 0)

node ci/witness/mhands/witness_hands.mjs clicks        (this cloud)
UNREAD clicks · on the cloud: his user settings and transcripts are on his laptop (row 1162 (5), NAMED N6/N7)   (exit 2)
node ci/witness/mhands/witness_hands.mjs fresh         (this cloud)
UNREAD fresh · no --campaign (the launch record is campaign-side, NAMED N7)   (exit 2)
```

The plants (each a copied tree under `os.tmpdir()`, a planted HOME / managed folder / campaign / transcripts, read through the env
doors `MHANDS_HOME` and `MHANDS_MANAGED`, honoured only under `os.tmpdir()`):
- **clicks** — user bypass + skip key, clean runner day → 0 · user dontAsk → 0 · unset → 1 · bypass in the project file only (ignored) → 1 ·
  local default over user bypass → 1 · managed default over user bypass → 1 · bypass disabled by managed → 1 · bypass without the skip
  key → 1 · a hand decision on the runner day → 1 · a hand decision in a non-runner transcript → 0 · unparseable user file → 2 · no runner
  transcript → 2 · the home door outside tmpdir → 2 · the cloud with no door → 2.
- **fresh** — two units two sessions → 0 (and with brief hashes → 0) · two units one session → 1 · a /clear → 1 · a session beginning at
  another unit's brief → 1 · a brief hash mismatch → 1 · a transcript not on the machine → 2 · no launches.jsonl → 2 · no --campaign → 2.

## The mutants (19 Nov 2026, by command)

```
node ci/mhands/run_mutants_mhands.mjs
  KILLED  B-hands:clicks-off · read only the project file (the user-file-only plant goes 1)
  KILLED  B-hands:fresh-runner · dedupe by unit id instead of session id (the two-units-one-session plant goes 0)
  control · GREEN MHANDS plants · 23 plant(s) both ways over 2 clause(s)
run_mutants: 2 of 2 mutant(s) RED by the clause that names them · control GREEN
```

## Selftests and members touched

None. This is a ci-only unit (row 1162 (4)): no organ, no selftest and no suite member is edited, so no headline moves. The suite
itself, by command, on the build (19 Nov 2026):

```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      (build tree)
organism_test: 149 passed, 1 failed · ruled 0 · UNRULED 1 · LIVE 126 (hermetic: named, not run)   (exit 2)
  the one red: EVERY organ with a selftest is wired into a suite — orphaned: deck_lint, home_pin, probe, study_scope (the base red CI names, spec §1)
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      (the base clone, node_modules linked)
organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126   (exit 2)
  the same coverage red, plus the sandbox member twice (its tripwire recorded 2 of 4 attempts in a clone with a linked node_modules — a property of
  the clone, not of this unit: the build tree, where the files differ only under ci/, reads it green)
node scripts/models.mjs check
models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)   (exit 0)
```

## The law pack counts (row 1130 (2); 19 Nov 2026, by command, LF trees)

```
node scripts/lawpack.mjs gate      (BASE clone fb42118 and the build — the two outputs are BYTE-IDENTICAL, `diff` empty)
lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
  RED  jugad-literal-subject-list ROSE — 93, baseline 90.
  RED  depcruise_errors ROSE — 13, baseline 7.
lawpack: 2 RED
```

The build raises NO count: every count equals BASE. The two ROSE lines stand at BASE already (not this unit's; named for the architect).

## Where the spec and the rulings differ (the ruling wins)

1. **Cloud red-before.** Spec `:212` says clicks reads 1 (no setting this repo sees). Row 1162 (5): a fact only his laptop holds reads
   UNREAD. His user settings and runner transcripts are laptop facts, so on the cloud (`CLAUDE_CODE_REMOTE=true`, no door) clicks reads 2.
2. **The suite.** UNITS `:536-537` say every unit edits `organism_test.mjs`; row 1162 (2) overrules — this unit edits no suite file; its
   `plants` verb is the door the mmeter member walks.
3. **Paths.** The generic tail's `ci/mhands/witness_mhands.mjs` is read as `ci/witness/mhands/witness_hands.mjs` (the brief says so).

## Design choices the spec left open (each in the witness header)

- The settings chain is the documented one, managed included (managed-settings.json then managed-settings.d/*.json) — the spec named three
  files; managed outranks them all, so leaving it out could read green under a managed `default`.
- `bypassPermissions` needs `skipDangerousModePermissionPrompt` (the first interactive start's warning is itself a click) and no
  `disableBypassPermissionsMode: "disable"`.
- `clicks` with no `--day` judges the latest IST day any runner transcript touches (the receipt re-runs the command with no day).
- Where one half reads RED and another UNREAD, the read RED is reported (a read fact is never hidden behind a miss).

## FORKS

- **Fh1 · the no-prompt set.** `bypassPermissions`, `auto`, `dontAsk` (permission-modes.md "What runs without asking"). `dontAsk` asks
  nothing but DENIES what would prompt; `auto`'s classifier may fall back. (a) keep all three; (b) `bypassPermissions` only. Recommend (a):
  the real-day half catches any click a mode lets through.
- **Fh2 · the launch record (NAMED N7).** `fresh` reads `<campaign>/launches.jsonl` rows `{unit, session_id (the transcript id), at,
  brief_sha256?}` — a contract this witness declares, because the campaign's real record is not in this repo. (a) the campaign's launch
  verb writes this file; (b) the architect names the real path and fields and the reader follows. Without `brief_sha256` a session
  "begins at its unit" when its first prompt names the unit id as a word (weaker); recommend the launch verb record the hash.
- **Fh3 · what a click looks like in a transcript.** Undocumented format. Measured here: `permissionDecision.source` = `config` on every
  tool result of a session with no human at the prompt. Any other source counts as a hand (stricter). The value a human-answered prompt
  writes must be measured on his laptop (one runner transcript, keys only).
- **Fh4 · the cloud's runner.** A cloud-launched unit's transcript lives in its cloud container, never on his laptop, so `fresh` reads
  UNREAD for cloud units unless the campaign copies transcripts home. Decides it: N7.
- **Fh5 · the suite member's call.** This witness assumes the mmeter member runs `node ci/witness/<u>/<file> plants` with no other
  argument and reads exit 0 as green; mmeter is a parallel seat, so the call is not measured here.

## NAMED, not reached

N6 (his user `~/.claude/settings.json`), N7 (the campaign launch record and the runner transcripts), the `--settings` launch flag and any
`--permission-mode` flag on his runner (launch facts no file holds), `managed-settings.json` on his laptop
(`C:\Program Files\ClaudeCode\`).

## Ledger timing note

Ledger rows 1-7 carry `ts` values typed ahead of the clock (12:40-13:25Z) before the 12:38Z stop; the clock-read rows are the checkpoint
row and every row after it. Kept, not rewritten (L9); named here.
