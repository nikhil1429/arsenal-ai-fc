# FD_SPEC: the settle tail of a judge round after its budget (unit mtail, item 5, F-D). SPEC ONLY.

This is a spec only, and nothing in it is built. Every file:line below is measured at **BASE = main d0c8c96**, in `scripts/gaffer_brain.mjs` unless another file is named.
The mtail build moves no line of the settle path: the build's own lines sit a few rows lower in gaffer_brain.mjs because of the import and comment lines it adds.

## 1 · What runs after the budget (measured)

| # | Fact | file:line at BASE |
|---|---|---|
| D1 | The round's ONE budget is `JUDGE_BUDGET_MS`. The dispatch margin that every caller adds on top of it is `JUDGE_DISPATCH_MS`. | `:175`, `:180` |
| D2 | The round's clock starts at `t0`, before the external check. Each batch is sized against `remaining = JUDGE_BUDGET_MS − max(clock − t0, spent)`. | `:2019`, `:2244-2245` |
| D3 | A batch's judge call is killed at `remaining`, never above the budget: `budgetMs = max(1, min(JUDGE_BUDGET_MS, call.budget_ms))`. | `:2255`, `:2050` |
| D4 | **The settle runs after the call returns, and no budget check comes before it.** `settleBatch` is awaited straight after `gen`. Only the NEXT loop turn re-reads `remaining`. So the settle of the batch whose call ends nearest the budget's end runs past the budget, unbounded by it. | `:2269`, `:2244` |
| D5 | The settle, per settled item `s`: (a) if the grade carries a `key_doubt`, ONE card is filed through `cardFile`. | `:2183` |
| D6 | (b) if `s.type ∈ SECOND_JUDGE_TYPES`, ONE second-opinion call `second(item)` is made. | `:1698`, `:2189` |
| D7 | (c) if the two judges disagree, ONE 💎 card is filed through `cardFile`. | `:2198` |
| D8 | (d) for every confirmed item, ONE owner dispatch `dispatch(ownerCommand(s))` runs. | `:2215` |
| D9 | (e) the settled row is appended to the queue file. This is fs work with no timeout. | `:2228` |
| D10 | `cardFile` is `execFileSync(captains_call.mjs file …, { timeout: JUDGE_DISPATCH_MS })`. | `:2072-2074` |
| D11 | Each owner dispatch is `execFileSync(rejirah \| doubtminer \| capture.mjs …, { timeout: JUDGE_DISPATCH_MS })`. | `:2086` |
| D12 | The second opinion is `callWatcher` → `models.mjs generate`. Each fetch is killed at `WATCHER_DEADLINE_MS`, an env override (`GAFFER_WATCHER_MS`) or 20 s. | `:1734`, `:533`, `:188` |
| D13 | `generate` has no total deadline. It walks up to `maxCandidates` (default 8) candidates (`models.mjs:282`, `:287`) × every key (`:290`). Each pair gets up to 2 attempts (`:296`). A `net` failure sleeps 200 ms before its retry and then moves to the next key (`:317`). A `demand` failure sleeps 500 ms and then skips to the next candidate (`:316`). | `scripts/models.mjs:271-325` |
| D14 | On an auth stop, the round files ONE auth card (`cardFile`, D10) after the failed batch. That batch is not settled. | `:2288` |
| D15 | The callers wait `JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS`, and nothing more. These are sitting's owner funnel (`scripts/sitting.mjs:215`), dugout's tool funnel (`scripts/dugout.mjs:2064`), and, built by this unit, postmatch's close child (`JUDGE_CHILD_MS`). | as named |

## 2 · The worst-case tail, as a formula of named constants

Let `JD = JUDGE_DISPATCH_MS` and `W = WATCHER_DEADLINE_MS`. Let `C = maxCandidates` (`models.mjs:282`; it is 8 when the caller sets none) and `K` = the number of keys in the Gemini pool, a count read at run time (`loadGeminiKeys`). Let `NET_SLEEP` = the 200 ms retry sleep at `models.mjs:317`. Let `n` = the size of the batch whose call ends at the budget, with `n ≤ left` (`judgeBatchSize`, `:1980`).

```
S_max            = C · K · (2·W + NET_SLEEP)                    one second opinion, every fetch timing out on the net class (D12, D13)
T_item(second)   = JD [key_doubt card] + S_max + JD [💎 card] + JD [dispatch]  =  3·JD + S_max
T_item(other)    = JD [key_doubt card] + JD [dispatch]                         =  2·JD
TAIL_max(batch)  = n_second · (3·JD + S_max) + (n − n_second) · 2·JD    (+ fs appends, D9, unbounded but local)
TAIL_max(auth)   = JD                                                          (D14: the batch is not settled)
TAIL_max         = max(TAIL_max(batch), TAIL_max(auth))
```

What the callers give the tail today is `JD`, ONE owner spawn (D15).
**THE GAP: `TAIL_max − JD`.** It is positive from the first settled item. A single item of an ordinary type with a key-doubt is already `2·JD > JD`.
With the measured defaults (`JD` 30 s, `W` 20 s, `C` 8), one second-judge item alone can take `S_max = 8·K·40.2 s`, which is more than five minutes per key.
When the caller's kill lands mid-tail, the item being dispatched may have reached its owner (a rep written) without its settled row (D9). The next round then re-grades that capture and dispatches it again. This is the double count that L2 (fate 14) stopped for the write failure. Here a caller's kill can still cause it.

## 3 · Branch table (one to be ruled; none built)

| Branch | What it changes | What it costs | Measurable condition |
|---|---|---|---|
| **B1 · Bound the whole tail inside the budget** | `gradeJudge` reserves the tail before it sizes: a batch of `n` starts only when `remaining ≥ n·per_capture + TAIL_max(n)`. In `judgeBatchSize` the per-capture cost becomes `per + T_item(type)`. Each settle step re-reads `remaining` before it spawns, and an item that does not fit stays OUTSTANDING (never coerced, as `missed` is). The second opinion is handed `deadlineMs` clipped to what remains, so `S` is bounded by the round's clock, not by `C·K`. Callers do not change: they keep `JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS`. | Fewer captures per round. The reserve per item (`2·JD` to `3·JD + S`) can exceed the judge call's own per-capture time, so the queue drains slower: more rounds, more doors. A second opinion clipped short records "one judge" (`judge2_note`, `:2191-2193`) more often. All of it is in gaffer_brain.mjs. | In a planted round where every judge call, card spawn, dispatch and second-opinion fetch runs to its full timeout, `gradeJudge` returns within `JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS` on its own clock, with every unsettled item still outstanding. Measured on the ledger: captures settled per round, before vs after. |
| **B2 · Give the tail its own derived margin** | gaffer_brain.mjs exports `JUDGE_TAIL_MS = JUDGE_BATCH_MAX · (3·JD + S_max)`, derived from a NEW cap on the batch size (`JUDGE_BATCH_MAX`) and a cap on the second opinion (`C`, `K` and `W` made a bounded `S_max`). Every caller waits `JUDGE_BUDGET_MS + JUDGE_TAIL_MS`. That means sitting `ownerTimeoutMs` (and so `closeWaitMs`), dugout's funnel, and postmatch `JUDGE_CHILD_MS`, whose close budget `autocloseBudget()` must then grow by `JUDGE_TAIL_MS − JD` or take the margin from its other children. | The close budget MOVES (a ruling: "the close budget does not move" stood for F-B). The worst-case wait of every caller grows by the whole tail, and the sitting CLI's close wait grows with it. It needs a batch cap the round does not have today, and the cap lowers throughput when the history allows larger batches. | Every caller's wait ≥ `JUDGE_BUDGET_MS + JUDGE_TAIL_MS` (a witness like T1/T2 of ci/mtail, with a fake child running past `JUDGE_BUDGET_MS + JD`). Every batch's `size ≤ JUDGE_BATCH_MAX` on the ledger. `S` never exceeds its bound in a planted all-timeout second opinion. |
| **B3 · Leave it and name the gap** | Nothing in code. This spec and the PROOF name the gap: `TAIL_max − JD`, and a kill mid-tail can re-dispatch one item. | No change in throughput or waits. The risk stays: at most the items of ONE batch, past the budget, can be cut mid-dispatch, and at most the one item being dispatched can be counted twice on the next round. | The gap is defensible only while it is not reached. On `brain_ledger.jsonl`, take the judge rows (job `JUDGE_JOB`) of each round. If no round has a batch whose call ended within `TAIL_max(n)` of the budget's end (round start + sum of durations ≥ `JUDGE_BUDGET_MS − TAIL_max(n)`) over a stated window, B3 holds. One such round reopens the ruling. |

## 4 · What is not in this spec

These are named and not measured here:
- The external check before the batches is already inside the budget (unit mjud F3, `:2016-2020`), so it is not part of the tail.
- The CLI's printing after `gradeJudge` returns (`:2572-2604`) is stdout only. It is not bounded, but it is local.
