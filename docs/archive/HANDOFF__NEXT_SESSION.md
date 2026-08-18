<!-- Written 10 Aug 2026 by a verification pass. Every number was measured live that morning and carries its date. Nothing here is canon. When this file and the code disagree, the CODE wins and this file is wrong. -->

# PART ONE — THE VERIFIED TRUTH SHEET

**All measurements taken 10 Aug 2026, between 07:30 and 08:10 IST, on the live machine. Read-only: file reads, computed aggregates over live logs, `git` reads, `Get-ScheduledTask`. No organism script with a write path was run. No network call was made.**

Every number below carries its unit. Every one of them rots. Re-measure before using any of them as a reason to change code.

---

## METER

| # | Claim | Verdict | If not confirmed — what is actually true |
|---|---|---|---|
| M1 | Ledger rows changed unit around 9 Aug: old rows = input+output, new rows fold the cache pair into `total_tokens` | **PARTLY TRUE** | It is a **per-lane** split, not a date split. brain.mjs's own tick lane has folded cache since **26–29 Jul 2026**. What flipped on 9 Aug (commit `76a5cbb`, 23:28 IST) is the **DMN lane** (1,000 rows that recorded the cache fields then excluded them) and **haiku_pulse** (881 rows with no cache fields at all). **Four lanes still carry no cache fields in any row, ever** — `cortex_consolidate`, `cortex_wake`, `council_chair`, `selfknowledge`, 42 rows all-time. |
| M2 | Last 7 days: 1,377 rows · total_tokens 6,255,559 · input+output 1,503,430 · cache pair 62,262,799 | **CONFIRMED** | Exact to the token at instant 2026-08-10T02:00:00Z. 72% of those rows are DMN, recorded in the excluding unit — the whole discrepancy is one lane. |
| M3 | Only 3 `limit_hit` rows in last 7 days, newest 7 Aug; 315 all-time | **CONFIRMED** | All 3 are `dmn_rollout` at 2026-08-07T19:16:26Z, within 217 milliseconds — **one event written three times.** The plan's dedup guard is correct and load-bearing. |
| M4 | At 03:00 the 5-hour window read full, allowed = 0 tokens, which is why the diary never ran | **CONFIRMED on mechanism · MISLEADING on "never"** | The diary job is **2 hours 12 minutes old at its first slot** (config commit `6fc958d`, 10 Aug 00:48:04 IST; slot 03:00 IST). One missed slot, not a lifetime. At that instant: 5h used **1,999,481 tokens = 131.5%** of the 1,520,000-token overnight cap, allowed **0 tokens**. **Crucially: metered and honest sums were identical (1,999,481 tokens both ways)** — every row in that window was already four-field. The diary was starved by real, correctly-metered overspend (DMN 703,914 tokens + nightshift 520,008 tokens = 61%). **Fixing the unit makes the diary's headroom worse, not better.** |
| M5 | Weekly cap 24,000,000 tokens and 5h cap 1,600,000 tokens were estimated in the old unit | **PARTLY TRUE** | Live values confirmed. "Estimated" is too generous — they were **never derived from any measurement in any unit.** Born 12 Jul 2026 at 800k/12M with the note "Anthropic publishes no exact Max-5x token caps"; doubled 9 Aug 17:00 IST on his plan-upgrade word. `limits.mjs` tags them `measured` and `external` — **both tags are wrong; both should read `guessed`.** |
| M6 | Counted honestly the meter would read ~266% of the weekly cap | **CONFIRMED (265.7–265.8%)** | With one caveat that must be stated wherever the number is written: it counts `cache_read_tokens` (53,613,031 of the 62.3M gap) at **weight 1.0**, which is the meter's own assumption. Whether the plan charges cache reads at full weight is an **external fact unverifiable from inside this repo.** |
| M7 | The `observed_window_ceiling` self-tuner exists and can only raise the cap | **CONFIRMED — and it has learned nothing** | Stored value is **1,600,000 tokens = exactly the estimate.** Replaying its own loop: all three wall observations (376,992 / 377,144 / 377,296 tokens) were clamped away by the floor. `token_vitals.ceiling_source` says `"observed"` — it is the estimate wearing that word. The floor now sits **4.2× above** the only real wall observation on record. |
| M8 | Are `token_vitals.json`'s numbers in a consistent unit, and what is the live 5h reading? | **SPLIT** | **5h figure IS consistent** (all 71 rows four-field, 754,398 tokens, zero hidden). **7d figure is NOT** (metered 6,292,693 vs honest 63,803,363 tokens). And the headline percentage uses the **wrong denominator**: `pct 46.6` = used ÷ ceiling (1,600,000), but the number that actually gates spend is `cap_now` (960,000 in shoulder phase) → **operative reading 77.6%, displayed 46.6%.** The 7d mixed-unit sum **self-heals around 2026-08-16** when the 1,000 pre-G1 DMN rows roll out of the window. |
| M9 | *(measured here)* Which lanes never ask the token governor | **CONFIRMED, three of them, three different currencies** | DMN sizes itself from `fuelboard.mjs` tanks — the **Gemini-quota** instrument — gated on away · tone · fuelboard-headroom. Nightshift's budget is `shift_call_budget: 62` — **a count of calls, not tokens.** `haiku_pulse` has its own per-day count and per-day token cap inside brain.mjs. Together **55.5%** of 7-day metered tokens (DMN 38.7% + nightshift 8.2% + pulse 8.5%, window ending 2026-08-10T02:34Z). The plan's 56.6% reproduces within window drift. |

---

## DMN

| # | Claim | Verdict | If not confirmed — what is actually true |
|---|---|---|---|
| D1 | The precache join was matching concepts against browser window titles; fixed 4 Aug | **CONFIRMED** | With one correction: the break was on the **producer** side (`presence.mjs` filling `concept_tokens` with window words), not the matcher. Both sides repaired in one commit, `4f94805`, 2026-08-04 21:49 IST. |
| D2 | Since 7 Aug the join HITS: 7 of 8 stalls matched | **PARTLY TRUE — and the hit rate is empty evidence** | 7 of 7 that reached the gate; the 8th was absorbed as context into another moment 537 ms later (structural loss, not a miss). But: **all 7 matched via the frozen legacy lane**; `canon_join` and `sprint_fallback` have never fired. The query side is force-fed the sprint's current task because the actual stall text is a tab-switch-rate detector ("91 switches in 10min") carrying zero information about what he was stuck on. The offer side holds exactly one concept. **One constant matched against one constant = 100% by construction.** |
| D3 | Precache holds 3 verified entries, one concept, dreamed 9 Aug 23:14, 25 rollouts, marks itself inert | **PARTLY TRUE** | Every fact correct except timezone: `dreamed_at` is UTC. In his own time the surviving dream is **10 Aug at 04:44 IST**, not 9 Aug 23:14. |
| D4 | Hourly task, 5–10 passes/day, file overwritten each pass, 7 of 8 paid passes deleted on 9 Aug | **PARTLY TRUE — and worse than stated** | Overwrite CONFIRMED outright from the writer (full replace, no read of the prior file, no merge anywhere). Cadence is **3–9 passes/day local** (4–9 on complete days). "7 of 8" is a **UTC-day** count; by his local day **all 5 passes of 9 Aug were destroyed.** Whole record: **25 dream passes since 6 Aug, ~1,154 metered calls, exactly ONE pass's output exists. 24 of 25 deleted.** |
| D5 | DMN is 39% of the metered week | **CONFIRMED** | 39.0% of tokens exactly. Add the sharper number the plan omits: **83.7% of all metered calls** — and call share is what a rate limiter feels. |
| D6 | After the 9 Aug lean flags, per-call cost fell ~87% (cache read 50,624 → 5,767 tokens/call) | **PARTLY TRUE** | Both quoted numbers exact. But −86.9% is the **cache-read component alone**; the honest headline for total per-call footprint is **−81.3%** (57,432 → 10,767 tokens/call). And the trap: **the same commit redefined `total_tokens`**, so that field reads 1,003 → 10,767 tokens/call, a 10.7× apparent *increase* that is pure accounting. **Any DMN budget arithmetic must split the ledger at 2026-08-09T17:58Z or it is wrong by ~10×.** |
| D7 | The earned-voice gate needs a proactivity ledger written by shadow scoring, which only `/full-time` invokes, and he has never run it | **PARTLY TRUE** | Four links confirmed (ledger file absent, shadow.mjs sole writer, `score`'s only caller is postmatch, postmatch has never completed — all four of its unconditional outputs absent). **Stale premise: `shadow detect` IS scheduled and running** every 10 minutes, LastResult 0, 7 rows logged, all unresolved. Only `score` is orphaned. **And a second, harder gate the plan never mentions: `wall_breaker` is at 2 of the 10 shadows required**, and only accrues on a "spinning" struggle verdict. **A perfect `/full-time` tonight does not open the whisper. It is weeks away at best.** |
| D8 | The whisper's only surface is the live voice room, it expires 180 seconds after load, and he has not opened that room since 5 Aug | **CONFIRMED, all three** | 180,000 ms, enforced twice. Only consumer is the browser page's 3-second poll into the live Gemini session — no push, no CLI, no file he reads. Last session **5 Aug 2026 ~20:50 IST**, agreed by three independent live files. **Every whisper since then expired unseen even in the world where both gates were open.** |
| D9 | The weak-point vector has been stuck on one concept all week | **PARTLY TRUE — and the stated cause is wrong** | One concept since 9 Aug; **two** from 6–8 Aug (rollouts 50 → 25, at 25 rollouts per weak point across 13 consecutive passes). The inputs are **frozen, not stuck** — all three mtime 2026-08-09 12:30 IST. **The cause is NOT that the three tasks are Disabled.** They are Disabled **by design**, absorbed into the morning conductor chain. The real cause: `ArsenalFC-Morning-Conductor` LastRunTime = **09-08-2026 12:30:16 IST**, NextRunTime = **10-08-2026 09:15:00** — it simply has not run today. **The vector refreshes at 09:15 today with zero intervention.** |

---

## WALL

| # | Claim | Verdict | If not confirmed — what is actually true |
|---|---|---|---|
| W1 | poster.svg and wall_gemini.html are frozen at 21 Jul | **REFUTED** | Both rewritten **every 30 minutes**. The freeze was real when audit #65 wrote it and was fixed at the producer; the note was never deleted, so it keeps re-teaching a dead fact. The directory is gitignored, so git has no history to corroborate the 21 Jul story either way. |
| W2 | Both rewritten this morning around 07:08 | **PARTLY TRUE** | **07:38:03–04 IST**, not 07:08. The 07:08 figure comes from converting `02:08:03Z` at +5:00 instead of +5:30. There *was* a 07:08 run; its output was overwritten 30 minutes later. Worth flagging only because it proves the number was read off a file, not off a clock. |
| W3 | Every artefact is one day behind its own filename | **PARTLY TRUE** | True for the three **model-authored** artefacts (poster.svg, wall_gemini*.html, wall_insights/*.md). **False for the deterministic ones** — wall.html, filmkit_*.md and wall_data.json all render 2026-08-10 correctly. Filename = service date, content date = generation date. Two defensible conventions colliding. **Bigger, unmentioned: the poster is stale in DATA too** — it prints 86% / 6-of-7 days against today's live 71% / 5-of-7. |
| W4 | "The read" panel dies every night because the model's own date header eats a slot and then trips the invented-number check | **PARTLY TRUE** | Mechanism reproduced exactly **for tonight** (header eats slot 1 → bullet 3 dropped → "09" is the only invented token → whole panel dies; strip the header and all three bullets pass clean). But across the 4 nights with evidence the panel showed lines **zero** times and **only 1 of 4 deaths was the date header** — the others were a derived count ("4") and a quoted session date ("2026-08-04"). **Root cause is broader: two validators with different allowed-sets** — the brain validates against its own prompt, viz validates against today's wall_data.json with an empty allowed-set. |
| W5 | That panel costs ~87,528 tokens a week | **CONFIRMED for the trailing 7×24h** | Not a stable rate: 14-day = 137,527 tokens/week; all-time span-normalised = 89,552 tokens/week; per-run cost dropped ~4× on 6 Aug. And the waste is total — **4 of the week's 8 runs were killed by the brain's own validator before a file was written, and zero of the 87,528 tokens reached the wall.** |
| W6 | Wall re-renders every 30 minutes, page self-refreshes every 5 minutes | **CONFIRMED, both** | PT30M trigger, `<meta http-equiv="refresh" content="300">`. Nothing to build. Note the interaction: anything wrong is on screen for up to 30 minutes. |
| W7 | *(reported)* What the wall shows a human right now | **N/A** | 12 panels render. **Two are actually broken**: "The read" (dead, "held at the gate"), and **the body panel shows a 5-day-old AMBER with no freshness gate at all** — the renderer never checks the reading's age, `readiness.json` day is 2026-08-04, content 126 hours old, Goalkeeper task Disabled. `loop_vitals.json` already carries this bleed. Also: the Media panel's freshness flags ride on **filename only**, so the wall labels the render "· 2026-08-10" while the file's own text reads "09 AUGUST 2026". |

---

## DECK + LEAK

| # | Claim | Verdict | If not confirmed — what is actually true |
|---|---|---|---|
| K1 | 22 cards filed, 29 deals, ZERO answers ever, 15 live | **PARTLY TRUE** | 22 ✓ · 0 answers ✓ · 15 live ✓. **Deals: 35** as of 08:10 IST today (34 at 07:55, 27 on the public remote). 29 is a number this file has never held. **c9 alone holds 19 of the 35 (54%).** 7 cards retired — **all 7 by resolved-at-source, none by his word.** 7 cards never dealt at all. All 15 live cards are answerable; every dispatch target resolves on disk. |
| K2 | captains_call.json is tracked by git, is not gitignored, and has reached the public remote | **CONFIRMED, all three independently** | Push receipt in groundsman.log, 10-08-2026 03:45. **The leaked surface is wider than the plan says**: 37 tracked state files, including `intake_log.json` (four prescription drug names as field keys) and `readiness.json` (29 Oura biometric fields). **Important negative result: conversation text, hippocampus memory facts, and app-usage logs are all gitignored and NOT leaked.** |
| K3 | The groundsman push lane stages everything by default | **REFUTED** | It already has a **`PUBLISH_ALLOWLIST` plus two independent locks**: `git add -u` (already-tracked files only) and an index re-read that refuses the whole commit if any staged path fails the allowlist. Its only push in history carried exactly **1 file, 6 insertions / 2 deletions.** **New untracked state files are already private by default.** It also cannot push any root canon doc except README.md. |
| K4 | The gemini-login card can never retire | **PARTLY TRUE** | Every factual part confirmed: no recency window in the derivation, all 10 gemini-engine rows are 17 Jul 2026, streak = 10 against a bar of 5, and **all 30 configured jobs are engine "claude"** — so the world can never contradict it. But "never" applies only to **auto-retirement**. His single haan or na sets `retired_at` and the mint guard covers retired cards permanently. **The card is immortal against the machine, not against him.** |
| K5 | *(measured here)* Two cards quote his memory facts word-for-word | **PARTLY TRUE** | **One** of the two. c19's card line contains a ≥20-character verbatim window of its fact's 66-character text; c20's does not. |
| K6 | *(measured here)* Not one card has ever been dealt between 07:00 and 12:00, the morning anchor it was built for | **REFUTED — by 25 minutes** | Exactly **1 of 35 deals** sits in the 07:00–11:59 IST window, and it landed **today at 08:08 IST**, after the plan was written at 07:43. The substance holds — 34 of 35 deals landed outside his morning, and 12 of 35 landed today between 01:42 and 08:08 inside build sessions — but the sentence must be rewritten. |

---

## CANON + SCHEDULE

| # | Claim | Verdict | If not confirmed — what is actually true |
|---|---|---|---|
| C1 | ORGANISM_LEDGER: groundsman is dormant, zero scheduled tasks, never wired | **REFUTED** | Task State Ready, LastRun 10-08-2026 03:45:01, result 0, and a real push landed on the public remote. **Canon calls dormant an organ that pushed to the internet six hours earlier.** (Two sub-claims — zero skills, no bus_lease.json — are true and irrelevant.) |
| C2 | ORGANISM_CLOCK: the turnstile daemon is down | **REFUTED** | Port 4111 listening, owned by `node scripts\turnstile.mjs`. Mitigation: the file self-labels as a dated snapshot and predicted its own repair — but it was **re-committed 9 Aug without correcting the line**, so a 9 Aug reader got a stale down-call from a file touched that day. |
| C3 | Canon says the DMN precache join has never produced a single whisper ("0 of 95 stalls matched · one door, and it is shut") | **REFUTED — the largest gap of all five** | **7 distinct match events, 0 "no match" lines**, first 2026-08-07T20:14Z, latest **2026-08-10T00:58Z — about 7 hours before this audit.** Canon says a mechanism has never fired once. This should be entry #1 in the claims register. |
| C4 | OPS_STATE.md's skill/task/suite counts are stale | **PARTLY TRUE** | Skills 12 → **15**. Suite members 62/67 → **73**. Tasks 38 → **50** (27 Ready / 23 Disabled). Reps 9 → **17 lines**. Every one is already guarded by the file's own "NEVER read a count from this file" banner — which is why it is a *low-priority* register seed, not a high one. |
| C5 | Canon says the Manager's M-2→M-5 are not built | **PARTLY TRUE** | Artifact claim **REFUTED**: system.md is 586 lines / 46,434 bytes, M-3 is wired and scheduled at 08:45, and has **run live 47 times**, last 2026-08-09T06:54Z, with team_sheet.md's mtime matching to the minute. Captain's-review claim **CONFIRMED** and correctly represented as live card c16 at §6 PRECEDENCE, zero of six review sections settled. **New finding canon does not mention at all: M-3 is 9 ok / 38 failed.** |
| C6 | Which Disabled tasks are dead vs disabled by design | **ALL 23 ARE BY DESIGN. ZERO are dead.** | Every one maps to a named conductor-chain step, and `tasks_expected.json` (as_of 2026-08-09) expects exactly 27 enabled / 23 disabled — matching the live schedule exactly, with no unlisted task. **Re-enabling any of them makes it race its chain.** Morning chain is proven: 16 ran / 16 ok in 10,952 ms, four logged runs. **Evening chain is NOT: `ArsenalFC-Evening-Conductor` LastRunTime = 11/30/1999, LastTaskResult = 267011 = "task has not run".** The one 9/9-ok evening report came from a manual build-time invocation, not the scheduler. **First real scheduler test is tonight at 22:00.** Two evening steps added today (scoreboard, nikhil-model) have never executed under any path. Also failing: `ArsenalFC-ConceptGraph`, LastResult 1, 10-08-2026 03:00:01. |

---

# WHAT CHANGED IN THE PLAN BECAUSE OF THIS

Ordered by how much it changes. The plan is KAAM 0 through KAAM 8.

### 1. DELETE a question before it is ever asked — TAIL 2 #5
**"Calibration, learning-state and twin are Disabled — turn them back on?"** — **remove this question entirely. Do not put it to him.** All three are Disabled by design, absorbed into the morning conductor. A haan would have made three organs race a chain that runs 16/16 green. The frozen weak vector is caused by the morning conductor not having run today; it self-repairs at 09:15 IST. **KAAM 2's "teen tasks wapas on karna hi asli repair hai" is deleted with it.**

### 2. DROP planned work that is already built — KAAM 0's allowlist move
The groundsman push lane already has an allowlist and two locks. Its stated rationale in the plan ("the automatic push default is send-everything") is **false**. New state files are already private by default. **KAAM 0 shrinks to: one `git rm --cached`, one gitignore line, and one ruling about history.** If he wants file-level rather than prefix-level allowlisting, that is a **new decision**, not a repair — present it as such or not at all.

### 3. RE-POINT KAAM 0's headline
The card file is the **least** sensitive of the leaked items. `intake_log.json` carries four prescription drug names and `readiness.json` carries 29 biometric fields, both on the public remote. Conversation text, memory facts and app usage are **not** leaked. And it is **one** card that quotes a memory fact verbatim, not two. **The genuinely new ruling to put to him is the medication log, which his 5 Aug D10 decision never named by class.**

### 4. RE-ORDER inside KAAM 1 — Move 3 is not "The read is back"
Stripping the model's own title line fixes **1 night in 4**, measured. The other deaths were a derived count and a quoted session date. **The snapshot fix — showing the viz validator the same allowed-set the brain used — is not the fix behind it; it IS the fix.** Ship them in the same pass or do not announce "The read is back". Cheapest extra win the plan misses: stop dropping bullet 3 when a header slips through.

### 5. RE-SCOPE KAAM 1's provenance work
"Every artefact" → **only the three model-authored artefacts.** The deterministic ones are already correct. And name the bigger problem out loud: the poster is stale in **data**, not only in its date line — provenance fixes the label, not the numbers.

### 6. ADD to KAAM 1 — the stale body verdict
The wall shows a **5-day-old AMBER** with no freshness gate in the renderer at all. Same organ, same file, same pass, human-facing. The organism already knows (`loop_vitals.json` carries the bleed). This is not in the plan and should be.

### 7. RE-FRAME KAAM 2's Taala 1 — the join is open and empty
"7 of 8 hits, the join is open" is true and proves nothing: one concept on the offer side, the same concept force-fed onto the query side, matched through the frozen legacy lane. **Nothing may be justified by that hit-rate.** The address work (drills) survives untouched because it does not depend on the join.

### 8. ADD a hard stop to KAAM 2's Taala 2
Even a perfect `/full-time` tonight does not open the whisper: `wall_breaker` is at **2 of 10** and only accrues on a "spinning" verdict. **Build nothing downstream of an audible whisper.** Also: `shadow detect` is already scheduled and running; only scoring is orphaned.

### 9. CORRECT KAAM 2's sizing numbers
3–9 passes/day local, not 5–10. "7 of 8 on 9 Aug" is a UTC count — **by his own day all 5 passes of 9 Aug were destroyed**, and the surviving file is a 10 Aug 04:44 IST pass. The whole-record figure is the one to quote: **25 passes, ~1,154 metered calls, one surviving output.** The lean-flag win is **−81.3% total per-call**, not −87%. **Split every DMN token comparison at 2026-08-09T17:58Z or be wrong by ~10×.**

### 10. ADD one line to KAAM 2 — journal the weak vector
The DMN records no trace of the weak vector it dreamed against. That is exactly why a week of history is now unverifiable. One line, worth more than any downstream tuning.

### 11. SHRINK KAAM 3's unit work
The unit split is **per-lane, not chronological** — fix it per lane. The 7-day mixed-unit sum **self-heals around 16 Aug** as the 1,000 pre-G1 DMN rows age out; **no back-fill is needed if you can wait.** But "the meter is honest everywhere" stays false until the four never-instrumented lanes (42 rows) are covered.

### 12. HARDEN KAAM 3's honest-labels pass — three items, not two
The plan proposes correcting two badges. Correct **four things**, all zero-risk labelling:
- 5h cap badge: not "corroborated once, n=1" — **every observation was clamped away by the estimate floor. It was never corroborated.**
- Weekly cap badge: derived from his ruling, never corroborated. Both should read **guessed**.
- **`ceiling_source` must not say "observed" when observed equals estimate.**
- **`token_vitals.pct` uses the wrong denominator** — displayed 46.6%, operative 77.6%. Show both, or compute against the gate.

### 13. ADD to KAAM 3 — the self-tuner asymmetry
The blend has two independent floors at the estimate, so it is **structurally incapable of learning that the real ceiling is lower** — which is the direction the single empirical wall points (377,296 tokens observed vs a 1,600,000-token floor, 4.2×). Same low-risk class as the badges.

### 14. CONFIRM, do not soften, KAAM 3's central decision
"Record the honest unit, obey the metered one" is **vindicated by measurement**: at the one real wall, metered read 47% of the then-cap while honest read 8,391,887 tokens. But the account is **shared** (his study plus Nidhi), so the ledger sees only part of the spend — the real number is pushed **higher**, not lower. Write 266% as "honest four-field sum at weight 1.0", never as a proven ratio.

### 15. CORRECT KAAM 4's numbers and keep its reasoning
**1,053 consecutive beats**, not 960 — from about 03:05 IST to the window's end at 07:30 IST. The plan's claim that the diary does not need the unit is now **measured-true**: metered and honest were identical at 03:00. The sibling costs are exact — dreams 12,026, model-mining 12,340, agenda 15,552 tokens — but **each is n=1, one observation from one night.** The other never-skip job, the lesson, measured 24,640 tokens (also n=1). Reserve pair floor ≈ 38k tokens against 1,520,000 = about 2.5%. The plan's ~3% holds; say "n=1" out loud.

### 16. NOTE a zero-code path in KAAM 5
The zombie card can be killed **today, by him, with one word** — a haan or na retires it permanently and the mint guard stops it returning. Ship the wiring test for the class; the card itself does not have to wait for code.

### 17. CORRECT KAAM 6's two headline numbers — the diagnosis stands
**35 deals, not 29** (27 on the public remote), and **c9 holds 19 of them.** "Never dealt in the morning window" became false 25 minutes after the plan was written — it is now 1 of 35, dealt at 08:08 IST today. Everything else in KAAM 6 — cards were never put in front of him, they mostly ask for time not a decision, the word-catcher drop, read receipt, demotion, the CLAUDE.md clause that invited the flood — is untouched by measurement and stands.

### 18. STRENGTHEN KAAM 7's seed list and its ambiguity clause
Lead the register with **the DMN-join claim** — canon says a mechanism has never fired once; it fired 7 times in 3 days. Add the **Manager M-2→M-5** entry (and note separately, outside the register, that M-3 is 9 ok / 38 failed — a live problem no canon file mentions). Demote OPS_STATE's counts, which the file already bans readers from trusting. And the plan's ambiguity clause is now doubly vindicated: the turnstile's port is open **and** its task is Disabled **and** that is correct by design. **A "task disabled ⇒ RED" probe would be exactly as wrong as a "port open ⇒ GREEN" probe. Only the claim's own question is right.**

### 19. KAAM 8 keeps waiting, with a sharper reason
Nothing in its numbers was tested. What is newly firm: the reading surface is confirmed empty since 5 Aug, and **the currency is not merely uncertain, it is per-lane** — one of the three probe lanes prices in **calls**, not tokens. A token-denominated trade cannot be evaluated against a call-denominated budget.

### 20. NEW WORK THE PLAN DOES NOT HAVE — and it comes first
**The evening conductor has never fired from the scheduler.** Nine evening organs hang off it, and two of its steps were added today and have never run under any path. **Every observable in the plan's "what you will see tomorrow morning" sits behind it.** If it does not fire at 22:00 tonight, the next session will read a working fix as a broken one. **Check it before building anything.**

---

# WHAT IS STILL UNVERIFIABLE

**Nothing in this list may be built on, quoted as fact, or used to justify a threshold, until it is measured.**

| Open question | Exactly what would settle it |
|---|---|
| Does the Claude Max plan charge cache-read tokens at full weight? | An authoritative published limit, or a controlled experiment run deliberately against the real wall and recorded. **Until then the honest unit may be recorded but never obeyed** — the whole 266% figure rests on this one assumption. |
| Which second concept dropped out of the weak vector on 9 Aug? | A retained snapshot of `calibration.json` or `twin.json` dated on or before 8 Aug. Both are gitignored with no history, so **the past is gone.** Going forward: have the DMN journal its own weak vector — one line. |
| Did the 9 Aug wall render reject its insight panel? | `wall_data.json` is overwritten every 30 minutes with no dated copy, so the allowed-number set for that day no longer exists. Settled going forward by an append-only per-render log of date, outcome and reason, or a dated snapshot file. |
| Is the test suite green? | Membership is confirmed structurally at **73 members**. Green or red requires actually running `npm test`, which executes the suite — outside read-only scope. Run it and read the output; never quote a pass count from any document. |
| KAAM 8's probe-seam numbers (228,618 tokens/week, 16,650 tokens of real thinking, 24 calls, the grading-instrument argument) | Not tested in this pass. Settled by the same per-lane aggregate over `brain_ledger.jsonl` for `ns_probe_bank`, `ns_distractors` and `ns_grade_probes`, split at 2026-08-09T17:58Z. |
| The plan's "56.6% bypasses the token gate" | Reproduces to **55.5%** for the three lanes I could name. The residual 1.1 percentage points needs the plan's own lane list. |
| Will the evening conductor fire at 22:00 on 10 Aug? | Only tomorrow morning's `Get-ScheduledTaskInfo -TaskName 'ArsenalFC-Evening-Conductor'` LastRunTime can answer it. **It has never fired. Assume nothing.** |
| Were other numbers in the plan produced by the same +5:00 timezone slip that made 07:38 into 07:08? | Not audited. Any IST figure in the plan that was converted from a UTC timestamp should be re-derived before it is quoted. |

---
---

# PART TWO — THE NEXT-SESSION HANDOFF

> **Save as `HANDOFF_NEXT_SESSION.md` in the repo root.**
> Written 10 Aug 2026, 08:10 IST. Every fact in section 3 was measured that morning and **must be re-measured before it is used as a reason to change code.** The commands are given.

---

## 1. WHAT WE ARE DOING

Nine pieces of work were planned from an audit. A verification pass then measured every load-bearing claim in that plan against the live machine, and several claims turned out to be stale, mis-scoped, or backwards — including one question that would have broken a working system if he had said yes.

This document carries the plan forward with every correction applied. It is the plan, not a report about the plan.

The three underlying diseases are unchanged: **the meter lies** (the brain cannot count its own spend, so the night's last job starves), **canon says one thing and the ground says another**, and **organs produce real output that reaches nobody**.

---

## 2. THE STANDING RULINGS — his own words, as constraints

These are not suggestions. A build that violates one of them is wrong even if it works.

1. **"i do not give a damn if they read my data"** — this was about **throw-ins and dugout lines**, a named class, and those stay in the nightly Gemini corpus. It is not a blanket permission. Any *other* data class crossing to Google gets asked about separately.
2. **Antigravity is dead.** Do not revive it, do not plan around it, do not reference it as a live surface.
3. **Nothing may be parked.** A sequencing dependency ("this waits for that, and here is why") is legitimate. "We'll come back to this later" is not — it is how three audits rediscovered the same rot.
4. **Do not close the DMN.** The question is never whether the Rest Room should live. The question is only where its output goes. Its depth stays at 25 rollouts per weak point.
5. **Peak intensity, but his attention is the scarce resource.** Build at full ambition; spend zero of his attention that you do not have to. If a thing needs the captain it rides an anchor he already hits; if it cannot ride an anchor, it does not need the captain.
6. **He is fine with his data in the public repo** (ruled 5 Aug 2026). That ruling stands. It never named the medication log by class — that is the one thing to ask about, and nothing else.
7. **No guessed numbers before 30–60 days of real data.** This law applies to the meter exactly as hard as it applies to the DMN's depth. The meter does not get an exemption the DMN was denied.

---

## 3. THE VERIFIED FACTS you may rely on

**All measured 10 Aug 2026 between 07:30 and 08:10 IST. Re-measure before acting.**

**The meter**
- Over the trailing 7 days: 1,377 rows, **6,255,559 tokens** metered, **1,503,430 tokens** input+output only, **62,262,799 tokens** in the cache pair. Counted honestly at full weight that is **265.7% of the 24,000,000-token weekly cap** — but that "full weight" is the meter's own assumption and has never been checked against the real plan.
- The unit split is **per-lane, not by date.** Four lanes have never recorded cache fields at all (42 rows all-time). The DMN's 1,000 mixed-unit rows **age out of the 7-day window around 16 Aug on their own.**
- **3 wall events in 7 days, 315 all-time** — and the 3 are one event written three times within 217 milliseconds.
- Both caps were **guessed**, never measured: born 12 Jul 2026, doubled 9 Aug on his plan-upgrade word. The self-tuner has a floor at the guess, so it has **learned nothing** — the stored "observed" ceiling is exactly the estimate.
- **55.5% of the week's metered tokens come from three lanes that never ask the token governor**, each using a different currency: the DMN spends against a Gemini-quota instrument, the nightshift against a **count of 62 calls**, the pulse against its own per-day cap.

Re-measure: `node -e "const fs=require('fs');const r=fs.readFileSync('dressing-room/state/brain_ledger.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse);const n=Math.max(...r.map(x=>Date.parse(x.ts)));const w=r.filter(x=>Date.parse(x.ts)>=n-7*86400000);const s=(f)=>w.reduce((a,x)=>a+(x[f]||0),0);console.log('rows',w.length,'metered',s('total_tokens'),'in+out',s('input_tokens')+s('output_tokens'),'cache',s('cache_creation_tokens')+s('cache_read_tokens'))"`

**The diary**
- The folder still does not exist. The job is **one night old** and has had **exactly one scheduled slot**, at 03:00 IST on 10 Aug, which it missed.
- At that instant the 5-hour window read **1,999,481 tokens = 131.5% of the 1,520,000-token overnight cap**, allowed **0 tokens**, and **1,053 consecutive beats** logged "one job eligible, zero allowed".
- **The unit was not the cause.** Metered and honest sums were identical that night. The starvation was real overspend: DMN 703,914 tokens plus nightshift 520,008 tokens = 61% of the window.
- A budget skip **writes nothing to the ledger.** That is why the hungry night left no trace.

Re-measure: `ls dressing-room/state/brain_out/diary` and `node -e "const fs=require('fs');console.log(JSON.parse(fs.readFileSync('dressing-room/state/token_vitals.json','utf8')))"`

**The DMN**
- **25 dream passes since 6 Aug, about 1,154 metered calls, exactly one pass's output survives.** The file is fully overwritten every pass — there is no merge anywhere in the writer.
- **39.0% of the week's metered tokens and 83.7% of all its calls.**
- The lean flags cut **81.3% off total per-call footprint** (57,432 → 10,767 tokens/call). The same commit redefined the meter, so **split any comparison at 2026-08-09T17:58Z.**
- The precache join "hits 7 of 7" — **and that proves nothing.** One concept offered, the same concept force-fed onto the query side, matched through the frozen legacy lane. The stall signal itself is a tab-switch-rate detector carrying no information about what he was stuck on.
- The weak vector is one concept because **the morning conductor has not run today** (last run 9 Aug 12:30 IST, next 10 Aug 09:15). **The three input tasks are Disabled by design and must not be re-enabled.**

Re-measure: `powershell -NoProfile -Command "Get-ScheduledTaskInfo -TaskName 'ArsenalFC-Morning-Conductor' | Format-List LastRunTime,LastTaskResult,NextRunTime"`

**The whisper**
- Its only surface is the live voice room, it expires **180 seconds** after load, and he has not opened that room since **5 Aug 2026 ~20:50 IST**. Every whisper since then expired unseen.
- The earned-voice gate needs 10 shadows of one type. **It has 2.** A perfect `/full-time` tonight does not open it.

**The wall**
- Nothing is frozen; it re-renders every 30 minutes and the page refreshes every 5 minutes.
- The "The read" panel has shown zero lines on all 4 nights with evidence, and **only 1 of those 4 deaths was the self-dated header** — the real defect is two validators with different allowed-sets.
- The panel costs **87,528 tokens in the trailing 7 days** (137,527 tokens/week over 14 days) and **not one of those tokens reached the wall.**
- Only the **model-authored** artefacts carry the wrong date. The deterministic ones are correct.
- **The body panel shows a 5-day-old AMBER and the renderer never checks the reading's age.**

Re-measure: open `dressing-room/club/wall.html` and compare against `dressing-room/state/wall_data.json`.

**The deck and the leak**
- **22 cards, 35 deals, zero answers ever, 15 live.** One card holds 19 of the 35 deals. All 7 retirements happened at source, none by his word.
- `captains_call.json` is tracked, not ignored, and on the public remote. **So are `intake_log.json` (four drug names) and `readiness.json` (29 biometric fields).** Conversation text, memory facts and app usage are **not** leaked.
- **The push lane already has an allowlist and two locks.** New state files are already private by default.

Re-measure: `git check-ignore -v dressing-room/state/captains_call.json` and `git ls-tree origin/main dressing-room/state/ --name-only`

**The schedule**
- 50 ArsenalFC tasks: 27 Ready, 23 Disabled. **All 23 disabled ones are disabled by design**, each absorbed into a conductor chain, and the live schedule matches `tasks_expected.json` exactly.
- The **morning** chain is proven: 16 ran, 16 ok.
- The **evening** chain has **never fired from the scheduler** — LastRunTime 11/30/1999. Its one green report came from a manual run. **Nine evening organs hang off it, and two of its steps have never executed at all.**
- `ArsenalFC-ConceptGraph` failed at 03:00 today.

Re-measure: `powershell -NoProfile -Command "Get-ScheduledTask -TaskPath '\' | Where-Object TaskName -like 'ArsenalFC*' | ForEach-Object { $i=Get-ScheduledTaskInfo $_.TaskName; '{0} {1} {2} {3}' -f $_.TaskName,$_.State,$i.LastRunTime,$i.LastTaskResult }"`

---

## 4. THE WORK, in execution order

---

### CHECK 0 — did the evening chain run? *(2 minutes, no build)*
**What is broken:** the evening conductor has never fired from the scheduler. Every observable in section 6 sits behind it.
**Do:** run the schedule command above and read `ArsenalFC-Evening-Conductor`'s LastRunTime. Then open `dressing-room/state/conductor_evening.json` and `scripts/conductor.log`.
**If it did not fire:** stop and fix that first. Do not build on top of a chain that does not run — and do not let a working fix be read as broken.
**Reversal:** none, this is a read.
**His word:** no.

---

### KAAM 0 — the leak *(shrunk: two commands, one ruling)*
**What is broken:** the card-deck state file is tracked in git, is not gitignored, and is on the public remote. One of its cards quotes a memory fact verbatim.
**The fix:** untrack it (the file stays on the laptop, git forgets it) and add it to gitignore. **The allowlist move from the original plan is DROPPED — it is already built**, with two locks, and new state files are already private by default.
**What is actually the bigger item:** `intake_log.json` carries four prescription drug names on the public remote, and `readiness.json` carries 29 biometric fields. His 5 Aug ruling accepted public data but never named the medication class.
**Reversal:** re-tracking is one command. Nothing is destroyed.
**His word:** **YES, twice.** (a) history rewrite or not — the two lines are already public, and rewriting is not a full erase because of forks and caches; (b) the medication log — untrack it or leave it.

---

### KAAM 1 — the wall *(re-scoped; one item added)*
**What is broken:** three things, not one.
1. The three **model-authored** artefacts stamp their generation date inside while the filename carries the service date. The deterministic artefacts are already correct — do not touch them.
2. The "The read" panel is dead every night. Stripping the model's own title line fixes **1 night in 4**; the real defect is that the brain validates numbers against its own prompt while the wall validates against today's state with an empty allowed-set. **Ship both together or do not announce the panel is back.** Free extra win: stop dropping the third bullet when a header slips through.
3. **New: the body panel shows a 5-day-old AMBER and the renderer never checks the reading's age.** The organism already knows — the bleed is in `loop_vitals.json`.
**The fix in plain words:** every artefact carries its own provenance line — who made it, when, for which morning — and every caption, label and title reads that line instead of the filename. Tell the painter which morning it is painting, but **not through the channel that tells the checker which numbers are allowed**, or the invented-number gate goes slack in the one organ whose job is stopping invented numbers. Give the wall validator the same snapshot the brain was given. Put an age check on the body verdict.
**Also worth saying out loud:** the poster is stale in **data**, not just in its date line. Provenance fixes the label, not the numbers.
**Reversal:** provenance is an extra line — older artefacts behave exactly as today. The prompt sentence is one line to delete. The age check is one condition.
**His word:** no.

---

### KAAM 2 — the DMN *(stop deleting the night's work)*
**What is broken:** the Rest Room dreams every hour and the file is fully overwritten each pass. **25 passes since 6 Aug, one surviving output.** Its best verified drill is better teaching material than what actually reaches his sheet — and it is deleted hourly.
**The fix, in order:**
1. **Stop deleting.** Within one day the file merges instead of overwriting: a repeat stall gains votes, a new stall is added, the 6-entry cap stays. **Write the cut order before the cap cuts** (votes, then verified, then recency), or a better later entry drops silently. Freeze the old overwriting engine in the file.
2. **Give it an address.** The evening drill compiler already ranks 15+ sources; the Rest Room's top verified drill becomes candidate 16 and wins or loses on the ordering keys that already exist. **No privilege, no new number.** Three guards: the drill's source line states when it was dreamed; the new drill kind is explicitly classed for AMBER and RED days rather than defaulting through; an empty inventory writes its reason instead of a silent zero.
3. **Journal the weak vector.** One line. It is why a week of history is now unverifiable.
4. **Run on change, not on the clock** — but only the dreaming half. The half that rescues dropped thoughts keeps running hourly, exactly as today. And a pass just after midnight must not mark the day done and suppress the late-evening pass, because **the late-evening pass is the one the drill sheet reads.**
5. **Depth stays at 25 rollouts.** No change until 30–45 days of counter data. His law, applied here exactly as it is applied to the meter.
**DELETED from the original plan:** "re-enable calibration, learning-state and twin." They are disabled by design. **Re-enabling them makes three organs race a chain that runs 16/16 green.** The vector is stale because the morning conductor missed today; it refreshes at 09:15 by itself.
**Also do not build:** anything downstream of an audible whisper. Its second gate is at 2 of 10 and only moves on a "spinning" verdict.
**Combined shape to write down before building:** about 4–5 passes a night (from 8–10 today), 25 rollouts unchanged, and **verification budget reserved before rollouts** — the verifier is roughly 4× a rollout, so a naive token gate spends all of it on rollouts and starves verification, producing unverified entries that the drill lane then filters out, leaving the lane silently empty.
**Reversal:** every address is a flag; off means the pool behaves exactly as today. The old engine stays frozen in the file. **The hourly scheduled task is not being touched, so there is nothing to restore there.**
**Honest cost:** the Rest Room has no config file of its own, so "one flag" means a small new config with a named owner. Saying it, not hiding it.
**His word:** no.

---

### KAAM 3 — the meter *(the load-bearing one; coupled to KAAM 4)*
**What is broken:** five writers put five different things into the one number the governor reads, and **55.5% of the week's spend passes through no token gate at all** — three lanes, three different currencies. The polite lanes are starved by the impolite ones.
**The fix:**
1. **The backoff stamp.** When the plan says no it also says when it will say yes — that reset time is already sitting unread in the ledger. Any lane that hits the wall writes one shared stamp; every lane reads it before spending. Guards: store the raw parsed string; a hard maximum backoff so a timezone error cannot silently close everything for five and a half hours; the stamp must not survive a laptop sleep; and the daemon logs that it is waiting **every beat**, not once. If the time cannot be read, a named fixed period — **this is the one declared exception to the no-guessed-numbers law, named as such.**
2. **One wall detector.** Three exist today; two are loose text matchers from the family that once read an ordinary error as a wall and closed five lanes for 22 hours. One repaired detector, the old ones frozen beside it.
3. **The wall book.** An append-only file that writes **only when the plan has already refused** — so it costs nothing and can never spend anything. Each wall records the time, the lane, the plan's own reset time, and all candidate ways of counting, side by side. After enough walls, the right unit is the one whose reading stays **stable between walls.** Until then it says n=1 everywhere and no cap moves. **Dedup is mandatory** — the 3 rows in 7 days are one event written three times, and without dedup the book will call one sample "enough data". Each row also records that the ledger sees one of three lanes on a shared account.
4. **One door.** Every lane asks the same question before spending and reports the same four numbers after. **Every blocked job writes its reason in its own row** — which gate stopped it, against which number. Today a starved night leaves one line on stdout that goes nowhere, which is why this took a month to find. Estimates come from each lane's own recent median — **zero new constants** — and a job that has never run gets a written fallback, never zero.
5. **The unit decision: RECORD, do not OBEY.** Both readings shown side by side from day one, plus how many rows could not be measured at all. **The governor keeps reading today's number until the wall book produces two walls whose readings agree.** This is the same discipline the DMN's depth is under; the meter does not get the exemption the DMN was denied.
6. **Four honest labels** — same number, only the badge changes, zero risk: the 5-hour cap is **guessed, never corroborated** (every observation was clamped away by its own floor); the weekly cap is **guessed, never corroborated**; `ceiling_source` must not say "observed" when observed equals the estimate; and the headline percentage must be computed against the number that actually gates spend, not the ceiling — today it displays 46.6% where the operative figure is 77.6%.
7. **The self-tuner asymmetry.** It has two floors at the guess, so it can only ever learn that the ceiling is **higher** — the opposite of the direction the one real wall points.
**Scope reduction:** the mixed-unit 7-day sum **self-heals around 16 Aug** as the old DMN rows age out. **No back-fill.** If you cannot wait, the fix is a per-row unit tag, not a re-sum.
**The danger to write down now:** the gate takes the smaller of the 5-hour remainder and the **weekly** remainder. The day the unit changes, the weekly reading jumps from 26% to 64.6% against a ceiling that was never corroborated — and a weekly lockout does not clear in hours, it clears in a **week**, and its only symptom is silence. So: the commit that changes the unit must re-derive the weekly cap in the same unit, and the two never-skip night jobs must get a floor the weekly term cannot drive to zero.
**Reversal:** one config key, two values. `legacy` restores today's behaviour byte for byte, because **no ledger row is being rewritten.** The stamp is a file — delete it and waiting stops. The wall book gates nothing.
**His word:** **eventually one card, once** — the day the wall book has enough walls to rule on the cap, dealt at an anchor he already hits. Not now.

---

### KAAM 4 — the diary *(goes with KAAM 3, not after it)*
**What is broken:** the night's last page has never been written. But be precise: **the job is one night old and missed one slot.** The starvation is real and confirmed; "never ran in its whole life" is not the honest framing.
**The fix:**
- The two lanes that do not ask the governor start asking (KAAM 3, item 4). That alone stops the 22:00–02:54 spend that empties the window.
- **The last-page reserve.** The two night jobs that may never be skipped — the lesson and the diary — get a slice of the overnight window nobody else can spend. That pair already exists in the code under a name, but it lives inside one function; **lift it to a shared place, do not copy it**, or the two lists will drift apart.
- **Stop breaking early.** Today the loop stops at the first unaffordable job, and the diary is deliberately last and lowest, so a heavy night never reaches it. Split the list: reserved jobs first against their reserve, everyone else against what remains.
- **Size it from measurement.** The diary has no cost of its own yet. Its siblings measured dreams 12,026, model-mining 12,340 and agenda 15,552 tokens — **each n=1, one observation from the night of 9 Aug.** The lesson measured 24,640 tokens, also n=1. Reserve floor about **38,000 tokens against a 1,520,000-token overnight window, roughly 2.5%.** After three runs it re-fits to the diary's own cost.
- **Settle one coupling:** the reserve must open **after the 22:40 drill compile**, or it starves the very Rest Room pass the drill sheet reads.
**Two honest degradations that will remain:** a laptop asleep from 03:00 to 07:30 means no diary that morning, and it must be announced as an absence at kickoff. Three failed validations means the job sits out that shift — correct behaviour, but it must be visible, or a validator bug will look like a meter bug.
**Reversal:** the reserve is one number in one place; set it to zero and the night is exactly as today.
**Coupling to state plainly:** **without the governor the reserve does nothing**, because the lanes that starve it are the ones that do not ask. Both ship together or neither ships.
**His word:** no.

---

### KAAM 5 — the zombie card
**What is broken:** a card claims the night renders are stopped and asks for a Gemini login. It reads the last 25 rows of a log **with no time window**, and all 10 matching rows are from 17 July. **No configured job uses that engine at all**, so the world can never contradict it. Its claim is also just wrong — the renders run; they broke for a completely different reason (KAAM 1).
**The fix:** a lane may only speak if its engine is **actually wired to a job.** Today that is zero, so the card dies at the next sync with a true reason written down. For the day he wires Gemini back: a freshness test at the **live end** of the log, with a **written, sourced window** — not "same local day", which is too strict and silently disarms the alarm, because a job running at 02:40 and a ledger head at 07:44 sit on different sides of midnight. **Gate the lane, do not delete it** — it wakes by itself the day he reconnects.
**The general law this creates:** every card lane must declare **how it retires**, and the test suite checks it. A lane with neither "step aside when the world is fixed" nor "the new one replaces the old" is a defect. Two lanes have neither today. That is why cards pile up.
**Zero-code path available now:** **he can kill this card today with one word** — one haan or na retires it permanently and it can never be re-minted. Ship the wiring test for the class, but the card itself does not have to wait.
**Reversal:** revert; the deck re-derives from live state at the next sync and no state is lost.
**His word:** optional — one word ends it today.

---

### KAAM 6 — the card deck
**What is broken:** **22 cards, 35 deals, zero answers ever, 15 live.** They were barely ever put in front of him — exactly **1 of 35 deals** landed in his 07:00–12:00 morning window, and that one was 25 minutes old when this was written. Twelve of the 35 fell inside build sessions between 01:42 and 08:08 this morning. One card absorbed 19 deals by itself.
**And the deeper reading:** of the 15 live cards, **eight ask for his TIME, not his DECISION.** "Yes" costs 5–30 minutes; "no" kills the thing; **silence is a rational third option** — and silence is exactly what the data shows. Zero answers is not carelessness. It is the correct response to a deck that mostly asks for time.
**And the fifth cause: canon invited the flood.** CLAUDE.md tells every session "never hand him a report, file a card instead." Sessions obeyed. The fault is in the constitution, not only the code.
**The fix:**
- **Sort all 21 lanes into three kinds.** AUTO: the machine acts and writes down what it did, reversibly. DRIVE: the machine does 100% of the work and he gives one click or one word inside a surface he is already in. WORD: constitutionally his.
- **Four WORD lanes, and that is the honest maximum:** a fact about him entering or leaving memory · a canon document changing · what he reads in the outward loop changing · him delegating his own judgment. **One live card per lane, new replaces old.** In an ordinary week the deck is **empty**. Silence is the designed state.
- **Read receipt.** A card is spent when a human actually types something after it, not when the machine prints it. A build session or a 05:41 boot deals silently and **keeps the card fresh for his real morning.**
- **Demotion, not expiry.** After three unheard hearings a card moves to a notices board — stops asking, keeps its full history, destroys nothing. On ship day every existing card is already past three (one is at 19), so counters start at zero on ship or the migration is written down explicitly.
- **Defaults describe, they never act.** Every card states what happens if he says nothing, and the answer is always "it moves to notices". **No lane acts on a countdown.** Taking a decision from his silence is still taking a decision.
- **The word-catcher is DROPPED.** Measurement is decisive: across 1,311 recorded messages he has typed a bare "haan"/"na"/"nahi"/"baad" **zero times**, and a bare "yes" seven times — every one answering a question an assistant had just asked, in a build session, on a day a card had been dealt silently. The hook cannot forge his word, but it **can bind a real word to the wrong question** — and one of the dispatch targets is "forget a fact", which has no undo. Instead: the prefixed form that already works, plus one line of prose dealt with the card telling the session to dispatch on his spoken word. That was the actual gap.
- **Undo for every recorded word**, and a tombstone before anything automatic can reach "forget a fact" — now doubly necessary, because two of those facts are already public.
- **Every card line rebuilt from live state at each sync**, so no card ever quotes yesterday's number — and the answer records the line that was actually dealt, because the line can change.
- **Both new files gitignored from birth.**
**Three triage corrections:** the capsule co-write lane may only pre-fill a doubt back-write, never the nine sacred prose fields · the login alarm card stays until the alarm is seen to ring once (address first, remove second) · the capstone review, if it moves to an agenda, must persist until closed rather than appearing once and vanishing.
**Reversal:** every demoted card keeps its full history; turn a lane back on and it re-mints.
**His word:** one — permission to edit the CLAUDE.md paragraph that invited the flood, because that is a canonical file.

---

### KAAM 7 — canon rot *(waits for KAAM 6 — sequencing, not parking)*
**What is broken:** canon states a status, the world moves on, and nobody is watching the gap. Five confirmed today, all leaning the same way — **canon under-reports what is running:**
- The ledger calls the push organ "dormant, zero scheduled tasks" on the morning it pushed to the public internet at 03:45.
- The clock calls the turnstile down while its port is listening.
- The brain config still says the poster and wall are frozen since 21 July while both are rewritten every 30 minutes.
- **The largest: canon says the Rest Room's whisper join has never fired once. It fired 7 times in 3 days, most recently about 7 hours before this was written.** This is entry #1.
- Canon says the Manager's later stages are not built, of an organ that produced a real Opus team sheet yesterday and has run 47 times.
And one that must be honoured: **the Gaffer's status line is still true.** The register has to be able to say GREEN, or it is just an accusation machine.
**The fix:** a claims register. Each entry ties one canon sentence — quoted word for word, so it survives line numbers moving — to a probe **the organism already runs**: a port check, a scheduled-task lookup, a file-time comparison, a state-field read. **No new probes may be written for the register.** That single constraint is what stops it becoming an infinite linting project.
**Entries arrive two ways only:** rot actually caught (starting with the five above), or a claim that names its own probe as it is written. **It is a scar list, not an ambition.** It cannot grow faster than reality catches canon lying.
**Laws and rulings are exempt by construction.** Only status claims are eligible. That clause is what guarantees the machine can never argue with his ruling.
**The ambiguity clause, now doubly proven:** the turnstile's port is open, its scheduled task is Disabled, **and that is correct by design.** So a "task disabled means RED" probe would be exactly as wrong as a "port open means GREEN" probe. **Every probe answers that claim's own question, and where a claim is ambiguous between "a process is running" and "an organ is wired", the finding is "this claim is ambiguous" — never a verdict.** A probe that answers a different question is worse than no probe, because it launders a false GREEN into the audit trail.
An entry whose quoted sentence no longer exists is a **loud finding** — "the claim I was watching has vanished" — never silence.
**Where it runs:** on the nightly watchman. No new schedule, no new daemon. Its own append-only journal so the same rot is not rediscovered from zero every three weeks — which is what actually happened across three audits.
**The SessionStart brief gets nothing.** Not one line, not one counter. That 12,000-character budget once silently dropped 1,957 of his own memory cartridge's 4,157 characters. Canon hygiene never competes with his memory for those bytes.
**The card surface waits for KAAM 6.** Adding rot cards to a deck with a 0% answer rate only makes more unanswered cards. Until then contradictions appear where the watchman's REDs already appear, plus an on-demand report. **This is a sequencing dependency with a written reason, not a park.**
**Separately, and not a register entry:** the Manager's scheduled read is **9 ok / 38 failed**. No canon file mentions it. It is a live problem in its own right.
**Reversal:** register and journal are both new and standalone; delete them and the watchman is exactly as today. **No canon file is touched by this design.**
**His word:** none until KAAM 6 lands.

---

### KAAM 8 — the probe seam *(waits for KAAM 3)*
**Nothing is broken. This is a ruling wearing a bug's clothes.**
Two night jobs write his interview probes and distractors on Claude. Moving them to the free pool frees Claude window — but it looks like it touches his sealed line. **Traced live: it does not.** Both banks are read in exactly one place, the live voice room, plus the cartridge pasted into his Examiner Gem. **Neither Jirah organ touches these banks** — his foundations Jirah questions come cold from the capsules' nine axes. And that voice room is itself on Gemini's free tier, so **these probes are already being spoken to him by Gemini.** Only the writing of the string happens on Claude.
**The prize is small** and its numbers were **not verified in this pass** — re-measure before quoting them.
**Do not touch the grading lane.** It measures a probe's difficulty by the **spread between three independent answers.** The spread of three answers from one model is a different instrument from the spread of three from another. Changing it quietly changes the definition of the number the whole bank sorts on. It is also the largest of the three — **the cheapest saving is the one you must not take.**
**The proposal is not a migration, it is a blind bake-off.** Both engines write probes, each files into its own journal with no engine label, and the voice room serves them mixed and unlabelled so he cannot tell who wrote what. The question the data answers is not "which is cheaper" but **"whose probes find his real cracks."** A probe he answers "knew" and gets right taught him nothing.
**Three corrections before starting:** the reading surface is empty — he has not been in the voice room since 5 Aug — so the run's clock counts **probes actually served**, not nights, or an empty room reads as "Gemini failed" · the path from a probe back to a rep has to be written down, because nothing today records which engine wrote a probe · the free pool is shared with the voice and embedding lanes, so the experiment needs its own named tank and the old lanes need a floor.
**Why it waits:** pricing a trade in a currency that is about to change gives the wrong answer. And the reason is now sharper — **the currency is per-lane**, and one of the three probe lanes prices in **calls**, not tokens. A token-denominated trade cannot be judged against a call-denominated budget.
**A new data class crosses here:** the distractor prompt carries his recorded confusion shapes to Google. His sealed "read my data if you like" was about **throw-ins and dugout lines** — a named class. **This is a different class, so it is being asked, not assumed.**
**Reversal:** delete the experiment journal, stop generating the second side. Nothing migrated, so there is nothing to migrate back.
**His word:** two — see section 7.

---

## 5. THE LAWS THE BUILD MUST OBEY

1. A comment, a config note, a `.md` file or a previous agent's report is **never evidence** — it is a claim to be tested.
2. **No number is guessed before 30–60 days of real data.** The meter is under this law exactly as hard as the DMN's depth is.
3. **AI proposes, code validates, he approves.** The machine never auto-acts on a judgment call.
4. **Layering, never replacing** — the old engine stays frozen in the same file, and the migration note says why.
5. **One writer per state file.** Never hand-edit a state file.
6. **If a thing needs the captain it rides an anchor he already hits; if it cannot ride an anchor, it does not need the captain.** Maximum one card per anchor.
7. **Silence is never consent.** No lane acts on a countdown; a default may describe what happens, never decide it.
8. **Nothing is done until it has actually run**, and the output is shown.
9. **Every reversal path is written before the change is made** — one command, named in the same commit.
10. **A probe answers its own claim's question.** Ambiguous means "ambiguous", never a verdict — a false GREEN in an audit trail is worse than no probe.
11. **Simulation is not observation.** A simulated probe that becomes a graded rep is a lie in the calibration data; mark it, and let downstream organs drop it.
12. **His sealed rulings are exempt from every mechanism here** and can never be argued with by the machine.

---

## 6. HOW TO PROVE IT WORKED

### After one night, without opening a single log

- **"The read" is back on the wall** — three honest lines about his week where it currently says "held at the gate". This is the most visible change. **But note honestly: on the measured record it fails 3 nights in 4 unless the validator snapshot fix ships with it.**
- **The poster card and the page it opens carry the same date.** Today the button says 2026-08-10 and the page says 2026-08-09.
- **A diary page exists** in a folder that has never existed.
- **One drill on his sheet comes from the Rest Room**, with a source line saying when it was dreamed.
- **One fewer card in the deck** — the Gemini-login one, gone with a true reason.
- **Two numbers side by side in vitals** — today's and the candidate — plus how many rows could not be measured. **If the two are exactly equal, nothing was wired. That is the canary.**

### The commands that show it

```
ls dressing-room/state/brain_out/diary
```
```
powershell -NoProfile -Command "Get-ScheduledTaskInfo -TaskName 'ArsenalFC-Evening-Conductor' | Format-List LastRunTime,LastTaskResult"
```
```
node -e "const fs=require('fs');console.log(JSON.parse(fs.readFileSync('dressing-room/state/token_vitals.json','utf8')))"
```
```
node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('dressing-room/state/captains_call.json','utf8'));console.log('cards',c.cards.length,'live',c.cards.filter(x=>!x.retired_at).length,'answered',c.cards.filter(x=>x.answer!=null).length,'deals',c.cards.reduce((a,x)=>a+(x.dealt||[]).length,0))"
```
```
node -e "const fs=require('fs');console.log(JSON.parse(fs.readFileSync('dressing-room/state/dmn_precache.json','utf8')).entries.map(e=>e.concept))"
```
```
npm test
```

### After one week — and this is the more important test

- **Seven diary pages, or fewer with a written reason for every absence.** "Six of seven, one because the laptop was off" passes. **"Four of seven, no reason written" fails — and that is the more important failure.**
- **Deck at 0–2 cards**, most mornings silent.
- **One line in the day summary that has never existed in this organism:** did the whisper land or not.
- **The first honest per-lane reading** of which organ actually spends what.
- **The wall book holds either zero rows** (no walls hit) **or one properly deduplicated row.** Both are wins.
- **The DMN's file holds more than one pass's worth of dreams**, and the ledger shows about 4–5 passes a night instead of 8–10, with depth still at 25.

---

## 7. WHAT NEEDS HIS WORD

Seven questions. Nothing else in this document needs him.

1. **Those two private lines are already in git history. Rewrite the history, or just stop the bleed today?** *(Rewriting is not a full erase — forks and caches keep copies.)*
2. **The medication log is on the public remote with four drug names in it. Untrack it, or leave it?** *(This class was never named in the 5 Aug ruling.)*
3. **Can the machine apply a measured threshold tune, inside a band it already declared, with a 14-day watch and automatic revert, without asking?** *(Yes takes the WORD lanes from four down to three.)*
4. **Can his recorded confusion shapes go to Google?** *(A different data class from throw-ins and dugout lines — asked separately, on purpose.)*
5. **Run the probe bake-off at all?** *(yes / no / later)*
6. **Permission to edit the CLAUDE.md paragraph that invited the card flood?** *(A canonical file — cannot be touched without his word.)*
7. **KAAM 0 through KAAM 4 as one sequence now — or tonight just the two smallest (stop the leak, bring back "The read") and the rest back in front of him tomorrow?**

**A question that was going to be asked and has been deleted:** "Calibration, learning-state and twin are Disabled — turn them back on?" **They are disabled by design. A yes would have broken a working chain. It is not being asked.**

---

## THE ONE LINE HE SAYS IN THE NEXT SESSION

**"Repo root mein HANDOFF_NEXT_SESSION.md hai — poora padho, phir usi order mein shuru karo."**