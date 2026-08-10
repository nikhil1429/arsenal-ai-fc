---
name: genome
description: Review the Boot Room's pending mutation — evidence, predicted effect, revert plan — and approve with the captain's word. Use when he says "genome", "mutation", "boot room", or Monday's sheet mentions a filed proposal.
---

# /genome — the method changes only through your mouth

1. Read `dressing-room/state/mutations.jsonl` — find status "proposed".
   None, or the file does not exist yet (it is born with the first proposal)?
   Say "no proposal filed — the genome is quiet" and stop.
   (corrected 10 Aug 2026 — the path and the birth-on-first-proposal are both TRUE
   (`grep -n "const MUTS" scripts/bootroom.mjs`; the file is created by the append at
   `grep -n "appendFileSync(MUTS" scripts/bootroom.mjs`), and `bootroom.mjs` is its ONLY
   writer — physio merely reads it. Three things this step did not say, all verified live:)
   - **Say the COUNTER, never a bare "quiet".** The organ itself stopped publishing a
     verdict with the count filed off (audits #102/#106, the UNGATE): its own no-proposal
     line carries have/need —
     `grep -n "the genome is listening, not proposing yet" scripts/bootroom.mjs` — and
     physio republishes the same number. Read both LIVE, never from this file:
     `node -e "const v=require('./dressing-room/state/loop_vitals.json');console.log(v.speak_gate_counters.bootroom_mutation.line,'·',JSON.stringify(v.genome))"`
     plus the last real run at the tail of `dressing-room/state/bootroom_log.jsonl`.
     "The genome is quiet" is honest only WITH its climb attached.
   - **A SECOND lane files in the very same grammar, and /genome cannot approve it.**
     nightshift's wind tunnel writes a full Boot-Room-grammar proposal (all 8 fields,
     `status:"proposed"`) for thalamus_config → tiers into
     `dressing-room/state/brain_out/nightshift/wind_tunnel_<date>.json`. Its owner is
     `gate_tune.mjs` (`apply <wind_tunnel_*.json|latest> · score · status · selftest` —
     `grep -n "^// MODES:" scripts/gate_tune.mjs`), NOT the Boot Room: `bootroom.mjs approve`
     would hard-reject that target, because validateMutation demands it resolve inside
     forge_profile.json (`grep -n "target does not resolve into" scripts/bootroom.mjs`).
     So check that lane before declaring silence: `node scripts/gate_tune.mjs status`.
     (On 10 Aug 2026 it answered "live mutation: none · newest proposal:
     wind_tunnel_2026-08-10.json" while mutations.jsonl did not exist at all — i.e. saying
     "the genome is quiet" would have been wrong that very day.) `captains_call.mjs` deals
     that one as its OWN card and his haan there runs `gate_tune.mjs apply` — it never
     routes through this skill (`grep -n "gate_tune" scripts/captains_call.mjs`).
   - mutations.jsonl is a ledger that `approve` and `score` REWRITE whole
     (`grep -n "writeAtomic(MUTS" scripts/bootroom.mjs`), so read the LAST row per id —
     physio does exactly that (`grep -n "genomePending" scripts/physio.mjs`).
2. Present the ONE proposal (≤8 lines): target · current → proposed value ·
   evidence lines verbatim · metric + review window · the auto-revert plan.
   Never advocate. Never stack multiple proposals (serial law).
   (field names, verified 10 Aug 2026 against validateMutation's required set —
   `grep -n "for (const f of" scripts/bootroom.mjs`: `target` · `diff.old → diff.new` ·
   `evidence[]` · `metric{name, min_events, window_days, improves_when_below}` ·
   `review_after_days` · `revert_diff.new` · `predicted_effect` · `id`. A proposal MAY
   additionally carry `human_note` — the newest season file's own first line, spliced as
   WORDING ONLY, never a target and never a number
   (`grep -n "human_note" scripts/bootroom.mjs`). Read it as colour; it is not evidence.)
   (corrected 10 Aug 2026: "never stack multiple proposals (serial law)" named the wrong
   law — this said it until today. The SERIAL LAW is enforced at APPROVE and only on LIVE
   mutations: "one live mutation at a time; score the live one first"
   (`grep -n "SERIAL LAW" scripts/bootroom.mjs`). Filing is capped only PER CALENDAR DAY
   (`grep -n "filedToday" scripts/bootroom.mjs`), and nothing in the code retires an
   unanswered proposal — so mutations.jsonl CAN accumulate more than one "proposed" row
   across Sundays. The presentation rule stands verbatim — show him ONE — but if the file
   holds several, say so out loud and present the newest; never assume it can hold only one.)
3. His word is the gate:
   - "haan, chalao" / "approve" →
     `node scripts/bootroom.mjs approve <id>` — then confirm: old value is in
     legacy{}, review fires in N days, auto-revert armed.
     (verified 10 Aug 2026: the command and all three confirmations hold —
     `profile.legacy["<target>@<YYYY-MM-DD>"]` takes the old value verbatim
     (`grep -n "profile.legacy\[" scripts/bootroom.mjs`), the run prints
     "review in Nd", and the revert fires from the proposal's own `revert_diff`.
     Four things the step left out, each of which can bite mid-flow:)
     · the row must STILL read `status:"proposed"` — an already-live/kept/reverted id
       prints "no proposed mutation with id …" and EXITS 1
       (`grep -n "no proposed mutation with id" scripts/bootroom.mjs`).
     · approve can REFUSE: a live mutation (serial law) or any validation error prints
       "bootroom: REJECTED — …" and exits 1, writing nothing
       (`grep -n "bootroom: REJECTED" scripts/bootroom.mjs`). Dry-run it first if unsure —
       `node scripts/bootroom.mjs validate <id>` runs the identical checks read-only
       (`grep -n "^// MODES:" scripts/bootroom.mjs`).
     · "review fires in N days" is a FLOOR, not a promise: at review time, if the metric's
       own event count is under `metric.min_events` the window AUTO-EXTENDS by 7 days
       rather than judging (`grep -n "review_after_days + 7" scripts/bootroom.mjs`).
       Auto-revert is armed for the day it IS judged, not for day N unconditionally.
     · a successful approve also appends one human-readable line to `SEASON_CHANGELOG.md`
       at the REPO ROOT (`grep -n "appendFileSync(CHANGELOG" scripts/bootroom.mjs`) — that
       file is born on the first approval; it did not exist yet on 10 Aug 2026, check live
       with `ls SEASON_CHANGELOG.md`. Extensions deliberately skip it; only KEPT/REVERTED
       reach the changelog. Every run, refusal included, also leaves one row in
       `dressing-room/state/bootroom_log.jsonl`.
   - "nahi" / anything else → leave it proposed; it expires quietly.
     (CORRECTED 10 Aug 2026 — "it expires quietly" was FALSE and this said it until today.
     There is NO expiry anywhere in the organ: `grep -niE "expir|ttl" scripts/bootroom.mjs`
     returns nothing, and no mode rewrites a "proposed" row except `approve`. The row sits
     in mutations.jsonl indefinitely, and physio turns it into a recurring BLEED —
     "the boot room filed a proposal — /genome for your word when ready" — for as long as
     any row reads "proposed" (`grep -n "genome_pending" scripts/physio.mjs`; the trigger is
     `grep -n "genomePending" scripts/physio.mjs`). So a "nahi" does not end it quietly; it
     re-asks him at every kickoff. Tell him that plainly when he declines — and do NOT
     hand-edit mutations.jsonl to silence it (machine-owned, bootroom.mjs is sole writer).
     Whether a declined proposal should get a retirement path is HIS ruling, not a doc's.)
4. NEVER propose mutations yourself in this skill. NEVER touch targets the
   whitelist forbids (medical/ladder/goalkeeper/honest-frame) — if he asks
   for one, name the constitutional line and refuse warmly.
   (corrected 10 Aug 2026 — the forbidden list is WIDER than the four named here, and a
   session quoting only these four would wrongly tell him a fifth was allowed. The live
   regex is `medical | ladder | goalkeeper | governor | oura | readiness | honest | doctor
   | verdict`, case-insensitive — read it live, never from this line:
   `grep -n "const FORBIDDEN" scripts/bootroom.mjs`. Two mechanics worth knowing before you
   promise him anything: it is matched against the target AND against the whole `diff` JSON,
   so smuggling a forbidden word into a value is rejected too
   (`grep -n "FORBIDDEN.test" scripts/bootroom.mjs`); and the WHITELIST proper is not a list
   at all — the target must RESOLVE as a dot-path inside `forge_profile.json`, which is the
   Boot Room's sole write target (`grep -n "the whitelist IS the profile keys" scripts/bootroom.mjs`).
   Anything outside that file is already outside the genome, forbidden-word or not.)
