> **DEFERRED 18 Aug 2026 ~20:05 IST by his word — *"freeze will be implemented when the entire cyborg organism is working fine not before that"*.**
> Moved here from the root the same evening (MODELS + ACTS work order, Block 0). The guard (`scripts/freeze.mjs`, `hooks/commit-msg`)
> stays installed and DORMANT — it arms only when `FREEZE.md` exists at the root again (`node scripts/freeze.mjs status`).
> Below is the page as it stood while the freeze was in force (Block 8 → Block 0 of MODELS + ACTS, ~2 h). A record, not a work order.

# ❄ FREEZE — the organism is frozen (18 Aug 2026, OVERHAUL Block 8)

> His words, 18 Aug 2026: *"i want to use it from now to study and not fix it. i am tired of wasting my time in fixing it."*
> Blocks 0–7 rebuilt the body (`docs/archive/ORGANISM_OVERHAUL__2026-08-18.md`, BUILD LOG at its top). From the
> commit that landed this file, the organism is **FROZEN**. This page is ≤ 1 page on purpose; every claim below is a command.

## The rule (one sentence)
**No new organ, no constitution paragraph, no schedule change without a card he answered — changes ride cards.**

## What that means, mechanically (a law is a code path — L4)
| | Frozen | Verify |
|---|---|---|
| **Organs** | no new `scripts/*.mjs`, no edit to a tracked one, without a card | `node scripts/freeze.mjs status` |
| **Hooks** | `hooks/` (the archive tripwire, this guard, the afferent hook) | same |
| **Schedule** | `setup/` (installers, launchers, the hidden-task cloak; the 55 rows in `node scripts/herd.mjs slots`) | same |
| **Constitution** | the Gaffer's system instruction — `buildSystemInstruction()` in `scripts/dugout.mjs` (≤ 2,000 tokens, asserted in its selftest) — no new paragraph | `node scripts/dugout.mjs selftest` |

**The guard** — `hooks/commit-msg` → `node scripts/freeze.mjs guard <msgfile>`: a commit that stages a tracked file under
`scripts/` · `hooks/` · `setup/` is **refused** unless its message carries a **card id** (`c<n>` — the card he answered;
`node scripts/captains_call.mjs status` lists them) or the literal **`freeze-exempt:<why>`** (a reason is the price).
It is a **guard, not a gate**: `git commit --no-verify` skips every hook and nothing here pretends otherwise — which is
why there is a second layer: **the watch** — `watchman.mjs` reads `freeze.mjs status` nightly and names every commit since
the freeze that touched a guarded path without a card or an exemption as **RED `freeze-broken`**, sha by sha.
Proof it works: `node scripts/freeze.mjs selftest` (a throwaway repo — the planted commit is refused, the carded one passes).

## What is NOT frozen (deliberately)
- **State** (`dressing-room/`) — it moves every minute; owners-only law unchanged (`node scripts/xray.mjs report`).
- **Canon and docs** — root `*.md`, `docs/`, `learning-layer/`, `.claude/skills/` — a correction is not an organ.
- **The gate's own decisions** — lanes sleep and wake by evidence (`node scripts/brain.mjs gate show`); his one-window override
  `gate wake <lane>` is his, always.
- **Fixes he asks for** — they ride the card he answered (`c<n>` in the commit) or, when he says it out loud in a sitting,
  `freeze-exempt:<his words in three words>`.

## How a change happens now
1. Something wants building → the organism deals **ONE card** at an anchor he already hits (`captains_call.mjs`); it never asks twice.
2. He answers **haan** on card `c<n>` → the commit carries `c<n>` → the guard passes, the watch stays green.
3. He says nothing → the card's stated default applies; nothing is built.
4. **Block 9 (SEVEN REAL DAYS)** measures and does not build; its commits are `freeze-exempt:block-9-measure`. **25 Aug 2026:** the §19
   after-the-freeze brainstorm he asked for — brainstorm only; freeze means cards, not builds.

*Frozen since:* `git log --diff-filter=A --format="%h %ad" --date=short -- FREEZE.md`
