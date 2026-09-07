# THE VISUAL CONTRACT v2 — the in-chat layer (6 Sep 2026)

> **Read by `/learn` and `/forge` before the first teaching turn. One file, two readers — never
> copy this content into a skill.** This LAYERS on PROJECT_OS.md's VISUALIZATION CONTRACT
> (1 Aug, "11 point yes" — one bespoke widget per concept, the widget IS the lesson); it does
> not replace it. It governs everything visual in the CHAT turns around that widget.

## §0 · HIS RULING — the correction this file exists to hold (6 Sep 2026)

The 5 Sep study-interface ruling (record: `~/arsenal-audit-artifacts/study-interface-2026-09-05/`,
critic file 07) was read as "no visuals in teaching turns". **HE corrected that reading, 6 Sep,
verbatim shape:** *"arrey yar meine bs ye kaha tha ki answer tap mat karvao, i will type
answer."* — only TAP-TO-ANSWER was ever banned. Diagrams, colour, fonts, animation, live tools
in teaching turns were **never** banned. Approved the full plan same sitting: *"ok done."*
Same sitting he also waived the token guard for study visuals: *"i do not care about the token
wastage"* — recorded as his call; the ATTENTION limit (§6) still stands, that one is evidence,
not budget.

The 5 Sep critic's other findings STAND untouched (mechanism never hidden inside a stepper,
no second question-moment per idea, no teacher-written line to repeat, judge once per sitting).

## §0b · HIS SIX RULINGS — 7 Sep 2026 (all six are HIS words, none is a session's reading)

Six questions were put to him in one sitting and he answered all six. They are written here
verbatim, dated, and at the TOP of the file — because the whole reason this build exists is that
his rulings kept living somewhere no session ever opened. **A session does not re-open any of
these.** If one of them looks wrong, it goes to him or to the architect; it is never quietly
rewritten. Each says which section it binds, and each of those sections now points back here.

**1 · Colour carries meaning, or it is not used.** His words: *"rang sirf matlab ke liye - done"*.
This ANSWERS the boredom question §8.4 had been holding open on his behalf. He had said *"text
font colors is too boring"* — which reads as a make-it-look-nicer ask — while §5 says colour may
only ever encode meaning, and a session was not allowed to settle that against him. He settled it
himself: meaning. Decoration stays out, now on HIS word rather than on a session's inference of it.
**Binds §5, §8.1, §8.1c, §8.4.**

**2 · Emoji are in, as fixed meaning-markers, and the diff block stays.** Asked whether he wanted
emoji or whether the diff block alone was enough — *emoji chahiye, ya diff se kaam chal jaayega* —
he answered **"both"**. So both lanes live in the grammar and neither one replaces the other. This
CLOSES the collision §8.4 was carrying: his own canon opens right-and-wrong lines with ✅ and ❌
(`docs/archive/SAMJHAO_MERGED__2026-08-30.md:144-145`), while the assistant's own operating
instructions say to avoid emoji. **On a teaching surface his canon wins.** That general instruction
still governs everything else the assistant writes; this ruling is scoped to what is taught to him.
The fixed set, the fixed meanings and the cap are §8.1c. **Binds §8.1c, §8.4.**

**3 · Three colour and emphasis shapes, and there is no fourth.** *"done"* — to backtick = the
real name, bold = the one load-bearing word, one diff block = right-model-versus-wrong-model.
Read this WITH ruling 2 and do not let the two fight. The cap of three governs the shapes that
colour or weight WORDS INSIDE a line. Emoji mark the KIND of a whole line and carry none of the
app's own colour, so they are ruling 2's meaning-marker lane, not a fourth word-level shape. **That
last sentence is this file's reading of two of his answers taken together, not a third answer he
gave** — he said "done" to three shapes and "both" to emoji in the same sitting, and something has
to hold them without one deleting the other. If the reading is wrong, he or the architect says so;
a session does not resolve it by dropping either ruling. The
three no-colour structural companions in §8.1 — one `##` spine line, one ```text mechanical walk,
`---` rules — and the one legitimate blockquote are equally untouched: they were never colour, they
each keep their own cap, and nothing here drops them. **Binds §8.1.**

**4 · The simultaneous-units cap is ~4.** *"done"*. This CLOSES the three-number contradiction §6
was holding for him. The operating number is **~4**, which is what the top-precedence file already
carried — `PROJECT_OS.md:45`, *"(ADHD-PI neuro-profile: working-memory ~4 …)"*, re-read live 7 Sep
2026. The "5-7" this file used to run on is struck, not erased. ⚠ **~6 is a different quantity and
he did not rule on it:** `PROJECT_OS.md:502` caps what may be VISIBLE at once (*"max ~6 objects ek
waqt visible, baaki tap-to-expand"*) with the rest collapsed, while ~4 caps what he must HOLD in
his head. Neither corrects the other and neither is dropped. **Binds §6.**

**5 · The link-back check must fire during the teaching phase.** *"kardo"*. Joining a new concept
to an already-closed one BY NAME is one of his four per-turn carries (`/learn` §0a-T). It is the
only one of those four that HAS a checker at all, and that checker could never fire while he was
actually being taught, because it was gated to the steps after teaching ends. He ordered it
widened. The code is in `scripts/teaching_audit.mjs`, which this file does not own — whether it now
fires is that checker's own selftest, never this line. **Binds `/learn` §0a-T.**

**6 · The table checker is NOT widened — his deliberate decline.** *"skip it"*. A finding was put
to him: the live no-tables checker does not reach three places. He declined to widen it. **The
finding is kept, not dropped** — it is written out in full in §8.3 so that it reads as a decision
he made and never as a gap nobody noticed. The ban itself (§2) is untouched and is still entirely
his; only the checker's reach stays where it is. **Binds §8.3.**

## §1 · HIS PICKS (6 Sep, after seeing live demos)

- **Font: Lexend** (Google Fonts, weights 400/500 only) — inside every widget. Chat message
  text cannot carry it; that is a platform limit, not a choice.
- **Measure: ~62 characters per line** inside widgets (`max-width:34em` on prose).
- **Placement: teaching text in the MESSAGE, visuals in the WIDGET.** His explicit pick.
  Reason it is law: the afferent bus captures only prompt + assistant message — a widget's
  content never reaches his learning record. **The widget must never be the sole carrier of
  teaching substance.** Text teaches; the widget shows.

## §2 · STANDING BANS (unchanged by v2 — do not re-litigate)

- **Tap-to-answer, NEVER**: no answer tiles, no multiple-choice buttons, no AskUserQuestion
  for study answers. His answers are TYPED (or spoken via voice dictation). A "next step"
  button on an animation is fine — it answers nothing.
- **No points, XP, streaks, badges, juice, novelty rotation** (his 24 Aug word: *"why tf i
  crave novelity?? i seek internal validation"*).
- **No latency shown to him. No drift counts, reds, or organism health on study screens.**
- Gut-word law untouched. One check-question per pass untouched. Judge once per sitting.
- Register: **"tum"**, never "tu/tera". No em-dash walls; short blocks.
- ⛔ **NO TABLES, ON ANY TEACHING SURFACE, EVER** — his verbatim ruling, 22 Aug 2026, live on the
  state bus at `dressing-room/state/registry.json` `.tables.rulings[6]`, id `rul-mtdep06gy4`:
  *"never never use tables. Tables are very annoying for me. Like, I cannot understand things.
  Just just write it simply… table is something which which irritates my mind, to be honest."*
  Scope, in the ruling's own words: *"every teaching surface — samjhao, Re-Jirah, FORGE, session
  reports, and anything rendered for him."* **Measured 7 Sep 2026: 26 teaching messages since 2 Sep
  carry a markdown table, 13 of them on 6 Sep alone.** ⚠ And the obvious diagnosis is WRONG — the ban
  is NOT written nowhere. It is at `docs/archive/SAMJHAO_MERGED__2026-08-30.md:276` (the file every
  learning session opens first), at `SAMJHAO_ORDER__2026-08-20.md:183`, and it is **already a live
  checker** (`teaching_audit.mjs` `countTables` → `dheema-not-lamba`). It breaks anyway. Writing it
  here is a FOURTH copy, not a fix. **WHY a written-and-checked ban still breaks is HIS question or
  the architect's, not a session's.** It covers a markdown pipe table AND anything
  that renders as a grid — a ```csv / ```tsv column block is a table wearing a monospace costume
  and is equally banned. Prose and simple lists only. Reopening it is HIS call, never a session's.
  ⚠ **The BAN is wider than its CHECKER, and that is now his decision, not an oversight** — he was
  offered the widening on 7 Sep 2026 and said *"skip it"*. The three places the checker does not
  reach are named in §8.3; writing a table into any of them still breaks his rule, it is simply not
  machine-caught. Do not "fix" this quietly: it is declined, not broken.
- ⛔ **NOTHING HE MUST ABSORB GOES IN A BLOCKQUOTE.** Measured 7 Sep 2026 in the app's own
  stylesheet: `blockquote{…color:var(--cds-text-secondary)}` — a quote block renders MUTED GREY on
  his surface. It DEMOTES text. Sessions had been putting the turn's check-question inside `>`,
  i.e. greying down the single most important line on the screen. Blockquote means "aside, or his
  own words played back", nothing else.

## §3 · THE SEVEN SHAPES (topic-agnostic — the shape is fixed, the concept fills it)

> ⚠ The grid below is a markdown table, fifteen lines under a ban on tables. Deliberate: **the §2
> ban governs what is RENDERED TO HIM**, in his words *"anything rendered for him"* — a teaching
> surface. This grid is session-facing reference that he never has to read. Noted so a future
> session does not read the table here as permission to send him one.

| # | Shape | What it is | Fires | Data source (why it works for EVERY topic) |
|---|---|---|---|---|
| 1 | **Board** | 9-axis journey, stations fill as axes close | concept open + every axis close | `forge_session.mjs status` (axes done/current) + `concepts.json` axes map |
| 2 | **Sahi-banaam-galat** | the wrong model beside the right one, two colours | once per axis | the axis's trap — capsule `traps[]` when it exists, else the taught contrast |
| 3 | **Mechanism-tasveer** | one illustration of what the TEXT just taught; hover reveals depth | once per axis | written fresh at teach time — the 30% that is hand-made |
| 4 | **Live tool** | type/drag and watch the concept respond (predict-then-check) | once per concept (SAATH-KARO → AKELE-KARO) | written fresh at teach time |
| 5 | **Trace card** | numbered steps with blanks HE fills — pen in his hand | per axis as needed | the trace itself; blanks are his, never pre-filled |
| 6 | **Traps wapas** | his own recorded baits, cold, at the round | JIRAH (step 9) + Re-Jirah days | capsule `traps[]` + `doubts[]` (112 on record; new concepts accumulate live) |
| 7 | **Close card** | his words read back · gut vs outcome · kal ka pehla sawaal | day close (full-time) | the day's banked rows + the pointer verb |

## §4 · THE DAY (the 11 moments — what fires when)

/learn open → 3-line re-entry + pointer question + **Board** → warm-up 3-5 cold probes
(+ gut-strip after) → per axis: shaped text idea → **Mechanism-tasveer** → **Trace card** →
ONE typed check-q → axis close: **Board fills** + his words back → once per concept:
**Live tool** (saath, then akele) → Bolo via voice dictation (zero tokens) → CALIBRATE:
pehle-guesses return as guess-vs-actual chart → JIRAH: **Traps wapas** → LOCK: **poster file**
(SendUserFile, one designed page) + Board fully lit + concept-web node → full-time:
**Close card** + own-data chart.

Rhythm: **~10-12 visuals a day, at MOMENTS — never one per message.** Per-idea = shaped text
only. This is the attention limit (§6), not a token limit.

## §5 · THE FULL CAPABILITY SHELF (what a session may draw on — all verified working in the
Code tab this session, 6 Sep 2026)

- Google Fonts (Lexend; Atkinson Hyperlegible as fallback pick) · 9 colour ramps — **colour
  only ever encodes meaning** (e.g. teal = on the shelf, red = meaning lost), never decoration
  · Tabler icons. **This line stopped being a design principle and became HIS ruling on 7 Sep
  2026** — *"rang sirf matlab ke liye - done"* (§0b-1). It binds the message text (§8) exactly as
  it binds the widget.
- SVG diagrams, static and **animated**; step-through replays with a "next step" control
  (post-stream JS) — legal because stepping a REPLAY answers nothing.
- **Live tools**: text input → live computation (e.g. a real longest-match splitter), sliders
  → live curves (Chart.js from cdnjs).
- **Hover-to-reveal depth** — screen stays clean, gehrai ek hover door.
- **His-own-data charts**: reps_log.jsonl, gaffer_grade_queue.jsonl, judge verdicts,
  calibration — ALWAYS filtered by the game-on epoch (`registry.mjs gameOnEpoch`); pre-cyborg
  rows measure the instrument, never him.
- **Concept web**: nodes = the 17 sheet concepts, edges = capsule `bridges[]`; gains a node
  at every LOCK.
- **Poster at LOCK**: one designed page sent as a file (SendUserFile).
- Heatmaps / timelines / canvas when the concept's mechanism IS that shape (attention →
  heatmap; context window → timeline).

**Dead lanes — never propose (desktop Code tab, verified 6 Sep):** mermaid in chat renders as
raw text · statusline does not exist on desktop (kills every pomodoro/XP statusline plugin) ·
custom colour themes are terminal-only · third-party MCP-App widgets do not render.

## §6 · THE ATTENTION LIMIT (evidence, not budget)

The research he was shown 6 Sep: visual overload harms an ADHD reader as much as a wall of
text; ~~chunk ceiling 5-7 units~~ **→ the operating cap is ~4, HIS ruling 7 Sep 2026**; colour
helps only when it encodes meaning. A visual on every message makes visuals invisible.
**Moments, not messages.** His token waiver does not touch this — this limit is about his brain,
not his wallet.

✅ **CLOSED BY HIM, 7 Sep 2026 — the cap is ~4, and he said so himself: *"done"*** (§0b-4). What
follows is the working that was put in front of him, kept because the working is the evidence and
the total alone is not. Measured 7 Sep 2026 by `grep -rn "working-memory" learning-layer/*.md`: the
number in canon is **~4**, and it sits in the TOP-PRECEDENCE file — `PROJECT_OS.md:45`, *"(ADHD-PI
neuro-profile: working-memory ~4 …)"* — plus `FORGE_DESIGN.md:225`, `HOW_HE_LEARNS.md:107`,
`FORGE_DEEP_RENDER_BRIEF.md:66`, `GEMINI_LOOP.md:73,429`, `LEARNING_LAYER_MAP.md:902`,
`THE_ORGANISM.md:554,939`. `PROJECT_OS.md:637` already prescribes 3-4 groupings. The old line here
read *"Until he rules, follow ~4"* — **he has now ruled, so ~4 stops being a session's best
reading of precedence and becomes his instruction.** The "5-7" is struck above rather than deleted
(L9), because it is what the 6 Sep research actually said and a future session must be able to see
that his number and the paper's number are not the same number.

**And the shape of the cap is not optional, in his own words.** It caps how many units he must hold
AT ONCE — items in one list, colour meanings in play. It NEVER caps how much
is taught: `FORGE_DEEP_RENDER_BRIEF.md:69` rules *"Text kaatna = picture maar dena. Yeh allowed
NAHI."* The lawful move for a six-item set is to NEST it (3-4 groups, each opening), never to drop
two items. Cutting content to hit the number is a canon violation, not a safe default.

⚠ **AND ~4 IS NOT THE VISUAL BUDGET — that is a THIRD number, also live, and an earlier draft of
this block silently halved it.** `PROJECT_OS.md:502` (the same top-precedence file), plus
`LEARNING_LAYER_MAP.md:204`, `forge/SKILL.md:314`, and `HOW_HE_LEARNS.md:489`, all carry
*"max ~6 objects ek waqt visible, baaki tap-to-expand, one viewport, no scroll"* — and #489 records
~6 as the remedy to HIS OWN June complaint about too much on screen. **~4 caps what he must HOLD;
~6 caps what he can SEE with the rest collapsed. Different quantities; neither corrects the other.**
~~So: three numbers now stand in canon — 5-7 here, ~4 in eight files, ~6 for the visual. A session
must not pick between them. His call, or the architect's.~~ → **TWO quantities stand, 7 Sep 2026:
~4 to hold (his ruling), ~6 to see (untouched — he was not asked about it and did not rule on it).
The third, 5-7, is retired above.** A session still must not collapse the two survivors into one.

**Outside evidence, fetched 7 Sep 2026, that changes what "colour" is FOR** (full run:
26 agents, 18 claims adjudicated, 9 corrected):
- **Colour alone does nothing.** Désiron & Schneider (2024), *Frontiers in Psychology*, two samples
  (n=128 university, n=140 secondary), 2×2 design. Marking the learning-RELEVANT parts and leaving
  the rest plain raised retention *and* transfer; making things colourful on its own returned
  p = 1.000 and p = 0.430. The active ingredient is the CONTRAST between marked and unmarked, and it
  works by cutting extraneous load. **Therefore scarcity is the whole mechanism — mark few things or
  the effect is gone.** ~~This is why the answer to "colours are boring" is not more colour.~~
  → **Struck 7 Sep 2026.** That clause used a paper to answer a request he had made, which is not a
  session's move to make (§8.4 keeps the lesson). He answered it himself the same day —
  *"rang sirf matlab ke liye - done"* (§0b-1) — so the conclusion now stands on HIS word, and the
  research below it is what it always was: evidence for the caps, never the reply to him.
- **Mis-placed emphasis is measurably harmful, and it poisons THIS system specifically.** Gier,
  Kreiner & Natz-Gonzalez (2009), *J Gen Psychol* 136(3) 287-302, PubMed 19650523, n=180: wrong
  highlighting impaired comprehension AND metacognitive accuracy — readers falsely believed they had
  retained the material. Silvers & Kreiner (1997) found advance warning did not remove the effect.
  Consequence here: emphasis on the wrong word inflates his gut-word before `calibration.mjs` ever
  sees it. Limits that must travel with the claim: the harm is measured for mis-PLACEMENT, only
  reasoned for over-bolding; every study used a yellow highlighter over prose, never markdown `**`;
  no participant was ADHD-screened. **The "one bold per paragraph" number has NO study behind it —
  it is a writer's convention, and a session must not quote it as measured.**
- **The one ADHD-SPECIFIC hue finding.** Silva & Frère (2011), n=40, ages 15-25: ADHD participants
  lost more performance when information was encoded on a BLUE-YELLOW axis than on RED-GREEN,
  attributed to impaired blue-yellow discrimination. **Never carry a load-bearing distinction on
  blue-vs-yellow.** The two colours this app actually gives (red chip, green/red diff) sit on the
  safe axis by luck — keep them there.
- Author-provided signalling helps: Alpizar, Adesope & Wong (2020), *ETR&D* 68, 2095-2119 (29
  studies, n=2726); Schneider, Beege, Nebel & Rey (2018), *Educational Research Review* 23, 1-24
  (95 studies, N=11,499). Dunlosky et al. (2013) rates LEARNER-generated highlighting low-utility —
  that is not evidence against author-provided signalling, and the two must not be confused.
- ⚠ **One citation in that run was FABRICATED BY FUSION** — a first-pass agent welded Zentall (1984,
  letter-copying, adolescents) to Silva & Frère (2011, hue discrimination) into a single ADHD claim
  that neither paper supports. The adversarial pass caught and killed it. Recorded here so the next
  session trusts the verified list above and re-checks anything not on it.

## §7 · VERIFY

- ⚠ **REFERENCED, NOT INJECTED.** This file is NAMED in two skill files and is read only if the
  session opens one of them. **No hook loads it** — `grep -rn "VISUAL_CONTRACT" scripts/ hooks/
  setup/` returns nothing, and the six hits anywhere are all prose. The old line here said "this
  file loads every session" and offered `grep -n "VISUAL_CONTRACT" .claude/skills/*/SKILL.md` as
  proof; that grep returns hits whether or not a session ever opened this file, so it proved
  nothing. Under his own L4 that made this a constitution paragraph claiming to be a code path.
  There is also a live route with NEITHER skill: a fresh session continuing an open concept without
  typing `/learn` or `/forge` — both SessionStart organs point at a CLI command, never at a skill.
  Making this a genuinely injected path (a `turn_hook.mjs` callee, or folding the per-turn carries
  into `forge_session.mjs contract`) is a BUILD and needs his word. ⚠ **He gave that word on 7 Sep
  2026, in the same sitting as the six rulings in §0b, and the build was started that day — but do
  not read this line as "done".** The check is the grep above, and the last time it was run, while
  these rulings were being written, it still returned no caller: one hit, in `scripts/distiller.log`,
  which is a log line and not a code path. **Re-run the grep and believe it, never this sentence.**
- The widget lane exists in-session: the `mcp__visualize__show_widget` tool (Code tab inline
  visuals, launched 12 Mar 2026, desktop confirmed).
- The capture reason in §1: the afferent nerve reads prompt + assistant message only —
  `grep -n "afferent" scripts/*.mjs` and the 5 Sep repo-assets sweep (01_REPO_ASSETS).

## §8 · THE MESSAGE GRAMMAR — the TEXT half (7 Sep 2026)

> §1–§7 govern the WIDGET. This section governs the words in the message itself, which is where the
> teaching lives and the only thing the learning record keeps. It exists because he said, verbatim,
> *"text font colors is too boring"* and *"record to sabka hi chahiye"* — both at once, so nothing
> may move out of the message to get prettier.

### §8.0 · What is actually reachable — MEASURED, not guessed

Read out of the shipped desktop bundle, build `Claude_1.46388.4.0`, at
`C:/Program Files/WindowsApps/Claude_1.46388.4.0_x64__pzs8sxrjxfjjc/app/resources/` (read-only;
never write there — only `TrustedInstaller` and `SYSTEM` can, and it is an MSIX package).

- **Inline `` `backtick` `` → RED chip** on a faint tint with a hairline border. The transcript's
  assistant-text item resolves typography to `prose` (`cd5a31703-Bt6av51x.js` @800600, the item that
  also carries pin-chapter / fork / attach-as-context), and the prose skin sets
  `--_prose-code-color:var(--cds-text-danger)` → `#8e2626` light, `#ec7e7e` dark.
- **A ```diff fence → GREEN `+` lines, RED `-` lines.** Shiki, theme pair `claude-dark` /
  `claude-light` chosen only by the app's light/dark mode: `markup.inserted` → `hsl(95,75%,65%)`
  dark / `hsl(120,100%,25%)` light; `markup.deleted` → `hsl(355,85%,72%)` / `hsl(355,90%,38%)`.
- **A link, and a BARE file path, → ACCENT BLUE.** `case"barePath"` and `case"fileUrl"` route to the
  same link component as `case"link"` (`c9baec613-UEeWMi9o.js` @103372). **A bare repo path typed in
  an ordinary sentence costs the record ZERO extra characters** — no backticks, no brackets. It is
  the cheapest colour in the whole grammar.
  ⚠ **Its real doubt, carried in full rather than softened:** `barePath` never appears as a
  CONSTRUCTED node in that file — the detection lives in the `Ur()` transform and **may only fire
  for paths that resolve against the real cwd inside a Claude Code session.** So it may be a lane
  for `scripts/*.mjs` and `learning-layer/*.md` and nothing else. Unproven either way; see §8.4.
- **Two adjacent lanes in the same switch, measured and NOT used** (recorded so no future session
  re-discovers them as new): `case"issueRef"` renders through its own ledger component, and
  `case"image"` builds a **real `<img>`** — so `![](data:image/svg+xml,…)` would put an
  arbitrary-coloured glyph inline. The image lane is ruled out on record grounds (§8.3); `issueRef`
  is simply unexamined and irrelevant to teaching until something references issues.
- **`case"footnoteRef"` → `<sup>` in secondary grey.** Demotes, like blockquote. Unused.
- **Blockquote, `<sup>`, checked list items → SECONDARY GREY.** These DEMOTE. See the §2 ban.
- **Bold has NO colour anywhere** — a `strong` colour rule exists nowhere in the stylesheets. Bold
  buys weight only, which is exactly why bold alone can never answer "too boring".
- **Headings are demoted one rung** in the Code tab (`gc()` adds +1), so `#` renders as h2. Four
  distinct sizes are reachable, not six.
- **Raw HTML is escaped to visible text.** No `rehype-raw`, no `hast-util-raw`, no `parse5` in the
  bundle; the single raw-node handler converts to a text node. So `<span style>` and `<mark>` print
  their literal tag characters on screen AND leave tag noise in the record — they fail twice.
  ⚠ ONE hand-cut exception was measured on the live streaming path: `case"kbd"` builds a real `<kbd>`
  element (`c9baec613-UEeWMi9o.js` @102986). It is still not used here — it copies out as a rendered
  glyph rather than source, so it is not round-trip-safe in his notes.

### §8.1 · The grammar — THREE shapes, for the whole syllabus

The cap is the point. His law: *"jo cheez use yaad rakhni pade, woh ek DESIGN FAILURE hai."* A
legend of six colours is a memory tax levied on the same ~4 slots the lesson needs (§6). Three
shapes, each meaning exactly one thing, forever.

**These three are HIS, since 7 Sep 2026 — he was shown them and said *"done"* (§0b-3), and there
is no fourth.** Two things that reading must not do: it must not delete the three no-colour
structural companions below (they were never colour shapes and each keeps its own cap), and it
must not shut the emoji lane in §8.1c, which he opened in the same sitting — emoji mark the KIND
of a line, these three colour or weight WORDS inside a line.

1. **`` `backtick` `` = THE REAL NAME.** The term he must say out loud in an interview — the ASLI
   NAAM layer of the three-layer law. Nothing else is ever backticked; a fourth backticked word and
   red stops meaning "real name" and starts meaning nothing. **Cap: 3 per message, 1 per paragraph.**
2. **`**bold**` = THE ONE LOAD-BEARING WORD of that paragraph.** Weight, not colour. Test: delete it
   and the sentence must lose its idea. **Cap: at most 1 per paragraph; zero is a good number.**
3. **One ```diff block = SAHI BANAAM GALAT, only at the moment of correction.** `+` is the true
   model, `-` is the wrong one he (or most people) carry. **Cap: 1 block per message, 2 lines
   normally, 4 absolute maximum.**

**Three STRUCTURAL companions — no colour, and each keeps its own cap.** These were nearly lost when
the three-colour cap was written; restored 7 Sep 2026 on his "nothing gets dropped" order, because
the caps ARE the scarcity rule and scarcity is the entire mechanism (§6, Désiron & Schneider).

4. **`## ` = THE ONE THING THIS TURN IS ABOUT** — a single spine line, **never a section index**.
   Size and weight only, no colour on any path. Headings are demoted one rung here, so `##` renders
   as h3. **Cap: at most ONE per message, and most messages need zero.**
5. **A ```text fence = THE MECHANICAL WALK**, the numbered trace he runs by hand (HOW_HE_LEARNS #3
   and #4 — the one code-block use with a recorded success on his own record). **Contents must be
   symbols, ids and arrows — NOT Hinglish sentences** (§8.2's strip rule). **Cap: once per concept,
   not once per message.**
6. **`---` rules between blocks** — the landmark he navigates back to after drifting.
   ⚠ **`countSectionBreaks` counts a `---` identically to a heading**, so one heading PLUS one rule
   already fires `dheema-not-lamba`. Budget them together, not separately.

**Blockquote keeps ONE legitimate use** (§2 bans it for anything he must absorb): his own words
played back before they are corrected, or a true aside. **Cap: max 1 per message.** It is the
scarcest shape and its whole value is scarcity.

Bare file paths may be typed plainly wherever they are genuinely referenced — see §8.0's caveat.

### §8.1b · A COMPLIANT TURN, in full — the artifact, not the rules

Restored 7 Sep 2026 (it was dropped once). **Rules alone did not stop the third layer being
delivered zero times in a whole sitting; a turn a teacher can copy the SHAPE of is what does.**
Note what it does: `token` and `vocabulary` are backticked because they are the ASLI NAAM he must
say in an interview; exactly one word is bold per paragraph; ONE diff block carries the correction
and nothing else; and it ends with him DOING something plus a gut-word.

```
Tokenization ka pehla sach yeh hai: model tumhare **shabd** kabhi dekhta hi nahi.

Tum "unbelievable" type karte ho. Model ke andar woh ek cheez ban ke nahi rehta. Usse pehle
chhote tukdon mein tod diya jaata hai, aur us tukde ka naam hai `token`. Tokenizer ke paas in
tukdon ki ek fixed list hoti hai, uska naam `vocabulary` hai, aur jo tukda us list mein nahi
milta usse aur tod diya jaata hai jab tak list mein aa na jaaye.

Ab yahan do model aamne-saamne hain. Ek woh jo dimaag apne aap bana leta hai, doosra jo asli
mein chalta hai:

  ```diff
  + sahi: token ek seekha hua tukda hai. "unbelievable" = un + believ + able = 3 tokens
  - galat: token ek word hai. "unbelievable" = 1 token
  ```

Neeche wali laal line hi woh jagah hai jahan log phislte hain, aur wajah seedhi hai: "word"
sabse **aasan** guess hai, kyunki hum log space dekh ke padhte hain. Tokenizer space nahi
dekhta, woh apni list dekhta hai.

Ab tum karo. "unhappiness" ko tod ke likho jaise tumhe lagta hai tokenizer todega, aur saath
mein ek shabd mein bolo ki kitne confident ho.
```

⚠ What this example still OWES, so it is not copied as complete: the **TECHNICAL LINE** layer
(`/learn` §0a-T) — the interview-ready English sentence — is missing from it, which is the very
failure it was restored to fix. Add that third layer when using this shape. It also carries no
emoji, which is legal and deliberate: §8.1c's markers are ALLOWED, never required, and a turn that
needs none spends none.

### §8.1c · THE EMOJI LANE — four markers, fixed meanings (HIS ruling, 7 Sep 2026)

He was asked *emoji chahiye, ya diff se kaam chal jaayega* and answered **"both"** (§0b-2). So
emoji are IN as meaning-markers, and the diff block is NOT replaced by them. This section is the
settled answer; §8.4 used to carry the question and no longer does.

⚠ **WHAT IS HIS AND WHAT IS THIS SECTION'S — do not blur the two.** HIS word is: emoji are in, as
meaning-markers, alongside the diff block. **The specific four below, and the cap of two, are the
session's fill-in on his instruction to define them** — he has not seen these numbers. They are
built from the markers his own canon already uses and from the caps the other three shapes already
run on, so they should hold; if he wants a different set or a looser cap, that is his to say and it
does not re-open ruling §0b-2. This paragraph exists because a draft of this file once carried a
session's own opinion as if it were his ruling, and he caught it.

⚠ **SCOPE — this grammar governs what is RENDERED TO HIM, never machine-facing text.** Added 7 Sep
2026 because the build's own verifier caught the teaching bar breaking the rule it injects: the bar
opens its hard-stop line with ⛔, which is not one of the four, and uses ⚠ twice as a "rotating
reminder" rather than as "a trap". That is not a violation, and the fix is this sentence rather than
crippling the anchor: the bar is emitted into a SESSION's context by `scripts/teaching_bar.mjs` and
never reaches his screen. His ban and this cap bind teaching turns, session reports, and anything
else he reads — the same scope his no-tables ruling uses, *"anything rendered for him"*. Hook output,
selftest text and code comments are outside it.

**The set is FOUR and it is closed.** They are the four his own canon already uses, so there is no
new legend to learn — his law: *"jo cheez use yaad rakhni pade, woh ek DESIGN FAILURE hai."*

1. ✅ — **the true model. This is the one that holds.**
2. ❌ — **the wrong model. The bait most people take.**
3. ⚠ — **a trap or a caveat. Do not step here.**
4. ⭐ — **the one thing to carry out of this turn.**

Each means that and nothing else, forever. An emoji used as a bullet, as a mood, as decoration or
as a fifth meaning is banned by his colour ruling (§0b-1) in exactly the way a decorative colour
is: ✅ at the head of every line means "line", which means nothing.

**Cap: at most 2 in a message, at most 1 on a line, and never a second one carrying the same
meaning.** Same scarcity rule as the other three shapes, for the same measured reason — marking
few things IS the mechanism (§6: Désiron & Schneider 2024, where making things colourful on its
own returned p = 1.000).

**Where ✅/❌ and the diff block meet.** Both lanes are his, so neither is cut. The ```diff block IS
the correction — two lines, green and red, spent at the moment of correcting. ✅/❌ mark a
right-versus-wrong contrast running in PROSE, where no diff block is being spent. Do not spend
both on the same two sentences: that is one meaning wearing two costumes, and it burns the whole
message's emoji budget on a contrast the diff block is already carrying.

**They survive his record** — which is the test that killed the inline-image lane (§8.3). An emoji
is plain text and reads back as itself when he re-opens the note; a data URI does not.

**Scope: teaching surfaces — what is written TO him.** This file's own session-facing reference
blocks (§3's grid, this list) are not teaching turns, the same carve-out §3 already declares.

⚠ **Not observed rendering, like everything else in §8.0.** These four are read out of his canon
files, not out of a watched transcript, and the ⚠ here is typed with no variation selector — which
is a rendering difference on some surfaces. One of them joins the §8.4 probe for exactly this
reason.

### §8.2 · Fence rules that are traps, all measured

- Any line starting `- ` inside a ```diff goes RED — never put a bullet list in one.
- `--- ` and `+++ ` are eaten as diff headers and lose their colour; `!` and `@@ … @@` get none.
- **Keep Hinglish OUTSIDE every fence.** `scripts/teaching_audit.mjs:207` strips fences before its
  Hinglish check, so a turn whose Hindi lives inside a fence auto-counts a `hinglish` drift.
- Fences are also stripped by the structure counters (`:254`, `:266`), so structure inside a fence is
  drift-free while **two headings or one table outside one fires `dheema-not-lamba` during steps 3-9.**
- Fences render UNCOLOURED while a message streams and only colour once the language token settles
  (`case"fence": e.langSettled ? highlighted : plain`). He reads as it streams, so a design whose
  whole payload is colour-in-fences delivers it after he has already read the line — another reason
  the diff block is capped at one and never carries the explanation itself.

### §8.3 · Ruled out, with the reason (do not re-propose)

- **Tables and ```csv / ```tsv column colour** — his ruling, §2. The tsv rainbow was the single most
  tempting find in the 7 Sep run; it is a table in a monospace costume, and `overflow:"wrap"` on his
  narrow transcript destroys the grid anyway.
- ⛔ **WIDENING THE TABLE CHECKER — HIS DELIBERATE DECLINE, 7 Sep 2026. Not a gap; a decision.**
  His word: *"skip it"* (§0b-6). **The finding is preserved here in full, so no future session
  re-discovers it as news and "fixes" it.** The no-tables ban is his, 22 Aug 2026, and it DOES have
  a live checker — `teaching_audit.mjs`'s table count feeding the `dheema-not-lamba` drift. What
  that checker does not reach is three places: a **step-10 report**, a fenced ```csv / ```tsv grid,
  and the **postmatch `SEASON.md` write**. Widening it to cover those three was put to him and he
  declined. Two things follow, and neither is optional. **The BAN still covers all three** — the
  ruling's own scope is *"every teaching surface … and anything rendered for him"*, so a table in
  any of them still breaks his rule; it is simply not machine-caught, and a human has to hold that
  line. And **the reach stays where it is until HE says otherwise** — re-proposing this is
  re-opening a decision he already made.
- **```log severity words** — `ERROR` / `FATAL` / `CRITICAL` resolve GREEN or unstyled through a
  malformed scope name. A device that paints ERROR green is a trap, not a tool.
- **KaTeX `\textcolor`** — the one path to arbitrary-coloured words; it lands in his plain-text
  record as raw LaTeX, and inline `$…$` is flag-gated off so every phrase costs a display line.
- **Hex swatch chips, and links used as decoration** — a swatch colours a 12px square, not the words;
  a link inside a lesson invites him out of it. Both are decoration, banned by §5.
- **`![](data:image/svg+xml,…)` inline images** — the `case"image"` lane is real and would give
  arbitrary-coloured glyphs, but a data URI lands in his plain-text record as unreadable noise. He
  re-opens these notes; the record must stay readable prose. Ruled out on the record test, not on
  the render test.
- **`<kbd>`** — genuinely renders (§8.0), so the flat "no HTML" line was half wrong. Still unused: it
  copies out as a rendered glyph rather than source, so it is not round-trip-safe in his own notes.

### §8.4 · STILL open, needing HIS word — never resolved by a session

**One item is open. Two that used to live here are closed, by him, on 7 Sep 2026 — they are listed
at the bottom as pointers so nothing reads as lost.**

- **NOTHING IN §8.0 HAS BEEN OBSERVED RENDERING.** Every colour above is static reading of the
  shipped bundle. **THE PROBE IS EIGHT ITEMS — seven, plus one added by his emoji ruling** (it was
  narrowed to five once; the seven were restored, and the eighth is new on 7 Sep 2026, so this list
  has only ever grown): a backticked word · a bare repo path · a `[link](x)` · a ```diff pair ·
  a `> quote` · a `- [x]` checked item · a `<kbd>Ctrl</kbd>` · **one ⚠ typed exactly as §8.1c types
  it, with no variation selector** (the emoji lane is his ruling but its rendering is as unobserved
  as every colour here, and a marker that renders as a bare text glyph on his surface is worth
  knowing before it carries meaning). Sent as ONE message and **WATCHED AS IT STREAMS**
  (fences are uncoloured until the language token settles), at his real transcript width, **in BOTH
  light and dark**. ⚠ The light-mode contrast check has never been run at all: `claude-light`
  `comment` ink is `hsl(220,10%,48%)` and it lands on the fence's `--cds-alpha-1` tint, not on white —
  grey-on-tint at mono size is exactly where small-text contrast fails. Until this is seen, a session
  may use the grammar but must not tell him a colour is confirmed.

**CLOSED BY HIM 7 Sep 2026 — kept here as pointers, not as entries. Neither is re-opened by a
session.**

- **Emoji → he said "both".** The collision was real: his own canon opens right-and-wrong lines
  with ✅ and ❌ while the assistant's operating instructions say avoid emoji. He settled it in
  favour of his canon on teaching surfaces. The ruling is §0b-2; the four markers, their fixed
  meanings and their cap are §8.1c.
- **The boredom question → he said "rang sirf matlab ke liye".** The ruling is §0b-1. ⚠ **The
  lesson under it outlives the question and is the reason this bullet is not simply deleted:** an
  earlier draft of this file answered his *"text font colors is too boring"* by quoting research at
  him — it wrote "this is why the answer to colours are boring is not more colour", which is a
  session settling his own request against him. What actually worked was putting it to him in plain
  words and letting him answer. **Do that with the next one too.**

### §8.5 · Verify

- **The record is safe to STORE — it is NOT free to be READ, and that distinction is the whole
  point.** Storage: `hooks/afferent-post.mjs:178-189` keeps the whole assistant message verbatim
  with NO cap (his 6 Aug 2026 ruling, in the comment). Measured 7 Sep: 506 teaching rows, longest
  13,494 chars, none truncated, 258 already carrying `**bold**`, 147 bullets, 51 fences — **and 26
  carrying a table, which is the live evidence behind the §2 ban.** ⚠ But a SECOND consumer clips:
  `brain.mjs:3292` `nightCoachAfferents` pulls the teaching lane into the night-coach prompt at
  **600 chars per turn**, and 57% of teaching rows already exceed that. So markup spent early in a
  message costs the night coach the END of it. A future session reading this line to decide whether
  a heavier grammar is free: it is free to store, not free downstream.
  *(Caveat carried from the source run: the per-item working behind the 506-row counts was never
  written down — re-measure before quoting them as settled.)*
- ⚠ **This section does NOT load itself — see §7's REFERENCED-NOT-INJECTED note.** A session reads it
  only by opening `/learn` or `/forge`.
- **Test any NEW syntax against the audit engine before using it on him**, not after:
  `node scripts/teaching_audit.mjs` — `countSectionBreaks` counts a `---` rule identically to a
  heading, so ONE heading plus ONE rule in a teaching message already fires `dheema-not-lamba`.
  §8.2's warning ("two headings or one table") is therefore too narrow, and §8.1's own recommended
  shape trips it.
