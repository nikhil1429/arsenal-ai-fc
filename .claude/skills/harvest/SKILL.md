---
name: harvest
description: Harvest a Gemini study sitting onto the afferent bus with ZERO copy-paste tax — Claude reads the WHOLE conversation out of the captain's Chrome, parses his turns vs the Gem's, and hands them to the owner (harvest.mjs) which posts each through the thalamus door as modality "gemini" (his turns gemini-study, Gem turns gemini-study-teaching). Use when he says "harvest", "gemini le lo", "gem session le lo", "aaj ka gemini uthao", or right after a Gem sitting he wants remembered.
---

# /harvest — the Gemini sitting comes home

**THE LAW THIS RIDES (9 Aug 2026, his word: "make sure data flows everywhere wherever
it is required"):** the Gemini surface used to be the organism's blind eye — the watchman
printed that boundary every night. This lane closes it TO THE EXTENT HE HARVESTS. The
thalamus door has NO content dedup (measured at build: ingest appends before scoring;
habituation damps salience only) — dedup lives in the owner, so re-running /harvest on
the same sitting is always safe: old turns skip, new turns land.

> **(corrected 10 Aug 2026 — two precisions on the paragraph above. The LAW is untouched;
> both the no-dedup measurement and the "to the extent he harvests" hedge re-verified true
> today.)**
> **(a) WHERE the boundary prints.** This said *"the watchman printed that boundary every
> night"* — the line does not ride the nightly run. It lives in watchman's COVERAGE-HONESTY
> block, which only executes on `node scripts/watchman.mjs report`; the nightly path is
> `run`, and it prints no such line. Evidence: `grep -n "geminiLane" scripts/watchman.mjs`
> (the measure) and `grep -n 'cmd === "report"' scripts/watchman.mjs` (the dispatch —
> `report` is its own branch, separate from `run`).
> **(b) HOW MUCH is closed — READ IT LIVE, never from this file:**
> `node scripts/harvest.mjs status`. The watchman's block is remeasured on every print and
> swings between "NOT COVERED YET" (zero gemini-lane rows on the bus) and "COVERED AS
> HARVESTED" with the his/gem counts, so any tally written into prose here rots on the very
> next harvest. As of 10 Aug 2026 the live read is *"lane exists (since 9 Aug 2026), zero
> sittings harvested yet"* — the lane is BUILT and green (`node scripts/harvest.mjs
> selftest` → ALL CHECKS PASSED, 10 Aug 2026), but nothing has come home through it yet, so
> the watchman still prints the NOT-COVERED branch. Do not read the past tense of "used to
> be the blind eye" as "the eye now sees".
> **The no-content-dedup claim re-verified today, not re-copied:**
> `grep -n "D.appendAfferent" scripts/thalamus.mjs` sits ABOVE the `computeComponents`
> scoring call, and the habituation map charges after it — so the disk row is written
> unconditionally for a gemini afferent and only its SALIENCE is damped. (The door does hold
> two pre-append filters — the affect firewall and a vision static-frame gate — but neither
> is content dedup and neither can touch modality "gemini".)

1. Find his Gemini tab: use the **claude-in-chrome** tools (load via ToolSearch if
   deferred) — `tabs_context_mcp` → the `gemini.google.com` tab. No tab = stop and say
   so in one line ("Gemini tab khuli nahi hai — khol ke phir 'harvest' bol"). Do NOT
   create a tab; harvest reads a sitting that must already exist.
2. Read the WHOLE conversation, not the visible tail — Gemini virtualises long
   histories, so the top of a long sitting is not in the DOM until scrolled:
   `get_page_text` first; if the top of the conversation is missing, scroll the chat
   column up (`computer {action:"scroll", scroll_direction:"up", repeat:N}` inside the
   conversation area), expand any "Show more"/"Show thinking" folds found via `find`,
   re-read, repeat until the first turn is visible. Then take the final full read.
   > (NOT VERIFIED 10 Aug 2026 — *"Gemini virtualises long histories"* is a claim about a
   > third-party web UI, not about this repo; no file here can confirm or refute it. Treat
   > it as a claim, and let the read itself be the check: if the first turn is missing,
   > scroll. What IS verified: all four Chrome tools this step names really exist on the
   > **claude-in-chrome** MCP — `tabs_context_mcp` · `get_page_text` · `computer` · `find` —
   > so the mechanics hold whether or not the virtualisation reason still does. Note there
   > is also a second browser MCP whose tab tool is `tabs_context` with NO `_mcp` suffix;
   > this step means the claude-in-chrome one.)
3. Parse into turns, VERBATIM — his words vs the Gem's, in order:
   `{"conversation": "<the sitting's title>", "turns": [{"who": "him"|"gem", "text": "..."}]}`.
   Never paraphrase, never trim, never merge turns. Drop UI chrome (buttons,
   suggestions), keep every real word of both sides.
   > (verified 10 Aug 2026 against the owner's own validator, not against another doc —
   > `grep -n "export function validatePayload" scripts/harvest.mjs`. This shape is a HARD
   > CONTRACT, not a suggestion: a missing/blank `conversation`, a missing or empty
   > `turns[]`, or a `who` that is not exactly `him` or `gem` is REFUSED with a printed
   > reason and exit 1. Nothing partial gets posted.)
4. Save that JSON to a scratch file, then hand it to the owner:
   `node scripts/harvest.mjs ingest --file <path>` — the owner scrubs secrets, floors
   empties, dedups against its ledger AND the bus (roll-safe), posts each turn with its
   own event_key (burst law), and records delivery in harvest_log.jsonl.
   > (all five behaviours verified 10 Aug 2026 by reading `scripts/harvest.mjs`, and all
   > five hold. One precision worth having before you report a harvest: **"scrubs" DROPS
   > the turn whole — it does not redact it.** A turn matching the secret regex, or one
   > shorter than 3 characters, never reaches the bus AND never enters the ledger — the
   > `continue` fires before any append (`grep -n "skipped_scrub" scripts/harvest.mjs`).
   > Also: `--file` is optional — with no `--file` the owner reads the payload from stdin
   > (`grep -n "ya stdin pe JSON" scripts/harvest.mjs`). The scratch file remains the
   > preferred hand-off; put it in the OS temp dir, never in `scripts/`.)
5. Close with the owner's delta line only (≤3 lines): turns posted (his/gem split) ·
   dupes skipped · **turns scrubbed** · anything undelivered. If undelivered > 0, say the
   thalamus was down and that `node scripts/harvest.mjs resync` re-delivers — then run it
   once yourself.
   On a successful read, press the rail stamp (LADDER E7):
   `node scripts/scout.mjs chrome-stamp harvest`.
   > (corrected 10 Aug 2026: this enumerated THREE fields — posted · dupes · undelivered —
   > but the owner's one-liner prints FIVE, and the one this list dropped is `N scrubbed`.
   > That omission would have caused a wrong close: on a 14-turn sitting where 2 turns
   > carried a secret, reporting "12 posted · 0 dupes · 0 undelivered" reads as a complete
   > harvest while two of his turns were silently refused. Evidence — the exact print:
   > `grep -n "already on the bus" scripts/harvest.mjs` →
   > `posted (his · gem) · already on the bus · scrubbed · undelivered`.)
   > (verified 10 Aug 2026: `resync` is real and re-posts ONLY rows that no later row
   > settled, so it can never double-deliver — `grep -n "export async function resync"
   > scripts/harvest.mjs`. "The thalamus was down" is literal, not a metaphor: the owner
   > POSTs to `http://127.0.0.1:4113/afferent` behind a 400 ms abort, so a daemon that is
   > not listening yields `posted:false` ledger rows and nothing lost —
   > `grep -n "ARSENAL_THALAMUS\|POST_TIMEOUT_MS" scripts/harvest.mjs`.)
   > (verified 10 Aug 2026: the stamp subcommand exists and `harvest` is one of its four
   > accepted rails, alongside fire · gem-sync · gist-patch; it is the sole writer of
   > `chrome_rail_stamp.json`, and physio bleeds a `chrome_rail_stale` line when the newest
   > stamp goes a week cold — `grep -n "chrome-stamp" scripts/scout.mjs`,
   > `grep -n "chrome_rail_stale" scripts/physio.mjs`. "LADDER E7" is the code's own name
   > for this rail, carried in the comment directly above the subcommand — not a label this
   > file invented.)
6. Chrome tools not connected? Fall back honestly: ask him to paste the conversation
   once, run the same parse → owner hand-off, and say this is the taxed path —
   reconnect Chrome next time.

## NEVER
- Never type, send, or click anything INSIDE his Gemini conversation — harvest READS
  (his conversation is his; the only clicks allowed are scroll/expand).
- Never touch login/passwords — not signed in = stop and tell him.
- Never append to afferent.jsonl or harvest_log.jsonl by hand (thalamus owns the bus,
  harvest.mjs owns its ledger — the doors are `ingest` and `resync`, nothing else).
  > (corrected 10 Aug 2026: this read *"the door is `ingest`, nothing else"*, which
  > contradicted step 5 of this same file — step 5 tells you to run `resync`, and a strict
  > reading of this NEVER made that an unlawful write. `resync` is a SECOND lawful path
  > through the SAME owner: it re-POSTs unacked rows and appends its own ledger rows
  > (`grep -n "appendFileSync" scripts/harvest.mjs` shows both call sites, in `ingestTurns`
  > and in `resync`). Both go through the owner; neither is a hand-edit.
  > **The ownership itself was re-verified today and it HOLDS, both halves:**
  > `grep -rn "harvest_log" scripts/` returns exactly one writer — harvest.mjs — and
  > `grep -rn "appendAfferent" scripts/` returns exactly one appender of afferent.jsonl —
  > thalamus.mjs. Every other organ that names afferent.jsonl (brain · distiller ·
  > hippocampus · dugout · nightshift · limits · context) only READS it; `context.mjs` says
  > so in its own comment. The bus's door is the HTTP POST `/afferent`, never a file write —
  > even `hooks/afferent-post.mjs` goes through it (`grep -n "/afferent" hooks/afferent-post.mjs`).)
- Never paraphrase a turn — the bus carries his words or nothing.
- Never post the same sitting twice on purpose — the owner dedups, but the skill does
  not lean on it as a habit.
- Never harvest a conversation that is not his study sitting (FinOps or personal chats
  stay out unless he names them).
