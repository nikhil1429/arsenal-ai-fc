---
name: organism-doctor
description: Full health check of the organism — vitals, brain budget, selftests, live schedule, AW sight. Use when anything feels off, or the captain says "doctor", "health check", "kya haal hai".
---

# /organism-doctor — the body checks itself

1. Run in order (don't stop on failure — report all):
   - `node scripts/physio.mjs` (bleeds + speak-gates)
   - `node scripts/brain.mjs status` (budget phase, ceiling, eligibility)
   - `npm run organism:selftest` then `npm run squad:selftest`
     (report PASS/FAIL count only, name any red suite)
   - `schtasks /Query /FO CSV | findstr ArsenalFC` (schedule alive?)
2. If the ActivityWatch MCP is connected in this session, pull today's
   3-bucket split as a cross-check against timeaudit.json — flag divergence.
3. Reply as a physio's chart (≤12 lines): 🟢/🟡/🔴 per system — capture ·
   sensors · brain · schedule · membrane (throw-in wired?) · mirror.
   Each 🔴 gets ONE repair line phrased inside his verbs ("one paste,
   captain"), never a chore list.
4. Constitutional: the Goalkeeper is checked for LIVENESS only (did it run?)
   — never for accuracy. The Governor is not on trial here, ever.
