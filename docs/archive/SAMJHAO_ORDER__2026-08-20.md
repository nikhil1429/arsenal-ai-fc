# SAMJHAO ORDER — THE FOUR CLOSED TOPICS
## Opened 20 Aug 2026 · on his word · THE LEARNING WORK ORDER
### v2 — rewritten end of the 20 Aug design session. v1's §1 measurements were WRONG; see §2.

> **A NEXT SESSION OPENS THIS FILE FIRST**, reads §0, then §1–§4, then runs §10.
> This campaign will NOT finish in one session. It is written so any session can pick it up cold.
> The organism engineering order (`ORGANISM_AUDIT__2026-08-19.md`) is a **different lane** and is unaffected.
> Nothing here was decided by an agent. Every ruling below is his, dated, and quoted.

---

## §0 · THE RESUME POINTER — read this first

```
CAMPAIGN     : samjhao of the 4 closed fundamentals, then Re-Jirah on all four
TOPIC ORDER  : tokenization → embeddings → inference → context   (his order, 18 Aug, act amsyyr66dqy)
STATUS       : DESIGN COMPLETE 20 Aug. Teaching has NOT started.
NEXT SESSION : open tokenization axis a and teach it. No more design, no more research.
               The scope, the method, the notes law and the research are all settled below.
NOT STARTED  : all 36 axes
RE-JIRAH     : blocked until all four samjhao are closed (his ruling, 19 Aug)
PARKED       : the render fix (§9) — a separate sitting, not learning time
```

**Update this block at the end of every session. It is the only place progress lives.**

**Why teaching did not start on 20 Aug:** the whole session went to design and research, and it was worth
it — the method was wrong twice and the diagnosis was wrong once, and all three are now fixed. His call at
the close: *"should we start samjhao in next session because 42% context is full here."* Correct — a fresh
context is worth more than a rushed first axis.

---

## §1 · WHAT SAMJHAO IS — his ruling, and the mis-build it corrects

**His words, 20 Aug 2026:**

> "the entire point of doing samjhao is by reading notes i am not able to recall anything, i remember
> nothing now and notes are not worded properly, its too short and narrow… samjhao is basically doing
> revision of the topic we learnt by learning layer for the first time and re jirah are the revision
> tests on it."

### The pipeline
| Stage | What it does | Owner |
|---|---|---|
| **FORGE** | learn a concept the first time, 12 steps, 9 axes, capsule gets LOCKED | `forge_session.mjs` |
| **SAMJHAO** | **re-teach it from zero**, expanded, because he has forgotten it | this order |
| **RE-JIRAH** | the cold revision **test** on the re-activated material | `rejirah.mjs` |

### THE MIS-BUILD — do not re-introduce it
`scripts/samjhao.mjs` was built on **PREDICT-THEN-REVEAL** with a mandatory gut-word
(`knew|shaky|guessed`) before every unit. **That mechanism requires partial memory.**

His memory of these four topics is **zero**. Every rep would be `guessed` — noise, and it would corrupt the
honest calibration instrument he already has (`knew 3/3 @100%`, gap `0.0929`, overconfidence `0`). The
organ's own header even quotes him saying *"I have forgotten every single thing"* — **it contradicts its
own source quote.**

**RULE: no gut-word and no guess-gate in samjhao.** The gut-word belongs to Re-Jirah, where memory exists.

---

## §2 · WHY THE NOTES FAILED — the corrected diagnosis

> **v1 of this file said the capsules were "too short" — 70–131 words per axis. THAT WAS WRONG.**
> Only `weld` was measured. The entire `deep` layer was missed. Corrected below.

### The 3-LAYER NOTES MODEL — it already exists (FORGE_SPEC, 22 Jun 2026)
| Layer | Field | What it is FOR |
|---|---|---|
| 1 · **WELD** | `faultLines[].weld` | quick **recall-trigger** |
| 2 · **DEEP** | `faultLines[].deep` + capsule-level `deep` | *"**scratch-se-re-learn** … **~2 mahine baad jab concept dobara re-learn karna ho**"* |
| 3 · VIZ | `viz` / `heroViz` | RESERVED — the per-axis `viz` and `heroViz` keys do not exist in any capsule yet |

**Layer 2's stated purpose is exactly where he stands.** Tokenization locked 15 Jun; this order opened
20 Aug — two months.

### The real measurements (20 Aug, live)
| capsule | weld | **per-axis `deep`** | capsule `deep` | doubt answers | **real total** | v1 claimed |
|---|---|---|---|---|---|---|
| tokenization | 1,177 w | **1,426 w** | 182 w | 889 w | **~3,674 w** | 2,123 |
| embeddings | 982 w | **3,643 w** | 298 w | 1,150 w | **~6,073 w** | 2,271 |
| inference | 631 w | **5,089 w** | 420 w | 732 w | **~6,872 w** | 1,430 |
| context | 1,041 w | **2,960 w** | 539 w | 475 w | **~5,015 w** | 1,645 |

**All 36 of 36 axes have a populated `deep`.** Inference axis h alone is 1,943 words.
Verify, never recall: `node scripts/deep.mjs` (footer counts DEEP across N/N axes).

### So why did reading them fail? TWO causes, neither of them length.

**CAUSE 1 — THE RENDER BUG. The re-learn layer is hidden and shapeless.**

`setup/build_forge_html.mjs:99` —
```js
${a.deep ? `<details><summary>deep — poora khol</summary><pre>${pretty(a.deep)}</pre></details>` : ""}
```

Two defects in one line:
1. **`<details>`** — the full re-learn layer is **collapsed by default**. The thin `weld` renders in a plain
   always-open div (`grep -n 'class="weld"' setup/build_forge_html.mjs`).
2. **`<pre>`** — that markdown is dumped as a **raw monospace block**: no headings, no emphasis, no
   hierarchy. A wall of text.

`FORGE_DESIGN.md` §3.5 states the exact failure this causes: *"wall-of-text = wahi sardard + friction jisse
wo tool kholna band kar deta."* **The code does precisely what the spec forbids.**

He opened the notes, saw thin welds, felt nothing land, and concluded *"too short and narrow."*
**His conclusion was right; the cause was not length. The screen shrank the notes.**

**CAUSE 2 — `deep` is in bullet form, which refreshes but does not rebuild.**

Real example, tokenization axis e: *"**Rare string** → **over-fragmentation** (zyada tukde, mehnga +
fragile)."* Perfect for someone who once knew it — one arrow and the memory returns. For **zero memory**
it builds nothing: what over-fragmentation means, why it costs, how it goes fragile. Bullets **compress**;
cold re-learning needs **narrative + a worked trace + something he does with his own hands**.

**Both causes are real and they compound. §9 fixes cause 1. This order fixes cause 2.**

---

## §3 · THE NOTES LAW — what gets captured, and where

**His challenge, 20 Aug:** *"notes re-jirah pe kaise update ho sakte hain?? notes mein to sab hi jana
chahiye jaise first time learning karte hue jata hain."*

**He is right. An earlier ruling in that session was wrong and is withdrawn.** The error: applying the
**Re-Jirah gate** (which measures RETENTION) to the question of what belongs in **NOTES** (which record
what was TAUGHT). Two different things. Nothing waits for a test to earn its place in the notes.

### THE DEEP CAPTURE RULE — FORGE_SPEC, non-negotiable
> `deep` content **sirf Nikhil ke Bolo / teaching-threads se aata, verbatim-faithful. Claude invent kabhi
> nahi karta** — na axis weld, na deep, na koi example. Lock pe Claude threads/Bolo se **recover** karta →
> **Nikhil verify** karta uske gist-canonical hone se pehle.
> *(Kyun: yeh woh content hai jo Nikhil interview mein khud defend karega — reword/invent = woh
> apni-samajh nahi.)*

**This is the answer to "what exactly gets captured": NOT the teaching. HIS words.**
The teaching is reproducible — it can be generated again. What cannot be regenerated is how **he** put it
once he understood. That is what comes out of his mouth in an interview.

### The write path
1. **The gist is the MASTER and HE is its sole writer.** `mirror.mjs` only PULLS — its header:
   *"The gist stays the MASTER (captain's manual writes only)."* No script and no agent writes a capsule.
2. **Targeted update, never re-emit.** The whole capsule is never rewritten. Each patch names its field.
3. **Existing AUTHORED-PROSE is SACRED** (`weld` · `deep` · `mechanism` · `hook` · `why` · `traps` ·
   `threeWays` · `interviewLines` · `bolo`): *"existing sirf VERIFY (rewrite NAHI)."* His June prose is
   never edited. New prose is **layered below it** — Law 9, layering never replace.

### THE SAMJHAO BLOCK — his choice, Option A (20 Aug)
Appended **below** the untouched June content, inside the same `faultLines[i].deep` field:

```
———————————————————————————————
### SAMJHAO · <date> · pass 2

**MAIN ATKA KAHAN:**
<stuck-story, his words — "maine socha X … phir Y ne todha">

**AB MERI SAMAJH:**
<his Bolo — full, as long as it needs to be. This is the heart of the block.>

**MAINE KHUD CHALAYA:**
<the trace he ran by hand — numbered>

**2026 PATCH:** ⚠ NOT his words — verified fact
<the fact + source + date>

**INTERVIEW LINE v2:**
<English rep, only if it changed>
```

**Four deliberate choices in that format:**
1. **Stuck-story comes first.** The spec's own definition of `deep` demands it (*analogy + worked example +
   why-chain + stuck-story*) and **his June notes have none**. Six months cold, *"maine socha X phir Y"* is
   what rebuilds understanding. A bullet is not.
2. **The 2026 patch carries a warning mark.** Those are not his words. Slipping verified facts into a
   verbatim-faithful field **breaks the capture rule**. Separate, marked, sourced.
3. **`₹` never `Rs`, em-dash `—` never `-`.** FORGE_DESIGN §4 non-negotiable #1 is byte-for-byte verbatim
   *"special characters sameet"* — and it is recorded there as **his #1 complaint**.
4. **New doubts do NOT go in this block.** They go to `doubts[]`, which is already one of his two legal
   paste-writes.

### Where each piece of a samjhao lands
| # | What | Whose | Target |
|---|---|---|---|
| 1 | **His Bolo** — the axis in his own words, after understanding | his | `faultLines[i].deep` (appended) |
| 2 | **Stuck-story** | his | same block |
| 3 | **Worked trace** he ran by hand | his | same block |
| 4 | **New doubts** raised today, not already in the ledger | his | `doubts[]` |
| 5 | **2026 patch** — factual correction/addition | fact, marked | same block, flagged |
| 6 | **Interview line** if it changed | his + tightened | `interviewLines[]` |
| — | **The teaching prose itself** | mine | **nowhere.** Reproducible; and Claude may never author `deep` |

### The doubt quality bar (FORGE_SPEC, already locked)
**Q-fields:** ATOMIC (one confusion) · SUBJECT explicitly named (no dangling *ye/woh*) · **ANSWER-HIDDEN** ·
**RICH confusion-journey** (*maine-socha-X-phir-Y* — cold-Nikhil must recognise where he got stuck; atomic
means one confusion RICHLY elaborated, not terse) · no near-duplicate.
**A-fields:** complete standalone — mechanism + why, readable alone.

### THE ONE LAW — the cold-reader standard
> Every knowledge artifact must be reconstructable by the **cold-reader = future-Nikhil, 6–12 months later,
> with ZERO memory of this session.** Understanding it in the moment is NOT enough.

---

## §4 · THE BOLO PROTOCOL — his words, without the approval tax

**His ruling, 20 Aug:** *"bolo should be done by me only, i will send voice prompts for this and yes you
should tighten the language but doing it for everything will be mentally draining and time consuming."*

The tax has three sources, and only one of them is worth removing:

| | | Tax? |
|---|---|---|
| 1 | He produces the Bolo | **No — this IS the learning.** Retrieval practice is what makes it stick |
| 2 | Claude edits it | small |
| 3 | **He judges Claude's edit** | **this is the drain** |

### The four levers — all of them attack #3

**LEVER 1 — separate two kinds of editing, and only one is Claude's.**
- **Transcription hygiene** — voice fillers (*"matlab…", "haan toh…"*), false starts, repetition, run-ons,
  misheard words. This does not change his meaning. It is **typing, not editing.** Done silently, never
  submitted for approval.
- **Meaning-level rewording** — changing how he explains. **Claude does not do this at all.** The capture
  rule: *"reword/invent = woh apni-samajh nahi."*

**LEVER 2 — an unclear Bolo is a TEACHING signal, not an editing job.**
If the meaning is not clear, the correct move is **not** to fix it — it is to **ask one question** so he
says it better himself. One exchange instead of a rewrite-then-judge cycle. And it is learning, not tax.

**LEVER 3 — batch glance, which is already his own ruling.**
FORGE_SPEC was corrected on 3 Jul 2026 for exactly this reason (*"high approval-tax"*):
> **"GATE-1 capture 'Nikhil line-by-line approve' → BATCH glance ('go'/'yeh do fix'), per-line NAHI."**

So: **capture at every axis (immediately), review once per topic.** 36 review moments → 4.

**LEVER 4 — flag only what could not be resolved.**
Where the meaning genuinely could not be recovered, mark `⚠ CHECK` inline. He reads only the flagged
lines, not nine full blocks. Expect 2–3 per topic.

**Net: ~108 exchanges → 4 glances plus a few flagged lines.**

### Timing — capture and review are deliberately separated
- **Bolo is given per axis, immediately**, while it is hot. Deferring to topic close means the earlier axes
  are already forgotten — which is the disease itself.
- **Review and paste are batched** — his ruling: *"should be done at the end of session or completed topic,
  otherwise it is too much friction of doing after every axis."*

### Crash belt
Blocks live only in chat between capture and paste, and *"notes created 7 times"* is his still-open loop
from the previous session. So: **each block is also written to a working file in the session scratchpad as
it is produced.** No repo pollution, no owners-only violation, and a dead session does not lose his words.

---

## §5 · THE SCOPE — what "no stone uncovered" means as a count

| topic | axes | traps | doubts | bridges | interview lines | locked |
|---|---|---|---|---|---|---|
| tokenization | 9 | 11 | 26 | 4 | 9 | 2026-06-15 |
| embeddings | 9 | — | 35 | — | — | 2026-06-21 |
| inference | 9 | — | 36 | — | — | 2026-06-24 |
| context | 9 | — | 15 | — | — | 2026-06-28 |
| **total** | **36** | | **112** | | | |

*(Counts beyond tokenization's traps/bridges/lines are unmeasured — measure when that topic opens:
`node scripts/samjhao.mjs plan <concept> --json`. Never recall them from this table.)*

### DETAIL IS CANON, NOT PREFERENCE — FORGE_DESIGN §3.5
> *"Nikhil ka brain SKIM-learner NAHI hai — DEEP-understanding learner hai. Poori picture banane ke liye
> usko **saara text / poora detail** chahiye. Text KAAT dena = us picture ko maar dena. **Yeh
> non-negotiable hai.** PAR — ek saath PILED-UP text uska dimaag OVERWHELM karke shut kar deta."*

Resolution, with three options explicitly rejected:
> ✅ **"Saara content PRESENT ho, par kisi bhi pal attention ke saamne EK focused cheez ho, baaki
> REACHABLE."** — progressive disclosure · visual hierarchy · spatial organisation · interaction ·
> earned-depth.

**"COVERAGE not DENSITY"** means: COVERAGE = all content present and reachable, nothing skipped.
anti-DENSITY = it must not be visually piled at once. **"Density attack VISUAL clutter pe hai — content ki
maatra pe NAHI."**

**Therefore: cutting detail breaks canon. When he asks for "as detailed as possible," that is the rule
speaking, not a preference. The design problem is presentation, never volume.**

**His neuro-profile (FORGE_DESIGN §5, stated):** ADHD-PI · working memory **~4 chunks** · high
activation-energy · low overwhelm-threshold · **deep-text-need**.

### DEPTH IS ASYMMETRIC — allocate by the DOSSIER's role weights
`dressing-room/state/dossier_weights.json`: system_design **26.7%** · build **22.2%** ·
production_eval **20%** · fundamentals **17.8%** · behavioral **13.3%**. And `bucket_round_map` maps
`1-fundamentals` → **fundamentals + system_design**, so these four topics touch **44.5%** of the interview.

| axes | grade | depth target |
|---|---|---|
| **a · b · c · d** (what / why / mechanism / math) | RECALL | **reflex.** Cold and instant. DOSSIER: *"blank-stare = interview over. Lookup = fail."* |
| **e · f · g · h · i** (limits / tradeoffs / build decision / scale / three audiences) | JUDGEMENT | **maximum depth.** The 26.7% system-design round. Both research lanes independently found **failure modes are the differentiator**, not definitions |

*Note the interaction with §3.5: asymmetric depth governs how much TIME an axis gets, never whether its
content is cut. Nothing is skipped; the recall axes simply reach reflex sooner.*

### The shape of ONE axis (repeat for all 36)
1. where you are — `axis x of 9 · n baaki · topic i/4`
2. the question this axis answers — as a **frame**, never as a test
3. **open his own June `deep` for this axis first** — he has never actually seen it (§2, cause 1)
4. the teaching — weld + deep expanded into narrative, one idea at a time, all the way down
5. the picture (the capsule's own trace where it has one)
6. **his hand-work** — he does something and returns it
7. the traps that live on this axis
8. the doubts that attach here, answered **inside the content**, never as a quiz
9. the **2026 patch** for this axis (§7)
10. domination layer — the interview line (English) + the non-technical version
11. **his Bolo** (§4) → the SAMJHAO BLOCK (§3), written to the scratchpad file

### Standing rules that bind every session here
- **Never verbatim-read a note.** His Gaffer block: *"Never do verbatim reading during samjhao reviews."*
- One idea per turn, opened all the way down. **Dheema = deep, not long.**
- Hinglish; technical terms stay English.
- `learning-layer/HOW_HE_LEARNS.md` applies in full — especially #1, #12 and #17.
- **Do not underestimate his throughput.** He rejected a 60-turn estimate. Size turns to his pace.
- **Agree the scope in conversation first, then execute** (his rule, 20 Aug). Do not fire research,
  widgets or file writes on your own read of what he wants.

---

## §6 · THE RESEARCH RECORD — two independent lanes, 20 Aug

Both **Claude (this lane)** and **Gemini Deep Research (his lane)** were run on the same questions.
Per LAW T, Gemini's product is breadth/recall and nothing it says is believed without a TIER 0 check.

### CONVERGED — found independently by both. Treat as settled.
- **"Definitions are free now. The judgment is the part you're paying for."** These four topics are the
  **floor**: right wins nothing, wrong ends the loop.
- **Failure modes are the differentiator** — *"interviewers ask what can go wrong, because production
  engineers must anticipate failures before they hit users."*
- **Evaluation is the single biggest skill gap.** One concrete eval story is *"the single most impactful
  thing you can bring."*
- **Deployed > notebooks** — *"recruiters can spot a Jupyter-only portfolio in seconds."*
- **Do NOT study:** gradient descent, CNN architectures, classical ML, transformer-internals deep dives,
  BPE from scratch, Word2Vec/GloVe maths, beam search, RoPE derivations.
  *"75% of modern AI engineering interviews are about RAG, evaluation, and agentic systems."*
- **Eval tooling is two tools, not one** — a CI-gating framework (**DeepEval** or **RAGAS**) plus an
  observability/annotation platform (**Arize Phoenix**, LangSmith, or Braintrust).
- **LLM-as-judge must be calibrated to 85–90% agreement** with a human-annotated reference set.
- **Golden dataset: 50–200 cases, built from REAL failures**, not synthetic examples.

### GEMINI'S WINS — breadth this lane missed
KV cache formula + **GQA** (8:1 head sharing → cache 8× smaller) + **PagedAttention/vLLM** (padding waste
60–80% → <4%) + continuous batching · **Matryoshka Representation Learning** (3072-dim truncated to
512/256, >95% accuracy retained, ~6× cheaper — the 2026 default) · **multilingual token penalty**
(Telugu **3.5–7×**, Gujarati **4.4×**) · embedding matrix = **13–34% of params** in small models, and
vocabulary trimming of dead tokens · **speculative decoding** with acceptance rate α · **prompt caching** ·
**HyDE**, query expansion, cross-encoder reranking, asymmetric search intent · **MTEB blind trust is a
failure mode** → build a domain golden set · the **RAG Triad** · **Cohen's Kappa** · prompt injection via
retrieved documents defended by `<document>` sandboxing · **quadratic O(n²) attention** · the **BGV**
mechanics and the **8-vs-3-year ATS paradox** (§8).

### GEMINI'S ERRORS — TIER-0 FLAGS. Never teach these.
| Gemini said | Truth (Aug 2026) |
|---|---|
| judge model = *"GPT-4o or Claude 3.5 Sonnet"* | **Both 2024 models.** Frontier is the **Claude 5 family** (Fable 5, Opus 5, Sonnet 5), GPT-5.x, Gemini 3.x |
| *"Claude 3.5 Sonnet $3/$15, 200K"* as current high-tier | two generations stale |
| *"Gemini 1.5 Pro, 2M, $1.25/$5"* as current | stale — Gemini 3.1 Pro ≈ $2/$12 |
| *"GPT-4o uses cl100k_base (~100k)"* | **Wrong.** `cl100k_base` is GPT-4/3.5; GPT-4o uses **`o200k_base` (~200k)** |
| *"BLT published May 2026"* | BLT is **Dec 2024**; 2026 work is its follow-ons (Fast BLT, BLT-Diffusion) |
| India-remote comp *"$130–180k senior"* | **inflated.** Realistic: mid **$40–80k**, senior **$80–150k** |
| 12–24 mo trajectory *"$220–400k / ₹65L–1.5Cr"* | fantasy for a 6-YOE profile |
| *"₹20,000,000–25,000,000"* band | units error — that is ₹2–2.5 **crore** |

**Gemini's recurring failure mode: stale model names, and top-of-market numbers presented as expected
value. Tier-0 check both, every time.**

### A contradiction, resolved
Claude lane: *"NCR offers salary parity with better purchasing power than Bangalore."*
Gemini lane: *"NCR salaries are consistently 15–20% lower than Bangalore."*
**Both true** — nominal salary is lower in NCR; **real purchasing power is at parity** because cost of
living is lower. One speaks nominal, the other real.

---

## §7 · THE 2026 PATCH LIST — what each capsule is missing

Each patch is taught **on its own axis** and emitted in that axis's SAMJHAO BLOCK, flagged as fact (§3).
Never dump them all at once.

### TOKENIZATION
| axis | patch |
|---|---|
| a | **Current vocab sizes.** Llama 2 32,000 → **Llama 3/3.1 128,256** → GPT-4/3.5 `cl100k_base` ~100k → **GPT-4o `o200k_base` ~200k** → Gemma-3 / Gemini class ~256k. Vocabularies are **growing** |
| e | **Multilingual cost explosion** — Telugu 3.5–7×, Gujarati 4.4× more tokens for the same meaning |
| e | **Structured-output corruption** — subword tokenizers split JSON delimiters and brackets unpredictably. Fix: JSON mode / structured-output constraints |
| e | **Tokenizer-free is no longer "slow and expensive."** BLT (Meta, **Dec 2024**) matches Llama-3 8B BPE at comparable FLOPs and handles typos/code/low-resource better; T-FREE drops the vocabulary entirely (~85% smaller embedding table); MambaByte scales bytes without quadratic attention; Bolmo-7B matches or beats subword on code and character tasks. **The blocker now is drop-in compatibility, not cost** |
| f | **Embedding matrix = 13–34% of total params** in ≈8B models; vocabulary trimming cuts VRAM before quantization |
| h | **The capsule's cost math is stale** — re-derive from the CONTEXT pricing below |

### EMBEDDINGS — the biggest gap of the four
**Embedding drift** (upgrade the model and old vs new vectors are incomparable — re-embed and rebuild the
whole index) · **domain fit** (a general model misses domain jargon and retrieval **silently returns
near-misses**) · **exact-term blindness → hybrid search** (dense + keyword) · **"semantic similarity ≠
relevance"** · **dimension mismatch** on model swap · **Matryoshka (MRL)** — truncate 3072 → 512/256,
keep >95% accuracy, ~6× cheaper · **asymmetric search intent** → query expansion, **HyDE**, cross-encoder
reranking · **MTEB blind trust is a failure mode** → domain golden set · **the RAG Triad**
(context relevance · groundedness/faithfulness · answer relevancy).

### INFERENCE & SAMPLING
**KV cache** — absent from the capsule and listed in the DOSSIER as a **cold-recall probe**; without it
generation is O(n²), and it shifts the bottleneck from compute-bound to **memory-bound** · **GQA** (≈8:1
sharing, cache 8× smaller) · **PagedAttention / vLLM** (contiguous allocation wastes 60–80% to padding;
paging cuts it below 4%) · **continuous batching** (the answer to "batch 100 requests on one GPU") ·
**min-p sampling** (beats top-p at high temperature when diversity and correctness are both needed) ·
**dynamic/adaptive top-k** · **speculative decoding**, metric = **acceptance rate α** · **compounding
agent latency** (5 sequential ReAct calls × 2s = 10s; fix with streaming, parallel tool calls, small
routing models) · **OOM under dynamic load** (cap max sequence length, configure queue backpressure).

### CONTEXT WINDOW — the most stale of the four
**CONTEXT ROT** — Chroma tested **18 frontier models**; **every one** degrades, accuracy dropping
**30–50% well before the documented limit** · **advertised vs effective gap** — usable capacity ≈
**60–70%** of advertised, and the fall is a **cliff, not a slope** · **lost-in-the-middle has a MECHANISM:
RoPE long-term decay** — reduced dot-product similarity between distant token pairs lowers mid-context
attention, and softmax amplifies it. *(Naming RoPE is the senior signal; deriving its maths is the waste)*
· **current limits** — 13 models ship 1M+; range 128k → **10M** (Llama 4 Scout) · **long-context
surcharges** — GPT-5.5 **2× input** above 272K, Gemini 2.5 Pro $2.50/M above 200K, Claude Opus 4.6 /
Sonnet 4.6 **flat across the full 1M** · **current flagship pricing** — GPT-5.5 $5/$30 · Claude Opus 4.8
$5/$25 · Gemini 3.1 Pro $2/$12 · DeepSeek V4-Flash **$0.14/$0.28**; filling the same 1M window is
**$0.14 vs $10.00 — 71×** · **RAG vs long context** — neither won; RAG ≈ **1,250× cheaper per query**,
long context **34% more accurate** on single-fact lookup, and **the 2026 pattern is a routing layer
deciding per query** · **chunking** — longer units, keep **top 5–10**, rerank 50 → 3–5 before injection ·
**prompt caching** · **prompt injection via retrieved documents** → `<document>` sandboxing ·
**quadratic O(n²) attention** on unbounded conversation append.

---

## §8 · THE CAREER PICTURE — settled 20 Aug, so no session re-derives it

**His goal (binding):** get a job as an **AI Product Engineer or similar role. Sector and domain are
irrelevant.** Never pitch a domain bet. FinOps work is **project evidence**, not a sector commitment.

**Hard location constraint:** priority 1 **fully remote**; priority 2 **Delhi NCR**. Relocation is a last
resort with a real personal cost — never recommend it as the default.

**His standard, his words:** *"domination means to be absolutely ready for everything and every situation
at anytime."* No resume line may be written that he cannot defend under follow-up questioning.

### The gates, and the band each opens
| Gate | Band | What unlocks it |
|---|---|---|
| Today, as-is | **₹12–15L** | current resume, no shipped LLM app |
| Fundamentals answerable + working Python | ₹18–22L | **this order** + Python |
| **One shipped LLM app with an eval harness** | **₹20–28L** | live public API · eval harness (golden set + calibrated judge) · benchmark table · architecture diagram · green CI badge · resume rewritten around it |
| + cloud, agents, RAG at scale | ₹30–45L | deployment, one agent build, retrieval eval |

**End-state** (full syllabus + shipped app + eval + CI + cloud, ~4 yrs experience): global remote
**$40–80k** (₹34–68L) · India remote/hybrid **₹25–40L** · Delhi NCR onsite **₹20–35L**, with the **NCR
ceiling at ₹45–50L** liquid base — only Bangalore or global remote breaks it.
**₹20–30L is a realistic target, NOT a floor.** The floor without the work is ₹12–15L.

### Market facts worth keeping
- **~60% of 2026 AI openings are remote or hybrid.** Global remote roles *"pay global six figures but need
  shipped, production-grade projects."*
- **Delhi NCR is India's #2 AI hub** — 8,000+ open AI roles; Naukri JobSpeak Mar 2026 shows NCR AI/ML
  hiring **+44%**, ahead of Bengaluru and Hyderabad. GenAI/LLM specialists take a **40–70% premium**.
- Demand rising ~40% YoY against a talent pool growing 15–20%.
- **"AI Evaluation Engineer" / "LLM Quality Engineer" is a real Indian title**, ₹15–28L mid-level, and the
  most strategic entry door without a PhD — 12–18 months from there to AI PE.
- NCR targets: Adobe India (Noida), Samsung R&D, Echos (Gurgaon — LangGraph/RAG/agentic), Deutsche Telekom
  Digital Labs (Gurgaon — RAG/LLM), Policybazaar, Paytm, Info Edge, Microsoft IDC Noida.
- Portfolio signal, verbatim: *"a single well-documented RAG system with a live demo, a benchmark table,
  and an architecture diagram will consistently outperform a GitHub profile of ten half-finished
  notebooks."* And what they read for: *"what problem did you choose to solve and why, what data did you
  find or build, and **what did you not build and why**."*
- Red flag to avoid: *"treating OpenAI as a magic box rather than a networked dependency with failure
  modes, latency characteristics, and cost curves."* — which is exactly what §7's axes teach.

### Two structural risks that are NOT skill problems
1. **BGV.** Contractor income produces no PF, no Form 16, no relieving letter, and appears in Form 26AS
   under **194J** not 192. Indian HR can read this as unverified or as moonlighting. The evidence that
   does work: **bank statements showing inward remittance, ITR filings, Form 26AS, platform invoices/MSA**
   — disclosed **proactively in the first HR screen**. *(Not tax advice — confirm Section 44ADA treatment
   with a CA.)*
2. **The 8-vs-3-year paradox.** A 2018 degree makes ATS read 8 YOE while technical depth is ~3 YOE —
   filtered as overqualified at one level, rejected on depth at the other. Fix: split the resume into
   **Relevant Engineering Experience (2023–present)** and **Prior Domain Experience (2018–2022)**.
   Reverse-chronological only — the functional/skills-first format does not survive Indian ATS parsers.
   **Never hide dates; a gap triggers instant rejection.**

**OPEN ACTION, not yet done:** the resume's contract-work durations need correcting before any
application. Details and the resume itself live OUT of this repo at
`C:\Users\nikhi\CyborgArchive\resume\` — never copy them in; this repo is public.

**Amazon FBA (US) — his side business.** Not resume Experience: it is not engineering and it compounds the
moonlighting flag. Its real value is elsewhere: it supplies **real data he owns** (settlements, supplier
invoices, ad spend, returns, cross-border tax) for the portfolio project, which beats synthetic data on
the exact axis hiring managers read for; and it is genuine **behavioural-round** material on unit
economics and business judgment. Anonymise numbers if the repo is public; present it as the project's
origin, never as a second job.

---

## §9 · THE DESIGN LANE — his ruling, 20 Aug

**His words:** *"i do not use claude design anymore because it eats a lot of tokens so you need to do it
from onwards for foreever."*

**This resolves an open contradiction rather than creating one.** `FORGE_DESIGN.md` §5 says *"Claude-chat
visual SOLUTION prescribe NAHI karta"* — but that section already carries a **⚠ CAPTAIN'S CALL** flag
noting the widget lane (built inside Claude Code) contradicted it, and stating *"kaun-si lane kis pe raaj
karti hai — yeh uska ruling hai."* **This is that ruling.** And the transition was already half-done:
§7's 10 Aug code-truth pass records that the engine of record is *"repo ka apna generated `THE-FORGE.html`"*,
not a Claude-Design bundle.

### The new division
| Who | What |
|---|---|
| **Nikhil** | final authority — approve / reject / override + pace |
| **Claude (this lane)** | content fidelity · **and now the visual/UX layer** — generator code, information architecture, progressive disclosure, the multi-hat reasoning |
| ~~Claude Design~~ | **retired** |

**The MULTI-HAT mandate transfers with the job** — every design decision reasoned through five lenses and
their intersections: **neurologist** (ADHD-PI attention allocation, working memory ~4, activation energy,
overwhelm triggers) · **senior UI/UX** (information architecture, progressive disclosure, visual
hierarchy, zero friction) · **senior PM** (job-to-be-done: *"he wants to open it"* + *"full picture, zero
overwhelm"*) · **psychologist + psychiatrist** (motivation, friction, shame-spiral avoidance, dopamine).

**Honest limits, stated at handover:** generator code and the four non-negotiables are strong ground here;
the output can be verified by opening `THE-FORGE.html` in the browser pane and looking at it. **Pure
aesthetic iteration is weaker than a dedicated design model — competent, not exceptional.**

### THE FIRST JOB — the render fix (parked, NOT learning time)
`setup/build_forge_html.mjs` is **148 lines**. Two defects to close (§2):
1. `:99` — per-axis `deep` is inside `<details>`, collapsed by default, while the thin `weld` is always
   open. **Backwards for an ADHD-PI reader.**
2. `:99` — that markdown renders inside `<pre>`: raw monospace, no headings, no hierarchy. A wall of text,
   which is exactly what §3.5 forbids.

The four non-negotiables bind any fix: **TEXT VERBATIM** (byte-for-byte, `₹` not `Rs`, `—` not `-`) ·
**ADHD-PI brain as the central constraint** · **recall-before-reveal loop** · **COMPLETENESS** (every gist
content field present, byte-for-byte, user-reachable; carry-but-don't-render **is** a skip).

**Until this is fixed, every improvement to `deep` stays behind a click.** If it is never fixed, in two
months he will again say *"padhe, kuch yaad nahi aaya"* — and again be right.

---

## §10 · HOW A NEXT SESSION RUNS ONE AXIS

1. Read **§0** for position, **§1–§4** for the method and the notes law.
2. Read the live capsule — never this file — for content:
   `node scripts/samjhao.mjs plan <concept> --json`, and the axis's own `deep`.
3. **Show him his own June `deep` for that axis first.** He has almost certainly never seen it (§2).
4. Teach ONE axis at full depth using §5's eleven-step shape, with its §7 patch folded in.
5. Take his hand-work back before advancing. *"samajh nahi aaya"* is literal — stop, restart from zero.
6. Take his **Bolo** by voice (§4). Hygiene silently; never reword meaning; unclear → ask, don't fix;
   flag `⚠ CHECK` only where meaning could not be recovered.
7. Write the SAMJHAO BLOCK (§3) into the scratchpad working file as it is produced.
8. **At topic close (or session close):** render all blocks together, one batch glance, `go` or
   `yeh do fix` → he pastes into the gist → `node scripts/mirror.mjs`.
9. **Update §0.** That is the only handoff.

### Things that will trip a session up
- `samjhao.mjs open` may refuse on tokenization: an **abandoned** session (`tmsz5lscvqh`) exists from an
  18 Aug proof-run that wrote a guess in his name. A clean task id (`tmt0o6pvtls`) was created 20 Aug.
  **An agent may never write a guess or answer in his name** without `--his-words`.
- The organism is **switched off** by his order (20 Aug). RED state lines are expected. **Restart nothing.**
- **Breadth belongs to Gemini; judgement and the Tier-0 check belong to this lane.** Running both over the
  same question pays twice for one answer.
- **Do not start a new design or research thread inside a teaching session.** Name it, park it here, hand
  back the micro-question (HOW_HE_LEARNS #12 — one of the two rules that break him most).
