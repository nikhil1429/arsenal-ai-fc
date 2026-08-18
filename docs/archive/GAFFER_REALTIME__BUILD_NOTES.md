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

### A FIFTH candidate, found while running the final suite — and it is a RACE

The last local run before pushing went red on **hermeticity**:

```
· running all 73 selftests leaves live state untouched
    MODIFIED state\wall_data.json
```

It is **not** a selftest doing it. Bisected: `viz.mjs` (the file's sole writer) is clean, and
so are scoreboard · postmatch · manager · learnstate · captains_call · physio · talk · dugout ·
brain. An immediate re-run went **42/42 green** with nothing changed.

**The suite takes ~3 minutes and his organism is LIVE while it runs.** A scheduled task wrote
`wall_data.json` inside that window and the hermeticity check — which can only compare
before/after — blamed the suite. The check cannot distinguish *"a selftest wrote this"* from
*"a cron wrote this mid-run"*.

That is worth knowing for its own sake, and it is a **strong E1 candidate too**: CI has no
crons, but it also has no pre-existing gitignored state, so any check comparing before/after
starts from a different baseline there. **Still a hypothesis. Read the next real run.**

> Left unfixed deliberately: teaching the hermeticity check to tell a cron from a selftest is
> real work with a real design question behind it (attribute by process? snapshot only the
> files a selftest could plausibly touch?), and inventing an answer at the end of a long
> session is how a guessed threshold gets into this repo. It is written down instead.

### 🔴 THE ACTUAL FINDING — E1 FAILS IN SEVEN SECONDS, AND THAT KILLS EVERY HYPOTHESIS ABOVE

Pushed, then read the run back through §6's `curl` method. Run `31575341965`, commit `9b14057`:

```
JOB:  public-safe-chores -> failure
STEP: Run node scripts/awayday.mjs run -> failure
      started 2026-08-12T07:46:11Z
      ended   2026-08-12T07:46:18Z      <-- SEVEN SECONDS
```

**The two selftest suites take ~3 MINUTES locally.** A seven-second failure means `awayday.mjs`
dies at STARTUP, before a single selftest runs. `npm ci` passed, so it is not dependencies.

**That invalidates every hypothesis in this section and in the worklist**, all of which assumed
a *selftest* was failing:
- ~~the four localhost daemons~~ — no selftest ever runs
- ~~the hermeticity race~~ — the suite never starts
- ~~the platform~~, ~~`.git`~~, ~~`ts-fsrs`~~, ~~`validators.mjs`~~ — already eliminated
- ~~my B6/B11 assertions~~ — real, fixed, and never the original cause

Two candidates checked and **ruled out** immediately: `ci_manifest.json` IS tracked (so CI has
it), and the mode dispatch refuses only on an unknown mode, which `run` is not.

**WHERE THE NEXT SESSION SHOULD START — and it is now a small, sharp question:**
what can make `node scripts/awayday.mjs run` exit non-zero within seven seconds on a clean
Windows checkout? Look at module-load-time reads and the earliest gates in `main()`, NOT at
the selftests. The `/logs` endpoint needs auth, so the cheapest read is to add a step that
echoes the failure, or run `awayday list` / `awayday exposure` in CI where the output is short
enough to survive.

> **Six candidate causes eliminated by measurement across this session.** The seventh will be
> found by looking at the first seven seconds, not the next three minutes.

**The one thing to verify next, and not assume:** §1.4 predicts `diary` produces its first
page and `cortex consolidate` stops failing on the next overnight run. Both are now gated at
the cause. **Check the artifacts, not the code.**

---

---

## 5.5 — THE CAPTAIN'S CALL WAS HALF-BUILT (found 12 Aug, after the first push)

He asked — again — why things waiting on his approval never reach him. Measured instead of
assumed, and the answer was worse than the question:

```
live cards            27
dealt at least once   27      (one of them TWENTY times)
EVER ANSWERED          0
```

**The deal half worked the whole time.** The rotation is correct — least-dealt-first, rested
for the day, real deal history on every card. **What did not exist was any way for him to
ANSWER.** The only path was typing `captains_call.mjs answer <id> <word>` in a terminal, and
he is ADHD-PI and talks to that surface **by voice**. His own ledger fact `5cea57e8`: a thing
he must REMEMBER to do is a design failure. **Forty-two unanswered cards is that failure,
measured.**

**`answer_card` (31st tool).** Shells the owner — same precedent as `approve_genome` →
bootroom — so `captains_call.mjs` stays sole writer. **The id is OPTIONAL by design:** LADDER
A1 already binds his bare word to the card most recently dealt, and asking a man to repeat an
id back to a voice is the friction this exists to remove. Only his three words are accepted;
a fourth is *asked about*, never guessed. And the constitution now **asks for the answer** —
a tool nobody is told about is a dead tool.

### …and then the fix nearly became a lie

Measured what `haan` actually *does*, per card:

| dispatch | count | what it means |
|---|---|---|
| `open <repo file>` | **12** | a file that still has to be READ |
| `none` | 10 | hand-filed reminders — haan retires it, and that IS the action |
| a real dispatch | 5 | forget-fact · at-source · restart-daemon · gate-tune |

The owner's CLI already prints *"read it now and walk him through it"* for an `open` card.
**The danger was mine:** my first `_use` said *"never read the raw output back"*, which would
have turned the Gaffer away from that instruction and made it say **"done"** on all twelve.
It now says plainly that those are not done, names what has to be read, and calls it a desk
job. Held by assertion.

### Two dead wires in my own B4, same session

Found by sweeping every state file for a reader outside its writer. Both failed **silently
inside a `try/catch`** — the quietest bug in this repo:

- the Re-Jirah line read **`rejirah_state.json`, a file nothing creates** → the briefing never
  once mentioned the four overdue rounds. Now reads `fsrs_store.json`, the same source
  `get_rejirah` conducts from.
- the missions line filtered on **`x.status === "staged"`, and a mission row has no `status`
  field** (`staged_at` / `fired_at` / `ingested_at`) → matched nothing while M02–M04 sat
  un-returned since 8 Aug, gating `benchmark.mjs`.

**All four briefing sources now reach him, verified live:** 42 decisions (with the one to deal
first) · 1 watchman RED · 4 overdue Re-Jirah rounds framed as RIPE, not late · 3 missions still
out with the benchmark gate named.

> **THE PATTERN, three times in one session:** a wrong field name inside a `try/catch`, and a
> grep against the wrong field name (`dealt_at` when the real field is `dealt`) that made me
> report a working rotation as broken. **Read the shape off disk before asserting anything
> about it.**

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

---

# THE AUDIT ORGANS — what was built, 12 Aug 2026 (session 2)

## 0 — THE ONE-LINE STORY

The repo had a graveyard of one-off audits (#106/#107/#108) whose findings were
stale within days. This session did not do another one. It built **seven organs
that measure the organism continuously**, wired them into the suite AND the
schedule, and proved them by **re-introducing five of this repo's six real
historical bugs and catching them**.

`node scripts/audit.mjs run` · one health number, at most one card, ever.

## 1 — THE ORGANS

| organ | what it is | sole writer of |
|---|---|---|
| `audit_preload.mjs` | the collar + the tracer, via `--import` | — |
| `sandbox.mjs` | `git ls-files` sandbox, 4 layers, 4 canaries | — |
| `xray.mjs` | the static IR — points-to, interprocedural | `xray_graph.json` |
| `mutagen.mjs` | panic build · state mutants · THE BUG MUSEUM | — |
| `blackbox.mjs` | runtime truth, reconciled against the IR | — |
| `treasury.mjs` | meter consistency · the ρ table | — |
| `herd.mjs` | the temporal / contention model | — |
| `audit.mjs` | THE FRONT DOOR | `audit_ledger.jsonl` |

## 2 — THE MEASURED FINDINGS (all reproducible, none hand-copied)

- **THE CATCH-UP HERD IS REAL.** 26 of 26 enabled tasks carry
  `StartWhenAvailable`; **21 sit in the 22:00–08:00 band the laptop sleeps
  through**. On wake they fire simultaneously, in arbitrary order, at the wrong
  hour — and every `localDate(now)` inside them derives the wrong day-key.
  `03:44:00 ×6` (brain · distiller · dmn · hippocampus · throwin · touchline).
  Independently reproduces the brief's figure from a different source.
- **SILENT LOST UPDATES**: `brain_queue.json` is written by `brain.mjs` AND
  `conductor.mjs`, both scheduled. writeAtomic makes the clobber invisible.
- **PANIC BUILD**: 787 swallowing catch sites; 14 production-lane deaths, of
  which **3 NO-WRITER and 3 CROSS-ORGAN** are real (6 were correct first-run
  self-healing and are reported as such).
- **ρ**: `midday_digest_3` at **39.6**, `midday_digest_2` at **31.9**.
- **13 IR findings** (1 dead read · 3 two-writer · 5 orphan lane · 1 ghost ·
  3 sole-writer drift), down from **414 raw**.

## 3 — WHERE MEASURING CHANGED THE BUILD (again — this is the part worth keeping)

Every single false-positive collapse below was **my analyzer being wrong**, found
by checking the shape on disk before asserting. Not one was the repo's fault.

1. **A per-param cap of 8** silently truncated `readJson(p)`, which dugout calls
   with ~40 distinct paths — so `fsrs_store.json`, a file with **seven readers**,
   reported as an orphan lane. *A truncation that produces a plausible wrong
   answer is worse than one that crashes.*
2. **Default parameter values** (`function ledgerRows(stateDir = STATE_DIR)`) were
   unmodelled — the house DI idiom — so `harvest.mjs` read as writing a ledger it
   never reads. A documented design reported as a defect.
3. **Zero-arg path thunks** (`const LEDGER = () => join(…)`) made `gate_tune`'s own
   declared-sole-writer file show zero writers.
4. **Verb extraction was a guessed name list.** 29 BROKEN EDGEs → 0, and none was
   ever real.
5. **`\s+` in a doc regex crosses newlines** → the verb `dressing-room`.
6. **`(?:json|jsonl)` matches `json` first**, truncating every `.jsonl` path → 141
   fabricated "dead path" findings.
7. **`.claude/worktrees/` holds a full doc copy** → every doc finding counted twice.
8. **The health scalar saturated at 0** and could never visibly improve.
9. **The treasury's outlier gate required n≥3**, so it printed "0 lanes at ρ>25"
   with 31.9 and 39.6 in the table two lines above it.
10. **`xray q`/`verbs` preferred the COMMITTED IR** — a cached artefact confidently
    answering questions about code it had never seen, living inside the tool built
    to find exactly that. Caught only by the Bug Museum.

**And three where the audit nearly damaged the repo:**

- The taint set was pre-seeded with the guessed name `action`, so
  `action.kind === "at-source"` was harvested as a CLI verb. The auto-fixer was
  **one dry-run away** from writing `at-source`, `restart-dispatch` and `RED` into
  31 organ headers as if they were commands.
- The auto-fixer **did run** and wrote 4 edits; **2 were wrong** (it extended an
  OPTION-VALUE bracket: `[--tier T0|brief|packet|…]`) and were reverted by hand.
  **The deeper fault was the ORACLE** — G-FIRST passed both, because it asked only
  "does the verb appear on the line". An oracle that cannot tell a good fix from a
  bad one is not an oracle.
- The fixer wrote `list|tick` into xray's own header. Those leaked from **xray's
  own comments**: the `|| "default"` scan covers a whole arrow-function initialiser
  span, comments included. **The parser read its own documentation as code.**

**And the joke that was also a bug:** the header comment explaining that three
organs contain literal NUL bytes and are invisible to `grep -rn` was itself
written **with a literal NUL in it**. `xray.mjs` became the fourth grep-invisible
file in the repo — its own detector's blind spot, inside its own documentation of
that blind spot.

## 4 — THE BUG MUSEUM · **5 of 6 CAUGHT** (measured, and the miss is named)

| exhibit | detector | result |
|---|---|---|
| B1 dead read (`rejirah_state.json`) | xray Q1 | **CAUGHT** |
| B2 filter on a field that does not exist | state-mutant matrix | **MISSED** |
| B3 27 dealt / 0 answerable | xray headerDrift | **CAUGHT** |
| B4 canon asserting a same-day-fixed defect | docs checker | **CAUGHT** |
| B5 meter lying about its own components | treasury | **CAUGHT** |
| B6 green at home, red on CI | the sandbox IS a CI checkout | **CAUGHT** |

**B2 is open and it is the most interesting one.** The mutant applies but no
detector fires, which means the state-mutant matrix does not yet reach
`captains_call`'s card filter. Named here rather than quietly dropped, because the
cheapest way to make a museum read 6-of-6 is to delete the exhibit that misses —
and the suite now asserts all six exhibits still exist for exactly that reason.

## 5 — WHAT IS STILL OPEN

- **B2** above.
- **E1 has a lane it never had.** `node scripts/sandbox.mjs ci` runs a
  `git ls-files` checkout with **all four localhost daemons unreachable by
  construction** — the one variable no local reproduction could hold constant
  without stopping his live organism. Not yet run to a conclusion.
- **`unresolved_sinks` = 4,772**, recorded and asserted non-increasing. That is the
  analyzer's honest blind spot and it can now only shrink.
- The auto-fix class is **one rule wide**. Under the four-condition gate, most
  findings in this repo are genuinely RULINGS, and each now carries WHY in its own
  words. The sharpest: "fixing" a header that claims SOLE WRITER to match code that
  disagrees would **paper over a real law breach** — the audit becoming the bug.

---

## 6 — THE SECOND PASS: the four gaps, and what RUNNING them found

`sandbox.mjs canary` proved the collar. These four organs existed but had never
been RUN end to end. Running them is the whole point — an unrun system is a
hypothesis, and that includes the audit.

### 6.1 THE STATE-MUTANT INVARIANCE MATRIX — 8 DEAD READS

Corrupt a field an organ claims to read; if its output does not change, the read
is dead. Measured over the declared lifecycle files × 10 operators:

```
DEAD  benchmark.mjs   report ← learning_state.json    noticed 0/10
DEAD  dmn.mjs         status ← learning_state.json    noticed 0/10
DEAD  captains_call   status ← brain_config.json      noticed 0/9
DEAD  conductor.mjs   plan   ← readiness.json         noticed 0/10
DEAD  nikhil_model    report ← readiness.json         noticed 0/10
DEAD  shadow.mjs      status ← readiness.json         noticed 0/10
DEAD  benchmark.mjs   report ← missions.json          noticed 0/10
DEAD  captains_call   status ← missions.json          noticed 0/10
```

All eight are ALSO **silent feature loss**: DELETE the file entirely and the
output is byte-identical, with no error. `benchmark.mjs` is the sharpest —
benchmark is GATED on the missions audit closing, and its own report does not
react to `missions.json` in any way.

**THE HONEST LIMIT, stated because it changes what these rows mean:** the matrix
exercises each organ's cheap READ-ONLY verb (`report`/`status`/`plan`). A DEAD row
therefore proves *this verb's output does not depend on that file* — NOT that
nothing in the organ does. The organ's writing paths may well use it. That is
still a real finding (a status verb that ignores its own inputs is a status verb
that cannot tell you when they break), but it is a narrower claim than "dead code".

**NOT MEASURED, and stated rather than hidden:** 4 lifecycle files are GITIGNORED
and therefore absent from a `git ls-files` sandbox — which is exactly the CI world,
so this is a real limit, not an oversight. 23 further readers were capped.

### 6.2 CHAOS — 7 organs LIE when their input is gone

Byte-identical output with the file DELETED *and* with it corrupted:
`presence ← buckets` · `benchmark ← concepts` · `daemon_watchdog ← conductor` ·
`watchman ← conductor_evening` · `benchmark ← course` · `benchmark ← dossier_weights`.
That is not resilience. An organ that says nothing is wrong while its input is
gone is worse than one that crashes, because the silence is indistinguishable
from health.

### 6.3 §8 — THE DOCS, EXECUTED

**1,044 cited grep-claims verified GREEN.** 15 genuinely STALE. 139 honestly
reported UNRUNNABLE. 6 stale global count-claims (`all 75 organs` → 84,
`all 73 suite members` → 81).

The checker was WRONG THREE TIMES before it was right, each time calling WORKING
evidence broken — the exact failure it exists to find, committed by the finder:
JS `^` anchors to the string where grep anchors per LINE; BRE escapes its
metacharacters BACKWARDS from JS (`\|` is alternation in grep, a literal pipe in
JS; bare `(` is a literal in BRE, a group in JS); and **not every cited command is
a hit-claim** — this repo cites `grep -rn -i "haiku" scripts/oura_coach.mjs`
precisely to prove absence, where returning nothing is the claim being TRUE.

### 6.4 THE BUG MUSEUM — **6 of 6**

B2 reported MISSED for three runs. The detector was fine every time; the
INJECTION was a no-op, because the mutant hardcoded the filter parameter name as
`c` while the file writes `.filter((r) => …)`. **That is the fourth time in this
audit that a MISS was the mutant rather than the detector** — when a negative
control fails, suspect the control first.

### 6.5 THE TWO SAFETY GAPS, CLOSED

- **WORKTREE**: the fixer now runs on `audit/autofix-<ts>` and cannot reach the
  live tree. It shipped without this, applied 4 edits directly, 2 were wrong, and
  only a hand-read of the diff caught them.
- **QUARANTINE**: `applied_at` on commit, `held_at` only after the WATCHMAN's own
  overnight verdict shows no new RED; not HELD in 48h ⇒ AUTO-REVERT. Deliberately
  the watchman's verdict and not a suite run of its own, because "the suite went
  green" is the weakest evidence in this repo.
- **THE UNSOUNDNESS RATCHET WAS THE WRONG SHAPE** and could have been silenced
  forever by DELETING an organ (a smaller repo has fewer sinks). A budget that can
  be met by removing code is not a budget. It is now PER ORGAN.

---

## 7 — §7(e) THE SEMANTIC PASS, and E1 CLOSED

### 7.1 E1 IS GREEN — cause found, fixed, verified

`node scripts/sandbox.mjs ci` → **`away-day exit code: 0`**. Red since 7 Aug.

**THE CAUSE WAS BUG CLASS 6, COMMITTED BY THE FIX THAT CLOSED THE TWO DEAD WIRES.**
The 12 Aug B4 repair added four assertions to `dugout.mjs` that check the RENDERED
opening briefing — and the briefing renders from `fsrs_store.json`,
`captains_call.json` and `missions.json`, **all three gitignored**. They passed at
home and could never pass on a clean checkout.

Two things made this findable at last, and neither was available before:
- the sandbox is built from `git ls-files`, so it IS the CI checkout;
- the collar denies the network, holding the four localhost daemons
  (4111/4112/4113/5600) unreachable — the one variable no local reproduction
  could control "short of stopping his live organism".

The repair splits each assertion: the **WIRING** claim (that the Re-Jirah line no
longer reads `rejirah_state.json`, that the missions line no longer filters on a
`status` field that never existed) is asserted UNCONDITIONALLY off the source and
can never regress. The **RENDERED** claim runs only where the data exists, and its
absence is PRINTED, never silently skipped.

⚠ Two earlier CI runs failed on the AUDIT'S OWN COLLAR, not on CI: npm needs a
cache dir outside the sandbox, and `awayday` shells `npm` through cmd.exe. Both
were fixed by moving npm's dirs INTO the sandbox and allowing the shell for that
lane only — never by widening the collar, which is how a collar stops being one.

### 7.2 THE SEMANTIC PASS — 13 confirmed, and FIVE were in the audit itself

Five lenses, 30 raw findings, each adversarially refuted by an independent agent:
**13 CONFIRMED, 17 REFUTED.** This is the only class deterministic measurement
misses BY CONSTRUCTION, and it paid for itself immediately — **five of the thirteen
were bugs in the organs built earlier the same day**, every one of which was
perfectly green under xray, blackbox, mutagen, herd and treasury:

1. **G-FIRST verified the LIVE tree while the fix landed in the WORKTREE.** The
   safety change silently disabled the entire fixer: every auto-fix was refused
   with "the oracle stayed RED after the fix" — a refusal plausible enough to read
   as a finding about the repo.
2. **THE MONEY ORACLE COULD NOT FAIL.** Both arms were structurally empty (one
   filtered on `t.allowed`, a field nothing ever sets). A constant `true` wearing
   the costume of a measurement. It now has a planted-row negative control that
   proves it can still return false.
3. **The ONE-OPEN-CARD cap could never reopen** — nothing could write the row it
   waited for, so after the first card the audit would go silent FOREVER and look
   healthy doing it. The TTL now closes it, recording his silence as the logged
   answer the card already promised.
4. **The forge-session HARD REFUSE read `j.open`** — a field `forge_session.json`
   has never had. The guard protecting his study time was structurally dead.
5. **Quarantine logged `reverted` whether or not anything was reverted**, against
   commits that by construction live on an unmerged worktree branch. A ledger
   recording intent as outcome is the same near-lie as a card reporting an unread
   item as handled.

The other eight are in the organism proper and are RULINGS, not auto-fixes. The
sharpest: **the card the Gaffer reads aloud is not the card his "haan" answers** —
the briefing names the last unanswered card, while an id-less `answer` binds to
the most-recently-DEALT card, and nothing makes those two agree. Verified live on
the 42-card deck: the briefing names c42, the bind resolves to c9.
