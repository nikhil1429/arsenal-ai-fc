# ▶ NEXT SESSION: START HERE. READ THIS WHOLE FILE, THEN BUILD. DO NOT RE-PLAN.

**HIS APPROVAL IS ON RECORD — 15 Aug 2026:** *"please make sure every issue that you
encountered and i told in this session is resolved once for all for the entire future from
now onwards."* Every block below is APPROVED. Do not open a plan review. Do not ask permission
per block. Do not deal cards about this plan.

He says only: **"truth layer banao"** — nothing else.

**WHAT HE IS WAITING ON:** he starts doing reps and Re-Jirah rounds the moment this lands. Every
hour this is unbuilt is an hour his study data is decided by the cheapest model in the building.

---

# THE TRUTH LAYER — THE WORK ORDER
> Written 15 Aug 2026, at the end of the session that shipped the Gaffer rebuild
> (`32b75a6` · `dc9c638` · `0f95bf7` · `6ac4bd9` · `8040ee0` · `db53818`).
> **This file is the EXECUTABLE SPEC.** Read it, then build BLOCK 0 → 5 in order.

---

## 0 · THE DIAGNOSIS — ONE DISEASE, FOURTEEN INSTANCES

Everything found in a full day of building and auditing is the same failure wearing different
clothes. Do not treat these as fourteen bugs. They are one missing layer.

| # | what happened | what nobody checked |
|---|---|---|
| 1 | Cerebras lane: 4 commits, key installed, **never once returned a verdict** | that it produced anything |
| 2 | `capsuleAnswerKey` read `capsule.axes[axis]` — a key **no capsule has** | that it found what it looked for |
| 3 | …and its selftest was GREEN, because it only exercised the refusal path | that the success path ran |
| 4 | `--dry` skipped the write but **still dispatched to owners** | that the flag did what its name said |
| 5 | The opening briefing fired **every turn for four sittings** | its test asserted it was PRESENT, not that it fired ONCE |
| 6 | The supervisor sat **4th** in a poll where every branch returns | its test compared it against 1 of 9 |
| 7 | `gaffer_claim_audit` — the organ checking whether the Gaffer LIED to him — **starved for budget 3×** | that the truth-checker could afford to run |
| 8 | `teamtalk_am` has run **14/14 times on 1 of 4 inputs** | that a lane has the evidence it reasons from |
| 9 | `dreams` has run **16/17 times** with its cracked-axes inventory ABSENT | ditto |
| 10 | DMN spends **49–53% of the whole plan** dreaming against ONE weak point built from 21 reps | that imagination is proportional to evidence |
| 11 | `doubtminer` has `retire` and **no un-retire** | that a wrong judgement can be undone |
| 12 | xray's sink ratchet counted **visits, not sites** — moved when you added an unrelated function | that the budget measured what it claimed |
| 13 | Four answer keys sit on disk and the judge **passes `key: null`** for them (see §2) | that available ground is actually used |
| 14 | `gradeMaterial("trap", …)` puts the trap's **`truth` inside the QUESTION** and sets `key: null` | that the judge is not shown the answer |

**THE ONE SENTENCE:**

> **The organism knows when it is ALIVE. It does not know when it is RIGHT.**

Its liveness layer is genuinely excellent — `pulse.mjs` (◇≤T deadlines), `watchman.mjs` (nightly
RED/WARN/INFO), 86 selftests, `xray` (static graph + sink budget), `blackbox` (runtime edges),
`archivist` (hash-chained permanent record), `archive_audit` (checks the checker). **Nothing
equivalent exists for truth.**

- the suite checks that an organ **ran**, not that its verdict was **right**
- the ledger checks that tokens were **spent**, not that the spend **bought** anything
- the gates check that a lane is **enabled**, not that its **inputs are present**
- the tests check that code was **reached**, not that it is **correct about him**

**Every block below builds one part of that missing layer. Nothing below is a feature.**

---

## 1 · THE THREE LAWS THIS LAYER INSTALLS

1. **ONE JUDGE, ONE STANDARD, BOTH NAMED.** Every judgement about him is made by the same organ,
   against a declared standard, and the ledger row says which. Today the judge depends on which
   surface he happened to open (Gemini Flash Live / Gemini Pro / Claude / Opus) and the standard
   is implicit.
2. **NO ORGAN MAY REASON FROM EVIDENCE IT DOES NOT HAVE.** `brain status` already REPORTS this
   ("10 job(s) have BILLED on absent evidence") — `grep -n "brain: inputs history" scripts/brain.mjs`.
   The report exists. **The gate does not.**
3. **EVERY JUDGEMENT IS REVERSIBLE.** A wrong verdict must have a way back, or one error compounds
   through nemesis → FSRS → what he studies, forever.

---

## 2 · THE MEASUREMENT — USE THESE NUMBERS, DO NOT RE-DERIVE THEM, DO NOT USE OLDER ONES

⚠ **THE STALE-NUMBER TRAP.** The `GAFFER_REBUILD` work order quoted *"956 calls / 20.5M tokens,
95% of every token re-establishes context"*. Those are **PRE-UNLEASH** figures. The 14 Aug unleash
work (`0857329`) changed the economics. He caught this in-session. **Every number below is measured
from `brain_ledger.jsonl` rows dated ≥ `2026-08-14T00:14` only.**

**PER-CALL ECONOMICS, post-UNLEASH (530 calls, 41.6h):**

| model | calls | cache-write/call | cache-read/call | reuse (cr/cw) |
|---|---|---|---|---|
| haiku | 209 | 3,553 | 31,281 | **8.8×** (the `--resume` pulse) |
| sonnet | 304 | 10,189 | 10,158 | **1.0×** |
| **opus** | **16** | **37,228** | **201** | **0.005 — effectively ZERO** |

**Opus is the ONLY model not caching.** Not because it cannot: because every opus lane fires once
a day, outside the 5-minute TTL. Nothing repeats, so the head is written at 1.25× and never read.

**CACHE PHYSICS — measured on HIS machine, 14 Aug, twice** (`UNLEASH_PLAN__2026-08-14.md` §0):
- `--system-prompt` has its **own cache breakpoint that SURVIVES a changed body**
  (`S1 cw 4,966 cr 0` → `S2 same system, different body: cw 145 cr 4,829`)
- `--resume` reads the whole prior context at 0.1× (`R1 cw 11,619` → `R2 cw 379 cr 11,619`)
- write 1.25× · read 0.1× · TTL **5 min** · caches are **per-model**
- minimum cacheable prefix: **opus 512 tokens** · sonnet 1024 · haiku 4096
- keep-cache break-even: reuse > 0.278

**WHY THE SPLIT NEVER PAID FOR EXISTING LANES** (`grep -n "THE HEAD IS SMALL" scripts/brain.mjs`):
their heads are ~406 tokens — **under sonnet's 1024 bar**, so the system block is not cached at
all. And **cross-lane prefix sharing does not exist** — the match is on the WHOLE system block,
not the longest common prefix. Do not try to share one cartridge across different lanes.

**WHY A JUDGE LANE IS DIFFERENT, AND THIS IS THE WHOLE POINT:** a judging head is naturally large
(eight verdict types + the DOSSIER + his fingerprint ≈ 2,500 tokens — **five times opus's 512
bar**), and a round fires several judgements **within minutes — inside the 5-min TTL**. This is the
one shape the split and `--resume` were built for and never got.

**THE PLUMBING ALREADY EXISTS AND NOTHING CALLS IT.** `claudegen.mjs`'s own comment:
> *`systemPrompt` (14 Aug 2026, unleash Phase 1) — the SPLIT's door on this engine… **Nothing calls
> it yet by design** — the plan's step 5 is plumbing.*

`grep -n "const ARGS = (model, extra = \[\], systemPrompt = null)" scripts/claudegen.mjs`

**DAILY SPEND, and where it goes:**

| day | total weighted | DMN | DMN % |
|---|---|---|---|
| 12 Aug | 56,61,307 | 17,71,370 | 31% |
| 13 Aug | 50,87,516 | 4,05,881 | 8% |
| 14 Aug | 45,88,185 | 11,22,453 | 24% |
| **15 Aug** | **34,68,352** | **17,07,726** | **49%** |

`haiku_pulse` was **stopped by his ruling on 15 Aug** (`pulse.enabled: false`), which was 22.8% of
the post-unleash window. With it gone, **the DMN becomes ~53% of everything.**

**WHAT THAT 17 LAKH/DAY BUYS:** `dmn_precache.json` holds **6 verified entries**.
≈ **2,85,000 weighted tokens per usable drill.**

**WHAT IT IS DREAMING AGAINST — read live, do not trust this line:**
```
node -e "import('./scripts/dmn.mjs').then(m=>console.log(JSON.stringify(m.weakVector())))"
```
On 15 Aug it returned **exactly one** weak point: `[{"concept":"hallucinations","why":"trajectory regressing"}]`.

**AND THE EVIDENCE UNDER THAT ONE POINT:**
- `reps_log.jsonl` — **21 rows**, total, all time
- `rejirah_log.jsonl` — **FILE ABSENT**. Zero Re-Jirah rounds, ever.
- `calibration.json` → `danger_zone` — **`[]`**, empty. The single most valuable signal in the
  design (confident-and-wrong) has no data in it at all.

**THE MECHANICAL BUG, one line** (`grep -n "const nRoll = Math.min" scripts/dmn.mjs`):
```js
const nRoll = Math.min(MAX_ROLLOUTS_NIGHT, totalBudget - verifyReserve, weak.length * ROLLOUTS_PER_WEAK);
//                     100                  ← budget headroom          ← 1 × 25
```
Two of three terms are about **how much room there is to spend**. Only one is about **how much is
known** — and it is multiplied by 25. **One thin belief becomes twenty-five expensive simulations.**

**A cached opus judgement costs ~15,000–20,000 weighted.** Making the DMN evidence-proportional
frees ~13,00,000/day ⇒ **~70–85 judge rounds a day.** He cannot do that many. **The money is
already there. It is being spent imagining him instead of knowing him.**

---

## 3 · WHO JUDGES HIM TODAY — the map this layer replaces

| what is decided about him | who decides, today | metered? |
|---|---|---|
| **"was he right"** — every voice rep | **Gemini Flash Live** (`DEFAULT_MODEL = gemini-3.1-flash-live-preview`) | ❌ not in `brain_ledger` at all |
| a Gem session's reps | Gemini Pro, then he pastes | ❌ |
| scrimmage /25 | Flash Live (dugout mode) **or** Claude (`/scrimmage` skill) — depends on the surface | ❌ |
| the eight verdict types | Opus (`gaffer_brain judge-round`, shipped today) | ❌ **calls `claudeGen` directly, not `genLedgered`** |
| **"did the Gaffer lie to him"** | **haiku** — and **starved 3× for budget** | ✓ |
| what to coach him | **opus — 4,20,075 weighted for 2 calls** | ✓ |

`grep -n "You judge correct/incorrect honestly" scripts/dugout.mjs`

**THE INVERSION:** Opus is spent on **advice** (night_coach, agenda, evening_voice,
deep_reanalysis, formation_read, model_mine). The cheapest models decide **what is true about him**.
Advice is recoverable — he reads a mediocre note and moves on. **A judgement is not:** a wrong
`correct:false` enters `reps_log` → `nemesis.mjs` (which declares `reps_log` its **SOLE truth
source**) ranks it → FSRS schedules it → he drills, for weeks, a thing he already knows. And today
there is no way back.

---

## 4 · THE GROUND THAT ALREADY EXISTS AND IS NOT BEING USED

⚠ **THIS CORRECTS A CLAIM MADE EARLIER IN THE SESSION.** It was said that "seven of the eight
verdict types have no answer key." **That is wrong.** Verified live on `capsules/tokenization.json`:

```
doubts[0]        {"q":"strawberry common fruit hai, phir split kyun hota hai?",
                  "a":"common-FRUIT =/= common-STRING. Tokenizer ko meaning nahi..."}   ← 26 of 26 carry `a`
traps[0]         {"bait":"…","wrong":"…","truth":"Primary = OOV solve + vocab kaabu"}   ← the trap carries the TRUTH
interviewLines[0] "AI doesn't understand language, only numbers…"                        ← his own interview-grade line
```

| type | the ground that exists | what `gaffer_brain.mjs` does TODAY |
|---|---|---|
| `axis_weld` | `faultLines[].weld` | ✅ used |
| `tape_doubt` | **`capsule.doubts[].a`** | ❌ `key: null` (line ~883) |
| `trap` | **`capsule.traps[].truth`** | ❌ `key: null`, **and `truth` is leaked into `asked`** (line ~901) |
| `interview` | **`capsule.interviewLines[]`** | ❌ `key: null` (line ~901) |
| `doubt_quality` | **FORGE_SPEC §3 COLD-READER STANDARD + Gate 1/Gate 2** | ❌ no standard passed |
| `hidden_test` | genuinely open — the examiner's `task` + `shape` | judged on his ground |
| `adversarial` | genuinely open — does the defence hold | judged on his ground |
| `scrimmage` | **`dossier_weights.json` §1 round weights** | ❌ DOSSIER never reaches the judge |

**Verify the leak yourself before fixing it:**
```
node -e "import('./scripts/gaffer_brain.mjs').then(m=>console.log(JSON.stringify(m.gradeMaterial('trap','tokenization:0'))))"
```
It prints the whole trap object — including `truth` — inside `asked`, with `key: null`. **The judge
is shown the answer as part of the question.** Every trap verdict produced this way is meaningless.

**AND THE DOSSIER.** `learning-layer/OPPONENT_SCOUT.md` is the real-world standard, built from real
candidate-reported interviews (Exponent: Anthropic, OpenAI, Scale, Sierra, xAI, Databricks,
Perplexity; KORE1 practitioner debriefs). Its live projection is
`dressing-room/state/dossier_weights.json`. **17 organs read it. `gaffer_brain.mjs` reads it zero
times** (`grep -c dossier scripts/gaffer_brain.mjs` → 0). It shapes WHICH questions are asked and
never HOW an answer is judged.

---

## 5 · WHAT THE ORIGINAL DESIGN ASKED FOR, AND WAS NEVER BUILT

`ARSENAL_AI_FC_MASTERPLAN.md` §9, **THE SECRET WEAPON — the Dual-Judge Jury:**

> *Nikhil answers. Claude grades it against a rubric; **Gemini independently grades the SAME
> answer** (identities masked, order randomized to fight position bias). Both AGREE weak → real
> weakness. **Both DISAGREE → 💎 the highest-value signal**… The models NEVER resolve disagreements
> between themselves. **Nikhil resolves them. That IS the learning.***
>
> *Evidence: single LLM judges show position, verbosity, and self-enhancement bias; a panel of
> diverse model families offsets individual biases.*

And in the roster: `APPLIED-FUNDAMENTALS RAPID-FIRE · **dual-graded** · embeddings, context
windows, why-models-fail` — **his currently locked capsules.** This was designed for the study
layer, not only for FinOps. (The FinOps "two models" memory is a different thing: LLM-as-judge is
an interview ROUND he must defend and an eval harness he must SHIP. MASTERPLAN's own 10 Aug status
note: *"There is no RAGAS harness, no DeepEval CI gate, no TruLens wiring and no deployed endpoint
anywhere in this repo."* Out of scope here.)

**The cross-family machinery already exists** — `council.mjs` M15 writes `council_flag.json` when
two families read the same question disjointly — but it judges the **deep brain's questions**,
never **his answers**. `grep -n "M15 — THE FULL SQUAD\|council_flag" scripts/council.mjs`

---

## 6 · ⚠ BASELINE FIRST

```
npm test
```
It was **43/0 (86 members)** at the end of 15 Aug, verified twice. If it is red, **fix that before
writing a line of this plan** — nothing downstream can be measured against a red baseline. Then:
```
node scripts/xray.mjs selftest        # 21/0, ratchet 1247 → 1247
node scripts/organism_test.mjs coverage
```

---

## 7 · BUILD ORDER — SIX BLOCKS. `npm test` GREEN AFTER EVERY ONE.

### BLOCK 0 — THE GROUND THAT IS ALREADY ON DISK (fix first; it is a live bug)
`scripts/gaffer_brain.mjs` · `gradeMaterial()`

- `tape_doubt` → key = `capsule.doubts[idx].a`; `asked` = `q_verbatim` only
- `trap` → key = `traps[idx].truth`; `asked` = `traps[idx].bait` **only** — `wrong` and `truth`
  must NEVER appear in `asked`
- `interview` → key = `interviewLines[idx]`; `asked` = the probe
- `doubt_quality` → standard = FORGE_SPEC §3 COLD-READER STANDARD, quoted into the cartridge
- `scrimmage` / `hidden_test` / `adversarial` → carry `dossier_weights.json` rounds + §7 red-flags

**ACCEPTANCE (run, do not claim):**
1. `gradeMaterial("trap","tokenization:0")` → `asked` contains the bait and **does NOT contain the
   word from `truth`**; `key` === `traps[0].truth`.
2. For every locked capsule on disk, every `tape_doubt` ref returns a non-null `key`.
3. A selftest that FAILS if any `gradeMaterial` branch returns `key: null` for a type declared
   keyed in `VERDICT_TYPES`. (Add a `key: true|false|"dossier"` field to `VERDICT_TYPES`.)

### BLOCK 1 — THE JUDGE CARTRIDGE (this is what makes Opus affordable everywhere)
- Build **ONE stable head**: the eight verdict types + their questions + their standards + the
  DOSSIER (§1 round weights, §4 probe grammar, §7 red-flags) + his cognitive fingerprint.
  Target **≥ 3,000 chars ≈ 750+ tokens** — comfortably over opus's 512 bar. **Measure it and print
  the token estimate in the selftest**; if it is under 512 tokens it will not cache at all and the
  whole block is worthless (this is exactly why the existing lanes' split never paid).
- Pass it through the door that already exists: `ARGS(model, extra, systemPrompt)`.
  `claudeGen` does not forward it today — **add a `systemPrompt` parameter to `claudeGen` and pass
  it through**. Do not invent a second door.
- The cartridge is **byte-identical across every judgement in a round** — that is the whole
  mechanism. Anything that varies per item goes in the BODY.
- **Ride the ledger.** Route through the same metering every other lane uses so
  `brain status` and the window governor can see it. Today `gradeJudge` calls `claudeGen`
  directly and its spend is **invisible**. Register it in `brain_config.json` as a real job.

**ACCEPTANCE:**
1. Two judgements inside the 5-min TTL: the second row shows `cache_read_tokens > 0` and
   `cache_creation_tokens` far below the first. **Print both rows.**
2. `node scripts/brain.mjs status` shows the judge lane's spend.
3. The cartridge's token estimate is printed and is > 512.

### BLOCK 2 — EVERY EVIDENCE DOOR ROUTES THROUGH THE ONE JUDGE
The doors that currently judge, and must stop:
- **voice reps** — `dugout.mjs`'s constitution says *"You judge correct/incorrect honestly"*.
  Change to: the Gaffer **captures** (question, his answer, his gut-word) and calls the judge lane.
  It never decides `correct` itself.
- **scrimmage /25** — same, both surfaces, so the verdict no longer depends on which surface he opened.
- **`gaffer_claim_audit`** — the truth-checker moves off haiku onto the judge lane.
- `tape_doubt` · `hidden_test` · `adversarial` · `interview` · `trap` · `doubt_quality` — already
  route through `judge-round`; they inherit the cartridge automatically.

**LAW: capture is instant and model-free. Judgement is Opus, batched, cached.** A dropped
connection mid-round must never cost him an answer he already gave (this is the 11 Aug law and it
is already how `gradeCapture` works — keep it).

**ACCEPTANCE:**
1. A voice rep flows: capture → judge lane → `capture.mjs rep`. The Gaffer's own transcript shows
   it did NOT state a verdict itself.
2. `grep` proves no surface writes `correct:` without going through the judge.

### BLOCK 3 — THE EVIDENCE GATE (this is what pays for blocks 1 and 2)
**THE LAW:** *an organ may only spend in proportion to the evidence it stands on.*

- `brain.mjs` already computes "billing on absent evidence" for the status report
  (`grep -n "brain: inputs history" scripts/brain.mjs`). **Turn the report into a gate**: a job
  whose REQUIRED inputs are absent does not run, and says so on the ledger row.
- `dmn.mjs`: `ROLLOUTS_PER_WEAK` stops being a constant. It becomes a function of how much
  evidence the weak vector rests on — reps behind the concept, graded axes, whether
  `calibration.danger_zone` is empty. **One weak point resting on 21 reps must not earn 25
  simulations.** Ship a provisional curve with a `_derivation` note; do not wait for data
  (UNLEASH's DAY-0 LAW).
- The freed budget is not "saved" — it is what the judge lane spends.

**ACCEPTANCE:**
1. With today's state (1 weak point, 21 reps, empty danger_zone) the DMN plans **≤ 6** rollouts,
   not 25. Print `planned_rollouts` before and after.
2. A job with a `required: true` input missing is REFUSED with the reason on its ledger row.
3. `npm test` green — the DMN's own selftests still pass.

### BLOCK 4 — THE UN-JUDGE PATH
Every judgement must have a way back:
- `doubtminer.mjs` gains `un-retire <capsule> <index>` (it has `retire` and nothing else today —
  this was hit for real on 15 Aug).
- `rejirah.mjs` gains a correction path: a wrong round is corrected by a **new row that names the
  old one**, never by a rewrite. (`judge-night` already does this for Pass-1 verdicts — use the
  same shape.)
- `capture.mjs` gains the same for a rep.

**ACCEPTANCE:** each un-path is RUN on a fixture and the original row survives beside the
correction, readable, with a timestamp.

### BLOCK 5 — THE SECOND JUDGE, AND THE 💎
Only for the verdicts where there is **no on-disk key and taste decides**:
`hidden_test` · `adversarial` · `scrimmage`.

- A second read from a **different model family** (the Gemini Flash REST lane the Watcher already
  uses — free, already proven live at 4–12s).
- **Identities masked, order randomized** — the design says so explicitly and names the bias it
  fights.
- **AGREE** → the verdict stands, recorded with `judges: 2, agreed: true`.
- **DISAGREE** → 💎. The verdict is **NOT recorded as fact**. It becomes a captain's-call card,
  because *"the models NEVER resolve disagreements between themselves. Nikhil resolves them."*
- Also add **`key_doubt`**: if the judge thinks HIS OWN answer key looks factually wrong, that is
  not a verdict on his recall (which still stands) — it is a card, because only he edits capsules
  (via the gist; `mirror.mjs` is the sole writer of `capsules/`).

**ACCEPTANCE:**
1. A fixture where the two families disagree produces **a card and no recorded verdict**.
2. A fixture where they agree produces one verdict carrying both judges' names.
3. `key_doubt` on a deliberately-wrong weld produces a card and leaves the recall verdict `held`.

---

## 8 · THE TRAPS — HOW THIS EXACT WORK WENT WRONG ON 15 Aug

Read these before writing code. Every one cost real time today.

1. **A TEST THAT ONLY EXERCISES THE FAILURE PATH IS NOT A TEST.** `capsuleAnswerKey` was green for
   a full commit while returning `null` for every concept. **Every new grading path needs a
   LIVE-DATA assertion that reads a real capsule off disk.** Mark it DORMANT-SAFE: `capsules/` is
   gitignored, so a clean checkout must report the check SKIPPED, never fail.
2. **A SELFTEST THAT MATCHES ITS OWN SOURCE.** This happened **three times in one day** — a guard
   searching for a string that the guard itself contains. Build needles by concatenation
   (`"child" + "_process"`), the house idiom.
3. **`--dry` MUST MEAN TOUCH NOTHING.** It dispatched to owners while skipping the write, and the
   acceptance run put three fabricated rows into his real study record.
   **Run every acceptance test with `--dry` first.**
4. **NEVER WRITE INTO HIS STUDY RECORD TO PROVE SOMETHING WORKS.** `reps_log.jsonl`,
   `rejirah_log.jsonl`, `tape_room.json` and `capsules/` are his. If a live run is unavoidable,
   audit it afterwards against the permanent archive
   (`%USERPROFILE%\CyborgArchive`) and restore exactly.
5. **THE XRAY SINK RATCHET WILL BITE.** It caught this organ twice in one day. Fix it by making the
   code more legible — one door per file-read, module-level path constants, spawns written out in
   full — **never by widening the budget**. Check after every block:
   `node scripts/xray.mjs selftest`.
6. **DO NOT TRUST A NUMBER WRITTEN IN PROSE — INCLUDING IN THIS FILE.** Every count here was true
   on 15 Aug 2026. Re-measure before acting on any of them. The `GAFFER_REBUILD` order's §6
   baseline was already stale when it was read.
7. **THE COVERAGE LAW (ISSUE #75).** Any new `scripts/*.mjs` with a `selftest` mode must join
   exactly one suite in the same commit, or `organism_test.mjs coverage` fails.
8. **BILLING LAW.** Opus rides `claudeGen`, which refuses outright when `ANTHROPIC_API_KEY` is set.
   Max subscription, never an API key. Do not add a vendor.

---

## 9 · WHAT NOT TO DO

- **Do not add a new vendor, a new account, or a new key.** Cerebras was tried and is dead: 402
  `payment_required` on every model its account could list, and its free tier ended 17 Aug 2026.
  Its reader is frozen as `loadCerebrasKeyLegacy` with no live caller. Leave it frozen.
- **Do not delete the DMN.** Its 6 entries are real and they reach him through `setpiece` drills.
  The fault is the **ratio and the order**, not the organ.
- **Do not "harmonise" the two grading standards.** Recall verdicts are graded against HIS capsule;
  interview-facing verdicts against the DOSSIER. That asymmetry is deliberate.
- **Do not override a capsule.** If a weld looks wrong, that is a card, never an edit. `capsules/`
  is a read-only mirror; `mirror.mjs` is its sole writer and the gist is the master.
- **Do not put a second judge on the keyed verdicts.** `axis_weld` and `tape_doubt` have his own
  answer on disk; a second opinion buys nothing there and doubles the cost.
- **Do not wait for data before shipping a number.** Ship the provisional value with a
  `_derivation` note and measure while live (UNLEASH's DAY-0 LAW).

---

## 10 · WHAT HE SHOULD EXPECT WHEN THIS IS DONE

- **Every data point about him is judged by Opus, against a named standard, and it is cheap** —
  because the standard is cached, not re-sent.
- **The judge is the same whichever surface he uses.** A scrimmage graded by voice and by
  `/scrimmage` gives the same verdict.
- **The organism stops reasoning from evidence it does not have** — and says so instead.
- **What it spends imagining him is bounded by what it knows about him**, and grows automatically
  as he does reps.
- **A wrong verdict can be taken back**, so one bad call stops compounding through nemesis and FSRS.
- **When two families disagree about him, he gets a card** — the 💎 the design named as the
  highest-value signal, and which has never once been produced.

**HONEST LIMIT:** this layer makes the organism's judgements about him true, cheap and reversible.
It does not make him do reps. Nothing here produces a single data point until he starts talking to
the Gaffer — and the whole point of it is that from that moment, every one of those data points is
worth trusting.

---

## 11 · THE FIRST THING TO DO IN THE NEXT SESSION

```
npm test                                   # must be 43/0 (86 members)
node scripts/xray.mjs selftest             # 21/0, ratchet 1247 → 1247
node -e "import('./scripts/gaffer_brain.mjs').then(m=>console.log(JSON.stringify(m.gradeMaterial('trap','tokenization:0'))))"
```
That last line prints the live bug BLOCK 0 exists to fix — the trap's `truth` sitting inside
`asked`, with `key: null`. Start there.
