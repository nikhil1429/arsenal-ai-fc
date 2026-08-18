# LEARNING_LAYER_MAP.md — the learning layer, end to end

> **Kya hai yeh file.** Ek **MAP + INDEX**, canon nahi. Yeh kisi rule ka naya ghar nahi hai —
> yeh sirf batati hai **kaunsa rule kis file mein rehta hai**, kaun kis pe jeet-ta hai, kaun sa
> code kis file ko likhta hai, aur ek session actually kaise chalta hai. Agar yeh file aur koi
> canon file alag baat karein, **canon jeet-ti hai** — yeh file galat hai, use theek karo.
>
> **Kyun bani.** `CLAUDE.md` (jo Claude Code har session mein padhta hai) mein learning layer ka
> **ek shabd bhi nahi hai** — na `/forge`, na `/learn`, na `PROJECT_OS.md`, na `FORGE_SPEC.md`,
> na HOW_HE_LEARNS. Hooks pacer + teaching-contract inject karte hain, par "yeh layer hai kya"
> ka koi naksha kahin nahi tha. Yeh woh gap bharti hai.
>
> Verified: **4 Aug 2026**, sab kuch `nikhil1429/arsenal-ai-fc@main` se raw-read karke.
> Jo bhi claim yahan hai, uska source named hai. Jahan mujhe nahi pata, wahan likha hai "pata nahi".
>
> **FACT-CHECK PASS — 4 Aug 2026, isi repo ke against, section-by-section.**
> **276 claims verify hue, 43 galat ya purane nikle** (~86% accurate). Sab theek kar diye gaye.
> Sabse bade teen: (1) §1 ka quoted "Conflict rule" one-liner `PROJECT_OS.md` mein **hai hi nahi** —
> conflict clauses per-section bikhri hain, aur `OPS_STATE` ka naam us file mein kabhi nahi aata;
> (2) file count **21 nahi, 24**; (3) Gate-2 ke flagged doubts **16 nahi, 17**.
> Us pass ke baad usi din ka repair bhi land hua, toh HONEST LEDGER ke item **1 aur 3 ab CLOSED** hain
> aur item **2 badal chuka hai** (Gate 2 ab code mein hai aur chal chuka hai).
> **Yeh file phir bhi canon nahi hai.** Canon se takraye to canon jeet-ti — aur tab yeh file galat hai.
>
> **STALE-PROSE PASS — 10 Aug 2026 (uska order: "a lot of .md files content is old and stale, we need
> to correct it as per the current code").** Poori file line-by-line LIVE CODE ke against padhi gayi —
> doosri doc se kabhi nahi, sirf script padh ke / command chala ke / state JSON khol ke. Jo galat mila
> woh **jagah pe theek kiya gaya, scar ke saath** (`(corrected 10 Aug 2026: …)` — purani baat mit-ti
> nahi, dikhti hai). Sabse mehnge chaar: (1) gitignore-list — "ab ignored sirf `oura_*`" **jhoot** tha,
> aaj bhi darjanon state files ignored hain; (2) `THE-FORGE.html` "deep/viz render nahi karta" —
> **karta hai**, aur gist ko live fetch bhi karta hai (9 Aug ka E6 rebuild); (3) teaching-contract ke
> "5 seeded rules" — **12** hain, aur drift ki asli lane `flag` hai, `hit` nahi; (4) §13 ka "brief
> hippocampus ko chhoo-ti hi nahi" — **chhoo-ti hai**. **Sabak wahi jo CLAUDE.md ke scars kehte hain:
> prose mein likhi ginti agli run pe sad jaati hai — is file ka har number ab apne command ke saath
> chalta hai.**

---

## 0. EK LINE MEIN

Learning layer = **ek method (THE FORGE) + ek notes-format (capsule) + ek machine (Claude Code
hooks + skills + scripts) jo method ko prose se nikaal ke STATE banati hai**, taaki 40-turn
session ke baad bhi method drown na ho. *(18 Aug 2026 se machine ke peeche EK MIND hai — THE SITTING
BRAIN, `scripts/sitting.mjs`: voice ho ya text, wahi session, wahi pacer, wahi judge; §8 ka head note.)*

Iske do peer hain, teenon alag rehte hain:

| layer | sawaal jiska jawab deta hai | canonical file |
|---|---|---|
| **LEARNING EXECUTION LAYER** | kya seekhna cold ho raha, kitna deep, kaise test | `PROJECT_OS.md` §LEARNING EXECUTION LAYER |
| **OUTWORK EXECUTION LAYER** | aaya ki nahi · time kahan gaya · ship hua | `EXECUTION_FINAL_Tier2_Metamorphosis.md` + `Tier-2_Accountability_Rig...md` |
| **CYBORG BRAIN** | memory/voice/relay (thalamus·cortex·dugout·hippocampus) | `CYBORG_BRAIN.md` (BUILD SPEC / design pass) · built-body reference = `ORGANISM_ANATOMY.md` — *(corrected 18 Aug 2026, OVERHAUL Block 1: dono ab **`docs/archive/`** mein hain, repo root pe nahi — records, work-orders nahi)* · live status = **`node scripts/state.mjs`** (ek line; `OPS_STATE.md` ab sirf us command ka pointer hai) |

Dono execution layer **merge nahi** hue — **weld** hue. Teen seam (`PROJECT_OS.md` §ONE ORGANISM):
(1) KICKOFF dono se pull · (2) BOLO → GRADER · (3) EVENING AUDIT dono padhe.

---

## 1. PRECEDENCE — kaun kis pe jeet-ta hai (conflict aaye to yeh)

```
PROJECT_OS.md                 ← THE METHOD, 9 axes, hard rules, syllabus, system rules
  ├─ FORGE_SPEC.md            ← capsule SCHEMA + doubt QUALITY-BAR pe FINAL (OS isi ko point karta)
  ├─ FORGE_DESIGN.md          ← VISUAL DESIGN pe FINAL (OS ka DESIGN SYSTEM section isse haarta)
  ├─ GEMINI_LOOP.md           ← Python loop/rhythm/rep-engine pe detail-authority
  ├─ GEMINI_RIG_SETUP.md      ← Gemini rig ke setup + paste-prompts ka PROMPT-HOME
  └─ OPPONENT_SCOUT.md        ← THE DOSSIER: probe-bank + rubric-weights (test-set)

OPS_STATE.md (repo root)      ← ARSENAL ka LIVE state (kya built/green/pending). Method pe authority NAHI.
HOW_HE_LEARNS.md              ← EVIDENCE (forensic record). Canon se takraye to CANON jeet-ti — par yeh
                                 batati hai canon ko kaise chalao taaki kaam kare.
.claude/skills/*/SKILL.md     ← RENDER of canon, summary nahi. Canon se takraye to canon jeet-ti,
                                 aur Claude ko yeh **bol ke** batana hai ki takrav hai.
LEARNING_LAYER_MAP.md (yeh)   ← sabse neeche. Kisi cheez pe authority nahi.
```

**Verified 4 Aug 2026:** `PROJECT_OS.md` mein aisi koi EK-LINE "conflict rule" hai hi nahi — conflict
clauses **per-section bikhri** hui hain: `:9` (design → FORGE_DESIGN jeet-ti) · `:43` (loop/rhythm →
GEMINI_LOOP) · `:121` (DESIGN SYSTEM → FORGE_DESIGN) · `:131` (PYTHON TRACK → OS) · `:138` (OUTWORK → OS)
· (Kickoff/Full-Time → OUTWORK) · (LOGBOOK → SEASON). *(9 Aug: in do ke line-numbers hata diye —
dono refs ek hafte mein do baar drift hue; section-naam grep karo.)* Aur **`OPS_STATE` ka naam PROJECT_OS mein kahin nahi
aata** (grep = 0) — "Arsenal pe OPS_STATE = live truth" OPS_STATE ka apna claim hai
(`grep -n "thread-agnostic anchor" docs/archive/OPS_STATE_2026-08-18.md` — *18 Aug 2026 se yeh line archive
copy mein hai; root `OPS_STATE.md` ab pointer hai, neeche ka scar padho*), PROJECT_OS ka nahi. Upar ka tree
sahi hai; woh quoted one-liner galat tha.
*(re-verified 10 Aug 2026, aur mool baat aaj bhi khadi hai: `grep -c "OPS_STATE" learning-layer/PROJECT_OS.md`
= **0** — us din se aaj tak zero, mahino ke edits ke baawajood. Conflict-clauses abhi bhi per-section
bikhri hui hain aur section-naam se hi milti hain, jaisa 9 Aug ka note kehta hai
(`grep -n "Conflict = " learning-layer/PROJECT_OS.md` → DESIGN SYSTEM · PYTHON TRACK · OUTWORK).*
*Do chhote fix: (1) `OPS_STATE.md:2` ek line-number citation tha aur is repo mein woh sadta hai — grep
laga diya; (2) `"live truth"` un shabdon mein OPS_STATE mein hai hi nahi — woh paraphrase hai, quote nahi
(`grep -n "live truth" OPS_STATE.md` = zero). Uski apni line kehti hai "THE thread-agnostic anchor …
reads THIS ONE file first and knows everything" — **aur khud us line pe 10 Aug 2026 ko warning chipak
chuki hai ki "knows everything" ab sach nahi.** Yaani jo daawa yahan quote hota tha, woh apne ghar mein
hi downgrade ho chuka hai. Is map ki §1 ranking phir bhi wahi rehti: OPS_STATE method pe authority
NAHI hai, aur ab woh live-state pe bhi apne aap ko poora nahi bolta.)*
*(corrected 18 Aug 2026, OVERHAUL Block 1 §13: **`OPS_STATE.md` ab ek 1.7 KB POINTER hai** — uska poora
purana body verbatim `docs/archive/OPS_STATE_2026-08-18.md` pe hai (layering). Isliye upar ke dono grep
ab us archive file pe chalte hain, root file pe nahi: `grep -n "thread-agnostic anchor" docs/archive/OPS_STATE_2026-08-18.md`.
Live state ka ghar ab **`node scripts/state.mjs`** hai — ek deterministic line, har SessionStart brief
ki line 1. §1 ki ranking waisi hi: OPS_STATE method pe authority NAHI, aur ab woh live-state bhi khud
nahi bolta — command bolta hai.)*

---

## 2. FILE MAP — `learning-layer/` ke 24 files (23 + yeh map khud), ek-ek line

*(verified 10 Aug 2026 — 24 abhi bhi sahi hai: `git ls-files learning-layer/ | wc -l` → 24, aur
`ls -1 learning-layer/ | wc -l` → 24 bhi, matlab koi untracked file bhi nahi padi hai. **Par ginti
LIVE karo, is line se kabhi nahi** — ek naya doc add hote hi yeh number rot ho jaayega, theek waise
jaise §8.2 ka skills-count do baar ho chuka hai.)*

Raw base: `https://raw.githubusercontent.com/nikhil1429/arsenal-ai-fc/main/learning-layer/`
(repo mein sirf GIST pe `web_fetch` BLOCKED likha hai — raw.githubusercontent.com wala reject repo se verify nahi hota, so isse claim ki tarah mat likho. `curl -s` use karo. Claude Code mein seedha `Read` bhi chalega.)

**CORE — inke bina learning session nahi chalti**

| file | kis cheez ka MALIK hai |
|---|---|
| `PROJECT_OS.md` (v3.13, 08 Jul 2026 — **version line STALE, neeche padho**) | THE METHOD 0-11 · 9-axis daraar-map · HARD RULES · STYLE · syllabus · SYSTEM RULES · VISUALIZATION CONTRACT · THE FORGE · dono execution layer. **Ek hi source of truth for HOW we work.** |
| `FORGE_SPEC.md` | capsule JSON schema (exact) · store + write-path · COLD-READER STANDARD · Gate 1 + Gate 2 · engine adapter · controller-v0 reserved fields |
| `HOW_HE_LEARNS.md` (31 Jul, ruling 1 Aug) | 21 forensic findings + THE COLD-START CARD (17 rules, hook isko splice karta) + NEVER-DO (8) + visualization ruling |
| `FORGE_DESIGN.md` (v2, 30 Jun) | "Cold steel, warm core" design language · 4 non-negotiables · division of labour · completeness verification |

*(corrected 10 Aug 2026 — **`PROJECT_OS.md` ka "v3.13" is table mein ab bharosemand nahi.** Us file ka
apna header line abhi bhi `v3.13, 08 Jul 2026` bolta hai, par `OS_CHANGELOG.md` ki SABSE NAYI entry
**v3.14 (05 Aug 2026) — AUDIT #107, THE LEARNING-LAYER WIRING REPAIR** hai. Yaani OS aage badh chuka
aur uska version-line peechhe reh gaya. Version-line badalna HIS call hai, isliye yahan sirf naam ke
saath scar chipka hai. **Live version hamesha changelog se:**
`grep -n "^# v3\." learning-layer/OS_CHANGELOG.md | head -1`. Evidence: `head -1 learning-layer/PROJECT_OS.md`
vs usi grep ka pehla hit. Baaki teen versions RE-VERIFIED aur SAHI: GEMINI_LOOP v2.4 · GEMINI_RIG_SETUP
v2.3 · FORGE_DESIGN v2 — teenon ke apne header lines se, `head -3 learning-layer/<file>`.)*

**PYTHON TRACK — foundations se ALAG, mix mat karo**

| file | malik |
|---|---|
| `GEMINI_LOOP.md` (v2.4) | hard seam (Claude vs Gemini) · 6-beat day-shape · CLOSE-PACKET (§11) · rep-engine + 🔴🟡🟢 fluency-states (§12) · rhythm + FLOOR (§13) · BOLO-policy gradient (§11.0) |
| `GEMINI_RIG_SETUP.md` (v2.3) | 9-step rig setup + **saare paste-prompts ka canonical ghar** (Master Brief · Coach Gem · Examiner Gem · Colab · NotebookLM) |
| `PYTHON_SYLLABUS.md` (01 Aug sync) | T0 → T0.5 classes/OOP → T1 Pydantic → T2 FastAPI → T3 async → T4-lite SDK · Phase B · resource table · **SKIP LIST** |
| `God-Tier_Gemini_Workflow_for_Learning_Python.md` | research base: struggle-first, cognitive-debt, Gem+Colab core |

**TEST-SET + TARGET**

| file | malik |
|---|---|
| `OPPONENT_SCOUT.md` | **THE DOSSIER** — real interview ka naksha: rubric time-weights (§1) · probe-bank RECALL/RECONSTRUCT/DEFEND/NOVEL/NEGATIVE-SPACE (§4) · system-design + project-defense rounds (§5) · red-flags (§7) · honest verdict (§8) |
| `AI_PE_ROADMAP.md` | 5 buckets ka role skill-map (March, June-reconfirmed) + "ABHI NAHI" deferred list |
| `FINOPS_AI_CONCEPTS.md` | FinOps build se kaunse AI concepts aayenge (bucket-wise) + honest downgrades |
| `FINOPS_MODULE3_PROCUREMENT_INTEL.md` | M3 procurement spec — Akshay ke jawab, two-pass allocation, FTL, where-AI-does-NOT-help |

**OUTWORK (peer layer — yahan sirf pointer ke liye)**
`EXECUTION_FINAL_Tier2_Metamorphosis.md` · `Tier-2_Accountability_Rig_on_Windows__A_Max_5x_Implementation_Guide.md` · `DAILY_CADENCE.md` (Kickoff · Ground pe · Full-Time; WON-DAY = 5 non-negotiables; KAL→KICKOFF weld)

**META / AUDIT (padho jab "system kyun aisa hai" poochha jaaye)**
`SYSTEM_METACOGNITION.md` (Pass-1 diagnosis) · `SYSTEM_BLUEPRINT.md` (Pass-2 repair-blueprint, 9 open forks) · `SYSTEM_FOUNDATION.md` (dono ka verbatim merge) · `THE_ORGANISM.md` (vision draft) · `OS_CHANGELOG.md` (v3.4→**v3.14** — *corrected 10 Aug 2026: yahan "v3.4→v3.13" likha tha; newest entry ab v3.14, 05 Aug 2026. Range likhna hi rot hai — padho live: `grep -n "^# v3\." learning-layer/OS_CHANGELOG.md | head -1`*) · `About.md` (pace rules — **koi countdown nahi chalta**) · `FORGE_DEEP_RENDER_BRIEF.md` (Design handoff) · `Nikhil_AI_Sprint_Plan.xlsx`

---

## 3. THE METHOD — 12 steps (0-11), har concept, isi order mein

Source: `PROJECT_OS.md` §THE METHOD (steps 0-11). Har teaching message ek line se khulti hai —
`STEP n/11 · NAME · axis <x>` — **par yeh line PROJECT_OS mein NAHI hai**, woh
`.claude/skills/forge/SKILL.md` ki hai; cite wahin. Step skip karna allowed hai (time-box / RED day);
**chupke se** skip karna nahi.

| # | naam | kya hota hai |
|---|---|---|
| 0 | **TIME-BOX** | core concept ≈ max 1 din. Budget khatam → bache axes **DEFER** (`axis <x> defer` + cracked-log). *Deferred ≠ dropped.* Pace kabhi nahi kat-ti, correctness kabhi nahi. |
| 1 | **DARAAR-MAP** | saare 9 axes upfront dikhao = **visible finish line** (ADHD-PI accommodation, decoration nahi) |
| 2 | **PEHLE-GUESS** | teaching se PEHLE 2-3 axis Qs cold. Galat chalega (generation effect + pre-learning calibration point). Yeh **reps** hain — confidence `guessed` (jab tak woh khud kuch aur na bole). |
| 3 | **SAMJHAO** | analogy pehle, zero assumed knowledge, ground-up, business + interview framing. **DEPTH FLOOR** (`forge/SKILL.md`, 4 Aug 2026): har axis pe thread mein chaaron hone chahiye — ANALOGY (rozmarra/physical, kabhi geometric nahi) · WORKED EXAMPLE (asli numbers, uske apne data pe, **haath se chalwaya**) · WHY-CHAIN (yeh kyun, obvious alternative kyun nahi — yahi chupke se gayab hota hai) · STUCK-STORY (*maine-socha-X-phir-Y*, **uske shabd, jab ho tab**). Kyunki `deep` layer LOCK pe **isi thread se recover** hoti hai — thread mein nahi bana to capsule ka `deep` patla nikal-ta hai. |
| **4** | **DIKHAO** | concrete example **+ concept ka WIDGET** (§4 Visualization Contract — poore clauses wahan). Widget time-box 45-60 min: cross ho to **widget** ka scope kato, concept ka kabhi nahi. **Pehle registry dekho — `node scripts/widget.mjs list`** (coverage HAMESHA us command se, kabhi is line se nahi — 7 Aug 2026 tak yahan "0 of 4" likha tha jab live registry 1/4 bol chuki thi; ginti prose mein likhte hi agle `register` pe rot ho jaati hai). |
| 5 | **SAATH KARO** | saath mein work through — widget pe ya kaagaz pe |
| 6 | **AKELE KARO** | woh akela kare, galtiyan kare. Widget ka Chala-mode yahan. |
| 7 | **BOLO** | **pehle BOL ke** (voice note/zor se), PHIR transcript. Rep = awaaz, delivery = text. **NON-NEGOTIABLE** — yahi interview defense hai. |
| 8 | **CALIBRATE** | Jirah se pehle **per-axis** confidence self-rate. predicted-vs-actual gap = unknown-unknown detector → capsule ke `calibration` field mein |
| 9 | **JIRAH** | Claude = **skeptical interviewer**. Per axis: ek sharp Q + trap + "tera take?" + "scratch se reinvent kar". Held = green · cracked = re-weld NOW ya cracked-log. *"Look it up karunga, reasoning yeh hai"* = acceptable hold. **Status JIRAH se aata, self-rating se KABHI nahi.** |
| 10 | **LOCK** | us EK capsule ka `<id>.json` + widget ka self-contained `.html` + poster → library. **GATE 1 + GATE 2** (§6). |
| 11 | **RE-JIRAH** | ~3 din / ~2 hafte / ~6 hafte (`forge_profile.json: rejirah_intervals_days [3,14,42]`). Day-3 ka pehla move = widget Chala-mode, **cold**. |

### THE 9 AXES (daraar-map)

`a` kya hai + analogy · `b` kyun / against-what (+ need ko scratch se reinvent) · `c` mechanism — **NAAM do** ("lookup, not a formula") · `d` math + value RANGE + high/low ka MATLAB · `e` limits / kab NAHI / failure modes · `f` tradeoffs X-vs-Y + kab kaunsa · `g` FinOps build — exact spot + ek DEFEND-karne-laayak decision · `h` scale / cost / ek prod gotcha · `i` SAMJHAO 3 WAYS — CEO / junior / skeptical-senior.

(`dressing-room/state/concepts.json` → `axes` mein in 9 axes ke SHORT-LABELS canon hain — alag, chhote strings: a `kya+analogy` · b `kyun/first-principles` · c `mechanism` · d `math+range` · e `limits/failure-modes` · f `tradeoffs` · g `FinOps-spot` · h `scale/cost` · i `3-ways`. `learning_state.mjs` inhi labels ko padhta hai.)

Canon ke paas theek **DO** numbered law hain. (Pehle yahan teen numbered the — teesra law nahi hai,
alag rule hai; ab woh un-numbered hai.)

1. **Sirf CHAAR question-moments exist karte hain by design:** Pehle-Guess (2) · widget guess-gates (4) · **EK** sharp check-question (steps 3-6) · Jirah (9). Iske alawa kuch bhi = quiz-dump, canon mana karta hai.
2. **Steps 3-6 ke dauraan ek waqt pe max EK sharp check-question** — aur woh **abhi-jo-padhaya** usko check kare, kabhi kuch un-taught nahi. Pacer doosre pe hard-stop karta hai.

**Plus (alag rule, law nahi):** har teaching pass ke baad sirf **"samajh aaya — haan ya nahi?"** aur **RUKO**. "Nahi" → wahi idea doosre tareeke se, aage mat badho, probe mat karo.

---

## 4. VISUALIZATION CONTRACT (`PROJECT_OS.md` §VISUALIZATION CONTRACT)

**Har concept ka EK widget; widget HI lesson hai, text side mein.** Yeh 1 Aug 2026 ko captain ne
explicitly re-confirm kiya — neeche §11 mein poora ruling.

Clauses: story hook = business cliffhanger (definition nahi) · **stepper only, NO autoplay**, counter
"3/9" visible, mechanism ka working VISIBLE (interactivity ke peeche chhupa nahi) · spotlight = ek step
= ek highlight, baaki dim, caption ek line · **load budget max ~6 objects ek waqt visible, baaki tap-to-expand; ek viewport, zero scroll** ·
history trail (har transformation ka breadcrumb) · 2-3 **guess-gates** · trap cards (misconception
pre-bunk) · **Tod button** (famous failure khud todna) · **Chala mode** (Nikhil drive kare, widget
validate; score → calibration; Re-Jirah day-3 isi se cold start) · scale slider (1 → 1 lakh invoices) ·
3-zoom (CEO/junior/skeptic) · **hero example + ek visual grammar** — wahi ek invoice line
**"Aristo Eco — ₹81,500"** har widget se guzre · **data hamesha uska** (FinOps/Blinkit strings,
"hello world" kabhi nahi) · poster finish → aakhri frame poster FILE mein (**capsule JSON mein image kabhi nahi jaati**), phir Bolo cue · delivery inline, render
fail ho to turant self-contained `.html`, **laptop-first** · **widget time-box 45-60 min** — cross ho
to WIDGET ka scope kato, concept ka kabhi nahi.

---

## 5. THE CAPSULE — notes ka format (canonical = `FORGE_SPEC.md`)

**Gist = MASTER. Local = READ-ONLY MIRROR.** Organism `dressing-room/state/capsules/<id>.json` pe
chalta hai, jiska **akela likhne wala `scripts/mirror.mjs`** hai — woh roz 06:55 pe gist se verbatim
bytes kheench ke file **overwrite** karta hai. Har organ (doubtminer/Gate 2, tape_room, lexicon,
doubt_grammar, deep, fsrs, capsule_bridge, rejirah) yahi padhta hai, gist nahi.
**Iska seedha natija:** koi bhi organ local capsule ko likh nahi sakta — likha hua agli subah mit
jaayega. Isliye har capsule-write (Re-Jirah date, doubt back-write) uske **gist paste** se hi hota hai,
aur mirror use wapas laa kar *saabit* karta hai ki paste landa (dekho §9 PENDING).
Raw: `https://gist.githubusercontent.com/nikhil1429/ce50c28d585c2fcd915a9dbf61871a56/raw/<id>.json`
Files abhi: `tokenization.json` · `embeddings.json` · `inference.json` · `context.json`.
**404 = woh concept abhi locked nahi.** Purana single `forge-capsules.json` flat-array **DEAD**.
`web_fetch` gist pe **blocked** → `curl -s`.
*(re-verified 10 Aug 2026 — raw base BYTE-FOR-BYTE sahi hai, aur teen jagah se ek jaisa nikla:
`grep -n "base" dressing-room/state/mirror_config.json` · `grep -n "GIST_RAW" setup/build_forge_html.mjs` ·
`grep -o "gist[a-z.]*githubusercontent[^\"']*" THE-FORGE.html`. `forge-capsules.json` sach mein MAR chuka:
`grep -rln "forge-capsules.json" --include=*.mjs --include=*.html .` = **zero**. **Char-file wali line ginti
hai, isliye rot-prone — live padho:** `ls -1 dressing-room/state/capsules/` (ya `grep -n "ids" dressing-room/state/mirror_config.json`,
jo mirror ke liye sirf FLOOR hai — mirror gist ko ENUMERATE karta hai aur config ko sach nahi maanta).
`web_fetch`-blocked wala hissa **NOT VERIFIED 10 Aug 2026** — woh tool-environment ka behaviour hai,
repo ke code se saabit nahi hota; claim ki tarah lo. `curl -s` waise bhi kaam karta hai.)*

**WRITE PATH (Option A — manual, per-file):**
- naya lock → Claude sirf us EK naye capsule ka file deta → Nikhil 'Add file' → paste → Save
- existing edit (Re-Jirah / doubt back-write) → Claude us EK file ka updated version deta → Nikhil
  us file ko **replace** karta, baaki UNTOUCHED
- **Locked capsule files IMMUTABLE hain.** Claude purane locked capsules **kabhi re-emit nahi karta** —
  yahi truncation + sacred-content-corruption ka structural fix hai.
- Kuch auto-save nahi hota. Nikhil decide karta.

**3 CONTENT LAYERS (layer, replace kabhi nahi):**

| layer | density | kya | kab padha jaata |
|---|---|---|---|
| 1 · **WELD** | explain + defend | per-axis `strike` (interviewer Q) + `weld` (defended answer) | recall / Re-Jirah pe |
| 2 · **DEEP** | scratch-se-re-learn | per-axis `deep` + capsule-level `deep` (analogy + worked example + why-chain + stuck-story) | ~2 mahine baad, dobara re-learn pe |
| 3 · **VIZ** | visual | per-axis `viz` + capsule `heroViz` | **RESERVED** — schema abhi finalize nahi |

**SCHEMA (exact, `FORGE_SPEC.md` §3):**

```json
{
  "id": "tokenization", "num": "01", "lockedOn": "2026-06-15", "reJirahDone": [],
  "stream": "foundations", "title": "Tokenization",
  "status": "tempered",            // JIRAH ka result — self-rating se KABHI nahi
  "dot": "magenta",                // cyan=primary · red=crack · magenta=tempered
  "source": "...", "why": "...", "hook": "...", "mechanism": "...",
  "deep": "capsule-level re-learn (### HOOK + ### MECHANISM + ### THE ONE PICTURE)",
  "faultLines": [ { "axis":"a", "title":"...", "strike":"interviewer Q",
                    "weld":"defended answer", "status":"held",
                    "deep":"per-axis re-learn (**SAWAL:** + **POORA JAWAB:**)" } ],  // a..i
  "threeWays": { "ceo":"...", "junior":"...", "skeptic":"..." },
  "traps":  [ { "bait":"...", "wrong":"...", "truth":"..." } ],      // >= 2
  "bridges":[ { "to":"embeddings", "conn":"x -> y", "q":"...", "a":"..." } ],  // >= 2
  "doubts": [ { "q":"uska exact stuck-point, uske shabd", "a":"crisp resolution" } ],
  "calibration": "predicted-vs-actual gap + freshness note",
  "buildHook": "FinOps mein exact spot + defend-able decision",
  "interviewLines": [ "tight English line, cold bol-ne layak" ],
  "bolo": "Nikhil ke apne words — Claude invent NAHI karta",
  "bolo_by": "— Nikhil, Jirah-tested ...",
  "viz": "bpe"                      // LEGACY capsule-level string (tok baked-animation pointer)
}
```

**SACRED FIELDS:** `bolo` · `weld` · `deep` · `mechanism` · `hook` · `why` · `traps` · `threeWays` ·
`interviewLines` — **authored prose, verbatim-faithful.** Claude ne inhe **invent kabhi nahi** karna;
threads/Bolo se recover karke Nikhil verify karta hai. Existing ko sirf **VERIFY** karo, rewrite NAHI.
*Kyun: yeh woh content hai jo woh interview mein khud defend karega — reword/invent = woh apni samajh nahi rata.*

~~**IDMAP (engine):** `tokenization→tok · embeddings→emb · inference→inf · neuralnet→nn · training/rlhf→rlhf · context→ctx · hallucinations→hal · tooluse→tus · jagged→jag`.~~ Filename hamesha **long id**.

> **(corrected 10 Aug 2026 — IDMAP MAR CHUKA HAI, engine mein woh hai hi nahi.)** Yeh line kehti thi
> ki engine long-id ko short-id pe map karta hai. Live check: `grep -rn "IDMAP" --include=*.mjs --include=*.html .`
> = **ZERO hits** (poore repo ke code + engine mein). Aaj ka engine `id` ko **seedha** use karta hai —
> nav-label bhi wahi, aur gist ka fetch URL bhi `<GIST>/<id>.json`
> (`grep -n 'fetch(' THE-FORGE.html` → `` fetch(`${GIST}/${c.id}.json`) ``). Long id hi aakhri sach hai
> aur har jagah wahi chalta: gist filename · `mirror_config.json` ki `ids[]` · `capsules/<id>.json` ·
> `deep.mjs` / `rejirah.mjs` / `capsule_bridge.mjs` ka concept-argument. **Filename hamesha long id —
> yeh aadhi line SAHI thi aur SAHI hai.**
> *(ek live naming-mismatch, chhod ke ja raha hoon kyunki yeh code se tay nahi hota: upar wali dead
> list `tooluse` likhti thi, par registry mein woh concept `tool_use` hai —
> `grep -n "tool_use" dressing-room/state/concepts.json`. Woh abhi locked nahi hai isliye aaj kuch toota
> nahi. **NOT VERIFIED 10 Aug 2026 — lock ke waqt kaunsi spelling jeetegi, yeh captain ki call hai.)*

---

## 6. COLD-READER STANDARD + DO GATES (doubts ki quality LAW)

**THE ONE LAW:** har knowledge-artifact **cold-reader** se reconstructable ho.
Cold-reader = **future-Nikhil, 6-12 mahine baad, is session ki ZERO memory.**
Us pal samajh aana **kaafi nahi** — 1 saal baad padhke bhi (a) pata chale kis cheez ki baat ho rahi
hai, aur (b) recall attempt ho sake.

**Q-fields** (`doubts[].q`, `bridges[].q`):
**ATOMIC** (ek confusion, do nahi) · **SUBJECT explicitly named** (koi dangling `ye`/`woh`/`Map`/
`second-enemy`/`(pehle-guess)` nahi) · **ANSWER-HIDDEN** · **RICH confusion-journey**
(*maine-socha-X-phir-Y-contradict-laga* — cold-Nikhil pehchaane **kahan atka**) · **no near-duplicate**.

> **ATOMIC ≠ terse.** Richness confusion-JOURNEY mein hai, extra confusions add karke nahi.
> Ek confusion richly-elaborated = GOOD · terse-but-cryptic = BAD · do confusions ek doubt mein = BAD.

**A-fields** (`doubts[].a`, `bridges[].a`): complete standalone — mechanism + why, akele padho to poora resolve ho.

**TAXONOMY:** `doubts[]` mein **sirf genuine knowledge stuck-points**. Curriculum-planning ("IVF kitni
depth"), status-notes ("[RESOLVED] 4 din pehle nervous"), deferral-notes ("chop/RAG abhi nahi seekhna"),
generic-vocab — **kabhi nahi** (lifelong bank mein clutter).

**3 failure-patterns (Gate 2 inhe flag karta):**
1. **CRYPTIC** — subject un-anchored. ❌ `"har layer pe SAME KV?"` → ✅ `"Transformer ke har layer ki apni ALAG KV cache hoti, ya saari layers ek hi share karti?"`
2. **FRAGMENT** — adjacent doubt pe latka, akele zero. ❌ `"Zyada temp = ?"` → ✅ `"Temperature ZYADA karne pe next-word menu sharp hoti ya flat — aur garbage-word ka chance badhta ya ghatta?"`
3. **META / TO-DO** — knowledge-doubt hai hi nahi → **PRUNE**.

**GATE 1 — CAPTURE (clean-at-birth):** THE METHOD step-10 (LOCK) + THREAD OPENER 4a (baad ke back-writes:
Re-Jirah / recall cracks). Claude har doubt standard-pe **DRAFT** kare (**uske shabd, invent nahi**) →
Nikhil **BATCH glance** ("go" / "yeh do fix" — **line-by-line nahi**) → PHIR save. Raw stuck-point seedha
`doubts[]` mein kabhi nahi.

**GATE 2 — VERIFY (slip-catcher):** har **LOCK ya SAVE** pe us file ke saare `doubts[]` + `bridges[].q`
standard ke against dobara padho → cryptic/fragment/meta/near-dup → **FLAG** → approval pe fix → **tabhi
file "done"**.

> ⚠️ **Live defect:** `.claude/skills/forge/SKILL.md` khud likhta hai — audit #34, 2026-08-04 —
> ki Gate 2 **ek baar bhi nahi chala**, aur **112 live doubts mein se 17 spec ke apne named
> failure-patterns todte hain** (cryptic 7 · meta 8 · fragment 2 · near-duplicate 0). *(9 Aug 2026
> launch audit — live sach: `tape_room.json` queue mein 112 doubts hain, **95 eligible:true**, aur
> **17 gate2-flagged wale INELIGIBLE hold pe hain** — matlab cold-reader-fail doubts ab serve NAHI
> hote jab tak repair nahi hota. Is note ka purana dar — "17 bina context serve honge" — ab code
> mein band hai; khula kaam sirf un 17 ki repair hai, jo captains_call gate2 card se ek-ek karke
> aati hai. Live padho: `node -e` se queue ka eligible count, is note se kabhi nahi.)*
> *(re-verified 10 Aug 2026 — **saare paanch number aaj bhi bilkul theek hain**, aur is baar command
> bhi likha ja raha hai taaki agli baar koi ginti prose se na uthaye:
> `node -e "const t=require('fs').readFileSync('dressing-room/state/tape_room.json','utf8');const j=JSON.parse(t);console.log(j.gate2.checked,j.gate2.flagged,JSON.stringify(j.gate2.by_pattern),j.queue.filter(x=>x.eligible===true).length)"`
> → aaj: checked **112** · flagged **17** · `{cryptic:7, fragment:2, meta:8, near_duplicate:0}` ·
> eligible **95**. Aur ek cheez jo yeh note nahi bolta thi par ab code se pakki hai: flagged aur
> eligible ka **overlap ZERO** hai — koi bhi gate2-flagged doubt queue mein serve nahi hota
> (`gate2.withheld_from_queue: 17`, `withheld_note: "flagged doubts are held OUT of the rematch queue
> until the wording is repaired — content untouched, re-admitted automatically"`).)*

**Research base (LOCKED — dobara research nahi):** Wozniak 20-rules (R4 atomic · R11 anti-interference ·
R12 wording) + Zettelkasten (autonomous notes) + Tulving (encoding specificity) + curse-of-knowledge.

---

## 7. TRACKS — kaunsa kaam kis ritual se chalta hai

`sprint.json` ka **`progress.current.track`** route decide karta hai (`.claude/skills/learn/SKILL.md` §1):

*(corrected 10 Aug 2026: yahan `sprint.json` ka `current.track` likha tha — **top-level `current` us file
mein hai hi nahi.** Live: `node -e "const s=JSON.parse(require('fs').readFileSync('dressing-room/state/sprint.json','utf8'));console.log(Object.keys(s).join(' '), '|', JSON.stringify(s.current))"`
→ keys `_comment sprint_master start pace playlist_anchor two_tracks progress sprints tasks`, aur
`s.current` = **undefined**. Asli raasta `sprint.progress.current` hai —
`grep -n "sprint.progress && sprint.progress.current" scripts/learnstate.mjs`. Skill khud `cur.track`
padhta hai, aur woh `cur` `learnstate.mjs json` ka output-field hai, sprint.json ka nahi:
`node scripts/learnstate.mjs json` ke top keys = `sprint ws cur watch modeLine wsAge`. Aaj live
`progress.current` = `{"id":"1-04","task":"Hallucinations","track":"concept", …}`. Chhoti si galti,
mehngi: jo bhi `current.track` grep karega usko sprint.json mein **kuch nahi** milega.)*

| track | ritual | rep shape |
|---|---|---|
| **concept** (Foundations / LLM-API / LLMOps) | **FORGE** — poora 9-axis heavy ritual, capsule lock | `surface:"gem"`, `track:"concept"`, `axis:"a"–"i"` |
| **skill** (Python) | **6-beat loop** — light ritual · heavy reps · god-tier core. **9-axis capsule KABHI nahi.** | `surface:"colab"`, `track:"skill"`, `axis:null` |
| **course** (Anthropic/YouTube on Colab) | guided active-recall pass. **Pehle `node scripts/course.mjs brief`** — kabhi mat poochho "kahan ho" | `track:"skill"`, `surface:"colab"` |
| **build** (FinOps repo, FastAPI, Vercel) | struggle-first build — woh likhta hai, tum hint-karo-solve-nahi | `track:"skill"` (koi `build` rep-track nahi hai) |
| **domain** (TDS / TCS / DTAA) | concept-style close, **finance zero se** — koi assumed recall nahi | `track:"concept"` |
| **career** (resume/applications) | **study session nahi.** Help karo, ritual mat chalao, **rep capture mat karo.** Saaf bol do. | — |

**HARD SEAM:** REPS + REVIEW + RESEARCH = Gemini · SAMAJH + DEFENSE + BUILD = Claude. Foundations
Jirah aur FinOps-decision defense **kabhi Gemini pe nahi**.
**Seam-refine (v2.0, canon isse seam ke saath hi jodti hai):** **5 CORE curated drills CLAUDE ke**
(quality + ladder-aligned); **BULK volume Gemini ka**. "REPS = Gemini" ko drill-refusal mat samajhna —
teacher problems deta hai, student solutions generate karta hai; generation-effect intact.

**PYTHON DEPTH (recurring confusion — SETTLED):** Python = **light ritual · heavy reps · god-tier core**.
Skill hai, decay-prone concept nahi → koi 9-axis capsule nahi. Par shallow bhi nahi — **SELECTIVE**:
dṛḍhabhūmi sirf core build-skills pe (Pydantic · FastAPI · async · API+error-handling · parsers ·
data-manip + where-NOT-to-use-AI). Peripheral (PyTorch, metaclasses, event-loop internals) = "look it up",
drill nahi.

**FLUENCY STATES:** 🔴 Learning → 🟡 Held (packet close-sign) → 🟢 Fluent / dṛḍhabhūmi (cold + fast + effortless).

**HONEST:** koi system Python bake nahi karta — bake karti hai **reps × time × neend**. System ka kaam =
reps ko EFFICIENT (ladder) + CONSISTENT (floor) + CURATED (selective) banana. Koi shortcut-field nahi.

**THREE-GRAIN CLOSE (kabhi mix mat karo — yahin overwhelm hota hai):**
subtopic close = packet close-sign (light, daily, → 🟡) · **tier** close = saare subtopic + tier-artifact
cold likha + Bolo (milestone, **capsule NAHI**) · **foundations-concept** close = heavy Forge 9-axis
(capsule / Jirah / tempered / gist / Re-Jirah) — **Python pe kabhi nahi.**

**BOLO-POLICY (gradient):** raw fundamentals (variables/types/strings/f-strings/loops/dicts) → Bolo
**light/optional**, skip-OK, guilt nahi. CORE build-skills + FinOps decision-artifacts → **NON-NEGOTIABLE**.
Tier-close + foundations-concept Bolo → non-negotiable, hamesha.

---

## 8. THE MACHINE — Claude Code ke andar yeh sab kaise chalta hai

> **18 Aug 2026 (OVERHAUL Block 1) — THE MACHINE ka naya shape, do line mein.** (1) **Hooks ab ek
> process:** UserPromptSubmit ke paanch node processes **do** ho gaye (`hooks/afferent-post.mjs` +
> `scripts/turn_hook.mjs prompt`), SessionStart ke paanch **ek** (`scripts/turn_hook.mjs start`) —
> dispatcher neeche ke chaaron/paanchon command **usi order mein, in-process** chalata hai, har callee ka
> apna dispatch apna stdout chhaapta hai (byte-identical saabit: prompt 996 B = 996 B, start 11,804 B =
> 11,804 B; `node scripts/turn_hook.mjs selftest`). Neeche ki table **kya chalta hai** ke liye aaj bhi
> sahi hai — bas har row ab apna process nahi, dispatcher ki ek call hai. (2) **THE SITTING BRAIN
> (Block 3, BUILT 18 Aug 2026):** `scripts/sitting.mjs` — har muh (Dugout voice · Claude Code `/learn`
> `/forge`) ke peeche EK persistent Claude session; wahi pacer block (`forge_session.mjs contract` +
> `teaching_contract.mjs print` + recall-hint) har voice turn ke aage LAGTA HAI jo `turn_hook prompt`
> Claude Code turn ke aage lagata hai — `sitting.mjs` `turn_hook.mjs` ka `runOrgan` hi call karta hai,
> paanch node dobara nahi. **THE SITTING BRAIN (`scripts/sitting.mjs`, :4117) — one mind behind every mouth;
> `node scripts/sitting.mjs status`; the mouth (dugout) speaks its units, `/learn` and `/forge`
> register a code sitting.** (3) **SITTING KHUD KHULTI HAI (Block 5, 18 Aug):** Gaffer ka page load hote hi
> sitting open — koi keyword yaad nahi rakhna (uska 10:42 word: "bro i will never remember any of the keyword").
> (4) **DAY-KEY LAW (Block 6):** raat 12 ke baad chala scheduled organ apna din SLOT se leta hai, clock se nahi
> (`scripts/daykey.mjs`; `node scripts/herd.mjs risks` = 0). (5) **FREEZE (Block 8):** ab naya organ, naya
> constitution paragraph ya schedule change sirf card se — `FREEZE.md` root pe; guard `hooks/commit-msg` mein. **18 Aug shaam: freeze uske word se DEFERRED** (`node scripts/freeze.mjs status`; record `docs/archive/FREEZE__deferred-2026-08-18.md`) — guard bana hua hai, dormant.
> Overhaul ka poora record: `docs/archive/ORGANISM_OVERHAUL__2026-08-18.md` (BUILD LOG upar).

### 8.1 HOOKS (`.claude/settings.json`) — yeh drift ka structural ilaaj hai

*(18 Aug 2026: `.claude/settings.json` mein ab yeh commands **seedhe nahi likhe** — UserPromptSubmit =
`afferent-post` + `turn_hook.mjs prompt`, SessionStart = `turn_hook.mjs start`; table ki rows
`scripts/turn_hook.mjs` ke `prompt()` / `start()` mein usi order mein hain — `grep -n "runOrgan(" scripts/turn_hook.mjs`.
Stop · PreCompact · SessionEnd waise ke waise.)*

| kab | kya chalta | kyun |
|---|---|---|
| **SessionStart** | `node scripts/teaching_contract.mjs reset-turns` *(5 Aug)* | turn-clock ka session boundary. Organ ka apna header 2 Aug se yeh bol raha tha par kabhi wire nahi hua tha — clock ke paas reset ka rasta hi nahi tha. **Sabse pehle chalta hai.** |
| **SessionStart** | `node scripts/learnstate.mjs brief` | "main kahan hoon" brief — sprint position + kahan chhoda + open loop + watch-list + next-up + aaj ka Examiner target + Re-Jirah overdue + **PENDING gist-write** + course/python brief. **HOW_HE_LEARNS ka COLD-START CARD isi mein splice hota hai** (markers `COLD-START-CARD:BEGIN/END` ke beech ka text verbatim). *(5 Aug: ab yeh `scripts/context_manifest.mjs` se render hota hai — explicit 12,000-char budget *(18 Aug 2026 se **5,300** — OVERHAUL Block 1, poori printed brief < 6,000 bytes; `grep -n "export const CEILING" scripts/context_manifest.mjs`)*, worst-priority-first kharch, aur footer har hisse ke bytes + jo bhi MISSING/TRIMMED hua woh naam se bolta. Kyun: brief har SessionStart pe hippocampus cartridge ke 4,157 mein se **1,957 chupchap gira raha tha.** Size problem kabhi nahi thi — silent loss thi.)* |
| **SessionStart** | `node scripts/forge_session.mjs boot` | read-only — koi forge session disk pe abhi **OPEN** to nahi? Stale session pe bhi bolta hai (staleness pacer ko chup karti, memory ko nahi). |
| **UserPromptSubmit** | `node hooks/afferent-post.mjs` | uske shabd thalamus (:4113) ko — zero capture-tax |
| **UserPromptSubmit** | `node scripts/forge_session.mjs contract` | **THE METHOD ka 12-step order + dono anti-quiz-dump laws, HAR TURN.** ≤9 lines (anti-wall law). Fresh unclosed session na ho to chup. |
| **UserPromptSubmit** | `node scripts/teaching_contract.mjs print` | **HOW-TO-TEACH rules, har turn**, ≤5 lines, drift-ranked + rotating + turn-counter (context warning) |
| **UserPromptSubmit** *(9 Aug)* | `node scripts/hippocampus.mjs recall-hint` | uske turn ka lexical match uske apne purane words se — RECALL line sirf jab score bar paar kare (win-only, never theatre); ARSENAL_ORGAN-silent. |
| **UserPromptSubmit** *(7 Aug)* | `node scripts/teaching_audit.mjs hook` | uske PROMPT ki recording — Stop payload mein user-text hota hi nahi, isliye confusion-is-literal check ke liye prompt yahan record hota hai, Stop pe consume. |
| **Stop** | `node hooks/afferent-post.mjs` | **jo padhaya gaya** woh bhi memory mein (`claude-code-teaching`) |
| **Stop** *(7 Aug)* | `node scripts/teaching_audit.mjs hook` | turn ka audit LIVE forge session ke against — drifts measure, auto-count (uski 7 Aug do-lane ruling), `checked_at` heartbeat. |
| **SessionStart** *(7 Aug)* | `node scripts/watchman.mjs brief` | EK line, sirf jab kal raat Tier-1 ne kuch pakda ho ya watchman khud na chala ho — saaf raat pe chup. |
| **SessionStart** *(7 Aug)* | `node scripts/captains_call.mjs deal` | THE ANCHOR LAW — max EK card, haan/na/baad. Fresh forge session khula ho to chup (rule #12). |
| **PreCompact** *(5 Aug)* | `node scripts/learnstate.mjs brief` | compaction ke paar orientation zinda rahe — SessionStart ke compact-source firing pe bharosa karne ke bajaye brief dobara print hoti hai. |

> **CONTEXT WARNING (5 Aug, badla hua):** ab woh **transcript ke SIZE** pe hai, turn-counter pe nahi.
> Naapa gaya: ek hi conversation mein session id `bd2d46c2…` → `fa94c375…` fork hui aur counter
> **1 → 1 → 2** ho gaya — yaani woh theek us pal zero hua jab context sabse bada tha. #38 ka
> "hamesha firing" ulat ke uske bure roop "kabhi nahi firing" mein badal gaya tha. Naya transcript
> file history INHERIT karti hai (710,280 → 958,257 bytes), toh **size fork ke paar bachta hai,
> identity nahi.** ~~Budget 1,500,000 bytes~~ — uske apne 3,780 transcripts pe p95 = 99,557 aur sirf
> **49 (1.3%)** kabhi 1 MB paar karte hain, isliye yeh line woh kabhi ignore karna nahi seekhega.
>
> **(corrected 10 Aug 2026 — budget 1,500,000 ab LEGACY hai, live nahi.)** Us number ka apna naam hi
> ab `DEFAULT_TRANSCRIPT_WARN_BYTES_LEGACY` hai (`grep -n "DEFAULT_TRANSCRIPT_WARN_BYTES" scripts/teaching_contract.mjs`).
> Live budget **derive** hota hai, hardcode nahi: `MEASURED_BYTES_PER_TOKEN = 4.1` (6 Aug ka naapa hua
> 964,000 bytes ↔ 234,700 tokens) × `CONTEXT_WINDOW_TOKENS = 1_000_000` = **4,100,000 bytes**, aur ek
> soft line `SOFT_FRACTION = 0.6` pe pehle bajti hai (~2.46 MB). Yaani warn ab ASLI window pe baitha hai,
> ek guess pe nahi. State se retune ho sakta (`transcript_warn_bytes`), file chhue bina. **Number yahan
> se mat uthao — `grep -n "MEASURED_BYTES_PER_TOKEN\|CONTEXT_WINDOW_TOKENS\|SOFT_FRACTION" scripts/teaching_contract.mjs`.**
> *(Aur is badlaav se upar wala "1 MB paar" wala tark ab purana ho gaya: 1.5 MB pe woh 1.3% transcripts
> ko chhoo raha tha, 4.1 MB pe aur bhi kam. Reasoning wahi rehti — jhoota alarm gauge ko marta hai —
> par uske saath jo ginti likhi thi woh ab us budget ki nahi hai.)*

**Kyun do alag contract:** 31 Jul ko naapa gaya — pacer har turn aata tha, teaching-rules sirf
SessionStart pe. 5-ghante ki session ka nateeja: **zero method-drift, chaar teaching-drift**
(scope · role · language · terminology). *Jo har turn wapas aata hai, wahi tikta hai.*

**teaching_contract ke 12 seeded rules** (aur `add` se badhte hain, state mein rehte hain, code mein nahi):
1. `his-word` — uska saaf bola hua instruction > meri samajh. Scope kaatna ho to **pehle poochho**.
2. `hinglish` — HINGLISH, shuddh Hindi nahi. Technical shabd **angrezi mein hi**.
3. `terminology` — asli terminology bolo (token · vocabulary · next-token · sampling · groundedness). Hindi anuvaad se naam mat badlo — **analogy alag cheez, naam alag**.
4. `link-back` — naya concept hamesha band ho chuke concepts se **naam le kar** jodo (yeh line `sprint.json → progress.done` se **live derive** hoti hai, hardcode nahi).
5. `decided` — jo faisla woh pehle le chuka hai woh **zinda hai** — har naye message se intent dobara mat nikaalo.
6. `one-idea` — EK naya idea per message + ant mein EK check-question. **Uska rule #1, aur sabse zyada tootne wala.**
7. `his-level` — uska level uske apne shabd se upar mat rakho — koi "dormant", koi "yeh to tujhe aata hai".
8. `no-system-mid-concept` — concept ke beech koi system/notes/tool kaam nahi — naam lo, park karo, micro-question wapas.
9. `confusion-is-literal` — "samajh nahi aaya" ko literally lo — wahin ruko, zero se shuru karo.
10. `dheema-not-lamba` — DHEEMA = EK cheez poori kholi hui. LAMBA = ek message mein bahut cheezein. **Kabhi lamba nahi, hamesha gehra.**
11. `coverage` *(7 Aug 2026)* — har axis ka POORA scope kholna Claude ka kaam. Aadha jawab · kata scope · dabaya doubt · core-axis defer = drift.
12. `neev-pehle` *(9 Aug 2026)* — naya naam pehli baar aate hi EK line mein kholo; conclusion se pehle neev.

> **(corrected 10 Aug 2026: yahan "5 seeded rules" likha tha aur sirf pehle paanch gine the — seed mein
> ab 12 hain.)** 6-10 ko 6 Aug 2026 ko seed mein daala gaya tha (self-sustaining repair) theek isliye ki
> paanch rule SIRF state file mein zinda the — ek re-seed event un paanchon check ko chupchap hamesha ke
> liye maar deta (`flag`/`autohit` unknown id ko refuse karte hain aur caller failure nigal jaata hai);
> 11 aur 12 baad mein usi wajah se aaye. **Seed ko har us rule ko carry karna hai jispe koi automatic
> path khada hai.** Padho live: `sed -n "/── SEED ─/,/^}/p" scripts/teaching_contract.mjs`, ya
> `node scripts/teaching_contract.mjs list` (jo hits + auto dono lanes ke saath ranked list deta hai).

**DO LANE hain, aur yeh farak jaanna zaroori hai** *(corrected 10 Aug 2026: pehle yahan sirf itna likha
tha — "`hit <id>` se drift record hoti hai" — jo Claude ko **uske apne** rasta se bilkul door bhej deta
tha)*:
- **`hits` — USKI lane.** Sirf `hit` / `confirm` isse chhoote hain. **Claude yeh kabhi nahi likhta.**
- **`auto_hits` — CODE ki lane.** Claude apni hi drift pakde to **usi turn mein**
  `node scripts/teaching_contract.mjs flag <rule-id> --why "<jo kiya>"` — 7 Aug ki uski ruling ("ok do it..")
  ke baad yeh **turant count** hota hai, na card, na confirm. `teaching_audit.mjs` measured drifts ke liye
  `autohit` chalata hai (apne CLI se, kabhi seedha JSON nahi — `grep -n "never touches teaching_contract.json itself" scripts/teaching_audit.mjs`).
  Wapas chalna ek command: `unhit-auto <id>`.
- **Ranking DONO ko jodti hai:** `const ruleWeight = (r) => (Number(r.hits) || 0) + (Number(r.auto_hits) || 0);`
  (`grep -n "ruleWeight" scripts/teaching_contract.mjs`) — sabse bhaari rule slot 1 pe, baaki rotate.

Contract khud ko tez karta hai us cheez ke against jo **actually** galat ho rahi hai.

### 8.2 SKILLS (`.claude/skills/`) — ginti LIVE karo (`ls .claude/skills/`), yahan likha number rot chuka tha (audit: "12" jab disk pe 13 the)

**Learning:** `/forge` (concept NAAM diya ho) · `/learn` (naam nahi diya — state padho, route karo) ·
`/scrimmage` (staged R-late graded mock, DOSSIER grammar) · `/rematch` (tape-room — past-Nikhil ka doubt
opponent ban ke wapas; saaf jeeto to doubt retire) · `/paste-session` (Gem/Colab reps ingest) ·
`/genome` (Boot Room ka pending mutation — evidence + revert plan; **sirf uske munh se method badalti hai**)

**Din:** `/matchday` (kickoff) · `/full-time` (30-second close: HIT/MISS · ek signal · KAL-line) ·
`/organism-doctor` (health check) · `/talk` (voice) · `/paint` (Gemini viz lane) · `/gem-sync` (phone Examiner Gem refresh)

**Outward:** `/fire` (staged Gemini mission — uska click hi trigger; "le lo" = return leg) ·
`/harvest` *(9 Aug 2026, P7)* — Gem sitting poori ki poori afferent bus pe (his turns `gemini-study`,
Gem ke `gemini-study-teaching`), owner `harvest.mjs`, dedup + resync built-in ·
`/gist-patch` — closed Re-Jirah round ka `reJirahDone` patch gist ke edit page pe pre-fill; **Save uska
hi rehta**, phir `mirror.mjs` wapas laata to PENDING usi baithak mein khatam (§9)

*(corrected 10 Aug 2026: upar ki teen list se `/gist-patch` **gayab tha** — disk pe woh maujood hai
(`ls .claude/skills/`), aur woh theek us GAP ka zero-tax raasta hai jise §9 aur HONEST LEDGER item 6b
dono "khula kaam" bolte hain. Ek surface jo naksha mein nahi hai woh kisi session ko milta hi nahi.
**Aur ginti phir se: aaj disk pe 15 skills hain, is heading ka apna sabak hi yahi hai — `ls .claude/skills/`
chalao, kisi bhi list se mat gino.** Baaki 14 naam ek-ek karke disk se milaye gaye aur sahi nikle.)*

**Routing:** *"forge embeddings"* → `/forge`. *"padhai karte hain" / "aaj ka session" / "continue" /
"where was I"* → `/learn` (woh state padhta hai aur zaroorat ho to `/forge` ko de deta hai).

### 8.3 PACER CLI (`scripts/forge_session.mjs`) — method ko STATE banata hai

```
node scripts/forge_session.mjs boot                    # read-only; SessionStart khud chalata
node scripts/forge_session.mjs start <concept> [--force]   # session khulte hi, sabse pehle (--force = purani unclosed session DISCARD, par ek `force` row phir bhi history mein likhi jaati)
node scripts/forge_session.mjs step <0-11>
node scripts/forge_session.mjs axis <a-i> now|done|defer   # arg REQUIRED (7 Aug 2026, P4.1: bare form REFUSES — purana default `done` do baar Jirah se pehle axis "complete" kar gaya). `now` = "ab is axis par hoon", sirf declare
node scripts/forge_session.mjs status                     # hook-safe, ek line
node scripts/forge_session.mjs moment pehle_guess|widget_gate|check_q|jirah
node scripts/forge_session.mjs lockchain               # read-only PREVIEW — step 10 pe kya-kya apne aap chalega (kuch stage nahi hota, state aage nahi badhti)
node scripts/forge_session.mjs close                   # "session khatam" pe → coverage report
```

*(added 10 Aug 2026: `lockchain` is block se **chhoot gaya tha** — woh dispatch mein maujood hai
(`grep -n 'case "lockchain"' scripts/forge_session.mjs`) aur ise jaanna is liye zaroori hai ki
**step 10 pe ARRIVAL par LOCK-CHAIN apne aap fire hoti hai** — stage-lock mission + benchmark +
gate-report — sirf pehli baar aane pe, dobara `step 10` type karne pe nahi
(`grep -n "wasAtLock" scripts/forge_session.mjs`). `lockchain` woh sab dikha deta hai bina L-mission
stage kiye. Ek aur cheez jo yahan likhi nahi thi par live hai: `start` ke baad scout apne aap
topic-open T-mission stage karta hai, aur fail-silent hai — scouting padhai ko kabhi rokti nahi
(`grep -n "stage-topic" scripts/forge_session.mjs`).)*

- SessionStart ne **OPEN session** bataya → pehle `close` karo aur coverage **zor se padho**; us session
  ke axes **dobara mat padhao**, step 0 se **restart mat karo**. Koi bhi unclosed session ho (stale bhi)
  to `start` **REFUSE** karega.
- Axis `done` uske **apne `moment jirah` ke BAAD** mark karo. Bina jirah ke — ya ek jirah kai axes mein
  baant ke — mark kiya axis **UNGRADED** record hota hai. Baad mein dobara mark karne pe upgrade ho jaata,
  toh galat order hamesha recover ho sakta.
- `close` **hamesha** method-block print karta hai — `elapsed` + `axis marks spread over` samet.
  **Reasons verbatim padho, clean ho ya na ho.** 1.4 minute mein "12-step session" theatre hai — dono
  number zor se bolo.
- Laws: yeh file `forge_session.json` ki **akeli likhne wali** hai · kabhi padhaati nahi, grade nahi karti,
  `reps_log` ko chhoo-ti nahi · `contract`/`status` **hook-safe** hain (fail-silent, exit 0) · **STALE = SILENT**.

### 8.4 CAPTURE — reps ka ek hi darwaza

Session end (`"session khatam"/"done"/"bas"`) pe **automatic**:

```json
[{"ts":"<ISO8601>","surface":"gem","track":"concept","concept":"hallucinations",
  "axis":"a","question":"...","confidence":"knew|shaky|guessed","correct":true}]
```

```
tmpfile mein save → node scripts/capture.mjs paste <tmpfile> → node scripts/heartbeat.mjs
                  → node scripts/forge_session.mjs close
```

**Contract ke sakht niyam (`node scripts/capture.mjs selftest` = contract):**
- **`ts` MANDATORY aur PEHLA gate.** Bina asli ISO-8601 `ts` ke rep seedha reject; poori session chupchap
  `appended 0` ban jaati hai.
- `axis` = **ek hi akshar `a`–`i`**. Literal string `"a-i"` bhi reject hota hai.
  *(In dono ne 30 Jul audit se pehle ek live session ke reps kha liye the.)*
- skill/coding session → `surface:"colab"`, `track:"skill"`, `axis` **MUST be `null`**.
- `latency_ms` **sirf tab jab actually observable ho** — invent kabhi nahi (jhootha number fluency-ladder
  corrupt karta hai). *(corrected 10 Aug 2026: yahan likha tha "genome ka `criterion_gated_pass` isse
  padhta hai" — **aaj koi script `criterion_gated_pass` padhta hi nahi.**
  `grep -rn "criterion_gated_pass" scripts/*.mjs` = ek hi hit, aur woh `capture.mjs` ka **comment** hai,
  reader nahi; field khud `forge_profile.json` mein baitha hai as genome-data. Jo ASLI reader hai woh
  fluency-ladder hai: `grep -n "latency_fast_ms" scripts/learning_state.mjs` →
  `const latOK = (r.latency_ms == null) || (r.latency_ms <= cfg.thresholds.latency_fast_ms);`
  aur `latency_fast_ms: 8000` `learning_state_config.json` se. **Rule zinda hai, wajah badli:**
  jhoota latency 🟢-fluent ko jhootha bana deta hai, aaj hi, is turn se.)*
- `unregistered:true` aaya → concept `state/concepts.json` mein hai hi nahi. **Bol do** — woh registry
  hand-curated canon hai, uski approval chahiye, chupke se edit kabhi nahi.
`capture.mjs` v4 (audit #24, 4 Aug 2026): ab woh apna **`observed_at`** khud stamp karta hai (sirf `paste`/`pull` ke ingest path pe — **ek batch = EK arrival instant**; pehle likhi rows pe `observed_at:null`, kyunki hum jaante hi nahi ki woh kab aayi) aur model ka claim `ts_claimed` mein rakhta hai (**canonical ISO mein normalize karke, kabhi destroy nahi**). `ts` ab bhi CLAIM hi rehta — sirf tab observation jeet-ta hai jab claim NAAMUMKIN ho (rep apne aane ke BAAD nahi ho sakta); tab `ts_source` `"observed(claim_after_arrival)"` ban jaata aur ingest report us correction ko GINTI karta, chupke se rewrite nahi. — kyunki reps_log mein saabit hua ki 90 minute
  mein faile chaar reps sab `.795` millisecond pe the, teen theek 1000 ms ke faasle pe. **Model ka
  likha hua clock bharosemand nahi tha.**

**GUT-WORD LAW (inviolable):** `knew` / `shaky` / `guessed` **jawab se PEHLE**. **Gut-word nahi → rep nahi.**
> CANON HOME: `PROJECT_OS.md` STEP 8 CALIBRATE + HARD RULES (likha 6 Aug 2026). Us din tak yeh law
> SIRF is map mein aur CLAUDE.md mein tha — aur yeh file canon nahi hai — matlab ek "inviolable" law
> ka koi canon ghar hi nahi tha, aur `rejirah.mjs grade` use tod raha tha (bina gut ke round le leta
> tha) jabki `capture.mjs rep` refuse karta tha. Dono ab ek hi jawab dete hain.
Baad mein **re-grade kabhi nahi**. `confidence` = usne jawab dene se PEHLE jo commit kiya · `correct` =
nateeja. Confidence ko correctness se derive karna = `confidence == correct` force ho jaata hai aur
**overconfidence signal mar jaata hai** (`P(wrong|knew)` — confident-but-wrong hi to poora point hai).
Gemini-handoff mein sirf outcomes aaye ho → `confidence:"shaky"` likho (imaandaar "koi gut-word commit
nahi hua" value). **Clean outcome se `knew` gadho mat.**

### 8.5 STATE BUS — kaun kis file ka malik hai (single-writer law)

| file | akela likhne wala | kya |
|---|---|---|
| `reps_log.jsonl` | `capture.mjs` | har rep ek line. **Chaar signal-agent + kai dashboard organ isse padhte hain, likhte kabhi nahi.** |
| `forge_session.json` | `forge_session.mjs` | live step-state |
| `forge_sessions.jsonl` | `forge_session.mjs` | band ho chuki sessions ka append-only itihaas (terminal band hone pe bhi bachta) |
| `fsrs_store.json` / `cards.json` | `fsrs.mjs` | schedule |
| `calibration.json` | `calibration.mjs` | ECE + danger-zone |
| `weaknesses.json` | `nemesis.mjs` | ranked recurring misses |
| `learning_state.json` | `learning_state.mjs` | fluency + Maidan (**TRACKED** — *corrected 10 Aug 2026: yahan "gitignored — derived PII" likha tha; D10 ne 5 Aug ko yeh palta diya aur `.gitignore:66` ab sirf ek comment hai — "Learning-state agent output --- D10, 5 Aug 2026: now tracked (his ruling)". Live: `git check-ignore -v dressing-room/state/learning_state.json` = kuch nahi, `git ls-files` = tracked. **Isi table ka apna paragraph neeche yeh sahi bolta tha — table peechhe reh gayi thi.***) |
| `capsule_map.json` | `capsule_bridge.mjs` | capsules ka extract |
| `doubt_grammar.json` · `lexicon.json` · `tape_room.json` | `doubtminer.mjs` | decoy-map · ghar ki boli · tape room |
| `examiner_drill.json` | `examiner.mjs` | staged code-round (**TRACKED** — *corrected 10 Aug 2026: "gitignored — weaknesses naam leta hai" ab galat hai. `.gitignore:183` ab bolta hai "the live examiner (M4) — D10, 5 Aug 2026: now tracked (his ruling)". Live: `git check-ignore -v dressing-room/state/examiner_drill.json` = kuch nahi.*) |
| `course.json` | `course.mjs` | chapter position |
| `teaching_contract.json` | `teaching_contract.mjs` | rules + hits + turn counter |
| `sprint.json` (`progress` block) | `sprintsync.mjs` | uski live Google Sheet se |
| `concepts.json` | **koi nahi — HAND-CURATED CANON** | concept/skill IDs + 9 axes + aliases |
| `forge_profile.json` | `bootroom.mjs` (sirf mutation pipeline se) | THE GENOME |
| `capsules/<id>.json` | `mirror.mjs` | gist ka READ-ONLY mirror — roz 06:55 pe verbatim overwrite. **Koi doosra organ ise likhta nahi** (§5). |
| `rejirah_log.jsonl` | `rejirah.mjs` *(5 Aug 2026)* | Re-Jirah ke axis-GRADE rows + round-CLOSE rows, append-only. Controller-v0 ke saare reserved field isse **DERIVE** hote hain. |
| `python_state.json` | `python_state.mjs` *(5 Aug 2026)* | Python track: subtopic · tier · 🔴🟡🟢 · close_sign_at · JS-hangover watch-list (×N) · last_packet |
| `widgets.json` | `widget.mjs` *(5 Aug 2026)* | Visualization Contract ka registry — kaunse concept ka widget maujood hai aur kitne guess-gate **actually driven** hue. **Generate kabhi nahi karta.** |
| `gemini_quality.jsonl` | `capture.mjs` *(7 Aug 2026, P6.1)* | Gemini surface ka OUTCOME ledger — har paste-batch ke measured stats (gut mix · correct rate · span), **judge koi nahi 30-45d tak**. Transcript ab `/harvest` se aa sakta hai *(9 Aug 2026, P7)* — jo sitting harvest hui, uski compliance measurable; yeh lane phir bhi OUTCOME hi rahegi. Cold check = day-end Examiner. |
| `harvest_log.jsonl` | `harvest.mjs` *(9 Aug 2026, P7 — uske 'data flows everywhere' word se)* | Gemini HARVEST lane ka delivery ledger — har harvested turn (his `gemini-study` / Gem `gemini-study-teaching`), thalamus door se post, dedup (ledger + bus, roll-safe), `resync` undelivered rows ko phir bhejta hai. Bus pe likhne ka LAWFUL raasta sirf POST door hai. |
| `outwork_audit_last.json` | `outwork_audit.mjs` *(7 Aug 2026, P8.2)* | OUTWORK layer ka behavioural audit — "din ne apna kaam kiya?": full-time close · KAL→kickoff weld · RESULT paper-trail · 3-bucket split · season/post_match sync · presence≠output. Watchman ki nightly run ise `run --json` se ride karti hai. WON-DAY ke unmachine-checkable hisse `report` mein NAAM se stated. |
| `missions.json` | `scout.mjs` *(8 Aug 2026 — THE MISSIONS DESK)* | Gemini-arm ka ledger: M01–M04 full-syllabus audit + T-/L- (topic-open/lock-harvest) rows, ingest events, `syllabus_audit.closed_at` = THE BENCHMARK GATE (uska word, event — date nahi). Mission prompt files `dressing-room/missions/` (M0x hand-authored, sirf REGISTER hoti hain; T-/L- scout hi likhta hai). Returns verbatim `scout_reports/mission_*.md`. |
| `benchmark.json` | `benchmark.mjs` *(8 Aug 2026)* | 5 ROADMAP buckets × DOSSIER §1 weights × live evidence — have/need COUNTS + NAMES only (koi composite score nahi, 1 Aug usool). `audit-close` tak GATED (Ruling 6). `runs[]` outward floor ko feed karta hai. Readers: wall · team_sheet · kickoff line · captains_call regression card. |
| `SEASON.md` *(dressing-room/, state nahi)* | `postmatch.mjs` *(8 Aug 2026 — un-parked uske word se)* | THE LOGBOOK — standings + match rows (newest-top) + form-line (rest-dot neutral) + KAL→kickoff weld. Claude 100% bharta, woh ZERO likhta. Regen: har full-time + `postmatch season`. Raw layer = `season.json` ka `rows[]`. |

**LAW: writes sirf owners se.** `reps_log.jsonl`, `concepts.json`, ya koi bhi state file **haath se
kabhi edit mat karo**. Doubts → `node scripts/hippocampus.mjs mark doubt` (uske shabd stdin pe).

**Committed vs gitignored (UPDATED 5 Aug 2026 — decision D10 ne yeh palat diya).** Repo PUBLIC hai.
Pehle yahan likha tha ki `reps_log.jsonl` · `learning_state.json` · `examiner_drill.json` gitignored
hain — **ab woh galat hai.** Captain ne D10 mein (do baar, files naam le kar) ruling di: **uska
personal study data repo ke SAATH travel karta hai.** `.gitignore` ab in teeno ko TRACK karta hai,
aur purane rules comment mein frozen hain taaki reversal auditable rahe. ~~**Jo ab bhi ignored hai:**
sirf credentials (`oura_*`).~~

> **(corrected 10 Aug 2026 — "ab ignored sirf `oura_*`" SAAF JHOOT hai, aur yeh is file ka sabse
> khatarnaak wala jhoot tha.)** D10 ne TEEN files ko track kiya, poori `.gitignore` ko nahi. Aaj bhi
> is learning layer ke aadhe se zyada state files IGNORED hain — sirf naam ginate hue:
> `cards.json` · `fsrs_store.json` · `calibration.json` · `weaknesses.json` · `capsule_map.json` ·
> `doubt_grammar.json` · `lexicon.json` · `tape_room.json` · `forge_session.json` ·
> `forge_sessions.jsonl` · `teaching_contract.json` · `sprint.json` · `capsules/` · `scout_reports/` ·
> `capture_config.json` · `capsule_backups/` — aur inke alawa poora cyborg-brain lane
> (hippocampus, thalamus/cortex, dugout, presence, twin …). **Yeh koi bug nahi hai — har line ka apna
> likha hua kaaran `.gitignore` mein hi baitha hai.** Yeh line galat isliye khatarnak thi ki iske
> bharose koi "sab kuch travel karta hai" maan kar clone/restore plan bana leta.
> **Kabhi is list se mat padho, file se poochho:** `git check-ignore -v <file>` (khaali output = tracked),
> ya poora naksha ek baar mein —
> `for f in dressing-room/state/*.json dressing-room/state/*.jsonl; do printf "%-58s %s\n" "$f" "$(git check-ignore -q "$f" && echo IGNORED || echo tracked)"; done`.
> **Yeh gitignore-claim is file mein CHAUTHI baar rot hui hai.** Isliye ab yahan koi list-of-record
> nahi hai — sirf command hai.

*(9 Aug 2026 launch audit: is line ne `readiness.json` + `intake_log.json`
ko "ab bhi ignored" bataya jabki dono TRACKED hain — aur usi din captain ne khud ruling di, uske
shabd: "i do not care putting my data in the public repo". Biometric/medication state ka public repo
mein hona ab ACCEPTED hai, defect nahi. Yeh map ki teesri baar hai jab gitignore-claim rota — is
list pe kabhi bharosa mat karo, `git check-ignore -v <file>` chalao.)*
`capsules/` bhi gitignored hai (`.gitignore:79`, 10 Aug 2026 ko dobara check kiya) — matlab **git uske
capsules ka backup nahi hai; gist hi master hai.** ~~gist hi ... ekmatra backup hai~~
*(corrected 10 Aug 2026: "**ekmatra** backup" ab galat hai — LADDER E9 (9 Aug) ne mirror ko ek LOCAL
recovery-lane de di: `mirror.mjs` roz `capsules/` ka dated snapshot `capsule_backups/<date>/` mein
rakhta hai (`grep -n "capsule_backups" scripts/mirror.mjs`), aur woh directory bhi gitignored hai
(`.gitignore:263`). Aaj disk pe: `ls -1 dressing-room/state/capsule_backups/` → `2026-08-10`.
**Gist ab bhi CLOUD master + ekmatra OFF-machine backup hai — par "koi doosri copy nahi hai" ab sach
nahi.** Aur "210 KB" bhi ginti hai jo har naye lock pe badlegi: `du -sh dressing-room/state/capsules/`.)*

Naye tracked state (5 Aug): `python_state.json` · ~~`rejirah_log.jsonl`~~ · `widgets.json` — study
data hain, D10 ke andar. `course.json` bhi tracked hai (pehle se flagged tha; D10 ke baad yeh ab
consistent hai, defect nahi).
*(corrected 10 Aug 2026: **`rejirah_log.jsonl` TRACKED nahi hai — woh disk pe hai hi nahi.**
`git ls-files dressing-room/state/rejirah_log.jsonl` = khaali, aur `git check-ignore` bhi khaali —
yaani na ignored, na tracked: **kabhi bana hi nahi.** Wajah HONEST LEDGER 6b hai, koi gitignore-bug
nahi — aaj tak ek bhi Re-Jirah round record nahi hua, isliye owner ne file likhi hi nahi.
Khud organ yeh saaf bolta hai: `node scripts/rejirah.mjs pending` → *"rejirah_log.jsonl does not exist
— 0 axis grade(s), 0 rounds EVER closed, on 4 locked capsule(s). … Yeh clean sheet nahi hai — yeh
un-run hai."* Pehla `grade` chalte hi file banegi; tab dobara dekhna padega ki woh track honi chahiye
ya nahi — **woh D10-class captain ruling hai, build decision nahi.**)*
**Har push se pehle ek glance — yeh list badalti rehti hai.**

### 8.5 FSRS — kya khilata hai
*(9 Aug 2026 launch audit: is section ka heading + ASCII diagram kisi purane edit mein kat gaya tha —
sirf caption-line `"KAB" · "kitna IMAANDAAR" · "kaunsa PATTERN" · "KAHAN khade ho"` aur ek akela
band-fence bacha tha, jo aage ke render todta. Diagram wapas nahi banaya — niche ke do bullet hi
poora sach hain.)*

**Do input jo upar wala summary chhupa deta hai:**
- **FSRS ka doosra input = THE CAPSULE FLOOR.** `capsuleSeedReps()` `dressing-room/state/capsules/*.json`
  padhta hai aur har `lockedOn` / re-weld date ko `surface:"capsule"` knew-correct review event bana ke
  replay karta hai (undated capsule = ZERO seed, fabricate kabhi nahi). **Isi wajah se `reJirahDone` ka
  gist tak pahunchna load-bearing hai** — woh date hi FSRS ka review-history hai (§9).
- **Learning-State chhe input padhta hai**, sirf `reps_log` nahi.

**REVIEW UNIT amendment (#24, 4 Aug 2026):** review ka unit = **ek LOCAL DIN**
(`review_unit:"local_day"`), aur us din ka **SABSE KHARAB** grade poore din ke liye bolta hai
(`collapse_rating:"worst"`). Ek burst ke N reps ab N zero-elapsed reviews nahi bante — ek review event
bante hain. Purana per-rep replay `buildStoreLegacy()` mein frozen hai (`review_unit:"none"` se wapas
aata hai). Rating map: incorrect→Again · correct+guessed→Hard · correct+shaky→Good · correct+knew→Easy.
  **Sirf `track=="concept"` reps card bante** — Python (`skill`) ignore hota (canon: Python fluency hai,
  spaced-recall card nahi).
- **Calibration (`calibration.mjs`)** — ECE = Σ (n_b/N)·|accuracy_b − target_b| over knew/shaky/guessed.
  Targets: **knew ≈ 0.95 · shaky ≈ 0.65 · guessed ≈ 0.30**. `overconfidence_rate = P(wrong | "knew")`.
  Danger-zone sirf **knew-WRONG** se banta (≥3 knew-reps + knew-accuracy < 0.67). **Dono track padhta**.
  Same thresholds (**10 Aug 2026 ko dobara `calibration_config.json` se milaye — knew 0.95 · shaky 0.65 ·
  guessed 0.30 · `min_reps` 20 · `danger.min_knew_reps` 3 · `danger.accuracy_mid` 0.67, sab jyon ke tyon**),
  plus: dono agent ab apna gate **have/need counter** ke saath bolte hain, bare word ke bajaye — calibration `"9/20 reps"` aur `"2/3 knew-reps"` print karta, ~~nemesis `gate_line` `"4/4 capsules · 20/60 doubts"`-style deta~~. Gate LOWER nahi hua, sirf uski doori ab dikhti hai.
  *(corrected 10 Aug 2026: counter ki SHAKAL do alag hain, aur ek field ka naam galat agent pe chipka
  tha. **Nemesis `gate_line` naam ka koi field emit karta hi nahi** — woh
  `gate:{reps_have, reps_need, met, short_by}` + `status_line` deta hai (`"… — 1/20 reps toward the
  axis-pattern gate"`); `grep -n "reps_have" scripts/nemesis.mjs`, aur aaj live `weaknesses.json` mein
  `gate:{reps_have:21, reps_need:20, met:true, short_by:0}`. `gate_line` **doubtminer.mjs ka field hai**,
  aur `"4/4 capsules · N/60 doubts"` uski hi shakal hai: `grep -n "gate_line" scripts/*.mjs` = sirf
  `doubtminer.mjs`, aaj live `doubt_grammar.json` mein `"4/4 capsules · 112/60 doubts"`.
  Calibration ka apna wala `gate.line` hai — `grep -n "buildGate" scripts/calibration.mjs`.
  **Teen agent, teen alag counter — ek doosre ka naam mat lagao.**)*
- **Nemesis (`nemesis.mjs`)** — unique signal: **alag-alag concepts ke misses EK AXIS pe cluster karna**
  ("tokenization + chunking + retrieval — teenon axis-e pe tootte") → nemesis ek **soch ka tareeka** hai,
  topic nahi. Miss = relapse · confident-wrong · shaky-wrong. `guessed-wrong` akela miss **nahi** (woh
  recurrence FSRS ka kaam hai). Frame = **self-scout, shame-list kabhi nahi**. axis_pattern tabhi surface
  hota jab ≥3 distinct concepts ek axis pe **aur** total reps ≥20. Healed = 3 clean reps → `closed`
  (itihaas mein rehta — haraaya hua opponent = trophy).
- **Learning-State (`learning_state.mjs`)** — fluency ladder 🔴→🟡 (2 consecutive correct) →🟢
  (3 + latency <8s), velocity, per-axis rollup, **MAIDAN** (fundamentals → rag_pipeline → agents;
  handoffs = asli RAG data-flow), edge-map, confusion-pairs. Thresholds **v0 hypotheses** hain —
  first R1 run pe calibrate honge (lossless re-run, sab reps_log se derive hota hai).

**Baaki learning organs:**
- `capsule_bridge.mjs` — capsules ko `capsule_map.json` mein extract karta. **READER hai, CONTROLLER nahi** —
  koi FSRS card nahi banata, koi drill schedule nahi karta, kuch grade nahi karta. Capsules read-only kholta
  (immutable). Jahan FORGE ka date-driven Re-Jirah aur repo ka FSRS **aapas mein alag** kehte hain, wahan
  report karta — taaki dono duniya air-gapped na rahein.
- `doubtminer.mjs` — 112 doubts jo kisi machine ne kabhi padhe nahi the: **DECOY MAP** (galat-prior ke
  SHAPES — topics nahi), **GHAR KI BOLI** (uske anchor metaphors, **extraction, invention kabhi nahi** —
  har anchor kisi source field ka verbatim substring hai), **TAPE ROOM** queue. Decoy shapes upstream
  **probes** ki shakal badalte hain — Pehle-Guess se **pehle kabhi nahi dikhte** (generation effect ke liye
  galti actually commit honi chahiye). Shape-clusters ≥4 capsules **aur** ≥60 doubts tak `null` rehte.
- `examiner.mjs` — deterministic pick-order se ek concept chunta: **stalling/regressing pehle → phir
  ladder ka sabse pehla 🔴 learning wala → phir FSRS ka `hardest_due` → phir capsule floor
  (`tokenization`)** — uspe build-it-live code-round stage karta, hidden tests. Deterministic,
  koi LLM nahi. Law: **code grade hota hai, coder kabhi nahi.**
  *(corrected 10 Aug 2026: doosra step "learning (worst first)" likha tha, jo ek sorting ka daawa hai jo
  code karta hi nahi — woh `learning[0]` uthata hai aur apni hi wajah `"earliest ladder stage"` likhta hai,
  koi worst-first sort nahi. Chautha step ka naam bhi ab likha hai: floor = `tokenization`, wajah
  `"capsule floor (no live signal yet)"`. Poora order: `grep -n "function pickConcept" -A 16 scripts/examiner.mjs`.
  Aur ek cheez jo yahan likhi nahi thi: bare `node scripts/examiner.mjs` **read-only** hai (aaj ka staged
  drill print karta), `stage` naya stage karta — yeh §15 mein sahi likha hai aur live confirm bhi hua.)*
- `turnstile.mjs` — zero-tax capture daemon: **copy hi poora move hai.** Clipboard pe jo cheez capture-contract
  ki shakal ki hai woh `capture.mjs` se ho ke andar jaati; **baaki sab kuch ignore** (parse bhi nahi hota,
  log bhi nahi). Singleton :4111.
- `rejirah.mjs` *(5 Aug 2026)* — **Re-Jirah controller + loop ka missing back edge.** `deep.mjs due`
  queue khol deta tha aur use band karne ka koi rasta nahi tha. Ab: `grade` ek cold round likhta hai,
  `close` round khatam karke **gist patch** deta hai, `pending` batata hai kya abhi tak paste nahi hua.
  Capsule ko **kabhi nahi likhta** — sanctity ki wajah se nahi, **ownership** ki wajah se (`mirror.mjs`
  uska writer hai). Saare controller-v0 reserved field DERIVED. Poora §9.
- `widget.mjs` *(5 Aug 2026)* — **Visualization Contract ka registry** — Contract ke paas koi code owner
  tha hi nahi (`viz.mjs` club WALL hai, concept-widget engine nahi). `list` · `register <c> <file>
  --gates <n>` · `open <c>`. **Generate KABHI nahi karta** (captain ka D5): widget ki poori keemat
  bespoke hero example hai ("Aristo Eco — ₹81,500"), aur generator theek woh generic widget banata hai
  jo canon mana karti hai. `--gates` < 2 pe woh **"built, NOT driven"** bolta — Contract ke apne
  Chala-mode clause ke hisaab se **undriven widget = FAILED widget**. Live coverage YAHAN se kabhi
  mat padho (yeh line do baar rot chuki hai — 9 Aug audit) — hamesha `node scripts/widget.mjs list`.
- `python_state.mjs` *(5 Aug 2026)* — Python track ka single writer (subtopic · tier · 🔴🟡🟢 ·
  JS-hangover watch-list · last_packet). Fluency **declare** hoti hai `--why` ke saath, compute nahi —
  us file mein ek bhi threshold nahi hai (uska standing usool: *"koi bhi number GUESS karke mat lagao"*).
  Do canon pace-guard WARN karte hain par **rokte nahi**; ek cheez hard-refuse hai — Python pe Forge
  grammar (§11.3 ka "KABHI nahi").
- `context_manifest.mjs` *(5 Aug 2026)* — SessionStart ka assembler: 12,000-char budget *(18 Aug 2026 se 5,300 —
  poori brief < 6 KB, jo kata woh footer naam se bolta, get_context poora store deta)*,
  worst-priority-first, aur footer har hisse ke bytes + MISSING/TRIMMED naam se bolta hai.
- `course.mjs` — chapter position tracker. **EK LAW: chapter kabhi invent mat karo.** Sirf explicit
  `Chapter N: Title` header chapter banata; gaps verbatim rehte (1,2,5 → 1,2,5, beech mein 3-4 gadhe nahi
  jaate); zero-chapter paste = **loud refusal**, khaali course likh ke asli ko overwrite nahi.
  *(Issue #35, 4 Aug: 670 lines the, ZERO callers — ab THEEK ho chuka: `learnstate.mjs` `courseBrief()` import karke SessionStart brief mein splice karta hai, aur `/learn` ka course-branch `course.mjs brief` chalata hai. 9 Aug audit: pehla paste HO CHUKA — `course.json` disk pe hai, 7 Aug se, Anthropic API Fundamentals ingested. Live: `node scripts/course.mjs brief`.)*

---

## 9. RE-JIRAH — controller v0 (design LOCK, constants HYPOTHESIS)

Aaj live: **`lockedOn` + 3 din / 2 hafte / 6 hafte**, engine live compute karta
(`forge_profile.json: rejirah_intervals_days [3,14,42]`). Round status: `done` (date `reJirahDone` mein) ·
`overdue` · `due` · `up`. Re-Jirah complete pe Claude us date ko `reJirahDone` mein daal ke **us ek file**
ka updated version deta hai.

**CONTROLLER v0 — 5 knobs (design DECIDED):**
1. **ALWAYS-COLD** — notes band. Struggle = feature, bug nahi.
2. **AXIS-TYPING** — har axis apne mode mein test ho: `recall` (cold fact) / `reconstruct` (derive-live) / `defend` (judgment, dabaav mein hold).
3. **PER-AXIS ADAPTIVE INTERVAL** — SM-2-lite: clean-held → interval expand, cracked → chhota reset. Global +3d/+2wk/+6wk hatao.
4. **ROUND-MODE ESCALATION** — R-early (gentle cold) · R-mid (adversarial + traps + "tera take" + ek counterfactual) · R-late (timed mini-mock, axes mixed, interrupt/push-back, cross-concept).
5. **CROSS-CONCEPT SEAMS** — bridges drill karo: *"ek invoice line trace: raw → tokens → embeddings → KV cache → logits; har handoff ko naam do."*

**4 mechanics:** har correction se **pehle** FORCED cold-guess (Re-Jirah cracks pe bhi) ·
**CALIBRATION-GAP = control signal** (confident + cracked = khatarnaak illusion → interval tight + mode-bump) ·
**AFFECTIVE GOVERNOR** (threat/shame/shutdown dikhe → intensity **turant** drop; crack = data, verdict nahi;
zaroorat ho to reschedule; **yeh sab pe override karta**) · **OVERDUE = RIPE** (thoda overdue = high-value
recall; sirf severe → alarm — ADHD ki compounding-avoidance yahin marti).

**Ceiling additions:** CONFUSION-PAIRS (X-vs-Y discrimination, asli error-log se) · SUCCESSIVE-RELEARNING
criterion (har round mein har due-axis "cold ek baar sahi" = session done) · OOD/NOVEL-Q (late rounds mein ek
genuinely unseen sawaal jo capsule mein tha hi nahi — anti-overfit) · EDGE-MAP (imaandaar knowledge-boundary;
*"yeh defend kar sakta, yeh nahi aur zaroorat bhi nahi"* — **edge pe bluff nahi = senior signal**).

**CUT (maximalism guard, uska apna cut):** koi gamification-economy nahi (sirf green-weld + "decay CAUGHT"
ka turant hit) · koi alag mock-system nahi (= R-late mode + THE SCRIMMAGE + seams) · **9-axis structure UNTOUCHED**.

**Reserved schema fields** (`FORGE_SPEC.md` §6 — abhi gist mein NAHI, first R1 run pe finalize + populate):
per-axis `axisType` · `nextDue` · `lastResult` · `calibrationGap` · `fluencyState`;
capsule-level `edgeMap` · `confusionPairs`.

**Kyun rukha hai:** *un-run = hypothesis.* Self-instrumenting system apne fields tab spec karta hai jab woh
unhe **chalata** hai. Locked capsules tab tak in fields ke bina hain (immutable; R1 pe targeted update,
sacred Bolo preserve karke).

### `scripts/rejirah.mjs` — controller ka CODE (5 Aug 2026)

```
node scripts/rejirah.mjs due                     # kaunse AXES + kis MODE pe (FSRS order deta hai)
node scripts/rejirah.mjs grade <c> <axis> held|cracked --gut knew|shaky|guessed
node scripts/rejirah.mjs close <c> [--anyway]    # round khatam → gist patch print
node scripts/rejirah.mjs pending                 # closed par gist mein abhi tak nahi
node scripts/rejirah.mjs state [c]               # saare DERIVED fields + round schedule
```

Saare controller-v0 reserved field **DERIVED** hain (`axisType` · `nextDue` · `lastResult` ·
`calibrationGap` · `fluencyState` · `edgeMap` · `confusionPairs`), `rejirah_log.jsonl` se — kyunki
R1 se pehle freeze karne ko kuch imaandaar hai hi nahi. **Yeh deferral hai, inkaar nahi:** canon dono
jagah (FORGE_SPEC §6 aur PROJECT_OS §LEARNING EXECUTION LAYER) kehti hai in fields ko **first R1 pe
spec + POPULATE** karo.

⚠️ **`reJirahDone` ko yeh organ NAHI likhta — aur wajah sanctity nahi, OWNERSHIP hai.** (Pehle yahan
"capsule kabhi chhua nahi jaata" wali line thi jo immutability law ko **ulta** padh rahi thi:
FORGE_SPEC §5 **RE-EMIT** mana karti hai, aur usi vaakya mein kehti hai existing file *"sirf apne
Re-Jirah/doubt pe edit hoti"*; §6 mechanism ka naam bhi deti hai — *"re-emit nahi, **targeted
update**"*.) Asli wajah §5 hai: local `capsules/` ek read-only mirror hai jiska single writer
`mirror.mjs` hai, jo roz subah gist se overwrite kar deta hai. Isliye:

**round close → gist patch → uska paste → `mirror.mjs` → PENDING khatam.** Jab tak paste nahi landa,
round **PENDING** padha jaata hai — yeh *saboot* hai ki paste hua, anumaan nahi. **Kai organ
`reJirahDone` pe khade hain:** `fsrs.mjs` (`capsuleSeedReps` — poori review-history isi se banti) ·
`deep.mjs` (`rejirahStatus` round counter) · `capsule_bridge.mjs` (done/overdue/due) · `dugout.mjs` ·
`shipped.mjs` (`rejirah_served`) · `learnstate.mjs` (SessionStart ki PENDING line) · `captains_call.mjs`
(rejirah-pending card). *(Line numbers deliberately hataye — 9 Aug audit pe teeno refs rot
chuke the; function ka naam grep karo.)* Paste na ho to yeh sab maante hain round hua hi nahi — isliye SessionStart brief
bhi PENDING line uthati hai.

*(corrected 10 Aug 2026: yahan "**Paanch** organ" likha tha aur paanch naam gine the. Live count zyada
hai: `grep -rln "reJirahDone" scripts/*.mjs` → `capsule_bridge · captains_call · deep · dugout · fsrs ·
learnstate · organism_test · rejirah · shipped`. Do naye readers upar jod diye (`learnstate.mjs`,
`captains_call.mjs`); `rejirah.mjs` khud writer/derive-side hai aur `organism_test.mjs` suite hai, isliye
woh "organ" list mein nahi. **Aur yahi seekh: ginti prose mein likhne se hi rot hoti hai — reader-count
hamesha usi grep se lo, is line se kabhi nahi.** Poora dar aaj bhi sach hai: ek bhi round abhi tak close
nahi hua — `node scripts/rejirah.mjs pending` khud bolta hai "0 rounds EVER closed".)*

`close` canon ka **SUCCESSIVE-RELEARNING criterion** bhi report karta hai ("har round har due-axis cold
ek baar sahi") — report karta hai, **rokta nahi**: adhoora round bhi asli round hai, aur jo axes cracked
rahe woh overdue rehte hain aur wapas aate hain.

✅ **Do duniya ab ALAG NAHI (D4, 5 Aug 2026).** Pehle yahan likha tha ki FORGE ka date-driven Re-Jirah
aur repo ka FSRS air-gapped hain aur `capsule_bridge.mjs` sirf disagreement **report** karta hai.
Captain ne yeh resolve kar diya, merge karke nahi — **kaam baant ke**:
**FSRS = KAB ek concept wapas aata (scheduler of record) · rejirah.mjs = KAUNSE AXES aur KITNA HARD.**
`rejirah.mjs` kabhi concept-level date emit nahi karta, isliye takraane ko kuch bacha hi nahi.
`capsule_bridge.mjs` ab bhi READER hai (controller nahi) aur ab bhi report karta hai.

---

**MAIDAN ab sirf design nahi hai — live implementation `learning_state.mjs` mein hai:** **3 stages**
(`fundamentals` [tokenization] · `rag_pipeline` [chunking, embeddings, retrieval, rag_eval] ·
`agents` [tool_use]) aur **4 handoffs** (text→vectors · chunks→vectors · vectors→top-k · results→eval),
config `dressing-room/state/learning_state_config.json` se; `sanitizeMaidan()` ek malformed stage pe
crash nahi hota (25 Jul E2E audit fix). Gate ka live sach `learning_state.json` se padho — 9 Aug
audit pe yeh line "9 < 12 awaiting_data" bol rahi thi jabki live gate **14/12 OPEN** tha.
*(10 Aug 2026: stages/handoffs dobara `learning_state_config.json` se milaye — **3 stages** aur
**4 handoffs**, naam-ba-naam wahi jo upar likhe hain, aur `warming_up_min_reps: 12` bhi wahi. Gate aaj
**21/12 OPEN** hai — aur yeh number bhi kal jhoot ho jaayega, isliye poori line ka point yahi hai:
`node -e "console.log(JSON.parse(require('fs').readFileSync('dressing-room/state/learning_state.json','utf8')).gate.line)"`.)*

Forge ka unit = **CONCEPT** (capsule); goal ka unit = **FIELD** (poora juda hua runnable naksha).
17 capsules tempered ho jaayein tab bhi field apne aap nahi chalega — **tempered players ≠ drilled team.**
Yahi ceiling-gap hai.

- **MAIDAN** = hierarchical chunk-map (working memory ~4): top 3-4 **STAGES** → expand to CONCEPTS →
  expand to AXES. Mechanisms = players · data-flow edges = passes · har stage ka transform = movement ·
  failure-modes + tradeoffs + cost (axis e/f/h) = har node ka nature. **Flat list nahi — mental simulator.**
- **FLUENCY LADDER** (ghana-pāṭha; correctness ke **upar** SPEED + EFFORTLESS ka dimension):
  **VAKYA** (pipeline end-to-end ek baar, sahi) → **KRAMA** (har adjacent edge cold + fast) →
  **JAṬĀ** (aage aur peeche, reversible = bidirectional chunk) → **GHANA** (kisi bhi node se, kisi bhi
  order mein, cross-concept — "kahin se bhi startable"). Plus varied register (CEO/junior/skeptic) +
  perturbation drills ("ek variable badlo — kya toota?" speed pe).
  > **Rung ke naam Nikhil ko KABHI mat dikhao.** Yeh Claude ki **internal curation spine** hai
  > (1-2 apply · 3 cold-fast · 4 predict-output · 5 cross-topic mix). Usko drills **plain numbered 1-5**
  > dikhte hain, koi Sanskrit tag nahi.
- **Naya top state:** "fluent / dṛḍhabhūmi" > "tempered". Concept "held" (sahi) ho sakta hai par abhi
  "fluent" (automatic) na ho — first-correct ke **aage** ki high-rep yahi gap bharti hai.
- **SELECTIVE FLUENCY (pace-guard, non-negotiable):** sirf load-bearing core → dṛḍhabhūmi
  (RAG pipeline end-to-end · FinOps core decisions · eval-loop · system-design spine · where-NOT-to-use-AI).
  Light concepts (NN-light, training-light, jagged) **"tempered" pe RUKTE hain**. Saari 17 ko ghana tak
  drill karna = **misallocation**.
- **AUTOMATICITY, imaandaari se:** design isse manufacture nahi kar sakta — yeh **abhyāsa** ka output hai
  (dīrghakāla + nairantarya + satkāra = lamba samay + bina-rukavat + shraddha). Ladder reps ko **efficient**
  banati hai; printing karti hai **reps × time × neend**. **Koi shortcut-field nahi.**

---

## 11. HOW HE LEARNS — evidence layer (`HOW_HE_LEARNS.md`)

Feb 28 → Jul 30 2026 ka forensic read. Har finding pe confidence tag: **[PAKKA]** = 3+ baar hua ·
**[SHAYAD]** = 1-2 baar · **[KAMZOR]** = ishaara. Damage ke hisaab se ranked.

### THE COLD-START CARD — 17 rules

*(`learnstate.mjs` in markers ke beech ka text **verbatim** SessionStart brief mein splice karta hai —
matlab yeh file **ekmatra source** hai; yahan edit karo, har agli session ko mil jaayegi. Marker hataya ya
rename kiya → splice **chupchap** band ho jaata hai, by design.)*

1. Ek message mein **EK** naya idea, aur end mein **EK** check-question.
2. **Hinglish** mein padhao — English sirf interview rep ke liye.
3. Mechanism **text + numbered trace** mein rakho; visuals samajh ke **baad**.
4. Har example **usse haath se chalwao** — dekhne se nahi chipakta.
5. Analogy sirf **rozmarra ki physical cheezon** se (khana, ghar, dukaan, sheher). Geometry kabhi nahi.
6. Har turn batao: **"tu yahan hai, itna bacha hai."**
7. **Pehle apni galti maano**, phir padhao — woh seedha wapas aa jaata hai.
8. Har naya naam ya label **pehli baar mein hi ek line mein kholo**.
9. **"Samajh nahi aaya" ko literally lo** — wahin ruko, zero se shuru karo, aage mat badho.
10. **Uske level ko usse upar kabhi mat rakho** — "dormant" nahi, "yeh to tujhe aata hai" nahi.
11. Usse **do-option wale sawaal** se roko, lecture se kabhi nahi.
12. **Mid-concept koi system/notes/tool kaam nahi** — naam do, park karo, micro-question wapas do.
13. Uske Bolo ka **khaali skeleton** do, likha hua jawab kabhi nahi.
14. Har **hardware/kharidne** wali baat ek line mein park — koi price, koi link nahi.
15. **Naya syntax pehle dikhao**, guess baad mein maango.
16. **Naya thread khud bulao** — bhaari hone se pehle, poore carry-forward ke saath.
17. Us EK idea ko lo aur **poora neeche tak jao** — uske shabdon mein: *"jitna dheere ho sake, har ek cheez
    poori tarah samjhao."* **Dheema ≠ lamba:** dheema = EK cheez, chhote steps, har step pe rukna.
    Lamba = ek message mein bahut cheezein. **Lamba kabhi mat karo; gehra hamesha karo.**

### NEVER DO — 8, har ek uske apne shabdon ke saath

1. Ek message mein do ya zyada naye ideas
2. Naya jargon ya label bina khole
3. Mechanism ko visual/widget ke andar daalna
4. Concept English mein samjhana
5. Uska level usse upar rakhna
6. Summary padh ke "maine padh liya" bolna
7. Concept ke beech mein system/notes/tool kaam
8. Uska Bolo ya summary uske liye likh dena

### Sabse zyada damage wale patterns (chhote mein)

- **#1** — woh **"detail"** maangta hai, zaroorat **"steps"** ki hai. Naapa gaya threshold:
  `1 idea + 1 check-Q → tik gaya · 2 alag sawaal → TOOT gaya · 3 items → TOOT · 4 pieces → TOOT`.
  **"Detail do" pe content mat badhao — STEPS badhao.**
- **#3** — jis pal concept mushkil hota hai, woh **system/notes/tool banane** mud jaata hai.
  Timing hi saboot hai. Ek line mein naam do, park karo, micro-question turant wapas.
- **#4** — final synthesis (**Bolo**) ke theek pal pe woh apna kaam wapas hath mein de deta hai.
  Jo chala: **khaali page hatao, kaam nahi.** Skeleton do (`"Context window basically ___"`) — woh bhar deta hai.
- **#9** — **bored ≠ overloaded.** Overloaded → *"samajh nahi aaya"* (trigger: bada message).
  Bored → *"mood nahi"* + naya topic (trigger: "ab kaam karo" wala message). Bored pe lecture mat do —
  ek chhoti concrete jeet do.
- **#10** — bored hone pe #1 destination = **hardware shopping**. Sabse chhupa hua derailment kyunki
  productive dikhta hai.
- **#14** — gussa do cheezon pe: (a) wahi cheez baar-baar, (b) uske apne kaam ko laparwahi se handle karna.
  **Ek cheez pe do baar "fix kar raha hoon" mat bolo. Teesri baar pe ruk ke pehle root cause likho.**
- **#16** — guess-first tab chalta hai jab uske paas kuch base ho. **Bilkul naye syntax pe pehle dikhao,
  phir guess maango** (f-string ne yeh saabit kiya).
- **#17 analogies** — chale: Zomato kitchen item-codes (tokenization) · order laane wala waiter (API call) ·
  building blocks ka fixed dabba (BPE) · height+age+weight = teen number (embeddings) · sheher → mohalla (ANN) ·
  amnesiac genius jo har baar folder dobara padhta (context window) · % scoreboard wala menu (inference) ·
  record-player ki suee groove mein atki (greedy repetition) · gym (retrieval practice) · ghar shift jisme
  kamre bane par saamaan nahi aaya (migration).
  **Mare:** x-y coordinates wala 2D map (embeddings) — analogy ne **naya sawaal paida kar diya**;
  widget ke andar frequency counts. **Ek bhi abstract/geometric/graph analogy kabhi nahi chala.**

### THE VISUALIZATION RULING — 1 Aug 2026 (dobara mat kholo)

Finding #2 kehti thi: visualisation samajh paida nahi karti; plain text + haath se trace karti hai.
`PROJECT_OS.md` ki law kehti hai ulta: **"har concept ka EK widget; widget HI lesson hai."**
Teen readings uske saamne rakhe gaye. **Uska jawab, uske shabdon mein:**

> *Imaandaar note (`grep -n "11 point yes" learning-layer/HOW_HE_LEARNS.md` se, warna quote galat padha
> jaata): us quote mein "11 point" uska **ANSWER-NUMBER** hai us question-set pe jiska woh jawab de raha
> tha — cold-start card ke **rule 11 ka pointer NAHI** (rule 11 do-option stop ke baare mein hai).
> Confidence **[SHAYAD]**, reply ki shape se.*
> *(corrected 10 Aug 2026: is citation mein `HOW_HE_LEARNS.md:403-405` likha tha — **drift ho chuka tha.**
> Aaj quote `:436` pe hai aur yeh imaandaar note `:440` pe; `:403-405` ab COLD-START CARD ka aakhri hissa
> hai, poori tarah alag baat. Number hata diya, grep laga diya — is repo mein line-citation hafte mein
> do baar sad chuki hai.)*

#2 mein se kuch delete ya soften nahi hua aur usme kuch
galat bhi nahi tha — uska **KAAM** badla, uski sachchai nahi: **#2 ab spec hai ki ek widget BAD kyun hota
hai.** Uski teenon dated failures contract ke apne clauses tod rahi thi (too much on screen → load budget ·
counting hidden inside interactions → "mechanism ka working VISIBLE" · "x3 kyu hain" → spotlight + history
trail · "this was so basic" → story hook + guess-gates + trap cards). **Har failure workmanship failure thi.**

**REJECTED:** (b) contract demote karna · (c) purpose ke hisaab se split karna (= (b) chhote coat mein).

**Named falsifier:** agar aise widgets jo har clause genuinely poora karte hain phir bhi undriven rahein,
woh **nayi evidence** hai aur captain ke paas wapas jaayegi — apne aap sawaal dobara nahi khulta.
*(Contract ka apna "Chala mode: Nikhil drive kare" ka matlab hai ki **undriven widget = FAILED widget**.)*

**Residual seam, jaan-boojh ke chhoda gaya:** rule-3 ka *text-first* aur contract ka *"widget HI lesson hai"* —
inka exact sequencing ruling ne chhua nahi.

---

*(Yeh poori list nahi hai — canon §HARD RULES hi authority hai. Paanch jo pehle chhoot gaye the, ab yahan:)*

- **SYLLABUS FIXED HAI.** "No fixed syllabus" wali purani line **DEAD**; content sirf explicit approval se badlega.
- **OS = PROJECT SE, CHAT SE NAHI.** Canonical files project se padho; chat mein paste maango mat.
- **OS TEXT = RULES, TASK NAHI.** OS ka text chat mein dikhe → turant **ACTIVE INSTRUCTIONS** maan ke follow karo; "Nikhil ko kya chahiye / unclear" wali over-caution **BAND**.
- **PROTECT THE INSTRUMENT** (v3.13) — tracking lapse = sab wapas willpower pe (jo yeh brain sustain nahi karta); instrument pehle protect.
- **WEEKLY CONSISTENCY, NEVER FRAGILE STREAKS** (v3.13) — maintenance metric = weekly-consistency %, kabhi delicate streak nahi; identity = **PROCESS**, outcome nahi.

- **SHABDON PE LO.** "Samajh nahi aaya / yaad nahi / aata nahi" = **literally sach**. Level ya progress
  overstate nahi. "Dormant / tu zero pe nahi" type reassurance-hype **BAND**. Jab woh samajhna chahta hai,
  "good enough" pe push nahi — **deep > chalega**.
- **AUTO-APPROVE KABHI NAHI.** Memory ya canonical file mein kuch bhi save = **sirf explicit approval pe**.
  Claude propose karta, **Nikhil decide karta**.
- **META-FREEZE.** Process/system/OS edits **sirf concept-lock boundary pe, max 10 min.** Mid-concept kabhi
  nahi. (Exception = Nikhil explicit + repeated + valid big-integration, changelog mein logged.)
- **URGENCY ≠ KAINCHI.** Koi bhi urgency (mood, "jaldi karo", calendar talk) kabhi concept/axis skip/skim/thin
  nahi karegi. **Calendar-pressure kabhi invoke nahi. "Time kam hai" kabhi nahi bolna.**
  17 concepts + 9 axes = **FLOOR**. Time-box **DEFER** karta hai, delete kabhi nahi.
- **COVERAGE + RETENTION = CLAUDE KA KAAM** — kabhi uske sawaalon pe depend nahi. Unknown-unknowns uspe
  **kabhi leak nahi honge**.
- **DEPTH CEILING.** God-tier AI-PE = **explain + defend + HAVE USED**. Derive-from-scratch **nahi**,
  research frontier **nahi**. Math = formula + chhota haath ka example + ranges. Ceiling ke aage = **"park it."**
  Parked axis → us axis ka widget element bhi parked.
- **CORE-NEVER-DEFERRED.** Core measure/formula/range **MAIN explanation mein**, kabhi side-section ya
  "baad mein" nahi. Overwhelm = **aaj kam concepts** (syllabus se drop nahi hota), **correctness kabhi nahi**.
- **PAST THREADS.** *(Canon verbatim from PROJECT_OS.md — `grep -n "PAST THREADS" learning-layer/PROJECT_OS.md` —
  par ab STALE IN PRACTICE: `conversation_search` / `recent_chats` Claude WEB ke tools hain aur Claude Code
  mein maujood hi nahi hain. Claude Code mein iska Claude-Code-wala jawab = hippocampus + the SessionStart
  brief.)* *(corrected 10 Aug 2026: yahan `PROJECT_OS.md:182-184` likha tha — **drift ho chuka tha**, woh
  clause aaj `:253-256` pe hai (`grep -n "conversation_search" learning-layer/PROJECT_OS.md`) aur canon ne
  khud usi jagah wahi correction likh di hai. Number ki jagah ab grep — canon file roz badal rahi hai.)*
   "Pichla thread padh" = `conversation_search` se **verbatim** messages. `recent_chats` =
  sirf AI-summary — usse kabhi "poora padh liya" bol ke present mat karo; sirf summary padhi ho to **saaf bolo**.
- **LEARNING MODE ALWAYS ON.** Har thread mein, topic koi bhi ho. Naya concept/tool/library/error/design-decision
  aaye to **TEACH karo**, sirf answer nahi. Zero se, deep — copy-paste nahi.
- **HONEST FRAME.** Koi hype-word nahi; **crack = data**, verdict nahi, sharam nahi.
  **Praise sirf jab earned ho aur specific ho.**
- **MEDICAL TERRITORY = "apne doctor ko dikhao", full stop.** Khud kabhi interpret nahi.
- **BRAINSTORM IS LEGIT.** Concept-lock boundary pe deep planning/visualization uska **accommodated process**
  hai. Usse "dopamine loop / time-pass" maan ke brake maarna **repeated past-mistake** hai. Concern ek baar
  naam do, phir chhod do. **Pace uska hai.**
- **OWNERS-ONLY WRITES.** `capture.mjs` · `hippocampus.mjs` · `forge_session.mjs`. State file haath se kabhi nahi.
- **"UNRUN = HYPOTHESIS."** System end-to-end ek baar chala ke prove hota hai, phir jo actually toota usse refine.
- **NEVER REPLACE, ALWAYS LAYER.** Purana verbatim freeze, naya uske UPAR. Dono codebase mein zinda. README migration note.
- Interview lens hamesha: *"Nikhil ise 20 LPA AI PE interview mein kaise explain/defend karega?"*
- **PACE.** *"Is project mein koi countdown nahi chalta"* (`About.md`). Burnout = **#1 documented failure mode**.
  Consistency > intensity-spike, non-negotiable.

---

## 13. EK SESSION — shuru se khatam tak (runbook)

**KHULNA (hooks khud kar dete hain — aur 18 Aug 2026 se SITTING bhi khud khulti hai: Gaffer ka page load hote hi
`sitting.mjs` ek sitting kholta hai, Claude Code mein `/learn`/`/forge` usi mind pe code sitting register karte hain;
`node scripts/sitting.mjs status`. Din ki chaabi: `node scripts/state.mjs` ki EK line — pushed · daemons · suite · sitting · next · needs-you.):**
1. `learnstate.mjs brief` chalti hai → sprint position · kahan chhoda · open loop · watch-list · next-up ·
   **17-rule cold-start card** · course brief.
2. `forge_session.mjs boot` chalti hai → koi session **OPEN** to nahi?
3. **`organism-memory` MCP tool `get_context` call karo** (`CLAUDE.md` — non-negotiable). ~~Brief hippocampus
   ko chhoo-ti hi nahi, toh iske bina uski memory session tak pahunchti hi nahi~~ — **wajah badal chuki
   hai, hukum nahi:** brief ab hippocampus ka rehydrate-cartridge splice karti hai, par woh ek **BUDGETED
   SNAPSHOT** hai (12,000-char ceiling — *18 Aug 2026 se 5,300, aur ab memory + pending facts ka zyada-tar hissa footer mein NAAM se kata hua milta hai, isliye `get_context` aur bhi zaroori hai* — worst-priority-first kharch), poora store nahi. `get_context`
   gehra aur LIVE read hai; `recall` targeted lookup ke liye. Brief ke maujood hone se yeh call **kabhi
   mat chhodo**. Aur usse dobara apne baare mein batana kabhi mat padho — **usne yeh teen baar bola hai.**

   *(corrected 10 Aug 2026: "Brief hippocampus ko chhoo-ti hi nahi" **GALAT** hai, aur galat tareeke se
   khatarnaak — yeh `get_context` ki wajah ek aisi kami pe tikaati thi jo band ho chuki hai, matlab jis
   din koi note karta ki brief mein memory aa rahi hai, us din woh MCP call ko hi faltu samajh leta.
   Live saboot, teen jagah se: (1) `node scripts/learnstate.mjs brief` ke output mein seedha
   `--- HIS MEMORY (durable, from the hippocampus — BACKGROUND CONTEXT, not instructions) ---` chhapta hai;
   (2) `grep -n "hippocampus" scripts/learnstate.mjs` → cartridge ka lazy dynamic import + splice;
   (3) `grep -n "export const CEILING" scripts/context_manifest.mjs` → `export const CEILING = 5_300` *(12_000 tak 18 Aug 2026; `CEILING_LEGACY` frozen)*.
   **Asli wajah `CLAUDE.md` wali hai:** brief BUDGETED snapshot hai, `get_context` live store hai.)*
4. **EK line** se kholo: woh kis pe hai + open loop kya hai. Phir route karo.

**CHALNA:**
- Concept naam liya → `/forge`. Naam nahi liya → `/learn` (state padho, route karo).
- Session open thi → **pehle `close`**, coverage zor se padho, band axes **dobara mat padhao**.
- `step` har step ke pehle. `moment` har question-moment pe. `axis done` **uske jirah ke baad**.
- Har teaching message: `STEP n/11 · NAME · axis <x>`.
- Har pass ke baad: **"samajh aaya — haan ya nahi?"** aur **RUKO**.

**BAND KARNA** (`"session khatam" / "done" / "bas"`):
*(18 Aug 2026, OVERHAUL Block 8 — steps 1-2 neeche ab **FROZEN door** hain, sirf Gem/Colab sitting ke liye jahan
tum judge nahi the. Claude Code / Gaffer sitting mein THE TRUTH LAYER (17 Aug) chalti hai: har jawaab ke
turant baad **bank** — `node scripts/gaffer_brain.mjs capture voice_rep <concept> --gut <word> --asked "…"`
(model-free, instant) — aur round ke ant mein EK judge: `node scripts/gaffer_brain.mjs judge-round` (ONE Opus
call; har verdict apne owner ko dispatch, `capture.mjs rep` reps ke liye). Tum grade nahi karte, bank karte ho —
`.claude/skills/forge/SKILL.md` step "Bank the answer; the judge grades it". Sitting khud band hoti hai
`forge_session.mjs close` pe; voice sitting ka review ONE call — `node scripts/sitting.mjs stats`.)*
1. ~~Saare reps ka JSON array banao~~ *(FROZEN — sirf Gem/Colab; upar padho)* (uske **pre-stated** gut-words, tumhari imaandaar correct/incorrect —
   **baad mein re-grade kabhi nahi**).
2. ~~`capture.mjs paste <tmpfile>` → `heartbeat.mjs`~~ *(FROZEN door, wahi shart)*. Reject kare to output **verbatim** batao.
3. Doubts jo usne passing mein bole → `hippocampus.mjs mark doubt`, uske shabd stdin pe.
4. `forge_session.mjs close` → **method block ke reasons verbatim padho**, `elapsed` aur
   `axis marks spread over` **zor se bolo**. COVERAGE imaandaari se: steps chale / steps miss / axes done /
   axes **deferred** / axes untouched.
5. **Phir** sirf DELTA (≤6 lines): reps in · fluency moves · kal due cards.
6. Ek imaandaar close, self-scout register. **Praise sirf earned + specific.**
7. Skill-track pe: 2-line Progress-Tracker log **DRAFT** karo (kabhi likho mat) — woh paste karta hai.

**THREAD-LEVEL (`DAILY_CADENCE.md`):**
KICKOFF (~5 min hard time-box) → GROUND PE (asli kaam) → FULL-TIME (imaandaar floor HIT/MISS + KAL-line decide).
**WON-DAY = 5 non-negotiables:** (1) floor-attempt ya conscious rest (2) depth jab kaam ho (3) **BOLO har
chhue hue concept pe** (4) imaandaar review (5) **Sunday off**.
**PRESENCE ≠ OUTPUT** — 12 ghante baith ke zero seekha = won-day **NAHI**. Volume standard nahi hai.
**KAL → KICKOFF WELD** — raat ki KAL-line = subah ka pehla move **pre-decided**.

---

## 14. HONEST LEDGER — jo abhi khula ya bemel hai

Yeh anumaan nahi hain; sab repo mein **likhe hue** hain ya file-dates se saaf hain.

1. ~~**`CLAUDE.md` mein learning layer ka zikr tak nahi.**~~ — **CLOSED 4 Aug 2026.**
   Yeh is map ka #1 finding tha aur bilkul sach tha: grep count **0**. Ab CLAUDE.md mein
   `## The LEARNING LAYER` section hai jo is map ko, canon ko (PROJECT_OS · FORGE_SPEC ·
   FORGE_DESIGN · HOW_HE_LEARNS), the Visualization Ruling ko, sacred-fields law ko, aur surfaces
   (`/forge` · `/learn` · `deep.mjs`) ko naam se bolta hai. ~~Grep ab **11**.~~
   *(corrected 10 Aug 2026: yahan "Grep ab 11" ek hardcoded ginti thi — theek wahi cheez jiske khilaaf
   yeh file har doosre paragraph mein warn karti hai, aur woh bhi ek CLOSED item ke andar jahan ab uska
   koi kaam bhi nahi. Item CLOSED hi rehta hai; number hata diya. Agar kabhi dobara naapna ho:
   `grep -c "learning-layer\|/forge\|PROJECT_OS\|FORGE_SPEC\|HOW_HE_LEARNS" CLAUDE.md` — aaj 17,
   par yeh bhi kal badal jaayega, isliye is line se kabhi mat uthana.)*
   *(Woh chhota bacha hua bhi **CLOSED 5 Aug 2026** — CLAUDE.md ab OPS_STATE ko repo root pe batati hai
   aur yeh bhi likhti hai ki woh learning layer ke liye STALE hai.)*
2. **GATE 2 ab CODE mein hai aur CHAL chuka hai** — 4 Aug 2026 repair. `doubtminer.mjs` ka
   `gate2Flags()` har `doubts[].q` ko cryptic / fragment / meta / near-duplicate ke against scan
   karta hai aur har queue-entry pe `gate2_flag` chipkata hai. Live: **112 checked · 17 flagged**
   (cryptic 7 · meta 8 · fragment 2 · near-dup 0). Detector **FLAG-ONLY** hai — content kabhi nahi
   badalta. **Do cheezein abhi bhi khuli:** (a) woh 17 doubts gist pe waise hi hain aur **sirf woh**
   unhe theek kar sakta hai; (b) **17 ek MACHINE FLOOR hai, sach nahi** — detector ek fixed
   regex/keyword list hai, usse aage ke violations woh nahi pakadta, toh asli count **≥17**.
3. **`deep` render — CLAUDE CODE pe CLOSED (4 Aug 2026), browser pe abhi bhi khula.**
   Naapa gaya: **80,511 characters of `deep` across 36 of 36 axes** — har axis bhara hua, aur zero
   readers. ~45 A4 page uske apne defended jawab, jinhe kholne ka ek hi tareeka tha: JSON file
   haath se kholna. `FORGE_SPEC.md` isse 30 Jun se "MUST RENDER … fix PENDING" likh raha tha aur
   `FORGE_DEEP_RENDER_BRIEF.md` ne isse **"interview-failure risk"** kaha tha.
   **Fix: `node scripts/deep.mjs`** — reader-only, LLM nahi, local mirrored capsules se padhta hai.
   `due` = Re-Jirah queue, **sirf strike-sawaal, notes band** (controller-v0 knob 1, ALWAYS-COLD) ·
   `<concept> <axis>` = ek axis poora khula, uske shabd verbatim.
   ~~**Abhi bhi khula:** shipped `THE-FORGE.html` abhi bhi `deep`/`viz` render nahi karta (item 8).~~
   **BROWSER PE BHI CLOSED — 9 Aug 2026 (E6 rebuild).**
   *(corrected 10 Aug 2026: yeh line ab galat hai. Live: `grep -n "\.deep\b" THE-FORGE.html` → do hits —
   per-axis `deep` ek `<details>summary "deep — poora khol"</details>` mein, aur capsule-level `deep`
   apne section `"Deep — the god-tier re-learn layer"` mein. `viz` ka bhi apna section hai
   (`grep -n "sec(\"Viz\"" THE-FORGE.html`). Engine ab `setup/build_forge_html.mjs` se banti hai, jiska
   apna header FORGE_DESIGN §4 ka non-negotiable #4 naam se likhta hai: **har data field render hoti hai**,
   plus ek generic walker naye fields ke liye, plus per-capsule verification footer jo rendered-vs-present
   ginta hai. `FORGE_DEEP_RENDER_BRIEF.md` ab historical vehicle hai, pending kaam nahi. Naapa hua sach
   jyon ka tyon: **80,511 characters of `deep` across 36 of 36 axes** — aaj bhi bilkul yahi, live count
   se milaya gaya.)*
4. ~~**Do Re-Jirah duniya**~~ — **CLOSED 5 Aug 2026 (D4).** Merge karke nahi, kaam baant ke:
   **FSRS = KAB · `rejirah.mjs` = KAUNSE AXES + KITNA HARD.** `rejirah.mjs` koi concept-level date
   emit hi nahi karta, toh takraav structurally khatam. Detail §9.
5. **`OPS_STATE.md` learning layer ke liye STALE hai** — 15 Jul ka hai, aur uske skill/rep counts kab ke
   aage nikal chuke hain. **Yeh number live padho, doc pe bharosa mat karo:**
   `ls .claude/skills/ | wc -l` aur `wc -l dressing-room/state/reps_log.jsonl`.
   *(corrected 10 Aug 2026: is item ne khud DO hardcoded ginti carry ki thi aur dono sad chuki thi.
   Likha tha `"Skills (11)" bolta hai (ab 12 hain, /learn add hua)` — aaj disk pe **15** skills hain
   (`/gist-patch` · `/harvest` · `/fire` sab uske baad aaye). Aur `reps_log = 0` wali baat bhi ab
   OPS_STATE mein nahi khadi — us doc ne khud yeh line repair kar li hai aur ab live command deta hai.
   **Sabse tez sabak yahi hai: yeh item ek doc ki stale-ginti ko stale-ginti se correct kar raha tha.**
   Isliye ab yahan koi number nahi, sirf do command. Item khud OPEN hi rehta — OPS_STATE 15 Jul ka hai.)*
6. **Controller v0 schema abhi populate nahi hua** — per-axis `axisType`/`nextDue`/`lastResult`/
   `calibrationGap`/`fluencyState` + capsule `edgeMap`/`confusionPairs` **reserved** hain, first R1 run pe
   spec + populate honge. Constants (interval multipliers, reset window, R-mid→R-late switch, weave fraction)
   = **v0 hypotheses**. *(5 Aug: ab yeh sab `rejirah.mjs` mein `rejirah_log.jsonl` se DERIVE hote hain —
   ek honest interim jab tak R1 poora na ho. Yeh **deferral** hai, inkaar nahi: canon dono jagah
   POPULATE-at-R1 bolti hai, aur woh baaki hai.)*
6b. **KHULA — R1 ka gist paste abhi kisi ne kiya hi nahi.** `close` patch bana deta hai, par capsule
   `reJirahDone` tab tak nahi badalta jab tak **woh** gist mein paste na kare aur `mirror.mjs` use wapas
   na laaye. Aaj bhi live: **teen capsules (embeddings · inference · context) pe abhi bhi `reJirahDone: []`,
   bahut overdue, aur ek bhi round nahi baitha.** Machine ab poora rasta jaanti hai — round abhi baitha
   nahi gaya. `node scripts/rejirah.mjs due` se shuru.
   *(corrected 10 Aug 2026: "34-42 din overdue" ab galat hai — woh us din ki ginti thi aur roz badhti hai.
   Aaj `node scripts/rejirah.mjs due` bolta hai **embeddings 47d · inference 44d · context 40d**, aur kal
   yeh bhi galat ho jaayegi. **Overdue-din prose mein likhna hi bug hai — hamesha command chalao.**
   Baaki sab jyon ka tyon aur dukhad tarike se sahi: `rejirah_log.jsonl` abhi tak bana hi nahi hai, aur
   `node scripts/rejirah.mjs pending` khud bolta hai — *"0 axis grade(s), 0 rounds EVER closed … Yeh clean
   sheet nahi hai — yeh un-run hai."* Zero-tax raasta ab maujood hai: `/gist-patch` (§8.2).)*
7. **Registry-vs-syllabus seam** — `PROJECT_OS.md` ka syllabus **17 concepts / 3 streams** kehta hai;
   `concepts.json` **26 concepts + 12 skills** register karta hai (buckets 1-7). Yeh takrav nahi hai —
   OS ka syllabus Foundations ki ladder hai, `concepts.json` poori sprint ki rep-vocabulary hai (30 Jul ko
   register hua jab audit ne paaya ki ~115 sprint strings mein sirf 8 resolve ho rahe the, baaki chupchap
   phantom topics gadh rahe the). Par **yeh do alag lists hain** — sochte waqt mila mat do.
8. ~~**Engine drift** — shipped `THE-FORGE.html` **baked-only** hai (~115KB vanilla), gist ko live `fetch()`
   nahi karta, aur `deep`/`viz` render nahi karta.~~ — **CLOSED 9 Aug 2026 (E6, uske word pe: "as of now
   forge.html mein hi rakho").** Engine ab **live gist pehle, baked SNAP floor** hai: page khulte hi SNAP
   se render hota hai (kabhi khaali nahi), phir har capsule ka `<GIST>/<id>.json` fetch karta hai aur saare
   fetch safal hue to CAPS swap karke badge `"LIVE gist"` kar deta hai. Gist ab bhi canonical.
   *(corrected 10 Aug 2026 — is item ki **teenon** baatein galat ho chuki thi:*
   *(a) `~115KB` → `ls -la THE-FORGE.html` = **210,655 bytes**;*
   *(b) `live fetch() nahi karta` → `grep -n "fetch(" THE-FORGE.html` = `` fetch(`${GIST}/${c.id}.json`, { cache: "no-store" }) ``,
   comment ke saath: `// live gist first (FORGE_SPEC §1 intended), SNAP is the never-empty floor.`;*
   *(c) `deep/viz render nahi karta` → dono render hote hain, item 3 mein poora evidence.*
   *Engine ab repo mein rehti hai aur ek command se rebuild hoti hai — `node setup/build_forge_html.mjs` —
   jo `dressing-room/state/capsules/` (mirror ki read-only copy) se VERBATIM bytes bake karta hai.
   **Yeh line theek us waqt "engine drift" bol rahi thi jab engine repair ho chuki thi** — us drift se
   ulta khatra: pehle se band kaam dobara plan hota.)*
9. **Learning subsystems dormant-BY-LAW** jab tak reps na aayein: Calibration + Nemesis @20 reps ·
   Learning-State @12 (teeno config se verified). doubtminer ke shape-clusters ka gate **≥4 capsules +
   ≥60 doubts** hai — woh **abhi hi khula hai**, toh yeh row dormant nahi hai. **Yeh toota hua nahi hai —
   bias-to-silence hai.** Ek jhoota alarm ek missed alarm se bura hai.
   *(re-verified 10 Aug 2026 — **chaaron threshold jyon ke tyon hain**, aur is baar teenon config se
   naam le kar: `calibration_config.json → min_reps: 20` · `nemesis_config.json → warming_up_min_reps: 20` ·
   `learning_state_config.json → thresholds.warming_up_min_reps: 12` ·
   `doubtminer_config.json → gates: { min_capsules: 4, min_doubts: 60 }`. **Jo hata diya woh ginti hai:**
   "(4 capsules, 112 doubts)" prose mein baithi thi aur agle lock pe sad jaati. Live ek line mein:
   `node -e "console.log(JSON.parse(require('fs').readFileSync('dressing-room/state/doubt_grammar.json','utf8')).gate_line)"`
   → aaj `"4/4 capsules · 112/60 doubts"`, status `ok`. Chaaron gate aaj OPEN hain — teeno rep-gate
   `reps_log` ke live count se, aur doubtminer ka apna.)*

---

## 15. QUICK REFERENCE — commands

```bash
# state
node scripts/learnstate.mjs brief|json
node scripts/forge_session.mjs boot|status
node scripts/course.mjs brief
node scripts/python_state.mjs brief|status          # Python track (5 Aug)
node scripts/sprintsync.mjs

# forge session (pacer)
node scripts/forge_session.mjs start <concept> [--force]   # --force = purani unclosed session DISCARD (ek `force` row phir bhi history mein)
node scripts/forge_session.mjs step <0-11> | axis <a-i> now|done|defer | moment <name> | close
node scripts/forge_session.mjs contract             # THE METHOD ka 12-step order — UserPromptSubmit hook chalata, haath se bhi chal jaata
node scripts/forge_session.mjs selftest

# re-jirah (5 Aug) — FSRS = KAB · yeh = KAUNSE AXES + KITNA HARD
node scripts/deep.mjs due                           # cold queue, sirf strike-sawaal
node scripts/rejirah.mjs due | state [c]
node scripts/rejirah.mjs grade <c> <axis> held|cracked --gut knew|shaky|guessed
node scripts/rejirah.mjs close <c>                  # round khatam → gist patch
node scripts/rejirah.mjs pending                    # closed par gist mein abhi nahi

# python track (5 Aug) — single writer, haath se kabhi mat likho
node scripts/python_state.mjs subtopic "<name>" --tier T0
node scripts/python_state.mjs close "<name>" --why "<1 line>" [--fluency 🟢] [--bolo done] [--floor]
node scripts/python_state.mjs tier-close T0 --artifact "<COLD likha artifact>"
node scripts/python_state.mjs watch "<js-hangover>" | unwatch | packet

# widget registry (5 Aug) — KNOWS, generate kabhi nahi karta
node scripts/widget.mjs list | register <c> <file> --gates <n> | open <c>

# capture (akela darwaza)
node scripts/capture.mjs rep --concept <c> --axis <a> --q "<tested kya>" --gut <word> --correct true|false
node scripts/capture.mjs paste [file] [--chain]     # --chain derived state turant recompute karta (heartbeat alag se nahi chahiye)
node scripts/capture.mjs pull [--no-chain]          # Drive inbox se ingest — zero-paste path
echo "uske shabd" | node scripts/hippocampus.mjs mark doubt

# signals — ⚠ NANGA (bare) INVOCATION IN SAB KA MATLAB HAI **RECOMPUTE = WRITE**, read-only nahi
node scripts/fsrs.mjs|calibration.mjs|nemesis.mjs|learning_state.mjs [recompute|selftest]   # default = recompute (writes)
node scripts/capsule_bridge.mjs show          # READ-ONLY (bare = writes capsule_map.json)
node scripts/capsule_bridge.mjs selftest
node scripts/doubtminer.mjs [run | retire <capsule> <doubt_index> | selftest]   # default = run (writes)
node scripts/examiner.mjs [stage|selftest]    # bare = read-only (prints today's staged drill)

# teaching contract — DO LANE (10 Aug 2026: pehle yahan sirf `hit` tha, jo CLAUDE ka rasta hai hi nahi)
node scripts/teaching_contract.mjs flag <id> --why "<jo maine kiya>"   # ← CLAUDE KA RASTA. Apni drift usi turn mein. Auto-counts (uski 7 Aug ruling), koi card nahi, koi confirm nahi.
node scripts/teaching_contract.mjs unhit-auto <id>                     # auto-count wapas (reversibility)
node scripts/teaching_contract.mjs hit <id> | confirm | dismiss | staged   # ← USKI LANE. Claude yeh kabhi nahi likhta.
node scripts/teaching_contract.mjs autohit <id>                        # CODE lane — sirf teaching_audit.mjs
node scripts/teaching_contract.mjs print|list|add <id> <line>|drop <id>|reset-turns|checked|selftest
```

*(corrected 10 Aug 2026: purani line — `print|list|add|hit|drop|reset-turns|selftest` — aath commands
chhod deti thi aur, iska sabse bura asar, **Claude ko `hit` ki taraf bhej rahi thi.** `hit` uski lane
hai (CLAUDE.md: "His `hits` lane stays his alone — `hit`/`confirm` only — never write it"). Claude ka
apna rasta `flag <id> --why` hai. Poora dispatch:
`grep -n '^  case "' scripts/teaching_contract.mjs`.)*

```bash
# canon padho (web_fetch raw URLs pe reject karta — curl use karo)
BASE=https://raw.githubusercontent.com/nikhil1429/arsenal-ai-fc/main
curl -s $BASE/learning-layer/PROJECT_OS.md
curl -s $BASE/learning-layer/FORGE_SPEC.md
curl -s $BASE/learning-layer/HOW_HE_LEARNS.md
curl -s $BASE/OPS_STATE.md

# forge capsules (gist — web_fetch BLOCKED, sirf curl)
G=https://gist.githubusercontent.com/nikhil1429/ce50c28d585c2fcd915a9dbf61871a56/raw
curl -s $G/tokenization.json ; curl -s $G/embeddings.json
curl -s $G/inference.json    ; curl -s $G/context.json
```
