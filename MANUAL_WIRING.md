# ⚪🔴 MANUAL_WIRING.md — the captain's ONE-TIME Gemini-side wiring

This is the **only** wiring Claude Code can't do for you (it can't reach Gemini/Colab). Two paste-once blocks make **Colab** and the **Drill Gem** feed `scripts/capture.mjs` (Agent #0). After this, capture is automatic — you log nothing by hand beyond one paste (Gems) or zero (Colab, once Drive is wired).

**The rep schema both blocks MUST emit** (matches `capture.mjs` exactly):
`{ "ts": ISO-8601 string, "surface": "gem" | "colab", "concept": string, "question": string, "confidence": int 0–100, "correct": true|false, "note": string (optional) }`
Dedup is on `ts + question`. Malformed reps are rejected, never coerced. **Confidence is the number you commit BEFORE seeing the answer** — that's what makes the Calibration agent real.

---

## 0. Prereqs (once)

- **Gems (paste path)** — nothing to install. At session end the Gem prints a JSON array; you hand it to Claude Code, which runs `node scripts/capture.mjs paste`.
- **Colab (auto-pull path, Option B)** — install **Google Drive for Desktop**, sign in, let **My Drive** sync to this PC. Create the folder `My Drive\arsenal\reps_inbox`. Then enable the dormant task:
  ```
  schtasks /Change /TN ArsenalFC-CapturePull /ENABLE
  ```
  Until Drive is wired, the Colab block still works — reps wait in Drive and `capture.mjs pull` ingests them the moment the task is enabled. (Task is created **disabled** today because Drive for Desktop isn't installed yet.)

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

def log_rep(concept, question, confidence, correct, note=None):
    """Log ONE drill rep. Commit `confidence` (int 0-100) BEFORE you check the answer."""
    assert isinstance(confidence, int) and 0 <= confidence <= 100, "confidence must be int 0-100"
    assert isinstance(correct, bool), "correct must be True/False"
    rep = {
        "ts": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "surface": "colab", "concept": concept, "question": question,
        "confidence": confidence, "correct": correct,
    }
    if note:
        rep["note"] = note
    _REPS.append(rep)
    print(f"logged #{len(_REPS)}: {concept} · conf {confidence} · {'right' if correct else 'wrong'}")

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
`log_rep("list comprehensions", "flatten a nested list?", 55, True, note="forgot the order")`
— predicting `confidence` **before** you verify. At the end of the notebook, call `flush_reps()` once. Done. (No Drive yet? The reps still write to the mounted Drive folder and sync down when you install Drive for Desktop.)

---

## 2. THE DRILL GEM — paste this into the Gem's system instructions

```
You are my drill coach. For EVERY question, follow this loop exactly:
1. Ask ONE question. Do NOT reveal the answer or any hint yet.
2. First make me commit a CONFIDENCE from 0 to 100 (how sure I am I'll get it
   right) BEFORE you show anything. Wait for my number.
3. THEN reveal the answer and tell me if I was correct (true / false).
4. Keep a running log of every rep.

When I say "end session" (or "report"), output ONLY a fenced JSON array — no prose
before or after — one object per rep, in this exact shape:

[
  {"ts":"2026-07-11T09:00:00Z","surface":"gem","concept":"TDS 194C","question":"what rate and threshold apply?","confidence":60,"correct":true,"note":"mixed up the threshold"},
  {"ts":"2026-07-11T09:04:00Z","surface":"gem","concept":"reconciliation","question":"what is a 3-way match?","confidence":40,"correct":false}
]

Rules:
- confidence = the number I gave BEFORE seeing the answer (int 0–100).
- correct = whether my answer was right (true/false).
- ts = when the question was asked, ISO-8601 UTC (e.g. 2026-07-11T09:00:00Z).
- surface is always "gem".
- concept = the short topic; question = the exact question text.
- note is optional (one short line); omit it if there's nothing to add.
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
- **Privacy:** `reps_log.jsonl` is gitignored (your study data never hits the public repo).
