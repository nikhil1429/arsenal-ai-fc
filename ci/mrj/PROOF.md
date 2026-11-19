# mrj — PROOF (cloud build seat, 19 Nov 2026)

Unit **mrj** · forks rows 1107 (2) / 1112 / 1119 · branch **`claude/mrj-build`**, cut at **`52b51c1`** (the ms1 tip the
architect re-ran GREEN, row 1119 (1)): `git fetch origin claude/ms1-build`, then `git checkout -b claude/mrj-build 52b51c1`.
`ci/mrj/BASE` = `52b51c194c47fee16bf1b10b30d98e45915b190f`. Spec: `ci/mrj/MRJ_SPEC.md` on `claude/mrj-spec` at `73823e6`
(read whole with its `REBASE.diff`, `mutants.sh`, `tree.sh` and `LEDGER.jsonl`; the two `.sh` files were read, never run as the
witness). Every act is a row in `ci/mrj/LEDGER.jsonl`.

## 1. The merge question (measured, no merge made — FORK M0)

The brief: "if a file you edit differs between 52b51c1 and origin/main, bring origin/main in by git merge". Measured 19 Nov 2026:
`git diff --stat 52b51c1 origin/main -- ci/mjud scripts/organism_test.mjs` differs, **but only by ms1's own additions** — the
merge base is `95b07a6` and `git diff --stat 95b07a6 origin/main -- ci/mjud scripts/organism_test.mjs ci/mrj` prints NOTHING
(origin/main `224f9b9`). A merge would bring no byte into any named file and would bring six foreign files (main's mport, mjd7,
mtxt land commits) into this branch, against BOUND and against row 1119 (2) ("build ONLY your unit"). So no merge; named here
as **M0** for the architect.

## 2. The build (named files only)

| File | At `52b51c1` | Change |
|---|---|---|
| `ci/mjud/witness_mjud.mjs` | `:127` M3 postmatch arm · `:143-144` M5 · `:148` M6 · header M3/M5/M6 | `REBASE.diff` applied exactly (`git apply --check` clean); header: each clause's old text kept **struck** (`~~…~~`) and the re-base named — unit mrj, row 1112 (1), fate (a), and the unit + rows that changed the behaviour (M3: mtail, rows 1017 (2)-(5) / 1019 (1), `074ead9`; M5, M6: mjd3, rows 1025 (4) / 1030, `3a73782`); F2 A, F4 A and F3 A named |
| `ci/mjud/w_drive.mjs` | `:63` facts.third · `:72` facts.kill2 | `REBASE.diff` exactly |
| `ci/mjud/BASE` | `5767e21…` | **unchanged** (F3 A) |
| `scripts/organism_test.mjs` | `:2914` | the one KNOWN_RED entry `WITNESS ‹mjud› · GREEN at head against its BASE` (owner `unit mrj`) removed; nothing else |
| `ci/mrj/*` | — | BASE, witness, mutants runner, PROOF, LEDGER |

No organ is touched (no fate (b)). `.claude/settings.json` is not edited, staged or carried (this branch is cut from `52b51c1`,
not from the queue branch).

### Spec vs ruling (the ruling wins; named)

- Row 1112 (1) reads "Fate (a) stands for **all four** clauses". The spec and the KNOWN_RED entry name **three** red clauses for
  mjud (M3, M5, M6); the fourth red on the ms1 §5.1 line is **BOUND**, a seat-time clause the member drops (F1 A) and which no
  re-base can turn (head differs from `5767e21` in far more than mjud's four named organs). Read as: the three are re-based; BOUND
  is left as the witness's seat-time clause, untouched. If "four" means something else, it is **Q1** below.
- F2 A, F3 A, F4 A are exactly the spec's recommendations; nothing differs.

## 3. The mjud witness, before and after (LF trees, `git -c core.autocrlf=false archive`)

| Leg (19 Nov 2026) | Last line |
|---|---|
| before · `--org T(52b51c1) --base-org T(5767e21)` | `RED MJUD · M3 CENSUS · M5 F3-CLIP · M6 MJD2 · BOUND` |
| after · `--org T(52b51c1 + build) --base-org T(5767e21)` | `RED MJUD · BOUND` (the member drops BOUND ⇒ GREEN) |
| BASE leg, both · `--org T(5767e21) --base-org T(5767e21)` | `RED MJUD · M1 SITTING · M2 DUGOUT · M3 CENSUS · M4 F3-EAT · M5 F3-CLIP · M6 MJD2 · M8 MAUTH` |

After, the detail lines: `GREEN M3 CENSUS … each covered` · `GREEN M5 F3-CLIP … killed at 40000 ms (owed 200000 − its settle
tail 160000, settleReserveMs 160000)` · `GREEN M6 MJD2 … next size 2; that size killed too ⇒ 0 (was 2)`.

## 4. The mrj witness — `ci/mrj/witness_mrj.mjs --org <dir> --base-org <dir>`

Clauses R1 M3, R2 M5, R3 M6 (the org's own mjud witness, run from a temp copy over the org), R4 MEMBER (the ms1 member's own
`boundIds` + `judgeLast`, sliced from the org's `scripts/organism_test.mjs`, never re-typed), R5 KNOWN, R6 HEADER, BOUND, LAST.
Its only bound is the org's own `timeout-minutes` in `.github/workflows/suite.yml` (read). It binds no port; the one listener in
the chain is mjud M1's port 0, unchanged.

| Leg (19 Nov 2026) | Last line |
|---|---|
| build · `--org T(eeba921) --base-org T(52b51c1)` | `GREEN MRJ mjud M3, M5, M6 re-based on mtail and mjd3, the member green and its ruled entry gone · 8 clause(s)` (exit 0) |
| base · `--org T(52b51c1) --base-org T(52b51c1)` | `RED MRJ · R1 M3 · R2 M5 · R3 M6 · R4 MEMBER · R5 KNOWN · R6 HEADER` (exit 1) |

BOUND and LAST are GREEN on both legs by design (BOUND compares a side with itself on the base leg). After every run,
`ps -eo pid,args | grep mrj-` lists nothing.

## 5. Mutants — `node ci/mrj/run_mutants_mrj.mjs --org T(540c258) --base-org T(52b51c1)` (19 Nov 2026)

```
CONTROL · GREEN MRJ … · 8 clause(s)
MU-R1 (→ R1 M3) · RED MRJ · R1 M3 · R4 MEMBER · BOUND
MU-R2 (→ R2 M5) · RED MRJ · R2 M5 · R4 MEMBER · BOUND
MU-R3 (→ R3 M6) · RED MRJ · R3 M6 · R4 MEMBER · BOUND
MU-R4 (→ R4 MEMBER) · RED MRJ · R4 MEMBER
MU-R5 (→ R5 KNOWN) · RED MRJ · R5 KNOWN
MU-R6 (→ R6 HEADER) · RED MRJ · R6 HEADER
MU-BOUND (→ BOUND) · RED MRJ · BOUND
MU-LAST (→ LAST) · RED MRJ · LAST
run_mutants: 8 of 8 mutant(s) RED by the clause that names them · control GREEN
```

MU-R1..R3 are the spec's three organ mutants (a revert of mtail F-B, of mjd3's kill point, of mjd2's floors), written as exact
node string replaces; they also redden R4 (the member sees the same red) and BOUND (they move an organ outside the named files),
which is the honest reading, not a leak.

## 6. The touched selftest — the suite, before and after (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`)

Run in two local clones (`git clone -c core.autocrlf=false`) of `52b51c1` and `fd22645`, 19 Nov 2026. Headline, identical:

```
before 52b51c1: organism_test: 139 passed, 5 failed · ruled 0 · UNRULED 5 · LIVE 126 (hermetic: named, not run)
after  fd22645: organism_test: 139 passed, 5 failed · ruled 0 · UNRULED 5 · LIVE 126 (hermetic: named, not run)
```

The five reds are this container's, identical on both sides: no `node_modules` here (fsrs, mutagen `ERR_MODULE_NOT_FOUND`), the
sandbox canary, the coverage-law orphans, and their roll-up. The witnesses member SKIPS here by B2 (not the neutral machine).

## 7. The member — before and after

MEMBER_PLACEHOLDER

## 8. `node scripts/models.mjs check` — exit 0 (19 Nov 2026, on the build).

## 9. The neutral machine (curl, no token: `GET /repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`)

CI_PLACEHOLDER

## 10. FORKS

- **M0 · no merge of origin/main.** §1: main changed no named file since the merge base `95b07a6`; a merge would carry only
  foreign files. (A) as done, no merge — **recommended**; (B) merge main anyway (the brief's literal reading).
- **M1 · "all four clauses".** §2: three re-based, BOUND left as seat-time. (A) as read — **recommended**; (B) the architect
  names the fourth.
- **M2 · R1-R3 mutants also redden R4 and BOUND.** (A) accept: the member must see a re-based clause's red — **recommended**;
  (B) require a mutant to be RED by its clause ONLY (then R1-R3 must mutate the witness, not the organ, and stop testing the
  re-base against a revert).
- **M3 · the effort receipt.** `campaign-2026-09/tools/effort_receipt.mjs` is not in this repository; its error is named in the
  final message; nothing is written under `campaign-2026-09/`.

## 11. NAMED, NOT GUESSED

| Fact | What measures it |
|---|---|
| Both witnesses on Windows (junction for node_modules, PowerShell CIM for LAST) | the neutral machine (`windows-latest`, §9), and on his laptop `node ci/mrj/witness_mrj.mjs --org <LF tree of the tip> --base-org <LF tree of 52b51c1>` |
| The member on the assembled land branch (ms1 + mrj + the other repair units) | the ms1 seat's land branch push, read by its check runs |
