---
name: learn
description: The session-agnostic front door to the day's learning — reads the kickoff STATE (not chat), routes the current task by track (concept→FORGE, Python→the CLOSE-PACKET loop, course→guided Colab pass), ingests the Gemini handoff, captures the reps with zero tax, and closes with a cold retrieval test on the day's concept. Use when the captain says "learn", "seekhna shuru", "aaj ka session", "continue", "where was I", "start my session" — a start with NO concept named. If he names a concept ("forge embeddings"), that's /forge, not this.
---

# /learn — run today's session, oriented from ONE SCREEN

> ## ⭐ THE DIGEST FIRST — 22 Sep 2026, his word ("please make it right now", forks ruling row 242)
> **Measured before this change:** the Desktop study session held **204,096 cached tokens before its first
> teaching word** — this skill's 43 KB body, SAMJHAO_MERGED, VISUAL_CONTRACT, the forge skill twice, the act
> skill, sitting.mjs — and re-ran all of it every turn, on his study pool. LAW T: a deterministic render is free
> and better. So the body of this skill moved VERBATIM to `REFERENCE.md` beside this file (L9), and the boot is
> now ONE command:
>
> ```
> node scripts/learn_digest.mjs
> ```
>
> **Run it as your FIRST tool call and OBEY THE SCREEN.** It reads the state bus by code (zero tokens, writes
> nothing) and prints: where he is (concept · step · axis · the exact unanswered micro-question, verbatim) ·
> this axis's own doubts, traps and calibration from the immutable capsule · the four live duties · every
> command you type, with the live concept:axis already filled in · the turn shape · where the full wording lives.
>
> **DO NOT READ, at boot or ever "just in case":** `REFERENCE.md` whole · `docs/archive/SAMJHAO_MERGED__2026-08-30.md`
> whole · `learning-layer/VISUAL_CONTRACT.md` whole · `.claude/skills/forge/SKILL.md` whole · `scripts/*.mjs`
> bodies · `memory/`. The digest names the one section a step needs; open THAT section by grep, when that step
> arrives, not before. A session that loads the canon "to be safe" is spending his study pool to re-read what
> the hook already prints every turn.

## The boot, in order (each line is a command or a rule, never a memory)

1. `node scripts/learn_digest.mjs` — the screen. Read it whole; it is ≤ 16 KB by contract (selftest).
2. The day's container is ALREADY OPEN — by code, not by you (unit mday): the /learn prompt itself (UserPromptSubmit) or a
   Skill call naming learn (PreToolUse) runs `day.mjs start`, which opens or JOINS today's sitting and binds THIS session as
   the host. `node scripts/day.mjs status` shows it. Never type the open yourself.
2b. **Open his newest deck in the Browser pane, UNASKED** (his word, 15 Nov: "merko thodi yaad rahega har bari kab kya
   bolna hain"): `preview_start { name: "revision-decks" }`, then navigate to the URL on the digest's
   "▶ OPEN AT BOOT, UNASKED" line. His annotation tools live there. He never asks for it; you never ask him to.
3. If the digest shows an OPEN forge session, the open CONSUMES the pointer first: a STALE session → `node scripts/forge_session.mjs resume` (its first line is the consumed question); a LIVE one →
   `node scripts/resume_pointer.mjs consume --concept <concept> --by learn`. Your first message to him is THAT consumed question, word for word — no recap, no summary of yesterday, no "you already know this" (HOW_HE_LEARNS #10). Then teach.
   If nothing is consumed (the line says why), open with ONE fresh micro-question where he stopped.
   If it shows NO open session: follow its route line (`forge_session.mjs start <concept>` consumes a pointer open for that concept and prints it first; `REFERENCE.md §1` by track for Python/course/domain tasks).
4. **Every stop** (axis end, mid-axis exit, his "bas", context near the line): `node scripts/forge_session.mjs
   pointer "<the exact unanswered micro-question + the gut-word ask + where in the axis>"` BEFORE anything else.
5. Day end — when HE means the study day is over, in ANY words (no phrase list; read his meaning): run
   `node scripts/day.mjs end [--pointer "<the exact unanswered micro-question>"]` ONCE. It closes the sitting (its close
   fires the judge by code), writes the machine half of the day, deals ONE card and prints the ONE message of questions —
   ask it, never wait on it. His answer, whenever it comes: `node scripts/day.mjs answer --hit <X> …`. A second `end` is
   safe (it says already closed). A day he never closes is closed by the night code. (Full text: `REFERENCE.md §4`.)

## The laws the digest cannot print for you (they bind the MODEL, not the screen)

- **THE NOTES LAW (22 Sep, his "okay let's do it.", act `amucdnagn7o`, row 240).** Notes are EXTRACTED from the
  archive by code at the week's end and ratified by him cold — never written from memory, never hand-written
  mid-lesson. Extraction cannot recover what was never SPOKEN, so your only live job is the **four elicitations**:
  (1) gut-word before every answer · (2) the stuck-story in HIS words the moment a crack fires, with the ONE
  ```diff block written right there — it IS the crack log, never log a crack later · (3) Bolo at axis close,
  [in that same turn run `node scripts/forge_session.mjs crack` (no args) — the crack ROW: his words verbatim, concept · axis · moment (unit mcrk)]
  [the pacer's axes line saying `N trap owed` = the axis note holds fewer than three distinct traps of THIS lesson: set one more bait from this lesson's own material (a ```diff of a real break); never write one to reach a count — a new day's note counts only the windows that touched its day (unit mtrap)]
  pasted verbatim · (4) the English interview line. Plus the pointer at every stop and THE BANK line at its
  three moments (the digest prints it filled in). No note block, no `build_exchanges` mid-lesson.
- **THE AXIS RECAP ARTIFACT (9 Oct 2026, his word; acts `amuzxdtzwg4` + naming `amuzxl2g566`).** When
  an axis is completed, teach EVERYTHING learnt in that axis in ONE place: an interactive, 10x-level Artifact
  (publish it AND send the .html with SendUserFile so he can download it), and give him the exact file name to
  copy-paste: `<concept>__axis-<x>-<axis-name>__<YYYY-MM-DD>.html`. ORDER, HIS WORD 9 Oct (it overrides
  canon A8's Bolo-first and the first form of this line): axis sharp check → RECAP PAGE → his Bolo → the English
  line, in every session and every topic ("recap page should always be before bolo and english line"). The sharp
  check stays before the page so his banked answer is cold; the page carries the axis's answers. His reason:
  "we are learning in pieces" — one place helps when notes are made.
  The recap is `[T]` mechanism; his understanding stays his Bolo. First one: embeddings axis c, 9 Oct.
- **THE RECAP IS A DECK, NOT A SCROLL PAGE (14 Nov 2026, his word, act `amwfwn73mxj`).** Verbatim: "always make
  it in the best ADHD and autistic way you possibly can, it is so boring right now and i have to scroll up and down
  so much to understand what is happening in the visualization and images ... save this thing in such a way that no
  further session do the same mistake in any axis." Every axis recap, every topic, is built like this:
  (1) ONE idea per screen; Aage / Peeche buttons + arrow keys; a rail of NAMED ideas; position line by name.
  (2) The picture stays FIXED at the top of the card and the text steps beneath it; each text step LIGHTS the exact
  part of the picture it names and dims the rest. Picture and its words are one glance apart: never a scroll between.
  (3) The same zones in the same places on every card (position · title · picture · text · nav): predictable.
  (4) Colour = ONE fixed meaning for the whole deck (input · weight · bias · output · galti), legend in the header.
  (5) Each idea's beats: dukaan → asli naam → ⭐ technical line → khud karo, where khud karo is a TYPED number box
  with instant ✅ / ❌ (a reveal button for concept answers); never tap-to-answer tiles.
  (6) Lexend, max-width 34em, no tables, no autoplay, theme tokens for light + dark.
  (7) THE PICTURE ALWAYS SHOWS THE NUMBERS THE CURRENT TEXT USES (15 Nov, his catch: "why is sale 0 x 1.5?? when
  10 units were sold"). A khud-karo beat loads the question's own inputs into the picture and hides the answer
  ("?"); it never leaves an earlier beat's numbers on screen.
  (8) SAVE IT WHERE HIS SCREEN IS SAFE (15 Nov, his word, registry ruling `rul-mwh04mxn0a`: "i am on video calls
  mostly when studying so i do not want my repo name to be seen"). Write every deck to
  `C:\Users\nikhi\Downloads\AI\<topic subfolder>\` (existing: Tokenization · Embedding · Inference · Neural Net;
  create the subfolder if the topic has none) and send the file FROM there. Never send a file from the repo path.
  (9) ENHANCE, NEVER REGRESS (15 Nov, his word: "i really want every session to follow the same or enhance it if
  possible for my adhd and autistic brain"). Every deck starts from the template; any improvement a session makes
  to the engine goes back into the template the same day, so the next axis and the next topic inherit it. The
  learn digest prints this law at every boot (selftest clause), so /learn and /forge sessions both see it.
  (10) OPEN IT IN THE BROWSER PANE, WITH HIS ANNOTATION TOOLS (15 Nov, his word: "make sure we get these annotation
  tools in every revision files from now onwards for every topic and any session ... these tools are not coming in
  the artifact"). The pen / box / text / pointer tools exist only in the Claude desktop Browser pane, not in the
  Artifact viewer, and a file:// path outside the project opens there as a dead snapshot (no scripts). So every deck
  is opened for him with `preview_start { name: "revision-decks" }` (`.claude/deck_server.mjs`, read-only, 127.0.0.1,
  serves `C:\Users\nikhi\Downloads\AI`) and then navigated to `http://localhost:4791/<topic subfolder>/<file>.html`.
  The address bar then shows no repo name. Never open a deck from the repo path. The Artifact link stays as the backup.
  UNASKED, ALWAYS: at every boot (step 2b, the digest names the newest deck) and the same turn any deck is published.
  Never tell him to say "deck kholo": anything he has to remember to say is a design failure (his law).
  ANY OTHER DECK, BY NAME: when he names one in plain words ("embeddings axis c ka deck"), open it the same way, in
  the Browser pane at its `http://localhost:4791/<topic>/<file>` URL. The decks home `http://localhost:4791/` lists
  every topic folder, so he can also click through them himself inside the pane, tools included.
  Template: `learning-layer/AXIS_RECAP_DECK_TEMPLATE.html` (neuralnet axis a, 14 Nov). Copy its ENGINE, replace its
  `I` array of ideas. A long scroll page with pictures far from their text is the failure this line exists to stop.
- **COVERAGE SWEEP BEFORE ANY RECAP (14 Nov 2026, his three catches on neuralnet axis a in one day).** Before
  building, list every term the axis USED anywhere (chat, pictures, examples) and open each one in the deck: what the
  input numbers ARE (in the LLM case too), every "do chhoti cheezein baad mein" that was deferred, and the industry
  name of every everyday word used (galti → error / loss, kitna ghumana → learning rate, shuru ka andaaza →
  initialization). He must never be the one who finds the gap (SAMJHAO_MERGED §3 C1).
- **FIRST USE, NOT JUST SOMEWHERE (15 Nov 2026, his 12 annotations on the neuralnet axis a deck; acts `amwi45hl1i3`
  · `amwi45ibx9f` · `amwi45izhcq`).** The coverage sweep above was obeyed and still failed him: learning rate,
  activation and ReLU WERE opened in the deck, but on later cards than their first use. Verbatim: "teaching me new
  words here without opening them or telling me where when i will learn it, my AuDHD brain got confused." So, in chat
  AND in every deck, every topic, every axis:
  (a) a term, acronym or pet phrase is opened in one line AT ITS FIRST USE, or that line says exactly where and when
  it opens (another card by name, or an axis by letter AND name). Pet phrases count: "sabse chhoti machine" needed
  "one input, one weight, one output" the moment it appeared.
  (b) an acronym gets its full form and what each word means (ReLU = Rectified Linear Unit: rectified · linear · unit).
  (c) every number says who sets it: learned in training (a parameter), chosen by a human before training (a
  hyperparameter: learning rate 0.001, layer count, neuron count), or read from the data. His "who sets these
  numbers?" and "how is 0.001 coming?" were both this one gap.
  (d) every answer repeats its question: he never has to remember it ("i have forgotten the question now").
  (e) a doubt he raises whose answer lives in a later axis gets the answer's SHAPE now plus "axis x (name) mein".
  (f) a cross-topic link he asks for is said at BOTH ends. Open now: when inference & sampling is re-taught, it
  opens by joining neuralnet's last layer → scores → probabilities → sampling, in one picture.
  The template engine carries two beat fields for this: `ahead` (the 📍 line on the first-use beat) and `recall`
  (the "Sawaal tha:" box on every answer beat). The learn digest prints this law at every boot (selftest clause).
  CODE PATH: `node scripts/deck_lint.mjs <deck.html>` checks (a) leakage of a term onto an earlier card, (b) acronym
  full forms and (d) recall on answer beats; RED = fix before he sees the deck. (c) who-sets-each-number and (f)
  both ends of a link are judgement, not yet code: escalated to the architect 15 Nov for a better design.
- **BIG PICTURE FIRST (16 Nov 2026, his word at neuralnet axis b).** Verbatim: "before we go ahead i want to know why
  are we studying neural net and what is the importance of it in my role and will studying this entire topic right now
  will help me in further topics as well? ... my AuDHD brain needs to know and see the entire picture first before we
  start studying, ideally this should have been told/taught by the previous session without my saying." So every topic
  opens UNASKED, before axis a, with one picture + text: why the topic exists · its weight in his role (AI Product
  Engineer, any domain) and in interviews · which later topics it feeds, by name · the nine axes by name, each with what
  it will answer for THIS topic. Every axis open gets the one-line version. He must never be the one who asks for the map.
- **NAME EVERY AXIS, EVERY TIME (9 Oct 2026, his word: "i do not remember the axis names").** Never a bare
  letter: always the letter AND its name, in chat, pointers, file names and pages — "axis c (mechanism)".
  The nine, from `dressing-room/state/concepts.json` `.axes`: a kya + analogy · b kyun / first principles ·
  c mechanism · d math + range · e limits / failure modes · f tradeoffs · g FinOps spot · h scale / cost ·
  i 3 ways. Every recap Artifact carries this nine-axis map by name with the current axis marked.
- **GAME ON (30 Aug 2026):** the pre-cyborg era is closed; the four locked capsules are re-opened as UNLEARNED
  and are the teaching RESOURCE (his own doubts, traps, calibration — the digest serves this axis's). Never a
  Re-Jirah on them; a burned strike is burned; teach from zero WITH them open.
- **The teaching contract is the hook line, every turn.** Obey what it prints (one idea · one check-question ·
  dheema not lamba · three layers · no tables · position by name · the diff block only at a correction).
  Drift is self-reported in the same turn: `node scripts/teaching_contract.mjs flag <rule-id> --why "…"`.
- **His rulings become receipts in the same turn:** `node scripts/acts.mjs do rule --door claude-code --text "…"`.
- **No system / notes / tool work mid-concept** (HOW_HE_LEARNS #12) — name it, park it in one line, hand the
  micro-question back, and end that reply with the park tail `<<ACT {"acts":[{"verb":"park","args":{"text":"<his words>"}}]}>>`
  (its owner `parked.mjs` keeps his words; each returns as ONE Captain's Call card at his next anchor — row 1190; the
  crash-belt line stays beside it). An architect question goes to the architect terminal, not into his lesson.
- **Desktop trap (22 Sep):** text written ABOVE a tool call is replaced on his screen — every tool first, the
  whole teaching message LAST, self-contained.
- **Owners only.** You never hand-edit a state file; every write above goes through the organ that owns it.

## Where the rest of the method lives (open a SECTION by name, never the file)

- `REFERENCE.md §0 Orient` — the pre-digest orientation rules (kept for the record; the digest does them by code).
- `REFERENCE.md §1 ROUTE by track` — Python (CLOSE-PACKET loop), course (Colab pass: the session names the
  chapter he opened with `node scripts/course.mjs at <n>` and `done <n>` as each closes — only the live session
  knows the chapter), domain (finance from zero).
- `REFERENCE.md §2 THE CLOSE-PACKET` · `§3 INGEST + CAPTURE` (Gemini handoff, paste capture) · `§4 DAY-END CLOSE`
  · `§ Laws (inviolable)`.
- `.claude/skills/forge/SKILL.md` — THE METHOD's 12 steps in detail, THE BANK, the three gates. Open the step's
  section when the step arrives (the digest names it). For step 3 SAMJHAO the digest + the hook are enough.
- `learning-layer/VISUAL_CONTRACT.md §4` — the one DRIVEN widget after axis g (step 4 DIKHAO), stepper, no autoplay.
- `docs/archive/SAMJHAO_MERGED__2026-08-30.md §3` — the axis loop's substance; `§6` the per-turn laws (also in the hook).
