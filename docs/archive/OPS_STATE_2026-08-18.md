⚪🔴 ARSENAL AI FC — OPS_STATE
THE thread-agnostic anchor. A fresh thread reads THIS ONE file first and knows everything: what the organism is, what's built, what's live, what's launched. Keep BOUNDED (~2 pages). This is STATE, not a log — history lives in git commits (`git log --oneline -30`). Design/anatomy detail: CYBORG_BRAIN.md · CYBORG_STRETCH.md · THE_ORGANISM_A_TO_Z.md · learning-layer/. No zip, ever.
  ⚠ "KNOWS EVERYTHING" IS NO LONGER TRUE (corrected 10 Aug 2026). This file's body is as-written
  on 2026-07-15 and its coverage STOPS there. Whole organ families built since are named NOWHERE
  below, and all of them are in the code right now — verify, don't take my word:
  `ls scripts/ | grep -E "benchmark|captains_call|harvest|scoreboard|nikhil_model|gate_tune|daemon_watchdog|watchman|outwork_audit|teaching_"`
  returns benchmark · captains_call · daemon_watchdog · gate_tune · harvest · nikhil_model ·
  outwork_audit · scoreboard · teaching_audit · teaching_contract · watchman. Also missing from
  the body: THE MISSIONS DESK (`ls dressing-room/missions/` → M01–M04 + T-hallucinations),
  THE CAPTAIN'S CALL, the LADDER A→G, PHASE H, and THE CLOUD SENTINEL (`setup/CLOUD_SENTINEL.md`).
  Treat the body as a 15-JUL SNAPSHOT, not as the roster. CLAUDE.md + the code are the roster.

⚠ 9 Aug 2026 (launch audit): the 6-Aug refresh block below ITSELF rotted within three days
  (its "62 members / 61 selftests / 9 reps" were 67 / 67 / 17 when re-measured). The lesson is
  now structural, not another number: NEVER read a count from this file — run `npm test`,
  `wc -l dressing-room/state/reps_log.jsonl`, `ls .claude/skills/`. The block stays as history.
  ⚠ AND IT ROTTED AGAIN IN ONE DAY (10 Aug 2026 doc-repair pass). Of the 9-Aug numbers above,
  "67 members" measured **73** twenty-four hours later and "17 reps" measured **21**; the skills
  count, which the 6-Aug block below fixed to 12, measured **15**. This is now THREE consecutive
  refreshes of the same counters, each one wrong within days. The counters are not the finding;
  writing a counter into this file is. Ran, this pass:
  `node scripts/organism_test.mjs suites` → "all 73 suite members pass" (51 in organism:selftest
  + 22 in squad:selftest, parsed from package.json — see `_selftest_coverage_law`; note 2 of the 73,
  claudegen and test_coach_v2, are invoked BARE because each IS its own selftest, so "members" and
  "organs carrying a selftest" are not the same counter and never were);
  `wc -l dressing-room/state/reps_log.jsonl` → 21; `ls .claude/skills/ | wc -l` → 15.
  DO NOT UPDATE THESE. Run the three commands.
⚠ NUMBERS REFRESHED 2026-08-06 (cross-organ test pass). What this file said, and what was actually true:
  · "reps_log = 0 by design" → 9 rows. The learning half started; this doc did not notice for three weeks.
    (10 Aug 2026: 21 rows. `wc -l dressing-room/state/reps_log.jsonl`.)
  · "Skills (11)" → 12 (/learn was missing from the list).
    (10 Aug 2026: 15 — /fire, /gist-patch and /harvest were added after this bullet was written.
    `ls .claude/skills/`.)
  · "39 selftest suites green" → 62 members now RUN independently via `npm test`; 61 organs carry a selftest.
    Four of them (rejirah · python_state · widget · context_manifest — the whole audit-#107 learning loop)
    were in NO suite and had never been run by any command. They are wired in now.
    (10 Aug 2026: 73 members. `node scripts/organism_test.mjs suites` prints the roll and the tally.)
  · [FROZEN — this bullet was WRONG THE HOUR IT WAS WRITTEN; corrected below, audit #108, 6 Aug 2026]
    "The BRAIN is PAUSED (`brain_config.paused: true`, set 2 Aug) — 19/23 LLM jobs held. The schedule below
    is armed and running; what is off is the THINKING, not the recording. Un-pause is a token-budget
    decision, not a repair: the rolling 7d window read 80.2% of 12M on 6 Aug."
    CORRECTION: `brain_config.paused` is **false**. The captain un-paused it in the SAME commit that wrote
    this refresh block (6c6e682, "The boot tax falls 57%..."), so the doc asserted a pause that the commit
    beside it had already lifted — the un-pause was the point of that commit, not a separate event.
    LIVE TRUTH 2026-08-06: the BRAIN is RUNNING. 23 jobs configured; 19 enabled, and the 4 that are off
    (midday_reread · deep_twin · season_review · capsule_premap) are off for audit #63 — no reader for their
    output — each with its own `_disabled_reason`, NOT because of any pause. What IS still switched off is
    the HAIKU PULSE: `brain_config.pulse.enabled: false`, paused 2 Aug and still paused, because its verdict
    reaches nobody (thalamus.mjs has no `pulse` modality) — its re-enable condition, the nucleus wiring, is
    named in the config and has not landed. Read `paused` and `pulse.enabled` from
    `dressing-room/state/brain_config.json` (or `node scripts/brain.mjs status`), never from this doc.
    ⚠ THE "LIVE TRUTH" LINE ABOVE IS ITSELF FOUR DAYS STALE (corrected 10 Aug 2026 — and note that
    a paragraph whose whole point was "read it from the config, never from this doc" still got read
    from this doc, which is why the numbers are being struck rather than rewritten). Measured live
    off `dressing-room/state/brain_config.json` this pass:
      · jobs = 30, not 23. ENABLED = 29. Exactly ONE is off: `season_review`. midday_reread,
        deep_twin and capsule_premap are all `enabled: true` again — they carry a stale
        `_disabled_reason` string while running, so the reason field is NOT the switch.
      · `pulse.enabled` = **true**, not false. LADDER G14 (9 Aug 2026) unpaused it as a pure
        instrument; the 2-Aug "verdict reaches nobody" reason is CLOSED — thalamus handles
        modality `pulse` at weight 0.00 and the pre-answer gate is its first consumer
        (`_g14_unpause_note` in the config says so in full). `paused` remains false.
    Command, so this never has to be re-typed:
    `node -e "const c=require('./dressing-room/state/brain_config.json');const j=c.jobs;console.log('paused',c.paused,'pulse',c.pulse.enabled,'jobs',j.length,'off:',j.filter(x=>!x.enabled).map(x=>x.name).join(',')||'none')"`
  Everything below this line is as-written on 2026-07-15 and may be older than the state files. Read
  live numbers from state, never from this doc.

Last updated: 2026-07-15 (v4.0 — LAUNCHED. The full organism — learning layer + outwork/execution layer + cyborg brain — is BUILT, GREEN, CLEAN-SLATED, RUNNING, and VERIFIED A-to-Z. The final aggressive full-feature test passed: ZERO RED, every off-switch a named law or a named cold-start floor. The only thing left is the captain's reps.) · Branch: main · Captain & #14: Nikhil (GitHub: nikhil1429).
  (corrected 10 Aug 2026: "the only thing left is the captain's reps" stopped being true within days —
  the whole LADDER A→G, PHASE H, the OUTWARD LOOP/missions desk, the captain's-call deck and the cloud
  sentinel were BUILT after this line was written. Branch `main` and the GitHub handle still hold:
  `git branch --show-current` → main; `git remote -v` → github.com/nikhil1429/arsenal-ai-fc.
  The DATE is the one number in this file that is allowed to stay fixed — it is a stamp, not a state.)

⚡ WHERE WE ARE (one glance)
LAUNCHED. The deepest pre-launch verification is done — 39 selftest suites green, all three daily flows proven with live output, both layers proven (not just voice), the Gaffer's full-organism briefing built + proven, the 3 daemons up on current code, the schedule armed (38/38 catch-up + wake timers). A LAUNCH-READINESS SCORECARD (shareable artifact) + a NIDHI DEMO RUNBOOK exist. The learning organs are dormant-BY-LAW until fed (not broken). What's left for the captain: account sign-ins (his logins only) and the reps.
  (corrected 10 Aug 2026 — three counted claims in that sentence have moved; the SHAPE of the
  sentence is intact, the numbers are not:
   · "39 selftest suites green" → 73 members today. `node scripts/organism_test.mjs suites`.
   · "the 3 daemons up" → STILL TRUE, and there is now a FOURTH. Checked live this pass: ports
     4112 (cortex), 4113 (thalamus), 4114 (dugout) and 4116 (the brain daemon's singleton lock)
     are all LISTENING. 4115 — the brain TICK-lock — is idle between ticks, which is correct.
     Check: `Get-NetTCPConnection -LocalPort 4112,4113,4114,4116 -State Listen`.
   · "the schedule armed (38/38)" → 50 ArsenalFC tasks exist and 23 of them are DISABLED
     (26 Ready, 1 Running) — including Bell-FullTime, Thalamus, Cortex, Goalkeeper, FSRS,
     Nemesis, Calibration, LearningState, Mirror, Scout, SetPiece, Scorer, Twin, Turnstile,
     Wall-AM/PM, Wallpaper, Physio-AM/PM, Doubtminer, Examiner, Heartbeat, SprintSync. Some of
     that is deliberate — Thalamus and Cortex are DISABLED as tasks yet their daemons are up on
     their ports, i.e. a launcher other than schtasks is keeping them alive. But "armed 38/38"
     would have a reader believe every timer is live, and 23 are not. NEVER quote an arming
     figure from here: `Get-ScheduledTask | ? TaskName -like 'ArsenalFC*' | group State`, and
     `node scripts/daemon_watchdog.mjs` is the organ that owns the daemon side of this.
     (NOT VERIFIED 10 Aug 2026 — WHICH of the 23 are disabled by intent vs. by drift could not be
     settled from code; that is a captain ruling, not a doc fix.))

👤 THE CAPTAIN (identity)
#14 — Nikhil. DTU Math&Computing; ~4 yrs finance-ops (Zomato/Blinkit); training for an AI Product Engineer role (₹20–25 LPA, India, 2026); proof-of-work = a shipped FinOps Copilot on real Blinkit data. ADHD-PI, medicated. The organism is a cognitive prosthesis built against his measured psychology; #1 risk = burnout, #2 = procrastination-by-building. The rival is always kal-wala-Nikhil. Not an agent — the one irreplaceable organ.

🧬 THE THREE LAYERS (all built, all verified)
- LEARNING LAYER (how he gets sharper): the FORGE pedagogy (learning-layer/ — 0→11 pipeline, 9-axis Daraar-map, gut-word calibration, capsule lock → Re-Jirah); 4 locked capsules (tokenization·embeddings·inference·context); the squad scouts — FSRS (WHEN) · Calibration/ECE (HOW-HONEST) · Nemesis (WHAT-PATTERN) · Learning-state/Maidan (WHERE); doubtminer · tape-room (112 in queue) · Live Examiner.
  (checked 10 Aug 2026 — the four capsule NAMES still hold exactly: `ls dressing-room/state/capsules/`
  → context.json · embeddings.json · inference.json · tokenization.json. But do not read the COUNT
  from here: dugout.mjs deliberately reads that list off disk at load rather than typing it —
  `grep -n "lockedCapsuleIds" scripts/dugout.mjs` shows the reader, and its own selftest asserts
  "the prose names EXACTLY the capsules on disk — no phantom, no dropped, no frozen literal".
  This doc should hold itself to the rule the code already holds itself to.
  "tape-room (112 in queue)" was still 112 on this pass, dated 2026-08-09 —
  `node -e "const t=require('./dressing-room/state/tape_room.json');console.log(t.queue.length,t.date)"`.
  The four squad scouts and their jobs are all live and correctly named.)
- OUTWORK / EXECUTION LAYER (how he ships): the Manager (team sheet, zero-invented-numbers validator — PROVEN to reject a hallucinated stat) · the Scout (staging + the AI-PE DOSSIER, no-projected-dates law) · Time-Auditor (Building≥60%/Meta≤25%) · Touchline · Set-piece (≤3-drill, #1 winnable) · Post-match + KAL-line · the Season Arc · the FinOps-Copilot trophy.
  (10 Aug 2026 — this whole bullet was checked claim-by-claim against the code and EVERY ONE HELD;
  nothing changed, recorded so the next pass need not re-derive it. Manager's zero-hallucination
  validator: `grep -n "ZERO-HALLUCINATION VALIDATOR" scripts/manager.mjs`, and the receipt for
  "rejects a hallucinated stat" is in the same file — a past-due ship date was bounced as an invented
  number. Scout's no-dates law: `grep -n "NO PROJECTED DATE IS EVER SHOWN" scripts/scout.mjs`.
  Time-Auditor: `grep -n "buildingPctMin\|metaPctMax" scripts/timeaudit.mjs` → defaults 60 and 25.
  Set-piece: `grep -n "max_drills" scripts/setpiece.mjs` → 3, and hard-clamped to ≤3 even if config
  asks for more. What this bullet DOES NOT mention, because it predates them, is the OUTWARD LOOP
  that now sits beside the Scout — the missions desk in scout.mjs and benchmark.mjs. See the header.)
- CYBORG BRAIN (the two-speed relay): thalamus (:4113 salience gate + affect firewall) · cortex (:4112 Opus deep brain, 2-lane) · dugout (:4114 live voice, 24 tools) · hippocampus (5-layer memory) · night shift (8 idle-quota jobs) · M14–M23.
  (corrected 10 Aug 2026: "24 tools" is now **28** — `grep -c '^  { name: "' scripts/dugout.mjs` → 28,
  and `node -e "import('./scripts/dugout.mjs').then(m=>console.log(m.TOOL_DECLS.length))"` agrees.
  The four that joined after this line was written are in the same TOOL_DECLS array; read the roll from
  the code, never from here. THE REST OF THE LINE HELD on a live check: ports 4113/4112/4114 are each
  a `const PORT` in their own script (`grep -n "^const PORT" scripts/thalamus.mjs scripts/dugout.mjs`),
  hippocampus is genuinely five-layer (`grep -n "five-layer" scripts/hippocampus.mjs`, L1 THE SCRIBE
  onward), the night shift really does report 8 jobs — probe_bank · distractors · embed_backfill ·
  scout_pack · gem_cartridge · gate_tune · pre_answers · season_read (`grep -n "out.jobs\." scripts/nightshift.mjs`;
  a 9th key, gate_tune_score, is a score on job 6, not a job) — and M14–M23 is the real range
  (`grep -o "M[0-9][0-9]*" CYBORG_STRETCH.md | sort -uV | tail -3` → M21 M22 M23).)

✅ DONE (this era — detail in git)
- THE FINAL VERIFICATION passed: 31 organism + 8 squad selftest suites green; 16 organs live-verified GREEN + 4 DORMANT-BY-LAW (of 29 built, all selftest-green), ZERO RED; all 24 Dugout tools exercised (23 live/contract-verified, read_url honest-dormant on a dry free-pool quota); the Hinglish (0.65) + Devanagari (0.65) gate → TIER-2 → Opus → fold-back proven live in both scripts; FSRS floor (4 cards, 3 overdue: embeddings/inference/context) confirmed; the 08:45 sheet proven real-Opus (formation_read OK, validated, not skeleton); the evening spine + all 8 night-shift jobs run live (season_read on gemini-flash-latest → 6 contradictions); media engine renders (wall.html, a real TTS MP3, poster.svg); privacy sweep GREEN (9 sensitive files gitignored, reps_log.jsonl 0 bytes preserved).
  (READ THAT AS A 15-JUL RECEIPT, NOT AS TODAY'S STATE — corrected 10 Aug 2026, five numbers moved:
   · "31 organism + 8 squad" → 51 + 22 = 73 (parsed straight out of package.json's two chain strings,
     which are the single membership record — `node scripts/organism_test.mjs suites`).
   · "all 24 Dugout tools" → 28 declared (see the CYBORG BRAIN correction above).
   · "FSRS floor (4 cards, 3 overdue: embeddings/inference/context)" → 5 cards, 1 due today,
     3 overdue, hardest [inference, context, embeddings, hallucinations] — a fifth concept
     (hallucinations) entered the deck. Live:
     `node -e "const c=require('./dressing-room/state/cards.json');console.log(c.total_cards,c.due_today,c.overdue,c.hardest_due)"`.
   · "the 08:45 sheet ... formation_read" STILL HOLDS as configured: formation_read is job 4 in
     brain_config, `kind: manager_m3`, `at: "08:45"`, enabled.
   · "privacy sweep GREEN (… reps_log.jsonl 0 bytes preserved)" is the one that would MISLEAD.
     His D10 ruling of 5 Aug 2026 REVERSED that posture: reps_log.jsonl now travels with the repo
     (21 lines today), and readiness.json + intake_log.json were re-confirmed TRACKED on 10 Aug
     ("dono rehne do"). All three reversals are written into .gitignore itself, with the frozen
     old rules kept as comments — `grep -n "D10" .gitignore`. See the LAWS correction below.)
- THE GAFFER NOW KNOWS THE WHOLE ORGANISM: a new get_organism tool (the 24th) + a full-anatomy lecture section in his constitution. Say "explain the whole organism / walk me through the cyborg brain" → a structured ~10-min lecture, every number read LIVE (zero hallucination, zero hype). Proven end-to-end through the wire.
  (checked 10 Aug 2026: `get_organism` is still declared and is still the LAST entry in TOOL_DECLS —
  `grep -n '"get_organism"' scripts/dugout.mjs` — but it is no longer "the 24th"; there are 28.
  "the 24th" was an ordinal frozen at birth, which is exactly the class of number that rots.
  "every number read LIVE" held too — the tool builds a `live_snapshot` at call time counting
  scripts, skills, capsules and FSRS cards off disk: `grep -n "live_snapshot" scripts/dugout.mjs`.)
- FOUR SCAN-FIXES (prior era) intact: Gaffer's capsules + get_capsule; the two-script gate; the FSRS capsule floor; memory honesty.
  (10 Aug 2026 — "intact" still holds, checked: the CAPSULE FLOOR is named and selftested in fsrs.mjs
  (`grep -n "CAPSULE FLOOR" scripts/fsrs.mjs`), and the two-script gate is still taught to the matchers
  (`grep -n "both scripts" scripts/thalamus.mjs`). ONE of the four CHANGED TODAY on his ruling and is
  now BETTER, not broken: `get_capsule` returns his capsule prose VERBATIM and uncut; the old
  projection that truncated each axis to 220 chars is frozen beside it per the layering law —
  `grep -n "capsuleProjectionLegacy" scripts/dugout.mjs`. Do not "restore" the projection.)
- CLEAN SLATE preserved: 46 test-era files vaulted (moved, never deleted). reps_log.jsonl: count it live (`wc -l`) — this line has now been wrong TWICE ("0 by design" for three weeks, then "9 rows" while the log held 17), so it no longer carries a number at all. The learning half is NO LONGER dormant; it started.
  (10 Aug 2026 — the "46 test-era files" figure could NOT be confirmed either way, so it is neither
  deleted nor endorsed. What IS live: there are now FOUR vaults, not one — `ls -d dressing-room/vault_*`
  → vault_preseason_2026-07-14 · vault_preseason_2026-07-15 · vault_freshstart_2026-07-17 ·
  vault_system_cleanup_2026-07-17, holding 220 files between them (`find dressing-room/vault_* -type f | wc -l`).
  Whatever "46" counted on 15 Jul, it is not the count of vaulted files today.
  NOT VERIFIED 10 Aug 2026 — treat "46" as a claim about one 15-Jul move, not as a total.)

⏳ PENDING (all the captain's — his logins, his reps)
1. THE REPS — reps_log = 9 (6 Aug 2026). The learning half has STARTED but is still under every floor: Calibration & Nemesis @20 reps, Learning-State @12, the Twin's book @30 resolutions. Those organs are dormant-by-law, not broken. That's his, and only his.
   (corrected 10 Aug 2026 — "under EVERY floor" is no longer true; TWO of the four have WOKEN, and a
   session that reads this line will keep treating live organs as dormant. The four FLOORS themselves
   were re-checked against the code and every one of them is exactly as written here — good line:
     Calibration `min_reps: 20`   (`grep -n "min_reps" scripts/calibration.mjs`)
     Nemesis     `warming_up_min_reps: 20` (`grep -n "warming_up_min_reps" scripts/nemesis.mjs`)
     Learning-State `warming_up_min_reps: 12` (`grep -n "warming_up_min_reps" scripts/learning_state.mjs`)
     Twin        `voice_min_resolutions: 30` (`grep -n "voice_min_resolutions" scripts/twin.mjs`)
   What has changed is which side of them he is on. Read live off state this pass (reps_log = 21 lines):
     · NEMESIS — AWAKE. weaknesses.json `status: "ok"`, `low_confidence: false`, and it is naming a
       real headline ("9× miss on hallucinations — axis a keeps breaking").
     · LEARNING-STATE — AWAKE. learning_state.json `status: "ok"`, gate `"17/12 reps"`, `open: true`.
     · CALIBRATION — still `warming_up`, `low_confidence: true`. Genuinely dormant-by-law.
     · TWIN — still silent: 0 scored resolutions against a floor of 30. Genuinely dormant-by-law.
   Check, don't quote:
   `node -e "for(const f of ['calibration','weaknesses','learning_state'])console.log(f,require('./dressing-room/state/'+f+'.json').status)"`)
2. CAPTAIN'S BROWSER STEPS — ALL CLOSED 15 Jul (Chrome-driven with the captain watching): Jules × both Pro accounts → both PRs verified + merged (renu = a real README replacing the stub; nikhil = ANATOMY/LEDGER cyborg-layer refresh + count fixes) · Gemini Pro Deep Research × both accounts → both reports captured to dressing-room/state/scout_reports/ (private/gitignored): AI-PE interview landscape + FinOps-Copilot portfolio guide. STILL his hand: the phone Voice-Gaffer Gem (gem_cartridge.md staged, /gem-sync drives it). Also delivered: THE_CAPTAINS_MANUAL.md — the full A-to-Z operating manual (NotebookLM-ready).
   (checked 10 Aug 2026, all held: both Deep Research reports are still on disk and still private —
   `ls dressing-room/state/scout_reports/` → aipe_landscape_2026-07-15.md · finops_copilot_guide_2026-07-15.md,
   and `grep -n "scout_reports" .gitignore` confirms the directory is ignored. The cartridge is real and
   its PATH, which this line never gave, is `dressing-room/state/brain_out/nightshift/gem_cartridge.md`
   (the night shift's job 5 writes it). The /gem-sync skill exists: `ls .claude/skills/gem-sync`.)

🔒 LAWS (inviolable — never soften, never flip)
No metered API key, ever (claude -p on Max; code REFUSES if ANTHROPIC_API_KEY set — proven in 7 scripts). AI proposes · code validates · human approves. Unrun = hypothesis. Layering never replace. Medical clamp (Goalkeeper interprets, never prescribes; biometrics never drive a verdict alone; RED = doctor-referral). Affect firewall (prosody/emotion never scored). Humane clamps (no hype/shame/streaks/countdowns; win-only voicing; earned proactivity; no calendar pressure). Repo is PUBLIC — personal data all gitignored + verified. Glance before every push.
  (10 Aug 2026 — THE LAWS THEMSELVES ARE NOT TOUCHED. Two factual riders on them, both measured:
   · "proven in 7 scripts" — the number does not survive a read. `grep -rln ANTHROPIC_API_KEY scripts/`
     returns 8 files, but only FIVE of those actually REFUSE at runtime in their own process:
     brain.mjs (`refuse_if_api_key_env` + "brain: REFUSING"), claudegen.mjs (`refuse()`),
     cortex.mjs ("cortex: ANTHROPIC_API_KEY set — REFUSING"), council.mjs ("never metered, ever"),
     talk.mjs ("talk: REFUSING"). dmn.mjs's hit is a SELFTEST that proves claudegen refuses and
     spawns nothing; dugout.mjs and manager.mjs only STATE the law in prose — they carry no guard,
     because every LLM call they make goes through claudegen/brain, which do. So the law is enforced
     at 5 real chokepoints, not "7 scripts". Run the grep, read the hits — do not carry the number.
   · "personal data all gitignored + verified" is no longer the whole picture, and reading it as one
     would be the expensive mistake. HIS OWN D10 RULING (5 Aug 2026, re-confirmed 10 Aug) deliberately
     put reps_log.jsonl, readiness.json, intake_log.json, learning_state and the live examiner INTO
     the public repo. The reversals, the reasons and the frozen old rules are all written in .gitignore
     — `grep -n "D10\|HIS RULINGS" .gitignore`. The LAW stands ("glance before every push"); what has
     changed is that some personal data is public BY HIS DECISION, so a session must not "fix" it back.)

🛰️ THE PRO LANE — CORRECTED (v4.0)
There is NO "AI-Studio ↔ AI-Pro" API unlock — a consumer Gemini AI Pro subscription (the Jio accounts) does NOT grant an elevated AI Studio API tier; a Pro-account key is still free-tier (Pro models 403). The prior "linking unlocks the 1M Pro engine" belief was wrong and is retired. The CODE already knew this: T5 Scout is a HUMAN surface (no API), and every Pro call degrades Pro→flash-latest on the 403 — proven this session (M18 season_read ran on gemini-flash-latest fine; the ~120k-token corpus fits Flash). The Pro accounts' real value = Jules (async coding labor, public repo, PR-gated — both ENROLLED) + the consumer surfaces by hand (Deep Research, NotebookLM, Veo). The 9 keys are AQ.* free-tier in ~/.gemini/.env; Live voice works. Free pool resets ~12:30 IST — organs degrade honestly when dry.
  (checked 10 Aug 2026: "9 keys" still measures 9 — `grep -c "AQ\." ~/.gemini/.env` → 9, same count
  from `grep -o "GEMINI_API_KEY[0-9_]*" ~/.gemini/.env | wc -l`. Count it, don't quote it — this is a
  file the captain edits by hand. "Free pool resets ~12:30 IST" is NOT VERIFIED 10 Aug 2026: it is an
  external-vendor observation with no corresponding constant anywhere in scripts/ (`grep -rn "12:30" scripts/*.mjs`
  hits only timeaudit's mock-day fixtures), so treat it as a claim, not as a wired behaviour.
  The DEGRADATION half of the sentence IS wired and is the part that matters —
  `grep -rn "flash-latest" scripts/*.mjs` shows the Pro→flash fallback.)

📁 FILES OF RECORD
OPS_STATE.md (this) — read first. THE_ORGANISM_A_TO_Z.md — the full anatomy + pitch (read to Nidhi). CYBORG_BRAIN.md / CYBORG_STRETCH.md — the two-speed-brain build spec + the M14+ arc. learning-layer/ — the FORGE pedagogy + the DOSSIER + syllabus. ARSENAL_AI_FC_MASTERPLAN / THE_MANAGER / THE_GAFFER — the Manager's brain + soul. Skills (12): /matchday /forge /learn /full-time /scrimmage /rematch /genome /paste-session /talk /organism-doctor /gem-sync /paint. (ORGANISM_ANATOMY.md + ORGANISM_LEDGER.md refreshed by Jules 15 Jul — cyborg layer + real counts now in.) THE_CAPTAINS_MANUAL.md — the captain's how-to-use-it operating manual.
  (corrected 10 Aug 2026 — the SKILLS LIST is wrong and a wrong skills list makes a session offer him
  surfaces that exist and miss surfaces he has. `ls .claude/skills/` returns **15**, not 12:
  fire · forge · full-time · gem-sync · genome · gist-patch · harvest · learn · matchday ·
  organism-doctor · paint · paste-session · rematch · scrimmage · talk. THREE are missing from the
  line above — **/fire** (drives a staged Gemini mission in his Chrome), **/gist-patch** (walks a
  closed Re-Jirah round's reJirahDone patch into the gist) and **/harvest** (pulls a Gem sitting onto
  the afferent bus). This is the THIRD time this count has been wrong in this file — 11→12 on 6 Aug,
  12→15 today. It should never have been a number: run `ls .claude/skills/`.
  The .md FILE PATHS on this line were each checked and every one exists at the repo root
  (`ls *.md`), including THE_CAPTAINS_MANUAL.md — note it is gitignored/local-only, so it is on his
  laptop, not on the remote: `grep -n "THE_CAPTAINS_MANUAL" .gitignore`.)

🧠 ENV / LESSONS (carry-forward)
Windows, Node 22, ESM. Entry guard uses pathToFileURL(process.argv[1]). Atomic writes (temp→rename). Daemons are singletons via localhost port locks (:4113/:4112/:4114) — second instance stands down; launchers kill-then-start so they never serve stale code. ntfy phone subscribed; two pushes only ever (08:45 sheet, 21:30 bell). Log files show UTF-8 as gibberish (cosmetic). Bench voice = talk.mjs (Claude brain + msedge-tts) when the Gemini pool is dry. naive_shadow multiplier live (~526k would-be-Opus tokens vs ~209 free units on a sample day).
  (10 Aug 2026 — TWO corrections, and the first one is the dangerous one:
   · **THE BELL IS 22:00, NOT 21:30.** His ruling B3, 9 Aug 2026 — "bell time 10:00 krdo, i come back
     home at that time" — moved it, and it is now 22:00 in all three places: the code
     (`grep -n "fulltime: { at:" scripts/brain.mjs` → `at: "22:00", grace_min: 75`), the Windows task
     (`schtasks /query /tn "\ArsenalFC-Bell-FullTime" /fo list /v` → Start Time 22:00:00) and the
     config note. The code comment ABOVE that line records why it mattered: the bell said 21:30 while
     the task fired 22:30, and 60 of the 75 grace minutes burned before the bell even rang. Anyone
     planning his evening off "21:30" here plans it half an hour early. (Same query also shows the
     Bell task currently sits DISABLED — see the WHERE-WE-ARE correction about the 23 disabled tasks.)
   · **The port-lock list is short by two.** Alongside 4113/4112/4114 the brain now takes 4115 (tick
     lock) and 4116 (daemon singleton) — `grep -n "4115 brain tick-lock" scripts/brain.mjs` names both
     in one comment. On this pass 4112/4113/4114/4116 were LISTENING and 4115 idle between ticks.
   THE REST OF THIS LINE HELD, each checked: the entry guard really is that idiom across most of the
   fleet (`grep -rl "pathToFileURL(process.argv\[1\])" scripts/*.mjs | wc -l` → 68 of the 75 tracked
   .mjs on this pass; count it, don't quote it); "two pushes only ever" is
   still architecturally true and asserted by brain.mjs's own selftest ("only two utterances exist
   (bell registry + push_after)"); bench voice really is talk.mjs → speak.mjs → msedge-tts
   (`grep -n "msedge-tts" scripts/speak.mjs`, `grep -n 'from "./speak.mjs"' scripts/talk.mjs`);
   naive_shadow is live in fuelboard.mjs (`grep -n "naive_shadow_tokens" scripts/fuelboard.mjs`) —
   the ~526k/~209 pair is a SAMPLE DAY and was never meant to be read as current.)

▶ NEXT ACTION
The organism is LAUNCHED. The captain opens the Dugout, says "good morning," studies, and pastes every session. The scorecard + runbook are his to show Nidhi. Then he does his reps. COYG. ⚪🔴
  (10 Aug 2026 — one rider, not a rewrite: "pastes every session" is no longer the only route. The
  zero-tax capture surfaces now exist and are what a session should reach for first — `/forge` captures
  reps at session end with no copy-paste, `/harvest` pulls a Gem sitting onto the bus, `/paste-session`
  remains for the manual case. All three are on disk: `ls .claude/skills/`. The runbook is
  LAUNCH_RUNBOOK.md at the repo root; the scorecard is a shareable artifact, not a repo file, so it
  cannot be verified from here — NOT VERIFIED 10 Aug 2026.)
