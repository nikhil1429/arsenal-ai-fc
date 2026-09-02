---
name: executor
description: BOOT AN EXECUTOR SESSION on the open audit order — read the order, read the last landing, take the rung the frontier hands you, execute exactly ONE under §10-D. Use when the captain says "executor", "executor session", "next rung", "agla rung", "continue the audit", or pastes an executor card. The routing is COMMANDS, never memory; forks go to the architect, never decided here.
---

# /executor — attach to the rung, zero recall

**WHY THIS EXISTS.** Executor sessions were routed by a pasted card. The card drifted v3→v7 in one
day and his saved copy went stale three times, so the routing he had to remember kept being wrong —
and *"jo cheez use yaad rakhni pade, woh ek DESIGN FAILURE hai."* Ruled by the architect
(`THE_PLAN__2026-09-01.md:246`, `ECOSYSTEM_MAP__2026-08-26.md` bucket 1): **the card becomes a typed
command, and this file is its one home.** He types `/executor`. Nothing else.

**THE ONE RULE THAT MAKES IT DETERMINISTIC: every step below is a command you RUN.** Nothing here is
a number to recall — the numbers live in the order, the checkpoint and the beads DB, and they move.

---

## BOOT — in this order, no skipping

1. **`CLAUDE.md`** (auto-loaded). Read the ORDER-GATE line; it names the blocking order.
2. **The order**, at its `▶ RESUME HERE` and **§10-C/§10-D**:
   `docs/archive/ORGANISM_AUDIT__2026-08-19.md`
3. **The last landing.** Landings are **APPENDED — the newest is at the END of the file**:
   ```bash
   tail -n 120 "C:/Users/nikhi/arsenal-audit-artifacts/floor-audit-2026-09-01/CHECKPOINT.md"
   ```
4. **The rung.** From `C:\Users\nikhi\arsenal-audit-artifacts`:
   ```bash
   bd ready --exclude-type=epic --json
   ```
   ⚠ **The JSON, never the text view.** The text view groups by epic and does **not** show the real
   priority order. **The FIRST row of the JSON is the rung.** `bd show <id>` for its body.
5. **Its design** — under the finding-ids the bead names, in
   `floor-audit-2026-09-01/FLEET1_DIGEST.md`, cross-read against
   `floor-audit-2026-09-01/THE_PLAN__2026-09-01.md` and `THE_BLUEPRINT__2026-09-01.md`.
   **If the bead has no design anywhere, that is itself a fork — escalate, do not invent one.**

---

## §10-D, THE PARTS AN EXECUTOR ACTUALLY BREAKS

- **MICRO-ORDER FIRST (rule 9).** Before any edit, write into the session scratchpad: files to
  touch · the steps · the DONE-proof commands · **this rung's FORBIDDEN list**. No micro-order =
  improvising = refused.
- **REPRODUCE BY RUNNING, BEFORE YOU FIX (rule 5).** An unrun system is a hypothesis. Drive the
  REAL production path, not a copy of it, and keep the output — it is half the landing.
- **ONE RUNG. Its ceiling is a STOP** (rule 2), unless HE says otherwise in his own words.
- **A GATE MAY ONLY GET STRICTER (rule 6).** If your change raises a gate, **fix it — never freeze
  it, never move a baseline.** If a rule fires on something that is genuinely not a defect, use the
  rule's OWN waiver at the site with the reason; the baseline stays put.
- **A DONE-PROOF THAT STAYS RED = STOP (rule 10).** Record the exact command and output, leave the
  tick empty, commit the record, hand off. Never weaken a proof to pass it.
- **NEVER WEAKEN OR DELETE AN ASSERT.** If a member cannot measure in some environment, it degrades
  to a **NAMED SKIP** that says what it could not measure — never a red, and never a silent pass.
- **CLOSE (rule 7):** commit **AND PUSH** · append the landing to CHECKPOINT.md · close the bead ·
  terse close to him. **An issue lifts the terseness cap** — a fork, a halt, a defect, a
  correction is exactly what the detail is for.

## ESCALATE — do not decide alone (rule 13)
A real fork: a departure from the rung as written · two laws pointing opposite ways · a decision
another rung depends on · a judgement where being wrong is expensive.
**Do NOT escalate** what the micro-order, the order, or a DONE-proof already answers.
- Write ONE file into `C:\Users\nikhi\arsenal-audit-artifacts\queue\`, named
  `YYYY-MM-DD_HHMM-<session>-<n>.md`: context in two lines · the fork · options with costs · **your
  own recommendation and why** · exactly what you need back. Never send a question you have not
  first tried to answer. (One file per escalation, by the Q-12 addendum — the legacy single
  `ESCALATION_QUEUE.md` grows no new Q numbers and is a record only. **Rulings come BACK as
  `RULING__YYYY-MM-DD_<slug>.md` in the same folder** — look there before assuming no answer.)
- Put it on his clipboard yourself (`Set-Clipboard` from the file, never inline), **then READ IT
  BACK and assert the length and a distinctive string** — the clipboard here has three measured
  fault modes, one of which returns cleanly and yields 0 chars. Then one line to him.
- **HALT that thread** until the ruling returns. Record the ruling verbatim.

---

## THE TRAPS THIS CAMPAIGN HAS ALREADY PAID FOR
Each one cost a session. None is a rule of thumb; each was measured.

- **`npm test` IS REPRODUCIBLE-NOT-STABLE.** Measure it **uncontended** (nothing else running) and
  with the flow-atlas **in sync**. On 2 Sep the same tree gave 147/6, then 148/5, then 149/4 — the
  first had two suite runs overlapping, the second inherited a stale atlas. **A number measured
  beside another run is not a measurement.**
- **THE ATLAS FLAPS ON A CARD BEING DEALT, not on code.** Before believing a FLOW ATLAS red, diff
  the atlas field by field; three times on 2 Sep the only sha-covered field that moved was the note
  string `"29 of N cards ever answered"`, from the organism's own hourly card lane firing mid-run.
  Clear it with `xray build` + `flow_atlas build` in the same commit — **never weaken the gate.**
- **PROVE A CHECKOUT-ONLY FIX IN A CLONE.** `git clone` + `npm ci` + run the member. **Home passing
  proves nothing** about a defect that only exists where the gitignored files are absent — and the
  watchman cannot see that class by construction.
- **NEVER RUN `node scripts/awayday.mjs check`.** It is not read-only: it writes state, fires a live
  GitHub call, and can deal a card. Read `dressing-room/state/awayday.json` instead.
- **DRIVE ORGANS THROUGH THEIR INJECTED SEAMS** in any proof — `deps.write`, `deps.fileCard`,
  `deps.fetchRun`, a temp copy — so no proof ever writes his live state.
- **WRITE THE WORKING PER ITEM, NOT THE TOTAL.** Two numbers on this campaign's own record failed to
  reproduce, both times because only the total was written down.
- **ASK WHAT THE INSTRUMENT COULD SEE before believing what it said.** A green that depends on this
  laptop is not a green; a red whose surface prints ✓ lines names nothing.
- **THE EASY ASSERT IS USUALLY THE WRONG LAW.** "no ✓ anywhere", "the string is absent", "the weak
  one is missing" — each was caught by the suite on 2 Sep and each true law was narrower: judge the
  CLAIM separately from the CONTEXT; test for the absence of a claim, not of a string; test ORDER,
  not exclusion.
- **A DESTRUCTURED PARAM WITH NO DEFAULT vanishes from the `= {}` type**, so every call site passing
  it becomes a phantom `tsc` error. Give it a default — the JSDoc route makes it worse (TS8024).
- **`bd` DOES NOT WRITE THE TRACKED FILE — RUN `bd export -o .beads/issues.jsonl` BEFORE COMMITTING.**
  Measured 2 Sep: `bd show` said CLOSED while the git-tracked `issues.jsonl` still said `"open"` for
  **all seven** beads closed that day. Every close lived only in the local database; a restore from
  git would have erased the lot. Export, then confirm the status in the FILE, then commit.
- **HIS DATA IS PUBLIC by his 1-Sep ruling** — never card him about his own exposure. Two carve-outs
  stand and are absolute: **live credentials**, and **anything naming other people**. Glance at the
  diff before every push.

## SPEAKING TO HIM
Hinglish, direct, no hype-man. **Say the full thing in plain words — never §-codes, rung ids or
filenames as the subject of a sentence.** Report what landed, what it cost, and the one decision if
there is one; **always end by naming the next rung and its MODEL·effort line.** Ask him nothing
unless it is constitutional — a console visit, his history, his schedule.
