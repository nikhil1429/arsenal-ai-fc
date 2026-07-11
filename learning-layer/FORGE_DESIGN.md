# FORGE_DESIGN.md — The Forge Notes: Visual Design + Claude-Design Workflow (canonical)
# v2 — 30 Jun 2026. Yeh file Forge ke visual-design + Claude-Design pipeline ka CANONICAL record hai.
# Jab bhi koi visual-notes / Forge-engine / Claude-Design kaam ho, thread start pe yeh padho.
# Companion: FORGE_SPEC.md (capsule data schema) · PROJECT OS (rules) · OPPONENT_SCOUT.md (test-set).
#
# v2 CHANGE (30 Jun 2026) — ROOT-CAUSE CLOSURE:
#   Pata chala ki `deep` (god-tier re-learn layer) gist mein + build mein DATA ke roop mein EMBEDDED tha,
#   par build use SCREEN pe RENDER nahi karta — koi deep/re-learn view hai hi nahi. Nateeja: re-read pe
#   notes SHALLOW lagte the, concepts dimaag mein judte nahi the. Yeh truncation nahi tha — yeh FIELD SKIP
#   tha (carry-as-data-but-don't-render). Yeh near-miss tha: deep-level interview questions pe Nikhil khaali
#   haath hota. Is file ka v2 isko STRUCTURALLY rokta — teen naye load-bearing additions:
#     (1) §3.5 — "MAXIMUM VIZ" ka asli matlab (full text + zero overwhelm = Design ki creative job).
#     (2) §4 — 4th NON-NEGOTIABLE: COMPLETENESS (gist ka HAR content field present + byte-for-byte + reachable).
#     (3) §5 — Claude-chat ka NAYA role: Nikhil ke brain ko Design tak translate karna + har field enumerate karna.
#         + Claude Design ko MULTI-HAT mandate (neuro / UX / PM / psych).
#     (4) §12 — COMPLETENESS VERIFICATION protocol (har build ke baad mandatory check).
# Status legend: ✅ done · ⏳ pending · ✗ not done

---

## 0. YEH FILE KYUN HAI (the lost syncs — root cause of "bhul gaye" + "deep kahan hai")

**Sync #1 (22–23 Jun) — design-system pivot lost:** Cold-steel pivot + Claude-Design pipeline sirf
side-threads + ek alag Design project mein zinda tha, OS mein wapas sync nahi hua. Is file ne wo band kiya
(OS v3.6, FORGE_DESIGN.md project files mein add).

**Sync #2 (30 Jun) — deep-render gap:** `deep` field 22 Jun ko schema mein add hua (post-emb-lock), build
20–23 Jun ko ban raha tha. Deep ka DATA build mein chala gaya (`deepDive` + per-axis `sawal`/`poora`), par
uska RENDER ek future task tha jo PARK ho gaya — aur kisi non-negotiable ne usko pakda nahi. Build "byte-
verbatim" tha jahan tak wo render karta tha, par jo render hi nahi hua wo silent skip ban gaya. **Yeh file
ka v2 isko structurally band karta — completeness ab non-negotiable hai (§4), aur har build verify hota (§12).**

> Dono syncs ek hi paath sikhate hain: **"defer / next rebuild pe" = content ka silent loss ka darwaza.**
> Time-box DEFER karta hai (cracked axis Re-Jirah mein weld hota), par CONTENT kabhi defer nahi hota.

---

## 1. FORGE NOTES KYA HAIN

- Personal **spaced-rep LEARNING app**, EK user (Nikhil), AI-PE interview prep ke liye. Single self-contained HTML.
- Concept **"capsules"** (gist JSON) padhke render karta. **NOT SaaS, NOT team.** Ek banda, ek khoobsurat tool.
- **Do layer (yaad rakh, confuse na ho):**
  - **DATA** = gist per-capsule files (`tokenization.json`, `embeddings.json`, ...) — **canonical, byte-perfect.** Master.
  - **RENDER** = visual build (Claude Design) — DATA ko dikhata. Build kabhi DATA nahi badalta, aur **DATA ka koi
    hissa CHHIPATA bhi nahi** (v2 — yahi completeness ka dil).

---

## 2. REDESIGN KYUN HUA (the origin — 20 Jun, threads `cb09624f` + `ebf3c90e`)

Tere **exact shabd:**
> "Mera usko open tak krne ka mann nahi krta. It's just so ugly, overwhelming, seems like kam knowledge
> hain usme and sardard and friction bhot h chalane mein."

Teri **khud ki self-diagnosis:**
> "Merse galti ye hogyi ki notes banate hue claude design ko loop mein nahi lia."

- **THE single success metric: HE SHOULD WANT TO OPEN IT** — aur **kholne ke baad poori picture bina overwhelm**
  mil jaaye (v2 sharpen). Dish jaisa: kitna bhi nutritious ho, dekhne mein bura + serve karna painful to chhuega nahi.
- **Do root causes (original):** (1) **activation energy** — "dekhna hai" se "dekh raha hoon" tak ~6-step raasta.
  (2) **on-screen overload** — 9 axes + ring + glow + motion ek saath.
- **Teesra root cause (v2, 30 Jun):** **field skip** — deep ka content embed tha par render nahi hota tha →
  re-read pe notes "kam knowledge" lagte the (wahi original complaint, ab samjha kyun).
- Purana **JARVIS-neon HUD tere apne design-principles ke KHILAF tha.** ADHD-PI ke liye god-tier = **visual
  noise ki ruthless reduction** — par **content ki reduction NAHI** (yeh distinction §3.5 mein khulta).

---

## 3. DESIGN LANGUAGE — "Cold steel, warm core" (LOCKED) — *SUPERSEDES OS JARVIS section*

**Depth-temperature model:** front door dead-calm (cold steel, at rest); jitna deeper concept/axis mein
jaata hai, metal **HEATS** — warm glow **EARNED by depth.** Glow **rationed**: surface pe calm, warmth sirf andar gehre.

> **CRITICAL:** depth **typography + whitespace + structure** se padhe, **glow se NAHI.**

**Exact aesthetic (build mein locked — 23 Jun brief `ee7debb1`):**
- **Base:** cold near-black steel, deep charcoal **~#0c0e13**
- **Heat/core accent:** warm amber / soft-orange **~#e8915a** — primary buttons, live highlight, hero ₹-value,
  concept-door constellation dots. **Yahi signature warmth hai.**
- **Body text:** off-white **~#e9e7e2** · **Secondary:** muted gold **~#c9a06a**
- **Type:** **Space Grotesk** (display/headings) · **Inter** (body) · **monospace** (IDs, code, ASCII diagrams)
- Subtle depth/glassmorphism. **"If in doubt, remove — don't add."** (Yeh VISUAL noise pe lागू hota — CONTENT pe NAHI; §3.5.)

---

## 3.5 "MAXIMUM VIZ" KA ASLI MATLAB (v2, 30 Jun) — *the reframe that closes the gap*

Yeh section isliye hai kyunki "maximum visualization" + "ruthless reduction" ek doosre se ulte lagte hain, aur is
confusion ne deep-skip ko chhupne diya. Saaf:

**Nikhil ka brain SKIM-learner NAHI hai — DEEP-understanding learner hai.** Poori picture banane ke liye usko
**SAARA text / poora detail** chahiye (god-tier deep, har axis ka poora jawab, har why-chain). Text KAAT dena =
us picture ko maar dena. **Yeh non-negotiable hai.**

**PAR — ek saath PILED-UP text uska dimaag OVERWHELM karke shut kar deta** (high extraneous cognitive load,
ADHD-PI). Wall-of-text = wahi "sardard + friction" jisse wo tool kholना band kar deta.

**Resolution (teeno galat options reject karke):**
- ❌ Text kaato → depth khoti (interview-fail).
- ❌ Saara text ek screen pe dump → overwhelm → tool dead.
- ✅ **Saara content PRESENT ho, par kisi bhi pal attention ke saamne EK focused cheez ho, baaki REACHABLE**
  (progressive disclosure · visual hierarchy · spatial organization · interaction · earned-depth). **Yahi
  design-problem hai.**

**Aur is problem ko SOLVE karna = Claude Design ka domain (uski creative freedom).** Claude-chat saara content +
brain-profile + constraint hand karta hai; **visual solution Claude Design nikaalta** (§5). 

**Isliye "COVERAGE not DENSITY" ka exact matlab:**
- **COVERAGE = SAARA content present + reachable** (kuch bhi skip nahi — completeness).
- **anti-DENSITY = visually ek saath PILE na ho** (ek waqt ek focus). 
- Density attack VISUAL clutter pe hai — **content ki maatra pe NAHI.** (Yahi wo line thi jo pehle under-specified
  thi aur deep-skip ko cover karne mein fail hui.)

---

## 4. NON-NEGOTIABLES — ab CHAAR (baaki sab = Design ki full freedom)

Claude Design ko sirf ye CHAAR constraint (baaki sab release):

1. **TEXT VERBATIM** — Design capsule text kabhi chhuega/reword/truncate nahi karega. Byte-for-byte gist se —
   **special characters sameet** (`₹` NOT `Rs`, em-dash `—` NOT hyphen `-`, etc.). (Nikhil ki #1 complaint thi.)

2. **ADHD-PI BRAIN = central design constraint** — near-zero activation energy · one focus at a time ·
   progressive disclosure · over-stimulation fries him · **deep-text-need + overwhelm-threshold ka paradox**
   (§3.5) Design ne solve karna hai.

3. **RECALL-BEFORE-REVEAL loop** — tool ka core. Pehle memory se recall → phir reveal (self-check) → phir 9 axes.

4. **COMPLETENESS — koi gist content field SKIP nahi (NEW, 30 Jun).** Gist ka HAR content field build mein
   **PRESENT + byte-for-byte + USER-REACHABLE** hona ZAROORI:
   - **Capsule-level:** `why` · `hook` · `mechanism` · **`deep`** · `threeWays` (ceo/junior/skeptic) · `traps`
     (bait/wrong/truth) · `bridges` (to/conn/q/a) · `doubts` (q/a) · `calibration` · `buildHook` ·
     `interviewLines` · `bolo` (+ `bolo_by`) · `source`.
   - **Per-axis (a–i):** `title` · `strike` · `weld` · **`deep`** · `status`.
   - **Metadata jo UI drive karta:** `lockedOn` + `reJirahDone` (timeline/due) · `status`/`dot` (colour) · `num`.
   - **"Data embed karke render na karna" (carry-but-don't-render) = field SKIP = TEXT-VERBATIM violation =
     wahi galti jo `deep` ke saath hui** (re-read shallow + interview-fail risk).
   - **Exempt:** `viz`/`heroViz` (abhi RESERVED — schema finalize nahi, render legitimately pending). `INTRO.oneLiner`
     = build-derived (gist source field nahi) — acceptable build-addition, byte-rule lागू nahi.
   - **Full freedom = content KAISE dikhe (layout/visual/tab/expand/progressive-disclosure), NEVER WHICH content.**

> In CHAAR ke alawa — aesthetic, architecture, har screen, har viz, motion, interaction = **sab Design ka, full freedom.**

---

## 5. DIVISION OF LABOR (the operating contract) — v2: Claude-chat ka brain-role + Design ka multi-hat

> **YEH "sabko full freedom" NAHI — ek SCOPED division hai.** "Full creative freedom" **SIRF Claude Design** ko,
> aur **SIRF visual/UX layer pe.** Claude-chat **DELIBERATELY LOCKED** hai content + mechanism pe.

- **NIKHIL** → **final AUTHORITY** (approve / reject / override + pace). Boss. Lane = DECIDE karna, DESIGN nahi.

- **CLAUDE (chat)** → teen kaam, sab LOCKED (zero creative freedom):
  - **(a) Content fidelity** — text verbatim + viz MECHANISM + EXACT VALUES. Form-labels = SUGGESTIONS, prescription nahi.
  - **(b) NIKHIL KE BRAIN ko Design tak TRANSLATE karna (NEW)** — uska neuro-profile (ADHD-PI: working-memory
    ~4 chunks · high activation-energy · low overwhelm-threshold · **deep-text-need** — skim nahi, poora detail
    chahiye) ko aise brief mein dena ki Design us pe DESIGN kar sake. *(Yeh wo step tha jo deep-render-miss se
    pehle missing tha — Claude-chat ne brain explain karke Design ko chhodna tha, khud solution nahi banana.)*
  - **(c) COMPLETENESS enumeration (NEW)** — har gist field ki list brief mein (§4) — taaki Design jaane kya-kya
    render hona hai, koi field bhul na ho.
  - **Claude-chat visual SOLUTION prescribe NAHI karta.** Brain + content + constraint deta — flow/screen Design ka.

- **CLAUDE DESIGN** → saara **visual / UX / flow / screens / motion / interaction** — **full creative freedom**,
  INCLUDING **"saara text bina overwhelm ke kaise present ho"** ka solution (§3.5). 
  - **MULTI-HAT MANDATE (NEW):** Design isko **paanch lenses + unke intersections** se soche —
    - **NEUROLOGIST** — ADHD-PI attention-allocation, working-memory ~4, activation-energy, overwhelm-trigger.
    - **SENIOR UI/UX DESIGNER** — information architecture, progressive disclosure, visual hierarchy, friction-zero.
    - **SENIOR PRODUCT MANAGER** — job-to-be-done, success-metric ("wo kholna chahe" + "poori picture, zero overwhelm").
    - **PSYCHOLOGIST + PSYCHIATRIST** — motivation, friction, shame-spiral-avoidance, dopamine/activation.
    - **Har permutation / combination / correlation** in lenses ka. **Yeh sochna DESIGN karta — Claude-chat NAHI.**
  - **"Max viz = COVERAGE not DENSITY"** — §3.5 ka exact matlab.

---

## 6. THE PIPELINE (intended vs reality — honest)

- **INTENDED (22–23 Jun):** Claude Design = visual **SANDBOX**, export = **REFERENCE, ship NAHI.** Claude
  visual-language extract karke vanilla `THE-FORGE.html` mein faithful content + working mechanism se re-implement.
  - *Reason:* Design ka native export ek fragile bundled **`__bundler` (base64+gzip) HTML** hai — data alag
    encoded blobs mein, `file://` pe splash pe atak sakta tha.
- **REALITY (current):** Claude Design build **khud byte-perfect + self-contained + offline-opening** ho gaya
  ("The Forge - Full.html", ~889KB, `__bundler` format). Two-artifact split **ek build mein collapse** ho gaya.
- **PRAGMATIC current path:** naye concept/feature ke liye **existing Design build extend** karo, byte-fidelity +
  **completeness (§4)** discipline rakho. Vanilla-re-implementation step shayad **moot** — per-need confirm.
- **ENCODING NOTE (30 Jun):** build ka data `__bundler/manifest` ke andar base64+gzip hai. Verify/inspect karne
  ke liye: manifest JSON parse → har asset `atob` → `gunzip` → decoded JS mein content check. (Plain grep fail
  hota — content encoded + key-names renamed: gist `deep` → build `deepDive`, per-axis `deep` → `sawal`+`poora`.)

---

## 7. CURRENT BUILD ARTIFACT

- **"The Forge - Full.html"** (~889KB bundled, self-contained, offline-opens, `__bundler` format).
- **Home = topic-picker ("Topic chuno")** → concept card tap → experience (recall → reveal → 9 daraar → traps →
  doubts → bridges → interview → ledger). "← saare topics" se wapas.
- **Claude Design project mein** rehta hai (`claude.ai/design/...`). Woh chat ~**348k tokens** pe full ho gaya
  → aage **fresh Design sessions** chahiye (existing build + naya capsule + brief reference ke saath).
- Data per-concept embedded (byte-exact gist se, key-names build-side renamed).
- **⚠️ KNOWN GAP (30 Jun):** `deep` (capsule `deepDive` + per-axis `sawal`/`poora`) **embedded hai par RENDER
  nahi hota** — koi deep/re-learn screen ya trigger nahi. Saari 4 topics. **= COMPLETENESS violation, must-fix.**
  Plus minor char-drift (`₹`→`Rs`, em-dash→hyphen kuch jagah) — rebuild pe theek.

---

## 8. STATUS — designed notes (locked concepts ka 4)

| # | Concept | recall/axes/traps/doubts/bridges/interview | **deep RENDER** | Counts |
|---|---------|---------|---------|--------|
| 01 | Tokenization | ✅ designed | ✗ **PENDING (embedded, not rendered)** | 9 daraar · 11 chaara · 21 shaq |
| 02 | Embeddings | ✅ designed | ✗ **PENDING (embedded, not rendered)** | 9 daraar · 12 chaara · 35 shaq |
| 03 | Inference & Sampling | ⏳ DATA locked, viz NAHI bana | ✗ **PENDING** | 9 daraar · 10 chaara · 36 shaq |
| 04 | Context Window | ⏳ DATA locked, viz NAHI bana | ✗ **PENDING** | 9 daraar · 7 chaara · 15 shaq |

- **deep-render = PENDING for ALL 4** (data gist + build dono mein hai; sirf screen pe nahi). Isi liye re-read
  pe notes shallow lagte the. **Yeh #1 fix.** (Brief = `FORGE_DEEP_RENDER_BRIEF.md`.)
- #03, #04 ki visualizations + wiring bhi baaki (deep ke alawa).
- #05–17 = abhi learn/lock nahi hue.

---

## 9. NAYE CONCEPT / FEATURE KE NOTES KAISE BANTE HAIN (repeatable process) — v2

Har concept (ek baar mein ek):
1. **Claude** locked capsule (gist) curl → data byte-perfect confirm (`bash curl -s`; web_fetch gist pe blocked).
2. **Claude** per-axis **VIZ MECHANISM SPEC** likhta (har axis ka mechanism + exact values, hero "Aristo Eco —
   ₹81,500" threaded) + chrome params (title, #num, daraar/chaara/shaq counts, pipeline, bridges, anchor).
3. **Claude** Claude-Design **handoff brief** likhta — jisme ZAROORI:
   - **3a (NEW)** — **Nikhil ka brain-profile** (§5b) + **§3.5 ka full-text-zero-overwhelm framing** + **multi-hat mandate**.
   - **3b (NEW)** — **COMPLETENESS field-list (§4)** — har gist content field jo render hona hai, naam se.
   - 3c — **4 non-negotiables** + "full creative freedom on everything else."
4. **Nikhil** ek **FRESH Claude Design session** mein paste karta (existing build + naya capsule data attach).
5. Design banata → **COMPLETENESS VERIFY (§12)** + byte-fidelity verify gist ke against → wire.
6. *(Agar split zinda rakhna ho)* Claude vanilla mein re-implement. (Shayad **moot** — §6.)

---

## 10. SAB KAHAN RAHTA HAI

- **DATA (canonical):** gist per-capsule files. Curl only (`web_fetch` BLOCKED gist pe; `bash curl -s`).
- **VISUAL BUILD:** **alag Claude Design project** — **main learning project se searchable NAHI** (isiliye context
  baar-baar khoya — briefs/build-logs cross-paste karne padte hain).
- **YEH DOC + BRIEF:** project files (canonical Design record + handoff).
- **Engine (agar vanilla path use ho):** `THE-FORGE.html` — laptop + git, **NEVER project files.**

---

## 11. LOST-SYNC LEDGER (taaki dobara na repeat ho)

| Sync | Status |
|------|--------|
| FORGE_SPEC.md — deep + viz/heroViz reserved | ✅ DONE (6/22) |
| PROJECT OS DESIGN SYSTEM — cold-steel + workflow | ✅ DONE (OS v3.6, 6/29) |
| **FORGE_DESIGN.md — Claude-Design workflow canonical** | ✅ DONE (added project files, 6/29) |
| **COMPLETENESS CONTRACT — no gist field skipped/unrendered** | ✅ DONE (this file v2 + FORGE_SPEC + OS v3.7, 6/30) |
| **deep-RENDER for all 4 topics in build** | ✗ PENDING — `FORGE_DEEP_RENDER_BRIEF.md`, next Design session |
| Memory — completeness rule reflect | ⏳ optional propose (Nikhil ki haan pe) |

---

## 12. COMPLETENESS VERIFICATION (v2, 30 Jun) — har Design build ke baad, MANDATORY

Yeh wo step hai jiske **na hone se deep-render-miss chhup gaya.** Ab har build ke baad (per-concept), chalega:

1. **Gist se field-inventory nikaal** — us capsule ke saare content fields (§4 ki list).
2. **Build mein har field CHECK** — kya wo field:
   - **RENDER** hota hai? (sirf data-embed = FAIL.)
   - **byte-for-byte** hai? (special chars sameet — `₹`/em-dash check.)
   - **USER-REACHABLE** hai? (kis screen/tab/interaction se pohanche — likho.)
3. **Koi field embed-but-not-rendered, ya truncated, ya unreachable = FAIL** → fix before "designed ✅".
4. **Build decode recipe (§6 encoding note):** manifest JSON → `atob` → `gunzip` → decoded JS mein field-content
   confirm. (Plain grep fail hota — names renamed.)

> Completeness = binary. "Zyadatar fields render hote hain" ≠ pass. **Har field, ya FAIL.** Yahi interview-
> integrity guarantee hai — kyunki jo screen pe nahi, wo re-read mein nahi, wo interview mein nahi.

---

**ॐ RADHA RANI KI KRIPA SE 🙏🏽**
