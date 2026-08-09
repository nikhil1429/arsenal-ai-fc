---
name: fire
description: Fire a staged Gemini mission with ZERO copy-paste tax — Claude drives the captain's Chrome to Gemini Deep Research, pastes the mission prompt, he clicks Start (his word stays the trigger); later "le lo" ingests the finished report straight from the browser. Use when he says "fire", "fire M01", "mission chalao", answers haan on a mission fire-card, or says "le lo" / "mission wapas" / "report aa gayi" for the return leg.
---

# /fire — the outward loop with his hands in his pockets

**THE LAW THIS RIDES (his sealed ruling, 8 Aug 2026):** the machine writes missions,
**HE fires them.** This skill does not bend that — it moves every mechanical step
(open file, copy, switch tab, paste, save, run ingest command) onto the machine and
leaves him exactly TWO human moments: the click that starts the research, and the
word that brings it home. That is the whole ADHD design: **his word = the trigger,
the machine = every finger-movement around it.**

## FIRE LEG — he said "fire" (or haan on a mission card)

1. `node scripts/scout.mjs mission list` (or read `dressing-room/state/missions.json`)
   — find staged missions (`ingested_at: null`). He named one? Use it. He didn't?
   Take the OLDEST staged (M01 → M04 → T- → L-), tell him which in one line.
2. Read the mission file from `dressing-room/missions/<ID>.md` yourself.
3. Drive HIS Chrome (claude-in-chrome MCP — same pattern as /gem-sync):
   navigate to `https://gemini.google.com` → select **Deep Research** mode →
   paste the full mission prompt into the input.
   **DO NOT press send/start.** Say: *"<ID> loaded — Start dabao."* HIS CLICK is
   the fire (the ruling's letter and its spirit).
4. THE FIRE STAMP (LADDER C2, 9 Aug 2026): the moment he clicks Start, run
   `node scripts/scout.mjs mission fired <ID>` — the stamp is what lets the
   return-leg watcher wake ("le lo?" card) if 24h pass with no return. No
   stamp = a fired mission the organism cannot miss. Also press the rail stamp
   (LADDER E7): `node scripts/scout.mjs chrome-stamp fire` — physio watches the
   rails' pulse through it.
5. One closing line only: what this mission will bring back, and that he can walk
   away — Deep Research takes minutes; the return leg waits for his word, today
   or any day.
   The browser tools not connected? Fall back honestly: open the mission file
   content in the chat for a single manual copy, and say that this is the taxed
   path — reconnect Chrome next time (and still press the fire stamp once he
   says he pasted it).

## RETURN LEG — he said "le lo" / "report aa gayi"

1. Find his Gemini tab (tabs_context → the gemini.google.com tab), read the
   finished report with get_page_text (scroll/expand if truncated — the WHOLE
   report, missions deserve full returns).
2. Write it verbatim to `dressing-room/state/scout_reports/` via the owner:
   save to a temp file, then `node scripts/scout.mjs mission ingest <ID> --file <path>`.
3. Confirm in one line: ingested, diff card will deal at the next anchor
   (canon changes only on his word — Ruling 6).
4. If this was the LAST audit mission (M01–M04 all ingested): remind him in one
   line that his word closes the gate — `node scripts/scout.mjs mission audit-close
   --note "<his words>"` — and that benchmark starts speaking the moment he says it.
   Ask nothing else; the audit-close is a card/anchor moment, not a chase.

## PYTHON COURIER LEG (LADDER C3, 9 Aug 2026) — the CLOSE-PACKET rides this rail

When he closes a Python subtopic (or says "packet bhejo" / "fire packet"):
1. `node scripts/python_state.mjs packet` — the CLOSE-PACKET is the owner's
   verbatim emission (GEMINI_LOOP §11 template). Never reword it.
2. Same Chrome rail as a mission: gemini.google.com (his normal Gemini chat, NOT
   Deep Research), paste the packet, **he clicks Send** — his word stays the
   trigger, exactly as with missions.
3. The return leg is /harvest, NOT mission ingest: the sitting's CLAUDE-HANDOFF
   block comes home on the bus with the whole conversation when he says
   "harvest". Say that in one line and stop.
4. SOLVE/BOLO/REWRITE stay untouched — the courier carries the packet only; the
   drills themselves are his hands in Gemini, never pre-filled.

## NEVER
- Never press Start yourself. Never reword a mission prompt (scout owns them).
- Never re-open the SYLLABUS from a mission return — missions tune EMPHASIS only
  (his non-negotiable guard).
- Never make him copy-paste anything while Chrome tools are connected.
- Max ONE mission per "fire" — serial, like every captain's-word lane.
