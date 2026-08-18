# ORGANISM — REPAIR PLAN

> Written 2 Aug 2026. Source: two adversarial audits of the live organism — 6 organ systems
> (55 agents) then 6 unaudited areas (105 agents). 10.5M subagent tokens, 3,084 tool calls.
> **Every finding below survived a verifier instructed to refute it.** 10 claims were refuted
> and are not here. This file is the record of record; if a chat summary disagrees, this wins.

---

## RESUME HERE — ~~the state of the machine right now~~ THE STATE AS OF 2 AUG 2026

> ⚠ **"RIGHT NOW" EXPIRED — audit #108, 6 Aug 2026.** This heading claimed the present tense and
> then went four days without a reader, so the table below was consulted as live truth while 2 of
> its 3 rows had already been reversed by the captain's own hand. It is FROZEN as the 2 Aug record.
> **Never read machine state out of this document. Read it out of the machine:**
>
> - brain pause + pulse — `dressing-room/state/brain_config.json` (`paused`, `pulse.enabled`), or
>   `node scripts/brain.mjs status` for budget + eligibility.
> - scheduled tasks — `Get-ScheduledTask -TaskName ArsenalFC-* | Select TaskName,State`.
>
> **What those two commands actually said on 2026-08-06:**
>
> - **Row 1 is now FALSE.** `brain_config.paused` is **`false`** — the captain un-paused it on 6 Aug
>   once the `claude -p` boot tax was closed in `brain.mjs claudeExec` (`--system-prompt` + `--tools ""`
>   + `--strict-mcp-config`), measured on the same probe at 49,411 → 5,663 tokens/call. The 23 jobs are
>   thinking again; 4 of them (`midday_reread` · `deep_twin` · `season_review` · `capsule_premap`) stay
>   individually `enabled:false` for a different reason entirely — audit #63, no reader for their output —
>   each carrying its own `_disabled_reason`. Row 1's pause is over; those four are not the pause.
> - **Row 2 still holds.** `pulse.enabled` is still `false`, and its re-enable condition is unchanged
>   and still unmet: the nucleus wiring (plan group G3) before any budget comes back.
> - **Row 3 names the wrong tasks.** Of the five listed below, **only `ArsenalFC-Cortex` is Disabled.**
>   `ArsenalFC-DMN`, `ArsenalFC-ConceptGraph`, `ArsenalFC-NightShift` and `ArsenalFC-SelfKnowledge` are
>   all **Ready**. The live disabled set is 14 of 45 tasks and does not match this list — which is the
>   whole point: a hand-maintained list of scheduler state goes stale the first time anyone touches
>   `schtasks`, and nothing here notices. Query the scheduler.

### PAUSED deliberately by the captain, 2 Aug — *as recorded that day; see the freeze note above*

| What | How it was paused | How to reverse |
|---|---|---|
| All 23 LLM jobs | `brain_config.json` → `"paused": true` | set `false` |
| The haiku pulse | `brain_config.json` → `pulse.enabled: false` | set `true` — **only after A#1–A#3 land** |
| 5 scheduled tasks | `schtasks /change /tn <name> /disable` | `/enable` |

Disabled tasks: `ArsenalFC-DMN` · `ArsenalFC-Cortex` · `ArsenalFC-ConceptGraph` ·
`ArsenalFC-NightShift` · `ArsenalFC-SelfKnowledge`. These five call `claude -p` **outside**
the brain ledger — the DMN alone made ~57 unbilled calls a night.

**STILL RUNNING, and must stay running:** capture · fsrs · calibration · nemesis ·
learning_state · presence · thalamus · distiller · doubtminer · hippocampus · viz ·
TimeAuditor · the Goalkeeper's Oura pull. All deterministic, all free.
**The organism stopped THINKING. It did not stop RECORDING.**

### WHY it was paused

Rolling 7-day window stood at 8,516,836 / 12,000,000 (71%) with headroom 0. Measuring the
shape of that week is the single most important number in this document:

```
178 calls · 8,516,836 tokens
  cache_read  (boot tax)   4,262,616   50.0%
  cache_creation           1,214,621   14.3%
  unattributed (pulse)     2,734,788   32.1%
  input  (the question)        1,084    0.01%
  output (actual thought)    303,727    3.6%

  per call: 47,847 total · 23,947 boot tax · 1,706 generated
```

**96% of every call was the machine loading itself. 3.6% was thinking.**
This is why batching (G-ZERO) is not an economy measure. It is the change that lets the
same plan buy roughly 5.6x more thought. The goal was never fewer tokens.

### ALREADY FIXED — in the working tree, all selftests green

1. **Morning push gate.** `brain.mjs` runJob was gated on `res.source === "llm"`, so a
   validator reject, a spawn timeout or a 429 wrote a perfectly good sheet to disk and
   silenced the phone. Now gated on the sheet EXISTING; the body carries provenance.
   Both morning utterances share one `mouth_said[day]` slot, so a retrying job cannot push twice.
2. **The "invented number 90" contradiction.** `manager.mjs` `allowedNumbers(F, shown)` now
   eats the assembled prompt. The wrapper injected "one clean 90-min block" into the prompt
   and then bounced the finished sheet for containing 90 — and published a skeleton carrying
   that same 90. Proven both ways: the organism's own published sheet now validates; an
   injected "cards due: 4417 (+888 overdue)" still bounces.
3. **Absence alarm.** `SHEET_ABSENCE_TITLE` + a check in `tick()`. If the morning window
   closes with no sheet, the phone says so and why. Same one-utterance slot.
4. **Ledger `note`.** `sheet source=… (reason)` was built every run and dropped by the row
   literal — 0 of 2,811 rows carried it, and stdout goes nowhere under `hidden_run.vbs`.
5. **Five pulse bleeds.** `loadConfig` passthrough (a `pulse` block was parsed and silently
   discarded, making `enabled:false` literally unreachable code) · token-denominated cap ·
   consecutive-failure backoff · its own output excluded from its input tail · the cache
   token pair on the row.
6. **Master pause switch.** `cfg.paused === true` short-circuits `eligibleJobs`, announced
   out loud on every tick. `=== true` so a typo can never pause the organism by accident.
7. **The selftest was not hermetic.** It read the captain's LIVE config, so pausing the brain
   turned 21 assertions red without a line of logic changing. Now forced to running values,
   with dedicated assertions passing each switch explicitly.
8. **`THE_MANAGER__Master_Prompt.md`.** Its worked example carried "~11:00–14:00" and
   "90-min", which Opus copied as if they were data. Now digit-free.
9. **`scripts/conductor.mjs` — NEW.** One ordered morning chain replacing 15 wall-clock
   alarms; a late start now yields a LATE day, not a BROKEN one. 16/16 green against the real
   organs in 15 seconds. **Built and tested; the schtasks switch is NOT yet thrown.**
10. **`scripts/limits.mjs` — NEW.** Every numerical limit in the organism printed next to the
    real data it is judged against. Re-runnable monthly as the data fills in.

### PENDING DECISIONS — nothing below was done without the captain

- Commit the working tree (code only; the audit confirmed no secret is in it).
- Register `ArsenalFC-Morning-Conductor` (08:45, WakeToRun) and disable the 14 tasks it
  replaces. Rollback is one command.
- Add the data-dependency declaration to `formation_read` (a canon edit).
- **Wake-test first.** `powercfg /a` shows S3 disabled — this is a Modern Standby box — and
  no Power-Troubleshooter record has ever shown "Timer - Task Scheduler" as a wake source.
  **WakeToRun is a hypothesis on this hardware, not a known fix.**

### THE CAPTAIN'S STANDING RULES — these constrain every fix below

1. **Never set a numerical limit by guessing.** Open everything, measure 30–45–60 days, then
   set numbers from data. Two exceptions only: a safety net at the real plan wall (it resets
   weekly, so one runaway night costs the week), and failure guards — which are not budgets,
   they stop one identical failure repeating forever.
2. **Run HOT.** `brain_config.json`, his standing order with Nidhi, 12 Jul: *exhaust the Max
   5x plan every rolling window and every week.* The target is never fewer tokens. It is
   **more thought per token.**
3. **Never delete an organ because nobody reads it. Give it an address.** Every job must
   declare the surface its output appears on, or it does not get scheduled.
4. **Automate the friction, protect the baking.** Anything he has to remember is a design
   defect, not a discipline problem. He has ADHD-PI, diagnosed and medicated.

### KNOWN GAP IN THIS DOCUMENT

14 findings in the **rep-pipeline** area did not complete adversarial verification — the
plan's session limit was reached mid-scan. They appear below because the scanner produced
evidence for them, but they carry **less confidence than the other 92 and must be re-checked
before being acted on.**

---

# THE ORGANISM — FINAL PRE-DEPLOYMENT PLAN
**2 Aug 2026 · 106 issues · deduplicated across the captain's 31 and this scan's confirmed findings**

---

## 1. THE HONEST ANSWER

**"Will everything work properly after completing all the phases?"**

**No. Partly — and the gap is bigger than the 31 items suggest.**

The 31-item plan fixes the *gates*, the *schedule*, and the *rituals*. It does not touch roughly 75 other confirmed defects, several of which are the reason the organism's most expensive work already reaches nobody. Concretely, if only the 31 land:

- ~3.27M of the last 7 days' 8.25M claude tokens still go to files no line of code opens (#63), and three nightly render jobs still write to filenames `viz.mjs` can never open (#65) — the poster and the Gemini wall have been frozen at 21 Jul on disk while fresh ones were produced and discarded every night since 29 Jul.
- His 119 typed doubts still score exactly 0.000, because `self` fires only on `modality === "voice"` (#1) — and voice has been silent since 30 Jul.
- The team sheet still says "Matchday 1 · Introduction / I don't know you yet" (#81), and `get_context` still opens with a 17 Jul fact instructing every new session to explain everything from scratch (#12).
- Six of the six `no_new_numbers` jobs — including the two mp3s he wakes up to and the Dugout's own system instruction — still run the un-fixed 0–31 validator (#59).

**After all 106, here is what still will not work, and why:**

| Still dark | Why | Class |
|---|---|---|
| `touchline.struggle` | needs ≥6 reps in one calendar day (`touchline.mjs:186`); 9 reps exist total, one day ever cleared it | needs reps |
| `nemesis.axis_pattern` | gated at `total_reps ≥ 20` (`nemesis.mjs:288`); at 9 | needs reps |
| physio's `fsrsSignal` | `loop_vitals.json` says "gated (needs n≥20)"; at 7 | needs reps |
| scout's scrimmage trigger | needs 3 core concepts at fluent = `fluent_streak 3` each ≈ 9 cold-fast reps; he has produced **2 cold-fast reps in six weeks** | needs reps, slowest of all |
| Boot Room genome proposals | `bootroom_min_reps: 200`; at 9 — and it *should* not propose at 9 | needs reps |
| The earned-voice gate | `VOICE_GATE = {min_shadows: 10, min_hit_rate: 0.7}` per type; best type has 2 shadows in 15 days | needs calendar days |
| FSRS interval quality | stability is measured off *intervals*; #24 makes timestamps honest, it cannot make days pass | needs calendar days |
| The war room / trophy / ship date | `season.interview_dates`, `trophy`, `target_ship`, `paused_until` have **no writer anywhere in `scripts/`** (#83) — unbuilt, not broken | unbuilt feature |

**On his verbatim goal — "fully working to the peak of its powers from first day onwards, i can not wait for so many days for gates to be opened":**

Every gate *can* open on day one, and per his own standing rule it should. But ungating converts `"warming_up"` (a refusal) into `"9/20"` (a measurement with its n shown). That is the correct day-one state. It does not manufacture a trustworthy verdict from 9 reps — and manufacturing one would be exactly the lying failure mode this whole audit exists to hunt.

**The thing that actually buys peak power on day one is not a gate.** It is the work the organism is *already doing and throwing away*: ~2.9M tokens/week written to unread directories, 675k/week of visual renders landing in unopenable filenames, 124 LLM-paid pulse escalations that arithmetically cannot cross a threshold, 853 haiku calls, and 119 typed doubts already captured, already bound into moments, already scored — at zero. None of that needs a single new rep. It needs an address.

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

## 3. THE PIPELINE

Ten groups. Ordered so the things that change **tomorrow morning** come before the things that change the architecture. Time estimates are rough and assume verification (run it, show output) inside each group.

**G0 — STOP THE TWO CLOCKS ALREADY TICKING** · #77, #50 · **~20 min**
Commit `conductor.mjs` with `package.json` (or hold the selftest line), and land the presence relabel before the 03:30 Sunday refit halves stall sensitivity again. Also: freeze the in-flight selfknowledge fixes until #46.
*Buys:* nothing breaks while everything else is being done.

**G1 — TOMORROW MORNING'S WALL AND WALLPAPER** · #65, #86, #85, #87, #88, #84, #82, #90, #89, #91 · **~2–3 h**
*Buys:* the poster, the Gemini wall and "The read" — written every night since 29 Jul, discarded every night — appear on the 08:50 wall. The Gemini button stops pointing at 21 Jul. "Weekly consistency" stops printing 14% for a 225-minute week. The drill on the wall stops reading `"🔵 recall"` and names its concept. ~675k tokens/week stop being burned into unopenable filenames. This is the first thing he sees, and it changes tomorrow.

**G2 — THE CAPTAIN'S 30 MINUTES** · #23, #81, #12, #16 (rows), #48, #44, #47, #80 · **~30 min of his time**
*Buys:* "I don't know you yet" ends. `matchday` moves off 1 and the phase ladder starts. The KAL→KICKOFF weld — which `postmatch.mjs:11-13` calls the loop's biggest mechanic — fires for the first time in the live tree. Six organs stop reading null. `learning_state` crosses 12 reps and `okLS` flips. Two dead facts stop telling every session it is day one.

**G3 — THE NUCLEUS HEARS HIM** · #1, #2, #3, #6, #7, #9, #10, then #11 · **~3–4 h**
*Buys:* the single highest-value change in the plan. 119 already-captured typed doubts become scoreable; against measured `tau1_eff`, 464 of 4,295 moments would wake outright and 1,281 sit inside the adjudicator band. Against a lifetime total of 9 tier≥1 events and 2 wakes, this is the difference between a decorative deep lane and a working one. The pulse's 2.46M tokens start being able to land. The DMN's 49 nightly rollouts get a join key that can bind.
*Sequencing note:* the whisper path is ungated by tier, so #6 produces whispers immediately — but `dugout.mjs:167`'s earned-voice gate will still mute them until G8 has run for weeks. That is by design.

**G4 — MEMORY THAT ARRIVES TRUE** · #13, #15, #14, #16 (guard), #17, #18, #21, #22, #20, #19 · **~3–4 h**
*Buys:* `get_context` — the call CLAUDE.md mandates at every session start — stops opening with an undated 15-day-old instruction to re-explain everything, starts carrying the teaching card, and degrades honestly when `who_he_is` is stale. `working_set.json`, his re-entry card, stops being built from 22 window captions out of 25.

**G5 — THE BRAIN STOPS PAYING FOR SILENCE** · #63 (+ in-flight `runJob` note), #64, #59, #60, #61, #62, #66, #67, #72, #73, #46 · **~3–4 h**
*Buys:* ~3.27M of 8.25M weekly tokens either reach a surface or stop being spent. `midday_reread` stops eating 70% of an 800k window for a file with no reader, and `formation_read` — the sheet — gets the headroom. `lexicon_mine` goes from 0-for-115 to able to succeed. The six `no_new_numbers` jobs stop letting `"cards due: 12 (+9 overdue)"` through to the mp3 he wakes up to.

**G6 — THE HONEST STATUS LAYER** · #99–#106, #68, #69, #27, #28, #29, #30, #49 · **~3–4 h**
*Buys:* his verbatim ask. Every organ says `9/20` instead of `warming_up`. Two fields that permanently read `"ok"` either tell the truth or are deleted. The 9-axis rollup — the spine of THE METHOD, computed correctly every day — finally reaches a surface.

**G7 — THE REP PIPELINE TELLS THE TRUTH** · #24, #25, #26, #31, #32, #33, #34, #37, #92, #96 · **~2–3 h**
*Buys:* timestamps are observed, not authored. A rep pulled at 14:00 recomputes the pipeline immediately instead of at 08:39 tomorrow. `"07-31 relapse" ×2` becomes two distinguishable receipts. `"nemesis headline ×?"` becomes `×2`. `"1 rep(s)"` becomes `"7 rep(s) on 1 concept"`. 16 cold-reader-failing doubts get flagged before they are served as rematch opponents.

**G8 — THE MOUTH STARTS EARNING ITSELF** · #52 (date-scope FIRST), #53, #54, #55, #56, #57, #58 · **~2–3 h**
*Buys:* the earned-voice clock actually starts. Shadows get detected on days the bridge is closed and scored against the day they happened. Reminders survive the browser closing. The POST router stops accepting cross-origin commands. *Note: this buys the clock, not the voice — see §4.*

**G9 — SCHEDULE, POWER, VISIBILITY** · #41, #42, #43, #45, #51, #93, #98 · **~2 h**
*Buys:* the conductor replaces the 15-task morning burst; the machine wakes for its own work; one resident process replaces 1,440 cold starts; the doctor can finally say which tank is dry.

**G10 — DEBT, HONESTY, DOCS** · #35, #36, #38, #39, #40, #70, #71, #74, #75, #76, #78, #79, #83, #94, #95, #97 · **~2–3 h**
*Buys:* the course tracker is wired before 1-05 arrives; the CONTEXT WARNING stops being amputated and stops firing forever; the forge close report stops printing a false clean sheet; three tautological assertions become real; four doc lines stop describing organs that do something else.

**Total: roughly 20–28 hours of code work + ~30 minutes of his time**, over 4–6 sessions. G0–G2 alone (~3.5 h + 30 min of his) changes what he sees tomorrow morning.

---

## 4. WHAT CANNOT BE DAY-ONE

**Needs HIM — a specific act, today (minutes, not days):**
- Close the forge session (#23) — one command, verified reachable.
- One `/full-time` (#81) — 30 seconds, interactive by design. It must stay interactive: `postmatch.mjs:225-227` defaults to `HIT` and a canned KAL-line when stdin isn't a TTY, so a scheduled task would fabricate a result every night.
- His word on: 2 identity facts, 2 narrator episodes, CLAUDE.md's stale paragraph, the medical lines, which brain lanes get a surface (#63), whether the war room exists at all (#83), the course chapter list (#35), and who may record a teaching drift (#40).

**Needs REPS — compressible into days if he studies, not gated on the calendar:**
- **3 more reps** → `learning_state` crosses `warming_up_min_reps: 12`. Delivered by #23 today.
- **6 reps in one calendar day** → `touchline.struggle` (`touchline.mjs:186`) stops reading `no_data`. Has happened once, ever.
- **20 total reps** → `nemesis.axis_pattern` (`nemesis.mjs:288`) and physio's `fsrsSignal` (n≥20). At 9.
- **~9 cold-fast reps across 3 core concepts** → the scout's scrimmage trigger (`fluent_streak 3` × `min_defend_grade_concepts 3`). He has produced **2 cold-fast reps (correct ∧ knew) in six weeks**. This is the slowest item in the whole plan and it is a learning-rate fact, not a code fact. Ungating shows the counter; it cannot fill it.
- **200 reps** → Boot Room genome mutations (`bootroom_min_reps`). Months at his current rate, and correctly so.

**Needs CALENDAR TIME — cannot be compressed by any amount of work:**
- **FSRS interval quality.** Stability is measured off intervals between reviews. #24 makes the clock honest; only days make the intervals real.
- **The earned-voice gate.** 10 scored shadows per type at ≥70%, one day at a time. Best-stocked type has 2 in 15 days. Weeks, minimum — and correctly, because a gate that opens fast is a gate that proves nothing.
- **Presence's own-normal baseline** after #50. A windowed, factory-labelled refit needs a fresh sample.
- **The wind tunnel's tuning.** It replays 14 days. After #1 lands, the first honest re-tune is 14 days later.
- **The Goalkeeper's sleep-architecture trends.** Verdicts ride trends against his own baseline, and he is medicated so RHR/HRV/temperature are low-confidence by design. I have **no measured number** for how many nights that baseline needs — nothing in this scan produced one, and I am not inventing one.
- **His own standing rule.** #66 explicitly defers every threshold to a 30–45–60-day measurement window. That is the correct answer and it is, by definition, not day one.

---

## 5. THE FUTURE STATE — one full day, after everything

**02:10 · `ArsenalFC-Consolidate`** — `hippocampus.consolidate()` runs with a third source: today's learning-arc turns from `afferent.jsonl`, filtered (#17), not the raw stream. `who_he_is.json` advances to today instead of freezing whenever he skips a manual note.

**02:20 · `ArsenalFC-HippoStore`** — `consolidateStore` decays episodes on `memoryStrength`. The two 19 Jul narrator rows are gone (#16), so all 8 cartridge slots carry his words.

**02:24 and hourly · `ArsenalFC-DMN`** — dreams five wall-breaker interventions into `dmn_precache.json`. Its ~57 `claude -p` calls now appear in `brain_ledger` (#7), and a Claude-side hiccup no longer marks five Gemini tanks dead until midnight (#8).

**02:40 · `ArsenalFC-NightShift`** — builds the pre-answer cache from voice *and typed* doubts (#1), reports "N voiced turns in window" so a dry corpus is visible (#56), and files `gate_tune` with an honest verdict against its own `[1,8]` band (#73).

**03:00 · `ArsenalFC-ConceptGraph`** — one Opus pass, 38 nodes, and the graph now reaches setpiece instead of a file nobody opens (#72).

**~02:10–03:00 · the render lane** — `maidan_poster`, `gemini_render`, `wall_insights` write with `serveDate` (#65). The files land under **today's** name.

**07:30 · `ArsenalFC-Physio-AM`** — `loop_vitals.json` no longer says `"status":"ok"` above a populated bleed array (#69), and `emitted_unconsumed` fires only on real orphans (#70).

**08:39–08:44 · the heartbeat squad** — capture → fsrs → capsule_bridge → calibration → nemesis → learning_state, in order, with capsule_bridge and shipped guaranteed present even on a degraded config (#49). `pulse.json` reports what the agents actually did (#68). Every organ writes a have/need counter, not `warming_up` (#106).

**~08:46 · his phone** — one push, through the sanctioned gate. `teamtalk_am.mp3` exists, and its `no_new_numbers` validator now bounces an invented "12 reps" the way the manager's already does (#59). The team talk says a real matchday number, because `/full-time` ran (#81).

**08:50 · `ArsenalFC-Wall-AM`** — the wall carries the poster written six hours ago, the Gemini-painted wall, and "The read" — three panels that have been dark since 21 Jul (#65). The brain meter counts last night's 22:00–23:59 work instead of hiding it (#88). "Weekly consistency" reads from wall-minutes, so a 225-minute week reads like a 225-minute week (#85). Today's drills name their concepts (#87). The season panel shows an awaiting-blood state if the ledger ever dies (#84).

**08:50 · the desktop wallpaper** — the amber headline is the KAL-line he wrote last night, in his words, not the hardcoded `"one green ball, first thing"` (#82).

**Any hour, when he types a doubt into Claude Code** — `afferent-post.mjs` captures it (as it already does), and now `thalamus.mjs:218` scores it: `self = 1`, tokens derived, S ≈ 0.65. On measured `tau1_eff`, that clears the bar about half the study hours in a day. It becomes a tier-1 enrichment or a tier-2 Opus wake, and it enters `dossier.json` as a real concept. **This is the single biggest thing the organism will know about him that it does not know today: what confuses him, on the surface where he actually works.**

**Any hour · `capture.mjs pull`** — a rep that lands from Colab at 14:00 immediately triggers the heartbeat (#25), so FSRS, calibration, nemesis and learning_state all reflect it by 14:01 rather than 08:39 tomorrow.

**Every 10 min · presence** — the stall bar is a factory-anchored, windowed fit (#50), so the sensor stops blinding itself. A stall's `hintWords` canonicalize through the concept registry and fall back to sprint's current concept (#6), so the DMN's pre-drafted intervention can actually match.

**Every 15 min · distiller** — `working_set.json`'s four slots are built from his words. `where_left_off` is his last utterance, not `"claude.exe · Claude"` (#21).

**21:30 · `Bell-FullTime`** → **21:35 scorer** (slip evidence says "7 rep(s) on 1 concept", #96) → **21:40 setpiece** (drills aim at sprint's current concept, `"nemesis headline ×2"`, #32/#87) → **21:45 doubtminer** (flags any doubt that fails the cold-reader standard *before* queueing it as a rematch opponent, #34) → **21:50 physio + evening_voice** → **21:55 examiner** (its drill reachable from a surface he opens, #36).

**Then `/full-time`, 30 seconds** — HIT/MISS, one signal, KAL-line, throw-in routing. `season.json` increments. `shadow score` runs, **date-scoped to each shadow's own day** (#52), so the earned-voice ledger fills with honest verdicts one day at a time.

**22:00 Wall-PM · 22:10 Wallpaper** — the day's KAL-line goes onto the desktop for tomorrow morning.

**What the organism knows about him at the end of that day that it does not know today:** what he typed when he was confused, and how salient it was. Which axes are fluent and which are not, on a surface a human reads. How many reps he actually did (not how many concepts). Which of its own predictions came true, per day, per type. Which of its own outputs nobody opened.

---

## 6. THE RESIDUAL RISK

### The deepest defect: it detects failure, never absence

The evidence is consistent and damning:

- `brain.mjs status` prints `health OK — 1 failure(s) at the tail of the last 25 calls` while `lexicon_mine` is 0-for-115.
- `/organism-doctor` reads `Last Result: 0` and calls the Boot Room green even though it produced nothing.
- `gatherInputs` maps missing files to `null` with no warning; `teamtalk_am` has run 85 times at 3/4 inputs absent.
- `heartbeat` prints `"6/6 organs beat … all ran"` after silently dropping two.
- `pulse.json` says `"ok"` regardless of the agents array on the next line.
- Nothing monitors `wall_data.json` freshness — `physio.mjs:39-44` lists `pitch_read.json` and not it — so a viz crash would be silent.
- No record exists of whether the whisper or pre-answer engine has *ever* fired.
- Nothing logs whether the model ever chooses to call `recall()`.
- The wind tunnel prints `GATE HEALTHY` for a gate at 0.43 wakes/day against its own `[1,8]` floor.

**Does the plan close it? Partly, one site at a time.** #64 closes absence for brain-job inputs. #68/#69 close two false "ok"s. #49 closes the squad shrink. #10 restores the moment-loss reason. #56 closes the empty-corpus case. #106 closes organ status. The in-flight "missing absence alarm" is aimed here. **But every one of those is a local patch. None of them generalizes.**

### The single instrument that would catch the rest

**A daily produce-and-consume reconciliation.** For every declared output path in `brain_config.json` and every state file with a declared writer, assert two things: (a) its mtime advanced within its own expected cadence, and (b) at least one reader opened it since. Report violations as a physio bleed.

That one check, run once, would have independently caught: #65 (files written to names viz cannot open), #63 (eight-to-ten dirs with no reader), #72 (`concept_graph.json`), #73 (`gate_tune`), #46 (`organism_self.md`), #52 (a ledger that never came into existence), #33 (an arm that can never be non-empty), #86 (a flag from a file nothing unlinks), #27 (a daily rollup with no reader), and #95 (`trust_tiers`).

It needs no new semantics. The organism already knows every job's `out` (`brain.mjs`), every organ's writer (`heartbeat_config.order`), and every reader can be derived once and asserted thereafter. `physio.mjs`'s `emitted_unconsumed` already has exactly the right *shape* — it is currently mis-firing (#70) and covers a hand-picked list. Extending that freshness map to every artifact with a cadence is the cheapest honest version.

**Where the plan does NOT close it, even after all 106:**

1. **Nothing measures whether *he* consumed anything.** The wall is rendered three times a day; there is no evidence anyone has opened it. The mp3 is synthesized; nothing records a play. `filmkit_*.md` is written to Drive; nothing knows if NotebookLM ever ingested it. Every "reaches him" claim in this document is really "reaches a surface he *could* open." That hole stays open and I am not proposing a feature to close it — but he should know it is there.
2. **The selftest suite is itself a weak instrument.** It contains assertions that cannot fail (#76), fixtures that encode a schema the producer never emits (#32, #33), fixtures whose window titles conveniently contain concepts (#6's presence/thalamus tests), and an "anti-wall law" that asserts the length of a value it just truncated (#39). A green suite is currently evidence of very little. #75/#76 improve it; they do not make it trustworthy.
3. **`brain_ledger` records spend but not delivery.** Even with the in-flight `runJob` note fix, a row says a job succeeded and wrote a file. It does not say anyone read it.

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

# APPENDIX — the 74 confirmed findings, structured

Each survived an adversarial verifier instructed to refute it. `kind` separates **broken** (defective) from **unwired** (works, reaches nobody), **starved** (correct, no input), **waiting** (gated by design), **lying** (reports success falsely) and **dead-code**. That distinction matters: an organ built for 200 reps holding 9 is not broken, and must not be "fixed".

---

## 1. `learning_state.axes[]`, `python_fluency` and `core_vs_light` are computed daily and rendered on no surface

- **kind:** `unwired` · **severity:** `yellow` · **area:** `rep-pipeline` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\learning_state.json (axes[]) · C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\manager.mjs:245-247

**Evidence**

> learning_state.json ships a full per-axis rollup: axes[] = [{axis:"a", label:"kya+analogy", fluent_frac:0, counts:{learning:2,held:0,fluent:0}, due_count:1}, ...] for a, c, d, e. `grep -rn "\.axes\b" scripts/` excluding the producer and unrelated `reg.axes`/`j.axes` uses returns ZERO readers. python_fluency and core_vs_light are lifted into F.formation at manager.mjs:245 and :247 and then appear in neither assemblePrompt nor fallbackSkeleton (grep for either name in manager.mjs returns only the lift, the selftest fixtures at :565/:581, and one selftest assertion at :635). viz.mjs's wall bus reads learning_state but never touches axes/python_fluency/core_vs_light.

**Impact**

> The 9-axis model is the spine of THE METHOD, and the per-axis view of his fluency — computed correctly, every day — is visible to no human and no LLM. This is the repo's own audit finding #6 from 2026-07-31 (dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md:81), still unfixed two days later.

**Proposed fix**

> Pick one surface and wire it — the axes rollup belongs on the wall next to the Maidan (viz.mjs already renders a calibration panel with the same shape of data), and core_vs_light is a single sheet line. Either render them or delete the computation; a daily-recomputed field with no reader is the exact defect this whole pass is hunting.

**Verifier's note**

> CONFIRMED by independent reproduction. (1) dressing-room/state/learning_state.json ships a populated axes[] today: four entries (a/c/d/e) each with label, fluent_frac, counts{learning,held,fluent}, due_count. (2) Repo-wide grep for python_fluency and core_vs_light returns ONLY the producer (scripts/learning_state.mjs:445-446,504,516), its selftests, the lift at scripts/manager.mjs:245/247, the two selftest fixtures at :565/:581, and one assertion at :635 — no consumer. For learning_state.axes[] there is no reader at all: every .axes hit in scripts/ is something else (forge_session.mjs axes_done/deferred, capsule_bridge.mjs axes_present/cracked, brain.mjs:767 reading position.axes_*, learning_state.mjs:169/469 reading reg.axes labels). (3) I read assemblePrompt (manager.mjs:332-361) and fallbackSkeleton (:410+) in full — the only formation line is :350 `FORMATION: ${F.formation?.weak_connection ...}`; neither python_fluency nor core_vs_light appears in either function. (4) viz.mjs:86-97 reads learning_state.maidan/.weak_connection/.confusion_pairs only. So the claim's core assertion holds.
> 
> THREE CORRECTIONS to the scanner's framing:
> 
> (a) "the entire Python skill track has no surface" overstates it. python_fluency is currently {} — all 9 reps in reps_log are concept-track (embeddings, hallucinations), zero skill-track. That field is starved AND unwired; wiring it today renders an empty object. Only axes[] and core_vs_light are genuinely populated-and-unread. The finding should be scoped to those two, and python_fluency should be deleted or left dormant rather than wired.
> 
> (b) "the per-axis view is visible to no human and no LLM" needs a caveat: an axis read DOES reach the prompt via `AXIS PATTERN` at manager.mjs:341, fed by weaknesses.axis_pattern. It is null today (weaknesses.json status warming_up, axis_pattern null), but the surface exists. learning_state.axes[] is a second, richer rollup that is unread — not the only axis path.
> 
> (c) The scanner missed that the defect is currently MASKED and about to unmask, which strengthens it. okLS (manager.mjs:166-167) requires status==="ok" && low_confidence!==true. learning_state.json is warming_up / low_confidence:true, so F.formation is null entirely today — even the wired weak_connection renders nothing (confirmed: current team_sheet.md has no FORMATION content). learning_state_config.json warming_up_min_reps = 12; he is at 9. Three reps from now okLS flips, formation begins flowing, and python_fluency/core_vs_light still land nowhere. Imminent, not theoretical.
> 
> EXTRA DEFECT FOUND while verifying, same file: manager.mjs:164 justifies the okLS gate with "learning_state.mjs suppresses its own axis rollups under warming_up." That is false — learning_state.mjs:519 suppresses only weak_connection and maidan_stage_focus under low_confidence; `axes` is emitted unconditionally at :516, and today's warming_up file proves it by shipping a full four-axis rollup. The comment's stated premise does not match the producer's behavior.
> 
> Also note the older repo audits (learning-layer/SYSTEM_FOUNDATION.md:99, :223) claim core_vs_light "partitions nothing" because all registry entries are core:true — that is now STALE: concepts.json has 26 concepts with neuralnet/rlhf/jagged at core:false, so core_vs_light does carry real bits. It is a live computation with zero readers, not a vacuous one.
> 
> SEVERITY: yellow stands, at its lower edge. Daily-recomputed fields with zero readers are exactly the class this pass hunts, and the unmasking is 3 reps away — but the cost is a lost information surface, not a wrong output or a dead organ. The proposed fix (render on the wall beside the Maidan, or delete) is sound for axes[] and core_vs_light.

---

## 2. Nothing recomputes the pipeline after the hourly capture pull — a rep ingested at 14:00 is invisible to every consumer until the next morning's heartbeat

- **kind:** `unwired` · **severity:** `yellow` · **area:** `rep-pipeline` · **day-one fixable:** yes
- **where:** schtasks \ArsenalFC-CapturePull (hourly from 09:00) vs \ArsenalFC-FSRS/Calibration/Nemesis/LearningState (once, 08:40-08:44) · C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\heartbeat_config.json

**Evidence**

> schtasks: ArsenalFC-CapturePull runs `capture.mjs pull` at 09:00 with `Repeat: Every: 1 Hour(s)`. ArsenalFC-FSRS/Calibration/Nemesis/LearningState each run ONCE daily at 08:40/08:42/08:43/08:44, and heartbeat.mjs (08:39) runs the full ordered pass from heartbeat_config.json — capture pull FIRST, then fsrs → capsule_bridge → calibration → nemesis → learning_state. So the 08:39 pass is correctly ordered, but all fifteen subsequent hourly pulls have no recompute behind them. The paste path is fine — .claude/skills/forge/SKILL.md:131 chains `capture.mjs paste` → `heartbeat.mjs` explicitly — so this gap is specific to the pull path.

**Impact**

> Any rep arriving from the Colab inbox during the day sits in reps_log unconsumed for up to 24 hours: no card scheduled, no calibration update, no weakness detected, and the evening surfaces (setpiece 21:40, scorer 21:35, examiner 21:55, wall 22:00) all read yesterday's derived state. Today this costs nothing because the pull has never delivered a rep, but it is the exact latency the pull path was built to remove.

**Proposed fix**

> Make the pull's own exit tell the truth: when `pulled > 0`, have capture.mjs pull shell `heartbeat.mjs` the same way the forge skill does. It is already the established contract for the paste path; the pull path just never got it.

**Verifier's note**

> CONFIRMED as a real missing wire, with the impact corrected and severity downgraded.
> 
> Reproduced: schtasks shows ArsenalFC-CapturePull = `node capture.mjs pull`, Start 09:00, `Repeat: Every: 1 Hour(s)`, `Until: Duration: 13 Hour(s)` (14 fires/day). FSRS/Calibration/Nemesis/LearningState are 08:40/08:42/08:43/08:44 with `Repeat: Every: Disabled`; Heartbeat 08:39, also Disabled. capture.mjs:708-717 — the `pull` branch calls pullFromInbox, prints, `process.exit(0)`; grep for heartbeat|spawnSync|execSync in capture.mjs returns comments only. No watcher on reps_log.jsonl (only cortex.mjs:863 on wake_queue and thalamus.mjs:837, which emits a salience afferent, not a recompute).
> 
> The precedent is STRONGER than the scanner argued, which makes the fix more clearly right: every other ingest path already chains heartbeat — forge/SKILL.md:131, paste-session/SKILL.md:10, learn/SKILL.md:120, AND turnstile.mjs:175 `execFile(process.execPath, [join(__dirname, "heartbeat.mjs")], { windowsHide: true }, () => {})` fires immediately after a clipboard ingest. The pull path is the only ingest route without it, and the only unattended one.
> 
> CORRECTION to the impact: "invisible to every consumer" and "the evening surfaces all read yesterday's derived state" are false. scorer.mjs:497+520 reads reps_log.jsonl live and counts repsOnDate for today; touchline.mjs:396 reads it live every 30 min; dugout.mjs:936,1108 reads reps_today live. A 14:00 rep IS seen by those the same evening. Only the derived organs go stale — cards.json, calibration.json, learning_state.json, nemesis.json — hitting setpiece.mjs:587-591 and examiner.mjs:72. So the real cost is "derived state lags up to ~24h", not "the rep is invisible".
> 
> SEVERITY: yellow → note. scripts/capture.log tail is 20 consecutive `pull: pulled 0 from 0 file(s)` — the inbox is wired (capture_config.json → G:/My Drive/arsenal/reps_inbox; the parenthetical only prints when r.wired) but has never carried one rep. The gap causes no data loss, self-heals at the 08:39 heartbeat, and is pre-empted on any evening he runs forge/paste/turnstile. Missing wire on a dormant path, not a live defect.
> 
> FIX: as proposed, and cite turnstile.mjs:175 as the copy-paste precedent — on `pulled > 0`, execFile heartbeat.mjs from the pull branch of capture.mjs.

---

## 3. reps_log timestamps are authored by the LLM, not observed — four reps share the same millisecond and three sit one second apart, which FSRS replays as three zero-elapsed reviews

- **kind:** `lying` · **severity:** `note` · **area:** `rep-pipeline` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\reps_log.jsonl rows 3-6 · C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\fsrs.mjs:173

**Evidence**

> reps_log.jsonl rows 3-6: ts 2026-07-30T20:28:02.795Z, 20:28:03.795Z, 20:28:04.795Z and 21:58:02.795Z — four reps spanning 90 minutes sharing the millisecond .795, three of them exactly 1000ms apart. Rows 7-9 are 2026-07-31T14:36:00.000Z / 14:46:00.000Z / 17:48:00.000Z — round to the minute. capture.mjs:141 only requires that ts PARSES; the forge skill (SKILL.md:124) makes the model author it. fsrs.mjs:173 then does `card = f.next(card, new Date(r.ts), ratingOf(r))` for each in ts order, so rows 3-5 are three FSRS reviews with elapsed_days = 0 between them — which is precisely the failure mode capsuleSeedReps was patched to avoid for capsule dates (fsrs.mjs:138-147), left unguarded on the live path.

**Impact**

> The three axes probed in one sitting are replayed as three separate recall attempts seconds apart. Combined with the Pehle-Guess mapping, that is what drives hallucinations to difficulty 9.9 and stability 0.0265. The ts field is load-bearing for the entire scheduler and it is currently a guess.

**Proposed fix**

> Apply the same same-instant collapse fsrs.mjs already does for capsule dates to the live path: within one concept, reviews closer together than a threshold (a few minutes) are ONE review event, not N. That is the honest reading of three axes probed in one sitting regardless of what timestamps the model wrote.

**Verifier's note**

> CONFIRMED but the stated cause and fix are both wrong; severity note is correct.
> 
> VERIFIED MYSELF:
> - reps_log.jsonl rows 3-6 read verbatim: 2026-07-30T20:28:02.795Z / 20:28:03.795Z / 20:28:04.795Z / 21:58:02.795Z. Four rows spanning 90 minutes all ending .795 — offsets {0, 1000, 2000, 5400000} ms from one anchor. Rows 7-9 are 14:36:00.000Z / 14:46:00.000Z / 17:48:00.000Z. Both are fingerprints of authored, not observed, time.
> - ts IS model-authored. .claude/skills/forge/SKILL.md:118-130 instructs the model to BUILD the JSON array including ts, and explicitly warns "never invent" only about latency_ms, not ts. capture.mjs:143-146 (validateRep) parses and normalizes o.ts and never stamps a clock. Corroborating: forge_sessions.jsonl shows the real session ran started_at 2026-07-30T15:33:55.165Z -> updated_at 22:28:21.291Z, so the authored values fall inside a genuine window — plausible, but synthesized.
> - The live path genuinely lacks the guard. fsrs.mjs:147 (`const uniqTs = [...new Set(dates.map(...))]`) exists ONLY inside capsuleSeedReps; buildStore at fsrs.mjs:171-173 replays every rep with no collapse. My independent ts-fsrs 5.4.1 replay reproduces fsrs_store.json exactly: S=0.0265 D=9.9054 reps=7 lapses=1.
> 
> WHERE THE CLAIM IS WRONG:
> 1. "that is what drives hallucinations to difficulty 9.9" is FALSE. I re-ran the identical 7 ratings spread one full day apart: D=9.9054 — bit-identical. FSRS difficulty is time-independent (rating-driven with mean reversion). D=9.9 comes purely from the 5-of-7 Again ratings, i.e. the Pehle-Guess mapping — the timestamps contribute nothing. ONLY stability moves: 0.0265 as-logged vs 0.0862 (rows 3-5 collapsed) vs 0.2035 (all <15min clusters collapsed) vs 0.3760 (one day apart).
> 2. The distortion currently reaches nobody. due = 2026-08-01T17:48:00.000Z in ALL collapse scenarios (sub-day stability floors to a 1-day interval), so cards.json due_today=1 / overdue=3 / hardest_due are unchanged; hallucinations has no due-day tie with any other card so the stability tie-break at fsrs.mjs bucketize never engages. The sole consumer of `stability` is physio.mjs:193 fsrsSignal, and loop_vitals.json shows it gated: {"organ":"fsrs","brier":null,"n":7,"note":"gated (needs n≥20)"}. That is the one place authored 1-second gaps would bite hard (R over a 1s gap ~= 1.0 scored against correct:false ~= maximal squared error) — and with 9 reps it is starved off, not firing.
> 3. The proposed fix would not fire. The capsule guard is an EXACT-instant Set dedupe on the normalized ISO string; rows 3-5 are 1000 ms apart, not the same instant, so porting that guard verbatim to the live path changes nothing. A time-window collapse is a different rule than the one cited.
> 
> CORRECTED READING: this is a provenance defect — a field the whole scheduler rides on is authored by the model and presented as measured — in an organ whose only time-sensitive consumer is gated off at 9 reps. Kind "lying" stands (the number is published as derived from observed history). Severity "note" is correct and not inflated: nothing downstream changes today.

---

## 4. Nemesis evidence strings collapse to indistinguishable duplicates

- **kind:** `broken` · **severity:** `note` · **area:** `rep-pipeline` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\nemesis.mjs:252

**Evidence**

> Live weaknesses.json: `"evidence": ["07-31 relapse", "07-31 relapse"]`. nemesis.mjs:252 builds them as `\`${localMmdd(m.ts)} ${m.type}\`` — day plus type only. The two entries are different reps on different axes (a at 14:36, c at 14:46), and the receipt cannot tell them apart. The selftest at nemesis.mjs:392 only asserts `evidence` is non-empty, so it never notices.

**Impact**

> The receipts are the thing that makes a weakness auditable rather than an accusation — "2× miss" is only defensible if the two misses can be told apart. As written, one rep logged twice and two genuinely distinct misses render identically.

**Proposed fix**

> Include the axis and the time in the evidence string (`07-31 14:36 axis a relapse`). One template change; the data is already in the miss object.

**Verifier's note**

> CONFIRMED, reproduced end-to-end. Live C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\weaknesses.json really does carry `"evidence": ["07-31 relapse", "07-31 relapse"]` on the hallucinations entry (recurrence 2, score 1.8527). nemesis.mjs:252 is exactly `evidence: misses.map((m) => \`${localMmdd(m.ts)} ${m.type}\`)` — local mm-dd plus type, nothing else. nemesis.mjs:171 pushes `{ ts, type, axis }`, so the axis and the full timestamp are already in hand and are thrown away by the template; the fix is a one-line template change as claimed.
> 
> I replayed analyzeTopic against reps_log.jsonl by hand to be sure the two rows are genuinely distinct and not one rep double-logged: the three 07-30T20:28 guessed-wrongs are skipped (guessed, no prior correct = FSRS's job), 07-30T21:58 axis c knew-correct sets seenCorrect, then 07-31T14:36:00Z axis a and 07-31T14:46:00Z axis c both qualify as relapses. Two different reps, ten minutes apart, on two different axes, rendering as one identical string. selftest at nemesis.mjs:392 asserts only `Array.isArray(e.evidence) && e.evidence.length > 0`; `node scripts/nemesis.mjs selftest` prints ALL CHECKS PASSED, so nothing catches it.
> 
> Not "starved of input" — this is the opposite of a volume problem. A FORGE session lands every rep on one concept in one sitting, so same-day misses are the NORMAL shape, not the edge case; at 200 reps the collapse is worse, not better. Not working-as-designed either: the file header calls these "receipts" and THE_MANAGER__Master_Prompt.md:292 documents the intended shape as distinguishable strings ("mock 07-14 confident-wrong", "mock 07-18 hesitant"). "broken" stands.
> 
> Two corrections to the scanner's framing, neither of which changes the verdict:
> 
> (1) The stated impact overreaches on who is harmed. I grepped every consumer of weaknesses.json — manager.mjs:240-241 takes only `headline`/`axis_pattern`; setpiece.mjs:245-255 takes axis_pattern/headline and setpiece.mjs:287 filters on `status === "closed"`; physio.mjs:303 checks `headline` presence; learnstate.mjs:109-126 maps to `topic` + one-letter axis; heartbeat.mjs:145 checks freshness only. No deterministic reader touches `evidence[]` at all. Its one real consumer is the LLM: brain_config.json:198 lists weaknesses.json as an input to the `drill_forge` job, and brain.mjs:805 (`else inputs[name] = readJson(p)`) pastes the whole file — evidence included — into the prompt at brain.mjs:787. So the duplicate receipts degrade an Opus drill-phrasing job that is explicitly marked enrichment-only ("drills.json stays complete without this"), plus anything the captain reads by eye. That is real but small.
> 
> (2) The proposed fix is right, and the axis is the load-bearing half of it, not the timestamp. modeAxis (nemesis.mjs:176-181) reduces the two misses {a:1, c:1} to a single mode with an alphabetical tiebreak, which is why the live headline reads "axis a keeps breaking" when the misses were split a/c one apiece. The per-miss axis therefore survives nowhere in the output — evidence[] is the only field that could carry it, and it drops it. Include the axis (and time) and both defects close at once.
> 
> Severity "note" is correct and not inflated: no number is wrong (recurrence 2 is right, derived independently of the strings), no deterministic consumer is misled, and today's blast radius is one enrichment prompt and the captain's eyes.

---

## 5. The doubt detector is deaf to the only surface he still uses: `self` fires on modality "voice" ONLY, so 119 typed doubts scored zero

- **kind:** `unwired` · **severity:** `red` · **area:** `memory-layer` · **day-one fixable:** yes
- **where:** scripts/thalamus.mjs:218 (`comps.self`), scripts/mcp-memory.mjs:157 + :194 (note routes as desktop-study)

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

**Proposed fix**

> Drop the modality gate: match self_markers on any afferent that carries HIS words — gate on provenance instead (`source` ∈ {voice, claude-code, organism-memory}), never on `claude-code-teaching` (the assistant's own text, 33 of which also contain markers and must NOT score). Cheapest correct form: add an explicit `evt.self_flag` that hooks/afferent-post.mjs sets for source==='claude-code' and mcp-memory sets for kind==='doubt', and have line 218 honour either that flag or the voice path.

**Verifier's note**

> CONFIRMED, reproduced independently end to end. Cause is exactly as stated; the fix is right in direction but incomplete.
> 
> VERIFIED MYSELF:
> 1. scripts/thalamus.mjs:218 — `if (evt.modality === "voice" && text && cfg.self_markers.some(m => text.includes(m))) comps.self = 1;`. I grepped every scripts/*.mjs for writers of comps.self: line 218 is the ONLY one in the live path (cortex.mjs:426/585 are selftest fixtures; :1008/:1287/:1299 are selftest weight overrides). There is no second door.
> 2. hooks/afferent-post.mjs:53 — `if (ev === "UserPromptSubmit") { text = String(hook.prompt||"").trim(); source = "claude-code"; }` with modality "code"; :54 routes the assistant's own reply to "claude-code-teaching". So the provenance split the fix wants ALREADY EXISTS in the source field.
> 3. afferent.jsonl (3,115 rows I parsed): voice|- 271, code|claude-code 463, code|claude-code-teaching 305, desktop-study|organism-memory 6. Voice by day = {17 Jul:80, 18 Jul:133, 19 Jul:45, 30 Jul:13} — silent since 30 Jul, effectively since 19 Jul.
> 4. Running the LIVE dressing-room/state/thalamus_config.json self_markers (not the file default — the live config DOES override) over the 463 claude-code rows: 119 hits. Exact match to the claim. By day: {18 Jul:8, 20 Jul:3, 21 Jul:23, 22 Jul:23, 23 Jul:1, 25 Jul:55, 29 Jul:1, 30 Jul:2, 31 Jul:3}.
> 5. salience_ledger.jsonl (5,281 moments): comps.self > 0 in exactly 7 rows. All 7 keyed `voice:`. Last is 2026-07-18T19:27:19. Zero since.
> 6. THE KILL SHOT: 3,024 moments are keyed `code:` (his typed text is the spotlight — the key literally is the first 40 chars of his prompt). Tier distribution of those 3,024 = {0: 3024}. Max S across all of them = 0.000. Two of his verbatim quoted doubts are in there as their own moments: `code:i am confused, morning mein gaffer ko go` → S=0, tier=0, tau1_eff=0.75, outcome "reflex"; same for `code:i am confused, after every agents work w`.
> 7. Whole-life tier census: {tier0: 5272, tier1: 7, tier2: 2}. Both tier-2 wakes ever were self-driven VOICE doubts (18 Jul). 5 of the 7 tier-1s were also self=1 voice. So `self` is not merely one input — it is the ONLY component that has ever pushed this organism past tau0 on his own words. Since 18 Jul it has been unreachable.
> 
> BROKEN vs STARVED: unwired, not starved. `self` demonstrably works (7 proofs). The input is not scarce (119 marker-bearing typed doubts vs 271 voice afferents total). The surface moved from voice to Claude Code and the gate did not follow. That is a wiring defect, not a volume problem — the opposite of the 9-reps case.
> 
> SEVERITY red is NOT inflated. Counterfactual on real measured tau1_eff: S would be 0.45, which clears tau0 (0.25) for ALL 119, making every one at minimum tier-1 "enrich" AND eligible for the pre-answer serve gate at thalamus.mjs:627 (`tier >= 1 && (comps.self > 0 || comps.err > 0)`). Of the 4,295 moments since 20 Jul, 464 carried tau1_eff <= 0.45 (outright wake) and 1,281 <= 0.55 (inside the 0.10 epsilon adjudicator band). Refractory (15 min) and wake_cap (15/day) would collapse the 25 Jul burst of 55, but dozens of distinct tier-1s and several tier-2s survive that. Against a lifetime total of 9 tier>=1 events, this is not a tuning nit.
> 
> CORRECTIONS TO THE CLAIM:
> (a) The desktop-study leg is overstated. mcp-memory.mjs:157 and :194 do post `modality: "desktop-study"` (verified, exact lines), but 0 of the 6 desktop-study rows contain a self_marker at all — so the modality gate is not why they scored 0.000. It is a latent, not a measured, loss. Drop it from the evidence; keep it in the fix.
> (b) The fix is INCOMPLETE — same wire, three cuts. Fixing :218 alone buys tier-1 enrichment but few real wakes: thalamus.mjs:172 gates deriveVoiceTokens to `e.modality === "voice"` too, so a repaired typed doubt gets NO concept_tokens, nov stays 0, and S stalls at self-only 0.45 — against a tau1_eff that is 0.75 in 1,342 of 5,281 measurements (the file's own comment at :131 names this exact stall). And nightshift.mjs:484 `preAnswerMaterial` filters `a.modality === "voice"` as well, so unlocking the :627 serve gate opens onto a cache built from a channel dead since 30 Jul. All three must ship together.
> (c) One hazard the fix underweights: gating on `source` alone is necessary but not sufficient. 33 claude-code-teaching rows carry markers (correctly excluded), but his own prompts frequently PASTE assistant text — his 31 Jul row matched only on "confus" inside the pasted phrase "teri confusion ka aakaar", not on a word he wrote. The self_flag approach is still right; just expect some marker hits to come from quoted text rather than his own doubt.

---

## 6. His entire Claude Code stream scores literally 0.000 — 3,024 moments, no exceptions

- **kind:** `unwired` · **severity:** `red` · **area:** `memory-layer` · **day-one fixable:** yes
- **where:** scripts/thalamus.mjs:172 (deriveVoiceTokens gated to voice), :190-199 (pe needs a key code never has), hooks/afferent-post.mjs (emits no event_key)

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

**Proposed fix**

> Two lines, both at the door: (1) run `deriveVoiceTokens` for any text-bearing modality, not just voice — thalamus.mjs:172; (2) have afferent-post.mjs stamp an `event_key` (e.g. `code:prompt` / `code:teaching`) so the base-rate PE branch at :196 can at least fire. Then add `code:prompt` to cfg.pe.base_rates with a low rate so a prompt is genuinely surprising rather than default-0.5 noise.

**Verifier's note**

> CONFIRMED as a mechanism, but the volume, the impact, and the fix are all wrong.
> 
> WHAT I REPRODUCED (thalamus.mjs's own exported scorer, same text, two channels):
>   after door, keys: [modality, source, text, cwd, ts]
>   CODE   comps {pe:0,nov:0,gov:0,err:0,self:0,dead:0,hab:0}  S = 0
>   VOICE  tokens [confused,transformer,attention,exactly] comps {nov:1,self:1} S = 0.65
> Live config tau0=0.25, tau1_base=0.40. Identical sentence: typed = 0.000 tier-0; spoken = 0.650 tier-2 wake. All 768 `code` afferents carry exactly `cwd,modality,source,text,ts` — confirmed, one keyset, 768/768. Every code-keyed ledger row has pe=nov=gov=err=self=dead=0; only `hab` (a penalty) ever varies. So yes: structurally incapable of a non-zero score, not merely low.
> 
> CORRECTION 1 — the 3,024 / "57% of all bound moments" is inflated ~4x by contamination that is already fixed. Of 3,024 code-keyed ledger rows, 2,268 have keys `code:you are an organ of arsenal ai fc…` (1,524) and `code:you are the continuous pulse…` (736) — the organism's OWN organ prompts, i.e. exactly the self-capture leak the 25 Jul guard closed and the decontamination purged (afferent.jsonl holds 768 code rows, not 3,024; there is a .pre-decontam.bak). Self-talk rows/day: 445 on 25 Jul → 109 on 26 Jul → 0 thereafter. The honest live number is **756 genuine captain moments (14% of the ledger), all S=0, max 0** — still a real finding, but not "57% of the nucleus".
> 
> CORRECTION 2 — "reaches nobody" is false. The broadcast at thalamus.mjs:648 is unconditional: every moment, tier-0 included, lands in workspace.json for every subscriber. The code stream is also consumed by distiller.mjs:28 (INTERACTIVE working set), brain.mjs:366 (liveSignal idle detection) and nightshift.mjs:575. What S=0 actually forfeits is narrower: never enrich, never wake, never match the pre-answer cache (gated `tier >= 1`), never populate the living dossier (dossier.json concepts = {}).
> 
> CORRECTION 3 — the proposed fix does not work. Ran it: tokens + `event_key:"code:prompt"` at the default base rate gives **S = 0.24375, below tau0 = 0.25 → still tier 0**, zero behavioural change. Fix (1) alone = 0.20. The scanner's own arithmetic (nov 0.20 + base-rate pe 0.044) never clears the first bar, let alone the wake bar. The load-bearing gate is the one it filed as a separate finding: **thalamus.mjs:218 `if (evt.modality === "voice" && …) comps.self = 1`** — weight 0.45, the only single component that alone clears tau1_base 0.40. Lines 172 and 196 are cosmetic without it.
> 
> CORRECTION 4 — a designed route was missed. brain.mjs:355 posts a `pulse` afferent WITH concept_tokens and a per-concept `event_key`, commented as "the pulse only NAMES the moment; the thalamus stays the sole authority". So `code` is architecturally routed to salience via the haiku_pulse, not orphaned. That bridge is 80% dead (685/853 failures) — already audited separately — so the route is closed in practice, but the intent was not absent.
> 
> SEVERITY red → yellow. The entire ladder is already ~always tier-0: 5,272 tier-0 / 7 tier-1 / 2 tier-2 across all 5,281 rows. Voice scores perfectly and has produced 2 wakes, ever. Code scoring zero is not what stands between him and a working deep lane. And tier-0 means "the reflex already handled it" (thalamus.mjs:12) — he is typing inside Claude Code, where a Claude is answering him; waking cortex.mjs over it is largely redundant. Non-trivial residue that keeps it above a note: 108 of his 452 genuinely-typed prompts contain a literal thalamus self_marker string, and the identical words spoken score 0.65. That asymmetry is channel-arbitrary and real.

---

## 7. The haiku pulse's mathematical ceiling is 0.244 — BELOW tau0 (0.25). 853 LLM calls produced 124 escalations that could not reach even the cheapest tier

- **kind:** `unwired` · **severity:** `red` · **area:** `memory-layer` · **day-one fixable:** yes
- **where:** scripts/thalamus.mjs — no `pulse` branch exists; :196-198 (base-rate fallback), :553 (tau0 gate); dressing-room/state/thalamus_config.json:13,27-29

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

**Proposed fix**

> Correct wiring is three parts. (1) The pulse IS a named doubt — it should set `self`: give the emitter an explicit `self_flag`/`escalate:true` field and honour it at :218 alongside the voice path. (2) Give `pulse:escalate` its own entry in cfg.pe.base_rates with a genuinely low rate (it is a rare event; default 0.5 makes it maximally unsurprising, which is backwards). (3) Do NOT let habituation flatten it — an escalation repeating means he is still stuck, which is the opposite of boring; either exempt `pulse:*` from the hab key or key hab on the pulse's concept_tokens rather than on the constant `pulse:escalate`.

**Verifier's note**

> CONFIRMED on the arithmetic and on the ledger — but three evidence details are wrong, and the proposed fix would be actively harmful. Severity downgraded red → yellow.
> 
> WHAT I REPRODUCED MYSELF
> 
> 1. No pulse branch. `grep -c "pulse" scripts/thalamus.mjs` → **0** (exit 1). 1,389 lines, zero occurrences. Verified.
> 
> 2. The ceiling is exact and I derived it from the code, not the claim. scripts/thalamus.mjs:185-235 `computeComponents`:
>    - pe — pulse rows carry no `market_id` and no `p_obs` (measured: 0 of 124 carry market_id/p_obs/rep/gov_from/due_count/staged_scrimmage), so they land on :196-198 `cfg.pe.base_rates[evt.event_key] ?? default`. No `pulse:*` key exists in thalamus_config.json:27-29 (`base_rates` is literally `{"default": 0.5}`). surprisal(0.5, 4 bits) = 0.25, `* 0.5` "base-rate PE is weak evidence" → **0.125** × w.pe 0.35 = 0.04375.
>    - self — :218 `if (evt.modality === "voice" && …)`. Pulse modality is `"pulse"`. Structurally 0. Confirmed.
>    - nov 1 × 0.20 = 0.200; gov/err/dead structurally 0.
>    - **ceiling = 0.24375**, tau0 = 0.25 (thalamus_config.json:13), gate at :553 `let tier = S < cfg.tiers.tau0 ? 0 : 1;`
> 
> 3. The ledger agrees to the third decimal. 5,281 rows; 99 with a pulse spotlight key; **max S ever = 0.244** (`{"pe":0.13,"nov":1,…,"key":"pulse:pulse:what","tier":0,"outcome":"reflex","tau1_eff":0.451}`) — 0.24375 rounded, i.e. the ceiling is *attained*, not theoretical. Tier histogram `{"0":99}`, outcome histogram `{"reflex":99}`. Widening to every moment that contained a pulse at all: **124 rows, tiers `{"0":124}`**. Zero enrichments, zero adjudications, zero wakes, ever.
> 
> 4. It genuinely reaches nobody else. brain.mjs:346 comment: escalation POSTs an afferent, "the thalamus decides + enqueues. NEVER wake_queue." The only other afferent reader is distiller.mjs:47, and distiller.mjs:28 `INTERACTIVE = ["voice","code","desktop-study","note","context","throwin"]` — **pulse is not in it**. So the thalamus is the sole downstream, and the thalamus cannot admit it. brain_ledger: 853 haiku_pulse rows, 168 ok / 685 failed, 124 `escalated:true`, **2,464,792 tokens** spent.
> 
> THREE EVIDENCE ERRORS IN THE CLAIM (the conclusion survives all three)
> 
> a) "event_key":"pulse:escalate" for all 124 — **false**. There are **28 distinct event_keys** (`pulse:what`, `pulse:need` ×16, `pulse:isko` ×12, `pulse:moment`, `pulse:ntfy`, `pulse:code`…). brain.mjs:349-353 deliberately builds a per-concept key with the comment "distinct escalations don't collapse into one habituation bucket." **Proposed fix (3) is therefore a fix for a bug that was already fixed.** The 54 zero-S rows come from nov→0 (53 of 54 have `nov:0` — the token had been seen) plus decayed hab, spread across 28 keys, not from one saturated bucket.
> 
> b) "79 of the 124 dragged to S=0.000" — measured **54** (of 99 spotlight rows).
> 
> c) "121/124 DO carry concept_tokens" — this one is right (121), and the 3 without are the oldest rows using the older `"pulse flagged:"` prefix; those score pe only = 0.044.
> 
> WHY THE PROPOSED FIX IS WRONG, AND WHY SEVERITY IS YELLOW NOT RED
> 
> Fix (1) — "set self=1 on pulse" — computes to S = 0.04375 + 0.200 + 0.450 = **0.694**, far above the observed tau1_eff of 0.451. That is an instant tier-2 Opus wake on **every** escalation. The pulse escalated on **124 of 168 successful calls = 74%**, and the already-audited self-tail feedback loop pushed that to 82% over 24h. Against `wake_cap_per_day: 15`, that fix converts a silent gate into a daily cap blowout on a sentinel with no measured precision. The tau0 wall has been an *accidental but load-bearing* brake.
> 
> Worse, the one component carrying the whole score is nov — and the tokens feeding it are filler: `["what","left","part","activate"]`, `pulse:need`, `pulse:isko`, `pulse:pulse`. brain.mjs:354 takes the first 4 words >3 chars with no stopword filter. This is the same class of defect as the already-audited doubtminer filler-n-gram finding. So even the 0.200 that gets it to 0.244 is noise, not novelty.
> 
> Correct fix order is precision first, gain second: (i) add a real `pulse:*` entry to `cfg.pe.base_rates` reflecting its true rarity — the default 0.5 is maximally unsurprising, which is backwards, and that part of the claim is right; (ii) stopword-filter the concept_tokens at brain.mjs:354 so nov means something; (iii) only then give the pulse an explicit weighted term, well below the 0.45 `self` weight, sized so a *calibrated* escalation lands in the ε-band for adjudication rather than jumping straight to a wake. Do not touch habituation — it is already per-concept.
> 
> Kind stays **unwired**: the wire physically exists (POST → ingest → score → ledger) but terminates where no consumer can act on it — it is not starved (124 real events arrived), not merely waiting, and the code is not dead.
> 
> Severity **yellow**, not red: it is provable, 100% reproducible, and must be fixed — but nothing is corrupted, no verdict is wrong, no data is lost, and the 2.46M tokens were spent by the emitter regardless of what the gate did. The realized loss is that a 74%-trigger-rate sentinel of unmeasured quality never reached the deep brain — and on the evidence here, opening that gate as proposed would have been the worse outcome.

---

## 8. The memory that reaches every session opens by telling it this is day one — two dead 17-Jul facts, injected unconditionally, forever

- **kind:** `lying` · **severity:** `red` · **area:** `memory-layer` · **day-one fixable:** no
- **where:** dressing-room/hippocampus/identity_facts.json; scripts/hippocampus.mjs (L2 identityCartridge, injected via buildRehydrateCartridge); scripts/learnstate.mjs:90-92 (splice into SessionStart brief); scripts/mcp-memory.mjs get_context

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

**Proposed fix**

> Two moves, both need HIS word (Law 4 — facts are captain-gated, so this is not a silent code fix). (1) Retire both 17-Jul facts via `hippocampus.mjs forget <id>` — fb5d5a86 and 88e5349a. (2) Promote the four standing rules from `preference` episodes to identity facts so they arrive unconditionally instead of by recency luck. Separately (code, no approval needed): identity facts carry a `ts` and nothing ever ages them — add a staleness surface so a fact untouched for N days is flagged in the cartridge rather than presented as current truth. And investigate why `remember_fact` has never been called: the staging path is the intended route for exactly this and it has zero traffic.

**Verifier's note**

> CONFIRMED, reproduced on all three doors. dressing-room/hippocampus/identity_facts.json (336B, mtime 18 Jul 03:15, unwritten since) holds exactly two facts, both ts 2026-07-17: fb5d5a86 "this is the first day that we are working together on the organism" and 88e5349a "I am bringing my friend to whom you need to explain everything". They are the FIRST line of output from `node scripts/hippocampus.mjs cartridge`, `node scripts/learnstate.mjs brief`, and a live MCP get_context call, under the header "THE LEDGER OF SELF (facts he told you to hold — ALWAYS present, never guessed)".
> 
> THREE CORRECTIONS to the scanner's account.
> 
> (1) The supporting who_he_is.json quote is dead evidence. The live file's fingerprint is "He is starting a fresh session to learn hallucinations from the beginning" — not "studying since 2:30 AM on his first day". Drop that line.
> 
> (2) The stated cause ("both false") is wrong, and the real cause is sharper. Fact #1 is not flatly false: he himself declared "PEHLA din" in episodes dated 31 Jul AND 1 Aug. The mechanical defect is UNDATEDNESS — scripts/hippocampus.mjs:264 renders `- ${f.text} [${f.id}]`, text and id only, the `ts` field is never emitted, and nothing in the codebase ages, expires or flags a fact. A 17-Jul assertion is indistinguishable from a today assertion at every consumer. Fact #2 is the genuinely dead one: across all 16 rows of episodes.jsonl the token "friend" appears exactly once, in episode 8f57956 ts 2026-07-17T22:15:47Z — the same evening — and zero times in the 15 days since. A one-off rendered as standing truth, whose content is a literal instruction to re-explain everything.
> 
> (3) The sub-claim "the four standing rules arrive only by luck of recency" is OVERSTATED for the brief path and CORRECT for the MCP path. learnstate.mjs:76-87 also injects the 17-rule teaching card from learning-layer/HOW_HE_LEARNS.md unconditionally — I confirmed it prints, covering Hinglish (#2), one-idea-per-message (#1) and depth-not-length (#17). But `grep -n "loadTeachingCard|HOW TO TEACH HIM" scripts/mcp-memory.mjs` returns nothing: get_context carries no card, only the cartridge. Since CLAUDE.md mandates get_context as the session-start call, THAT is the exposed door — the finding should be scoped to the MCP path, not the brief.
> 
> NOT starved, NOT waiting: the organ behaves exactly as designed on 9-rep-scale usage; the payload is stale and there is no aging mechanism at any volume. identity_facts.pending.jsonl does not exist, so remember_fact has never once been called in 16 days and nothing has ever contested these two rows.
> 
> SEVERITY red holds, with the dilution noted honestly: the poison is two lines, and four lines below them the cartridge carries a correct 2 Aug fingerprint and the verbatim 31 Jul / 1 Aug episodes, so an attentive session self-corrects. It stays red because the single door CLAUDE.md mandates opens with an undated instruction to explain everything to a person absent from the record for 15 days, in the slot explicitly labelled ALWAYS present — and he has complained three times that memory fails to reach a session.
> 
> FIX: the proposed `hippocampus.mjs forget <id>` is executable (CLI mode verified at hippocampus.mjs:660) and both retirements need his word under Law 4. The code half should be re-aimed: not "add a staleness surface" as an afterthought but emit the existing `ts` in identityCartridge at all — the field is stored and silently discarded at render, which is the whole bug. Promoting the four rules to facts is a reasonable second move but only fixes the MCP path; the brief already carries them via the teaching card.

---

## 9. The nightly consolidator ingests only the dead voice transcript and hand-written notes — it cannot see Claude Code at all

- **kind:** `unwired` · **severity:** `red` · **area:** `memory-layer` · **day-one fixable:** yes
- **where:** scripts/hippocampus.mjs:281-293 (gatherDayMaterial), :294 (consolidate); ArsenalFC-Consolidate daily 02:10

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

**Proposed fix**

> Add afferent.jsonl to gatherDayMaterial as a third source: rows with `modality==="code" && source==="claude-code"` for today/yesterday, filtered through the same `recallWorthy` quality bar the recall indexer already uses (dugout.mjs:~445 — length ≥20, ≥4 words, not a fragment). Keep `claude-code-teaching` OUT — the consolidator must distil HIM, not the coach's own prose. That is one added block in an existing function; the material is already on disk, already timestamped, already deduped.

**Verifier's note**

> CORE MECHANIC CONFIRMED, IMPACT AND FIX WRONG.
> 
> Reproduced: `grep -c afferent scripts/hippocampus.mjs` = 0. gatherDayMaterial (:281-293) reads exactly three sources — day-filtered episodes.jsonl, `CAPTAIN: ` lines from brain_out/dugout/<date>.md, calibration gap/trend. The scheduled CLI path (:671 `consolidate({force})`) passes no deps.material, so ArsenalFC-Consolidate (daily 02:10, last result 0, next 03-08 02:10) uses it verbatim. Dugout dir = 4 files, newest 2026-07-30.md. episodes.jsonl = 16 rows / 5 days (07-17:1, 07-18:7, 07-19:2, 07-31:4, 08-01:2).
> 
> I replicated the run that produced the current file: window [2026-08-02, 2026-08-01] -> exactly 2 episodes, 0 captain_lines, as claimed. And who_he_is.json (2 Aug) is a near-verbatim paraphrase of ONE hand-typed episode — "10.4 ghante", "9 mein se 0 axis graded", "coverage 33%", "bina ring pehne soya", "hallucinations SHURU SE padhunga", "Gaffer se baat karke dekhunga" all appear in that single note's text. Tonight's window [2026-08-03, 2026-08-02] -> 0 episodes, 0 captain_lines -> consolidate() returns {skipped:true} and who_he_is FREEZES at 2 Aug. That staleness is the genuine defect.
> 
> THREE EVIDENCE ERRORS THAT INVERT THE FIX:
> 1. "his 46 typed prompts from 1 Aug" is wrong. 46 = all modality:code rows that day, of which 22 are `claude-code-teaching` (the coach's own output). HIS prompts = 24. (The 463 corpus figure is correct.)
> 2. "who_he_is.json says 'his first day working with the system'" — that phrase is not in the file. It says "starting a fresh session to learn hallucinations from the beginning." Right mechanism, invented quote. "4 episodes" -> 2.
> 3. Fatal to the proposed fix: "the surface where 100% of his learning now happens" is FALSE. All 24 of his 1 Aug prompts are machine-building/ops (ntfy pushes, laptop RAM, session archiving, lexicon_mine, pulse, numerical limits, pipeline status) — zero learning-arc content. hippocampus.mjs:298 explicitly bans that category: "Talk about building/configuring the machine itself (tools, accounts, schedulers, APIs) is background noise — never let it become the fingerprint." Through the proposed recallWorthy gate (dugout.mjs:455, not ~445), 21 of 24 pass -> 20 unique -> 7,400 chars into a 12,000-char material budget, crowding out the 2 real episodes with precisely the banned material. The fix as written would DEGRADE who_he_is, not repair it.
> 
> OMITTED MITIGATION: distiller.mjs:28 `INTERACTIVE = ["voice","code",...]` — Claude Code DOES reach working_set.json (fresh, ts 2026-08-01T20:54) and therefore get_context. Claude Code is invisible to L3 only, not to the memory system.
> 
> SEVERITY DOWNGRADE red -> yellow, KIND unwired -> starved. The organ is not broken and does not corrupt: it degrades gracefully (skips, old who_he_is stands, validator intact). Its two wired surfaces have simply gone dry (voice silent since 30 Jul; MCP note used on 5 days in 16), so the real failure mode is a frozen fingerprint, not a wrong one. The correct fix is not "pipe afferent in raw" — it is either a relevance filter that admits only learning-arc turns (concept/doubt language), or reviving a cheap auto-capture into episodes.jsonl. Piping raw claude-code rows through recallWorthy alone is measurably counterproductive.

---

## 10. The recall index — the surface MCP `recall()` searches — is fed only by the voice bridge and froze on 30 Jul

- **kind:** `starved` · **severity:** `red` · **area:** `memory-layer` · **day-one fixable:** yes
- **where:** scripts/dugout.mjs:437-450 (gatherRecallSources), :511 (indexRecall consumes it); dressing-room/state/recall_index.jsonl

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

**Proposed fix**

> Same one-source addition as the consolidator: add `afferent.jsonl` rows with `modality==="code" && source==="claude-code"` to gatherRecallSources. `recallWorthy` (dugout.mjs:~445) already exists to keep garble out, and indexRecall already dedupes by text hash and holds a cross-process lock, so nothing else changes. Note the writer lives in dugout.mjs — a voice-bridge file — which is why the index dies when voice dies; consider moving gatherRecallSources to hippocampus.mjs so the hourly ArsenalFC-HippoIndex owns it independently of whether the Dugout is up.

**Verifier's note**

> REAL but materially overstated, with a wrong cause and a redundant fix.
> 
> CONFIRMED BY MY OWN MEASUREMENT: recall_index.jsonl = 135 rows, by day {17 Jul:15, 18 Jul:75, 19 Jul:36, 30 Jul:9} — exact match. Sources by tag: dugout 131, note 2, throwin 2. dugout.mjs:437-448 gatherRecallSources() reads exactly four places; notebook.json does not exist; dressing-room/state/brain_out/dugout/ holds 4 files, newest 2026-07-30.md; dugout_notes=2, loose_balls=2; no .lock. mcp-memory.mjs:68 confirms recall() merges episodes + recall_index + scribe_log. And the core gap is real: afferent.jsonl has 768 modality=code rows (claude-code 463, claude-code-teaching 305) through 01-08 20:24, none of which are in gatherRecallSources.
> 
> REFUTED — three load-bearing errors:
> 
> (1) NOT A STALLED WRITER; BACKLOG IS ZERO. I re-implemented gatherRecallSources + recallWorthy + the real djb2 textHash (dugout.mjs:417) offline: 274 raw source items -> 135 pass recallWorthy -> UNINDEXED BACKLOG = 0. Worthy-per-day {17 Jul:15, 18 Jul:75, 19 Jul:36, 30 Jul:9} is byte-identical to what is indexed. The index is COMPLETE w.r.t. its sources. It stopped on 30 Jul because the sources stopped (voice unused), not because anything broke. "Froze" implies a fault; there is none.
> 
> (2) THE STATED CAUSE IS WRONG, AND THE FIX IS REDUNDANT. hippocampus.mjs:37 says explicitly that recall_index.jsonl + indexRecall() "stay untouched"; grep confirms hippocampus.mjs never calls it. So the offered evidence "ArsenalFC-HippoIndex has run hourly since, result 0" proves nothing. The real scheduled writer is nightshift.mjs:673 (embed_backfill, importing indexRecall from dugout.mjs), and ArsenalFC-NightShift ran 01-08 02:40 with Last Result 0. A nightly, Dugout-independent writer therefore ALREADY exists — so "move gatherRecallSources to hippocampus.mjs so the index does not die when voice dies" fixes a problem that does not exist. The bottleneck is the SOURCE LIST, not the owner.
> 
> (3) "TWO OF THREE FROZEN; THE THIRD HAS 16 ROWS" IS FALSE. Measured: episodes.jsonl = 16 rows growing through 1 Aug (mtime 02-08 02:20, 16/16 carry vec); scribe_log.jsonl = 6 rows, last write 01-08 23:09. The scanner swapped the counts (16 is episodes, not scribe_log) and called two legs frozen when only ONE is. The two live legs carry the curated high-value content, including a 1 Aug preference episode that is verbatim his TYPED words. So the impact claim — that recall() "searches a corpus that stopped growing three days ago" — is wrong: the corpus recall() actually searches is the merge, and the merge grew through 1 Aug.
> 
> RESIDUAL TRUE FINDING: recall_index is a voice-transcript index with no typed-input source. His durable typed content still reaches recall() via MCP note -> scribe_log -> episodes. Only uncurated typed turns are unrecallable.
> 
> FIX CAVEAT THE SCANNER MISSED: recallWorthy rejects "please continue" (len<20) but would admit operational chatter like "han pehle complete organism ka data nikal ke laao fir ek sath we will work on every issue". Dumping 400+ scheduling turns into a 135-row curated semantic index would degrade recall precision, not improve it. If wired at all, it needs a tighter filter than recallWorthy.
> 
> SEVERITY: red -> note. Zero backlog, healthy writers, recall() demonstrably still returns his most recent preferences (the claim concedes 0.75/0.74 hits). KIND: starved stands — the organ is fed by a channel he stopped using, which is exactly starvation, not breakage.

---

## 11. L4, the per-turn recall reflex, has exactly one caller — the voice bridge. In Claude Code nothing recalls anything mid-session

- **kind:** `unwired` · **severity:** `red` · **area:** `memory-layer` · **day-one fixable:** yes
- **where:** scripts/hippocampus.mjs (recallReflex, exported at :685), scripts/dugout.mjs:2928 (sole caller), .claude/settings.json UserPromptSubmit chain

**Evidence**

> `grep -rn "recallReflex" scripts/ hooks/` → two hits: the definition in hippocampus.mjs, and **scripts/dugout.mjs:2928** — `recallReflex(body.text).then(hit => { if (hit) runtime.recallHint = ... })`. That is the entire consumer set.
> 
> The UserPromptSubmit hook chain in .claude/settings.json fires three things — `afferent-post.mjs`, `forge_session.mjs contract`, `teaching_contract.mjs print`. None of them touches recall.
> 
> Proof it has not fired: `dressing-room/hippocampus/recall_bumps.jsonl` is **0 bytes**, created 30 Jul 16:24. The 25-Jul audit note at hippocampus.mjs:30 says this file exists specifically so recalls get COUNTED; the count is still zero. Summed `recalls` across all 16 episodes = 5, all from the voice era.

**Impact**

> In a Claude Code session, memory arrives exactly once — the SessionStart cartridge — and then never again, no matter what he says for the next five hours. The voice bridge gets a per-turn reflex that surfaces a relevant past moment as he speaks; the surface he actually works on gets a single opening paragraph. That asymmetry is the same shape as the teaching-contract problem he already fixed (rules injected once at SessionStart drowned after 40 turns) — but for memory, and still open.

**Proposed fix**

> Add a fourth UserPromptSubmit hook that runs recallReflex against the prompt text and prints at most one line when cosine ≥ 0.55 — the same silent-unless-earned shape as `forge_session.mjs contract`. It is read-only, it already exists, it already has a threshold and a bump-counter, and stdout from UserPromptSubmit hooks is injected by design (that mechanism is already proven by the pacer and the teaching contract). Note it costs one embedding call per turn on the free pool — gate it on text length ≥15 as recallReflex already does.

**Verifier's note**

> REAL but over-claimed on both cause and impact; downgrade red->yellow and unwired->starved.
> 
> WHAT I REPRODUCED (holds):
> - Sole runtime caller is scripts/dugout.mjs:2928, and it is NARROWER than claimed: `if (body.modality === "voice" && body.text) { recallReflex(...) }`. Only a voice turn can trigger it. Second door is the manual CLI at hippocampus.mjs:668 (`mode === "recall"`).
> - .claude/settings.json UserPromptSubmit = afferent-post.mjs, forge_session.mjs contract, teaching_contract.mjs print. None touches recall. Confirmed.
> - dressing-room/hippocampus/recall_bumps.jsonl = 0 bytes, 30 Jul 16:24. Summed recalls over 16 episodes = 5, every one last_recall_day=2026-07-30, all on 18-Jul voice episodes. Episodes dated 2026-07-31 and 2026-08-01 exist with recalls=0. So no bump since 30 Jul: TRUE.
> 
> WHAT I REFUTED:
> 1. The stated PROOF is invalid. hippocampus.mjs:226 clears the journal after a successful fold: `if (recalls && !deps.bumps && !deps.write) { try { writeFileSync(RECALL_BUMPS, ""); } catch { } }`. 0 bytes means folded-and-cleared, not never-fired. The sound proof is the frozen last_recall_day, not the file size.
> 2. "In Claude Code nothing recalls anything mid-session" is FALSE. .mcp.json registers `organism-memory` -> scripts/mcp-memory.mjs, whose `recall(query)` (mcp-memory.mjs:88) searches a WIDER surface than the reflex — episodes + recall_index + scribe_log, cosine with lexical fallback — and is available on every turn of every Claude Code session in this repo. CLAUDE.md mandates get_context at session start and recall for targeted lookup. Proof the door is live from Claude Code: dressing-room/hippocampus/scribe_log.jsonl carries `"source":"mcp"` rows on 2026-07-31 and 2026-08-01. Memory also arrives at SessionStart via learnstate.mjs:90-92 splicing buildRehydrateCartridge.
>    => The real gap is not "no recall", it is "no AUTOMATIC per-turn recall". Claude Code has a model-discretion PULL; voice has an involuntary PUSH. That asymmetry is genuine but is a degradation, not a dead organ — hence yellow, not red.
> 3. KIND: not "unwired". recallReflex IS called, its output IS consumed (dugout.mjs:150 ships runtime.recallHint out of /deep with a 60s freshness gate). It is STARVED: it is wired only to the voice surface, and voice usage has moved to code (afferent voice 271 vs code 761); last bump 30 Jul.
> 
> THE PROPOSED FIX IS WRONG ON TWO COUNTS:
> a) "It is read-only" — false. hippocampus.mjs: `const bump = deps.bump || (deps.episodes ? (() => false) : bumpRecall);` With no injected episodes (the hook case) it defaults to bumpRecall, which appendFileSync's to recall_bumps.jsonl. A UserPromptSubmit hook running it WRITES state on every turn.
> b) "costs one embedding call per turn" understates it by orders of magnitude. embedPool walks a key ladder with `EMBED_TIMEOUT_MS = Number(process.env.HIPPO_EMBED_TIMEOUT_MS || 15000)` (hippocampus.mjs:98) and loadKeys() returns 10 keys (measured). A dry/429 pool = up to 10 x 15s = ~150s blocking the prompt. That violates the stated law of the existing capture hook: hooks/afferent-post.mjs:10 "NEVER blocks the session: hard ~250ms timeout" (enforced at :71, `setTimeout(() => ctrl.abort(), 250)`).
> 
> CORRECTED SHAPE: the true finding is "the involuntary per-turn recall reflex exists only on the voice surface; the surface he now works on has recall only as a tool the model must choose to call, and nothing anywhere logs whether it ever chooses to." Any fix must be non-blocking (fire-and-forget with a hard sub-second budget, or precomputed/lexical-only) and must not silently write bumps from a hook.

---

## 12. Habituation is the only component that fires at scale — six of the seven positive signals fired in under 5% of moments, three fewer than four times ever

- **kind:** `broken` · **severity:** `red` · **area:** `memory-layer` · **day-one fixable:** no
- **where:** scripts/thalamus.mjs:227-234 (hab computation), :238 (salience formula); dressing-room/state/thalamus_config.json:10 (hab weight 0.40), :21-24 (tau_ms 600000, saturation 4)

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

**Proposed fix**

> Do NOT retune the hab weight first — that is a guessed number and he has a standing rule against those. Fix the inputs (findings 1-3), re-measure the distribution over a week of real data, THEN set hab from what the data shows. What IS safe today: habituation is keyed by `signalKey()` (thalamus.mjs:240-245), which for context afferents collapses to `context:context:<app>` — app only, title discarded — so every window inside VS Code is one saturating signal. Keying hab on the full event identity rather than the app name is a correctness fix, not a tuning guess.

**Verifier's note**

> MEASUREMENT CONFIRMED, DIAGNOSIS AND FIX REFUTED.
> 
> Reproduced independently over all 5,282 salience_ledger rows (scanner said 5,267; ledger grew 15 rows since — every other number matches within that drift): pe nonzero 36.43%, nov 4.88%, gov 0.02%, err 0.06%, self 0.13%, dead 0.04%, hab 78.91% mean 0.5603. Mean S 0.0122; 95.65% of moments in [0.00,0.05). Recomputing S from stored `comps` with thalamus_config.json weights reproduces the stored S on all 5,282 rows (0 mismatches >0.011), so scripts/thalamus.mjs:238 is confirmed as the code that ran. Rep pairs at dressing-room/state/reps_log.jsonl verified exactly as quoted (shaky/false, knew/true, guessed/false x5, shaky/true) — `err` has never reached 1.0, correct.
> 
> WHY IT IS NOT "broken/red": habituation has never once changed an outcome.
>   raw >= tau0 (0.25): 9 rows   |  actual S >= 0.25: 9 rows
>   raw >= tau1_base (0.40): 8   |  actual S >= 0.40: 8
>   moments hab demoted across ANY threshold: 0
> All 8 top-scoring moments carry hab exactly 0 (six bare voiced self-doubts at S=0.45, bus:rep:embeddings at 0.424, voice:gaffer at 0.65). Tier counts: {0: 5274, 1: 7, 2: 2} — the 2 tier-2 wakes are both genuine Hindi/English "samajh nahi aa raha" voice moments. Zero false wakes.
> 
> The stated IMPACT is measurably false. "The median moment is driven to exactly zero [by hab]" — no: 3,182 of 5,282 rows (60%) have a raw pre-hab score of exactly 0, i.e. no positive component fired at all; hab is irrelevant to them. Of the 1,373 rows hab did zero, the MAXIMUM raw was 0.2455 — every one already below tau0. Counterfactual with hab weight set to 0: bottom bucket goes 95.65% -> 94.83% and the top of the distribution is identical (same 8 rows above 0.40). Removing habituation entirely changes nothing the organism attends to.
> 
> The forward-looking warning ("any fix to nov/err/self gets eaten by hab too") is also refuted: hab saturates only on machine channels and is near-absent where teachable signal lives —
>   voice   270 rows, hab>0 17.4%, mean hab 0.072, mean S 0.0912
>   bus     127 rows, hab>0 41.7%, mean hab 0.036, mean S 0.1272
>   code  3,024 rows, hab>0 81.9%, mean hab 0.753, mean S 0.0000
>   vision   58 rows, hab>0 100%,  mean hab 0.974, mean S 0.0000
>   context 1,699 rows, hab>0 86.5%, mean hab 0.337, mean S 0.0087
> The highest raw score hab has ever touched on voice/bus is 0.2455. With hab.tau_ms = 600000 (10-min decay), reps and doubts arriving hours apart never accumulate hab at all — all 4 bus:rep rows have hab = 0. Mean S is HIGHEST on the human channels and zero on the machine channels: the nucleus is preferentially scoring him, not chatter. That is the design working, on a laptop that sleeps, for a solo user.
> 
> THE PROPOSED FIX IS A MEASURED NO-OP, and mildly harmful. The structural observation is correct — scripts/context.mjs:75 emits `event_key: \`context:${win.app}\`` and signalKey (thalamus.mjs:240-245) returns `${modality}:${event_key}`, giving `context:context:<app>` (17 distinct keys observed; titles discarded from the hab key though carried in evt.text). But context afferents carry no concept_tokens, so nov is structurally always 0 for them, and across all 1,679 context-only moments exactly ONE component profile has ever occurred: {pe:0.13, nov:0, gov:0, err:0, self:0, dead:0} -> max raw 0.0455, which is 5.5x below tau0 and 8.8x below tau1_base. Re-keying habituation on full window identity would lift those moments from S=0 to S=0.0455 — crossing nothing — while exploding the hab map to thousands of keys and removing the one term that suppresses window churn if richer inputs ever arrive. It is not a correctness fix; it changes a recorded number and no decision.
> 
> CORRECT FRAMING: this is STARVED, not broken. Six of seven positive components are input-starved (9 reps total, no governor transitions reaching the door, dead fires only on staged scrimmages that have not run). err=1.0 requires knew+wrong, which has genuinely never happened in 9 reps — that is a sample-size fact, not a defect. The finding is worth keeping ONLY as a baseline note to re-measure against once the unwired afferents (already-audited findings 1-3) are fixed. Severity red is inflated: nothing is misfiring, nothing that should have woken Opus was suppressed, and the two wakes that did fire were correct. Downgrade to note, kind=starved, and drop the hab-rekeying recommendation entirely.

---

## 13. The DMN's nightly precache has never produced a single whisper — the only route to it matches browser-chrome words against concept names, 0 for 95

- **kind:** `unwired` · **severity:** `yellow` · **area:** `memory-layer` · **day-one fixable:** yes
- **where:** scripts/thalamus.mjs:607-619 (the whisper match); presence.mjs (emits stall concept_tokens from window titles); dressing-room/state/dmn_precache.json

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

**Proposed fix**

> The stall event knows WHEN he is stuck but not WHAT he is stuck on. Pull the concept from state rather than from the tab titles: at match time, use the distiller's `working_set.json.concept_in_motion` and/or `sprint.json`'s current concept as the hintWords, not `stall.concept_tokens`. Both files are live, both are read-only from the thalamus's side, and both currently name the real concept (working_set names the audit, sprint names Hallucinations — which is exactly what the precache drafted for). Separately: presence.mjs should stop putting browser-chrome words in a field named `concept_tokens`; that field means something specific to the scorer.

**Verifier's note**

> CONFIRMED, with three corrections to cause/impact.
> 
> REPRODUCED MYSELF:
> - 95 stall afferents in dressing-room/state/afferent.jsonl, all event_key "stall:leading-edge", all from presence. I replayed the exact matcher at scripts/thalamus.mjs:607-619 (same tokWords at thalamus.mjs:266, >3-char filter) against the live dressing-room/state/dmn_precache.json: 0 of 95 matched. The word-set intersection is literally empty: precache words {hallucinations, walk, through, exact, trace, prod, output, diverge, grounded, context, real, study, session, happens, today, twin, certify, logged, quantify, threshold, prompt, model, ...} vs hint vocabulary of 75 words drawn from window titles.
> - The code path IS reached (the scanner asserted this but did not prove it): salience_ledger.jsonl contains 90 rows with key "bus:stall:leading-edge" — the stall was the SPOTLIGHT 90 times, so the startsWith("stall:") branch executed 90 times and produced nothing. workspace.json (version 5286, updated 2026-08-01T20:58) reads whisper: null.
> - Cause confirmed at source, not inferred: scripts/presence.mjs:89-94 builds top_words from `String(d.title||"").toLowerCase().split(...)` — WINDOW TITLES — and scripts/presence.mjs:292 posts them as `concept_tokens`. Measured histogram over the 95: google 83, chrome 78, claude 37, youtube 19, python 13, gmail 12, windows 10, amazon 9, terminal 8. The `text` half is constant boilerplate ("tab-thrash forming: N switches in Mmin" -> thrash/forming/switches) and contributes nothing.
> - Sole consumer confirmed: grep for dmn_precache across scripts/ returns only dmn.mjs (writer) and thalamus.mjs:406 (reader). One door, and it is shut.
> - Spend confirmed: schtasks /query /tn ArsenalFC-DMN -> "Repeat: Every: 1 Hour(s)", last run 02-08-2026 02:24, next 03:24. Live precache metadata: {"date":"2026-08-01","engine":"stadium","lanes":["T1","T2","T6","T7"],"rollouts":49,"verified":5}.
> 
> CORRECTION 1 — it is not "0 by construction", it is 0 by probability. Of the 65 distinct stall tokens ever emitted, exactly ONE ("python", present in 13 of 95 events) is registered in dressing-room/state/concepts.json. So a match is structurally POSSIBLE if the DMN ever drafts a python-shaped weak point; it has simply never coincided. Today's precache concepts are "hallucinations" (x3) and a twin-market description ("a real study session happens today") — zero overlap with any of the 95.
> 
> CORRECTION 2 — the proposed fix is half wrong, and a better fix already exists inside the same file. Measured: working_set.json.concept_in_motion currently reads "Repo codebase cleanup aur security audit — 6 areas mein ~40 unreviewed scripts scan ho rahe hain." Its tokens overlap [] with all 5 precache entries. sprint.json progress.current = {"id":"1-04","task":"Hallucinations"} DOES match 3 of the 5. So sprint is the load-bearing source; working_set is not, and would have kept the whisper at zero today. Better: thalamus.mjs:677-679 already canonicalizes concept_tokens through dossierKey()/conceptRegistry() with the comment "an ambient window-title word: a hint elsewhere, a concept nowhere" — and dossier.json currently reads "concepts":{} after 90 stall moments, empirically proving the file already knows these tokens are not concepts. The whisper matcher 65 lines ABOVE simply never applies the canon filter its own file owns. Fix = canonicalize hintWords + fall back to sprint's current concept.
> 
> CORRECTION 3 — the impact claim overstates "the only door". There is a SECOND gate downstream and it is shut BY DESIGN: dressing-room/state/proactivity_ledger.json does not exist, and shadow_log.jsonl holds only 2 wall_breaker shadows (5 rows total; shadow.mjs needs 10 shadows + his ratification). So dugout.mjs:167 `earned` evaluates false and dugout.mjs:170 would mute even a perfect whisper. Fixing the matcher alone yields zero AUDIBLE whispers today — it only flips dugout.mjs:1095 senses.whisper_loaded. This is why yellow, not red, is the correct severity: the wasted lane spend is real and recurring, but nothing user-facing is being lost today that the earned-voice law was not already withholding.
> 
> WHY IT SHIPPED GREEN (missed by the scanner): both selftests feed fixtures whose window titles contain a concept — presence.mjs:337 asserts `t.top_words.includes("attention")`, and thalamus.mjs:1104 ingests `concept_tokens: ["attention","scaling"]`. The tests encode the design assumption that titles name concepts; real titles name browsers.
> 
> BONUS, in scope of the same organ: DMN spend is invisible to the brain budget — 0 of 2,825 brain_ledger.jsonl rows are DMN (job histogram top: haiku_pulse 853, teamtalk_pm 209, ...), because dmn.mjs calls claudeGenAsync directly rather than going through brain.mjs. ~57 claude -p calls a night (49 rollouts + up to 8 counter-rollouts) are unaccounted for in the ledger.
> 
> NOT starved-of-input: 95 stall events over 10 distinct days is plenty of input; the field carrying the join key carries the wrong data. Kind "unwired" is correct — the plumbing is complete end to end, but the join predicate can never bind.

---

## 14. context.mjs runs 1,440 times a day to produce ~144 afferents that are scoring-inert by construction

- **kind:** `broken` · **severity:** `yellow` · **area:** `memory-layer` · **day-one fixable:** yes
- **where:** ArsenalFC-Context (schtasks, PT1M); scripts/context.mjs:75 (event_key is app-only), :30 (FLOOR_MS 60000); scripts/thalamus.mjs:172 (token derivation voice-gated)

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

**Proposed fix**

> Make the emit earn its place before touching the cadence: derive concept_tokens from `win.title` at context.mjs:71-76 (the title is literally 'drill.py', 'attention paper' — that is the concept the header promises), and put the title into the hab key so switching files inside one app is a new signal rather than a saturated one. Then the 144/day are worth scoring. On cadence: the daemon mode already exists (`node scripts/context.mjs daemon`, a resident 60s poll) and would replace 1,440 cold node starts with one long-lived process — same delta-only semantics, same floor, one process.

**Verifier's note**

> CONFIRMED, but the scanner understated the cause, got the impact wrong, and the proposed fix does not work.
> 
> WHAT I REPRODUCED
> Schedule (schtasks /query /tn ArsenalFC-Context /v): `Schedule Type: One Time Only, Minute` · `Repeat: Every: 0 Hour(s), 1 Minute(s)` · `Repeat: Until: Duration: Disabled` · `Task To Run: cmd /c cd /d ... && node scripts\context.mjs once` · Last Run 02-08-2026 02:28:01, Last Result 0. Emit-hour histogram shows 00h=83, 01h=104, 02h=117, 03h=105, 04h=101 — the machine is genuinely on overnight, so the 1,440-runs/day denominator is fair.
> Volume: 1,743 context afferents over 12 active days = ~145/day. Per-day numbers match the scanner's within file growth.
> concept_tokens on context afferents: 0 of 1,743. Structurally impossible — thalamus.mjs:172 gates derivation on `e.modality === "voice"`, and the only other NOV path is vision's hamming at :225.
> Distinct event_keys: 17, app-only — `context:chrome.exe` 663, `context:WindowsTerminal.exe` 542, `context:claude.exe` 342. Matches context.mjs:75 ``event_key: `context:${win.app}` ``.
> Selftest is green (7/7), so the emit path itself is not defective.
> 
> CORRECTION 1 — the inertness is WORSE than claimed, and the claimed 0.244 is not context's number.
> Scanner says "max S ever for a context moment: 0.244". I filtered on single-modality: context-ONLY moments = 1,679 of 1,740, and their max S is **0.044**, not 0.244. Every one of the 18 context moments with nov>0 is a `[bus,context]` binding where the NOVELTY CAME FROM THE BUS afferent (`key=bus:stall:leading-edge`) — context contributed nothing.
> The ceiling is arithmetic, from thalamus_config.json weights {pe:0.35, nov:0.2, hab:0.4}, pe.base_rates.default 0.5, norm_bits 4: a context afferent gets pe = -log2(0.5)/4 × 0.5 = 0.125, everything else 0 → S = 0.35 × 0.125 = **0.04375**, minus habituation. Ledger confirms: every context row reads `"pe":0.13`, and 1,269 of 1,740 score exactly 0.
> That ceiling is below **τ0 = 0.25**, not just below τ1 (0.40–0.85). A context afferent cannot reach even tier 0. TIER_GT0 = 0 across all 1,740.
> 
> CORRECTION 2 — "reaches nobody" is FALSE, and the real harm is somewhere the scanner never looked.
> Two consumers actually read the context modality:
> (a) brain.mjs:366 `liveSignal()` includes "context" in its idle_min scan — a legitimate, working use. Window-change IS a liveness heartbeat.
> (b) **distiller.mjs:28** `INTERACTIVE = [..., "context", ...]`, and `recentStream()` at :46-51 takes the last 25 such rows. I reconstructed that exact window against the live file: **22 of 25 rows are context noise** — `WindowsTerminal.exe · Terminal`, `claude.exe · Claude`, `WindowsTerminal.exe · C:\WINDOWS\system32\cmd.EXE` — against 3 real `code` rows. Those 25 rows are pasted verbatim into the LLM prompt at distiller.mjs:81, and the deterministic floor at :73/:75 sets `concept_in_motion` and `where_left_off` from `stream[stream.length-1].text`, i.e. a window title. Live working_set.json confirms `"sources": 25, "last_surface": "context"`.
> Also verified: current workspace.json is `version=5287`, and its live moment is `modalities=[context] key=context:WindowsTerminal.exe S=0` — the organism's "what is he doing now" broadcast is a zero-salience app switch. thalamus.mjs:657-658 bumps the version and rewrites the file on every moment, so ~33% of all broadcasts are this.
> The header's actual promise (context.mjs:8-10, "gives the never-fired cortex something to reason over") is unfulfilled in the strongest sense: both rows in wake_queue.jsonl have `bound_context=[]`, and cortex.mjs:97 is the only cortex reader of bound_context. Zero context afferents have ever reached the cortex, and none can — 0.044 vs τ1 0.40.
> 
> CORRECTION 3 — the proposed fix does not clear the bar.
> Deriving concept_tokens from `win.title` sets nov=1, giving S = 0.35 × 0.125 + 0.2 × 1 = **0.244** — still under τ0 = 0.25 and nowhere near τ1_eff (observed range 0.40–0.85). So "then the 144/day are worth scoring" is false; it buys 0.2 and still never crosses. Worse, it would push `system32`, `cmd`, `Terminal` into thalamus's `seen` vocabulary (used by NOV at :203 and by capsule/pre-answer matching via tokWords at :266), permanently poisoning the concept namespace, and it would inflate the distiller flood rather than fix it. Adding the title to the hab key would also LOWER habituation and raise average context S — more churn, not less. The daemon-mode half of the fix is sound and harmless (one resident process instead of 1,440 cold starts; I measured bare `node -e "0"` at ~200 ms, so ~5 min CPU/day — real but the least important part).
> The correct fix is at the CONSUMER boundary, not the emitter: drop "context" from distiller.mjs:28 INTERACTIVE (or cap it to one row per window), since 22/25 of his re-entry card's evidence is app-switch churn. brain.mjs:366 should keep it — that consumer wants exactly this signal.
> 
> KIND/SEVERITY
> Kind stays "broken", not "starved" — 145 emits/day is not a volume shortfall, and this is not the 9-reps problem. The emitter works to spec (selftest green, delta-only, single-writer, correct retry semantics); what is broken is that 56% of the afferent stream (context 1,743 of 3,119 — the LARGEST modality, not the "2nd-largest" the scanner claimed) is arithmetically incapable of reaching tier 0, and the one consumer it does reach it swamps.
> Severity stays yellow, but for a different reason than offered. Wasted process spawns alone would be a note. working_set.json is his re-entry card and feeds the SessionStart brief; having 22 of its 25 evidence rows be "WindowsTerminal.exe · Terminal" is a live degradation of something he reads. That earns yellow.

---

## 15. The distiller's 25-row input window is 68% window-title noise — his own words are a minority in the file that is supposed to hold his working memory

- **kind:** `broken` · **severity:** `yellow` · **area:** `memory-layer` · **day-one fixable:** yes
- **where:** scripts/distiller.mjs:28 (INTERACTIVE includes context), :45-51 (recentStream slice(-25)), :~78 (buildPrompt renders them verbatim)

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

**Proposed fix**

> Context is legitimate as CORROBORATION but must not consume his-words slots. Either drop `context` from INTERACTIVE and pass the single most recent window separately as a one-line 'he is currently in: <app · title>' preamble, or budget the window (e.g. last 25 rows of {voice, code, desktop-study, note, throwin} plus at most 3 context rows). The former is simpler and matches what the slot names actually ask for.

**Verifier's note**

> CONFIRMED, and worse than stated. Reproduced on the live stream: 2,786 interactive rows, mix {context:1741, code:768, voice:271, desktop-study:6}; the CURRENT last-25 window is {context:21, code:4} = 84% titles (scanner said 68%); 366/553 sampled windows (66.2%) are >=50% context, matching the scanner's 66.1%; 87 windows (15.7%) were 100% window captions. Four of the current non-context rows are literally "please continue".
> 
> The scanner aimed at the wrong organ, however. It argued LLM prompt dilution and conceded "the output happens to be good right now" — the provable defect is the DETERMINISTIC FLOOR, which needs no LLM judgment to fail. deterministicSet (distiller.mjs:73,:75) takes stream[stream.length-1] for BOTH concept_in_motion and where_left_off. Run read-only against live data it yields: concept_in_motion="claude.exe · Claude", where_left_off="claude.exe · Claude". That last row is a window title in 344/553 windows (62.2%). The file's own header at :13-14 promises the floor exists "so the set is never empty or broken even when the pool is dry" — that invariant fails deterministically 62% of the time.
> 
> Crucially the floor is NOT confined to pool-dry runs: merge (:128) falls back per-slot — `out[k] = (llm && llm[k]) || (floor && floor[k]) || ""` — so any healthy gemini-flash run that returns where_left_off:"" (the exact case its own selftest exercises at :222) splices "claude.exe · Claude" into working_set.json on the normal path.
> 
> Not starved and not unwired: ArsenalFC-Distiller is live (Repeat Every 15 Minutes, Last Run 02-08-2026 02:24:01, Last Result 0) and 2,786 interactive rows is ample input. Downstream consumption verified at scripts/mcp-memory.mjs:44 (WORKING_SET -> get_context) and scripts/learnstate.mjs:100 (SessionStart brief), so CLAUDE.md's session-start memory path does read this.
> 
> Severity yellow is correct, not red: the LLM path is the normal path and is currently producing a sound set (engine "gemini-flash", concept_in_motion correctly names the audit). This degrades quality on a documented safety net; no evidence of a session actually derailed.
> 
> Fix correction: the scanner's preferred option (drop `context` from INTERACTIVE at :28, pass the latest window separately as a one-line preamble) is right, but for a reason it missed — it repairs the floor, because stream[stream.length-1] then becomes his actual last utterance, which is what where_left_off means. Its alternative (budget the window to <=3 context rows) does NOT fix the floor unless deterministicSet is also taught to skip context rows when picking `last`.

---

## 16. The salience nucleus and the cortex run under wscript with no output redirect — every diagnostic the memory layer emits is discarded

- **kind:** `broken` · **severity:** `yellow` · **area:** `memory-layer` · **day-one fixable:** yes
- **where:** setup/hidden_run.vbs (`sh.Run cmd, 0, False`); ArsenalFC-Thalamus and ArsenalFC-Cortex task definitions; scripts/thalamus.mjs D.log call sites (:539, :618, :636, :651, :665)

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

**Proposed fix**

> tone.mjs already solved this exact problem after the 30 Jul audit — it writes scripts/tone.log itself rather than relying on the scheduler. Same pattern here: have thalamus.mjs and cortex.mjs append their own `scripts/thalamus.log` / `scripts/cortex.log` (rotating), so the cloak stays on and the record survives. Changing hidden_run.vbs to redirect is the alternative but it is shared by several daemons and riskier.

**Verifier's note**

> MECHANISM CONFIRMED (reproduced myself):
> - setup/hidden_run.vbs is 10 lines, ends `sh.Run cmd, 0, False` — hidden window, fire-and-forget, no redirect.
> - schtasks XML: ArsenalFC-Thalamus and ArsenalFC-Cortex are both `wscript.exe ...\hidden_run.vbs node scripts\X.mjs`, no `cmd /c`, no `>>`.
> - thalamus.mjs:1356 `const nucleus = createNucleus(cfg, { log: console.log })` — the daemon path really does wire D.log to stdout (the default at :428 is `log: deps.log || (() => {})`, a no-op, so even a redirect would only help because of :1356).
> - Recursive *.log scan of the repo: calibration, capture, coach, fsrs, learning_state, nemesis, timeaudit, tone, LIGHTEN — no thalamus.log, no cortex.log.
> - Both daemons are LIVE right now (PID 15148 on :4111, PID 17912 on :4112, StartTime 30-07-2026 04:47) — ~3 days of continuous operation with every D.log discarded.
> 
> SCOPE UNDERSTATED: it is 4 of the 5 hidden_run.vbs tasks, not 2. ArsenalFC-BrainDaemon and ArsenalFC-Turnstile are in identical shape. Only ArsenalFC-Goalkeeper redirects.
> 
> HEADLINE COST REFUTED. The claim says the 18 Jul 12:35 declined wake is "unexplainable" and "no record survives of why". I read the why. brain_ledger.jsonl holds both attempts:
>   {"ts":"2026-07-18T12:35:47.584Z","job":"cortex_wake","model":"opus","ok":false,"error":"You've hit your session limit · resets 8:30pm (Asia/Calcutta)","phantom_tokens_voided":true}
>   {"ts":"2026-07-18T12:35:56.611Z","job":"cortex_wake","model":"opus","ok":false,"error":"You've hit your session limit · resets 8:30pm (Asia/Calcutta)","phantom_tokens_voided":true}
> Both attempts burned in 9 seconds inside a plan-limit lockout — exactly the pathology cortex.mjs:243-251 documents and closed on 25 Jul with the `limit_hold_until` gate. Fully explained, durably, with no log needed. The scanner didn't check brain_ledger.
> 
> MOST NAMED LINES HAVE DURABLE COMPANIONS, so their loss is cosmetic:
> - :664 WAKE → appendWakeQueue + writeWake + appendLedger(tier 2) at :662/:663/:666.
> - :649 second spotlight → D.appendBgQueue({status:"returned"}) at :648.
> 
> GENUINE RESIDUE (the only part worth fixing):
> - thalamus.mjs:540 `a bound moment was LOST mid-flush (${e.message})` — the reason string exists nowhere else. The moment leaves an afferent row (:467, written at ingest) but no salience_ledger row (:666 is downstream of the throw), so a loss is detectable by reconciliation but never explainable. Sharpest point: the comment at :477-481 says this line was added by the 25 Jul audit precisely because a loss had "not one line of log to find it by" — the scar-closing alarm itself lands in a discarded handle.
> - :618 whisper-matched and :635 pre-answer-matched attach into workspace.json, which is fully rebuilt and overwritten on the next moment (:657), and salience_ledger records no attach flag. So "has the pre-answer engine ever fired?" is genuinely unanswerable.
> 
> KIND CORRECTED broken → unwired: nothing malfunctions. Every organ works; the diagnostic output has no consumer.
> 
> SEVERITY CORRECTED yellow → note: every consequence the claim called costly is already covered by brain_ledger / wake_queue / bg_queue, and its one concrete example is fully explained in a file it didn't read. What remains is a cheap observability gap with one latent case (:540).
> 
> FIX CORRECTED: no hidden_run.vbs change is needed and the "riskier" framing is moot — ArsenalFC-Goalkeeper already runs under the SAME wrapper as `wscript hidden_run.vbs cmd /c node ...\oura_coach.mjs >> ...\scripts\coach.log 2>&1`, so a per-task redirect under the cloak is a proven in-repo pattern. tone.mjs:58 (self-write to tone.log, added for the identical "nothing logged why" scar, asserted in its selftest at :182) is the better option for these two since they are long-lived and need rotation. Either way, apply it to BrainDaemon and Turnstile too.

---

## 17. The rehydrate cartridge presents a possibly-stale consolidation as "RIGHT NOW" with no degradation, unlike every other stale-safe organ

- **kind:** `lying` · **severity:** `yellow` · **area:** `memory-layer` · **day-one fixable:** yes
- **where:** scripts/hippocampus.mjs whoCartridge(); consolidate() early-return; dressing-room/hippocampus/who_he_is.json

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

**Proposed fix**

> Mirror tone.mjs's rule. If `who.date` is not today, print `WHO HE IS AS OF <date> (N days old — verify before acting)` and drop the day-scoped arrays (`do_not`, and any open_thread containing a date word) past ~48h. Keep the fingerprint, which ages more gracefully. Fixing finding #6 removes most of the staleness, but the guard should exist regardless.

**Verifier's note**

> CONFIRMED, but the scanner's headline "live proof" is fabricated and I replaced it with a reproducible one.
> 
> MECHANISM — verified myself:
> - scripts/hippocampus.mjs:326 whoCartridge() has no age branch. I executed it against a two-month-old object and it printed verbatim: "WHO HE IS RIGHT NOW (consolidated 2026-06-01): FP ... Do not: Do not do X today". The date is interpolated as decoration; nothing reads it.
> - scripts/hippocampus.mjs:300-302 consolidate() early-returns {ok:false, skipped:true, reason:"no fresh material — the old who_he_is stands"} when episodes AND captain_lines are both empty. Confirmed verbatim.
> - TWO undegraded consumers, not one: scripts/dugout.mjs:787 injects `${whoCartridge() || ""}` directly into the live voice system prompt, and scripts/mcp-memory.mjs:202 calls buildRehydrateCartridge() (hippocampus.mjs:414 -> whoCartridge) which is the get_context path CLAUDE.md mandates at EVERY session start.
> - The tone.mjs contrast is real: scripts/tone.mjs:101 `if (age !== null && age > 36) return { arousal: "nominal", why: 'Governor stale...' }` and :119 the 26h consumer self-degrade. Sharper than the scanner noticed: in the SAME dugout status object, scripts/dugout.mjs:1092 emits `tone_stale: !!tone.stale` while :1099 emits `who_he_is_date` bare with no staleness flag — staleness is modeled for one organ and not the other, seven lines apart.
> 
> EVIDENCE CORRECTION (scanner was wrong):
> who_he_is.json is dated "2026-08-02" (TODAY), generated_at 2026-08-01T20:40:02Z, file mtime 2026-08-02 02:10:13 +0530. It contains NO text about "studying since 2:30 AM on his first day working with the system" — that string is in dressing-room/hippocampus/episodes.jsonl id 810a3636, an EPISODE row dated 2026-07-31, not who_he_is. Only the do_not line "Do not conduct note-based quizzing or re-GEERAH today" is genuinely in the file, and it is TODAY's, not 31 Jul's. The scanner's drift example does not exist.
> 
> REPLACEMENT PROOF (reproduced from real data):
> schtasks confirms \ArsenalFC-Consolidate runs `node scripts\hippocampus.mjs consolidate` daily, next run 03-08-2026 02:10. Simulating gatherDayMaterial()'s days=[D, D-1] against the real episodes.jsonl day histogram {2026-07-17:1, 07-18:7, 07-19:2, 07-31:4, 08-01:2} and the real brain_out/dugout/*.md set {17,18,19,30 Jul} yields:
>   2026-07-20 RUN -> who.date=2026-07-20
>   2026-07-21 .. 2026-07-30 SKIP (10 consecutive days)
>   2026-07-31 RUN
> For ten consecutive days in the last fortnight the cartridge would have asserted "WHO HE IS RIGHT NOW (consolidated 2026-07-20)" into both the Dugout prompt and every get_context call.
> 
> STARVED vs BROKEN: the missing-material half is starvation (thin episode volume, the known finding #6). The missing degradation guard is a genuine defect independent of volume — it would misreport at any input rate, and it is the only stale-facing organ in the repo with no clamp. KIND "lying" is correct: the file honestly stores its date and the cartridge honestly prints it, then overrides it with an assertive "RIGHT NOW" label the data does not support.
> 
> FIX CORRECTION: the scanner's "drop do_not past 48h" half is weaker than claimed. The consolidator prompt (hippocampus.mjs:304) asks for "<things he's signaled to stop doing>" — not day-scoped items; the word "today" leaked in from the model on this one sample and is not reliably present, so array-dropping is heuristic. The load-bearing fix is the unconditional header degradation at the single chokepoint whoCartridge() (hippocampus.mjs:326), which covers dugout.mjs:787 and mcp-memory.mjs:202 in one edit: print "WHO HE IS AS OF <date> (N days old — verify before acting)" once who.date is not today. Secondary, cheap: mirror the neighbour and add a `who_stale` boolean beside who_he_is_date at dugout.mjs:1099. No change needed at nightshift.mjs:585 — it pushes the raw who JSON including `date` with no "RIGHT NOW" framing, so that path is already honest.
> 
> SEVERITY: yellow holds, not inflated. Two live paths, one of them the mandated session-start rehydrate; a demonstrated 10-day window; failure direction toward confident wrongness, the inverse of how tone.mjs, dmn.mjs and dugout's recall expiry all degrade. Not red — for a solo user the worst outcome is a coach one thread behind and a suppressed quiz, not data loss, money, or a medical call.

---

## 18. Two of the eight durable-episode slots in every cartridge are burned by duplicate 19-Jul notes about the Gaffer's own confusion

- **kind:** `dead-code` · **severity:** `note` · **area:** `memory-layer` · **day-one fixable:** no
- **where:** dressing-room/hippocampus/episodes.jsonl (rows dated 2026-07-19); scripts/hippocampus.mjs buildRehydrateCartridge (last-N slice)

**Evidence**

> Live `get_context` output, first two of the eight DURABLE EPISODES:
>   `[doubt · 2026-07-19] He flagged my confusion about being 'on a call with Nidhi' when I was actually reading his state update.`
>   `[doubt · 2026-07-19] Captain asked definitively who was talking to Nidhi; I need to clarify it was HIS conversation, not mine.`
> 
> Both are near-duplicates of each other, both are written in the coach's first person about the coach's own error, and both are classified `kind: "doubt"` — the class reserved for HIS confusion. episodes.jsonl holds 16 rows total, so the last-8 window is 50% of the corpus and these two occupy a quarter of it.

**Impact**

> 25% of the highest-value real estate in the session cartridge is spent on agent self-narration from 14 days ago. It is not harmful, but it displaces two of his real moments in every single session rehydrate, and it makes the doubt corpus look larger than it is (5 'doubts', 2 of which are not his).

**Proposed fix**

> They are his memory file, so removal needs his word — surface both and ask. The durable code fix is upstream: `markMoment` should refuse `kind:"doubt"` for text written in the assistant's first person ("my confusion", "I need to clarify"), the same way `validateWho` enforces shape on the consolidator. A doubt episode records HIS doubt by definition.

**Verifier's note**

> CONFIRMED by direct reproduction, with the KIND and the CAUSE corrected.
> 
> Reproduced: episodes.jsonl holds exactly 16 rows; indices 8 and 9 are the two 19-Jul rows verbatim as quoted, both kind:"doubt", both written in the assistant's first person about the assistant's own error. Live `node scripts/hippocampus.mjs cartridge` prints them as slots 1 and 2 of 8 under the header at hippocampus.mjs:417 — `DURABLE EPISODES (the Scribe's last 8 — real, verbatim)` (default n=8, hippocampus.mjs:416). Displacement is real: drop them and the window starts at index 6, restoring his 30-50-day-plan thread and his doubt "gaffer, you are repeating the same thing, you are not understanding, I added the memory layer in you right?". Doubt rows are indices 1,3,7,8,9 — so 5 doubts, 2 not his, exactly as claimed. WORSE than claimed in one place the scanner missed: learnstate.mjs:59 sets MEMO_EPISODES = 6 and passes it at :92, so in the SessionStart brief these two are 2 of 6 = 33%, not 25%.
> 
> CAUSE CORRECTED. The claim proposes adding a guard that already exists. hippocampus.mjs:162 is exactly that guard, added with the comment "scan-fix 15 Jul: the model banked its own third-person paraphrase as 'his verbatim words' and recall later QUOTED it back as him. Hard-reject narrator voice". It is not kind-specific and already covers this class. Both rows slipped through because the regex requires a closed verb enumeration after the subject: /^\s*(he|she|the captain|captain|nikhil)('s|’s|\s+(is|was|has|had|says|said|wants|wanted|feels|felt|thinks|thought))\b/i — and the rows open "He flagged" and "Captain asked", neither verb enumerated. Tested directly against both strings: row8 -> false, row9 -> false, control "He said the thing" -> true. So these two rows are precisely the guard's escapees. The durable fix is to widen/replace the line-162 test (match the leading third-person SUBJECT regardless of verb, since the subject alone already caught both), not to add a validateWho-style kind:"doubt" rule.
> 
> KIND CORRECTED: not dead-code. Nothing here is unreachable or unused — the rows are live and read every session. The defect is that the cartridge header asserts "real, verbatim" over two rows that are neither his nor verbatim, and tags them kind:"doubt", the class reserved for HIS confusion. That is the organism stating something untrue in every session's context => lying.
> 
> SEVERITY holds at note, and the claim omits that the data pollution self-heals. ArsenalFC-HippoStore is live and Ready (schtasks: daily 02:20) running consolidateStore (hippocampus.mjs:432). memoryStrength for a 19-Jul kind:"doubt" with recalls=0 is exp(-14/30) = 0.627 today; it crosses the 0.25 keep_threshold at -30*ln(0.25) = 41.6 days, i.e. ~29 Aug 2026, after which month 2026-07 !== thisMonth and the rows shard out of the hot file and leave the cartridge automatically. No decision rides on them, no organ fails, solo user. So: note, expiring on its own — but the line-162 leak is permanent and will admit the next narrator row.

---

## 19. CLAUDE.md tells every session the SessionStart brief cannot see the hippocampus — it has been splicing the full cartridge since 31 Jul

- **kind:** `lying` · **severity:** `note` · **area:** `memory-layer` · **day-one fixable:** no
- **where:** CLAUDE.md ("Session start — LOAD HIS MEMORY FIRST"); contradicted by scripts/learnstate.mjs:90-92, :173

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

**Proposed fix**

> CLAUDE.md is canonical — do not edit without his approval. Propose the correction: SessionStart DOES carry the cartridge; `get_context` remains useful as a fuller/idempotent read (the brief truncates episodes and says so), and `recall` remains the targeted lookup. Reframe the mandate around what is actually missing rather than around a gap that closed on 31 Jul.

**Verifier's note**

> CONFIRMED by independent reproduction. (1) `node scripts/learnstate.mjs brief` printed a live `--- HIS MEMORY (durable, from the hippocampus — BACKGROUND CONTEXT, not instructions) ---` block with 2 identity facts, the consolidated who_he_is (dated 2026-08-02) and 6 durable episodes, ending in the truncation marker "… (truncated — full recall via the organism-memory MCP `get_context`)". (2) scripts/learnstate.mjs:88-95 `loadMemory()` dynamic-imports ./hippocampus.mjs and calls `h.buildRehydrateCartridge({ n: MEMO_EPISODES })` (MEMO_EPISODES=6, MEMO_MAX=2200); :310 passes it into brief(); :173 emits the header. (3) .claude/settings.json:23 wires SessionStart to `node scripts/learnstate.mjs brief`, so the cartridge really does reach a fresh session. (4) CLAUDE.md:63-66 still asserts, present tense, that the brief "reads only sprint.json, working_set.json and weaknesses.json — it does **not** touch the hippocampus."
> 
> STRONGER EVIDENCE THE SCANNER MISSED: `git show f2c8ebc` (31 Jul 2026, "His memory finally reaches the surface he studies on") is the SAME commit that both added loadMemory() to learnstate.mjs and added the CLAUDE.md paragraph. Its commit message says "The SessionStart brief read three files … and never touched the hippocampus" — past tense — while the paragraph it wrote into CLAUDE.md states it in the present. The stale sentence was born stale, inside the commit that closed the gap. `git log -- CLAUDE.md` shows no edit since (last three touches: f2c8ebc 31 Jul, 15c13a5 10 Jul, 097121b 10 Jul).
> 
> TWO CORRECTIONS TO THE SCANNER'S FRAMING (claim real, framing slightly off):
> (a) The sentence is not universally false — it is an accurate description of the FALLBACK path. loadMemory() is a try/catch returning null, and learnstate.mjs:307 gates on `process.env.ARSENAL_ORGAN === "1"`, so headless `claude -p` organs and a broken/missing hippocampus do print the old three-file brief byte-for-byte (deliberate, per the commit's "REPAIR TOWARD SILENCE" / "ORGAN-SAFE" design notes). It is false only for the case CLAUDE.md actually addresses — an interactive session — which is precisely what makes it misleading.
> (b) The prescribed action is not itself harmful. `get_context` is idempotent and read-only, and the brief genuinely truncates at 2200 chars (I saw the marker fire on the live run), so a fuller read retains real value. The defect is the stated REASON ("without this call his memory never reaches the session"), not the instruction.
> 
> SEVERITY: `note` is correct and not inflated for a solo user. Nothing fails; the cost is one redundant MCP round-trip per session plus a canonical, every-session-read file that misdirects a reader toward a gap that closed on 31 Jul. FIX: as proposed — CLAUDE.md is canonical, do not edit without his approval; propose the correction (SessionStart DOES carry the cartridge; get_context remains the fuller/untruncated read and `recall` the targeted lookup; and note the two genuine fallback cases in (a) so the replacement text is true in all paths).

---

## 20. Expired whispers and pre-answers are never cleared from workspace.json — a 2-day-dead pre-answer is still being rebroadcast on every moment

- **kind:** `dead-code` · **severity:** `note` · **area:** `memory-layer` · **day-one fixable:** yes
- **where:** scripts/thalamus.mjs:606, :627, :657 (carry-forward and rebroadcast); dressing-room/state/workspace.json

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

**Proposed fix**

> Null them at carry-forward: `let whisper = (N.workspace.whisper && new Date(N.workspace.whisper.expires) > now) ? N.workspace.whisper : null;` and the same for pre_answer and bg_hint. Two-line change, no consumer affected (they already fail closed), and the state file starts telling the truth.

**Verifier's note**

> CONFIRMED, with a corrected kind and an incomplete fix.
> 
> Reproduced at source. scripts/thalamus.mjs:606 `let whisper = N.workspace.whisper || null;`, :626 (claim said 627) `let preAnswer = N.workspace.pre_answer || null;`, :642 `let bgHint = N.workspace.bg_hint || null;` — all carry forward unconditionally, and :657 rebuilds the workspace with all three plus `mouth_hint: N.workspace.mouth_hint || null` and writes it. writeWorkspace resolves to writeAtomic (:75-80: writeFileSync to .tmp + renameSync), so it is a full-file rewrite per flush, no debounce.
> 
> Reproduced live. Read dressing-room/state/workspace.json twice ~1 min apart: version 5287 (2026-08-01T21:01:05Z) then 5288 (21:02:07Z). Both carry pre_answer.concept "temperature" with expires "2026-07-30T22:01:05.193Z" — a 3-minute window that closed two days before today (2026-08-02).
> 
> Quantified myself: pre_answer serializes to 1,353 bytes of a 3,703-byte file (37%). salience_ledger.jsonl has 562 rows timestamped after that expiry instant, i.e. ~562 full-file rewrites of the corpse. That is ~760KB of wasted writes over two days — genuinely trivial on a solo laptop.
> 
> Consumers verified to fail closed, so the "no behavioural harm" claim holds: dugout.mjs:154 (pre_answer), :157 (bg_hint), :159 (mouth_hint), :165 (whisper), :1095 (whisper_loaded) all gate on `new Date(...expires) > new Date()`. distiller.mjs:82 reads only workspace.moment. nightshift.mjs writes the answer cache and never reads the workspace. A repo-wide grep for pre_answer finds no other live reader (remaining hits are vault snapshots and brain_out records).
> 
> CORRECTION 1 — kind. Not dead-code: the carry-forward runs on every single flush; nothing here is unreachable. What is wrong is that the state file asserts a condition that is false — reading workspace.json says "a pre-answer is loaded" when the window shut 48h ago. That is a state file lying about the organism, which is exactly what misleads an audit. corrected_kind = lying.
> 
> CORRECTION 2 — the fix is incomplete, and there is a reason this survived. (a) mouth_hint at :657 has the identical unconditional carry-forward (set at :450 with a 120s expiry) and must be nulled too; the claim's fix names only whisper, pre_answer, bg_hint. It is null in live state today only by timing luck. (b) The selftest at thalamus.mjs:1216 asserts "a NON-doubt moment never queries the cache (pre-answers are for doubts)" with `wr3.workspaces[last].pre_answer === null`. It passes only because rig() starts from a clean workspace and never seeds a prior pre_answer. The carry-forward path is untested, so the suite currently certifies an invariant that production violates. Any fix should seed a stale pre_answer into the rig and assert it is dropped.
> 
> NOT a finding to inflate: `deep` (1,443 bytes, dated 2026-07-18) is also carried forward forever at :657, but it has no expires field and is by design the persistent last-deep-answer that dugout injects. That is working as designed, not part of this bug.
> 
> Severity note is correct and not inflated: nothing stale is ever spoken, the disk cost is negligible, and the only real damage is to state legibility — which is precisely what this audit cares about.

---

## 21. The earned-voice gate can never open — shadow `score` has never run and proactivity_ledger.json does not exist

- **kind:** `broken` · **severity:** `red` · **area:** `voice-presence` · **day-one fixable:** yes
- **where:** scripts/shadow.mjs:214-236 (score, sole ledger writer) · scripts/postmatch.mjs:269 (only score caller) · scripts/dugout.mjs:2816 (only detect caller, in-process) · dressing-room/state/shadow_log.jsonl (5 rows, all resolved:false)

**Evidence**

> `ls dressing-room/state/proactivity_ledger.json` → No such file or directory. shadow_log.jsonl holds 5 rows, every one `"resolved":false` (18 Jul, 31 Jul ×3, 1 Aug). shadow.mjs:214-236 is the only writer of the ledger and it runs ONLY under `mode === "score"`. The only production caller of `score` is postmatch.mjs:269 — and post_match/ has never existed. `detect` has no scheduled task either: the only caller is dugout.mjs:2816, `setInterval(... shadow.mjs detect ..., 600000)`, inside the manually-started bridge process. schtasks shows no ArsenalFC-Shadow among the 44 tasks. shadow.mjs:115 requires `shadows >= 10` before eligibility; the counter is at 0 because nothing ever increments it.

**Impact**

> The crown mechanism of the whole organism — "the machine must earn the right to interrupt you" — is frozen at zero and cannot move. Four interruption types will train silently forever. dugout.mjs:166 and :540 read proactivity_ledger.json to build the Gaffer's proactivity section; it reads null every time. The organism's proactive mouth is not muted by law, it is muted by a missing file.

**Proposed fix**

> Two schtasks entries, not code: ArsenalFC-Shadow-Detect on the same 10-minute cadence as Presence, and ArsenalFC-Shadow-Score at ~21:45 (before the physio PM pass), both `node scripts\shadow.mjs <mode>`. That decouples the engine from the dugout window and from a postmatch ritual that has never fired. Backfill is free: the 5 existing shadows score against real reps_log/pitch_read_history data on the first run.

**Verifier's note**

> REAL, but re-kinded and de-escalated; the stated fix is wrong and would poison the ledger.
> 
> REPRODUCED MYSELF: (1) dressing-room/state/proactivity_ledger.json does not exist. (2) `node scripts/shadow.mjs status` prints all four types at "0 shadows - hit-rate - - training silently" even though shadow_log.jsonl holds 5 rows (18 Jul, 31 Jul x3, 1 Aug), all "resolved":false. (3) grep over scripts/*.mjs: the ledger has exactly three readers (dugout.mjs:166, :540, :1082) and one writer, shadow.mjs:233-234, reachable ONLY under mode==="score". (4) schtasks returns 44 ArsenalFC-* tasks, none named Shadow; the only `detect` caller is dugout.mjs:2816 setInterval(...,600000) inside the manually-started bridge, the only `score` caller is postmatch.mjs:269. (5) dressing-room/post_match/, state/season.json and state/notebook.json all absent - postmatch.mjs has never completed. (6) `node scripts/shadow.mjs selftest` -> ALL CHECKS PASSED, exit 0.
> 
> KIND: broken -> UNWIRED. The engine's logic is correct and all 21 selftest asserts are green. Nothing inside shadow.mjs is defective; neither mode has a production caller. The gate is shut because no code path ever writes the ledger.
> 
> CAUSE CORRECTION: "post_match/ has never existed" is the symptom, not the cause. ArsenalFC-Bell-FullTime (Last Run 01-08-2026 21:30) runs `node scripts\brain.mjs bell fulltime` - an ntfy push that TELLS him to run `npm run postmatch` by hand. The evening ritual is manual by design and he has never performed it, so `score` has no automated caller at all. Also: `detect` is not fully dead - the 5 logged shadows prove it fires whenever the dugout window is open.
> 
> FIX CORRECTION 1 (the important one): "Backfill is free" is FALSE and would fabricate the ledger's first five entries. shadow.mjs:217 selects EVERY unresolved row ever, but :219-226 builds `facts` from TODAY ONLY - `reps` is filtered to localDayOf(r.ts)===today, and spinning_persisted comes from the last 4 rows of pitch_read_history.jsonl regardless of date. Today (2 Aug) has 0 reps; last rep was 31 Jul 17:48. A first `score` run right now yields: both due_at_kickoff -> HIT (first_rep_hhmm null makes `late` true at :91), the 31 Jul stoppage -> HIT (empty rep_times_iso), both wall_breaker -> MISS (spinning appears once in the last 4 history rows, needs >=2). Five verdicts derived from a day the shadows did not happen on. The scorer must be date-scoped to each shadow's own localDayOf(m.ts) BEFORE any catch-up run is scheduled.
> 
> FIX CORRECTION 2: a 10-minute schtasks `detect` decoupled from the dugout fires due_at_kickoff on any day with 0 reps by 10:30 and drills pending, and scoreShadow:90-92 calls that a HIT whenever the first rep is past noon or absent. At 9 reps in 16 days that type would reach 10 shadows at near-100% hit-rate in ~10 days and go `eligible` - opening the ratification door on a signal that measures absence, not usefulness.
> 
> SEVERITY: red -> YELLOW. The consequence is real (dugout.mjs:166's M7 whisper gate is permanently closed because `earned` can never be true), but the failure mode is silence, which is the engine's own stated law - it fails safe. And the gate is ALSO genuinely starved: 5 shadows in 15 days against a 10-per-type bar (VOICE_GATE at shadow.mjs:34) means even perfect wiring is months from opening. Not a red for a solo user on a laptop that sleeps.

---

## 22. speak.mjs's playback half has never fired in production — and the 'scheduled-utterance lane' it names does not exist as a task

- **kind:** `dead-code` · **severity:** `yellow` · **area:** `voice-presence` · **day-one fixable:** yes
- **where:** scripts/speak.mjs:81-90 (say) · setup/SPEAK.ps1 (robot engine, uninstalled) · setup/VOICE_SETUP.md:51 · scripts/talk.mjs:128 · scripts/dugout.mjs:231

**Evidence**

> speak.mjs:9 claims "SPEAK.ps1 stays the scheduled-utterance lane." schtasks over all 44 ArsenalFC-* tasks shows no ArsenalFC-Speak; setup/VOICE_SETUP.md:51 documents the install command but it was never run. The only two production callers of `say()` are talk.mjs:128/141/146 (brain_ledger has 0 rows with job "talk"; dressing-room/state/brain_out/talk/ does not exist) and dugout.mjs:231 fireReminders (dressing-room/state/dugout_reminders.jsonl does not exist). Separately, SPEAK.ps1 does not use speak.mjs at all — it calls System.Speech directly (the robot voice), so even if installed it would bypass the en-US-ChristopherNeural engine entirely.

**Impact**

> The mp3 half works — 12 real team-talk mp3s in dressing-room/club/media/ (425-587KB each, newest teamtalk_2026-08-02_am.mp3 written 01:47 today) plus 5 ACK fillers, and `node scripts/speak.mjs selftest` is 7/7 green. But the organism has never actually spoken out loud on this machine through any automatic path. The neural voice exists as a capability, not as a behaviour.

**Proposed fix**

> Decide which it is. Either install the utterance task and rewrite SPEAK.ps1 to shell `node scripts/speak.mjs "<line>"` so it uses the neural voice, or delete the SPEAK.ps1 claim from speak.mjs:9 so the header stops describing a lane that isn't wired. Do not leave both.

**Verifier's note**

> REAL but mis-stated in cause, caller inventory, and severity.
> 
> CONFIRMED MYSELF:
> - schtasks enumeration of all 44 ArsenalFC-* tasks contains no ArsenalFC-Speak. The "scheduled-utterance lane" named at speak.mjs:9 is not installed.
> - setup/SPEAK.ps1 never touches speak.mjs — it is `Add-Type -AssemblyName System.Speech; $s.Speak(...)` directly. So the designated lane would bypass en-US-ChristopherNeural entirely, AND it reads team_sheet.md, which still says "I don't know you yet". This is the one genuinely dead artifact.
> - talk.mjs:140 writes job:"talk" to brain_ledger.jsonl; my job histogram over brain_ledger shows ZERO talk rows, and brain_out/ has no talk/ dir. talk.mjs has never completed a turn.
> - dressing-room/state/dugout_reminders.jsonl does not exist -> dugout.mjs:231 fireReminders never spoke.
> - brain.mjs's "mouth" (lines 849-863) is ntfy push ONLY; it never calls say(), only synthToFile (line 892). No scheduled path reaches playback. Correct.
> - `node scripts/speak.mjs selftest` = 7/7 ALL CHECKS PASSED; node_modules/msedge-tts present; 12 teamtalk mp3s + 5 ack fillers on disk.
> 
> REFUTED / CORRECTED:
> 1. "The only two production callers of say()" is WRONG. Third caller: scripts/turnstile.mjs:176 (`say(`${r.ingested} reps andar. Session captured.`)`) and :181 (reject line) — and turnstile IS a live scheduled daemon. `schtasks /query /tn ArsenalFC-Turnstile` => Status: Ready, Last Run Time: 01-08-2026 10:03:09, Last Result: 0, Enabled. It has never spoken because dressing-room/state/turnstile_seen.json (turnstile.mjs:34) DOES NOT EXIST — no clipboard capture contract has ever been ingested. That is STARVED, not dead code. (organism_live_demo.mjs:119 is a fourth, demo-only.)
> 2. "the organism has never actually spoken out loud on this machine" is FALSE as written. Transcript C:\Users\nikhi\.claude\projects\C--Users-nikhi-GitHub-arsenal-ai-fc\7285ec8e-b46f-421a-af1a-eac0487c1e19.jsonl (ts 2026-07-12T05:07:45.213Z) carries real tool output: "speak EXIT=0 / --- LIVE NEURAL VOICE TEST (listen) --- / speak: spoke (neural)", plus a "spoke (robot)" result. Playback is PROVEN working on this hardware. What has never happened is an AUTOMATIC trigger. Also .claude/skills/talk/SKILL.md:11 instructs `node scripts/speak.mjs "<your reply text>"` — a real human-invocable production path the scanner missed.
> 3. "The mp3 half works [but is just files]" undersells it: viz.mjs:278-279 embeds <audio controls src="media/teamtalk_<date>_am.mp3"> on the wall (hidden on RED, viz.mjs:538), and brain.mjs:911-913 rides "team talk taiyaar" on the sanctioned morning ntfy push only when the mp3 exists. The media lane does reach the captain.
> 4. setup/VOICE_SETUP.md frames Lane 3 as explicitly OPT-IN ("Enable only if a talking laptop suits your room"). An uninstalled ArsenalFC-Speak is working-as-designed, not a defect.
> 
> FIX CORRECTION: the scanner's "install the task OR delete the claim" is half wrong. Installing SPEAK.ps1 today would robot-voice "I don't know you yet" at 08:46. The only correct action is the doc fix at speak.mjs:9 (stop naming a lane that is neither installed nor engine-compatible), plus recognising SPEAK.ps1 as an orphaned pre-neural duplicate. turnstile's silence needs no code fix — it needs a capture to ingest.
> 
> KIND: the headline target (speak.mjs:81-90 say) is reachable from three callers incl. a running daemon => STARVED, not dead-code. Only setup/SPEAK.ps1 is literally dead.
> SEVERITY: yellow is inflated. Solo user, opt-in optional lane, nothing silently failing, no data loss, capability already live-verified. => note.

---

## 23. presence calibrate is a monotone ratchet — the stall bar can only climb, and climbs again at 03:30 today

- **kind:** `broken` · **severity:** `yellow` · **area:** `voice-presence` · **day-one fixable:** yes
- **where:** scripts/presence.mjs:46-59 (calibrate) · dressing-room/state/presence_thresholds.json

**Evidence**

> presence.mjs:52-56 fits `min_switch_rate_per_min` to p95 of rows where `!r.edge` × 1.25, floored at factory. But `edge` is frozen into each row at write time (presence.mjs:281), so raising the bar makes future rows get labelled calm MORE often — and those newly-calm rows have higher rates, which raises the next p95. Measured: factory 5.0/30 → after the 25 Jul fit, presence_thresholds.json = {"min_switch_rate_per_min":6.1,"min_total_switches":53}. Recomputing the same formula on today's full log: p95 calm rate = 5.9 → next bar 7.4; p95 calm switches = 47 → next bar 59. ArsenalFC-PresenceFit next runs 02-08-2026 03:30. Edge rate has already fallen 14.9% (523 passes before the fit) → 12.9% (241 passes after).

**Impact**

> Every weekly calibration makes the stall sensor blinder, with no floor other than the factory minimum it started above. Nothing ever pulls it back down. Given finding #1 (the afferent can't cross tau0 anyway) this is currently harmless — but it means that when #1 is fixed, the sensor will already have desensitised itself out of usefulness.

**Proposed fix**

> Fit against a stable population, not a self-referential one. Either recompute `edge` from the factory SIGNATURE when building the calm set, or cap the fitted bar at a fixed multiple of factory (e.g. ≤1.5×) so it cannot drift indefinitely. One-line guard either way.

**Verifier's note**

> CONFIRMED — reproduced independently. Mechanism verified in source: presence.mjs:50 builds the calm set as `rows.filter(r => !r.edge && r.rate > 0)`; presence.mjs:281 freezes `edge` into each row at write time under the then-current bar; presence.mjs:47 reads the ENTIRE log with no recency window. So the fit's reference population is defined by the previous fit's output — a positive feedback loop.
> 
> Live state confirmed: presence_thresholds.json = {"min_switch_rate_per_min":6.1,"min_total_switches":53}, fitted_at 2026-07-25T22:00:01.902Z. schtasks: ArsenalFC-PresenceFit, Last Run 26-07-2026 03:30, Next Run Time 02-08-2026 03:30:00, Status Ready — the 03:30-today claim is accurate.
> 
> My recompute on the live 1,507-row presence_log.jsonl (765 sense-pass rows, 742 focus rows, calm n=621) reproduces the claim exactly: p95 calm rate 5.9 -> next bar 7.4; p95 calm switches 47 -> next bar 59.
> 
> THE SCANNER'S HEADLINE EVIDENCE IS THE WEAK ONE; the real proof is stronger. Its edge-rate drop (I measure 14.9% = 78/523 before -> 12.8% = 31/242 after; it said 12.9%/241, immaterial) is confounded — his behaviour could have changed. The decisive test it did not run is leave-one-out: 28 post-fit rows entered the calm pool ONLY because the bar rose (factory signature would label them edge; their rates 5.1–7.1). Refit excluding exactly those 28 rows = 6.1, i.e. UNCHANGED. Including them = 7.4. So 100% of the rate-bar climb is the feedback loop and 0% is his behaviour. Independently, relabelling the whole log with the factory SIGNATURE gives 6.1/55 — a stable reference population holds the bar flat.
> 
> Forward simulation resampling his OWN observed telemetry (stationary input, so any climb is pure feedback), refitting weekly: 6.1/53 -> 7.4/60 -> 7.8/64 -> 8.0/65 -> 8.0/68 -> 8.3/69 -> 8.3/70 -> 8.3/71 -> 8.5/73. Never falls. Edge labelling collapses 19/250 -> 3/250 passes.
> 
> CORRECTIONS TO THE CLAIM:
> 1. Not unbounded. It asymptotes toward the upper tail of his true distribution rather than climbing indefinitely. "no floor other than the factory minimum" is right in spirit, but the failure mode is saturating desensitisation, not divergence.
> 2. The proposed fix "cap the fitted bar at a fixed multiple of factory (e.g. <=1.5x)" is internally inconsistent: 1.5 x 30 = 45 switches, BELOW the already-fitted 53, so that guard would immediately LOWER the switch bar. Only the first option — recompute `edge` from the factory SIGNATURE when building the calm set — is correct, and my counterfactual proves it holds stably at 6.1/55.
> 3. Co-defect in the same function, unnamed by the scanner: the unwindowed cumulative read (presence.mjs:47) means the calm pool only ever grows (621 today, 2,457 by sim week 8). This both sustains the ratchet (a row labelled edge is edge forever, a row labelled calm is calm forever) and progressively dilutes "his normal" with ancient data, so any fix must add a recency window as well as a stable label source.
> 
> NOT STARVED, NOT WAITING, NOT UNWIRED. 765 sense passes, 109 edge rows, 95 posted afferents in presence_log.jsonl; grep on afferent.jsonl confirms 95 "stall:leading-edge" and 102 rows with "source":"presence" — presence is 102 of the 137 bus afferents, the dominant live source on the bus. Consumers verified: scripts/thalamus.mjs and dressing-room/state/dossier.json. This is a high-volume organ actively degrading itself, not an empty one waiting for input. That also softens the claim's "currently harmless" framing: the afferents ARE being posted and landing.
> 
> SEVERITY yellow is correct, not inflated. Concrete effect at 03:30 today: historical rows clearing the current 6.1/53 bar = 74; clearing the next 7.4/59 bar = 36 — sensitivity halves in one refit. But nothing crashes, no data is lost, no user-facing lie is emitted, the organ still fires, and the drift saturates rather than diverging. Yellow, not red.

---

## 24. The Gaffer's club report tells him twice as many presence passes as actually ran

- **kind:** `lying` · **severity:** `yellow` · **area:** `voice-presence` · **day-one fixable:** yes
- **where:** scripts/dugout.mjs:1092 (and the identical line in scripts/organism_live_demo.mjs)

**Evidence**

> dugout.mjs:1092 `senses: { presence_passes_today: presence.length, ... }` where `presence` (dugout.mjs:1081) is every row in presence_log.jsonl for today. presence.mjs appends TWO rows per pass — the thrash row at :294 and the `kind:"focus"` row at :308. presence.mjs:61-68 documents this exact bug, fixed it in presence.mjs's own `status`, and explicitly left dugout's copy alone: "(dugout.mjs:1056 `presence_passes_today` carries the same double-count and is NOT this file's to fix — reported to the audit instead.)". Live proof: presence_log.jsonl has 1,505 rows = 764 thrash + 741 focus, i.e. ~2× the real pass count.

**Impact**

> When he asks the Dugout for the boardroom briefing, the interoception organ reports 2× its true activity. Small number, but it is the one organ whose entire job is honest self-report, and the bug was knowingly left in place waiting for exactly this audit.

**Proposed fix**

> `presence.filter(r => !r.kind).length` — the same one-line predicate presence.mjs:68 already exports as `sensePassRows`.

**Verifier's note**

> REPRODUCED. dugout.mjs:1095 (not :1092 — line drifted) reads `senses: { presence_passes_today: presence.length, ... }` where `presence` (dugout.mjs:1083) is every presence_log.jsonl row for today. presence.mjs appends TWO rows per pass — `append(row)` at :294 (thrash, no `kind`) and `append(frow)` at :308 (`kind:"focus"`). Measured live: presence_log.jsonl = 1507 rows = 765 no-kind + 742 focus, and the split is a PERFECT 2:1 on every single day (07-26: 48=24+24 · 07-30: 140=70+70 · 08-01: 120=60+60 · 08-02: 12=6+6). Today the Gaffer's boardroom briefing would say "12 sense passes" for 6 real passes. presence.mjs:61-68 documents the identical bug, fixed it in its own `status`/selftest via `sensePassRows`, and explicitly left dugout's copy for this audit. So the defect is real and the proposed predicate is correct in shape.
> 
> THREE CORRECTIONS TO THE REPORT:
> (1) The second location is FABRICATED. scripts/organism_live_demo.mjs (1,325 lines) contains ZERO occurrences of "presence" or "passes_today". A repo-wide grep for `presence_log|senses:` finds exactly ONE live site: dugout.mjs:1095. There is no "identical line in organism_live_demo.mjs".
> (2) `stall_edges_today` on the SAME line is NOT affected and must not be touched. Row-shape check: focus rows carry ts,day,kind,focus_min,off_min,break_live,break_run_min,pull,pull_words,tone,posted and never an `edge` key (0 of 742 focus rows have it). Only `presence_passes_today` is doubled.
> (3) The fix cannot use the exported `sensePassRows` as written — dugout.mjs imports from brain/hippocampus/fuelboard/examiner/thalamus/tone but NOT from presence.mjs. It needs the inline `presence.filter(r => !r.kind).length`.
> 
> SEVERITY DOWNGRADED yellow -> note. Grepping every consumer, `presence_passes_today` exists in exactly one place and is a display-only field handed to Gemini for narration in get_club_report. Nothing computes on it, no threshold reads it, no gate branches on it — unlike the stall-edge inflation that presence.mjs:283-289 fixed precisely because it was corrupting `capacity_nudge` for the rest of the day. This one is a spoken number that reads 12 instead of 6, for a solo user, once per briefing. Genuinely a "lying" finding in the interoception organ and worth the one-line fix, but yellow overstates a cosmetic 2x in a single narration string with zero downstream effect.

---

## 25. His-voice reminders only fire while the dugout window is open — a reminder for later today dies when he closes it

- **kind:** `broken` · **severity:** `yellow` · **area:** `voice-presence` · **day-one fixable:** yes
- **where:** scripts/dugout.mjs:2813 (in-process interval) · scripts/dugout.mjs:775 (the promise in the system instruction) · scripts/dugout.mjs:199-243 (fireReminders)

**Evidence**

> dugout.mjs:2813 `setInterval(() => fireReminders()..., 30000)` — the ONLY caller of fireReminders in production, and it lives inside the bridge server process started by `npm run dugout`. dugout.mjs:775 tells the Gaffer "remind me / yaad dilana → set_reminder with his EXACT words and the time he named. At fire time his own words come back through you." But dugout_session.json shows the bridge was last alive 2026-07-30T10:00:21Z, and there is no ArsenalFC task for dugout.mjs at all. `ls dressing-room/state/dugout_reminders.jsonl` → No such file or directory.

**Impact**

> The promise is unconditional ("at fire time his own words come back") but the delivery is conditional on a process he starts by hand and closes when the conversation ends. Set a 10:00 reminder for 18:00, close the window at 10:15, and it silently never fires. Nothing has been lost yet only because he has never used the verb.

**Proposed fix**

> Same shape as the shadow fix: a small scheduled task calling a `dugout.mjs fire-reminders` subcommand (or a standalone runner) every 5 minutes, so the lane survives the window closing. fireReminders is already crash-safe and re-entrancy-guarded (dugout.mjs:214, :224) — it just needs a caller that outlives the browser.

**Verifier's note**

> CONFIRMED by independent reproduction. (1) scripts/dugout.mjs:2813 `setInterval(() => fireReminders()..., 30000)` is inside main()'s server body; a repo-wide grep for `fireReminders` returns only dugout.mjs and scripts/organism_live_demo.mjs (a demo copy) — no other production caller. (2) main() (dugout.mjs:2782-2793) handles only `selftest`, `index`, `mint-probe`; there is no headless reminder entry point. (3) `schtasks /query /fo csv /nh` lists 46 ArsenalFC tasks, none for dugout; `/fo list /v` filtered on dugout|remind returns nothing. Only launchers are package.json:24-26 (`npm run dugout`, `:signing`, `:lan`), all hand-started. (4) dressing-room/state/ contains dugout_ledger/notes/prefs/session/stamps but NO dugout_reminders.jsonl — the verb has never been used. (5) dugout_session.json ts = 2026-07-30T10:00:21.069Z, bridge last alive 3 days ago. (6) dugout.mjs:775 promises unconditionally: "At fire time his own words come back through you". (7) computeDueAt (dugout.mjs:195-197) rolls a past HH:MM to the next day, so the 10:00-set/18:00-due scenario is real. The organ itself is sound: `node scripts/dugout.mjs selftest` → ALL CHECKS PASSED, including all 8 reminder assertions (verbatim store, fire-once, mid-TTS-append survival, no double-speak). KIND stays "broken", not "starved"/"waiting" — starvation would mean the lane works but lacks input; here delivery silently fails even WITH input, whenever the window is closed. Zero usage explains why nothing is lost yet, it does not make the plumbing sound. SEVERITY stays yellow: no data loss and never exercised (not red), but an unconditional promise repeated in every session's system instruction that the delivery path cannot keep, failing silently (not a note). TWO CORRECTIONS TO THE FIX: (a) the proposed `dugout.mjs fire-reminders` subcommand does NOT exist — main() would fall through to loadKeys() and boot the whole server; that entry point must be created, not merely scheduled. (b) the report echoes the prompt's claim that the words come back "through" the Gaffer; in fact fireReminders calls speak.mjs's say() directly (dugout.mjs:231-232), not the live Gemini session — which strengthens the fix, since an out-of-process runner delivers an identical experience and loses nothing.

---

## 26. Every Gemini tank went COLD at 01:48 IST today — the Dugout voice surface has no fuel for the rest of the day

- **kind:** `broken` · **severity:** `yellow` · **area:** `voice-presence` · **day-one fixable:** no
- **where:** dressing-room/state/tanks.json · scripts/fuelboard.mjs:96, :203 · scripts/dmn.mjs:230 · scripts/dugout.mjs:2794-2795 (starts regardless of tank state)

**Evidence**

> dressing-room/state/tanks.json (written 2026-08-01T20:18:10Z = 02:48… 01:48 IST today): T1, T2, T5, T6, T7 all `"state":"COLD"` with `last_429` stamped 2026-08-01T20:18:08-10Z; T3 "DEAD"; only T4 (the Claude Bridge, not a Gemini key) is HOT. fuelboard.mjs:96 `if (t.last_429) return "COLD";  // faulted → cold till local midnight`, and fuelboard.mjs:203 `usable = (t) => ["HOT","WARM"].includes(stateOf(t)) && t.key_index !== null` — so the router has zero usable Gemini tanks. The 429 timestamps match ArsenalFC-DMN's last run exactly (schtasks: 02-08-2026 01:47:47); dmn.mjs:53 imports record429 and dmn.mjs:230 calls it.

**Impact**

> The overnight DMN pass burned the entire regional key pool minutes before the day started, and the fuelboard freezes faulted tanks until local midnight. If he opens the Dugout today, dugout.mjs:2794 only checks that keys exist (9 in ~/.gemini/.env) — it does not check tank state — so the page will start, show a gauge, and fail on the wire. Cross-area cause (DMN/fuel), but the casualty is this area's only live voice surface.

**Proposed fix**

> Two separate things. (a) Cross-area: the DMN must respect headroom before spending five tanks at 01:48 — belongs to whoever audits the fuel lane. (b) This area: dugout.mjs:2794 should refuse or warn honestly when `tankSummary()` shows no usable tank, instead of opening a page that cannot talk. Verify (a) with the fuel auditor before touching anything.

**Verifier's note**

> REAL BUT MISDIAGNOSED — the state is exactly as described, the cause, the blast radius and the named victim are all wrong.
> 
> CONFIRMED (read-only import of loadBoard/pickTank/borrowableTanks; no saveBoard):
>   T1/T2/T5/T6/T7 = COLD, used_today=1, faults_today=1 each; T3 DEAD (disabled by config); T4 HOT (key_index null).
>   borrowableTanks(board,[]) = []   totalBudget = 0 (dream needs >= 8)
>   pickTank() = null for mouth, vision, research, memory, default-mode, prefrontal.
>   fuelboard.mjs:96 `if (t.last_429) return "COLD";` + loadBoard only clears last_429 when s.day !== today, and tanks.json day === "2026-08-02" === today. So it holds until local midnight. That part of the claim is exact.
>   schtasks: ArsenalFC-DMN Last Run 02-08-2026 01:47:47, Repeat Every 1 Hour, Next 02:24. tanks.json mtime Aug 2 01:48. Cause attribution to the DMN pass is correct.
> 
> REFUTED #1 — the Dugout is NOT the casualty. dugout.mjs:2551-2552 opens the Live socket with `CFG.keys[keyIdx]` read straight from ~/.gemini/.env (9 keys present), with nextKey() (dugout.mjs:2434) rotating the pool on failure. tankSummary() is used in exactly three places and all three are display/report-only: dugout.mjs:2743 (a status-line string `⛽ T1 83% ...`), :1100 and :1151 (read-only club-report payloads). Repo-wide, pickTank/borrowableTanks have exactly two consumers: dmn.mjs and fuelboard.mjs's own selftest. Nothing in dugout.mjs gates the voice on tank state — so dugout.mjs:2794 checking only `keys.length` is CORRECT, not a defect. The Dugout will talk normally today. The proposed fix (b) — make dugout refuse when tankSummary() shows no usable tank — would introduce a NEW outage where none exists today, because COLD here does not mean the Gemini key is spent.
> 
> REFUTED #2 — nothing was burned. used_today = 1 per tank against ceilings 90/90/50/1000/250; headroom still 75/75/41/849/211. Each lane made exactly ONE call and stood down (dmn.mjs:246 safeUse → :253 `if (r.limit_hit || r.status === 429) { safeFault; lane.dry = true; break; }`). The claim "the overnight DMN pass burned the entire regional key pool" is false by the file's own numbers.
> 
> REFUTED #3 — these were not Gemini calls at all. dmn.mjs:64 `const defaultGen = (p, _lane) => claudeGenAsync(p, "sonnet");` and the header at dmn.mjs:42-52: "the dreams ride Claude (cognition law) — the lane/borrow machinery stays as the ROLLOUT BUDGET; lane.key is now just a slot label." Zero Gemini quota was consumed.
> 
> THE REAL DEFECT (cross-engine fault attribution): a single `claude -p` failure, classified limit_hit by a very loose regex (claudegen.mjs:19 `const LIMIT_RE = /limit|rate.?limit|quota|overloaded|429/i;`), is written by dmn.mjs:253 through fuelboard record429 as a GEMINI quota 429 onto five tanks whose Gemini quota was never touched. Because all five lanes share ONE upstream engine, the fuelboard's founding premise ("rate limits are per-PROJECT, so 7 accounts = 7 independent pools") does not hold for the DMN: one Claude-side hiccup takes the entire board down simultaneously — five faults inside 2.6s (last_429 20:18:08.022 → 20:18:10.636Z), 21s after the task started.
> 
> AND IT WAS ALMOST CERTAINLY A FALSE POSITIVE, not a real exhaustion. brain_ledger.jsonl shows engine=claude model=sonnet jobs SUCCEEDING 19-25 minutes after the "limit": 2026-08-01T20:37:44Z wall_insights 47,103 tokens ok:true limit_hit:false; 20:39:03Z gemini_render 63,300 tokens ok:true; 20:43:11Z scrimmage_staging ok:true. The window was healthy. The regex demonstrably misfires: the two most recent limit_hit:true rows (2026-07-29T16:24:03Z, 16:39:03Z, job evening_voice) carry `{"is_error":true,...,"stop_reason":"stop_sequence",...}` payloads — a stop_sequence error, not a rate limit. 312 rows in the ledger carry limit_hit:true.
> 
> CORRECTED WHERE: scripts/dmn.mjs:64 (all lanes share one Claude engine), :253 and :297 (limit_hit → record429 on a Gemini tank), :61 genSafe and :235 safeFault (both discard the error text, so a 22-hour outage leaves zero forensics — record429 stores only a timestamp); scripts/claudegen.mjs:19 (LIMIT_RE over-matches); scripts/fuelboard.mjs:96 (a transient upstream throttle becomes a permanent-until-midnight tank death — no distinction between "back off 30s" and "this pool is done for the day"). NOT dugout.mjs:2794.
> 
> CORRECTED IMPACT: the casualty is the DMN itself, not the voice. The task repeats hourly and every remaining run today returns `idle-tank headroom 0 < 8 — the stadium only spends use-it-or-lose-it quota` (dmn.mjs:205) — verbatim the message dmn.mjs:155-158 already flags as misleading for exactly this failure mode. drainBg (dmn.mjs:333-336) also dies with "no borrowable lane". So ~22h of the Rest Room plus the M22 BG drain are gone, and dmn_precache.json stays frozen at date "2026-08-01" / dreamed_at 17:54:03Z. nightshift.mjs is unaffected (it reads headroomOf, never stateOf — T5 headroom 41 > min). council.mjs only recordUse.
> 
> KIND: broken (with a secondary "lying" — the skip line tells the captain the free Gemini pool is spent when it is 99% full and the fault came from Claude). Not starved: T6 alone had 849 units of headroom.
> 
> SEVERITY: yellow, but relocated. The scanner set yellow because it believed his live voice surface was down — that reason is wrong. It still earns yellow on its own merits: it recurs on any `claude -p` error text matching a regex that provably misfires, it silently kills a whole organ for a full day, it self-heals only at local midnight, and it reports a false reason while doing so. Solo-user, laptop-that-sleeps context does not soften it — a sleeping laptop is precisely when the DMN is supposed to be the one thing running.

---

## 27. The touchline's struggle read has been dark 13 of 14 days — it needs 6 reps a day and 9 reps exist in total

- **kind:** `starved` · **severity:** `yellow` · **area:** `voice-presence` · **day-one fixable:** no
- **where:** scripts/touchline.mjs:182-184 · dressing-room/state/pitch_read_history.jsonl · dressing-room/state/reps_log.jsonl (9 rows)

**Evidence**

> touchline.mjs:182-184 `const last = repsToday.slice(-cfg.struggle.last_n); if (last.length < cfg.struggle.last_n) return { verdict: "no_data" }` with last_n = 6 (touchline.mjs:48). pitch_read_history.jsonl: 14 day-lines, `"struggle":"no_data"` on 13 of them; the single exception is 2026-07-31 "spinning". Live pitch_read.json: `"struggle":{"verdict":"no_data","basis":"0 reps today (< 6)"}`. reps_log.jsonl = 9 rows in total, ever.

**Impact**

> Starved, not broken — the organ is correct to refuse. But the consequence propagates: shadow.mjs:192 reads `pr.struggle.verdict` and can only raise a wall_breaker shadow when it says "spinning" (that is exactly why only 3 of the 5 shadows ever recorded are wall_breakers, all from 31 Jul), and viz.mjs:114 renders "no_data" on the wall every day. The touchline's other three senses (tunnel wall-minutes, tank bench, weak-foot streaks) ARE live and consumed — setpiece.mjs:258 uses weak_foot.streaks, viz.mjs:590 sums wall_minutes into the weekly trend (225 min this week), scorer.mjs:237 uses first_focus. So the organ is 3/4 alive; only the rep-fed quarter is dark.

**Proposed fix**

> Nothing to fix in code — the threshold is honest. Worth saying out loud in the report so it is not mistaken for a bug: struggle stays dark until he logs ≥6 reps in one day. Do not lower last_n to manufacture a verdict off two reps.

**Verifier's note**

> REPRODUCED. touchline.mjs:185-186 gates on `last.length < cfg.struggle.last_n` and touchline_config.json really sets struggle.last_n=6 (not merely the DEFAULTS value). pitch_read_history.jsonl = 14 lines, struggle="no_data" on 13, "spinning" only on 2026-07-31. Live pitch_read.json: {"verdict":"no_data","basis":"0 reps today (< 6)"}. reps_log.jsonl = 9 rows ever. The single exception is explained and consistent: repDayKey() keys to the captain's local midnight, so the four 2026-07-30T20:28-21:58Z rows fall on IST 31 Jul with the three 2026-07-31T14:36-17:48Z rows = 7 reps >= 6. `node scripts\touchline.mjs selftest` returns ALL CHECKS PASSED (23 checks, incl. "struggle: thin data = no_data (never guesses)"). So: STARVED, not broken. The refusal is correct and last_n must not be lowered.
> 
> THREE CORRECTIONS to the offered evidence:
> (1) shadow_log.jsonl contains 2 wall_breakers of 5 rows, not 3 (both 2026-07-31, 18:28Z and 18:38Z — straddling IST midnight, so shadow.mjs:208 per-day dedupe behaved correctly).
> (2) "scorer.mjs:237 uses first_focus" is false as support for the organ being 3/4 alive: `first_focus` appears ZERO times in touchline.mjs, and scorer.mjs:207 states "No such instrument exists yet". touchline never emitted it. The live/consumed senses are tunnel (viz.mjs:590 -> 225 wall-min over history.slice(-7), which I summed and confirmed), tank, and weak_foot (setpiece.mjs:258).
> (3) The propagation is UNDERSTATED, and this is the reportable part. viz.mjs:73-74 derives the season-level weekly_consistency_pct ENTIRELY from the struggle verdict: `days.filter(d => d.struggle && d.struggle !== "no_data").length / days.length` over the same 7 history lines. Today that is 1/7, so viz.mjs:182, :308 and :405 print "Weekly consistency: 14%" on the wall, the markdown and the voice line. That metric is labelled consistency but actually measures "days he logged >=6 reps" — a shaming number manufactured from a starved sensor. The fix, if any, belongs in viz.mjs (relabel or dark it when the underlying days are all no_data), not in touchline.
> 
> SECOND-ORDER: shadow.mjs:224 sets spinning_persisted only when >=2 of the last 4 history lines are "spinning". With exactly one spinning day in existence, the two logged wall_breaker shadows can never score a hit, so that type's voice gate is structurally unreachable until reps arrive. (All 5 shadow_log rows also still carry "resolved":false.)
> 
> SEVERITY DOWNGRADED yellow -> note: the claim's own proposed fix is "nothing to fix in code", the organ passes its full selftest, and viz renders no_data gracefully as the grey "quiet pitch" label (viz.mjs:248). A correctly-refusing sensor with no code action is a note for a solo user with 9 reps logged; the only actionable residue is the viz.mjs consistency metric, which should be filed separately.

---

## 28. presence_log.jsonl is unbounded and fully re-parsed 144 times a day

- **kind:** `broken` · **severity:** `note` · **area:** `voice-presence` · **day-one fixable:** yes
- **where:** scripts/presence.mjs:280, :290, :303 · dressing-room/state/presence_log.jsonl

**Evidence**

> presence.mjs:280 `let _log = null; const log = () => (_log || (_log = readLines(PLOG)));` — memoised per pass, but each pass still JSON.parses the entire file to find the previous edge row (:290) and previous focus row (:303). File is 266,441 bytes / 1,505 rows after 16 days; ArsenalFC-Presence repeats every 10 minutes (schtasks: Repeat: Every 0 Hour(s), 10 Minute(s)). No rotation or truncation anywhere in the file. Consumers only ever read the tail: brain.mjs:367 `.slice(-6)`, distiller.mjs:136 `.slice(-12)`, dugout.mjs:1083 today's rows only. calibrate (presence.mjs:47) is the only whole-file reader and runs weekly.

**Impact**

> ~6MB/year, and the per-pass parse cost grows linearly forever. Trivial today, self-inflicted later. Worth noting that ~99% of the 266KB is read by exactly one weekly function.

**Proposed fix**

> Read only the tail for prevEdge/prevFocus (last ~4KB is more than enough for two rows), and add a monthly roll to presence_log.<YYYY-MM>.jsonl that calibrate still globs. Neither changes any verdict.

**Verifier's note**

> REAL but the stated cause and two of its numbers are wrong; severity `note` is correct and should NOT be raised.
> 
> CONFIRMED BY MY OWN COMMANDS:
> - presence.mjs:71 `readLines` splits the whole file and JSON.parses every line; :280 `let _log = null; const log = () => (_log || (_log = readLines(PLOG)));` is real.
> - No rotation exists: grep for rotat|truncat|prune|archive|unlink in presence.mjs returns only an unrelated comment at :204. Repo-wide only 4 files reference presence_log.
> - Live file: 266,799 bytes / 1,507 rows (765 sense passes), 2026-07-17 -> 2026-08-02.
> - schtasks: ArsenalFC-Presence `Repeat: Every: 0 Hour(s), 10 Minute(s)`, `Until: Duration: Disabled`, Ready. ArsenalFC-PresenceFit -> `presence.mjs calibrate`, `Schedule Type: Weekly`, `Days: SUN`.
> - Growth measured per-day: recent 4-day mean 18.8 KB/day -> 6.71 MB/yr. The claim's ~6MB/yr is correct.
> - .gitignore:181 covers the file (git check-ignore -v), so no repo bloat.
> 
> REFUTED / CORRECTED:
> 1. "144 times a day" is the schedule ceiling, never observed. Measured passes/day: 07-29=39, 07-31=46, 08-01=60. Three days (07-24, 07-27, 07-28) have ZERO rows - laptop off. The one outlier, 07-18=198 passes, has zero duplicate timestamps and a gap histogram of {"5":154,"10":32} - that day ran on an older 5-minute cadence, not overlapping instances. Real rate is ~50/day, about a third of the claim.
> 2. "each pass JSON.parses the entire file to find the previous edge row (:290) and previous focus row (:303)" misreads the code it quoted. The :280 memoisation is doing exactly its stated job - ONE parse per pass serves both lookups. The scanner quoted the fix and described the bug it prevents.
> 3. "calibrate (presence.mjs:47) is the only whole-file reader" is wrong, and this is the salvageable part. Four other call sites parse the entire file then discard ~99%: brain.mjs:367 `readLines(...).slice(-6)`; distiller.mjs:136 `readLines(...).slice(-12)`; dugout.mjs:1083 `readLines(...).filter(r => r.day === day)`; brain.mjs:803 `if (name.endsWith(".jsonl")) inputs[name] = readLines(p).slice(-200)` for three LLM jobs that list presence_log.jsonl as an input (brain_config.json:61 midday_digest, :107 midday_cartridge, :386 evening_voice). LLM tokens ARE bounded by slice(-200) - no token bleed - but three more whole-file parses happen daily.
> 4. Cost measured, not estimated: warm full read+parse of the live file = 5.3-6.7 ms, against a Node cold start plus two AW fetches each carrying a 4s abort. Under the noise floor. At a year's size (~7MB) it projects to ~150 ms/pass - still inconsequential for a solo user on a sleeping laptop.
> 
> VERDICT ON KIND: nothing malfunctions; the organ does exactly what its comments say. `broken` is the least-wrong bucket in the enum for "unbounded log, zero rotation," but the honest label is hygiene debt, not a defect. Severity `note` is right as filed; the scanner's own framing ("trivial today, self-inflicted later") is accurate and not inflated.
> 
> FIX CORRECTION: the proposed tail-read of prevEdge/prevFocus saves one parse per pass and is the SMALLEST of the five readers. The monthly roll to presence_log.<YYYY-MM>.jsonl is the part that matters, and it must also update brain.mjs:367, distiller.mjs:136, dugout.mjs:1083 and brain.mjs:803 (which globs nothing today), not just calibrate.
> 
> ADJACENT, OUT OF SCOPE, NOT PART OF THIS VERDICT: calibrate (presence.mjs:47-58) runs pctl over ALL history with no time window, so as the file grows his "own normal" baseline is increasingly set by months-old behavior and stops adapting. Separate finding.

---

## 29. nightshift's pre-answer material loses its voice corpus on 6 Aug — the voice lane has been silent since 30 July

- **kind:** `starved` · **severity:** `note` · **area:** `voice-presence` · **day-one fixable:** yes
- **where:** scripts/nightshift.mjs:483-484 · dressing-room/state/afferent.jsonl (271 voice rows, newest 2026-07-30) · scripts/dugout.mjs:769, :1023, :2921

**Evidence**

> nightshift.mjs:483-484: `const aff = (...afferent.jsonl).filter(a => new Date(a.ts||0).getTime() >= weekAgo); const voiced = aff.filter(a => a.modality === "voice" && a.text)...slice(-30)`. All 271 voice afferents land on exactly four days — {"2026-07-17":80,"2026-07-18":133,"2026-07-19":45,"2026-07-30":13} — matching the four days the dugout bridge ran (brain_out/dugout/ holds 2026-07-17, -18, -19, -30 .md files, and dugout_session.json's handle is stamped 2026-07-30T10:00:21Z). The newest is 2026-07-30T10:00:10Z, 3 days old.

**Impact**

> The voice lane is wired end to end and is not dropping anything: mic → dugout page → POST /afferent-relay (dugout.mjs:2921) → relayAfferent → thalamus → afferent.jsonl → salience_ledger (271 voice moments, 264 reflex, 5 adjudicated_down, 2 wakes on 18 Jul). The gap between 271 voice afferents and 2 dugout notes is NOT a dropped wire — it is two different lanes: every ASR turn relays automatically, while a dugout note only exists when the Gaffer chooses to call take_note (dugout.mjs:1023), and dugout.mjs:769 tells it to merely OFFER ("throw that in?") rather than capture. Both notes are real take_note writes. The real issue is upstream of both: he has not opened the voice surface in 3 days, so from 6 Aug nightshift's `voiced` corpus goes empty and the pre-answer engine loses his own words.

**Proposed fix**

> No code fix — this is a usage fact, and the throw-in's iron guard #2 (throwin.mjs:14-17) forbids coaching him about capture frequency. But the 7-day window silently degrading to zero should at least be visible: nightshift should say "0 voiced turns in window" in its output rather than quietly building a thinner corpus.

**Verifier's note**

> CONFIRMED as a usage fact, with two corrections. Every number reproduced exactly: afferent.jsonl voice=271 on exactly four days {2026-07-17:80, -18:133, -19:45, -30:13}, newest 2026-07-30T10:00:10.966Z; brain_out/dugout/ (under dressing-room/state/, not repo root) holds exactly those four .md files; dugout_session.json ts=2026-07-30T10:00:21.069Z; salience_ledger 271 voice moments (field is modalities[], not modality) = 264 reflex / 5 adjudicated_down / 2 wake, both wakes 18 Jul at S=0.45 and S=0.65 (the highest-S-ever moment is a voice moment); dugout_notes.jsonl = 2, both genuine take_note writes; dugout.mjs:769 does say merely "offer take_note"; :1023 appends to NOTES; :2921 -> relayAfferent -> POST 127.0.0.1:4113/afferent (:115,:123). The wire is intact end to end. Not broken, not unwired — starved, and "note" is the right severity. The scanner's diagnosis (271 afferents vs 2 notes is two lanes, not a dropped wire) is correct.
> 
> CORRECTION 1 — the date is off by one. TZ is India Standard Time (+5:30) and ArsenalFC-NightShift runs daily 02:40 local (schtasks: Schedule Type Daily, Start Time 02:40:00, last result 0). The 6 Aug run computes weekAgo = 2026-07-29T21:10Z, which STILL includes the 30 Jul 10:00Z rows. The corpus empties on the 7 AUG run (weekAgo = 2026-07-30T21:10Z), not 6 Aug.
> 
> CORRECTION 2 — the impact is narrower than "the pre-answer engine loses his own words." Only 1 of 6 material fields zeroes. nightshift.mjs:505 skips only if ALL sources are empty; clusters (doubt_grammar, 112 doubts — also his words), due, danger and threads survive, and hotTokens (:486) counts concept_tokens across EVERY modality, so the still-live context/code/pulse lanes keep it fed (newest afferent of any modality = 2026-08-01T20:43:04Z). The engine is provably working: answer_cache.jsonl holds 23 rows dated 2026-08-01 in his Hinglish idiom. Nor are his voiced words lost from the organism: seasonCorpus (nightshift.mjs:574-575) reads afferent.jsonl with NO time window, and :577-581 harvests "CAPTAIN: " lines from the last 21 dugout transcripts — all 271 turns and all four transcripts remain in the season re-read forever. Only the pre-answer engine's 7-day recency slice goes dark.
> 
> The one genuine gap the claim identifies survives: nightshift.mjs:724 records only {predicted, answered, embedded, spent} for the pre_answers job, so the corpus composition is never reported and this input degrades to zero with no signal anywhere. Keep as a note; the proposed fix (report "0 voiced turns in window") is a visibility line, not a new feature, and it correctly does NOT coach him about capture frequency.

---

## 30. The thalamus's self-marker list catches 7 of 271 voice turns; the throw-in poller is genuinely healthy

- **kind:** `waiting` · **severity:** `note` · **area:** `voice-presence` · **day-one fixable:** no
- **where:** dressing-room/state/thalamus_config.json (self_markers) · dressing-room/state/throwin_state.json · scripts/throwin.mjs:391-401 · scripts/physio.mjs:333-342

**Evidence**

> Self-markers: running thalamus_config.json's 29 self_markers against all 271 voice texts gives 7 matches. 18 further turns contain doubt-shaped language the list misses, though most are requests not confusions (e.g. "chat history matlab kiski chat history" — the list has "matlab kya" but not bare "matlab"). Throw-in: throwin_state.json = {"last_since":1785600016 (=2026-08-01T16:00:16Z),"last_poll_at":"2026-08-01T20:24:03.073Z" (=01:54 IST today),"wired":true,"rep_ids":[]} with NO last_error key — and throwin.mjs:391-401 writes last_error on every non-200 or fetch failure, so a clean state IS proof of a 200. schtasks: ArsenalFC-Throwin, Last Run 02-08-2026 01:54:01, Last Result 0, repeats every 15 min. Topic resolves (throwin_topic.txt, 46 bytes, gitignored — not printed). `node scripts/throwin.mjs selftest` green.

**Impact**

> Two throw-ins in 15 days is genuine non-use, not a dead poller — the line is up and answering every 15 minutes. physio.mjs:333-342 already watches for delivery failure with throwin_gap_days = 4 (physio_config.json); last ball is 2.6 days old, so that alarm will legitimately fire on 3 Aug if nothing arrives, and that is the correct behaviour, not a bug. The self-marker coverage is the more interesting number: it is the only path by which a spoken doubt can earn self=1 and reach tier 2.

**Proposed fix**

> Throw-in: nothing. Self-markers: worth widening from his actual transcript rather than from imagination — the 271 turns in afferent.jsonl are the corpus, and doubtminer/lexicon already mine them. But do it with his approval; self_markers is curriculum-shaping and thalamus_config.json is explicitly approval-gated ("_doc": "...edits ride the same human-approval law as the genome").

**Verifier's note**

> CONFIRMED on both halves, but the emphasis and the proposed fix are wrong.
> 
> WHAT I REPRODUCED MYSELF
> 
> 1. Self-markers = 7/271, exact. I re-ran the match with the same semantics the code uses (`scripts/thalamus.mjs:218` — `String(evt.text||"").toLowerCase()` + `cfg.self_markers.some(m => text.includes(m))`, gated on `modality === "voice"`). afferent.jsonl modality counts now: voice 271, code 768, context 1735, bus 137, pulse 124, vision 70, desktop-study 6 (3111 rows — file has grown 33 since the scanner's snapshot; voice is unchanged at 271). Exactly 7 hits:
>   2026-07-17T08:22 "i don't get" · 07-17T09:30 "नहीं समझ" · 07-17T19:04 "समझ नहीं|मतलब क्या" · 07-18T12:35 "समझ नहीं" · 07-18T19:19 "kaise kaam" · 07-18T19:23 "समझा नहीं" · 07-18T19:27 "नहीं समझ".
>   Also confirmed thalamus.mjs:218 is the ONLY assignment of `comps.self` anywhere in the file, so the claim that this list is the sole path to self=1 holds.
> 
> 2. Throw-in is genuinely healthy — the inference chain is sound, not just the state file. `readPriorState` (throwin.mjs:98-110) deliberately reconstructs only `last_since` and `rep_ids`, and `buildState` (throwin.mjs:115-127) sets `last_error` ONLY via `if (last_error) st.last_error = last_error;` (line 125), with the comment at 113-114 saying so. So last_error cannot survive a healthy write and cannot be inherited — its absence IS proof the last poll was a 200. Live state when I read it: `{"last_since":1785600016,"last_poll_at":"2026-08-01T20:39:03.463Z","wired":true,"rep_ids":[]}`, no last_error. schtasks: ArsenalFC-Throwin, Last Run 02-08-2026 02:09:01, Last Result 0, Next Run 02:24:00, Repeat every 15 min, Enabled/Ready — i.e. it polled 15 min before I looked, later than the scanner's own reading, so the line is live right now. `node scripts/throwin.mjs selftest` → ALL CHECKS PASSED (safe to run; every write goes to os.tmpdir(), lines 335/358).
> 
> 3. physio's gap alarm is real and correctly configured. physio.mjs:333-340 gates on `throwinState.wired && looseBalls.length > 0`, threshold `throwin_gap_days: 4` (physio_config.json:12). loose_balls.jsonl = 2 rows, newest 2026-07-30T10:23:53Z. Gap at my read = 2.43 days (not 2.6). ArsenalFC-Physio-AM / -PM both Ready, so it will genuinely fire ~2026-08-03T10:23Z. Correct behaviour, not a bug.
> 
> CORRECTION 1 — the "18 further doubt-shaped turns" does not reproduce, and the number that matters is 1. A loose probe (matlab/samajh/kaise/why/?/etc.) gives 104 unmatched voice turns, which is meaningless because they are questions and requests. A tight probe (a negation within 3 tokens of a comprehension verb, Roman + Devanagari) gives 4 unmatched: three are "you are not understanding me" — the captain complaining the agent missed, not naming his own doubt, which is exactly what self=1 should NOT fire on. Only ONE is a true miss: `2026-07-17T18:58 "क्या ऑफर मुझे समझ ही नहीं आया"` — and the mechanism is precise and worth naming: the list has "समझ नहीं", "नहीं समझ", "समझा नहीं", but `includes()` is a contiguous substring test, so the emphatic particle "ही" wedged between समझ and नहीं breaks all three. That is a Hindi-particle-infix hole, not a vocabulary hole. Widening the word list would not fix it; particle-tolerant matching would.
> 
> CORRECTION 2 — the marker list is not the binding constraint; the voice channel is dead. Voice rows by date: 2026-07-17 = 80, 07-18 = 133, 07-19 = 45, 07-30 = 13, and nothing since. All 7 self=1 hits fall on 17-18 July. So `self` — weight 0.45, tied with `err` for the heaviest component in thalamus_config.json, and by design the one channel that lets a spoken doubt clear tau1_base 0.40 on its own — has fired ZERO times in 14 of the last 15 days, because no voice arrives at all, not because the list is narrow. The organ is STARVED at the source, not merely WAITING at the filter. Recovering ~1 extra hit in 271 turns (0.4%) by widening curriculum-shaping, approval-gated config is not worth the approval cost while the input is at zero.
> 
> SEVERITY: note is right, not inflated. Nothing here is broken. The throw-in half is flatly not-a-finding (correctly diagnosed as such by the scanner). The self-marker half is a real measurement whose honest reading is "the self lane is starved because he stopped talking to it", and the useful question for the captain is why voice stopped on 19 July — not which words to add.

---

## 31. The teaching contract's turn clock is anchored to the FORGE session, not the Claude Code session — it never resets between sessions, and the CONTEXT WARNING will fire on every turn forever, 8 prompts from now

- **kind:** `broken` · **severity:** `red` · **area:** `forge-exam` · **day-one fixable:** yes
- **where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\teaching_contract.mjs:125-129,:141-143,:174-179,:287 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\teaching_contract.json

**Evidence**

> teaching_contract.mjs:174-179 `forgeStartedAt()` returns forge_session.json's started_at whenever `!f.closed_at`, else null. :125-129 `bumpTurn` treats `fresh = t.session_started_at !== (sessionStartedAt || null)` as the ONLY reset. Live state: {"session_started_at":"2026-07-31T22:55:05.107Z","count":32}, context_warn_at 40 — the anchor is the stale session from finding #1, so today's entire audit day has been counted onto yesterday's forge session. `node scripts/teaching_contract.mjs list` -> "turn 32/40". Worse with NO forge session: forgeStartedAt() returns null and after the first bump session_started_at is already null, so `null !== null` is false forever — the counter increases monotonically across every future session with no reset path. `reset-turns` exists (:287) and grep across scripts/, hooks/ and .claude/ finds ZERO callers; only `print` is wired (.claude/settings.json:9).

**Impact**

> The organ's second stated purpose is his own explicit request — "explicitly tell me beforehand everytime when you are about to loose the context". At turn 40 blockLines (:141-143) emits the CONTEXT WARNING and, because nothing resets, emits it on every subsequent turn of every subsequent session regardless of real context use. A warning that always fires is a warning he will learn to ignore — and it is 8 prompts away.

**Proposed fix**

> Anchor the clock to the Claude Code session: add `node scripts/teaching_contract.mjs reset-turns` to the SessionStart hook block in .claude/settings.json (the CLI verb already exists), and make bumpTurn treat a null anchor as "unknown session, reset" rather than accumulate. Keep forgeStartedAt only as a secondary reset trigger.

**Verifier's note**

> CONFIRMED in substance, with two corrections (one to the mechanism claim, one to the proposed fix).
> 
> WHAT I REPRODUCED MYSELF
> 
> 1. The anchor is the stale forge session. `dressing-room/state/forge_session.json` = `{"concept":"hallucinations","started_at":"2026-07-31T22:55:05.107Z", ...}` with NO `closed_at` (mtime 2026-08-01 04:42 IST). `teaching_contract.json` = `{"session_started_at":"2026-07-31T22:55:05.107Z","count":32}` (mtime 2026-08-02 01:54 IST). Same anchor string, 21.5 hours apart. `node scripts/teaching_contract.mjs list` -> `turn 32/40`. So the clock is live, still bumping, and still pinned to a forge session started two nights ago.
> 
> 2. It really does cross Claude Code session boundaries. Counting the SAME hook block's other member (`hooks/afferent-post.mjs`, `source:"claude-code"` = UserPromptSubmit) in `afferent.jsonl` since that anchor: 30 prompts, first 2026-07-31T23:02Z, last 2026-08-01T20:24Z — which matches the state-file mtime to the minute and roughly matches count=32. Gaps between consecutive prompts inside that window: 957 min, 45, 50, 79. A 16-hour gap on a laptop that sleeps is not one session. The clock did not reset across any of them. (The ARSENAL_ORGAN=1 guard at :249 is intact, so those 32 are his own prompts, not headless organs.)
> 
> 3. The null-anchor branch is real. I copied `teaching_contract.mjs` into an isolated scratch tree (its own ROOT/dressing-room/state — live state untouched) and ran `print` repeatedly. With NO forge_session.json: turn 1, 2, 3, 4 — monotonic, no reset. Then with an open forge session present: resets to 1, then 2. Then with `closed_at` added: 1, 2, 3 — accumulating again. So `null !== null` is indeed false forever *within* a no-forge-session stretch.
> 
> 4. `reset-turns` (:287) has zero callers. `.claude/settings.json` wires only `teaching_contract.mjs print` (UserPromptSubmit). SessionStart wires only `learnstate.mjs brief` and `forge_session.mjs boot`. Repo-wide grep for `teaching_contract` hits only settings.json, the script itself, `forge_session.mjs` (which at :44-59 declares the file STRICTLY READ-ONLY and never invokes the CLI), and the bundle .md. Confirmed dead verb.
> 
> CORRECTION 1 — the scanner overstates "no reset path, forever". There IS a reset path and it fires in normal use: any transition of `forgeStartedAt()`'s value resets the count to 1, so `forge_session.mjs start <concept>` (:111 stamps a fresh `started_at`) zeroes the clock. Sandbox step B proves it; selftest asserts it ("a NEW forge session resets the clock"). What is genuinely absent is a reset tied to the boundary that actually governs context — the Claude Code session. So the accurate statement is: during a real forge study session the organ is roughly right (forge session ~= CC session); OUTSIDE one — audit days, build days, ops days like today — the clock accumulates across days and sessions, and once it crosses 40 it stays >=40 and fires the CONTEXT WARNING on turn 1 of every fresh, empty-context session until his next `forge start`. That is still a guaranteed false alarm and it is 8 prompts away, mid-audit, on a non-forge day.
> 
> CORRECTION 2 — half the proposed fix is actively wrong. "Make bumpTurn treat a null anchor as 'unknown session, reset'" would reset the clock on EVERY turn whenever no forge session is open (null vs null, every time), pinning it at 1 and guaranteeing the warning never fires on exactly the non-forge days where it is most needed. Drop that half. The correct minimal fix is the first half alone: add `node scripts/teaching_contract.mjs reset-turns` to the SessionStart hooks array in `.claude/settings.json`. Verified this composes correctly — reset-turns writes `{count:0, session_started_at: forgeStartedAt()}`, and the next `print` bump sees an unchanged anchor and lands on 1, not 2. Worth noting SessionStart also fires on resume/compact, which resets right after a compaction — arguably the desired behavior, since context was just freed.
> 
> KIND — not "broken": the code does exactly what its own header specifies at :36 ("a turn counter is kept per forge session"), and the selftest that asserts that spec passes 18/18. The defect is that the spec contradicts the stated purpose at :35-38 (warn before CONTEXT loss — a property of the CC session, not the forge session). The organ runs, reaches him, and asserts something untrue: "turn 32/40" is not this session's turn count, and the :141-143 line will tell him "context is close to compacting" when it is not. That is lying, not broken.
> 
> SEVERITY — yellow, not red. Blast radius is one line of text. I checked the anti-wall budget: header + 2 rules + link-back + warning = exactly 5, so `slice(0, MAX_BLOCK_LINES)` at :144 drops nothing — the teaching rules keep injecting normally, no collateral. No state corrupts, nothing is lost, and it self-heals the moment he runs `forge start`. The real cost is that a signal he asked for by name ("explicitly tell me beforehand everytime when you are about to loose the context") becomes a permanent-on light he learns to ignore — genuine, but not red for a solo user on a sleeping laptop.
> 
> FILES: C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\teaching_contract.mjs (:36, :125-129, :141-144, :174-179, :249, :287) · C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\teaching_contract.json · C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\forge_session.json · C:\Users\nikhi\GitHub\arsenal-ai-fc\.claude\settings.json

---

## 32. capsule_bridge's headline feature — naming where the two schedulers disagree — is structurally incapable of being true; it reads FSRS's due list from a shape fsrs has never written

- **kind:** `broken` · **severity:** `red` · **area:** `forge-exam` · **day-one fixable:** yes
- **where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\capsule_bridge.mjs:204-208 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\cards.json

**Evidence**

> capsule_bridge.mjs:204-208 `fsrsDueConcepts()` does pick(cards.due_today) and pick(cards.overdue) where `pick = (arr) => (Array.isArray(arr) ? arr : [])`. Live cards.json: due_today is a NUMBER (1) and overdue is a NUMBER (3) — verified with typeof. The concept NAMES live in cards.hardest_due (array of 4 strings) which this function never opens. Live `node scripts/capsule_bridge.mjs show` today: {"capsule_says_due_fsrs_quiet":["embeddings","inference","context","tokenization"],"fsrs_says_due_capsule_quiet":[]} — the first arm is just the full overdue list and the second can never be non-empty. The selftest passes because it injects fsrsDue as an array fixture (:260) and never exercises the disk reader.

**Impact**

> The stated reason this organ exists is "so the two worlds stop being air-gapped and silent" (header :22-24). It reports total disagreement every day and can never report agreement, which is the same as reporting nothing. manager.mjs:217-221 lifts capsule_map into the team sheet, so the sheet carries a fabricated conflict signal.

**Proposed fix**

> Read cards.hardest_due (plus any future array-of-names field) instead of the integer counters, keeping the array-tolerant pick so a future fsrs that writes arrays still works. Add one selftest that feeds the LIVE cards.json shape ({due_today:1, overdue:3, hardest_due:[...]}) and asserts the bank is non-empty — the current fixture is why this shipped.

**Verifier's note**

> CODE DEFECT CONFIRMED, IMPACT REFUTED, SEVERITY DOWNGRADED red->yellow.
> 
> Reproduced myself:
> 1. C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\cards.json -- typeof due_today = "number" (1), typeof overdue = "number" (3), hardest_due = array ["inference","context","embeddings","hallucinations"].
> 2. The writer confirms this is the only shape ever emitted: scripts\fsrs.mjs:190 `let overdue = 0, due_today = 0;` ... :198 `const hardest_due = dueCards.slice(0, cfg.hardestDueMax).map((c) => c.concept);` ... :210 `due_today: b.due_today, overdue: b.overdue, hardest_due: b.hardest_due`. Integers and a name-array, exactly as claimed.
> 3. Replaying capsule_bridge.mjs:206's `pick` against live cards.json returns []. fsrsDueConcepts() is therefore [] on every run.
> 4. Live `node scripts/capsule_bridge.mjs show`: scheduler_disagreement = {capsule_says_due_fsrs_quiet:["embeddings","inference","context","tokenization"], fsrs_says_due_capsule_quiet:[]}. Identical in on-disk capsule_map.json:815-823 (yesterday's scheduled run). So the organ IS running; this is not starvation -- there are 4 capsules AND 4 FSRS names, data on both sides.
> 5. Selftest at :260 passes fsrsDue as the literal array fixture ["embeddings"]; loadCapsules/fsrsDueConcepts (the disk readers) are never called by selftest(). The scanner's read of why this shipped is correct.
> 
> SHARPER THAN THE CLAIM: it is not merely "empty on one side". With a correct read of hardest_due, today's honest output is capsule_says_due_fsrs_quiet=["tokenization"] and fsrs_says_due_capsule_quiet=["hallucinations"]. It instead names inference, context and embeddings as "FSRS quiet" when FSRS lists all three in hardest_due -- three positively wrong statements, not just one missing arm -- and loses "hallucinations", the one concept FSRS wants and the capsules do not.
> 
> IMPACT CLAIM IS WRONG. manager.mjs:217-222 lifts only four fields: locked, strike_questions, rejirah_overdue (computed from capsules alone -- correct, unaffected by this bug), cracked_axes. It does NOT lift scheduler_disagreement. A repo-wide scan including gitignored files (Get-ChildItem -Recurse over *.mjs,*.js,*.json,*.md,*.ps1,*.bat) found scheduler_disagreement in exactly 4 places: capsule_bridge.mjs:182 (writer), :260 (its own selftest), capsule_map.json:815 (the output), and two prose docs. Zero runtime consumers. The team sheet does not carry a fabricated conflict signal.
> 
> Hence yellow, not red: a genuinely wrong computation sitting in a field nothing reads. Nothing downstream is currently misled and no decision is corrupted today. It is simultaneously broken AND unwired; "broken" is the accurate kind for the function, "unwired" is why the blast radius is zero.
> 
> PROPOSED FIX IS CORRECT BUT INCOMPLETE. Reading cards.hardest_due (keeping the array-tolerant pick) is the right one-line change, and the selftest gap is real -- add a case feeding the LIVE shape {due_today:1, overdue:3, hardest_due:[...]}. But note fsrs.mjs:67 caps hardestDueMax at 8, so hardest_due is a TRUNCATED due list, not the complete one -- with >8 due cards the "capsule_says_due_fsrs_quiet" arm would still over-report. Worth a comment, or read fsrs_store.json's card list for the full set. And fixing the read alone still reaches nobody: if this signal is meant to matter, it needs a consumer (manager.mjs's capsules block is the obvious one) or it should be deleted rather than repaired.

---

## 33. Every drill the organism has ever set has gone undone: 10 of 10 matured gaffer bets are misses, trust tier drill:recall = 0.0 over n=7

- **kind:** `starved` · **severity:** `red` · **area:** `forge-exam` · **day-one fixable:** no
- **where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\slip.jsonl · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\trust_tiers.json · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\learnstate.mjs:98-101 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\dugout.mjs:932

**Evidence**

> state/slip.jsonl: 23 gaffer rows, 10 resolved, ALL hit:false, each with evidence ending "| matured d+N: no reps on it" — 07-18 embeddings, 07-20/21/21/22/22/23/23 inference, 07-25 embeddings, 07-25 inference. state/trust_tiers.json: {"type":"drill:recall","n":7,"hit_rate":0,"no_look":false}. setpiece has compiled a packet nightly since 18 Jul (drills.json today: 3 drills for 2026-08-02, status ok, ladder GREEN). The only interactive reader of drills.json is dugout.mjs:932 — and no ArsenalFC-* task runs dugout.mjs; it must be booted by hand and opened at localhost:4114. learnstate.mjs's SessionStart brief never opens drills.json (gather() at :98-101 reads sprint.json, working_set.json, weaknesses.json only).

**Impact**

> The motor cortex is intact and firing into a disconnected limb. Its own header says "Without an actuator, every sensor is a diary" — measured over 15 days the actuator produced zero reps. It also poisons the scorer's book: the gaffer's hit-rate is 0 not because the coaching is bad but because it is never delivered, and that 0 now sits in trust_tiers as if it were evidence about coaching quality.

**Proposed fix**

> Pick ONE surface he actually touches and put today's drills on it. Cheapest is learnstate.mjs's brief: read drills.json and, if `for === today`, print the <=3 prompts under a TODAY'S DRILLS heading. That is a ~6-line change to gather()/brief() but it needs his sign-off on what the kickoff block is allowed to contain.

**Verifier's note**

> OUTCOME CONFIRMED, CAUSE REFUTED AND REPLACED.
> 
> Reproduced myself: slip.jsonl has 23 gaffer rows, 10 resolved, all hit:false, each evidence ending "| matured d+N: no reps on it". trust_tiers.json carries {"type":"drill:recall","n":7,"hit_rate":0}. The n=7-vs-10 gap is CORRECT, not a bug: computeTiers (scorer.mjs:273-277) is last-wins per book|type|date|claim and 07-21/22/23 each duplicate the 'inference' bet. reps_log.jsonl = 9 rows: embeddings x2 on 2026-07-17 (BEFORE the first bet) and hallucinations x7 on 30-31 Jul. Zero reps ever on 'inference' or 'tokenization'. The misses are real.
> 
> REFUTED: "the only interactive reader of drills.json is dugout.mjs:932". Actual readers — viz.mjs:594 (the wall; ArsenalFC-Wall-AM/Wall-Live/Wall-PM all run `node scripts\viz.mjs`, Last Result 0, and ArsenalFC-Wallpaper sets it as his desktop), talk.mjs:43 (live bus every turn), distiller.mjs:137 (writes next_step into working_set.json — live value right now is "tokenization", drill #1's concept verbatim), postmatch.mjs:231, shadow.mjs:188, plus skills /matchday (SKILL.md:13,17), /forge, /rematch. The packet is wired to many surfaces. (Confirmed separately that no ArsenalFC-* task runs dugout.mjs or learnstate.mjs.)
> 
> THE REAL DEFECT IS THINNER AND SHARPER — the payload is stripped, not the wire. viz.mjs:106 maps each drill to {kind, emoji} ONLY. Live dressing-room/club/wall.html (regenerated 02:08 today) renders literally: `Tomorrow's set pieces</h2>🟣 tape_room 🟣 rejirah 🔵 recall` — no concept, no prompt. Nobody can act on "🔵 recall". team_sheet.md, the actual morning surface, carries no drill line at all. working_set.next_step carries the concept but learnstate.mjs brief() prints where_left_off/open_loop/watch/next_up and never next_step (:166-171). Every surface that carries the real prompt is hand-invoked.
> 
> SECOND CAUSE THE SCANNER MISSED ENTIRELY — the packet aims at a concept he has never touched. cards.json hardest_due[0] = "inference"; learning_state.rejirah_due calls inference 30 days overdue — on a concept with zero reps ever (capsule-seeded; overdue because never done, not decaying). Meanwhile sprint.json current = 1-04 Hallucinations, and the only real study in the entire window (7 reps, 30-31 Jul) was hallucinations, which the packet has never once drilled. Even perfect delivery scores 0/10: the gaffer bet on inference while he worked hallucinations. This is a selection/alignment defect on top of the delivery one.
> 
> IMPACT OVERSTATED: "that 0 now sits in trust_tiers as if it were evidence about coaching quality" — trust_tiers.json has zero readers repo-wide (manager.mjs assemblePrompt never serializes it; dressing-room/manager/system.md:535 already concedes this), and scorer_config.json:5 requires n>=20 and hit_rate>=0.9 for no_look. A 0 at n=7 changes no behavior. Inert, not poisonous. Note also this is already written up in dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md:127,215,228.
> 
> KIND: not "starved" — the input side compiled a 3-drill packet every night for 15 consecutive days; scarcity is not the problem. "unwired" fits: the loop's sole output (trust_tiers) reaches nobody, and the drill content is stripped on every SCHEDULED surface.
> 
> SEVERITY: yellow, not red. Nothing crashes or corrupts, multiple surfaces exist, the metric is inert downstream, and a solo user with 9 reps in 15 days is partly the denominator. Still real because the wall genuinely emits a content-free label three times a day.
> 
> FIX CORRECTED: cheapest high-leverage change is viz.mjs:106 — carry `concepts` through into drills_tomorrow and render it on the wall he already sees 3x/day as wallpaper — not the learnstate brief block, which needs his sign-off on kickoff content. Separately, setpiece's concept selection should be reconciled against sprint.json's current task, or the gaffer will keep betting on concepts he was never going to study.

---

## 34. postmatch.mjs has never run — post_match/ and season.json have never existed — so the scorer's post-match witness and the scout's war-room / FinOps arms are permanently dark inputs

- **kind:** `unwired` · **severity:** `red` · **area:** `forge-exam` · **day-one fixable:** no
- **where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\postmatch.mjs:27,:39 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\scorer.mjs:508-521 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\scout.mjs:23,:131-140

**Evidence**

> `ls dressing-room/state/post_match` -> No such file or directory. `ls dressing-room/state/season.json` -> No such file or directory. postmatch.mjs:39 `const PM_DIR = join(STATE_DIR, "post_match")`; its header (:27) declares it sole writer of "post_match/<date>.md · season.json · notebook.json · routed_balls.json". scorer.mjs:508-521 builds pmPath = post_match/<today>.md and sets world.postmatchHit = pmText ? ... : null — permanently null, so twin.mjs:93's `hit = repsOnDate > 0 || postmatchHit === true` runs on one leg forever. scout.mjs:23 declares season.json an input; warRoomRead (:131-140) reads season.interview_dates and the finops branch reads season.pipeline_item — live scout.json has {"war_room":{"active":false,"mode":null}} and no pipeline item. No ArsenalFC-* task runs postmatch.mjs; its only invoker is .claude/skills/full-time/SKILL.md:14.

**Impact**

> Two whole capabilities are wired to a file that has never been written once. The scorer's floor_touched market resolves on reps alone with no second witness, and the war-room taper protocol ("inside the taper window the whole body shifts") can never activate, because the only place an interview date can be logged is a file no code has ever created.

**Proposed fix**

> postmatch needs his HIT/MISS + signal + KAL-line so it cannot be scheduled unattended — but season.json can be split out: hand-seed it (interview_dates:[], pipeline_item:null) so the scout stops reading a missing file, and make the ArsenalFC-Bell-FullTime push actually chase the /full-time ritual until postmatch has written today's file. The real fix is behavioural: /full-time has to be run once for this pipeline to have any history at all.

**Verifier's note**

> REAL, but the headline fact is FALSE and the stated cause/fix for half the impact is wrong.
> 
> WHAT I REPRODUCED (all confirmed):
> - `Test-Path dressing-room/state/season.json` -> False; `.../post_match` -> False. Full state listing has no season.json, no post_match/, no notebook.json, no routed_balls.json. Confirmed.
> - scorer.mjs:508-509 `const pmPath = join(STATE_DIR, "post_match", today + ".md"); const pmText = existsSync(pmPath) ? ... : null` and :521 `postmatchHit: pmText ? /\b(HIT|PARTIAL)\b/.test(pmText) : null`. Confirmed.
> - Live proof of the consequence, from `dressing-room/state/slip.jsonl`: `{"date":"2026-08-01",...,"type":"floor_touched",...,"hit":false,"evidence":"0 rep(s)"}` — same for 25/29/30 Jul. The evidence string never once says "+ post-match HIT". The second witness is genuinely dark on live rows.
> - No ArsenalFC-* task runs postmatch.mjs (checked all 44 via schtasks). Confirmed.
> 
> REFUTATION 1 — "has never run / have never existed" is FALSE.
> `dressing-room/vault_preseason_2026-07-14/state/post_match/2026-07-12.md` exists (644 bytes, ts Jul 12 19:22), alongside `notebook.json` = `{"moments":[{"date":"2026-07-12","line":"112 window-switches, 37 Learning-minutes - motion, not yet a rep","result":"MISS"}]}`. And `vault_preseason_2026-07-15/.../season.json` = `{"season_day":1,"matches_played":0,...,"started_on":"2026-07-12","last_result":"MISS","last_played":"2026-07-12"}` plus a `routed_balls.json` with 5 routed ids dated 2026-07-12 including `note:2026-07-12T13:28:43.941Z`. `last_result`/`last_played` have exactly one writer in the whole repo — postmatch.mjs:100-101. So the ritual ran once, end-to-end, all four outputs, on 12 Jul 2026; the 14/15/17 Jul vault wipes archived them and nobody restored them. The pipeline is PROVEN, not unbuilt.
> 
> REFUTATION 2 — KIND is wrong. postmatch is not unwired: it has three live invokers (`.claude/skills/full-time/SKILL.md:14`, the voice gate `dugout.mjs:1038` `sh("postmatch.mjs", argv)` behind `run_postmatch`, and `npm run postmatch`), and `ArsenalFC-Bell-FullTime` is Enabled, Status Ready, Last Run 01-08-2026 21:30:01, Last Result 0 — the nightly cue IS being delivered. It is deliberately unscheduled because it prompts for his HIT/signal/KAL (postmatch.mjs:225-228, TTY). This is STARVED — a human ritual not performed for the 16 days of the fresh season — not a broken wire.
> 
> REFUTATION 3 — the war-room/FinOps cause and fix are WRONG. `updateSeason` (postmatch.mjs:94-103) seeds `{season_day, matches_played, trophy_state:"unlit", pipeline_item:null, started_on}` — it has no `interview_dates` key and never sets `pipeline_item`. Running /full-time 100 times would still leave `season.interview_dates` undefined, so `warRoomRead` (scout.mjs:133) keeps returning `{active:false, mode:null}` forever. A repo-wide grep for `interview_dates` finds only readers (scout.mjs:133), selftest fixtures (scout.mjs:207-210) and two doc lines (`ORGANISM_LEDGER.md:113`, `THE_MANAGER__Master_Prompt.md:120`) — there is NO writer anywhere. The war-room arm is genuinely unwired, but postmatch was never its writer; the proposed "hand-seed season.json so scout stops reading a missing file" is cosmetic (scout.mjs:133 already guards with `Array.isArray`, and warRoomRead(null) is explicitly selftested safe at scout.mjs:210). The FinOps arm is weaker still: `pipeline_item` only interpolates a suffix string at scout.mjs:95 (`const item = season && season.pipeline_item ? \` (${...})\` : ""`), and that branch is gated behind python-core-held which live `scout.json` shows as `"status":"awaiting_data"` — starved upstream, not blocked by season.json.
> 
> REFUTATION 4 — severity inflated. The Manager degrades cleanly, not loudly: manager.mjs:146 `const S = bus.season || {}` with defaults at :191-196, so a missing season.json crashes nothing. scorer line 94 (`else if (world.postmatchHit !== null)`) is dead regardless, since reps_log.jsonl exists so `repsOnDate` is never null. Net live damage = one degraded witness on floor_touched, plus the loss the claim under-weights: manager.mjs:186's KAL-line parse over `last_post_match` returns null every morning, so the KAL→KICKOFF weld — which postmatch.mjs:11-13 calls "the loop's biggest mechanic" — carries nothing. Yellow: real, daily, but behavioural and non-crashing on a solo laptop.
> 
> CORRECT FIX: (a) behavioural — one /full-time run restores post_match/season/notebook and the KAL weld, nothing to build; (b) separately, if the war-room taper is meant to exist, something must actually write `season.interview_dates` — today no code path can, at all.

---

## 35. The nightly Live Examiner drill reaches no surface he uses — its only consumer is a hand-booted dugout in scrimmage mode, and the /scrimmage skill never opens it

- **kind:** `unwired` · **severity:** `yellow` · **area:** `forge-exam` · **day-one fixable:** yes
- **where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\examiner.mjs:93-109 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\dugout.mjs:383 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\.claude\\skills\\scrimmage\\SKILL.md:11 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\reps_log.jsonl

**Evidence**

> examiner.mjs writes state/examiner_drill.json (live today: implement-shape drill on "hallucinations", staged 2026-08-01T16:25:03, 3 hidden tests, picked_because "stalling/regressing in learning_state"). grep for examiner_drill|drillSection|loadFreshDrill across the repo returns exactly one runtime consumer: dugout.mjs:71 (import) and dugout.mjs:383 (buildScrimmageInstruction). No ArsenalFC-* task runs dugout.mjs — reaching it needs `npm run dugout` then localhost:4114/?mode=scrimmage. .claude/skills/scrimmage/SKILL.md:11 reads only scout.json and dossier_weights.json. Independent proof it has never been served: all 9 rows in reps_log.jsonl carry "surface":"gem" — zero chalkboard/code-round reps in the whole ledger.

**Impact**

> ArsenalFC-Examiner fires at 21:55 every night and writes a file that expires unread ~48h later. The build-it-live drill its own header calls "the highest-transfer drill for an AI-PE interview" has, measurably, never been run once.

**Proposed fix**

> Add dressing-room/state/examiner_drill.json to step 1 of .claude/skills/scrimmage/SKILL.md's read list and instruct it to run the drill as the heaviest probe — examiner.mjs already exports drillSection(), which renders exactly that block, so the skill can embed the same text. Pure prose change to one skill file.

**Verifier's note**

> Core assertion verified and reproduced. ArsenalFC-Examiner is Ready, next run 02-08-2026 21:55, running `node scripts\examiner.mjs stage`; examiner_drill.json is live (date 2026-08-01, concept "hallucinations", template implement, 3 hidden tests) and `node scripts/examiner.mjs` confirms "fresh drill staged". Exhaustive grep for examiner_drill|drillSection|loadFreshDrill returns exactly two runtime consumers: scripts/dugout.mjs:71 (import) and :383 (drillSection(loadFreshDrill(now)) embedded in buildScrimmageInstruction). .claude/skills/scrimmage/SKILL.md reads scout.json, dossier_weights.json, doubt_grammar.json and brain_out/scrimmage/ only — no examiner_drill.json, no code round in any of its 6 steps. No ArsenalFC-* task runs dugout.mjs (full 44-task schtasks dump checked). The dugout scrimmage mode has demonstrably never completed a session: dressing-room/state/dugout_scrimmage.jsonl is ABSENT from the state dir (scrimmage_report at dugout.mjs:1213 reads it for hedge-density), brain_out/dugout/ contains only 2026-07-17/18/19/30.md with no scrimmage_<date>.md ever filed (dugout.mjs:1226), dugout_session.json says "mode":"gaffer", and no rep in reps_log.jsonl carries note "scrimmage-voice".
> 
> THREE CORRECTIONS:
> 
> (1) The offered evidence is wrong reasoning. "All 9 rows carry surface:gem therefore zero code-round reps" does not follow — dugout.mjs:1007 hardcodes `surface: "gem"` for EVERY voice rep including scrimmage ones. The discriminator is the note field, dugout.mjs:1005: `const note = (deps.mode === "scrimmage" ? "scrimmage-voice" : "dugout-voice") + ...`. Two of the 9 reps carry "dugout-voice", zero carry "scrimmage-voice". Conclusion survives; the stated proof does not.
> 
> (2) "Hand-booted... needs npm run dugout then localhost:4114/?mode=scrimmage" understates the path. C:\Users\nikhi\OneDrive\Desktop\ARSENAL VAULT\ARSENAL 4 - SCRIMMAGE - MOCK ME.cmd exists on disk, starts the bridge if port 4114 isn't listening, then opens ?mode=scrimmage. CAPTAINS_HANDBOOK.md:16 prescribes it weekly. It is a first-class desktop launcher he has simply never double-clicked.
> 
> (3) The PROPOSED FIX does not deliver the claimed impact. /scrimmage has never run either — no rep carries note "scrimmage" (its own step-5 tag), and its trigger gate is currently unmet: scout.json `staged` = []. Adding examiner_drill.json to that skill's read list moves the drill from one unopened door to two. Root cause is that no scrimmage of any kind has ever been played, not that the drill is mis-plumbed. The right fix is to make the drill reach a surface he actually opens daily (the Gaffer/kickoff dispatch or the matchday sheet), or to accept it as staged-and-waiting.
> 
> KIND: "unwired" is accurate only for the /scrimmage skill seam — two parallel scrimmage implementations exist and only the dugout one consumes the drill. The dugout path is correctly wired and healthy (examiner.mjs selftest ALL CHECKS PASSED; the 2026-08-01 drill loads fresh on 2026-08-02 per loadFreshDrill's yesterday-window). That half is "waiting", not broken.
> 
> SEVERITY: yellow is inflated. examiner.mjs:18 states "No LLM here: staging is pure code" — the nightly cost is one deterministic local script writing one small gitignored file. Zero tokens, zero state pollution, nothing degrades. The loss is opportunity only, and the fix is prose in one file. That is a note.
> 
> SIDE OBSERVATION (not the claim): the live drill reads "Implement a MINIMAL working hallucinations from scratch in Python" — the implement template assumes an algorithmic concept and pickConcept handed it a non-implementable one. If served today, that instance would be incoherent.

---

## 36. The teaching contract's "drift-ranked, mutates with the journey" ordering is frozen — all 5 hits were written in one 402-millisecond burst and nothing in the machine can ever record another

- **kind:** `unwired` · **severity:** `yellow` · **area:** `forge-exam` · **day-one fixable:** no
- **where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\teaching_contract.mjs:82-88,:111-117,:272-279 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\teaching_contract.json · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\forge_session.mjs:330-341

**Evidence**

> Live teaching_contract.json: his-word last_hit 2026-07-31T18:21:03.993Z, hinglish :04.109Z, terminology :04.191Z, link-back :04.289Z, decided :04.395Z — five rules hit inside 402 ms, i.e. a scripted seeding run, not observed drift. Zero hits in the 2 days since. grep for teaching_contract across scripts/, hooks/ and .claude/ returns only .claude/settings.json:9 (`print`) and forge_session.mjs's READ-ONLY consumer — nothing anywhere calls `hit <id>`. Consequence in rank() (:82-88): slot 1 is his-word forever (hits 2 vs 1) and the four 1-hit rules order by 100-ms timestamp deltas from that same burst. Downstream, forge_session.mjs teachingDrifts() (:330-341) put rules_drifted:5 into the last forge_sessions.jsonl row — derived entirely from that one burst.

**Impact**

> Mechanically the ranking IS computed from state, so the code is not a static list — but the data is. It claims to sharpen itself against "whatever is actually going wrong" and cannot, because the only writer of drift evidence is a human typing a CLI verb nobody has typed since the seed. The close report then quotes that frozen count back at him as though it measured last night's teaching.

**Proposed fix**

> Needs his decision on who may record a drift — self-reporting by the teaching model (make `teaching_contract.mjs hit <id>` an obligation in the /forge and /learn skills whenever he corrects them), or a nightly LLM pass over the transcript. Until one exists, the close report should say "drift evidence is manually recorded; last recorded 31 Jul" instead of presenting a stale count as a measurement.

**Verifier's note**

> REPRODUCED, but the scanner's headline framing and its stated downstream harm are both wrong. Corrected below.
> 
> WHAT I CONFIRMED MYSELF
> 
> 1. `hit` has no producer anywhere in the machine. Grep across the whole repo for `teaching_contract` returns exactly: `.gitignore:104-105`, `.claude/settings.json:2` (comment) and `:9` (`node scripts/teaching_contract.mjs print`), `scripts/forge_session.mjs` (declared READ-ONLY at :44-45, :59), and the organ itself. A targeted grep for `teaching_contract.mjs (hit|add)` across .mjs/.json/.md/.ps1/.bat/.cmd returns ZERO lines. `.claude/skills/` exists in-repo and no skill file mentions it; `dressing-room/config/brain_config.json` has zero mentions. So no hook, no brain job, no skill, no scheduled task ever calls `hit` or `add`. That part of the claim survives.
> 
> 2. The 402-ms burst is real and is a seeding run, not observed drift arriving over time. In `dressing-room/state/teaching_contract.json` all five rules share `born: 2026-07-31T18:21:03.887Z` — i.e. `seed()` ran and saved at that instant — and every `last_hit` lands 106-508 ms later (.993 / :04.109 / :04.191 / :04.289 / :04.395), ~100 ms apart, the signature of a shell loop of `node ... hit <id>` invocations. No human types six CLI commands in 402 ms.
> 
> 3. `node scripts/teaching_contract.mjs list` (read-only, no save) confirms the frozen order today: his-word hits=2, then decided / link-back / terminology / hinglish all at hits=1, ordered purely by those 100-ms timestamp deltas. Selftest: 18 passed, 0 failed — the organ is healthy, and it is LIVE (`turns.count` = 32, so the `print` hook is firing).
> 
> CORRECTION 1 — "the ordering is frozen" is overstated. Only slot 1 is pinned. `rank()` (:82-88) pins his-word forever, but `pick()` (:90-100) rotates slot 2 through the remaining four by turn number, and the selftest at :197-200 proves every non-top rule resurfaces. All five rules still reach him. The teaching-injection function — the organ's actual job — is intact. This is a degraded refinement, not a dead organ.
> 
> CORRECTION 2 — the claimed downstream harm is REFUTED. The scanner says the close report "quotes that frozen count back at him as though it measured last night's teaching." It does not. `teachingDrifts()` (forge_session.mjs:330-339) is anchored to `started_at` and only counts rules whose `last_hit >= t0`. The `rules_drifted:5` row in `forge_sessions.jsonl` belongs to the session that started `2026-07-31T12:25:41.929Z` — and the hits at 18:21Z fall genuinely INSIDE that window. That number was correct when written. I ran the real function against the real files:
>   OPEN SESSION started_at: 2026-07-31T22:55:05.107Z
>   what the close report WILL say: {"rule_ids":[],"rules_drifted":0}
>   what the PREVIOUS session said: {"rule_ids":[...5...],"rules_drifted":5}
> So no stale count is ever re-quoted. The comment at :318-328 ("NO ANCHOR, NO CLAIM") shows the author guarded this deliberately.
> 
> THE REAL DEFECT IS THE MIRROR IMAGE, AND IT IS WORSE. Because nothing writes `hit`, `last_hit` can never advance past 31 Jul, so from the currently-open session onward `teachingDriftLine()` (:343-348) will print `TEACHING DRIFTS THIS SESSION: none` every single close, forever, no matter how badly the teaching drifts. That is a false clean sheet — an unmeasured silence rendered as a measured zero — inside the one report built specifically to refuse that class of lie (its own comment at :323-324 calls printing an unknowable number "the same class of lie as marking an axis done without its own jirah"). The null branch was guarded ("a missing teaching contract is not a clean sheet", :341-342); the never-recorded branch was not.
> 
> BROKEN vs STARVED: this is starved-by-construction, i.e. unwired — the input channel exists and works (selftest green, `hit` mutates correctly) but has no producer other than a human typing a CLI verb, and the header's promise at :26-28 that the contract "sharpens itself against whatever is actually going wrong" cannot be met by that. Not a volume problem like reps_log's 9 rows; there is no automated path at all.
> 
> SEVERITY: yellow stands. Not red — the five rules still all reach him every session and the pacer is unaffected. Not a note — the close report emits a confident "none" that is not a measurement.
> 
> FIX, corrected: the scanner's fix ("close report should say drift evidence is manually recorded; last recorded 31 Jul") is right in spirit but aimed at the wrong string. The line that needs the honesty guard is the `!d.rule_ids.length` branch of `teachingDriftLine()` at forge_session.mjs:345 — it should distinguish "no drift observed" from "no drift-recording mechanism has run since <last_hit>", e.g. by carrying the newest `last_hit` across all rules and saying so when it predates the session. Wiring a producer (a `hit` obligation in /forge and /learn, or a nightly transcript pass) is his decision and is the separate, larger call.

---

## 37. forge_session boot hides the previous session's coverage line whenever any session is open on disk — so the one artifact of yesterday's teaching never reaches SessionStart

- **kind:** `broken` · **severity:** `yellow` · **area:** `forge-exam` · **day-one fixable:** yes
- **where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\forge_session.mjs:520-546 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\forge_sessions.jsonl

**Evidence**

> bootLines (forge_session.mjs:520-546): the `if (s && s.concept && !s.closed_at)` branch RETURNS its two lines, so the `if (h.last)` history branch below is only reachable when no session is open. Live proof — `node scripts/forge_session.mjs boot` right now prints only the open-session pair and nothing from forge_sessions.jsonl's last row, which carries the real verdict: steps_pct 33, axes_untouched a-i, core_missing ["d"], method_clean false, teaching_drifts.rules_drifted 5. Because of finding #1 that session stays open indefinitely, so the suppression is permanent, not transient.

**Impact**

> The boot line exists precisely so "a fresh session arrives holding his durable memory instead of making him re-explain himself". The most decision-relevant fact at kickoff — that the last two sessions both closed method_clean:false with the CORE axis d never taught — is exactly what the branch swallows.

**Proposed fix**

> When the open session is STALE, emit the history line as well — three lines instead of two, still within the hard cap's spirit. The stale case is precisely the case where the open session is NOT the thing he is continuing.

**Verifier's note**

> MECHANISM CONFIRMED, PAYLOAD AND IMPACT OVERSTATED, CAUSE INCOMPLETE.
> 
> Reproduced: forge_session.mjs:522 `if (s && s.concept && !s.closed_at)` returns at :530-537, making the `if (h.last)` history branch at :539 unreachable while any session is open. Live `node scripts/forge_session.mjs boot` prints only the two open-session lines ("FORGE SESSION OPEN ON DISK · hallucinations · STEP 3/11 SAMJHAO · axes done — · left abcdefghi · started 22.2h ago (STALE)") and nothing from forge_sessions.jsonl. Verified read-only: Get-FileHash on forge_session.json and forge_sessions.jsonl unchanged before/after. Confirmed wired to SessionStart at .claude/settings.json:24. forge_session selftest: 91 passed, 0 failed.
> 
> CORRECTION 1 — the quoted payload is not what the code emits. bootLines' history branch (:542-545) reads only concept, ended_at, steps_ran.length, axes_done, axes_ungraded, elapsed_min, ended_by, and same_concept. It NEVER reads steps_pct, axes_untouched, core_missing, method_clean, or teaching_drifts.rules_drifted. The actual suppressed line is: "LAST FORGE SESSION · hallucinations · 2026-07-31 · steps 4/12 · axes done — · ungraded — · elapsed 626.2m · close · 2 recorded runs for this concept". The scanner read those verdict fields out of the JSONL by hand and attributed them to a line that cannot print them. The claimed impact ("the last two sessions both closed method_clean:false with CORE axis d never taught") is therefore not what the branch swallows — that verdict reaches no boot line either way.
> 
> CORRECTION 2 — live informational delta is near-zero. The open-session line already states concept=hallucinations, step 3, axes done none, left abcdefghi (i.e. core axis d untaught). The suppressed history row is the SAME concept at steps 4/12 with zero axes. The single net-new fact is "2 recorded runs for this concept" — the repetition signal. Real, but small.
> 
> CORRECTION 3 — the cause is broader than bootLines, and this is the finding that actually holds. learning_state.mjs:235-247 was written for exactly this problem: "last_closed rides the LAST history row and is populated INDEPENDENTLY of whether a session is open — 'what did he finish last' and 'what is he on now' are two different questions and the Gaffer asks both." The live dressing-room/state/learning_state.json confirms position.last_closed holds the full row (concept hallucinations, ended_at 2026-07-31T22:51:52.641Z, steps_ran [0,1,2,3], steps_missed [4..11]). But `grep -rn "last_closed"` across scripts/, .claude/ and hooks/ returns ONLY learning_state.mjs itself — zero consumers. brain.mjs:758 reads `ls.position` but gates on `ls.position.session_open` and recomputes `dead` from started_at, dropping the entire block for a stale session, and never references last_closed at all. So the coverage row has exactly two surfaces and BOTH are currently silent. That is unwired, not broken.
> 
> ON THE PROPOSED FIX — partly wrong. Every bootLines selftest fixture pairs an OPEN session with {last:null} (:793, :798, :802) and non-null history only with a CLOSED session (:804, :810). The open-beats-history precedence is therefore never asserted anywhere; it is incidental, not a designed invariant — which supports the finding. However :811-812 explicitly asserts "BOOT IS BOUNDED — never more than 2 lines in any branch", matching the documented HARD CAP at :516-518, so emitting a third line contradicts a selftested anti-wall law. The higher-yield repair is to wire learning_state.json's position.last_closed (already computed, already on the bus, already session_open-independent by deliberate design) into brain.mjs's buildFingerprint, rather than to widen the boot cap.
> 
> SEVERITY — yellow is inflated. The code does exactly what it was written and documented to do; the suppression only manifests because a session was left open, which is a different finding, and bootLines itself prints the one-command remedy ("Run `node scripts/forge_session.mjs close` FIRST — that is the only thing that saves the coverage report"). For a solo user the lost information is one repetition count, and the coverage report is fully reachable on demand. Note.

---

## 38. setpiece reads a `recurrence` field nemesis has never written, so today's drill packet on disk literally says "nemesis headline ×?"

- **kind:** `lying` · **severity:** `yellow` · **area:** `forge-exam` · **day-one fixable:** yes
- **where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\setpiece.mjs:252,:466 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\nemesis.mjs:284 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\drills.json

**Evidence**

> setpiece.mjs:252 `source: ax ? "axis_pattern strength " + ax.strength : "nemesis headline ×" + (wk.headline.recurrence || "?")`. nemesis.mjs:284 builds the headline as { id, topic, axis, one_line } — no recurrence key; the count lives one level up on weaknesses[0].recurrence (live value 2). Live drills.json for 2026-08-02: "source": "nemesis headline ×?". setpiece's own selftest fixture (:466) invents `headline: { topic: "chunking", recurrence: 3 }` — a shape the producer has never emitted — which is why this is green.

**Impact**

> Small in size but it is a rendered string on the drill packet he reads, and the missing number is the whole point of the source line (how many times this weakness recurred). It is also a live instance of a selftest fixture diverging from the producer's real schema — the exact bug class learnstate.mjs:104-125 documents having been bitten by twice.

**Proposed fix**

> Resolve the count from the weakness entry that produced the headline: wk.weaknesses.find(w => w.id === wk.headline.id).recurrence. Then replace the selftest fixture with nemesis's real emitted shape so the assertion can go red.

**Verifier's note**

> REPRODUCED. setpiece.mjs:252 reads `wk.headline.recurrence`; nemesis.mjs:284 builds the headline as `{id, topic, axis, one_line}` and has never emitted `recurrence` (grep shows it only on entries/weaknesses[] rows at :249 and :307). Live drills.json for 2026-08-02 line 28 literally reads `"source": "nemesis headline ×?"`, while weaknesses.json carries the count one level up at weaknesses[0].recurrence = 2. Not an edge case: nemesis.mjs:288 gates axis_pattern behind total_reps >= 20 (default at :61) and live total_reps is 9, so axis_pattern is null and the ternary ALWAYS takes the broken headline branch. This is the only branch the organism has ever run.
> 
> CORRECTION 1 — the scanner's selftest reasoning is wrong in a way that makes it worse. The fixture at :466 also carries axis_pattern {strength:3}, so `ax` is truthy and the headline branch is never executed by any fixture at all. Every headline-bearing world in the selftest is a spread of the same `world` object; the headline-less worlds (bare, trophyWorld, badLock, empty) have no headline. Additionally, grep over all ~50 `assert("` calls shows ZERO assertion touching any `source` string. So it is green because the branch is untested and unasserted, not because the invented fixture satisfies an assertion. Fixing the fixture shape alone would still not turn it red — an assertion has to be added too.
> 
> CORRECTION 2 — impact is overstated. He does not read this string. matchday/SKILL.md:17 renders "kind + concept only"; viz.mjs:106 maps only {kind, emoji}; no renderer in the repo prints drill.source. Its one real downstream is scorer.mjs:153 `evidence: d.source || null`, which will file the gaffer's prediction row for this drill with evidence "nemesis headline ×?" instead of "×2" (slip.jsonl holds 23 drill:recall rows and no drill:rejirah yet, so it has not landed). Hence severity note, not yellow — a degraded ledger evidence string on a solo user's laptop, not a captain-facing lie.
> 
> CORRECTION 3 — kind. `×?` does not assert a falsehood, it visibly admits an unknown, so "lying" is the wrong label. It is a consumer reading a field the producer never emits with the fallback firing on every run: broken.
> 
> FIX is sound but needs a guard: weaknesses[] is unsliced (nemesis.mjs:305-307) and both sides carry `id`, so `wk.weaknesses.find(w => w.id === wk.headline.id)?.recurrence` resolves — the scanner's un-chained version would throw if the two ever diverge. Simpler still: headline.one_line already reads "2× miss on hallucinations…". Worth fixing not for the string but because it is a live third instance of the producer/consumer schema drift that learnstate.mjs:104-125 documents having shipped twice ("nemesis writes `axis` as a bare axis LETTER… printed 'WATCH-LIST: a'").

---

## 39. FORGE_SPEC's GATE 2 (cold-reader verify at every LOCK/SAVE) exists only as prose — no code checks it, and 8 of 112 live doubts violate the spec's own named failure patterns

- **kind:** `unwired` · **severity:** `yellow` · **area:** `forge-exam` · **day-one fixable:** yes
- **where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\learning-layer\\FORGE_SPEC.md:113,:117,:128,:165 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\capsules\\context.json · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\capsules\\embeddings.json · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\capsule_bridge.mjs:116

**Evidence**

> FORGE_SPEC.md:128 and :165 define GATE 2 as a mandatory verify of every doubts[]/bridges[].q against the COLD-READER STANDARD. `grep -rn "cold.reader|GATE 2" scripts/` returns only brain.mjs's unrelated budget gates and one comment at forge_session.mjs:73. capsule_bridge.mjs — the only organ that reads capsules — counts doubts (:116) and never inspects one. Scanning all 112 live doubts against the spec's own examples (:113 forbids dangling ye/woh/Map/second-enemy/(pehle-guess); :117 forbids curriculum/deferral notes) finds 6 cryptic + 2 meta: context.json — "...(pehle-guess)", "ye to inference vali cheez hi hai na?", "second enemy = menu size jo logits se banta?", "ye per step compute cost yaad nahi rehti...", "chop/summarize/RAG kaise chalta - nahi seekhna?"; embeddings.json — "Map kaunsa hai? Ye map kya cheez hai?", "Yeh semantic SEARCH hai?", "IVF aur HNSW - kacha samajh, kitni depth?". Four are verbatim the examples the spec cites as failures. Otherwise the capsules are well-formed: all 4 carry id/lockedOn/status/faultLines with 9 axes each, every faultLine has axis/title/strike/weld/status/deep, all 36 axes graded "held" — the schema itself is clean.

**Impact**

> The spec's own root-cause note says ~1/3 of doubts were cryptic before the standard was written, and named a "cure-half: 4 capsule-remediation threads" as the follow-up. Two of the four capsules still carry the defects, and nothing in the machine can ever notice — the tape_room and doubtminer surfaces will keep serving "ye to inference vali cheez hi hai na?" to a cold future-Nikhil who has no idea what "ye" was.

**Proposed fix**

> Add a read-only `capsule_bridge.mjs verify` subcommand running the four named failure patterns (leading dangling pronoun, un-anchored subject, meta/curriculum/deferral vocabulary, near-duplicate first-6-tokens) over every doubt and bridge, emitting a flagged list. It writes nothing and fixes nothing — GATE 2 is flag-then-approval by design. Surface it in the heartbeat console so a new bad doubt is caught the night it lands.

**Verifier's note**

> CONFIRMED, with the count and the cause corrected upward.
> 
> GATE 2 IS PROSE-ONLY — reproduced. FORGE_SPEC.md:165 ("GATE 2 — CONTENT-VERIFY at LOCK/SAVE (NEW, 7/2) ... koi cryptic / fragment / meta / near-duplicate slip ho -> FLAG -> Nikhil-approval pe fix -> TABHI file 'done'") and PROJECT_OS.md:391 ("Do gates: Gate 1 (capture...) + Gate 2 (lock/save VERIFY — slip pakdo)") both mandate it. Repo-wide `grep -rn "cold.reader|GATE 2|cryptic|near-dup" --include=*.mjs --include=*.md --include=*.json .` returns ZERO code hits; brain.mjs:299-305 "GATE 2a/2b/2c" are unrelated budget gates. Only two non-spec hits exist and BOTH carry GATE 1 only: .claude/skills/forge/SKILL.md:86-92 (step 10 LOCK reproduces the cold-reader standard in full, then says "GATE 1 — CAPTURE-GATE ... he BATCH-glances -> then it is written" and stops) and full-time/SKILL.md:18. forge_session.mjs:73 comments the LOCK step as "GATE 1 cold-reader standard on doubts[]". GATE 2 appears in no runtime surface — not code, not skill prose.
> 
> THE SHARPER CAUSE (correcting the claim). The defect is not merely "no code checks it" — GATE 2 is designed as a Claude+human flag-then-approve procedure, so absence of code is not itself a bug. The bug is that the ONE artifact actually loaded at a LOCK (the forge skill) transcribes GATE 1 verbatim and drops GATE 2 entirely, while the spec that carries GATE 2 is referenced by the skill (SKILL.md:15) but never loaded. A gate that lives only in an un-loaded file cannot fire.
> 
> EMPIRICALLY IT NEVER FIRED. A deterministic scan of all 112 doubts against the spec's own named patterns flags 16, not 8 — the claim UNDERCOUNTS and missed three of the spec's five verbatim ❌ examples. Present verbatim: context#11 "har layer pe SAME KV cache?" (spec:120 CRYPTIC ❌), inference#17 "Zyada temp = ?" (spec:121 FRAGMENT ❌), embeddings#12 "[RESOLVED 21 Jun] ANN cold-recall - 4 din pehle nervous, ab?" (spec:122 META ❌), context#14 "chop/summarize/RAG kaise chalta - nahi seekhna?" (spec:122 ❌), embeddings#10 "IVF aur HNSW - kacha samajh, kitni depth?" (spec:117/122 ❌). Five, not four. Plus context#0 "(pehle-guess)", context#2 "second enemy =", embeddings#0 "Map kaunsa hai? Ye map kya cheez hai?" — all three tokens the spec names by name at :113 — and 8 more meta/deferral ("mujhe derive karna chahiye?", "samajhna hai?", "yaad rakhna padega?", "FinOps mein seekhunga kya?", "samajhna zaroori?"). The standard was written 2026-07-02; mirror_manifest.json shows the capsules re-fetched 2026-08-01 with all four ok — so the canonical gist still carries them 30 days on.
> 
> TWO FACTUAL ERRORS IN THE EVIDENCE. (1) "capsule_bridge.mjs — the only organ that reads capsules" is FALSE: doubtminer.mjs:33/102/208, cortex.mjs:78, council.mjs:77, physio.mjs:351 and dugout.mjs:965 all read them. (2) The claim's severity is if anything understated on impact, because the reaching-a-surface half is worse than stated and I confirmed it live: doubtminer.mjs:210 does `queue.push({ capsule: c.id, doubt_index: i, q_verbatim: d.q, ... })`, and dressing-room/state/tape_room.json currently holds queue.length = 112, doubts_retired = 0, every entry eligible:true. All 16 defective doubts are queued RIGHT NOW as verbatim rematch prompts for the /rematch skill. dugout.mjs:965 also serves doubts[].q verbatim through get_capsule.
> 
> NOT STARVED, NOT WAITING. This is not a volume problem — 4 capsules and 112 doubts is exactly the input the organ was built for (doubtminer's own gate is min_capsules 4 / min_doubts 60 and it is OPEN). And it is not merely "waiting on the known cure-half": the spec's 2026-07-02 changelog does name "Next (cure-half): 4 capsule-remediation threads (tok -> emb -> inf -> ctx)" as pending, so the DATA backlog is acknowledged — but the GATE itself is a separate, never-built safety net, and its absence is why the backlog silently persisted for a month with nothing able to notice.
> 
> SEVERITY: yellow is correct, not inflated and not deflatable. Nothing crashes, no state corrupts, capsules are IMMUTABLE read-only gist mirrors (git ls-files dressing-room/state/capsules/ returns nothing — they are fetched, not tracked). But a live surface is actively degraded: the tape-room will serve "ye to inference vali cheez hi hai na?" and "Zyada temp = ?" as rematch opponents, and neither is answerable cold. Not red — solo user, no data loss, fully repairable.
> 
> FIX CORRECTION. The proposed `capsule_bridge.mjs verify` subcommand is the wrong home. capsule_bridge is a schedule/count reader; doubtminer.mjs already iterates every doubt nightly at 21:45 AND owns tape_room.json — flagging there catches a bad doubt before it is queued as a rematch prompt, in the same pass. And the cheaper, more important half is not code at all: add the GATE 2 clause to .claude/skills/forge/SKILL.md step 10 (and the full-time back-write path), since that is the only text present when a LOCK actually happens. Flag-only is right — capsules are gist mirrors, so no local write can repair them; the fix must reach the gist through the captain.

---

## 40. course.mjs is 670 lines of fully dead code — no task, no npm script, no import, no skill reference, and course.json has never existed

- **kind:** `dead-code` · **severity:** `yellow` · **area:** `forge-exam` · **day-one fixable:** yes
- **where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\course.mjs:70 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\package.json · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\.claude\\skills\\learn\\SKILL.md:47

**Evidence**

> grep for "course.mjs" across the repo returns hits only inside course.mjs itself and the generated bundle. `grep -c course package.json` -> 0 (not in scripts, not in organism:selftest, not in squad:selftest). No ArsenalFC-* task references it (all 46 actions enumerated). `ls dressing-room/state/course.json` -> No such file or directory. `node scripts/course.mjs status` -> "course: nothing ingested yet". Its own selftest is green (44 passed). The /learn skill's `track = course` branch (.claude/skills/learn/SKILL.md:47-51) describes the ritual in prose and never invokes it. Committed one commit ago (d78a7d8, 1 Aug).

**Impact**

> sprint.json's next_up is "1-05 Anthropic: API Fundamentals · 1-06 Anthropic: Prompt Engineering (9 ch)" — both course-track. The chapter-position tracker built for exactly that is invisible to the skill that will run those sessions, so on 1-05 he will be asked where he is instead of being told.

**Proposed fix**

> Three small wires: add "course" and "course:selftest" to package.json scripts and append course:selftest to squad:selftest; add `node scripts/course.mjs status` to the /learn skill's state-read list (§1) and `course.mjs at <n>` / `done <n>` to its course branch; have learnstate.mjs's brief print the course line when the current track is `course`.

**Verifier's note**

> CONFIRMED by independent reproduction. scripts/course.mjs is 670 lines with zero callers: `package.json` contains no occurrence of "course" (not a script, absent from organism:selftest's 35 and squad:selftest's 11); `grep -rn "course\.mjs"` hits only the file itself plus the generated ARSENAL_FC_FULL_REPO_BUNDLE.md; no import/from statement anywhere in scripts/ or .claude/; `schtasks /query /fo LIST /v | Select-String "course"` returns nothing across all 46 ArsenalFC tasks; dressing-room/state/course.json does not exist; `node scripts/course.mjs status` prints "course: nothing ingested yet" and `selftest` passes 44/44. The /learn skill's `track = course` branch (.claude/skills/learn/SKILL.md:47-51) is prose only and never invokes it. learnstate.mjs:133 carries a `course:` track label and :238-240 asserts course routing in its own selftest, yet never calls the tracker. Impact is imminent, not hypothetical: sprint.json current = 1-04 (concept), next_up = "1-05 Anthropic: API Fundamentals" and "1-06 Anthropic: Prompt Engineering (9 ch)" — both course-track.
> 
> CORRECTION 1 — KIND: "dead-code" is wrong. The file is one commit old (d78a7d8, 1 Aug), fully functional, selftest-green, and purpose-built for the track that arrives at the very next sprint task. Nothing calls it, but it is not vestigial and must not be deleted. Correct kind is UNWIRED: works, reaches nobody. It is not "starved" either — starvation implies a wire with no input; here there is no wire at all.
> 
> CORRECTION 2 — FIX LOCATION: the proposed fix says to add the status read to "the /learn skill's state-read list (§1)". The state-read list is §0 "Orient (read, don't ask)" (which reads `learnstate.mjs json` and `forge_session.mjs boot`); §1 is the ROUTE section. The wire belongs in §0. Otherwise the three-part fix (package.json scripts + squad:selftest, /learn §0 read and course-branch commands, learnstate brief printing the course line when track is course) is sound.
> 
> CAVEAT the claim omits: landing yesterday alongside other work, this may be a deliberate engine-first / wire-second build rather than an oversight. Still a finding — the wire does not exist today and 1-05 is next — but it is mid-build, not neglect.
> 
> SEVERITY holds at yellow. Not red: nothing is broken, no state corrupts, course.mjs writes nothing and cannot corrupt anything. Not a note either: SKILL.md:7 states the contract "The captain should NEVER re-explain where he is — the machine already knows", and across 1-06's 9 chapters the chapter-position tracker is precisely the machine that would know. Failure mode is a self-correctable annoyance for a solo user, but it is a direct violation of the skill's own stated promise on the next two tasks in the sprint.

---

## 41. The scorer's slip evidence says "N rep(s)" while N is the number of distinct CONCEPTS touched, understating every multi-rep day

- **kind:** `lying` · **severity:** `note` · **area:** `forge-exam` · **day-one fixable:** yes
- **where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\scorer.mjs:498-505 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\twin.mjs:93 · C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\dressing-room\\state\\slip.jsonl

**Evidence**

> scorer.mjs:498-505 builds repsByDate[d] as a Set of concept names and passes world.repsOnDate = repsByDate[today].size. twin.mjs:93 renders evidence = `${world.repsOnDate} rep(s)`. Live proof: reps_log.jsonl holds THREE reps on 2026-07-31 (14:36 hallucinations/a, 14:46 hallucinations/c, 17:48 hallucinations/a) and the slip row reads {"date":"2026-07-31","type":"floor_touched","hit":true,"evidence":"1 rep(s)"}.

**Impact**

> The hit/miss verdict is unaffected (both use >0), so nothing resolves wrongly. But the slip is the ledger the whole calibration metabolism is read from, and its human-facing evidence string is systematically wrong on any day he drills one concept repeatedly — which is exactly what a FORGE day looks like.

**Proposed fix**

> Carry both numbers: keep the concept Set for gafferMature's concept matching, and add a parallel repsCountByDate integer used only for the evidence string — "3 rep(s) on 1 concept(s)".

**Verifier's note**

> CONFIRMED, and understated. Reproduced myself: scorer.mjs:504 accumulates `(repsByDate[d] = repsByDate[d] || new Set()).add(String(r.concept||"").toLowerCase())` — a Set of CONCEPTS — and scorer.mjs:520 passes `repsByDate[today].size` as `world.repsOnDate`, which scorer.mjs:93 renders as `${world.repsOnDate} rep(s)`. Distinct concepts printed as a rep count.
> 
> TWO CORRECTIONS TO THE CLAIM.
> 
> (1) WHERE is wrong. twin.mjs:93 is `const tmp = path + ".tmp"` inside writeAtomic. twin.mjs contains no "rep(s)" string and no resolveTwin (grep for both returns nothing in that file). Repo-wide the ONLY producer is scorer.mjs:93. scorer.mjs:498-505 is correct.
> 
> (2) The magnitude is understated: it is 7 -> 1, not 3 -> 1. Machine TZ is IST +5:30 (verified: new Date('2026-07-30T20:28:02.795Z').toString() = "Fri Jul 31 2026 01:58:02 GMT+0530"), so the four 30-Jul-UTC rows key to local 31 Jul on top of the three 31-Jul rows. Recomputed with scorer's own localDate over reps_log.jsonl:
>   2026-07-18 rows=2 distinctConcepts=1 ["embeddings","embeddings"]
>   2026-07-31 rows=7 distinctConcepts=1 ["hallucinations" x7]
> Slip rows: line 3 {"date":"2026-07-18",...,"evidence":"1 rep(s)"} and line 49 {"date":"2026-07-31",...,"evidence":"1 rep(s)"}. BOTH days that contain any reps at all print a wrong number. This is not a starved organ waiting for volume — it misreports on 100% of populated days; the 9-rep corpus is enough to prove it, not an excuse for it.
> 
> "REACHES NOBODY" TEST — it fails; the string does reach him. No .mjs renders slip.evidence (grepped physio/thalamus/twin/scorer), but slip.jsonl is a raw input to five brain jobs in brain_config.json: evening_voice (opus, 21:50, human-facing), teamtalk_pm (sonnet, spoken to mp3, validate:"no_new_numbers"), deep_twin, season_review, deep_reanalysis. Verbatim proof the LLM quotes the string: dressing-room/state/brain_out/evening_voice/2026-07-31.md:7 — "Six days on the trot the floor read `0 rep(s)` — 21, 22, 23, 25, 29, 30." That same note then says "4 reps today" from the struggle read, so the organism already contradicts itself inside one paragraph. Under teamtalk_pm's no_new_numbers validator the TRUE rep count is the number that would get rejected, because the slip is the ground truth it validates against.
> 
> SEVERITY: note is correct, not inflated. The hit/miss verdict is genuinely unaffected — scorer.mjs:93 gates on `world.repsOnDate > 0 || world.postmatchHit === true`, and a Set size is >0 exactly when the row count is >0. Nothing resolves wrongly; Brier, tiers and the shadow books are untouched. The damage is confined to the narrative layer, which is why it is a note and not a yellow.
> 
> FIX: structurally right, one refinement. Do NOT redefine world.repsOnDate — it is simultaneously the hit gate (:93), the three-state dark-instrument sentinel (`null` when reps_log.jsonl does not exist, :520), and the field the selftest asserts on (:349 repsOnDate:2, :377 repsOnDate:null). Add a parallel integer (e.g. world.repRowsOnDate, built from a second repRowsByDate counter in the same loop at :499-505, carrying the identical null semantics) and use it only in the evidence string: `3 rep(s) on 1 concept(s)`. The Set must stay exactly as-is for gafferMature, which needs concept membership at scorer.mjs:185-186 (`set.has(c.toLowerCase())`).

---

## 42. The teaching contract's 5-line cap can silently amputate the CONTEXT WARNING, and today's state sits exactly on the boundary

- **kind:** `broken` · **severity:** `note` · **area:** `forge-exam` · **day-one fixable:** yes
- **where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\teaching_contract.mjs:136-144,:217-225

**Evidence**

> teaching_contract.mjs:144 `return L.slice(0, MAX_BLOCK_LINES)` with MAX_BLOCK_LINES = 5. The block is header(1) + show_n rules + link-back line(1, present whenever sprint.progress.done is non-empty — live it holds 3 entries) + warning(1). With the live show_n = 2 that is exactly 5, so the warning survives by one line. At show_n = 3 the total is 6 and slice() drops the LAST element — the CONTEXT WARNING. The anti-wall selftest (:217-225) asserts worst <= MAX_BLOCK_LINES at show_n = 4, which the slice guarantees, so it passes while proving the warning is gone.

**Impact**

> The organ's two purposes are the rules and the warning, and the truncation order silently sacrifices the warning — the one he asked for by name. It survives today only by the coincidence of show_n being 2.

**Proposed fix**

> Build the warning first (or reserve its slot before slicing) so truncation eats a rotating rule, never the warning. Add a selftest asserting the CONTEXT WARNING is present at every show_n from 1 to 5 when turn >= warnAt.

**Verifier's note**

> CONFIRMED, with two corrections to the scanner's framing.
> 
> WHAT I REPRODUCED (not trusted from the claim). I copied scripts/teaching_contract.mjs to scratchpad, appended a read-only probe that calls the real blockLines() against the LIVE dressing-room/state/teaching_contract.json plus the live sprint.json done-list, and ran it. Output:
> 
>   show_n=1 turn=40 lines=4 link=yes warning=PRESENT
>   show_n=2 turn=40 lines=5 link=yes warning=PRESENT
>   show_n=3 turn=40 lines=5 link=yes warning=*** MISSING ***
>   show_n=4 turn=40 lines=5 link=NO  warning=*** MISSING ***
>   show_n=5 turn=40 lines=5 link=NO  warning=*** MISSING ***
> 
> So teaching_contract.mjs:144 `return L.slice(0, MAX_BLOCK_LINES)` does drop from the tail, and the tail is exactly the CONTEXT WARNING pushed at :141-143. The mechanism, the file:line, and the failure direction in the claim are all correct.
> 
> The organ is live, not theoretical: .claude/settings.json:9 fires `node scripts/teaching_contract.mjs print` on UserPromptSubmit, so this block is injected every turn.
> 
> CORRECTION 1 — the blast radius is LARGER than claimed. At show_n=4 the link-back line dies too (header + 4 rules = 5, everything after is cut). show_n=4 is precisely the value the anti-wall selftest uses at :221. So that selftest green-lights a state in which BOTH derived lines — the warning and the derived link-back, the two things the header comments call the point of the organ — are gone. The claim only noticed the warning.
> 
> CORRECTION 2 — the selftest is worse than "passes anyway"; it is unfalsifiable. :217-225 asserts `worst <= MAX_BLOCK_LINES` where `worst` is the length of a value that was just produced by `.slice(0, MAX_BLOCK_LINES)`. The assertion cannot fail for any input, ever. I ran `node scripts/teaching_contract.mjs selftest`: 18 passed, 0 failed, including "ANTI-WALL LAW — the block is never more than 5 lines, in any reachable state". It is a tautology wearing a law's name.
> 
> WHY NOTE AND NOT YELLOW — the mitigant the scanner missed. I grepped the whole repo for `show_n`: only three hits, all inside teaching_contract.mjs itself (`:67` seed, `:137` read, `:221` selftest fixture). There is NO CLI subcommand to set it (the switch at :244 offers print|list|add|hit|drop|reset-turns|selftest) and no other script writes that file — the header at :40 claims sole-writer status and nothing contradicts it. Reaching show_n >= 3 therefore requires him to hand-edit line 3 of the JSON. It is a latent ordering bug, not something misfiring today.
> 
> Also a small precision fix: today's block is 4 lines, not 5. Live turns.count = 32 against context_warn_at = 40, so the warning has not fired yet. I printed the live block: header + 2 rules + link-back. "Sits exactly on the boundary" is true only of the post-turn-40 state — which he will reach in this same session, since the counter only resets on a new forge session (:125-129).
> 
> NOT starved, NOT unwired, NOT waiting. Unlike the 9-reps organs, this one has real input (5 rules, 6 recorded hits, a live turn clock at 32/40) and a live hook. The code is simply wrong about which line is expendable, and the guard that should have caught it cannot catch anything.
> 
> FIX — the claim's is right in spirit, sharper in detail: build the warning (and the link-back) FIRST, or reserve their slots and let truncation eat a rotating rule, since rules are by design re-injected on later turns and the warning fires once. Then replace the tautological assertion at :217-225 with one that can actually fail — assert the CONTEXT WARNING is present for every show_n in 1..5 when turn >= warnAt, and that the link-back survives whenever sprint progress.done is non-empty. If that means the header or a rule must go to stay within 5 lines, that is the correct trade.

---

## 43. shipped.mjs selects commits by committer date but reports author date

- **kind:** `broken` · **severity:** `note` · **area:** `forge-exam` · **day-one fixable:** yes
- **where:** C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc\\scripts\\shipped.mjs:122-124

**Evidence**

> shipped.mjs:122-124: `const since = day + " 00:00:00"` fed to `git log --since/--until` (which filter on COMMITTER date by default) while the format string is "C%x09%H%x09%aI%x09%s" — %aI is the AUTHOR date. After any rebase, amend or cherry-pick the two diverge.

**Impact**

> Currently inert: parseGitLog stores a per-commit `date` but summarise() surfaces only subjects and counts, so no wrong date reaches shipped.json today. It becomes a live wrong-day report the moment any consumer starts reading the per-commit date.

**Proposed fix**

> Use %cI to match the --since/--until filter, or switch the filter to author date with --date=author. One-token change — pick whichever definition of "shipped today" he wants and state it in the header.

**Verifier's note**

> CONFIRMED as a latent inconsistency, but reclassified from "broken" to "dead-code" — nothing wrong reaches anybody, because the field is computed and then discarded.
> 
> MECHANISM REPRODUCED (git 2.38.0.windows.1). shipped.mjs:122-124 is quoted accurately. Commit 257e1aa in this repo: author date 2026-07-08T19:25:59+05:30, committer date 2026-07-10T14:30:21+05:30. `git log --since="2026-07-08 00:00:00" --until="2026-07-08 23:59:59"` returns only f6f51f2 and 55e383d — NOT 257e1aa. `git log --since="2026-07-10 00:00:00" --until="2026-07-10 23:59:59"` DOES return 257e1aa, printing %aI as 2026-07-08T19:25:59. So a commit selected into the 10th labels itself the 8th. 5 of 219 commits in this repo have divergent author/committer dates; 257e1aa is the one that crosses a day boundary.
> 
> INERTNESS INDEPENDENTLY VERIFIED, not taken on trust. summarise() (shipped.mjs:83-97) returns only {commits, files_touched, insertions, deletions, new_files, subjects} — the per-commit `date` set at line 66 is dropped on the floor. readRepo (line 135) spreads only summarise()'s output plus `unpushed`. Live `node scripts/shipped.mjs show` emits an envelope with no per-commit date anywhere: repos[0] is {repo, ok, commits, files_touched, insertions, deletions, new_files, subjects, unpushed}. `grep -rn "from .*shipped" --include=*.mjs .` returns ZERO hits — parseGitLog is exported but imported by nobody. The only cross-organ consumer, manager.mjs:224-229, reads only totals.commits, totals.new_files, .shipped, and artifact_events[].kind. So the wrong date is unreachable, today and by every current consumer.
> 
> WHY "dead-code" AND NOT "broken": the organism's own distinction. A broken organ produces a wrong output someone reads. This one produces a wrong value that no code path can observe. The defect is a stored-and-discarded field whose definition contradicts its own selection filter — a landmine for whoever next reaches for c.date, not a live fault. Severity "note" stands and is not inflated; it would be inflated at yellow.
> 
> THE PROPOSED FIX IS HALF WRONG — corrected. "%cI to match the filter" is right. "or switch the filter to author date with --date=author" is not a thing: `git log -1 --date=author` returns `fatal: unknown date format author`. `--date=<format>` controls DISPLAY formatting (iso, relative, unix, ...), never which date --since/--until filter on; git's rev-list date filters are hardcoded to committer date and cannot be switched to author date without post-filtering the output yourself. So the menu is not "pick either definition" — it is: change %aI to %cI, or (smaller and more honest, since the field is dead) delete `date` from the parseGitLog object entirely and let the day window be the sole definition of "shipped today". The header comment at shipped.mjs:56-58 documents the format string and would need the same one-token edit.

---

## 44. The night shift stamps poster / wall_insights / gemini_wall with YESTERDAY's date; viz reads TODAY's. Three nightly LLM renders have reached nobody since 26 Jul.

- **kind:** `unwired` · **severity:** `red` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:618,647,666 · C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\brain.mjs:441-446,819,885

**Evidence**

> brain.mjs:819 `const today = shiftDay(job, now, cfg);` and brain.mjs:885 `writeAtomic(join(OUT_DIR, job.out || job.id, today + ".md"), r.text)`. shiftDay (brain.mjs:441-446) returns YESTERDAY for any `window:"overnight"` job run at hour <= 7. All three render jobs are overnight (brain_config.json: `maidan_poster`→out `poster`, `gemini_render`→out `gemini_wall`, `wall_insights`, all `"window":"overnight"`), and the night shift fires 02:40-03:00 IST. viz.mjs reads the CALENDAR date with no lookback: viz.mjs:618 `join(STATE_DIR,"brain_out","poster", today + ".md")`, viz.mjs:647 `..."wall_insights", today + ".md"`, viz.mjs:666 `..."gemini_wall", today + ".md"` where `today = localDate(now)`. On-disk proof: `brain_out/poster/2026-07-31.md` has mtime `Aug 1 02:58`; `wall_out/wall_insights/2026-07-31.md` mtime `Aug 1 02:50`; `gemini_wall/2026-07-31.md` mtime `Aug 1 02:54` — every file one day behind its own write time. The last time a fold succeeded is frozen on disk: `club/poster.svg` and `club/wall_gemini.html` are both mtime `Jul 21 23:38` — i.e. the last night the pre-shiftDay calendar stamp still matched. brain_ledger count since 26 Jul: 9 successful runs, 564,400 tokens (wall_insights 3 / 140,423 · gemini_render 3 / 169,010 · maidan_poster 3 / 254,967).

**Impact**

> Half a million Max-plan tokens a week are spent on the three most visual things the organism makes — the match poster, the Gemini-painted wall, and 'The read' (the ≤3 validated insight lines) — and all three are written to filenames viz can never open. wall.html right now has no poster card and no 'The read' panel at all; the shelf instead prints 'the shelf is empty right now — the night shift stocks it while you sleep', which is false: the night shift stocked it under yesterday's name. This is the single largest waste in the area and it started with the 25 Jul shiftDay fix, so it has been silent for 8 days.

**Proposed fix**

> Give the three reads the same ≤2-day lookback viz already uses for wall_review (viz.mjs:653-656 loops `for (let i=0; i<=2; i++)`), or export `shiftDay` from brain.mjs and have viz resolve the overnight artifact by shift day instead of calendar day. Lookback is the smaller change and keeps the poster-freshness law intact if the accepted file's date is carried into `posterFlag`.

**Verifier's note**

> CONFIRMED, reproduced end to end. brain.mjs:885 writes `join(OUT_DIR, job.out||job.id, today + ".md")` where `today = shiftDay(job, now, cfg)` (brain.mjs:819); shiftDay (brain.mjs:441-446) with cfg.overnight.end="07:30" -> endH=7 returns YESTERDAY for any overnight job run at hour<=7. viz.mjs:577 sets `const today = localDate(now)` and reads calendar-today at :618 (poster), :647 (wall_insights), :666 (gemini_wall) with no lookback — only wall_review gets the i<=2 loop at :653-656. Disk proof I pulled myself: brain_out/gemini_wall/2026-08-01.md mtime 02-08-2026 02:12:23, wall_insights/2026-08-01.md mtime 02-08-2026 02:08:06, poster/2026-07-31.md mtime 01-08-2026 02:58:41 — each one day behind its own write. dressing-room/club/poster.svg and wall_gemini.html both frozen at 21-07-2026 23:38. Live wall.html (written 02-08 02:08:03) carries "media": {"poster": false} and contains no "The read" panel. Window is provably closed: Wall-AM 08:50, Wall-PM 22:00, Wall-Live every 30 min all use localDate, so a file named D is only openable on calendar day D but is written at ~02:10 of D+1 — no clock time agrees. viz.mjs is the ONLY consumer of all three dirs (grep across scripts/). CORRECTIONS: (1) numbers undercounted — ledger since 26 Jul shows 11 successful runs / 674,803 tokens (wall_insights 4/187,526, gemini_render 4/232,310, maidan_poster 3/254,967), not 9/564,400; the scanner missed the 1 Aug night. (2) "silent 8 days" overstates: renders were failing for an unrelated reason 25-28 Jul (is_error:true, 0 tokens), so only 4 nights of successful render (29,30,31 Jul, 1 Aug) were actually thrown away. (3) paths in the offer are wrong: dressing-room/state/brain_out/wall_insights (not wall_out/), dressing-room/club/poster.svg (no repo-root club/). (4) THE PROPOSED FIX IS THE INFERIOR OPTION. The repo already has the correct primitive and it is proven working three feet away: brain.mjs:905 `serveDate(job, now)` returns tomorrow for a >=15:00 compile and today for an after-midnight one (selftests brain.mjs:1071-1073), and brain.mjs:893 already uses it for the mp3 lane — result: club/media/teamtalk_2026-08-02_am.mp3 written Aug 1 22:03 and wall_data says teamtalk_am: true. The mp3 lane folds, the .md lane does not, purely because line 885 hardcodes `today` and brain_config gives the three render jobs serve:null while teamtalk_am has "serve":"next_morning". Correct fix: add "serve":"next_morning" to maidan_poster/gemini_render/wall_insights and change brain.mjs:885 to serveDate(job, now), keeping shiftDay as the ledger key for eligibility/attempt accounting. A viz-side lookback would fight posterFlag (viz.mjs:335, selftest :545 "a stale undated poster.svg no longer counts as today's poster") by serving a two-day-old poster as today's. KIND: unwired is right — not starved; producer succeeds, artifacts exist, consumer exists, they never meet. SEVERITY: red holds — ~675k Max-plan tokens/week into unreadable filenames and the visual half of his one daily surface dark; noting it is cost/visibility, not data integrity, and self-heals the instant either side is aligned.

---

## 45. post_match/ has never existed, so the KAL-line — the emotional spine of every surface — is null everywhere, and the RED-day wall degenerates to one hardcoded sentence.

- **kind:** `unwired` · **severity:** `red` · **area:** `output-surfaces` · **day-one fixable:** no
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:596-616,352-355 · C:\Users\nikhi\GitHub\arsenal-ai-fc\setup\WALLPAPER.ps1:33 · C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\postmatch.mjs (no scheduled task)

**Evidence**

> `ls dressing-room/state/post_match` → 'No such file or directory'. postmatch.mjs is its sole writer and is on NO scheduled task (44 ArsenalFC-* tasks enumerated; none runs postmatch.mjs) — only `npm run postmatch`, the /full-time skill, and dugout's `run_postmatch` voice tool reach it, and none has ever fired. Downstream: viz.mjs:596-601 scans `post_match/<date>.md` for `/KAL-?LINE\s*→\s*(.+)/i` → `kal_line: null` in wall_data.json; viz.mjs:604-616 builds `commitments` from the same directory → `"commitments": []`; renderCommitments (viz.mjs:283) returns "" when empty, so the panel never exists. The RED branch is `body = kal + panel("Today", ...)` (viz.mjs:352-355) — with kal empty that is literally one fixed sentence, 'Rotation day. One five-minute floor-touch is the whole match.', identical on every RED day. WALLPAPER.ps1 falls through to a hardcoded string: `else { $g.DrawString("KAL  >  one green ball, first thing.", ...) }` — and that is exactly what the rendered wallpaper.png says today. voiceBrief (viz.mjs:404) drops its KAL line too.

**Impact**

> Every surface in this area is built around 'his own words, first' — the wall's amber banner, the desktop wallpaper's headline, the Commitments panel, the voice brief, the /matchday script's line 1. All of them are running on a placeholder or absent entirely. The wallpaper he sees before he has decided to look at anything is a generic motivational string, not a commitment he made. And on a RED day the wall he is told to open shows him one canned sentence and nothing else — no date-specific content whatsoever.

**Proposed fix**

> Not a code fix — the organ works (postmatch selftest green, 16 asserts). It needs one real full-time run to create post_match/<date>.md. Until then, make the absence honest rather than papered over: the wallpaper's hardcoded fallback should read as an invitation ('no KAL-line yet — run full-time tonight'), not as if he wrote it.

**Verifier's note**

> CONFIRMED, with one factual correction, one cause correction, and one overstated sub-claim.
> 
> WHAT I REPRODUCED MYSELF
> - `Test-Path dressing-room\state\post_match` -> False. `season.json`, `notebook.json`, `routed_balls.json` all absent too.
> - 46 ArsenalFC-* task rows enumerated via schtasks. None runs postmatch.mjs. `ArsenalFC-Bell-FullTime` runs `node scripts\brain.mjs bell fulltime`, and brain.mjs:706 defines that bell as an ntfy push whose BODY is the instruction: `Dugout se bolo "full time" — ya \`npm run postmatch\``. It is a text message about the ritual, not the ritual.
> - Live `dressing-room/state/wall_data.json`: `date 2026-08-02, verdict GREEN, kal_line: null, commitments: []`, `season {matches_played:0, trophy_state:"unlit"}`.
> - Live `dressing-room/club/wall.html` (written 02:08 today): `grep -c KAL` = **0**; zero "Commitments" occurrences. renderCommitments (viz.mjs:339-341) returns "" on empty, so the panel does not exist.
> - I READ the rendered `dressing-room/club/wallpaper.png`. It says, in amber, in the headline slot: **"KAL  >  one green ball, first thing."** — the hardcoded fallback from WALLPAPER.ps1:31, presented with no marker distinguishing it from a sentence he wrote.
> - viz.mjs:403 gates the voice brief's KAL line on `d.kal_line`, so it drops.
> - `node scripts/postmatch.mjs selftest` -> ALL CHECKS PASSED (19 asserts, not the 16 claimed).
> 
> CORRECTION 1 — "post_match/ has NEVER existed" is false (this also corrects the brief's ground truth). It existed exactly once: `dressing-room/vault_preseason_2026-07-14/state/post_match/2026-07-12.md`, a real Matchday-1 run — "RESULT: MISS — data, not a verdict", a real signal, a real throw-in, and a genuine KAL-LINE in his own voice. It was swept into the preseason vault on 14 Jul and never written again in the live tree (17 Jul freshstart onward). Correct statement: post_match has not existed for 21 days and has never existed in the current tree. This makes the finding STRONGER, not weaker — the organ is proven in production, not merely selftest-green, which pins the kind firmly at unwired rather than broken or starved.
> 
> CORRECTION 2 — the stated cause is wrong and its implied fix is dangerous. The WHERE cites "postmatch.mjs (no scheduled task)" as the defect. Absence of a scheduled task is CORRECT BY DESIGN and must stay. postmatch.mjs:225 defaults `hit` to `"HIT"` and :227 defaults kal to `"one green ball, first thing. That's the whole plan."` when `promptIfTTY` returns null (:179 `if (!process.stdin.isTTY) return null`). A scheduled task would silently fabricate a HIT and a fake commitment every night and increment matches_played. The real gap is that the ONLY automated trigger is a notification that delegates the run back to the human, and that human step has not fired once in this tree's lifetime.
> 
> SHARPEST POINT THE SCANNER MISSED: the wallpaper's fallback and postmatch's own no-answer default are the same sentence. WALLPAPER.ps1:31 prints "one green ball, first thing."; postmatch.mjs:227 writes "one green ball, first thing. That's the whole plan." So even a REAL run where he declines the prompt yields a wallpaper indistinguishable from the never-run state. The proposed fix (make the fallback read as an invitation) is right and must also break this collision.
> 
> OVERSTATED SUB-CLAIM — the RED-day wall. Structurally true at viz.mjs:358-362 (`body = kal + panel("Today", ...)`, one fixed sentence, and with kal empty that is the entire page). But it has never been observed to render: today is GREEN, live wall.html contains no "Rotation day", and NO verdict history exists anywhere in state to count RED days — pitch_read_history.jsonl carries only {date, due_served, wall_minutes, struggle}, 14 rows, no verdict field. Treat that half as a latent hazard, not an observed harm.
> 
> SEVERITY — red stands, but on different legs than the scanner argued. Not the RED branch. It stands on (a) the loop-closing KAL->KICKOFF weld, which the architecture calls its central mechanic, having fired zero times in the live tree while six-plus consumers read null, and (b) a truthfulness violation on the most-seen surface in the system: the desktop wallpaper prints a fabricated commitment in the exact typographic slot reserved for "his own words, first." Nothing is corrupted and no downstream number is wrong (matches_played 0 is honest), and one 30-second interactive `npm run postmatch` clears the data half — but the fallback-that-reads-as-his-voice is a code fix and does not clear itself.
> 
> Line numbers in the claim are stale by ~2-14 (actual: viz.mjs:579-583 KAL scan, 601-614 commitments, 358-362 RED branch, 403 voiceBrief; WALLPAPER.ps1:30-31). Same code, wrong offsets.

---

## 46. season.json has never existed and renderSeason has no awaiting-blood branch — the wall and the desktop print 'matches 0 · cabinet 🔒' as measured fact, breaking viz's own NEVER-FAKE law.

- **kind:** `lying` · **severity:** `red` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:80-84,180-195 · C:\Users\nikhi\GitHub\arsenal-ai-fc\setup\WALLPAPER.ps1:39-43

**Evidence**

> `ls dressing-room/state/season.json` → 'No such file or directory'. viz.mjs:81 `matches_played: season ? safe(season.matches_played, 0) : 0` and `trophy_state: season ? safe(season.trophy_state,"unlit") : "unlit"` — a missing file collapses to the same value as a measured zero. Unlike every other panel, renderSeason (viz.mjs:180-195) has NO `awaiting(...)` branch; it always renders. Rendered wall.html text today: 'Season / 0 / matches played / 0 / doubts retired · 112 rematches waiting / 14% / weekly consistency / 🔒 / the cabinet unlit'. The same numbers are burned onto the desktop by WALLPAPER.ps1:41 → wallpaper.png reads 'matches 0    doubts retired 0    weekly consistency 14%'. viz.mjs's own header states the constitutional law: 'NEVER FAKE DATA — empty states render as honest, handsome "awaiting blood" panels'. Compare renderCalibration (viz.mjs:154) and renderDerby (viz.mjs:174), which DO degrade honestly ('awaiting blood — calibration flows in with your first reps').

**Impact**

> The one panel with no honest-empty state is the one that scores him. Both his wall and his desktop wallpaper assert three zeros and a locked trophy cabinet as if the system had counted and found nothing, when in truth the counter has never been created because postmatch has never run. For an ADHD-PI captain whose whole surface strategy is ambient dopamine, the ambient message is currently 'you have played zero matches'.

**Proposed fix**

> Distinguish absent from zero: pass `season: null` through (don't collapse to 0) and give renderSeason the same awaiting-blood branch every sibling panel has — 'the season ledger opens with your first full-time'. Mirror it in WALLPAPER.ps1 so the desktop stops asserting zeros.

**Verifier's note**

> Code facts reproduce exactly; the "lying" framing does not. VERIFIED: dressing-room/state/season.json and dressing-room/post_match/ are both absent on disk (season.json is in .gitignore, so the empty git log proves nothing — the absence does). Sole writer is scripts/postmatch.mjs:40, which has NO scheduled task (only ArsenalFC-Bell-FullTime, a reminder bell). viz.mjs:89-90 collapses absent→0/"unlit" as quoted, and renderSeason (viz.mjs:180-195) is genuinely the only data panel without an awaiting() branch while renderMaidan:156, renderCalibration:154, renderDerby:210 and renderDrills:240 all have one; it is emitted unconditionally at viz.mjs:368. wall.html renders "0 / matches played" and "🔒 / the cabinet unlit"; ArsenalFC-Wallpaper is live (last run 01-08-2026 22:10, Last Result 0) and I opened wallpaper.png myself — it reads "matches 0    doubts retired 0    weekly consistency 14%". REFUTED: the NEVER-FAKE-DATA breach and the IMPACT. No false number reaches any surface. matches_played counts closed full-times (postmatch.mjs:99 increments only on a HIT/REST close); he has closed zero, so the fallback 0 EQUALS the true value. The "three zeros" are not three fallbacks — tape_room.json exists (23,403 bytes, doubts_retired=0, queue=112) so that zero is genuinely measured, and 14% is genuinely computed from history. trophy_state "unlit" is likewise correct: grep shows nothing in the repo ever assigns "lit", and lighting is milestone-30 gated (postmatch.mjs:259). Exactly one displayed value is fallback-derived and it is accurate, so the wall is not asserting a counted zero where the truth is unknown — the truth IS zero. WHAT SURVIVES: an absent-vs-zero conflation that is a latent silent-failure hazard — if season.json were later written and then deleted or corrupted, the wall would keep showing 0 matches with no signal that the ledger died — plus a real panel-symmetry inconsistency. The proposed fix (pass season:null through, add the awaiting branch, mirror in WALLPAPER.ps1) is the right fix, but it is hardening plus a tone improvement, not the repair of a live falsehood. Kind is starved, not lying: the panel is an accurate view of a ledger that postmatch has never been asked to open. Severity note, not red.

---

## 47. The 'Gemini render' button has no freshness gate and currently links to a 12-day-old artifact — the exact bug the poster fix cured, left uncured one line away.

- **kind:** `lying` · **severity:** `red` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:664,257 (compare the working gate at viz.mjs:270-274,662)

**Evidence**

> viz.mjs:664 `data.media.gemini_render = existsSync(join(CLUB_DIR, "wall_gemini.html"));` — a bare existence check on a FIXED, undated filename nothing ever cleans up. renderMedia (viz.mjs:257) then emits `if (m.gemini_render) lanes += btn("wall_gemini.html", "🎨 the Gemini render", C.dim);` with no date shown. On disk: `dressing-room/club/wall_gemini.html` mtime `Jul 21 23:38` — 12 days stale. wall_data.json today says `"gemini_render": true`, and the rendered wall.html contains the live button '🎨 the Gemini render'. This is the identical pattern the 25 Jul audit fixed for the poster twenty lines earlier: viz.mjs:270-274 `posterFlag()` with the comment 'the old gate was `posterOk || existsSync(club/poster.svg)` … the one thing the wall may never do, present stale media as current' — and viz.mjs:662 (`poster: posterFlag(...)`) now correctly reports `"poster": false`.

**Impact**

> The wall presents a July-21 snapshot of his life as 'the Gemini render' with no date, one click away, on 2 August. Because the poster half of the same fix works, the surface looks honest while the other half quietly lies — the worst combination. Combined with finding #1 this is self-inflicted twice: the fresh render exists (gemini_wall/2026-07-31.md), it just can't be found, so the stale one keeps being offered.

**Proposed fix**

> Apply the poster pattern: on a successful fold also write `wall_gemini_<date>.html` and set the flag from that date-stamped twin, or stamp the fold date into wall_data and print it on the button ('🎨 the Gemini render · 21 Jul'). Never render an undated link to an undated file.

**Verifier's note**

> CONFIRMED in mechanism, with two corrections and a severity downgrade.
> 
> Reproduced myself:
> - scripts/viz.mjs:662 (NOT 664) `data.media.gemini_render = existsSync(join(CLUB_DIR, "wall_gemini.html"));` — a bare existence check on a fixed, undated filename.
> - scripts/viz.mjs:291 (NOT 257) `if (m.gemini_render) lanes += btn("wall_gemini.html", "the Gemini render", C.dim);` — no date rendered on the button.
> - `ls -la`: dressing-room/club/wall_gemini.html mtime `Jul 21 23:38` — 12 days stale on 2 Aug.
> - Repo-wide grep for `wall_gemini` shows only viz.mjs:662 (read), :669 (write) — no unlink anywhere. Nothing ever cleans it up, so the flag is permanently true from the first successful fold onward.
> - wall_data.json (at dressing-room/state/wall_data.json, NOT club/ as the claim stated): `date: 2026-08-02`, media `{"poster":false,"gemini_render":true}`.
> - dressing-room/club/wall.html (Aug 2 02:08) contains exactly one `Gemini render` anchor and ZERO occurrences of `poster.svg`. The asymmetry is real and live: the poster gate suppresses stale media, the gemini gate serves it.
> - posterFlag() at viz.mjs:335 with three selftests at viz.mjs:545-547; no equivalent gate or selftest exists for gemini_render.
> 
> CORRECTION 1 — line numbers: 662 and 291, not 664 and 257. The working comparison gate is posterFlag at 335 (definition) and 632 (call site), not 270-274/662.
> 
> CORRECTION 2 — the material one the scanner missed: the destination page is NOT undated. `head` of wall_gemini.html line 5 reads `<title>The Wall — 2026-07-21</title>` and the header sub renders `2026-07-21`. The staleness is plainly visible the moment the page opens, in its own title bar and header. So the lie lives entirely on the button and self-corrects one click later. The claim's "presents a July-21 snapshot with no date, one click away" is only half true — the button is undated, the artifact is not.
> 
> ADDITIONAL real defect found while verifying: line 662 sets the flag BEFORE line 669 writes the fold. So even on a day a fresh render IS folded, the flag reflects the pre-fold state — it is a one-render-lagged existence check with no relationship to today's fold whatsoever.
> 
> SEVERITY DOWNGRADE red -> yellow. Not starved, not merely waiting — it is genuinely mis-gated code that runs every 30 min and currently serves a 12-day-old file. But the poster case that earned red was materially worse: it was captioned literally "today's poster", rendered as an inline <img> preview at card weight 2, with no date visible anywhere on the artifact. This is a dim grey (C.dim) secondary pill among four lanes, labelled neutrally "the Gemini render" (not "today's"), leading to a page that states its own date in the header. Nothing downstream consumes gemini_render — no verdict, no number, no scheduling. The harm is trust erosion on a decorative lane for a solo user, not a wrong decision. Yellow.
> 
> PROPOSED FIX is correct in shape. Cheapest faithful version: on a successful fold at viz.mjs:669 also writeAtomic `wall_gemini_${today}.html`, then set the flag from a `geminiFlag(foldedToday, exists, CLUB_DIR, today)` helper mirroring posterFlag at :335 — and move that assignment BELOW the fold block so it can see today's write. Add a selftest alongside :545-547. Alternatively (simpler, and arguably better since the artifact self-dates): keep the bare existsSync but stamp the fold date into wall_data and print it on the button — "the Gemini render · 21 Jul" — which makes the button honest without a second file to clean up.

---

## 48. 'weekly consistency' counts any struggle verdict that isn't no_data — so a spinning day scores and a 60-minute day doesn't. It reads 14% for a week with 225 wall-minutes across 5 days.

- **kind:** `lying` · **severity:** `yellow` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:72-74 (rendered at :180-195, :308, :405)

**Evidence**

> viz.mjs:72-74: `const days = (history||[]).slice(-7); const weekly_consistency_pct = days.length ? Math.round(100 * days.filter(d => d.struggle && d.struggle !== "no_data").length / days.length) : null;` — the comment one line above claims 'won-days / days-elapsed'. The actual source of `struggle` is pitch_read, which returns no_data below a rep threshold: pitch_read.json today has `"struggle": {"verdict":"no_data","basis":"0 reps today (< 6)"}`. pitch_read_history.jsonl's last 7 rows: 07-25 (15 min, no_data), 07-26 (60 min, no_data), 07-29 (45 min, no_data), 07-30 (15 min, no_data), 07-31 (75 min, **spinning**), 08-01 (15 min, no_data), 08-02 (0 min, no_data) → 1/7 = 14%. So the only day that COUNTED toward 'consistency' is the day the organism labelled him as spinning in circles, and the 60- and 75-minute days that logged <6 reps counted as nothing.

**Impact**

> Given 9 reps in the system's entire life, `struggle` is structurally no_data almost every day, so this metric is pinned near zero regardless of how much he actually works — and it inverts, rewarding a bad day and discarding good ones. It is printed on the wall, burned into the desktop wallpaper, folded into the NotebookLM film kit ('Weekly consistency: 14%') and spoken in the voice brief. It is the only percentage on any surface, and it is wrong in both directions.

**Proposed fix**

> Either compute consistency from something that actually exists at 9-rep volume (days with wall_minutes > 0 — that would read 6/7 today), or gate it: when ≥5 of the last 7 days are no_data, render '—' with the awaiting-blood wording instead of a number. Do not count 'spinning' as a won day under any definition.

**Verifier's note**

> CONFIRMED by independent reproduction. viz.mjs:71-74 comment claims "won-days / days-elapsed"; the code computes days.filter(d => d.struggle && d.struggle !== "no_data").length / days.length. I re-ran that exact expression over pitch_read_history.jsonl and got 14; wall_data.json holds "weekly_consistency_pct":14 beside "wall_week_minutes":225. Last 7 rows verified verbatim: 07-25:15m:no_data | 07-26:60m:no_data | 07-29:45m:no_data | 07-30:15m:no_data | 07-31:75m:spinning | 08-01:15m:no_data | 08-02:0m:no_data. struggle is written to history as a bare verdict string (touchline.mjs:435), so the string compare behaves exactly as it reads — no type accident. no_data fires below 6 reps/day (touchline.mjs:186; pitch_read.json basis "0 reps today (< 6)"). Reach confirmed on disk, not inferred: wall.html contains "14%<" under "weekly consistency"; WALLPAPER.ps1:40 paints it; viz.mjs:308 (film kit) and :405 (voice brief) speak it; filmkit_2026-08-01.md:8 reads "Weekly consistency: 14%".
> 
> TWO CORRECTIONS TO THE CLAIM.
> 
> (1) Its most rhetorical argument — "it inverts, rewarding a bad day" — is backwards, and the proposed fix "do not count spinning as a won day under any definition" would make the metric MORE wrong. ORGANISM_ANATOMY.md:199-200 defines the won-day law as "floor-attempt or conscious-rest", and :87 mandates "no streak-shaming (weekly consistency only)". In this club consistency means SHOWED UP, not WON. Counting a spinning day is doctrinally right; misses are data. The actual defect is the >=6-rep gate discarding the 60- and 75-minute days, not the inclusion of spinning. Keep spinning; fix the signal.
> 
> (2) The scanner missed a second defect in the same two lines: slice(-7) takes the last 7 RECORDED ROWS, not 7 calendar days. Those 7 rows span 9 calendar days — 07-24, 07-27 and 07-28 have no row at all. A day the organism never ran silently vanishes from the denominator and inflates the percentage. So the comment's "days-elapsed" is wrong on the denominator independently of the numerator.
> 
> WORSE THAN STATED: filmkit_2026-07-17.md through filmkit_2026-07-31.md all read "Weekly consistency: 0%". Re-running the window as of 30 Jul yields 0% over a window holding 135 wall-minutes across 4 worked days — the wall told him zero on a week he showed up four times.
> 
> NOT MERELY STARVED: it is starved (9 lifetime reps against a >=6-reps-per-day gate), but the coupling stays wrong at healthy volume too — a genuine 5-rep day still scores zero, and the denominator bug is volume-independent. The right signal already exists at 9-rep volume: wall_minutes > 0 is 6/7 today (86%), which is precisely the doctrine's floor-attempt test. So the claim's FIRST proposed fix (compute from wall_minutes > 0) is correct and should be preferred; the awaiting-blood gate is a fallback that becomes unnecessary once the signal is right.
> 
> SEVERITY: yellow is correct, not inflated and not understated. No organ consumes this number for a decision, so nothing downstream is corrupted — but it is the only percentage on any surface, it is burned into wallpaper, wall.html, the film kit and the spoken brief, and printing 0-14% at an ADHD-PI user during weeks he actually worked is the exact shame-by-numbers failure ORGANISM_ANATOMY.md:87 forbids. Not red: cosmetic-to-motivational, reversible, single-file fix at viz.mjs:71-74.

---

## 49. The Boot Room's entire weekly output is a console line into a cmd window that closes — no log, no state file, no ledger row. Nobody can tell whether it ran.

- **kind:** `unwired` · **severity:** `yellow` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\bootroom.mjs:245-268 · scheduled task \ArsenalFC-BootRoom (no log redirect) · C:\Users\nikhi\GitHub\arsenal-ai-fc\.claude\skills\genome\SKILL.md:7

**Evidence**

> Scheduled task \ArsenalFC-BootRoom = `cmd /c cd /d C:\Users\nikhi\GitHub\arsenal-ai-fc && node scripts\bootroom.mjs`, weekly Sun 20:00, last run 26-07-2026 20:10:48, Last Result 0. Unlike ArsenalFC-Calibration / FSRS / Nemesis / LearningState / Goalkeeper / TimeAuditor, there is NO `>> …\scripts\bootroom.log 2>&1` redirect. With 9 reps and `speak_gates.bootroom_mutation: false` in loop_vitals.json (physio.mjs:375 `world.reps.length >= cfg.gates.bootroom_min_reps`, threshold 200 per physio.mjs:603), main() takes bootroom.mjs:259-264 → proposeFromEvidence returns `{proposal:null, reason:"speak-gate closed (volume) — no proposal, honestly"}` and the only effect is `console.log`. bootroom writes nothing: `dressing-room/state/mutations.jsonl` does not exist, `SEASON_CHANGELOG.md` does not exist. The /genome skill's step 1 is 'Read dressing-room/state/mutations.jsonl' — a file that has never existed.

**Impact**

> The organ is correctly starved (200-rep gate, 9 reps — that part is honest and working), but its honesty is broadcast into the void. No surface, log, or state file records that the Boot Room woke up on Sunday and had nothing to say, so 'did the genome run?' is unanswerable, and /organism-doctor's schedule check reads Last Result 0 and calls it green. Every other gated organ leaves a status envelope; this one leaves nothing.

**Proposed fix**

> Two lines: add `>> scripts\bootroom.log 2>&1` to the task like every sibling, and have bootroom write a `bootroom.json` status envelope ({date, status:'gated', reps, gate_threshold, reason}) so the doctor, the sheet and /genome can read 'the genome is quiet, 9/200 reps' instead of guessing.

**Verifier's note**

> The observable is reproducible but the diagnosis, the outlier framing, the impact and the fix are all wrong.
> 
> REPRODUCED: I ran `node scripts\bootroom.mjs` (today is Sunday, so the propose branch at bootroom.mjs:259 fires). Output: exactly one line, `bootroom: speak-gate closed (volume) - no proposal, honestly`, exit 0, and a before/after Compare-Object over dressing-room\state showed 0 differences - zero writes. mutations.jsonl = False, SEASON_CHANGELOG.md = False, scripts\bootroom.log = False. Gate confirmed: loop_vitals.json speak_gates.bootroom_mutation = false; threshold physio_config.json:17 "bootroom_min_reps": 200. Task confirmed: `cmd /c cd /d C:\Users\nikhi\GitHub\arsenal-ai-fc && node scripts\bootroom.mjs`, Weekly SUN 20:00, Last Run 26-07-2026 20:10:48, Last Result 0, no redirect.
> 
> REFUTED #1 - the outlier framing is false. setup\INSTALL_TASKS.ps1:13-19 defines `function Mk($name,$args_,$sched) { $tr = "cmd /c cd /d $repo && node scripts\$args_" }` - NO redirect for ANY of the 17 organism-era tasks it installs. Enumerating every ArsenalFC-* task, ~36 have no redirect (Mirror, Physio-AM/PM, Twin, Heartbeat, Wall-AM/Live/PM, Throwin, Touchline, BrainTick, Scorer, SetPiece, Doubtminer, Scout, Cortex, Thalamus, Distiller, DMN, Examiner, Tone, Turnstile, Presence, NightShift, SelfKnowledge, Consolidate, HippoIndex, HippoStore, SprintSync, Context, ConceptGraph, Bell-FullTime, Wallpaper) and only ~10 do. INSTALL_TASKS.ps1:6-9 states the redirected ones are pre-organism squad tasks deliberately "left UNTOUCHED". BootRoom follows the majority convention. This is a cohort-wide logging-hygiene observation misattributed to one organ as if it were singled out.
> 
> REFUTED #2 - "every other gated organ leaves a status envelope; this one leaves nothing" is false. The Boot Room's gate state IS in a state file: physio.mjs:375 writes `bootroom_mutation: world.reps.length >= cfg.gates.bootroom_min_reps` into loop_vitals.json, twice daily (Physio-AM 07:30 / Physio-PM 21:50). The proposed bootroom.json envelope ({date,status:'gated',reps,gate_threshold,reason}) would duplicate data already sitting in loop_vitals.json plus physio_config.json:17. The fix as written is largely redundant.
> 
> REFUTED #3 - "nobody can tell whether it ran" is overstated. schtasks records Last Run Time and Last Result; `cmd /c` propagates node's exit code, so a crash surfaces as non-zero; and organism-doctor/SKILL.md:25-28 explicitly runs the schtasks query and reports "any task whose Last Result is non-zero". The doctor reading green is CORRECT, not a false green - the run genuinely succeeded and had nothing to say. What is lost is WHAT it said, not THAT it ran.
> 
> REFUTED #4 - the /genome skill claim. genome/SKILL.md:9 reads `None? Say "no proposal filed - the genome is quiet" and stop.` A missing mutations.jsonl reads as zero proposals and the skill exits gracefully. Working as designed, not a dangling reference.
> 
> NOT UNWIRED. The output circuit is complete and has a live consumer: mutations.jsonl -> physio.mjs:490 (`for (const m of readLines(join(STATE_DIR,"mutations.jsonl"))) if (m && m.id) last[m.id] = m`) -> physio.mjs:247-250 raises the `genome_pending` bleed ("the boot room filed a proposal - /genome for your word when ready"). Nothing is disconnected; the wire simply has nothing to carry at 9/200 reps. Kind = starved (arguably waiting).
> 
> WHAT ACTUALLY SURVIVES (and it is thin): two branches emit information that exists nowhere but the vanished console - bootroom.mjs:151 ("no axis shows >=5 late-checkpoint lapses - nothing to propose", the gate-OPEN-but-no-evidence case) and bootroom.mjs:310-314's `extended` action, which deliberately skips the changelog append (line 313 `if (res.action !== "extended")`) and reports only to stdout. Both are unreachable today. At the current gate-closed state the discarded line is 100% derivable from loop_vitals.json, so its information loss is zero.
> 
> SEVERITY: note, not yellow. For a solo user on a sleeping laptop, with the organ correctly gated at 200 reps and its gate status already legible in loop_vitals.json and its run attested by Last Result, this is observability hygiene shared with 35 sibling tasks - not a Boot Room defect. If anything is worth filing it is the cohort-level item ("Mk in INSTALL_TASKS.ps1 installs 17 tasks with no log redirect"), not this organ.

---

## 50. groundsman.mjs is genuinely dead code — zero callers, zero tasks, zero skills. Only a selftest keeps it green.

- **kind:** `dead-code` · **severity:** `yellow` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\groundsman.mjs · C:\Users\nikhi\GitHub\arsenal-ai-fc\package.json:17,43

**Evidence**

> `grep -rn groundsman scripts/ package.json .github` returns exactly two non-self hits, both npm selftest strings: package.json:17 (inside organism:selftest) and package.json:43 (`"groundsman:selftest"`). No import, no execFile, no schtasks entry among the 44 ArsenalFC-* tasks, no reference in any .claude/skills/*/SKILL.md. Its own header (groundsman.mjs:26-28) documents modes `heartbeat` / `night --host <id>` / `status` — the Kennel loop — and CYBORG_BRAIN.md:203 lists it as 'M9 — THE KENNEL', an unbuilt milestone. `bus_lease.json` does not exist in dressing-room/state/. groundsman selftest passes 100%, including 'ONE OFF-LIST PATH IN THE INDEX ABORTS THE PUSH'.

**Impact**

> 18KB of carefully-built, fully-selftested git-push-safety machinery guarding a Pi that does not exist. Not harmful — but it is counted as 'BUILT' in ORGANISM_ANATOMY.md:383 and ORGANISM_LEDGER.md:211, which inflates the organism's apparent surface area and costs a selftest slot in every CI run.

**Proposed fix**

> No code change needed — just stop calling it BUILT. Mark it DORMANT/M9-pending in ORGANISM_ANATOMY.md and ORGANISM_LEDGER.md so the ledger stops claiming a wired organ. Leave the selftest in CI; it costs nothing and protects the eventual wiring.

**Verifier's note**

> CONFIRMED IN SUBSTANCE, WRONG IN KIND, SEVERITY INFLATED, TWO EVIDENCE ITEMS UNREPRODUCIBLE.
> 
> Reproduced myself:
> - Zero callers: grep for "from '...groundsman'" / "require(...groundsman" across scripts/ returns nothing.
> - Zero tasks: PowerShell `schtasks /query /fo csv | Select-String Arsenal` returns 46 rows (44 unique, TimeAuditor-Pulse duplicated x3). No ArsenalFC-Groundsman, no Kennel task.
> - Zero skills: `grep -rli groundsman .claude/` is empty.
> - No state: dressing-room/state/bus_lease.json does not exist; .gitignore:186-188 ignores it on purpose ("the kennel lease (M9) - LOCAL until the Pi arrives").
> - `node scripts/groundsman.mjs selftest` -> ALL CHECKS PASSED, exit 0, and bus_lease.json is STILL absent afterward (the selftest is fully dependency-injected via {read,write,sh,now} - it touches no disk). `status` prints "groundsman: no lease yet (vacant - the laptop is the primary)".
> 
> CORRECTION 1 - the offered grep evidence is wrong. Not "exactly two non-self hits"; there are seven: package.json:17,43 - setup/INSTALL_CYBORG_TASKS.ps1:95 - CYBORG_BRAIN.md:183,203 - ORGANISM_ANATOMY.md:383 - ORGANISM_LEDGER.md:211 - dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md:381 (which already flagged this same thing on 31 Jul). None are callers, so the conclusion survives, but the evidence as written does not reproduce.
> 
> CORRECTION 2 - "costs a selftest slot in every CI run" is FALSE. The repo has exactly one workflow, .github/workflows/awayday.yml, whose only steps are `npm ci` and `node scripts/awayday.mjs run`. organism:selftest is never invoked by CI - it is a manual npm script. That stated cost does not exist.
> 
> CORRECTION 3 - KIND is wrong: this is WAITING code, not dead code, and the actual defect is a doc lie. groundsman.mjs:18-25 documents its own dormancy in-source ("TRANSPORT: today bus_lease.json is LOCAL (gitignored). The day the Kennel physically arrives: (1) remove it from .gitignore... (2) schedule `heartbeat`... (3) raise the TTL") plus a "SMOKE-TEST FIRST (unrun = hypothesis)" gate. INSTALL_CYBORG_TASKS.ps1:95 prints "The Kennel's heartbeat task is NOT installed yet - it ships when the Pi arrives". CYBORG_BRAIN.md:203 lists M9 as unbuilt. Code that documents its own dormancy in three places with an activation checklist is deferred work, not rot.
> 
> The real, actionable defect is the ledger - and it is WORSE than claimed. ORGANISM_ANATOMY.md:383 and ORGANISM_LEDGER.md:211 both describe Groundsman as "Keeps the field clear, manages ephemeral data cleanup". That is not what the file does at all. groundsman.mjs is a two-node bus-lease arbiter (leaseState / tryTakeLease / mayTick) plus a publish-allowlist git-push gate (isPublishablePath, nightPass, "ONE OFF-LIST PATH IN THE INDEX ABORTS THE PUSH"). It cleans up nothing. So both canonical status surfaces assert a wrong STATUS (BUILT) and a wrong FUNCTION. That is the lie worth fixing.
> 
> SEVERITY -> note, not yellow. Zero runtime effect and zero cost for a solo user on a sleeping laptop: nothing schedules it, nothing imports it, no CI runs it, its selftest writes nothing, its state file is gitignored by design. Total consequence = two markdown table rows misdescribe one organ.
> 
> FIX (amended): doc-only, as proposed - but correct the DESCRIPTION too, not just the BUILT flag. ORGANISM_ANATOMY.md:383 and ORGANISM_LEDGER.md:211 should read something like "Two-node bus-lease arbiter + publish-allowlist git-push gate (the Kennel's night-shift)" with status DORMANT / M9-pending. Leave the code and its selftest exactly as they are.

---

## 51. The Wind Tunnel writes a nightly gate recommendation that no organ reads and no surface shows.

- **kind:** `unwired` · **severity:** `yellow` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\brain_out\nightshift\gate_tune_*.md (sole writer scripts\nightshift.mjs; no reader in repo)

**Evidence**

> nightshift produces `brain_out/nightshift/gate_tune_<date>.md` every night (files for 07-20, 07-21, 07-26, 07-31, 08-01) and `wind_tunnel_<date>.json`. `grep -rn "gate_tune|wind_tunnel" scripts/ .claude/skills` returns hits ONLY inside nightshift.mjs itself — no reader anywhere. The content is actionable: gate_tune_2026-07-26.md carries `PROPOSED: {"tau0":0.2,"tau1_base":0.36,"epsilon":0.04,"budget_k":0.35}` / `REVERT: {"tau0":0.25,...}` / 'Apply → watch 14 days → keep only if wakes/day sits in [1, 8]' — and it reports 'current tiers: 0.11 wakes/day', i.e. an order of magnitude below its own healthy band. The two most recent files (07-31, 08-01) are 113 bytes and say only 'GATE HEALTHY … current score 56, best grid 54'.

**Impact**

> The organism replays thousands of real gate decisions every night, forms an opinion about its own attention threshold, files it, and nobody — not the wall, not the sheet, not ntfy, not /organism-doctor — ever surfaces it. Note the ground truth: 2 tier-2 wakes across 5,244 moments. The one artifact that would have flagged that is written and left in a folder he has no reason to open.

**Proposed fix**

> One line in viz's bus: read the newest gate_tune_*.md (≤3-day lookback) and render it as a panel only when it is a PROPOSAL, not when it says GATE HEALTHY. It is already report-only by design ('thalamus_config.json is YOURS'), so surfacing it changes nothing automatically.

**Verifier's note**

> CONFIRMED as unwired, but the severity is inflated and two of the three load-bearing evidence claims are wrong.
> 
> WHAT I REPRODUCED (all of it myself):
> 1. Sole writer confirmed. `scripts/nightshift.mjs:711-720` is the only place `gate_tune_*.md` / `wind_tunnel_*.json` are written. A case-insensitive grep of the entire repo for `gate_tune|wind_tunnel|windTunnel` (excluding node_modules, vaults, .git) returns exactly: `scripts/nightshift.mjs` (writer), `scripts/dugout.mjs` (see #4), `ARSENAL_FC_FULL_REPO_BUNDLE.md`, one 18-Jul dugout transcript, and the state files themselves. `scripts/viz.mjs` reads only `brain_out/poster|wall_insights|wall_review|gemini_wall` (viz.mjs:618,647,655,666) — never nightshift. `.claude/skills/organism-doctor/SKILL.md` never mentions it. No reader. TRUE.
> 2. File content verbatim-confirmed. `gate_tune_2026-07-26.md` carries `PROPOSED: {"tau0":0.2,"tau1_base":0.36,"epsilon":0.04,"budget_k":0.35}` / `REVERT: {"tau0":0.25,...}` and "current tiers: 0.11 wakes/day". `gate_tune_2026-07-31.md` and `_2026-08-01.md` are 113 bytes of "GATE HEALTHY". TRUE.
> 3. I re-ran the tunnel read-only against the live ledger (imported `windTunnel`/`replayGate`/`tunnelScore` from nightshift.mjs into a scratch script; no writes): 5,280 rows, base replay `{wakes:6, capped:0, refractory:0, adjudications:2, days:14, wakes_per_day:0.43}`, base score 59, best grid 57, verdict HEALTHY. `TUNNEL.band = [1,8]` (nightshift.mjs:312). So today's artifact is genuinely a no-op notice.
> 
> WHERE THE SCANNER IS WRONG:
> A. "every night" is false. Seven files exist (07-18,19,20,21,26,31, 08-01) over the last 15 days. `\ArsenalFC-NightShift` is Daily, Last Run 01-08-2026 02:40, Last Result 0 — the gaps are a sleeping laptop, not a bug.
> B. "no surface shows" is overstated. `scripts/dugout.mjs:1101` emits `nightshift: shift ? shift.jobs : null` inside `get_club_report`, and `shift_2026-08-01.json` contains `"gate_tune": {"healthy": true, "engine": "wind_tunnel"}`. So the boolean STATUS does reach one surface (the Gaffer's boardroom briefing). What reaches nobody is the recommendation CONTENT — the proposed tiers, the revert, the wakes/day number.
> C. The IMPACT claim is backwards. "The one artifact that would have flagged that [2 tier-2 wakes] is written and left in a folder" — no. On the last two nights the artifact does not flag it; it says GATE HEALTHY. Hysteresis (`best.score >= baseScore*0.9 - 0.5` → 57 >= 52.6) suppresses the proposal, and the label "HEALTHY" is printed while the replay's own wakes/day (0.43) sits 2.3x below its own band floor of 1. The scanner's proposed fix — render the panel "only when it is a PROPOSAL, not when it says GATE HEALTHY" — would therefore display nothing today and nothing on the two most recent nights. The fix as written renders the finding inert exactly when the gate is starving.
> D. The fix's channel is also wrong-ish. The proposal is deliberately built in the Boot Room's mutation grammar (nightshift.mjs:880 asserts "the proposal rides the boot room's grammar (all 8 fields)"), and `/genome` already has the present/approve/revert UX — but it reads `dressing-room/state/mutations.jsonl`, which does not exist on disk, and `bootroom.mjs` `validateMutation` requires `resolvePath(profile, m.target)` to resolve inside `forge_profile.json`. The wind tunnel's target is `"thalamus_config.json → tiers"`, so filing it into mutations.jsonl would be REJECTED by approve. Any wiring must be presentation-only with a manual thalamus_config edit, exactly as `human_note` says ("the gate NEVER retunes itself").
> 
> SEVERITY: downgraded yellow → note. Nothing is broken; this is a report-only human-facing artifact whose delivery address was never wired. It has produced 5 actionable files in its life, and the currently-live one is a no-op. The genuinely interesting defect adjacent to this claim — the tunnel printing "GATE HEALTHY" for a gate running at 0.43 wakes/day against its own [1,8] band, because hysteresis compares against a grid that cannot do better — is a separate, arguably lying-class finding and is NOT what was claimed here.

---

## 52. The wall's one-click lanes fire-and-forget an async clipboard write — a rejected write opens NotebookLM/Gemini with an empty clipboard and says nothing.

- **kind:** `broken` · **severity:** `yellow` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:250

**Evidence**

> viz.mjs:250 injects into wall.html: `function ship(t,u){try{navigator.clipboard.writeText(t)}catch(e){};window.open(u,'_blank')}`. `writeText` returns a Promise; the synchronous try/catch cannot catch its rejection, and `window.open` runs unconditionally on the next statement regardless of outcome. The buttons are labelled with an explicit promise to the user (rendered in wall.html today): '🎬 season film — opens NotebookLM, source already copied: paste → Video Overview' and '📽 poster/film prompt — opens Gemini, prompt copied: paste → send'.

**Impact**

> wall.html is opened from `file://`. If the clipboard write is denied or the document loses focus during `window.open`, the tab opens, he hits Ctrl+V into NotebookLM, and gets whatever was on his clipboard before — with the wall having just told him in writing that the source was already copied. Silent failure on the only two action buttons on the whole surface.

**Proposed fix**

> Sequence and report: `navigator.clipboard.writeText(t).then(()=>window.open(u,'_blank')).catch(()=>{ /* fall back to a textarea+execCommand copy, or show 'copy failed — the raw kit link is below' */ })`. Never open the destination before the copy has resolved.

**Verifier's note**

> CONFIRMED by direct reproduction, with two corrections (location, severity) and one correction to the fix.
> 
> LOCATION: scripts/viz.mjs:287, not :250. Rendered verbatim into today's dressing-room/club/wall.html (line 37): `function ship(t,u){try{navigator.clipboard.writeText(t)}catch(e){};window.open(u,'_blank')}`, alongside both promised labels ("season film - opens NotebookLM, source already copied" / "poster/film prompt - opens Gemini, prompt copied").
> 
> REPRODUCED (real file:// origin in a browser, not reasoning):
> - isSecureContext=true, navigator.clipboard.writeText="function" -> the API is present, so this is not a dead-API case.
> - Invoked the SHIPPED ship() with window.open stubbed: {"sync_try_catch_fired": false, "window_open_ran_anyway": "about:blank"}. The synchronous try/catch provably does not fire on the async failure, and the destination opens unconditionally.
> - The rejection is literally `NotAllowedError: Failed to execute 'writeText' on 'Clipboard': Document is not focused.` - precisely the focus-steal mechanism the claim predicts.
> - read_console_messages -> "No console logs." The failure is completely silent.
> 
> WHERE THE CLAIM OVERREACHES: I could only force the rejection in an unfocused automation context. Under a real focused user click, transient activation normally lets the write land before window.open defocuses the document. This is a genuine race, not the everyday path, and the scanner presents it as if the buttons routinely fail.
> 
> SEVERITY yellow -> note: (a) failure is immediately visible at paste time (he gets obviously-wrong clipboard content), not silent corruption; (b) two clipboard-free fallbacks already sit in reach - the "raw kit" link rendered in the SAME panel (viz.mjs:292) and the Drive copy written every render (viz.mjs:645), which I verified exists: G:\My Drive\arsenal\filmkit_2026-08-02.md (707 bytes) - NotebookLM ingests that file directly with no clipboard at all; (c) judged against real usage this lane advertises a season with matches_played: 0 and doubts_retired: 0, with zero evidence the buttons are used.
> 
> THE PROPOSED FIX IS WRONG AND WOULD REGRESS IT: gating window.open behind .then() moves the open out of the user-gesture window and invites the popup blocker - trading a rare silent copy failure for a reliable "nothing opened at all". Correct fix: keep window.open synchronous inside the click handler (preserving activation), attach .catch() to the write, and surface the failure (flip the button label / point at the raw-kit link already in the panel). Additionally, the sync catch(e){} still silently swallows the TypeError when navigator.clipboard is undefined on any non-secure origin - same invisible outcome, different cause.
> 
> Not covered by any test: viz.mjs:534 asserts only that the filmkit link string is present, nothing about ship()'s behaviour.

---

## 53. The brain panel's 'overnight' bucket structurally cannot contain last night — it only ever counts today's own 00:00-08:00 and 22:00-24:00.

- **kind:** `broken` · **severity:** `note` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:85-87,213

**Evidence**

> viz.mjs:86-87: `const todayCalls = (brainLedger||[]).filter(l => tsLocalDay(l.ts) === today); const overnight = todayCalls.filter(l => { const h = new Date(l.ts).getHours(); return h >= 22 || h < 8; });` — the overnight filter is applied AFTER the same-local-day filter, so a call made at 23:00 last night is excluded from today entirely. The panel is titled 'The brain — got sharper while you slept' (viz.mjs:213). Right now wall.html reads '0 call(s) today · 0 overnight' and '0 tokens metabolized' — the wall was rendered 01:47 IST and the only Aug-2 ledger row (season_review, 42,208 tokens) landed at 01:54 IST, seven minutes later.

**Impact**

> On the 08:50 morning wall — the one he is actually told to open — the panel that exists to show him the machine worked while he slept can only ever report the sliver of overnight between midnight and 08:50, and never the 22:00-23:59 half of the shift that the config itself defines as overnight. Combined with the 3x-daily render schedule, the morning wall systematically undercounts the night's work.

**Proposed fix**

> Bucket the brain panel by the same shift day the brain writes with (brain.mjs:441 shiftDay) rather than by calendar day, so a night's work stays whole across midnight — the exact reasoning already written into the shiftDay comment block.

**Verifier's note**

> CONFIRMED as broken, but the scanner got the line numbers, one evidence quote, and the fix mechanism wrong.
> 
> THE CORE CLAIM REPRODUCES. Real location is viz.mjs:81-82 (not 85-87), consumed at :103, rendered at :226-228 (not 213):
>   81  const todayCalls = (brainLedger || []).filter(l => tsLocalDay(l.ts) === today);
>   82  const overnight = todayCalls.filter(l => { const h = new Date(l.ts).getHours(); return h >= 22 || h < 8; });
> The h>=22 clause is unreachable for last night because todayCalls already dropped every row whose local day is yesterday. Structurally correct.
> 
> IT IS BROKEN, NOT STARVED — the excluded band is the busiest band. Local-hour histogram over all 2,833 ledger rows: hour 22 = 674, hour 23 = 313. 987 rows (35% of the entire ledger) sit in 22:00-23:59, and hour 22 alone is the single largest hour in the file. This organ is not waiting for volume; the volume is there and lands precisely in the half-window the code cannot see.
> 
> IT CONTRADICTS THE SYSTEM'S OWN DEFINITION. brain_config.json defines "overnight": {"start":"22:00","end":"07:30"}, and 16 of 23 jobs run in that window (deep_twin, season_review, teamtalk_am, day_cartridge...). brain.mjs:438-446 already encodes the right idea — shiftDay() keys an overnight job to "the evening it STARTED" — so brain.mjs treats the night as one unit and viz.mjs does not.
> 
> MEASURED MAGNITUDE at the 08:50 render (ArsenalFC-Wall-AM, Start Time 08:50:00, Daily), replaying the real ledger. Format: morning-visible vs true 22:00→07:30 shift:
>   2026-07-26: 221 vs 478  (54% undercount — the biggest night in the file)
>   2026-07-23:   1 vs 359
>   2026-08-01:  16 vs  21
>   2026-08-02:   8 vs  14
> So on the wall he is actually told to open, the panel titled "The brain — got sharper while you slept" understated the largest night's work by more than half.
> 
> IT LEAKS PAST THE DISPLAY. wall_data.json is an input to two overnight LLM jobs — wall_insights (inputs: ["wall_data.json"]) and wall_review — so the undercounted brain.overnight_calls reaches generated prose he reads, not just a number on a page.
> 
> WHY IT SURVIVED THE SUITE. Every overnight fixture in viz.mjs selftest is post-midnight only: :464 uses 02:10 and 13:30 local, :484 uses 03:00 local. No fixture ever contains a 22:00-23:59 row from the previous evening, so the two passing assertions ("brain meter shows overnight sharpening", "brain ledger buckets by LOCAL day") both exercise only the half of the window the code handles. Both still pass; neither can catch this.
> 
> EVIDENCE I REFUTE. The scanner's "wall.html reads 0 call(s) today · 0 overnight and 0 tokens metabolized" is stale and now false. Live wall.html:43-44 reads "4 call(s) today · 4 overnight" / "1,79,597 tokens metabolized", and wall_data.json shows generated_at 2026-08-01T20:38:03.423Z with brain {calls_today:4, overnight_calls:4, tokens_today:179597}. The 01:47-render / 01:54-ledger-row anecdote is gone; the structural defect stands without it.
> 
> FIX IS DIRECTIONALLY RIGHT, MECHANICALLY WRONG. shiftDay(job, now, cfg) is not a drop-in row-bucketer — it maps a *clock time* to a shift day and requires a job object with .window (brain.mjs:443 returns localDate(now) for anything not window==="overnight"), and viz.mjs has no job handle for a ledger row. The correct minimal fix is to compute the overnight bucket directly from cfg.overnight as a window spanning midnight — [yesterday 22:00, today 07:30) — independent of the calendar-day filter that produces todayCalls. calls_today and tokens_today should stay calendar-keyed; they are honestly labelled "today" and are not affected.
> 
> SEVERITY: note is correct, not inflated. Nothing downstream branches on the count, no state is corrupted, and every row remains in brain_ledger.jsonl — this is a reporting defect on a motivational panel. The pull toward yellow is that it feeds two LLM jobs and understates the busiest hour by construction, but for a solo user on a laptop that sleeps, note holds.
> 
> A SECOND SYMPTOM THE SCANNER MISSED: the same expression makes ArsenalFC-Wall-PM (Start Time 22:00:00) label that evening's own 22:00+ calls as "overnight" under the banner "got sharper while you slept" — before he has slept. Same root cause, opposite direction.

---

## 54. wall_data.json embeds a stale copy of itself via veo_text — the file WALLPAPER.ps1 parses is ~4x larger than it needs to be and contains two versions of every number.

- **kind:** `broken` · **severity:** `note` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\viz.mjs:300-301,660-661 · dressing-room\state\wall_data.json

**Evidence**

> viz.mjs:661 `data.media.veo_text = pack["season_film.md"]`, and promptPack (viz.mjs:301) inlines `JSON.stringify(data, null, 1)` — a full dump of `data` taken BEFORE filmkit_text/veo_text/gemini_render were attached. Result in dressing-room/state/wall_data.json: the top-level document, plus `media.filmkit_text` (the whole film kit), plus `media.veo_text` containing a complete nested JSON copy whose `media` block reads `{teamtalk_am,teamtalk_pm,poster,filmkit}` only. 6,714 bytes for ~1.6KB of actual state.

**Impact**

> Every reader of wall_data.json now parses a document containing a second, subtly-different copy of every field. WALLPAPER.ps1:12 does `ConvertFrom-Json` on it and drives the desktop from it. Nothing is broken today, but any future path query that isn't perfectly anchored can pick up the shadow copy, and the duplication makes diffing the state bus useless.

**Proposed fix**

> Keep the big text blobs out of the persisted state file: write wall_data.json before attaching filmkit_text/veo_text, and pass those to renderWall separately (they are only needed by the inline <script> in the HTML, never by a state reader).

**Verifier's note**

> REAL but mis-kinded and half mis-argued. Reproduced: wall_data.json = 6,724 bytes on disk; JSON.stringify(d,null,1) = 6,347 chars vs 1,998 with media.veo_text + media.filmkit_text stripped (3.18x, not 4x). media.veo_text (3,232 chars) does contain a ```json fence holding a full 1,973-byte dump of `data` whose media block has only 4 keys (teamtalk_am, teamtalk_pm, poster, filmkit) vs the outer 7.
> 
> Cause correct, cite wrong: promptPack is viz.mjs:382, `const json = JSON.stringify(data, null, 1)` at :383, inlined into season_film.md at :388; attachment at :660-661; writeAtomic(WALL_DATA, data) at :663. viz.mjs:300-301 is renderMedia's clipboard <script>, not the dump.
> 
> REFUTED — the stated impact. (a) The embedded copy is a JSON *string*, not a nested object. WALLPAPER.ps1:13 ConvertFrom-Json yields $data.media.veo_text as System.String; no PowerShell path expression, anchored or not, can descend into it. The "any future unanchored path query picks up the shadow copy" risk does not exist. (b) "Two subtly-different copies of every number" is false — the dump is taken in the same main() run from the same object, so every number is byte-identical; only the 3 later-attached media keys are absent. Not stale.
> 
> CONFIRMED — the impact the scanner missed. wall_data.json is a live input to two enabled brain jobs (brain_config.json: wall_insights inputs ["wall_data.json"]; wall_review inputs ["wall_data.json","../club/wall_gemini.html"]) and brain.mjs:787 inlines clip(v) of the whole file into the prompt. Every night two LLM prompts carry the same state twice — ~4.3K wasted chars each. Still under the 14,000-char clip cap (brain.mjs:723), so nothing truncates today, but headroom is 3x smaller and duplicated context is prime anchoring material. setup/GEMS_SETUP.md:55 also instructs a manual paste of this file.
> 
> KIND correction: not "broken" — nothing misbehaves. grep for veo_text|filmkit_text across .mjs/.ps1/.json returns exactly two hits: viz.mjs:288 (reads m.filmkit_text/m.veo_text from the in-memory object, same process) and the write at :660-661. No process ever reads them back off disk. These are dead fields on the state bus that cost tokens on two nightly jobs → dead-code, not broken.
> 
> SEVERITY: note is correct — no user-visible failure, solo laptop, sub-cap.
> 
> FIX correction: the proposed "pass them to renderWall separately" needs no signature change. renderWall(data, insights) at viz.mjs:664 operates on the same in-memory object, so simply moving writeAtomic(WALL_DATA, data) from :663 to before the :660-661 assignments delivers the blobs to the HTML and keeps them out of the persisted file.

---

## 55. The mirror is healthy — but its id list is a hardcoded 4 and it will report 'all ok' forever while new capsules go unmirrored.

- **kind:** `waiting` · **severity:** `note` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\mirror_config.json · C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\mirror.mjs:39,78

**Evidence**

> Live read-only fetch just now: all four gist files return HTTP 200 and the sha256 of the remote bytes matches the local copy exactly — tokenization 41,452 B / 26 doubts, embeddings 58,547 B / 35, inference 61,272 B / 36, context 49,722 B / 15 (total 112, which is exactly the wall's '112 rematches waiting' and doubt_grammar's total_doubts). mirror_manifest.json reports 4/4 ok, generated 2026-08-01T17:10Z. mirror selftest passes 13/13. The limitation: mirror_config.json `"ids": ["tokenization","embeddings","inference","context"]` and mirror.mjs:39 DEFAULTS carry the same fixed list; pull() iterates `cfg.ids` only (mirror.mjs:78) — there is no listing of the gist, so a fifth locked capsule is invisible and `status` still reads 'ok'.

**Impact**

> Nothing is wrong today. But the mirror is the afferent nerve for five downstream mechanisms (decoy map, lexicon, tape room, derby seeds, set-piece rematches), and the day a fifth concept locks, it will keep saying 'all ok' while feeding them four. Silent under-supply, reported as health.

**Proposed fix**

> Either hit the Gist API (`https://api.github.com/gists/<id>`) to enumerate files and diff against cfg.ids, or add a one-line reminder in the manifest ('ids are manual — extend mirror_config.json when a capsule locks') and have the FORGE lock step append the new id. The config comment already says 'extend this list as new concepts lock' — nothing enforces it.

**Verifier's note**

> CONFIRMED as stated, kind and severity both correct. Reproduced myself: mirror_config.json ids is a fixed 4; scripts/mirror.mjs:40 DEFAULTS duplicates the same 4; pull() at mirror.mjs:85 iterates `cfg.ids` only with zero gist enumeration in the whole 184-line file. Live unauthenticated GitHub Gist API call returns exactly four files (context 49722, embeddings 58547, inference 61272, tokenization 41452 bytes) matching mirror_manifest.json per-id byte-for-byte, updated_at 2026-07-31T22:45:08Z — so no capsule is being missed today. `node scripts/mirror.mjs selftest` = 13/13 pass. .claude/skills/forge/SKILL.md step 10 LOCK emits <id>.json to the gist and never mentions mirror_config.json, so nothing enforces the config's own "extend this list as new concepts lock" comment. The downstream framing is right: capsule_bridge.mjs:47, doubtminer.mjs:33, cortex.mjs:78, council.mjs:77 and dugout.mjs:654 all readdirSync(capsules/), so mirror.mjs's cfg.ids is the SOLE chokepoint. No independent locked-concept ledger exists (forge_profile.json holds only intervals/weights), so gist enumeration is the only viable diff — and I proved it needs no credential. TWO CORRECTIONS. (1) The status field is weaker than claimed: mirror.mjs:114 is `okCount > 0 ? "ok" : "awaiting_data"`, i.e. "at least one succeeded", so it reads "ok" even at 1/4 — though per_id and the stdout line at :179 do enumerate errors for LISTED ids, so the blind spot is precisely and only the unlisted id, as claimed. (2) The fix needs three touch points, not one: mirror_config.json, the duplicate DEFAULTS at mirror.mjs:40 (a malformed config silently reverts to the same hardcoded 4 and still reports ok), and dugout.mjs:814 where the get_capsule tool description handed to Gemini hardcodes "(tokenization/embeddings/inference/context)" in prose (the digest at :654 and the handler at :944 are generic, so this is cosmetic staleness only). Severity NOT inflated: concepts.json registers ~24 concepts against 4 locked, so ~20 future locks sit on the system's core path — this will fire, just not today. Genuinely "waiting", not broken and not starved.

---

## 56. The away-day CI lane is one commit away from going red: package.json now runs conductor.mjs's selftest, and conductor.mjs is untracked and not gitignored.

- **kind:** `broken` · **severity:** `note` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\package.json:17 (working copy) · C:\Users\nikhi\GitHub\arsenal-ai-fc\.github\workflows\awayday.yml:29 · scripts\conductor.mjs, scripts\limits.mjs (untracked)

**Evidence**

> `.github/workflows/awayday.yml` runs on push to main + nightly cron 21:30 UTC: `npm ci` then `node scripts/awayday.mjs run`, which executes ci_manifest.json's two jobs — `npm run organism:selftest` and `npm run squad:selftest`. `git diff package.json` shows organism:selftest was just extended with `&& node scripts/conductor.mjs selftest`. `git ls-files scripts/conductor.mjs scripts/limits.mjs` → 0 files tracked; `git check-ignore -v` on both → no match (exit 1), so they are untracked, not ignored. `git show HEAD:package.json | grep -c conductor` → 0, so the lane is green today only because the package.json change is also uncommitted.

**Impact**

> The moment package.json is committed without conductor.mjs in the same commit, every push and every nightly away-day run dies on 'Cannot find module conductor.mjs' — and the workflow header itself records that this exact class of red ('~24 red emails … trained everyone to ignore CI') already happened once on 15-29 Jul.

**Proposed fix**

> Commit scripts/conductor.mjs and scripts/limits.mjs in the same commit as package.json — or hold the package.json selftest line back until they land.

**Verifier's note**

> CONFIRMED, with two corrections to cause/fix.
> 
> Reproduced every leg myself:
> - package.json:17 (working copy) ends "... && node scripts/turnstile.mjs selftest && node scripts/conductor.mjs selftest"; git diff shows that clause + three new conductor* script entries are the only change.
> - `git show HEAD:package.json | Select-String conductor` -> 0 hits. HEAD is clean; the lane is green today only because the package.json edit is uncommitted.
> - `git ls-files scripts/conductor.mjs scripts/limits.mjs` -> empty; `git status --porcelain` -> "?? scripts/conductor.mjs", "?? scripts/limits.mjs"; `git check-ignore -v` on both -> exit 1, no match. Untracked and NOT gitignored, as claimed.
> - Chain is real end to end: .github/workflows/awayday.yml:7-11 (push to main + cron "30 21 * * *") -> :29 `node scripts/awayday.mjs run` -> ci_manifest.json job "organism-selftests" {"run": "npm run organism:selftest"} -> dispatched at awayday.mjs:37 via execSync(cmd, {stdio:"inherit", cwd:repo}); a missing module exits non-zero and awayday.mjs:46 prints `away-day: JOB FAILED - "organism-selftests"`. Nothing swallows it.
> - `node scripts/conductor.mjs selftest` -> 15/15 passed, exit 0. The script works; only its absence from the commit is the failure mode.
> - No hidden second red: conductor selftest is dormant-safe on a bare cloud checkout (conductor.mjs:200 guards its only state read with existsSync).
> 
> CORRECTION 1 - the fix is over-broad on limits.mjs. Grep across *.{mjs,json,md,yml,ps1,cmd,bat} finds ZERO importers of scripts/limits.mjs; the only hits are its own header (limits.mjs:2), its own usage line (:183), and a string literal inside itself (:109 `where: "conductor.mjs STEP_TIMEOUT_MS"`) which is documentation, not a dependency. conductor.mjs:33-36 imports only node:child_process, node:fs, node:path, node:url. limits.mjs cannot redden CI; only scripts/conductor.mjs must ride along in the commit.
> 
> CORRECTION 2 - the trigger is narrower than "the moment package.json is committed". `git add -A` / `git add .` sweeps the untracked file in and nothing ever breaks. The lane only goes red on a SELECTIVE commit - most realistically `git commit -am`, which stages tracked modifications only and would take package.json while leaving scripts/conductor.mjs behind. Plausible, not inevitable.
> 
> Severity `note` is correct and not inflated: nothing is failing today, no scheduled run is red, and the whole hazard is defused by staging one extra file. Kind `broken` is the closest available label (it is a latent build break, not starvation - conductor has nothing to do with input volume), though strictly it is a latent hazard rather than a present failure.

---

## 57. The /matchday skill's only instruction for opening the wall is a broken Windows path — the backslashes are missing from the source file.

- **kind:** `broken` · **severity:** `note` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\.claude\skills\matchday\SKILL.md:20-21

**Evidence**

> `.claude/skills/matchday/SKILL.md:20`, verified with cat -A (no escape characters present in the file): ``on his Windows box say `start dressing-roomclubwall.html` (cmd) or just`` — the literal string is `dressing-roomclubwall.html`, not `dressing-room\club\wall.html`. Line 21 offers the fallback 'double-click club/wall.html', which is also wrong: the file lives at `dressing-room/club/wall.html`, not `club/wall.html`.

**Impact**

> Every morning kickoff ends with 'a reminder to open the wall' followed by a command that errors and a folder path that does not exist from the repo root. The wall is the daily-consumption surface the whole area exists to feed, and its documented doorway is broken in both forms offered.

**Proposed fix**

> Escape the backslashes in the markdown (`dressing-room\\club\\wall.html`) or sidestep the issue entirely: `start "" "dressing-room/club/wall.html"` works in cmd, and fix the double-click hint to the real relative path.

**Verifier's note**

> CONFIRMED by independent reproduction. `cat -A` on .claude/skills/matchday/SKILL.md:19-21 shows the literal bytes `start dressing-roomclubwall.html` with no backslashes present in the file. Both offered paths are wrong: `ls` confirms the real file is dressing-room/club/wall.html, and `ls club` returns "cannot access 'club': No such file or directory", so the line-21 fallback "double-click club/wall.html" is also invalid from repo root. The repo proves the intended string had backslashes — setup/README.md:30 reads `start dressing-room\club\wall.html` and THE_PEAK_PROTOCOL.md:171 reads `dressing-room\club\wall.html`, both intact.
> 
> NEW EVIDENCE the scanner missed: `git log -p --follow` shows this is a REGRESSION introduced by the very commit that was fixing skill bugs — 34561e8 "skills: three bugs that would bite on day one". The diff is `-  - End: \`open dressing-room/club/wall.html\` reminder` / `+    on his Windows box say \`start dressing-roomclubwall.html\` (cmd)`. Before that commit the PATH was correct and only the launcher verb (`open`, macOS) was wrong. The fix corrected the verb and destroyed the path.
> 
> TWO CORRECTIONS to the submitted finding:
> (1) Stated cause/fix is wrong. "Escape the backslashes in the markdown" misdiagnoses it — markdown does not strip \c or \w, and the string sits inside a code span where markdown escaping does not apply. The backslashes were consumed at write time (shell/heredoc interpolation when 34561e8 was authored), which is why sibling docs written by other means kept theirs. Correct remedy: write the literal bytes and verify with cat -A, or sidestep with `start "" "dressing-room/club/wall.html"` (quoted, works in cmd). Also fix the line-21 fallback to the real relative path dressing-room/club/wall.html.
> (2) Impact is mildly overstated. "The wall's documented doorway is broken in both forms" is true within the skill, but the wall is not unreachable — setup/README.md:30, MORNING_RUNBOOK.md:14, THE_CAPTAINS_MANUAL.md:68 and the "ARSENAL 2" desktop icon all reference it correctly. What actually breaks is the closing line of every /matchday kickoff.
> 
> KIND stands as "broken", not "starved" or "unwired" — this is not an input-volume problem; the instruction text itself is corrupt and an agent following it verbatim emits a command that errors. SEVERITY stands as "note" and is NOT inflated: one cosmetic closing line, zero data loss, alternate doorways exist, solo user on a laptop.

---

## 58. council.mjs and fuelboard.mjs are wired but effectively unreachable as surfaces — council rides a tier-2 wake path that has fired twice ever; the fuelboard's gauge is in no task and no skill.

- **kind:** `starved` · **severity:** `note` · **area:** `output-surfaces` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\cortex.mjs:38,296 · C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\fuelboard.mjs:355 · C:\Users\nikhi\GitHub\arsenal-ai-fc\.claude\skills\organism-doctor\SKILL.md:12-20

**Evidence**

> council is NOT dead code — cortex.mjs:38 `import { convene, councilSection } from "./council.mjs"` and cortex.mjs:296 convenes it inside the deep-wake path. But that path only runs on a tier-2 wake, and the salience ledger shows 2 tier-2 wakes across 5,244 moments; `dressing-room/state/council_flag.json` (the disagreement→set-piece-drill bridge described in council_config.json's _doc) has never been created. fuelboard is likewise a live library — dmn.mjs:53 `import { loadBoard, headroomOf, recordUse, record429, stateOf }`, dugout.mjs:69 `import { summary as tankSummary, loadTankConfig }`, dugout.mjs:2905/2911 shell out to `fuelboard.mjs use` — but its human surface, the 7-bar gauge (`node scripts/fuelboard.mjs status`, fuelboard.mjs:355), appears in no scheduled task and in no .claude/skills/*/SKILL.md (grep across all skills returns nothing), only in prose in THE_PEAK_PROTOCOL.md:139,170.

**Impact**

> Both selftest green and both are honestly built; neither is dead. But 'the parallel specialist lenses' have convened at most twice in the organism's life, and the fuel gauge — the thing that tells him which of seven free-tier accounts is empty — is a command he must remember from a document. /organism-doctor, the skill whose whole job is 'is the body okay', never checks it.

**Proposed fix**

> Add `node scripts/fuelboard.mjs status` to /organism-doctor's step-1 list — it is read-only and instant, and 'which tank is dry' belongs on the physio's chart. Council needs no fix; it is correctly waiting on the gate, which is the Wind Tunnel's business (see the gate_tune finding).

**Verifier's note**

> Half confirmed, half refuted; the surviving core is real but smaller than claimed, and the stated fix rationale is factually wrong.
> 
> COUNCIL — CONFIRMED, and the count is slightly low. Reproduced: council.mjs's only importer is cortex.mjs:38, its only live convene is cortex.mjs:296, and that sits inside serveWake, which the thalamus only ever feeds on tier-2 (thalamus.mjs:572 `if (S >= t1) { tier = 2; outcome = "wake"; }`, :578 enqueues only when tier===2). My own count of salience_ledger.jsonl: 5,280 rows, tiers {0:5271, 1:7, 2:2}. My own count of brain_ledger.jsonl: cortex_wake = 3 rows, ALL on 2026-07-18 — two `ok:false "You've hit your session limit"` and one success (6,134 tokens); `council_chair` = 0 rows ever. dressing-room/state/council_flag.json does not exist (council_config.json does). Correction to the scanner: council was wired on 2026-07-14 (commit 70f7612) and convene() runs BEFORE the Opus call at cortex.mjs:299, so it plausibly sat up to THREE times, not two — and not once in the 15 days since. The right word is "waiting", not "starved": it is not short of input (5,280 moments arrived), it is below a bar that budget-couples upward (thalamus.mjs:249). No fix needed here; this is the gate_tune finding's territory, and the scanner says so correctly.
> 
> FUELBOARD — the narrow fact is true, the IMPACT is REFUTED. True: no ArsenalFC-* scheduled task runs fuelboard (checked the full schtasks dump), and `grep -rn "fuelboard" .claude/` returns nothing. But "the fuel gauge is a command he must remember from a document" and "reaches nobody" are wrong. The gauge has a live human surface: dugout.mjs:2743-2744 renders it into the Dugout header on every START — `' ⛽ '+CFG.tanks.gauge.map(t=>t.id+' '+t.pct+'%'+(t.state==='HOT'?'':' '+t.state))` — refreshed every 10 min (dugout.mjs:2724), fed by buildConfig's `tanks: { gauge: tankSummary() }` (dugout.mjs:1341-1349), and both facts are selftest-asserted (dugout.mjs:1695 "config carries the 7-tank fuel gauge", :1701 "page: fuel line renders from the gauge"). It also rides the Gaffer's spoken boardroom briefing and organism lecture (dugout.mjs:1100, :1151). tanks.json is live and current: 831 units today, naive shadow 2.5M tokens, T1 and T2 COLD with 429s stamped 2026-08-01T20:18. So the fuelboard is neither starved nor unreachable — only its CLI subcommand is unscheduled.
> 
> WHAT SURVIVES, and it is worth a note: no HEALTH surface reads tank state. `grep -n "tank|fuel"` returns zero hits in physio.mjs and zero in viz.mjs, and /organism-doctor's step-1 list (SKILL.md:20-28) never touches it. Right now T1 (the mouth) and T2 (the Watcher) are both COLD from yesterday's 429s and the physio's chart cannot say so. That is "unwired to the health surface", not "starved".
> 
> THE PROPOSED FIX IS WRONG ON ITS OWN JUSTIFICATION. It says `node scripts/fuelboard.mjs status` "is read-only and instant". It is not read-only: fuelboard.mjs main() does `withTankLock({}, () => { const b = loadBoard(); saveBoard(b); return b; })` — a full read-modify-write of tanks.json inside the lock (the file's own comment at :346-349 explains why the write is deliberate: it persists the day-reset). Benign, but a doctor step that writes state must be described as such. Better fix: have /organism-doctor read dressing-room/state/tanks.json directly, or call the exported `summary()` — no write, same seven bars.
> 
> SEVERITY: "note" is correct, not inflated. Solo user, laptop that sleeps, tanks reset daily, and the gauge already reaches him through the surface he actually opens.

---

## 59. course.mjs — 670 lines, zero invocation, output file has never existed

- **kind:** `dead-code` · **severity:** `red` · **area:** `dead-and-lying` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\course.mjs (whole file, 670 lines); consumer gap at scripts/course.mjs:70

**Evidence**

> `ls scripts/*.mjs | wc -l` = 56. For course.mjs: no ArsenalFC-* scheduled task (full `schtasks /query /v` dump checked), no package.json entry, no .claude skill, and the precise invocation-graph scan (import / execFileSync / spawnSync / conductor args) returns `course.mjs — NO CODE REFERENCE`. Its declared product does not exist: `ls dressing-room/state/course.json` → `No such file or directory`. Repo-wide grep for `course.json` hits only scripts/course.mjs itself (lines 5, 47, 70, 236, 376, 380, 400, 567, 610). scripts/course.mjs:70 `const STATE = join(STATE_DIR, "course.json");`

**Impact**

> The organ was built (1 Aug 2026) to close the stated five-hour hole in his Python anchor — its own header: "Every organ that plans his day has been planning around a five-hour hole and calling it a plan." That hole is still open. The code exists, has never run once, and no organ can reach it. It is also not in either selftest suite, so `npm run organism:selftest` / `squad:selftest` stay green while it rots.

**Proposed fix**

> Two moves, both small: (1) wire the paste path — `node scripts/course.mjs paste <file>` once, with his real chapter list, so course.json exists; (2) give it a reader. The natural one is sprintsync.mjs, which already owns sprint.json's `playlist_anchor` (scripts/sprintsync.mjs:101 writeAtomic(SPRINT, sprint)) — have it splice `course.json.current` into `progress.current` so the Manager and /learn see the chapter instead of a bare string. Until (2) lands it is still write-only.

**Verifier's note**

> CONFIRMED on every factual point, reproduced independently.
> 
> FACTS I VERIFIED MYSELF
> - `wc -l scripts/course.mjs` = 670. Correct.
> - `ls dressing-room/state/course.json` → "No such file or directory". Product has never existed.
> - Repo-wide `grep -rn "course"` excluding course.mjs itself returns only: (a) ARSENAL_FC_FULL_REPO_BUNDLE.md, which is a verbatim source dump, not a call site; (b) .claude/skills/learn/SKILL.md, whose `### track = "course"` block (SKILL.md:47-52) is a *sprint.json track name*, not this script — it routes to "a guided active-recall pass, Colab-surfaced" and never mentions course.mjs or course.json. So the one hit that looks like a consumer is not one.
> - `schtasks /query /fo csv /v | Select-String "course"` → **0**. No scheduled task.
> - package.json: no `course` key or value anywhere in `scripts`.
> - Not in `organism:selftest` (35 scripts) nor `squad:selftest` (11 scripts). Both suites stay green while this rots. Confirmed by reading the full script list.
> - `grep -n "course" scripts/conductor.mjs` → empty. Not reachable via the conductor either.
> - brain_config.json: zero "course" matches, so no LLM job touches it.
> 
> THE CODE ITSELF IS NOT BROKEN — that matters for the kind
> `node scripts/course.mjs selftest` → **44 passed, 0 failed, exit 0**, including "PURE CORE IS DISK-FREE — the live course.json was not created, touched or resized" and "no orphan temp was left beside it". `node scripts/course.mjs status` exits 0 with an honest empty answer: "course: nothing ingested yet". This organ works. It is also hand-reachable right now from a shell. So it is not unreachable dead code in the strict sense — it is **unwired**: no scheduler, no organ, no skill, no suite, and no reader on the other end. I corrected kind from `dead-code` to `unwired` for that reason.
> 
> WHY I DOWNGRADED red → yellow
> `git log -1 -- scripts/course.mjs` = **2026-08-01 02:54**, commit d78a7d8 — the file is *one day old* as of today (2 Aug 2026). Nothing regressed when it landed; the five-hour Python-anchor hole it targets existed before it and is unchanged. No other organ degrades, no user-facing path fails, no state is corrupted. This is a fresh organ awaiting (1) a human paste only Nikhil can perform and (2) a consumer. That is a normal day-one state, not a red emergency for a solo user on a laptop. It is above a note because 670 lines sit outside both selftest suites, so from here it decays silently.
> 
> STATED FIX IS WRONG IN TWO PLACES — corrected
> 1. **The verb does not exist.** The claim says `node scripts/course.mjs paste <file>`. `grep -n '"paste"' scripts/course.mjs` → **NO paste verb**. The dispatcher accepts only `selftest`, `ingest`, `at`, `done`, `status`, `json` (course.mjs:593-649; usage block 657-662). The correct command is `node scripts/course.mjs ingest <file>`. Anyone running the proposed line gets the usage banner and no course.json.
> 2. **The proposed consumer violates the repo's single-writer law.** The claim wants sprintsync.mjs to splice course.json into `progress.current` before `writeAtomic(SPRINT, sprint)` — I confirmed that line is scripts/sprintsync.mjs:101 and that sprintsync is the Google-Sheet-driven sole writer of sprint.json, carefully preserving captain-authored fields (sprintsync.mjs:97-99). Having it also import another organ's state makes sprint.json a mixed-provenance file and puts course data one Sheet-sync away from being clobbered. The clean consumers are **readers**, not the writer: `scripts/learnstate.mjs` (which builds the SessionStart brief off sprint.json) and `scripts/dugout.mjs` — both already read `sprint.progress.current` (confirmed: sprint.json readers are course.mjs, dugout.mjs, learnstate.mjs, sprintsync.mjs, teaching_contract.mjs). A reader can show `course.json.current` beside `playlist_anchor` without any organ writing into another's file.
> 
> Also worth noting for the fix: `playlist_anchor` today has exactly two references repo-wide — dressing-room/state/sprint.json:6 (the bare string) and course.mjs:12 (a comment describing it). No code reads it. So the "bare string" the organ was built to replace is itself unconsumed; wiring course.json to a reader is the first time anything would consume the anchor at all.

---

## 60. The team sheet has said "Matchday 1 · Introduction" every day of its life — the counter reads a file whose only writer has never run

- **kind:** `broken` · **severity:** `red` · **area:** `dead-and-lying` · **day-one fixable:** no
- **where:** scripts/manager.mjs:146-148, :189, :91-96 · scripts/postmatch.mjs:39-41 · no scheduled task

**Evidence**

> scripts/manager.mjs:147 `const mp = Number.isInteger(S.matches_played) ? S.matches_played : 0;` where `S = bus.season || {}` (line 146) and `season: readJSON("season.json")` (line 58). `ls dressing-room/state/season.json` → No such file or directory. Therefore mp is permanently 0, and manager.mjs:189 `matchday: mp + 1` is permanently 1; manager.mjs:91-96 `phaseFor(mp)` returns `{key:"introduction", name:"Introduction"}` for `mp <= 1`, forever. Live proof, dressing-room/state/team_sheet.md line 1: `⚪🔴 TEAM SHEET — 2026-08-01 · Matchday 1 · 🤝 Introduction` and line 4: "I don't know you yet". The sole writer of season.json is postmatch.mjs (scripts/postmatch.mjs:40 `const SEASON = join(STATE_DIR, "season.json");`, header line 27 "OUTPUT: post_match/<date>.md · season.json · notebook.json · routed_balls.json") — and there is NO ArsenalFC-PostMatch scheduled task in the 44-task dump.

**Impact**

> The single number the Gaffer leads with is not a measurement — it is a constant standing in for a measurement, and it is the one the whole voice is keyed to. The phase ladder (Introduction → Building Trust → Partnership → Brotherhood) can never advance, so the sheet will keep opening with "I don't know you yet" on matchday 500. The same absence blanks `days_to_ship`, `trophy_state`, `paused_until` (manager.mjs:191-198) and the KAL-line (manager.mjs:71 `last_post_match: readText(join("post_match", yday + ".md"))`, manager.mjs:186). Six other organs read the same phantom family and silently default: viz.mjs:582 + :610 (kal_line, commitments — `next_result` always null), viz.mjs:587 (season), viz.mjs:637 (notebook.json for the film kit), scorer.mjs:508, scout.mjs:240 (war-room taper never fires), dugout.mjs:441 + :934 + :1106, shipped.mjs:31.

**Proposed fix**

> Two-part, and only part one is a day-one job. Day one: run `npm run postmatch` once so season.json / post_match/ / notebook.json come into existence, then re-run the Manager and confirm the sheet's matchday moves off 1. Then schedule it — the evening close is already a ritual (`/full-time`), so add `ArsenalFC-PostMatch` at his fulltime bell alongside ArsenalFC-Bell-FullTime rather than inventing a new hour. Part two needs his input: postmatch is a 30-second HIT/MISS ritual he answers, so an unattended task would write empty matches. Ask him whether he wants it to auto-close with "no result recorded" on a silent night, or stay manual and instead have the Manager say "matchday unknown — post-match never closed" instead of printing a fake 1.

**Verifier's note**

> CONFIRMED as fact, REFUTED as diagnosis. What I reproduced myself:
> 
> FACTS VERIFIED
> - `ls dressing-room/state/` — no `season.json`, no `post_match/`, no `notebook.json`, no `routed_balls.json`. None have ever existed.
> - Live reproduction against a COPY of real state (read-only; imported `runManager({stateDir: copy, llm: async()=>null})`): `matchday: 1 | phase: introduction`, `season: {"season_day":1,"matches_played":0,"trophy":"the trophy","trophy_state":"unlit","pipeline_item":null,"days_to_ship":null,"paused_until":null}`, `kal: null`, sheet line 1 = `⚪🔴 TEAM SHEET — 2026-08-02 · Matchday 1 · 🤝 Introduction`. Code cites at manager.mjs:58, :146-148, :91-96, :189, :419, :447 are all accurate.
> - Live `dressing-room/state/team_sheet.md` line 1 and manager_notes.json (`"matchday": 1, "phase": "introduction", "source": "fallback"`) match.
> - No `ArsenalFC-PostMatch` in the 44-task dump. Correct.
> 
> CORRECTION 1 — the cause is wrong, and so is half the fix. postmatch.mjs is not an unscheduled orphan; it is deliberately human-gated (postmatch.mjs:225-228 prompts Result / signal / KAL-line) and it IS triggered three ways: `.claude/skills/full-time/SKILL.md` step 3, the dugout spoken gate `run_postmatch` (dugout.mjs:820, :1031-1038), and a scheduled nightly bell — `schtasks /query /tn "\ArsenalFC-Bell-FullTime" /v` returns `Last Run Time: 01-08-2026 21:30:01 · Last Result: 0 · Next Run Time: 02-08-2026 21:30 · State: Enabled`, running `node scripts\brain.mjs bell fulltime`, whose body (brain.mjs:706) literally reads "Dugout se bolo **\"full time\"** — ya `npm run postmatch`". So this organ is not broken or unwired: it is STARVED. The prompt fires every night; the ritual has been completed zero times. Scheduling it unattended is the wrong fix and would write fake results — the claim's own "part two" half-concedes this.
> 
> CORRECTION 2 — "every day of its life" is true but the offered evidence can't carry it. `git check-ignore -v` → `.gitignore:54 dressing-room/state/team_sheet.md`, `.gitignore:56 …/season.json`; neither is tracked, so there is no history to read. The load-bearing evidence is brain_ledger.jsonl: `formation_read` = 42 runs spanning 2026-07-18 → 2026-08-01 (6 distinct days), every one with season.json absent.
> 
> CORRECTION 3 — running postmatch does NOT restore what the claim says it restores. postmatch.mjs:93-103 `updateSeason` writes only `season_day`, `matches_played`, `last_result`, `last_played` (plus a seed). `trophy`, `target_ship` (→ `days_to_ship`), `paused_until` and `interview_dates` have NO writer anywhere in scripts/ — scout.mjs:127 states outright that "the captain logs interview_dates in" by hand. So even after a clean post-match the sheet's TROPHY line stays "🔒 unlit — the trophy", `days_to_ship` stays null, and scout.mjs:132-142 `warRoomRead` still returns `{active:false}` forever (live scout.json confirms). That is a separate, genuinely unwired sub-finding the claim folded into this one. Also note matches_played only increments on WON_DAY (postmatch.mjs:95, :99) — MISS/PARTIAL do not advance the phase ladder, by design.
> 
> CORRECTION 4 — consumer cites, minor. shipped.mjs:31 is a comment; the real read is shipped.mjs:153-154 (`matchday_closed` never emitted). viz's commitments array is EMPTY, not "next_result always null" (viz.mjs:604-606 `continue`s when the file is missing). scorer.mjs:508 pmText = null; dugout.mjs:441 nb = null; dugout.mjs:934/:1106 fall back to `{matches_played: 0}`. All null-safe — nothing throws anywhere.
> 
> SEVERITY — red is inflated to yellow. No code is broken, no data is corrupted, no wrong number is computed (zero closed matches is literally true — manager.mjs's own header calls Matchday-1 · Introduction the designed "cold-start sheet"), every consumer degrades silently and safely, and the trigger already fires nightly. One `/full-time` clears matchday, phase, the KAL weld and the whole post_match cascade at once. What keeps it above a note: postmatch.mjs's own header calls the KAL→KICKOFF weld "the loop's biggest mechanic", and it has fired zero times in the organism's life, while the sheet he reads each morning still greets him with "I don't know you yet" on day 24 with 3,078 afferent rows sitting in the same directory.

---

## 61. The shadow organ has never scored a single shadow — its ledger file has never been created, and the Dugout reads it every session

- **kind:** `broken` · **severity:** `red` · **area:** `dead-and-lying` · **day-one fixable:** yes
- **where:** scripts/shadow.mjs:236 (only writer of proactivity_ledger.json) · scripts/postmatch.mjs:269 (only caller of `score`) · scripts/dugout.mjs:540, :166, :1082 (readers of the file that never exists) · dressing-room/state/shadow_log.jsonl

**Evidence**

> dressing-room/state/shadow_log.jsonl holds exactly 5 rows, every one `"resolved":false`, oldest 2026-07-18T05:09:47Z, newest 2026-08-01T05:07:10Z. `ls dressing-room/state/proactivity_ledger.json` → No such file or directory. shadow.mjs writes that ledger only in `score` mode (scripts/shadow.mjs:236 `writeAtomic(LEDGER, led)`), and the only caller of `score` is postmatch.mjs:269 `execFileSync(process.execPath, [join(__dirname, "shadow.mjs"), "score"], ...)` — postmatch has no scheduled task and has never run. Meanwhile three live read sites take the missing file: dugout.mjs:166, dugout.mjs:540 `buildProactivitySection(led = readJson(join(STATE_DIR, "proactivity_ledger.json")))`, dugout.mjs:1082. `detect` fires only from dugout.mjs:2816 `setInterval(... shadow.mjs detect ..., 600000)` — i.e. only while the Dugout web server happens to be running.

**Impact**

> The whole point of this organ is that the machine earns the right to speak by a measured hit-rate — scripts/shadow.mjs:34 `const VOICE_GATE = { min_shadows: 10, min_hit_rate: 0.7 };  // proven, not vibes`. With scoring never run, `e.shadows` stays 0 for every type, `eligible` (shadow.mjs:115) is false forever, and `ratifyType` (shadow.mjs:125) will refuse with "not proven yet — 0/10 shadows" for the rest of the system's life. The proactivity section of every Gaffer session is silently blank. Five real moments where the organism knew it should have spoken — including "no reps by late morning" twice — are sitting unjudged.

**Proposed fix**

> Same root cause as the matchday finding — postmatch never runs — so fixing postmatch fixes this too. But do NOT leave `score` behind postmatch: `detect` already runs headless-ish, and scoring is pure arithmetic over reps_log + pitch_read_history (shadow.mjs:220-229) with no human input. Give shadow.mjs its own nightly task (`node scripts/shadow.mjs score`) beside ArsenalFC-Scorer, and move `detect` off the Dugout's setInterval onto a schedule too — right now shadows are only detected on days he happens to open the voice bridge, which biases the hit-rate sample toward exactly the days he was already engaged.

**Verifier's note**

> REPRODUCED. proactivity_ledger.json is absent from dressing-room/state/ (verified against full directory listing — it would sort between presence_thresholds.json and pulse.json). shadow_log.jsonl = 5 rows, all "resolved":false, {due_at_kickoff:2, stoppage_next_drill:1, wall_breaker:2}, 2026-07-18 to 2026-08-01. scripts/shadow.mjs:235 writeAtomic(LEDGER, led) is the sole writer and sits only inside `if (mode === "score")`. The only caller of `score` is postmatch.mjs:269. No ArsenalFC-PostMatch task exists in the 44-task schtasks list; ArsenalFC-Bell-FullTime runs `node scripts\brain.mjs bell fulltime` (a notification), not postmatch. Postmatch is invoked only by the manual /full-time skill (.claude/skills/full-time/SKILL.md:14) and has provably never run — its unconditional writes at postmatch.mjs:254-256 target dressing-room/state/post_match/ and season.json, and neither exists. `detect` fires only from dugout.mjs:2816 setInterval(600000), and the Dugout has no scheduled task (manual .claude/launch.json). So the wire is genuinely dead.
> 
> FOUR CORRECTIONS.
> 
> (1) KIND: unwired, not broken. The score code is correct and covered by shadow.mjs's 21-assert selftest; nothing is defective. What is missing is the trigger — scoring sits behind a human ritual that has never once been performed and that itself has no schedule.
> 
> (2) IMPACT OVERSTATED. "The proactivity section of every Gaffer session is silently blank" is FALSE. buildProactivitySection (dugout.mjs:540) with led=null gives types={}, earned=[], open=[], and returns the FULL constitutional paragraph including the honest fallback "NONE yet — every proactive idea stays behind your teeth; the organism shadows silently and earns the mouth with evidence." dugout.mjs:166 degrades to earned=false (whisper suppressed = the designed default) and dugout.mjs:1082 uses `|| {}`. No crash, no blank section, no false claim. The failure is fail-safe in exactly the direction the constitution wants: silence.
> 
> (3) SEVERITY red -> yellow. Even with scoring perfectly wired, VOICE_GATE.min_shadows=10 and the best-stocked type has 2 shadows in 15 days — detected only on days he happens to open the voice bridge. No type could have become eligible this month regardless. The cost is a capability that never activates, fail-safe, on a solo laptop. This is starvation stacked on top of a missing wire, not a red-line defect.
> 
> (4) A DEFECT THE SCANNER MISSED THAT MAKES ITS OWN FIX DANGEROUS. shadow.mjs:216 selects `lines.filter(l => !l.resolved)` — every unresolved row regardless of day — while facts (shadow.mjs:219-225) are built exclusively from TODAY's reps_log and the last-4 pitch_read_history rows. Scheduling a nightly `score` task as proposed would judge the 2026-07-18 due_at_kickoff shadow against 2 Aug's first rep time, producing a CORRUPT hit-rate. That is strictly worse than no hit-rate, because a corrupt one can open the ratification door at shadow.mjs:115. Any fix must first add a day filter (score only rows where localDayOf(l.ts) === today) or assemble facts per shadow-day. The detect-on-a-schedule half of the proposed fix is sound — gatherWorld (shadow.mjs:185-199) reads only files and has no Dugout dependency — and the sampling-bias argument is correct.
> 
> Minor: the two wall_breaker rows 10 minutes apart (18:28Z / 18:38Z on 07-31) are NOT a dedupe-law violation — in IST they are 23:58 on 31 Jul and 00:08 on 1 Aug, so localDayOf correctly separates them. They do mean two of the five "moments" came from one continuous late-night session.

---

## 62. allowedNumbers has drifted into three implementations; the 25 Jul zero-hallucination fix landed in one of them

- **kind:** `lying` · **severity:** `red` · **area:** `dead-and-lying` · **day-one fixable:** yes
- **where:** scripts/brain.mjs:509-519 (esp. :518) · scripts/viz.mjs:123-132 (esp. :131) · reference implementation scripts/manager.mjs:285-320

**Evidence**

> Three separate implementations: scripts/manager.mjs:285 `function allowedNumbers(F, shown = "")`, scripts/brain.mjs:509 `function allowedNumbers(data)`, scripts/viz.mjs:123 `function allowedNumbers(data)`. manager.mjs was fixed and carries the reasoning at :313-318 — "this used to whitelist EVERY integer 0-31 — which is precisely the range a hallucinating LLM fabricates (card counts, day counts, rep counts, streaks, small percentages)… Shrunk to 1-3" — ending in manager.mjs:319 `for (let i = 1; i <= 3; i++) set.add(String(i));`. The other two were never touched: brain.mjs:518 `for (let i = 0; i <= 31; i++) s.add(String(i));` and viz.mjs:131 `for (let i = 0; i <= 31; i++) s.add(String(i));`. manager.mjs also eats negative magnitudes (:292) and the assembled prompt (:308 `eat(shown)`); neither brain nor viz does either.

**Impact**

> They disagree on the same question. Text the Manager would bounce, brain.mjs's `no_new_numbers` waves through — and brain's validator guards exactly the outputs that reach him in his own ear: `day_cartridge` and `midday_cartridge` (injected verbatim into the Dugout's system instruction) and `teamtalk_am` / `teamtalk_pm`, which brain.mjs:888-895 renders to mp3 via speak.mjs. So a fabricated "12 reps", "9 overdue", "3-day streak" — the exact class the manager's own comment names — passes and gets spoken aloud. viz.mjs:136 `validateInsights` has the same hole on the wall. The repo advertises the opposite: the system prompt's claim that the validator will bounce the whole sheet for one invented digit.

**Proposed fix**

> Do not re-fix it twice — de-duplicate. heartbeat.mjs:152 `timeauditBridge` set the precedent (manager.mjs:34 imports it rather than re-implementing; reasoning at manager.mjs:107-114). Export `allowedNumbers` from manager.mjs and import it in brain.mjs and viz.mjs, deleting both local copies. If the signature mismatch (`(F, shown)` vs `(data)`) is awkward, `shown` already defaults to "". Then re-check the two selftests: brain.mjs:1216-1217 asserts the loose behaviour and its fixture will need updating, not loosening.

**Verifier's note**

> CONFIRMED, and the scanner UNDERSTATED it.
> 
> REPRODUCED MYSELF (not trusted from the claim):
> 
> 1. Three implementations exist. `grep "function allowedNumbers" scripts/` returns exactly three: manager.mjs:285 `(F, shown = "")`, brain.mjs:509 `(data)`, viz.mjs:123 `(data)`. Only manager carries the 25 Jul fix — its comment at :310-317 ("this used to whitelist EVERY integer 0-31 — which is precisely the range a hallucinating LLM fabricates... 'cards due: 12 (+9 overdue)' invented from nothing passed the zero-hallucination gate") ending in :318 `for (let i = 1; i <= 3; i++)`. brain.mjs:517 and viz.mjs:131 are both still `for (let i = 0; i <= 31; i++)`.
> 
> 2. Side-by-side on IDENTICAL input F = {reps:9, capsules:4, date:'2026-08-02'}, brain.mjs via its own exported validateOutput vs manager's allowedNumbers extracted from source:
>    "cards due: 12 (+9 overdue)"          brain PASSED  | manager BOUNCED [12]
>    "you are on a 3-day streak, 21 reps"  brain PASSED  | manager BOUNCED [21]
>    "27 doubts retired this week"         brain PASSED  | manager BOUNCED [27]
>    "we ship by 2026-12-25"               brain PASSED  | manager BOUNCED [12,25]
>    "lights out by 22:45"                 brain PASSED  | manager BOUNCED [22,45]
>    viz.mjs validateInsights behaves identically to brain (verified: "cards due: 12 (+9 overdue)" and "you are on a 3-day streak" both PASS; allowedNumbers({}).size === 32, has "12", has "31").
>    The first row is VERBATIM the example manager.mjs:312 names as the reason the fix exists.
> 
> 3. Live reach confirmed — this is NOT starved or waiting. dressing-room/state/brain_config.json has 6 jobs with validate=no_new_numbers: day_cartridge, midday_cartridge, teamtalk_am, teamtalk_pm, drill_forge, wall_insights. All six have output files dated as recently as 2026-08-01. Consumers verified: dugout.mjs:804 appends `composeCartridgeSection(loadDayCartridge(), readLines(STAMPS))` to the voice agent's system instruction; brain.mjs:890-896 pipes speak_to jobs (teamtalk_am/pm) through speak.mjs synthToFile to mp3; viz.mjs:648 runs wall_insights through validateInsights onto the wall.
> 
> WHAT THE SCANNER MISSED (makes it worse — three divergences, not two):
> brain.mjs:522 and viz.mjs:138 ALSO strip dates and clock times before the check (`.replace(/\d{4}-\d{2}-\d{2}/g,"").replace(/\d{1,2}:\d{2}/g,"")`). That is the SECOND hole manager.mjs:371-377 explicitly closed ("so the LLM could invent any deadline... a fabricated deadline being exactly the calendar-pressure failure mode Law 5 bans"). Reproduced above: a fabricated ship date and a fabricated lights-out window both pass brain.mjs — while buildAnalysisPrompt's own LAWS line (brain.mjs:785) instructs "no calendar pressure".
> 
> WHAT THE SCANNER GOT WRONG (the fix, not the finding):
> (a) manager.mjs does NOT export allowedNumbers. Verified: `import('./scripts/manager.mjs')` → `typeof m.allowedNumbers === 'undefined'`; the file's only export is :533 `export async function runManager`. An export must be added first.
> (b) MORE SERIOUS: importing manager's version naively into brain.mjs recreates the already-audited "invented number 90" bug inside brain. brain.mjs:883 calls `validateOutput(job, r.text, inputs, cfg)` and never hands it the prompt, and buildAnalysisPrompt (brain.mjs:783-789) injects the literal 25 ("Output: concise markdown, ≤ 25 lines") plus fingerprint digits that are not in `inputs`. I ran a tightened (1-3, no eat(shown)) whitelist against "hold it to 25 lines today" → BOUNCED(25). So the `shown` argument must be threaded through validateOutput/noNewNumbers in the SAME change, not after.
> (c) The claim's closing line — "brain.mjs:1216-1217 asserts the loose behaviour and its fixture will need updating" — is FALSE. Both are whitelist-agnostic. Reproduced under a 1-3 whitelist: :1216 "you did 97 reps" vs {reps:12} → BOUNCED(97) (assert still holds); :1217 "12 reps, gap 0.14" vs {reps:12,gap:0.14} → PASSED (assert still holds). Same for viz.mjs:506, whose fixture carries `tape_room: { doubts_retired: 24 }` at viz.mjs:455 so "24" traces to data. No fixture needs loosening. Both suites are currently green (`node scripts/brain.mjs selftest` and `node scripts/viz.mjs selftest` → ALL CHECKS PASSED), and manager's own selftest at :675 and :828 proves BOTH holes are closed on its side.
> 
> SEVERITY: red holds. Not inflated for a solo laptop user. The organism's advertised core guarantee ("the validator will bounce the whole sheet for one invented digit") is enforced on the one output he reads and silently unenforced on the outputs that reach his ear daily (mp3 team talks) and his voice agent's own system instruction (day_cartridge). The gate is open on a live daily path, reproducibly waves through the exact fabrication class the fix was written to stop, and the repo states the opposite — that is "lying", not merely "broken".

---

## 63. The no_new_numbers validator splits comma-grouped thousands and rejects the whole output — 33,824 Opus tokens discarded on 31 Jul

- **kind:** `broken` · **severity:** `red` · **area:** `dead-and-lying` · **day-one fixable:** yes
- **where:** scripts/brain.mjs:520-524 · scripts/viz.mjs:134-141 · casualty in dressing-room/state/brain_ledger.jsonl @ 2026-07-31T16:30:28.284Z

**Evidence**

> scripts/brain.mjs:520-524 `noNewNumbers` strips only dates and clock times, then matches `/\d+(\.\d+)?/g`. Proof run: `'the wall shows 10,000 tokens'.replace(/\d{4}-\d{2}-\d{2}/g,'').replace(/\d{1,2}:\d{2}/g,'').match(/\d+(\.\d+)?/g)` → `["10","000"]`. The allowed set never contains "000" — allowedNumbers adds `String(v)` for a numeric input (so 10000 → "10000") plus the literals "0"…"31" (brain.mjs:518), and "000" is none of those. Live casualty in dressing-room/state/brain_ledger.jsonl: `{"ts":"2026-07-31T16:30:28.284Z","job":"drill_forge","model":"opus","total_tokens":33824,"ok":false,"error":"validator: invented number: 000"}`. Same regex, same bug, in scripts/viz.mjs:136-139 `validateInsights`, which returns null on any hit — "reject-and-omit", so the wall silently loses all three insight lines.

**Impact**

> Every validated job is one comma away from total loss, and the failure names an invented number that was never invented — the model wrote a number it was given, correctly formatted. On brain jobs the run is discarded after full token cost (33,824 Opus tokens is one confirmed instance; brain.mjs:813's analysis path returns before `writeAtomic`, so nothing is written). On the wall it is worse than loud: viz.mjs:139 returns null and the wall renders without insights, with no line anywhere saying they were rejected. And it compounds with the drift above — brain's set is the loose 0-31 one, so it lets fabrications through while bouncing honest thousands.

**Proposed fix**

> One line in each: strip digit-group separators before extracting, i.e. add `.replace(/(?<=\d),(?=\d{3}\b)/g, "")` to the same strip chain that already removes dates and times, so "10,000" normalises to "10000" and matches the input token. Add the fixture to brain.mjs's selftest next to :1216-1217 — `validateOutput({validate:"no_new_numbers"}, "10,000 tokens", {tokens: 10000}, cfg).ok === true` — because nothing in the suite currently exercises a formatted number, which is why it survived two audits.

**Verifier's note**

> CONFIRMED as a defect, but the headline casualty is REFUTED and the severity is inflated.
> 
> REPRODUCED MYSELF (real exports, not the quoted proof):
> - brain.mjs:520-524 — `validateOutput({validate:'no_new_numbers'}, 'the ledger holds 33,824 tokens', {total_tokens:33824}, cfg)` returns `{"ok":false,"reason":"invented number: 33"}`; the same text without the comma returns `{"ok":true}`. `'5,244 moments'` with `{n:5244}` -> `"invented number: 244"`. So it is worse than described: it usually fails on the LEADING fragment (when that fragment >31), so the error names a prefix of a correct number, not "000".
> - brain.mjs:884 `return { usage: {...ok:false...}, note: "rejected (...) — nothing written" }` — confirmed, returns before writeAtomic at :885. Full token cost already logged.
> - viz.mjs:134-141 identical regex, `return null` at :139; viz.mjs:648 calls it, :672 logs `", N insights"` only when truthy — so a rejection is indistinguishable from "no file". Silent omission confirmed.
> - 6 of 23 jobs carry `validate:"no_new_numbers"` (midday_cartridge, drill_forge, wall_insights, day_cartridge, teamtalk_am, teamtalk_pm), all enabled.
> - brain.mjs:1215-1219 selftest has no comma-formatted fixture; viz.mjs:505-509 likewise. Coverage gap confirmed.
> 
> REFUTED — the 33,824-token casualty is not a false positive:
> - drill_forge's inputs are drills.json / doubt_grammar.json / weaknesses.json. `grep -o "000"` over all three returns ZERO hits; their only values >=1000 are 2026, 8527, 3554. No comma grouping of those can yield the fragment "000" (8,527 would report "527"). A GROUNDED `X,000` was impossible from that input set, so the model almost certainly wrote a genuinely invented round thousand (e.g. "10,000 hours") and the validator did its job — only the message named a fragment.
> - The run was not lost: the ledger shows a same-night retry `{"ts":"2026-07-31T21:11:21.763Z","job":"drill_forge","total_tokens":33854,"ok":true}` and `dressing-room/state/brain_out/drill_forge/2026-07-31.md` exists. Cost was one retry, not the artifact.
> - No comma-grouped number appears in ANY of the six historical wall_insights outputs; 2026-07-29.md writes "620467 tokens" bare. The wall-side loss is latent, never observed.
> - Sub-claim "brain's set is the loose 0-31 one" (implying viz's is stricter) is false: brain.mjs:517 and viz.mjs:131 are the identical `for (let i=0;i<=31;i++) s.add(String(i))`.
> 
> CONFIRMED AND UNDER-STATED (folded into "impact" but is the sharper finding): the 0-31 whitelist passes fabrications — `validateOutput({validate:'no_new_numbers'}, 'you did 29 reps', {reps:9}, cfg)` -> `{"ok":true}`. Against ground truth of 9 reps_log rows, a team talk can invent any number <=31 and ship.
> 
> FIX CORRECTION: the proposed `/(?<=\d),(?=\d{3}\b)/g` breaks Indian lakh grouping — `'1,00,000'` -> `"1,00000"` -> still splits to ["1","00000"]. For a Hinglish user use `/(?<=\d),(?=\d)/g`, which yields "100000". Apply to both strip chains (brain.mjs:522, viz.mjs:138) and add the comma fixture at brain.mjs:1217.
> 
> SEVERITY: across 2,825 brain_ledger rows there are exactly two no_new_numbers rejections ("000" and "34"), both consistent with genuine fabrication; zero confirmed false positives; retries exist and worked. Real, latent, cheap when it fires — yellow, not red.

---

## 64. Eight brain jobs write to directories no line of code opens — 3,116,897 tokens

- **kind:** `unwired` · **severity:** `red` · **area:** `dead-and-lying` · **day-one fixable:** no
- **where:** dressing-room/state/brain_config.json job ids: midday_reread, capsule_premap, lexicon_mine, doubt_clusters, deep_twin, drill_forge, season_review, widget_spec, market_scan · output dirs under dressing-room/state/brain_out/

**Evidence**

> Ledger aggregation over dressing-room/state/brain_ledger.jsonl by job id, cross-checked against a repo-wide grep for each `brain_out/<dir>` in scripts/, .claude/ and brain_config.json inputs: midday_reread→midday 1,121,460 tok · capsule_premap→premap 609,504 · lexicon_mine→lexicon 514,893 · doubt_clusters→doubts 338,141 · deep_twin→twin 238,210 · drill_forge→drill_forge 186,841 · season_review→season 48,781 · widget_spec→widget_spec 46,064 · market_scan→market 13,003. Total 3,116,897. The only brain_out dirs with a real runtime consumer are: nightshift (dugout.mjs:1088, :1128), dugout (hippocampus.mjs:284, nightshift.mjs:577), day_cartridge (dugout.mjs:325), scrimmage (dugout.mjs:364), poster/wall_insights/wall_review/gemini_wall (viz.mjs:618, :647, :655, :666), plus dugout_digest and evening_voice which are consumed only as inputs to other brain jobs (brain_config.json:75, :404-405). dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md:383 already recorded this at 2,129,645 tokens on 31 Jul; the number has grown ~1M since, so nothing shipped.

**Impact**

> Roughly 43% of the LLM budget produces text that reaches nobody — and the most expensive job in the entire organism is one of them: midday_reread burns ~159k tokens per run (7 runs, 1,111,623 tokens since 26 Jul) into brain_out/midday/, which has no reader in scripts/, no reader in .claude/, and is not an input to any other job. Its config note claims "Acts through files only — analysis for the wall and the evening"; the wall reads brain_out/wall_insights, not brain_out/midday. That note is the organ lying about its own wiring.

**Proposed fix**

> Do not wire nine consumers. Disable first, wire deliberately after: set `"enabled": false` on the ones with no named destination (midday_reread, widget_spec, market_scan, season_review) — a config edit, zero code. For the three that clearly SHOULD land somewhere, name the seam: doubt_clusters → doubtminer's tape_room queue, deep_twin → twin.json's market tuning, drill_forge → drills.json via setpiece.mjs. Each is a real feature decision, so surface the list to him rather than picking. And add the structural guard so this cannot recur silently: brain.mjs already knows every job's `out`; a startup check that warns when an `out` dir is neither read by a script nor listed in another job's `inputs` would have caught all nine on the day each was added.

**Verifier's note**

> CONFIRMED, with corrections to the count, the arithmetic, and the fix.
> 
> VERIFIED MYSELF:
> (a) No code reader. `grep -rn "brain_out\|brainOut\|BRAIN_OUT" scripts/ .claude/ hooks/ setup/` enumerates every path construction. Only dirs any runtime opens: nightshift (dugout.mjs:80,:1088,:1128), dugout (hippocampus.mjs:284, nightshift.mjs:577), day_cartridge (dugout.mjs:325), scrimmage (dugout.mjs:364), poster/wall_insights/wall_review/gemini_wall (viz.mjs:618,:647,:655,:666), talk (talk.mjs:32). midday, premap, lexicon, doubts, twin, drill_forge, season, widget_spec, market appear in ZERO .mjs and zero skill. The only brain_out strings in any job's `inputs` are dugout/TODAY.md, dugout_digest/TODAY.md, evening_voice/TODAY.md. Files really exist (premap 5 dated .md, twin 6, market 2) — real output, no destination.
> (b) The scanner is not naively flagging every unread dir: teamtalk_am/teamtalk_pm also have no code reader but reach him as mp3 via `speak_to` -> teamtalkLine() (brain.mjs:876-886, :911-914). Correct exclusion.
> (c) Notes that lie about wiring — three, not one. midday_reread._note "analysis for the wall and the evening": the wall reads brain_out/wall_insights (viz.mjs:647), and evening_voice.inputs are twin.json/slip.jsonl/pitch_read.json/pulse.json. capsule_premap._note "feeds the Gem prompt pack": `premap` occurs in zero .mjs including nightshift.mjs, which builds the cartridge. season_review._note "words the Boot Room's deterministic proposal": bootroom.mjs contains no brain_out reference at all.
> 
> CORRECTIONS:
> 1. Arithmetic stale/understated. All-time ledger aggregation = 3,426,568 for the nine, not 3,116,897. market_scan is 276,781 not 13,003 (scanner counted only the 18 Jul run, missed 1 Aug's 263,778 WebSearch run). Live 7-day: 3,273,067 of 8,253,985 claude tokens = 39.7%, not 43%.
> 2. lexicon_mine must be removed — it is on the already-audited list ("dead regex and unwired output"), and its cause differs anyway: 548,556 of its 560,786 tokens are on FAILED runs (validator "non-verbatim quote"; 2 ok of 117). Removing it leaves genuinely EIGHT jobs / 2,865,782 all-time — the headline "eight" becomes right for the wrong reason. capsule_premap likewise has 185,983 of 609,504 on rejected runs.
> 3. A tenth job exists: deep_reanalysis -> out "reanalysis", enabled, same gap, 0 ledger rows, dir never created.
> 4. "43% of the LLM budget" needs precision: total_tokens = input+output+cache_creation+cache_read (brain.mjs:560); the 31 Jul midday_reread row is in=20 out=4588 tot=560465, i.e. 99% cache — not billed-equivalent. But it IS the exact field windowUsage/headroom sums (brain.mjs:139), so the starvation is real inside the organism's own governor: ONE midday_reread run ate 560,465 of an 800,000-token 5h window capacity (70%) for a file with no reader, while formation_read (the sheet, priority 100) got 103,010 all week and team_sheet.md is still dated 2026-08-01 saying "I don't know you yet".
> 5. The proposed fix is half wrong. Four are DESIGNED to be human-read and say so verbatim in config: doubt_clusters "output is a proposal file; captain batch-glances; nothing auto-writes"; widget_spec "Proposal only — flows into a Claude-Design/Gem session via the captain"; market_scan "Output is a PROPOSAL for OPPONENT_SCOUT.md; never edits canon"; drill_forge "enrichment only". Wiring a code consumer is the wrong seam for those — the defect is that NO SURFACE EVER POINTS AT THE FILE. The one pointer that exists, runJob's note "-> brain_out/<out>/<date>.md" (brain.mjs:886), is dropped by the ledger row literal (brain.mjs:951-960 has no note field) and stdout goes to a hidden window. This finding therefore COMPOUNDS with the already-audited "ledger dropping runJob's note": fixing that makes half of this visible for free. The proposed startup guard is a new feature, out of scope.
> 
> NOT STARVED: physio's gate doubt_clusters {min_capsules:4, min_doubts:60} (physio.mjs:56) is OPEN at today's 4 capsules / 112 doubts. These organs run, succeed, write, and land nowhere. Severity red stands on the governor argument, not the billing argument.

---

## 65. pulse.json's status field is a string literal — the heartbeat can never report anything but "ok"

- **kind:** `lying` · **severity:** `yellow` · **area:** `dead-and-lying` · **day-one fixable:** yes
- **where:** scripts/heartbeat.mjs:191-192

**Evidence**

> scripts/heartbeat.mjs:186-199 `function buildPulse({agents, bus, buckets, ladderCfg, now})` returns an object whose second and third fields are `status: "ok",` (line 191) and `low_confidence: false,` (line 192) — hardcoded, computed from nothing, and buildPulse is the only producer of the file. `agents` (the per-organ exit codes) sits right below them and is never consulted. Live file dressing-room/state/pulse.json line 3: `"status": "ok"`. If all eight agents in the live `order` returned non-zero, the file would still read "ok".

**Impact**

> pulse.json is the heartbeat's public verdict on whether the deterministic squad ran, and its verdict field is a constant. postmatch.mjs:230 reads the file. Anything (or anyone) that branches on `.status` gets a green light unconditionally. The `agents[]` array does carry the truth, so this is a lie by summary rather than by omission — but the summary is the field named `status`.

**Proposed fix**

> Derive it from what is already in scope, one line: `status: agents.every(a => a.ran && a.exit === 0) ? "ok" : "degraded",` and `low_confidence: agents.some(a => !a.ran || a.exit !== 0),`. The staleness map (heartbeat.mjs:194) is also already computed and could feed it. Then assert it — the heartbeat selftest already stubs a failing script (`writeFileSync(join(tmp, "bad.mjs"), "process.exit(3)")` at heartbeat.mjs:214), so the fixture for a degraded pulse exists and is unused for this purpose.

**Verifier's note**

> CONFIRMED as fact, DOWNGRADED on impact. Reproduced myself: heartbeat.mjs:191-192 emits `status: "ok"` and `low_confidence: false` as literals, with `agents` on the next line never consulted. Imported buildPulse and fed it 8 organs all `ran:false` -> returned `status:"ok", low_confidence:false`. Stronger still, the selftest's OWN fixture already lies: `order.map(runAgent)` (heartbeat.mjs:220, using the bad.mjs exit-3 stub at :214 plus a missing ghost.mjs) yields 1/3 organs run, that array flows into buildPulse at :295, and the pulse it builds reads `"status":"ok"` while all 17 checks print ALL CHECKS PASSED. The scanner's fix and its "fixture exists and is unused" observation are both correct.
> 
> THE STATED IMPACT IS WRONG. postmatch.mjs:230 reads pulse.json but uses exactly one field, `pulse.withheld_disclosures` (postmatch.mjs:234) - it never touches `.status`. I grepped every consumer repo-wide: NO deterministic code path branches on pulse.status. physio.mjs:42 monitors pulse.json by mtime cadence (30h), independently and honestly. heartbeat.mjs:334 prints the truthful ok/total count to console. So "anything that branches on .status gets a green light unconditionally" describes a latent trap, not a live failure.
> 
> THE REAL CONSUMER THE SCANNER MISSED (corrects the cause-of-harm, not the claim): three ENABLED LLM jobs ingest the raw object. brain_config.json jobs midday_reread (sonnet, 13:30), evening_voice (OPUS, 21:50), teamtalk_pm (sonnet, 20:40) all list "pulse.json" in `inputs` with enabled:true. brain.mjs:805 does `inputs[name] = readJson(p)` (whole object) and brain.mjs:787 pastes it verbatim as `## INPUT pulse.json`. brain_ledger shows they have genuinely succeeded 4 / 5 / 5 times (last teamtalk_pm 2026-08-01T15:21Z). So a constant field named `status` has reached an Opus prompt. Mitigating: the honest agents[] array sits in the same blob one field below, so an LLM is arguably MORE likely to catch the contradiction than code would be.
> 
> WHY IT IS STILL "LYING" AND NOT WORKING-AS-DESIGNED: {status, low_confidence} is a computed contract everywhere else - calibration.mjs:252-255 walks the three-state ladder (awaiting_data / warming_up / ok), and manager.mjs:159 actively gates on it (`bus.weaknesses.status === "ok" && bus.weaknesses.low_confidence !== true`). Heartbeat is the sole organ wearing that uniform without honoring it. Notably the documented contract for pulse.json (ARSENAL_FC_FULL_REPO_BUNDLE.md:850-853) lists {ran, exit, ms, output_fresh} + staleness + withheld_disclosures and does NOT list status/low_confidence at all - they are undocumented vestigial envelope fields.
> 
> SEVERITY yellow -> note: zero deterministic consumers, truth present one field away in the same object, honest console line, independent staleness alarm in physio, fields absent from the spec. Surviving harm is a latent trap for the next consumer plus mild prompt pollution in three advisory jobs that only ever emit artifacts and never auto-act. Not broken, not starved - a constant mislabelled as a verdict. Fix as proposed (derive from `agents`) is right and is one line.

---

## 66. physio reports status "ok" in the same object where it reports that the organism is bleeding

- **kind:** `lying` · **severity:** `yellow` · **area:** `dead-and-lying` · **day-one fixable:** yes
- **where:** scripts/physio.mjs:417-418

**Evidence**

> scripts/physio.mjs:415-427 returns `status: "ok", low_confidence: false,` (lines 417-418) immediately followed by `bleeds,` (line 420) and `line: bleeds.length ? bleeds[0].line : null` (line 426). Live dressing-room/state/loop_vitals.json: `"status": "ok"` and `"low_confidence": false` sitting directly above a populated `bleeds` array and `"line": "the scout filed a headline no sheet has carried yet."`

**Impact**

> The physio is the one organ the 31 Jul research called the most valuable thing in the repo, precisely because it detects what selftests and exit codes cannot — and its own headline field is a constant that says everything is fine while its body says otherwise. Concretely it leaks into the LLM: talk.mjs:44 pastes `"VITALS: " + clip(readJson(join(STATE_DIR, "loop_vitals.json")), 400)` straight into the prompt, so the model reads `"status":"ok"` next to a bleed and can reasonably repeat "vitals ok" to him. The code consumers dodge it by luck, not design — dugout.mjs:933 and viz.mjs:102 happen to read `.line` and `.bleeds`, never `.status`.

**Proposed fix**

> Same shape as the heartbeat fix and equally local: `status: bleeds.length ? "bleeding" : "ok"` and `low_confidence: bleeds.some(b => b.kind === "stale" || b.kind === "doctor_referral")` — read the kinds actually emitted around physio.mjs:248-343 before choosing the set. Do both organs in one pass; they are the same mistake twice.

**Verifier's note**

> CONFIRMED as a hardcoded constant, with four corrections and a severity downgrade.
> 
> Reproduced: scripts/physio.mjs:415-427 returns `status: "ok", low_confidence: false,` as literals with no branch — `grep -n "status" scripts/physio.mjs` yields exactly one hit in the return object (417), plus unrelated comments at 20/263 and a bootroom-mutation check at 491. Live dressing-room/state/loop_vitals.json carries `"status":"ok"` and `"low_confidence":false` directly above a populated bleeds array (nemesis-to-manager / emitted_unconsumed) and `"line":"the scout filed a headline no sheet has carried yet."` I reproduced talk.mjs:44's clip myself: JSON.stringify is 799 chars, and the first 400 are `{"date":"2026-08-01","status":"ok","low_confidence":false,"generated_at":...,"bleeds":[{"organ":"nemesis→manager","kind":"emitted_unconsumed",...,"line":"the scout filed a headline no sheet has carried yet."}],...` — so status:"ok" and the bleed genuinely arrive in the same prompt block.
> 
> CORRECTION 1 — stronger than claimed on the code side, weaker on impact. There are ZERO readers of this field anywhere in the repo, not "consumers that dodge it by luck." `grep -rn "vitals" --include=*.mjs scripts/ | grep -i "status\|low_conf"` returns only an unrelated brain.mjs:379 comment about token_vitals. Confirmed consumers read other keys only: dugout.mjs:933 `.line`, viz.mjs:102 `.bleeds` (loaded at viz.mjs:593), bootroom.mjs:255-256 `.speak_gates.bootroom_mutation`. ORGANISM_ANATOMY.md:149-153 documents the loop_vitals contract and does not mention status or low_confidence at all — they are undocumented vestigial fields.
> 
> CORRECTION 2 — the scanner misread the house semantics of `status`. In this codebase status/low_confidence is a DATA-SUFFICIENCY pair, not a health verdict: calibration.mjs:29-30 ("0<N<min_reps → status 'warming_up' … N≥min_reps → status 'ok', low_confidence:false"), learning_state.mjs:511 `const low_confidence = status !== "ok";`, and manager.mjs:159/:167 gate downstream trust on `bus.X.status === "ok" && bus.X.low_confidence !== true`. Read that way, physio's "ok" is not a claim that the organism is healthy — the health verdict is `bleeds` + the constitutionally exception-only `line` (physio.mjs:15). It is still a defect, but the precise defect is that physio never computes the pair at all: it cannot report warming_up even when its own inputs are thin (live body_days_seen has 4 entries; signal_table shows two rows still "gated (needs n>=20)"). It is a field with zero information content, not a health alarm stuck on green.
> 
> CORRECTION 3 — the proposed fix is wrong on both halves and would make things worse. `status: bleeds.length ? "bleeding" : "ok"` injects a fourth value into an enum that manager.mjs:159/:167 pattern-matches with `=== "ok"`; nothing gates on vitals.status today, but it corrupts a shared vocabulary. And `low_confidence: bleeds.some(...)` inverts the house meaning outright — low_confidence describes the WRITER's own output confidence, and physio is most confident precisely when it has found a bleed. Correct fix: delete both fields (nothing reads them), or change talk.mjs:44 to project `{line, bleeds, speak_gates}` rather than pasting raw JSON.
> 
> CORRECTION 4 — the claim's premise that "the heartbeat fix" already shipped is false. scripts/heartbeat.mjs:191-192 inside buildPulse still has the identical literal pair `status: "ok", low_confidence: false,`. Both organs are still unfixed; "do both in one pass" is right, but neither pass has happened.
> 
> WIDER (and only) exposure: beyond talk.mjs:44, .claude/skills/matchday/SKILL.md:12-13 instructs Claude to read loop_vitals.json at kickoff, and .claude/skills/talk/SKILL.md:14 likewise — so the raw "status":"ok" also enters skill sessions.
> 
> SEVERITY DOWNGRADE yellow -> note. No code path is wrong; the physio's spoken output (`.line`) and every code consumer are correct. The only exposure is LLM prompt text, and in every one of those paths the contradicting bleed sits in the same context — matchday/SKILL.md:17 even instructs "Physio line ONLY if something bleeds." For a solo user on a sleeping laptop the reproduced harm today is a possible stray "vitals ok" utterance next to visible contradicting evidence. The residual value of fixing is the latent trap: `status` is load-bearing elsewhere in this repo, so anything later wired to vitals.status would read permanent green.

---

## 67. Three selftest assertions that cannot fail — including two in the brand-new conductor

- **kind:** `lying` · **severity:** `yellow` · **area:** `dead-and-lying` · **day-one fixable:** yes
- **where:** scripts/dugout.mjs:1689 · scripts/throwin.mjs:256 · scripts/conductor.mjs:200-202

**Evidence**

> Grep for short-circuit and literal-truth patterns across every selftest found exactly three. (1) scripts/dugout.mjs:1689 `assert("REHYDRATOR: memory cartridge rides in front of the transcript tail", buildConfig(["k1"]).rehydrate === null || true);` — `X || true` is unconditionally true; the trailing comment admits it ("composition is null-safe; content asserted in hippocampus selftest") but the suite still counts it as a pass. (2) scripts/throwin.mjs:256 `assert("corrupt poll line skipped, no crash", true);` — literal. (3) scripts/conductor.mjs:201 `ok("ARM — the live queue is untouched by the selftest (no writes at all)", true);` — literal, and it sits directly under conductor.mjs:200 which reads `brain_queue.json` into `before` and then never compares an after-state; the very next line, conductor.mjs:202 `ok(..., before === null || typeof before.jobs_run === "object")`, also passes whenever `before` is null. Same `A && B || A` family as the 25 Jul finding.

**Impact**

> Three green checks that assert nothing, in a suite whose value proposition is stated as "50 of 50 selftests pass, 1,676 assertions, zero failures". The conductor pair is the live one: conductor.mjs is new, untracked, and about to become the morning's orchestrator — its two claims about not clobbering the live brain_queue are exactly the claims you would want proven before scheduling it, and neither is.

**Proposed fix**

> conductor.mjs is the one that matters — it already reads `before` at line 200, so capture an `after` after the arm call and assert deep-equality on the untouched keys, and drop the `before === null ||` escape hatch by writing a fixture queue instead of tolerating absence. throwin.mjs:256 should assert what its name claims: that `balls.length === 2` survived the `"{corrupt"` line the fixture injects at throwin.mjs:244. dugout.mjs:1689 is honestly labelled as covered elsewhere — either delete it or make it assert `.rehydrate` is a string when a cartridge exists.

**Verifier's note**

> CONFIRMED as three tautologies, but the severity and two of the three sub-claims need correcting. My own grep (independent of the scanner's) found exactly the same three and no more: two literal-true asserts (scripts/conductor.mjs:201, scripts/throwin.mjs:256) plus one `|| true` (scripts/dugout.mjs:1689). Count is accurate.
> 
> WHAT I REPRODUCED
> - `node -e` on the raw expressions: `(null===null||true)` → true, and `({}===null||true)` → true. dugout.mjs:1689 cannot fail for any value of `.rehydrate`. Confirmed.
> - `node scripts/conductor.mjs selftest` → "ALL CHECKS PASSED (15 passed, 0 failed)", with `✓ ARM — the live queue is untouched by the selftest (no writes at all)` and `✓ ARM — jobs_run survives arming` both counted. So 2 of conductor's 15 greens (13%) prove nothing.
> - `node scripts/throwin.mjs selftest` → `✓ corrupt poll line skipped, no crash` counted as a pass.
> 
> WHERE THE CLAIM IS WRONG
> 1. throwin.mjs:256 is NOT an untested claim — it is redundant decoration. The scanner's own proposed fix ("assert balls.length === 2 survived the corrupt line") is already implemented three lines above at throwin.mjs:253 `assert("two new balls ingested", balls.length === 2);`, run against the SAME `poll` fixture that carries `"{corrupt"` at line 244. If `ingest` threw, the suite would die before 256; if it failed to skip, `balls.length` would be 3 and 253 would go red. Coverage exists; only the label is decorative. Cosmetic, not a gap.
> 2. dugout.mjs:1689's alibi mostly holds — hippocampus.mjs:625 does assert cartridge content (`"REHYDRATOR: identity + who + episodes in ONE cartridge"`). The one thing genuinely uncovered is the ORDERING its name claims ("rides in front of the transcript tail"), i.e. the array order at dugout.mjs:1335 `[buildRehydrateCartridge(), buildRehydrate()].filter(Boolean).join("\n\n") || null`. Trivial.
> 3. The scanner UNDER-states the real defect at conductor.mjs:202 by framing it as the `before === null ||` escape hatch. On this machine that hatch is inactive — brain_queue.json exists and `typeof jobs_run === "object"` (keys: observed_window_ceiling, jobs_run, last_tick, jobs_failed, triggers, mouth_said). The actual defect is worse and more precise: the block at conductor.mjs:198-203 NEVER CALLS `armTrigger` at all. It asserts a property of the file already on disk, not of the function. The check named "jobs_run survives arming (read-modify-write, not overwrite)" would pass identically if `armTrigger` were `writeFileSync(p, "{}")`. And `before`, read at line 200, is a dead read — never compared to any after-state.
> 
> WHY SEVERITY DROPS TO NOTE
> No behaviour is actually wrong today; I verified both underlying properties myself rather than trusting them.
> - Merge, not clobber: copied brain_queue.json to a temp dir and called `armTrigger("morning_signals","test",tmp)` → `jobs_run preserved: true`, `last_tick preserved: true`, trigger written correctly. armTrigger genuinely does read-modify-write.
> - No writes: md5 of dressing-room/state/brain_queue.json identical before and after `conductor.mjs selftest` (37d91d28b71b6c78bec6f8b21f190009 both times), and conductor.json was ABSENT before and still ABSENT after — the `dry: true` base plus injected `run`/`arm` means nothing reaches disk.
> So all three tautologies assert things that happen to be TRUE. The exposure is purely regression-undetected: a future edit that makes armTrigger clobber brain_queue.json would sail past a green suite. That is a maintenance-net gap, not a live defect.
> 
> The "about to be scheduled" urgency is also overstated: `schtasks /query` returns no Conductor task, and `git status --short` shows `?? scripts/conductor.mjs` — untracked and unscheduled. Real, worth fixing, but note-grade for a solo user on a sleeping laptop.
> 
> CORRECTED FIX: in conductor.mjs, drop the dead `before` read and instead point `armTrigger` at a temp fixture dir (it already takes `dir` as its third parameter — `armTrigger(name, reason, dir = STATE_DIR)` at conductor.mjs:78), seed a queue with a known `jobs_run`, arm it, and assert jobs_run survived and `triggers.morning_signals.ts` appeared. That proves both claims without touching live state and removes the null escape hatch. throwin.mjs:256 should simply be deleted (253 already covers it). dugout.mjs:1689 should either be deleted or assert the ordering at line 1335 that its name actually claims.

---

## 68. lexicon_mine has been rejected on every single run since 26 July — 11 runs, 0 successes, 502,663 tokens

- **kind:** `broken` · **severity:** `yellow` · **area:** `dead-and-lying` · **day-one fixable:** yes
- **where:** scripts/brain.mjs:534-539 (quotes_only) · brain_config.json job `lexicon_mine` · dressing-room/state/brain_ledger.jsonl

**Evidence**

> Ledger aggregation over brain_ledger.jsonl restricted to ts > 2026-07-26: `lexicon_mine n=11 ok=0 tok=502663`, every failure a `validator: non-verbatim quote:` rejection (samples: `" (4× · context+emb`, `" (×4) — strongest`). The validator is scripts/brain.mjs:534-539 `job.validate === "quotes_only"`, which requires every quoted segment ≥12 chars to appear verbatim in `JSON.stringify(inputData)`. The model is quoting his phrase and then appending its own annotation inside the same quote marks, so the whole output is discarded before the write. Mechanically distinct from the already-known lexicon_mine dead-regex / unwired-output finding: that one is about where the output goes, this is about the output never surviving to be written at all.

**Impact**

> Half a million tokens in seven days on a job with a 0% success rate, and the attempt guard does not save it: max_attempts is per shift, so it retries fresh every night. Because the failure mode is a validator reject rather than a crash, nothing surfaces — `node scripts/brain.mjs status` reports `health OK — 1 failure(s) at the tail of the last 25 call(s)` because the tail happens to be other jobs. The lexicon is his spoken-anchor vocabulary; it has gained nothing in a week.

**Proposed fix**

> The validator is right and the prompt is wrong — it asks for verbatim anchors and the model answers with annotated anchors. Fix the contract, not the guard: state the output shape explicitly (one quoted span per line, nothing inside the quote marks that is not his), and have buildAnalysisPrompt (brain.mjs:783) append that requirement automatically for `validate === "quotes_only"` jobs the way it already appends the general LAWS block. Independently: a job at 0-for-11 should stop trying. brain.mjs already counts attempts per shift (`attemptsOn`, :454) — extend that to a rolling multi-day kill switch so a deterministically-failing job goes quiet instead of billing nightly.

**Verifier's note**

> CONFIRMED as a real, live defect — but the scanner's root cause and primary fix are both wrong, and its numbers are slightly off.
> 
> WHAT I REPRODUCED
> Ledger aggregation over C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\brain_ledger.jsonl (2,836 rows):
> - lexicon_mine all-time: n=117, ok=2, fail=115, 560,786 tokens. Last success 2026-07-18T19:24:13Z.
> - Since 2026-07-26: n=12 (not 11), ok=0, total_tokens=548,556 (not 502,663 — io 17,200 + cache_create 101,272 + cache_read 430,084). It is the #4 token spender of the last 7 days (haiku_pulse 2.54M, midday_reread 1.11M, capsule_premap 560K, lexicon_mine 549K) out of 8.29M org-wide.
> - All 12 errors are `validator: non-verbatim quote:`.
> - Hard confirmation the write never lands: dressing-room\state\brain_out\lexicon\ contains exactly two files, 2026-07-18.md and 2026-07-19.md. Nothing since 19 July, across 115 failures.
> - Retry guard confirmed useless: scripts\brain.mjs:67 `max_attempts_per_shift: 3`, and attemptsOn (scripts\brain.mjs:454) keys jobs_failed by SHIFT DAY. Ledger shows exactly 3 attempts on 7/31 and 3 on 8/1 — it burns three full Sonnet calls every night and resets.
> - Silence confirmed by running it: `node scripts/brain.mjs status` → "brain: health OK — 0 failure(s) at the tail of the last 25 call(s)."
> 
> NOT STARVED. dressing-room\state\lexicon.json is fresh (generated_at 2026-08-01T16:15:02Z) with 25 real anchors and counts. The input is present and good; the organ is broken downstream of it.
> 
> THE STATED CAUSE IS WRONG. The scanner says "the model is quoting his phrase and then appending its own annotation inside the same quote marks." It is not. Every one of the 12 error strings begins with a quote character immediately followed by the annotation — `" (4× · context+embeddings+inference+tok…"`, `" — 4/4 sources, count 4 — your highest-…"`, `"\n\n**Count 3 (cross-source, safe to reus…"`. That is the signature of the validator mis-pairing quote marks, not of the model mis-writing them.
> 
> The actual mechanism, at scripts\brain.mjs:536:
>     for (const m of String(text).match(/"([^"]{12,})"/g) || []) {
> The 12-character floor is inside the pairing regex. When the model quotes an anchor SHORTER than 12 chars, the regex skips that opener, desyncs, and pairs the anchor's CLOSING quote with the NEXT anchor's OPENING quote — capturing the annotation between them as if it were a quoted span. That text is of course not verbatim in the input, so the whole output is discarded. Reproduced directly:
>     node -e "console.log(JSON.stringify('- \"business cliffhanger\" (4x) - strongest\n- \"reed\" (3x) - next\n- \"diagram poore concept ki reed\"'.match(/\"([^\"]{12,})\"/g)))"
>     → ["\"business cliffhanger\"","\" (3x) - next\n- \""]
> And the job is unwinnable by construction, because his own lexicon contains sub-12-char anchors — "one picture" (11), "tera finops" (11), "naya sawaal" (11), "yahi decide" (11), "ai proposes" (11), "yaad nahi -" (11), "pehle saare" (11). Quoting the shortest of his own anchors verbatim — precisely what the job exists to do — guarantees rejection. Note the two July-17-era failures were a genuinely different mode (`non-verbatim quote: "whole game, one mechanism/breath"` is a real invented phrase); every failure since 26 July is this desync.
> 
> FIX CORRECTION. The scanner's fix ("the validator is right and the prompt is wrong") is backwards. The validator is wrong. Pair quotes sequentially — split on the quote character and treat odd-indexed segments as quoted spans, then apply the ≥12-char verbatim check to those segments only — instead of a regex whose length floor silently desyncs the pairing. A prompt-shape constraint would incidentally mask it (with no ≥12-char text between quotes there is nothing for the desync to capture) but it is fragile and it strips the count/source annotations that make the output useful. The scanner's SECOND proposal — a rolling multi-day kill switch on top of the per-shift attemptsOn — is sound and worth keeping regardless.
> 
> SEVERITY. yellow is right, not inflated and not understated: no wrong output reaches him (deterministic lexicon.json still populates, so his anchor vocabulary is intact), but ~549K tokens in seven days against a plan that has already been hit, three silent calls per night, an organ dead for two weeks, and a failure mode that can never self-heal because the guard resets daily. Kind "broken" is correct — it is not starved, not unwired, not waiting.

---

## 69. The hype-phrase guard is applied to machine-side analysis jobs, where the banned words are legitimate technical vocabulary

- **kind:** `broken` · **severity:** `yellow` · **area:** `dead-and-lying` · **day-one fixable:** yes
- **where:** scripts/brain.mjs:526-528 · cfg.guards.banned_phrases in dressing-room/state/brain_config.json

**Evidence**

> scripts/brain.mjs:526-528 `validateOutput` runs `bannedPhraseCheck(text, cfg.guards.banned_phrases)` on EVERY job unconditionally, before any per-job `validate` key is consulted. Ledger, since 26 Jul: `capsule_premap n=12 ok=8 tok=559651` with `2x validator: banned phrase: exponential` and `2x validator: banned phrase: 10x, exponential`. Across the full ledger the same guard also killed 6 runs on `exponential`, 4 on `10x, exponential`, 2 on `10x`.

**Impact**

> A third of capsule_premap's runs are discarded for using a word that is correct in its own subject matter — the premap reasons about attention and scaling, where "exponential" is a real claim about complexity, not hype. The guard was written for the captain-facing voice (no hype-man, per CLAUDE.md's working-style rules) and is being enforced on machine-to-machine analysis he never reads. Cost so far sits inside 559,651 tokens on that job alone, and the rejected output is written nowhere.

**Proposed fix**

> Scope the guard to jobs that actually reach him. The config already distinguishes them — every spoken/served job carries `speak_to` or is consumed by the Dugout cartridge; the mining jobs do not. Gate it: apply bannedPhraseCheck only when `job.speak_to || job.validate === "no_new_numbers"` (the sheet/cartridge/teamtalk class), and leave analysis-class output alone. Do not simply delete "exponential" from the list — it is the right guard on the mp3 he wakes up to.

**Verifier's note**

> MECHANISM CONFIRMED, IMPACT AND FIX BOTH WRONG.
> 
> WHAT I REPRODUCED
> 1. brain.mjs:526-528 — `validateOutput` calls `bannedPhraseCheck(text, cfg.guards.banned_phrases)` unconditionally, before any per-job `validate` branch. True as claimed.
> 2. bannedPhraseCheck (line 505-508) is a naive lowercase `includes()`, so "exponential" also catches "exponentially"/"exponent" and "10x" catches any substring.
> 3. Direct call against the live config reproduces the misfire on legitimate subject vocabulary:
>    validateOutput({validate:null}, "Probe angle: softmax normalises by the exponential of each score, so attention cost grows quadratically.", {}, cfg)
>    -> {"ok":false,"reason":"banned phrase: exponential"}
>    Softmax *is* an exponential. The organism's entire syllabus is transformers. This word will keep firing forever.
> 4. brain.mjs:884 — on rejection: `return { usage: {...r, ok:false, error:"validator: "+v.reason}, note: "rejected ("+v.reason+") — nothing written" }`. The text is genuinely destroyed after the tokens are spent.
> 5. Ledger scan (dressing-room/state/brain_ledger.jsonl, 2,837 rows): exactly 12 banned-phrase rejections — capsule_premap 10 (5 "exponential", 3 "10x, exponential", 2 "10x"), deep_twin 1, lexicon_mine 1. Measured cost 185,983 tokens (four Jul-29/30 premap rows at ~46k each; the six Jul-17/20 rows ledger tok=0, pre-cache-accounting).
> 
> WHAT I REFUTE IN THE OFFERED EVIDENCE
> - "capsule_premap n=12 ok=8 tok=559651" is not in the ledger. Actual: n=101, ok=15, tok=609,504, spanning 2026-07-17 to 2026-07-31 (9 days).
> - "A third of capsule_premap's runs are discarded" is false. 10/101 = 10% of runs. The honest version: of the 25 runs where the CLI actually returned text, 76 of 101 being `is_error` API failures, 10 were killed by this guard = 40% of landed calls. Directionally right, arrived at wrongly.
> - The dominant capsule_premap failure mode is not this guard at all; it is 76 API errors (75%). Fixing the guard leaves capsule_premap still mostly broken.
> 
> WHY THE PROPOSED FIX IS WRONG
> The claim asserts "the config already distinguishes them — every spoken/served job carries `speak_to` or is consumed by the Dugout cartridge". It does not.
> - formation_read — THE SHEET he actually reads — has `kind: "manager_m3"` and no `validate`/`speak_to`. It short-circuits at brain.mjs:821-870 and RETURNS at line 866, before validateOutput is ever called at line 883. The banned-phrase guard already does not protect the sheet; manager.mjs runs its own validator. So the claim's closing line ("it is the right guard on the mp3 he wakes up to") is only true for teamtalk_am/teamtalk_pm.
> - evening_voice (model opus, at 21:50, out=evening_voice) has NEITHER `speak_to` NOR `validate`. The proposed gate `job.speak_to || job.validate === "no_new_numbers"` would strip the hype guard from it — and from dugout_digest, midday_digest, doubt_clusters, and season_review. That is the opposite of the intent.
> 
> CORRECT SHAPE OF THE FIX
> Make the intent explicit rather than inferred: an opt-out flag on the mining jobs (e.g. `hype_guard: false` on capsule_premap / deep_twin / lexicon_mine / doubt_clusters), or a positive `voice: true` on the ones he hears. Separately, "exponential" is simply a bad entry for this codebase's subject matter — the substring test makes it unfixable in place; drop it and keep "10x", "on steroids", "god-tier", "time is short".
> 
> SEVERITY: yellow -> note.
> - Volume is tiny: 12 events in 9 days of ledger, 185,983 measured tokens on a Max subscription.
> - It is swamped 8:1 on the same job by API errors.
> - The destroyed output goes nowhere anyway: `grep -rn premap --include=*.mjs` returns NO script consumer for brain_out/premap (only docs, brain_config, brain_queue and the output files themselves). Same for evening_voice — zero hits in scripts/. The guard is discarding output that already reaches nobody, which is a separate unwired finding, not an argument for raising this one.
> This is a real design defect that will recur, and it is cheap and correct to fix — but it is a note, not a yellow, for a solo user on a laptop.

---

## 70. organism_live_demo.mjs — a 1,325-line dead fork of dugout.mjs, still carrying the security guard the live file lacks

- **kind:** `dead-code` · **severity:** `yellow` · **area:** `dead-and-lying` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\organism_live_demo.mjs (whole file, 1,325 lines)

**Evidence**

> The file's own header (scripts/organism_live_demo.mjs:3) reads `dugout.mjs · ARSENAL AI FC — THE ORGANISM: THE DUGOUT (metamorphosis chamber)` — a copy that was never renamed internally. Invocation scan: `organism_live_demo.mjs — NO CODE REFERENCE`; no scheduled task, no package.json entry, no .claude skill. It duplicates live logic under drifted line numbers: loadDayCartridge at :206 vs dugout.mjs:325, buildProactivitySection at :363 vs dugout.mjs:540, localDate at :171 vs dugout.mjs:290, the shadow spawn at :1229 vs dugout.mjs:2816. dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md:304-308 records the inversion: the dead fork carries an Origin/CSRF guard at :1250-1260 that the live dugout.mjs POST handler does not.

**Impact**

> 1,325 lines of unreachable code that reads as live (its header names it dugout.mjs), so every grep for a Dugout behaviour returns two answers and the stale one looks authoritative. It also pollutes this exact kind of audit — my own state-file consumer map initially credited organism_live_demo.mjs as a writer of calibration.json, scout.json and tape_room.json, which would have read as single-writer-law violations. And it holds the only copy of a security fix that belongs in the live file.

**Proposed fix**

> Order matters: port the Origin guard from organism_live_demo.mjs:1250-1260 into the live handler at scripts/dugout.mjs:~2873 FIRST, verify it with a Dugout session, and only then delete the fork. Deleting first loses the one thing in it that is ahead of production. Nothing imports it, so removal is a clean `git rm` with no call-site work.

**Verifier's note**

> REAL but over-framed, and it bundles two findings of very different weight into one.
> 
> WHAT REPRODUCED (mine, not the scanner's):
> 1. Dead: `grep -rn "organism_live_demo"` over the whole tree hits only .git/index, the generated ARSENAL_FC_FULL_REPO_BUNDLE.md dump, and dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md. package.json:24 has "dugout": "node scripts/dugout.mjs" and no demo entry; the organism:selftest chain at package.json:17 lists 35 selftests and does not include it; `schtasks /query` has no Dugout/demo task at all (the Dugout is hand-started). wc -l = 1325. Confirmed unreachable.
> 2. Header: scripts/organism_live_demo.mjs:3 does say `// dugout.mjs · ARSENAL AI FC — THE ORGANISM: THE DUGOUT (metamorphosis chamber)`. Confirmed.
> 3. Line drift confirmed exactly: loadDayCartridge demo:206 / dugout.mjs:325; buildProactivitySection demo:363 / dugout.mjs:540.
> 4. Security gap confirmed independently: scripts/dugout.mjs:2873-2881 does `let raw=""; for await (const c of req) raw+=c; const body = raw ? JSON.parse(raw) : {};` then dispatches /tool with NO Origin, Referer or content-type check. `grep -in "origin|csrf|referer" scripts/dugout.mjs` returns only a cookie comment (:2840) and a chrome-flags log line (:2968) — no guard. `git log -S "cross-origin POST refused" --all --name-only` proves the guard string entered the repo in exactly one commit (34aeba6, the E2E audit) and exactly one file, organism_live_demo.mjs — it was NEVER in the live file, so this is a fix that never crossed over, not a regression. The LAN gate at dugout.mjs:2833 (`allowed = !lanMode || isLoopback || hasKey`) is not a substitute: in default non---lan mode it is unconditionally true. A page in his browser can POST Content-Type:text/plain with a JSON body (preflight-free simple request; the server ignores content-type) and drive /tool, whose handlers shell capture/postmatch/bootroom/doubtminer/hippocampus. Response is CORS-blocked but the side effect lands.
> 
> WHAT I REFUTE — the claim's evidence is selectively quoted:
> - It quotes line 3 and stops. It omits scripts/organism_live_demo.mjs:64-72, a loud block titled "SANDBOX (E2E audit 25 Jul 2026)" reading: "This file is an unreferenced FORK of dugout.mjs — nothing in the repo, the launchers, package.json or the schedule invokes it... It now lives in its own sandbox: its own port, its own state dir. Nothing it does can touch the captain's real bus. (The file is kept, not deleted — layering, never replace.)" A reader reaching line 64 cannot mistake this for live. The "every grep returns two answers and the stale one looks authoritative" impact does not survive that disclaimer.
> - The single-writer-pollution impact is REFUTED at source: :74 `const STATE_DIR = join(REAL_STATE, "demo_sandbox")`, :82 `const PORT = 4134; // NOT 4114 — the real Dugout owns that`, and its own assert at :788 "SANDBOXED: never binds the real Dugout's 4114 and never writes the real state dir". It cannot write calibration.json/scout.json/tape_room.json — only demo_sandbox copies. That was already fixed by the prior audit; the scanner mis-mapped it and then blamed the file for its own mis-map.
> - The fix is wrong at the second step. `git rm` contradicts CLAUDE.md's non-negotiable "Layering, never replace" AND the file's own recorded decision at :72. A prior audit deliberately chose keep+sandbox. Correct remedy, in order: (a) port the Origin guard from organism_live_demo.mjs:1250-1260 into scripts/dugout.mjs:2873 (this is the only part that matters); (b) fix line 3's header to name itself and point at the sandbox note — a one-line edit that kills the whole "reader trap"; (c) optionally move to archive/, with the captain's approval, never a silent delete.
> 
> SEVERITY: demoted yellow -> note for the finding AS SCOPED (WHERE = the dead fork, KIND = dead-code). Zero runtime effect, zero state reach, self-documented, deliberately retained under a stated repo law, and already written up as items #380/#420 in the repo's own dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md. For a solo user on a laptop, 1,325 sandboxed, self-labelled lines are housekeeping.
> 
> DO NOT LOSE THIS: the genuine yellow inside this claim is a DIFFERENT finding at a different address — scripts/dugout.mjs:2873, missing Origin/CSRF guard on the POST tool router, verified above and unfixed. It should be split out and tracked as its own security finding rather than filed under the dead fork's line count; otherwise demoting the fork demotes the real bug with it.

---

## 71. deep_reanalysis would spend Opus reading three files that have never existed

- **kind:** `waiting` · **severity:** `yellow` · **area:** `dead-and-lying` · **day-one fixable:** yes
- **where:** dressing-room/state/brain_config.json (job deep_reanalysis) · scripts/brain.mjs:797-808 · scripts/brain.mjs:783-789

**Evidence**

> brain_config.json job `deep_reanalysis` declares `"inputs": ["season.json", "notebook.json", "slip.jsonl", "mutations.jsonl", "doubt_grammar.json", "learning_state.json"]` and `"model": "opus"`. Three of those six do not exist: `ls dressing-room/state/{season.json,notebook.json,mutations.jsonl}` → all `No such file or directory`. scripts/brain.mjs:797-808 `gatherInputs` maps a missing path to `null` (`.jsonl` → empty array, `.json` → readJson → null) with no warning, and brain.mjs:787 `buildAnalysisPrompt` renders it as `## INPUT season.json` followed by `null`. The job has never fired — there is no `dressing-room/state/brain_out/reanalysis/` directory — because it is `"trigger": "reanalysis"` and its arming path is postmatch, which has never run.

**Impact**

> Half the evidence base of the organism's deepest, most expensive re-read is structurally absent, and the job would run anyway and produce a confident narrative from nulls. Its declared `out` is `reanalysis`, which nothing reads either. This is the general shape of the silent-null problem: gatherInputs has no notion of a required input, so any job can lose most of its evidence and still bill full price and report ok.

**Proposed fix**

> Two things, both cheap. (1) Make gatherInputs honest: count how many declared inputs resolved to null/empty and, when it is a majority, refuse the job and log `skipped: N/M inputs absent` to the ledger instead of calling the model — this protects every job, not just this one. (2) This job's inputs will start existing the moment postmatch runs (season.json, notebook.json) and the boot room files a mutation (mutations.jsonl), so it is genuinely waiting rather than broken — leave `enabled` as is and let the guard from (1) do the refusing.

**Verifier's note**

> REAL — mechanism reproduced end to end, but the severity, the impact story, and the fix are all wrong.
> 
> VERIFIED MYSELF:
> - brain_config.json job deep_reanalysis: "model":"opus", "trigger":"reanalysis", "out":"reanalysis", 6 inputs. `ls` confirms season.json, notebook.json, mutations.jsonl absent; slip.jsonl (10,624 B), doubt_grammar.json, learning_state.json present.
> - scripts/brain.mjs:797-808 gatherInputs — pure, no existsSync check for .json/.jsonl, no warning. readJson (brain.mjs:122) returns null on missing; readLines returns []. brain.mjs:787 buildAnalysisPrompt renders `## INPUT ${k}\n${clip(v)}`; clip (brain.mjs:723) on null → the literal string "null" (I ran it: `[null] [[]]`).
> - brain_ledger.jsonl: deep_reanalysis = 0 rows out of 2,825. No dressing-room/state/brain_out/reanalysis/ directory. grep across all .mjs finds no consumer of that output — only docs (THE_BRAIN_HOW_IT_THINKS.md:174, ORGANISM_LEDGER.md:172).
> 
> CORRECTION 1 — severity is inflated; downgrade yellow → note. The job has never fired and structurally cannot fire on its own yet. The only automatic arming path is postmatch.mjs:259-262, gated at line 258 on `newSeason.matches_played % 30 === 0 && WON_DAY.has(hit)`. season.json does not exist, so matches_played is 0 — the first auto-arm is 30 postmatch runs away. And postmatch.mjs:256-258 writes SEASON and NOTEBOOK unconditionally on EVERY run, so by the time the trigger can ever be armed automatically, 2 of the 3 "never existed" files necessarily exist. Only mutations.jsonl (written by bootroom.mjs:45) stays conditional. Firing it today requires the captain typing `brain trigger reanalysis` by hand. Zero Opus has been spent; zero can be spent by the machine. "waiting" is the right kind, but this is a note, not a yellow.
> 
> CORRECTION 2 — the impact claim is refuted by the artifact. "would produce a confident narrative from nulls" is not what the organism does. teamtalk_am runs on 3-of-4 absent inputs and I read its output: dressing-room/state/brain_out/teamtalk_am/2026-08-01.md line 13 reads "Baaki sab quiet hai — season aur match record se koi naya signal nahi aaya, toh us par kuch bolne ka nahi." The LAWS line in buildAnalysisPrompt (brain.mjs:783, "if the data is thin say so plainly") is doing real work. The nulls cost tokens and dead prompt surface, not fabricated confidence.
> 
> CORRECTION 3 — the proposed fix is broken on its own target. "refuse when a majority of declared inputs resolved null" — deep_reanalysis is 3 of 6 absent, exactly 50%, NOT a majority, so the guard written for this job would not fire on this job. Worse, it would fire on the live ones: teamtalk_am is 3/4 = 75% absent and has 85 successful runs producing the morning team talk; refusing it silently kills a daily ritual that currently degrades gracefully. The correct shape is a per-input `required: true` flag in brain_config.json, plus recording the absent-input count in the ledger row so the spend is visible — not a ratio heuristic.
> 
> WHERE THE FINDING SHOULD ACTUALLY POINT (I scanned every job's declared inputs against disk): 8 enabled jobs declare inputs that do not exist, and 7 of them RUN — teamtalk_am (sonnet, 85 ledger rows, 3/4 absent: post_match/TODAY.md, season.json, notebook.json, ~45k tok and ok:true every single run), season_review (OPUS, 17 rows, 2/4 absent: season.json, mutations.jsonl), teamtalk_pm (209 rows, season.json), day_cartridge (87 rows, 2/4), dugout_digest, midday_digest, midday_cartridge. That is where real money has already been spent on null inputs. deep_reanalysis is the one job in the list that has never spent a rupee.

---

## 72. selfknowledge.mjs runs on a schedule to produce an 88KB file both of whose consumers were deleted on 29 July

- **kind:** `unwired` · **severity:** `yellow` · **area:** `dead-and-lying` · **day-one fixable:** no
- **where:** scripts/selfknowledge.mjs:32 · scripts/dugout.mjs:1280 (the deleted consumer) · scheduled task \ArsenalFC-SelfKnowledge

**Evidence**

> scripts/selfknowledge.mjs:32 `const SELF = join(STATE, "organism_self.md");` and :18 "WRITES: dressing-room/state/organism_self.md (own file). Metered to brain_ledger." Repo-wide grep for `organism_self` outside that file returns only scripts/dugout.mjs:1280 — a tombstone comment: "selfKnowledgeBlock() lived here until 29 Jul 2026. It pasted organism_self.md…" — and dugout.mjs:1323 saying the same. The file is 88,950 bytes, last written 29 Jul 19:55. The task `\ArsenalFC-SelfKnowledge` is still installed (`cmd /c cd /d C:\Users\nikhi\GitHub\arsenal-ai-fc && node scripts\selfknowledge.mjs`) and the ledger shows `selfknowledge n=5 tok=80078`. Already recorded at dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md:382 on 31 Jul and unfixed since.

**Impact**

> A scheduled LLM job whose entire product has no reader. Distinct from the two selfknowledge items already in flight (the stderr swallow at :108 and the un-runnable task settings) — those are about whether it runs; this is about the fact that it should not, until something consumes it. Every run bills tokens for a file nothing opens.

**Proposed fix**

> His call, not a mechanical fix — the organ was deliberately unhooked from the Dugout on 29 Jul because 88KB pasted into every Gaffer session was too expensive (dugout.mjs:1323 cites ~22,000 tokens). The question is whether the self-portrait comes back in a cheaper form (a 30-line digest the cartridge can carry) or the organ retires. Until he answers, disable the scheduled task — that stops the bleed today without deleting code, matching the repo's layering rule (freeze, don't remove).

**Verifier's note**

> CONFIRMED as unwired, with one factual correction to the impact. Reproduced myself: unrestricted `grep -rl "organism_self" .` (minus .git/node_modules) returns 7 paths and NOT ONE is a consumer — .gitignore, ARSENAL_FC_FULL_REPO_BUNDLE.md, the 31 Jul research doc, afferent.jsonl + its .bak (the audit's own observation logs), scripts/dugout.mjs (two tombstone comments only, :1280 and :1323), and scripts/selfknowledge.mjs itself (the writer, :32). Zero readers. dugout.mjs:1298 still claims `brief-club/brief-brain get the LIVE self-knowledge appended` but :1300 is `const liveKnowledge = "";` — the briefing path is dead too. Both deletions verified by git: 786e697 (2026-07-29 20:39 +0530) and 5893379 (2026-07-29 21:10 +0530). File is 88950 bytes, mtime Jul 29 19:55, self-stamped 2026-07-29T14:25:37.735Z. Task \ArsenalFC-SelfKnowledge is `Scheduled Task State: Enabled`, Weekly SUN 04:00, `node scripts\selfknowledge.mjs`.
> 
> CORRECTION — "Every run bills tokens for a file nothing opens" is false today. schtasks /v shows `Last Run Time: 26-07-2026 04:00:00`, `Last Result: 1`, `Next Run Time: 09-08-2026`. Today IS its scheduled day (Sun 2 Aug) and it never fired — Last Run Time never advanced and Next Run already rolled a week. The 5 brain_ledger rows (80,078 tok lifetime, matching the claim's arithmetic but not its story): three hand runs on 18 Jul while consumers were still alive; ONE scheduled firing 2026-07-25T22:30Z (=26 Jul 04:00 IST) which failed with `Command failed: claude -p --output-format json --model opus`, 0 tokens; and one hand run 2026-07-29T14:25Z (19:55 IST) — 44 minutes BEFORE the first deletion commit at 20:39. The only scheduled execution in the task's life burned zero tokens and exited 1. Current bleed = 0 tokens/week, because the already-audited `Stop On Battery Mode, No Start On Batteries` prevents 04:00 starts on a sleeping laptop.
> 
> THE REAL HAZARD IS ORDERING, NOT SPEND. The two selfknowledge items already in flight (the :108 stderr swallow, the un-runnable task settings) are precisely the fixes that make this job start succeeding — landing either arms a dormant task into a live weekly ~29k-token Opus call with no reader. And nothing throttles it: selfknowledge is NOT in brain_config.json; it shells `claude -p` directly at selfknowledge.mjs:103 and self-meters at :118, bypassing brain.mjs's budget gate entirely.
> 
> KIND: unwired is exact. Not broken (the 29 Jul hand run produced 88,950 valid bytes), not starved (its input is source code, always abundant), not waiting — the consumers were deliberately removed and nothing replaced them.
> 
> SEVERITY: yellow, but only because of the coupling. On standalone current impact — a dormant weekly task on a laptop that sleeps — it is a note. I keep yellow because the in-flight repairs would arm it.
> 
> FIX: the proposed fix is correct but needs sequencing. Disable \ArsenalFC-SelfKnowledge BEFORE the task-settings fix lands, not after; freeze the code per the layering rule; the captain decides whether the self-portrait returns as a cheap digest the cartridge can carry, or retires.

---

## 73. Full 56-script invocation inventory — the complete (a)/(b)/(c)/(d)/(e) answer

- **kind:** `dead-code` · **severity:** `note` · **area:** `dead-and-lying` · **day-one fixable:** yes
- **where:** C:\Users\nikhi\GitHub\arsenal-ai-fc\scripts\ (56 .mjs) · dressing-room\state\heartbeat_config.json · .claude\settings.json · .mcp.json · .github\workflows\awayday.yml

**Evidence**

> Method: full `schtasks /query /fo csv /v` dump filtered to ArsenalFC-*, package.json scripts block, .mcp.json, .claude/settings.json hooks, .claude/skills/*, .github/workflows/, setup/*.ps1|*.cmd, plus a per-file scan classifying every cross-reference as IMPORT / SPAWN / conductor-args / prose-ref. (a) SCHEDULED TASK: brain, bootroom, calibration, capture, context, cortex, distiller, dmn, doubtminer, examiner, fsrs, heartbeat, hippocampus, learning_state, mirror, nemesis, nightshift, oura_coach, physio, presence, scorer, scout, selfknowledge, setpiece, sprintsync, thalamus, throwin, timeaudit, tone, touchline, turnstile, twin, viz. (b) INVOKED BY ANOTHER SCRIPT (import or spawn, not prose): claudegen (council:39, dmn:52, nightshift:63, thalamus:777), council (cortex:38), fuelboard (council:40, dmn:53, dugout:69/2905/2911, nightshift:64), hippocampus (9 importers), manager (brain:47), speak (brain:892, dugout:231/251, talk:26), shadow (dugout:2816, postmatch:269), capture (throwin:429, turnstile:74, heartbeat order), capsule_bridge + shipped (heartbeat_config order — live pulse.json lists both as agents), calibration/fsrs/nemesis/learning_state/timeaudit (heartbeat order), examiner (dugout:71), tone (dmn:54, dugout:74, nightshift:65, presence:25), oura_auth (oura_coach:696), postmatch (brain.mjs:262 SPAWN via the bell). (c) PACKAGE.JSON ONLY: repo_bundle (`bundle` + setup/launchers/ARSENAL 9…cmd), postmatch, shipped, dugout, talk, conductor, test_coach_v2 (squad:selftest harness), groundsman + awayday (selftest only; awayday additionally .github/workflows/awayday.yml). (d) SKILL / HOOK: learnstate + teaching_contract + forge_session (.claude/settings.json SessionStart/UserPromptSubmit), mcp-memory (.mcp.json). (e) NOTHING: course.mjs and organism_live_demo.mjs — both reported above as their own findings. limits.mjs (209 lines, untracked, 1 Aug) has no task, no package.json entry, no skill and no importer; conductor.mjs is package.json-only and not yet scheduled — both are in-flight work rather than rot, but neither is reachable by the running system today.

**Impact**

> Establishes that exactly two of 56 scripts are unreachable dead code, and that two more (limits, conductor) are built-but-unwired. It also exposes a fragility in the mapping: 8 organs are reachable ONLY through heartbeat_config.json's `order` array, and heartbeat.mjs:70-73 will silently replace that array with a 6-entry DEFAULT if entries fail `validEntry` — capsule_bridge and shipped are not in that default, so a malformed config would drop two organs with no message.

**Proposed fix**

> No fix needed for the inventory itself. The one actionable edge: heartbeat.mjs:70-73 falls back to a DEFAULTS.order missing capsule_bridge and shipped, so a degraded config silently shrinks the squad from 8 organs to 6. Either bring DEFAULTS.order into line with the live heartbeat_config.json, or make the fallback say so on stdout the way brain.mjs:106-108 now does for its own config.

**Verifier's note**

> REPRODUCED, with two corrections to the claim's own evidence.
> 
> CONFIRMED MYSELF:
> - 57 .mjs in scripts/, not 56 (`(Get-ChildItem scripts\*.mjs).Count` = 57). The claim's enumeration actually names all 57 across (a)-(e); only the headline arithmetic is off by one. Not material.
> - (a) exact match. `schtasks /query /fo csv /v` filtered to ArsenalFC-* returns 44 task rows resolving to exactly the 33 scripts claimed — brain, bootroom, calibration, capture, context, cortex, distiller, dmn, doubtminer, examiner, fsrs, heartbeat, hippocampus, learning_state, mirror, nemesis, nightshift, oura_coach, physio, presence, scorer, scout, selfknowledge, setpiece, sprintsync, thalamus, throwin, timeaudit, tone, touchline, turnstile, twin, viz. No task exists for capsule_bridge or shipped.
> - (e) course.mjs: `grep -rn "course\.mjs" . --exclude-dir=.git` returns only ARSENAL_FC_FULL_REPO_BUNDLE.md (a generated dump of its own source). Zero task, zero import, zero package.json entry, zero skill/hook. Additionally `course.json` has exactly one reader in the repo — course.mjs itself. Dead on both the invocation side AND the consumption side; the claim understates it.
> - (e) organism_live_demo.mjs: only hits are prose in dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md. Dead. Confirmed.
> - limits.mjs: `wc -l` = 209; `git ls-files --error-unmatch scripts/limits.mjs` -> "did not match any file(s) known to git" (untracked); zero code/config references (its only repo-wide hits are conversation transcripts in afferent.jsonl). conductor.mjs: also untracked, present only at package.json:17/47/48/49, no schtasks entry. Both "built-but-unwired" — correct.
> - THE ACTIONABLE EDGE — REPRODUCED LIVE. heartbeat.mjs:41-51 DEFAULTS.order has 6 entries; dressing-room/state/heartbeat_config.json has 8 (capsule_bridge at line 6, shipped at line 11); live pulse.json agents array shows all 8 ran. Executed `loadConfig` directly against a corrupt and a missing path:
>     BROKEN JSON  -> 6 capture,fsrs,calibration,nemesis,learning_state,timeaudit
>     MISSING FILE -> 6 capture,fsrs,calibration,nemesis,learning_state,timeaudit
>     LIVE CONFIG  -> 8 capture,fsrs,capsule_bridge,calibration,nemesis,learning_state,timeaudit,shipped
>   The only stdout is heartbeat.mjs:334 `heartbeat: ${ok}/${agents.length} organs beat (... all ran)` — which would happily print "6/6 organs beat ... all ran". Silent shrink, confirmed. heartbeat.mjs:245's own selftest asserts `loadConfig(cfgJunk).order.length === DEFAULTS.order.length`, i.e. it pins the fallback to DEFAULTS rather than to canon, so the drift is invisible to the suite too.
> 
> TWO ERRORS IN THE CLAIM, CORRECTED:
> 1. FABRICATED CITATION. "(b) ... postmatch (brain.mjs:262 SPAWN via the bell)" is false. brain.mjs:262 reads `return (ledger || []).filter(r => r && r.job === "haiku_pulse" && ...)` — it is `pulseRowsToday`, nothing to do with postmatch. `grep -rn "postmatch.mjs" scripts/` returns NO brain.mjs hit at all. The bell at brain.mjs:706 only pushes ntfy body text containing the string "npm run postmatch". postmatch.mjs's only programmatic invoker is dugout.mjs:1038 and :1049 via `sh("postmatch.mjs", ...)` behind the spoken run_postmatch gate; otherwise it is package.json-only. This correction MATTERS: it moves postmatch from "automatically spawned" to "human-triggered only", which is exactly consistent with the ground truth that post_match/ has never existed.
> 2. WRONG IMPACT SENTENCE. "8 organs are reachable ONLY through heartbeat_config.json's `order` array" is false — six of the eight have their own scheduled tasks (ArsenalFC-CapturePull, -FSRS, -Calibration, -Nemesis, -LearningState, -TimeAuditor-Pulse), and capsule_bridge/shipped additionally have manual npm entries (package.json:20-23). The correct statement is narrower and sharper: capsule_bridge and shipped are the ONLY two organs with no independent automatic path, so they are precisely the two the DEFAULTS fallback silently kills.
> Minor: categorisation slop — capsule_bridge/shipped filed under (b) "invoked by another script" when they are heartbeat-config + package.json; postmatch and shipped are double-listed across (b) and (c).
> 
> SEVERITY JUDGEMENT: the inventory itself is not a defect and should not be filed as one. The residue worth keeping is the heartbeat DEFAULTS drift, and it is genuinely latent, not live: the fallback fires only when heartbeat_config.json is deleted, unparseable, or ALL 8 entries fail validEntry (heartbeat.mjs:73-75 keeps partial survivors). For a solo user on a sleeping laptop, with the config committed as canon, that is a hand-edit-away hazard costing two witness organs and one stdout line — "note" is right, not yellow. Kind stays dead-code (stale DEFAULTS constant + two genuinely unreachable files), not "broken": nothing is failing today.
> 
> FIX AS STATED IS CORRECT: bring DEFAULTS.order into line with the live heartbeat_config.json (or make the fallback announce itself the way brain.mjs does for its config). Worth adding: heartbeat.mjs:245's selftest should assert DEFAULTS.order parity against the canon file rather than against itself, otherwise the same drift recurs the next time an organ joins the beat.

---

## 74. Four more write-only state artifacts, all documented on 31 July and all still unread

- **kind:** `unwired` · **severity:** `note` · **area:** `dead-and-lying` · **day-one fixable:** no
- **where:** dressing-room/state/{dossier,concept_graph,manager_notes,trust_tiers}.json · writers at thalamus.mjs:484, cortex.mjs:707, manager.mjs:551, scorer.mjs:550

**Evidence**

> Consumer map over all 96 files in dressing-room/state, cross-checked with per-file greps across scripts/, .claude/, setup/ and club/: dossier.json (written thalamus.mjs:68/:484, read back only by thalamus itself; live content shows `"concepts": {}` — empty), concept_graph.json (written cortex.mjs:707, no reader anywhere), manager_notes.json (written manager.mjs:551, read only inside manager's own selftest at :619; brain.mjs:962 is a comment), trust_tiers.json (written scorer.mjs:550, read back only by scorer at :484/:550). Legitimately internal and NOT defects, for the record: context_state.json, cortex_runtime.json, dugout_session.json, dugout_prefs.json, presence_thresholds.json — each is its own organ's bookkeeping, read back by that same organ. Corrections to my own first pass: capsule_map.json IS read (manager.mjs:68), shipped.json IS read (manager.mjs:69), examiner_drill.json IS read (examiner.mjs:101 loadFreshDrill, imported by dugout.mjs:71), dugout_ledger.jsonl IS read (brain.mjs:432). All four write-only ones appear in dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md:202 and its surrounding list.

**Impact**

> Low individually — small deterministic writes, not token spend — but together they mark the same pattern as the brain_out finding: the organism produces artifacts faster than it grows consumers for them. The one with real cost attached is concept_graph.json, since cortex spends Opus overnight to build it (cortex.mjs:802 "OVERNIGHT DEEPENING (P5) — one nightly Opus pass → concept_graph.json") and nothing opens the result; that spend is separate from the already-known ConceptGraph silent-no-op.

**Proposed fix**

> Only concept_graph.json is worth acting on now, and it is the same decision as the brain_out list: either give it the consumer it was built for (setpiece.mjs picks drills and is the natural reader of a concept graph) or stop paying Opus for it nightly. dossier.json, manager_notes.json and trust_tiers.json are cheap deterministic run-logs — leave them, but stop describing manager_notes.json as anything other than a log. Worth saying to him plainly: these were all found on 31 Jul and none moved, which is itself the signal — the audit landed, the fixes did not.

**Verifier's note**

> CONFIRMED as fact, with four corrections. I re-derived the consumer map myself with a whole-repo, no-ignore, all-file-type scan (these files are gitignored, so a plain ripgrep silently misses them) plus a check for generic readdirSync(STATE_DIR) readers — there are none touching these four.
> 
> WHAT REPRODUCES:
> 1. concept_graph.json — the clean one. Task \ArsenalFC-ConceptGraph is Enabled, "Daily / Every 1 day(s)", Start Time 03:00, Last Result 0, Next Run 03-08-2026. It ran successfully today: brain_ledger row {"ts":"2026-08-02T06:48:20.256Z","job":"cortex_consolidate","model":"opus","total_tokens":4185,"ok":true} and the file on disk carries node_count 38 / edge_count 60. Whole-repo scan for the literal string "concept_graph" returns exactly 12 hits: .gitignore:163, 4 prose lines, and 4 lines in cortex.mjs (:698 comment, :707 const, :770 the write, :802 comment). ZERO readers. Real write site is cortex.mjs:770 `(deps.write || ((o) => writeAtomic(CONCEPT_GRAPH, o)))(out)`, not :707 as claimed (:707 is the path const).
> 2. dossier.json — written at thalamus.mjs:543 `D.writeDossier(N.dossier)` (writer fn defined :419), read back only at thalamus.mjs:435 to seed the nucleus. No other reader. The claim's "writers at thalamus.mjs:484" is WRONG — line 484 is a closing brace. That number was copied verbatim out of dressing-room/club/ORGANISM_RESEARCH_2026-07-31.md:202 and has since shifted.
> 3. manager_notes.json — manager.mjs:550-551 builds and writes it as the last act of runManager; the only reads anywhere are the selftest at :619-620. Genuinely a pure run log. Claim correct.
> 4. trust_tiers.json — scorer.mjs:550 writes, scorer.mjs:484 (ratifyTier) reads back. Nothing else. Claim correct.
> 
> CORRECTION 1 — this is not a new finding, it is a restatement of the repo's own prior audit. ORGANISM_RESEARCH_2026-07-31.md:202 says "`dossier.json` is write-only… nobody else"; :203 says concept_graph.json "**zero lines of code read it**"; :385-386 repeat both and add "trust_tiers.json — … Zero readers repo-wide." The parent should know three of the four are quoted, not discovered — including the stale line numbers.
> 
> CORRECTION 2 — "none of them moved since 31 Jul" is false. Commit d78a7d8 (1 Aug), "the dossier stops eating window titles", is the M8-FIX at thalamus.mjs:338-354 + dossierKey():376. The 31-Jul doc's complaint was that dossier.concepts was polluted with "google","chrome","youtube"; today it reads `"concepts": {}` because non-canon tokens are now filtered out and no canon concept has fired today. The scanner reads that empty object as more evidence of the pattern; it is actually evidence of a fix landing. dossier.json is starved-and-unread, not broken.
> 
> CORRECTION 3 — "the one with real cost attached is concept_graph.json" overstates by ~2 orders of magnitude. Every cortex_consolidate row in brain_ledger.jsonl, whole life of the file: 5,936 + 7,088 + 6,703 + 806 + 4,185 = 24,718 real tokens across 5 successes (6 further runs failed with phantom_tokens_voided). Against the 2,129,645 tokens/7 days the same research doc attributes to the 10 dead brain jobs, this is noise. The reason to wire or kill it is coherence, not spend. Severity "note" is right; do not let the Opus framing inflate it.
> 
> CORRECTION 4 — trust_tiers.json is misdiagnosed as "a cheap deterministic run-log, leave it". It is the terminus of the DID-HE-DO-IT loop, and it has a live doc-lie plus polluted contents: ORGANISM_ANATOMY.md:126 states "the No-Look Pass is Scorer's `trust_tiers.json` consumed by the sheet", which is false — and dressing-room/manager/system.md:528-543 already carries the 25-Jul E2E audit note admitting assemblePrompt never reads it, with the sheet's wording made conditional as the mitigation. So it is "waiting on a deliberate decision with a known-stale doc line", not an unnoticed leak. Separately, the live file shows `{"type":"first_focus_by_0930","n":5,"hit_rate":0}` — the research doc at ~:390 traces those 5 to a market with no producer, i.e. fabricated MISSes welded in by last-wins computeTiers. That is a different and worse defect than being unread, and it should not be filed under this note.
> 
> One thing the claim got right that is easy to get wrong: dossier.json and dossier_weights.json are different files. dossier_weights.json has many real readers (scout.mjs:172/:239, setpiece.mjs:452/:579, nightshift.mjs:151/:262, dugout.mjs:362, .claude/skills/scrimmage/SKILL.md:11). The thalamus's own comment at thalamus.mjs:345 — "dossier.json is the OPPONENT_SCOUT test-set that shapes scrimmage grammar" — conflates the two and is itself inaccurate.
> 
> NET: kind stays "unwired", severity stays "note". The only item worth putting in front of him is concept_graph.json — a nightly Opus pass, enabled and firing, whose 38-node output nothing opens. dossier.json is starved; manager_notes.json is correctly a log; trust_tiers.json should be pulled out of this finding and filed against its doc-lie and its 5 fabricated rows instead.

---
