# MPRES2 PROOF — the repair door of the activity watcher: one launcher alive is the bound, and dead means dead, not slow

Unit **mpres2** · forks rows 1235 (5) / 1251 / 1259 · cloud build seat, 21 Nov 2026 · branch `claude/mpres2-build`
Spec: `ci/mpres2/MPRES2_SPEC.md` at `bfb8e55` on `claude/mpres2-spec` (read whole; left as it is, not carried onto this branch).
Ledger: `ci/mpres2/LEDGER.jsonl`. Where the spec and row 1259 differ, the ROW wins; each difference is named in §6.

## 1. THE BASE

- Cut from **main `7bf008b4ced9dc1e23e8bce92cc5bdc77e8dc99f`** (`ci/mpres2/BASE`, one 40-hex line). `git fetch origin main && git rev-parse origin/main`
  read the same sha at the start and again at 12:34 UTC 21 Nov 2026 — main had not moved, so no newer sha is named.
- The spec cites lines at its own base 7bf008b, which IS this cut, so every file:line it cites holds at the cut unchanged
  (re-measured by `grep -n`, 21 Nov 2026). At the tip they moved; measured, cut → tip:

```
scripts/presence.mjs  fetchAwEvents 591 → 627 · inputSnapshot 695 → 728 · launcherDoor 708 → 749 · recordDeadInput 731 → 816
                      the gate `if (!snap.repair) {` 733 → 830 · sense 748 → 847 · the CLI dead line 1242 → 1399
scripts/senses.mjs    DEAD.presence 63 → 63
```

## 2. WHAT THE BUILD DOES (row 1259, F7 A: ONE build, all three classes)

| class | code path at the tip | ruling |
|---|---|---|
| one — a `none` record does not close the span | `REOPEN = ["none", "beside-running"]`; `inputSnapshot` carries a repair record only if its result is NOT in REOPEN; the gate `if (!snap.repair) {` is untouched | F1 B · F4 A (each pass writes a fresh `none`) · F5 A |
| two — never beside a running launcher | `launcherRunning(door, prior, deps)`: the pid of the door's OWN spawn (`launched`, carried in every snapshot) checked alive first (`deps.pidAlive`), else ONE listing by the launcher's leaf name (`deps.lister`; default `listByLeaf`: `Get-CimInstance Win32_Process` by Name on Windows, `ps -eo args=` elsewhere). Running ⇒ `repair.result = "beside-running"`, nothing spawned; that record is in REOPEN, so every abort or refused pass re-reads, and the door asks ONCE (the `asking` bound before the ask, unchanged) only when the launcher has died | F8 B · F10 C · §11 clause |
| three — slow or busy is not dead | `fetchAwRead` keeps the reason (`abort` · `refused` · `error:<code>` · `no-window-bucket` · `bad-json`, read from the error's own name / code) and the snapshot carries it as `dead_reason`; an abort beside a running launcher is a **busy** snapshot (`busy:true`, `busy_since`), which holds an open dead span's `dead_since` (null if none) and opens none; a server that answered (`no-window-bucket`, `bad-json`) is never listed and never relaunched; `senses.mjs` maps busy to an amber and `no-window-bucket` to `watcher absent` | F9 A · F11 A · F12 A · F13 B |

`fetchAwEvents` stays the array-or-null every caller reads (`fetchAwRead` is new beside it). The CLI `sense` line prints
`presence: input BUSY since <iso> (not dead: no relaunch)` on a busy pass and the repair result as before on a dead one;
the reason rides the snapshot only (F9 A — the CLI line is what `presence.log` holds, so it gains no reason field).
`presence.mjs` remains the sole writer of `presence_input.json` (the pid lives inside it: no new state file).

## 3. THE WITNESS BOTH WAYS (`ci/mpres2/witness_mpres2.mjs`, 21 Nov 2026, this container, Node v22.23.5)

Trees are `git archive` of each sha under the scratchpad (not git repos; a bare `git worktree add` is refused by the repo rail).

```
$ node ci/mpres2/witness_mpres2.mjs --org <7bf008b> --base-org <7bf008b>
RED MPRES2 · M1, M2, M4, M6, R1, R2, R4, R5, F8, F10, S1, S3, S4, S6, S7, S8          (exit 1)
  — every behavioural clause RED; the seat-time four (NO-REAL-LIST, BOUND, NO-TRACK, LAST) GREEN, as in the mpres pattern
$ node ci/mpres2/witness_mpres2.mjs --org <tip> --base-org <7bf008b>
GREEN MPRES2 the repair door asks once per span, never beside a running launcher, and reads busy, not dead, while the port is held · 20 clause(s)   (exit 0)
  BOUND · 5 file(s) differ: ci/mpres2/BASE, ci/mpres2/run_mutants_mpres2.mjs, ci/mpres2/witness_mpres2.mjs, scripts/presence.mjs, scripts/senses.mjs
```

The conditions of row 1259, each a clause:

| condition | clause(s) |
|---|---|
| C1 F7 A — one build, three classes | class one M1 M2 M4 M6 · class two R1 R2 R4 R5 F8 F10 · class three S1 S3 S4 S6 S7 S8 |
| C2 F8 B — a listing is not a launch; re-read; ask once only if the launcher died | F8 (two beside-running passes, two listings, then died ⇒ one ask, then closed) |
| C3 F10 C — pid first, else ONE listing by the leaf; the lister a seam in every clause | F10 (pid alive ⇒ no listing; pid gone ⇒ one listing by leaf) · every module clause hands `deps.lister` + `deps.pidAlive`; CLI clauses run under `--import plantnet.mjs` (execFile answers a planted listing, spawn records and answers ENOENT) · NO-REAL-LIST proves zero real lister / spawn calls in the witness process |
| C4 F11 A — busy a named amber on the state line | S6: the line ends ` · senses ? presence busy since 20 Nov 21:50 IST`, no `senses ✗` |
| C5 F12 A — busy never dead by a typed stretch | S7: 72 hourly abort passes over three days all busy, `busy_since` unchanged, zero asks; no count or age is typed in the code |
| C6 F13 B — launcher read only where nothing answered | S3: no-window-bucket and bad-json ⇒ zero listings, zero asks |
| C7 THE HELD DOOR — never re-seeds, never edits state | R5 plants the retire / re-seed on a TEMP registry through the owner CLI only; §5 names the landing step; nothing under `dressing-room/state` of this repo is written (NO-TRACK: `git status --porcelain` unchanged by every run) |

## 4. MUTANTS (`ci/mpres2/run_mutants_mpres2.mjs`, 21 Nov 2026)

```
$ node ci/mpres2/run_mutants_mpres2.mjs --org <tip> --base-org <7bf008b>
  control · GREEN MPRES2 the repair door asks once per span, never beside a running launcher, and reads busy, not dead, while the port is held · 20 clause(s)
run_mutants: 16 of 16 mutant(s) RED by the clause that names them · control GREEN
```

One per behavioural clause: M1 `none` closes again · M2 nothing carried · M4 only the absent-row `none` reopens · M6 the CLI
row read short-circuited · R1 the running check skipped · R2 beside-running mapped to no evidence · R4 every reason collapsed ·
R5 the launcher never read · F8 beside-running closes the span · F10 the pid never read · S1 abort reads dead · S3 a server
that answered is relaunched · S4 busy carried into dead_since · S6 the amber kept off the line · S7 a repeated busy pass turns
dead · S8 a busy pass drops the open span.

## 5. NO OTHER MEMBER TURNS RED (measured 21 Nov 2026, this container)

```
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all          # at the cut 7bf008b, then at the tip
cut  organism_test: 150 passed, 8 failed · ruled 0 · UNRULED 8 · LIVE 125 (hermetic: named, not run)
tip  organism_test: 150 passed, 8 failed · ruled 0 · UNRULED 8 · LIVE 125 (hermetic: named, not run)
  the ok/FAIL member lines diffed cut vs tip: identical. The 8 reds at both are the bare-container ones the spec named at the
  same base (lawpack, ci_verdict, red_cause, done, probe, fsrs, mutagen and their roll-up — ERR_MODULE_NOT_FOUND, no node_modules here)
  the touched members, cut and tip alike:  ok   SUITE MEMBER · presence selftest exits 0  ·  ok   SUITE MEMBER · senses selftest exits 0
$ node scripts/presence.mjs selftest | tail -1      cut: ALL CHECKS PASSED                  tip: ALL CHECKS PASSED
$ node scripts/senses.mjs selftest | tail -1        cut: senses selftest: 18 passed, 0 failed   tip: senses selftest: 21 passed, 0 failed
$ node scripts/models.mjs check                     cut: exit 0                             tip: exit 0
$ node ci/mpres/run_mutants_mpres.mjs --org <cut> --base-org <cut>
run_mutants: 16 of 16 mutant(s) RED by the clause that names them · control GREEN
$ node ci/mpres/run_mutants_mpres.mjs --org <tip without ci/mpres2/> --base-org <cut>
run_mutants: 16 of 16 mutant(s) RED by the clause that names them · control GREEN
$ node ci/mpres/witness_mpres.mjs --org <tip> --base-org <cut>
RED MPRES · BOUND      — only BOUND, and only on ci/mpres2/* (this unit's own dir); every mpres anchor kept exactly once
```

The suite's WITNESSES member drops every BOUND id from a landed witness's last line (`judgeLast`, `scripts/organism_test.mjs`),
so the mpres witness at a head that carries `ci/mpres2/` reads GREEN there; this witness's own BOUND is dropped the same way once
main moves past its base.

## 6. THE SPEC AND THE ROW — every difference, the row winning

1. **Witness kind and place.** Spec §5 named `ci/witness/mpres2/` (a clause witness, `plants` mode). The brief names the UNIT
   witness `ci/mpres2/witness_mpres2.mjs` with `ci/mpres2/BASE`; no clause witness is written, so the unit carries one kind.
2. **F7.** Spec recommended B (two builds); row 1259 rules **A**: one build carries all three classes.
3. **F8.** Spec §11.3 item 1 had `beside-running` CLOSE the span (option A text); row rules **B**: it is in REOPEN, re-read
   every abort or refused pass, one ask when the launcher has died.
4. **F10.** Spec recommended B (a pid file only); row rules **C**: pid first, else ONE listing by the leaf name. The pid lives
   in `presence_input.json` (`launched`), not a separate file — one writer, one file, already gitignored.
5. **Guards folded.** Spec guard rows M3, M5, R3, S5 (GREEN at base) ride as legs of M1, M2, R1, S1, so every behavioural clause
   reads RED at base; S2 (refused beside a running launcher) is held by F8, R1 and M6's second tree.
6. **`fetchAwEvents`.** Spec §12.2 had it return `{events, reason}`; built as `fetchAwRead` returning that, with
   `fetchAwEvents` unchanged (its callers and the selftest's honest-null assert are untouched).
7. **The busy snapshot** keeps `alive:false` beside `busy:true`, so the landed mpres anchors (the `dead_since` line, the senses
   `alive` predicate) hold exactly once; `senses.mjs` reads `busy` first.
8. **F11 A on a line this unit may not edit.** `scripts/state.mjs` is never edited here, so the amber rides its stated-unknown
   tail: `senses.mjs` puts `presence busy since <IST>` into `unknown` (and the structured `amber[]` beside it). The line reads
   ` · senses ? presence busy since 20 Nov 21:50 IST` — the words of C4; the glyph is `?`, not a dedicated amber (FORK FB1).
9. **M6 spawn.** Spec M6 let the one real `spawn` get ENOENT from the OS; here the child's spawn is PLANTED (records, answers
   ENOENT), so the CLI clauses also COUNT the asks and nothing can start.
10. **Readings made where the spec was silent** (each a line of code, each witnessed): a socket failure other than refused
    (`error:<code>`) is read like refused (nothing answered: the launcher is read); `bad-json` is never relaunched (the server
    answered); a listing that cannot be read writes `none` (no ask, re-read next pass); an abort with no launcher named (the
    row absent or retired — today's held door) reads dead with `none`, not busy, because there is no leaf to list.

## 7. THE LANDING (row 1259, in order — the runner's, on his laptop; this seat runs none of it)

1. Land the build on main. **Never re-seed before the build is on main.**
2. Re-seed through the owner CLI with the retired field false and the values of the SAVED row (read there, never typed by a
   seat): `node scripts/registry.mjs set --table self_repair --json '{"subject":"activitywatch", …the saved row's artifact,
   verified_by, report_anchor, witness, launcher, launcher_args…, "reversible":true, "retired":false}'` — `retired:false`
   explicit, because `upsertRow` MERGES (R5 witnesses that a `set` omitting it leaves `retired:true`).
3. One read shows the row live — `node -e "import('./scripts/registry.mjs').then((r) => console.log(r.rowOf('self_repair','activitywatch').retired))"`
   prints `false` — and the next dead pass reads `repair beside-running (…)`, not `asked` (`node scripts/presence.mjs sense`
   on a dead pass, or the snapshot's `repair.result`).

**OWED BY THE RUNNER AT LANDING (named, not guessed):** the time of one listing on his laptop (`Get-CimInstance Win32_Process
-Filter "Name='<the row's launcher leaf>'"`, timed), and which reason the next dead span names (`dead_reason` in
`presence_input.json`: abort · refused · error:<code> · no-window-bucket · bad-json). Also his laptop's own: that the leaf of the
row's `launcher` equals the running launcher's process Name (the listing matches `<leaf>` and `<leaf>.exe`).

## 8. FORKS (for the architect)

- **FB1 · the amber glyph.** The busy amber reads `senses ? …` because `scripts/state.mjs` is not this unit's file. (A) keep it;
  (B) a later unit renders `senses ~ presence busy since …` in `stateFrom` from `senses.amber`. Not edited here.
- **FP · a recycled pid.** If the door's own launcher exits and the OS reuses its pid for another long-lived process, the pid
  read says running and the door stays shut (each span `beside-running`) until a read finds the pid gone. It errs toward no
  relaunch (the 21 Nov harm). (A) accept; (B) cross-check the pid with one listing by the leaf (one listing per pass more).
- **FS · a listing that cannot be read** writes `none` (asks nothing). (A) accept — the safe side; (B) ask anyway.
- **FA · an abort with no launcher named** reads dead (today, with the row retired, every abort span is dead + `none`; the
  pid of the door's own spawn is still read first). (A) accept; (B) read every abort as busy while no launcher is named.

## 9. CHECK RUNS (the neutral machine)

Named in the ledger at each checkpoint push (public API, curl, no token).

CHECKPOINT · 2026-11-21T12:40Z · build, witness and mutants complete and green; resume from: read the check runs of this push, then the effort receipt.
