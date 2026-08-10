# GEMS_SETUP.md — the three Gems (Drill v4 add-on · Interview Examiner · Wall-Painter)

## 1 · Drill Gem — v4 ADD-ON (paste at the END of your existing Gem instructions)
Your Drill Gem (MANUAL_WIRING.md §2) already emits the end-session JSON array.
Append this block to its system instructions — additive, v3-compatible:

> *(verified 10 Aug 2026 — the pointer HELD, with one path correction. `MANUAL_WIRING.md`
> is at the **repo ROOT**, not in `setup/` beside this file — `ls MANUAL_WIRING.md` from the
> project dir, and `ls setup/MANUAL_WIRING.md` fails. Its §2 really is **"THE DRILL GEM —
> paste this into the Gem's system instructions"** (`grep -n "THE DRILL GEM" MANUAL_WIRING.md`),
> and that block really does end on "output ONLY a fenced JSON array … one object per rep",
> so "already emits the end-session JSON array" is true. The "v3-compatible" claim is about the
> optional `confused_with` / `edge` fields §2 introduced, and both are still live optional
> fields in the validator today — `grep -n "confused_with (v3)" scripts/capture.mjs`.)*
>
> ⚠ *(added 10 Aug 2026 — a hazard this section could not have known about when it was written.
> Since 9 Aug the `/gem-sync` skill **clears a Gem's Instructions box (ctrl+a) and types a whole
> new body over it** — the nightly cartridge `dressing-room/state/brain_out/nightshift/gem_cartridge.md`.
> If the Gem you append this block to is the one gem-sync drives, **the append is wiped on the next
> sync.** WHICH Gem on his account is which is **NOT VERIFIABLE FROM CODE — treat as a claim; only
> the captain can say.** Check the Gem before you paste.)*

```
--- v4 ADDITIONS (organism) ---
1. DEFENSE TEXT: whenever Nikhil defends a Jirah probe out loud and his defense
   reaches to ANOTHER concept, add to that rep: "note": "defense: <his exact
   words, one line>". Verbatim only — never paraphrase him.
2. PER-SESSION FLUSH REMINDER: at session end, after emitting the JSON array,
   remind him once: "Paste to the organism: node scripts/capture.mjs paste".
3. ANCHOR LAW: when explaining, reach for HIS recorded anchors first (he may
   paste lexicon.json anchors at session start). A foreign analogy only when
   no anchor fits — and never past a declared breaking point.
4. Nothing else changes. The rep schema stays exactly as specified above.
```

> *(checked 10 Aug 2026, clause by clause — three HELD, one is a command that does not run.)*
> - *(1) **DEFENSE TEXT — the field is legal, but nothing reads the prefix.** `note` is an
>   optional free-text string the validator accepts and stores verbatim (`grep -n "note not string"
>   scripts/capture.mjs`), so the rep ingests fine. But **no organ anywhere parses a `"defense: "`
>   prefix** — `git grep -n "defense:" -- "scripts/*.mjs"` returns nothing. It survives as text in
>   `reps_log.jsonl` for a human/LLM read, and that is all it does today. (Contrast the Examiner's
>   `"note": "scrimmage"` in §2, which IS machine-read — see the annotation there.)*
> - *(2) **CORRECTED — `node scripts/capture.mjs paste` with nothing after it EXITS 1** and
>   ingests zero reps: `"paste: provide a JSON file arg or pipe JSON via stdin."`
>   (`grep -n "provide a JSON file arg" scripts/capture.mjs`). The reminder as written sends him
>   to a command that fails at the exact moment his session's reps are on the clipboard. The forms
>   that work are `node scripts/capture.mjs paste <file.json>` or a pipe — and prefer
>   **`node scripts/capture.mjs paste <file.json> --chain`**, because a plain paste leaves the
>   derived organs stale and says so on exit: "derived state (cards · calibration · nemesis ·
>   learning_state) does NOT yet include these reps" (`grep -n "does NOT yet include these reps"
>   scripts/capture.mjs`). There is also a second door for a session that ends messily —
>   `node scripts/capture.mjs rep --concept <c> --axis <a> --q "<what was tested>" --gut
>   knew|shaky|guessed --correct true|false`. Read the live usage rather than this line:
>   `node scripts/capture.mjs` with no args prints it.)*
> - *(3) **ANCHOR LAW — HELD, and it is quoted from the code.** `dressing-room/state/lexicon.json`
>   exists and carries a real `anchors[]` array (each `{phrase, count, sources, breaking_point}`),
>   written by `doubtminer.mjs` — whose own `law` string is nearly this sentence verbatim:
>   `grep -n "reach for his anchors first" scripts/doubtminer.mjs`. `breaking_point` is a real
>   per-anchor field, so "never past a declared breaking point" is literal, not figurative.
>   Note the file is gitignored runtime state (`git check-ignore -v
>   dressing-room/state/lexicon.json`) — absent on a fresh clone is normal, not broken.)*
> - *(4) **HELD** — the rep schema in `MANUAL_WIRING.md` §2 is still the shape the validator
>   accepts; nothing in this add-on changes a field.)*

## 2 · Interview Examiner Gem (NEW — the scrimmage surface)
Create a new Gem named **"The Examiner"** with these instructions:

> ⚠ *(added 10 Aug 2026 — TWO status changes this section predates, both of which change what
> you actually do.)*
> - *(a) **These instructions are no longer the Gem's permanent body.** `/gem-sync` now
>   OVERWRITES the examiner Gem's whole Instructions box with the night shift's cartridge
>   (`.claude/skills/gem-sync/SKILL.md` step 2; the file is job 5 of the shift —
>   `grep -n 'write("gem_cartridge.md"' scripts/nightshift.mjs`). The live cartridge is on disk
>   now — `head -6 dressing-room/state/brain_out/nightshift/gem_cartridge.md` — and it carries its
>   own examiner rules ("one probe at a time · demand my gut-word (knew/shaky/guessed) BEFORE I
>   answer · honest verdicts, no flattery") plus its own reps-JSON contract. So the block below is
>   the ORIGINAL hand-written seed, not necessarily what the Gem holds today. Read the cartridge
>   before assuming.)*
> - *(b) **NAME MISMATCH — NOT VERIFIED 10 Aug 2026, and only the captain can settle it.** This
>   line says create it as **"The Examiner"**; `/gem-sync` drives a Gem it names **THE EXAMINER ⚪🔴**
>   (badge, all caps). **No code carries the badge form** — `git grep -n "EXAMINER ⚪"` hits `.md`
>   prose only, five files, all of which cite `.claude/skills/gem-sync/SKILL.md` as the source, so
>   it is one unverified claim echoing itself. Code refers to the thing generically as "THE EXAMINER
>   Gem", badgeless, matching NEITHER spelling exactly — `grep -n "EXAMINER Gem" scripts/captains_call.mjs`
>   (the B2 sync-due card) and `grep -n "THE EXAMINER Gem" scripts/dugout.mjs` (the ground tour +
>   the kickoff dispatch). So nothing in the repo can say which name the Gem on his account actually
>   has. This matters because gem-sync's step 2 does ctrl+a and types over the whole box: a wrong
>   target is destructive and not undoable from here.)*

```
You are a senior AI-engineering interviewer running a timed scrimmage for
Nikhil (AI Product Engineer target, India 2026). You are rigorous, warm-blunt,
and you interrupt like a real panel.

FORMAT — 5 questions, one at a time, NEVER two at once. Time-weight them like
the real onsite: system design > build > production/eval > fundamentals >
behavioral. Mix probe types: 🔵 cold recall · 🟡 derive-live · 🟣 defend-your-
choice · 🔴 novel scenario · ⚫ "would you even use an LLM here?".
He answers OUT LOUD first (Bolo), then types a summary. Being judged is the
declared point of this surface.

GRADING — after Q5: total /25, the TWO weakest answers with the exact crack
named, and ONE concrete drill for tomorrow. No participation trophies; no
shame either — cracks are data.

SESSION LOG — end by emitting a JSON array of the 5 reps in the standard
capture schema (surface "gem", track "concept", axis = the probed axis,
confidence = the gut-word he stated BEFORE your verdict, correct, plus
"note": "scrimmage"). He pastes it to capture like any session.

If a scrimmage brief is pasted (from scout.json / brain_out/scrimmage/),
use its concepts and modes exactly — the organism staged that door for him.
```

> *(verified 10 Aug 2026 — the FORMAT and GRADING blocks HELD in full against the machine's own
> definitions; the SESSION LOG block has an incomplete field list that gets reps REJECTED; and both
> paths in the last line need a prefix.)*
> - *(**FORMAT — HELD, and it is the club's real grammar, not a guess.** The five round ids and
>   that exact descending order are `rounds[]` in `dressing-room/state/dossier_weights.json`
>   (system_design 0.267 → build 0.222 → production_eval 0.200 → fundamentals 0.178 → behavioral
>   0.133), so "time-weight them like the real onsite" is literally the weights. All five probe
>   emojis match its `probe_types`, and the descriptions here are that file's own templates in
>   short: 🔵 recall = "Cold, no notes" · 🟡 reconstruct = "Derive it live" · 🟣 defend = "You chose
>   {claim}. I think that's wrong. Defend it" · 🔴 novel = "Unseen: {scenario}" · ⚫ negative_space =
>   "Would you even use an LLM for {task}?". **But this is a COPY of a live file and a copy rots** —
>   read the array, never this block: `node -e "const j=require('./dressing-room/state/dossier_weights.json');
>   console.log(j.rounds.map(r=>r.id).join(' > '))"`.)*
> - *(**GRADING — HELD.** /25, the two weakest with the crack named, one drill for tomorrow is the
>   same close the voice lane runs and files (`grep -n "score /25 out loud" scripts/dugout.mjs`).
>   Nothing in code computes the /25 — the machine only files the number the examiner spoke — so on
>   this surface the scoring genuinely stays with the Gem.)*
> - *(**SESSION LOG — CORRECTED: the field list is INCOMPLETE, and an array built from it alone is
>   rejected at capture's door, every row.** The validator hard-requires FOUR more things this
>   sentence never names: `ts` (a string that actually PARSES as a date), `concept` (non-empty),
>   `question` (non-empty), and `axis` must be PRESENT even when null. Read the reject reasons
>   themselves — `grep -n "concept missing/empty" scripts/capture.mjs`, `grep -n "ts missing/not-string"
>   scripts/capture.mjs`, `grep -n "axis missing (use null)" scripts/capture.mjs`. Also: **"axis =
>   the probed axis" must resolve to ONE letter a–i, not a probe name** — `"novel"` or `"mechanism"`
>   in that field is rejected with "axis not a..i", and the probe→axis map is
>   `probe_types.<type>.axis_types` in dossier_weights.json. The three allowed sets are the whole
>   law: `grep -n "^const SURFACES" scripts/capture.mjs` (gem|colab · concept|skill ·
>   knew|shaky|guessed). The full ingesting shape is already written out in `MANUAL_WIRING.md` §2 —
>   copy that object, not this list. The one thing here that is exactly right and **load-bearing**:
>   `"note": "scrimmage"`. Keep that substring — the shadow organ decides `scrimmage_played` by
>   regex on the note field (`grep -n "scrimmage_played: reps.some" scripts/shadow.mjs`), so
>   dropping or replacing the word makes a mock he played read as a door he never opened. And "he
>   pastes it to capture like any session" means a FILE or a pipe, never bare `paste` — see the §1
>   annotation.)*
> - *(**The two paths need their prefix, and their contents are not what "exists" implies.** Both
>   live under `dressing-room/state/` — `dressing-room/state/scout.json` and
>   `dressing-room/state/brain_out/scrimmage/`. **There is no `brain_out/` at the repo root at
>   all** (`ls brain_out` dies), so a literal read of this line finds nothing and the brief looks
>   missing. Two more things: (i) a staged scrimmage is not always there — scout.json's `staged`
>   is `[]` right now with readiness 0/3 (`node scripts/scout.mjs` writes it; the gate is 3 core
>   concepts at DEFEND grade, `grep -n "min_defend_grade_concepts" scripts/scout.mjs`); (ii) the
>   `brain_out/scrimmage/<date>.md` files are written on no-build nights too and open by saying
>   so — `head -1 dressing-room/state/brain_out/scrimmage/2026-08-09.md` reads "# Scrimmage staging
>   — no build". Existence is not the signal; read the first line. And "its modes" when a brief IS
>   staged is the R-late pair only — `round_mode_map.R_late` = novel · negative_space — not all
>   five above.)*

## 3 · Wall-Painter Gem (NEW — Gemini's visual arm)
Create a Gem named **"The Wall-Painter"**:

```
You turn Arsenal AI FC state JSON into ONE beautiful, dense, dark-themed
visual (SVG or single-file HTML). Cold steel, warm core: deep charcoal
(#0c0e13) base, warm amber (#e8915a) accents, off-white (#e9e7e2) text.
Input: he pastes wall_data.json (and sometimes season/notebook JSON).
Rules: every number must come from the pasted data — invent nothing; no
hype words (10x/exponential); no streak counts (weekly consistency only);
no raw biometrics (verdict color only); one glance = one story. Football
register welcome: the Maidan is a pitch, confusions are derbies, healed
weaknesses are trophies. Output ONLY the artifact.
```

> *(verified 10 Aug 2026 — every LAW in that block HELD word-for-word against the code that now
> generates the same prompt, but the INPUT line is superseded and the law list is missing the one
> clause whose breach costs the whole render.)*
> - *(**The laws are the club's constitutional string, and they match.** `viz.mjs` carries them as
>   one constant that travels with every generated render prompt — `grep -n "PROMPT_LAWS = "
>   scripts/viz.mjs`. Confirmed identical in substance: "every number must come from the JSON below
>   — invent nothing" · "no hype words (10x/exponential…)" · "no streak counts (weekly consistency
>   only)" · "no raw biometrics (verdict color only)" · "ONE glance = ONE story" · the football
>   register sentence, word for word ("the Maidan is a pitch, confusions are derbies, healed
>   weaknesses are trophies") · "output ONLY the artifact". The three hexes are exact —
>   `grep -n "0c0e13" scripts/viz.mjs` shows them in both the palette constant and the laws.)*
> - *(**Two laws are MISSING here that the live constant carries, and one of them is enforced by a
>   gate.** (i) **SELF-CONTAINED single file — NO external references of ANY kind** (no `@import`,
>   no web fonts/googleapis, no external images or links; system fonts only). A Gem that reaches for
>   a Google font produces a render the club REJECTS at the fold — `grep -n "function sanitizeGemini"
>   scripts/viz.mjs`. (ii) **no dates-as-deadlines.** There is also a FOURTH palette colour the block
>   omits: **muted gold `#c9a06a` secondary**.)*
> - *(**CORRECTED — the Input line is superseded: he does not hand-assemble this any more.**
>   `viz.mjs` auto-writes the whole ready-to-paste prompt — laws AND the entire wall state embedded
>   as a fenced json block — at EVERY wall render: `grep -n "function promptPack" scripts/viz.mjs`
>   and the write at `grep -n 'writeAtomic(join(CLUB_DIR, "prompts"' scripts/viz.mjs`. Count the
>   shelf live (`ls dressing-room/club/prompts/`) — it is FOUR files, not three: `wall_painter.md`
>   · `match_poster.md` · `season_film.md` · `voice_brief.md` (that last one is NOT a render prompt;
>   it is the daily capsule for the Voice Gaffer Gem, `setup/VOICE_SETUP.md`). Note viz's own
>   console line still says "3 Gemini prompts refreshed" while its selftest asserts four —
>   `grep -n "four prompts auto-written" scripts/viz.mjs` — so trust `ls`, not the console.)*
> - *(**The file names in the Input line, checked.** `wall_data.json` is real and lives at
>   `dressing-room/state/wall_data.json`, written by `viz.mjs` and by nothing else
>   (`git grep -ln "wall_data" -- "scripts/*.mjs"` → viz.mjs alone); it is gitignored runtime state
>   (`git check-ignore -v dressing-room/state/wall_data.json`). "season/notebook JSON" is looser than
>   it reads: `dressing-room/state/notebook.json` is a real path viz reads (`grep -n "notebook.json"
>   scripts/viz.mjs`) but **does not exist on disk today**, and there is no `season.json` either —
>   viz reads that path too (`grep -n "season.json" scripts/viz.mjs`). Neither absence breaks the
>   prompt: an absent season ledger sets `season.ledger_open: false` in the wall data so absent can
>   never read as a measured zero (`grep -n "ledger_open" scripts/viz.mjs`), and an absent
>   `notebook.json` simply drops the moments section. Check before promising either: `ls
>   dressing-room/state/notebook.json dressing-room/state/season.json`.)*

Weekly ritual (optional): paste `wall_data.json` + ask for "this week's match
poster" — print-worthy proof of the week, in his own numbers.

> *(corrected 10 Aug 2026 — the ritual survives, the hand-paste does not. `match_poster.md` is one
> of the four prompts `viz.mjs` rewrites at every render, and it already contains both the poster
> brief ("ONE portrait SVG poster (print-worthy, 3:4) of this week as a football match") and the
> whole wall state as embedded json — read the template at `grep -n "Match Poster" scripts/viz.mjs`.
> So the ritual today is: run the owner (`node scripts/viz.mjs`), then hand him
> `dressing-room/club/prompts/match_poster.md`. **Gotcha when you print it into chat:** that file
> already carries a triple-backtick json fence of its own, so a naive triple-backtick wrapper closes
> on the inner fence and he pastes half a prompt — use a longer outer fence, or give him the path.)*
