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

## §5 · THE METHOD — how to read 106,376 lines without burning the quota

The surface: **103 organs · 106,376 lines of code · 66 canon `.md` · 47 archive `.md` · plus his
untracked/private folders.** Reading that with a model directly is ~1.3M+ tokens. Not affordable.
This is also not how a FANG team would do it.

**PASS 1 — COMPRESS WITH CODE. Zero model tokens.**
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
A read-only fleet is context-cheap for the main thread even when it is token-expensive in total —
that trade is only worth it AFTER passes 1 and 2 have narrowed the target.
**Cap it. Say out loud what was left unread.**

**PASS 4 — CLASSIFY BY SHAPE, NEVER BY INSTANCE.**
The output of this session is **not a list of issues**. A list makes the next session a
discovery machine again. The output is **groups of issues that share a shape**, and one fix per
shape with a ratchet so the shape cannot return. §2 is the model.

---

## §6 · THE TOOLING ANSWER — he asked what to use

- **Skills** (`.claude/skills/`) — the right home for anything repeatable. A `/audit` skill that runs
  PASS 1 and prints the compressed map would make every future audit nearly free. **Build this.**
- **Subagents** — for PASS 3 only, read-only, structured returns. Never for PASS 1 (code is cheaper)
  and never for PASS 2 (intent needs one coherent reader).
- **MCP** — `organism-memory` already exists and is the correct place for durable findings so the
  session after this one does not re-derive them. Use `note` / `remember_fact`.
- **What NOT to add:** no new MCP servers, no new plugins, no LLM-in-the-loop repair. This repo's
  thesis is *AI proposes · code validates · human approves*, and it is the right thesis. A model
  that reads findings and acts would break it.

---

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
- **Do not enable more lanes for "intensity"** until §1 lands. Intensity without the corrected gate
  is just spend.
- **PRIVACY, his ruling 14 Aug, no exceptions:** the archive lives OUTSIDE the repo. Read his
  untracked/private folders if it helps the audit; **never** copy their contents into the repo, into
  a commit, or into a doc. `hooks/pre-commit` runs `archivist.mjs tripwire` — do not fight it.
- **Do not let this become another long night.** He has been at this since midnight, four concepts
  are locked and none has had a samjhao or a Re-Jirah, and the organism cannot tune itself on a
  student who has not studied. **The point of all of this is that he gets to study.**
