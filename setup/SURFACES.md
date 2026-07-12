# SURFACES.md — Oura · ActivityWatch · GitHub · Supabase (verify, don't rebuild)

## Oura (already live — verify only)
- Tokens live in `scripts/oura_secrets.json` + `scripts/oura_tokens.json`
  (gitignored; `.worktreeinclude` copies them into worktrees).
- Verify: `node scripts/oura_coach.mjs` → prints the brief, writes readiness.json.
- If it demands re-auth: `node scripts/oura_auth.mjs` (one-time browser flow).
- STANDING FLAG (pre-existing, captain's call pending): the Oura client secret
  once appeared in a screenshot — regenerating it at cloud.ouraring.com is
  free and takes 2 minutes. Recommended.

## ActivityWatch (already live — verify only)
- Verify: open http://localhost:5600 — buckets should show today.
- The organism reads it two ways: timeaudit.mjs (buckets) + touchline.mjs
  (window events). Both degrade gracefully when AW is down.
- Keep "start on boot" enabled in AW's tray settings.

## GitHub (already live)
- Repo `nikhil1429/arsenal-ai-fc`, branch `organism-final` awaiting your review.
- The capsule gist stays the capsule master; the mirror pulls it daily 06:55.
- REMINDER (canon): repo-private flip is planned for after the full build is
  green — your call at merge time.

## Supabase (for the FinOps build — the organism doesn't touch it)
- Free tier is enough for M1 (pgvector included). Create the project when the
  FinOps repo needs it; keep keys in that repo's .env (never this repo).
- The organism deliberately has zero Supabase coupling — the product is yours
  to build (brief §7).
