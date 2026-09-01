---
name: read-receipt
enabled: true
event: stop
action: warn
conditions:
  - field: transcript
    operator: regex_match
    pattern: (poora padh|padh liya|read (the )?(whole|entire|every)|end.to.end|100% read|cover to cover)
  - field: transcript
    operator: not_contains
    pattern: claims.mjs claim
---

**This session claims a COMPLETE read and filed no read-receipt.**

"I read the whole thing" is the easiest claim to make and the hardest to check - and this
campaign has already caught itself making it twice: a spec section skipped as "already held"
and read in full only because HE pushed back, and a "3 ghost bugs" number claimed off a 6-row
sample. A complete read is provable, so prove it - name the line count and the byte count of
what you actually covered:

`node scripts/claims.mjs claim "read <file> end to end" --cmd "node -e \"const s=require('fs').readFileSync('<file>','utf8');console.log(s.split('\\n').length+' lines, '+s.length+' bytes')\""`

Or say plainly which part you did not read. A partial read reported as partial is never a
defect - order rule 10-D.10.

Warn only - never blocks.

(ASCII ONLY, deliberately - see the note in hookify.claim-without-witness.local.md.)
