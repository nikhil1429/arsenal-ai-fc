# MFAC — the day ends, the night run starts, the morning shows one line

Unit **mfac** · forks rows 1045 and 1052 · spec seat (SPEC ONLY; nothing is built before his yes, row 1052) ·
base `origin/main` @ `669200d` (fetched 18 Nov 2026, 18:35 UTC) · branch `claude/mfac-spec`.
The day-close unit it sits on: **mday**, spec `claude/mday-spec` @ `9421614` (`ci/mday/MDAY_SPEC.md`) and build
`claude/mday-build` @ `ba842cf` (read at that tip; file:line below marked `[mday-build]` are at that tip).

His word 240 (verbatim except the dropped quote marks): *i will not remember anything what to type when to type where
to type. all i do is start learning in claude code by /learn command will end my day from today onwards with something
like lets end the day here or something else (make sure sematic meaning is here, no exact words) so make sure
everything works accordingly.* His word 243: *keep working with runner continuously, do not sit idle at any moment
please. plan things accordingly.*

**Headline.** mday makes the day end ONE code act (`day.mjs end`). mfac hangs the night on that act: one new organ,
**`scripts/night.mjs`**, the sole writer of ONE new append file. `day.mjs end` **arms** the night through its CLI; the
runner session, which is already alive by word 243, is **woken by a zero-token wait** on that arm (no process is
spawned, no model is called by the organism); the night runs only what the runner's class already allows, stops on
five named conditions, and the next `/learn` **closes** the night and prints exactly ONE line, with at most ONE card
through the existing deck. Nothing lands on main that `land.mjs` would not already land, and `land.mjs` itself is
unchanged.

Every fact below is `file:line` at the base unless marked. What I could not reach from the cloud is under
**NAMED, NOT GUESSED** (§6).

---

## 0. What exists at the base (measured, not recalled)

| # | Fact | Where |
|---|---|---|
| B1 | The day end is one verb in the mday build: `end()` closes the sitting (step 2), writes the machine half (step 3), deals ONE card (step 5) and prints the questions. It never waits on him | `[mday-build] scripts/day.mjs:111-146` (deal `:140`, questions `:144`, refuse `:113-115`, already `:116-118`) |
| B2 | The learn start is a hook: UserPromptSubmit on the leading `/learn` token runs `day.mjs start` | `[mday-build] scripts/turn_hook.mjs:201`; `start()` `[mday-build] scripts/day.mjs:91` |
| B3 | SessionStart runs `day.mjs brief` (one line while today's sitting is open) | `[mday-build] scripts/turn_hook.mjs:316` |
| B4 | **Nothing in the organism repo starts, wakes or signals the runner.** The runner is a Claude Code session booted by his word `runner`; its campaign tools live outside this repo | `.claude/skills/runner/SKILL.md:6-11`, `:31-35`, `:71-90` |
| B5 | The runner already HOLDS for his study: commit `dcb2810` holds a branch *"for his study-done word and the slot"*. Today that word is prose; nothing ties it to a code act | `git log -1 dcb2810` (message tail) |
| B6 | The runner's class (what it decides alone vs brings to the architect) is row 247, written in the skill | `.claude/skills/runner/SKILL.md:115-136` |
| B7 | The pool is HIS PANEL: *"recorded whenever he posts one, never asked inside a window"*. No code in this repo reads his plan's pool for interactive or cloud sessions | `.claude/skills/runner/SKILL.md:111`; `scripts/brain.mjs:448` `windowUsage` reads `brain_ledger.jsonl` only (the organism's own `claude -p` rows, `:444`) |
| B8 | THE PAUSE is a code path in the runner: launch nothing, stop runs, release locks, one PAUSED row, zero turns | `.claude/skills/runner/SKILL.md:197-204` |
| B9 | Rotation needs his hands (`/clear` + the boot word) and is told by the architect; never while hosting | `.claude/skills/runner/SKILL.md:208` |
| B10 | The RAM law: one labourer per lane; the heartbeat shell can be reaped on low memory | `.claude/skills/runner/SKILL.md:112`, `:183` |
| B11 | **THE LANDING VERB.** `land.mjs` moves main only by fast-forward, never `--force` (`:6`, `:231-232`); row 1023 C1 the sha judged is the sha landed (`:13`, `:178-184`, `:251`); L2 unattended only after `UNATTENDED_AFTER` landings with no human stop, counted from `.git/land_ledger.jsonl` (`:37`, `:61-71`); refuses a state path (`:189`) and `.claude/settings.json` (`:190`); refuses while a sitting is OPEN (`:202-205`); STOP exit 3 is *his hand* (`:24`, `:215`, `:228-229`) | `scripts/land.mjs` |
| B12 | **main has no branch protection.** The public API answers `"protected": false` for `main` (read 18 Nov 2026 with curl, no token). "Never a force push" is held by code paths only, not by the remote | `GET /repos/nikhil1429/arsenal-ai-fc/branches/main` |
| B13 | The groundsman already changes main unattended: state-only pushes on the publish allowlist, by his 9 Aug ruling, and refuses a range holding a held landing | `scripts/groundsman.mjs:324-389` (commit msg `:388`), `heldCommits` `:147`, `refuseHeld` `:166`; `nightPass` `:274` runs `brain.mjs tick` then pushes |
| B14 | The night close of an un-ended day exists (conductor `dayclose` evening, `dayclose-prev` morning) | `scripts/conductor.mjs:158`, `:106` |
| B15 | ONE card: `captains_call.mjs` is sole writer of `captains_call.json`, one card per deal; `file --key` is idempotent by key | `scripts/captains_call.mjs:21-25`; keyed file used at `scripts/land.mjs:235`, `scripts/groundsman.mjs:211` |
| B16 | No workflow pushes: `suite.yml` runs on every branch push; `awayday.yml` on main pushes and a nightly cron; neither carries `git push` | `.github/workflows/suite.yml:43-45`; `awayday.yml:14-19`; `grep -n "git push" .github/workflows/*.yml` → nothing |
| B17 | The organism's own model lanes are switched off by his 20 Aug order; the gate is L5 | `CLAUDE.md` (the ⛔ 20 Aug line); `node scripts/brain.mjs gate show` |
| B18 | The rails read free memory already (`freemem`) and the fleet rail refuses a fan-out with no declared ceiling | `scripts/rails.mjs:101`, `:314`; fleet `:115`, `:179` |

---

## 1. The design — one organ, one append file, the runner wakes itself

`scripts/night.mjs` is **NEW**. **SOLE WRITER of `dressing-room/state/night_log.jsonl`** (append-only, one row per
event; the rule lives in its header, as every owner's does). It calls nobody's model, spawns no `claude`, starts no
process that outlives it. Every other file it touches it touches through the owner's CLI.

```
night.mjs arm    --day <D> --by day.end            ← day.mjs end, step 5a (before the deal)
night.mjs wait   [--since <iso>]                   ← the runner's hold: exits 0 the moment an armed, unstarted night exists
night.mjs begin  --runner <name>                   ← the runner, on waking
night.mjs mark   --kind launch|return|land-ready|landed|fork|red --unit <u> [--note "…"]
night.mjs stop   --reason pool|memory|red|fork|context|his-word|learn-start|done [--note "…"]
night.mjs may    --act launch|land                 ← the organism half of the go/no-go, ONE line, exit 0 GO / 1 NO
night.mjs close  --by learn-start                  ← day.mjs start (and only it)
night.mjs line                                     ← the ONE morning line (read-only)
night.mjs selftest
```

Rows: `{ts, day, kind: armed|begun|mark|stopped|closed, …}` — never his words, never a person name, never a state
file's content (a unit id, a reason word, a count).

---

## 2. N1 to N6 — touches, code path, witness clauses, mutants

The witness is `night.mjs selftest` joined to the hermetic chain of `scripts/organism_test.mjs`, every plant in a
copy of the state dir under `os.tmpdir()` (the mday doors: `ARSENAL_SITTING_STATE_DIR`, `[mday-build] day.mjs:51`).
**RED on base** = the clause against `669200d` + `ba842cf` (night.mjs absent). **GREEN on build** = with it.

### N1 — the day end of mday starts the night run with no act of his

- **Touches.**
  - `[mday-build] scripts/day.mjs:139-140` — `end()` gains step **5a** before the deal:
    `ownerRun("night.mjs", ["arm", "--day", D, "--by", "day.end"])`; its one line joins `steps`. Only on a real close
    (not on the `already` path `:116-118`, not on the REFUSED path `:113-115`), so a second `end` arms nothing new.
  - The **night close** of a day he never ended (B14): `postmatch.mjs autoclose --anchor evening` does **not** arm
    (Fork **F1**) — a day he walked away from is not his word that the day is over.
  - **The runner side (campaign, outside this repo; named, not built here):** its hold is a Monitor until-loop on
    `node scripts/night.mjs wait`. The harness wakes the session when the command exits; while it waits, no token is
    spent (L6: no per-call model, no poll by the model). This is the ONLY coupling: the runner reads the organism's
    CLI; the organism never reaches into the campaign tree.
- **Path.** his meaning → session model → `day.mjs end` → sitting closed (owner) → postmatch machine half (owner) →
  `night.mjs arm` (owner of night_log) → deal → the runner's `wait` exits 0 → `night.mjs begin --runner <name>`.
- **Clauses.**
  - **W1.1** One `end` on a planted open sitting → exactly one `armed` row for D. *Base RED* (no organ, no row) · *GREEN*.
  - **W1.2** `end` twice → still one `armed` row (the `already` path arms nothing). *Base RED* · *GREEN*.
  - **W1.3** `wait` on a dir with no armed row → still waiting at the plant's deadline; after `arm` → exits 0 with one line naming D. *Base RED* · *GREEN*.
  - **W1.4** The evening `autoclose` on a never-ended day → no `armed` row (F1-A). *Base GREEN* (a guard), must stay GREEN.
  - **W1.5** Static (L6): `night.mjs` contains no `spawn("claude"`, no `models.mjs` import, no `schtasks` create. *Base GREEN* by absence; stays GREEN.
- **Mutants.** μ1.1 drop step 5a → W1.1 RED · μ1.2 arm on the `already` path → W1.2 RED · μ1.3 `wait` exits 0 unconditionally → W1.3 RED · μ1.4 autoclose arms → W1.4 RED · μ1.5 `wait` spawns a `claude` to "check" → W1.5 RED.

### N2 — what runs: a runner boot, cloud seats inside the pool line, architect rulings by row

- **What runs, in order, and who owns each act** (nothing here is new law; each act is already the runner's, B6):
  1. **The runner wakes** (it was booted earlier by his word; a night cannot boot one — B9, Fork **F2**). It runs its own
     FIRST ACT checks that apply to a live session (`roles.mjs who`, heartbeat), then `night.mjs begin`.
  2. **Cloud seats** — launches *inside the standing pool table* only (row 247's class, `runner/SKILL.md:121`),
     each preceded by `night.mjs may --act launch` (the organism half: night armed and not stopped, no sitting open,
     memory above the line, no red this night) AND the campaign's own gate (pool reading, table, `his_words.mjs tail`).
     Both must say GO. Each launch and return is one `night.mjs mark`.
  3. **Architect rulings by row** — the runner runs the branch a ruling's measurement selects (`runner/SKILL.md:132-133`).
     A ruling that arrives by message at night is acted on only when its row is in the queue file (the message is
     transport, `:89-90`). The runner never rules a fork outside its class (`:220-221`).
  4. **Landing preparation** — `land/<unit>` branches cut and judged by the neutral machine; `node scripts/land.mjs <unit> --dry`
     run; each DRY pass is `mark --kind land-ready`. A real landing only per N3.
- **Touches.** `night.mjs may` (new). In the campaign (outside this repo, Fork **F7**): the runner's hold and
  `launch_leg.mjs pre` call `night.mjs may`. In this repo: `.claude/skills/runner/SKILL.md` gains ONE section,
  *THE NIGHT*, naming the wait, `begin`, `may`, `mark`, `stop` (text only).
- **Clauses.**
  - **W2.1** `may --act launch` with: armed ∧ no sitting ∧ memory over the line ∧ no red → `GO`, exit 0. *Base RED* · *GREEN*.
  - **W2.2** The same with a sitting OPEN → `NO sitting-open`, exit 1. *Base RED* · *GREEN*.
  - **W2.3** `may` before any `arm` today → `NO not-armed`. *Base RED* · *GREEN*.
  - **W2.4** `may --act land` while `land.mjs count` prints not READY → `NO land-attended` (N3). *Base RED* · *GREEN*.
- **Mutants.** μ2.1 `may` ignores the sitting → W2.2 RED · μ2.2 `may` treats a stopped night as armed → W2.3 RED (and W4.x) · μ2.3 `may --act land` skips the count → W2.4 RED.

### N3 — what may land unattended and what waits for him (rows 1023 / 1026 unchanged, never a force push)

`land.mjs` is **not edited**. Its refusals and STOPs already decide; the night adds no door. The table is by class:

| Class | At night, unattended? | Held by |
|---|---|---|
| A spec seat's push to `claude/<unit>-spec` | **yes** | the seat's brief; branch only, never main |
| A build seat's push to `claude/<unit>-build` | **yes** | the seat's brief; branch only |
| A `land/<unit>` branch cut, and its neutral verdict read | **yes** — "not a landing" | `land.mjs` reads it; `ci_verdict.mjs` is sole writer of nothing (`scripts/ci_verdict.mjs:5`) |
| `land.mjs <unit> --dry` | **yes** (writes no row, `land.mjs:159`, moves nothing `:222`) | `land.mjs` |
| A landing to main (`land.mjs <unit>`) | **only if** `land.mjs count` prints READY **and** an architect row grants unattended landing (row 1029 L2, `land.mjs:13`, `:68-71`). Otherwise **waits for him**: rides the ONE morning card | `land.mjs` (C1 / row 1023 at `:178-184`; row 1026 unchanged — its text is in §6) |
| A landing whose verb exits 3 (STOP: DIRTY-PATH, NOT-FF, LIVE-RED, ORIGIN-MOVED) | **never** — the night stops (N4 red leg) | `land.mjs:24`, `:42` |
| `land.mjs push <unit>` (the L4 retry of a landing main already holds) | **yes** — it pushes the sha that was judged, refuses ORIGIN-MOVED | `land.mjs:245-257` |
| Any `dressing-room/state/` path or `.claude/settings.json` reaching main by a landing | **never** (refused) | `land.mjs:189-190` |
| The groundsman's state push | **unchanged** (his 9 Aug ruling); not a night act | `groundsman.mjs:324-389` |
| Re-enabling a scheduled task, installing or restarting an OS unit (step 11's stale units) | **never** — printed, waits for him (his 20 Aug order) | `land.mjs:16`, `:220-222`; `CLAUDE.md` ⛔ line |
| A force push, a history rewrite, a branch or file delete, anything a row calls irreversible | **never** | `land.mjs:6`; `runner/SKILL.md:130` |
| A launch outside the pool table or above a pool line; a law value; a gate's strictness | **never** — the architect's, and it waits | `runner/SKILL.md:126-131` |

- **Clauses.**
  - **W3.1** Static: `git diff 669200d -- scripts/land.mjs` on the build is empty. *Base GREEN*, must stay GREEN.
  - **W3.2** Static: `night.mjs` contains no `git push`, no `--force`, no `merge`; it never moves a ref. *Base GREEN* by absence; stays GREEN.
  - **W3.3** A plant night with one `land-ready` mark and `land.mjs count` not READY → the morning card line names *landings waiting for his word* and the landing count; no LANDED row exists. *Base RED* · *GREEN*.
- **Mutants.** μ3.1 `night.mjs` calls `land.mjs <unit>` on a `land-ready` mark → W3.2 RED · μ3.2 the card skips land-ready → W3.3 RED.

### N4 — stop conditions: pool line, memory, a red leg, a fork outside class

Each is ONE `night.mjs stop --reason <r>` row; after any stop, `may` answers NO for the rest of D. The runner then
runs THE PAUSE's soft half (B8): launch nothing, let in-flight seats return, release locks, one PAUSED row — and
holds silent until the morning.

| Stop | Fires when | Who detects it | Fork |
|---|---|---|---|
| **pool** | the campaign gate reads STOP, or the pool reading is older than the reading-age line the launch rule already carries (the brief's own rule for row 1045). At night he posts no panel (B7), so the reading only ages | the runner's gate (campaign) → `stop --reason pool` | **F3** |
| **memory** | free memory under the line, read by `night.mjs may` with `os.freemem()` (the rails' own reader, B18) — the line is a config value of `night.mjs`, never typed in prose; and the runner's **context** reaching its rotation line (B9) → `stop --reason context`, because rotation needs his hands | `night.mjs may`; the runner's hook line | **F4** |
| **red leg** | a launch or return leg exits non-zero, a seat's neutral verdict is RED on a build the runner meant to land, or `land.mjs` exits 3 | the runner → `mark --kind red` → `stop --reason red` | **F5** |
| **fork outside class** | a row-247 "brings to the architect" item, with no ruling row in the queue | the runner → `mark --kind fork`; the night stops only when no in-class work remains | **F6** |
| **his word / learn start** | any message of his in any session, or a sitting opens (`/learn`) | `day.mjs start` → `night.mjs close`; the runner's PAUSE on his word | — |

- **Clauses.**
  - **W4.1** `stop --reason pool` then `may --act launch` → `NO stopped:pool`. *Base RED* · *GREEN*.
  - **W4.2** `may` with the plant's free-memory reader below the line → `NO memory`, and a `stopped` row with reason memory. *Base RED* · *GREEN*.
  - **W4.3** `mark --kind red` → the next `may` says NO (F5-A). *Base RED* · *GREEN*.
  - **W4.4** `mark --kind fork` with no other mark pending → `may` still GO for another unit (F6-A); `stop --reason fork` → NO. *Base RED* · *GREEN*.
  - **W4.5** A sitting opened after `begin` → `may` says NO `sitting-open`. *Base RED* · *GREEN*.
- **Mutants.** μ4.1 `may` ignores stopped rows → W4.1 RED · μ4.2 memory compare inverted → W4.2 RED · μ4.3 red mark not counted → W4.3 RED · μ4.4 a fork mark stops the whole night → W4.4 RED · μ4.5 sitting check dropped → W4.5 RED.

### N5 — the morning shows ONE line at the learn start and at most ONE card

- **Touches.**
  - `[mday-build] scripts/day.mjs:91` `start()` → after the sitting opens, `ownerRun("night.mjs", ["close", "--by", "learn-start"])`
    (closes D's night: a `closed` row; if the runner is still mid-night, the open sitting already turns every `may` to NO),
    then appends `night.mjs line`'s output as the **one** night line. `start` still prints its own line; the night line
    is the only other one, and only when a night was armed for the previous day.
  - The line: `NIGHT <D>: <begun|never begun> · <n> launched · <n> returned · <n> landed · <n> waiting for you · stopped: <reason>`
    (counts from `night_log.jsonl`; no unit names, no his words).
  - **The card:** `night.mjs close` files at most ONE card through `captains_call.mjs file --key night:<D> --line "…"`,
    and only when something **waits for him** (landings not granted unattended; a STOP exit 3; a fork outside class).
    The deck's own order decides which card is dealt (B15) — the night never deals a second.
  - The kickoff's other lines are untouched (they are the SessionStart brief's, not the learn start's).
- **Clauses.**
  - **W5.1** A planted night (armed, begun, 2 launches, 1 land-ready, stopped:done) + `day.mjs start` → exactly ONE output line matching `^NIGHT `. *Base RED* · *GREEN*.
  - **W5.2** The same → exactly one `night:<D>` card on the deck; `start` twice → still one (keyed). *Base RED* · *GREEN*.
  - **W5.3** A night with nothing waiting → zero night cards. *Base RED* (nothing to compare) · *GREEN*.
  - **W5.4** A day with no `armed` row → zero `NIGHT` lines (silent). *Base GREEN*, kept.
  - **W5.5** Names-gate (static): every row and line `night.mjs` writes in the plants holds no key named after a person and no his-words field. *Base GREEN* by absence; stays.
- **Mutants.** μ5.1 print one line per mark → W5.1 RED · μ5.2 file the card without the key → W5.2 RED · μ5.3 always file a card → W5.3 RED · μ5.4 print a line when unarmed → W5.4 RED.

### N6 — every way it can spend his pool or change his main without him, named

**Spend his pool (Claude plan unless said):**
1. The runner session's turns after it wakes (every host turn, every return read).
2. Cloud seats launched by the runner (each is a session on his account).
3. Labourer subagents inside the runner (`runner/SKILL.md:163-195`).
4. Workflow fleets (the fleet rail requires a declared ceiling, B18).
5. The architect session, if a night message wakes it (SendMessage → a turn there).
6. A relaunch of a failed seat (a retry is a second spend).
7. The organism's own `claude -p` lanes (`brain.mjs:2521`) if any scheduled task is enabled — e.g. `groundsman.mjs nightPass` runs `brain.mjs tick` (`:280`). Gated by L5 and his 20 Aug order; the night adds none.
8. Gemini (his other pool) if a mission or lane fires; the night adds none.
9. **Zero-spend by design:** `night.mjs wait` (a shell process the harness watches), the heartbeat shell, `night.mjs may`.
   The witness W1.5 holds this.

**Change his main:**
1. `land.mjs <unit>` — fast-forward only, gated by N3.
2. `land.mjs push <unit>` — the L4 retry of a sha already judged.
3. The groundsman's unattended state push (B13), unchanged.
4. Any session or seat that holds a push credential and runs a plain `git push` to `main` — **nothing on the remote
   refuses it** (B12). The cloud git proxy's per-session branch scope is the only fence I can see from here (§6).
5. A **force push**: the remote would accept it (B12). Held only by code (`land.mjs`, groundsman) and by every seat's
   brief. Fork **F8**.
6. Workflows: none push (B16).

- **Clauses.** **W6.1** Static: the build's diff adds no `git push` outside `land.mjs` / `groundsman.mjs`
  (`git grep -n "\"push\"" scripts/` set unchanged except `night.mjs` absent from it). *Base GREEN*, kept.
  **W6.2** `night.mjs line` counts every `mark --kind launch` row, so a spend the runner made is visible in the
  morning line. *Base RED* · *GREEN*.
- **Mutants.** μ6.1 `night.mjs` gains a push → W6.1 RED · μ6.2 `line` skips launch marks → W6.2 RED.

---

## 3. FORKS — for the architect to rule

| Fork | Question | Options | Recommend | The measurement that decides |
|---|---|---|---|---|
| **F1** | Does a day closed by the **night** close (he never said it was over) arm the night? | (A) no — only `day.mjs end` arms · (B) yes, the evening autoclose arms too | **A** | The F8 missed-close count of mday (`node scripts/day.mjs status`, `[mday-build] day.mjs:164-174`) over a week: if most of his days close by the night, B earns its place |
| **F2** | The runner is not alive at day end (no live heartbeat) | (A) no spawn — `night.mjs arm` records `never begun`, the morning line says so · (B) a scheduled one-shot opens an interactive `claude` with the boot word on his laptop · (C) a cloud runner session | **A** | Nights with a stale runner heartbeat at `arm` time (`roles.mjs who` history, campaign) over a week. B also spends with no human at the console and cannot rotate (B9); C cannot read his campaign tree |
| **F3** | The pool line at night, when no panel is posted | (A) stop launching when the reading ages past the line (honest; caps the night) · (B) the runner reads the usage page in his Chrome by the existing browser lane · (C) launch on the last reading regardless | **A**, B after a measured read | Whether the usage page is readable by the browser lane on his laptop (§6 G3); the night's launches lost to ageing, from `night_log.jsonl` |
| **F4** | Where the memory line lives | (A) a `night.mjs` config key, its owner the sole writer · (B) the rails' existing reader and its line · (C) the campaign's RAM law only | **A** | `rails_blind.jsonl` `free_mb` distribution on his laptop (§6 G4) gives the floor |
| **F5** | A red leg stops what | (A) the whole night · (B) only that unit; the night stops at the second red | **A** | Reds per night in the campaign ledger's return rows: if reds are frequent and independent, B |
| **F6** | A fork outside class stops what | (A) that thread only; the night continues in-class work · (B) the whole night | **A** | Rows where an architect ruling arrived the same night (a stopped night would have wasted it) |
| **F7** | Where the runner's half lives | (A) campaign tools call `night.mjs` by CLI; the organism names no campaign path · (B) the organism reads a campaign file by an env-named root | **A** | Code public, data private: B makes a public script read a private tree |
| **F8** | Force push to main is accepted by the remote (B12) | (A) he enables branch protection on `main` with force push and deletion off (one setting, his act; the groundsman and `land.mjs` push plainly, so nothing lawful breaks) · (B) code only, as today | **A** | `GET /repos/…/branches/main` → `"protected": true` after; a dry push `--force-with-lease` from a scratch clone refused |
| **F9** | The night line when a night is still running at `/learn` | (A) `close` stops it (`learn-start`) and prints what was done · (B) `/learn` waits for the runner's PAUSE to finish | **A** | His study start must not wait (word 240); the open sitting already turns `may` to NO |
| **F10** | Files beyond §4 | `.claude/skills/runner/SKILL.md` THE NIGHT section (text) | **A** (text only) | — |

---

## 4. Files a build would touch

| File | What changes | Owner law |
|---|---|---|
| `scripts/night.mjs` | **new** — arm · wait · begin · mark · stop · may · close · line · selftest | **sole writer** of `dressing-room/state/night_log.jsonl` (append) |
| `scripts/day.mjs` (mday's) | `end()` step 5a `night.mjs arm`; `start()` `night.mjs close` + the one line | sole writer of nothing (mday F1-A) |
| `scripts/organism_test.mjs` | `night.mjs selftest` joins the hermetic chain | (the suite) |
| `.gitignore` | `dressing-room/state/night_log.jsonl` — **a fork with the BIOMETRIC ruling in mind**: the log holds no his-words and no person names, but it is new state; tracked or ignored is his call | — |
| **beyond these, as forks** | `.claude/skills/runner/SKILL.md` (F10) · the campaign's hold + `launch_leg.mjs` (F7, not this repo) · the branch protection setting (F8, not a file) | — |

Not touched: `scripts/land.mjs` (W3.1), `scripts/captains_call.mjs` (its `file --key` door is enough),
`scripts/groundsman.mjs`, `.claude/settings.json`, any `dressing-room/state/` file outside the new log.

---

## 5. CI — the neutral machine's verdict on this branch

Read through the public API with curl, no token: `GET /repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`.
Results for each push are in `ci/mfac/LEDGER.jsonl` (act `ci-read`) and in the seat's final message.

---

## 6. NAMED, NOT GUESSED

| # | Fact I could not reach | What would measure it on his laptop |
|---|---|---|
| G1 | The text of **row 1026** (and rows 1045, 1052, 1023 beyond `land.mjs:13`). The ruling queue is outside this repo; no branch of this repo carries "1026" (`git grep` over every `claude/*` branch, 18 Nov 2026) | `grep -n "^| 1026 |"` on the ruling queue file the runner skill names (`runner/SKILL.md:75-77`) |
| G2 | Whether the runner is alive at a typical day end, and its context then | `node tools/roles.mjs who` at day end, a week of nights |
| G3 | Whether the plan usage page is readable by the browser lane (F3-B) | one read by the existing Chrome lane, his consent |
| G4 | His laptop's free-memory floor under a fleet | `rails_blind.jsonl` `free_mb` rows (read the numbers, never print the file) |
| G5 | `land.mjs count` today (the `.git/land_ledger.jsonl` lives in his clone, never pushed) | `node scripts/land.mjs count` |
| G6 | Which ArsenalFC scheduled tasks are Enabled (the groundsman pushed state on 18 Nov 2026, so at least one is) | `node scripts/pulse.mjs report` |
| G7 | Whether the cloud git proxy limits a seat's push to its own branch (N6 main item 4) | a seat's push to a scratch branch name outside its scope, refused or not |
| G8 | The campaign's pool table and pool line, and the reading-age line | `node tools/boot_digest.mjs --role runner` (campaign root) |
| G9 | The memory MCP did not connect in this seat; no `get_context` was read, nothing rests on it | — |
| G10 | `hooks/pre-commit` did not run on this seat's commits (`core.hooksPath` unset in the container, as the mday seat measured) | `git config core.hooksPath` on his clone |

**Push `b8694d7` (18 Nov 2026):** workflow run `44372388585` (suite) · **cancelled** on both legs (`135042381294`
node 22 · `135042381678` node 24), superseded by the next push: `suite.yml:51-53` sets
`concurrency: suite-${{ github.ref }}` with `cancel-in-progress: true`.
**Push `f35f020` (18 Nov 2026, the spec bytes of `b8694d7` + ledger rows), read with curl, no token:** workflow run
`44372462954` (suite) · completed · **success**. Check runs: `135042715345` npm test · node 22 → success ·
`135042714779` npm test · node 24 → success. The push carrying this paragraph is judged again; its run id is in the
seat's final message and the ledger.
