# MISSION M02 — FULL-SYLLABUS AUDIT 2/4: the RAG cluster
<!-- outward loop · Ruling 6 layer 1 (his word, 8 Aug 2026 ~01:00) · one-time, fires BEFORE benchmark ships -->
<!-- Fire on: Gemini Pro → Deep Research. Return door: paste back in a Claude session, or
     node scripts/scout.mjs mission ingest M02 --file <path> -->
<!-- Findings are EVIDENCE, never canon. Canon changes only with the captain's word. -->

---- PASTE FROM HERE (into Gemini Deep Research) ----

Deep research task. I am preparing for AI Product Engineer / Applied AI Engineer interviews in India, August–October 2026, product/applied ladder (NOT ML-research), ₹20–25 LPA band. My interview map was researched 29 June 2026 (~6 weeks old). Audit ONE slice against TODAY's reality, with dated evidence.

THIS MISSION'S SLICE — RAG, end to end (my map calls it the most-asked skill of 2026).

MY CURRENT MAP CLAIMS (verify each):
1. RAG syllabus: embeddings (cosine-vs-euclidean, ANN/HNSW) · chunking (strategies, document-wide context like "amounts in thousands" headers) · retrieval (top-K, hybrid BM25+vector, re-ranking, cross-encoder vs bi-encoder) · RAG evaluation (retrieval-vs-generation diagnosis, RAGAS-style) · vector search (pgvector/FAISS; "pgvector-over-managed ka reason fake nahi kar sakte").
2. Signature probes: "embeddings return related-but-not-what-user-meant" (semantic similarity ≠ relevance) · "200k context can swallow the doc-set — why RAG?" (cost + latency + lost-in-the-middle) · "RAG failing — retrieval's fault or generation's, how do you diagnose?" · "design support assistant from 50k articles that says 'I don't know'" · "KB changes daily and articles contradict — stale/conflicting context?"
3. System-design spine: requirements → data/retrieval layer → model/prompt layer → eval → cost/latency → failure modes → scale.
4. My deliberately-deferred list (NOT interview-blocking at my band): graph RAG, fancy re-ranking models, RAGAS framework depth, quantization/local models.

RESEARCH QUESTIONS (August 2026):
- What do RAG interview questions look like RIGHT NOW at product companies / GCCs / funded startups in India? Real questions verbatim where possible, July–August 2026 sources preferred.
- Has "agentic RAG" (retrieval as a tool-call inside an agent loop) entered the standard question set at my band, or is it still frontier? Evidence either way.
- Are long-context models (1M–2M tokens) changing the "why RAG at all" question's expected answer? What answer do strong candidates give now?
- Is my deferred list still safely deferrable at ₹20–25 LPA? Specifically: graph RAG, re-ranker model depth, RAGAS. Evidence.
- Which vector-DB names are interviewers expecting candidates to reason about in Aug 2026 (pgvector, Pinecone, Weaviate, pgvectorscale, others)? Naming matters — "abstraction fake kar sakte, reason nahi."

OUTPUT FORMAT (strict — I diff this against my map):
## CONFIRMED — (claim → evidence + source + date)
## SHIFTED — (was → is now → evidence + source + date)
## NEW — (what, why it matters, evidence + source + date)
## GONE — (evidence + source + date)
## TOP 10 LIVE PROBES — most-reported real RAG questions right now, verbatim, each with source
## SOURCES — dated list; flag anything older than May 2026

Rules: candidate-reported/practitioner sources over prep-guides; date every claim; on conflict show both and judge; empty section = "nothing found".
