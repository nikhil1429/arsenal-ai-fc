# PROOF · unit mdone — WHAT IS LEFT, `scripts/done.mjs` (rulings row 1032)

Branch `claude/mdone-build`, made from the ITEM 2 tip `claude/mland-build` `4f86d59` (18 Nov 2026). Spec:
`ci/mcr/B3_SPEC.md` on branch `claude/mcr-b3-spec`. Where the spec and the ruling differ the RULING wins (§2).

## 1 · MEASURED at the base `4f86d59`

| Fact | Where |
|---|---|
| xray exports reused in-process: `build`, `queries` (Q3 ORPHAN = written, never read), `verbGraph` (`orphanVerbs`) | `scripts/xray.mjs:860`, `:1040`, `:1055`, `:1081` |
| The day meter (Q3): `dressing-room/state/daily_green.jsonl`, SOLE WRITER `daily_green.mjs`; row `{ at, date, study, study_why, green, greens, reds, clauses }`, the latest row per date counts | `scripts/daily_green.mjs:91`, `:356-359`, `:413`, `:422` |
| The consumer map is derived from the LIVE registry at import (throws when unreachable) | `scripts/gate.mjs:144-158`; `scripts/registry.mjs:156` |
| The window judge and the consumption reader, reused | `scripts/gate.mjs:236` (`consumerSatisfied`, the gate's own window), `:585` (`consumptionOf`) |
| Consumption rows: `consumption.jsonl`, SOLE WRITER brain.mjs | `scripts/brain.mjs:132` |
| The laws pack: rule ids in `laws/*.yml`; RED plants `PLANTS` per id; NO clean-plant export (`grep -n CLEAN scripts/lawpack.mjs` → no line) | `scripts/lawpack.mjs:86`, `:695-704` |
| `laws_register.json` rows carry `check_site` (keys read, no content printed); `teaching_contract.json` is gitignored (laptop only) | `scripts/teaching_contract.mjs:69`, `:214` |
| THE MORNING ANCHOR: `/matchday` step 0 puts the ONE state line at the top of the reply — the one-line door the ruling names | `.claude/skills/matchday/SKILL.md:10-12` |
| The sheet's owner and the card's owner (the him-surfaces the static reach reader counts) | `scripts/manager.mjs:21`; `scripts/captains_call.mjs:1731-1734` |
| UNREAD: the campaign's rung witnesses, loops, fate/census table, forks ledger (campaign repo) — taken through `--campaign <dir>` | — |

**D3, MEASURED in the build (18 Nov 2026):** Q3 + orphan verbs over the tree's tracked state dir and over an EMPTY
state dir are EQUAL (`q3_equal: true`, `ov_equal: true`; scratch `d3.mjs` over an archive of `4f86d59`'s child), and
the witness re-measures it on every run (FACT D3). So the hermetic form computes orphans. The laptop's untracked state
files are UNREAD here.

## 2 · BUILT

- `scripts/done.mjs` (new, `// @ts-check`; tsc + eslint print nothing for it). SOLE WRITER of NOTHING (D1 A): no write
  call in its source; it never files a card. Modes `line` (default) · `report` · `json`; flags `--campaign <dir>`,
  `--meter <file>`, `--hermetic` (or `ORGANISM_TEST_PROFILE=hermetic`).
  - orphans: Q3 lanes and orphan verbs, printed SEPARATELY (Q2).
  - rungs: by clause and by loop from the campaign dir (D5 A); without it `rungs UNREAD`, never `0/0`. A clause is
    GREEN iff `red_before` reads RED, `green_real_day` reads GREEN, `meter_before == meter_after`, AND the meter's
    latest `2026-11-13` row is still `green: false` (Q3).
  - rules (D6): laws/*.yml both ways / RED-planted on both machines; the ten laws (CLAUDE.md table), laws_register
    (`check_site`), teaching-contract rules at the laptop — side by side, never summed; LIVE in the hermetic form.
  - units (open BUILD not landed, by clause), census (PENDING, and rows with neither fate+rung nor serves-no-step).
  - THE REACH READER: for every `gate.LANE_CONSUMERS` lane — static = its declared consumer organ READS one of its
    files in the xray graph (a him-lane: a skill root, manager.mjs or captains_call.mjs reads it); window =
    `gate.consumerSatisfied` over `consumption.jsonl`; REACHED = static ∧ window; a lane naming nobody is NO CONSUMER,
    never reached. Laptop only (D2 A); the hermetic form prints `reach LIVE`.
  - a census PENDING (a fate only his word gives) → `report` prints ONE `CARD done:census:<day> → node
    scripts/captains_call.mjs file … --key done:census:<day>` line; the anchor runs it; this organ files nothing (D4 A).
- `.claude/skills/matchday/SKILL.md` step 0, by its own door: on the line right after the state line, run
  `node scripts/done.mjs line` and print its ONE line verbatim — read, never answered.

Ruling vs spec, named: the spec gave done.mjs a `selftest` mode; D1 A says it prints and writes nothing — its net is
ci/mdone/ (a selftest mode would join the coverage law's orphans until package.json wires it). The spec's D4 left the
card key `done:<check>:<day>` open; built for the census only (FORK 2).

At the base's own laptop-shaped run (a shared clone of `47054b6`, 18 Nov 2026, the cloud has no consumption file):

```
node scripts/done.mjs line
DONE · orphans lanes 5 · orphan verbs 123 · rungs UNREAD · rules laws 0/8 both ways (8/8 RED-planted) | ten laws 9/10 with a verify command | laws_register 14/14 with a check site | teaching rules UNREAD · units UNREAD · census UNREAD · reach 0/21 (static 3/21 · window 0/21) · NO CONSUMER 0
```

## 3 · WITNESS — `ci/mdone/witness_mdone.mjs` (tree copies with a SYNTHETIC state dir, under `os.tmpdir()`)

Run 18 Nov 2026 over archive trees of base `4f86d59` and build `07991de`:

```
  ✓ D-ORPH · base RED · build GREEN — writer alone 6 (named true) · with a reader 5
  ✓ D-UNREAD · base RED · build GREEN — rungs UNREAD → rungs 1/1 clauses · 1/1 loops 
  ✓ D-METER · base RED · build GREEN — old day RED + meter still true · old day rewritten GREEN refused true · meter moved refused true
  ✓ D-RULE · base RED · build GREEN — laws 0/8 both ways (8/8 RED-planted) → laws 0/9 both ways (8/9 RED-planted) → RED only laws 0/9 both ways (9/9 RED-planted) → laws 1/9 both ways (9/9 RED-planted) 
  ✓ D-REACH · base RED · build GREEN — unread lane true · read + consumed REACHED true 
  ✓ D-NOCONS · base RED · build GREEN — reach 1/1 (static 1/1 · window 1/1) · NO CONSUMER 1
  ✓ D-LINE · base RED · build GREEN — 1 line(s) · marker absent true
  ✓ D-WRITE · base RED · build GREEN — bytes unchanged true · no write call in source true
  ✓ D-MORNING · base RED · build GREEN — state line at 471 · done line at 755 · inside step 0 true
  ✓ D-CARD · base RED · build GREEN — pending 1 → 1 card line(s) · pending 0 → 0
  ✓ FACT D3 · Q3 + orphan verbs over an empty state dir EQUAL the planted one (the hermetic form may compute orphans)
  ✓ BOUND · 4 differing path(s), all named
  ✓ LAST · 0 node process(es) naming the temp dir survive
GREEN MDONE what is left · 13 clause(s)
```

## 4 · MUTANTS — `ci/mdone/run_mutants_mdone.mjs`

```
  ✓ M1 D-ORPH · the Q3 orphan lanes are dropped → RED MDONE · D-ORPH
  ✓ M2 D-UNREAD · no campaign reads as 0/0, not UNREAD → RED MDONE · D-UNREAD
  ✓ M3 D-METER · the old recorded day is never asked → RED MDONE · D-METER
  ✓ M4 D-RULE · every RED-planted rule counts as both ways → RED MDONE · D-RULE
  ✓ M5 D-REACH · static reach ignores who reads the file → RED MDONE · D-REACH
  ✓ M6 D-NOCONS · a lane naming nobody is not NO CONSUMER → RED MDONE · D-NOCONS
  ✓ M7 D-LINE · the line carries the lane subjects → RED MDONE · D-LINE
  ✓ M8 D-WRITE · the organ writes a receipt → RED MDONE · D-WRITE
  ✓ M9 D-MORNING · the anchor no longer prints the line → RED MDONE · D-MORNING
  ✓ M10 D-CARD · a census PENDING prints no card → RED MDONE · D-CARD
  ✓ control → GREEN MDONE what is left · 13 clause(s)
run_mutants: 10 of 10 mutant(s) RED by the clause that names them · control GREEN
```

The first D-RULE form let mutant M4 ("every RED-planted rule counts as both ways") live: it never planted a rule that
is RED-planted without a clean plant. The clause now plants that middle step (commit `07991de`).

## 5 · TOUCHED SELFTEST

None: `scripts/done.mjs` is new and has no selftest mode by ruling; the skill file has none.

## 6 · SUITE (hermetic, shared clone + npm ci), 18 Nov 2026

```
ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all
47054b6  organism_test: 137 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
```

The same three reds by name as at `15edfec`: no new red.

## 7 · `node scripts/models.mjs check` → exit 0 (18 Nov 2026, at 07991de)

## 8 · FORKS

1. The campaign input contract is this seat's (`rungs/*.json`, `loops/*.json`, `units.json`, `census.json`, shapes in
   the header of `scripts/done.mjs`); the campaign must emit it. Nothing campaign-side enters main.
2. "A thing only his word can fix": built as census PENDING only. Units open, rungs RED, reach misses are machine work
   and stay a line. The architect may add a check to the card list.
3. Static reach finds NO file in the xray graph for most gate lanes (they are LLM-job lanes named by subject, not by a
   state path), so `static` reads NO for them — measured, not hidden; the lane→file map is a fork (the registry rows
   carry no file field).
4. The ten laws are counted by their CLAUDE.md table rows and "with a verify command" = a `node …` command in the row
   (L9's `git log -S` is not one); none of the three laptop rule sets has a machine-readable planted-both-ways witness,
   so they print counts, never coverage.
5. laws/*.yml "both ways" needs a clean plant per id; lawpack.mjs exports none today, so `0/8` is the true reading. A
   `CLEAN_PLANTS` export in lawpack.mjs (a file beyond this unit) would move it with no change here.
6. No suite member runs `done.mjs --hermetic` on the neutral machine (organism_test.mjs / package.json are beyond the
   named files); the hermetic form exists and is witnessed.
