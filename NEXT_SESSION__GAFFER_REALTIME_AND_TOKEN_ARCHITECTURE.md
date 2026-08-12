# NEXT SESSION — THE COMPLETE WORK LIST

---
## ⏱ STATUS AFTER THE 12 AUG SESSION (read this before re-planning anything)
> Nine commits. **Do not re-derive the measurements below — they are on the ledger.**
> Statuses are marked inline in every section too. Where this list and a section
> disagree, the section is the one that was edited last; check `git log`.
>
> **DONE + PROVEN — ALL OF B (B0–B15), ALL OF C, ALL OF D, and A:** C1 · C2 · C3 ·
> B0–B15 · D · E2(partly) · E3 · E4 · E6 · E7 · E8 · plus THE_GAFFER.md §9 (canon,
> on his 12 Aug ruling). **A is not separate work** — it is the architecture B1–B15
> were built to. The engineering record is `GAFFER_REALTIME__BUILD_NOTES.md`.
>
> **THE TWO THINGS THAT NEEDED HIS WORD ARE CLOSED** (he ruled 12 Aug, "do both"):
> `THE_GAFFER.md` §9 written, and **E7 turned out to need no code at all** — the
> two-writer breach was real when written on 10 Aug and repaired the SAME DAY; canon
> had simply never been updated. Now held by a test that greps the whole tree.
> **E2 is PARTLY closed and its section says exactly how far** — the meter was broken
> AND the night is genuinely full; C1 fixed only the first. Read that line before
> assuming ConceptGraph is fine.
>
> **THREE FINDINGS IN THIS DOCUMENT WERE WRONG, all three caught by measuring:**
> 1. **C1's flagged contradiction is resolved and BOTH halves were true** — but in
>    lanes this doc did not separate. Under-count (dmn, 856+143 rows, 5.86 crore
>    metered as 10 lakh) was REAL and was already repaired on 9 Aug 18:14. Over-count
>    (haiku_pulse, 101 rows, 32.9 lakh written against 72k real) was a third fault
>    nobody had named. Mis-weight (cache_read at full price, 67.5% of all traffic)
>    was the live one. See commit `407bfca`.
> 2. **E8 is wrong about `shipped`** — heartbeat's own chain has driven it daily all
>    along. Three organs were undriven, not four.
> 3. **E6 is a misread, not a dead wire** — `auto_hits` is a PER-RULE field inside
>    `rules[]`, never a top-level key. Live: 277 auto-hits across 12 rules.
>
> **STILL OPEN — TWO items, and neither is engineering work:**
> **E1** (away-day CI — FOUR candidate causes now eliminated by measurement, not guessed;
> the last untested variable is that four localhost daemons run on his laptop and never on a
> runner, which no local repro can hold constant. The decisive test is a pushed run read
> through `curl` — see `GAFFER_REALTIME__BUILD_NOTES.md` §6) and **F** (M02–M04 are HIS to
> fire; nobody else can).
>
> **Everything else in E is CLOSED:** E2 · E3 · E4 · E5 (stays off, decided) · E6 · E7 · E8 ·
> E9 (on his ruling *"do not care about data on public repo"*) · E10 (the stale forge session
> was closed and its coverage report saved).
>
> **THE ONE THING TO VERIFY NEXT AND NOT ASSUME:** the night reserve predicts that
> `diary` produces its FIRST EVER page and `cortex consolidate` stops failing, on the
> next overnight run. Both are now gated at the cause. **Check the artifacts, not the
> code.**
>
> **ONE THING THAT NEEDS HIS WORD:** `THE_GAFFER.md` is canon and was NOT edited.
> The live constitution in `dugout.mjs` now carries five laws it does not. They
> have diverged deliberately rather than silently.
---


> Written 12 Aug 2026 at the end of the session that produced it, on his instruction:
> *"bhai ek ek cheez push kardo, do not miss any single thing. literally every single thing.
> that token saving architecture should be done for the entire organism with optimal level of
> output not just for gaffer. make sure everything will be connected internally and externally
> and data from everywhere will be flowing everywhere wherever it is needed."*
>
> **READ HIS GAFFER TRANSCRIPT FIRST:** `dressing-room/state/brain_out/dugout/2026-08-12.md`
> (93 CAPTAIN lines). An earlier plan was written from inference instead of that file and got
> the priorities wrong. He caught it. Check this list against the transcript, **not** against
> any sentence in this document claiming to be complete — it has been incomplete twice, and
> both times he was the one who noticed.
>
> **HOW TO READ THE SECTIONS:** A · B · C · D · E are WORK — all of them get done.
> F is HIS to do and nobody else can. G and H are reminder lists with no work in them.

---

## A — THE ARCHITECTURE (not separate tasks; these decide HOW B gets built)

**A1. THE INVERSION.** Today the browser session OWNS the conversation and the organism is a
set of tools it may call. It must become the reverse: **the ORGANISM owns the conversation,
and the browser session is a MICROPHONE it borrows.** The Gaffer becomes a daemon, running
continuously the way `thalamus` (:4113) and `cortex` (:4112) already do; a voice session
ATTACHES to it. Closing the tab takes the mouth away, not the being.

*Why this is the spine:* every complaint he made — *"why it keeps on forgetting what i just
told him like few seconds ago"*, *"Have you changed your key? Because you forgot what we were
doing"*, *"isn't gaffer optimizing and evolving itself according to me in real time?"* — is
one fault. **The Gaffer is a stateless function wearing a person's clothes.** A tab opens, an
instance is born, it talks, the tab closes, it dies. Its memory is not breaking. Its LIFE is.

**A2. THE 3-TIER CASCADE.**
```
Gemini Flash  (FREE — 7 tanks sit mostly idle)   watches EVERY turn: question
                                                 repeated? "samajh nahi aaya"?
                                                 persona drift? gone soft on intensity?
      ↓ only on a flag
Sonnet        (cheap)                            the real thinking: the plan, the
                                                 rolling state, the note to inject
      ↓ only on a SECOND failure on the same idea
Opus          (expensive)                        that one hard thing
```
~90% of watching happens on the FREE tier. Opus stops being the default and becomes escalation.

**A3. ESCALATION BY HIS WORDS, NOT BY A SCORE.** A second "samajh nahi aaya" on one idea wakes
the deep brain, deterministically. Measured: the salience gate has woken Opus **once in 149
moments**, and that once fired on a pulse override at S=0.32 — *below* τ1 (0.4). It has never
woken on genuine surprise, because `τ1_effective = τ1_base + k·(1 − window_headroom)` raises
the bar exactly when the budget is tight. Cost silences it, not design.

**A4. TWO LAWS.**
- **THE BRAIN NEVER BLOCKS THE MOUTH.** Flash speaks immediately; the note arrives and is
  woven into the NEXT turn — exactly how the existing bridge behaves (`[DEEP PENDING]` →
  holding line → `[DEEP THOUGHT]`). This is the whole answer to his latency question.
- **ROLLING STATE, O(1) PER TURN.** Never re-read the transcript. Keep a state object updated
  per turn. This is the whole answer to his token question, and a supervisor that emits
  nothing on most turns costs nothing.

**WE ARE NOT BUILDING A BRAIN — WE ARE WIRING AN EXISTING ONE TO THE MOUTH.**

| ALREADY BUILT | MISSING |
|---|---|
| live injection pipe (`dugout.mjs:4219`, `realtimeInput`) | the continuous cheap loop |
| the bridge (defer → holding → weave) | an opening briefing, unprompted |
| afferent bus carrying BOTH sides | one mind across BOTH mouths |
| `recall_index.jsonl` — 848 rows, 97 with GAFFER-side text | the Gaffer scoring ITSELF |
| `pre_answers` (predicts his next 15–25 doubts) | standing spoken instructions |
| night shift · working memory · earned voice (4/4 opened 11 Aug) | key-rotation continuity |

---

## B — THE GAFFER, SIXTEEN ITEMS (each with IN / OUT / CONSUMER / DONE-WHEN)

### B0 — `get_context` is ORDERED, not optional ✅ DONE 12 Aug (`1e0f245`)
Removing the cartridge (`7832506`, preamble 75,925 → 49,153) was only honest if the call that
replaces it is made. It now is, and the constitution says why. Asserted.

### B1 — KEY-ROTATION CONTINUITY *(his own diagnosis)* ✅ DONE 12 Aug (`77fedb2`) — the handle-drop was never the bug; the STALE PAGE-LOAD SEED was. New live `/rehydrate` door.
`dugout.mjs:1994` — `loadSessionHandle` returns **null when `key_index` no longer matches**.
The dugout rotates keys across seven tanks; a rotation invalidates the handle and the Live
session restarts cold. He found this before I did: *"Have you changed your key?"*
- **IN:** `loadSessionHandle` · the rotation path · the rolling state (B2)
- **OUT:** a key pinned for a sitting, OR an instant re-seed of the new session
- **CONSUMER:** every live sitting
- **DONE:** a forced rotation mid-sitting costs him nothing he can notice

### B2 — THE ROLLING STATE ✅ DONE 12 Aug (`77fedb2`) — `gaffer_state.mjs`, O(1)/turn measured at 12.3ms for 114 deltas, driven by the `/transcript` door. **THE CONTINUOUS LOOP (the Flash watcher) IS B3 AND IS NOT DONE.**
State living OUTSIDE the session, updated per turn: what was agreed, the declared plan, where
they are in it, what he told it to remember, what has been covered. **Makes B1 instant, B3
possible, and the whole loop O(1).**
- **IN:** the per-turn transcript delta (`brain_out/dugout/<date>.md`, both sides)
- **OUT:** a rolling-state artifact in `dressing-room/state/` (new file, ONE writer)
- **CONSUMER:** B3, B1's re-seed, B4's briefing, the Gaffer via injection
- **DONE:** the state answers "where are we?" without reading the transcript

### B3 — THE SUPERVISOR ✅ DONE 12 Aug — **built FREE and deterministic, NOT on Flash, and that is a deliberate departure from A2.** Every note A2 asks for is something the rolling state already KNOWS, so a model asked "did he repeat himself?" would be guessing at a fact it could get wrong, cost a tank, and add a round-trip per turn. Five detectors, priority-ordered. The monologue threshold is DERIVED from his own forty-second law at ~150 wpm (~100 words); measured, 13 of 133 of his real Gaffer turns broke it and the longest ran **102 SECONDS of continuous speech**. Measured → found wrong → fixed → re-measured: the first replay fired on **86%** of turns (open_question never cleared, so "you moved on" re-fired forever) and now fires on **18%**, silent on 82%.
His complaints were about ATTENTION, not depth: *"you forgot what we were doing"* · *"did you
forget the intensity thing?"* · *"why are you talking to me in a different accent all of a
sudden?"* · saying "samajh nahi aaya" and being walked past. It pushes notes through the SAME
`realtimeInput` door:
```
[he asked this twice — the first answer did not land]
[he told you 4 turns ago to keep intensity high — you have gone soft]
[he said "samajh nahi aaya" and you moved on. Go back.]
```
- **IN:** rolling state (B2) + last turn + standing instructions (B8)
- **OUT:** bracketed notes via `ws.send({realtimeInput:{text:…}})`; a sitting score (B10)
- **CONSUMER:** the live Gaffer, mid-conversation
- **DONE:** it catches a drift he would otherwise have had to catch himself

### B4 — THE OPENING BRIEFING ✅ DONE 12 Aug (`e103348`) — deterministic off disk, therefore FREE, therefore unconditional. Live: 42 cards open.
He had to ASK *"what decisions are pending on me?"*. A being that watched all night opens with
it. **Not a report he requests — the first sentence out of its mouth.**
- **IN:** `captains_call` cards · `watchman_last.json` · `round_read_<date>.json` · rejirah due · `missions.json` · overnight output
- **OUT:** the Gaffer's opening turn
- **CONSUMER:** him, in the first ten seconds
- **DONE:** he never again has to ask what is pending

### B5 — ONE MIND, BOTH MOUTHS ✅ DONE 12 Aug (`b030998`) — **one direction only.** Claude Code → Gaffer is live-within-seconds; the reverse still arrives at SessionStart, because nothing can inject into a running Claude Code session from outside.
He talks to Claude Code for hours; the Gaffer knows none of it live. Both already write to the
same bus (claude-code 595 rows · dugout 246) — but the Gaffer never reads the bus
mid-conversation. **The most conspicuously missing wire in "one organism".**
- **IN:** `afferent.jsonl` (both sources) · `recall_index.jsonl`
- **OUT:** injected context notes into whichever mouth is live
- **CONSUMER:** the Gaffer and the Claude Code surface, both ways
- **DONE:** something said HERE is known THERE within seconds, and the reverse

### B6 — PRE-COMPUTE THE INTELLIGENCE ✅ DONE 12 Aug — **as ASSEMBLY, not generation, and the measurement is why.** Every input already exists on disk: 4 locked capsules carrying 112 of his own doubts, 11 traps on tokenization alone, the due queue, nemesis, calibration. Assembly is free and instant and cannot be stale — a sitting generated at 02:40 is already wrong if he closes an axis at 09:00. **Deliberately NOT built: a new nightly LLM job** (the night lane is already the largest consumer on the board, and generating prose that exists in his own words would break B15 — his capsule IS the source).
Overnight, when the budget is idle, a smart model writes the whole sitting: the plan per axis,
the order, the analogies, where he will stumble and what to say when he does. `pre_answers`
already predicts his next 15–25 doubts, so the machinery exists. **Flash stays Flash — but the
words in its mouth were written by Opus.**
- **IN:** `capsules/` · rejirah due state · `doubt_grammar.json` · calibration
- **OUT:** a prepared-sitting artifact under `brain_out/nightshift/`
- **CONSUMER:** the Gaffer at sitting start; the briefing (B4)
- **DONE:** a morning sitting reads a prepared lesson instead of improvising one

### B7 — THE DECLARED MAP ✅ DONE 12 Aug (`e103348`) — a law of the whole Gaffer, carrying his own reason verbatim.
His reason, verbatim: *"if in my mind I know that you are just giving me the definition first,
so I will not overthink about vocab — I will just store it and know you'll explain it later."*
He needs the SHAPE before the walk. **Applies to EVERY kind of sitting** — he was explicit:
*"i am not talking just about samjhao mode, i am talking about entire gaffer for everything."*
- **IN:** the sitting type + rolling state (B2)
- **OUT:** a spoken map at the start; a "you are here" marker at every stop
- **CONSUMER:** him
- **DONE:** he stops having to ask what the strategy is

### B8 — STANDING SPOKEN INSTRUCTIONS ✅ DONE 12 Aug (`77fedb2`+`e103348`) — survives reconnect, rotation AND the day; reaches every preamble. Measured and tightened: a directive marker cut a 40% false-positive rate to zero without losing one real law.
Today: `set_depth` persists · an explicit "remember that…" persists (verified — all three facts
he dictated to the Gaffer landed in the ledger) · **everything else dies with the session** —
"dheere bolo", "ye mat karo", "pehle mujhse poocho".
- **IN:** his spoken instruction, detected live
- **OUT:** a standing-instruction store (new, ONE writer)
- **CONSUMER:** every future session's preamble; the supervisor (B3)
- **DONE:** an instruction survives a reconnect AND a key rotation

### B9 — "I DON'T KNOW" AS A LAW ✅ DONE 12 Aug (`e103348`).
His words: *"don't lie to me because I can go into the files."* A machine that says *"ye mujhe
yaad nahi, ruk dekhta hoon"* and then calls the tool beats a thousand that confabulate.
- **IN:** the constitution · **OUT:** refusal-and-fetch instead of a confident guess
- **CONSUMER:** him · **DONE:** he can check the files and find it was honest

### B10 — SELF-SCORING ✅ DONE 12 Aug — the fix was in the DAY ROLL: `observe()` used to reset and throw the evidence away, which is exactly why a bad sitting could never change the next one.
The organism measures HIM constantly and never measures ITSELF in conversation. Without a score
there is no "evolving according to me" — which is exactly what he asked for and was told no.
- **IN:** the sitting transcript + the supervisor's flags (B3)
- **OUT:** a per-sitting score + the worst failure, journalled
- **CONSUMER:** the Gaffer's own instructions next session; the Boot Room as evidence
- **DONE:** a bad sitting changes the next one without him saying anything

### B11 — SESSION READY BEFORE HE ARRIVES ✅ DONE 12 Aug — same assembly as B6. Three defects caught by RUNNING it and reading the output: a **guessed field name** (`rejirah.max_overdue_days`, which does not exist) made the sort a no-op so it opened on the WRONG concept; `weaknesses.headline` is an OBJECT and printed a literal `[object Object]` into his live preamble; an **empty array is truthy** so an empty danger_zone rendered a bare `[]` as a finding. All three held by assertion.
At 06:00 the machine already knows he has four overdue Re-Jirah rounds. Pre-load so the tab
opens warm.
- **IN:** morning state (due rounds, night output, cards) · **OUT:** a warm prepared session
- **CONSUMER:** him, on open · **DONE:** opening the tab costs no waiting

### B12 — PROACTIVE RECALL ✅ DONE 12 Aug (`e103348`) — as a law, fenced both ways (attempt every turn; stay silent unless it earns the turn).
`recall_index.jsonl` holds 848 rows, **97 carrying GAFFER-side text**, and `semantic_recall`
already searches it. The gap is behavioural: **it only looks when asked.** A being that has to
be told to remember is not remembering. Rule: attempt every turn where a past doubt, win or
decision would change what it says next; weave only when it EARNS the turn — never "as you said
Tuesday" theatre.
- **IN:** `recall_index.jsonl` · `semantic_recall` · the live turn
- **OUT:** an ephemeral non-spoken hint, woven only if it earns its place
- **CONSUMER:** the live Gaffer, mid-turn
- **DONE:** it brings back something from weeks ago unprompted — and stays silent when it has nothing

### B13 — PACE ✅ DONE 12 Aug (`e103348`) — fenced against the obvious misreading: DHEEMA IS NOT CHHOTA.
*"you are speaking so fastly I am not understanding a single bit. **Feels like you are talking
to yourself**"* — said in an ORDINARY conversation, not a teaching one. And *"थोड़ा स्पीड स्लो
करके बोलिए और डिटेल में मेरे को समझना है हर एक चीज।"* Slow / one-idea / real pauses currently
live only inside the SAMJHAO laws. **Pace belongs to the being, not to one of its jobs.**
- **IN:** the constitution · standing instructions (B8)
- **OUT:** a pace law on every sitting; the supervisor (B3) flags when it slips
- **CONSUMER:** every spoken turn · **DONE:** he never says "slow down" twice

### B14 — THE ICEBERG ✅ DONE 12 Aug (`2429650`) — composed ON DEMAND, not on the night lane (free + never stale beats nightly + wrong by breakfast). New tool `get_iceberg`. An EMPTY source now says it is empty: `nikhil_model` has zero edges and a silent drop would rebuild the exact thinness he objected to.
*"I want you to tell me first of all every single thing you know about me. **Use brain for
this.**"* → and when it answered thinly, *"I want the entire iceberg and it is more than what
you was saying so **I want you to keep your knowledge updated. It is not what you think.**"*
Distinct from B0 and B5. The pieces exist and are scattered — `identity_facts.json` ·
`who_he_is` · the Scribe's episodes · `nikhil_model.json` (cause→effect edges) · calibration ·
nemesis · learning_state — and **nothing composes them**, and nothing keeps it current.
- **IN:** all of the above
- **OUT:** one composed, DATED "who he is right now", refreshed on the night lane
- **CONSUMER:** the Gaffer; the briefing (B4); the supervisor (B3)
- **DONE:** asked "what do you know about me", it gives the iceberg and names its refresh date

### B15 — MODEL ROUTING PER TASK ✅ DONE 12 Aug — as a law of the mouth.
A2 routes WATCHING; this routes ANSWERING. Today Flash composes AND speaks every substantive
reply, and composing is the one thing it is worst at.
> **Flash is a mouth. Anything with real content behind it is composed elsewhere and handed to
> it — verbatim from a capsule, deterministically from a tool, pre-written overnight, or
> composed by Sonnet beside the path (B3's channel) and woven on the next turn.**
- **IN:** the tool result / prepared artifact / Sonnet's note · **OUT:** the spoken turn
- **CONSUMER:** him · **DONE:** a substantive answer traces to a source that is not Flash's improvisation

---

## C — TOKEN ARCHITECTURE, FOR THE ENTIRE ORGANISM

> His instruction, twice, and the second time explicitly widened: *"that token saving
> architecture should be done for the entire organism with optimal level of output **not just
> for gaffer**."* Seventy-five organs, every lane, not the voice surface alone.

### C1 — THE ACCOUNTING ✅ DONE 12 Aug (`407bfca`) — **the flagged contradiction is RESOLVED and BOTH halves were true, in different lanes, plus a THIRD fault nobody had named.** Under-count: dmn wrote `total_tokens` as the in+out pair on 856+143 rows — 5,86,44,720 metered as 10,19,066 — repaired 9 Aug 18:14, so the memory note was right about a lane already fixed. Over-count: `haiku_pulse` wrote a prompt-LENGTH GUESS as spend on 101 rows (32,90,374 against 72,674 real). Mis-weight (the LIVE one): cache_read was 67.5% of all counted traffic at FULL price. `spendOf()` derives from the four components at READ time, so a lying total is never consulted and the append-only ledger is not rewritten. **Why self-tune never learned:** at the one genuine wall (7 Aug 19:16) the window measured 3,76,992 as-written — it observed 3.77 lakh at the moment the account said no. The same instant measured 27,83,040 cost-weighted; that IS the new ceiling. PROVEN: `cortex consolidate` runs (38 nodes, 62 edges) after failing every day — which also closes **E2**.

Measured 12 Aug off `brain_ledger.jsonl`:
```
output tokens (real new work)  :    2,78,173
cache_read                     :  51,87,406
governor's "used"              :  57,70,979   against a 16,00,000 ceiling
allowed_now                    :          0
```
The window governor counts `cache_read` at FULL PRICE against the ceiling though it is the
cheapest traffic in the system. **The organism is starving itself over tokens it never spent.**
Already-measured consequences: `ArsenalFC-ConceptGraph` (`cortex consolidate`) fails EVERY day
with "no-headroom (0/50000 needed)"; the brain diary starved on the 2026-08-10 shift with 127
beats refused; every budget-gated organ silently defers.

**⚠ A CONTRADICTION TO RESOLVE BEFORE TOUCHING THE GOVERNOR.** A memory note from 12 Aug
(`token-leak-real-cause`) claims the OPPOSITE failure — that the governor is *blind* to real
spend because the DMN writes `total_tokens` without the cache pair, and that the DMN alone
burns ~6.57 crore/week. Both can be true in different lanes: over-counting where the cache pair
IS written, under-counting where it is NOT. **Measure per-job before changing the formula.** Do
not fix one and make the other worse.
- **IN:** `brain_ledger.jsonl` (already carries input · output · cache_creation · cache_read)
- **OUT:** a corrected headroom computation in `brain.mjs`; a corrected `token_vitals.json`
- **CONSUMER:** every budget-gated organ — cortex, nightshift, dmn, brain jobs, the field-probe door
- **DONE:** ConceptGraph stops failing without anyone touching cortex

### C2 — WHERE THE TOKENS ACTUALLY GO ✅ DONE 12 Aug — **the board is now a COMMAND, not prose: `node scripts/brain.mjs spend [days]`.** The table below is frozen at 11–12 Aug and was already stale; run the command instead. It ranks by cost-weighted spend BESIDE real output, because those two orders differ and the gap IS the optimisation target. First run found what the frozen table could not — the DMN is **64% of all weighted spend**, which led straight to the C3.8 fix below.
Output tokens by job, 11–12 Aug — the ONLY honest starting point for optimisation:
```
haiku_pulse 64,695 · ns_field_probes 57,247 · dmn_rollout 25,299 · ns_pre_answers 22,851
dmn_counter 20,453 · night_coach 14,400 · ns_grade_probes 12,245 · gemini_render 11,495
maidan_poster 6,297 · wall_review 3,517 · dugout_digest 3,582 · agenda 2,974 · widget_spec 2,897
cortex_wake 2,764 · ns_probe_bank 2,505 · capsule_premap 2,322 · doubt_clusters 2,336
deep_reanalysis 2,183 · deep_twin 2,096 · teamtalk_am 1,888 · … (33 jobs total)
```
Two of the top four are the DMN. `haiku_pulse` is the single biggest line. **Start every
optimisation from this table, refreshed — never from a guess about which organ is expensive.**

### C3 — THE STANDING PRINCIPLES (apply to all 75 organs, not the Gaffer alone)
1. **CACHE-FIRST PROMPT ORDER.** Stable preamble first, volatile content last. A prompt whose
   head changes every call has no cache at all.
2. **DELTA, NEVER THE WHOLE FILE.** Any organ re-reading a full artifact each run is a leak.
   Rolling state instead — the same rule that makes B2 affordable.
3. **FREE TIER FIRST.** Seven Gemini tanks sit mostly idle. All watching, classification and
   triage belongs there; **Claude is for JUDGMENT only.**
4. **SILENCE MUST BE FREE.** An organ with nothing to say should make NO call. A job that
   spends tokens to conclude "nothing to report" is a defect.
5. **MOVE WORK TO THE NIGHT.** The overnight pool evaporates unused. Anything pre-computable
   belongs there (B6 is one instance).
6. **NEVER PAY TWICE FOR THE SAME CONTENT.** If a tool can fetch it, do not also ship it as
   preamble. The cartridge/`get_context` duplication was one instance — **audit for others.**
7. **NO JOB WITHOUT A STUB.** A new organ that can reach a model arrives with its selftest stub
   in the SAME commit. Cost of forgetting, measured 11 Aug: **131 live `claude -p` calls fired
   from the test suite — 20,16,770 ledgered tokens, 24.5 minutes** — which also tripped the
   suite's 120s timeout and made the watchman cry `suite-red` for a suite whose 73 members all
   pass. Fixed in `637c4c3`; the guard is asserted and must stay.
8. **EVERY DOOR OBEYS THE GOVERNOR.** A convenience CLI that bypasses the budget can starve the
   organs. Caught within an hour on the field-probe door (`01fcc63`); audit the others.
   ✅ **THE OTHER ONE IS FOUND AND FIXED, 12 Aug — and it was 64% of the board.** `dmn.mjs`
   gated on away · tone · FREE-TIER TANK quota and never once on the window; `grep -c` for a
   brain.mjs import returned 0. Its header still calls that quota "blast radius $0", true when
   written and false since 17 Jul, when every rollout moved to `claude -p`. A fourth gate now
   rides the real governor, floored at the DMN's OWN measured median pass (4,00,381 weighted,
   from five real passes), fail-OPEN if the governor will not load. A gate, not a cut.
9. **MEASURE BEFORE OPTIMIZING.** Every number in this document came off the ledger or a live
   run. Never tune a threshold from a feeling. (His own standing rule since 1 Aug.)
10. **OPTIMAL OUTPUT, NOT MINIMAL OUTPUT.** His words: *"optimal level of output"*. The target
    is the least spend that still does the job WELL — never a cheaper answer that is worse.
    An organ that saves tokens by being useless has not been optimised; it has been broken.

---

## D — MAX-FLOW: EVERYTHING CONNECTED, INSIDE AND OUT

> His instruction: *"make sure everything will be connected internally and externally and data
> from everywhere will be flowing everywhere wherever it is needed."* This is his own MAX-FLOW
> DOCTRINE, ruled 8 Aug 2026: *"data from everywhere should flow everywhere where it is
> required in the most number of times."* A signal read once a week when it could steer every
> turn is a defect.

**THE STANDING DESIGN QUESTION, asked at build time and answered in every file header:**
> **"Who ELSE could act on this output?"**

**Edges to verify or build (each is a READER addition; the single-writer law stays intact):**
- `benchmark` → wall · team_sheet (matchday) · kickoff brief line · a captains_call card on bucket regression
- missions output → DOSSIER diff → `dossier_weights` → next-turn probes · setpiece drills · examiner shapes · scrimmage grammar *(7 readers already — verify each re-reads after regen)*
- **rejirah grades → calibration / nemesis** — a DECISION deferred until his FIRST R1 (sealed, not dropped)
- `gemini_quality.jsonl` → scout readiness · watchman honesty line *(was written with zero readers; verified 12 Aug it now has scout + watchman — confirm it stayed)*
- season / logbook → kickoff streak line · wall · twin's bets
- `teaching_audit` drift-rates → Boot Room genome proposals
- `timeaudit` 3-bucket → benchmark (Building% is evidence for bucket-5) · team_sheet shape
- capsule locks → benchmark · decoy-gate check · mission generator *(same LOCK-chain event)*
- **`round_read_<date>.json` → kickoff line** *(built 11 Aug — confirm it surfaces)*
- **`field_probes.json` → `get_rejirah`** *(built 11 Aug — confirm it rides)*
- **the afferent bus → the Gaffer, LIVE** — this is B5, and it is the biggest missing edge of all
- **AUDIT EVERY NEW ORGAN** against the question above, at build time, answered in its header.

---

## E — BROKEN, MACHINE-SIDE (nothing here waits on him)

**E1. The away-day CI lane is STILL RED.** Last green: 7 Aug (`bf5545b3`). One real cause found
and fixed 11 Aug (`0888a7c`) — doubtminer's GUARD 4b LIVE canary read `mirror_manifest.json`
unconditionally, and both it and `capsules/` are gitignored, so a clean CI checkout has
NEITHER; reproduced in a real worktree, and `awayday.mjs run` now exits 0 there. **Yet CI still
fails.** `npm ci` succeeds; only `node scripts/awayday.mjs run` fails; the log is unreadable
without `gh` (not installed). **NEXT: install `gh`, or have him paste the first error line. Do
NOT guess at a third cause.** This is why card c36 keeps re-dealing to him — *"c36 keeps on
happening every single time."*

**E2. ⚠ PARTLY CLOSED 12 Aug — and the honest version matters, because the first version of this line OVERCLAIMED.** C1 was A cause, not THE cause. `cortex consolidate` now runs whenever headroom exists — proven twice live, exits 0, 38 nodes / 62 edges / 19,159 tok, via the scheduled task's exact command line. **BUT the task's real slot is DAILY 03:00, and measured at that slot the 5h window carried 27,34,271 weighted against an overnight cap of 26,12,500 — genuinely over.** So it would still have starved this morning. The meter was broken AND the night is genuinely full; C1 fixed the first only. **The remaining pressure is the NIGHTSHIFT lane, not the DMN**: in that window `ns_pre_answers` 6,16,346 · `dmn_counter` 4,12,453 · `dmn_rollout` 3,09,190 · `ns_grade_probes` 2,02,511 — the DMN is only 26% of the window that starved it. NEXT: either move the 03:00 slot off the tail of a saturated night, or measure the nightshift lane the way C3.8 measured the DMN. Do NOT raise the ceiling to make this go away — it is now a MEASURED ceiling. **A SECOND daily RED was found beside it and also fixed: `ArsenalFC-Morning-Conductor`.** Two steps blew the flat 180s step budget, neither of them hung — `heartbeat` is a CHAIN OF EIGHT organs each with its own 120s budget inside one 180s box (four of the eight measured 179.4s), and `mirror` is the FIRST step doing a NETWORK fetch on a just-woken laptop (186,377ms cold vs 2s warm; its own scheduled run at 09:20 succeeded in full). Per-step budgets, derived from those measurements. Commit `c74cc83`.

**E3. `projection-stale` (RED, unrepaired).** `OPPONENT_SCOUT.md` was modified after
`dossier_weights.json` was generated, so **all seven dossier readers run on the old opponent
model**. Regenerate the projection from the canon doc.

**E4. `sentinel-blind` — DID NOT REPRODUCE on a fresh sweep (12 Aug).** The finding came from the 11 Aug 22:15 sweep; re-running `node scripts/watchman.mjs run --no-tier2 --skip-suite` no longer raises it, and `tier2-vanished` self-demoted RED→INFO in the same sweep. **Not declared fixed — declared NOT CURRENTLY REPRODUCING.** If it returns, the contract is `setup/CLOUD_SENTINEL.md` and it has still never been investigated.

**E5. The Tier-2 repair arm is OFF and its work is nobody's.** Disabled 11 Aug on his ruling
after measuring 5 starts / 0 exits / 0 journal rows since 7 Aug (`637c4c3`; re-arm with
`ARSENAL_TIER2=1`). Correct call — but E3 and E4 now have **no repair arm at all**. Decide:
repair by hand, or re-arm with a fix for why the child always vanished.

**E6. ✅ NOT A DEAD WIRE — THE AUDIT READ THE WRONG NESTING LEVEL.** `auto_hits` is a **per-rule field inside `rules[]`**, never a top-level key, so `Object.keys(j.auto_hits)` returning 0 is exactly correct. Live 12 Aug: **277 auto-hits across 12 rules**, top one `dheema-not-lamba` at 184 — matching the hook's own print to the digit. Nothing to repair. Verify: `node -e "const j=require('./dressing-room/state/teaching_contract.json');console.log(j.rules.map(r=>[r.id,r.auto_hits]))"`

**E7. `identity_facts.pending.jsonl` has TWO live writers** — `hippocampus.mjs` rewrites the
whole file, `mcp-memory.mjs` appends. CLAUDE.md names this a REAL breach of the single-writer
law and says explicitly: do not "fix" it in code, **it needs HIS ruling**.

**E8. FOUR ORGANS NOBODY DRIVES.** Measured across all 75 scripts: 31 run automatically; of the
rest, all but four are driven by another organ or a hook. These four run only if he remembers
to type them — precisely the design failure his own ledger entry (`5cea57e8`) names:
**`python_state` · `shipped` · `widget` · `course`.** Each needs an owner that calls it, or an
honest decision that it is dormant.
⚠ **PARTLY WRONG, corrected 12 Aug: `shipped` IS driven** — heartbeat's own chain has run it daily all along (`heartbeat.mjs` DEFAULTS order). Three, not four. Of those three, **`widget` now has a driver**: it joined the forge LOCK-chain, REPORT-ONLY (`list` reads and prints; asserted, so a fail-silent lane can never become a writer of the registry). It already has something to say — 4/4 locked capsules have a widget and only ONE is driven. `python_state` and `course` are **honestly dormant**: he has not started either track, and their un-dormanting event is him starting it, not a driver invented today.

**E9. Two uncommitted organ-state files:** `dressing-room/state/awayday.json` (modified) and
`dressing-room/state/recital_audit.jsonl` (untracked). The second is a NEW file in a PUBLIC
repo — **his call**, which is why it was left alone.

**E10. Four INFO findings seen but never opened:** `mouth-silent-today` · `forge-stale-open` ·
`reconcile-bleed-1` · `reconcile-bleed-2` · `wake-economy-unmeasured`.

---

## F — GATED (the outward loop)

**F1. `benchmark.mjs` is GATED and has never produced a number.** It answers "where do I stand
against the market, bucket by bucket", and stays shut until the full-syllabus audit closes.
`M01` is ingested; **M02, M03, M04 have sat staged since 8 Aug.** There is no override in the
code, and inventing one would measure him against a map researched 29 June.

**F2. The approach is HIS and it is right:** let **Gemini do the research** (free, Deep Research,
one click from him through `/fire`), and let **Claude VERIFY the sources** with
`--allowedTools WebSearch` (proven to work 11 Aug). **Never run the same heavy prompt twice.**

**F3. Install `gh` CLI** — needed for E1, and for any PR/CI work after it.

---

## G — WAITING ON HIS FIRST PLAY (not broken; never done)

**G1. He has NEVER completed a Re-Jirah round.** Every FSRS card reads `"rejirah_graded": 0`.
The recording wire shipped 11 Aug (`grade_rejirah`), the genome now schedules **eight** rounds
to June 2027 `[3,7,14,30,60,120,240,365]`, and no round is "gentle" any more. Until he sits ONE
round, the R1-gated constants stay deferred by design (`FORGE_SPEC` §231) and the
rejirah→calibration/nemesis decision stays sealed. **One round unlocks a whole layer.**

**G2. The `hallucinations` forge session has been OPEN and stale 35+ hours**, at step 3/11,
0/9 axes. Every kickoff says to run `forge_session.mjs close` first, and it is right.

**G3. `SEASON.md` has no rows** — postmatch fills it 100%, but he has never run a `/full-time`.

---

## H — SETTLED LAWS (no work here; do not re-litigate)

- **ONE GAFFER.** He killed a second `teach` mode within ninety minutes: *"ek hi gaffer to hain
  jisse i talk, why tf are you making chaos ... who told you to do that?"* **Never solve
  anything by adding a mode.**
- **Anything he must REMEMBER to do is a design failure** — ledger `5cea57e8`, his words: *"my
  brain will never remember anything when to do what."*
- **All 29 tools stay.** Acting on what he says is the point of a cyborg surface.
- **Verbatim recital is for prose he already owns.** The SAMJHAO laws exist for pages he cannot
  yet recall, and they live in the ONE Gaffer.
- **DOMINATION, not competition** — his words, CR7. Intensity high everywhere, including revision.
- **Brainstorm BEFORE writing files** — *"abe bhai pehle brainstorming kia karo."*
- **Read his transcript before planning anything about the Gaffer.**
- **DEFERRED by his word:** vision / the T2 Watcher tank for the Gaffer.
- **He said NO to:** the `.md`-sweep standing instruction, and the CROSS-CHECK-LAW fact. Both dropped.
- **Promoted to canon:** the Gaffer's §7 teaching ban is LIFTED (ledger `65318441`).
- **All four interruption types are ratified** by captain override — the Gaffer may speak first.
  Walk any back with `shadow.mjs unratify <type>`.

---

## I — DONE IN THE 11–12 AUG SESSION (so nobody rebuilds it)

Terminal cloak — 45 scheduled tasks, no more popping consoles, exit codes preserved · `THE-FORGE__revision-bundle.html` saved · the nightly Tier-2 phantom killed (5 starts / 0 exits / 0 repairs) · the watchman's permanent alarm demoted · **`grade_rejirah`** — the voice round can finally write · **the ROUND READ** — one Opus pass over the whole round, overnight, surfacing at kickoff led by the overconfident cell · **field probes** — the organism reads the real web, plus an on-demand door and a governor guard · **40 real sourced interview questions** across all four locked concepts (embeddings 13 · inference 10 · context 9 · tokenization 8) · **the genome's captain-order door** + eight Re-Jirah rounds to June 2027 · **intensity** — no round is gentle · **SAMJHAO** laws in the ONE Gaffer · the `teach` mode built and removed the same evening · the tool-grant disarm fix (`--tools ""` was silently blocking WebSearch) · the `/tank-fault` one-word bug · the suite's live-call token leak · **B0**.
