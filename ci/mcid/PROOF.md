# ci/mcid/PROOF.md — unit mcid (row 1321 (1)): NO-CI-DIR also holds on a clause witness

BASE (the cut): `0cfc70cf6568cc670a23040e396d2545d866ef08` — origin/main at the seat's start, 22 Nov 2026 (`git fetch origin main`).

## The verb change (scripts/land.mjs, every edited line)
- `scripts/land.mjs:24-26` — header: the amendment "NO-CI-DIR · THE CLAUSE WITNESS (unit mcid · row 1321 (1))" beside NO-CI-DIR; the old sentence at lines 22-23 kept.
- `scripts/land.mjs:236-237` — step 5: `cw`, at least one `ci/witness/<unit>/witness_NAME.mjs` (NAME `[a-z0-9_-]+`, direct child, the clauses member's path) in T's tree.
- `scripts/land.mjs:238` — the condition `(!has(w) && !cw) || !baseOk || !touched…` (was `!has(w) || …`).
- `scripts/land.mjs:239` — the refusal text names the clause-witness alternative; the name stays NO-CI-DIR.
Nothing else in the verb moves (`git diff 0cfc70c HEAD -- scripts/land.mjs`: two hunks, @@ -23,0 +24,3 @@ and @@ -233,2 +236,4 @@).

## The witness both ways (LF trees from the commits, 22 Nov 2026)
- `node ci/mcid/witness_mcid.mjs --org <head> --base-org <base>` → `GREEN MCID NO-CI-DIR holds on a clause witness · 10 clause(s)` (exit 0); every clause line reads base RED · build GREEN.
- `node ci/mcid/witness_mcid.mjs --org <base>` → `RED MCID · CLAUSE, UNIT, NEITHER, OTHER, BASEHEX, TOUCH, NAME, HEADER` (exit 1).
- `node ci/mcid/witness_mcid.mjs --org <head>` (no --base-org) → `GREEN MCID NO-CI-DIR holds on a clause witness · 9 clause(s)`; TREE BOUND not judged (row 1307 (1)).

## The mutants (22 Nov 2026, `node ci/mcid/run_mutants_mcid.mjs`)
`run_mutants: 8 of 8 mutant(s) RED by the clause that names them · control GREEN` — M1 neither witness accepted (NEITHER) · M2 another unit's clause witness accepted (OTHER) · M3 BASE not 40-hex accepted (BASEHEX) · M4 CLAUSE · M5 UNIT · M6 TOUCH · M7 NAME · M8 HEADER.

## Members and checks
- `node scripts/models.mjs check` → exit 0 (22 Nov 2026).
- land.mjs carries no selftest mode; no suite member was edited.

## FORKS
- none so far.

CHECKPOINT 1 · 22 Nov 2026 ~15:5x UTC · done: the verb change, the witness both ways, mutants 8/8 · resume from: the law pack counts on BASE and build, the WITNESSES member (neutral flags), the hermetic suite, the canon-count scan.
