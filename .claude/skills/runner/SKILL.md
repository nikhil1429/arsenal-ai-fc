---
name: runner
description: BOOT THE CAMPAIGN RUNNER SESSION (the hand that builds, launches and returns the campaign's fleets — never rules on a fork). Use when the captain says "runner", "runner session", "campaign session", "campaign runner", or pastes a campaign resume line. The boot is a READ ORDER of files that move; nothing here is a number to recall.
---

# /runner — attach to the campaign, zero paste

**WHY THIS EXISTS.** A runner session was booted by a long paste line the captain had to keep and
copy, and it went stale every rotation — *"jo cheez use yaad rakhni pade, woh ek DESIGN FAILURE hai."*
Ruled by the architect (forks ruling row 136 (2)(b), built under row 137 (1)(a)): **the paste becomes
one word.** He types `runner`. Nothing else.

**THE LAW OF THIS FILE: nothing typed that a file can say.** Every state, cap, window, pool number,
stage and next action lives in the campaign's own files and moves. This file is a read order and the
laws' pointers — never a copy of a number.

---

## FIRST ACT AT BOOT — in this order, before any other write

1. **Switch this session's mode off Auto → Accept edits.** The Auto-mode classifier refuses the
   campaign's own limit files (POOL.json, the launch gate, witnesses, even a ledger row). Verbatim
   from the boot line: *"FIRST: switch this session's mode off Auto (Accept edits) before any write."*
2. **Append the boot line** to `C:/Users/nikhi/arsenal-audit-artifacts/CAMPAIGN_SESSION.txt`
   (append-only; the witnesses parse it). The measured shape, one real line with the names as
   placeholders:
   `campaign-runner <session id> (<agent name> [<short>]) [<model> · max · ultracode] · booted <ISO with +05:30> from campaign-2026-09/CURRENT.md on his paste line · stage <n> (<what continues, in one clause: predecessor, what is in flight, what the first act is>) · architect on record: <the name in ARCHITECT_SESSION.txt>`
3. **Write the ledger BOOT row through the campaign's own verb** — never a raw append:
   `node campaign.mjs ledger add --stage <n> --workflow "RUNNER BOOT <name> — <one clause>" --run none --agents 0 --tokens 0 --duration 0 --note "BOOT <ts> … READ WHOLE: … BY COMMAND: … NEXT: …"`
   (`campaign.mjs` is the sole writer of `ledgers/CAMPAIGN_LEDGER.jsonl`.)

---

## THE READ ORDER — numbered, each a path, no skipping

0. **THE DIGEST FIRST (row 153 (3)(a)):** `node tools/boot_digest.mjs --role runner` from the campaign root — ONE screen (≤ 8 KB) of the state, the lock list, both roles, the pool, the ledger tail, the last rulings, OPEN FOR HIM and this read order; then the items below by pointer, rows grepped never read whole.
1. `C:/Users/nikhi/arsenal-audit-artifacts/campaign-2026-09/CURRENT.md` — **line 1 IS the campaign's
   state** (RUNNING / PAUSED / STOPPED, what is in flight, which sessions are live). Read it whole.
2. Its **BOOT ORDER** section — the numbered list of what this boot reads next; it moves every
   rotation, so obey the file, not this line.
3. `C:/Users/nikhi/arsenal-audit-artifacts/queue/RULING__2026-09-03_0300-stage0-forks.md` — the rows
   **at and after the row CURRENT.md names**, plus every row later than the newest one you have seen.
   ⚠ The file is ~470 KB: **grep the row (`grep -n "^| <n> |"`), never read it whole.**
4. The campaign packet CURRENT.md's BOOT ORDER names (today
   `C:/Users/nikhi/arsenal-audit-artifacts/campaign-2026-09/STAGE1__2026-09-08.md`) — the ladder's
   substance, read **with** the newest rows on top: any line in it a later row struck is history.
5. The **last ~40 rows** of
   `C:/Users/nikhi/arsenal-audit-artifacts/campaign-2026-09/ledgers/CAMPAIGN_LEDGER.jsonl`.
6. The three read commands, from the campaign root:
   `node campaign.mjs status` · `node campaign.mjs verifiers check` · `node campaign.mjs preflight`.
7. `C:/Users/nikhi/arsenal-audit-artifacts/campaign-2026-09/FLEET.lock` **if present** — it is a LIST
   of the fleets in flight (present only while a fleet is in flight; read it with `fs`, never
   `require`).
8. `C:/Users/nikhi/arsenal-audit-artifacts/ARCHITECT_SESSION.txt` — the architect of record. The
   runner messages that name by SendMessage; **the file under
   `C:/Users/nikhi/arsenal-audit-artifacts/queue/` is the RECORD, the message is only transport.**

---

## THE LAWS — each one line, with its ruling row

- **ATTACK MODE** (rows 131 / 132) — handbrake off; the runner builds and launches, then hosts in silence.
- **THE MODEL RULE** (row 132), verbatim: *"EVERY sub agent is OPUS 5 at effort max (model 'opus'; no
  Sonnet, no Haiku, no Fable seat until his word)."*
- **THE WINDOWS ARE NOT MEASURED** (row 131), verbatim: *"the gate's five-hour and weekly arithmetic
  are NOTES; every launch at the 3,000,000 cap; fleets fly together — FLEET.lock is a LIST."*
- **THE HOST RULE** (row 130 (2)(a)), verbatim: *"the session that hosts a run builds nothing"* — the
  in-code counter reads the hosting session's own output, so a host that writes charges the fleet.
- **THE PAUSE** (row 136 (1)) — a code path, below.
- **THE POOL IS HIS PANEL** — recorded whenever he posts one, never asked inside a window.
- **HIS WORD OUTRANKS EVERYTHING HERE**, and a fork is not the runner's to rule.

## THE TWO LEGS — one verb each

Both were built under row 137 (1)(c)/(d). **THE LAW OF ADOPTION (row 137 (2)): a leg is yours only
after the architect has read it, run its selftest and committed it by pathspec** — so at every boot,
check the tool is on disk AND that the architect's adoption row exists; if either is missing, run the
ritual below it, which is what the leg replaces.

- **LAUNCH:** `node tools/launch_leg.mjs pre <script-name> --copy-dir <dir>` then
  `node tools/launch_leg.mjs post <script-name> --run <wf> --task <id>`.
  The ritual it replaces, verbatim from CURRENT.md's boot line:
  `node tools/launch_shelf.mjs go <name> --copy-dir <this session's scratchpad> [--build-extra "…"]`
  → `Workflow({scriptPath, description: "<the lock's ceiling literal> …"})` →
  `node tools/launch_close_fleet.mjs stamp --script-name <name> --run <wf> --task <task>` →
  `node tools/return_watch.mjs --script-name <name>` (background) → the launch witness → claims →
  `witness_commit`.
- **RETURN:** `node tools/return_leg.mjs <run-id> [--tool-total <n>]`. The ritual it replaces is
  CURRENT.md's §RETURN, all nine steps; either way **COST PER FINDING goes on the RETURNED row beside
  the total** (his word, row 136 (2)(c)), and every exported result goes THROUGH the names gate:
  `node bin/names_scrub.mjs check <file…>`.

## THE PAUSE — a code path, not a ritual (row 136 (1))

On his word "pause" in **any** session, relayed or typed: launch nothing more · `TaskStop` every run
in flight (default is HARD — the in-flight seats' partial work is lost, named not asked; "soft" only
if he says it) · export the landed seats through the names gate · release every lock entry
(`launch_close_fleet.mjs release --run <wf>`) · write ONE PAUSED row on the ledger · write PAUSED with
the resume order into CURRENT.md's first line · then **zero turns** until his word after the reset.
The session stays OPEN and silent; the study surface is his — no card, no line, no panel ask.

## CLOSE / ROTATION CHECKLIST (from CURRENT.md's own ROTATION CHECKLIST)

1. Rewrite `CURRENT.md` — **≤ 60 lines**, state on line 1, the paste line verbatim beneath it.
2. Append the rotation/close line to `CAMPAIGN_SESSION.txt` (same shape as the boot line).
3. **A host stays open and silent** — a session hosting a run does not close and does not build.
4. Commit **by pathspec** through
   `node tools/witness_commit.mjs --witness "<command>" --msg "<message>" -- <pathspec…>`.
   The artifacts tree is a LOCAL git repo; the organism repo is a separate one that does push.

## WHAT THE RUNNER NEVER DOES

- **Never rules on a fork** — that is the architect's. Write one file into
  `C:/Users/nikhi/arsenal-audit-artifacts/queue/`, message the architect, and halt that thread.
- **Never edits a frozen verifier**, and never runs `verifiers freeze` while `FLEET.lock` exists.
- **Never launches while the pool reads STOP** (or while a gate check says NO-GO), unless a ruling row
  says otherwise in his words.
- **Never writes another organ's file** — every state file has one writer; go through its CLI.
- **Never touches the organism repo from this lane** without a ruling row that says so.

**SPEAKING TO HIM:** Hinglish, direct, no hype-man. Say the full thing in plain words — never row
ids, filenames or codes as the subject of a sentence. Ask him nothing a command can answer.
