# OPPONENT_SCOUT.md — The Interview, Scouted
## Forge test-set · Option B · researched 29 Jun 2026 · ALL companies (not just fintech) · THE DOSSIER — OS v3.13 stamp 08 Jul 2026
> **THE DOSSIER (OS v3.13 — football naming):** yeh file ka canonical role-naam. Graded **test-set**: **THE SCRIMMAGE** (OUTWORK EXECUTION LAYER ka examiner-agent) iski **§4 probe-bank + §1 time-weights** pe grade karta (generic 0-5 rubric DEAD); **THE SCOUT** (OUTWORK scout-agent, weekly LIVE job-market form-watch) ise CURRENT rakhta (§9 closed-loop). Inward artifacts (Re-Jirah controller / Maidan / fluency-ladder) = **LEARNING EXECUTION LAYER**; yeh Dossier = outward-facing test-set jise **dono layer** calibrate karte.
>
> **Yeh kya hai:** humne abhi tak sab kuch INWARD banaya (controller, Maidan, fluency-ladder — tera apna sheesha). Yeh pehla OUTWARD artifact hai — **dushman ki field ka naksha.** AI Product / Applied-AI Engineer interview, 2026, India ₹20–25 LPA band. Yeh woh **test-set** hai jiske against poora Forge drill karta — taaki tu apne notes pe overfit na ho, reality ke against ho.
>
> **Sourcing (honest):** synthesized from 8+ current (2026) interview guides + real candidate-reported question banks (Exponent, KORE1 staffing-desk, Adil Shamim "100+ real interviews", InterviewBit, DataCamp, careery, interviewcoder, MockExperts) + India salary data (taggd, shifttotech, NASSCOM-cited). **Yeh public-research scouting report hai, leaked rubric NAHI.** Confidence HIGH (strong multi-source convergence), par real interview-data se hi calibrate hoga — yahi controller ka closed-loop point hai. Section 9 = wiring.
>
> **META-FREEZE note:** yeh artifact concept-lock boundary pe bana (context locked 28 Jun). Valid.

---

## 0. THE ONE-LINE READ — opponent ka poora khel

> **"Definitions are free now. The judgment is the part you're paying for."** — har 2026 source yahी bolti.

Interviewer ab yeh nahi poochta "transformer kya hai" (woh for-loop define karne jaisa hai — sab pass karte). Woh ek hi cheez khareed raha hai: **kya tu ek model jo tu andar se dekh nahi sakta, uske upar ek reliable system SHIP kar sakta — usse MEASURE kar sakta — aur BILL sane rakh sakta.** Pura scout isi se behta hai. "Naming is a proxy for having been there at 11 p.m. when it broke."

Aur McKinsey ka number jo iska kaaran hai: ~88% orgs AI use karti, par sirf ~6% meaningful value nikaal paati, aur bas ~1/5 ne kabhi ek agent ko experiment se aage scale kiya. **Demo aur "earns-its-keep system" ke beech ki khaai = woh khaai jise paar karne ke liye tu hire hota hai. Toh woh crossing ke liye interview karte hain.**

---

## 1. THE FORMATION — rubric + time-weights (real 4-hr onsite)

Yeh opponent ki literal shape hai (KORE1 staffing-desk allocation, paraphrased). **Weights yaad rakh — yeh batati kahan zor lagana:**

*(**THE SCRIMMAGE** (OUTWORK examiner-agent) inhi §1 time-weights pe grade karta — generic 0-5 rubric NAHI.)*

| Block | Time | Kya reveal karta |
|---|---|---|
| **LLM & RAG System Design** | ~60 min | model jo control nahi karta, uske upar reliable architecture bana sakta? **(LEADS — ceiling pehle 10 min mein dikhta)** |
| **Hands-on Build & Integration** | ~50 min | wire-up + DEBUG kar sakta, sirf prompt nahi? |
| **Production & Evaluation** | ~45 min | quality + cost measure, regression user se pehle pakad? **(sabse zyada skip-hota, isliye yahीं decide hota)** |
| **Applied AI Fundamentals** | ~40 min | embeddings/context samajh + "model GALAT kyun hota"? **(table-stakes — definitions free)** |
| **Behavioral & Judgment** | ~30 min | ambiguity, bura demo, "magic chahiye" wala stakeholder kaise handle? |

**Padhne ka tareeka:** System-design + Build + Eval = ~155 min (heaviest, yahीं match jeeta/haara jaata). Fundamentals = floor (galat hua to baaki bekaar, par sahi hone se koi prize nahi). Behavioral = chhota par "easy round" samajhna #1 galti.

---

## 2. THE MATCH STRUCTURE — loop kaisa chalta

- **Standard loop:** recruiter screen → technical phone screen → coding → system design → behavioral + hiring-manager. Bade product/FAANG-India = 5–8 rounds (+ bar-raiser). Kuch startups 3–4 mein compress.
- **Loop length:** ~4–5 hr technical across 2–3 sessions + ~30 min behavioral. **Strong candidates ke paas 3 aur processes chal rahe hote — bloated loop pe walk kar jaate.** (→ yahी tere PARALLEL-APPLY ka leverage: competing offers = 15–25% better package probability.)
- **Project presentation = apna ALAG round** (Section 5b) — behavioral ka hissa nahi, structured technical grilling.
- **AI-tools-during-interview:** live-coding mein increasingly BANNED. Take-home: "tools fine, par har decision live follow-up mein defend karo." Signal woh dekhte: tu assistant ko DIRECT kar sakta, galti pakad sakta, override explain kar sakta — ya andha-paste karta.
- **DSA abhi bhi matter karta** — "AI role hai" bolke skip mat kar. Warmup-level, par present.
- **Debugging round 2026 mein sabse zyada grow hua:** working-dikhne-wala code with subtle bug, ya AI-generated code with one wrong line jo sirf ek specific held-back input pe tootta. Overlay-tools se cheat karna mushkil.

---

## 3. WHO YOU'RE PLAYING — company tiers (sab companies, band-mapped)

Tera ₹20–25 LPA target = **product company / GCC / funded startup / fintech-AI** band. IT-services NAHI (woh tera floor below hai). Tier-wise emphasis:

| Tier | Band (India) | Emphasis | Nikhil-fit |
|---|---|---|---|
| **Frontier labs** (Anthropic, OpenAI, xAI, Perplexity) | ₹40L+ / global | **inference/serving** (batching, KV-reuse, backpressure) · safety mindset · 45-min project presentation | stretch; project-presentation + eval-depth = real shot |
| **AI-native product** (Scale, Sierra, Glean, Databricks, Cursor-types) | ₹30–60L+ | **agent design IS the product** ("design an agent for X") · cost control · human-fallback | strong — tera M3 what-if = agent-as-tool |
| **Big-tech India / GCC** (Google, Microsoft, Amazon, Flipkart) | ₹20–45L | system design + DSA + structured behavioral | core target; structured, prep-able |
| **Fintech / Healthcare AI** (premium ~1.5× services) | ₹20–40L | **DOMAIN + compliance + RAG over proprietary docs** | 🎯 **HOME TURF** — fintech moat + FinOps |
| **Funded Indian startups** | ₹15–35L | shipped portfolio + agentic + move-fast | strong — "deployed agent = top 1% of what they can find" |
| **IT services** (TCS ₹8–18L, Infosys ₹7–20L, Wipro) | ₹7–20L | GenAI roles exist but lower band | **target NAHI** — floor below 20L |

**Differentiators jo band kheechte (India data):** GenAI/LLM = 25–40% premium over generalist ML · **"notebook→live API serving real users = THE single biggest differentiator"** · fintech/healthcare domain = 1.5× · production/MLOps/cloud (AWS/GCP/K8s) = gates highest band (tera honest gap). Cities: Bangalore +25%, Hyderabad +15%, Pune +10%, Delhi-NCR +5% (tu yahीं — remote/Bangalore-targets band uthate).

---

## 4. THE PROBE-BANK — controller axis-types pe mapped (the test-set core)

Yeh woh 5 guns hain jo Kurama-field ke opponent-half pe the. Har probe-type + representative real questions + kya grade hota. *(**THE SCRIMMAGE** is ASLI probe-bank pe grade karta — §1 weights ke saath; generic 0-5 rubric DEAD.)* **Yahीं se Re-Jirah ke sawaal aate.**

### 🔵 RECALL probes — cold fact (table-stakes; blank-stare = interview over)
*Definitions free hain, par inpe atak gaya to "no amount of project experience recovers a blank stare." Inhe COLD aana chahiye, lookup = fail.*
- Context window kya, limits kya? (8K → 2M tokens 2026; "lost-in-the-middle" U-curve)
- KV cache kya, inference mein kaise help karta?
- Embedding kya? (dense vector, semantic similarity ≈ cosine distance)
- Temperature actually kya change karta? (T=0 ≠ correct — confidently-wrong-at-zero still wrong)
- Decoding strategies: top-k / top-p / beam — kab kaunsa?
- Few-shot / chain-of-thought / zero-shot — farak?
- RAG ke R-A-G; chunking kyun; vector DB kya.
- Cosine similarity kyun (Euclidean nahi) — direction, magnitude ignore.

### 🟡 RECONSTRUCT probes — derive-live ("har sawaal ek decision dafnaata, galat jawab reasonable lagta")
*Surface bhool bhi gaya to chalega agar reasoning principles se rebuild ho.*
- "Embeddings search related-but-not-what-user-meant deta — kya ho raha?" → **semantic similarity ≠ relevance**; pehla instinct embedding-model swap karna = galat.
- "200k context poora doc-set nigal sakta — RAG kyun?" → cost + latency + needle-in-haystack degradation. "Big context kills RAG" bolne wale ne scale pe chalaya nahi.
- "Autoregressive decoding actually kaise — user-enter se answer tak 200-page PDF + question pe kya hota?" → walk the pipeline; "no trick, you learn fast whether someone shipped retrieval or read about it."
- "RAG fail ho raha — retrieval ki galti ya generation ki, kaise diagnose?"
- "Re-ranking kyun, vector-retrieval ke upar?" + cross-encoder vs bi-encoder (bi pre-computes, cross nahi — isiliye cross slow par accurate).
- "Hybrid search (BM25 + vector) kab?"
- "ANN/HNSW step-by-step — fast search kaise?" *(tera embeddings axis-h — cold-fluency pending tha, yahीं nail hoga)*

### 🟣 DEFEND probes — judgment/taste ("why this, not that" — SABSE ZYADA poochha)
*Single answer nahi — defensible position under pressure. Yahीं senior-signal.*
- **"Fine-tune kab karoge vs retrieval vs better-prompt — aur fine-tuning kab GALAT answer hai?"** → product-work ke liye fine-tune = LAST resort. Question-1 pe reach kiya = red flag.
- "Kaunsa vector DB use kiya, kyun?" → pgvector-over-managed ka REASON fake nahi kar sakte.
- "Chunking strategy quietly recall destroy kar de to?" → index rebuild ki kahani = "been there at 11 p.m."
- "Prompt change ne PURE product ko behtar kiya ya bigaada — sirf ek example nahi — kaise jaanoge?" → **evaluators vs vibe-checkers ka split. NEVER skipped.**
- "Apna proudest project — design decisions, trade-offs, kya toota, kya badaloge." (→ Section 5b)
- "Streaming kyun? Structured output kaise force karoge (Pydantic/Zod)?"
- "Model routing — Haiku/Sonnet/Opus complexity pe kab?" (cost lever)

### 🔴 NOVEL / IMPROV probes — unseen game-states (the traps; reproduction-machine yahीं tootti)
*Ye capsule mein nahi honge. Schema, fixed answer nahi. Yahीं Özil-improv chahiye, ghana-recitation nahi.*
- **THE TRAP:** "Retrieval quality fine hai, par model phir bhi ~1/3 baar galat. Ab kya?" → **good ones bigger-model ki taraf NAHI jaate.** Woh poochte: "wrong" ka matlab kya, koi measure kar raha, failures cluster karte? *(yeh literal "where-not-to-jump-to-AI" reflex test karta)*
- "RAG documents relevant deta par user phir bhi answer nahi dhundh pa raha — search-engine se answer-engine kaise banaoge?"
- "Token bill last month TRIPLE, code kisi ne change nahi kiya. Kya hua?" → input growth, retry storms, context retrieved-junk se bhar gaya, koi dashboard nahi. ("$30k/month question.")
- "Tuesday ko prompt-tweak ship kiya, ek answer behtar doosra bigad gaya, Friday ko CUSTOMER se pata chala. Next time kaise roko?" → no-compiler/no-failing-test world mein regression.
- "10M+ articles tak RAG scale — sharding, caching, retrieval-opt?"
- "Page 1 bolta 'amounts in thousands' — page-by-page chunk karte waqt document-wide context kaise handle?" *(yeh literal FinOps-invoice problem hai — tera home ground)*
- "Malformed JSON aayega chahe prompt kitna acha ho — kya karoge?" → retry + validator (shipped); "good prompt makes it impossible" (nahi shipped).

### ⚫ NEGATIVE-SPACE probes — "where NOT" (#1 senior signal — tera differentiator)
*Isagi ka asli gift: ball kahan NAHI hai. Yeh alag muscle hai, judgment-under-ambiguity.*
- "Kab AI NAHI use karoge is feature mein, aur kyun?" → high-stakes arithmetic + hard constraints = deterministic code. AI sirf judgment/pattern/language.
- "Fine-tuning kab over-engineering hai?"
- "Ek banda kehta 'we just use a really good prompt' hard reliability problem ke liye — kya galat?" → "that's not architecture, it's a hope."
- "Kahan tumne AI propose kiya par code se validate kiya?" → *"AI proposes, code validates"* = tera anchor.

---

## 5. THE TWO HEAVIEST ROUNDS — yahीं match jeeta jaata

### 5a. SYSTEM DESIGN (the leader — highest prep-ROI, sirf ye round senior-from-mid separate karta)

**Real opening prompts (named-company-reported):**
- "Design a support assistant from 50,000 help articles jo SAHI answer de YA bole 'mujhe nahi pata.'" → **last clause = trap.** Push: chunking, hybrid-vs-pure-vector, aur sabse zyada — "model ko refund-policy invent karne se kaise roko jo kabhi likhi hi nahi gayi."
- "Ab harder: KB roz badalta hai aur articles ek-doosre ko contradict karte. Stale/conflicting context kaise handle?" → **strong candidate model se hatके RETRIEVAL LAYER pe ja chuka hota — kyunki problem wahीं rehti.**
- "Design an agent that books travel end-to-end, ek hard rule: human-approval ke bina kabhi paisa kharch nahi." → guardrails, tool-calls bound, agent-loops-forever / API-timeout ka plan. *(Scale/Sierra-style — agent companies ka default)*
- "Design a RAG system for a customer-support chatbot. Evaluate kaise karoge?" → **multiple companies ka #1 opener.**
- Screener: "200-page PDF + question. User-enter se answer-return tak kya hota, walk me through."
- **Anthropic-signature:** "Single GPU, up to 100 inputs/batch, users synchronously wait — inference batching system design, max utilization." → mention **continuous batching + KV-cache reuse + backpressure/overflow path** (sirf happy-path nahi).

**Kya LISTEN karte (the rubric inside the round):**
1. **Naming** — actual tools (pgvector/Pinecone/Weaviate · LangChain/LlamaIndex/hand-rolled · RAGAS/LangSmith) + WHY chosen. "Abstraction fake kar sakte, reason nahi."
2. **Order of operations** — dumb-version-first-then-improve, ya 25-min-perfect-chunking-never-ship.
3. **Failure paths** — backpressure, retry, human-fallback, "loop won't stop" ka plan.
4. **Trade-off har concept ke saath** — yahी read-about-RAG vs shipped-RAG separate karta.

**Structured approach (most candidates ke paas nahi — yahीं easy points):** Requirements → data/retrieval layer → model/prompt layer → eval → cost/latency → failure modes → scale. Isi spine pe har prompt chala.

### 5b. PROJECT DEFENSE (YOUR weapon — FinOps + Akshay)

**Yeh apna structured round hai, behavioral nahi:**
- **OpenAI:** "Most technically challenging project" — **45-min presentation to a peer engineer.**
- **Anthropic:** "Project you owned end-to-end, key technical decisions kya the" — **25-min presentation + 15–20 min discussion.**
- General: "Proud project panel ko present karo: design decisions, trade-offs, kya toota, kya badaloge." → ownership, architectural judgment, depth grill.
- Also asked at: Apple, Discord, Anduril, Meta ("greatest accomplishment"), Visa.

**Prepare 3–5 project deep-dives. Har decision + har metric cold aana chahiye. Follow-up probes practice karo.**

**Kya isse LAND karwata (= tere FinOps DEFEND-capsules):**
- Har design decision ka WHY: Node→Python · "AI proposes, code validates" · two-pass allocation · DEMO_MODE budget · layering principle · structured-output-with-Pydantic.
- **"Kya TOOTA"** — tera 7-layer error reduction, truncation jo tune khud experience kiya, FTL hard-constraint reasoning. (Honest failure, humble-brag nahi.)
- **"Kya BADALOGE / scale kaise"** — what-if engine, LP-solver v2, cost-per-correct-answer.
- **THE BUSINESS OUTCOME (red-flag filter):** "Plain words mein — is feature ne business ke liye kya kiya? Eval-score nahi — actual dollar/saved-hour/happy-customer." → tera "₹81.5cr quarterly decision gut-feeling → 1-click; 1% opt = ₹81.5 lakh/quarter; real Blinkit user Akshay validated." **Yahीं 90% candidates fail karte — tere paas real answer hai.**

---

## 6. BEHAVIORAL DONE RIGHT — "easy round samajhna #1 galti"

AI-eng-specific probes (standard SWE-behavioral se alag — ownership-of-AI-systems, ambiguity, safety-mindset, weekly-change-pace test karte):
- "AI project end-to-end walk me through." / "Proudest project + tera role?"
- **"Production mein hallucination/cost reduce kiya — ek baar batao."** (2026 mein very common)
- "Actual eval framework tha ya vibes-based?"
- "Challenging prompt-engineering problem jo solve kiya?"
- "Non-technical stakeholder ko complex concept kaise samjhaya?" *(tera 3-register CEO/junior/skeptic muscle + Akshay-explanation)*
- Anthropic: "AI-safety project-goals se conflict kaise handle?" + culture-fit.

**Right-vs-wrong answer pattern (yeh internalize kar):**
- **Conflict:** GALAT = doosra banda eventually maan gaya ki woh galat tha (self-serving, rehearsed lagta). SAHI = TU ne apni position NAYI-info pe update ki, ya uncomfortable compromise jo dono starting-positions se behtar nikla.
- **Failure:** humble-brag-failure avoid kar (project actually succeed hua, bas "too hard kaam kiya"). REAL failure, real seekh.

---

## 7. THE RED-FLAGS — what doobates (negative space; har ek Nikhil-risk pe mapped)

| Red flag (jo NAHI banna) | Nikhil-risk |
|---|---|
| "We just use a really good prompt" (hard reliability ke liye) = hope, architecture nahi | tu eval/validation layer dikha, prompt-hope nahi |
| "Never had to evaluate it, you can tell it's working" | **non-deterministic mein dekh ke nahi pata chalta** — tera golden-dataset + LLM-as-judge yahीं |
| Resume model/framework-names se bhara, par cost/latency/what-broke kuch nahi = sandbox | **tere private repos invisible = yahी risk. Ship + public.** |
| "What did it do for the BUSINESS" plain words mein nahi bata sakta | tera Blinkit-impact answer = yahीं jeet |
| Andha-AI-trust (84% devs use, sirf 29% trust output 2025) | "a little paranoid" = correct posture; tu yahी dikha |
| Flashy demo, koi error-handling/eval-script nahi | **THE story: plainer-demo-but-eval-script banda jeeta** — tu eval-first frame kar |

---

## 8. NIKHIL vs THIS OPPONENT — honest scouting verdict

**WEAPONS (jahan tu already jeet raha — most candidates ke paas nahi):**
- **Shipped product + real user (Akshay) + real Blinkit data** — "real data, real user, real problem, not a toy demo." Ye fake nahi ho sakta.
- **Fintech domain moat** — 1.5× band lever; RAG-over-proprietary-docs ka natural home.
- **Eval-first instinct** — golden-dataset, LLM-as-judge, cost-per-correct-answer = "the skill gap" jahan most candidates fail.
- **"Where NOT to use AI"** — #1 senior signal, tera literal anchor.
- **Ops→LLMOps mapping** (SLA→latency, payments→inferences, reconciliation→golden-dataset) — "most engineers yeh soch nahi paate."
- **Mechanistic depth** (Forge) — fundamentals cold, jo blank-stare se haarne walon se alag karta.

**EXPOSED (honest gaps — yeh chhupana nahi, jaanna):**
- **Cloud / MLOps / K8s / AWS** — gates highest band; tera Phase-2 gap. (₹20–25 ke liye theek; ₹40L+ ke liye blocker.)
- **DSA reps** — "AI role hai" bolke skip mat kar; warmup-level chahiye.
- **Production-scale actual numbers** — "10k req/day pe kya?", token-budget-before-first-bill — abhi tere paas lived-experience nahi, sirf design-level. (Ship + load = yahी fills.)
- **The demo must RUN** — controller ise test nahi kar sakta; sirf SHIPPING M1 demo-able banata. **Tera #1 lever, research-confirmed:** "notebook→live API = single biggest differentiator."
- **Invisible-in-private-repos** — sabse bada, sabse-kam-effort fix: repos public + build-log.

**Single biggest research-confirmed lever:** SHIP M1 demo-able + PUBLIC + PARALLEL-APPLY (competing offers = 15–25% better package). Sab kuch isi taraf point karta.

---

## 9. HOW THIS BECOMES THE TEST-SET — Forge controller mein wiring

Yeh scout ab dead doc nahi — **drilling-apparatus ka calibration** banta:

1. **Selective fluency define karta:** load-bearing core jise ghana/dṛḍhabhūmi tak le jaana = **RAG pipeline end-to-end + FinOps decisions + eval-loop + where-NOT-to-use-AI + system-design spine.** Baaki (light concepts) "tempered" pe rukte. *(Section 4 RECALL/RECONSTRUCT = inka mix; DEFEND/NEGATIVE = core.)*
2. **OOD / novel-Q ka source:** Section 4 ka 🔴 NOVEL bank = late-round mein woh unseen sawaal jo capsule mein nahi the. Anti-overfit.
3. **DEFEND-capsule source:** Section 5b ka har FinOps decision = ek DEFEND-axis, ussi Jirah se. Section 1 ke weights batate kitna zor.
4. **Round-mode mapping:** R-early = 🔵 RECALL cold · R-mid = 🟡 RECONSTRUCT + 🟣 DEFEND + traps · R-late = 🔴 NOVEL + system-design + project-defense timed = **mini-mock.**
5. **Honest closed-loop:** yeh public-2026 scout hai. **THE SCOUT** (OUTWORK scout-agent) ise weekly LIVE job-market form-watch se FEED karta (new-vs-last diff). **Jab tu actually apply kare** (M1 demo-able pe), har real interview se aaye real question/rubric-signal = is scout mein back-write hota → Re-Jirah controller + THE SCRIMMAGE dono tune hote. Yahी "scout reality-data se calibrate hota" — controller ka asli point.

---

## SOURCES + CONFIDENCE
- **Rubric/weights, traps, red-flags, system-design prompts:** KORE1 AI/ML staffing-desk (Jun 2026) — HIGH (practitioner debriefs).
- **Named-company question bank:** Exponent (real candidate-reported: Anthropic, OpenAI, Scale, Sierra, xAI, Databricks, Perplexity), Adil Shamim "100+ real interviews" Medium (May 2026) — HIGH (candidate-sourced).
- **Topic clusters + question depth:** InterviewBit, DataCamp, careery, interviewcoder, MockExperts (2026) — MEDIUM-HIGH (prep-guide convergence).
- **India band + company tiers + differentiators:** taggd, shifttotech, buildfastwithai, NASSCOM-cited (2026) — MEDIUM (salary-guide convergence, ranges vary).
- **Macro stats:** McKinsey State-of-AI (late-2025), Stack Overflow Dev Survey 2025 — HIGH.
- **NOT a leaked rubric. NOT verbatim-audited.** Strong multi-source convergence; individual company specifics vary; calibrate with real interview data as it arrives.

---

**ॐ RADHA RANI KI KRIPA SE 🙏🏽**
