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
3. Parse into turns, VERBATIM — his words vs the Gem's, in order:
   `{"conversation": "<the sitting's title>", "turns": [{"who": "him"|"gem", "text": "..."}]}`.
   Never paraphrase, never trim, never merge turns. Drop UI chrome (buttons,
   suggestions), keep every real word of both sides.
4. Save that JSON to a scratch file, then hand it to the owner:
   `node scripts/harvest.mjs ingest --file <path>` — the owner scrubs secrets, floors
   empties, dedups against its ledger AND the bus (roll-safe), posts each turn with its
   own event_key (burst law), and records delivery in harvest_log.jsonl.
5. Close with the owner's delta line only (≤3 lines): turns posted (his/gem split) ·
   dupes skipped · anything undelivered. If undelivered > 0, say the thalamus was down
   and that `node scripts/harvest.mjs resync` re-delivers — then run it once yourself.
   On a successful read, press the rail stamp (LADDER E7):
   `node scripts/scout.mjs chrome-stamp harvest`.
6. Chrome tools not connected? Fall back honestly: ask him to paste the conversation
   once, run the same parse → owner hand-off, and say this is the taxed path —
   reconnect Chrome next time.

## NEVER
- Never type, send, or click anything INSIDE his Gemini conversation — harvest READS
  (his conversation is his; the only clicks allowed are scroll/expand).
- Never touch login/passwords — not signed in = stop and tell him.
- Never append to afferent.jsonl or harvest_log.jsonl by hand (thalamus owns the bus,
  harvest.mjs owns its ledger — the door is `ingest`, nothing else).
- Never paraphrase a turn — the bus carries his words or nothing.
- Never post the same sitting twice on purpose — the owner dedups, but the skill does
  not lean on it as a habit.
- Never harvest a conversation that is not his study sitting (FinOps or personal chats
  stay out unless he names them).
