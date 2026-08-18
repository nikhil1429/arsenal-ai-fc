# ORGANISM_ANATOMY.md — the final body, as built
### ⚪🔴 · 12 Jul 2026 · branch `organism-final` · the build constitution for THE ORGANISM's final form
### Supersedes nothing; layers on everything. THE_ORGANISM.md is the vision; this is the body it got.

> **(corrected 10 Aug 2026 — READ THIS BEFORE YOU TRUST A STATUS LINE BELOW.)** This file was
> written 12 Jul 2026 and its §8 cyborg table on 14 Jul. It is the BUILD CONSTITUTION — the laws
> and the intent are still live and still binding. Its **counts, schedules, job tables, gate
> states and owner lists are a 12–14 Jul SNAPSHOT** and several had gone wrong by today. Every
> one this pass could verify is corrected in place with its evidence; where a number would rot
> again on the next run, the number is replaced by the command that reads it live.
> **`branch organism-final` above no longer exists** — `git branch -a` lists only `main` and
> `e2e-audit-fixes`; the work is merged and `main` is the live branch.

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

**(corrected 10 Aug 2026 — four drawings in the box above have moved since 12 Jul; the box
itself is left verbatim so the original diagram survives.)**
- `heartbeat.mjs → pulse.json (fsrs·calibration·nemesis·maidan)` — heartbeat no longer shells
  four; its squad is DATA, not code. Read it live:
  `node -e "console.log(require('./dressing-room/state/heartbeat_config.json').order.map(o=>o.name).join(' '))"`
  (10 Aug 2026 that printed eight: capture · fsrs · capsule_bridge · calibration · nemesis ·
  learning_state · timeaudit · shipped). Evidence: `grep -n "for (const entry of cfg.order)" scripts/heartbeat.mjs`.
- `THE AFFERENT NERVE: capture.mjs · throwin.mjs · mirror.mjs` — still true, no longer complete.
  `harvest.mjs` joined the bus 9 Aug 2026 (`grep -n "modality: \"gemini\"" scripts/harvest.mjs`),
  and the thalamus POST door is now the way onto the afferent lane.
- `GOVERNOR (oura_coach.mjs, live) → ladder_config.json` — the arrow is a *reading*, not a write.
  **No script writes `ladder_config.json`**; it is a committed verdict→demands map and the verdict
  comes only from `readiness.json`. Verify: `grep -rn "ladder_config" scripts/*.mjs` returns
  read-sites and comments only.
- The staggered clock the box implies is gone — see §7, which now runs through `conductor.mjs`.

**The heart stays the heart.** Four verbs + the honest fifth (throw-in). Nothing routes
around the captain; nothing adds a sixth verb; nothing pings him mid-day; nothing shows
him a loss before he chooses to look.
*(Re-checked 10 Aug 2026 and it HELD: `grep -n "const BELLS" scripts/brain.mjs` shows exactly
one bell, `fulltime` at 22:00, and the only other pushes are the 08:45 sheet and its absence
notice — `grep -n "pushNtfy(cfg" scripts/brain.mjs`. Nothing fires between them.)*

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
  **(corrected 10 Aug 2026 — the law holds, "exactly one output surface" does not, and there is
  one deliberate exception plus one real breach.)** Most organs built since 12 Jul own SEVERAL
  files (postmatch owns five, scout two-plus-a-dir, doubtminer three) — see the §3 table, now
  corrected. TWO named departures from single-writer:
  · **`brain_ledger.jsonl` is a SHARED APPEND LANE by design** — six live appenders (brain,
    cortex ×2, council, selfknowledge, nightshift, dmn); `brain.mjs` owns the SCHEMA only
    (`grep -n "brain_ledger" scripts/talk.mjs scripts/dmn.mjs scripts/organism_test.mjs`). An
    append-only lane with one schema owner is a different law, not a broken one.
  · **`identity_facts.pending.jsonl` has TWO live writers and that IS a breach** —
    `grep -n "identity_facts.pending" scripts/hippocampus.mjs scripts/mcp-memory.mjs`:
    hippocampus REWRITES the whole file, mcp-memory APPENDS. A rewrite racing an append.
    NOT fixed here (code is not this pass's to touch) — **needs the captain's ruling.**
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
  **(corrected 10 Aug 2026: "every new state output is gitignored" is no longer true, and it
  stopped being true by the CAPTAIN'S OWN RULING, not by an oversight.)** His decision D10 of
  5 Aug 2026, re-put to him by class and re-confirmed 10 Aug ("dono rehne do"), put
  `readiness.json` and `intake_log.json` INTO the public repo, and `reps_log.jsonl`,
  `learning_state.json` and `examiner_drill.json` with them — all recorded verbatim in
  `.gitignore`'s own comment blocks (`grep -n "D10" .gitignore`). Others (`missions.json`,
  `benchmark.json`, `widgets.json`, `python_state.json`) are tracked as canon. Never assert
  the ignore state of a file from this doc — ask git:
  `git check-ignore -v dressing-room/state/<file>` and `git ls-files dressing-room/state/`.
  The secrets law itself is UNWEAKENED: `oura_secrets.json` / `oura_tokens.json` are still
  denied, and new state files are still private-by-default.
- **No API key. Ever.** All Claude via `claude -p` on Max; all Gemini via the free
  Gemini CLI on his Google account (setup pack §3). Extra-Usage stays OFF.
  **(corrected 10 Aug 2026 — the API-key half is enforced in code and HELD; the Gemini half
  describes a routing that no longer runs.)** The refusal is real: `grep -n "ANTHROPIC_API_KEY"
  scripts/brain.mjs`. But `brain_config.json` today routes **every** job through engine
  `claude` — verify:
  `node -e "const c=require('./dressing-room/state/brain_config.json');console.log([...new Set(c.jobs.map(j=>j.engine))])"`
  (10 Aug 2026: `[ 'claude' ]`). The `gemini` block is `enabled:true` and the CLI path exists
  (`grep -n "geminiCommand" scripts/brain.mjs`), but the painter was re-pointed at Claude on
  17 Jul — the job's own `_engine_note` says so. Gemini is still the internet/second brain,
  reached through the OUTWARD LOOP and `harvest.mjs`, not through a brain job engine.

---

## 3. THE FINAL ROSTER — twenty-nine organs, one circulation

**(corrected 10 Aug 2026: it was never final, and "twenty-nine" is a 14 Jul count.)** Twenty-nine
is exactly the number of NUMBERED rows across this table (1–16) and the §8 cyborg table (17–29) —
that arithmetic still checks out. What rotted is the word FINAL: whole organs built since carry no
row here at all (distiller · scoreboard · nikhil_model · harvest · gate_tune · watchman ·
selfknowledge · captains_call · benchmark · shadow · speak · dugout · conductor · daemon_watchdog).
**Never take a body count from this heading.** Count the code:
`git ls-files "scripts/*.mjs" | wc -l` (75 tracked on 10 Aug 2026), and read membership from the
two suite strings in `package.json` (`organism:selftest`, `squad:selftest`), which
`node scripts/organism_test.mjs all` enforces mechanically.

Status legend: **LIVE** = existed green before this build · **BUILT** = new, selftested,
runs today on seed/empty data · **GATED** = built but constitutionally silent until its
volume gate opens · **[LEAP]** = named honestly as vision, not built.
**(checked 10 Aug 2026 — and BUILT is not the same as HAS RUN, which is this repo's own
"unrun system = hypothesis" law. Most BUILT rows have run: their output sits on the bus.
`ls dressing-room/state/`. But SIX declared outputs have never been written, and two organs
are the reason:**
· **Post-Match (#14) has never completed a full ledger** — `season.json`, `notebook.json`,
  `routed_balls.json` and `post_match/<date>.md` are all ABSENT. Only `dressing-room/SEASON.md`
  exists, and that is the `season` sub-mode's output, not the ritual's. The 12 Jul claim that this
  organ "fills the open writer slots the Manager has been reading since M-1" is a claim about
  CODE, not about DATA: the slots are still empty. `brain_config.json`'s `season_review` job
  independently records the same fact.
· **The Boot Room (#12) has never filed a mutation** — `mutations.jsonl` and `SEASON_CHANGELOG.md`
  are ABSENT, which is exactly what its own gate predicts (`17/200 reps`, §9). Its
  `bootroom_log.jsonl` DOES exist, so the organ runs weekly and honestly logs the no-op.
**Check any owned file before depending on it — `ls dressing-room/state/` — never infer existence
from a BUILT status. The one status word that had actually flipped is Doubt Engine's gate; the
one that is half-wrong is the Groundsman's. Both corrected in the rows.)**

| # | Organ | File(s) it owns (writer) | Status |
|---|-------|--------------------------|--------|
| 1 | THE HEART — the captain | (everything, via four verbs + throw-in) | irreplaceable |
| 2 | Capture (afferent nerve) | `reps_log.jsonl`, `gemini_quality.jsonl` | LIVE |
| 3 | **Mirror** — capsule-mirror, Drive/gist → local | `state/capsules/*.json`, `mirror_manifest.json`, `capsule_backups/<date>/` | BUILT |
| 4 | **Throw-in** — ntfy poller, phone → body | `loose_balls.jsonl`, `throwin_state.json` | BUILT |
| 5 | **Heartbeat** — one sensory pass (shells its configured squad + timeaudit) | `pulse.json` | BUILT |
| 6 | **Physio** — proprioception, bleed-detection, speak-gate keeper | `loop_vitals.json` | BUILT (first) |
| 7 | **Twin** — the book on the captain; sealed daily bets | `twin.json`, `predictions.jsonl` | BUILT · GATED voice |
| 8 | **Touchline** — tunnel/struggle/tank/weak-foot reads (ear exiled) | `pitch_read.json`, `pitch_read_history.jsonl` | BUILT |
| 9 | **Set-Piece Coach** — ≤3 drills in DOSSIER grammar; derby fixtures; tape-room rematches; first ball winnable | `drills.json` | BUILT |
| 10 | **Evening Scorer** — the Slip: one ledger, three books scored | `slip.jsonl`, `trust_tiers.json` | BUILT |
| 11 | **Advance Scout** — threshold staging + LEARN/RATIFY edge split; THE MISSIONS DESK (8 Aug 2026) | `scout.json`, `missions.json`, `scout_reports/mission_*.md`, `dressing-room/missions/` | BUILT |
| 12 | **Boot Room** — the genome; serial mutations; auto-revert | `forge_profile.json`, `mutations.jsonl`, `SEASON_CHANGELOG.md`, `bootroom_log.jsonl` | BUILT · GATED |
| 13 | **Doubt Engine** — decoy map · Ghar-ki-Boli lexicon · tape-room queue | `doubt_grammar.json`, `lexicon.json`, `tape_room.json` | BUILT · clusters gate **OPEN** |
| 14 | **Post-Match** — evening ledger; fills the open writer slots | `post_match/*.md`, `season.json`, `notebook.json`, `routed_balls.json`, `dressing-room/SEASON.md` | BUILT |
| 15 | **The Club Wall (viz)** — the body as living pictures | `wall_data.json`, `club/wall.html` (+ wallpaper feed) | BUILT |
| 16 | **THE BRAIN** — hot runtime; M-3; two-brain routing; budget governor | `brain_queue.json`, `brain_out/*`; **SCHEMA-owner (not sole writer) of `brain_ledger.jsonl`** | BUILT |
| — | Governor ladder (autonomic gradient) | `ladder_config.json` (committed; **no script writes it**; read live by 5 + 9 — see note) | BUILT |
| — | Goalkeeper · Time-Auditor · FSRS · Calibration · Nemesis · Learning-state · Manager M-1 | (unchanged) | LIVE |

**(corrected 10 Aug 2026 — the owner column above was a 12 Jul snapshot and eight rows had
grown a file since. Every correction, with the command that proves it:)**
- **#2 Capture** also owns `gemini_quality.jsonl` — `grep -n "GEMINI_QUALITY" scripts/capture.mjs`
  (declared and appended there; `scout.mjs` and `watchman.mjs` are readers only).
- **#3 Mirror** also writes a dated snapshot to `capsule_backups/<date>/` —
  `grep -n "capsule_backups" scripts/mirror.mjs`. **And the phrasing everywhere else in canon is
  wrong**: CLAUDE.md's "No script writes `capsules/`" is self-negating — `mirror.mjs` IS a script
  and IS the writer. The true law is "**no OTHER organ writes it**".
- **#4 Throw-in** also owns `throwin_state.json` — `grep -n "OUTPUT:" scripts/throwin.mjs`.
- **#5 Heartbeat** — "shells #0–#4 + timeaudit" was a hardcoded squad; the squad is config, and
  it has grown (capsule_bridge and shipped joined). Read it live, per §1's corrected note.
- **#8 Touchline** also owns `pitch_read_history.jsonl` — `grep -n "sole writer of both" scripts/touchline.mjs`.
- **#11 Scout** gained THE MISSIONS DESK on 8 Aug 2026 — `grep -n "MISSIONS DESK" scripts/scout.mjs`
  (sole writer of `missions.json`, and it writes the mission bodies under `dressing-room/missions/`
  and ingested returns under `scout_reports/`).
- **#12 Boot Room** also owns `bootroom_log.jsonl` — `grep -n "bootroom_log" scripts/bootroom.mjs`;
  born of audit #98, because its whole weekly output used to be a `console.log` into a window that closed.
- **#13 Doubt Engine — THE ONE STATUS THAT FLIPPED.** "GATED clusters" is FALSE as of today: the
  gate is `4/4 capsules · 112/60 doubts`, `speak_gates.doubt_clusters` is `true`, and
  `doubt_grammar.json.clusters` holds a real cluster (`scale_intuition_failure`, n=5). Read it live —
  `node -e "const v=require('./dressing-room/state/loop_vitals.json');console.log(v.speak_gates.doubt_clusters, v.speak_gate_counters.doubt_clusters.line)"`.
  A doc that still calls an open organ silent is how a session decides not to look at its output.
- **#14 Post-Match** owns FIVE, not three — `grep -n "OUTPUT:" scripts/postmatch.mjs`:
  `routed_balls.json` (the throw-in routing gate) and `dressing-room/SEASON.md` (the logbook,
  un-parked by his word 7 Aug 2026) joined the three the Manager had been reading since M-1.
- **#16 THE BRAIN** — `brain_ledger.jsonl` is NOT brain-only. It is a shared append lane with six
  live appenders, by design; the brain owns the schema. See §2's corrected single-writer bullet.
- **Governor ladder** — "consumed by 8,9,15,16" is WRONG. `grep -rn "ladder_config" scripts/*.mjs`
  shows the only live READS are `heartbeat.mjs` (organ #5) and `setpiece.mjs` (#9), plus a
  `repo_bundle.mjs` catalogue entry and comment-only mentions in `bootroom.mjs`/`nikhil_model.mjs`.
  Touchline (#8), viz (#15) and brain (#16) do not open the file — the wall reads the verdict
  through `pulse.json.ladder` instead. And nothing WRITES it: it is committed canon.

**Dissolved into laws/existing organs (per the vision's own merges):** the Derby is a
fixture-type inside Set-Piece; the Edge Ledger is Scout's LEARN/RATIFY view over
learning_state's `edge_map`; the Tape Room is a drill-type fed by Doubt Engine's queue;
First Touch is a template law in the sheet + post-match; the No-Look Pass is Scorer's
`trust_tiers.json` — **written by `scorer.mjs` alone, NOT by the sheet**
(corrected under issue #95, 2026-08-04: `assemblePrompt` has never read it — verified,
`manager.mjs` contains zero references to `trust_tiers`, and
`dressing-room/manager/system.md` already recorded this correction — find it with
`grep -n "trust_tiers" dressing-room/manager/system.md`. The old line
here claimed a consumer that does not exist. **Re-corrected 10 Aug 2026:** "read by
`scorer.mjs` alone" has since gone wrong in the other direction — `grep -rln "trust_tiers"
scripts/*.mjs` now returns TWO files, `scorer.mjs` and `captains_call.mjs`. The WRITER is still
scorer alone and the sheet still does not read it; only the reader count moved); the Autonomic
Ladder is a config every organ reads **(corrected 10 Aug 2026: not every organ — two, live;
see the Governor note under the table)**. **Not built, by constitution:** the Twelfth Player (Nidhi's buttons — a decision
for two humans; a consent note ships in `setup/12TH_PLAYER_DECISION.md`, no code), the
Mixed-Zone Ear on FORGE-Bolo (exiled forever; a passive scrimmage-only hook exists in
touchline config, disabled).

---

## 4. DATA CONTRACTS — every new file on the bus

All under `dressing-room/state/` unless noted; ALL gitignored (verified) except
committed configs. Uniform envelope on every JSON: `{date, status:
"awaiting_data"|"warming_up"|"ok", low_confidence, generated_at}`.

> **(corrected 10 Aug 2026 — both halves of that sentence have exceptions now.)**
> **(a) "ALL gitignored" is no longer true** and stopped being true by HIS ruling, not by drift —
> see the corrected secrets bullet in §2. Ask git, never this doc:
> `git check-ignore -v dressing-room/state/<file>`.
> **(b) The envelope is not uniform.** Checked all eleven bus JSONs on 10 Aug 2026; nine carry the
> full four-field envelope, **two do not**: `loop_vitals.json` and `wall_data.json` carry only
> `{date, generated_at}` — no `status`, no `low_confidence`. Both are deliberate shapes (the physio
> reports per-gate counters instead of one status word; the wall carries per-panel have/need, which
> is viz's own "EVERY GATE IS A COUNTER" law — `grep -n "EVERY GATE IS A COUNTER" scripts/viz.mjs`).
> Re-check any time:
> `node -e "for(const f of ['pulse','loop_vitals','twin','pitch_read','drills','wall_data','doubt_grammar','lexicon','tape_room','trust_tiers','mirror_manifest']){const k=Object.keys(require('./dressing-room/state/'+f+'.json'));console.log(f, ['date','status','low_confidence','generated_at'].filter(x=>k.includes(x)).join(','))}"`

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
  *(Re-verified 10 Aug 2026 and the NO-DATES LAW HELD — it is asserted mechanically:
  `grep -n "NO-DATES LAW" scripts/scout.mjs`. The schema has GROWN, though: the live file also
  carries `readiness`, `readiness_line`, `war_room`, `apply_window` and `note` beside the four
  envelope fields. Read the shape live —
  `node -e "console.log(Object.keys(require('./dressing-room/state/scout.json')))"` — and note
  that `scout.mjs` is now also sole writer of `missions.json` (§3 #11).)*
- **`forge_profile.json`** (committed, bootroom.mjs sole writer) — the method as
  versioned data: `{version:"v1.0", rejirah_intervals:[3,14,42], axis_weights, interleave,
  legacy:{}}` — seeded verbatim from FORGE_SPEC's current constants.
  **(corrected 10 Aug 2026 — three of those five key names are not the ones in the file, and a
  script written against this line would read `undefined`.)** Live shape, from
  `node -e "console.log(Object.keys(require('./dressing-room/state/forge_profile.json')))"`:
  `version` is **`"1.0"`, not `"v1.0"`**; the intervals key is **`rejirah_intervals_days`**
  (value `[3,14,42]` — that part was right); the interleave key is
  **`interleave_confusables: true`**; `axis_weights` (a–i, all 1) and `legacy:{}` are correct as
  written; and a fifth key the line never mentioned exists —
  `criterion_gated_pass:{correct, confidence, latency_under_median}`. **`mutations.jsonl`**
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
- **`post_match/<date>.md` + `season.json` + `notebook.json`** — **(corrected 10 Aug 2026:
  postmatch.mjs owns FIVE files, not three. `grep -n "OUTPUT:" scripts/postmatch.mjs` adds
  `routed_balls.json` (the throw-in routing gate — nothing is ever auto-written) and
  `dressing-room/SEASON.md` (the logbook, un-parked by his word 7 Aug 2026: Claude fills 100%,
  he writes ZERO). Also note the ritual is no longer only manual — `postmatch.mjs` has `route`
  and `season` sub-modes, and the `/full-time` skill drives it.)** (postmatch.mjs — fills
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
  **(checked 10 Aug 2026: all ten are still tracked and all ten still exist — this list HELD.
  It is now INCOMPLETE, which is the way a hand-kept list rots.** `heartbeat_config.json`,
  `scorer_config.json`, `throwin_config.json`, `thalamus_config.json`, `council_config.json`,
  `fuelboard_config.json`, `learning_state_config.json`, `calibration_config.json` and
  `nemesis_config.json` are committed canon too and are named nowhere here. Enumerate live,
  never from this bullet: `git ls-files "dressing-room/state/*.json"`.
  One config in that list is named in NO document at all — `thalamus_config.json`, owned by
  `gate_tune.mjs` (`grep -n "thalamus_config" scripts/gate_tune.mjs`), whose second file
  `gate_tune_ledger.jsonl` is likewise undocumented anywhere.)

---

## 5. THE BRAIN — hot, plan-exhausting, study-protecting

**`brain.mjs`** — deterministic runtime; the LLM is only ever the passenger.

**Jobs** (defined in `brain_config.json`, each `{id, kind, window, model_hint, priority,
enabled, prompt_builder, validator, max_out}`):

> **(corrected 10 Aug 2026 — THIS IS THE MOST ROTTED BLOCK IN THE FILE. Do not plan brain work
> from the table below; read the config.)**
> **The job-record shape is wrong in three of nine field names.** There is no `model_hint`, no
> `prompt_builder`, no `max_out`. Live field set, from
> `node -e "const c=require('./dressing-room/state/brain_config.json');const s=new Set();c.jobs.forEach(j=>Object.keys(j).forEach(k=>s.add(k)));console.log([...s].sort().join(' '))"` —
> `at · days · enabled · engine · extra_args · hype_guard · id · inputs · kind · max_per_day ·
> model · out · priority · prompt_file · rehearse · repeatable · serve · speak_to · surface ·
> trigger · trigger_fallback_hm · validate · window` (plus `_`-prefixed note keys). Note
> `surface` — every job must now declare WHERE its output appears, which is the guard that
> caught three jobs writing into files nothing opened.
> **`jobs` is an ARRAY, not an object**, and it has grown from the ten below to thirty.
> List them live:
> `node -e "const c=require('./dressing-room/state/brain_config.json');for(const j of c.jobs)console.log(j.id, j.at||j.window, j.model, 'enabled='+j.enabled)"`
> Named-but-unlisted jobs on 10 Aug 2026 include the whole Dugout cartridge chain
> (`dugout_digest`, `day_cartridge`, `midday_cartridge`, `midday_digest` ×3), `night_coach`,
> `agenda` (22:45), `diary` (03:00), `model_mine`, `dreams`, `deep_reanalysis`,
> `teamtalk_am`/`teamtalk_pm`, `maidan_poster`, `wall_review`, `widget_spec`, `market_scan`,
> `scrimmage_staging`, `capsule_premap`. The ten-row table below is a 12 Jul snapshot kept for
> the design intent; its per-row corrections follow it.

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

**(corrected 10 Aug 2026 — five of those ten rows now say something false. Verify each with
`node -e "const c=require('./dressing-room/state/brain_config.json');console.log(JSON.stringify(c.jobs.find(j=>j.id==='<id>'),null,1))"`.)**
- **`formation_read` — "08:45" is now the EARLIEST time, not the time.** Its `window` was
  `"morning"` (07:30–12:00) and audit #108 (6 Aug 2026) changed it to `"any"`, because on a laptop
  that sleeps through the morning the job ran on 1 of 9 days and `team_sheet.md` — the Manager's
  only output — sat frozen for a week. `at:"08:45"` is kept as a floor; `max_per_day:1` still means
  one sheet a day. It also now waits on a real gate: `trigger:"morning_signals"` with
  `trigger_fallback_hm:"09:30"`, armed by `conductor.mjs` (`grep -n "morning_signals" scripts/conductor.mjs`),
  so the sheet can never again be built on inputs that had not been computed yet.
- **`deep_twin` no longer writes `brain_out/twin/`** — the out was renamed to `twin_read`
  (surface: `brain_out/twin_read/<date>.md`), which killed seven phantom consumers in `reconcile`.
- **`doubt_clusters` is not "human-gated batch go"** into doubtminer — its declared surface is a
  file the captain batch-glances, `brain_out/doubts/<date>.md`; no doubtminer proposal seam exists.
- **`season_review` is `enabled:false`** — DISABLED 2 Aug 2026 (audit #63) and kept off since.
  Its own `_DISABLED_2026_08_02` note gives the reason in full: 17 runs / 48,781 Opus tokens into
  `brain_out/season/`, which no `.mjs` opens, and 2 of its 4 inputs had never existed. So §7's
  "Sun ArsenalFC-Sunday → bootroom proposal + season_review (brain)" is half dead — see §7.
- **`gemini_render` is `enabled:true` and does NOT ride the Gemini CLI.** Its `engine` is
  `claude` and its own `_engine_note` says why: *"17 Jul: the painter rides Claude too — the
  sanitizer never cared who holds the brush."* Its surface is `club/wall_gemini.html`, through
  viz's sanitizer, from a prompt file the wall itself writes. "Disabled until setup pack wires
  gemini" has been wrong for over three weeks.

**The budget governor (the Manager tracking tokens, mechanically):**
- Every call runs `claude -p --output-format json`; usage (input/output tokens, duration,
  result) is appended to `brain_ledger.jsonl`.
  *(Still true 10 Aug 2026 — `grep -n '"-p", "--output-format", "json"' scripts/brain.mjs` — but
  INCOMPLETE: since 6 Aug every call also carries LEAN_ARGS (`--system-prompt … --tools ""
  --strict-mcp-config`, `grep -n "LEAN_ARGS" scripts/brain.mjs`), which cut the `claude -p` boot
  tax from ~49,411 to ~5,663 tokens per call and is what ended the 2 Aug pause. Revert switch:
  `budget.lean_calls=false`. And per §2/§3: `brain_ledger.jsonl` is a SHARED append lane —
  the brain is not its only appender.)*
- Plan model: Max 5x ≈ 5-hour rolling windows + a weekly ceiling. Anthropic publishes no
  exact token numbers, so `brain_config.json` carries **self-tuning estimates**:
  start conservative; on any observed limit/refusal event the runtime records the
  observed ceiling and re-fits (`observed_window_ceiling`). Honest engineering — the
  ledger learns the plan's true shape instead of pretending to know it.
  **(corrected 10 Aug 2026: the plan is no longer Max 5x.** His verbatim ruling recorded in
  `brain_config.json._split_ruling_2026_08_09` — *"i am on claude 20x plan now"* — splits one 20x
  account three ways: Nidhi 800k/12M · his study 800k/12M · **THE ORGANISM 1.6M/24M**, zero
  remainder. The config's `window_capacity_est_tokens` / `weekly_capacity_est_tokens` ARE the
  organism's share, so any lane hitting the account wall is evidence about a SHARED ceiling.
  The self-tuning mechanism itself is unchanged and still true. Read the live numbers:
  `node -e "console.log(require('./dressing-room/state/brain_config.json').budget)"`.)
- **Study-hour protection (09:00–21:00):** the runtime spends at most
  `day_reserve_frac` (default 25%) of estimated window headroom, so the captain can
  always open Claude and work. **Overnight (22:00–07:30):** it spends aggressively —
  queue-drain until `overnight_target_frac` (default 95%) of the window estimate is
  consumed, refilling with lower-priority enrichment jobs (extra scrimmage staging,
  deeper season analysis, next-capsule daraar pre-maps) until the plan is exhausted.
  Unused capacity is wasted sharpness; the ledger proves the exhaustion.
  **(corrected 10 Aug 2026: `day_reserve_frac` is `0.4`, not 25%** — it was raised and this line
  was not. `overnight_target_frac` is still `0.95`, as written. Never quote either from here;
  they are two keys in one object: `node -e "const b=require('./dressing-room/state/brain_config.json').budget;console.log(b.day_reserve_frac, b.overnight_target_frac)"`.)
- **Cadence:** `ArsenalFC-BrainTick` runs `brain.mjs tick` every 30 minutes; the tick is
  cheap and deterministic (read ledger → compute headroom → pop eligible jobs → run
  serially → log). Laptop closed = ticks simply don't fire; nothing breaks; physio
  notices the gap and says so once.
  *(Verified live 10 Aug 2026 and HELD — `schtasks /query /tn ArsenalFC-BrainTick /fo list /v`
  shows `scripts\brain.mjs tick`, repeat every 30 minutes, no until-duration, i.e. 24h. What the
  line does not know: a SECOND lane exists. `ArsenalFC-BrainDaemon` launches `brain.mjs daemon`
  (`grep -n 'mode === "daemon"' scripts/brain.mjs`) through `setup/hidden_run.vbs` daily at 07:06,
  and `ArsenalFC-Daemon-Watchdog` watches it. Read both live:
  `schtasks /query /fo csv /nh | findstr ArsenalFC`.)*
- **Two brains, best of each:** Claude = judgment, coaching voice, probe phrasing,
  the hard reads. Gemini (CLI, free on his Google account; Pro sub raises limits) =
  visualization generation, long-context bulk (whole-repo/season files), NotebookLM
  material prep. Routing is per-job config, never per-token cleverness. Gemini jobs
  ship disabled and degrade gracefully until the captain runs setup §3.
  **(corrected 10 Aug 2026: there are no Gemini jobs left in the brain.** The `gemini` block is
  `enabled:true` and the CLI resolver exists, but every one of the thirty jobs declares
  `engine:"claude"` — the painter was re-pointed on 17 Jul. Gemini is still the second brain, but
  it is reached through the OUTWARD LOOP (`scout.mjs` missions, HE fires them) and `harvest.mjs`,
  not through a brain job. Verify:
  `node -e "const c=require('./dressing-room/state/brain_config.json');console.log([...new Set(c.jobs.map(j=>j.engine))])"`.)
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
**(corrected 10 Aug 2026, two things.** (a) The path is **`setup/WALLPAPER.ps1`**, upper-case —
`ls setup/`. Windows forgives the case; git and any Linux runner do not. (b) It is no longer his
manual schtasks line: the standalone `ArsenalFC-Wallpaper` task is **Disabled**, and the wallpaper
now runs as the last step of the evening chain — `grep -n "WALLPAPER.ps1" scripts/conductor.mjs`
shows it as the `wallpaper` step at 23:10, the one non-node step in `EVENING`, gated on `wall-pm`.
The output is real: `dressing-room/club/wallpaper.png`.)

**Gemini render path:** `gemini_render` job + `setup/gems/` prompts turn the same
`wall_data.json` into rich infographics/video-prompt material on his Gemini Pro —
the strong visual brain doing what it's best at.
**(corrected 10 Aug 2026 — the directory does not exist and the brush changed hands.**
`ls setup/` has **no `gems/`**; the Gems material is the single file `setup/GEMS_SETUP.md`, and the
render's actual prompt is written by the wall itself into `dressing-room/club/prompts/wall_painter.md`
(the job's `prompt_file` is `wall_painter.md`; see its `surface` in `brain_config.json`). And the
job runs on **Claude**, not Gemini Pro — see the §5 correction. What IS live on that path today:
`club/wall_gemini.html` plus dated siblings, and `club/poster.svg` from the `maidan_poster` job —
`ls dressing-room/club/`.)

---

## 7. THE SCHEDULE (written plainly; installed by the captain via setup/install_tasks.ps1)

> **(corrected 10 Aug 2026 — THE STRUCTURE OF THE DAY CHANGED. Almost every row below is now a
> DISABLED Windows task whose work moved inside a chain. Read the schedule from the machine, never
> from here: `schtasks /query /fo csv /nh | findstr ArsenalFC`.)**
>
> **What happened (the reason is in the code, not in a doc):** the morning was fifteen separate
> alarms staggered five minutes apart, and *that stagger WAS the pipeline order*. Windows fires ONE
> collapsed catch-up on wake, never the N missed occurrences — so the morning the laptop overslept,
> the whole order evaporated: observed 1 Aug 2026, fifteen tasks in a single 10:03:09 burst, the
> Goalkeeper writing `readiness.json` at 10:03:14 while the sheet had already been built at 09:58:33
> off a four-day-old body read. One overslept morning, five downstream failures, zero alarms. Read
> the full account at the head of `scripts/conductor.mjs`.
>
> **The live shape today:** two ordered chains, one task each.
> · **`ArsenalFC-Morning-Conductor` — daily 09:15** → `conductor.mjs morning`, running the
>   `MORNING` array in dependency order (`grep -n "export const MORNING" scripts/conductor.mjs`):
>   mirror · sprintsync · thalamus · cortex · turnstile · physio · goalkeeper · twin · heartbeat ·
>   fsrs · calibration · nemesis · learningstate · **signals** (arms the gate) · sheet · wall. The
>   `at:` times kept beside each step are the retired task's old clock, kept only so this chain
>   stays readable next to the block below. A late start now makes a LATE day, not a broken one.
> · **`ArsenalFC-Evening-Conductor` — daily 22:00** → `conductor.mjs evening`, the `EVENING` array
>   (`grep -n "export const EVENING" scripts/conductor.mjs`): bell · scorer · scoreboard ·
>   nikhil-model · setpiece · doubtminer · physio-pm · examiner · wall-pm · scout · wallpaper.
> · Every run writes its own receipt — `dressing-room/state/conductor.json` and
>   `conductor_evening.json` (what ran, what failed, how long, in what order), because "it returned
>   0" is exactly the signal that hid the original failure for two weeks.
> · Installers: `setup/INSTALL_TASKS.ps1`, `setup/INSTALL_CONDUCTOR.ps1`,
>   `setup/INSTALL_EVENING_CONDUCTOR.ps1`, `setup/INSTALL_CYBORG_TASKS.ps1` — all upper-case;
>   `setup/install_tasks.ps1` in the heading above is the wrong case for anything but Windows.

Existing tasks stay untouched (layering): GK 08:30 · FSRS 08:40 · Cal 08:42 · Nem 08:43 ·
LS 08:44 · CapturePull hourly 09–22 · TimeAuditor 12:00/21:00.
**(corrected 10 Aug 2026: five of those seven no longer hold.** `ArsenalFC-Goalkeeper`,
`-FSRS`, `-Calibration`, `-Nemesis` and `-LearningState` are all **Disabled** — their work is now
steps 7 and 10–13 of the morning chain. Two held, with one drift: **CapturePull is exactly as
written** (daily 09:00, repeat 1h, until-duration 13h = 09:00–22:00), and **TimeAuditor is NOT
"12:00/21:00"** — it is `TimeAuditor-Pulse` at **12:00, 15:00 and 18:00** (three separate task
rows) plus `TimeAuditor-Full` at **22:00**.)

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

**(corrected 10 Aug 2026 — row by row, against `schtasks` read live. The block above is the
12 Jul PLAN; this is the machine.)**
- **Folded into the Morning-Conductor and now `Disabled` as standalone tasks:**
  `ArsenalFC-Mirror` (06:55) · `-Physio-AM` (07:30) · `-Twin` (08:35) · `-Heartbeat` (08:39) ·
  `-Wall-AM` (08:50). **`ArsenalFC-Manager` (08:45) does not exist as a task at all** and never
  did under that name — the sheet is the `formation_read` brain job, reached through the chain's
  `sheet` step (`brain.mjs tick`) behind the `morning_signals` gate.
- **Folded into the Evening-Conductor and now `Disabled`:** `ArsenalFC-Scorer` (21:35) ·
  `-SetPiece` (21:40) · `-Wall-PM` (22:00) · `-Doubtminer` · `-Physio-PM` · `-Examiner` ·
  `-Scout` · `-Wallpaper`. Their live times shifted with the chain: scorer 22:35, setpiece 22:40,
  wall-pm 23:00, wallpaper 23:10 — and the 22:00 bell is HIS ruled time (*"bell time 10:00 krdo,
  i come back home at that time"*, `grep -n "bell time 10:00" scripts/brain.mjs`).
- **`ArsenalFC-Throwin` is NOT 07:00–23:00.** Live: start 03:44, repeat every 15 min, until-duration
  **Disabled** — i.e. round the clock.
- **`ArsenalFC-Touchline` is NOT 09:00–21:00.** Live: repeat every 30 min, until-duration
  **Disabled** — round the clock. (Its no-ping law is unaffected and still holds — §1.)
- **`ArsenalFC-BrainTick`** — as written, every 30 min, 24h. HELD. See the §5 note for the second
  lane (`-BrainDaemon` 07:06, `-Daemon-Watchdog`).
- **"Sun ArsenalFC-Sunday" is the wrong name and half the payload is off.** The task is
  **`ArsenalFC-BootRoom`, Weekly, SUN 20:00**, running `scripts/bootroom.mjs` — and
  `season_review` has been `enabled:false` since 2 Aug (§5). Sunday is also no longer "the only
  Sunday activity": both conductors, BrainTick, Throwin, Touchline, Watchman, NightShift and the
  Groundsman push all run daily, Sunday included.
- **Tasks running today that this block never named:** `-Morning-Conductor` · `-Evening-Conductor` ·
  `-Groundsman-Push` (daily 03:45) · `-Watchman` (23:55) · `-NightShift` (02:40) · `-Consolidate` ·
  `-HippoStore` · `-HippoIndex` · `-ConceptGraph` · `-Distiller` · `-DMN` · `-Presence` ·
  `-PresenceFit` · `-ShadowDetect` · `-Tone` · `-DugoutReminders` · `-WakeProbe` · `-Wall-Live` ·
  `-Daemon-Watchdog` · `-BrainDaemon`. **Enumerate, never copy:**
  `schtasks /query /fo csv /nh | findstr ArsenalFC`.
- **`Manual node scripts/postmatch.mjs`** still holds as a path, but it is no longer the only
  door: the `/full-time` skill drives the same ritual, and `postmatch.mjs` has `route` and
  `season` sub-modes beside `run`.

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

**(corrected 10 Aug 2026 — four of those resurrection claims name a consumer that does not exist,
and one names an unapplied fix that WAS applied. Each checked by grepping the consumer itself.)**
- **The IST date bug in `timeaudit.mjs` IS FIXED.** This line says the one-line fix was
  *"proposed but not applied, since that file is green and layering law holds"* — that is no longer
  true and has not been for weeks: `grep -n "IST fix (organism U4, captain-approved)" scripts/timeaudit.mjs`
  shows the applied fix, building `dateStr` from local components instead of `toISOString()`,
  captain-approved. The heartbeat's schema bridge (`timeaudit_bridge` in `pulse.json`) is still
  there and still real — both are true now, not one instead of the other.
- **`captain_note` — "postmatch prompts for it" is FALSE.** `grep -rln "captain_note" scripts/*.mjs`
  returns exactly one file: `manager.mjs`. The sheet renders it, as claimed; nothing prompts for it,
  so the "dormant input wired" half never landed. **Needs the captain: is the channel wanted?**
- **`axis_pattern` — "wall shows it" is FALSE.** `grep -rln "axis_pattern" scripts/*.mjs` returns
  `manager.mjs`, `nemesis.mjs`, `setpiece.mjs`. Set-piece consumes it as claimed; `viz.mjs` does not
  reference it at all.
- **`manager_notes` staleness telemetry — "(physio)" is FALSE.** `grep -n "manager_notes"
  scripts/physio.mjs` returns nothing, and `manager_notes.json` is absent from
  `physio_config.json`'s `expected_cadence_hours` table. Its only readers are `manager.mjs` and
  `brain.mjs`. Nothing watches it for staleness today.
- **Held on re-check:** `confusion_pairs` really does feed both derby fixtures and the wall
  (`grep -rln "confusion_pairs" scripts/*.mjs` → learning_state, setpiece, viz), `edge_map` really
  does reach Scout (→ learning_state, scout), and the post-match writer slots really were built
  (§3 #14 — five files, not three).

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

**(corrected 10 Aug 2026 — the THRESHOLDS all held; ONE gate has since OPENED, and a gate list
in prose is exactly the thing that goes stale silently.)**
- **`doubt-grammar clusters` is NO LONGER GATED.** Live: `4/4 capsules · 112/60 doubts`,
  `speak_gates.doubt_clusters = true`, and real clusters are being emitted. Same correction as
  §3 #13.
- Still shut on 10 Aug 2026, with their live counters: twin voice `15/30 resolutions on one
  claim-type` · boot-room mutation `17/200 reps` · Apni Ghadi `1/8 cards with ≥4 reps` ·
  body-archive `24/84 body-days witnessed`.
- **Never read a gate state from this paragraph.** The physio owns all of them and prints them
  with have/need:
  `node -e "const v=require('./dressing-room/state/loop_vitals.json');console.log(v.speak_gates);for(const [k,c] of Object.entries(v.speak_gate_counters))console.log(k, c.line||JSON.stringify(c))"`
- The THRESHOLDS behind them are canon and are all confirmed correct as written, in
  `physio_config.json.gates`: `twin_voice_min_resolutions: 30` · `doubt_clusters {min_capsules: 4,
  min_doubts: 60}` · `apni_ghadi {min_cards: 8, min_reps_per_card: 4}` · `body_archive_min_days: 84`
  (= the 12 weeks this line claims) · plus `bootroom_min_reps: 200`, which this line only called
  "volume-gated metric". `twin_config.json` agrees: `voice_min_resolutions: 30`, `dead_market_min: 30`.
- One clamp got MORE honest since 12 Jul and this line still carries the old wording: "beat-base-rate"
  was proved unbeatable by construction (the baseline was hindsight-fitted), so the live test is
  against the uninformative **0.5 book** — `grep -n "deadVerdictLegacy" scripts/twin.mjs`; the old
  arithmetic is frozen beside it, never deleted.
- The mixed-zone ear re-checked and HELD: `{enabled:false, surface:"scrimmage_only"}`, hardcoded —
  `grep -n "scrimmage_only" scripts/touchline.mjs`. The Twelfth Player's consent note really does
  ship as `setup/12TH_PLAYER_DECISION.md` (`ls setup/`), no code.

## 10. THE TRANSFER WINDOW (constitution, inherited from the vision verbatim in spirit)

The day the offer lands, nothing dies: the DOSSIER config re-points from interview
loops to the job itself; capsules keep decay-guarding professional working memory;
the season ROLLS. A prosthesis is not returned after the race.

*It proposes. You decide. COYG.* ⚪🔴


## 8. THE CYBORG-BRAIN LAYER (14 Jul 2026)

**(noted 10 Aug 2026: this is the file's SECOND `## 8` — "GRAVEYARD RESURRECTIONS" above carries
the same number, and it sits after §9 and §10 in the document. Left exactly as written, because
renumbering would break every cross-reference already pointing at "§8 graveyard". When citing,
name the title, not the number.** All thirteen scripts below exist and are tracked —
`git ls-files "scripts/*.mjs" | findstr "thalamus cortex hippocampus dmn council nightshift fuelboard examiner tone presence groundsman awayday turnstile"` —
and all thirteen sit in `package.json`'s `organism:selftest` suite, so `npm test` covers them.
Their runtime state is a different question from their BUILD state: the three daemons
(thalamus :4113 · cortex :4112 · turnstile :4111) are launched by the morning chain and can be
running a STALE BUILD without failing — `dressing-room/state/conductor.json` recorded exactly that
on 10 Aug 2026 for thalamus and cortex. Check the live answer with
`node scripts/conductor.mjs morning` output or by reading that receipt, never from this table.)**

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
| 27 | **Groundsman** | Two-node **bus-lease arbiter** (`bus_lease.json`: laptop always priority, the Kennel may take the lease only past TTL, nobody ticks the brain without holding it) + a **publish-allowlist git-push gate** — the Kennel's night-shift. It cleans up nothing. | **arbiter DORMANT (M9) · push gate LIVE** |
| 28 | **Awayday** | Offline syncing and disconnected operation state | BUILT |
| 29 | **Turnstile** | Access control and ingestion gating | BUILT |

**(corrected 10 Aug 2026 — #27's status was one word for two halves, and the halves diverged.)**
The organ has two jobs and only one of them is dormant:
- **The bus-lease arbiter is genuinely DORMANT, M9-pending, as written.** Evidence:
  `dressing-room/state/bus_lease.json` **does not exist** (`ls dressing-room/state/`), no
  `groundsman heartbeat` task is scheduled, and `.gitignore` still carries the M9 line saying the
  lease stays local *"until the Pi arrives"*. Its TTL default is 20 min
  (`grep -n "TTL_MIN" scripts/groundsman.mjs`), which the header notes fits same-disk arbitration
  only — a git-carried lease wants `--ttl 90`.
- **The publish-allowlist push gate is LIVE and pushing nightly.** `ArsenalFC-Groundsman-Push`
  runs `scripts/groundsman.mjs push` daily at **03:45** (Ready, not Disabled), and
  `scripts/groundsman.log` holds the receipt — a real `b58f6a5..49bc94e main -> main` push to
  `github.com/nikhil1429/arsenal-ai-fc`. The allowlist is
  `grep -n '"scripts/", "setup/", "hooks/", "dressing-room/state/"' scripts/groundsman.mjs`, and
  the push-only lane **never ticks and never pulls** — the daemon owns the beat, asserted in the
  organ's own selftest (`grep -n "D3: push-only" scripts/groundsman.mjs`).
- Consequence worth knowing before planning: because the push lane is live on a PUBLIC repo, a
  newly-created state file is only safe because `git add -u` can stage TRACKED paths only. That is
  the reasoning `.gitignore` records for the 10 Aug `oura_auth_state.json` entry. Anything new on
  the bus must be ignore-checked, not assumed.
