# ⚪🔴 LAUNCH RUNBOOK — Arsenal AI FC

> ⚠ **FROZEN AS A 15 JUL 2026 SNAPSHOT — audit #108, 6 Aug 2026.** Everything below this line, the
> status line included, is **as-written on 15 Jul** and is a historical record, not live truth. It was
> read as live for three weeks. Two things were wrong by 6 Aug:
>
> 1. **Every count in the Jules task text (§THE THREE BROWSER-HALF TASKS #1) is now low.**
>    <!-- audit #108 review, 6 Aug 2026: this sentence originally read "are all 30–50% low". That
>         span was DERIVED, and it was wrong at both ends — recomputed against the live figures on
>         the next line, the four gaps are 33.8% · 37.1% · 8.3% · 15.6%, so nothing reaches 50% and
>         two of the four are nowhere near 30%. A summary percentage nobody measured is exactly the
>         guessed number the standing rule forbids, and it is redundant besides: the real counts sit
>         one line below it. Removed rather than re-derived — the absolutes are the evidence. -->
>    Measured live on 2026-08-06: **65** scripts (not 43) · **62** selftest suite members, all green
>    (not 39) · **12** skills (not 11) · **45** scheduled tasks, 14 of them Disabled (not 38).
>    Only "24 dugout tools" survived unchanged. Never quote a count out of this file — run the command:
>    · scripts — `(Get-ChildItem scripts\*.mjs).Count`
>    · selftest suites — `npm run test:suites` (prints every member and the total; `npm test` runs them)
>    · skills — `(Get-ChildItem .claude\skills -Directory).Count`
>    · scheduled tasks — `Get-ScheduledTask -TaskName ArsenalFC-* | Select TaskName,State`
>    The Jules task itself is spent — OPS_STATE records both PRs merged 15 Jul — so the quote stays
>    verbatim as the record of what Jules was told, not as a number anyone should reuse.
> 2. **DEMO step 5 is cold and will embarrass you in front of a guest** — see the flag on that row.

**Status: LAUNCHED (verified A-to-Z, 15 Jul 2026 · zero RED).** The loop is built. The only thing left is your reps.

**The shareable scorecard (pull this up for Nidhi):** https://claude.ai/code/artifact/689780b7-839a-48ec-a31a-f104d10f621e
*(private to you — share it from the page's share menu)*

---

## THE NIDHI DEMO — open the Dugout, then just talk

**Setup:** double-click **MATCHDAY (THE DUGOUT)** (or `npm run dugout` → open http://localhost:4114). Press **START**, allow the mic. Everything below is spoken.

| # | Say | Watch |
|---|-----|-------|
| 1 | "Good morning" / "kya haal hai aaj ka" | Greets in Hinglish, reads today's **AMBER** verdict + the ONE thing — reclaim one overdue card, don't open new ground. |
| 2 | **"Walk me through the whole organism"** / "samjhao poora system" | A structured **~10-min lecture** — brain → gate → tanks → night shift → memory → both layers → laws → M14+. Every number real, zero hype. *(This is the new `get_organism` briefing — the one call that explains the entire product.)* |
| 3 | (Hinglish) "speculative decoding ka matlab kya hota hai…" | Fast brain answers instantly; behind it the thalamus **wakes Claude Opus** and the deep answer folds back — one voice, two brains. Works in Devanagari too. |
| 4 | "kya due hai?" → "open the embeddings book" | `get_rejirah` names the 3 overdue cards; `get_capsule` returns **your own words** and real doubts — builds on what you fought through. |
| 5 | "team sheet dikhao" | Today's **real-Opus** sheet — AMBER ceiling, one thing, the floor. Zero invented numbers; the Manager only proposes. **6 Aug 2026 — RESOLVED, and here is the standing check.** For four days this row would have shown a guest the 2026-08-01 sheet (Matchday 1, opening *"I don't know you yet"*, SQUAD REPORTS "instruments dark"): `formation_read` was gated to `window:"morning"` (07:30–12:00) and this laptop sleeps through it, so the sheet built on 1 of 9 days. The gate is now `window:"any"` (audit #108) and today's sheet is live. **Before any demo, still glance at the sheet's own date line** — a sheet is only ever as fresh as the last day the machine was awake, and `node scripts/physio.mjs` now raises a bleed when it goes stale (it could not see this file at all before #108). |
| 6 | "sab kuch batao" → "prove it, run the code" | `get_club_report` = the whole day's state; `run_python` executes live in a real sandbox — "don't trust me, watch it run." |

**The soul (say in your own words):** no shame, no streaks, no hype, win-only voicing, a hard medical boundary, **$0 marginal cost / zero API keys** — enforced in code. The moat isn't the agents; it's knowing what to refuse.

**The honest close:** the learning scouts are quiet by design until fed — Calibration & Nemesis at 20 reps, Learning-State at 12, the Twin's book at 30. Zero reps today isn't broken; it's the machine built and waiting.

---

## THE THREE BROWSER-HALF TASKS (your logins — machine halves are done)

These need your logged-in browser (a machine may never hold your passwords). Each has its ready-to-run artifact already generated:

1. **Jules on the repo** — both Pro accounts are enrolled. First task to hand it (paste into Jules, public repo `nikhil1429/arsenal-ai-fc`):
   > *"ORGANISM_ANATOMY.md and ORGANISM_LEDGER.md are stale — they describe 16 organs / 26 suites / 7 skills. Reality (verify from package.json + scripts/ + .claude/skills/): 43 scripts, 39 selftest suites, 24 dugout tools, 11 skills, 38 scheduled tasks, plus the whole cyborg-brain layer (thalamus, cortex, hippocampus, dmn, council, nightshift, fuelboard, examiner, tone, presence, groundsman, awayday, turnstile). Add a dated 'THE CYBORG-BRAIN LAYER' section listing each with its green selftest, and correct the skill/task/tool/script counts. Open a PR — do not touch any gitignored personal state."*

2. **The phone Voice-Gaffer Gem** — the cartridge is staged at `dressing-room/state/brain_out/nightshift/gem_cartridge.md`. Run `/gem-sync` and I'll Chrome-drive the paste with you watching (when the browser extension is reconnected).

3. **The Gemini-Pro Deep-Research surface** — tonight's ready-to-paste prompt is at `dressing-room/state/brain_out/nightshift/scout_pack.md`. Open it, paste into your Pro account's Deep Research, then throw-in / paste-session the result back — the doubtminer takes it from there.

*(Note on the Pro lane: there is **no** AI-Studio↔AI-Pro API unlock — a Pro subscription doesn't grant a Pro API tier. The code already knew this and degrades every Pro call to free Flash; M18's season-read runs fine on Flash. The Pro accounts' value is Jules + these human surfaces, not an API.)*

---

## DAILY OPERATION (the whole loop, once you're using it)

Morning push (~08:45) → open the Dugout, "good morning" → **study and paste every session** (`/forge <concept>` or `/paste-session`) → throw stray thoughts from the phone → evening bell (21:30) → 30-second `/full-time` → sleep while the night shift sharpens tomorrow. That's it. You study, you ship, you speak. **COYG.** ⚪🔴
