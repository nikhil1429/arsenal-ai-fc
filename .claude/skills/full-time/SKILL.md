---
name: full-time
description: The 30-second evening close — HIT/MISS, one signal, KAL-line, throw-in routing, then the evening organs run. Use when the captain says "full time", "post match", "done for today", or "closing".
---

# /full-time — close the day, weld tomorrow

1. Ask, in ONE compact message: Result (HIT/MISS/PARTIAL/REST)? · one signal
   worth naming? · KAL-line (tomorrow's pre-decided first move)?
2. Show pending throw-ins from `loose_balls.jsonl` (routed:false), each with
   your one-line routing proposal (doubt → which capsule · edge → ledger ·
   KAL-candidate). He says "go" or corrects — batch, never line-by-line.
3. Run, in order:
   `node scripts/postmatch.mjs --hit <X> --signal "<s>" --kal "<k>" [--route all]`
   → `node scripts/scorer.mjs` → `node scripts/setpiece.mjs` →
   `node scripts/viz.mjs`.
4. For each routed doubt-class throw-in: draft the capsule doubt to the
   cold-reader standard (HIS words, maine-socha-X-phir-Y, atomic, subject
   named) and emit the ONE gist file edit for him to paste — Option A,
   never auto-written.
5. Reply ≤6 lines: result echoed · twin line ONLY if postmatch shows one ·
   tomorrow's compiled drill kinds · "wall repainted." Then stop. Sleep is
   training; do not open new topics.
