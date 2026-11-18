# MPOOL — the pool reads itself, and a stale reading says WAIT

Unit **mpool** · forks rows 1045 and 1052 · spec seat · base `origin/main` @ `669200d` (fetched 18 Nov 2026).
His word 240 (the day has one start and one end, nothing for him to remember) and his word 243 (*keep working
with runner continuously, do not sit idle at any moment*) are the two words this unit serves. A runner that waits
on him to post his panel sits idle. A runner that launches on an old panel reading burns his pool blind.

**Headline.** On this base **no code reads his account's usage meter at all**. The launch arithmetic is notes
(`.claude/skills/runner/SKILL.md:104`), and the pool is "his panel, recorded whenever he posts one"
(`:111`): that is an act of his. The one gauge the organism has, `token_vitals.json`, is an **estimate of the
organism's own spend** against guessed capacities, and it cannot see a runner session or his study session.
Claude Code itself already hands both numbers and both reset times, every turn, to one place: **the statusLine
command's stdin** (`rate_limits.five_hour` / `rate_limits.seven_day`: `used_percentage` + `resets_at`). The spec
adds **one tap**, `scripts/usage_tap.mjs`. It is the sole writer of ONE reading file, which carries its own
`read_at`. It exports ONE pure verdict, `GO | WAIT`, computed at read time and **never stored**. A reading with
no source, an old reading or a reading whose window has rolled reads **WAIT**. When no source exists on his
machine, the fallback is ONE card at the learn start asking him the two numbers. His spoken answer becomes a
reading through the session, never through a command he types.

This file builds nothing. Every repo fact is `file:line` at the base. The facts about Claude Code itself were
measured on the CLI in this cloud seat (`claude --version` → `2.1.327 (Claude Code)`, 18 Nov 2026). What I
could not reach is under **NAMED, NOT GUESSED**.

---

## 0. The measurement, at the base and in this seat's CLI

| # | Fact | Where |
|---|---|---|
| M1 | The runner's gate arithmetic is ruled NOT MEASURED: *"the gate's five-hour and weekly arithmetic are NOTES"* | `.claude/skills/runner/SKILL.md:104-106` (row 131) |
| M2 | The pool is his panel, recorded when HE posts it, never asked inside a window | `.claude/skills/runner/SKILL.md:111` |
| M3 | `POOL.json` and the launch gate are the campaign's limit files. They live under the campaign root, **outside this repository**. A labour pack may never write them | `.claude/skills/runner/SKILL.md:50-52`, `:177`; the campaign root is named at `:85-88` |
| M4 | The runner never launches while the pool reads STOP or a gate check says NO-GO | `.claude/skills/runner/SKILL.md:223` |
| M5 | The only usage gauge in this repo is `token_vitals.json`, written by `brain.mjs`. It sums the organism's own `brain_ledger.jsonl` against **estimated** capacities. A runner session's or his study session's spend is not in that ledger | `scripts/brain.mjs:126` (path) · `:1084-1088` (`tokenVitals`) · `:1119-1120` (`window_5h`, `week_7d`) · `:139` (default capacities) · `scripts/limits.mjs:452` (weekly capacity: an estimate, origin "external") |
| M6 | The organism's brain is switched off by his order (CLAUDE.md, 20 Aug 2026), so `token_vitals.json` is not refreshed: it is stale by construction | `CLAUDE.md` "THE ORGANISM IS SWITCHED OFF" line |
| M7 | A reset time reaches the organism only as the TEXT of a refused `claude -p` call (`resets 7am`). That is a model call, and it happens only once the limit is already hit | `scripts/brain.mjs:2375` (`LIMIT_RE`) · `:2548` (`limit_hit` from the error text) |
| M8 | **Claude Code's statusLine stdin carries both numbers and both resets.** The CLI's own schema text, verbatim: `rate_limits.five_hour.used_percentage` (0-100) · `rate_limits.five_hour.resets_at` (Unix epoch seconds) · the same under `seven_day`. Each is *"present only while the API reports it and its resets_at has not passed"*, and the block arrives *"after first API response"* | CLI 2.1.327 binary `/opt/claude-code/bin/claude`, byte offset 319719798 (`grep -aob '"rate_limits": {             // Optional'`) |
| M9 | **The statusLine does not exist on the desktop Code tab** (verified 6 Sep, the repo's own record) | `learning-layer/VISUAL_CONTRACT.md:201-202` |
| M10 | No statusLine is configured in the project settings | `grep -n statusLine .claude/settings.json` → no line |
| M11 | The `/usage` panel's own source is an account endpoint, `/api/oauth/usage`, called with the signed-in OAuth credential | the same binary: `grep -aoE "api/oauth/usage[^\"']{0,40}"` |
| M12 | A session transcript carries no rate-limit field on an ordinary turn. This seat's own transcript holds the keys `type operation timestamp sessionId … requestedModel … effort …` and none of them is a usage percent or a reset | `~/.claude/projects/<cwd>/<session>.jsonl`, key census in this seat (ledger act `measure-transcript`) |
| M13 | The hook payloads (`UserPromptSubmit`, `Stop`, `SessionStart`, …) carry no `rate_limits`. A binary grep for a hook-input schema naming it found none | the same binary; **weak evidence**, see N3 |
| M14 | The repo's age law already exists: **vintage is the PAYLOAD's newest stamp, never mtime**, and a stamp in the future is never vintage | `scripts/brain.mjs:1631-1635` · selftest `:6930-6933` |
| M15 | ONE card: `captains_call.mjs` is the sole writer of `captains_call.json` (`:21`). `file` is its filing door (`:1761`). A loop must key its card (`:341`). SessionStart deals ONE card in every session | `scripts/captains_call.mjs:21`, `:341`, `:1761` · `scripts/turn_hook.mjs:302` |
| M16 | The learn start has a code path on the mday build: `turn_hook.mjs` sends a leading `/learn` to `day.mjs start` | branch `claude/mday-build` tip `ba842cf`: `scripts/turn_hook.mjs:201`, `scripts/day.mjs:91` (`start`) · `:184` (`brief`) |

**What M5-M13 add up to (P1's answer).** Exactly ONE source on his laptop hands code both numbers and both resets
with no act of his: the statusLine stdin (M8). It runs only where a statusLine runs (M9: not the desktop Code
tab). `token_vitals.json` (M5) is a reading of the organism's spend, not of his plan's meter: **NOT READABLE as
the pool**. The `/usage` endpoint (M11) is readable only by code that holds his OAuth credential: a fork (F2),
not recommended. Transcripts (M12), hooks (M13) and the `claude -p` refusal text (M7) are **NOT READABLE**
for the percents. M7 gives a reset only on a refusal, through a model call this seat may not make.

---

## 1. The design

```
scripts/usage_tap.mjs statusline        ← the statusLine command: reads stdin JSON, writes the reading, prints one line
scripts/usage_tap.mjs panel --five <n> --week <n> [--five-reset <t>] [--week-reset <t>]
                                        ← run BY THE SESSION when he SPEAKS the two numbers (P4); he types nothing
scripts/usage_tap.mjs verdict           ← read-only: GO | WAIT + why, one line, exit 0 / 3
scripts/usage_tap.mjs need              ← read-only on the reading; if WAIT-for-no-source, files the ONE keyed card through captains_call.mjs
scripts/usage_tap.mjs status | selftest
export function readReading(path)       ← parse only, never throws
export function verdict(reading, now, rule)   ← PURE: { go: bool, why, age_min, five, week, resets }
```

**The reading file** (`usage_reading.json`, sole writer `usage_tap.mjs`, declared in its header the way every
owner does) holds ONE object:
`{ v, source: "statusline"|"his-panel", read_at, five: {pct, resets_at}|null, week: {pct, resets_at}|null, cli_version|null, session_id|null }`.
It holds **no GO field**. `verdict()` is the only producer of GO, and it runs at the moment of reading (P3).
Where the file lives is fork F1. It lives **outside this repository** in every option, so data stays private.

---

## 2. P1 to P5: touch points, path, witness clauses, mutants

The witness is `usage_tap.mjs selftest`, joined to the hermetic chain of `scripts/organism_test.mjs`
(`:72-83`, the `hermetic` profile). Every plant runs in a temp dir under `os.tmpdir()` with an injected clock.
No plant reads his live files. **RED on base** means the clause against `669200d`, where there is no tap and the
clause falls back to today's path (the panel posted by hand; `token_vitals.json` as the only gauge). **GREEN on
build** means the same plant with the tap in place.

### P1: each number read by code with no act of his, or measured NOT READABLE

- **Touches.**
  - `scripts/usage_tap.mjs` (**new**). Its `statusline` verb reads stdin (the M8 schema) and writes the reading
    with `source:"statusline"`, `read_at` = the tap's clock, and the epoch `resets_at` turned into ISO. It prints
    a short status line back to the CLI (`5h <pct>% · wk <pct>% · <age>`), so the statusLine stays useful to a
    human who looks at it.
  - **The statusLine setting** (F3): a `statusLine` command `node <repo>/scripts/usage_tap.mjs statusline`. Per
    M10 it is not in the project settings today. This seat may not touch `.claude/settings.json`, so it is a fork.
  - `scripts/brain.mjs` is **unchanged**. `token_vitals.json` keeps its meaning (the organism's own spend) and is
    named in the tap's header as NOT a pool source, with M5 as the reason.
- **Path.** Any CLI session on his laptop (the runner's, a seat's, a terminal `/learn`) → after each API response
  the CLI runs the statusLine → `usage_tap.mjs statusline` → atomic write (tmp + rename) of the reading. No act
  of his, no model call, no network call.
- **Clauses.**
  - **W1.1** stdin with both windows → the reading holds both pcts, both resets (ISO), `source:"statusline"`, and a `read_at` equal to the injected clock. *Base RED* (no tap; the only gauge is M5's estimate) · *build GREEN*.
  - **W1.2** stdin with `rate_limits` absent (the CLI's own "Optional", M8: before the first API response, or a non-subscriber) → **no write**; the previous reading is untouched (bytes and mtime). *Base RED* (no tap) · *GREEN*.
  - **W1.3** stdin with only `five_hour` → `week:null` is written, never a zero. *Base RED* · *GREEN*.
  - **W1.4** malformed stdin, or pct outside 0-100, or a non-number → no write, one line on stderr, exit 0 (a statusLine must never break the CLI). *Base RED* · *GREEN*.
  - **W1.5** Static: the tap never reads `token_vitals.json` and never imports `brain.mjs`. *Base GREEN* by absence; it must stay GREEN.
- **Mutants.**
  - μ1.1 write `five.pct` from `seven_day` → W1.1 RED.
  - μ1.2 write an empty reading when `rate_limits` is absent → W1.2 RED.
  - μ1.3 default a missing window to `{pct:0}` → W1.3 RED.
  - μ1.4 let a parse error throw → W1.4 RED (non-zero exit).
  - μ1.5 fall back to `token_vitals.json` when stdin has no block → W1.5 RED.

### P2: the reading's age is part of the reading, and a stale one reads WAIT, never GO

- **Touches.** `usage_tap.mjs` `verdict(reading, now, rule)`, pure. Age is `now − read_at` **from the payload,
  never the file's mtime** (M14's law, the same shape). The reading is WAIT when **any** of these holds:
  1. there is no reading, or it does not parse;
  2. `read_at` is in the future (clock skew; M14: a future stamp is never vintage);
  3. the age is at or past the ruled age bound. That bound is the one row 1052 states for the reading of row 1045.
     It is **read from its law home, never typed in the tap** (F4 names the home);
  4. `now ≥ five.resets_at`: the window the reading measured has rolled, so its percent describes a window that is
     gone. This is the CLI's own rule (M8, *"present only while … its resets_at has not passed"*) applied at read time;
  5. `five` or `week` is null (a half reading is never GO);
  6. a pct is at or above the line the pool table sets. That line, like the age bound, is **read from the
     campaign's pool table, never typed** (F5).

  Otherwise the reading is GO. Every WAIT carries its reason and the age in minutes, so one line says why.
- **Clauses.**
  - **W2.1** A fresh reading, both windows under the line → GO. *Base RED* (no verdict exists; M1: notes only) · *GREEN*.
  - **W2.2** The same reading with the clock moved past the age bound → **WAIT · stale**. *Base RED* · *GREEN*.
  - **W2.3** A file re-written NOW (fresh mtime) that carries an old `read_at` → WAIT · stale (the payload decides, M14). *Base RED* · *GREEN*.
  - **W2.4** `read_at` in the future → WAIT · future stamp. *Base RED* · *GREEN*.
  - **W2.5** `now` past `five.resets_at` while still inside the age bound → WAIT · window rolled. *Base RED* · *GREEN*.
  - **W2.6** `week:null` → WAIT · half reading. *Base RED* · *GREEN*.
  - **W2.7** No age-bound home is readable → WAIT · rule unreadable (never a default number). *Base RED* · *GREEN*.
  - **W2.8** Static: `usage_tap.mjs` holds no numeric literal used as an age, a percent line or a duration. It is checked by a source scan in the selftest, the same way models.mjs checks its own model literals. *Base GREEN* by absence; kept.
- **Mutants.**
  - μ2.1 measure age from `statSync().mtime` → W2.3 RED.
  - μ2.2 `age <= bound` (off by one at the edge) → W2.2 RED at the edge plant.
  - μ2.3 drop the rolled-window test → W2.5 RED.
  - μ2.4 treat a null window as zero → W2.6 RED.
  - μ2.5 hard-code a fallback bound → W2.7 and W2.8 RED.

### P3: the launch gate and the pool file keep their one writer, and nothing writes them to read GO

- **Touches.**
  - `usage_tap.mjs` writes only `usage_reading.json`.
  - The campaign's launch gate **reads** `verdict()`: it imports the export, or runs `usage_tap.mjs verdict` and
    reads the exit code. That is a read in the gate's own code. The edit is campaign-side, under its own writer and
    adoption law (`.claude/skills/runner/SKILL.md:143-146`), so it is fork F6.
  - `POOL.json` keeps its writer. When the runner records a pool line, it may **cite** the reading
    (`source`, `read_at`) through that writer's own verb. The tap never opens `POOL.json` for write.
- **Clauses.**
  - **W3.1** Static: `usage_tap.mjs` contains no write call (`writeFileSync`, `renameSync`, `appendFileSync`, a
    stream) whose target is anything but its own reading path. The selftest's source scan resolves each write call's
    path constant. *Base GREEN* by absence; it must stay GREEN.
  - **W3.2** The reading file holds no key named `go`, `verdict`, `status` or `launch`. *Base RED* (no file) · *GREEN*.
  - **W3.3** A reading that was GO at write time, read again after the age bound → WAIT. The GO was never stored, so it cannot outlive its reading. *Base RED* · *GREEN*.
  - **W3.4** `verdict` run twice on the same inputs → the same answer, and the files under the temp dir are byte-and-mtime identical (a read writes nothing). *Base RED* (no verb) · *GREEN*.
- **Mutants.**
  - μ3.1 the tap writes `go:true` into the reading → W3.2 RED, and W3.3 RED when a reader trusts it.
  - μ3.2 `verdict` stamps a "last verdict" file → W3.4 RED.
  - μ3.3 the tap opens a `POOL.json` path → W3.1 RED.

### P4: no source ⇒ ONE card at the learn start asking the two numbers, never a typed command

- **Touches.**
  - `usage_tap.mjs need` (**new**): a read of the reading and nothing else. On `WAIT` **for want of a source**
    (no reading at all, or one older than the age bound with no statusLine row in the window, per F7) it files ONE
    card through the owner's door: `captains_call.mjs file --line "<one line>" --key usage:panel:<IST day>`.
    The key makes it a loop's card (M15, `:341`) and once per day. On WAIT for any other reason (the window
    rolled, a pct over the line) it files nothing, because asking him would not change the answer.
  - **The anchor is the learn start** (his word 240: the one place he always arrives). The card is dealt by the
    existing SessionStart deal (`turn_hook.mjs:302`). On the mday build, `day.mjs start` (M16) is the learn-start
    code path. `need` runs there as one more owner call (F8), so the card is filed before the deal, not after.
  - **His answer is words, never a command.** The card line reads like *"pool ka panel: 5-hour aur weekly kitna %
    dikh raha hai? (bol do, bas do number)"*. He speaks; the **session** runs
    `usage_tap.mjs panel --five <n> --week <n>` (`source:"his-panel"`, `read_at` = now), then
    `captains_call.mjs answer <id> …` retires the card through its owner. He types nothing (his word 240). The
    reset times are optional on this path. With none, `verdict()` reads the panel reading under the age bound
    alone (rule 4 needs `resets_at`; a panel reading without it is judged by age only, F9).
  - The card **never interrupts a concept**: it is filed at the start, dealt at the start, and the captain's-call
    law caps it at ONE per anchor (`CLAUDE.md`, THE CAPTAIN'S CALL).
- **Clauses.**
  - **W4.1** No reading, then `need` → exactly ONE card, keyed `usage:panel:<day>`. *Base RED* (the runner waits on his post, M2) · *GREEN*.
  - **W4.2** `need` twice the same day → still ONE card (the key). *Base RED* · *GREEN*.
  - **W4.3** A fresh statusLine reading present → `need` files nothing. *Base RED* (there is no tap to tell) · *GREEN*.
  - **W4.4** WAIT because the five-hour pct is over the line → `need` files nothing. *Base RED* · *GREEN*.
  - **W4.5** `panel --five 40 --week 60` → a reading with `source:"his-panel"`, and `verdict` reads it under the same age law. *Base RED* · *GREEN*.
  - **W4.6** Static: the card line names no command, no path and no flag (no `node `, no `--`, no `.mjs`). *Base RED* (no card) · *GREEN*.
- **Mutants.**
  - μ4.1 file without `--key` → W4.2 RED (two cards).
  - μ4.2 file on every WAIT → W4.4 RED.
  - μ4.3 put the `panel` command in the card line → W4.6 RED.
  - μ4.4 the panel reading skips the age law → a W2.2-shaped plant on `source:"his-panel"` turns RED.

### P5: the witness, the mutants, and what a hermetic witness cannot see

- Every clause above runs in `usage_tap.mjs selftest`, a hermetic-chain member. The mutants run on the existing
  mutation lane (Stryker per LAW T), with one kill expected per clause.
- A deterministic witness **cannot see three things**. Each is a laptop measurement, not a guess (N1-N4):
  - whether his CLI version emits the M8 block;
  - whether the sessions that need the pool run where a statusLine runs (M9);
  - whether the statusLine's percent matches the `/usage` panel he reads.
- **The deciding measurement for the build** (one laptop run, read-only, no act of his beyond starting a CLI
  session the runner already starts): `usage_tap.mjs status` after one CLI turn, set beside the `/usage` panel of
  that same minute. Agreement within the panel's own rounding means the statusLine is the pool source. A
  disagreement goes to the architect, with both numbers.

---

## 3. FORKS: for the architect to rule

| Fork | Question | Options | Recommend | The measurement that decides |
|---|---|---|---|---|
| **F1** | Where the reading file lives | (A) the campaign root, beside `POOL.json` · (B) a per-user dir outside both repos (beside the CLI's own config dir) · (C) `dressing-room/state/` | **A** | Which tree the launch gate reads (M3). C puts account data into a tree with tracked state files (`git ls-files dressing-room/state` is not empty at this base), so C is refused unless the file is gitignored first |
| **F2** | The `/api/oauth/usage` endpoint (M11) as a second source | (A) never: it needs code that reads his OAuth credential · (B) a read-only probe, only when the statusLine source is absent | **A** | N5: whether the credential is readable by a script at all, and the architect's line on credential use outside the CLI. The "never an API key" law does not name OAuth, so this is the architect's call, not a seat's |
| **F3** | Where the `statusLine` setting goes | (A) the user-level settings on his laptop (every CLI session, any repo, the runner's included) · (B) the project `.claude/settings.json` (only sessions opened in this repo) · (C) the campaign repo's settings | **A** | N2: which repo's cwd the runner and its seats run in. B misses a runner session started in the campaign root |
| **F4** | The age bound's home | (A) the campaign's law home (`tools/model_law.mjs` shape, the home the runner reads effort from, `.claude/skills/runner/SKILL.md:96-100`) · (B) a key in `POOL.json`, read only · (C) derived: the five-hour window itself (`resets_at`) and no separate bound | **A + rule 4** | Row 1052 states a bound for row 1045's reading. Rule 4 is free (the CLI gives `resets_at`). A alone keeps a reading that is still inside its window but older than the ruling allows from reading GO |
| **F5** | The percent line that turns GO into WAIT | (A) read from the standing pool table (`.claude/skills/runner/SKILL.md:121`) · (B) no percent line in the tap: it reports, and the gate's own arithmetic decides | **B** | Whether the pool table has a machine-readable percent column (N6). If not, B keeps one writer of the arithmetic |
| **F6** | How the launch gate reads the verdict | (A) import `verdict` from `usage_tap.mjs` · (B) run `usage_tap.mjs verdict` and read the exit code | **B** | The campaign repo's import law (cross-repo imports, N6). B needs no shared module path across the two repos |
| **F7** | What counts as "no source" for P4 | (A) no reading ever · (B) no `source:"statusline"` reading within the age bound · (C) B and also no CLI session today | **B** | N1/N2: on a desktop-only study day there is never a statusLine row, so A asks once in the tool's life and never again |
| **F8** | Who runs `need` at the learn start | (A) `day.mjs start` (mday build, M16) as one more owner call · (B) the SessionStart dispatcher (`turn_hook.mjs` `start()`) on every session · (C) the runner, which files the card when its gate reads WAIT-for-no-source | **A**, C as the runner-side twin | Whether mday lands first. If it does not, B fires in engineering sessions too (more anchors, still ONE card by key) |
| **F9** | A panel reading with no reset times | (A) judged by the age bound alone · (B) ask for the reset too (a third number) | **A** | His word: the fallback asks *"the two numbers"* (row 1052, P4). B breaks it |
| **F10** | His spoken numbers become a reading only through the session | (A) the session runs `panel` and then `captains_call.mjs answer` · (B) a captains_call answer word carries the numbers and captains_call forwards them | **A** | B makes `captains_call.mjs` a second writer path into the reading. A keeps one writer |

---

## 4. NAMED, NOT GUESSED

- **N1** His CLI version on the laptop, and whether its statusLine stdin carries `rate_limits` (M8 was measured on
  2.1.327 in this cloud seat). *Measure:* `claude --version`, then a one-turn CLI session with a statusLine that
  dumps stdin to a file under the scratch dir.
- **N2** Which surface each pool consumer runs on: the runner and its seats (terminal CLI or desktop Code tab), and
  in which cwd. The statusLine runs only in the terminal (M9). *Measure:* the `entrypoint` key of a runner
  session's transcript (the same key this seat's transcript carries).
- **N3** Whether any hook payload on his CLI version carries `rate_limits` (M13 is a binary grep, not a run).
  *Measure:* a hook that dumps its stdin keys, one turn.
- **N4** Whether the statusLine percent equals the `/usage` panel's percent at the same minute (P5's deciding run).
- **N5** Whether his OAuth credential is stored where a script can read it on Windows (F2). *Measure:* do not read
  it. Ask the architect first; F2-A needs no measurement.
- **N6** The campaign repo: `POOL.json`'s writer and schema, the launch gate's file and verb, the pool table's
  columns, the law home of the age bound, and its cross-repo import law. The campaign repo is not in this seat's
  scope (M3). *Measure:* `node tools/boot_digest.mjs --role runner` from the campaign root, and grep its tools for
  `POOL.json` writes.
- **N7** The reading of row 1045 itself (its value and timestamp): the queue file lives under the campaign root.
  The rule "launch only while that reading is under the ruled age" is exactly what `verdict()` encodes, but this
  seat cannot see the row.
- **N8** Whether the desktop app keeps a local copy of the usage panel on disk. *Measure:* search its app-data dir
  for `five_hour` / `resets_at`, read-only. If one exists, it becomes source B for desktop-only days and F7 changes.
- **N9** The memory MCP (`organism-memory`) did not connect in this seat. No `get_context` was read, so nothing
  here rests on it.

---

## 5. Files a build would touch

| File | What changes | Owner law |
|---|---|---|
| `scripts/usage_tap.mjs` | **new**: statusline · panel · verdict · need · status · selftest; exports `readReading`, `verdict` | sole writer of `usage_reading.json` (outside the repo, F1) |
| `scripts/organism_test.mjs` | `usage_tap.mjs selftest` joins the hermetic chain | (the suite) |
| `scripts/day.mjs` (mday build) | `start` runs `usage_tap.mjs need` as one more owner call (F8-A) | sole writer of nothing |
| `.claude/skills/runner/SKILL.md` | `:104` and `:111` gain one line each: the pool is read by `usage_tap.mjs verdict`, his panel is the fallback card | — |
| **beyond these, as forks** | the statusLine setting (F3: user-level, or `.claude/settings.json`) · the campaign's launch gate and `POOL.json` writer (F6, campaign-side) · `scripts/turn_hook.mjs` (F8-B only) · `scripts/captains_call.mjs` (F10-B only) | — |

---

## 6. CI: the neutral machine's verdict on this branch

Read with curl, no token: `GET /repos/<owner>/<this repo>/commits/<sha>/check-runs`. The results are
recorded in `ci/mpool/LEDGER.jsonl` (act `ci-read`) and in the seat's final message. A later push of this file
names them here.
