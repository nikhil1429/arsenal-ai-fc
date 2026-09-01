---
name: learn
description: The session-agnostic front door to the day's learning — reads the kickoff STATE (not chat), routes the current task by track (concept→FORGE, Python→the CLOSE-PACKET loop, course→guided Colab pass), ingests the Gemini handoff, captures the reps with zero tax, and closes with a cold retrieval test on the day's concept. Use when the captain says "learn", "seekhna shuru", "aaj ka session", "continue", "where was I", "start my session" — a start with NO concept named. If he names a concept ("forge embeddings"), that's /forge, not this.
---

# /learn — run today's session, oriented from state

> ## ⚠ THE OPERATING SPINE — READ THIS BEFORE ANYTHING ELSE
> **`docs/archive/SAMJHAO_MERGED__2026-08-30.md` is the binding order for this lane. Open it
> FIRST and read its RESUME block — it says where he actually is.** FORGE and SAMJHAO are
> ONE process since 30 Aug 2026, on his word (*"ok all approved"*, act `amtfkb4r48m`,
> teaching-contract rule 31). RE-JIRAH stays separate, as the topic's cold test.
>
> **GAME ON — 30 Aug 2026, 7:30 AM IST: the pre-cyborg era is CLOSED** (canon `7744acf1`).
> Every learning record before that stamp measures the INSTRUMENT, not him, and the syllabus
> RESTARTS at the first topic. The four locked capsules are re-opened as UNLEARNED, so a
> Re-Jirah on them is no longer due — it would test a proof that no longer exists, and the
> code now refuses it (`registry.mjs gameOnEpoch`, one row, one reader).
> ⚠ **BUT THE NOTES ARE NOT WITHDRAWN, ONLY THE PROOF IS** (his correction the same breath,
> canon `b40e585d`): *"keep my 4 closed topic notes data as a powerful resource and use that
> while teaching me everything from the scratch again."* The capsules stay IMMUTABLE and stay
> OPEN as the teaching resource — `doubts` holds his own questions, `traps` the exact baits he
> fell for, `calibration` what he predicted about himself. **Teach from zero WITH them open:
> they say in advance where he will break.** Never "you already know this" (HOW_HE_LEARNS #10).
> Any stored strike on a re-opened topic needs a FRESH question — a burned axis is burned.


You are the session driver. The captain should NEVER re-explain where he is — the
machine already knows. **Orient from STATE first, then route.**

## 0. Orient (read, don't ask)
0a. **Register the sitting (ONE OPEN SITTING law, Block 3):** run `node scripts/sitting.mjs open --surface code` FIRST. If a sitting is already open (voice), it JOINS it — same id, same plan, same bank; never a second sitting. The line it prints (route · task · plan) is where you are; do not re-derive it.

Run `node scripts/learnstate.mjs json` and read:
- `cur.track` · `cur.task` · `cur.subtopics` — the task of record (mirrors his live sheet)
- `ws.where_left_off` · `ws.open_loop` — where the last session stopped + the loop still hanging
- `watch` — the **NEMESIS concept weakness-list**, NOT the JS-hangover ledger
  *(corrected 10 Aug 2026: this line said "his repeat JS-hangovers (the ledger; empty right now =
  first packets observe)" until today, and it was wrong twice over. (a) OWNER — `gather()` builds
  `watch` out of `weaknesses.json`, which `nemesis.mjs` derives from CONCEPT misses in
  `reps_log.jsonl`; verify: `grep -n "const watchSrc" scripts/learnstate.mjs`. The JS-hangover
  ledger is a **different store with a different producer**, and `python_state.mjs` says so in its
  own header — `grep -n "THE WATCH-LIST BOUNDARY" scripts/python_state.mjs`: a hangover arriving in
  a Gemini 📋 HANDOFF never enters reps_log, so nemesis structurally cannot hold it. (b) "empty
  right now" is exactly the hardcoded status that rots — a live read today returns
  `["hallucinations (a)","embeddings (a)"]`. **Read it live, never from this line.)*
- `node scripts/forge_session.mjs boot` — whether a forge session is still **OPEN** on disk
  (concept, step, axes already closed, which of them are ungraded), or when the last one
  closed. `learnstate.mjs json` is structurally blind to this: `gather()` reads
  sprint/working_set/weaknesses only. **If a session is open, do NOT re-teach its closed
  axes** — then do **what boot's second line says**, which depends on the session's AGE.
  *(corrected 10 Aug 2026: this read "`close` it first, read the coverage aloud, then continue"
  unconditionally, which is only true for a STALE session and orders a wrong action on a live one.
  `forge_session.mjs` sets `STALE_HOURS = 18` and boot branches on it — verify:
  `grep -n "Resume it — do NOT re-teach" scripts/forge_session.mjs`. OLDER than 18h → "Run `close`
  FIRST (that is the only thing that saves the coverage report), then `start <concept>`". YOUNGER →
  "Resume it … do NOT run `start` again (it will refuse). Continue at STEP N." Live proof the same
  day: boot on the open `hallucinations` session, 3.9h old, printed the RESUME branch. Closing that
  session would have thrown away a half-run step for nothing. The same age rule is what
  `learnstate.mjs`'s arbiter ranks on — `grep -n "kal se khula pada hai" scripts/learnstate.mjs`.)*

- `node scripts/deep.mjs` — what is already LOCKED, and what Re-Jirah is due. Cheap, read-only
  (verified 10 Aug 2026: `deep.mjs` contains no `writeFileSync`/`appendFileSync` at all).
  **Check this before starting anything new.** Measured 4 Aug 2026: embeddings 41d, inference 38d,
  context 34d overdue, and **three of the four capsules had never been re-tempered once**
  (`rounds_done: 0`) while 36 ready-written strike questions sat unused. He has been depositing
  and never withdrawing. A due Re-Jirah usually beats a new concept — say so, and let him choose.
  *(10 Aug 2026 — THE FINDING HELD, THE NUMBERS DID NOT, which is the point. Re-measured today:
  still three of four at `rounds_done: 0` (tokenization is the only one at 2), still 36/36 axes
  written, but the overdue counts have each walked on six days — embeddings 47d, inference 44d,
  context 40d, plus tokenization R3 at 14d. **Never quote the day-counts from this line** — run
  `node scripts/deep.mjs` and read them off the live screen; the per-capsule `rounds_done` is
  `node -e` on `dressing-room/state/capsule_map.json` or just `node scripts/rejirah.mjs state`.)*

Open with ONE line: what he's on + the open loop. Then route. If `cur` is empty,
tell him the sprint has no current task (run `node scripts/sprintsync.mjs`) and stop.

### RE-READ / RE-JIRAH (he wants to revisit, not start new)
Triggers: *"revise"*, *"purana dohrana hai"*, *"re-jirah"*, *"yaad nahi raha"*, or a due queue.
1. `node scripts/deep.mjs due` — the queue, **strike questions only, notes shut** (controller-v0
   knob 1, ALWAYS-COLD: *struggle is the feature*). He answers cold, out loud, BEFORE anything opens.
2. `node scripts/deep.mjs <concept> <axis>` — only then the weld and the full `deep` layer, in his
   own words. Never paraphrase it back at him; it is the text he will defend in an interview.
3. Held clean → note it. Cracked → re-weld NOW, and the crack is **data, never a verdict**.
   **Re-weld from HIS OWN capsule-level layers, never from your own words** — the material is
   already written and it is his: `node scripts/deep.mjs <concept> traps` (the seductive-wrong
   that probably caught him) · `bridges` (where the concept joins its neighbours) · `threeways` ·
   `lines` · `calibration` · `build`. Those seven commands did not exist until 10 Aug 2026: the
   fields were in every capsule from lock day and `deep.mjs` rendered NONE of them, so a re-weld
   here reached for the model's phrasing while ~38k characters of his defended prose sat one
   `readFileSync` away. `node scripts/deep.mjs <concept>` (the spine) indexes all of them live
   with counts — read the counts off that screen, never from this line.
   **Then RECORD it — `node scripts/rejirah.mjs grade <concept> <axis> held|cracked --gut <word>`.**
   Before 5 Aug 2026 this had no write path, which is why three of four capsules showed
   `reJirahDone: []` — never re-tempered once. The row lands in `rejirah_log.jsonl` and the
   per-axis schedule, fluency and calibration-gap are DERIVED from it.
   `node scripts/rejirah.mjs due` = which axes and how hard (FSRS still owns WHEN).
4. **CLOSE THE ROUND — `node scripts/rejirah.mjs close <concept>`.** It prints the one-line
   `reJirahDone` patch for the gist; **he** pastes it (FORGE_SPEC §2 2b — nothing auto-saves),
   then `node scripts/mirror.mjs` proves it landed. This organ does not write the capsule for an
   OWNERSHIP reason, not a sanctity one — `state/capsules/` is a read-only mirror owned by
   `mirror.mjs` (which is a script and DOES write there — the accurate phrasing is that no OTHER
   organ writes it; `grep -n "writeFileSync" scripts/mirror.mjs`). Until the paste lands the round
   reads **PENDING**, and five organs (`fsrs`, `deep`, `capsule_bridge`, `dugout`, `shipped`)
   still believe it never happened.
   *(checked 10 Aug 2026 — the FIVE still holds, but only under a precise reading, so pin the
   reading before the number: those five consume `reJirahDone` as EVIDENCE THE ROUND WAS SERVED, so
   an un-pasted round makes them wrong. Since then two more organs read the same field to DETECT the
   pending state — `captains_call.mjs` (grep -n "reJirahDone" scripts/captains_call.mjs, it files
   the paste card) and `learnstate.mjs` via `pendingCloses()` (grep -n "pendingCloses"
   scripts/learnstate.mjs). Those two are not fooled, they are the alarm. Re-derive the whole set
   live rather than trusting any count in prose: `grep -rln "reJirahDone" scripts/*.mjs` — subtract
   the owner `rejirah.mjs` and the harness `organism_test.mjs`.)*
   `node scripts/rejirah.mjs pending` = anything still un-pasted; the SessionStart brief says so too
   (verified: `.claude/settings.json` SessionStart runs `node scripts/learnstate.mjs brief`, and the
   pending line is built there — `grep -n "RE-JIRAH PENDING GIST-WRITE" scripts/learnstate.mjs`).
   As of 10 Aug 2026 `rejirah_log.jsonl` **does not exist yet** — `pending` says so in its own words
   ("Nothing has ever been closed, so nothing CAN be pending … yeh un-run hai"), so a quiet PENDING
   screen right now is proof the loop has never run, not proof it is clean.
5. Reps from a Re-Jirah round capture exactly like any other rep (§3), gut-word first.

## 1. ROUTE by `cur.track`

### track = `concept`  (Foundations / LLM-API / LLMOps AI concepts → the heavy ritual)
This is a FORGE concept (§11.3: Foundations-concept close = heavy Forge 9-axis, **never**
the Python light-close). **Hand the session to FORGE** — invoke the `forge` skill on
`cur.task`. **Forge opens the pacer session itself as its first action** (5 Aug 2026,
audit #107) — until then nobody owned that, so THE METHOD's step order, the
four-question-moments law and META-FREEZE simply never reached the turn. Do not route a
concept day past this branch without forge actually running `start` (or run its 9-axis flow inline: Pehle-Guess → crack-map teach → probe under the
gut-word law → Bolo → auto-capture). Do NOT duplicate the forge engine here. Forge captures its
OWN reps at close, so on the concept track **skip §3 (ingest+capture) entirely** — the only
/learn beat that runs after forge is the day-end close (**§4**).
*(both halves re-verified 10 Aug 2026 and both HELD. Forge really does own the `start`:
`grep -n "forge_session.mjs start" .claude/skills/forge/SKILL.md` shows it at the top of that
skill, commented "at session open, before anything". And forge really does capture its own reps:
`grep -n "capture.mjs paste" .claude/skills/forge/SKILL.md`. The `start`-refuses-a-live-session
claim is code, not etiquette — `node scripts/forge_session.mjs` prints `start <concept> [--force]`
and boot's resume branch says so out loud. The four question-moments are a real enum in the pacer,
not prose: `grep -n "moment <pehle_guess" scripts/forge_session.mjs`.)*

### track = `skill`  (Python → the JS→Python loop; canonical = learning-layer/GEMINI_LOOP.md §11)
Python is **light ritual · heavy reps · god-tier core** — a skill, not a decay-prone concept,
so NO 9-axis capsule. Run the 6-beat loop; the reps + volume happen on his free Gemini rig
(Colab dojo + Coach Gem), so your job is SAMAJH + the packet + capture — never the reps.

**FIRST, read where he is — never ask:** `node scripts/python_state.mjs brief`
(also spliced into the SessionStart kickoff). It names the subtopic, its tier, its fluency rung
and the JS-hangover watch-list with ×N counts. *(Built 5 Aug 2026, audit #107 item #26: the
track sprint.json calls the "Biggest rock" — 1-07, 16h — had no state file at all, so every
fresh thread inherited nothing. GEMINI_LOOP §13.4 makes the watch-list Claude's standing job
and §11.4 says it must travel thread-to-thread; until now it only lived in chat.)*

The organ is the single writer — never hand-edit `python_state.json`:
```
node scripts/python_state.mjs subtopic "<name>" --tier T0     # starting a subtopic
node scripts/python_state.mjs packet "<name>"                 # after emitting the CLOSE-PACKET
node scripts/python_state.mjs watch "<js-hangover>"           # each repeat from the handoff (×N counts)
node scripts/python_state.mjs close "<name>" --why "<1 line>" [--fluency 🟢] [--bolo done] [--floor]
node scripts/python_state.mjs tier-close T0 --artifact "<what he wrote COLD>"
```
`--why` is REQUIRED — §11.4's state read is *"🔴/🟡 + 1-line kyun"*, and a rung with no reason is
a rung with no evidence. Fluency is **declared, never computed**: no rep-count threshold exists in
that file, by his standing rule (*"koi bhi number GUESS karke mat lagao"*, 1 Aug). Two canon
pace-guards WARN but never block — 🟢 on a peripheral tier (§12.4 selective fluency) and a missing
Bolo on a CORE tier (§11.0). One thing it hard-refuses: Forge grammar (capsule/jirah/axis) on the
Python track — §11.3's *"Python pe KABHI nahi"*. Bad day → `--floor` records it as a floor-day
(§13.2: WARM + 1 drill + 1 Bolo, never zero, guilt-free).
*(this whole block re-verified against the code 10 Aug 2026 and every claim HELD — recorded so the
next pass does not re-derive it. `--why` really is required and errors with §11.4's own words
(`grep -n "close: --why is required" scripts/python_state.mjs`); the Forge-grammar refusal is real
and is the file's ONE hard refusal (`grep -n "is Forge grammar" scripts/python_state.mjs`); both
pace-guards warn and neither blocks (`grep -n "neither refuses the write" scripts/python_state.mjs`);
there is genuinely no fluency threshold in the file (`grep -n "NO INVENTED NUMBERS"
scripts/python_state.mjs`); and `brief` really is spliced into SessionStart (`grep -n "pythonBrief"
scripts/learnstate.mjs`). Two verbs exist that this block does not list — `unwatch <name>` retires a
hangover, and `status`/`json` are the read-only screens; run `node scripts/python_state.mjs` bare
for the live usage line rather than trusting the five commands above to stay the whole set. Live
today: `brief` returns `present:false` — "python: not started", so 1-07 has not opened yet.)*

1. **SAMAJH** — teach the subtopic in Code: what-it-is + the JS↔Python diff + a Pehle-Guess
   ("cold — yeh JS ke kis cheez jaisa hai?"). One concept, short passes, struggle-first. He
   writes the first explanation + first code HIMSELF (generation effect — non-negotiable).
2. **Emit the CLOSE-PACKET** (§2 — fill it, don't summarise it). He couriers it to Gemini.
3. He does BLOCK-A (Colab) + BLOCK-B (Coach), pastes the `📋 CLAUDE-HANDOFF` back.
4. **Ingest the handoff** → capture the reps + draft the log (§3). Never re-narrate from memory.
*(NOT a defect, so do not "fix" it — noted 10 Aug 2026 because it reads like one. The text above
says "the 6-beat loop" and then lists FOUR items. Canon's `grep -n "THE 6 BEATS"
learning-layer/GEMINI_LOOP.md` really does enumerate six — SAMAJH · LIKH+DRILL · REVIEW+FORGE ·
BOLO · REINFORCE · LOG — and this list compresses the three that happen away from Code (beats 2-3
into item 3, beats 4-5 into the BLOCK-B script in §2). The count points at canon; the list is
/learn's own hand-off shape.)*

### track = `course`  (Anthropic courses on Colab, e.g. 1-05/1-06)
**FIRST, read where he already is — never ask him:** `node scripts/course.mjs brief`
(also spliced into the SessionStart kickoff automatically). It names the chapter he is on out
of how many. If it reports nothing ingested yet, the chapter list is a one-time paste:
`node scripts/course.mjs ingest <chapters.txt>` — then, **the moment he opens a chapter,
`node scripts/course.mjs at <n>`**, and `done <n>` as each chapter closes.
(Issue #35, 2026-08-04: this tracker was 670 lines with ZERO callers and `course.json` had
never been created, while `next_up` was 1-05 and 1-06 — both course-track, 9 chapters. So the
one thing built to stop him being asked "where are you?" was the one thing nobody called.)
*(10 Aug 2026 — THE ISSUE IS CLOSED; the note above is history, not status. `course.json` EXISTS
(`ls dressing-room/state/course.json`) and the tracker HAS its caller — `grep -n "courseBrief"
scripts/learnstate.mjs` shows the import and the splice into the SessionStart brief. `brief` today
returns `Anthropic API Fundamentals: not started — 6 chapters (0 done)`, so the ingest paste has
already happened and the conditional above will not fire. One number in the history line is loose
even as history: **6 chapters, not 9** — 9 is what `sprint.json` labels 1-06 Prompt Engineering
("9 ch"); 1-05 API Fundamentals is 6 in the live `course.json`. Line-count too: the file is no
longer 670 lines — count it live, never from here. Read the position from `brief`, never from this
paragraph.)*
*(DEAD-WIRE SWEEP, 11 Aug 2026 — **`at <n>` is named here now, and that naming IS the repair.**
It is the ONLY producer of `course.json`'s `current` + `current_at`, and until today NOTHING in the
organism invoked it: `grep -rn "course.mjs at" --exclude-dir=.git` returned course.mjs's own usage
banner, learnstate.mjs's hint string and doc prose — no skill, no hook, no scheduled task
(`grep -i course setup/*.ps1` → 0 hits). So `current` has been `null` since the 7 Aug ingest and
every reader built on top of it was dead with it: `brief` can only ever say **"not started"**
(measured on the REAL state through the pure core — `markDone` 1..5 still printed "Anthropic API
Fundamentals: not started — 6 chapters (5 done)"), the resume second never prints, and
learnstate.mjs's PARKED-age tag is unreachable. **`done <n>` does NOT stamp a position** — it marks
a chapter covered and deliberately leaves `current` where it was (course.mjs `markDone`), so a
course closed chapter-by-chapter still reads "not started" to the end. Only THIS session knows
which chapter he actually opened, which is why the caller is the skill and never an organ inferring
it on his behalf.)*

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
1–2 = apply · 3 = cold-fast · 4 = predict-output · 5 = cross-topic mix. Watch-list from
`python_state.mjs`'s own `watch_list` — **not** from §0's `watch`; if empty, use the "khaali —
observe" branch + list this subtopic's PREDICTED JS-hangovers to scan.
*(corrected 10 Aug 2026: this said "Watch-list from `watch`", which reads as §0's `watch` — and
that one is nemesis's CONCEPT weakness list, a different store with a different producer (see the
§0 correction). The packet's watch-list is the Python-track JS-hangover ledger, and you do not have
to assemble it by hand: `node scripts/python_state.mjs packet "<name>"` echoes the top 3 as
`⚠️ injected: name ×N`, and prints the "watch-list empty — observe today, name the hangovers in the
handoff" branch itself when the ledger is bare. Verify: `grep -n "watch_injected"
scripts/python_state.mjs`.)*

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
   *(the whole of step 1 re-verified against the validator 10 Aug 2026, and every claim HELD —
   `grep -n "const SURFACES\|const TRACKS\|const CONFIDENCE\|const AXES" scripts/capture.mjs` gives
   exactly `gem|colab` · `concept|skill` · `knew|shaky|guessed` · `a`–`i`; `grep -n "aided only on
   track=skill" scripts/capture.mjs` pins the aided rule; and the overconfidence signal really is
   what calibration keys off — `grep -n "overconfidence_rate" scripts/calibration.mjs` reads
   `P(correct==false | confidence=="knew")`, this line's `P(wrong|knew)` in the code's own notation.
   Two things the eight-field shape above does not say and should: `axis` is REQUIRED AS A KEY even
   when it is null (the validator's error is literally "axis missing (use null)"), and the schema is
   open at the end — `latency_ms` · `aided` · `confused_with` · `edge` · `note` are all optional and
   all validated, so a rep carrying them is not malformed.)*
2. Save the array to a temp file → `node scripts/capture.mjs paste <tmpfile>` → then
   `node scripts/heartbeat.mjs`. Report capture's output VERBATIM if it rejects anything.
   *(verified 10 Aug 2026 — both commands run green; `node scripts/capture.mjs selftest` ends
   "ALL CHECKS PASSED" and `heartbeat.mjs` reported "8/8 organs beat". Two live affordances this
   step never named. (a) `paste --chain` recomputes derived state in the same call, so the separate
   heartbeat run is belt-and-braces rather than mandatory — `node scripts/capture.mjs` with no args
   prints the flag. (b) There is a ONE-REP door for reps as they happen, and CLAUDE.md's law is not
   to bank a day's reps on a clean close: `node scripts/capture.mjs rep --concept <c> --axis <a>
   --q "<what was tested>" --gut knew|shaky|guessed --correct true|false` — same validator as
   `paste`, and `--correct` is never defaulted.)*
   **⚠ BUT YOU DO NOT DECIDE `--correct` ANY MORE (17 Aug 2026, THE TRUTH LAYER BLOCK 2).**
   Bank his answer and let the one judge grade it, so the verdict stops depending on which
   surface he happened to open (voice / Gem / here). Per answer, instant and model-free:
   `node scripts/gaffer_brain.mjs capture voice_rep <concept> --gut <word> --asked "<your question, verbatim>" [--axis <a-i>] <<< "<what he said>"`
   Once, at the end of the round: `node scripts/gaffer_brain.mjs judge-round` — one Opus call,
   graded against his own material, dispatched to the owners, and it names what he missed.
   Full rule and the reasoning: `.claude/skills/forge/SKILL.md`, same step.
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
*(10 Aug 2026 — NAME COLLISION, flagged before it costs a session. This beat is his 18 Jul
captain's call, and `sprint.json` carries it under `progress.examiner_daily` in those words
("end-of-day Examiner test on THAT day's concept … Retrieval practice, not a full mock") — read it
live with `node scripts/learnstate.mjs json`. It is **not** `scripts/examiner.mjs`. That organ is a
different thing with a confusingly identical name: it stages a build-it-live CODE ROUND with hidden
tests into `examiner_drill.json` for the oral **scrimmage** — `grep -n "THE LIVE EXAMINER"
scripts/examiner.mjs`. Which means the "distinct from the graded /scrimmage mock" clause above is
code-confirmed, and it also means **do not run `examiner.mjs stage` for this close** — bare
`node scripts/examiner.mjs` is the read-only look, `stage` is a write. This beat has no organ; you
run it in the turn and the reps land through §3.)*

Finally: `node scripts/sitting.mjs close --reason fulltime` — the review row + session-intent line land through the owners.

## Laws (inviolable)
- **Honest floor — never automated:** SOLVE · BOLO · REWRITE · the first-draft code · every Rosetta
  entry = HIS. "Yahi baking hai." You automate only paste/copy/capture/log. Automate those away and
  the interview is khaali-haath.
- **Struggle-first · gut-word BEFORE answer, always.** No gut-word, no rep counts. SHOW-ME-THE-ANSWER
  is not an escape — it puts the topic on the watch-list for a COLD re-test.
- **Owners-only writes:** reps → `capture.mjs`; doubts → `hippocampus.mjs`. Never edit reps_log or any
  state file by hand. The log to the Progress Tracker is a DRAFT he pastes (propose, never act on canon).
- **Medical territory = "show your doctor."** No hype words; a crack is data, never shame.
