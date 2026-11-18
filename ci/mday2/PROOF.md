# UNIT mday2 — PROOF (forks rows 1089 (2) / 1067 (6); his word 240)

Built 2026-11-18 by a cloud builder on branch `claude/mday2-build`. Not a landing; nothing merged.

## Base

Cut from `origin/main` at **3e3ce63** (`git fetch origin main && git checkout -b claude/mday2-build FETCH_HEAD`, 2026-11-18).

## Measurements at the base (file:line at 3e3ce63)

**Who starts the day (unit mday, on main at the cut):**
- `.claude/settings.json:4,13` — UserPromptSubmit runs `scripts/turn_hook.mjs prompt`; `scripts/turn_hook.mjs:194` `learnCommandOf` (a LEADING `/learn` token) and `:201` runs `day.mjs start --by hook:prompt`.
- `.claude/settings.json:72,76` — PreToolUse matcher carries `Skill`, runs `scripts/rails.mjs pretooluse`; `scripts/rails.mjs:294-297` `dayHandoff` (tool_name Skill, skill learn, a uuid session id) and `:305` spawns `day.mjs start --session <id> … --by hook:skill`, detached; `:395` fails open.
- `.claude/skills/learn/SKILL.md:33-35` — boot step 2: the container is ALREADY OPEN by code; `day.mjs status` shows it; never type the open.

**What `day.mjs` does:**
- `scripts/day.mjs:91-108` `start` — no uuid session ⇒ nothing opened; closes an earlier IST day's open sitting (day-rollover) first; `sitting.openDoor({surface:"code"})`; a second open **JOINs** (`scripts/sitting.mjs:717` returns `joined: true`, same id), the host moves to the new /learn session (`day.mjs:105`).
- `scripts/day.mjs:111-151` `end` — refuses a non-host session (`:113-114`); a sitting closed today with reason fulltime ⇒ `day: already closed … nothing changed` (`:116-117`); else pointer (only with an open concept), sitting close through its own door with reason fulltime (`:128-132`) — its close fires the judge by code (`scripts/sitting.mjs:231,1044` `gaffer_brain.mjs judge-due --trigger sitting.close`), then `postmatch.mjs autoclose --anchor close`, the evening organs measured idempotent, ONE card (`captains_call.mjs deal`), and the ONE message of questions (`:110`).
- `scripts/day.mjs:181-186` `status` — read-only: today's sitting open/closed + post_match state, and the F8 counts line.
- `scripts/day.mjs:61` exports `END_LINE` — "When HE means the study day is over — in any words — run `node scripts/day.mjs end` once; never ask him to type a command." (`CLAUDE.md` session-start step 4 carries the same line).

**Ruling (3), named not guessed:** a second sitting open JOINs (`sitting.mjs:717`); `day.mjs end` after an old-style `sitting.mjs close --reason fulltime` the same IST day reads `already closed` (`day.mjs:116-117`).

**Every line of `scripts/learn_digest.mjs` of the class (open a sitting / judge a round / close a sitting / run full-time by hand), at the base:**
- `:163` — the day end line: `judge-round → sitting.mjs close --reason fulltime → /full-time`. **Edited** (the line the row names).
- `:184` — the boot line: `open the sitting FIRST → node scripts/sitting.mjs open --surface code --no-spawn --task …` (and "without it nothing lands at full-time"). **Edited** (the line the row names).
- `:158` — «bank mein gaya · axis … · judge shaam ko»: a sentence the session SAYS to him that the judge runs in the evening; it types no hand act and is true (the close fires it by code). **Not the same false act; untouched.**
- `:165` — "the hook prints the live contract every turn — obey the hook": the ruling's "obey the screen" phrase was searched (`grep -rn "obey the screen" .claude scripts` → no hit at the base); the nearest is `.claude/skills/learn/SKILL.md:32` ("Read it whole"). Not a hand act; untouched.
- No other line of the render names `sitting.mjs`, `judge-round`, `gaffer_brain` or `full-time` (grep at the base).

## The lines, old and new

The two pairs, verbatim (old at 3e3ce63, new on the build):

OLD `:163` `  day end node scripts/gaffer_brain.mjs judge-round → node scripts/sitting.mjs close --reason fulltime → /full-time`

NEW `:166` `  day end ` + day.mjs `END_LINE` (imported, its one home) + ` (it closes the sitting, whose close fires the judge by code, writes the machine half of the day and prints the ONE message of questions; a second end says already closed)`

OLD `:184` `  boot: open the sitting FIRST → node scripts/sitting.mjs open --surface code --no-spawn --task "<concept> axis <x>"  (a sitting is the day's container; without it nothing lands at full-time)`

NEW `:187` `  boot: the day's container is ALREADY OPEN by code (unit mday: his /learn prompt or the Skill call naming learn ran day.mjs start, which opens or JOINS today's sitting) · node scripts/day.mjs status shows it · never type the open yourself`

Also changed in the same file: the header CONTRACT comment names the new clause; an `import { END_LINE } from "./day.mjs"` (day.mjs loads its owners only inside its verbs — import is a read); the selftest gains ONE clause: no `sitting.mjs open`, no `judge-round`, no `sitting.mjs close`, no `/full-time` in the render, and `day.mjs status shows it` + `END_LINE` present.

## learn_digest selftest, by its headline line (2026-11-18, on this container's live state, read-only)

- before (3e3ce63): `learn_digest selftest 15/15 — all clauses hold`
- after (build): `learn_digest selftest 16/16 — all clauses hold`
- planted both ways inside the witness (D4): the build with the old two lines planted back reads `learn_digest selftest 15/16 — RED` exit 1; the base with the same plant reads `15/15 — all clauses hold` exit 0 (it has no such clause).

## The witness, both ways (`ci/mday2/witness_mday2.mjs`, 2026-11-18)

- build: `node ci/mday2/witness_mday2.mjs --org . --base-org <3e3ce63 tree>` → `GREEN MDAY2 the digest says the day is opened by code and ended by day.mjs end · 6 clause(s)` (exit 0)
- base: `node ci/mday2/witness_mday2.mjs --org <3e3ce63 tree> --base-org <3e3ce63 tree>` → `RED MDAY2 · D1, D2, D3, D4, BOUND` (exit 1). LAST is a guard and reads GREEN on both; its RED side is the LAST mutant.

## The mutants (`ci/mday2/run_mutants_mday2.mjs`, 2026-11-18)

`run_mutants: 6 of 6 mutant(s) RED by the clause that names them · control GREEN` (exit 0) — D1 hand open put back · D2 judge-round typed · D3 the end line typed here not imported · D4 the selftest clause disarmed · BOUND a file beyond the named ones (scripts/day.mjs comment) · LAST (own) a node process naming the temp dir left alive. After the run: `ps` shows no process naming `mday2-`, and no `mday2-*` dir is left under the temp root.

## The suite (2026-11-18, `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`)

- build: `organism_test: 137 passed, 4 failed · ruled 0 · UNRULED 4` (exit 2, 2026-11-18)
- base 3e3ce63, a clone made with `core.autocrlf=false`: `organism_test: 136 passed, 5 failed · ruled 0 · UNRULED 5` (exit 2, 2026-11-18)
- The build's reds are a strict subset of the base's, all of this container's class: `fsrs` and `mutagen` selftests die with `ERR_MODULE_NOT_FOUND` (no `node_modules` here), the 50-member line that rolls them up, and the selftest-coverage law naming `deck_lint, home_pin, probe, study_scope` as orphaned — none touches `scripts/learn_digest.mjs`. `LOAD ZERO BLOCK 7` reads ok on the build. learn_digest's selftest is LIVE in the hermetic profile (named, not run); it was run by hand above.
- The neutral machine's verdict is in `LEDGER.jsonl` by run id.

## models.mjs check (2026-11-18)

`node scripts/models.mjs check` → `models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)` exit 0.

## FORKS (files beyond the named ones — written here, not edited)

- F-a `.claude/skills/learn/REFERENCE.md:80` and `:168` (§0 Orient, "0b. Register the sitting") still type `node scripts/sitting.mjs open --surface code --no-spawn --task …` by hand — the same false act this unit removed from the digest. REFERENCE.md declares itself the verbatim pre-22-Sep body (L9), so whether it is edited, struck or left as a record is the architect's call.
- F-b `.claude/skills/learn/REFERENCE.md:475` (§3 INGEST + CAPTURE) types `node scripts/gaffer_brain.mjs judge-round` "once, at the end of the round" — the close now fires `judge-due --trigger sitting.close` by code (`sitting.mjs:1044`); a session that follows §3 AND then `day.mjs end` would judge twice or judge before the close. unit mday's W2.4 checks REFERENCE §4 only.
- F-c `.claude/skills/forge/SKILL.md:59` names `judge-round` as the gate's evidence ("banked answer judged (`judge-round` ran)") — descriptive, not a typed step; named only, likely no change.
- F-d the digest now imports `END_LINE` from `scripts/day.mjs`: a change to that one export changes the digest's day end line (by design, one home); `organism_test.mjs` carries no clause for it beyond learn_digest's own selftest (which is LIVE in the hermetic profile, so CI does not run it). Whether learn_digest's selftest should get a hermetic seam is a FORK.
- F-e the brief named the build seat's branch `claude/mday2-build` while this session's harness named `claude/mday2-effort-receipt-zitson` and the prompt said the session sits on `claude/mday2-queue`; the brief's explicit name was followed.
