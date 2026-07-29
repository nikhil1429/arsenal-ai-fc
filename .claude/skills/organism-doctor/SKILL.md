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
2. If the ActivityWatch MCP is connected in this session, pull today's
   3-bucket split as a cross-check against timeaudit.json — flag divergence.
3. Reply as a physio's chart (≤12 lines): 🟢/🟡/🔴 per system — brain-alive
   (step 0, always first) · capture · sensors · brain-budget · schedule ·
   membrane (throw-in wired?) · mirror.
   Each 🔴 gets ONE repair line phrased inside his verbs ("one paste,
   captain"), never a chore list.
4. Constitutional: the Goalkeeper is checked for LIVENESS only (did it run?)
   — never for accuracy. The Governor is not on trial here, ever.
