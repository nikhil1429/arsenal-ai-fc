# OPS_STATE.md — the live operational anchor is a COMMAND now

> Rewritten 18 Aug 2026 (ORGANISM_OVERHAUL Block 1 §13). This file used to be a 30 KB body whose
> "Last updated" read 2026-07-15 for a month while two audit banners were prepended above it — a
> location and a status written into prose rot the hour after they are written. The verbatim old
> body is at `docs/archive/OPS_STATE_2026-08-18.md` (layering; history in git).

## Where the organism IS, right now
```
node scripts/state.mjs
```
ONE deterministic line, zero LLM, read off disk: `pushed · daemons · suite · sitting · next · needs-you`.
It is line 1 of every SessionStart brief, rides the morning sheet push, and opens `/matchday` and
`/organism-doctor`. Anything this file used to claim (phase, done/pending, next action) is a field there.

## Where the BUILD is
`docs/archive/ORGANISM_OVERHAUL__2026-08-18.md` — the overhaul's RECORD (Blocks 0–8 built 18 Aug 2026; its BUILD LOG
marks each block ✅; RESUME HERE = Block 9, seven real days). **FREEZE deferred by his word 18 Aug 2026** (record `docs/archive/FREEZE__deferred-2026-08-18.md`; guard dormant —
`node scripts/freeze.mjs status`) · the week board `node scripts/state.mjs week` · LAW M + LAW A record `docs/archive/MODELS_AND_ACTS__2026-08-18.md` (`node scripts/models.mjs status` · `acts.mjs status`). Read, do not re-plan.

## The other live reads (never a number from a document)
- `node scripts/brain.mjs gate show` — which LLM lanes are asleep by THE GATE, why, what wakes each
- `node scripts/brain.mjs status` · `spend 7` — jobs, evidence, elision, truth lane, tokens
- `node scripts/watchman.mjs report` · `node scripts/pulse.mjs report` — last night's findings, every lane's liveness
- `node scripts/archivist.mjs status` — the permanent record
- `npm test` — the suite (authority)

## Locked decisions
Every ruling that binds a session is in `CLAUDE.md` (≤ 8 KB, "Rulings that are FINAL"), verbatim.
Repo: `nikhil1429/arsenal-ai-fc`, branch `main`.
