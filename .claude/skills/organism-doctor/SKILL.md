---
name: organism-doctor
description: Full health check of the organism — vitals, brain budget, selftests, live schedule, AW sight. Use when anything feels off, or the captain says "doctor", "health check", "kya haal hai".
---

# /organism-doctor — the body checks itself

0. FIRST, THE VITAL SIGN THAT HID FOR FOUR DAYS — is the brain actually
   speaking, or only appearing to? Run `node scripts/brain.mjs tokens` and read
   `dressing-room/state/token_vitals.json` → `health`:
   - `health.dead: true` → 🔴 **the brain has failed every recent job**. This is
     the top line of the chart, above everything else. If
     `health.not_logged_in` is also true the repair is his and it is one line:
     "ek `/login` chahiye, captain — baaki sab zinda hai."
   - Why this comes first: in the 21–26 Jul outage the daemon was resident,
     ticks were logging, the wall rendered and the phone stayed quiet, so every
     other check read green while 2,271 jobs failed in a row. A live-looking
     corpse is the failure mode this step exists to catch. Never report the
     organism healthy without reading `health`.
1. Run in order (don't stop on failure — report all):
   - `node scripts/physio.mjs` (bleeds + speak-gates)
   - `node scripts/brain.mjs status` (budget phase, ceiling, eligibility)
   - `npm run organism:selftest` then `npm run squad:selftest`
     (report PASS/FAIL count only, name any red suite)
   - schedule alive? Use PowerShell, NOT the Bash tool — under Git Bash the
     forward-slash flags get MSYS-mangled into a path and schtasks errors out:
     `schtasks /query /fo csv /v | ConvertFrom-Csv | Where-Object { $_.TaskName -match 'ArsenalFC' }`
     Report count + any task whose Last Result is non-zero.
   - **THE FUEL TANKS** (issue #93, 2026-08-04). No health surface read tank
     state until this line existed — `physio.mjs` and `viz.mjs` have zero "tank"
     hits, and this skill never touched it, so the seven free-tier accounts
     could all be COLD and the chart still read green. **READ**
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
     **Read it RAW, and read the `day` field first.** The library's exported
     `summary()` is genuinely read-only, but it calls `loadBoard()`, which
     applies the local-midnight reset **in memory** — so a board last written
     two days ago comes back as seven HOT tanks at 100%. Verified 2026-08-04:
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
