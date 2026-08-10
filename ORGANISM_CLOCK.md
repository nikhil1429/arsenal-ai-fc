# ORGANISM_CLOCK.md — kya chalta hai, kab chalta hai, aur kya abhi sirf design hai

> **SNAPSHOT — 7 Aug 2026, ~22:00 IST.** Har claim isi shaam LIVE verify hua: scheduler
> table se (last-run + result per task), organ logs se, port checks se, aur din ki
> **4th full-suite run** se (member count + check count yahan se mat padho — neeche
> dekho, aur `node scripts/organism_test.mjs all` chalao).
> **Yeh file bhi rot karegi** — jahan shak ho, is doc par nahi, in par bharosa karo:
> `node scripts/organism_test.mjs all` · `node scripts/watchman.mjs report` ·
> `node scripts/outwork_audit.mjs report` · `schtasks /query | findstr ArsenalFC`.
>
> **(corrected 10 Aug 2026 — poori file re-verified live.)** Yeh line 10 Aug tak
> "**66 members, 32/32**" bolti thi. Aaj ka live run: suite ke **73 members** hain aur
> suite ke apne checks **32** hain (`organism_test: 31 passed, 1 failed` — us ek RED ka
> naam `dugout`, aur us ghadi `scripts/dugout.mjs` doosre kaam ke haath mein khula tha,
> to yeh number bhi kal jhoot ho jayega). Yehi is file ki apni chetavni thi aur yeh
> ussi mein phansi: **ek ginti prose mein likhi = agle run par sadi hui.** Isi liye
> dono ginti ab command se aati hain, is line se nahi. Baaki har §-wise sudhaar apne
> apne section mein scar ke saath likha hai — kuch bhi chupke se overwrite nahi hua.

---

## 0. SEEDHA VERDICT

**Organism CHAL RAHA hai.** Aaj ke din ka saboot: raat 02:10 se ab tak **har scheduled
lane apne waqt par fire hui** (neeche har ek ka aaj ka last-run), ambient brain **pichhle
15 minute ke andar** tick kar chuka tha jab yeh table khinchi gayi, subah ki 16-organ
chain **16/16 ok (10 sec)**, suite **32/32 — aaj chaar baar**.

Jo NAHI chal raha woh bhi neeche §5 mein **naam se** likha hai — chhupa kuch nahi.

> **(corrected 10 Aug 2026.)** Upar ka paragraph **7 Aug ki shaam ka** hai aur waisa hi
> chhoda gaya hai — voh us din sach tha. 10 Aug ka verdict abhi bhi **CHAL RAHA hai**,
> par ginti alag hai, isliye number nahi, **command** likhi ja rahi hai:
> - subah ki chain: `node -e "const j=require('./dressing-room/state/conductor.json');console.log(j.ok+'/'+j.ran)"`
>   — 10 Aug ko yeh **14/16** tha (`thalamus` + `cortex` FAIL, chain phir bhi poori chali;
>   dono port aaj live hain, D2 watchdog ne uthaya — §5.4 dekh).
> - suite: `node scripts/organism_test.mjs all` (aaj 31/32, 73 members).
> - "har lane apne waqt par": `schtasks /query /fo csv /v | findstr ArsenalFC` — last-run +
>   last-result column. 10 Aug ko do non-zero result dikhe: **ConceptGraph = 1** aur
>   **Morning-Conductor = 1**, aur **Evening-Conductor abhi tak SCHEDULER se ek baar bhi
>   nahi chala** (last-run `30-11-1999`, result `267011` = task-has-not-run).

---

## 1. THE CLOCK — 24 ghante, order mein (har line = aaj ka verified last-run)

**RAAT (neend mein — memory bante waqt):**
- **02:10 Consolidate** — hippocampus ke din-bhar ke episodes → `who_he_is` consolidation. ✓ aaj 02:10
- **02:20 HippoStore** — durable memory store/index refresh. ✓ aaj 02:20
- **02:40 NightShift** — night cartridges (Examiner Gem refresh material). ✓ aaj (05:15 catch-up — laptop soya tha, StartWhenAvailable ne pakda)
- **03:00 ConceptGraph** — concepts ka rishton-ka-graph rebuild. ✓ aaj (05:15 catch-up)
  *(corrected 10 Aug 2026: task `cd /d <repo> && node scripts\cortex.mjs consolidate` chalata
  hai — cortex, hippocampus nahi. Aur ✓ ab bina shart nahi: 10 Aug ka fire 03:00:01 par hua
  par **last result = 1**, yaani exit non-zero. Result column ko last-run ke saath hi padho.)*
- **03:30 Sun PresenceFit** — WEEKLY presence-model fit (5 din purana dikhe to woh normal hai; task /D SUN hai — yeh line 9 Aug tak "Sat" bolti thi). ✓
  *(10 Aug: aakhri fire 09-08 03:30 = Sunday, agla 16-08 — SUN hi hai, line sahi hai.)*
- **03:45 Groundsman-Push** — *(added 10 Aug 2026: yeh lane is file mein LIKHI HI NAHI THI.
  `groundsman.mjs push`, daily, laptop ka apna unattended state-push; 10 Aug 03:45:01 ✓
  result 0. Commit `49bc94e` "groundsman: unattended state push (laptop)".)*
- **03:52 WakeProbe** — *(added 10 Aug 2026: yeh bhi likhi nahi thi. Ek line `echo woke` →
  `scripts/wakeprobe.log`; laptop raat ko jaga ya nahi, uska sabse sasta saboot. 10 Aug
  03:52:01 ✓. StopOnBattery iska ekmatra condition hai.)*

**AMBIENT BRAIN (poore din, apne-apne interval par — sab aaj 21:44-21:56 ke beech fire hue ✓):**
- **har 1 min** Context (context_state) · **har 10 min** Presence (AW se hazri)
- **har 15 min** Throwin (loose balls pakadna) + Distiller (working_set)
- **har 30 min** BrainTick + Touchline + Wall-Live
- **har 1 ghanta** DMN + Tone + HippoIndex + CapturePull (reps inbox)
- **07:06 BrainDaemon** — brain loop + thalamus (:4113 working-memory daemon) zinda. ✓ aaj; thalamus port LIVE verify hua

> **(corrected 10 Aug 2026 — yeh poori ambient list purani ho chuki thi. Interval kabhi
> prose mein mat padho, hamesha `schtasks /query /fo csv /v | findstr ArsenalFC` ki
> "Repeat: Every" column se.)** Live table par jo galat nikla:
> - **`ArsenalFC-Context` naam ka koi task ab MAUJOOD HI NAHI hai** —
>   `schtasks /query /tn "ArsenalFC-Context"` → *ERROR: The system cannot find the file
>   specified*. `scripts/context.mjs` file zinda hai aur `context_state.json` ki akeli
>   maalik hai (`context.mjs` header: "single-writer — owns ONLY context_state.json"),
>   par use har minute chalane wali ghadi hat chuki hai. Yaani "har 1 min Context" ab
>   **ek design line hai, chalta hua lane nahi.** Kisne hataya aur kyun — is file se
>   confirm nahi hota. **(NOT VERIFIED 10 Aug 2026 — task ki gair-haaziri verified hai,
>   uski wajah nahi; treat the reason as unknown, not as a decision.)**
> - **Presence ab har 10 min nahi, har 1 MINUTE chalta hai** (`ArsenalFC-Presence`,
>   `presence.mjs sense`, Repeat: Every 0 Hour(s), 1 Minute(s), start 23:17 09-08).
> - **Tone ab har 1 ghanta nahi, har 5 MINUTE chalta hai** (`ArsenalFC-Tone`, Repeat:
>   Every 0 Hour(s), 5 Minute(s), start 23:20 09-08). DMN · HippoIndex · CapturePull —
>   teeno abhi bhi hourly ✓.
> - **Teen ambient lane yahan likhi hi nahi thi**, aur teeno LADDER-A2/D2 se aayi hain:
>   **har 10 min Daemon-Watchdog** (`daemon_watchdog.mjs pass`) · **har 10 min
>   ShadowDetect** (`dugout.mjs shadow-detect`) · **har 1 min DugoutReminders**
>   (`dugout.mjs fire-reminders`).
> - **BrainDaemon aur thalamus do alag cheezein hain — yeh line unhein jodti thi.**
>   `ArsenalFC-BrainDaemon` sirf `node scripts/brain.mjs daemon` chalata hai, aur woh
>   **:4116** par singleton baandhta hai (`brain.mjs`: *"daemon singleton on :4116 already
>   stops the common double-runner"*, aur port registry ussi file mein: *"4111 turnstile ·
>   4112 cortex · 4113 thalamus · 4114 dugout"* + *"brain takes 4115 (verified free)"*).
>   Thalamus ko **subah ka conductor** uthata hai (`conductor.mjs` MORNING chain ka
>   `{ id: "thalamus", daemon: { port: 4113 } }`) aur ab **D2 watchdog** bhi. 10 Aug ka
>   port check: 4111 · 4112 · 4113 · 4114 · 4116 — **sab True**.

**SUBAH — 09:15 MORNING-CONDUCTOR (ek task, 16 organ ki chain — aaj 16/16 ok, 10s ✓):**
mirror (gist→capsules verbatim) · sprintsync (Sheet→sprint.json) · thalamus/cortex/turnstile
(daemon checks) · physio (state-staleness doctor) · **goalkeeper (Oura readiness verdict)** ·
twin (self-model bets) · **heartbeat → fsrs + calibration + nemesis + learningstate**
(chaaron signal-agents ka recompute) · signals · **sheet (THE GAFFER ki team_sheet)** · wall.
*(Isi liye scheduler mein Disabled tasks dikhte hain — woh MARE nahi, 4 Aug ko is chain
mein SAMA gaye (count yahan se mat padho — 9 Aug pe yeh "13" likha tha, sach 15 tha;
`schtasks /query /fo csv | findstr ArsenalFC` chalao). Disabled + conductor-green = sahi halat.)*

> **(corrected 10 Aug 2026.)** Chain ka **16 organ** wala dhaancha sahi hai — `conductor.mjs`
> ka exported `MORNING` array aaj bhi theek 16 step ka hai (mirror · sprintsync · thalamus ·
> cortex · turnstile · physio · goalkeeper · twin · heartbeat · fsrs · calibration · nemesis ·
> learningstate · signals · sheet · wall) — aur naam bhi wahi hain jo upar likhe hain.
> Galat sirf **"aaj 16/16 ok, 10s"** wala natija tha, jo 7 Aug ka snapshot hai. 10 Aug ka
> asli natija: `conductor.json` → started `2026-08-10T03:45:02Z` (= 09:15 IST), `ran 16`,
> **`ok 14`, `failed 2`** — `thalamus` aur `cortex` dono FAIL, total 9,763ms.
> Natija hamesha yahan se: `node -e "const j=require('./dressing-room/state/conductor.json');console.log(j.ok+'/'+j.ran)"`.
> Ek aur baat jo yeh line nahi kehti: chain ke teen daemon step (thalamus/cortex/turnstile)
> **port-probe** hain, `daemon.port` se marked — port jawab de raha ho to organ ko chhod
> diya jaata hai, warna VBS cloak se detached launch. Woh FAIL "organ mara" nahi, "us pass
> par port nahi utha" hai.

**DIN:** **12:00 / 15:00 / 18:00 TimeAuditor-Pulse** — 3-bucket time split (aaj 18:00 ✓:
Learning 91.4% · Building 0.9% · Meta 7.7%). **20:00 Sun BootRoom** — WEEKLY genome
mutation proposal (Sat 02 Aug ✓).

> **(corrected 10 Aug 2026.)** Teeno pulse-time sahi hain — `ArsenalFC-TimeAuditor-Pulse`
> ek hi task hai jiske **teen trigger** hain (12:00 · 15:00 · 18:00), isi liye
> `schtasks` csv mein woh teen baar dikhta hai; 10 Aug ka last-run 18:00:01 ✓ result 0.
> **Percentage yahan se mat padho** — woh 7 Aug ka split hai aur roz badalta hai. Live:
> `node scripts/timeaudit.mjs` (10 Aug ka read: active 271m · Learning 249m 92.1% ·
> Building 10m 3.8%).
> **BootRoom ka "(Sat 02 Aug ✓)" ab purana hai** — task `/D SUN` hai (line khud "Sun"
> kehti hai), aur aakhri asli fire **09-08-2026 20:22:48** (Sunday) tha, agla 16-08 20:00.
> Yaani 02 Aug wala Sat-fire ab is lane ka sach nahi — Sunday hai.

**SHAAM — 22:00 se 23:10, ek ke baad ek (kal 06 Aug poori lane apne waqt chali ✓, aaj
ki abhi due hai):**
22:00 TimeAuditor-Full → 22:30 Bell-FullTime (close-the-day ghanti) → 22:35 Scorer (bets
settle) → 22:40 SetPiece (kal ke drills) → 22:45 Doubtminer (doubts→tape-room/lexicon) →
22:50 Physio-PM → 22:55 Examiner (kal ka cold drill stage) → 23:00 Wall-PM → 23:05 Scout
(scrimmage readiness) → 23:10 Wallpaper.

> **(corrected 10 Aug 2026 — yeh poora paragraph ab dhaanche se galat hai. Subah ke saath
> jo 4 Aug ko hua tha, wahi shaam ke saath 9 Aug ko ho gaya.)** Woh nau alag-alag
> Task Scheduler rows **ab nau alag ghadiyaan nahi hain** — LADDER D1 (9 Aug 2026) ne
> unhein **ek** task mein sameta: `ArsenalFC-Evening-Conductor`, daily **22:00**,
> `conductor.mjs evening`. `conductor.mjs` khud yeh likhta hai: *"The evening was nine
> loose Task Scheduler rows staggered 22:00→23:10, the same disease the morning had
> before this file existed"*. Purani rows scheduler mein **Disabled** padi hain — wahi
> "Disabled ≠ mara" wala haal jo subah ka hai.
> - Chain ka asli order (`conductor.mjs` ka exported `EVENING` array, **11 step**, na ki 9):
>   **bell 22:00 → scorer 22:35 → scoreboard 22:38 → nikhil-model 22:39 → setpiece 22:40
>   → doubtminer 22:45 → physio-pm 22:50 → examiner 22:55 → wall-pm 23:00 → scout 23:05
>   → wallpaper 23:10**. Do step is line ke likhe jaane ke BAAD paida hue:
>   **scoreboard** (`scoreboard.mjs run`, H1) aur **nikhil-model** (`nikhil_model.mjs
>   ingest`, H3, 10 Aug) — dono deliberately scorer ke baad aur setpiece ke pehle, kyunki
>   22:40 ke baad ka koi bhi slot KAL ki `drills.json` padhta hai.
>   `at` ab sirf padhne ke liye hai — asli order array ka hai, ghadi ka nahi.
> - **Bell 22:30 nahi, 22:00 hai.** Yeh line "22:30 Bell-FullTime" kehti thi; live task
>   `ArsenalFC-Bell-FullTime` ka Start Time **22:00:00** hai, aur `EVENING` array mein
>   bhi `{ id: "bell", at: "22:00" }` — file khud kehti hai *"Bell 22:00 is HIS ruled
>   time, not drift — read live off schtasks 9 Aug 2026, not off a doc"*.
> - **TimeAuditor-Full chain ke ANDAR nahi hai** — woh apna alag Enabled task hai, daily
>   22:00 (last run 09-08 22:00:01 ✓). Yaani 22:00 par do cheezein chalti hain.
> - **Aur sabse zaroori: yeh chain scheduler se abhi tak EK BAAR bhi nahi chali.**
>   `ArsenalFC-Evening-Conductor` ka last-run `30-11-1999 00:00:00`, last-result
>   `267011` (task-has-not-run). `conductor_evening.json` maujood hai — par woh
>   09-08 22:33 IST ka **haath se chalaya hua** pass hai (9 step, 9 ok, us waqt
>   scoreboard/nikhil-model paida hi nahi hue the). Chain proven hai; **ghadi se chalna
>   abhi baaki hai.** Live: `node -e "console.log(require('./dressing-room/state/conductor_evening.json'))"`.

**23:55 WATCHMAN (Tier 1)** — organ-liveness + LIAR-detection + missed-schedule sweep +
poori selftest suite + **outwork_audit ride** (kal full-time hua? KAL→kickoff weld chala?
din ka waqt naapa gaya?) → kuch mila to **Tier 2**: Opus max-effort repair child, apne
scoped tool-grants ke saath, git-reversible, journal ke saath. *(Aaj raat iska PEHLA
natural scheduled fire hai — trigger-path aaj shaam probe se proven, 19:27:02 par
scheduler ne khud chalaya. Tier-2 lane aaj live-fire mein end-to-end proven.)*

> **(corrected 10 Aug 2026: "aaj raat PEHLA natural fire hai" ab bekaar hai — woh raat
> beet chuki.)** Watchman ab **rozana apni ghadi par chal raha hai**: task ka last-run
> `09-08-2026 23:55:01`, result 0, agla 10-08 23:55. Uske apne report ka header:
> *last sweep `2026-08-09T18:25:03Z`* (= 23:55 IST) aur *tier2: last ran 2026-08-09*.
> Tier-2 bhi ab kaagaz par nahi, **journal** mein hai — par ussi journal ne ek RED bhi
> khada kiya hai jo aaj tak khula hai: **`tier2-vanished`** — *"a Tier-2 repair child
> started on a previous day and left NO exit stamp and NO journal row"* (evidence: last
> TIER 2 START `2026-08-08T07:43:43Z`, uske baad `watchman_repair.log` mein koi "TIER2
> EXIT" nahi). Yaani repair-arm ka ek pass **chupchaap mar gaya** tha. Roz ka sach:
> `node scripts/watchman.mjs report` — is line se nahi.

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

> **(verified 10 Aug 2026 — §2 ka dhaancha poora sach nikla, sirf ek ginti sadi thi.)**
> `.claude/settings.json` ke hooks aaj bhi wahi hain jo yeh section kehta hai:
> UserPromptSubmit par `hooks/afferent-post.mjs` + `forge_session.mjs contract` +
> `teaching_contract.mjs print` + `teaching_audit.mjs hook`; Stop par afferent-post +
> teaching_audit; SessionStart par `teaching_contract.mjs reset-turns` →
> `learnstate.mjs brief` → `forge_session.mjs boot` → `watchman.mjs brief` →
> `captains_call.mjs deal`; PreCompact par brief. **12 rules** bhi sach —
> `teaching_contract.json` ka `rules` array ki length 12 hai — aur audit ki coverage bhi
> literally 12/12: `node scripts/teaching_audit.mjs report` → *"coverage: checks exist
> for 12 of 12 contract rules"*. Arbiter ki ONE line bhi wired hai (`learnstate.mjs` ka
> `▶ PEHLA KAAM` emit + uska apna assert *"brief() carries exactly one PEHLA KAAM line"*).
> **Galat sirf "abhi queue mein 2" tha** — 10 Aug ko `node scripts/captains_call.mjs list`
> par **8 card LIVE** hain (baaki settled). Queue ki ginti kabhi prose se mat padho,
> `captains_call.mjs list` se padho — aur SessionStart par dealt ab bhi **EK** hi hota
> hai, THE ANCHOR LAW ke mutabik.

---

## 3. SIRF TAB JAB TU CHALE (machine taiyaar khadi hai — yeh TERI moves hain)

- **Forge session close** → reps capture → calibration/nemesis/learning-state ke gates
  cross (ek poori 9-axis session ≈ 12-15 reps; gates 20/20/12 — abhi 14 par khade).
  > **(corrected 10 Aug 2026: "abhi 14 par khade" galat hai — par asli sudhaar yeh nahi
  > ki number kya hai, asli sudhaar yeh hai ki **yahan number likhna hi galti hai**.)**
  > Gate ke **need** sahi hain (20/20/12) aur woh code mein baithe hain, isliye woh rahe.
  > **have** yahan se bilkul mat padho — is repair ke DAURAAN hi woh do baar badla:
  > 13:14 IST par `calibration.json` `danger_zone 17/20 · status "warming_up"` bol raha
  > tha, aur 13:31 IST par ussi file ne `21/20 · open true` bola. Sattarah minute. Jo
  > line teen din purani ho ke sadi thi, uska naya version **ussi baithak mein** sad
  > gaya. Isliye teeno ka ek hi jawab hai, aur woh command hai:
  > `node -e "for (const f of ['calibration','weaknesses','learning_state']) console.log(f, JSON.stringify(require('./dressing-room/state/'+f+'.json').gate))"`
  > · Jo **dhaancha** likhne layak hai (woh nahi badalta): teeno gate alag-alag ginti
  > karte hain aur alag-alag khulte hain — calibration ka `danger_zone` ke saath ek
  > `trend` sub-gate bhi hai jo **/40** par hai (yeh line use kabhi bolti hi nahi thi),
  > nemesis ka gate `weaknesses.json` mein `met: true/false` hai, aur learning-state ke
  > apne do sub-gate reps par nahi balki *"correct in a row"* / *"cold-fast in a row"*
  > par khade hain — yaani reps chadhne se woh do **kabhi apne aap nahi khulenge**.
  > (`wc -l < dressing-room/state/reps_log.jsonl` alag ginti hai, gate ki nahi.)
- **Pehla Re-Jirah round** (`node scripts/deep.mjs due` → grade → close → tera gist
  paste) — 4 locked concepts 11-44 din se ripe; chaaron ke widgets ab maujood hain.
  > **(corrected 10 Aug 2026: "11-44 din" 7 Aug ka number tha; overdue roz badhta hai, to
  > yeh ginti roz jhooti hoti hai.)** 10 Aug ka live read (`node scripts/rejirah.mjs due`):
  > **inference 44d · context 40d · embeddings 47d · tokenization 14d overdue**, har
  > concept ke 9 axes due, sab `R-early (gentle cold)`. Widgets wali baat sach hai —
  > `node scripts/widget.mjs list` → *"4/4 locked capsules have a widget · 1 driven"*.
  > Aur ek cheez yeh line nahi kehti: round abhi bhi **ZERO** hain —
  > `node scripts/rejirah.mjs pending` → *"rejirah_log.jsonl does not exist — 0 axis
  > grade(s), 0 rounds EVER closed"*.
- **/full-time** — 30-second close. **AAJ TAK EK BAAR BHI NAHI CHALA** (post_match/ folder
  hi nahi hai) — isi liye streak/season khali hai aur KAL→kickoff weld kabhi exercise
  nahi hua. Aaj raat se outwork_audit iski gair-haaziri har raat RED/INFO mein bolega.
  > **(re-verified 10 Aug 2026 — yeh line abhi bhi SACH hai, aur ab uska nightly saboot
  > bhi hai.)** `dressing-room/post_match` folder aaj bhi maujood nahi
  > (`ls dressing-room/` → SEASON.md · archive · club · hippocampus · manager · missions ·
  > state · char vault folder — post_match nadaarad). Aur jo "aaj raat se bolega" likha
  > tha, woh bol raha hai: `node scripts/outwork_audit.mjs report` →
  > `[INFO] fulltime-missing … post_match/2026-08-09.md absent`.
- **/matchday** — subah ki sheet (Gaffer aaj se likh raha hai — Matchday 1 aaj bana).
  > **(corrected 10 Aug 2026: "Matchday 1 aaj bana" ko aaj ki taareekh mat samajhna.)**
  > Sheet **roz** dobara banti hai — `dressing-room/state/team_sheet.md` par 10 Aug 08:45
  > ka timestamp hai aur uski pehli line *"TEAM SHEET — 2026-08-10 · Matchday 1 ·
  > 🤝 Introduction"* hai. Woh **abhi bhi Matchday 1** isi liye hai ki matchday tabhi
  > badhta hai jab koi /full-time close hota hai (upar wala point) — yaani "Matchday 1"
  > tareekh nahi, **un-played season ka counter** hai. Sheet ka apna warning bhi ussi
  > file mein: *"readiness is writing on time but saying nothing new — its content is
  > 126h old."*
- **Course 1-05 / Python 1-07 shuru karna** — course.json 6 real chapters ke saath loaded;
  python_state pehli declaration ka intezaar mein (design se — fluency declare hoti hai,
  compute nahi).
  > **(verified 10 Aug 2026, dono aadhe sach nikle.)** `course.json` ka `chapters` array
  > ki length **6** hai ✓. Aur `node scripts/python_state.mjs brief` →
  > `{"present":false,"line":"python: not started — node scripts/python_state.mjs subtopic
  > <name> --tier T0 when 1-07 opens","fluency":"🔴"}` — yaani declaration ka intezaar
  > abhi bhi chal raha hai ✓.
- **MISSION FIRE (outward loop, 8 Aug 2026)** — M01–M04 (full-syllabus audit) staged,
  files `dressing-room/missions/` mein; TU Gemini Pro → Deep Research pe paste karta hai,
  return `scout.mjs mission ingest` se wapas aata hai (ya session mein paste). Diff cards
  banti hain; canon sirf TERE word se badalta hai; `mission audit-close --note "<tera
  word>"` = THE BENCHMARK GATE khulne ka event. Topic-open (T-) missions forge `start`
  pe khud stage hoti hain, lock-harvest (L-) step 10 pe — dono EMPHASIS-only.
  > **(verified + updated 10 Aug 2026.)** `node scripts/scout.mjs mission list` →
  > M01/M02/M03/M04 chaaron `audit`, `staged 2d`, files `dressing-room/missions/` mein ✓ —
  > aur ab unke saath **`T-hallucinations` bhi staged (1d)** khada hai, `topic_open` kind
  > ke saath. Yaani "T- missions forge start pe khud stage hoti hain" ab sirf design nahi,
  > disk par ek file hai (`dressing-room/missions/T-hallucinations.md`). Desk ka apna
  > gate-line: *"audit gate: gated — audit in flight"*, aur
  > *"full-syllabus audit 0/4 returned — next fire: M01"*. Ginti roz nahi, event par
  > badlegi — phir bhi `mission list` se padho, yahan se nahi.

---

## 4. DESIGNED, DATA KA INTEZAAR (gates — koi number guess NAHI hua, tera 1 Aug usool)

- **Calibration** ECE/danger-zone: 14/20 reps · **Nemesis** axis-pattern: 14/20 (headline
  abhi bhi live hai rep-1 se) · **Learning-state** thresholds v0 (pehli R1 par calibrate)
  > **(corrected 10 Aug 2026 — dono "14/20" jhoot ho chuke the, aur nemesis to gate hi
  > cross kar chuka hai: `weaknesses.json` → `gate.met true`.)** Naya number yahan
  > jaan-boojh kar **nahi** likha ja raha — repair ke DAURAAN hi calibration ka have
  > 17 se 21 ho gaya (poori kahani §3 ke pehle bullet ke neeche). Ek hi command dono
  > jagah chalti hai, wahi padho. Nemesis ka headline sach mein rep-1 se live hai aur
  > aaj asli hai: *"9× miss on hallucinations — axis a keeps breaking"* (`weaknesses.json`).
- **Decoy shapes** (doubtminer): ≥4 capsules + ≥60 doubts tak null · **Confusion-pairs**:
  ≥6 cracked across ≥2 concepts · **Scrimmage**: 0/3 core concepts DEFEND grade par
  > **(verified 10 Aug 2026 — is bullet ke teeno number code se milte hain, koi sudhaar
  > nahi chahiye; sirf ab yeh likha hai ki woh kahan likhe hain.)** Decoy:
  > `doubtminer.mjs` → `gates: { min_capsules: 4, min_doubts: 60 }` ✓. Confusion-pairs:
  > `rejirah.mjs` → `(cracked.length >= 6 && distinct.size >= 2)` ✓. Scrimmage: aaj bhi
  > **0/3** — `scout.json` → `"scrimmage 0/3 core concepts at DEFEND grade"` ✓ (uske saath
  > ek doosri readiness bhi hai jo yahan likhi nahi thi: *finops 0/3 python core skills
  > ≥ held*). Capsules disk par 4 hain (`ls dressing-room/state/capsules/` →
  > context · embeddings · inference · tokenization).
- **Drift ranking**: ab har lane se bhar rahi hai (aaj 25 auto dheema + 9 hinglish + 7
  migrated self-reports) — 30-45 din mein iski shakal teri asli aadat hogi
  > **(corrected 10 Aug 2026: teen mein se do ginti teen din mein teen guna ho gayi —
  > yahi wajah hai ki drift-count kabhi prose mein nahi likhna chahiye.)** Live
  > `node scripts/teaching_contract.mjs print` → **dheema-not-lamba 78× (78 auto)** aur
  > **hinglish 11× (11 auto)**. `self_reports` abhi bhi **7** hai
  > (`teaching_contract.json` → `self_reports.length`), yaani woh ek ginti nahi badli.
  > Aur audit ki apni gehri ginti alag hai — `node scripts/teaching_audit.mjs report` →
  > *202 turn(s) audited · 111 with drift* (81× dheema-not-lamba · 38× one-idea ·
  > 12× hinglish · 8× no-system-mid-concept · 5× his-level · 3× neev-pehle · 2× decided).
  > Dono ginti alag organ ki hain aur dono sahi hain; bharosa command par, is line par nahi.
- **gemini_quality.jsonl**: har paste-batch record hoga, faisla 30-45d data ke baad
  *(8 Aug se pehle reader mile: scout readiness lane + watchman c11 INFO — ab likha bhi jaata hai, dikhta bhi hai)*
  > **(corrected 10 Aug 2026: "ab likha bhi jaata hai" over-claim hai — writer wired hai,
  > par file ab tak paida nahi hui.)** `capture.mjs` mein lane maujood hai
  > (`const GEMINI_QUALITY = join(STATE_DIR, "gemini_quality.jsonl")`, aur paste ke baad
  > ka console line *"gemini-quality row recorded … → gemini_quality.jsonl"*), lekin
  > `ls dressing-room/state/gemini_quality.jsonl` → **No such file or directory**. Yaani
  > **abhi tak ek bhi paste-batch record nahi hua** — lane taiyaar, data zero. Watchman
  > yeh khud bolta hai: *"the /harvest lane exists (since 9 Aug 2026) but no sitting has
  > been harvested yet … teaching there stays UNMEASURED"* (`harvest_log.jsonl` bhi abhi
  > maujood nahi hai). Yeh **un-run** hai, clean sheet nahi.
- **Tier-2 / Re-Jirah controller constants**: pehli R1 run par spec honge (deferral, refusal nahi)
  > **(verified 10 Aug 2026 — abhi bhi deferral hai, aur ab uska saboot bhi hai.)**
  > `rejirah.mjs` khud kehta hai ki `edgeMap` / `confusionPairs` jaise field ka *"FINAL
  > shape + constants"* baad mein spec honge, aur R1 ab tak aaya hi nahi:
  > `node scripts/rejirah.mjs pending` → *"0 rounds EVER closed"*. Yaani yeh bullet apni
  > shart par khada hai — kuch refuse nahi hua, R1 hi nahi hua.
- **THE BENCHMARK (8 Aug 2026)**: built + selftested, par **event-gated** — Ruling 6 ke
  mutabik full-syllabus audit ke `audit-close` (tera word) tak `run` sirf GATED status
  likhta hai (stale map pe naapna aadha jhooth). `preview` console pe PRE-AUDIT label ke
  saath dikhata hai. Gate khulte hi: wall + team_sheet + kickoff line + regression cards.
  > **(verified 10 Aug 2026 — gate abhi bhi band hai, shabd-ba-shabd.)**
  > `node scripts/benchmark.mjs report` → *"== THE BENCHMARK ==   GATED (pre-audit) …
  > full-syllabus audit 0/4 returned — next fire: M01"*. Kabhi is doc se "khul gaya" mat
  > maan lena — woh **event** hai, tareekh nahi; `benchmark.mjs report` hi ekmatra jawab hai.
- **SEASON.md (8 Aug 2026)**: writer postmatch mein live (`postmatch season` bhi) — scaffold
  aaj se maujood; asli rows TERI pehli /full-time se aayengi. Outward floor (≥2×/hafta,
  TERA 7 Aug ruling): mission returns + benchmark runs — kickoff/watchman par tabhi bolta
  hai jab unmet.
  > **(verified 10 Aug 2026 — poora bullet sach nikla.)** `dressing-room/SEASON.md`
  > maujood hai aur uska apna header wahi kehta hai: *"machine-written 100% by
  > postmatch.mjs at every full-time … he writes ZERO here. Regen anytime:
  > `node scripts/postmatch.mjs season`"*; rows abhi bhi *"khaali — pehla full-time isse
  > likhega"* ✓. Ek cheez dhyan mein rakhna: uski STANDINGS heading par **2026-08-08**
  > likha hai — woh aakhri regen ki tareekh hai, aaj ki nahi; regen command upar hai.
  > Outward floor bhi bol raha hai, aur abhi UNMET hai: `node scripts/watchman.mjs report`
  > → *"[INFO] outward-floor-unmet — outward checks this week: 0/2 (his 7 Aug floor) —
  > mission returns 0 · benchmark runs 0"*.

---

## 5. IMAANDAAR LIST — kya NAHI chal raha / kabhi nahi chala / machine dekh hi nahi sakti

1. **/full-time kabhi nahi chala** → streak, season, KAL-weld, won-day grading sab
   khali. Machine ready hai; ritual tera hai. (Aaj raat se watched.)
   > **(re-verified 10 Aug 2026 — abhi bhi sach.)** `dressing-room/post_match` folder
   > nadaarad; `outwork_audit.mjs report` roz `[INFO] fulltime-missing` bolta hai
   > (*"post_match/2026-08-09.md absent"*), aur `SEASON.md` ki rows *"khaali"* hain.
2. **Re-Jirah kabhi nahi chala** → jo June mein seekha uska aakhri proof lock-day ka
   hai. Queue, questions, widgets, grade/close/pending — sab taiyaar; round tera hai.
   > **(re-verified 10 Aug 2026 — abhi bhi sach, aur organ khud yeh farq bolta hai.)**
   > `node scripts/rejirah.mjs pending` → *"rejirah_log.jsonl does not exist — 0 axis
   > grade(s), 0 rounds EVER closed, on 4 locked capsule(s) … Yeh clean sheet nahi hai —
   > yeh un-run hai."* Capsule files mein bhi `reJirahDone` khaali hai — sirf
   > `tokenization.json` par do purani tareekhein (2026-06-18, 2026-06-29) hain, baaki
   > teeno `[]`.
3. **Watchman ka pehla natural 23:55 fire aaj raat hai** — path proven, ghadi baaki.
   > **(corrected 10 Aug 2026 — yeh point ab is list par nahi hona chahiye: fire ho chuka.)**
   > `ArsenalFC-Watchman` ka last-run **09-08-2026 23:55:01, result 0**, agla 10-08 23:55;
   > uska apna report *last sweep 2026-08-09T18:25:03Z* aur *tier2: last ran 2026-08-09*
   > bolta hai. Jo ab bhi khula hai woh yeh **nahi** hai — woh `tier2-vanished` RED hai
   > (§1 ke watchman note mein poora likha hai).
4. **Turnstile (:4111 clipboard capture) abhi DOWN hai** — subah 09:15 conductor use
   wapas uthata hai; sirf Gemini-paste clipboard path par asar, in-session rep door
   ise use nahi karta. (Chhota gap: port ka koi watcher nahi — sirf subah ka restart.)
   > **(corrected 10 Aug 2026 — yeh point dono taraf se galat ho chuka hai.)** Ek:
   > **turnstile DOWN nahi hai** — 10 Aug ka live probe par :4111 = True (aur :4112 ·
   > :4113 · :4114 · :4116 bhi True). Do: **"port ka koi watcher nahi" ab jhoot hai** —
   > LADDER D2 (9 Aug 2026) ne `scripts/daemon_watchdog.mjs` banaya, jo
   > `ArsenalFC-Daemon-Watchdog` se **har 10 minute** chalta hai. Uska apna header wahi
   > gap naam se likhta hai jo yeh line kehti thi: *"until this file, a daemon that died
   > mid-day stayed dead until the NEXT morning conductor (09:15) or a matchday boot.
   > Every afferent in between fell on the floor."* Woh chaar resident dekhta hai —
   > turnstile :4111 · cortex :4112 · thalamus :4113 · **brain pacemaker :4116** — aur
   > **dugout :4114 ko jaan-boojh kar chhodta hai** (*"It is HIS interactive voice
   > surface … a watchdog relaunching it headless every 10 minutes would be the machine
   > overriding his own hands"*). Live: `node scripts/daemon_watchdog.mjs status`, ya
   > `dressing-room/state/daemon_watchdog.json` — 10 Aug 13:21Z par chaaron port `true`.
5. **Manager M-2→M-5 bane nahi** — M-2 (system.md soul) #1–#5 locked hain aur woh
   LINE-BY-LINE TERE approval se banta hai (CONDUCTOR_LOG: "RESUME #6 PRECEDENCE" + #8
   pe tera khula decision) — autonomous session ise seal NAHI kar sakti; teri baithak
   chahiye. M-3→M-5 uske baad, sequential law se.
   > **(corrected 10 Aug 2026 — yeh is poori file ka sabse mehnga jhoot tha: capstone
   > CHAL RAHA hai jabki yeh line use "bana nahi" keh rahi thi. Bilkul wahi rot jo
   > CLAUDE.md ne 9 Aug launch-audit mein apni taraf pakda tha.)** Code se:
   > · **M-3 LIVE hai.** `grep -n "manager_m3" scripts/brain.mjs dressing-room/state/brain_config.json`
   >   → `brain.mjs` mein `if (job.kind === "manager_m3")` ka asli branch, aur
   >   `brain_config.json` mein job `formation_read` = `{kind: "manager_m3", engine:
   >   "claude", model: "opus", at: "08:45", enabled: true, max_per_day: 1}`, jiska apna
   >   note *"M-3 live: runManager({llm}) — the Manager's own validator rejects any
   >   invented number"* kehta hai. Uska output roz disk par girta hai —
   >   `dressing-room/state/team_sheet.md`, 10 Aug 08:45 ka timestamp.
   > · **M-2 ka draft COMPLETE hai**, adhoora nahi: `dressing-room/manager/system.md`
   >   **586 lines** ka hai aur uski teesri line khud kehti hai *"BUILD STATUS: M-2
   >   COMPLETE-DRAFT (elevated / ceiling build)"*.
   > · Jo is bullet mein **ab bhi sach hai**, aur isi liye poora bullet mita nahi:
   >   woh line-by-line **captain review** aaj bhi TERA kaam hai — koi autonomous session
   >   use seal nahi kar sakti. Yaani shart sahi thi, **status galat tha**.
   > · **M-4 aur M-5: (NOT VERIFIED 10 Aug 2026 — code se confirm nahi hua.)**
   >   `scripts/manager.mjs` sirf M-3 ko naam se jaanta hai (*"Part 2 (Opus, judgment
   >   only) is M-3 — it swaps the stub for `claude -p`"*, aur *"GUARDS (M-3)"*); M-4/M-5
   >   ka koi marker na manager.mjs mein hai na system.md mein. Inhein claim mano, status
   >   nahi. Verify karne ka tareeka doc nahi, yeh hai:
   >   `grep -rn "manager_m" scripts/ dressing-room/state/brain_config.json`.
6. **SelfKnowledge frozen, tool-less surface nahi banega** — teri permanent ruling.
   > **(verified 10 Aug 2026 — sach, aur freeze code mein likha hai.)**
   > `scripts/selfknowledge.mjs` ke header mein poora block hai:
   > *"============ FROZEN (audit #46, 2026-08-04) ============ THE ORGAN IS NOT DELETED
   > AND NOT EDITED AWAY — it is FROZEN, and it says so"*, aur nikalne ka ekmatra
   > darwaza `--thaw` hai (*"run anyway (an explicit human act)"*). Teaching-audit bhi
   > isi ruling ko machine-check karta hai: *"machine sees TWO fingerprints only
   > (re-opening the selfknowledge freeze; re-opening the tool-less/guest surface — both
   > PERMANENT rulings, 7 Aug 2026)"*.
7. **3 naye widgets built-NOT-driven** (tokenization/inference/context) — gates tab
   ginenge jab TU chalayega. Registry sach bolti hai.
   > **(re-verified 10 Aug 2026 — teeno naam abhi bhi sahi hain, par ginti registry se
   > lena, is line se nahi.)** `node scripts/widget.mjs list` → *"4/4 locked capsules
   > have a widget · 1 driven"* — tokenization (built, NOT driven) · embeddings (driven,
   > 3 gates) · inference (built, NOT driven) · context (built, NOT driven). Yahi is
   > bullet ki apni baat hai: **registry sach bolti hai, yeh line sirf uski nakal hai** —
   > aur `register` ke agle hi run par nakal purani ho jayegi.
8. **Machine kabhi nahi dekh payegi** (likha hua, har report mein): depth-when-working ·
   tera Bolo (awaaz yahan aati nahi) · honest-review ki honesty khud · Sunday off ·
   Gemini ka transcript (sirf outcome naapte hain).
   > **(verified 10 Aug 2026 — paanchon abhi bhi report mein naam se likhe hain.)**
   > `node scripts/outwork_audit.mjs report` ka *"NOT MACHINE-CHECKABLE (stated, not
   > silently absent)"* block: WON-DAY #2 depth-when-working · #3 Bolo per touched
   > concept (*"his voice never reaches this machine"*) · #4's honesty itself · #5 Sunday
   > off (*"deliberately unchecked"*) · BOLO→GRADER bar-cleared enforcement. Gemini wali
   > baat ab thodi si aage badhi hai aur woh **jodna** chahiye: 9 Aug se `/harvest` lane
   > maujood hai (`scripts/harvest.mjs`), yaani transcript ka ek raasta ban chuka hai —
   > par abhi tak **ek bhi sitting harvest nahi hui** (`harvest_log.jsonl` maujood nahi;
   > watchman: *"until he says 'harvest' after a Gem sitting, teaching there stays
   > UNMEASURED"*). Yaani "kabhi nahi dekh payegi" ab "abhi tak dekha nahi" hai.

---

*Ban gaya 7 Aug 2026 ki full-organism audit ke close par (commits ff937fa → aa6abcc).
Agli baar shak ho to §0 ke chaar commands — yeh file nahi.*

*Dono commit asli hain — `git log --oneline --all | grep -E "ff937fa|aa6abcc"` (verified
10 Aug 2026: ff937fa "Full-organism audit closes both layers…", aa6abcc "His 7 Aug ruling
lands…").*

---

*Re-verified line-by-line **10 Aug 2026** — code, schtasks table, ports aur state JSON se;
kisi doosre doc se ek bhi claim verify nahi ki gayi (doc hi shak ke ghere mein tha). Jo
badla woh apni jagah **scar ke saath** likha hai, purani line hataayi nahi gayi. Teen din
mein jo sadd gaya, uska aakaar khud sabak hai — teen parat, sabse tez se sabse dheemi:*

*1. **Ginti sabse pehle sadti hai** — suite ke members, gate ke have, drift ki tally,
Captain's Call ki queue. Inmein se ek to is repair ke **DAURAAN** hi sad gaya: calibration
ka gate 13:14 par ek number bol raha tha aur 13:31 par doosra. Isi liye in sab jagah ab
number nahi, **command** likhi hai. 2. **Status uske baad sadta hai** — watchman ka "pehla
fire aaj raat hai" (ab roz chalta hai) · turnstile "DOWN" (ab UP, aur ab uska watchdog bhi
hai) · Manager "bana nahi" (M-3 LIVE hai). 3. **Dhaancha sabse aakhir mein sadta hai, aur
sabse mehnga padta hai** — shaam ki nau alag ghadiyaan ek Evening-Conductor chain ban gayi,
aur yeh doc unhein abhi bhi nau ghadiyaan bata raha tha.*

*Jo teeno parat par ek hi ilaaj hai: **jo cheez chal sakti hai use likho mat, chalao.***

*Ek cheez jo yeh file **ab bhi** nahi jaanti aur jaan-boojh kar khaali chhodi ja rahi hai:
10 Aug ko paida hue Phase-H organ (`scoreboard.mjs` · `nikhil_model.mjs` aur unke saath ki
agenda/diary/dreams lanes) ka apna wall-clock is §1 clock mein poori tarah nahi utra —
sirf woh do jo shaam ki chain mein baithe hain (scoreboard 22:38 · nikhil-model 22:39)
likhe gaye hain. Baaki kab chalte hain, yeh **is doc se mat maano** —
`node -e "console.log(require('./dressing-room/state/brain_config.json').jobs.map(j=>j.id+' '+(j.at||'')+' '+j.enabled).join('\n'))"`
aur `schtasks /query /fo csv /v | findstr ArsenalFC` hi jawab hain.*
