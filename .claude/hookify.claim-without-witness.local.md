---
name: claim-without-witness
enabled: true
event: stop
action: warn
conditions:
  - field: transcript
    operator: regex_match
    pattern: (verified|sab green|poora padh|confirmed)
  - field: transcript
    operator: not_contains
    pattern: claims.mjs claim
---

**This session has claimed work and has never once filed a witness.**

In this organism a claim is a RECEIPT, not a sentence - the same law that binds HIS gut-word,
pointed at you. File the claim with the command that proves it:

`node scripts/claims.mjs claim "<what you are claiming>" --cmd "<the command that proves it>"`

It RUNS the command, stores the exit code and a hash of the output, and REFUSES the claim if the
command fails. "not verified yet" is always allowed, and is never a defect.

**Note - this rule only WARNS.** The belt that actually blocks is `scripts/claims.mjs stop`,
wired on Stop in `.claude/settings.json`, because only a code path can carry the exemptions
(ARSENAL_ORGAN=1, stop_hook_active, ARSENAL_CLAIMS_EXEMPT=1) and hookify's rule language has no
env predicate. A `warn` can never block one of the organism's own headless lanes mid-flight,
which is why all four rules here are warns (THE BLUEPRINT section 5, defect 1).

(ASCII ONLY, deliberately: hookify's config_loader opens rule files with Python's default
locale encoding, which is cp1252 on this machine, so a UTF-8 dash or a section sign comes back
to you as mojibake. Measured 1 Sep 2026 on the first fixture run of these rules.)
