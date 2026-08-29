# schemas/ — WHAT a state file is, beside WHO writes it

The owners-only law answers WHO may write each file in `dressing-room/state/`
(`grep -rn "SOLE WRITER" scripts/*.mjs`). It says nothing about WHAT lands there — so a
sole writer with a bug can write valid JSON that is not a valid *anything*, and every
reader downstream discovers it one crash at a time.

These are JSON Schemas (draft-07, ajv), one per state file, read by `scripts/gates.mjs`
as a TIER 0 gate beside `tsc` and `eslint`. Rung S11 of the engineering order built them.

**THE RATCHET, and it is the whole discipline:**
- A file that HAS a schema must validate. Always. That is a RED, never a warning.
- The number of schema'd files may only RISE (`gates.mjs SCHEMA_BASELINE`).
- A schema may only get STRICTER. Loosening one to make a red go away is the move
  §10-D rule 6 exists to refuse.
- `additionalProperties` is left TRUE on purpose in this first set: these schemas pin the
  INVARIANTS their owners already enforce, so an owner adding a field is not a false red.
  Tightening a specific object to `false` is a later, deliberate, one-file decision.

**Adding one:** write `schemas/<state-file-name>.schema.json`, run `node scripts/gates.mjs`,
and raise `SCHEMA_BASELINE` in the same commit — the gate never edits its own baseline.
