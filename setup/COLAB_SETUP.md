# COLAB_SETUP.md — the per-rep flush (the touchline's blood supply)

Your existing Colab cell (MANUAL_WIRING.md §1) flushes reps at session end.
THE ORGANISM's touchline reads your live state mid-session — that needs the
ONE change the vision named: **per-rep flush**. Same schema, same inbox,
same hourly CapturePull. Replace your logging cell with this one:

```python
# ⚪🔴 ARSENAL AI FC — rep logger v4 (per-rep flush · schema-identical to v3)
import json, uuid, time, os
from datetime import datetime, timezone

INBOX = "/content/drive/MyDrive/arsenal/reps_inbox"   # same inbox as before
os.makedirs(INBOX, exist_ok=True)
_session = f"colab_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.jsonl"
_t0 = None

def start_rep():
    """call when the question lands (starts the latency clock)"""
    global _t0; _t0 = time.time()

def log_rep(concept, question, confidence, correct, aided=False, note=None):
    """confidence: 'knew' | 'shaky' | 'guessed' — your gut word, BEFORE checking.
       aided: True if you looked anything up. One call per rep; flushes instantly."""
    global _t0
    rep = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "surface": "colab", "track": "skill",
        "concept": concept, "axis": None,
        "question": question, "confidence": confidence, "correct": bool(correct),
        "latency_ms": int((time.time() - _t0) * 1000) if _t0 else None,
        "aided": bool(aided),
    }
    if note: rep["note"] = note
    with open(os.path.join(INBOX, _session), "a") as f:
        f.write(json.dumps(rep) + "\n")           # per-rep flush — the one change
    _t0 = None
    print(f"⚪🔴 rep logged → {concept} ({confidence}, {'✓' if correct else '✗'})")
```

Usage per drill: `start_rep()` when you read the question → solve →
`log_rep("pydantic", "validate nested model", "shaky", True, aided=False)`.

Nothing else changes: `ArsenalFC-CapturePull` sweeps the inbox hourly, moves
files to `/done`, and dedups — a mid-session file being appended is safe
(the next sweep catches the tail).
