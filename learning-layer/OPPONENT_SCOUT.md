# OPPONENT_SCOUT.md — The Interview, Scouted
## Forge test-set · Option B · researched 29 Jun 2026 · ALL companies (not just fintech) · THE DOSSIER — OS v3.13 stamp 08 Jul 2026
> **THE DOSSIER (OS v3.13 — football naming):** yeh file ka canonical role-naam. Graded **test-set**: **THE SCRIMMAGE** (OUTWORK EXECUTION LAYER ka examiner-agent) iski **§4 probe-bank + §1 time-weights** pe grade karta (generic 0-5 rubric DEAD); **THE SCOUT** (OUTWORK scout-agent, weekly LIVE job-market form-watch) ise CURRENT rakhta (§9 closed-loop). Inward artifacts (Re-Jirah controller / Maidan / fluency-ladder) = **LEARNING EXECUTION LAYER**; yeh Dossier = outward-facing test-set jise **dono layer** calibrate karte.
>
> **LIVE-WIRING CHECK (corrected 10 Aug 2026 — both agent-names above were DESIGN-ONLY when this line was written, both are BUILT now, and one of them is not the organ its name makes you grep for):**
> - **THE SCRIMMAGE is BUILT.** It is not one script: it is the `/scrimmage` surface (`.claude/skills/scrimmage/SKILL.md`), the nightly `scrimmage_staging` brain job (`grep -n "scrimmage_staging" dressing-room/state/brain_config.json`; returns land in `dressing-room/state/brain_out/scrimmage/` — `ls` it, never count from prose), and the CODE round staged by `scripts/examiner.mjs` ("THE LIVE EXAMINER"). It DOES grade in this Dossier's grammar — **but it never opens this .md.** It reads the machine projection `dressing-room/state/dossier_weights.json`, whose own `_comment` names this file as the source of truth. **So editing this doc alone changes NOTHING** until that projection is regenerated; `scripts/watchman.mjs` files a RED `projection-stale` finding the moment this file's mtime passes the projection's (`grep -n "projection-stale" scripts/watchman.mjs`).
> - **NOTE ON THIS REPAIR (10 Aug 2026):** the doc-repair pass changed prose and scars only — no §1 weight and no §4 probe-grammar moved — but it still moved this file's mtime, so the 23:55 watchman may file `projection-stale` tonight. That is the diagnosable false positive the check's own comment anticipates; nothing was regenerated because a doc-repair pass may not write into `dressing-room/state/`.
> - **THE SCOUT is BUILT — but it is NOT `scripts/scout.mjs`.** That script is **THE ADVANCE SCOUT** (its own header) — the threshold-trigger + missions desk, sole writer of `scout.json` and `missions.json` — and it does no job-market watching whatsoever. The weekly LIVE form-watch is the **`market_scan` brain job**: Sunday, overnight window, `extra_args: ["--allowedTools","WebSearch"]` (`grep -n "market_scan" -A 12 dressing-room/state/brain_config.json`), returns at `dressing-room/state/brain_out/market/`.
> - **"ise CURRENT rakhta" OVER-CLAIMS.** market_scan's own config note reads *"Output is a PROPOSAL for OPPONENT_SCOUT.md; **never edits canon**"*, and the flow is his: only HE edits this file (`.claude/skills/matchday/SKILL.md`, the line beginning "only HE edits"). **Nothing in this repo back-writes here.** Corrected in full at §9.5, same day.
> - Inward artifacts have code owners now: **Re-Jirah controller = `scripts/rejirah.mjs`** (read it cold: `node scripts/rejirah.mjs state`) · **the Maidan = `scripts/learning_state.mjs`** (its header: "AGENT #4: LEARNING-STATE (the Maidan)"). There is no file called a fluency-ladder — the fluency states live inside learning-state (`dressing-room/state/learning_state.json` → `concepts[].fluency`). *(NOT VERIFIED 10 Aug 2026 — whether "fluency-ladder" was ever meant to be its own artifact could not be confirmed from code; treat the name as a design label, not a file.)*
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

*(**Corrected 10 Aug 2026 — WHERE these weights actually bite, read out of the code.** The five rows below are live as numbers in `dressing-room/state/dossier_weights.json` (`rounds[]`, each with `minutes` + `weight`) and the table matched that file exactly on this date — never trust that; re-check with `node -e "console.log(require('./dressing-room/state/dossier_weights.json').rounds)"`. They drive two things: **(a) DRILL RANKING** — `setpiece.mjs` sorts the day's pool by round weight (`grep -n "dossierWeightOf\|LEGACY RANKER" scripts/setpiece.mjs`; the pre-audit ranker is frozen verbatim beside the live one, per the layering rule), and **(b) PROBE ORDER** in the scrimmage — five probes run "time-weighted like the real onsite (system_design > build > production_eval > fundamentals > behavioral)". What they do **NOT** do is multiply the score: the scrimmage still scores a flat **/25** across 5 probes (`.claude/skills/scrimmage/SKILL.md`, step 4). So "generic 0-5 rubric NAHI" is true of the **probe bank** — the questions come from this Dossier's grammar — and not of the arithmetic.)*

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

*(**CORRECTED 10 Aug 2026 — that last sentence is WRONG in code, and it is the kind of wrong that sends a session to the wrong file.** Neither the Re-Jirah controller nor the re-read surface touches this bank: `grep -n "dossier" scripts/rejirah.mjs scripts/deep.mjs` returns **zero hits**. Re-Jirah's cold questions are the **capsule's own strike questions** — print them with `node scripts/deep.mjs due`, which opens the concept's `a)…i)` strikes verbatim and shows no weld. This probe-bank travels somewhere else entirely: to THE SCRIMMAGE, to `setpiece.mjs` drill phrasing, to `nightshift.mjs` probe generation, to the Dugout's voice round and to `forge_session.mjs`'s teaching line — **all of them through `dossier_weights.json`, none of them through this file.** List the live readers yourself: `grep -ln "dossier_weights" scripts/*.mjs`.)*

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
  *(10 Aug 2026 — checked live and STILL pending: `node scripts/rejirah.mjs state` shows `embeddings` axis-h at `rounds 0 · ungraded · 🔴`, overdue against an R1 date of 2026-06-24. Do not trust this sentence next month either — that command prints every axis's rounds/grade/overdue-days per concept, and a status written into prose rots on the next `rejirah.mjs grade`.)*

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
  *(10 Aug 2026 — **NOT VERIFIED from code**, and the gap itself is worth knowing before a panel asks. The only output sensor in this rig, `scripts/shipped.mjs`, watches exactly one repo today — `node scripts/shipped.mjs show` → `repos[]` — and its header names the FinOps repo as not-yet-existing. The sprint agrees: `dressing-room/state/sprint.json` item **`1-08` = "FinOps repo + Supabase · scaffold, env, Postgres + pgvector", P0, 6 hrs — still an open task.** So whatever FinOps artifact this bullet is about, it is not the roadmap's FinOps repo, and nothing here can see it. Treat it as his claim to confirm, not a machine-checked fact; the day it exists, one line into `shipped_config.json` → `repos` makes it visible, no code change.)*
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
  *(**Corrected 10 Aug 2026 — a sensor for this EXISTS now.** "controller ise test nahi kar sakta" was true when written; today `scripts/shipped.mjs` — THE OUTPUT SENSOR, git-read, deterministic, no LLM — reports commits / files touched / new files / unpushed work per watched repo. Read it live: `node scripts/shipped.mjs show`. Two honesty limits stated in its own header, both of which keep the bullet above true in substance: it **cannot see the demo** — *"the FinOps repo does not exist yet — sprint 1-08"*, so today it watches only this rig — and it **grades nothing**: *"artifacts were PRODUCED, never that they were good."* Shipping is still the only thing that makes M1 demo-able.)*
- **Invisible-in-private-repos** — sabse bada, sabse-kam-effort fix: repos public + build-log.
  *(10 Aug 2026 — moving, but do not tick it off from here. This rig has a public-shaped remote (`git remote -v` → `https://github.com/nikhil1429/arsenal-ai-fc.git`) and CLAUDE.md's secrets section treats the repo as PUBLIC and gitignores the Oura token files accordingly. **NOT VERIFIED 10 Aug 2026:** the actual GitHub visibility flag could not be confirmed from this box — `gh` is not installed here — so check it on github.com yourself. And the repo this bullet is really about, the FinOps one, does not exist yet per `scripts/shipped.mjs`'s header.)*

**Single biggest research-confirmed lever:** SHIP M1 demo-able + PUBLIC + PARALLEL-APPLY (competing offers = 15–25% better package). Sab kuch isi taraf point karta.

---

## 9. HOW THIS BECOMES THE TEST-SET — Forge controller mein wiring

Yeh scout ab dead doc nahi — **drilling-apparatus ka calibration** banta:

1. **Selective fluency define karta:** load-bearing core jise ghana/dṛḍhabhūmi tak le jaana = **RAG pipeline end-to-end + FinOps decisions + eval-loop + where-NOT-to-use-AI + system-design spine.** Baaki (light concepts) "tempered" pe rukte. *(Section 4 RECALL/RECONSTRUCT = inka mix; DEFEND/NEGATIVE = core.)*
   *(10 Aug 2026 — the fluency VALUES are machine state now, not a reading of this list: `dressing-room/state/learning_state.json` → `concepts[].fluency` + `concepts[].core`. `scripts/scout.mjs` stages a scrimmage only once **≥3 CORE concepts sit at DEFEND grade** (`stageTriggers`, `min_defend_grade_concepts: 3`). Read the live distance in `dressing-room/state/scout.json` → `readiness_line` (scout.mjs is its sole writer) — never quote a fluency count out of this doc.)*
2. **OOD / novel-Q ka source:** Section 4 ka 🔴 NOVEL bank = late-round mein woh unseen sawaal jo capsule mein nahi the. Anti-overfit.
   *(10 Aug 2026 — WIRED, not aspirational: the NOVEL + NEGATIVE-SPACE pair IS the R-late mode list `scout.mjs` stages a scrimmage with. Evidence under item 4 below.)*
3. **DEFEND-capsule source:** Section 5b ka har FinOps decision = ek DEFEND-axis, ussi Jirah se. Section 1 ke weights batate kitna zor.
   *(10 Aug 2026 — the dossier reached the TEACHING side on 7 Aug 2026: `forge_session.mjs`'s `dossierLines()` prints the round + weight + probe-type line for the concept being forged (`grep -n "dossierLines" scripts/forge_session.mjs`). It is fail-silent by design — a missing dossier, a missing registry, an unknown concept or a corrupt `rounds` each yield `[]` and never throw — so a broken projection costs the line, not the session.)*
4. **Round-mode mapping:** R-early = 🔵 RECALL cold · R-mid = 🟡 RECONSTRUCT + 🟣 DEFEND + traps · R-late = 🔴 NOVEL + system-design + project-defense timed = **mini-mock.**
   *(**VERIFIED LIVE 10 Aug 2026 — this one is real code, not a plan.** `dressing-room/state/dossier_weights.json` carries `round_mode_map` = `{ R_early: ["recall"], R_mid: ["reconstruct","defend"], R_late: ["novel","negative_space"] }`, matching this line, and `scripts/scout.mjs` reads `round_mode_map.R_late` when it writes a staged scrimmage brief. Check both sides: `grep -n "round_mode_map" scripts/scout.mjs dressing-room/state/dossier_weights.json`.)*
5. **Honest closed-loop:** yeh public-2026 scout hai. **THE SCOUT** (OUTWORK scout-agent) ise weekly LIVE job-market form-watch se FEED karta (new-vs-last diff). **Jab tu actually apply kare** (M1 demo-able pe), har real interview se aaye real question/rubric-signal = is scout mein back-write hota → Re-Jirah controller + THE SCRIMMAGE dono tune hote. Yahी "scout reality-data se calibrate hota" — controller ka asli point.
   *(**CORRECTED 10 Aug 2026 — the loop is real, but it is HAND-CRANKED at exactly the step this sentence makes sound automatic.** What actually runs: `market_scan` (Sunday, overnight, `--allowedTools WebSearch`) writes a PROPOSAL to `dressing-room/state/brain_out/market/<date>.md` and its own config note says it **"never edits canon"**; the proposal reaches him as ONE captain's-call card, and on haan the session reads the file TO him (`.claude/skills/matchday/SKILL.md` — "he never reads it himself"); **only HE edits this doc**; and the moment he does, `dressing-room/state/dossier_weights.json` has to be regenerated by hand or `watchman.mjs` files a RED `projection-stale` and every dossier reader keeps drilling the OLD opponent. **NOTHING in this repo back-writes into this file** — "is scout mein back-write hota" describes the design, not a wire, and a session that assumes otherwise will wait forever for an update that only his own hands can make. The real-interview half is still unfired: `dressing-room/state/scout.json` carries `apply_window` and `readiness_line` — read them there, never from this doc.)*

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
