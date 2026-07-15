# ORGANISM_ANATOMY.md — the final body, as built
### ⚪🔴 · 12 Jul 2026 · branch `organism-final` · the build constitution for THE ORGANISM's final form
### Supersedes nothing; layers on everything. THE_ORGANISM.md is the vision; this is the body it got.

---

## 0. WHAT CHANGED FROM EVERY PRIOR PASS

Two orders from the captain (with Nidhi, in writing, 12 Jul 2026):

1. **The brain runs HOT, not lean.** The one-Opus-call-a-day law is retired (frozen in
   canon as the M-1→M-5 era design; still how the *morning sheet* works — but no longer
   the brain's ceiling). The brain now makes as many calls as it takes to stay sharp
   around the clock, deliberately exhausting the Claude Max 5x plan every rolling window
   and every week, weighted to overnight idle hours, with the Manager tracking spend and
   protecting the captain's study hours.
2. **The full body is built NOW, not staged behind blood.** THE_ORGANISM §XI's birth
   order ("blood first, organs later") is retired as a *sequencing* law and kept as a
   *speak-gate* law: every organ is built and wired today, and every fitted organ stays
   **gagged until its input stream has actually flowed at volume**. Build maximal;
   speak earned.

Everything else the repo holds as law, this body obeys unchanged — §2 below.

---

## 1. THE BODY AT A GLANCE

```
            ┌────────────────────────  THE BRAIN (hot)  ─────────────────────────┐
            │  brain.mjs — job queue · claude -p executor · usage ledger ·       │
            │  budget governor (exhaust plan / protect study hours) ·            │
            │  overnight-heavy · Gemini second-brain (flagged) ·                 │
            │  M-3: feeds runManager({llm}) — manager.mjs untouched              │
            └──────△──────────────────────────────────────────────┬─────────────┘
                   │ one coherent frame (pulse.json + every organ)│ sheet · drills ·
                   │                                              │ insights · wall
   ┌───────────────┴────────────────────┐              ┌──────────▽──────────┐
   │        THE SENSORY CORTEX          │              │      ⚡ YOU ⚡        │
   │ heartbeat.mjs → pulse.json         │              │  PASTE · SOLVE ·    │
   │ (fsrs·calibration·nemesis·maidan)  │              │  BOLO · COPY-BACK   │
   │ twin.mjs (the book on you, gagged) │              │  (+THROW-IN, phone) │
   │ doubtminer.mjs (decoy·lexicon·tape)│              └──────────△──────────┘
   │ physio.mjs (proprioception, FIRST) │                         │
   └───────────────△────────────────────┘                        │ the pitch reshapes
                   │ blood                                        │ around you
   ┌───────────────┴─────────────────────────────────────────────┴───────────┐
   │  THE AFFERENT NERVE: capture.mjs (live) · throwin.mjs · mirror.mjs      │
   └──────────────────────────────────────────────────────────────────────────┘
   touchline.mjs (senses the day, acts only through the next packet, never pings)
   setpiece.mjs  (yesterday's exact failures → tomorrow's ≤3 drills, first ball winnable)
   scorer.mjs    (evening: scores YOUR bets, the TWIN's, the GAFFER's — one arithmetic)
   scout.mjs     (threshold staging + LEARN/RATIFY edges — no projected date ever shown)
   bootroom.mjs  (the genome: serial pre-registered mutations, auto-revert, changelog)
   postmatch.mjs (the evening ledger: HIT/MISS · KAL-line · matches_played · notebook)
   viz.mjs       (THE CLUB WALL: the whole body as living pictures + ambient wallpaper)
   GOVERNOR      (oura_coach.mjs, live) → ladder_config.json: verdict = systemic hormone
```

**The heart stays the heart.** Four verbs + the honest fifth (throw-in). Nothing routes
around the captain; nothing adds a sixth verb; nothing pings him mid-day; nothing shows
him a loss before he chooses to look.

---

## 2. THE LAWS THIS BODY OBEYS (inherited whole, none weakened)

- **Layering, never replace.** Every green agent stays intact and runnable. No existing
  file is rewritten; `manager.mjs` is not edited even for M-3 (the brain passes `llm`
  into the exported `runManager({llm})` socket — the plug finally meets the socket that
  was built for it).
- **AI proposes · code validates · human approves.** Every LLM output passes a
  deterministic validator (the manager's zero-invented-numbers pattern, reused); every
  proposal lands as a proposal; nothing auto-acts on the captain's life.
- **Single writer per state file.** New organs each own exactly one output surface (§4).
- **Bias-to-silence + speak-gates.** Every fitted organ is volume-gated in code
  (`awaiting_data` → `warming_up` → `ok`); premium signals hard-suppressed below gates.
- **Medical spine untouchable.** Goalkeeper thresholds and every medical rule are
  constitutionally outside the genome's whitelist; RHR/HRV/temp never drive verdicts;
  doctor-referral stands; no dose/diagnosis language anywhere, ever.
- **Nidhi's pedagogy boundary.** Organs track OUTCOMES and compile drills from the
  DOSSIER's probe grammar; the FORGE method itself (how he learns) mutates only through
  the Boot Room's captain-gated genome, one pre-registered gene at a time.
- **Humane clamps (protect the man, not limit the machine):** win-only voicing ·
  cold-start gag · exception-only voice · Governor never in a league table ·
  adaptation always disclosed at post-match · no calendar pressure · no streak-shaming
  (weekly consistency only) · no hype in output, ever.
- **Secrets untouchable; repo public.** Every new state output is gitignored and
  check-ignore-verified before any commit.
- **No API key. Ever.** All Claude via `claude -p` on Max; all Gemini via the free
  Gemini CLI on his Google account (setup pack §3). Extra-Usage stays OFF.

---

## 3. THE FINAL ROSTER — twenty-nine organs, one circulation

Status legend: **LIVE** = existed green before this build · **BUILT** = new, selftested,
runs today on seed/empty data · **GATED** = built but constitutionally silent until its
volume gate opens · **[LEAP]** = named honestly as vision, not built.

| # | Organ | File(s) it owns (writer) | Status |
|---|-------|--------------------------|--------|
| 1 | THE HEART — the captain | (everything, via four verbs + throw-in) | irreplaceable |
| 2 | Capture (afferent nerve) | `reps_log.jsonl` | LIVE |
| 3 | **Mirror** — capsule-mirror, Drive/gist → local | `state/capsules/*.json`, `mirror_manifest.json` | BUILT |
| 4 | **Throw-in** — ntfy poller, phone → body | `loose_balls.jsonl` | BUILT |
| 5 | **Heartbeat** — one sensory pass (shells #0–#4 + timeaudit) | `pulse.json` | BUILT |
| 6 | **Physio** — proprioception, bleed-detection, speak-gate keeper | `loop_vitals.json` | BUILT (first) |
| 7 | **Twin** — the book on the captain; sealed daily bets | `twin.json`, `predictions.jsonl` | BUILT · GATED voice |
| 8 | **Touchline** — tunnel/struggle/tank/weak-foot reads (ear exiled) | `pitch_read.json` | BUILT |
| 9 | **Set-Piece Coach** — ≤3 drills in DOSSIER grammar; derby fixtures; tape-room rematches; first ball winnable | `drills.json` | BUILT |
| 10 | **Evening Scorer** — the Slip: one ledger, three books scored | `slip.jsonl`, `trust_tiers.json` | BUILT |
| 11 | **Advance Scout** — threshold staging + LEARN/RATIFY edge split | `scout.json` | BUILT |
| 12 | **Boot Room** — the genome; serial mutations; auto-revert | `forge_profile.json`, `mutations.jsonl`, `SEASON_CHANGELOG.md` | BUILT · GATED |
| 13 | **Doubt Engine** — decoy map · Ghar-ki-Boli lexicon · tape-room queue | `doubt_grammar.json`, `lexicon.json`, `tape_room.json` | BUILT · GATED clusters |
| 14 | **Post-Match** — evening ledger; fills the open writer slots | `post_match/*.md`, `season.json`, `notebook.json` | BUILT |
| 15 | **The Club Wall (viz)** — the body as living pictures | `wall_data.json`, `club/wall.html` (+ wallpaper feed) | BUILT |
| 16 | **THE BRAIN** — hot runtime; M-3; two-brain routing; budget governor | `brain_ledger.jsonl`, `brain_queue.json`, `brain_out/*` | BUILT |
| — | Governor ladder (autonomic gradient) | `ladder_config.json` (committed; consumed by 8,9,15,16) | BUILT |
| — | Goalkeeper · Time-Auditor · FSRS · Calibration · Nemesis · Learning-state · Manager M-1 | (unchanged) | LIVE |

**Dissolved into laws/existing organs (per the vision's own merges):** the Derby is a
fixture-type inside Set-Piece; the Edge Ledger is Scout's LEARN/RATIFY view over
learning_state's `edge_map`; the Tape Room is a drill-type fed by Doubt Engine's queue;
First Touch is a template law in the sheet + post-match; the No-Look Pass is Scorer's
`trust_tiers.json` consumed by the sheet; the Autonomic Ladder is a config every organ
reads. **Not built, by constitution:** the Twelfth Player (Nidhi's buttons — a decision
for two humans; a consent note ships in `setup/12TH_PLAYER_DECISION.md`, no code), the
Mixed-Zone Ear on FORGE-Bolo (exiled forever; a passive scrimmage-only hook exists in
touchline config, disabled).

---

## 4. DATA CONTRACTS — every new file on the bus

All under `dressing-room/state/` unless noted; ALL gitignored (verified) except
committed configs. Uniform envelope on every JSON: `{date, status:
"awaiting_data"|"warming_up"|"ok", low_confidence, generated_at}`.

- **`capsules/<id>.json` + `mirror_manifest.json`** (mirror.mjs) — verbatim local copies
  of the gist capsules (tokenization, embeddings, inference, context, …), manifest =
  `{fetched_at, per_id: {ok, bytes, sha256, error}}`. Read-only for every other organ.
- **`loose_balls.jsonl`** (throwin.mjs) — `{ts, id, text(verbatim), routed:false}`, one
  per dictated throw-in; poller dedups on ntfy message id; never counts usage anywhere.
- **`pulse.json`** (heartbeat.mjs) — run-manifest of one sensory pass: per-agent
  `{ran, exit, ms, output_fresh}` + staleness table + `withheld_disclosures[]` (ladder
  actions to disclose at post-match). Heartbeat *shells* the existing scripts; it never
  writes their files.
- **`loop_vitals.json`** (physio.mjs) — `{bleeds:[{organ, kind:
  stale|emitted_unconsumed|effort_uncaptured|throwin_gap|mirror_stale, evidence, line}],
  signal_table:[{organ, brier|null, n}] (Governor constitutionally absent),
  speak_gates:{twin:bool, bootroom:bool, doubt_clusters:bool,…}}`. Exception-only: its
  sheet line exists only when something bleeds.
- **`twin.json` + `predictions.jsonl`** (twin.mjs) — markets:
  `first_focus_by_0930 · floor_touched · session_happened` (+ per-concept
  sessions-to-lock once volume exists). Each morning run SEALS bets
  (`{date, market, p, base_rate, n, sealed_at}`) before any day-data lands; scorer
  resolves. `voice` field is non-null **only** when the captain beat the book
  (win-only law in code); 30 scored resolutions + beats-base-rate before ANY voice;
  dead markets pruned; dread-class markets machine-side forever.
- **`pitch_read.json`** (touchline.mjs) — `{tunnel:{wall_minutes_today, state},
  struggle:{verdict: productive|spinning|cruising|no_data, basis},
  tank:{bench:[…], above_line:[…]}, weak_foot:{deferral_streaks:[{concept,n}]},
  ear:{surface:"scrimmage_only", enabled:false}}` — consumed ONLY by setpiece/viz/
  postmatch (things already in front of him). May lighten/reorder/reframe; may never
  add work; verdict "productive struggle" = DO NOTHING (in code).
- **`drills.json`** (setpiece.mjs) — tomorrow's packet: `≤3` drills, each
  `{kind: opener|rejirah|derby|tape_room|novel_probe|negative_space, probe_type:
  🔵|🟡|🟣|🔴|⚫, concept(s), prompt_seed (DOSSIER grammar), source (exact failure/
  confusion/doubt it compiles), winnable:bool}` — drill #1 winnable by law (green
  concept), RED day → one five-minute floor-touch only, AMBER → recall-weight only
  (ladder), derby = hot `confusion_pairs` juxtaposition + contrast probe, tape_room =
  archived doubt verbatim as cross-examiner (`"Week-N Nikhil argued X. Dismantle him."`).
- **`slip.jsonl` + `trust_tiers.json`** (scorer.mjs) — the ONE proposal/bet ledger:
  `{date, book: captain|twin|gaffer, type, claim, horizon_days, resolved, hit, evidence}`.
  Three read-views: trust tiers (per-proposal-type rolling hit-rate → `no_look:bool`
  above threshold, captain ratifies promotion once), Gaffer move-tallies (descriptive
  context only, never automated lever-ranking), physio vitals. One arithmetic: the
  exported `ece()` from calibration.mjs scores every book.
- **`scout.json`** (scout.mjs) — `{staged:[{trigger_met, kind: scrimmage|finops_milestone,
  prepared_at, brief}], edges:{learn:[…], ratify:[…]} (proposal — captain approves the
  split)}`. Constitutional law in code: **no projected date field exists in the schema.**
- **`forge_profile.json`** (committed, bootroom.mjs sole writer) — the method as
  versioned data: `{version:"v1.0", rejirah_intervals:[3,14,42], axis_weights, interleave,
  legacy:{}}` — seeded verbatim from FORGE_SPEC's current constants. **`mutations.jsonl`**
  — `{id, target, diff, evidence[], predicted_effect, metric, review_after_days,
  revert_diff, status: proposed|live|kept|reverted}` — serial law: one live mutation;
  volume-gated scoring; medical + honest-frame targets rejected by whitelist.
  **`SEASON_CHANGELOG.md`** (gitignored) — one human line per beat.
- **`doubt_grammar.json` / `lexicon.json` / `tape_room.json`** (doubtminer.mjs) —
  wrong-prior shape clusters (finance-analogy-overreach, mechanism-conflation, …) mined
  from capsule `doubts[]` (maine-socha-X-phir-Y is machine-parseable by law); anchor
  metaphors extracted (never invented) from `bolo`/`deep` with breaking-points; rematch
  queue + `doubts_retired` counter. Decoy predictions NEVER shown pre-Pehle-Guess
  (they shape probes only). Clusters gated behind capsule+doubt volume.
- **`post_match/<date>.md` + `season.json` + `notebook.json`** (postmatch.mjs — fills
  the three writer slots the Manager has been reading from since M-1): HIT/MISS ·
  one signal · KAL-line (the weld) · disclosures of the day's silent adaptations ·
  twin's voiced line if (and only if) earned · `matches_played` increment (won-day
  law: floor-attempt or conscious-rest) · notebook = compressed real moments.
- **`wall_data.json` + `club/wall.html`** (viz.mjs) — §6.
- **`brain_ledger.jsonl` + `brain_queue.json` + `brain_out/`** (brain.mjs) — §5.
- **Committed configs (all additive canon):** `ladder_config.json`,
  `brain_config.json`, `dossier_weights.json` (the DOSSIER §1 round-weights + §4
  probe-grammar, machine-readable at last), `twin_config.json`, `touchline_config.json`,
  `setpiece_config.json`, `physio_config.json` (expected cadence per bus file),
  `scout_config.json`, `mirror_config.json` (gist raw base + IDMAP),
  `doubtminer_config.json` (seed shape taxonomy).

---

## 5. THE BRAIN — hot, plan-exhausting, study-protecting

**`brain.mjs`** — deterministic runtime; the LLM is only ever the passenger.

**Jobs** (defined in `brain_config.json`, each `{id, kind, window, model_hint, priority,
enabled, prompt_builder, validator, max_out}`):

| Job | When | What |
|---|---|---|
| `formation_read` | 08:45 | **M-3 live**: `runManager({llm: claudeP})` — system.md soul + FEATURES → the sheet. Manager's own validator rejects any invented number. |
| `midday_reread` | 13:30 | Re-reads pulse + pitch_read → refreshes `drills.json` enrichment ONLY (acts through the packet; no ping, no new sheet). |
| `evening_voice` | 21:50 | Post-match Gaffer line + twin voiced line (win-only) → feeds postmatch.mjs template slots, validated. |
| `deep_twin` | overnight | Re-model narrative over predictions history → `brain_out/twin/` (machine-side; informs market tuning proposal, never auto-applied). |
| `doubt_clusters` | overnight | Semantic clustering assist over parsed doubts → doubtminer proposal file (human-gated batch "go"). |
| `lexicon_mine` | overnight | Anchor-metaphor extraction assist (verbatim-quote-only prompt; validator rejects any text not present in source). |
| `drill_forge` | overnight | Phrase tomorrow's compiled drills in DOSSIER register (seeds from setpiece; validator: no new numbers, no new concepts). |
| `wall_insights` | overnight | ≤3 insight lines for the Wall from wall_data (zero-invented-numbers validator). |
| `season_review` | Sun overnight | The week in evidence lines; Boot Room mutation draft (deterministic evidence assembled by bootroom.mjs; brain only words it). |
| `gemini_render` | overnight, flagged | Gemini CLI: wall_data → rich visual HTML/infographic + video-prompt refresh (disabled until setup pack wires `gemini`). |

**The budget governor (the Manager tracking tokens, mechanically):**
- Every call runs `claude -p --output-format json`; usage (input/output tokens, duration,
  result) is appended to `brain_ledger.jsonl`.
- Plan model: Max 5x ≈ 5-hour rolling windows + a weekly ceiling. Anthropic publishes no
  exact token numbers, so `brain_config.json` carries **self-tuning estimates**:
  start conservative; on any observed limit/refusal event the runtime records the
  observed ceiling and re-fits (`observed_window_ceiling`). Honest engineering — the
  ledger learns the plan's true shape instead of pretending to know it.
- **Study-hour protection (09:00–21:00):** the runtime spends at most
  `day_reserve_frac` (default 25%) of estimated window headroom, so the captain can
  always open Claude and work. **Overnight (22:00–07:30):** it spends aggressively —
  queue-drain until `overnight_target_frac` (default 95%) of the window estimate is
  consumed, refilling with lower-priority enrichment jobs (extra scrimmage staging,
  deeper season analysis, next-capsule daraar pre-maps) until the plan is exhausted.
  Unused capacity is wasted sharpness; the ledger proves the exhaustion.
- **Cadence:** `ArsenalFC-BrainTick` runs `brain.mjs tick` every 30 minutes; the tick is
  cheap and deterministic (read ledger → compute headroom → pop eligible jobs → run
  serially → log). Laptop closed = ticks simply don't fire; nothing breaks; physio
  notices the gap and says so once.
- **Two brains, best of each:** Claude = judgment, coaching voice, probe phrasing,
  the hard reads. Gemini (CLI, free on his Google account; Pro sub raises limits) =
  visualization generation, long-context bulk (whole-repo/season files), NotebookLM
  material prep. Routing is per-job config, never per-token cleverness. Gemini jobs
  ship disabled and degrade gracefully until the captain runs setup §3.
- **Honest frame, in code:** brain output validators reuse the manager's
  zero-invented-numbers check; no brain job may write "10x/exponential/on steroids"
  (banned-phrase validator — hype in output is a bug, per canon).

---

## 6. VISUALIZATION — a first-class organ, because he thinks in pictures

**THE CLUB WALL** (`viz.mjs` → `dressing-room/club/wall.html`, gitignored):
one self-contained dark HTML file, inline SVG, zero network, opens offline, renders:

1. **The Maidan pitch** — stages/handoffs as an actual pitch diagram, fluency-colored
   (🔴🟡🟢), weak connection highlighted as the frayed pass.
2. **The season arc** — matches_played, phase, weekly-consistency % (never streaks),
   trophy state (cabinet light, not countdown).
3. **The calibration curve** — his three buckets vs targets, ECE trend sparkline,
   danger-zone list (only when `status:"ok"`).
4. **The derby table** — hot confusion pairs and settled derbies (trophies).
5. **`doubts_retired`** — the one progress bar this brain believes, next to
   matches_played.
6. **The wall trend** — tunnel wall-minutes as a weekly-trend line only (never a daily
   meter; hidden entirely on RED days).
7. **The body strip** — Governor verdict band (verdict + tier only — no raw biometrics
   on a rendered surface), physio bleeds if any, brain ledger meter (plan exhaustion %,
   overnight work done — the machine visibly got sharper while he slept).
8. **Brain insights** — ≤3 validated lines from `wall_insights`.

RED/miss-day variant renders KAL-line + floor only (his own wall never shows him a
loss before he's chosen to look).

**Ambient Maidan (wallpaper):** `setup/wallpaper.ps1` — pure PowerShell/.NET
System.Drawing, reads `wall_data.json`, draws KAL-line + Maidan strip + weekly
consistency onto a PNG, sets it as desktop wallpaper. Captain enables via one schtasks
line in the setup pack (his call — it changes a system setting, so HE runs it).

**Gemini render path:** `gemini_render` job + `setup/gems/` prompts turn the same
`wall_data.json` into rich infographics/video-prompt material on his Gemini Pro —
the strong visual brain doing what it's best at.

---

## 7. THE SCHEDULE (written plainly; installed by the captain via setup/install_tasks.ps1)

Existing tasks stay untouched (layering): GK 08:30 · FSRS 08:40 · Cal 08:42 · Nem 08:43 ·
LS 08:44 · CapturePull hourly 09–22 · TimeAuditor 12:00/21:00.

New (all `ArsenalFC-*`, CWD-independent):

```
06:55  ArsenalFC-Mirror       gist capsules → local mirror
07:30  ArsenalFC-Physio-AM    vitals before anything speaks
08:35  ArsenalFC-Twin         seal today's bets (before any day-data)
08:39  ArsenalFC-Heartbeat    one sensory pass (idempotent with 08:40–:44 tasks)
08:45  ArsenalFC-Manager      brain job: formation_read → the sheet (+ntfy push)
08:50  ArsenalFC-Wall-AM      wall refresh
:15s   ArsenalFC-Throwin      every 15 min, 07:00–23:00
:30s   ArsenalFC-Touchline    every 30 min, 09:00–21:00 (writes files; never pings)
:30s   ArsenalFC-BrainTick    every 30 min, 24h (self-governing hot brain)
13:30  (brain: midday_reread — inside BrainTick policy)
21:35  ArsenalFC-Scorer       resolve matured bets, three books
21:40  ArsenalFC-SetPiece     compile tomorrow's ≤3 drills (ladder-dampened)
21:50  (brain: evening_voice — inside BrainTick policy)
22:00  ArsenalFC-Wall-PM      wall refresh + wallpaper feed
22:15+ (brain: overnight queue-drain until plan-exhaustion target — 4–5 nights/wk
        the laptop is open ≈22:00→08:00; heaviest work lands here by design)
Sun    ArsenalFC-Sunday       bootroom proposal + season_review (brain) — the only
                              Sunday activity; the organism otherwise idles with him
Manual node scripts/postmatch.mjs  — the captain's 30-second full-time ritual
```

---

## 8. GRAVEYARD RESURRECTIONS (what came back out, at ceiling)

Reopened and BUILT: post-match writer + KAL-line writer + matches_played incrementer +
notebook.json (M-1's dormant readers finally get writers) · captain_note channel
(postmatch prompts for it; sheet renders it — dormant input wired) · axis_pattern
rendered at last (setpiece consumes it; wall shows it) · confusion_pairs + edge_map
consumers (derby fixtures; LEARN/RATIFY) · FSRS recompute-on-pull (heartbeat pass) ·
manager_notes staleness telemetry consumer (physio) · Gemini visualization layer
(§6 — the OPS_STATE end-of-build intent, built) · SEASON.md logbook intent (postmatch
ledger + wall = its living form) · timeaudit→manager schema bridge (heartbeat emits a
manager-shaped `timeaudit` view — fixes the field-name mismatch WITHOUT editing either
green script; the IST date bug is flagged to the captain, one-line fix in timeaudit.mjs
proposed but not applied, since that file is green and layering law holds) ·
known-unknowns map (guessed-wrong topics — physio signal table view) · deload/
progression legacy signals (surfaced as INFO lines via ladder config, never verdicts).

Stayed dead, and I endorse the kills (per THE_ORGANISM Pass-2): phase-yield board ·
interleave control-arm · per-axis form-curve numerology · frozen week-1 ghost ·
nearest-neighbor coaching retrieval · twin scoreline framing · cash-fine gimmick ·
'exponential' claims of any kind.

---

## 9. WHAT STAYS GATED OR [LEAP] (the honest ledger lives in ORGANISM_LEDGER.md)

Gated in code: twin voice (30 resolutions + beat-base-rate) · boot-room first mutation
(volume-gated metric) · doubt-grammar clusters (capsule+doubt volume) · Apni Ghadi
(≥8 matured capsules) · body-archive era lines (12 weeks) · mixed-zone ear (passive,
scrimmage-only, off). [LEAP] not built: the Twelfth Player (two-human decision) ·
eval-scoreboard back-route (FinOps repo is the captain's to build) · Transfer Window
(constitution clause — written into this file, §10, zero code needed).

## 10. THE TRANSFER WINDOW (constitution, inherited from the vision verbatim in spirit)

The day the offer lands, nothing dies: the DOSSIER config re-points from interview
loops to the job itself; capsules keep decay-guarding professional working memory;
the season ROLLS. A prosthesis is not returned after the race.

*It proposes. You decide. COYG.* ⚪🔴


## 8. THE CYBORG-BRAIN LAYER (14 Jul 2026)

| # | Organ | Role | Status |
|---|-------|------|--------|
| 17 | **Thalamus** | Binds every sense into single moments, scores salience, wakes the cortex | BUILT |
| 18 | **Cortex** | Two-speed reasoning (fast reflex + deep slow), budget rationing | BUILT |
| 19 | **Hippocampus** | Five-layer associative memory retrieval, instantly accessible | BUILT |
| 20 | **DMN** | Default Mode Network, offline connection mapping | BUILT |
| 21 | **Council** | Parallel specialist lenses debating deep problems | BUILT |
| 22 | **Nightshift** | Dreaming and background tasks while the captain is away | BUILT |
| 23 | **Fuelboard** | Organism calorie and token spend tracking | BUILT |
| 24 | **Examiner** | Evaluates scrimmage and hedges, adversarial probing | BUILT |
| 25 | **Tone** | Prosody and emotion gating/processing | BUILT |
| 26 | **Presence** | Tracks the active session and human engagement state | BUILT |
| 27 | **Groundsman** | Keeps the field clear, manages ephemeral data cleanup | BUILT |
| 28 | **Awayday** | Offline syncing and disconnected operation state | BUILT |
| 29 | **Turnstile** | Access control and ingestion gating | BUILT |
