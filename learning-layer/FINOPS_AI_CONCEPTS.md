# FINOPS_AI_CONCEPTS.md — Canonical AI-Concepts Learn-List
> **Build this → learn this → land AI job roles.** Yeh woh AI concepts/skills hain jo FinOps Copilot
> (M1 Invoice Intelligence + M2 Bank Reconciliation + M3 Procurement Intelligence, full maximal build)
> banate hue Nikhil seekhega. Yeh file PROJECT FILES ka canonical reference hai — har naya thread isse padhe.
>
> **Derived from:** deep thread enumeration (Mar 24 → Jun 20 2026; JARVIS/parked threads excluded) +
> verbatim `conversation_search` + canonical numbered source (March thread `bacf6775`, list 1–52) +
> 4-thread convergence (`e9323a4c / 5fde02ac / 6e8e92b6 / 23eb3018`) + independent re-scan + Gemini
> positioning cross-check. **High-confidence convergence — NOT a 100%-verbatim audit.** Honest caveats
> neeche "Coverage Gaps" mein (M2 thin, RAG sub-techniques headline-level, no thread read fully verbatim).
>
> **Scope:** sirf AI concepts/skills (LLM APIs, RAG, agents, LLMOps/eval, full-stack, optimization,
> domain reasoning, "where NOT to use AI"). EXCLUDED = cosmetic/product features (dark mode, mobile,
> RBAC/auth, comment threads, audit trail, email/Slack/Drive/Tally integrations, landing polish) — JD inpe match nahi karti.
>
> **Status legend:** ✅ done · 🔄 in progress · [B] learning from zero via build · [A] aware/discuss-only · [✓] existing real strength
>
> **Phasing convention:** *(Phase 2)* = `Nikhil_AI_Sprint_Plan.xlsx` ka Phase-2 Backlog (job ke baad / parallel).
> Bina tag wala sab = Phase-1 (apply-engine, Sprints 1–6). Sprint-6 items (agents, prompt-versioning, PII,
> injection, CI/CD, model-routing) = **late Phase-1 (P1), apply ke DAURAAN** — Phase-2-backlog NAHI.
>
> **Companion files:** `Nikhil_AI_Sprint_Plan.xlsx` (sprint timeline + tracker — concept→sprint mapping ka source) ·
> `AI_PE_ROADMAP.md` (5-bucket skill-map narrative) · `FINOPS_MODULE3_PROCUREMENT_INTEL.md` (M3 spec) ·
> `OPPONENT_SCOUT.md` (interview test-set — rubric/weights/probe-bank; poore drill ka calibration)

---

## BUCKET 1 — LLM APIs + Output Management
Har concept ke aage = FinOps mein kahan seekhega.
- **LLM APIs** (Claude + GPT; Gemini sirf validation) — extraction engine, har module
- **Prompt engineering** (system prompts, few-shot, chain-of-thought) — har AI feature
- **Structured / JSON output + validation** — invoice → typed JSON (vendor/amount/TDS/date)
- **Streaming (SSE)** — chat copilot, word-by-word *(FastAPI StreamingResponse, Node nahi)*
- **Streaming structured output** (partial JSON, field-by-field UI) — extraction live-fill
- **Tool use / function calling** — ReAct agent + M3 optimizer-as-tool *(checklist ka hardest hands-on)*
- **Multi-model verification** (Claude+GPT parallel, agree/disagree) — Trust layer
- **Model routing** (complexity → Haiku/Sonnet/Opus; "~45% cost saving" line) — Sprint 6 (late Phase-1)
- **Batch processing** (Batch API, bulk invoices) — Sprint 6 (late Phase-1)
- **Context-window management** (token counting, sliding window, progressive summarization, context injection) — chat copilot
- **Confidence / trust scoring** (0–100 + action thresholds) — har finding
- **Multimodal / vision input** (text PDF vs scanned/image invoice, vision API) — extraction core
- **Error handling / graceful degradation** (API fail → cached) — Trust layer
- **Response caching** (DEMO_MODE flag — budget control) — Day 1 se
- **Latency optimization** (optimistic UI; P50/P90/P99)

## BUCKET 2 — RAG
- **Embeddings** (vendor matching, duplicate-vendor detection, semantic search) — RAG ka dil; Forge concept #2 (🔄)
- **Vector search** (FAISS local + pgvector prod)
- **Semantic / section-aware chunking**
- **Top-K + hybrid retrieval** (BM25 + semantic)
- **Re-ranking** (cross-encoder)
- **RAG evaluation** (faithfulness — answer document-grounded hai ya hallucinate kiya)
- **Graph RAG** (NetworkX, entity-relationship traversal) — M1 height: vendor fraud-network *(Phase 2)*
- **LlamaIndex** (framework RAG vs from-scratch) *(Phase 2)*

## BUCKET 3 — Agents
- **AI Agents / ReAct** (observe → reason → act loop) — Sprint 6 (late Phase-1)
- **Agentic reflection / self-correction** (low confidence → re-examine; "~12% more caught") — Sprint 6
- **LLM-as-reasoning-engine** (optimizer ko tool ki tarah call, what-if scenarios) — **M3 core** *(Phase 2)*
- **Multi-agent collaboration** (coordinator + specialist) *(Phase 2)*
- **Plan-and-execute** (cost-optimization routing) *(Phase 2)*
- **Agent / conversation memory** (episodic / semantic / procedural) *(Phase 2)*
- **MCP server** (expose tools for any agent) *(Phase 2)*

## BUCKET 4 — LLMOps / Guardrails / Eval  *(biggest differentiator — ₹20L+ band lever)*
- **Evaluation framework** (golden dataset — 30 verified invoices; precision/recall/F1)
- **LLM-as-Judge** (AI output ko AI se grade, regression catch)
- **Observability** (tokens/latency/cost/confidence/prompt-version; cost-per-CORRECT-answer) — `api_logs` Day 1 se
- **Cost optimization** (plan-execute + batch + routing)
- **Guardrails** (input/output validation, failure handling)
- **Human-in-the-loop / RLHF feedback** ("Teach the AI" — *AI proposes, code validates, human approves*) — **anchor principle**
- **Explainability / XAI** (reasoning flowchart, "Show AI Details" 3-level, CoT visible)
- **Prompt versioning + A/B** (Supabase prompt_versions, rollback) — Sprint 6 (late Phase-1)
- **Prompt-injection defense** — Sprint 6 (late Phase-1)
- **PII detection / masking** (Aadhaar, phone, bank details) — Sprint 6 (late Phase-1)
- **Bias detection** (same invoice, alag vendor naam → same result?)
- **CI/CD with AI** (Jest+GitHub Actions → Claude Code PR review; eval as deploy-gate) — Sprint 6 (late Phase-1)

## BUCKET 5 — Full-Stack + Engineering (AI app delivery)
- **React** (Vite, frontend; TypeScript migration *Phase 2*) — [✓ rusty]
- **Python / FastAPI / Pydantic / asyncio** — [B] **FULL backend from Day 1** *(Node DROPPED — see Decision Log; SSE = FastAPI StreamingResponse; topic map = sprint xlsx S1–2 + YT Python playlist; biggest single rock + ab CRITICAL-PATH)*
- **Supabase / PostgreSQL** (+ pgvector)
- **Vercel** deploy *(infra, AI-skill nahi — completeness ke liye listed)*
- **Ollama / local LLMs** (Privacy Mode toggle) *(Phase 2)*
- **System design** (LLM app architecture — layers, failure, scale) — **drilled PERFORMANCE-skill, Sprint 4+** (knowledge nahi: unseen LLM-system whiteboard pe, clock pe, failure-paths + cost + tradeoffs bolte). **Opponent ka heaviest round (~60min, leads)** per `OPPONENT_SCOUT.md` — plan mein sabse under-drilled tha. FinOps build khud = real LLM-app architecture = practice-ground. *(deep theory Phase 2)*
- **Layering principle** (open/closed, documented migration WHY) — ab *within-Python*: raw `anthropic`/`openai` SDK + manual RAG → phir LlamaIndex/abstractions *(pehle JS→Python migration story thi; Node-skip ke baad woh nahi)*

## CROSS-CUTTING — DIFFERENTIATORS  *(yeh hi alag karenge)*
- **Optimization + constraint-satisfaction** (greedy + LP solver) — M3 *(Phase 2)*
- **Multi-objective weighted scoring** (cost/delivery/reliability) — M3 *(Phase 2)*
- **AI data cleaning** (messy → normalized; 10+ delivery formats, vendor-name dedup) — M3 + M2 fuzzy
- **Fraud / anomaly detection** (patterns + networks) — M1
- **Compliance domain reasoning** (TDS 194C/J/H, TCS 206C, DTAA) — M1 — [✓ stale, re-learn from zero]
- **"Where NOT to use AI"** — **#1 senior signal.** High-stakes arithmetic + hard constraints = deterministic code; AI sirf judgment/pattern/language. *(Tokenization axis-e ne iska "kyun" diya. Gemini bhi independently isse Chip Huyen / Eugene Yan / Karpathy se tie karta.)*

## INTERVIEW-PERFORMANCE TRACKS — knowledge ≠ delivery  *(drilled skills, NOT AI-concepts; Sprint 4+)*
> `OPPONENT_SCOUT.md` ka core sabak: definitions free hain, match **judgment + live performance** pe decide hota. Yeh teen knowledge nahi — drilled performance-skills, build/apply ke saath aate. (Plan ka gap yahीं tha: heaviest rounds knowledge ki tarah seekhe, performance ki tarah drill nahi.)
- **System-design DRILL** — upar (Bucket 5). Opponent ka **heaviest round (~60min, leads)**, highest-ROI hole. Unseen LLM-system whiteboard + tool-naming (pgvector/Pinecone, LangChain/hand-rolled, RAGAS/LangSmith) + failure-paths (backpressure/retry/human-fallback) + cost/latency — clock pe, dumb-version-first.
- **Live-build / debug DRILL** — broken agent fix · malformed-JSON retry+validator · timed endpoint · AI-generated-code-with-one-wrong-line. Build-gated, Sprint 4+. *(2026 mein debugging round sabse zyada grow hua.)*
- **DSA baseline** — thin (~30-50 problems), **patterns** (HashMap=Python dict · two-pointer · sliding-window · BFS/DFS=Maidan-traversal · binary-search · DP=memoization=KV-cache-logic), practical-first (clean/tokenize/batch dataset = FinOps-adjacent). Tier-right-sized: AI-native/fintech/funded-startup → light; FAANG-GCC → heavier (optional). Table-stakes — blank-stare ek screen end kar deta; skip ≠ option. 15-20 min/din marble-jar, ek-saath-pahaad nahi.

## DEEP FOUNDATIONS (interview-defense depth — via Forge spaced repetition)
Tokenization ✅ (6/15) · Embeddings ✅ (6/21) · Inference/sampling ✅ (6/24) · Context window ✅ (6/28) → Neural-net internals (light) → Training/RLHF (light) → Hallucinations → Tool use → Jagged intelligence (light). **Ladder 4/17 — foundations ke 4 pillar locked.**
> *Tokenization + Embeddings + Inference + Context ab locked; emb/tok hands-on cross (extraction cost + vendor dedup) — pure "discuss" se upar. Embeddings ANN/HNSW axis cold-fluency pending (scout) — capsule/Re-Jirah mein.*
> **Fluency note (Maidan / dṛḍhabhūmi):** load-bearing core (RAG pipeline end-to-end + FinOps decisions + eval + system-design spine + where-NOT) selective-ly fluency/dṛḍhabhūmi tak; "light" concepts `tempered` pe rukte. Saari 17 ko ghana-pāṭha tak drill = misallocation. Detail OS + FORGE_SPEC mein.

## DISCUSS-FLUENTLY (aware, hands-on nahi) — [A]
LangChain · Fine-tuning/LoRA-QLoRA · MLOps · Distillation · Mixture-of-Experts · Constitutional AI · RLHF vs DPO vs RLAIF · Tokenization · Quantization

---

## NEW / UNDER-EMPHASIZED (baseline se genuine deltas — padded nahi)
1. **Document Classification** — doc type pehchaano (structured/text/scanned/image) → sahi extraction pipeline route. Multimodal se **alag named skill** (classify→route).
2. **Multi-model SEQUENTIAL chaining vs PARALLEL** — debate-mode ka real architectural concept: parallel verify (independent) vs chain (ek ka output doosre ka input).
3. **Emergent knowledge-graph / pattern discovery** — "AI woh connections dhundhe jo maange nahi the." Graph-RAG mein folds, par interview talking-point alag.

## HONEST DOWNGRADES (yeh "AI skill" lagti hain, hain nahi — aur yahi "where NOT to use AI" credibility hai)
- **Predictive Compliance** — "basic math, no ML needed." Trend aggregation, AI skill NAHI. Showcase.
- **Currency Intelligence** — application + real-time API **cut**. AI footprint minimal.
- **AI Debate Mode** — showcase, learning ~nahi (except sequential-chaining distinction upar).
- **WhatsApp Invoice Bot (Twilio)** — integration/delivery-channel; EXCLUDE-list spirit. AI skill NAHI.
- **Cost Dashboard** — observability ka UI; skill = observability (already counted).
- **Docker / Vercel / Deployment** — DevOps infra, AI skill nahi. *(Docker history mein contradictory: kabhi "skip", kabhi "Sprint-5 basic"; docker-compose = cheap credibility, AI skill nahi.)*
- **Fraud "rules"** (round-number ₹99,999, splitting threshold) — deterministic CODE rules; AI sirf network-detection (Graph RAG) + reasoning-explanation karta.

## COVERAGE GAPS / CONTEXT-LOSS (jahan 100% sure nahi — honest)
- **Module 2 (Bank Reconciliation)** — project files mein **zero spec** (sirf M3 hai). March threads se reconstruct. Net-new AI footprint **patla**: fuzzy matching + cross-dataset anomaly + AI-explained mismatch — baaki M1 concepts reinforce. Koi baad-ka M2 concept jo snippet mein na mila → miss ho sakta. **Spec banana baaki (Sprint 5 se pehle).**
- **RAG sub-techniques** (chunking strategy, hybrid BM25, re-ranking) — confirmed as **planned**, par `RAG from scratch` ke andar headline-level. Deeply specced kahin nahi mila — real hain, depth shallow.
- **No thread read 100% verbatim** — enumeration summaries se, content targeted-search se. Convergence strong (4 threads + canonical source + Gemini), par individual feature-depth varies.
- **Count drift** — 35/42/52/77 threads mein ghoomta = granularity ka farak, **same SET**. (Isiliye count deliberately avoid kiya.)
- **Framing drift** — B2B SaaS framing **deleted** (ab pure portfolio). Pricing/ROI lines stale.
- **Allocation inversion + on-paper gap (`OPPONENT_SCOUT.md`, 29 Jun)** — plan ka deepest investment (9-axis foundations) opponent ke **sabse halke** round (Applied Fundamentals, "definitions free") pe map hota; opponent ka **sabse bhaari** round (System Design, ~60min, leads) plan mein sabse kam drilled tha → ab "Interview-Performance Tracks" section isse address karta. Bigger truth: poora plan abhi **kaagaz pe** — opponent EVIDENCE (shipped demo) + PERFORMANCE (live rounds) pe score karta, dono abhi khaali. Gap = design nahi, **execution.** DSA pehle bilkul absent tha — ab thin-baseline add.

---

## DECISION LOG
- **Backend language — RESOLVED (20 Jun): NODE FULLY DROPPED.** M1 ka pura backend **Python/FastAPI from Day 1** (Node/Express skip). React frontend stays. SSE = FastAPI StreamingResponse. Layering ab within-Python (raw SDK + manual RAG → LlamaIndex).
  - *Kyun sahi:* ek hi backend language (Python = AI-ecosystem ki bhasha, jo interviews mein poochte) · zero context-switch · Node-banao-phir-rewrite waste nahi · Pydantic = reliable-output ka sahi tool · Python resume-gap fill. Gemini bhi "Python-early = real" bola.
  - *Trade-off (honest):* Node tera *existing* strength tha (rusty-but-real) — woh **shipping safety-net hat gaya**. Ab M1-ship poori tarah **Python-timing pe depend** karta, aur Python sprint-board pe under-budgeted hai (46h vs Read-Me ~100h). **Mitigant: tu Python already side-by-side shuru kar chuka + YT playlist ready** — yahi sahi hedge hai. Net: *M1 ship == Python on-time lands. Koi JS fallback nahi.*
- **Interview-performance + DSA + scout — ADDED (29 Jun, context-lock boundary):** OPPONENT_SCOUT.md project files mein add (test-set). System-design ab drilled performance-skill (Sprint 4+), live-build/debug drill named, DSA thin-baseline added (tier-right-sized). Reason: scout ne allocation-inversion + on-paper gap nikaala — heaviest rounds performance ki tarah drill nahi ho rahe the. Full FORGE_SPEC schema migration (controller/Maidan/fluency fields) deliberately **DEFERRED** to first R1 run (un-run = hypothesis).

## POSITIONING (Gemini deep-research + own scan se converge)
Applied / Product / FinTech-AI ladder — **NOT** ML-research ladder. Edge = fintech domain + AI-eval (Outlier/Turing) + full-stack shipping + product thinking. Target ~₹20–25 LPA realistic **IF** domain-expert framing. Cloud/MLOps (K8s/AWS) = honest gap, gates highest pay, Phase-2. Apply trigger = **M1 demo-able** (UI + eval dashboard) = Sprint 4 (~early Aug) → **parallel apply, curriculum 17/17 pre-req NAHI**.
> Gemini ne yahi positioning independently confirm ki (two-ladder, domain+evals moat, eval-differentiator, milestone-apply). Jahan Gemini galat tha (PM-bano-engineer-nahi, Outlier=gig-work) = career-strategy, reject kiya — concept-list ko touch nahi karta.
> Scout (Section 3/8) ne India band + tiers + "notebook→live API = single biggest differentiator" independently confirm kiya — yahi #1 lever.
