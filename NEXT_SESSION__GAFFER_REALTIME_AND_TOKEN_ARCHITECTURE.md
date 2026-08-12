# NEXT SESSION — THE COMPLETE WORK LIST

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

### B1 — KEY-ROTATION CONTINUITY *(his own diagnosis)*
`dugout.mjs:1994` — `loadSessionHandle` returns **null when `key_index` no longer matches**.
The dugout rotates keys across seven tanks; a rotation invalidates the handle and the Live
session restarts cold. He found this before I did: *"Have you changed your key?"*
- **IN:** `loadSessionHandle` · the rotation path · the rolling state (B2)
- **OUT:** a key pinned for a sitting, OR an instant re-seed of the new session
- **CONSUMER:** every live sitting
- **DONE:** a forced rotation mid-sitting costs him nothing he can notice

### B2 — THE ROLLING STATE + THE CONTINUOUS LOOP *(keystone)*
State living OUTSIDE the session, updated per turn: what was agreed, the declared plan, where
they are in it, what he told it to remember, what has been covered. **Makes B1 instant, B3
possible, and the whole loop O(1).**
- **IN:** the per-turn transcript delta (`brain_out/dugout/<date>.md`, both sides)
- **OUT:** a rolling-state artifact in `dressing-room/state/` (new file, ONE writer)
- **CONSUMER:** B3, B1's re-seed, B4's briefing, the Gaffer via injection
- **DONE:** the state answers "where are we?" without reading the transcript

### B3 — THE SUPERVISOR: a SECOND PAIR OF EARS, not a deep thinker
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

### B4 — THE OPENING BRIEFING: it speaks FIRST
He had to ASK *"what decisions are pending on me?"*. A being that watched all night opens with
it. **Not a report he requests — the first sentence out of its mouth.**
- **IN:** `captains_call` cards · `watchman_last.json` · `round_read_<date>.json` · rejirah due · `missions.json` · overnight output
- **OUT:** the Gaffer's opening turn
- **CONSUMER:** him, in the first ten seconds
- **DONE:** he never again has to ask what is pending

### B5 — ONE MIND, BOTH MOUTHS
He talks to Claude Code for hours; the Gaffer knows none of it live. Both already write to the
same bus (claude-code 595 rows · dugout 246) — but the Gaffer never reads the bus
mid-conversation. **The most conspicuously missing wire in "one organism".**
- **IN:** `afferent.jsonl` (both sources) · `recall_index.jsonl`
- **OUT:** injected context notes into whichever mouth is live
- **CONSUMER:** the Gaffer and the Claude Code surface, both ways
- **DONE:** something said HERE is known THERE within seconds, and the reverse

### B6 — PRE-COMPUTE THE INTELLIGENCE, so Flash never needs to be smart
Overnight, when the budget is idle, a smart model writes the whole sitting: the plan per axis,
the order, the analogies, where he will stumble and what to say when he does. `pre_answers`
already predicts his next 15–25 doubts, so the machinery exists. **Flash stays Flash — but the
words in its mouth were written by Opus.**
- **IN:** `capsules/` · rejirah due state · `doubt_grammar.json` · calibration
- **OUT:** a prepared-sitting artifact under `brain_out/nightshift/`
- **CONSUMER:** the Gaffer at sitting start; the briefing (B4)
- **DONE:** a morning sitting reads a prepared lesson instead of improvising one

### B7 — THE DECLARED MAP *(he asked three times and never got it)*
His reason, verbatim: *"if in my mind I know that you are just giving me the definition first,
so I will not overthink about vocab — I will just store it and know you'll explain it later."*
He needs the SHAPE before the walk. **Applies to EVERY kind of sitting** — he was explicit:
*"i am not talking just about samjhao mode, i am talking about entire gaffer for everything."*
- **IN:** the sitting type + rolling state (B2)
- **OUT:** a spoken map at the start; a "you are here" marker at every stop
- **CONSUMER:** him
- **DONE:** he stops having to ask what the strategy is

### B8 — STANDING SPOKEN INSTRUCTIONS
Today: `set_depth` persists · an explicit "remember that…" persists (verified — all three facts
he dictated to the Gaffer landed in the ledger) · **everything else dies with the session** —
"dheere bolo", "ye mat karo", "pehle mujhse poocho".
- **IN:** his spoken instruction, detected live
- **OUT:** a standing-instruction store (new, ONE writer)
- **CONSUMER:** every future session's preamble; the supervisor (B3)
- **DONE:** an instruction survives a reconnect AND a key rotation

### B9 — "I DON'T KNOW" AS A LAW
His words: *"don't lie to me because I can go into the files."* A machine that says *"ye mujhe
yaad nahi, ruk dekhta hoon"* and then calls the tool beats a thousand that confabulate.
- **IN:** the constitution · **OUT:** refusal-and-fetch instead of a confident guess
- **CONSUMER:** him · **DONE:** he can check the files and find it was honest

### B10 — SELF-SCORING
The organism measures HIM constantly and never measures ITSELF in conversation. Without a score
there is no "evolving according to me" — which is exactly what he asked for and was told no.
- **IN:** the sitting transcript + the supervisor's flags (B3)
- **OUT:** a per-sitting score + the worst failure, journalled
- **CONSUMER:** the Gaffer's own instructions next session; the Boot Room as evidence
- **DONE:** a bad sitting changes the next one without him saying anything

### B11 — SESSION READY BEFORE HE ARRIVES
At 06:00 the machine already knows he has four overdue Re-Jirah rounds. Pre-load so the tab
opens warm.
- **IN:** morning state (due rounds, night output, cards) · **OUT:** a warm prepared session
- **CONSUMER:** him, on open · **DONE:** opening the tab costs no waiting

### B12 — PROACTIVE RECALL
`recall_index.jsonl` holds 848 rows, **97 carrying GAFFER-side text**, and `semantic_recall`
already searches it. The gap is behavioural: **it only looks when asked.** A being that has to
be told to remember is not remembering. Rule: attempt every turn where a past doubt, win or
decision would change what it says next; weave only when it EARNS the turn — never "as you said
Tuesday" theatre.
- **IN:** `recall_index.jsonl` · `semantic_recall` · the live turn
- **OUT:** an ephemeral non-spoken hint, woven only if it earns its place
- **CONSUMER:** the live Gaffer, mid-turn
- **DONE:** it brings back something from weeks ago unprompted — and stays silent when it has nothing

### B13 — PACE, as a law of the WHOLE Gaffer
*"you are speaking so fastly I am not understanding a single bit. **Feels like you are talking
to yourself**"* — said in an ORDINARY conversation, not a teaching one. And *"थोड़ा स्पीड स्लो
करके बोलिए और डिटेल में मेरे को समझना है हर एक चीज।"* Slow / one-idea / real pauses currently
live only inside the SAMJHAO laws. **Pace belongs to the being, not to one of its jobs.**
- **IN:** the constitution · standing instructions (B8)
- **OUT:** a pace law on every sitting; the supervisor (B3) flags when it slips
- **CONSUMER:** every spoken turn · **DONE:** he never says "slow down" twice

### B14 — THE ICEBERG: a deep, CURRENT model of him
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

### B15 — MODEL ROUTING PER TASK
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

### C1 — 🔴 THE ACCOUNTING IS WRONG, AND IT IS STARVING LIVE ORGANS *(do this first)*

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

### C2 — WHERE THE TOKENS ACTUALLY GO (measure the whole board first)
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

**E2. `ArsenalFC-ConceptGraph` errors daily** — starved by C1. Fix C1, then VERIFY rather than assume.

**E3. `projection-stale` (RED, unrepaired).** `OPPONENT_SCOUT.md` was modified after
`dossier_weights.json` was generated, so **all seven dossier readers run on the old opponent
model**. Regenerate the projection from the canon doc.

**E4. `sentinel-blind` (RED, never investigated).** Neither a laptop row nor the cloud
sentinel's fallback appears in today's ntfy history; both cannot be silent on the same day.
Contract: `setup/CLOUD_SENTINEL.md`.

**E5. The Tier-2 repair arm is OFF and its work is nobody's.** Disabled 11 Aug on his ruling
after measuring 5 starts / 0 exits / 0 journal rows since 7 Aug (`637c4c3`; re-arm with
`ARSENAL_TIER2=1`). Correct call — but E3 and E4 now have **no repair arm at all**. Decide:
repair by hand, or re-arm with a fix for why the child always vanished.

**E6. `teaching_contract.json` — possible dead wire.** `auto_hits` reads 0 keys while the live
hook prints "drifted 183× · 183 auto" every turn. Either the count lives elsewhere, or a lane
is not landing.

**E7. `identity_facts.pending.jsonl` has TWO live writers** — `hippocampus.mjs` rewrites the
whole file, `mcp-memory.mjs` appends. CLAUDE.md names this a REAL breach of the single-writer
law and says explicitly: do not "fix" it in code, **it needs HIS ruling**.

**E8. FOUR ORGANS NOBODY DRIVES.** Measured across all 75 scripts: 31 run automatically; of the
rest, all but four are driven by another organ or a hook. These four run only if he remembers
to type them — precisely the design failure his own ledger entry (`5cea57e8`) names:
**`python_state` · `shipped` · `widget` · `course`.** Each needs an owner that calls it, or an
honest decision that it is dormant.

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
