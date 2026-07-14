# ⚪🔴 THE DAILY LOOP — how to actually use the organism, end to end

> You learn in **Claude threads**, code in **Colab**, drill in **Gems**, listen in **NotebookLM**.
> **The organism is not a fifth place to study. It is the LOOP AROUND those four.**
> It does exactly three things for you: tells you **WHAT** to work on each morning,
> captures **WHAT HAPPENED** in each surface, and **CLOSES THE LOOPS** at night
> (rematches, drills, probes, research briefs) so tomorrow is sharper than today.
>
> The one discipline that makes everything work: **end every session with the paste.**
> Har session ka aakhri move: reps paste karo. Bas. Everything else is automatic.

---

## THE DAY (what you actually do)

### ☀️ Morning (2 minutes)
1. Phone buzzes ~08:45 — the **team sheet** (the machine's proposal for today).
2. Double-click **MATCHDAY** → press START → *"good morning."*
   The Gaffer reads you the day: body verdict, today's ≤3 drills (first one winnable by law),
   what's due for Re-Jirah, and — if the night shift staged one — *"scout pack tayyar hai."*
3. That's it. Close the tab or leave it parked — the line reconnects on your voice.

### 📚 When you LEARN (a Claude thread)
- Start the thread by pasting the **SESSION HEADER** (below). It makes Claude run the
  FORGE properly (gut-word before every answer) **and** end the session with the reps JSON.
- Study normally. Stray doubt mid-session? Phone → **throw-in** (one line, verbatim, done).
- Session over → Claude prints the JSON block → copy it →
  **either** say *"log reps"* to the Dugout and read them, **or** run `/paste-session`
  in Claude Code, **or** save to a file and `node scripts/capture.mjs paste <file>`.
- **The paste IS the session's full stop.** No paste = the session never happened, as far
  as the club knows.

### 💻 When you CODE (Colab)
- Same header, `surface: "colab"`, `track: "skill"`. At the end, have the notebook's Claude/Gemini
  cell (or just you) produce the same JSON. Paste it the same way.
- Coding with the Dugout open + screen shared = the Watcher quietly watches; if you spin,
  the thalamus knows. You don't do anything for this — it's ambient.

### 📱 When you DRILL (your Gem — THE EXAMINER)
- Open the **THE EXAMINER ⚪🔴** Gem (phone or laptop). It already knows the rules:
  one probe at a time, gut-word first, and it ENDS by printing the reps JSON.
- It draws from the night shift's fresh probe bank (re-paste `gem_cartridge.md` weekly —
  the file refreshes nightly at `dressing-room/state/brain_out/nightshift/gem_cartridge.md`).
- Copy the JSON → paste into the club (same three ways as above).

### 🎧 When you LISTEN (NotebookLM)
- NotebookLM is for **absorbing your own material** — audio overviews of your capsules,
  the season film. Listening is not a rep (it isn't self-tested), so nothing to paste.
- If the podcast sparks a thought → **throw-in**. That's its capture path.

### 🔬 When the club stages RESEARCH (the Pro account)
- The Gaffer will offer it, or check `brain_out/nightshift/scout_pack.md`:
  ready-to-paste **Deep Research** prompts built from your live open threads.
- Run one on the Pro account → when it finishes, copy the summary → **throw-in**
  (or tell Claude Code "ingest it"). The doubtminer digests it overnight.

### 🌙 Evening (30 seconds — the only ritual that matters)
- Bell at 21:30 → open the Dugout (or it's still parked) → *"full time."*
- Result (HIT/MISS/PARTIAL/REST) · one signal · your **KAL-line** (tomorrow's first
  move, your words) → *"haan, chalao."* Done. Sleep. The machine works the night.

---

## THE SESSION HEADER (paste at the TOP of any Claude study thread)

```
You are running a FORGE study session with me. Rules:
1. ONE concept at a time. Before I answer any check-question, I must state my
   gut-word first: "knew", "shaky", or "guessed". No gut-word, no answer counts.
2. Probe me along the crack-map: what-it-is/analogy · why · mechanism · math ·
   limits · trade-offs · build-hook · scale-gotcha · explain-3-ways.
3. Be a skeptical interviewer, not a cheerleader. Honest verdicts.
4. THE CONTRACT — at the end of the session (when I say "session khatam"), output
   ONLY a JSON array of every rep we did, exactly this shape:
   [{"surface":"gem","track":"concept","concept":"<canonical-name>","axis":"<a-i>",
     "question":"<the probe>","confidence":"knew|shaky|guessed","correct":true}]
   (for Colab coding sessions use "surface":"colab","track":"skill")
```

## WHERE EACH THING LIVES (when you're curious)

| You want | Say / run |
|---|---|
| Everything the club did + what's dormant | Dugout: *"club report do"* |
| Health check when something feels off | `/organism-doctor` in Claude Code |
| The wall (pictures) | THE WALL desktop icon |
| A timed mock | SCRIMMAGE icon (the code round runs on the Chalkboard) |
| Show someone the club | ARSENAL BRIEFING 1 / 2 icons |

**The mental model, one line:** the four surfaces are where you play football;
the organism is the CLUB — the manager, the physio, the analysts, the academy —
and the club only ever sees the match through the reps you paste. **Feed it blood; it does the rest.**
