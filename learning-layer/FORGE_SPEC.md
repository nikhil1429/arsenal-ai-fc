# FORGE_SPEC.md — Schema Lock (canonical)
> Yeh file schema FREEZE karti hai. Drift rokne ke liye. Koi bhi capsule isi shape mein banega.
> Engine (THE-FORGE.html) isi schema ko gist se padhta hai. Mismatch = blank render. Toh yahi master.
> Last locked: **context (concept #4, 2026-06-28).** 4 concepts locked: tok #01, emb #02, inf #03, context #04.
> **Schema update (2026-06-22, post-emb-lock boundary): 3-LAYER notes model added — `weld` + `deep` + `viz` (viz reserved). See §2.5 + §3.** Hinglish throughout.
> **Store update (2026-06-24, inference-lock boundary): single `forge-capsules.json` flat-array → PER-FILE (`<id>.json`, one capsule each). Schema UNCHANGED — sirf STORE + WRITE-PATH badla. See §1 + §2 + CHANGELOG.**
> **Progress-sync (2026-06-29, context-lock boundary): lock-count 2→4 (context #04 locked 6/28). Controller v0 fields RESERVED in §3 (per-axis + capsule-level; shape sketched, viz/heroViz jaise) — see §6. FINAL shape + constants + capsule-POPULATION at first R1. Locked capsules UNTOUCHED (immutable; R1 mein populate).**
> **Render-completeness (2026-06-30, mid-Re-Jirah, AUTHORIZED correctness-fix): `deep` (per-axis + capsule) RENDER = COMPLETENESS REQUIREMENT, defer NAHI. §4 adapter "NOT rendered yet" rows for `deep` → "MUST RENDER (pending fix)". Root cause: `deep` gist + build DATA mein embedded tha par screen pe render nahi hota → re-read shallow + interview-fail risk. Governing rule = FORGE_DESIGN.md §4 #4 (completeness contract). Schema DATA-shape UNCHANGED. See §4 NOTE + CHANGELOG.**
> **Cold-Reader Standard (2026-07-02, AUTHORIZED correctness-fix): §3 mein naya "COLD-READER STANDARD" block + `doubts`/`bridges` field-rules upgrade (ATOMIC · SUBJECT-named · answer-HIDDEN · no-near-dup · TAXONOMY). §5 mein "GATE 2 — CONTENT-VERIFY at LOCK/SAVE" rule. Root cause: doubt CAPTURE ke waqt "2-saal cold-reader" quality-bar spec mein tha hi nahi (sirf "har stuck-point capture karo") → ~1/3 doubts cryptic/fragment/meta (context ~73%). Companion: PROJECT OS v3.8 (THE METHOD step-10 + opener-4a = Gate 1, capture-time). Research locked: Wozniak 20-rules (R4/R11/R12) + Zettelkasten + Tulving + curse-of-knowledge — converge. Schema DATA-shape UNCHANGED (fields same; sirf QUALITY-BAR + verify-gate add). META-FREEZE exception: correctness loophole-fix, Nikhil ne explicitly maanga, recurrence rokta — valid (v3.7/v3.8 jaise). See §3 block + §5 GATE 2 + CHANGELOG.**
> **Rich-doubt + batch-glance (2026-07-03, AUTHORIZED correctness-fix — refines 7/2 over-tighten): §3 ki DO clauses surgically corrected. (1) Q-field bar `shortest-wording (terse OK)` → RICH confusion-journey (maine-socha-X-phir-Y; cold-Nikhil 6-12 mo baad pehchaane KAHAN atka; ATOMIC = ek confusion RICHLY-elaborated, skeletal/terse NAHI). (2) GATE-1 capture `Nikhil line-by-line approve` → BATCH glance ('go'/'yeh do fix', per-line NAHI). Baaki 7/2 cold-reader (cryptic/fragment/meta failure-patterns, TAXONOMY, subject-anchor, answer-HIDDEN, no-near-dup, Gate-2 verify) FULLY VALID, UNCHANGED. DATA-schema UNCHANGED. Root cause: 7/2 ne 'shortest-wording' + 'line-by-line' over-shot (skeletal Q + high approval-tax). First R1 (tokenization, 7/3) ne surface kiya. Companion: PROJECT OS v3.9. META-FREEZE exception (correctness loophole-fix, explicitly requested). See §3 + CHANGELOG.**
> **Rename cascade (2026-07-08, OS v3.13 outwork-merge companion): OS "EXECUTION LAYER" section → "LEARNING EXECUTION LAYER" (naya OUTWORK EXECUTION LAYER ka PEER banne pe do "execution layer" naam-collision khatam). Is file mein sirf woh 4 spots badle jahan OS us section ko NAAM se reference karta (§3 schema-comment + §6 header/body + 6/29 changelog line). Controller v0 DESIGN + SCHEMA (5 knobs + 4 mechanics + reserved per-axis/capsule fields) UNCHANGED — pure rename of the referenced OS section, koi schema-touch nahi. DATA-shape UNCHANGED. Companion: PROJECT OS v3.13. See §6 + CHANGELOG + §5 META-FREEZE ledger.**

---

## 1. STORE
- **Master** = GitHub Gist — **ONE JSON file per capsule** (`<id>.json`: `tokenization.json`, `embeddings.json`, `inference.json`, `context.json`, ...). Each file = a SINGLE capsule object (array wrapper NAHI). Raw URL pattern: `.../raw/<id>.json`. (Purana single `forge-capsules.json` flat-array **DEAD** — migrated per-file 2026-06-24.)
- Raw URL pattern: `https://gist.githubusercontent.com/nikhil1429/ce50c28d585c2fcd915a9dbf61871a56/raw/<id>.json` (e.g. `.../raw/tokenization.json`, `.../raw/embeddings.json`, `.../raw/inference.json`, `.../raw/context.json`).
- **Engine** = `THE-FORGE.html` (laptop + git, NEVER project files).
  - *Intended:* renders from gist + baked SNAP fallback.
  - *Current shipped (2026-06-22):* **baked-only** (~115KB vanilla) — no live `fetch()`, `deep`/`viz` NOT rendered yet. Reconcile at **next engine rebuild**. See §4 NOTE.
- **Never-empty**: engine has a baked `SNAP` (copy of the gist) so it renders even offline / if fetch blocked.

## 2. WRITE PATH (Option A — manual, at concept LOCK) — PER-FILE
1. Concept Jirah-survive karta → Claude sirf us **naye** capsule ka file (`<id>.json`, single object). Locked files KABHI re-generate nahi (immutable).
2. Nikhil **'Add file'** → naam `<id>.json` → paste → Save.
2b. Existing capsule edit (`reJirahDone`/doubt back-write) → Claude us **EK** file ka updated version deta → Nikhil us file ko **replace**, baaki files untouched.
3. Engine boot pe gist `fetch()` karta → live render. (file:// pe fetch block ho to baked SNAP dikhta — Claude tab naya THE-FORGE.html de jisme SNAP refreshed ho.) *(Aspirational — current engine baked-only, §1.)*
4. Nothing auto-saves. Nikhil decides.

## 2.5 LOCK-TIME CONTENT CAPTURE — 3 LAYERS *(added 2026-06-22, post-emb-lock boundary)*
Har concept LOCK pe teen content-layers capture hote — **layer, never replace.** Teeno zinda rehte:

| Layer | Density | Kya | Kab padha jaata |
|---|---|---|---|
| **1 · WELD** *(default, pehle se)* | explain + defend | Per axis `strike` (interviewer Q) + `weld` (defended answer). Quick recall-trigger + interview-defense. | Recall / Re-Jirah ke waqt |
| **2 · DEEP** *(new — gist mein 6/22)* | scratch-se-re-learn | Per axis `deep` + capsule-level `deep` (analogy + worked example + why-chain + stuck-story). | ~2 mahine baad jab concept dobara re-learn karna ho |
| **3 · VIZ** *(RESERVED — aa raha)* | visual | Per axis `viz` + capsule-level `heroViz` (mechanism + exact values + suggested form). | Animation se seekhne / refresh ke waqt |

**DEEP capture rule (non-negotiable):** `deep` content **sirf** Nikhil ke Bolo / teaching-threads se aata, **verbatim-faithful**. Claude **invent kabhi nahi** karta — na axis weld, na deep, na koi example. Lock pe Claude threads/Bolo se recover karta → **Nikhil line-by-line verify** karta uske gist-canonical hone se pehle. *(Kyun: yeh woh content hai jo Nikhil interview mein khud defend karega — reword/invent = woh apni-samajh nahi rata.)*

**VIZ capture (Part-2 mein finalize):** mechanism + exact values = **Claude-locked**; visual/UX/flow = **Design-free** (coverage-not-density). Exact `viz`/`heroViz` schema **abhi over-define NAHI** — Design ka build firm hone pe (premature lock se bachna).

> **RENDER-COMPLETENESS NOTE (2026-06-30):** Layer capture (gist mein content daalna) aur layer RENDER (build mein screen pe dikhana) DO alag cheezein hain. `deep` capture ho chuka (gist + build data dono mein), par RENDER nahi hota tha — yahi gap tha. **Capture ≠ render.** Build mein har captured content field RENDER hona ZAROORI (completeness — FORGE_DESIGN.md §4 #4). Carry-but-don't-render = field skip.

## 3. CAPSULE SCHEMA (exact — har capsule object)
```json
{
  "id": "tokenization",            // long id; engine IDMAP se short id (tok) pe map hota
  "num": "01",
  "lockedOn": "2026-06-15",        // ISO date concept LOCK hua. Re-Jirah schedule isi se compute
  "reJirahDone": [],               // completed Re-Jirah due-dates (ISO array). Re-Jirah ke baad Claude add karta
  "stream": "foundations",         // foundations | courses | finops
  "title": "Tokenization",
  "status": "tempered",            // JIRAH ka result (self-rating se NAHI). number optional ("tempered-90")
  "dot": "magenta",                // cyan=primary · red=crack · magenta=tempered
  "source": "...",
  "why": "one line — build + interview relevance",
  "hook": "business cliffhanger (definition nahi)",
  "mechanism": "Nikhil ke locked words mein, crisp",
  "deep": "CAPSULE-LEVEL re-learn (markdown string). Sections: ### HOOK + ### MECHANISM + ### THE ONE PICTURE. hook/mechanism se FULLER. Verbatim-faithful from threads/Bolo. (Added 6/22.)",

  "faultLines": [                  // 9 axes, axis a..i. status JIRAH se.
    {
      "axis": "a", "title": "...",
      "strike": "interviewer Q",
      "weld": "defended answer (quick recall-trigger)",
      "status": "held",
      "deep": "PER-AXIS re-learn (markdown string). Sections: **SAWAL:** + **POORA JAWAB:** (analogy + worked example + why-chain + stuck-story). Verbatim-faithful. Layers ON TOP of weld — replace NAHI. (Added 6/22.)"
      // "viz": { ... }            // RESERVED — per-axis visualization spec (mechanism + exact values + form). Finalize Part-2 (post-emb-viz ship). ABHI gist mein nahi.
      // ---- CONTROLLER v0 per-axis fields (RESERVED 6/29; FINALIZE + POPULATE at first R1; constants in OS LEARNING EXECUTION LAYER, v0) ----
      // "axisType":       "recall" | "reconstruct" | "defend",          // kis tarah test ho (classification — R1 pe assign)
      // "nextDue":        "ISO date",                                   // per-axis next Re-Jirah (global +3d/+2wk/+6wk replace; SM-2-lite). RUN-OUTPUT.
      // "lastResult":     "held-clean" | "held-struggle" | "cracked",   // RUN-OUTPUT
      // "calibrationGap": "predicted-vs-actual (control-signal: confident+cracked → tighter interval + mode-bump)",  // RUN-OUTPUT
      // "fluencyState":   "tempered" | "fluent"                         // dṛḍhabhūmi; SIRF load-bearing core pe. RUN-OUTPUT (high-rep ke baad).
    }
    // ... b..i. axis i = 3-awaaz drill.
  ],

  "threeWays": { "ceo": "...", "junior": "...", "skeptic": "..." },   // axis-i ka 3-nazariye

  "traps":  [ { "bait": "seductive wrong (quoted)", "wrong": "kyun galat", "truth": "correction" } ],
  "bridges":[ { "to": "embeddings", "conn": "x -> y", "q": "cross Q", "a": "connection" } ],
  "doubts": [ { "q": "Nikhil ka exact stuck-point (uske shabd)", "a": "crisp resolution = interview answer" } ],
  "calibration": "predicted-vs-actual gap + freshness note",
  "buildHook": "FinOps mein exact spot + defend-able decision",
  "interviewLines": [ "tight English line, cold bol-ne layak" ],
  "bolo": "Nikhil ke apne words — whole concept. Claude invent NAHI karta.",
  "bolo_by": "— Nikhil, Jirah-tested ...",

  "viz": "bpe",                    // LEGACY (capsule-level string) — tok baked-animation pointer. NEW viz layer = per-axis "viz" + capsule "heroViz" (neeche). Naam-collision note §3 field-rules.
  // "heroViz": { ... }            // RESERVED — capsule-level quick-glance animation spec. Finalize Part-2. ABHI gist mein nahi.
  // ---- CONTROLLER v0 capsule-level (RESERVED 6/29; FINALIZE at first R1) ----
  // "edgeMap":        "honest knowledge-boundary string ('yeh defend kar sakta, yeh nahi aur zaroorat bhi nahi'). Edge pe bluff NAHI = senior signal.",
  // "confusionPairs": [ { "a": "...", "b": "...", "differentiator": "..." } ]   // X-vs-Y discrimination drill, actual error-log se
}
```

### Field rules
- `faultLines`: **9 axes (a..i)**, status from Jirah only. NOT 3 escalating levels (purana 5-faultline schema DEAD).
- `doubts`: EVERY genuine knowledge stuck-point, Nikhil ke shabd. Mandatory — dual-purpose interview bank. Apni entry, weld mein dafan NAHI. **COLD-READER STANDARD binding (full block neeche):** `q` = ATOMIC (ek confusion) + SUBJECT explicitly named (koi dangling `ye`/`woh`/`Map`/`second-enemy`/`(pehle-guess)` nahi) + ANSWER-HIDDEN + RICH confusion-journey (maine-socha-X-phir-Y — cold-Nikhil pehchaane KAHAN atka; ATOMIC = ek confusion RICHLY-elaborated, skeletal/terse NAHI) + NO near-duplicate; `a` = complete standalone (mechanism + why). **TAXONOMY:** SIRF genuine knowledge stuck-points — curriculum/planning/status/deferral/generic-vocab kabhi NAHI. Capture = **Gate 1** (OS step-10 + opener-4a: Claude standard-pe draft → Nikhil BATCH-glance ('go'/'yeh do fix') → phir save; raw stuck-point seedha kabhi nahi). Verify = **Gate 2** (§5).
- `traps` >= 2, `bridges` >= 2 (dependency neighbours). **`bridges[].q` bhi COLD-READER STANDARD pe** (SUBJECT-anchored + answer-HIDDEN + atomic — `doubts[].q` jaisa; `to`/`conn`/`a` cold-legible).
- `bolo`: Nikhil bolta/likhta; Claude sirf tighten karta. Invent kabhi nahi.
- `id`: long form (`tokenization`, `embeddings`, `inference`, `context`, `hallucinations`, `tooluse`, ...). Engine IDMAP reconcile karta. **Filename = `<id>.json` (per-file store, §1).**
- **`deep`** (per-axis + capsule-level) — *added 6/22*: scratch-se-re-learn layer (markdown string). **Verbatim-faithful ONLY** — threads/Bolo se recovered, Claude invent NAHI karta, Nikhil verify karta. Layers ON TOP of `weld`, replace NAHI. `weld` = quick recall-trigger; `deep` = full re-learn. **Dono zinda. Dono RENDER hone chahiye (completeness, §4 NOTE / FORGE_DESIGN.md §4 #4).**
- **`viz` / `heroViz`** — *RESERVED, aa raha*: per-axis `viz` (spec object) + capsule-level `heroViz` (spec object). Mechanism + exact values = **Claude-locked**; visual/UX = **Design-free** (coverage-not-density). Exact schema **Part-2 mein finalize** (Design build se shape pakka), tab tak over-define nahi.
- **`viz` naming note:** capsule-level `viz: "bpe"` (string) = **LEGACY** tok baked-animation pointer. Going-forward viz layer = **per-axis `viz`** (object) + **capsule-level `heroViz`** (object). Naam alag rakhe taaki collision na ho.

### COLD-READER STANDARD (doubts/bridges quality LAW) — *added 2026-07-02, AUTHORIZED correctness-fix*
> **THE ONE LAW:** har knowledge-artifact **cold-reader** se reconstructable ho. Cold-reader = **future-Nikhil, 6-12 mahine baad, is session ki ZERO memory.** Us pal samajh aana kaafi NAHI — 1 saal baad padhke bhi (a) pata chale WHAT discuss ho raha, aur (b) recall attempt ho sake. (Ye content-QUALITY law hai — render-completeness [§4 / FORGE_DESIGN §4 #4] se ALAG: completeness = "build field DIKHATA?", cold-reader = "gist mein doubt SAAF hai?".)

**Field-by-field bar:**
- **Q-fields** (`doubts[].q`, `bridges[].q`): **ATOMIC** (ek confusion, do nahi) · **SUBJECT explicitly named** (kya / kis cheez ki — koi dangling `ye`/`woh`/`Map`/`second-enemy`/`(pehle-guess)` nahi) · **ANSWER-HIDDEN** (question khud jawab na de) · **RICH confusion-journey** (maine-socha-X-phir-Y-contradict-laga — cold-Nikhil pehchaane KAHAN atka; ATOMIC = ek confusion RICHLY-elaborated, skeletal/terse NAHI) · **NO near-duplicate** (do doubts ek hi cheez na poochein).
- **A-fields** (`doubts[].a`, `bridges[].a`): **complete standalone** — mechanism + why, concise par poora; akele padho to poora resolve ho.
- **AUTHORED-PROSE** (`weld` · `deep` · `mechanism` · `hook` · `why` · `traps` · `threeWays` · `interviewLines` · `bolo`): cold-legible hona chahiye — par **SACRED.** Rule **FUTURE authoring** govern karti; existing sirf **VERIFY** (rewrite NAHI — sacred immutability, §5).
- **LOG-fields** (`calibration` · `reJirahDone` · `status`): bar = clear + dated; full knowledge-test nahi.
- **TAXONOMY (kya `doubts[]` mein jaata):** SIRF genuine knowledge stuck-points. Curriculum-planning ("IVF kitni depth"), status-notes ("[RESOLVED] 4 din pehle nervous"), deferral-notes ("chop/RAG abhi nahi seekhna"), generic-vocab — **kabhi NAHI** (lifelong bank mein clutter).

**3 failure-patterns (yahi pakadne — Gate 2 inhe flag karta):**
1. **CRYPTIC** — subject un-anchored. ❌ `"har layer pe SAME KV?"` → ✅ `"Transformer ke har layer ki apni ALAG KV cache hoti, ya saari layers ek hi share karti?"`
2. **FRAGMENT** — adjacent doubt pe latka, akele zero. ❌ `"Zyada temp = ?"` → ✅ `"Temperature ZYADA karne pe next-word menu sharp hoti ya flat — aur garbage-word ka chance badhta ya ghatta?"`
3. **META / TO-DO** — knowledge-doubt hai hi nahi. ❌ `"chop/RAG nahi seekhna?"`, `"IVF kitni depth?"`, `"[RESOLVED] 4 din pehle nervous, ab?"` → **PRUNE** (koi cold-reader jawab banta hi nahi).

**ATOMIC ≠ terse (2026-07-03):** richness confusion-JOURNEY mein hai (maine-socha-X-phir-Y-contradict-laga), extra confusions add karke NAHI (woh atomic todta). Ek confusion RICHLY-elaborated = GOOD · terse-but-cryptic = BAD · do confusions ek doubt mein = BAD. FRAGMENT ka ✅ example (temperature) already rich — wahi bar.

**Do gates (dono chahiye):**
- **GATE 1 — CAPTURE (clean-at-birth):** OS THE METHOD **step-10** (LOCK — doubts[] pehli baar likhte) + THREAD OPENER **4a** (later back-writes — Re-Jirah/recall cracks). Claude har doubt standard-pe DRAFT kare (Nikhil ke shabd, INVENT nahi) → Nikhil BATCH glance ('go' / 'yeh do fix', per-line NAHI) → PHIR save. Raw stuck-point seedha `doubts[]` mein kabhi NAHI.
- **GATE 2 — VERIFY (slip-catcher):** §5 — har LOCK/SAVE pe saare `doubts[]`/`bridges[].q` standard ke against verify; koi cryptic/fragment/meta/near-dup → flag → approval se fix → tabhi "done".

**APPLIES TO:** going-forward CAPTURE + RE-JIRAH + backfill — har doubt is test se guzre.
**RESEARCH base (locked — dobara research NAHI):** Wozniak 20-rules (R4 atomic · R11 anti-interference · R12 wording) + Zettelkasten (autonomous notes) + Tulving (encoding-specificity) + curse-of-knowledge — sab isi cold-reader self-containment pe converge.

## 4. ENGINE ADAPTER (gist capsule -> THE-FORGE.html render) — how it maps
| Gist field | HUD render |
|---|---|
| `faultLines[axis].strike` | per-daraar **SAWAL** (interviewer) |
| `faultLines[axis].weld`   | per-daraar **JAWAB** (deep, click-reveal) |
| `faultLines[axis].status` | daraar status colour |
| `faultLines[axis].deep`   | **MUST RENDER (completeness req — FORGE_DESIGN.md §4 #4).** Re-learn layer (gist mein 6/22 se). Currently embedded-but-not-rendered = SKIP = fix PENDING (`FORGE_DEEP_RENDER_BRIEF.md`). |
| `deep` (capsule-level)    | **MUST RENDER (completeness req).** Concept re-learn screen. Currently embedded-but-not-rendered = SKIP = fix PENDING. |
| `faultLines[axis].viz` / `heroViz` | **reserved, NOT rendered** — schema genuinely not finalized; render legitimately pending (embeddings viz ship + rebuild ke baad). |
| `threeWays`               | **axis-i** 3 NAZARIYE cards (ceo/junior/skeptic) |
| `bolo`                    | **axis-a** TERA BOLO (concept-level). b..i = placeholder until per-axis Bolo |
| `doubts`/`traps`/`interviewLines`/`calibration` | **CONCEPT BANK** collapsibles (panel bottom) |
| `lockedOn` + `reJirahDone` | **SCAR TIMELINE** (anvil) = real dates · **HOME due-banner** (rack) = "aaj revise" alert |
| per-axis `r3` + inline `trap` | **baked only for tok** (gist capsule carries inhe nahi). Future: add per-axis r3 to schema if chahiye. |
| `viz` (legacy string) / animation / 1-page poster | **baked only for tok**. Gist-only concepts → placeholder (no fake viz). |

> **NOTE (2026-06-22) — engine reality vs spec:** Shipped `THE-FORGE.html` (~115KB vanilla) abhi **baked-only** hai — gist live `fetch()` NAHI karta (§1/§2 ka intended-flow drift), aur `deep`/`viz` **render bhi nahi** karta. Yeh teeno **next engine rebuild** pe reconcile honge (embeddings viz ship hone ke baad). Tab tak: **gist = canonical**, engine baked SNAP dikhata. Rebuild pe decide: live-fetch wapas laana hai ya baked rehna hai (abhi open). **Multi-file fetch (per-file store, §1): rebuild pe GitHub Gist API se `.files` auto-discover ya per-file raw URLs — abhi action nahi, baked SNAP never-empty rakhta.**

> **CORRECTION (2026-06-30) — deep-render = COMPLETENESS, defer NAHI:** Upar wala NOTE (aur is adapter ke purane "NOT rendered yet" rows) deep-not-rendered ko *"next rebuild pe aayega"* (accepted defer) frame karta tha — **woh LOOPHOLE tha** (operationally = content silently chhupa raha). Actual contract (FORGE_DESIGN.md §4 #4 — completeness): gist ka **HAR content field** build mein **render + byte-for-byte + reachable** hona ZAROORI. Carry-as-data-but-don't-render = field SKIP = TEXT-VERBATIM violation. **`deep` (per-axis + capsule) render = MUST-FIX** — defer NAHI; fix-vehicle = `FORGE_DEEP_RENDER_BRIEF.md` (next Design session). Adapter ke "NOT rendered yet" deep-rows ab "MUST RENDER (pending fix)" padho. (**`viz`/`heroViz` alag case** — schema genuinely reserved/un-finalized, render legitimately pending; jab schema lock ho tab completeness inpe bhi lागू hoga.)

### Re-Jirah scheduling (date-driven, computed live)
- Schedule = `lockedOn` + **3 din / 2 hafte / 6 hafte** (engine `new Date()` se compute, no stored countdown).
- Round status: `done` (date in `reJirahDone`) · `overdue` (date < aaj) · `due` (date == aaj) · `up` (date > aaj).
- HOME page: koi round `due`/`overdue` ho → red banner "AAJ REVISE", click → concept khulta. Warna agla due date soft-show.
- **Write path (Re-Jirah complete pe):** Claude `reJirahDone` mein woh due-date add karta → us **EK** capsule ka file (`<id>.json`) ka updated version deta → Nikhil us EK file **replace** (baaki untouched) → (offline ke liye SNAP-refreshed naya THE-FORGE.html bhi). Tab woh round `done` dikhta, agla due surface hota.

- IDMAP: `tokenization->tok, embeddings->emb, inference->inf, neuralnet->nn, training/rlhf->rlhf, context->ctx, hallucinations->hal, tooluse->tus, jagged->jag`. **Filename convention:** `<long-id>.json` (`tokenization.json`, `embeddings.json`, `inference.json`, `context.json`, ...).
- `curve.str` (retention ring): status mein number ho to wahi, warna **75** (fresh-lock, honest — overstate nahi).

## 5. ARCHITECTURE RULES (hard)
- **NEVER replace, always layer.** Baked AX/CONCEPTS untouched; gist overlays on top. Both live in code. (`deep` bhi `weld` ke UPAR layer hua — replace nahi.)
- **NEVER SKIP a content field at RENDER (NEW, 6/30).** Gist ka har content field build mein render + byte-for-byte + reachable (completeness — FORGE_DESIGN.md §4 #4). Carry-as-data-but-don't-render = silent field SKIP = TEXT-VERBATIM violation. Layer karna ≠ chhupana.
- **GATE 2 — CONTENT-VERIFY at LOCK/SAVE (NEW, 7/2).** Har LOCK ya SAVE (naya capsule YA existing edit/back-write) pe, us file ke saare `doubts[]` + `bridges[].q` **COLD-READER STANDARD (§3)** ke against VERIFY hote — koi **cryptic** (subject un-anchored) / **fragment** (adjacent pe latka) / **meta** (curriculum/planning/status/deferral) / **near-duplicate** slip ho → **FLAG** → Nikhil-approval pe fix → **TABHI file "done".** Gate 1 (capture — OS step-10 + opener-4a) clean-at-birth rokta; Gate 2 = safety-net jo slip pakadta. **Content-QUALITY verify hai — render-completeness verify (upar wala rule / FORGE_DESIGN §12) se ALAG layer:** woh "build har field dikhata?", yeh "gist mein doubt saaf hai?".
- Engine kabhi regenerate nahi (per-concept). Design badle = naya THE-FORGE.html, README/yeh-file migration note ke saath.
- **Locked capsule files = IMMUTABLE.** Naya concept = naya file (`<id>.json`); existing file sirf apne Re-Jirah/doubt pe edit hoti. Claude purane locked capsules KABHI re-emit nahi karta — yahi truncation + sacred-content-corruption ka **structural fix** (per-file store, §1/§2).
- **Schema-edit SIRF concept-lock boundary pe** (META-FREEZE). *(6/22 update = post-emb-lock; 6/24 store-update = inference-lock boundary; 6/29 progress-sync + to-schema-fy = context-lock boundary; 6/30 render-completeness CORRECTION = authorized correctness-fix, DATA-schema untouched; 7/2 cold-reader standard [§3 block + §5 Gate-2] = authorized correctness-fix, DATA-schema untouched; 7/8 rename cascade [OS "EXECUTION LAYER"→"LEARNING EXECUTION LAYER", OS v3.13 outwork-merge companion] = pure rename of referenced OS section, DATA-schema untouched — sab valid.)*
- **VIZ division-of-labor:** mechanism + exact values = Claude-locked · visual/UX/flow = Design-free · **coverage-not-density** (har mechanism visualize ho, par ek waqt ek focal point). Design export = **reference only, ship kabhi nahi** — Claude visual-language extract karke vanilla engine mein faithful content + working mechanism se re-implement karta. *(Reality drift §6 FORGE_DESIGN.md — current Design build directly use ho raha.)*
- THE-FORGE.html = laptop + git only. Yeh FORGE_SPEC.md = project files mein.
- Gist = single source of truth. SNAP = uska faithful baked mirror (never-empty). **Build = gist ka COMPLETE mirror — content cut/skip nahi.**

## 6. CONTROLLER v0 SCHEMA — RESERVED in §3 (FINALIZE + POPULATE at first R1) *(reserved 2026-06-29, context-lock boundary)*
> Re-Jirah CONTROLLER v0 (OS "LEARNING EXECUTION LAYER" mein design-locked) ke per-axis + capsule-level fields ab §3 mein
> **RESERVED** hain (viz/heroViz jaise — shape sketched, gist mein abhi nahi). **FINAL shape + constants + capsule
> POPULATION first R1 RUN pe** (un-run = hypothesis; run se hi real values + tuned constants aate). **Locked capsules
> abhi tak in fields ke bina hain — R1 mein populate honge, EK-EK file, sacred Bolo preserve karke (re-emit nahi,
> targeted update).** Constants (interval multipliers, reset window, R-mid→R-late switch, weave fraction) = OS
> LEARNING EXECUTION LAYER mein v0, R1 pe tune.

Reserved per-axis fields (har `faultLines[axis]` pe — §3 mein sketched, R1 pe finalize+populate):
- **`axisType`** — `recall` | `reconstruct` | `defend` (kis tarah test ho).
- **`nextDue`** — per-axis next Re-Jirah date (global +3d/+2wk/+6wk replace; SM-2-lite se compute).
- **`lastResult`** — last round ka outcome (held-clean | held-struggle | cracked).
- **`calibrationGap`** — predicted-vs-actual gap (control-signal: confident+cracked → tighter interval + mode-bump).
- **`fluencyState`** — `tempered` | `fluent/dṛḍhabhūmi` (correctness ke upar speed+effortless dimension; sirf load-bearing core pe).

Capsule-level (R1 pe finalize):
- **`edgeMap`** — honest knowledge-boundary string ("yeh defend kar sakta, yeh nahi aur zaroorat bhi nahi"). Edge pe bluff NAHI = senior signal.
- **`confusionPairs`** — `[{a, b, differentiator}]` — X-vs-Y discrimination drill, actual error-log se.

**Lock rule:** in fields ka exact shape + constants (interval multipliers, reset window, R-mid→R-late switch, weave fraction) = **first R1 pe spec honge** jab pata chalega design reality-contact survive karta ya nahi. Tab tak schema §3 frozen.

---
## CHANGELOG
- **2026-07-08 (rename cascade — OS v3.13 outwork-merge companion, AUTHORIZED):** OS "EXECUTION LAYER" section → **"LEARNING EXECUTION LAYER"** rename (OS mein naya **OUTWORK EXECUTION LAYER** peer add hua — do "execution layer" naam-collision khatam: LEARNING = decay+drill engine, OUTWORK = consistency+accountability engine). Is file mein sirf woh 4 spots badle jahan OS us section ko NAAM se reference karta: §3 schema-comment (controller v0 per-axis fields — "constants in OS EXECUTION LAYER" → "LEARNING EXECUTION LAYER"), §6 header ("OS EXECUTION LAYER mein design-locked" → "LEARNING EXECUTION LAYER"), §6 body ("OS EXECUTION LAYER mein v0" → "LEARNING EXECUTION LAYER"), 2026-06-29 changelog line ("Companion: OS EXECUTION LAYER" → "LEARNING EXECUTION LAYER"). **Controller v0 DESIGN + SCHEMA (5 knobs + 4 mechanics + reserved per-axis/capsule fields) UNCHANGED — pure rename of the referenced OS section, koi schema-touch nahi. DATA-shape UNCHANGED.** §5 META-FREEZE ledger mein 7/8 add. Companion: PROJECT OS v3.13 (rename + outwork-layer wire + 3 merges: ledger/decay-engine/scrimmage-scout-dossier + cadence-guards ported). META-FREEZE exception: rename-consistency (referenced OS section renamed — reference accurate rakhna), Nikhil explicit + repeated, big-integration boundary (v3.10 jaise).
- **2026-07-03 (rich-doubt + batch-glance — AUTHORIZED correctness-fix, refines 7/2 over-tighten):** COLD-READER STANDARD ki DO clauses surgically corrected — (1) §3 Q-field bar (`doubts` field-rule + STANDARD block) `shortest-wording (terse OK)` → **RICH confusion-journey** (maine-socha-X-phir-Y; cold-Nikhil pehchaane KAHAN atka; ATOMIC = ek confusion RICHLY-elaborated, skeletal NAHI); (2) §3 GATE-1 capture `Nikhil line-by-line approve` → **BATCH glance** ('go'/'yeh do fix'). Plus §3 mein "ATOMIC ≠ terse" clarifier + header note. **Root cause:** 7/2 ne cryptic/fragment/meta theek kiya (VALID, stays) par 'shortest-wording' + 'line-by-line approve' over-shot → skeletal Q (cold-Nikhil topic pehchaane par 'kahan atka' nahi) + high approval-tax. Baaki 7/2 cold-reader (failure-patterns, taxonomy, subject-anchor, answer-HIDDEN, no-near-dup, Gate-2 verify) FULLY UNCHANGED. **DATA-schema UNCHANGED.** Companion: PROJECT OS v3.9. First R1 (tokenization, 7/3) ne surface kiya. META-FREEZE exception (correctness loophole-fix, explicitly requested, recurrence rokta — v3.7/v3.8 jaise).
- **2026-07-02 (cold-reader standard — AUTHORIZED correctness-fix):** §3 "Field rules" mein `doubts` + `bridges` upgrade (ATOMIC · SUBJECT-named · answer-HIDDEN · no near-dup · TAXONOMY = sirf genuine knowledge stuck-points) + naya **"COLD-READER STANDARD"** block (the one law: Q-fields / A-fields / authored-prose / log-fields / taxonomy + 3 failure-patterns + examples + 2 gates + research-base). §5 mein **"GATE 2 — CONTENT-VERIFY at LOCK/SAVE"** rule (har `doubts`/`bridges` cold-reader ke against verify; cryptic/fragment/meta/near-dup → flag → fix → tabhi done) + META-FREEZE ledger mein 7/2 add. **Root cause:** doubt CAPTURE-time quality-bar spec mein tha hi nahi (sirf "har stuck-point capture") → ~1/3 doubts (107 mein se) cryptic/fragment/meta (context ~73%). **DATA-schema UNCHANGED** (fields same; QUALITY-BAR + verify-gate add). Companion: PROJECT OS v3.8 (Gate 1 = step-10 + opener-4a). Research locked: Wozniak (R4/R11/R12) / Zettelkasten / Tulving / curse-of-knowledge. Next (cure-half): 4 capsule-remediation threads (tok → emb → inf → ctx, fresh clean thread each). META-FREEZE exception (correctness loophole-fix, explicitly requested, recurrence rokta).
- **2026-06-30 (render-completeness — AUTHORIZED mid-Re-Jirah correctness-fix):** `deep` (per-axis + capsule) RENDER reclassified: "accepted defer" → **COMPLETENESS REQUIREMENT** (governing rule = FORGE_DESIGN.md §4 #4, completeness contract). §4 adapter deep-rows "NOT rendered yet" → "MUST RENDER (pending fix)"; §4 NOTE correction added; §5 "NEVER SKIP a content field at RENDER" rule added; §2.5 capture≠render note added. **Root cause:** `deep` gist + build DATA dono mein embedded tha par screen pe render nahi hota → re-read shallow + concepts judte nahi + interview-fail risk. **DATA-schema UNCHANGED** (fields same). Fix-vehicle = `FORGE_DEEP_RENDER_BRIEF.md`. Companion: FORGE_DESIGN.md v2 + PROJECT OS v3.7. (`viz`/`heroViz` exempt — schema genuinely reserved.)
- **2026-06-29 (context-lock boundary):** PROGRESS-SYNC — header lock-count 2→4 (tok/emb/inf/context; context #04 locked 6/28). Controller v0 fields **RESERVED in §3** (per-axis: `axisType`/`nextDue`/`lastResult`/`calibrationGap`/`fluencyState`; capsule-level: `edgeMap`/`confusionPairs`) — shape sketched (viz/heroViz pattern), see §6. FINAL shape + constants + capsule-POPULATION at first R1. **Locked capsules UNTOUCHED** (immutable — R1 mein real data se populate, targeted per-file, sacred Bolo preserve). (Companion: OS "LEARNING EXECUTION LAYER" + OPPONENT_SCOUT.md.)
- **2026-06-24 (inference-lock boundary):** STORE single `forge-capsules.json` array → **PER-FILE** (`<id>.json`, one capsule each). Write-path per-file (new = 'Add file'; edit = replace one file). Locked files **immutable** (Claude purane capsules re-emit nahi karta). Capsule **schema UNCHANGED**. Engine multi-file fetch = pending rebuild ka hissa (§4 NOTE).
- **2026-06-22 (post-emb-lock):** 3-layer notes model added — `deep` field (capsule-level + per-faultLine, markdown string, verbatim-faithful) in gist + schema. `viz` (per-axis) + `heroViz` (capsule-level) **RESERVED** (Part-2 finalize). New §2.5 LOCK-time capture. Engine render-drift NOTE (§4). VIZ division-of-labor in §5.
- *Earlier:* tokenization (#01) locked 6/15; embeddings (#02) locked 6/21; inference (#03) locked 6/24; context (#04) locked 6/28; vanilla engine rebuild (baked-only).
