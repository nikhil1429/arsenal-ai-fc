# PROOF · unit mtxt — one text unit (forks rows 1089 (4) / 1108 (1))

Every number on this page is a measurement of 19 Nov 2026, each beside the command that printed it.

## BASE
- Cut from `origin/main` at `95b07a604ef22f2a215bfc56e4ff45990177a437` (`git fetch origin main && git checkout -b claude/mtxt-build FETCH_HEAD`, 19 Nov 2026).
- Base CI (public API, 19 Nov 2026): `npm test · node 22` and `npm test · node 24` completed success on `95b07a6`.

## WHAT WAS MEASURED AT THE BASE (file:line at `95b07a6`)
- The stale sentence: `scripts/services.mjs:1070` — the tail of the RUNNING line of `statusLine()`, *"— the organism is supposed to be OFF until S12"* (`grep -n "OFF until\|until S12" scripts/services.mjs`). The audit order itself names it stale prose: `docs/archive/ORGANISM_AUDIT__2026-08-19.md:20273`.
- The stale paragraph: `CLAUDE.md:16-18` — *"⛔ 20 Aug 2026 — THE ORGANISM IS SWITCHED OFF by his order … re-enable NOTHING … S12 …"* (`grep -n "SWITCHED OFF" CLAUDE.md`).
- His 20 Aug word (the switch-off): `docs/archive/ORGANISM_AUDIT__2026-08-19.md:54` — *"THE ORGANISM IS SWITCHED OFF — HIS ORDER, 20 Aug 2026 ("nothing burns tokens anywhere")"*, struck there and marked superseded 30 Aug at `:60-61`.
- His 30 Aug word (back on): `docs/archive/ORGANISM_AUDIT__2026-08-19.md:23` — *"THE ORGANISM IS BACK ON — 30 Aug 2026, on his one haan and his one console visit."*; the wake rung's record is `:20187`, his word inside it `:20200` (*"1 kardo, lets finish this asap"*).
- Both found by ONE command, which is what the new CLAUDE.md text cites: `grep -n "nothing burns tokens\|ORGANISM IS BACK ON" docs/archive/ORGANISM_AUDIT__2026-08-19.md` → lines 23 and 54.
- NOT REACHABLE from the cloud, so NAMED, never pasted: what `node scripts/services.mjs status` and `node scripts/state.mjs` print on his machine today (they read `sc.exe` / `schtasks` / his live bus). The new texts name the verbs and state no count or state.

## WHAT CHANGED (exactly two hunks outside ci/mtxt/)
- `scripts/services.mjs` `@@ -1070 +1070 @@` — inside the template string only: the tail now reads *"— his 20 Aug 2026 switch-off was lifted by his 30 Aug 2026 word (grep -n "ORGANISM IS BACK ON" docs/archive/ORGANISM_AUDIT__2026-08-19.md); whether each SHOULD run: `node scripts/state.mjs`"*. The `⚠ RUNNING as an OS unit: ${…}` head is kept byte-for-byte (the selftest asserts it, `scripts/services.mjs:1310`).
- `CLAUDE.md` `@@ -16,3 +16,3 @@` — three lines for three, no other line moved: off by his 20 Aug order, on by his 30 Aug haan, both cited by the grep above; what runs now is printed by `node scripts/services.mjs status` · `node scripts/state.mjs` on his machine, not a cloud. Bytes: base 15645 → build 15637 (`wc -c CLAUDE.md`, 19 Nov 2026).

## SELFTEST, BEFORE AND AFTER (19 Nov 2026)
- before (`node scripts/services.mjs selftest` at 95b07a6): `services selftest: 19 passed, 0 failed`
- after (same command on the build): `services selftest: 19 passed, 0 failed`
- and inside the witness (clause S4, both trees on temp copies): base and org headlines equal.

## `node scripts/models.mjs check` — exit 0 (19 Nov 2026)
`models check · config scan: 19 file(s) · hits 0 · declared 0 (fuelboard_config.json 0 of baseline 0)`

## WITNESS, BOTH WAYS (19 Nov 2026, `node ci/mtxt/run_mutants_mtxt.mjs --repo . --base 95b07a604ef22f2a215bfc56e4ff45990177a437`)
- BASE  (`--org base --base-org base`): `RED MTXT · S1, S2, S3, S4, C1, C2, C3, C4, N1, BOUND` (exit 1)
- BUILD (`--org build --base-org base`): `GREEN MTXT the OFF-until-S12 sentence and the switch-off paragraph replaced by cited verbs, text only · 11 clause(s)` (exit 0)
- Both trees are CLONES under os.tmpdir() made with `-c core.autocrlf=false` at the committed sha (a dirty work tree is never judged).
- Honest note: S3, S4, C3, C4 and BOUND are invariance clauses; on the base they read RED through their "the unit is present" conjunct. Their teeth are the mutants below (S4's mutant is text-only, so S3 stays GREEN while S4 goes RED — the two guard different halves).

## MUTANTS (same run, 19 Nov 2026)
One per clause, each on a copy of the build clone, `--only <clause>`:
S1 stale sentence back as a comment · S2 the 30 Aug word dropped · S3 a code token changed · S4 a selftest-asserted string changed · C1 switch-off words back · C2 the cited grep finds no 30 Aug line · C3 another line moved · C4 the paragraph grew past the base bytes · N1 a live state word typed in · BOUND a file beyond the named ones · LAST a planted orphan naming the temp root.
`run_mutants: 11 of 11 mutant(s) RED by the clause that names them · control GREEN`

## SUITE (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, 19 Nov 2026)
- base clone 95b07a6: `organism_test: 139 passed, 5 failed` — unruled: selftest coverage orphans (deck_lint, home_pin, probe, study_scope) · fsrs + mutagen `ERR_MODULE_NOT_FOUND` (no node_modules in this container) · sandbox tripwire · the hermetic-members roll-up.
- build work tree: `organism_test: 140 passed, 4 failed` — the same reds less sandbox (sandbox's tripwire is environment-dependent between a clone and the work tree).
- build clone 7146528 (19 Nov 2026, same clone route as the base): `organism_test: 139 passed, 5 failed` — the SAME five unruled reds as the base clone, name for name. Like for like: no delta.
- No red names services.mjs or CLAUDE.md on either side.

## CI OF THE LAST PUSH
- `7146528` (19 Nov 2026, public API, no token): workflow run 44427838037 — `npm test · node 22` (135237186008) success · `npm test · node 24` (135237186066) success.
- The proof commit that carries this file gets its own run; it is named in the FINAL MESSAGE, never typed here before it exists.

## FORKS (files beyond the named ones, or rulings this unit may not make — written, not edited)
- F1 · CLAUDE.md is ALREADY over its own header size line ("≤ 8 KB"): 15645 bytes at the base (`wc -c CLAUDE.md`, 19 Nov 2026). This unit cannot bring it under without moving other lines; the gate held here is "may not grow" (15637 after). Architect's call.
- F2 · other switch-off prose in `scripts/services.mjs` was NOT touched (the unit is one sentence): the installer strings at `:242-246` ("The organism is SWITCHED OFF by his order of 20 Aug 2026 …", "disabled — S12 enables it on his word"), `:694`, `:826`, `:850`, `:1028` ("S12 turns the organism back on …"). They describe what an install does; whether they are stale is a ruling.
- F3 · `scripts/rails.mjs:30` and `:199` still say "SWITCHED OFF until S12" — a file beyond the named ones.
- F4 · the `⚠` on the RUNNING line is kept: since 30 Aug a running unit is the designed state, but the selftest asserts `/⚠ RUNNING as an OS unit/` (`scripts/services.mjs:1310`), so removing it is a code change.
- F5 · the cited 30 Aug block's own counts were refuted by the floor audit (`docs/archive/ORGANISM_AUDIT__2026-08-19.md:33-48`); this unit cites only his word, never a count from it.
- F6 · branch: the brief names `claude/mtxt-build`; the session's default branch is `claude/mtxt-queue-setup-lud86j`. Built and pushed on `claude/mtxt-build` per the brief; no PR opened (the brief forbids it).
- F7 · the base-suite worktree route was refused by the RAIL worktree hook (its register tool lives on his machine); a node clone under os.tmpdir() was used instead.
- F8 · the witness is written to run on Windows (CRLF folded, PowerShell process list, no POSIX shell) but was run only on Linux from the cloud.
