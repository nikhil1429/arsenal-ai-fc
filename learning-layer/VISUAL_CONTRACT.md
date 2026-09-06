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

## §3 · THE SEVEN SHAPES (topic-agnostic — the shape is fixed, the concept fills it)

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
  · Tabler icons.
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
text; chunk ceiling 5-7 units; colour helps only when it encodes meaning. A visual on every
message makes visuals invisible. **Moments, not messages.** His token waiver does not touch
this — this limit is about his brain, not his wallet.

## §7 · VERIFY

- This file loads: `grep -n "VISUAL_CONTRACT" .claude/skills/learn/SKILL.md .claude/skills/forge/SKILL.md`
- The widget lane exists in-session: the `mcp__visualize__show_widget` tool (Code tab inline
  visuals, launched 12 Mar 2026, desktop confirmed).
- The capture reason in §1: the afferent nerve reads prompt + assistant message only —
  `grep -n "afferent" scripts/*.mjs` and the 5 Sep repo-assets sweep (01_REPO_ASSETS).
