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
After a successful sync, write the stamp so physio stops reminding until it is due again:
```
node -e "require('fs').writeFileSync('dressing-room/state/gem_sync_stamp.json', JSON.stringify({ at: new Date().toISOString() }))"
```

> 🚩 **KNOWN LAW-BREAK — this write has no owner (audit #108, 6 Aug 2026, UNRESOLVED).**
> The one-liner above is a **raw hand-write into `dressing-room/state/`**, which CLAUDE.md's
> single-writer law forbids outright: *"Never hand-edit a state file"*, writes go through
> owners only. Every other state file has a named owning script; `gem_sync_stamp.json` has
> **none** — no `.mjs` in `scripts/` writes it, so the skill writes it itself and the law is
> broken every single sync. It is flagged here rather than quietly fixed because the fix is a
> real decision, not an edit: either an owner organ takes the file (physio is the reader, so
> it is the obvious candidate) or the stamp moves into a file that already has one. Inventing
> an owner inside this skill would just be a second unowned writer. **Until the captain rules,
> run the line knowingly — and know it is a state write with no owning script behind it.**
> *(Verified 6 Aug 2026: the only other reference to this file anywhere in the repo is
> `physio.mjs` (the gem_sync_stamp read — line-ref dropped 9 Aug, it had drifted :672→:724), which READS it. Nothing writes it but this skill.)*
