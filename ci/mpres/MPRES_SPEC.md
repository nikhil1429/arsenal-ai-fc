# MPRES SPEC — a sensor whose input is dead reads RED by name on the one state line

Unit mpres · forks row 1177 (2) · CLOUD SPEC SEAT · written 20 Nov 2026 · base `origin/main` =
`5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90` (measured at the cut: `git rev-parse FETCH_HEAD`).
This file proposes; it builds nothing. Every `file:line` below is at that base sha.

**HEADLINE.** Presence is not alone. On a dead input, **six** sensor organs (eight scheduled tasks) exit 0 and look
exactly like a quiet day: presence, touchline, timeaudit (pulse and full), dmn, mirror, capture pull.
Throwin is a seventh, but it already writes the error into its own state file. An eighth, the
Goalkeeper (`oura_coach.mjs`), is the counter-example: it already exits non-zero. The organism
**already has a detector**: `thalamus.mjs afferentLiveness` names `activitywatch` as `afferent-silent`
once the source passes its cadence. It never reached him for two reasons. It files at **WARN**, and the
state line counts only RED. And it runs only in watchman's nightly pass. The proposal: each sensor's
**own writer** records its dead input in its **own file**; one pure, read-only reader (`senses.mjs`)
folds those files; `state.mjs` appends ` · senses ✗ <sensor>: <input> dead since <IST time>` only while a
sensor is hurt. Healthy costs zero characters (L7). The line already rides the SessionStart brief, so it
reaches him with **no act of his**.

---

## 0 · What the ruling binds (row 1177 (2), verbatim)

> *The class: a sensor whose input is dead must read red by name on the one state line, never exit 0
> with a zero. Unit mpres, spec first, launched now: the spec names every sensor task that exits 0 on
> a dead input (presence is the first, measured), and where its red reaches him with no act of his.*

Parts (1) and (3) of row 1177 belong to the runner and to the mguard seat. They are not in this spec.
§7 names the one command (1) needs.

## 1 · Measurements (each by command, with its last line)

The ledger is `ci/mpres/LEDGER.jsonl`, one row per act.

| # | Command | Last line |
|---|---|---|
| M1 | `git fetch origin main && git rev-parse FETCH_HEAD` | `5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90` |
| M2 | `node <scratch>/regs.mjs`: imports `installerRegistrations(setupScripts())` from `scripts/watchman.mjs:1686` / `:1668`, the organism's own single reader of what the setup scripts register | `holes: []`, so every registration name was readable |
| M3 | `grep -n 'ArsenalFC-' setup/INSTALL_TASKS.ps1 setup/INSTALL_CYBORG_TASKS.ps1 setup/INSTALL_ARCHIVE.ps1` | the action of every task (the §2 table) |
| M4 | `node scripts/presence.mjs selftest` | `ALL CHECKS PASSED` |
| M5 | `node scripts/state.mjs selftest` | `state selftest: 24 passed, 0 failed` (20 Nov 2026) |
| M6 | `node scripts/touchline.mjs selftest` | `ALL CHECKS PASSED` |
| M7 | `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` | `organism_test: 141 passed, 4 failed · ruled 0 · UNRULED 4 · LIVE 126 (hermetic: named, not run)`, exit 2 (20 Nov 2026, this cloud box) |
| M8 | `git check-ignore -q dressing-room/state/<f>` for every sensor output named below | all gitignored except `registry.json` (tracked) |
| M9 | grep tally of network reads (`await fetch(`, `fetchFn(`, local service URLs) per registered task script | the sensor set in §2 |

**M7's four reds are not mpres.** They are `fsrs` and `mutagen`, which fail with
`ERR_MODULE_NOT_FOUND` because this cloud box has no `node_modules`, plus their chained aggregate, plus
the coverage law naming orphans `deck_lint, home_pin, probe, study_scope`. They are measured at base and
stated here so a build seat does not mistake them for its own.

## 2 · The class: every scheduled sensor task, its input, and what it does when that input is dead

A **sensor task** is a scheduled task whose organ reads an input from outside the state bus: a local
service, a network endpoint, or a mounted folder. The tasks below came from M2/M3. The sensor set was
cut by M9. Every other registered task reads only the state bus. Its liveness belongs to `pulse.mjs`
(the task ran) and to `brain.mjs inputLiveness` (`brain.mjs:1750`, a lane's bus inputs are fresh), not
to this class.

| Task (registered at) | Organ · input | On a dead input, at base | Exit | Class? |
|---|---|---|---|---|
| **ArsenalFC-Presence** (`INSTALL_CYBORG_TASKS.ps1:113`, MINUTE/1) | `presence.mjs sense` · ActivityWatch window bucket, `AW` const `presence.mjs:40` (no env door) | `fetchAwEvents` catch → `null` (`:589`); `sense` returns `{ok:false, skipped}` **before any append** (`:671`); `main` prints one line (`:1109`) and falls off the end. **No row is written**, so the ledger looks the same as the laptop being asleep. The header says so as law: "AW unreachable → silent no-op" (`:17`) | 0 | **YES** (measured on his laptop by the runner, 20 Nov 2026) |
| **ArsenalFC-Touchline** (`INSTALL_TASKS.ps1:92`, MINUTE/30) | `touchline.mjs` · ActivityWatch, base from env `AW_API_BASE` via config (`:546`, `:46`) | `awFetch` catch → `null` (`:366`); `tunnelRead(null…)` → `state:"no_data", evidence:"no window events"` (`:170`), which is **byte-identical to a laptop with no activity**; `buildRead` stamps `status:"ok"` (`:351`); writes `pitch_read.json` + history (`:584`, `:595`) | 0 | **YES** |
| **ArsenalFC-TimeAuditor-Pulse / -Full** (`INSTALL_TASKS.ps1:159` / `:150`) and **ArsenalFC-Heartbeat** (`INSTALL_TASKS.ps1:88`, which shells timeaudit pulse) | `timeaudit.mjs` · ActivityWatch, `AW_API_BASE` (`:25`) | bucket read throws → `dataOk:false`, a note, **zero totals**, written to `timeaudit.json` (`:458`–`:462`), then `return` with no value, so the `ok === false` exit at `:603` never fires | 0 | **YES**, but it self-reports in its own file (`dataOk:false`) |
| **ArsenalFC-DMN** (`INSTALL_CYBORG_TASKS.ps1:121`, HOURLY) | `dmn.mjs` · ActivityWatch AFK bucket, `AW` const `:134` (no env door) | `isAway` → `{away:false, why:"ActivityWatch unreachable — assume present"}` (`:427`), so the dream gate shuts and the run looks like "he was here". Side finding, same shape as presence's scar a7262423: the follow-up events fetch at `:431` carries **no abort signal** | 0 | **YES** |
| **ArsenalFC-Mirror** (`INSTALL_TASKS.ps1:85`, DAILY) | `mirror.mjs` · the public capsule gist (`defaultFetch` `:153`) | every id → `error:"fetch_fail"` (`:197`–`:198`); `status:"awaiting_data"` (`:215`), **the same word as a gist with nothing locked**; `low_confidence:!enumeration.ok` and `enumeration.error` are recorded (`:224`, `:230`); manifest written (`:337`) | 0 | **YES**, self-reports in its manifest |
| **ArsenalFC-CapturePull** (`INSTALL_TASKS.ps1:149`, HOURLY) | `capture.mjs pull` · the Drive inbox folder (`env ARSENAL_REPS_INBOX → capture_config.json → unset`, `:100`–`:102`) | a configured inbox whose folder is missing (Drive for Desktop stopped or unmounted) → `{pulled:0, wired:false, note:"inbox not found … not wired yet"}` (`:1034`–`:1035`), **the same word as never configured**; no state file records it | 0 | **YES** |
| **ArsenalFC-Throwin** (`INSTALL_TASKS.ps1:91`, MINUTE/15) | `throwin.mjs` · ntfy topic poll | fetch throws → `throwin_state.json` gets `last_error:"fetch_fail"` (`:614`), `return` | 0 | **YES**, self-reports. A dormant throwin (no topic, `:606`) is **not** dead and must not read red |
| ArsenalFC-Goalkeeper (pre-existing; re-pointed at `INSTALL_TASKS.ps1:132`–`:136`) | `oura_coach.mjs` · Oura API | `process.exit(1)` on fetch failure and on an unpersistable verdict (`:937`–`:950`) | **1** | no. This is the counter-example the class should copy |
| ArsenalFC-Daemon-Watchdog (`INSTALL_CYBORG_TASKS.ps1:160`) | `daemon_watchdog.mjs pass` · daemon ports | its verdict already reaches the line (`state.mjs:58`–`:64`, `:163`–`:164`, with its age once past its own threshold) | — | no. It is a watcher, and it is already on the line |
| ArsenalFC-Thalamus / Cortex / Turnstile / BrainDaemon (`INSTALL_CYBORG_TASKS.ps1:102`–`:107`) | daemons, started daily | covered by the watchdog row above | — | no |

**Why the existing detector did not save him.** `thalamus.mjs:3249` declares `activitywatch` as a live
poller with a cadence, and `afferentLiveness` (`thalamus.mjs:3271`) files `afferent-silent` once it is
past that cadence. But it files at **level WARN** (`thalamus.mjs`, the `afferent-silent` pushes), and it
is read only by watchman's nightly `checks` (`watchman.mjs:720`). The line's suite field counts
**RED** findings only (`state.mjs:66`–`:68`, `:166`). A WARN therefore never reaches the one line. The
detector also judges the **afferent bus**, and `activitywatch` rows there come from `context.mjs:302`,
so on a day the brain daemon (which runs context) is down too, the detector watches the wrong patient.
A second flaw for the architect: `presence` is declared a live poller (`thalamus.mjs:3250`), but presence
posts an afferent only on a **leading edge** (`presence.mjs:674`–`:681`). A calm, live day therefore
reads "silent" past its cadence, and a dead day reads exactly the same. That row cannot tell the two
apart (fork F6).

## 3 · Where the red reaches him with no act of his

`state.mjs liveState()` (`:186`–`:207`) composes the line. `learnstate.mjs:2217`–`:2218` puts it
**first** in the SessionStart and PreCompact brief. This session's own start hook printed it, and its
`registry:` tail proves that a tail appended by `stateFrom` (`state.mjs:181`–`:183`) reaches him
unprompted. The header also lists /matchday, organism-doctor step 0 and the morning sheet push
(`state.mjs:13`–`:15`). **No card is needed for the red to reach him** (fork F4).

## 4 · The code path proposed

**4-A · The owner records its own dead input, in its own file (owners-only law).**

| Organ (sole writer of) | Change |
|---|---|
| `presence.mjs` (sole writer of `presence_log.jsonl`, `:18`) | On `events === null`, write a one-object snapshot `presence_input.json` = `{at, input:"activitywatch", alive:false, dead_since, last_live_at}` (new file, same owner, gitignored beside `presence_log.jsonl`). A live pass rewrites it `alive:true` and carries `last_live_at`. `dead_since` carries forward and never resets on a repeated dead pass. Writing a snapshot instead of a ledger row costs nothing per minute and keeps the ledger's 2-rows-per-pass law (`:688`–`:694`) intact (fork F1). Add an env door for `AW` (fork F7). |
| `touchline.mjs` (sole writer of `pitch_read.json`, `:29`) | When `bucketMap === null`, `tunnel.state:"input_dead"` with `evidence:"ActivityWatch unreachable"`, never `no_data`; top-level `input:{activitywatch:false, at}`. `no_data` keeps its meaning: AW up, no events. |
| `timeaudit.mjs` | No owner change. It already writes `dataOk:false` + note. Only the reader is new. |
| `dmn.mjs` (sole writer of `dmn_precache.json`, `:32`) | Stamp `away_gate:{at, why}` into its own output when `isAway` says "unreachable"; give the second fetch at `:431` its own abort signal (mirrors presence `:578`–`:590`). |
| `mirror.mjs` (single writer of `mirror_manifest.json`, `:14`) | No status change (that word is read elsewhere). The reader keys on `enumeration.ok === false && have === 0`. |
| `capture.mjs pull` | A **configured** inbox that is missing → `wired:"configured-missing"` (distinct from the unset `false`), and a one-object `capture_pull.json` snapshot written by capture, its owner (fork F8). |
| `throwin.mjs` | No owner change. The reader keys on `wired:true && last_error`. |

**Exit code.** An owner whose input is dead exits **non-zero**, as `oura_coach.mjs` does. That makes
the scheduler's `LastTaskResult` and watchman's `task-errors` RED (`watchman.mjs:870`–`:896`) a second,
independent route (fork F2).

**4-B · One reader, `scripts/senses.mjs` (NEW; SOLE WRITER of nothing; zero LLM; no network).**
`SENSES`, a frozen table (or registry rows, fork F3): `{subject, owner, file, input, dead(row) → bool,
since(row) → iso}`, one row per §2 class member. `senseFacts({stateDir, now})` reads each owner's file
(through the owner's exported reader where one exists) and returns
`{known:true, wounds:[{sensor, input, since, evidence}]}`. An unreadable or absent file is **named as a
stated unknown** (`presence ?`), never a pass, and never a red on a bare clone (pulse's NOT-MEASURABLE
precedent, `pulse.mjs:42`–`:45`).

**4-C · The line (`state.mjs`).** `liveState` imports `senses.mjs` lazily, the same way it imports the
registry (`:198`–`:202`). `stateFrom` takes `senses` and appends, after the registry tail,
` · senses ✗ presence: activitywatch dead since 17 Nov 10:58 IST (+N)` **only while a wound exists**.
The field order and the §7.1 assertion do not move. The time is printed in IST because he reads IST.

**4-D · The WARN that never reached him.** It is left as is (L9). The line now carries the class by
name, so the nightly WARN becomes the second opinion, not the only one (fork F5).

## 5 · Witness clauses (each plant RED on base, GREEN on the build) and one mutant each

The PORT CLASS (row 1053) holds for all of them. No witness binds a port, names a live service, POSTs to
a daemon or restarts anything. A dead input is planted as an injected `fetchFn` that throws
`ECONNREFUSED`, or, for a CLI leg, as the env door set to an `.invalid` host (RFC 6761: no port, no
listener). Every wait is the organ's own existing abort bound. State is planted only under
`os.tmpdir()` by node.

| W | Plant | Read back | Base | Build | Mutant (must turn W red) |
|---|---|---|---|---|---|
| W1 | `presence.sense({fetchFn: dead, inputFile: tmp})` | `presence_input.json` exists, `alive:false`, `input:"activitywatch"` | RED: `sense` returns at `:671`, writes nothing | GREEN | drop the snapshot write on the null branch |
| W2 | two dead passes, then one live pass | `dead_since` equals the **first** dead `at`; the live pass gives `alive:true` and `last_live_at` | RED (no file) | GREEN | reset `dead_since` on every dead pass |
| W3 | `senseFacts({stateDir: tmp})` over a planted dead presence snapshot | `wounds[0].sensor === "presence"` and its `since` | RED (module absent) | GREEN | `dead()` returns false |
| W4 | `stateFrom({senses:{known:true, wounds:[…]}})` | line contains `senses ✗ presence: activitywatch dead since` | RED (no field) | GREEN | drop the tail |
| W5 | `stateFrom({senses:{known:true, wounds:[]}})` | line has **no** `senses` characters (L7) | GREEN at base, must **stay** green | GREEN | always emit `senses ✓` |
| W6 | touchline run over a dead `fetchFn` | `tunnel.state === "input_dead"`, never `no_data` | RED (`no_data`, `:170`) | GREEN | map the null branch back to `no_data` |
| W7 | planted `timeaudit.json` `dataOk:false` | `senseFacts` names `timeaudit` | RED | GREEN | read `dataOk` as truthy-by-default |
| W8 | planted mirror manifest, `enumeration.ok:false, have:0` | names `mirror`; an `ok` enumeration with `have:0` (nothing locked) does **not** | RED | GREEN | key on `have === 0` alone |
| W9 | planted `throwin_state.json` `wired:true, last_error:"fetch_fail"`; and `wired:false` | first names `throwin`; dormant does **not** | RED | GREEN | drop the `wired` guard |
| W10 | `dmn.isAway({fetchFn: dead})` | `away_gate.why` stamped in the dmn output | RED | GREEN | skip the stamp |
| W11 | capture pull with a configured, absent inbox under tmp | `wired:"configured-missing"`, named by `senseFacts` | RED (`wired:false`) | GREEN | collapse back to `false` |
| W12 | CLI: `presence.mjs sense` with the env door at an `.invalid` host and the state dir at tmp | exit code non-zero (only if F2 = B) | RED (exit 0) | GREEN | `return` instead of setting `exitCode` |
| W13 | `senseFacts` over an absent state dir | `presence ?` named as unknown; **no** red | RED (module absent) | GREEN | treat absent as dead |

The witnesses ride each owner's selftest and one new `senses.mjs selftest`. The new selftest must be
wired into a suite, or the coverage law names it an orphan (M7 shows the law is live).

## 6 · FORKS (the architect rules; each lettered, my recommendation first-named, what decides it)

- **F1 · Where presence records a dead input.** (A) a snapshot `presence_input.json`, overwritten each
  pass · (B) a `kind:"input"` row in `presence_log.jsonl` on each **transition** only · (C) a row on every
  dead pass. **Recommend A.** It keeps the ledger's 2-rows-per-pass invariant (`presence.mjs:688`–`:694`)
  and adds no per-minute rows. *Decides it:* whether any ledger reader (calibrate, `status`) must see
  dead spans. `grep -n sensePassRows scripts/*.mjs` says the readers filter `!r.kind`, so B is safe too.
- **F2 · Exit code on a dead input.** (A) stay 0, line only · (B) non-zero, like `oura_coach.mjs`.
  **Recommend B**, as the ruling's words say ("never exit 0 with a zero"). *Decides it:* whether a
  per-minute non-zero result floods watchman's nightly `task-errors` with a stale code (it reads
  `LastTaskResult`, the last run only, `watchman.mjs:885`–`:896`). On his laptop:
  `Get-ScheduledTaskInfo ArsenalFC-Presence`.
- **F3 · Where the SENSES table lives.** (A) a frozen code table in `senses.mjs`, like
  `AFFERENT_SOURCES` (`thalamus.mjs:3247`) · (B) a `senses` table in `registry.json`, seeded through
  `registry.mjs set` (its law: "adding a subject is a ROW EDIT", `registry.mjs:11`–`:12`). **Recommend
  B.** It is the registry's declared purpose, but `registry.json` is tracked state, so the seed is a CLI
  write the build seat performs through the owner. *Decides it:* whether a cloud build seat may run
  `registry.mjs set` (the rail hook refuses shell writes under the state path, but a node owner CLI is
  the sanctioned door).
- **F4 · A card.** (A) none, the line is the anchor · (B) one card via `captains_call.mjs file` once a
  wound outlives one awake day. **Recommend A.** Restarting ActivityWatch needs no word from him, and his
  7 Aug ruling: "if it cannot ride an anchor, it does not need the captain". *Decides it:* his word.
- **F5 · The afferent-silent WARN.** (A) leave it (L9) · (B) raise it to RED for `activitywatch` only.
  **Recommend A.** The line now carries the class. B would double-count the same death under
  "N other RED". *Decides it:* the architect.
- **F6 · The `presence` row in `AFFERENT_SOURCES`** (live, with a cadence) is mis-declared, because
  presence posts only on an edge. (A) re-declare it `event-only` · (B) leave it. **Recommend A** (a
  one-row change, `thalamus.mjs:3250`). *Decides it:* how many `afferent-silent presence` WARNs watchman
  filed on calm days. On his laptop: `node scripts/watchman.mjs report`.
- **F7 · The ActivityWatch env door's name.** Today it is three different names: `AW_API_BASE`
  (touchline, timeaudit), `ARSENAL_AW` (context `:120`), none (presence `:40`, dmn `:134`). (A) adopt
  `AW_API_BASE` everywhere, keeping `ARSENAL_AW` as a read-also alias · (B) a new single name.
  **Recommend A.** *Decides it:* `grep -rn "AW_API_BASE\|ARSENAL_AW" setup/` on his laptop (whether
  any task injects one).
- **F8 · capture pull's dead inbox.** (A) a `capture_pull.json` snapshot by capture · (B) out of scope
  for mpres (Drive is a mount, not a service) · (C) fold it into an existing capture output.
  **Recommend A.** *Decides it:* whether Drive for Desktop is wired on his laptop at all (if it never
  was, the configured-missing branch never fires and B costs nothing).
- **F9 · Self-repair.** (A) none, the runner restarts ActivityWatch by its launcher as in rows 922/923 ·
  (B) presence restarts AW itself through a registry `self_repair` row (`registry.mjs:32`–`:34`).
  **Recommend A** for mpres. B is a separate unit with its own reversal path.

## 7 · NAMED, NOT GUESSED (unreachable from the cloud; what would measure each on his laptop)

1. When the last sense pass before today was written, as row 1177 (1) asks: `node -e` over
   `presence.mjs presenceTailReport` (exported, `:1121`), newest row with no `kind`. The runner owns that.
2. Whether `ArsenalFC-Presence`'s `LastTaskResult` really read 0 across 17–20 Nov:
   `Get-ScheduledTaskInfo -TaskName ArsenalFC-Presence`.
3. Whether watchman's nightly pass filed `afferent-silent activitywatch` on 17–20 Nov, and at what
   level: `node scripts/watchman.mjs report`. This checkout's start hook says watchman "never run yet",
   but that is the cloud box, not his laptop.
4. Whether touchline, timeaudit, dmn, mirror and throwin also ran dead in those days: their own files
   (`pitch_read.json tunnel.state`, `timeaudit.json dataOk`, `mirror_manifest.json enumeration`,
   `throwin_state.json last_error`), read by their own `status` verbs on his laptop.
5. Whether ntfy and the gist were reachable, and whether a Drive inbox is configured:
   `node scripts/throwin.mjs` · `node scripts/mirror.mjs` · the resolution at `capture.mjs:100`.
6. Whether any scheduled task injects an AW env door: the `/TR` text of each task
   (`schtasks /Query /TN <task> /XML`).
7. Whether the brain daemon (which runs context, the `activitywatch` afferent producer) was up then:
   `node scripts/daemon_watchdog.mjs` / `services.mjs status`.

## 8 · Files a build would touch

`scripts/presence.mjs` · `scripts/touchline.mjs` · `scripts/dmn.mjs` · `scripts/capture.mjs` (only if
F8 = A) · `scripts/state.mjs` · `scripts/senses.mjs` (new) · `package.json` (wire the new selftest into a
suite) · `.gitignore` (the new snapshot files, beside `presence_log.jsonl` `:256`). **Beyond them, as
forks:** `scripts/thalamus.mjs` (F6) · `scripts/context.mjs` (F7 alias) · `dressing-room/state/registry.json`
(F3 = B, **only** through `registry.mjs set`) · `scripts/registry.mjs` (F3 = B, a reader for the new table).
No setup script changes, and no task is re-registered.

## 9 · Check runs of the pushed sha

The neutral machine's verdict is read through the public API with no token after each push, and
recorded in the ledger and in this section:

- see `ci/mpres/LEDGER.jsonl`, the rows `act: "check runs"`.
