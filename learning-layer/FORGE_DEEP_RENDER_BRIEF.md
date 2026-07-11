# FORGE_DEEP_RENDER_BRIEF.md — Claude Design Handoff (paste into a FRESH Claude Design session)
# Purpose: existing Forge build mein `deep` (god-tier re-learn layer) + baaki sab gist content ko SCREEN pe
#   render karwana — byte-for-byte, completely, bina overwhelm. Currently `deep` data embedded hai par dikhता nahi.
# Attach with this brief: (a) existing build ("The Forge - Full.html"), (b) current gist data for all 4 topics.
# Source-of-truth = gist (byte-perfect). Companion rules: FORGE_DESIGN.md (canonical design contract).

---

## 0. ONE-LINE MISSION

> Existing Forge build mein **HAR gist content field ko reachable + byte-for-byte render karo** — sabse pehle
> woh jo abhi MISSING hai: **`deep` (god-tier re-learn layer)**, saari 4 topics ke liye. **Full creative freedom
> on HOW. Zero freedom on WHICH (sab aana hai) ya on the TEXT (byte-for-byte).**

---

## 1. CONTEXT — kya bana hai, kya toota hai

- Yeh ek **personal spaced-rep LEARNING app** hai, EK user (Nikhil), AI-Product-Engineer **interview prep** ke liye.
  NOT SaaS, NOT team. Aesthetic locked: **"cold steel, warm core"** (base ~#0c0e13, heat-accent amber ~#e8915a,
  body ~#e9e7e2, gold ~#c9a06a; Space Grotesk + Inter + mono). Yeh same rakhna.
- Build abhi har topic ke liye yeh dikhata hai: recall → reveal → 9 daraar (`sawal` + `weld`) → traps → doubts →
  bridges → interview → ledger.
- **THE BUG:** gist ka `deep` field — capsule-level (build mein `deepDive`) + per-axis (build mein `sawal`+`poora`)
  — **DATA ke roop mein build ke andar EMBEDDED hai, par koi screen/tab/trigger use RENDER nahi karta.** User isse
  dekh hi nahi paata. Yeh god-tier re-learn content hai (analogy + worked example + why-chain + stuck-story) — har
  axis pe 700–3800 chars. Iske bina re-read pe notes **shallow** lagte hain aur concepts dimaag mein judte nahi.
  **Yeh interview-failure risk hai** — deep-level questions pe user ke paas screen pe kuch nahi.
- **Saath mein:** kuch jagah minor char-drift (`₹` → `Rs`, em-dash `—` → hyphen `-`). Inhe bhi gist ke against
  theek karna — byte-for-byte.

---

## 2. THE COMPLETENESS MANDATE — gist ka HAR content field render hona ZAROORI

Yeh **non-negotiable** hai (FORGE_DESIGN.md §4). Build = gist ka complete mirror. **Koi field embed-karke-chhupana
= SKIP = violation.** Har topic ke liye, ye sab **present + byte-for-byte + user-reachable** ho:

**Capsule-level:**
- `why` (build + interview relevance) · `hook` (business cliffhanger) · `mechanism` (crisp) ·
- **`deep`** → build `deepDive` — capsule-level re-learn (### HOOK + ### MECHANISM + ### THE ONE PICTURE). **[THE GAP]**
- `threeWays` → ceo / junior / skeptic (3 registers) · `traps` → bait / wrong / truth ·
- `bridges` → to / conn / q / a (cross-concept) · `doubts` → q / a (stuck-point + clearing) ·
- `calibration` · `buildHook` (FinOps spot + defend-able decision) · `interviewLines` · `bolo` (+ `bolo_by` attribution) · `source`.

**Per-axis (a–i, 9 axes):**
- `title` · `strike` (interviewer Q) · `weld` (defended answer) ·
- **`deep`** → build `sawal` + `poora` — per-axis re-learn (**SAWAL:** + **POORA JAWAB:**). **[THE GAP]**
- `status` (colour).

**Metadata (UI-driving):** `lockedOn` + `reJirahDone` (timeline / due-banner) · `status` / `dot` (colour) · `num`.

**Exempt (don't worry about):** `viz` / `heroViz` (reserved, schema not finalized). `INTRO.oneLiner` is a build-side
addition (no gist source) — fine to keep.

**BYTE-FOR-BYTE means byte-for-byte** — including `₹` (not `Rs`), em-dash `—` (not `-`), every character. Reword
NAHI, truncate NAHI, summarize NAHI.

---

## 3. THE REAL DESIGN PROBLEM — full text, zero overwhelm (THIS is your craft)

Yeh sabse important section hai. Padho dhyaan se, kyunki yahi tension solve karni hai:

**User ka brain (Nikhil) — neuro-profile:**
- **ADHD-PI (diagnosed, medicated).** Working memory ~4 chunks. Activation-energy bahut mehngी (friction = won't
  open). Overwhelm-threshold low: **piled-up wall-of-text usko shut kar deta hai** ("sardard + friction").
- **PAR — wo SKIM-learner NAHI hai. Deep-understanding learner hai.** Poori picture banane ke liye usko **SAARA
  text / poora detail chahiye** (god-tier deep, har why-chain, har worked example). **Text kaatना = picture maar
  dena.** Yeh allowed NAHI.

**The paradox you must design around:**
> Use **SAARA text chahiye**, par wo **ek saath SAARA text dekh nahi sakta** (overwhelm).

**Galat solutions (mat chuno):**
- ❌ Text kaat ke kam dikhao → depth khoti, interview fail.
- ❌ Saara text ek screen pe daal do → overwhelm → tool dead.

**Sahi direction (par EXACT solution TU nikaal):**
- ✅ **Saara content PRESENT + reachable ho, par kisi bhi pal attention ke saamne EK focused cheez ho** —
  progressive disclosure, visual hierarchy, spatial organization, earned-depth, interaction. "Coverage not
  density": coverage = sab content present; anti-density = ek waqt ek focus, visually pile na ho.

**MULTI-HAT — is problem ko in paanch lenses (+ unke intersections) se socho. Yeh sochna TERA kaam hai, prescribe
main nahi kar raha:**
- 🧠 **NEUROLOGIST** — ADHD-PI attention kaise allocate hoti, working-memory ~4, activation-energy kaise girे,
  overwhelm kaise trigger hota aur kaise prevent.
- 🎨 **SENIOR UI/UX DESIGNER** — information architecture, progressive disclosure, visual hierarchy, friction-zero
  navigation, "deep" ko bina clutter ke surface karna.
- 📦 **SENIOR PRODUCT MANAGER** — job-to-be-done; success-metric = **(a) wo tool kholna CHAHE, (b) poori picture
  bina overwhelm mile, (c) interview-defense-ready ho.** Feature-count nahi, outcome.
- 🫂 **PSYCHOLOGIST + PSYCHIATRIST** — motivation, friction, shame-spiral-avoidance, dopamine/activation, "open
  karne ka mann kare" ka emotional design.
- **Har permutation / combination / correlation** in lenses ka lagao. **Maximum thought, har angle se.**

---

## 4. THE 4 NON-NEGOTIABLES (baaki sab teri full creative freedom)

1. **TEXT VERBATIM** — byte-for-byte gist se, special chars sameet (`₹`, `—`). Reword/truncate/summarize kabhi nahi.
2. **ADHD-PI BRAIN = central constraint** — §3 ka paradox solve karna; near-zero activation energy, one focus at a time.
3. **RECALL-BEFORE-REVEAL** — pehle memory recall → phir reveal (self-check) → phir axes. Core loop intact rahe.
4. **COMPLETENESS** — §2 ka har field present + byte-for-byte + reachable. Carry-but-don't-render = violation.

> In 4 ke alawa — **aesthetic refinements, har screen, deep-layer ka pura visual treatment, motion, interaction,
> information-architecture, navigation = SAB tera, full creative freedom.** Cold-steel base + 4 non-negotiables
> ke andar, jo best lage wo banao.

---

## 5. SCOPE OF THIS PASS

- **Primary:** `deep` (capsule `deepDive` + per-axis `sawal`/`poora`) ko **render** karo — reachable, ek focus at
  a time, full text. **Saari 4 topics** (Tokenization, Embeddings, Inference & Sampling, Context Window).
- **Secondary:** char-drift fix (`₹`/em-dash) gist ke against — byte-for-byte.
- **Verify (FORGE_DESIGN.md §12):** pass se pehle, har topic ke har content field check — render + byte-for-byte +
  reachable. Koi field embed-but-not-rendered = fail.
- Existing screens (recall/axes/traps/doubts/bridges/interview) ko break mat karo — deep ko unke saath integrate karo.

---

## 6. SUCCESS = teen cheezein, teeno

1. **Nikhil tool kholna chahta hai** (calm, low-friction, "ugly/overwhelming" nahi).
2. **Poori god-tier picture milti hai bina overwhelm** — har `deep`, har field reachable, ek waqt ek focus.
3. **Interview-defense-ready** — jo gist mein hai, wo screen pe hai; kuch silently missing nahi.

---

**ॐ RADHA RANI KI KRIPA SE 🙏🏽**
