# FORGE_DESIGN.md — The Forge Notes: Visual Design + Claude-Design Workflow (canonical)
# v2 — 30 Jun 2026. Yeh file Forge ke visual-design + Claude-Design pipeline ka CANONICAL record hai.
# Jab bhi koi visual-notes / Forge-engine / Claude-Design kaam ho, thread start pe yeh padho.
# Companion: FORGE_SPEC.md (capsule data schema) · PROJECT OS (rules) · OPPONENT_SCOUT.md (test-set).
#   *(paths added 10 Aug 2026 — teeno maujood hain, aur teeno ab IS REPO mein tracked hain, kisi Project ke
#    file-shelf pe nahi: `learning-layer/FORGE_SPEC.md` · `learning-layer/PROJECT_OS.md` ("PROJECT OS" ka asli
#    filename) · `learning-layer/OPPONENT_SCOUT.md`. Jagah kabhi prose se mat maano — `git ls-files learning-layer/`.)*
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
#
# ══ CODE-TRUTH PASS · 10 Aug 2026 ═══════════════════════════════════════════════════════════════
#   Yeh file 30 Jun ke baad chhui nahi gayi thi; repo 9-10 Aug ko aage nikal gaya. Sab corrections
#   INLINE hain (kuch bhi delete nahi hua — purani line hamesha "was:" ke saath zinda hai), har ek
#   ke saath grep-evidence. Sabse bada: **v2 ka #1 must-fix — deep-RENDER — ENGINE OF RECORD mein
#   BAND HO CHUKA HAI** (§7 · §8 · §11 dekho). Ek cheez badli hai jo yeh file assume karti thi:
#   **engine ab Claude-Design ka bundled build nahi, repo ka apna generated `THE-FORGE.html` hai**
#   (uska word, 9 Aug 2026: "as of now forge.html mein hi rakho" — `grep -n "forge.html mein hi rakho"
#   setup/build_forge_html.mjs`). Jahan yeh file "the build" kehti hai, ab do alag artefacts hain —
#   inhe kabhi mix mat karna:
#     · **ENGINE OF RECORD** = `THE-FORGE.html` (repo root, git-tracked), generator
#       `node setup/build_forge_html.mjs`, data `dressing-room/state/capsules/` se VERBATIM baked.
#     · **DESIGN BUILD** = "The Forge - Full.html" (`__bundler`), Claude-Design project mein —
#       repo mein NAHI hai (`git ls-files "*.html"` sirf `THE-FORGE.html` deta), isliye is file ke
#       uske baare mein saare claims ab **HISTORICAL / NOT VERIFIABLE from code** hain.
#   Jo cheezein sirf uske ruling se badal sakti hain, woh CHHUI NAHI GAYI — sirf flag hui hain
#   (§3 palette-mismatch · §5 widget-lane). Wahan "**CAPTAIN'S CALL**" likha hai.
# ════════════════════════════════════════════════════════════════════════════════════════════════

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
    *(added 10 Aug 2026 — yeh line galat nahi thi, ADHOORI thi: gist aaj bhi master hai, par ab uski ek
    **LOCAL READ-ONLY MIRROR** bhi hai jo har subah 06:55 khud pull hoti — `dressing-room/state/capsules/<id>.json`,
    **verbatim fetched bytes**. Owner = `mirror.mjs` (aur uske alawa koi organ wahan likhta nahi; woh ek daily
    snapshot `capsule_backups/<date>/` mein bhi rakhta). Isi mirror se engine bake hota hai aur `deep.mjs` padhta
    hai — matlab ek session ko ab network chahiye hi nahi. Evidence: `grep -n "capsules/<id>.json" scripts/mirror.mjs`
    (OUTPUT line) · `grep -n "ArsenalFC-Mirror" setup/INSTALL_TASKS.ps1` (DAILY 06:55) ·
    `grep -n "the LOCAL MIRROR that mirror.mjs" scripts/deep.mjs`. Live haal: `node scripts/deep.mjs`.)*
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

> **⚠ CAPTAIN'S CALL — palette drift (found 10 Aug 2026, NOT changed here).** Yeh design-language uska
> apna ruling hai, isliye upar ka **ek shabd nahi badla gaya**. Par imaandari: jis "build mein locked" ka
> yeh zikr karta hai woh **Claude-Design build** tha. Aaj ka **ENGINE OF RECORD** (`THE-FORGE.html`,
> generator `setup/build_forge_html.mjs`) yeh palette **carry nahi karta** — uska `:root` Arsenal-kit
> colours use karta hai: bg `#0d1117` · panel `#161b22` · accent red `#EF0107` · gold `#9C824A`, aur type
> `"Segoe UI", system-ui` — na `#0c0e13`, na amber `#e8915a`, na Space Grotesk/Inter. Evidence:
> `grep -n "0d1117" setup/build_forge_html.mjs` · `grep -n "Segoe UI" setup/build_forge_html.mjs` ·
> `grep -c "0c0e13\|e8915a\|Space Grotesk" THE-FORGE.html` = 0. Do mein se ek hi sach ho sakta hai — ya
> generator cold-steel pe laaya jaaye, ya is design-language ka scope "Design build only" likha jaaye.
> **Faisla uska; yeh file sirf mismatch record kar rahi hai.** (Note: mismatch sirf CHROME ka hai, CONTENT
> ka NAHI — generator byte-fidelity pura nibhata hai, `₹` aur em-dash dono zinda:
> `node -e "const s=require('fs').readFileSync('THE-FORGE.html','utf8');console.log(s.includes('₹'),s.includes('—'))"`
> → `true true`.)

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
     *(corrected 10 Aug 2026 — sub-shapes SAB verify hue, par list ADHOORI thi. Live capsule mein teen aur
     top-level fields hain jo yahan (ya "Metadata" wali line mein) naam se enumerate nahi the: **`stream`**
     (jaise `"foundations"`) · **`id`** · **`title`**. Enumeration hi is section ka pura kaam hai (§5c), aur jo naam nahi liya jaata
     wahi skip hone ke liye khula rehta — wahi `deep` ke saath hua tha. Live list nikaalo, kabhi yahan se
     mat maano: `node -e "const j=require('./dressing-room/state/capsules/tokenization.json');
     console.log(Object.keys(j).join(' | '))"`. Sub-shapes jaise likhe the waise hi mile — `traps`
     bait/wrong/truth · `bridges` to/conn/q/a · `doubts` q/a · `threeWays` ceo/junior/skeptic.)*
   - **Per-axis (a–i):** `title` · `strike` · `weld` · **`deep`** · `status`.
     *(corrected 10 Aug 2026: chhathi key chhoot gayi thi — **`axis`** khud (woh `a`…`i` letter). Live axis-keys
     aaj bilkul yeh hain: `axis, title, strike, weld, status, deep` —
     `node -e "const j=require('./dressing-room/state/capsules/tokenization.json');
     console.log(Object.keys(j.faultLines[0]).join(', '))"`. Aur haan: **36 of 36 axes ke paas `deep` hai**,
     khaali ek bhi nahi — gino: `node scripts/deep.mjs` (footer line "characters of DEEP across N/N axes").)*
   - **Metadata jo UI drive karta:** `lockedOn` + `reJirahDone` (timeline/due) · `status`/`dot` (colour) · `num`.
   - **"Data embed karke render na karna" (carry-but-don't-render) = field SKIP = TEXT-VERBATIM violation =
     wahi galti jo `deep` ke saath hui** (re-read shallow + interview-fail risk).
   - **Exempt:** `viz`/`heroViz` (abhi RESERVED — schema finalize nahi, render legitimately pending). `INTRO.oneLiner`
     = build-derived (gist source field nahi) — acceptable build-addition, byte-rule lागू nahi.
     *(corrected 10 Aug 2026 — yeh exemption ab **AADHI galat** hai, aur dono aadhon ka matlab ulta hai:*
     *(a) **capsule-level `viz` ab EXEMPT nahi rehna chahiye** — woh LEGACY string wala `viz` chaaron capsules
     mein MAUJOOD hai (`tokenization` mein value `"bpe"`), aur engine of record use **RENDER karta hai**, apne
     "Viz" section mein: `grep -n 'sec("Viz"' setup/build_forge_html.mjs`. Matlab exemption ki zaroorat hi nahi
     padi — completeness khud-ba-khud poori ho gayi. Check: `node -e "for (const f of
     ['tokenization','embeddings','inference','context']) console.log(f,
     JSON.stringify(require('./dressing-room/state/capsules/'+f+'.json').viz))"`.*
     *(b) **`heroViz` aur per-axis `viz` ab bhi genuinely RESERVED hain — kyunki woh EXIST hi nahi karte.**
     Kisi bhi capsule mein `heroViz` key nahi hai aur kisi axis mein `viz` nahi hai:
     `grep -c heroViz dressing-room/state/capsules/*.json` = 0 har file mein. Toh "render pending" nahi —
     **data pending** hai. Jis din woh gist mein aayenge, completeness (§4) apne aap unpe lagega, aur engine ko
     kuch karna bhi nahi padega: generic walker har anjaan field ko RAW render kar deta hai —
     `grep -n "Fields with no designed section yet" setup/build_forge_html.mjs`.*
     *NOTE: ek teesra "viz" ab alag lane mein zinda hai — Visualization Contract ka **widget**, jiska registry
     `widget.mjs` hai. Woh capsule field NAHI hai; §8 mein uska live count hai.)*
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

> **⚠ CAPTAIN'S CALL — is division ke saath ek NAYI lane paida ho chuki hai (found 10 Aug 2026, NOT changed here).**
> Upar ka contract 30 Jun ka hai, jab visual banane wala **sirf Claude Design** tha. Aaj repo mein
> **Visualization Contract** ki apni lane chal rahi hai: har concept ka EK widget, aur widget HI lesson hai;
> uska code-owner `scripts/widget.mjs` hai (`list` · `register <c> <file> --gates <n>` · `open <c>`), aur woh
> widget **Claude-Code ke andar hi banta** hai (THE METHOD ka step 4 —
> `grep -n "step 4 (the widget)" scripts/forge_session.mjs`). Live coverage:
> **`node scripts/widget.mjs list`** (10 Aug 2026 ko: chaaron locked capsules ke paas widget hai, ek driven —
> par yeh number kal badal jaayega, isliye command hi padho, yeh line nahi). Iska matlab practice mein
> Claude-chat aaj visual **banata bhi** hai. Yeh upar wale "Claude-chat visual SOLUTION prescribe NAHI karta"
> se seedha takraata hai. **Kaun-si lane kis pe raaj karti hai — yeh uska ruling hai, isliye upar ka text
> jaisa tha waisa hi chhoda gaya hai.** Do padho jaise: yeh section = **Claude-Design handoff** lane ka
> contract; widget lane ka contract PROJECT_OS/Visualization-Contract mein hai.

---

## 6. THE PIPELINE (intended vs reality — honest)

- **INTENDED (22–23 Jun):** Claude Design = visual **SANDBOX**, export = **REFERENCE, ship NAHI.** Claude
  visual-language extract karke vanilla `THE-FORGE.html` mein faithful content + working mechanism se re-implement.
  - *Reason:* Design ka native export ek fragile bundled **`__bundler` (base64+gzip) HTML** hai — data alag
    encoded blobs mein, `file://` pe splash pe atak sakta tha.
- **REALITY (current):** Claude Design build **khud byte-perfect + self-contained + offline-opening** ho gaya
  ("The Forge - Full.html", ~889KB, `__bundler` format). Two-artifact split **ek build mein collapse** ho gaya.
  *(corrected 10 Aug 2026 — "current" ab yeh NAHI hai. Yeh 30-Jun ki reality thi; **9 Aug 2026 ko woh split
  wapas khul gaya aur INTENDED wala raasta hi jeeta**: vanilla `THE-FORGE.html` ab REPO ROOT mein git-tracked
  hai aur ek generator se banta hai — `node setup/build_forge_html.mjs`. Uska word wahi commit-header mein
  darj hai: "as of now forge.html mein hi rakho". Kyun: 22-Jun wali shipped copy **git ke BAHAR** thi aur
  **kho gayi** — wahi out-of-git rot. Evidence: `grep -n "forge.html mein hi rakho" setup/build_forge_html.mjs`
  · `grep -n "lived OUTSIDE git" setup/build_forge_html.mjs` · `git ls-files "*.html"` → sirf `THE-FORGE.html`.
  "The Forge - Full.html" repo mein hai hi nahi — uske baare mein sab kuch ab HISTORICAL hai, code se
  verify-able nahi.)*
- **PRAGMATIC current path:** naye concept/feature ke liye **existing Design build extend** karo, byte-fidelity +
  **completeness (§4)** discipline rakho. Vanilla-re-implementation step shayad **moot** — per-need confirm.
  *(corrected 10 Aug 2026: **ULTA ho gaya.** Vanilla step moot nahi hua — wahi ab THE path hai, aur "existing
  Design build extend karo" ab ek aise artefact ko point karta hai jo repo mein nahi hai. Aaj ka path do
  command ka hai, dono deterministic, koi handoff nahi:*
  *`node scripts/mirror.mjs` (gist → `dressing-room/state/capsules/`, verbatim bytes) phir*
  *`node setup/build_forge_html.mjs` (capsules → `THE-FORGE.html`, verbatim baked). Completeness ab*
  *generator ke andar structurally baithi hai, discipline pe nahi chhodi gayi — §12 dekho.)*
- **ENCODING NOTE (30 Jun):** build ka data `__bundler/manifest` ke andar base64+gzip hai. Verify/inspect karne
  ke liye: manifest JSON parse → har asset `atob` → `gunzip` → decoded JS mein content check. (Plain grep fail
  hota — content encoded + key-names renamed: gist `deep` → build `deepDive`, per-axis `deep` → `sawal`+`poora`.)
  *(scoped 10 Aug 2026 — yeh poora note **SIRF Claude-Design `__bundler` build pe lागू hota**, engine of record
  pe NAHI. `THE-FORGE.html` mein data **plain JSON** hai, ek hi line: `const SNAP = [{...}]` — na base64, na
  gzip, na koi key-rename (`deep` `deep` hi rehta, `deepDive`/`sawal`/`poora` jaisa koi build-side naam nahi).
  Isliye **plain grep KAAM karta hai**, aur completeness-check ke liye ab kisi decode-recipe ki zaroorat nahi:
  `grep -c "deepDive" THE-FORGE.html` = 0 (aur `sawal` ka ek-aadha hit uske APNE capsule prose ka Hindi shabd
  hai, key nahi — isliye us shabd ko kabhi proof mat maano) · `node -e "const s=require('fs').readFileSync('THE-FORGE.html','utf8');
  console.log(/const SNAP = \[\{/.test(s))"` → `true`. Evidence generator mein:
  `grep -n "JSON.stringify(snap)" setup/build_forge_html.mjs`.)*

---

## 7. CURRENT BUILD ARTIFACT

> **⚠ SUPERSEDED HEADING (corrected 10 Aug 2026).** Neeche jo likha hai woh galat nahi tha — 30 Jun ko sach
> tha — par ab "CURRENT" woh nahi hai. **CURRENT BUILD ARTIFACT = `THE-FORGE.html`** (repo root, git-tracked;
> aaj ~206 KB — size live nikaalo, `wc -c THE-FORGE.html`, kabhi yahan se mat maano). Banta hai
> `node setup/build_forge_html.mjs` se, data `dressing-room/state/capsules/` se VERBATIM baked. Iska UI:
> baayen ek sidebar-nav (har capsule ka button, uske neeche `status · N axes · N doubts`), daayen woh capsule
> ki poori spine section-by-section; "Topic chuno" wala home-screen ismein nahi hai. Boot-order:
> pehle baked SNAP render (never-empty floor), phir sab capsules ka gist raw parallel `fetch` — **saare
> safal hone pe hi** swap hota aur sidebar-footer "LIVE gist" bolta, warna SNAP hi rehta (aadha-live kabhi
> nahi). Evidence: `grep -n "SNAP is the never-empty floor" setup/build_forge_html.mjs` ·
> `grep -n "fresh.every(Boolean)" setup/build_forge_html.mjs` · `grep -n "capsule engine · Arsenal AI FC" THE-FORGE.html`.

- **"The Forge - Full.html"** (~889KB bundled, self-contained, offline-opens, `__bundler` format).
- **Home = topic-picker ("Topic chuno")** → concept card tap → experience (recall → reveal → 9 daraar → traps →
  doubts → bridges → interview → ledger). "← saare topics" se wapas.
- **Claude Design project mein** rehta hai (`claude.ai/design/...`). Woh chat ~**348k tokens** pe full ho gaya
  → aage **fresh Design sessions** chahiye (existing build + naya capsule + brief reference ke saath).
  *(**NOT VERIFIED 10 Aug 2026** — yeh claim ek claude.ai project ke baare mein hai, repo ke baare mein nahi;
  code se na confirm ho sakta hai na refute. Historical claim maano, status nahi. Jo verify HO SAKTA hai woh
  yeh: engine of record ke liye ab koi Design-session chahiye hi nahi — `node setup/build_forge_html.mjs`.)*
- Data per-concept embedded (byte-exact gist se, key-names build-side renamed).
  *(corrected 10 Aug 2026 — engine of record pe pehla aadha SACH, doosra aadha GALAT: data per-concept embedded
  hai aur byte-exact hai, par **key-names rename bilkul nahi hote** — SNAP capsule JSON ki hu-ba-hu copy hai
  (`grep -n "JSON.stringify(snap)" setup/build_forge_html.mjs`). Rename `__bundler` build ki baat thi; §6 ka
  scope-note dekho.)*
- **⚠️ KNOWN GAP (30 Jun):** `deep` (capsule `deepDive` + per-axis `sawal`/`poora`) **embedded hai par RENDER
  nahi hota** — koi deep/re-learn screen ya trigger nahi. Saari 4 topics. **= COMPLETENESS violation, must-fix.**
  Plus minor char-drift (`₹`→`Rs`, em-dash→hyphen kuch jagah) — rebuild pe theek.

> **✅ YEH GAP BAND HO CHUKA HAI — DO BAAR, DO ALAG SURFACES PE (corrected 10 Aug 2026; upar wali line
> 30 Jun se aaj tak "must-fix / PENDING" padhi ja rahi thi, poore 41 din).** Yeh is file ka #1 must-fix tha,
> aur is line ne har session ko yehi bataya ki abhi tak khula hai. Live sach:
>
> 1. **CLI surface — `scripts/deep.mjs` (4 Aug 2026).** Yehi ab asli re-read surface hai, kyunki wo padhta
>    Claude Code mein hai. `node scripts/deep.mjs` = kya-kya locked hai + kitna deep hai · `<concept>` = us
>    capsule ki spine · `<concept> <axis>` = ek axis poora khula (capsule-level DEEP + per-axis deep, verbatim,
>    kabhi summarise nahi) · `due` = COLD queue, sirf strike-questions. Evidence:
>    `grep -n "DEEP (capsule-level)" scripts/deep.mjs` · `grep -n "DEEP (scratch se re-learn)" scripts/deep.mjs`.
> 2. **BROWSER surface — `THE-FORGE.html` (9 Aug 2026 rebuild).** Engine of record dono deep RENDER karta:
>    capsule-level ka apna section, aur har axis ke andar ek `<details>` jo "deep — poora khol" pe khulta.
>    Evidence: `grep -c "Deep — the god-tier re-learn layer" THE-FORGE.html` ≥ 1 ·
>    `grep -c "deep — poora khol" THE-FORGE.html` ≥ 1 ·
>    `grep -n "the god-tier re-learn layer" setup/build_forge_html.mjs` (generator ki taraf se).
>
> **Char-drift bhi engine of record pe zinda nahi** — `₹` aur em-dash dono intact (upar §3 ka `node -e` check).
> Woh drift `__bundler` build ki thi. **Jo abhi bhi NOT VERIFIED hai:** Claude-Design build ("The Forge - Full.html")
> ka apna deep-render — woh artefact repo mein nahi hai, isliye us par koi claim code se check nahi ho sakta;
> use na "fixed" maano na "pending", sirf **out of scope** maano.

---

## 8. STATUS — designed notes (locked concepts ka 4)

> **⚠ YEH TABLE AB EK FROZEN 30-JUN SNAPSHOT HAI — ISSE STATUS MAT PADHO (corrected 10 Aug 2026).**
> Table jaisa tha waisa hi neeche khada hai (kuch mita nahi), par uska **deep-RENDER column ab GALAT hai**,
> **#03/#04 ka "viz NAHI bana" ab GALAT hai**, "✅ designed" wale cells **code se verify ho hi nahi sakte**
> (woh Design-build ke baare mein hain, jo repo mein nahi hai), aur "Counts" column apne aap sadta hai —
> doubts uske apne back-writes se badhte rehte hain. **Live status ke liye teen command, teen alag lane:**
> - `node scripts/deep.mjs` → kitne capsules locked hain · har ek ke axes/doubts · kitna DEEP mila (yeh
>   ek hi command Counts column ko puri tarah replace kar deti hai).
> - `node scripts/widget.mjs list` → Visualization Contract ka coverage (kis concept ka widget bana, kaun driven).
> - `node scripts/mirror.mjs && node setup/build_forge_html.mjs` → gist se taaza pull, phir engine rebuild;
>   generator ka aakhri line kitne capsules bake hue woh bolta, aur har capsule ka footer "0 skipped" (§12).
>
> Kya-kya badal chuka hai, naam le kar (10 Aug 2026 ka live read — inhe bhi command se dobara check karna,
> kyunki inka bhi wahi haal hoga):
> - **deep RENDER column (saari 4 rows "✗ PENDING") — ab galat.** Engine of record dono deep render karta;
>   poora proof §7 ke ✅ block mein.
> - **Tokenization ka "21 shaq" — ab 26.** Live: `node -e "console.log(require('./dressing-room/state/capsules/tokenization.json').doubts.length)"`.
>   Baaki teen ke counts jaise likhe the waise hi nikle (emb 12/35 · inf 10/36 · ctx 7/15), aur chaaron ke
>   9-9 daraar bhi. Yani table pehle sahi tha — bas ek number uske apne doubt back-write se aage nikal gaya.
>   **Isi liye counts prose mein nahi rehne chahiye.**
> - **#03 aur #04 ka "viz NAHI bana" — ab galat, magar DOOSRI lane mein.** `widget.mjs list` (10 Aug) chaaron
>   locked capsules ke liye widget dikhata hai. Yeh Visualization-Contract widget hai, Design-build ka in-app
>   viz nahi — do alag cheezein, isliye niche wali row ko "in-app viz ban gaya" mat padho. Count live lo.
> - **Chaaron ka `status` aaj `tempered`** (`dot: magenta`) — table isko naam se nahi kehta, par UI yahi
>   colour drive karta (§4 metadata): `node scripts/deep.mjs` pehli screen pe hi dikha deta.

| # | Concept | recall/axes/traps/doubts/bridges/interview | **deep RENDER** | Counts |
|---|---------|---------|---------|--------|
| 01 | Tokenization | ✅ designed | ✗ **PENDING (embedded, not rendered)** | 9 daraar · 11 chaara · 21 shaq |
| 02 | Embeddings | ✅ designed | ✗ **PENDING (embedded, not rendered)** | 9 daraar · 12 chaara · 35 shaq |
| 03 | Inference & Sampling | ⏳ DATA locked, viz NAHI bana | ✗ **PENDING** | 9 daraar · 10 chaara · 36 shaq |
| 04 | Context Window | ⏳ DATA locked, viz NAHI bana | ✗ **PENDING** | 9 daraar · 7 chaara · 15 shaq |

- **deep-render = PENDING for ALL 4** (data gist + build dono mein hai; sirf screen pe nahi). Isi liye re-read
  pe notes shallow lagte the. **Yeh #1 fix.** (Brief = `FORGE_DEEP_RENDER_BRIEF.md`.)
  *(corrected 10 Aug 2026: **DONE, PENDING nahi** — §7 ka ✅ block dekho (deep.mjs 4 Aug · engine rebuild 9 Aug).
  `FORGE_DEEP_RENDER_BRIEF.md` ab bhi `learning-layer/` mein maujood hai, par woh ab **fix-vehicle nahi,
  historical brief** hai — fix us Design-session ke raaste nahi, repo ke apne raaste aaya.)*
- #03, #04 ki visualizations + wiring bhi baaki (deep ke alawa).
  *(corrected 10 Aug 2026: widget-lane mein yeh baaki nahi raha — `node scripts/widget.mjs list` chaaron ke
  liye widget dikhata hai (10 Aug ko: 4/4 bane, 1 driven). "Driven" ka matlab guess-gates chal rahe hain;
  bane-hue par un-driven widget ko Contract fail maanta hai — isliye status **command se** padho, yahan se nahi.)*
- #05–17 = abhi learn/lock nahi hue.
  *(corrected 10 Aug 2026 — do baatein. (1) Numbering purani hai: registry ab **17 nahi, 26 concepts** rakhti
  (`node -e "console.log(Object.keys(require('./dressing-room/state/concepts.json').concepts).length)"`), aur
  wahan `#05`-type numbers hai hi nahi — ids hain (`hallucinations`, `chunking`, `retrieval`, …) with
  `bucket` + `core` flags. (2) Baaki ka **core claim aaj bhi SACH hai**: locked capsules abhi bhi chaar hi
  hain — gist enumeration bhi wahi chaar deti (`mirror_manifest.json` → `enumeration.ids`), aur
  `node scripts/deep.mjs` header khud "LOCKED CAPSULES (N)" bolta. **Woh N padho, yeh line nahi.**)*

---

## 9. NAYE CONCEPT / FEATURE KE NOTES KAISE BANTE HAIN (repeatable process) — v2

> **⚠ SCOPE NOTE (added 10 Aug 2026).** Neeche wala 6-step process **Claude-Design handoff lane** ka hai, aur
> woh lane 30-Jun waali surface (claude.ai Project + alag Design project) maanke likha gaya tha. Aaj per-concept
> kaam **Claude Code ke andar** hota hai aur uska pacer state mein baitha hai: THE METHOD ke 12 steps (0-11)
> `scripts/forge_session.mjs` hold karta (`start <concept>` · `step <0-11>` · `axis <a-i> done|defer` ·
> `moment <kind>` · `status` · `close`), aur **step 4 hi widget** hai — evidence
> `grep -n "MODES: start <concept>" scripts/forge_session.mjs` · `grep -n "step 4 (the widget)" scripts/forge_session.mjs`.
> Neeche ke steps mite nahi hain (Design lane jab bhi chale, contract yahi hai), par "aaj ka session kaise
> chalta hai" ka jawab yeh section NAHI hai.

Har concept (ek baar mein ek):
1. **Claude** locked capsule (gist) curl → data byte-perfect confirm (`bash curl -s`; web_fetch gist pe blocked).
   *(corrected 10 Aug 2026: yeh step ab **manual nahi, automatic** hai — aur uska byte-proof bhi automatic hai.
   `mirror.mjs` har subah 06:55 gist ko **ENUMERATE** karta (config sirf floor hai, gist truth hai), har id
   fetch karta, aur `dressing-room/state/capsules/<id>.json` mein **verbatim fetched bytes** likhta; saath mein
   `mirror_manifest.json` per-id `{ok, bytes, sha256}` rakhta — yani "byte-perfect confirm" ab ek file mein
   likha hua hota hai, haath se karne ki cheez nahi. Fail hone pe **KEEP-LAST-GOOD** — ek fail fetch purani
   copy kabhi nahi girata. Haath se chalana ho: `node scripts/mirror.mjs`. Evidence:
   `grep -n "KEEP-LAST-GOOD" scripts/mirror.mjs` · `grep -n "ENUMERATE FIRST" scripts/mirror.mjs` ·
   `grep -n "ArsenalFC-Mirror" setup/INSTALL_TASKS.ps1`. **`curl` vs `web_fetch` wali baat ab moot hai** —
   pull Node ke apne `fetch` se hota, aur woh mirror.mjs ka "the ONLY network path" hai
   (`grep -n "the ONLY network path" scripts/mirror.mjs`). Jo NAHI badla: **gist ab bhi MASTER hai aur uspe
   likhta sirf woh hai** — "captain's manual Option-A writes only" (`grep -n "Option-A" scripts/mirror.mjs`).)*
2. **Claude** per-axis **VIZ MECHANISM SPEC** likhta (har axis ka mechanism + exact values, hero "Aristo Eco —
   ₹81,500" threaded) + chrome params (title, #num, daraar/chaara/shaq counts, pipeline, bridges, anchor).
3. **Claude** Claude-Design **handoff brief** likhta — jisme ZAROORI:
   - **3a (NEW)** — **Nikhil ka brain-profile** (§5b) + **§3.5 ka full-text-zero-overwhelm framing** + **multi-hat mandate**.
   - **3b (NEW)** — **COMPLETENESS field-list (§4)** — har gist content field jo render hona hai, naam se.
   - 3c — **4 non-negotiables** + "full creative freedom on everything else."
4. **Nikhil** ek **FRESH Claude Design session** mein paste karta (existing build + naya capsule data attach).
5. Design banata → **COMPLETENESS VERIFY (§12)** + byte-fidelity verify gist ke against → wire.
6. *(Agar split zinda rakhna ho)* Claude vanilla mein re-implement. (Shayad **moot** — §6.)
   *(corrected 10 Aug 2026: **moot nahi — yeh step ab pehla step hai, aur haath se bhi nahi hota.** Vanilla
   engine ek generator se banta hai (`node setup/build_forge_html.mjs`) aur repo mein rehta hai; §6 ka
   "PRAGMATIC current path" wala correction poori kahani deta hai. Aur step 2 ka hero example live capsules
   mein aaj bhi mila — `grep -l "Aristo Eco" dressing-room/state/capsules/*.json` chaaron files deta.)*

---

## 10. SAB KAHAN RAHTA HAI

- **DATA (canonical):** gist per-capsule files. Curl only (`web_fetch` BLOCKED gist pe; `bash curl -s`).
  *(corrected 10 Aug 2026: gist canonical hai — yeh sach hai. Par "curl only" ab nahi: pull `mirror.mjs` ka
  Node-`fetch` karta hai (§9 step 1 ka note), aur uski local verbatim copy `dressing-room/state/capsules/`
  mein rehti — engine aur `deep.mjs` dono wahi padhte, network ke bina.)*
- **VISUAL BUILD:** **alag Claude Design project** — **main learning project se searchable NAHI** (isiliye context
  baar-baar khoya — briefs/build-logs cross-paste karne padte hain).
  *(corrected 10 Aug 2026: yeh Design-build ke liye aaj bhi sach hoga, par **engine of record ab wahan nahi
  rehta** — woh is repo mein hai aur poori tarah searchable hai: `THE-FORGE.html` (root) + generator
  `setup/build_forge_html.mjs`. Jo dard yeh line describe karti thi — "context baar-baar khoya" — uska ilaaj
  yahi tha.)*
- **YEH DOC + BRIEF:** project files (canonical Design record + handoff).
  *(corrected 10 Aug 2026: "project files" purani claude.ai-Project surface thi. Dono ab **is repo mein
  git-tracked** hain — `learning-layer/FORGE_DESIGN.md` (yeh file) aur `learning-layer/FORGE_DEEP_RENDER_BRIEF.md`.
  Yeh file git mein 11 Jul 2026 ko aayi, commit `bf13cfa` "chore: migrate learning-layer canon into repo
  (verbatim, air-gapped from Project)" — `git log --oneline -- learning-layer/FORGE_DESIGN.md`. Aur wahi sabak
  jo CLAUDE.md ne THE_GAFFER.md pe seekha: **prose mein likhi hui LOCATION us din sadti hai jis din koi sync
  file ko hilaata** — isliye jagah hamesha `git ls-files` se poochho.)*
- **Engine (agar vanilla path use ho):** `THE-FORGE.html` — laptop + git, **NEVER project files.**
  *(corrected 10 Aug 2026 — do cheezein. (1) "agar vanilla path use ho" ka **agar** hat chuka hai: vanilla path
  hi ab ISTEMAAL mein hai (§6). (2) "laptop + git" ka **laptop** wala hissa hi woh ghaav tha — 22-Jun ki shipped
  copy git ke BAHAR thi aur kho gayi. Ab woh REPO ROOT mein tracked hai (`git ls-files "*.html"` → `THE-FORGE.html`)
  aur ek command se dobara ban jaati: `node setup/build_forge_html.mjs`. Evidence:
  `grep -n "lived OUTSIDE git" setup/build_forge_html.mjs`.)*

---

## 11. LOST-SYNC LEDGER (taaki dobara na repeat ho)

| Sync | Status |
|------|--------|
| FORGE_SPEC.md — deep + viz/heroViz reserved | ✅ DONE (6/22) *(re-checked 10 Aug 2026, hold: dono ab bhi `learning-layer/FORGE_SPEC.md` mein hain — `grep -n "heroViz" learning-layer/FORGE_SPEC.md`. Par §4 ka correction saath padhna: `heroViz` aaj bhi kisi capsule mein NAHI hai, isliye "reserved" ka matlab "render pending" nahi, "data pending" hai.)* |
| PROJECT OS DESIGN SYSTEM — cold-steel + workflow | ✅ DONE (OS v3.6, 6/29) *(re-checked 10 Aug 2026, hold: OS aaj bhi is file ko design-canon maanta — `grep -n "CANONICAL = FORGE_DESIGN.md" learning-layer/PROJECT_OS.md`. Version-number ab purana hai (OS header v3.13, changelog v3.14) — live version `grep -n "^# v3\." learning-layer/OS_CHANGELOG.md | head -1` se lo, kisi doc ki prose se nahi.)* |
| **FORGE_DESIGN.md — Claude-Design workflow canonical** | ✅ DONE (added project files, 6/29) *(location corrected 10 Aug 2026: "project files" purani claude.ai surface thi — yeh file ab repo mein tracked hai, `learning-layer/FORGE_DESIGN.md`, git mein 11 Jul 2026 commit `bf13cfa` se. §10 dekho.)* |
| **COMPLETENESS CONTRACT — no gist field skipped/unrendered** | ✅ DONE (this file v2 + FORGE_SPEC + OS v3.7, 6/30) *(re-checked 10 Aug 2026, hold — aur ab teen jagah nahi, CHAAR: OS mein bhi zinda hai (`grep -n "COMPLETENESS — gist ka HAR content field" learning-layer/PROJECT_OS.md`), aur 9 Aug se yeh contract **code mein** bhi utar chuka hai — generator ka generic walker + per-capsule "0 skipped" footer, §12 ka scoped note dekho. Prose se code tak pohanchne wali yeh pehli non-negotiable hai.)* |
| **deep-RENDER for all 4 topics in build** | ✅ **DONE — 10 Aug 2026 ko live verify hua.** *(was: "✗ PENDING — `FORGE_DEEP_RENDER_BRIEF.md`, next Design session" — yeh 41 din tak khada raha.)* Do surfaces: `node scripts/deep.mjs <concept> <axis>` (4 Aug) aur `THE-FORGE.html` ka deep section + per-axis "deep — poora khol" (9 Aug rebuild). Poora proof §7 ke ✅ block mein. Fix us Design-session se nahi, repo ke apne raaste aaya — brief ab historical hai. |
| Memory — completeness rule reflect | ⏳ optional propose (Nikhil ki haan pe) *(**NOT VERIFIED 10 Aug 2026** — yeh uski memory ke baare mein hai, kisi repo file ke baare mein nahi; code se na confirm ho sakta hai na refute. Claim hi maano. Aaj ka raasta bhi alag hai: durable facts `hippocampus.mjs` / MCP `note`+`remember_fact` se jaate hain, aur `remember_fact` sirf STAGE karta — canon uski haan ke baad hi.)* |

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
   *(scoped 10 Aug 2026: yeh recipe sirf `__bundler` Design-build ke liye hai. **Engine of record pe ismein se
   kuch nahi karna padta**, aur protocol ka bada hissa ab CODE ke andar hai — yani woh chhup hi nahi sakta,
   jo is section ke hone ki wajah thi:*
   - *step 1 (field-inventory) — generator ke paas `PLACED` list hai: jin fields ka apna designed section hai.*
     *`grep -n "PLACED" setup/build_forge_html.mjs`*
   - *step 2 (koi field skip na ho) — jo `PLACED` mein NAHI hai woh bhi RAW render hota, generic walker se,*
     *"⚠ Fields with no designed section yet (rendered raw — never skipped)" heading ke neeche. Yani ek naya*
     *gist field kabhi silently gaayab nahi ho sakta — sabse zyada woh badsurat dikhega.*
     *`grep -n "Fields with no designed section yet" setup/build_forge_html.mjs`*
   - *step 3 (binary pass/fail) — har capsule ke neeche footer khud ginti karta: "N data fields · X designed +*
     *Y raw — 0 skipped". `grep -n "0 skipped" setup/build_forge_html.mjs`*
   - *step 4 (verify) — plain hai: `node setup/build_forge_html.mjs` chalao, `THE-FORGE.html` kholo, footer*
     *padho; ya CLI se `node scripts/deep.mjs <concept> <axis>`. Koi atob/gunzip nahi.*
   *Jo yeh AB BHI nahi kar sakta, aur uska imaandar naam: yeh **presence** verify karta hai, **byte-fidelity**
   nahi (footer bytes compare nahi karta) aur **reachability** nahi (footer ko nahi pata koi field kis screen
   se pohanchta). Woh do checks aaj bhi HAATH ke hain — step 2 ki `₹`/em-dash wali line zinda rehti hai.)*

> Completeness = binary. "Zyadatar fields render hote hain" ≠ pass. **Har field, ya FAIL.** Yahi interview-
> integrity guarantee hai — kyunki jo screen pe nahi, wo re-read mein nahi, wo interview mein nahi.

---

**ॐ RADHA RANI KI KRIPA SE 🙏🏽**
