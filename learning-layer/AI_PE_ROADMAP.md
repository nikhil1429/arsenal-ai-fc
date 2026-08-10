# AI PRODUCT ENGINEER — POORA SKILL MAP (mera god-tier plan)

> **Yeh confirmed hai (March mein banaya, June mein dobara confirm kiya).**
> Yeh 5 buckets = AI Product Engineer ka poora skillset.
> **FinOps Copilot banate hue yeh saare 5 buckets cover ho jaate hain** — theory alag se nahi, build ke saath.
>
> Do alag cheezein hain, confuse mat hona:
> - **Yeh ROADMAP** = poora skill-map (kya-kya aata hai role mein).
> - **Forge ke concepts** (tokenization, embeddings, inference...) = learning *order* (kis cheez ke baad kya seekhna). Yeh roadmap ke andar hi fit hote hain.

> **(added 10 Aug 2026 — live-check note. Isse pehle padho, warna neeche ki "FinOps mein kahan"
> lines status ki tarah padh li jaayengi.)**
> - **Paanch buckets ka role-map aaj bhi khada hai, aur woh CODE mein utra hua hai.**
>   `scripts/benchmark.mjs` apna bucket-map isi file se kheenchti hai — apne header mein likhti
>   hai "BUCKET MAP: sourced from AI_PE_ROADMAP.md 'ROADMAP ↔ FORGE' — not invented here"
>   (`grep -n "BUCKET MAP" scripts/benchmark.mjs`) — aur wahan bhi buckets **paanch** hi hain;
>   `6-cross-cut` + `7-domain` jaanbujh kar chhathe bucket NAHI banaye gaye
>   (`grep -n "not a 6th bucket" scripts/benchmark.mjs`). Yaani is file ka B1–B5 dhaancha
>   load-bearing hai: yahan ka shabd badla to benchmark ka map badla.
> - **"Kya aata hai" wali listein = role-knowledge hain, repo-state nahi.** Unmein check karne
>   layak koi repo-claim nahi hai; woh is repair ke daayre se bahar hain (na verified, na wrong).
> - **Har "FinOps mein kahan" line PLAN hai, PROOF nahi.** FinOps repo abhi wajood mein nahi:
>   `shipped.mjs` apne hi header mein bolti hai "the FinOps repo does not exist yet — sprint 1-08"
>   (`grep -n "FinOps repo" scripts/shipped.mjs`), `shipped_config.json` state mein hai hi nahi
>   (default watch-list = sirf yeh organism ka repo), `C:\Users\nikhi\GitHub\` mein sirf
>   `arsenal-ai-fc` khada hai, aur sprint ka `progress.done` sirf `1-01 · 1-02 · 1-03` rakhta hai.
>   Isliye "FinOps mein …" ko kabhi "ho chuka" mat padhna — woh mapping hai, status nahi.
> - **Status HAMESHA live:** `node scripts/benchmark.mjs preview` (bucket-wise have/need,
>   console-only). `run` abhi **GATED** hai — `node scripts/benchmark.mjs report` khud bolta hai
>   "GATED (pre-audit) … full-syllabus audit 0/4 returned — next fire: M01"
>   (gate = `missions.json → syllabus_audit.closed_at`, aaj `null`; M01 fired 10 Aug, return
>   abhi aaya nahi).

---

## BUCKET 1 — AI se baat karna (LLM APIs + Output Management)

**Simple mein:** code se AI ko bolna, aur usse saaf, bharosemand output nikalwana.

Kya aata hai:
- Claude API + GPT API dono use karna
- Prompt engineering — AI se EXACTLY wahi karwana jo chahiye
- Structured output — AI se clean JSON nikalwana (free text nahi)
- Streaming — letter-by-letter response dikhana
- Tool use / function calling — AI ko tools dena (calculator, DB search)
- Multi-model — 2 models se ek kaam karwa ke compare karna
- Output reliable banana — hallucination pakadna, confidence score, output ko code se validate karna, response caching

**FinOps mein kahan:** invoice se data nikalna (extraction), model router (Claude vs GPT), DEMO_MODE caching.
**Interview value:** har AI PE role ki base. "Maine output ko code se validate kiya — AI propose karta hai, code check karta hai."

---

## BUCKET 2 — AI ko apne data pe smart banana (RAG Deep Dive)

**Simple mein:** AI ko teri apni files/data mein search karwana, meaning ke hisaab se (sirf keyword nahi).

Kya aata hai:
- Embeddings — text ko meaning-wale numbers mein badalna (similar cheezein paas)
- Vector database — meaning se search (pgvector / FAISS)
- Chunking — bade document ko sahi tukdon mein todna
- Retrieval techniques — top-K search, hybrid (keyword + meaning), re-ranking
- RAG evaluation — sahi document mila? jawab document se supported hai?

**FinOps mein kahan:** duplicate-vendor detection (embeddings ka dil), "pichli baar Noida kaise allocate kiya?" (RAG over past data).
**Interview value:** RAG 2026 ka sabse pucha jaane wala skill. Embeddings ✅ LOCKED (6/21) — capsule locked hai, **hands-on abhi BAAKI hai.**

> *(corrected 10 Aug 2026 — is line ka aakhri hissa "— foundation hands-on cross ho chuka" padhta
> tha. Do baatein, dono live-checked:*
> *(1) **"(6/21)" LOCK-DATE hai, "6 of 21" fraction NAHI** — `capsule_map.json` mein
> `embeddings.locked_on = "2026-06-21"`; wahi M/D shakl baaki teenon pe bhi (tokenization 06-15 ·
> inference 06-24 · context 06-28). Yeh claim SAHI nikla, sirf padhne mein dhokha deta hai.
> Live padho: `node scripts/capsule_bridge.mjs show` (read-only mode —
> `grep -n "MODES" scripts/capsule_bridge.mjs`).*
> *(2) **"hands-on cross ho chuka" aaj tak sach nahi.** Embeddings ke kul **do** reps hain aur
> dono `surface:"gem"` (`dressing-room/state/reps_log.jsonl` — ginno, kabhi yahan se mat lo);
> koi build-rep nahi. Aur jis FinOps duplicate-vendor detection ko "hands-on" kaha ja raha hai,
> uska repo hi nahi bana (`grep -n "FinOps repo" scripts/shipped.mjs` → "does not exist yet —
> sprint 1-08"). `benchmark.mjs preview` 10 Aug ko: `2-rag: locked 1/5 · cold re-proof 0/1` —
> yaani embeddings ka **cold re-proof bhi pending** hai.)*

---

## BUCKET 3 — AI Agents (sabse hot skill)

**Simple mein:** AI ko khud decide karne dena ki kaunsa tool/step use kare.

Kya aata hai:
- Function calling — AI khud decide kare kab kaunsa function call kare
- Agentic workflow — multi-step kaam khud chalana
- Multi-agent — kai AI agents milke kaam karein
- Reflection — AI apna jawab khud check kare
- MCP (Model Context Protocol) — AI ko external tools se jodna

**FinOps mein kahan:** Procurement module ka what-if engine (Claude optimizer ko tool ki tarah call karta hai), "Altpac 15% mehnga ho to?" → AI rerun karke samjhata hai.
**Interview value:** "Agentic" abhi sabse demand wala word. Tool-use tera Module 3 ka core.

---

## BUCKET 4 — AI ko reliable banana (Guardrails + LLMOps)

**Simple mein:** AI galti karta hai — usse production-ready, sasta aur monitor-able banana.

Kya aata hai:
- Observability — har AI call monitor (speed, cost, accuracy, tokens)
- Evaluation — AI sahi jawab de raha hai ya nahi, measure karna
- Guardrails — galat/unsafe output rokna
- Cost optimization — sasta chale par accha kaam kare
- Prompt versioning — prompts ko code ki tarah version control

**FinOps mein kahan:** `api_logs` table (Day 1 se — model/tokens/latency/cost/confidence/promptVersion), DEMO_MODE budget control.
**Interview value:** yahi tera **LLMOps differentiator** hai (Zomato ops → LLMOps: SLA→latency, payments→inferences, reconciliation→golden dataset). Most engineers yeh nahi soch paate.

---

## BUCKET 5 — Full Stack foundation (sab ek product mein daalna)

**Simple mein:** AI ke saath ek asli, chalne wala product banana.

Kya aata hai:
- React frontend — UI
- Node.js backend — server
- Python + FastAPI — AI ecosystem ki primary language (Month 2)
- Supabase PostgreSQL — database
- Vercel — live deploy

**FinOps mein kahan:** poora app (React+Vite, Express, Supabase, Vercel). Python/FastAPI Month 2 mein.
**Interview value:** "shipped product" — jo 90% candidates ke paas nahi hota.

---

## EK LINE MEIN

> "AI se baat karna → AI ko smart banana → AI ko autonomous banana → AI ko reliable banana → sab ek shipped product mein."

---

## ABHI NAHI (deliberately deferred — Month 2 / post-job)

Yeh buckets **cut nahi** hue — sirf inki **gehraai** baad ke liye rakhi:
- Deep ML-researcher math, fine-tuning ke internals → light, baad mein
- Month 2 tooling: FastAPI rewrite, LlamaIndex, MCP server banana, Ollama (local models), Graph RAG
  > *(corrected 10 Aug 2026 — "MCP server banana" ab poori tarah deferred nahi hai: is organism
  > mein ek MCP server BAN chuka aur registered hai — `.mcp.json` ka `organism-memory` entry
  > `scripts/mcp-memory.mjs` ko chalata hai (dependency-free stdio JSON-RPC: recall / note /
  > get_context / remember_fact). FinOps product ke andar MCP server abhi bhi deferred — par
  > interview mein "MCP server banaya hai" ab ek **shipped artifact** hai, sirf plan nahi.
  > Verify: `cat .mcp.json` + `ls scripts/mcp-memory.mjs`.)*
- Advanced RAG depth: fancy chunking, re-ranking models, RAGAS framework
  > *(corrected 10 Aug 2026 — yahan sirf **gehraai** deferred hai, concept khud nahi. Canon registry
  > `dressing-room/state/concepts.json` mein `retrieval` (aliases: `top-k`, `hybrid search`,
  > **`reranking`**) aur `rag_eval` (alias **`ragas`**) dono `core:true` hain, aur
  > `node scripts/benchmark.mjs preview` inhe seedha need-line pe rakhta hai:
  > "need: 2-rag: unlock chunking, retrieval, rag_eval, vector_search". Yaani lock-floor pe woh
  > HAIN — sirf unki research-level depth baad ke liye hai. Is line ko "skip kar sakte hain"
  > mat padhna.)*
- Open-source LLMs locally chalana (quantization)

**80/20 jo job dilayega:** 5 buckets (build-level) + ek shipped FinOps + har decision khud defend karna + business framing. Deep researcher banne ki zaroorat nahi.

---

## ROADMAP ↔ FORGE (kaise jude hain)

- Forge **Foundations** stream (tokenization → embeddings → inference → context → ...) = mostly **Bucket 1 + 2** ki neenv.
- Forge **Courses** stream (API, prompts, tool use, evals) = **Bucket 1 + 3 + 4**.
- Forge **FinOps** stream (RAG, pgvector, structured output, function calling) = **Bucket 2 + 3** hands-on — *(structured output ko chhod kar: woh live registry mein `4-llm-api` hai, aur bucket-map use **B1** pe bhejta hai, B2/B3 pe nahi — dekho neeche.)*
- Bucket 4 (LLMOps) + Bucket 5 (Full Stack) = FinOps **build** karte hue khud aate hain — *(Bucket 4 ke liye poora sach nahi: uske chaar concepts ko apna forge-lock chahiye, dekho neeche.)*

> **(live-check 10 Aug 2026 — yeh section CODE padhta hai, isliye har line verify ki gayi.
> `scripts/benchmark.mjs` ka `ROADMAP_BUCKETS` isi section se banaya gaya hai:
> `grep -n "ROADMAP_BUCKETS" scripts/benchmark.mjs`.)**
> - **Foundations = B1 + B2 ki neenv — VERIFIED.** Code mein `1-fundamentals` dono buckets ke
>   andar aata hai, label ke saath: `note: "neenv — shared with B2"`
>   (`grep -n "shared with B2" scripts/benchmark.mjs`).
> - **Courses = B1 + B3 + B4 — VERIFIED.** B1 pe `course: true` + skills `anthropic_api,
>   prompt_engineering, streaming`; B3 pe `tool_use_api`; B4 pe `evaluations`
>   (`grep -n "tool_use_api\|evaluations" scripts/benchmark.mjs`).
> - **"structured output = Bucket 2 + 3" — GALAT.** `concepts.json` mein
>   `structured_output.bucket = "4-llm-api"`, aur bucket-map `4-llm-api` ko **B1** ke neeche
>   rakhta hai (`grep -n "4-llm-api" scripts/benchmark.mjs dressing-room/state/concepts.json`).
>   RAG/pgvector (`2-rag` → B2) aur function calling (`tool_use` → `3-agents` → B3) sahi hain.
> - **"Bucket 4 khud aa jaata hai" — aadha sach.** Registry `5-llmops` ko chaar `core:true`
>   concepts deti hai — `golden_dataset · llm_judge · observability · human_in_loop` — aur
>   `node scripts/benchmark.mjs preview` unhe naam-le-kar need-line pe rakhta hai
>   ("need: 5-llmops: unlock golden_dataset, llm_judge, observability, human_in_loop"). Build
>   se exposure milega, **lock apne aap nahi milega.** Bucket 5 ke liye claim khada hai: uske
>   paas koi concept-bucket hai hi nahi (`concept_buckets: []`), sirf skills + python + shipped.
> - **"Forge ki 3 streams" ab live vocabulary nahi hai.** `dressing-room/state/sprint.json`
>   ke tasks **13** alag `stream` naam rakhte hain (Foundations · Courses · Python · Setup ·
>   LLM-API · Domain · Cross-cut · Build · LLMOps · Full-Stack · Career · RAG · Agents) aur
>   unmein koi stream "FinOps" naam ka hai hi nahi (uske sabse kareeb "Build" hai). Streams
>   live ginno: `node -e` over `dressing-room/state/sprint.json` (`tasks[].stream`), kabhi
>   yahan se nahi.

**Foundations progress: LIVE ginno, yahan se kabhi nahi —** `node scripts/capsule_bridge.mjs show`
(locked capsules + lock-dates, read-only) ya `node scripts/benchmark.mjs preview` (bucket-wise
"locked X/Y · cold re-proof X/Y").

> *(corrected 10 Aug 2026 — yahan hardcoded likha tha: **"Foundations progress: 4/17 locked
> (tok #01 · emb #02 · inf #03 · context #04)."** Teen alag baatein:*
> *(1) **"4 locked" us din SACH tha** — `capsule_map.json` mein aaj bhi chaar hi entries
> `locked_on` rakhti hain (tokenization 2026-06-15 · embeddings 2026-06-21 · inference
> 2026-06-24 · context 2026-06-28), aur #01→#04 numbering unhi lock-dates ka kram hai. Par yeh
> count **agle lock pe hi rot ho jaayega** — isliye number hata kar command rakhi gayi hai.
> 10 Aug ka live read (`benchmark.mjs preview`): `1-fundamentals: locked 3/4` +
> `2-rag: locked 1/5`, aur **cold re-proof 0** dono jagah.*
> *(2) **Denominator "17" kisi live source se nahi nikalta — NOT VERIFIED.** Canon registry
> `dressing-room/state/concepts.json` aaj **26 concepts** rakhti hai (`core:true` waale 23), aur
> `1-fundamentals` bucket mein core sirf **4** hain (tokenization · inference · context ·
> hallucinations; `neuralnet` aur `rlhf` `core:false` = light). 17 = syllabus-FLOOR ka purana
> aankda, registry ka count nahi — **yeh seam captain ka call hai, is repair ka nahi.**
> Ginne ka tareeka: `node -e "const c=require('./dressing-room/state/concepts.json');
> console.log(Object.keys(c.concepts).length)"`.*
> *(3) Ek aur cheez chhup gayi thi: is "Foundations" list mein **embeddings** bhi ginaa gaya
> hai jabki registry use `2-rag` deti hai (`concepts.json → embeddings.bucket = "2-rag"`).
> Sprint ke stream-labels ke hisaab se woh sahi hai (`sprint.json` mein `1-01 Embeddings` ka
> `stream = "Foundations"`) — do alag vocabulary hain, isliye kisi bhi "foundations X/Y" ko
> bina yeh poocha ki **kaun sa** foundations (bucket ya stream) mat padhna.)*

**Agla foundation concept: HALLUCINATIONS — aur woh pehle se KHULA pada hai.**
`dressing-room/state/forge_session.json` → `concept: "hallucinations"`, `step: 3`,
`started_at: 2026-08-10` (session band nahi hui); `sprint.json → progress.current` =
`1-04 Hallucinations · in_progress · mode "FORGE (9-axis concept capsule)"`, aur uska `next_up`
= `1-05 Anthropic: API Fundamentals · 1-06 Prompt Engineering · 1-07 Python basics`.
Live position padho: `node -e` over `forge_session.json` + `sprint.json`.

> *(corrected 10 Aug 2026 — yeh line kehti thi: **"Agla foundation concept: NN-light (context #4
> lock ke baad ka pre-decided reward — neuron/layer/forward-pass/attention high-level/logit-origin;
> Training/RLHF ke saath batchable). FinOps duplicate-vendor detection (embeddings) hands-on cross
> ho chuka."** Dono halves galat ho chuke the:*
> *(a) **NN-light agla nahi raha.** Sequence badal gaya: registry mein `neuralnet` aur `rlhf`
> `core:false` (light) hain, sprint ka `next_up` unhe naam tak nahi leta, aur hallucinations ka
> forge 10 Aug ko live chal chuka hai — is line pe chal kar koi session **khuli hallucinations
> session chhod kar NN-light shuru kar deta.** NN-light ka pre-decided-reward plan khatam nahi
> hua, sirf ab woh "agla" nahi hai.*
> *(b) **"FinOps duplicate-vendor detection (embeddings) hands-on cross ho chuka" — nahi hua.**
> Embeddings ke kul do reps, dono `surface:"gem"` (`reps_log.jsonl`); FinOps repo abhi bana hi
> nahi (`grep -n "FinOps repo" scripts/shipped.mjs` → "does not exist yet — sprint 1-08";
> `shipped_config.json` state mein nahi; sprint `progress.done` = `1-01 · 1-02 · 1-03` only).
> Capsule LOCKED hai — hands-on cross **baaki** hai.)*
