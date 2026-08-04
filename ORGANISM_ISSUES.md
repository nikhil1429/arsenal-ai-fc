# ORGANISM — THE ISSUES

**106 issues. No solutions in this file — that is deliberate.**

Found by two adversarial audits of a live personal AI system (Arsenal AI FC): 6 organ systems
(55 agents), then 6 previously unaudited areas (105 agents). 10.5M subagent tokens, 3,084 tool
calls. Every issue below survived a verifier that was instructed to REFUTE it; 10 claims did
not survive and are not here.

## How to read the tags

- **[code]** — fixable in the repo
- **[captain]** — only the human can do it (a login, a phone setting, a decision, a ritual)
- **[time]** — genuinely needs calendar days or more of his reps; no code shortens it

## Four constraints any solution must respect

1. **Never set a numerical limit by guessing.** Open it, measure 30–45–60 days, set it from
   data. Two exceptions: a safety net at the real plan wall (it resets weekly, so one runaway
   night costs the week), and failure guards — which are not budgets; they stop one identical
   failure repeating forever.
2. **Run HOT.** The captain's standing order: exhaust the Claude Max 5x plan every rolling
   window and every week. The target is never fewer tokens — it is **more thought per token**.
3. **Never delete an organ because nobody reads its output. Give it an address.** A job must
   declare the surface its output appears on, or it does not get scheduled.
4. **Automate the friction, protect the baking.** Anything he has to remember is a design
   defect, not a discipline problem. ADHD-PI, diagnosed and medicated.

## The one measurement that frames everything

```
Last 7 days: 178 calls · 8,516,836 tokens
  cache_read  (CLI boot tax)   4,262,616   50.0%
  cache_creation               1,214,621   14.3%
  unattributed (pulse rows)    2,734,788   32.1%
  input  (the actual question)     1,084    0.01%
  output (actual generation)     303,727    3.6%

  per call: 47,847 total · 23,947 boot tax · 1,706 generated
```

**96% of every call is the machine loading itself. 3.6% is thinking.**
The cost is per-CALL, not per-thought. Any solution that ignores this makes every other fix
roughly 5x more expensive than it needs to be.

## Confidence gap — read this before acting

14 issues in the **FORGE / REPS / SCHEDULING** area did not complete adversarial verification
(the plan's session limit was hit mid-scan). They are included because the scanner produced
evidence, but they carry **lower confidence than the other 92 and must be re-checked first.**

---

## 2. THE COMPLETE ISSUE LIST

**TOTAL: 106 issues.**
Tags: **[code]** Claude does it · **[captain]** only he can · **[time]** genuinely needs calendar days.

*(Not counted here, but assumed landing in parallel: the 10 already-in-flight items — the ntfy morning push gate, the manager's "invented number 90" contradiction, the missing absence alarm, the ledger dropping `runJob`'s note, the 5 haiku_pulse bleeds, and the 15-task morning catch-up burst + order inversion. Two sequencing constraints appear at #46 and #63.)*

### A. THE NUCLEUS — salience, pulse, dreams (11)

1. `self` fires only on `modality === "voice"` — 119 typed doubts scored zero, and every one of the 756 genuine Claude Code moments is arithmetically incapable of reaching tier 0. **One wire, three cuts:** `thalamus.mjs:218` (self gate), `thalamus.mjs:172` (`deriveVoiceTokens` voice-gated → no tokens → nov 0 → stalls at 0.45), `nightshift.mjs:484` (pre-answer corpus voice-filtered). Gate on **provenance** (`source ∈ {voice, claude-code, organism-memory}`, never `claude-code-teaching`), not modality. **[code]**
2. The haiku pulse's mathematical ceiling is **0.24375** against `tau0 = 0.25` — 853 calls, 124 escalations, 124 of 124 stuck at tier 0. Fix in order: (a) a real `pulse:*` entry in `thalamus_config.json:27-29` `base_rates` (default 0.5 makes a rare event maximally unsurprising — backwards); (b) #3; (c) only then a weighted pulse term **well below** self's 0.45. Do **not** set `self=1` (→ S 0.694, instant Opus wake on 74% of escalations vs a 15/day cap). Do **not** touch habituation — `brain.mjs:349-353` already keys per-concept. **[code]** *(= captain #9, corrected)*
3. `brain.mjs:354` builds the pulse's `concept_tokens` from the first 4 words >3 chars with no stopword filter → `pulse:need`, `pulse:isko`, `["what","left","part"]`. The only component carrying the pulse's score is noise. **[code]**
4. doubtminer's mined lexicon is filler n-grams. **[code]** *(captain #11)*
5. `lexicon_mine`'s dead regex + its output unwired from `buildFingerprint`. **[code]** *(captain #10)*
6. The DMN's nightly precache can never match: `presence.mjs:89-94/:292` puts **window-title words** into a field named `concept_tokens`, and `thalamus.mjs:607-619` joins on them — 0 of 95 stalls matched. Canonicalize `hintWords` through the `dossierKey()`/`conceptRegistry()` filter the same file already owns at `:677-679`, and fall back to `sprint.json`'s current concept (`working_set.concept_in_motion` overlaps nothing today; sprint does). **[code]**
7. DMN spend is invisible to the brain budget — `dmn.mjs` calls `claudeGenAsync` directly, so ~57 `claude -p` calls a night appear in 0 of 2,825 `brain_ledger` rows. **[code]**
8. A Claude-side `claude -p` error is recorded as a **Gemini 429** on five tanks: `claudegen.mjs:19 LIMIT_RE` over-matches (it fired on a `stop_reason: stop_sequence`), `dmn.mjs:253/:297` calls `record429`, `fuelboard.mjs:96` turns a transient throttle into dead-till-local-midnight. The DMN was down ~22h reporting a false reason, and `dmn.mjs:61/:235` discard the error text so there are no forensics. **[code]**
9. Expired `whisper` / `pre_answer` / `bg_hint` / `mouth_hint` are carried forward and rebroadcast on every moment (`thalamus.mjs:606, :626, :642, :657`) — a pre-answer whose 3-minute window closed two days ago is still in `workspace.json`. Seed a stale pre-answer into the selftest rig at `:1216`; the carry-forward path is untested. **[code]**
10. Thalamus, Cortex, BrainDaemon and Turnstile all run under `setup/hidden_run.vbs` with no redirect. The only diagnostic that exists nowhere else is `thalamus.mjs:540`'s moment-loss reason — added by a prior audit precisely because a loss had no log — plus the whisper/pre-answer attach flags, which is why "has the pre-answer engine ever fired?" is unanswerable. `ArsenalFC-Goalkeeper` already redirects under the same cloak. **[code]**
11. Habituation baseline — **not a fix**. `hab` has never demoted a single moment across 5,282 rows; the proposed re-keying is a measured no-op. Re-measure the component distribution *after* #1–#3. **[time]**

### B. HIPPOCAMPUS — what actually reaches a session (9)

12. `identity_facts.json` holds two 17 Jul facts injected unconditionally in the slot labelled ALWAYS present — one of them a literal instruction to explain everything to a person absent from the record for 15 days. `hippocampus.mjs forget fb5d5a86` / `88e5349a`. **[captain]** *(Law 4)*
13. `hippocampus.mjs:264` renders `- ${f.text} [${f.id}]` — the stored `ts` is silently discarded, so a 17 Jul assertion is indistinguishable from today's at every consumer. That undatedness *is* the bug. **[code]**
14. `get_context` carries no teaching card — `mcp-memory.mjs` has no `loadTeachingCard`, while `learnstate.mjs:76-87` does. CLAUDE.md mandates `get_context` as *the* session-start call, so that is the exposed door. **[code]**
15. `whoCartridge` (`hippocampus.mjs:326`) asserts "WHO HE IS **RIGHT NOW**" with no age degradation; a 10-consecutive-day stale window reproduces from the real episode/dugout history. Two live consumers: `dugout.mjs:787`, `mcp-memory.mjs:202`. `tone.mjs:101` is the pattern to copy. **[code]**
16. The narrator-voice guard (`hippocampus.mjs:162`) requires a closed verb enumeration, so "He flagged…" and "Captain asked…" slipped through — 2 of 8 cartridge slots (**2 of 6** in the SessionStart brief) are the coach's own error, tagged `kind: "doubt"`. Widen to match the leading third-person *subject*. **[code]** guard · **[captain]** to remove the two rows.
17. `gatherDayMaterial` (`hippocampus.mjs:281-293`) sees only episodes + dugout `CAPTAIN:` lines + calibration; both surfaces are dry, so `who_he_is` freezes. **Do not pipe raw claude-code rows** — measured, 21 of 24 pass `recallWorthy` and fill 7,400 of a 12,000-char budget with exactly the machine-building talk `hippocampus.mjs:298` bans. Needs a learning-arc filter or a cheap auto-capture. **[code]**
18. No involuntary per-turn recall on the surface he uses. `recallReflex` has one caller, `dugout.mjs:2928`, gated `body.modality === "voice"`. Any hook must be non-blocking (`afferent-post.mjs:71`'s 250 ms law — the embed ladder can block ~150s on a dry pool) and must not let `bumpRecall` write from a hook. **[code]**
19. `recall_index.jsonl` has no typed-input source (`dugout.mjs:437-448`). Backlog is **zero** and the merged corpus `recall()` searches is still growing, so this is optional — and any wiring needs a tighter filter than `recallWorthy`. **[code]**
20. CLAUDE.md still states the SessionStart brief "does not touch the hippocampus" — false since commit `f2c8ebc` (31 Jul), which wrote that sentence and closed the gap in the same commit. **[captain]** *(canonical file)*

### C. CONTEXT / DISTILLER (2)

21. The distiller's 25-row window is **84% window captions**, and its deterministic floor sets *both* `concept_in_motion` and `where_left_off` from `stream[last]` — a window title in 62% of windows. Live right now: `"claude.exe · Claude"`. Cuts: `distiller.mjs:28` (drop `"context"` from `INTERACTIVE`), `:73/:75` (floor), `:128` (per-slot merge means the floor leaks on *healthy* runs too). Keep `"context"` in `brain.mjs:366` — that consumer wants it. This feeds `get_context` and the SessionStart brief. **[code]**
22. `context.mjs` spawns `cmd`+`node` 1,440×/day for ~145 emits with a score ceiling of 0.044. `node scripts/context.mjs daemon` already exists. **[code]**

### D. FORGE / REPS / SCHEDULING (18)

23. Close the open forge session: `node scripts/forge_session.mjs close`. Verified reachable — `close` deliberately uses `need()` not `live()` (`forge_session.mjs:938-941`). Yields 3 reps → 12 → `learning_state` crosses `warming_up_min_reps`. **[captain]**
24. `reps_log.ts` is authored by the model, not observed — four reps share the millisecond `.795`, three exactly 1000 ms apart. `forge/SKILL.md:118-130` makes the model write it; `capture.mjs:143-146` never stamps a clock. FSRS *difficulty* is unaffected (rating-driven); *stability* is (0.0265 vs 0.3760 at honest spacing). **[code]**
25. `capture.mjs pull` doesn't chain the heartbeat, so a rep pulled at 14:00 leaves cards/calibration/learning_state/nemesis stale until 08:39. Copy `turnstile.mjs:175`'s `execFile`. **[code]**
26. Live-session reps captured immediately. **[code]** *(captain #12)*
27. `learning_state.axes[]` and `core_vs_light` are recomputed daily and read by **nobody**. `manager.mjs:245/:247` lift them and neither `assemblePrompt` nor `fallbackSkeleton` prints them. `python_fluency` is `{}` (all 9 reps concept-track) — leave dormant, don't wire. Unmasks in 3 reps when `okLS` flips. **[code]**
28. `manager.mjs:164`'s justification for the `okLS` gate is false — `learning_state.mjs:516` emits `axes` unconditionally; only `weak_connection` and `maidan_stage_focus` are suppressed at `:519`. **[code]**
29. `learning_state.position.last_closed` is computed session-open-independently *on purpose* (`learning_state.mjs:235-247`) and has **zero consumers**; `brain.mjs:758` drops the whole block for a stale session. Wire it into `buildFingerprint`. **[code]**
30. Forge boot suppresses the last session's coverage line whenever any session is open (`forge_session.mjs:522` returns at `:530-537`). Net-new today is one repetition count — fix via #29, not by breaking the selftested 2-line cap at `:811`. **[code]**
31. Nemesis evidence collapses to indistinguishable strings — live `["07-31 relapse","07-31 relapse"]` for two different reps on two different axes. `nemesis.mjs:252` has `axis` in hand at `:171` and throws it away; `modeAxis:176-181` then reports "axis a keeps breaking" for a 1-1 a/c split. **[code]**
32. `setpiece.mjs:252` reads `wk.headline.recurrence`, a field `nemesis.mjs:284` has never emitted → `drills.json` ships `"source": "nemesis headline ×?"` on **every** run (the `axis_pattern` branch is gated at reps ≥ 20, so the broken branch is the only one that has ever run). Fixture at `:466` invents the shape; no assertion touches `source`. **[code]**
33. `capsule_bridge.fsrsDueConcepts` picks arrays out of `cards.due_today`/`cards.overdue`, which `fsrs.mjs:190/:210` writes as **integers**; the names live in `hardest_due`. Reports total disagreement every day, can never report agreement, and names three concepts "FSRS quiet" that FSRS lists as due. Zero runtime consumers — fix it *and* give it one, or delete it. **[code]**
34. FORGE_SPEC's **GATE 2** (cold-reader verify at LOCK/SAVE) exists only at `FORGE_SPEC.md:128/:165` — `.claude/skills/forge/SKILL.md` step 10 transcribes GATE 1 and stops, and that skill is the only artifact loaded at a lock. **16 of 112** live doubts violate the spec's own named patterns, and all 16 are queued in `tape_room.json` as verbatim rematch prompts (`doubtminer.mjs:210`). Flag in doubtminer (it already iterates nightly and owns the queue). **[code]** flag · **[captain]** repair via the gist.
35. `course.mjs` — 670 lines, one day old, zero callers, `course.json` never created, and `sprint.json.next_up` is 1-05/1-06, both course-track (9 chapters). Verb is `ingest`, not `paste`. Consumer must be a **reader** (learnstate/dugout), never `sprintsync` — `sprint.json` is Sheet-driven and single-writer. **[code]** wire · **[captain]** chapter list.
36. The examiner stages a drill nightly at 21:55 that only a hand-booted dugout at `?mode=scrimmage` reads. No scrimmage of any kind has ever been played (0 rows in `dugout_scrimmage.jsonl`, 0 reps tagged scrimmage). The live drill is also incoherent — the `implement` template was handed a non-implementable concept. **[code]** + **[captain]**
37. `shadow.mjs:196` tests `s.trigger_met`; `scout.mjs:81-85` emits `{kind, trigger, brief}` and has never emitted that field — `staged_scrimmage` reads false even after the scout genuinely stages one. **[code]**
38. The teaching contract's turn clock is anchored to the **forge** session, so on non-forge days it accumulates across sessions; once past `context_warn_at: 40` it warns on turn 1 of every fresh empty session forever. Add `teaching_contract.mjs reset-turns` to the SessionStart hooks array. **Do not** make a null anchor reset — that pins the counter at 1 on exactly the days the warning matters. `teaching_contract.mjs:125-129, :174-179, :287`. **[code]**
39. `teaching_contract.mjs:144` `slice(0, 5)` truncates from the **tail**: at `show_n=3` the CONTEXT WARNING dies, at `show_n=4` the link-back dies too. The anti-wall selftest at `:217-225` asserts the length of a value it just sliced — it cannot fail. **[code]**
40. Nothing produces teaching-drift `hit`s — all 5 `last_hit` stamps are a 402 ms seeding burst on 31 Jul — so `forge_session.mjs:345` will print "TEACHING DRIFTS THIS SESSION: none" forever: an unmeasured silence rendered as a measured zero, in the report whose own comment at `:323-324` bans that class of lie. **[code]** honesty guard · **[captain]** who may record a drift.

### E. SCHEDULE, TASKS, POWER (11)

41. Register the Morning-Conductor. **[code]** *(captain #22)*
42. Disable the 14 replaced tasks. **[code]** *(captain #23)*
43. Wake-test, then WakeToRun on ~3 wake points. **[code]** *(captain #24)*
44. Windows power settings — sleep, wake timers, hibernate-after never. **[captain]** *(captain #25)*
45. Fix `ArsenalFC-SelfKnowledge`'s un-runnable task settings. **[code]** *(captain #29 — see #46 first)*
46. `selfknowledge.mjs` writes an 88,950-byte `organism_self.md` whose **only two consumers were deleted on 29 Jul** (`dugout.mjs:1280, :1323` are tombstones). Its one scheduled firing exited 1 with 0 tokens. #45 and the in-flight stderr fix would **arm** a weekly ~29k-token Opus call with no reader, outside `brain_config`'s budget gate. **Disable before those land.** **[captain]** decision · **[code]** freeze.
47. Enable the TaskScheduler operational log. **[captain]** *(captain #30)*
48. Unsubscribe the phone from the old guessable ntfy topic. **[captain]** *(captain #28)*
49. `heartbeat.mjs:41-51` `DEFAULTS.order` has 6 entries; `heartbeat_config.json` has 8. A corrupt or missing config silently drops **capsule_bridge and shipped** — the only two organs with no independent automatic path — and prints "6/6 organs beat … all ran". The selftest at `:245` pins to DEFAULTS, so the drift is invisible to the suite. **[code]**
50. Presence `calibrate` is a **monotone ratchet**: `presence.mjs:50` builds the calm set from rows whose `edge` label was frozen by the previous fit (`:281`), and `:47` reads the whole log with no window. Leave-one-out proves **100%** of the 6.1→7.4 climb is feedback, 0% behaviour. Fix: relabel from the factory SIGNATURE + add a recency window. The "cap at 1.5× factory" idea is wrong — 1.5×30 = 45, below the already-fitted 53. **[code]** — *fires 03:30 Sunday.*
51. `presence_log.jsonl` is unbounded with five whole-file readers (`presence.mjs:47`, `brain.mjs:367`, `distiller.mjs:136`, `dugout.mjs:1083`, `brain.mjs:803`). ~6.7 MB/yr. Monthly roll + update all five. **[code]**

### F. VOICE, PRESENCE, PROACTIVITY (7)

52. Shadow `score` has **no automated caller** (only `postmatch.mjs:269`), so `proactivity_ledger.json` has never existed and the earned-voice gate can never open. **CRITICAL:** `shadow.mjs:216` selects every unresolved row ever while `:219-226` builds facts from **today only** — date-scope the scorer *before* any catch-up run, or the first five verdicts are fabricated. Also move `detect` off `dugout.mjs:2816`'s `setInterval` so shadows aren't sampled only on days he opens the bridge. **[code]**
53. Reminders fire only while the dugout window is open — `dugout.mjs:2813` is the only caller and there is **no headless entry point** (`main()` handles `selftest|index|mint-probe`). The promise at `dugout.mjs:775` is unconditional. `fireReminders` speaks via `say()` directly, so an out-of-process runner loses nothing. **[code]**
54. `dugout.mjs:1095` reports `presence_passes_today: presence.length` — `presence.mjs` appends two rows per pass (`:294` thrash, `:308` focus), a perfect 2:1 on every day. Fix: `presence.filter(r => !r.kind).length`. Do **not** touch `stall_edges_today` on the same line. **[code]**
55. `speak.mjs:9` names `SPEAK.ps1` "the scheduled-utterance lane"; there is no `ArsenalFC-Speak`, and `SPEAK.ps1` calls `System.Speech` directly — bypassing the neural engine — reading a `team_sheet.md` that says "I don't know you yet". Fix the header; treat `SPEAK.ps1` as an orphaned pre-neural duplicate. **[code]**
56. `nightshift.mjs:483-484`'s pre-answer voice corpus empties on the **7 Aug** run and `:724` records nothing about corpus composition. Report "0 voiced turns in window". **[code]**
57. `dugout.mjs:2873`'s POST `/tool` router has **no Origin/Referer/content-type check**; the guard exists only in the dead fork at `organism_live_demo.mjs:1250-1260`. The LAN gate at `:2833` is unconditionally true in default mode, and `/tool` handlers shell `capture`, `postmatch`, `bootroom`, `doubtminer`, `hippocampus`. **[code]** — security.
58. `organism_live_demo.mjs:3` still names itself `dugout.mjs`. One-line header fix. **Do not delete** — sandboxed at `:64-72` by a prior audit's explicit decision, and CLAUDE.md's layering law. **[code]**

### G. THE BRAIN — spend, validators, honesty (22)

59. `allowedNumbers` exists **three times**; only `manager.mjs:285-320` carries the 25 Jul fix. `brain.mjs:517` and `viz.mjs:131` still whitelist every integer 0–31 **and** strip dates and clock times (`brain.mjs:522`, `viz.mjs:138`), so `"cards due: 12 (+9 overdue)"` — the exact string `manager.mjs:312` names as the reason the fix exists — passes on all six `no_new_numbers` jobs, including both mp3s and `day_cartridge`. Export from manager, import in both; **thread `shown` through `validateOutput` in the same change** or you recreate the "invented 90" bug inside brain. No existing fixture needs loosening. **[code]**
60. The same validator splits comma-grouped thousands (`brain.mjs:522`, `viz.mjs:138`) — `"10,000"` → `["10","000"]`. Use `/(?<=\d),(?=\d)/g`; the naive `(?=\d{3}\b)` form breaks Indian lakh grouping. Only 2 confirmed rejections, both plausibly genuine — hardening in the same edit. **[code]**
61. `brain.mjs:536`'s `quotes_only` pairing regex puts the ≥12-char floor **inside** the pair matcher, so any anchor shorter than 12 chars desyncs the pairing and captures annotation text as a quote. `lexicon_mine` is **0-for-115** (548,556 tokens in 7 days) and unwinnable, because his own lexicon holds `"one picture"` (11), `"tera finops"` (11), `"naya sawaal"` (11). Pair sequentially. **[code]**
62. `brain.mjs:526-528` applies the hype-phrase guard to machine-side analysis jobs, where "exponential" is real vocabulary (softmax *is* an exponential) and the substring match also catches "exponentially". 12 rejections, 185,983 tokens. Add an opt-out flag; drop "exponential". The proposed `job.speak_to || validate==="no_new_numbers"` gate is wrong — it would strip the guard from `evening_voice`. **[code]**
63. Eight-to-ten brain jobs write to `brain_out` dirs no line of code opens — **2,865,782 tokens all-time**, ~3.27M of the last 7 days' 8.25M. `midday_reread` alone ate 560,465 of an 800,000-token window for a file with no reader, while `formation_read` (the sheet, priority 100) got 103,010 all week. Four of them (`doubt_clusters`, `widget_spec`, `market_scan`, `drill_forge`) are **designed** to be human-read and say so in config — their defect is that no surface points at the file, which the in-flight "ledger drops `runJob`'s note" fix half-closes. **Land those two together.** **[code]** disable · **[captain]** which get a surface.
64. `deep_reanalysis` + 7 *enabled and running* jobs declare inputs that don't exist; `gatherInputs` (`brain.mjs:797-808`) maps them to `null` with no warning and `:787` renders the literal `null`. `teamtalk_am` runs at 3/4 absent, 85 times. **Do not** use a majority-ratio guard — it misses `deep_reanalysis` at exactly 50% and would kill `teamtalk_am`. Per-input `required` flag + record the absent count in the ledger row. **[code]** *(= captain #13)*
65. The night shift stamps `poster` / `gemini_wall` / `wall_insights` with `shiftDay` (`brain.mjs:441-446` → **yesterday** for any overnight job before 07:30) while `viz` reads calendar today (`viz.mjs:618/:647/:666`). Four successful render nights (~675k tokens/wk) landed in filenames viz can never open; `club/poster.svg` and `wall_gemini.html` frozen at 21 Jul. **Fix at the producer:** add `"serve":"next_morning"` to the three jobs and change `brain.mjs:885` to `serveDate(job, now)` — the mp3 lane already proves this works. Do **not** add a viz lookback; it fights `posterFlag`'s freshness law. **[code]**
66. Remove the guessed budget caps; MEASURE only. **[code]** *(captain #18 — exceptions: the plan-wall safety net and failure guards)*
67. Halve the pulse frequency, double its window. Frame as a measurement window, not a guessed cap. **[code]** *(captain #19)*
68. `pulse.json`'s `status` / `low_confidence` are string literals (`heartbeat.mjs:191-192`); `buildPulse` ignores the `agents` array on the next line, and its own selftest builds a pulse reading `"ok"` from 1-of-3 organs. No deterministic consumer, but three enabled LLM jobs ingest the raw object. **[code]**
69. `loop_vitals` `status`/`low_confidence` are literals too (`physio.mjs:417-418`), sitting above a populated `bleeds` array — and `talk.mjs:44` clips the first 400 chars, which is exactly `"status":"ok"` *plus* the bleed. **Delete both fields** (zero readers) or project in `talk.mjs`; do **not** invent a `"bleeding"` enum value into a vocabulary `manager.mjs:159/:167` pattern-matches. **[code]**
70. Physio's false `emitted_unconsumed` alarm. **[code]** *(captain #15)*
71. Cortex ConceptGraph's silent no-op. **[code]** *(captain #14)*
72. `concept_graph.json` — `ArsenalFC-ConceptGraph` runs nightly at 03:00, succeeded today (4,185 tokens, 38 nodes / 60 edges), and **zero lines of code read it** (`cortex.mjs:770` is the write). Wire it (setpiece is the natural reader) or stop paying. **[code]** + **[captain]**
73. The Wind Tunnel writes `gate_tune_<date>.md` nightly with no reader — and prints **"GATE HEALTHY"** for a gate running at 0.43 wakes/day against its own `[1,8]` band, because hysteresis compares the grid to a baseline the grid cannot beat. Its proposal rides the Boot Room's mutation grammar but its target (`thalamus_config.json → tiers`) would be **rejected** by `validateMutation`, so any surfacing must be presentation-only. `nightshift.mjs:711-720, :312`. **[code]**
74. `selfknowledge.mjs:108` swallows stderr. **[code]** *(captain #16 — sequence after #46)*
75. 9 selftests are in no suite. **[code]** *(captain #17)*
76. Three selftest assertions cannot fail: `dugout.mjs:1689` (`x || true`), `throwin.mjs:256` (literal, and redundant — `:253` already covers it), `conductor.mjs:200-202` (literal, and the block **never calls `armTrigger`**; `before` is a dead read). Verified: `armTrigger` genuinely merges and the selftest genuinely writes nothing — this is a regression net, not a live defect. **[code]**
77. `package.json:17` now runs `conductor.mjs selftest` and `scripts/conductor.mjs` is **untracked and not gitignored**. A selective commit (`git commit -am`) reddens every push and the nightly away-day. `limits.mjs` has zero importers and cannot redden CI. **[code]** — *next commit.*
78. `limits.mjs`'s twin mapping. **[code]** *(captain #21)*
79. `.gitignore **/readiness.json` + `**/intake_log.json`. **[code]** *(captain #20)*
80. Decide on the medical lines in the public repo. **[captain]** *(captain #31)*

### H. OUTPUT SURFACES — the wall, the sheet, the desktop (18)

81. Run `/full-time` once. Creates `post_match/<date>.md`, `season.json`, `notebook.json`, `routed_balls.json` — unfreezing the matchday counter and phase ladder (`manager.mjs:146-148/:189/:91-96`, today permanently "Matchday 1 · Introduction / I don't know you yet"), the KAL→KICKOFF weld (`manager.mjs:71/:186`), viz's `kal_line` and `commitments` (`viz.mjs:579-583/:601-614`), the scorer's second witness (`scorer.mjs:508-521`), and shadow `score`'s only caller. **The pipeline is proven, not unbuilt** — it ran end-to-end once, 12 Jul, and lives in a vault. **[captain]**
82. `WALLPAPER.ps1:31` prints `"KAL > one green ball, first thing."` in the slot reserved for **his own words** — and `postmatch.mjs:227`'s no-answer default is the *same sentence*, so a real declined run is indistinguishable from never-run. Make the fallback read as an invitation and break the collision. **[code]**
83. `season.interview_dates`, `trophy`, `target_ship`, `paused_until` have **no writer anywhere in `scripts/`** — `postmatch.mjs:94-103` writes only `season_day`/`matches_played`/`last_result`/`last_played`. The scout's war-room taper (`scout.mjs:131-142`) can never activate and `days_to_ship` stays null even after a clean `/full-time`. **[captain]** — does the war room exist, or does the doc line go?
84. `renderSeason` (`viz.mjs:180-195`) is the only data panel with no `awaiting()` branch, and `viz.mjs:89-90` collapses "file absent" to the same value as "measured zero". Every number shown today is *accurate*, so this is hardening against a silent ledger death, not a live lie. **[code]**
85. `viz.mjs:71-74` computes "weekly consistency" as `struggle !== "no_data"` over the last **7 rows** (not 7 days — the window spans 9 calendar days and silently drops the 3 with no row). Reads **14%** for a week with 225 wall-minutes across 5 days; printed **0%** on every film kit 17–31 Jul. Compute from `wall_minutes > 0` (6/7 today). Reaches `wall.html`, `wallpaper.png`, the film kit, and the spoken brief. **[code]**
86. `viz.mjs:662` flags the Gemini render with a bare `existsSync` on a fixed undated filename nothing ever unlinks — the button is live **today** pointing at a 21 Jul artifact — and the assignment runs *before* the fold at `:669`, so it is a one-render-lagged check. `posterFlag` at `:335` is the working pattern. **[code]**
87. The drill packet reaches every scheduled surface stripped of content: `viz.mjs:106` maps each drill to `{kind, emoji}`, so `wall.html` literally renders `"🔵 recall"`. Meanwhile **10 of 10** matured gaffer bets are misses because setpiece bet on `inference` (30 days "overdue" with **zero reps ever**) while `sprint.json`'s current task is Hallucinations — the only thing he actually studied. Carry `concepts` to the wall **and** reconcile setpiece's selection against sprint. **[code]**
88. `viz.mjs:81-82` buckets "overnight" *after* the same-local-day filter, so last night's 22:00–23:59 — the single busiest hour in the ledger, 987 of 2,833 rows — can never appear on the 08:50 wall. Measured undercount on 26 Jul: 221 shown vs 478 real. Also feeds the `wall_insights` and `wall_review` prompts. **[code]**
89. `viz.mjs:287` `ship()` fires an async clipboard write and opens the destination unconditionally. Keep `window.open` **synchronous** (popup blocker), attach `.catch`, surface the failure — the raw-kit link is already in the same panel. **[code]**
90. `wall_data.json` carries a full stale copy of itself in `media.veo_text` plus `media.filmkit_text`; both are dead fields (nothing reads them back) and both are inlined into two nightly prompts. Move `writeAtomic` above the assignments at `viz.mjs:660-663`. **[code]**
91. `.claude/skills/matchday/SKILL.md:20-21` — `start dressing-roomclubwall.html` (backslashes eaten at write time by commit `34561e8`, a commit that was *fixing* skill bugs) and a fallback `club/wall.html` that does not exist from repo root. **[code]**
92. `mirror_config.json`'s `ids` is a hardcoded 4, duplicated in `mirror.mjs:40` DEFAULTS; no gist enumeration, so a fifth locked capsule is invisible while `mirror.mjs:114` still reports `"ok"` (which is `okCount > 0`, not "all"). The Gist API needs no credential. Three touch points including `dugout.mjs:814`'s hardcoded prose. **[code]**
93. **No health surface reads tank state** — `/organism-doctor` never touches it, `physio.mjs` and `viz.mjs` have zero "tank" hits, and T1/T2 are COLD right now. Read `tanks.json` or the exported `summary()`; do **not** call `fuelboard.mjs status`, which read-modify-writes `tanks.json` under the lock. **[code]**
94. `ORGANISM_ANATOMY.md:383` / `ORGANISM_LEDGER.md:211` list groundsman as BUILT and describe it as "ephemeral data cleanup"; it is a dormant two-node bus-lease arbiter + publish-allowlist push gate, M9-pending. Wrong status *and* wrong function. **[code]** doc.
95. `ORGANISM_ANATOMY.md:126` says `trust_tiers.json` is "consumed by the sheet" — `assemblePrompt` never reads it, and `dressing-room/manager/system.md:528-543` already records the correction. Separately, `trust_tiers` carries 5 `first_focus_by_0930` rows at hit_rate 0 from a market with **no producer**. **[code]** doc + purge.
96. `scorer.mjs:504` counts distinct **concepts** into a Set and `:93` renders it as `"N rep(s)"` — 7 reps on 31 Jul printed as `"1 rep(s)"`, wrong on **both** populated days. Keep the Set for `gafferMature`'s membership test at `:185-186`; add a parallel row counter with identical null semantics. Five brain jobs ingest `slip.jsonl`; `evening_voice/2026-07-31.md` quotes the wrong number verbatim. **[code]**
97. `shipped.mjs:122-124` filters by committer date and prints `%aI` (author date). Currently inert — `summarise()` drops the field. `%cI`, or delete the field. Note: `--date=author` is not a thing. **[code]**
98. The Boot Room's weekly console line vanishes into a closing cmd window; the gate state is already in `loop_vitals`, so only `bootroom.mjs:151` (gate-open-but-no-evidence) and `:310-314` (`extended`) lose information. Cohort issue: `INSTALL_TASKS.ps1:13-19` gives ~35 tasks no redirect. **[code]**

### I. THE UNGATE — have/need from rep 1 (8)

99. Calibration speaks from rep 1 with its n shown. **[code]**
100. Nemesis speaks from rep 1 with its n shown. **[code]**
101. Learning-state speaks from rep 1 with its n shown. **[code]**
102. Boot room speaks from rep 1 with its n shown (9/200, and it does not propose). **[code]**
103. Apni ghadi speaks from rep 1 with its n shown. **[code]**
104. Signal table speaks from rep 1 with its n shown. **[code]**
105. Twin speaks from rep 1 with its n shown. **[code]**
106. Every status line becomes a have/need counter instead of the word `"warming_up"`. **[code]**

---

---

# THE TRAPS

### Do not do these the obvious way

Several verified fixes are actively harmful in their first-proposed form. Recording them so the work does not create new defects:

- **Do not** set `self=1` on the pulse (#2) — S 0.694, an Opus wake on 74% of escalations against a 15/day cap.
- **Do not** run shadow catch-up scoring before date-scoping (#52) — the first five ledger entries would be fabricated from a day the shadows did not happen on.
- **Do not** add a viz-side lookback for the renders (#65) — it fights `posterFlag`'s freshness law and would serve a two-day-old poster as today's.
- **Do not** use a majority-ratio guard on absent inputs (#64) — it misses `deep_reanalysis` at exactly 50% and kills `teamtalk_am` at 75%.
- **Do not** make a null anchor reset the turn clock (#38) — it pins the counter at 1 on exactly the non-forge days the warning matters.
- **Do not** budget the distiller window without fixing the deterministic floor (#21) — the floor is the part that fails 62% of the time.
- **Do not** gate the hype guard on `speak_to || no_new_numbers` (#62) — it strips the guard from `evening_voice`.
- **Do not** delete `talk.mjs` — `dugout.mjs:2618` points at it at the exact moment the primary voice fails, and the selftest only checks for the *string*, so the dead pointer would stay green.
- **Do not** `git rm` the demo fork (#58) — CLAUDE.md's layering law and a prior audit's explicit sandbox decision.
- **Do not** re-fix `allowedNumbers` twice (#59) — de-duplicate, and thread `shown` in the same change.
- **Do not** invent a `"bleeding"` enum for `loop_vitals.status` (#69) — `manager.mjs:159/:167` pattern-matches that vocabulary; delete the field instead.
- **Do not** touch `capsuleSeedReps` — verified correct; a status gate on `"tempered"` would drop any capsule scored `"tempered-90"` and silence the decay guard on ground he has mastered.
- **Do not** add a wall panel for throw-ins and notes — they are already read by the twice-daily digests and by the semantic recall index; a top-scoring hit reproduces at 0.82.
- **Do not** widen `self_markers` yet — 7 of 271 voice turns match, and the one genuine miss is a Hindi particle infix (`समझ ही नहीं` breaking a contiguous-substring test), not a vocabulary gap. The channel is dead, not the filter.

---

**One last honest note.** The Re-Jirah counter, the wake bar, the forge close path, the capsule seeder, the config loaders, and the throw-in poller were all suspected and all cleared. Six things that looked broken are working. That is the same kind of data as the 106 that are not — and it is worth saying, because a plan that only lists cracks describes a machine that does not exist.

---

# EVIDENCE APPENDIX — 74 verified findings

Raw evidence for each confirmed finding: what was observed, and what it costs. `kind`
separates **broken** (defective) from **unwired** (works, reaches nobody), **starved**
(correct, no input), **waiting** (gated by design), **lying** (reports success falsely), and
**dead-code**. The distinction matters — an organ built for 200 reps holding 9 is not broken,
and must not be "fixed".

---

### 1. `learning_state.axes[]`, `python_fluency` and `core_vs_light` are computed daily and rendered on no surface

`unwired` · `yellow` · area `rep-pipeline` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\learning_state.json (axes[]) · C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\manager.mjs:245-247

**Evidence**

> learning_state.json ships a full per-axis rollup: axes[] = [{axis:"a", label:"kya+analogy", fluent_frac:0, counts:{learning:2,held:0,fluent:0}, due_count:1}, ...] for a, c, d, e. `grep -rn "\.axes\b" scripts/` excluding the producer and unrelated `reg.axes`/`j.axes` uses returns ZERO readers. python_fluency and core_vs_light are lifted into F.formation at manager.mjs:245 and :247 and then appear in neither assemblePrompt nor fallbackSkeleton (grep for either name in manager.mjs returns only the lift, the selftest fixtures at :565/:581, and one selftest assertion at :635). viz.mjs's wall bus reads learning_state but never touches axes/python_fluency/core_vs_light.

**Impact**

> The 9-axis model is the spine of THE METHOD, and the per-axis view of his fluency — computed correctly, every day — is visible to no human and no LLM. This is the repo's own audit finding #6 from 2026-07-31 (dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md:81), still unfixed two days later.

---

### 2. Nothing recomputes the pipeline after the hourly capture pull — a rep ingested at 14:00 is invisible to every consumer until the next morning's heartbeat

`unwired` · `yellow` · area `rep-pipeline` · day-one fixable: yes
**where:** schtasks \ArsenalFC-CapturePull (hourly from 09:00) vs \ArsenalFC-FSRS/Calibration/Nemesis/LearningState (once, 08:40-08:44) · C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\heartbeat_config.json

**Evidence**

> schtasks: ArsenalFC-CapturePull runs `capture.mjs pull` at 09:00 with `Repeat: Every: 1 Hour(s)`. ArsenalFC-FSRS/Calibration/Nemesis/LearningState each run ONCE daily at 08:40/08:42/08:43/08:44, and heartbeat.mjs (08:39) runs the full ordered pass from heartbeat_config.json — capture pull FIRST, then fsrs → capsule_bridge → calibration → nemesis → learning_state. So the 08:39 pass is correctly ordered, but all fifteen subsequent hourly pulls have no recompute behind them. The paste path is fine — .claude/skills/forge/SKILL.md:131 chains `capture.mjs paste` → `heartbeat.mjs` explicitly — so this gap is specific to the pull path.

**Impact**

> Any rep arriving from the Colab inbox during the day sits in reps_log unconsumed for up to 24 hours: no card scheduled, no calibration update, no weakness detected, and the evening surfaces (setpiece 21:40, scorer 21:35, examiner 21:55, wall 22:00) all read yesterday's derived state. Today this costs nothing because the pull has never delivered a rep, but it is the exact latency the pull path was built to remove.

---

### 3. reps_log timestamps are authored by the LLM, not observed — four reps share the same millisecond and three sit one second apart, which FSRS replays as three zero-elapsed reviews

`lying` · `note` · area `rep-pipeline` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\reps_log.jsonl rows 3-6 · C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\fsrs.mjs:173

**Evidence**

> reps_log.jsonl rows 3-6: ts 2026-07-30T20:28:02.795Z, 20:28:03.795Z, 20:28:04.795Z and 21:58:02.795Z — four reps spanning 90 minutes sharing the millisecond .795, three of them exactly 1000ms apart. Rows 7-9 are 2026-07-31T14:36:00.000Z / 14:46:00.000Z / 17:48:00.000Z — round to the minute. capture.mjs:141 only requires that ts PARSES; the forge skill (SKILL.md:124) makes the model author it. fsrs.mjs:173 then does `card = f.next(card, new Date(r.ts), ratingOf(r))` for each in ts order, so rows 3-5 are three FSRS reviews with elapsed_days = 0 between them — which is precisely the failure mode capsuleSeedReps was patched to avoid for capsule dates (fsrs.mjs:138-147), left unguarded on the live path.

**Impact**

> The three axes probed in one sitting are replayed as three separate recall attempts seconds apart. Combined with the Pehle-Guess mapping, that is what drives hallucinations to difficulty 9.9 and stability 0.0265. The ts field is load-bearing for the entire scheduler and it is currently a guess.

---

### 4. Nemesis evidence strings collapse to indistinguishable duplicates

`broken` · `note` · area `rep-pipeline` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\nemesis.mjs:252

**Evidence**

> Live weaknesses.json: `"evidence": ["07-31 relapse", "07-31 relapse"]`. nemesis.mjs:252 builds them as `\`${localMmdd(m.ts)} ${m.type}\`` — day plus type only. The two entries are different reps on different axes (a at 14:36, c at 14:46), and the receipt cannot tell them apart. The selftest at nemesis.mjs:392 only asserts `evidence` is non-empty, so it never notices.

**Impact**

> The receipts are the thing that makes a weakness auditable rather than an accusation — "2× miss" is only defensible if the two misses can be told apart. As written, one rep logged twice and two genuinely distinct misses render identically.

---

### 5. The doubt detector is deaf to the only surface he still uses: `self` fires on modality "voice" ONLY, so 119 typed doubts scored zero

`unwired` · `red` · area `memory-layer` · day-one fixable: yes
**where:** scripts/thalamus.mjs:218 (`comps.self`), scripts/mcp-memory.mjs:157 + :194 (note routes as desktop-study)

**Evidence**

> scripts/thalamus.mjs:218 — `if (evt.modality === "voice" && text && cfg.self_markers.some(m => text.includes(m))) comps.self = 1;`
> 
> Measured over afferent.jsonl (3,104 rows):
>   voice afferents by day: {17 Jul:80, 18 Jul:133, 19 Jul:45, 30 Jul:13} — SILENT since 30 Jul
>   his typed prompts (modality "code", source "claude-code"): 463 rows, 46 on 1 Aug alone
>   of those 463, **119 contain a literal self_marker** from thalamus_config.json:
>     "i am confused, morning mein gaffer ko good morning kahu so he will tell me..."
>     "bhai i am not understanding what are you following to teach me..."
>     "i am confused, after every agents work will be completed then where are we standing??"
>     "kya bakchodi hain ye? i did not get it"
> 
> salience_ledger.jsonl, 5,267 moments: `self` component nonzero in **7 rows total (0.13%)** — all 7 voice, all before 19 Jul.
> MCP `note(kind:"doubt")` does not help: mcp-memory.mjs:157 posts `modality: "desktop-study"` — also not voice. All 6 desktop-study moments scored S=0.000.

**Impact**

> The single heaviest positive weight in the whole nucleus (self = 0.45, tied with err for highest) has been unreachable since 19 Jul. Every doubt he has typed in Claude Code for two weeks — including the four he named in his own words — entered the thalamus, was bound into a moment, and scored exactly zero. This is the mechanical reason his confusion never wakes the deep brain and never becomes a durable episode.

---

### 6. His entire Claude Code stream scores literally 0.000 — 3,024 moments, no exceptions

`unwired` · `red` · area `memory-layer` · day-one fixable: yes
**where:** scripts/thalamus.mjs:172 (deriveVoiceTokens gated to voice), :190-199 (pe needs a key code never has), hooks/afferent-post.mjs (emits no event_key)

**Evidence**

> Every `code` afferent has exactly five keys: `["modality","source","text","cwd","ts"]` (measured across all 768). No `event_key`, no `concept_tokens`, no `p_obs`, no `rep`.
> 
> That kills every component by construction:
>   pe   → thalamus.mjs:190-199 needs market_id, p_obs, or event_key → all absent → pe = 0
>   nov  → thalamus.mjs:202-203 reads `evt.concept_tokens` → 0 of 768 code afferents have any
>   self → voice-only (finding above)
>   err/gov/dead → need rep/gov_from/due_count → absent
> 
> Measured: salience_ledger rows whose spotlight key starts `code:` = **3,024. Rows with S > 0: 0. Max S: 0.**
> Per-modality mean S: code = 0.0005, vs voice 0.0910, bus 0.1236.
> 
> The token derivation that would fix nov exists and is voice-gated too — thalamus.mjs:172:
>   `if (e.modality === "voice" && e.text && !(Array.isArray(e.concept_tokens) && e.concept_tokens.length)) {`

**Impact**

> 57% of all bound moments (3,024 of 5,267) come from Claude Code and every one is scored zero. The nucleus is spending its whole binding/scoring/ledger pipeline on a stream it has decided in advance is worth nothing. Nothing typed can ever reach enrich (tau0=0.25), let alone wake. The 'code' capture nerve in .claude/settings.json works perfectly and lands into a scorer that is blind to it.

---

### 7. The haiku pulse's mathematical ceiling is 0.244 — BELOW tau0 (0.25). 853 LLM calls produced 124 escalations that could not reach even the cheapest tier

`unwired` · `red` · area `memory-layer` · day-one fixable: yes
**where:** scripts/thalamus.mjs — no `pulse` branch exists; :196-198 (base-rate fallback), :553 (tau0 gate); dressing-room/state/thalamus_config.json:13,27-29

**Evidence**

> `grep -c pulse scripts/thalamus.mjs` → **0**. There is no pulse handling anywhere in the nucleus.
> 
> So a pulse afferent falls to the generic paths. Its shape (measured, all 124):
>   `{"modality":"pulse","source":"haiku-pulse","text":"pulse flagged (reasoning-hard): ...","concept_tokens":[...],"event_key":"pulse:escalate"}`
> 
> Component-by-component ceiling:
>   pe  → no market_id/p_obs, falls to :196-198 base_rates default 0.5 → surprisal(0.5,4bits)=0.25, ×0.5 = **0.125** → ×w 0.35 = 0.04375
>   nov → 121/124 DO carry concept_tokens, so nov can hit 1 → ×w 0.20 = **0.200**
>   self/err/gov/dead → structurally 0 (self is voice-only; no rep, no gov, no due_count)
>   ceiling = 0.04375 + 0.200 = **0.24375**
> 
> tau0 = 0.25 (thalamus_config.json:13). Tier assignment, thalamus.mjs:553:
>   `let tier = S < cfg.tiers.tau0 ? 0 : 1;`
> 
> Ledger confirms exactly: pulse max S ever = **0.244**, pulse tier histogram = **{"0":124}** — 124 of 124 stuck at reflex, zero ever enriched, zero ever adjudicated. Habituation then drags 79 of the 124 to S=0.000 outright (`pulse:escalate` repeats, so hab saturates).

**Impact**

> The pulse is the ONE signal in the organism that already cost an LLM call to produce — a Haiku sentinel that read his stream and concluded 'this is reasoning-hard, escalate.' 853 haiku_pulse rows in brain_ledger bought 124 escalations, and by arithmetic not one of them could ever be admitted past free reflex. The organism pays for a smoke alarm and wires it to a light that is 0.006 too dim to switch on.

---

### 8. The memory that reaches every session opens by telling it this is day one — two dead 17-Jul facts, injected unconditionally, forever

`lying` · `red` · area `memory-layer` · day-one fixable: no
**where:** dressing-room/hippocampus/identity_facts.json; scripts/hippocampus.mjs (L2 identityCartridge, injected via buildRehydrateCartridge); scripts/learnstate.mjs:90-92 (splice into SessionStart brief); scripts/mcp-memory.mjs get_context

**Evidence**

> dressing-room/hippocampus/identity_facts.json — the entire file, last written **17 Jul**, 336 bytes:
>   1. "this is the first day that we are working together on the organism"
>   2. "I am bringing my friend to whom you need to explain everything"
> 
> These are L2 — "injected UNCONDITIONALLY every session" (hippocampus.mjs header, L2 THE LEDGER OF SELF). Verified live, both paths:
>   `node scripts/learnstate.mjs brief` → the SessionStart hook output leads with exactly those two lines
>   MCP `get_context` → same two lines, first thing in the payload
> 
> And who_he_is.json (consolidated 1 Aug) repeats it: `"fingerprint": "He is studying since 2:30 AM on his first day working with the system."`
> 
> Meanwhile his four REAL standing rules — Hinglish not shuddh Hindi, one idea per message, use real terminology, never guess a numerical limit — exist only as `preference` episodes (dressing-room/hippocampus/episodes.jsonl, 31 Jul + 1 Aug). They are not facts, so they are not unconditional; they survive in the cartridge only because they happen to fall inside the last-8 episode window.
> 
> Staging check: `dressing-room/hippocampus/identity_facts.pending.jsonl` **does not exist**. Nothing is staged-but-unconfirmed — `remember_fact` has never once been called in 16 days.

**Impact**

> He has said three times that the memory failed to reach a session. This is what actually reaches it: the highest-priority, always-present slot in his memory tells every new session that they have never worked together and that a non-technical friend needs everything explained from scratch. That is worse than empty — it is an instruction to re-explain. The two facts that are guaranteed to arrive are both false and both stale by 16 days; the four rules that matter arrive only by luck of recency.

---

### 9. The nightly consolidator ingests only the dead voice transcript and hand-written notes — it cannot see Claude Code at all

`unwired` · `red` · area `memory-layer` · day-one fixable: yes
**where:** scripts/hippocampus.mjs:281-293 (gatherDayMaterial), :294 (consolidate); ArsenalFC-Consolidate daily 02:10

**Evidence**

> scripts/hippocampus.mjs:281 `gatherDayMaterial()` reads exactly three things:
>   · episodes.jsonl rows whose `day` is today or yesterday
>   · `CAPTAIN: ` lines from `dressing-room/state/brain_out/dugout/<date>.md`
>   · calibration.json gap/trend
> 
> It never opens afferent.jsonl.
> 
> The dugout transcript directory: `2026-07-17.md, 2026-07-18.md, 2026-07-19.md, 2026-07-30.md` — **nothing since 30 Jul**.
> episodes.jsonl: **16 rows in 16 days**, every one written by a manual MCP `note` call.
> 
> So tonight's 02:10 run (ArsenalFC-Consolidate, last result 0) will see: 2 episodes, 0 captain_lines. That is the entire evidentiary basis for "who he is right now."
> 
> What it cannot see: his 46 typed prompts from 1 Aug, and 463 across the corpus — captured perfectly by hooks/afferent-post.mjs into afferent.jsonl, sitting one directory away.
> 
> The result is visible in the output: who_he_is.json says "his first day working with the system" because that phrase is in one of the 4 episodes it had, and there was nothing else to weigh it against.

**Impact**

> L3, the consolidator, is the layer that is supposed to answer 'where is he right now' without him saying a word. It is wired to two surfaces he has stopped using (the voice bridge, silent since 30 Jul) and one that charges him a manual capture tax (MCP note, 6 uses in 16 days). The surface where 100% of his learning now happens is invisible to it. The memory does not fail at retrieval — it fails at ingestion.

---

### 10. The recall index — the surface MCP `recall()` searches — is fed only by the voice bridge and froze on 30 Jul

`starved` · `red` · area `memory-layer` · day-one fixable: yes
**where:** scripts/dugout.mjs:437-450 (gatherRecallSources), :511 (indexRecall consumes it); dressing-room/state/recall_index.jsonl

**Evidence**

> scripts/dugout.mjs:437 `gatherRecallSources()` returns items from exactly four places:
>   · dugout_notes.jsonl → **2 rows**
>   · loose_balls.jsonl (throw-ins) → **2 rows**
>   · notebook.json → absent
>   · `brain_out/dugout/*.md` `CAPTAIN: ` lines → **last file 2026-07-30**
> 
> Measured recall_index.jsonl: **135 rows**, by day `{17 Jul:15, 18 Jul:75, 19 Jul:36, 30 Jul:9}`. Nothing on 31 Jul or 1 Aug. File mtime 30 Jul 16:24, while ArsenalFC-HippoIndex has run hourly since (last 02-08 01:47, result 0) and no stale `.lock` exists.
> 
> The MCP's `recall()` merges episodes ⊕ recall_index ⊕ scribe_log (mcp-memory.mjs header). Two of those three are frozen; the third has 16 rows.

**Impact**

> `recall("what confused him about X")` — the targeted-lookup tool CLAUDE.md instructs every session to use — searches a corpus that stopped growing three days ago and never contained a single thing he typed. It still returns good hits for July (verified: a query about how he wants to be taught returned his two 31-Jul preference episodes at 0.75/0.74), but only because episodes carry those. Anything he has said since 30 Jul outside a manual note is unrecallable.

---

### 11. L4, the per-turn recall reflex, has exactly one caller — the voice bridge. In Claude Code nothing recalls anything mid-session

`unwired` · `red` · area `memory-layer` · day-one fixable: yes
**where:** scripts/hippocampus.mjs (recallReflex, exported at :685), scripts/dugout.mjs:2928 (sole caller), .claude/settings.json UserPromptSubmit chain

**Evidence**

> `grep -rn "recallReflex" scripts/ hooks/` → two hits: the definition in hippocampus.mjs, and **scripts/dugout.mjs:2928** — `recallReflex(body.text).then(hit => { if (hit) runtime.recallHint = ... })`. That is the entire consumer set.
> 
> The UserPromptSubmit hook chain in .claude/settings.json fires three things — `afferent-post.mjs`, `forge_session.mjs contract`, `teaching_contract.mjs print`. None of them touches recall.
> 
> Proof it has not fired: `dressing-room/hippocampus/recall_bumps.jsonl` is **0 bytes**, created 30 Jul 16:24. The 25-Jul audit note at hippocampus.mjs:30 says this file exists specifically so recalls get COUNTED; the count is still zero. Summed `recalls` across all 16 episodes = 5, all from the voice era.

**Impact**

> In a Claude Code session, memory arrives exactly once — the SessionStart cartridge — and then never again, no matter what he says for the next five hours. The voice bridge gets a per-turn reflex that surfaces a relevant past moment as he speaks; the surface he actually works on gets a single opening paragraph. That asymmetry is the same shape as the teaching-contract problem he already fixed (rules injected once at SessionStart drowned after 40 turns) — but for memory, and still open.

---

### 12. Habituation is the only component that fires at scale — six of the seven positive signals fired in under 5% of moments, three fewer than four times ever

`broken` · `red` · area `memory-layer` · day-one fixable: no
**where:** scripts/thalamus.mjs:227-234 (hab computation), :238 (salience formula); dressing-room/state/thalamus_config.json:10 (hab weight 0.40), :21-24 (tau_ms 600000, saturation 4)

**Evidence**

> Full component distribution over all 5,267 salience_ledger rows:
> 
>   component  nonzero rows   share    mean over all rows   max seen
>   pe          1,910        36.26%    0.0481               0.65
>   nov           258         4.90%    0.0421               1
>   gov             1         0.02%    0.0001               0.5
>   err             3         0.06%    0.0001               0.4
>   self            7         0.13%    0.0013               1
>   dead            2         0.04%    0.0001               0.2
>   hab         4,154        78.87%    **0.5606**           1
> 
> hab is the PENALTY term — scripts/thalamus.mjs:238:
>   `return clamp01(w.pe*comps.pe + w.nov*comps.nov + ... + w.dead*comps.dead - w.hab*comps.hab);`
> Mean penalty applied = 0.40 × 0.5606 = **0.224** per moment. Mean total S = **0.0122**.
> 
> 1,643 moments had a positive raw score reduced by habituation. 5,037 of 5,267 moments (95.6%) landed in the S ∈ [0.00, 0.05) bucket. `err` has never once reached 1.0 — that requires `confidence:"knew" && correct:false`, and across all 9 rep afferents the pairs are shaky/false, knew/true, guessed/false ×5, shaky/true. The most teachable instant in the design has never occurred.

**Impact**

> The nucleus is not scoring attention; it is scoring boredom. The one term operating at volume is the one that subtracts. Because the surviving positive inputs (36% weak base-rate PE at a flat 0.13, 5% novelty) are dwarfed by a mean 0.224 penalty, the median moment is driven to exactly zero. This is downstream of the three unwired findings above — starve pe/nov/self/err of real inputs and hab is all that is left — but it also means any fix to those must be re-checked against hab, or the new signal gets eaten too.

---

### 13. The DMN's nightly precache has never produced a single whisper — the only route to it matches browser-chrome words against concept names, 0 for 95

`unwired` · `yellow` · area `memory-layer` · day-one fixable: yes
**where:** scripts/thalamus.mjs:607-619 (the whisper match); presence.mjs (emits stall concept_tokens from window titles); dressing-room/state/dmn_precache.json

**Evidence**

> The sole consumer, scripts/thalamus.mjs:607:
>   `if (String(g.spotlight.evt.event_key || "").startsWith("stall:")) {`
> It then requires ≥1 shared >3-char word between {stall tokens ∪ stall text words} and {precache concept + stall_signature}.
> 
> Stall afferents are emitted by presence.mjs and look like this (measured, all 95):
>   `{"event_key":"stall:leading-edge","text":"tab-thrash forming: 56 switches in 9min","concept_tokens":["google","chrome","antigravity","claude"]}`
> So hintWords = {google, chrome, antigravity, claude, thrash, forming, switches, 9min} — browser and app chrome, never a concept.
> 
> Today's dmn_precache.json entries: concepts `[hallucinations, a real study session happens today, hallucinations, ...]`, 49 rollouts, 5 verified.
> 
> I replayed the exact matcher over all 95 historical stall afferents against the live precache: **0 matched.**
> Corroborating: salience_ledger has 90 stall-keyed moments, tier histogram `{"0":90}`; workspace.json currently reads `whisper: null`.

**Impact**

> ArsenalFC-DMN runs hourly and burns a nightly LLM lane (49 rollouts + counter-rollout verification) to pre-draft five wall-breaker interventions. The only door they can walk through is fed tokens describing which browser tab he was on. Zero-latency intervention was the entire point of drafting hours in advance; it has fired zero times in 16 days.

---

### 14. context.mjs runs 1,440 times a day to produce ~144 afferents that are scoring-inert by construction

`broken` · `yellow` · area `memory-layer` · day-one fixable: yes
**where:** ArsenalFC-Context (schtasks, PT1M); scripts/context.mjs:75 (event_key is app-only), :30 (FLOOR_MS 60000); scripts/thalamus.mjs:172 (token derivation voice-gated)

**Evidence**

> Schedule (schtasks /query /v): `ArsenalFC-Context` — `Repeat: Every: 0 Hour(s), 1 Minute(s)`, `Repeat: Until: Duration: Disabled` — i.e. every minute, indefinitely. Task command spawns cmd + node each time: `cmd /c cd /d ... && node scripts\context.mjs once`.
> 
> Write volume, measured:
>   context afferents per calendar day: {18 Jul:195, 19 Jul:98, 20 Jul:277, 21 Jul:184, 22 Jul:66, 23 Jul:29, 25 Jul:150, 26 Jul:23, 29 Jul:229, 30 Jul:212, 31 Jul:193, 1 Aug:72} → mean **144/day**
>   → so ~1,296 of 1,440 daily runs are pure no-op process spawns
>   → each emit also costs: 1 atomic write to context_state.json, 1 afferent row, 1 salience_ledger row, 1 full workspace.json rewrite
> 
> What those 144/day buy: `context` is the 2nd-largest modality (1,728 afferents, 1,727 moments = **33% of all bound moments and 33% of all workspace.json version bumps**), and:
>   · context afferents carrying concept_tokens: **0 of 1,728** (nov structurally impossible — thalamus.mjs:172 derives tokens for voice only)
>   · max S ever for a context moment: **0.244** (vs bar 0.75)
>   · context moments scoring exactly 0.000: **1,256 of 1,727 (73%)**
>   · context moments crossing tau1: **0**
>   · distinct event_keys: **17**, dominated by `context:chrome.exe` (663), `context:WindowsTerminal.exe` (534), `context:claude.exe` (337) — the app, never the title
> 
> The header at context.mjs:11 states the purpose: "so every bound moment carries what-app / what-concept he was on ... gives the never-fired cortex something to reason over." The title IS carried in `evt.title`/`evt.text` — but `event_key` is built app-only (context.mjs:75: ``event_key: `context:${win.app}` ``), so habituation saturates per-app and the concept in the title never reaches the scorer.

**Impact**

> A third of the organism's bound moments, a third of its workspace broadcasts, and 1,440 process spawns a day are spent on a stream that cannot score above a third of the wake bar and cannot light novelty at all. It is not wrong that it is quiet — it is that the minute cadence is buying volume the scorer is built to discard.

---

### 15. The distiller's 25-row input window is 68% window-title noise — his own words are a minority in the file that is supposed to hold his working memory

`broken` · `yellow` · area `memory-layer` · day-one fixable: yes
**where:** scripts/distiller.mjs:28 (INTERACTIVE includes context), :45-51 (recentStream slice(-25)), :~78 (buildPrompt renders them verbatim)

**Evidence**

> scripts/distiller.mjs:28 — `const INTERACTIVE = ["voice", "code", "desktop-study", "note", "context", "throwin"];`
> `recentStream()` (:45-51) filters to those modalities and takes `.slice(-25)`.
> 
> Because `context` is in that list and context.mjs emits ~144/day while his typed prompts run ~40/day, context dominates the window.
> 
> Measured on the live stream (2,775 interactive rows):
>   full mix: {context: 1,730, code: 768, voice: 271, desktop-study: 6}
>   the CURRENT last-25 window: **{context: 17, code: 8}** — 68% titles
>   sampled every 5 rows across history, 551 windows: **364 (66.1%) were ≥50% context**
> 
> What those 17 rows actually contain:
>   `context | SearchHost.exe · Search`
>   `context | explorer.exe ·`
>   `context | WindowsTerminal.exe · Terminal`
>   `context | claude.exe · Claude`
> 
> Those lines are fed verbatim into the LLM prompt at distiller.mjs:~80 (`buildPrompt` → `[HH:MM modality] text`), 15 minutes apart, forever (ArsenalFC-Distiller, PT15M).

**Impact**

> working_set.json is the 4-slot whiteboard the whole re-entry story rests on — it is spliced into get_context, read by learnstate's SessionStart brief, and named in CLAUDE.md. Its evidence base is two-thirds `explorer.exe ·`. The output happens to be good right now (concept_in_motion correctly names the audit) because the 8 code rows in the current window are unusually dense; on a quiet stretch the 25 rows can be entirely titles and the LLM is asked to describe his working memory from a list of window captions.

---

### 16. The salience nucleus and the cortex run under wscript with no output redirect — every diagnostic the memory layer emits is discarded

`broken` · `yellow` · area `memory-layer` · day-one fixable: yes
**where:** setup/hidden_run.vbs (`sh.Run cmd, 0, False`); ArsenalFC-Thalamus and ArsenalFC-Cortex task definitions; scripts/thalamus.mjs D.log call sites (:539, :618, :636, :651, :665)

**Evidence**

> schtasks: `ArsenalFC-Thalamus` → `wscript.exe C:\Users\nikhi\GitHub\arsenal-ai-fc\setup\hidden_run.vbs node scripts\thalamus.mjs` (same shape for ArsenalFC-Cortex).
> setup/hidden_run.vbs ends with `sh.Run cmd, 0, False` — window style 0, no redirect, fire-and-forget.
> 
> There is no thalamus log anywhere: `find . -name "*.log"` returns calibration, capture, coach, fsrs, learning_state, nemesis, timeaudit, tone — **no thalamus, no cortex**.
> 
> What is being thrown away (all `D.log(...)` calls in thalamus.mjs):
>   :618 `stall matched the Rest Room's precache — whisper loaded`
>   :636 `doubt matched the night's answer_cache — pre-answer attached`
>   :651 `second spotlight returned`
>   :665 `WAKE → opus (S=... ≥ τ1=...)`
>   :539 `a bound moment was LOST mid-flush (<reason>)` — the moment-loss alarm itself
> 
> Concrete cost: wake_queue.jsonl shows the organism's FIRST-EVER spontaneous doubt-wake — 18 Jul 12:35, his Devanagari "यार आपको समझ नहीं आ रहा है ... कैसे चल रहा है पूरा सिस्टम", S=0.45 — was closed as `{"status":"declined","reason":"gave-up-after-2-attempts"}` (cortex.mjs:261). Two Opus attempts failed and **no record survives of why**. That is 1 of the only 2 wakes in the organism's life, and it is unexplainable.

**Impact**

> This layer's whole failure mode is silent: things score zero, matchers miss, moments get lost mid-flush. Every one of those events already has a log line written for it, and every line goes to a closed handle. When he says memory never reached the session, there is no way to answer 'here is where it stopped' — which is why the answers in this audit had to be reconstructed from ledgers instead of read off a log.

---

### 17. The rehydrate cartridge presents a possibly-stale consolidation as "RIGHT NOW" with no degradation, unlike every other stale-safe organ

`lying` · `yellow` · area `memory-layer` · day-one fixable: yes
**where:** scripts/hippocampus.mjs whoCartridge(); consolidate() early-return; dressing-room/hippocampus/who_he_is.json

**Evidence**

> scripts/hippocampus.mjs `whoCartridge()`:
>   ``return `WHO HE IS RIGHT NOW (consolidated ${who.date}): ${who.fingerprint}...` ``
> The date is printed but nothing acts on it. `consolidate()` returns early — `{ ok:false, skipped:true, reason:"no fresh material — the old who_he_is stands" }` — whenever episodes and captain_lines are both empty, which given finding #6 is the normal case on any day he does not hand-write an MCP note.
> 
> Live proof of the drift it produces: who_he_is.json currently asserts `"He is studying since 2:30 AM on his first day working with the system"` and `do_not: ["Do not conduct note-based quizzing or re-GEERAH today"]` — the word "today" refers to 31 Jul.
> 
> Contrast scripts/tone.mjs, which handles exactly this class of problem explicitly (header): "STALE-SAFE: age may only ever DEGRADE a verdict, never lift one — a Governor older than 36h ... drops GREEN to nominal." The hippocampus cartridge has no equivalent.

**Impact**

> A session is handed day-specific instructions ("do not do X today") from a file that may be several days old, framed as current. The failure direction is toward confident wrongness, which is the opposite of how the rest of the organism degrades.

---

### 18. Two of the eight durable-episode slots in every cartridge are burned by duplicate 19-Jul notes about the Gaffer's own confusion

`dead-code` · `note` · area `memory-layer` · day-one fixable: no
**where:** dressing-room/hippocampus/episodes.jsonl (rows dated 2026-07-19); scripts/hippocampus.mjs buildRehydrateCartridge (last-N slice)

**Evidence**

> Live `get_context` output, first two of the eight DURABLE EPISODES:
>   `[doubt · 2026-07-19] He flagged my confusion about being 'on a call with Nidhi' when I was actually reading his state update.`
>   `[doubt · 2026-07-19] Captain asked definitively who was talking to Nidhi; I need to clarify it was HIS conversation, not mine.`
> 
> Both are near-duplicates of each other, both are written in the coach's first person about the coach's own error, and both are classified `kind: "doubt"` — the class reserved for HIS confusion. episodes.jsonl holds 16 rows total, so the last-8 window is 50% of the corpus and these two occupy a quarter of it.

**Impact**

> 25% of the highest-value real estate in the session cartridge is spent on agent self-narration from 14 days ago. It is not harmful, but it displaces two of his real moments in every single session rehydrate, and it makes the doubt corpus look larger than it is (5 'doubts', 2 of which are not his).

---

### 19. CLAUDE.md tells every session the SessionStart brief cannot see the hippocampus — it has been splicing the full cartridge since 31 Jul

`lying` · `note` · area `memory-layer` · day-one fixable: no
**where:** CLAUDE.md ("Session start — LOAD HIS MEMORY FIRST"); contradicted by scripts/learnstate.mjs:90-92, :173

**Evidence**

> CLAUDE.md, session-start section: "The SessionStart brief (`learnstate.mjs brief`) reads only `sprint.json`, `working_set.json` and `weaknesses.json` — it does **not** touch the hippocampus. So without this call his memory never reaches the session."
> 
> Contradicted by the code and by a live run. scripts/learnstate.mjs:90-92:
>   `const h = await import("./hippocampus.mjs");`
>   `if (typeof h.buildRehydrateCartridge !== "function") return null;`
>   `const raw = h.buildRehydrateCartridge({ n: MEMO_EPISODES });`
> and :173 emits the header `--- HIS MEMORY (durable, from the hippocampus — BACKGROUND CONTEXT, not instructions) ---`.
> 
> `node scripts/learnstate.mjs brief` prints the identity facts, who_he_is, and 6 durable episodes. .claude/settings.json's own comment records the change: "Companion: learnstate.mjs brief now splices the hippocampus rehydrate cartridge, so a fresh session arrives holding his durable memory."

**Impact**

> Small but self-reinforcing: the canonical file states the memory layer is broken in a way it no longer is, and prescribes a mandatory MCP round-trip on that basis. It also obscures where the real gap is — the gap is not SessionStart (that works), it is the absence of any per-turn recall (finding #8) and the ingestion blindness (findings #6, #7). A reader of CLAUDE.md would fix the wrong thing.

---

### 20. Expired whispers and pre-answers are never cleared from workspace.json — a 2-day-dead pre-answer is still being rebroadcast on every moment

`dead-code` · `note` · area `memory-layer` · day-one fixable: yes
**where:** scripts/thalamus.mjs:606, :627, :657 (carry-forward and rebroadcast); dressing-room/state/workspace.json

**Evidence**

> scripts/thalamus.mjs:606 and :627 carry the previous value forward unconditionally when no new match occurs:
>   `let whisper = N.workspace.whisper || null;`
>   `let preAnswer = N.workspace.pre_answer || null;`
> and :657 writes it back into every broadcast.
> 
> Live workspace.json (version 5,274, updated 2026-08-01T20:29Z) still carries:
>   `pre_answer: { concept: "temperature", ..., ts: "2026-07-30T21:58:05.193Z", expires: "2026-07-30T22:01:05.193Z" }`
> That is a 3-minute window that closed **two days ago**, re-serialized into every one of the thousands of broadcasts since.
> 
> Consumers do guard correctly — dugout.mjs:154 `out.pre_answer = (ws && ws.pre_answer && new Date(ws.pre_answer.expires) > new Date()) ? ws.pre_answer : null;` — so nothing stale is ever spoken.

**Impact**

> No behavioural harm, because every reader checks `expires`. The cost is a ~1.5KB dead payload re-written to disk on every bound moment, and a state file that misreports the organism's condition: reading workspace.json directly suggests a pre-answer is loaded when the window closed 48 hours ago. That matters for exactly the kind of audit this is.

---

### 21. The earned-voice gate can never open — shadow `score` has never run and proactivity_ledger.json does not exist

`broken` · `red` · area `voice-presence` · day-one fixable: yes
**where:** scripts/shadow.mjs:214-236 (score, sole ledger writer) · scripts/postmatch.mjs:269 (only score caller) · scripts/dugout.mjs:2816 (only detect caller, in-process) · dressing-room/state/shadow_log.jsonl (5 rows, all resolved:false)

**Evidence**

> `ls dressing-room/state/proactivity_ledger.json` → No such file or directory. shadow_log.jsonl holds 5 rows, every one `"resolved":false` (18 Jul, 31 Jul ×3, 1 Aug). shadow.mjs:214-236 is the only writer of the ledger and it runs ONLY under `mode === "score"`. The only production caller of `score` is postmatch.mjs:269 — and post_match/ has never existed. `detect` has no scheduled task either: the only caller is dugout.mjs:2816, `setInterval(... shadow.mjs detect ..., 600000)`, inside the manually-started bridge process. schtasks shows no ArsenalFC-Shadow among the 44 tasks. shadow.mjs:115 requires `shadows >= 10` before eligibility; the counter is at 0 because nothing ever increments it.

**Impact**

> The crown mechanism of the whole organism — "the machine must earn the right to interrupt you" — is frozen at zero and cannot move. Four interruption types will train silently forever. dugout.mjs:166 and :540 read proactivity_ledger.json to build the Gaffer's proactivity section; it reads null every time. The organism's proactive mouth is not muted by law, it is muted by a missing file.

---

### 22. speak.mjs's playback half has never fired in production — and the 'scheduled-utterance lane' it names does not exist as a task

`dead-code` · `yellow` · area `voice-presence` · day-one fixable: yes
**where:** scripts/speak.mjs:81-90 (say) · setup/SPEAK.ps1 (robot engine, uninstalled) · setup/VOICE_SETUP.md:51 · scripts/talk.mjs:128 · scripts/dugout.mjs:231

**Evidence**

> speak.mjs:9 claims "SPEAK.ps1 stays the scheduled-utterance lane." schtasks over all 44 ArsenalFC-* tasks shows no ArsenalFC-Speak; setup/VOICE_SETUP.md:51 documents the install command but it was never run. The only two production callers of `say()` are talk.mjs:128/141/146 (brain_ledger has 0 rows with job "talk"; dressing-room/state/brain_out/talk/ does not exist) and dugout.mjs:231 fireReminders (dressing-room/state/dugout_reminders.jsonl does not exist). Separately, SPEAK.ps1 does not use speak.mjs at all — it calls System.Speech directly (the robot voice), so even if installed it would bypass the en-US-ChristopherNeural engine entirely.

**Impact**

> The mp3 half works — 12 real team-talk mp3s in dressing-room/club/media/ (425-587KB each, newest teamtalk_2026-08-02_am.mp3 written 01:47 today) plus 5 ACK fillers, and `node scripts/speak.mjs selftest` is 7/7 green. But the organism has never actually spoken out loud on this machine through any automatic path. The neural voice exists as a capability, not as a behaviour.

---

### 23. presence calibrate is a monotone ratchet — the stall bar can only climb, and climbs again at 03:30 today

`broken` · `yellow` · area `voice-presence` · day-one fixable: yes
**where:** scripts/presence.mjs:46-59 (calibrate) · dressing-room/state/presence_thresholds.json

**Evidence**

> presence.mjs:52-56 fits `min_switch_rate_per_min` to p95 of rows where `!r.edge` × 1.25, floored at factory. But `edge` is frozen into each row at write time (presence.mjs:281), so raising the bar makes future rows get labelled calm MORE often — and those newly-calm rows have higher rates, which raises the next p95. Measured: factory 5.0/30 → after the 25 Jul fit, presence_thresholds.json = {"min_switch_rate_per_min":6.1,"min_total_switches":53}. Recomputing the same formula on today's full log: p95 calm rate = 5.9 → next bar 7.4; p95 calm switches = 47 → next bar 59. ArsenalFC-PresenceFit next runs 02-08-2026 03:30. Edge rate has already fallen 14.9% (523 passes before the fit) → 12.9% (241 passes after).

**Impact**

> Every weekly calibration makes the stall sensor blinder, with no floor other than the factory minimum it started above. Nothing ever pulls it back down. Given finding #1 (the afferent can't cross tau0 anyway) this is currently harmless — but it means that when #1 is fixed, the sensor will already have desensitised itself out of usefulness.

---

### 24. The Gaffer's club report tells him twice as many presence passes as actually ran

`lying` · `yellow` · area `voice-presence` · day-one fixable: yes
**where:** scripts/dugout.mjs:1092 (and the identical line in scripts/organism_live_demo.mjs)

**Evidence**

> dugout.mjs:1092 `senses: { presence_passes_today: presence.length, ... }` where `presence` (dugout.mjs:1081) is every row in presence_log.jsonl for today. presence.mjs appends TWO rows per pass — the thrash row at :294 and the `kind:"focus"` row at :308. presence.mjs:61-68 documents this exact bug, fixed it in presence.mjs's own `status`, and explicitly left dugout's copy alone: "(dugout.mjs:1056 `presence_passes_today` carries the same double-count and is NOT this file's to fix — reported to the audit instead.)". Live proof: presence_log.jsonl has 1,505 rows = 764 thrash + 741 focus, i.e. ~2× the real pass count.

**Impact**

> When he asks the Dugout for the boardroom briefing, the interoception organ reports 2× its true activity. Small number, but it is the one organ whose entire job is honest self-report, and the bug was knowingly left in place waiting for exactly this audit.

---

### 25. His-voice reminders only fire while the dugout window is open — a reminder for later today dies when he closes it

`broken` · `yellow` · area `voice-presence` · day-one fixable: yes
**where:** scripts/dugout.mjs:2813 (in-process interval) · scripts/dugout.mjs:775 (the promise in the system instruction) · scripts/dugout.mjs:199-243 (fireReminders)

**Evidence**

> dugout.mjs:2813 `setInterval(() => fireReminders()..., 30000)` — the ONLY caller of fireReminders in production, and it lives inside the bridge server process started by `npm run dugout`. dugout.mjs:775 tells the Gaffer "remind me / yaad dilana → set_reminder with his EXACT words and the time he named. At fire time his own words come back through you." But dugout_session.json shows the bridge was last alive 2026-07-30T10:00:21Z, and there is no ArsenalFC task for dugout.mjs at all. `ls dressing-room/state/dugout_reminders.jsonl` → No such file or directory.

**Impact**

> The promise is unconditional ("at fire time his own words come back") but the delivery is conditional on a process he starts by hand and closes when the conversation ends. Set a 10:00 reminder for 18:00, close the window at 10:15, and it silently never fires. Nothing has been lost yet only because he has never used the verb.

---

### 26. Every Gemini tank went COLD at 01:48 IST today — the Dugout voice surface has no fuel for the rest of the day

`broken` · `yellow` · area `voice-presence` · day-one fixable: no
**where:** dressing-room/state/tanks.json · scripts/fuelboard.mjs:96, :203 · scripts/dmn.mjs:230 · scripts/dugout.mjs:2794-2795 (starts regardless of tank state)

**Evidence**

> dressing-room/state/tanks.json (written 2026-08-01T20:18:10Z = 02:48… 01:48 IST today): T1, T2, T5, T6, T7 all `"state":"COLD"` with `last_429` stamped 2026-08-01T20:18:08-10Z; T3 "DEAD"; only T4 (the Claude Bridge, not a Gemini key) is HOT. fuelboard.mjs:96 `if (t.last_429) return "COLD";  // faulted → cold till local midnight`, and fuelboard.mjs:203 `usable = (t) => ["HOT","WARM"].includes(stateOf(t)) && t.key_index !== null` — so the router has zero usable Gemini tanks. The 429 timestamps match ArsenalFC-DMN's last run exactly (schtasks: 02-08-2026 01:47:47); dmn.mjs:53 imports record429 and dmn.mjs:230 calls it.

**Impact**

> The overnight DMN pass burned the entire regional key pool minutes before the day started, and the fuelboard freezes faulted tanks until local midnight. If he opens the Dugout today, dugout.mjs:2794 only checks that keys exist (9 in ~/.gemini/.env) — it does not check tank state — so the page will start, show a gauge, and fail on the wire. Cross-area cause (DMN/fuel), but the casualty is this area's only live voice surface.

---

### 27. The touchline's struggle read has been dark 13 of 14 days — it needs 6 reps a day and 9 reps exist in total

`starved` · `yellow` · area `voice-presence` · day-one fixable: no
**where:** scripts/touchline.mjs:182-184 · dressing-room/state/pitch_read_history.jsonl · dressing-room/state/reps_log.jsonl (9 rows)

**Evidence**

> touchline.mjs:182-184 `const last = repsToday.slice(-cfg.struggle.last_n); if (last.length < cfg.struggle.last_n) return { verdict: "no_data" }` with last_n = 6 (touchline.mjs:48). pitch_read_history.jsonl: 14 day-lines, `"struggle":"no_data"` on 13 of them; the single exception is 2026-07-31 "spinning". Live pitch_read.json: `"struggle":{"verdict":"no_data","basis":"0 reps today (< 6)"}`. reps_log.jsonl = 9 rows in total, ever.

**Impact**

> Starved, not broken — the organ is correct to refuse. But the consequence propagates: shadow.mjs:192 reads `pr.struggle.verdict` and can only raise a wall_breaker shadow when it says "spinning" (that is exactly why only 3 of the 5 shadows ever recorded are wall_breakers, all from 31 Jul), and viz.mjs:114 renders "no_data" on the wall every day. The touchline's other three senses (tunnel wall-minutes, tank bench, weak-foot streaks) ARE live and consumed — setpiece.mjs:258 uses weak_foot.streaks, viz.mjs:590 sums wall_minutes into the weekly trend (225 min this week), scorer.mjs:237 uses first_focus. So the organ is 3/4 alive; only the rep-fed quarter is dark.

---

### 28. presence_log.jsonl is unbounded and fully re-parsed 144 times a day

`broken` · `note` · area `voice-presence` · day-one fixable: yes
**where:** scripts/presence.mjs:280, :290, :303 · dressing-room/state/presence_log.jsonl

**Evidence**

> presence.mjs:280 `let _log = null; const log = () => (_log || (_log = readLines(PLOG)));` — memoised per pass, but each pass still JSON.parses the entire file to find the previous edge row (:290) and previous focus row (:303). File is 266,441 bytes / 1,505 rows after 16 days; ArsenalFC-Presence repeats every 10 minutes (schtasks: Repeat: Every 0 Hour(s), 10 Minute(s)). No rotation or truncation anywhere in the file. Consumers only ever read the tail: brain.mjs:367 `.slice(-6)`, distiller.mjs:136 `.slice(-12)`, dugout.mjs:1083 today's rows only. calibrate (presence.mjs:47) is the only whole-file reader and runs weekly.

**Impact**

> ~6MB/year, and the per-pass parse cost grows linearly forever. Trivial today, self-inflicted later. Worth noting that ~99% of the 266KB is read by exactly one weekly function.

---

### 29. nightshift's pre-answer material loses its voice corpus on 6 Aug — the voice lane has been silent since 30 July

`starved` · `note` · area `voice-presence` · day-one fixable: yes
**where:** scripts/nightshift.mjs:483-484 · dressing-room/state/afferent.jsonl (271 voice rows, newest 2026-07-30) · scripts/dugout.mjs:769, :1023, :2921

**Evidence**

> nightshift.mjs:483-484: `const aff = (...afferent.jsonl).filter(a => new Date(a.ts||0).getTime() >= weekAgo); const voiced = aff.filter(a => a.modality === "voice" && a.text)...slice(-30)`. All 271 voice afferents land on exactly four days — {"2026-07-17":80,"2026-07-18":133,"2026-07-19":45,"2026-07-30":13} — matching the four days the dugout bridge ran (brain_out/dugout/ holds 2026-07-17, -18, -19, -30 .md files, and dugout_session.json's handle is stamped 2026-07-30T10:00:21Z). The newest is 2026-07-30T10:00:10Z, 3 days old.

**Impact**

> The voice lane is wired end to end and is not dropping anything: mic → dugout page → POST /afferent-relay (dugout.mjs:2921) → relayAfferent → thalamus → afferent.jsonl → salience_ledger (271 voice moments, 264 reflex, 5 adjudicated_down, 2 wakes on 18 Jul). The gap between 271 voice afferents and 2 dugout notes is NOT a dropped wire — it is two different lanes: every ASR turn relays automatically, while a dugout note only exists when the Gaffer chooses to call take_note (dugout.mjs:1023), and dugout.mjs:769 tells it to merely OFFER ("throw that in?") rather than capture. Both notes are real take_note writes. The real issue is upstream of both: he has not opened the voice surface in 3 days, so from 6 Aug nightshift's `voiced` corpus goes empty and the pre-answer engine loses his own words.

---

### 30. The thalamus's self-marker list catches 7 of 271 voice turns; the throw-in poller is genuinely healthy

`waiting` · `note` · area `voice-presence` · day-one fixable: no
**where:** dressing-room/state/thalamus_config.json (self_markers) · dressing-room/state/throwin_state.json · scripts/throwin.mjs:391-401 · scripts/physio.mjs:333-342

**Evidence**

> Self-markers: running thalamus_config.json's 29 self_markers against all 271 voice texts gives 7 matches. 18 further turns contain doubt-shaped language the list misses, though most are requests not confusions (e.g. "chat history matlab kiski chat history" — the list has "matlab kya" but not bare "matlab"). Throw-in: throwin_state.json = {"last_since":1785600016 (=2026-08-01T16:00:16Z),"last_poll_at":"2026-08-01T20:24:03.073Z" (=01:54 IST today),"wired":true,"rep_ids":[]} with NO last_error key — and throwin.mjs:391-401 writes last_error on every non-200 or fetch failure, so a clean state IS proof of a 200. schtasks: ArsenalFC-Throwin, Last Run 02-08-2026 01:54:01, Last Result 0, repeats every 15 min. Topic resolves (throwin_topic.txt, 46 bytes, gitignored — not printed). `node scripts/throwin.mjs selftest` green.

**Impact**

> Two throw-ins in 15 days is genuine non-use, not a dead poller — the line is up and answering every 15 minutes. physio.mjs:333-342 already watches for delivery failure with throwin_gap_days = 4 (physio_config.json); last ball is 2.6 days old, so that alarm will legitimately fire on 3 Aug if nothing arrives, and that is the correct behaviour, not a bug. The self-marker coverage is the more interesting number: it is the only path by which a spoken doubt can earn self=1 and reach tier 2.

---

### 31. The teaching contract's turn clock is anchored to the FORGE session, not the Claude Code session — it never resets between sessions, and the CONTEXT WARNING will fire on every turn forever, 8 prompts from now

`broken` · `red` · area `forge-exam` · day-one fixable: yes
**where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\teaching_contract.mjs:125-129,:141-143,:174-179,:287 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\teaching_contract.json

**Evidence**

> teaching_contract.mjs:174-179 `forgeStartedAt()` returns forge_session.json's started_at whenever `!f.closed_at`, else null. :125-129 `bumpTurn` treats `fresh = t.session_started_at !== (sessionStartedAt || null)` as the ONLY reset. Live state: {"session_started_at":"2026-07-31T22:55:05.107Z","count":32}, context_warn_at 40 — the anchor is the stale session from finding #1, so today's entire audit day has been counted onto yesterday's forge session. `node scripts/teaching_contract.mjs list` -> "turn 32/40". Worse with NO forge session: forgeStartedAt() returns null and after the first bump session_started_at is already null, so `null !== null` is false forever — the counter increases monotonically across every future session with no reset path. `reset-turns` exists (:287) and grep across scripts/, hooks/ and .claude/ finds ZERO callers; only `print` is wired (.claude/settings.json:9).

**Impact**

> The organ's second stated purpose is his own explicit request — "explicitly tell me beforehand everytime when you are about to loose the context". At turn 40 blockLines (:141-143) emits the CONTEXT WARNING and, because nothing resets, emits it on every subsequent turn of every subsequent session regardless of real context use. A warning that always fires is a warning he will learn to ignore — and it is 8 prompts away.

---

### 32. capsule_bridge's headline feature — naming where the two schedulers disagree — is structurally incapable of being true; it reads FSRS's due list from a shape fsrs has never written

`broken` · `red` · area `forge-exam` · day-one fixable: yes
**where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\capsule_bridge.mjs:204-208 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\cards.json

**Evidence**

> capsule_bridge.mjs:204-208 `fsrsDueConcepts()` does pick(cards.due_today) and pick(cards.overdue) where `pick = (arr) => (Array.isArray(arr) ? arr : [])`. Live cards.json: due_today is a NUMBER (1) and overdue is a NUMBER (3) — verified with typeof. The concept NAMES live in cards.hardest_due (array of 4 strings) which this function never opens. Live `node scripts/capsule_bridge.mjs show` today: {"capsule_says_due_fsrs_quiet":["embeddings","inference","context","tokenization"],"fsrs_says_due_capsule_quiet":[]} — the first arm is just the full overdue list and the second can never be non-empty. The selftest passes because it injects fsrsDue as an array fixture (:260) and never exercises the disk reader.

**Impact**

> The stated reason this organ exists is "so the two worlds stop being air-gapped and silent" (header :22-24). It reports total disagreement every day and can never report agreement, which is the same as reporting nothing. manager.mjs:217-221 lifts capsule_map into the team sheet, so the sheet carries a fabricated conflict signal.

---

### 33. Every drill the organism has ever set has gone undone: 10 of 10 matured gaffer bets are misses, trust tier drill:recall = 0.0 over n=7

`starved` · `red` · area `forge-exam` · day-one fixable: no
**where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\slip.jsonl · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\trust_tiers.json · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\learnstate.mjs:98-101 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\dugout.mjs:932

**Evidence**

> state/slip.jsonl: 23 gaffer rows, 10 resolved, ALL hit:false, each with evidence ending "| matured d+N: no reps on it" — 07-18 embeddings, 07-20/21/21/22/22/23/23 inference, 07-25 embeddings, 07-25 inference. state/trust_tiers.json: {"type":"drill:recall","n":7,"hit_rate":0,"no_look":false}. setpiece has compiled a packet nightly since 18 Jul (drills.json today: 3 drills for 2026-08-02, status ok, ladder GREEN). The only interactive reader of drills.json is dugout.mjs:932 — and no ArsenalFC-* task runs dugout.mjs; it must be booted by hand and opened at localhost:4114. learnstate.mjs's SessionStart brief never opens drills.json (gather() at :98-101 reads sprint.json, working_set.json, weaknesses.json only).

**Impact**

> The motor cortex is intact and firing into a disconnected limb. Its own header says "Without an actuator, every sensor is a diary" — measured over 15 days the actuator produced zero reps. It also poisons the scorer's book: the gaffer's hit-rate is 0 not because the coaching is bad but because it is never delivered, and that 0 now sits in trust_tiers as if it were evidence about coaching quality.

---

### 34. postmatch.mjs has never run — post_match/ and season.json have never existed — so the scorer's post-match witness and the scout's war-room / FinOps arms are permanently dark inputs

`unwired` · `red` · area `forge-exam` · day-one fixable: no
**where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\postmatch.mjs:27,:39 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\scorer.mjs:508-521 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\scout.mjs:23,:131-140

**Evidence**

> `ls dressing-room/state/post_match` -> No such file or directory. `ls dressing-room/state/season.json` -> No such file or directory. postmatch.mjs:39 `const PM_DIR = join(STATE_DIR, "post_match")`; its header (:27) declares it sole writer of "post_match/<date>.md · season.json · notebook.json · routed_balls.json". scorer.mjs:508-521 builds pmPath = post_match/<today>.md and sets world.postmatchHit = pmText ? ... : null — permanently null, so twin.mjs:93's `hit = repsOnDate > 0 || postmatchHit === true` runs on one leg forever. scout.mjs:23 declares season.json an input; warRoomRead (:131-140) reads season.interview_dates and the finops branch reads season.pipeline_item — live scout.json has {"war_room":{"active":false,"mode":null}} and no pipeline item. No ArsenalFC-* task runs postmatch.mjs; its only invoker is .claude/skills/full-time/SKILL.md:14.

**Impact**

> Two whole capabilities are wired to a file that has never been written once. The scorer's floor_touched market resolves on reps alone with no second witness, and the war-room taper protocol ("inside the taper window the whole body shifts") can never activate, because the only place an interview date can be logged is a file no code has ever created.

---

### 35. The nightly Live Examiner drill reaches no surface he uses — its only consumer is a hand-booted dugout in scrimmage mode, and the /scrimmage skill never opens it

`unwired` · `yellow` · area `forge-exam` · day-one fixable: yes
**where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\examiner.mjs:93-109 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\dugout.mjs:383 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\.claude\\skills\\scrimmage\\SKILL.md:11 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\reps_log.jsonl

**Evidence**

> examiner.mjs writes state/examiner_drill.json (live today: implement-shape drill on "hallucinations", staged 2026-08-01T16:25:03, 3 hidden tests, picked_because "stalling/regressing in learning_state"). grep for examiner_drill|drillSection|loadFreshDrill across the repo returns exactly one runtime consumer: dugout.mjs:71 (import) and dugout.mjs:383 (buildScrimmageInstruction). No ArsenalFC-* task runs dugout.mjs — reaching it needs `npm run dugout` then localhost:4114/?mode=scrimmage. .claude/skills/scrimmage/SKILL.md:11 reads only scout.json and dossier_weights.json. Independent proof it has never been served: all 9 rows in reps_log.jsonl carry "surface":"gem" — zero chalkboard/code-round reps in the whole ledger.

**Impact**

> ArsenalFC-Examiner fires at 21:55 every night and writes a file that expires unread ~48h later. The build-it-live drill its own header calls "the highest-transfer drill for an AI-PE interview" has, measurably, never been run once.

---

### 36. The teaching contract's "drift-ranked, mutates with the journey" ordering is frozen — all 5 hits were written in one 402-millisecond burst and nothing in the machine can ever record another

`unwired` · `yellow` · area `forge-exam` · day-one fixable: no
**where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\teaching_contract.mjs:82-88,:111-117,:272-279 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\teaching_contract.json · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\forge_session.mjs:330-341

**Evidence**

> Live teaching_contract.json: his-word last_hit 2026-07-31T18:21:03.993Z, hinglish :04.109Z, terminology :04.191Z, link-back :04.289Z, decided :04.395Z — five rules hit inside 402 ms, i.e. a scripted seeding run, not observed drift. Zero hits in the 2 days since. grep for teaching_contract across scripts/, hooks/ and .claude/ returns only .claude/settings.json:9 (`print`) and forge_session.mjs's READ-ONLY consumer — nothing anywhere calls `hit <id>`. Consequence in rank() (:82-88): slot 1 is his-word forever (hits 2 vs 1) and the four 1-hit rules order by 100-ms timestamp deltas from that same burst. Downstream, forge_session.mjs teachingDrifts() (:330-341) put rules_drifted:5 into the last forge_sessions.jsonl row — derived entirely from that one burst.

**Impact**

> Mechanically the ranking IS computed from state, so the code is not a static list — but the data is. It claims to sharpen itself against "whatever is actually going wrong" and cannot, because the only writer of drift evidence is a human typing a CLI verb nobody has typed since the seed. The close report then quotes that frozen count back at him as though it measured last night's teaching.

---

### 37. forge_session boot hides the previous session's coverage line whenever any session is open on disk — so the one artifact of yesterday's teaching never reaches SessionStart

`broken` · `yellow` · area `forge-exam` · day-one fixable: yes
**where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\forge_session.mjs:520-546 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\forge_sessions.jsonl

**Evidence**

> bootLines (forge_session.mjs:520-546): the `if (s && s.concept && !s.closed_at)` branch RETURNS its two lines, so the `if (h.last)` history branch below is only reachable when no session is open. Live proof — `node scripts/forge_session.mjs boot` right now prints only the open-session pair and nothing from forge_sessions.jsonl's last row, which carries the real verdict: steps_pct 33, axes_untouched a-i, core_missing ["d"], method_clean false, teaching_drifts.rules_drifted 5. Because of finding #1 that session stays open indefinitely, so the suppression is permanent, not transient.

**Impact**

> The boot line exists precisely so "a fresh session arrives holding his durable memory instead of making him re-explain himself". The most decision-relevant fact at kickoff — that the last two sessions both closed method_clean:false with the CORE axis d never taught — is exactly what the branch swallows.

---

### 38. setpiece reads a `recurrence` field nemesis has never written, so today's drill packet on disk literally says "nemesis headline ×?"

`lying` · `yellow` · area `forge-exam` · day-one fixable: yes
**where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\setpiece.mjs:252,:466 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\nemesis.mjs:284 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\drills.json

**Evidence**

> setpiece.mjs:252 `source: ax ? "axis_pattern strength " + ax.strength : "nemesis headline ×" + (wk.headline.recurrence || "?")`. nemesis.mjs:284 builds the headline as { id, topic, axis, one_line } — no recurrence key; the count lives one level up on weaknesses[0].recurrence (live value 2). Live drills.json for 2026-08-02: "source": "nemesis headline ×?". setpiece's own selftest fixture (:466) invents `headline: { topic: "chunking", recurrence: 3 }` — a shape the producer has never emitted — which is why this is green.

**Impact**

> Small in size but it is a rendered string on the drill packet he reads, and the missing number is the whole point of the source line (how many times this weakness recurred). It is also a live instance of a selftest fixture diverging from the producer's real schema — the exact bug class learnstate.mjs:104-125 documents having been bitten by twice.

---

### 39. FORGE_SPEC's GATE 2 (cold-reader verify at every LOCK/SAVE) exists only as prose — no code checks it, and 8 of 112 live doubts violate the spec's own named failure patterns

`unwired` · `yellow` · area `forge-exam` · day-one fixable: yes
**where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\learning-layer\\FORGE_SPEC.md:113,:117,:128,:165 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\capsules\\context.json · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\capsules\\embeddings.json · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\capsule_bridge.mjs:116

**Evidence**

> FORGE_SPEC.md:128 and :165 define GATE 2 as a mandatory verify of every doubts[]/bridges[].q against the COLD-READER STANDARD. `grep -rn "cold.reader|GATE 2" scripts/` returns only brain.mjs's unrelated budget gates and one comment at forge_session.mjs:73. capsule_bridge.mjs — the only organ that reads capsules — counts doubts (:116) and never inspects one. Scanning all 112 live doubts against the spec's own examples (:113 forbids dangling ye/woh/Map/second-enemy/(pehle-guess); :117 forbids curriculum/deferral notes) finds 6 cryptic + 2 meta: context.json — "...(pehle-guess)", "ye to inference vali cheez hi hai na?", "second enemy = menu size jo logits se banta?", "ye per step compute cost yaad nahi rehti...", "chop/summarize/RAG kaise chalta - nahi seekhna?"; embeddings.json — "Map kaunsa hai? Ye map kya cheez hai?", "Yeh semantic SEARCH hai?", "IVF aur HNSW - kacha samajh, kitni depth?". Four are verbatim the examples the spec cites as failures. Otherwise the capsules are well-formed: all 4 carry id/lockedOn/status/faultLines with 9 axes each, every faultLine has axis/title/strike/weld/status/deep, all 36 axes graded "held" — the schema itself is clean.

**Impact**

> The spec's own root-cause note says ~1/3 of doubts were cryptic before the standard was written, and named a "cure-half: 4 capsule-remediation threads" as the follow-up. Two of the four capsules still carry the defects, and nothing in the machine can ever notice — the tape_room and doubtminer surfaces will keep serving "ye to inference vali cheez hi hai na?" to a cold future-Nikhil who has no idea what "ye" was.

---

### 40. course.mjs is 670 lines of fully dead code — no task, no npm script, no import, no skill reference, and course.json has never existed

`dead-code` · `yellow` · area `forge-exam` · day-one fixable: yes
**where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\course.mjs:70 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\package.json · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\.claude\\skills\\learn\\SKILL.md:47

**Evidence**

> grep for "course.mjs" across the repo returns hits only inside course.mjs itself and the generated bundle. `grep -c course package.json` -> 0 (not in scripts, not in organism:selftest, not in squad:selftest). No ArsenalFC-* task references it (all 46 actions enumerated). `ls dressing-room/state/course.json` -> No such file or directory. `node scripts/course.mjs status` -> "course: nothing ingested yet". Its own selftest is green (44 passed). The /learn skill's `track = course` branch (.claude/skills/learn/SKILL.md:47-51) describes the ritual in prose and never invokes it. Committed one commit ago (d78a7d8, 1 Aug).

**Impact**

> sprint.json's next_up is "1-05 Anthropic: API Fundamentals · 1-06 Anthropic: Prompt Engineering (9 ch)" — both course-track. The chapter-position tracker built for exactly that is invisible to the skill that will run those sessions, so on 1-05 he will be asked where he is instead of being told.

---

### 41. The scorer's slip evidence says "N rep(s)" while N is the number of distinct CONCEPTS touched, understating every multi-rep day

`lying` · `note` · area `forge-exam` · day-one fixable: yes
**where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\scorer.mjs:498-505 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\twin.mjs:93 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\slip.jsonl

**Evidence**

> scorer.mjs:498-505 builds repsByDate[d] as a Set of concept names and passes world.repsOnDate = repsByDate[today].size. twin.mjs:93 renders evidence = `${world.repsOnDate} rep(s)`. Live proof: reps_log.jsonl holds THREE reps on 2026-07-31 (14:36 hallucinations/a, 14:46 hallucinations/c, 17:48 hallucinations/a) and the slip row reads {"date":"2026-07-31","type":"floor_touched","hit":true,"evidence":"1 rep(s)"}.

**Impact**

> The hit/miss verdict is unaffected (both use >0), so nothing resolves wrongly. But the slip is the ledger the whole calibration metabolism is read from, and its human-facing evidence string is systematically wrong on any day he drills one concept repeatedly — which is exactly what a FORGE day looks like.

---

### 42. The teaching contract's 5-line cap can silently amputate the CONTEXT WARNING, and today's state sits exactly on the boundary

`broken` · `note` · area `forge-exam` · day-one fixable: yes
**where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\teaching_contract.mjs:136-144,:217-225

**Evidence**

> teaching_contract.mjs:144 `return L.slice(0, MAX_BLOCK_LINES)` with MAX_BLOCK_LINES = 5. The block is header(1) + show_n rules + link-back line(1, present whenever sprint.progress.done is non-empty — live it holds 3 entries) + warning(1). With the live show_n = 2 that is exactly 5, so the warning survives by one line. At show_n = 3 the total is 6 and slice() drops the LAST element — the CONTEXT WARNING. The anti-wall selftest (:217-225) asserts worst <= MAX_BLOCK_LINES at show_n = 4, which the slice guarantees, so it passes while proving the warning is gone.

**Impact**

> The organ's two purposes are the rules and the warning, and the truncation order silently sacrifices the warning — the one he asked for by name. It survives today only by the coincidence of show_n being 2.

---

### 43. shipped.mjs selects commits by committer date but reports author date

`broken` · `note` · area `forge-exam` · day-one fixable: yes
**where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\shipped.mjs:122-124

**Evidence**

> shipped.mjs:122-124: `const since = day + " 00:00:00"` fed to `git log --since/--until` (which filter on COMMITTER date by default) while the format string is "C%x09%H%x09%aI%x09%s" — %aI is the AUTHOR date. After any rebase, amend or cherry-pick the two diverge.

**Impact**

> Currently inert: parseGitLog stores a per-commit `date` but summarise() surfaces only subjects and counts, so no wrong date reaches shipped.json today. It becomes a live wrong-day report the moment any consumer starts reading the per-commit date.

---

### 44. The night shift stamps poster / wall_insights / gemini_wall with YESTERDAY's date; viz reads TODAY's. Three nightly LLM renders have reached nobody since 26 Jul.

`unwired` · `red` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:618,647,666 · C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\brain.mjs:441-446,819,885

**Evidence**

> brain.mjs:819 `const today = shiftDay(job, now, cfg);` and brain.mjs:885 `writeAtomic(join(OUT_DIR, job.out || job.id, today + ".md"), r.text)`. shiftDay (brain.mjs:441-446) returns YESTERDAY for any `window:"overnight"` job run at hour <= 7. All three render jobs are overnight (brain_config.json: `maidan_poster`→out `poster`, `gemini_render`→out `gemini_wall`, `wall_insights`, all `"window":"overnight"`), and the night shift fires 02:40-03:00 IST. viz.mjs reads the CALENDAR date with no lookback: viz.mjs:618 `join(STATE_DIR,"brain_out","poster", today + ".md")`, viz.mjs:647 `..."wall_insights", today + ".md"`, viz.mjs:666 `..."gemini_wall", today + ".md"` where `today = localDate(now)`. On-disk proof: `brain_out/poster/2026-07-31.md` has mtime `Aug 1 02:58`; `wall_out/wall_insights/2026-07-31.md` mtime `Aug 1 02:50`; `gemini_wall/2026-07-31.md` mtime `Aug 1 02:54` — every file one day behind its own write time. The last time a fold succeeded is frozen on disk: `club/poster.svg` and `club/wall_gemini.html` are both mtime `Jul 21 23:38` — i.e. the last night the pre-shiftDay calendar stamp still matched. brain_ledger count since 26 Jul: 9 successful runs, 564,400 tokens (wall_insights 3 / 140,423 · gemini_render 3 / 169,010 · maidan_poster 3 / 254,967).

**Impact**

> Half a million Max-plan tokens a week are spent on the three most visual things the organism makes — the match poster, the Gemini-painted wall, and 'The read' (the ≤3 validated insight lines) — and all three are written to filenames viz can never open. wall.html right now has no poster card and no 'The read' panel at all; the shelf instead prints 'the shelf is empty right now — the night shift stocks it while you sleep', which is false: the night shift stocked it under yesterday's name. This is the single largest waste in the area and it started with the 25 Jul shiftDay fix, so it has been silent for 8 days.

---

### 45. post_match/ has never existed, so the KAL-line — the emotional spine of every surface — is null everywhere, and the RED-day wall degenerates to one hardcoded sentence.

`unwired` · `red` · area `output-surfaces` · day-one fixable: no
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:596-616,352-355 · C:\Users\nikhi\GitHub\arsenal-ai-fc\setup\WALLPAPER.ps1:33 · C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\postmatch.mjs (no scheduled task)

**Evidence**

> `ls dressing-room/state/post_match` → 'No such file or directory'. postmatch.mjs is its sole writer and is on NO scheduled task (44 ArsenalFC-* tasks enumerated; none runs postmatch.mjs) — only `npm run postmatch`, the /full-time skill, and dugout's `run_postmatch` voice tool reach it, and none has ever fired. Downstream: viz.mjs:596-601 scans `post_match/<date>.md` for `/KAL-?LINE\s*→\s*(.+)/i` → `kal_line: null` in wall_data.json; viz.mjs:604-616 builds `commitments` from the same directory → `"commitments": []`; renderCommitments (viz.mjs:283) returns "" when empty, so the panel never exists. The RED branch is `body = kal + panel("Today", ...)` (viz.mjs:352-355) — with kal empty that is literally one fixed sentence, 'Rotation day. One five-minute floor-touch is the whole match.', identical on every RED day. WALLPAPER.ps1 falls through to a hardcoded string: `else { $g.DrawString("KAL  >  one green ball, first thing.", ...) }` — and that is exactly what the rendered wallpaper.png says today. voiceBrief (viz.mjs:404) drops its KAL line too.

**Impact**

> Every surface in this area is built around 'his own words, first' — the wall's amber banner, the desktop wallpaper's headline, the Commitments panel, the voice brief, the /matchday script's line 1. All of them are running on a placeholder or absent entirely. The wallpaper he sees before he has decided to look at anything is a generic motivational string, not a commitment he made. And on a RED day the wall he is told to open shows him one canned sentence and nothing else — no date-specific content whatsoever.

---

### 46. season.json has never existed and renderSeason has no awaiting-blood branch — the wall and the desktop print 'matches 0 · cabinet 🔒' as measured fact, breaking viz's own NEVER-FAKE law.

`lying` · `red` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:80-84,180-195 · C:\Users\nikhi\GitHub\arsenal-ai-fc\setup\WALLPAPER.ps1:39-43

**Evidence**

> `ls dressing-room/state/season.json` → 'No such file or directory'. viz.mjs:81 `matches_played: season ? safe(season.matches_played, 0) : 0` and `trophy_state: season ? safe(season.trophy_state,"unlit") : "unlit"` — a missing file collapses to the same value as a measured zero. Unlike every other panel, renderSeason (viz.mjs:180-195) has NO `awaiting(...)` branch; it always renders. Rendered wall.html text today: 'Season / 0 / matches played / 0 / doubts retired · 112 rematches waiting / 14% / weekly consistency / 🔒 / the cabinet unlit'. The same numbers are burned onto the desktop by WALLPAPER.ps1:41 → wallpaper.png reads 'matches 0    doubts retired 0    weekly consistency 14%'. viz.mjs's own header states the constitutional law: 'NEVER FAKE DATA — empty states render as honest, handsome "awaiting blood" panels'. Compare renderCalibration (viz.mjs:154) and renderDerby (viz.mjs:174), which DO degrade honestly ('awaiting blood — calibration flows in with your first reps').

**Impact**

> The one panel with no honest-empty state is the one that scores him. Both his wall and his desktop wallpaper assert three zeros and a locked trophy cabinet as if the system had counted and found nothing, when in truth the counter has never been created because postmatch has never run. For an ADHD-PI captain whose whole surface strategy is ambient dopamine, the ambient message is currently 'you have played zero matches'.

---

### 47. The 'Gemini render' button has no freshness gate and currently links to a 12-day-old artifact — the exact bug the poster fix cured, left uncured one line away.

`lying` · `red` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:664,257 (compare the working gate at viz.mjs:270-274,662)

**Evidence**

> viz.mjs:664 `data.media.gemini_render = existsSync(join(CLUB_DIR, "wall_gemini.html"));` — a bare existence check on a FIXED, undated filename nothing ever cleans up. renderMedia (viz.mjs:257) then emits `if (m.gemini_render) lanes += btn("wall_gemini.html", "🎨 the Gemini render", C.dim);` with no date shown. On disk: `dressing-room/club/wall_gemini.html` mtime `Jul 21 23:38` — 12 days stale. wall_data.json today says `"gemini_render": true`, and the rendered wall.html contains the live button '🎨 the Gemini render'. This is the identical pattern the 25 Jul audit fixed for the poster twenty lines earlier: viz.mjs:270-274 `posterFlag()` with the comment 'the old gate was `posterOk || existsSync(club/poster.svg)` … the one thing the wall may never do, present stale media as current' — and viz.mjs:662 (`poster: posterFlag(...)`) now correctly reports `"poster": false`.

**Impact**

> The wall presents a July-21 snapshot of his life as 'the Gemini render' with no date, one click away, on 2 August. Because the poster half of the same fix works, the surface looks honest while the other half quietly lies — the worst combination. Combined with finding #1 this is self-inflicted twice: the fresh render exists (gemini_wall/2026-07-31.md), it just can't be found, so the stale one keeps being offered.

---

### 48. 'weekly consistency' counts any struggle verdict that isn't no_data — so a spinning day scores and a 60-minute day doesn't. It reads 14% for a week with 225 wall-minutes across 5 days.

`lying` · `yellow` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:72-74 (rendered at :180-195, :308, :405)

**Evidence**

> viz.mjs:72-74: `const days = (history||[]).slice(-7); const weekly_consistency_pct = days.length ? Math.round(100 * days.filter(d => d.struggle && d.struggle !== "no_data").length / days.length) : null;` — the comment one line above claims 'won-days / days-elapsed'. The actual source of `struggle` is pitch_read, which returns no_data below a rep threshold: pitch_read.json today has `"struggle": {"verdict":"no_data","basis":"0 reps today (< 6)"}`. pitch_read_history.jsonl's last 7 rows: 07-25 (15 min, no_data), 07-26 (60 min, no_data), 07-29 (45 min, no_data), 07-30 (15 min, no_data), 07-31 (75 min, **spinning**), 08-01 (15 min, no_data), 08-02 (0 min, no_data) → 1/7 = 14%. So the only day that COUNTED toward 'consistency' is the day the organism labelled him as spinning in circles, and the 60- and 75-minute days that logged <6 reps counted as nothing.

**Impact**

> Given 9 reps in the system's entire life, `struggle` is structurally no_data almost every day, so this metric is pinned near zero regardless of how much he actually works — and it inverts, rewarding a bad day and discarding good ones. It is printed on the wall, burned into the desktop wallpaper, folded into the NotebookLM film kit ('Weekly consistency: 14%') and spoken in the voice brief. It is the only percentage on any surface, and it is wrong in both directions.

---

### 49. The Boot Room's entire weekly output is a console line into a cmd window that closes — no log, no state file, no ledger row. Nobody can tell whether it ran.

`unwired` · `yellow` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\bootroom.mjs:245-268 · scheduled task \ArsenalFC-BootRoom (no log redirect) · C:\Users\nikhi\GitHub\arsenal-ai-fc\.claude\skills\genome\SKILL.md:7

**Evidence**

> Scheduled task \ArsenalFC-BootRoom = `cmd /c cd /d C:\Users\nikhi\GitHub\arsenal-ai-fc && node scripts\bootroom.mjs`, weekly Sun 20:00, last run 26-07-2026 20:10:48, Last Result 0. Unlike ArsenalFC-Calibration / FSRS / Nemesis / LearningState / Goalkeeper / TimeAuditor, there is NO `>> …\scripts\bootroom.log 2>&1` redirect. With 9 reps and `speak_gates.bootroom_mutation: false` in loop_vitals.json (physio.mjs:375 `world.reps.length >= cfg.gates.bootroom_min_reps`, threshold 200 per physio.mjs:603), main() takes bootroom.mjs:259-264 → proposeFromEvidence returns `{proposal:null, reason:"speak-gate closed (volume) — no proposal, honestly"}` and the only effect is `console.log`. bootroom writes nothing: `dressing-room/state/mutations.jsonl` does not exist, `SEASON_CHANGELOG.md` does not exist. The /genome skill's step 1 is 'Read dressing-room/state/mutations.jsonl' — a file that has never existed.

**Impact**

> The organ is correctly starved (200-rep gate, 9 reps — that part is honest and working), but its honesty is broadcast into the void. No surface, log, or state file records that the Boot Room woke up on Sunday and had nothing to say, so 'did the genome run?' is unanswerable, and /organism-doctor's schedule check reads Last Result 0 and calls it green. Every other gated organ leaves a status envelope; this one leaves nothing.

---

### 50. groundsman.mjs is genuinely dead code — zero callers, zero tasks, zero skills. Only a selftest keeps it green.

`dead-code` · `yellow` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\groundsman.mjs · C:\Users\nikhi\GitHub\arsenal-ai-fc\package.json:17,43

**Evidence**

> `grep -rn groundsman scripts/ package.json .github` returns exactly two non-self hits, both npm selftest strings: package.json:17 (inside organism:selftest) and package.json:43 (`"groundsman:selftest"`). No import, no execFile, no schtasks entry among the 44 ArsenalFC-* tasks, no reference in any .claude/skills/*/SKILL.md. Its own header (groundsman.mjs:26-28) documents modes `heartbeat` / `night --host <id>` / `status` — the Kennel loop — and CYBORG_BRAIN.md:203 lists it as 'M9 — THE KENNEL', an unbuilt milestone. `bus_lease.json` does not exist in dressing-room/state/. groundsman selftest passes 100%, including 'ONE OFF-LIST PATH IN THE INDEX ABORTS THE PUSH'.

**Impact**

> 18KB of carefully-built, fully-selftested git-push-safety machinery guarding a Pi that does not exist. Not harmful — but it is counted as 'BUILT' in ORGANISM_ANATOMY.md:383 and ORGANISM_LEDGER.md:211, which inflates the organism's apparent surface area and costs a selftest slot in every CI run.

---

### 51. The Wind Tunnel writes a nightly gate recommendation that no organ reads and no surface shows.

`unwired` · `yellow` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\brain_out\nightshift\gate_tune_*.md (sole writer scripts\nightshift.mjs; no reader in repo)

**Evidence**

> nightshift produces `brain_out/nightshift/gate_tune_<date>.md` every night (files for 07-20, 07-21, 07-26, 07-31, 08-01) and `wind_tunnel_<date>.json`. `grep -rn "gate_tune|wind_tunnel" scripts/ .claude/skills` returns hits ONLY inside nightshift.mjs itself — no reader anywhere. The content is actionable: gate_tune_2026-07-26.md carries `PROPOSED: {"tau0":0.2,"tau1_base":0.36,"epsilon":0.04,"budget_k":0.35}` / `REVERT: {"tau0":0.25,...}` / 'Apply → watch 14 days → keep only if wakes/day sits in [1, 8]' — and it reports 'current tiers: 0.11 wakes/day', i.e. an order of magnitude below its own healthy band. The two most recent files (07-31, 08-01) are 113 bytes and say only 'GATE HEALTHY … current score 56, best grid 54'.

**Impact**

> The organism replays thousands of real gate decisions every night, forms an opinion about its own attention threshold, files it, and nobody — not the wall, not the sheet, not ntfy, not /organism-doctor — ever surfaces it. Note the ground truth: 2 tier-2 wakes across 5,244 moments. The one artifact that would have flagged that is written and left in a folder he has no reason to open.

---

### 52. The wall's one-click lanes fire-and-forget an async clipboard write — a rejected write opens NotebookLM/Gemini with an empty clipboard and says nothing.

`broken` · `yellow` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:250

**Evidence**

> viz.mjs:250 injects into wall.html: `function ship(t,u){try{navigator.clipboard.writeText(t)}catch(e){};window.open(u,'_blank')}`. `writeText` returns a Promise; the synchronous try/catch cannot catch its rejection, and `window.open` runs unconditionally on the next statement regardless of outcome. The buttons are labelled with an explicit promise to the user (rendered in wall.html today): '🎬 season film — opens NotebookLM, source already copied: paste → Video Overview' and '📽 poster/film prompt — opens Gemini, prompt copied: paste → send'.

**Impact**

> wall.html is opened from `file://`. If the clipboard write is denied or the document loses focus during `window.open`, the tab opens, he hits Ctrl+V into NotebookLM, and gets whatever was on his clipboard before — with the wall having just told him in writing that the source was already copied. Silent failure on the only two action buttons on the whole surface.

---

### 53. The brain panel's 'overnight' bucket structurally cannot contain last night — it only ever counts today's own 00:00-08:00 and 22:00-24:00.

`broken` · `note` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:85-87,213

**Evidence**

> viz.mjs:86-87: `const todayCalls = (brainLedger||[]).filter(l => tsLocalDay(l.ts) === today); const overnight = todayCalls.filter(l => { const h = new Date(l.ts).getHours(); return h >= 22 || h < 8; });` — the overnight filter is applied AFTER the same-local-day filter, so a call made at 23:00 last night is excluded from today entirely. The panel is titled 'The brain — got sharper while you slept' (viz.mjs:213). Right now wall.html reads '0 call(s) today · 0 overnight' and '0 tokens metabolized' — the wall was rendered 01:47 IST and the only Aug-2 ledger row (season_review, 42,208 tokens) landed at 01:54 IST, seven minutes later.

**Impact**

> On the 08:50 morning wall — the one he is actually told to open — the panel that exists to show him the machine worked while he slept can only ever report the sliver of overnight between midnight and 08:50, and never the 22:00-23:59 half of the shift that the config itself defines as overnight. Combined with the 3x-daily render schedule, the morning wall systematically undercounts the night's work.

---

### 54. wall_data.json embeds a stale copy of itself via veo_text — the file WALLPAPER.ps1 parses is ~4x larger than it needs to be and contains two versions of every number.

`broken` · `note` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:300-301,660-661 · dressing-room\state\wall_data.json

**Evidence**

> viz.mjs:661 `data.media.veo_text = pack["season_film.md"]`, and promptPack (viz.mjs:301) inlines `JSON.stringify(data, null, 1)` — a full dump of `data` taken BEFORE filmkit_text/veo_text/gemini_render were attached. Result in dressing-room/state/wall_data.json: the top-level document, plus `media.filmkit_text` (the whole film kit), plus `media.veo_text` containing a complete nested JSON copy whose `media` block reads `{teamtalk_am,teamtalk_pm,poster,filmkit}` only. 6,714 bytes for ~1.6KB of actual state.

**Impact**

> Every reader of wall_data.json now parses a document containing a second, subtly-different copy of every field. WALLPAPER.ps1:12 does `ConvertFrom-Json` on it and drives the desktop from it. Nothing is broken today, but any future path query that isn't perfectly anchored can pick up the shadow copy, and the duplication makes diffing the state bus useless.

---

### 55. The mirror is healthy — but its id list is a hardcoded 4 and it will report 'all ok' forever while new capsules go unmirrored.

`waiting` · `note` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\mirror_config.json · C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\mirror.mjs:39,78

**Evidence**

> Live read-only fetch just now: all four gist files return HTTP 200 and the sha256 of the remote bytes matches the local copy exactly — tokenization 41,452 B / 26 doubts, embeddings 58,547 B / 35, inference 61,272 B / 36, context 49,722 B / 15 (total 112, which is exactly the wall's '112 rematches waiting' and doubt_grammar's total_doubts). mirror_manifest.json reports 4/4 ok, generated 2026-08-01T17:10Z. mirror selftest passes 13/13. The limitation: mirror_config.json `"ids": ["tokenization","embeddings","inference","context"]` and mirror.mjs:39 DEFAULTS carry the same fixed list; pull() iterates `cfg.ids` only (mirror.mjs:78) — there is no listing of the gist, so a fifth locked capsule is invisible and `status` still reads 'ok'.

**Impact**

> Nothing is wrong today. But the mirror is the afferent nerve for five downstream mechanisms (decoy map, lexicon, tape room, derby seeds, set-piece rematches), and the day a fifth concept locks, it will keep saying 'all ok' while feeding them four. Silent under-supply, reported as health.

---

### 56. The away-day CI lane is one commit away from going red: package.json now runs conductor.mjs's selftest, and conductor.mjs is untracked and not gitignored.

`broken` · `note` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\package.json:17 (working copy) · C:\Users\nikhi\GitHub\arsenal-ai-fc\.github\workflows\awayday.yml:29 · scripts\conductor.mjs, scripts\limits.mjs (untracked)

**Evidence**

> `.github/workflows/awayday.yml` runs on push to main + nightly cron 21:30 UTC: `npm ci` then `node scripts/awayday.mjs run`, which executes ci_manifest.json's two jobs — `npm run organism:selftest` and `npm run squad:selftest`. `git diff package.json` shows organism:selftest was just extended with `&& node scripts/conductor.mjs selftest`. `git ls-files scripts/conductor.mjs scripts/limits.mjs` → 0 files tracked; `git check-ignore -v` on both → no match (exit 1), so they are untracked, not ignored. `git show HEAD:package.json | grep -c conductor` → 0, so the lane is green today only because the package.json change is also uncommitted.

**Impact**

> The moment package.json is committed without conductor.mjs in the same commit, every push and every nightly away-day run dies on 'Cannot find module conductor.mjs' — and the workflow header itself records that this exact class of red ('~24 red emails … trained everyone to ignore CI') already happened once on 15-29 Jul.

---

### 57. The /matchday skill's only instruction for opening the wall is a broken Windows path — the backslashes are missing from the source file.

`broken` · `note` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\.claude\skills\matchday\SKILL.md:20-21

**Evidence**

> `.claude/skills/matchday/SKILL.md:20`, verified with cat -A (no escape characters present in the file): ``on his Windows box say `start dressing-roomclubwall.html` (cmd) or just`` — the literal string is `dressing-roomclubwall.html`, not `dressing-room\club\wall.html`. Line 21 offers the fallback 'double-click club/wall.html', which is also wrong: the file lives at `dressing-room/club/wall.html`, not `club/wall.html`.

**Impact**

> Every morning kickoff ends with 'a reminder to open the wall' followed by a command that errors and a folder path that does not exist from the repo root. The wall is the daily-consumption surface the whole area exists to feed, and its documented doorway is broken in both forms offered.

---

### 58. council.mjs and fuelboard.mjs are wired but effectively unreachable as surfaces — council rides a tier-2 wake path that has fired twice ever; the fuelboard's gauge is in no task and no skill.

`starved` · `note` · area `output-surfaces` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\cortex.mjs:38,296 · C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\fuelboard.mjs:355 · C:\Users\nikhi\GitHub\arsenal-ai-fc\.claude\skills\organism-doctor\SKILL.md:12-20

**Evidence**

> council is NOT dead code — cortex.mjs:38 `import { convene, councilSection } from "./council.mjs"` and cortex.mjs:296 convenes it inside the deep-wake path. But that path only runs on a tier-2 wake, and the salience ledger shows 2 tier-2 wakes across 5,244 moments; `dressing-room/state/council_flag.json` (the disagreement→set-piece-drill bridge described in council_config.json's _doc) has never been created. fuelboard is likewise a live library — dmn.mjs:53 `import { loadBoard, headroomOf, recordUse, record429, stateOf }`, dugout.mjs:69 `import { summary as tankSummary, loadTankConfig }`, dugout.mjs:2905/2911 shell out to `fuelboard.mjs use` — but its human surface, the 7-bar gauge (`node scripts/fuelboard.mjs status`, fuelboard.mjs:355), appears in no scheduled task and in no .claude/skills/*/SKILL.md (grep across all skills returns nothing), only in prose in THE_PEAK_PROTOCOL.md:139,170.

**Impact**

> Both selftest green and both are honestly built; neither is dead. But 'the parallel specialist lenses' have convened at most twice in the organism's life, and the fuel gauge — the thing that tells him which of seven free-tier accounts is empty — is a command he must remember from a document. /organism-doctor, the skill whose whole job is 'is the body okay', never checks it.

---

### 59. course.mjs — 670 lines, zero invocation, output file has never existed

`dead-code` · `red` · area `dead-and-lying` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\course.mjs (whole file, 670 lines); consumer gap at scripts/course.mjs:70

**Evidence**

> `ls scripts/*.mjs | wc -l` = 56. For course.mjs: no ArsenalFC-* scheduled task (full `schtasks /query /v` dump checked), no package.json entry, no .claude skill, and the precise invocation-graph scan (import / execFileSync / spawnSync / conductor args) returns `course.mjs — NO CODE REFERENCE`. Its declared product does not exist: `ls dressing-room/state/course.json` → `No such file or directory`. Repo-wide grep for `course.json` hits only scripts/course.mjs itself (lines 5, 47, 70, 236, 376, 380, 400, 567, 610). scripts/course.mjs:70 `const STATE = join(STATE_DIR, "course.json");`

**Impact**

> The organ was built (1 Aug 2026) to close the stated five-hour hole in his Python anchor — its own header: "Every organ that plans his day has been planning around a five-hour hole and calling it a plan." That hole is still open. The code exists, has never run once, and no organ can reach it. It is also not in either selftest suite, so `npm run organism:selftest` / `squad:selftest` stay green while it rots.

---

### 60. The team sheet has said "Matchday 1 · Introduction" every day of its life — the counter reads a file whose only writer has never run

`broken` · `red` · area `dead-and-lying` · day-one fixable: no
**where:** scripts/manager.mjs:146-148, :189, :91-96 · scripts/postmatch.mjs:39-41 · no scheduled task

**Evidence**

> scripts/manager.mjs:147 `const mp = Number.isInteger(S.matches_played) ? S.matches_played : 0;` where `S = bus.season || {}` (line 146) and `season: readJSON("season.json")` (line 58). `ls dressing-room/state/season.json` → No such file or directory. Therefore mp is permanently 0, and manager.mjs:189 `matchday: mp + 1` is permanently 1; manager.mjs:91-96 `phaseFor(mp)` returns `{key:"introduction", name:"Introduction"}` for `mp <= 1`, forever. Live proof, dressing-room/state/team_sheet.md line 1: `⚪🔴 TEAM SHEET — 2026-08-01 · Matchday 1 · 🤝 Introduction` and line 4: "I don't know you yet". The sole writer of season.json is postmatch.mjs (scripts/postmatch.mjs:40 `const SEASON = join(STATE_DIR, "season.json");`, header line 27 "OUTPUT: post_match/<date>.md · season.json · notebook.json · routed_balls.json") — and there is NO ArsenalFC-PostMatch scheduled task in the 44-task dump.

**Impact**

> The single number the Gaffer leads with is not a measurement — it is a constant standing in for a measurement, and it is the one the whole voice is keyed to. The phase ladder (Introduction → Building Trust → Partnership → Brotherhood) can never advance, so the sheet will keep opening with "I don't know you yet" on matchday 500. The same absence blanks `days_to_ship`, `trophy_state`, `paused_until` (manager.mjs:191-198) and the KAL-line (manager.mjs:71 `last_post_match: readText(join("post_match", yday + ".md"))`, manager.mjs:186). Six other organs read the same phantom family and silently default: viz.mjs:582 + :610 (kal_line, commitments — `next_result` always null), viz.mjs:587 (season), viz.mjs:637 (notebook.json for the film kit), scorer.mjs:508, scout.mjs:240 (war-room taper never fires), dugout.mjs:441 + :934 + :1106, shipped.mjs:31.

---

### 61. The shadow organ has never scored a single shadow — its ledger file has never been created, and the Dugout reads it every session

`broken` · `red` · area `dead-and-lying` · day-one fixable: yes
**where:** scripts/shadow.mjs:236 (only writer of proactivity_ledger.json) · scripts/postmatch.mjs:269 (only caller of `score`) · scripts/dugout.mjs:540, :166, :1082 (readers of the file that never exists) · dressing-room/state/shadow_log.jsonl

**Evidence**

> dressing-room/state/shadow_log.jsonl holds exactly 5 rows, every one `"resolved":false`, oldest 2026-07-18T05:09:47Z, newest 2026-08-01T05:07:10Z. `ls dressing-room/state/proactivity_ledger.json` → No such file or directory. shadow.mjs writes that ledger only in `score` mode (scripts/shadow.mjs:236 `writeAtomic(LEDGER, led)`), and the only caller of `score` is postmatch.mjs:269 `execFileSync(process.execPath, [join(__dirname, "shadow.mjs"), "score"], ...)` — postmatch has no scheduled task and has never run. Meanwhile three live read sites take the missing file: dugout.mjs:166, dugout.mjs:540 `buildProactivitySection(led = readJson(join(STATE_DIR, "proactivity_ledger.json")))`, dugout.mjs:1082. `detect` fires only from dugout.mjs:2816 `setInterval(... shadow.mjs detect ..., 600000)` — i.e. only while the Dugout web server happens to be running.

**Impact**

> The whole point of this organ is that the machine earns the right to speak by a measured hit-rate — scripts/shadow.mjs:34 `const VOICE_GATE = { min_shadows: 10, min_hit_rate: 0.7 };  // proven, not vibes`. With scoring never run, `e.shadows` stays 0 for every type, `eligible` (shadow.mjs:115) is false forever, and `ratifyType` (shadow.mjs:125) will refuse with "not proven yet — 0/10 shadows" for the rest of the system's life. The proactivity section of every Gaffer session is silently blank. Five real moments where the organism knew it should have spoken — including "no reps by late morning" twice — are sitting unjudged.

---

### 62. allowedNumbers has drifted into three implementations; the 25 Jul zero-hallucination fix landed in one of them

`lying` · `red` · area `dead-and-lying` · day-one fixable: yes
**where:** scripts/brain.mjs:509-519 (esp. :518) · scripts/viz.mjs:123-132 (esp. :131) · reference implementation scripts/manager.mjs:285-320

**Evidence**

> Three separate implementations: scripts/manager.mjs:285 `function allowedNumbers(F, shown = "")`, scripts/brain.mjs:509 `function allowedNumbers(data)`, scripts/viz.mjs:123 `function allowedNumbers(data)`. manager.mjs was fixed and carries the reasoning at :313-318 — "this used to whitelist EVERY integer 0-31 — which is precisely the range a hallucinating LLM fabricates (card counts, day counts, rep counts, streaks, small percentages)… Shrunk to 1-3" — ending in manager.mjs:319 `for (let i = 1; i <= 3; i++) set.add(String(i));`. The other two were never touched: brain.mjs:518 `for (let i = 0; i <= 31; i++) s.add(String(i));` and viz.mjs:131 `for (let i = 0; i <= 31; i++) s.add(String(i));`. manager.mjs also eats negative magnitudes (:292) and the assembled prompt (:308 `eat(shown)`); neither brain nor viz does either.

**Impact**

> They disagree on the same question. Text the Manager would bounce, brain.mjs's `no_new_numbers` waves through — and brain's validator guards exactly the outputs that reach him in his own ear: `day_cartridge` and `midday_cartridge` (injected verbatim into the Dugout's system instruction) and `teamtalk_am` / `teamtalk_pm`, which brain.mjs:888-895 renders to mp3 via speak.mjs. So a fabricated "12 reps", "9 overdue", "3-day streak" — the exact class the manager's own comment names — passes and gets spoken aloud. viz.mjs:136 `validateInsights` has the same hole on the wall. The repo advertises the opposite: the system prompt's claim that the validator will bounce the whole sheet for one invented digit.

---

### 63. The no_new_numbers validator splits comma-grouped thousands and rejects the whole output — 33,824 Opus tokens discarded on 31 Jul

`broken` · `red` · area `dead-and-lying` · day-one fixable: yes
**where:** scripts/brain.mjs:520-524 · scripts/viz.mjs:134-141 · casualty in dressing-room/state/brain_ledger.jsonl @ 2026-07-31T16:30:28.284Z

**Evidence**

> scripts/brain.mjs:520-524 `noNewNumbers` strips only dates and clock times, then matches `/\d+(\.\d+)?/g`. Proof run: `'the wall shows 10,000 tokens'.replace(/\d{4}-\d{2}-\d{2}/g,'').replace(/\d{1,2}:\d{2}/g,'').match(/\d+(\.\d+)?/g)` → `["10","000"]`. The allowed set never contains "000" — allowedNumbers adds `String(v)` for a numeric input (so 10000 → "10000") plus the literals "0"…"31" (brain.mjs:518), and "000" is none of those. Live casualty in dressing-room/state/brain_ledger.jsonl: `{"ts":"2026-07-31T16:30:28.284Z","job":"drill_forge","model":"opus","total_tokens":33824,"ok":false,"error":"validator: invented number: 000"}`. Same regex, same bug, in scripts/viz.mjs:136-139 `validateInsights`, which returns null on any hit — "reject-and-omit", so the wall silently loses all three insight lines.

**Impact**

> Every validated job is one comma away from total loss, and the failure names an invented number that was never invented — the model wrote a number it was given, correctly formatted. On brain jobs the run is discarded after full token cost (33,824 Opus tokens is one confirmed instance; brain.mjs:813's analysis path returns before `writeAtomic`, so nothing is written). On the wall it is worse than loud: viz.mjs:139 returns null and the wall renders without insights, with no line anywhere saying they were rejected. And it compounds with the drift above — brain's set is the loose 0-31 one, so it lets fabrications through while bouncing honest thousands.

---

### 64. Eight brain jobs write to directories no line of code opens — 3,116,897 tokens

`unwired` · `red` · area `dead-and-lying` · day-one fixable: no
**where:** dressing-room/state/brain_config.json job ids: midday_reread, capsule_premap, lexicon_mine, doubt_clusters, deep_twin, drill_forge, season_review, widget_spec, market_scan · output dirs under dressing-room/state/brain_out/

**Evidence**

> Ledger aggregation over dressing-room/state/brain_ledger.jsonl by job id, cross-checked against a repo-wide grep for each `brain_out/<dir>` in scripts/, .claude/ and brain_config.json inputs: midday_reread→midday 1,121,460 tok · capsule_premap→premap 609,504 · lexicon_mine→lexicon 514,893 · doubt_clusters→doubts 338,141 · deep_twin→twin 238,210 · drill_forge→drill_forge 186,841 · season_review→season 48,781 · widget_spec→widget_spec 46,064 · market_scan→market 13,003. Total 3,116,897. The only brain_out dirs with a real runtime consumer are: nightshift (dugout.mjs:1088, :1128), dugout (hippocampus.mjs:284, nightshift.mjs:577), day_cartridge (dugout.mjs:325), scrimmage (dugout.mjs:364), poster/wall_insights/wall_review/gemini_wall (viz.mjs:618, :647, :655, :666), plus dugout_digest and evening_voice which are consumed only as inputs to other brain jobs (brain_config.json:75, :404-405). dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md:383 already recorded this at 2,129,645 tokens on 31 Jul; the number has grown ~1M since, so nothing shipped.

**Impact**

> Roughly 43% of the LLM budget produces text that reaches nobody — and the most expensive job in the entire organism is one of them: midday_reread burns ~159k tokens per run (7 runs, 1,111,623 tokens since 26 Jul) into brain_out/midday/, which has no reader in scripts/, no reader in .claude/, and is not an input to any other job. Its config note claims "Acts through files only — analysis for the wall and the evening"; the wall reads brain_out/wall_insights, not brain_out/midday. That note is the organ lying about its own wiring.

---

### 65. pulse.json's status field is a string literal — the heartbeat can never report anything but "ok"

`lying` · `yellow` · area `dead-and-lying` · day-one fixable: yes
**where:** scripts/heartbeat.mjs:191-192

**Evidence**

> scripts/heartbeat.mjs:186-199 `function buildPulse({agents, bus, buckets, ladderCfg, now})` returns an object whose second and third fields are `status: "ok",` (line 191) and `low_confidence: false,` (line 192) — hardcoded, computed from nothing, and buildPulse is the only producer of the file. `agents` (the per-organ exit codes) sits right below them and is never consulted. Live file dressing-room/state/pulse.json line 3: `"status": "ok"`. If all eight agents in the live `order` returned non-zero, the file would still read "ok".

**Impact**

> pulse.json is the heartbeat's public verdict on whether the deterministic squad ran, and its verdict field is a constant. postmatch.mjs:230 reads the file. Anything (or anyone) that branches on `.status` gets a green light unconditionally. The `agents[]` array does carry the truth, so this is a lie by summary rather than by omission — but the summary is the field named `status`.

---

### 66. physio reports status "ok" in the same object where it reports that the organism is bleeding

`lying` · `yellow` · area `dead-and-lying` · day-one fixable: yes
**where:** scripts/physio.mjs:417-418

**Evidence**

> scripts/physio.mjs:415-427 returns `status: "ok", low_confidence: false,` (lines 417-418) immediately followed by `bleeds,` (line 420) and `line: bleeds.length ? bleeds[0].line : null` (line 426). Live dressing-room/state/loop_vitals.json: `"status": "ok"` and `"low_confidence": false` sitting directly above a populated `bleeds` array and `"line": "the scout filed a headline no sheet has carried yet."`

**Impact**

> The physio is the one organ the 31 Jul research called the most valuable thing in the repo, precisely because it detects what selftests and exit codes cannot — and its own headline field is a constant that says everything is fine while its body says otherwise. Concretely it leaks into the LLM: talk.mjs:44 pastes `"VITALS: " + clip(readJson(join(STATE_DIR, "loop_vitals.json")), 400)` straight into the prompt, so the model reads `"status":"ok"` next to a bleed and can reasonably repeat "vitals ok" to him. The code consumers dodge it by luck, not design — dugout.mjs:933 and viz.mjs:102 happen to read `.line` and `.bleeds`, never `.status`.

---

### 67. Three selftest assertions that cannot fail — including two in the brand-new conductor

`lying` · `yellow` · area `dead-and-lying` · day-one fixable: yes
**where:** scripts/dugout.mjs:1689 · scripts/throwin.mjs:256 · scripts/conductor.mjs:200-202

**Evidence**

> Grep for short-circuit and literal-truth patterns across every selftest found exactly three. (1) scripts/dugout.mjs:1689 `assert("REHYDRATOR: memory cartridge rides in front of the transcript tail", buildConfig(["k1"]).rehydrate === null || true);` — `X || true` is unconditionally true; the trailing comment admits it ("composition is null-safe; content asserted in hippocampus selftest") but the suite still counts it as a pass. (2) scripts/throwin.mjs:256 `assert("corrupt poll line skipped, no crash", true);` — literal. (3) scripts/conductor.mjs:201 `ok("ARM — the live queue is untouched by the selftest (no writes at all)", true);` — literal, and it sits directly under conductor.mjs:200 which reads `brain_queue.json` into `before` and then never compares an after-state; the very next line, conductor.mjs:202 `ok(..., before === null || typeof before.jobs_run === "object")`, also passes whenever `before` is null. Same `A && B || A` family as the 25 Jul finding.

**Impact**

> Three green checks that assert nothing, in a suite whose value proposition is stated as "50 of 50 selftests pass, 1,676 assertions, zero failures". The conductor pair is the live one: conductor.mjs is new, untracked, and about to become the morning's orchestrator — its two claims about not clobbering the live brain_queue are exactly the claims you would want proven before scheduling it, and neither is.

---

### 68. lexicon_mine has been rejected on every single run since 26 July — 11 runs, 0 successes, 502,663 tokens

`broken` · `yellow` · area `dead-and-lying` · day-one fixable: yes
**where:** scripts/brain.mjs:534-539 (quotes_only) · brain_config.json job `lexicon_mine` · dressing-room/state/brain_ledger.jsonl

**Evidence**

> Ledger aggregation over brain_ledger.jsonl restricted to ts > 2026-07-26: `lexicon_mine n=11 ok=0 tok=502663`, every failure a `validator: non-verbatim quote:` rejection (samples: `" (4× · context+emb`, `" (×4) — strongest`). The validator is scripts/brain.mjs:534-539 `job.validate === "quotes_only"`, which requires every quoted segment ≥12 chars to appear verbatim in `JSON.stringify(inputData)`. The model is quoting his phrase and then appending its own annotation inside the same quote marks, so the whole output is discarded before the write. Mechanically distinct from the already-known lexicon_mine dead-regex / unwired-output finding: that one is about where the output goes, this is about the output never surviving to be written at all.

**Impact**

> Half a million tokens in seven days on a job with a 0% success rate, and the attempt guard does not save it: max_attempts is per shift, so it retries fresh every night. Because the failure mode is a validator reject rather than a crash, nothing surfaces — `node scripts/brain.mjs status` reports `health OK — 1 failure(s) at the tail of the last 25 call(s)` because the tail happens to be other jobs. The lexicon is his spoken-anchor vocabulary; it has gained nothing in a week.

---

### 69. The hype-phrase guard is applied to machine-side analysis jobs, where the banned words are legitimate technical vocabulary

`broken` · `yellow` · area `dead-and-lying` · day-one fixable: yes
**where:** scripts/brain.mjs:526-528 · cfg.guards.banned_phrases in dressing-room/state/brain_config.json

**Evidence**

> scripts/brain.mjs:526-528 `validateOutput` runs `bannedPhraseCheck(text, cfg.guards.banned_phrases)` on EVERY job unconditionally, before any per-job `validate` key is consulted. Ledger, since 26 Jul: `capsule_premap n=12 ok=8 tok=559651` with `2x validator: banned phrase: exponential` and `2x validator: banned phrase: 10x, exponential`. Across the full ledger the same guard also killed 6 runs on `exponential`, 4 on `10x, exponential`, 2 on `10x`.

**Impact**

> A third of capsule_premap's runs are discarded for using a word that is correct in its own subject matter — the premap reasons about attention and scaling, where "exponential" is a real claim about complexity, not hype. The guard was written for the captain-facing voice (no hype-man, per CLAUDE.md's working-style rules) and is being enforced on machine-to-machine analysis he never reads. Cost so far sits inside 559,651 tokens on that job alone, and the rejected output is written nowhere.

---

### 70. organism_live_demo.mjs — a 1,325-line dead fork of dugout.mjs, still carrying the security guard the live file lacks

`dead-code` · `yellow` · area `dead-and-lying` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\organism_live_demo.mjs (whole file, 1,325 lines)

**Evidence**

> The file's own header (scripts/organism_live_demo.mjs:3) reads `dugout.mjs · ARSENAL AI FC — THE ORGANISM: THE DUGOUT (metamorphosis chamber)` — a copy that was never renamed internally. Invocation scan: `organism_live_demo.mjs — NO CODE REFERENCE`; no scheduled task, no package.json entry, no .claude skill. It duplicates live logic under drifted line numbers: loadDayCartridge at :206 vs dugout.mjs:325, buildProactivitySection at :363 vs dugout.mjs:540, localDate at :171 vs dugout.mjs:290, the shadow spawn at :1229 vs dugout.mjs:2816. dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md:304-308 records the inversion: the dead fork carries an Origin/CSRF guard at :1250-1260 that the live dugout.mjs POST handler does not.

**Impact**

> 1,325 lines of unreachable code that reads as live (its header names it dugout.mjs), so every grep for a Dugout behaviour returns two answers and the stale one looks authoritative. It also pollutes this exact kind of audit — my own state-file consumer map initially credited organism_live_demo.mjs as a writer of calibration.json, scout.json and tape_room.json, which would have read as single-writer-law violations. And it holds the only copy of a security fix that belongs in the live file.

---

### 71. deep_reanalysis would spend Opus reading three files that have never existed

`waiting` · `yellow` · area `dead-and-lying` · day-one fixable: yes
**where:** dressing-room/state/brain_config.json (job deep_reanalysis) · scripts/brain.mjs:797-808 · scripts/brain.mjs:783-789

**Evidence**

> brain_config.json job `deep_reanalysis` declares `"inputs": ["season.json", "notebook.json", "slip.jsonl", "mutations.jsonl", "doubt_grammar.json", "learning_state.json"]` and `"model": "opus"`. Three of those six do not exist: `ls dressing-room/state/{season.json,notebook.json,mutations.jsonl}` → all `No such file or directory`. scripts/brain.mjs:797-808 `gatherInputs` maps a missing path to `null` (`.jsonl` → empty array, `.json` → readJson → null) with no warning, and brain.mjs:787 `buildAnalysisPrompt` renders it as `## INPUT season.json` followed by `null`. The job has never fired — there is no `dressing-room/state/brain_out/reanalysis/` directory — because it is `"trigger": "reanalysis"` and its arming path is postmatch, which has never run.

**Impact**

> Half the evidence base of the organism's deepest, most expensive re-read is structurally absent, and the job would run anyway and produce a confident narrative from nulls. Its declared `out` is `reanalysis`, which nothing reads either. This is the general shape of the silent-null problem: gatherInputs has no notion of a required input, so any job can lose most of its evidence and still bill full price and report ok.

---

### 72. selfknowledge.mjs runs on a schedule to produce an 88KB file both of whose consumers were deleted on 29 July

`unwired` · `yellow` · area `dead-and-lying` · day-one fixable: no
**where:** scripts/selfknowledge.mjs:32 · scripts/dugout.mjs:1280 (the deleted consumer) · scheduled task \ArsenalFC-SelfKnowledge

**Evidence**

> scripts/selfknowledge.mjs:32 `const SELF = join(STATE, "organism_self.md");` and :18 "WRITES: dressing-room/state/organism_self.md (own file). Metered to brain_ledger." Repo-wide grep for `organism_self` outside that file returns only scripts/dugout.mjs:1280 — a tombstone comment: "selfKnowledgeBlock() lived here until 29 Jul 2026. It pasted organism_self.md…" — and dugout.mjs:1323 saying the same. The file is 88,950 bytes, last written 29 Jul 19:55. The task `\ArsenalFC-SelfKnowledge` is still installed (`cmd /c cd /d C:\Users\nikhi\GitHub\arsenal-ai-fc && node scripts\selfknowledge.mjs`) and the ledger shows `selfknowledge n=5 tok=80078`. Already recorded at dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md:382 on 31 Jul and unfixed since.

**Impact**

> A scheduled LLM job whose entire product has no reader. Distinct from the two selfknowledge items already in flight (the stderr swallow at :108 and the un-runnable task settings) — those are about whether it runs; this is about the fact that it should not, until something consumes it. Every run bills tokens for a file nothing opens.

---

### 73. Full 56-script invocation inventory — the complete (a)/(b)/(c)/(d)/(e) answer

`dead-code` · `note` · area `dead-and-lying` · day-one fixable: yes
**where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\ (56 .mjs) · dressing-room\state\heartbeat_config.json · .claude\settings.json · .mcp.json · .github\workflows\awayday.yml

**Evidence**

> Method: full `schtasks /query /fo csv /v` dump filtered to ArsenalFC-*, package.json scripts block, .mcp.json, .claude/settings.json hooks, .claude/skills/*, .github/workflows/, setup/*.ps1|*.cmd, plus a per-file scan classifying every cross-reference as IMPORT / SPAWN / conductor-args / prose-ref. (a) SCHEDULED TASK: brain, bootroom, calibration, capture, context, cortex, distiller, dmn, doubtminer, examiner, fsrs, heartbeat, hippocampus, learning_state, mirror, nemesis, nightshift, oura_coach, physio, presence, scorer, scout, selfknowledge, setpiece, sprintsync, thalamus, throwin, timeaudit, tone, touchline, turnstile, twin, viz. (b) INVOKED BY ANOTHER SCRIPT (import or spawn, not prose): claudegen (council:39, dmn:52, nightshift:63, thalamus:777), council (cortex:38), fuelboard (council:40, dmn:53, dugout:69/2905/2911, nightshift:64), hippocampus (9 importers), manager (brain:47), speak (brain:892, dugout:231/251, talk:26), shadow (dugout:2816, postmatch:269), capture (throwin:429, turnstile:74, heartbeat order), capsule_bridge + shipped (heartbeat_config order — live pulse.json lists both as agents), calibration/fsrs/nemesis/learning_state/timeaudit (heartbeat order), examiner (dugout:71), tone (dmn:54, dugout:74, nightshift:65, presence:25), oura_auth (oura_coach:696), postmatch (brain.mjs:262 SPAWN via the bell). (c) PACKAGE.JSON ONLY: repo_bundle (`bundle` + setup/launchers/ARSENAL 9…cmd), postmatch, shipped, dugout, talk, conductor, test_coach_v2 (squad:selftest harness), groundsman + awayday (selftest only; awayday additionally .github/workflows/awayday.yml). (d) SKILL / HOOK: learnstate + teaching_contract + forge_session (.claude/settings.json SessionStart/UserPromptSubmit), mcp-memory (.mcp.json). (e) NOTHING: course.mjs and organism_live_demo.mjs — both reported above as their own findings. limits.mjs (209 lines, untracked, 1 Aug) has no task, no package.json entry, no skill and no importer; conductor.mjs is package.json-only and not yet scheduled — both are in-flight work rather than rot, but neither is reachable by the running system today.

**Impact**

> Establishes that exactly two of 56 scripts are unreachable dead code, and that two more (limits, conductor) are built-but-unwired. It also exposes a fragility in the mapping: 8 organs are reachable ONLY through heartbeat_config.json's `order` array, and heartbeat.mjs:70-73 will silently replace that array with a 6-entry DEFAULT if entries fail `validEntry` — capsule_bridge and shipped are not in that default, so a malformed config would drop two organs with no message.

---

### 74. Four more write-only state artifacts, all documented on 31 July and all still unread

`unwired` · `note` · area `dead-and-lying` · day-one fixable: no
**where:** dressing-room/state/{dossier,concept_graph,manager_notes,trust_tiers}.json · writers at thalamus.mjs:484, cortex.mjs:707, manager.mjs:551, scorer.mjs:550

**Evidence**

> Consumer map over all 96 files in dressing-room/state, cross-checked with per-file greps across scripts/, .claude/, setup/ and club/: dossier.json (written thalamus.mjs:68/:484, read back only by thalamus itself; live content shows `"concepts": {}` — empty), concept_graph.json (written cortex.mjs:707, no reader anywhere), manager_notes.json (written manager.mjs:551, read only inside manager's own selftest at :619; brain.mjs:962 is a comment), trust_tiers.json (written scorer.mjs:550, read back only by scorer at :484/:550). Legitimately internal and NOT defects, for the record: context_state.json, cortex_runtime.json, dugout_session.json, dugout_prefs.json, presence_thresholds.json — each is its own organ's bookkeeping, read back by that same organ. Corrections to my own first pass: capsule_map.json IS read (manager.mjs:68), shipped.json IS read (manager.mjs:69), examiner_drill.json IS read (examiner.mjs:101 loadFreshDrill, imported by dugout.mjs:71), dugout_ledger.jsonl IS read (brain.mjs:432). All four write-only ones appear in dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md:202 and its surrounding list.

**Impact**

> Low individually — small deterministic writes, not token spend — but together they mark the same pattern as the brain_out finding: the organism produces artifacts faster than it grows consumers for them. The one with real cost attached is concept_graph.json, since cortex spends Opus overnight to build it (cortex.mjs:802 "OVERNIGHT DEEPENING (P5) — one nightly Opus pass → concept_graph.json") and nothing opens the result; that spend is separate from the already-known ConceptGraph silent-no-op.

