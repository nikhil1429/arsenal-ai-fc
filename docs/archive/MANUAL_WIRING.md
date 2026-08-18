# ⚪🔴 MANUAL_WIRING.md — the captain's ONE-TIME Gemini-side wiring

This is the **only** wiring Claude Code can't do for you (it can't reach Gemini/Colab). Two paste-once blocks make **Colab** and the **Drill Gem** feed `scripts/capture.mjs` (Agent #0). After this, capture is automatic — you log nothing by hand beyond one paste (Gems) or zero (Colab, once Drive is wired).

> **(corrected 10 Aug 2026 — the GEMINI half of that first parenthesis is no longer true.)** Since
> 8–9 Aug 2026 four skills drive the captain's OWN Chrome to `gemini.google.com` through the
> claude-in-chrome MCP: `/fire` (stage → fire a mission), `/harvest` (a whole sitting onto the
> afferent bus), `/gem-sync` (clears and rewrites a Gem's Instructions box), `/paint`. Verify live,
> never from this line: `grep -rln "gemini.google.com" .claude/skills/`.
> **COLAB is still unreachable** — nothing in the repo drives a Colab browser session;
> `grep -rn "colab.research.google.com" .claude/ scripts/` hits only `presence.mjs` /
> `timeaudit.mjs` domain CLASSIFIERS, never a driver. So the honest statement today: **the Colab
> block (§1) is wiring Claude Code genuinely cannot do; the Gem block (§2) it now can paste for
> you** — see the §2 warning about `/gem-sync` overwriting the box.

**The rep schema both blocks MUST emit** (matches `capture.mjs` exactly):
`{ "ts": ISO, "surface": "gem"|"colab", "track": "concept"|"skill", "concept": string, "axis": "a".."i"|null, "question": string, "confidence": "knew"|"shaky"|"guessed", "correct": true|false, "latency_ms": int|null (optional), "aided": true|false|null (optional), "note": string (optional) }`
Dedup is on `ts + question`. Malformed reps are rejected, never coerced (but an **unknown concept is still logged**, flagged `unregistered`). **Confidence is one gut-word — `knew` / `shaky` / `guessed` — committed BEFORE the answer is revealed.** That honest gut-read is what makes Calibration real.

> **(corrected 10 Aug 2026 — two claims in the three lines above were stale, and the dedup one is
> the dangerous half.)**
> - **"matches `capture.mjs` exactly" was true at v2 and has been wrong since v3.** The validator
>   also accepts two more optional inbound fields — **`confused_with`** (string|null, canonicalized
>   through the SAME registry path as `concept`) and **`edge`** (string|null, stored VERBATIM, never
>   canonicalized). Both are already emitted by §1's `log_rep()` and asked for by §2's Gem rules
>   below, so the schema line was contradicting its own two code blocks. Read the contract at its
>   source: `grep -n "INPUT CONTRACT" scripts/capture.mjs` (the header block), and
>   `grep -n "confused_with (v3)" scripts/capture.mjs` for the check itself.
> - **DEDUP IS NOT `ts + question`.** It was, once — the identity is now
>   **`ts_claimed + concept + axis + question`**, and the change was a real bug-fix, not a tidy-up:
>   a FORGE burst logs many reps whose question text is literally `"Bolo."`, so keying on
>   `ts + question` collapsed two reps on DIFFERENT concepts into one and silently discarded the
>   second. Read it live: `grep -n "const keyOf" scripts/capture.mjs` (the pre-#24 identity is
>   frozen beside it as `keyOfLegacy`, per the layering law).
> - **The stored rep is WIDER than the emitted rep**, and that is by design, not drift. capture
>   enriches on write: `concept` → its canonical registry id, `unregistered` (bool), and THE THREE
>   CLOCKS — `ts_claimed` (what the author wrote), `observed_at` (the instant capture saw it),
>   `ts_source`. See `grep -n "THE THREE CLOCKS" scripts/capture.mjs`. Field set of a real stored
>   row, live: `node -e "const l=require('fs').readFileSync('dressing-room/state/reps_log.jsonl','utf8').trim().split(/\r?\n/);console.log(Object.keys(JSON.parse(l[l.length-1])).join(','))"`
> - Still true and re-verified today: rejected-never-coerced, unknown-concept-still-logged, and the
>   gut-word law. Evidence: `node scripts/capture.mjs selftest` → **ALL CHECKS PASSED** (10 Aug 2026).
>   Read the pass/fail from that command, never from a number written here.

- **`track`**: `"concept"` = an AI concept (gets an `axis`, becomes an FSRS card) · `"skill"` = Python (axis MUST be `null`, `aided` optional, NOT an FSRS card).
- **`axis`** (concept only) — which of the 9 drill lenses the question tested: `a` kya+analogy · `b` kyun/first-principles · `c` mechanism · `d` math+range · `e` limits/failure-modes · `f` tradeoffs · `g` FinOps-spot · `h` scale/cost · `i` 3-ways. Use `null` only if a rep isn't axis-specific.
- **`aided`** (skill only) — `false` = answered from memory · `true` = looked it up.

---

## 0. Prereqs (once)

- **Gems (paste path)** — nothing to install. At session end the Gem prints a JSON array; you hand it to Claude Code, which runs `node scripts/capture.mjs paste`.
- **Colab (auto-pull path, Option B) — LIVE.** Google Drive for Desktop is installed + synced (My Drive at `G:`); the inbox `G:\My Drive\arsenal\reps_inbox` is wired via `capture_config.json`. The task `ArsenalFC-CapturePull` runs `capture.mjs pull` **hourly, 09:00–22:00 daily** (Status: Ready). Nothing to do — your Colab reps flow in automatically once `flush_reps()` writes them to the inbox.

> **(re-verified 10 Aug 2026 — this bullet HELD, plus three things it never said.)** The task is
> real: `schtasks /query /tn "ArsenalFC-CapturePull" /fo LIST /v` → Status **Ready**, Start Time
> 09:00, "Repeat: Every 1 Hour(s)", "Until: Duration 13 Hour(s)" = 09:00→22:00, fourteen fires a
> day. The inbox exists on this machine and the lane is not dormant — `tail scripts/capture.log`
> shows live `pull: pulled 0 from 0 file(s)` rows (wired, inbox simply empty). What the bullet
> omits:
> - `capture_config.json` is **gitignored on purpose and NOT for privacy** — it holds THIS PC's
>   Drive path, so committing it would break the next machine (`grep -n "capture_config" .gitignore`).
> - The path is resolvable **three ways, env first**: `ARSENAL_REPS_INBOX` → `capture_config.json`
>   `{"inbox":...}` → unset = dormant. `grep -n "function resolveInbox" scripts/capture.mjs`.
> - **"LIVE" means WIRED, not USED.** Zero Colab reps have ever landed. Count it live, never from
>   here: `node -e "const s={};for(const l of require('fs').readFileSync('dressing-room/state/reps_log.jsonl','utf8').trim().split(/\r?\n/))s[JSON.parse(l).surface]=(s[JSON.parse(l).surface]||0)+1;console.log(s)"`

---

## 1. COLAB — paste this cell ONCE per notebook

```python
# === Arsenal AI FC · Colab rep logger (paste once) ===
import json, os, datetime, uuid
from google.colab import drive
drive.mount('/content/drive', force_remount=False)

INBOX = '/content/drive/MyDrive/arsenal/reps_inbox'
os.makedirs(INBOX, exist_ok=True)
_REPS = []

def log_rep(skill, question, confidence, correct, aided=False, latency_ms=None, confused_with=None, edge=None, note=None):
    """Log ONE Python (skill) rep. Colab = track:'skill' (NO axis). Commit `confidence`
    — 'knew' | 'shaky' | 'guessed' — BEFORE you check. aided: False=from memory, True=looked it up.
    confused_with (v3, optional): if you mixed it up with another skill/concept. edge (v3, optional):
    honest knowledge-boundary text, e.g. 'can write basic models, shaky on validators'."""
    assert confidence in ("knew", "shaky", "guessed"), "confidence must be 'knew', 'shaky', or 'guessed'"
    assert isinstance(correct, bool) and isinstance(aided, bool), "correct/aided must be True/False"
    rep = {
        "ts": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "surface": "colab", "track": "skill", "concept": skill, "axis": None,
        "question": question, "confidence": confidence, "correct": correct,
        "aided": aided, "latency_ms": latency_ms,
        "confused_with": confused_with, "edge": edge,
    }
    if note:
        rep["note"] = note
    _REPS.append(rep)
    print(f"logged #{len(_REPS)}: {skill} · conf {confidence} · {'right' if correct else 'wrong'} · {'lookup' if aided else 'memory'}")

def flush_reps():
    """Write this session's reps to the Drive inbox as one .jsonl; capture.mjs pull ingests it."""
    if not _REPS:
        print("no reps to flush"); return
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S')
    path = os.path.join(INBOX, f"colab_{stamp}_{uuid.uuid4().hex[:6]}.jsonl")
    with open(path, "w", encoding="utf-8") as f:
        for r in _REPS:
            f.write(json.dumps(r) + "\n")
    print(f"wrote {len(_REPS)} reps -> {path}")
    _REPS.clear()
```

**Use:** after each Python drill, call
`log_rep("async", "await inside a loop — gotcha?", "shaky", True, aided=False, note="forgot gather")`
— committing your gut-word `confidence` **before** you verify (`aided=True` if you looked it up). At the end of the notebook, call `flush_reps()` once. Done. (Colab is your Python / skill surface — every rep is `track:"skill"`, no axis.)

---

## 2. THE DRILL GEM — paste this into the Gem's system instructions

> **⚠ (added 10 Aug 2026 — "paste ONCE" is no longer safe to assume for every Gem.)** Since 9 Aug
> the skill `/gem-sync` **clears a Gem's Instructions box (ctrl+a) and types a whole new body over
> it** — the nightly cartridge `dressing-room/state/brain_out/nightshift/gem_cartridge.md`, written
> by `nightshift.mjs`. Evidence: `.claude/skills/gem-sync/SKILL.md` step 2, "Clear the Instructions
> box (click it → ctrl+a → type the new cartridge body)". **A gem-sync over THIS Gem would wipe the
> block below.** The skill names its target as the Gem called **THE EXAMINER ⚪🔴**, and the
> cartridge carries its own rep-JSON rule, so the two are probably separate Gems —
> **but WHICH Gem on his account is "the Drill Gem" is NOT VERIFIABLE FROM CODE (NOT VERIFIED
> 10 Aug 2026 — treat as a claim; only the captain can say).** Before pasting §2 into a Gem, check
> it is not the one `/gem-sync` drives.
> Cross-check the cartridge's own contract too: `grep -n "paste it into my capture system" scripts/nightshift.mjs`
> — it asks the Gem for reps **with no `ts` field at all**, and with `axis` as the literal string
> `"a-i"`; `capture.mjs` rejects both (`grep -n "ts missing/not-string" scripts/capture.mjs` and
> `grep -n "axis not a..i" scripts/capture.mjs`). The block below asks for a real `ts` and a single
> letter, and is the shape that actually ingests. **That mismatch lives in `nightshift.mjs`, not
> here — do not "fix" the block below to match the cartridge.**

```
You are my drill coach for AI-engineering CONCEPTS. For EVERY question, follow this loop:
1. Ask ONE question, aimed at a specific AXIS (the 9 axes are below). Do NOT reveal answer/hint yet.
2. First make me commit ONE gut-word — "Knew", "Shaky", or "Guessed" (how sure I
   am I'll get it right) BEFORE you show anything. Wait for my word.
3. THEN reveal the answer and tell me if I was correct (true / false).
4. If I was WRONG, ask "kisse confuse hua?" (which concept did I mix it up with?) — record it as `confused_with` (or null if nothing specific).
5. When we CLOSE a concept, you may ask my honest edge — where my knowledge stops ("can explain X, not Y") — record it as `edge` on that rep (else null).
6. Keep a running log of every rep (concept + axis + my word + correct? + confused_with + edge).

The 9 AXES — pick the ONE the question tests:
  a kya+analogy · b kyun/first-principles · c mechanism · d math+range · e limits/failure-modes
  · f tradeoffs · g FinOps-spot · h scale/cost · i 3-ways

When I say "end session" (or "report"), output ONLY a fenced JSON array — no prose
before or after — one object per rep, in this exact shape:

[
  {"ts":"2026-07-11T09:00:00Z","surface":"gem","track":"concept","concept":"chunking","axis":"f","question":"fixed vs semantic chunking — the tradeoff?","confidence":"shaky","correct":true,"edge":"can size chunks, shaky on overlap tradeoffs","note":"missed overlap"},
  {"ts":"2026-07-11T09:04:00Z","surface":"gem","track":"concept","concept":"retrieval","axis":"c","question":"how does reranking work?","confidence":"guessed","correct":false,"confused_with":"embeddings"}
]

Rules:
- track is always "concept" (this Gem drills concepts, not Python).
- axis = the single letter a–i the question tested (use null only if truly not axis-specific).
- confidence = the gut-word I gave BEFORE seeing the answer: "knew", "shaky", or "guessed".
- correct = true/false. ts = when asked, ISO-8601 UTC. surface always "gem".
- concept = the short topic; question = the exact question text. note optional.
- confused_with (v3, optional) = on a WRONG rep, the concept I mixed it up with (else omit/null).
- edge (v3, optional) = my honest knowledge-boundary on that concept when we close it (else omit/null).
- Output the array and NOTHING else, so I can paste it straight into capture.mjs.
```

**Use:** at session end, copy the JSON array the Gem prints and give it to Claude Code — it runs `node scripts/capture.mjs paste` (or you save it to a file and it runs `node scripts/capture.mjs paste that_file.json`).

> **(corrected 10 Aug 2026 — the first form in that sentence does not exist.)** There is no
> interactive paste mode: **bare `capture.mjs paste` with no file arg and no piped stdin exits 1**
> with `"paste: provide a JSON file arg or pipe JSON via stdin"`
> (`grep -n "provide a JSON file arg" scripts/capture.mjs`). The parenthetical is the only real
> path, and it is what the skill actually does — `.claude/skills/paste-session/SKILL.md` step:
> "`node scripts/capture.mjs paste <tmpfile>` → then `node scripts/heartbeat.mjs`". Two doors this
> section never learned about, both live:
> - **`--chain`** on paste. **A paste alone leaves the derived state stale** — cards ·
>   calibration · nemesis · learning_state do NOT include the new reps until a heartbeat runs, and
>   capture says so on exit. `node scripts/capture.mjs paste <file> --chain` recomputes now.
>   `grep -n "wantsChain" scripts/capture.mjs`.
> - **`capture.mjs rep …`** — ONE rep as it happens, same validator, same lock, for when a session
>   ends messily and the array never gets built:
>   `node scripts/capture.mjs rep --concept <c> --axis <a> --q "<what was tested>" --gut knew|shaky|guessed --correct true|false`.
>   `--correct` is **never defaulted** (a missing flag used to become `false` and write a miss he
>   never made). Read the live usage text: `node scripts/capture.mjs` with no args.

---

## 3. How it flows (so you can see the whole loop)

```
Drill Gem  ──(end-session JSON array)──▶  capture.mjs paste ─┐
                                                             ├─▶ dressing-room/state/reps_log.jsonl
Colab flush_reps() ─▶ Drive inbox ─(Drive for Desktop sync)─▶ capture.mjs pull ─┘
                                                             │
        reps_log.jsonl is READ by ──▶ FSRS · Calibration · Nemesis  (each computes its own view)
```

- **You touch:** one paste per Gem session; nothing per Colab session (once Drive is wired).
- **Never logged by hand:** the reps themselves — the Gem and the Colab cell emit them.
- **Ontology:** Gem reps are `track:"concept"` (carry an axis a–i, become FSRS cards); Colab reps are `track:"skill"` (Python fluency, NOT cards — that signal lives in #4 learning-state). An unknown concept is still logged, flagged `unregistered` — register it by adding it to `dressing-room/state/concepts.json` (canon vocab), and it retro-registers on next load.
- **Privacy:** `reps_log.jsonl` is gitignored (your study data never hits the public repo).

> **(corrected 10 Aug 2026 — the LAST bullet is flatly wrong, and it is the one with consequences.)**
> - **`reps_log.jsonl` IS NOT GITIGNORED AND IS NOT PRIVATE.** It is a TRACKED file in this PUBLIC
>   repo. Evidence, both run today: `git check-ignore -v dressing-room/state/reps_log.jsonl` →
>   **no match (exit 1)**, and `git ls-files --error-unmatch dressing-room/state/reps_log.jsonl` →
>   matches. This was a deliberate captain ruling, not an accident: `grep -n "D10" .gitignore` →
>   *"D10, 5 Aug 2026: reps_log.jsonl now travels with the repo (his ruling)."* **His study data
>   DOES hit the public repo, by his own decision.** Anyone acting on the old sentence — pasting
>   something into a rep believing it stays local — would be wrong. What IS still ignored nearby:
>   `capture_config.json` (machine path, not privacy) and `reps_log.jsonl.quarantine.jsonl`
>   (rescued raw lines). Check any file live, never from prose: `git check-ignore -v <path>`.
> - **The reader list in the box above is a floor, not the set.** It was true when only three
>   consumers existed; today `reps_log.jsonl` is read across the organism (learning_state, scorer,
>   touchline, dugout, python_state, thalamus, nikhil_model, physio, viz, bootroom, brain…).
>   **Count and name them live, never from here:** `grep -rl "reps_log.jsonl" scripts/*.mjs`
>   (subtract `capture.mjs` itself — it is the writer, not a reader).
> - **The box also predates two doors** that reach the same log: `capture.mjs rep` (one rep, in
>   session — see §2's note) and the **heartbeat chain**. A `pull` that actually lands reps chains
>   `heartbeat.mjs` itself; a `paste` does NOT unless you add `--chain`. So the arrow into
>   `FSRS · Calibration · Nemesis` is real but **not instant on the paste lane**.
>   `grep -n "chainHeartbeat" scripts/capture.mjs`.
