# SECRETS SURVIVAL RUNBOOK (LADDER E10, 9 Aug 2026)

> Every credential the organism breathes through lives on **ONE disk** — this
> laptop. One dead SSD and the body is blind (no Oura), mute (no ntfy), and
> half-brained (no Gemini) until each is re-provisioned by hand. This file lists
> WHERE each secret lives and HOW to restore it. **No secret VALUES appear here —
> the repo is public.** The captain's 5-minute job: copy the four items below to
> one safe second place (password manager or an encrypted USB — his pick).

## The four secrets

| # | What | Where it lives (gitignored) | Lost ⇒ | Restore |
|---|------|------------------------------|--------|---------|
| 1 | Oura OAuth app secrets | `scripts/oura_secrets.json` (verified live 9 Aug 2026 — oura_coach.mjs:44 anchors on its own dir, NOT the state dir) | body-read dead | Re-create at cloud.ouraring.com → "My Applications" (client id + secret), re-save the file, run `node scripts/oura_auth.mjs` |
| 2 | Oura tokens | `scripts/oura_tokens.json` | body-read dead until re-auth | Regenerable from #1: `node scripts/oura_auth.mjs` (browser round-trip) |
| 3 | ntfy topic name | `dressing-room/state/throwin_topic.txt` (also inside the cloud sentinel's routine prompt on claude.ai) | phone pushes + throw-ins + sentinel all dark | The topic name IS the password. If lost AND the sentinel's copy is lost: mint a new topic, re-subscribe the phone (setup/NTFY_SETUP.md), update the sentinel routine's prompt, re-save this file |
| 4 | Gemini API keys | `~/.gemini/.env` (`GEMINI_API_KEY`, `_2`, `_3`…) | second brain's free lanes dead | Re-mint at aistudio.google.com → API keys; re-save the env file |

## What does NOT need backing up
- `claude` CLI login — re-run `claude` + `/login` on any machine (subscription).
- Everything in git (the public repo IS the backup for code + tracked state).
- `readiness.json` / biometric state — regenerates from Oura once #1/#2 live.

## The copy itself (his hands, 5 minutes)
1. Copy the three `dressing-room/state/` files above + `~/.gemini/.env` into a
   password-manager secure note (or an encrypted USB he controls).
2. Confirm the sentinel routine on claude.ai still carries the topic in its
   prompt (that is the topic's off-laptop copy).
3. Done. Re-check only when a secret CHANGES (new key, new topic).

*(Filed as ONE captain's card, key `secrets:runbook` — the anchor law: if it
needs the captain, it rides an anchor.)*
