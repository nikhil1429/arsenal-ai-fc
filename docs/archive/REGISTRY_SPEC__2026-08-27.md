# THE REGISTRY SPEC — rung S6, 27 Aug 2026 (Fable 5 · effort max)

> The audit order §10-C S6(b): "THE REGISTRY SPEC on top of the atlas." This file is the DESIGN
> S10 builds from and the second half of HIS S6 decision (§10-E: the atlas + registry spec,
> haan/na). **Nothing in this file is built at S6** — his 20-Aug ruling held SHAPE 6 back for
> exactly this document, and the same law holds every other row here. The atlas it sits on:
> `scripts/flow_atlas.mjs` (535 witnessed edges, 27 Aug) · `dressing-room/state/flow_atlas.json`
> · `FLOW_ATLAS.html`. Read §9-D (PASS 4 FINAL) first — the eight shapes are this spec's why.

## §0 · WHAT THE REGISTRY IS, in one paragraph

ONE owner organ (`registry.mjs`, S10) holding TABLES OF ROWS that today live as literals inside
twelve mechanisms, as bullets inside live documents, and as facts inside sessions' heads. A row
is data; a mechanism reads its subjects from rows; adding a subject is a ROW EDIT with a receipt,
never a code change. That is the general fix §9 SHAPE 1 names ("a universal order, implemented
as an enumeration"), and it is his own 11-Aug law made structural: *"do not create jugad, do
permanent stuff."* The registry is also where the audit's other shapes get their standing
checks: consumption (3), key-completeness (4), the emit contract (6), material-shape predicates
(7), and receipt recomputation (8).

## §1 · THE CORE ROW SHAPE

Every registered subject carries, minimum:

```
{ subject          — what this row governs (a file, a lane, a job, a doc, a check)
  owner            — the ONE organ that writes/serves it (owners-only law, mechanical)
  right_consumer   — who must EAT its output for it to count as reached (§1's gate correction:
                     "did it reach its RIGHT consumer", never "did it run")
  slot             — when/where it fires (anchor · cadence · event), so slot-awareness is a
                     lookup, not a re-implementation (Shape 1 #6)
  spend_class      — free | tier0 | gemini | claude-role (LAW M: a ROLE, never a model name)
  trust_tier       — measured | hypothesis-with-receipt | prior | testimony (see §8 — every
                     self-declared count is testimony until a consumer recomputes it)
  subjects[]       — for mechanism rows: the subject list that was the old literal
  first_real_row_at— stamped by the reach-side meter (§4); null = never fed
  witness          — file:line / table row / ruling id that makes the row checkable (§6)
}
```

Two row EXTENSIONS carry classes the core shape cannot:
- **check rows** add `{evaluator}` — the {check · owner · evaluator} class ruled to the registry
  BY NAME (S5-Z2 F-2): a sentence-check whose evaluation dies with its owner is a row here, so
  the check outlives the session that wrote it.
- **doc rows** add `{vintage: spec | order | record, source_version}` — §4-B's "canon is mixed
  vintage" becomes a field, and Q-2's "nothing classifies which of the 197 are SPEC" gets its
  mechanical home.

## §2 · THE MIGRATION MAP — all 12 SHAPE-1 instances → rows (build order for S10)

| # | mechanism (nailed-to today) | registry row(s) that replace the literal |
|---|---|---|
| 1 | `shadow.mjs` — 4 named interruption types | `interruption_type` rows; earn-the-right-to-act reads the table |
| 2 | `bootroom.mjs` — `forge_profile.json` only | `mutation_subject` row #1 |
| 3 | `gate_tune.mjs` — `thalamus_config.tiers` only | `mutation_subject` row #2 — ONE proposal→validate→revert owner, two rows (kills the twin-copy signature: two files citing each other's allowlist) |
| 4 | `trust_tiers` — markets/predictions only | `trust_subject` rows; hit_rate→no_look generalizes by row |
| 5 | `tasks.mjs` — brain jobs only | `durable_exec` rows |
| 6 | slot-awareness — `gate.foldSlotAhead` + watchman's bad re-implementation | the core `slot` field; watchman READS it (its false `weld-broken` RED dies) |
| 7 | `isFixture()` sandbox pinning — samjhao only | `sandbox_subject` rows |
| 8 | `wall_review` — the poster only | `self_repair` rows `{artifact, laws, prompt_file}` — INTENT #4's real build (§9's correction: it exists, 1 of 34 jobs; give it a subjects table) |
| 9 | `audit.mjs docClaims()` — `.md` only | `doc_claim_subject` rows (`.ps1`/`.cmd`/skills join by row) |
| 10 | `teaching_audit` — one source, only inside FORGE | `audit_source` rows (695 unaudited prompts/6d was this literal) |
| 11 | `course.mjs` — singleton container | `course` rows (a new id ADDS) |
| 12 | `CORE_AXES = ["d"]` global + hand-mirrored twin | per-concept row in `concepts.json`'s own lane; the second copy dies |

Migration LAW: each instance moves in its own commit, gate-covered (lawpack's
`jugad-literal-subject-list` count must FALL by at least the migrated site — the baseline
ratchets DOWN with each row landed; today it stands at 102).

## §3 · THE RULINGS LANE (SHAPE 2) + THE STANDING-LAWS REGISTER

- **`design` disposition on the LAW A substrate** (`acts.mjs`): his build/architecture word →
  a dated orders row + ONE card. The ratchet stands as ruled in §9: `teaching_contract add`
  refuses build-shaped verbs without `--force-teaching` + a why (act `act-mszfck3c` — a
  pipeline order graded as a teaching rule — is the witness).
- **THE STANDING-LAWS REGISTER IS DERIVED, NEVER HAND-WRITTEN** (S6-DECIDES #1, decided): a
  deterministic collector (S10) reads `queue/RULING__*.md` + this order's §10-D and emits the
  register `{law_id · statement · source file · scope · check_site}`. The handoff's bullets are
  TRANSPORT; the ruling files are the RECORD; the register is a BUILD ARTIFACT off the record —
  hand-consolidating it would mint a second drifting copy (miss-#4's lesson, the architect's own).
- **MEMORY-INDEX RATCHET** (landed GREEN 27 Aug): every `memory/*.md` appears in `MEMORY.md` —
  an unindexed memory is a fact the organism has and cannot reach. Check: the §4-B classifier
  predicate in `s6-prep/manifest_check.mjs` I12, generalized into the register's check row.

## §4 · THE REACH-SIDE METER (SHAPE 3) — the fourth meter

Beside `treasury` / `limits` / `brain spend` (all cost-side): per registered lane,
`{first_real_row_at · newest_row_at · right_consumer's last read}` — stamped from payload rows
(never mtime — the readiness lesson). Its two standing checks, both xray-class suite queries:
1. an organ that writes a path no organ reads AND no anchor delivers = defect (Q2's family —
   the atlas's 11 orphan writes are the seed list);
2. selftest-green with `first_real_row_at === null` > 7 days = ONE line in `state.mjs`
   (the heartbeat-that-proves-only-the-heartbeat class).
**Q-21 COLLAPSES INTO THIS BUILD** (routed: treated as one hole with SHAPE 6 until proven
otherwise): his own output-definition — axes closed · doubts closed · Bolo clarity · cracks
fallen/filled · asli-padhai minutes — is, item for item, the learning record. The meter that
proves the record is fed IS the output-quality floor. The cold-retrieval half (does it SURVIVE)
stays Re-Jirah's, gated by his own 19-Aug ruling until the four samjhao close.

## §5 · SHAPE 6 — THE EMIT CONTRACT (designed here, built at the registry's rung)

Every surface that may write the learning record declares a row:

```
{ surface: capture.mjs | rejirah.mjs | forge_session.mjs | gist(mirror.mjs) | <future>
  writes_to: reps_log.jsonl | rejirah_log.jsonl | forge_sessions.jsonl | capsules/
  fired_by: "him" | organ-name          — "him" is FIRST-CLASS; the meter holds it, so a
                                          him-lane's silence reads as THE WOUND, never health
  cadence: declared per surface          — what "quiet too long" means for THIS surface
  taught_event: emitted?                 — see the coldness hole, below }
```

- **Declare-or-die:** a surface with no row may not write; a lane with no declared writer is a
  finding at spec time. The atlas's ghost-read list (57, `rejirah_log` its largest) is the
  born-red seed the contract turns green lane by lane.
- **The input-side ratchet** (Shape 3's query pointed at inputs): a declared surface whose lane
  has `first_real_row_at === null`, or whose newest row is older than its own declared cadence,
  is a defect line in `state.mjs`. The form is proven: `rejirah.mjs close` already refuses to
  claim a round until the mirror returns.
- **THE COLDNESS HOLE IS CONSUMER-SIDE INSTANCE #1 (S6 owns it, designed here):** the contract
  adds a **`taught` event** to the emit rows — `samjhao` teaching an axis EMITS `taught(concept,
  axis, at)`; `deep.mjs`'s `burnedAxes()` consumes it, so a warm axis can never be served
  COLD-CALLED again (today `samjhao.mjs:349` counts a burn only off a "guess" event the in-force
  design never writes). The interim law (fresh hand-written Re-Jirah questions for samjhao'd
  concepts) STANDS until this event exists.
- **THE BACK-FILL IS THE BUILD'S DONE-PROOF (named 21 Aug, honored here):** the rung that builds
  this contract ingests the switch-off week's raw study facts (out-of-repo, append-only) through
  the new contract as its acceptance test — real data or it did not land.
- The four him-edges' honest stamps, frozen into this spec from the atlas build of 27 Aug:
  reps 21 rows · all `gem` · newest 10 Aug — rejirah NEVER BORN · 9 readers — forge 11 closes ·
  every `jirah:0` — gist: his paste is the only master write.

## §6 · WITNESS VALIDATION — for agent findings and for every registry row

- **A witness the IR cannot resolve validates NOTHING.** The finding stays a LEAD, and the IR
  gap itself becomes a finding (already live: xray's `unresolved_sinks` is a monotone budget,
  1353 today). Applies to S6+'s concern-agents and to every row's `witness` field.
- **The amplifier law bounds the design** (ruled S6 input, 27 Aug: yield ≈ square of per-side
  pass rate): a validation that demands TWO independent matches where ONE protects the property
  squares its false-drop rate. So: witness validation demands exactly ONE resolvable anchor per
  claim; corroboration is welcome and never required. (The 3rd standing law's frame: strictness
  is measured against the protected property.)
- **Run-vs-law is a field:** `trust_tier` distinguishes measured / hypothesis-with-receipt /
  prior / testimony — the B15 epistemics note ("a run of N is a RUN, not a LAW") and the
  Q-18/Q-19 interim ruling (behavioural claims about HIM are PRIORS; the status marker is this
  field on doc rows) both land as data, not as vigilance.

## §7 · THE FOURTH EDGE CLASS — spec→derived-copy

Row shape `{source_file · source_version · derived_file · declared_version}`; check: versions
equal or the row is RED. Live instance (atlas-verified at every build, drifted TODAY):
`THE_GAFFER.md v2.2 → dressing-room/manager/system.md declaring "THE_GAFFER v2.1"`. Second
candidate at migration time: every `*Legacy` frozen twin. The atlas renders this class as its
own band; the registry makes it a checked row.

## §8 · SHAPE 7 + SHAPE 8 RATCHETS (named at §9-D, standing checks here)

- **SHAPE 7 (a predicate assuming a material shape):** every material-shape predicate (line
  arity, escaping, rendering, alphabet, wrapping, day-key format) is REGISTERED with the
  property it assumes, versioned, and bitten in BOTH directions. The payloadfence/mdrender
  single-site pattern is the template; the registry's row is what makes "which fence" ONE
  question at ONE site. The 28-item rendered-tier gap (§9-C.3) is this shape's open instance —
  **disposition: its own ruler-priced rung, no earlier than S7, on HIS haan of this spec.**
- **SHAPE 8 (a receipt is testimony):** any gate reading a self-declared count/coverage field
  without recomputing it in the same expression is a lawpack finding (new rule, S10, frozen at
  its measured baseline like every gate — and it may only get stricter). `verify`'s recompute
  pattern is the reference implementation.

## §9 · WHAT S7–S12 CONSUME FROM THIS SPEC (so no rung re-derives)

- **S7 · GATE C** — the `right_consumer` field is the gate's subject; the reach-side meter's
  check #1 is its acceptance.
- **S8 · THE SPOOL** — reads `token-plan-audit-14aug` (two proven levers: system-prompt cache
  split · `--resume` full-context) + `spend_class` rows; Q-13's retention/rotation of raw
  copies is a ledger row here.
- **S9 · OWNERSHIP** — `owner` field mechanizes the header grep; Q5 stays 0 by construction.
- **S10 · THE REGISTRY BUILD** (Fable · max) — everything above, in the §2 order, each
  migration its own commit; plus the standing-laws collector (§3) and the SHAPE-8 lawpack rule.
  Acceptance list: (a) all 12 migrations landed, lawpack jugad count ≤ 90 (102 − 12); (b) the
  reach meter stamps `first_real_row_at` on every registered lane; (c) the emit contract's four
  rows live with the back-fill ingested as §5's DONE-proof; (d) `flow_atlas check` joins
  `npm test` (the atlas goes stale-proof the day the registry exists); (e) every check row
  names its evaluator.
- **S11 · STALENESS/KEYS/CRASH** — the roster freshness gate reads `slot` + `trust_tier`
  (a 10-hour-old "ok" may never answer for now); clipboard = instrumentation-first per the
  ruled series.
- **S12 · STAGED REBOOT** — re-enables BY REGISTRY ROW, stage by stage, his haan per stage;
  the Q-11 capture-loss fix lands before/with any stage that re-enables voice/Gaffer/Gemini.

## §10 · S6-DECIDES — the ten, each answered (packet law: they were named, unresolved)

1. Standing-laws list → DERIVED register, §3. Owner: S10's collector; hand-consolidation refused.
2. 30-vs-55 answers → **30 is the number** (read from the artifact, §9-C.1's own instruction);
   "55" was a transport-era count. Nothing gates on it; recorded here, closed.
3. `dropped.json` → NOT OPENED at S6 (honored). It stays named-poisoned under §9-C.4's bounds
   law; any future read is a new ruling's to grant.
4. Depth/invention tables named twice → ONE input through two doors; no mechanical difference.
   Closed as a naming artifact.
5. Queue routes MORE Qs than the row's nine → **the routing block's fuller set governs** (it is
   the architect's later word): Q-13's ledger line joins S8's row above; interim rulings on
   Q-18/19 land as the `trust_tier` field (§6).
6. Two live files → **PIN AT OPEN** (done: handoff sha16 `2499fee160d30120` · 77536 B pinned in
   the S6 micro-order + PROGRESS; ecosystem map unchanged since packet). Re-read current, never
   trust the pin as content.
7. I09's grep over-collects → READ made (all 32): ~20 carry live S6 work/evidence (platform
   classes, evidence tables, registry-bound classes, on-demand rights); the rest are standing
   laws that bind but add no S6 task. The read's verdict table is in the S6 PROGRESS entry.
8. The 38 memory files → §4-B classified, one line each (§9-D), all 38 indexed; ratchet §3.
9. R01–R04 → **RETIRED AS SUPERSEDED** (L9: kept on disk, DO-NOT-FIRE stands permanently).
   Canon-B answered their question at the proven 10-file shape; a future whole-canon Gemini
   read is a NEW rung with a fresh design. No re-design inside S6.
10. Amplifier fact's single occurrence → confirmed the whole of it in the order (1 occurrence +
    its ruling); it lands in this spec as §6's bounding law, so it now has a code-adjacent home.

## §11 · THE ECOSYSTEM DECISIONS ROUTED TO S6 (map buckets 2, decided here)

- **Workflow multi-agent for S6 itself** — NOT USED; one Fable head fit the ceiling. The ≤4
  concern-agent right expires with S6 (it was this rung's, only).
- **DuckDB MCP (read-only TIER-0 analytics)** — ADOPT AT S10, through §0's adoption contract
  (evidence → declared owner → gates that bite → L5's window). Read-only mount honours
  owners-law. It is the natural evaluator for §4's meter queries.
- **Playwright / Chrome-DevTools MCP** — POST-S12, judged against the S5 transport catalog
  (send-commit, activation death, one-shot downloads, clipboard). Not before reboot.
- **Artifacts-with-capabilities for the visual surfaces** — the design lane prototypes ONE
  page only on HIS ask; FLOW_ATLAS.html stays the S6 deliverable (local, zero deps).
- **project-artifact plugin (living status page)** — REFUSED for now: a page he must remember
  to open is L7's exact prohibition. If a card-anchor ever IS a page, revisit.
- **Anki-MCP vs Re-Jirah** — evidence question, blocked on §4's meter (Q-21). Re-Jirah stands;
  revisit only with output-survival data in hand.
- **Q-16 (a Fable tier inside the brain)** — CLOSED for now: no lawful SDK path on Max (LAW M
  forbids API keys); Fable remains the architect role + the two ladder summits (S6 · S10). If
  Max-auth SDK ships, it enters as a `spend_class` roster row, one canary, version commit.

## §12 · WHAT THIS SPEC DOES NOT DO

No code beyond the atlas was written at S6. The 28-item gap is not patched. SHAPE 6 is not
built. No organ was re-enabled. The registry itself is S10's — this file is its contract, and
HIS haan/na on (atlas + this spec) is the gate S7 waits behind (§10-E).
