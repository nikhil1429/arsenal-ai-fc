# ⚪🔴 MANUAL_WIRING.md — the captain's ONE-TIME Gemini-side wiring

This is the **only** wiring Claude Code can't do for you (it can't reach Gemini/Colab). Two paste-once blocks make **Colab** and the **Drill Gem** feed `scripts/capture.mjs` (Agent #0). After this, capture is automatic — you log nothing by hand beyond one paste (Gems) or zero (Colab, once Drive is wired).

**The rep schema both blocks MUST emit** (matches `capture.mjs` exactly):
`{ "ts": ISO, "surface": "gem"|"colab", "track": "concept"|"skill", "concept": string, "axis": "a".."i"|null, "question": string, "confidence": "knew"|"shaky"|"guessed", "correct": true|false, "latency_ms": int|null (optional), "aided": true|false|null (optional), "note": string (optional) }`
Dedup is on `ts + question`. Malformed reps are rejected, never coerced (but an **unknown concept is still logged**, flagged `unregistered`). **Confidence is one gut-word — `knew` / `shaky` / `guessed` — committed BEFORE the answer is revealed.** That honest gut-read is what makes Calibration real.
- **`track`**: `"concept"` = an AI concept (gets an `axis`, becomes an FSRS card) · `"skill"` = Python (axis MUST be `null`, `aided` optional, NOT an FSRS card).
- **`axis`** (concept only) — which of the 9 drill lenses the question tested: `a` kya+analogy · `b` kyun/first-principles · `c` mechanism · `d` math+range · `e` limits/failure-modes · `f` tradeoffs · `g` FinOps-spot · `h` scale/cost · `i` 3-ways. Use `null` only if a rep isn't axis-specific.
- **`aided`** (skill only) — `false` = answered from memory · `true` = looked it up.

---

## 0. Prereqs (once)

- **Gems (paste path)** — nothing to install. At session end the Gem prints a JSON array; you hand it to Claude Code, which runs `node scripts/capture.mjs paste`.
- **Colab (auto-pull path, Option B) — LIVE.** Google Drive for Desktop is installed + synced (My Drive at `G:`); the inbox `G:\My Drive\arsenal\reps_inbox` is wired via `capture_config.json`. The task `ArsenalFC-CapturePull` runs `capture.mjs pull` **hourly, 09:00–22:00 daily** (Status: Ready). Nothing to do — your Colab reps flow in automatically once `flush_reps()` writes them to the inbox.

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
