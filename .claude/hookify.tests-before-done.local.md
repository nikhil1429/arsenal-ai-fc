---
name: tests-before-done
enabled: true
event: stop
action: warn
conditions:
  - field: transcript
    operator: regex_match
    pattern: file_path"?\s*:\s*"?[^"]*scripts[\\/][A-Za-z0-9_]+\.mjs
  - field: transcript
    operator: not_contains
    pattern: npm test
---

**An organ under `scripts/` was edited in this session and the suite never ran.**

`npm test` is the authority (package.json `_runner_law`): the `&&` chains fail fast, the runner
runs every member independently and reports all of them. An unrun suite is a hypothesis, not a net.

Run `npm test`, then file it as the witness:

`node scripts/claims.mjs claim "suite green after <what changed>" --cmd "npm test"`

The recorded baseline is REPRODUCIBLE-NOT-STABLE (finding F-6): a red that matches the known
hermeticity class is honest and gets recorded as such, never patched around, and never weakened
to pass (order rule 10-D.10). Warn only - never blocks.

(ASCII ONLY, deliberately - see the note in hookify.claim-without-witness.local.md.)
