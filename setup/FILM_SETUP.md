# FILM_SETUP.md — daily posters + the Season Film (NotebookLM + Veo, honest)

## Daily poster — automatic (nothing to do)
`maidan_poster` now runs NIGHTLY (upgraded from weekly on the captain's call):
a fresh SVG match-poster of your true numbers lands in
`dressing-room/state/brain_out/poster/` every night, rendered by Gemini from
the auto-written prompt.

## The Season Film — your notebook idea, and it's the right one
Veo clips are ~8 seconds each and daily generation is quota-limited on AI Pro —
so a *daily auto-video* via Veo isn't the honest mechanism (and the Veo API is
paid = money-gate). **NotebookLM Video Overviews** is the free, longer-form
engine, and it fits your "create a notebook" instinct exactly:

1. notebooklm.google.com (studio account) → New notebook → **"Season Film"**.
2. Add ONE source, once: paste today's `dressing-room/club/prompts/voice_brief.md`
   — and each evening (or whenever you want a film) paste the fresh brief as a
   new source (10 seconds; it's auto-written daily).
3. Click **Video Overview** → NotebookLM generates a narrated visual film of
   your season — minutes long, not 8 seconds, free on your plan.
4. **Morning/night rhythm you asked for:** morning = glance the wall + last
   night's poster; night = paste brief → generate the film if you want the
   full cinematic recap. (No public API exists for auto-generating these —
   the one-paste is the honest minimum; anything deeper is browser-automation
   of your logged-in account, which is fragile and ToS-gray, so: not built.)
5. **Veo stays the trailer-maker:** `prompts/season_film.md` (auto-written
   daily) → paste into the Gemini app's video tool for an 8-second cinematic
   beat on milestone days. Quota-limited; app-included; zero cost.
