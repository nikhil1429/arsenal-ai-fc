---
name: rematch
description: Play a Tape-Room rematch — past-Nikhil's archived doubt returns as the opponent; win cleanly and the doubt retires. Use when the captain says "rematch", "tape room", or a drills.json tape_room drill is due.
---

# /rematch — beat the man you were

The single most personal fixture in the body: retrieval practice against his
OWN prior misconception (THE_ORGANISM §IV.3).
(verified 10 Aug 2026 — the citation HOLDS, but the address was ambiguous, so it now
carries one: the file is `learning-layer/THE_ORGANISM.md`, and the section is
`grep -n "IV.3 TIME-DEPTH" learning-layer/THE_ORGANISM.md` with **THE TAPE ROOM** as the
first block under it — `grep -n "THE TAPE ROOM" learning-layer/THE_ORGANISM.md`. The bare
name "THE_ORGANISM" now matches several other files, most of them in the repo root —
`git ls-files | grep -i organism` — so the name alone stopped being an address.)

1. Read `dressing-room/state/tape_room.json`. Pick the drill from
   `drills.json` (full path `dressing-room/state/drills.json`) if one is queued,
   else the eldest eligible doubt.
   (verified 10 Aug 2026 — every claim in this step holds in code. The queue really
   is eldest-first: `grep -n "eldest opponent first" scripts/doubtminer.mjs` sorts on
   `locked_on`. `eligible` really is the flag: `grep -n "eligible: oldEnough"
   scripts/doubtminer.mjs`. A queued drill really is shaped `kind: "tape_room"`:
   `grep -n 'kind: "tape_room"' scripts/setpiece.mjs`.
   ADDED the same day, because it changes what "if one is queued" means and reading
   it wrong serves a fixture the body already declined: that drill is emitted with
   `mode: "defend"` (same block as that grep hit), the ladder drops every non-`recall`
   mode on AMBER — `grep -n "heavy drill modes withheld" scripts/setpiece.mjs` — and
   withholds the entire packet on RED — `grep -n "full drill packet withheld"
   scripts/setpiece.mjs`. So on an AMBER or RED day drills.json carries NO tape_room
   drill BY DESIGN, and its `withheld[]` line says so in words. Falling straight
   through to "the eldest eligible doubt" on such a day re-serves exactly what the
   ladder just withheld. Read the verdict before you fall through:
   `node -e "const d=require('./dressing-room/state/drills.json');console.log(d.ladder_verdict, JSON.stringify(d.withheld))"`.
   ADDED too: `eligible` is no longer only an age test. GATE 2 holds a doubt OUT of
   the queue until its wording is cold-readable — `grep -n "gate2: not cold-readable
   yet" scripts/doubtminer.mjs` — and those rows stay present, verbatim, with
   `eligible: false` plus an `ineligible_reason` and a `gate2_flag`. Never stage one.
   Read the live split; never trust a count written in prose:
   `node -e "const t=require('./dressing-room/state/tape_room.json');console.log(t.retire_line,'|',t.queue.filter(q=>q.eligible).length+' eligible of '+t.queue.length,'| gate2 withheld '+t.gate2.withheld_from_queue)"`)
2. Stage it EXACTLY in the rematch grammar:
   "Week-N Nikhil argued: '<q_verbatim>' — he's across the table.
    Dismantle him. Bolo." (N = weeks since that capsule's locked_on.)
   (verified 10 Aug 2026 — this grammar is CORRECT, word for word, in two places at
   once: the canon template `rematch_template` in
   `dressing-room/state/dossier_weights.json` and the embedded fallback the compiler
   uses when that file is missing or malformed — `grep -n "rematch_template"
   scripts/setpiece.mjs dressing-room/state/dossier_weights.json`. Do not reword it.
   PRECISION ADDED, same day, so a hand-staged rematch and a drills.json one can
   never print different weeks: N is not a raw division. The code is
   `Math.max(1, Math.round((now − locked_on) / 7 days))` — ROUNDED, and never below
   1 — and when `locked_on` will not parse as a date it falls back to 2 rather than
   printing "Week-NaN": `grep -n "Week-NaN" scripts/setpiece.mjs`. Use the same
   arithmetic.
   Field-name trap while you read: the queue row's key is `locked_on` (snake), and
   it is copied off the capsule's own `lockedOn` (camel) —
   `grep -n "locked_on: c.lockedOn" scripts/doubtminer.mjs`. Reading a capsule file
   directly, it is `lockedOn`; reading tape_room.json, it is `locked_on`.)
3. He answers OUT LOUD first, then types. You are week-N Nikhil: push back
   ONCE with the old wrong reasoning, then concede where he breaks you.
4. Verdict, honestly:
   - CLEAN WIN (correct + unaided + he'd have said "knew"):
     run `node scripts/doubtminer.mjs retire <capsule> <index>` and tell him
     the counter: "doubts_retired → N." Then have him log the rep: emit the
     one-line JSON (**ts**, surface "gem", track "concept", the capsule as
     concept, axis of the doubt if obvious else null, **question**, confidence
     as HE stated it BEFORE answering, correct true, note "tape_room") and run
     capture paste on it — `node scripts/capture.mjs paste <file.json>` (a file
     arg or piped stdin: `grep -n "provide a JSON file arg or pipe JSON"
     scripts/capture.mjs`).
     (**corrected 10 Aug 2026** — this listed SIX fields; the validator requires
     EIGHT, and the two it left out are HARD REJECTS, not defaults:
     `grep -n "ts missing/not-string" scripts/capture.mjs` and
     `grep -n "question missing/empty" scripts/capture.mjs`. RUN, not reasoned —
     the old six-field list was fed to the live `validateRep` export and came
     back `{ok:false, error:"ts missing/not-string"}`; adding only `ts` moved it
     to `{ok:false, error:"question missing/empty"}`; adding `question` too
     returned ok with `note:"tape_room"` preserved. So the old list produced
     "appended 0, rejected 1": the retire landed, the rep did not, and
     calibration, nemesis and fsrs never saw the clean win at all. Reproduce it
     without touching reps_log — import `validateRep` from `scripts/capture.mjs`
     and call it on the object (`grep -n "^export {" scripts/capture.mjs`).
     `ts` must also PARSE as a date (emit an ISO stamp, never "just now"):
     `grep -n "ts not a parseable date" scripts/capture.mjs`.
     Three more things the code says that this step did not, same date:
       · GUT-WORD LAW — "confidence as HE states it" now reads BEFORE answering,
         because that is what the door itself enforces in its own words:
         `grep -n "GUT-WORD LAW" scripts/capture.mjs`. A gut-word collected
         after step 3's answer is not a gut-word, and no gut-word, no rep.
       · `capture.mjs rep` is the newer one-rep door — and it is the WRONG door
         here. It assembles its rep from a fixed flag list with no `--note`
         (`grep -n 'question: flag("q")' scripts/capture.mjs`, then read the
         object literal around it), so it would silently drop
         `note: "tape_room"`, the only mark that says this rep came from the
         Tape Room. `paste` is right: it accepts a BARE OBJECT, not only an
         array — `grep -n "Array.isArray(j) ? j : " scripts/capture.mjs` — so
         one rematch rep is a legal paste.
       · the queue row carries NO axis. Its keys are capsule · doubt_index ·
         q_verbatim · locked_on · eligible · ineligible_reason · gate2_flag
         (`grep -n "q_verbatim: d.q" scripts/doubtminer.mjs`). So "if obvious"
         is a judgement call and `null` is the honest default; a non-null axis
         must be one letter a–i (`grep -n "AXES  " scripts/capture.mjs`).
     "the capsule as concept" checks out — every capsule id on disk is a
     registered concept, so it coins no phantom topic. Verify live, never from
     this line: `ls dressing-room/state/capsules/` against
     `node -e "console.log(Object.keys(require('./dressing-room/state/concepts.json').concepts).join(', '))"`.
     And `doubts_retired` is a real field of tape_room.json, de-duplicated so a
     double retire cannot inflate it — `grep -n "doubts_retired: retiredKeys.size"
     scripts/doubtminer.mjs`. `retire` also re-runs the whole build and prints
     the have/need line itself, so read N off that output rather than guessing:
     `grep -n "retire_line" scripts/doubtminer.mjs`.)
   - SURVIVES: no retire. Say only: "He holds. Rematch stays on the card."
     A doubt that survives twice is a thinking-pattern — note it for nemesis
     by logging the rep with correct:false.
     (verified 10 Aug 2026 — the route is real: nemesis reads reps_log.jsonl as
     its sole truth source and keys on `correct`, so a `correct:false` rep does
     reach it. `grep -n "reps_log is the SOLE truth source" scripts/nemesis.mjs`
     and `grep -n "!r.correct" scripts/nemesis.mjs`. The full-field rule above
     applies to THIS rep too — `ts` and `question` are required here exactly as
     they are on a clean win, and a rejected miss is a miss nemesis never sees.
     "survives twice" is a JUDGEMENT this skill makes by hand: nothing in the
     code counts survivals — the queue row carries no attempt counter, and
     tape_room.json records only retires. Marked so nobody looks for a field
     that does not exist.)
5. One fixture per invocation. Never chain rematches — one focus (ADHD law).
6. Voice: rivalry is tu-vs-past-tu ONLY. Never shame; the old doubt was the
   price of the current understanding.
