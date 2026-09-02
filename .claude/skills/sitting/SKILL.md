---
name: sitting
description: THE ONE SITTING — run the batched decision meeting with the captain, ~30 minutes, one question at a time. Use when he says "sitting", "the one sitting", "baithak", "let's decide", "decisions", or opens a session to answer what is waiting on his word. Reads everything itself; asks him NOTHING it can answer by running a command.
---

# /sitting — his 30 minutes, and nothing he has to remember

**WHY THIS IS A SKILL AND NOT A PROMPT.** The first version of this was a 4,500-character block he
had to paste. He caught it: *"usko khud nahi pata chalna chahiye?? itna bada prompt??"* — and he
was right, because it is the same class `/executor` was built to kill the same day. **Anything he
must carry into a session is a design failure.** He types `/sitting`. That is the whole ask.

**THIS IS NOT A RUNG.** No §10-D micro-order, no commit ladder. It is a conversation. The only
artefacts it produces are his decisions, recorded in his own words.

---

## READ EVERYTHING FIRST — he re-explains nothing

Run these before your first question to him. If a fact is in one of them and you ask him anyway,
you have wasted the sitting.

```bash
node scripts/state.mjs
```
```bash
tail -n 140 "C:/Users/nikhi/arsenal-audit-artifacts/floor-audit-2026-09-01/CHECKPOINT.md"
```
```bash
cd C:/Users/nikhi/arsenal-audit-artifacts && bd ready --exclude-type=epic --json
```
Then, from `C:\Users\nikhi\arsenal-audit-artifacts`: `bd show` each open **decision** and the
sitting bead itself (`af-qsit`), and read
`OPEN_QUESTIONS_REGISTER.md` (the P1–P12 table + STANDING) and
`docs/archive/ORGANISM_OVERHAUL__2026-08-18.md` §19 (the after-freeze list with today's status).

**Derive the agenda from the beads, never from a list written here.** A hand-kept agenda in this
file would rot the first day a decision is added — the same jugad this organism refuses everywhere
else. `bd ready --exclude-type=epic --json` filtered to `issue_type: "decision"`, plus anything
whose description starts `[HIM]`, IS the agenda.

---

## THE FOUR GROUPS the agenda falls into
Read them off the beads; these are only the shapes, so you can group what you find.
- **his straight decisions** — the open `decision` beads.
- **the after-freeze list** (§19, 10 items planned and never built) — re-rank against today's
  truth with him, never just read it out.
- **the decision packets P1–P12** — already assembled so his only act is haan/na. The two heavy
  ones are the whole notes-and-preparation system (nothing in it is approved) and GAFFER PERFECT
  (his own 29-Aug order).
- **the staged identity facts** — what the organism has learned about him and cannot make canon
  without his word. **Count them live, and count only `pending`** — the file is append-only, so its
  line count is NOT the answer (21 rows on 2 Sep were 13 pending, 6 promoted, 2 dropped):
  ```bash
  node -e "const r=require('fs').readFileSync('dressing-room/hippocampus/identity_facts.pending.jsonl','utf8').split('\n').filter(Boolean).map(l=>JSON.parse(l)); console.log(r.filter(x=>x.status==='pending').length+' pending of '+r.length); for(const x of r.filter(x=>x.status==='pending')) console.log(' ·',x.text)"
  ```
  Only he promotes (`hippocampus.mjs`). They have been stuck behind ONE card since 15 Aug.

## ALREADY ANSWERED — never re-ask
- **FinOps start date**, his words 2 Sep: *"finOps will be started once i start using the
  organism."* A **condition, not a date** — no calendar gate, no card ever.
- **His data is public**, his ruling 1 Sep: *"i do not care about my data, public jane do."* Never
  card him about his own exposure. Two carve-outs stand: **live credentials**, and **anything
  naming other people**.
Before asking anything, check the bead is still open — a closed one is answered.

---

## HOW TO RUN IT WITH HIM
- Hinglish, seedha, no hype-man. Push back if he is vague or wrong.
- **ONE thing at a time. Wait for his answer before the next.** Never a wall of questions, never a
  numbered list he has to hold in his head. This is the rule he breaks sessions over.
- **Say the full thing in plain words.** Never a §-code, a bead id or a filename as the subject of
  a sentence. Open any name he would not recognise in one line, the first time.
- Tell him where he is: *"ye 4 mein se 2 hai, itna bacha hai."*
- **Ask him nothing a command can answer. Run the command.**
- His standing intent, verbatim 29 Aug: *"mera kaam study karna hain, ye sab i am offloading to you
  and self healing organism."* Every question you put to him is a thing the organism could not
  decide — say why it could not.

## RECORD AS HE SPEAKS, not at the end
The moment he settles something, in the same turn:
```bash
cd C:/Users/nikhi/arsenal-audit-artifacts
bd comment <id> "HIS RULING, <date>, verbatim: \"<his exact words>\" — <what it means in one line>"
bd close <id> --reason "ANSWERED BY HIM <date>: <his words>"
bd export -o .beads/issues.jsonl
```
⚠ **`bd export` is not optional** — `bd` writes a local database, not the git-tracked file. On
2 Sep all seven of that day's closes still read `"open"` in the file git carries until it ran.
**Never paraphrase his ruling into the record.** His words, then your reading of them, clearly
separated.

## CLOSING
Append ONE block to `CHECKPOINT.md`: what he decided (his words) · what stayed open, named ·
what is now unblocked. Then `bd export`, commit, and push — the main repo pushes to origin, the
artifacts repo is local git only. **Anything he did not decide stays OPEN and is named as open.
Never assume a haan.** Then one short block to him: what is unblocked, and what still waits.
