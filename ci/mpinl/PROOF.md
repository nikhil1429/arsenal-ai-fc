# UNIT mpinl · PROOF (in progress)

CHECKPOINT · STOPPED at 2026-11-19T12:38Z · resume from: run `node ci/mpinl/witness_mpinl.mjs --org <build LF clone> --base-org <base LF clone>` on the build (base run already read RED, 19 Nov 2026), then write ci/mpinl/run_mutants_mpinl.mjs, the suite run, the CI read and the rest of this proof.

- Base cut: main fb4211870093e6b8657655eb02ebcfc425f1eab1 (ci/mpinl/BASE).
- Done and pushed: the law in scripts/lawpack.mjs (0291f61); the witness and its two verbatim instruments (this commit).
- Witness on BASE (19 Nov 2026, `node ci/mpinl/witness_mpinl.mjs --org <base> --base-org <base>`): last line `RED MPINL · W1, W1u, W2, W2u, W3, W4, W5, W6, F7`.
- The witness has NOT been run on the build yet. Mutants, suite, CI and FORKS are still to do.
