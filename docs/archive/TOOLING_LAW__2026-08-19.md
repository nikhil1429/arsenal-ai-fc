# LAW T — THE TOOLING LAW (19 Aug 2026, on his word)

> **STANDING AND UNIVERSAL. This binds every session, every organ, and every future block of work
> on the cyborg organism, from 19 Aug 2026 onwards. It is not advice and it is not per-task.**
>
> His words: *"i want zero token wastage but i want full top priority with the best quality of work
> possible and highest and deepest level of intensity with maximum speed. FANG level product
> optimization should be there from now onwards for the entire cyborg organism universally and
> globally."*

---

## §1 · THE ROUTING LAW — what "zero token wastage" actually means

His definition, verbatim: *"zero token wastage means wasting tokens on something which can be done
for free with the same best quality of work possible and highest and deepest level of intensity
with maximum speed."*

**So this is a ROUTING law, not an austerity law, and it cuts BOTH ways:**

> **Every unit of work goes to the cheapest TIER that achieves the SAME quality, depth and speed.**
> **Paying above that tier is waste. Paying below it is WORSE than waste — the answer gets redone.**

**Before any task, one question: is this COMPUTATION, BREADTH, or JUDGEMENT?**

- **COMPUTATION** → TIER 0. Free, deterministic, and BETTER than any model at it.
- **BREADTH** → TIER 1 (Gemini). Free at his scale. Recall is the product; precision is not.
- **JUDGEMENT** → TIER 2 (Claude). Paid, and worth it — refusing to spend here is the expensive mistake.

Spending one paid token to hunt for empty `catch` blocks is the purest form of the waste he means.
Refusing to spend Claude tokens on the SHAPE of a bug class is the expensive kind.

---

## §2 · TIER 0 — THE PERMANENT TOOLCHAIN. Install once, run forever, gate on all of it.

**Measured 19 Aug 2026: 106,376 lines of code across 103 organs, with ZERO linter, ZERO
type-checking, ZERO coverage, ZERO dead-code analysis.** `devDependencies` was `acorn` +
`acorn-walk`, and those exist only so `xray.mjs` could hand-roll its own parser.

The industry frame (researched, not recalled): **no single tool covers all dimensions — quality
analysis requires LAYERING several.** These are the layers, and each one replaces something this
repo currently hand-rolls badly.

**1 · TYPE LAYER — `tsc --checkJs` with JSDoc. NO TypeScript rewrite. THE HIGHEST-VALUE ITEM.**
Not theoretical: on 19 Aug a wire called `readJsonl(...)`, a helper `watchman.mjs` does not have. It
was a ReferenceError, a `swallow` ate it, and it **shipped GREEN while the check never ran once**.
That file's own comment records the same thing happening before. In a codebase held together by
445 silent catches, static name-resolution is the single biggest safety win available. It catches
the entire class, before runtime, for free.

**2 · LINT LAYER — ESLint.** `no-empty` alone turns the 445 hand-counted swallowed exceptions into
an enforced rule with ~0 false positives. Plus `no-unused-vars`, `no-undef`. (Biome / OxcLint are
the faster modern alternatives if ESLint's speed ever becomes the complaint.)

**3 · ARCHITECTURE LAYER — `dependency-cruiser`. The one that matters most for THIS organism.**
It validates dependencies against **rules you write**, and finds cycles, orphan modules and
unresolved imports. This repo's central law — **owners-only, one writer per state file** — is today
enforced by `xray`'s hand-rolled regex queries. dependency-cruiser makes the import-level half of
that a real, maintained, declarative rule set. (v18.1.1, Aug 2026; ~3.1M downloads/week.)
It also subsumes `madge` entirely.

**4 · DEAD-CODE LAYER — `knip`.** Builds a dependency graph from entry points, which is why it
produces *"accurate, actionable findings rather than the false positives common in older dead-code
tools."* That sentence is this repo's problem exactly: `xray`'s ORPHAN VERB query reports 82, and
its BROKEN EDGE query scored **5 of 5 FALSE** on 19 Aug.

**5 · CUSTOM-LAW LAYER — `semgrep`. The organism's OWN laws, as real rules.**
This repo's laws are currently enforced by hand-written regex scans inside `organism_test.mjs` and
`xray.mjs` — which is exactly why they produce false positives. semgrep is a semantic pattern engine
built for precisely this: write the rule once, match it structurally, low FP.
**Port to semgrep rules:** owners-only writes · no literal model names (LAW M) · no bare `catch {}` ·
no word-routing regex over his speech (BLOCK 5) · no canon file stating a live count (BLOCK 7).

**6 · COVERAGE LAYER — `c8`** (native to node). Answers a question nobody in this repo can answer
today: **which of the 106,376 lines has never once executed?**

**7 · MUTATION LAYER — Stryker Mutator**, replacing the hand-rolled `mutagen.mjs`. Answers whether
the tests are real or merely green.

**8 · SECURITY LAYER — `semgrep` (again) or Snyk Code**, scoped to the credential paths only. The
repo already has a privacy tripwire; this is belt-and-braces on the code side.

### The rule that makes it permanent

> **Every tool above rides `npm test` as a gate, and a gate may only get STRICTER.**
> A new organ does not ship until it passes all of them. When a hand-rolled scan and an
> industry tool disagree, **the industry tool wins and the hand-rolled scan is retired or
> narrowed to the organism-specific part only** — the part no general tool can know.

### What the hand-rolled instruments are still FOR

`xray` (the IR/graph), `swallow`, `limits`, `treasury`, `pulse`, `reconcile` stay — but only for
what is **domain-specific and unknowable to a general tool**: the gate's consumption law, his
learning state, token economics per lane, produce-vs-consume. **They stop being general static
analysers.** That is where their false positives came from.

---

## §3 · TIER 1 — GEMINI. Standing configuration, on his word.

**HIS RULING, 19 Aug 2026:** *"use gemini extended thinking on everytime, burn it tokens of both
accounts, i don't care about it"* — **AND, in the same breath** — *"i do not trust gemini results
much so keep that in mind."*

**Both hold at once, and they are not in tension:**

- **EXTENDED THINKING IS ON. ALWAYS. BOTH ACCOUNTS.** It costs him nothing, and on hard cross-file
  questions more thinking buys better RECALL — which is the only thing Gemini is here for.
  *(An earlier draft of this plan argued against turning it on. That argument was about cost, and
  cost is zero here, so the argument was wrong. Recorded so it is not re-made.)*
- **NOTHING GEMINI SAYS IS EVER BELIEVED WITHOUT A TIER 0 CHECK.** Its output is a **LEAD**, exactly
  as `xray`'s output is a lead — and `xray` scored 5 of 5 false on 19 Aug. His distrust is correct
  and the architecture makes it costless: a false positive from Gemini costs one deterministic check.

**THE COUNTED FACTS** (researched 19 Aug 2026): Gemini 3.x Pro — **1M-token context**, max output
64K (default 8,192, must be raised explicitly), **~250 requests/day** even on paid Tier 1.

**What that means for THIS repo, counted rather than assumed:**
- The code is ~1.3M tokens. **It does not fit, not even in Gemini.** Anyone proposing "give Gemini
  the whole repo" has not counted.
- **All 113 `.md` files are ~400k tokens and DO fit in ONE call.** Claude Code cannot hold them
  without compaction. **This is the one job nothing else can do.**
- 250 req/day ⇒ Gemini is for a HANDFUL of enormous questions, never many small ones.

**GIVE GEMINI EXACTLY THREE JOBS:**
1. **The whole-canon cross-document read** — all 113 `.md` at once: where is intent stated, which
   documents contradict each other, what is declared and never referenced.
2. **Subsystem breadth sweeps** — one subsystem at a time: *"list EVERY site that does X."*
3. **Deep Research on the outside world** — the lane that already exists (`/fire`, missions).

**NEVER GIVE GEMINI:** an unverified decision · the final word on his intent · code that ships ·
anything where being confidently wrong is expensive.

---

## §4 · TIER 2 — CLAUDE. Three things, and refusing to spend here is the costly mistake.

1. **Reading his INTENT** and deciding what he MEANT — his canon, his rulings, his words.
2. **Deciding the SHAPE of a bug class** — the §2-disease work: what else has this shape.
3. **Writing code that has to be right**, and adversarially verifying findings before they are believed.

---

## §5 · THE AGENT LAW — fan out by CONCERN, never by chunk

Researched 19 Aug 2026. **RepoAudit** names this repo's exact failure mode: *breaking a repository
into small pieces and prompting each piece falls short for **NON-LOCAL bugs** — bugs that require
reasoning across interconnected code spanning multiple functions, classes and files.*

**Every defect found on 19 Aug was non-local:** the gate could not see the outbox (two organs) · the
WAL sat behind the service it protected (two layers) · the mechanism nailed to one board (five
organs) · the conductor SPOF (a chain and its 16 dependents). **A chunked reader finds NONE of them.**

The same research pairs the model with a static pass that builds the graph FIRST and reasons over
the **GRAPH**, not the raw files (Greptile's pre-indexed code graph is the same lesson).
**This repo already HAS that graph — `xray`'s IR.**

**THE LAW:**
> Agents fan out by **CONCERN** (correctness · dead code · spend · liveness · security · coverage),
> **never by directory**. Each is handed the graph plus what is already measured. **Every finding
> must name the cross-file path that produces it.** A finding that lives inside one file should
> already have been caught by TIER 0 for free — if an agent reports one, that is a TIER 0 gap, and
> the gap is the real finding.

---

## §6 · WHAT NOT TO ADD

- **No new MCP servers.** The registry was searched on 19 Aug for code-analysis / static-analysis /
  lint / testing / observability: **nothing relevant returned.** The gap here is standard Node
  tooling, not MCP. Do not invent a need.
- **No LLM-in-the-loop repair.** The repo's thesis — *AI proposes · code validates · human approves*
  — is correct. A model that reads findings and acts on them breaks it.
- **No TypeScript rewrite.** `tsc --checkJs` + JSDoc gets the safety without the migration.

---

## §7 · THE ADOPTION ORDER — cheapest and highest-value first

Each step ends by becoming a gate in `npm test`. A step is not done until it is a gate.

1. **`tsc --checkJs` + JSDoc** on the hot organs — kills the swallowed-ReferenceError class
2. **ESLint `no-empty`** — 445 hand-counted silent catches become an enforced rule
3. **`dependency-cruiser`** — the owners-only law and the import graph, declaratively
4. **`knip`** — replaces the 82-orphan-verb query with a tool that does not cry wolf
5. **`semgrep`** — port the organism's own laws off hand-written regex
6. **`c8`** — find which of 106,376 lines has never executed
7. **Stryker** — retire `mutagen.mjs` once it agrees
8. **`PostToolUse` hook** — run the edited organ's selftest on every write (test-on-save)
9. **`/audit` skill** — one command runs the whole TIER 0 sweep and prints the compressed map

**Sources (researched 19 Aug 2026):** RepoAudit (arxiv 2501.18160) · github.com/PurCL/RepoAudit ·
sourcegraph.com/blog/automated-code-review-tools · npmjs.com/package/dependency-cruiser ·
knip.dev · in-com.com (TypeScript static-analysis layering) · reintech.io (JS tooling 2026) ·
ai-toolbox.co (Gemini context limits 2026) · aifreeapi.com (Gemini 3.1 Pro output limit)
