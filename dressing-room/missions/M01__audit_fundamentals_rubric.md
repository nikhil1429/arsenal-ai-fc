# MISSION M01 — FULL-SYLLABUS AUDIT 1/4: Fundamentals + the Rubric itself
<!-- outward loop · Ruling 6 layer 1 (his word, 8 Aug 2026 ~01:00) · one-time, fires BEFORE benchmark ships -->
<!-- Fire on: Gemini Pro → Deep Research (mehnga hai — one-time spend, captain's ruling). -->
<!-- Return door: paste the full report back in a Claude session, or save as .md and run:
     node scripts/scout.mjs mission ingest M01 --file <path> -->
<!-- Findings are EVIDENCE, never canon. Canon (OPPONENT_SCOUT.md / AI_PE_ROADMAP.md) changes only
     with the captain's word, via a captain's-call card. -->

---- PASTE FROM HERE (into Gemini Deep Research) ----

Deep research task. I am preparing for AI Product Engineer / Applied AI Engineer interviews in India, August–October 2026, product/applied ladder (NOT ML-research roles), ₹20–25 LPA band. My interview map was last researched on 29 June 2026 and is now ~6 weeks old. Your job: audit ONE slice of that map against TODAY's interview reality, with dated evidence.

THIS MISSION'S SLICE — (a) the interview FORMAT/RUBRIC itself, and (b) the FUNDAMENTALS topics.

MY CURRENT MAP CLAIMS (verify each — confirm, correct, or mark shifted):
1. A typical 4-hr onsite splits roughly: LLM & RAG System Design ~60 min (leads) · Hands-on Build & Integration ~50 · Production & Evaluation ~45 · Applied AI Fundamentals ~40 (table-stakes) · Behavioral & Judgment ~30.
2. "Definitions are free now; judgment is what's paid for" — recall questions are table-stakes, DEFEND/trade-off questions decide the round.
3. Loop shape: recruiter screen → tech phone screen → coding → system design → behavioral+HM; 5–8 rounds at big product cos; debugging rounds (subtle-bug / AI-generated-code-with-one-wrong-line) growing fastest; DSA still present at warmup level; AI tools banned in live-coding, allowed-but-defended in take-homes.
4. My fundamentals syllabus (each is a 9-axis deep concept for me): tokenization · inference/sampling (temperature, top-k/top-p) · context window (lost-in-the-middle) · hallucinations (causes, detection, grounding) — plus light coverage: neural-net basics, RLHF/post-training, "jagged frontier". Cross-cut: "where NOT to use AI" as the #1 senior signal. Domain moat: Indian fintech tax (TDS/TCS/DTAA) for invoice-intelligence products.

RESEARCH QUESTIONS (August 2026 reality, India-first but global-informed):
- Has the round structure or its time-weighting visibly shifted since June 2026? Any new round type appearing (e.g. agent-trace debugging, eval-design round, AI-collab round)?
- Which fundamentals questions are ACTUALLY being asked right now (candidate reports, interview guides updated July–August 2026)? List real questions verbatim where possible.
- Is "hallucinations" still probed mostly as causes/detection/grounding, or has it moved (e.g. toward eval-harness design, guardrail tooling)?
- Anything on my fundamentals list that has effectively DIED as an interview topic? Anything NEW that a fundamentals round now assumes (state it as evidence, with sources)?
- For the India ₹20–25 LPA band specifically: do fundamentals rounds differ at GCCs vs funded startups vs fintech?

OUTPUT FORMAT (strict — I diff this against my map):
## CONFIRMED — map claims that still hold (claim → evidence + source + date)
## SHIFTED — claims that changed (was → is now → evidence + source + date)
## NEW — things my map doesn't have (each: what, why it matters, evidence + source + date)
## GONE — things my map has that reality dropped (evidence + source + date)
## TOP 10 LIVE PROBES — the 10 most-reported real fundamentals/format questions right now, verbatim, each with source
## SOURCES — full list, each with publication/last-updated date; flag anything older than May 2026

Rules: prefer candidate-reported and practitioner sources over generic prep-guides; date every claim; where sources conflict, show both and say which is stronger and why; do NOT pad — if a section is empty, write "nothing found" and move on.
