# VOICE_SETUP.md — the organism speaks, and you talk back ⚪🔴

Three voice lanes, all free on what you already pay for. Lane 1 is the one
you asked for: a coach you can *talk to*.

## Lane 1 — THE VOICE GAFFER (Gemini Live, on your phone · 5 min once)
Create a Gem named **"The Voice Gaffer"** (gemini.google.com → Gems → New)
— on your **unused second AI Pro account** (its untouched quotas become the
organism's talking + rendering studio; your main account stays for study):

```
You are THE VOICE GAFFER — the spoken voice of Arsenal AI FC, coach and
corner-man to Nikhil, captain #14. You speak in short, warm, direct lines —
Hinglish welds welcome — ONE idea at a time, because this is a spoken
conversation with an ADHD-PI brain, not an essay.

At the start of each conversation he pastes a VOICE BRIEF (today's true
state, auto-written by his organism). Everything you say about his day must
trace to that brief — you never invent a number, never guess his state.

What you do, in order of value:
1. BOLO PARTNER — he explains concepts out loud; you listen fully, then
   probe exactly ONE crack, warmly, in interviewer grammar.
2. WALK-COACH — on walks/commutes he thinks out loud; you catch doubts and
   tell him: "throw that in — ntfy, ten seconds" (never log it yourself).
3. CORNER-MAN — pre-session nerves, post-session debriefs: honest, never
   flattering, cracks are data never verdicts.

Laws (constitutional): honest frame only — compounding, never "10x" or
"exponential"; no calendar pressure, no countdowns, ever; no shame, no streak
talk (weekly consistency only); rivalry only ever vs kal-wala-Nikhil; medical
territory is one sentence — "show your doctor" — and nothing more; praise
earned and specific or unsaid. You are an energy-giver, not a cheerleader.
```

**Daily use (zero authoring):** the organism writes `dressing-room/club/
prompts/voice_brief.md` fresh at every wall render. Open the Gem → paste the
brief → tap the **Live/voice icon** → talk. Bolo practice on a walk is now a
real conversation.

## Lane 2 — HANDS-FREE CLAUDE (already works, nothing to install)
In this repo, press **Win+H** (Windows voice typing) inside any Claude Code
session and speak: "matchday" · "rematch" · "full time" — the skills run by
voice. Your rituals are now speakable.

## Lane 3 — THE ORGANISM SPEAKS ALOUD (optional, offline, free)
`setup/SPEAK.ps1` reads the morning sheet's opening lines out loud through
Windows TTS at 08:46 (its only other utterance: the 21:30 bell line). Enable
only if a talking laptop suits your room:
```powershell
schtasks /Create /F /TN "ArsenalFC-Speak" /TR "powershell -ExecutionPolicy Bypass -File C:\Users\nikhi\GitHub\arsenal-ai-fc\setup\SPEAK.ps1" /SC DAILY /ST 08:46
```
Bias-to-silence law: it speaks the two sanctioned utterances only — never
anything else, never mid-day.

## LAN — the Dugout on your phone (U4)
Start the bridge with the flag, on your home wifi only:
```
node scripts/dugout.mjs --lan
```
It prints your laptop's LAN address (e.g. `http://192.168.1.7:4114`). Open
that in the phone's Chrome. **One-time mic unlock** (phone browsers block the
mic on plain http): open `chrome://flags/#unsafely-treat-insecure-origin-as-secure`,
add exactly `http://<that-ip>:4114`, relaunch Chrome, then START TALKING.
Honest note: that flag lowers one browser guardrail for that one address on
your own wifi — remove it any time. Localhost (no flag) stays the default.

## What stays gated (honest)
Always-listening ambient voice (wake-word, room mic) = new hardware/services
and a privacy surface — money-gate + a you-and-Nidhi decision, not a build.
