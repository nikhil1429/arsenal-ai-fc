# LAUNCH CERTIFICATE — the standing answer to "is it working?"

> Written 12 Aug 2026 (23:30 IST) by the ULTRACODE verification session, after
> falsifying both 12-Aug agent waves against their own claims. Every number
> below was MEASURED in this session; every claim carries the command that
> re-derives it. The one-line answer he asked for five times in one day:
>
>     node scripts/audit.mjs run        → "ARSENAL AUDIT · HEALTH n/100 · n rulings waiting"
>     node scripts/pulse.mjs report     → every lane's ◇≤T verdict, live
>     npm test                          → red if ANY lane is lying dead right now
>
> He never has to ask an agent again. The organism answers, with proof.

---

## 1 · PRIOR-WORK TALLY — 17 verified · 3 falsified · 6 theater

**VERIFIED** (evidence re-run in this session, held):
1. Sandbox collar: 4/4 escape canaries DENIED, tripwire exactly 4 rows, grandchild
   propagation, money oracle refutable (planted row) — `node scripts/sandbox.mjs canary`.
2. Bug museum, original 6/6 — re-run clean before extension (`mutagen.mjs museum`).
3. Treasury meter catches both C1 fault shapes; live ledger today: zero lying rows,
   one honest `no-components` — `node scripts/treasury.mjs meter`.
4. Suite 42/0 across 81 members, every member RUN not chained — `npm test` (pre-alive).
5. E7 closed (hippocampus sole writer, grep-the-tree test) — `node scripts/mcp-memory.mjs selftest`.
6. E10: forge_session.json carries `closed_at` — the hard-refuse gate is answerable.
7. E5: Tier-2 lane OFF and self-demoted to INFO (watchman report, `tier2-vanished`).
8. Queue half-build measurement (27 dealt / 0 answered) — reproduced exactly (see §6).
9. awayday dispatchAll independence — CI itself showed squad PASSED beside a red organism job.
10. reconcile's produce/consume verdicts — consumed live by pulse; its diary/dreams
    bleeds were the true state of disk (`node scripts/reconcile.mjs json`).
11. herd same-second (03:44×6) and catch-up herd — present in today's audit findings.
12. xray rebuild-by-default after the museum's cached-graph catch — exercised 3× tonight.
13. B2 wrong-field detector (state-mutant invariance) — caught again tonight.
14. Watchman 73/0 · audit 33/0 · conductor/gaffer suites green (final suite run).
15. Meter total ≡ Σ(components) on every parseable live row (§5).
16. The 42-card deck's every card dealt ≥1 (one 20×) — emission real, action zero (§6).
17. Recital grading lane LIVE and catching real drift — today's WARN `recital-failed`
    (tokenization a: DRIFT, his words dropped, fed back to the Gaffer's constitution).

**FALSIFIED** (the evidence said no):
1. **"E1 CLOSED — E1 IS GREEN"** (commit 42b7300). The away-day lane FAILED on that
   very commit (run 31603938036) and on the audit's final commit (31605705131).
   Its fix (B4 gitignored-state assertions) was real but only ONE of THREE stacked
   causes. The other two, found tonight by measurement: **F9 — five selftest
   fixtures pinned to IST instants** (runner is UTC; `dfaebe7`), and **cross-drive
   `path.relative`** (runner: workspace D:\, temp C:\ — `bdb9b4b`, reproduced at
   home only by `subst`-ing temp onto a virtual drive). CI went green on `bdb9b4b`
   — first green since 7 Aug — and stayed green on `5822b76`.
   Evidence: `curl api.github.com/repos/nikhil1429/arsenal-ai-fc/actions/runs?per_page=5`
   · `node scripts/awayday.mjs check` → "cloud lane GREEN on 5822b76".
2. NEXT_SESSION's E1 theory ("dies at startup before any selftest runs") — it died
   INSIDE brain.mjs's selftest ~5s into a fast chain; the timing read as startup.
3. `unresolved_sinks` 4,677 (commit 464689a) vs 4,772 (BUILD_NOTES §5) — the same
   figure, two values; at least one is wrong. Not adjudicated (named gap, §8).

**THEATER** (code exists, assertions pass, the protected thing was not protected):
1. **4,341 assertions, zero liveness.** Every one asserted □P ("correct when run");
   none asserted ◇≤T ("it ran"). diary — enabled, nightly, three wired readers —
   had NEVER produced a page under an all-green suite. Closed tonight: pulse.mjs +
   the suite's `alive` mode (§3).
2. `node scripts/sandbox.mjs ci → exit 0` offered as proof of CI health. The
   sandbox inherits the house CLOCK and the house DRIVE TOPOLOGY — the two exact
   variables that were killing the runner. Real protection for state/credentials;
   as a CI proof, structurally unable to say no.
3. sandbox.mjs + audit_preload.mjs headers cite an organism_test `collar` mode
   that does not exist (the canary assertions live in sandbox's own selftest).
4. mutagen's header says organism_test asserts no live panic marker — that
   assertion lives in mutagen's own selftest.
5. reconcile bleeds surfaced at INFO — a level that never escalates — with the
   Tier-2 arm OFF: a detector wired to a zero-capacity channel. Closed: watchman
   probePulse now carries NEVER-class at **RED**.
6. audit.mjs dispatches `docexec` and `quarantine` that neither header nor usage
   names (its own ledger flagged this — the organ caught itself; the lane was
   still invisible to a reader).

## 2 · C — FAULT-DETECTION COVERAGE: 11 injected / 11 caught / 0 escapes

`node scripts/mutagen.mjs museum` — each exhibit control-first in its own
git-ls-files sandbox; a detector that fires on the clean tree scores N/A, and a
MISS prints. The F1–F10 floor is closed; three of the five new detectors did
not exist this morning:

| class | exhibit | detector | verdict |
|---|---|---|---|
| F1 dead read | B1 | xray Q1 | CAUGHT |
| F2 wrong field | B2 | state-mutant invariance | CAUGHT |
| F3 half-built lane | B3 | xray headerDrift | CAUGHT |
| F4 lane never fires | **F4** | reconcile never-produced | CAUGHT |
| F5 meter lie | B5 | treasury self-consistency | CAUGHT |
| F6 green-home red-CI | B6 | the sandbox IS a clean checkout | CAUGHT |
| F7 queue μ=0 | **F7** | pulse queue law (new tonight) | CAUGHT |
| F8 healthy-while-empty | **F8** | reconcile vs a fresh ok:true self-report | CAUGHT |
| F9 day boundary | **F9** | the suite under TZ=UTC (dfaebe7's exact pre-image) | CAUGHT |
| F10 two writers | **F10** | xray Q2/Q5 | CAUGHT |
| (beyond floor) stale canon | B4 | audit docs checker | CAUGHT |

A measured 11/11 with the guard `MUSEUM.length === 11` (an exhibit cannot be
deleted to fake it). Honesty note: 11/11 means these ELEVEN classes cannot
re-enter unseen — not that no twelfth class exists. Scheduled weekly
(ArsenalFC-BugMuseum, SUN 19:00), so C can only ratchet.

## 3 · LIVENESS — every lane now carries a machine-checked ◇≤T

- **The law**: deadline = 2× the lane's OWN cadence (reconcile's law; no new number).
  NEVER-PRODUCED is the loudest class. `scripts/pulse.mjs` (stateless, 13/13
  selftest under IST and UTC) covers: 50 schtasks lanes (live schedule),
  29 brain lanes (via reconcile), the card queue (Little's law), and the
  watchers' own artifacts (watchman ≤48h, audit ledger ≤48h).
- **The suite fails on violation**: `organism_test alive` — the repo's FIRST
  liveness assertions. Violations TODAY, deliberately left red:
  - `[NEVER] brain:diary — never produced — diary/ does not exist · 3 wired readers`
  - `[STALE] brain:dreams — 68h old, cadence allows 48h · 2 wired readers`
  Both are predicted to clear on TONIGHT's overnight by the night-reserve fix
  (f568ac9, landed 12:38 today — after last night). **Tomorrow's artifacts
  decide; a predicted-and-absent page is a falsification and the suite will
  still be red saying so.** That red is the system working.
- Weekly never-ran lanes (the five audit tasks installed today) are NOTES, not
  reds — install dates are unknowable from schtasks; their first Sunday decides.
- Minute-lanes: only NEVER-RAN and scheduler-abandoned count (the laptop sleeps;
  StartWhenAvailable catch-up owns the gap) — stated instrument bound.

## 4 · CONNECTIVITY — the graph verdict

- IR: 636 organ↔file edges, all 84 organs parsed, 0 parse failures, NUL-byte
  organs included (`node scripts/xray.mjs report`). brain_ledger.jsonl's six
  writers stay allowlisted as the documented shared lane — never "repaired".
- Open rulings from today's front-door run: **16** (dead-read 1 · two-writer 3 ·
  orphan-lane 5 · ghost 1 · sole-writer-drift 3 + herd schedule findings + doc
  staleness) — `node scripts/audit.mjs ledger`. Each is a judgement (whose lane,
  which owner), which is why they are rulings and not auto-fixes.
- State bus: 121 files checked, **0 orphans**; 3 undeclared brain_out lanes all
  consumed (`node scripts/reconcile.mjs json`).
- The known half-lane that matters most: **the card the Gaffer reads aloud is
  not the card an id-less "haan" answers** (c42 vs c9, verified live by the
  audit wave, still open) — a RULING because the binding rule changes what his
  word does.

## 5 · ECONOMY — the meter is provably honest, and the big spends are named

- Self-consistency: total ≡ Σ(input, cache_creation, cache_read, output) on
  every parseable row of the live ledger; the one flagged row is class
  `no-components` (pre-C1 format), honestly classed — `node scripts/treasury.mjs meter`.
- ρ table (today's window): haiku_pulse 9.8 · dmn_counter 18.3 · dmn_rollout
  18.1 · teamtalk_pm 20.5 · **midday_digest_2 31.9 / _3 39.6** (the brief's 32:1
  reproduced live; both flagged as boot-tax rulings).
- Assembly-vs-generation candidates named, never auto-converted: brain.mjs (23
  state inputs already on disk at its 1 LLM site), cortex.mjs (12), talk.mjs (10).
- **Instrument caveats, named**: (a) the ledger ROTATED at 15:38 IST today —
  treasury's "(all time)" header covers the live file only (81 rows); history
  is in brain_ledger.jsonl.1; (b) the sensitivity ⚠ ("cache_read moves the
  verdict ≥ input") on today's window reflects a cache-heavy MIX (49.2% of raw
  traffic), not a flattened price list — spendOf's weights are 1/1.25/0.1/5 in
  code and the known-answer selftest pins the 0.1 ratio.
- The §4 predictions (diary's first page · cortex consolidate green) are
  **PENDING tonight's overnight** — checked by artifacts, not code (§3).

## 6 · PROACTIVITY — measured, not asserted

- The deck, live: 42 cards = **27 truly open · 15 machine-retired · 0 ever
  answered by him**. λ(7d) = 42 filed · μ(7d) = 15 served (all retirement).
  Verdict: NOT diverging (machine service keeps it finite) — but his answer
  lane is untouched, and the one card the anchors deal must be the one his
  "haan" binds to (§4's open ruling).
- The audit's own card lane: hard caps IN CODE (1 open · ≤2 per 7d · TTL with a
  stated default, so his silence is a logged answer). Verified live tonight:
  "card NOT dealt — 1 card already open".
- Delivery vs emission: every open card dealt ≥1 (one dealt 20×) — the pipe to
  him works; what he does with it is his, and the organism no longer confuses
  the two.
- The morning surface names its own health: kickoff carries the watchman line;
  watchman now carries pulse REDs; `awayday check` reads the cloud lane back
  ("GREEN on 5822b76") so c36 stops re-dealing by itself.

## 7 · WHO WATCHES THE WATCHMAN — named AND killed in sandbox

Topology: **watchman (nightly) and audit (daily 13:10) each run pulse; pulse
checks both their artifacts; the suite runs pulse's law on demand.** No shared
code between observer and observed. Both directions executed tonight
(`scratchpad kill_watchman_demo` — sandboxed, collar armed):

- A. Watchman killed (artifact backdated 60h) → pulse:
  `{"name":"watchman","class":"watcher-stale","age_h":60}` — the finding audit
  converts daily.
- B. Audit killed (ledger rows aged 120h) → the REAL `watchman.mjs run` in
  sandbox wrote `pulse-watcher-stale-audit` at **RED** into watchman_last.json
  (exit 0, 18 findings) — detector → routed → the surface his kickoff reads.
- Pulse itself: broken ⇒ both drivers report `pulse-unrunnable` WARN
  (fail-closed, in code) and its selftest reds the suite.

## 8 · THE HONEST GAP LIST

1. **e3′** — whether his values are right is HIS alone. The organism holds his
   words verbatim; it does not judge them.
2. **The two predictions are unadjudicated until tomorrow's artifacts** (diary
   page; cortex/ConceptGraph task result 0). The suite stays honestly red on
   `alive` until disk says otherwise.
3. **Westward timezones** (UTC−) still break pre-existing daemon_watchdog
   morning fixtures — no machine of this organism runs there; CI (UTC) is the
   standing F9 net. Bound, not blindness.
4. **Not re-run in this session** (billing guard forbids spending to verify
   spend): the DMN free-quota gate's live-fire line, the Gaffer's live recital
   delivery, cortex's one proven consolidate. Their wires are suite-held; their
   next scheduled runs are their proof.
5. **unresolved_sinks 4,677 vs 4,772** — one figure is stale; unadjudicated.
6. **Semantic layer**: e1 groundedness has ONE live lane (the recital grader —
   which caught real drift today); it does not yet cover every organ that
   quotes his words back. e2 (back-testing the organism's own metrics —
   nemesis, danger-zone — against outcomes) is designed by the calibration
   machinery but NOT yet aimed at the organism itself. Open build, named.
7. **Long-horizon accumulation** — mutagen `horizon` ages 90 days weekly; drift
   beyond that window is unmeasured.
8. **16 open rulings** (§4) wait on his word at ≤1 card per anchor — by design,
   never as a list. The certificate does not hide that the queue of judgement
   is his; it proves only that nothing else is.

---

### The operational end state (his terms)

Tomorrow morning he opens the tab. The organism speaks first. Its health is a
number it can prove (`audit.mjs run` — today: **26/100, 16 rulings waiting**,
low because the truth got LOUDER tonight, not because the organism got worse:
liveness violations and rulings now count against it). At most ONE card asks
for his word. Everything else ran in the night — and if anything anywhere
silently died, `npm test` is already red, pulse already names the lane, the
watchman already carries it at RED, and the kickoff already says so.

He asked "is it working?" five times in one day. The answer now exists without
him asking.
