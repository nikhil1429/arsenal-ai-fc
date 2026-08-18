---
name: organism-doctor
description: Full health check of the organism — vitals, brain budget, selftests, live schedule, AW sight. Use when anything feels off, or the captain says "doctor", "health check", "kya haal hai".
---

# /organism-doctor — the body checks itself

00. **THE STATE LINE** (overhaul §7.1, 18 Aug 2026): `node scripts/state.mjs` — ONE
    deterministic line (pushed · daemons · suite · sitting · next · needs-you), read
    off disk, zero LLM. Put it verbatim at the top of the chart; every step below is
    the detail behind one of its fields. Then `node scripts/brain.mjs gate show` —
    THE GATE (§5): which LLM lanes are ASLEEP (evidence absent · output never reached
    him inside its window · fail streak) and what wakes each. Asleep is HEALTH, not
    disease — never "fix" a sleeping lane by hand; `brain gate wake <lane>` is his
    override (his `na` on the card), and a wake is a force for one window, never a
    switch.
0. FIRST, THE VITAL SIGN THAT HID FOR FOUR DAYS — is the brain actually
   speaking, or only appearing to? Run `node scripts/brain.mjs tokens` and read
   `dressing-room/state/token_vitals.json` → `health`:
   (noted 10 Aug 2026: `tokens` mode does not just print — it RE-WRITES
   `token_vitals.json` (`writeAtomic(TOKEN_VITALS, v)` inside brain.mjs's
   `mode === "tokens"` branch; find it with
   `grep -n 'mode === "tokens"' scripts/brain.mjs`). That is legitimate, unlike
   the fuelboard case below, because brain.mjs is that file's ONLY writer —
   `grep -rn "token_vitals" scripts/*.mjs` shows captains_call.mjs and
   watchman.mjs only READ it. If you want the reading without the refresh, the
   Read tool on the JSON is enough; `health` is written on every brain tick
   anyway.)
   - `health.dead: true` → 🔴 **the brain has failed every recent job**. This is
     the top line of the chart, above everything else. If
     `health.not_logged_in` is also true the repair is his and it is one line:
     "ek `/login` chahiye, captain — baaki sab zinda hai."
   - Why this comes first: in the 21–26 Jul outage the daemon was resident,
     ticks were logging, the wall rendered and the phone stayed quiet, so every
     other check read green while **2,178** jobs failed in a row. A live-looking
     corpse is the failure mode this step exists to catch. Never report the
     organism healthy without reading `health`.
     (corrected 10 Aug 2026: this said "2,271 jobs failed in a row" until today.
     Counted live off the ledger, the outage is **2,178** consecutive `ok:false`
     rows running 2026-07-21T05:23:38Z → 2026-07-26T08:51:34Z — and no other
     reading of that window reaches 2,271 either: 2,234 rows total in 21–26 Jul,
     2,178 of them failed, 992 carrying the "Not logged in" error. Recount rather
     than trust the digits:
     `node -e "const r=require('fs').readFileSync('dressing-room/state/brain_ledger.jsonl','utf8').split(/\r?\n/).filter(Boolean).map(l=>JSON.parse(l));let m=0,c=0;for(const x of r){if(x.ok===false){c++;if(c>m)m=c}else c=0}console.log(m)"`
     The SCALE is the argument here, not the number — and the number is exactly
     the part that rots.)
1. Run in order (don't stop on failure — report all):
   - `node scripts/physio.mjs` (bleeds + speak-gates)
   - `node scripts/brain.mjs status` (budget phase, ceiling, eligibility)
   - `node scripts/limits.mjs` — THE NUMBERS LEDGER: every gate, budget, guard
     and cadence next to the live data it is judged against. Read the two lines
     it ends each table with: how many gates are SHUT, and how many cadences are
     still GUESSES. **Report only what has actually CHANGED shape** — a guess is
     not a fault, it is a number waiting on 30-45-60 days of his data.
     (added 11 Aug 2026, wiring audit. WHY IT IS HERE AT ALL: the ledger had no
     task, no hook, no skill and no importer — `grep -rn "limits.mjs" scripts/
     .claude/ package.json` finds it only in `organism:selftest`, so every
     producer wired INTO it was still writing into the dark. Three lanes now
     terminate here — calibration's published gate counter, claudegen's
     `tokens_estimated`, and the distiller's switch-to-read journal — and this
     bullet is the anchor all three arrive at. A `MEASURED └─` line under a
     cadence is the shape to look for: counts and lags, never a verdict. If one
     of them ever argues a number should move, that is ONE captain's-call card,
     not a paragraph in your reply.
     SAFE TO RUN, unlike `fuelboard.mjs status` two bullets down: limits.mjs is
     read-only and its own selftest MEASURES that against its own source rather
     than asserting it — `grep -n "READ-ONLY: this file calls no writer"
     scripts/limits.mjs`.)
   - `node scripts/dmn.mjs status` — THE REST ROOM'S ONLY READOUT: today's
     precache, how many calls the organ has put on his Max window today, and the
     **last failed call with the engine's own words**.
     (added 11 Aug 2026, wiring audit. WHY IT IS HERE AT ALL: this command had
     no caller anywhere in the organism — `grep -rn "dmn.mjs status"` found it
     only in dmn.mjs's own MODES header and the generated repo bundle, so a
     2.5M-token day and a real `Command failed: claude -p` fault were readable
     only if HE typed a command he has no reason to remember. The bleed half of
     that signal is now machine-wired: physio.mjs reads the lane's `dmn_` rows
     and bleeds `rest_room_engine_fault` into loop_vitals.json when the NEWEST
     attempt failed — so if physio is green here, do not re-litigate it; this
     command is for the forensics behind a bleed and for the spend line.
     Do NOT red the organism on a quiet DMN: standing down is designed
     behaviour (he is at his desk / tone conserve / no measured headroom).
     SAFE TO RUN, unlike `fuelboard.mjs status` further down: it only reads
     dmn_precache.json and brain_ledger.jsonl — `grep -n 'mode === "status"'
     scripts/dmn.mjs` and read the branch; there is no writer in it.)
   - `node scripts/context.mjs status` — THE AMBIENT BRIDGE'S ONLY READOUT:
     emits/day, how many carry a canon concept, how many shipped a CUT
     title/text, the last window it actually shipped, the live lane, the BUILD
     the running process is on, and — the half nothing else in the organism can
     see — what those emits BECAME downstream, as "N of M scored moment(s)
     carrying context left reflex".
     (added 11 Aug 2026, wiring audit. WHY IT IS HERE AT ALL: this command had
     no caller anywhere — `grep -rn "context.mjs status|context:status" scripts/
     hooks/ .claude/ setup/ package.json` returned exactly ONE hit in the live
     tree, context.mjs's own MODES header at :21. Three repairs' worth of health
     surface (#22 · D7 · D8, plus the downstream read) were dealt to nobody, and
     it is the anchor law's exact forbidden shape: a command he must remember.
     WHAT IS ALREADY MACHINE-WIRED, so do not re-litigate it here: LIVENESS.
     daemon_watchdog.mjs probes the bridge as its 5th resident and relaunches it,
     and physio.mjs's `daemonRead` bleeds off daemon_watchdog.json — if step 1's
     physio run is green, the bridge is UP. This command answers the two things
     nothing bleeds: whether an UP bridge is actually SPEAKING, and in whose
     words.
     **READ THE `running build:` LINE FIRST** (D9, added to this organ the same
     day by the sibling repair). It compares the resident's boot stamp against
     the newest mtime in its own module graph, so a daemon that has been up
     since before the code it runs reads STALE with both stamps and the file
     that moved. Live the hour it was written: booted 2026-08-09T07:38:39Z
     against a graph written 2026-08-11T00:23:56Z — ~41 hours of ambient sight
     on code the repo had already moved past, invisible to every other surface
     (the watchdog relaunches only what is DOWN, and an UP daemon is never
     reloaded). It self-heals: the resident retires itself on its next poll and
     daemon_watchdog.mjs brings it back on the new code, so report STALE as a
     🟡 that is already in hand, not a chore for him.
     **THEN READ `loop faults:` — the opposite case, which does NOT self-heal**
     (D10, added the same day by the same audit). Until 11 Aug the daemon's
     entire error path was `catch { /* never taxes */ }`: a loop throwing on
     every poll kept its PID, so the watchdog's process probe read UP, physio
     bled green off it, and nothing on disk carried a mark — ambient sight could
     have been dark for days. It now counts consecutive faulting polls into the
     bridge's own context_state.json and prints them here with the first stamp,
     the latest stamp and the last error verbatim. FAULTING is a 🔴 and it is
     the one context reading that is NOT already in hand: no number in the
     organism decides "wedged" (his standing rule — nothing is guessed), so
     report the count and the error TEXT, and let the error name the fix. `none
     recorded` is not the same claim as healthy — a fault whose own disk write
     failed leaves its trace only in scripts/context.log, which no organ reads.
     SAFE TO RUN — **but only with the verb.** `status` reads afferent.jsonl,
     salience_ledger.jsonl, context_state.json, tasks_expected.json and the
     process table, and writes nothing. Bare argv means `once`, which POSTs a
     live afferent to the thalamus and rewrites context_state.json — a doctor
     mutating the organ it is examining, the same trap as `fuelboard.mjs status`
     below. Since this wire was added an unknown verb exits 1 instead of falling
     through to that emit (`grep -n "const MODES = new Set" scripts/context.mjs`).
     Feeds the **sensors** line of the step-3 chart.)
   - `node scripts/context_manifest.mjs ledger` — DID SESSIONSTART ARRIVE WHOLE?
     One JSON line: every context part with its state word and byte count, plus
     `total` against `ceiling`. Read the state words FIRST, not the numbers —
     `ok` is fine; `TRIMMED`/hidden/cut means a budget bit; **`DROPPED` is a 🔴
     wire break** (the part was measured, billed, and then did not appear in the
     delivered brief); `ERROR` carries the throw's own message in `note`, and
     `MISSING`/`EMPTY` are data conditions, not faults — a leg that has nothing
     stored yet is not a broken leg (that distinction is the module's oldest law,
     6 Aug 2026). Then check `total <= ceiling`: over means the manifest line
     itself outgrew FOOTER_RESERVE, which is the one overrun the reserve exists
     to prevent.
     (added 11 Aug 2026, dead-wire pass. WHY IT IS HERE AT ALL: assemble() has
     returned this ledger since 5 Aug and the ONE production caller reads `.text`
     only (`grep -n "out.text" scripts/learnstate.mjs`), so the whole accounting
     was computed at every SessionStart and discarded. The `total` field was made
     truthful on 11 Aug and STILL had no consumer. Nothing in the organism catches
     a DROPPED leg — the footer says it to whoever is reading, and no organ reads
     the footer. `npm test` now asserts the same three things in a sandbox
     (`grep -n "MANIFEST LEDGER'S CONSUMER" scripts/organism_test.mjs`); this
     command is the LIVE read, against his real memory and his real staged
     rulings, which the sandbox by design does not have.
     SAFE TO RUN — **but only with the verb.** The module writes nothing, ever
     (its header's READ-ONLY law), so unlike `context.mjs` there is no mutation
     trap here. The trap is the opposite one: **bare argv prints the assembled
     brief**, which IS his durable memory, his teaching card and his staged
     identity facts. `ledger` omits `text` on purpose — that omission is what
     makes the readout safe to paste anywhere, and it is pinned by an assertion.
     Feeds the **sensors** line of the step-3 chart, next to the bridge.)
   - `npm test` — **this is the authority, and the only correct net.**
     Report per-organ PASS/FAIL and name EVERY red one.
     (Audit #108, 6 Aug 2026: this line used to read `npm run organism:selftest`
     then `npm run squad:selftest`. Both are `&&` chains, so they FAST-FAIL —
     brain.mjs sat at position 16 of 43, meaning one red organ left the 27 after
     it unrun and unreported, and the suite said "failed" where the truth was
     "27 unverified". A health surface that under-reports coverage by two-thirds
     at exactly the moment something is already red is the live-looking-corpse
     mode step 0 exists to refuse. `npm test` runs organism_test.mjs all, which
     runs every organ and reports each one — verified 10 Aug 2026:
     `package.json` → `"test": "node scripts/organism_test.mjs all"`, and `all`
     fans out over every MODE including `suites`, the independent runner.
     Corrected 10 Aug 2026: "16 of 43" and "the 27 after it" were written in the
     present tense and have since rotted — the chains grew. Measured today:
     organism:selftest holds **51** members, squad:selftest **22** (73 in all),
     brain.mjs is STILL the 16th, so a fast-fail there now hides THIRTY-FIVE, not
     27. Never read these off this file; count them:
     `node -e "const p=require('./package.json');for(const n of ['organism:selftest','squad:selftest'])console.log(n,p.scripts[n].split('&&').length)"`
     The argument does not depend on the numbers — the numbers only get worse.)
   - chain report: read `dressing-room/state/conductor.json` raw. Report 🔴 if
     `finished` is not today's local date, or if `failed` > 0 — naming each failed
     step id. (`finished` is a full ISO-8601 **UTC** timestamp, e.g.
     `2026-08-10T03:45:12.340Z`, which is 09:15 IST — compare its DATE PART, and
     note that both chains fire at hours where the UTC date and the IST date
     still agree, so the date-part comparison is safe as written.) The morning
     chain carries its whole roster in ONE scheduled task, so this file is the
     only per-organ record of the morning that exists.
     (corrected 10 Aug 2026: this said "FOURTEEN organs". Live it is SIXTEEN
     steps — 12 node organs + 3 daemons (thalamus/cortex/turnstile) + 1 arm-gate
     (`signals`) — and today's report carries 16 rows. Read the roster, never
     this line:
     `node -e "import('./scripts/conductor.mjs').then(m=>console.log(m.MORNING.length, m.MORNING.map(s=>s.id).join(', ')))"`)
     ALSO read `dressing-room/state/conductor_evening.json` the same way (H0
     audit, 10 Aug 2026 — the evening spine's report had ZERO readers until
     then): 🔴 if `failed` > 0 naming each step, and 🔴 if `started` is older
     than yesterday's local date — the evening chain (Bell 22:00 → Wallpaper
     23:10) writes it nightly, so two silent nights = the spine is dark. The
     watchman's `probeEveningChain` covers this nightly; the doctor's read is
     the on-demand mirror.
     (verified 10 Aug 2026 — the shape holds, the "nightly" does not yet.
     `EVENING[0]` really is `bell` at 22:00 and the last row really is
     `wallpaper` at 23:10 (`grep -n "id: \"bell\"" scripts/conductor.mjs` and
     the `wallpaper` row beneath it), and `probeEveningChain` really is in
     watchman.mjs (`grep -n "probeEveningChain" scripts/watchman.mjs` — defined
     once, called from the sweep). BUT: `ArsenalFC-Evening-Conductor` has NEVER
     FIRED on this box — `LastRunTime 30-11-1999`, `LastTaskResult 0x41303`,
     registered 2026-08-09T22:30 i.e. two hours AFTER that night's 22:00 trigger,
     `NextRunTime 10-08-2026 22:00`. The report sitting on disk is a 9-step run
     stamped 2026-08-09T17:03Z that the scheduled task therefore did not
     produce, and the chain in code now has ELEVEN steps (scoreboard +
     nikhil-model joined on 10 Aug), so the report is two organs behind the
     roster. Treat "writes it nightly" as the design until a report appears whose
     step list matches
     `node -e "import('./scripts/conductor.mjs').then(m=>console.log(m.EVENING.map(s=>s.id).join(', ')))"`.)
   - **THE AWAY-DAY LANE** — the cloud CI verdict. **READ**
     `dressing-room/state/awayday.json` (the Read tool is enough — a small JSON).
     🔴 if `state` is `red`, naming `head_sha` and `run_url`; 🟡 if
     `unreachable` is non-null (the last read-back could not reach GitHub, so the
     verdict beside it is last-known, not today's) or if `checked_at` is not
     within the last day (the read-back rides groundsman's DAILY 03:45 push lane,
     so two silent days = nobody is fetching the verdict); 🟢 on `green`; file
     absent → "NOT MEASURED", never "healthy". `running`/`unknown` are not
     verdicts — report them as in-flight and move on.
     **NEVER run `node scripts/awayday.mjs check` for this.** It is not read-only
     in the way it looks: `checkLane()` writes awayday.json, fires a live GitHub
     call, and on a NEW red run shells `captains_call.mjs file` — a doctor must
     not mutate the organ it is examining, and must never deal the captain a card
     as a side effect of taking a temperature.
     (added 11 Aug 2026, wiring audit. WHY IT IS HERE AT ALL: awayday.json's only
     reader in the entire repo was its own writer, using two of its fifteen fields
     for a duplicate-card lock — the lane was RED on 8df28ba with its one card
     already dealt and no organ knew. `physio.mjs` now bleeds `away_day_lane_red`
     / `away_day_read_blind` into loop_vitals.json, so if step 1's physio run is
     green here, do not re-litigate it; this read is for the sha and the link.
     WHY THE WATCHMAN CANNOT COVER IT: its nightly sweep runs the same suites
     LOCALLY, where the gitignored credentials and the full working tree exist —
     a failure that only happens in a clean cloud checkout is invisible to it by
     construction, which is the whole reason this lane exists.)
   - schedule alive? Use PowerShell, NOT the Bash tool — under Git Bash the
     forward-slash flags get MSYS-mangled into a path and schtasks errors out:
     `Get-ScheduledTask -TaskName ArsenalFC-* | ForEach-Object { $_ | Get-ScheduledTaskInfo }`
     Report count + any **enabled** task whose Last Result is non-zero.
     Three standing exclusions, so the only reds you report are real ones:
     · skip tasks whose State is `Disabled` — the retired rows are disabled BY
       DESIGN: setup/INSTALL_CONDUCTOR.ps1 replaced 14 morning tasks with
       `ArsenalFC-Morning-Conductor`, and setup/INSTALL_EVENING_CONDUCTOR.ps1
       replaced 9 evening tasks with `ArsenalFC-Evening-Conductor`; a disabled
       task's stale Last Result is not a fault.
       (corrected 10 Aug 2026: this said "the 14 morning organs … the **08:45**
       chain". TWO errors, and the first one would have sent the doctor looking
       for a chain at an hour nothing runs.
       (a) The morning conductor fires at **09:15**, not 08:45 — HIS ruling,
       7 Aug 2026. The box agrees: the task's trigger reads
       `StartBoundary 2026-08-07T09:15:00+05:30`, `NextRunTime 11-08-2026
       09:15`, and INSTALL_CONDUCTOR.ps1 says "Registering $conductorTask at
       09:15 (08:45 until 7 Aug 2026)". 08:45 survives ONLY as the legacy `at`
       LABEL on the chain's `sheet` step inside conductor.mjs — which is exactly
       what makes this mistake easy to keep making. Read the trigger, not the
       label: `(Get-ScheduledTask -TaskName ArsenalFC-Morning-Conductor).Triggers`.
       (b) 14 is now half the picture — the evening spine (Ladder D1, 9 Aug 2026)
       retired 9 more rows, so 23 read Disabled today. Count live, never here:
       `Get-ScheduledTask -TaskName ArsenalFC-* | Group-Object State`
       and read the two `$replaced` arrays in setup/ for WHICH ones:
       `grep -n "ArsenalFC-" setup/INSTALL_CONDUCTOR.ps1 setup/INSTALL_EVENING_CONDUCTOR.ps1`.)
     · `ArsenalFC-SelfKnowledge` — **the task does not exist on this box any
       more**, so there is no 0x800710E0 row left to skip. Verified 10 Aug 2026:
       `Get-ScheduledTask -TaskName ArsenalFC-SelfKnowledge` → not registered,
       and setup/INSTALL_CYBORG_TASKS.ps1 keeps its `Mk` line COMMENTED OUT,
       tagged "frozen, kept as history". This bullet now stands only in case it
       is ever re-registered. The FREEZE itself is still live and still correct —
       `node scripts/selfknowledge.mjs consumers` prints "0 LIVE consumer(s) of
       organism_self.md · 3 tombstone reference(s) … → the organ is FROZEN".
       Note it, don't red the organism for it.
       (corrected 10 Aug 2026: until today this told the doctor to expect a
       specific red that CANNOT appear — which trains exactly the wrong reflex,
       explaining away an absence instead of noticing one.)
     · a Last Result of `0x41303` is **SCHED_S_TASK_HAS_NOT_RUN** — registered,
       never fired — not a failure, and not something to red on its own. Verified
       live 10 Aug 2026 on `ArsenalFC-Evening-Conductor` (see the evening-chain
       note above): `LastRunTime 30-11-1999` with `NextRunTime 10-08-2026 22:00`.
       Report it as "registered, never fired yet" — but if a task is STILL
       0x41303 after its trigger hour has come and gone, that IS the story.
   - **THE FUEL TANKS** (issue #93, 2026-08-04; justification updated 9 Aug 2026 —
     physio.mjs has long since grown tank sight, so the old "zero hits"
     line here was rot. The tank READ below still stands on its own feet.
     Corrected 10 Aug 2026: this carried a hardcoded "(42 hits)". It was still
     exact today — `grep -c "tank" scripts/physio.mjs` → 42 — which is precisely
     why it had to go: a count that happens to be right today is a lie on a
     timer. Measure it, don't quote it. A live `node scripts/physio.mjs` says it
     out loud anyway, printing its own `· fuel N/M tanks usable` on the bleed
     line, and physio reads tanks.json RAW and read-only for the same reason
     spelled out below.) **READ**
     `dressing-room/state/tanks.json` (the Read tool is enough — it is a small
     JSON file), or run this read-only one-liner:
     `node -e "const fs=require('fs'),p='dressing-room/state/tanks.json';if(!fs.existsSync(p)){console.log('TANKS: NOT MEASURED - tanks.json has never been written');process.exit(0)}const b=JSON.parse(fs.readFileSync(p,'utf8')),d=new Date(),t=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');console.log('TANKS board day='+b.day+' today='+t+(b.day===t?' (fresh)':' STALE - nothing spent today'));for(const k in b.tanks){const v=b.tanks[k];console.log('  '+k+' '+v.state+' used '+v.used_today+'/'+v.observed_ceiling+(v.last_429?' last_429 '+v.last_429:''))}"`
     **NEVER run `node scripts/fuelboard.mjs status` for this.** It looks
     read-only and is not: `fuelboard.mjs main()` does
     `withTankLock({}, () => { const b = loadBoard(); saveBoard(b); return b; })`
     — a full read-modify-write of `tanks.json` inside the lock (deliberate, it
     persists the day-reset). A doctor must not mutate the organ it is
     examining, and a status run overlapping a live dmn/council spend is exactly
     the race that lock exists for.
     (re-verified 10 Aug 2026 — still verbatim, still true, no correction needed:
     `grep -n "withTankLock({}" scripts/fuelboard.mjs` lands inside `main()` on
     exactly that load→save pair.)
     **Read it RAW, and read the `day` field first.** The library's exported
     `summary()` is genuinely read-only, but it calls `loadBoard()`, which
     applies the local-midnight reset **in memory** — so a board last written
     two days ago comes back as seven HOT tanks at 100%.
     (re-verified 10 Aug 2026 — the mechanism holds exactly: `loadBoard()` sets
     `used_today: fresh ? … : 0` and `last_429: fresh ? … : null`, and `stateOf`
     then returns HOT for anything with a key and no fault. "Seven" is DERIVED,
     not fixed — it is every tank the reset can revive, which today is 7 of the
     8 in the registry, T3 Cochlea being DEAD by config. The registry has grown
     since 4 Aug (T8 Distiller), so count rather than quote:
     `node -e "console.log(Object.keys(require('./dressing-room/state/tanks.json').tanks).join(','))"`)
     Verified 2026-08-04:
     the raw file said `T1 COLD … T2 COLD … T5/T6/T7 COLD` while `summary()`
     rendered `T1 100% HOT | T2 100% HOT | …`. That is an unmeasured silence
     wearing a measured green, and it is the exact class of lie this whole
     chart exists to refuse.
     Report it as: **`day` ≠ today → 🟡 "tank board stale (last written <day>)
     — no fuel measured today"**, never 🟢. `day` = today → 🟢 if every enabled
     tank is HOT/WARM; 🔴 naming each COLD tank and its `last_429`. `T3` is
     DEAD by config and `T4` (the Claude Bridge) has `key_index: null` and is
     budgeted by the brain ledger, not here — neither is a fault. File absent →
     "NOT MEASURED", never "healthy".
2. If the ActivityWatch MCP is connected in this session, pull today's
   3-bucket split as a cross-check against timeaudit.json — flag divergence.
3. Reply as a physio's chart (≤13 lines): 🟢/🟡/🔴 per system — brain-alive
   (step 0, always first) · capture · sensors · brain-budget · **fuel-tanks** ·
   schedule · membrane (throw-in wired?) · mirror.
   Each 🔴 gets ONE repair line phrased inside his verbs ("one paste,
   captain"), never a chore list.
4. Constitutional: the Goalkeeper is checked for LIVENESS only (did it run?)
   — never for accuracy. The Governor is not on trial here, ever.
