# UNIT muna — LANDING WITH NO SESSION AWAKE (a SPEC, nothing built)

Rows 1029 / 1297 (1). Spec seat, cloud, 22 Nov 2026. Branch `claude/muna-spec`, cut by
`git fetch origin main && git checkout -b claude/muna-spec FETCH_HEAD` from **main 84cbc03126eddb85c7d5cf54b51610068800315c**
(unit mcrk2's land commit, which carries mdet, mdtl2 and mclk). Every `file:line` below is at that sha.
This spec builds nothing, edits no existing file, and adds only `ci/muna/MUNA_SPEC.md` and `ci/muna/LEDGER.jsonl`.

**No neutral run.** The push filter on main (unit mq3, row 1289) excludes `claude/*-spec`, so this branch draws no
check run; nothing here waits for one. Final message carries branch + tip only.

**Row 1297 (2) holds while this is read:** until muna is ruled AND built, the two in-session timers stay as they are.
Nothing below assumes otherwise; §8 names only what a BUILT, RULED muna would retire.

---

## 0. THE MEASUREMENTS (command → last line, at 84cbc03, in this cloud clone)

| # | Command | Last line |
|---|---|---|
| M1 | `git fetch origin main && git log --oneline -1 FETCH_HEAD` | `84cbc03 unit mcrk2 (forks rows 1292 / 1295; …) … Not a landing.` |
| M2 | `node scripts/land.mjs` (no args) | `land.mjs <unit> [--dry] [--live <witness>]… [--names-gate <file>] \| push <unit> \| count \| carry … \| reads-probe …` |
| M3 | `node scripts/land.mjs count` (cloud clone, no ledger) | `unattended 0 of 10 landing(s) since the last stop a human resolved (row 1029 L2: unattended only at 10) — runner at his console` |
| M4 | `git log --format=%h -60 origin/main --grep="land branch on main"` then per sha `git diff-tree --no-commit-id -r --name-only --diff-filter=A <h> -- ci \| wc -l` | every one of the 13 land commits listed adds between 5 and 8 new `ci/` files (last row `b3a61c6 5`) |
| M5 | `git log --format=%s -400 origin/main --grep="land branch" \| grep -c re-cut` / `… \| wc -l` | `7` re-cuts out of `45` land-branch commits (measured 22 Nov 2026) |
| M6 | `grep -n "Groundsman-Push" setup/INSTALL_CYBORG_TASKS.ps1` | `165:Mk "ArsenalFC-Groundsman-Push" "groundsman.mjs push" @("/SC","DAILY","/ST","03:45")` |
| M7 | `grep -n "WORKTREE_TOOL = " scripts/rails.mjs` | `153:export const WORKTREE_TOOL = "C:/Users/nikhi/arsenal-audit-artifacts/campaign-2026-09/tools/v/worktree.mjs";` |
| M8 | `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` | see LEDGER.jsonl row `hermetic suite at the cut` (its last line, verbatim) |

M3 is the CLOUD clone's count: the count lives in `.git/land_ledger.jsonl` of the clone that ran the verb
(`scripts/land.mjs:66-67`), so only his laptop's tree carries the runner's "48 of 10" (runner's measurement (a)).
**muna must therefore run in that very clone** (§1) or the L2 count it reads is a different, empty ledger.

M7 corrects one premise of the brief: public code DOES name a campaign path today — a TOOL path, `rails.mjs:153`.
No public file names the campaign LEDGER; `scripts/probe.mjs:173` states the law "the organism never imports the
campaign folder" (its code is COPIED, never imported). Fork F1 is ruled against both facts.

---

## 1. THE ORGAN

**File:** `scripts/muna.mjs` (new). **Header:**
`SOLE WRITER of: .git/muna_journal.jsonl in the clone it runs in (inside .git: never tracked, never pushed) — and
NOTHING in dressing-room/state/. It moves no ref, pushes nothing, edits no file of the tree; the ONLY writer of main is
scripts/land.mjs, run as a child, exactly as it stands.`

The journal mirrors the verb's own choice of place (`scripts/land.mjs:5-7`, `.git/land_ledger.jsonl`): no state path,
so no owners-only conflict, no groundsman publishing question (`scripts/groundsman.mjs` publishes an allowlist of
tracked state only), and the repo rail hook is never in play. (Fork F6 if the architect wants it elsewhere.)

**CLI:**
- `node scripts/muna.mjs pass` — ONE pass (§2–§6). Exit 0 always on a clean pass (LANDED, WAIT, LEFT, STAND-DOWN all
  print ONE line); exit 1 only when muna itself cannot run (no git, not a work tree). Task Scheduler's Last Result then
  means "muna ran", and the outcome is the printed line (the run_logged.cmd contract, `setup/INSTALL_CYBORG_TASKS.ps1:11-46`).
- `node scripts/muna.mjs status` — ONE line: last pass ts + outcome, the tips LEFT for the runner (RE-CUT / STACKED /
  NO-NAMES-RESULT) by unit and sha7, and the verb's own `count` line verbatim.
- No `selftest` mode: the witness at `ci/muna/witness_muna.mjs` is the proof (F10 A, row 1066; `land.mjs:15`).

**Hard refusals at the door (before any git read):** `ANTHROPIC_API_KEY` set ⇒ refuse (the organism-wide law,
CLAUDE.md "What this is"); muna names no model, spawns no `claude`, binds no port, opens no socket. Its only children:
`git`, `node scripts/land.mjs`, `node scripts/ci_verdict.mjs`, `node scripts/captains_call.mjs`, and the adoption gate
named by the door (F1).

**Schedule:** one row in `setup/INSTALL_CYBORG_TASKS.ps1`, beside `:165`, through the SAME `Mk` (`:11-46`: the
hidden_task.vbs cloak + run_logged.cmd, so the organ's exit code is Task Scheduler's Last Result and `scripts\muna.log`
exists), e.g. `Mk "ArsenalFC-Muna" "muna.mjs pass" @("/SC","MINUTE","/MO",<F4>)`, and its name added to
`setup/UNINSTALL_CYBORG_TASKS.ps1:2` (`$names`) so the revert removes it. The interval is NOT typed here (fork F4).
After he runs the installer once on his laptop, `node scripts/watchman.mjs expect ArsenalFC-Muna --why "…"`
(`scripts/watchman.mjs:83-95`, the SOLE WRITER of tasks_expected.json) records it; organism_test's installer read
(`scripts/organism_test.mjs:911-921`, `installerRegistrations`) sees the new row in the installer.

---

## 2. THE INPUT — a candidate is ADOPTED by an architect row, read from the units ledger, never inferred

Code path (`pass`, step A–C):

- **A · the L2 licence, read from the verb.** Run `node scripts/land.mjs count` (`land.mjs:347`, printer `:74-77`), parse
  `unattended (\d+) of (\d+)`. `n < N` ⇒ **STAND-DOWN**: journal, print, no verb call, no card. muna keeps NO counter:
  the verb's ledger is the only count (`land.mjs:68-72`, reset on a `human:true` row). Consequence, by design: after
  any stop a human resolves, muna stays down until the runner has landed N by hand again (fork F2).
- **B · the land refs, from origin itself.** `git ls-remote origin "refs/heads/land/*"` → `(unit, sha)` pairs
  (groundsman reads them the same way, `groundsman.mjs:291-300`). A branch NAME is only an address here.
- **C · the adoption, through the door (F1).** For each `(unit, sha)`, ask the adoption door: ADOPTED only when the
  units ledger holds an `adopted` row for **this unit AND this exact sha** and no later `landed` row for it. A tip
  re-pushed after adoption (sha differs) is NOT adopted. A commit message, a branch name, a green verdict — none is
  read as adoption. The door absent or unreadable ⇒ **NO-DOOR**: no landing, ONE card keyed `muna:door` (§6), journal.
- Order: adoption order as the ledger gives it (oldest adopted first); unknown order ⇒ refname order (NAMED §N2).

## 3. THE LEGS — the public reader on the land tip sha

For the first adopted candidate that passes §5's parent check: `node scripts/ci_verdict.mjs <T>` (`ci_verdict.mjs:15-17`,
at most three anonymous calls, no token). Parse its `ci_verdict <sha7> (GREEN|RED|PENDING|NONE|UNREADABLE)` line with the
verb's own pattern (`land.mjs:131-132`). Anything but GREEN with exit 0 ⇒ **WAIT VERDICT-<v>**, no verb call this pass,
next candidate NOT tried (one verdict read per pass keeps the anonymous budget the reader's header protects). The verb
then reads the verdict AGAIN at T (`land.mjs:214-216`, C1 "the sha judged is the sha landed"): muna's read is a
pre-filter, never a carried verdict.

## 4. THE VERB AS IT STANDS

muna runs `node scripts/land.mjs <unit> [--names-gate <file>]` with `cwd` = its own ROOT (land.mjs resolves ROOT from
its own path, `:39-40`). It never edits land.mjs, never passes `--dry` as a substitute, never retries around a refusal
in the same pass, never stashes, fetches into main, or pushes. `--live` is passed only if the adoption row names live
witnesses (F7). Every refusal stays the verb's, by the line that raises it:

| Refusal | Raised at | muna's reading |
|---|---|---|
| SITTING-OPEN / SITTING-UNREADABLE | `land.mjs:219` / `:220` | WAIT — retried next pass, no card |
| NAMES-GATE-ABSENT / NAMES-LIST-PATH | `land.mjs:213` (gate `:140-157`) | LEFT NO-NAMES-RESULT — runner (F3) |
| TRIPWIRE | `land.mjs:210` | human stop (in `HUMAN_STOPS`, `:47`) ⇒ ONE card |
| VERDICT-RED / -PENDING / -UNREADABLE | `land.mjs:216` (`verdictAt :129-137`) | WAIT |
| JUDGE-HELD / JUDGE-UNREADABLE | `land.mjs:242` / `:241` | WAIT |
| MAIN-MOVED | `land.mjs:189` | LEFT RE-CUT — runner (§5) |
| LOCAL-AHEAD / LOCAL-BEHIND | `land.mjs:185` / `:186` | WAIT (the groundsman / a pull meets origin) |
| LOCAL-DIVERGED | `land.mjs:187` | human stop ⇒ ONE card |
| NOT-ON-MAIN | `land.mjs:179` | WAIT (he has another branch out) |
| MULTI-COMMIT / MERGE-COMMIT | `land.mjs:182` / `:176` | LEFT — runner |
| STATE-PATH / SETTINGS-PATH / NO-CI-DIR | `land.mjs:194` / `:195` / `:204` | LEFT — runner |
| NO-FETCH / NO-BRANCH / NO-MAIN / BAD-UNIT | `land.mjs:171` / `:174` / `:178` / `:168` | WAIT |
| LIVE-RED (STOP, exit 3) | `land.mjs:227`, `:230` | human stop ⇒ ONE card |
| DIRTY-PATH / NOT-FF (STOP, exit 3) | `land.mjs:252` / `:253` | human stop ⇒ ONE card |
| PUSH-REJECTED (exit 4) | `land.mjs:260` | the VERB files its own card (`:259`, key `land:<unit>:push`) ⇒ muna files NONE |

**Which refusal needs a human is the verb's call, never muna's list.** muna reads the row the verb just appended to
`.git/land_ledger.jsonl` (`land.mjs:164`, field `human`, set from `HUMAN_STOPS` `:47`) — read-only, the last row whose
`unit` and `sha` match and whose `ts` is after the pass began. No copy of `HUMAN_STOPS` in muna (fork F5).

## 5. ONE LANDING PER PASS · a re-cut is never muna's

- **One verb call per pass**, whatever it answers. After it, the pass ends. (Stricter than "one landing": a refusal
  does not let a second candidate run in the same pass — F8.)
- **Parent check before the verdict read**, by git only: `T^1 == origin/main` (the verb's own `:189`). Otherwise:
  - parent is the sha of ANOTHER adopted land tip ⇒ **STACKED** (lands once that one has landed; no verb call);
  - else ⇒ **LEFT RE-CUT** for the runner: journaled, named by `status`, no verb call, no card, no ref written. muna
    never runs `git merge-tree`, never commits, never pushes a `land/*` or `refs/keep/*` ref.
- Two tips adopted on the SAME parent: pass 1 lands one; on pass 2 the other is a RE-CUT (main moved) and is left.

## 6. THE STOP THAT NEEDS A HUMAN — ONE card, counted by the verb

- When the verb's row says `human:true` (and it did not file its own card, i.e. not PUSH-REJECTED), muna files:
  `node scripts/captains_call.mjs file --line "<Hinglish one line: unit, sha7, stop name, who acts>" --key muna:stop:<unit>:<sha12>:<NAME> --why-code-cannot-decide "<why>"`.
- **Dedup is the door's own:** `fileGuard` (`captains_call.mjs:1533-1544`) mints nothing for a key ever seen, live or
  settled. The key never ends in a bare date, so the rolling-key rule (`:1532`) never applies. `--why-code-cannot-decide`
  (`:1937-1938`) carries the reason per call, because the key-family table is shrink-only (`captains_call.mjs:349-356`).
- **Belt two:** a human stop resets the verb's count to 0 (`land.mjs:70`), so step A stands muna down from the very
  next pass — the verb is never called again on that stop, so no second card can even be attempted.
- **Counted by the verb only.** muna's journal records what it did; it never computes "landings since". `status` prints
  the verb's `count` line verbatim.

## 7. THE WITNESS — `ci/muna/witness_muna.mjs --org <build> --base-org <base>`

Shape copied from `ci/mland/witness_mland.mjs:6-12,56-75`: real git under `os.tmpdir()` — a bare origin, a "laptop" clone
with main checked out (runs muna), a "seat" clone that pushes `land/<unit>`, an "other" clone that moves origin. From the
tree under judgement: `scripts/muna.mjs` and `scripts/land.mjs` (unchanged). Every other organ is a PLANTED stub:
`ci_verdict.mjs` answers from `MUNA_V_FILE` (a sha→verdict JSON under the temp dir — **the reader's env door**),
`sitting.mjs` answers `MUNA_S`, `archivist.mjs tripwire` refuses an oura credential path, `keeper.mjs` answers
`judgeHeld=false`, `captains_call.mjs` records argv to `MUNA_LOG` and applies exact-key dedup. The adoption door is a
planted `.git/muna_door.json` naming a planted gate script that reads a planted units ledger under the temp dir. The
L2 licence is planted as ten `LANDED` rows in the laptop clone's `.git/land_ledger.jsonl`. No live state, no network
(origin is a file path; the reader is a stub), no model call, no port bound, every child wait bounded by the child's
own exit (no sleep, no poll).

Each clause runs on `--base-org` (must be RED: base carries no `scripts/muna.mjs`, so the clause names `muna.mjs absent`)
and on `--org` (must be GREEN). LAST LINE: `GREEN MUNA landing with no session awake · <n> clause(s)` / `RED MUNA · <clauses>`.

| Clause | Plant | GREEN on the build | Mutant (RED under it) |
|---|---|---|---|
| U1 adopted lands | adopted row for (u1, T), T^1 = origin main, verdict GREEN | `LANDED u1`, laptop main == origin main == T | M1 skip the verb call (print LANDED without it) |
| U2 unadopted green | land/u2 green, no adopted row | main unmoved, verb never called (stub log), verdict never asked | M2 treat every land ref as adopted |
| U2b sha mismatch | adopted row names X, origin land/u2b is Y | not landed | M2b match adoption by unit only |
| U3 red / missing leg | adopted, verdict RED; then NONE | main unmoved, verb never called | M3 accept NONE as GREEN |
| U4 sitting open kept | adopted, green, MUNA_S=OPEN | verb ran, `REFUSED SITTING-OPEN`, main unmoved, no card; next pass with CLOSED lands | M4 pass `--dry` / skip the verb when sitting open is read by muna itself |
| U5 re-cut left | adopted, T^1 ≠ origin main ("other" moved origin) | verb never called, `status` names `RE-CUT u5`, origin land/u5 unchanged, no ref written | M5 muna merges T onto main (re-cut by itself) |
| U6 one per pass | A adopted on main, B adopted stacked on A | pass 1 lands A only (one verb call), pass 2 lands B | M6 loop the verb over all candidates |
| U7 one stop, one card | adopted, dirty file at a path T changes | pass 1 `STOP DIRTY-PATH`, exactly ONE `file` argv with key `muna:stop:u7:…:DIRTY-PATH`; pass 2 stands down (count 0), no second `file`; `land.mjs count` reads 0 | M7 file a card on every pass (drop the L2 stand-down and the key) |
| U8 verb's own card | origin refuses the push | `PUSHED NO`, exactly one card and it is the verb's `land:u8:push`; muna files none | M8 muna files on exit 4 too |
| U9 stand-down | ledger with fewer than ten LANDED since a human row | verb never called | M9 ignore the count line |
| U10 hygiene | ANTHROPIC_API_KEY set; source scan | refuses at the door; muna.mjs names no `claude`, no `--force`, no `push`, no `listen(`; BOUND: base..build differs only in `scripts/muna.mjs`, `ci/muna/`, the two installer lines | M10 drop the key refusal |

LAST: no node process naming the temp dir survives; the temp dir is removed.

---

## 8. WHAT THE RUNNER STILL DOES BY HAND after muna

1. **Cuts every land tip** (`land/<unit>` from a seat's build, `git merge-tree`, one commit) and pushes it.
2. **Every re-cut** (muna leaves RE-CUT and STACKED-orphan tips named in `status`), incl. `refs/keep/<unit>-<sha7>`.
3. **The names-gate result** for each tip (F3) — off the repo, sha-bound.
4. **Reads the witnesses and the neutral verdict**, takes the tip to the architect; **the rows**; the adoption row
   itself is written by the campaign tool, never by muna.
5. **Every human stop** muna cards (DIRTY-PATH, NOT-FF, LIVE-RED, TRIPWIRE, LOCAL-DIVERGED), and `land.mjs push <unit>`
   after a PUSH-REJECTED (the verb's card).
6. **Acts the verb prints and never runs** (`land.mjs:244-246,264`: `npm ci`, stale units) — muna journals the LANDED
   line; restarting a stale unit stays a hand act (F9).
7. **Installs the schedule once** on his laptop and runs `watchman.mjs expect ArsenalFC-Muna`.
8. **Re-earns the L2 licence by hand** after any human stop (F2 A).

**Timer duty muna would retire (only once ruled AND built — row 1297 (2)):** the in-session timer step that waits for an
architect adoption and then runs `land.mjs <unit>` on the adopted tip. The two timers themselves are not identifiable
from the cloud (§N4); whatever else they do stays.

---

## FORKS (each the architect's to rule)

- **F1 · THE ADOPTION DOOR.** (A) muna runs the campaign wrapper's OWN adoption gate as a child, its argv read from a
  door file inside `.git` (`.git/muna_door.json`, never tracked — the land ledger's place); exit 0 = adopted for
  (unit, sha). One reader of the ledger, no second parser, no campaign path in public code. (B) muna parses the
  ledger JSONL itself, path from the same door file. (C) the runner mirrors each adoption into a git ref on origin
  (`refs/adopted/<unit>` → sha) that muna reads by ls-remote. (D) muna imports a campaign module. **Recommend A**
  (B duplicates the parser; C makes a ref, not the ledger, the source the row forbids inferring from; D breaks
  `probe.mjs:173`). Decides it: the wrapper gate's CLI and exit codes on his laptop (§N1).
- **F2 · THE L2 LICENCE.** (A) every pass requires `land.mjs count` ≥ N; after any human stop muna stays down until N
  hand landings. (B) the licence is read once at install, never again. **Recommend A** (a gate only gets stricter;
  the verb's count is the licence the row names). Decides it: the architect's reading of row 1029 L2.
- **F3 · THE NAMES-GATE RESULT.** (A) the runner produces it at cut time (sha-bound JSON the verb already checks,
  `land.mjs:146-151`) into the door dir as `<unit>_<sha>.json`; muna passes it, never sees the list. (B) muna runs the
  campaign names tool itself per pass. (C) muna leaves every tip with new `ci/` files. **Recommend A** (C lands none:
  M4 shows every recent landing adds `ci/` files; B puts the names list in reach of a scheduled organ). Decides it:
  where the campaign names tool writes its result today (§N3).
- **F4 · THE INTERVAL.** (A) `/SC MINUTE` at an interval the architect names; (B) `/SC HOURLY`; (C) DAILY before
  Groundsman-Push. **No recommendation of a number** (the brief forbids typing one); note the reader's anonymous budget
  (`ci_verdict.mjs:15-17`) and that groundsman's LAND-WAIT (`groundsman.mjs:275-290`) holds the night push while a
  young land ref is unlanded. Decides it: how long adopted tips wait today (adoption→landing gap in the campaign ledger).
- **F5 · WHICH STOP CARDS.** (A) muna reads the verb's own ledger row `human` field (no copied list). (B) export
  `HUMAN_STOPS` from land.mjs (an edit to the verb — forbidden by this brief unless ruled). (C) muna parses the printed
  name against its own copy. **Recommend A.**
- **F6 · THE JOURNAL'S PLACE.** (A) `.git/muna_journal.jsonl`. (B) `dressing-room/state/muna.jsonl` (a new state file,
  gitignore + groundsman allowlist questions). **Recommend A.**
- **F7 · `--live` WITNESSES.** (A) passed only when the adoption row names them; (B) never. **Recommend A** if the
  ledger carries them, else B (§N2).
- **F8 · AFTER A REFUSAL.** (A) one verb call per pass, full stop. (B) try the next candidate in the same pass.
  **Recommend A.**
- **F9 · ACTS AFTER AN UNATTENDED LANDING** (`npm ci`, stale units printed by the verb). (A) journal only, runner
  reads `status`. (B) ONE card per landing with acts. **Recommend B when the acts list is non-empty** (a stale daemon
  is his machine running old bytes), keyed `muna:acts:<unit>:<sha12>`.
- **F10 · CONCURRENCY.** (A) no lock: ff-only + non-force push make a race between muna and a hand verb safe (the
  loser reads LOCAL-BEHIND / MAIN-MOVED); Task Scheduler's MultipleInstances keeps passes single. (B) a `.git/muna.lock`.
  **Recommend A**, after §N5 is measured.
- **F11 · FILES BEYOND** the named set: `setup/UNINSTALL_CYBORG_TASKS.ps1:2` (one name added) — ruled with F4.

## NAMED, NOT GUESSED (unreachable from the cloud; what measures it on his laptop)

- **N1** the campaign wrapper's adoption gate: path, argv, output, exit codes — `node <gate> --help` / its header.
- **N2** the units-ledger row schema (fields for unit, sha, event, row, live witnesses, order) — `head` of the ledger
  through the campaign tool's own reader.
- **N3** where and in what shape the names-gate result is written today — the campaign names tool's header; does it
  emit `{sha, result, paths, list_sha256}` as `land.mjs:146-151` expects.
- **N4** which two in-session timers row 1297 (2) means — the runner's session record.
- **N5** the MultipleInstances policy schtasks gives a `Mk` row — `(Get-ScheduledTask ArsenalFC-Groundsman-Push).Settings.MultipleInstances`.
- **N6** that his laptop clone's `.git/land_ledger.jsonl` is the one the runner's landings wrote (the "48 of 10") —
  `node scripts/land.mjs count` run from `C:\Users\nikhi\GitHub\arsenal-ai-fc` (the installer's `$repo`).
- **N7** whether his tree normally has `main` checked out at the hours muna would run (`NOT-ON-MAIN`, `land.mjs:179`).

## FILES A BUILD WOULD TOUCH

- `scripts/muna.mjs` (new) · `ci/muna/witness_muna.mjs` (new) · `ci/muna/BASE` (new, 40-hex, NO-CI-DIR law `land.mjs:196-205`)
  · `ci/muna/PROOF.md` + mutant runner (new) · `setup/INSTALL_CYBORG_TASKS.ps1` (one `Mk` row beside `:165`).
- Beyond them, a fork: `setup/UNINSTALL_CYBORG_TASKS.ps1:2` (F11). Nothing else; never `scripts/land.mjs`,
  `scripts/captains_call.mjs`, `scripts/ci_verdict.mjs`, `scripts/groundsman.mjs`.

## STATUS

Spec complete at this push; nothing built. Ledger: `ci/muna/LEDGER.jsonl`.
