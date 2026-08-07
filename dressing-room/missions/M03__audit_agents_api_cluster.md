# MISSION M03 — FULL-SYLLABUS AUDIT 3/4: Agents + LLM-API cluster
<!-- outward loop · Ruling 6 layer 1 (his word, 8 Aug 2026 ~01:00) · one-time, fires BEFORE benchmark ships -->
<!-- Fire on: Gemini Pro → Deep Research. Return door: paste back in a Claude session, or
     node scripts/scout.mjs mission ingest M03 --file <path> -->
<!-- Findings are EVIDENCE, never canon. Canon changes only with the captain's word. -->

---- PASTE FROM HERE (into Gemini Deep Research) ----

Deep research task. I am preparing for AI Product Engineer / Applied AI Engineer interviews in India, August–October 2026, product/applied ladder (NOT ML-research), ₹20–25 LPA band. My map was researched 29 June 2026 (~6 weeks old). Audit ONE slice against TODAY's reality, with dated evidence.

THIS MISSION'S SLICE — AI Agents + working the LLM APIs (my map calls "agentic" the hottest skill word).

MY CURRENT MAP CLAIMS (verify each):
1. Agents syllabus: tool use / function calling (model decides when/which) · ReAct-style agent loop (observe-reason-act) · multi-agent basics · reflection · MCP (Model Context Protocol) as the tool-connection standard.
2. LLM-API syllabus: structured output (schema forcing, Pydantic/Zod, malformed-JSON retry+validator) · streaming (SSE) · multimodal/vision input · confidence scoring / action thresholds · multi-model verification (two models, compare) · model routing by complexity (small vs big model as a cost lever) · prompt engineering (few-shot, chain-of-thought, system prompts).
3. Signature probes: "design an agent that books travel end-to-end, hard rule: never spends money without human approval" (guardrails, bounded tool-calls, loop-forever plan, API-timeout) · "malformed JSON will come no matter the prompt — what do you do?" (retry+validator = shipped; "good prompt makes it impossible" = not shipped) · "agent design IS the product" at AI-native companies.
4. Frame: "AI proposes, code validates" as my anchor; agents at my band = practical loops + guardrails, not swarm theory.

RESEARCH QUESTIONS (August 2026):
- What agent questions are ACTUALLY asked right now at my band in India? Verbatim where possible, July–August 2026 sources.
- MCP: has it become assumed-knowledge in interviews (vs a differentiator vs still niche)? What depth is expected — "what it is" or "I built a server"? Evidence.
- Which agent frameworks do interviewers expect candidates to reason about now (LangGraph, CrewAI, OpenAI/Anthropic native agent SDKs, hand-rolled)? Has the "hand-rolled vs framework" defend-question shifted?
- Structured output: is the Pydantic/Zod retry+validator answer still the bar, or has native structured-output support in the big APIs changed what interviewers probe?
- Anything NEW the API/agents rounds now assume (e.g. computer-use agents, agent evals/traces, context management for agents)? Anything on my list effectively DEAD?

OUTPUT FORMAT (strict — I diff this against my map):
## CONFIRMED — (claim → evidence + source + date)
## SHIFTED — (was → is now → evidence + source + date)
## NEW — (what, why it matters, evidence + source + date)
## GONE — (evidence + source + date)
## TOP 10 LIVE PROBES — most-reported real agents/API questions right now, verbatim, each with source
## SOURCES — dated list; flag anything older than May 2026

Rules: candidate-reported/practitioner sources over prep-guides; date every claim; on conflict show both and judge; empty section = "nothing found".
