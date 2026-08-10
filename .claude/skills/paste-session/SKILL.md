---
name: paste-session
description: Ingest a Gem/Colab session — captain pastes the JSON array, the skill captures it and shows what changed in the body. Use when he pastes rep JSON or says "paste session" / "log reps".
---

# /paste-session — blood in, one paste

1. Take the pasted JSON array (or ask for it in ONE short line if missing).
2. Save it to a temp file, then run:
   `node scripts/capture.mjs paste <tmpfile>` → then `node scripts/heartbeat.mjs`.
   (verified 10 Aug 2026, both commands live and both still spelled exactly this way:
   `node scripts/capture.mjs` with no args prints the usage line
   `node capture.mjs paste [file] [--chain]`, and `heartbeat.mjs` with no mode
   defaults to `run` — `grep -n 'argv\[2\] || "run"' scripts/heartbeat.mjs`.
   ONE-COMMAND EQUIVALENT, added to capture.mjs after this file was written:
   `node scripts/capture.mjs paste <tmpfile> --chain` fires the same ordered
   recompute itself — `grep -n '\-\-chain' scripts/capture.mjs`. The chain is
   deliberately OPT-IN, so WITHOUT `--chain` the paste prints a line saying the
   derived state does NOT yet include these reps. That line is a truthful notice,
   not an error — the heartbeat in step 2 is what clears it. `paste` also accepts
   piped stdin, so the temp file is a convenience, not a requirement.)
3. Show the DELTA only (≤8 lines): reps ingested · any fluency change
   (learning_state concepts that moved 🔴→🟡→🟢) · new nemesis headline if one
   appeared · due cards — read `cards.json` → `due_today` and `overdue`
   (corrected 10 Aug 2026: this said "cards due tomorrow count" until today. NO
   state file publishes a tomorrow figure. `cards.json` carries `total_cards` ·
   `due_today` · `overdue` · `hardest_due` and nothing else of that kind —
   `grep -n "due_today: b.due_today" scripts/fsrs.mjs` — and
   `grep -rn "due_tomorrow" scripts/ dressing-room/state/*.json` returns nothing at
   all. A tomorrow count would have to be derived by hand from `fsrs_store.json`'s
   per-card `due` ISO timestamps, so the old wording asked for a number that could
   only be invented). Numbers only from the state files. The two other reads are
   live and unchanged: fluency labels are `🔴 learning` / `🟡 held` / `🟢 fluent` on
   `learning_state.json` → `concepts[].fluency` (`grep -n "const LABEL = "
   scripts/learning_state.mjs`), and the headline is `weaknesses.json` → `headline`,
   which is null when nothing is open — bias-to-silence
   (`grep -n "const headline = open.length" scripts/nemesis.mjs`).
4. NEVER edit the reps. NEVER re-grade his answers. Capture validates;
   malformed reps are rejected by capture.mjs, not by you — report its output
   verbatim if it rejects.
   (verified 10 Aug 2026, plus ONE nuance worth not mis-reporting: an UNREGISTERED
   concept is NOT a rejection. capture appends it with `unregistered:true` and
   prints `⚠ UNREGISTERED concept(s)` — SOFT, never hard-rejected
   (`grep -n "UNREGISTERED concept" scripts/capture.mjs`, and capture.mjs's own
   INPUT CONTRACT header says the same). Report that line as the warning it is —
   the reps DID land. Same for `⚠ … rep(s) claimed a timestamp AFTER they arrived`:
   the rep is in, its `ts` was corrected to the observed clock and `ts_claimed`
   keeps the original.)
5. Close with one honest line, self-scout register. No praise unless earned
   and specific.
