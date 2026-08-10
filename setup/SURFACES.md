# SURFACES.md — Oura · ActivityWatch · GitHub · Supabase (verify, don't rebuild)

## Oura (already live — verify only)
- Tokens live in `scripts/oura_secrets.json` + `scripts/oura_tokens.json`
  (gitignored; `.worktreeinclude` copies them into worktrees).
  (10 Aug 2026 — held, but never trust a gitignore claim written in prose on a
  PUBLIC repo; run the check instead of reading it:
  `git check-ignore -v scripts/oura_secrets.json scripts/oura_tokens.json`
  answered with the belt-and-braces globs `**/oura_secrets.json` and
  `**/oura_tokens.json` (no line number quoted here on purpose — .gitignore
  grows almost weekly and any `:NN` written into prose rots), and
  `git ls-files scripts/oura_secrets.json scripts/oura_tokens.json` printed
  NOTHING, which is what untracked looks like. The two paths are set
  in code, not here: `grep -n "TOKENS_FILE\|SECRETS_FILE" scripts/oura_coach.mjs`.
  `.worktreeinclude` lists exactly those two files — `cat .worktreeinclude`.)
- Verify: `node scripts/oura_coach.mjs` → prints the brief, writes readiness.json.
  (corrected 10 Aug 2026: true but INCOMPLETE — a successful run writes TWO
  files, not one. The second is `dressing-room/state/oura_auth_state.json`
  ({fatal, at} — status only, never biometrics), and it is the field the
  captain's-call card derives from. Evidence:
  `grep -n "AUTH_STATE_FILE" scripts/oura_coach.mjs` and
  `grep -n "oura_auth_state" scripts/captains_call.mjs`.
  That marker is the cheapest liveness read there is — `fatal:false` means the
  credential worked at its timestamp. Read it live (`cat
  dressing-room/state/oura_auth_state.json`), never from this line; when this
  line was written it read `{"fatal": false, "at": "2026-08-10T03:45:10.013Z"}`.
  Note also what the coach does NOT do on failure: readiness.json is left
  UNTOUCHED and the process exits non-zero — stale-but-real beats
  fresh-but-fabricated. `grep -n "left UNTOUCHED" scripts/oura_coach.mjs`.)
- If it demands re-auth: `node scripts/oura_auth.mjs` (one-time browser flow).
  (10 Aug 2026 — still the right command, with one caveat this line never
  carried: on Windows it does NOT auto-open a browser. It PRINTS the consent URL
  for you to paste into the already-logged-in browser, because Windows `start`
  mangles the URL's `&` characters. The loopback catcher is
  `http://localhost:8080/callback`, bound to 127.0.0.1 and ::1 only — never
  0.0.0.0. Evidence, one line, copy it whole:
  `grep -n "Only auto-open on non-Windows\|LOOPBACK_HOSTS" scripts/oura_auth.mjs`.)
- STANDING FLAG (pre-existing, captain's call pending): the Oura client secret
  once appeared in a screenshot — regenerating it at cloud.ouraring.com is
  free and takes 2 minutes. Recommended.
  (NOT VERIFIED 10 Aug 2026 — whether the secret has since been regenerated
  cannot be confirmed from code. The repo only ever sees the gitignored file,
  never its rotation history, so "captain's call pending" is a CLAIM, not a
  status. What IS checkable is that the CURRENT credential works —
  oura_auth_state.json above, `fatal:false` — and that says nothing about
  whether the working credential is the rotated one. Treat the flag as open
  until HE says otherwise.)

## ActivityWatch (already live — verify only)
- Verify: open http://localhost:5600 — buckets should show today.
  (10 Aug 2026: port 5600 answered on a live probe — `curl -s -o /dev/null -w
  "%{http_code}" http://localhost:5600/api/0/buckets` returned 308, i.e. the
  server is up and redirecting, not refused.)
- The organism reads it two ways: timeaudit.mjs (buckets) + touchline.mjs
  (window events). Both degrade gracefully when AW is down.
  (corrected 10 Aug 2026: "two ways" was true when this was written on 12 Jul
  2026 and has not been true for weeks — FIVE scripts hold an AW base URL today.
  Count them live, never from this line:
  `grep -rln "localhost:5600\|AW_API_BASE\|ARSENAL_AW\|aw_default" scripts/*.mjs`
  — on 10 Aug that returned context.mjs · dmn.mjs · presence.mjs · timeaudit.mjs
  · touchline.mjs. The three this line never named:
    · presence.mjs — window + AFK buckets, for the stall signature
      (`grep -n "fetchAwEvents\|aw-watcher-afk" scripts/presence.mjs`);
    · dmn.mjs — the AFK bucket, to decide he is AWAY before the Rest Room dreams
      (`grep -an "async function isAway" scripts/dmn.mjs` — the `-a` is NOT a
      typo: dmn.mjs carries exactly ONE stray NUL byte, so plain `grep` answers
      "Binary file scripts/dmn.mjs matches" and prints nothing. Verified 10 Aug
      2026: `tr -dc '\000' < scripts/dmn.mjs | wc -c` → 1. Every grep against
      dmn.mjs in this file therefore uses `-a`.);
    · context.mjs — polls the CURRENT window for the ambient bridge
      (`grep -n "async function currentWindow" scripts/context.mjs`).
  "Both degrade gracefully" now reads ALL FIVE degrade gracefully, and THAT part
  still holds — every one swallows the failure rather than guessing:
  `grep -n "ActivityWatch unreachable" scripts/timeaudit.mjs` and
  `grep -an "ActivityWatch unreachable" scripts/dmn.mjs` (the `-a` again),
  `grep -n "AW down → silent no-op" scripts/presence.mjs`, and the bare
  `catch { return null; }` in touchline's `awFetch` / context's `currentWindow`.
  One more thing the old line hid: the base URL is NOT one shared constant.
  timeaudit reads `$AW_API_BASE`, context reads `$ARSENAL_AW`, touchline reads
  whatever its config's `aw_base_env` names (default `AW_API_BASE`) — while
  presence.mjs and dmn.mjs HARDCODE `http://localhost:5600` with no override at
  all. Move AW to another port and those two go blind silently.)
- Keep "start on boot" enabled in AW's tray settings.

## GitHub (already live)
- Repo `nikhil1429/arsenal-ai-fc`, branch `organism-final` awaiting your review.
  (corrected 10 Aug 2026: **`organism-final` NO LONGER EXISTS** and has not since
  the day this file was written. It was merged to main on 12 Jul 2026 at 17:52
  IST — commit `953a77e` "THE FINAL ORGANISM — organism-final merged to main
  (captain's order, 12 Jul 2026)" — and this file was committed in `988e6dc` the
  SAME day, so the "awaiting your review" was already spent when it landed.
  Anyone acting on it gets a failed `git checkout organism-final`. The live
  branch is **main**, and it is also the remote default. Read it live, never
  from here: `git rev-parse --abbrev-ref HEAD` and `git ls-remote --heads origin`
  — on 10 Aug the remote held exactly two heads, `main` and `e2e-audit-fixes`.)
- The capsule gist stays the capsule master; the mirror pulls it daily 06:55.
  (corrected 10 Aug 2026: the gist-is-master half HOLDS — `grep -n "gist stays
  the MASTER" scripts/mirror.mjs`. The **06:55 half is wrong as a wall-clock**.
  The standalone Windows task that owned that hour is now DISABLED:
  `schtasks /query /tn "\ArsenalFC-Mirror" /fo LIST /v` → `Status: Disabled`
  (its Start Time still reads 06:55:00, which is exactly how this line keeps
  looking right). The mirror now runs as **step 1 of the morning conductor's
  chain** — `grep -n "id: \"mirror\"" scripts/conductor.mjs` — and that chain
  fires when ITS task fires: `schtasks /query /tn "\ArsenalFC-Morning-Conductor"
  /fo LIST /v` → `Start Time: 09:15:00`, `Status: Ready`, next run 11-08-2026
  09:15. The `at: "06:55"` still written beside the mirror step in conductor.mjs
  is a LABEL, not a schedule — the file says so itself: "`at` is the wall-clock
  time the replaced task used to hold; kept purely so this file stays readable".
  Order is the product now, not the clock. Always read the hour off schtasks.)
- REMINDER (canon): repo-private flip is planned for after the full build is
  green — your call at merge time.
  (10 Aug 2026 — the TRIGGER in this line has already passed and the flip has
  NOT happened. "Merge time" was 12 Jul 2026 (`953a77e`, above); the repo is
  still PUBLIC today. Check it yourself, one line:
  `curl -s https://api.github.com/repos/nikhil1429/arsenal-ai-fc`
  — it returned `"private": false`, `"visibility": "public"`,
  `"default_branch": "main"`, and the fact that an UNAUTHENTICATED call answers
  at all is itself the proof of visibility.
  So the decision is still HIS and still outstanding — it just no longer has a
  future event to hang on. Everything downstream of "the repo is PUBLIC" is
  being decided FILE BY FILE in .gitignore instead: see his D10 ruling
  (5 Aug 2026) and the KAAM 0 untracking (10 Aug 2026) recorded there —
  `grep -n "RULED BY THE CAPTAIN\|KAAM 0" .gitignore`. Those are TRACKING
  rulings, not a visibility ruling; do not read them as the flip being cancelled.)

## Supabase (for the FinOps build — the organism doesn't touch it)
- Free tier is enough for M1 (pgvector included). Create the project when the
  FinOps repo needs it; keep keys in that repo's .env (never this repo).
  (NOT VERIFIED 10 Aug 2026 — this is a claim about SUPABASE'S OWN product tiers,
  not about this repo, so no amount of grepping settles it. Check it at
  supabase.com/pricing before you rely on it. The keys-in-that-repo half is a
  standing instruction, not a checkable state, and it still reads correct.)
- The organism deliberately has zero Supabase coupling — the product is yours
  to build (brief §7).
  (10 Aug 2026 — the zero-coupling half HOLDS, and here is how to keep proving
  it rather than believing it: `cat package.json` → `dependencies` are exactly
  `msedge-tts` and `ts-fsrs`, no supabase client; and
  `grep -rni "supabase" scripts/` — do NOT read the count off this page, read
  the SHAPE of the hits, because every one of them is a STRING LITERAL and none
  is a wire. On 10 Aug 2026 it returned three:
    · two in manager.mjs, both inside its SELFTEST FIXTURE — a season string
      "M1 extraction + Supabase (Building)" and the regex asserting the wrapper
      hands that string through. Test data.
    · one in repo_bundle.mjs, the one-line DESCRIPTION of this very file in the
      bundle index. Prose about prose.
  No client, no key, no network call anywhere. Do not let those hits read as a
  contradiction on a future grep — the test is `dependencies` in package.json,
  and the word appearing in a fixture or a caption is not coupling.
  "(brief §7)" is NOT VERIFIED — the pointer does not resolve in this repo
  today. The only in-repo brief with a §7 is BRIEF__self_sustaining_organism.md,
  whose §7 is "THE OPEN QUESTIONS" about the teaching-compliance loop and says
  nothing about Supabase or the product; it also postdates this file by weeks.
  Treat "brief §7" as a dangling cross-reference to a document outside the repo,
  not as a citation you can follow.)

FLAGGED, not fixed (10 Aug 2026, and deliberately left OUTSIDE this page's own
claims because it is another file's defect): `scripts/repo_bundle.mjs` describes
this page in the bundle index as "the full list of external surfaces (Oura, AW,
**ntfy**, Supabase, GitHub)". There has never been an ntfy section in here —
ntfy has its own `setup/NTFY_SETUP.md`, and `setup/README.md` step 7 correctly
routes here for "Oura / ActivityWatch / GitHub / Supabase" only. The title line
at the top of this page is the accurate one. Whoever owns repo_bundle.mjs should
drop the "ntfy" from that string: `grep -n "SURFACES.md" scripts/repo_bundle.mjs`.
