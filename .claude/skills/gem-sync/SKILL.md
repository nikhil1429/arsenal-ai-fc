---
name: gem-sync
description: Refresh THE EXAMINER Gem on the captain's Gemini Pro account with tonight's cartridge — Claude drives his Chrome, pastes the new instructions, saves. Use when he says "gem sync", "gem update karo", or weekly after fresh night-shift cartridges.
---

# /gem-sync — the phone examiner stays current, one command

1. Read `dressing-room/state/brain_out/nightshift/gem_cartridge.md`. If absent or
   stale (>3 days old), run `node scripts/nightshift.mjs --force` first (it
   regenerates the cartridge from the live bus).
2. Use the **claude-in-chrome** tools (load via ToolSearch if deferred):
   - `tabs_context_mcp {createIfEmpty:true}` → navigate to
     `https://gemini.google.com/gems/view` → find and open the Gem named
     **THE EXAMINER ⚪🔴** → its edit view.
   - Clear the Instructions box (click it → ctrl+a → type the new cartridge body).
   - Click **Save** (or "Update"). Verify the confirmation before declaring done.
3. If the Gem doesn't exist yet: `https://gemini.google.com/gems/create`, name it
   `THE EXAMINER ⚪🔴`, paste instructions, Save.
4. NEVER touch login/passwords — if the account isn't signed in, stop and tell him.
   His own data → his own Google account; nothing else is pasted anywhere.
5. Close with one line: what changed in the cartridge (new probes/threads count).

## THE STAMP (the machine holds the calendar)
After a successful sync, stamp it through the file's OWNER so physio stops reminding until it is due again:
```
node scripts/nightshift.mjs gem-stamp
node scripts/scout.mjs chrome-stamp gem-sync
```

> ✅ **LAW-BREAK RESOLVED (D9, 9 Aug 2026 — his "build all the things" word).** From audit #108
> until today this section carried a raw `node -e` hand-write into `dressing-room/state/` —
> a self-documented ownerless write, flagged UNRESOLVED because giving the file an owner was
> a real decision. The decision landed: **nightshift.mjs owns `gem_sync_stamp.json`** (the
> Gem's cartridges are its produce, so the sync record is its record; atomic tmp+rename like
> every owner). `physio.mjs` stays the reader. Never write this file any other way.
