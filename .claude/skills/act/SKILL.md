---
name: act
description: THE ACT LANE inside a Claude Code session — his explicit word becomes a RECEIPT in the same turn (LAW A, 18 Aug 2026). Use when the captain asks for a thing to be DONE now — "note karo", "yaad rakhna", "agli baar pehle X", "Hinglish bolo", "yeh rule add karo", "samjhao ke liye taiyaar karo", "baad mein poochna", "research karo" — or says "act", "/act", "kar do abhi". Never say "note kar liya" without a receipt.
---

# /act — do it in this turn, show the receipt

His words (18 Aug 2026): *"what i am explicitly saying should be done and implemented right in that moment."*
A note nobody executes is the failure he named. Every verb below is an EXISTING owner's CLI, run through
`scripts/acts.mjs` (sole writer of `dressing-room/state/acts.jsonl` — his words verbatim); every row is a receipt or a named error.

## The verbs (his ask → verb → owner)
| his ask | verb | owner |
|---|---|---|
| "note karo / yeh yaad rakhna (thought/doubt/win)" | `note` (kind doubt·win·preference·thread) | hippocampus `mark` |
| "remember that I… / main … hoon" (a durable fact ABOUT him) | `fact` | hippocampus `stage-pending` (STAGED — he promotes) |
| "Hinglish bolo / greeting pehle / accent hatao" | `pref` (axis how_to_speak) | gaffer_state `standing add` |
| "yeh rule add karo" | `rule` | teaching_contract `add` |
| "agli sitting mein pehle X / kal pehle 4 samjhao" | `agenda` | sitting `agenda add` (the next sitting OPENS on it) |
| "samjhao ke liye material taiyaar karo / abhi plan bana do" | `job` (job = an EXISTING brain job id, e.g. `prepare_on_request`) | brain `run <id> --by captain` (his ask = the gate's C) |
| "baad mein poochna / kal decide karunga" | `card` | captains_call `file --key act:<id>` |
| "is topic pe research karo" | `mission` | scout `mission stage-topic` |

## How (one command per ask, in the SAME turn)
```bash
node scripts/acts.mjs do <verb> --door code --text "<his words verbatim>" [--kind k] [--axis a] [--id rule-id] [--job prepare_on_request]
```
Then say the receipt line it prints — `✓ <owner> · <receipt>` = "ho gaya"; `✗ <error>` = say what could not be done, one line.
Undo is one word: `node scripts/acts.mjs undo <id>` (a verb with no owner reverse says so). Board: `node scripts/acts.mjs status`.

## Alternative — the tail
End the reply with `<<ACT {"acts":[{"verb":"note","args":{"text":"<his words>","kind":"thread"}}]}>>` — the Stop hook (`turn_hook stop → acts stop`) dispatches it and prints the receipts before his next prompt. Schema, never keywords; the tail is stripped from what he reads.

## Never
- "note kar liya" with no command behind it (no-fake-done — the sitting brain flags it as teaching drift `fake-done`).
- an invented job id · a paraphrase of his words · a write outside an owner's CLI.
