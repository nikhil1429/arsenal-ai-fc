---
name: fire
description: Fire a staged Gemini mission with ZERO copy-paste tax — Claude drives the captain's Chrome to Gemini (Deep Research for the four audit missions, REGULAR Gemini Pro research for the generated T-/L- ones), pastes the mission prompt, he clicks Start (his word stays the trigger); later "le lo" ingests the finished report straight from the browser. Use when he says "fire", "fire M01", "mission chalao", answers haan on a mission fire-card, or says "le lo" / "mission wapas" / "report aa gayi" for the return leg.
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
   **STAGED IS NOT THE SAME AS UN-FIRED — read `fired_at` on the row, never the list column**
   (corrected 10 Aug 2026: this step said only "`ingested_at: null`", and the list cannot
   carry the rest — it prints `staged <N>d` for ANY row with no return, fired or not
   (`grep -n "✓ ingested" scripts/scout.mjs`). Live proof the same day: `mission list` printed
   `M01 … staged 2d` while `missions.json` already held `"fired_at": "2026-08-10T11:12:14.640Z"`
   on that very row, and `T-hallucinations` too. A row with `fired_at` and no `ingested_at` is
   IN FLIGHT — that is a "le lo?" case, not a fire case. The code will not stop you: the fire
   stamp refuses only an id that has already RETURNED and otherwise just re-stamps the clock
   (`grep -n "row.fired_at" scripts/scout.mjs`), so this guard lives here, in the skill.)
2. Read the mission file yourself — the path is the row's own `file` field, never a name you
   build out of the ID (corrected 10 Aug 2026: this said "`dressing-room/missions/<ID>.md`",
   which is true only for the GENERATED T-/L- prompts (`grep -n "stageGenerated" scripts/scout.mjs`);
   the four hand-authored audits sit at `M01__audit_fundamentals_rubric.md` ·
   `M02__audit_rag_cluster.md` · `M03__audit_agents_api_cluster.md` ·
   `M04__audit_llmops_python_market.md` (`grep -n "M01__audit" scripts/scout.mjs`), so
   `dressing-room/missions/M01.md` does not exist on disk and this read would have failed on
   the FIRST MISSION EVER.)
   **Paste FROM the marker down.** Every mission file carries a `---- PASTE FROM HERE …` line;
   everything above it is machine header comments, not prompt — scout's own selftest asserts
   the marker exists (`grep -n "PASTE FROM HERE" scripts/scout.mjs dressing-room/missions/*.md`).
3. Drive HIS Chrome (claude-in-chrome MCP — same pattern as /gem-sync; the tab-lister on that
   server is named `tabs_context_mcp`, checked against the live tool list 10 Aug 2026 — a bare
   `tabs_context` belongs to a different browser server, so read the tool list before calling):
   navigate to `https://gemini.google.com` → **set the mode the MISSION names, not a fixed one** →
   paste the mission prompt (from the marker) into the input.
   **DEEP RESEARCH IS NOT UNIVERSAL** (corrected 10 Aug 2026: this step said "select **Deep
   Research** mode" for every fire, while step 1 above routes T-/L- missions down the same
   path. The code reserves the expensive rig: *"Both are REGULAR Gemini Pro research (Deep
   Research is reserved for the four audits + rare deep-dives — rig cost rule)"*
   (`grep -n "rig cost rule" scripts/scout.mjs`), and each mission file states its own mode on
   a `Fire on:` line — M01–M04 say *"Gemini Pro → Deep Research (mehnga hai — one-time spend,
   captain's ruling)"*, T-/L- say *"regular research — NOT Deep Research"*
   (`grep -n "Fire on:" dressing-room/missions/*.md`). Firing T-hallucinations into Deep
   Research would have spent the one-time rig against his own cost ruling.)
   **DO NOT press send/start.** Say: *"<ID> loaded — Start dabao."* HIS CLICK is
   the fire (the ruling's letter and its spirit).
4. THE FIRE STAMP (LADDER C2, 9 Aug 2026): the moment he clicks Start, run
   `node scripts/scout.mjs mission fired <ID>` — the stamp is what lets the
   return-leg watcher wake ("le lo?" card) if 24h pass with no return. No
   stamp = a fired mission the organism cannot miss. Also press the rail stamp
   (LADDER E7): `node scripts/scout.mjs chrome-stamp fire` — physio watches the
   rails' pulse through it.
   Two details the code owns (verified 10 Aug 2026, both true as written above —
   noted here only because acting on them wrong is silent): the "le lo?" card is
   minted by the card organ, pull-derived from `fired_at` + no `ingested_at` past
   24h (`grep -n "mission:return:" scripts/captains_call.mjs`), and `mission fired`
   refuses an id that already returned. **Press the RAIL stamp only after a drive
   that actually worked** — physio reads the NEWEST stamp and stays quiet for 7 days
   (`grep -n "chromeRailStale" scripts/physio.mjs`), so a stamp pressed over a failed
   drive hides a dead rail for a week.
5. One closing line only: what this mission will bring back, and that he can walk
   away — Deep Research takes minutes; the return leg waits for his word, today
   or any day. (That "Deep Research" describes the AUDIT mode only — a T-/L- fire
   went out as regular research per step 3; noted 10 Aug 2026 so the closing line
   does not re-introduce the mode error corrected above.)
   The browser tools not connected? Fall back honestly: open the mission file
   content in the chat for a single manual copy, and say that this is the taxed
   path — reconnect Chrome next time (and still press the fire stamp once he
   says he pasted it).
   On that taxed path "the fire stamp" means `mission fired <ID>` and ONLY that —
   **do not press `chrome-stamp fire`** (clarified 10 Aug 2026: the two stamps are
   different organs. `mission fired` records HIS click; the rail stamp records that
   the Chrome drive SUCCEEDED, which on this path it did not — `grep -n "chrome-stamp"
   scripts/scout.mjs` and the physio reader above.)

## RETURN LEG — he said "le lo" / "report aa gayi"

1. Find his Gemini tab (tabs_context → the gemini.google.com tab), read the
   finished report with get_page_text (scroll/expand if truncated — the WHOLE
   report, missions deserve full returns).
   (Same tool-name caveat as the fire leg's step 3, 10 Aug 2026: on the claude-in-chrome
   server the lister is `tabs_context_mcp`; `get_page_text` is exact as written.)
2. Write it verbatim to `dressing-room/state/scout_reports/` via the owner:
   save to a temp file, then `node scripts/scout.mjs mission ingest <ID> --file <path>`.
   (Verified 10 Aug 2026 — three things the command does that this step never said, and
   each one bites: the ID match is case-insensitive; the report FILENAME is the owner's,
   `mission_<ID>_<YYYY-MM-DD>.md`, so never invent one; and a return under 40 characters is
   REFUSED outright — `grep -n "too thin" scripts/scout.mjs`. `--file` is optional: the same
   door reads the report on stdin.)
3. Confirm in one line: ingested, diff card will deal at the next anchor
   (canon changes only on his word — Ruling 6).
   The card is not this skill's to file — the card organ derives one `mission:diff:<ID>` per
   returned mission by itself (`grep -n "mission:diff:" scripts/captains_call.mjs`), so say it
   and stop.
4. If this was the LAST audit mission (M01–M04 all ingested): remind him in one
   line that his word closes the gate — `node scripts/scout.mjs mission audit-close
   --note "<his words>"` — and that benchmark starts speaking the moment he says it.
   Ask nothing else; the audit-close is a card/anchor moment, not a chase.
   (Verified 10 Aug 2026: `audit-close` refuses while any of the four is still out — it names
   the missing ones — and refuses an empty `--note` with *"canon = his word"*
   (`grep -n "canon = his word" scripts/scout.mjs`). Until it lands the benchmark answers
   `gated_pre_audit` and computes nothing — `grep -n "gated_pre_audit" scripts/benchmark.mjs`.)

## PYTHON COURIER LEG (LADDER C3, 9 Aug 2026) — the CLOSE-PACKET rides this rail
<!-- "LADDER C3" NOT VERIFIED 10 Aug 2026 — could not confirm from code; treat as a claim.
     Its siblings DO carry code proof (`grep -n "LADDER C2" scripts/scout.mjs scripts/captains_call.mjs`
     and `grep -n "LADDER E7" scripts/scout.mjs scripts/physio.mjs`), but no C3 marker for this
     courier exists anywhere in scripts/ — the only "C3" comments in the repo belong to the
     Watcher's frame resolution and to a hippocampus snapshot fix, both unrelated. The rail
     itself is real and described correctly below; only the ladder label is unsourced. -->


When he closes a Python subtopic (or says "packet bhejo" / "fire packet"):
1. **CLAUDE emits the CLOSE-PACKET; the script only RECORDS that it went out.**
   Fill the canon template — `learning-layer/GEMINI_LOOP.md` §11.2, headed *"THE PACKET v2
   TEMPLATE (Claude har subtopic-close pe yeh BHARKE emit kare)"* — and never reword its
   grammar. Then, AFTER it is emitted, run `node scripts/python_state.mjs packet "<subtopic>"`.
   (corrected 10 Aug 2026: this step said *"`node scripts/python_state.mjs packet` — the
   CLOSE-PACKET is the owner's verbatim emission"*, and that command emits no packet at all.
   Read it: it builds a `last_packet` record (subtopic · tier · drills · state_target · the
   top-3 watch-list injections), commits it to python state and prints two confirmation lines
   starting `📦 packet recorded —` (`grep -n "packet recorded" scripts/python_state.mjs`).
   Following the old line would have couriered the string "📦 packet recorded — …" into his
   Gemini instead of a packet. The subtopic argument is optional and falls back to the current
   `state.subtopic`, and with nothing current it exits with an error — today
   `node scripts/python_state.mjs status` still prints *"python: not started"*, so the packet
   leg has never had live state to record.)
2. Same Chrome rail as a mission: gemini.google.com (his normal Gemini chat, NOT
   Deep Research), paste the packet, **he clicks Send** — his word stays the
   trigger, exactly as with missions.
   **What the rail carries is BLOCK-B, not the whole packet** (corrected 10 Aug 2026: PACKET v2
   is two paste-blocks, and they go to two different places — §11.2 in
   `learning-layer/GEMINI_LOOP.md` labels them *"BLOCK-A → COLAB finops_lab mein (drills khud
   likh+run)"* and *"BLOCK-B → PYTHON COACH Gem mein paste"*. BLOCK-A is his notebook work and
   never rides this courier; the destination for BLOCK-B is the PYTHON COACH Gem, not a bare
   chat. This is the canon doc's own wording, cited because no script emits the packet to
   check against.)
3. The return leg is /harvest, NOT mission ingest: the sitting's CLAUDE-HANDOFF
   block comes home on the bus with the whole conversation when he says
   "harvest". Say that in one line and stop.
4. SOLVE/BOLO/REWRITE stay untouched — the courier carries the packet only; the
   drills themselves are his hands in Gemini, never pre-filled.

## NEVER
- Never press Start yourself. Never reword a mission prompt (scout owns them).
  (Precise, 10 Aug 2026: scout GENERATES the T-/L- prompts, but M01–M04 are hand-authored
  and the organ *"only REGISTERS, never rewrites"* them — `grep -n "only REGISTERS" scripts/scout.mjs`.
  The instruction stands either way; the reason differs, and the four audits have no
  regenerating owner to restore them if a word is lost.)
- Never re-open the SYLLABUS from a mission return — missions tune EMPHASIS only
  (his non-negotiable guard).
- Never make him copy-paste anything while Chrome tools are connected.
- Max ONE mission per "fire" — serial, like every captain's-word lane.
