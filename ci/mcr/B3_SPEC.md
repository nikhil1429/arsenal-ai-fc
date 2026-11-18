# B3 · THE THREE DONE CHECKS IN ONE COMMAND — SPEC (unit mcr, item B3)

> A SPEC for the architect. **Nothing is built.** Base: `origin/main` at `074ead9`. Every fact names its file:line at
> that base; what this seat cannot read is **UNREAD** by name — never a zero. No state file's content is quoted.

## 0 · The plan text

- **Plan v3:** B3 left = the three DONE checks of plan v2 §8 in one command (orphans · green rungs by clause and by
  loop · rule-witness coverage) plus open units by clause; `scripts/xray.mjs` graph reused; the reach reader plan v2
  named does not exist and is part of this unit. One line rides the morning sheet anchor.
- **Plan v2 §8 (his Hinglish, as the brief carries it):** the three DONE checks from one command, daily, one line to him;
  every rung: witness RED today → GREEN on his real day → the meter byte-unchanged → the old recorded day still RED;
  every loop: its sheet, its page, the acts receipt of his sitting, its ladder hash; census: 0 PENDING, every piece a
  fate and a rung or serves no step.
- **UNREAD:** plan v2 itself, the campaign's rung witnesses, its fate/census table and its forks ledger all live in the
  campaign repo (`campaign-2026-09/…`), which this repository does not carry (`ls campaign-2026-09` → absent).

## 1 · MEASURED at the base

### 1.1 What `scripts/xray.mjs` already answers

| Mode | What it prints / returns | Where |
|---|---|---|
| `build` | the IR: organs parsed, every file ↔ organ read/write edge, `unresolved_sinks` (a non-increasing budget), the root sets (schtasks rota, `.claude/skills/*`, `.claude/settings.json` hooks, doc-cited verbs); writes `dressing-room/state/xray_graph.json` (SOLE WRITER) | `scripts/xray.mjs:3-4`, `:752-860`, `:860-1003`, `:1345` |
| `report` | Q1 DEAD READ · Q2 LAW BREACH (more than one writer) · Q3 ORPHAN LANE (written, never read) · Q4 GHOST STATE (on disk, untouched) · Q5 UNDECLARED WRITER, then the verb graph and spend edges | `:1187-1215`, `:1040-1079` |
| `q` / `verbs` | the same queries / `verbGraph` as JSON; **rebuild by default** (`--cached` reads the committed IR) | `:1347-1358`, `:1081-1177` |
| `verbGraph(ir)` | `orphanVerbs` (a verb nobody invokes, no doc cites), `brokenEdges`, `humanOnly` (doc-cited only), `headerDrift` | `:1081-1100` |
| `spendEdges(ir)` | every `llm` spawn by organ and line | `:1178-1182` |
| `swallow` | long swallowing try-blocks with fs inside | `:1359-1366` |
| exports | `build`, `save`, `queries`, `verbGraph`, `spendEdges` — reusable in-process | `:860`, `:1003`, `:1040`, `:1081`, `:1178` |

Inputs: Q1 and Q4 read the DISK (`ir.on_disk`, the state dir walk) — **LIVE**; Q2, Q3, Q5, `verbGraph` and
`spendEdges` read only code + the root sets — **computable from this repo alone**.

### 1.2 The morning sheet anchor and its one-line door

| Fact | Where |
|---|---|
| The morning sheet is `dressing-room/state/team_sheet.md`; `scripts/manager.mjs` is its SOLE WRITER (with `manager_notes.json`) | `scripts/manager.mjs:21-22`, written `:1005` |
| It is built by the conductor's `sheet` step at 08:45 (`brain.mjs tick`) | `scripts/conductor.mjs:125` |
| manager.mjs READS a fixed list (readiness, timeaudit, cards, calibration, weaknesses, learning_state, season, season_read, buckets, captain_note.md, post_match/<yesterday>.md) — no slot a foreign organ can write a line into | `scripts/manager.mjs:15-20` |
| `/matchday` is the anchor that reads it: state line first, then the sheet, then `captains_call.mjs deal` | `.claude/skills/matchday/SKILL.md:10-40` |
| The one-line door for anything needing his word: `captains_call.mjs file --line "…" --key <k>` (idempotent by key; ONE card per deal) | `scripts/captains_call.mjs:1731-1745`, laws `:20-35`; CLAUDE.md "THE CAPTAIN'S CALL, 7 Aug 2026" |
| The one STATE line (`state.mjs`, modes `line` / `json` / `week`) is the other line he sees at every anchor | `scripts/state.mjs:456-459` |

### 1.3 What a reach reader would stand on (none exists)

| Fact | Where |
|---|---|
| His gate correction (19 Aug): C = "did it reach its RIGHT consumer", not "did it reach him" | `docs/archive/ORGANISM_AUDIT__2026-08-19.md:5367-5392` |
| The right-consumer map exists as data: `gate.mjs LANE_CONSUMERS`, derived from the registry's lane rows (`right_consumer: {kind: him|organ, names}`); `outbox.LANES_NOT_IN_CONFIG` is a view of it | `scripts/gate.mjs:144-158`; `scripts/outbox.mjs:100-108` |
| That map is read from `dressing-room/state/registry.json` — a **LIVE** input (tracked, but a state file) | `scripts/gate.mjs:145` |
| Consumption BY HIM is metered in `consumption.jsonl` (brain.mjs SOLE WRITER; `brain consumed <target> --kind … --by …`) | `scripts/brain.mjs:132`, `:1429-1449`, `:7347` |
| Brain-job path: `consumptionForJob` (transitive through the job that eats it); non-brain path: `gateVerdictForLane` (by lane name alone) | `scripts/brain.mjs:1574`, `:2069` |
| `reconcile.mjs reachedHimFor(rows, keys)` — reach to HIM only | `scripts/reconcile.mjs:266` |
| No organ answers "this lane's declared consumer READS its file" (static) or "…consumed it inside the window" (dynamic) for organ consumers | grep `reach` over `scripts/*.mjs` → only `reconcile.mjs` |

### 1.4 The rules a rule-witness check could count, by home

| Rule set | Count | Witness today | Input class |
|---|---|---|---|
| `laws/*.yml` (semgrep, judged by `scripts/lawpack.mjs`) | 8 | each rule id is named in `scripts/lawpack.mjs` 5-12 times (planted cases live there) — **whether each has a planted RED and GREEN is UNMEASURED here** | repo |
| The ten laws (CLAUDE.md table), each with a "Verify" command | 10 | the command, run live | LIVE (most verify commands read state) |
| `dressing-room/state/laws_register.json` (read by `organism_test.mjs` `gates` mode) | — | — | LIVE |
| teaching-contract rules (`teaching_contract.mjs`, state file) | — | — | LIVE |
| campaign rung witnesses (clauses) | — | — | **UNREAD** (campaign repo) |

## 2 · THE COMMAND

**Name:** `node scripts/done.mjs` (owner: a new organ, SOLE WRITER of nothing — it prints; branch D1). Modes: `line`
(default — the one line), `report` (every check's detail), `json`, `selftest`.

**Output, `report` mode** — one line per check, then detail lines; every input not read is named:

```
DONE orphans  <n>  (Q3 <a> · orphan verbs <b>)                       ← repo
DONE rungs    <g>/<n> GREEN by clause · <loops g>/<n> loops          ← UNREAD campaign: <which file>
DONE rules    <w>/<n> rules with a witness planted both ways         ← repo for laws/*.yml; UNREAD/LIVE for the rest, named
DONE units    <open> open by clause                                  ← UNREAD campaign forks ledger
DONE census   PENDING <n>                                            ← UNREAD campaign fate table
DONE reach    <ok>/<n> lanes reached their right consumer (static <s>/<n> · window <d>/<n>)
```

**`line` mode** — the ONE morning line, ≤ one line, every UNREAD a word, never a zero:

```
DONE · orphans 3 · rungs UNREAD · rules 8/8 laws (10 laws LIVE) · units UNREAD · census UNREAD · reach 41/47 (static) · window LIVE
```

## 3 · EACH CHECK AS A COMPUTATION

| Check | Computation | Inputs | Class |
|---|---|---|---|
| **orphans** | `q = queries(build())`; `orphans = q.Q3 ∪ verbGraph(ir).orphanVerbs`, minus the deliberate exceptions xray already honours (`brain_ledger.jsonl` shared append lane, `xray.mjs:68-71`) | the code tree, the root sets | repo (Q3 reads no disk; `build()` walks the state dir only to fill `on_disk`, which Q3 never reads — **to verify:** run Q3 with an empty state dir and compare, branch D3) |
| **rungs by clause** | for each rung R and each clause c of its witness: four runs — RED on the day before the rung, GREEN on his real day, meter bytes `sha256` unchanged across the run, the old recorded day still RED; a clause is GREEN iff all four hold | the rung witness files, his real day (state), the recorded old day (archive) | **UNREAD** (campaign) + LIVE |
| **rungs by loop** | for each loop L: its sheet exists for the day, its page exists, the acts receipt of his sitting exists (`acts.mjs`), its ladder hash equals the ladder file's `sha256` | sheet (state), page (campaign), acts receipt (state), ladder (campaign) | UNREAD + LIVE |
| **rule-witness coverage** | for each rule r in a named rule set: covered iff a witness clause names r AND it is planted both ways (a RED plant and a GREEN plant). For `laws/*.yml`: parse each rule id, find its planted cases in `lawpack.mjs` selftest, and require one violating and one clean fixture per id | `laws/*.yml`, `scripts/lawpack.mjs` | repo; the other three sets LIVE/UNREAD |
| **open units by clause** | count the campaign units whose fate is BUILD and whose landing row is absent, grouped by the plan v2 clause they serve | the forks ledger + fate table | **UNREAD** |
| **census** | count rows with fate PENDING; every piece must be (a fate ∧ a rung) ∨ "serves no step" | the census table | **UNREAD** |

## 4 · THE REACH READER (part of this unit)

For every lane `ℓ` in `LANE_CONSUMERS` (and every brain job's out-lane in `brain_config.json`):

```
consumer(ℓ)      = right_consumer(ℓ)                     — {kind: him} or {kind: organ, names: [o…]}
static(ℓ)        = kind == organ ⇒ ∃ o ∈ names : o ∈ readers_xray(file(ℓ))      (xray IR edge; repo)
                   kind == him   ⇒ ∃ surface that renders file(ℓ) to him (skill, sheet, card) : a reader in the IR
window(ℓ, d)     = kind == him   ⇒ consumptionForJob / gateVerdictForLane C over the last d days   (LIVE)
                   kind == organ ⇒ the consumer organ's own consumption row for ℓ in d days           (LIVE; none exists today)
REACHED(ℓ)       ⇔ static(ℓ) ∧ window(ℓ, d)
```

`static` is computable on CI from the repo IR **once the consumer map is readable without the live registry** (branch
D2). `window` is LIVE and runs at the laptop. A lane with no declared consumer is counted as `NO CONSUMER`, never as
reached (the ratchet of `ORGANISM_AUDIT §1`: "no lane may run without a declared consumer").

## 5 · THE ONE MORNING LINE

The `line` mode output rides the morning anchor. How it reaches him is branch D4. It changes nothing he must do: it is
read, never answered, so it is NOT a card unless a check turns RED on a thing only his word can fix (then one card,
`--key done:<check>:<day>`).

## 6 · BRANCH TABLE

| Id | Choice | A | B | Cost | Measurable condition |
|---|---|---|---|---|---|
| D1 | Home | new `scripts/done.mjs` importing `xray.mjs` exports | a `done` mode of `xray.mjs` | A: a new organ (registry row, selftest); B: xray (SOLE WRITER of the IR) gains a reader of the campaign and of live state, against its "READ-ONLY on everything except xray_graph.json" law (`xray.mjs:68`) — read-only still holds, but its subject widens | A unless the architect rules xray's subject is "every static truth" |
| D2 | Consumer map source on CI | read `registry.json` lane rows (LIVE: CI's hermetic profile forbids it) | a code-side copy of the rows | A: `static` reach only on the laptop; B: a second list — the "twin-copy disease" `gate.mjs:141-143` exists to end | A until S10 folds the rows into a non-state registry; measurable: `grep -n registry.json scripts/gate.mjs` → 0 |
| D3 | Orphans on CI | Q3 + orphan verbs over the IR as built | the same with the state walk stubbed out | A reads the state dir (LIVE under the hermetic profile, `organism_test.mjs` LIVE_SELFTESTS has `xray`); B is hermetic | B iff Q3 over an empty state dir equals Q3 over the real one (one run each, diff = 0) |
| D4 | How the line reaches him | a line the Claude at `/matchday` prints after the state line (skill text change) | `manager.mjs` reads `done.mjs line` into `team_sheet.md` | A: no organ change, the skill carries it; B: manager gains an input and an LLM-composed sheet may restate it | A unless the line must survive a morning with no session (then B); measurable: count of mornings with `team_sheet.md` read but no `/matchday` session |
| D5 | Campaign inputs | the command takes `--campaign <dir>` and prints UNREAD when absent | the campaign pushes a summary JSON into this repo | A: nothing campaign-side enters main (the names list never does, row 1029 Q4); B: main carries campaign data | A (B contradicts row 1029's spirit) |
| D6 | Rule sets counted | `laws/*.yml` only (repo) | all four sets | A is CI-able now; B needs LIVE + UNREAD inputs | A on CI and B at the laptop, both printed, never summed |

## 7 · WITNESS CLAUSES I WOULD WRITE (each planted both ways)

| Clause | RED plant | GREEN plant |
|---|---|---|
| D-ORPH | a planted organ writing a file nobody reads → orphans +1, named | the same file read by a second planted organ → orphans unchanged |
| D-UNREAD | no `--campaign` dir → `rungs UNREAD`, never `0/0` | a planted campaign dir with one rung → `rungs 1/1` |
| D-RULE | a planted `laws/x.yml` whose id has no fixture in lawpack → `rules 8/9` | its fixture planted both ways → `9/9` |
| D-REACH | a lane whose declared consumer organ never reads its file → `static` fails, named | the consumer reads it → reached (static) |
| D-NOCONS | a lane with no declared consumer → `NO CONSUMER`, never reached | — |
| D-LINE | the `line` output is exactly one line and contains no state content | — |
| MUT | one mutant per clause, RED by its name; control GREEN | |

## 8 · OPEN QUESTIONS FOR THE ARCHITECT
1. D1 / D4 — the home of the command and how its line reaches him.
2. Which "orphans" plan v2 means: Q3 lanes, orphan verbs, or both (this spec counts both, separately printed).
3. The rung check needs his "real day" and the "old recorded day": which state file is the meter, per rung? (UNREAD here.)
