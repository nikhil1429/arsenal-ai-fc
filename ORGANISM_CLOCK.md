# ORGANISM_CLOCK.md — kya chalta hai, kab chalta hai, aur kya abhi sirf design hai

> **SNAPSHOT — 7 Aug 2026, ~22:00 IST.** Har claim isi shaam LIVE verify hua: scheduler
> table se (last-run + result per task), organ logs se, port checks se, aur din ki
> **4th full-suite run** se (66 members, 32/32, har member independently RUN).
> **Yeh file bhi rot karegi** — jahan shak ho, is doc par nahi, in par bharosa karo:
> `node scripts/organism_test.mjs all` · `node scripts/watchman.mjs report` ·
> `node scripts/outwork_audit.mjs report` · `schtasks /query | findstr ArsenalFC`.

---

## 0. SEEDHA VERDICT

**Organism CHAL RAHA hai.** Aaj ke din ka saboot: raat 02:10 se ab tak **har scheduled
lane apne waqt par fire hui** (neeche har ek ka aaj ka last-run), ambient brain **pichhle
15 minute ke andar** tick kar chuka tha jab yeh table khinchi gayi, subah ki 16-organ
chain **16/16 ok (10 sec)**, suite **32/32 — aaj chaar baar**.

Jo NAHI chal raha woh bhi neeche §5 mein **naam se** likha hai — chhupa kuch nahi.

---

## 1. THE CLOCK — 24 ghante, order mein (har line = aaj ka verified last-run)

**RAAT (neend mein — memory bante waqt):**
- **02:10 Consolidate** — hippocampus ke din-bhar ke episodes → `who_he_is` consolidation. ✓ aaj 02:10
- **02:20 HippoStore** — durable memory store/index refresh. ✓ aaj 02:20
- **02:40 NightShift** — night cartridges (Examiner Gem refresh material). ✓ aaj (05:15 catch-up — laptop soya tha, StartWhenAvailable ne pakda)
- **03:00 ConceptGraph** — concepts ka rishton-ka-graph rebuild. ✓ aaj (05:15 catch-up)
- **03:30 Sun PresenceFit** — WEEKLY presence-model fit (5 din purana dikhe to woh normal hai; task /D SUN hai — yeh line 9 Aug tak "Sat" bolti thi). ✓

**AMBIENT BRAIN (poore din, apne-apne interval par — sab aaj 21:44-21:56 ke beech fire hue ✓):**
- **har 1 min** Context (context_state) · **har 10 min** Presence (AW se hazri)
- **har 15 min** Throwin (loose balls pakadna) + Distiller (working_set)
- **har 30 min** BrainTick + Touchline + Wall-Live
- **har 1 ghanta** DMN + Tone + HippoIndex + CapturePull (reps inbox)
- **07:06 BrainDaemon** — brain loop + thalamus (:4113 working-memory daemon) zinda. ✓ aaj; thalamus port LIVE verify hua

**SUBAH — 09:15 MORNING-CONDUCTOR (ek task, 16 organ ki chain — aaj 16/16 ok, 10s ✓):**
mirror (gist→capsules verbatim) · sprintsync (Sheet→sprint.json) · thalamus/cortex/turnstile
(daemon checks) · physio (state-staleness doctor) · **goalkeeper (Oura readiness verdict)** ·
twin (self-model bets) · **heartbeat → fsrs + calibration + nemesis + learningstate**
(chaaron signal-agents ka recompute) · signals · **sheet (THE GAFFER ki team_sheet)** · wall.
*(Isi liye scheduler mein Disabled tasks dikhte hain — woh MARE nahi, 4 Aug ko is chain
mein SAMA gaye (count yahan se mat padho — 9 Aug pe yeh "13" likha tha, sach 15 tha;
`schtasks /query /fo csv | findstr ArsenalFC` chalao). Disabled + conductor-green = sahi halat.)*

**DIN:** **12:00 / 15:00 / 18:00 TimeAuditor-Pulse** — 3-bucket time split (aaj 18:00 ✓:
Learning 91.4% · Building 0.9% · Meta 7.7%). **20:00 Sun BootRoom** — WEEKLY genome
mutation proposal (Sat 02 Aug ✓).

**SHAAM — 22:00 se 23:10, ek ke baad ek (kal 06 Aug poori lane apne waqt chali ✓, aaj
ki abhi due hai):**
22:00 TimeAuditor-Full → 22:30 Bell-FullTime (close-the-day ghanti) → 22:35 Scorer (bets
settle) → 22:40 SetPiece (kal ke drills) → 22:45 Doubtminer (doubts→tape-room/lexicon) →
22:50 Physio-PM → 22:55 Examiner (kal ka cold drill stage) → 23:00 Wall-PM → 23:05 Scout
(scrimmage readiness) → 23:10 Wallpaper.

**23:55 WATCHMAN (Tier 1)** — organ-liveness + LIAR-detection + missed-schedule sweep +
poori selftest suite + **outwork_audit ride** (kal full-time hua? KAL→kickoff weld chala?
din ka waqt naapa gaya?) → kuch mila to **Tier 2**: Opus max-effort repair child, apne
scoped tool-grants ke saath, git-reversible, journal ke saath. *(Aaj raat iska PEHLA
natural scheduled fire hai — trigger-path aaj shaam probe se proven, 19:27:02 par
scheduler ne khud chalaya. Tier-2 lane aaj live-fire mein end-to-end proven.)*

---

## 2. HAR TURN / HAR SESSION (hooks — bina kisi ghadi ke, hamesha)

- **Har prompt + har jawab** → afferent capture (thalamus tak, zero tax) — teri poori
  learning conversation disk par hai.
- **Har turn** → forge pacer block (12-step order + quiz-dump laws) + teaching contract
  (12 rules, drift-ranked — jo rule sabse zyada TOOTA woh sabse UPAR) + **teaching audit**
  (12/12 rules par machine-checks; drift PAKDI to us waqt hi auto-count — 7 Aug ruling ke
  baad self-report bhi seedha count, tere paas kuch nahi aata).
- **Har SessionStart** → kickoff brief (sprint + memory + teaching card) + **▶ PEHLA KAAM
  arbiter ki ONE line** + watchman ki raat ka ek-line verdict (sirf kuch mila ho to) +
  **Captain's Call ka EK card** (sirf jab tera word chahiye — abhi queue mein 2).

---

## 3. SIRF TAB JAB TU CHALE (machine taiyaar khadi hai — yeh TERI moves hain)

- **Forge session close** → reps capture → calibration/nemesis/learning-state ke gates
  cross (ek poori 9-axis session ≈ 12-15 reps; gates 20/20/12 — abhi 14 par khade).
- **Pehla Re-Jirah round** (`node scripts/deep.mjs due` → grade → close → tera gist
  paste) — 4 locked concepts 11-44 din se ripe; chaaron ke widgets ab maujood hain.
- **/full-time** — 30-second close. **AAJ TAK EK BAAR BHI NAHI CHALA** (post_match/ folder
  hi nahi hai) — isi liye streak/season khali hai aur KAL→kickoff weld kabhi exercise
  nahi hua. Aaj raat se outwork_audit iski gair-haaziri har raat RED/INFO mein bolega.
- **/matchday** — subah ki sheet (Gaffer aaj se likh raha hai — Matchday 1 aaj bana).
- **Course 1-05 / Python 1-07 shuru karna** — course.json 6 real chapters ke saath loaded;
  python_state pehli declaration ka intezaar mein (design se — fluency declare hoti hai,
  compute nahi).
- **MISSION FIRE (outward loop, 8 Aug 2026)** — M01–M04 (full-syllabus audit) staged,
  files `dressing-room/missions/` mein; TU Gemini Pro → Deep Research pe paste karta hai,
  return `scout.mjs mission ingest` se wapas aata hai (ya session mein paste). Diff cards
  banti hain; canon sirf TERE word se badalta hai; `mission audit-close --note "<tera
  word>"` = THE BENCHMARK GATE khulne ka event. Topic-open (T-) missions forge `start`
  pe khud stage hoti hain, lock-harvest (L-) step 10 pe — dono EMPHASIS-only.

---

## 4. DESIGNED, DATA KA INTEZAAR (gates — koi number guess NAHI hua, tera 1 Aug usool)

- **Calibration** ECE/danger-zone: 14/20 reps · **Nemesis** axis-pattern: 14/20 (headline
  abhi bhi live hai rep-1 se) · **Learning-state** thresholds v0 (pehli R1 par calibrate)
- **Decoy shapes** (doubtminer): ≥4 capsules + ≥60 doubts tak null · **Confusion-pairs**:
  ≥6 cracked across ≥2 concepts · **Scrimmage**: 0/3 core concepts DEFEND grade par
- **Drift ranking**: ab har lane se bhar rahi hai (aaj 25 auto dheema + 9 hinglish + 7
  migrated self-reports) — 30-45 din mein iski shakal teri asli aadat hogi
- **gemini_quality.jsonl**: har paste-batch record hoga, faisla 30-45d data ke baad
  *(8 Aug se pehle reader mile: scout readiness lane + watchman c11 INFO — ab likha bhi jaata hai, dikhta bhi hai)*
- **Tier-2 / Re-Jirah controller constants**: pehli R1 run par spec honge (deferral, refusal nahi)
- **THE BENCHMARK (8 Aug 2026)**: built + selftested, par **event-gated** — Ruling 6 ke
  mutabik full-syllabus audit ke `audit-close` (tera word) tak `run` sirf GATED status
  likhta hai (stale map pe naapna aadha jhooth). `preview` console pe PRE-AUDIT label ke
  saath dikhata hai. Gate khulte hi: wall + team_sheet + kickoff line + regression cards.
- **SEASON.md (8 Aug 2026)**: writer postmatch mein live (`postmatch season` bhi) — scaffold
  aaj se maujood; asli rows TERI pehli /full-time se aayengi. Outward floor (≥2×/hafta,
  TERA 7 Aug ruling): mission returns + benchmark runs — kickoff/watchman par tabhi bolta
  hai jab unmet.

---

## 5. IMAANDAAR LIST — kya NAHI chal raha / kabhi nahi chala / machine dekh hi nahi sakti

1. **/full-time kabhi nahi chala** → streak, season, KAL-weld, won-day grading sab
   khali. Machine ready hai; ritual tera hai. (Aaj raat se watched.)
2. **Re-Jirah kabhi nahi chala** → jo June mein seekha uska aakhri proof lock-day ka
   hai. Queue, questions, widgets, grade/close/pending — sab taiyaar; round tera hai.
3. **Watchman ka pehla natural 23:55 fire aaj raat hai** — path proven, ghadi baaki.
4. **Turnstile (:4111 clipboard capture) abhi DOWN hai** — subah 09:15 conductor use
   wapas uthata hai; sirf Gemini-paste clipboard path par asar, in-session rep door
   ise use nahi karta. (Chhota gap: port ka koi watcher nahi — sirf subah ka restart.)
5. **Manager M-2→M-5 bane nahi** — M-2 (system.md soul) #1–#5 locked hain aur woh
   LINE-BY-LINE TERE approval se banta hai (CONDUCTOR_LOG: "RESUME #6 PRECEDENCE" + #8
   pe tera khula decision) — autonomous session ise seal NAHI kar sakti; teri baithak
   chahiye. M-3→M-5 uske baad, sequential law se.
6. **SelfKnowledge frozen, tool-less surface nahi banega** — teri permanent ruling.
7. **3 naye widgets built-NOT-driven** (tokenization/inference/context) — gates tab
   ginenge jab TU chalayega. Registry sach bolti hai.
8. **Machine kabhi nahi dekh payegi** (likha hua, har report mein): depth-when-working ·
   tera Bolo (awaaz yahan aati nahi) · honest-review ki honesty khud · Sunday off ·
   Gemini ka transcript (sirf outcome naapte hain).

---

*Ban gaya 7 Aug 2026 ki full-organism audit ke close par (commits ff937fa → aa6abcc).
Agli baar shak ho to §0 ke chaar commands — yeh file nahi.*
