---
name: gem-sync
description: Refresh THE EXAMINER Gem on the captain's Gemini Pro account with tonight's cartridge — Claude drives his Chrome, pastes the new instructions, saves. Use when he says "gem sync", "gem update karo", or weekly after fresh night-shift cartridges.
---

# /gem-sync — the phone examiner stays current, one command

1. Read `dressing-room/state/brain_out/nightshift/gem_cartridge.md`. If absent or
   stale (>3 days old), run `node scripts/nightshift.mjs --force` first (it
   regenerates the cartridge from the live bus).

   > *(verified 10 Aug 2026 — the path and the flag both HELD, but two things this step
   > did not say change what you actually do. The file is job 5 of the night shift
   > (`grep -n 'write("gem_cartridge.md"' scripts/nightshift.mjs`), written into
   > `OUT_DIR = dressing-room/state/brain_out/nightshift` (`grep -n "OUT_DIR   =" scripts/nightshift.mjs`);
   > the nightly writer is the `ArsenalFC-NightShift` task at 02:40
   > (`grep -n "ArsenalFC-NightShift" setup/INSTALL_CYBORG_TASKS.ps1`), clock-gated to
   > 01:00–06:59 in code (`grep -n "function isOvernight" scripts/nightshift.mjs`).
   > (a) **`--force` runs the WHOLE shift, not just the cartridge** — every job, against a
   > hard budget of 62 LLM calls (`grep -n "shift_call_budget" scripts/nightshift.mjs`), and
   > it deliberately overrides BOTH gates: the overnight clock AND the conserve-tone rest law
   > (`grep -n "deps.force" scripts/nightshift.mjs`). So it is never a cheap re-render. The
   > cartridge's own assembly is deterministic, but its FRESH PROBES block is that same
   > night's LLM-generated probe bank (`grep -n "FRESH PROBES" scripts/nightshift.mjs`).
   > (b) **">3 days" is this skill's own local rule of thumb, not the machine's bar** — the
   > machine carries two numbers and neither is 3 days: physio expects the cartridge every
   > **30 hours** (`grep -n "gem_cartridge.md" scripts/physio.mjs`), and the SYNC ritual comes
   > due at **≥7 days** (`grep -n "gemSyncDue" -A4 scripts/physio.mjs`). Don't eyeball the age —
   > read it: `node scripts/nightshift.mjs status`, and the cartridge's own first line dates
   > itself (`# GEM CARTRIDGE · <date>`).)*
2. Use the **claude-in-chrome** tools (load via ToolSearch if deferred):
   - `tabs_context_mcp {createIfEmpty:true}` → navigate to
     `https://gemini.google.com/gems/view` → find and open the Gem named
     **THE EXAMINER ⚪🔴** → its edit view.
   - Clear the Instructions box (click it → ctrl+a → type the new cartridge body).
   - Click **Save** (or "Update"). Verify the confirmation before declaring done.
3. If the Gem doesn't exist yet: `https://gemini.google.com/gems/create`, name it
   `THE EXAMINER ⚪🔴`, paste instructions, Save.

   > *(checked 10 Aug 2026 — the TOOL claim held, the NAME could not be verified.
   > `tabs_context_mcp` does take `{createIfEmpty: true}`: it is in the live tool schema,
   > not just in this prose. **NOT VERIFIED 10 Aug 2026 — the Gem's name.** No code anywhere
   > in the repo carries the string `THE EXAMINER ⚪🔴` — `git grep -n "EXAMINER ⚪"` returns
   > only prose, and every other file that states the name cites THIS file as its source, so
   > it is one unverified claim echoing itself. Worse, `setup/GEMS_SETUP.md` tells him to
   > create the examiner Gem as **"The Examiner"** (different name, no badge). Nothing in the
   > repo can settle which name the Gem on his account actually carries. Treat the name as a
   > claim: when you reach the Gems list, READ what is there before you clear any box —
   > step 2 does ctrl+a and types over the whole Instructions body, so a wrong target is
   > destructive and not undoable from here. If the list disagrees with this line, ask him;
   > it is his account, and only he can rule on which Gem is the examiner.
   > The two `gemini.google.com` URLs are external and unverifiable from the repo — no code
   > references them (`git grep -n "gems/view\|gems/create"` hits this file only).)*
4. NEVER touch login/passwords — if the account isn't signed in, stop and tell him.
   His own data → his own Google account; nothing else is pasted anywhere.
5. Close with one line: what changed in the cartridge (new probes/threads count).

   > *(verified 10 Aug 2026 — the cartridge does carry both, so this line is answerable:
   > `FRESH PROBES (tonight's bank …)` and `Open threads to attack:` are literal sections of
   > the generated file (`grep -n "Open threads to attack" scripts/nightshift.mjs`). Don't count
   > them by hand — the shift already files its own accounting for this job (capsules ·
   > probe_concepts · has_fingerprint · open_threads · danger_topics · premap_day, plus an
   > `empty` verdict): read it with `node scripts/nightshift.mjs status`, or from the night's
   > record `dressing-room/state/brain_out/nightshift/shift_<date>.json` under `jobs.gem_cartridge`.
   > A cartridge with `empty: true` still writes and still pastes cleanly — it just has nothing
   > of his in it, which is worth saying out loud in that closing line rather than reporting a
   > sync that moved nothing.)*

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

> ✅ **RE-VERIFIED 10 Aug 2026 — both commands and the ownership ruling HELD; the reader
> line did not.** Evidence, live: `grep -n '"gem-stamp"' scripts/nightshift.mjs` shows the
> mode, and the block under it writes `gem_sync_stamp.json` by tmp+rename exactly as claimed —
> `git grep -n "gem_sync_stamp"` returns **one writer only** (nightshift), so the ownership
> holds. `grep -n '"chrome-stamp"' scripts/scout.mjs` shows the second command; scout is the
> sole writer of `chrome_rail_stamp.json` and its own usage line names the four accepted
> rails, `gem-sync` among them (a missing argument prints
> `scout: chrome-stamp <fire|harvest|gem-sync|gist-patch>`; note it does not validate the
> string it is handed, so a typo stamps a rail that does not exist).
> **CORRECTED: "`physio.mjs` stays the reader" was true when written and is now a
> half-truth — there are TWO readers.** `captains_call.mjs` reads the same stamp and mints the
> B2 card off it ("EXAMINER Gem … sync nahi hua — abhi /gem-sync bol dein?") on physio's own
> 7-day bar — evidence: `git grep -n "gem_sync_stamp"` (hits `scripts/physio.mjs` AND
> `scripts/captains_call.mjs`), and `grep -n "gem.sync_due" scripts/captains_call.mjs` for the
> card + its retire-at-source. That is why the stamp matters twice over: skip it and physio
> keeps bleeding AND the card keeps coming back at the next anchor.
> One more thing the section never said: `gem-stamp` checks nothing — it writes `now()`
> unconditionally. It records that you SAY the sync succeeded, so only press it after you have
> actually seen Gemini's save confirmation (step 2's last sentence), never before.
> Last stamps are a live read, never a number in prose:
> `cat dressing-room/state/gem_sync_stamp.json` · `cat dressing-room/state/chrome_rail_stamp.json`
> (both are gitignored runtime state —
> `git check-ignore -v dressing-room/state/gem_sync_stamp.json dressing-room/state/chrome_rail_stamp.json`
> confirms it for both — so they exist only on his machine and may legitimately be absent on a
> fresh clone; absent ≠ broken, it reads as "never synced").
