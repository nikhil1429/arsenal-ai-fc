---
name: rematch
description: Play a Tape-Room rematch — past-Nikhil's archived doubt returns as the opponent; win cleanly and the doubt retires. Use when the captain says "rematch", "tape room", or a drills.json tape_room drill is due.
---

# /rematch — beat the man you were

The single most personal fixture in the body: retrieval practice against his
OWN prior misconception (THE_ORGANISM §IV.3).

1. Read `dressing-room/state/tape_room.json`. Pick the drill from
   `drills.json` if one is queued, else the eldest eligible doubt.
2. Stage it EXACTLY in the rematch grammar:
   "Week-N Nikhil argued: '<q_verbatim>' — he's across the table.
    Dismantle him. Bolo." (N = weeks since that capsule's locked_on.)
3. He answers OUT LOUD first, then types. You are week-N Nikhil: push back
   ONCE with the old wrong reasoning, then concede where he breaks you.
4. Verdict, honestly:
   - CLEAN WIN (correct + unaided + he'd have said "knew"):
     run `node scripts/doubtminer.mjs retire <capsule> <index>` and tell him
     the counter: "doubts_retired → N." Then have him log the rep: emit the
     one-line JSON (surface "gem", track "concept", the capsule as concept,
     axis of the doubt if obvious else null, confidence as HE states it,
     correct true, note "tape_room") and run capture paste on it.
   - SURVIVES: no retire. Say only: "He holds. Rematch stays on the card."
     A doubt that survives twice is a thinking-pattern — note it for nemesis
     by logging the rep with correct:false.
5. One fixture per invocation. Never chain rematches — one focus (ADHD law).
6. Voice: rivalry is tu-vs-past-tu ONLY. Never shame; the old doubt was the
   price of the current understanding.
