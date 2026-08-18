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
>
> **READ THIS BEFORE THE REST — CORRECTION PASS, 10 Aug 2026 (his order: "a lot of .md files
> content is old and stale, we need to correct it as per the current code").** This brief was
> written as a *work order for a build that had not happened yet*, and **the build happened.**
> Every defect in §5 and §6 was repaired between 6 and 10 Aug (commits `0a0711c` "The teaching
> rules stop being advice and start being checked" · `f2acdcc` "…the authority stops crying wolf"
> · `59eaf17` "The dead auditor comes back to life, and the night gets a watchman" — read them
> with `git log --oneline -- scripts/teaching_audit.mjs scripts/watchman.mjs`). The present-tense
> defect prose below is **left standing verbatim because it is the evidence record**, but every
> claim that has since flipped now carries an inline **CORRECTED 10 Aug 2026** scar naming what is
> true today and how to check it live. **Read this file as history plus its scars, never as a
> to-do list** — a session that acts on the uncorrected sentences will rebuild organs that already
> run, which is the exact rot this pass exists to stop.
>
> **The same discipline applies to every number below.** Where a count was hardcoded from a 6 Aug
> reading, the scar replaces it with the command that reads it live, because a count in prose is
> false on the next run.

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

> **CORRECTED 10 Aug 2026 — all three statuses above are 6 Aug statuses and all three have moved.
> Do not read the three lines as current.**
> **(1)** `teaching_audit.mjs` runs on both `UserPromptSubmit` and `Stop` and has audited real
> turns — read the live number, never this sentence: `node scripts/teaching_audit.mjs report`
> (on 10 Aug it printed `202 turn(s) audited · 111 with drift`, and
> `dressing-room/state/teaching_audit.jsonl` — the file §5.1 says does not exist — is on disk).
> **(2)** The Gemini surface has a lane now: `scripts/harvest.mjs` (shipped 9 Aug, commit
> `7522fb5` "P7 unleash: the blind eye opens") carries a whole Gem sitting onto the bus, and
> `gemini_quality.jsonl` records per-batch outcomes at the `capture.mjs paste` door. Coverage is
> **remeasured live on every print** rather than written down — see §6.2's scar.
> **(3)** `scripts/watchman.mjs` exists and runs nightly on its own scheduled task. Check both
> live: `Get-ChildItem scripts/watchman.mjs` and `schtasks /query /fo csv | Select-String
> "Watchman"` (on 10 Aug: `"\ArsenalFC-Watchman","10-08-2026 23:55:00","Ready"`).

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
  > **CORRECTED 10 Aug 2026 — two separate errors in that bullet.**
  > **(a) The counts are a 6 Aug snapshot and were already stale by 10 Aug** (measured that day:
  > 5,147 rows · 774 `claude-code` · 613 `claude-code-teaching` · 373 that day). **A count in
  > prose rots on the next hook firing — never quote this line, run it:**
  > ```bash
  > node -e "const L=require('fs').readFileSync('dressing-room/state/afferent.jsonl','utf8').trim().split('\n');let cc=0,ct=0;for(const l of L){try{const s=JSON.parse(l).source;if(s==='claude-code')cc++;if(s==='claude-code-teaching')ct++;}catch{}}console.log(L.length,cc,ct)"
  > ```
  > The bus rolls monthly into `afferent.YYYY-MM.jsonl` (`scripts/thalamus.mjs`, grep
  > `rolled afferent.jsonl`), so an all-time count must read the archives too — no archive file
  > existed yet on 10 Aug (`ls dressing-room/state/ | grep afferent`), but a reader that forgets
  > them will silently under-count the moment one does.
  > **(b) "Nobody reads it" is FALSE and was the more dangerous half.** Twelve scripts read the
  > bus today — count them live rather than trusting this number:
  > `grep -rl "afferent" --include=*.mjs scripts hooks` (10 Aug: brain · context · distiller ·
  > dugout · harvest · hippocampus · limits · nightshift · outwork_audit · teaching_audit ·
  > thalamus · watchman).
- **Rule injection into the live session is real.** `teaching_contract.mjs print` and
  `forge_session.mjs contract` both fire on `UserPromptSubmit`, and their output visibly reaches
  the session every single turn.
- **The thalamus is accepting writes.** `GET /health` on `127.0.0.1:4113` returns
  `{"error":"not found"}` — that is a **missing route, not a dead process**; afferent rows are
  landing with current timestamps. **Do not conclude from that health check that it is down.**
  *(Note this as its own small instance of the general disease: a health endpoint that reports
  failure while the organ is fine.)*
  > **STILL TRUE 10 Aug 2026, and now with the route that DOES exist named.** There is no
  > `/health` handler in `scripts/thalamus.mjs` — every unmatched request falls to the one
  > `send(404, { error: "not found" })`. The real read-only route is **`GET /status`**; the other
  > live routes are `GET /workspace` and `POST /afferent` · `/deep-answer` · `/bg-drained`.
  > Verify with `grep -n 'req.url === ' scripts/thalamus.mjs`. The port is pinned in code
  > (`grep -n "const PORT" scripts/thalamus.mjs` → `4113`, "one below the Dugout's 4114") and the
  > hook targets it via `ARSENAL_THALAMUS` with the same default
  > (`grep -n "ARSENAL_THALAMUS" hooks/afferent-post.mjs`). Since 9 Aug the daemons also have a
  > watcher — `scripts/daemon_watchdog.mjs`, task `ArsenalFC-Daemon-Watchdog` — so "is :4113 up"
  > is no longer answered only by a human curling a route that never existed.

---

## 5. THE DEFECTS — cluster 1: the teaching-compliance loop

Full evidence for this cluster is in `PROBLEM_STATEMENT__teaching_compliance.md`. Condensed here so
this brief stands alone.

### 5.1 The automatic compliance checker has never checked a single turn

**STATUS 10 Aug 2026: FIXED — the heading above is a 6 Aug fact, not a current one. The organ
audits real turns (`node scripts/teaching_audit.mjs report`). Full scar at the end of this
sub-section; the heading text is left unedited because it is the historical finding.**

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

> **CORRECTED 10 Aug 2026 — the line number is dead, the line itself is not.** `:305` no longer
> points at that read (the file grew from 457 to well over a thousand lines during the repair).
> The defective read was **frozen verbatim, per the never-replace law**, and lives on as an
> exported function — find it by name, never by number:
> `grep -n "readForgeSessionLegacy" scripts/teaching_audit.mjs`. The plan of record beside it is
> `readForgeSession()`, which reads the file **top-level** and returns `{session, why}` so a null
> is never silent about *which* null it is ("no file" / "unreadable or shapeless" / "closed" are
> three different facts, and collapsing them is how the first death went unnoticed) —
> `grep -n "export function readForgeSession" scripts/teaching_audit.mjs`.

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

> **CORRECTED 10 Aug 2026 — §5.1 IS FIXED AND THE ORGAN IS ALIVE. Every present-tense sentence in
> this sub-section is now history.** Do not re-plan this work.
> - `dressing-room/state/teaching_audit.jsonl` — the file this section says "does not exist on
>   disk" — **exists and is being appended to** (`ls -la dressing-room/state/teaching_audit.jsonl`).
> - `teaching_audit_last.json` no longer contains `{"step": null}`. Its live top-level keys are
>   `prompt · stop · terms · terms_by_concept · linkback · checked_rules` — read them, don't trust
>   this line:
>   `node -e "console.log(Object.keys(require('./dressing-room/state/teaching_audit_last.json')).join(', '))"`.
> - `('session' in json)` is **still `false`** and that is now correct by design — the file *is*
>   the session, and `readForgeSession()` was fixed to match the owner, not the other way round.
>   The one thing NOT done was editing `forge_session.mjs` to grow a wrapper, and that was right:
>   the reader was wrong, the writer never was.
> - The organ now fires on **`UserPromptSubmit` as well as `Stop`** (`cat .claude/settings.json`
>   → `node scripts/teaching_audit.mjs hook` appears under both events), because the Stop payload
>   carries no user text at all. See §5.3's scar.
> - Live proof, and the only number worth reading here — **run it, never quote it**:
>   `node scripts/teaching_audit.mjs report` (10 Aug: `202 turn(s) audited · 111 with drift`,
>   `last hook run … audited=true`).
> - The fix landed in commit `59eaf17` "The dead auditor comes back to life, and the night gets a
>   watchman". The whole post-mortem is written into the file's own header —
>   `sed -n '16,45p' scripts/teaching_audit.mjs` names all three deaths (dead reader · blind
>   selftest · doubly-dead check) in the code that fixed them.

### 5.2 Its own selftest passes 25/25 and is structurally incapable of catching 5.1

**STATUS 10 Aug 2026: FIXED — it is no longer 25 assertions and no longer structurally blind. Run
it, never quote it: `node scripts/teaching_audit.mjs selftest` (63 passed on 10 Aug). Full scar at
the end of this sub-section.**

`node scripts/teaching_audit.mjs selftest` → `ALL CHECKS PASSED (25 passed, 0 failed)`.

All 25 assertions call `auditTurn()` with a **hand-constructed** session object
(`{ concept, step, closed_at }`). **No assertion exercises the disk-reading path**, and the defect
lives exclusively in that path.

**This is the more serious finding, because it generalises: a green selftest on this organ
currently carries zero information about whether the organ runs at all.** The repo's own law is
*"unrun system = hypothesis"* — this organ satisfied a selftest, was treated as done, and had never
run end-to-end.

> **CORRECTED 10 Aug 2026 — §5.2 IS FIXED, and "25/25" is the single most rot-prone number in this
> file.** The suite is no longer 25 assertions and will keep growing; **run it, never quote it**:
> `node scripts/teaching_audit.mjs selftest` (10 Aug: `ALL CHECKS PASSED (63 passed, 0 failed)`).
> The structural blindness is what actually got fixed — the suite now exercises the disk path and
> the whole chain, which is the part that matters:
> - **LIVE SHAPE** — asserts `readForgeSession()` against the **real on-disk**
>   `forge_session.json`, and asserts the **frozen** `readForgeSessionLegacy()` returns `null`
>   against that same real file. The organ's own header calls this *"the one assertion 25 green
>   tests never made"*.
> - **END-TO-END** — **spawns this file as a child process** with a piped Stop payload against a
>   temp state dir (seam: `ARSENAL_AUDIT_STATE_DIR`, which exists for the selftest and nothing
>   else) and asserts the row lands **on disk** — stdin → reader → engine → jsonl.
> - **`user_text_source 'fresh'`** — asserts the prompt recorded at `UserPromptSubmit` is consumed
>   by its own session's `Stop`, which is §5.3's wire proven live.
> Find them by name, not by line: `grep -n "END-TO-END\|LIVE SHAPE" scripts/teaching_audit.mjs`.
> **The generalisation in the paragraph above still stands as a law** — it is why the nightly
> watchman runs `organism_test.mjs all` as a sweep instead of trusting any organ's own green.

### 5.3 A second, independent dead check hidden behind the first

**STATUS 10 Aug 2026: FIXED — the check is wired and live, via a second hook on
`UserPromptSubmit`. Note the trap: the field `last_user_text` is still never written (it was
replaced, not resurrected), so grepping for that name proves nothing. Full scar at the end of this
sub-section.**

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

> **CORRECTED 10 Aug 2026 — §5.3 IS FIXED AND THE CHECK IS WIRED LIVE. The line numbers `:309`
> and `:315-316` above are both dead; find the code by name.**
> The root cause turned out to be deeper than this section states, and the repair says so in
> code: **the `Stop` payload carries no user text at all** — `hooks/afferent-post.mjs`'s field map
> is the proof (`grep -n "last_assistant_message" hooks/afferent-post.mjs`). So no amount of
> writing into `teaching_audit_last.json` at Stop-time could have saved it. The fix wired this
> file into **`UserPromptSubmit`** as a second hook: `promptHook()` records his prompt the moment
> it exists, `stopHook()` consumes it one turn later.
> **One precise correction to the sentence "`last_user_text` is never written by anything": the
> field `last_user_text` is still never written — it was not resurrected, it was replaced.** What
> is written now is a `prompt` object (`text · step · session_id · at`) — confirm with
> `grep -n "function promptHook" scripts/teaching_audit.mjs` and
> `node -e "console.log(Object.keys(require('./dressing-room/state/teaching_audit_last.json')))"`.
> Anyone grepping for the old field name will find nothing and wrongly conclude the check is still
> dead.
> The pairing is **session-scoped and never silently reused**: a prompt from a parallel Claude
> Code session is discarded and the audit row records which happened —
> `user_text_source` is one of `fresh` / `session-mismatch (parallel session's prompt discarded)` /
> `missing (no prompt recorded)`. **Degraded is visible, never silent** — which is the whole
> lesson of §5.1 applied to its own fix. Grep: `grep -n "userTextSource" scripts/teaching_audit.mjs`.
> The check itself lives in both engines (`auditTurnLegacy` frozen, `auditTurn` current) —
> `grep -n "confusion-is-literal" scripts/teaching_audit.mjs`.
> **Read the live firing count, never a number written here:**
> `node -e "const j=require('./dressing-room/state/teaching_contract.json');const r=(j.rules||[]).find(x=>x.id==='confusion-is-literal');console.log(r.id,'hits',r.hits||0,'auto',r.auto_hits||0)"`
> (10 Aug: `hits 0 auto 0` — **a wired check that has not yet fired, which is now a readable state
> and no longer the same thing as a dead one**; that distinction is the entire point of §5.1).

### 5.4 The drift ranking has never moved

**STATUS 10 Aug 2026: FIXED — the ranking moves on the `auto_hits` lane, which did not exist when
this was written. Reading only `hits` still shows all zeros and will fool you. Full scar at the
end of this sub-section.**

`dressing-room/state/teaching_contract.json` holds ten rules — `his-word · hinglish · terminology ·
link-back · decided · one-idea · his-level · no-system-mid-concept · confusion-is-literal ·
dheema-not-lamba`. **Every one has `hits: 0`.**

The design intent is *drift-ranked* injection: the rule he has been failed on most goes first,
every turn. With all counters at zero that ranking runs on nothing, and the order he sees at the
top of every turn does not reflect what has actually been going wrong.

> **CORRECTED 10 Aug 2026 — the rule list is no longer ten, and the ranking has moved.**
> **(a) Twelve rules, not ten** — `coverage` and `neev-pehle` joined. Do not copy the list out of
> this paragraph; read it live:
> `node -e "console.log(require('./dressing-room/state/teaching_contract.json').rules.map(r=>r.id).join(' · '))"`.
> The seed inside the owner also grew to carry all twelve, and the reason is recorded there: the
> audit organ stages against rule ids that lived **only** in the state file, so one re-seed event
> would have silently killed those checks forever (`grep -n "GROWN TO TEN" scripts/teaching_contract.mjs`).
> **(b) `hits: 0` on every rule is STILL TRUE and is no longer the finding it was.** `hits` is now
> deliberately **his lane alone** (`hit` / `confirm`). Machine-measured drifts land in a separate
> **`auto_hits`** lane so the ranking moves without ever asking him — his 6 Aug ruling, implemented
> as two lanes rather than one gate. **Read both, never one:**
> `node -e "console.log(require('./dressing-room/state/teaching_contract.json').rules.map(r=>r.id+' hits='+(r.hits||0)+' auto='+(r.auto_hits||0)).join('\n'))"`
> (10 Aug: `dheema-not-lamba auto=78 · one-idea auto=37 · hinglish auto=11 · his-word auto=7 ·
> no-system-mid-concept auto=7 · his-level auto=5 · neev-pehle auto=3 · decided auto=2` — the
> ranking is running on real measured data, which is exactly what this section asked for).
> **A session reading only `hits` will still see all zeros and wrongly re-diagnose §5.4 as open.**

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

> **CORRECTED 10 Aug 2026 — the queue those five sat in is EMPTY; they were promoted on 7 Aug and
> the file now holds more than five.** Live read:
> `node -e "const j=require('./dressing-room/state/teaching_contract.json');console.log('staged:',(j.staged||[]).length,'| self_reports:',(j.self_reports||[]).length);(j.self_reports||[]).forEach((r,i)=>console.log(i+1,r.id,(r.at||'').slice(0,10),'promoted:',(r.promoted_at||'no').slice(0,10)))"`
> On 10 Aug: **`staged: 0` · `self_reports: 7`** — six dated 6 Aug (this section counted five;
> a sixth was filed later the same day, after this brief was written) plus one dated 7 Aug, and
> **all seven carry `promoted_at: 2026-08-07`**. So §10's standing order *"do not confirm or
> dismiss the five staged drifts"* has already been discharged by him and is moot — see §10's own
> scar.
> **The finding about coarse classification held up — and he then knowingly overrode it, so state
> this carefully.** All seven really do carry the id `his-word`. On 7 Aug, asked *"if i say
> automate it and do not bring it to me will it be ok"*, he answered **"ok do it.."**, and since
> that ruling **`flag` no longer only stages — it COUNTS into `auto_hits` the moment it is filed**,
> preserving the `why` in `self_reports`. The old staging path (`flagRule`/`confirmFlag`/
> `dismissFlag`) is **frozen, not deleted**, per the layering law. What that trade gives away is
> written down in the code rather than hidden: *"the model now classifies its own violations
> unreviewed (the 6 Aug evidence says it classifies coarsely). The guard is VISIBILITY +
> REVERSIBILITY, not a gate"* — read it at
> `grep -n "THE SELF-REPORT LANE, AUTOMATED" scripts/teaching_contract.mjs`. The reversal verb is
> `unhit-auto`, and the nightly watchman reviews the day's auto-hits.
> **The lane split that DID survive is between the model and the regex, not between staged and
> counted**: `autohit` is called only by `teaching_audit.mjs`'s hook path, and neither lane may
> touch `hits` — his lane stays his. The reasoning is stated in the organ that enforces it:
> *"a regex has no reputation to protect, a model does"*
> (`grep -n "no reputation to protect" scripts/teaching_audit.mjs`).

### 5.6 Approving drift reports is currently his job, and he has named this as wrong design

**STATUS 10 Aug 2026: CLOSED — approving a COUNT is no longer his job. `hits` (his lane) and
`auto_hits` (the machine lane) are separate in code and the ranking weight is their sum. Full scar
at the end of this sub-section.**

A staged drift becomes a counted hit only after his explicit `confirm <id>`. The stated reason is
sound in general — the model must not author and approve its own rules
(*AI proposes · code validates · human approves*).

His objection, unresolved in code:

> *"brain ka kya kaam hain vrna?"* — if the machine already knows it broke a rule **he approved
> long ago**, why is he signing off on the *count*?

The distinction he is pointing at — **authoring a new rule** (a judgement) versus **counting
violations of an already-approved rule** (a measurement) — is not represented anywhere in the code.
Both pass through the same gate. **This is an open decision, and it is his. See §7.1.**

> **CORRECTED 10 Aug 2026 — the distinction IS represented in the code now, and the decision is
> closed. Every sentence above is 6 Aug history.**
> The two lanes he was pointing at exist by name in `teaching_contract.json`:
> **`hits`** = HIS lane, moved only by `hit` / `confirm`, never written by any automatic path; and
> **`auto_hits`** = the machine lane, moved by `autohit` (code-measured) and by `flag`
> (model self-report, since his 7 Aug *"ok do it.."*). Ranking weight is their **sum** —
> `grep -n "const ruleWeight" scripts/teaching_contract.mjs`. The lane comments state the split in
> his terms: `grep -n "the CODE lane" scripts/teaching_contract.mjs`.
> **He is no longer signing off on the count.** The reversibility that replaced the gate is
> `unhit-auto <id>`, and the full verb list is asserted by the organ's own selftest — read it live
> rather than from prose: `node scripts/teaching_contract.mjs selftest` and
> `grep -n '"autohit", "unhit-auto"' scripts/teaching_contract.mjs`.

### 5.7 The checked rule set does not cover the failures that actually occurred

**STATUS 10 Aug 2026: NARROWED, NOT CLOSED — the checked set doubled to twelve rule ids and both
named gaps got a check, but the gap is now STATED per-rule rather than eliminated. Full scar at
the end of this sub-section.**

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

> **CORRECTED 10 Aug 2026 — the checked set doubled, the two named gaps got checks, and the caveat
> is now acted on by two surfaces.** The six checks listed above are the 6 Aug set; the current
> set is **twelve rule ids**, and it is exported from code so no surface has to hardcode (and rot)
> it — `grep -n "export const CHECKED_RULES" scripts/teaching_audit.mjs`, and it is stamped into
> every `teaching_audit_last.json`.
> - *"the unilateral scope cut"* → a **`coverage`** check exists.
> - *"formula-before-definitions"* → a **`neev-pehle`** check exists (and had already fired 3 times
>   by 10 Aug).
> **Do not read that as the gaps being closed.** The repair added a per-rule honesty map naming
> exactly which SLICE the machine sees and which slice stays his — e.g. `coverage`: *"machine sees
> ONE fingerprint: a CORE axis landing in `axes_deferred`. The half-answer/scope-cut class is
> semantic and stays his."* Read the whole map with
> `grep -n "export const RULE_NOTES" scripts/teaching_audit.mjs`, or see it printed in
> `node scripts/teaching_audit.mjs report`.
> **Two surfaces now act on the caveat instead of only stating it**: the audit's own `report`
> prints `coverage: checks exist for N of M contract rules` followed by the per-slice notes, and
> the **nightly watchman** derives the uncovered list live and prints
> `NOT COVERED — teaching audit has no check for: …` (`grep -n "NOT COVERED —" scripts/watchman.mjs`).
> Neither hardcodes the list — both diff `teaching_contract.json`'s rules against
> `teaching_audit_last.json`'s `checked_rules`, which is why this paragraph's own numbers are the
> untrustworthy ones.

### 5.8 The context-fill gauge reports confidently and measures the wrong thing

**STATUS 10 Aug 2026: FIXED — the budget is now derived from the measured window (4,100,000 bytes)
and the old 1,500,000 is frozen beside it as `DEFAULT_TRANSCRIPT_WARN_BYTES_LEGACY`. Full scar at
the end of this sub-section.**

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

> **CORRECTED 10 Aug 2026 — §5.8 IS FIXED, and it was fixed the way §9.6 demanded (reasoning
> shown, not a swapped constant). Every line number in this sub-section is dead — grep, don't
> count.**
> `1_500_000` is **frozen verbatim** as `DEFAULT_TRANSCRIPT_WARN_BYTES_LEGACY` (never-replace law)
> with the failure written above it in the file. The plan of record is **derived from the arithmetic
> this very section computed**, and it is a formula rather than a magic number:
> ```js
> const MEASURED_BYTES_PER_TOKEN = 4.1;          // 964,000 / 234,700 — measured, 6 Aug 2026
> const CONTEXT_WINDOW_TOKENS = 1_000_000;       // the live session's own readout, same day
> const DEFAULT_TRANSCRIPT_WARN_BYTES = Math.round(MEASURED_BYTES_PER_TOKEN * CONTEXT_WINDOW_TOKENS);
> ```
> = **4,100,000 bytes**, i.e. the warn budget IS the measured window, so `SOFT_FRACTION` (still
> `0.6`, unchanged) fires at ~60% of REAL fill — the "beforehand" he asked for. Find all of it by
> name: `grep -n "DEFAULT_TRANSCRIPT_WARN_BYTES\|SOFT_FRACTION" scripts/teaching_contract.mjs`.
> The live state agrees — read it, don't trust this:
> `node -e "console.log(require('./dressing-room/state/teaching_contract.json').transcript_warn_bytes)"`
> (10 Aug: `4100000`). A pre-fix state file still holding the legacy `1500000` is **migrated
> forward automatically**, and only that exact value — a value he tuned himself is left alone
> (`grep -n "DEFAULT_TRANSCRIPT_WARN_BYTES_LEGACY" scripts/teaching_contract.mjs`).
> It is still labelled a **hypothesis (v1, one measurement)** and still retunable from state
> without editing the file; the note in code says the watchman's nightly data is what will retune
> it, not a guess. **§10's standing order "do not change `DEFAULT_TRANSCRIPT_WARN_BYTES` before
> bringing him the reasoning" was satisfied by showing the arithmetic in the file, not bypassed.**
> Commit: `f2acdcc` "…and the authority stops crying wolf".

---

## 6. THE DEFECTS — cluster 2: nothing watches the watchers

### 6.1 No organ-liveness layer exists

**STATUS 10 Aug 2026: BUILT — this heading is the single most dangerous stale line in the file,
because acting on it means rebuilding the night watchman from scratch. The layer is
`scripts/watchman.mjs`, running nightly on the `ArsenalFC-Watchman` task. Full scar at the end of
this sub-section; the heading text is left unedited because it is the historical finding.**

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

> **CORRECTED 10 Aug 2026 — THE ORGAN-LIVENESS LAYER WAS BUILT. "No organ-liveness layer exists"
> is the single most dangerous stale line in this file, because acting on it means rebuilding the
> night watchman from scratch.**
> It is **`scripts/watchman.mjs`** (born commit `59eaf17`, 7 Aug 2026). Confirm before planning
> anything: `Get-ChildItem scripts/watchman.mjs` · `node scripts/watchman.mjs selftest`.
> What it does, and each maps onto a paragraph above:
> - **CONDITIONAL LIVENESS** — the *"did the organ that was supposed to produce output today
>   produce any?"* question this section says nobody asked. It pairs evidence-of-input with
>   expected output (teaching afferents landed today **and** a forge session is open ⇒ audit rows
>   MUST exist), which is what sees through the physio's NEVER-BORN law — the reason a log that had
>   never been born was invisible. That is §7.3, answered in code.
> - **LIAR DETECTION** — cross-checks an organ's self-report against the state it reports on.
>   *"`teaching_audit_last.json` saying 'no open forge session' while `forge_session.json` sits
>   open IS §5.1's exact signature, on disk, every single day it was dead."*
> - **IT RUNS ITSELF** — nightly on its own scheduled task, not on his hands. Live:
>   `schtasks /query /fo csv | Select-String "Watchman"` (10 Aug:
>   `"\ArsenalFC-Watchman","10-08-2026 23:55:00","Ready"`).
> Its own files (single writer, it declares them at the top of the file — `grep -n
> "const LOGJ\|const LAST\|const REPAIR_JOURNAL" scripts/watchman.mjs`): `watchman.jsonl` ·
> `watchman_last.json` · `watchman_repair.log` · `watchman_repairs.jsonl` ·
> `watchman_tier2_prompt.txt`, all under `dressing-room/state/`.
> **On `organism_test.mjs` and `/organism-doctor` — "both require him to run them" is now HALF
> wrong.** The `/organism-doctor` skill is still his to invoke (`ls .claude/skills/` lists it),
> but `organism_test.mjs all` is now spawned **by the watchman as a nightly sweep**, and a RED
> suite becomes a finding — `grep -n "organism_test.mjs" scripts/watchman.mjs`. Read the suite's
> live state rather than any number in prose: `node scripts/organism_test.mjs` (10 Aug: **31
> passed, 1 failed** across 73 registered suite members — i.e. the sweep is doing its job and
> currently reporting a real RED, not a clean bill).

### 6.2 The Gemini surface has no compliance check whatsoever

**STATUS 10 Aug 2026: PARTLY CLOSED — a lane exists (`scripts/harvest.mjs`, 9 Aug) and outcomes
are measured (`gemini_quality.jsonl`), but no compliance CHECKER runs on the harvested Gem text.
Full scar at the end of this sub-section.**

`teaching_audit.mjs` only ever sees Claude Code turns, via the `Stop` hook payload. Reps and
sessions arriving from the Gemini/Colab handoff (`/paste-session`, `capture.mjs paste|pull`) pass
through **no teaching-compliance check of any kind.**

He named this explicitly as one of the three things he refuses to keep watching himself. Its current
state is: **not covered, not measured, not planned.**

> **CORRECTED 10 Aug 2026 — "not planned" is dead, "not measured" is half dead, and there is now a
> live lane. Do not read "not covered, not measured, not planned" as today's state.**
> - **`scripts/harvest.mjs`** (shipped 9 Aug, commit `7522fb5` "P7 unleash: the blind eye opens")
>   brings a whole Gem sitting onto the bus through the thalamus door — his turns as
>   `gemini-study`, the Gem's turns as `gemini-study-teaching`. So the *teaching text itself* now
>   reaches the same store `teaching_audit.mjs` reads from, which the sentence above says is
>   impossible.
> - **`gemini_quality.jsonl`** records per-batch measured stats (n · gut-word mix · correct rate)
>   at the `capture.mjs paste` door — `grep -n "gemini-quality row recorded" scripts/capture.mjs`.
>   Owner: `capture.mjs`. Its first reader is `scout.mjs`, COUNT-only.
> - **The watchman remeasures §6.2's coverage on every print rather than asserting it**, and its
>   comment says why in exactly this file's own terms: *"'permanently impossible' fell the day
>   `scripts/harvest.mjs` shipped … a hardcoded prose line here is exactly what rotted for a month
>   before this."* Read the live verdict — `node scripts/watchman.mjs report` prints either
>   `COVERED AS HARVESTED — the GEMINI surface: …` with the on-bus turn counts, or
>   `NOT COVERED YET — … until he says "harvest" after a Gem sitting, teaching there stays
>   UNMEASURED`. `grep -n "the GEMINI surface" scripts/watchman.mjs`.
> **What is still honestly true:** coverage equals the sittings he actually harvests — an
> un-harvested Gem sitting stays invisible — and no compliance *checker* runs on the harvested
> Gem text the way `teaching_audit.mjs` runs on Claude turns. The gap narrowed; it did not close.

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

> **CORRECTED 10 Aug 2026 — the boundary WAS drawn, and it is stated in code, so read it there
> before drawing it again.** `scripts/watchman.mjs` implements all three engineering requirements
> and states them in the orders it hands its own Tier-2 child:
> - **Reversible** — *"one git commit per logical change, message prefixed `watchman-repair:`, and
>   the revert path stated in the commit body."*
> - **Logged with its trigger** — `dressing-room/state/watchman_repairs.jsonl`, one row per change:
>   `{ts, finding_id, change, files, evidence, revert}`.
> - **Lane limits** — never the learning content, never `capsules/`, never canonical `.md` files,
>   never his staged drift queue.
> All three are asserted by the organ's own selftest rather than left as prose intent —
> `grep -n "watchman-repair:" scripts/watchman.mjs` shows both the orders and the assertion that
> they are present in the child's prompt. The journal is real on disk
> (`ls -la dressing-room/state/watchman_repairs.jsonl`).
> **One honest caveat, from the live sweep on 10 Aug:** the watchman's top finding that day was
> `[RED] tier2-vanished — a Tier-2 repair child started on a previous day and left NO exit stamp
> and NO journal row`. So the repair ARM has itself failed silently at least once, and the layer
> that catches that is the watchman watching its own arm. **Read the current state before assuming
> the lane is healthy: `node scripts/watchman.mjs report`.**

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

> **RE-VERIFIED 10 Aug 2026 — the three flags are still real** (`claude --help` lists `--model`,
> `--effort <level>` and `--agents <json>`), and the Tier-2 command line built from them lives in
> `scripts/watchman.mjs`: `grep -n "claude -p --model claude-opus-5 --effort max" scripts/watchman.mjs`.
> The "Ultracode" caveat is **unchanged and still unverified** — nothing in the repo depends on it.

**Billing reality, and this is load-bearing:** `CLAUDE.md`'s build order lists M-3 *"`claude -p` +
billing guards"* as **NOT BUILT**. There is no billing guard in this repo today. His plan usage on
6 Aug read *Weekly · all models 38%*. A nightly max-effort multi-agent run against a healthy system
would burn his quota on nothing and leave nothing for the night something actually breaks. **The
Tier-1/Tier-2 split is what makes his ruling affordable — treat it as a requirement, not a
suggestion.**

> **CORRECTED 10 Aug 2026 — BOTH halves of that first sentence are now false, and the correction
> matters because the paragraph is used to justify treating the split as the only guard.**
> **(a) M-3 is built and running.** `CLAUDE.md` no longer calls it NOT BUILT; the `claude -p` call
> is live in `scripts/brain.mjs` (`grep -n "manager_m3" scripts/brain.mjs
> dressing-room/state/brain_config.json`).
> **(b) A billing guard exists.** `brain.mjs` **REFUSES to run any LLM call when
> `ANTHROPIC_API_KEY` is set in the shell** — the Max subscription is the only billing path, ever.
> `grep -n "refuse_if_api_key_env" scripts/brain.mjs`, and the header states the rule at
> `grep -n "hard \$100 ceiling" scripts/brain.mjs`. The refusal is selftested and it also halts
> `--daemon`. Alongside it the brain declares spend shape per job (study-hours cap, overnight
> drain target, required-input audit that skips a job **before** the spend).
> **Note the doc-to-doc rot this created and do not propagate it:** `watchman.mjs`'s own header
> still reads *"M-3's billing guards do not exist yet, so the split IS the guard"*. That comment
> is a 7 Aug statement that has since gone stale in the same way this paragraph did. **The code is
> the truth; both prose lines are behind it.** Flagged, not edited — `watchman.mjs` is not this
> pass's file.
> **What is unchanged and still a requirement:** the Tier-1/Tier-2 split. A clean night must still
> cost nothing. A guard against per-token billing is not a guard against burning subscription
> quota on a healthy system.

**One number is deliberately left un-fixed**, per his standing *"no guessed numbers"* rule: start at
Opus 5 / max effort because a wrong diagnosis is expensive, then after 30-45 days of real data look
at how often Tier 2 actually fired and revisit. **Record the data so that decision is possible
later; do not pre-decide it now.**

### 7.3 What counts as "an organ that should have produced output"?

Some organs are legitimately quiet for days. Distinguishing *correctly quiet* from *dead* is the
core of §6.1 and it is not obvious. **This is a design problem, not a lookup.**

> **CORRECTED 10 Aug 2026 — ANSWERED IN CODE, and the answer is written into `watchman.mjs`'s
> header under the heading "QUIET vs DEAD".** An organ is expected to have produced output **only
> when its preconditions are on disk** — afferents captured, a session open, rows appended. *"No
> afferents today = a day off, not a death"*. That conditional is in every check, which is what
> lets the organ be silent-when-clean without silence ever meaning dead. Read it:
> `grep -n "QUIET vs DEAD" scripts/watchman.mjs`. **Still a design problem per organ — the
> conditional has to be authored for each new one — but it is no longer an unanswered question.**

### 7.4 How does a finding reach him?

He does not open files he is not already reading. A report nobody reads is the same as no report.
Which existing surface carries this, and what happens when there is nothing to say, are open.

> **CORRECTED 10 Aug 2026 — ANSWERED, twice over, and both answers are wired.**
> **(a) The SessionStart brief.** `node scripts/watchman.mjs brief` runs on the `SessionStart`
> hook (`cat .claude/settings.json`) and prints **ONE line, only when last night's sweep found
> something or the watchman itself has not run** — silent on a clean, fresh night. Live example,
> 10 Aug: `🌙 WATCHMAN (2026-08-09): 2 finding(s) — RED:tier2-vanished · WARN:night-coach-absent
> · Tier-2 repair ran, journal: watchman_repairs.jsonl`.
> **(b) THE CAPTAIN'S CALL** (his 7 Aug ADHD-PI ruling, after this brief was written): anything
> needing HIS word becomes ONE one-line card dealt at an anchor he already hits — `node
> scripts/captains_call.mjs deal` is on `SessionStart`. THE ANCHOR LAW: *if a thing needs the
> captain, it rides an anchor; if it cannot ride an anchor, it does not need the captain.*
> **That is the direct answer to "what happens when there is nothing to say": nothing is printed.**

### 7.5 What is the coverage of the existing self-checks?

`organism_test.mjs`, `/organism-doctor`, and each organ's `selftest` — **measure what they actually
cover before building anything new.** §5.2 shows a selftest can be green and meaningless; assume
nothing about the others without checking.

> **CORRECTED 10 Aug 2026 — this is now measured continuously rather than as a one-off, but the
> warning above stands and should not be softened.** `organism_test.mjs` maintains a **registered
> suite** and asserts that **every member is RUN, not chained** — read its live membership and
> result rather than any number: `node scripts/organism_test.mjs` (10 Aug: 31 passed / 1 failed,
> *"all 73 suite members pass (every one RUN, not chained)"* named as the assertion that went RED).
> The watchman spawns that same sweep nightly (§6.1's scar). Teaching-rule coverage specifically is
> derived live, never hardcoded, on two surfaces (§5.7's scar).
> **§5.2's lesson has NOT been retired**: a green selftest is still only evidence about the paths
> it exercises. The countermeasure that was actually adopted is spawning the real binary against a
> temp state dir, not trusting the pure core.

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
  > **VERIFIED + AMENDED 10 Aug 2026.** All four pairings above re-checked against the code and
  > **all four hold**: `grep -n "sole writer of state/teaching_contract.json" scripts/teaching_contract.mjs`
  > · `grep -n "const SESSION" scripts/forge_session.mjs` · `grep -n "this organ is their" scripts/teaching_audit.mjs`
  > (its header names `teaching_audit.jsonl` + `teaching_audit_last.json` as its own, and states it
  > never touches `teaching_contract.json` — auto-counting goes through the owner's CLI, exactly as
  > the law requires). Two amendments:
  > **(a) "Every state file has exactly one owning script" over-claims.** There is one deliberate,
  > documented exception: **`brain_ledger.jsonl` is a SHARED APPEND LANE by design**, with several
  > live appenders; `brain.mjs` owns its **schema**, not exclusive write access. `brain_out/` is
  > likewise a **lanes namespace** with per-subdirectory owners, not one owner. The law is the
  > default, not an absolute.
  > **(b) `capsules/` → `mirror.mjs` is right, but the phrasing used elsewhere in this repo is
  > self-negating.** `mirror.mjs` **is** a script and it **does** write there (plus a daily
  > snapshot into `capsule_backups/<date>/`). The correct sentence is *"no OTHER organ writes
  > `capsules/`"* — never "no script writes it".
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

> **CORRECTED 10 Aug 2026 — this is an ACCEPTANCE CHECKLIST that has since been worked through.
> A session reading it as an open list will re-do finished work.** Against the live code, points
> 1-7 all have an implementation to point at, and each one's evidence is in the scar on the
> section it names: 1+2+4 → §6.1 (`watchman.mjs`, nightly, spawned suite sweep, and its own
> selftest asserts a seeded broken organ is caught); 3 → §7.3's QUIET-vs-DEAD conditional, which
> is exactly "a healthy organ is demonstrably not flagged"; 5 → §5.3 (the check is alive and its
> `user_text_source` states when it is degraded, so the third silent state is gone); 6 → §5.8
> (reasoning shown, constant derived, old one frozen); 7 → §5.7 (coverage printed by two surfaces,
> derived live).
> **Point 8 was overtaken by events, in the one direction the rest of this document did not
> anticipate: §7.1 and §7.2 were NOT brought back to him as decisions, because he closed them
> himself before the build started** — read those two sections, they carry his verbatim words and
> both are marked NOT OPEN. §12 says the same thing.
> **The paragraph above this scar is NOT a checklist item and does not expire.** It is the standing
> test for anything built next.

---

## 10. OUT OF SCOPE

- The FORGE session on `hallucinations` is **open and mid-concept** (step 3; axes `a` and `b` marked
  done-but-**ungraded**; core axis `d` partially taught). **Do not close it, do not advance it, do
  not mark any axis.** It is his to resume.
- **Do not confirm or dismiss the five staged drifts.** That is his word alone.
- Do not touch the learning content or `dressing-room/state/capsules/` (read-only mirror owned by
  `mirror.mjs`).
- Do not change `DEFAULT_TRANSCRIPT_WARN_BYTES` before bringing him the reasoning.

> **CORRECTED 10 Aug 2026 — three of these four have moved. The PROHIBITIONS all still stand; the
> FACTS behind two of them do not.**
> - **The forge session is still open on `hallucinations` and still at step 3 — but it is NOT the
>   same session, and the axis detail above is now wrong.** The live file was `started_at
>   2026-08-10T10:27`, `axes_done: []`, `axes_deferred: []`, `current_axis: "a"`. So the "axes `a`
>   and `b` marked done-but-ungraded" state that this brief warns about **no longer exists on
>   disk** — do not go looking for it, and do not "fix" it. **Never read the session's state from
>   this paragraph; read the file:**
>   `node -e "const j=require('./dressing-room/state/forge_session.json');console.log(j.concept,'step',j.step,'axis',j.current_axis,'done',JSON.stringify(j.axes_done),'started',j.started_at)"`.
>   **The order itself is unchanged: do not close it, do not advance it, do not mark any axis. It
>   is his.**
> - **The five staged drifts no longer exist as a staged queue.** He ruled on 7 Aug ("ok do it..")
>   and they were migrated: `staged: 0`, seven entries in `self_reports`, every one stamped
>   `promoted_at: 2026-08-07`. See §5.5's scar. **The underlying law is unchanged — his `hits`
>   lane is still his word alone — so nothing here licenses writing it.** Check live:
>   `node -e "const j=require('./dressing-room/state/teaching_contract.json');console.log('staged',(j.staged||[]).length,'self_reports',(j.self_reports||[]).length)"`.
> - **`DEFAULT_TRANSCRIPT_WARN_BYTES` HAS been changed** — 1,500,000 → a derived 4,100,000 — and
>   the order was honoured rather than bypassed: the reasoning is shown in the file itself and the
>   old constant is frozen beside it. See §5.8's scar. **The order still binds any FURTHER retune.**
> - **`capsules/` is unchanged and absolute.** One clarification of wording only: `mirror.mjs` is a
>   script and it does write there — the rule is that **no other organ does**. See §8's scar.

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

> **CORRECTED 10 Aug 2026 — the commands still RUN, but four of the inline expectations above are
> now wrong, and one command points at moved code. Re-ran every line; here is what they actually
> print today.**
>
> ```bash
> ls -la dressing-room/state/teaching_audit.jsonl   # EXISTS now (was: "does not exist") — §5.1 fixed
> cat dressing-room/state/teaching_audit_last.json  # keys: prompt · stop · terms · terms_by_concept
>                                                   #       · linkback · checked_rules  (NOT {"step":null})
> node scripts/teaching_audit.mjs selftest          # 63 passed, 0 failed on 10 Aug (was: 25) —
>                                                   # NEVER quote this number, the suite keeps growing
> node scripts/teaching_audit.mjs report            # 202 turn(s) audited · 111 with drift (10 Aug)
> # the rules line: read auto_hits TOO, or every rule still looks like hits:0 — see §5.4's scar
> node -e "const j=require('./dressing-room/state/teaching_contract.json'); console.log((j.rules||[]).map(r=>r.id+' hits='+(r.hits||0)+' auto='+(r.auto_hits||0)).join(' | ')); console.log('staged:',(j.staged||[]).length)"
> # the context budget moved down-file; grep it by name instead of by line range:
> grep -n "DEFAULT_TRANSCRIPT_WARN_BYTES\|SOFT_FRACTION\|MEASURED_BYTES_PER_TOKEN" scripts/teaching_contract.mjs
> ```
>
> **Two commands worth adding, for the organs that did not exist when this list was written:**
> ```bash
> node scripts/watchman.mjs report          # the nightly liveness sweep's findings (§6.1)
> node scripts/watchman.mjs brief           # the ONE line that rides SessionStart (§7.4)
> schtasks /query /fo csv | Select-String "Watchman"   # proof it runs without him
> ```
>
> `node -e "… 'session' in j"` still prints **`false`**, and that is now the CORRECT shape — the
> reader was fixed to match the writer. See §5.1's scar before treating it as a defect.

Relevant source: `scripts/teaching_audit.mjs` (457 lines) · `scripts/teaching_contract.mjs`
(1,094 lines) · `hooks/afferent-post.mjs` (88 lines) · `scripts/organism_test.mjs` ·
`.claude/settings.json` · companion evidence file `PROBLEM_STATEMENT__teaching_compliance.md`.

> **CORRECTED 10 Aug 2026 — two of those three line counts are badly stale, which matters because
> every `file:NNN` citation in this brief was computed against them.** Measured 10 Aug:
> `teaching_audit.mjs` **1,440** lines (was 457 — it roughly tripled during the repair) ·
> `teaching_contract.mjs` **1,403** (was 1,094) · `hooks/afferent-post.mjs` **88** (unchanged, the
> only one that held). **Do not write a new count in here — count them:**
> `wc -l scripts/teaching_audit.mjs scripts/teaching_contract.mjs hooks/afferent-post.mjs`.
> **Consequence: treat EVERY line number in this document as dead and grep for the named thing
> instead** — that is why each scar above gives a `grep -n "<distinctive string>"` rather than a
> number. `PROBLEM_STATEMENT__teaching_compliance.md` is still on disk and is still the evidence
> appendix. Add to the list: **`scripts/watchman.mjs`** (the §6.1 organ, born after this brief was
> written) and **`scripts/harvest.mjs`** (the §6.2 lane).

---

## 12. START HERE — AND ACTUALLY FIX IT

**STATUS 10 Aug 2026: DO NOT START HERE. This work order was executed between 6 and 10 Aug —
commits `0a0711c` · `f2acdcc` · `59eaf17`. Everything §12 names as "fix these directly" is fixed
and running. Read §12 as history; the scar under "Fix these directly" lists each fix with the live
command that proves it.**

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

> **CORRECTED 10 Aug 2026 — THIS WORK ORDER WAS EXECUTED. DO NOT START HERE.** Read this whole
> §12 as the historical instruction that produced commits `0a0711c` · `f2acdcc` · `59eaf17`, not
> as today's task. Every named section was fixed and each carries its own scar with the live
> command that proves it: §5.1 (organ audits real turns) · §5.2 (suite spawns the real binary,
> 63 checks on 10 Aug) · §5.3 (prompt hook wired, `user_text_source` recorded) · §5.4 (12 rules,
> `auto_hits` moving) · §5.8 (budget derived, legacy frozen) · §7.5 (registered suite, swept
> nightly). **The §6.1 organ-liveness layer was built: it is `scripts/watchman.mjs`, and it runs
> on `ArsenalFC-Watchman` at 23:55 without his hands.**
> **The one instruction here that does NOT expire** is the sentence *"do not take this document's
> word for anything"* — it is now doubly true, since this document itself is the stale artefact.
> Verify against the code every time.

### Nothing comes back to him. He has ruled on everything.

**§7.1 and §7.2 were the two open decisions. He closed both on 6 Aug 2026** — read them, they now
carry his verbatim words. Self-repair is authorised; cadence is nightly; the repair tier runs at
max effort; detection is deterministic and LLM-free.

**§5.7 and §6.2 need scoping calls. Make them yourself and state what you chose and why.**

> **CORRECTED 10 Aug 2026 — both scoping calls were made and both are recorded in the code, not
> here.** **§5.7** was scoped as *"add checks, then state the SLICE each one sees"* — the checked
> set grew to twelve rule ids and a per-rule `RULE_NOTES` map names what stays HIS to catch, so
> "no drift caught" can never quietly widen into "taught correctly"
> (`grep -n "export const RULE_NOTES" scripts/teaching_audit.mjs`). **§6.2** was scoped as
> *"measure the coverage live on every print instead of declaring it"* — the harvest lane carries
> Gem sittings onto the bus, and the watchman prints either COVERED-AS-HARVESTED with real counts
> or NOT-COVERED-YET with the reason (`grep -n "the GEMINI surface" scripts/watchman.mjs`).
> See the scars on §5.7 and §6.2 for the live commands.

His instruction on this is unambiguous and was repeated four times in one session:
*"do not keep me in the loop."* **Do not send him a list of questions. Do not send him options to
pick from. Decide, build, run it, and show him it working.**

The one thing that is **not** a licence: §7.1's reversibility and logging requirements are
engineering constraints on how self-repair works, not decisions you may skip.

### The standard for reporting back

Short. What you fixed, the output proving each fix runs, what you chose and why, and the two
rulings. **He has ADHD-PI — a long report is a failure of this brief, not a fulfilment of it.**
