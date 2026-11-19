# UNIT mpinr · PROOF (in progress — checkpoint)

Base: main fb4211870093e6b8657655eb02ebcfc425f1eab1 (ci/mpinr/BASE). Files: scripts/own_source.mjs (new) · package.json (one suite line) · ci/mpinr/.

Measured so far (19 Nov 2026, LF clones, by command):
- `node scripts/own_source.mjs selftest` → `own_source selftest: 30 passed, 0 failed`
- witness base → `RED MPINR · SELFTEST · SUITE · NARROW · KILLED · GUARD · COPY · LEAF · ONLY-NAMED` (exit 1); build → `GREEN MPINR own_source module · 9 clause(s)` (exit 0)
- run_mutants (first run, 19 Nov 2026) → `run_mutants: 8 of 9 mutant(s) RED by the clause that names them · control GREEN` — the KILLED mutant's witness ran past the runner's bound (the runner bounds the witness with the same bound the witness bounds its probe with; it needs the probe's bound plus headroom).
- lawpack gate, base and build (19 Nov 2026): every count equal (`1933 raw match(es)`, all findings equal, depcruise_errors 13 both).

CHECKPOINT · STOPPED at 2026-11-19T12:40:40Z · resume from: fix run_mutants_mpinr.mjs's witness bound (KILLED mutant), rerun mutants, then the full PROOF (suite before/after, models check, FORKS), CI read, effort receipt.
