---
name: gist-patch
description: Walk a closed Re-Jirah round's reJirahDone patch into the capsule gist with ZERO copy-paste tax — Claude drives the captain's Chrome to the gist edit page and pre-fills the one-line patch, HIS Save click stays the only master write, then mirror.mjs re-fetches so PENDING clears in the same sitting. Use when he answers haan on a rejirah pending card, or says "patch paste", "gist patch", "rejirah paste", "round gist mein daal do".
---

# /gist-patch — the round comes home to the gist (LADDER C1, 9 Aug 2026)

> *(date + ladder checked 10 Aug 2026 and HELD: this file entered git on **2026-08-09** in
> `873ac95` — "LADDER C: the rails around his two clicks — /gist-patch is born"
> (`git log --diff-filter=A --format="%ad %h" --date=short -- .claude/skills/gist-patch/SKILL.md`).
> The **"C1" sub-number is NOT VERIFIED** — LADDER C's numbered breakdown lives outside the repo,
> so nothing here can confirm this is item 1 of C. Treat "C1" as a label, "LADDER C, 9 Aug 2026"
> as the evidenced part.)*

**THE LAW THIS RIDES:** the gist is the MASTER and only HIS manual writes touch it
(`mirror.mjs` header; `FORGE_SPEC.md` §2 2b — `reJirahDone` is *his paste*). Five
organs (fsrs · deep · capsule_bridge · dugout · shipped) ignore a closed round
until the mirror brings it back, so an un-pasted round is a round that never
happened. This skill moves every finger-movement onto the machine and leaves him
exactly ONE human moment: the Save click. That click IS the master write.

> *(verified 10 Aug 2026 — all three claims above HELD against the code, so nothing
> here was changed: `grep -n "one-way afferent nerve" scripts/mirror.mjs` (the mirror
> never writes back), `grep -n "Existing capsule edit" learning-layer/FORGE_SPEC.md` (step 2b:
> Claude gives ONE updated file, *"Nikhil us file ko replace"* — his hand, his paste), and
> `grep -n "all five believe the round never happened" scripts/rejirah.mjs`
> — the owner's own header names exactly those five organs and no others. ONE precision
> added: a SIXTH reader of `reJirahDone` exists — `captains_call.mjs` mirrors the same
> landed-predicate to deal the very card that triggers this skill, and retires it when the
> paste lands (`grep -n "the paste landed — the mirror carries it" scripts/captains_call.mjs`).
> It is not in the five because its model of the round is not wrong while the paste is
> out — it is the organ that NAGS about it. Do not read "five" as "five files mention
> the field"; `grep -rn "reJirahDone" scripts/` returns more, most of them selftest
> fixtures.)*

## THE WALK

1. `node scripts/rejirah.mjs pending` — read the oldest pending round: concept,
   round, due date, and the exact one-line patch it prints
   (`  "reJirahDone": [...],`). Nothing pending = say so in one line, stop.

   > *(corrected 10 Aug 2026 — TWO precisions, both able to cause a broken paste.
   > **(a) `pending` does NOT print the patch byte-exact.** It prints it TRIMMED and
   > PREFIXED with the filename: the print is `→ ${p.concept}.json:${patch.json.trim()}`
   > (`grep -n 'json.trim()' scripts/rejirah.mjs`), so what appears on screen reads
   > `→ embeddings.json:"reJirahDone": [...],`. Pasting that line as-shown puts
   > `embeddings.json:` INSIDE the JSON and breaks the capsule. Strip the `→ <id>.json:`
   > prefix. The BYTE-EXACT line — two leading spaces, trailing comma — is what
   > `gistPatch()` builds (`grep -n 'field: "reJirahDone"' scripts/rejirah.mjs`) and what
   > `close` prints raw on its own line (`grep -n "replace ONE line, nothing else" scripts/rejirah.mjs`).
   > **(b) "Nothing pending" has TWO different screens, and only one is an all-clear.**
   > When no round has EVER been closed, `pending` prints "PENDING NOT MEASURED — 0 pending,
   > and 0 here is not a measurement" and refuses the clean-sheet line
   > (`grep -n "PENDING NOT MEASURED" scripts/rejirah.mjs`). Run live on 10 Aug 2026 it
   > printed exactly that: `rejirah_log.jsonl` does not exist, 0 rounds ever closed, on 4
   > locked capsules. Say WHICH zero it is — un-run is not the same as landed.)*
2. Drive HIS Chrome (claude-in-chrome MCP, same rail as /fire and /gem-sync):
   navigate to the gist edit page —
   `https://gist.github.com/nikhil1429/ce50c28d585c2fcd915a9dbf61871a56/edit`
   (the gist id is mirror.mjs's own configured base, mirror.mjs:72).

   > *(corrected 10 Aug 2026: the id is right and unchanged, but the citation pointed at the
   > wrong home. **`mirror.mjs:72` is the DEFAULTS fallback, not the configured base** —
   > `loadConfig()` prefers `dressing-room/state/mirror_config.json` and only falls back to
   > the hardcoded block, stamping `config_source` either way
   > (`grep -n "config_source" scripts/mirror.mjs`). Both carry the SAME id today
   > (`ce50c28d585c2fcd915a9dbf61871a56` — verified in `dressing-room/state/mirror_config.json`
   > and in `grep -n "gist.githubusercontent.com/nikhil1429" scripts/mirror.mjs`), so the URL
   > above is correct; read it live rather than trusting this line:
   > `grep -n '"base"' dressing-room/state/mirror_config.json`. The `/edit` URL itself is a
   > GitHub convention (host swapped from `gist.githubusercontent.com`, `/raw/` dropped) —
   > it is stored NOWHERE in the repo, and mirror.mjs only ever derives the ID from the base
   > (`grep -n "gistIdFromBase" scripts/mirror.mjs`). The rail claim HELD: /fire and /gem-sync
   > both drive the same claude-in-chrome MCP — `grep -n "claude-in-chrome" .claude/skills/fire/SKILL.md .claude/skills/gem-sync/SKILL.md`.)*
3. Find the `<concept>.json` file's editor block on the page. Locate the
   existing `"reJirahDone"` line — or, if the capsule has none yet, the spot
   just before the closing `}`. Pre-fill the EXACT patch line rejirah printed
   (never reworded, never reformatted — the owner's line or nothing).

   > *(corrected 10 Aug 2026 — the "just before the closing `}`" branch WRITES INVALID JSON.
   > The patch line ends in a TRAILING COMMA by construction — `` json: `  "reJirahDone": ${JSON.stringify(merged)},` ``
   > (`grep -n 'field: "reJirahDone"' scripts/rejirah.mjs`), and the owner's own selftest pins
   > that comma inside a regex (`grep -n "paste-ready JSON line" scripts/rejirah.mjs`). Dropped immediately before
   > the closing `}` it produces `…],\n}` — a trailing comma, which JSON.parse rejects, so the
   > next `mirror.mjs` pull would refuse the capsule. The line is built to REPLACE a line that
   > sits MID-OBJECT. Two things make that branch near-hypothetical anyway, measured on the live
   > mirror today: **all four locked capsules already carry `reJirahDone`**, and in none of them
   > is it the last key (`node -e "const o=require('./dressing-room/state/capsules/tokenization.json');console.log('reJirahDone' in o, Object.keys(o).pop())"`
   > → `true deep`; same for embeddings · inference · context). If a future capsule truly lacks
   > the field, insert it mid-object — never as the last line — or drop the trailing comma by hand
   > and add one to the line above. Also note the patch is the WHOLE array, sorted + de-duplicated,
   > not an append (`grep -n "The patch is the WHOLE" scripts/rejirah.mjs`) — replacing the old
   > line loses nothing.)*
4. **DO NOT click "Update public gist" / Save.** Say: *"<concept> R<round> ka
   patch bhara hua hai — Save dabao."* HIS CLICK is the write.
5. After his click: run `node scripts/mirror.mjs` (re-fetch the gist), then
   `node scripts/rejirah.mjs pending` — the round must have LEFT the pending
   list. Press the rail stamp too (LADDER E7):
   `node scripts/scout.mjs chrome-stamp gist-patch`. Report the delta in one line ("R1 landed — 5 organs ab round dekhte
   hain"). Still pending after the mirror run = say so honestly (the Save may
   not have landed) and stop; never mark anything done by assumption.

   > *(verified 10 Aug 2026, all three commands live: bare `node scripts/mirror.mjs` DOES
   > re-fetch — its CLI defaults to `run` and only `selftest` branches away
   > (`grep -n 'process.argv\[2\] || "run"' scripts/mirror.mjs`). `chrome-stamp gist-patch`
   > is a real, spelled-out rail — running `node scripts/scout.mjs chrome-stamp` with no
   > argument prints `scout: chrome-stamp <fire|harvest|gem-sync|gist-patch>`
   > (`grep -n "chrome-stamp <fire" scripts/scout.mjs`); scout.mjs is the sole writer of
   > `chrome_rail_stamp.json` and physio bleeds when the newest stamp goes stale
   > (`grep -n "THE CHROME-RAIL STAMP" scripts/scout.mjs`). The card that sent you here
   > retires itself on the next captains_call sync once the mirror carries the date — you
   > do not close it by hand.)*
6. Chrome tools not connected? Fall back honestly: print the patch line for ONE
   manual paste, name the taxed path, and still run mirror.mjs after he says done.

   > *(added 10 Aug 2026 — the step was silent on the stamp, and silence here writes a lie
   > into state. **On this fallback path, do NOT press `chrome-stamp gist-patch`.** The stamp's
   > only meaning is "the Chrome drive SUCCEEDED" — its owner writes it "after a successful
   > drive", and physio reads a fresh stamp as proof the rail is alive
   > (`grep -n "after a successful drive" scripts/scout.mjs`). Stamping a walk where Chrome
   > never drove hides a dead extension or a lost login for exactly as long as the stamp stays
   > fresh. /fire carries the same clarification for its own fallback leg
   > (`grep -n "do not press" .claude/skills/fire/SKILL.md`). Everything else in step 5 still
   > runs: mirror.mjs, then `pending`, then the honest delta.)*

## NEVER
- Never click Save/Update yourself — his click is the only master write.
- Never edit any capsule field other than the `reJirahDone` line this patch names
  (capsule prose is SACRED — `FORGE_SPEC.md` locked fields).
- Never write to `dressing-room/state/capsules/` by hand — that mirror belongs to
  mirror.mjs alone.
- Never batch two rounds into one walk — serial, like every captain's-word lane.

> *(all four NEVERs re-verified 10 Aug 2026 — none needed correcting. Anchors, so the next
> session need not re-derive them: the SACRED field list is
> `grep -n "AUTHORED-PROSE" learning-layer/FORGE_SPEC.md` and the immutability rule is
> `grep -n "Locked capsule files = IMMUTABLE" learning-layer/FORGE_SPEC.md` (which also says
> IMMUTABLE means never RE-EMIT, and that exactly two edits are legitimate and both are HIS:
> `reJirahDone` on a round-close, and a doubt back-write — this skill only ever touches the
> first). Mirror ownership: `grep -n "Single writer of capsules" scripts/mirror.mjs`. Note
> mirror.mjs also snapshots each pull to `capsule_backups/<date>/`
> (`grep -n "THE GIST-MASTER" scripts/mirror.mjs`) — that lane is its own too; do not hand-write
> there either.*
>
> *TWO precisions on "never batch". **(a) Across walks it is enforced upstream, not just by
> discipline** — the card is minted one at a time, oldest close first, and the next one only
> takes the seat once the previous paste lands
> (`grep -n "B1 — a Re-Jirah round closed but not in the gist" scripts/captains_call.mjs`).
> **(b) Within ONE concept the patch line legitimately carries more than one date, and that is
> not batching** — `pending` passes every pending due of that same concept into one
> `gistPatch()` call (`grep -n "pend.filter((x) => x.concept" scripts/rejirah.mjs`), because
> the field is a whole array replaced in one line. Two pending rounds of the SAME capsule =
> one line, one paste. Two DIFFERENT capsules = two walks.)*
