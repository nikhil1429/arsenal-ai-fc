# THE GAFFER REAL-TIME BUILD + THE TOKEN ARCHITECTURE — what was built, 12 Aug 2026

> **What this document is:** the engineering record of the session that executed
> `NEXT_SESSION__GAFFER_REALTIME_AND_TOKEN_ARCHITECTURE.md`. It exists because the plan
> was a *worklist* and this is the *result* — what shipped, what it cost, what the
> measurements actually said, and the six places where measuring changed the build.
>
> **It is NOT canon.** Canon is `THE_GAFFER.md` §9 (the delivery laws) and `CLAUDE.md`.
> If this file and a canon file disagree, **canon wins and this file is wrong.**
>
> **Every number here came off the ledger or a live run.** None is quoted from the plan.
> Re-derive any of them: `node scripts/brain.mjs spend 7`.

---

## 0 — THE ONE-LINE STORY

He ran his first long spoken sitting on 12 Aug — 93 CAPTAIN lines — and said a variant of
**"you forgot" nine times**, ending at *"I am literally about to cry now because it's so
frustrating."* Separately, the organism's own budget governor had been wrong in three
different directions for weeks, and the two facts turned out to be connected: **the same
habit of trusting a written number instead of measuring it** produced both.

Nothing here is a new brain. The plan said it best and it held up:
**we were not building a brain — we were wiring an existing one to the mouth.**

---

## 1 — THE TOKEN ARCHITECTURE (C1 · C2 · C3.8)

### 1.1 The meter was wrong in THREE directions, not one

The plan flagged a contradiction between itself and a memory note and said: *measure
per-job before changing the formula.* That instruction was worth more than either claim —
**both were right, in lanes neither had separated, and there was a third fault nobody had
named.** Measured across 5,153 ledger rows:

| # | fault | evidence | status when found |
|---|---|---|---|
| 1 | **under-count** | `dmn_rollout` 856 rows + `dmn_counter` 143 wrote `total_tokens` as the in+out pair only — **5,86,44,720 metered as 10,19,066** | already repaired 9 Aug 18:14 |
| 2 | **over-count** | `haiku_pulse` wrote a prompt-**length guess** as spend on 101 rows — 32,90,374 written against 72,674 real | last row 4 Aug |
| 3 | **mis-weight** | `cache_read` was **67.5% of all counted traffic**, charged at full price | **LIVE — this was the bleeding one** |

Fault 3 also made the control loop incoherent with its own rules: C3 principle 1 says put
the stable preamble first *so it caches* — which converts spend into `cache_read` — so under
the old meter, **obeying the optimisation principle made the governor angrier.** A meter that
punishes the cheap path is not a meter.

**The fix is one function.** `spendOf()` derives spend from the four components **at read
time**, so a lying written total is never consulted and the append-only ledger is never
rewritten. That repairs faults 1 and 2 from both directions at once. `windowUsageLegacy` is
frozen beside it (layering law).

Weights are Anthropic's published price ratios — `input 1 · cache_write 1.25 · cache_read
0.1 · output 5`. They are ratios of what traffic **costs**, not a claim about how a
subscription is metered internally; that is unpublished, and pretending otherwise would be a
fourth fault.

### 1.2 Why self-tune never learned — the best single finding of the session

The ceiling was stuck at 16,00,000 while real windows carried 4-5× that. The machinery was
not broken; **it was working perfectly on corrupt input.**

At the one genuine account wall — `2026-08-07T19:16`, *"You've hit your session limit"* —
the window measured:

```
as-written        3,76,992   <- what blendCeiling actually observed
true 4-sum       83,92,039
cost-weighted    27,83,040   <- the honest number
```

So the governor observed **3.77 lakh at the exact moment the account said no**, floored at
its estimate, and concluded nothing. Three weeks of budget decisions rested on that.

`window_capacity_est_tokens` is now **2,750,000** — the measured wall, floored to the nearest
50k, and deliberately **not** scaled up for the 9 Aug 20× doubling, because `blendCeiling`
can only ever *raise* the estimate: an over-set ceiling is unrecoverable, an under-set one
self-corrects on the next real wall. Weekly preserves the config's own 15× ratio.

> ⚠ **These two numbers CHANGED UNIT, not just value.** Comparing them against a raw token
> count is meaningless. Read `brain.mjs`'s `SPEND` comment before touching either.

### 1.3 C2 — the board is a command, not a table

The plan carried the spend board as prose. **It was already stale when it was read.** So it
is now `node scripts/brain.mjs spend [days]`, which ranks by cost-weighted spend *beside*
real output — because those two orders differ, and **the gap is the optimisation target**.
An organ high on weighted spend and absent from the output list is paying boot tax, not
thinking.

Its first run found what the frozen table could not: **the DMN is 64% of all spend.**

### 1.4 C3.8 — TWO organs were metering against the WRONG BUDGET

> *"EVERY DOOR OBEYS THE GOVERNOR."* The plan caught one bypass on the field-probe door and
> said: **audit the others.** There were two, and between them they are most of the board.

**The DMN (64% of all weighted spend).** Gated on `away · tone · FREE-TIER TANK QUOTA` and
never once on the window. Its own header still called that quota *"use-it-or-lose-it; blast
radius $0"* — true when written, false since **17 Jul**, when every rollout moved to
`claude -p`. A comment 230 lines lower already said so. `grep -c "brain.mjs" scripts/dmn.mjs`
returned **0**.

**The night shift.** Capped **calls (62)** and never **tokens**. Same shape, and it explains
*both* of the organism's remaining starvation bugs at once:

```
5h window ending 03:00, 12 Aug:  27,34,271 spent  vs  26,12,500 cap   (already over)
biggest line: ns_pre_answers 6,16,346
  -> cortex consolidate (03:00) failed EVERY day: "no-headroom (0/50000 needed)"
  -> diary (03:00, enabled, priority 10) has NEVER PRODUCED A PAGE
```

Neither organ was broken. **Both were drunk under the table by the job in front of them.**

Both fixes are **gates, not cuts** — the night *should* drain the window (C3.5); it may not
drain it to zero while jobs it does not own are queued behind it. Both floors are derived:

| gate | floor | derivation |
|---|---|---|
| DMN fourth gate | 400,000 | median of five real DMN passes (2,96,642 / 4,00,381 / 7,21,643) |
| night reserve | 150,000 | cortex's own 50,000 + two late-job p90s of 49,991 (96 real jobs) |

Both **fail OPEN**: a governor that will not load must never be the reason an organ that ran
fine without one produces nothing.

---

## 2 — THE GAFFER (A · B)

### 2.1 His diagnosis was more precise than mine

> *"Have you changed your key? Because you forgot what we were doing."*

The rotation path was correct in every respect but one. On quota the page runs
`reportFault → nextKey() → dropResume → connect()`, and the fresh socket re-seeded from
`CFG.rehydrate` — **a snapshot built once, at page load.** Forty minutes into a sitting it
re-seeded the Gaffer with the conversation as it stood when the tab opened.

**The handle-drop was never the bug. The stale seed was.** `GET /rehydrate` now rebuilds the
tail live and puts the rolling state — the agreed plan, the standing instructions, his last
unresolved point — *in front of it*, because the tail alone carries chatter, not the promise.

### 2.2 The organ under all of it

`scripts/gaffer_state.mjs` — sole writer of `gaffer_state.json` + `gaffer_standing.json`
(both gitignored: they quote his speech verbatim, and their source `brain_out/` already is).

Two laws, both asserted:
- **O(1) PER TURN** — handed the delta the `/transcript` door already holds. Never re-reads a
  transcript. Measured: **12.3 ms for 114 real turn deltas.**
- **SILENCE IS FREE** — no model call is even *reachable*: no subprocess, no network, no
  brain import. Held structurally, not by a text search.

**Driven, not typed.** The `/transcript` door drives it. E8 measured four organs that run
only if he remembers to type them, and his own ledger fact (`5cea57e8`) makes anything he
must remember a design failure. This is not a fifth.

### 2.3 B3 — the supervisor, built free instead of on Flash

The plan's A2 cascade puts the watching on Gemini Flash. **Measured, it should not be.**
Every note A2 asks for is something the rolling state already *knows*:

| A2's note | what actually answers it |
|---|---|
| "he asked this twice" | B2's repeat counter |
| "he said samajh nahi aaya" | B2's open_question |
| "you have gone soft" | B8's standing instructions |

A model asked *"did he repeat himself?"* is **guessing at a fact it could get wrong**, costs a
tank, and adds a round-trip to every turn. Flash stays available for genuinely semantic
calls; it is not needed to notice a man said the same thing twice.

**The monologue threshold is derived, not chosen.** The SAMJHAO laws already say *"more than
about forty seconds to say it = two turns, not one."* Speech runs ~150 wpm → ~100 words.
Measured on his real sitting: **13 of 133 Gaffer turns broke it, and the longest ran 254
words = 102 SECONDS of continuous speech.** That is the turn behind *"Feels like you are
talking to yourself."*

**It was measured, found wrong, fixed, and re-measured** — the most useful thing in the build:

```
first replay of his real 123-turn sitting:  86% of turns fired a note
  cause: open_question was set and NEVER CLEARED, so "you moved on" re-fired forever (93 notes)
  -> the supervisor becoming the noise it exists to remove
after the turn-stamp fix:                   18% (11 monologues - 9 you-forgots - 2 walked-past)
```

Two laws, asserted: **ONE NOTE PER TURN, EVER** (four detectors fire at once; exactly one is
returned — a stack of corrections is the quiz-dump failure in a new coat) and **SILENCE IS
THE DEFAULT**.

### 2.4 B6 + B11 — the measurement changed the build again

The plan asked for these as **overnight generation** jobs. Measured, **every input already
exists on disk**: 4 locked capsules carrying 112 of his own doubts, 11 traps on tokenization
alone, the exact due queue, nemesis, calibration.

So the sitting is **assembled**, not written — free, instant, and it cannot be stale, which a
prepared sitting generated at 02:40 already is if he closes an axis at 09:00. Same call as
B14's.

**What is therefore NOT built, deliberately: no new nightly LLM job.** The night lane is
already the largest consumer on the board (§1.4), and generating prose that exists in his own
words would break B15 too — his capsule *is* the source.

### 2.5 The five delivery laws

Live in `dugout.mjs`, canon in `THE_GAFFER.md` §9. Each carries **his own words**, because a
law justified by a paraphrase is one rewrite away from being softened by someone who never
heard him say it. Each is asserted against the **built instruction**, not the source, so a
law refactored out of the string it lives in still goes red.

- **§9.1 PACE belongs to the being, not to one of its jobs** — fenced: `DHEEMA IS NOT CHHOTA`
- **§9.2 DECLARE THE MAP before you walk it** — he asked three times
- **§9.3 "I don't know" is legal; a confident guess is not** — names the *repair*, not just the ban
- **§9.4 BRING THINGS BACK before he asks** — and stay silent when it has nothing
- **§9.5 THE GAFFER IS A MOUTH; content is composed elsewhere** — written as routing, not demotion

---

## 3 — SIX PLACES WHERE MEASURING CHANGED THE BUILD

This is the part worth keeping. In every one of these, the plausible answer was wrong.

1. **The plan's C1 contradiction** — both halves true, in different lanes, plus a third fault
   nobody had named.
2. **`shipped` was never undriven** (E8) — heartbeat's chain has run it daily all along.
   Three organs, not four.
3. **`auto_hits` was never a dead wire** (E6) — the audit read the wrong nesting level. It is
   a per-rule field. Live: 277 across 12 rules.
4. **E7's two-writer breach was already fixed** — real when written on 10 Aug, repaired the
   same day. Canon spent two days asking a session to hold open a question the code had
   answered.
5. **B3 on Flash would have been worse than free** — see §2.3.
6. **B6 needed assembly, not generation** — see §2.4.

And one where I was wrong and corrected myself: **I marked E2 CLOSED after proving `cortex
consolidate` exits 0, then checked when the task actually runs (03:00) and found the window
already over cap at that slot.** The meter was broken *and* the night was full; C1 fixed only
the first. §1.4 is the other half.

---

## 4 — THE STANDING DESIGN QUESTION (D)

> **"Who ELSE could act on this output?"** — answered in every new file's header.

Two dead-end edges were found and one of them was **mine**:

- `gaffer_state.mjs`'s header declared four consumers and wired one. Declaring a consumer
  without wiring it is exactly the *"built, declared, not wired"* defect this repo keeps
  finding in other files. **`learnstate.mjs` is now wired** — which also closes the half of
  B5 that was written off as impossible.
- `harvest_log.jsonl` looked write-only. **It is not a violation** — it is a dedupe ledger
  read by its own owner. Recorded rather than "fixed" with an invented reader.

**B5 — one mind, both mouths.** Both surfaces had written to the same afferent bus for weeks
(claude-code 77 + 91 vs voice 130 + dugout 131) and the Gaffer had never read the other side
mid-conversation. **The bus was a diary; it is now a nerve.**
Honest limit: `Claude Code → Gaffer` is live-within-seconds. The reverse arrives at
SessionStart via the brief — nothing can inject into a running Claude Code session from
outside — but that half is now built, where before it was simply absent.

---

## 5 — WHAT IS STILL OPEN

| item | state |
|---|---|
| **E1** — away-day CI red | **the `gh` blocker is GONE — see §6.** The failing step is identified. Root cause still open; **do NOT guess at a third cause.** |
| **E5** — Tier-2 repair arm | ✅ **DECIDED — stays OFF.** Measured 5 starts / 0 exits / 0 journal rows since 7 Aug; his 11 Aug ruling switched it off and this session did its work by hand. Every RED it existed to repair is now resolved (`tier2-vanished` self-demoted to INFO the moment the arm went quiet — it was re-arming itself on its own failure). Re-arm with `ARSENAL_TIER2=1` only if a NEW class of red appears that nothing else owns. |
| **E9** — uncommitted organ-state files | ✅ **CLOSED on his 12 Aug ruling: _"do not care about data on public repo."_** `recital_audit.jsonl` (the machine's own grading of the Gaffer's recitals) and the four modified organ-state files are committed. |
| **E10** — the remaining INFOs | ✅ `forge-stale-open` **CLOSED** — the `hallucinations` session was closed and its coverage report saved (44h open, step 3/11; the report is the thing closing preserves, and it named 8 steps never run and 0 Jirah moments). `wake-economy` needs 8 more honest cortex rows = **time, not work**. `reconcile-bleed-1/2` are §1.4's two starvations, fixed at the cause — **verify on the next night** rather than assuming. |
| **F** — the outward loop | M02-M04 are **his** to fire. Nobody else can. |

### E1 — the last untested difference, and it is a good one

`git archive` could not isolate it because it is **machine-level, not directory-level**:
four localhost daemons run on his laptop and **never** exist on a CI runner.

```
port 4111 turnstile   OPEN here   never on CI
port 4112 cortex      OPEN here   never on CI
port 4113 thalamus    OPEN here   never on CI
port 5600 ActivityWatch OPEN here never on CI
```

Every local reproduction — including the "fully CI-identical" one — still ran on a machine
where those four answered. **That is the one variable no local run can hold constant**, short
of stopping his live organism, which is not worth doing to test a hypothesis.

No selftest asserts on a live probe directly (`conductor.mjs:900` probes 59999, closed
everywhere), so if this is the cause it is an organ *behaving differently* when a daemon
answers, not a test asserting one is up.

**The decisive test is CI itself**, and it is now cheap: push, then read the run through §6's
`curl` method. That is a measurement, not another guess — and it is the fourth candidate
cause, with three already eliminated.

**The one thing to verify next, and not assume:** §1.4 predicts `diary` produces its first
page and `cortex consolidate` stops failing on the next overnight run. Both are now gated at
the cause. **Check the artifacts, not the code.**

---

---

## 6 — READING CI WITHOUT `gh` (E1's blocker, removed)

E1 has been stuck behind *"the log is unreadable without `gh` (not installed)"* since 11 Aug.
**`gh` is not needed and does not have to be installed.** The repo is PUBLIC, so the GitHub
REST API answers unauthenticated:

```bash
curl -s "https://api.github.com/repos/nikhil1429/arsenal-ai-fc/actions/runs?per_page=3"
```

That gives run ids and conclusions. Then, for the failing run:

```bash
curl -s "https://api.github.com/repos/nikhil1429/arsenal-ai-fc/actions/runs/<RUN_ID>/jobs"
```

which names the **exact failing step**. Done 12 Aug 2026, no install, no auth:

```
JOB: public-safe-chores -> failure
   FAILED STEP: Run node scripts/awayday.mjs run
```

**The `/logs` endpoint DOES still need auth** — that one really is gated. But the step name
plus a local clean-checkout reproduction is enough, and the reproduction needs no network at
all.

### The right way to reproduce a CI checkout locally

**Use `git archive`, not a copy loop.** A `cp` loop over `git ls-files` silently dropped
**12 of 76 scripts** on the first attempt here, and every "failure" that produced was an
artifact of the sandbox rather than a fact about CI — `ts-fsrs` reported missing when it is a
declared dependency and installed, `validators.mjs` reported missing when it is tracked. Two
false leads, both from a bad harness.

```bash
mkdir -p /tmp/ci && git archive HEAD | tar -x -C /tmp/ci
cd /tmp/ci && npm ci && node scripts/awayday.mjs run
```

`git archive HEAD` is *exactly* what a clean checkout contains — tracked files only, no
gitignored state — which is the whole point of the away-day lane.

> **THE LESSON, and it is the same one as everywhere else in this document:** when a
> reproduction disagrees with a declared fact, suspect the harness before the code. Both
> false leads here would have sent a session chasing a dependency bug that does not exist.

### What the reproduction actually found — and what it RULED OUT

Once the harness was right, the clean checkout found exactly **five** failing assertions in
the entire run, and **all five were mine**, added an hour earlier: the B6/B11 tests asserted
against the LIVE `capsule_map.json`, `weaknesses.json` and `calibration.json`, every one of
which is **gitignored**. They passed at home and went red on the away-day lane — the 7 Aug
"DORMANT-SAFE" red repeated exactly, in a file whose own comments describe that failure mode.
Fixed with an injectable reader and a hermetic fixture *(and the fixture deliberately lists
the wrong concept FIRST, so the guessed-field-name bug it exists to catch cannot pass it)*.

**After that fix, a fully CI-identical local environment goes GREEN:**

```
windows-latest (matches the workflow: runs-on windows-latest, node 22)
git archive HEAD  ->  npm ci  ->  node scripts/awayday.mjs run
EXIT=0     0 failing assertions
+ re-run WITH a real .git present:  EXIT=0
```

**So two hypotheses are now DISPROVEN, not merely untested:**
- **not the platform** — the workflow runs `windows-latest`, same as here
- **not the missing `.git`** — added one, re-ran, still exit 0

**E1's root cause is therefore something in the GitHub runner that this machine cannot
reproduce** (network reachability, an env var, or timing). That is a genuinely narrower
question than the one this item started with, and the next session should read a fresh run
through §6's `curl` rather than assume any of the above.

> **Do NOT "fix" E1 by guessing.** Three candidate causes have now been eliminated by
> measurement; a fourth guess is worth less than one look at the next real run.

---

*Written 12 Aug 2026, at the end of the session that did the work. Every claim in it is
either a measurement or a pointer to one.*
