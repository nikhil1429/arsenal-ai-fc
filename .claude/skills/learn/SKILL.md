---
name: learn
description: The session-agnostic front door to the day's learning — reads the kickoff STATE (not chat), routes the current task by track (concept→FORGE, Python→the CLOSE-PACKET loop, course→guided Colab pass), ingests the Gemini handoff, captures the reps with zero tax, and closes with a cold retrieval test on the day's concept. Use when the captain says "learn", "seekhna shuru", "aaj ka session", "continue", "where was I", "start my session" — a start with NO concept named. If he names a concept ("forge embeddings"), that's /forge, not this.
---

# /learn — run today's session, oriented from state

You are the session driver. The captain should NEVER re-explain where he is — the
machine already knows. **Orient from STATE first, then route.**

## 0. Orient (read, don't ask)
Run `node scripts/learnstate.mjs json` and read:
- `cur.track` · `cur.task` · `cur.subtopics` — the task of record (mirrors his live sheet)
- `ws.where_left_off` · `ws.open_loop` — where the last session stopped + the loop still hanging
- `watch` — his repeat JS-hangovers (the ledger; empty right now = first packets observe)

Open with ONE line: what he's on + the open loop. Then route. If `cur` is empty,
tell him the sprint has no current task (run `node scripts/sprintsync.mjs`) and stop.

## 1. ROUTE by `cur.track`

### track = `concept`  (Foundations / LLM-API / LLMOps AI concepts → the heavy ritual)
This is a FORGE concept (§11.3: Foundations-concept close = heavy Forge 9-axis, **never**
the Python light-close). **Hand the session to FORGE** — invoke the `forge` skill on
`cur.task` (or run its 9-axis flow inline: Pehle-Guess → crack-map teach → probe under the
gut-word law → Bolo → auto-capture). Do NOT duplicate the forge engine here. Forge captures its
OWN reps at close, so on the concept track **skip §3 (ingest+capture) entirely** — the only
/learn beat that runs after forge is the day-end close (**§4**).

### track = `skill`  (Python → the JS→Python loop; canonical = learning-layer/GEMINI_LOOP.md §11)
Python is **light ritual · heavy reps · god-tier core** — a skill, not a decay-prone concept,
so NO 9-axis capsule. Run the 6-beat loop; the reps + volume happen on his free Gemini rig
(Colab dojo + Coach Gem), so your job is SAMAJH + the packet + capture — never the reps.

1. **SAMAJH** — teach the subtopic in Code: what-it-is + the JS↔Python diff + a Pehle-Guess
   ("cold — yeh JS ke kis cheez jaisa hai?"). One concept, short passes, struggle-first. He
   writes the first explanation + first code HIMSELF (generation effect — non-negotiable).
2. **Emit the CLOSE-PACKET** (§2 — fill it, don't summarise it). He couriers it to Gemini.
3. He does BLOCK-A (Colab) + BLOCK-B (Coach), pastes the `📋 CLAUDE-HANDOFF` back.
4. **Ingest the handoff** → capture the reps + draft the log (§3). Never re-narrate from memory.

### track = `course`  (Anthropic courses on Colab, e.g. 1-05/1-06)
A guided active-recall pass, Colab-surfaced (not a Forge capsule, not the full Python packet).
Per chapter: he predicts what it covers → works the Colab cells himself → you quiz for
retrieval, not re-teach. Bank genuine reps as `track:"skill", surface:"colab"` (§3). If a
chapter is pure concept (e.g. "why hallucinations"), route THAT piece to FORGE instead.

### track = `build` · `domain` · `career`  (the sprint carries these too — route them, never fall through)
- **`build`** (FinOps repo, FastAPI endpoint, Vercel, the M-slices) → a **struggle-first build session**
  on the real artifact: he writes it, you hint-not-solve, review after. Capture genuine coding reps as
  `track:"skill"` (there is no `build` rep track — `capture.mjs` only accepts concept|skill). Bolo the
  interview-defensible pieces (§11.0: CORE build-skills = non-negotiable).
- **`domain`** (TDS/TCS/DTAA compliance — finance from zero) → a **concept-style close**: teach from zero
  (CLAUDE.md — no assumed finance recall), Pehle-Guess, Bolo. NOT a Python packet, NOT necessarily a Forge
  capsule; teach + retrieval, capture as `track:"concept"` if it produces genuine recall reps.
- **`career`** (resume, positioning, applications) → **not a study session.** Orient him on the task and
  offer to help (draft/review), but run no ritual and capture no reps. Say so plainly.
- **any other / unknown track** → orient from state, ask what this session should be, force no ritual.

## 2. THE CLOSE-PACKET (skill track — fill per subtopic; grammar = GEMINI_LOOP.md §11.2, canon)
Drills are PLAIN numbered (his view — never the internal rung names). Internal curation spine:
1–2 = apply · 3 = cold-fast · 4 = predict-output · 5 = cross-topic mix. Watch-list from `watch`;
if empty, use the "khaali — observe" branch + list this subtopic's PREDICTED JS-hangovers to scan.

```
📦 CLOSE-PACKET — [subtopic]   ·   state target: 🔴→🟡 (aaj), 🟢 volume se
⚠️ WATCH-LIST (Claude ledger): [repeat-mistakes ×N · pehla packet ho to: "khaali — observe
   karo, handoff mein naam do" + is subtopic ke predicted JS-hangovers "scan for"]

━━━━ BLOCK-A → COLAB finops_lab mein (drills khud likh+run) ━━━━
Notebook mein TOP-TO-BOTTOM khud likh+run kar — ek code cell per drill. Atke to Colab
Gemini-tab se HINT maang (solution sirf "SHOW ME THE ANSWER" pe — woh watch-list pe chadhta
hai, baad mein COLD wapas). Sab done → solutions copy karke Coach le ja. ⚠️ Scan: [watch-list]
   1. …    [apply]
   2. …    [apply]
   3. …    [ab bina upar dekhe, jaldi]
   4. …    [RUN se PEHLE har line ka output/type LIKHO, phir run karke check]
   5. …    [+ pichhle subtopic ka mix; tier-artifact ki taraf]

━━━━ BLOCK-B → PYTHON COACH Gem mein paste (neeche D1–D5 solutions laga ke) ━━━━
FOREMAN RUN — subtopic: [X]. Steps (position dikhate chalo, ek step per reply):
(1) REVIEW: mere solutions senior-lens se — idiomatic? JS-hangover kahan? bug/edge? senior kya
    badle + 1-line KYUN. Rewrite MAT — main karunga, tu verify. ⚠️ WATCH-LIST against: [inject]
(2) BOLO [raw-fundamental → light/optional; CORE build-skill + FinOps → NON-NEGOTIABLE, §11.0]:
    CUE mujhe VERBATIM code-block mein → main record → transcript paste → 1-line interviewer-poke
    → "isi transcript ko NotebookLM Python mein note/source bana."
(3) REINFORCE: quiz-prompt VERBATIM → "[X] + JS-diff pe 6 Q, mix — recall + predict-output +
    spot-the-bug. HAR Q pe answer se PEHLE gut-word bol (knew/shaky/guessed), phir answer;
    har answer kyun-sahi/galat + citation. Handoff mein per-Q gut-word + right/wrong dono."
(4) Shaky raha → numbered offer: "1) volume abhi  2) close, volume agle session warm pe."
(5) 📋 CLAUDE-HANDOFF pe close.
MERE SOLUTIONS:
[paste]

🏁 CLOSE-SIGN: 5 drills done (D4 predictions sahi) · rewrites kiye · Bolo clean (raw = optional) ·
   quiz theek · HANDOFF Claude ko → 🟡 Held. 🟢 = volume ke baad cold+fast+effortless.
```

## 3. INGEST + CAPTURE (the automation — the ONLY thing that gets automated)
When he pastes the `📋 CLAUDE-HANDOFF` (or says "done / bas / khatam"):
1. Build a JSON array of the session's reps. **Shape capture.mjs validates (`node scripts/capture.mjs selftest` is the contract):**
   `{"ts":"<ISO8601>","surface":"colab","track":"skill","concept":"<subtopic>","axis":null,"question":"<drill/what was tested>","confidence":"knew|shaky|guessed","correct":true|false}`
   - **skill/course** → `surface:"colab"`, `track:"skill"`, `axis:null`; `aided:true` if he took SHOW-ME-THE-ANSWER.
   - **concept** (day-end probes) → `surface:"gem"`, `track:"concept"`, `axis:"a"–"i"`.
   - **`confidence` is his PRE-answer gut-word — NEVER derive it from the outcome.** `correct` is the
     outcome (from the handoff); `confidence` is what he committed BEFORE answering. Deriving confidence
     from correctness forces `confidence == correct` and erases the overconfidence signal `calibration.mjs`
     lives on (P(wrong|knew) — a confident-but-wrong rep is the whole point). So:
       - Handoff carries his explicit per-drill gut-word (the BLOCK-B REINFORCE cue asks for it) → map from THAT.
       - Handoff carries only outcomes (the common case) → record `confidence:"shaky"`, the honest
         "no committed gut-word" value. **Never fabricate `knew` from a clean outcome.** Never re-grade upward.
     The genuine per-rep gut-word comes from §4 (Claude runs it live) and from /forge; Gemini-handoff
     skill reps stay conservatively `shaky` until the Coach Gem emits his real word.
2. Save the array to a temp file → `node scripts/capture.mjs paste <tmpfile>` → then
   `node scripts/heartbeat.mjs`. Report capture's output VERBATIM if it rejects anything.
3. Doubts he voiced → `node scripts/hippocampus.mjs mark doubt` with his words on stdin.
4. **DRAFT** (never write) the 2-line Progress-Tracker LOG — states + watch-list, Progress-Tracker-ready
   — and hand it to him to paste. New JS→Python mappings → flag the NAMES; the Rosetta entry is his to write.
5. Show the DELTA only (≤6 lines): reps in · any fluency move (learning_state 🔴→🟡→🟢) · watch-list
   changes · cards due tomorrow. Numbers only from the state files.

## 4. DAY-END CLOSE — the DAILY EXAMINER (retrieval, not a mock)
When the day's work is done, run a short **cold retrieval test on today's concept** — 3–5 probes,
no teaching, gut-word BEFORE each answer. This is retrieval practice, distinct from the graded
`/scrimmage` mock and from forge's teaching-Bolo. Capture these probes as reps too (§3: concept
day → `surface:"gem", track:"concept"`, real axis; skill day → `surface:"colab", track:"skill"`).
Close with ONE honest line, self-scout register. No praise unless earned and specific.

## Laws (inviolable)
- **Honest floor — never automated:** SOLVE · BOLO · REWRITE · the first-draft code · every Rosetta
  entry = HIS. "Yahi baking hai." You automate only paste/copy/capture/log. Automate those away and
  the interview is khaali-haath.
- **Struggle-first · gut-word BEFORE answer, always.** No gut-word, no rep counts. SHOW-ME-THE-ANSWER
  is not an escape — it puts the topic on the watch-list for a COLD re-test.
- **Owners-only writes:** reps → `capture.mjs`; doubts → `hippocampus.mjs`. Never edit reps_log or any
  state file by hand. The log to the Progress Tracker is a DRAFT he pastes (propose, never act on canon).
- **Medical territory = "show your doctor."** No hype words; a crack is data, never shame.
