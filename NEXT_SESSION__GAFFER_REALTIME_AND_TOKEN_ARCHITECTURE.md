# NEXT SESSION — THE GAFFER AS A REAL CYBORG, AND THE ORGANISM'S TOKEN ARCHITECTURE

> Written 12 Aug 2026, at the end of the session that produced it, on his instruction:
> *"make sure you add every single thing, specially that token spend decrease thing in the
> entire organism with optimal working condition, push and commit it ... make sure every
> thing is connected fully input and output wise."*
>
> **READ FIRST, BEFORE TOUCHING ANYTHING:** his own Gaffer transcript,
> `dressing-room/state/brain_out/dugout/2026-08-12.md` (93 CAPTAIN lines). An earlier
> version of this plan was written from inference instead of from that file and got the
> priorities wrong. He caught it — *"i do not think that you understood clearly what i want
> from gaffer, read my entire conversation with gaffer"* — and he was right. Do not repeat it.
>
> Everything here is FINALIZED with him. The one item he explicitly deferred is giving the
> Gaffer vision through the T2 Watcher tank: *"we will do everything with previous noted
> things except number 5."*

---

## PART 0 — WHAT HE IS ACTUALLY ASKING FOR

Across every prompt of 11–12 Aug — *"why it keeps on forgetting what i just told him like
few seconds ago"* · *"isn't brain 24x7 working live in it"* · *"i want gaffer brain to work
in real time and i want it to remember live usne kabhi bi kya bola tha, meine kya bola tha"*
· *"isn't gaffer optimizing and evolving itself according to me in real time?"* — he is not
asking for a better assistant. He is asking for something with **continuity**. We kept
building something that **answers**.

**The Gaffer today is a stateless function wearing a person's clothes.** A browser tab
opens, a fresh instance is born, it is handed a large prompt and some tools, it talks, the
tab closes, it dies. Every session is a new life. Therefore:

- a key rotation is a new life → his own diagnosis, *"Have you changed your key? Because you forgot what we were doing"*
- closing the tab is death
- "evolving according to me" is impossible — it never lives long enough to change

We have been trying to fix its MEMORY. Its memory is not breaking. **Its LIFE is.**

---

## PART 1 — THE ARCHITECTURE (two decisions; everything else follows)

### A. THE INVERSION

```
TODAY:      the browser session OWNS the conversation,
            and the organism is a set of tools it may call.

SHOULD BE:  the ORGANISM owns the conversation,
            and the browser session is a MICROPHONE it borrows.
```

**The Gaffer becomes a daemon, not a browser tab** — a process running continuously the way
`thalamus` (:4113) and `cortex` (:4112) already do. It holds conversation state, thinks
continuously on a cheap tier, and ATTACHES a voice session when he opens the tab. Closing
the tab takes the mouth away, not the being.

Every complaint dissolves here rather than being patched: key rotation reconnects a mouth,
not a mind; "forgot what we did seconds ago" becomes impossible because nothing stopped;
"act in real time" is free because it is already running between his sentences; "evolving
according to me" finally has a life to happen inside; and 24x7 becomes true rather than a
slogan.

### B. THE 3-TIER CASCADE

He asked for "Sonnet for most things". The truer shape is a cascade:

```
Gemini Flash  (FREE — 7 tanks sit mostly idle)   watches EVERY turn:
                                                 question repeated? "samajh nahi
                                                 aaya"? persona drift? gone soft?
      ↓ only if it raises a flag
Sonnet        (cheap)                            the real thinking: the plan, the
                                                 rolling state, the note to inject
      ↓ only on a SECOND failure on the same idea
Opus          (expensive)                        that one hard thing
```

~90% of the watching happens on the FREE tier. Opus stops being the default and becomes
escalation — **triggered by HIS OWN WORDS, not by a statistical score.** A second
"samajh nahi aaya" on one idea wakes the deep brain, deterministically. Today's salience
gate guesses, and it has guessed wrong 148 times out of 149.

### THE TWO OBJECTIONS HE RAISED, ANSWERED

**"Won't it eat a lot of tokens?"** Only if it re-reads the transcript every turn. It must
keep a **rolling state** updated per turn — O(1) per turn, not O(n). A supervisor that emits
nothing on most turns costs nothing, and the per-turn watching runs on the free Gemini tier.

**"Won't Sonnet in the loop add latency?"** Only if the brain is IN the path. It sits
BESIDE it: Flash speaks immediately, the note arrives and is woven into the NEXT turn —
exactly how the existing bridge already behaves (`[DEEP PENDING]` → holding line →
`[DEEP THOUGHT]` woven later).
**LAW: THE BRAIN NEVER BLOCKS THE MOUTH.** Pre-computed lessons add no latency at all,
because they were written overnight.

**"Kaafi cheezein already nahi ho rakhi hain?"** Yes — and this is the honest framing:
**we are not building a brain, we are wiring an existing one to the mouth.**

| ALREADY BUILT | MISSING |
|---|---|
| live injection pipe (`dugout.mjs:4219`) | the continuous cheap loop |
| the bridge (defer → holding → weave) | an opening briefing, unprompted |
| afferent bus carrying BOTH sides | one mind across BOTH mouths |
| `recall_index.jsonl` — 848 rows, 97 with GAFFER-side text | the Gaffer scoring ITSELF |
| `pre_answers` (predicts his next 15–25 doubts) | standing spoken instructions |
| night shift · working memory · earned voice (all 4 types opened 11 Aug) | key-rotation continuity |

---

## PART 2 — THE WORK, IN ORDER, WITH INPUTS AND OUTPUTS

> **Sixteen items (0–15).** Items 12–15 were added after he asked, twice, whether everything
> had really been captured — and he was right to push: proactive recall, pace as a law of the
> whole Gaffer, the iceberg, and model routing had all been discussed and finalized and were
> missing from the first draft. Check this list against his transcript before starting, not
> against this sentence.

> Every item names what it READS, what it WRITES, and WHO CONSUMES it — on his instruction
> that everything be connected input/output-wise. An item whose output nobody reads is a
> dead lane, and this repo has paid for enough of those.

### 0. FIRST — a risk introduced on 11 Aug (fix before anything else)

Commit `7832506` removed the rehydrate CARTRIDGE from the live session (preamble 75,925 →
49,153 chars). The reasoning was sound — `get_context` returns the same content live — but
his identity facts (IST/New Delhi · market DOMINATION · revision INTENSITY, all three
verified present in `identity_facts.json`) used to ride in on that cartridge.
**If the Gaffer does not call `get_context`, it now knows LESS about him than before.**

- **IN:** `dressing-room/hippocampus/identity_facts.json` · `dugout.mjs buildConfig`
- **OUT:** either a mandatory `get_context` call at session start, or a small facts-only preamble block
- **CONSUMER:** the live Gaffer session
- **DONE WHEN:** a fresh session provably knows he is in IST without being told

### 1. KEY-ROTATION CONTINUITY — his own diagnosis

`dugout.mjs:1994` — `loadSessionHandle` returns **null when `key_index` no longer matches**.
The dugout rotates keys across seven tanks; a rotation invalidates the handle and the Live
session restarts cold. He found this before I did.

- **IN:** `loadSessionHandle` · the tank/key rotation path · the rolling state (item 2)
- **OUT:** either a key pinned for the duration of a sitting, or an instant re-seed of the new session
- **CONSUMER:** every live sitting
- **DONE WHEN:** a forced key rotation mid-sitting costs him nothing he can notice

### 2. THE ROLLING STATE + THE CONTINUOUS LOOP — the keystone

A state object living OUTSIDE the session, updated per turn: what was agreed, the declared
plan, where they are in it, what he told it to remember, what has been covered. **This one
object is what makes item 1 instant, item 3 possible, and the whole loop O(1).**

- **IN:** the per-turn transcript delta (`brain_out/dugout/<date>.md`, both sides)
- **OUT:** a small rolling-state artifact in `dressing-room/state/` (new owner, single writer)
- **CONSUMER:** the supervisor (3), the re-seed (1), the briefing (4), the Gaffer itself via injection
- **DONE WHEN:** the state answers "where are we?" without reading the transcript

### 3. THE SUPERVISOR — Sonnet as a SECOND PAIR OF EARS, not a deep thinker

His complaints were never about depth; they were about ATTENTION: *"you forgot what we were
doing"* · *"did you forget the intensity thing?"* · *"why are you talking to me in a
different accent all of a sudden?"* · saying "samajh nahi aaya" and being walked past.

It pushes short notes through the SAME `realtimeInput` door:
```
[he asked this twice — the first answer did not land]
[he told you 4 turns ago to keep intensity high — you have gone soft]
[he said "samajh nahi aaya" and you moved on. Go back.]
```

- **IN:** the rolling state (2) + the last turn + standing instructions (8)
- **OUT:** short bracketed notes via `ws.send({realtimeInput:{text:…}})` (`dugout.mjs:4219`), and a sitting score (10)
- **CONSUMER:** the live Gaffer, mid-conversation
- **DONE WHEN:** it catches a drift he would otherwise have had to catch himself

### 4. THE OPENING BRIEFING — it speaks FIRST

He had to ASK *"what decisions are pending on me?"*. A being that watched all night opens
with it: what the night produced, what is overdue, what is red, what needs his word.
**Not a report he requests — the first sentence out of its mouth.**

- **IN:** `captains_call` cards · `watchman_last.json` · `round_read_<date>.json` · `rejirah due` · `missions.json`
- **OUT:** the Gaffer's opening turn
- **CONSUMER:** him, in the first ten seconds
- **DONE WHEN:** he never again has to ask what is pending

### 5. ONE MIND, BOTH MOUTHS

He talks to Claude Code for hours; the Gaffer knows none of it live. Both already write to
the same bus (claude-code 595 rows · dugout 246), but the Gaffer never reads the bus
mid-conversation. **This is the most conspicuously missing wire in "one organism".**

- **IN:** `afferent.jsonl` (both sources) · `recall_index.jsonl`
- **OUT:** injected context notes into whichever mouth is live
- **CONSUMER:** the Gaffer and this surface, both
- **DONE WHEN:** something said HERE is known THERE within seconds, and the reverse

### 6. PRE-COMPUTE THE INTELLIGENCE — so Flash never needs to be smart

Do not chase a smarter live model. Overnight, when the budget is idle, a smart model writes
the whole sitting: the plan per axis, the order, the analogies, where he will stumble and
what to say when he does. `pre_answers` already predicts his next 15–25 doubts, so the
machinery exists. **Flash stays Flash — but the words in its mouth were written by Opus.**

- **IN:** `capsules/` · `rejirah` due state · `doubt_grammar.json` · his calibration
- **OUT:** a prepared-sitting artifact under `brain_out/nightshift/`
- **CONSUMER:** the Gaffer at the start of a sitting; the briefing (4)
- **DONE WHEN:** a morning sitting reads a prepared lesson instead of improvising one

### 7. THE DECLARED MAP — he asked three times and never got it

In his own words: *"if in my mind I know that you are just giving me the definition first,
so I will not overthink about vocab — I will just store it and know you'll explain it
later."* He needs the SHAPE before the walk, so his brain does not spin on every unexplained
word. This is teaching-rule #6 ("you are here, this much is left") applied to a spoken
sitting. **It applies to EVERY kind of sitting, not just samjhao** — he was explicit that he
means the whole Gaffer, not one mode.

- **IN:** the sitting type + the rolling state (2)
- **OUT:** a spoken map at the start, and a "you are here" marker at every stop
- **CONSUMER:** him
- **DONE WHEN:** he stops having to ask what the strategy is

### 8. STANDING SPOKEN INSTRUCTIONS

Three outcomes today: `set_depth` persists (prefs) · an explicit "remember that…" persists
(ledger — verified, all three facts he dictated to the Gaffer landed) · and **everything
else dies with the session** — "dheere bolo", "ye mat karo", "pehle mujhse poocho".

- **IN:** his spoken instruction, detected live
- **OUT:** a standing-instruction store (new, single writer)
- **CONSUMER:** every future session's preamble, and the supervisor (3)
- **DONE WHEN:** an instruction survives a reconnect AND a key rotation

### 9. "I DON'T KNOW" AS A LAW

His words: *"don't lie to me because I can go into the files."* A machine that says
*"ye mujhe yaad nahi, ruk dekhta hoon"* and then calls the tool is worth a thousand that
confabulate. Free to implement; fixes trust at the root.

- **IN:** the Gaffer's constitution
- **OUT:** a refusal-and-fetch behaviour instead of a confident guess
- **CONSUMER:** him
- **DONE WHEN:** he can catch it in the files and find it was honest

### 10. SELF-SCORING

The organism measures HIM constantly — reps, calibration, nemesis, drift — and never
measures ITSELF in conversation. Without a score there is no "evolving according to me",
which is exactly what he asked for and was told no.

- **IN:** the sitting transcript + the supervisor's flags (3)
- **OUT:** a per-sitting score + the worst failure, journalled
- **CONSUMER:** the Gaffer's own instructions next session; the Boot Room, as evidence
- **DONE WHEN:** a bad sitting changes the next one without him saying anything

### 11. SESSION READY BEFORE HE ARRIVES

At 06:00 the machine already knows he has four overdue Re-Jirah rounds. Pre-load the sitting
so the tab opens warm. Latency zero, because the work happened before he got there.

- **IN:** the morning state (due rounds, night output, cards)
- **OUT:** a warm prepared session
- **CONSUMER:** him, on open
- **DONE WHEN:** opening the tab costs no waiting

### 12. PROACTIVE RECALL — it must reach into its own memory unprompted

The index is already there and already holds BOTH sides: `recall_index.jsonl`, 848 rows
(dugout 246 · claude-code 595 · notes 5 · throw-ins 2), **97 of them carrying GAFFER-side
text**. `semantic_recall` searches it. The gap is behavioural, not structural: **the Gaffer
only looks when asked.** A being that has to be told to remember is not remembering.

The rule is the one the whisper lane already proved: recall is woven only when it EARNS the
turn — never "as you said on Tuesday" theatre. But it must be ATTEMPTED every turn where a
past doubt, a past win or a past decision would change what it says next.

- **IN:** `recall_index.jsonl` · `semantic_recall` · the live turn
- **OUT:** an ephemeral, non-spoken hint woven into the answer if it earns its place
- **CONSUMER:** the live Gaffer, mid-turn
- **DONE WHEN:** it brings back something he said weeks ago without him prompting it — and stays silent when it has nothing

### 13. PACE — as a law of the WHOLE Gaffer, not one kind of sitting

His words, unprompted, in the middle of an ordinary conversation: *"you are speaking so
fastly I am not understanding a single bit. **Feels like you are talking to yourself.**"*
And again later: *"थोड़ा स्पीड स्लो करके बोलिए और डिटेल में मेरे को समझना है हर एक चीज।"*

Slow, one-idea-per-turn, real pauses currently live inside the SAMJHAO laws. **He was
explicit that he means the entire Gaffer, not a mode** — *"i am not talking just about
samjhao mode, i am talking about entire gaffer for everything."* Pace belongs to the being,
not to one of its jobs.

- **IN:** the Gaffer constitution · his standing instructions (item 8)
- **OUT:** a pace law that applies to every sitting; the supervisor (3) flags when it slips
- **CONSUMER:** every spoken turn
- **DONE WHEN:** he never again has to say "slow down" twice

### 14. THE ICEBERG — it must hold a deep, CURRENT picture of him

His ask, verbatim: *"I want you to tell me first of all every single thing you know about
me. **Use brain for this.**"* — and when it answered thinly: *"It is I want the entire
iceberg and it is more than what you was saying so **I want you to keep your knowledge
updated. It is not what you think.**"*

This is not the same as item 0 (identity facts reaching the session) or item 5 (the bus).
He is asking for a **maintained model of him** that the Gaffer can speak from and that keeps
growing — his facts, his open threads, his wins, his confusion shapes, his trajectory.
Pieces exist and are scattered: `identity_facts.json` · `who_he_is` · the Scribe's episodes
· `nikhil_model.json` (cause→effect edges) · calibration · nemesis · learning_state. Nothing
composes them into one answer, and the Gaffer has no instruction to keep it current.

- **IN:** hippocampus (facts · who_he_is · episodes) · `nikhil_model.json` · calibration · nemesis · learning_state
- **OUT:** one composed, dated "who he is right now" the Gaffer can speak from, refreshed on the night lane
- **CONSUMER:** the Gaffer, the opening briefing (4), the supervisor (3)
- **DONE WHEN:** asked "what do you know about me", it gives the iceberg and names the date it was last refreshed

### 15. MODEL ROUTING PER TASK — Flash speaks, it does not compose

The cascade in Part 1B routes WATCHING. This routes ANSWERING. Today Flash both composes and
speaks every substantive reply, and composing is the one thing it is worst at. The rule:

> **Flash is a mouth. Anything with real content behind it is composed elsewhere and handed
> to it — verbatim from a capsule, deterministically from a tool, pre-written overnight, or
> composed by Sonnet beside the path (item 3's channel) and woven on the next turn.**

Flash's job is delivery: sub-second, interruptible, in his rhythm. It should be improvising
CONTENT as rarely as possible. Item 6 does this for teaching sittings; this item generalises
it to every substantive answer the Gaffer gives.

- **IN:** the tool result / prepared artifact / Sonnet's note
- **OUT:** the spoken turn, delivered by Flash
- **CONSUMER:** him
- **DONE WHEN:** a substantive answer can be traced to a source that is not Flash's improvisation

---

## PART 3 — THE ORGANISM'S TOKEN ARCHITECTURE

> His explicit instruction, twice: *"pure organism mein best architecture approach bi lagai
> jaein which optimizes the entire working condition of the organism jaha jaha token are
> being spend and decreases the number of tokens spend to as minimum as possible."*

### THE BIGGEST SINGLE LEAK — THE GOVERNOR IS MIS-COUNTING (measured 12 Aug)

```
output tokens (real new work)  :    2,78,173
cache_read                     :  51,87,406
governor's "used"              :  57,70,979   against a 16,00,000 ceiling
allowed_now                    :          0
```

The window governor counts `cache_read` at FULL PRICE against the ceiling, though it is the
cheapest traffic in the system. **The organism is starving itself over tokens it never
really spent.** Consequences already measured and visible:

- `ArsenalFC-ConceptGraph` (`cortex consolidate`) fails EVERY day — "no-headroom (0/50000 needed)"
- the brain diary starved on the 2026-08-10 shift — 127 beats refused
- every budget-gated organ silently defers

**Weight `cache_read` at its real cost and a large part of the organism un-starves with no
other change.** This is a measurement bug, not a capacity problem, and it is the highest-value
single fix in the whole system.

- **IN:** `brain_ledger.jsonl` (already carries the full split: input · output · cache_creation · cache_read)
- **OUT:** a corrected `token_vitals.json` / headroom computation in `brain.mjs`
- **CONSUMER:** every budget-gated organ — cortex, nightshift, dmn, brain jobs, the new field-probe door
- **DONE WHEN:** ConceptGraph stops failing without anyone touching cortex

### THE STANDING PRINCIPLES

1. **CACHE-FIRST PROMPT ORDER.** Stable preamble first, volatile content last, so the cache
   actually hits. A prompt whose head changes every call is a prompt with no cache.
2. **DELTA, NEVER THE WHOLE FILE.** Any organ re-reading a full artifact each run is a leak.
   Rolling state instead — the same principle that makes the Gaffer loop affordable (item 2).
3. **FREE TIER FIRST.** Seven Gemini tanks sit mostly idle. All watching, classification and
   triage belongs there; Claude is for JUDGMENT only.
4. **SILENCE MUST BE FREE.** An organ with nothing to say should make no call at all. A job
   that spends tokens to conclude "nothing to report" is a defect.
5. **MOVE WORK TO THE NIGHT.** The overnight pool evaporates unused. Anything pre-computable
   belongs there (item 6 is one instance of this rule).
6. **NEVER PAY TWICE FOR THE SAME CONTENT.** If a tool can fetch it, do not also ship it as
   preamble. The cartridge/`get_context` duplication (item 0) is one instance; audit for others.
7. **NO JOB WITHOUT A STUB.** A new organ that can reach a model must arrive with its
   selftest stub in the SAME commit. Cost of forgetting, measured 11 Aug: 131 live
   `claude -p --allowedTools WebSearch` calls fired from the test suite — 2,016,770 ledgered
   tokens and 24.5 minutes of wall time — which also tripped the suite's 120s timeout and made
   the watchman cry `suite-red` for a suite whose 73 members all pass. Fixed in `637c4c3`;
   the guard is asserted, and it must stay.
8. **MEASURE BEFORE OPTIMIZING.** Every number in this document came off `brain_ledger.jsonl`
   or a live run. Do not tune a threshold from a feeling.

---

## PART 4 — EVERYTHING ELSE STILL OPEN (12 Aug)

### Broken — machine-side, nothing waiting on him

1. **The away-day CI lane is STILL RED.** Last green: 7 Aug (`bf5545b3`). One real cause was
   found and fixed 11 Aug (`0888a7c`) — doubtminer's GUARD 4b LIVE canary read
   `mirror_manifest.json` unconditionally, and both it and `capsules/` are gitignored, so a
   clean CI checkout has NEITHER; reproduced in a real worktree and `awayday.mjs run` now
   exits 0 there. **Yet CI still fails.** `npm ci` succeeds; only the
   `node scripts/awayday.mjs run` step fails; the run log is unreadable without `gh` (not
   installed). NEXT: install `gh`, or have him paste the first error line. **Do not guess at
   a third cause.** This is why card c36 keeps re-dealing to him.
2. **`ArsenalFC-ConceptGraph` errors daily** — starved by the governor mis-count above. Fix
   Part 3 first, then verify rather than assume.
3. **`projection-stale` (RED, unrepaired).** `OPPONENT_SCOUT.md` was modified after
   `dossier_weights.json` was generated, so **all seven dossier readers run on the old
   opponent model**. Regenerate the projection from the canon doc.
4. **`sentinel-blind` (RED, never investigated).** Neither a laptop row nor the cloud
   sentinel's fallback appears in today's ntfy history — both cannot be silent on the same
   day. Contract: `setup/CLOUD_SENTINEL.md`.
5. **The Tier-2 repair arm is OFF and its work is now nobody's.** Disabled 11 Aug on his
   ruling after measuring 5 starts / 0 exits / 0 journal rows since 7 Aug (`637c4c3`; re-arm
   with `ARSENAL_TIER2=1`). Correct call — but findings 3 and 4 above now have **no repair
   arm at all**. Decide: repair by hand, or re-arm with a fix for why the child always vanished.
6. **`teaching_contract.json` — possible dead wire.** `auto_hits` reads 0 keys while the live
   hook prints "drifted 172× · 172 auto" every turn. Either the count lives elsewhere or a
   lane is not landing.
7. **`identity_facts.pending.jsonl` has TWO live writers** — `hippocampus.mjs` rewrites the
   whole file, `mcp-memory.mjs` appends. CLAUDE.md names this a REAL breach of the
   single-writer law and says explicitly: do not "fix" it in code, it needs HIS ruling.
8. **FOUR ORGANS NOBODY DRIVES.** Measured across all 75 scripts: 31 run automatically; of
   the rest, all but four are driven by another organ or a hook. These four run only if he
   remembers to type them — precisely the design failure his own ledger entry (`5cea57e8`)
   names: **`python_state` · `shipped` · `widget` · `course`**. Each needs an owner that calls
   it, or an honest decision that it is dormant.
9. **Two uncommitted organ-state files**: `dressing-room/state/awayday.json` (modified) and
   `dressing-room/state/recital_audit.jsonl` (untracked). The second is a NEW file in a
   PUBLIC repo — his call, which is why it was left alone.

### Gated — waiting on the outward loop

10. **`benchmark.mjs` is GATED and has never produced a number.** It answers "where do I
    stand against the market, bucket by bucket", and stays shut until the full-syllabus audit
    closes. `M01` is ingested; **M02, M03, M04 have sat staged since 8 Aug.** There is no
    override in the code, and inventing one would measure him against a map researched 29
    June. Two ways forward: fire them on Gemini Deep Research through his Chrome (free, one
    click from him), or run them via `claude -p --allowedTools WebSearch` (proven to work 11
    Aug, deliberately not done that night because the window was 360% over). **His own
    instinct is on record and is right: let Gemini do the research and let Claude VERIFY the
    sources — never run the same heavy prompt twice.**

### Waiting on his first play — not broken, just never done

11. **He has NEVER completed a Re-Jirah round.** Every FSRS card still reads
    `"rejirah_graded": 0`. The recording wire shipped 11 Aug (`grade_rejirah`), the genome now
    schedules **eight** rounds out to June 2027 `[3,7,14,30,60,120,240,365]`, and the intensity
    ladder is live (no round is "gentle" any more). Until he sits ONE round, the R1-gated
    constants stay deferred by design (`FORGE_SPEC` §231) and the rejirah→calibration/nemesis
    decision stays sealed. **One round unlocks a whole layer.**
12. **The `hallucinations` forge session has been OPEN and stale for 35+ hours**, stuck at
    step 3/11, 0/9 axes. Every kickoff says to run `forge_session.mjs close` first, and it is
    right: an open loop blocks the rest.
13. **`SEASON.md` has no rows** — postmatch fills it 100%, but he has never run a `/full-time`.
14. **The field-probe bank covers his four locked concepts** — embeddings 13 · inference 10 ·
    context 9 · tokenization 8 = **40 real, sourced interview questions**. Future concepts are
    picked up automatically (the job walks `drillConcepts()`, which reads `capsules/` live).
    Nothing to do; recorded so nobody rebuilds it.

---

## PART 5 — SETTLED LAWS (do not re-litigate)

- **ONE GAFFER.** He killed a second `teach` mode within ninety minutes: *"ek hi gaffer to
  hain jisse i talk, why tf are you making chaos ... who told you to do that?"* **Never solve
  anything by adding a mode.**
- **Anything he must REMEMBER to do is a design failure** — his ledger entry `5cea57e8`, in
  his own words: *"my brain will never remember anything when to do what."*
- **All 29 tools stay.** Acting on what he says is the point of a cyborg surface; never cut
  its hands to save prompt space.
- **Verbatim recital is for prose he already owns.** It failed him for pages he cannot yet
  recall — the SAMJHAO laws exist for that case and live in the ONE Gaffer.
- **He is aiming at market DOMINATION, not competition** — his words, CR7. Intensity stays
  high everywhere, including revision.
- **Brainstorm with him BEFORE writing files.** His words: *"abe bhai pehle brainstorming kia
  karo, why the fuck you directly go and write?"*
- **Read the transcript before planning anything about the Gaffer.**

---

## WHAT DECIDED THIS SESSION (so nothing gets re-argued)

| decision | where it landed |
|---|---|
| Tier-2 nightly repair arm is OFF | `637c4c3`, re-arm `ARSENAL_TIER2=1` |
| Re-Jirah runs EIGHT rounds, to June 2027 | genome `[3,7,14,30,60,120,240,365]` |
| No round is "gentle" — R1 is cold, R3+ is interview conditions | `6222b4b` |
| The Gaffer may teach (its §7 ban is lifted) | ledger `65318441` |
| The Gaffer may speak first — all 4 interruption types ratified | `shadow.mjs unratify <type>` reverts |
| ONE Gaffer; the cartridge is out of the live session | `7832506` |
| `.md`-sweep and CROSS-CHECK-LAW facts | he said NO; both dropped |
| Vision / T2 Watcher for the Gaffer | DEFERRED by his word |
