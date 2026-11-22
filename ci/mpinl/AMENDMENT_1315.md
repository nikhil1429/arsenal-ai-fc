# UNIT mpin-law · SPEC AMENDMENT (forks row 1315 (1)): a rule born with its baseline is not a rise

Branch `claude/mpinl-spec`, cut from main **84cbc03126eddb85c7d5cf54b51610068800315c** (22 Nov 2026). This is a SPEC ONLY: nothing is
built here, and no organ or witness is edited on this branch. The car it amends is `claude/mpinl-build` at 8e46d96 (its law:
`scripts/lawpack.mjs` with the two keys `own-literal-pin` and `own-source-pin-unresolved`). The train's land ref 70d9d0a is not
reachable from this session (`git cat-file -t 70d9d0a` → not a valid object, 22 Nov 2026), so every measurement below was taken on
main 84cbc03 and on the car's own tree.

## THE RULING, VERBATIM (row 1315 (1))
"mpin-law is OUT of train 1; eleven cars ride on the mtrain cut. Its seat makes its own car green on the whole suite: row 1137 (2)
already says a base with no line for a count is compared against the frozen baseline, and the verdict reads a rule the base never
had as 0. The seat measures where that reading lives and returns ONE spec amendment: the rule's frozen baseline rides in its own
commit and the ratchet, mlaw P1 and mrung G3 read a rule born with a baseline against it, with mutants; no known-red entry, no
baseline raised later."

## §1 · WHERE THE READING LIVES (main 84cbc03, file:line, 22 Nov 2026)

| # | Reader | file:line | What it does with a count the base has no number for |
|---|---|---|---|
| R1 | the verdict's rise rule | `scripts/ci_verdict.mjs:105` | `b = baseLp && law in baseLp ? baseLp[law] : baseline && Number.isSafeInteger(baseline[law]) ? baseline[law] : 0`. It already reads a law the base does not count against the frozen baseline, as row 1137 (2) says (its own doc at `:91-97`, its selftest at `:517-518`). |
| R2 | the verdict's caller | `scripts/ci_verdict.mjs:629` | `const baseline = head && head.lawpack && base && !base.lawpack ? await frozenBaseline() : null;`. It loads the baseline ONLY when the base printed NO law pack line. A base that printed a line WITHOUT the new key therefore hands R1 `null`, and R1 falls to its `: 0`. **This is the "read as 0".** |
| R3 | the baseline door | `scripts/ci_verdict.mjs:58-63` | `frozenBaseline()` imports `BASELINE` from `./lawpack.mjs` beside the running ci_verdict.mjs, which is the HEAD's checkout in `suite.yml` (`.github/workflows/suite.yml:294`). |
| R4 | the ratchet | `scripts/lawpack.mjs:559-568` | `judge()` compares each key of `BASELINE` (`:123`) against its count. A count with no key is `NEW LAW … never grandfathered` (`:567-568`; selftest `:770-771`). A rule whose key rides in `BASELINE` is already read against it. No change needed. |
| R5 | mlaw P1 (clause `JUGAD`, header `ci/mlaw/witness_mlaw.mjs:26-29`) | `ci/mlaw/witness_mlaw.mjs:195` | `rose = Object.keys(o.n).filter((k) => o.n[k] > (b.n[k] ?? 0))`: a key absent at --base-org reads 0. |
| R6 | mlaw P1, same clause | `ci/mlaw/witness_mlaw.mjs:193-194`, `:200` | `bo === bb`: the WHOLE `export const BASELINE = { … }` text must be byte-equal on --org and --base-org, so a commit that adds a key is RED by text. |
| R7 | mrung G3 (header `ci/mrung/witness_mrung.mjs:38-39`) | `ci/mrung/witness_mrung.mjs:288` | `higher = Object.keys(a.c).filter((k) => !(k in b.c) \|\| a.c[k] > b.c[k])`: a key absent at --base-org is "higher" whatever its number. |

THE READING, MEASURED (R1 run on main 84cbc03's own `scripts/ci_verdict.mjs`, `lawpackRises` called in process, 22 Nov 2026):
```
A as wired (base line present, baseline null): ["LAW PACK ROSE · own-literal-pin 0 → 39","LAW PACK ROSE · own-source-pin-unresolved 0 → 79"]
B baseline handed in:                          []
C raised later (base 39, head 45, baseline 45): ["LAW PACK ROSE · own-literal-pin 39 → 45"]
D born with no baseline:                       ["LAW PACK ROSE · x-new 0 → 2"]
```
A is the train's red line, to the character. B shows that R1 is already right once R2 hands it the baseline. C shows that a baseline
raised later is still a rise, because the base's own count wins over any baseline. D shows that a rule born without a baseline is
still red (nothing is grandfathered).

## §2 · THE AMENDMENT

### A0 · what "born with a baseline" means
A count K is BORN at a head when two things hold:
- the head's `scripts/lawpack.mjs` `BASELINE` has the key K;
- the base does not count K: its law pack line has no K, or (for the two witnesses) its own `BASELINE` has no K.

A born K is judged against the head's `BASELINE[K]`. Every count the base DOES count keeps being judged against the base's number,
unchanged. So:
- raising a baseline later moves nothing (case C);
- a rule with no baseline key reads 0 and is RED (case D, and R4's NEW LAW).

### A1 · the rule's frozen baseline rides in its own commit
The car's `scripts/lawpack.mjs` carries the judge (`ownLiteralPins`), the two `counts` keys and the two `BASELINE` keys in ONE
commit. No tree ever counts the keys without their baseline. The values are the tree's own read at landing (row 1160 (2)): 39 / 79
on the car's merged tree of main 7bf008b, read by `node scripts/lawpack.mjs report` (21 Nov 2026). The landing seat re-reads them
on the land tree as the car's last commit, never higher than that read.
- **No known-red entry.** Nothing is added to any list of tolerated reds. The count simply equals its baseline.

### A2 · the verdict: R2 only (`scripts/ci_verdict.mjs:629`)
```
- const baseline = head && head.lawpack && base && !base.lawpack ? await frozenBaseline() : null;
+ const baseline = head && head.lawpack && base && (!base.lawpack || Object.keys(head.lawpack).some((k) => !(k in base.lawpack))) ? await frozenBaseline() : null;
```
R1 (`:105`) is unchanged. It already reads `law in baseLp ? baseLp[law] : baseline[law] ?? 0`. Its doc at `:94-95` gains one clause:
"a base WITH a line that does not count a law is handed the baseline too".

### A3 · mlaw P1: R5 and R6 (`ci/mlaw/witness_mlaw.mjs`)
- `:195`: `o.n[k] > (k in b.n ? b.n[k] : bornOf(k))`, where `bornOf(k)` is the --org copy's `BASELINE[k]` if --base-org's
  `BASELINE` has no `k`, else 0. The --org BASELINE is read the way `:197` already reads it (`evalIn` on the copy's lawpack.mjs).
- `:200`: `bo === bb` becomes "every key of --base-org's `BASELINE` has the SAME value at --org, and every key --org adds is BORN
  (absent at --base-org) with `o.n[k] <= BASELINE[k]`". Both BASELINE objects are read by `evalIn`, as at `:197`.
  The text compare at `:193-194` is kept only for `jugad-literal-subject-list`, the key this clause is about.

### A4 · mrung G3: R7 (`ci/mrung/witness_mrung.mjs:288`)
`higher = keys(a.c).filter((k) => k in b.c ? a.c[k] > b.c[k] : a.c[k] > bornOf(k))`, where `bornOf(k)` is the --org copy's
`BASELINE[k]` if --base-org's `BASELINE` lacks `k`, else 0. BASELINE is read from each copy's `scripts/lawpack.mjs` by import, as
mlaw reads it.

### A5 · the ratchet: R4, no change
`scripts/lawpack.mjs:559-568` already reads a key in `BASELINE` against it, and refuses a count with no key. The car carries both
in the same commit (A1).

## §3 · MUTANTS (one per amended reading; each RED by the clause that names it, the control GREEN)

| # | Where | Plant (both ways) | Mutant | Must read |
|---|---|---|---|---|
| V1 | ci_verdict selftest (a new `ok(…)` beside `:517`) | head `{jugad:90, own-literal-pin:39}` over a base LINE `{jugad:90}`, through `compare`'s own baseline door with `BASELINE{own-literal-pin:39}` → GREEN · head 40 → RED `LAW PACK ROSE · own-literal-pin 39 → 40` | R2 reverted to `!base.lawpack` | RED `0 → 39` (the train's line) |
| V2 | same | base LINE counts K at 39, head 45, BASELINE 45 → RED `39 → 45` (a baseline raised later is a rise) | R1 prefers `baseline[law]` over `baseLp[law]` | GREEN, so the mutant is caught |
| V3 | same | head counts K, BASELINE has no K, base line no K → RED `0 → n` | the fallback becomes `head[law]` | GREEN, so the mutant is caught |
| P1a | ci/mlaw witness (clause JUGAD) | --org = --base-org plus a born key whose count equals its baseline → GREEN | `:195` back to `?? 0` | RED |
| P1b | same | --org raises an EXISTING key's BASELINE value → RED (no baseline raised later) | the per-key equality of A3 dropped | GREEN, so the mutant is caught |
| G3a | ci/mrung witness (clause G3) | --org = --base-org plus a born key at its baseline → GREEN | `:288` back to `!(k in b.c) \|\|` | RED |
| G3b | same | the born key's count one above its baseline → RED | `bornOf` returns the --org count | GREEN, so the mutant is caught |
| L1 | scripts/lawpack.mjs selftest (existing `:770-771`) | a count with no BASELINE key → `NEW LAW` RED | (already carried) | — |
| L2 | the car's witness ci/mpinl (W4) | BASELINE equals the tree's read | baseline typed one higher (existing mutant) | RED W4 |

## §4 · FILES A BUILD WOULD TOUCH (each beyond the car's named set, so a FORK for the architect)
- `scripts/ci_verdict.mjs` (A2: one line at `:629` plus its doc and the V1-V3 selftest asserts)
- `ci/mlaw/witness_mlaw.mjs` and `ci/mlaw/run_mutants_mlaw.mjs` (A3, P1a/P1b): another unit's landed witness
- `ci/mrung/witness_mrung.mjs` (A4, G3a/G3b), and the mutant runner it rides with: another unit's landed witness
- `scripts/lawpack.mjs` (A1, the car's own file, unchanged by this amendment)

## §5 · OPEN QUESTIONS FOR THE ARCHITECT
- **Q1 · which seat builds A2-A4.** Two options:
  - this car, as one commit before its law commit, so the car's own push turns green;
  - a separate seat on main first, so the car rides unchanged.

  Recommend the first: the ruling says "the unit that brings the rule carries the proof".
- **Q2 · mlaw `:200`'s byte-equal BASELINE.** It also guards against a baseline edit that LOWERS a key without a FALL line. A3 keeps
  that guard per key ("the SAME value at --org"). Is it the ruling's intent that a fall must still be its own commit?
- **Q3 · the land ref 70d9d0a is not reachable here.** The train's red line was reproduced from main's own reader (§1, case A),
  not read from the train's logs.
