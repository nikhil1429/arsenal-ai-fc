# ORGANISM_BUILD_LOG.md — live build ledger (resumability anchor)

> **Rule:** a fresh session must be able to resume from ONLY this file + the repo.
> Updated continuously. Committed frequently. Never leave the repo half-broken.

## Mission
Build THE ORGANISM to final form on branch `organism-final` per the captain's
v-final brief (2026-07-12): full body + brain, handbrake off imagination/brain/
intensity, brain runs HOT (exhausts Claude Max 5x), Gemini Pro as second brain,
visualization as a first-class organ, complete setup pack, ready for blood
tomorrow. ONE stop only: money. Humane clamps stay (win-only voicing, cold-start
gag, exception-only voice, Governor never ranked, adaptation disclosed).

## Trust conditions (binding)
- Scope = this repo only. Branch = `organism-final`; never touch `main`.
- Layer, never destroy: all green agents stay intact + runnable.
- Selftests must RUN, old and new, results shown.
- Secrets untouchable: never read/print/commit oura_secrets.json, oura_tokens.json,
  readiness.json, intake_log.json, *.log, or any gitignored personal state.
  `git check-ignore` every data path before commit.
- Commits small + labelled, on branch only. No push to main. Merge = captain's review.
- Revert = `git checkout main` + delete branch.

## Status
- **Branch:** organism-final (created from main @ fcb007f)
- **Phase:** COMPLETE + SUPERPOWER PASS (captain's second order, 12 Jul) —
  full body + brain + arsenal: 7 Claude Skills (.claude/skills/), repo .mcp.json
  (his AW server), Gemini prompt-pack pipeline + sanitizer fold-in (viz.mjs),
  market_scan/maidan_poster/widget_spec brain jobs + per-job extra_args
  (brain.mjs). 22/22 suites re-verified green after upgrades. Folded/skipped
  superpowers logged with reasons in ORGANISM_LEDGER.md.
- **ACTIVATED (captain's "do everything, approval given", 12 Jul):**
  · All 16 organism tasks + wallpaper task INSTALLED and verified (quoting bug
    in INSTALL_TASKS.ps1 fixed — cmd /c form; 26 ArsenalFC-* entries live).
  · Throw-in topic generated into gitignored throwin_topic.txt — poller WIRED
    and polling. Captain's one remaining step: subscribe to the topic on the
    phone ntfy app (view topic: `type dressing-room\state\throwin_topic.txt`).
  · Gemini CLI installed globally + auth mode pre-set (oauth-personal).
    Captain's one remaining step: run `gemini` once, click Google login, then
    set gemini.enabled:true in brain_config.json.
  · system.md M-2 COMPLETE-DRAFT — all 11 sections (949b08e). Captain's
    line-by-line review owed before LOCK + scaffolding strip.
  · **FIRST LIVE FORMATION-READ RAN**: brain → claude -p (full soul) →
    runManager validated → team_sheet.md written, source=llm. Agentic-CLI
    chatter guard added (sliceSheet + output contract; selftest 24/24).
    Brain ledger live: ~15k tokens metabolized, study-phase cap honored.

## Phase plan
- [x] P0a Branch + build log seeded
- [x] P0b Full repo read — 7 parallel readers mapped every tracked file; digests at
      scratchpad map_agent_{0..6}.md (0=trilogy 1=scripts-signal 2=gemini-rig
      3=canon-ops 4=masterplan-manager 5=forge-learning 6=scripts-body).
      THE_ORGANISM.md read in full by builder. Environment probed: Node 22,
      claude CLI present, NO gemini CLI (setup pack installs), 8 live ArsenalFC-*
      schtasks (GK 08:30, FSRS 08:40, Cal 08:42, Nem 08:43, LS 08:44, CapturePull
      09:00 hourly, TimeAuditor 12:00/21:00).
- [ ] P1 Design pass — fresh deepest metacognitive pass; final organ list (BUILT vs [LEAP])
      → output: ORGANISM_ANATOMY.md (committed). Builder authors it directly.
- [ ] P2 Build — organs, brain runtime, Manager-orchestrator, visualization, arsenal
- [ ] P3 Setup pack (`setup/`) — Colab, Gems, NotebookLM, Gemini Pro, Oura/AW/ntfy/Supabase/GitHub
- [ ] P4 Selftests — ALL old + new, run + shown
- [ ] P5 Ledger (THE_ORGANISM build-ledger), morning runbook, what-changed/how-to-revert, money-gate list
- [ ] P6 Final report to captain

## Done
- 2026-07-12: branch `organism-final` created; build log seeded.

## In progress
- **P2 BUILD — INLINE MODE** (subagents dead until 07:00 IST session-limit reset;
  builder writes organs inline, selftest-gated, one commit each).
- **ORGANS GREEN (selftest + real run + committed):**
  1. mirror.mjs (aad542b) — real run pulled all 4 REAL capsules from the gist.
  2. throwin.mjs (7ad2839) — dormant-safe; verbatim + never-counts laws.
  3. heartbeat.mjs (dc31a3d) — real run beat 6/6 live agents; timeaudit bridge works.
  4. physio.mjs (31a4d97) — real run found a TRUE effort_uncaptured bleed;
     doubt_clusters speak-gate already OPEN (real capsules).
  5. twin.mjs (2f9bfbb) — sealed 3 real humble bets; voice silent (gag holds).
  6. touchline.mjs (f9e0af1) — ear exiled by hardcode; no-ping law.
  7. setpiece.mjs (e623bd9) — after doubtminer ran: compiled the FIRST REAL DRILL
     (tape-room rematch on tokenization for 2026-07-13).
  8. scorer.mjs (9cde874) — real run resolved 2 of the twin's real bets.
  9. scout.mjs (e8ae073 + fix) — no-dates law; LEARN/RATIFY proposal.
  10. bootroom.mjs + forge_profile.json (e723059) — genome seeded v1.0.
  11. doubtminer.mjs (44ce8d5) — READ HIS 112 REAL DOUBTS (gate open, status ok);
      112 tape-room rematches eligible; 25 verbatim anchors extracted.
- **NEXT (exact order):** 12. postmatch.mjs (evening ledger; KAL-line writer matching
  manager.mjs regex /KAL-?LINE\s*→\s*(.+)/i; season.json + notebook.json + routed_balls;
  --dry for verification) → 13. viz.mjs (CLUB WALL html per ANATOMY §6) → 14. brain.mjs
  (hot runtime per ANATOMY §5 + brain_config.json already committed; M-3 via
  runManager({llm}) import — manager.mjs UNTOUCHED) → dressing-room/manager/system.md
  sections #6–#11 DRAFTS (label them for captain review; meds fork at #8 = generic
  "your stack") → npm scripts in package.json → setup/ pack (NTFY_SETUP, GEMINI_CLI_SETUP,
  gems prompts, Colab flush cell from MANUAL_WIRING, install_tasks.ps1 with schedule
  from ANATOMY §7, wallpaper.ps1, 12TH_PLAYER_DECISION, Oura/AW/Supabase/GitHub notes)
  → P4 run ALL selftests old+new → ORGANISM_LEDGER.md + MORNING_RUNBOOK.md +
  WHAT_CHANGED.md + money-gate list → final report.
- Full per-organ specs: workflows/scripts/organism-organ-build-wf_ec5db480-112.js.

## Decisions & assumptions
- Reader agents restricted to git-TRACKED files only (secrets/personal state are
  all gitignored — clean rule, zero leak risk).
- Untracked `arsenal_ai_fc_squad.png` left untouched (captain's file, not mine).

## Money-gate list (needs captain + Nidhi — NOT done, would cost new money)
1. **ntfy Pro (~$5/mo)** — true access-control (reserved topics) for the
   throw-in channel. Built instead: free long-random secret topic
   (security-by-obscurity, honest note in setup/NTFY_SETUP.md).
2. **Nothing else.** Claude Max 5x + Gemini AI Pro cover everything built;
   Gemini CLI, ntfy free tier, Supabase free tier, ActivityWatch, schtasks
   are all free-at-the-margin.

## Flags for captain (no money, your call)
1. **system.md sections #6–#11 deliberately NOT drafted** — the repo's own
   anti-corruption law forbids writing soul sections at the tail of a heavy
   thread. The brain's 08:45 formation_read runs on the 5 LOCKED sections
   (the operative core) with the wrapper's validator + fallback guaranteeing
   the sheet. Resume M-2 at #6 in a fresh session — the one soul task left.
2. **Oura client secret** (pre-existing flag) — leaked in a screenshot once;
   regeneration is free, 2 minutes (setup/SURFACES.md).
3. **timeaudit.mjs IST date bug** (pre-existing) — stamps yesterday's date via
   toISOString; heartbeat's bridge works around it without touching the green
   script. One-line fix available whenever you want it.
4. **SEASON_CHANGELOG.md is gitignored** (privacy-first default) — it will
   contain your study-performance evidence lines; flip to committed if you
   want it public as an interview artifact.
5. **The Twelfth Player** — nothing built; decision doc for you and Nidhi at
   setup/12TH_PLAYER_DECISION.md.

## NEXT SESSION — THE DUGOUT CEILING (captain-approved brainstorm, 12 Jul night)
**P0 — mic bug:** page shows "allow microphone" but no prompt. Check order:
(1) Windows Settings → Privacy & security → Microphone → ON + "Let desktop
apps access" ON; (2) browser address bar 🔒 → Site settings → Microphone →
Allow for localhost:4114; (3) F12 console — capture red errors (AudioWorklet
blob or getUserMedia rejection); (4) try Edge if Chrome blocks. Fix, then
verify full round-trip (speak → hear reply → tool call fires).
**THE LIVE-API-EVERYWHERE PLAN (build order):**
1. VOICE FULL-TIME + SPOKEN APPROVALS — new tools: run_postmatch(hit,signal,
   kal) via postmatch.mjs CLI; approve_genome(id) via bootroom.mjs approve
   ("haan, chalao" BY VOICE — the constitutional gates become speakable);
   route_throwins. The whole evening ritual conversational.
2. PROACTIVE SESSION MODE — Live proactivity config: Gaffer stays silent
   while he works (bias-to-silence), speaks only at stoppages he declares
   ("done" → hears → serves next drill by voice). KICKOFF/GROUND/FULL-TIME
   conducted as one stitched audio membrane.
3. THE ORAL SCRIMMAGE — examiner persona flag: timed 5-probe mock with REAL
   interruptions mid-answer; hedge-density counted from input transcription
   (scrimmage = the ear's one legal surface). Closes the modality gap: his
   interviews are voice; until now his drills were text.
4. BOLO CAPTURE MODE — capture-only: his spoken Bolo transcribed verbatim →
   proposed to the capsule bolo field (batch-go). LAW: no scoring, no hedge
   math on FORGE-Bolo — the ear stays exiled; capture ≠ judgment.
5. MATCHDAY COMMENTATOR — screen-frame coaching: sample 1 frame/2-3s of his
   Colab/Gem screen (image mode dodges the 2-min video cap); the Gaffer
   watches him solve and coaches live (spinning caught in real time,
   Pehle-Guess whispered, derby called when two concepts blur on screen).
6. LAN FLAG — bridge binds to home-wifi IP → the Dugout on his PHONE browser:
   voice throw-ins and rematches while pacing the house.
**REJECTED AT THE CLAMP WALL (permanent):** prosody/emotion from native-audio
models NEVER feeds the Governor/ladder/verdicts (mood → "show your doctor",
never self-interpreted); no always-on ambient mic (12th-player-class decision
for him and Nidhi).
**QUOTA CEILING:** audio-only 15-min stitched sessions; frame-mode for vision;
key-pool across all his free projects; dugout_ledger informs the brain
scheduler to shift text jobs off Gemini when voice needs the pool.

## NEXT SESSION ADDENDUM 2 — THE CONTINUOUS-TIME ORGANISM (deep brainstorm, captain-approved)
FRAME: organism lives in batch time; Live API = continuous time. Decide per
loop: close-in-seconds vs must-stay-slow (clamps). Six layers:
L1 EPISODIC MEMORY — Day-Thread transcripts complete the hierarchy: sensory
   (bus) → episodic (transcripts) → semantic (capsules/lexicon) →
   autobiographical (notebook/season); nightly digest distills tier→tier.
L2 EARNED PROACTIVITY (crown mechanism) — SHADOW INTERRUPTIONS: proactive
   engine logs would-have-spoken moments silently; Evening Scorer resolves
   each (would it have helped?); an interruption-type earns VOICE only at
   proven shadow hit-rate + captain's one-time spoken ratification (the
   no-look-pass machinery pointed at the mouth). Captain's own spoken
   reminders exempt (his voice echoed ≠ ping). RED = proactive mouth mute.
   Candidate types to shadow-train: stoppage next-drill offer · wall-breaker
   green-ball line · his own timed reminders · due-at-kickoff · scrimmage-door.
L3 TWO-SPEED BRAIN — Live = reflex loop (never deep judgment; defers heavy
   thoughts to overnight Claude via note). Slow brain programs fast brain
   daily: overnight digest + enrichments + fingerprint + earned-interruption
   list compile into the "DAY CARTRIDGE" (fresh Live system instruction each
   dawn). Consolidation across the sleep boundary, like biology.
L4 SENSES — true think-time latency from transcription stamps (repairs
   latency_ms everywhere; highest data-ROI) · WHITEBOARD SCRIMMAGE via camera
   (paper sketch + voice = system-design round in native medium — DOSSIER's
   heaviest 60min finally trainable) · Re-Jirah live conductor (controller v0
   actuated; concept-track paste → ~zero) · modality-routing law (voice-first:
   recall/defend/3-ways/Bolo; screen-first: math-reconstruct/code) as a
   dossier_weights field, setpiece tags drills.
L5 THREE BUDGETS — Live-minutes = third pool beside Claude-window and
   Gemini-text; dugout_ledger self-tunes per-key shape; degradation ladder
   day-thread → on-demand → talk.mjs.
L6 REFUSALS (permanent) — prosody never scores; organism-usage never a
   market; ambient mic = household decision; proactivity only via shadow-gate.
BUILD ORDER NEXT SESSION: P0 mic bug (see above) → shadow engine +
day-cartridge compiler → voice full-time/genome tools → oral scrimmage →
think-time stamps → Re-Jirah conductor → whiteboard mode → modality routing.

## THE JARVIS HARVEST (bible v4 read 12 Jul — mechanisms only, no personal content here)
**IMMEDIATE (fixes our Dugout bugs — his 10-session hard-won Live API table):**
speechConfig+responseModalities at setup ROOT (not inside generationConfig —
we have this bug) · outputAudioTranscription crashes the WS (we set it — remove;
get text via other lane or accept audio-only + client STT display) · NO
realtimeInputConfig (1011s) · NO thinkingConfig · realtimeInput.text for runtime
msgs (clientContent = history seeding only) · dual AudioContext 16kHz-in /
NATIVE-rate-out (not fixed 24k) · local VAD + connect-on-speech (always-on WS
hemorrhages tokens) · rehydrate context on 15-min reconnect · **Charon voice**
(prebuiltVoiceConfig) = JARVIS's literal voice identity, continuity for the
captain.
**ADOPT (organ upgrades):** ACK pattern (cached filler lines during tool/slow
waits — perceived latency near-zero) · wall TV-modes by time-of-day (Morning
Brief / Focus Cockpit / Evening Reflection / Sleep-RED) · Show Mode (hide
personal panels when demoing) · semantic recall tool ("when did I last mention
X" — embeddings jsonl + cosine, free tier) · Opus-Principle codified (the
janitor lane NEVER interprets for the scientist lane — Gemini cleans, Claude
reads raw) · Phase-A→B Genius Play discipline (hot brain writes DURABLE
retrievable artifacts now — fingerprint/lexicon/digests — so lean windows stay
god-tier via retrieval; we already do this, now it's named and deliberate) ·
examiner personas mined from his 18 modes (Recruiter Ghost, Scenario Bomb,
Code Autopsy) into oral-scrimmage config · Hyperfocus Guard + mid-task Context
Stash as shadow-interruption candidates · event-triggered deep re-analysis
(milestone/crisis → 90-day re-read) as a brain job trigger post-blood.
**REFUSE (organism laws hold):** API-first economics (JARVIS costs ₹5.7-11.3k/mo,
Max does NOT cover API — the organism's subscription-only law is WHY it
survives where JARVIS parked) · 39-table cloud truth (bus stays local/simple
until post-job merger) · relationship-dimension scoring of people (12th-player
wall) · mood/emotion engines feeding verdicts (medical clamp) · boot cinematics
(§18 gate — post-job dopamine).
**THE MERGER ROAD:** organism = JARVIS Phases 1-2 done free+clamped; post-offer
Transfer Window adopts JARVIS Phase-B economics (income → budget), Supabase
persistence tier, XR at its threshold. Same soul ("personal war equipment,
not for sale"). Jarvis/ folder gitignored (public repo, personal content).
**ASK CAPTAIN:** does the $300 Google Cloud credit from JARVIS Phase A still
have balance? If yes → paid-tier Live/Pro juice is free-at-margin until it
drains (changes quota ceiling massively).

## THE UNLEASH CONTRACT (FINAL — captain-approved 12 Jul night; coding resumes next session)
CUT: wall TV-modes + Show Mode (no TV hardware, no demo audience). Gemini =
free API confirmed (no credits remain). Identity: Dugout speaks as THE GAFFER
(Charon sound) until the offer; merger ceremony renames it JARVIS at the
Transfer Window. JARVIS merge = soul+scar-tissue now, body (React/Supabase/
API-economics) post-offer as a data-pour.
**NEW — THE MEDIA ENGINE (max visualization/motivation, replaces TV modes):**
· TEAM TALK (fully automatic daily audio): brain job writes 90s Gaffer talk
  from real sheet (morning) + post-match (evening) → speak.mjs gains --to-file
  → club/media/teamtalk_<date>.mp3; wall gets a MEDIA panel (audio player +
  today's poster + film kit link); "team talk ready" line rides INSIDE the
  existing 08:45/21:30 pushes (two-utterance law intact). Scripts pass
  no-hype/no-invented-numbers validators — evidence-based motivation only.
· FILM KIT (one-click video): nightly auto-write of NotebookLM source doc →
  G:\My Drive\arsenal\ + ready Veo prompt; his single tap = Generate.
  (Veo API = money-gated; NotebookLM has no API — one-click is the honest
  ceiling.) Daily poster already automatic (gemini_render job).
**CODING ORDER (next sessions, gates unchanged):**
U1 Dugout hardening: scar-table (root speechConfig; outputAudioTranscription
   risk → fallback = checkpoint-tool-as-transcript-channel), Charon, VAD,
   15-min rehydrate + day cartridge, ACK fillers, think-time stamps, spoken
   gates (run_postmatch/approve_genome/route_throwins), dugout_notes→postmatch,
   mic fix. GATE: one real voice conversation w/ voice rep end-to-end.
U1.5 MEDIA ENGINE (teamtalk job + --to-file + wall MEDIA panel + film kit).
U2 Interview weapons: oral scrimmage (personas: Recruiter Ghost/Scenario
   Bomb/Code Autopsy; hedge log), whiteboard/camera mode, screen commentator,
   Re-Jirah live conductor, modality routing. GATE: one graded oral scrimmage.
U3 Earned proactivity: his-voice reminders FIRST (gate-exempt), then shadow
   engine + evening shadow-scoring + day-thread modes + semantic recall +
   dugout-minutes as third budget pool. GATE: 7 days shadows scored pre-ratify.
U4 Polish ONLY (LAN phone, event-triggered re-analysis, commitments view,
   timeaudit IST fix on approval). **DESIGN FREEZES AT U3 until the offer
   (§18 law applied to the builder).**
**U0 = THE CAPTAIN, TONIGHT (outranks all code):** ntfy subscribe · Colab v4
cell · Drill Gem v4 add-on · real `npm run postmatch` · laptop open overnight ·
first real session pasted tomorrow. Standing: system.md review→LOCK · Oura
secret regen · review+merge organism-final→main soon (installed tasks point at
this working tree).

## ⚡ THE FINAL BUILD SESSION (supersedes the gated U-order above — captain's call)
ALL of U1 + U1.5 + U2 + U3 + U4 built END-TO-END in ONE session, no phase
gates, no sequencing pauses. The only proof required per unit: selftest green
+ real-run line + small labelled commit (unchanged law). Order inside the
session (dependency-driven, not gated): P0 mic fix + scar-table + Charon →
spoken gates + think-time + ACK + rehydrate/day-cartridge → MEDIA ENGINE
(teamtalk job + speak --to-file + wall MEDIA panel + film kit) → oral
scrimmage + personas + whiteboard/screen modes + Re-Jirah conductor +
modality routing → his-voice reminders + shadow engine + shadow-scoring +
day-thread modes + semantic recall + third budget pool → polish (LAN phone,
event re-analysis, commitments view, dugout_notes→postmatch, timeaudit IST
fix). Humane clamps/laws all unchanged. DESIGN FREEZE begins AFTER this
session completes, until the offer. Then: the captain pumps reps.

## 📋 THE KICKOFF PROMPT (paste this to start the next Claude Code session)
---
ultracode. Read ORGANISM_BUILD_LOG.md fully, then ORGANISM_ANATOMY.md and
ORGANISM_LEDGER.md. Execute "THE FINAL BUILD SESSION" section end-to-end in
this one session: build everything listed, no phase gates, selftest green +
real-run + small commit per unit, push to organism-final only. Full approval
given for everything except NEW money (money-gate = the only stop). Apply the
JARVIS scar-table empirically to the Dugout first (mic bug = P0; I will test
voice live with you). Keep every law and clamp exactly as written. At the end:
run ALL selftests old+new, update the log/ledger, and hand me the one-line
morning ritual. Then design freezes until the offer.
---
Short form (also valid): "ultracode — read ORGANISM_BUILD_LOG.md and execute
THE FINAL BUILD SESSION end-to-end. Full approval, money-gate only. Mic first."
