# SPRINT.md — the captain's live sprint (the WHAT)
<!-- The Gaffer READS this file. This is the curriculum the organism coaches against.
     Human-readable mirror of the Google Sheet sprint board + Nikhil_AI_Sprint_Plan.xlsx.
     Update the "WHERE YOU ARE" line as you move; the Gaffer will pick it up next session. -->

**Sprint Master:** Nidhi · **Start:** 20 Jun 2026 · **Pace:** ~8 hrs/day × 6 days (Sun off) · **2-week sprints**
**Law:** dates are TARGETS Nikhil owns, NOT deadlines. Depth & correctness always beat speed. A topic is never skimmed to hit a date. NO date-countdown, ever.

---

## ▶ WHERE YOU ARE (update this line as you move — the Gaffer reads it)
**Sprint 1 → Sprint 2 boundary — resuming study. Consolidating the 5 foundation concepts, then into Python.**
Right now the live front is the three overdue foundation capsules: **embeddings · inference · context** (these ARE sprint items 1-01/1-02/1-03). Finish-lock those, then Python basics (1-07 → 2-10) is the biggest rock.
*(Dates say you'd be mid-Sprint-2 by the calendar, but dates are targets — your real position is what YOU confirm, never what the calendar dictates. The Gaffer asks, never pressures.)*

## 🚩 THE ONE TRIGGER THAT MATTERS
Applications START when **M1 (Invoice Intelligence) is demo-able** — slick UI + an eval dashboard proving accuracy. Targets ~start of Sprint 4 (~mid-Aug). M1 is the whole job-getting engine; M2/M3 are interview talking-points built WHILE applying.
- **Biggest single rock:** Python / FastAPI / Pydantic (~100–130 hrs, Sprints 1–2).
- **Biggest ROI differentiator:** the LLMOps / Eval bucket (golden dataset + LLM-as-Judge) — pushes pay into the ₹20L+ band.

## 🔁 HOW THE ORGANISM USES THIS (the closed loop)
1. This file (+ the Google Sheet) says today's **topic**.
2. You **`/forge <topic>`** (or Bolo it to the Gaffer by voice) → reps captured.
3. Reps → the squad scouts wake → tomorrow's **team sheet + drills** are shaped to your real gaps.
4. The sheet points you at the next sprint item. Loop closes. You never decide from scratch.
The Gaffer knows this sprint now — say *"good morning"* or *"what should I study"* and it answers **from this board**.

---

## THE SIX SPRINTS (roadmap at a glance)
| Sprint | Window (target) | Theme | Demo at sprint-end | Apply? |
|---|---|---|---|---|
| **S1** | 22 Jun – 04 Jul | Foundations + Setup | 5 foundation concepts locked · Prompt-Eng course · first Claude API call · FinOps repo + Supabase live | Not yet |
| **S2** | 06 Jul – 18 Jul | M1 Extraction Core (Python) | Upload invoice → structured JSON via FastAPI/Pydantic (Postman). TDS math in deterministic code | — |
| **S3** | 20 Jul – 01 Aug | M1 Trust + Eval Engine | Eval Dashboard: "94% precision on 30 invoices" + tracing + version compare ← hireable proof | — |
| **S4** | 03 Aug – 15 Aug | M1 Full-Stack + SHIP | M1 LIVE on Vercel: slick UI, streaming, human-in-loop, eval-backed. Resume + Loom out | 🚩 **START** |
| **S5** | 17 Aug – 29 Aug | RAG + M2 Bank Recon | RAG over past invoices · M2 reconciliation · Dockerised local. Interviewing in parallel | Ongoing |
| **S6** | 31 Aug – 12 Sep | Agents + intensive mocks | ReAct agent · routing · CI/CD-with-AI · timed cold mocks + Re-Jirah | Ongoing |

---

## THE FULL BOARD (every task)

### Sprint 1 — Foundations + Setup
- **1-01** Embeddings (finish) — vectors, cosine vs euclidean, ANN/HNSW, vendor dedup · **P0**
- **1-02** Inference & sampling — temperature, top-p, top-k, greedy decoding (temp=0 for invoice extraction)
- **1-03** Context window — token budget, sliding window, summarization
- **1-04** Hallucinations — causes, detection, grounding
- **1-05** Course: Anthropic API Fundamentals — messages format, models, params (Colab)
- **1-06** Course: Anthropic Prompt Engineering (9 ch) — few-shot, CoT, system prompts
- **1-07** Python basics (start) — syntax vs JS, types, f-strings, control flow *(biggest rock — spreads into S2)*
- **1-08** Setup: FinOps repo + Supabase — scaffold, env, Postgres + pgvector
- **1-09** Recall + Bolo locks — blank-recall, spoken explain, capsule lock (the interview-defense Forge)

### Sprint 2 — M1 Extraction Core (Python)
- **2-10** Python basics (finish) — modules, error handling, file/JSON
- **2-11** FastAPI — routes, async endpoints, request/response
- **2-12** Pydantic — force LLM → strict typed output (core tool for reliable extraction)
- **2-13** Course: Anthropic Tool Use (function-calling)
- **2-14** Structured / JSON output + validation — schema-forcing, parse, validate
- **2-15** Multimodal / vision input — scanned & image invoice → text
- **2-16** Prompt engineering (hands-on) — extraction prompts, edge cases
- **2-17** Compliance: TDS/TCS/DTAA (start) — 194C/194J/194H, TCS 206C, DTAA treaties (re-learn from zero)
- **2-18** "Where NOT to use AI" — deterministic TDS math in code *(senior signal — defend in interview)*
- **2-19** Build M1: Upload → extraction (Postman) — FastAPI endpoint, JSON out, no UI yet

### Sprint 3 — M1 Trust + Eval Engine (LLMOps)
- **3-20** Compliance TDS/TCS/DTAA (finish) — thresholds, individual vs company rate
- **3-21** LLMOps: Golden dataset + metrics — 30 real invoices, precision/recall/F1 *(secret weapon)*
- **3-22** LLM-as-Judge — auto-grade extraction vs ground truth
- **3-23** Course: Anthropic Evaluations — eval design, metrics
- **3-24** Observability — tokens/latency/cost/prompt-version (api_logs table)
- **3-25** Confidence / trust scoring — 0-100 + action thresholds
- **3-26** Guardrails + error handling + caching — input/output validation, DEMO_MODE
- **3-27** Multi-model verification — Claude + GPT, agree/disagree · **P1**
- **3-28** M1: Eval Dashboard — accuracy %, tracing, version compare *(THE hireable artifact)*

### Sprint 4 — M1 Full-Stack + SHIP → 🚩 APPLY
- **4-29** Streaming (SSE) + structured streaming — field-by-field UI
- **4-30** Human-in-loop / "Teach the AI" — user corrections → re-evaluate (anchor principle)
- **4-31** React UI + build M1 frontend — refresh React, wire to backend
- **4-32** Vercel deploy — env, prod config, live URL
- **4-33** Explainability / reasoning flowchart — "Show AI Details" 3-level toggle
- **4-34** Resume + positioning — ex-FinOps → AI Product framing
- **4-35** LinkedIn + Loom demo video — profile rewrite + M1 walkthrough
- **4-36** 🚩 **APPLICATIONS BEGIN** — fintech-AI + applied-AI roles (trigger: M1 demo-able)
- **4-37** Interview prep: concept Q&A (start) — drill bucket concepts cold

### Sprint 5 — RAG + M2 Bank Recon
- **5-38** RAG: Vector search — pgvector + FAISS
- **5-39** Chunking — semantic / section-aware
- **5-40** Retrieval — top-K + hybrid (BM25 + semantic)
- **5-41** RAG evaluation — faithfulness / groundedness
- **5-42** Re-ranking — cross-encoder
- **5-43** Build M2: Bank Reconciliation — fuzzy match, anomaly, AI-explained mismatch
- **5-44** Basic Docker — docker-compose: FastAPI + pgvector *(cheap credibility, not K8s)*
- **5-45** Mock interviews (start) — cold, adversarial
- **5-46** Applications (ongoing) — apply + track

### Sprint 6 — Agents + intensive mocks
- **6-47** Agents: ReAct (hands-on) — observe→reason→act, multi-tool
- **6-48** Agentic reflection — self-correction on low confidence
- **6-49** Model routing + batch processing — complexity→cheapest model, Batch API
- **6-50** Prompt versioning + A/B — Supabase prompt_versions, rollback
- **6-51** PII masking + injection defense — Aadhaar/bank mask, malicious input
- **6-52** CI/CD with AI — eval as deploy-gate (Actions)
- **6-53** Light: NN / training-RLHF / jagged — interview-confidence depth only
- **6-54** Mock interviews (intensive) + Re-Jirah — timed, cold + spaced revision
- **6-55** Applications + take-homes (ongoing) — deep-dives, assignments
