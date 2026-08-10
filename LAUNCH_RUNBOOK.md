# ⚪🔴 LAUNCH RUNBOOK — Arsenal AI FC

> ⚠ **FROZEN AS A 15 JUL 2026 SNAPSHOT — audit #108, 6 Aug 2026.** Everything below this line, the
> status line included, is **as-written on 15 Jul** and is a historical record, not live truth. It was
> read as live for three weeks. Two things were wrong by 6 Aug: <!-- the count "two" is correct AS OF
> 6 AUG and is left alone. Item 3 below is dated 10 Aug 2026 and is not part of that count. -->
>
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
>    Only "24 dugout tools" survived unchanged.
>    <!-- corrected 10 Aug 2026: every figure on the two lines above has itself rotted in FOUR DAYS —
>         which is exactly the failure this block was written to stop, repeated by the block itself.
>         Re-measured today with the very commands listed below: **75** scripts
>         (`(Get-ChildItem scripts\*.mjs).Count` → 75, and `git ls-files "scripts/*.mjs"` → 75 too, so
>         nothing untracked is padding the number) · **73** selftest suite members
>         (`npm run test:suites`) · **15** skills (`(Get-ChildItem .claude\skills -Directory).Count`) ·
>         **50** scheduled tasks, **23** of them Disabled. And "24 dugout tools survived unchanged" is
>         false as of today: dugout.mjs's TOOL_DECLS array holds **28** — get_context + recall_memory
>         arrived with LADDER F1 and get_diary + get_model with PHASE H, each carrying its own dated
>         comment in the source — run them as three separate literal searches, not one alternation
>         (`\|` is GNU-grep-only and ripgrep reads it as a literal pipe): `grep -n "LADDER F1"
>         scripts/dugout.mjs` · `grep -n "PHASE H · H6" scripts/dugout.mjs` · `grep -n "PHASE H · H3"
>         scripts/dugout.mjs`.
>         The 6-Aug figures stay on the record above BECAUSE they are dated — a dated measurement is a
>         readable historical fact; an undated one is a lie waiting. Today's figures are deliberately
>         NOT promoted into the prose above: the commands are the answer, and they will still be right
>         in October. -->
>    Never quote a count out of this file — run the command:
>    · scripts — `(Get-ChildItem scripts\*.mjs).Count`
>    · selftest suites — `npm run test:suites` (RUNS every member independently, prints ok/FAIL per
>      member and asserts on the total; `npm test` runs that same suites pass PLUS five more modes)
>      <!-- corrected 10 Aug 2026: this read "prints every member and the total; `npm test` runs them",
>           which reads as list-versus-run and is backwards — `test:suites` already runs them. Evidence:
>           `grep -n "every member run INDEPENDENTLY" scripts/organism_test.mjs` (the suites() section
>           header), and the loop right under it spawns each member with `selftest`. `npm test` =
>           `organism_test.mjs all`, and `all` is every key of MODES — coverage · integrity · laws ·
>           hermetic · path · suites (`grep -n "const MODES" scripts/organism_test.mjs`). So the
>           difference is BREADTH of modes, not run-vs-print. -->
>    · skills — `(Get-ChildItem .claude\skills -Directory).Count`
>    · dugout tools — `(Select-String -Path scripts\dugout.mjs -Pattern '^  \{ name: "').Count`
>      <!-- added 10 Aug 2026: the one count in this block that had no command beside it is the one
>           that then rotted silently from 24 to 28. Every count gets a command or it does not get
>           written. -->
>    · scheduled tasks — `Get-ScheduledTask -TaskName ArsenalFC-* | Select TaskName,State`
>    The Jules task itself is spent — OPS_STATE records both PRs merged 15 Jul — so the quote stays
>    verbatim as the record of what Jules was told, not as a number anyone should reuse.
> 2. **DEMO step 5 is cold and will embarrass you in front of a guest** — see the flag on that row.
>    <!-- corrected 10 Aug 2026: this bullet and the row it points to have contradicted each other
>         since the hour they were written — the row says "6 Aug 2026 — RESOLVED" and this says the
>         step is cold, both dated 6 Aug. The COLDNESS (the `formation_read` gate) was fixed that same
>         day and is verified fixed today: `"window": "any"` in brain_config.json, and team_sheet.md
>         was rewritten this morning at 08:45. So do not read this bullet as "the sheet is frozen".
>         What survives is narrower and still worth the warning: a fresh sheet is not automatically a
>         RICH sheet — today's 10-Aug sheet still opens "Matchday 1 · Introduction" and "I don't know
>         you yet", and carries no body verdict at all. The corrected detail sits on row 5. -->
>
> 3. **(added 10 Aug 2026) The freeze itself is not a licence to stop checking.** This header was
>    written to stop a 15-Jul snapshot being read as live, and then its own 6-Aug replacement counts
>    were read as live for four days. A frozen document still needs its claims dated and its numbers
>    replaced by commands — which is what the 10-Aug annotations throughout this file do. Nothing was
>    deleted; the historical text stays exactly as written, with today's evidence beside it.

**Status: LAUNCHED (verified A-to-Z, 15 Jul 2026 · zero RED).** The loop is built. The only thing left is your reps.

<!-- corrected 10 Aug 2026: "zero RED" is a 15-JUL measurement and must not be read as today's. A run
     of `npm run test:suites` on 10 Aug 2026 reported **one red member — `dugout`** (its own selftest
     exited non-zero on the #92 get_capsule-description checks) out of 73. That file was under active
     edit in a concurrent session at the time, so this is NOT asserted as a standing defect — it is
     asserted as: THE RED/GREEN STATE OF THIS REPO IS NOT KNOWABLE FROM THIS LINE. Run `npm test`
     yourself before you say "zero RED" to anyone, and read the count from the run, not from here.
     The "only thing left is your reps" half has also moved on — see the honest-close correction at
     the bottom of THE NIDHI DEMO: three of the four scout gates opened once the reps arrived. -->

**The shareable scorecard (pull this up for Nidhi):** https://claude.ai/code/artifact/689780b7-839a-48ec-a31a-f104d10f621e
*(the URL sits in a PUBLIC repo — anyone with it can request the page; treat it as
shareable-by-link, not private. Wording fixed 9 Aug 2026; his ruling accepts public data.)*
<!-- NOT VERIFIED 10 Aug 2026 — this artifact URL was not opened from this pass (it is an external
     claude.ai page, not repo state, so no file or command in here can confirm it still resolves or
     still shows the 15-Jul scorecard). Treat it as a claim; load it once yourself before a demo. -->


---

## THE NIDHI DEMO — open the Dugout, then just talk

**Setup:** double-click **MATCHDAY (THE DUGOUT)** (or `npm run dugout` → open http://localhost:4114). Press **START**, allow the mic. Everything below is spoken.

<!-- corrected 10 Aug 2026 — the two routes above are NOT equivalent, and the fallback is the unsafe
     one. The launcher is `setup/launchers/ARSENAL 1 - MATCHDAY - THE DUGOUT.cmd`, and all it does is
     call `setup/open_dugout.ps1`, whose whole job is to KILL a stale bridge on :4114 FIRST so the
     icon always serves current code — its own comment says the direct `node scripts\dugout.mjs` route
     "stood down on EADDRINUSE and silently left OLD code serving (audit fix 15)". That is still true
     of `npm run dugout` today: package.json's `dugout` script is exactly `node scripts/dugout.mjs`,
     and dugout.mjs's server error handler prints "bridge already live … opening it", opens the page
     and `process.exit(0)`s — evidence: `grep -n "bridge already live" scripts/dugout.mjs`. So after
     ANY code change, `npm run dugout` will happily demo the previous build. Use the launcher.
     Port 4114 confirmed: `grep -n "const PORT = 4114" scripts/dugout.mjs` ("the captain's number").
     Also verified today, because the demo silently depends on it: :4112 (cortex), :4113 (thalamus)
     and :4114 were all listening, even though the ArsenalFC-Thalamus and ArsenalFC-Cortex scheduled
     tasks both read Disabled — ArsenalFC-Daemon-Watchdog (Ready) relaunches them by port
     (`grep -n "port: 4113" scripts/daemon_watchdog.mjs`), and the Dugout itself spawns them on boot
     if the thalamus does not answer (`grep -n "the Dugout boots the brain" scripts/dugout.mjs`).
     Disabled tasks there are not a broken demo. -->


| # | Say | Watch |
|---|-----|-------|
| 1 | "Good morning" / "kya haal hai aaj ka" | Greets in Hinglish, reads today's ~~**AMBER**~~ verdict + the ONE thing — ~~reclaim one overdue card, don't open new ground~~. **Corrected 10 Aug 2026 — both struck words were 15-Jul literals and neither is today's:** `readiness.json` does hold `verdict: "AMBER"`, but for `day: "2026-08-04"`, six days stale, and today's team sheet says in its own words *"No verdict from the ring today"* plus a bleed line *"readiness is writing on time but saying nothing new — its content is 126h old"* (ArsenalFC-Goalkeeper reads **Disabled** in `Get-ScheduledTask -TaskName ArsenalFC-*`). The ONE thing is likewise whatever the Manager wrote this morning — today it is *"Close the loop between Embedding and Cosine Similarity"*, nothing about overdue cards. **Never rehearse a colour or a one-thing out of this file.** Read them live before the guest arrives: `Get-Content dressing-room\state\team_sheet.md -TotalCount 8` and `node -e "console.log(JSON.parse(require('fs').readFileSync('dressing-room/state/readiness.json','utf8')).day)"`. |
| 2 | **"Walk me through the whole organism"** / "samjhao poora system" | A structured **~10-min lecture** — brain → gate → tanks → night shift → memory → both layers → laws → M14+. Every number real, zero hype. *(This is the new `get_organism` briefing — the one call that explains the entire product.)* |
| 3 | (Hinglish) "speculative decoding ka matlab kya hota hai…" | Fast brain answers instantly; behind it the thalamus **wakes Claude Opus** and the deep answer folds back — one voice, two brains. Works in Devanagari too. |
| 4 | "kya due hai?" → "open the embeddings book" | `get_rejirah` names the 3 overdue cards; `get_capsule` returns **your own words** and real doubts — builds on what you fought through. *(Checked 10 Aug 2026 — "3" happens to still be right and that is luck, not truth: `cards.json` reads `overdue: 3` today, and `get_rejirah` slices `hardest_due` to 3 and the queue to 8 by construction — `grep -n "hardest_due" scripts/dugout.mjs`. It is a number that moves every night; read it live with `node -e "const o=JSON.parse(require('fs').readFileSync('dressing-room/state/cards.json','utf8'));console.log(o.due_today,o.overdue,o.hardest_due)"`, never off this row. Four capsules are locked on this machine — `Get-ChildItem dressing-room\state\capsules` — and `get_capsule` reads that list off disk at load rather than carrying a frozen four, so "the embeddings book" only works while embeddings is on that disk list.)* **Changed 10 Aug 2026 on his ruling, and it changes what the guest sees:** `get_capsule` with an id ALONE now returns the **MAP** (bolo, hook, mechanism whole, plus a row per fault-line with its spoken length); the prose page comes from a SECOND call with `open:` — and it comes back **VERBATIM and uncut**, with `est_seconds` on every page so the Gaffer quotes the price before reading. The old shipped projection cut every axis at 220 characters (a guessed number, no comment justifying it) and is frozen beside the new one as `capsuleProjectionLegacy()` per the layering law — `grep -n "capsuleProjectionLegacy" scripts/dugout.mjs`. So "returns your own words" is now literally true; before today it returned the first 220 characters of them. |
| 5 | "team sheet dikhao" | Today's **real-Opus** sheet — AMBER ceiling, one thing, the floor. Zero invented numbers; the Manager only proposes. **6 Aug 2026 — RESOLVED, and here is the standing check.** For four days this row would have shown a guest the 2026-08-01 sheet (Matchday 1, opening *"I don't know you yet"*, SQUAD REPORTS "instruments dark"): `formation_read` was gated to `window:"morning"` (07:30–12:00) and this laptop sleeps through it, so the sheet built on 1 of 9 days. The gate is now `window:"any"` (audit #108) and today's sheet is live. **Before any demo, still glance at the sheet's own date line** — a sheet is only ever as fresh as the last day the machine was awake, and `node scripts/physio.mjs` now raises a bleed when it goes stale (it could not see this file at all before #108). **RE-CHECKED 10 Aug 2026, and the #108 fix HOLDS but its closing sentence now misleads.** All three mechanics verified live: `formation_read` reads `"window": "any"` with `"at": "08:45"`, `"model": "opus"`, `"kind": "manager_m3"`, `"enabled": true` (`grep -n "formation_read" -A12 dressing-room/state/brain_config.json`), physio really does watch the file now (`grep -n "team_sheet.md" scripts/physio.mjs` → it sits in `expected_cadence_hours` at 30h), and `team_sheet.md` was written **today at 08:45**. But "today's sheet is live" was read as "today's sheet is rich", and it is not: the fresh 10-Aug sheet STILL opens `⚪🔴 TEAM SHEET — 2026-08-10 · Matchday 1 · 🤝 Introduction` and still says *"I don't know you yet"* — the same two strings #108 quoted as the SYMPTOM of the frozen sheet. Freshness was never what made those lines appear; the season counter and the dark squad reports did, and neither is fixed by a gate. Its ENERGY line today reads *"No verdict from the ring today, so the grind is honored: full intensity, no artificial cap"* — so there is **no AMBER ceiling on it to show a guest**. Read the real head before you promise anyone anything: `Get-Content dressing-room\state\team_sheet.md -TotalCount 8`. |
| 6 | "sab kuch batao" → "prove it, run the code" | `get_club_report` = the whole day's state; `run_python` executes live in a real sandbox — "don't trust me, watch it run." |

<!-- CHECKED 10 Aug 2026 AND HELD — rows 2, 3 and 6 needed no repair, recorded here so the next pass
     does not re-derive them from scratch:
       · ROW 2 — `get_organism` exists and is the 28th tool in dugout.mjs's TOOL_DECLS. Its own
         narration order is "what it is → the two-speed brain → the thalamus gate → the seven tanks →
         the night shift → the five-layer memory → the learning layer → the outwork layer → the humane
         laws → the M14+ features", which is the row's list exactly; the "~10-min lecture" and "every
         number real" phrasing is the tool's own ("Narrate this as a STRUCTURED 10-MINUTE LECTURE …
         Every number in this object is REAL (read live). Use them; invent nothing"). Evidence:
         `grep -n "STRUCTURED 10-MINUTE LECTURE" scripts/dugout.mjs`.
       · ROW 3 — the two-brain bridge is real and wired end to end: the thalamus ladder escalates
         "S≥τ1 (and budget-ok, not-refractory) → WAKE Opus", and the Dugout injects `[DEEP PENDING …]`
         (holding line) then `[DEEP THOUGHT …]` (woven in as the Gaffer's own second thought) over the
         live socket — `grep -n "DEEP PENDING" scripts/dugout.mjs`, and its selftest asserts deep
         answers land only at a quiet beat. Devanagari holds too (`grep -rn "Devanagari" scripts/`:
         dugout handles transliterated Devanagari input, hippocampus indexes both scripts).
       · ROW 6 — `get_club_report` and `run_python` both exist as declared. run_python really is a
         sandbox and it is firewalled in code: `CHALKBOARD_DENY` blocks any model-authored code
         touching dressing-room, hippocampus, oura, .gemini, api keys, environ, open(), pathlib,
         subprocess or os.system — `grep -n "CHALKBOARD_DENY" scripts/dugout.mjs`. "Don't trust me,
         watch it run" is safe to say to a guest. -->

**The soul (say in your own words):** no shame, no streaks, no hype, win-only voicing, a hard medical boundary, **$0 marginal cost / zero API keys** — enforced in code. The moat isn't the agents; it's knowing what to refuse.

<!-- CHECKED 10 Aug 2026 AND HELD — "enforced in code" is the strong claim here and it survives:
       · zero API keys — brain.mjs refuses outright when a key is present: "brain: REFUSING —
         ANTHROPIC_API_KEY is set in this shell (per-token billing risk). Unset it; the brain runs on
         the Max subscription only." (`grep -n "refuse_if_api_key_env" scripts/brain.mjs`), and its
         own selftest sets a fake key to prove the refusal fires.
       · no hype — a banned-phrase check runs over model output ("10x", "on steroids", "god-tier",
         "time is short"), with the note "Hype in output is a bug (CONDUCTOR §1)" in brain_config.json.
       · no shame / no streaks / medical boundary — all three sit in the Gaffer's INVIOLABLE block,
         including "medical territory = one sentence, 'show your doctor'" and "rivalry only vs
         kal-wala-Nikhil": `grep -n "INVIOLABLE" scripts/dugout.mjs` (search the bare word — the
         line's actual text is "INVIOLABLE (never soften)", and those parentheses are a GROUP under
         ripgrep, so quoting them whole silently returns nothing).
       · win-only voicing — the Twin will not speak until 30 scored resolutions; today it says so
         itself ("voice silent (6/30 scored resolutions)"). -->


**The honest close:** the learning scouts are quiet by design until fed — Calibration & Nemesis at 20 reps, Learning-State at 12, the Twin's book at 30. Zero reps today isn't broken; it's the machine built and waiting.

<!-- corrected 10 Aug 2026 — THE FOUR THRESHOLDS ALL HELD; THE STORY AROUND THEM DID NOT.
     Thresholds re-verified in the code, all four exactly as written above:
       · calibration.mjs  — `min_reps: 20`            (`grep -n "min_reps: 20" scripts/calibration.mjs`)
       · nemesis.mjs      — `warming_up_min_reps: 20` (`grep -n "warming_up_min_reps" scripts/nemesis.mjs`)
       · learning_state   — `warming_up_min_reps: 12` (`grep -n "warming_up_min_reps: 12" scripts/learning_state.mjs`)
       · twin.mjs         — `voice_min_resolutions: 30` AND `dead_market_min: 30` — note the UNIT the
         line above leaves out: the Twin's 30 is scored RESOLUTIONS, not reps (`grep -n
         "voice_min_resolutions" scripts/twin.mjs`).
     What HAS changed is the last sentence: it is no longer zero reps, and three of the four gates
     have OPENED. Run on 10 Aug 2026 (the organs print their own gate line — this is their output,
     not a derivation):
       · `node scripts/calibration.mjs`   → "21/20 reps — gap 0.0929 · overconf 0 · danger 0 ·
                                             establishing baseline (21/40 reps)"   ⇒ gate MET
       · `node scripts/nemesis.mjs`       → "ok — 21/20 reps (axis-pattern gate met)"  ⇒ gate MET
       · `node scripts/learning_state.mjs`→ "21/12 reps"                              ⇒ gate MET
       · `node scripts/twin.mjs`          → "voice silent (6/30 scored resolutions, slowest:
                                             first_focus_by_0930)"                    ⇒ STILL GATED
     The log holds 21 reps, 4 of them today (`(Get-Content dressing-room\state\reps_log.jsonl |
     Measure-Object -Line).Lines`). So "zero reps today isn't broken" is a 15-Jul sentence: say the
     LIVE denominators instead — every one of those organs prints have/need with the denominator on
     purpose, which is a better demo than this paragraph ever was. Only the Twin is still honestly
     quiet, and it says so itself with its own slowest market named. -->


---

## THE THREE BROWSER-HALF TASKS (your logins — machine halves are done)

These need your logged-in browser (a machine may never hold your passwords). Each has its ready-to-run artifact already generated:

1. **Jules on the repo** — both Pro accounts are enrolled. First task to hand it (paste into Jules, public repo `nikhil1429/arsenal-ai-fc`): <!-- SPENT — do not re-fire this. Confirmed 10 Aug 2026: OPS_STATE.md records it closed — `grep -n "CAPTAIN'S BROWSER STEPS — ALL CLOSED 15 Jul" OPS_STATE.md` ("Jules × both Pro accounts → both PRs verified + merged"). The freeze header at the top of this file says the same. The quote below is the RECORD OF WHAT JULES WAS TOLD, and every count inside it is a 15-Jul figure that was already wrong on 6 Aug and is wronger now — see the header. Nothing in the block below is a number to reuse. -->

   > *"ORGANISM_ANATOMY.md and ORGANISM_LEDGER.md are stale — they describe 16 organs / 26 suites / 7 skills. Reality (verify from package.json + scripts/ + .claude/skills/): 43 scripts, 39 selftest suites, 24 dugout tools, 11 skills, 38 scheduled tasks, plus the whole cyborg-brain layer (thalamus, cortex, hippocampus, dmn, council, nightshift, fuelboard, examiner, tone, presence, groundsman, awayday, turnstile). Add a dated 'THE CYBORG-BRAIN LAYER' section listing each with its green selftest, and correct the skill/task/tool/script counts. Open a PR — do not touch any gitignored personal state."*

2. **The phone Voice-Gaffer Gem** — the cartridge is staged at `dressing-room/state/brain_out/nightshift/gem_cartridge.md`. Run `/gem-sync` and I'll Chrome-drive the paste with you watching (when the browser extension is reconnected).

   <!-- verified 10 Aug 2026 — path, staging and skill all HOLD. The file exists at exactly that path
        and was rewritten today at 02:46 by the night shift (so "staged" is current, not a leftover),
        and the `gem-sync` skill is present: `(Get-ChildItem .claude\skills -Directory).Name`. Since
        audit #108 physio also watches this exact file for death — `grep -n "gem_cartridge"
        scripts/physio.mjs` — after four consecutive silent misses went unraisable. The parenthetical
        about the browser extension is a session-state claim, NOT VERIFIED here either way. -->


3. **The Gemini-Pro Deep-Research surface** — tonight's ready-to-paste prompt is at `dressing-room/state/brain_out/nightshift/scout_pack.md`. Open it, paste into your Pro account's Deep Research, then throw-in / paste-session the result back — the doubtminer takes it from there.

   <!-- verified 10 Aug 2026 — the path and the return route above are BOTH still right, and the file
        is fresh (written today 02:46 by the night shift; the pack's own first line reads "Ready-to-paste
        DEEP RESEARCH prompts for the Pro account (T5 — a human surface; no API exists…)" and its own
        instruction is "throw-in or paste-session it back; the doubtminer and capture take it from
        there" — identical to this row). What this row could not know is that it is now ONE OF TWO
        outward lanes, and firing the wrong door loses the work:
          · THIS lane (the nightly scout_pack) → returns by throw-in / `/paste-session`, as written.
          · THE MISSIONS DESK (built 8 Aug 2026, scout.mjs) → its own door, and the door is printed
            INSIDE each mission file: `node scripts/scout.mjs mission ingest <ID> --file <path>`
            (`grep -n "Return door" scripts/scout.mjs`). Missions live in `dressing-room/missions/`
            and their state in missions.json — read it live with `node scripts/scout.mjs mission list`,
            which on 10 Aug 2026 showed M01-M04 (the full-syllabus audit, 0/4 returned) plus
            T-hallucinations staged, with the benchmark gate reading "gated — audit in flight".
          · Two zero-tax skills now exist for the human half that this section says a machine may never
            do: `/fire` (drives Chrome to Deep Research; HIS click stays the trigger) and `/harvest`
            (reads a finished Gem sitting back out of Chrome). Confirm with
            `(Get-ChildItem .claude\skills -Directory).Name`. -->


*(Note on the Pro lane: there is **no** AI-Studio↔AI-Pro API unlock — a Pro subscription doesn't grant a Pro API tier. The code already knew this and degrades every Pro call to free Flash; M18's season-read runs fine on Flash. The Pro accounts' value is Jules + these human surfaces, not an API.)*

<!-- re-verified in the code 10 Aug 2026 — this whole note HOLDS, and it is worth saying so because it
     is the one claim in this file a reader is most likely to doubt. Evidence, all from nightshift.mjs
     (`grep -n "flash" scripts/nightshift.mjs`): the pro attempt is made and the 403 is expected —
     "t=0.9 on the free lane + 1 pro attempt (403 on free keys → flash, honest)"; the fallback is
     declared as a degrade, not a silent swap — "honest degrade to flash-latest (still 1M)"; and the
     model pool is literally `["gemini-3.1-pro-preview", "gemini-flash-latest"]` in that order. M18's
     season re-read is the season_read job and its own selftest asserts the flash-lane result carries
     the model stamp (`grep -n "SEASON RE-READ" scripts/nightshift.mjs`). Nothing here needed a fix. -->


---

## DAILY OPERATION (the whole loop, once you're using it)

Morning push (~08:45) → open the Dugout, "good morning" → **study and paste every session** (`/forge <concept>` or `/paste-session`) → throw stray thoughts from the phone → evening bell (~~21:30~~ **22:00**) → 30-second `/full-time` → sleep while the night shift sharpens tomorrow. That's it. You study, you ship, you speak. **COYG.** ⚪🔴

<!-- corrected 10 Aug 2026 — THE EVENING BELL IS 22:00, NOT 21:30, and this is HIS OWN RULING, not a
     drift. brain.mjs carries the ruling verbatim next to the constant: "B3 (9 Aug 2026, HIS RULING):
     'bell time 10:00 krdo, i come back home at that time' — 22:00, aligned in all three places (here,
     the Bell-FullTime task, the config _note). It was 21:30 here while the task fired 22:30 — 60 of
     the 75 grace minutes burned before the bell even rang." Verify: `grep -n "grace_min: 75"
     scripts/brain.mjs` → the one hit is the BELLS constant, `fulltime: { at: "22:00", grace_min: 75 }`
     (search that, not the whole `fulltime: { at:` string — the brace is a regex quantifier). Two more places agree: brain_config.json's ntfy
     _note ("the 08:45 sheet (after formation_read) and the 22:00 full-time bell") and conductor.mjs's
     evening chain, whose FIRST step is `{ id: "bell", at: "22:00", args: ["scripts/brain.mjs","bell",
     "fulltime"] }` (`grep -n "const EVENING" -A3 scripts/conductor.mjs`). Waiting at 21:30 = waiting
     half an hour for nothing. Note also WHICH task rings it now: `ArsenalFC-Bell-FullTime` reads
     **Disabled** in `Get-ScheduledTask -TaskName ArsenalFC-*`, and that is deliberate — its row was
     retired INTO the one-task evening chain, and `ArsenalFC-Evening-Conductor` (Ready, 22:00) is what
     fires. Do not "fix" the disabled bell task by re-enabling it; you would get two bells.
     The 08:45 morning push HOLDS: brain_config's ntfy block reads `"enabled": true` with
     `"push_after": ["formation_read"]`, and formation_read's own `"at"` is `"08:45"`. -->

