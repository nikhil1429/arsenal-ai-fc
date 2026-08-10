# SECRETS SURVIVAL RUNBOOK (LADDER E10, 9 Aug 2026)

> Every credential the organism breathes through lives on **ONE disk** — this
> laptop. One dead SSD and the body is blind (no Oura), mute (no ntfy), and
> half-brained (no Gemini) until each is re-provisioned by hand. This file lists
> WHERE each secret lives and HOW to restore it. **No secret VALUES appear here —
> the repo is public.** The captain's 5-minute job: copy the four items below to
> one safe second place (password manager or an encrypted USB — his pick).
>
> *(Re-verified against the live code 10 Aug 2026. All four paths still resolve
> exactly as the table says; the file's line-number citations were swapped for
> greps, its restore steps were completed with the constants the code actually
> requires, and the "copy the three `dressing-room/state/` files" instruction —
> which pointed at a directory holding ONE of the four, and had contradicted its own
> table since the commit that created both — was corrected. Every
> change below carries its own inline scar. Prove the whole table in one command:
> `git check-ignore -v scripts/oura_secrets.json scripts/oura_tokens.json dressing-room/state/throwin_topic.txt`
> — three hits, and `git ls-files` on the same three prints nothing, i.e. ignored
> AND never tracked. The title's date holds: `git log --diff-filter=A -- setup/SECRETS_RUNBOOK.md`
> gives commit `8b8eb34`, 9 Aug 2026, a LADDER E commit whose message ends on exactly
> this runbook "plus ONE card (c21)". The sub-number "**E10**" itself appears in no
> code in this repo — NOT VERIFIED 10 Aug 2026, left as written; it is a filing label,
> nothing reads it.)*

## The four secrets

| # | What | Where it lives (gitignored) | Lost ⇒ | Restore |
|---|------|------------------------------|--------|---------|
| 1 | Oura OAuth app secrets (`client_id` + `client_secret`) | `scripts/oura_secrets.json` — verified live 9 Aug 2026 AND re-verified 10 Aug 2026: BOTH readers anchor on the **scripts** dir, not the state dir. Check it yourself, never from a line number: `grep -n "SECRETS_FILE = join" scripts/oura_coach.mjs` and `grep -n "const SECRETS  *= join" scripts/oura_auth.mjs` — both `join(__dirname, "oura_secrets.json")`. (corrected 10 Aug 2026: this cell cited `oura_coach.mjs:44`; the citation was still TRUE on re-check, but a line number in this repo drifts within days, so it is now a grep — rule 5.) | body-read dead | Re-create the app at cloud.ouraring.com → "My Applications" (NOT VERIFIED 10 Aug 2026 — that nav label lives on Oura's own site and cannot be checked from this repo; kept as written, treat as a claim, not a fact), get client id + secret, re-save the file, run `node scripts/oura_auth.mjs`. **Three constants the new app MUST match or the round-trip fails** (added 10 Aug 2026 — the old cell omitted all three; evidence `grep -n "REDIRECT\|SCOPES\|AUTH_URL" scripts/oura_auth.mjs`): redirect URI **exactly** `http://localhost:8080/callback`, scopes `email personal daily heartrate workout tag session spo2`, consent host `https://cloud.ouraring.com/oauth/authorize`. The helper is INTERACTIVE (it prompts for the paste) and needs port 8080 free; it binds loopback ONLY — `127.0.0.1` + `::1`, never `0.0.0.0` (E2E-audit fix, `grep -n "LOOPBACK_HOSTS" scripts/oura_auth.mjs`). If `oura_secrets.json` already exists it reuses the saved `client_id` instead of asking again (`grep -n "Using saved client_id" scripts/oura_auth.mjs`) |
| 2 | Oura tokens (`access` + `refresh` + `expires_at`) | `scripts/oura_tokens.json` (same anchor as #1 — `grep -n "TOKENS_FILE = join" scripts/oura_coach.mjs`) | body-read dead until re-auth | Regenerable from #1: `node scripts/oura_auth.mjs` (browser round-trip). **DO NOT rely on a backed-up copy of this file** (added 10 Aug 2026 — the "copy the files" step below implied one was worth keeping): Oura ROTATES the refresh token on every refresh and the coach persists the rotated one, so any copy goes stale the next time the coach runs — evidence `grep -n "rotates it on every refresh" scripts/oura_auth.mjs` and the atomic-write note at `grep -n "ONLY surviving copy of a rotated credential" scripts/oura_coach.mjs`. #1 is the thing worth backing up; #2 is a derivative. A live 401 that survives a refresh is the one case where the coach itself tells you to delete BOTH files and re-run the helper (`grep -n "even after refresh" scripts/oura_coach.mjs`) — a transient refresh failure explicitly does NOT (`grep -n "looks TRANSIENT" scripts/oura_coach.mjs`) |
| 3 | ntfy topic name | `dressing-room/state/throwin_topic.txt` (also inside the cloud sentinel's routine prompt on claude.ai — NOT VERIFIED 10 Aug 2026: that routine lives on his claude.ai account, by design nothing in this repo can read it; the repo-side proof-of-life is the watchman's nightly probe, `grep -n "THE SENTINEL'S PULSE" scripts/watchman.mjs`). **The file is only the LAST of three sources** (added 10 Aug 2026 — this cell named one and a restore that only re-saves the file can be silently overridden by the other two): resolution is env `ARSENAL_NTFY_TOPIC` → this file, for the throw-ins and the timeaudit push (`grep -n "topic resolution: env" scripts/throwin.mjs`, `grep -n "NTFY_TOPIC_FILE = join" scripts/timeaudit.mjs`); the brain and the watchman ALSO honour `brain_config.json` → `ntfy.topic`, the brain checking it FIRST and shouting a tripwire because that file is committed to a public repo (`grep -n "topic is set INSIDE brain_config.json" scripts/brain.mjs`), the watchman taking it LAST (`grep -n "bc.ntfy && bc.ntfy.topic" scripts/watchman.mjs`). Live today that key is the empty string, which is correct — check without printing the secret: `node -e "console.log(JSON.stringify(require('./dressing-room/state/brain_config.json').ntfy.topic))"` | phone pushes + throw-ins + sentinel all dark | The topic name IS the password (it is a public ntfy.sh topic — anyone holding the name can read AND publish; the brain says so in code at the tripwire above). If lost AND the sentinel's copy is lost: mint a new topic, re-subscribe the phone (setup/NTFY_SETUP.md Part 1 = the secret topic, Part 2 = the phone), update the sentinel routine's prompt, and **re-save `dressing-room/state/throwin_topic.txt`** (corrected 10 Aug 2026: this step said "re-save this file", which reads as SECRETS_RUNBOOK.md — the file you are reading, which is TRACKED and PUSHED to a public remote. Never paste the topic into this runbook or any tracked path; `throwin_topic.txt` is the gitignored home) |
| 4 | Gemini API keys | `~/.gemini/.env` (`GEMINI_API_KEY`, `_2`, `_3`… — verified 10 Aug 2026, the loader's own regex is `^GEMINI_API_KEY(_\d+)?\s*=\s*(.+)$`, so ANY numeric suffix works and `#`-comment lines are skipped: `grep -n "GEMINI_API_KEY(_" scripts/dugout.mjs scripts/hippocampus.mjs`. A `GEMINI_API_KEY` already in the environment is tried FIRST, before the file is read at all: `grep -n "process.env.GEMINI_API_KEY" scripts/dugout.mjs`) | second brain's free lanes dead | Re-mint at aistudio.google.com → API keys (NOT VERIFIED 10 Aug 2026 — Google's own console, unreadable from this repo; kept as written); re-save the env file. Never count the lanes from prose — list who actually reads a key: `grep -rn "GEMINI_API_KEY" --include=*.mjs scripts/` (10 Aug 2026 that was the Dugout, the hippocampus and the live-demo fork, with `brain.mjs` stating the lane authenticates through `~/.gemini/.env` only — `grep -n "Gemini lane authenticates" scripts/brain.mjs`). **Separate from this key and NOT restored by it** (added 10 Aug 2026): the `gemini` CLI lane in `brain_config.json` shells a binary that authenticates by his Google LOGIN, not by this env file — `grep -n '"binary": "gemini"' dressing-room/state/brain_config.json` |

## What does NOT need backing up
- `claude` CLI login — re-run `claude` + `/login` on any machine (subscription).
  **And after any restore, leave `ANTHROPIC_API_KEY` UNSET** (added 10 Aug 2026 —
  the old bullet said the subscription is the auth and stopped there, which reads
  as harmless if a key is lying around; it is not). Two organs hard-REFUSE the
  moment that variable exists: `grep -n "REFUSING — ANTHROPIC_API_KEY" scripts/brain.mjs`
  and `grep -n "NO METERED KEY, EVER" scripts/claudegen.mjs`. Setting it does not
  "help" a fresh machine — it stops the brain.
- Everything in git — but read this precisely: the public repo is the backup for
  code and for **TRACKED** state only (corrected 10 Aug 2026: the old wording,
  "the public repo IS the backup for code + tracked state", is true as written and
  is left standing, but a reader in a disaster takes it as "git has my stuff").
  A large denylist keeps personal state OFF the remote on purpose — see `.gitignore`,
  and settle any single path with `git check-ignore -v <path>`. Two that matter
  after a dead disk: `dressing-room/hippocampus/` is ignored and marked LOCAL ONLY
  (`grep -n "hippocampus" .gitignore`) — git is NOT its backup; `dressing-room/state/capsules/`
  is also ignored, but it is a MIRROR whose master is the cloud gist, so it comes
  back on the next pull (`grep -n "gist stays the MASTER" scripts/mirror.mjs`).
  What to do about the hippocampus is HIS call, not this file's — it is memory, not
  a credential, and this runbook's scope is credentials.
- `readiness.json` / biometric state — regenerates from Oura once #1/#2 live
  (verified 10 Aug 2026: `oura_coach.mjs` is its writer — `grep -n "OUT_FILE *= join" scripts/oura_coach.mjs`
  — and the file is TRACKED anyway by his 5 Aug D10 ruling, so `git ls-files
  dressing-room/state/readiness.json` prints it).
- The GitHub push credential (added 10 Aug 2026 — a FIFTH credential this laptop
  holds that "the four secrets" does not name, so the list is exhaustive for the
  ORGANISM'S OWN secrets, not for every credential on the disk). `origin` is HTTPS
  (`git remote -v`) and the credential helper is Windows' `manager`
  (`git config --get credential.helper`), so `git push` — including the groundsman's
  unattended night push (`grep -n 'run("git", \["push"\])' scripts/groundsman.mjs`, two
  call sites) — authenticates from the OS credential store, never from anything in
  this repo. Same class as the `claude` login: re-authenticate on the new machine,
  nothing to copy. Losing it does not lose data — the remote is the public repo and a
  fresh clone gets everything tracked. Re-run the sweep that found this before
  trusting "four" again:
  `grep -rhoE "process\.env\.[A-Z_0-9]*(KEY|TOKEN|SECRET|PASS|CRED|API)[A-Z_0-9]*" --include=*.mjs scripts/ | sort -u`
  — on 10 Aug 2026 that returned only `ANTHROPIC_API_KEY` (the guard, must stay unset),
  `GEMINI_API_KEY` (#4) and `AW_API_BASE` (a URL, not a credential). It also prints a
  "Binary file scripts/dmn.mjs matches" notice; that file reads no key, it only mentions
  one in a comment — `grep -an "GEMINI_API_KEY" scripts/dmn.mjs`.
- `dressing-room/state/oura_auth_state.json` — added 10 Aug 2026, born the morning
  after this runbook was written, so the original four-item list could not have
  named it. It is NOT a credential — status only, `fatal:true` + a clipped `why` on
  an auth death, `{fatal:false, at}` on the next good verdict, and it "never carries
  biometrics" by its own code comment. The coach is its SOLE writer
  (`grep -n "AUTH_STATE_FILE" scripts/oura_coach.mjs`); the captain's-call organ only
  reads it (`grep -n "oura_auth_state" scripts/captains_call.mjs`). It is gitignored
  anyway on the "this lane's mistakes are unrecoverable" argument written into
  `.gitignore` itself. Nothing to copy; it rebuilds on the next coach run.

## The copy itself (his hands, 5 minutes)
1. Copy these four paths into a password-manager secure note (or an encrypted USB
   he controls) — **corrected 10 Aug 2026**: this step said "the three
   `dressing-room/state/` files above + `~/.gemini/.env`", and that directory holds
   exactly ONE of the four. Following it literally, he opens `dressing-room/state/`,
   finds no Oura file there, and copies nothing — or copies the wrong file. This one
   was not rot, it was born broken: `git show 8b8eb34:setup/SECRETS_RUNBOOK.md` is
   the file's first and only previous version, and in that SAME commit the table
   already said "anchors on its own dir, **NOT** the state dir" while this step said
   "the three `dressing-room/state/` files above". The correction landed on the claim
   and missed the instruction that depended on it — which is the same failure as rot,
   arriving by a different road.
   - `scripts/oura_secrets.json` (#1 — the one that actually matters)
   - `scripts/oura_tokens.json` (#2 — regenerable from #1, and a copy goes stale
     on the next token rotation; copy it if he likes, trust it for nothing)
   - `dressing-room/state/throwin_topic.txt` (#3)
   - `~/.gemini/.env` (#4 — outside the repo, so no gitignore protects it)
   Confirm the three repo paths are still gitignored AND untracked before and after:
   `git check-ignore -v scripts/oura_secrets.json scripts/oura_tokens.json dressing-room/state/throwin_topic.txt`
   (three hits) and `git ls-files` on the same three (no output).
2. Confirm the sentinel routine on claude.ai still carries the topic in its
   prompt (that is the topic's off-laptop copy). Nothing in this repo can check
   that for him — by design, the routine and its prompt live on his account. What
   the laptop CAN check is whether the topic still has a pulse at all, which the
   watchman probes nightly and calls `sentinel-blind` when a whole day passes with
   neither a laptop row nor the cloud fallback on the topic's ntfy history
   (`grep -n "sentinel-blind" scripts/watchman.mjs`).
3. Done. Re-check only when a secret CHANGES (new key, new topic).
4. **Never paste a secret VALUE into this file, or into any tracked path**
   (added 10 Aug 2026). This runbook is `setup/SECRETS_RUNBOOK.md` — tracked,
   pushed, public. `git ls-files setup/SECRETS_RUNBOOK.md` prints it. The header
   has always said "no secret VALUES appear here"; the ntfy row's Restore cell used
   to end "re-save this file", which pointed the wrong way, and is now corrected.

*(Filed as ONE captain's card, key `secrets:runbook` — the anchor law: if it
needs the captain, it rides an anchor. Verified 10 Aug 2026: the card is real and
is id **c21**, filed 9 Aug — `grep -n "secrets:runbook" dressing-room/state/captains_call.json`.
Never read its state from this line; read it live with `node scripts/captains_call.mjs list`,
which is a pure read (it goes through `loadState()`, no write). Its sibling
`node scripts/captains_call.mjs status` prints the tally but is NOT read-only —
it runs `sync()`, and `sync()` writes the state file (`grep -n "^function sync" scripts/captains_call.mjs`,
then read the `writeAtomic` two lines in). Prefer `list`. NOTE for whoever greps for it next: `captains_call.json` was
UNTRACKED on 10 Aug under KAAM 0 — it is on the laptop, not on the remote, so
that grep works here and returns nothing in a fresh clone; the reason is written
into `.gitignore` beside the path.)*
