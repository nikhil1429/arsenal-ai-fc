# BRIEF — make the organism self-sustaining

> **Written:** 6 Aug 2026, at the captain's instruction, from a live FORGE session.
> **For:** the session that will design and build this.
> **This is the master brief. It supersedes and contains `PROBLEM_STATEMENT__teaching_compliance.md`**
> — that file remains as the detailed evidence appendix for the first cluster of defects, but
> everything needed to start is here.
>
> **THERE ARE NO SOLUTIONS IN THIS DOCUMENT, BY EXPLICIT INSTRUCTION.** Every finding is a
> *symptom plus the evidence that produced it*. Every open question is left open on purpose.
> Do not inherit an approach from this file. Work it out from the evidence, then bring it back.
>
> **Everything asserted here was verified on 6 Aug 2026 by reading code and running commands
> against live state — not from `.md` documentation.** Where something is unverified, it says so.
> **Do not trust this repo's `.md` files for how the system currently behaves.** The gap between
> what the docs claim and what the code does is itself one of the defects described below.

---

## 1. THE ONE-LINE ASK

> **Build the layer that makes this organism notice its own failures, so that the human never has
> to be the one who notices.**

Today he is that layer. That is the defect.

---

## 2. WHO THIS IS FOR, AND WHY IT IS NOT A CODE-QUALITY TASK

This repo is a personal accountability and learning system for one human — Nikhil, diagnosed and
medicated **ADHD-PI**. The entire premise, stated by him repeatedly and in his own words, is that
**executive function is the bottleneck**: the machine carries the checking, the remembering and the
counting, and he carries the learning.

His words, 6 Aug 2026, which are the reason this work exists:

> *"bruh i have adhd pi, my brain can not keep on checking it everytime if you are studying
> correctly, how can we make sure it works 100% correctly"*

> *"are you noting down all of the things which you fucked up today because keep me out of this
> picture, my adhd brain should not get this tax"*

> *"mein yahi thodi dekhta rahunga ab that are you following the standard correctly or gemini is
> following it correctly or is machine doing everything correctly?"*

> *"let brain fix things by itself, keep me out of this picture, that's organism job to self
> sustain itself"*

**Read those four quotes before you write a line of design.** Every defect below has the same
shape: a mechanism intended to remove monitoring load from him either does not run, or hands the
load back to him. When it fails he becomes the compliance monitor of his own tooling — which is
exactly the state this system exists to prevent. **This is an accessibility requirement, not a
nice-to-have.**

---

## 3. THE GOAL, IN FULL

There are **three separate watch-jobs**. He named all three. Their current state:

1. **Is Claude following the teaching standard?**
   An organ exists for this (`scripts/teaching_audit.mjs`). **It has never run.** See §5.1.
2. **Is Gemini following it?**
   **Nothing exists for this at all.** See §6.2.
3. **Is the machine itself working correctly?**
   **Nothing exists for this at all**, and on 6 Aug it cost two silent failures in one day, both
   caught by the human. See §6.1.

The end state he described, in his terms and mine:

> **He should never be the one who notices that something in this system is broken.**
> The organism catches it, and brings it to him with the evidence.
> **His only job is to say yes or no.**
> Everything short of that is load on him.

**A worked definition of "self-sustaining" for this repo**, so the target is not vague:

- The organism **detects** its own broken or lying organs, without being asked.
- It detects them **on a schedule**, not only when a human happens to look.
- It can tell the difference between *"this organ was correctly quiet"* and *"this organ is dead"*
  — today those two states are indistinguishable, and that is precisely how the failure in §5.1
  survived.
- What it finds reaches him **in the surface he already reads**, not in a file he must remember to
  open.
- Where a correction is inside rules he has **already approved**, it applies itself and reports.
- Where a correction requires a **new** judgement, it is brought to him as a decision with the
  tradeoffs, and it waits.

**The boundary between those last two is the central design question of this work. It is NOT
decided. See §7.1.**

---

## 4. WHAT ALREADY WORKS — do not rebuild these

Verified live, 6 Aug 2026. Stated plainly so effort is not wasted:

- **Capture is real, complete, and costs him nothing.** `hooks/afferent-post.mjs` fires on both
  `UserPromptSubmit` and `Stop`. Live counts from `dressing-room/state/afferent.jsonl`:
  **3,881 afferents total, 125 today; 564 `claude-code` (his messages) and 403
  `claude-code-teaching` (Claude's teaching turns) all-time — 27 and 26 respectively today.**
  Last write `2026-08-06T17:09:05.240Z`. **The full conversation is on disk. The evidence is not
  missing. Nobody reads it.**
- **Rule injection into the live session is real.** `teaching_contract.mjs print` and
  `forge_session.mjs contract` both fire on `UserPromptSubmit`, and their output visibly reaches
  the session every single turn.
- **The thalamus is accepting writes.** `GET /health` on `127.0.0.1:4113` returns
  `{"error":"not found"}` — that is a **missing route, not a dead process**; afferent rows are
  landing with current timestamps. **Do not conclude from that health check that it is down.**
  *(Note this as its own small instance of the general disease: a health endpoint that reports
  failure while the organ is fine.)*

---

## 5. THE DEFECTS — cluster 1: the teaching-compliance loop

Full evidence for this cluster is in `PROBLEM_STATEMENT__teaching_compliance.md`. Condensed here so
this brief stands alone.

### 5.1 The automatic compliance checker has never checked a single turn

`scripts/teaching_audit.mjs` is wired into the `Stop` hook and therefore executes after **every**
assistant turn. It has audited **zero** turns since it was created.

- `dressing-room/state/teaching_audit.jsonl` — the organ's own output log — **does not exist on
  disk.** It is written only when a turn is actually audited.
- `dressing-room/state/teaching_audit_last.json` **does** exist, last written
  `2026-08-06T17:13:27.142Z`, containing `{"step": null, "at": "..."}`. This proves the hook fires
  every turn **and** that on every firing it concluded there was no open forge session.
- There **was** an open forge session throughout. `dressing-room/state/forge_session.json` has been
  live since `2026-08-06T12:39:39.506Z` with `concept: "hallucinations"`.

The read at `scripts/teaching_audit.mjs:305`:

```js
const session = (readJson(join(STATE_DIR, "forge_session.json")) || {}).session || null;
```

The actual top-level keys of that file, read live:

```
concept, started_at, updated_at, step, steps_done, axes_done,
axes_deferred, axes_marked_at, question_moments, check_q_this_pass
```

`('session' in json)` returns **`false`**. The reader's expectation and the file's shape do not
agree, and nothing anywhere reports that disagreement. `session` is `null` → the scope gate treats
every turn as a non-teaching turn → `audited` is `false` → nothing logged, nothing staged.

**The critical property: a dead organ and a correctly-quiet organ produce identical output —
silence. That is why this survived.**

### 5.2 Its own selftest passes 25/25 and is structurally incapable of catching 5.1

`node scripts/teaching_audit.mjs selftest` → `ALL CHECKS PASSED (25 passed, 0 failed)`.

All 25 assertions call `auditTurn()` with a **hand-constructed** session object
(`{ concept, step, closed_at }`). **No assertion exercises the disk-reading path**, and the defect
lives exclusively in that path.

**This is the more serious finding, because it generalises: a green selftest on this organ
currently carries zero information about whether the organ runs at all.** The repo's own law is
*"unrun system = hypothesis"* — this organ satisfied a selftest, was treated as done, and had never
run end-to-end.

### 5.3 A second, independent dead check hidden behind the first

`scripts/teaching_audit.mjs:309` reads `prev.last_user_text` to run the `confusion-is-literal`
check — his rule that when he says *"samajh nahi aaya"*, teaching stops and restarts from zero, and
advancing the step anyway is a drift.

The only writer of that file is `scripts/teaching_audit.mjs:315-316`, and it writes only
`{ step, at }`. **`last_user_text` is never written by anything**, confirmed absent from the live
file. `userText` is therefore always empty and this check can never fire — **even after 5.1 is
resolved.** Fixing 5.1 alone yields an organ that runs, looks healthy, and still has a dead check
inside it.

This rule matters disproportionately: `learning-layer/HOW_HE_LEARNS.md` records it as one of the
two whose violation damages him most.

### 5.4 The drift ranking has never moved

`dressing-room/state/teaching_contract.json` holds ten rules — `his-word · hinglish · terminology ·
link-back · decided · one-idea · his-level · no-system-mid-concept · confusion-is-literal ·
dheema-not-lamba`. **Every one has `hits: 0`.**

The design intent is *drift-ranked* injection: the rule he has been failed on most goes first,
every turn. With all counters at zero that ranking runs on nothing, and the order he sees at the
top of every turn does not reflect what has actually been going wrong.

### 5.5 The five drifts filed on 6 Aug were all hand-filed by the model, all under one rule id

Five drifts were staged during the session. **All five came from Claude noticing its own mistake
after the fact.** None came from the audit organ. They record these real failures:

1. Marked axis `a` complete in the pacer **before** Jirah, making the grade meaningless.
2. Did the identical thing to axis `b` one turn later.
3. Cut the scope of axis `d` unilaterally — narrowed a universal concept to *"the number useful for
   your project"* without asking. He stopped reading mid-message and said so.
4. Used comparison tables repeatedly. He reported that tables confuse him **and that he had said so
   in an earlier session** — a repeat offence against feedback already given.
5. Taught a metric's formula before establishing what its inputs (`ground truth`, `eval set`,
   `closed-book`) meant, so he had to extract each definition by asking — violating the repo's own
   rule that *coverage is Claude's job, never his questions*.

**All five were filed under the single rule id `his-word`**, though several plainly belong to other
rules. This is direct evidence about the reliability of model self-reporting: even when the model
catches itself, its classification is coarse — which further degrades any ranking built on it.

### 5.6 Approving drift reports is currently his job, and he has named this as wrong design

A staged drift becomes a counted hit only after his explicit `confirm <id>`. The stated reason is
sound in general — the model must not author and approve its own rules
(*AI proposes · code validates · human approves*).

His objection, unresolved in code:

> *"brain ka kya kaam hain vrna?"* — if the machine already knows it broke a rule **he approved
> long ago**, why is he signing off on the *count*?

The distinction he is pointing at — **authoring a new rule** (a judgement) versus **counting
violations of an already-approved rule** (a measurement) — is not represented anywhere in the code.
Both pass through the same gate. **This is an open decision, and it is his. See §7.1.**

### 5.7 The checked rule set does not cover the failures that actually occurred

The audit implements binary, threshold-free checks for: question count, Hindi function words,
above-his-level phrases, `scripts/` commands mid-concept, section-break counting, and step-advance
after a confusion marker.

Of the five real failures in §5.5, ask honestly how many any of those would have caught **even had
the organ been running.** At least two — the unilateral scope cut, and formula-before-definitions —
have no corresponding check at all.

**This is not a request to add checks.** It is a statement that the coverage of the checked set
versus the observed failure set is unknown and unmeasured, and therefore *"the audit found no
drift"* cannot be read as *"the teaching was clean"*. The organ's own report function says as much
in its output; nothing acts on that caveat.

### 5.8 The context-fill gauge reports confidently and measures the wrong thing

**Not in the earlier problem statement — found later the same day, and it is the second instance of
the general disease.**

`scripts/teaching_contract.mjs:90`:

```js
const DEFAULT_TRANSCRIPT_WARN_BYTES = 1_500_000;
```

The comment above it (`:82-87`) states the constant was **derived, not guessed** — across 3,780
transcripts in this project's store: p50 28,197 · p90 63,367 · p95 99,557 · p99 2,263,929 · max
12,171,532 bytes, with only 49 (1.3%) ever passing 1 MB. `:88` already labels it a **v0 hypothesis
("transcript bytes are not context tokens")**.

**Measured live, first real test of that hypothesis, 6 Aug 2026:** the transcript stood at
**0.92 MB** while the actual context window read **234.7k / 1.0M tokens = 23% full, 77.9% free**.
The soft warning fired at **23%** real fill; later in the same session the hard warning fired at
roughly **35%** real fill.

Arithmetic, shown so it can be checked: 964,000 bytes ÷ 234,700 tokens ≈ **4.1 bytes per token** —
so the *byte-to-token proxy is sound*. A 1.0M-token window is therefore ≈ **4.1 MB** of transcript.
The 1.5 MB budget is ≈ **36% of the real window**, and `SOFT_FRACTION = 0.6` (`:91`) puts the first
warning at ≈ **22%** of it.

**The measurement is fine. The budget answers the wrong question.** It was derived from *"how long
do his sessions historically get"* and then used to answer *"how much can the model actually
hold"*. Those are different questions.

**Consequence, and why it matters more than the number:** on 6 Aug this false alarm caused Claude
to advise him to abandon a healthy session and start a new one. **A gauge that cries wolf trains
him to ignore it — which is the exact failure mode the constant's own comment says it was designed
to avoid.** Note also that this defect points the opposite way from §5.1: one organ was silent when
it should have spoken; this one speaks when it should be silent. **Same disease, both directions.**

The constant lives in state (`transcript_warn_bytes`), so it is retunable without editing the file.
**Do not retune it without bringing him the reasoning first** — see §8 on guessed numbers.

---

## 6. THE DEFECTS — cluster 2: nothing watches the watchers

### 6.1 No organ-liveness layer exists

**This is the heart of the brief.**

On 6 Aug two organs failed in one day. **Both were caught by the human, neither by the machine.**
Their common shape:

> **Every organ reports its own health. Nothing checks whether the reporter is alive, or whether it
> is measuring the right thing.**

`teaching_audit.mjs` was dead and its selftest was green. The context gauge was wrong and reported
with full confidence. In both cases the organism's own output looked exactly like health.

What would have caught §5.1 on day one is not subtle: **something that asks whether an organ which
was supposed to produce output today produced any.** `teaching_audit.jsonl` did not exist. That was
not hidden. Nobody asked.

Related, and unmeasured: `scripts/organism_test.mjs` and the `/organism-doctor` skill exist, but
**both require him to run them**, which puts them on the wrong side of the line this whole brief is
about. Their current coverage has **not** been assessed and should be, before anything new is built.

### 6.2 The Gemini surface has no compliance check whatsoever

`teaching_audit.mjs` only ever sees Claude Code turns, via the `Stop` hook payload. Reps and
sessions arriving from the Gemini/Colab handoff (`/paste-session`, `capture.mjs paste|pull`) pass
through **no teaching-compliance check of any kind.**

He named this explicitly as one of the three things he refuses to keep watching himself. Its current
state is: **not covered, not measured, not planned.**

---

## 7. THE OPEN QUESTIONS — decide nothing unilaterally, bring these back

### 7.1 How far does "self-sustaining" go? — **RULED BY HIM, 6 Aug 2026. NOT OPEN.**

This was going to be brought to him as a decision. He pre-empted it and ruled, explicitly and
repeatedly, in the same session:

> *"let brain fix things by itself, keep me out of this picture, that's organism job to self
> sustain itself"*

> *"ok keep it on max and let it resolve all the issues by itself, do not keep me in the loop"*

**THE RULING: the organism detects, diagnoses AND repairs on its own. It does not stop to ask.**

This knowingly overrides the repo's standing *AI proposes · human approves* / *AUTO-APPROVE KABHI
NAHI* law **for this self-repair lane only**. The override is his, it is explicit, it is repeated,
and it is recorded here with his words so it stays auditable. It does **not** extend to the learning
layer, to canonical files, or to anything outside organ self-repair.

**The tension is real and it does not disappear because he ruled.** It converts into an engineering
requirement on *how* the repair happens, not *whether*:

- Every self-applied change must be **reversible**, with the revert path recorded at the time of the
  change — not reconstructed later.
- Every self-applied change must be **logged with the evidence that triggered it**, so a wrong
  repair is findable after the fact rather than silent. **A silent bad fix is strictly worse than
  the original defect**, because the organism's own reports would then be lying — which is the exact
  disease in §5.1 and §5.8.
- The self-repair lane touches **organs and their state**, never the learning content, never
  `dressing-room/state/capsules/`, never canonical `.md` files. See §10.

**Design this boundary yourself and state where you drew it.** Do not come back to ask.

### 7.2 Cadence — **RULED BY HIM, 6 Aug 2026. NOT OPEN.**

> *"i think it should be checked everyday at night"* · *"keep it on max"*

**THE RULING: nightly, and the repair tier runs at max effort.**

He also directed a **two-tier split**, and the reasoning is his — it should be honoured, not
re-litigated:

- **TIER 1 — DETECTION. Deterministic code, every night, NO LLM.** Free, quota-free, cannot
  hallucinate, cannot fail on a slow API. *"Which organ was supposed to produce output today and
  produced none?"* is a file check, not a judgement. **The entire failure of §5.1 — a log file that
  did not exist — was catchable by `ls`.** Anything in Tier 1 that needs an LLM to decide is
  probably in the wrong tier.
- **TIER 2 — DIAGNOSIS AND REPAIR. `claude -p --model claude-opus-5 --effort max`, invoked ONLY
  when Tier 1 has actually found something.** A clean night costs nothing. A bad night gets the
  full model.

Verified 6 Aug 2026: `--model`, `--effort` and `--agents` are real flags on this `claude` CLI and
work with `-p`. **"Ultracode" as a named mode was NOT verified to have a headless flag** — do not
assume one exists; establish it before depending on it.

**Billing reality, and this is load-bearing:** `CLAUDE.md`'s build order lists M-3 *"`claude -p` +
billing guards"* as **NOT BUILT**. There is no billing guard in this repo today. His plan usage on
6 Aug read *Weekly · all models 38%*. A nightly max-effort multi-agent run against a healthy system
would burn his quota on nothing and leave nothing for the night something actually breaks. **The
Tier-1/Tier-2 split is what makes his ruling affordable — treat it as a requirement, not a
suggestion.**

**One number is deliberately left un-fixed**, per his standing *"no guessed numbers"* rule: start at
Opus 5 / max effort because a wrong diagnosis is expensive, then after 30-45 days of real data look
at how often Tier 2 actually fired and revisit. **Record the data so that decision is possible
later; do not pre-decide it now.**

### 7.3 What counts as "an organ that should have produced output"?

Some organs are legitimately quiet for days. Distinguishing *correctly quiet* from *dead* is the
core of §6.1 and it is not obvious. **This is a design problem, not a lookup.**

### 7.4 How does a finding reach him?

He does not open files he is not already reading. A report nobody reads is the same as no report.
Which existing surface carries this, and what happens when there is nothing to say, are open.

### 7.5 What is the coverage of the existing self-checks?

`organism_test.mjs`, `/organism-doctor`, and each organ's `selftest` — **measure what they actually
cover before building anything new.** §5.2 shows a selftest can be green and meaningless; assume
nothing about the others without checking.

---

## 8. CONSTRAINTS — the repo's own laws, non-negotiable

- **A checker must never break his session.** Everything on a hook path is fail-silent: no stdout on
  success, no throw, no block. A checker that can kill a session is worse than the drift it catches.
- **No guessed numbers.** His standing rule, 1 Aug 2026, verbatim: *"why are we setting numerical
  limits in the entire organism when we are starting it from the scratch? shouldn't everything in
  the organism be fully opened and then we analyze the data in 30-45-60 days and then think what
  should be the numerical limits??"* The existing audit organ is deliberately threshold-free for
  this reason — anything needing a real number is **recorded, not judged**. **§5.8 is what happens
  when a number derived for one purpose is silently reused for another; that is the failure mode to
  avoid, not "numbers are forbidden".**
- **Never replace, always layer.** A changed engine is frozen verbatim in the same file; both stay
  in the codebase; a migration note explains why.
- **Single-writer law.** Every state file has exactly one owning script — `teaching_contract.json`
  → `teaching_contract.mjs`; `forge_session.json` → `forge_session.mjs`; `teaching_audit.jsonl` →
  `teaching_audit.mjs`; `capsules/` → `mirror.mjs`. **No hand-editing of state files, ever.**
- **Unrun system = hypothesis.** Nothing is done until it has actually run and the output has been
  shown. **§5.1 and §5.2 exist because this law was not honoured.**
- **Implementation-before-modification** — **AMENDED FOR THIS WORK BY HIS EXPLICIT INSTRUCTION,
  6 Aug 2026:** *"i do not [want] issues data, i want direct fixes."* For the mechanically
  determined defects in §5 you are to **fix them directly and show them running** — do not stop to
  ask. The law still holds for the two items in §7.1 and §7.2, which are **rulings, not bugs**, and
  cannot be decided without him. See §12.
- **The repo is PUBLIC.** Credentials (`oura_*`) and biometrics (`readiness.json`,
  `intake_log.json`) are gitignored and must stay that way.

---

## 9. WHAT "DONE" LOOKS LIKE

Acceptance is defined by **observed behaviour**, never by a passing selftest — that is the whole
lesson of §5.2.

1. A dead or lying organ is detected **by the machine**, on a schedule, with the evidence quoted.
2. A deliberately broken organ is demonstrably caught — **shown running, with real output.**
3. A healthy organ is demonstrably **not** flagged. A detector that cannot fail is not a detector.
4. The gap between *"this organ's tests pass"* and *"this organ actually runs live"* is closed in a
   way that **would have caught §5.1**, and would catch the next instance of that class.
5. The dead check in §5.3 is either alive and shown firing, or **visibly declared
   not-implemented** — silence is not an acceptable third state.
6. §5.8 is resolved with reasoning shown, not a swapped constant.
7. The honest coverage gap in §5.7 is stated somewhere he will see it, so *"no drift caught"* is
   never mistakable for *"taught correctly"*.
8. §7.1 and §7.2 come back to him as **decisions with tradeoffs**, not as choices already made.

**And the one that outranks all of the above:**

> **None of this may require him to notice, remember, report, or approve a failure in order for the
> system to get better. If the design still needs him to be watching, it has not solved the
> problem — it has renamed it.**

---

## 10. OUT OF SCOPE

- The FORGE session on `hallucinations` is **open and mid-concept** (step 3; axes `a` and `b` marked
  done-but-**ungraded**; core axis `d` partially taught). **Do not close it, do not advance it, do
  not mark any axis.** It is his to resume.
- **Do not confirm or dismiss the five staged drifts.** That is his word alone.
- Do not touch the learning content or `dressing-room/state/capsules/` (read-only mirror owned by
  `mirror.mjs`).
- Do not change `DEFAULT_TRANSCRIPT_WARN_BYTES` before bringing him the reasoning.

---

## 11. REPRODUCTION — the exact commands behind every claim above

```bash
cat .claude/settings.json
node -e "const j=require('./dressing-room/state/forge_session.json'); console.log(Object.keys(j).join(', ')); console.log('session' in j)"
ls -la dressing-room/state/teaching_audit.jsonl        # does not exist
cat dressing-room/state/teaching_audit_last.json       # {"step": null, ...}
node scripts/teaching_audit.mjs selftest               # 25 passed, 0 failed
node scripts/teaching_audit.mjs report
node -e "const j=require('./dressing-room/state/teaching_contract.json'); console.log((j.rules||[]).map(r=>r.id+':'+(r.hits||0)).join(' | ')); console.log('staged:',(j.staged||j.pending||[]).length)"
grep -rln "teaching_contract" --include=*.mjs scripts hooks
grep -rl  "claude-code-teaching" --include=*.mjs .
sed -n '70,110p' scripts/teaching_contract.mjs         # the derived context budget + its own hypothesis note
```

Relevant source: `scripts/teaching_audit.mjs` (457 lines) · `scripts/teaching_contract.mjs`
(1,094 lines) · `hooks/afferent-post.mjs` (88 lines) · `scripts/organism_test.mjs` ·
`.claude/settings.json` · companion evidence file `PROBLEM_STATEMENT__teaching_compliance.md`.

---

## 12. START HERE — AND ACTUALLY FIX IT

**His instruction, verbatim, 6 Aug 2026:** *"i do not [want] issues data, i want direct fixes."*

**He does not want a report. He wants working code.** Take that literally.

### Fix these directly. Do not stop to ask.

**§5.1 · §5.2 · §5.3 · §5.4 · §5.8 · §7.5** are mechanically determined — the evidence fully
constrains what correct behaviour is, and no judgement of his is required. **Verify each one first
with the commands in §11** (do not take this document's word for anything), then **fix it, run it,
and show the real output.** A claim is not a fix; §9 defines "done" as observed behaviour, and §5.2
is the standing proof that a green selftest can mean nothing at all.

Then build the **§6.1 organ-liveness layer** — the heart of this brief — as far as it can be built
without answering §7.1 and §7.2, and keep going until you genuinely hit those two walls.

### Nothing comes back to him. He has ruled on everything.

**§7.1 and §7.2 were the two open decisions. He closed both on 6 Aug 2026** — read them, they now
carry his verbatim words. Self-repair is authorised; cadence is nightly; the repair tier runs at
max effort; detection is deterministic and LLM-free.

**§5.7 and §6.2 need scoping calls. Make them yourself and state what you chose and why.**

His instruction on this is unambiguous and was repeated four times in one session:
*"do not keep me in the loop."* **Do not send him a list of questions. Do not send him options to
pick from. Decide, build, run it, and show him it working.**

The one thing that is **not** a licence: §7.1's reversibility and logging requirements are
engineering constraints on how self-repair works, not decisions you may skip.

### The standard for reporting back

Short. What you fixed, the output proving each fix runs, what you chose and why, and the two
rulings. **He has ADHD-PI — a long report is a failure of this brief, not a fulfilment of it.**
