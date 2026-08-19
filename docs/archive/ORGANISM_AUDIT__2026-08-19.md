# THE ORGANISM AUDIT — the carry-forward work order

> Written 19 Aug 2026 ~08:00 IST, at the end of a long session, **for the NEXT session to execute**.
> His words: *"i want to resolve once for all everything. enough is enough now bruh."*
>
> **THIS SESSION READS AND PLANS. IT DOES NOT BUILD.** The session after it builds.
> Read §0 and §1 first. They are the two things that were never written down, and their absence is
> the reason the organism keeps growing new versions of the same bug.

---

## §0 · HIS INTENT — the north star, written down for the first time

Measured 19 Aug: `grep -riE "bidirectional|24.?7|self.?heal"` across all 113 canon `.md` files returns
**almost nothing**. The organism has laws, rulings and incident records — and **no stated goal**.
Everything was built from incidents. That is precisely why the same mechanism got invented four
times and nailed to one board each time: there was no document saying what CLASSES of problem this
organism exists to handle.

**His goal, in his own words (19 Aug 2026):**

1. The organism runs **24×7 at peak power, full intensity**.
2. **No token wastage** — and he defined this precisely: *"it should first collect data about me
   then run itself."* A lane must not spend on empty or test data.
3. Tokens are spent on **findings about HIS data**, not on the organism talking to itself.
4. The organism **fixes the issues it finds, itself, 99% of the time**.
5. **Data flows both ways, fully** — from him into every organ that needs it, and from the organism
   back to him **in a form that is useful to him**.
6. Built with **the best AI and CS methods that exist** — treated as a FANG-grade product.

**Scored honestly against what is built today:**

- (1) 24×7 — **built, ownership weak.** See §3 · conductor SPOF, watchdog Interactive-only.
- (2) no wastage — **built as THE GATE (L5)**, and it works: 22 lanes slept this week.
  BUT see §1: the gate asks the WRONG QUESTION, which is his correction below.
- (3) spend on his data — **built** (the gate's E condition). But see the headline finding below.
- (4) self-repair 99% — **NOT BUILT AT ALL.** 59 findings exist; **0 carry a repair.**
- (5) bidirectional — **inward built and working** (3,315 afferent rows, 92 today, 4 modalities).
  **Outward existed for 12 hours with ZERO drivers** until one was wired on 19 Aug.
- (6) FANG-grade — the instruments are genuinely excellent. Their WIRING is not. See §2.

**THE HEADLINE FINDING, and it is his point exactly:**
The organism spent **253.71 lakh weighted tokens in 7 days** (43% of it in the dark hours,
00–08 IST) while **contact share was 3%** — and in that entire week he did essentially no real
study. Four concepts are locked; **not one has had a samjhao or a Re-Jirah.**
So the organism has been spending, at scale, on baseline/test data, to produce findings about a
student who has not yet studied. That is goal (2) and (3) failing together, and no single organ is
at fault — nothing anywhere asks *"do we have his data yet?"* before the year's spending starts.

---

## §1 · THE GATE CORRECTION — his, 19 Aug 2026. Build this FIRST.

**His words:** *"the test shouldn't be 'did it reach HIM' but 'did it reach its right consumer,
wherever that is in the organism' — useful things reach him usefully, everything else reaches
whatever organ needs it."*

**He is right, and it lands on the weakest path in the organism. Measured:**

- `gate.mjs` C today = *"consumed BY HIM within window_days"*, and the card it mints says
  *"nothing of it reached his ear, brief, card or eye."*
- `brain.consumptionForJob` (the BRAIN-JOB path) already has a partial version of his correction:
  a transitive rule that counts the consumption of a downstream job that eats this one.
- `brain.gateVerdictForLane` (the NON-BRAIN path — nightshift, dmn, selfknowledge) folds
  consumption **by lane name ALONE**: no card source, no mouth source, no transitive source.
- So the lanes whose right consumer IS another organ (`ns_pre_answers` → thalamus,
  `dmn_rollout` → dmn/physio/council, `cortex_wake` → cortex/council …) have **no way to pass C**.
  They sleep for "never reached him" while their real consumer eats them nightly.

**The data to fix it already exists.** `outbox.LANES_NOT_IN_CONFIG` (added 19 Aug) already names
the consuming organ for all 15 off-config lanes. It was written as an EXCLUSION list. Under his
correction it is really a **CONSUMER MAP**, and the gate should use it.

**The law to build:**
> Every lane declares its RIGHT CONSUMER — him, or a named organ. C holds when THAT consumer
> consumed it. A lane whose consumer is an organ is never judged by whether it reached him.

**Ratchet:** no lane may run without a declared consumer; a lane whose declared consumer has not
consumed inside the window sleeps, and the card/road row names **which consumer** went quiet.
**Do not skip:** re-run the 6 gate cards (c59/c65/c68/c69/c73/c74 class) against the new C and prove
the verdicts change for the right reason, not by luck.

---

## §2 · THE ROOT DISEASE — one sentence, four proofs

> **The organism invents an excellent, general mechanism, and then nails it to exactly one subject.**

| the mechanism | what it does | the one board it is nailed to |
|---|---|---|
| `shadow.mjs` | earn-the-right-to-act: shadow → resolve → hit-rate → his ratification | `TYPES` = 4 mouth interruption types |
| `bootroom.mjs` | propose → validate → **auto-revert** → captain approves | whitelist IS `forge_profile.json` |
| `trust_tiers` | `hit_rate` → `no_look` + `quarantine_reason` | markets/predictions only |
| `tasks.mjs` | durable, idempotent execution | brain jobs only |
| `outbox` kind `resolved` | *"issue kya tha → kya kiya → kyun → asar"* — his standing ask | **nothing. 0 rows ever produced.** |

Every one is generic in SHAPE and singular in SUBJECT. So each new problem needs new code — which is
exactly why he keeps meeting new issues.

**The fix is not a fifth mechanism. It is to un-nail these four and give them subjects.**
An earlier draft of this plan proposed "findings carry a repair" — that draft was wrong for exactly
this reason and is recorded here so it is not re-proposed.

---

## §3 · WHAT IS ALREADY MEASURED — do NOT re-measure these

Everything below was measured on 19 Aug 2026. Re-running these costs tokens for no new truth. Spend
your budget on what is NOT in this list.

**The finding surface**
- 59 findings across all organs. **0 carry a repair.**
- **19 of them literally write the fix command inside their own evidence string** and hand it to him
  as text to read and type (`models.mjs probe`, `outbox.mjs relay`, `tasks.mjs list`, …).
- `outbox` kind `resolved` — his standing ask — **0 of 37 live rows. Never produced in production.**

**Silent failure**
- **445** swallowed exceptions statically (`xray` SWALLOWED EXCEPTION).
- **103** live swallows in 24 h across 16 runs. Top sites:
  - `context.mjs × 74` — stats **`scripts/ghost.mjs`, which does not exist**. Named in `brain.mjs`,
    `conductor.mjs`, `heartbeat.mjs`. 74 failures a day for a dead reference.
  - `dugout.mjs × 19` — `acquireRecallLock` EEXIST (lock contention; the lock file is NOT stale —
    checked). His recall degrades silently during conversation.
  - `dmn.mjs × 6` — ENOENT `rejirah_log.jsonl`.

**Tests that inherit live state — the SAME class, found again on 19 Aug**
- **A SELFTEST OPENED A REAL FORGE SESSION ON HIS LIVE STATE, and it stayed open for 2.2 hours.**
  Measured: `forge_session.json` started 2026-08-19T01:35:21Z — during an `npm test` run — with
  `axes_done: 0`. **He had not started it and said so.** For those 2.2 hours it drove the
  teaching-contract hook on EVERY turn ("FORGE CONTRACT · STEP 3/11 · META-FREEZE ON"), which
  silently forbids system work — a test was steering his teaching contract. Closed 03:46Z through
  the owner's CLI (`forge_session.mjs close`, deterministic, no LLM, does not touch the capsule —
  the LOCK is step 10 and this sat at step 3), after which `sitting.mjs` selftest went green again.
  Its two assertions (`sitting.mjs:1255`, `:1257`) assume *"no forge session on disk"*, so they had
  been failing against the very state a test had created.
  **This is the exact class of his 19 Aug ruling — *"proof hamesha sandbox mein, live mein kabhi
  nahi"* — which was enforced for `samjhao` and never generalised. Same disease as §2.**
  FIX: pin the forge-session path in the selftest the way `ARSENAL_SAMJHAO_LEDGER` and
  `ARSENAL_TASKS_LEDGER` already are, and extend `samjhao`'s `isFixture()` guard to EVERY organ
  that writes his study state.
- This is the fourth instance of *"a ratchet that inherits live state is not a ratchet"* — a lesson
  this repo has now paid for in `samjhao`, `outbox`, `unleash_verdict` and here.

**Structure** (`xray report`)
- 103 organs · **1,310 unresolved sinks** (xray's own blindness — see §4)
- Q1 dead read 1 · Q2 **0** · Q3 orphan lanes 5 · Q4 ghost state 5 · Q5 **0**
- **82 ORPHAN VERBS** — built, and nothing anywhere can call them.

**Spend** (`state.mjs week`, 7 d)
- **253.71 lakh weighted**, DARK (00–08 IST) **108.34 lakh (43%)**, **contact share 3%**.
- Dark top jobs are all machine lanes: `haiku_pulse` (retired, last ran 15 Aug — verified dead),
  `ns_pre_answers`, `dmn_counter`, `ns_grade_probes`, `dmn_rollout`, `ns_probe_bank`.
- **The brain ledger cannot see his Claude Code or Gaffer sessions at all.** It counts only the
  organism's own `claude -p` calls. So *nobody can explain where his weekly quota actually goes* —
  a real blind spot, and it is why "43% by Wednesday" has no answer inside the organism.

**Process / lifetime**
- Daemons are **6/6 UP**. What is DISABLED is the *scheduled tasks* named `ArsenalFC-Thalamus`,
  `-Cortex`, `-Turnstile` — because the **conductor chains swallowed them** (verified: the disabled
  set matches the MORNING and EVENING chains exactly, disabled in chain order at their old
  five-minute stagger). Nothing was switched off "waiting for data".
- **`ArsenalFC-Morning-Conductor` is a single point of failure for 16 organs and has no fallback.**
  `lastResult = 1`. The brain's own `folded_into` has a fallback ("the fold opens by itself the
  night the target fails"); the conductor's fold does not. Same pattern, one has the safety net.
- `ArsenalFC-Daemon-Watchdog` is **LogonType = Interactive**, repeat 10 min. No interactive session
  ⇒ no watchdog ⇒ no restarts. The supervisor has the same mortality as the supervised.
- **`hooks/afferent-post.mjs:11` — *"if the thalamus is down the failure is swallowed silently."***
  No spool, no retry. **Every prompt and every teaching turn made while the bus is down is lost
  forever.** The WAL (`afferent.jsonl`) lives BEHIND the service it protects, which means it is not
  a write-ahead log at all. This is the only measured **data-loss** bug in the organism.

---

## §4 · WHAT IS ALREADY KNOWN **FALSE** — do NOT re-discover these

**Four raw scans were run on 19 Aug. Every one was majority-false:**

1. naive afferent liveness ("how old is the last row") — **3 of 3 false**
2. naive canon scan ("a number in prose") — **216 hits, 6 true**
3. open cards, judged by their own text — **10 of 28 described conditions that were no longer true**
4. `xray` **BROKEN EDGE — 5 of 5 false.** `sitting.mjs close`, `mirror.mjs status`,
   `outbox.mjs brief` were each RUN and each works. xray's verb parser cannot see certain dispatch
   shapes.

**Therefore, the operating rule for the next session:**
> **Every instrument in this repo is a LEAD, not a fact. Verify before believing, and verify by
> RUNNING the thing, not by reading more code.** A single 20-second run killed a false alarm about
> `haiku_pulse` being a live 62-lakh-token leak in this very session.

Also known false and already corrected: `weld-broken` fires before its producer's slot has passed
(the sheet is built at 09:15; the finding fired at 07:25). The gate already knows how to ask this
question — `foldSlotAhead` — and the watchman re-implemented it badly. **That is the §2 disease
again, fifth instance.**

---

## §4-B · THE CANON IS OF MIXED VINTAGE — read it as history, not as spec

**His warning, 19 Aug:** *"some .md content might be old so it needs to use its brain on deepest
rock bottom level to analyze everything first."* He is right, and it is measurable.

**Measured: the oldest canon files date to 2026-07-11** — over a month before most of the organism
existed (`SYSTEM_BLUEPRINT.md`, `SYSTEM_FOUNDATION.md`, `EXECUTION_FINAL_Tier2_Metamorphosis.md`,
`FORGE_DEEP_RENDER_BRIEF.md`, `About.md`, and the FINOPS files). Reading any of them as a
description of the organism TODAY would be wrong in a way nothing in the repo would contradict.

**THE RULE FOR THE READING SESSION:**
> Date every `.md` before you believe it (`git log -1 --format=%ad -- <file>`). A canon file is a
> snapshot of intent AT THAT DATE. Where a document and the CODE disagree, **the code is what the
> organism does** — but the document may still be what he WANTED, and that gap is itself the
> finding. Never silently prefer one; name the disagreement and its date.

## §4-C · HOW THIS ORGANISM WAS ACTUALLY BUILT — the frame the audit must use

**His words, 19 Aug:** *"organism is created in the incremental order — plan, code, use, find
issues, then plan, use, find issues, so on and on, and we kept on patching majorly."*

**That is the true history and it explains the §2 disease completely.** Every loop produced an
excellent solution to the incident in front of it. No loop ever asked *"what else in this organism
has this shape?"* — because there was no §0 saying what classes of problem exist. So the same
mechanism got invented four times, and each was nailed to the one board that had just broken.

**THEREFORE THE AUDIT IS NOT A BUG HUNT. It is an ARCHAEOLOGY.**
> For every issue found, ask: *which incident produced this code, and what was the GENERAL law that
> incident was an instance of?* The fix is the general law plus a ratchet. The bug is the evidence,
> never the target.
> And treat the git history as a primary source — `git log -S "<symbol>"` tells you which incident
> a mechanism was born from, which is exactly the question the `.md` cannot answer.

## §5 · THE METHOD — how to read 106,376 lines COMPLETELY

The surface: **103 organs · 106,376 lines of code · 66 canon `.md` · 47 archive `.md` · plus his
untracked/private folders.** No single context window can hold that, so a straight read is not
"expensive" — it is **impossible**, and it would silently skip whatever fell off the end.
The passes below exist for COVERAGE, not for economy: this is how a FANG team audits a system it
cannot hold in one head. **Depth is the constraint here, not tokens. Do not trade rigour for
brevity anywhere in this order.**

**PASS 1 — COMPRESS WITH CODE.** Not to save money — because a deterministic scan over all 103
organs is more COMPLETE than any reading pass, and it is repeatable tomorrow.
The organism already turns itself into facts. Run these and read the OUTPUT, not the source:
```bash
node scripts/xray.mjs report          # structure: writers, readers, orphans, dead reads, verbs
node scripts/swallow.mjs status       # where features die quietly
node scripts/limits.mjs               # every gate/budget/guard with its origin
node scripts/reconcile.mjs            # produce-vs-consume per lane
node scripts/treasury.mjs report      # token spend by lane, model-aware
node scripts/state.mjs week           # the seven numbers
node scripts/pulse.mjs report         # every scheduled organ, alive or not
node scripts/mutagen.mjs              # are the tests real, or do they pass on mutants
```
Everything in §3 came from these. They cost nothing and they are the map.

**PASS 2 — READ HIS INTENT, NOT HIS CODE.** Only these `.md` carry design intent; the rest are
records. Read in this order and stop when the picture is complete:
`learning-layer/PROJECT_OS.md` (THE METHOD) · `HOW_HE_LEARNS.md` (the 17 rules) ·
`FORGE_SPEC.md` · `THE_ORGANISM.md` (the organ map) · `THE_GAFFER.md` · `CLAUDE.md` ·
`SYSTEM_BLUEPRINT.md` · `ARCHIVE__DAY_ONE_SPEC.md`.
**`docs/archive/` is records, not orders — with ONE exception: `LOAD_ZERO__2026-08-19.md`.**

**PASS 3 — TARGETED DEEP READ, and only here spend on agents.**
Do not fan out over the whole repo. Fan out over the **hot spots PASS 1 named**, one agent per
subject, each returning a compressed structured finding set so the main thread never holds the files.
A read-only fleet keeps the main thread's context clean while every file still gets read by
someone — which is the only way to cover 106k lines without losing the thread.
**Run as many as the work needs. Say out loud what was left unread, and why.**

**PASS 4 — CLASSIFY BY SHAPE, NEVER BY INSTANCE.**
The output of this session is **not a list of issues**. A list makes the next session a
discovery machine again. The output is **groups of issues that share a shape**, and one fix per
shape with a ratchet so the shape cannot return. §2 is the model.

---

## §6 · THE TOOLING ANSWER — including what is NOT here yet

**THE FANG GAP, measured 19 Aug: 106,376 lines of code, and ZERO linter, ZERO type-checking,
ZERO coverage, ZERO test framework.** `devDependencies` is `acorn` + `acorn-walk` — and those exist
only so `xray.mjs` can hand-roll its own parser.

**And three of this repo's instruments are hand-rolled versions of tools the industry already
solved — with far lower false-positive rates than the ones measured here (§4):**

- `swallow` + xray's 445 SWALLOWED EXCEPTIONS → **eslint `no-empty` / `no-unused-vars`.** One rule,
  ~0 false positives, runs in seconds.
- xray's **82 ORPHAN VERBS** and 5 orphan lanes → **knip** (purpose-built for unused exports, files
  and deps). xray's own BROKEN EDGE query just scored **5 of 5 false**.
- `mutagen.mjs` → **Stryker Mutator**, the real mutation-testing engine.
- circular imports → **madge**. Coverage (which of 106k lines never executes) → **c8**, native to node.

**THE SINGLE HIGHEST-VALUE ADDITION: `tsc --checkJs` with JSDoc types. No TypeScript rewrite.**
Reason, and it is not theoretical: on 19 Aug a wire called `readJsonl(...)`, a helper `watchman.mjs`
does not have. It was a ReferenceError, it fell straight into a `swallow`, and it **shipped GREEN
while the check never ran once**. That file's own comment records the SAME thing happening before.
`tsc --checkJs` catches that entire class statically, at zero runtime cost, before it can be
swallowed. **In a 106k-line codebase held together by silent catches, this is the biggest single
safety win available.**

**HOOKS — one is missing and it is cheap.** A `PostToolUse` hook that runs the edited organ's own
`selftest` after any write to `scripts/*.mjs`. Test-on-save. The repo already has a mature hook
dispatcher (`turn_hook.mjs`); this is one more callee.

**SKILLS** — build `/audit`: it runs PASS 1 and prints the compressed map, making every future audit
nearly free. The existing skill set is otherwise good and needs no additions.

**MCP — searched the registry on 19 Aug for code-analysis / static-analysis / lint / testing /
observability: NOTHING RELEVANT RETURNED.** Do not invent a need. The already-connected
`organism-memory` is the correct and sufficient place for durable findings (`note`,
`remember_fact`) so the building session does not re-derive what the reading session learned.

**SUBAGENTS** — PASS 3 only (§5), read-only, structured returns, capped, with what was left unread
said out loud.

**WHAT NOT TO ADD:** no new MCP servers, no new plugins, no LLM-in-the-loop repair. The repo's
thesis — *AI proposes · code validates · human approves* — is correct and a model that reads
findings and acts would break it.

**THE ORDER TO ADOPT THEM** (cheapest and highest-value first, each one a gate in `npm test`):
1. `tsc --checkJs` + JSDoc on the hot organs — kills the swallowed-ReferenceError class
2. `eslint` with `no-empty` — turns 445 hand-counted silent catches into an enforced rule
3. `knip` — replaces the 82-orphan-verb query with a tool that does not cry wolf
4. `c8` coverage — find which of 106,376 lines has never once executed
5. the `PostToolUse` selftest hook, and the `/audit` skill

## §6-B · THE ROUTING LAW — his definition of zero waste, made mechanical

**His words, 19 Aug:** *"zero token wastage means wasting tokens on something which can be done for
free with the same best quality of work possible and highest and deepest level of intensity with
maximum speed."*

So this is **not** an austerity rule. It is a ROUTING rule, and it cuts the other way too: **where a
paid model is genuinely the best instrument, spending is not waste — refusing to spend there is.**

> **THE LAW: every unit of work goes to the cheapest tier that achieves the SAME quality, depth and
> speed. Paying above that tier is waste. Paying below it is worse than waste, because the answer
> has to be redone.**

**TIER 0 — DETERMINISTIC CODE. Free, and BETTER than any model at what it does.**
Anything that is computation rather than judgement: `eslint no-empty` (the 445 silent catches),
`tsc --checkJs` (the swallowed-ReferenceError class), `knip` (the 82 orphan verbs), `madge`
(cycles), `c8` (which of 106,376 lines never runs), Stryker (are the tests real), plus this repo's
own `xray` / `swallow` / `limits` / `treasury` / `pulse`.
**Spending a single paid token to hunt for empty catch blocks is the purest form of the waste he
means.** A model is worse at it AND costs money.

**TIER 1 — GEMINI. Free at his scale, and best at exactly ONE thing: BREADTH.**
Measured against the real numbers (see §6-C): give it the jobs where the whole point is holding
more at once than any other reader can, and where being wrong is cheap because TIER 0 verifies it.

**TIER 2 — CLAUDE. Paid, and worth it for exactly three things:** reading his INTENT and deciding
what he MEANT; deciding the SHAPE of a class of bug; and writing code that has to be right.
These are irreducibly judgement. Routing them down a tier does not save money, it produces a plan
that has to be thrown away.

**THE TEST, applied to every task before it starts:** *is this computation, breadth, or judgement?*
Only judgement may cost Claude tokens.

---

## §6-C · GEMINI — what to trust it with, and what never to

He has two Gemini Pro accounts and says plainly he does not trust Gemini Pro extended thinking.
**That distrust is correct and it does not need to be argued away — the architecture makes it
irrelevant.**

**The measured facts (researched 19 Aug 2026):** Gemini 3.x Pro carries a **1M-token context
window**, max output 64K (default 8,192 — must be raised explicitly), and roughly **250 requests
per day** even on paid Tier 1, ~250k tokens/minute.

**What those numbers actually mean for this repo:**
- The code is 106,376 lines ≈ **~1.3M tokens. It does NOT fit**, not even in Gemini. Anyone who
  claims "just give Gemini the whole repo" has not counted.
- But **all 113 `.md` files are ~400k tokens and DO fit, comfortably, in ONE call.** Claude Code
  cannot hold them without compaction. **This is the one thing Gemini can do here that nothing else
  can.**
- 250 requests/day means Gemini is for a HANDFUL of enormous questions, never for many small ones.
  That matches its strength exactly.

**GIVE GEMINI EXACTLY THIS — and nothing else:**
1. **The whole-canon read.** All 113 `.md` in one context: *"where does he state intent about X?
   which documents contradict each other? what is declared and never referenced anywhere?"* No other
   reader can answer cross-document questions over the whole canon in one pass.
2. **Whole-subsystem breadth sweeps.** One subsystem's files at a time (not the whole repo):
   *"list EVERY site that does X."* Recall matters here; precision does not, because TIER 0 verifies
   every hit.
3. **Deep Research on the outside world** — the lane the organism already has (`/fire`, missions).
   *"what is the industry standard for Y."*

**NEVER GIVE GEMINI:**
- any decision that is not verified afterwards by TIER 0
- the final word on his intent (that is his canon and Claude reads it with him)
- writing code that ships
- anything where being confidently wrong is expensive

**WHY HIS DISTRUST STOPS MATTERING:** in every job above, Gemini's output is a **LEAD**, and §4's
rule already applies to it exactly as it applies to `xray` — which just scored 5 of 5 false. A false
positive from Gemini costs one deterministic check. **Its recall is the product; its precision is
not.** And extended thinking is worth little here for the same reason: when everything is verified
downstream, COVERAGE beats confidence. So do not turn it on for breadth work; it buys depth this
architecture does not need and cannot use.

---

## §6-D · WHAT THE RESEARCH SAYS — and it validates the shape above

Researched 19 Aug 2026 (sources in the commit message):

- **RepoAudit** (an autonomous LLM agent for repository-level auditing) names this exact failure:
  *breaking a repository into small pieces and prompting each one falls short for **NON-LOCAL
  bugs** — bugs that need reasoning across interconnected code spanning multiple functions, classes
  and files.* **Every single defect found on 19 Aug was non-local:** the gate could not see the
  outbox (two organs), the WAL sat behind the service it protected (two layers), the mechanism
  nailed to one board (five organs). A chunked reader would have found NONE of them.
- The same work pairs the LLM with a static pass (LLMSCAN) that builds the call/flow graph FIRST,
  and lets the model reason over the GRAPH rather than the raw files. **This repo already has that
  graph — `xray`'s IR.** It should be the substrate the agents reason over, not the files.
- Greptile's approach — a pre-indexed code graph for cross-file reasoning — is the same lesson.
- Multi-agent practice: **specialise agents by CONCERN** (correctness, security, dead code, test
  coverage, spend), **not by file chunk**, with severity-categorised returns.

**So PASS 3 changes shape:** do not fan agents out over directories. Fan them out over **concerns**,
hand each one `xray`'s graph plus the §3 measurements, and require every finding to name the
cross-file path that produces it. A finding that lives inside one file was probably already caught
by TIER 0 for free.

## §7 · THE ORDER OF WORK — for the session that BUILDS

1. **§1 THE GATE CORRECTION.** His correction, and it decides every token the organism spends.
2. **The spool** (`afferent-post` writes locally before POSTing; thalamus drains on boot; dedup on
   the `event_key` that already exists). This is the only data-loss bug. Small, surgical.
3. **Ownership** — conductor fallback per step, watchdog from launcher to reporter, per-daemon OS
   restart policy. **WARNING: this INCREASES token spend**, because lanes that never got their turn
   will get it. Do it AFTER (1), so the corrected gate is holding the purse.
4. **Un-nail the four mechanisms** (§2) — shadow, bootroom, trust_tiers, tasks — so every finding can
   earn autonomy the way his mouth and his markets already do.
5. **Slot-awareness** as a declared law (§4), killing the false-RED class.

---

## §8 · WHAT NOT TO DO

- **Do not build in the reading session.** Read, verify, classify, write the plan. Nothing else.
- **Do not trust any instrument's raw output.** §4. Verify by running.
- **Do not re-measure §3.**
- **Do not hand him a list.** He has explicitly said, repeatedly, that anything he must remember or
  chase is a design failure. A list of 60 issues IS that failure in a new coat.
- **Do not enable more lanes for "intensity"** until §1 lands — not to save tokens, but because
  intensity through an uncorrected gate sends work to nobody, which is the definition of waste he
  gave: *"running and reaching nobody."*
- **PRIVACY, his ruling 14 Aug, no exceptions:** the archive lives OUTSIDE the repo. Read his
  untracked/private folders if it helps the audit; **never** copy their contents into the repo, into
  a commit, or into a doc. `hooks/pre-commit` runs `archivist.mjs tripwire` — do not fight it.
- **Do not lecture him about his own project.** He built this to study and to dominate a field; he
  knows what it is for and he knows what state it is in. Report what is measured, recommend, and
  then do the work. He decides what it is worth.
- **Do not trade quality for brevity.** This is his top priority and he has said so explicitly.
  A shallower plan delivered sooner is worth nothing here.
