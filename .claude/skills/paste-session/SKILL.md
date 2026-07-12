---
name: paste-session
description: Ingest a Gem/Colab session — captain pastes the JSON array, the skill captures it and shows what changed in the body. Use when he pastes rep JSON or says "paste session" / "log reps".
---

# /paste-session — blood in, one paste

1. Take the pasted JSON array (or ask for it in ONE short line if missing).
2. Save it to a temp file, then run:
   `node scripts/capture.mjs paste <tmpfile>` → then `node scripts/heartbeat.mjs`.
3. Show the DELTA only (≤8 lines): reps ingested · any fluency change
   (learning_state concepts that moved 🔴→🟡→🟢) · new nemesis headline if one
   appeared · cards due tomorrow count. Numbers only from the state files.
4. NEVER edit the reps. NEVER re-grade his answers. Capture validates;
   malformed reps are rejected by capture.mjs, not by you — report its output
   verbatim if it rejects.
5. Close with one honest line, self-scout register. No praise unless earned
   and specific.
