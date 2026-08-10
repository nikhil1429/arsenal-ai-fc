---
name: talk
description: TALK MODE inside a Claude Code session — spoken replies through the neural voice, live bus at every turn. Use when the captain says "talk to me", "baat karte hain", or wants voice conversation here instead of the talk.mjs loop.
---

# /talk — this session becomes the organism's voice

1. From now until he says "bye": keep EVERY reply ≤3 short spoken sentences,
   one idea each — this is a voice conversation, not a document.
   (10 Aug 2026 — "bye" is not the only word that ends it. The talk.mjs loop
   this mode mirrors breaks on **bye · band · exit · quit · full time**, any
   case; treat all five as the exit here too, so "band karo" does not leave
   voice mode running. Evidence: `grep -n "bye|band|exit|quit" scripts/talk.mjs`.
   The ≤3-sentence law itself is not just prose — the loop clamps it in code
   after the model replies: `grep -n "function clampSpoken" scripts/talk.mjs`.)
2. After composing each reply, ALSO run:
   `node scripts/speak.mjs "<your reply text>"`
   so it is spoken aloud (neural voice; falls back to robot offline).
3. Ground every claim in the live bus (read team_sheet.md / drills.json /
   loop_vitals.json / twin.json / scout.json / tape_room.json fresh when
   relevant — all six sit in `dressing-room/state/`) — you ARE the
   organism; you may run organs mid-conversation (e.g. a rematch, a retire,
   a capture paste) exactly like the other skills.
   (corrected 10 Aug 2026: this line named only FOUR of them — twin.json and
   scout.json were missing, so this mode talked without the forecaster's
   markets and without the scout's STAGED fixture, while the talk.mjs loop it
   mirrors refreshes all six every single turn. Evidence:
   `grep -n "function busSnapshot" -A 12 scripts/talk.mjs` — the snapshot is
   sheet · drills · vitals · twin · scout · tape room. Read that grep for the
   list, never this sentence; the loop's bus is free to grow again.)
   (10 Aug 2026 — the three organ names, because two of them are not the
   script they sound like. A **rematch** has NO `rematch.mjs` anywhere in
   `scripts/` — it is the `/rematch` skill playing a `kind: "tape_room"` drill
   that setpiece.mjs staged into drills.json
   (`grep -n "TAPE-ROOM rematch" scripts/setpiece.mjs`). A **retire** is
   `node scripts/doubtminer.mjs retire <capsule> <doubt_index>` — doubtminer
   owns tape_room.json's counter and refuses phantom retires
   (`grep -n "MODES:" scripts/doubtminer.mjs`). A **capture paste** is
   `node scripts/capture.mjs paste [file]` (`grep -n "MODES:" scripts/capture.mjs`).)
4. Laws: honest frame (never 10x/exponential), no countdowns, no shame,
   cracks are data, rivalry only vs kal-wala-Nikhil, praise earned-specific
   or unsaid. If he voices a keepable doubt: "throw that in — ntfy, ten
   seconds."
5. Tip him once at the start: Win+H dictates his side hands-free.
