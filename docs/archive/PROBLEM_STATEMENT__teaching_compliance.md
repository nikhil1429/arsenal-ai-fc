# PROBLEM STATEMENT — the teaching-compliance loop is not closed

> **Written:** 6 Aug 2026, at the captain's instruction, from a live FORGE session on `hallucinations`.
> **For:** a fresh session that will diagnose and repair this.
> **This document contains NO solutions, by explicit instruction.** Every finding below is a
> *symptom plus the evidence that produced it*. The repair approach is deliberately left open —
> think it through from the evidence, do not inherit a plan from this file.
> **Everything stated here was verified by reading code and state files on 6 Aug 2026, not from
> `.md` documentation.** Where something was NOT verified, it says so.

---

## 0. WHO THIS IS FOR AND WHY IT MATTERS

This repo is a personal accountability + learning system for one human — Nikhil, diagnosed and
medicated **ADHD-PI**. The whole premise of the organism, stated repeatedly by him in his own
words, is that **executive-function load is the bottleneck**, so the machine carries the checking
and he carries the learning.

His words on 6 Aug 2026, which are the reason the organ at the centre of this document exists:

> *"bruh i have adhd pi, my brain can not keep on checking it everytime if you are studying
> correctly, how can we make sure it works 100% correctly"*

And later the same day, after discovering the state described below:

> *"are you noting down all of the things which you fucked up today because keep me out of this
> picture, my adhd brain should not get this tax"*

**This is not a code-quality problem. It is a load-bearing accessibility problem.** Every defect
below has the same shape: a mechanism intended to remove monitoring load from him either does not
run, or hands the load back to him. When it fails, he becomes the compliance monitor of his own
tutor — which is precisely the state the organism exists to prevent.

---

## 1. THE GOAL — what this loop is supposed to do, in full

There is a set of teaching rules (how Claude must teach him — one idea per message, Hinglish, real
terminology, never cut his scope, take "samajh nahi aaya" literally, and so on). These rules live
in `dressing-room/state/teaching_contract.json` and are derived from
`learning-layer/HOW_HE_LEARNS.md`, which is a forensic record of his own past sessions.

The intended end-to-end loop is:

1. **INJECT** — every turn, the current highest-priority teaching rules are placed in front of
   Claude, so the rules cannot drown across a long session.
2. **OBSERVE** — every turn of the conversation (his message and Claude's teaching message) is
   captured automatically, with zero action from him.
3. **CHECK** — every teaching turn is measured against the rules by *code*, not by the model
   grading itself, and not by him noticing.
4. **RANK** — the rules that are actually being broken most often rise to the top of the injection
   order, so the contract sharpens itself against real failure rather than against a fixed list.
5. **PERSIST** — this ranking survives across sessions, so a mistake made today changes how the
   next session behaves.

The success condition of the whole loop, in one line:

> **A teaching mistake made in one session must change the next session's behaviour, without him
> having to notice it, remember it, report it, or approve it.**

**Step 1 works. Step 2 works. Steps 3, 4 and 5 do not currently happen at all.**

---

## 2. HOW THIS WAS DISCOVERED

During a live FORGE session on the concept `hallucinations` (6 Aug 2026), Claude broke teaching
rules repeatedly. Each time, Claude noticed *after the fact* and hand-filed a drift report. The
captain then asked why he was the one being asked to approve those reports, and instructed:

> *"check the code how is this thing wworking, stop the teaching rn ... go read the code and
> understand how things are working currently, do not rely upon .md files"*

The findings below are the result of that read.

**Note:** the repo's own META-FREEZE rule forbids system work mid-concept. It was overridden here
by the captain's explicit, repeated instruction — which is the documented exception. The FORGE
session on `hallucinations` is still **open** at step 3, axes `a` and `b` marked done-but-ungraded.

---

## 3. THE PROBLEMS

### PROBLEM 1 — The automatic compliance checker has never checked a single turn

`scripts/teaching_audit.mjs` is wired into the `Stop` hook in `.claude/settings.json` and therefore
executes after **every** assistant turn. Its stated job is to measure the turn against the teaching
rules and stage any drift it finds.

**It has audited zero turns since it was created.**

Evidence:

- The organ's own output log, `dressing-room/state/teaching_audit.jsonl`, **does not exist on
  disk.** It is written only when a turn is actually audited.
- `dressing-room/state/teaching_audit_last.json` **does** exist and was last written at
  `2026-08-06T17:13:27.142Z`, containing `{"step": null, "at": "..."}`. This proves the hook is
  firing every turn, and proves that on every firing it concluded there was no open forge session.
- There **was** an open forge session for the entire period. `dressing-room/state/forge_session.json`
  has been live since `2026-08-06T12:39:39.506Z` with `concept: "hallucinations"`.

The relevant read is at `scripts/teaching_audit.mjs:305`:

```js
const session = (readJson(join(STATE_DIR, "forge_session.json")) || {}).session || null;
```

The actual top-level keys of `dressing-room/state/forge_session.json`, read live:

```
concept, started_at, updated_at, step, steps_done, axes_done,
axes_deferred, axes_marked_at, question_moments, check_q_this_pass
```

There is no `session` key. `('session' in json)` returns `false`. The reader's expectation and the
file's actual shape do not agree, and nothing anywhere reports that disagreement.

The consequence chain is total: `session` is `null` → the scope gate in `auditTurn()` treats the
turn as a non-teaching turn → `audited` is `false` → nothing is logged and nothing is staged.
**The organ is silent in exactly the way a correctly-behaving organ would be silent when there is
no session to audit.** There is no distinguishable difference between "working and quiet" and
"dead", which is why this went unnoticed.

### PROBLEM 2 — The checker's own selftest passes 25/25 and is structurally incapable of catching PROBLEM 1

`node scripts/teaching_audit.mjs selftest` reports `ALL CHECKS PASSED (25 passed, 0 failed)`.

Every one of those 25 assertions calls `auditTurn()` with a hand-constructed session object, e.g.
`const OPEN = { concept: "hallucinations", step: 4, closed_at: null }`. **No assertion exercises
the path that reads the file from disk.** The defect in PROBLEM 1 lives exclusively in that
unreached path.

This is the more serious finding of the two, because it generalises: **a green selftest on this
organ currently carries no information about whether the organ runs.** The repo's own standing
principle is *"unrun system = hypothesis"* — this organ satisfied a selftest without ever having
been run end-to-end, and was treated as done.

Whatever the repair is, this class of failure must be considered, not just this instance of it.

### PROBLEM 3 — A second, independent defect in the same file, hidden behind the first

`scripts/teaching_audit.mjs:309` reads the previous turn's user text in order to run the
`confusion-is-literal` check (his rule: when he says "samajh nahi aaya", stop and restart from
zero — advancing the step anyway is a drift):

```js
userText: String(prev && prev.last_user_text || ""),
```

The only place `teaching_audit_last.json` is written is `scripts/teaching_audit.mjs:315-316`, and
it writes:

```js
JSON.stringify({ step: session ? Number(session.step) : null, at: new Date().toISOString() })
```

`last_user_text` is **never written by anything**. It was confirmed absent from the live file.

Therefore `userText` is always the empty string, and the `confusion-is-literal` check can never
fire — **even after PROBLEM 1 is resolved.** Fixing PROBLEM 1 alone would produce an organ that
runs, appears healthy, and still has one dead check inside it.

This check matters disproportionately: "take his confusion literally" is documented in
`learning-layer/HOW_HE_LEARNS.md` as one of the two rules whose violation damages him most.

### PROBLEM 4 — The drift ranking has never moved, so rule injection order is not evidence-driven

`dressing-room/state/teaching_contract.json` currently holds ten rules:

```
his-word · hinglish · terminology · link-back · decided ·
one-idea · his-level · no-system-mid-concept · confusion-is-literal · dheema-not-lamba
```

**Every one of them has `hits: 0`.** Not one rule has ever been recorded as broken.

The system's design intent, stated in `.claude/settings.json` and in the contract organ itself, is
that injection is *drift-ranked* — the rule he has been failed on most is placed first, every turn.
With all counters at zero, that ranking is running on nothing. The order he sees at the top of
every turn is not a reflection of what has actually been going wrong.

Note the distinction this raises but does not answer: `hits` is deliberately gated behind his
confirmation (see PROBLEM 6), while a code-measured audit is a different kind of signal from a
model-reported one. The interaction between those two paths is currently unresolved in the code.

### PROBLEM 5 — Today's five drift reports were all hand-filed by the model, and all filed under one rule id

Five drifts were staged during the 6 Aug session. **All five were written by Claude noticing its
own mistake after the fact.** None came from the audit organ, because the audit organ was not
running.

They were filed against these five real failures:

1. Marked axis `a` complete in the pacer before Jirah had happened, making the grade meaningless.
2. Did the identical thing again on axis `b`, one turn later.
3. Cut the scope of axis `d` unilaterally — narrowed a universal concept down to "the number useful
   for your project" without asking. The captain stopped reading mid-message and said so.
4. Used comparison tables repeatedly. He reported that tables confuse him **and that he had said so
   before** — a repeat offence against feedback already given in an earlier session.
5. Taught the formula for a metric before establishing what its inputs (`ground truth`, `eval set`,
   `closed-book`) actually meant, so he had to extract each definition by asking. This violates the
   repo's own stated rule that *coverage is Claude's job, never his questions*.

**All five were filed under the single rule id `his-word`.** Several of them plainly belong to
other rules in the list. This is itself evidence about the reliability of model self-reporting:
even when the model catches itself, its classification is coarse, which further degrades any
ranking built on top of it.

### PROBLEM 6 — Approving drift reports is currently his job, and he has named this as the wrong design

The current contract requires his explicit `confirm <id>` before a staged drift becomes a counted
hit. The stated reason is sound in general: the model must not be able to write and approve its own
rules, per the repo's `AI proposes · code validates · human approves` principle.

He raised the following objection, and it has not been resolved in code:

> *"brain ka kya kaam hain vrna?"* — i.e. if the machine already knows it broke a rule he himself
> approved long ago, why is he being asked to sign off on the *count*?

The distinction he is pointing at — between **authoring a new rule** (a judgement, arguably his)
and **counting violations of an already-approved rule** (a measurement, arguably not) — is not
currently represented anywhere in the code. Both go through the same gate.

**This is an open design question, not a defect with a known answer.** It requires a decision, and
the decision is his. It should be brought to him as a decision, with the tradeoffs made explicit.

### PROBLEM 7 — The checked rule set does not cover the failure modes that actually occurred today

The audit organ implements binary, threshold-free checks for a specific set of rules: number of
check-questions, presence of Hindi function words, presence of above-his-level phrases, presence of
a `scripts/` command mid-concept, section-break counting for dheema-vs-lamba, and step-advance
after a confusion marker.

Of the five real failures listed in PROBLEM 5, consider honestly how many of them any of those
checks would have caught **even if the organ had been running.** At least two of them — the
unilateral scope cut, and the wrong ordering of definitions before formula — have no corresponding
check at all.

**This is not a request to add checks.** It is a statement that the coverage of the checked set
versus the observed failure set is currently unknown and unmeasured, and that "the audit found no
drift" therefore cannot be read as "the teaching was clean". The organ's own report function
already says as much in its output; nothing acts on that caveat.

---

## 4. WHAT IS CONFIRMED WORKING — do not re-investigate these

State this plainly so the repair does not waste effort:

- **Capture is real and has zero tax on him.** `hooks/afferent-post.mjs` fires on both
  `UserPromptSubmit` and `Stop`. Live counts from `dressing-room/state/afferent.jsonl`:
  **3,881 afferents total; 125 today; 564 `claude-code` (his messages) and 403
  `claude-code-teaching` (Claude's teaching turns) all-time; 27 and 26 respectively today.**
  Last write `2026-08-06T17:09:05.240Z`. The conversation is being recorded.
- **Rule injection is real.** `teaching_contract.mjs print` and `forge_session.mjs contract` both
  fire on `UserPromptSubmit` and their output visibly reaches the session every turn.
- **The thalamus is accepting writes.** A `GET /health` on `127.0.0.1:4113` returns
  `{"error":"not found"}`, but that is a missing route, not a dead process — afferent rows are
  landing with current timestamps. **Do not conclude from the health check that it is down.**

---

## 5. CONSTRAINTS THE REPAIR MUST RESPECT

These are the repo's own standing laws. They are not negotiable and they are not suggestions.

- **Never replace, always layer.** If an engine changes, the old one is frozen verbatim in the same
  file and both stay in the codebase.
- **Single-writer law.** Each state file has exactly one owning script. `teaching_contract.json` is
  owned by `teaching_contract.mjs`; `forge_session.json` by `forge_session.mjs`;
  `teaching_audit.jsonl` by `teaching_audit.mjs`. No hand-editing of state files, ever.
- **A checker must never break his session.** Everything on the hook path is fail-silent, no
  stdout, no throw. A checker that can kill a session is worse than the drift it catches.
- **No guessed numbers.** His standing rule, 1 Aug 2026, in his own words: *"why are we setting
  numerical limits in the entire organism when we are starting it from the scratch? shouldn't
  everything in the organism be fully opened and then we analyze the data in 30-45-60 days and then
  think what should be the numerical limits??"* The existing audit organ is deliberately
  threshold-free for this reason. Anything requiring a real number is recorded, not judged.
- **AI proposes · code validates · human approves.** Nothing is auto-saved to canonical files or
  memory without his explicit approval.
- **Unrun system = hypothesis.** Nothing counts as done until it has actually run and the output
  has been shown. **This is the law that PROBLEM 1 and PROBLEM 2 exist because of.**
- **Implementation-before-modification.** Get his approval on the plan before writing code for
  anything non-trivial.

---

## 6. WHAT "SOLVED" LOOKS LIKE

Acceptance is defined by observed behaviour, not by a passing selftest — that is the whole lesson
of PROBLEM 2.

1. A teaching turn taken during an open FORGE session is demonstrably audited, with the resulting
   row visible on disk and shown as output.
2. A turn that genuinely breaks a rule is demonstrably caught, with the quoted evidence that
   triggered it.
3. A turn that is clean is demonstrably **not** flagged — the detector must be able to fail, or it
   is not a detector.
4. The gap between "this organ's tests pass" and "this organ actually runs in the live session" is
   closed in a way that would have caught PROBLEM 1, and would catch the next instance of the same
   class.
5. The dead check in PROBLEM 3 is either alive and demonstrated firing, or explicitly and visibly
   declared not-implemented — silence is not an acceptable third state.
6. The design question in PROBLEM 6 is put to him as a decision with tradeoffs, not resolved
   unilaterally in either direction.
7. The honest coverage gap in PROBLEM 7 is stated out loud somewhere he will see it, so that "no
   drift caught" is never mistakable for "taught correctly".

**And the one that matters most, in his terms:** none of the above may require him to notice,
remember, report, or approve a teaching mistake in order for the next session to be better.

---

## 7. EXPLICITLY OUT OF SCOPE

- The FORGE session on `hallucinations` is **open** and mid-concept (step 3, axes `a` and `b`
  marked done-but-ungraded, core axis `d` partially taught). **Do not close it, do not advance it,
  do not mark axes.** It is his to resume.
- Do not touch the learning content, the capsules, or `dressing-room/state/capsules/` (read-only
  mirror, owned by `mirror.mjs`).
- Do not confirm or dismiss the five staged drifts. That is his word alone.

---

## 8. REPRODUCTION — the exact commands used to establish the above

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
```

Relevant source: `scripts/teaching_audit.mjs` (457 lines) · `scripts/teaching_contract.mjs`
(1,094 lines) · `hooks/afferent-post.mjs` (88 lines) · `.claude/settings.json`.
