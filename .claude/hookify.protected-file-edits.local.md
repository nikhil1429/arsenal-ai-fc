---
name: protected-file-edits
enabled: true
event: file
action: warn
conditions:
  - field: file_path
    operator: regex_match
    pattern: (dressing-room[\\/]state[\\/]|readiness\.json|intake_log\.json|[\\/]capsules[\\/]|FREEZE\.md|[\\/]hooks[\\/]|\.gitignore$|oura_(secrets|tokens)\.json)
---

**This path is protected by a standing ruling - check which one before you write.**

- `dressing-room/state/...` - OWNERS-ONLY. Every state file has ONE writer and it is an organ's
  CLI (order rule 10-D.4). Find it: `grep -rn "SOLE WRITER" scripts/*.mjs`. If no owner exists,
  that absence IS the finding. (`scripts/rails.mjs` already DENIES this write; this rule only
  says the why out loud.)
- `readiness.json`, `intake_log.json` - TRACKED ON HIS RULING, twice (5 + 10 Aug 2026). The
  asymmetry with the archive is deliberate; harmonising them reverses a captain's decision.
- `capsules/` - IMMUTABLE, their prose SACRED. `mirror.mjs` is the sole writer; his two
  paste-writes are the only edits.
- `FREEZE.md` - the freeze guard arms the day this file returns to the repo root.
- `hooks/`, `.gitignore` - the privacy belts. `.gitignore` carries the archive law ("code
  public, data private, koi apwaad nahi") and the month-roll class rules.
- `oura_secrets.json`, `oura_tokens.json` - live credentials, hard-ignored forever.

Warn only - never blocks. The real gates are `scripts/rails.mjs` (PreToolUse) and
`hooks/pre-commit` (the archive tripwire).

(ASCII ONLY, deliberately - see the note in hookify.claim-without-witness.local.md.)
