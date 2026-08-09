---
name: gist-patch
description: Walk a closed Re-Jirah round's reJirahDone patch into the capsule gist with ZERO copy-paste tax — Claude drives the captain's Chrome to the gist edit page and pre-fills the one-line patch, HIS Save click stays the only master write, then mirror.mjs re-fetches so PENDING clears in the same sitting. Use when he answers haan on a rejirah pending card, or says "patch paste", "gist patch", "rejirah paste", "round gist mein daal do".
---

# /gist-patch — the round comes home to the gist (LADDER C1, 9 Aug 2026)

**THE LAW THIS RIDES:** the gist is the MASTER and only HIS manual writes touch it
(`mirror.mjs` header; `FORGE_SPEC.md` §2 2b — `reJirahDone` is *his paste*). Five
organs (fsrs · deep · capsule_bridge · dugout · shipped) ignore a closed round
until the mirror brings it back, so an un-pasted round is a round that never
happened. This skill moves every finger-movement onto the machine and leaves him
exactly ONE human moment: the Save click. That click IS the master write.

## THE WALK

1. `node scripts/rejirah.mjs pending` — read the oldest pending round: concept,
   round, due date, and the exact one-line patch it prints
   (`  "reJirahDone": [...],`). Nothing pending = say so in one line, stop.
2. Drive HIS Chrome (claude-in-chrome MCP, same rail as /fire and /gem-sync):
   navigate to the gist edit page —
   `https://gist.github.com/nikhil1429/ce50c28d585c2fcd915a9dbf61871a56/edit`
   (the gist id is mirror.mjs's own configured base, mirror.mjs:72).
3. Find the `<concept>.json` file's editor block on the page. Locate the
   existing `"reJirahDone"` line — or, if the capsule has none yet, the spot
   just before the closing `}`. Pre-fill the EXACT patch line rejirah printed
   (never reworded, never reformatted — the owner's line or nothing).
4. **DO NOT click "Update public gist" / Save.** Say: *"<concept> R<round> ka
   patch bhara hua hai — Save dabao."* HIS CLICK is the write.
5. After his click: run `node scripts/mirror.mjs` (re-fetch the gist), then
   `node scripts/rejirah.mjs pending` — the round must have LEFT the pending
   list. Press the rail stamp too (LADDER E7):
   `node scripts/scout.mjs chrome-stamp gist-patch`. Report the delta in one line ("R1 landed — 5 organs ab round dekhte
   hain"). Still pending after the mirror run = say so honestly (the Save may
   not have landed) and stop; never mark anything done by assumption.
6. Chrome tools not connected? Fall back honestly: print the patch line for ONE
   manual paste, name the taxed path, and still run mirror.mjs after he says done.

## NEVER
- Never click Save/Update yourself — his click is the only master write.
- Never edit any capsule field other than the `reJirahDone` line this patch names
  (capsule prose is SACRED — `FORGE_SPEC.md` locked fields).
- Never write to `dressing-room/state/capsules/` by hand — that mirror belongs to
  mirror.mjs alone.
- Never batch two rounds into one walk — serial, like every captain's-word lane.
