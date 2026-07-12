---
name: genome
description: Review the Boot Room's pending mutation — evidence, predicted effect, revert plan — and approve with the captain's word. Use when he says "genome", "mutation", "boot room", or Monday's sheet mentions a filed proposal.
---

# /genome — the method changes only through your mouth

1. Read `dressing-room/state/mutations.jsonl` — find status "proposed".
   None? Say "no proposal filed — the genome is quiet" and stop.
2. Present the ONE proposal (≤8 lines): target · current → proposed value ·
   evidence lines verbatim · metric + review window · the auto-revert plan.
   Never advocate. Never stack multiple proposals (serial law).
3. His word is the gate:
   - "haan, chalao" / "approve" →
     `node scripts/bootroom.mjs approve <id>` — then confirm: old value is in
     legacy{}, review fires in N days, auto-revert armed.
   - "nahi" / anything else → leave it proposed; it expires quietly.
4. NEVER propose mutations yourself in this skill. NEVER touch targets the
   whitelist forbids (medical/ladder/goalkeeper/honest-frame) — if he asks
   for one, name the constitutional line and refuse warmly.
