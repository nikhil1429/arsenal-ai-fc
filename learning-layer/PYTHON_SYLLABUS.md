# PYTHON_SYLLABUS.md — God-Tier Python Ramp (AI Product Engineer)
> **Build this → ship M1 → interview-grade Python.** Yeh `FINOPS_AI_CONCEPTS.md` ke dangling
> `PYTHON_SYLLABUS.md` ref ko resolve karta hai. Project files ka canonical Python plan — har naya thread isse padhe.
>
> **01 Aug 2026 sync:** do asli gaps band kiye. (1) **Classes/OOP tier ADDED — T0.5, T1 se PEHLE.** File mein
> classes ka ek bullet tak nahi tha, jabki T1 Pydantic *poora* class-based hai = dependency-break, gap nahi.
> **T1–T4 numbers jaanboojh ke NAHI badle** (GEMINI_LOOP §9/§11 unhe naam se reference karte) — isliye decimal
> T0.5, renumber nahi. Phase-A ~52h → ~57h. (2) **sprint.json ↔ §6 ka ordering conflict** record + resolve kiya
> (§6 ka ⚠️ box — durable fix live SHEET mein hai). Baaki file UNCHANGED.
>
> **05 Jul 2026 sync:** §0 depth-rule reconciled (light-RITUAL/heavy-REPS/god-tier-CORE) + CLOSE-PACKET pipeline
> wired (GEMINI_LOOP §11-13). Baaki file UNCHANGED. Yeh file = *kya* seekhna (tiers/resources); *kaise* chalega
> (per-subtopic packet + rep-engine + rhythm) = GEMINI_LOOP §11-13.
>
> **Altitude note:** Sprint board (`Nikhil_AI_Sprint_Plan.xlsx`) Python ko 4 motte rows mein rakhta hai
> (1-07 basics-start · 2-10 basics-finish · 2-11 FastAPI · 2-12 Pydantic). **Yeh file unhi rows ke ANDAR ka
> tier+resource breakdown hai.** Board = epic tracker; yeh = execution detail. Conflict zero.
>
> **Resource verification:** Dave Pydantic = exact URL+title+date confirmed. FastAPI/Instructor = official docs.
> mCoding async + Dave Claude-Code = Nikhil ne click-confirm kiya (links khule). Baaki Phase-B = trusted channel,
> exact video-ID click-verify pending (marked 🟡 neeche). Honest, padded nahi.
>
> **Status:** ✅ verified · 🟡 trusted-channel, ID click-verify pending · ⚠️ caveat

---

## 0. GROUND RULES (kyun yeh syllabus aisa hai)

- **Node DROPPED → Python = FULL backend, CRITICAL-PATH, no JS fallback.** Pehle Node tera shipping safety-net
  tha; ab M1-ship poori tarah Python-timing pe depend karta. Isi liye Python = biggest single rock.
- **JS→Python BRIDGE throughout.** Tu programming-zero nahi (MERN rusty). Video = Python *breadth*. **Claude =
  translator + Jirah + Bolo coach** — har session mein JS↔Python diff Claude samjhayega. Video Claude ka
  replacement nahi, support hai.
- **Method per tier = 5-phase + Bolo:** Samjhao → Dikhao → Saath karo → Akele karo → **Bolo** (bol ke phir likh
  ke — non-negotiable, yahi interview defense).
- **70/30 split:** 70% Claude Code, 30% tu — tera 30% = API calls, error handling, parsers, Pydantic schemas,
  async orchestration. Yahi defend karega interview mein. "Claude ne kiya tha" = failure.
- **Build-small-daily ladder:** har tier ek chhoti working cheez. Data hamesha tera (FinOps/Blinkit) — "hello
  world" kabhi nahi.
  > `calculator → CSV reader → FastAPI-hello → invoice-parser → Claude-call → mini extraction engine`
- **Pace = tera, milestone-gated.** Koi deadline nahi. Tier "done" = jab tu uska artifact bina dekhe likh sake
  **+ Bolo** kar sake. "Jaldi" Claude kabhi nahi bolega.
- **Python = LIGHT RITUAL · HEAVY REPS · GOD-TIER on CORE** (recurring "Python shallow?" confusion — SETTLED):
  "Light" = Python pe woh bhaari 9-axis Forge capsule (tokenization-style) KABHI nahi — Python ek *skill* hai
  (cycle-chalane jaisa), decay-prone *concept* nahi; skill reps se banti, spaced-recall-capsule se nahi.
  Par depth SHALLOW nahi: god-tier fluency = fluency-ladder (VAKYA→KRAMA→JAṬĀ→GHANA) × reps × build × time.
  **SELECTIVE:** dṛḍhabhūmi (automatic) SIRF core build-skills pe jo interview mein COLD likhega — Pydantic ·
  FastAPI · async · API+error-handling · parsers · data-manip — + 1 saal Outlier (AI-eval) work justify karega.
  Peripheral (skip-list §5: PyTorch, metaclasses, event-loop internals) = "look it up", drill NAHI. God-tier
  JAHAAN matter karta (har jagah = misallocation, reps galat rock pe). Ritual light, reps bhaari.
- **CLOSE-PACKET pipeline (kaise chalega — canonical = GEMINI_LOOP §11-13):** har Python subtopic-close pe Claude
  ek COMPLETE copy-paste packet AUTO-emit karta — 5 ladder-drills + Coach-review-prompt + Bolo-cue + NotebookLM
  quiz/audio-video prompts + close-sign. Nikhil sirf EXECUTE karta (prompt/drill khud nahi banata); reps se
  fluency-state 🔴→🟡→🟢 advance hoti (Gemini = volume, Nikhil = solve); log Claude auto-draft. FinOps-flavor =
  gradient (raw fundamentals varied/neutral OK; build-artifacts FinOps). Process-load Nikhil ke sar pe ZERO.

---

## 1. THE SHAPE (one line)

> **Phase A** (ship M1, ~57h, Sprint 1–2) → **Phase B** (fluency + interview-grade, ~55h directed, Sprint 3–6 + Phase-2)

Directed-study ≈ 112h. Sprint file ka **~125h** figure = iske upar hands-on build-practice. **~46h** (board ka
Phase-A slice) = "build-enough w/ Claude Code 70/30" — yeh syllabus usi slice ko tier-wise kholta hai.

---

## 2. PHASE A — SHIP M1 (~57h · Sprint 1–2 · all P0)

### T0 — Python Core, JS-bridged (~12h)
**Covers:** variables/types · lists vs JS-arrays · **dicts vs JS-objects** (sabse zyada use) · functions
(+default/keyword args) · loops (`range`, no `i++`) · f-strings · `None` vs null + truthiness · list
comprehension (light) · `import` / `json.loads`-`dumps`.

**JS→Python key diffs (yaad rakhne wale):**
| JS | Python |
|---|---|
| `let x = 5` / `const` | `x = 5` (no keyword; const = UPPERCASE convention only) |
| `arr = []` | `list = []` (mutable) · `tuple = ()` (immutable) |
| `obj.key` / `obj["key"]` | `d["key"]` **only** (no dot access) |
| `for(let i=0;i<n;i++)` | `for i in range(n)` (no `i++`) |
| `` `${x}` `` | `f"{x}"` |
| `null` / `undefined` | `None` |
| `===` | `==` (value) · `is` (identity) |
| `console.log` | `print` |
| `function`/`=>` | `def` / `lambda` |
| `{` `}` blocks + `;` | indentation = blocks, no `;` |

**Resource:** ✅ Dave Ebbelaar — *Python for AI & Agents · Full Beginner Course* (playlist)
`youtube.com/playlist?list=PL-Y17yukoyy0SupAJSPQYg_Lvre9Kt9EG`
**Build artifact:** invoice-line **calculator** — `"Aristo Eco — ₹81,500"` → subtotal → 18% GST → total.
**Interview/Bolo:** "Python idioms vs JS — dict access, no `i++`, truthiness, list comprehension."
**FinOps spot:** har file ki neenv; extraction script.

---

### T0.5 — Classes / OOP (~5h) · T1 ka HARD prerequisite
**Covers:** `class` definition · **`__init__`** · **`self`** (explicit first param) · instance attributes ·
**class attributes vs instance attributes** · methods (instance · `@classmethod` · `@staticmethod` light) ·
**inheritance** (`class Dog(Animal)`) · `super().__init__()` · `__repr__` (debug-print) · **kab class, kab
function** (decision rule).

**Depth = CORE, peripheral NAHI (§0 selective-fluency):** T1 Pydantic *poora* class-based hai — `class
Invoice(BaseModel)` ek class DEFINITION hai jo `BaseModel` se inherit karti; fields uske body mein, validators
uske andar methods. Yaani T0 se seedha T1 pe jaana literally impossible tha: T1 ki **pehli hi line** woh syntax
hai jo kabhi padhaayi nahi gayi. Isliye classes dṛḍhabhūmi (cold-likhne wali) list mein baithti hain —
skip-list §5 ki "look it up" cheez NAHI.

**JS→Python bridge:** tu classes *already* likh chuka hai — `class X {}`, `extends`, React ke class-components.
Mapping seedhi hai: `constructor()` → **`__init__()`** · `this.total` → **`self.total`** · `class Dog extends
Animal` → **`class Dog(Animal)`** · `super()` → `super().__init__()` · `new Dog("Rex")` → `Dog("Rex")` (`new`
keyword hai hi nahi). **Teen asli diff — yahi trip karayenge:** (1) **`self` EXPLICIT hai** — har method ka
pehla parameter tu khud likhta hai, JS ka implicit `this` nahi (side-effect: `this`-binding ka poora JS-dard
Python mein exist hi nahi karta); (2) **class-body mein likha `x = 5` = class attribute** — sab instances mein
SHARED; per-instance chahiye to `__init__` ke andar `self.x = x`. JS mein iska rozmarra equivalent nahi, aur
yeh #1 beginner trap hai (class-level pe mutable default `[]` = saare objects ek hi list share karenge);
(3) inheritance **parentheses** se aati hai, keyword se nahi — `(Animal)`, `extends Animal` nahi.

**Resource:** ✅ Dave Ebbelaar — *Python for AI & Agents · Full Beginner Course* — **wahi T0 wali playlist,
ch 61-66:** 61 Introduction to Classes (OOP) · 62 Creating Your First Class (`__init__`, `self`) · 63 Class
Attributes vs Instances · 64 Class Methods · 65 Class Inheritance · 66 When to Use Classes vs Functions.
`youtube.com/playlist?list=PL-Y17yukoyy0SupAJSPQYg_Lvre9Kt9EG`
*(playlist ✅ pehle se confirmed; 🟡 chapter-numbers captain ke brief se aaye — click-verify pending, padded nahi)*
**Build artifact:** **plain-Python `InvoiceLine`** (Pydantic se PEHLE — taaki T1 mein diff KHUD dikhe):
`__init__(vendor, amount)` + `gst()` (18%) + `total()` + `__repr__`; phir `RecurringInvoiceLine(InvoiceLine)`
inherit kar ke `months` add kar aur `total()` override kar. **Yehi class T1 mein `class Invoice(BaseModel)` ban
jayegi** — tab tu exactly dekh payega Pydantic ne MUFT mein kya diya (types, validation, `ValidationError`).
**Interview/Bolo:** "Pydantic model koi magic nahi — ek class hai jo `BaseModel` se inherit karti hai; `self`
explicit isliye ki Python 'explicit > implicit' chunta hai; class TAB jab **state + behaviour saath** rehna ho,
warna plain function — sirf-data ke liye class nahi, dataclass/Pydantic model."
**FinOps spot:** har typed extraction ka skeleton — `Invoice` · `LineItem` · `Vendor`. T0.5 unka DHAANCHA
banata hai, T1 us dhaanche pe validation chadhata hai.

---

### T1 — Pydantic v2 (~12h)
**Covers:** `BaseModel` · type hints · field validation · nested models · `Optional`/defaults · custom
validators · **structured output forcing** (LLM → typed JSON).
**JS→Python bridge:** **Pydantic = "Zod/TS-interface, but enforced at RUNTIME."** Tu TS jaanta hai — Pydantic
wahi shape-safety hai jo *actually* fail karti hai galat data pe (compile-time nahi, run-time).
**Resource:** ✅✅ Dave Ebbelaar — *Pydantic Crash Course (90 min)* `youtube.com/watch?v=PkQIREapb9o`
*(exact URL+title+date verified — type hints, validation, nested, structured-output-with-LLMs)*
**Build artifact:** `Invoice` model — vendor/amount/TDS/date typed; ek galat-data dict pe `ValidationError` raise karwa.
**Interview/Bolo:** *"AI proposes, code validates"* — Pydantic = woh validate layer. Free-text JSON nahi, typed.
**FinOps spot:** invoice → strict typed JSON. Reliable-output ka core tool.

---

### T2 — FastAPI Essentials (~16h)
**Covers:** routes (path operations) · `async def` endpoints · request/response models (Pydantic-wired) ·
**file upload** (invoice PDF) · **StreamingResponse / SSE** (word-by-word) · error responses · auto Swagger docs.
**JS→Python bridge:** Express → FastAPI. Routes ≈ Express routes; `res.json()` → `return model/dict`; Express
middleware → FastAPI **dependencies**; Express `async` → FastAPI `async def` (similar). SSE: Node ka manual
stream → FastAPI ka built-in `StreamingResponse`.
**Resource:** ✅ FastAPI **official docs** (User Guide) `fastapi.tiangolo.com/tutorial/`
*(doc > video — interactive, JS/Node equivalents ka reference deta hai)*
**Build artifact:** **FastAPI-hello** → file-upload endpoint → JSON return (no UI, Postman-tested).
**Interview/Bolo:** "Pydantic models = FastAPI ka request/response contract; SSE = StreamingResponse."
**FinOps spot:** M1 backend ki spine — upload → extraction endpoint.

---

### T3 — async Essentials (~6h)
**Covers:** `async`/`await` · `asyncio.gather` (parallel) · `httpx` (async HTTP) · `Semaphore` (concurrency cap).
**JS→Python bridge:** **Promises → coroutines.** `Promise.all` → `asyncio.gather`; `await` → `await` (almost
same!); `fetch` → `httpx`. Agar JS Promises aate hain, yeh turant click karega.
**Resource:** ✅ mCoding — *Intro to async Python · Web Crawler* `youtube.com/watch?v=ftmdDlwMwwQ` *(click-confirmed)*
**Build artifact:** 2 invoice-extraction calls **parallel** chalao via `gather` (sequential se fast).
**Interview/Bolo:** "Concurrent LLM calls — `gather` se N invoices ek saath, `Semaphore` se rate-limit respect."
**FinOps spot:** bulk extraction; concurrent Claude+GPT verification.

---

### T4-lite — anthropic SDK + Structured Output (~6h)
**Covers:** `anthropic` client setup · `messages` format · system/user prompts · **structured JSON output** ·
basic error handling · DEMO_MODE caching flag.
**Resource:** ✅ Dave Ebbelaar — *Code AI with Claude Code · Full Python Course* `youtube.com/watch?v=pGeYQPM92eA`
*(click-confirmed — streaming, memory, tool-use)* · ✅ **Instructor docs** `python.useinstructor.com`
*(Jason Liu = library creator; Pydantic→LLM-JSON gold standard)*
> **Layering principle:** pehle **raw `anthropic` SDK** manually (samajh aaye andar kya ho raha) → PHIR Instructor
> abstraction (clean structured output). Dono codebase mein, README WHY document kare. Replace nahi, layer.
**Build artifact:** **mini extraction engine** — invoice text → Claude call → Pydantic-typed JSON out.
**Interview/Bolo:** "Raw SDK pehle (control), Instructor baad mein (ergonomics) — layered, defend-able."
**FinOps spot:** extraction engine ka dil.

### 🏁 MILESTONE A
**M1 backend bana + KHUD defend kar sakta** — upload → extraction → typed JSON, Postman pe live.
*(Yeh apply-trigger nahi — apply = M1 *demo-able* = UI + eval dashboard = Sprint 4. Yeh backend-slice hai.)*

---

## 3. PHASE B — FLUENCY + INTERVIEW-GRADE (~55h directed · Sprint 3–6 + Phase-2)

### T3+ — async Depth (~9h)
`asyncio` patterns deeper · task groups · timeouts · cancellation · error-in-gather handling.
**SKIP:** event-loop internals (ceiling ke baahar).

### T4-full — openai SDK + Cost + Vector Clients (~14h)
`openai` SDK (multi-model verify) · **token counting + cost tracking** · `pgvector` Python client ·
`faiss` local client. **FinOps:** `api_logs` (tokens/latency/cost), Claude+GPT agree/disagree, RAG clients.

### T5 — pandas / numpy / eval (LIGHT) (~10h)
DataFrames basics · CSV/Excel read (SheetJS-equiv) · numpy arrays (embeddings ke liye) · eval metrics compute
(precision/recall/F1). **LIGHT** — data-science depth nahi, eval-dashboard ke liye bas-enough.

### T6 — pytest / logging / Docker (~10h)
`pytest` (assertion-based LLM output tests) · structured `logging` · basic `Dockerfile`/compose.
> Docker = DevOps infra, AI-skill nahi — completeness ke liye, deep nahi (deep = Phase-2 backlog).

### Interview-Polish (~12h)
**decorators** · **context managers** (`with`) · **comprehensions** (list/dict/set) · `*args`/`**kwargs` ·
**GIL** (kyun Python threading CPU-bound pe slow, async I/O-bound pe theek). Yeh Python-fluency ke "senior signal" hain.
> ⚠️ Gemini ne in topics pe ZERO resource diya — Phase-B mein hain, abhi empty. Jab aaye to anchor: Corey
> Schafer / ArjanCodes / mCoding (sab known-good) se per-topic pick.

---

## 4. RESOURCE TABLE (verified status — single glance)

| Tier | Resource | Channel/Author | URL | Status |
|---|---|---|---|---|
| T0 | Python for AI & Agents (playlist) | Dave Ebbelaar | `youtube.com/playlist?list=PL-Y17yukoyy0SupAJSPQYg_Lvre9Kt9EG` | ✅ channel + playlist confirmed |
| T0.5 | *same playlist* — **ch 61-66** (classes/OOP) | Dave Ebbelaar | `youtube.com/playlist?list=PL-Y17yukoyy0SupAJSPQYg_Lvre9Kt9EG` | ✅ playlist confirmed · 🟡 ch-numbers click-verify pending |
| T1 | Pydantic Crash Course (90m) | Dave Ebbelaar | `youtube.com/watch?v=PkQIREapb9o` | ✅✅ exact match verified |
| T2 | FastAPI Tutorial (docs) | Tiangolo | `fastapi.tiangolo.com/tutorial/` | ✅ official anchor |
| T3 | async Python · Web Crawler | mCoding | `youtube.com/watch?v=ftmdDlwMwwQ` | ✅ click-confirmed |
| T4 | Claude Code Full Python Course | Dave Ebbelaar | `youtube.com/watch?v=pGeYQPM92eA` | ✅ click-confirmed |
| T4 | Instructor (docs) | Jason Liu | `python.useinstructor.com` | ✅ official (creator) |
| B/T4 | pgvector tutorial (text) | DataCamp | `datacamp.com/tutorial/pgvector` | ⚠️ replaced flagged "Coder's Column" |
| B/RAG | Learn RAG From Scratch | freeCodeCamp (Lance Martin) | `youtube.com/watch?v=sVcwVQRHIc8` | ✅ trusted · ⚠️ LangChain-based (concepts only, code copy mat kar) |
| B/eval | Assertion-Based LLM Unit Tests | Dave Ebbelaar | `youtube.com/watch?v=bnvOk1fm0tw` | 🟡 ID click-verify pending |
| B/pytest | Marie Kondo Pytest Setup | ArjanCodes | `youtube.com/watch?v=jxqGsJEhiAg` | 🟡 ID click-verify pending |

**❌ DROPPED (flagged — unknown channels, search mein surface nahi hue):**
TipsCode (Python-for-JS 15-min · anyway too thin for T0) · Coder's Column (pgvector).

---

## 5. SKIP LIST (yeh pace protect karta hai — deliberately NAHI seekhna)
PyTorch / TensorFlow · from-scratch ML · Django · metaclasses / descriptors · asyncio event-loop internals.
> Reason: target = Applied/Product ladder, NOT ML-research. Yeh sab gehraai job ke baad, ya kabhi nahi.
> (Yeh = "look it up" list — inpe reps/fluency-drill NAHI, §0 selective-fluency.)

---

## 6. MAPPING (yeh syllabus kahan baithta hai)

**→ Sprint board rows:** T0–T1 ≈ 1-07 (basics-start; **T0.5 classes yahin baithta hai, T1 se pehle**) ·
T1 ≈ 2-12 (Pydantic) · T2 ≈ 2-11 (FastAPI) · T3/T4 thread through 2-10/2-11. Board = coarse epics; yeh = tier detail.

**→ FINOPS_AI_CONCEPTS.md (Bucket 5):** "Python / FastAPI / Pydantic / asyncio — [B] FULL backend from Day 1."
Yeh us line ka execution-plan hai.

**→ FinOps M1 build:** T0 core → **T0.5 classes** → T1 typed extraction → T2 upload+stream endpoint →
T3 concurrent calls → T4 Claude-call engine. Phase-A done = M1 backend live.

**→ Anthropic courses unlock:** API-Fundamentals + Tool-Use Colab pe Python pe chalte — T0-T2 inhe support karta.

> ⚠️ **CANON CONFLICT — ordering (recorded 01 Aug 2026 · RESOLVED).**
> `dressing-room/state/sprint.json` yeh order rakhta hai: **1-05 Anthropic API-Fundamentals → 1-06 Prompt
> Engineering → 1-07 Python basics (start)** — yaani courses PEHLE. Upar wali line uska ulta kehti hai: courses
> Colab pe, **Python mein** chalte, to Python pehle. Dono canon hain, dono ek doosre ko kaat rahe the.
> **RESOLUTION: T0 (+T0.5) Python basics PEHLE, phir Colab courses.** Wajah mechanical hai, preference nahi —
> course ka har cell Python hai; bina `dict` / f-string / function / `json.loads` ke tu code *padh* bhi nahi
> payega, sirf run-button dabayega = zero rep, course "done" dikhega aur seekha kuch nahi hoga. Sequence tod ke
> chalna hi ho to sirf reading/theory-slice chalao — koi bhi *interactive* Colab cell Python maangta hai.
> **Durable fix is file mein NAHI, live SHEET mein hai.** `sprint.json` ka `progress` block har sync pe
> `scripts/sprintsync.mjs` dwaara captain ke LIVE Google Sheet (Sprint Board ka CSV export) se **overwrite** hota
> hai — JSON ya markdown mein kuch bhi likho, agle sync pe mit jayega. Aur `next_up` **sheet ki ROW ORDER** se
> banta hai, ID-sort se nahi (`data.slice(curIdx + 1)`).
> **Captain ka one-liner — sheet mein yeh karna hai:** *Sprint Board tab mein poori row `1-07 Python basics
> (start)` uthaa ke `1-05 Anthropic: API Fundamentals` ke UPAR drop kar do — ID text mat badalna* (order
> row-position se aata hai, ID se nahi; IDs ko doosri files reference karti hain).
> *(Yeh file ya koi bhi doc `sprint.json` ko nahi likhta — uske `progress` ka single writer `sprintsync.mjs` hai.)*

---

## 7. DECISION LOG
- **Node FULLY DROPPED (20 Jun):** M1 backend = Python/FastAPI Day-1. Trade-off: Node existing-strength tha →
  shipping safety-net gaya. M1-ship ab Python-timing pe depend. Mitigant: side-by-side Python shuru + verified
  resources ready. *Accepted, milestone-gated — slip = fine, failure nahi.*
- **T0 anchor = Dave "Python for AI & Agents"** (not TipsCode flagged, not generic Corey total-beginner pace) —
  Python-for-AI focus + same instructor as T1/T4 = zero context-switch.
- **Layering within-Python:** raw `anthropic`/`openai` SDK + manual RAG → phir Instructor/LlamaIndex abstraction.
  (Pehle JS→Python migration story thi; Node-skip ke baad woh dead.)
- **Classes/OOP tier ADDED = T0.5 (01 Aug):** file mein classes ka ek `Covers:` bullet tak nahi tha — na tier,
  na zikr. Yeh gap nahi, **dependency-break** tha: T1 Pydantic *poora* class-based hai (`class Invoice(BaseModel)`
  = class definition + inheritance), yaani T0 → T1 jump literally impossible tha; T1 ki pehli hi line woh syntax
  hoti jo kabhi padhaayi nahi gayi. Isliye T1 se PEHLE daala. **Renumber jaanboojh ke NAHI kiya** — T1→T2 shift
  karne se GEMINI_LOOP §9 (research-prompt) aur §11 (tier-close) dono ke tier-references toot jaate → decimal
  tier `T0.5`. Layering, replace nahi. Anchor pehle se maujood tha: wahi T0 playlist, ch 61-66 (naya resource
  hunt zero). Depth = CORE/dṛḍhabhūmi (§0), skip-list nahi — kyunki yeh interview mein COLD likhna padega
  (har Pydantic model ek class hai). Cost: Phase-A ~52h → ~57h, directed ≈107h → ≈112h.
  *Accepted — yeh 5h T1 ke 12h ko bachate hain, warna T1 aadha syntax-debugging ban jaata.*
- **Ordering conflict settled — Python T0 pehle, phir Anthropic Colab courses (01 Aug):** `sprint.json`
  (1-05/1-06 courses → 1-07 Python) aur is file ka §6 ("courses Colab pe Python pe chalte") aapas mein takra rahe
  the; dono canon, isliye chup rehna = har thread mein dobara bahes. Resolution + wajah + captain ka exact
  sheet-fix = §6 ka ⚠️ box. Yahaan sirf record: **durable fix SHEET mein hai** — `sprint.json` ka `progress`
  block `scripts/sprintsync.mjs` har sync pe live-sheet se overwrite karta hai, to JSON/markdown mein likha
  koi bhi order temporary patch hai, fix nahi. (sprint.json is task mein CHHUA NAHI gaya — single-writer law.)
- **Depth-rule reconciled (05 Jul):** "Python = tool, light touch" line → "light RITUAL / heavy REPS / god-tier
  CORE" (§0). Root cause: "light touch" ko "shallow" padha jaa raha tha (recurring). Light = no Forge-capsule
  ritual; depth = ladder × reps × build, selective on core. CLOSE-PACKET pipeline (GEMINI_LOOP §11-13) = kaise chalega.

---

**ॐ RADHA RANI KI KRIPA SE 🙏🏽**
