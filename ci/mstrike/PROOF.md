# unit mstrike · C:capability-c22 · PROOF (in progress)

CHECKPOINT · STOPPED at 2026-11-19T12:38Z · resume from step 2 (write ci/witness/mstrike/witness_strike.mjs per the design below; no witness file is written yet)

Base: origin/main `fb4211870093e6b8657655eb02ebcfc425f1eab1` (fetched 2026-11-19T12:38Z). Spec: `ci/mwit/MWIT_SPEC.md` @ 88bf69d, read whole.

## Step 1 · measured at the base (file:line at fb42118; no state content read or printed)
- The strike: `scripts/learnstate.mjs` askedFirst `:710-731`; the brief row `{…, asked_first}` is built by briefRowOf `:761-788` (an `asked_first.strike` only if the printed text carried it, `:775-777`); learnstate is the SOLE WRITER of brief_log.jsonl (header `:16-21`, recordBrief `:794`).
- The real day: `scripts/day.mjs` dayProof `:204-213` (takes `reviews` as an argument); the review row carries opened_at and host_session_id (`scripts/sitting.mjs:1062`, sole writer `:20`).
- The transcript path: `scripts/study_scope.mjs` transcriptPathFor `:99-102`; human rows humanText `:638`. study_scope has **no assistant-turn reader**. The organ that parses teacher turns is `scripts/teaching_gate.mjs` parseTranscript `:327` / turnsOf `:357` (`firstTurn` `:376-377`), and it uses study_scope's humanText. Divergence from the spec (b), which says "study_scope.mjs's own turn reader": the witness uses teaching_gate's parser (measured: it imports cleanly from a copied scripts/ tree with no state).
- The receipt organ: `scripts/rung_receipt.mjs` parseWitness `:224`; red refuses an exit 0 `:306`; door ARSENAL_RUNG_STATE_DIR, honoured only under os.tmpdir() (header F5).
- Bound for every spawn: `.github/workflows/suite.yml:62` timeout-minutes, read from the tree (the ms1 pattern).
- land.mjs readsOf `:272`: a witness declares `// READS:` header lines.

## Design (to build at resume)
`node ci/witness/mstrike/witness_strike.mjs --day <D>`: 2 if dayProof(D) is not real, if no brief row of D holds `asked_first.strike` at or before the host transcript's first prompt, or if the transcript is unreadable or has no prompt. 0 if the first teacher turn (turnsOf.firstTurn) carries the strike's quoted trap before its first "?". Otherwise 1. It prints no state content.
Plants mode `--org --base-org`: copies of the org's scripts/ plus the reader, under os.tmpdir(), with HOME pointed there. The plants are: asked first → 0 · asked in the third turn → 1 · another question before it → 1 · no strike → 2 · not real → 2 · no transcript → 2. Then BOUND and LAST.
Mutants: (1) accept a strike asked anywhere in the sitting, so the third-turn plant reads 0; (2) drop the before-first-question rule.

## FORKS (so far)
- ms1's member judges `ci/<unit>/witness_<unit>.mjs`; this unit's witness sits at `ci/witness/mstrike/witness_strike.mjs` (UNITS row), so ms1 would not find it.
- Recording a red through rung_receipt writes rung_receipts.jsonl. On this cloud that write goes only through ARSENAL_RUNG_STATE_DIR under os.tmpdir(); the live record is his laptop's.
- The effort receipt has not been run yet (resume step).
