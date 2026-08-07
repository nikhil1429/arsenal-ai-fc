# MISSION M04 — FULL-SYLLABUS AUDIT 4/4: LLMOps + Python/shipping + the market itself
<!-- outward loop · Ruling 6 layer 1 (his word, 8 Aug 2026 ~01:00) · one-time, fires BEFORE benchmark ships -->
<!-- Fire on: Gemini Pro → Deep Research. Return door: paste back in a Claude session, or
     node scripts/scout.mjs mission ingest M04 --file <path> -->
<!-- Findings are EVIDENCE, never canon. Canon changes only with the captain's word. -->

---- PASTE FROM HERE (into Gemini Deep Research) ----

Deep research task. I am preparing for AI Product Engineer / Applied AI Engineer interviews in India, August–October 2026, product/applied ladder (NOT ML-research), ₹20–25 LPA band. My map was researched 29 June 2026 (~6 weeks old). Audit ONE slice against TODAY's reality, with dated evidence.

THIS MISSION'S SLICE — production/eval (LLMOps), the Python + shipping stack, and the India market band.

MY CURRENT MAP CLAIMS (verify each):
1. LLMOps syllabus: golden dataset · LLM-as-judge · observability (per-call model/tokens/latency/cost/confidence/promptVersion) · guardrails · cost optimization (routing, caching) · prompt versioning · human-in-the-loop. The eval round is "the most skipped by candidates, therefore where the round is decided" — "evaluators vs vibe-checkers."
2. Signature probes: "prompt change made one answer better, another worse, customer told you Friday — how do you stop that next time?" · "token bill TRIPLED last month, nobody changed code — what happened?" · "was it a real eval framework or vibes?" · "production hallucination/cost reduce kiya — ek baar batao."
3. Python/shipping stack for my band: Python core (JS-bridged) · Pydantic v2 · FastAPI · async · Anthropic SDK + structured output → then openai SDK, pandas/numpy-light, pytest/logging/Docker. Deliberately SKIPPED: deep ML math, fine-tuning internals, K8s/cloud-depth (Phase-2), local model serving.
4. Courses I bank on: Anthropic's API Fundamentals + Prompt Engineering (9 ch) + Tool Use + Evals courses.
5. Market claims: ₹20–25 LPA band = product cos / GCC / funded startups / fintech-AI; GenAI premium 25–40% over generalist; "notebook→live API serving real users = single biggest differentiator"; fintech/healthcare domain ≈1.5×; competing offers = 15–25% better package; Bangalore +25% / Delhi-NCR +5%; IT-services = floor below the band.

RESEARCH QUESTIONS (August 2026):
- What eval/LLMOps questions are ACTUALLY asked right now at my band? Verbatim, July–August 2026 sources. Which eval tools do interviewers name-drop or expect (LangSmith, RAGAS, Braintrust, Langfuse, in-house)?
- Python/backend: is FastAPI+Pydantic still the assumed stack for AI product roles in India, or has anything shifted? What Python depth do interviews actually test at this band (idioms? async? testing?)?
- Are the Anthropic courses still the right bank for API fundamentals + prompt engineering + tool use + evals, or is there a now-standard alternative interviewers reference? (Course-level, not degree-level.)
- Market check: is ₹20–25 LPA still the right ask for my profile (2 yrs JS/MERN + shipped AI product + fintech domain, no cloud/K8s depth)? Has the band moved since June? Which company types are actively hiring AI PE / Applied AI in India RIGHT NOW (Aug 2026), and is the "shipped product + public repo" differentiator claim still holding?
- Anything NEW production rounds now assume (agent observability/traces, safety evals, cost dashboards as table stakes)? Anything on my list effectively DEAD?

OUTPUT FORMAT (strict — I diff this against my map):
## CONFIRMED — (claim → evidence + source + date)
## SHIFTED — (was → is now → evidence + source + date)
## NEW — (what, why it matters, evidence + source + date)
## GONE — (evidence + source + date)
## TOP 10 LIVE PROBES — most-reported real eval/production/Python questions right now, verbatim, each with source
## SOURCES — dated list; flag anything older than May 2026

Rules: candidate-reported/practitioner sources over prep-guides; date every claim; on conflict show both and judge; empty section = "nothing found".
